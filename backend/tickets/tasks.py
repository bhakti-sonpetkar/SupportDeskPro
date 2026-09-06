from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from .models import Ticket, AuditLog
from django.core.mail import send_mail
from django.conf import settings




@shared_task
def test_celery_task():
    print("Celery task executed successfully!")
    return "Celery is working"


@shared_task
def send_ticket_created_email(ticket_id):
    try:
        ticket = Ticket.objects.select_related("customer").get(
            id=ticket_id
        )

        customer_email = ticket.customer.email

        if not customer_email:
            return "Customer has no email address."

        send_mail(
            subject=f"SupportDesk Pro - Ticket #{ticket.id} Created",
            message=(
                f"Hello {ticket.customer.username},\n\n"
                f"Your support ticket has been created successfully.\n\n"
                f"Ticket ID: #{ticket.id}\n"
                f"Title: {ticket.title}\n"
                f"Status: {ticket.status}\n\n"
                f"Thank you,\n"
                f"SupportDesk Pro"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[customer_email],
            fail_silently=False,
        )

        return f"Email sent to {customer_email}"

    except Ticket.DoesNotExist:
        return f"Ticket {ticket_id} does not exist."

@shared_task
def escalate_overdue_tickets():
    """
    Escalate OPEN and IN_PROGRESS tickets that have
    remained unresolved for more than 24 hours.
    """

    cutoff_time = timezone.now() - timedelta(hours=24)

    overdue_tickets = Ticket.objects.filter(
        status__in=[
            Ticket.Status.OPEN,
            Ticket.Status.IN_PROGRESS,
        ],
        created_at__lte=cutoff_time,
        escalated=False,
    )

    escalated_count = 0

    for ticket in overdue_tickets:
        ticket.escalated = True
        ticket.escalated_at = timezone.now()
        ticket.save(
            update_fields=[
                "escalated",
                "escalated_at",
                "updated_at",
            ]
        )

        AuditLog.objects.create(
            ticket=ticket,
            user=None,
            action=AuditLog.Action.UPDATED,
            description=(
                "Ticket automatically escalated because "
                "it remained unresolved for more than 24 hours."
            ),
        )

        escalated_count += 1

    return f"{escalated_count} ticket(s) escalated."