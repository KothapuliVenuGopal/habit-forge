from django.db import models
from django.conf import settings
from apps.habits.models import Category


class Club(models.Model):
    LEVELS = [(7, "7-Day"), (30, "30-Day"), (100, "100-Day"), (365, "365-Day")]
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="clubs")
    level = models.PositiveSmallIntegerField(choices=LEVELS)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ("category", "level")

    def __str__(self):
        return self.name


class Membership(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="members")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "club")


class FeedEvent(models.Model):
    TYPES = [
        ("checkin", "Verified Check-in"),
        ("milestone", "Streak Milestone"),
        ("badge", "Badge Unlocked"),
        ("join", "New Member"),
        ("champion", "Weekly Champion"),
        ("shield", "Shield Purchased"),
    ]
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="events", null=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=TYPES)
    text = models.CharField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class FeedReaction(models.Model):
    event = models.ForeignKey(FeedEvent, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=8, default="👍")

    class Meta:
        unique_together = ("event", "user", "emoji")


class FeedComment(models.Model):
    event = models.ForeignKey(FeedEvent, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class WeeklyChampion(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name="champions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    week_start = models.DateField()
    metric = models.CharField(max_length=40)
    value = models.IntegerField()

    class Meta:
        unique_together = ("club", "user", "week_start", "metric")
