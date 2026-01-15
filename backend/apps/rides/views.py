from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .serializers import (
    RideCompareRequestSerializer,
    RideCompareResponseSerializer,
    SearchHistorySerializer
)
from .models import SearchHistory
from .services.uber_service import UberService
from .services.bolt_service import BoltService
from .services.yango_service import YangoService


class RideCompareView(APIView):
    """API endpoint to compare rides across multiple providers"""
    
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        # Validate request data
        serializer = RideCompareRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        pickup = serializer.validated_data['pickup']
        dropoff = serializer.validated_data['dropoff']
        
        # Initialize provider services
        uber = UberService()
        bolt = BoltService()
        yango = YangoService()
        
        # Fetch prices from all providers
        rides = []
        
        try:
            uber_price = uber.get_price_estimate(
                pickup['lat'], pickup['lng'],
                dropoff['lat'], dropoff['lng']
            )
            rides.append(uber_price)
        except Exception as e:
            print(f"Uber API error: {e}")
        
        try:
            bolt_price = bolt.get_price_estimate(
                pickup['lat'], pickup['lng'],
                dropoff['lat'], dropoff['lng']
            )
            rides.append(bolt_price)
        except Exception as e:
            print(f"Bolt API error: {e}")
        
        try:
            yango_price = yango.get_price_estimate(
                pickup['lat'], pickup['lng'],
                dropoff['lat'], dropoff['lng']
            )
            rides.append(yango_price)
        except Exception as e:
            print(f"Yango API error: {e}")
        
        # Sort by price (cheapest first)
        rides.sort(key=lambda x: x['price'])
        
        # Prepare response
        response_data = {
            'rides': rides,
            'timestamp': timezone.now()
        }
        
        # Save to search history
        SearchHistory.objects.create(
            user=request.user,
            pickup_address=pickup['address'],
            pickup_lat=pickup['lat'],
            pickup_lng=pickup['lng'],
            dropoff_address=dropoff['address'],
            dropoff_lat=dropoff['lat'],
            dropoff_lng=dropoff['lng'],
            results=rides
        )
        
        return Response(response_data, status=status.HTTP_200_OK)


class SearchHistoryListView(generics.ListAPIView):
    """API endpoint to get user's search history"""
    
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = SearchHistorySerializer
    
    def get_queryset(self):
        # Return only current user's history, most recent first
        return SearchHistory.objects.filter(user=self.request.user).order_by('-created_at')[:20]


class SearchHistoryDeleteView(generics.DestroyAPIView):
    """API endpoint to delete a specific search history item"""
    
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = SearchHistorySerializer
    
    def get_queryset(self):
        # Users can only delete their own history
        return SearchHistory.objects.filter(user=self.request.user)


class SearchHistoryClearView(APIView):
    """API endpoint to clear all search history"""
    
    permission_classes = (permissions.IsAuthenticated,)
    
    def delete(self, request):
        # Delete all history for current user
        deleted_count = SearchHistory.objects.filter(user=request.user).delete()[0]
        
        return Response({
            'message': f'Deleted {deleted_count} search history items',
            'deleted_count': deleted_count
        }, status=status.HTTP_200_OK)