'use client';
import { useState, useEffect } from 'react';

export type GeoResult = {
  city: string | null;
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
};

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pl`,
      { headers: { 'User-Agent': 'Kurwomat/3.0' } }
    );
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village || null;
  } catch {
    return null;
  }
}

export function useGeolocation(): GeoResult {
  const [result, setResult] = useState<GeoResult>({
    city: null, lat: null, lng: null, loading: true, error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setResult(r => ({ ...r, loading: false, error: 'Geolocation niedostępny' }));
      return;
    }

    const cached = localStorage.getItem('kw_geo');
    if (cached) {
      try {
        const { city, lat, lng, ts } = JSON.parse(cached);
        if (Date.now() - ts < 86_400_000) {
          setResult({ city, lat, lng, loading: false, error: null });
          return;
        }
      } catch {}
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const city = await reverseGeocode(lat, lng);
        const geo = { city, lat, lng, loading: false, error: null };
        setResult(geo);
        localStorage.setItem('kw_geo', JSON.stringify({ city, lat, lng, ts: Date.now() }));
      },
      (err) => {
        setResult(r => ({ ...r, loading: false, error: err.message }));
      },
      { timeout: 8000, maximumAge: 3_600_000 }
    );
  }, []);

  return result;
}
