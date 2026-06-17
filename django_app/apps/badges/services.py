from .models import BadgeDefinition, UserBadge


def award_badge(user, key: str):
    try:
        bd = BadgeDefinition.objects.get(key=key)
    except BadgeDefinition.DoesNotExist:
        return None
    obj, created = UserBadge.objects.get_or_create(user=user, badge=bd)
    return obj if created else None


def maybe_award_streak_badges(user, streak: int):
    for threshold, key in [(7, "streak_7"), (30, "streak_30"), (100, "streak_100"), (365, "streak_365")]:
        if streak >= threshold:
            award_badge(user, key)
