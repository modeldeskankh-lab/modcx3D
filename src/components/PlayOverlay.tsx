import React from 'react';
import { Square, Play, Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface PlayOverlayProps {
  isPlayPaused?: boolean;
  onStopPlay: () => void;
  onTogglePause?: () => void;
  onVirtualKeyPress?: (code: string, isDown: boolean) => void;
}

export const PlayOverlay: React.FC<PlayOverlayProps> = ({
  isPlayPaused = false,
  onStopPlay,
  onTogglePause,
  onVirtualKeyPress
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-30 select-none">
      {/* Pause Modal Overlay */}
      {isPlayPaused && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#181a20] border border-amber-500/40 rounded-2xl shadow-2xl p-6 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto animate-pulse">
              <Pause size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">GAMEPLAY PAUSED</h2>
              <p className="text-xs text-gray-400 mt-1">
                Unity 3D Physics & Controller Simulation Is Paused
              </p>
            </div>

            {/* Controls Overview Card */}
            <div className="bg-[#12141a] border border-[#2d313c] rounded-xl p-3 text-left space-y-1.5 text-xs text-gray-300">
              <div className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider mb-1">
                Gameplay Controls
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#1f232d]">
                <span className="text-gray-400">Move Forward / Back / Strafe</span>
                <span className="font-mono text-cyan-300 font-bold">W A S D / Arrows</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#1f232d]">
                <span className="text-gray-400">Sprint Speed Boost</span>
                <span className="font-mono text-cyan-300 font-bold">Shift</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#1f232d]">
                <span className="text-gray-400">Jump / Ascend (Drone)</span>
                <span className="font-mono text-cyan-300 font-bold">Space</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-gray-400">FPS / Drone Look</span>
                <span className="font-mono text-cyan-300 font-bold">Mouse Pointer Lock</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onTogglePause}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-lg transition-all"
              >
                <Play size={15} fill="currentColor" />
                <span>Resume Gameplay</span>
              </button>
              <button
                onClick={onStopPlay}
                className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all"
              >
                <Square size={13} fill="currentColor" />
                <span>Exit Play</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Reticle / Crosshair for FPV / Aiming */}
      {!isPlayPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-md ring-2 ring-emerald-900/60" />
            <div className="absolute w-4 h-0.5 bg-emerald-400/50" />
            <div className="absolute h-4 w-0.5 bg-emerald-400/50" />
          </div>
        </div>
      )}

      {/* Mobile Virtual Touch Controls */}
      <div className="pointer-events-auto flex items-end justify-between sm:hidden pb-4 mt-auto">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1 bg-[#181a20]/80 p-2 rounded-xl border border-gray-700/50 backdrop-blur">
          <div />
          <button
            onPointerDown={() => onVirtualKeyPress?.('KeyW', true)}
            onPointerUp={() => onVirtualKeyPress?.('KeyW', false)}
            className="w-11 h-11 bg-gray-800 active:bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold"
          >
            <ArrowUp size={18} />
          </button>
          <div />
          <button
            onPointerDown={() => onVirtualKeyPress?.('KeyA', true)}
            onPointerUp={() => onVirtualKeyPress?.('KeyA', false)}
            className="w-11 h-11 bg-gray-800 active:bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold"
          >
            <ArrowLeft size={18} />
          </button>
          <div />
          <button
            onPointerDown={() => onVirtualKeyPress?.('KeyD', true)}
            onPointerUp={() => onVirtualKeyPress?.('KeyD', false)}
            className="w-11 h-11 bg-gray-800 active:bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold"
          >
            <ArrowRight size={18} />
          </button>
          <div />
          <button
            onPointerDown={() => onVirtualKeyPress?.('KeyS', true)}
            onPointerUp={() => onVirtualKeyPress?.('KeyS', false)}
            className="w-11 h-11 bg-gray-800 active:bg-cyan-600 rounded-lg flex items-center justify-center text-white font-bold"
          >
            <ArrowDown size={18} />
          </button>
          <div />
        </div>

        {/* Jump Button */}
        <button
          onPointerDown={() => onVirtualKeyPress?.('Space', true)}
          onPointerUp={() => onVirtualKeyPress?.('Space', false)}
          className="w-16 h-16 rounded-full bg-emerald-600 active:bg-emerald-500 border-2 border-emerald-400 text-white font-bold text-xs shadow-xl flex items-center justify-center"
        >
          JUMP
        </button>
      </div>
    </div>
  );
};
