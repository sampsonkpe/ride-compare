from django.contrib import admin
from .models import Favourite

@admin.register(Favourite)
class FavouriteAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "label", "address", "lat", "lng", "created_at")
    list_filter = ("type", "created_at")
    search_fields = ("user__email", "label", "address")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)