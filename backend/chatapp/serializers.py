from rest_framework import serializers

from .models import ChatGroup, Employee, Message


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

    class Meta:
        model = Employee
        fields = ["_id", "email", "name", "role", "group", "createdAt"]


class EmployeeLoginSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)

    class Meta:
        model = Employee
        fields = ["id", "email", "name", "role"]


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

    class Meta:
        model = ChatGroup
        fields = ["_id", "name", "description", "createdBy", "members", "createdAt"]


class MessageSenderSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)

    class Meta:
        model = Employee
        fields = ["_id", "name", "email", "role"]


class MessageSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source="pk", read_only=True)
    chatId = serializers.CharField(source="chat_id", read_only=True)
    sender = MessageSenderSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    attachment = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["_id", "chatId", "sender", "text", "attachment", "createdAt"]

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
