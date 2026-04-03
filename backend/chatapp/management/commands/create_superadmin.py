import os
from django.core.management.base import BaseCommand
from chatapp.models import Employee


class Command(BaseCommand):
    help = "Create a default superadmin if none exists"

    def handle(self, *args, **kwargs):
        email = os.getenv("SUPERADMIN_EMAIL", "admin@oppty.com")
        password = os.getenv("SUPERADMIN_PASSWORD", "Admin@1234")
        name = os.getenv("SUPERADMIN_NAME", "Super Admin")

        if Employee.objects.filter(role="superadmin").exists():
            self.stdout.write("Superadmin already exists, skipping.")
            return

        e = Employee(email=email, name=name, role="superadmin", can_create_groups=True)
        e.set_password(password)
        e.save()
        self.stdout.write(f"Superadmin created: {email}")
