from django.db import migrations


def migrate_dm_chat_ids(apps, schema_editor):
    Message = apps.get_model("chatapp", "Message")

    for message in Message.objects.all().iterator():
        chat_id = str(message.chat_id or "")
        if chat_id.startswith("dm_") or "_" not in chat_id:
            continue

        participants = [part for part in chat_id.split("_") if part]
        if len(participants) != 2:
            continue

        message.chat_id = f"dm_{'_'.join(sorted(participants))}"
        message.save(update_fields=["chat_id"])


class Migration(migrations.Migration):
    dependencies = [
        ("chatapp", "0002_message_receiver"),
    ]

    operations = [
        migrations.RunPython(migrate_dm_chat_ids, migrations.RunPython.noop),
    ]
