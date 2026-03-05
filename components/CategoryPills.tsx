
import React from 'react';
import { Category } from '../types';
import { getCategoryStyle } from '../utils/CategoryStyles';

interface CategoryPillsProps {
  categories: Category[];
  activeCategory: string | null;
  setActiveCategory: (id: string | null) => void;
}

const CategoryPills: React.FC<CategoryPillsProps> = ({ categories, activeCategory, setActiveCategory }) => {
  return (
    <div className="sticky top-[136px] md:top-[148px] z-20 bg-gray-50/95 backdrop-blur-sm py-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-gray-100 shadow-sm md:shadow-none transition-all duration-300">
      <div className="flex overflow-x-auto pb-1 gap-3 snap-x scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all snap-start border-2 ${
            activeCategory === null
              ? 'bg-teal-600 border-teal-600 text-white shadow-md'
              : 'bg-white border-slate-100 text-slate-600 hover:border-teal-200'
          }`}
        >
          Todos
        </button>
        {categories.map((category) => {
          const style = getCategoryStyle(category.name);
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all snap-start border-2 flex items-center gap-2 ${
                isActive
                  ? `${style.bg} ${style.border} ${style.text} border-current shadow-sm`
                  : `bg-white border-slate-100 text-slate-600 hover:border-slate-200`
              }`}
            >
              <style.icon size={16} className={isActive ? style.text : 'text-slate-400'} />
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPills;
