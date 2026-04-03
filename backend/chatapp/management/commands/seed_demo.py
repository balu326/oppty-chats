from django.core.management.base import BaseCommand

from chatapp.models import ChatGroup, Employee


SEED_USERS = [
    ("employee@oppty.com", "123456", "Employee One", Employee.ROLE_EMPLOYEE),
    ("admin@oppty.com", "admin123", "Admin User", Employee.ROLE_ADMIN),
    ("superadmin@oppty.com", "superadmin123", "Super Admin", Employee.ROLE_SUPERADMIN),
    ("maya@oppty.com", "maya123", "Maya", Employee.ROLE_EMPLOYEE),
    ("jason@oppty.com", "jason123", "Jason", Employee.ROLE_EMPLOYEE),
]


class Command(BaseCommand):
    help = "Seeds demo employees and a default group for local testing."

    def handle(self, *args, **options):
        created = 0
        employees = {}
        for email, password, name, role in SEED_USERS:
            employee, was_created = Employee.objects.get_or_create(
                email=email,
                defaults={"name": name, "role": role},
            )
            employee.name = name
            employee.role = role
            employee.set_password(password)
            employee.save()
            employees[email] = employee
            created += int(was_created)

        superadmin = employees["superadmin@oppty.com"]
        group, _ = ChatGroup.objects.get_or_create(
            name="Oppty Team",
            defaults={"description": "Official team discussion group.", "created_by": superadmin},
        )
        group.created_by = superadmin
        group.description = "Official team discussion group."
        group.save()
        group.members.set(
            [
                employees["employee@oppty.com"],
                employees["maya@oppty.com"],
                employees["jason@oppty.com"],
            ]
        )
        for member in group.members.all():
            member.group = group
            member.save(update_fields=["group"])

        self.stdout.write(self.style.SUCCESS(f"Seeded demo data. New employees created: {created}"))
