import { useState, useEffect, useCallback } from 'react';
import { SiteContentMap } from '../types';

const API_BASE = '/api';

// In-memory module cache so multiple component mounts don't trigger repeated requests
let cachedContent: SiteContentMap | null = null;
let pendingPromise: Promise<SiteContentMap> | null = null;

export async function fetchSiteContentApi(): Promise<SiteContentMap> {
  if (cachedContent) return cachedContent;
  if (pendingPromise) return pendingPromise;

  pendingPromise = fetch(`${API_BASE}/content`)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch site content');
      return res.json();
    })
    .then((data: SiteContentMap) => {
      cachedContent = data;
      pendingPromise = null;
      return data;
    })
    .catch((err) => {
      console.warn('Site content fetch fallback:', err);
      pendingPromise = null;
      return {};
    });

  return pendingPromise;
}

export function invalidateSiteContentCache(): void {
  cachedContent = null;
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContentMap>(cachedContent || {});
  const [isLoading, setIsLoading] = useState(!cachedContent);

  const reloadContent = useCallback(async () => {
    setIsLoading(true);
    invalidateSiteContentCache();
    const fresh = await fetchSiteContentApi();
    setContent(fresh);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const data = await fetchSiteContentApi();
      if (isMounted) {
        setContent(data);
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const getContent = useCallback(
    (key: string, fallback: string): string => {
      if (content && typeof content[key] === 'string' && content[key].trim() !== '') {
        return content[key];
      }
      return fallback;
    },
    [content]
  );

  return {
    content,
    getContent,
    isLoading,
    reloadContent,
  };
}
