from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ChatGroup",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
                ("description", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Employee",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("password", models.CharField(max_length=128)),
                ("name", models.CharField(max_length=255)),
                ("role", models.CharField(choices=[("employee", "Employee"), ("admin", "Admin"), ("superadmin", "Super Admin")], default="employee", max_length=20)),
                ("otp_value", models.CharField(blank=True, default="", max_length=6)),
                ("otp_expires_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("group", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_employees", to="chatapp.chatgroup")),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="chatgroup",
            name="created_by",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="created_groups", to="chatapp.employee"),
        ),
        migrations.AddField(
            model_name="chatgroup",
            name="members",
            field=models.ManyToManyField(blank=True, related_name="member_groups", to="chatapp.employee"),
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("chat_id", models.CharField(db_index=True, max_length=255)),
                ("text", models.TextField(blank=True, default="")),
                ("attachment_type", models.CharField(blank=True, choices=[("photo", "Photo"), ("video", "Video"), ("document", "Document"), ("link", "Link")], default="", max_length=20)),
                ("attachment_url", models.CharField(blank=True, default="", max_length=500)),
                ("attachment_file_name", models.CharField(blank=True, default="", max_length=255)),
                ("attachment_file_size", models.PositiveIntegerField(blank=True, null=True)),
                ("attachment_mime_type", models.CharField(blank=True, default="", max_length=150)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="chatapp.employee")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["chat_id", "created_at"], name="chatapp_mes_chat_id_6ebbe1_idx"),
        ),
    ]
