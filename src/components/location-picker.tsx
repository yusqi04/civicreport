"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PickedLocation = {
  location: string;
  latitude: number | "";
  longitude: number | "";
};

type Suggestion = {
  lat: number;
  lon: number;
  label: string;
  full: string;
};

function formatLabelFromCoords(lat: number, lon: number): string {
  return `Koordinat ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function LocationPicker({
  value,
  latitude,
  longitude,
  onChange,
  disabled,
}: {
  value: string;
  latitude: string;
  longitude: string;
  onChange: (loc: PickedLocation) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!q || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/locations?q=${encodeURIComponent(q.trim())}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as { results?: Suggestion[]; error?: string };
      if (data.error) throw new Error(data.error);
      setResults(data.results ?? []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Gagal mencari lokasi. Coba lagi.");
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open) return;
    debounceRef.current = setTimeout(() => void search(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, search]);

  const pick = (s: Suggestion) => {
    onChange({
      location: s.label,
      latitude: s.lat,
      longitude: s.lon,
    });
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Perangkat tidak mendukung GPS.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(
            `/api/locations?lat=${lat}&lon=${lon}`
          );
          const data = (await res.json()) as { results?: Suggestion[] };
          const first = data.results?.[0];
          if (first && Number.isFinite(first.lat) && Number.isFinite(first.lon)) {
            pick(first);
          } else {
            onChange({
              location: formatLabelFromCoords(lat, lon),
              latitude: lat,
              longitude: lon,
            });
            setOpen(false);
          }
        } catch {
          onChange({
            location: formatLabelFromCoords(lat, lon),
            latitude: lat,
            longitude: lon,
          });
          setOpen(false);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError("Tidak bisa mengakses lokasi. Izinkan GPS lalu coba lagi.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const hasValue = Boolean(value && latitude && longitude);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="location"
            readOnly
            value={value}
            placeholder="Cari lokasi atau gunakan GPS…"
            className="pl-9 pr-9 cursor-pointer"
            onClick={() => !disabled && setOpen(true)}
            onFocus={() => !disabled && setOpen(true)}
            disabled={disabled}
            aria-label="Lokasi laporan"
          />
          {hasValue && !disabled && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              onClick={() =>
                onChange({ location: "", latitude: "", longitude: "" })
              }
              title="Hapus lokasi"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || locating}
          onClick={useMyLocation}
          aria-label="Gunakan lokasi saya"
          title="Gunakan lokasi saya"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {hasValue && latitude && longitude && (
        <p className="text-xs text-muted-foreground">
          {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
        </p>
      )}

      {open && (
        <div className="rounded-lg border bg-popover shadow-md">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari alamat, tempat, atau nama jalan…"
              className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cari lokasi"
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
              aria-label="Tutup pencarian lokasi"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto">
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
              onClick={useMyLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Navigation className="h-4 w-4 text-primary" />
              )}
              Gunakan lokasi saya sekarang
            </button>

            {loading && (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Mencari…
              </p>
            )}

            {!loading && error && (
              <p className="px-3 py-3 text-sm text-destructive">{error}</p>
            )}

            {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                Lokasi tidak ditemukan.
              </p>
            )}

            {!loading &&
              results.map((s) => (
                <button
                  key={`${s.lat}-${s.lon}-${s.label}`}
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-muted"
                  )}
                  onClick={() => pick(s)}
                >
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {s.full}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
