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


def _safe_float(x, default=0.0):
    try:
        return float(x)
    except Exception:
        return default


def _safe_int(x, default=0):
    try:
        return int(x)
    except Exception:
        return default


def _aggregate_route_quotes(leg_quotes):
    if not leg_quotes:
        return None

    first = leg_quotes[0]

    total_price = 0.0
    total_distance = 0.0
    # Keep ETA as "time to pickup" (closest behaviour to what users expect)
    eta_minutes = _safe_int(first.get("eta_minutes"), 0)

    surges = []
    legs_out = []

    for idx, q in enumerate(leg_quotes):
        total_price += _safe_float(q.get("price"), 0.0)
        total_distance += _safe_float(q.get("distance_km"), 0.0)

        sm = q.get("surge_multiplier", None)
        if sm is not None:
            surges.append(_safe_float(sm, 0.0))

        legs_out.append(
            {
                "from_index": idx,
                "to_index": idx + 1,
                "price": _safe_float(q.get("price"), 0.0),
                "distance_km": _safe_float(q.get("distance_km"), 0.0),
                "eta_minutes": _safe_int(q.get("eta_minutes"), 0),
                "surge_multiplier": q.get("surge_multiplier", None),
            }
        )

    out = {
        "provider": first.get("provider"),
        "service_type": first.get("service_type"),
        "price": round(total_price, 2),
        "currency": first.get("currency", "GHS"),
        "eta_minutes": eta_minutes,
        "distance_km": round(total_distance, 2),
        "surge_multiplier": (max(surges) if surges else None),
        "legs": legs_out,
    }

    return out


def _quote_route(service, stops):
    """
    Stops: list of dicts: [{"kind":..., "lat":..., "lng":..., ...}, ...]
    Returns aggregated quote dict, or None if provider fails any leg.
    """
    leg_quotes = []

    for i in range(len(stops) - 1):
        a = stops[i]
        b = stops[i + 1]

        quote = service.get_price_estimate(
            a["lat"], a["lng"],
            b["lat"], b["lng"]
        )
        if not quote:
            return None

        leg_quotes.append(quote)

    return _aggregate_route_quotes(leg_quotes)


class RideCompareView(APIView):
    """
    Public endpoint: compares rides across providers.
    If the request user is authenticated, save the search to history.

    Supports:
    - Legacy payload: {pickup: {...}, dropoff: {...}}
    - New payload: {stops: [{kind,address,lat,lng}, ...]}
    """

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RideCompareRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stops = serializer.validated_data["stops"]

        pickup = stops[0]
        dropoff = stops[-1]

        uber = UberService()
        bolt = BoltService()
        yango = YangoService()

        rides = []

        try:
            uber_price = _quote_route(uber, stops)
            if uber_price:
                rides.append(uber_price)
        except Exception as e:
            print(f"Uber API error: {e}")

        try:
            bolt_price = _quote_route(bolt, stops)
            if bolt_price:
                rides.append(bolt_price)
        except Exception as e:
            print(f"Bolt API error: {e}")

        try:
            yango_price = _quote_route(yango, stops)
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
                stops=stops,
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