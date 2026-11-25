import React from 'react';
import {
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  Grid,
  Compass,
  Magnet,
  Camera,
  Target,
  Globe,
  Box
} from 'lucide-react';
import { TransformMode, TransformSpace } from '../types/editor';

interface ViewportToolbarProps {
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
}

export const ViewportToolbar: React.FC<ViewportToolbarProps> = ({
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
  onFrameAll
}) => {
  return (
    <div
      id="viewport-toolbar"
      className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 p-1 bg-[#181a20]/90 backdrop-blur border border-[#2d313b] rounded-md shadow-lg z-20 text-xs text-gray-300"
    >
      {/* Gizmo Modes */}
      <div className="flex items-center bg-[#101216] rounded p-0.5 border border-[#232731]">
        <button
          id="tool-move"
          onClick={() => onSetTransformMode('translate')}
          title="Move Tool (W)"
          className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
            transformMode === 'translate' ? 'bg-cyan-600 text-white font-medium' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Move size={13} />
          <span className="hidden sm:inline">Move</span>
        </button>
        <button
          id="tool-rotate"
          onClick={() => onSetTransformMode('rotate')}
          title="Rotate Tool (E)"
          className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
            transformMode === 'rotate' ? 'bg-cyan-600 text-white font-medium' : 'text-gray-400 hover:text-white'
          }`}
        >
          <RotateCw size={13} />
          <span className="hidden sm:inline">Rotate</span>
        </button>
        <button
          id="tool-scale"
          onClick={() => onSetTransformMode('scale')}
          title="Scale Tool (R)"
          className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
            transformMode === 'scale' ? 'bg-cyan-600 text-white font-medium' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Maximize2 size={13} />
          <span className="hidden sm:inline">Scale</span>
        </button>
      </div>

      {/* Coordinate Space (World / Local) */}
      <button
        id="tool-space"
        onClick={onToggleTransformSpace}
        title={`Current transform space: ${transformSpace}`}
        className="px-2 py-1 bg-[#101216] hover:bg-[#20242e] border border-[#232731] rounded flex items-center gap-1 transition-colors"
      >
        {transformSpace === 'world' ? <Globe size={13} className="text-cyan-400" /> : <Box size={13} className="text-amber-400" />}
        <span className="capitalize">{transformSpace}</span>
      </button>

      {/* Snap Toggle */}
      <button
        id="tool-snap"
        onClick={onToggleSnap}
        title="Toggle Grid Snapping"
        className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
          snapEnabled
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium'
            : 'bg-[#101216] border-[#232731] text-gray-400 hover:text-white'
        }`}
      >
        <Magnet size={13} />
        <span>Snap</span>
      </button>

      {/* Grid & Axes Helpers */}
      <div className="flex items-center bg-[#101216] rounded p-0.5 border border-[#232731]">
        <button
          id="tool-grid"
          onClick={onToggleGrid}
          title="Toggle Grid"
          className={`p-1 rounded transition-colors ${gridVisible ? 'text-cyan-400 bg-[#1f242e]' : 'text-gray-500'}`}
        >
          <Grid size={13} />
        </button>
        <button
          id="tool-axes"
          onClick={onToggleAxes}
          title="Toggle Axes Helper"
          className={`p-1 rounded transition-colors ${axesVisible ? 'text-cyan-400 bg-[#1f242e]' : 'text-gray-500'}`}
        >
          <Compass size={13} />
        </button>
      </div>

      {/* Camera View Presets */}
      <div className="hidden md:flex items-center bg-[#101216] rounded p-0.5 border border-[#232731] text-[10px]">
        <button
          onClick={() => onSetCameraView('top')}
          className="px-1.5 py-0.5 hover:bg-[#232732] rounded text-gray-300"
          title="Top Orthogonal-style View"
        >
          TOP
        </button>
        <button
          onClick={() => onSetCameraView('front')}
          className="px-1.5 py-0.5 hover:bg-[#232732] rounded text-gray-300"
          title="Front View"
        >
          FRONT
        </button>
        <button
          onClick={() => onSetCameraView('right')}
          className="px-1.5 py-0.5 hover:bg-[#232732] rounded text-gray-300"
          title="Right View"
        >
          RIGHT
        </button>
        <button
          onClick={() => onSetCameraView('perspective')}
          className="px-1.5 py-0.5 hover:bg-[#232732] rounded text-cyan-400 font-medium"
          title="Perspective View"
        >
          PERSP
        </button>
      </div>

      {/* Quick Focus Button */}
      <button
        id="tool-focus"
        onClick={onFocusSelected}
        title="Focus Camera on Selected Object (F)"
        className="p-1 bg-[#101216] hover:bg-[#20242e] border border-[#232731] rounded text-gray-400 hover:text-white"
      >
        <Target size={13} />
      </button>
    </div>
  );
};
