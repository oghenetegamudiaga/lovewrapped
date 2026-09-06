import React from 'react';

interface FullBleedViewerContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const FullBleedViewerContainer: React.FC<FullBleedViewerContainerProps> = ({
  children,
  className = '',
  style,
}) => {
  return (
    <div
      className={`relative w-full h-full min-h-screen min-h-[100dvh] overflow-hidden flex flex-col p-0 m-0 border-0 rounded-none select-none ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

interface FullBleedContentFrameProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  style?: React.CSSProperties;
}

export const FullBleedContentFrame: React.FC<FullBleedContentFrameProps> = ({
  children,
  className = '',
  maxWidth = 'max-w-md',
  style,
}) => {
  return (
    <div className={`w-full ${maxWidth} mx-auto flex-1 flex flex-col ${className}`} style={style}>
      {children}
    </div>
  );
};
