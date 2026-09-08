import { useState, useMemo, useRef } from 'react';
import { Order } from '../../../types';
import { 
  generateReceiptText, 
  generateWhatsAppLink, 
  generateTelegramLink, 
  generateSmsLink, 
  generateReceiptEmail, 
  executeNativeShare 
} from '../../../utils/receiptSharing';
import { printPOSTicket } from '../../../utils/posTicketPrinter';
import { 
  downloadReceiptImage, 
  copyReceiptImageToClipboard, 
  shareReceiptImageNative 
} from '../../../utils/receiptImageGenerator';

export function useReceiptShareState(order: Order | null) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [phoneOverride, setPhoneOverride] = useState<string>(order?.customerPhone || '');
  const [emailOverride, setEmailOverride] = useState<string>(order?.customerEmail || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'image' | 'visual' | 'text'>('image');
  const [justSharedNative, setJustSharedNative] = useState<boolean>(false);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [imageNotice, setImageNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const formattedReceiptText = useMemo(() => {
    return order ? generateReceiptText(order) : '';
  }, [order]);

  const handleCopyText = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(formattedReceiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = formattedReceiptText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    if (!order) return;
    window.open(generateWhatsAppLink(order, phoneOverride), '_blank', 'noopener,noreferrer');
  };

  const handleTelegram = () => {
    if (!order) return;
    window.open(generateTelegramLink(order), '_blank', 'noopener,noreferrer');
  };

  const handleSms = () => {
    if (!order) return;
    window.location.href = generateSmsLink(order, phoneOverride);
  };

  const handleEmail = () => {
    if (!order) return;
    const { subject, body } = generateReceiptEmail(order);
    const targetEmail = emailOverride || order.customerEmail || '';
    window.location.href = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleNativeShare = async () => {
    if (!order) return;
    const shared = await executeNativeShare(order);
    if (shared) {
      setJustSharedNative(true);
      setTimeout(() => setJustSharedNative(false), 3000);
    }
  };

  const handlePrint = () => {
    if (!order) return;
    printPOSTicket(order);
  };

  const handleShareImage = async () => {
    if (!cardRef.current || !order) return;
    setIsProcessingImage(true);
    setImageNotice({ type: 'info', text: 'Preparando imagen del comprobante...' });
    try {
      const result = await shareReceiptImageNative(cardRef.current, order);
      if (result.shared) {
        setImageNotice({ type: 'success', text: '¡Comprobante compartido exitosamente!' });
      } else if (result.reason === 'ABORTED') {
        setImageNotice(null);
      } else {
        setImageNotice({ type: 'info', text: 'Descargando imagen para que la envíes manualmente...' });
        await downloadReceiptImage(cardRef.current, order.id.slice(-6).toUpperCase());
      }
    } catch (err) {
      console.error(err);
      setImageNotice({ type: 'error', text: 'No se pudo compartir la imagen directamente.' });
    } finally {
      setIsProcessingImage(false);
      setTimeout(() => setImageNotice(null), 4000);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || !order) return;
    setIsProcessingImage(true);
    setImageNotice({ type: 'info', text: 'Generando archivo de imagen PNG...' });
    try {
      await downloadReceiptImage(cardRef.current, order.id.slice(-6).toUpperCase());
      setImageNotice({ type: 'success', text: '¡Imagen PNG descargada con éxito!' });
    } catch (err) {
      console.error(err);
      setImageNotice({ type: 'error', text: 'Error al generar la descarga de la imagen.' });
    } finally {
      setIsProcessingImage(false);
      setTimeout(() => setImageNotice(null), 4000);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current || !order) return;
    setIsProcessingImage(true);
    setImageNotice({ type: 'info', text: 'Copiando imagen al portapapeles...' });
    try {
      const success = await copyReceiptImageToClipboard(cardRef.current);
      if (success) {
        setCopiedImage(true);
        setImageNotice({ 
          type: 'success', 
          text: '¡Imagen copiada! Ve a WhatsApp Web o chat y presiona Ctrl + V para pegarla.' 
        });
        setTimeout(() => setCopiedImage(false), 3500);
      } else {
        await downloadReceiptImage(cardRef.current, order.id.slice(-6).toUpperCase());
        setImageNotice({ 
          type: 'info', 
          text: 'Tu navegador no admite copiado directo. Se ha descargado la imagen PNG.' 
        });
      }
    } catch (err) {
      console.error(err);
      setImageNotice({ type: 'error', text: 'Error al copiar la imagen.' });
    } finally {
      setIsProcessingImage(false);
      setTimeout(() => setImageNotice(null), 4500);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return {
    cardRef, phoneOverride, setPhoneOverride, emailOverride, setEmailOverride,
    copied, copiedImage, activePreviewTab, setActivePreviewTab, justSharedNative,
    isProcessingImage, imageNotice, formattedReceiptText, hasNativeShare,
    handleCopyText, handleWhatsApp, handleTelegram, handleSms, handleEmail,
    handleNativeShare, handlePrint, handleShareImage, handleDownloadImage, handleCopyImage
  };
}
