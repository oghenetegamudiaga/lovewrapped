export type MusicPlatformType = 'spotify' | 'apple_music' | 'soundcloud';
export type MusicSourceType = 'curated' | MusicPlatformType;

export interface MusicValidationResult {
  valid: boolean;
  type?: MusicPlatformType;
  externalId?: string | null;
  externalMeta?: Record<string, any> | null;
  message?: string;
}

export interface MusicProvider {
  name: string;
  type: MusicPlatformType;
  matchUrl: (url: string) => boolean;
  validate: (url: string) => Promise<MusicValidationResult> | MusicValidationResult;
  getEmbedProps: (
    externalId?: string | null,
    externalMeta?: Record<string, any> | null
  ) => {
    embedUrl?: string;
    type: MusicPlatformType;
    title: string;
  };
}

/**
 * 1. Spotify Provider
 * Matches: open.spotify.com/track/{id} or spotify:track:{id}
 * Embed: https://open.spotify.com/embed/track/{id}?utm_source=generator&theme=0
 */
export const spotifyProvider: MusicProvider = {
  name: 'Spotify',
  type: 'spotify',
  matchUrl: (url: string) => {
    return /(?:open\.spotify\.com\/track\/|spotify:track:)/i.test(url);
  },
  validate: (url: string) => {
    const trimmed = url.trim();
    const regex = /(?:open\.spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]{15,30})/;
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return {
        valid: true,
        type: 'spotify',
        externalId: match[1],
        externalMeta: null,
      };
    }
    return {
      valid: false,
      message: 'Invalid Spotify track link. Please copy a valid track link from Spotify.',
    };
  },
  getEmbedProps: (externalId) => ({
    embedUrl: externalId ? `https://open.spotify.com/embed/track/${externalId}?utm_source=generator&theme=0` : undefined,
    type: 'spotify',
    title: 'Spotify Track',
  }),
};

/**
 * 2. Apple Music Provider
 * Matches: music.apple.com/{country}/album/.../{albumId}?i={songId}
 * Requires: country code, album ID, and song ID (all required for a valid embed)
 * Embed: https://embed.music.apple.com/{country}/album/{albumId}?i={songId}
 */
export const appleMusicProvider: MusicProvider = {
  name: 'Apple Music',
  type: 'apple_music',
  matchUrl: (url: string) => {
    return /music\.apple\.com/i.test(url);
  },
  validate: (url: string) => {
    const trimmed = url.trim();
    // Regex matches music.apple.com/{country}/album/optional-name/{albumId}?i={songId} or similar query variants
    const regex = /https?:\/\/music\.apple\.com\/([a-z]{2})\/album\/(?:[^\/]+\/)?([0-9]+)(?:\?[^#]*[\?&]i=([0-9]+)|.*[?&]i=([0-9]+))/i;
    const match = trimmed.match(regex);

    if (match) {
      const country = match[1]?.toLowerCase();
      const albumId = match[2];
      const songId = match[3] || match[4];

      if (country && albumId && songId) {
        return {
          valid: true,
          type: 'apple_music',
          externalId: songId,
          externalMeta: {
            country,
            albumId,
            songId,
          },
        };
      }
    }

    return {
      valid: false,
      message: 'Invalid Apple Music link. Please ensure your link includes country, album ID, and song ID (e.g. music.apple.com/us/album/.../123?i=456).',
    };
  },
  getEmbedProps: (externalId, externalMeta) => {
    const country = externalMeta?.country;
    const albumId = externalMeta?.albumId;
    const songId = externalMeta?.songId || externalId;

    let embedUrl: string | undefined;
    if (country && albumId && songId) {
      embedUrl = `https://embed.music.apple.com/${country}/album/${albumId}?i=${songId}`;
    }

    return {
      embedUrl,
      type: 'apple_music',
      title: 'Apple Music Song',
    };
  },
};

/**
 * 3. SoundCloud Provider
 * Matches: soundcloud.com/{artist}/{track}
 * Server-side calls SoundCloud official oEmbed endpoint: https://soundcloud.com/oembed?format=json&url={encoded_url}
 * Embed: SoundCloud Player Widget URL
 */
export const soundCloudProvider: MusicProvider = {
  name: 'SoundCloud',
  type: 'soundcloud',
  matchUrl: (url: string) => {
    return /soundcloud\.com/i.test(url);
  },
  validate: async (url: string) => {
    const trimmed = url.trim();
    if (!/^https?:\/\/(?:www\.)?soundcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/i.test(trimmed)) {
      return {
        valid: false,
        message: 'Invalid SoundCloud link. Please provide a direct SoundCloud track link.',
      };
    }

    try {
      const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trimmed)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(oembedUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.html) {
          const srcMatch = data.html.match(/src="([^"]+)"/);
          const embedUrl = srcMatch ? srcMatch[1] : `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}`;

          return {
            valid: true,
            type: 'soundcloud',
            externalId: null,
            externalMeta: {
              trackUrl: trimmed,
              embedUrl,
              title: data.title || 'SoundCloud Track',
              authorName: data.author_name || null,
            },
          };
        }
      }
    } catch (err: any) {
      // Fall through to structure-based fallback if oEmbed endpoint is unreachable or times out
    }

    // Fallback for valid SoundCloud URL structure when oEmbed API is slow/unavailable
    const fallbackEmbedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
    return {
      valid: true,
      type: 'soundcloud',
      externalId: null,
      externalMeta: {
        trackUrl: trimmed,
        embedUrl: fallbackEmbedUrl,
        title: 'SoundCloud Track',
      },
    };
  },
  getEmbedProps: (_externalId, externalMeta) => {
    const embedUrl = externalMeta?.embedUrl || (externalMeta?.trackUrl ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(externalMeta.trackUrl)}` : undefined);
    return {
      embedUrl,
      type: 'soundcloud',
      title: externalMeta?.title || 'SoundCloud Track',
    };
  },
};

/**
 * Registry array of supported providers
 */
export const MUSIC_PROVIDERS: MusicProvider[] = [
  spotifyProvider,
  appleMusicProvider,
  soundCloudProvider,
];

/**
 * Helper to detect YouTube links and return explicit rejection, or dispatch to provider registry
 */
export async function validateMusicUrlRegistry(rawUrl: string): Promise<MusicValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      valid: false,
      message: 'Please paste a Spotify track link, Apple Music song link, or SoundCloud track link.',
    };
  }

  const trimmed = rawUrl.trim();

  // 1. YouTube Explicit Guardrail
  if (/(?:youtube\.com|youtu\.be)/i.test(trimmed)) {
    return {
      valid: false,
      message: "YouTube links aren't supported. Please use a Spotify, Apple Music, or SoundCloud link instead.",
    };
  }

  // 2. Registry Matching
  for (const provider of MUSIC_PROVIDERS) {
    if (provider.matchUrl(trimmed)) {
      return await provider.validate(trimmed);
    }
  }

  return {
    valid: false,
    message: 'Unsupported link. Please use a Spotify, Apple Music, or SoundCloud link.',
  };
}
