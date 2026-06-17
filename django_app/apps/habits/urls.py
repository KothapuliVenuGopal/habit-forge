from django.urls import path
from . import views

app_name = "habits"
urlpatterns = [
    path("", views.habit_list, name="list"),
    path("create/", views.habit_create, name="create"),
    path("<int:habit_id>/", views.habit_detail, name="detail"),
    path("<int:habit_id>/edit/", views.habit_edit, name="edit"),
    path("<int:habit_id>/category/", views.habit_change_category, name="change_category"),
    path("<int:habit_id>/archive/", views.habit_archive, name="archive"),
    path("<int:habit_id>/delete/", views.habit_delete, name="delete"),
]
