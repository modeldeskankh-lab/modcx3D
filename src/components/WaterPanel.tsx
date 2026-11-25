import React, { useState } from 'react';
import {
  Waves,
  Compass,
  Droplets,
  Sparkles,
  Layers,
  Eye,
  Sliders,
  Sun,
  Activity,
  Maximize2,
  Minimize2,
  RefreshCw,
  Anchor,
  Wind
} from 'lucide-react';
import { WaterConfig, WaterPreset, WaterType, SceneObjectData } from '../types/editor';
import { WATER_PRESETS } from '../three/WaterSystem';

interface WaterPanelProps {
  waterConfig?: WaterConfig;
  selectedObject?: SceneObjectData | null;
  onUpdateWater?: (updates: Partial<WaterConfig>) => void;
  onApplyPreset?: (preset: WaterPreset) => void;
}

export const WaterPanel: React.FC<WaterPanelProps> = ({
  waterConfig,
  selectedObject,
  onUpdateWater = () => {},
  onApplyPreset
}) => {
  const [activeSection, setActiveSection] = useState<'waves' | 'flow' | 'color' | 'foam' | 'geometry'>('waves');

  if (!waterConfig) {
    return (
      <div className="p-4 text-center text-gray-400">
        <Waves className="mx-auto mb-2 text-cyan-400 opacity-60" size={28} />
        <p className="text-xs font-semibold text-gray-300">No Water Object Selected</p>
        <p className="text-[11px] text-gray-500 mt-1">
          Select an Ocean, River, or Lake object from the hierarchy or add one via GameObject &gt; Water.
        </p>
      </div>
    );
  }

  const handlePresetSelect = (preset: WaterPreset) => {
    if (onApplyPreset) {
      onApplyPreset(preset);
    } else {
      const presetData = WATER_PRESETS[preset];
      if (presetData) {
        onUpdateWater?.(presetData);
      }
    }
  };

  const PRESETS_LIST: { id: WaterPreset; label: string; type: WaterType; desc: string }[] = [
    { id: 'ocean_calm', label: 'Calm Ocean', type: 'ocean', desc: 'Serene blue swells with sun glints' },
    { id: 'ocean_tropical', label: 'Tropical Lagoon', type: 'ocean', desc: 'Crystal turquoise shallow water' },
    { id: 'ocean_stormy', label: 'Stormy Sea', type: 'ocean', desc: 'High cresting waves with frothy foam' },
    { id: 'ocean_abyss', label: 'Deep Abyss', type: 'ocean', desc: 'Dark abyssal midnight ocean' },
    { id: 'river_rapid', label: 'Rapid River', type: 'river', desc: 'Fast rushing mountain flow & rapids' },
    { id: 'river_gentle', label: 'Gentle Stream', type: 'river', desc: 'Slow winding emerald brook' },
    { id: 'lake_clear', label: 'Alpine Lake', type: 'lake', desc: 'Calm, highly reflective mirror water' },
    { id: 'lake_swamp', label: 'Murky Swamp', type: 'lake', desc: 'Dense olive bayou with low clarity' }
  ];

  const SWATCH_COLORS = [
    '#22d3ee', '#06b6d4', '#0284c7', '#0369a1', '#0c4a6e', '#0f172a',
    '#2dd4bf', '#10b981', '#059669', '#65a30d', '#ca8a04', '#ffffff'
  ];

  return (
    <div className="space-y-4 text-xs select-none">
      {/* 1. WATER COMPONENT HEADER & TYPE SELECTOR */}
      <div className="bg-[#15171d] p-3 rounded-lg border border-[#232730] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Waves size={16} />
            </div>
            <div>
              <span className="font-bold text-gray-200 text-[13px] flex items-center gap-1.5">
                Water System
                <span className="text-[10px] font-normal uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {waterConfig.waterType}
                </span>
              </span>
              <p className="text-[10px] text-gray-500">Unity-style Gerstner Wave & Flow Simulator</p>
            </div>
          </div>
        </div>

        {/* Water Type Tabs (Ocean | River | Lake) */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#101216] rounded-md border border-[#2d313b]">
          <button
            onClick={() => {
              onUpdateWater({
                waterType: 'ocean',
                ...WATER_PRESETS.ocean_calm
              });
            }}
            className={`py-1.5 rounded font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
              waterConfig.waterType === 'ocean'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
            }`}
          >
            <Waves size={13} /> Ocean / Sea
          </button>
          <button
            onClick={() => {
              onUpdateWater({
                waterType: 'river',
                ...WATER_PRESETS.river_rapid
              });
            }}
            className={`py-1.5 rounded font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
              waterConfig.waterType === 'river'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
            }`}
          >
            <Wind size={13} /> River Flow
          </button>
          <button
            onClick={() => {
              onUpdateWater({
                waterType: 'lake',
                ...WATER_PRESETS.lake_clear
              });
            }}
            className={`py-1.5 rounded font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
              waterConfig.waterType === 'lake'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
            }`}
          >
            <Droplets size={13} /> Calm Lake
          </button>
        </div>

        {/* Presets Grid */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-semibold text-gray-400 flex items-center justify-between">
            <span>Simulation Presets</span>
            <span className="text-[9px] text-cyan-400">{waterConfig.preset}</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
            {PRESETS_LIST.map((p) => {
              const isSelected = waterConfig.preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`p-1.5 text-left rounded border transition-all ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-semibold'
                      : 'bg-[#181b22] border-[#282b33] text-gray-300 hover:bg-[#20242e] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span>{p.label}</span>
                    <span className="text-[9px] opacity-60 uppercase">{p.type}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 truncate mt-0.5">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. SUB-SECTION TABS (Waves | River Flow | Color & Optics | Foam | Mesh) */}
      <div className="flex items-center gap-1 bg-[#15171d] p-1 rounded-md border border-[#232730]">
        <button
          onClick={() => setActiveSection('waves')}
          className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-center transition-all ${
            activeSection === 'waves'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
          }`}
        >
          Waves
        </button>
        <button
          onClick={() => setActiveSection('flow')}
          className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-center transition-all ${
            activeSection === 'flow'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
          }`}
        >
          River Flow
        </button>
        <button
          onClick={() => setActiveSection('color')}
          className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-center transition-all ${
            activeSection === 'color'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
          }`}
        >
          Optics
        </button>
        <button
          onClick={() => setActiveSection('foam')}
          className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-center transition-all ${
            activeSection === 'foam'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
          }`}
        >
          Foam
        </button>
        <button
          onClick={() => setActiveSection('geometry')}
          className={`flex-1 py-1 px-1.5 rounded text-[11px] font-medium text-center transition-all ${
            activeSection === 'geometry'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
          }`}
        >
          Mesh
        </button>
      </div>

      {/* 3. SECTION CONTENT */}
      <div className="bg-[#15171d] p-3 rounded-lg border border-[#232730] space-y-3.5">
        {/* --- SECTION: GERSTNER WAVES SIMULATION --- */}
        {activeSection === 'waves' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300 border-b border-[#232730] pb-1.5">
              <span className="flex items-center gap-1.5">
                <Waves size={14} className="text-cyan-400" /> Gerstner Wave Simulation
              </span>
              <span className="text-[10px] text-cyan-400 font-normal">4 Harmonic Octaves</span>
            </div>

            {/* Wave Height / Amplitude */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Wave Amplitude (Height)</span>
                <span className="font-mono text-cyan-400">{waterConfig.waveHeight.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.02"
                value={waterConfig.waveHeight}
                onChange={(e) => onUpdateWater({ waveHeight: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Wave Speed */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Wave Speed</span>
                <span className="font-mono text-cyan-400">{waterConfig.waveSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="4.0"
                step="0.05"
                value={waterConfig.waveSpeed}
                onChange={(e) => onUpdateWater({ waveSpeed: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Wave Frequency / Wavelength */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Spatial Frequency</span>
                <span className="font-mono text-cyan-400">{waterConfig.waveFrequency.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.05"
                value={waterConfig.waveFrequency}
                onChange={(e) => onUpdateWater({ waveFrequency: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Wave Choppiness / Steepness */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Choppiness (Crest Steepness)</span>
                <span className="font-mono text-cyan-400">{waterConfig.waveChoppiness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={waterConfig.waveChoppiness}
                onChange={(e) => onUpdateWater({ waveChoppiness: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Wave Octave Detail */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Micro Ripples & Secondary Detail</span>
                <span className="font-mono text-cyan-400">{Math.round(waterConfig.waveDetail * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={waterConfig.waveDetail}
                onChange={(e) => onUpdateWater({ waveDetail: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* --- SECTION: RIVER FLOW DYNAMICS --- */}
        {activeSection === 'flow' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300 border-b border-[#232730] pb-1.5">
              <span className="flex items-center gap-1.5">
                <Compass size={14} className="text-cyan-400" /> River Flow & Directional Vector
              </span>
              <span className="text-[10px] text-cyan-400 font-normal">{waterConfig.flowSpeed > 0 ? 'Active Flow' : 'Static'}</span>
            </div>

            {/* Flow Speed */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Flow Velocity (Speed)</span>
                <span className="font-mono text-cyan-400">{waterConfig.flowSpeed.toFixed(1)} m/s</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="6.0"
                step="0.1"
                value={waterConfig.flowSpeed}
                onChange={(e) => onUpdateWater({ flowSpeed: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Flow Direction (Angle in degrees + Quick cardinal buttons) */}
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Compass size={13} className="text-cyan-400" />
                  Flow Angle
                </span>
                <span className="font-mono text-cyan-400">{Math.round(waterConfig.flowDirection)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={waterConfig.flowDirection}
                onChange={(e) => onUpdateWater({ flowDirection: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />

              {/* Quick Flow Directions */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                <button
                  onClick={() => onUpdateWater({ flowDirection: 0 })}
                  className={`py-1 rounded border ${
                    waterConfig.flowDirection === 0
                      ? 'bg-cyan-900 border-cyan-500 text-cyan-300'
                      : 'bg-[#181b22] border-[#2d313b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  East (0°)
                </button>
                <button
                  onClick={() => onUpdateWater({ flowDirection: 90 })}
                  className={`py-1 rounded border ${
                    waterConfig.flowDirection === 90
                      ? 'bg-cyan-900 border-cyan-500 text-cyan-300'
                      : 'bg-[#181b22] border-[#2d313b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  North (90°)
                </button>
                <button
                  onClick={() => onUpdateWater({ flowDirection: 180 })}
                  className={`py-1 rounded border ${
                    waterConfig.flowDirection === 180
                      ? 'bg-cyan-900 border-cyan-500 text-cyan-300'
                      : 'bg-[#181b22] border-[#2d313b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  West (180°)
                </button>
                <button
                  onClick={() => onUpdateWater({ flowDirection: 270 })}
                  className={`py-1 rounded border ${
                    waterConfig.flowDirection === 270
                      ? 'bg-cyan-900 border-cyan-500 text-cyan-300'
                      : 'bg-[#181b22] border-[#2d313b] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  South (270°)
                </button>
              </div>
            </div>

            {/* Flow Turbulence */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Flow Turbulence / Rapids</span>
                <span className="font-mono text-cyan-400">{waterConfig.flowTurbulence.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={waterConfig.flowTurbulence}
                onChange={(e) => onUpdateWater({ flowTurbulence: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* --- SECTION: COLOR, DEPTH & OPTICS --- */}
        {activeSection === 'color' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300 border-b border-[#232730] pb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-400" /> Color Gradient & Optical Depth
              </span>
            </div>

            {/* Shallow & Deep Colors */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#101216] p-2 rounded border border-[#2d313b] space-y-1.5">
                <span className="text-[10px] text-gray-400 font-medium block">Shallow / Surface</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={waterConfig.shallowColor}
                    onChange={(e) => onUpdateWater({ shallowColor: e.target.value })}
                    className="w-7 h-7 rounded border border-[#3b414f] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={waterConfig.shallowColor}
                    onChange={(e) => onUpdateWater({ shallowColor: e.target.value })}
                    className="w-full bg-[#181b22] px-1.5 py-0.5 rounded font-mono text-[10px] text-white border border-[#2d313b]"
                  />
                </div>
              </div>

              <div className="bg-[#101216] p-2 rounded border border-[#2d313b] space-y-1.5">
                <span className="text-[10px] text-gray-400 font-medium block">Deep Ocean Tint</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={waterConfig.deepColor}
                    onChange={(e) => onUpdateWater({ deepColor: e.target.value })}
                    className="w-7 h-7 rounded border border-[#3b414f] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={waterConfig.deepColor}
                    onChange={(e) => onUpdateWater({ deepColor: e.target.value })}
                    className="w-full bg-[#181b22] px-1.5 py-0.5 rounded font-mono text-[10px] text-white border border-[#2d313b]"
                  />
                </div>
              </div>
            </div>

            {/* Color Palette Quick Swatches */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-gray-500 block">Water Palette Swatches</span>
              <div className="flex flex-wrap gap-1.5">
                {SWATCH_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateWater({ shallowColor: c })}
                    className="w-4 h-4 rounded-full border border-white/20 hover:scale-125 transition-all"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Water Clarity */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-gray-300">
                <span>Water Clarity / Transparency</span>
                <span className="font-mono text-cyan-400">{Math.round(waterConfig.clarity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={waterConfig.clarity}
                onChange={(e) => onUpdateWater({ clarity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Surface Opacity</span>
                <span className="font-mono text-cyan-400">{Math.round(waterConfig.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.02"
                value={waterConfig.opacity}
                onChange={(e) => onUpdateWater({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Sun Specular Glints */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span className="flex items-center gap-1">
                  <Sun size={12} className="text-amber-400" />
                  Sun Specular Glint
                </span>
                <span className="font-mono text-cyan-400">{waterConfig.sunSpecular.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={waterConfig.sunSpecular}
                onChange={(e) => onUpdateWater({ sunSpecular: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Fresnel Power */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Fresnel View Angle Reflection</span>
                <span className="font-mono text-cyan-400">{waterConfig.fresnelPower.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={waterConfig.fresnelPower}
                onChange={(e) => onUpdateWater({ fresnelPower: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* --- SECTION: FOAM & SHORELINE --- */}
        {activeSection === 'foam' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300 border-b border-[#232730] pb-1.5">
              <span className="flex items-center gap-1.5">
                <Droplets size={14} className="text-cyan-400" /> Crest Foam & Shorelines
              </span>
            </div>

            {/* Foam Color */}
            <div className="bg-[#101216] p-2 rounded border border-[#2d313b] flex items-center justify-between">
              <span className="text-gray-300 font-medium">Foam Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={waterConfig.foamColor}
                  onChange={(e) => onUpdateWater({ foamColor: e.target.value })}
                  className="w-7 h-7 rounded border border-[#3b414f] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={waterConfig.foamColor}
                  onChange={(e) => onUpdateWater({ foamColor: e.target.value })}
                  className="w-20 bg-[#181b22] px-1.5 py-0.5 rounded font-mono text-[10px] text-white border border-[#2d313b] text-center"
                />
              </div>
            </div>

            {/* Foam Intensity */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Foam Intensity</span>
                <span className="font-mono text-cyan-400">{Math.round(waterConfig.foamIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={waterConfig.foamIntensity}
                onChange={(e) => onUpdateWater({ foamIntensity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Wave Crest Foam Threshold */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Crest Foam Trigger Threshold</span>
                <span className="font-mono text-cyan-400">{waterConfig.foamThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.02"
                value={waterConfig.foamThreshold}
                onChange={(e) => onUpdateWater({ foamThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>

            {/* Foam Noise Scale */}
            <div className="space-y-1">
              <div className="flex justify-between text-gray-300">
                <span>Foam Texture Scale / Density</span>
                <span className="font-mono text-cyan-400">{waterConfig.foamScale.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={waterConfig.foamScale}
                onChange={(e) => onUpdateWater({ foamScale: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* --- SECTION: GEOMETRY & MESH QUALITY --- */}
        {activeSection === 'geometry' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300 border-b border-[#232730] pb-1.5">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-400" /> Surface Dimensions & Mesh Grid
              </span>
            </div>

            {/* Dimensions (Width & Length) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span>Width (X)</span>
                  <span className="font-mono text-cyan-400">{waterConfig.width}m</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={waterConfig.width}
                  onChange={(e) => onUpdateWater({ width: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span>Length (Z)</span>
                  <span className="font-mono text-cyan-400">{waterConfig.length}m</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={waterConfig.length}
                  onChange={(e) => onUpdateWater({ length: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-500 h-1.5 bg-[#101216] rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Subdivisions Tessellation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-gray-300">
                <span>Tessellation Subdivisions</span>
                <span className="font-mono text-cyan-400">{waterConfig.subdivisions}x{waterConfig.subdivisions}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[32, 64, 96, 128].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => onUpdateWater({ subdivisions: sub })}
                    className={`py-1 rounded text-[10px] border ${
                      waterConfig.subdivisions === sub
                        ? 'bg-cyan-900 border-cyan-500 text-cyan-300 font-semibold'
                        : 'bg-[#181b22] border-[#2d313b] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {sub}x{sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Wireframe toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#232730]">
              <span className="text-gray-300">Show Tessellation Wireframe</span>
              <button
                onClick={() => onUpdateWater({ wireframe: !waterConfig.wireframe })}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  waterConfig.wireframe ? 'bg-cyan-600' : 'bg-[#282c35]'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    waterConfig.wireframe ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. QUICK ACTIONS & WATER LEVEL TOOLS */}
      <div className="bg-[#15171d] p-3 rounded-lg border border-[#232730] space-y-2">
        <div className="text-[10px] uppercase font-semibold text-gray-400">Quick Water Level Adjustments</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (selectedObject) {
                // Elevate water level by +0.5m
                const currentY = selectedObject.position.y;
                (window as any).__MODCX_EDITOR_ENGINE__?.updateSelectedTransform({
                  position: { ...selectedObject.position, y: currentY + 0.5 }
                });
              }
            }}
            className="px-2 py-1.5 rounded bg-[#181b22] hover:bg-[#222733] border border-[#2d313b] text-gray-200 text-[11px] flex items-center justify-center gap-1.5"
          >
            <Maximize2 size={12} className="text-cyan-400" /> Raise Water (+0.5m)
          </button>

          <button
            onClick={() => {
              if (selectedObject) {
                // Lower water level by -0.5m
                const currentY = selectedObject.position.y;
                (window as any).__MODCX_EDITOR_ENGINE__?.updateSelectedTransform({
                  position: { ...selectedObject.position, y: currentY - 0.5 }
                });
              }
            }}
            className="px-2 py-1.5 rounded bg-[#181b22] hover:bg-[#222733] border border-[#2d313b] text-gray-200 text-[11px] flex items-center justify-center gap-1.5"
          >
            <Minimize2 size={12} className="text-amber-400" /> Lower Water (-0.5m)
          </button>
        </div>
      </div>
    </div>
  );
};
