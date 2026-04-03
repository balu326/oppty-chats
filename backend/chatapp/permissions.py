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


class IsSuperAdminOrReadOnly(BasePermission):
    """Allow superadmin full access; others read-only."""
    def has_permission(self, request, view):
        if not request.user or not getattr(request.user, "is_authenticated", False):
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user.role == "superadmin"
