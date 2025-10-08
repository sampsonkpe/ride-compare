from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class RideOption(models.Model):
    
    # Stores actual booked rides per user.
    STATUS_CHOICES = [
        ('booked', 'Booked'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ride_requests')
    provider = models.CharField(max_length=20)
    category = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    eta_min = models.IntegerField()
    distance_km = models.DecimalField(max_digits=6, decimal_places=2)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()
    link = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.provider} - {self.category} - {self.price}"