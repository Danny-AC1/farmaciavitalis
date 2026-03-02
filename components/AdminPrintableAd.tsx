
import React from 'react';
import { Printer, QrCode, Sparkles } from 'lucide-react';

const AdminPrintableAd: React.FC = () => {
  const appUrl = "https://farmaciavitalis.vercel.app";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(appUrl)}`;

  const handlePrintAd = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Publicidad Vitalis - Imprimir</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Anton&display=swap');
            @page { margin: 0; size: A4; }
            body { 
              font-family: 'Inter', sans-serif; 
              margin: 0; 
              padding: 0;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
            }
            .page {
              width: 210mm;
              height: 297mm;
              padding: 0;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              position: relative;
              overflow: hidden;
              background: #ffffff;
            }
            .bg-accent {
              position: absolute;
              top: 0;
              right: 0;
              width: 100%;
              height: 130mm;
              background: #0d9488;
              clip-path: polygon(0 0, 100% 0, 100% 85%, 0% 100%);
              z-index: 1;
            }
            .watermark {
              position: absolute;
              top: 10mm;
              left: -15mm;
              font-family: 'Anton', sans-serif;
              font-size: 400pt;
              color: rgba(255, 255, 255, 0.07);
              line-height: 1;
              z-index: 2;
              pointer-events: none;
            }
            .content {
              position: relative;
              z-index: 10;
              display: flex;
              flex-direction: column;
              align-items: center;
              height: 100%;
              padding: 15mm;
              box-sizing: border-box;
            }
            .header {
              width: 100%;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10mm;
            }
            .logo {
              font-size: 48pt;
              font-weight: 900;
              color: #ffffff;
              letter-spacing: -2px;
              margin: 0;
              line-height: 1;
            }
            .logo span { color: #0f172a; }
            .slogan {
              font-size: 11pt;
              font-weight: 700;
              color: rgba(255, 255, 255, 0.9);
              text-transform: uppercase;
              letter-spacing: 5px;
              margin-top: 3mm;
            }
            .hero-section {
              text-align: center;
              margin: 5mm 0 10mm 0;
            }
            .main-title {
              font-size: 54pt;
              font-weight: 900;
              color: #ffffff;
              line-height: 0.85;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: -2px;
            }
            .highlight {
              color: #0f172a;
              display: block;
              font-size: 72pt;
              margin-top: 2mm;
            }
            .qr-main-container {
              background: #ffffff;
              padding: 10mm;
              border-radius: 40px;
              box-shadow: 0 15mm 30mm rgba(0,0,0,0.12);
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 5mm;
              margin: 0 0 10mm 0;
              border: 1px solid #f1f5f9;
            }
            .qr-image {
              width: 70mm;
              height: 70mm;
              padding: 4mm;
              background: white;
              border-radius: 15px;
              border: 1px solid #e2e8f0;
            }
            .qr-instruction {
              background: #0d9488;
              color: white;
              padding: 3mm 12mm;
              border-radius: 100px;
              font-size: 18pt;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .benefits-row {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8mm;
              width: 100%;
              margin-top: auto;
              padding-bottom: 10mm;
            }
            .benefit-box {
              text-align: center;
              padding: 4mm;
              border-top: 3px solid #0d9488;
            }
            .benefit-num {
              font-family: 'Anton', sans-serif;
              font-size: 28pt;
              color: #0d9488;
              opacity: 0.2;
              margin-bottom: 1mm;
              display: block;
            }
            .benefit-title {
              font-weight: 900;
              font-size: 14pt;
              color: #0f172a;
              margin-bottom: 2mm;
              text-transform: uppercase;
            }
            .benefit-text {
              font-size: 11pt;
              color: #1e293b;
              font-weight: 600;
              line-height: 1.4;
            }
            .footer-bar {
              width: 100%;
              padding: 8mm 0;
              border-top: 2px solid #0d9488;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: auto;
            }
            .footer-info {
              font-size: 12pt;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="page">
            <div class="bg-accent"></div>
            <div class="watermark">V</div>
            
            <div class="content">
              <div class="header">
                <div>
                  <h1 class="logo">VITALIS<span></span></h1>
                  <div class="slogan">Tu Salud Al Día</div>
                </div>
              </div>

              <div class="hero-section">
                <h2 class="main-title">
                  Regístrate y
                  <span class="highlight">GANA</span>
                  Puntos y Promociones
                </h2>
              </div>

              <div class="qr-main-container">
                <img src="${qrUrl}" class="qr-image" alt="QR Code" />
                <div class="qr-instruction">Escanea para Unirte</div>
              </div>

              <div class="benefits-row">
                <div class="benefit-box">
                  <span class="benefit-num"></span>
                  <div class="benefit-title">Puntos Vitalis</div>
                  <div class="benefit-text">Acumula en cada compra y canjea por medicina gratis.</div>
                </div>
                <div class="benefit-box">
                  <span class="benefit-num"></span>
                  <div class="benefit-title">Ofertas VIP</div>
                  <div class="benefit-text">Acceso exclusivo a descuentos y promociones semanales.</div>
                </div>
                <div class="benefit-box">
                  <span class="benefit-num"></span>
                  <div class="benefit-title">Control Total</div>
                  <div class="benefit-text">Recordatorios de dosis y gestión de salud familiar.</div>
                </div>
              </div>

              <div class="footer-bar">
                <div class="footer-info">Machalilla, Ecuador</div>
                <div class="footer-info">www.vitalis.com.ec</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow lg:col-span-2">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600">
            <QrCode size={32} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight">Publicidad para Local</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Genera un volante imprimible con QR</p>
          </div>
        </div>
        
        <button 
          onClick={handlePrintAd}
          className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
        >
          <Printer size={20} />
          <Sparkles size={16} />
          IMPRIMIR PUBLICIDAD QR
        </button>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          Diseño Profesional
        </div>
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          QR Auto-generado
        </div>
        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-pink-500"></div>
          Llamado a la Acción
        </div>
      </div>
    </div>
  );
};

export default AdminPrintableAd;
