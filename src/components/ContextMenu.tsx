import React, { useEffect, useRef, useState } from 'react';
import {
  RefreshCw,
  FolderSearch,
  Download,
  Copy,
  Focus,
  CopyPlus,
  Edit2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Box,
  Sun,
  FileUp,
  Maximize2,
  Waves,
  Wind,
  Droplets,
  Gamepad,
  UserCheck,
  Navigation,
  Search,
  X
} from 'lucide-react';
import { SceneObjectData } from '../types/editor';

export interface ContextMenuProps {
  position: { x: number; y: number } | null;
  targetObject: SceneObjectData | null;
  onClose: () => void;
  onReplaceGLB?: (targetObject: SceneObjectData) => void;
  onReimport?: (targetObject: SceneObjectData) => void;
  onExploreFolders?: (targetObject: SceneObjectData) => void;
  onExportGLB?: (targetObject: SceneObjectData) => void;
  onCopyPath?: (targetObject: SceneObjectData) => void;
  onFocus?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onToggleLock?: () => void;
  onToggleVisibility?: () => void;
  onDelete?: () => void;
  onAddPrimitive?: (type: 'cube' | 'sphere' | 'cylinder' | 'plane' | 'torus') => void;
  onAddWater?: (type: 'ocean' | 'river' | 'lake') => void;
  onAddCharacterController?: (type: 'fpv' | 'tpv' | 'drone') => void;
  onAddLight?: (type: 'directional' | 'point' | 'spot' | 'ambient') => void;
  onImportModel?: () => void;
  onFrameAll?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  targetObject,
  onClose,
  onReplaceGLB,
  onReimport,
  onExploreFolders,
  onExportGLB,
  onCopyPath,
  onFocus,
  onDuplicate,
  onRename,
  onToggleLock,
  onToggleVisibility,
  onDelete,
  onAddPrimitive,
  onAddWater,
  onAddCharacterController,
  onAddLight,
  onImportModel,
  onFrameAll
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Close on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Autofocus search input on render
  useEffect(() => {
    if (position && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setSearchQuery(''); // Reset search on reopen
  }, [position]);

  if (!position) return null;

  const isModelOrMesh =
    targetObject &&
    (targetObject.type === 'model' ||
      targetObject.type === 'mesh' ||
      !!targetObject.modelAssetId ||
      !!targetObject.modelMetadata);

  // Define searchable actions list
  const getSearchableActions = () => {
    if (targetObject) {
      return [
        ...(isModelOrMesh ? [
          { label: 'Replace Model (GLB/GLTF)...', icon: <RefreshCw size={13} className="text-cyan-400 shrink-0" />, action: () => onReplaceGLB?.(targetObject) },
          { label: 'Reimport / Reload Model', icon: <RefreshCw size={13} className="text-emerald-400 shrink-0" />, action: () => onReimport?.(targetObject) },
          { label: 'Explore in Folders / Details', icon: <FolderSearch size={13} className="text-amber-400 shrink-0" />, action: () => onExploreFolders?.(targetObject) },
          { label: 'Export / Download .GLB', icon: <Download size={13} className="text-indigo-400 shrink-0" />, action: () => onExportGLB?.(targetObject) },
          ...(targetObject.folderLocation ? [
            { label: 'Copy File/Folder Path', icon: <Copy size={13} className="text-gray-400 shrink-0" />, action: () => onCopyPath?.(targetObject) }
          ] : [])
        ] : []),
        { label: 'Focus in View', icon: <Focus size={13} className="text-gray-400 shrink-0" />, shortcut: 'F', action: () => onFocus?.() },
        { label: 'Duplicate Object', icon: <CopyPlus size={13} className="text-gray-400 shrink-0" />, shortcut: 'Ctrl+D', action: () => onDuplicate?.() },
        { label: 'Rename Object', icon: <Edit2 size={13} className="text-gray-400 shrink-0" />, shortcut: 'F2', action: () => onRename?.() },
        { label: targetObject.locked ? 'Unlock Object' : 'Lock Object', icon: targetObject.locked ? <Unlock size={13} className="text-amber-400 shrink-0" /> : <Lock size={13} className="text-gray-400 shrink-0" />, action: () => onToggleLock?.() },
        { label: targetObject.visible ? 'Hide Object' : 'Show Object', icon: targetObject.visible ? <EyeOff size={13} className="text-gray-400 shrink-0" /> : <Eye size={13} className="text-gray-400 shrink-0" />, action: () => onToggleVisibility?.() },
        { label: 'Delete Object', icon: <Trash2 size={13} className="text-red-400 shrink-0" />, shortcut: 'Del', action: () => onDelete?.() }
      ];
    } else {
      return [
        { label: 'FPV First Person (Player Rig)', icon: <Gamepad size={13} className="text-emerald-400 shrink-0" />, action: () => onAddCharacterController?.('fpv') },
        { label: 'TPV Third Person (Player Rig)', icon: <UserCheck size={13} className="text-cyan-400 shrink-0" />, action: () => onAddCharacterController?.('tpv') },
        { label: 'Drone Flight Rig (Player Rig)', icon: <Navigation size={13} className="text-amber-400 shrink-0" />, action: () => onAddCharacterController?.('drone') },
        
        { label: 'Ocean / Sea Water (Water System)', icon: <Waves size={13} className="text-cyan-400 shrink-0" />, action: () => onAddWater?.('ocean') },
        { label: 'River Water Flow (Water System)', icon: <Wind size={13} className="text-teal-400 shrink-0" />, action: () => onAddWater?.('river') },
        { label: 'Lake Water (Water System)', icon: <Droplets size={13} className="text-blue-400 shrink-0" />, action: () => onAddWater?.('lake') },

        { label: 'Add Cube (3D Primitive)', icon: <Box size={13} className="text-cyan-400 shrink-0" />, action: () => onAddPrimitive?.('cube') },
        { label: 'Add Sphere (3D Primitive)', icon: <Box size={13} className="text-cyan-400 shrink-0" />, action: () => onAddPrimitive?.('sphere') },
        { label: 'Add Cylinder (3D Primitive)', icon: <Box size={13} className="text-cyan-400 shrink-0" />, action: () => onAddPrimitive?.('cylinder') },
        { label: 'Add Plane (3D Primitive)', icon: <Box size={13} className="text-cyan-400 shrink-0" />, action: () => onAddPrimitive?.('plane') },
        { label: 'Add Torus (3D Primitive)', icon: <Box size={13} className="text-cyan-400 shrink-0" />, action: () => onAddPrimitive?.('torus') },

        { label: 'Add Directional Light', icon: <Sun size={13} className="text-yellow-400 shrink-0" />, action: () => onAddLight?.('directional') },
        { label: 'Add Point Light', icon: <Sun size={13} className="text-yellow-400 shrink-0" />, action: () => onAddLight?.('point') },
        { label: 'Add Spot Light', icon: <Sun size={13} className="text-yellow-400 shrink-0" />, action: () => onAddLight?.('spot') },
        { label: 'Add Ambient Light', icon: <Sun size={13} className="text-yellow-400 shrink-0" />, action: () => onAddLight?.('ambient') },

        { label: 'Import GLB / GLTF Model...', icon: <FileUp size={13} className="text-cyan-400 shrink-0" />, action: () => onImportModel?.() },
        { label: 'Frame All in View', icon: <Maximize2 size={13} className="text-gray-400 shrink-0" />, shortcut: 'Shift+F', action: () => onFrameAll?.() }
      ];
    }
  };

  const searchableActions = getSearchableActions();
  const filteredActions = searchableActions.filter((act) =>
    act.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clamping positions with search & scroll support
  const menuWidth = 240;
  const menuHeight = 350; // Constrained height (Search bar + Scroll list)
  const x = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const y = Math.min(position.y, window.innerHeight - menuHeight - 10);

  return (
    <div
      id="editor-context-menu"
      ref={menuRef}
      style={{ left: `${Math.max(10, x)}px`, top: `${Math.max(10, y)}px` }}
      className="fixed z-50 w-60 bg-[#16181f]/95 border border-[#2d313c] rounded-lg shadow-2xl py-1 text-xs text-gray-200 select-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 flex flex-col"
    >
      {/* Search Input Box */}
      <div className="px-2 py-1.5 border-b border-[#232732] flex items-center gap-1.5">
        <Search size={12} className="text-gray-400 shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search items & actions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-[11px] text-white focus:outline-none placeholder-gray-500"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              searchInputRef.current?.focus();
            }}
            className="p-0.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Target Object Header if active and search is empty */}
      {!searchQuery && targetObject && (
        <div className="px-3 py-1.5 bg-[#12141a]/90 text-[10px] font-semibold text-cyan-400 flex items-center justify-between border-b border-[#232732]">
          <div className="flex items-center gap-1.5 truncate">
            <Box size={12} className="text-cyan-400 shrink-0" />
            <span className="truncate">{targetObject.name}</span>
          </div>
          <span className="text-[9px] text-gray-500 uppercase font-mono">{targetObject.type}</span>
        </div>
      )}

      {/* Main Action Area (Scrollable with Mouse Wheel support) */}
      <div className="max-h-[280px] overflow-y-auto custom-scrollbar flex-1 py-1 divide-y divide-[#232732]">
        {searchQuery ? (
          /* Filtered Results List */
          <div className="py-0.5">
            {filteredActions.length > 0 ? (
              filteredActions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-cyan-600 hover:text-white transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.shortcut && (
                    <span className="text-[9px] text-gray-400 group-hover:text-cyan-100">{item.shortcut}</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-gray-500 text-[11px]">
                No matching actions found.
              </div>
            )}
          </div>
        ) : (
          /* Standard Structured Categorical View */
          <>
            {/* Model Actions */}
            {isModelOrMesh && targetObject && (
              <div className="py-1">
                <div className="px-2.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                  Model & Asset Actions
                </div>
                <button
                  onClick={() => {
                    onReplaceGLB?.(targetObject);
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] transition-colors"
                >
                  <RefreshCw size={13} className="text-cyan-400" />
                  <span>Replace Model (GLB/GLTF)...</span>
                </button>
                <button
                  onClick={() => {
                    onReimport?.(targetObject);
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] transition-colors"
                >
                  <RefreshCw size={13} className="text-emerald-400" />
                  <span>Reimport / Reload Model</span>
                </button>
                <button
                  onClick={() => {
                    onExploreFolders?.(targetObject);
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] transition-colors"
                >
                  <FolderSearch size={13} className="text-amber-400" />
                  <span>Explore in Folders / Details</span>
                </button>
                <button
                  onClick={() => {
                    onExportGLB?.(targetObject);
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] transition-colors"
                >
                  <Download size={13} className="text-indigo-400" />
                  <span>Export / Download .GLB</span>
                </button>
                {targetObject.folderLocation && (
                  <button
                    onClick={() => {
                      onCopyPath?.(targetObject);
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] transition-colors"
                  >
                    <Copy size={13} className="text-gray-400" />
                    <span className="truncate">Copy File/Folder Path</span>
                  </button>
                )}
              </div>
            )}

            {/* Standard Object Actions */}
            {targetObject && (
              <div className="py-1">
                <button
                  onClick={() => {
                    onFocus?.();
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#252936] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Focus size={13} className="text-gray-400" /> Focus in View
                  </span>
                  <span className="text-[10px] text-gray-500">F</span>
                </button>
                <button
                  onClick={() => {
                    onDuplicate?.();
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#252936] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CopyPlus size={13} className="text-gray-400" /> Duplicate
                  </span>
                  <span className="text-[10px] text-gray-500">Ctrl+D</span>
                </button>
                <button
                  onClick={() => {
                    onRename?.();
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#252936] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Edit2 size={13} className="text-gray-400" /> Rename
                  </span>
                  <span className="text-[10px] text-gray-500">F2</span>
                </button>
                <button
                  onClick={() => {
                    onToggleLock?.();
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#252936] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {targetObject.locked ? (
                      <Unlock size={13} className="text-amber-400" />
                    ) : (
                      <Lock size={13} className="text-gray-400" />
                    )}
                    {targetObject.locked ? 'Unlock' : 'Lock'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onToggleVisibility?.();
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#252936] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {targetObject.visible ? (
                      <EyeOff size={13} className="text-gray-400" />
                    ) : (
                      <Eye size={13} className="text-gray-400" />
                    )}
                    {targetObject.visible ? 'Hide Object' : 'Show Object'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onDelete?.();
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-red-600/80 hover:text-white text-red-400 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 size={13} /> Delete Object
                  </span>
                  <span className="text-[10px] text-red-300">Del</span>
                </button>
              </div>
            )}

            {/* Empty Space Actions */}
            {!targetObject && (
              <>
                {/* Character Rigs */}
                <div className="py-1">
                  <div className="px-2.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                    Add Player Rig
                  </div>
                  <button
                    onClick={() => {
                      onAddCharacterController?.('fpv');
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] text-emerald-200 transition-colors"
                  >
                    <Gamepad size={13} className="text-emerald-400" /> FPV First Person
                  </button>
                  <button
                    onClick={() => {
                      onAddCharacterController?.('tpv');
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] text-cyan-200 transition-colors"
                  >
                    <UserCheck size={13} className="text-cyan-400" /> TPV Third Person
                  </button>
                  <button
                    onClick={() => {
                      onAddCharacterController?.('drone');
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] text-amber-200 transition-colors"
                  >
                    <Navigation size={13} className="text-amber-400" /> Drone Flight Rig
                  </button>
                </div>

                {/* Water Systems */}
                <div className="py-1">
                  <div className="px-2.5 py-0.5 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                    Water System
                  </div>
                  <button
                    onClick={() => {
                      onAddWater?.('ocean');
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] text-cyan-200 transition-colors"
                  >
                    <Waves size={13} className="text-cyan-400" /> Ocean / Sea Water
                  </button>
                  <button
                    onClick={() => {
                      onAddWater?.('river');
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] text-teal-200 transition-colors"
                  >
                    <Wind size={13} className="text-teal-400" /> River Water (Flow)
                  </button>
                  <button
                    onClick={() => {
                      onAddWater?.('lake');
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] text-blue-200 transition-colors"
                  >
                    <Droplets size={13} className="text-blue-400" /> Lake Water
                  </button>
                </div>

                {/* primitives */}
                <div className="py-1">
                  <div className="px-2.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Add 3D Primitive
                  </div>
                  {(['cube', 'sphere', 'cylinder', 'plane', 'torus'] as const).map((mesh) => (
                    <button
                      key={mesh}
                      onClick={() => {
                        onAddPrimitive?.(mesh);
                        onClose();
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] capitalize transition-colors"
                    >
                      <Box size={13} className="text-cyan-400" /> Add {mesh}
                    </button>
                  ))}
                </div>

                {/* lights */}
                <div className="py-1">
                  <div className="px-2.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    Add Light
                  </div>
                  {(['directional', 'point', 'spot', 'ambient'] as const).map((lType) => (
                    <button
                      key={lType}
                      onClick={() => {
                        onAddLight?.(lType);
                        onClose();
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#252936] capitalize transition-colors"
                    >
                      <Sun size={13} className="text-yellow-400" /> Add {lType} Light
                    </button>
                  ))}
                </div>

                {/* Import and framing */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      onImportModel?.();
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-cyan-600 hover:text-white transition-colors"
                  >
                    <FileUp size={13} className="text-cyan-400" /> Import GLB / GLTF Model...
                  </button>
                  <button
                    onClick={() => {
                      onFrameAll?.();
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#252936] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Maximize2 size={13} className="text-gray-400" /> Frame All
                    </span>
                    <span className="text-[10px] text-gray-500">Shift+F</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
