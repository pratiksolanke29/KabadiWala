import { create } from 'zustand';
import type { Category, Lot } from '../types';
import { api } from '../api';

interface LotDraft {
  photoUrl: string | null;
  category: Category | null;
  weightKg: number | null;
  estimateMin: number | null;
  estimateMax: number | null;
}

interface LotStore {
  draft: LotDraft;
  setPhoto: (url: string) => void;
  setCategory: (category: Category) => void;
  setWeight: (weight: number) => void;
  setEstimate: (min: number, max: number) => void;
  resetDraft: () => void;
  isDraftComplete: () => boolean;
  
  // Saved lots (loaded from the backend)
  savedLots: Lot[];
  addSavedLot: (lot: Lot) => void;
  updateSavedLot: (id: string, updates: Partial<Lot>) => void;
  getSavedLot: (id: string) => Lot | undefined;
  loadLots: () => Promise<void>;
}

const initialDraft: LotDraft = {
  photoUrl: null,
  category: null,
  weightKg: null,
  estimateMin: null,
  estimateMax: null,
};

export const useLotStore = create<LotStore>()((set, get) => ({
  draft: initialDraft,
  
  setPhoto: (photoUrl) => set((state) => ({ draft: state.draft.photoUrl === photoUrl ? state.draft : { ...initialDraft, photoUrl } })),
  setCategory: (category) => set((state) => ({ draft: { ...state.draft, category } })),
  setWeight: (weightKg) => set((state) => ({ draft: { ...state.draft, weightKg } })),
  setEstimate: (estimateMin, estimateMax) => set((state) => ({ draft: { ...state.draft, estimateMin, estimateMax } })),
  resetDraft: () => set({ draft: initialDraft }),
  isDraftComplete: () => {
    const { draft } = get();
    return !!draft.photoUrl && !!draft.category && draft.weightKg !== null && draft.weightKg > 0;
  },
  
  savedLots: [],
  loadLots: async () => {
    const lots = await api<Lot[]>('GET', '/lots');
    set({ savedLots: lots });
  },
  addSavedLot: (lot) => set((state) => ({ savedLots: [lot, ...state.savedLots] })),
  updateSavedLot: (id, updates) => set((state) => ({
    savedLots: state.savedLots.map((lot) => (lot.id === id ? { ...lot, ...updates } : lot)),
  })),
  getSavedLot: (id) => get().savedLots.find((lot) => lot.id === id),
}));