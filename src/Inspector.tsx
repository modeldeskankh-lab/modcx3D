import React from 'react';
import { Box } from 'lucide-react';
import { SceneObjectData, Vec3, MaterialData, LightData } from './types/editor';
import { TransformPanel } from './components/TransformPanel';
import { MaterialPanel } from './components/MaterialPanel';
import { LightPanel } from './components/LightPanel';
import { CameraPanel } from './components/CameraPanel';

interface InspectorProps {
  selectedObject: SceneObjectData | null;
  onUpdateTransform: (pos?: Vec3, rot?: Vec3, scale?: Vec3) => void;
  onUpdateMaterial: (updates: Partial<MaterialData>) => void;
  onUpdateLight: (updates: Partial<LightData>) => void;
  onUpdateProperties: (updates: Partial<SceneObjectData>) => void;
  onUploadTexture: (file: File) => void;
  onApplyPresetTexture: (presetId: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedObject,
  onUpdateTransform,
  onUpdateMaterial,
  onUpdateLight,
  onUpdateProperties,
  onUploadTexture,
  onApplyPresetTexture
}) => {
  if (!selectedObject) {
    return (
      <div
        id="inspector-panel"
        className="flex flex-col h-full bg-[#181a20] border-l border-[#282b33] text-gray-400 text-xs p-6 items-center justify-center text-center select-none"
      >
        <Box size={32} className="text-gray-600 mb-2 stroke-[1.5]" />
        <p className="font-medium text-gray-300">No object selected</p>
        <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">
          Select an object in the 3D viewport or from the Hierarchy to view and edit its scene properties.
        </p>
      </div>
    );
  }

  return (
    <div
      id="inspector-panel"
      className="flex flex-col h-full bg-[#181a20] border-l border-[#282b33] text-gray-200 text-xs overflow-y-auto select-none"
    >
      {/* Inspector Header */}
      <div className="p-3 border-b border-[#282b33] bg-[#15171d] flex items-center justify-between shrink-0">
        <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
          Inspector
        </span>
        <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/40">
          {selectedObject.type}
        </span>
      </div>

      {/* Main Object Header (Name, Active, Flags) */}
      <div className="p-3 border-b border-[#282b33] bg-[#16181e] space-y-2.5 shrink-0">
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
              className="rounded border-gray-700 bg-gray-800 text-cyan-500 cursor-pointer"
            />
            <span>Cast Shadow</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!selectedObject.receiveShadow}
              onChange={(e) => onUpdateProperties({ receiveShadow: e.target.checked })}
              className="rounded border-gray-700 bg-gray-800 text-cyan-500 cursor-pointer"
            />
            <span>Receive Shadow</span>
          </label>
        </div>
      </div>

      {/* 1. TRANSFORM PANEL */}
      <TransformPanel
        position={selectedObject.position}
        rotation={selectedObject.rotation}
        scale={selectedObject.scale}
        onUpdateTransform={onUpdateTransform}
      />

      {/* 2. MATERIAL PANEL (For meshes) */}
      {selectedObject.material && (
        <MaterialPanel
          material={selectedObject.material}
          onUpdateMaterial={onUpdateMaterial}
          onUploadTexture={onUploadTexture}
          onApplyPresetTexture={onApplyPresetTexture}
        />
      )}

      {/* 3. LIGHT PANEL (For lights) */}
      {selectedObject.light && (
        <LightPanel
          light={selectedObject.light}
          onUpdateLight={onUpdateLight}
        />
      )}

      {/* 4. CAMERA PANEL (For cameras) */}
      {selectedObject.type === 'camera' && (
        <CameraPanel
          cameraData={{ fov: 60, near: 0.1, far: 2000 }}
          onUpdateCamera={() => {}}
        />
      )}
    </div>
  );
};
