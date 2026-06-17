from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Room, Message
from apps.clubs.models import Club, Membership

User = get_user_model()
GLOBAL_SLUG = "global-community"


def _ensure_global():
    room, _ = Room.objects.get_or_create(slug=GLOBAL_SLUG, defaults={"kind": Room.GLOBAL, "name": "Global Community"})
    return room


@login_required
def global_chat(request):
    room = _ensure_global()
    messages = Message.objects.filter(room=room).select_related("user")[:100]
    return render(request, "chat/room.html", {"room": room, "messages": messages, "title": "Global Community"})


@login_required
def club_chat(request, club_id):
    club = get_object_or_404(Club, id=club_id)
    if not Membership.objects.filter(user=request.user, club=club).exists():
        return redirect("clubs:detail", club_id=club.id)
    slug = f"club-{club.id}"
    room, _ = Room.objects.get_or_create(slug=slug, defaults={"kind": Room.CLUB, "club": club, "name": club.name})
    messages = Message.objects.filter(room=room).select_related("user")[:100]
    return render(request, "chat/room.html", {"room": room, "messages": messages, "title": club.name})


@login_required
def dm(request, user_id):
    other = get_object_or_404(User, id=user_id)
    if other == request.user or not other.profile.dms_enabled:
        return redirect("accounts:public_profile", username=other.username)
    ids = sorted([request.user.id, other.id])
    slug = f"dm-{ids[0]}-{ids[1]}"
    room, created = Room.objects.get_or_create(slug=slug, defaults={"kind": Room.DM, "name": f"DM"})
    if created:
        room.participants.add(request.user, other)
    messages = Message.objects.filter(room=room).select_related("user")[:100]
    return render(request, "chat/room.html", {"room": room, "messages": messages, "title": f"@{other.username}"})


@login_required
def inbox(request):
    rooms = Room.objects.filter(kind=Room.DM, participants=request.user).prefetch_related("participants")
    return render(request, "chat/inbox.html", {"rooms": rooms})
