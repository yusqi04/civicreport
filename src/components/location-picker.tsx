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
  const containerRef = useRef<HTMLDivElement>(null);
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
        setError("Gagal mencari lokasi.");
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

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          const res = await fetch(`/api/locations?lat=${lat}&lon=${lon}`);
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
        setError("Akses GPS ditolak. Anda tetap dapat mengetik alamat secara manual.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const hasCoords = Boolean(
    latitude &&
    longitude &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude))
  );

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="location"
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              const latNum = latitude && Number.isFinite(Number(latitude)) ? Number(latitude) : "";
              const lonNum = longitude && Number.isFinite(Number(longitude)) ? Number(longitude) : "";
              onChange({
                location: val,
                latitude: latNum,
                longitude: lonNum,
              });
              setQuery(val);
              if (val.trim().length >= 2) {
                setOpen(true);
              }
            }}
            placeholder="Ketik alamat manual atau cari lokasi (GPS opsional)…"
            className="pl-9 pr-9"
            disabled={disabled}
            aria-label="Lokasi laporan"
          />
          {value && !disabled && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange({ location: "", latitude: "", longitude: "" });
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
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
          aria-label="Ambil koordinat GPS saya (opsional)"
          title="Ambil koordinat GPS saya (opsional)"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Navigation className="h-4 w-4 text-primary" />
          )}
        </Button>
      </div>

      {hasCoords && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            📍 Koordinat GPS: {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
          </span>
          <button
            type="button"
            className="text-xs text-destructive hover:underline"
            onClick={() =>
              onChange({
                location: value,
                latitude: "",
                longitude: "",
              })
            }
          >
            (Hapus GPS)
          </button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {open && (
        <div className="rounded-lg border bg-popover shadow-md">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari saran alamat atau nama jalan…"
              className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cari saran lokasi"
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
              aria-label="Tutup saran lokasi"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto">
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
              Gunakan GPS lokasi saya sekarang (opsional)
            </button>

            {loading && (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Mencari saran lokasi…
              </p>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <p className="px-3 py-3 text-xs text-muted-foreground">
                Tidak ada saran otomatis. Anda dapat tetap menggunakan alamat yang Anda ketik di atas.
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
