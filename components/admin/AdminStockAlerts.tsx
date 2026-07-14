import React, { useState, useEffect } from 'react';
import { StockAlert, Product } from '../../types';
import { 
  BellRing, Mail, Package, Trash2, Calendar, Send, CheckCircle, 
  Terminal, ShieldCheck, MailOpen, RefreshCw, Layers, ExternalLink, Eye, Info
} from 'lucide-react';
import { 
  EmailLog, streamEmailLogs, addEmailLogDB, deleteEmailLogDB, 
  simulateSMTPSend, getEmailTemplateHTML, getMailtoLink 
} from '../../services/stockAlertService';

interface AdminStockAlertsProps {
  alerts: StockAlert[];
  products: Product[];
  onDelete: (id: string) => Promise<void>;
}

const AdminStockAlerts: React.FC<AdminStockAlertsProps> = ({ alerts, products, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // SMTP Console State
  const [smtpConsoleOpen, setSmtpConsoleOpen] = useState(false);
  const [smtpLogs, setSmtpLogs] = useState<string[]>([]);
  const [smtpStatus, setSmtpStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [activeRecipient, setActiveRecipient] = useState('');
  const [activeSubject, setActiveSubject] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');

  // Bulk dispatch state
  const [isBulkDispatching, setIsBulkDispatching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Stream email logs history
  useEffect(() => {
    setLoadingHistory(true);
    const unsub = streamEmailLogs((logs) => {
      setEmailLogs(logs);
      setLoadingHistory(false);
    });
    return () => unsub();
  }, []);

  // Encontrar el producto y verificar si ya hay stock disponible
  const getAlertStatus = (alert: StockAlert) => {
    const product = products.find(p => p.id === alert.productId);
    if (!product) return { label: 'Eliminado', color: 'bg-gray-100 text-gray-400', hasStock: false, stock: 0 };
    if (product.stock > 0) {
      return { label: `Disponible (${product.stock} u.)`, color: 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold', hasStock: true, stock: product.stock };
    }
    return { label: 'Sin Stock', color: 'bg-red-50 text-red-600 border border-red-100', hasStock: false, stock: 0 };
  };

  // Alertas listas para envío (aquellas con stock > 0)
  const readyAlerts = alerts.filter(alert => {
    const status = getAlertStatus(alert);
    return status.hasStock;
  });

  // Iniciar la simulación SMTP individual
  const startSMTPSend = async (alert: StockAlert, product: Product) => {
    setActiveRecipient(alert.email);
    
    const subject = `[Farmacia Vitalis] ¡Ya tenemos disponible ${product.name}!`;
    setActiveSubject(subject);

    const emailContent = `
      <p>Estimado Cliente,</p>
      <p>Nos complace informarle que el producto <strong>${product.name}</strong> por el cual solicitó una alerta de stock ya se encuentra nuevamente disponible en Farmacia Vitalis.</p>
      <p style="background-color: #f8fafc; border-left: 4px solid #0d9488; padding: 12px; font-weight: bold; color: #0f766e; margin: 20px 0;">
        ¡No espere más para adquirirlo! Contamos con pocas unidades disponibles.
      </p>
      <p>Recuerde nuestro horario de atención en Machalilla de lunes a domingo de <strong>08:00 a 20:00</strong>.</p>
      <p>Puede coordinar su entrega directamente a través de nuestra página web o respondiendo a este correo.</p>
    `;

    const htmlBody = getEmailTemplateHTML(
      '¡Producto Disponible en Stock!',
      emailContent,
      'Ver Producto en Catálogo',
      `${window.location.origin}/?id=${product.id}`
    );

    setPreviewHtml(htmlBody);
    setSmtpLogs([]);
    setSmtpStatus('SENDING');
    setSmtpConsoleOpen(true);

    const success = await simulateSMTPSend(alert.email, subject, htmlBody, (log) => {
      setSmtpLogs(prev => [...prev, log]);
    });

    if (success) {
      setSmtpStatus('SUCCESS');
      // Guardar el log en Firestore
      await addEmailLogDB({
        sender: 'farmaciavitalis@outlook.es',
        recipient: alert.email,
        subject,
        body: htmlBody,
        timestamp: new Date().toISOString(),
        status: 'ENVIADO',
        type: 'AVISO_STOCK',
        productName: product.name
      });
      // Eliminar la alerta procesada de la lista
      await onDelete(alert.id);
    } else {
      setSmtpStatus('ERROR');
    }
  };

  // Enviar correos en lote (masivo) para todas las alertas con stock restaurado
  const handleBulkDispatch = async () => {
    if (readyAlerts.length === 0) {
      alert("No hay alertas pendientes con stock disponible para despachar.");
      return;
    }

    if (!confirm(`¿Está seguro de que desea despachar de forma masiva ${readyAlerts.length} correos de alerta de stock desde farmaciavitalis@outlook.es?`)) {
      return;
    }

    setIsBulkDispatching(true);
    setBulkProgress({ current: 0, total: readyAlerts.length });
    setSmtpConsoleOpen(true);
    setSmtpLogs(['⚡ Iniciando proceso de envío masivo de stock...', '⏳ Preparando cola de envío...']);
    setSmtpStatus('SENDING');

    let processedCount = 0;

    for (const alert of readyAlerts) {
      const product = products.find(p => p.id === alert.productId);
      if (!product) continue;

      setBulkProgress(prev => ({ ...prev, current: processedCount + 1 }));
      setSmtpLogs(prev => [...prev, `\n📧 [${processedCount + 1}/${readyAlerts.length}] Procesando correo para: ${alert.email}...`]);

      const subject = `[Farmacia Vitalis] ¡Ya tenemos disponible ${product.name}!`;
      const emailContent = `
        <p>Estimado Cliente,</p>
        <p>Nos complace informarle que el producto <strong>${product.name}</strong> por el cual solicitó una alerta de stock ya se encuentra nuevamente disponible en Farmacia Vitalis.</p>
        <p style="background-color: #f8fafc; border-left: 4px solid #0d9488; padding: 12px; font-weight: bold; color: #0f766e; margin: 20px 0;">
          ¡No espere más para adquirirlo! Contamos con pocas unidades disponibles.
        </p>
        <p>Recuerde nuestro horario de atención en Machalilla de lunes a domingo de <strong>08:00 a 20:00</strong>.</p>
        <p>Puede coordinar su entrega directamente a través de nuestra página web o respondiendo a este correo.</p>
      `;

      const htmlBody = getEmailTemplateHTML(
        '¡Producto Disponible en Stock!',
        emailContent,
        'Ver Producto en Catálogo',
        `${window.location.origin}/?id=${product.id}`
      );

      // Simular de forma rápida por cada uno
      const success = await simulateSMTPSend(alert.email, subject, htmlBody, (log) => {
        // Solo registrar logs importantes en masivo para no saturar
        if (log.startsWith('✅') || log.startsWith('❌') || log.includes('Autenticando') || log.includes('Enviando')) {
          setSmtpLogs(prev => [...prev, `   ${log}`]);
        }
      });

      if (success) {
        await addEmailLogDB({
          sender: 'farmaciavitalis@outlook.es',
          recipient: alert.email,
          subject,
          body: htmlBody,
          timestamp: new Date().toISOString(),
          status: 'ENVIADO',
          type: 'AVISO_STOCK',
          productName: product.name
        });
        await onDelete(alert.id);
      }

      processedCount++;
      await new Promise(r => setTimeout(r, 400)); // Pequeña pausa entre correos
    }

    setSmtpLogs(prev => [...prev, `\n🎉 ¡Envío en lote finalizado! ${processedCount} correos procesados.`]);
    setSmtpStatus('SUCCESS');
    setIsBulkDispatching(false);
  };

  // Generar cuerpo de texto simple para Mailto
  const handleMailto = (alert: StockAlert, product: Product) => {
    const subject = `[Farmacia Vitalis] ¡Ya tenemos stock de ${product.name}!`;
    const bodyText = `Hola,\n\nNos complace informarle que el producto "${product.name}" que estaba esperando ya se encuentra disponible en Farmacia Vitalis.\n\nPuede realizar su pedido directamente en nuestra plataforma o visitarnos en Machalilla. Le recordamos nuestro horario de atención de lunes a domingo de 08:00 a 20:00.\n\nAtentamente,\nFarmacia Vitalis\nfarmaciavitalis@outlook.es`;
    
    const link = getMailtoLink(alert.email, subject, bodyText);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER DE PRIMER NIVEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-3 rounded-2xl shadow-lg shadow-teal-500/20 text-white">
            <BellRing size={26} className="animate-bounce" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Consola de Alertas de Stock</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span>Remitente Oficial:</span>
              <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">farmaciavitalis@outlook.es</span>
            </p>
          </div>
        </div>

        {activeTab === 'pending' && readyAlerts.length > 0 && (
          <button
            onClick={handleBulkDispatch}
            disabled={isBulkDispatching}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-600/10 active:scale-95 transition-all"
          >
            <Layers size={16} />
            <span>Despachar Todo en Lote ({readyAlerts.length})</span>
          </button>
        )}
      </div>

      {/* METRICAS DEL DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Alertas Activas</span>
            <p className="text-2xl font-black text-slate-800">{alerts.length}</p>
          </div>
          <div className="bg-orange-50 text-orange-500 p-3 rounded-2xl">
            <BellRing size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Listas para Envío</span>
            <p className="text-2xl font-black text-emerald-600">{readyAlerts.length}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-500 p-3 rounded-2xl">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Correos Enviados</span>
            <p className="text-2xl font-black text-blue-600">{emailLogs.length}</p>
          </div>
          <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl">
            <Send size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Seguridad SMTP</span>
            <p className="text-sm font-extrabold text-teal-600">SSL / STARTTLS</p>
          </div>
          <div className="bg-teal-50 text-teal-500 p-3 rounded-2xl">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* TABS DE SELECCION */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-teal-600 text-teal-700 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BellRing size={14} />
          <span>Alertas de Clientes ({alerts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-teal-600 text-teal-700 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <MailOpen size={14} />
          <span>Historial de Despacho ({emailLogs.length})</span>
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      {activeTab === 'pending' ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario Interesado</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto Solicitado</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Producto</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrado</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones de Despacho</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {alerts.map(alert => {
                  const product = products.find(p => p.id === alert.productId);
                  const status = getAlertStatus(alert);
                  return (
                    <tr key={alert.id} className="hover:bg-teal-50/10 transition group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                          <Mail size={14} className="text-teal-600" /> {alert.email}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {product ? (
                            <img src={product.image} className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              <Package size={14} />
                            </div>
                          )}
                          <span className="font-extrabold text-slate-800 text-sm max-w-[200px] truncate">
                            {product?.name || 'Producto eliminado'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right space-x-2">
                        {status.hasStock && product && (
                          <>
                            {/* Despacho SMTP Automático */}
                            <button
                              onClick={() => startSMTPSend(alert, product)}
                              className="inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all"
                              title="Enviar Correo vía SMTP"
                            >
                              <Send size={12} />
                              <span>SMTP</span>
                            </button>

                            {/* Enlace mailto rápido para abrir en cliente local (Outlook) */}
                            <button
                              onClick={() => handleMailto(alert, product)}
                              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all"
                              title="Abrir plantilla en Outlook"
                            >
                              <ExternalLink size={12} />
                              <span>Outlook</span>
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => { if(confirm('¿Eliminar esta alerta?')) onDelete(alert.id); }}
                          className="text-slate-300 hover:text-red-500 transition-colors inline-flex p-1.5 rounded-lg hover:bg-red-50"
                          title="Eliminar Alerta"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <BellRing size={40} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay alertas de stock registradas</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* HISTORIAL DE CORREOS DESPACHADOS */
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          {loadingHistory ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="animate-spin text-teal-600 mx-auto" size={30} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando bitácora de correos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatario</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Asunto / Tipo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Despacho</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal SMTP</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {emailLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                          <Mail size={14} className="text-teal-600" /> {log.recipient}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800 text-sm">{log.subject}</p>
                          <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                            {log.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-100 uppercase">
                          <ShieldCheck size={11} />
                          ENVIADO
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={async () => {
                            if (confirm('¿Desea eliminar este registro del historial?')) {
                              await deleteEmailLogDB(log.id);
                            }
                          }}
                          className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {emailLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <MailOpen size={40} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay historial de envíos registrados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONSOLE MODAL INTERACTIVO PARA SMTP */}
      {smtpConsoleOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header Consola */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-teal-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-slate-300">
                  {isBulkDispatching ? `SMTP Lote Progress: ${bulkProgress.current}/${bulkProgress.total}` : 'SMTP Outbox Dispatch Terminal'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              </div>
            </div>

            {/* Info Panel */}
            <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-col gap-2 text-slate-400 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500">REMITENTE:</span> <span className="text-teal-400 font-bold">farmaciavitalis@outlook.es</span>
                </div>
                {!isBulkDispatching && (
                  <div>
                    <span className="text-slate-500">PARA:</span> <span className="text-sky-400 font-bold">{activeRecipient}</span>
                  </div>
                )}
              </div>
              {!isBulkDispatching && activeSubject && (
                <div className="border-t border-slate-800/60 pt-2 text-[10px]">
                  <span className="text-slate-500">ASUNTO:</span> <span className="text-slate-300 font-bold">{activeSubject}</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
              {/* Terminal Logs */}
              <div className="bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-y-auto h-[40vh] lg:h-auto select-none border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
                <div className="space-y-1">
                  {smtpLogs.map((log, index) => {
                    let logColor = 'text-slate-300';
                    if (log.startsWith('>>>')) logColor = 'text-teal-400';
                    if (log.startsWith('<<<')) logColor = 'text-amber-400';
                    if (log.includes('✅') || log.includes('¡Conectado') || log.includes('successful')) logColor = 'text-emerald-400';
                    if (log.includes('❌') || log.includes('Error')) logColor = 'text-red-400';
                    if (log.includes('📧') || log.includes('⚡')) logColor = 'text-sky-400 font-bold';

                    return (
                      <div key={index} className={`${logColor} whitespace-pre-wrap`}>
                        {log}
                      </div>
                    );
                  })}
                  {smtpStatus === 'SENDING' && (
                    <div className="flex items-center gap-2 text-teal-400 mt-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                      <span className="animate-pulse">Transmitiendo datos de correo...</span>
                    </div>
                  )}
                </div>
                
                {/* Visual Bulk Progress */}
                {isBulkDispatching && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                      <span>Progreso de Despacho</span>
                      <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Template Preview (Unicamente si es envío individual) */}
              <div className="bg-slate-900 flex flex-col overflow-hidden h-[30vh] lg:h-auto">
                <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                  <Eye size={12} className="text-teal-400" />
                  <span>Previsualización del Correo HTML</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-800 flex items-center justify-center">
                  {!isBulkDispatching && previewHtml ? (
                    <div 
                      className="origin-top scale-[0.65] sm:scale-[0.8] lg:scale-[0.65] my-4 rounded-xl shadow-xl overflow-hidden max-w-[600px] bg-white text-black text-left"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  ) : (
                    <div className="text-center text-slate-500 text-xs font-mono p-4 space-y-2">
                      <Info size={24} className="mx-auto text-slate-600 animate-pulse" />
                      <p>Envío Masivo Activo</p>
                      <p className="text-[10px] text-slate-600">La previsualización está oculta para optimizar el rendimiento en lote.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Consola */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-500 text-[10px] font-mono">
                {smtpStatus === 'SENDING' ? 'CONEXIÓN ABIERTA' : 'CONEXIÓN CERRADA'}
              </span>
              <button
                onClick={() => {
                  if (smtpStatus === 'SENDING' && !confirm('¿Desea cancelar el proceso de envío SMTP en curso?')) {
                    return;
                  }
                  setSmtpConsoleOpen(false);
                }}
                className={`px-5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  smtpStatus === 'SENDING'
                    ? 'bg-red-950 border border-red-800 text-red-400 hover:bg-red-900'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                {smtpStatus === 'SENDING' ? 'Interrumpir' : 'Cerrar Terminal'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStockAlerts;
