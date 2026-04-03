from pathlib import Path
import secrets

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import SessionTokenAuthentication
from .models import ChatGroup, Employee, Message
from .permissions import IsAdminOrSuperAdmin, IsSuperAdmin, IsSuperAdminOrReadOnly
from .serializers import EmployeeLoginSerializer, EmployeeSerializer, GroupSerializer, MessageSerializer
from .services import broadcast_message


def _conversation_id(user_a, user_b):
    return f"dm_{'_'.join(sorted([str(user_a), str(user_b)]))}"


def _can_create_group(user):
    if not user or not getattr(user, "is_authenticated", False):
        return False
    return user.role == Employee.ROLE_SUPERADMIN


def _can_manage_group(user, group):
    if not user or not getattr(user, "is_authenticated", False):
        return False
    return user.role == Employee.ROLE_SUPERADMIN


def _as_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def _receiver_from_chat_id(chat_id, sender_id):
    normalized_chat_id = str(chat_id or "")
    if normalized_chat_id.startswith("dm_"):
        normalized_chat_id = normalized_chat_id[3:]

    if not normalized_chat_id or "_" not in normalized_chat_id:
        return None

    participants = [part for part in normalized_chat_id.split("_") if part]
    if len(participants) != 2:
        return None

    receiver_id = next((participant for participant in participants if str(participant) != str(sender_id)), None)
    if receiver_id is None:
        return None

    try:
        return Employee.objects.get(pk=receiver_id)
    except Employee.DoesNotExist:
        return None


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(
            {
                "status": "OK",
                "message": "Django backend is running",
                "timestamp": timezone.now(),
            }
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email or not password:
            return Response({"message": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            employee = Employee.objects.get(email=email)
        except Employee.DoesNotExist:
            return Response({"message": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

        if not employee.compare_password(password):
            return Response({"message": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

        request.session.flush()
        request.session["employee_id"] = employee.id
        request.session["employee_role"] = employee.role
        request.session["employee_email"] = employee.email
        request.session.create()

        return Response(
            {
                "success": True,
                "token": request.session.session_key,
                "employee": EmployeeLoginSerializer(employee).data,
            }
        )


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"message": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            employee = Employee.objects.get(email=email)
        except Employee.DoesNotExist:
            return Response({"message": "Email not found in employee records"}, status=status.HTTP_404_NOT_FOUND)

        otp = f"{secrets.randbelow(900000) + 100000}"
        employee.otp_value = otp
        employee.otp_expires_at = timezone.now() + timezone.timedelta(minutes=10)
        employee.save(update_fields=["otp_value", "otp_expires_at"])
        request.session["password_reset_email"] = employee.email
        return Response({"success": True, "message": "OTP has been sent successfully to your email"})


class VerifyOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        otp = (request.data.get("otp") or "").strip()
        if not email or not otp:
            return Response({"message": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            employee = Employee.objects.get(email=email)
        except Employee.DoesNotExist:
            return Response({"message": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

        if not employee.otp_is_valid(otp):
            return Response({"message": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

        request.session["otp_verified_email"] = email
        return Response({"success": True, "message": "OTP verified successfully"})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        new_password = request.data.get("newPassword") or ""

        if not email or not new_password:
            return Response({"message": "Email and new password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({"message": "Password must be at least 6 characters"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            employee = Employee.objects.get(email=email)
        except Employee.DoesNotExist:
            return Response({"message": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

        employee.set_password(new_password)
        employee.otp_value = ""
        employee.otp_expires_at = None
        employee.save(update_fields=["password", "otp_value", "otp_expires_at"])
        return Response({"success": True, "message": "Password has been reset successfully"})


class EmployeesView(APIView):
    authentication_classes = [SessionTokenAuthentication]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        employees = Employee.objects.select_related("group").all()
        return Response({"success": True, "employees": EmployeeSerializer(employees, many=True).data})

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        role = request.data.get("role") or Employee.ROLE_EMPLOYEE
        can_create_groups = _as_bool(request.data.get("canCreateGroups", False))

        if not name or not email or not password:
            return Response({"message": "Name, email, and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if Employee.objects.filter(email=email).exists():
            return Response({"message": "Employee with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        if role not in {Employee.ROLE_EMPLOYEE, Employee.ROLE_ADMIN, Employee.ROLE_SUPERADMIN}:
            return Response({"message": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        employee = Employee(
            email=email,
            name=name,
            role=role,
            can_create_groups=can_create_groups or role in {Employee.ROLE_ADMIN, Employee.ROLE_SUPERADMIN},
        )
        employee.set_password(password)
        employee.save()
        return Response(
            {
                "success": True,
                "message": "Employee created successfully",
                "employee": EmployeeLoginSerializer(employee).data,
            }
        )


class EmployeePermissionView(APIView):
    authentication_classes = [SessionTokenAuthentication]
    permission_classes = [IsSuperAdmin]

    def patch(self, request, employee_id):
        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return Response({"message": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)

        if employee.role == Employee.ROLE_SUPERADMIN and request.user.role != Employee.ROLE_SUPERADMIN:
            return Response({"message": "Only super admins can update another super admin"}, status=status.HTTP_403_FORBIDDEN)

        can_create_groups = request.data.get("canCreateGroups")
        if can_create_groups is None:
            return Response({"message": "No permission changes provided"}, status=status.HTTP_400_BAD_REQUEST)

        employee.can_create_groups = _as_bool(can_create_groups)
        employee.save(update_fields=["can_create_groups"])
        return Response(
            {
                "success": True,
                "message": "Employee permissions updated successfully",
                "employee": EmployeeSerializer(employee).data,
            }
        )


class AllMessagesView(APIView):
    authentication_classes = [SessionTokenAuthentication]
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        messages = Message.objects.select_related("sender").all().order_by("-created_at")[:1000]
        return Response({"success": True, "messages": MessageSerializer(messages, many=True).data})


class GroupListView(APIView):
    authentication_classes = [SessionTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        groups = ChatGroup.objects.prefetch_related("members").select_related("created_by")
        if request.user.role in {Employee.ROLE_ADMIN, Employee.ROLE_SUPERADMIN}:
            queryset = groups.all()
        else:
            queryset = groups.filter(models.Q(members=request.user) | models.Q(created_by=request.user)).distinct()
        return Response({"success": True, "groups": GroupSerializer(queryset, many=True, context={"request": request}).data})

    def post(self, request):
        if not _can_create_group(request.user):
            return Response({"message": "Only super admins can create groups"}, status=status.HTTP_403_FORBIDDEN)

        name = (request.data.get("name") or "").strip()
        description = (request.data.get("description") or "").strip()
        admins_only = _as_bool(request.data.get("adminsOnly", False))
        if not name:
            return Response({"message": "Group name is required"}, status=status.HTTP_400_BAD_REQUEST)
        if ChatGroup.objects.filter(name=name).exists():
            return Response({"message": "Group with this name already exists"}, status=status.HTTP_400_BAD_REQUEST)

        group = ChatGroup.objects.create(name=name, description=description, created_by=request.user, admins_only=admins_only)
        group.members.add(request.user)
        return Response(
            {
                "success": True,
                "message": "Group created successfully",
                "group": GroupSerializer(group, context={"request": request}).data,
            }
        )


class GroupDetailView(APIView):
    authentication_classes = [SessionTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, group_id):
        try:
            group = ChatGroup.objects.get(pk=group_id)
        except ChatGroup.DoesNotExist:
            return Response({"message": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        if not _can_manage_group(request.user, group):
            return Response({"message": "You do not have permission to update this group"}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name")
        description = request.data.get("description")
        if name is not None:
            name = name.strip()
            if not name:
                return Response({"message": "Group name is required"}, status=status.HTTP_400_BAD_REQUEST)
            if ChatGroup.objects.filter(name=name).exclude(pk=group.id).exists():
                return Response({"message": "Group with this name already exists"}, status=status.HTTP_400_BAD_REQUEST)
            group.name = name
        if description is not None:
            group.description = description.strip()
        group.save()
        return Response(
            {
                "success": True,
                "message": "Group updated successfully",
                "group": GroupSerializer(group, context={"request": request}).data,
            }
        )

    def delete(self, request, group_id):
        try:
            group = ChatGroup.objects.get(pk=group_id)
        except ChatGroup.DoesNotExist:
            return Response({"message": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        if not _can_manage_group(request.user, group):
            return Response({"message": "You do not have permission to delete this group"}, status=status.HTTP_403_FORBIDDEN)

        Employee.objects.filter(group=group).update(group=None)
        group.members.clear()
        group.delete()
        return Response({"success": True, "message": "Group deleted successfully"})


class GroupMemberView(APIView):
    authentication_classes = [SessionTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, group_id, employee_id):
        try:
            group = ChatGroup.objects.get(pk=group_id)
            employee = Employee.objects.get(pk=employee_id)
        except (ChatGroup.DoesNotExist, Employee.DoesNotExist):
            return Response({"message": "Group or employee not found"}, status=status.HTTP_404_NOT_FOUND)

        if not _can_manage_group(request.user, group):
            return Response({"message": "You do not have permission to update this group"}, status=status.HTTP_403_FORBIDDEN)

        group.members.add(employee)
        employee.group = group
        employee.save(update_fields=["group"])
        return Response(
            {
                "success": True,
                "message": "Employee added to group successfully",
                "group": GroupSerializer(group, context={"request": request}).data,
            }
        )

    def delete(self, request, group_id, employee_id):
        try:
            group = ChatGroup.objects.get(pk=group_id)
            employee = Employee.objects.get(pk=employee_id)
        except (ChatGroup.DoesNotExist, Employee.DoesNotExist):
            return Response({"message": "Group or employee not found"}, status=status.HTTP_404_NOT_FOUND)

        if not _can_manage_group(request.user, group):
            return Response({"message": "You do not have permission to update this group"}, status=status.HTTP_403_FORBIDDEN)

        group.members.remove(employee)
        if employee.group_id == group.id:
            employee.group = None
            employee.save(update_fields=["group"])
        return Response({"success": True, "message": "Employee removed from group successfully"})


class GroupAdminsOnlyView(APIView):
    """Toggle the admins_only flag on a group — superadmin only."""
    authentication_classes = [SessionTokenAuthentication]
    permission_classes = [IsSuperAdmin]

    def patch(self, request, group_id):
        try:
            group = ChatGroup.objects.get(pk=group_id)
        except ChatGroup.DoesNotExist:
            return Response({"message": "Group not found"}, status=status.HTTP_404_NOT_FOUND)

        admins_only = _as_bool(request.data.get("adminsOnly", group.admins_only))
        group.admins_only = admins_only
        group.save(update_fields=["admins_only"])
        return Response({
            "success": True,
            "message": f"Group messaging restricted to admins: {admins_only}",
            "group": GroupSerializer(group, context={"request": request}).data,
        })


class MessageListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, chat_id):
        user_id = request.query_params.get("userId")
        normalized_chat_id = _conversation_id(user_id, chat_id) if user_id and "_" not in chat_id else chat_id
        messages = Message.objects.select_related("sender").filter(chat_id=normalized_chat_id)
        count = messages.count()
        return Response({"success": True, "messages": MessageSerializer(messages, many=True).data, "totalFetched": count, "uniqueCount": count})


class MessageDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        chat_id = request.data.get("chatId")
        sender_id = request.data.get("senderId")
        text = (request.data.get("text") or "").strip()

        if not chat_id or not sender_id or not text:
            return Response({"message": "Chat ID, sender ID, and text are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sender = Employee.objects.get(pk=sender_id)
        except Employee.DoesNotExist:
            return Response({"message": "Sender not found"}, status=status.HTTP_404_NOT_FOUND)

        duplicate_threshold = timezone.now() - timezone.timedelta(seconds=5)
        duplicate = Message.objects.filter(chat_id=chat_id, sender=sender, text=text, created_at__gte=duplicate_threshold).first()
        if duplicate:
            return Response({"success": True, "message": MessageSerializer(duplicate).data, "isDuplicate": True})

        # Enforce admins_only group restriction
        try:
            group = ChatGroup.objects.get(pk=chat_id)
            if group.admins_only and sender.role not in {Employee.ROLE_ADMIN, Employee.ROLE_SUPERADMIN}:
                return Response({"message": "Only admins can send messages in this group"}, status=status.HTTP_403_FORBIDDEN)
        except (ChatGroup.DoesNotExist, ValueError):
            pass  # DM or non-existent group — allow

        receiver = _receiver_from_chat_id(chat_id, sender.id)
        message = Message.objects.create(chat_id=chat_id, sender=sender, receiver=receiver, text=text)
        broadcast_message(message)
        return Response({"success": True, "message": MessageSerializer(message).data, "isNew": True})


class MessageUploadView(APIView):
    authentication_classes = [SessionTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        chat_id = request.data.get("chatId")
        sender_id = request.data.get("senderId")
        upload = request.FILES.get("file")

        if not chat_id or not sender_id:
            return Response({"message": "Chat ID and sender ID are required"}, status=status.HTTP_400_BAD_REQUEST)
        if upload is None:
            return Response({"message": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sender = Employee.objects.get(pk=sender_id)
        except Employee.DoesNotExist:
            return Response({"message": "Sender not found"}, status=status.HTTP_404_NOT_FOUND)

        upload_dir = Path(settings.MEDIA_ROOT) / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        storage = FileSystemStorage(location=upload_dir, base_url=f"{settings.MEDIA_URL}uploads/")
        stored_name = storage.save(upload.name, upload)

        attachment_type = Message.ATTACHMENT_DOCUMENT
        if upload.content_type.startswith("image/"):
            attachment_type = Message.ATTACHMENT_PHOTO
        elif upload.content_type.startswith("video/"):
            attachment_type = Message.ATTACHMENT_VIDEO

        message = Message.objects.create(
            chat_id=chat_id,
            sender=sender,
            receiver=_receiver_from_chat_id(chat_id, sender.id),
            text="",
            attachment_type=attachment_type,
            attachment_url=storage.url(stored_name),
            attachment_file_name=upload.name,
            attachment_file_size=upload.size,
            attachment_mime_type=upload.content_type,
        )
        broadcast_message(message)
        return Response({"success": True, "message": MessageSerializer(message).data, "fileUrl": storage.url(stored_name)})


class MessageLinkView(APIView):
    authentication_classes = [SessionTokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        chat_id = request.data.get("chatId")
        sender_id = request.data.get("senderId")
        url = (request.data.get("url") or "").strip()

        if not chat_id or not sender_id or not url:
            return Response({"message": "Chat ID, sender ID, and URL are required"}, status=status.HTTP_400_BAD_REQUEST)

        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        try:
            sender = Employee.objects.get(pk=sender_id)
        except Employee.DoesNotExist:
            return Response({"message": "Sender not found"}, status=status.HTTP_404_NOT_FOUND)

        message = Message.objects.create(
            chat_id=chat_id,
            sender=sender,
            receiver=_receiver_from_chat_id(chat_id, sender.id),
            text=f"Check out this link: {url}",
            attachment_type=Message.ATTACHMENT_LINK,
            attachment_url=url,
        )
        broadcast_message(message)
        return Response({"success": True, "message": MessageSerializer(message).data})
