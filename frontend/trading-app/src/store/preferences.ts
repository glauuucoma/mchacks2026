import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SourceWeights {
  "ml-model": number;
  "news-outlets": number;
  "congress": number;
  "social-media": number;
}

interface PreferencesState {
  selectedSectors: string[];
  selectedSources: string[];
  sourceWeights: SourceWeights;
  setSelectedSectors: (sectors: string[]) => void;
  addSector: (sector: string) => void;
  removeSector: (sector: string) => void;
  toggleSector: (sector: string) => void;
  setSelectedSources: (sources: string[]) => void;
  addSource: (source: string) => void;
  removeSource: (source: string) => void;
  toggleSource: (source: string) => void;
  setSourceWeights: (weights: SourceWeights) => void;
  setSourceWeight: (source: keyof SourceWeights, weight: number) => void;
  clearPreferences: () => void;
}

const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      selectedSectors: [],
      selectedSources: [],
      sourceWeights: {
        "ml-model": 25,
        "news-outlets": 25,
        "congress": 25,
        "social-media": 25,
      },

      setSelectedSectors: (sectors) => set({ selectedSectors: sectors }),
      
      addSector: (sector) =>
        set((state) => ({
          selectedSectors: state.selectedSectors.includes(sector)
            ? state.selectedSectors
            : [...state.selectedSectors, sector],
        })),

      removeSector: (sector) =>
        set((state) => ({
          selectedSectors: state.selectedSectors.filter((s) => s !== sector),
        })),

      toggleSector: (sector) =>
        set((state) => ({
          selectedSectors: state.selectedSectors.includes(sector)
            ? state.selectedSectors.filter((s) => s !== sector)
            : [...state.selectedSectors, sector],
        })),

      setSelectedSources: (sources) => set({ selectedSources: sources }),
      
      addSource: (source) =>
        set((state) => ({
          selectedSources: state.selectedSources.includes(source)
            ? state.selectedSources
            : [...state.selectedSources, source],
        })),

      removeSource: (source) =>
        set((state) => ({
          selectedSources: state.selectedSources.filter((s) => s !== source),
        })),

      toggleSource: (source) =>
        set((state) => ({
          selectedSources: state.selectedSources.includes(source)
            ? state.selectedSources.filter((s) => s !== source)
            : [...state.selectedSources, source],
        })),

      setSourceWeights: (weights) => set({ sourceWeights: weights }),

      setSourceWeight: (source, weight) =>
        set((state) => ({
          sourceWeights: {
            ...state.sourceWeights,
            [source]: Math.max(0, Math.min(100, weight)),
          },
        })),

      clearPreferences: () =>
        set({
          selectedSectors: [],
          selectedSources: [],
          sourceWeights: {
            "ml-model": 25,
            "news-outlets": 25,
            "congress": 25,
            "social-media": 25,
          },
        }),
    }),
    {
      name: "trading-app-preferences", // localStorage key
    }
  )
);

export default usePreferencesStore;
