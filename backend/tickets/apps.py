from django.apps import AppConfig


class TicketsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tickets"

    def ready(self):
        from django.db import connection

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(*) FROM tickets_category"
                )
                count = cursor.fetchone()[0]

            if count == 0:
                from .models import Category

                categories = [
                    "Authentication",
                    "Payment",
                    "Technical",
                    "Account",
                    "Billing",
                    "Orders",
                    "General",
                ]

                for name in categories:
                    Category.objects.get_or_create(name=name)

        except Exception:
            pass