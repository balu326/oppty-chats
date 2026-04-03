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
    group = models.ForeignKey(
        "ChatGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_employees",
    )
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


class ChatGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, default="")
    members = models.ManyToManyField(Employee, related_name="member_groups", blank=True)
    created_by = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="created_groups")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]


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
