import React, { useEffect, useState } from 'react';
import { BlogPost } from '../types';
import { streamBlogPosts, deleteBlogPostDB } from '../services/db';
import { Sparkles, BookOpen, Trash2, Plus, X, Calendar, User as UserIcon } from 'lucide-react';

interface BlogSectionProps {
  isAuthorized: boolean;
  onOpenAdminPanel: () => void;
}

const BlogSection: React.FC<BlogSectionProps> = ({ isAuthorized, onOpenAdminPanel }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

    useEffect(() => {
        const unsub = streamBlogPosts((data) => setPosts(data));
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

    if (posts.length === 0 && !isAuthorized) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 animate-in fade-in duration-700">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 border-l-4 border-teal-500 pl-4">
                        Consejos Vitalis
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 ml-5">Tu salud, nuestra prioridad. Guías y bienestar.</p>
                </div>
                {isAuthorized && (
                    <button 
                        onClick={onOpenAdminPanel}
                        className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-teal-100 transition shadow-sm border border-teal-100"
                    >
                        <Plus size={16}/> Nuevo Consejo
                    </button>
                )}
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-500 font-medium">Aún no hay consejos publicados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <div 
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group relative flex flex-col h-full"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                                    <Sparkles size={18} />
                                </div>
                                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded">Salud & Bienestar</span>
                            </div>
                            
                            <h4 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-teal-600 transition-colors line-clamp-2">
                                {post.title}
                            </h4>
                            
                            <div 
                                className="text-sm text-gray-600 line-clamp-3 mb-6 flex-grow leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: post.content.substring(0, 150) + '...' }}
                            />

                            <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                                <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(post.date).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1"><UserIcon size={12}/> {post.author}</span>
                                </div>
                                <span className="text-teal-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Leer más &rarr;
                                </span>
                            </div>

                            {isAuthorized && (
                                <button 
                                    onClick={(e) => handleDelete(e, post.id)}
                                    className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                                    title="Eliminar post"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
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