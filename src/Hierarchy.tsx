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
  Plus
} from 'lucide-react';
import { SceneObjectData } from './types/editor';

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
  onAddPrimitive
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSceneExpanded, setIsSceneExpanded] = useState(true);

  const filteredObjects = objects.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

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
    if (obj.type === 'light') {
      return <Sun size={13} className="text-yellow-400 shrink-0" />;
    }
    if (obj.type === 'camera') {
      return <Camera size={13} className="text-indigo-400 shrink-0" />;
    }
    if (obj.type === 'group') {
      return <Layers size={13} className="text-gray-400 shrink-0" />;
    }
    return <Box size={13} className="text-cyan-400 shrink-0" />;
  };

  return (
    <div
      id="hierarchy-panel"
      className="flex flex-col h-full bg-[#181a20] border-r border-[#282b33] text-gray-200 select-none text-xs"
    >
      {/* Panel Header */}
      <div className="h-9 px-3 border-b border-[#282b33] flex items-center justify-between bg-[#15171d] shrink-0">
        <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
          Hierarchy
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddPrimitive('cube')}
            title="Add Cube"
            className="p-1 hover:bg-[#282c35] text-gray-400 hover:text-white rounded"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-[#282b33] bg-[#16181e] shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2 text-gray-500" />
          <input
            type="text"
            placeholder="Search hierarchy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#101216] border border-[#2d313b] rounded pl-7 pr-2 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Scene Root Node */}
        <div className="px-2 py-1 flex items-center gap-1.5 text-gray-400 font-semibold cursor-pointer hover:text-gray-200">
          <button
            onClick={() => setIsSceneExpanded(!isSceneExpanded)}
            className="p-0.5 hover:bg-[#282c35] rounded"
          >
            {isSceneExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <span>Scene ({objects.length})</span>
        </div>

        {/* Objects List */}
        {isSceneExpanded && (
          <div className="pl-3 space-y-0.5">
            {filteredObjects.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 italic text-[11px]">
                {search ? 'No matching objects' : 'Empty scene'}
              </div>
            ) : (
              filteredObjects.map((obj) => {
                const isSelected = selectedId === obj.id;
                const isEditing = editingId === obj.id;

                return (
                  <div
                    key={obj.id}
                    id={`hierarchy-item-${obj.id}`}
                    onClick={() => onSelectObject(obj.id)}
                    className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-600/30 text-cyan-200 border-l-2 border-cyan-400 font-medium'
                        : 'hover:bg-[#22252e] text-gray-300'
                    }`}
                  >
                    {/* Left: Icon & Name */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
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
                        <span
                          onDoubleClick={(e) => startRename(obj, e)}
                          className="truncate text-[12px]"
                        >
                          {obj.name}
                        </span>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(obj.id, obj.visible);
                        }}
                        title={obj.visible ? 'Hide Object' : 'Show Object'}
                        className="p-1 hover:bg-[#2f3440] rounded text-gray-400 hover:text-white"
                      >
                        {obj.visible ? (
                          <Eye size={12} />
                        ) : (
                          <EyeOff size={12} className="text-gray-600" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLock(obj.id, !!obj.locked);
                        }}
                        title={obj.locked ? 'Unlock Object' : 'Lock Object'}
                        className="p-1 hover:bg-[#2f3440] rounded text-gray-400 hover:text-white"
                      >
                        {obj.locked ? (
                          <Lock size={12} className="text-amber-400" />
                        ) : (
                          <Unlock size={12} className="text-gray-500" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateObject(obj.id);
                        }}
                        title="Duplicate (Ctrl+D)"
                        className="p-1 hover:bg-[#2f3440] rounded text-gray-400 hover:text-white"
                      >
                        <Copy size={12} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteObject(obj.id);
                        }}
                        title="Delete (Del)"
                        className="p-1 hover:bg-[#2f3440] rounded text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
