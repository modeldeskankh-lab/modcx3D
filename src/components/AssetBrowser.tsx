import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  Box,
  Palette,
  Image as ImageIcon,
  Volume2,
  FileCode2,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { AssetManager, PublicAssetItem, PublicAssetManifest } from '../AssetManager';

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
}

export const MATERIAL_PRESETS = [
  { id: 'gold', name: 'Gold', color: '#f59e0b', roughness: 0.15, metalness: 0.95 },
  { id: 'chrome', name: 'Chrome', color: '#e2e8f0', roughness: 0.05, metalness: 1.0 },
  { id: 'matte_blue', name: 'Matte Cyan', color: '#06b6d4', roughness: 0.7, metalness: 0.1 },
  { id: 'emerald', name: 'Emerald', color: '#10b981', roughness: 0.2, metalness: 0.6 },
  { id: 'obsidian', name: 'Obsidian', color: '#18181b', roughness: 0.1, metalness: 0.8 },
  { id: 'ruby', name: 'Ruby', color: '#ef4444', roughness: 0.15, metalness: 0.4 },
  { id: 'copper', name: 'Copper', color: '#d97706', roughness: 0.3, metalness: 0.85 },
  { id: 'wire_glow', name: 'Wireframe Blue', color: '#38bdf8', roughness: 0.5, metalness: 0, wireframe: true }
];

export const AUDIO_PRESETS = [
  { id: 'jump', name: 'Jump Synth SFX', frequency: 320 },
  { id: 'coin', name: 'Coin Pickup SFX', frequency: 580 },
  { id: 'laser', name: 'Laser Beam SFX', frequency: 880 },
  { id: 'powerup', name: 'Powerup Chime', frequency: 440 }
];

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
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'materials' | 'textures' | 'scenes' | 'audio'>('models');
  const [publicManifest, setPublicManifest] = useState<PublicAssetManifest>({
    models: [],
    textures: [],
    hdris: [],
    scenes: []
  });
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const textureFileInputRef = useRef<HTMLInputElement>(null);

  const fetchPublicAssets = async () => {
    setIsLoadingPublic(true);
    try {
      const manifest = await AssetManager.getInstance().loadPublicAssetsManifest();
      setPublicManifest(manifest);
    } catch (e) {
      console.warn('Failed loading public asset manifest:', e);
    } finally {
      setIsLoadingPublic(false);
    }
  };

  useEffect(() => {
    fetchPublicAssets();
  }, []);

  // Click public model to load into scene
  const handleSelectPublicModel = async (item: PublicAssetItem) => {
    try {
      const fetchUrl = item.url || (item.path.startsWith('/') ? item.path : `/${item.path}`);
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const blob = await res.blob();
      const filename = item.path.split('/').pop() || `${item.id}.glb`;
      const file = new File([blob], filename, { type: 'model/gltf-binary' });
      onImportGLBFile(file);
    } catch (err: any) {
      console.error('Failed to load public model:', err);
    }
  };

  // Simple web audio synth preview
  const playBeep = (freq: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn('Audio preview not supported in this environment');
    }
  };

  return (
    <div
      id="asset-browser-panel"
      className="bg-[#181a20] border-t border-[#282b33] flex flex-col transition-all duration-200 select-none text-xs text-gray-300"
      style={{ height: isCollapsed ? '32px' : '160px' }}
    >
      {/* Header Tabs */}
      <div className="h-8 px-3 border-b border-[#282b33] bg-[#15171d] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto">
          <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px] mr-2 flex items-center gap-1.5 shrink-0">
            <Folder size={13} className="text-cyan-400" /> modcx3D Assets
          </span>

          <button
            onClick={() => setActiveTab('models')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'models' ? 'bg-[#242832] text-cyan-300 font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Box size={12} /> Models {publicManifest.models.length > 0 && `(${publicManifest.models.length})`}
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'materials' ? 'bg-[#242832] text-amber-300 font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Palette size={12} /> Materials
          </button>
          <button
            onClick={() => setActiveTab('textures')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'textures' ? 'bg-[#242832] text-emerald-300 font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ImageIcon size={12} /> Textures
          </button>
          <button
            onClick={() => setActiveTab('scenes')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'scenes' ? 'bg-[#242832] text-indigo-300 font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileCode2 size={12} /> Scenes
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'audio' ? 'bg-[#242832] text-purple-300 font-medium' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Volume2 size={12} /> Audio
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchPublicAssets}
            title="Refresh public folder assets"
            className="p-1 hover:bg-[#282c35] text-gray-400 hover:text-cyan-300 rounded transition-colors"
          >
            <RefreshCw size={12} className={isLoadingPublic ? 'animate-spin' : ''} />
          </button>

          {activeTab === 'models' && (
            <button
              onClick={() => modelFileInputRef.current?.click()}
              className="px-2 py-0.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 rounded flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <Upload size={11} /> Import GLB / GLTF
            </button>
          )}

          {activeTab === 'textures' && (
            <button
              onClick={() => textureFileInputRef.current?.click()}
              className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 rounded flex items-center gap-1 text-[11px] font-medium transition-colors"
            >
              <Upload size={11} /> Upload Texture
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

      {/* Main Content Area */}
      {!isCollapsed && (
        <div className="flex-1 p-2.5 overflow-x-auto overflow-y-hidden flex items-center gap-3">
          {/* Progress Overlay if uploading */}
          {importProgress !== null && (
            <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/50 rounded-lg p-3 min-w-[220px]">
              <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <span className="font-semibold text-cyan-200 text-xs">Importing 3D Model...</span>
                <div className="w-32 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all" style={{ width: `${importProgress}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* MODELS TAB */}
          {activeTab === 'models' && (
            <>
              {publicManifest.models.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectPublicModel(m)}
                  title={`Click to load ${m.name} from public folder`}
                  className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-cyan-500 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform">
                    <Box size={18} />
                  </div>
                  <span className="font-medium text-gray-200 text-[11px] truncate w-full">{m.name}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">/public/models</span>
                </div>
              ))}

              {publicManifest.models.length === 0 && (
                <div className="flex items-center gap-3 bg-[#13151b] border border-[#262a34] rounded-lg px-4 py-2.5 text-xs text-gray-400">
                  <FolderOpen size={18} className="text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-gray-200 font-medium">Public Models Directory Connected</div>
                    <div className="text-[11px] text-gray-500">
                      Place <span className="text-cyan-300 font-mono">.glb/.gltf</span> models in <span className="text-gray-300 font-mono">/public/models/</span> or click <span className="text-cyan-300 font-medium">Import GLB / GLTF</span> above.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* MATERIALS TAB */}
          {activeTab === 'materials' && (
            <>
              {MATERIAL_PRESETS.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => onApplyMaterialPreset(mat)}
                  title={`Apply ${mat.name} to selected object`}
                  className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-amber-400 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                >
                  <div
                    className="w-9 h-9 rounded-full border border-white/20 mb-1.5 shadow-inner group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: mat.color }}
                  />
                  <span className="font-medium text-gray-200 text-[11px] truncate w-full">{mat.name}</span>
                  <span className="text-[10px] text-gray-500">Preset</span>
                </div>
              ))}
            </>
          )}

          {/* TEXTURES TAB */}
          {activeTab === 'textures' && (
            <>
              {publicManifest.textures.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onApplyPresetTexture(t.id)}
                  title={`Apply ${t.name} from public folder`}
                  className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-emerald-400 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                >
                  <img
                    src={t.url || t.path}
                    alt={t.name}
                    className="w-10 h-10 rounded border border-[#3b4252] object-cover mb-1.5 group-hover:scale-105 transition-transform"
                  />
                  <span className="font-medium text-gray-200 text-[11px] truncate w-full">{t.name}</span>
                  <span className="text-[10px] text-emerald-400">/public/textures</span>
                </div>
              ))}

              {customTextures.map((ct) => (
                <div
                  key={ct.id}
                  onClick={() => onApplyPresetTexture(ct.id)}
                  title={`Apply ${ct.name} to selected object`}
                  className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-emerald-400 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                >
                  <img
                    src={ct.url}
                    alt={ct.name}
                    className="w-10 h-10 rounded border border-[#3b4252] object-cover mb-1.5 group-hover:scale-105 transition-transform"
                  />
                  <span className="font-medium text-gray-200 text-[11px] truncate w-full">{ct.name}</span>
                  <span className="text-[10px] text-emerald-400">Custom</span>
                </div>
              ))}

              {publicManifest.textures.length === 0 && customTextures.length === 0 && (
                <div className="flex items-center gap-3 bg-[#13151b] border border-[#262a34] rounded-lg px-4 py-2.5 text-xs text-gray-400">
                  <FolderOpen size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-gray-200 font-medium">Public Textures Directory Connected</div>
                    <div className="text-[11px] text-gray-500">
                      Place texture images in <span className="text-gray-300 font-mono">/public/textures/</span> or click <span className="text-emerald-300 font-medium">Upload Texture</span>.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* SCENES TAB */}
          {activeTab === 'scenes' && (
            <>
              {publicManifest.scenes.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onLoadSampleScene(s.id)}
                  title={`Load ${s.name} from public folder`}
                  className="w-36 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-indigo-400 rounded-lg flex flex-col items-center justify-center p-2.5 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform">
                    <Sparkles size={16} />
                  </div>
                  <span className="font-medium text-gray-200 text-[11px] truncate w-full">{s.name}</span>
                  <span className="text-[10px] text-indigo-400">/public/scenes</span>
                </div>
              ))}

              {publicManifest.scenes.length === 0 && (
                <div className="flex items-center gap-3 bg-[#13151b] border border-[#262a34] rounded-lg px-4 py-2.5 text-xs text-gray-400">
                  <FolderOpen size={18} className="text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-gray-200 font-medium">Public Scenes Directory Connected</div>
                    <div className="text-[11px] text-gray-500">
                      Place scene <span className="text-indigo-300 font-mono">.json</span> files in <span className="text-gray-300 font-mono">/public/scenes/</span> or export scenes from the top menu.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && (
            <>
              {AUDIO_PRESETS.map((snd) => (
                <div
                  key={snd.id}
                  onClick={() => playBeep(snd.frequency)}
                  title="Click to preview SFX"
                  className="w-28 h-24 bg-[#12141a] hover:bg-[#20242e] border border-[#2d313b] hover:border-purple-400 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all shrink-0 group text-center shadow-sm"
                >
                  <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-1.5 group-hover:scale-110 transition-transform">
                    <Volume2 size={16} />
                  </div>
                  <span className="font-medium text-gray-200 text-[11px] truncate w-full">{snd.name}</span>
                  <span className="text-[10px] text-purple-400 font-mono">Audio Clip</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
