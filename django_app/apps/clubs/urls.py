from django.urls import path
from . import views

app_name = "clubs"
urlpatterns = [
    path("", views.club_list, name="list"),
    path("networking/", views.networking, name="networking"),
    path("<int:club_id>/", views.club_detail, name="detail"),
    path("events/<int:event_id>/react/", views.react, name="react"),
    path("events/<int:event_id>/comment/", views.comment, name="comment"),
]
