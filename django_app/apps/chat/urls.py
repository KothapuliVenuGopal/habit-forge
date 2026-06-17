from django.urls import path
from . import views

app_name = "chat"
urlpatterns = [
    path("global/", views.global_chat, name="global"),
    path("club/<int:club_id>/", views.club_chat, name="club"),
    path("dm/<int:user_id>/", views.dm, name="dm"),
    path("inbox/", views.inbox, name="inbox"),
]
