from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("", include("apps.core.urls")),
    path("auth/", include("apps.accounts.urls")),
    path("habits/", include("apps.habits.urls")),
    path("checkins/", include("apps.checkins.urls")),
    path("credits/", include("apps.credits.urls")),
    path("shields/", include("apps.shields.urls")),
    path("clubs/", include("apps.clubs.urls")),
    path("chat/", include("apps.chat.urls")),
    path("mentorship/", include("apps.mentorship.urls")),
    path("rewards/", include("apps.rewards.urls")),
    path("badges/", include("apps.badges.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
