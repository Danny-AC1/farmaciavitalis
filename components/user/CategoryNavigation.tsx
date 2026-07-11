import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Grid, Filter, Clock } from 'lucide-react';
import { Category, Product } from '../../types';
import { getCategoryStyle } from '../../utils/CategoryStyles';

interface CategoryNavigationProps {
  categories: Category[];
  activeCategory: string | null;
  setActiveCategory: (id: string | null) => void;
  allProducts: Product[];
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categories,
  activeCategory,
  setActiveCategory,
  allProducts,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calcular la cantidad de productos por categoría de manera dinámica
  const getProductCount = (categoryName: string) => {
    return allProducts.filter((p) => p.category === categoryName).length;
  };

  const totalProductCount = allProducts.length;

  const handleCategorySelect = (id: string | null) => {
    setActiveCategory(id);
    setIsDrawerOpen(false);
  };

  const activeCategoryObj = activeCategory
    ? categories.find((c) => c.id === activeCategory)
    : null;

  return (
    <>
      {/* ========================================== */}
      {/* 1. DESKTOP PERSISTENT SIDEBAR */}
      {/* ========================================== */}
      <div className="hidden lg:block w-full">
        <div className="sticky top-[100px] bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Filter size={18} className="text-teal-600" />
            <h3 className="font-extrabold text-slate-800 tracking-tight text-lg">Categorías</h3>
          </div>

          <div className="space-y-1.5">
            {/* Botón para "Todas" */}
            <button
              onClick={() => handleCategorySelect(null)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                activeCategory === null
                  ? 'bg-teal-50 text-teal-800 border border-teal-100/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    activeCategory === null ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}
                >
                  <Grid size={16} />
                </div>
                <span>Todo el Catálogo</span>
              </div>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  activeCategory === null ? 'bg-teal-200/50 text-teal-800' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}
              >
                {totalProductCount}
              </span>
            </button>

            {/* Categorías individuales */}
            {categories.map((category) => {
              const style = getCategoryStyle(category.name);
              const isActive = activeCategory === category.id;
              const count = getProductCount(category.name);

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-200 group border ${
                    isActive
                      ? `${style.bg} ${style.text} ${style.border}`
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? `${style.accent} ${style.text} bg-opacity-40`
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                      }`}
                    >
                      <style.icon size={16} />
                    </div>
                    <span className="truncate max-w-[130px]">{category.name}</span>
                  </div>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      isActive
                        ? `${style.accent} ${style.text} bg-opacity-40`
                        : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. MOBILE FLOATING TRIGGER BAR */}
      {/* ========================================== */}
      <div className="lg:hidden sticky top-[136px] z-30 bg-gray-50/95 backdrop-blur-sm py-2 mb-4 -mx-4 px-4 border-b border-gray-100 shadow-sm flex items-center justify-between gap-3">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex-1 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <Filter size={16} className="text-teal-600 shrink-0" />
            <span className="truncate">
              {activeCategoryObj ? `Categoría: ${activeCategoryObj.name}` : 'Todas las Categorías'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-extrabold shrink-0">
            <span>{activeCategoryObj ? getProductCount(activeCategoryObj.name) : totalProductCount} prod</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {activeCategory !== null && (
          <button
            onClick={() => handleCategorySelect(null)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold px-3 py-3 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-transform shrink-0"
          >
            <X size={14} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* ========================================== */}
      {/* 3. MOBILE SIDE DRAWER (LEFT SLIDE-OVER) */}
      {/* ========================================== */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110]"
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-[290px] bg-white z-[120] shadow-2xl flex flex-col h-full overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-teal-600" />
                  <span className="font-extrabold text-slate-800 tracking-tight">Categorías</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Category List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Todas las categorías */}
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all border ${
                    activeCategory === null
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : 'border-transparent text-slate-600 active:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        activeCategory === null ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Grid size={16} />
                    </div>
                    <span>Todo el Catálogo</span>
                  </div>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      activeCategory === null ? 'bg-teal-200/50 text-teal-800' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {totalProductCount}
                  </span>
                </button>

                {/* Categorías individuales */}
                {categories.map((category) => {
                  const style = getCategoryStyle(category.name);
                  const isActive = activeCategory === category.id;
                  const count = getProductCount(category.name);

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all border ${
                        isActive
                          ? `${style.bg} ${style.text} ${style.border}`
                          : 'border-transparent text-slate-600 active:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isActive ? `${style.accent} ${style.text} bg-opacity-40` : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <style.icon size={16} />
                        </div>
                        <span className="truncate max-w-[150px]">{category.name}</span>
                      </div>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          isActive ? `${style.accent} ${style.text} bg-opacity-40` : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <Clock size={12} className="text-teal-600" />
                  <span>Atención: 08:00 - 20:00</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Farmacia Vitalis • Machalilla, Manabí
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CategoryNavigation;
