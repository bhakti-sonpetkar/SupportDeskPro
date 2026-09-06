import os

from celery import Celery


# Set Django settings module
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings"
)


# Create Celery application
app = Celery(
    "config"
)


# Read configuration from Django settings
app.config_from_object(
    "django.conf:settings",
    namespace="CELERY"
)


# Automatically discover tasks.py
# inside installed Django apps
app.autodiscover_tasks()