from django.conf import settings
from django.db import models


class Category(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True
    )

    description = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class Tag(models.Model):

    name = models.CharField(
        max_length=50,
        unique=True
    )

    def __str__(self):
        return self.name


class Ticket(models.Model):

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"

    title = models.CharField(
        max_length=200
    )

    description = models.TextField()

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_tickets"
    )

    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets"
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets"
    )

    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name="tickets"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    # =========================
    # Escalation
    # =========================

    escalated = models.BooleanField(
        default=False
    )

    escalated_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return self.title


class TicketComment(models.Model):

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="comments"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ticket_comments"
    )

    message = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f"Comment by {self.user.username} "
            f"on Ticket #{self.ticket.id}"
        )


class AuditLog(models.Model):

    class Action(models.TextChoices):
        CREATED = "CREATED", "Created"
        UPDATED = "UPDATED", "Updated"
        STATUS_CHANGED = "STATUS_CHANGED", "Status Changed"
        ASSIGNED = "ASSIGNED", "Assigned"
        COMMENTED = "COMMENTED", "Commented"
        ATTACHMENT_ADDED = "ATTACHMENT_ADDED", "Attachment Added"

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="audit_logs"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs"
    )

    action = models.CharField(
        max_length=30,
        choices=Action.choices
    )

    description = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.ticket.title} - {self.action}"


class TicketAttachment(models.Model):

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="attachments"
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ticket_attachments"
    )

    file = models.FileField(
        upload_to="ticket_attachments/"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.ticket.id} - {self.file.name}"