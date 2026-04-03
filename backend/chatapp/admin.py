from django.contrib import admin

from .models import ChatGroup, Employee, Message


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


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("chat_id", "sender", "created_at")
    search_fields = ("chat_id", "sender__name", "text")
    list_filter = ("attachment_type",)
