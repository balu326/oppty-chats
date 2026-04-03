from django.db import migrations, models
import django.db.models.deletion


def backfill_receivers(apps, schema_editor):
    Employee = apps.get_model("chatapp", "Employee")
    Message = apps.get_model("chatapp", "Message")

    for message in Message.objects.filter(receiver__isnull=True).iterator():
        chat_id = str(message.chat_id or "")
        if "_" not in chat_id:
            continue

        participants = [part for part in chat_id.split("_") if part]
        if len(participants) != 2:
            continue

        receiver_id = next((participant for participant in participants if str(participant) != str(message.sender_id)), None)
        if receiver_id is None:
            continue

        try:
            receiver = Employee.objects.get(pk=receiver_id)
        except Employee.DoesNotExist:
            continue

        message.receiver_id = receiver.pk
        message.save(update_fields=["receiver"])


class Migration(migrations.Migration):
    dependencies = [
        ("chatapp", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="receiver",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="received_messages",
                to="chatapp.employee",
            ),
        ),
        migrations.RunPython(backfill_receivers, migrations.RunPython.noop),
    ]
