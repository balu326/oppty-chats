import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Create a Django admin superuser if none exists"

    def handle(self, *args, **kwargs):
        username = os.getenv("DJANGO_ADMIN_USER", "admin")
        password = os.getenv("DJANGO_ADMIN_PASSWORD", "Admin@1234")
        email = os.getenv("DJANGO_ADMIN_EMAIL", "admin@oppty.com")

        if User.objects.filter(username=username).exists():
            self.stdout.write(f"Django admin '{username}' already exists, skipping.")
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(f"Django admin created: {username}")
