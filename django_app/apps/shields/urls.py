from django.urls import path
from . import views

app_name = "shields"
urlpatterns = [
    path("", views.marketplace, name="marketplace"),
    path("purchase/<int:category_id>/<str:tier>/", views.purchase, name="purchase"),
    path("use/<int:shield_id>/", views.use_shield, name="use"),
]
