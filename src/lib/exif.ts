import exifr from "exifr";

export type GpsCoords = { latitude: number; longitude: number };

function isValidCoord(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    !(lat === 0 && lon === 0)
  );
}

export async function extractGpsFromFile(file: File): Promise<GpsCoords | null> {
  try {
    const data = await exifr.parse(file, {
      gps: true,
      reviveValues: true,
    });
    const lat = Number(data?.latitude);
    const lon = Number(data?.longitude);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
    return null;
  } catch {
    return null;
  }
}

export async function extractGpsFromBuffer(
  buffer: Buffer
): Promise<GpsCoords | null> {
  try {
    const data = await exifr.parse(buffer, { gps: true, reviveValues: true });
    const lat = Number(data?.latitude);
    const lon = Number(data?.longitude);
    if (isValidCoord(lat, lon)) return { latitude: lat, longitude: lon };
    return null;
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&accept-language=id`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = json.address ?? {};
    const parts = [
      [a.road, a.house_number].filter(Boolean).join(" "),
      a.neighbourhood || a.suburb || a.village || a.hamlet,
      a.city || a.town || a.county,
      a.state,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return json.display_name ?? null;
  } catch {
    return null;
  }
}
