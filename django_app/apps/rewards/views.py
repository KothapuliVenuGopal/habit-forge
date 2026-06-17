import io
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from apps.credits.services import spend_credits
from .models import RewardItem, Redemption


@login_required
def marketplace(request):
    items = RewardItem.objects.filter(available=True).select_related("category")
    return render(request, "rewards/marketplace.html", {"items": items})


@login_required
@require_POST
def redeem(request, item_id):
    item = get_object_or_404(RewardItem, id=item_id, available=True)
    if not spend_credits(request.user, item.category, item.cost, f"Redeemed: {item.name}"):
        messages.error(request, "Not enough credits in this category")
        return redirect("rewards:marketplace")
    Redemption.objects.create(user=request.user, item=item)
    messages.success(request, f"Redeemed {item.name}")
    if item.kind == "resume_builder":
        return redirect("rewards:resume_builder")
    return redirect("rewards:marketplace")


@login_required
def resume_builder(request):
    if request.method == "POST":
        data = {
            "name": request.POST.get("name", "")[:120],
            "email": request.POST.get("email", "")[:200],
            "summary": request.POST.get("summary", "")[:2000],
            "skills": request.POST.get("skills", "")[:1000],
            "experience": request.POST.get("experience", "")[:5000],
            "education": request.POST.get("education", "")[:2000],
        }
        return _render_pdf(data)
    return render(request, "rewards/resume_builder.html")


def _render_pdf(data):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter
    y = height - 50
    c.setFont("Helvetica-Bold", 22)
    c.drawString(50, y, data["name"]); y -= 24
    c.setFont("Helvetica", 11)
    c.drawString(50, y, data["email"]); y -= 24
    for title, key in [("Summary", "summary"), ("Skills", "skills"), ("Experience", "experience"), ("Education", "education")]:
        c.setFont("Helvetica-Bold", 13); c.drawString(50, y, title); y -= 16
        c.setFont("Helvetica", 10)
        for line in (data[key] or "").split("\n"):
            for chunk in [line[i:i+95] for i in range(0, len(line), 95)] or [""]:
                if y < 60:
                    c.showPage(); y = height - 50
                    c.setFont("Helvetica", 10)
                c.drawString(50, y, chunk); y -= 13
        y -= 8
    c.showPage(); c.save()
    pdf = buf.getvalue(); buf.close()
    resp = HttpResponse(pdf, content_type="application/pdf")
    resp["Content-Disposition"] = "attachment; filename=resume.pdf"
    return resp
