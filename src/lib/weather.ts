export async function getAlexandriaWeather() {
  // Coordinates for Alexandria, Egypt
  const lat = 31.2018;
  const lon = 29.9158;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Africa/Cairo`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Satellite link unstable");
    const data = await res.json();
    return data.current;
  } catch (error) {
    console.error("Weather error:", error);
    return null;
  }
}

// Map WMO codes to human-readable status & icons
export const getWeatherStatus = (code: number) => {
  if (code === 0) return { label: "Clear", icon: "Sun" };
  if (code <= 3) return { label: "Partly Cloudy", icon: "CloudSun" };
  if (code <= 48) return { label: "Foggy", icon: "CloudFog" };
  if (code <= 67) return { label: "Rainy", icon: "CloudRain" };
  if (code <= 77) return { label: "Snowy", icon: "Snowflake" };
  return { label: "Stormy", icon: "CloudLightning" };
};