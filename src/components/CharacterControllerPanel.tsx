import React, { useState } from 'react';
import {
  User,
  Eye,
  Camera,
  Compass,
  Zap,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronRight,
  Sun,
  Shield,
  Move,
  Plane
} from 'lucide-react';
import { CharacterControllerConfig, ControllerType } from '../types/editor';

interface CharacterControllerPanelProps {
  controllerConfig?: CharacterControllerConfig;
  onUpdateConfig?: (updates: Partial<CharacterControllerConfig>) => void;
  onSwitchType?: (type: ControllerType) => void;
}

export const CharacterControllerPanel: React.FC<CharacterControllerPanelProps> = ({
  controllerConfig,
  onUpdateConfig,
  onSwitchType
}) => {
  const [movementExpanded, setMovementExpanded] = useState(true);
  const [cameraExpanded, setCameraExpanded] = useState(true);
  const [extraExpanded, setExtraExpanded] = useState(true);

  if (!controllerConfig) {
    return null;
  }

  const type = controllerConfig.controllerType || 'fpv';

  const handleChange = (key: keyof CharacterControllerConfig, value: any) => {
    onUpdateConfig?.({ [key]: value });
  };

  return (
    <div className="p-3 space-y-3 bg-[#13151b]">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#242833]">
        <div className="flex items-center gap-2">
          {type === 'fpv' && <Eye size={14} className="text-emerald-400" />}
          {type === 'tpv' && <User size={14} className="text-cyan-400" />}
          {type === 'drone' && <Plane size={14} className="text-purple-400" />}
          <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wider">
            Character Controller
          </span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium uppercase bg-[#1f2430] text-gray-300 border border-[#2b3345]">
          {type.toUpperCase()}
        </span>
      </div>

      {/* Controller Type Selector Tabs */}
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-gray-400 flex items-center justify-between">
          <span>Controller Mode</span>
          <span className="text-gray-500 font-mono text-[9px]">Runtime Rig</span>
        </label>
        <div className="grid grid-cols-3 gap-1 bg-[#0d0f14] p-1 rounded-md border border-[#232734]">
          <button
            type="button"
            onClick={() => onSwitchType ? onSwitchType('fpv') : handleChange('controllerType', 'fpv')}
            className={`py-1 px-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-all ${
              type === 'fpv'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#191d28]'
            }`}
          >
            <Eye size={11} />
            <span>FPV Player</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchType ? onSwitchType('tpv') : handleChange('controllerType', 'tpv')}
            className={`py-1 px-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-all ${
              type === 'tpv'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#191d28]'
            }`}
          >
            <User size={11} />
            <span>TPV Player</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchType ? onSwitchType('drone') : handleChange('controllerType', 'drone')}
            className={`py-1 px-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-all ${
              type === 'drone'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#191d28]'
            }`}
          >
            <Plane size={11} />
            <span>Drone Rig</span>
          </button>
        </div>
      </div>

      {/* Movement & Locomotion Section */}
      <div className="space-y-2 border border-[#232733] bg-[#161822] rounded-md p-2">
        <button
          type="button"
          onClick={() => setMovementExpanded(!movementExpanded)}
          className="flex items-center justify-between w-full text-left text-[11px] font-medium text-gray-300 hover:text-white"
        >
          <span className="flex items-center gap-1.5">
            <Move size={12} className="text-emerald-400" />
            {type === 'drone' ? 'Flight & Thrust Physics' : 'Locomotion & Movement'}
          </span>
          {movementExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {movementExpanded && (
          <div className="space-y-2 pt-1 border-t border-[#232733]">
            {type !== 'drone' ? (
              <>
                {/* Move Speed */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Walk Speed</span>
                    <span className="text-emerald-400 font-mono">{controllerConfig.moveSpeed.toFixed(1)} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={controllerConfig.moveSpeed}
                    onChange={(e) => handleChange('moveSpeed', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>

                {/* Sprint Multiplier */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Sprint Multiplier (Shift)</span>
                    <span className="text-cyan-400 font-mono">{controllerConfig.sprintMultiplier.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={controllerConfig.sprintMultiplier}
                    onChange={(e) => handleChange('sprintMultiplier', parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>

                {/* Jump Force */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Jump Force</span>
                    <span className="text-amber-400 font-mono">{controllerConfig.jumpForce.toFixed(1)} N</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={controllerConfig.jumpForce}
                    onChange={(e) => handleChange('jumpForce', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>

                {/* Gravity */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Gravity Scale</span>
                    <span className="text-purple-400 font-mono">{controllerConfig.gravity.toFixed(1)} m/s²</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="0.5"
                    value={controllerConfig.gravity}
                    onChange={(e) => handleChange('gravity', parseFloat(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Drone Flight Speed */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Flight Speed (WASD)</span>
                    <span className="text-purple-400 font-mono">{controllerConfig.flightSpeed.toFixed(1)} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    step="1"
                    value={controllerConfig.flightSpeed}
                    onChange={(e) => handleChange('flightSpeed', parseFloat(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>

                {/* Ascend Speed */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Vertical Thrust (Space / Shift)</span>
                    <span className="text-cyan-400 font-mono">{controllerConfig.ascendSpeed.toFixed(1)} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={controllerConfig.ascendSpeed}
                    onChange={(e) => handleChange('ascendSpeed', parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>

                {/* Hover Damping */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Inertia / Hover Damping</span>
                    <span className="text-amber-400 font-mono">{controllerConfig.hoverDamping.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={controllerConfig.hoverDamping}
                    onChange={(e) => handleChange('hoverDamping', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Camera & View Optics Section */}
      <div className="space-y-2 border border-[#232733] bg-[#161822] rounded-md p-2">
        <button
          type="button"
          onClick={() => setCameraExpanded(!cameraExpanded)}
          className="flex items-center justify-between w-full text-left text-[11px] font-medium text-gray-300 hover:text-white"
        >
          <span className="flex items-center gap-1.5">
            <Camera size={12} className="text-cyan-400" />
            Camera & Mouse Aiming
          </span>
          {cameraExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {cameraExpanded && (
          <div className="space-y-2 pt-1 border-t border-[#232733]">
            {/* Mouse Sensitivity */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Mouse Sensitivity</span>
                <span className="text-cyan-400 font-mono">{controllerConfig.mouseSensitivity.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.0005"
                max="0.008"
                step="0.0005"
                value={controllerConfig.mouseSensitivity}
                onChange={(e) => handleChange('mouseSensitivity', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-[#0e1017] rounded cursor-pointer"
              />
            </div>

            {/* FPV Specific: Eye Height & Bobbing */}
            {type === 'fpv' && (
              <>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Eye Level Height</span>
                    <span className="text-emerald-400 font-mono">{controllerConfig.eyeHeight.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="2.5"
                    step="0.05"
                    value={controllerConfig.eyeHeight}
                    onChange={(e) => handleChange('eyeHeight', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400">Head Bobbing Effect</span>
                  <input
                    type="checkbox"
                    checked={controllerConfig.headBobbing}
                    onChange={(e) => handleChange('headBobbing', e.target.checked)}
                    className="rounded bg-[#0e1017] border-gray-600 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* TPV Specific: Camera Distance & Height & Follow Lag */}
            {type === 'tpv' && (
              <>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Boom Arm Distance</span>
                    <span className="text-cyan-400 font-mono">{controllerConfig.cameraDistance.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="10.0"
                    step="0.2"
                    value={controllerConfig.cameraDistance}
                    onChange={(e) => handleChange('cameraDistance', parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Camera Height Offset</span>
                    <span className="text-cyan-400 font-mono">{controllerConfig.cameraHeight.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={controllerConfig.cameraHeight}
                    onChange={(e) => handleChange('cameraHeight', parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Camera Follow Smoothing</span>
                    <span className="text-amber-400 font-mono">{(controllerConfig.cameraLag * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.3"
                    step="0.01"
                    value={controllerConfig.cameraLag}
                    onChange={(e) => handleChange('cameraLag', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-[#0e1017] rounded cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* Drone Specific: Roll Banking Tilt */}
            {type === 'drone' && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-gray-400">Dynamic Banking Roll Tilt</span>
                <input
                  type="checkbox"
                  checked={controllerConfig.rollTilt}
                  onChange={(e) => handleChange('rollTilt', e.target.checked)}
                  className="rounded bg-[#0e1017] border-gray-600 text-purple-500 focus:ring-0 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Equipment & Illumination Section */}
      <div className="space-y-2 border border-[#232733] bg-[#161822] rounded-md p-2">
        <button
          type="button"
          onClick={() => setExtraExpanded(!extraExpanded)}
          className="flex items-center justify-between w-full text-left text-[11px] font-medium text-gray-300 hover:text-white"
        >
          <span className="flex items-center gap-1.5">
            <Sun size={12} className="text-yellow-400" />
            Spotlight & Controls
          </span>
          {extraExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {extraExpanded && (
          <div className="space-y-2 pt-1 border-t border-[#232733]">
            {type !== 'drone' ? (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-300 font-medium">Player Flashlight</span>
                  <span className="text-[9px] text-gray-500">Toggle with 'F' key during gameplay</span>
                </div>
                <input
                  type="checkbox"
                  checked={controllerConfig.flashlight}
                  onChange={(e) => handleChange('flashlight', e.target.checked)}
                  className="rounded bg-[#0e1017] border-gray-600 text-yellow-500 focus:ring-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-300 font-medium">Dual Drone Headlights</span>
                  <span className="text-[9px] text-gray-500">Forward illumination beam</span>
                </div>
                <input
                  type="checkbox"
                  checked={controllerConfig.headlights}
                  onChange={(e) => handleChange('headlights', e.target.checked)}
                  className="rounded bg-[#0e1017] border-gray-600 text-yellow-500 focus:ring-0 cursor-pointer"
                />
              </div>
            )}

            {/* Quick Play Instructions */}
            <div className="p-2 rounded bg-[#0e1016] border border-[#202533] space-y-1">
              <span className="text-[10px] font-bold text-gray-300 flex items-center gap-1">
                <Zap size={11} className="text-amber-400" /> Play Controls:
              </span>
              <ul className="text-[9px] text-gray-400 space-y-0.5 list-disc pl-3.5">
                <li><strong className="text-gray-300">W / A / S / D:</strong> Movement & Steering</li>
                <li><strong className="text-gray-300">Mouse:</strong> Look & Aim (Click viewport to lock cursor)</li>
                {type !== 'drone' ? (
                  <>
                    <li><strong className="text-gray-300">Space:</strong> Jump</li>
                    <li><strong className="text-gray-300">Shift:</strong> Sprint</li>
                    <li><strong className="text-gray-300">F:</strong> Toggle Flashlight</li>
                  </>
                ) : (
                  <>
                    <li><strong className="text-gray-300">Space / Q:</strong> Ascend / Lift</li>
                    <li><strong className="text-gray-300">Shift / E:</strong> Descend</li>
                    <li><strong className="text-gray-300">F:</strong> Toggle Headlights</li>
                  </>
                )}
                <li><strong className="text-gray-300">Escape:</strong> Release Cursor Lock</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
