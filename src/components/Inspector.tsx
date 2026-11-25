import React, { useRef, useState, useEffect } from 'react';
import {
  Sliders,
  Sun,
  Camera,
  Layers,
  Box,
  Palette,
  Eye,
  Trash2,
  Plus,
  PlayCircle,
  RotateCw,
  Zap,
  Image as ImageIcon,
  CloudSun,
  Wind,
  RefreshCw,
  FolderOpen,
  Download,
  Copy,
  FolderSearch,
  ExternalLink,
  Check,
  Waves
} from 'lucide-react';
import { SceneObjectData, Vec3, EnvironmentSettings, SkyConfig, FogConfig, MaterialConfig, WaterConfig, WaterPreset, CharacterControllerConfig, ControllerType } from '../types/editor';
import { TEXTURE_PRESETS } from '../utils/proceduralTextures';
import { EnvironmentInspector } from './EnvironmentInspector';
import { MaterialPanel } from './MaterialPanel';
import { WaterPanel } from './WaterPanel';
import { CharacterControllerPanel } from './CharacterControllerPanel';

interface InspectorProps {
  selectedObject: SceneObjectData | null;
  environment?: EnvironmentSettings;
  onUpdateTransform: (pos?: Vec3, rot?: Vec3, scale?: Vec3) => void;
  onUpdateMaterial: (updates: any, targetMaterialId?: string) => void;
  onUpdateLight: (updates: any) => void;
  onUpdateProperties: (updates: any) => void;
  onUpdateWater?: (updates: Partial<WaterConfig>) => void;
  onApplyWaterPreset?: (preset: WaterPreset) => void;
  onUpdateCharacterController?: (updates: Partial<CharacterControllerConfig>) => void;
  onSwitchControllerType?: (type: ControllerType) => void;
  onUpdateScripts?: (scripts: any[]) => void;
  onUploadTexture: (file: File) => void;
  onApplyPresetTexture: (presetId: string) => void;
  onUpdateSky?: (updates: Partial<SkyConfig>) => void;
  onUpdateFog?: (updates: Partial<FogConfig>) => void;
  onApplyEnvironmentPreset?: (presetId: string) => void;
  onUploadHDRI?: (file: File) => void;
  onReplaceModel?: (file: File) => void;
  onReimportModel?: () => void;
  onExploreAssetDetails?: () => void;
  onExportGLB?: () => void;
  onUpdateFolderLocation?: (location: string) => void;
  inspectorTab?: 'object' | 'material' | 'environment';
  onTabChange?: (tab: 'object' | 'material' | 'environment') => void;

  // Unity Material Inspector props
  sceneMaterials?: MaterialConfig[];
  selectedMaterialId?: string | null;
  onSelectMaterialId?: (id: string) => void;
  onDuplicateMaterial?: (id: string) => void;
  onApplyMaterialToSelected?: (id: string) => void;
  onCreateCustomMaterial?: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedObject,
  environment,
  onUpdateTransform,
  onUpdateMaterial,
  onUpdateLight,
  onUpdateProperties,
  onUpdateWater,
  onApplyWaterPreset,
  onUpdateCharacterController,
  onSwitchControllerType,
  onUpdateScripts,
  onUploadTexture,
  onApplyPresetTexture,
  onUpdateSky,
  onUpdateFog,
  onApplyEnvironmentPreset,
  onUploadHDRI,
  onReplaceModel,
  onReimportModel,
  onExploreAssetDetails,
  onExportGLB,
  onUpdateFolderLocation,
  inspectorTab: controlledTab,
  onTabChange,
  sceneMaterials = [],
  selectedMaterialId,
  onSelectMaterialId,
  onDuplicateMaterial,
  onApplyMaterialToSelected,
  onCreateCustomMaterial
}) => {
  const [internalTab, setInternalTab] = useState<'object' | 'material' | 'environment'>('object');
  const [internalSelectedMatId, setInternalSelectedMatId] = useState<string | null>(null);
  const [selectedObjMatId, setSelectedObjMatId] = useState<string | null>(null);
  const [copiedFolder, setCopiedFolder] = useState(false);
  const textureInputRef = useRef<HTMLInputElement>(null);
  const modelReplaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedObjMatId(null);
  }, [selectedObject?.id]);

  const activeTab = controlledTab ?? internalTab;
  const setTab = (tab: 'object' | 'material' | 'environment') => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  // Determine active material in standalone Material tab
  const activeGlobalMatId = selectedMaterialId || internalSelectedMatId || sceneMaterials[0]?.id || sceneMaterials[0]?.uuid;
  const activeGlobalMaterial = sceneMaterials.find((m) => (m.id || m.uuid) === activeGlobalMatId) || sceneMaterials[0];

  // Tab Header Component for consistent navigation
  const renderTabBar = () => (
    <div className="p-2 border-b border-[#282b33] bg-[#15171d]">
      <div className="flex items-center gap-1 p-0.5 bg-[#101217] rounded border border-[#282d38] w-full">
        <button
          onClick={() => setTab('object')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all flex items-center justify-center gap-1 ${
            activeTab === 'object'
              ? 'bg-[#242832] text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Box size={12} />
          <span>Object</span>
        </button>
        <button
          onClick={() => setTab('material')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all flex items-center justify-center gap-1 ${
            activeTab === 'material'
              ? 'bg-amber-600/40 text-amber-200 border border-amber-500/50 shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Palette size={12} />
          <span>Material</span>
          {sceneMaterials.length > 0 && (
            <span className="ml-0.5 px-1 py-0.2 bg-black/40 text-[9px] rounded font-mono">
              {sceneMaterials.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('environment')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all flex items-center justify-center gap-1 ${
            activeTab === 'environment'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <CloudSun size={12} />
          <span>Sky & Fog</span>
        </button>
      </div>
    </div>
  );

  // If Material tab is active: Render standalone Unity-style Material Inspector
  if (activeTab === 'material') {
    return (
      <div id="inspector-panel" className="flex flex-col h-full bg-[#181a20] border-l border-[#282b33]">
        {renderTabBar()}
        <div className="flex-1 overflow-y-auto">
          {/* Material Selector Header */}
          <div className="p-3 border-b border-[#282b33] bg-[#14161c] space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Palette size={13} />
                <span>Scene Materials ({sceneMaterials.length})</span>
              </span>
              {onCreateCustomMaterial && (
                <button
                  onClick={onCreateCustomMaterial}
                  className="px-2 py-0.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 rounded flex items-center gap-1 text-[10px]"
                >
                  <Plus size={10} /> New
                </button>
              )}
            </div>

            {sceneMaterials.length > 0 ? (
              <select
                value={activeGlobalMatId || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setInternalSelectedMatId(newId);
                  if (onSelectMaterialId) onSelectMaterialId(newId);
                }}
                className="w-full bg-[#101217] border border-[#2d313b] text-gray-200 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-amber-400"
              >
                {sceneMaterials.map((m, idx) => (
                  <option key={m.id || m.uuid || idx} value={m.id || m.uuid}>
                    {m.name || `Material ${idx + 1}`} {m.sourceModel ? `(from ${m.sourceModel})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-gray-500 py-1">
                No materials in scene yet. Import a GLB model or create one.
              </div>
            )}
          </div>

          {activeGlobalMaterial ? (
            <MaterialPanel
              material={activeGlobalMaterial}
              onUpdateMaterial={(updates) => onUpdateMaterial(updates, activeGlobalMaterial.id || activeGlobalMaterial.uuid)}
              onUploadTexture={onUploadTexture}
              onApplyPresetTexture={onApplyPresetTexture}
              onDuplicateMaterial={onDuplicateMaterial}
              onApplyToSelected={selectedObject ? () => onApplyMaterialToSelected?.(activeGlobalMaterial.id || activeGlobalMaterial.uuid!) : undefined}
              showHeader={true}
            />
          ) : (
            <div className="p-6 text-center text-gray-500 text-xs space-y-3">
              <Palette size={32} className="mx-auto text-gray-600" />
              <p>No material selected</p>
              {onCreateCustomMaterial && (
                <button
                  onClick={onCreateCustomMaterial}
                  className="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 rounded text-xs"
                >
                  Create New Material
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If Environment tab is active, render EnvironmentInspector
  if (activeTab === 'environment' && environment && onUpdateSky && onUpdateFog && onApplyEnvironmentPreset && onUploadHDRI) {
    return (
      <div id="inspector-panel" className="flex flex-col h-full bg-[#181a20] border-l border-[#282b33]">
        {renderTabBar()}
        <div className="flex-1 overflow-y-auto">
          <EnvironmentInspector
            environment={environment}
            onUpdateSky={onUpdateSky}
            onUpdateFog={onUpdateFog}
            onApplyPreset={onApplyEnvironmentPreset}
            onUploadHDRI={onUploadHDRI}
          />
        </div>
      </div>
    );
  }

  if (!selectedObject) {
    return (
      <div
        id="inspector-panel"
        className="flex flex-col h-full bg-[#181a20] border-l border-[#282b33] text-gray-400 text-xs select-none"
      >
        {renderTabBar()}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Box size={32} className="text-gray-600 mb-2 stroke-[1.5]" />
          <p className="font-medium text-gray-300">No object selected</p>
          <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">
            Select an object in the 3D viewport, inspect materials in the Material tab, or customize atmosphere.
          </p>
          {sceneMaterials.length > 0 && (
            <button
              onClick={() => setTab('material')}
              className="mt-4 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow"
            >
              <Palette size={13} /> Edit Scene Materials ({sceneMaterials.length})
            </button>
          )}
        </div>
      </div>
    );
  }

  // Handle number input changes
  const handleVec3Change = (
    type: 'pos' | 'rot' | 'scale',
    axis: 'x' | 'y' | 'z',
    val: string
  ) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;

    if (type === 'pos') {
      const newPos = { ...selectedObject.position, [axis]: num };
      onUpdateTransform(newPos, undefined, undefined);
    } else if (type === 'rot') {
      const newRot = { ...selectedObject.rotation, [axis]: num };
      onUpdateTransform(undefined, newRot, undefined);
    } else if (type === 'scale') {
      const newScale = { ...selectedObject.scale, [axis]: num };
      onUpdateTransform(undefined, undefined, newScale);
    }
  };

  // Script management
  const addScript = (type: 'playerController' | 'rotator' | 'bouncer') => {
    const existing = selectedObject.scripts || [];
    if (existing.some(s => s.type === type)) return;

    let newScript: any = { type, enabled: true };
    if (type === 'playerController') {
      newScript.speed = 6;
      newScript.jumpForce = 8;
    } else if (type === 'rotator') {
      newScript.rotSpeed = { x: 0, y: 45, z: 0 };
    }

    onUpdateScripts?.([...existing, newScript]);
  };

  const toggleScriptEnabled = (index: number) => {
    const scripts = [...(selectedObject.scripts || [])];
    scripts[index].enabled = !scripts[index].enabled;
    onUpdateScripts?.(scripts);
  };

  const removeScript = (index: number) => {
    const scripts = [...(selectedObject.scripts || [])];
    scripts.splice(index, 1);
    onUpdateScripts?.(scripts);
  };

  const updateScriptParam = (index: number, param: string, value: any) => {
    const scripts = [...(selectedObject.scripts || [])];
    (scripts[index] as any)[param] = value;
    onUpdateScripts?.(scripts);
  };

  return (
    <div
      id="inspector-panel"
      className="flex flex-col h-full bg-[#181a20] border-l border-[#282b33] text-gray-200 text-xs overflow-y-auto select-none"
    >
      {renderTabBar()}

      {/* Inspector Header */}
      <div className="p-3 border-b border-[#282b33] bg-[#15171d] flex items-center justify-between">
        <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
          Inspector
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/40">
            {selectedObject.type}
          </span>
        </div>
      </div>

      {/* Main Object Header (Name, Active, Flags) */}
      <div className="p-3 border-b border-[#282b33] bg-[#16181e] space-y-2.5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedObject.visible}
            onChange={(e) => onUpdateProperties({ visible: e.target.checked })}
            className="rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0 cursor-pointer"
            title="Active / Visible"
          />
          <input
            type="text"
            value={selectedObject.name}
            onChange={(e) => onUpdateProperties({ name: e.target.value })}
            className="flex-1 bg-[#101216] border border-[#2d313b] rounded px-2 py-1 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Object Shadows & Flags */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!selectedObject.castShadow}
              onChange={(e) => onUpdateProperties({ castShadow: e.target.checked })}
              className="rounded border-gray-700 bg-gray-800 text-cyan-500"
            />
            <span>Cast Shadow</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!selectedObject.receiveShadow}
              onChange={(e) => onUpdateProperties({ receiveShadow: e.target.checked })}
              className="rounded border-gray-700 bg-gray-800 text-cyan-500"
            />
            <span>Receive Shadow</span>
          </label>
        </div>
      </div>

      {/* TRANSFORM COMPONENT */}
      <div className="p-3 border-b border-[#282b33] space-y-3">
        <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><Sliders size={13} className="text-cyan-400" /> Transform</span>
          <button
            onClick={() => onUpdateTransform({ x: 0, y: 0.6, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 })}
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
            {['x', 'y', 'z'].map((axis) => {
              const val = selectedObject.position[axis as 'x' | 'y' | 'z'];
              const color = axis === 'x' ? 'text-red-400' : axis === 'y' ? 'text-emerald-400' : 'text-blue-400';
              return (
                <div key={axis} className="flex items-center bg-[#101216] border border-[#2d313b] rounded overflow-hidden">
                  <span className={`px-1.5 text-[10px] font-bold ${color} uppercase select-none`}>{axis}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={Number(val.toFixed(2))}
                    onChange={(e) => handleVec3Change('pos', axis as any, e.target.value)}
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
            {['x', 'y', 'z'].map((axis) => {
              const val = selectedObject.rotation[axis as 'x' | 'y' | 'z'];
              const color = axis === 'x' ? 'text-red-400' : axis === 'y' ? 'text-emerald-400' : 'text-blue-400';
              return (
                <div key={axis} className="flex items-center bg-[#101216] border border-[#2d313b] rounded overflow-hidden">
                  <span className={`px-1.5 text-[10px] font-bold ${color} uppercase select-none`}>{axis}</span>
                  <input
                    type="number"
                    step="5"
                    value={Math.round(val)}
                    onChange={(e) => handleVec3Change('rot', axis as any, e.target.value)}
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
            {['x', 'y', 'z'].map((axis) => {
              const val = selectedObject.scale[axis as 'x' | 'y' | 'z'];
              const color = axis === 'x' ? 'text-red-400' : axis === 'y' ? 'text-emerald-400' : 'text-blue-400';
              return (
                <div key={axis} className="flex items-center bg-[#101216] border border-[#2d313b] rounded overflow-hidden">
                  <span className={`px-1.5 text-[10px] font-bold ${color} uppercase select-none`}>{axis}</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    value={Number(val.toFixed(2))}
                    onChange={(e) => handleVec3Change('scale', axis as any, e.target.value)}
                    className="w-full bg-transparent px-1 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3D MODEL & ASSET SOURCE CONTROLLER (If object is a model, mesh or has asset data) */}
      {(selectedObject.type === 'model' ||
        selectedObject.type === 'mesh' ||
        !!selectedObject.modelAssetId ||
        !!selectedObject.modelMetadata) && (
        <div className="p-3 border-b border-[#282b33] space-y-3 bg-[#13151b]/50">
          <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Box size={13} className="text-cyan-400" /> Model Asset Controller
            </span>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
              GLB/GLTF
            </span>
          </div>

          {/* Model File & Location Details */}
          <div className="p-2.5 bg-[#0f1115] border border-[#262a34] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase font-medium">Source File:</span>
              <span className="text-[11px] font-mono text-cyan-300 font-semibold truncate max-w-[170px]" title={selectedObject.modelMetadata?.filename || `${selectedObject.name}.glb`}>
                {selectedObject.modelMetadata?.filename || `${selectedObject.name}.glb`}
              </span>
            </div>

            {/* Folder Location & Copy Button */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <FolderOpen size={11} className="text-amber-400" /> Folder Location / URL:
                </span>
                <button
                  onClick={() => {
                    const loc =
                      selectedObject.folderLocation ||
                      selectedObject.modelMetadata?.folderLocation ||
                      selectedObject.modelMetadata?.fileLocation ||
                      `models/${selectedObject.name}.glb`;
                    navigator.clipboard.writeText(loc);
                    setCopiedFolder(true);
                    setTimeout(() => setCopiedFolder(false), 2000);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-0.5"
                >
                  {copiedFolder ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  {copiedFolder ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-[10px] text-gray-300 bg-[#16181f] p-1.5 rounded border border-[#2b303d] break-all max-h-16 overflow-y-auto">
                {selectedObject.folderLocation ||
                  selectedObject.modelMetadata?.folderLocation ||
                  selectedObject.modelMetadata?.fileLocation ||
                  selectedObject.modelUrl ||
                  `models/${selectedObject.name}.glb`}
              </div>
            </div>

            {/* Metrics stats row */}
            {selectedObject.modelMetadata && (
              <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] border-t border-[#232732] text-center">
                <div className="bg-[#15171e] py-1 rounded">
                  <span className="text-gray-500 block text-[9px]">Tris</span>
                  <span className="text-amber-300 font-mono font-medium">
                    {selectedObject.modelMetadata.triangleCount?.toLocaleString() ?? '—'}
                  </span>
                </div>
                <div className="bg-[#15171e] py-1 rounded">
                  <span className="text-gray-500 block text-[9px]">Verts</span>
                  <span className="text-emerald-300 font-mono font-medium">
                    {selectedObject.modelMetadata.vertexCount?.toLocaleString() ?? '—'}
                  </span>
                </div>
                <div className="bg-[#15171e] py-1 rounded">
                  <span className="text-gray-500 block text-[9px]">Size</span>
                  <span className="text-gray-300 font-mono font-medium">
                    {selectedObject.modelMetadata.fileSize ?? 'GLB'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() => modelReplaceInputRef.current?.click()}
              className="py-1.5 px-2 bg-[#1b202a] hover:bg-cyan-700/70 border border-cyan-800/40 rounded text-cyan-300 hover:text-white transition-colors text-center text-[11px] font-medium flex items-center justify-center gap-1.5 shadow"
            >
              <RefreshCw size={12} className="text-cyan-400" /> Replace GLB
            </button>
            <button
              onClick={() => onReimportModel?.()}
              className="py-1.5 px-2 bg-[#1b202a] hover:bg-emerald-700/70 border border-emerald-800/40 rounded text-emerald-300 hover:text-white transition-colors text-center text-[11px] font-medium flex items-center justify-center gap-1.5 shadow"
            >
              <RefreshCw size={12} className="text-emerald-400" /> Reimport
            </button>
            <button
              onClick={() => onExploreAssetDetails?.()}
              className="py-1.5 px-2 bg-[#1b202a] hover:bg-amber-700/70 border border-amber-800/40 rounded text-amber-300 hover:text-white transition-colors text-center text-[11px] font-medium flex items-center justify-center gap-1.5 shadow"
            >
              <FolderSearch size={12} className="text-amber-400" /> Explore in Folders
            </button>
            <button
              onClick={() => onExportGLB?.()}
              className="py-1.5 px-2 bg-[#1b202a] hover:bg-indigo-700/70 border border-indigo-800/40 rounded text-indigo-300 hover:text-white transition-colors text-center text-[11px] font-medium flex items-center justify-center gap-1.5 shadow"
            >
              <Download size={12} className="text-indigo-400" /> Export .GLB
            </button>
          </div>

          {/* Hidden Replace File Input */}
          <input
            ref={modelReplaceInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onReplaceModel?.(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </div>
      )}

      {/* WATER COMPONENT (Unity 3D Simulated River & Ocean Wave Editor) */}
      {(selectedObject.type === 'water' || selectedObject.meshType === 'water' || !!selectedObject.water) && (
        <div className="border-b border-[#282b33]">
          <WaterPanel
            waterConfig={selectedObject.water}
            onUpdateWater={onUpdateWater}
            onApplyPreset={onApplyWaterPreset}
          />
        </div>
      )}

      {/* CHARACTER CONTROLLER COMPONENT (FPV, TPV, Drone Rig) */}
      {(selectedObject.type === 'characterController' || !!selectedObject.characterController || selectedObject.userData?.isPlayerController) && (
        <div className="border-b border-[#282b33]">
          <CharacterControllerPanel
            controllerConfig={selectedObject.characterController || selectedObject.userData?.characterConfig}
            onUpdateConfig={onUpdateCharacterController}
            onSwitchType={onSwitchControllerType}
          />
        </div>
      )}

      {/* MATERIAL COMPONENT (Unity-style Multi-Material and PBR editing - skip if water) */}
      {selectedObject.type !== 'water' && !selectedObject.water && (selectedObject.material || (selectedObject.materials && selectedObject.materials.length > 0)) && (() => {
        const objectMats = (selectedObject.materials && selectedObject.materials.length > 0)
          ? selectedObject.materials
          : (selectedObject.material ? [selectedObject.material] : []);
        
        const activeMat = objectMats.find(m => (m.id || m.uuid) === selectedObjMatId) || objectMats[0] || selectedObject.material!;

        return (
          <div className="border-b border-[#282b33]">
            <MaterialPanel
              material={activeMat}
              materials={objectMats.length > 1 ? objectMats : undefined}
              activeMaterialId={activeMat.id || activeMat.uuid}
              onSelectMaterialId={(id) => setSelectedObjMatId(id)}
              onUpdateMaterial={(updates, targetId) => onUpdateMaterial(updates, targetId || activeMat.id || activeMat.uuid)}
              onUploadTexture={onUploadTexture}
              onApplyPresetTexture={onApplyPresetTexture}
              onDuplicateMaterial={onDuplicateMaterial}
              showHeader={true}
            />
          </div>
        );
      })()}

      {/* LIGHT COMPONENT (If object is light) */}
      {selectedObject.light && (
        <div className="p-3 border-b border-[#282b33] space-y-3">
          <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Sun size={13} className="text-yellow-400" /> Light Source</span>
            <span className="text-[10px] text-gray-500 capitalize">{selectedObject.light.type}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedObject.light.color}
                onChange={(e) => onUpdateLight({ color: e.target.value })}
                className="w-7 h-7 rounded border border-[#2d313b] cursor-pointer bg-transparent"
              />
              <span className="font-mono text-[11px] text-gray-300">{selectedObject.light.color.toUpperCase()}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Intensity</span>
              <span className="text-gray-300 font-mono">{selectedObject.light.intensity.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={selectedObject.light.intensity}
              onChange={(e) => onUpdateLight({ intensity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Cast Shadow</span>
            <input
              type="checkbox"
              checked={selectedObject.light.castShadow}
              onChange={(e) => onUpdateLight({ castShadow: e.target.checked })}
              className="rounded border-gray-700 bg-gray-800 text-cyan-500"
            />
          </div>
        </div>
      )}

      {/* GAME SCRIPTS / BEHAVIORS COMPONENT (Requirement 18) */}
      <div className="p-3 border-b border-[#282b33] space-y-3">
        <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><Zap size={13} className="text-emerald-400" /> Components & Behaviors</span>
        </div>

        {/* Existing Scripts */}
        {selectedObject.scripts && selectedObject.scripts.length > 0 ? (
          <div className="space-y-2">
            {selectedObject.scripts.map((script, idx) => (
              <div key={idx} className="p-2.5 bg-[#12141a] border border-[#2d313b] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={script.enabled}
                      onChange={() => toggleScriptEnabled(idx)}
                      className="rounded border-gray-700 bg-gray-800 text-emerald-500"
                    />
                    <span className="font-semibold text-gray-200 capitalize">
                      {script.type === 'playerController' ? 'Player Controller' : script.type === 'rotator' ? 'Rotator' : 'Bouncer'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeScript(idx)}
                    className="text-gray-500 hover:text-red-400"
                    title="Remove Component"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Player Controller Config */}
                {script.type === 'playerController' && (
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Speed</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={script.speed ?? 6}
                        onChange={(e) => updateScriptParam(idx, 'speed', parseFloat(e.target.value))}
                        className="w-16 bg-[#181a20] border border-[#2d313b] rounded px-1.5 py-0.5 text-right text-white"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Jump Force</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={script.jumpForce ?? 8}
                        onChange={(e) => updateScriptParam(idx, 'jumpForce', parseFloat(e.target.value))}
                        className="w-16 bg-[#181a20] border border-[#2d313b] rounded px-1.5 py-0.5 text-right text-white"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-400/80 italic mt-1">
                      Controls: WASD / Arrow keys move, Space jumps during Play mode.
                    </p>
                  </div>
                )}

                {/* Rotator Config */}
                {script.type === 'rotator' && (
                  <div className="space-y-1 pt-1 text-[11px]">
                    <span className="text-gray-400">Spin Speed (Deg/s)</span>
                    <div className="grid grid-cols-3 gap-1">
                      {['x', 'y', 'z'].map((axis) => (
                        <input
                          key={axis}
                          type="number"
                          value={script.rotSpeed?.[axis as 'x' | 'y' | 'z'] ?? 0}
                          onChange={(e) => {
                            const newRot = { ...(script.rotSpeed || { x: 0, y: 45, z: 0 }), [axis]: parseFloat(e.target.value) };
                            updateScriptParam(idx, 'rotSpeed', newRot);
                          }}
                          className="bg-[#181a20] border border-[#2d313b] rounded px-1 py-0.5 text-center text-white text-xs"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-gray-500 italic">No custom behaviors attached.</p>
        )}

        {/* Add Component Menu */}
        <div className="pt-1">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => addScript('playerController')}
              className="px-2 py-1.5 bg-[#12141a] hover:bg-[#222631] border border-[#2d313b] rounded text-emerald-300 hover:text-white transition-colors flex items-center justify-center gap-1 text-[11px]"
            >
              <PlayCircle size={12} /> + Player Controller
            </button>
            <button
              onClick={() => addScript('rotator')}
              className="px-2 py-1.5 bg-[#12141a] hover:bg-[#222631] border border-[#2d313b] rounded text-cyan-300 hover:text-white transition-colors flex items-center justify-center gap-1 text-[11px]"
            >
              <RotateCw size={12} /> + Rotator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
