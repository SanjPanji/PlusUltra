"""
Permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allow access only to users with the 'admin' role."""

    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsDriverRole(BasePermission):
    """Allow access only to users with the 'driver' role."""

    message = "Only drivers can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "driver"
        )


class IsAdminOrDriver(BasePermission):
    """Allow access to any authenticated user (admin or driver)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: allow admin always, or driver only for their own object.
    The view must set `obj.driver` or `obj.user` as the owner attribute.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == "admin":
            return True
        owner = getattr(obj, "driver", None) or getattr(obj, "user", None)
        return owner == request.user
