
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 * 1000 # Radius of earth in meters
    return c * r

def is_within_radius(user_lat, user_lng, target_lat, target_lng, radius_meters=100):
    if user_lat is None or user_lng is None:
        return False
    distance = calculate_distance(user_lat, user_lng, target_lat, target_lng)
    return distance <= radius_meters, distance
