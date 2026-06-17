from django.urls import path
from . import views

app_name = "rewards"
urlpatterns = [
    path("", views.marketplace, name="marketplace"),
    path("redeem/<int:item_id>/", views.redeem, name="redeem"),
    path("resume/", views.resume_builder, name="resume_builder"),
]
