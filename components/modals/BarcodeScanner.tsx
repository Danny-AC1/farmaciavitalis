import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Inicializar el scanner
    // "reader" es el ID del div donde se renderiza
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        // Success callback
        onScan(decodedText);
        // Opcional: Cerrar automáticamente al escanear
        // onClose(); 
      },
      (errorMessage) => {
        // Error callback (ignoring for UI cleanliness unless permissions fail)
        if (errorMessage.includes("permission")) {
            setError("Permiso de cámara denegado.");
        }
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl overflow-hidden relative">
        <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold">Escanear Producto</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-4 bg-gray-100">
             {error ? (
                 <div className="text-red-500 text-center p-4">{error}</div>
             ) : (
                 <div id="reader" className="w-full"></div>
             )}
             <p className="text-center text-xs text-gray-500 mt-2">
                 Apunta la cámara al código de barras del producto.
             </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;