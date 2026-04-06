from django.contrib import admin

from .models import ChatGroup, Employee, Meeting, Message


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "role", "group", "created_at")
    search_fields = ("name", "email")
    list_filter = ("role",)


@admin.register(ChatGroup)
class ChatGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "created_by", "created_at")
    search_fields = ("name",)
    filter_horizontal = ("members",)


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("title", "created_by", "scheduled_at", "created_at")
    search_fields = ("title",)
    filter_horizontal = ("invitees",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("chat_id", "sender", "receiver", "text", "created_at")
    search_fields = ("chat_id", "sender__name", "receiver__name", "text")
    list_filter = ("attachment_type",)
