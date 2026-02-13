from django.db import models
from django.conf import settings
import uuid


class Favourite(models.Model):
    """Model to store user's saved places (Home/Work/Other)."""

    class PlaceType(models.TextChoices):
        HOME = "HOME", "Home"
        WORK = "WORK", "Work"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favourites",
    )

    type = models.CharField(max_length=10, choices=PlaceType.choices, default=PlaceType.OTHER)
    label = models.CharField(max_length=100, blank=True, null=True)

    address = models.CharField(max_length=500)
    lat = models.FloatField()
    lng = models.FloatField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favourites"
        verbose_name = "Favourite"
        verbose_name_plural = "Favourites"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.type} - {self.label or self.address}"