from rest_framework import serializers

from .models import (
    Ticket,
    TicketComment,
    AuditLog,
    TicketAttachment,
    Category,
)


class TicketSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.username",
        read_only=True
    )

    agent_name = serializers.CharField(
        source="assigned_agent.username",
        read_only=True
    )

    # Accept category name from frontend
    category = serializers.CharField(
        source="category.name"
    )

    class Meta:
        model = Ticket

        fields = [
            "id",
            "title",
            "description",
            "priority",
            "status",
            "customer",
            "customer_name",
            "assigned_agent",
            "agent_name",
            "category",
            "tags",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "customer",
            "customer_name",
            "agent_name",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        category_name = validated_data.pop("category", None)

        category = None

        if category_name:
            category, _ = Category.objects.get_or_create(
                name=category_name
            )

        return Ticket.objects.create(
            category=category,
            **validated_data
        )


class TicketCommentSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = TicketComment

        fields = [
            "id",
            "ticket",
            "user",
            "user_name",
            "message",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "ticket",
            "user",
            "user_name",
            "created_at",
            "updated_at",
        ]


class AuditLogSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = AuditLog

        fields = [
            "id",
            "ticket",
            "user",
            "user_name",
            "action",
            "description",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "ticket",
            "user",
            "user_name",
            "created_at",
        ]


class TicketAttachmentSerializer(serializers.ModelSerializer):

    uploaded_by_name = serializers.CharField(
        source="uploaded_by.username",
        read_only=True
    )

    file = serializers.FileField(
        required=True
    )

    class Meta:
        model = TicketAttachment

        fields = [
            "id",
            "ticket",
            "uploaded_by",
            "uploaded_by_name",
            "file",
            "uploaded_at",
        ]

        read_only_fields = [
            "id",
            "ticket",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
        ]