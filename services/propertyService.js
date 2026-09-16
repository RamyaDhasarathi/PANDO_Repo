import { PROPERTIES_DATA } from '@/data/quantumProperties';

export class PropertyService {
  static getAll() {
    return PROPERTIES_DATA;
  }

  static getById(id) {
    return PROPERTIES_DATA.find((p) => p.id === id);
  }

  static filterAndSort({
    searchQuery = '',
    location = 'all',
    propertyType = 'all',
    priceRange = 'all',
    sortOption = 'ai-recommended',
  }) {
    let result = [...PROPERTIES_DATA];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.propertyType.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (location !== 'all') {
      if (location === 'waterfront') {
        result = result.filter(
          (p) => p.category === 'Waterfront' || p.category === 'Skyline' || p.name.includes('Palm') || p.name.includes('Marina')
        );
      } else {
        result = result.filter((p) => p.name.toLowerCase().includes(location.toLowerCase()) || p.location.toLowerCase().includes(location.toLowerCase()));
      }
    }

    if (propertyType !== 'all') {
      result = result.filter((p) =>
        p.propertyType.toLowerCase().includes(propertyType.toLowerCase())
      );
    }

    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under-50m':
          result = result.filter((p) => p.price < 50000000);
          break;
        case '50m-80m':
          result = result.filter((p) => p.price >= 50000000 && p.price <= 80000000);
          break;
        case '80m-plus':
          result = result.filter((p) => p.price > 80000000);
          break;
        default:
          break;
      }
    }

    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'yield':
        result.sort((a, b) => b.yield - a.yield);
        break;
      case 'ai-recommended':
      default:
        result.sort((a, b) => b.aiScore - a.aiScore);
        break;
    }

    return result;
  }

  static getSavedPropertyIds() {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('pando_saved_residences');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static toggleSavedProperty(id) {
    if (typeof window === 'undefined') return false;
    try {
      const current = this.getSavedPropertyIds();
      let updated;
      let isSaved;
      if (current.includes(id)) {
        updated = current.filter((item) => item !== id);
        isSaved = false;
      } else {
        updated = [...current, id];
        isSaved = true;
      }
      localStorage.setItem('pando_saved_residences', JSON.stringify(updated));
      return isSaved;
    } catch {
      return false;
    }
  }
}
