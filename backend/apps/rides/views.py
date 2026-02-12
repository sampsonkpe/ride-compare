from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .serializers import (
    RideCompareRequestSerializer,
    SearchHistorySerializer,
)
from .models import SearchHistory
from .services.uber_service import UberService
from .services.bolt_service import BoltService
from .services.yango_service import YangoService


class RideCompareView(APIView):
    """
    Public endpoint: compares rides across providers.
    If the request user is authenticated, we save the search to history.
    """

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RideCompareRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        pickup = serializer.validated_data["pickup"]
        dropoff = serializer.validated_data["dropoff"]

        uber = UberService()
        bolt = BoltService()
        yango = YangoService()

        rides = []

        try:
            uber_price = uber.get_price_estimate(
                pickup["lat"], pickup["lng"],
                dropoff["lat"], dropoff["lng"]
            )
            if uber_price:
                rides.append(uber_price)
        except Exception as e:
            print(f"Uber API error: {e}")

        try:
            bolt_price = bolt.get_price_estimate(
                pickup["lat"], pickup["lng"],
                dropoff["lat"], dropoff["lng"]
            )
            if bolt_price:
                rides.append(bolt_price)
        except Exception as e:
            print(f"Bolt API error: {e}")

        try:
            yango_price = yango.get_price_estimate(
                pickup["lat"], pickup["lng"],
                dropoff["lat"], dropoff["lng"]
            )
            if yango_price:
                rides.append(yango_price)
        except Exception as e:
            print(f"Yango API error: {e}")

        # If all providers fail, return a friendly error
        if not rides:
            return Response(
                {
                    "rides": [],
                    "timestamp": timezone.now(),
                    "message": "No providers returned results. Please try again.",
                },
                status=status.HTTP_200_OK,
            )

        # Sort by price (cheapest first). Any missing/invalid price goes last.
        def safe_price(x):
            try:
                return float(x.get("price"))
            except Exception:
                return float("inf")

        rides.sort(key=safe_price)

        response_data = {
            "rides": rides,
            "timestamp": timezone.now(),
        }

        # --- Save history ONLY if authenticated ---
        if request.user.is_authenticated:
            SearchHistory.objects.create(
                user=request.user,
                pickup_address=pickup["address"],
                pickup_lat=pickup["lat"],
                pickup_lng=pickup["lng"],
                dropoff_address=dropoff["address"],
                dropoff_lat=dropoff["lat"],
                dropoff_lng=dropoff["lng"],
                results=rides,
            )

        return Response(response_data, status=status.HTTP_200_OK)


class SearchHistoryListView(generics.ListAPIView):
    """Authenticated endpoint: get user's search history"""

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = SearchHistorySerializer

    def get_queryset(self):
        return (
            SearchHistory.objects
            .filter(user=self.request.user)
            .order_by("-created_at")[:20]
        )


class SearchHistoryDeleteView(generics.DestroyAPIView):
    """Authenticated endpoint: delete a specific history item"""

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = SearchHistorySerializer

    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user)


class SearchHistoryClearView(APIView):
    """Authenticated endpoint: clear all search history"""

    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request):
        deleted_count = SearchHistory.objects.filter(user=request.user).delete()[0]
        return Response(
            {
                "message": f"Deleted {deleted_count} search history items",
                "deleted_count": deleted_count,
            },
            status=status.HTTP_200_OK,
        )