import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { MusicSourceType } from '../types';

export interface CuratedTrackInfo {
  id: string;
  name: string;
  genre: string;
  url: string;
}

export const CURATED_MUSIC_TRACKS: Record<string, CuratedTrackInfo> = {
  'iyawo-mi': {
    id: 'iyawo-mi',
    name: 'Iyawo Mi — Timi Dakolo',
    genre: 'Afro-Romantic Serenade',
    url: '/audio/iyawo-mi.mp3',
  },
  'romantic-strings': {
    id: 'romantic-strings',
    name: 'Romantic Strings & Orchestral Serenade',
    genre: 'Classical Romance',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  },
  'piano-acoustic': {
    id: 'piano-acoustic',
    name: 'Soft Acoustic Piano & Cello',
    genre: 'Acoustic Heartfelt',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a815a5.mp3',
  },
  'cinematic-love': {
    id: 'cinematic-love',
    name: 'Cinematic Golden Hour Waltz',
    genre: 'Cinematic Orchestral',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c0c1692131.mp3',
  },
};

interface MusicPlayerToggleProps {
  musicTrackId?: string | null;
  musicSourceType?: MusicSourceType | null;
  musicExternalId?: string | null;
  musicExternalMeta?: Record<string, any> | null;
  accentColor?: string;
  bgColor?: string;
  className?: string;
}

export const MusicPlayerToggle: React.FC<MusicPlayerToggleProps> = ({
  musicTrackId,
  musicSourceType = 'curated',
  musicExternalId,
  musicExternalMeta,
  accentColor = '#D4AF37',
  bgColor = '#2A0812',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Starts muted to comply with browser autoplay policies
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSpotify = musicSourceType === 'spotify' && !!musicExternalId;
  const isAppleMusic = musicSourceType === 'apple_music' && (!!musicExternalMeta?.country || !!musicExternalId);
  const isSoundCloud = musicSourceType === 'soundcloud' && (!!musicExternalMeta?.trackUrl || !!musicExternalMeta?.embedUrl || !!musicExternalId);
  const isCurated = !isSpotify && !isAppleMusic && !isSoundCloud;

  const activeTrack = (musicTrackId && CURATED_MUSIC_TRACKS[musicTrackId]) || CURATED_MUSIC_TRACKS['iyawo-mi'];

  useEffect(() => {
    if (!isCurated) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(activeTrack.url);
    audio.loop = true;
    audio.muted = true;
    audioRef.current = audio;

    // Attempt background playback (muted initially)
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Autoplay blocked by browser until user interaction
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [activeTrack.url, isCurated]);

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.play().then(() => {
        setIsMuted(false);
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
      });
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // 1. Spotify Official Compact Player Embed
  if (isSpotify) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 max-w-[280px] w-full shadow-2xl rounded-2xl overflow-hidden border border-white/20 backdrop-blur-md ${className}`}>
        <iframe
          src={`https://open.spotify.com/embed/track/${musicExternalId}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Embedded Track"
          className="rounded-2xl"
        />
      </div>
    );
  }

  // 2. Apple Music Official Compact Player Embed
  if (isAppleMusic) {
    const country = musicExternalMeta?.country || 'us';
    const albumId = musicExternalMeta?.albumId;
    const songId = musicExternalMeta?.songId || musicExternalId;
    const embedSrc = albumId && songId
      ? `https://embed.music.apple.com/${country}/album/${albumId}?i=${songId}`
      : `https://embed.music.apple.com/${country}/album/${songId}`;

    return (
      <div className={`fixed bottom-4 right-4 z-50 max-w-[300px] w-full shadow-2xl rounded-2xl overflow-hidden border border-white/20 bg-black/90 backdrop-blur-md ${className}`}>
        <iframe
          src={embedSrc}
          width="100%"
          height="175"
          frameBorder="0"
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          loading="lazy"
          title="Apple Music Embedded Song"
          className="rounded-2xl w-full"
        />
      </div>
    );
  }

  // 3. SoundCloud Official Compact Player Embed
  if (isSoundCloud) {
    const trackUrl = musicExternalMeta?.trackUrl || musicExternalId;
    const embedSrc = musicExternalMeta?.embedUrl || (trackUrl ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false` : undefined);

    if (embedSrc) {
      return (
        <div className={`fixed bottom-4 right-4 z-50 max-w-[300px] w-full shadow-2xl rounded-2xl overflow-hidden border border-white/20 bg-black/90 backdrop-blur-md ${className}`}>
          <iframe
            src={embedSrc}
            width="100%"
            height="166"
            frameBorder="0"
            allow="autoplay"
            loading="lazy"
            title="SoundCloud Embedded Track"
            className="rounded-2xl w-full"
          />
        </div>
      );
    }
  }

  // 4. Curated Track Player with Mute/Unmute Toggle
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <button
        type="button"
        onClick={toggleMute}
        title={isMuted ? `Unmute Music: ${activeTrack.name}` : 'Mute Music'}
        className="group relative flex items-center justify-center p-3 rounded-full shadow-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95"
        style={{
          backgroundColor: `${bgColor}EE`,
          borderColor: accentColor,
          color: accentColor,
        }}
      >
        {/* Pulsating animation ring when unmuted */}
        {!isMuted && isPlaying && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />
        )}

        {isMuted ? (
          <VolumeX className="w-5 h-5 opacity-75 group-hover:opacity-100" />
        ) : (
          <Volume2 className="w-5 h-5 animate-pulse" />
        )}

        {/* Hover Track Title Tooltip */}
        <div
          className="absolute right-full mr-3 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap shadow-lg border backdrop-blur"
          style={{
            backgroundColor: `${bgColor}F0`,
            borderColor: `${accentColor}40`,
            color: accentColor,
          }}
        >
          <Music className="w-3.5 h-3.5" />
          <span>{isMuted ? 'Click to Unmute Music' : activeTrack.name}</span>
        </div>
      </button>
    </div>
  );
};
