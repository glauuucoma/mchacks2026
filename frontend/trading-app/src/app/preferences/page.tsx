"use client";

import { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { SECTORS } from "../select/data";
import usePreferencesStore, { type SourceWeights } from "@/store/preferences";
import { motion } from "framer-motion";

// Lazy load chart to prevent blocking
const BackgroundChart = dynamic(
  () => import("@/components/decorations/BackgroundChart"),
  { ssr: false }
);

interface SectorButtonProps {
  sector: { value: string; label: string };
  isSelected: boolean;
  onToggle: (value: string) => void;
}

const SectorButton = memo(({ sector, isSelected, onToggle }: SectorButtonProps) => {
  const handleClick = useCallback(() => {
    onToggle(sector.value);
  }, [sector.value, onToggle]);

  return (
    <button
      onClick={handleClick}
      className={`p-3 rounded-md border transition-all duration-300 text-left cursor-pointer ${
        isSelected
          ? "border-[#333] bg-[#333]/5 text-[#333] font-medium"
          : "border-[#333]/10 bg-white hover:border-[#333]/20 hover:bg-[#333]/2 text-[#333]/70"
      }`}
    >
      {sector.label}
    </button>
  );
});

SectorButton.displayName = "SectorButton";

interface SourceWeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  sourceKey: keyof SourceWeights;
}

const SourceWeightSlider = memo(({ label, value, onChange }: SourceWeightSliderProps) => {
  const [localValue, setLocalValue] = useState(value.toString());

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      onChange(newValue);
      setLocalValue(newValue.toString());
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setLocalValue(inputValue);
      
      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        onChange(numValue);
      }
    },
    [onChange]
  );

  const handleInputBlur = useCallback(() => {
    const numValue = parseInt(localValue, 10);
    if (isNaN(numValue) || numValue < 0) {
      setLocalValue("0");
      onChange(0);
    } else if (numValue > 100) {
      setLocalValue("100");
      onChange(100);
    } else {
      setLocalValue(numValue.toString());
      onChange(numValue);
    }
  }, [localValue, onChange]);

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#333]">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-16 px-2 py-1 text-sm font-semibold text-[#333] border border-[#333]/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[#333]/20 focus:border-[#333] text-right"
          />
          <span className="text-sm font-semibold text-[#333]">%</span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={handleSliderChange}
        className="w-full h-2 bg-[#333]/10 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #333 0%, #333 ${value}%, #e5e5e5 ${value}%, #e5e5e5 100%)`,
        }}
      />
    </div>
  );
});

SourceWeightSlider.displayName = "SourceWeightSlider";

const SOURCE_LABELS: Record<keyof SourceWeights, string> = {
  "ml-model": "Machine Learning Model (Prediction)",
  "news-outlets": "News Outlets",
  "congress": "Members of Congress",
  "social-media": "Social Media (Reddit)",
};

export default function PreferencesPage() {
  const router = useRouter();
  
  // Get preferences from store
  const {
    selectedSectors,
    sourceWeights,
    toggleSector,
    setSourceWeight,
  } = usePreferencesStore();

  const handleSectorChange = useCallback((value: string) => {
    toggleSector(value);
  }, [toggleSector]);

  const handleWeightChange = useCallback(
    (source: keyof SourceWeights, weight: number) => {
      setSourceWeight(source, weight);
    },
    [setSourceWeight]
  );

  const totalWeight = useMemo(() => {
    return Object.values(sourceWeights).reduce((sum, weight) => sum + weight, 0);
  }, [sourceWeights]);

  const isTotalValid = totalWeight === 100;

  const handleSave = useCallback(() => {
    if (isTotalValid) {
      // Data is automatically saved to localStorage via zustand persist
      router.push("/dashboard");
    }
  }, [isTotalValid, router]);

  const handleBack = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <BackgroundChart />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-[#333]/70 hover:text-[#333] transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span className="text-sm font-medium cursor-pointer">Back to Dashboard</span>
            </button>

            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-semibold text-[#333] mb-4 tracking-tight leading-tight">
                Preferences
              </h1>
              <p className="text-lg text-[#333]/50 font-medium leading-relaxed">
                Customize your investment preferences and source weights
              </p>
            </div>
          </motion.div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-md border border-[#333]/10 rounded-lg shadow-lg p-8 md:p-10 space-y-8">
            {/* Industries Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <label className="text-xl font-medium text-[#333] block">
                Industries
              </label>
              <p className="text-sm text-[#333]/60 mb-4">
                Select the industries where you want to invest
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SECTORS.map((sector) => (
                  <SectorButton
                    key={sector.value}
                    sector={sector}
                    isSelected={selectedSectors.includes(sector.value)}
                    onToggle={handleSectorChange}
                  />
                ))}
              </div>
            </motion.div>

            {/* Divider */}
            <div className="border-t border-[#333]/10" />

            {/* Source Weights Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <label className="text-xl font-medium text-[#333] block mb-2">
                  Source Weights
                </label>
                <p className="text-sm text-[#333]/60 mb-4">
                  Set the percentage weight for each data source (must total 100%)
                </p>
              </div>

              <div className="space-y-6">
                {(Object.keys(SOURCE_LABELS) as Array<keyof SourceWeights>).map((sourceKey) => (
                  <SourceWeightSlider
                    key={sourceKey}
                    label={SOURCE_LABELS[sourceKey]}
                    value={sourceWeights[sourceKey]}
                    onChange={(value) => handleWeightChange(sourceKey, value)}
                    sourceKey={sourceKey}
                  />
                ))}
              </div>

              {/* Total Display */}
              <div className="pt-4 border-t border-[#333]/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#333]">Total</span>
                  <span
                    className={`text-lg font-semibold ${
                      isTotalValid ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {totalWeight}%
                  </span>
                </div>
                {!isTotalValid && (
                  <p className="text-xs text-red-500 mt-2">
                    Total must equal 100%. Current total: {totalWeight}%
                  </p>
                )}
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-6"
            >
              <button
                onClick={handleSave}
                disabled={!isTotalValid}
                className={`group relative w-full h-12 px-8 rounded-md overflow-hidden cursor-pointer transition-opacity ${
                  isTotalValid
                    ? "bg-[#333] text-white opacity-100"
                    : "bg-[#333]/50 text-white opacity-60 cursor-not-allowed"
                }`}
              >
                <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-in-out origin-left" />
                <span className="font-medium relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  Save Preferences
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}