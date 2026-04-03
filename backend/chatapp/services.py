from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Message
from .serializers import MessageSerializer


def broadcast_message(message: Message):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    payload = MessageSerializer(message).data
    async_to_sync(channel_layer.group_send)(
        f"chat_{message.chat_id}",
        {
            "type": "chat.message",
            "message": payload,
        },
    )
