import random
from datetime import datetime


class YangoService:
    """Service to interact with Yango API"""
    
    def __init__(self):
        # In production, initialize with API credentials from settings
        pass
    
    def get_price_estimate(self, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
        """
        Get price estimate from Yango
        TODO: Replace with actual Yango API call
        """
        
        # Calculate rough distance
        distance = self._calculate_distance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
        
        # Mock data - Yango is usually the cheapest
        base_price = 10.0
        price_per_km = 2.8
        estimated_price = base_price + (distance * price_per_km)
        
        return {
            'provider': 'YANGO',
            'service_type': 'Yango Economy',
            'price': round(estimated_price, 2),
            'currency': 'GHS',
            'eta_minutes': random.randint(4, 9),
            'distance_km': round(distance, 2),
            'surge_multiplier': None,
        }
    
    def _calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate approximate distance in km"""
        lat_diff = abs(lat2 - lat1)
        lng_diff = abs(lng2 - lng1)
        distance = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111
        return max(distance, 2.0)