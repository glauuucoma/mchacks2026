"use client";

import { useState, useCallback, memo, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { SECTORS } from "./data";
import usePreferencesStore, { type SourceWeights } from "@/store/preferences";

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

export default function SelectPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  
  // Get preferences from store (automatically synced with localStorage)
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

  const handleContinue = useCallback(() => {
    if (step === 1) {
      setStep(2);
    } else {
      if (isTotalValid) {
        // Data is automatically saved to localStorage via zustand persist
        router.push("/dashboard");
      }
    }
  }, [step, isTotalValid, router]);

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <BackgroundChart />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-semibold text-[#333] mb-4 tracking-tight leading-tight">
              {step === 1 ? "Select Your Sectors" : "Select Your Sources"}
            </h1>
            <p className="text-lg text-[#333]/50 font-medium leading-relaxed">
              {step === 1
                ? "Choose the sectors you are interested in"
                : "Set the percentage weight for each data source"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-md border border-[#333]/10 rounded-lg shadow-lg p-8 md:p-10 space-y-8">
            {step === 1 ? (
              <div className="space-y-4">
                <label className="text-xl font-medium text-[#333] block">
                  Stock Market Sectors
                </label>
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
              </div>
            ) : (
              <div className="space-y-6">
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
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                onClick={handleContinue}
                disabled={step === 2 && !isTotalValid}
                className={`group relative w-full h-12 px-8 rounded-md overflow-hidden cursor-pointer transition-opacity ${
                  step === 2 && !isTotalValid
                    ? "bg-[#333]/50 text-white opacity-60 cursor-not-allowed"
                    : "bg-[#333] text-white opacity-100"
                }`}
              >
                <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-in-out origin-left" />
                <span className="font-medium relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  {step === 1 ? "Continue" : "Finish Setup"}
                  {step === 1 && <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
