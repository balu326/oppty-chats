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
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
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
    admins_only = models.BooleanField(default=False)

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
        Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name="received_messages",
    )
    text = models.TextField(blank=True, default="")
    is_read = models.BooleanField(default=False)
    attachment_type = models.CharField(max_length=20, choices=ATTACHMENT_CHOICES, blank=True, default="")
    attachment_url = models.CharField(max_length=500, blank=True, default="")
    attachment_file_name = models.CharField(max_length=255, blank=True, default="")
    attachment_file_size = models.PositiveIntegerField(null=True, blank=True)
    attachment_mime_type = models.CharField(max_length=150, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["chat_id", "created_at"])]

    @property
    def content(self):
        return self.text

    @property
    def timestamp(self):
        return self.created_at

    def __str__(self):
        if self.receiver:
            return f"{self.sender.name} -> {self.receiver.name}: {self.text[:40]}"
        return f"{self.sender.name} -> Group ({self.chat_id}): {self.text[:40]}"


class Notification(models.Model):
    TYPE_MESSAGE = "message"
    TYPE_MENTION = "mention"
    TYPE_GROUP = "group"
    TYPE_SYSTEM = "system"
    TYPE_CHOICES = [
        (TYPE_MESSAGE, "Message"),
        (TYPE_MENTION, "Mention"),
        (TYPE_GROUP, "Group"),
        (TYPE_SYSTEM, "System"),
    ]

    recipient = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="notifications")
    sender = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name="sent_notifications")
    notif_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_MESSAGE)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True, default="")
    chat_id = models.CharField(max_length=255, blank=True, default="")
    message_id = models.CharField(max_length=255, blank=True, default="")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read", "created_at"])]

    def __str__(self):
        return f"Notif → {self.recipient.name}: {self.title}"


class Bookmark(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="bookmarks")
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="bookmarks")
    note = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("employee", "message")]

    def __str__(self):
        return f"{self.employee.name} bookmarked msg {self.message.id}"
