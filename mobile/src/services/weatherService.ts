import { wardrobeStore } from '../db/storage';
import { WeatherCondition } from '../core/stylingEngine';

export interface WeatherData extends WeatherCondition {
  label: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

/**
 * Maps Open-Meteo weather code and temperature to Stylora WeatherCondition
 * Matching backend/app/style/rules.py lines 24-30
 */
export function mapWeatherCodeToCondition(
  weatherCode: number,
  tempC: number
): 'Sunny' | 'Cold' | 'Rainy' | 'Clear' {
  const rainyCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  if (rainyCodes.includes(weatherCode) || (weatherCode >= 200 && weatherCode < 600)) {
    return 'Rainy';
  }
  if (tempC < 15) {
    return 'Cold';
  }
  if (tempC > 25) {
    return 'Sunny';
  }
  return 'Clear';
}

/**
 * Fetches real weather from Open-Meteo API using coordinates
 */
export async function fetchWeatherFromOpenMeteo(
  lat: number,
  lon: number,
  cityName?: string
): Promise<WeatherData | null> {
  try {
    const latRounded = Math.round(lat * 100) / 100;
    const lonRounded = Math.round(lon * 100) / 100;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latRounded}&longitude=${lonRounded}&current_weather=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const tempC = Math.round(data.current_weather.temperature);
    const code = data.current_weather.weathercode;
    const condition = mapWeatherCodeToCondition(code, tempC);

    let resolvedCity = cityName;
    if (!resolvedCity) {
      try {
        const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latRounded}&longitude=${lonRounded}&localityLanguage=en`;
        const geoRes = await fetch(geoUrl);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          resolvedCity = geoData.city || geoData.locality || geoData.principalSubdivision || 'Local';
        }
      } catch {
        resolvedCity = 'Local';
      }
    }

    return {
      tempC,
      condition,
      label: condition,
      locationName: resolvedCity || 'Local',
      latitude: latRounded,
      longitude: lonRounded,
    };
  } catch {
    return null;
  }
}

export const fetchOpenMeteoWeather = fetchWeatherFromOpenMeteo;

/**
 * Requests location from device and fetches live weather
 */
export async function requestAndFetchLocationWeather(): Promise<WeatherData | null> {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const coords: { lat: number; lon: number } | null = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000, maximumAge: 600000 }
      );
    });

    if (coords) {
      const weather = await fetchWeatherFromOpenMeteo(coords.lat, coords.lon);
      if (weather) {
        const prof = wardrobeStore.getProfile();
        wardrobeStore.updateProfile({
          ...prof,
          locationName: weather.locationName,
          latitude: weather.latitude,
          longitude: weather.longitude,
        });
        return weather;
      }
    }
  }

  // Graceful fallback for simulator / web without GPS: IP-based coarse lookup
  try {
    const ipRes = await fetch('https://ipapi.co/json/');
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData.latitude && ipData.longitude) {
        const weather = await fetchWeatherFromOpenMeteo(
          ipData.latitude,
          ipData.longitude,
          ipData.city || ipData.region
        );
        if (weather) {
          const prof = wardrobeStore.getProfile();
          wardrobeStore.updateProfile({
            ...prof,
            locationName: weather.locationName,
            latitude: weather.latitude,
            longitude: weather.longitude,
          });
          return weather;
        }
      }
    }
  } catch {}

  return null;
}
