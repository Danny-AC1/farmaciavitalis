import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Trash2, Edit, FileText, Sparkles, 
  User, Calendar, CheckCircle 
} from 'lucide-react';
import { BlogPost } from '../types';
import { streamBlogPosts, addBlogPostDB, deleteBlogPostDB, updateBlogPostDB } from '../services/db.marketing';
import AdminPrintableAd from './AdminPrintableAd';

// Plantillas profesionales listas para usar en 1 clic
const BLOG_TEMPLATES = [
  {
    id: 'paracetamol',
    title: 'GUÍA DE USO SEGURO DEL PARACETAMOL INFANTIL',
    author: 'Dpto. Médico Vitalis',
    category: 'Infantil',
    content: `<p>El <strong>Paracetamol (Acetaminofén)</strong> es el medicamento de elección preferido para el alivio del dolor y la fiebre en lactantes y niños. Sin embargo, su seguridad depende exclusivamente de administrar la dosis correcta en función del peso exacto del menor, y no de su edad.</p>
<h3>Puntos Clave para la Administración Segura:</h3>
<ul>
  <li><strong>Dosis basada en el Peso:</strong> La dosis estándar recomendada es de 10 a 15 mg por cada kilogramo de peso del niño, administrada cada 4 a 6 horas.</li>
  <li><strong>Límite Diario:</strong> No se deben exceder las 5 dosis en un período de 24 horas para prevenir toxicidad hepática.</li>
  <li><strong>Herramienta Recomendada:</strong> Utilice siempre la jeringa dosificadora o gotero provisto en la caja, nunca cucharas de cocina comunes.</li>
</ul>
<p><em>Importante: Si la fiebre persiste por más de 48-72 horas, o si el niño se muestra decaído o tiene dificultad para respirar, suspenda su uso y acuda de inmediato a su pediatra.</em></p>`
  },
  {
    id: 'dengue',
    title: 'PREVENCIÓN DEL DENGUE: CÓMO PROTEGER A TU FAMILIA',
    author: 'Farm. Principal Vitalis',
    category: 'Prevención',
    content: `<p>El Dengue es una infección viral transmitida por la picadura del mosquito <strong>Aedes aegypti</strong>. La prevención más efectiva comienza en nuestros hogares evitando la reproducción del vector.</p>
<h3>Medidas Clave de Prevención en el Hogar:</h3>
<ul>
  <li><strong>Eliminar Criaderos:</strong> Voltear, tapar o desechar recipientes que acumulen agua limpia estancada (baldes, macetas, floreros o llantas).</li>
  <li><strong>Barreras Físicas:</strong> Instalar mallas mosquiteras en puertas y ventanas, y usar toldos sobre las camas de niños pequeños.</li>
  <li><strong>Uso de Repelente:</strong> Aplicar repelente con concentración adecuada (DEET entre 15% y 30%) sobre la piel expuesta y la ropa, repitiendo la aplicación según las instrucciones del fabricante.</li>
</ul>
<p><strong>Síntomas de Alerta:</strong> Fiebre alta repentina, dolor detrás de los ojos, dolores musculares/articulares y erupciones cutáneas. Evite auto-medicarse con Ibuprofeno o Aspirina, ya que pueden aumentar el riesgo de hemorragia; en su lugar, use Paracetamol y acuda al centro de salud.</p>`
  },
  {
    id: 'hydration',
    title: 'LA IMPORTANCIA DEL SUERO ORAL EN CASO DE DESHIDRATACIÓN',
    author: 'Dra. Sofía Rivas (Pediatría)',
    category: 'Primeros Auxilios',
    content: `<p>La deshidratación por diarrea o vómitos severos en niños y adultos mayores puede convertirse rápidamente en una emergencia médica si no se trata a tiempo. El <strong>Suero de Rehidratación Oral (SRO)</strong> es el único líquido científicamente comprobado capaz de reponer el agua y las sales perdidas.</p>
<h3>Por qué evitar las bebidas deportivas o jugos azucarados:</h3>
<p>Las bebidas energéticas y jugos comerciales contienen altas concentraciones de azúcar que pueden empeorar la diarrea por efecto osmótico, además de no poseer la cantidad de sodio y potasio requerida para una rehidratación balanceada.</p>
<h3>Cómo administrar el Suero de Rehidratación Oral:</h3>
<ul>
  <li>Prepare el sobre de SRO disolviéndolo en 1 litro de agua hervida o purificada fresca.</li>
  <li>Ofrezca el suero en pequeñas porciones (cucharadas o sorbos lentos) cada 5 a 10 minutos, especialmente después de cada evacuación líquida o vómito.</li>
  <li>No administre volúmenes grandes de golpe, ya que esto podría estimular el reflejo del vómito.</li>
</ul>
<p><em>Consejo Vitalis: Guarde el suero preparado en el refrigerador y deséchelo después de 24 horas de haber sido preparado para evitar contaminación.</em></p>`
  },
  {
    id: 'burns',
    title: 'PRIMEROS AUXILIOS EN QUEMADURAS DOMÉSTICAS LEVES',
    author: 'Servicio de Emergencias Vitalis',
    category: 'Primeros Auxilios',
    content: `<p>Las quemaduras térmicas de primer y segundo grado menor son sumamente comunes en la cocina y el hogar. Actuar con rapidez y de forma correcta en los primeros 5 minutos determina el tiempo de cicatrización y previene marcas permanentes.</p>
<h3>Qué SÍ debes hacer de inmediato:</h3>
<ul>
  <li><strong>Enfriar con Agua:</strong> Coloque la zona afectada bajo un chorro suave de agua fría (grifo) durante un mínimo de 10 a 15 minutos. Esto detiene el daño del calor en los tejidos profundos.</li>
  <li><strong>Retirar Objetos:</strong> Quite con cuidado anillos, pulseras o prendas de vestir antes de que la zona comience a inflamarse.</li>
  <li><strong>Cubrir con gasa estéril:</strong> Proteja la quemadura con una gasa estéril o un paño limpio y húmedo sin presionar.</li>
</ul>
<h3>Qué NO debes aplicar jamás (Mitos peligrosos):</h3>
<p>No aplique pasta de dientes, mantequilla, aceite, clara de huevo o hielo directo sobre la quemadura. Estos elementos retienen el calor, queman la piel por frío extremo o introducen bacterias peligrosas que causan infecciones severas.</p>`
  },
  {
    id: 'vitamins',
    title: 'VITAMINAS ESENCIALES PARA ADULTOS MAYORES',
    author: 'Lic. Nutrición Gerontológica',
    category: 'Nutrición',
    content: `<p>Con el paso de los años, el cuerpo experimenta cambios fisiológicos que disminuyen la absorción eficiente de ciertos nutrientes clave. Mantener niveles óptimos previene la fatiga, el desgaste muscular y fortalece el sistema inmunológico.</p>
<h3>Micronutrientes Críticos en la Edad Dorada:</h3>
<ul>
  <li><strong>Vitamina B12:</strong> Esencial para el funcionamiento neurológico y la producción de glóbulos rojos. Con la edad disminuye el ácido estomacal necesario para extraerla de los alimentos, por lo que suele recomendarse su suplementación.</li>
  <li><strong>Vitamina D y Calcio:</strong> La combinación perfecta para mantener la densidad ósea y prevenir fracturas por osteoporosis. La exposición solar moderada diaria de 15 minutos ayuda enormemente.</li>
  <li><strong>Zinc y Vitamina C:</strong> Actúan como potentes antioxidantes que refuerzan las barreras celulares defensivas y aceleran la cicatrización de heridas.</li>
</ul>
<p><em>Consulte con nuestro farmacéutico sobre las opciones de complejos multivitamínicos especializados para adultos mayores disponibles en nuestro inventario.</em></p>`
  }
];

const AdminBlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    const unsub = streamBlogPosts((data: BlogPost[]) => setPosts(data));
    return () => unsub();
  }, []);

  const handleApplyTemplate = (templateId: string) => {
    const temp = BLOG_TEMPLATES.find(t => t.id === templateId);
    if (!temp) return;
    setTitle(temp.title);
    setAuthor(temp.author);
    setContent(temp.content);
  };

  const handleClear = () => {
    setEditingId(null);
    setTitle('');
    setAuthor('');
    setContent('');
  };

  const handleEditSelect = (post: BlogPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setAuthor(post.author);
    setContent(post.content);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Por favor, ingresa el título y el contenido del artículo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const finalAuthor = author.trim() || "Farmacia Vitalis";
      if (editingId) {
        await updateBlogPostDB(editingId, {
          title: title.toUpperCase(),
          author: finalAuthor,
          content: content
        });
        alert("Artículo actualizado con éxito.");
      } else {
        await addBlogPostDB({
          id: '',
          title: title.toUpperCase(),
          author: finalAuthor,
          content: content,
          date: new Date().toISOString()
        });
        alert("Artículo publicado en el blog con éxito.");
      }
      handleClear();
    } catch (err: any) {
      alert(`Error al guardar artículo: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este artículo de forma permanente del blog público?")) {
      return;
    }
    try {
      await deleteBlogPostDB(id);
      if (editingId === id) {
        handleClear();
      }
      alert("Artículo eliminado.");
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(filterText.toLowerCase()) || 
    post.author.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
          <BookOpen size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Consejos y Blog de Bienestar</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Publica artículos rápidos de salud para tus clientes</p>
        </div>
      </div>

      {/* Sección Informativa Libre de IA */}
      <div className="bg-teal-50 border border-teal-100 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="bg-white p-2 rounded-xl text-teal-600 shadow-sm shrink-0">
          <CheckCircle size={20}/>
        </div>
        <div>
          <p className="text-xs font-black text-teal-900 uppercase tracking-tight mb-1">Módulo 100% Manual - Libre de IA</p>
          <p className="text-[10px] text-teal-700 font-bold leading-relaxed uppercase">
            Hemos desactivado todas las conexiones de IA para darte control absoluto. 
            Escribe tus propios artículos de salud o utiliza las plantillas predefinidas de un solo clic que hemos preparado para ti. 
            Tus clientes verán estos consejos al instante en la pantalla principal de su aplicación.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Redacción/Edición (7 cols en pantallas grandes) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
                <FileText size={20} className="text-teal-600" />
                {editingId ? 'Editar Artículo' : 'Nuevo Artículo de Salud'}
              </h3>
              {editingId && (
                <button 
                  onClick={handleClear}
                  className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            {/* Atajos Rápidos / Plantillas */}
            {!editingId && (
              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-teal-500" /> Atajo de Redacción: Plantillas de 1 Clic
                </p>
                <div className="flex flex-wrap gap-2">
                  {BLOG_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleApplyTemplate(t.id)}
                      className="bg-slate-50 border border-slate-100 hover:border-teal-500 hover:bg-teal-50 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-600 hover:text-teal-700 transition active:scale-95"
                    >
                      {t.category}: {t.title.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título del Artículo</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: BENEFICIOS DE LA VITAMINA C EN LA SALUD DIARIA"
                  className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Autor / Firma</label>
                <input 
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="Ej: Farmacia Vitalis (o Dra. Sofia Rivas)"
                  className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido (Admite etiquetas HTML para formato)</label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Puedes usar &lt;strong&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;h3&gt;</span>
                </div>
                <textarea 
                  required
                  rows={12}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Escribe el artículo con explicaciones paso a paso de salud o consejos comerciales..."
                  className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-sm text-slate-700 font-mono"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 disabled:opacity-50 active:scale-95 text-xs uppercase tracking-wider"
              >
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios del Artículo' : 'Publicar Consejo en la App'}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Biblioteca de Consejos Publicados (5 cols en pantallas grandes) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-teal-600" />
              Artículos Publicados ({filteredPosts.length})
            </h3>

            {/* Buscador */}
            <input 
              type="text"
              placeholder="Buscar artículo por título o autor..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-xs text-slate-700 mb-4"
            />

            {/* Listado */}
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 no-scrollbar">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <FileText className="mx-auto text-slate-200 mb-2" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No se encontraron artículos</p>
                </div>
              ) : (
                [...filteredPosts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(post => (
                  <div 
                    key={post.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/20 transition group"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditSelect(post)}
                          className="p-1.5 bg-white border border-slate-200 hover:border-teal-500 rounded-lg text-slate-500 hover:text-teal-600 transition"
                          title="Editar"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 bg-white border border-slate-200 hover:border-red-500 rounded-lg text-slate-500 hover:text-red-600 transition"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {post.author}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sección de Publicidad Imprimible al final (Ocupa todo el ancho) */}
        <div className="lg:col-span-12">
          <AdminPrintableAd />
        </div>

      </div>
    </div>
  );
};

export default AdminBlogManager;
