import React, { useRef } from 'react';
import {
  Sun,
  CloudSun,
  Wind,
  Upload,
  RotateCw,
  Sparkles,
  Sliders,
  Palette,
  Image as ImageIcon,
  Check,
  Eye,
  EyeOff,
  Compass
} from 'lucide-react';
import { EnvironmentSettings, SkyConfig, FogConfig, SkyType, FogType } from '../types/editor';
import { ENVIRONMENT_PRESETS } from '../utils/environmentPresets';

interface EnvironmentInspectorProps {
  environment: EnvironmentSettings;
  onUpdateSky: (updates: Partial<SkyConfig>) => void;
  onUpdateFog: (updates: Partial<FogConfig>) => void;
  onApplyPreset: (presetId: string) => void;
  onUploadHDRI: (file: File) => void;
}

export const EnvironmentInspector: React.FC<EnvironmentInspectorProps> = ({
  environment,
  onUpdateSky,
  onUpdateFog,
  onApplyPreset,
  onUploadHDRI
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sky = environment.sky;
  const fog = environment.fog;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadHDRI(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadHDRI(file);
    }
  };

  return (
    <div
      id="environment-inspector-panel"
      className="flex flex-col h-full bg-[#181a20] text-gray-200 text-xs overflow-y-auto select-none p-3 space-y-4"
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-[#282b33]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
            <CloudSun size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">Sky & Atmosphere</h3>
            <p className="text-[10px] text-gray-400">HDRI, EXR, Sun lighting & Volumetric Fog</p>
          </div>
        </div>
      </div>

      {/* Preset Environments */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" /> Environment Presets
        </label>
        <div className="grid grid-cols-2 gap-2 w-full">
          {ENVIRONMENT_PRESETS.map((preset) => {
            const isSelected = sky.presetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset.id)}
                title={`${preset.name} (${preset.category})`}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between w-full min-w-0 overflow-hidden min-h-[52px] ${
                  isSelected
                    ? 'bg-[#1f293d] border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/40'
                    : 'bg-[#14161d] border-[#282d38] hover:bg-[#1a1d26] text-gray-300'
                }`}
              >
                <div className="flex items-start justify-between w-full min-w-0 gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm mt-0.5"
                      style={{ backgroundColor: preset.thumbnailColor }}
                    />
                    <span className="text-[11px] font-medium leading-tight line-clamp-2 break-words min-w-0 flex-1">{preset.name}</span>
                  </div>
                  {isSelected && <Check size={12} className="text-cyan-400 shrink-0 mt-0.5" />}
                </div>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-1">{preset.category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sky Mode Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Sky Mode
        </label>
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#12141a] rounded-lg border border-[#282d38]">
          {[
            { id: 'procedural', label: 'Sun Sky' },
            { id: 'hdri', label: 'HDRI/EXR' },
            { id: 'color', label: 'Color' },
            { id: 'gradient', label: 'Gradient' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onUpdateSky({ type: mode.id as SkyType, presetId: undefined })}
              className={`py-1.5 text-[10px] font-medium rounded transition-all text-center ${
                sky.type === mode.id
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* HDRI / EXR File Upload Section */}
      {sky.type === 'hdri' && (
        <div className="space-y-2 bg-[#14161d] p-3 rounded-lg border border-[#282d38]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
              <Upload size={13} className="text-cyan-400" /> Custom HDRI / EXR Map
            </span>
            {sky.hdriFormat && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 font-bold">
                {sky.hdriFormat}
              </span>
            )}
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#2f3542] hover:border-cyan-500/60 rounded-lg p-3 text-center cursor-pointer transition-colors bg-[#0f1117] group"
          >
            <ImageIcon size={20} className="mx-auto text-gray-500 group-hover:text-cyan-400 transition-colors mb-1" />
            <p className="text-[11px] text-gray-300 font-medium">
              {sky.hdriName || 'Click or drag .HDR or .EXR file here'}
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5">
              Supports .hdr, .exr, .png, .jpg 360° panoramas
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".hdr,.exr,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Procedural Sky Adjusters */}
      {sky.type === 'procedural' && (
        <div className="space-y-3 bg-[#14161d] p-3 rounded-lg border border-[#282d38]">
          <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
            <Sun size={13} className="text-amber-400" /> Sun & Atmosphere Simulation
          </span>

          {/* Sun Elevation */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Sun Elevation</span>
              <span className="text-white font-mono">{sky.sunElevation ?? 45}°</span>
            </div>
            <input
              type="range"
              min="-10"
              max="90"
              step="1"
              value={sky.sunElevation ?? 45}
              onChange={(e) => onUpdateSky({ sunElevation: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
            />
          </div>

          {/* Sun Azimuth */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Sun Azimuth (Compass)</span>
              <span className="text-white font-mono">{sky.sunAzimuth ?? 180}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={sky.sunAzimuth ?? 180}
              onChange={(e) => onUpdateSky({ sunAzimuth: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
            />
          </div>

          {/* Turbidity (Atmospheric Haze) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Turbidity (Haze/Pollution)</span>
              <span className="text-white font-mono">{sky.turbidity ?? 8}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={sky.turbidity ?? 8}
              onChange={(e) => onUpdateSky({ turbidity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
            />
          </div>

          {/* Rayleigh (Sky scattering) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Rayleigh Scattering</span>
              <span className="text-white font-mono">{sky.rayleigh ?? 2}</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="0.1"
              value={sky.rayleigh ?? 2}
              onChange={(e) => onUpdateSky({ rayleigh: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Color Mode Pickers */}
      {(sky.type === 'color' || sky.type === 'gradient') && (
        <div className="space-y-2 bg-[#14161d] p-3 rounded-lg border border-[#282d38]">
          <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
            <Palette size={13} className="text-pink-400" /> Sky Colors
          </span>

          {sky.type === 'color' ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sky.color || '#13151b'}
                onChange={(e) => onUpdateSky({ color: e.target.value })}
                className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={sky.color || '#13151b'}
                onChange={(e) => onUpdateSky({ color: e.target.value })}
                className="flex-1 bg-[#0f1117] border border-[#282d38] rounded px-2 py-1 text-xs text-white font-mono uppercase"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-400">Zenith (Top)</span>
                <input
                  type="color"
                  value={sky.topColor || '#1e293b'}
                  onChange={(e) => onUpdateSky({ topColor: e.target.value })}
                  className="w-7 h-7 rounded border border-gray-700 bg-transparent cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-400">Horizon (Bottom)</span>
                <input
                  type="color"
                  value={sky.bottomColor || '#0a0d14'}
                  onChange={(e) => onUpdateSky({ bottomColor: e.target.value })}
                  className="w-7 h-7 rounded border border-gray-700 bg-transparent cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Universal Sky & Lighting Adjusters */}
      <div className="space-y-3 bg-[#14161d] p-3 rounded-lg border border-[#282d38]">
        <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
          <Sliders size={13} className="text-cyan-400" /> Lighting & Rendering Adjusters
        </span>

        {/* Environment Light (IBL) Intensity */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Environment Light (IBL)</span>
            <span className="text-white font-mono">{sky.environmentIntensity?.toFixed(2) ?? '1.00'}x</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={sky.environmentIntensity ?? 1.0}
            onChange={(e) => onUpdateSky({ environmentIntensity: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
          />
        </div>

        {/* Background Visual Intensity */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Background Visual Brightness</span>
            <span className="text-white font-mono">{sky.backgroundIntensity?.toFixed(2) ?? '1.00'}x</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={sky.backgroundIntensity ?? 1.0}
            onChange={(e) => onUpdateSky({ backgroundIntensity: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
          />
        </div>

        {/* Background Blur */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Background Blur (Depth of Field)</span>
            <span className="text-white font-mono">{Math.round((sky.backgroundBlurriness ?? 0) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={sky.backgroundBlurriness ?? 0}
            onChange={(e) => onUpdateSky({ backgroundBlurriness: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
          />
        </div>

        {/* Sky Rotation */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Sky Rotation (Y-Axis)</span>
            <span className="text-white font-mono">{sky.rotation ?? 0}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={sky.rotation ?? 0}
            onChange={(e) => onUpdateSky({ rotation: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
          />
        </div>

        {/* Camera Exposure */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Exposure</span>
            <span className="text-white font-mono">{sky.exposure?.toFixed(2) ?? '1.00'}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.05"
            value={sky.exposure ?? 1.0}
            onChange={(e) => onUpdateSky({ exposure: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 h-1 bg-gray-700 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Atmospheric Fog Section */}
      <div className="space-y-3 bg-[#14161d] p-3 rounded-lg border border-[#282d38]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
            <Wind size={13} className="text-teal-400" /> Atmospheric Fog Adjuster
          </span>
          <button
            onClick={() => onUpdateFog({ type: fog.type === 'none' ? 'exp2' : 'none' })}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
              fog.type !== 'none'
                ? 'bg-teal-950 text-teal-300 border border-teal-800/40'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {fog.type !== 'none' ? <Eye size={10} /> : <EyeOff size={10} />}
            {fog.type !== 'none' ? 'Active' : 'Disabled'}
          </button>
        </div>

        {fog.type !== 'none' && (
          <div className="space-y-3 pt-1">
            {/* Fog Type selection */}
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#101217] rounded border border-[#282d38]">
              <button
                onClick={() => onUpdateFog({ type: 'exp2' })}
                className={`py-1 text-[10px] font-medium rounded transition-all ${
                  fog.type === 'exp2'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Exponential (Smooth)
              </button>
              <button
                onClick={() => onUpdateFog({ type: 'linear' })}
                className={`py-1 text-[10px] font-medium rounded transition-all ${
                  fog.type === 'linear'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Linear (Range)
              </button>
            </div>

            {/* Fog Color Picker */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fog.color || '#13151b'}
                onChange={(e) => onUpdateFog({ color: e.target.value })}
                className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
              />
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 mb-0.5">Fog Color</div>
                <input
                  type="text"
                  value={fog.color || '#13151b'}
                  onChange={(e) => onUpdateFog({ color: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#282d38] rounded px-2 py-1 text-xs text-white font-mono uppercase"
                />
              </div>
            </div>

            {/* Fog Density or Near/Far */}
            {fog.type === 'exp2' ? (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Fog Density</span>
                  <span className="text-white font-mono">{fog.density.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.08"
                  step="0.001"
                  value={fog.density}
                  onChange={(e) => onUpdateFog({ density: parseFloat(e.target.value) })}
                  className="w-full accent-teal-500 h-1 bg-gray-700 rounded cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Near Distance</span>
                    <span className="text-white font-mono">{fog.near}m</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={fog.near}
                    onChange={(e) => onUpdateFog({ near: parseFloat(e.target.value) })}
                    className="w-full accent-teal-500 h-1 bg-gray-700 rounded cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Far Distance</span>
                    <span className="text-white font-mono">{fog.far}m</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={fog.far}
                    onChange={(e) => onUpdateFog({ far: parseFloat(e.target.value) })}
                    className="w-full accent-teal-500 h-1 bg-gray-700 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
