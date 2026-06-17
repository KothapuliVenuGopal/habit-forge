import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Room, Message
from apps.accounts.models import Block

User = get_user_model()


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=4401)
            return
        self.room_slug = self.scope["url_route"]["kwargs"]["room_slug"]
        self.group = f"chat_{self.room_slug}"
        if not await self._can_join():
            await self.close(code=4403)
            return
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group"):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action", "message")
        if action == "message":
            text = (content.get("text") or "").strip()[:2000]
            reply_to = content.get("reply_to")
            if not text:
                return
            msg = await self._save_message(text, reply_to)
            await self.channel_layer.group_send(self.group, {
                "type": "chat.message",
                "id": msg.id,
                "user": self.user.username,
                "text": text,
                "reply_to": reply_to,
                "created_at": msg.created_at.isoformat(),
            })

    async def chat_message(self, event):
        await self.send_json(event)

    @database_sync_to_async
    def _can_join(self):
        try:
            room = Room.objects.get(slug=self.room_slug)
        except Room.DoesNotExist:
            return False
        if room.kind == Room.DM:
            if not room.participants.filter(id=self.user.id).exists():
                return False
            other = room.participants.exclude(id=self.user.id).first()
            if other and (
                Block.objects.filter(blocker=other, blocked=self.user).exists()
                or not other.profile.dms_enabled
            ):
                return False
        self._room = room
        return True

    @database_sync_to_async
    def _save_message(self, text, reply_to):
        return Message.objects.create(
            room=self._room, user=self.user, text=text,
            reply_to_id=reply_to if reply_to else None,
        )
