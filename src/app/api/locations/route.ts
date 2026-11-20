import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  const limit = Math.min(10, Number(request.nextUrl.searchParams.get("limit")) || 6);

  try {
    let url: string;
    if (lat && lon && !q) {
      url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}` +
        `&zoom=18&accept-language=id&addressdetails=1`;
    } else if (q && q.length >= 2) {
      url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2` +
        `&q=${encodeURIComponent(q)}&limit=${limit}&accept-language=id` +
        `&addressdetails=1`;
    } else if (lat && lon) {
      url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}` +
        `&zoom=18&accept-language=id&addressdetails=1`;
    } else {
      return NextResponse.json(
        { error: "Parameter q atau lat/lon wajib diisi" },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CivicReport/1.0 (local-dev)",
      },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil saran lokasi" },
        { status: 502 }
      );
    }

    const data = await res.json();

    // reverse → single object
    if (url.includes("/reverse")) {
      const a = (data?.address ?? {}) as Record<string, string>;
      const labelParts = [
        [a.road, a.house_number].filter(Boolean).join(" "),
        a.neighbourhood || a.suburb || a.village || a.hamlet,
        a.city || a.town || a.county,
      ].filter(Boolean);
      const label =
        labelParts.length > 0
          ? labelParts.join(", ")
          : String(data?.display_name ?? "").split(",").slice(0, 3).join(",").trim();

      return NextResponse.json({
        results: [
          {
            lat: Number(data?.lat ?? lat),
            lon: Number(data?.lon ?? lon),
            label: label || `Koordinat ${lat}, ${lon}`,
            full: String(data?.display_name ?? label),
          },
        ],
      });
    }

    const items = data as Array<{
      lat: string;
      lon: string;
      display_name: string;
      name?: string;
      address?: Record<string, string>;
    }>;

    const results = items.map((item) => {
      const a = item.address ?? {};
      const labelParts = [
        item.name,
        a.road || a.neighbourhood || a.suburb || a.village,
        a.city || a.town || a.county,
      ].filter(Boolean);
      const label =
        labelParts.length > 0
          ? labelParts.join(", ")
          : item.display_name.split(",").slice(0, 3).join(",").trim();

      return {
        lat: Number(item.lat),
        lon: Number(item.lon),
        label: label || item.display_name,
        full: item.display_name,
      };
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Gagal mengambil saran lokasi" },
      { status: 502 }
    );
  }
}
