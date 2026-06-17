from django.urls import path
from . import views

app_name = "checkins"
urlpatterns = [
    path("start/<int:habit_id>/", views.start_checkin, name="start"),
    path("answer/<int:checkin_id>/", views.answer_checkin, name="answer"),
    path("result/<int:checkin_id>/", views.checkin_result, name="result"),
    path("history/", views.history, name="history"),
]
