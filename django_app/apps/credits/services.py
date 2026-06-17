from django.db import transaction
from .models import CreditBalance, CreditTransaction


@transaction.atomic
def award_credits(user, category, amount: int, reason: str):
    bal, _ = CreditBalance.objects.select_for_update().get_or_create(user=user, category=category)
    bal.balance += amount
    if amount > 0:
        bal.lifetime_earned += amount
    bal.save()
    CreditTransaction.objects.create(user=user, category=category, amount=amount, reason=reason)
    return bal


@transaction.atomic
def spend_credits(user, category, amount: int, reason: str) -> bool:
    bal, _ = CreditBalance.objects.select_for_update().get_or_create(user=user, category=category)
    if bal.balance < amount:
        return False
    bal.balance -= amount
    bal.save()
    CreditTransaction.objects.create(user=user, category=category, amount=-amount, reason=reason)
    return True
