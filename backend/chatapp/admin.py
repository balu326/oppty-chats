from django.contrib import admin
from django.utils.html import format_html
from django.utils.timezone import localtime

from .models import Bookmark, ChatGroup, Employee, Meeting, Message, Notification


# ── Employee ──────────────────────────────────────────────────────────────────
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("id", "avatar_thumb", "name", "email", "role", "is_active_display", "created_at_fmt")
    list_display_links = ("name",)
    search_fields = ("name", "email")
    list_filter = ("role", "is_online", "created_at")
    ordering = ("id",)
    readonly_fields = ("created_at", "avatar_thumb")
    fieldsets = (
        ("Basic Info", {"fields": ("name", "email", "role", "avatar", "avatar_thumb")}),
        ("Contact", {"fields": ("phone", "bio")}),
        ("Permissions", {"fields": ("can_create_groups", "group")}),
        ("Status", {"fields": ("is_online",)}),
        ("Timestamps", {"fields": ("created_at",)}),
    )

    @admin.display(description="Avatar")
    def avatar_thumb(self, obj):
        if obj.avatar:
            try:
                url = obj.avatar.url
                return format_html(
                    '<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;'
                    'background:linear-gradient(135deg,#ff8a65,#ff6b35);display:flex;'
                    'align-items:center;justify-content:center;">'
                    '<img src="{}" style="width:100%;height:100%;object-fit:cover;" /></div>',
                    url
                )
            except Exception:
                pass
        initial = (obj.name or "?")[0].upper()
        return format_html(
            '<div style="width:32px;height:32px;border-radius:50%;background:#00897b;'
            'color:#fff;display:flex;align-items:center;justify-content:center;'
            'font-weight:700;font-size:14px;">{}</div>',
            initial
        )

    @admin.display(description="Is Active", boolean=True)
    def is_active_display(self, obj):
        return True  # All employees are active by default

    @admin.display(description="Created At")
    def created_at_fmt(self, obj):
        return localtime(obj.created_at).strftime("%B %-d, %Y, %-I:%M %p") if obj.created_at else "-"


# ── ChatGroup ─────────────────────────────────────────────────────────────────
@admin.register(ChatGroup)
class ChatGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_by", "member_count", "admins_only", "created_at")
    list_display_links = ("name",)
    search_fields = ("name", "created_by__name")
    list_filter = ("admins_only", "created_at")
    filter_horizontal = ("members",)
    readonly_fields = ("created_at",)

    @admin.display(description="Members")
    def member_count(self, obj):
        return obj.members.count()


# ── Message ───────────────────────────────────────────────────────────────────
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "chat_id", "sender", "receiver", "message_preview", "attachment_type", "is_read", "created_at")
    list_display_links = ("message_preview",)
    search_fields = ("chat_id", "sender__name", "receiver__name", "text")
    list_filter = ("attachment_type", "is_read", "created_at")
    readonly_fields = ("created_at", "attachment_preview")
    ordering = ("-created_at",)
    fieldsets = (
        ("Message", {"fields": ("chat_id", "sender", "receiver", "text", "is_read")}),
        ("Attachment", {"fields": ("attachment_type", "attachment_url", "attachment_file_name", "attachment_file_size", "attachment_mime_type", "attachment_preview")}),
        ("Timestamps", {"fields": ("created_at",)}),
    )

    @admin.display(description="Message")
    def message_preview(self, obj):
        if obj.attachment_type == "photo" and obj.attachment_url:
            url = obj.attachment_url
            if url.startswith("http://"):
                url = url.replace("http://", "https://", 1)
            return format_html(
                '<div style="display:flex;align-items:center;gap:8px;">'
                '<img src="{}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #eee;" />'
                '<span style="color:#888;font-size:12px;">📷 Photo</span>'
                '</div>',
                url
            )
        if obj.attachment_type == "video":
            return format_html('<span>🎥 Video</span>')
        if obj.attachment_type == "link":
            return format_html('<span>🔗 <a href="{}" target="_blank">{}</a></span>', obj.attachment_url, obj.attachment_url[:40])
        if obj.attachment_type == "document":
            return format_html('<span>📄 {}</span>', obj.attachment_file_name or "File")
        if obj.text:
            return obj.text[:80] + ("…" if len(obj.text) > 80 else "")
        return "-"

    @admin.display(description="Attachment Preview")
    def attachment_preview(self, obj):
        if obj.attachment_type == "photo" and obj.attachment_url:
            url = obj.attachment_url
            if url.startswith("http://"):
                url = url.replace("http://", "https://", 1)
            return format_html(
                '<a href="{}" target="_blank">'
                '<img src="{}" style="max-width:300px;max-height:300px;object-fit:contain;border-radius:10px;border:1px solid #eee;" />'
                '</a>',
                url, url
            )
        if obj.attachment_type == "video" and obj.attachment_url:
            url = obj.attachment_url
            if url.startswith("http://"):
                url = url.replace("http://", "https://", 1)
            return format_html(
                '<video controls style="max-width:300px;border-radius:10px;">'
                '<source src="{}" /></video>',
                url
            )
        if obj.attachment_url:
            return format_html('<a href="{}" target="_blank">📎 Open file</a>', obj.attachment_url)
        return "-"


# ── Meeting ───────────────────────────────────────────────────────────────────
@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "created_by", "scheduled_at", "invitee_count", "created_at")
    list_display_links = ("title",)
    search_fields = ("title", "created_by__name")
    list_filter = ("scheduled_at", "created_at")
    filter_horizontal = ("invitees",)
    readonly_fields = ("created_at",)

    @admin.display(description="Invitees")
    def invitee_count(self, obj):
        return obj.invitees.count()


# ── Notification ──────────────────────────────────────────────────────────────
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "recipient", "sender", "notif_type", "title", "is_read", "created_at")
    list_display_links = ("title",)
    search_fields = ("recipient__name", "sender__name", "title", "body")
    list_filter = ("notif_type", "is_read", "created_at")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)


# ── Bookmark ──────────────────────────────────────────────────────────────────
@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("id", "employee", "message", "note", "created_at")
    list_display_links = ("employee",)
    search_fields = ("employee__name", "note")
    list_filter = ("created_at",)
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)
