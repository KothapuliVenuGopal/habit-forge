from django.db import models
from django.conf import settings
from apps.habits.models import Category


class CreditBalance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="credit_balances")
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    balance = models.IntegerField(default=0)
    lifetime_earned = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "category")


class CreditTransaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="credit_transactions")
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount = models.IntegerField()
    reason = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
