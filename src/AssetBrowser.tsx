import React, { useState, useRef, useMemo } from 'react';
import {
  Folder,
  Box,
  Palette,
  Image as ImageIcon,
  FileCode2,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CloudSun,
  Plus,
  Sliders,
  Check,
  Search,
  Layers,
  Sparkle
} from 'lucide-react';
import { MODEL_PRESETS } from './utils/proceduralModels';
import { TEXTURE_PRESETS } from './utils/proceduralTextures';
import { SAMPLE_SCENES } from './utils/sampleScenes';
import { ENVIRONMENT_PRESETS } from './utils/environmentPresets';
import { MaterialConfig } from './types/editor';

export const MATERIAL_PRESETS: (MaterialConfig & { id: string })[] = [
  { id: 'gold', name: 'Gold', color: '#f59e0b', roughness: 0.15, metalness: 0.95, opacity: 1, transparent: false, wireframe: false },
  { id: 'chrome', name: 'Chrome', color: '#e2e8f0', roughness: 0.05, metalness: 1.0, opacity: 1, transparent: false, wireframe: false },
  { id: 'matte_blue', name: 'Matte Cyan', color: '#06b6d4', roughness: 0.7, metalness: 0.1, opacity: 1, transparent: false, wireframe: false },
  { id: 'emerald', name: 'Emerald', color: '#10b981', roughness: 0.2, metalness: 0.6, opacity: 1, transparent: false, wireframe: false },
  { id: 'obsidian', name: 'Obsidian', color: '#18181b', roughness: 0.1, metalness: 0.8, opacity: 1, transparent: false, wireframe: false },
  { id: 'ruby', name: 'Ruby', color: '#ef4444', roughness: 0.15, metalness: 0.4, opacity: 1, transparent: false, wireframe: false },
  { id: 'copper', name: 'Copper', color: '#d97706', roughness: 0.3, metalness: 0.85, opacity: 1, transparent: false, wireframe: false },
  { id: 'neon_glow', name: 'Neon Glow', color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 2.0, roughness: 0.3, metalness: 0.2, opacity: 1, transparent: false, wireframe: false },
  { id: 'wire_glow', name: 'Wireframe Blue', color: '#38bdf8', roughness: 0.5, metalness: 0, wireframe: true, opacity: 1, transparent: false }
];

interface AssetBrowserProps {
  onAddPresetModel: (presetId: string) => void;
  onImportGLBFile: (file: File) => void;
  importProgress: number | null;
  onApplyMaterialPreset: (mat: any) => void;
  onApplyPresetTexture: (presetId: string) => void;
  onUploadTextureFile: (file: File) => void;
  onLoadSampleScene: (sampleId: string) => void;
  customTextures: { id: string; name: string; url: string }[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onApplyEnvironmentPreset?: (presetId: string) => void;
  onUploadHDRI?: (file: File) => void;
  activeSkyPresetId?: string;

  // New Unity Material Management Props
  sceneMaterials?: MaterialConfig[];
  selectedMaterialId?: string | null;
  onSelectMaterialToEdit?: (material: MaterialConfig) => void;
  onCreateCustomMaterial?: () => void;
  onApplyMaterialToSelected?: (materialId: string) => void;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({
  onAddPresetModel,
  onImportGLBFile,
  importProgress,
  onApplyMaterialPreset,
  onApplyPresetTexture,
  onUploadTextureFile,
  onLoadSampleScene,
  customTextures,
  isCollapsed,
  onToggleCollapse,
  onApplyEnvironmentPreset,
  onUploadHDRI,
  activeSkyPresetId,
  sceneMaterials = [],
  selectedMaterialId,
  onSelectMaterialToEdit,
  onCreateCustomMaterial,
  onApplyMaterialToSelected
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'materials' | 'textures' | 'environment' | 'scenes'>('models');
  const [materialFilter, setMaterialFilter] = useState<'all' | 'imported' | 'presets'>('all');
  const [materialSearch, setMaterialSearch] = useState('');

  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const textureFileInputRef = useRef<HTMLInputElement>(null);
  const hdriFileInputRef = useRef<HTMLInputElement>(null);

  // Filtered materials
  const importedMaterials = useMemo(() => {
    return sceneMaterials.filter((m) => m.sourceModel || m.id || m.uuid);
  }, [sceneMaterials]);

  const filteredMaterials = useMemo(() => {
    let list: (MaterialConfig & { isPreset?: boolean })[] = [];

    if (materialFilter === 'all') {
      list = [
        ...importedMaterials.map((m) => ({ ...m, isPreset: false })),
        ...MATERIAL_PRESETS.map((p) => ({ ...p, isPreset: true }))
      ];
    } else if (materialFilter === 'imported') {
      list = importedMaterials.map((m) => ({ ...m, isPreset: false }));
    } else {
      list = MATERIAL_PRESETS.map((p) => ({ ...p, isPreset: true }));
    }

    if (materialSearch.trim()) {
      const q = materialSearch.toLowerCase().trim();
      list = list.filter((m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.sourceModel || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [importedMaterials, materialFilter, materialSearch]);

  return (
    <div
      id="asset-browser-panel"
      className="bg-[#181a20] border-t border-[#282b33] flex flex-col transition-all duration-200 select-none text-xs text-gray-300"
      style={{ height: isCollapsed ? '32px' : '175px' }}
    >
      {/* Header Tabs */}
      <div className="h-8 px-3 border-b border-[#282b33] bg-[#15171d] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1">
          <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px] mr-2 flex items-center gap-1.5">
            <Folder size={13} className="text-cyan-400" /> Asset Library
          </span>

          <button
            onClick={() => setActiveTab('models')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'models'
                ? 'bg-[#242832] text-cyan-300 font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Box size={12} /> Models
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-[#242832] text-amber-300 font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Palette size={12} /> Materials
            {importedMaterials.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded-full font-mono">
                {importedMaterials.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('textures')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'textures'
                ? 'bg-[#242832] text-emerald-300 font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ImageIcon size={12} /> Textures
          </button>

          <button
            onClick={() => setActiveTab('environment')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'environment'
                ? 'bg-[#242832] text-teal-300 font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CloudSun size={12} /> Sky & HDRI
          </button>

          <button
            onClick={() => setActiveTab('scenes')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'scenes'
                ? 'bg-[#242832] text-indigo-300 font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileCode2 size={12} /> Scenes
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {activeTab === 'models' && (
            <button
              onClick={() => modelFileInputRef.current?.click()}
              className="px-2 py-0.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 rounded flex items-center gap-1 text-[11px]"
            >
              <Upload size={11} /> Import GLB/GLTF
            </button>
          )}

          {activeTab === 'materials' && (
            <div className="flex items-center gap-1.5">
              {onCreateCustomMaterial && (
                <button
                  onClick={onCreateCustomMaterial}
                  className="px-2 py-0.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 rounded flex items-center gap-1 text-[11px]"
                  title="Create a new Unity-style custom material"
                >
                  <Plus size={11} /> New Material
                </button>
              )}
            </div>
          )}

          {activeTab === 'textures' && (
            <button
              onClick={() => textureFileInputRef.current?.click()}
              className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 rounded flex items-center gap-1 text-[11px]"
            >
              <Upload size={11} /> Upload Texture
            </button>
          )}

          {activeTab === 'environment' && (
            <button
              onClick={() => hdriFileInputRef.current?.click()}
              className="px-2 py-0.5 bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/40 text-teal-200 rounded flex items-center gap-1 text-[11px]"
            >
              <Upload size={11} /> Import HDR / EXR
            </button>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-[#282c35] text-gray-400 hover:text-white rounded"
            title={isCollapsed ? 'Expand Asset Browser' : 'Collapse Asset Browser'}
          >
            {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={modelFileInputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onImportGLBFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={textureFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onUploadTextureFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={hdriFileInputRef}
        type="file"
        accept=".hdr,.exr,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && onUploadHDRI) {
            onUploadHDRI(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Main Content Area */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#13151b]">
          {/* Sub-toolbar for Materials Tab */}
          {activeTab === 'materials' && (
            <div className="px-3 py-1.5 bg-[#171922] border-b border-[#232730] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMaterialFilter('all')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    materialFilter === 'all'
                      ? 'bg-[#2b303e] text-cyan-300 font-medium'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  All ({importedMaterials.length + MATERIAL_PRESETS.length})
                </button>
                <button
                  onClick={() => setMaterialFilter('imported')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors flex items-center gap-1 ${
                    materialFilter === 'imported'
                      ? 'bg-[#2b303e] text-amber-300 font-medium'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Layers size={10} />
                  <span>Imported Models ({importedMaterials.length})</span>
                </button>
                <button
                  onClick={() => setMaterialFilter('presets')}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    materialFilter === 'presets'
                      ? 'bg-[#2b303e] text-gray-200 font-medium'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Presets ({MATERIAL_PRESETS.length})
                </button>
              </div>

              <div className="relative w-40">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter materials..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full bg-[#12141a] border border-[#2d313b] text-gray-200 text-[10px] pl-6 pr-2 py-0.5 rounded focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Cards Scroll Container */}
          <div className="flex-1 p-2.5 overflow-x-auto overflow-y-hidden flex items-center gap-3">
            {/* Progress Overlay if uploading */}
            {importProgress !== null && (
              <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/50 rounded-lg p-3 min-w-[220px]">
                <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <span className="font-semibold text-cyan-200 text-xs">Importing 3D Model...</span>
                  <div className="w-32 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MODELS TAB */}
            {activeTab === 'models' && (
              <>
                {MODEL_PRESETS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onAddPresetModel(m.id)}
                    title={`Click to add ${m.name} to scene`}
                    className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-cyan-500 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform">
                      <Box size={18} />
                    </div>
                    <span className="font-medium text-gray-200 text-[11px] truncate w-full">
                      {m.name}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">.glb / mesh</span>
                  </div>
                ))}
              </>
            )}

            {/* MATERIALS TAB (Unity-Style Multi-Material Browser) */}
            {activeTab === 'materials' && (
              <>
                {filteredMaterials.length === 0 ? (
                  <div className="flex items-center justify-center w-full text-gray-500 text-xs py-4 gap-2">
                    <span>No materials found. Import a GLB file or</span>
                    {onCreateCustomMaterial && (
                      <button
                        onClick={onCreateCustomMaterial}
                        className="text-amber-400 hover:underline font-medium"
                      >
                        create a new material
                      </button>
                    )}
                  </div>
                ) : (
                  filteredMaterials.map((mat, idx) => {
                    const matId = mat.id || mat.uuid || `mat_${idx}`;
                    const isSelected = selectedMaterialId === matId;
                    const isEmission = (mat.emissiveIntensity ?? 0) > 0 || (mat.emissive && mat.emissive !== '#000000');

                    return (
                      <div
                        key={matId}
                        className={`w-32 h-28 bg-[#12141a] hover:bg-[#20242e] border rounded-lg flex flex-col justify-between p-2 cursor-pointer transition-all shrink-0 group relative shadow-sm ${
                          isSelected
                            ? 'border-amber-400 bg-[#1a1c24]'
                            : 'border-[#2d313b] hover:border-amber-400/80'
                        }`}
                        onClick={() => {
                          if (onSelectMaterialToEdit) {
                            onSelectMaterialToEdit(mat);
                          } else {
                            onApplyMaterialPreset(mat);
                          }
                        }}
                      >
                        {/* 3D Sphere Preview */}
                        <div className="flex items-center justify-between w-full">
                          <div
                            className="w-9 h-9 rounded-full border border-white/20 shadow-md group-hover:scale-105 transition-transform shrink-0 relative overflow-hidden"
                            style={{
                              background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${mat.color || '#888888'} 45%, #000000 100%)`,
                              boxShadow: isEmission && mat.emissive ? `0 0 10px ${mat.emissive}` : 'none'
                            }}
                          >
                            {mat.wireframe && (
                              <div className="absolute inset-0 border border-dashed border-cyan-400 rounded-full" />
                            )}
                          </div>

                          {/* Quick Actions (Edit in Inspector, Apply to Selected) */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            {onSelectMaterialToEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectMaterialToEdit(mat);
                                }}
                                className="p-1 hover:bg-[#2e3342] text-gray-400 hover:text-amber-300 rounded"
                                title="Edit material in Inspector (Unity style)"
                              >
                                <Sliders size={12} />
                              </button>
                            )}

                            {onApplyMaterialToSelected && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApplyMaterialToSelected(matId);
                                }}
                                className="p-1 hover:bg-[#2e3342] text-gray-400 hover:text-cyan-300 rounded"
                                title="Apply material to selected 3D object"
                              >
                                <Check size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Material Info */}
                        <div className="w-full text-left space-y-0.5">
                          <div className="font-medium text-gray-200 text-[11px] truncate w-full" title={mat.name}>
                            {mat.name || 'Standard Material'}
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-gray-500">
                            <span className="truncate max-w-[70px]">
                              {mat.sourceModel ? `GLB: ${mat.sourceModel}` : (mat.isPreset ? 'Preset' : 'Custom')}
                            </span>
                            <span className="font-mono text-gray-400">{mat.color?.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* TEXTURES TAB */}
            {activeTab === 'textures' && (
              <>
                {TEXTURE_PRESETS.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onApplyPresetTexture(t.id)}
                    title={`Apply ${t.name} to selected object`}
                    className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-emerald-400 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                  >
                    <div className="w-10 h-10 rounded border border-white/20 mb-1.5 overflow-hidden group-hover:scale-110 transition-transform">
                      <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-medium text-gray-200 text-[11px] truncate w-full">
                      {t.name}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Procedural</span>
                  </div>
                ))}

                {customTextures.map((ct) => (
                  <div
                    key={ct.id}
                    onClick={() => {
                      fetch(ct.url)
                        .then((res) => res.blob())
                        .then((blob) => {
                          const file = new File([blob], ct.name, { type: blob.type });
                          onUploadTextureFile(file);
                        });
                    }}
                    title={`Apply custom texture ${ct.name}`}
                    className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-emerald-400 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                  >
                    <div className="w-10 h-10 rounded border border-white/20 mb-1.5 overflow-hidden group-hover:scale-110 transition-transform">
                      <img src={ct.url} alt={ct.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-medium text-gray-200 text-[11px] truncate w-full">
                      {ct.name}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">Uploaded</span>
                  </div>
                ))}
              </>
            )}

            {/* ENVIRONMENT / SKY TAB */}
            {activeTab === 'environment' && (
              <>
                {ENVIRONMENT_PRESETS.map((env) => (
                  <div
                    key={env.id}
                    onClick={() => onApplyEnvironmentPreset && onApplyEnvironmentPreset(env.id)}
                    title={`Apply ${env.name} Sky & Lighting`}
                    className={`w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm ${
                      activeSkyPresetId === env.id
                        ? 'border-teal-400 bg-[#162024]'
                        : 'border-[#2d313b] hover:border-teal-400'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full border border-white/20 mb-1.5 group-hover:scale-110 transition-transform shadow-inner flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${(env.sky.turbidity ?? 10) > 6 ? '#f97316' : '#38bdf8'} 0%, ${(env.sky.rayleigh ?? 3) > 3 ? '#a855f7' : '#0284c7'} 100%)`
                      }}
                    >
                      <CloudSun size={18} className="text-white drop-shadow" />
                    </div>
                    <span className="font-medium text-gray-200 text-[11px] truncate w-full">
                      {env.name}
                    </span>
                    <span className="text-[10px] text-teal-400 font-mono">
                      {activeSkyPresetId === env.id ? 'Active' : 'Preset'}
                    </span>
                  </div>
                ))}
              </>
            )}

            {/* SCENES TAB */}
            {activeTab === 'scenes' && (
              <>
                {SAMPLE_SCENES.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onLoadSampleScene(s.id)}
                    title={`Load ${s.name}`}
                    className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-indigo-400 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform">
                      <Sparkles size={18} />
                    </div>
                    <span className="font-medium text-gray-200 text-[11px] truncate w-full">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">Preset Scene</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
