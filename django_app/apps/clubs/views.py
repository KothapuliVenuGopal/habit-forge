from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Sum
from .models import Club, Membership, FeedEvent, FeedReaction, FeedComment


@login_required
def club_list(request):
    my = Membership.objects.filter(user=request.user).select_related("club", "club__category")
    all_clubs = Club.objects.select_related("category").all()
    return render(request, "clubs/list.html", {"my": my, "all_clubs": all_clubs})


@login_required
def club_detail(request, club_id):
    club = get_object_or_404(Club, id=club_id)
    is_member = Membership.objects.filter(user=request.user, club=club).exists()
    events = FeedEvent.objects.filter(club=club).select_related("user")[:50]
    members = Membership.objects.filter(club=club).select_related("user", "user__profile")[:50]
    leaderboard = (
        members.order_by("-user__profile__current_streak")[:20]
    )
    return render(request, "clubs/detail.html", {
        "club": club, "is_member": is_member, "events": events,
        "members": members, "leaderboard": leaderboard,
    })


@login_required
@require_POST
def react(request, event_id):
    event = get_object_or_404(FeedEvent, id=event_id)
    emoji = request.POST.get("emoji", "👍")[:8]
    obj, created = FeedReaction.objects.get_or_create(event=event, user=request.user, emoji=emoji)
    if not created:
        obj.delete()
    return JsonResponse({"ok": True, "active": created})


@login_required
@require_POST
def comment(request, event_id):
    event = get_object_or_404(FeedEvent, id=event_id)
    text = request.POST.get("text", "").strip()[:1000]
    if text:
        FeedComment.objects.create(event=event, user=request.user, text=text)
    return JsonResponse({"ok": True})


@login_required
def networking(request):
    """Cross-club discovery — list members from higher-level clubs."""
    high = Membership.objects.filter(club__level__gte=30).select_related("user", "user__profile", "club")[:200]
    return render(request, "clubs/networking.html", {"members": high})
