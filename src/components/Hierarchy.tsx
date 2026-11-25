import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Search,
  Box,
  Sun,
  Camera,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreVertical,
  FolderSearch,
  Waves,
  Wind,
  Droplets,
  Gamepad,
  UserCheck,
  Navigation,
  Folder,
  FolderPlus,
  FolderMinus,
  ListTree,
  CornerDownRight,
  ArrowUpRight
} from 'lucide-react';
import { SceneObjectData } from '../types/editor';

interface HierarchyProps {
  objects: SceneObjectData[];
  selectedId: string | null;
  onSelectObject: (id: string) => void;
  onToggleVisibility: (id: string, currentVisible: boolean) => void;
  onToggleLock: (id: string, currentLocked: boolean) => void;
  onRenameObject: (id: string, newName: string) => void;
  onDuplicateObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  onAddPrimitive: (type: 'cube' | 'sphere' | 'cylinder' | 'plane') => void;
  onAddWater?: (type: 'ocean' | 'river' | 'lake') => void;
  onAddCharacterController?: (type: 'fpv' | 'tpv' | 'drone') => void;
  onContextMenuObject?: (obj: SceneObjectData, e: React.MouseEvent) => void;
  onContextMenuEmpty?: (e: React.MouseEvent) => void;
  onExploreFolders?: (obj: SceneObjectData) => void;
  onCreateFolder?: (name?: string, parentId?: string) => void;
  onReparentObject?: (childId: string, parentId: string | null) => void;
  onUngroupFolder?: (folderId: string) => void;
}

export const Hierarchy: React.FC<HierarchyProps> = ({
  objects,
  selectedId,
  onSelectObject,
  onToggleVisibility,
  onToggleLock,
  onRenameObject,
  onDuplicateObject,
  onDeleteObject,
  onAddPrimitive,
  onAddWater,
  onAddCharacterController,
  onContextMenuObject,
  onContextMenuEmpty,
  onExploreFolders,
  onCreateFolder,
  onReparentObject,
  onUngroupFolder
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSceneExpanded, setIsSceneExpanded] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Track collapsed/expanded state of folders and models with children (DEFAULT: COLLAPSED / CLOSED)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  const toggleNodeExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isNodeExpanded = (id: string) => {
    // Expand automatically if searching
    if (search.trim()) return true;
    return !!expandedNodes[id]; // Default CLOSED/COLLAPSED until user clicks to open
  };

  const startRename = (obj: SceneObjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(obj.id);
    setEditingName(obj.name);
  };

  const commitRename = (id: string) => {
    if (editingName.trim()) {
      onRenameObject(id, editingName.trim());
    }
    setEditingId(null);
  };

  const getObjectIcon = (obj: SceneObjectData) => {
    const isFolder =
      obj.type === 'group' ||
      obj.userData?.isFolder ||
      obj.userData?.isPrefabRoot ||
      obj.userData?.importMode === 'layers';

    if (isFolder) {
      return <Folder size={13} className="text-amber-400 shrink-0" />;
    }
    if (obj.type === 'water' || obj.meshType === 'water' || !!obj.water) {
      return <Waves size={13} className="text-cyan-400 shrink-0" />;
    }
    if (obj.type === 'light') {
      return <Sun size={13} className="text-yellow-400 shrink-0" />;
    }
    if (obj.type === 'camera') {
      return <Camera size={13} className="text-indigo-400 shrink-0" />;
    }
    if (obj.type === 'group') {
      return <Layers size={13} className="text-gray-400 shrink-0" />;
    }
    if (obj.type === 'model' || !!obj.modelAssetId || !!obj.modelMetadata) {
      return <Box size={13} className="text-cyan-400 shrink-0" />;
    }
    return <Box size={13} className="text-slate-400 shrink-0" />;
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, obj: SceneObjectData) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', obj.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverNodeId !== targetId) {
      setDragOverNodeId(targetId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverNodeId(null);
  };

  const handleDrop = (e: React.DragEvent, targetParentId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverNodeId(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetParentId) {
      onReparentObject?.(draggedId, targetParentId);
    }
  };

  // Filter objects recursively if searching
  const filterObjects = (list: SceneObjectData[]): SceneObjectData[] => {
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();

    return list.filter((obj) => {
      const matchSelf = obj.name.toLowerCase().includes(q);
      const matchChildren = obj.children ? filterObjects(obj.children).length > 0 : false;
      return matchSelf || matchChildren;
    });
  };

  const filteredList = filterObjects(objects);

  // Render tree node recursively
  const renderItem = (obj: SceneObjectData, depth = 0) => {
    const isSelected = selectedId === obj.id;
    const isEditing = editingId === obj.id;
    const hasChildren = obj.children && obj.children.length > 0;
    const expanded = isNodeExpanded(obj.id);
    const isDragOver = dragOverNodeId === obj.id;
    const isFolder = obj.type === 'group' || obj.userData?.isFolder;
    const isLayerRoot = obj.userData?.importMode === 'layers';
    const isModel = obj.type === 'model' || !!obj.modelAssetId || !!obj.modelMetadata;

    return (
      <div key={obj.id} className="select-none">
        <div
          id={`hierarchy-item-${obj.id}`}
          draggable
          onDragStart={(e) => handleDragStart(e, obj)}
          onDragOver={(e) => handleDragOver(e, obj.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, obj.id)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectObject(obj.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectObject(obj.id);
            onContextMenuObject?.(obj, e);
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`group flex items-center justify-between py-1 pr-2 rounded cursor-pointer transition-all ${
            isSelected
              ? 'bg-cyan-600/35 text-cyan-100 font-medium border-l-2 border-cyan-400'
              : isDragOver
              ? 'bg-amber-500/30 border border-amber-400 text-amber-200'
              : 'hover:bg-[#22252e] text-gray-300'
          }`}
        >
          {/* Left: Fold Arrow, Icon & Name */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                onClick={(e) => toggleNodeExpand(obj.id, e)}
                className="p-0.5 hover:bg-[#2e3340] rounded text-gray-400 hover:text-white"
              >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <div className="w-3" />
            )}

            {getObjectIcon(obj)}

            {isEditing ? (
              <input
                type="text"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => commitRename(obj.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(obj.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="bg-[#101216] border border-cyan-500 rounded px-1 text-xs text-white focus:outline-none w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                <span
                  onDoubleClick={(e) => startRename(obj, e)}
                  className="truncate text-[12px]"
                >
                  {obj.name}
                </span>
                {isLayerRoot && (
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-indigo-950/80 text-indigo-300 rounded border border-indigo-800/40 shrink-0 flex items-center gap-0.5">
                    <ListTree size={9} /> Layers
                  </span>
                )}
                {isFolder && !isLayerRoot && (
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-950/60 text-amber-400 rounded border border-amber-800/40 shrink-0">
                    Folder
                  </span>
                )}
                {isModel && !isLayerRoot && (
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-cyan-950/70 text-cyan-400 rounded border border-cyan-800/40 shrink-0">
                    GLB
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            {/* Create Subfolder inside this object */}
            {(isFolder || obj.type === 'group' || isLayerRoot) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFolder?.('Subfolder', obj.id);
                  setExpandedNodes((prev) => ({ ...prev, [obj.id]: true }));
                }}
                title="Create Subfolder inside this folder"
                className="p-1 hover:bg-[#2f3440] rounded text-amber-400 hover:text-amber-300"
              >
                <FolderPlus size={11} />
              </button>
            )}

            {/* If object is inside a folder, allow removing from folder */}
            {obj.parentId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReparentObject?.(obj.id, null);
                }}
                title="Remove from Folder (Unparent to Scene Root)"
                className="p-1 hover:bg-[#2f3440] rounded text-indigo-400 hover:text-indigo-300"
              >
                <ArrowUpRight size={11} />
              </button>
            )}

            {/* Toggle Visibility */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(obj.id, obj.visible);
              }}
              title={obj.visible ? 'Hide Object' : 'Show Object'}
              className="p-1 hover:bg-[#2f3440] rounded text-gray-400 hover:text-white"
            >
              {obj.visible ? <Eye size={11} /> : <EyeOff size={11} className="text-gray-600" />}
            </button>

            {/* Toggle Lock */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(obj.id, !!obj.locked);
              }}
              title={obj.locked ? 'Unlock Object' : 'Lock Object'}
              className="p-1 hover:bg-[#2f3440] rounded text-gray-400 hover:text-white"
            >
              {obj.locked ? <Lock size={11} className="text-amber-400" /> : <Unlock size={11} className="text-gray-500" />}
            </button>

            {/* Delete Object */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteObject(obj.id);
              }}
              title="Delete Object"
              className="p-1 hover:bg-[#2f3440] rounded text-red-400 hover:text-red-300"
            >
              <Trash2 size={11} />
            </button>

            {/* More Context Menu */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj.id);
                onContextMenuObject?.(obj, e);
              }}
              title="More Actions"
              className="p-1 hover:bg-[#2f3440] rounded text-cyan-400 hover:text-cyan-300"
            >
              <MoreVertical size={11} />
            </button>
          </div>
        </div>

        {/* Child Tree Recursive Rendering */}
        {hasChildren && expanded && (
          <div className="space-y-0.5 border-l border-[#282d38] ml-2.5 my-0.5">
            {obj.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="hierarchy-panel"
      onContextMenu={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'hierarchy-empty-area') {
          e.preventDefault();
          onContextMenuEmpty?.(e);
        }
      }}
      className="flex flex-col h-full bg-[#181a20] border-r border-[#282b33] text-gray-200 select-none text-xs"
    >
      {/* Panel Header */}
      <div className="h-9 px-3 border-b border-[#282b33] flex items-center justify-between bg-[#15171d] relative">
        <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Layers size={13} className="text-cyan-400" /> Hierarchy
        </span>
        <div className="flex items-center gap-1">
          {/* Create Folder Header Button */}
          <button
            onClick={() => onCreateFolder?.('New Folder')}
            title="Create New Folder"
            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded flex items-center gap-1 text-[11px]"
          >
            <FolderPlus size={12} /> Folder
          </button>

          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            title="Add GameObject / Water / Player"
            className="p-1 hover:bg-[#282c35] text-gray-400 hover:text-white rounded"
          >
            <Plus size={13} />
          </button>

          {showAddMenu && (
            <div className="absolute top-8 right-2 w-52 bg-[#1f232b] border border-[#333842] rounded shadow-2xl py-1 z-50 text-xs">
              <button
                className="w-full text-left px-2.5 py-1 hover:bg-[#2d323d] flex items-center gap-2 text-amber-300 font-medium"
                onClick={() => {
                  onCreateFolder?.('New Folder');
                  setShowAddMenu(false);
                }}
              >
                <FolderPlus size={13} className="text-amber-400" /> Create New Folder
              </button>

              <div className="border-t border-[#2d323d] my-1" />

              <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-emerald-400 flex items-center justify-between">
                <span>Character Controllers</span>
                <Gamepad size={11} />
              </div>
              <button
                className="w-full text-left px-2.5 py-1 hover:bg-[#2d323d] flex items-center gap-2 text-emerald-200"
                onClick={() => {
                  onAddCharacterController?.('fpv');
                  setShowAddMenu(false);
                }}
              >
                <Gamepad size={12} className="text-emerald-400" /> FPV Player (First Person)
              </button>
              <button
                className="w-full text-left px-2.5 py-1 hover:bg-[#2d323d] flex items-center gap-2 text-emerald-200"
                onClick={() => {
                  onAddCharacterController?.('tpv');
                  setShowAddMenu(false);
                }}
              >
                <UserCheck size={12} className="text-cyan-400" /> TPV Player (Third Person)
              </button>

              <div className="border-t border-[#2d323d] my-1" />
              <div className="px-2.5 py-1 text-[9px] uppercase font-bold text-cyan-400 flex items-center justify-between">
                <span>Water System</span>
                <Waves size={11} />
              </div>
              <button
                className="w-full text-left px-2.5 py-1 hover:bg-[#2d323d] flex items-center gap-2 text-cyan-200"
                onClick={() => {
                  onAddWater?.('ocean');
                  setShowAddMenu(false);
                }}
              >
                <Waves size={12} className="text-cyan-400" /> Ocean Water
              </button>
              <button
                className="w-full text-left px-2.5 py-1 hover:bg-[#2d323d] flex items-center gap-2 text-cyan-200"
                onClick={() => {
                  onAddWater?.('river');
                  setShowAddMenu(false);
                }}
              >
                <Wind size={12} className="text-teal-400" /> River Water
              </button>

              <div className="border-t border-[#2d323d] my-1" />
              <div className="px-2.5 py-1 text-[9px] uppercase font-semibold text-gray-400">3D Primitives</div>
              <button
                className="w-full text-left px-2.5 py-1 hover:bg-[#2d323d] flex items-center gap-2"
                onClick={() => {
                  onAddPrimitive('cube');
                  setShowAddMenu(false);
                }}
              >
                <Box size={12} className="text-cyan-400" /> Cube
              </button>
              <button
                className="w-full text-left px-2.5 py-1 hover:bg-[#2d323d] flex items-center gap-2"
                onClick={() => {
                  onAddPrimitive('sphere');
                  setShowAddMenu(false);
                }}
              >
                <div className="w-3 h-3 rounded-full border border-red-400" /> Sphere
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-[#282b33] bg-[#16181e]">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2 text-gray-500" />
          <input
            type="text"
            placeholder="Search hierarchy & folders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101216] border border-[#2d313b] rounded pl-7 pr-2 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tree Content Drop Area */}
      <div
        id="hierarchy-empty-area"
        onDragOver={(e) => handleDragOver(e, 'scene_root')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
        className={`flex-1 overflow-y-auto py-1 transition-colors ${
          dragOverNodeId === 'scene_root' ? 'bg-cyan-950/20 border-2 border-dashed border-cyan-500/50' : ''
        }`}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenuEmpty?.(e);
        }}
      >
        {/* Scene Root Node */}
        <div className="px-2 py-1 flex items-center justify-between text-gray-400 font-semibold cursor-pointer hover:text-gray-200">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSceneExpanded(!isSceneExpanded)}
              className="p-0.5 hover:bg-[#282c35] rounded"
            >
              {isSceneExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            <span>Scene Root ({filteredList.length})</span>
          </div>

          <button
            onClick={() => onCreateFolder?.('Folder')}
            title="Create Folder in Scene Root"
            className="p-1 hover:bg-[#282c35] text-amber-400 hover:text-amber-300 rounded"
          >
            <FolderPlus size={12} />
          </button>
        </div>

        {/* Objects Recursive List */}
        {isSceneExpanded && (
          <div className="space-y-0.5 px-1">
            {filteredList.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 italic text-[11px]">
                {search ? 'No matching objects found' : 'Scene is empty. Drag GLB or create folder above.'}
              </div>
            ) : (
              filteredList.map((obj) => renderItem(obj, 0))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
