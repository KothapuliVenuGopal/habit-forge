from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordResetForm
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.utils import timezone
from .models import Profile, FriendRequest, Friendship, Block, Report

User = get_user_model()


def login_view(request):
    if request.method == "POST":
        user = authenticate(request, username=request.POST.get("username"), password=request.POST.get("password"))
        if user:
            login(request, user)
            return redirect("core:dashboard")
        messages.error(request, "Invalid credentials")
    return render(request, "registration/login.html")


def register_view(request):
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        accepted = request.POST.get("accept_terms") == "on"
        if not accepted:
            messages.error(request, "You must accept the terms to register.")
            return render(request, "registration/register.html")
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already taken")
        elif User.objects.filter(email=email).exists():
            messages.error(request, "Email already in use")
        else:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.profile.accepted_terms_at = timezone.now()
            user.profile.save()
            login(request, user)
            return redirect("core:dashboard")
    return render(request, "registration/register.html")


def logout_view(request):
    logout(request)
    return redirect("core:landing")


def password_reset_view(request):
    if request.method == "POST":
        form = PasswordResetForm(request.POST)
        if form.is_valid():
            form.save(request=request, email_template_name="registration/password_reset_email.html")
            messages.success(request, "If an account exists, you'll receive an email shortly.")
            return redirect("accounts:login")
    return render(request, "registration/password_reset.html")


@login_required
def profile_view(request):
    return render(request, "accounts/profile.html", {"profile": request.user.profile})


@login_required
def public_profile(request, username):
    user = get_object_or_404(User, username=username)
    return render(request, "accounts/public_profile.html", {"user_obj": user, "profile": user.profile})


@login_required
def settings_view(request):
    profile = request.user.profile
    if request.method == "POST":
        profile.display_name = request.POST.get("display_name", profile.display_name)
        profile.bio = request.POST.get("bio", profile.bio)
        profile.dms_enabled = request.POST.get("dms_enabled") == "on"
        if "avatar" in request.FILES:
            profile.avatar = request.FILES["avatar"]
        profile.save()
        messages.success(request, "Settings updated")
        return redirect("accounts:settings")
    return render(request, "accounts/settings.html", {"profile": profile})


@login_required
def send_friend_request(request, user_id):
    to_user = get_object_or_404(User, id=user_id)
    if to_user == request.user:
        return JsonResponse({"ok": False, "error": "self"}, status=400)
    fr, created = FriendRequest.objects.get_or_create(from_user=request.user, to_user=to_user)
    return JsonResponse({"ok": True, "created": created, "id": fr.id})


@login_required
def respond_friend_request(request, req_id, action):
    fr = get_object_or_404(FriendRequest, id=req_id, to_user=request.user)
    if action == "accept":
        fr.status = FriendRequest.ACCEPTED
        fr.save()
        a, b = sorted([request.user.id, fr.from_user.id])
        Friendship.objects.get_or_create(user_a_id=a, user_b_id=b)
    elif action == "reject":
        fr.status = FriendRequest.REJECTED
        fr.save()
    return JsonResponse({"ok": True, "status": fr.status})


@login_required
def block_user(request, user_id):
    target = get_object_or_404(User, id=user_id)
    Block.objects.get_or_create(blocker=request.user, blocked=target)
    return JsonResponse({"ok": True})


@login_required
def report_user(request):
    if request.method == "POST":
        Report.objects.create(
            reporter=request.user,
            target_user_id=request.POST.get("target_user_id") or None,
            context=request.POST.get("context", ""),
            reason=request.POST.get("reason", ""),
        )
        return JsonResponse({"ok": True})
    return JsonResponse({"ok": False}, status=405)
