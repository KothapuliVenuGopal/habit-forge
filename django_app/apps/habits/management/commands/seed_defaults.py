from django.core.management.base import BaseCommand
from apps.habits.models import Category
from apps.badges.models import BadgeDefinition

DEFAULTS = [
    ("coding", "Coding", "💻", "#4F46E5"),
    ("reading", "Reading", "📚", "#8B5CF6"),
    ("gym", "Gym", "🏋️", "#EF4444"),
    ("running", "Running", "🏃", "#22C55E"),
    ("meditation", "Meditation", "🧘", "#06B6D4"),
    ("fasting", "Fasting", "⏱️", "#F59E0B"),
]

BADGES = [
    ("streak_7", "7-Day Streak", "common", "First week complete!", "🔥"),
    ("streak_30", "30-Day Streak", "rare", "A full month of discipline.", "⚡"),
    ("streak_100", "100-Day Streak", "epic", "Triple-digit dedication.", "💎"),
    ("streak_365", "365-Day Streak", "legendary", "A year of consistency.", "👑"),
    ("weekly_champion", "Weekly Champion", "epic", "Top of the leaderboard.", "🏆"),
    ("mentor", "Mentor", "legendary", "Guiding the next generation.", "🎓"),
]


class Command(BaseCommand):
    help = "Seed default categories and badges"

    def handle(self, *args, **opts):
        for slug, name, icon, color in DEFAULTS:
            Category.objects.update_or_create(
                slug=slug, defaults={"name": name, "icon": icon, "color": color, "is_default": True}
            )
        for key, name, rarity, desc, icon in BADGES:
            BadgeDefinition.objects.update_or_create(
                key=key, defaults={"name": name, "rarity": rarity, "description": desc, "icon": icon}
            )
        self.stdout.write(self.style.SUCCESS("Seeded defaults"))
