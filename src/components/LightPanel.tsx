import React from 'react';
import { Sun } from 'lucide-react';
import { LightData } from '../types/editor';

interface LightPanelProps {
  light: LightData;
  onUpdateLight: (updates: Partial<LightData>) => void;
}

export const LightPanel: React.FC<LightPanelProps> = ({ light, onUpdateLight }) => {
  return (
    <div className="p-3 border-b border-[#282b33] space-y-3">
      <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Sun size={13} className="text-yellow-400" /> Light Source
        </span>
        <span className="text-[10px] text-yellow-400 font-mono capitalize">
          {light.type}Light
        </span>
      </div>

      {/* Color */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Color</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={light.color}
            onChange={(e) => onUpdateLight({ color: e.target.value })}
            className="w-7 h-7 rounded border border-[#2d313b] cursor-pointer bg-transparent"
          />
          <span className="font-mono text-[11px] text-gray-300">{light.color.toUpperCase()}</span>
        </div>
      </div>

      {/* Intensity */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-400">Intensity</span>
          <span className="text-gray-300 font-mono">{light.intensity.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={light.intensity}
          onChange={(e) => onUpdateLight({ intensity: parseFloat(e.target.value) })}
          className="w-full accent-cyan-500 cursor-pointer"
        />
      </div>

      {/* Cast Shadow */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Cast Shadow</span>
        <input
          type="checkbox"
          checked={light.castShadow}
          onChange={(e) => onUpdateLight({ castShadow: e.target.checked })}
          className="rounded border-gray-700 bg-gray-800 text-cyan-500 cursor-pointer"
        />
      </div>

      {/* Distance for point and spot lights */}
      {(light.type === 'point' || light.type === 'spot') && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Range Distance</span>
            <span className="text-gray-300 font-mono">{light.distance ?? 20}</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={light.distance ?? 20}
            onChange={(e) => onUpdateLight({ distance: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
