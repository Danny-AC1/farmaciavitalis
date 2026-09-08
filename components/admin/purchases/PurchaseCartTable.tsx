import React from 'react';
import { Trash2, Plus, Minus, Boxes, Package, Truck, AlertCircle } from 'lucide-react';
import { PurchaseOrderItem, PurchaseUnitType } from '../../../types/purchases';
import { getStockAlertConfig } from '../../../services/stockAlertService';

interface PurchaseCartTableProps {
  items: PurchaseOrderItem[];
  selectedSupplierFilter: string;
  onSupplierFilterChange: (supplierId: string) => void;
  uniqueSuppliers: { id: string; name: string; count: number; totalCost: number }[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onToggleUnitType: (productId: string, newUnitType: PurchaseUnitType) => void;
  onRemoveItem: (productId: string) => void;
  onOpenProductPicker: () => void;
  onFillCriticalStock: () => void;
}

export const PurchaseCartTable: React.FC<PurchaseCartTableProps> = ({
  items,
  selectedSupplierFilter,
  onSupplierFilterChange,
  uniqueSuppliers,
  onUpdateQuantity,
  onToggleUnitType,
  onRemoveItem,
  onOpenProductPicker,
  onFillCriticalStock,
}) => {
  const alertConfig = getStockAlertConfig();
  // Filtrar items según el proveedor seleccionado en las pestañas
  const displayedItems = items.filter((it) => {
    if (selectedSupplierFilter === 'ALL') return true;
    if (selectedSupplierFilter === 'NONE') return !it.supplierId;
    return it.supplierId === selectedSupplierFilter;
  });

  const currentSupplierSubtotal = displayedItems.reduce((acc, it) => acc + it.subtotal, 0);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200/80 p-8 md:p-14 text-center space-y-4 shadow-sm">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
          <Package size={32} />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h4 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
            La orden de compra está vacía
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Puedes cargar de forma automática todos los medicamentos con existencias críticas o buscar y añadir productos libremente.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onFillCriticalStock}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10"
          >
            <AlertCircle size={15} />
            <span>Cargar Medicamentos en Alerta (≤ {alertConfig.unitThreshold} uds indiv. / ≤ {alertConfig.boxThreshold} uds en caja)</span>
          </button>

          <button
            onClick={onOpenProductPicker}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/10"
          >
            <Plus size={15} />
            <span>Buscar y Agregar Productos</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
      
      {/* Pestañas de Distribuidoras / Proveedores */}
      <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-teal-600" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Distribuidoras en esta orden:
            </span>
          </div>

          <div className="text-xs font-bold text-slate-600">
            Subtotal filtrado: <span className="font-mono text-teal-700 font-black">${currentSupplierSubtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => onSupplierFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
              selectedSupplierFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            <span>Todos los Proveedores</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-white font-mono">
              {items.length}
            </span>
          </button>

          {uniqueSuppliers.map((s) => (
            <button
              key={s.id}
              onClick={() => onSupplierFilterChange(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedSupplierFilter === s.id
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              <span>{s.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-mono font-black">
                {s.count}
              </span>
              <span className="text-[10px] opacity-75 font-mono">(${s.totalCost.toFixed(2)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Detalle */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50/70">
              <th className="p-4 pl-6">Medicamento / Producto</th>
              <th className="p-4 text-center">Formato de Compra</th>
              <th className="p-4 text-center">Cantidad Pedida</th>
              <th className="p-4 text-right">Costo Unit./Caja</th>
              <th className="p-4 text-right">Inversión (Subtotal)</th>
              <th className="p-4 text-right">PVP Venta</th>
              <th className="p-4 text-right">Ganancia Est.</th>
              <th className="p-4 pr-6 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {displayedItems.map((it) => {
              const hasBox = (it.unitsPerBox || 1) > 1;
              const profit = Math.max(0, it.projectedRevenue - it.subtotal);
              const margin = it.projectedRevenue > 0 ? (profit / it.projectedRevenue) * 100 : 0;

              return (
                <tr key={it.productId} className="hover:bg-slate-50/80 transition-colors">
                  {/* Nombre y datos */}
                  <td className="p-4 pl-6">
                    <div className="space-y-0.5">
                      <div className="font-black text-slate-900 text-xs md:text-sm">{it.productName}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                        <span>{it.category}</span>
                        <span>•</span>
                        <span className="text-teal-700 font-bold">{it.supplierName || 'Sin distribuidora'}</span>
                        <span>•</span>
                        {(() => {
                          const stockBoxes = hasBox ? it.currentStock / it.unitsPerBox : it.currentStock;
                          const isAlert = hasBox 
                            ? it.currentStock <= alertConfig.boxThreshold
                            : it.currentStock <= alertConfig.unitThreshold;
                          const isOut = it.currentStock <= 0;

                          return (
                            <span>
                              Stock actual:{' '}
                              <strong
                                className={
                                  isOut
                                    ? 'text-rose-600 font-black'
                                    : isAlert
                                    ? 'text-amber-600 font-black'
                                    : 'text-slate-600 font-bold'
                                }
                              >
                                {it.currentStock} uds {hasBox ? `(${stockBoxes.toFixed(1)} cj)` : ''}
                              </strong>
                              {isAlert && (
                                <span className="ml-1 text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded-md">
                                  {isOut ? 'Agotado' : 'Alerta'}
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </td>

                  {/* Formato: Caja o Unidad */}
                  <td className="p-4 text-center">
                    {hasBox ? (
                      <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/70">
                        <button
                          onClick={() => onToggleUnitType(it.productId, 'BOX')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${
                            it.unitType === 'BOX'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title={`Comprar por Caja de ${it.unitsPerBox} unidades`}
                        >
                          <Boxes size={11} />
                          <span>Caja (x{it.unitsPerBox})</span>
                        </button>
                        <button
                          onClick={() => onToggleUnitType(it.productId, 'UNIT')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${
                            it.unitType === 'UNIT'
                              ? 'bg-slate-800 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Comprar por unidades sueltas"
                        >
                          <Package size={11} />
                          <span>Unidad</span>
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Package size={12} />
                        Unidad
                      </span>
                    )}
                  </td>

                  {/* Contador de cantidad */}
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(it.productId, Math.max(1, it.quantity - 1))}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Disminuir cantidad"
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          onUpdateQuantity(it.productId, val);
                        }}
                        className="w-12 text-center text-xs font-black text-slate-900 bg-transparent border-none outline-none focus:bg-slate-50"
                      />
                      <button
                        onClick={() => onUpdateQuantity(it.productId, it.quantity + 1)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Aumentar cantidad"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </td>

                  {/* Costo Unitario / Costo Caja */}
                  <td className="p-4 text-right font-mono font-bold text-slate-700">
                    ${it.unitCost.toFixed(2)}
                  </td>

                  {/* Inversión Subtotal */}
                  <td className="p-4 text-right font-mono font-black text-teal-800 text-xs md:text-sm">
                    ${it.subtotal.toFixed(2)}
                  </td>

                  {/* PVP Venta equivalente */}
                  <td className="p-4 text-right font-mono text-blue-700 font-bold">
                    ${it.salePrice.toFixed(2)}
                  </td>

                  {/* Ganancia proyectada */}
                  <td className="p-4 text-right">
                    <div className="space-y-0.5">
                      <div className="font-mono font-black text-emerald-700">+${profit.toFixed(2)}</div>
                      <div className="text-[10px] font-bold text-slate-400">({margin.toFixed(0)}% mg)</div>
                    </div>
                  </td>

                  {/* Eliminar */}
                  <td className="p-4 pr-6 text-center">
                    <button
                      onClick={() => onRemoveItem(it.productId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Quitar este medicamento de la orden"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con botón para seguir sumando */}
      <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Mostrando <strong className="text-slate-800">{displayedItems.length}</strong> de{' '}
          <strong className="text-slate-800">{items.length}</strong> medicamentos en la orden
        </div>

        <button
          onClick={onOpenProductPicker}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition-colors shadow-2xs"
        >
          <Plus size={14} />
          <span>Agregar más medicamentos a la orden</span>
        </button>
      </div>
    </div>
  );
};
