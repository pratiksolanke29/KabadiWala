import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IncomingLot, CompletedLot, RateEntry, Category } from '../types';
import { api } from '../api';

interface RecyclerStore {
  // Incoming lots (mock)
  incomingLots: IncomingLot[];
  setIncomingLots: (lots: IncomingLot[]) => void;
  loadDashboard: () => Promise<void>;
  loadRates: () => Promise<void>;
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
      incomingLots: [],
      loadDashboard: async () => {
        const d = await api<{ incoming: IncomingLot[]; completed: CompletedLot[] }>('GET', '/dashboard');
        set({ incomingLots: d.incoming, completedLots: d.completed });
      },
      loadRates: async () => {
        set({ rates: await api<RateEntry[]>('GET', '/rates') });
      },
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
      
      completedLots: [],
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