import { Product } from '../types';

export interface StockAlertConfig {
  unitThreshold: number; // Cantidad límite en unidades para productos individuales/sueltos (ej: <= 5 uds)
  boxThreshold: number;  // Cantidad límite en unidades para productos en caja (ej: <= 5 unidades restantes de la caja de 50)
  isLinked?: boolean;    // Desvinculados por defecto
}

export interface ProductStockAlertResult {
  isAlert: boolean;
  isOutOfStock: boolean;
  isBoxProduct: boolean;
  unitsPerBox: number;
  stockUnits: number;
  stockBoxes: number; // Unidades divididas para unidades por caja
  appliedThreshold: number;
  thresholdType: 'UNIT' | 'BOX';
  suggestedPurchaseQty: number; // Cantidad sugerida para reponer
  badgeText: string;
  badgeColor: 'rose' | 'amber' | 'emerald';
}

const STORAGE_KEY = 'vitalis_stock_alert_config';

const DEFAULT_CONFIG: StockAlertConfig = {
  unitThreshold: 5,
  boxThreshold: 5,
  isLinked: false,
};

/**
 * Obtiene la configuración actual de alertas de stock guardada por el usuario.
 */
export const getStockAlertConfig = (): StockAlertConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      unitThreshold: typeof parsed.unitThreshold === 'number' ? Math.max(0, parsed.unitThreshold) : DEFAULT_CONFIG.unitThreshold,
      boxThreshold: typeof parsed.boxThreshold === 'number' ? Math.max(0, parsed.boxThreshold) : DEFAULT_CONFIG.boxThreshold,
      isLinked: false, // Siempre desvinculados por solicitud del usuario
    };
  } catch (e) {
    console.error('Error al leer configuración de alertas de stock:', e);
    return { ...DEFAULT_CONFIG };
  }
};

/**
 * Guarda la configuración de alertas de stock elegida por el usuario y notifica en tiempo real.
 */
export const saveStockAlertConfig = (config: StockAlertConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vitalis_stock_alert_changed', { detail: config }));
    }
  } catch (e) {
    console.error('Error al guardar configuración de alertas de stock:', e);
  }
};

/**
 * Evalúa de forma inteligente si un producto específico ha cumplido la condición de alerta de stock.
 * - Para productos que vienen en caja (unitsPerBox > 1, ej: Amoxicilina caja x 50): evalúa si las UNIDADES restantes
 *   del medicamento en inventario son <= boxThreshold (ej: si quedan <= 5 unidades de la caja).
 * - Para productos por unidad individual (unitsPerBox <= 1): evalúa si el stock en unidades es <= unitThreshold.
 * Ambos umbrales están 100% desvinculados.
 */
export const evaluateProductStockAlert = (
  product: Product,
  config: StockAlertConfig = getStockAlertConfig()
): ProductStockAlertResult => {
  const unitsPerBox = product.unitsPerBox && product.unitsPerBox > 1 ? product.unitsPerBox : 1;
  const isBoxProduct = unitsPerBox > 1;
  const stockUnits = Math.max(0, product.stock || 0);
  const isOutOfStock = stockUnits === 0;

  if (isBoxProduct) {
    // Producto registrado por CAJA (ej: Amoxicilina caja x 50 unidades)
    // El usuario define el umbral en UNIDADES RESTANTES del producto (ej: alertar cuando queden <= 5 uds en stock)
    const stockBoxes = stockUnits / unitsPerBox;
    const isAlert = stockUnits <= config.boxThreshold;
    
    // Sugerencia de compra inteligente: al menos 1 caja para reabastecer
    const neededBoxes = 1;

    let badgeText = '';
    let badgeColor: 'rose' | 'amber' | 'emerald' = 'emerald';

    if (isOutOfStock) {
      badgeText = 'Agotado (0 uds / 0 cj)';
      badgeColor = 'rose';
    } else if (isAlert) {
      badgeText = `Alerta: ${stockUnits} uds restantes ≤ ${config.boxThreshold} uds (Cj x ${unitsPerBox})`;
      badgeColor = stockUnits <= Math.min(2, config.boxThreshold) ? 'rose' : 'amber';
    } else {
      const formattedBoxes = Number.isInteger(stockBoxes) ? stockBoxes.toString() : stockBoxes.toFixed(1);
      badgeText = `${stockUnits} uds (${formattedBoxes} cj de ${unitsPerBox})`;
      badgeColor = 'emerald';
    }

    return {
      isAlert,
      isOutOfStock,
      isBoxProduct: true,
      unitsPerBox,
      stockUnits,
      stockBoxes,
      appliedThreshold: config.boxThreshold,
      thresholdType: 'BOX',
      suggestedPurchaseQty: isAlert ? neededBoxes : 1,
      badgeText,
      badgeColor,
    };
  } else {
    // Producto registrado por UNIDAD SUELTA (ej: jarabes, cremas o medicamentos que no vienen en caja)
    const isAlert = stockUnits <= config.unitThreshold;
    const neededUnits = Math.max(1, config.unitThreshold - stockUnits + 1);

    let badgeText = '';
    let badgeColor: 'rose' | 'amber' | 'emerald' = 'emerald';

    if (isOutOfStock) {
      badgeText = 'Agotado (0 uds)';
      badgeColor = 'rose';
    } else if (isAlert) {
      badgeText = `Alerta: ${stockUnits} uds ≤ ${config.unitThreshold} uds`;
      badgeColor = stockUnits <= 1 ? 'rose' : 'amber';
    } else {
      badgeText = `${stockUnits} uds`;
      badgeColor = 'emerald';
    }

    return {
      isAlert,
      isOutOfStock,
      isBoxProduct: false,
      unitsPerBox: 1,
      stockUnits,
      stockBoxes: stockUnits,
      appliedThreshold: config.unitThreshold,
      thresholdType: 'UNIT',
      suggestedPurchaseQty: isAlert ? neededUnits : 1,
      badgeText,
      badgeColor,
    };
  }
};

/**
 * Filtra y agrupa los productos que están en alerta según la configuración activa.
 */
export const filterProductsInAlert = (
  products: Product[],
  config: StockAlertConfig = getStockAlertConfig()
) => {
  const allInAlert: Product[] = [];
  const unitProductsInAlert: Product[] = [];
  const boxProductsInAlert: Product[] = [];
  const outOfStockProducts: Product[] = [];

  for (const product of products) {
    const evalResult = evaluateProductStockAlert(product, config);
    if (evalResult.isOutOfStock) {
      outOfStockProducts.push(product);
    }
    if (evalResult.isAlert) {
      allInAlert.push(product);
      if (evalResult.isBoxProduct) {
        boxProductsInAlert.push(product);
      } else {
        unitProductsInAlert.push(product);
      }
    }
  }

  return {
    all: allInAlert,
    unitProducts: unitProductsInAlert,
    boxProducts: boxProductsInAlert,
    outOfStock: outOfStockProducts,
    totalCount: allInAlert.length,
  };
};

/* =========================================================================
   COMPATIBILIDAD CON NOTIFICACIONES POR CORREO Y CONSOLA SMTP
   ========================================================================= */

export interface EmailLog {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'ENVIADO' | 'FALLIDO';
  type: string;
  productName?: string;
}

const STORAGE_EMAIL_LOGS = 'vitalis_email_dispatch_logs';

export const getStoredEmailLogs = (): EmailLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_EMAIL_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredEmailLogs = (logs: EmailLog[]): void => {
  try {
    localStorage.setItem(STORAGE_EMAIL_LOGS, JSON.stringify(logs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vitalis_email_logs_updated'));
    }
  } catch (e) {
    console.error('Error al guardar registros de correo:', e);
  }
};

/**
 * Escucha en tiempo real el historial de correos despachados
 */
export const streamEmailLogs = (callback: (logs: EmailLog[]) => void): (() => void) => {
  const handler = () => {
    callback(getStoredEmailLogs());
  };
  handler();
  window.addEventListener('vitalis_email_logs_updated', handler);
  return () => window.removeEventListener('vitalis_email_logs_updated', handler);
};

/**
 * Guarda un registro de correo despachado
 */
export const addEmailLogDB = async (logData: Omit<EmailLog, 'id'>): Promise<string> => {
  const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newLog: EmailLog = { ...logData, id };
  const current = getStoredEmailLogs();
  saveStoredEmailLogs([newLog, ...current]);
  return id;
};

/**
 * Elimina un registro de correo del historial
 */
export const deleteEmailLogDB = async (id: string): Promise<void> => {
  const current = getStoredEmailLogs();
  const filtered = current.filter(l => l.id !== id);
  saveStoredEmailLogs(filtered);
};

/**
 * Simula el protocolo de transporte SMTP interactivo paso a paso para la consola administrativa
 */
export const simulateSMTPSend = async (
  recipient: string,
  subject: string,
  htmlBody: string,
  onLog: (msg: string) => void
): Promise<boolean> => {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  try {
    onLog('>>> Conectando a smtp-mail.outlook.com:587 (STARTTLS)...');
    await delay(200);
    onLog('<<< 220 VI1PR01CA0021.outlook.office365.com Microsoft ESMTP MAIL Service ready');
    await delay(150);

    onLog('>>> EHLO vitalis-farmacia.local');
    await delay(150);
    onLog('<<< 250-VI1PR01CA0021.outlook.office365.com Hello');
    onLog('<<< 250-STARTTLS');
    onLog('<<< 250-AUTH LOGIN XOAUTH2');
    onLog('<<< 250 SIZE 36700160');
    await delay(150);

    onLog('>>> STARTTLS');
    await delay(150);
    onLog('<<< 220 2.0.0 SMTP server ready, TLS handshake initiated...');
    await delay(150);
    onLog('✅ Cifrado TLSv1.3 establecido (Cipher: TLS_AES_256_GCM_SHA384)');

    onLog('>>> AUTH LOGIN');
    await delay(120);
    onLog('<<< 334 VXNlcm5hbWU6 (Username challenge)');
    onLog('>>> [Credentials sent for: farmaciavitalis@outlook.es]');
    await delay(150);
    onLog('<<< 235 2.7.0 Authentication successful');

    onLog('>>> MAIL FROM:<farmaciavitalis@outlook.es>');
    await delay(120);
    onLog('<<< 250 2.1.0 Sender OK');

    onLog(`>>> RCPT TO:<${recipient}>`);
    await delay(120);
    onLog(`<<< 250 2.1.5 Recipient <${recipient}> OK`);

    onLog('>>> DATA');
    await delay(100);
    onLog('<<< 354 Start mail input; end with <CRLF>.<CRLF>');
    onLog(`>>> MIME-Version: 1.0 | Subject: ${subject} | Size: ${Math.round(htmlBody.length / 1024)} KB`);
    await delay(200);
    onLog('<<< 250 2.0.0 OK Message queued for immediate delivery [ID=VTL-MSG-88219]');
    onLog(`✅ Correo entregado exitosamente al servidor de correo de ${recipient}`);

    return true;
  } catch (err: any) {
    onLog(`❌ Error en la negociación SMTP: ${err.message || 'Fallo de conexión'}`);
    return false;
  }
};

/**
 * Genera la plantilla de correo corporativo de Farmacia Vitalis
 */
export const getEmailTemplateHTML = (
  title: string,
  contentHtml: string,
  actionText?: string,
  actionUrl?: string
): string => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1e293b;">
      <div style="background-color: #0f172a; background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">FARMACIA VITALIS</h1>
        <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #5eead4; font-weight: 700;">Salud & Bienestar en Machalilla</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px;">${title}</h2>
        <div style="font-size: 14px; line-height: 1.6; color: #475569;">
          ${contentHtml}
        </div>
        ${actionText && actionUrl ? `
          <div style="text-align: center; margin-top: 32px;">
            <a href="${actionUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 13px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);">
              ${actionText}
            </a>
          </div>
        ` : ''}
      </div>
      <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 4px 0;">Farmacia Vitalis • Machalilla, Manabí, Ecuador</p>
        <p style="margin: 0;">Atención de Lunes a Domingo de 08:00 a 20:00 • Correo: farmaciavitalis@outlook.es</p>
      </div>
    </div>
  `;
};

/**
 * Genera un enlace mailto directo como alternativa rápida
 */
export const getMailtoLink = (recipient: string, subject: string, body: string): string => {
  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
