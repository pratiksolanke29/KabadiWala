import { create } from 'zustand';
import type { Category, Lot } from '../types';

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
  
  // Saved lots (mock data for prototype)
  savedLots: Lot[];
  addSavedLot: (lot: Lot) => void;
  updateSavedLot: (id: string, updates: Partial<Lot>) => void;
  getSavedLot: (id: string) => Lot | undefined;
}

const initialDraft: LotDraft = {
  photoUrl: null,
  category: null,
  weightKg: null,
  estimateMin: null,
  estimateMax: null,
};

// Mock data for prototype
const mockLots: Lot[] = [
  {
    id: '1',
    photoUrl: 'https://images.unsplash.com/photo-1587750152780-6443148091b1?w=400',
    category: 'PCB',
    weightKg: 25,
    estimateMin: 1200,
    estimateMax: 1800,
    status: 'Paid',
    recyclerId: 'r1',
    recyclerName: 'Green Recyclers',
    quotedRate: 60,
    quotedTotal: 1500,
    finalRate: 62,
    finalTotal: 1550,
    finalWeightKg: 25,
    handoverCode: 'A1B2C3',
    gpsLat: 19.0760,
    gpsLon: 72.8777,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:20:00Z',
    handedOverAt: '2024-01-18T11:00:00Z',
    paidAt: '2024-01-20T14:20:00Z',
  },
  {
    id: '2',
    photoUrl: 'https://images.unsplash.com/photo-1519638800187-0de9f36ef8e5?w=400',
    category: 'Cables',
    weightKg: 15,
    estimateMin: 600,
    estimateMax: 900,
    status: 'HandedOver',
    recyclerId: 'r2',
    recyclerName: 'Mumbai E-Waste',
    quotedRate: 50,
    quotedTotal: 750,
    finalRate: 48,
    finalTotal: 720,
    finalWeightKg: 15,
    handoverCode: 'X9Y8Z7',
    gpsLat: 19.0760,
    gpsLon: 72.8777,
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-01-22T16:45:00Z',
    handedOverAt: '2024-01-22T16:45:00Z',
  },
  {
    id: '3',
    photoUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
    category: 'Batteries',
    weightKg: 8,
    estimateMin: 800,
    estimateMax: 1200,
    status: 'Quoted',
    recyclerId: 'r3',
    recyclerName: 'Eco Solutions',
    quotedRate: 120,
    quotedTotal: 960,
    gpsLat: 19.0760,
    gpsLon: 72.8777,
    createdAt: '2024-01-25T14:20:00Z',
    updatedAt: '2024-01-25T15:30:00Z',
  },
  {
    id: '4',
    photoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
    category: 'Mixed Plastics',
    weightKg: 30,
    estimateMin: 300,
    estimateMax: 600,
    status: 'Draft',
    gpsLat: 19.0760,
    gpsLon: 72.8777,
    createdAt: '2024-01-28T11:00:00Z',
    updatedAt: '2024-01-28T11:00:00Z',
  },
];

export const useLotStore = create<LotStore>()((set, get) => ({
  draft: initialDraft,
  
  setPhoto: (photoUrl) => set((state) => ({ draft: { ...state.draft, photoUrl } })),
  setCategory: (category) => set((state) => ({ draft: { ...state.draft, category } })),
  setWeight: (weightKg) => set((state) => ({ draft: { ...state.draft, weightKg } })),
  setEstimate: (estimateMin, estimateMax) => set((state) => ({ draft: { ...state.draft, estimateMin, estimateMax } })),
  resetDraft: () => set({ draft: initialDraft }),
  isDraftComplete: () => {
    const { draft } = get();
    return !!draft.photoUrl && !!draft.category && draft.weightKg !== null && draft.weightKg > 0;
  },
  
  savedLots: mockLots,
  addSavedLot: (lot) => set((state) => ({ savedLots: [lot, ...state.savedLots] })),
  updateSavedLot: (id, updates) => set((state) => ({
    savedLots: state.savedLots.map((lot) => (lot.id === id ? { ...lot, ...updates } : lot)),
  })),
  getSavedLot: (id) => get().savedLots.find((lot) => lot.id === id),
}));