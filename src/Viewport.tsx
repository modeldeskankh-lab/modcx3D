import React, { useRef, useState, useEffect } from 'react';
import { EditorEngine } from './three/EditorEngine';
import { ViewportToolbar } from './components/ViewportToolbar';
import { TransformMode, TransformSpace } from './types/editor';
import { Camera, Eye, Maximize2, Minimize2, X, Video } from 'lucide-react';
import { PlayOverlay } from './components/PlayOverlay';

interface ViewportProps {
  engine: EditorEngine | null;
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
  onContextMenu?: (e: React.MouseEvent) => void;
  hasCamera?: boolean;
  isCameraViewOpen?: boolean;
  onCloseCameraView?: () => void;
  isPlayMode?: boolean;
  isPlayPaused?: boolean;
  onStopPlay?: () => void;
  onTogglePause?: () => void;
  onVirtualKeyPress?: (code: string, isDown: boolean) => void;
}

export const Viewport: React.FC<ViewportProps> = ({
  engine,
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
  onDropModelFile,
  onContextMenu,
  hasCamera,
  isCameraViewOpen,
  onCloseCameraView,
  isPlayMode = false,
  isPlayPaused = false,
  onStopPlay,
  onTogglePause,
  onVirtualKeyPress
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const secondaryCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCamExpanded, setIsCamExpanded] = useState(false);

  // Attach secondary canvas to engine when Camera View is active
  useEffect(() => {
    if (isCameraViewOpen && secondaryCanvasRef.current && engine) {
      engine.setSecondaryCanvas(secondaryCanvasRef.current);
    } else if (engine) {
      engine.setSecondaryCanvas(null);
    }

    return () => {
      if (engine) {
        engine.setSecondaryCanvas(null);
      }
    };
  }, [isCameraViewOpen, engine]);

  // Handle right-click in viewport
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

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
      if (
        file.name.toLowerCase().endsWith('.glb') ||
        file.name.toLowerCase().endsWith('.gltf') ||
        file.name.toLowerCase().endsWith('.obj')
      ) {
        onDropModelFile?.(file);
      }
    }
  };

  return (
    <div
      id="viewport-container"
      ref={containerRef}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex-1 h-full w-full bg-[#13151b] overflow-hidden select-none outline-none"
    >
      {/* Viewport Floating Toolbar (Hidden during gameplay) */}
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

      {/* CAMERA VIEW PIP PREVIEW OVERLAY BOX (Hidden during gameplay) */}
      {isCameraViewOpen && !isPlayMode && (
        <div
          className={`absolute bottom-4 right-4 z-30 transition-all duration-300 ${
            isCamExpanded ? 'w-[480px] h-[300px]' : 'w-80 h-52'
          } bg-[#10141f]/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden ring-1 ring-cyan-500/20`}
        >
          {/* Header Bar */}
          <div className="h-8 px-3 bg-[#171c2b] border-b border-[#242c40] flex items-center justify-between text-xs text-white select-none">
            <div className="flex items-center gap-2">
              <Camera size={14} className="text-cyan-400 animate-pulse" />
              <span className="font-bold text-cyan-300 text-[11px] tracking-wide">CAMERA VIEW</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                LIVE
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => engine?.setCameraToSceneCamera()}
                className="p-1 hover:bg-[#252d42] text-gray-300 hover:text-cyan-300 rounded transition-colors"
                title="Look through this Camera in Main Editor View"
              >
                <Eye size={13} />
              </button>
              <button
                onClick={() => setIsCamExpanded(!isCamExpanded)}
                className="p-1 hover:bg-[#252d42] text-gray-300 hover:text-cyan-300 rounded transition-colors"
                title={isCamExpanded ? 'Small Preview' : 'Expand Preview'}
              >
                {isCamExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                onClick={onCloseCameraView}
                className="p-1 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded transition-colors ml-0.5"
                title="Close Camera View"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* WebGL Canvas Stream */}
          <div className="flex-1 relative w-full h-full bg-slate-950 overflow-hidden">
            <canvas
              ref={secondaryCanvasRef}
              className="w-full h-full block object-cover"
            />

            {/* Bottom Status Overlay */}
            <div className="absolute bottom-1.5 left-2 right-2 px-2 py-0.5 bg-[#0b0e17]/85 rounded border border-[#1e2638] text-[9px] font-mono text-gray-400 flex items-center justify-between pointer-events-none">
              <span className="text-cyan-400 font-bold">FOV: 50° • 16:9</span>
              <span className="text-gray-400">Move Camera in 3D scene</span>
            </div>
          </div>
        </div>
      )}

      {/* PLAY MODE GAMEPLAY OVERLAY */}
      {isPlayMode && (
        <PlayOverlay
          isPlayPaused={isPlayPaused}
          onStopPlay={onStopPlay || (() => {})}
          onTogglePause={onTogglePause}
          onVirtualKeyPress={onVirtualKeyPress}
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
