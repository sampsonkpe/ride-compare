import os
import httpx
import asyncio
from geopy.distance import geodesic

# Load API keys from environment variables (use dev keys if not set)
UBER_API_KEY = os.environ.get("UBER_API_KEY", "DEV_UBER_KEY")
BOLT_API_KEY = os.environ.get("BOLT_API_KEY", "DEV_BOLT_KEY")
YANGO_API_KEY = os.environ.get("YANGO_API_KEY", "DEV_YANGO_KEY")

# Replace with actual provider API URLs
UBER_API_URL = "https://api.uber.com/v1.2/estimates/price"
BOLT_API_URL = "https://api.bolt.eu/v1/estimate"
YANGO_API_URL = "https://api.yango.com/v1/estimate"


async def fetch_uber(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
    try:
        headers = {"Authorization": f"Bearer {UBER_API_KEY}"}
        params = {
            "start_latitude": pickup_lat,
            "start_longitude": pickup_lng,
            "end_latitude": dropoff_lat,
            "end_longitude": dropoff_lng
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(UBER_API_URL, headers=headers, params=params, timeout=10)
            data = response.json()
            results = []
            for ride in data.get("prices", []):
                results.append({
                    "provider": "Uber",
                    "category": ride.get("display_name"),
                    "price": f"GHS {ride.get('estimate')}" if ride.get('estimate') else None,
                    "eta_min": ride.get("duration", 0) // 60 if ride.get("duration") else None,
                    "distance_km": ride.get("distance"),
                    "link": f"uber://?action=setPickup&pickup={pickup_lat},{pickup_lng}&dropoff={dropoff_lat},{dropoff_lng}",
                    "error": None
                })
            if not results:
                results.append({
                    "provider": "Uber",
                    "category": None,
                    "price": None,
                    "eta_min": None,
                    "distance_km": None,
                    "link": None,
                    "error": "Location not available"
                })
            return results
    except Exception:
        return [{
            "provider": "Uber",
            "category": None,
            "price": None,
            "eta_min": None,
            "distance_km": None,
            "link": None,
            "error": "Location not available"
        }]


async def fetch_bolt(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
    try:
        headers = {"Authorization": f"Bearer {BOLT_API_KEY}"}
        params = {
            "pickup_lat": pickup_lat,
            "pickup_lng": pickup_lng,
            "dropoff_lat": dropoff_lat,
            "dropoff_lng": dropoff_lng
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(BOLT_API_URL, headers=headers, params=params, timeout=10)
            data = response.json()
            results = []
            for ride in data.get("rides", []):
                results.append({
                    "provider": "Bolt",
                    "category": ride.get("name"),
                    "price": f"GHS {ride.get('price')}" if ride.get('price') else None,
                    "eta_min": ride.get("eta"),
                    "distance_km": ride.get("distance"),
                    "link": f"bolt://?pickup={pickup_lat},{pickup_lng}&dropoff={dropoff_lat},{dropoff_lng}",
                    "error": None
                })
            if not results:
                results.append({
                    "provider": "Bolt",
                    "category": None,
                    "price": None,
                    "eta_min": None,
                    "distance_km": None,
                    "link": None,
                    "error": "Location not available"
                })
            return results
    except Exception:
        return [{
            "provider": "Bolt",
            "category": None,
            "price": None,
            "eta_min": None,
            "distance_km": None,
            "link": None,
            "error": "Location not available"
        }]


async def fetch_yango(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
    try:
        headers = {"Authorization": f"Bearer {YANGO_API_KEY}"}
        params = {
            "pickup_lat": pickup_lat,
            "pickup_lng": pickup_lng,
            "dropoff_lat": dropoff_lat,
            "dropoff_lng": dropoff_lng
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(YANGO_API_URL, headers=headers, params=params, timeout=10)
            data = response.json()
            results = []
            for ride in data.get("options", []):
                results.append({
                    "provider": "Yango",
                    "category": ride.get("type"),
                    "price": f"GHS {ride.get('price')}" if ride.get('price') else None,
                    "eta_min": ride.get("eta"),
                    "distance_km": ride.get("distance"),
                    "link": f"yango://?pickup={pickup_lat},{pickup_lng}&dropoff={dropoff_lat},{dropoff_lng}",
                    "error": None
                })
            if not results:
                results.append({
                    "provider": "Yango",
                    "category": None,
                    "price": None,
                    "eta_min": None,
                    "distance_km": None,
                    "link": None,
                    "error": "Location not available"
                })
            return results
    except Exception:
        return [{
            "provider": "Yango",
            "category": None,
            "price": None,
            "eta_min": None,
            "distance_km": None,
            "link": None,
            "error": "Location not available"
        }]


async def get_ride_estimates(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
    tasks = [
        fetch_uber(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng),
        fetch_bolt(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng),
        fetch_yango(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng),
    ]
    results = await asyncio.gather(*tasks)
    # Flatten list of lists
    return [ride for provider_list in results for ride in provider_list]