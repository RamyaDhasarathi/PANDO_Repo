export interface Property {
  id: string;
  name: string;
  location: string;
  propertyType: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number;
  priceUsd: number;
  yield: number;
  aiScore: number;
  indexLabel: string;
  sectorBadge: string;
  statusBadge: {
    label: string;
    variant: 'off-market' | 'exclusive' | 'sunset' | 'royal' | 'default';
  };
  image: string;
  tags: string[];
  description: string;
  amenities: string[];
  investmentInsight: string;
}

export type FilterCategory = 'all' | 'waterfront' | 'skyline' | 'golf' | 'burj';
export type SortOption = 'ai-recommended' | 'price-asc' | 'price-desc' | 'yield';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'pando';
  text: string;
  timestamp: string;
  syncedCount?: number;
  statusText?: string;
  actionFilter?: string;
}
