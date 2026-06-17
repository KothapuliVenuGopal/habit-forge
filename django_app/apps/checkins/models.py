from django.db import models
from django.conf import settings
from apps.habits.models import Habit, Category


class CheckIn(models.Model):
    PENDING, VERIFIED, REJECTED = "pending", "verified", "rejected"
    STATUS = [(PENDING, "Pending"), (VERIFIED, "Verified"), (REJECTED, "Rejected")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="checkins")
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="checkins")
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    check_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS, default=PENDING)
    verification_score = models.PositiveSmallIntegerField(default=0)
    confidence_score = models.PositiveSmallIntegerField(default=0)
    proof_image = models.ImageField(upload_to="proofs/", blank=True, null=True)
    payload = models.JSONField(default=dict, blank=True)
    ai_questions = models.JSONField(default=list, blank=True)
    ai_answers = models.JSONField(default=list, blank=True)
    ai_feedback = models.TextField(blank=True)
    credits_awarded = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "check_date"])]
        ordering = ["-created_at"]
