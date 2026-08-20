import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

export interface CuratedTrackInfo {
  id: string;
  name: string;
  genre: string;
  url: string;
}

export const CURATED_MUSIC_TRACKS: Record<string, CuratedTrackInfo> = {
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
  accentColor?: string;
  bgColor?: string;
  className?: string;
}

export const MusicPlayerToggle: React.FC<MusicPlayerToggleProps> = ({
  musicTrackId,
  accentColor = '#D4AF37',
  bgColor = '#2A0812',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Starts muted to comply with browser autoplay policies
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTrack = (musicTrackId && CURATED_MUSIC_TRACKS[musicTrackId]) || CURATED_MUSIC_TRACKS['romantic-strings'];

  useEffect(() => {
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
  }, [activeTrack.url]);

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
