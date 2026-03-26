from django.db import models
from django.conf import settings
import uuid


class SearchHistory(models.Model):
    """Model to store user's ride search history"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="search_history")

    # Pickup location
    pickup_address = models.CharField(max_length=500)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()

    # Dropoff location
    dropoff_address = models.CharField(max_length=500)
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()

    pickup_time = models.DateTimeField(null=True, blank=True)

    # Full multi-stop route (Pickup + Stops + Dropoff)
    stops = models.JSONField(null=True, blank=True)

    # Store API results as JSON
    results = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "search_history"
        verbose_name = "Search History"
        verbose_name_plural = "Search History"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class RideCache(models.Model):
    """Model to cache ride provider API responses"""

    PROVIDER_CHOICES = [
        ("UBER", "Uber"),
        ("BOLT", "Bolt"),
        ("YANGO", "Yango"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=10, choices=PROVIDER_CHOICES)

    # Route coordinates
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()

    # Cached response
    response = models.JSONField()

    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ride_cache"
        verbose_name = "Ride Cache"
        verbose_name_plural = "Ride Caches"
        indexes = [
            models.Index(fields=["provider", "pickup_lat", "pickup_lng", "dropoff_lat", "dropoff_lng"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        return f"{self.provider} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"