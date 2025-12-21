from django.contrib import admin
from .models import SearchHistory, RideCache


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'pickup_address', 'dropoff_address', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'pickup_address', 'dropoff_address')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(RideCache)
class RideCacheAdmin(admin.ModelAdmin):
    list_display = ('provider', 'pickup_lat', 'pickup_lng', 'dropoff_lat', 'dropoff_lng', 'expires_at', 'created_at')
    list_filter = ('provider', 'created_at', 'expires_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)