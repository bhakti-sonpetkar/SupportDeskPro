from django.urls import path

from .views import (
    TicketListCreateView,
    TicketDetailView,
    TicketCommentListCreateView,
    AuditLogListView,
    TicketAttachmentListCreateView,
    AgentDashboardStatsView,
)


urlpatterns = [

    path(
        "",
        TicketListCreateView.as_view(),
        name="ticket-list-create"
    ),
    path(
    "dashboard/stats/",
    AgentDashboardStatsView.as_view(),
    name="agent-dashboard-stats"
),

    path(
        "<int:pk>/",
        TicketDetailView.as_view(),
        name="ticket-detail"
    ),

    path(
        "<int:ticket_id>/comments/",
        TicketCommentListCreateView.as_view(),
        name="ticket-comments"
    ),

    path(
        "<int:ticket_id>/audit-logs/",
        AuditLogListView.as_view(),
        name="ticket-audit-logs"
    ),

    path(
        "<int:ticket_id>/attachments/",
        TicketAttachmentListCreateView.as_view(),
        name="ticket-attachments"
    ),
]