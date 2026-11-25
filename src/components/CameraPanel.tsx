import React from 'react';
import { Camera } from 'lucide-react';

interface CameraPanelProps {
  cameraData?: {
    fov?: number;
    near?: number;
    far?: number;
  };
  onUpdateCamera: (updates: { fov?: number; near?: number; far?: number }) => void;
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  cameraData,
  onUpdateCamera
}) => {
  const fov = cameraData?.fov ?? 60;
  const near = cameraData?.near ?? 0.1;
  const far = cameraData?.far ?? 2000;

  return (
    <div className="p-3 border-b border-[#282b33] space-y-3">
      <div className="flex items-center justify-between text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Camera size={13} className="text-indigo-400" /> Camera Settings
        </span>
        <span className="text-[10px] text-indigo-400 font-mono">PerspectiveCamera</span>
      </div>

      {/* Field of View */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-400">Field of View (FOV)</span>
          <span className="text-gray-300 font-mono">{fov}°</span>
        </div>
        <input
          type="range"
          min="20"
          max="110"
          step="1"
          value={fov}
          onChange={(e) => onUpdateCamera({ fov: parseFloat(e.target.value) })}
          className="w-full accent-indigo-500 cursor-pointer"
        />
      </div>

      {/* Near Clipping */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Near Clip Plane</span>
        <input
          type="number"
          step="0.05"
          min="0.01"
          value={near}
          onChange={(e) => onUpdateCamera({ near: parseFloat(e.target.value) })}
          className="w-20 bg-[#101216] border border-[#2d313b] rounded px-1.5 py-1 text-right text-white font-mono text-xs"
        />
      </div>

      {/* Far Clipping */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Far Clip Plane</span>
        <input
          type="number"
          step="100"
          min="10"
          value={far}
          onChange={(e) => onUpdateCamera({ far: parseFloat(e.target.value) })}
          className="w-20 bg-[#101216] border border-[#2d313b] rounded px-1.5 py-1 text-right text-white font-mono text-xs"
        />
      </div>
    </div>
  );
};
