// Core types shared between Collector and Recycler

export type Language = 'mr' | 'hi' | 'en';

export type Category = 
  | 'CRT' 
  | 'LCD' 
  | 'PCB' 
  | 'Cables' 
  | 'Batteries' 
  | 'Motors/Magnets' 
  | 'Mixed Plastics';

export type LotStatus = 'Draft' | 'Quoted' | 'HandedOver' | 'Paid';

export interface CategoryInfo {
  id: Category;
  icon: string;
  label: { mr: string; hi: string; en: string };
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'CRT', icon: '📺', label: { mr: 'CRT', hi: 'CRT', en: 'CRT' } },
  { id: 'LCD', icon: '📱', label: { mr: 'LCD', hi: 'LCD', en: 'LCD' } },
  { id: 'PCB', icon: '🔧', label: { mr: 'PCB', hi: 'PCB', en: 'PCB' } },
  { id: 'Cables', icon: '🔌', label: { mr: 'केबल्स', hi: 'केबल्स', en: 'Cables' } },
  { id: 'Batteries', icon: '🔋', label: { mr: 'बॅटरीज', hi: 'बैटरीज', en: 'Batteries' } },
  { id: 'Motors/Magnets', icon: '⚙️', label: { mr: 'मोटर्स/मॅग्नेट्स', hi: 'मोटर्स/मैग्नेट्स', en: 'Motors/Magnets' } },
  { id: 'Mixed Plastics', icon: '♻️', label: { mr: 'मिश्रित प्लॅस्टिक', hi: 'मिश्रित प्लास्टिक', en: 'Mixed Plastics' } },
];

// Collector Types
export interface CollectorAuth {
  phone: string;
  pinHash: string;
  accessToken: string;
  refreshToken: string;
  collectorId: string;
  area: string;
  language: Language;
}

export interface Lot {
  id: string;
  photoUrl: string;
  category: Category;
  weightKg: number;
  estimateMin: number;
  estimateMax: number;
  status: LotStatus;
  recyclerId?: string;
  recyclerName?: string;
  quotedRate?: number;
  quotedTotal?: number;
  finalRate?: number;
  finalTotal?: number;
  finalWeightKg?: number;
  handoverCode?: string;
  handoverQrUrl?: string;
  gpsLat?: number;
  gpsLon?: number;
  createdAt: string;
  updatedAt: string;
  handedOverAt?: string;
  paidAt?: string;
}

export interface PriceEntry {
  material: Category;
  ratePerKg: number;
  trend: 'up' | 'down' | 'stable';
  marketMin: number;
  marketMax: number;
  recyclerOffered?: number;
  sparkline: number[];
}

export interface RecyclerMatch {
  id: string;
  name: string;
  distanceKm: number;
  ratePerKg: number;
  verified: boolean;
  pickupAvailable: boolean;
}

export interface EarningRow {
  date: string;
  recyclerName: string;
  amount: number;
  status: 'Paid' | 'Pending';
  lotId: string;
}

export interface SafetyTopic {
  id: string;
  title: { mr: string; hi: string; en: string };
  imageUrl: string;
  detailImageUrl: string;
}

// Recycler Types
export interface RecyclerAuth {
  id: string;
  facilityName: string;
  emailOrPhone: string;
  accessToken: string;
  refreshToken: string;
  authorized: boolean;
  serviceAreas: string[];
  pickupEnabled: boolean;
  language: Language;
}

export interface IncomingLot {
  id: string;
  photoUrl: string;
  category: Category;
  weightKg: number;
  collectorId: string;
  collectorName: string;
  collectorPhone: string;
  collectorLocation: { lat: number; lon: number; address: string };
  distanceKm: number;
  quotedRate: number;
  quotedTotal: number;
  refId: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'HandedOver';
  createdAt: string;
}

export interface CompletedLot {
  id: string;
  category: Category;
  finalWeightKg: number;
  finalRate: number;
  finalTotal: number;
  paymentMode: 'Cash' | 'Digital' | 'Pending';
  handedOverAt: string;
  collectorName: string;
  refId: string;
}

export interface RateEntry {
  material: Category;
  accept: boolean;
  ratePerKg: number;
}

export interface TransactionRow {
  lotId: string;
  date: string;
  material: Category;
  finalAmount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}