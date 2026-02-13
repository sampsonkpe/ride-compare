from rest_framework import serializers
from .models import Favourite


class FavouriteSerializer(serializers.ModelSerializer):
    """Serializer for saved places"""

    class Meta:
        model = Favourite
        fields = (
            "id",
            "type",
            "label",
            "address",
            "lat",
            "lng",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class FavouriteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating saved places"""

    class Meta:
        model = Favourite
        fields = (
            "type",
            "label",
            "address",
            "lat",
            "lng",
        )

    def validate_type(self, value):
        v = (value or "").upper().strip()
        if v not in ("HOME", "WORK", "OTHER"):
            raise serializers.ValidationError("Type must be HOME, WORK, or OTHER.")
        return v

    def validate_label(self, value):
        return (value or "").strip()

    def validate(self, attrs):
        address = (attrs.get("address") or "").strip()
        if not address:
            raise serializers.ValidationError({"address": "Address is required."})

        lat = attrs.get("lat", None)
        lng = attrs.get("lng", None)
        if lat is None:
            raise serializers.ValidationError({"lat": "Latitude is required."})
        if lng is None:
            raise serializers.ValidationError({"lng": "Longitude is required."})

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        return Favourite.objects.create(user=user, **validated_data)