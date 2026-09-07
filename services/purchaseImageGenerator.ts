import { toPng, toBlob } from 'html-to-image';

/**
 * Captura un elemento DOM en PNG de alta resolución (2x Retina).
 */
export const captureElementToImage = async (
  element: HTMLElement,
  options?: { pixelRatio?: number }
): Promise<{ blob: Blob; dataUrl: string }> => {
  const pixelRatio = options?.pixelRatio || 2;

  const dataUrl = await toPng(element, {
    pixelRatio,
    quality: 0.98,
    cacheBust: true,
    backgroundColor: '#ffffff',
  });

  const blob = await toBlob(element, {
    pixelRatio,
    quality: 0.98,
    cacheBust: true,
    backgroundColor: '#ffffff',
  });

  if (!blob) {
    throw new Error('No se pudo convertir la lista de compras a imagen.');
  }

  return { blob, dataUrl };
};

/**
 * Descarga la lista de compras como imagen PNG en el dispositivo.
 */
export const downloadPurchaseListImage = async (
  element: HTMLElement,
  orderName: string = 'Lista-Compra-Vitalis'
): Promise<void> => {
  const { dataUrl } = await captureElementToImage(element);
  const cleanName = orderName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const link = document.createElement('a');
  link.download = `${cleanName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copia la imagen de la lista de compras directamente al portapapeles.
 */
export const copyPurchaseListImageToClipboard = async (
  element: HTMLElement
): Promise<boolean> => {
  try {
    const { blob } = await captureElementToImage(element);
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Error al copiar imagen de compra al portapapeles:', err);
    return false;
  }
};
