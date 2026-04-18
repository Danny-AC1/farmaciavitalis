import React from 'react';
import { Category } from '../types';
import { getCategoryStyle } from '../utils/CategoryStyles';

interface CategoryGridProps {
  categories: Category[];
  setActiveCategory: (id: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, setActiveCategory }) => {
  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-teal-500 pl-4">Nuestras Categorías</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(category => { 
          const style = getCategoryStyle(category.name); 
          return (
            <div 
              key={category.id} 
              onClick={() => setActiveCategory(category.id)} 
              className={`cursor-pointer ${style.bg} border ${style.border} rounded-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-32 md:h-40 relative overflow-hidden group`}
            >
              <div className="relative z-10">
                <div className={`p-2 rounded-xl w-fit mb-3 ${style.accent} bg-opacity-50`}>
                  <style.icon className={`h-6 w-6 md:h-8 md:w-8 ${style.text}`} />
                </div>
                <h4 className={`font-bold text-sm md:text-lg ${style.text}`}>{category.name}</h4>
              </div>
              <style.icon className={`absolute -right-4 -bottom-4 h-24 w-24 ${style.text} opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryGrid;
