from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chatapp", "0004_employee_can_create_groups"),
    ]

    operations = [
        migrations.AddField(
            model_name="chatgroup",
            name="admins_only",
            field=models.BooleanField(
                default=False,
                help_text="Only admins can send messages in this group",
            ),
        ),
    ]
