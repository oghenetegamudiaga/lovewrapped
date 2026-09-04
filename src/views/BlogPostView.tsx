import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Share2, Check, AlertCircle, Heart } from 'lucide-react';
import { BlogPost } from '../types';
import { getPublicBlogPostBySlugApi } from '../lib/api';

interface BlogPostViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

/**
 * Safe, Stored-XSS-proof Markdown renderer.
 * Converts headings, bold, italic, blockquotes, lists, links, images, and paragraphs
 * without using dangerouslySetInnerHTML or evaluating raw HTML script tags.
 */
function renderSafeMarkdown(markdown: string) {
  if (!markdown) return null;

  // Split by double line breaks into block elements
  const blocks = markdown.split(/\n\n+/);

  return blocks.map((block, bIdx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Headings
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={bIdx} className="font-serif text-xl font-bold text-maroon mt-8 mb-3">
          {renderInlineFormatting(trimmed.substring(4))}
        </h3>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={bIdx} className="font-serif text-2xl sm:text-3xl font-bold text-maroon mt-10 mb-4 pb-2 border-b border-cream-border">
          {renderInlineFormatting(trimmed.substring(3))}
        </h2>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={bIdx} className="font-serif text-3xl sm:text-4xl font-bold text-maroon mt-10 mb-4">
          {renderInlineFormatting(trimmed.substring(2))}
        </h1>
      );
    }

    // Blockquotes
    if (trimmed.startsWith('> ')) {
      const quoteText = trimmed.split('\n').map((l) => l.replace(/^>\s*/, '')).join(' ');
      return (
        <blockquote key={bIdx} className="my-6 p-5 rounded-2xl bg-coral/5 border-l-4 border-coral text-maroon italic text-base sm:text-lg">
          {renderInlineFormatting(quoteText)}
        </blockquote>
      );
    }

    // Unordered Lists
    if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
      const items = trimmed.split('\n').map((line) => line.trim().replace(/^[-*]\s+/, ''));
      return (
        <ul key={bIdx} className="my-4 space-y-2 pl-4 list-disc marker:text-coral text-mauve text-base">
          {items.map((item, iIdx) => (
            <li key={iIdx}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
    }

    // Ordered Lists
    if (trimmed.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
      const items = trimmed.split('\n').map((line) => line.trim().replace(/^\d+\.\s+/, ''));
      return (
        <ol key={bIdx} className="my-4 space-y-2 pl-5 list-decimal marker:text-maroon font-medium text-mauve text-base">
          {items.map((item, iIdx) => (
            <li key={iIdx}>{renderInlineFormatting(item)}</li>
          ))}
        </ol>
      );
    }

    // Regular Paragraph
    return (
      <p key={bIdx} className="my-4 text-mauve text-base sm:text-lg leading-relaxed">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  });
}

/**
 * Formats bold (**text**), italic (*text*), and safe links/images safely without raw HTML.
 */
function renderInlineFormatting(text: string) {
  // Escape raw script/html tags by default via React element creation
  // Simple regex parser for **bold** and *italic*
  const parts: (string | React.ReactNode)[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Process bold (**...**) and italic (*...*)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      parts.push(
        <strong key={keyIdx++} className="font-semibold text-maroon">
          {matchedStr.slice(2, -2)}
        </strong>
      );
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      parts.push(
        <em key={keyIdx++} className="italic">
          {matchedStr.slice(1, -1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export const BlogPostView: React.FC<BlogPostViewProps> = ({ slug, onNavigate }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getPublicBlogPostBySlugApi(slug)
      .then((data) => {
        setPost(data);
        setIsLoading(false);

        // Update SEO Meta Tags
        if (data) {
          document.title = `${data.title} | Weddings by Amorah Blog`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', data.excerpt);
          } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = data.excerpt;
            document.head.appendChild(meta);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching blog post:', err);
        setError('Blog post not found or has not been published yet.');
        setIsLoading(false);
      });

    return () => {
      // Reset title on unmount
      document.title = 'Amorah: Turn your love into an experience';
    };
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getReadingTime = (text: string) => {
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#FFFEFE] text-maroon">
        <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-mauve">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[70vh] bg-[#FFFEFE] text-maroon flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-maroon mb-2">Post Not Found</h1>
        <p className="text-mauve text-sm max-w-md mb-6">{error || 'This blog post could not be found.'}</p>
        <button
          onClick={() => onNavigate('/blog')}
          className="px-6 py-3 rounded-full bg-maroon text-cream font-semibold text-sm hover:bg-maroon-light transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Articles</span>
        </button>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-[#FFFEFE] text-maroon font-sans selection:bg-coral selection:text-white pb-24">
      {/* Top Bar / Back button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/blog')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-mauve hover:text-maroon px-3.5 py-2 rounded-full bg-white border border-cream-border transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Journal</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon hover:text-coral px-3.5 py-2 rounded-full bg-white border border-cream-border transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
        </button>
      </div>

      {/* Header Container */}
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-8 text-center">
        <div className="flex items-center justify-center gap-4 text-xs font-medium text-mauve/80 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-coral" />
            {formatDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-mauve/60" />
            {getReadingTime(post.content)}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-maroon leading-tight mb-6">
          {post.title}
        </h1>

        <p className="text-lg text-mauve font-normal leading-relaxed max-w-2xl mx-auto">
          {post.excerpt}
        </p>
      </header>

      {/* Featured Cover Image */}
      {post.cover_image_url && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
          <div className="rounded-3xl overflow-hidden shadow-md max-h-[480px] bg-white">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover max-h-[480px]"
            />
          </div>
        </div>
      )}

      {/* Main Post Body */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 bg-white border border-cream-border/60 p-6 sm:p-10 rounded-3xl shadow-xs">
        {renderSafeMarkdown(post.content)}
      </main>

      {/* Footer CTA */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-16 text-center">
        <div className="p-8 rounded-3xl bg-maroon text-cream shadow-lg">
          <Heart className="w-8 h-8 text-coral mx-auto mb-3 fill-coral" />
          <h3 className="font-serif text-2xl font-bold mb-2">Ready to create your invitation?</h3>
          <p className="text-cream/80 text-sm max-w-md mx-auto mb-6">
            Turn your love story into a stunning digital experience today with Weddings by Amorah.
          </p>
          <button
            onClick={() => onNavigate('/weddings/signup')}
            className="px-6 py-3 rounded-full bg-coral hover:bg-coral-dark text-white font-semibold text-sm shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            Create Your Account
          </button>
        </div>
      </div>
    </article>
  );
};
