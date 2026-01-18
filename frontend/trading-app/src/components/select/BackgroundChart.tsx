"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export default function BackgroundChart() {
  const stockData = useMemo(() => {
    const data = [];
    let value = 100;
    for (let i = 0; i < 200; i++) {
      const change = (Math.random() - 0.45) * 5;
      value += change;
      data.push({ time: i, value: value });
    }
    return data;
  }, []);

  return (
    <div className="absolute inset-0 opacity-[0.15] pointer-events-none top-[125px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={stockData}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#colorGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
