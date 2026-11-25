import React from 'react';
import { Sliders } from 'lucide-react';
import { Vec3 } from '../types/editor';

interface TransformPanelProps {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  onUpdateTransform: (pos?: Vec3, rot?: Vec3, scale?: Vec3) => void;
}

export const TransformPanel: React.FC<TransformPanelProps> = ({
  position,
  rotation,
  scale,
  onUpdateTransform
}) => {
  const handleVecChange = (
    type: 'pos' | 'rot' | 'scale',
    axis: 'x' | 'y' | 'z',
    val: string
  ) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;

    if (type === 'pos') {
      onUpdateTransform({ ...position, [axis]: num }, undefined, undefined);
    } else if (type === 'rot') {
      onUpdateTransform(undefined, { ...rotation, [axis]: num }, undefined);
    } else if (type === 'scale') {
      onUpdateTransform(undefined, undefined, { ...scale, [axis]: num });
    }
  };

  return (
    <div className="p-3 border-b border-[#282b33] space-y-3">
      <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Sliders size={13} className="text-cyan-400" /> Transform
        </span>
        <button
          onClick={() =>
            onUpdateTransform(
              { x: 0, y: 0.5, z: 0 },
              { x: 0, y: 0, z: 0 },
              { x: 1, y: 1, z: 1 }
            )
          }
          className="text-[10px] text-gray-500 hover:text-gray-300"
          title="Reset Transform"
        >
          Reset
        </button>
      </div>

      {/* Position */}
      <div className="space-y-1">
        <span className="text-[11px] text-gray-400">Position</span>
        <div className="grid grid-cols-3 gap-1.5">
          {(['x', 'y', 'z'] as const).map((axis) => {
            const val = position[axis];
            const color =
              axis === 'x' ? 'text-red-400' : axis === 'y' ? 'text-emerald-400' : 'text-blue-400';
            return (
              <div
                key={axis}
                className="flex items-center bg-[#101216] border border-[#2d313b] rounded overflow-hidden"
              >
                <span className={`px-1.5 text-[10px] font-bold ${color} uppercase select-none`}>
                  {axis}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={Number(val.toFixed(3))}
                  onChange={(e) => handleVecChange('pos', axis, e.target.value)}
                  className="w-full bg-transparent px-1 py-1 text-xs text-white focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <span className="text-[11px] text-gray-400">Rotation (Deg)</span>
        <div className="grid grid-cols-3 gap-1.5">
          {(['x', 'y', 'z'] as const).map((axis) => {
            const val = rotation[axis];
            const color =
              axis === 'x' ? 'text-red-400' : axis === 'y' ? 'text-emerald-400' : 'text-blue-400';
            return (
              <div
                key={axis}
                className="flex items-center bg-[#101216] border border-[#2d313b] rounded overflow-hidden"
              >
                <span className={`px-1.5 text-[10px] font-bold ${color} uppercase select-none`}>
                  {axis}
                </span>
                <input
                  type="number"
                  step="5"
                  value={Number(val.toFixed(2))}
                  onChange={(e) => handleVecChange('rot', axis, e.target.value)}
                  className="w-full bg-transparent px-1 py-1 text-xs text-white focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Scale */}
      <div className="space-y-1">
        <span className="text-[11px] text-gray-400">Scale</span>
        <div className="grid grid-cols-3 gap-1.5">
          {(['x', 'y', 'z'] as const).map((axis) => {
            const val = scale[axis];
            const color =
              axis === 'x' ? 'text-red-400' : axis === 'y' ? 'text-emerald-400' : 'text-blue-400';
            return (
              <div
                key={axis}
                className="flex items-center bg-[#101216] border border-[#2d313b] rounded overflow-hidden"
              >
                <span className={`px-1.5 text-[10px] font-bold ${color} uppercase select-none`}>
                  {axis}
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0.001"
                  value={Number(val.toFixed(3))}
                  onChange={(e) => handleVecChange('scale', axis, e.target.value)}
                  className="w-full bg-transparent px-1 py-1 text-xs text-white focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
