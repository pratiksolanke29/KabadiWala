import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CollectorAuth, RecyclerAuth, Language } from '../types';

interface AuthState {
  // Collector
  collector: CollectorAuth | null;
  setCollector: (auth: CollectorAuth | null) => void;
  updateCollector: (updates: Partial<CollectorAuth>) => void;
  
  // Recycler
  recycler: RecyclerAuth | null;
  setRecycler: (auth: RecyclerAuth | null) => void;
  updateRecycler: (updates: Partial<RecyclerAuth>) => void;
  
  // Shared
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // App mode
  mode: 'collector' | 'recycler' | null;
  setMode: (mode: 'collector' | 'recycler' | null) => void;
  
  // Clear all
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      collector: null,
      setCollector: (collector) => set({ collector, mode: collector ? 'collector' : null }),
      updateCollector: (updates) =>
        set((state) => ({
          collector: state.collector ? { ...state.collector, ...updates } : null,
        })),
      
      recycler: null,
      setRecycler: (recycler) => set({ recycler, mode: recycler ? 'recycler' : null }),
      updateRecycler: (updates) =>
        set((state) => ({
          recycler: state.recycler ? { ...state.recycler, ...updates } : null,
        })),
      
      language: 'mr',
      setLanguage: (language) => set({ language }),
      
      mode: null,
      setMode: (mode) => set({ mode }),
      
      clearAuth: () => set({ collector: null, recycler: null, mode: null }),
    }),
    {
      name: 'kabadiwala-auth',
      partialize: (state) => ({
        language: state.language,
        mode: state.mode,
      }),
    }
  )
);