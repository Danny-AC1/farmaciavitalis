export interface ActiveDiscount {
    productId: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    promoTag: string;
    expiryDate?: string;
    createdAt: string;
  }
  
  const LOCAL_STORAGE_KEY = 'vitalis_product_discounts';
  
  // Retrieve all active discounts from localStorage
  export const getActiveDiscounts = (): ActiveDiscount[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return [];
      
      const discounts: ActiveDiscount[] = JSON.parse(stored);
      
      // Filter out expired discounts if expiryDate is set
      const now = new Date();
      return discounts.filter(d => {
        if (!d.expiryDate) return true;
        try {
          const exp = new Date(d.expiryDate);
          // Expiry date comparison (check if the date has not passed)
          return exp >= now;
        } catch {
          return true;
        }
      });
    } catch (e) {
      console.error('Error reading discounts from localStorage', e);
      return [];
    }
  };
  
  // Retrieve active discount for a single product ID
  export const getProductDiscount = (productId: string): ActiveDiscount | undefined => {
    const all = getActiveDiscounts();
    return all.find(d => d.productId === productId);
  };
  
  // Calculate discounted price
  export const getDiscountedPrice = (price: number, discount: ActiveDiscount): number => {
    if (discount.type === 'PERCENTAGE') {
      const finalPrice = price * (1 - discount.value / 100);
      return Math.max(0, parseFloat(finalPrice.toFixed(2)));
    } else {
      const finalPrice = price - discount.value;
      return Math.max(0, parseFloat(finalPrice.toFixed(2)));
    }
  };
  
  // Calculate discount percentage (useful if discount is FIXED)
  export const getDiscountPercentage = (originalPrice: number, discount: ActiveDiscount): number => {
    if (discount.type === 'PERCENTAGE') {
      return Math.round(discount.value);
    } else {
      if (originalPrice <= 0) return 0;
      return Math.round((discount.value / originalPrice) * 100);
    }
  };
  
  // Listen to discount updates in the window
  export const subscribeToDiscounts = (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('vitalis-discounts-updated', callback);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        callback();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('vitalis-discounts-updated', callback);
      window.removeEventListener('storage', handleStorageChange);
    };
  };
  
  // Notify other components of discount updates
  export const notifyDiscountsUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vitalis-discounts-updated'));
    }
  };
  