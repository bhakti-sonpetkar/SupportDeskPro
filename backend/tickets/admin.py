from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "priority",
        "status",
        "customer",
        "assigned_agent",
        "created_at",
    )

    list_filter = (
        "priority",
        "status",
    )

    search_fields = (
        "title",
        "description",
        "customer__username",
        "assigned_agent__username",
    )