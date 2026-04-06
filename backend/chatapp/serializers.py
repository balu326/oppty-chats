from rest_framework import serializers

from .models import ChatGroup, Employee, Meeting, Message


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

    class Meta:
        model = Employee
        fields = ["_id", "email", "name", "role", "canCreateGroups", "avatarUrl", "group", "createdAt"]

    def get_canCreateGroups(self, obj):
        return obj.role in {Employee.ROLE_ADMIN, Employee.ROLE_SUPERADMIN} or obj.can_create_groups

    def get_avatarUrl(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        if obj.avatar:
            return obj.avatar.url
        return None


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
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        if obj.avatar:
            return obj.avatar.url
        return None


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
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        if obj.avatar:
            return obj.avatar.url
        return None


class MessageSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)
    chatId = serializers.CharField(source="chat_id", read_only=True)
    sender = MessageSenderSerializer(read_only=True)
    receiver = MessageSenderSerializer(read_only=True)
    content = serializers.CharField(source="text", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)
    attachment = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "_id",
            "chatId",
            "sender",
            "receiver",
            "text",
            "content",
            "attachment",
            "createdAt",
            "timestamp",
        ]

    def get_attachment(self, obj):
        if not obj.attachment_type:
            return None

        return {
            "type": obj.attachment_type,
            "url": obj.attachment_url,
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
