const cache: Record<string, { lat: number; lng: number }> = {};

export async function getCoordinatesForPostalCode(
  postalCode: string,
): Promise<{ lat: number; lng: number } | null> {
  if (cache[postalCode]) {
    return cache[postalCode];
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
      postalCode,
    )}&country=Germany&format=json&limit=1`;

    // We add a custom user agent as required by Nominatim's usage policy
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Cannathera-B2B-App/1.0',
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as any[];

    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      cache[postalCode] = coords;
      return coords;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return null;
}

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
