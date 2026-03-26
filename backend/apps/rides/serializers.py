from rest_framework import serializers
from .models import SearchHistory, RideCache


class LocationSerializer(serializers.Serializer):
    """Serializer for location data"""
    address = serializers.CharField(max_length=500)
    lat = serializers.FloatField()
    lng = serializers.FloatField()


class StopSerializer(serializers.Serializer):
    """Single stop in a multi-stop route."""
    kind = serializers.ChoiceField(choices=["PICKUP", "STOP", "DROPOFF"])
    address = serializers.CharField(max_length=500)
    lat = serializers.FloatField()
    lng = serializers.FloatField()


class RideCompareRequestSerializer(serializers.Serializer):
    """
    Backwards compatible:
    - Old format: pickup + dropoff
    - New format: stops[]
    """
    pickup = LocationSerializer(required=False)
    dropoff = LocationSerializer(required=False)
    stops = StopSerializer(many=True, required=False)
    pickup_time = serializers.DateTimeField(required=False)

    def validate(self, attrs):
        stops = attrs.get("stops")
        pickup = attrs.get("pickup")
        dropoff = attrs.get("dropoff")

        if stops is None:
            # Old format
            if not pickup or not dropoff:
                raise serializers.ValidationError("Provide either stops[] or pickup & dropoff.")
            # Normalise to stops[] internally for the view
            attrs["stops"] = [
                {"kind": "PICKUP", **pickup},
                {"kind": "DROPOFF", **dropoff},
            ]
            return attrs

        # New format
        if not isinstance(stops, list) or len(stops) < 2:
            raise serializers.ValidationError("stops must include at least PICKUP and DROPOFF.")

        if len(stops) > 5:
            raise serializers.ValidationError("Maximum of 5 points allowed (pickup + 3 stops + dropoff).")

        first = stops[0]
        last = stops[-1]

        if first.get("kind") != "PICKUP":
            raise serializers.ValidationError("First stop must be kind=PICKUP.")
        if last.get("kind") != "DROPOFF":
            raise serializers.ValidationError("Last stop must be kind=DROPOFF.")

        middle = stops[1:-1]
        for i, s in enumerate(middle, start=1):
            if s.get("kind") != "STOP":
                raise serializers.ValidationError(f"Stop at index {i} must be kind=STOP.")

        pickup_time = attrs.get("pickup_time")

        if pickup_time:
            from django.utils import timezone

            if pickup_time < timezone.now():
                raise serializers.ValidationError("pickup_time cannot be in the past.")

        return attrs


class RideOptionSerializer(serializers.Serializer):
    """Serializer for individual ride option"""
    provider = serializers.CharField()
    service_type = serializers.CharField()
    price = serializers.FloatField()
    currency = serializers.CharField()
    eta_minutes = serializers.IntegerField()
    distance_km = serializers.FloatField()
    surge_multiplier = serializers.FloatField(required=False, allow_null=True)
    legs = serializers.ListField(child=serializers.DictField(), required=False)


class RideCompareResponseSerializer(serializers.Serializer):
    """Serializer for ride comparison response"""
    rides = RideOptionSerializer(many=True)
    timestamp = serializers.DateTimeField()


class SearchHistorySerializer(serializers.ModelSerializer):
    """Serializer for search history"""

    class Meta:
        model = SearchHistory
        fields = (
            "id",
            "pickup_address",
            "pickup_lat",
            "pickup_lng",
            "dropoff_address",
            "dropoff_lat",
            "dropoff_lng",
            "stops",
            "results",
            "created_at",
            "pickup_time",
        )
        read_only_fields = ("id", "created_at")