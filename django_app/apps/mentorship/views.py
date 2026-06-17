from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from apps.clubs.models import Membership
from apps.badges.services import award_badge
from .models import MentorshipRequest, MentorshipRoom

User = get_user_model()


def _is_eligible_mentor(user) -> bool:
    return Membership.objects.filter(user=user, club__level=365).exists()


@login_required
def mentors(request):
    mentor_users = User.objects.filter(memberships__club__level=365).distinct().select_related("profile")
    return render(request, "mentorship/mentors.html", {"mentors": mentor_users})


@login_required
@require_POST
def request_mentor(request, mentor_id):
    mentor = get_object_or_404(User, id=mentor_id)
    if not _is_eligible_mentor(mentor):
        return JsonResponse({"ok": False, "error": "not eligible"}, status=400)
    obj, created = MentorshipRequest.objects.get_or_create(mentee=request.user, mentor=mentor)
    return JsonResponse({"ok": True, "created": created, "id": obj.id})


@login_required
def my_requests(request):
    incoming = MentorshipRequest.objects.filter(mentor=request.user).select_related("mentee", "mentee__profile")
    outgoing = MentorshipRequest.objects.filter(mentee=request.user).select_related("mentor", "mentor__profile")
    return render(request, "mentorship/requests.html", {"incoming": incoming, "outgoing": outgoing})


@login_required
@require_POST
def respond(request, req_id, action):
    req = get_object_or_404(MentorshipRequest, id=req_id, mentor=request.user)
    if action == "accept":
        req.status = MentorshipRequest.ACCEPTED
        req.save()
        slug = f"mentor-{req.id}"
        MentorshipRoom.objects.get_or_create(request=req, defaults={"slug": slug})
        award_badge(request.user, "mentor")
    elif action == "reject":
        req.status = MentorshipRequest.REJECTED
        req.save()
    return JsonResponse({"ok": True, "status": req.status})
