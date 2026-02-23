import React from 'react';
import { Pill, Sun, BriefcaseMedical, Sparkles, Baby, HeartPulse, Activity } from 'lucide-react';
import { Category } from '../types';

interface CategoryGridProps {
  categories: Category[];
  setActiveCategory: (id: string) => void;
}

export const getCategoryStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('medicamento') || n.includes('farmacia')) return { icon: Pill, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', accent: 'bg-blue-200' };
  if (n.includes('vitamina') || n.includes('suplemento')) return { icon: Sun, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', accent: 'bg-orange-200' };
  if (n.includes('auxilio') || n.includes('herida')) return { icon: BriefcaseMedical, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', accent: 'bg-red-200' };
  if (n.includes('cuidado') || n.includes('personal') || n.includes('piel')) return { icon: Sparkles, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', accent: 'bg-purple-200' };
  if (n.includes('bebé') || n.includes('materno')) return { icon: Baby, bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100', accent: 'bg-pink-200' };
  if (n.includes('sexual') || n.includes('intimo')) return { icon: HeartPulse, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-200' };
  return { icon: Activity, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', accent: 'bg-teal-200' };
};

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
