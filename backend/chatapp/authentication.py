from django.contrib.sessions.models import Session
from django.utils import timezone
from rest_framework import authentication, exceptions

from .models import Employee


class SessionTokenAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        session = getattr(request._request, "session", None)
        if session and session.get("employee_id"):
            return self._employee_from_session(session)

        auth_header = authentication.get_authorization_header(request).decode("utf-8")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise exceptions.AuthenticationFailed("Invalid authorization header")

        session_key = parts[1]
        try:
            session_obj = Session.objects.get(session_key=session_key, expire_date__gt=timezone.now())
        except Session.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("Invalid or expired session token") from exc

        decoded = session_obj.get_decoded()
        employee_id = decoded.get("employee_id")
        if not employee_id:
            raise exceptions.AuthenticationFailed("Invalid session payload")

        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("Employee not found") from exc

        request._request.session = session_obj
        return employee, session_key

    def _employee_from_session(self, session):
        employee_id = session.get("employee_id")
        if not employee_id:
            raise exceptions.AuthenticationFailed("No employee session found")

        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("Employee not found") from exc

        return employee, session.session_key
