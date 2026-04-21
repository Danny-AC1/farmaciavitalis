import { useEffect, useRef } from 'react';

/**
 * Hook para detectar entrada de scanners USB que actúan como teclados.
 * @param onScan Callback cuando se detecta un código completo (terminado en Enter)
 * @param active Si el listener debe estar activo
 * @param minLength Longitud mínima del código para ser procesado
 */
export const useUSBScanner = (
  onScan: (code: string) => void, 
  active: boolean = true,
  minLength: number = 3
) => {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input o textarea (para dejar que el scanner escriba ahí si el usuario lo desea)
      // EXCEPCIÓN: Si queremos que el POS siempre capture el scanner incluso si no hay foco.
      // Pero usualmente, si el usuario está editando un campo de texto, no queremos que el scanner lo interrumpa.
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Si el foco está en un input, dejamos que el comportamiento natural del teclado/scanner funcione.
      // Excepto si es el POS y queremos captura global.
      if (isInput) {
          // Si es un input de tipo "text" o similar, el scanner escribirá ahí.
          // No procesamos el buffer manual aquí para evitar duplicados.
          return;
      }

      const currentTime = Date.now();
      
      // Los scanners suelen escribir muy rápido (menos de 50ms entre teclas)
      // Reseteamos el buffer si ha pasado mucho tiempo desde la última tecla
      if (currentTime - lastKeyTime.current > 100) {
        buffer.current = '';
      }

      if (e.key === 'Enter') {
        if (buffer.current.length >= minLength) {
          e.preventDefault(); // Prevenir submit accidental
          e.stopPropagation();
          onScan(buffer.current);
          buffer.current = '';
        }
      } else if (e.key.length === 1) {
        buffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, onScan, minLength]);
};
