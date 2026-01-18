"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { SECTORS, SOURCES } from "./data";
import usePreferencesStore from "@/store/preferences";

// Lazy load chart to prevent blocking
const BackgroundChart = dynamic(
  () => import("@/components/select/BackgroundChart"),
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

interface SourceButtonProps {
  source: { value: string; label: string };
  isSelected: boolean;
  onToggle: (value: string) => void;
}

const SourceButton = memo(({ source, isSelected, onToggle }: SourceButtonProps) => {
  const handleClick = useCallback(() => {
    onToggle(source.value);
  }, [source.value, onToggle]);

  return (
    <button
      onClick={handleClick}
      className={`p-4 rounded-md border transition-all duration-300 text-left cursor-pointer ${
        isSelected
          ? "border-[#333] bg-[#333]/5 text-[#333] font-medium"
          : "border-[#333]/10 bg-white hover:border-[#333]/20 hover:bg-[#333]/2 text-[#333]/70"
      }`}
    >
      {source.label}
    </button>
  );
});

SourceButton.displayName = "SourceButton";

export default function SelectPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  
  // Get preferences from store (automatically synced with localStorage)
  const {
    selectedSectors,
    selectedSources,
    toggleSector,
    toggleSource,
  } = usePreferencesStore();

  const handleSectorChange = useCallback((value: string) => {
    toggleSector(value);
  }, [toggleSector]);

  const handleSourceChange = useCallback((value: string) => {
    toggleSource(value);
  }, [toggleSource]);

  const handleContinue = useCallback(() => {
    if (step === 1) {
      setStep(2);
    } else {
      console.log("Sectors:", selectedSectors);
      console.log("Sources:", selectedSources);
      router.push("/select/step2");
    }
  }, [step, selectedSectors, selectedSources, router]);

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <BackgroundChart />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-[60px]">
          <div className="text-2xl font-semibold text-[#333] tracking-tight">
            Trading
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-semibold text-[#333] mb-4 tracking-tight leading-tight">
              {step === 1 ? "Select Your Sectors" : "Select Your Sources"}
            </h1>
            <p className="text-lg text-[#333]/50 font-medium leading-relaxed">
              {step === 1
                ? "Choose the sectors you are interested in"
                : "Choose which sources to include in your analysis"}
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
              <div className="space-y-4">
                <label className="text-xl font-medium text-[#333] block">
                  Data Sources
                </label>
                <p className="text-sm text-[#333]/60 mb-4">
                  Choose which sources to include in your analysis (you can select multiple)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {SOURCES.map((source) => (
                    <SourceButton
                      key={source.value}
                      source={source}
                      isSelected={selectedSources.includes(source.value)}
                      onToggle={handleSourceChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                onClick={handleContinue}
                className="group relative w-full h-12 px-8 rounded-md bg-[#333] text-white overflow-hidden cursor-pointer"
              >
                <span className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-in-out origin-left" />
                <span className="font-medium relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  Continue
                  <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
