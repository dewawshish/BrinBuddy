import React, { useState, useRef } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Volume2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YouTubeWindowProps {
  videoId: string;
  title: string;
  windowId: string;
  onClose: () => void;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
}

const YouTubeFloatingWindow: React.FC<YouTubeWindowProps> = ({
  videoId,
  title,
  onClose,
  onPositionChange,
  onSizeChange,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 560, height: 315 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setPosition({ x: newX, y: newY });
    onPositionChange?.(newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setDragOffset({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - dragOffset.x;
    const deltaY = e.clientY - dragOffset.y;

    const newWidth = Math.max(320, size.width + deltaX);
    const newHeight = Math.max(180, size.height + deltaY);

    setSize({ width: newWidth, height: newHeight });
    setDragOffset({
      x: e.clientX,
      y: e.clientY,
    });

    onSizeChange?.(newWidth, newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      globalThis.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      globalThis.addEventListener('mouseup', handleMouseUp as unknown as EventListener);
    }

    if (isResizing) {
      globalThis.addEventListener('mousemove', handleResizeMove as unknown as EventListener);
      globalThis.addEventListener('mouseup', handleResizeEnd as unknown as EventListener);
    }

    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      globalThis.removeEventListener('mouseup', handleMouseUp as unknown as EventListener);
      globalThis.removeEventListener('mousemove', handleResizeMove as unknown as EventListener);
      globalThis.removeEventListener('mouseup', handleResizeEnd as unknown as EventListener);
    };
  }, [isDragging, isResizing, position, size, dragOffset]);

  return (
    <div
      ref={windowRef}
      className="fixed z-40 bg-background border border-border/50 rounded-lg overflow-hidden shadow-xl backdrop-blur-sm"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '300px' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height + 50}px`, // 50px for header
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 p-2 bg-gradient-to-r from-primary/20 to-background border-b border-border/50 cursor-grab active:cursor-grabbing hover:from-primary/30"
        onMouseDown={handleMouseDown}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">Video ID: {videoId.substring(0, 8)}...</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0" data-no-drag>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>

          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Open in YouTube"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-destructive"
            onClick={onClose}
            title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Video */}
          <div className="bg-black" style={{ width: `${size.width}px`, height: `${size.height}px` }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1`}
              title={title}
              className="border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Footer with controls */}
          <div className="p-2 flex items-center justify-between bg-background/50 border-t border-border/30 text-xs">
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Video Player</span>
            </div>
            <div className="text-muted-foreground/50">
              {size.width.toFixed(0)} × {size.height.toFixed(0)}
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary/30 hover:bg-primary/60 cursor-se-resize rounded-tl"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
        </>
      )}
    </div>
  );
};

export default YouTubeFloatingWindow;
