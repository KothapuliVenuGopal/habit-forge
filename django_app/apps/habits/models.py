from django.db import models
from django.conf import settings


class Category(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=80)
    icon = models.CharField(max_length=40, blank=True)
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    color = models.CharField(max_length=20, default="#4F46E5")

    def __str__(self):
        return self.name


class Habit(models.Model):
    ACTIVE, ARCHIVED = "active", "archived"
    STATUS = [(ACTIVE, "Active"), (ARCHIVED, "Archived")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="habits")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="habits")
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    target_per_week = models.PositiveSmallIntegerField(default=7)
    status = models.CharField(max_length=10, choices=STATUS, default=ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
