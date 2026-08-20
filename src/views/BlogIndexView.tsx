import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { BlogPost } from '../types';
import { getPublicBlogPostsApi } from '../lib/api';

interface BlogIndexViewProps {
  onNavigate: (path: string) => void;
}

export const BlogIndexView: React.FC<BlogIndexViewProps> = ({ onNavigate }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicBlogPostsApi()
      .then((data) => {
        setPosts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load blog posts:', err);
        setError('Failed to load blog posts. Please try again.');
        setIsLoading(false);
      });
  }, []);

  // Calculate estimated reading time (approx 200 words/min)
  const getReadingTime = (text: string) => {
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream text-maroon font-sans selection:bg-coral selection:text-white">
      {/* Header Banner */}
      <section className="pt-12 pb-16 md:pt-16 md:pb-20 px-4 sm:px-6 max-w-6xl mx-auto w-full text-center">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-maroon leading-tight mb-4">
          Love, Stories & Wedding Guidance
        </h1>

        <p className="text-lg text-mauve max-w-2xl mx-auto font-normal leading-relaxed">
          Inspiration, tips, and thoughtful ideas to help you create unforgettable digital stories for your favorite person.
        </p>
      </section>

      {/* Main Grid */}
      <main className="flex-1 pb-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-mauve">
            <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading stories...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-6 rounded-3xl bg-red-50 border border-red-200 text-red-700 text-center text-sm flex flex-col items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-cream-card border border-cream-border rounded-3xl max-w-xl mx-auto p-8">
            <Sparkles className="w-10 h-10 text-coral mx-auto mb-3" />
            <h3 className="font-serif text-2xl font-bold text-maroon mb-2">No Stories Published Yet</h3>
            <p className="text-mauve text-sm">Check back soon for new articles and wedding advice!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                onClick={() => onNavigate(`/blog/${post.slug}`)}
                className="group bg-cream-card border border-cream-border rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
              >
                {/* Cover Image */}
                <div className="h-48 sm:h-52 w-full bg-cream-border relative overflow-hidden">
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-maroon/20 to-coral/30 flex items-center justify-center p-6 text-center">
                      <span className="font-serif text-lg font-semibold text-maroon/80 line-clamp-2">
                        {post.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-mauve/80 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-coral" />
                        {formatDate(post.published_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-mauve/60" />
                        {getReadingTime(post.content)}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-serif text-xl font-bold text-maroon group-hover:text-coral transition-colors line-clamp-2 mb-3">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-mauve text-sm line-clamp-3 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Read More */}
                  <div className="pt-4 border-t border-cream-border flex items-center text-xs font-semibold text-maroon group-hover:text-coral transition-colors gap-1.5">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
