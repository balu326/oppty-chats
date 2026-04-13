from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.sessions.models import Session
from django.utils import timezone

from .models import Employee, Message
from .serializers import MessageSerializer

# Track online users: employee_id -> set of channel names
online_users = {}


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope["url_route"]["kwargs"]["chat_id"]
        self.room_group_name = f"chat_{self.chat_id}"
        self.employee = await self._employee_from_scope()

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Mark employee online
        if self.employee:
            emp_id = str(self.employee.id)
            if emp_id not in online_users:
                online_users[emp_id] = set()
            online_users[emp_id].add(self.channel_name)
            await self._set_online(True)
            # Broadcast online status to room
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "presence_update", "employeeId": emp_id, "isOnline": True}
            )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        # Mark employee offline if no other connections
        if self.employee:
            emp_id = str(self.employee.id)
            if emp_id in online_users:
                online_users[emp_id].discard(self.channel_name)
                if not online_users[emp_id]:
                    del online_users[emp_id]
                    await self._set_online(False)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {"type": "presence_update", "employeeId": emp_id, "isOnline": False}
                    )

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type", "message")

        # Handle read receipt
        if msg_type == "read":
            chat_id = content.get("chatId")
            reader_id = content.get("readerId")
            if chat_id and reader_id:
                await self._mark_messages_read(chat_id, reader_id)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "read_receipt", "chatId": chat_id, "readerId": reader_id}
                )
            return

        text = (content.get("text") or "").strip()
        if not text or self.employee is None:
            return

        if await self._is_group_admins_only(self.chat_id):
            if self.employee.role not in {"admin", "superadmin"}:
                await self.send_json({"error": "Only admins can send messages in this group"})
                return

        message = await self._create_message(self.employee.id, text)
        serialized = await self._serialize_message(message)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": serialized}
        )

    async def chat_message(self, event):
        await self.send_json(event["message"])

    async def presence_update(self, event):
        await self.send_json({
            "type": "presence",
            "employeeId": event["employeeId"],
            "isOnline": event["isOnline"],
        })

    async def read_receipt(self, event):
        await self.send_json({
            "type": "read",
            "chatId": event["chatId"],
            "readerId": event["readerId"],
        })

    @database_sync_to_async
    def _set_online(self, status):
        from django.utils import timezone
        update = {"is_online": status}
        if not status:
            update["last_seen"] = timezone.now()
        Employee.objects.filter(pk=self.employee.id).update(**update)

    @database_sync_to_async
    def _mark_messages_read(self, chat_id, reader_id):
        Message.objects.filter(chat_id=chat_id, is_read=False).exclude(
            sender_id=reader_id
        ).update(is_read=True)

    @database_sync_to_async
    def _serialize_message(self, message):
        return MessageSerializer(message).data

    @database_sync_to_async
    def _is_group_admins_only(self, chat_id):
        from .models import ChatGroup
        try:
            group = ChatGroup.objects.get(pk=chat_id)
            return group.admins_only
        except (ChatGroup.DoesNotExist, ValueError):
            return False

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
        receiver = None
        normalized_chat_id = str(self.chat_id)
        if normalized_chat_id.startswith("dm_"):
            normalized_chat_id = normalized_chat_id[3:]

        if "_" in normalized_chat_id:
            participants = [part for part in normalized_chat_id.split("_") if part]
            if len(participants) == 2:
                receiver_id = next((p for p in participants if str(p) != str(sender_id)), None)
                if receiver_id is not None:
                    try:
                        receiver = Employee.objects.get(pk=receiver_id)
                    except Employee.DoesNotExist:
                        receiver = None

        message = Message.objects.create(chat_id=self.chat_id, sender=sender, receiver=receiver, text=text)
        return message
