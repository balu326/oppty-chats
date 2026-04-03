from django.db import migrations, models


def grant_group_access_to_admin_roles(apps, schema_editor):
    Employee = apps.get_model("chatapp", "Employee")
    Employee.objects.filter(role__in=["admin", "superadmin"]).update(can_create_groups=True)


class Migration(migrations.Migration):
    dependencies = [
        ("chatapp", "0003_readable_chat_ids"),
    ]

    operations = [
        migrations.AddField(
            model_name="employee",
            name="can_create_groups",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(grant_group_access_to_admin_roles, migrations.RunPython.noop),
    ]
