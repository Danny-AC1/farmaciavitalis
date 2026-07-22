import { addPrescriptionDB, uploadImageToStorage, sendNotification } from './db';
import { sendMessageAsUser } from './db.support';
import { User, Prescription } from '../types';
import { triggerNativeNotification } from './nativeNotificationService';

export interface SendPrescriptionParams {
  file: File;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
  currentUser?: User | null;
}

export const sendPrescriptionToChatAndDB = async ({
  file,
  patientName,
  patientPhone,
  patientEmail,
  notes,
  currentUser
}: SendPrescriptionParams) => {
  // 1. Process image to base64
  const imageUrl = await uploadImageToStorage(file, `prescriptions/${Date.now()}_${file.name}`);

  // 2. Determine target user ID for the chat session
  const targetUserId = currentUser?.uid || `guest_${patientPhone.replace(/\D/g, '') || Date.now()}`;
  
  const userForChat: User = currentUser || {
    uid: targetUserId,
    displayName: patientName.trim(),
    email: patientEmail?.trim() || `cliente_${patientPhone.replace(/\D/g, '')}@vitalis.app`,
    role: 'USER',
    points: 0,
    createdAt: new Date().toISOString()
  };

  // 3. Save prescription in Firestore database
  const prescriptionRecord: Prescription = {
    userId: targetUserId,
    patientName: patientName.trim(),
    patientPhone: patientPhone.trim(),
    patientEmail: patientEmail?.trim() || undefined,
    imageUrl,
    status: 'PENDIENTE',
    createdAt: new Date().toISOString(),
    notes: notes?.trim() || undefined
  };

  const prescriptionId = await addPrescriptionDB(prescriptionRecord);

  // 4. Construct rich formatted chat message
  const chatText = [
    `📋 *RECETA MÉDICA SUBIDA PARA COTIZACIÓN*`,
    `👤 *Paciente:* ${patientName.trim()}`,
    `📞 *Teléfono:* ${patientPhone.trim()}`,
    patientEmail?.trim() ? `✉️ *Email:* ${patientEmail.trim()}` : null,
    notes?.trim() ? `📝 *Nota del cliente:* "${notes.trim()}"` : null,
    ``,
    `💊 *Un farmacéutico de Vitalis procesará tu receta y te responderá la cotización por este chat.*`
  ].filter(Boolean).join('\n');

  // 5. Send message directly into Support Chat
  await sendMessageAsUser(
    targetUserId,
    userForChat,
    chatText,
    imageUrl,
    'image'
  );

  // 6. Trigger native notifications and in-app notifications
  if (currentUser?.uid) {
    await sendNotification({
      userId: currentUser.uid,
      title: '📋 Receta Recibida',
      message: `Hola ${patientName}. Recibimos tu receta y la estamos cotizando. Te responderemos en el chat.`,
      type: 'SYSTEM'
    });
  }

  // Trigger immediate native notification on device
  triggerNativeNotification(`📋 Receta Médica Registrada`, {
    body: `Receta de ${patientName.trim()} enviada con éxito. Te cotizaremos en breve.`
  });

  return {
    prescriptionId,
    targetUserId
  };
};
