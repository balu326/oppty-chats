from django.core.management.base import BaseCommand

from chatapp.models import ChatGroup, Employee


SEED_USERS = [
    ("admin@oppty.com",        "admin",       "Admin",          Employee.ROLE_ADMIN),
    ("employee@oppty.com",     "employee",    "Employee",       Employee.ROLE_EMPLOYEE),
    ("employeejason@oppty.com","employee",    "Jason",          Employee.ROLE_EMPLOYEE),
    ("employeemaya@oppty.com", "employee",    "Maya",           Employee.ROLE_EMPLOYEE),
    ("superadmin@oppty.com",   "superadmin",  "Super Admin",    Employee.ROLE_SUPERADMIN),
]


class Command(BaseCommand):
    help = "Seeds demo employees and a default group."

    def handle(self, *args, **options):
        created = 0
        employees = {}
        for email, password, name, role in SEED_USERS:
            emp, was_created = Employee.objects.get_or_create(
                email=email,
                defaults={"name": name, "role": role},
            )
            emp.name = name
            emp.role = role
            emp.set_password(password)
            emp.save()
            employees[email] = emp
            created += int(was_created)
            self.stdout.write(f"  {'Created' if was_created else 'Updated'}: {email} / {password}")

        superadmin = employees["superadmin@oppty.com"]
        group, _ = ChatGroup.objects.get_or_create(
            name="Oppty Team",
            defaults={"description": "Official team discussion group.", "created_by": superadmin},
        )
        group.created_by = superadmin
        group.description = "Official team discussion group."
        group.save()
        group.members.set([
            employees["employee@oppty.com"],
            employees["employeejason@oppty.com"],
            employees["employeemaya@oppty.com"],
        ])

        self.stdout.write(self.style.SUCCESS(f"\nDone. {created} new employee(s) created."))
