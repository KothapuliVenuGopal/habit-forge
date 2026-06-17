from django.urls import path
from . import views

app_name = "mentorship"
urlpatterns = [
    path("", views.mentors, name="mentors"),
    path("requests/", views.my_requests, name="requests"),
    path("request/<int:mentor_id>/", views.request_mentor, name="request_mentor"),
    path("respond/<int:req_id>/<str:action>/", views.respond, name="respond"),
]
