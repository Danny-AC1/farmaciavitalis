import React from 'react';
import { ShieldCheck, Truck, Clock, Award, Facebook, Instagram, MessageCircle, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-12 pb-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand & Trust */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-black text-slate-800 tracking-tight">VITALIS</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Tu salud es nuestra prioridad. Ofrecemos productos farmacéuticos de alta calidad con la rapidez y confianza que mereces en Machalilla.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
                <Instagram size={18} />
              </a>
              <a href="https://wa.me/593998506160" className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Difare Partnership */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Respaldo Total</h4>
            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
              <div className="flex items-center gap-3 mb-2">
                <Award className="text-teal-600 h-6 w-6" />
                <span className="font-bold text-teal-900 text-sm">Aliados Estratégicos</span>
              </div>
              <p className="text-teal-800/70 text-xs font-medium leading-tight">
                Trabajamos con <span className="font-black text-teal-900">DIFARE</span>, la marca #1 de productos farmacéuticos en Ecuador, garantizando autenticidad y los mejores precios.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-tighter">
              <ShieldCheck size={14} className="text-teal-500" />
              Productos 100% Originales
            </div>
          </div>

          {/* Quick Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Servicios</h4>
            <ul className="space-y-2 text-sm text-gray-500 font-medium">
              <li className="flex items-center gap-2"><Truck size={16} className="text-teal-500" /> Entrega a Domicilio</li>
              <li className="flex items-center gap-2"><Clock size={16} className="text-teal-500" /> Horario: 07:00 - 21:00</li>
              <li className="flex items-center gap-2"><Award size={16} className="text-teal-500" /> Puntos Vitalis</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Contacto</h4>
            <ul className="space-y-3 text-sm text-gray-500 font-medium">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-teal-500 shrink-0 mt-0.5" />
                <span>Machalilla, Manabí, Ecuador</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-teal-500 shrink-0" />
                <span>+593 99 850 6160</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Farmacia Vitalis. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Términos y Condiciones</span>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Privacidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
