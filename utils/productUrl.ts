/**
 * Utilidades para manejo, generación y resolución de URLs de productos (Deep Linking y Compartir)
 */

/**
 * Extrae de forma exhaustiva y segura el ID de producto desde la URL actual
 * Soporta:
 * - Parámetros de consulta: ?product=ID, ?id=ID, ?productId=ID, ?p=ID
 * - Rutas limpias: /product/ID, /producto/ID
 * - Hash fragment: #product-ID, #/product/ID, #product=ID, #?product=ID
 */
export const getProductIdFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
  
    try {
      // 1. Verificar parámetros de búsqueda estándar (ej: ?product=prod_123)
      const searchParams = new URLSearchParams(window.location.search);
      const fromSearch = 
        searchParams.get('product') || 
        searchParams.get('id') || 
        searchParams.get('productId') || 
        searchParams.get('p');
  
      if (fromSearch && fromSearch.trim()) {
        return decodeURIComponent(fromSearch.trim());
      }
  
      // 2. Verificar rutas limpias en el pathname (ej: /product/prod_123 o /producto/prod_123)
      const pathMatch = window.location.pathname.match(/\/(?:product|producto)\/([a-zA-Z0-9_\-\.]+)/i);
      if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1].trim());
      }
  
      // 3. Verificar fragmentos hash (ej: #product-prod_123, #/product/prod_123, #?product=prod_123)
      const hash = window.location.hash;
      if (hash) {
        const hashClean = hash.startsWith('#') ? hash.slice(1) : hash;
  
        // Parámetros de búsqueda tras el hash (ej: #/?product=prod_123 o #?product=prod_123)
        const queryIdx = hashClean.indexOf('?');
        if (queryIdx !== -1) {
          const hashQueryParams = new URLSearchParams(hashClean.substring(queryIdx));
          const fromHashQuery = 
            hashQueryParams.get('product') || 
            hashQueryParams.get('id') || 
            hashQueryParams.get('productId') || 
            hashQueryParams.get('p');
  
          if (fromHashQuery && fromHashQuery.trim()) {
            return decodeURIComponent(fromHashQuery.trim());
          }
        }
  
        // Prefijo #product-ID o #producto-ID
        const prefixMatch = hashClean.match(/^(?:product|producto)-([a-zA-Z0-9_\-\.]+)/i);
        if (prefixMatch && prefixMatch[1]) {
          return decodeURIComponent(prefixMatch[1].trim());
        }
  
        // Ruta hash #/product/ID o #/producto/ID
        const routeMatch = hashClean.match(/\/(?:product|producto)\/([a-zA-Z0-9_\-\.]+)/i);
        if (routeMatch && routeMatch[1]) {
          return decodeURIComponent(routeMatch[1].trim());
        }
  
        // Sintaxis #product=ID
        const eqMatch = hashClean.match(/^product=([a-zA-Z0-9_\-\.]+)/i);
        if (eqMatch && eqMatch[1]) {
          return decodeURIComponent(eqMatch[1].trim());
        }
      }
    } catch (err) {
      console.error('Error al analizar ID de producto desde la URL:', err);
    }
  
    return null;
  };
  
  /**
   * Genera un enlace canónico y absoluto para compartir un producto.
   * Garantiza que funcione en navegadores móviles, escritorio, WhatsApp, Telegram, etc.
   */
  export const getProductShareUrl = (productId: string): string => {
    if (typeof window === 'undefined') return '';
    if (!productId) return window.location.origin;
  
    try {
      const currentUrl = new URL(window.location.href);
      // Limpiamos los parámetros de búsqueda y fragmentos previos para dejar una URL limpia
      const canonicalUrl = new URL(currentUrl.origin + currentUrl.pathname);
      canonicalUrl.searchParams.set('product', productId);
      return canonicalUrl.toString();
    } catch {
      return `${window.location.origin}/?product=${encodeURIComponent(productId)}`;
    }
  };
  