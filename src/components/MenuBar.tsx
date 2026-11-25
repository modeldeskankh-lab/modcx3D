import React, { useState, useRef } from 'react';
import {
  Play,
  Square,
  Pause,
  FileCode2,
  FolderOpen,
  FolderDown,
  Save,
  Download,
  Plus,
  Box,
  Sun,
  Camera,
  Layers,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  HelpCircle,
  Sparkles,
  Maximize2,
  Minimize2,
  Activity,
  CloudSun,
  Wind,
  LayoutGrid,
  Home,
  Waves,
  Droplets,
  Gamepad,
  UserCheck,
  Navigation
} from 'lucide-react';
import { SAMPLE_SCENES } from '../utils/sampleScenes';

interface MenuBarProps {
  onBackToHub?: () => void;
  onNewScene: () => void;
  onSaveScene: () => void;
  onSaveSceneAs?: () => void;
  sceneName?: string;
  onLoadSceneFile: (file: File) => void;
  onLoadSampleScene: (sampleId: string) => void;
  onOpenExportScene: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onFocus: () => void;
  onFrameAll: () => void;
  onAddPrimitive: (type: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus' | 'capsule') => void;
  onAddWater?: (type: 'ocean' | 'river' | 'lake') => void;
  onAddCharacterController?: (type: 'fpv' | 'tpv' | 'drone') => void;
  onAddLight: (type: 'directional' | 'point' | 'spot' | 'ambient') => void;
  onAddCamera: () => void;
  onAddEmpty: () => void;
  onOpenEnvironment?: () => void;
  onOpenShortcuts: () => void;
  hasCamera?: boolean;
  isCameraViewOpen?: boolean;
  onToggleCameraView?: () => void;
  isPlayMode?: boolean;
  isPlayPaused?: boolean;
  onTogglePlay?: () => void;
  onTogglePause?: () => void;
  stats: { fps: number; drawCalls: number; triangles: number };
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onBackToHub,
  onNewScene,
  onSaveScene,
  onSaveSceneAs,
  sceneName,
  onLoadSceneFile,
  onLoadSampleScene,
  onOpenExportScene,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDuplicate,
  onDelete,
  onFocus,
  onFrameAll,
  onAddPrimitive,
  onAddWater,
  onAddCharacterController,
  onAddLight,
  onAddCamera,
  onAddEmpty,
  onOpenEnvironment,
  onOpenShortcuts,
  hasCamera,
  isCameraViewOpen,
  onToggleCameraView,
  isPlayMode = false,
  isPlayPaused = false,
  onTogglePlay,
  onTogglePause,
  stats
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuClick = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <div
      id="main-menubar"
      className="h-10 bg-[#181a20] border-b border-[#282b33] flex items-center justify-between px-3 select-none text-xs text-[#d1d5db] z-40 relative overflow-visible shrink-0"
      onClick={(e) => {
        // If clicked outside menus, close them
        if ((e.target as HTMLElement).closest('.menu-dropdown-container') === null) {
          setActiveMenu(null);
        }
      }}
    >
      {/* Left: Brand Logo & Top Menus */}
      <div className="flex items-center space-x-1 shrink-0">
        {/* Brand */}
        <div className="flex items-center space-x-2 mr-2 pr-2 border-r border-[#2d3139]">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
            M
          </div>
          <span className="font-bold text-white tracking-wide text-[14px]">
            modcx<span className="text-cyan-400 font-extrabold">3D</span>
          </span>

          {onBackToHub && (
            <button
              onClick={onBackToHub}
              title="Return to modcx3D Engine Hub"
              className="ml-1 px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 text-[11px] font-semibold transition-colors"
            >
              <LayoutGrid size={12} /> Hub
            </button>
          )}
        </div>

        {/* FILE MENU */}
        <div className="relative menu-dropdown-container">
          <button
            id="menu-btn-file"
            className={`px-2.5 py-1 rounded hover:bg-[#282c35] transition-colors ${
              activeMenu === 'file' ? 'bg-[#282c35] text-white' : ''
            }`}
            onClick={() => toggleMenu('file')}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#1f232b] border border-[#333842] rounded shadow-xl py-1 z-50 text-xs">
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between"
                onClick={() => handleMenuClick(onNewScene)}
              >
                <span className="flex items-center gap-2"><FileCode2 size={14} className="text-gray-400" /> New Scene</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between"
                onClick={() => handleMenuClick(onSaveScene)}
              >
                <span className="flex items-center gap-2"><Save size={14} className="text-cyan-400" /> Save Scene</span>
                <span className="text-[10px] text-gray-500">Ctrl+S</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between"
                onClick={() => handleMenuClick(onSaveSceneAs || onSaveScene)}
              >
                <span className="flex items-center gap-2"><Save size={14} className="text-blue-400" /> Save Scene As...</span>
                <span className="text-[10px] text-gray-500">Ctrl+Shift+S</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between"
                onClick={() => {
                  fileInputRef.current?.click();
                  setActiveMenu(null);
                }}
              >
                <span className="flex items-center gap-2"><FolderOpen size={14} className="text-amber-400" /> Load Scene JSON...</span>
              </button>
              <div className="border-t border-[#2d323d] my-1" />
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">Sample Scenes</div>
              {SAMPLE_SCENES.map(s => (
                <button
                  key={s.id}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2 text-cyan-200"
                  onClick={() => handleMenuClick(() => onLoadSampleScene(s.id))}
                >
                  <Sparkles size={13} className="text-cyan-400" /> {s.name}
                </button>
              ))}
              <div className="border-t border-[#2d323d] my-1" />
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2 text-cyan-300 font-medium"
                onClick={() => handleMenuClick(onOpenExportScene)}
              >
                <Download size={14} className="text-cyan-400" /> Export Scene ZIP...
              </button>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative menu-dropdown-container">
          <button
            id="menu-btn-edit"
            className={`px-2.5 py-1 rounded hover:bg-[#282c35] transition-colors ${
              activeMenu === 'edit' ? 'bg-[#282c35] text-white' : ''
            }`}
            onClick={() => toggleMenu('edit')}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#1f232b] border border-[#333842] rounded shadow-xl py-1 z-50 text-xs">
              <button
                disabled={!canUndo}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${
                  canUndo ? 'hover:bg-[#2d323d] text-gray-200' : 'text-gray-600 cursor-not-allowed'
                }`}
                onClick={() => handleMenuClick(onUndo)}
              >
                <span className="flex items-center gap-2"><RotateCcw size={14} /> Undo</span>
                <span className="text-[10px] text-gray-500">Ctrl+Z</span>
              </button>
              <button
                disabled={!canRedo}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${
                  canRedo ? 'hover:bg-[#2d323d] text-gray-200' : 'text-gray-600 cursor-not-allowed'
                }`}
                onClick={() => handleMenuClick(onRedo)}
              >
                <span className="flex items-center gap-2"><RotateCw size={14} /> Redo</span>
                <span className="text-[10px] text-gray-500">Ctrl+Shift+Z</span>
              </button>
              <div className="border-t border-[#2d323d] my-1" />
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-gray-200"
                onClick={() => handleMenuClick(onDuplicate)}
              >
                <span className="flex items-center gap-2"><Copy size={14} /> Duplicate</span>
                <span className="text-[10px] text-gray-500">Ctrl+D</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-red-300"
                onClick={() => handleMenuClick(onDelete)}
              >
                <span className="flex items-center gap-2"><Trash2 size={14} /> Delete</span>
                <span className="text-[10px] text-gray-500">Del</span>
              </button>
              <div className="border-t border-[#2d323d] my-1" />
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-gray-200"
                onClick={() => handleMenuClick(onFocus)}
              >
                <span className="flex items-center gap-2"><Maximize2 size={14} /> Focus Selected</span>
                <span className="text-[10px] text-gray-500">F</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-gray-200"
                onClick={() => handleMenuClick(onFrameAll)}
              >
                <span className="flex items-center gap-2"><Minimize2 size={14} /> Frame All Objects</span>
                <span className="text-[10px] text-gray-500">Home</span>
              </button>
            </div>
          )}
        </div>

        {/* GAMEOBJECT / ADD MENU */}
        <div className="relative menu-dropdown-container">
          <button
            id="menu-btn-gameobject"
            className={`px-2.5 py-1 rounded hover:bg-[#282c35] transition-colors ${
              activeMenu === 'gameobject' ? 'bg-[#282c35] text-white' : ''
            }`}
            onClick={() => toggleMenu('gameobject')}
          >
            GameObject
          </button>
          {activeMenu === 'gameobject' && (
            <div className="absolute top-full left-0 mt-1 w-60 bg-[#1f232b] border border-[#333842] rounded shadow-xl py-1 z-50 text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">3D Primitives</div>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddPrimitive('cube'))}>
                <Box size={14} className="text-cyan-400" /> Cube
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddPrimitive('sphere'))}>
                <div className="w-3.5 h-3.5 rounded-full border border-red-400" /> Sphere
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddPrimitive('cylinder'))}>
                <div className="w-3.5 h-3.5 border border-emerald-400 rounded-sm" /> Cylinder
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddPrimitive('cone'))}>
                <div className="w-3.5 h-3.5 border-b-2 border-amber-400" /> Cone
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddPrimitive('plane'))}>
                <div className="w-3.5 h-2 border border-blue-400" /> Plane
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddPrimitive('torus'))}>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-400" /> Torus (Donut)
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddPrimitive('capsule'))}>
                <div className="w-2.5 h-3.5 rounded-full border border-teal-400" /> Capsule
              </button>

              <div className="border-t border-[#2d323d] my-1" />
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Gamepad size={12} /> Character Controllers
                </span>
                <span className="text-[9px] text-emerald-300 font-mono">UNITY 3D</span>
              </div>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-emerald-200"
                onClick={() => handleMenuClick(() => onAddCharacterController?.('fpv'))}
              >
                <div className="flex items-center gap-2">
                  <Gamepad size={14} className="text-emerald-400" />
                  <span>FPV Player (First Person)</span>
                </div>
                <span className="text-[9px] text-gray-500">Eye-Cam</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-emerald-200"
                onClick={() => handleMenuClick(() => onAddCharacterController?.('tpv'))}
              >
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-cyan-400" />
                  <span>TPV Player (Third Person)</span>
                </div>
                <span className="text-[9px] text-gray-500">Avatar</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-emerald-200"
                onClick={() => handleMenuClick(() => onAddCharacterController?.('drone'))}
              >
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-amber-400" />
                  <span>Drone Rig (Flight Quad)</span>
                </div>
                <span className="text-[9px] text-gray-500">Flight</span>
              </button>

              <div className="border-t border-[#2d323d] my-1" />
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-cyan-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Waves size={12} /> Water System
                </span>
                <span className="text-[9px] text-cyan-300 font-mono">SIMULATION</span>
              </div>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-cyan-200"
                onClick={() => handleMenuClick(() => onAddWater?.('ocean'))}
              >
                <div className="flex items-center gap-2">
                  <Waves size={14} className="text-cyan-400" />
                  <span>Ocean / Sea Water</span>
                </div>
                <span className="text-[9px] text-gray-500">Waves</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-cyan-200"
                onClick={() => handleMenuClick(() => onAddWater?.('river'))}
              >
                <div className="flex items-center gap-2">
                  <Wind size={14} className="text-teal-400" />
                  <span>River Water</span>
                </div>
                <span className="text-[9px] text-gray-500">Flow</span>
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center justify-between text-cyan-200"
                onClick={() => handleMenuClick(() => onAddWater?.('lake'))}
              >
                <div className="flex items-center gap-2">
                  <Droplets size={14} className="text-blue-400" />
                  <span>Lake Water</span>
                </div>
                <span className="text-[9px] text-gray-500">Mirror</span>
              </button>

              <div className="border-t border-[#2d323d] my-1" />
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">Lights</div>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddLight('directional'))}>
                <Sun size={14} className="text-yellow-400" /> Directional Light
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddLight('point'))}>
                <div className="w-3 h-3 rounded-full bg-amber-400" /> Point Light
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddLight('spot'))}>
                <div className="w-3 h-3 border-t-2 border-cyan-400" /> Spot Light
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(() => onAddLight('ambient'))}>
                <Sun size={14} className="text-gray-400" /> Ambient Light
              </button>

              <div className="border-t border-[#2d323d] my-1" />
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400 flex items-center justify-between">
                <span>Sky & Atmosphere</span>
                <span className="text-[9px] text-cyan-400 font-mono">HDRI/EXR</span>
              </div>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2 text-cyan-300 font-medium"
                onClick={() => handleMenuClick(() => onOpenEnvironment?.())}
              >
                <CloudSun size={14} className="text-cyan-400" /> Sky & HDRI Environment
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2 text-teal-300"
                onClick={() => handleMenuClick(() => onOpenEnvironment?.())}
              >
                <Wind size={14} className="text-teal-400" /> Volumetric & Atmospheric Fog
              </button>

              <div className="border-t border-[#2d323d] my-1" />
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400">Scene Entities</div>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(onAddCamera)}>
                <Camera size={14} className="text-indigo-400" /> Camera
              </button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2" onClick={() => handleMenuClick(onAddEmpty)}>
                <Layers size={14} className="text-gray-400" /> Create Empty
              </button>
            </div>
          )}
        </div>

        {/* HELP MENU */}
        <div className="relative menu-dropdown-container">
          <button
            id="menu-btn-help"
            className={`px-2.5 py-1 rounded hover:bg-[#282c35] transition-colors ${
              activeMenu === 'help' ? 'bg-[#282c35] text-white' : ''
            }`}
            onClick={() => toggleMenu('help')}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#1f232b] border border-[#333842] rounded shadow-xl py-1 z-50 text-xs">
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-[#2d323d] flex items-center gap-2"
                onClick={() => handleMenuClick(onOpenShortcuts)}
              >
                <HelpCircle size={14} className="text-cyan-400" /> Keyboard Shortcuts
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input for load scene */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onLoadSceneFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* CENTER: UNITY 3D ENGINE STYLE PLAY & PAUSE CONTROLS */}
      <div className="flex items-center space-x-1.5 bg-[#12141a] px-2 py-0.5 rounded-lg border border-[#2b2f3a] shadow-inner">
        {/* Play / Stop Button */}
        <button
          id="unity-play-btn"
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold text-[11px] transition-all shadow-md active:scale-95 ${
            isPlayMode
              ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-rose-900/40 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-900/40'
          }`}
          title={isPlayMode ? 'Stop Game Play Simulation' : 'Start Working Unity 3D Game Play'}
        >
          {isPlayMode ? (
            <>
              <Square size={12} fill="currentColor" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play size={12} fill="currentColor" />
              <span>Play Game</span>
            </>
          )}
        </button>

        {/* Pause / Resume Button */}
        <button
          id="unity-pause-btn"
          onClick={onTogglePause}
          disabled={!isPlayMode}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold text-[11px] transition-all ${
            !isPlayMode
              ? 'bg-[#1e222b] text-gray-600 border border-[#2d313c] cursor-not-allowed opacity-50'
              : isPlayPaused
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border border-amber-300 ring-2 ring-amber-400/40'
              : 'bg-[#232836] hover:bg-[#2d3446] text-amber-400 border border-amber-500/30'
          }`}
          title={isPlayPaused ? 'Resume Game Play' : 'Pause Game Play'}
        >
          {isPlayPaused ? (
            <>
              <Play size={11} fill="currentColor" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause size={11} fill="currentColor" />
              <span>Pause</span>
            </>
          )}
        </button>
      </div>

      {/* Right: Camera View, Export Scene Button, Stats & Badge */}
      <div className="flex items-center space-x-2 shrink-0 ml-2">
        {hasCamera && (
          <button
            id="camera-view-btn"
            onClick={onToggleCameraView}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold text-xs transition-all shadow-md active:scale-95 ${
              isCameraViewOpen
                ? 'bg-cyan-500 text-slate-950 font-bold border border-cyan-300 shadow-cyan-500/40 ring-2 ring-cyan-400/50'
                : 'bg-[#212636] hover:bg-[#2b3247] text-cyan-400 border border-cyan-500/40 hover:border-cyan-400'
            }`}
            title="Toggle Camera View Picture-in-Picture Box in Viewport"
          >
            <Camera size={13} className={isCameraViewOpen ? 'animate-pulse text-slate-950' : 'text-cyan-400'} />
            <span>Cam View</span>
            {isCameraViewOpen && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
            )}
          </button>
        )}

        {/* Export Scene Button moved to Right side */}
        <button
          id="export-scene-btn"
          onClick={onOpenExportScene}
          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs transition-all shadow-md shadow-cyan-900/30 active:scale-95 border border-cyan-400/30"
          title="Export Scene ZIP for Visual Studio Game Development"
        >
          <Download size={13} />
          <span>Export Scene</span>
        </button>

        <div className="hidden lg:flex items-center space-x-3 text-[11px] text-gray-400 font-mono shrink-0 ml-1">
          <div className="flex items-center gap-2 bg-[#12141a] px-2 py-0.5 rounded border border-[#232731]">
            <Activity size={12} className={stats.fps > 45 ? 'text-emerald-400' : 'text-amber-400'} />
            <span className="text-gray-200">{stats.fps} FPS</span>
            <span className="text-gray-600">|</span>
            <span>{stats.drawCalls} calls</span>
            <span className="text-gray-600">|</span>
            <span>{stats.triangles.toLocaleString()} tris</span>
          </div>

          <div className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            modcx3D Engine
          </div>
        </div>
      </div>
    </div>
  );
};

