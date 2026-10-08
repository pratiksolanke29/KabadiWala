import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IncomingLot, CompletedLot, RateEntry, Category } from '../types';

interface RecyclerStore {
  // Incoming lots (mock)
  incomingLots: IncomingLot[];
  setIncomingLots: (lots: IncomingLot[]) => void;
  acceptLot: (id: string, refId: string) => void;
  declineLot: (id: string) => void;
  getIncomingLot: (id: string) => IncomingLot | undefined;
  
  // Completed lots (mock)
  completedLots: CompletedLot[];
  addCompletedLot: (lot: CompletedLot) => void;
  getCompletedLot: (id: string) => CompletedLot | undefined;
  
  // Rates
  rates: RateEntry[];
  setRates: (rates: RateEntry[]) => void;
  updateRate: (material: Category, updates: Partial<RateEntry>) => void;
  
  // Handover draft
  handoverDraft: {
    lotId: string | null;
    refId: string | null;
    finalWeightKg: number | null;
    finalRate: number | null;
    paymentMode: 'Cash' | 'Digital' | 'Pending' | null;
  };
  setHandoverDraft: (draft: Partial<RecyclerStore['handoverDraft']>) => void;
  resetHandoverDraft: () => void;
}

const initialHandoverDraft = {
  lotId: null,
  refId: null,
  finalWeightKg: null,
  finalRate: null,
  paymentMode: null as 'Cash' | 'Digital' | 'Pending' | null,
};

// Mock incoming lots
const mockIncomingLots: IncomingLot[] = [
  {
    id: 'lot-1',
    photoUrl: 'https://images.unsplash.com/photo-1587750152780-6443148091b1?w=400',
    category: 'PCB',
    weightKg: 25,
    collectorId: 'c1',
    collectorName: 'Rajesh Kumar',
    collectorPhone: '+91 98765 43210',
    collectorLocation: { lat: 19.0760, lon: 72.8777, address: 'Andheri East, Mumbai' },
    distanceKm: 3.2,
    quotedRate: 60,
    quotedTotal: 1500,
    refId: 'A1B2C3',
    status: 'Pending',
    createdAt: '2024-01-28T10:30:00Z',
  },
  {
    id: 'lot-2',
    photoUrl: 'https://images.unsplash.com/photo-1519638800187-0de9f36ef8e5?w=400',
    category: 'Cables',
    weightKg: 15,
    collectorId: 'c2',
    collectorName: 'Priya Sharma',
    collectorPhone: '+91 87654 32109',
    collectorLocation: { lat: 19.1197, lon: 72.8464, address: 'Bandra West, Mumbai' },
    distanceKm: 5.8,
    quotedRate: 50,
    quotedTotal: 750,
    refId: 'X9Y8Z7',
    status: 'Pending',
    createdAt: '2024-01-28T11:15:00Z',
  },
  {
    id: 'lot-3',
    photoUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
    category: 'Batteries',
    weightKg: 8,
    collectorId: 'c3',
    collectorName: 'Amit Patel',
    collectorPhone: '+91 76543 21098',
    collectorLocation: { lat: 19.0822, lon: 72.8111, address: 'Dadar, Mumbai' },
    distanceKm: 2.1,
    quotedRate: 120,
    quotedTotal: 960,
    refId: 'M4N5P6',
    status: 'Pending',
    createdAt: '2024-01-28T12:00:00Z',
  },
];

// Mock completed lots
const mockCompletedLots: CompletedLot[] = [
  {
    id: 'lot-1',
    category: 'PCB',
    finalWeightKg: 25,
    finalRate: 62,
    finalTotal: 1550,
    paymentMode: 'Digital',
    handedOverAt: '2024-01-25T14:20:00Z',
    collectorName: 'Rajesh Kumar',
    refId: 'A1B2C3',
  },
  {
    id: 'lot-4',
    category: 'CRT',
    finalWeightKg: 12,
    finalRate: 25,
    finalTotal: 300,
    paymentMode: 'Cash',
    handedOverAt: '2024-01-20T11:30:00Z',
    collectorName: 'Sunita Devi',
    refId: 'Q7R8S9',
  },
];

// Default rates
const defaultRates: RateEntry[] = [
  { material: 'CRT', accept: true, ratePerKg: 25 },
  { material: 'LCD', accept: true, ratePerKg: 45 },
  { material: 'PCB', accept: true, ratePerKg: 60 },
  { material: 'Cables', accept: true, ratePerKg: 50 },
  { material: 'Batteries', accept: true, ratePerKg: 120 },
  { material: 'Motors/Magnets', accept: true, ratePerKg: 35 },
  { material: 'Mixed Plastics', accept: true, ratePerKg: 15 },
];

export const useRecyclerStore = create<RecyclerStore>()(
  persist(
    (set, get) => ({
      incomingLots: mockIncomingLots,
      setIncomingLots: (incomingLots) => set({ incomingLots }),
      acceptLot: (id, refId) =>
        set((state) => ({
          incomingLots: state.incomingLots.map((lot) =>
            lot.id === id ? { ...lot, status: 'Accepted' as const, refId } : lot
          ),
        })),
      declineLot: (id) =>
        set((state) => ({
          incomingLots: state.incomingLots.map((lot) =>
            lot.id === id ? { ...lot, status: 'Declined' as const } : lot
          ),
        })),
      getIncomingLot: (id) => get().incomingLots.find((lot) => lot.id === id),
      
      completedLots: mockCompletedLots,
      addCompletedLot: (lot) => set((state) => ({ completedLots: [lot, ...state.completedLots] })),
      getCompletedLot: (id) => get().completedLots.find((lot) => lot.id === id),
      
      rates: defaultRates,
      setRates: (rates) => set({ rates }),
      updateRate: (material, updates) =>
        set((state) => ({
          rates: state.rates.map((r) => (r.material === material ? { ...r, ...updates } : r)),
        })),
      
      handoverDraft: initialHandoverDraft,
      setHandoverDraft: (draft) =>
        set((state) => ({ handoverDraft: { ...state.handoverDraft, ...draft } })),
      resetHandoverDraft: () => set({ handoverDraft: initialHandoverDraft }),
    }),
    {
      name: 'kabadiwala-recycler',
      partialize: (state) => ({
        rates: state.rates,
        completedLots: state.completedLots,
      }),
    }
  )
);