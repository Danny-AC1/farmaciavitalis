
import { Pill, Sun, BriefcaseMedical, Sparkles, Baby, HeartPulse, Activity } from 'lucide-react';

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
