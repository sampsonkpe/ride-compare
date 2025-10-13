from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from .utils import get_ride_estimates
from .serializers import RideEstimateSerializer, RideBookSerializer
from .models import RideOption
import asyncio

class RideOptionsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        pickup_lat = request.query_params.get('pickup_lat')
        pickup_lng = request.query_params.get('pickup_lng')
        dropoff_lat = request.query_params.get('dropoff_lat')
        dropoff_lng = request.query_params.get('dropoff_lng')

        if not all([pickup_lat, pickup_lng, dropoff_lat, dropoff_lng]):
            return Response({"error": "All coordinates are required."}, status=400)

        try:
            pickup_lat, pickup_lng, dropoff_lat, dropoff_lng = map(float, 
                [pickup_lat, pickup_lng, dropoff_lat, dropoff_lng]
            )
        except ValueError:
            return Response({"error": "Invalid coordinate format."}, status=400)

        estimates = asyncio.run(get_ride_estimates(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng))
        serializer = RideEstimateSerializer(estimates, many=True)
        return Response({
            "pickup": f"{pickup_lat},{pickup_lng}",
            "dropoff": f"{dropoff_lat},{dropoff_lng}",
            "results": serializer.data
        })


class RideBookView(CreateAPIView):
    serializer_class = RideBookSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)