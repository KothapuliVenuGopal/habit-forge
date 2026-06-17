from datetime import timedelta, date
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.db.models import Sum
from apps.habits.models import Habit
from apps.checkins.models import CheckIn
from apps.credits.models import CreditBalance
from apps.clubs.models import Membership
from apps.badges.models import UserBadge


def landing(request):
    return render(request, "core/landing.html")


@login_required
def dashboard(request):
    today = date.today()
    habits = Habit.objects.filter(user=request.user, status=Habit.ACTIVE).select_related("category")
    today_done_ids = set(CheckIn.objects.filter(user=request.user, check_date=today, status=CheckIn.VERIFIED).values_list("habit_id", flat=True))
    balances = CreditBalance.objects.filter(user=request.user).select_related("category")
    memberships = Membership.objects.filter(user=request.user).select_related("club", "club__category")
    badges = UserBadge.objects.filter(user=request.user).select_related("badge")[:8]
    # heatmap: last 120 days
    start = today - timedelta(days=119)
    counts = (
        CheckIn.objects.filter(user=request.user, status=CheckIn.VERIFIED, check_date__gte=start)
        .values("check_date").order_by("check_date")
    )
    by_date = {c["check_date"]: 1 for c in counts}
    heatmap = []
    for i in range(120):
        d = start + timedelta(days=i)
        heatmap.append({"date": d.isoformat(), "v": by_date.get(d, 0)})
    return render(request, "core/dashboard.html", {
        "habits": habits, "today_done_ids": today_done_ids,
        "balances": balances, "memberships": memberships,
        "badges": badges, "heatmap": heatmap,
    })


def legal(request, slug):
    templates = {
        "terms": "legal/terms.html",
        "privacy": "legal/privacy.html",
        "community": "legal/community.html",
        "shield-policy": "legal/shield_policy.html",
        "credits-policy": "legal/credits_policy.html",
        "club-rules": "legal/club_rules.html",
    }
    return render(request, templates.get(slug, "legal/terms.html"))
