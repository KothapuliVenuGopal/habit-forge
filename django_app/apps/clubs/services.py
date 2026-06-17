from .models import Club, Membership, FeedEvent

LEVELS = [7, 30, 100, 365]


def maybe_unlock_clubs(user, streak: int, category):
    unlocked = []
    for lvl in LEVELS:
        if streak >= lvl:
            club, _ = Club.objects.get_or_create(
                category=category, level=lvl,
                defaults={"name": f"{category.name} {lvl}-Day Club"},
            )
            membership, created = Membership.objects.get_or_create(user=user, club=club)
            if created:
                unlocked.append(club)
                FeedEvent.objects.create(
                    club=club, user=user, type="join",
                    text=f"{user.username} joined the {club.name}!",
                )
    return unlocked
