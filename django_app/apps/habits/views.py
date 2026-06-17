from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from .models import Habit, Category


@login_required
def habit_list(request):
    habits = Habit.objects.filter(user=request.user, status=Habit.ACTIVE).select_related("category")
    return render(request, "habits/list.html", {"habits": habits, "categories": Category.objects.all()})


@login_required
def habit_create(request):
    if request.method == "POST":
        category = get_object_or_404(Category, id=request.POST.get("category"))
        habit = Habit.objects.create(
            user=request.user,
            category=category,
            name=request.POST.get("name", "").strip()[:120],
            description=request.POST.get("description", ""),
            target_per_week=int(request.POST.get("target_per_week") or 7),
        )
        return redirect("habits:detail", habit_id=habit.id)
    return render(request, "habits/form.html", {"categories": Category.objects.all()})


@login_required
def habit_detail(request, habit_id):
    habit = get_object_or_404(Habit, id=habit_id, user=request.user)
    checkins = habit.checkins.order_by("-created_at")[:30]
    return render(request, "habits/detail.html", {"habit": habit, "checkins": checkins})


@login_required
def habit_edit(request, habit_id):
    habit = get_object_or_404(Habit, id=habit_id, user=request.user)
    if request.method == "POST":
        habit.name = request.POST.get("name", habit.name)[:120]
        habit.description = request.POST.get("description", habit.description)
        habit.target_per_week = int(request.POST.get("target_per_week") or habit.target_per_week)
        habit.save()
        return redirect("habits:detail", habit_id=habit.id)
    return render(request, "habits/form.html", {"habit": habit, "categories": Category.objects.all()})


@login_required
@require_POST
def habit_change_category(request, habit_id):
    habit = get_object_or_404(Habit, id=habit_id, user=request.user)
    category = get_object_or_404(Category, id=request.POST.get("category_id"))
    habit.category = category
    habit.save()
    return JsonResponse({"ok": True, "category": category.name})


@login_required
@require_POST
def habit_archive(request, habit_id):
    habit = get_object_or_404(Habit, id=habit_id, user=request.user)
    habit.status = Habit.ARCHIVED
    habit.save()
    return JsonResponse({"ok": True})


@login_required
@require_POST
def habit_delete(request, habit_id):
    habit = get_object_or_404(Habit, id=habit_id, user=request.user)
    habit.delete()
    return JsonResponse({"ok": True})
