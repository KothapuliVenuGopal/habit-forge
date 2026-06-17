from django.db import models
from django.conf import settings
from apps.habits.models import Category


class RewardItem(models.Model):
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    cost = models.PositiveIntegerField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="reward_items")
    kind = models.CharField(max_length=40, default="generic")  # resume_builder, ats_template, portfolio, linkedin
    available = models.BooleanField(default=True)


class Redemption(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="redemptions")
    item = models.ForeignKey(RewardItem, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(default=dict, blank=True)
