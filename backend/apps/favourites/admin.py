from django.contrib import admin
from .models import Favourite


@admin.register(Favourite)
class FavouriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'label', 'pickup_address', 'dropoff_address', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'label', 'pickup_address', 'dropoff_address')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)