import { toPng, toBlob } from 'html-to-image';
import { Order } from '../types';

export interface ImageGenerationResult {
  success: boolean;
  message?: string;
  blob?: Blob;
  dataUrl?: string;
}

/**
 * Genera un Blob o DataURL en alta definición (2x Retina) a partir del nodo DOM del comprobante.
 */
export const captureReceiptElement = async (
  element: HTMLElement,
  options?: { pixelRatio?: number }
): Promise<{ blob: Blob; dataUrl: string }> => {
  const pixelRatio = options?.pixelRatio || 2;

  // Generamos el Data URL en PNG de alta resolución
  const dataUrl = await toPng(element, {
    pixelRatio,
    quality: 0.98,
    cacheBust: true,
    backgroundColor: '#ffffff'
  });

  // Convertimos a Blob
  const blob = await toBlob(element, {
    pixelRatio,
    quality: 0.98,
    cacheBust: true,
    backgroundColor: '#ffffff'
  });

  if (!blob) {
    throw new Error('No se pudo convertir el comprobante a formato de imagen.');
  }

  return { blob, dataUrl };
};

/**
 * Descarga el comprobante como archivo PNG en el dispositivo.
 */
export const downloadReceiptImage = async (
  element: HTMLElement,
  orderNumber: string
): Promise<void> => {
  const { dataUrl } = await captureReceiptElement(element);
  const link = document.createElement('a');
  link.download = `Comprobante-Vitalis-${orderNumber}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copia la imagen del comprobante directamente al portapapeles (compatible con WhatsApp Web y navegadores modernos).
 */
export const copyReceiptImageToClipboard = async (
  element: HTMLElement
): Promise<boolean> => {
  try {
    const { blob } = await captureReceiptElement(element);
    
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Error al copiar imagen al portapapeles:', err);
    return false;
  }
};

/**
 * Comparte el comprobante como archivo de imagen utilizando el Web Share API si el dispositivo lo soporta.
 * Si soporta compartir archivos, permite seleccionar WhatsApp para enviar directamente la foto.
 */
export const shareReceiptImageNative = async (
  element: HTMLElement,
  order: Order
): Promise<{ shared: boolean; reason?: 'NOT_SUPPORTED' | 'ABORTED' | 'ERROR' }> => {
  try {
    const { blob } = await captureReceiptElement(element);
    const orderNum = order.id.slice(-6).toUpperCase();
    const fileName = `Comprobante-Vitalis-${orderNum}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: `Comprobante #${orderNum} - Farmacia Vitalis`,
        text: `Comprobante de compra para ${order.customerName} - Farmacia Vitalis`,
        files: [file]
      });
      return { shared: true };
    }

    return { shared: false, reason: 'NOT_SUPPORTED' };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { shared: false, reason: 'ABORTED' };
    }
    console.warn('Error al compartir imagen nativamente:', err);
    return { shared: false, reason: 'ERROR' };
  }
};
