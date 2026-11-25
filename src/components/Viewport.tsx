import React, { useEffect, useRef, useState } from 'react';
import { EditorEngine } from '../three/EditorEngine';
import { ViewportToolbar } from './ViewportToolbar';
import { PlayOverlay } from './PlayOverlay';
import { TransformMode, TransformSpace } from '../types/editor';

interface ViewportProps {
  engine: EditorEngine | null;
  isPlayMode: boolean;
  onStopPlay: () => void;
  transformMode: TransformMode;
  onSetTransformMode: (mode: TransformMode) => void;
  transformSpace: TransformSpace;
  onToggleTransformSpace: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  axesVisible: boolean;
  onToggleAxes: () => void;
  onSetCameraView: (view: 'top' | 'front' | 'right' | 'perspective') => void;
  onFocusSelected: () => void;
  onFrameAll: () => void;
  onDropModelFile?: (file: File) => void;
}

export const Viewport: React.FC<ViewportProps> = ({
  engine,
  isPlayMode,
  onStopPlay,
  transformMode,
  onSetTransformMode,
  transformSpace,
  onToggleTransformSpace,
  snapEnabled,
  onToggleSnap,
  gridVisible,
  onToggleGrid,
  axesVisible,
  onToggleAxes,
  onSetCameraView,
  onFocusSelected,
  onFrameAll,
  onDropModelFile
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag and drop 3D model files (.glb, .gltf) directly onto the viewport canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf') || file.name.endsWith('.obj')) {
        onDropModelFile?.(file);
      }
    }
  };

  // Virtual key handling for mobile Play mode
  const handleVirtualKeyPress = (code: string, isDown: boolean) => {
    if (!engine) return;
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', { code });
    window.dispatchEvent(event);
  };

  return (
    <div
      id="viewport-container"
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex-1 h-full w-full bg-[#13151b] overflow-hidden select-none outline-none"
    >
      {/* Viewport Toolbar (Visible in Edit mode) */}
      {!isPlayMode && (
        <ViewportToolbar
          transformMode={transformMode}
          onSetTransformMode={onSetTransformMode}
          transformSpace={transformSpace}
          onToggleTransformSpace={onToggleTransformSpace}
          snapEnabled={snapEnabled}
          onToggleSnap={onToggleSnap}
          gridVisible={gridVisible}
          onToggleGrid={onToggleGrid}
          axesVisible={axesVisible}
          onToggleAxes={onToggleAxes}
          onSetCameraView={onSetCameraView}
          onFocusSelected={onFocusSelected}
          onFrameAll={onFrameAll}
        />
      )}

      {/* Play Overlay (Visible in Play mode) */}
      {isPlayMode && (
        <PlayOverlay
          onStopPlay={onStopPlay}
          onVirtualKeyPress={handleVirtualKeyPress}
        />
      )}

      {/* Drag & Drop Highlight Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 bg-cyan-500/20 border-2 border-dashed border-cyan-400 flex items-center justify-center pointer-events-none">
          <div className="bg-[#181a20]/90 px-6 py-4 rounded-xl border border-cyan-400 shadow-2xl text-center">
            <span className="font-bold text-cyan-300 text-sm">Drop 3D Model File Here</span>
            <p className="text-xs text-gray-400 mt-1">Supports .glb and .gltf</p>
          </div>
        </div>
      )}
    </div>
  );
};
