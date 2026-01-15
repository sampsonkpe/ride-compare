from rest_framework import serializers
from .models import Favourite


class FavouriteSerializer(serializers.ModelSerializer):
    """Serializer for favourites"""
    
    class Meta:
        model = Favourite
        fields = ('id', 'pickup_address', 'pickup_lat', 'pickup_lng',
                  'dropoff_address', 'dropoff_lat', 'dropoff_lng',
                  'label', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def validate(self, attrs):
        """Validate that pickup and dropoff are different"""
        if (attrs.get('pickup_lat') == attrs.get('dropoff_lat') and 
            attrs.get('pickup_lng') == attrs.get('dropoff_lng')):
            raise serializers.ValidationError(
                "Pickup and dropoff locations must be different"
            )
        return attrs


class FavouriteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating favourites"""
    
    class Meta:
        model = Favourite
        fields = ('pickup_address', 'pickup_lat', 'pickup_lng',
                  'dropoff_address', 'dropoff_lat', 'dropoff_lng',
                  'label')
    
    def create(self, validated_data):
        # Add user from request context
        user = self.context['request'].user
        return Favourite.objects.create(user=user, **validated_data)