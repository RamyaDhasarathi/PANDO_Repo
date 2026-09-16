import { Property, SortOption } from '@/types/property';
import { PROPERTIES_DATA } from '@/data/properties';

export class PropertyService {
  private static STORAGE_KEY = 'pando_saved_properties';

  static getAll(): Property[] {
    return PROPERTIES_DATA;
  }

  static getById(id: string): Property | undefined {
    return PROPERTIES_DATA.find((p) => p.id === id);
  }

  static filterAndSort({
    searchQuery = '',
    location = 'all',
    propertyType = 'all',
    priceRange = 'all',
    sortOption = 'ai-recommended',
  }: {
    searchQuery?: string;
    location?: string;
    propertyType?: string;
    priceRange?: string;
    sortOption?: SortOption;
  }): Property[] {
    let result = [...PROPERTIES_DATA];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.propertyType.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Location filter
    if (location !== 'all') {
      const loc = location.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(loc) ||
          p.location.toLowerCase().includes(loc) ||
          (loc === 'waterfront' && (p.category.toLowerCase() === 'waterfront' || p.category.toLowerCase() === 'skyline'))
      );
    }

    // Property Type filter
    if (propertyType !== 'all') {
      const ptype = propertyType.toLowerCase();
      result = result.filter((p) =>
        p.propertyType.toLowerCase().includes(ptype)
      );
    }

    // Price range filter
    if (priceRange === 'under-50m') {
      result = result.filter((p) => p.price < 50000000);
    } else if (priceRange === '50m-80m') {
      result = result.filter((p) => p.price >= 50000000 && p.price <= 80000000);
    } else if (priceRange === '80m-plus') {
      result = result.filter((p) => p.price > 80000000);
    }

    // Sorting
    if (sortOption === 'ai-recommended') {
      // Retains curated sector rank (Sector 01 to Sector 04 as shown in screenshot)
    } else if (sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'yield') {
      result.sort((a, b) => b.yield - a.yield);
    }

    return result;
  }

  static getSavedPropertyIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static toggleSavedProperty(id: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const saved = this.getSavedPropertyIds();
      const exists = saved.includes(id);
      const updated = exists ? saved.filter((item) => item !== id) : [...saved, id];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return !exists;
    } catch {
      return false;
    }
  }
}
