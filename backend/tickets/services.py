from django.contrib.auth import get_user_model
from django.db.models import Count

from .models import Ticket


User = get_user_model()


def assign_ticket_to_agent(ticket):
    """
    Assign the ticket to the active agent
    with the lowest number of assigned tickets.
    """

    agent = (
        User.objects
        .filter(
            role=User.Role.AGENT,
            is_active=True
        )
        .annotate(
            ticket_count=Count("assigned_tickets")
        )
        .order_by("ticket_count", "id")
        .first()
    )

    if agent:
        ticket.assigned_agent = agent
        ticket.save(update_fields=["assigned_agent"])

    return agent