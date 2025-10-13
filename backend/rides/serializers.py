from rest_framework import serializers
from .models import RideOption

# Serializer for saved ride options in DB
class RideOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideOption
        fields = '__all__'

# Serializer for API estimates (no DB save)
class RideEstimateSerializer(serializers.Serializer):
    provider = serializers.CharField()
    category = serializers.CharField(allow_null=True)
    price = serializers.CharField(allow_null=True)
    eta_min = serializers.IntegerField(allow_null=True)
    distance_km = serializers.FloatField(allow_null=True)
    link = serializers.CharField(allow_null=True)
    error = serializers.CharField(required=False, allow_null=True)

# Serializer for booking/saving a ride
class RideBookSerializer(serializers.ModelSerializer):
    link = serializers.CharField()

    class Meta:
        model = RideOption
        fields = [
            'provider', 'category', 'price', 'eta_min',
            'distance_km', 'pickup_lat', 'pickup_lng',
            'dropoff_lat', 'dropoff_lng', 'link'
        ]