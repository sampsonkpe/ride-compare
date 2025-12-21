from django.db import models
from django.conf import settings
import uuid


class Favourite(models.Model):
    """Model to store user's favourite routes"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favourites')
    
    # Pickup location
    pickup_address = models.CharField(max_length=500)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    
    # Dropoff location
    dropoff_address = models.CharField(max_length=500)
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()
    
    # Optional label (e.g., "Home to Work")
    label = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'favourites'
        verbose_name = 'Favourite'
        verbose_name_plural = 'Favourites'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.label or 'Unnamed route'}"