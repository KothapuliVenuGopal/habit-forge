from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import BadgeDefinition, UserBadge


@login_required
def badges_page(request):
    earned = {ub.badge_id: ub for ub in UserBadge.objects.filter(user=request.user).select_related("badge")}
    all_badges = BadgeDefinition.objects.all().order_by("rarity")
    items = [{"badge": b, "earned": earned.get(b.id)} for b in all_badges]
    return render(request, "badges/list.html", {"items": items})
