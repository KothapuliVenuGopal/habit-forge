from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_POST
from apps.habits.models import Habit
from .models import CheckIn
from .ai import generate_questions, score_answers
from apps.credits.services import award_credits
from apps.badges.services import maybe_award_streak_badges
from apps.clubs.services import maybe_unlock_clubs
from apps.accounts.models import Profile


def _recompute_streaks(user):
    dates = list(
        CheckIn.objects.filter(user=user, status=CheckIn.VERIFIED)
        .values_list("check_date", flat=True)
        .distinct()
        .order_by("-check_date")
    )
    if not dates:
        return 0
    streak = 1
    for i in range(1, len(dates)):
        if (dates[i - 1] - dates[i]).days == 1:
            streak += 1
        else:
            break
    profile = user.profile
    profile.current_streak = streak
    profile.longest_streak = max(profile.longest_streak, streak)
    verified = CheckIn.objects.filter(user=user, status=CheckIn.VERIFIED).count()
    total = CheckIn.objects.filter(user=user).count()
    profile.verification_accuracy = int((verified / total) * 100) if total else 0
    profile.consistency_score = min(100, (profile.verification_accuracy * 60 // 100) + min(40, streak))
    profile.save()
    return streak


@login_required
def start_checkin(request, habit_id):
    habit = get_object_or_404(Habit, id=habit_id, user=request.user)
    if request.method == "POST":
        payload = {k: v for k, v in request.POST.items() if k != "csrfmiddlewaretoken"}
        proof = request.FILES.get("proof_image")
        ci = CheckIn.objects.create(
            user=request.user,
            habit=habit,
            category=habit.category,
            check_date=timezone.now().date(),
            payload=payload,
            proof_image=proof,
        )
        ci.ai_questions = generate_questions(habit.category.slug, payload)
        ci.save()
        return redirect("checkins:answer", checkin_id=ci.id)
    return render(request, "checkins/start.html", {"habit": habit})


@login_required
def answer_checkin(request, checkin_id):
    ci = get_object_or_404(CheckIn, id=checkin_id, user=request.user)
    if request.method == "POST":
        answers = [request.POST.get(f"q{i}", "") for i in range(len(ci.ai_questions))]
        ci.ai_answers = answers
        result = score_answers(ci.category.slug, ci.ai_questions, answers, ci.payload)
        ci.verification_score = result["score"]
        ci.confidence_score = result["confidence"]
        ci.ai_feedback = result["feedback"]
        if ci.verification_score >= 60:
            ci.status = CheckIn.VERIFIED
            credits = 10 + (5 if ci.verification_score >= 90 else 0)
            ci.credits_awarded = credits
            ci.save()
            award_credits(request.user, ci.category, credits, "Verified check-in")
            streak = _recompute_streaks(request.user)
            bonus = {7: 50, 30: 200, 100: 1000}.get(streak)
            if bonus:
                award_credits(request.user, ci.category, bonus, f"{streak}-day streak bonus")
                ci.credits_awarded += bonus
                ci.save()
            maybe_award_streak_badges(request.user, streak)
            maybe_unlock_clubs(request.user, streak, ci.category)
            request.user.profile.xp += ci.credits_awarded
            request.user.profile.level = 1 + request.user.profile.xp // 500
            request.user.profile.save()
        else:
            ci.status = CheckIn.REJECTED
            ci.save()
            _recompute_streaks(request.user)
        return redirect("checkins:result", checkin_id=ci.id)
    return render(request, "checkins/answer.html", {"ci": ci})


@login_required
def checkin_result(request, checkin_id):
    ci = get_object_or_404(CheckIn, id=checkin_id, user=request.user)
    return render(request, "checkins/result.html", {"ci": ci})


@login_required
def history(request):
    qs = CheckIn.objects.filter(user=request.user).select_related("habit", "category")
    return render(request, "checkins/history.html", {"checkins": qs[:200]})
