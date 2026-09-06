import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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
    name: 'Iyawo Mi by Timi Dakolo',
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

export interface MusicPlayerToggleRef {
  startPlayback: () => void;
  toggleMute: () => void;
}

interface MusicPlayerToggleProps {
  musicTrackId?: string | null;
  musicSourceType?: MusicSourceType | null;
  musicExternalId?: string | null;
  musicExternalMeta?: Record<string, any> | null;
  accentColor?: string;
  bgColor?: string;
  className?: string;
  stage?: 'loading' | 'cover' | 'unsealing' | 'ready';
  autoPlayOnStart?: boolean;
}

export const MusicPlayerToggle = forwardRef<MusicPlayerToggleRef, MusicPlayerToggleProps>(({
  musicTrackId,
  musicSourceType = 'curated',
  musicExternalId,
  musicExternalMeta,
  accentColor = '#D4AF37',
  bgColor = '#2A0812',
  className = '',
  stage = 'ready',
  autoPlayOnStart = false,
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [showEmbedWidget, setShowEmbedWidget] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const soundcloudIframeRef = useRef<HTMLIFrameElement | null>(null);

  const isYouTube = musicSourceType === 'youtube' || (!!musicExternalId && (musicExternalMeta?.videoId || /youtube|youtu\.be/i.test(musicExternalId)));
  const isSpotify = musicSourceType === 'spotify' && !!musicExternalId;
  const isAppleMusic = musicSourceType === 'apple_music' && (!!musicExternalMeta?.country || !!musicExternalId);
  const isSoundCloud = musicSourceType === 'soundcloud' && (!!musicExternalMeta?.trackUrl || !!musicExternalMeta?.embedUrl || !!musicExternalId);
  const isCurated = !isSpotify && !isAppleMusic && !isSoundCloud && !isYouTube;

  const activeTrack = (musicTrackId && CURATED_MUSIC_TRACKS[musicTrackId]) || CURATED_MUSIC_TRACKS['iyawo-mi'];

  // Start playback routine called directly on guest tap gesture
  const startPlayback = () => {
    setIsActivated(true);

    if (isCurated) {
      if (!audioRef.current) {
        audioRef.current = new Audio(activeTrack.url);
        audioRef.current.loop = true;
      }
      audioRef.current.muted = false;
      audioRef.current.play().then(() => {
        setIsMuted(false);
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Curated audio playback error:', err);
      });
    } else if (isYouTube) {
      setIsMuted(false);
      setIsPlaying(true);
      setTimeout(() => {
        if (youtubeIframeRef.current?.contentWindow) {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*'
          );
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'
          );
        }
      }, 300);
    } else if (isSoundCloud) {
      setIsMuted(false);
      setIsPlaying(true);
      setTimeout(() => {
        if (soundcloudIframeRef.current?.contentWindow) {
          soundcloudIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: 'setVolume', value: 100 }), '*'
          );
          soundcloudIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: 'play' }), '*'
          );
        }
      }, 300);
    } else if (isSpotify || isAppleMusic) {
      setIsMuted(false);
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (isCurated) {
      if (!audioRef.current) {
        audioRef.current = new Audio(activeTrack.url);
        audioRef.current.loop = true;
      }

      if (isMuted) {
        audioRef.current.muted = false;
        audioRef.current.play().then(() => {
          setIsMuted(false);
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Curated audio play error:', err);
        });
      } else {
        audioRef.current.muted = true;
        setIsMuted(true);
        setIsPlaying(false);
      }
    } else if (isYouTube) {
      if (isMuted) {
        if (youtubeIframeRef.current?.contentWindow) {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*'
          );
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'
          );
        }
        setIsMuted(false);
        setIsPlaying(true);
      } else {
        if (youtubeIframeRef.current?.contentWindow) {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*'
          );
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*'
          );
        }
        setIsMuted(true);
        setIsPlaying(false);
      }
    } else if (isSoundCloud) {
      if (isMuted) {
        if (soundcloudIframeRef.current?.contentWindow) {
          soundcloudIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: 'setVolume', value: 100 }), '*'
          );
          soundcloudIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: 'play' }), '*'
          );
        }
        setIsMuted(false);
        setIsPlaying(true);
      } else {
        if (soundcloudIframeRef.current?.contentWindow) {
          soundcloudIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: 'setVolume', value: 0 }), '*'
          );
          soundcloudIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: 'pause' }), '*'
          );
        }
        setIsMuted(true);
        setIsPlaying(false);
      }
    } else if (isSpotify || isAppleMusic) {
      setIsMuted((prev) => {
        const next = !prev;
        setIsPlaying(!next);
        return next;
      });
    }
  };

  useImperativeHandle(ref, () => ({
    startPlayback,
    toggleMute,
  }));

  useEffect(() => {
    if (autoPlayOnStart && !isActivated) {
      startPlayback();
    }
  }, [autoPlayOnStart]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const ytVideoId = musicExternalId || musicExternalMeta?.videoId || 'dQw4w9WgXcQ';
  const ytEmbedUrl = `https://www.youtube.com/embed/${ytVideoId}?enablejsapi=1&autoplay=1&playsinline=1`;

  const trackTitle = isCurated
    ? activeTrack.name
    : isYouTube
    ? (musicExternalMeta?.title || 'YouTube Wedding Audio')
    : isSpotify
    ? 'Spotify Track'
    : isAppleMusic
    ? 'Apple Music Song'
    : isSoundCloud
    ? (musicExternalMeta?.title || 'SoundCloud Track')
    : 'Background Music';

  // Do not show controls before unsealing/ready unless active
  if (stage === 'loading' || stage === 'cover') {
    return (
      <div className="hidden">
        {/* Preload hidden players if activated */}
        {isYouTube && isActivated && (
          <iframe
            ref={youtubeIframeRef}
            src={ytEmbedUrl}
            title="YouTube Hidden Audio Player"
            allow="autoplay; encrypted-media"
            className="w-0 h-0 opacity-0 pointer-events-none absolute"
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Hidden YouTube Audio Player */}
      {isYouTube && isActivated && (
        <iframe
          ref={youtubeIframeRef}
          src={ytEmbedUrl}
          title="YouTube Hidden Audio Player"
          allow="autoplay; encrypted-media"
          className="w-0 h-0 opacity-0 pointer-events-none fixed top-0 left-0"
        />
      )}

      {/* SoundCloud Player Embed */}
      {isSoundCloud && isActivated && (
        <div className={`fixed bottom-18 right-6 z-50 max-w-[280px] w-full shadow-2xl rounded-2xl overflow-hidden border border-white/20 bg-black/90 backdrop-blur-md transition-all ${showEmbedWidget ? 'block' : 'hidden'}`}>
          <iframe
            ref={soundcloudIframeRef}
            src={musicExternalMeta?.embedUrl || `https://w.soundcloud.com/player/?url=${encodeURIComponent(musicExternalMeta?.trackUrl || musicExternalId || '')}&color=%23ff5500&auto_play=true`}
            width="100%"
            height="166"
            frameBorder="0"
            allow="autoplay"
            title="SoundCloud Embedded Track"
            className="rounded-2xl w-full"
          />
        </div>
      )}

      {/* Spotify Embed Player */}
      {isSpotify && isActivated && (
        <div className={`fixed bottom-18 right-6 z-50 max-w-[280px] w-full shadow-2xl rounded-2xl overflow-hidden border border-white/20 backdrop-blur-md transition-all ${showEmbedWidget || !isMuted ? 'block' : 'hidden'}`}>
          <iframe
            src={`https://open.spotify.com/embed/track/${musicExternalId}?utm_source=generator&theme=0&autoplay=1`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            title="Spotify Embedded Track"
            className="rounded-2xl"
          />
        </div>
      )}

      {/* Apple Music Embed Player */}
      {isAppleMusic && isActivated && (
        <div className={`fixed bottom-18 right-6 z-50 max-w-[300px] w-full shadow-2xl rounded-2xl overflow-hidden border border-white/20 bg-black/90 backdrop-blur-md transition-all ${showEmbedWidget || !isMuted ? 'block' : 'hidden'}`}>
          <iframe
            src={
              musicExternalMeta?.albumId && musicExternalMeta?.songId
                ? `https://embed.music.apple.com/${musicExternalMeta?.country || 'us'}/album/${musicExternalMeta.albumId}?i=${musicExternalMeta.songId}`
                : `https://embed.music.apple.com/${musicExternalMeta?.country || 'us'}/album/${musicExternalId}`
            }
            width="100%"
            height="175"
            frameBorder="0"
            allow="autoplay *; encrypted-media *; fullscreen *"
            title="Apple Music Embedded Song"
            className="rounded-2xl w-full"
          />
        </div>
      )}

      {/* Main Floating Mute / Unmute Toggle Button */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          type="button"
          onClick={() => {
            if (isSpotify || isAppleMusic || isSoundCloud) {
              setShowEmbedWidget((prev) => !prev);
            }
            toggleMute();
          }}
          title={isMuted ? `Unmute Music: ${trackTitle}` : `Mute Music: ${trackTitle}`}
          className="group relative flex items-center justify-center p-3.5 rounded-full shadow-2xl border transition-all cursor-pointer hover:scale-105 active:scale-95"
          style={{
            backgroundColor: `${bgColor}EE`,
            borderColor: accentColor,
            color: accentColor,
          }}
        >
          {/* Pulsating animation ring when unmuted and playing */}
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
            <span>{isMuted ? 'Click to Unmute Music' : trackTitle}</span>
          </div>
        </button>
      </div>
    </>
  );
});

MusicPlayerToggle.displayName = 'MusicPlayerToggle';
