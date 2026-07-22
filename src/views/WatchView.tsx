import React, { useState, useEffect } from 'react';
import { Heart, RefreshCw, AlertCircle } from 'lucide-react';
import { Experience } from '../types';
import { getExperienceApi } from '../lib/api';
import { StoryViewer } from '../components/StoryViewer';

interface WatchViewProps {
  slug: string;
  onNavigateToCreate: () => void;
}

export const WatchView: React.FC<WatchViewProps> = ({ slug, onNavigateToCreate }) => {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStory() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getExperienceApi(slug);
        if (isMounted) {
          setExperience(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Story card not found.';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (slug) {
      fetchStory();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-rose-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
        </div>
        <p className="font-serif text-lg text-rose-200">Opening LoveWrapped Story...</p>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-rose-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif font-bold text-2xl text-rose-100 mb-2">Story Not Found</h2>
        <p className="text-sm text-rose-300/80 max-w-xs mb-6">
          This LoveWrapped link may have expired or is invalid.
        </p>
        <button
          onClick={onNavigateToCreate}
          className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm flex items-center gap-2 shadow-md"
        >
          <Heart className="w-4 h-4 fill-white" />
          <span>Create Your Own Story</span>
        </button>
      </div>
    );
  }

  const isAutoShare = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('share') === 'true';

  return (
    <div className="min-h-screen bg-[#2b0818] py-6 px-4 flex items-center justify-center font-sans">
      <StoryViewer experience={experience} autoOpenShare={isAutoShare} onNavigateToCreate={onNavigateToCreate} />
    </div>
  );
};
