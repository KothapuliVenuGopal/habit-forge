from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.habits.models import Category


class ShieldTier(models.TextChoices):
    BRONZE = "bronze", "Bronze"
    SILVER = "silver", "Silver"
    GOLD = "gold", "Gold"


TIER_CONFIG = {
    ShieldTier.BRONZE: {"cost": 100, "protects": 1, "validity_days": 7},
    ShieldTier.SILVER: {"cost": 300, "protects": 2, "validity_days": 14},
    ShieldTier.GOLD: {"cost": 700, "protects": 5, "validity_days": 30},
}


class Shield(models.Model):
    ACTIVE, USED, EXPIRED = "active", "used", "expired"
    STATUS = [(ACTIVE, "Active"), (USED, "Used"), (EXPIRED, "Expired")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shields")
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    tier = models.CharField(max_length=10, choices=ShieldTier.choices)
    status = models.CharField(max_length=10, choices=STATUS, default=ACTIVE)
    protects_days = models.PositiveSmallIntegerField()
    days_used = models.PositiveSmallIntegerField(default=0)
    purchased_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    cost = models.PositiveIntegerField()

    def save(self, *args, **kwargs):
        if not self.pk and not self.expires_at:
            cfg = TIER_CONFIG[self.tier]
            self.expires_at = timezone.now() + timedelta(days=cfg["validity_days"])
            self.protects_days = cfg["protects"]
            self.cost = cfg["cost"]
        super().save(*args, **kwargs)
