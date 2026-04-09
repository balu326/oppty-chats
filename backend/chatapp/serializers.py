from rest_framework import serializers

from .models import ChatGroup, Employee, Meeting, Message


def _avatar_url(obj, request=None):
    """Return avatar URL — always https in production."""
    if not obj.avatar:
        return None
    try:
        url = obj.avatar.url
        if url.startswith("http"):
            # Force https — Render proxies HTTP internally but serves HTTPS externally
            return url.replace("http://", "https://", 1)
        if request:
            return request.build_absolute_uri(url).replace("http://", "https://", 1)
        return url
    except Exception:
        return None


class GroupSummarySerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = ChatGroup
        fields = ["_id", "name", "description", "createdAt"]


class EmployeeSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    group = GroupSummarySerializer(read_only=True)
    canCreateGroups = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()
    isOnline = serializers.BooleanField(source="is_online", read_only=True)

    class Meta:
        model = Employee
        fields = ["_id", "email", "name", "role", "canCreateGroups", "avatarUrl", "isOnline", "group", "createdAt"]

    def get_canCreateGroups(self, obj):
        return obj.role in {Employee.ROLE_ADMIN, Employee.ROLE_SUPERADMIN} or obj.can_create_groups

    def get_avatarUrl(self, obj):
        return _avatar_url(obj, self.context.get("request"))


class EmployeeLoginSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    canCreateGroups = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ["id", "email", "name", "role", "canCreateGroups", "avatarUrl", "phone", "bio"]

    def get_canCreateGroups(self, obj):
        return obj.role in {Employee.ROLE_ADMIN, Employee.ROLE_SUPERADMIN} or obj.can_create_groups

    def get_avatarUrl(self, obj):
        return _avatar_url(obj, self.context.get("request"))


class GroupMemberSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)

    class Meta:
        model = Employee
        fields = ["_id", "name", "email", "role"]


class GroupSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    createdBy = GroupMemberSerializer(source="created_by", read_only=True)
    members = GroupMemberSerializer(many=True, read_only=True)
    canManage = serializers.SerializerMethodField()
    adminsOnly = serializers.BooleanField(source="admins_only", read_only=True)

    class Meta:
        model = ChatGroup
        fields = ["_id", "name", "description", "createdBy", "members", "createdAt", "canManage", "adminsOnly"]

    def get_canManage(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return user.role == Employee.ROLE_SUPERADMIN


class MessageSenderSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)
    avatarUrl = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ["_id", "name", "email", "role", "avatarUrl"]

    def get_avatarUrl(self, obj):
        return _avatar_url(obj, self.context.get("request"))


class MessageSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)
    chatId = serializers.CharField(source="chat_id", read_only=True)
    sender = MessageSenderSerializer(read_only=True)
    receiver = MessageSenderSerializer(read_only=True)
    content = serializers.CharField(source="text", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)
    attachment = serializers.SerializerMethodField()
    isRead = serializers.BooleanField(source="is_read", read_only=True)

    class Meta:
        model = Message
        fields = [
            "_id", "chatId", "sender", "receiver",
            "text", "content", "attachment", "isRead", "createdAt", "timestamp",
        ]

    def get_attachment(self, obj):
        if not obj.attachment_type:
            return None
        url = obj.attachment_url or ""
        if url.startswith("http://"):
            url = url.replace("http://", "https://", 1)
        return {
            "type": obj.attachment_type,
            "url": url,
            "fileName": obj.attachment_file_name,
            "fileSize": obj.attachment_file_size,
            "mimeType": obj.attachment_mime_type,
        }


class MeetingSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    createdBy = serializers.SerializerMethodField()
    invitees = serializers.SerializerMethodField()
    scheduledAt = serializers.DateTimeField(source="scheduled_at")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Meeting
        fields = ["id", "title", "meet_link", "scheduledAt", "createdBy", "invitees", "createdAt"]

    def get_createdBy(self, obj):
        return {"id": str(obj.created_by.pk), "name": obj.created_by.name, "email": obj.created_by.email}

    def get_invitees(self, obj):
        return [{"id": str(e.pk), "name": e.name, "email": e.email} for e in obj.invitees.all()]


class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    senderName = serializers.CharField(source="sender.name", read_only=True, default="")
    senderAvatar = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    isRead = serializers.BooleanField(source="is_read", read_only=True)
    type = serializers.CharField(source="notif_type", read_only=True)
    chatId = serializers.CharField(source="chat_id", read_only=True)
    messageId = serializers.CharField(source="message_id", read_only=True)

    class Meta:
        model = __import__("chatapp.models", fromlist=["Notification"]).Notification
        fields = ["id", "type", "title", "body", "chatId", "messageId",
                  "isRead", "senderName", "senderAvatar", "createdAt"]

    def get_senderAvatar(self, obj):
        return _avatar_url(obj.sender, self.context.get("request")) if obj.sender else None


class BookmarkSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    messageId = serializers.CharField(source="message.pk", read_only=True)
    chatId = serializers.CharField(source="message.chat_id", read_only=True)
    text = serializers.CharField(source="message.text", read_only=True)
    senderName = serializers.CharField(source="message.sender.name", read_only=True)
    senderAvatar = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    messageCreatedAt = serializers.DateTimeField(source="message.created_at", read_only=True)
    note = serializers.CharField(read_only=True)
    attachment = serializers.SerializerMethodField()

    class Meta:
        model = __import__("chatapp.models", fromlist=["Bookmark"]).Bookmark
        fields = ["id", "messageId", "chatId", "text", "senderName", "senderAvatar",
                  "note", "attachment", "createdAt", "messageCreatedAt"]

    def get_senderAvatar(self, obj):
        return _avatar_url(obj.message.sender, self.context.get("request"))

    def get_attachment(self, obj):
        msg = obj.message
        if not msg.attachment_type:
            return None
        return {
            "type": msg.attachment_type,
            "url": msg.attachment_url,
            "fileName": msg.attachment_file_name,
        }
