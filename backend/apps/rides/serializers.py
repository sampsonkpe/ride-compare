from rest_framework import serializers
from .models import SearchHistory, RideCache


class LocationSerializer(serializers.Serializer):
    """Serializer for location data"""
    address = serializers.CharField(max_length=500)
    lat = serializers.FloatField()
    lng = serializers.FloatField()


class RideCompareRequestSerializer(serializers.Serializer):
    """Serializer for ride comparison request"""
    pickup = LocationSerializer()
    dropoff = LocationSerializer()


class RideOptionSerializer(serializers.Serializer):
    """Serializer for individual ride option"""
    provider = serializers.CharField()
    service_type = serializers.CharField()
    price = serializers.FloatField()
    currency = serializers.CharField()
    eta_minutes = serializers.IntegerField()
    distance_km = serializers.FloatField()
    surge_multiplier = serializers.FloatField(required=False, allow_null=True)


class RideCompareResponseSerializer(serializers.Serializer):
    """Serializer for ride comparison response"""
    rides = RideOptionSerializer(many=True)
    timestamp = serializers.DateTimeField()


class SearchHistorySerializer(serializers.ModelSerializer):
    """Serializer for search history"""
    
    class Meta:
        model = SearchHistory
        fields = ('id', 'pickup_address', 'pickup_lat', 'pickup_lng', 
                  'dropoff_address', 'dropoff_lat', 'dropoff_lng', 
                  'results', 'created_at')
        read_only_fields = ('id', 'created_at')