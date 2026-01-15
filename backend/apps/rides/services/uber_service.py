import random
from datetime import datetime


class UberService:
    """Service to interact with Uber API"""
    
    def __init__(self):
        # In production, initialize with API credentials from settings
        pass
    
    def get_price_estimate(self, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng):
        """
        Get price estimate from Uber
        TODO: Replace with actual Uber API call
        """
        
        # Calculate rough distance (simplified)
        distance = self._calculate_distance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng)
        
        # Mock data for now
        base_price = 15.0
        price_per_km = 3.5
        estimated_price = base_price + (distance * price_per_km)
        
        # Add some randomness to simulate surge pricing
        surge = random.choice([1.0, 1.0, 1.0, 1.2, 1.5])
        final_price = estimated_price * surge
        
        return {
            'provider': 'UBER',
            'service_type': 'UberX',
            'price': round(final_price, 2),
            'currency': 'GHS',
            'eta_minutes': random.randint(3, 8),
            'distance_km': round(distance, 2),
            'surge_multiplier': surge if surge > 1.0 else None,
        }
    
    def _calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate approximate distance in km"""
        # Simplified calculation (not accurate, just for demo)
        lat_diff = abs(lat2 - lat1)
        lng_diff = abs(lng2 - lng1)
        distance = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111
        return max(distance, 2.0)