from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_POST
from apps.habits.models import Category
from apps.credits.services import spend_credits
from .models import Shield, ShieldTier, TIER_CONFIG


@login_required
def marketplace(request):
    categories = Category.objects.all()
    cat_id = request.GET.get("category")
    selected = get_object_or_404(Category, id=cat_id) if cat_id else categories.first()
    # expire stale shields
    Shield.objects.filter(user=request.user, status=Shield.ACTIVE, expires_at__lt=timezone.now()).update(status=Shield.EXPIRED)
    my_shields = Shield.objects.filter(user=request.user, category=selected)
    return render(request, "shields/marketplace.html", {
        "categories": categories,
        "selected": selected,
        "tiers": TIER_CONFIG,
        "my_shields": my_shields,
    })


@login_required
@require_POST
def purchase(request, category_id, tier):
    category = get_object_or_404(Category, id=category_id)
    if tier not in TIER_CONFIG:
        return JsonResponse({"ok": False, "error": "invalid tier"}, status=400)
    cfg = TIER_CONFIG[tier]
    if not spend_credits(request.user, category, cfg["cost"], f"Purchased {tier} shield"):
        messages.error(request, "Not enough credits in this category")
        return redirect("shields:marketplace")
    Shield.objects.create(user=request.user, category=category, tier=tier)
    messages.success(request, f"{tier.title()} shield activated")
    return redirect(f"{request.path[:-len('purchase/'+str(category_id)+'/'+tier+'/')]}?category={category.id}")


@login_required
@require_POST
def use_shield(request, shield_id):
    shield = get_object_or_404(Shield, id=shield_id, user=request.user, status=Shield.ACTIVE)
    shield.days_used += 1
    if shield.days_used >= shield.protects_days:
        shield.status = Shield.USED
    shield.save()
    return JsonResponse({"ok": True, "status": shield.status})
