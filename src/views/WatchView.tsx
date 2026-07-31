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
      <div className="min-h-screen bg-cream text-maroon flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-cream-card flex items-center justify-center mb-4 border border-cream-border">
          <RefreshCw className="w-6 h-6 text-coral animate-spin" />
        </div>
        <p className="font-serif text-lg text-maroon">Opening Amorah Story...</p>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen bg-cream text-maroon flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center mb-4 text-coral border border-coral/30">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif font-bold text-2xl text-maroon mb-2">Story Not Found</h2>
        <p className="text-sm text-mauve max-w-xs mb-6">
          {error && error !== 'Story card not found.' ? error : 'This Amorah story card could not be found or the link is invalid.'}
        </p>
        <button
          onClick={onNavigateToCreate}
          className="px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-medium text-sm flex items-center gap-2 shadow-md"
        >
          <Heart className="w-4 h-4 fill-cream text-cream" />
          <span>Create Your Own Story</span>
        </button>
      </div>
    );
  }

  const isAutoShare = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('share') === 'true';

  return (
    <div className="min-h-screen bg-cream py-6 px-4 flex items-center justify-center font-sans">
      <StoryViewer experience={experience} autoOpenShare={isAutoShare} onNavigateToCreate={onNavigateToCreate} />
    </div>
  );
};
