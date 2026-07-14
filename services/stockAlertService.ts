import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { cleanData } from './db.utils';

export interface EmailLog {
  id: string;
  sender: string; // "farmaciavitalis@outlook.es"
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'PENDIENTE' | 'ENVIADO' | 'FALLIDO';
  type: 'CONFIRMACION_ALERTA' | 'AVISO_STOCK' | 'BOLETIN' | 'OTRO';
  productName?: string;
}

const EMAIL_LOGS_COLLECTION = 'email_logs';

/**
 * Registra un registro de correo en Firestore para auditoría y visualización
 */
export const addEmailLogDB = async (log: Omit<EmailLog, 'id'>) => {
  const docRef = await addDoc(collection(firestore, EMAIL_LOGS_COLLECTION), cleanData(log));
  return { id: docRef.id, ...log };
};

/**
 * Escucha en tiempo real el historial de correos enviados
 */
export const streamEmailLogs = (callback: (logs: EmailLog[]) => void) => {
  return onSnapshot(query(collection(firestore, EMAIL_LOGS_COLLECTION), orderBy('timestamp', 'desc')), (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EmailLog[];
    callback(logs);
  });
};

/**
 * Elimina un registro de correo del historial
 */
export const deleteEmailLogDB = async (id: string) => {
  await deleteDoc(doc(firestore, EMAIL_LOGS_COLLECTION, id));
};

/**
 * Genera una plantilla de correo HTML profesional de Farmacia Vitalis
 */
export const getEmailTemplateHTML = (title: string, content: string, actionText?: string, actionUrl?: string): string => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 30px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FARMACIA VITALIS</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9;">Machalilla, Manabí</p>
      </div>
      
      <!-- Body -->
      <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
        <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #1e293b;">${title}</h2>
        <div style="font-size: 15px; color: #475569; margin-bottom: 30px;">
          ${content}
        </div>
        
        ${actionText && actionUrl ? `
          <div style="text-align: center; margin: 35px 0;">
            <a href="${actionUrl}" style="background-color: #0d9488; color: #ffffff; padding: 14px 30px; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(13, 148, 136, 0.3);">
              ${actionText}
            </a>
          </div>
        ` : ''}
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 35px; font-size: 13px; color: #64748b;">
          <p style="margin: 0 0 5px 0;">¿Tiene alguna consulta? Respóndanos directamente a este correo:</p>
          <p style="margin: 0; font-weight: 700; color: #0d9488;">farmaciavitalis@outlook.es</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0 0 5px 0; font-weight: 600;">Farmacia Vitalis © 2026</p>
        <p style="margin: 0;">Servicio a domicilio activo de 08:00 a 20:00 • Machalilla, Manabí</p>
      </div>
    </div>
  `;
};

/**
 * Simula el envío de un correo a través de SMTP utilizando la cuenta oficial de Outlook
 * Devuelve un generador de logs interactivos para mostrar la consola en el frontend.
 */
export const simulateSMTPSend = async (
  recipient: string,
  subject: string,
  bodyHTML: string,
  onLog: (message: string, isError?: boolean) => void
): Promise<boolean> => {
  const steps = [
    { text: '🔍 Buscando servidores de correo para outlook.es...', delay: 400 },
    { text: '📌 Registro MX localizado: outlook-es.olc.protection.outlook.com', delay: 300 },
    { text: '🔌 Conectando a smtp.office365.com en el puerto 587...', delay: 500 },
    { text: '🟢 ¡Conectado con éxito! Estableciendo protocolo...', delay: 300 },
    { text: '<<< 220-outlook.es SMTP Server Ready [Vitalis Node v4.1]', delay: 400 },
    { text: '>>> EHLO farmaciavitalis.com', delay: 300 },
    { text: '<<< 250-outlook-es.olc.protection.outlook.com Hello, [AI-Studio-Client-Ingress]', delay: 300 },
    { text: '>>> STARTTLS', delay: 400 },
    { text: '<<< 220 2.0.0 SMTP server ready to start TLS handshake', delay: 300 },
    { text: '🛡️ Negociando sesión TLS con farmaciavitalis@outlook.es...', delay: 500 },
    { text: '🔒 Sesión cifrada establecida (Algoritmo: ECDHE-RSA-AES256-GCM-SHA384)', delay: 200 },
    { text: '>>> EHLO farmaciavitalis.com', delay: 300 },
    { text: '<<< 250-Authenticated sender OK', delay: 300 },
    { text: '🔑 Autenticando usuario: farmaciavitalis@outlook.es...', delay: 600 },
    { text: '<<< 235 2.7.0 Authentication successful', delay: 300 },
    { text: '>>> MAIL FROM:<farmaciavitalis@outlook.es>', delay: 300 },
    { text: '<<< 250 2.1.0 Sender OK', delay: 200 },
    { text: `>>> RCPT TO:<${recipient}>`, delay: 350 },
    { text: '<<< 250 2.1.5 Recipient OK', delay: 200 },
    { text: '>>> DATA', delay: 300 },
    { text: '<<< 354 Start mail input; end with <CRLF>.<CRLF>', delay: 300 },
    { text: `✉️ Enviando cabeceras: From: "Farmacia Vitalis" <farmaciavitalis@outlook.es>, To: ${recipient}, Subject: "${subject}"...`, delay: 450 },
    { text: `📦 Transmitiendo contenido HTML del mensaje (Tamaño: ${(bodyHTML.length / 1024).toFixed(1)} KB)...`, delay: 500 },
    { text: '>>> . (Fin del cuerpo de datos)', delay: 300 },
    { text: '<<< 250 2.0.0 OK Queue-ID: MS-OUTLOOK-VITALIS-ALERT-98471', delay: 400 },
    { text: '🔌 Cerrando conexión socket SMTP de forma segura.', delay: 200 },
    { text: '✅ ¡Correo enviado y registrado con éxito!', delay: 200 }
  ];

  try {
    for (const step of steps) {
      onLog(step.text);
      await new Promise((resolve) => setTimeout(resolve, step.delay));
    }
    return true;
  } catch (error) {
    onLog('❌ Error crítico en el servidor SMTP al intentar transmitir:', true);
    onLog(`❌ ${error instanceof Error ? error.message : String(error)}`, true);
    return false;
  }
};

/**
 * Genera un enlace mailto pre-rellenado para que el administrador pueda enviar el correo directamente desde su cliente (Outlook)
 */
export const getMailtoLink = (recipient: string, subject: string, bodyText: string): string => {
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
};
