import { MedicationSchedule } from '../types';
import { triggerNativeNotification } from './nativeNotificationService';
import { notificationAudio } from './notificationAudioService';

// Calcula cuántos días de tratamiento le quedan al medicamento
export const calculateRemainingDays = (med: MedicationSchedule): number => {
  if (!med.currentStock || med.currentStock <= 0) return 0;

  let dosesPerDay = 1;
  const freqLower = (med.frequencyLabel || '').toLowerCase();

  if (freqLower.includes('8') || freqLower.includes('3 vez') || freqLower.includes('3 veces')) {
    dosesPerDay = 3;
  } else if (freqLower.includes('12') || freqLower.includes('2 vez') || freqLower.includes('2 veces')) {
    dosesPerDay = 2;
  } else if (freqLower.includes('6') || freqLower.includes('4 vez') || freqLower.includes('4 veces')) {
    dosesPerDay = 4;
  } else if (freqLower.includes('24') || freqLower.includes('diario') || freqLower.includes('1 vez') || freqLower.includes('1 al día')) {
    dosesPerDay = 1;
  } else if (med.timesOfDay && med.timesOfDay.length > 0) {
    dosesPerDay = med.timesOfDay.length;
  }

  return Math.ceil(med.currentStock / dosesPerDay);
};

// Verifica si un tratamiento necesita recarga (<= 5 días de stock)
export const isRefillNeeded = (med: MedicationSchedule, customThresholdDays = 5): boolean => {
  const remainingDays = calculateRemainingDays(med);
  return med.active && remainingDays <= customThresholdDays;
};

// Dispara una prueba de notificación y sonido para validar la alarma de toma
export const testTreatmentAlarm = async (medName: string, patientName?: string) => {
  notificationAudio.playOrderChime();
  await triggerNativeNotification(`⏰ Recordatorio Vitalis: Hora de Medicina`, {
    body: `Es momento de tomar ${medName}${patientName ? ` para ${patientName}` : ''}. ¡Cuida tu salud!`,
    tag: `med-reminder-${Date.now()}`,
    requireInteraction: true
  });
};
