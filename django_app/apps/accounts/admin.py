from django.contrib import admin
from .models import User, Profile, FriendRequest, Friendship, Block, Report

admin.site.register(User)
admin.site.register(Profile)
admin.site.register(FriendRequest)
admin.site.register(Friendship)
admin.site.register(Block)
admin.site.register(Report)
