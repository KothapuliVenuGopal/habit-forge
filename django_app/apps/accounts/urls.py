from django.urls import path
from . import views

app_name = "accounts"
urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("register/", views.register_view, name="register"),
    path("logout/", views.logout_view, name="logout"),
    path("password-reset/", views.password_reset_view, name="password_reset"),
    path("profile/", views.profile_view, name="profile"),
    path("profile/<str:username>/", views.public_profile, name="public_profile"),
    path("settings/", views.settings_view, name="settings"),
    path("friends/request/<int:user_id>/", views.send_friend_request, name="send_friend_request"),
    path("friends/respond/<int:req_id>/<str:action>/", views.respond_friend_request, name="respond_friend_request"),
    path("block/<int:user_id>/", views.block_user, name="block_user"),
    path("report/", views.report_user, name="report_user"),
]
