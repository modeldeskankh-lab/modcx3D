import React, { useState } from 'react';
import { Box, Layers, ListTree, Upload, X, Check, FileCode2, Sparkles } from 'lucide-react';

interface GLBImportModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onConfirmImport: (file: File, mode: 'combined' | 'layers') => void;
}

export const GLBImportModal: React.FC<GLBImportModalProps> = ({
  isOpen,
  file,
  onClose,
  onConfirmImport
}) => {
  const [selectedMode, setSelectedMode] = useState<'combined' | 'layers'>('combined');

  if (!isOpen || !file) return null;

  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

  const handleImport = () => {
    onConfirmImport(file, selectedMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-[#181a20] border border-[#2d323e] rounded-xl shadow-2xl text-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#14161c] border-b border-[#282c37] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                GLB / GLTF Import Options
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950/80 text-cyan-300 rounded border border-cyan-800/40">
                  3D Asset
                </span>
              </h3>
              <p className="text-xs text-gray-400 truncate max-w-xs">
                {file.name} ({fileSizeMB} MB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252a35] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            Choose how you want to structure <strong className="text-white">{file.name}</strong> inside the scene and hierarchy tree:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* Combined Import Card */}
            <div
              onClick={() => setSelectedMode('combined')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                selectedMode === 'combined'
                  ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/50'
                  : 'bg-[#1e222b] border-[#2d323f] hover:bg-[#232833] hover:border-gray-500'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  selectedMode === 'combined'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-[#282d38] text-gray-400'
                }`}
              >
                <Box size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
                    Combined Import
                  </h4>
                  {selectedMode === 'combined' && (
                    <span className="px-2 py-0.5 bg-cyan-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center gap-1">
                      <Check size={10} /> Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                  Imports the 3D model as a single optimized unified object. Best performance for props, environment assets, and characters.
                </p>
              </div>
            </div>

            {/* Layers (Hierarchy) Import Card */}
            <div
              onClick={() => setSelectedMode('layers')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                selectedMode === 'layers'
                  ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-950/50'
                  : 'bg-[#1e222b] border-[#2d323f] hover:bg-[#232833] hover:border-gray-500'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  selectedMode === 'layers'
                    ? 'bg-indigo-500 text-slate-950 font-bold'
                    : 'bg-[#282d38] text-gray-400'
                }`}
              >
                <ListTree size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
                    Layers (Hierarchy) Import
                  </h4>
                  {selectedMode === 'layers' && (
                    <span className="px-2 py-0.5 bg-indigo-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center gap-1">
                      <Check size={10} /> Selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                  Extracts all sub-meshes, nodes, and materials as separate child objects under a parent folder in the Left Panel. Allows selecting, moving, hiding, or re-parenting individual sub-parts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#14161c] border-t border-[#282c37] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#222630] hover:bg-[#2b303d] text-gray-300 hover:text-white text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            Import as {selectedMode === 'combined' ? 'Combined Model' : 'Layer Hierarchy'}
          </button>
        </div>
      </div>
    </div>
  );
};
