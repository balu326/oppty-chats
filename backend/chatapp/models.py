from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


class Employee(models.Model):
    ROLE_EMPLOYEE = "employee"
    ROLE_ADMIN = "admin"
    ROLE_SUPERADMIN = "superadmin"
    ROLE_CHOICES = [
        (ROLE_EMPLOYEE, "Employee"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_SUPERADMIN, "Super Admin"),
    ]

    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_EMPLOYEE)
    can_create_groups = models.BooleanField(default=False)
    group = models.ForeignKey(
        "ChatGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_employees",
    )
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    phone = models.CharField(max_length=30, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    otp_value = models.CharField(max_length=6, blank=True, default="")
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def compare_password(self, raw_password):
        return check_password(raw_password, self.password)

    def otp_is_valid(self, otp):
        return (
            self.otp_value == otp
            and self.otp_expires_at is not None
            and self.otp_expires_at > timezone.now()
        )

    def __str__(self):
        return f"{self.name} ({self.email})"


class ChatGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    members = models.ManyToManyField(Employee, related_name="member_groups", blank=True)
    created_by = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="created_groups")
    created_at = models.DateTimeField(auto_now_add=True)
    admins_only = models.BooleanField(default=False, help_text="Only admins can send messages in this group")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Meeting(models.Model):
    title = models.CharField(max_length=255)
    meet_link = models.CharField(max_length=500)
    scheduled_at = models.DateTimeField()
    created_by = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="meetings")
    invitees = models.ManyToManyField(Employee, related_name="invited_meetings", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.title} @ {self.scheduled_at}"


class Message(models.Model):
    ATTACHMENT_PHOTO = "photo"
    ATTACHMENT_VIDEO = "video"
    ATTACHMENT_DOCUMENT = "document"
    ATTACHMENT_LINK = "link"
    ATTACHMENT_CHOICES = [
        (ATTACHMENT_PHOTO, "Photo"),
        (ATTACHMENT_VIDEO, "Video"),
        (ATTACHMENT_DOCUMENT, "Document"),
        (ATTACHMENT_LINK, "Link"),
    ]

    chat_id = models.CharField(max_length=255, db_index=True)
    sender = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="messages")
    receiver = models.ForeignKey(
        Employee,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="received_messages",
    )
    text = models.TextField(blank=True, default="")
    attachment_type = models.CharField(max_length=20, choices=ATTACHMENT_CHOICES, blank=True, default="")
    attachment_url = models.CharField(max_length=500, blank=True, default="")
    attachment_file_name = models.CharField(max_length=255, blank=True, default="")
    attachment_file_size = models.PositiveIntegerField(null=True, blank=True)
    attachment_mime_type = models.CharField(max_length=150, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["chat_id", "created_at"]),
        ]

    @property
    def content(self):
        return self.text

    @property
    def timestamp(self):
        return self.created_at

    def __str__(self):
        chat_label = self.chat_id
        if chat_label.startswith("dm_"):
            chat_label = chat_label.replace("dm_", "DM:", 1)
        if self.receiver:
            return f"{self.sender.name} -> {self.receiver.name}: {self.text[:40]}"
        return f"{self.sender.name} -> Group ({chat_label}): {self.text[:40]}"
