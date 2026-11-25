import React, { useState, useRef } from 'react';
import {
  X,
  FolderOpen,
  RefreshCw,
  Download,
  Copy,
  Check,
  Box,
  Layers,
  HardDrive,
  FileCode,
  FileUp,
  Sliders,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { SceneObjectData } from '../types/editor';

interface AssetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedObject: SceneObjectData | null;
  onReplaceModel: (file: File) => void;
  onReimportModel: () => void;
  onExportGLB: () => void;
  onUpdateFolderLocation: (location: string) => void;
}

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedObject,
  onReplaceModel,
  onReimportModel,
  onExportGLB,
  onUpdateFolderLocation
}) => {
  const [folderPathInput, setFolderPathInput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with selected object
  React.useEffect(() => {
    if (selectedObject) {
      setFolderPathInput(
        selectedObject.folderLocation ||
          selectedObject.modelMetadata?.folderLocation ||
          selectedObject.modelMetadata?.fileLocation ||
          selectedObject.modelUrl ||
          `models/${selectedObject.name}.glb`
      );
    }
  }, [selectedObject]);

  if (!isOpen || !selectedObject) return null;

  const metadata = selectedObject.modelMetadata;
  const fileName = metadata?.filename || `${selectedObject.name}.glb`;
  const fileSize = metadata?.fileSize || 'Unknown size';
  const triangles = metadata?.triangleCount ?? 0;
  const vertices = metadata?.vertexCount ?? 0;
  const meshes = metadata?.meshCount ?? 1;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(folderPathInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLocation = () => {
    onUpdateFolderLocation(folderPathInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      id="asset-details-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-[#16181f] border border-[#2e3340] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#282d38] bg-[#12141a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Box size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Model Asset Controller & Details</h3>
              <p className="text-[11px] text-gray-400">Inspect, reimport, replace, and configure source folder paths</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252a36] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs text-gray-300 overflow-y-auto max-h-[75vh]">
          {/* File Name & Format Badge */}
          <div className="flex items-center justify-between p-3 bg-[#111317] border border-[#282c38] rounded-lg">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Asset Name / File</span>
              <div className="text-sm font-semibold text-cyan-300">{fileName}</div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">File Size</span>
              <div className="font-mono text-xs text-gray-300">{fileSize}</div>
            </div>
          </div>

          {/* Computer Folder Location / URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
                <FolderOpen size={13} className="text-amber-400" />
                Computer Folder Location / Source URL
              </label>
              <span className="text-[10px] text-gray-500">Saved in Scene JSON</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={folderPathInput}
                onChange={(e) => setFolderPathInput(e.target.value)}
                placeholder="e.g. C:/Projects/Assets/Models/Meshy_AI_Anatomy.glb"
                className="flex-1 bg-[#101216] border border-[#2a2f3a] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none transition-colors"
              />
              <button
                onClick={handleCopyPath}
                title="Copy path to clipboard"
                className="px-2.5 py-2 bg-[#20242e] hover:bg-[#2b303d] border border-[#2e3340] rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
              <button
                onClick={handleSaveLocation}
                title="Save folder location"
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1 shadow"
              >
                {savedSuccess ? 'Saved!' : 'Save'}
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              This path will be preserved in your exported scene <code className="text-cyan-400">.json</code> script so you can re-link or synchronize assets directly.
            </p>
          </div>

          {/* 3D Geometry Metrics */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[#111317] border border-[#282c38] rounded-lg text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-medium">Polygons / Tris</span>
              <div className="text-sm font-mono font-bold text-amber-300">{triangles.toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-medium">Vertices</span>
              <div className="text-sm font-mono font-bold text-emerald-300">{vertices.toLocaleString()}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase font-medium">Sub-Meshes</span>
              <div className="text-sm font-mono font-bold text-cyan-300">{meshes}</div>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">File Actions</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-[#1f2430] hover:bg-cyan-700/80 border border-cyan-800/50 hover:border-cyan-500 rounded-lg text-cyan-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-all shadow"
              >
                <RefreshCw size={14} className="text-cyan-400" />
                <span>Replace Model File...</span>
              </button>
              <button
                onClick={() => {
                  onReimportModel();
                  onClose();
                }}
                className="py-2.5 px-3 bg-[#1f2430] hover:bg-emerald-700/80 border border-emerald-800/50 hover:border-emerald-500 rounded-lg text-emerald-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-all shadow"
              >
                <RefreshCw size={14} className="text-emerald-400" />
                <span>Reimport / Reload</span>
              </button>
              <button
                onClick={() => {
                  onExportGLB();
                  onClose();
                }}
                className="py-2.5 px-3 bg-[#1f2430] hover:bg-indigo-700/80 border border-indigo-800/50 hover:border-indigo-500 rounded-lg text-indigo-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-all shadow"
              >
                <Download size={14} className="text-indigo-400" />
                <span>Export .GLB File</span>
              </button>
              <button
                onClick={handleCopyPath}
                className="py-2.5 px-3 bg-[#1f2430] hover:bg-[#2b3240] border border-[#2e3340] rounded-lg text-gray-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Copy size={14} />
                <span>Copy Path</span>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onReplaceModel(e.target.files[0]);
                e.target.value = '';
                onClose();
              }
            }}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#282d38] bg-[#12141a] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#252936] hover:bg-[#323846] text-gray-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
