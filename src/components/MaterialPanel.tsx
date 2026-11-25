import React, { useRef, useState } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Check,
  Upload,
  X,
  Sliders,
  Sun,
  Eye,
  Copy,
  Trash2
} from 'lucide-react';
import { MaterialConfig } from '../types/editor';
import { TEXTURE_PRESETS } from '../utils/proceduralTextures';

interface MaterialPanelProps {
  material: MaterialConfig;
  materials?: MaterialConfig[];
  activeMaterialId?: string;
  onSelectMaterialId?: (id: string) => void;
  onUpdateMaterial: (updates: Partial<MaterialConfig>, targetId?: string) => void;
  onUploadTexture: (file: File) => void;
  onApplyPresetTexture: (presetId: string) => void;
  onDuplicateMaterial?: (materialId: string) => void;
  onApplyToSelected?: (materialId: string) => void;
  showHeader?: boolean;
}

export const MaterialPanel: React.FC<MaterialPanelProps> = ({
  material,
  materials,
  activeMaterialId,
  onSelectMaterialId,
  onUpdateMaterial,
  onUploadTexture,
  onApplyPresetTexture,
  onDuplicateMaterial,
  onApplyToSelected,
  showHeader = true
}) => {
  const [showTexturePresets, setShowTexturePresets] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(material.name || 'Standard Material');
  const [activeUploadSlot, setActiveUploadSlot] = useState<string | null>(null);

  const slotInputRef = useRef<HTMLInputElement>(null);

  const currentId = material.id || material.uuid;
  const isEmissionActive = Boolean((material.emissiveIntensity ?? 0) > 0 || (material.emissive && material.emissive !== '#000000') || material.emissiveMapUrl);
  const smoothness = Math.max(0, Math.min(1, 1 - (material.roughness ?? 0.5)));

  const normalizeHex = (hex?: string) => {
    if (!hex) return '#ffffff';
    let clean = hex.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) return clean;
    if (/^#[0-9A-Fa-f]{3}$/.test(clean)) {
      return '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    return '#ffffff';
  };

  const currentColorHex = normalizeHex(material.color);

  const handleUpdate = (updates: Partial<MaterialConfig>, targetOverrideId?: string) => {
    onUpdateMaterial(updates, targetOverrideId || currentId);
  };

  const handleApplyColorToAllMaterials = (colorToApply: string) => {
    if (materials && materials.length > 0) {
      materials.forEach((m) => {
        const id = m.id || m.uuid;
        if (id) {
          onUpdateMaterial({ color: colorToApply }, id);
        }
      });
    } else {
      handleUpdate({ color: colorToApply });
    }
  };

  const COLOR_SWATCHES = [
    { label: 'White', color: '#ffffff' },
    { label: 'Off-White', color: '#e2e8f0' },
    { label: 'Slate', color: '#64748b' },
    { label: 'Dark Charcoal', color: '#1e293b' },
    { label: 'Crimson', color: '#ef4444' },
    { label: 'Coral', color: '#f97316' },
    { label: 'Amber', color: '#f59e0b' },
    { label: 'Yellow', color: '#eab308' },
    { label: 'Lime Grass', color: '#84cc16' },
    { label: 'Forest Green', color: '#22c55e' },
    { label: 'Teal', color: '#14b8a6' },
    { label: 'Sky Cyan', color: '#06b6d4' },
    { label: 'Royal Blue', color: '#3b82f6' },
    { label: 'Indigo', color: '#6366f1' },
    { label: 'Purple', color: '#a855f7' },
    { label: 'Rose Pink', color: '#ec4899' },
    { label: 'Desert Sand', color: '#d97706' },
    { label: 'Earth Brown', color: '#78350f' }
  ];

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (tempName.trim() && tempName !== material.name) {
      handleUpdate({ name: tempName.trim() });
    }
  };

  const handleSlotUpload = (slot: string) => {
    setActiveUploadSlot(slot);
    if (slotInputRef.current) {
      slotInputRef.current.click();
    }
  };

  const handleSlotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadSlot) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (!url) return;

      switch (activeUploadSlot) {
        case 'albedo':
          handleUpdate({ mapUrl: url, mapName: file.name });
          break;
        case 'normal':
          handleUpdate({ normalMapUrl: url, normalMapName: file.name, normalScale: material.normalScale ?? 1.0 });
          break;
        case 'roughness':
          handleUpdate({ roughnessMapUrl: url, roughnessMapName: file.name });
          break;
        case 'metalness':
          handleUpdate({ metalnessMapUrl: url, metalnessMapName: file.name });
          break;
        case 'alpha':
          handleUpdate({ alphaMapUrl: url, alphaMapName: file.name, transparent: true });
          break;
        case 'emissive':
          handleUpdate({
            emissiveMapUrl: url,
            emissiveMapName: file.name,
            emissiveIntensity: material.emissiveIntensity || 1.0,
            emissive: material.emissive && material.emissive !== '#000000' ? material.emissive : '#ffffff'
          });
          break;
        case 'ao':
          handleUpdate({ aoMapUrl: url, aoMapName: file.name, aoMapIntensity: material.aoMapIntensity ?? 1.0 });
          break;
        default:
          handleUpdate({ mapUrl: url, mapName: file.name });
          break;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="p-3 border-b border-[#282b33] space-y-3.5 text-xs text-gray-300">
      <input
        ref={slotInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleSlotFileChange}
      />
      {/* 1. Header (Unity Style) */}
      {showHeader && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Palette size={13} />
              <span>Material Inspector</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono px-1.5 py-0.5 bg-[#12141a] rounded border border-gray-800">
              Unity PBR
            </span>
          </div>

          {/* Material Name & Source Model Tag */}
          <div className="bg-[#12141a] border border-[#2d313b] rounded-md p-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              {isEditingName ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
                  className="bg-[#1b1f27] border border-cyan-500 text-white px-2 py-0.5 rounded text-xs w-full focus:outline-none"
                />
              ) : (
                <div
                  onClick={() => {
                    setTempName(material.name || 'Standard Material');
                    setIsEditingName(true);
                  }}
                  className="font-medium text-gray-200 text-xs truncate cursor-pointer hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                  title="Click to rename material"
                >
                  <span className="truncate">{material.name || 'Standard Material'}</span>
                  <span className="text-[10px] text-gray-500 font-normal">(rename)</span>
                </div>
              )}

              {onDuplicateMaterial && currentId && (
                <button
                  onClick={() => onDuplicateMaterial(currentId)}
                  className="p-1 hover:bg-[#282c35] text-gray-400 hover:text-white rounded shrink-0"
                  title="Duplicate Material"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span className="text-gray-500">Shader:</span>
              <span className="text-cyan-400 font-mono">Standard (Metallic/Roughness)</span>
            </div>

            {material.sourceModel && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90 pt-0.5">
                <span className="text-gray-500">From Model:</span>
                <span className="truncate bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded font-mono">
                  {material.sourceModel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Unity Multi-Material Element Selector (If object has multiple materials) */}
      {materials && materials.length > 1 && onSelectMaterialId && (
        <div className="space-y-1.5 bg-[#12141a] p-2 rounded-md border border-[#2d313b]">
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
            <span className="flex items-center gap-1">
              <Layers size={12} className="text-cyan-400" />
              <span>Model Materials ({materials.length})</span>
            </span>
            <span className="text-[10px] text-gray-500">Click to edit</span>
          </div>

          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
            {materials.map((mat, index) => {
              const matId = mat.id || mat.uuid;
              const isSelected = activeMaterialId ? matId === activeMaterialId : matId === currentId;
              return (
                <button
                  key={matId || index}
                  onClick={() => matId && onSelectMaterialId(matId)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-500 text-cyan-200 font-medium'
                      : 'bg-[#181a22] hover:bg-[#222530] border border-[#282b33] text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                      style={{
                        backgroundColor: mat.color || '#cccccc',
                        boxShadow: mat.emissive && mat.emissive !== '#000000' ? `0 0 6px ${mat.emissive}` : 'none'
                      }}
                    />
                    <span className="text-[11px] truncate">
                      Element {index}: {mat.name || `Material_${index + 1}`}
                    </span>
                  </div>
                  {isSelected && <Check size={12} className="text-cyan-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Material Interactive Sphere Preview (Unity PBR sphere look) */}
      <div className="flex items-center gap-3 bg-[#12141a] p-2.5 rounded-md border border-[#2d313b]">
        <div
          className="w-12 h-12 rounded-full border border-white/20 shrink-0 shadow-lg relative overflow-hidden transition-all"
          style={{
            background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${material.color} 45%, #000000 100%)`,
            boxShadow: isEmissionActive && material.emissive ? `0 0 14px ${material.emissive}` : 'inset -2px -2px 6px rgba(0,0,0,0.6)'
          }}
        >
          {material.wireframe && (
            <div className="absolute inset-0 border border-dashed border-cyan-400/50 rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="text-[11px] font-medium text-gray-200 truncate">
            {material.name || 'Standard Material'}
          </div>
          <div className="text-[10px] text-gray-400 flex items-center gap-2">
            <span>Color: <strong className="font-mono text-gray-300">{material.color.toUpperCase()}</strong></span>
            <span>Rough: <strong className="font-mono text-gray-300">{material.roughness.toFixed(2)}</strong></span>
          </div>
          <div className="text-[10px] text-gray-500">
            {material.transparent ? 'Transparent Mode' : 'Opaque Mode'} • {material.doubleSided ? 'Double-Sided' : 'Single-Sided'}
          </div>
        </div>
      </div>

      {/* 4. MAIN MAPS: Albedo & Base Color */}
      <div className="space-y-2.5 pt-1 border-t border-[#232730]">
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
          <span>Main Surface & Color</span>
          <span className="text-[10px] text-gray-500 font-normal">Albedo (Base Map)</span>
        </div>

        {/* Base Color Picker & Hex Input */}
        <div className="space-y-2 bg-[#12141a] p-2 rounded-md border border-[#2d313b]">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center gap-1.5 font-medium">
              <span
                className="w-3 h-3 rounded-full border border-white/20 inline-block shadow-sm"
                style={{ backgroundColor: currentColorHex }}
              />
              Albedo Tint
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentColorHex}
                onChange={(e) => handleUpdate({ color: e.target.value })}
                className="w-8 h-8 rounded border border-[#3b414f] cursor-pointer bg-transparent p-0.5"
                title="Pick custom color"
              />
              <input
                type="text"
                value={material.color}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdate({ color: val });
                }}
                className="font-mono text-[11px] text-white bg-[#181b22] px-2 py-1 rounded border border-[#2d313b] w-20 text-center focus:border-amber-400 focus:outline-none"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Quick Color Palette Swatches */}
          <div className="space-y-1 pt-1 border-t border-[#1f232d]">
            <div className="text-[10px] text-gray-500 flex items-center justify-between">
              <span>Quick Palette</span>
              {materials && materials.length > 1 && (
                <button
                  onClick={() => handleApplyColorToAllMaterials(currentColorHex)}
                  className="text-[9px] text-amber-400 hover:text-amber-300 font-normal underline"
                  title="Apply current color to all submesh materials in this model"
                >
                  Tint all {materials.length} materials
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => handleUpdate({ color: swatch.color })}
                  title={swatch.label}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    currentColorHex.toLowerCase() === swatch.color.toLowerCase()
                      ? 'scale-125 border-white ring-1 ring-amber-400'
                      : 'border-white/20 hover:scale-110'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Albedo Texture Map Slot */}
        <div className="flex items-center justify-between bg-[#12141a] p-1.5 rounded border border-[#2d313b]">
          <div className="flex items-center gap-2 min-w-0">
            {material.mapUrl ? (
              <img src={material.mapUrl} alt="Albedo" className="w-7 h-7 rounded object-cover border border-white/20" />
            ) : (
              <div className="w-7 h-7 rounded border border-dashed border-gray-700 flex items-center justify-center text-gray-600">
                <ImageIcon size={12} />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-gray-300 font-medium truncate">
                {material.mapName || (material.mapUrl ? 'Albedo Map' : 'None (No Texture)')}
              </div>
              <div className="text-[9px] text-gray-500">Base Texture Map</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSlotUpload('albedo')}
              className="px-2 py-1 bg-[#1a1d26] hover:bg-[#262a36] text-emerald-400 hover:text-emerald-300 rounded border border-[#2d313b] text-[10px] flex items-center gap-1"
              title="Upload Albedo Map"
            >
              <Upload size={10} />
              <span>Map</span>
            </button>
            {material.mapUrl && (
              <button
                onClick={() => handleUpdate({ mapUrl: undefined, mapName: undefined })}
                className="p-1 hover:bg-[#282c35] text-gray-500 hover:text-red-400 rounded"
                title="Remove Texture"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Metallic Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Metallic</span>
            <span className="text-gray-300 font-mono">{material.metalness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={material.metalness}
            onChange={(e) => handleUpdate({ metalness: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
          />
        </div>

        {/* Roughness & Smoothness Dual Slider (Unity style) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Smoothness / Roughness</span>
            <span className="text-gray-300 font-mono">
              S: {smoothness.toFixed(2)} | R: {material.roughness.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={material.roughness}
            onChange={(e) => handleUpdate({ roughness: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
          />
        </div>
      </div>

      {/* 5. NORMAL MAP SLOT */}
      <div className="space-y-2 pt-1 border-t border-[#232730]">
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles size={12} />
            <span>Normal Map (Bump / Detail)</span>
          </span>
          <span className="text-[10px] text-gray-500 font-mono">{material.normalMapUrl ? 'Active' : 'Empty'}</span>
        </div>

        <div className="flex items-center justify-between bg-[#12141a] p-1.5 rounded border border-[#2d313b]">
          <div className="flex items-center gap-2 min-w-0">
            {material.normalMapUrl ? (
              <img src={material.normalMapUrl} alt="Normal" className="w-7 h-7 rounded object-cover border border-indigo-500/30" />
            ) : (
              <div className="w-7 h-7 rounded border border-dashed border-gray-700 flex items-center justify-center text-gray-600">
                <ImageIcon size={12} />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-gray-300 font-medium truncate">
                {material.normalMapName || (material.normalMapUrl ? 'Normal Map' : 'None (No Normal Map)')}
              </div>
              <div className="text-[9px] text-gray-500">Surface Normals</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSlotUpload('normal')}
              className="px-2 py-1 bg-[#1a1d26] hover:bg-[#262a36] text-indigo-400 hover:text-indigo-300 rounded border border-[#2d313b] text-[10px] flex items-center gap-1"
            >
              <Upload size={10} />
              <span>Map</span>
            </button>
            {material.normalMapUrl && (
              <button
                onClick={() => handleUpdate({ normalMapUrl: undefined, normalMapName: undefined })}
                className="p-1 hover:bg-[#282c35] text-gray-500 hover:text-red-400 rounded"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>

        {material.normalMapUrl && (
          <div className="space-y-1 pl-2 border-l-2 border-indigo-500/40">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">Normal Scale</span>
              <span className="text-gray-300 font-mono">{(material.normalScale ?? 1.0).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={material.normalScale ?? 1.0}
              onChange={(e) => handleUpdate({ normalScale: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 6. EMISSION */}
      <div className="space-y-2 pt-1 border-t border-[#232730]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-gray-300 font-medium">
            <Sun size={12} className="text-yellow-400" />
            Emission (Glow)
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-400">
            <input
              type="checkbox"
              checked={isEmissionActive}
              onChange={(e) => {
                if (e.target.checked) {
                  handleUpdate({ emissive: material.color || '#ffcc00', emissiveIntensity: 1.0 });
                } else {
                  handleUpdate({ emissive: '#000000', emissiveIntensity: 0, emissiveMapUrl: undefined, emissiveMapName: undefined });
                }
              }}
              className="rounded border-gray-700 bg-gray-800 text-yellow-500 cursor-pointer"
            />
            <span>Enable</span>
          </label>
        </div>

        {isEmissionActive && (
          <div className="space-y-2 pl-2 border-l-2 border-yellow-500/40 bg-[#12141a]/60 p-2 rounded-r">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Emission Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={material.emissive && material.emissive !== '#000000' ? material.emissive : material.color}
                  onChange={(e) => handleUpdate({ emissive: e.target.value })}
                  className="w-6 h-6 rounded border border-[#2d313b] cursor-pointer bg-transparent"
                />
                <span className="font-mono text-[10px] text-gray-300">
                  {(material.emissive || material.color).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Intensity</span>
                <span className="text-gray-300 font-mono">{(material.emissiveIntensity ?? 1.0).toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={material.emissiveIntensity ?? 1.0}
                onChange={(e) => handleUpdate({ emissiveIntensity: parseFloat(e.target.value) })}
                className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
              />
            </div>

            {/* Emission Map Slot */}
            <div className="flex items-center justify-between bg-[#12141a] p-1.5 rounded border border-[#2d313b]">
              <div className="flex items-center gap-2 min-w-0">
                {material.emissiveMapUrl ? (
                  <img src={material.emissiveMapUrl} alt="Emission" className="w-6 h-6 rounded object-cover border border-yellow-400/30" />
                ) : (
                  <div className="w-6 h-6 rounded border border-dashed border-gray-700 flex items-center justify-center text-gray-600">
                    <ImageIcon size={10} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-300 font-medium truncate">
                    {material.emissiveMapName || 'Emission Map'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSlotUpload('emissive')}
                  className="px-1.5 py-0.5 bg-[#1a1d26] hover:bg-[#262a36] text-yellow-400 rounded text-[9px]"
                >
                  Upload
                </button>
                {material.emissiveMapUrl && (
                  <button
                    onClick={() => handleUpdate({ emissiveMapUrl: undefined, emissiveMapName: undefined })}
                    className="p-0.5 hover:bg-[#282c35] text-gray-500 hover:text-red-400 rounded"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. AMBIENT OCCLUSION & OTHER MAPS */}
      <div className="space-y-2 pt-1 border-t border-[#232730]">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>Ambient Occlusion (AO)</span>
          <span className="text-[10px] text-gray-500 font-mono">{material.aoMapUrl ? 'Active' : 'None'}</span>
        </div>

        <div className="flex items-center justify-between bg-[#12141a] p-1.5 rounded border border-[#2d313b]">
          <div className="flex items-center gap-2 min-w-0">
            {material.aoMapUrl ? (
              <img src={material.aoMapUrl} alt="AO" className="w-6 h-6 rounded object-cover border border-white/20" />
            ) : (
              <div className="w-6 h-6 rounded border border-dashed border-gray-700 flex items-center justify-center text-gray-600">
                <ImageIcon size={10} />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-gray-300 font-medium truncate">
                {material.aoMapName || 'AO Map'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSlotUpload('ao')}
              className="px-1.5 py-0.5 bg-[#1a1d26] hover:bg-[#262a36] text-gray-300 rounded text-[9px]"
            >
              Upload
            </button>
            {material.aoMapUrl && (
              <button
                onClick={() => handleUpdate({ aoMapUrl: undefined, aoMapName: undefined })}
                className="p-0.5 hover:bg-[#282c35] text-gray-500 hover:text-red-400 rounded"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        </div>

        {material.aoMapUrl && (
          <div className="space-y-1 pl-2 border-l-2 border-gray-500/40">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">AO Intensity</span>
              <span className="text-gray-300 font-mono">{(material.aoMapIntensity ?? 1.0).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={material.aoMapIntensity ?? 1.0}
              onChange={(e) => handleUpdate({ aoMapIntensity: parseFloat(e.target.value) })}
              className="w-full accent-gray-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 8. Rendering Mode & Transparency (Unity style) */}
      <div className="space-y-2 pt-1 border-t border-[#232730]">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>Rendering Mode</span>
          <div className="flex items-center gap-1 bg-[#12141a] p-0.5 rounded border border-[#2d313b]">
            <button
              onClick={() => handleUpdate({ transparent: false, opacity: 1.0 })}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                !material.transparent
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Opaque
            </button>
            <button
              onClick={() => handleUpdate({ transparent: true, opacity: material.opacity < 1 ? material.opacity : 0.65 })}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                material.transparent
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Transparent
            </button>
          </div>
        </div>

        {material.transparent && (
          <div className="space-y-1 pl-2 border-l-2 border-cyan-500/40">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Alpha / Opacity</span>
              <span className="text-gray-300 font-mono">{material.opacity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={material.opacity}
              onChange={(e) => handleUpdate({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 9. Surface Options (Double-Sided & Wireframe) */}
      <div className="space-y-2 pt-1 border-t border-[#232730]">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Double Sided (Two-Sided Faces)</span>
          <input
            type="checkbox"
            checked={!!material.doubleSided}
            onChange={(e) => handleUpdate({ doubleSided: e.target.checked })}
            className="rounded border-gray-700 bg-gray-800 text-cyan-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-300">Wireframe View</span>
          <input
            type="checkbox"
            checked={!!material.wireframe}
            onChange={(e) => handleUpdate({ wireframe: e.target.checked })}
            className="rounded border-gray-700 bg-gray-800 text-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 10. Texture Presets Quick Apply */}
      <div className="space-y-2 pt-1 border-t border-[#232730]">
        <div className="flex items-center justify-between text-gray-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <ImageIcon size={12} className="text-emerald-400" />
            <span>Preset Textures</span>
          </span>
          <button
            onClick={() => setShowTexturePresets(!showTexturePresets)}
            className="text-cyan-400 hover:underline text-[10px]"
          >
            {showTexturePresets ? 'Hide' : 'Browse Presets'}
          </button>
        </div>

        {/* Texture Presets Grid */}
        {showTexturePresets && (
          <div className="p-2 bg-[#12141a] rounded border border-[#2d313b] space-y-1.5 animate-fadeIn">
            <div className="text-[10px] text-gray-400 font-medium">Click preset texture to apply to Albedo:</div>
            <div className="grid grid-cols-5 gap-1">
              {TEXTURE_PRESETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onApplyPresetTexture(t.id);
                    setShowTexturePresets(false);
                  }}
                  title={t.name}
                  className="w-full h-8 rounded border border-[#2d313b] overflow-hidden hover:border-cyan-400 transition-all group"
                >
                  <img
                    src={t.thumbnail}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 11. Action Buttons */}
      {onApplyToSelected && currentId && (
        <div className="pt-2 border-t border-[#232730]">
          <button
            onClick={() => onApplyToSelected(currentId)}
            className="w-full py-1.5 px-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Check size={13} />
            <span>Apply to Selected Mesh</span>
          </button>
        </div>
      )}
    </div>
  );
};
