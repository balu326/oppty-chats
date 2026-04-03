from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.sessions.models import Session
from django.utils import timezone

from .models import Employee, Message
from .serializers import MessageSerializer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope["url_route"]["kwargs"]["chat_id"]
        self.room_group_name = f"chat_{self.chat_id}"
        self.employee = await self._employee_from_scope()

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        text = (content.get("text") or "").strip()
        if not text or self.employee is None:
            return

        message = await self._create_message(self.employee.id, text)
        await self.chat_message({"message": MessageSerializer(message).data})

    async def chat_message(self, event):
        await self.send_json(event["message"])

    @database_sync_to_async
    def _employee_from_scope(self):
        session = self.scope.get("session")
        employee_id = session.get("employee_id") if session else None

        if not employee_id:
            token = parse_qs(self.scope.get("query_string", b"").decode("utf-8")).get("token", [None])[0]
            if token:
                try:
                    session_obj = Session.objects.get(session_key=token, expire_date__gt=timezone.now())
                    employee_id = session_obj.get_decoded().get("employee_id")
                except Session.DoesNotExist:
                    employee_id = None

        if not employee_id:
            return None

        try:
            return Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return None

    @database_sync_to_async
    def _create_message(self, sender_id, text):
        sender = Employee.objects.get(pk=sender_id)
        message = Message.objects.create(chat_id=self.chat_id, sender=sender, text=text)
        return message
