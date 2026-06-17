from django.db import models
from django.conf import settings


class MentorshipRequest(models.Model):
    PENDING, ACCEPTED, REJECTED = "pending", "accepted", "rejected"
    STATUS = [(PENDING, "Pending"), (ACCEPTED, "Accepted"), (REJECTED, "Rejected")]
    mentee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mentorship_requests_sent")
    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mentorship_requests_received")
    note = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("mentee", "mentor")


class MentorshipRoom(models.Model):
    request = models.OneToOneField(MentorshipRequest, on_delete=models.CASCADE, related_name="room")
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
