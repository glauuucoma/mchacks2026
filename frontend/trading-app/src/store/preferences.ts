import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  selectedSectors: string[];
  selectedSources: string[];
  setSelectedSectors: (sectors: string[]) => void;
  addSector: (sector: string) => void;
  removeSector: (sector: string) => void;
  toggleSector: (sector: string) => void;
  setSelectedSources: (sources: string[]) => void;
  addSource: (source: string) => void;
  removeSource: (source: string) => void;
  toggleSource: (source: string) => void;
  clearPreferences: () => void;
}

const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      selectedSectors: [],
      selectedSources: [],

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

      clearPreferences: () =>
        set({
          selectedSectors: [],
          selectedSources: [],
        }),
    }),
    {
      name: "trading-app-preferences", // localStorage key
    }
  )
);

export default usePreferencesStore;
