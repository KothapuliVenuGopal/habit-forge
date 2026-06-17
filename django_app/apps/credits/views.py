from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import CreditBalance, CreditTransaction


@login_required
def wallet(request):
    balances = CreditBalance.objects.filter(user=request.user).select_related("category")
    txns = CreditTransaction.objects.filter(user=request.user).select_related("category")[:100]
    return render(request, "credits/wallet.html", {"balances": balances, "transactions": txns})
