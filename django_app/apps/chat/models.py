from django.db import models
from django.conf import settings
from apps.clubs.models import Club


class Room(models.Model):
    CLUB, GLOBAL, DM = "club", "global", "dm"
    KIND = [(CLUB, "Club"), (GLOBAL, "Global"), (DM, "Direct Message")]
    kind = models.CharField(max_length=10, choices=KIND)
    club = models.ForeignKey(Club, on_delete=models.CASCADE, null=True, blank=True, related_name="rooms")
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="dm_rooms")
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="messages")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    reply_to = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="replies")
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=8)

    class Meta:
        unique_together = ("message", "user", "emoji")
