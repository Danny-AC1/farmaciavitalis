import React, { useEffect, useState } from 'react';
import { BlogPost } from '../types';
import { streamBlogPosts } from '../services/db';
import { Sparkles, BookOpen } from 'lucide-react';

const BlogSection: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        const unsub = streamBlogPosts((data) => setPosts(data));
        return () => unsub();
    }, []);

    if (posts.length === 0) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-purple-500 pl-4 flex items-center gap-2">
                <Sparkles className="text-purple-500 h-6 w-6"/> Consejos Vitalis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(0, 3).map(post => (
                    <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-purple-50 p-4 border-b border-purple-100">
                             <h4 className="font-bold text-lg text-gray-900">{post.title}</h4>
                             <p className="text-xs text-purple-600 font-medium mt-1">{new Date(post.date).toLocaleDateString()}</p>
                        </div>
                        <div className="p-4">
                            <div className="text-gray-600 text-sm leading-relaxed line-clamp-4" dangerouslySetInnerHTML={{ __html: post.content }} />
                            <button className="mt-4 text-purple-600 text-sm font-bold flex items-center gap-1 hover:underline">
                                <BookOpen size={14}/> Leer más
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BlogSection;