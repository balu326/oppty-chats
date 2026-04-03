from rest_framework.permissions import BasePermission


class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and getattr(request.user, "is_authenticated", False)
            and request.user.role in {"admin", "superadmin"}
        )


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and getattr(request.user, "is_authenticated", False)
            and request.user.role == "superadmin"
        )
