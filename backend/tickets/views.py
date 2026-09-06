from django.shortcuts import get_object_or_404
from django.core.cache import cache

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count, Q
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from drf_spectacular.utils import extend_schema

from .models import (
    Ticket,
    TicketComment,
    AuditLog,
    TicketAttachment,
)

from .serializers import (
    TicketSerializer,
    TicketCommentSerializer,
    AuditLogSerializer,
    TicketAttachmentSerializer,
)

from .services import assign_ticket_to_agent
from .tasks import send_ticket_created_email


# =========================================================
# REDIS CACHE HELPERS
# =========================================================

def get_ticket_cache_version(user_id):
    """
    Get the current cache version for a user's ticket list.

    If no version exists, start with version 1.
    """

    version_key = f"tickets_cache_version_user_{user_id}"

    version = cache.get(version_key)

    if version is None:
        version = 1

        cache.set(
            version_key,
            version,
            timeout=None
        )

    return version


def invalidate_ticket_list_cache(user_id=None):
    """
    Invalidate ticket-list cache.

    Instead of deleting Redis keys using delete_pattern(),
    increase the cache version.

    This works with Django's built-in RedisCache.
    """

    if user_id is not None:

        version_key = (
            f"tickets_cache_version_user_{user_id}"
        )

        current_version = cache.get(version_key)

        if current_version is None:
            current_version = 1

        cache.set(
            version_key,
            current_version + 1,
            timeout=None
        )

    else:

        # Invalidate caches for all users related to tickets.

        user_ids = set()

        for ticket in Ticket.objects.select_related(
            "customer",
            "assigned_agent"
        ).all():

            if ticket.customer_id:
                user_ids.add(ticket.customer_id)

            if ticket.assigned_agent_id:
                user_ids.add(ticket.assigned_agent_id)

        for user_id in user_ids:

            version_key = (
                f"tickets_cache_version_user_{user_id}"
            )

            current_version = cache.get(version_key)

            if current_version is None:
                current_version = 1

            cache.set(
                version_key,
                current_version + 1,
                timeout=None
            )


# =========================================================
# TICKET LIST + CREATE
# =========================================================

class TicketListCreateView(generics.ListCreateAPIView):

    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "priority",
        "category",
        "assigned_agent",
    ]

    search_fields = [
        "title",
        "description",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "priority",
        "status",
    ]

    ordering = [
        "-created_at"
    ]

    def get_queryset(self):

        user = self.request.user

        # ADMIN → All tickets
        if user.role == "ADMIN":

            return Ticket.objects.all()

        # AGENT → Assigned tickets
        if user.role == "AGENT":

            return Ticket.objects.filter(
                assigned_agent=user
            )

        # CUSTOMER → Own tickets
        return Ticket.objects.filter(
            customer=user
        )

    # =====================================================
    # REDIS CACHE
    # =====================================================

    def list(self, request, *args, **kwargs):

        user = request.user

        # Get current cache version
        cache_version = get_ticket_cache_version(
            user.id
        )

        # Unique cache key
        cache_key = (
            f"tickets_list_user_{user.id}_"
            f"v{cache_version}_"
            f"{request.get_full_path()}"
        )

        # -------------------------------------------------
        # CACHE HIT
        # -------------------------------------------------

        cached_response = cache.get(cache_key)

        if cached_response is not None:

            return Response(cached_response)

        # -------------------------------------------------
        # CACHE MISS
        # -------------------------------------------------

        queryset = self.filter_queryset(
            self.get_queryset()
        )

        page = self.paginate_queryset(queryset)

        if page is not None:

            serializer = self.get_serializer(
                page,
                many=True
            )

            response = self.get_paginated_response(
                serializer.data
            )

            cache.set(
                cache_key,
                response.data,
                timeout=60
            )

            return response

        serializer = self.get_serializer(
            queryset,
            many=True
        )

        data = serializer.data

        cache.set(
            cache_key,
            data,
            timeout=60
        )

        return Response(data)

    # =====================================================
    # CREATE TICKET
    # =====================================================

    def perform_create(self, serializer):

        # Create ticket
        ticket = serializer.save(
            customer=self.request.user
        )

        # -------------------------------------------------
        # CELERY → SEND EMAIL IN BACKGROUND
        # -------------------------------------------------

        send_ticket_created_email.delay(
            ticket.id
        )

        # -------------------------------------------------
        # Invalidate customer's ticket cache
        # -------------------------------------------------

        invalidate_ticket_list_cache(
            self.request.user.id
        )

        # -------------------------------------------------
        # Audit log → Ticket created
        # -------------------------------------------------

        AuditLog.objects.create(
            ticket=ticket,
            user=self.request.user,
            action=AuditLog.Action.CREATED,
            description="Ticket created."
        )

        # -------------------------------------------------
        # Automatic agent assignment
        # -------------------------------------------------

        assign_ticket_to_agent(ticket)

        # -------------------------------------------------
        # Audit log → Agent assigned
        # -------------------------------------------------

        if ticket.assigned_agent:

            invalidate_ticket_list_cache(
                ticket.assigned_agent.id
            )

            AuditLog.objects.create(
                ticket=ticket,
                user=self.request.user,
                action=AuditLog.Action.ASSIGNED,
                description=(
                    f"Ticket assigned to "
                    f"{ticket.assigned_agent.username}."
                )
            )

        # -------------------------------------------------
        # Invalidate all relevant user caches
        # -------------------------------------------------

        invalidate_ticket_list_cache()


# =========================================================
# DASHBOARD STATISTICS
# =========================================================

class AgentDashboardStatsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        # =================================================
        # AGENT → Assigned tickets
        # =================================================

        if user.role == "AGENT":

            tickets = Ticket.objects.filter(
                assigned_agent=user
            )

        # =================================================
        # CUSTOMER → Own tickets
        # =================================================

        elif user.role == "CUSTOMER":

            tickets = Ticket.objects.filter(
                customer=user
            )

        # =================================================
        # ADMIN → All tickets
        # =================================================

        elif user.role == "ADMIN":

            tickets = Ticket.objects.all()

        # =================================================
        # UNKNOWN ROLE
        # =================================================

        else:

            raise PermissionDenied(
                "You do not have permission to access dashboard statistics."
            )

        # =================================================
        # CALCULATE STATISTICS
        # =================================================

        stats = tickets.aggregate(

            total=Count("id"),

            open=Count(
                "id",
                filter=Q(
                    status=Ticket.Status.OPEN
                )
            ),

            in_progress=Count(
                "id",
                filter=Q(
                    status=Ticket.Status.IN_PROGRESS
                )
            ),

            resolved=Count(
                "id",
                filter=Q(
                    status=Ticket.Status.RESOLVED
                )
            ),

            closed=Count(
                "id",
                filter=Q(
                    status=Ticket.Status.CLOSED
                )
            ),
        )

        # =================================================
        # RESPONSE
        # =================================================

        return Response({

            "total": stats["total"],

            "open": stats["open"],

            "in_progress": stats["in_progress"],

            "resolved": stats["resolved"],

            "closed": stats["closed"],

            "resolved_or_closed": (
                stats["resolved"] +
                stats["closed"]
            ),

        })


# =========================================================
# TICKET DETAIL + UPDATE
# =========================================================

class TicketDetailView(
    generics.RetrieveUpdateAPIView
):

    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        # ADMIN → All tickets
        if user.role == "ADMIN":

            return Ticket.objects.all()

        # AGENT → Assigned tickets
        if user.role == "AGENT":

            return Ticket.objects.filter(
                assigned_agent=user
            )

        # CUSTOMER → Own tickets
        return Ticket.objects.filter(
            customer=user
        )

    def perform_update(self, serializer):

        user = self.request.user
        ticket = self.get_object()

        changed_fields = set(
            serializer.validated_data.keys()
        )

        # =================================================
        # CUSTOMER PERMISSION
        # =================================================

        if user.role == "CUSTOMER":

            allowed_fields = {
                "title",
                "description",
            }

            if not changed_fields.issubset(
                allowed_fields
            ):

                raise PermissionDenied(
                    "Customers can only update title and description."
                )

        # =================================================
        # STATUS WORKFLOW
        # =================================================

        old_status = ticket.status

        if "status" in changed_fields:

            current_status = ticket.status

            new_status = (
                serializer.validated_data["status"]
            )

            allowed_transitions = {

                Ticket.Status.OPEN: [
                    Ticket.Status.IN_PROGRESS
                ],

                Ticket.Status.IN_PROGRESS: [
                    Ticket.Status.RESOLVED
                ],

                Ticket.Status.RESOLVED: [
                    Ticket.Status.CLOSED
                ],

                Ticket.Status.CLOSED: [],
            }

            if (
                new_status != current_status
                and new_status not in
                allowed_transitions.get(
                    current_status,
                    []
                )
            ):

                raise ValidationError({
                    "status": [
                        f"Invalid status transition: "
                        f"{current_status} → {new_status}"
                    ]
                })

        # =================================================
        # SAVE UPDATE
        # =================================================

        updated_ticket = serializer.save()

        # =================================================
        # REDIS CACHE INVALIDATION
        # =================================================

        # Customer cache
        if ticket.customer_id:

            invalidate_ticket_list_cache(
                ticket.customer_id
            )

        # Assigned agent cache
        if ticket.assigned_agent_id:

            invalidate_ticket_list_cache(
                ticket.assigned_agent_id
            )

        # Admin / relevant caches
        invalidate_ticket_list_cache()

        # =================================================
        # STATUS CHANGE AUDIT LOG
        # =================================================

        if "status" in changed_fields:

            new_status = updated_ticket.status

            if old_status != new_status:

                AuditLog.objects.create(
                    ticket=updated_ticket,
                    user=user,
                    action=AuditLog.Action.STATUS_CHANGED,
                    description=(
                        f"Status changed from "
                        f"{old_status} to {new_status}."
                    )
                )


# =========================================================
# TICKET COMMENTS
# =========================================================

class TicketCommentListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = TicketCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_ticket(self):

        return get_object_or_404(
            Ticket,
            pk=self.kwargs["ticket_id"]
        )

    def get_queryset(self):

        ticket = self.get_ticket()
        user = self.request.user

        # ADMIN
        if user.role == "ADMIN":

            return TicketComment.objects.filter(
                ticket=ticket
            )

        # CUSTOMER
        if user.role == "CUSTOMER":

            if ticket.customer != user:

                raise PermissionDenied(
                    "You can only access comments on your own tickets."
                )

        # AGENT
        if user.role == "AGENT":

            if ticket.assigned_agent != user:

                raise PermissionDenied(
                    "You can only access comments on your assigned tickets."
                )

        return TicketComment.objects.filter(
            ticket=ticket
        )

    def perform_create(self, serializer):

        ticket = self.get_ticket()
        user = self.request.user

        # CUSTOMER permission
        if user.role == "CUSTOMER":

            if ticket.customer != user:

                raise PermissionDenied(
                    "You can only comment on your own tickets."
                )

        # AGENT permission
        if user.role == "AGENT":

            if ticket.assigned_agent != user:

                raise PermissionDenied(
                    "You can only comment on your assigned tickets."
                )

        # Save comment
        serializer.save(
            ticket=ticket,
            user=user
        )

        # Audit log → Comment added
        AuditLog.objects.create(
            ticket=ticket,
            user=user,
            action=AuditLog.Action.COMMENTED,
            description=(
                f"{user.username} added a comment."
            )
        )


# =========================================================
# AUDIT LOGS
# =========================================================

class AuditLogListView(
    generics.ListAPIView
):

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        ticket = get_object_or_404(
            Ticket,
            pk=self.kwargs["ticket_id"]
        )

        user = self.request.user

        # ADMIN
        if user.role == "ADMIN":

            return AuditLog.objects.filter(
                ticket=ticket
            ).order_by("created_at")

        # CUSTOMER
        if user.role == "CUSTOMER":

            if ticket.customer != user:

                raise PermissionDenied(
                    "You can only access audit logs of your own tickets."
                )

        # AGENT
        if user.role == "AGENT":

            if ticket.assigned_agent != user:

                raise PermissionDenied(
                    "You can only access audit logs of your assigned tickets."
                )

        return AuditLog.objects.filter(
            ticket=ticket
        ).order_by("created_at")


# =========================================================
# TICKET ATTACHMENTS
# =========================================================

@extend_schema(
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "file": {
                    "type": "string",
                    "format": "binary",
                }
            },
            "required": ["file"],
        }
    }
)
class TicketAttachmentListCreateView(
    generics.ListCreateAPIView
):

    serializer_class = TicketAttachmentSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_ticket(self):

        return get_object_or_404(
            Ticket,
            pk=self.kwargs["ticket_id"]
        )

    def get_queryset(self):

        ticket = self.get_ticket()
        user = self.request.user

        # ADMIN
        if user.role == "ADMIN":

            return TicketAttachment.objects.filter(
                ticket=ticket
            ).order_by("-uploaded_at")

        # CUSTOMER
        if user.role == "CUSTOMER":

            if ticket.customer != user:

                raise PermissionDenied(
                    "You can only access attachments of your own tickets."
                )

        # AGENT
        if user.role == "AGENT":

            if ticket.assigned_agent != user:

                raise PermissionDenied(
                    "You can only access attachments of your assigned tickets."
                )

        return TicketAttachment.objects.filter(
            ticket=ticket
        ).order_by("-uploaded_at")

    def perform_create(self, serializer):

        ticket = self.get_ticket()
        user = self.request.user

        # CUSTOMER permission
        if user.role == "CUSTOMER":

            if ticket.customer != user:

                raise PermissionDenied(
                    "You can only upload files to your own tickets."
                )

        # AGENT permission
        if user.role == "AGENT":

            if ticket.assigned_agent != user:

                raise PermissionDenied(
                    "You can only upload files to your assigned tickets."
                )

        serializer.save(
            ticket=ticket,
            uploaded_by=user
        )

        # Attachment does not change ticket-list data,
        # so no ticket-list cache invalidation is required.