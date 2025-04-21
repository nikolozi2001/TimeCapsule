export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationError {
  code: number; // 1: PERMISSION_DENIED, 2: POSITION_UNAVAILABLE, 3: TIMEOUT
  message: string;
}

export const getCurrentPosition = (): Promise<GeoPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unknown error occurred';
        
        switch (error.code) {
          case 1:
            message = 'Permission denied. Please allow location access.';
            break;
          case 2:
            message = 'Position unavailable. Try again later.';
            break;
          case 3:
            message = 'Timeout. Try again.';
            break;
        }
        
        reject({
          code: error.code,
          message
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

// Calculate distance between two points using the Haversine formula (in meters)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Check if user is close enough to a capsule location (default: 50 meters)
export const isNearLocation = (
  userLat: number,
  userLng: number,
  capsuleLat: number,
  capsuleLng: number,
  thresholdDistance: number = 50
): boolean => {
  const distance = calculateDistance(userLat, userLng, capsuleLat, capsuleLng);
  return distance <= thresholdDistance;
};