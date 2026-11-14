import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CropRect } from '../tools/photoTransformHelper';

interface PhotoCropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  aspectRatio: number | null; // width / height, or null for freeform
  cropRect: CropRect;
  onChangeCropRect: (rect: CropRect) => void;
}

type DragHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | 'move' | null;

export const PhotoCropOverlay: React.FC<PhotoCropOverlayProps> = ({
  imageWidth,
  imageHeight,
  zoom,
  pan,
  aspectRatio,
  cropRect,
  onChangeCropRect,
}) => {
  const [activeHandle, setActiveHandle] = useState<DragHandle>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; rect: CropRect }>({
    mouseX: 0,
    mouseY: 0,
    rect: { ...cropRect },
  });
  const rafCropRef = useRef<number | null>(null);

  // Calculate screen coordinates from natural image coordinates
  const screenX = pan.x + cropRect.x * zoom;
  const screenY = pan.y + cropRect.y * zoom;
  const screenW = cropRect.width * zoom;
  const screenH = cropRect.height * zoom;

  const handleMouseDown = (handle: DragHandle, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle(handle);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      rect: { ...cropRect },
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeHandle) return;

      const dx = (e.clientX - dragStartRef.current.mouseX) / zoom;
      const dy = (e.clientY - dragStartRef.current.mouseY) / zoom;
      const initial = dragStartRef.current.rect;

      let nextX = initial.x;
      let nextY = initial.y;
      let nextW = initial.width;
      let nextH = initial.height;

      const minSize = 20;

      if (activeHandle === 'move') {
        nextX = Math.max(0, Math.min(imageWidth - initial.width, initial.x + dx));
        nextY = Math.max(0, Math.min(imageHeight - initial.height, initial.y + dy));
      } else {
        if (activeHandle.includes('e')) {
          nextW = Math.max(minSize, Math.min(imageWidth - initial.x, initial.width + dx));
        }
        if (activeHandle.includes('s')) {
          nextH = Math.max(minSize, Math.min(imageHeight - initial.y, initial.height + dy));
        }
        if (activeHandle.includes('w')) {
          const maxLeft = initial.x + initial.width - minSize;
          nextX = Math.max(0, Math.min(maxLeft, initial.x + dx));
          nextW = initial.width - (nextX - initial.x);
        }
        if (activeHandle.includes('n')) {
          const maxTop = initial.y + initial.height - minSize;
          nextY = Math.max(0, Math.min(maxTop, initial.y + dy));
          nextH = initial.height - (nextY - initial.y);
        }

        // Apply aspect ratio lock if active
        if (aspectRatio) {
          if (activeHandle.includes('e') || activeHandle.includes('w')) {
            nextH = Math.min(imageHeight - nextY, nextW / aspectRatio);
          } else {
            nextW = Math.min(imageWidth - nextX, nextH * aspectRatio);
          }
        }
      }

      if (rafCropRef.current) cancelAnimationFrame(rafCropRef.current);
      rafCropRef.current = requestAnimationFrame(() => {
        onChangeCropRect({
          x: Math.round(nextX),
          y: Math.round(nextY),
          width: Math.round(nextW),
          height: Math.round(nextH),
        });
      });
    },
    [activeHandle, zoom, imageWidth, imageHeight, aspectRatio, onChangeCropRect]
  );

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      {/* 1. Dimmed Backdrop Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={screenX} y={screenY} width={screenW} height={screenH} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15, 23, 42, 0.45)" mask="url(#crop-mask)" />
      </svg>

      {/* 2. Interactive Crop Bounding Box */}
      <div
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${screenW}px`,
          height: `${screenH}px`,
        }}
        onMouseDown={(e) => handleMouseDown('move', e)}
        className="absolute pointer-events-auto cursor-move border border-white/90 shadow-sm"
      >
        {/* Rule of Thirds Grid Lines */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div />
        </div>

        {/* 4 Corner Resize Handles */}
        <div
          onMouseDown={(e) => handleMouseDown('nw', e)}
          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-slate-700 cursor-nwse-resize rounded-xs"
        />
        <div
          onMouseDown={(e) => handleMouseDown('ne', e)}
          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-slate-700 cursor-nesw-resize rounded-xs"
        />
        <div
          onMouseDown={(e) => handleMouseDown('sw', e)}
          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-slate-700 cursor-nesw-resize rounded-xs"
        />
        <div
          onMouseDown={(e) => handleMouseDown('se', e)}
          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-slate-700 cursor-nwse-resize rounded-xs"
        />

        {/* 4 Edge Resize Handles */}
        <div
          onMouseDown={(e) => handleMouseDown('n', e)}
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white/90 border border-slate-700 cursor-ns-resize rounded-xs"
        />
        <div
          onMouseDown={(e) => handleMouseDown('s', e)}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-white/90 border border-slate-700 cursor-ns-resize rounded-xs"
        />
        <div
          onMouseDown={(e) => handleMouseDown('w', e)}
          className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-6 bg-white/90 border border-slate-700 cursor-ew-resize rounded-xs"
        />
        <div
          onMouseDown={(e) => handleMouseDown('e', e)}
          className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-6 bg-white/90 border border-slate-700 cursor-ew-resize rounded-xs"
        />
      </div>
    </div>
  );
};
