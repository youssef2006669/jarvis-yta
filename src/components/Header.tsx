"use client";
import React, { useEffect, useState } from 'react';
import { Sun, CloudSun, CloudFog, CloudRain, Snowflake, CloudLightning, Wind, MapPin } from 'lucide-react';
import { getAlexandriaWeather, getWeatherStatus } from '@/lib/weather';

export default function Header() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const data = await getAlexandriaWeather();
      setWeather(data);
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 900000); // Update every 15 mins
    return () => clearInterval(interval);
  }, []);

  const status = weather ? getWeatherStatus(weather.weather_code) : null;

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/50 backdrop-blur-md p-4 flex justify-between items-center px-8">
      {/* Left: Agency Identity */}
      <div className="flex flex-col">
        <h1 className="text-blue-500 font-mono font-bold tracking-widest text-xl">JARVIS-YTA</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
          <span className="text-[10px] text-slate-400 uppercase tracking-tighter">System Status: Online</span>
        </div>
      </div>

      {/* Right: Environment Data */}
      <div className="flex items-center gap-6 text-slate-300 font-mono text-xs">
        {weather && (
          <>
            <div className="flex items-center gap-2 border-r border-slate-800 pr-6">
              <MapPin size={14} className="text-blue-400" />
              <span>ALEXANDRIA, EG</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {status?.icon === "Sun" && <Sun size={18} className="text-yellow-400" />}
                {status?.icon === "CloudSun" && <CloudSun size={18} className="text-blue-300" />}
                {/* Add other icon cases here as needed */}
                <span className="text-lg font-bold">{Math.round(weather.temperature_2m)}°C</span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-500">
                <Wind size={14} />
                <span>{weather.wind_speed_10m} km/h</span>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}