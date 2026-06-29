
import React, { useEffect, useState } from 'react';
import { BlogPost } from '../types';
import { streamBlogPosts, deleteBlogPostDB, updateBlogPostDB } from '../services/db';
import { Sparkles, BookOpen, Trash2, Plus, X, Calendar, User as UserIcon, Edit, Save } from 'lucide-react';

interface BlogSectionProps {
  isAuthorized: boolean;
  onOpenAdminPanel: () => void;
}

const BlogSection: React.FC<BlogSectionProps> = ({ isAuthorized, onOpenAdminPanel }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        const unsub = streamBlogPosts((data: BlogPost[]) => setPosts(data));
        return () => unsub();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('¿Eliminar este consejo de la biblioteca?')) {
            try {
                await deleteBlogPostDB(id);
            } catch (error) {
                console.error("Error eliminando post:", error);
            }
        }
    };

    const handleEdit = (e: React.MouseEvent, post: BlogPost) => {
        e.stopPropagation();
        setEditingPost(post);
        setEditTitle(post.title);
        setEditContent(post.content);
    };

    const handleSaveEdit = async () => {
        if (!editingPost) return;
        try {
            await updateBlogPostDB(editingPost.id, {
                title: editTitle,
                content: editContent
            });
            setEditingPost(null);
            alert("Consejo actualizado correctamente.");
        } catch (error) {
            console.error("Error actualizando post:", error);
            alert("Error al actualizar.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
                            <BookOpen size={24} />
                        </div>
                        Consejos de Salud Vitalis
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 md:ml-14">Tu salud, nuestra prioridad. Guías profesionales y bienestar para tu familia</p>
                </div>
                {isAuthorized && (
                    <button 
                        onClick={onOpenAdminPanel}
                        className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-black transition-all shadow-md shrink-0 active:scale-95"
                    >
                        <Plus size={16}/> Nuevo Consejo
                    </button>
                )}
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <BookOpen className="h-12 w-12 mx-auto text-slate-200 mb-3 animate-pulse" />
                    <p className="text-slate-500 font-black uppercase text-xs tracking-wider">Próximamente compartiremos consejos de salud para ti</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide mt-1">Nuestros farmacéuticos están preparando contenido de alta calidad</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {[...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((post) => (
                        <div 
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-500/10 hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative flex flex-col h-full"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[9px] font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                    Salud & Bienestar
                                </span>
                                <div className="flex items-center text-[9px] text-teal-600/80 font-black uppercase tracking-wider gap-1">
                                    <Sparkles size={12} className="text-teal-500 fill-teal-100 animate-pulse" /> 
                                    Vitalis
                                </div>
                            </div>
                            
                            <h4 className="text-lg font-black text-slate-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-2 leading-snug uppercase tracking-tight">
                                {post.title}
                            </h4>
                            
                            <div 
                                className="text-xs text-slate-500 line-clamp-3 mb-6 flex-grow leading-relaxed font-bold uppercase tracking-tight"
                                dangerouslySetInnerHTML={{ __html: post.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' }}
                            />

                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Calendar size={12} className="text-teal-500" /> {new Date(post.date).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><UserIcon size={12} className="text-teal-500" /> {post.author}</span>
                                </div>
                                <span className="text-teal-600 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1.5 transition-transform shrink-0">
                                    Leer &rarr;
                                </span>
                            </div>

                            {isAuthorized && (
                                <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleEdit(e, post)}
                                        className="p-2 bg-white text-teal-600 rounded-xl hover:bg-teal-50 border border-slate-100 transition shadow-sm"
                                        title="Editar post"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, post.id)}
                                        className="p-2 bg-white text-rose-600 rounded-xl hover:bg-rose-50 border border-slate-100 transition shadow-sm"
                                        title="Eliminar post"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL PARA EDITAR POST */}
            {editingPost && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                        <div className="p-6 bg-teal-600 text-white flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-xl flex items-center gap-3">
                                <Edit size={24} /> Editar Consejo
                            </h3>
                            <button 
                                onClick={() => setEditingPost(null)}
                                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-grow space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Título del Consejo</label>
                                <input 
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-gray-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Contenido (HTML)</label>
                                <textarea 
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={10}
                                    className="w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-medium text-gray-700 font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button 
                                onClick={() => setEditingPost(null)}
                                className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 flex items-center gap-2"
                            >
                                <Save size={18} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PARA LEER POST COMPLETO */}
            {selectedPost && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                        <div className="p-6 bg-teal-600 text-white flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-xl flex items-center gap-3">
                                <BookOpen size={24} /> {selectedPost.title}
                            </h3>
                            <button 
                                onClick={() => setSelectedPost(null)}
                                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-grow prose prose-teal max-w-none scroll-smooth">
                            <div className="flex items-center gap-6 mb-8 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">
                                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-teal-500"/> {new Date(selectedPost.date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><UserIcon size={14} className="text-teal-500"/> {selectedPost.author}</span>
                            </div>
                            <div 
                                className="text-gray-700 leading-relaxed space-y-4 blog-content"
                                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                            />
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center shrink-0">
                            <button 
                                onClick={() => setSelectedPost(null)}
                                className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-600/20"
                            >
                                Cerrar Lectura
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .blog-content p { margin-bottom: 1.25rem; }
                .blog-content strong { color: #0f766e; font-weight: 800; }
                .blog-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
                .blog-content li { margin-bottom: 0.5rem; }
            `}</style>
        </div>
    );
};

export default BlogSection;
