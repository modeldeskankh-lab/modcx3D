import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { EditorEngine } from './three/EditorEngine';
import { MenuBar } from './components/MenuBar';
import { Viewport } from './Viewport';
import { Hierarchy } from './components/Hierarchy';
import { Inspector } from './components/Inspector';
import { AssetBrowser } from './AssetBrowser';
import { ExportScene } from './ExportScene';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SaveSceneModal } from './components/SaveSceneModal';
import { GLBImportModal } from './components/GLBImportModal';
import { ContextMenu } from './components/ContextMenu';
import { AssetDetailsModal } from './components/AssetDetailsModal';
import { SceneManager } from './SceneManager';
import { SelectionManager } from './SelectionManager';
import { TransformManager } from './TransformManager';
import { AssetManager } from './AssetManager';
import { SceneObjectData, TransformMode, TransformSpace, Vec3, MaterialData, MaterialConfig, LightData, EnvironmentSettings, SkyConfig, FogConfig, EditorSceneData, WaterConfig, WaterPreset, WaterType } from './types/editor';
import * as THREE from 'three';
import { HistoryManager, HistoryAction, TransformSnapshot } from './state/historyManager';
import { SceneSerializer } from './utils/sceneSerializer';
import { SAMPLE_SCENES } from './utils/sampleScenes';
import { TEXTURE_PRESETS } from './utils/proceduralTextures';
import { DEFAULT_ENVIRONMENT_SETTINGS } from './utils/environmentPresets';
import { AlertCircle, CheckCircle2, ListTree, Sliders, Folder, Sparkles, Loader2 } from 'lucide-react';

interface SceneEditorProps {
  onBackToHub?: () => void;
  initialSceneData?: EditorSceneData | null;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({
  onBackToHub,
  initialSceneData
}) => {
  const engineRef = useRef<EditorEngine | null>(null);
  const historyManagerRef = useRef<HistoryManager>(new HistoryManager());
  const sceneManagerRef = useRef<SceneManager>(new SceneManager());
  const transformManagerRef = useRef<TransformManager>(new TransformManager());
  const selectionManagerRef = useRef<SelectionManager>(new SelectionManager());
  const fileInputForReplaceRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<SceneObjectData | null>(null);

  // Editor State
  const [objects, setObjects] = useState<SceneObjectData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<SceneObjectData | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [transformSpace, setTransformSpace] = useState<TransformSpace>('world');
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [axesVisible, setAxesVisible] = useState(true);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [isPlayPaused, setIsPlayPaused] = useState(false);
  const [stats, setStats] = useState({ fps: 60, drawCalls: 10, triangles: 500 });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [customTextures, setCustomTextures] = useState<{ id: string; name: string; url: string }[]>([]);
  const [isAssetBrowserCollapsed, setIsAssetBrowserCollapsed] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExportSceneOpen, setIsExportSceneOpen] = useState(false);
  const [isSaveSceneModalOpen, setIsSaveSceneModalOpen] = useState(false);
  const [isAssetDetailsOpen, setIsAssetDetailsOpen] = useState(false);
  const [assetDetailsTarget, setAssetDetailsTarget] = useState<SceneObjectData | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number } | null;
    targetObject: SceneObjectData | null;
  }>({ position: null, targetObject: null });
  const [sceneName, setSceneName] = useState('modcx3D Scene');
  const [hasSavedOnce, setHasSavedOnce] = useState<boolean>(false);
  const [sceneFileName, setSceneFileName] = useState<string>('scene.json');
  const [environment, setEnvironment] = useState<EnvironmentSettings>(DEFAULT_ENVIRONMENT_SETTINGS);
  const [inspectorTab, setInspectorTab] = useState<'object' | 'material' | 'environment'>('object');
  const [sceneMaterials, setSceneMaterials] = useState<MaterialConfig[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [pendingGLBFile, setPendingGLBFile] = useState<File | null>(null);

  // Camera View State & Has Camera Check
  const [isCameraViewOpen, setIsCameraViewOpen] = useState<boolean>(false);

  const hasCamera = useMemo(() => {
    const checkCam = (list: SceneObjectData[]): boolean => {
      return list.some(
        (obj) =>
          obj.type === 'camera' ||
          obj.name.toLowerCase().includes('camera') ||
          obj.userData?.type === 'camera' ||
          (obj.children && checkCam(obj.children))
      );
    };
    return checkCam(objects);
  }, [objects]);

  // Scene Loading Screen State
  const [isLoadingScene, setIsLoadingScene] = useState<boolean>(true);
  const [sceneLoadingProgress, setSceneLoadingProgress] = useState<number>(0);
  const [sceneLoadingStatus, setSceneLoadingStatus] = useState<string>('Initializing WebGL 3D Engine...');

  // Mobile Drawer State
  const [mobileActiveTab, setMobileActiveTab] = useState<'hierarchy' | 'inspector' | 'assets' | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Push an action into history
  const pushHistoryAction = useCallback((action: HistoryAction) => {
    historyManagerRef.current.push(action);
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
    sceneManagerRef.current.markDirty();
  }, []);

  // Update React scene tree representation from Three.js scene
  const refreshSceneTree = useCallback(() => {
    if (!engineRef.current) return;
    const list: SceneObjectData[] = [];
    for (const child of engineRef.current.sceneObjectsGroup.children) {
      if (child.name === '__EDITOR_HELPERS__') continue;
      list.push(engineRef.current.extractObjectData(child));
    }
    setObjects(list);
    setSceneMaterials(engineRef.current.getAllSceneMaterials());
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, []);

  // Object selection handler
  const handleSelectObject = useCallback((id: string | null) => {
    if (!engineRef.current) return;
    if (!id) {
      engineRef.current.selectObject(null);
      return;
    }
    let target: THREE.Object3D | null = null;
    engineRef.current.sceneObjectsGroup.traverse((obj) => {
      if (obj.uuid === id) {
        target = obj;
      }
    });
    engineRef.current.selectObject(target);
  }, []);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (!engineRef.current || !historyManagerRef.current.canUndo()) {
      showToast('Nothing to undo', 'info');
      return;
    }
    const action = historyManagerRef.current.undo();
    if (!action) return;

    if (action.type === 'transform') {
      let targetObj: THREE.Object3D | null = null;
      engineRef.current.sceneObjectsGroup.traverse((o) => {
        if (o.uuid === action.objectId) targetObj = o;
      });
      if (targetObj) {
        (targetObj as THREE.Object3D).position.set(action.before.pos.x, action.before.pos.y, action.before.pos.z);
        (targetObj as THREE.Object3D).rotation.set(action.before.rot.x, action.before.rot.y, action.before.rot.z);
        (targetObj as THREE.Object3D).scale.set(action.before.scale.x, action.before.scale.y, action.before.scale.z);
        if (engineRef.current.selectedObject?.uuid === (targetObj as THREE.Object3D).uuid) {
          engineRef.current.transformControls.attach(targetObj as THREE.Object3D);
          engineRef.current.updateSelectionBox();
          setSelectedData(engineRef.current.extractObjectData(targetObj as THREE.Object3D));
        }
        engineRef.current.callbacks.onSceneModified();
      }
      showToast(`Undo: ${action.description || 'Transform'}`, 'info');
    } else if (action.type === 'create') {
      if (action.object3D) {
        engineRef.current.removeObject(action.object3D);
      }
      showToast(`Undo: ${action.description || 'Add Object'}`, 'info');
    } else if (action.type === 'delete') {
      if (action.object3D) {
        engineRef.current.restoreObject(action.object3D);
      }
      showToast(`Undo: ${action.description || 'Delete Object'}`, 'info');
    } else if (action.type === 'material') {
      let targetObj: THREE.Object3D | null = null;
      engineRef.current.sceneObjectsGroup.traverse((o) => {
        if (o.uuid === action.objectId) targetObj = o;
      });
      if (targetObj) {
        engineRef.current.selectObject(targetObj);
        engineRef.current.updateSelectedMaterial(action.before);
      }
      showToast(`Undo: ${action.description || 'Material Change'}`, 'info');
    }

    refreshSceneTree();
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, [refreshSceneTree, showToast]);

  const handleRedo = useCallback(() => {
    if (!engineRef.current || !historyManagerRef.current.canRedo()) {
      showToast('Nothing to redo', 'info');
      return;
    }
    const action = historyManagerRef.current.redo();
    if (!action) return;

    if (action.type === 'transform') {
      let targetObj: THREE.Object3D | null = null;
      engineRef.current.sceneObjectsGroup.traverse((o) => {
        if (o.uuid === action.objectId) targetObj = o;
      });
      if (targetObj) {
        (targetObj as THREE.Object3D).position.set(action.after.pos.x, action.after.pos.y, action.after.pos.z);
        (targetObj as THREE.Object3D).rotation.set(action.after.rot.x, action.after.rot.y, action.after.rot.z);
        (targetObj as THREE.Object3D).scale.set(action.after.scale.x, action.after.scale.y, action.after.scale.z);
        if (engineRef.current.selectedObject?.uuid === (targetObj as THREE.Object3D).uuid) {
          engineRef.current.transformControls.attach(targetObj as THREE.Object3D);
          engineRef.current.updateSelectionBox();
          setSelectedData(engineRef.current.extractObjectData(targetObj as THREE.Object3D));
        }
        engineRef.current.callbacks.onSceneModified();
      }
      showToast(`Redo: ${action.description || 'Transform'}`, 'info');
    } else if (action.type === 'create') {
      if (action.object3D) {
        engineRef.current.restoreObject(action.object3D);
      }
      showToast(`Redo: ${action.description || 'Add Object'}`, 'info');
    } else if (action.type === 'delete') {
      if (action.object3D) {
        engineRef.current.removeObject(action.object3D);
      }
      showToast(`Redo: ${action.description || 'Delete Object'}`, 'info');
    } else if (action.type === 'material') {
      let targetObj: THREE.Object3D | null = null;
      engineRef.current.sceneObjectsGroup.traverse((o) => {
        if (o.uuid === action.objectId) targetObj = o;
      });
      if (targetObj) {
        engineRef.current.selectObject(targetObj);
        engineRef.current.updateSelectedMaterial(action.after);
      }
      showToast(`Redo: ${action.description || 'Material Change'}`, 'info');
    }

    refreshSceneTree();
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, [refreshSceneTree, showToast]);

  const handleDeleteObject = useCallback((id?: string) => {
    if (!engineRef.current) return;
    if (id) {
      handleSelectObject(id);
    }
    const selected = engineRef.current.selectedObject;
    if (!selected) {
      showToast('No object selected to delete', 'info');
      return;
    }
    const name = selected.name || 'Object';
    const uuid = selected.uuid;
    const deletedObj = engineRef.current.deleteSelected();
    if (deletedObj) {
      pushHistoryAction({
        type: 'delete',
        objectId: uuid,
        object3D: deletedObj,
        description: `Delete ${name}`
      });
      showToast(`Deleted "${name}"`, 'info');
      refreshSceneTree();
    }
  }, [handleSelectObject, pushHistoryAction, refreshSceneTree, showToast]);

  const handleDuplicateObject = useCallback((id?: string) => {
    if (!engineRef.current) return;
    if (id) {
      handleSelectObject(id);
    }
    const selected = engineRef.current.selectedObject;
    if (!selected) {
      showToast('No object selected to duplicate', 'info');
      return;
    }
    const originalName = selected.name || 'Object';
    const clone = engineRef.current.duplicateSelected();
    if (clone) {
      pushHistoryAction({
        type: 'create',
        objectId: clone.uuid,
        object3D: clone,
        description: `Duplicate ${originalName}`
      });
      showToast(`Duplicated "${clone.name}"`, 'info');
      refreshSceneTree();
    }
  }, [handleSelectObject, pushHistoryAction, refreshSceneTree, showToast]);

  const performSilentSave = useCallback(async () => {
    if (!engineRef.current) return;
    try {
      showToast(`Saving scene "${sceneName}"...`, 'info');
      const sceneData = await SceneSerializer.serializeAsync(engineRef.current, sceneName);

      // Persist to browser cache / local storage
      try {
        const stored = localStorage.getItem('modcx3d_saved_projects');
        let projects = stored ? JSON.parse(stored) : [];
        projects = projects.filter((p: any) =>
          p.id !== 'proj_default' &&
          !['Blank 3D Canvas', 'Untitled 3D Scene', 'Main 3D Workspace Scene'].includes(p.name)
        );
        const existingIndex = projects.findIndex((p: any) => p.name === sceneName);
        const newProj = {
          id: existingIndex >= 0 ? projects[existingIndex].id : `proj_${Date.now()}`,
          name: sceneName,
          updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          objectCount: sceneData.objects?.length || 0,
          filePath: `Browser Cache / Local Storage`,
          data: sceneData
        };
        if (existingIndex >= 0) {
          projects[existingIndex] = newProj;
        } else {
          projects.unshift(newProj);
        }
        localStorage.setItem('modcx3d_saved_projects', JSON.stringify(projects));
        localStorage.setItem('modcx3d_last_saved_scene', JSON.stringify(newProj));
      } catch (e) {
        console.warn('Silent cache save failed', e);
      }

      // Direct JSON download
      const jsonStr = JSON.stringify(sceneData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sceneFileName || `${sceneName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') || 'scene'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Scene "${sceneName}" saved successfully!`, 'success');
    } catch (err: any) {
      showToast('Save failed: ' + err.message, 'error');
    }
  }, [sceneName, sceneFileName, showToast]);

  const handleSaveScene = useCallback(() => {
    if (hasSavedOnce) {
      performSilentSave();
    } else {
      setIsSaveSceneModalOpen(true);
    }
  }, [hasSavedOnce, performSilentSave]);

  const handleSaveSceneAs = useCallback(() => {
    setIsSaveSceneModalOpen(true);
  }, []);

  // Keep references updated for global keyboard listener and engine callbacks
  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  const handleDeleteRef = useRef(handleDeleteObject);
  const handleDuplicateRef = useRef(handleDuplicateObject);
  const handleSaveRef = useRef(handleSaveScene);

  useEffect(() => {
    handleUndoRef.current = handleUndo;
    handleRedoRef.current = handleRedo;
    handleDeleteRef.current = handleDeleteObject;
    handleDuplicateRef.current = handleDuplicateObject;
    handleSaveRef.current = handleSaveScene;
  });

  // Transform Controls Handlers
  const handleSetTransformMode = useCallback((mode: TransformMode) => {
    setTransformMode(mode);
    transformManagerRef.current.setMode(mode);
    engineRef.current?.setTransformMode(mode);
  }, []);

  // Initialize Three.js Engine on Mount
  useEffect(() => {
    const container = document.getElementById('viewport-container');
    if (!container) return;

    const engine = new EditorEngine(container, {
      onSelectionChange: (obj, data) => {
        setSelectedId(obj ? obj.uuid : null);
        setSelectedData(data);
        selectionManagerRef.current.setSelection(obj);
      },
      onTransformChange: (data) => {
        setSelectedData(data);
        setObjects((prev) =>
          prev.map((o) =>
            o.id === data.id
              ? { ...o, position: data.position, rotation: data.rotation, scale: data.scale }
              : o
          )
        );
      },
      onTransformEnd: (data, before, after) => {
        setSelectedData(data);
        if (before && after) {
          pushHistoryAction({
            type: 'transform',
            objectId: data.id,
            before,
            after,
            description: `Transform ${data.name}`
          });
        }
        refreshSceneTree();
        sceneManagerRef.current.markDirty();
      },
      onTransformModeChange: (mode) => {
        setTransformMode(mode);
        transformManagerRef.current.setMode(mode);
      },
      onShortcutAction: (action) => {
        if (action === 'undo') handleUndoRef.current();
        else if (action === 'redo') handleRedoRef.current();
        else if (action === 'delete') handleDeleteRef.current();
        else if (action === 'duplicate') handleDuplicateRef.current();
        else if (action === 'save') handleSaveRef.current();
      },
      onSceneModified: () => {
        refreshSceneTree();
        sceneManagerRef.current.markDirty();
      },
      onStatsUpdate: (s) => {
        setStats(s);
      },
      onMaterialsChanged: (mats) => {
        setSceneMaterials(mats);
      },
      onError: (msg) => {
        showToast(msg, 'error');
      }
    });

    engineRef.current = engine;
    sceneManagerRef.current.setEngine(engine);

    // Create Initial Scene or Load Provided Scene Data with Loading Progress Bar
    const initSceneData = async () => {
      setIsLoadingScene(true);
      setSceneLoadingProgress(10);
      setSceneLoadingStatus('Initializing WebGL 2.0 Canvas & Graphics Context...');

      try {
        if (initialSceneData) {
          if (initialSceneData.name) {
            setSceneName(initialSceneData.name);
          }
          await SceneSerializer.deserialize(engine, initialSceneData, (progress, status) => {
            setSceneLoadingProgress(progress);
            setSceneLoadingStatus(status);
          });
        } else {
          setSceneLoadingProgress(35);
          setSceneLoadingStatus('Building Studio Workspace & Demo Geometry...');
          engine.createInitialDemoScene();
          setSceneLoadingProgress(100);
          setSceneLoadingStatus('WebGL 3D Studio Ready!');
        }
      } catch (err: any) {
        showToast('Error initializing scene: ' + (err?.message || 'Unknown error'), 'error');
      } finally {
        setEnvironment(engine.getEnvironmentSettings());
        refreshSceneTree();

        // Register initial procedural textures into AssetManager so export includes them
        TEXTURE_PRESETS.forEach((preset) => {
          AssetManager.getInstance().registerProceduralTexture(preset.id, `${preset.id}.png`, preset.thumbnail);
        });

        setTimeout(() => {
          setIsLoadingScene(false);
        }, 400);
      }
    };

    initSceneData();

    // Global keyboard listeners
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

      const key = e.key.toLowerCase();
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && (key === 'z' || e.code === 'KeyZ')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoRef.current();
        } else {
          handleUndoRef.current();
        }
      } else if (isCtrlOrMeta && (key === 'y' || e.code === 'KeyY')) {
        e.preventDefault();
        handleRedoRef.current();
      } else if (isCtrlOrMeta && (key === 's' || e.code === 'KeyS')) {
        e.preventDefault();
        handleSaveRef.current();
      } else if (isCtrlOrMeta && (key === 'd' || e.code === 'KeyD')) {
        e.preventDefault();
        handleDuplicateRef.current();
      } else if (key === 'delete' || key === 'backspace' || e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        handleDeleteRef.current();
      } else if (!isCtrlOrMeta && !e.altKey) {
        if (key === 'w' || e.code === 'KeyW') {
          handleSetTransformMode('translate');
        } else if (key === 'e' || e.code === 'KeyE') {
          handleSetTransformMode('rotate');
        } else if (key === 'r' || e.code === 'KeyR') {
          handleSetTransformMode('scale');
        } else if (key === 'f' || e.code === 'KeyF') {
          engineRef.current?.focusSelected();
        } else if (key === 'home' || e.code === 'Home') {
          engineRef.current?.frameAll();
        } else if (key === 'escape' || e.code === 'Escape') {
          engineRef.current?.selectObject(null);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, [pushHistoryAction, refreshSceneTree, showToast, handleSetTransformMode]);

  // Visibility & Lock toggles
  const handleToggleVisibility = (id: string, currentVisible: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.sceneObjectsGroup.traverse((obj) => {
      if (obj.uuid === id) {
        obj.visible = !currentVisible;
      }
    });
    refreshSceneTree();
  };

  const handleToggleLock = (id: string, currentLocked: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.sceneObjectsGroup.traverse((obj) => {
      if (obj.uuid === id) {
        obj.userData.locked = !currentLocked;
      }
    });
    refreshSceneTree();
  };

  const handleRenameObject = (id: string, newName: string) => {
    if (!engineRef.current) return;
    engineRef.current.sceneObjectsGroup.traverse((obj) => {
      if (obj.uuid === id) {
        obj.name = newName;
      }
    });
    refreshSceneTree();
  };

  // Object Addition with Undo/Redo tracking
  const handleAddPrimitive = (type: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus' | 'capsule') => {
    if (!engineRef.current) return;
    const mesh = engineRef.current.addPrimitive(type);
    if (mesh) {
      pushHistoryAction({
        type: 'create',
        objectId: mesh.uuid,
        object3D: mesh,
        description: `Add ${mesh.name}`
      });
    }
    showToast(`Added ${type}`, 'success');
  };

  const handleAddWater = (type: 'ocean' | 'river' | 'lake' = 'ocean', preset?: WaterPreset) => {
    if (!engineRef.current) return;
    const waterMesh = engineRef.current.addWater(type, preset);
    if (waterMesh) {
      pushHistoryAction({
        type: 'create',
        objectId: waterMesh.uuid,
        object3D: waterMesh,
        description: `Add ${waterMesh.name}`
      });
    }
    showToast(`Added ${type === 'river' ? 'River' : type === 'lake' ? 'Lake' : 'Ocean'} Simulation`, 'success');
  };

  const handleTogglePlay = useCallback(() => {
    if (!engineRef.current) return;
    if (isPlayMode) {
      engineRef.current.stopPlayMode();
      setIsPlayMode(false);
      setIsPlayPaused(false);
      showToast('Exited Play Mode', 'info');
    } else {
      engineRef.current.startPlayMode();
      setIsPlayMode(true);
      setIsPlayPaused(false);
      showToast('Started Unity 3D Gameplay Simulation', 'success');
    }
  }, [isPlayMode, showToast]);

  const handleTogglePause = useCallback(() => {
    if (!engineRef.current || !isPlayMode) return;
    engineRef.current.togglePausePlay();
    setIsPlayPaused((prev) => !prev);
    showToast(engineRef.current.isPlayPaused ? 'Paused Gameplay' : 'Resumed Gameplay', 'info');
  }, [isPlayMode, showToast]);

  const handleAddCharacterController = useCallback((type: 'fpv' | 'tpv' | 'drone' = 'fpv') => {
    if (!engineRef.current) return;
    const playerGroup = engineRef.current.addCharacterController(type);
    if (playerGroup) {
      pushHistoryAction({
        type: 'create',
        objectId: playerGroup.uuid,
        object3D: playerGroup,
        description: `Add ${type.toUpperCase()} Character Controller`
      });
      refreshSceneTree();
    }
    const label = type === 'fpv' ? 'FPV First-Person Player' : type === 'tpv' ? 'TPV Third-Person Player' : 'Drone Rig';
    showToast(`Added ${label} & focused in viewport`, 'success');
  }, [pushHistoryAction, refreshSceneTree, showToast]);

  const handleUpdateWater = (updates: Partial<WaterConfig>) => {
    if (!engineRef.current) return;
    engineRef.current.updateSelectedWater(updates);
    refreshSceneTree();
  };

  const handleApplyWaterPreset = (preset: WaterPreset) => {
    if (!engineRef.current) return;
    engineRef.current.applySelectedWaterPreset(preset);
    refreshSceneTree();
    showToast(`Applied ${preset} Water Preset`, 'info');
  };

  const handleAddLight = (type: 'directional' | 'point' | 'spot' | 'ambient') => {
    if (!engineRef.current) return;
    const light = engineRef.current.addLight(type);
    if (light) {
      pushHistoryAction({
        type: 'create',
        objectId: light.uuid,
        object3D: light,
        description: `Add ${light.name}`
      });
    }
    showToast(`Added ${type} light`, 'success');
  };

  const handleAddCamera = () => {
    if (!engineRef.current) return;
    const cam = engineRef.current.addCamera();
    if (cam) {
      pushHistoryAction({
        type: 'create',
        objectId: cam.uuid,
        object3D: cam,
        description: `Add Camera`
      });
    }
    setIsCameraViewOpen(true);
    showToast('Added Camera (Camera View enabled)', 'success');
  };

  const handleAddEmpty = () => {
    if (!engineRef.current) return;
    const empty = engineRef.current.addEmptyObject();
    if (empty) {
      pushHistoryAction({
        type: 'create',
        objectId: empty.uuid,
        object3D: empty,
        description: `Add Empty GameObject`
      });
    }
    showToast('Added Empty Node', 'success');
  };

  const handleAddPresetModel = (presetId: string) => {
    if (!engineRef.current) return;
    const model = engineRef.current.addPresetModel(presetId);
    if (model) {
      pushHistoryAction({
        type: 'create',
        objectId: model.uuid,
        object3D: model,
        description: `Add ${model.name}`
      });
    }
    showToast('Added Model to Scene', 'success');
  };

  // Coordinate Space & Helpers
  const handleToggleTransformSpace = () => {
    const next = transformSpace === 'world' ? 'local' : 'world';
    setTransformSpace(next);
    engineRef.current?.setTransformSpace(next);
  };

  const handleToggleSnap = () => {
    const next = !snapEnabled;
    setSnapEnabled(next);
    engineRef.current?.setSnapEnabled(next);
    showToast(next ? 'Snapping ON' : 'Snapping OFF', 'info');
  };

  const handleToggleGrid = () => {
    const next = !gridVisible;
    setGridVisible(next);
    engineRef.current?.setGridVisible(next);
  };

  const handleToggleAxes = () => {
    const next = !axesVisible;
    setAxesVisible(next);
    engineRef.current?.setAxesVisible(next);
  };

  // Environment Handlers (Sky, HDRI, Fog)
  const handleUpdateSky = useCallback((updates: Partial<SkyConfig>) => {
    if (!engineRef.current) return;
    engineRef.current.updateSky(updates);
    setEnvironment(engineRef.current.getEnvironmentSettings());
  }, []);

  const handleUpdateFog = useCallback((updates: Partial<FogConfig>) => {
    if (!engineRef.current) return;
    engineRef.current.updateFog(updates);
    setEnvironment(engineRef.current.getEnvironmentSettings());
  }, []);

  const handleApplyEnvironmentPreset = useCallback((presetId: string) => {
    if (!engineRef.current) return;
    engineRef.current.applyEnvironmentPreset(presetId);
    setEnvironment(engineRef.current.getEnvironmentSettings());
    showToast('Applied atmosphere preset', 'success');
  }, [showToast]);

  const handleUploadHDRI = useCallback(async (file: File) => {
    if (!engineRef.current) return;
    try {
      showToast(`Loading HDRI: ${file.name}...`, 'info');
      await engineRef.current.applyHDRIFile(file);
      setEnvironment(engineRef.current.getEnvironmentSettings());
      showToast(`Applied HDRI background: ${file.name}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to load HDRI file', 'error');
    }
  }, [showToast]);

  const handleOpenEnvironment = useCallback(() => {
    setInspectorTab('environment');
    setMobileActiveTab('inspector');
    showToast('Opened Sky & Atmosphere panel', 'info');
  }, [showToast]);

  // Viewport camera focus
  const handleFocusSelected = () => {
    engineRef.current?.focusSelected();
  };

  const handleFrameAll = () => {
    engineRef.current?.frameAll();
  };

  // Material and Texture Handlers
  const handleApplyMaterialPreset = (mat: any) => {
    if (!engineRef.current || !engineRef.current.selectedObject) return;
    const obj = engineRef.current.selectedObject;
    const beforeMat = selectedData?.material ? { ...selectedData.material } : null;

    engineRef.current.updateSelectedMaterial({
      color: mat.color,
      roughness: mat.roughness,
      metalness: mat.metalness,
      wireframe: mat.wireframe || false
    });

    const updatedData = engineRef.current.extractObjectData(obj);
    setSelectedData(updatedData);

    if (beforeMat && updatedData.material) {
      pushHistoryAction({
        type: 'material',
        objectId: obj.uuid,
        before: beforeMat,
        after: { ...updatedData.material },
        description: `Apply ${mat.name} material`
      });
    }
    showToast(`Applied ${mat.name} material`, 'success');
  };

  const handleApplyPresetTexture = (presetId: string) => {
    if (!engineRef.current) return;
    const texData = TEXTURE_PRESETS.find((t) => t.id === presetId);
    if (texData) {
      AssetManager.getInstance().registerProceduralTexture(presetId, `${presetId}.png`, texData.thumbnail);
    }
    engineRef.current.applyPresetTexture(presetId);
    showToast(`Applied texture`, 'success');
  };

  const handleUploadTextureFile = async (file: File) => {
    if (!engineRef.current) return;
    try {
      await AssetManager.getInstance().registerTextureFile(file);
      const url = await engineRef.current.uploadTextureFile(file);
      setCustomTextures((prev) => [...prev, { id: file.name, name: file.name, url }]);
      showToast(`Uploaded texture ${file.name}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload texture', 'error');
    }
  };

  // 3D Model File Import (.glb, .gltf) - Triggers Import Modal Selection
  const handleImportGLBFile = async (file: File) => {
    setPendingGLBFile(file);
  };

  const handleConfirmImportGLB = async (file: File, mode: 'combined' | 'layers') => {
    if (!engineRef.current) return;
    try {
      setImportProgress(10);
      await AssetManager.getInstance().registerModelFile(file);
      const imported = await engineRef.current.importGLBFile(file, (p) => setImportProgress(p), mode);
      if (imported) {
        pushHistoryAction({
          type: 'create',
          objectId: imported.uuid,
          object3D: imported,
          description: `Import ${imported.name} (${mode})`
        });
      }
      refreshSceneTree();
      showToast(
        `Imported ${file.name} as ${mode === 'combined' ? 'Combined Model' : 'Layer Hierarchy'}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to import 3D model', 'error');
    } finally {
      setImportProgress(null);
    }
  };

  // Folder & Hierarchy Management Handlers
  const handleCreateFolder = useCallback(
    (name?: string, parentId?: string) => {
      if (!engineRef.current) return;
      const folder = engineRef.current.createFolder(name || 'New Folder', parentId);
      if (folder) {
        pushHistoryAction({
          type: 'create',
          objectId: folder.uuid,
          object3D: folder,
          description: `Create ${folder.name}`
        });
      }
      refreshSceneTree();
      showToast(`Created folder: ${folder?.name || name || 'New Folder'}`, 'success');
    },
    [pushHistoryAction, refreshSceneTree, showToast]
  );

  const handleReparentObject = useCallback(
    (childId: string, parentId: string | null) => {
      if (!engineRef.current) return;
      const success = engineRef.current.reparentObject(childId, parentId);
      if (success) {
        refreshSceneTree();
        showToast('Moved object in hierarchy', 'info');
      }
    },
    [refreshSceneTree, showToast]
  );

  const handleUngroupFolder = useCallback(
    (folderId: string) => {
      if (!engineRef.current) return;
      const success = engineRef.current.ungroupFolder(folderId);
      if (success) {
        refreshSceneTree();
        showToast('Ungrouped folder contents', 'info');
      }
    },
    [refreshSceneTree, showToast]
  );

  // Model File Controller & Management Handlers
  const handlePerformReplace = async (targetId: string, file: File) => {
    if (!engineRef.current) return;
    try {
      showToast(`Replacing model with ${file.name}...`, 'info');
      const newMesh = await engineRef.current.replaceModel(targetId, file);
      if (newMesh) {
        refreshSceneTree();
        setSelectedData(engineRef.current.extractObjectData(newMesh));
        showToast(`Model successfully replaced with ${file.name}`, 'success');
      }
    } catch (err: any) {
      showToast(`Failed to replace GLB model: ${err.message}`, 'error');
    }
  };

  const handleReplaceGLB = (targetObject: SceneObjectData, file?: File) => {
    if (file) {
      handlePerformReplace(targetObject.id, file);
    } else {
      replaceTargetRef.current = targetObject;
      fileInputForReplaceRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && replaceTargetRef.current) {
      handlePerformReplace(replaceTargetRef.current.id, e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleReimportModel = async (targetObject?: SceneObjectData) => {
    if (!engineRef.current) return;
    const target = targetObject || selectedData;
    if (!target) return;
    try {
      showToast(`Reimporting model "${target.name}"...`, 'info');
      const reimported = await engineRef.current.reimportModel(target.id);
      if (reimported) {
        refreshSceneTree();
        setSelectedData(engineRef.current.extractObjectData(reimported));
        showToast(`Reimported "${target.name}"`, 'success');
      }
    } catch (err: any) {
      showToast(`Reimport failed: ${err.message}`, 'error');
    }
  };

  const handleExploreFolders = (targetObject?: SceneObjectData) => {
    const target = targetObject || selectedData;
    if (target) {
      setAssetDetailsTarget(target);
      setIsAssetDetailsOpen(true);
    }
  };

  const handleExportGLB = (targetObject?: SceneObjectData) => {
    if (!engineRef.current) return;
    const target = targetObject || selectedData;
    if (!target) return;
    try {
      engineRef.current.exportSelectedGLB(target.id);
      showToast(`Exported "${target.name}.glb"`, 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  };

  const handleCopyPath = (targetObject?: SceneObjectData) => {
    const target = targetObject || selectedData;
    if (!target) return;
    const path =
      target.folderLocation ||
      target.modelMetadata?.folderLocation ||
      target.modelMetadata?.fileLocation ||
      target.modelUrl ||
      `models/${target.name}.glb`;
    navigator.clipboard.writeText(path);
    showToast(`Copied folder path: ${path}`, 'success');
  };

  const handleUpdateFolderLocation = (targetId: string, location: string) => {
    if (!engineRef.current) return;
    engineRef.current.updateModelFolderLocation(targetId, location);
    refreshSceneTree();
    if (selectedData && selectedData.id === targetId) {
      setSelectedData({ ...selectedData, folderLocation: location });
    }
    showToast('Updated model folder location URL', 'success');
  };

  const handleContextMenuObject = (obj: SceneObjectData, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelectObject(obj.id);
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      targetObject: obj
    });
  };

  const handleContextMenuEmpty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      targetObject: null
    });
  };

  const handleViewportContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Disable context menu inside 3D viewport on right click (only allowed inside left panel)
    setContextMenu({
      position: null,
      targetObject: null
    });
  };

  // Inspector property handlers with undo/redo support
  const handleUpdateTransform = (pos?: Vec3, rotDeg?: Vec3, scale?: Vec3) => {
    if (!engineRef.current || !engineRef.current.selectedObject) return;
    const obj = engineRef.current.selectedObject;
    const before: TransformSnapshot = {
      pos: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rot: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
      rotDeg: {
        x: THREE.MathUtils.radToDeg(obj.rotation.x),
        y: THREE.MathUtils.radToDeg(obj.rotation.y),
        z: THREE.MathUtils.radToDeg(obj.rotation.z)
      },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
    };

    engineRef.current.updateSelectedTransform(pos, rotDeg, scale);

    const after: TransformSnapshot = {
      pos: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rot: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
      rotDeg: {
        x: THREE.MathUtils.radToDeg(obj.rotation.x),
        y: THREE.MathUtils.radToDeg(obj.rotation.y),
        z: THREE.MathUtils.radToDeg(obj.rotation.z)
      },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
    };

    pushHistoryAction({
      type: 'transform',
      objectId: obj.uuid,
      before,
      after,
      description: `Transform ${obj.name}`
    });
  };

  const handleUpdateMaterial = (updates: any, targetMaterialId?: string) => {
    if (!engineRef.current) return;
    if (targetMaterialId) {
      engineRef.current.updateMaterialById(targetMaterialId, updates);
      if (engineRef.current.selectedObject) {
        setSelectedData(engineRef.current.extractObjectData(engineRef.current.selectedObject));
      }
      setSceneMaterials(engineRef.current.getAllSceneMaterials());
    } else if (engineRef.current.selectedObject) {
      const obj = engineRef.current.selectedObject;
      const beforeMat = selectedData?.material ? { ...selectedData.material } : null;

      engineRef.current.updateSelectedMaterial(updates);
      const updatedData = engineRef.current.extractObjectData(obj);
      setSelectedData(updatedData);
      setSceneMaterials(engineRef.current.getAllSceneMaterials());

      if (beforeMat && updatedData.material) {
        pushHistoryAction({
          type: 'material',
          objectId: obj.uuid,
          before: beforeMat,
          after: { ...updatedData.material },
          description: `Material update on ${obj.name}`
        });
      }
    }
  };

  const handleApplyMaterialToSelected = useCallback((materialId: string) => {
    if (!engineRef.current) return;
    const selected = engineRef.current.selectedObject;
    if (!selected) {
      showToast('Select an object in the 3D viewport first', 'info');
      return;
    }
    const success = engineRef.current.applyMaterialToObject(selected.uuid, materialId);
    if (success) {
      setSelectedData(engineRef.current.extractObjectData(selected));
      refreshSceneTree();
      showToast(`Applied material to "${selected.name}"`, 'success');
    } else {
      showToast('Failed to apply material', 'error');
    }
  }, [refreshSceneTree, showToast]);

  const handleDuplicateMaterial = useCallback((materialId: string) => {
    if (!engineRef.current) return;
    const duplicated = engineRef.current.duplicateMaterial(materialId);
    if (duplicated) {
      setSceneMaterials(engineRef.current.getAllSceneMaterials());
      setSelectedMaterialId(duplicated.id || duplicated.uuid || null);
      showToast(`Duplicated material: "${duplicated.name}"`, 'success');
    }
  }, [showToast]);

  const handleCreateCustomMaterial = useCallback(() => {
    if (!engineRef.current) return;
    const newMat = engineRef.current.createCustomMaterial({
      name: `New Material ${sceneMaterials.length + 1}`,
      color: '#06b6d4',
      roughness: 0.35,
      metalness: 0.2
    });
    setSceneMaterials(engineRef.current.getAllSceneMaterials());
    setSelectedMaterialId(newMat.id || newMat.uuid || null);
    setInspectorTab('material');
    setMobileActiveTab('inspector');
    showToast(`Created new material: "${newMat.name}"`, 'success');
  }, [sceneMaterials.length, showToast]);

  const handleSelectMaterialToEdit = useCallback((material: MaterialConfig) => {
    setSelectedMaterialId(material.id || material.uuid || null);
    setInspectorTab('material');
    setMobileActiveTab('inspector');
    showToast(`Editing material "${material.name}"`, 'info');
  }, [showToast]);

  // Scene Operations (Save JSON, Load JSON, New Scene)
  const handleNewScene = () => {
    if (!engineRef.current) return;
    engineRef.current.clearScene();
    historyManagerRef.current.clear();
    setCanUndo(false);
    setCanRedo(false);
    setEnvironment(engineRef.current.getEnvironmentSettings());
    refreshSceneTree();
    showToast('Created new scene', 'info');
  };

  const handleLoadSceneFile = async (file: File) => {
    if (!engineRef.current) return;
    try {
      setIsLoadingScene(true);
      setSceneLoadingProgress(5);
      setSceneLoadingStatus(`Reading scene JSON "${file.name}"...`);

      const text = await file.text();
      const sceneData = JSON.parse(text);
      if (sceneData.name || sceneData.sceneName) {
        setSceneName(sceneData.name || sceneData.sceneName);
      }
      await SceneSerializer.deserialize(engineRef.current, sceneData, (progress, status) => {
        setSceneLoadingProgress(progress);
        setSceneLoadingStatus(status);
      });
      setEnvironment(engineRef.current.getEnvironmentSettings());
      historyManagerRef.current.clear();
      setCanUndo(false);
      setCanRedo(false);
      refreshSceneTree();
      showToast(`Loaded ${file.name}`, 'success');
    } catch (err: any) {
      showToast('Failed to parse scene JSON file: ' + err.message, 'error');
    } finally {
      setTimeout(() => {
        setIsLoadingScene(false);
      }, 400);
    }
  };

  const handleLoadSampleScene = async (sampleId: string) => {
    if (!engineRef.current) return;
    const sample = SAMPLE_SCENES.find((s) => s.id === sampleId);
    if (!sample) return;
    try {
      setIsLoadingScene(true);
      setSceneLoadingProgress(5);
      setSceneLoadingStatus(`Loading sample scene "${sample.name}"...`);
      setSceneName(sample.name);

      await SceneSerializer.deserialize(engineRef.current, sample.data, (progress, status) => {
        setSceneLoadingProgress(progress);
        setSceneLoadingStatus(status);
      });
      setEnvironment(engineRef.current.getEnvironmentSettings());
      historyManagerRef.current.clear();
      setCanUndo(false);
      setCanRedo(false);
      refreshSceneTree();
      showToast(`Loaded "${sample.name}" sample scene`, 'success');
    } catch (err: any) {
      showToast('Error loading sample scene: ' + err.message, 'error');
    } finally {
      setTimeout(() => {
        setIsLoadingScene(false);
      }, 400);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#101216] overflow-hidden select-none font-sans text-xs">
      {/* 1. TOP MENU BAR WITH [ Export Scene ] BUTTON */}
      <MenuBar
        onBackToHub={onBackToHub}
        onNewScene={handleNewScene}
        onSaveScene={handleSaveScene}
        onSaveSceneAs={handleSaveSceneAs}
        sceneName={sceneName}
        onLoadSceneFile={handleLoadSceneFile}
        onLoadSampleScene={handleLoadSampleScene}
        onOpenExportScene={() => setIsExportSceneOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onDuplicate={() => selectedId && handleDuplicateObject(selectedId)}
        onDelete={() => selectedId && handleDeleteObject(selectedId)}
        onFocus={handleFocusSelected}
        onFrameAll={handleFrameAll}
        onAddPrimitive={handleAddPrimitive}
        onAddWater={handleAddWater}
        onAddCharacterController={handleAddCharacterController}
        onAddLight={handleAddLight}
        onAddCamera={handleAddCamera}
        onAddEmpty={handleAddEmpty}
        onOpenEnvironment={handleOpenEnvironment}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        hasCamera={hasCamera}
        isCameraViewOpen={isCameraViewOpen}
        onToggleCameraView={() => setIsCameraViewOpen((prev) => !prev)}
        isPlayMode={isPlayMode}
        isPlayPaused={isPlayPaused}
        onTogglePlay={handleTogglePlay}
        onTogglePause={handleTogglePause}
        stats={stats}
      />

      {/* 2. MAIN WORKSPACE (Hierarchy | 3D Viewport | Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT: HIERARCHY (Desktop) */}
        <div className="hidden md:block w-64 shrink-0 h-full">
          <Hierarchy
            objects={objects}
            selectedId={selectedId}
            onSelectObject={handleSelectObject}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onRenameObject={handleRenameObject}
            onDuplicateObject={handleDuplicateObject}
            onDeleteObject={handleDeleteObject}
            onAddPrimitive={handleAddPrimitive}
            onAddWater={handleAddWater}
            onAddCharacterController={handleAddCharacterController}
            onContextMenuObject={handleContextMenuObject}
            onContextMenuEmpty={handleContextMenuEmpty}
            onExploreFolders={handleExploreFolders}
            onCreateFolder={handleCreateFolder}
            onReparentObject={handleReparentObject}
            onUngroupFolder={handleUngroupFolder}
          />
        </div>

        {/* CENTER: 3D VIEWPORT WITH INTERACTIVE TRANSFORM CONTROLS */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col">
          <Viewport
            engine={engineRef.current}
            transformMode={transformMode}
            onSetTransformMode={handleSetTransformMode}
            transformSpace={transformSpace}
            onToggleTransformSpace={handleToggleTransformSpace}
            snapEnabled={snapEnabled}
            onToggleSnap={handleToggleSnap}
            gridVisible={gridVisible}
            onToggleGrid={handleToggleGrid}
            axesVisible={axesVisible}
            onToggleAxes={handleToggleAxes}
            onSetCameraView={(view) => engineRef.current?.setCameraView(view)}
            onFocusSelected={handleFocusSelected}
            onFrameAll={handleFrameAll}
            onDropModelFile={handleImportGLBFile}
            onContextMenu={handleViewportContextMenu}
            hasCamera={hasCamera}
            isCameraViewOpen={isCameraViewOpen}
            onCloseCameraView={() => setIsCameraViewOpen(false)}
            isPlayMode={isPlayMode}
            isPlayPaused={isPlayPaused}
            onStopPlay={handleTogglePlay}
            onTogglePause={handleTogglePause}
          />
        </div>

        {/* RIGHT: INSPECTOR (Desktop) */}
        <div className="hidden md:block w-80 shrink-0 h-full">
          <Inspector
            selectedObject={selectedData}
            environment={environment}
            onUpdateTransform={handleUpdateTransform}
            onUpdateMaterial={handleUpdateMaterial}
            onUpdateLight={(updates) => engineRef.current?.updateSelectedLight(updates)}
            onUpdateProperties={(updates) => engineRef.current?.updateSelectedProperties(updates)}
            onUpdateWater={handleUpdateWater}
            onApplyWaterPreset={handleApplyWaterPreset}
            onUploadTexture={handleUploadTextureFile}
            onApplyPresetTexture={handleApplyPresetTexture}
            onUpdateSky={handleUpdateSky}
            onUpdateFog={handleUpdateFog}
            onApplyEnvironmentPreset={handleApplyEnvironmentPreset}
            onUploadHDRI={handleUploadHDRI}
            onReplaceModel={(file) => selectedData && handlePerformReplace(selectedData.id, file)}
            onReimportModel={() => handleReimportModel()}
            onExploreAssetDetails={() => handleExploreFolders()}
            onExportGLB={() => handleExportGLB()}
            onUpdateFolderLocation={(loc) => selectedData && handleUpdateFolderLocation(selectedData.id, loc)}
            inspectorTab={inspectorTab}
            onTabChange={setInspectorTab}
            sceneMaterials={sceneMaterials}
            selectedMaterialId={selectedMaterialId}
            onSelectMaterialId={setSelectedMaterialId}
            onDuplicateMaterial={handleDuplicateMaterial}
            onApplyMaterialToSelected={handleApplyMaterialToSelected}
            onCreateCustomMaterial={handleCreateCustomMaterial}
          />
        </div>

        {/* MOBILE DRAWER OVERLAY */}
        {mobileActiveTab && (
          <div className="md:hidden absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
            <div className="bg-[#181a20] border-t border-[#333842] rounded-t-2xl max-h-[75vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-3 border-b border-[#282b33] flex justify-between items-center bg-[#15171d]">
                <span className="font-semibold text-gray-200 capitalize text-sm">{mobileActiveTab}</span>
                <button
                  onClick={() => setMobileActiveTab(null)}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs"
                >
                  Close
                </button>
              </div>

              {mobileActiveTab === 'hierarchy' && (
                <Hierarchy
                  objects={objects}
                  selectedId={selectedId}
                  onSelectObject={(id) => {
                    handleSelectObject(id);
                    setMobileActiveTab(null);
                  }}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleLock={handleToggleLock}
                  onRenameObject={handleRenameObject}
                  onDuplicateObject={handleDuplicateObject}
                  onDeleteObject={handleDeleteObject}
                  onAddPrimitive={handleAddPrimitive}
                  onAddWater={(wType) => {
                    handleAddWater(wType);
                    setMobileActiveTab(null);
                  }}
                  onContextMenuObject={handleContextMenuObject}
                  onContextMenuEmpty={handleContextMenuEmpty}
                  onExploreFolders={handleExploreFolders}
                  onCreateFolder={handleCreateFolder}
                  onReparentObject={handleReparentObject}
                  onUngroupFolder={handleUngroupFolder}
                />
              )}

              {mobileActiveTab === 'inspector' && (
                <Inspector
                  selectedObject={selectedData}
                  environment={environment}
                  onUpdateTransform={handleUpdateTransform}
                  onUpdateMaterial={handleUpdateMaterial}
                  onUpdateLight={(updates) => engineRef.current?.updateSelectedLight(updates)}
                  onUpdateProperties={(updates) => engineRef.current?.updateSelectedProperties(updates)}
                  onUpdateWater={handleUpdateWater}
                  onApplyWaterPreset={handleApplyWaterPreset}
                  onUploadTexture={handleUploadTextureFile}
                  onApplyPresetTexture={handleApplyPresetTexture}
                  onUpdateSky={handleUpdateSky}
                  onUpdateFog={handleUpdateFog}
                  onApplyEnvironmentPreset={handleApplyEnvironmentPreset}
                  onUploadHDRI={handleUploadHDRI}
                  onReplaceModel={(file) => selectedData && handlePerformReplace(selectedData.id, file)}
                  onReimportModel={() => handleReimportModel()}
                  onExploreAssetDetails={() => handleExploreFolders()}
                  onExportGLB={() => handleExportGLB()}
                  onUpdateFolderLocation={(loc) => selectedData && handleUpdateFolderLocation(selectedData.id, loc)}
                  inspectorTab={inspectorTab}
                  onTabChange={setInspectorTab}
                  sceneMaterials={sceneMaterials}
                  selectedMaterialId={selectedMaterialId}
                  onSelectMaterialId={setSelectedMaterialId}
                  onDuplicateMaterial={handleDuplicateMaterial}
                  onApplyMaterialToSelected={handleApplyMaterialToSelected}
                  onCreateCustomMaterial={handleCreateCustomMaterial}
                />
              )}

              {mobileActiveTab === 'assets' && (
                <div className="p-3">
                  <AssetBrowser
                    onAddPresetModel={(id) => {
                      handleAddPresetModel(id);
                      setMobileActiveTab(null);
                    }}
                    onImportGLBFile={handleImportGLBFile}
                    importProgress={importProgress}
                    onApplyMaterialPreset={handleApplyMaterialPreset}
                    onApplyPresetTexture={handleApplyPresetTexture}
                    onUploadTextureFile={handleUploadTextureFile}
                    onLoadSampleScene={(id) => {
                      handleLoadSampleScene(id);
                      setMobileActiveTab(null);
                    }}
                    customTextures={customTextures}
                    isCollapsed={false}
                    onToggleCollapse={() => {}}
                    onApplyEnvironmentPreset={handleApplyEnvironmentPreset}
                    onUploadHDRI={handleUploadHDRI}
                    activeSkyPresetId={environment.sky.presetId}
                    sceneMaterials={sceneMaterials}
                    selectedMaterialId={selectedMaterialId}
                    onSelectMaterialToEdit={handleSelectMaterialToEdit}
                    onCreateCustomMaterial={handleCreateCustomMaterial}
                    onApplyMaterialToSelected={handleApplyMaterialToSelected}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. ASSET BROWSER (Desktop Bottom Library) */}
      <div className="hidden md:block shrink-0">
        <AssetBrowser
          onAddPresetModel={handleAddPresetModel}
          onImportGLBFile={handleImportGLBFile}
          importProgress={importProgress}
          onApplyMaterialPreset={handleApplyMaterialPreset}
          onApplyPresetTexture={handleApplyPresetTexture}
          onUploadTextureFile={handleUploadTextureFile}
          onLoadSampleScene={handleLoadSampleScene}
          customTextures={customTextures}
          isCollapsed={isAssetBrowserCollapsed}
          onToggleCollapse={() => setIsAssetBrowserCollapsed(!isAssetBrowserCollapsed)}
          onApplyEnvironmentPreset={handleApplyEnvironmentPreset}
          onUploadHDRI={handleUploadHDRI}
          activeSkyPresetId={environment.sky.presetId}
          sceneMaterials={sceneMaterials}
          selectedMaterialId={selectedMaterialId}
          onSelectMaterialToEdit={handleSelectMaterialToEdit}
          onCreateCustomMaterial={handleCreateCustomMaterial}
          onApplyMaterialToSelected={handleApplyMaterialToSelected}
        />
      </div>

      {/* 4. MOBILE BOTTOM DOCK */}
      <div className="md:hidden h-12 bg-[#15171d] border-t border-[#282b33] flex items-center justify-around px-2 z-30 shrink-0 text-xs">
        <button
          onClick={() => setMobileActiveTab(mobileActiveTab === 'hierarchy' ? null : 'hierarchy')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded ${
            mobileActiveTab === 'hierarchy' ? 'text-cyan-400 bg-[#222733]' : 'text-gray-400'
          }`}
        >
          <ListTree size={16} />
          <span className="text-[10px]">Hierarchy</span>
        </button>
        <button
          onClick={() => setMobileActiveTab(mobileActiveTab === 'inspector' ? null : 'inspector')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded ${
            mobileActiveTab === 'inspector' ? 'text-cyan-400 bg-[#222733]' : 'text-gray-400'
          }`}
        >
          <Sliders size={16} />
          <span className="text-[10px]">Inspector</span>
        </button>
        <button
          onClick={() => setMobileActiveTab(mobileActiveTab === 'assets' ? null : 'assets')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded ${
            mobileActiveTab === 'assets' ? 'text-cyan-400 bg-[#222733]' : 'text-gray-400'
          }`}
        >
          <Folder size={16} />
          <span className="text-[10px]">Assets</span>
        </button>
      </div>

      {/* 5. EXPORT SCENE MODAL (Requirement 2 & 20) */}
      <ExportScene
        isOpen={isExportSceneOpen}
        onClose={() => setIsExportSceneOpen(false)}
        engine={engineRef.current}
        defaultSceneName={sceneName}
        onShowToast={showToast}
      />

      {/* 6. SAVE SCENE MODAL (Choose Scene Name, File Name, Folder Selection) */}
      <SaveSceneModal
        isOpen={isSaveSceneModalOpen}
        onClose={() => setIsSaveSceneModalOpen(false)}
        sceneName={sceneName}
        onUpdateSceneName={(newName) => {
          setSceneName(newName);
        }}
        engine={engineRef.current}
        onShowToast={showToast}
        onSaveSuccess={(fileName) => {
          setHasSavedOnce(true);
          if (fileName) {
            setSceneFileName(fileName);
          }
        }}
      />

      {/* 7. SHORTCUTS MODAL */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* GLB IMPORT MODE MODAL (Combined vs Layers) */}
      <GLBImportModal
        isOpen={!!pendingGLBFile}
        file={pendingGLBFile}
        onClose={() => setPendingGLBFile(null)}
        onConfirmImport={handleConfirmImportGLB}
      />

      {/* 8. RIGHT-CLICK CONTEXT MENU (Dropdown List with Replace GLB, Reimport, Explore in Folders, etc.) */}
      <ContextMenu
        position={contextMenu.position}
        targetObject={contextMenu.targetObject}
        onClose={() => setContextMenu({ position: null, targetObject: null })}
        onReplaceGLB={(target) => handleReplaceGLB(target)}
        onReimport={(target) => handleReimportModel(target)}
        onExploreFolders={(target) => handleExploreFolders(target)}
        onExportGLB={(target) => handleExportGLB(target)}
        onCopyPath={(target) => handleCopyPath(target)}
        onFocus={handleFocusSelected}
        onDuplicate={() => {
          if (contextMenu.targetObject) {
            handleDuplicateObject(contextMenu.targetObject.id);
          } else if (selectedId) {
            handleDuplicateObject(selectedId);
          }
        }}
        onRename={() => {
          // Trigger selection for renaming
          if (contextMenu.targetObject) {
            handleSelectObject(contextMenu.targetObject.id);
          }
        }}
        onToggleLock={() => {
          const target = contextMenu.targetObject || selectedData;
          if (target) {
            handleToggleLock(target.id, !!target.locked);
          }
        }}
        onToggleVisibility={() => {
          const target = contextMenu.targetObject || selectedData;
          if (target) {
            handleToggleVisibility(target.id, target.visible !== false);
          }
        }}
        onDelete={() => {
          if (contextMenu.targetObject) {
            handleDeleteObject(contextMenu.targetObject.id);
          } else if (selectedId) {
            handleDeleteObject(selectedId);
          }
        }}
        onAddPrimitive={handleAddPrimitive}
        onAddWater={handleAddWater}
        onAddCharacterController={handleAddCharacterController}
        onAddLight={handleAddLight}
        onImportModel={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.glb,.gltf';
          input.onchange = (e: any) => {
            if (e.target.files && e.target.files[0]) {
              handleImportGLBFile(e.target.files[0]);
            }
          };
          input.click();
        }}
        onFrameAll={handleFrameAll}
      />

      {/* 9. ASSET DETAILS & FOLDER EXPLORER MODAL */}
      <AssetDetailsModal
        isOpen={isAssetDetailsOpen}
        onClose={() => setIsAssetDetailsOpen(false)}
        selectedObject={assetDetailsTarget}
        onReplaceModel={(file) => {
          if (assetDetailsTarget) {
            handlePerformReplace(assetDetailsTarget.id, file);
          }
        }}
        onReimportModel={() => {
          if (assetDetailsTarget) {
            handleReimportModel(assetDetailsTarget);
          }
        }}
        onExportGLB={() => {
          if (assetDetailsTarget) {
            handleExportGLB(assetDetailsTarget);
          }
        }}
        onUpdateFolderLocation={(loc) => {
          if (assetDetailsTarget) {
            handleUpdateFolderLocation(assetDetailsTarget.id, loc);
          }
        }}
      />

      {/* HIDDEN FILE INPUT FOR REPLACE GLB */}
      <input
        ref={fileInputForReplaceRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* 10. SCENE LOADING SCREEN OVERLAY WITH PROGRESS BAR */}
      {isLoadingScene && (
        <div className="fixed inset-0 z-50 bg-[#080a10] flex flex-col items-center justify-center p-6 text-white select-none transition-opacity duration-300">
          {/* Glowing Ambient Light Backdrops */}
          <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-md bg-[#121624]/90 border border-[#232c42] rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center space-y-6">
            {/* 3D Engine Logo / Loader */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-cyan-500/25 animate-bounce">
                M
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-cyan-400/30 blur-md -z-10" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-extrabold text-[10px] uppercase tracking-wider mb-2">
                <Sparkles size={12} className="text-cyan-400 animate-spin" />
                <span>modcx3D WebGL Engine</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight truncate max-w-xs mx-auto">
                {sceneName || '3D Game Scene'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Opening scene &amp; initializing WebGL 2.0 graphics pipeline...
              </p>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold truncate pr-2">{sceneLoadingStatus}</span>
                <span className="text-gray-300 font-bold">{Math.min(100, Math.max(0, sceneLoadingProgress))}%</span>
              </div>

              <div className="w-full h-3.5 bg-[#1a2030] border border-[#2d374f] rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 rounded-full transition-all duration-300 shadow-md shadow-cyan-500/50"
                  style={{ width: `${Math.min(100, Math.max(0, sceneLoadingProgress))}%` }}
                />
              </div>
            </div>

            {/* Loading Step Checklist */}
            <div className="w-full pt-4 border-t border-[#1e263a] grid grid-cols-2 gap-2.5 text-[10px] text-gray-400 font-mono text-left">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className={sceneLoadingProgress >= 20 ? 'text-emerald-400' : 'text-gray-600'} />
                <span className={sceneLoadingProgress >= 20 ? 'text-gray-200' : 'text-gray-500'}>WebGL 2.0 Canvas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className={sceneLoadingProgress >= 40 ? 'text-emerald-400' : 'text-gray-600'} />
                <span className={sceneLoadingProgress >= 40 ? 'text-gray-200' : 'text-gray-500'}>Node Hierarchy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className={sceneLoadingProgress >= 60 ? 'text-emerald-400' : 'text-gray-600'} />
                <span className={sceneLoadingProgress >= 60 ? 'text-gray-200' : 'text-gray-500'}>PBR Shaders &amp; Lights</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className={sceneLoadingProgress >= 90 ? 'text-emerald-400' : 'text-gray-600'} />
                <span className={sceneLoadingProgress >= 90 ? 'text-gray-200' : 'text-gray-500'}>GLTF Meshes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-14 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg shadow-xl text-xs font-medium border bg-[#181a20] border-[#333842] text-white">
          {toast.type === 'success' && <CheckCircle2 size={15} className="text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle size={15} className="text-rose-400" />}
          {toast.type === 'info' && <CheckCircle2 size={15} className="text-cyan-400" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
