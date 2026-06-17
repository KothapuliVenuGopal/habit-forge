from django.db import models
from django.conf import settings


class BadgeDefinition(models.Model):
    RARITY = [("common", "Common"), ("rare", "Rare"), ("epic", "Epic"), ("legendary", "Legendary")]
    key = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default="🏅")
    rarity = models.CharField(max_length=20, choices=RARITY, default="common")


class UserBadge(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="badges")
    badge = models.ForeignKey(BadgeDefinition, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "badge")
