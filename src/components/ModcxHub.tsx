import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Box,
  Palette,
  ImageIcon,
  Sparkles,
  Plus,
  Upload,
  Search,
  Settings,
  BookOpen,
  LayoutGrid,
  Play,
  ArrowRight,
  ExternalLink,
  Trash2,
  Copy,
  Edit2,
  Monitor,
  CheckCircle2,
  HelpCircle,
  FileCode2,
  Download,
  FolderOpen,
  Home,
  ChevronRight,
  UserCheck,
  ShoppingBag,
  Layers,
  Zap,
  Code2,
  HardDrive,
  Menu,
  X
} from 'lucide-react';
import { EditorSceneData } from '../types/editor';
import { AssetManager, PublicAssetManifest } from '../AssetManager';

interface ModcxHubProps {
  onOpenScene: (sceneData?: EditorSceneData) => void;
  onBackToLanding: () => void;
}

export interface SavedLocalProject {
  id: string;
  name: string;
  updatedAt: string;
  objectCount: number;
  data: EditorSceneData;
  filePath?: string;
}

export const ModcxHub: React.FC<ModcxHubProps> = ({
  onOpenScene,
  onBackToLanding
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'store'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedProjects, setSavedProjects] = useState<SavedLocalProject[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved projects from localStorage on mount (only real user projects, no dummy fillers)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('modcx3d_saved_projects');
      if (stored) {
        const parsed: SavedLocalProject[] = JSON.parse(stored);
        // Clean out legacy/dummy items
        const cleaned = parsed.filter(p =>
          p.id !== 'proj_default' &&
          !['Blank 3D Canvas', 'Untitled 3D Scene', 'Main 3D Workspace Scene'].includes(p.name)
        );
        setSavedProjects(cleaned);
        localStorage.setItem('modcx3d_saved_projects', JSON.stringify(cleaned));
      } else {
        setSavedProjects([]);
      }
    } catch (e) {
      console.warn('Could not read saved projects from localStorage:', e);
      setSavedProjects([]);
    }
  }, []);

  const saveToLocalStorage = (projects: SavedLocalProject[]) => {
    setSavedProjects(projects);
    try {
      localStorage.setItem('modcx3d_saved_projects', JSON.stringify(projects));
    } catch (e) {
      console.warn('Could not save projects to localStorage:', e);
    }
  };

  const handleCreateNewProject = () => {
    const defaultData: EditorSceneData = {
      name: 'New 3D Scene',
      version: '1.0.0',
      objects: [
        {
          id: 'sun',
          name: 'Sunlight',
          type: 'light',
          visible: true,
          position: { x: 5, y: 10, z: 5 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          light: { type: 'directional', color: '#ffffff', intensity: 1.5, castShadow: true }
        },
        {
          id: 'ground',
          name: 'Ground Plane',
          type: 'mesh',
          meshType: 'plane',
          visible: true,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: -90, y: 0, z: 0 },
          scale: { x: 10, y: 10, z: 1 },
          material: { color: '#1e293b', roughness: 0.5, metalness: 0.2, opacity: 1, transparent: false, wireframe: false },
          receiveShadow: true
        },
        {
          id: 'cube',
          name: 'Cube',
          type: 'mesh',
          meshType: 'cube',
          visible: true,
          position: { x: 0, y: 0.5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          material: { color: '#06b6d4', roughness: 0.3, metalness: 0.7, opacity: 1, transparent: false, wireframe: false },
          castShadow: true
        }
      ]
    };

    const newProject: SavedLocalProject = {
      id: `proj_${Date.now()}`,
      name: 'New 3D Scene',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      objectCount: defaultData.objects.length,
      filePath: `C:/Projects/modcx3D/New3DScene.modcx`,
      data: defaultData
    };

    const updated = [newProject, ...savedProjects];
    saveToLocalStorage(updated);
    onOpenScene(defaultData);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      const updated = savedProjects.filter(p => p.id !== id);
      saveToLocalStorage(updated);
    }
  };

  // Save project file to computer disk
  const handleSaveProjectToComputer = (project: SavedLocalProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonStr = JSON.stringify(project.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.modcx.json`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Detect and import scene file from computer disk
  const handleImportComputerProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.objects && Array.isArray(parsed.objects)) {
          const cleanName = parsed.name || file.name.replace(/\.(json|modcx|modcx\.json)$/i, '');
          const newProject: SavedLocalProject = {
            id: `proj_${Date.now()}`,
            name: cleanName,
            updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            objectCount: parsed.objects.length,
            filePath: `Computer Folder/${file.name}`,
            data: parsed
          };
          const updated = [newProject, ...savedProjects];
          saveToLocalStorage(updated);
          onOpenScene(parsed);
        } else {
          alert('Invalid project scene file format.');
        }
      } catch (err) {
        alert('Failed to parse project file from computer.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredProjects = savedProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#0e1017] text-gray-200 font-sans flex select-none overflow-hidden">
      {/* Hidden File Input for Opening Computer Project File */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.modcx"
        className="hidden"
        onChange={handleImportComputerProjectFile}
      />

      {/* EPIC / UNITY LAUNCHER STYLE LEFT SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-64 bg-[#141722] border-r border-[#222736] flex-col shrink-0 justify-between">
        <div>
          {/* Engine Header Logo */}
          <div className="p-5 border-b border-[#222736] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-cyan-500/20">
                M
              </div>
              <div>
                <div className="font-extrabold text-white text-base tracking-tight leading-none">
                  modcx<span className="text-cyan-400">3D</span>
                </div>
                <div className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">
                  Engine Hub
                </div>
              </div>
            </div>

            <button
              onClick={onBackToLanding}
              title="Return to Landing Page"
              className="p-1.5 hover:bg-[#202535] text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <Home size={15} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('library')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeTab === 'library'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1b1f2e]'
              }`}
            >
              <LayoutGrid size={16} className={activeTab === 'library' ? 'text-cyan-400' : ''} />
              <span>Library &amp; Projects</span>
            </button>

            <button
              onClick={() => setActiveTab('store')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeTab === 'store'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1b1f2e]'
              }`}
            >
              <ShoppingBag size={16} className={activeTab === 'store' ? 'text-cyan-400' : ''} />
              <span>Store</span>
            </button>
          </nav>
        </div>

        {/* User Account & Quick Launch */}
        <div className="p-4 border-t border-[#222736] bg-[#11131c]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
              <UserCheck size={14} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-200">Creator License</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> modcx3D Pro Active
              </div>
            </div>
          </div>

          <button
            onClick={() => handleCreateNewProject()}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs tracking-wider shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Play size={13} /> Launch 3D Studio
          </button>
        </div>
      </aside>

      {/* MOBILE / TABLET OVERLAY SIDEBAR DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex">
          <div className="w-72 bg-[#141722] border-r border-[#222736] flex flex-col justify-between p-4 h-full">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#222736] mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-xs">
                    M
                  </div>
                  <span className="font-extrabold text-white text-sm">modcx<span className="text-cyan-400">3D</span> Engine</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => { setActiveTab('library'); setIsMobileMenuOpen(false); }}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                    activeTab === 'library' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400'
                  }`}
                >
                  <LayoutGrid size={16} /> <span>Library &amp; Projects</span>
                </button>
                <button
                  onClick={() => { setActiveTab('store'); setIsMobileMenuOpen(false); }}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                    activeTab === 'store' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-400'
                  }`}
                >
                  <ShoppingBag size={16} /> <span>Store</span>
                </button>
                <button
                  onClick={() => { onBackToLanding(); setIsMobileMenuOpen(false); }}
                  className="w-full px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 text-gray-400 hover:text-white"
                >
                  <Home size={16} /> <span>Back to Home</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#222736]">
              <button
                onClick={() => { handleCreateNewProject(); setIsMobileMenuOpen(false); }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Play size={14} /> Launch 3D Studio
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* MAIN HUB BODY */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#0b0d13]">
        {/* Top Header Bar */}
        <header className="min-h-[4rem] px-4 md:px-8 py-3 border-b border-[#1f2433] bg-[#11141e]/90 backdrop-blur flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-[#181d2a] text-gray-300 rounded-xl border border-[#272e42]"
            >
              <Menu size={18} />
            </button>

            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'store' ? "Search 3D models, PBR shaders, environments..." : "Search project files on computer..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181d2a] border border-[#272e42] rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Open or detect a saved .modcx / .json project file from your computer folder"
              className="px-3 py-2 bg-[#181e2b] hover:bg-[#232b3e] border border-[#2e374e] text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FolderOpen size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">Open Project from Computer</span>
              <span className="sm:hidden">Open File</span>
            </button>

            <button
              onClick={() => handleCreateNewProject()}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Plus size={15} />
              <span>New Project</span>
            </button>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* LIBRARY & PROJECTS TAB */}
          {activeTab === 'library' && (
            <div className="space-y-8">
              {/* SAVED PROJECTS SECTION */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                      <FolderOpen size={18} className="text-cyan-400" /> Detected Projects ({filteredProjects.length})
                    </h2>
                    <p className="text-xs text-gray-400">Manage 3D projects saved in your computer folder or local workspace.</p>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                  >
                    <HardDrive size={13} /> Open Project File from Computer Folder
                  </button>
                </div>

                {filteredProjects.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#121520] border border-[#22283a] text-gray-400">
                    <Box size={36} className="mx-auto text-gray-600 mb-3" />
                    <h3 className="text-base font-bold text-gray-200 mb-1">No Project Files Found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                      Create a new project or select an existing project file (.modcx / .json) from your computer folder.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleCreateNewProject()}
                        className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                      >
                        + Create New Project
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 bg-[#1a202c] hover:bg-[#222a3a] border border-[#2d3748] text-gray-200 font-bold text-xs rounded-xl transition-all"
                      >
                        Open from Computer Folder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProjects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => onOpenScene(proj.data)}
                        className="group bg-[#121520] hover:bg-[#181c2b] border border-[#23293c] hover:border-cyan-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-md relative"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <Box size={18} />
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => handleSaveProjectToComputer(proj, e)}
                              title="Save / Download Project File to Computer Folder (.modcx.json)"
                              className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(proj.id, e)}
                              title="Delete Project"
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors truncate">
                          {proj.name}
                        </h3>

                        <div className="text-[10px] text-gray-500 font-mono truncate mb-2">
                          {proj.filePath || 'Computer Folder / Workspace'}
                        </div>

                        <div className="text-[11px] text-gray-400 flex items-center gap-3 font-mono mb-4">
                          <span>{proj.objectCount} Objects</span>
                          <span>•</span>
                          <span>{proj.updatedAt}</span>
                        </div>

                        <div className="pt-3 border-t border-[#1e2436] flex items-center justify-between text-xs font-semibold text-cyan-400">
                          <span>Open in 3D Studio</span>
                          <Play size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* STORE TAB */}
          {activeTab === 'store' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="border-b border-[#1f2536] pb-5">
                <h2 className="text-xl font-extrabold text-white tracking-tight mb-1 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-cyan-400" /> modcx3D Store
                </h2>
                <p className="text-xs text-gray-400">
                  Discover free &amp; premium 3D models, PBR materials, sky environments, and scene graphs.
                </p>
              </div>

              {/* Store Coming Soon Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131726] via-[#101420] to-[#0a0d16] border border-[#232b3e] p-8 md:p-12 shadow-2xl">
                {/* Background Ambient Glow */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-extrabold text-[10px] tracking-widest uppercase">
                    <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                    <span>Store Coming Soon • v2.5 Marketplace Update</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                    The Official modcx<span className="text-cyan-400">3D</span> Asset Marketplace
                  </h3>

                  <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                    We are engineering an integrated asset ecosystem. Soon you will be able to search, publish, and install verified GLTF/GLB models, seamless procedural PBR materials, HDRI sky environments, and interactive scene templates directly inside your 3D Studio!
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setActiveTab('library')}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                    >
                      <LayoutGrid size={14} /> Back to Library &amp; Projects
                    </button>
                    <button
                      onClick={() => handleCreateNewProject()}
                      className="px-5 py-2.5 bg-[#1a202e] hover:bg-[#222a3d] border border-[#2e374e] text-gray-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                    >
                      <Play size={14} className="text-cyan-400" /> Open 3D Studio Canvas
                    </button>
                  </div>
                </div>

                {/* Grid of Planned Categories */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-[#1e2536]">
                  <div className="p-4 rounded-2xl bg-[#121624]/80 border border-[#22293b]">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                      <Box size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">3D Model Vault</h4>
                    <p className="text-[11px] text-gray-400 leading-snug mb-3">
                      High-detail GLTF/GLB low-poly &amp; hard-surface assets.
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 font-mono">Coming Soon</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#121624]/80 border border-[#22293b]">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
                      <Palette size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">PBR Material Shaders</h4>
                    <p className="text-[11px] text-gray-400 leading-snug mb-3">
                      Roughness, metalness, carbon fiber &amp; metallic texture maps.
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 font-mono">Coming Soon</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#121624]/80 border border-[#22293b]">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                      <ImageIcon size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">HDRI Sky Environments</h4>
                    <p className="text-[11px] text-gray-400 leading-snug mb-3">
                      4K equirectangular studio lighting and outdoor skies.
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 font-mono">Coming Soon</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#121624]/80 border border-[#22293b]">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                      <Layers size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">Scene Graph Templates</h4>
                    <p className="text-[11px] text-gray-400 leading-snug mb-3">
                      Pre-configured physics, particle systems &amp; camera animation rigs.
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

