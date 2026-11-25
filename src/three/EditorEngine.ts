import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { SceneObjectData, Vec3, TransformMode, TransformSpace, SkyConfig, FogConfig, EnvironmentSettings, MaterialConfig, TextureAsset, WaterConfig, WaterPreset, WaterType, CharacterControllerConfig, ControllerType } from '../types/editor';
import { TransformSnapshot } from '../state/historyManager';
import { MODEL_PRESETS } from '../utils/proceduralModels';
import { TEXTURE_PRESETS } from '../utils/proceduralTextures';
import { DEFAULT_ENVIRONMENT_SETTINGS, ENVIRONMENT_PRESETS, SkyLoaderHelper } from '../utils/environmentPresets';
import { AssetManager } from '../AssetManager';
import { WaterSystem, getDefaultWaterConfig, WATER_PRESETS } from './WaterSystem';
import { CharacterControllerSystem, getDefaultCharacterConfig } from './CharacterControllerSystem';

export interface EngineCallbacks {
  onSelectionChange: (object: THREE.Object3D | null, data: SceneObjectData | null) => void;
  onTransformChange: (data: SceneObjectData) => void;
  onTransformEnd: (data: SceneObjectData, before?: TransformSnapshot, after?: TransformSnapshot) => void;
  onSceneModified: () => void;
  onStatsUpdate: (stats: { fps: number; drawCalls: number; triangles: number }) => void;
  onError: (msg: string) => void;
  onTransformModeChange?: (mode: TransformMode) => void;
  onShortcutAction?: (action: 'undo' | 'redo' | 'delete' | 'duplicate' | 'save') => void;
  onMaterialsChanged?: (materials: MaterialConfig[]) => void;
  onTexturesChanged?: (textures: TextureAsset[]) => void;
}

export class EditorEngine {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public orbitControls: OrbitControls;
  public transformControls: TransformControls;
  public raycaster: THREE.Raycaster;
  public mouse: THREE.Vector2;
  
  // Helpers
  public gridHelper: THREE.GridHelper;
  public axesHelper: THREE.AxesHelper;
  public selectionBox: THREE.BoxHelper;
  
  // State
  public selectedObject: THREE.Object3D | null = null;
  public isTransformDragging = false;
  public isRightMouseDown = false;
  public transformMode: TransformMode = 'translate';
  public transformSpace: TransformSpace = 'world';
  public snapEnabled = false;
  public translationSnap = 1;
  public rotationSnap = THREE.MathUtils.degToRad(15);
  public scaleSnap = 0.5;

  // Play Mode
  public isPlayMode = false;
  public isPlayPaused = false;
  public isPointerLocked = false;
  private mouseDelta = { x: 0, y: 0 };
  private prePlayCameraPos = new THREE.Vector3();
  private prePlayCameraQuat = new THREE.Quaternion();
  private prePlayOrbitTarget = new THREE.Vector3();
  private prePlaySnapshot: { id: string; pos: THREE.Vector3; rot: THREE.Euler; scale: THREE.Vector3 }[] = [];
  private keysPressed: { [key: string]: boolean } = {};
  private playerVelocityY = 0;
  private isGrounded = true;
  private dragStartTransform: TransformSnapshot | null = null;

  // Internal
  public callbacks: EngineCallbacks;
  private animFrameId: number | null = null;
  private lastTime = performance.now();
  private frameCount = 0;
  private fpsLastUpdated = performance.now();
  private gltfLoader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();

  // Helper collection to exclude from raycasting
  private editorHelpersGroup: THREE.Group;
  public sceneObjectsGroup: THREE.Group;

  // Secondary Canvas for Camera View Picture-in-Picture Box
  private secondaryCanvas: HTMLCanvasElement | null = null;
  private secondaryRenderer: THREE.WebGLRenderer | null = null;
  private previewCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 1000);

  // Environment, Sky, HDRI/EXR & Fog State
  public environmentSettings: EnvironmentSettings = {
    sky: { ...DEFAULT_ENVIRONMENT_SETTINGS.sky },
    fog: { ...DEFAULT_ENVIRONMENT_SETTINGS.fog }
  };
  private pmremGenerator: THREE.PMREMGenerator;
  private proceduralSky: Sky | null = null;
  private currentHdriTexture: THREE.Texture | null = null;
  private currentEnvMap: THREE.Texture | null = null;
  private sunLightHelper: THREE.DirectionalLight | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.style.outline = 'none';
    this.container.appendChild(this.renderer.domElement);

    // PMREM Generator for HDR/EXR image-based lighting
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    // 2. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x13151b);
    this.scene.fog = new THREE.FogExp2(0x13151b, 0.015);

    this.sceneObjectsGroup = new THREE.Group();
    this.sceneObjectsGroup.name = '__SCENE_ROOT__';
    this.scene.add(this.sceneObjectsGroup);

    this.editorHelpersGroup = new THREE.Group();
    this.editorHelpersGroup.name = '__EDITOR_HELPERS__';
    this.scene.add(this.editorHelpersGroup);

    // Initialize Environment (Sky & Fog)
    this.initEnvironment();

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(7, 5, 8);

    // 4. OrbitControls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.target.set(0, 1, 0);

    // 5. TransformControls
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.size = 0.85;
    this.scene.add(this.transformControls.getHelper());

    this.transformControls.addEventListener('dragging-changed', (event: any) => {
      this.isTransformDragging = !!event.value;
      this.orbitControls.enabled = !event.value;

      if (event.value && this.selectedObject) {
        // Drag started -> snapshot initial transform
        this.dragStartTransform = {
          pos: { x: this.selectedObject.position.x, y: this.selectedObject.position.y, z: this.selectedObject.position.z },
          rot: { x: this.selectedObject.rotation.x, y: this.selectedObject.rotation.y, z: this.selectedObject.rotation.z },
          rotDeg: {
            x: THREE.MathUtils.radToDeg(this.selectedObject.rotation.x),
            y: THREE.MathUtils.radToDeg(this.selectedObject.rotation.y),
            z: THREE.MathUtils.radToDeg(this.selectedObject.rotation.z)
          },
          scale: { x: this.selectedObject.scale.x, y: this.selectedObject.scale.y, z: this.selectedObject.scale.z }
        };
      }

      if (!event.value && this.selectedObject) {
        // Drag finished -> trigger undoable action with before and after snapshots
        const data = this.extractObjectData(this.selectedObject);
        const endTransform: TransformSnapshot = {
          pos: { x: this.selectedObject.position.x, y: this.selectedObject.position.y, z: this.selectedObject.position.z },
          rot: { x: this.selectedObject.rotation.x, y: this.selectedObject.rotation.y, z: this.selectedObject.rotation.z },
          rotDeg: {
            x: THREE.MathUtils.radToDeg(this.selectedObject.rotation.x),
            y: THREE.MathUtils.radToDeg(this.selectedObject.rotation.y),
            z: THREE.MathUtils.radToDeg(this.selectedObject.rotation.z)
          },
          scale: { x: this.selectedObject.scale.x, y: this.selectedObject.scale.y, z: this.selectedObject.scale.z }
        };

        const before = this.dragStartTransform;
        this.dragStartTransform = null;
        this.callbacks.onTransformEnd(data, before || undefined, endTransform);
      }
    });

    this.transformControls.addEventListener('change', () => {
      if (this.selectedObject && this.isTransformDragging) {
        this.updateSelectionBox();
        const data = this.extractObjectData(this.selectedObject);
        this.callbacks.onTransformChange(data);
      }
    });

    // 6. Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 7. Grid and Axes
    this.gridHelper = new THREE.GridHelper(40, 40, 0x475569, 0x1e293b);
    this.gridHelper.position.y = -0.001;
    this.editorHelpersGroup.add(this.gridHelper);

    // Editor Viewport Fill Lighting (keeps materials and shadows visible in editor)
    const editorFillLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.65);
    editorFillLight.name = '__EDITOR_FILL_LIGHT__';
    this.editorHelpersGroup.add(editorFillLight);

    this.axesHelper = new THREE.AxesHelper(5);
    this.axesHelper.renderOrder = 1;
    (this.axesHelper.material as THREE.Material).depthTest = false;
    this.editorHelpersGroup.add(this.axesHelper);

    // 8. Selection Box Helper
    this.selectionBox = new THREE.BoxHelper(new THREE.Mesh(), 0x38bdf8);
    this.selectionBox.visible = false;
    (this.selectionBox.material as THREE.Material).depthTest = false;
    this.editorHelpersGroup.add(this.selectionBox);

    // Bind Event Listeners
    this.setupEvents();

    // Start Loop
    this.startLoop();
  }

  // Set up mouse, pointer, resize and keyboard events
  private setupEvents() {
    window.addEventListener('resize', this.onResize);
    
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize();
      });
      this.resizeObserver.observe(this.container);
    }

    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    dom.addEventListener('click', this.onCanvasClick);
    dom.addEventListener('wheel', this.onWheel);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onWheel = (e: WheelEvent) => {
    if (this.isPlayMode && !this.isPlayPaused) {
      const player = this.findPlayerObject();
      if (player) {
        const config = player.userData?.characterConfig;
        if (config) {
          const delta = Math.sign(e.deltaY) * 0.5;
          config.cameraDistance = Math.max(1.5, Math.min(12.0, (config.cameraDistance || 4.2) + delta));
        }
      }
    }
  };

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
  };

  private onCanvasClick = () => {
    if (this.isPlayMode && !this.isPlayPaused) {
      if (document.pointerLockElement !== this.renderer.domElement) {
        try {
          this.renderer.domElement.requestPointerLock();
        } catch {
          // ignore
        }
      }
    }
  };

  private lastMousePos: { x: number; y: number } | null = null;
  private onMouseMove = (e: MouseEvent) => {
    if (this.isPlayMode && !this.isPlayPaused) {
      let dx = e.movementX;
      let dy = e.movementY;
      if (!this.isPointerLocked) {
        if (this.lastMousePos) {
          dx = e.clientX - this.lastMousePos.x;
          dy = e.clientY - this.lastMousePos.y;
        } else {
          dx = 0;
          dy = 0;
        }
      }
      this.mouseDelta.x += dx || 0;
      this.mouseDelta.y += dy || 0;
    }
    this.lastMousePos = { x: e.clientX, y: e.clientY };
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private pointerDownPos = { x: 0, y: 0 };
  private onPointerDown = (event: PointerEvent) => {
    this.pointerDownPos = { x: event.clientX, y: event.clientY };
    const dom = this.renderer.domElement;
    const onPointerUp = (upEvent: PointerEvent) => {
      dom.removeEventListener('pointerup', onPointerUp);
      // Only select if it was a genuine click rather than an orbit drag
      const dist = Math.hypot(upEvent.clientX - this.pointerDownPos.x, upEvent.clientY - this.pointerDownPos.y);
      if (dist < 5) {
        this.handleRaycastSelect(upEvent);
      }
    };
    dom.addEventListener('pointerup', onPointerUp);
  };

  private handleRaycastSelect(event: PointerEvent) {
    if (this.isPlayMode || this.isTransformDragging) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Intersect only objects in sceneObjectsGroup
    const intersects = this.raycaster.intersectObjects(this.sceneObjectsGroup.children, true);

    if (intersects.length > 0) {
      // Find top-level root object right under sceneObjectsGroup
      let target: THREE.Object3D = intersects[0].object;
      
      // Traverse up to find direct child of sceneObjectsGroup or user designated root
      while (target.parent && target.parent !== this.sceneObjectsGroup && target.parent !== this.scene) {
        if (target.userData.isPrefabRoot) break;
        target = target.parent;
      }

      if (target.userData.locked) return;

      this.selectObject(target);
    } else {
      // Clicked on empty space
      this.selectObject(null);
    }
  }

  public selectObject(object: THREE.Object3D | null) {
    if (this.selectedObject === object) return;

    this.selectedObject = object;

    if (object && !this.isPlayMode) {
      this.transformControls.attach(object);
      this.updateSelectionBox();
      this.selectionBox.visible = true;

      const data = this.extractObjectData(object);
      this.callbacks.onSelectionChange(object, data);
    } else {
      this.transformControls.detach();
      this.selectionBox.visible = false;
      this.callbacks.onSelectionChange(null, null);
    }
  }

  public updateSelectionBox() {
    if (this.selectedObject && this.selectionBox) {
      this.selectionBox.setFromObject(this.selectedObject);
    }
  }

  public setTransformMode(mode: TransformMode) {
    this.transformMode = mode;
    this.transformControls.setMode(mode);
    this.callbacks.onTransformModeChange?.(mode);
  }

  public setTransformSpace(space: TransformSpace) {
    this.transformSpace = space;
    this.transformControls.setSpace(space);
  }

  public setSnap(enabled: boolean, transSnap = 1, rotSnap = THREE.MathUtils.degToRad(15), scSnap = 0.5) {
    this.snapEnabled = enabled;
    this.translationSnap = transSnap;
    this.rotationSnap = rotSnap;
    this.scaleSnap = scSnap;

    this.transformControls.setTranslationSnap(enabled ? transSnap : null);
    this.transformControls.setRotationSnap(enabled ? rotSnap : null);
    this.transformControls.setScaleSnap(enabled ? scSnap : null);
  }

  public setSnapEnabled(enabled: boolean) {
    this.setSnap(enabled);
  }

  public clearScene() {
    this.selectObject(null);
    while (this.sceneObjectsGroup.children.length > 0) {
      const child = this.sceneObjectsGroup.children[0];
      this.sceneObjectsGroup.remove(child);
    }
    this.updateSky({
      type: 'color',
      color: '#c0c0c0',
      presetId: undefined,
      hdriName: undefined,
      hdriUrl: undefined
    });
    this.callbacks.onSceneModified();
  }

  public applyPresetTexture(presetId: string) {
    const preset = TEXTURE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const texture = preset.generate();
    texture.name = `${presetId}.png`;
    this.applyTexture(texture, 'map');
  }

  public setGridVisible(visible: boolean) {
    this.gridHelper.visible = visible;
  }

  public setAxesVisible(visible: boolean) {
    this.axesHelper.visible = visible;
  }

  // ==========================================
  // SKY, HDRI / EXR & FOG ENVIRONMENT ENGINE
  // ==========================================
  public initEnvironment() {
    // 1. Setup procedural Sky mesh
    this.proceduralSky = new Sky();
    this.proceduralSky.scale.setScalar(450000);
    this.proceduralSky.name = '__PROCEDURAL_SKY__';
    this.editorHelpersGroup.add(this.proceduralSky);

    // 2. Setup direct sun light associated with sky
    this.sunLightHelper = new THREE.DirectionalLight(0xfffaed, 2.0);
    this.sunLightHelper.name = '__SUN_LIGHT__';
    this.sunLightHelper.castShadow = true;
    this.sunLightHelper.shadow.mapSize.width = 2048;
    this.sunLightHelper.shadow.mapSize.height = 2048;
    this.sunLightHelper.shadow.camera.near = 0.5;
    this.sunLightHelper.shadow.camera.far = 200;
    const d = 25;
    this.sunLightHelper.shadow.camera.left = -d;
    this.sunLightHelper.shadow.camera.right = d;
    this.sunLightHelper.shadow.camera.top = d;
    this.sunLightHelper.shadow.camera.bottom = -d;
    this.sunLightHelper.shadow.bias = -0.0001;
    this.sunLightHelper.shadow.normalBias = 0.03;
    this.editorHelpersGroup.add(this.sunLightHelper);

    // Apply default environment
    this.applyEnvironmentPreset('clear_day');
  }

  public updateEnvironment(settings: Partial<EnvironmentSettings>) {
    if (settings.sky) {
      this.updateSky(settings.sky);
    }
    if (settings.fog) {
      this.updateFog(settings.fog);
    }
    this.callbacks.onSceneModified();
  }

  public updateSky(skyUpdates: Partial<SkyConfig>) {
    this.environmentSettings.sky = {
      ...this.environmentSettings.sky,
      ...skyUpdates
    };
    const sky = this.environmentSettings.sky;

    // Update tone mapping & background parameters
    this.renderer.toneMappingExposure = sky.exposure ?? 1.0;
    this.scene.backgroundIntensity = sky.backgroundIntensity ?? 1.0;
    this.scene.backgroundBlurriness = sky.backgroundBlurriness ?? 0.0;
    this.scene.environmentIntensity = sky.environmentIntensity ?? 1.0;

    const rotRad = THREE.MathUtils.degToRad(sky.rotation ?? 0);
    this.scene.backgroundRotation.y = rotRad;
    this.scene.environmentRotation.y = rotRad;

    if (sky.type === 'procedural') {
      if (this.proceduralSky) {
        this.proceduralSky.visible = true;
        const uniforms = this.proceduralSky.material.uniforms;
        uniforms['turbidity'].value = sky.turbidity;
        uniforms['rayleigh'].value = sky.rayleigh;
        uniforms['mieCoefficient'].value = sky.mieCoefficient;
        uniforms['mieDirectionalG'].value = sky.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - sky.sunElevation);
        const theta = THREE.MathUtils.degToRad(sky.sunAzimuth);
        const sunPos = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(sunPos);

        // Update Sun directional light position & color
        if (this.sunLightHelper) {
          const sunDist = 30;
          this.sunLightHelper.position.set(sunPos.x * sunDist, Math.max(sunPos.y * sunDist, 0.1), sunPos.z * sunDist);
          this.sunLightHelper.visible = sky.sunElevation > -2;
          // Sun tint based on elevation
          if (sky.sunElevation < 10) {
            this.sunLightHelper.color.setHex(0xf97316); // Orange twilight
            this.sunLightHelper.intensity = 1.8;
          } else {
            this.sunLightHelper.color.setHex(0xfffaed); // Warm daylight
            this.sunLightHelper.intensity = 2.2;
          }
        }
      }
      this.scene.background = null;
      if (this.currentEnvMap) {
        this.scene.environment = this.currentEnvMap;
      }
    } else if (sky.type === 'hdri') {
      if (this.proceduralSky) this.proceduralSky.visible = false;
      if (this.sunLightHelper) this.sunLightHelper.visible = false;

      if (this.currentHdriTexture) {
        this.scene.background = this.currentHdriTexture;
        this.scene.environment = this.currentEnvMap || this.currentHdriTexture;
      }
    } else if (sky.type === 'color') {
      if (this.proceduralSky) this.proceduralSky.visible = false;
      if (this.sunLightHelper) this.sunLightHelper.visible = false;
      this.scene.background = new THREE.Color(sky.color || '#13151b');
      this.scene.environment = this.currentEnvMap || null;
    } else if (sky.type === 'gradient') {
      if (this.proceduralSky) this.proceduralSky.visible = false;
      if (this.sunLightHelper) this.sunLightHelper.visible = false;
      // Generate gradient canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, sky.topColor || '#1e293b');
      grad.addColorStop(1, sky.bottomColor || '#0a0d14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 512);
      const gradTex = new THREE.CanvasTexture(canvas);
      gradTex.mapping = THREE.EquirectangularReflectionMapping;
      gradTex.colorSpace = THREE.SRGBColorSpace;
      gradTex.needsUpdate = true;
      this.scene.background = gradTex;
      this.scene.environment = gradTex;
    } else {
      // None
      if (this.proceduralSky) this.proceduralSky.visible = false;
      if (this.sunLightHelper) this.sunLightHelper.visible = false;
      this.scene.background = new THREE.Color(0x0d1117);
      this.scene.environment = this.currentEnvMap || null;
    }

    this.callbacks.onSceneModified();
  }

  public updateFog(fogUpdates: Partial<FogConfig>) {
    this.environmentSettings.fog = {
      ...this.environmentSettings.fog,
      ...fogUpdates
    };
    const fog = this.environmentSettings.fog;

    if (fog.type === 'exp2') {
      this.scene.fog = new THREE.FogExp2(new THREE.Color(fog.color), fog.density);
    } else if (fog.type === 'linear') {
      this.scene.fog = new THREE.Fog(new THREE.Color(fog.color), fog.near, fog.far);
    } else {
      this.scene.fog = null;
    }

    this.callbacks.onSceneModified();
  }

  public async applyHDRIFile(file: File) {
    try {
      const result = await SkyLoaderHelper.loadSkyFile(file);
      this.currentHdriTexture = result.texture;

      // Register HDRI file in AssetManager so Export & JSON serialization include it
      const hdriAsset = await AssetManager.getInstance().registerHDRIFile(file);

      // Generate PMREM IBL
      const renderTarget = this.pmremGenerator.fromEquirectangular(result.texture);
      this.currentEnvMap = renderTarget.texture;

      this.updateSky({
        type: 'hdri',
        hdriName: result.name,
        hdriUrl: hdriAsset.path,
        hdriFormat: result.format,
        backgroundIntensity: 1.0,
        environmentIntensity: 1.2
      });

      this.callbacks.onSceneModified();
    } catch (err: any) {
      console.error('Failed to load HDRI / EXR file:', err);
      this.callbacks.onError(`Failed to load ${file.name}: ${err?.message || 'Unsupported format'}`);
    }
  }

  public applyEnvironmentPreset(presetId: string) {
    const preset = ENVIRONMENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    let hdriUrl: string | undefined;
    let hdriName: string | undefined;

    if (preset.generateTexture) {
      this.currentHdriTexture = preset.generateTexture();
      const renderTarget = this.pmremGenerator.fromEquirectangular(this.currentHdriTexture);
      this.currentEnvMap = renderTarget.texture;

      // If canvas texture, register into AssetManager
      const img = this.currentHdriTexture.image as HTMLCanvasElement | undefined;
      if (img && typeof img.toBlob === 'function') {
        const filename = `${preset.id}.png`;
        hdriName = filename;
        hdriUrl = `textures/${filename}`;
        img.toBlob((blob: Blob | null) => {
          if (blob) {
            AssetManager.getInstance().registerHDRIBlob(preset.id, preset.name, filename, blob, 'equirect');
          }
        }, 'image/png');
      }
    }

    this.environmentSettings.sky.presetId = presetId;
    if (preset.sky) {
      this.updateSky({
        ...preset.sky,
        hdriName: hdriName || preset.sky.hdriName,
        hdriUrl: hdriUrl || preset.sky.hdriUrl
      });
    }
    if (preset.fog) {
      this.updateFog(preset.fog);
    }
  }

  public getEnvironmentSettings(): EnvironmentSettings {
    return JSON.parse(JSON.stringify(this.environmentSettings));
  }

  // Camera views
  public setSecondaryCanvas(canvas: HTMLCanvasElement | null) {
    this.secondaryCanvas = canvas;
    if (canvas) {
      if (!this.secondaryRenderer) {
        this.secondaryRenderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        });
        this.secondaryRenderer.shadowMap.enabled = true;
        this.secondaryRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.secondaryRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.secondaryRenderer.toneMappingExposure = 1.0;
      }
    } else {
      if (this.secondaryRenderer) {
        this.secondaryRenderer.dispose();
        this.secondaryRenderer = null;
      }
    }
  }

  public findSceneCamera(): THREE.Object3D | null {
    if (
      this.selectedObject &&
      (this.selectedObject.userData?.type === 'camera' ||
        this.selectedObject.name.toLowerCase().includes('camera') ||
        (this.selectedObject as any).isCamera)
    ) {
      return this.selectedObject;
    }

    let foundCam: THREE.Object3D | null = null;
    this.sceneObjectsGroup.traverse((obj) => {
      if (foundCam) return;
      if (
        (obj.userData?.type === 'camera' || (obj as any).isCamera || obj.name.toLowerCase().includes('camera')) &&
        obj !== this.camera &&
        !obj.name.startsWith('__')
      ) {
        foundCam = obj;
      }
    });

    return foundCam;
  }

  public setCameraToSceneCamera() {
    const camObj = this.findSceneCamera();
    if (!camObj) return;
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    camObj.getWorldPosition(worldPos);
    camObj.getWorldQuaternion(worldQuat);

    this.camera.position.copy(worldPos);
    this.camera.quaternion.copy(worldQuat);

    const forward = new THREE.Vector3(0, 0, -5).applyQuaternion(worldQuat);
    this.orbitControls.target.copy(worldPos).add(forward);
    this.orbitControls.update();
  }

  public renderCameraPreview() {
    if (!this.secondaryRenderer || !this.secondaryCanvas) return;
    const sceneCamObj = this.findSceneCamera();
    if (!sceneCamObj) return;

    const width = this.secondaryCanvas.clientWidth || 320;
    const height = this.secondaryCanvas.clientHeight || 180;
    if (width > 0 && height > 0) {
      if (this.secondaryCanvas.width !== width || this.secondaryCanvas.height !== height) {
        this.secondaryRenderer.setSize(width, height, false);
      }
      this.previewCamera.aspect = width / height;
    }

    sceneCamObj.getWorldPosition(this.previewCamera.position);
    sceneCamObj.getWorldQuaternion(this.previewCamera.quaternion);

    const fov = (sceneCamObj as any).fov || sceneCamObj.userData?.camera?.fov || 50;
    if (this.previewCamera.fov !== fov) {
      this.previewCamera.fov = fov;
    }
    this.previewCamera.updateProjectionMatrix();

    const origHelpersVis = this.editorHelpersGroup.visible;
    const origTransformVis = (this.transformControls as any).visible;
    const origSelectionVis = this.selectionBox.visible;

    this.editorHelpersGroup.visible = false;
    (this.transformControls as any).visible = false;
    this.selectionBox.visible = false;

    const hiddenGizmos: THREE.Object3D[] = [];
    this.sceneObjectsGroup.traverse((child) => {
      if (child.name.startsWith('__') && child.visible) {
        child.visible = false;
        hiddenGizmos.push(child);
      }
    });

    this.secondaryRenderer.render(this.scene, this.previewCamera);

    this.editorHelpersGroup.visible = origHelpersVis;
    (this.transformControls as any).visible = origTransformVis;
    this.selectionBox.visible = origSelectionVis;
    hiddenGizmos.forEach((g) => { g.visible = true; });
  }

  public setCameraView(view: 'top' | 'front' | 'right' | 'perspective') {
    const target = this.orbitControls.target.clone();
    const dist = 12;

    switch (view) {
      case 'top':
        this.camera.position.set(target.x, target.y + dist, target.z + 0.0001);
        break;
      case 'front':
        this.camera.position.set(target.x, target.y, target.z + dist);
        break;
      case 'right':
        this.camera.position.set(target.x + dist, target.y, target.z);
        break;
      case 'perspective':
        this.camera.position.set(target.x + 8, target.y + 6, target.z + 9);
        break;
    }
    this.camera.lookAt(target);
    this.orbitControls.update();
  }

  public focusSelected() {
    if (!this.selectedObject) return;
    const box = new THREE.Box3().setFromObject(this.selectedObject);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);

    this.orbitControls.target.copy(center);
    const offset = new THREE.Vector3(1, 0.7, 1).normalize().multiplyScalar(maxDim * 2.5);
    this.camera.position.copy(center).add(offset);
    this.camera.lookAt(center);
    this.orbitControls.update();
  }

  public frameAll() {
    const box = new THREE.Box3().setFromObject(this.sceneObjectsGroup);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 2);

    this.orbitControls.target.copy(center);
    const offset = new THREE.Vector3(1, 0.8, 1.2).normalize().multiplyScalar(maxDim * 2);
    this.camera.position.copy(center).add(offset);
    this.camera.lookAt(center);
    this.orbitControls.update();
  }

  // Keyboard handlers
  private onKeyDown = (e: KeyboardEvent) => {
    // Avoid hijacking when typing in an input
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select' || (e.target as HTMLElement)?.isContentEditable) {
      return;
    }

    this.keysPressed[e.code] = true;
    this.keysPressed[e.key] = true;
    this.keysPressed[e.key.toLowerCase()] = true;
    this.keysPressed[e.key.toUpperCase()] = true;

    if (this.isPlayMode) {
      if (e.code === 'Escape') {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      }
      return;
    }

    const key = e.key.toLowerCase();
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Undo / Redo
    if (isCtrlOrMeta && (key === 'z' || e.code === 'KeyZ')) {
      e.preventDefault();
      if (e.shiftKey) {
        this.callbacks.onShortcutAction?.('redo');
      } else {
        this.callbacks.onShortcutAction?.('undo');
      }
      return;
    }

    if (isCtrlOrMeta && (key === 'y' || e.code === 'KeyY')) {
      e.preventDefault();
      this.callbacks.onShortcutAction?.('redo');
      return;
    }

    // Save
    if (isCtrlOrMeta && (key === 's' || e.code === 'KeyS')) {
      e.preventDefault();
      this.callbacks.onShortcutAction?.('save');
      return;
    }

    // Duplicate
    if (isCtrlOrMeta && (key === 'd' || e.code === 'KeyD')) {
      e.preventDefault();
      this.callbacks.onShortcutAction?.('duplicate');
      return;
    }

    // Delete
    if (key === 'delete' || key === 'backspace' || e.code === 'Delete' || e.code === 'Backspace') {
      e.preventDefault();
      this.callbacks.onShortcutAction?.('delete');
      return;
    }

    // Non-modifier keys
    if (!isCtrlOrMeta && !e.altKey && !this.isRightMouseDown) {
      if (key === 'w' || e.code === 'KeyW') {
        this.setTransformMode('translate');
      } else if (key === 'e' || e.code === 'KeyE') {
        this.setTransformMode('rotate');
      } else if (key === 'r' || e.code === 'KeyR') {
        this.setTransformMode('scale');
      } else if (key === 'f' || e.code === 'KeyF') {
        this.focusSelected();
      } else if (key === 'home' || e.code === 'Home') {
        this.frameAll();
      } else if (key === 'escape' || e.code === 'Escape') {
        this.selectObject(null);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
    this.keysPressed[e.key] = false;
    this.keysPressed[e.key.toLowerCase()] = false;
    this.keysPressed[e.key.toUpperCase()] = false;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 2) {
      this.isRightMouseDown = true;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      this.isRightMouseDown = false;
    }
  };

  // Object Creation
  public addPrimitive(type: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus' | 'capsule'): THREE.Mesh {
    let geo: THREE.BufferGeometry;
    let name = type.charAt(0).toUpperCase() + type.slice(1);

    switch (type) {
      case 'cube':
        geo = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geo = new THREE.SphereGeometry(0.7, 32, 24);
        break;
      case 'cylinder':
        geo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32);
        break;
      case 'cone':
        geo = new THREE.ConeGeometry(0.6, 1.2, 32);
        break;
      case 'plane':
        geo = new THREE.PlaneGeometry(3, 3);
        break;
      case 'torus':
        geo = new THREE.TorusGeometry(0.7, 0.25, 16, 48);
        break;
      case 'capsule':
        geo = new THREE.CapsuleGeometry(0.4, 0.8, 16, 24);
        break;
    }

    const mat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = this.generateUniqueName(name);
    mesh.position.set(0, type === 'plane' ? 0.01 : 0.6, 0);
    if (type === 'plane') mesh.rotation.x = -Math.PI / 2;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      type: 'mesh',
      meshType: type,
      scripts: []
    };

    this.sceneObjectsGroup.add(mesh);
    this.selectObject(mesh);
    this.callbacks.onSceneModified();
    return mesh;
  }

  public addLight(type: 'directional' | 'point' | 'spot' | 'ambient'): THREE.Light {
    let light: THREE.Light;
    let name = type.charAt(0).toUpperCase() + type.slice(1) + ' Light';

    switch (type) {
      case 'directional': {
        const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dLight.position.set(5, 10, 5);
        dLight.castShadow = true;
        dLight.shadow.mapSize.width = 2048;
        dLight.shadow.mapSize.height = 2048;
        dLight.shadow.camera.near = 0.5;
        dLight.shadow.camera.far = 100;
        const d = 25;
        dLight.shadow.camera.left = -d;
        dLight.shadow.camera.right = d;
        dLight.shadow.camera.top = d;
        dLight.shadow.camera.bottom = -d;
        dLight.shadow.bias = -0.0001;
        dLight.shadow.normalBias = 0.03;
        light = dLight;
        break;
      }
      case 'point': {
        const pLight = new THREE.PointLight(0xf59e0b, 2.0, 15);
        pLight.position.set(0, 3, 0);
        pLight.castShadow = true;
        pLight.shadow.bias = -0.0001;
        pLight.shadow.normalBias = 0.02;
        light = pLight;
        break;
      }
      case 'spot': {
        const sLight = new THREE.SpotLight(0x38bdf8, 3.0, 20, Math.PI / 6, 0.4);
        sLight.position.set(0, 6, 0);
        sLight.castShadow = true;
        sLight.shadow.bias = -0.0001;
        sLight.shadow.normalBias = 0.02;
        light = sLight;
        break;
      }
      case 'ambient': {
        light = new THREE.AmbientLight(0xffffff, 0.4);
        break;
      }
    }

    light.name = this.generateUniqueName(name);
    light.userData = {
      type: 'light',
      lightType: type,
      scripts: []
    };

    // Add a visual icon / helper for the light in edit mode
    const helperSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: (light as any).color || 0xffff00, wireframe: true })
    );
    helperSphere.name = '__LIGHT_GIZMO__';
    light.add(helperSphere);

    this.sceneObjectsGroup.add(light);
    this.selectObject(light);
    this.callbacks.onSceneModified();
    return light;
  }

  public addCamera(): THREE.PerspectiveCamera {
    const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 1000);
    cam.name = this.generateUniqueName('Camera');
    cam.position.set(0, 3, 6);
    cam.lookAt(0, 1, 0);
    cam.userData = {
      type: 'camera',
      scripts: []
    };

    const helperMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.6, 4),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true })
    );
    helperMesh.rotation.x = -Math.PI / 2;
    cam.add(helperMesh);

    this.sceneObjectsGroup.add(cam);
    this.selectObject(cam);
    this.callbacks.onSceneModified();
    return cam;
  }

  public addEmptyObject(): THREE.Group {
    const group = new THREE.Group();
    group.name = this.generateUniqueName('GameObject');
    group.userData = {
      type: 'group',
      scripts: []
    };
    this.sceneObjectsGroup.add(group);
    this.selectObject(group);
    this.callbacks.onSceneModified();
    return group;
  }

  /**
   * Add a simulated Water object (Ocean, River, or Lake)
   */
  public addWater(type: WaterType = 'ocean', preset?: WaterPreset): THREE.Mesh {
    const config = preset && WATER_PRESETS[preset]
      ? { ...getDefaultWaterConfig(type), ...WATER_PRESETS[preset] }
      : getDefaultWaterConfig(type);

    let prefix = 'Ocean Water';
    if (type === 'river') prefix = 'River Water';
    if (type === 'lake') prefix = 'Lake Water';

    const mesh = WaterSystem.createWaterMesh(config);
    mesh.name = this.generateUniqueName(prefix);
    mesh.position.set(0, 0.1, 0);

    this.sceneObjectsGroup.add(mesh);
    this.selectObject(mesh);
    this.callbacks.onSceneModified();
    return mesh;
  }

  /**
   * Update selected Water Object parameters
   */
  public updateSelectedWater(updates: Partial<WaterConfig>) {
    if (!this.selectedObject) return;
    let waterMesh: THREE.Mesh | null = null;

    if ((this.selectedObject as THREE.Mesh).isMesh && this.selectedObject.userData?.type === 'water') {
      waterMesh = this.selectedObject as THREE.Mesh;
    } else {
      this.selectedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.userData?.type === 'water') {
          waterMesh = child as THREE.Mesh;
        }
      });
    }

    if (waterMesh) {
      WaterSystem.updateWaterMesh(waterMesh, updates);
      this.callbacks.onSceneModified();
      const data = this.extractObjectData(this.selectedObject);
      this.callbacks.onTransformChange(data);
    }
  }

  /**
   * Apply a predefined Water Preset to the selected water mesh
   */
  public applySelectedWaterPreset(preset: WaterPreset) {
    if (!this.selectedObject) return;
    let waterMesh: THREE.Mesh | null = null;

    if ((this.selectedObject as THREE.Mesh).isMesh && this.selectedObject.userData?.type === 'water') {
      waterMesh = this.selectedObject as THREE.Mesh;
    } else {
      this.selectedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.userData?.type === 'water') {
          waterMesh = child as THREE.Mesh;
        }
      });
    }

    if (waterMesh) {
      WaterSystem.applyPreset(waterMesh, preset);
      this.callbacks.onSceneModified();
      const data = this.extractObjectData(this.selectedObject);
      this.callbacks.onTransformChange(data);
    }
  }

  /**
   * Add Character Controller (FPV Player, TPV Player, or Drone Rig)
   */
  public addCharacterController(type: ControllerType = 'fpv', config?: Partial<CharacterControllerConfig>): THREE.Group {
    const playerGroup = CharacterControllerSystem.createPlayerObject(type, config);
    let prefix = type === 'fpv' ? 'FPV Player' : type === 'tpv' ? 'TPV Player' : 'Drone Rig';
    playerGroup.name = this.generateUniqueName(prefix);
    playerGroup.position.set(0, type === 'drone' ? 1.0 : 0.0, 0);

    this.sceneObjectsGroup.add(playerGroup);
    this.selectObject(playerGroup);

    // Auto adjust player camera in viewport:
    // Focus and frame viewport camera nicely on the newly added character controller
    const targetY = type === 'drone' ? 1.2 : 1.4;
    this.orbitControls.target.set(playerGroup.position.x, playerGroup.position.y + targetY, playerGroup.position.z);
    this.camera.position.set(
      playerGroup.position.x + (type === 'drone' ? 4 : 3.5),
      playerGroup.position.y + (type === 'drone' ? 2.5 : 2.2),
      playerGroup.position.z + (type === 'drone' ? 5 : 4.5)
    );
    this.camera.lookAt(this.orbitControls.target);
    this.orbitControls.update();

    this.callbacks.onSceneModified();
    return playerGroup;
  }

  /**
   * Update selected Character Controller parameters
   */
  public updateSelectedCharacterController(updates: Partial<CharacterControllerConfig>) {
    if (!this.selectedObject) return;
    const target = this.selectedObject;
    if (target.userData.type === 'characterController' || target.userData.isPlayerController) {
      target.userData.characterConfig = {
        ...(target.userData.characterConfig || getDefaultCharacterConfig(target.userData.controllerType || 'fpv')),
        ...updates
      };

      if (updates.eyeHeight !== undefined) {
        const head = target.getObjectByName('PlayerHead');
        if (head) head.position.y = updates.eyeHeight;
        const cam = target.getObjectByName('PlayerCamera');
        if (cam && target.userData.controllerType === 'fpv') cam.position.y = updates.eyeHeight;
      }
      if (updates.flashlight !== undefined) {
        const fl = target.getObjectByName('PlayerFlashlight') as THREE.SpotLight | null;
        if (fl) fl.intensity = updates.flashlight ? 2.5 : 0;
      }

      this.callbacks.onSceneModified();
      const data = this.extractObjectData(target);
      this.callbacks.onTransformChange(data);
    }
  }

  /**
   * Switch selected character controller type (FPV <-> TPV <-> Drone)
   */
  public switchSelectedControllerType(newType: ControllerType) {
    if (!this.selectedObject) return;
    const target = this.selectedObject;
    const currentPos = target.position.clone();
    const currentRot = target.rotation.clone();
    const currentScale = target.scale.clone();
    const currentName = target.name;

    const newPlayer = CharacterControllerSystem.createPlayerObject(newType);
    newPlayer.name = currentName;
    newPlayer.position.copy(currentPos);
    newPlayer.rotation.copy(currentRot);
    newPlayer.scale.copy(currentScale);

    const parent = target.parent || this.sceneObjectsGroup;
    const index = parent.children.indexOf(target);
    if (index !== -1) {
      parent.children[index] = newPlayer;
      newPlayer.parent = parent;
    } else {
      parent.remove(target);
      parent.add(newPlayer);
    }

    this.selectObject(newPlayer);
    this.callbacks.onSceneModified();
    const data = this.extractObjectData(newPlayer);
    this.callbacks.onTransformChange(data);
  }

  public addPresetModel(presetId: string): THREE.Object3D | null {
    const preset = MODEL_PRESETS.find(p => p.id === presetId);
    if (!preset) return null;

    const group = preset.createMesh();
    group.name = this.generateUniqueName(preset.name);
    group.userData = {
      type: 'model',
      presetId,
      isPrefabRoot: true,
      scripts: presetId === 'robot_character' ? [
        { type: 'playerController', enabled: true, speed: 6, jumpForce: 8 }
      ] : presetId === 'coin_collectible' ? [
        { type: 'rotator', enabled: true, rotSpeed: { x: 0, y: 90, z: 0 } }
      ] : []
    };

    this.sceneObjectsGroup.add(group);
    this.selectObject(group);
    this.callbacks.onSceneModified();
    return group;
  }

  // Import GLB/GLTF from File or ArrayBuffer
  public async importGLBFile(
    file: File,
    onProgress?: (percent: number) => void,
    importMode: 'combined' | 'layers' = 'combined'
  ): Promise<THREE.Object3D> {
    const asset = await AssetManager.getInstance().registerModelFile(file);
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.gltfLoader.load(
        url,
        (gltf) => {
          URL.revokeObjectURL(url);
          const root = gltf.scene;
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          root.name = this.generateUniqueName(cleanName);
          
          const folderLocation = (file as any).webkitRelativePath || file.name;
          root.userData = {
            type: 'model',
            isPrefabRoot: true,
            isFolder: importMode === 'layers',
            importMode: importMode,
            assetPath: asset.path,
            filename: asset.filename,
            modelAssetId: asset.id,
            folderLocation: folderLocation,
            fileLocation: folderLocation,
            fileSize: asset.fileSize,
            sourceType: 'local_file',
            scripts: []
          };

          let subMeshCount = 1;
          root.traverse((child) => {
            // Give names to un-named child nodes or meshes in layer mode
            if (child !== root) {
              if (!child.name || child.name.trim() === '') {
                child.name = `${cleanName}_Layer_${subMeshCount++}`;
              }
              child.userData = child.userData || {};
              child.userData.type = child.userData.type || 'model';
              child.userData.isLayerChild = true;
              child.userData.parentModel = cleanName;
            }

            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              const nameLower = (m.name + ' ' + (m.parent?.name || '')).toLowerCase();
              m.castShadow = true;
              if (nameLower.includes('water') || nameLower.includes('ocean') || nameLower.includes('sea') || nameLower.includes('river') || nameLower.includes('lake')) {
                m.receiveShadow = false;
              } else {
                m.receiveShadow = true;
              }

              if (m.material) {
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                let matIdx = 1;
                mats.forEach((mat: any) => {
                  mat.side = THREE.DoubleSide;
                  if (!mat.name || mat.name.trim() === '') {
                    mat.name = `${cleanName}_Mat_${matIdx++}`;
                  }
                  mat.userData = mat.userData || {};
                  mat.userData.sourceModel = cleanName;
                  mat.userData.materialId = mat.uuid;

                  const maxAnisotropy = Math.min(16, this.renderer.capabilities.getMaxAnisotropy());
                  if (mat.map) {
                    mat.map.colorSpace = THREE.SRGBColorSpace;
                    mat.map.anisotropy = maxAnisotropy;
                    mat.map.needsUpdate = true;
                  }
                  if (mat.emissiveMap) {
                    mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                    mat.emissiveMap.anisotropy = maxAnisotropy;
                    mat.emissiveMap.needsUpdate = true;
                  }
                  if (mat.normalMap) {
                    mat.normalMap.colorSpace = THREE.NoColorSpace;
                    mat.normalMap.anisotropy = maxAnisotropy;
                    mat.normalMap.needsUpdate = true;
                  }
                  if (mat.roughnessMap) {
                    mat.roughnessMap.colorSpace = THREE.NoColorSpace;
                    mat.roughnessMap.needsUpdate = true;
                  }
                  if (mat.metalnessMap) {
                    mat.metalnessMap.colorSpace = THREE.NoColorSpace;
                    mat.metalnessMap.needsUpdate = true;
                  }
                  if (mat.aoMap) {
                    mat.aoMap.colorSpace = THREE.NoColorSpace;
                    mat.aoMap.needsUpdate = true;
                  }
                  if (mat.alphaMap) {
                    mat.alphaMap.colorSpace = THREE.NoColorSpace;
                    mat.alphaMap.needsUpdate = true;
                  }
                  mat.needsUpdate = true;
                });
              }
            }
          });

          // Normalize size and center
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 5) {
            const scale = 3 / maxDim;
            root.scale.set(scale, scale, scale);
          }
          const box2 = new THREE.Box3().setFromObject(root);
          root.position.y = -box2.min.y;

          this.sceneObjectsGroup.add(root);
          this.selectObject(root);
          this.focusSelected();
          this.callbacks.onSceneModified();
          this.notifyMaterialsChanged();
          this.notifyTexturesChanged();
          resolve(root);
        },
        (xhr) => {
          if (xhr.lengthComputable && onProgress) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            onProgress(percent);
          }
        },
        (err: any) => {
          URL.revokeObjectURL(url);
          const msg = `Unable to import model: ${err?.message || 'The selected file is not a valid GLB/GLTF model.'}`;
          this.callbacks.onError(msg);
          reject(new Error(msg));
        }
      );
    });
  }

  /**
   * Replace an existing 3D model with a new GLB file while preserving transform & hierarchy
   */
  public async replaceModel(targetObjOrId: THREE.Object3D | string, file: File): Promise<THREE.Object3D> {
    const target = typeof targetObjOrId === 'string' ? this.findObjectByUuid(targetObjOrId) : targetObjOrId;
    if (!target) throw new Error('Target object not found for replacement');

    const asset = await AssetManager.getInstance().registerModelFile(file);
    const buffer = await file.arrayBuffer();

    return new Promise((resolve, reject) => {
      this.gltfLoader.parse(
        buffer,
        '',
        (gltf) => {
          const newRoot = gltf.scene;
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          
          // Preserve original transform
          newRoot.position.copy(target.position);
          newRoot.rotation.copy(target.rotation);
          newRoot.scale.copy(target.scale);
          newRoot.name = target.name || this.generateUniqueName(cleanName);
          newRoot.visible = target.visible;

          const folderLocation = (file as any).webkitRelativePath || file.name;
          newRoot.userData = {
            ...target.userData,
            type: 'model',
            isPrefabRoot: true,
            assetPath: asset.path,
            filename: asset.filename,
            modelAssetId: asset.id,
            folderLocation: folderLocation,
            fileLocation: folderLocation,
            fileSize: asset.fileSize,
            sourceType: 'local_file',
            scripts: target.userData.scripts || []
          };

          // Enable shadows and double-sided materials
          newRoot.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              m.castShadow = target.castShadow ?? true;
              m.receiveShadow = target.receiveShadow ?? true;
              if (m.material) {
                if (Array.isArray(m.material)) {
                  m.material.forEach((mat) => { mat.side = THREE.DoubleSide; });
                } else {
                  m.material.side = THREE.DoubleSide;
                }
              }
            }
          });

          // Replace in scene tree
          const parent = target.parent || this.sceneObjectsGroup;
          const index = parent.children.indexOf(target);
          if (index !== -1) {
            parent.children[index] = newRoot;
            newRoot.parent = parent;
          } else {
            parent.remove(target);
            parent.add(newRoot);
          }

          this.selectObject(newRoot);
          this.callbacks.onSceneModified();
          this.notifyMaterialsChanged();
          this.notifyTexturesChanged();
          resolve(newRoot);
        },
        (err: any) => {
          const msg = `Unable to replace model: ${err?.message || 'Invalid GLB format.'}`;
          this.callbacks.onError(msg);
          reject(new Error(msg));
        }
      );
    });
  }

  /**
   * Reimport / reload model from its asset cache buffer or origin
   */
  public async reimportModel(targetObjOrId?: THREE.Object3D | string): Promise<THREE.Object3D> {
    const target = targetObjOrId 
      ? (typeof targetObjOrId === 'string' ? this.findObjectByUuid(targetObjOrId) : targetObjOrId)
      : this.selectedObject;
    if (!target) throw new Error('No object selected for reimport');

    const assetId = target.userData.modelAssetId || target.userData.assetPath;
    const asset = assetId ? AssetManager.getInstance().getModel(assetId) : undefined;

    if (asset && asset.data) {
      const buffer = asset.data instanceof ArrayBuffer ? asset.data : await (asset.data as Blob).arrayBuffer();
      return new Promise((resolve, reject) => {
        this.gltfLoader.parse(
          buffer,
          '',
          (gltf) => {
            const newRoot = gltf.scene;
            newRoot.position.copy(target.position);
            newRoot.rotation.copy(target.rotation);
            newRoot.scale.copy(target.scale);
            newRoot.name = target.name;
            newRoot.visible = target.visible;
            newRoot.userData = { ...target.userData };

            newRoot.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.castShadow = target.castShadow ?? true;
                m.receiveShadow = target.receiveShadow ?? true;
                if (m.material) {
                  if (Array.isArray(m.material)) {
                    m.material.forEach((mat) => { mat.side = THREE.DoubleSide; });
                  } else {
                    m.material.side = THREE.DoubleSide;
                  }
                }
              }
            });

            const parent = target.parent || this.sceneObjectsGroup;
            const index = parent.children.indexOf(target);
            if (index !== -1) {
              parent.children[index] = newRoot;
              newRoot.parent = parent;
            } else {
              parent.remove(target);
              parent.add(newRoot);
            }

            this.selectObject(newRoot);
            this.callbacks.onSceneModified();
            this.notifyMaterialsChanged();
            this.notifyTexturesChanged();
            resolve(newRoot);
          },
          (err) => {
            this.callbacks.onError(`Failed to reimport model: ${(err as any)?.message}`);
            reject(err);
          }
        );
      });
    }

    this.callbacks.onSceneModified();
    return target;
  }

  /**
   * Export the selected object or model as a standalone .GLB file download
   */
  public async exportSelectedGLB(customName?: string): Promise<void> {
    if (!this.selectedObject) return;
    const name = customName || this.selectedObject.name || 'model';

    const assetId = this.selectedObject.userData.modelAssetId;
    const asset = assetId ? AssetManager.getInstance().getModel(assetId) : undefined;

    if (asset && asset.data) {
      const buffer = asset.data instanceof ArrayBuffer ? asset.data : await (asset.data as Blob).arrayBuffer();
      const blob = new Blob([buffer], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.filename || `${name}.glb`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const exportedAsset = await AssetManager.getInstance().exportObjectAsGLB(this.selectedObject, name);
      const blob = new Blob([exportedAsset.data as ArrayBuffer], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportedAsset.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      this.callbacks.onError(`Export GLB failed: ${err?.message || err}`);
    }
  }

  /**
   * Update the computer folder location / URL for the model
   */
  public updateModelFolderLocation(location: string, targetObjOrId?: THREE.Object3D | string) {
    const target = targetObjOrId 
      ? (typeof targetObjOrId === 'string' ? this.findObjectByUuid(targetObjOrId) : targetObjOrId)
      : this.selectedObject;
    if (!target) return;

    target.userData.folderLocation = location;
    target.userData.fileLocation = location;
    if (target.userData.modelAssetId) {
      AssetManager.getInstance().updateFolderLocation(target.userData.modelAssetId, location);
    }
    this.callbacks.onSceneModified();
    const data = this.extractObjectData(target);
    this.callbacks.onTransformChange(data);
  }

  /**
   * Calculate polygon, vertex and mesh stats for any 3D object
   */
  public calculateObjectStats(obj: THREE.Object3D): { triangles: number; vertices: number; meshes: number } {
    let triangles = 0;
    let vertices = 0;
    let meshes = 0;

    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes++;
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          if (mesh.geometry.index) {
            triangles += mesh.geometry.index.count / 3;
          } else if (mesh.geometry.attributes.position) {
            triangles += mesh.geometry.attributes.position.count / 3;
          }
          if (mesh.geometry.attributes.position) {
            vertices += mesh.geometry.attributes.position.count;
          }
        }
      }
    });

    return { triangles: Math.round(triangles), vertices, meshes };
  }

  /**
   * Get 3D object under screen pointer coordinates (used for Viewport context menu raycasting)
   */
  public getObjectUnderPointer(clientX: number, clientY: number): THREE.Object3D | null {
    if (!this.container) return null;
    const rect = this.container.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

    const intersects = ray.intersectObjects(this.sceneObjectsGroup.children, true);
    if (intersects.length > 0) {
      let target: THREE.Object3D = intersects[0].object;
      while (target.parent && target.parent !== this.sceneObjectsGroup && target.parent !== this.scene) {
        if (target.userData.isPrefabRoot) break;
        target = target.parent;
      }
      return target;
    }
    return null;
  }

  public findObjectByUuid(uuid: string): THREE.Object3D | null {
    let found: THREE.Object3D | null = null;
    this.sceneObjectsGroup.traverse((child) => {
      if (child.uuid === uuid) {
        found = child;
      }
    });
    return found;
  }

  // Apply texture to selected object
  public applyTexture(texture: THREE.Texture, type: 'map' | 'roughnessMap' | 'metalnessMap' | 'normalMap' = 'map') {
    if (!this.selectedObject) return;

    this.selectedObject.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          (mat as any)[type] = texture;
          mat.needsUpdate = true;
          mesh.material = mat;
        }
      }
    });

    this.callbacks.onSceneModified();
    const data = this.extractObjectData(this.selectedObject);
    this.callbacks.onTransformChange(data);
  }

  // Apply uploaded image file as texture
  public async uploadTextureFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.textureLoader.load(
        url,
        (texture) => {
          texture.name = file.name;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          this.applyTexture(texture, 'map');
          resolve(url);
        },
        undefined,
        (err) => {
          URL.revokeObjectURL(url);
          const msg = 'Failed to load texture file: ' + (err as any)?.message;
          this.callbacks.onError(msg);
          reject(new Error(msg));
        }
      );
    });
  }

  // Duplicate
  public duplicateSelected(): THREE.Object3D | null {
    if (!this.selectedObject) return null;

    const clone = this.selectedObject.clone(true);
    clone.name = this.generateUniqueName(this.selectedObject.name + '_Copy');
    clone.position.x += 1.2;
    clone.position.z += 1.2;

    this.sceneObjectsGroup.add(clone);
    this.selectObject(clone);
    this.callbacks.onSceneModified();
    return clone;
  }

  // Delete
  public deleteSelected(): THREE.Object3D | null {
    if (!this.selectedObject) return null;

    const obj = this.selectedObject;
    this.selectObject(null);
    obj.parent?.remove(obj);
    this.callbacks.onSceneModified();
    return obj;
  }

  // Restore object (for Undo of delete or Redo of create)
  public restoreObject(obj: THREE.Object3D) {
    if (!obj) return;
    this.sceneObjectsGroup.add(obj);
    this.selectObject(obj);
    this.callbacks.onSceneModified();
  }

  // Remove object (for Undo of create or Redo of delete)
  public removeObject(obj: THREE.Object3D) {
    if (!obj) return;
    if (this.selectedObject === obj) {
      this.selectObject(null);
    }
    obj.parent?.remove(obj);
    this.callbacks.onSceneModified();
  }

  // Updates from Inspector
  public updateSelectedTransform(pos?: Vec3, rotDeg?: Vec3, scale?: Vec3) {
    if (!this.selectedObject) return;

    if (pos) {
      this.selectedObject.position.set(pos.x, pos.y, pos.z);
    }
    if (rotDeg) {
      this.selectedObject.rotation.set(
        THREE.MathUtils.degToRad(rotDeg.x),
        THREE.MathUtils.degToRad(rotDeg.y),
        THREE.MathUtils.degToRad(rotDeg.z)
      );
    }
    if (scale) {
      this.selectedObject.scale.set(Math.max(scale.x, 0.001), Math.max(scale.y, 0.001), Math.max(scale.z, 0.001));
    }

    this.updateSelectionBox();
    const data = this.extractObjectData(this.selectedObject);
    this.callbacks.onTransformChange(data);
  }

  // --- Unity-like Material & Texture Management System ---

  public extractTextureToDataUrl(texture: THREE.Texture): { url: string; width: number; height: number } | null {
    if (!texture) return null;
    const img: any = texture.image || (texture.source ? (texture.source as any).data : null);
    if (!img) return null;

    try {
      // If already data URL or string src
      if (typeof img.src === 'string' && img.src.length > 0) {
        if (img.src.startsWith('data:image')) {
          const w = img.width || 256;
          const h = img.height || 256;
          return { url: img.src, width: w, height: h };
        }
        // If image is an HTMLImageElement still loading, or blob URL, fallback safely
        if (img instanceof HTMLImageElement && !img.complete) {
          return { url: img.src, width: img.width || 512, height: img.height || 512 };
        }
      }

      // If HTMLCanvasElement
      if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) {
        return { url: img.toDataURL('image/png'), width: img.width, height: img.height };
      }

      const width = img.width || (img as any).naturalWidth || (img as any).videoWidth || 512;
      const height = img.height || (img as any).naturalHeight || (img as any).videoHeight || 512;

      // Bound thumbnail dimensions to max 1024 to preserve fast performance
      const maxDim = 1024;
      let targetW = width;
      let targetH = height;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.max(1, Math.round((targetH * maxDim) / targetW));
          targetW = maxDim;
        } else {
          targetW = Math.max(1, Math.round((targetW * maxDim) / targetH));
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (typeof img.src === 'string' && img.src.length > 0) {
          return { url: img.src, width, height };
        }
        return null;
      }

      if (img.data && (img.data instanceof Uint8Array || img.data instanceof Uint8ClampedArray)) {
        const imgData = ctx.createImageData(width, height);
        imgData.data.set(img.data);
        if (width === targetW && height === targetH) {
          ctx.putImageData(imgData, 0, 0);
        } else {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.putImageData(imgData, 0, 0);
            ctx.drawImage(tempCanvas, 0, 0, targetW, targetH);
          }
        }
      } else {
        ctx.drawImage(img as CanvasImageSource, 0, 0, targetW, targetH);
      }

      const url = canvas.toDataURL('image/png');
      return { url, width, height };
    } catch (err) {
      console.warn('Could not extract texture to data URL, falling back to source URL if available:', err);
      if (img && typeof img.src === 'string' && img.src.length > 0) {
        return {
          url: img.src,
          width: img.width || 512,
          height: img.height || 512
        };
      }
      return null;
    }
  }

  public extractAllSceneTextures(): TextureAsset[] {
    const texturesMap = new Map<string, TextureAsset>();

    const checkAndRegisterTexture = (
      tex: THREE.Texture | null | undefined,
      mapType: import('../types/editor').TextureMapType,
      matName: string,
      matUuid: string,
      sourceModel?: string
    ): string | undefined => {
      if (!tex) return undefined;

      const texKey = tex.uuid || `${matUuid}_${mapType}`;
      if (texturesMap.has(texKey)) {
        return texturesMap.get(texKey)!.url;
      }

      let url = tex.userData?.extractedUrl;
      let width = tex.userData?.extractedWidth;
      let height = tex.userData?.extractedHeight;

      if (!url) {
        const extracted = this.extractTextureToDataUrl(tex);
        if (extracted) {
          url = extracted.url;
          width = extracted.width;
          height = extracted.height;
          tex.userData = tex.userData || {};
          tex.userData.extractedUrl = url;
          tex.userData.extractedWidth = width;
          tex.userData.extractedHeight = height;
        }
      }

      if (!url) return undefined;

      const typeLabel = mapType.toUpperCase();
      const rawName = tex.name && tex.name.trim() !== '' ? tex.name : `${matName}_${typeLabel}`;

      const asset: TextureAsset = {
        id: texKey,
        name: rawName,
        url,
        mapType,
        sourceModel,
        materialName: matName,
        materialId: matUuid,
        width,
        height,
        format: 'image/png'
      };

      texturesMap.set(texKey, asset);
      return url;
    };

    this.sceneObjectsGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        let sourceModel: string | undefined = undefined;
        let p: THREE.Object3D | null = mesh;
        while (p && p !== this.sceneObjectsGroup) {
          if (p.userData?.isPrefabRoot || p.userData?.type === 'model' || p.userData?.filename) {
            sourceModel = p.userData.filename || p.name;
            break;
          }
          p = p.parent;
        }

        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m: any) => {
            if (!m) return;
            const matName = m.name || `${sourceModel || 'Mesh'}_Mat`;
            const matUuid = m.uuid;

            // 1. Albedo / Map
            const mapUrl = checkAndRegisterTexture(m.map, 'albedo', matName, matUuid, sourceModel);
            if (mapUrl) m.userData.mapUrl = mapUrl;

            // 2. Normal Map
            const normalMapUrl = checkAndRegisterTexture(m.normalMap, 'normal', matName, matUuid, sourceModel);
            if (normalMapUrl) m.userData.normalMapUrl = normalMapUrl;

            // 3. Roughness Map
            const roughnessMapUrl = checkAndRegisterTexture(m.roughnessMap, 'roughness', matName, matUuid, sourceModel);
            if (roughnessMapUrl) m.userData.roughnessMapUrl = roughnessMapUrl;

            // 4. Metallic Map
            const metalnessMapUrl = checkAndRegisterTexture(m.metalnessMap, 'metallic', matName, matUuid, sourceModel);
            if (metalnessMapUrl) m.userData.metalnessMapUrl = metalnessMapUrl;

            // 5. Alpha Map
            const alphaMapUrl = checkAndRegisterTexture(m.alphaMap, 'alpha', matName, matUuid, sourceModel);
            if (alphaMapUrl) m.userData.alphaMapUrl = alphaMapUrl;

            // 6. Emissive Map
            const emissiveMapUrl = checkAndRegisterTexture(m.emissiveMap, 'emissive', matName, matUuid, sourceModel);
            if (emissiveMapUrl) m.userData.emissiveMapUrl = emissiveMapUrl;

            // 7. AO Map
            const aoMapUrl = checkAndRegisterTexture(m.aoMap, 'ao', matName, matUuid, sourceModel);
            if (aoMapUrl) m.userData.aoMapUrl = aoMapUrl;
          });
        }
      }
    });

    return Array.from(texturesMap.values());
  }

  public notifyTexturesChanged() {
    const allTextures = this.extractAllSceneTextures();
    if (this.callbacks.onTexturesChanged) {
      this.callbacks.onTexturesChanged(allTextures);
    }
  }

  public serializeMaterial(mat: THREE.Material, meshCount = 1, sourceModel?: string): MaterialConfig {
    const stdMat = mat as any;
    const colorHex = stdMat.color ? '#' + stdMat.color.getHexString() : '#ffffff';
    const emissiveHex = stdMat.emissive ? '#' + stdMat.emissive.getHexString() : '#000000';
    const emissiveIntensity = stdMat.emissiveIntensity !== undefined ? stdMat.emissiveIntensity : 1.0;
    const roughness = stdMat.roughness !== undefined ? stdMat.roughness : 0.5;
    const metalness = stdMat.metalness !== undefined ? stdMat.metalness : 0.0;
    const opacity = stdMat.opacity !== undefined ? stdMat.opacity : 1.0;
    const transparent = !!stdMat.transparent;
    const wireframe = !!stdMat.wireframe;
    const doubleSided = stdMat.side === THREE.DoubleSide;

    const getMapUrl = (tex: THREE.Texture | undefined, propKey: string): string | undefined => {
      if (mat.userData && mat.userData[propKey]) return mat.userData[propKey];
      if (!tex) return undefined;
      if (tex.userData?.extractedUrl) return tex.userData.extractedUrl;
      const extracted = this.extractTextureToDataUrl(tex);
      if (extracted) {
        tex.userData = tex.userData || {};
        tex.userData.extractedUrl = extracted.url;
        tex.userData.extractedWidth = extracted.width;
        tex.userData.extractedHeight = extracted.height;
        mat.userData = mat.userData || {};
        mat.userData[propKey] = extracted.url;
        return extracted.url;
      }
      return undefined;
    };

    const mapUrl = getMapUrl(stdMat.map, 'mapUrl');
    const normalMapUrl = getMapUrl(stdMat.normalMap, 'normalMapUrl');
    const roughnessMapUrl = getMapUrl(stdMat.roughnessMap, 'roughnessMapUrl');
    const metalnessMapUrl = getMapUrl(stdMat.metalnessMap, 'metalnessMapUrl');
    const alphaMapUrl = getMapUrl(stdMat.alphaMap, 'alphaMapUrl');
    const emissiveMapUrl = getMapUrl(stdMat.emissiveMap, 'emissiveMapUrl');
    const aoMapUrl = getMapUrl(stdMat.aoMap, 'aoMapUrl');

    return {
      id: mat.uuid,
      uuid: mat.uuid,
      name: mat.name && mat.name.trim() !== '' ? mat.name : 'Standard Material',
      color: colorHex,
      roughness,
      metalness,
      opacity,
      transparent,
      wireframe,
      emissive: emissiveHex,
      emissiveIntensity,
      doubleSided,
      sourceModel: sourceModel || mat.userData?.sourceModel || undefined,
      meshCount,

      mapUrl,
      mapName: stdMat.map ? (stdMat.map.name || 'Albedo / Base Map') : undefined,

      normalMapUrl,
      normalMapName: stdMat.normalMap ? (stdMat.normalMap.name || 'Normal Map') : undefined,
      normalScale: stdMat.normalScale ? stdMat.normalScale.x : 1.0,

      roughnessMapUrl,
      roughnessMapName: stdMat.roughnessMap ? (stdMat.roughnessMap.name || 'Roughness Map') : undefined,

      metalnessMapUrl,
      metalnessMapName: stdMat.metalnessMap ? (stdMat.metalnessMap.name || 'Metallic Map') : undefined,

      alphaMapUrl,
      alphaMapName: stdMat.alphaMap ? (stdMat.alphaMap.name || 'Alpha Map') : undefined,
      alphaTest: stdMat.alphaTest ?? 0,

      emissiveMapUrl,
      emissiveMapName: stdMat.emissiveMap ? (stdMat.emissiveMap.name || 'Emissive Map') : undefined,

      aoMapUrl,
      aoMapName: stdMat.aoMap ? (stdMat.aoMap.name || 'AO Map') : undefined,
      aoMapIntensity: stdMat.aoMapIntensity ?? 1.0
    };
  }

  public getAllSceneMaterials(): MaterialConfig[] {
    const materialsMap = new Map<string, { mat: THREE.Material; count: number; sourceModel?: string }>();

    this.sceneObjectsGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        let sourceModel: string | undefined = undefined;
        let p: THREE.Object3D | null = mesh;
        while (p && p !== this.sceneObjectsGroup) {
          if (p.userData?.isPrefabRoot || p.userData?.type === 'model' || p.userData?.filename) {
            sourceModel = p.userData.filename || p.name;
            break;
          }
          p = p.parent;
        }

        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (!m) return;
            const id = m.uuid;
            if (!materialsMap.has(id)) {
              if (!m.name || m.name.trim() === '') {
                m.name = `${sourceModel || 'Mesh'}_Mat_${materialsMap.size + 1}`;
              }
              materialsMap.set(id, { mat: m, count: 1, sourceModel: m.userData?.sourceModel || sourceModel });
            } else {
              materialsMap.get(id)!.count++;
            }
          });
        }
      }
    });

    const result: MaterialConfig[] = [];
    materialsMap.forEach(({ mat, count, sourceModel }) => {
      result.push(this.serializeMaterial(mat, count, sourceModel));
    });

    return result;
  }

  public notifyMaterialsChanged() {
    if (this.callbacks.onMaterialsChanged) {
      const allMats = this.getAllSceneMaterials();
      this.callbacks.onMaterialsChanged(allMats);
    }
  }

  public updateMaterialById(materialId: string, updates: Partial<MaterialConfig>) {
    const matchedMaterials: THREE.Material[] = [];

    // 1. Search all scene meshes for materials matching UUID or name
    this.sceneObjectsGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            if (m && (m.uuid === materialId || m.name === materialId)) {
              if (!matchedMaterials.includes(m)) {
                matchedMaterials.push(m);
              }
            }
          }
        }
      }
    });

    // 2. If no material matched by ID/name and we have a selected object, fallback to selected object's materials
    if (matchedMaterials.length === 0 && this.selectedObject) {
      this.selectedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
              if (m && !matchedMaterials.includes(m)) {
                matchedMaterials.push(m);
              }
            }
          }
        }
      });
    }

    if (matchedMaterials.length === 0) return;

    for (const mat of matchedMaterials) {
      const stdMat = mat as any;

      if (updates.name !== undefined && updates.name.trim() !== '') {
        stdMat.name = updates.name.trim();
      }
      if (updates.color !== undefined) {
        if (stdMat.color) {
          stdMat.color.set(updates.color);
        }
      }
      if (updates.roughness !== undefined && stdMat.roughness !== undefined) {
        stdMat.roughness = updates.roughness;
      }
      if (updates.metalness !== undefined && stdMat.metalness !== undefined) {
        stdMat.metalness = updates.metalness;
      }
      if (updates.opacity !== undefined) {
        stdMat.opacity = updates.opacity;
      }
      if (updates.transparent !== undefined) {
        stdMat.transparent = updates.transparent;
      }
      if (updates.wireframe !== undefined && stdMat.wireframe !== undefined) {
        stdMat.wireframe = updates.wireframe;
      }
      if (updates.emissive !== undefined && stdMat.emissive) {
        stdMat.emissive.set(updates.emissive);
      }
      if (updates.emissiveIntensity !== undefined && stdMat.emissiveIntensity !== undefined) {
        stdMat.emissiveIntensity = updates.emissiveIntensity;
      }
      if (updates.doubleSided !== undefined) {
        stdMat.side = updates.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
      }

      // Assign or remove texture maps
      const assignOrRemoveTexture = (
        channel: 'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'alphaMap' | 'emissiveMap' | 'aoMap',
        urlValue: string | undefined | null,
        isSRGB: boolean
      ) => {
        if (urlValue === null || urlValue === '') {
          stdMat[channel] = null;
          if (stdMat.userData) {
            delete stdMat.userData[`${channel}Url`];
          }
          stdMat.needsUpdate = true;
        } else if (typeof urlValue === 'string' && urlValue.length > 0) {
          stdMat.userData = stdMat.userData || {};
          stdMat.userData[`${channel}Url`] = urlValue;
          this.textureLoader.load(urlValue, (tex) => {
            tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            stdMat[channel] = tex;
            stdMat.needsUpdate = true;
            this.callbacks.onSceneModified();
            this.notifyMaterialsChanged();
            this.notifyTexturesChanged();
          });
        }
      };

      if (updates.mapUrl !== undefined) assignOrRemoveTexture('map', updates.mapUrl, true);
      if (updates.normalMapUrl !== undefined) assignOrRemoveTexture('normalMap', updates.normalMapUrl, false);
      if (updates.roughnessMapUrl !== undefined) assignOrRemoveTexture('roughnessMap', updates.roughnessMapUrl, false);
      if (updates.metalnessMapUrl !== undefined) assignOrRemoveTexture('metalnessMap', updates.metalnessMapUrl, false);
      if (updates.alphaMapUrl !== undefined) {
        assignOrRemoveTexture('alphaMap', updates.alphaMapUrl, false);
        if (updates.alphaMapUrl) {
          stdMat.transparent = true;
        }
      }
      if (updates.emissiveMapUrl !== undefined) assignOrRemoveTexture('emissiveMap', updates.emissiveMapUrl, true);
      if (updates.aoMapUrl !== undefined) assignOrRemoveTexture('aoMap', updates.aoMapUrl, false);

      if (updates.normalScale !== undefined && stdMat.normalScale) {
        stdMat.normalScale.set(updates.normalScale, updates.normalScale);
      }
      if (updates.alphaTest !== undefined) {
        stdMat.alphaTest = updates.alphaTest;
      }
      if (updates.aoMapIntensity !== undefined) {
        stdMat.aoMapIntensity = updates.aoMapIntensity;
      }

      stdMat.needsUpdate = true;
    }

    this.callbacks.onSceneModified();
    this.notifyMaterialsChanged();
    this.notifyTexturesChanged();
    if (this.selectedObject) {
      const data = this.extractObjectData(this.selectedObject);
      this.callbacks.onTransformChange(data);
    }
  }

  public applyMaterialToObject(targetObjOrId: THREE.Object3D | string, materialId: string): boolean {
    const target = typeof targetObjOrId === 'string' ? this.findObjectByUuid(targetObjOrId) : targetObjOrId;
    if (!target) return false;

    let matToApply: THREE.Material | null = null;
    this.sceneObjectsGroup.traverse((child) => {
      if (!matToApply && (child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            if (m && (m.uuid === materialId || m.name === materialId)) {
              matToApply = m;
              break;
            }
          }
        }
      }
    });

    if (!matToApply) return false;

    target.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = matToApply!;
      }
    });

    this.callbacks.onSceneModified();
    this.notifyMaterialsChanged();
    if (this.selectedObject) {
      const data = this.extractObjectData(this.selectedObject);
      this.callbacks.onTransformChange(data);
    }
    return true;
  }

  public createCustomMaterial(nameOrConfig: string | Partial<MaterialConfig> = 'New Material', defaultColor = '#38bdf8'): MaterialConfig {
    const name = typeof nameOrConfig === 'string' ? nameOrConfig : (nameOrConfig.name || 'New Material');
    const color = typeof nameOrConfig === 'string' ? defaultColor : (nameOrConfig.color || defaultColor);
    const roughness = typeof nameOrConfig === 'object' && nameOrConfig.roughness !== undefined ? nameOrConfig.roughness : 0.35;
    const metalness = typeof nameOrConfig === 'object' && nameOrConfig.metalness !== undefined ? nameOrConfig.metalness : 0.2;

    const existing = this.getAllSceneMaterials();
    let uniqueName = name;
    let idx = 1;
    while (existing.some(m => m.name === uniqueName)) {
      uniqueName = `${name}_${idx++}`;
    }

    const newMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
      side: THREE.DoubleSide
    });
    newMat.name = uniqueName;
    newMat.userData = { materialId: newMat.uuid, sourceModel: 'Custom' };

    // If an object is selected and is a mesh, assign to it
    if (this.selectedObject) {
      this.selectedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = newMat;
        }
      });
    }

    this.callbacks.onSceneModified();
    this.notifyMaterialsChanged();
    return this.serializeMaterial(newMat, 1, 'Custom');
  }

  public duplicateMaterial(materialId: string): MaterialConfig | null {
    let sourceMat: THREE.Material | null = null;
    this.sceneObjectsGroup.traverse((child) => {
      if (!sourceMat && (child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            if (m && (m.uuid === materialId || m.name === materialId)) {
              sourceMat = m;
              break;
            }
          }
        }
      }
    });

    const src = sourceMat as any;
    if (!src) return null;

    const cloned = src.clone() as THREE.Material;
    cloned.name = `${src.name || 'Material'}_Copy`;
    cloned.userData = { ...(src.userData || {}), materialId: cloned.uuid };

    if (this.selectedObject) {
      this.selectedObject.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = cloned;
        }
      });
    }

    this.callbacks.onSceneModified();
    this.notifyMaterialsChanged();
    return this.serializeMaterial(cloned, 1, cloned.userData?.sourceModel);
  }

  public async applyTextureToMaterialId(materialId: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.textureLoader.load(
        url,
        (texture) => {
          texture.name = file.name;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;

          this.sceneObjectsGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.material) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                for (const m of mats) {
                  if (m && (m.uuid === materialId || m.name === materialId)) {
                    (m as any).map = texture;
                    m.needsUpdate = true;
                  }
                }
              }
            }
          });

          this.callbacks.onSceneModified();
          this.notifyMaterialsChanged();
          if (this.selectedObject) {
            const data = this.extractObjectData(this.selectedObject);
            this.callbacks.onTransformChange(data);
          }
          resolve(url);
        },
        undefined,
        (err) => {
          URL.revokeObjectURL(url);
          const msg = 'Failed to load texture: ' + (err as any)?.message;
          this.callbacks.onError(msg);
          reject(new Error(msg));
        }
      );
    });
  }

  public updateSelectedMaterial(updates: Partial<MaterialConfig>, specificMaterialId?: string) {
    if (!this.selectedObject) return;

    this.selectedObject.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            if (!mat) continue;
            if (specificMaterialId && mat.uuid !== specificMaterialId && mat.name !== specificMaterialId) {
              continue;
            }
            this.updateMaterialById(mat.uuid, updates);
          }
        }
      }
    });

    this.callbacks.onSceneModified();
    this.notifyMaterialsChanged();
    this.notifyTexturesChanged();
    const data = this.extractObjectData(this.selectedObject);
    this.callbacks.onTransformChange(data);
  }

  public updateSelectedLight(updates: Partial<{
    color: string;
    intensity: number;
    distance: number;
    decay: number;
    angle: number;
    penumbra: number;
    castShadow: boolean;
  }>) {
    if (!this.selectedObject || !(this.selectedObject as any).isLight) return;
    const light = this.selectedObject as any;

    if (updates.color !== undefined) light.color.set(updates.color);
    if (updates.intensity !== undefined) light.intensity = updates.intensity;
    if (updates.distance !== undefined && light.distance !== undefined) light.distance = updates.distance;
    if (updates.decay !== undefined && light.decay !== undefined) light.decay = updates.decay;
    if (updates.angle !== undefined && light.angle !== undefined) light.angle = THREE.MathUtils.degToRad(updates.angle);
    if (updates.penumbra !== undefined && light.penumbra !== undefined) light.penumbra = updates.penumbra;
    if (updates.castShadow !== undefined) light.castShadow = updates.castShadow;

    this.callbacks.onSceneModified();
    const data = this.extractObjectData(this.selectedObject);
    this.callbacks.onTransformChange(data);
  }

  public updateSelectedProperties(updates: {
    name?: string;
    visible?: boolean;
    castShadow?: boolean;
    receiveShadow?: boolean;
    locked?: boolean;
  }) {
    if (!this.selectedObject) return;

    if (updates.name !== undefined) this.selectedObject.name = updates.name;
    if (updates.visible !== undefined) this.selectedObject.visible = updates.visible;
    if (updates.locked !== undefined) this.selectedObject.userData.locked = updates.locked;
    if (updates.castShadow !== undefined) {
      this.selectedObject.castShadow = updates.castShadow;
      this.selectedObject.traverse(c => { (c as any).castShadow = updates.castShadow!; });
    }
    if (updates.receiveShadow !== undefined) {
      this.selectedObject.receiveShadow = updates.receiveShadow;
      this.selectedObject.traverse(c => { (c as any).receiveShadow = updates.receiveShadow!; });
    }

    this.callbacks.onSceneModified();
    const data = this.extractObjectData(this.selectedObject);
    this.callbacks.onTransformChange(data);
  }

  public updateSelectedScripts(scripts: any[]) {
    if (!this.selectedObject) return;
    this.selectedObject.userData.scripts = scripts;
    this.callbacks.onSceneModified();
    const data = this.extractObjectData(this.selectedObject);
    this.callbacks.onTransformChange(data);
  }

  // Extract Object metadata for UI
  public extractObjectData(obj: THREE.Object3D): SceneObjectData {
    const rotDeg: Vec3 = {
      x: THREE.MathUtils.radToDeg(obj.rotation.x),
      y: THREE.MathUtils.radToDeg(obj.rotation.y),
      z: THREE.MathUtils.radToDeg(obj.rotation.z)
    };

    const objectMaterials: MaterialConfig[] = [];
    const seenMatUuids = new Set<string>();

    const collectMat = (m: THREE.Material) => {
      if (!m || seenMatUuids.has(m.uuid)) return;
      seenMatUuids.add(m.uuid);
      objectMaterials.push(this.serializeMaterial(m, 1, obj.userData?.filename || obj.name));
    };

    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(collectMat);
        } else {
          collectMat(mesh.material);
        }
      }
    }

    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(collectMat);
          } else {
            collectMat(mesh.material);
          }
        }
      }
    });

    const materialData = objectMaterials.length > 0 ? objectMaterials[0] : undefined;

    let lightData = undefined;
    if ((obj as any).isLight) {
      const l = obj as any;
      lightData = {
        type: obj.userData.lightType || 'directional',
        color: '#' + l.color.getHexString(),
        intensity: l.intensity,
        distance: l.distance,
        decay: l.decay,
        angle: l.angle ? THREE.MathUtils.radToDeg(l.angle) : undefined,
        penumbra: l.penumbra,
        castShadow: l.castShadow
      };
    }

    const stats = this.calculateObjectStats(obj);
    const assetId = obj.userData.modelAssetId;
    const asset = assetId ? AssetManager.getInstance().getModel(assetId) : undefined;
    const folderLocation = obj.userData.folderLocation || asset?.folderLocation || obj.userData.fileLocation || obj.userData.assetPath;
    const filename = obj.userData.filename || asset?.filename || `${obj.name}.glb`;
    const fileSize = obj.userData.fileSize || asset?.fileSize;
    let hasMesh = !!(obj as any).isMesh;
    if (!hasMesh) {
      obj.traverse((c) => {
        if ((c as any).isMesh) hasMesh = true;
      });
    }
    const isModel = obj.userData.type === 'model' || !!obj.userData.modelAssetId || !!obj.userData.presetId || hasMesh;

    const modelMetadata = isModel ? {
      id: assetId || obj.uuid,
      name: obj.name,
      filename,
      folderLocation,
      fileLocation: folderLocation,
      sourceType: obj.userData.sourceType || (obj.userData.presetId ? 'preset' : 'local_file'),
      fileSize,
      triangleCount: stats.triangles,
      vertexCount: stats.vertices,
      meshCount: stats.meshes,
      presetId: obj.userData.presetId
    } : undefined;

    const isWater = obj.userData.type === 'water' || !!obj.userData.waterConfig;
    const waterConfig = isWater ? obj.userData.waterConfig : undefined;

    // Recursive child extraction for folders, groups, and layers import models
    const childList: SceneObjectData[] = [];
    if (obj.children && obj.children.length > 0) {
      for (const child of obj.children) {
        if (
          child.name === '__EDITOR_HELPERS__' ||
          (child as any).isHelper ||
          child.name === 'PlayerCamera' ||
          child.name === 'CharacterModel'
        ) {
          continue;
        }
        const childData = this.extractObjectData(child);
        childData.parentId = obj.uuid;
        childList.push(childData);
      }
    }

    return {
      id: obj.uuid,
      name: obj.name || (isWater ? 'Water' : 'Object'),
      type: isWater ? 'water' : (obj.userData.type || ((obj as any).isLight ? 'light' : (obj as any).isCamera ? 'camera' : 'mesh')),
      meshType: isWater ? 'water' : obj.userData.meshType,
      visible: obj.visible,
      locked: !!obj.userData.locked,
      castShadow: obj.castShadow,
      receiveShadow: obj.receiveShadow,
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: rotDeg,
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
      material: materialData,
      materials: objectMaterials,
      light: lightData,
      water: waterConfig,
      scripts: obj.userData.scripts || [],
      children: childList.length > 0 ? childList : undefined,
      modelAssetId: obj.userData.modelAssetId,
      modelUrl: obj.userData.assetPath,
      folderLocation,
      modelMetadata,
      userData: { ...obj.userData }
    };
  }

  // --- Folder & Hierarchy Re-parenting Management ---

  public createFolder(name = 'New Folder', parentId?: string): THREE.Object3D {
    const folder = new THREE.Group();
    folder.name = this.generateUniqueName(name);
    folder.userData = {
      type: 'group',
      isFolder: true
    };

    if (parentId) {
      const parent = this.findObjectByUuid(parentId);
      if (parent) {
        parent.add(folder);
      } else {
        this.sceneObjectsGroup.add(folder);
      }
    } else {
      this.sceneObjectsGroup.add(folder);
    }

    this.selectObject(folder);
    this.callbacks.onSceneModified();
    return folder;
  }

  public reparentObject(childId: string, parentId: string | null): boolean {
    const child = this.findObjectByUuid(childId);
    if (!child) return false;

    let targetParent: THREE.Object3D | null = null;
    if (parentId) {
      targetParent = this.findObjectByUuid(parentId);
    }
    if (!targetParent) {
      targetParent = this.sceneObjectsGroup;
    }

    // Prevent re-parenting to self or one of its own descendants
    if (targetParent === child) return false;
    let checkParent: THREE.Object3D | null = targetParent;
    while (checkParent) {
      if (checkParent === child) return false;
      checkParent = checkParent.parent;
    }

    if (child.parent === targetParent) return true;

    // Preserve exact world position, orientation, and scale
    const worldMatrix = child.matrixWorld.clone();
    targetParent.add(child);

    const parentInv = new THREE.Matrix4().copy(targetParent.matrixWorld).invert();
    const localMatrix = new THREE.Matrix4().multiplyMatrices(parentInv, worldMatrix);
    localMatrix.decompose(child.position, child.quaternion, child.scale);
    child.rotation.setFromQuaternion(child.quaternion);

    this.callbacks.onSceneModified();
    return true;
  }

  public ungroupFolder(folderId: string): boolean {
    const folder = this.findObjectByUuid(folderId);
    if (!folder) return false;

    const parent = folder.parent || this.sceneObjectsGroup;
    const childrenToMove = [...folder.children];

    childrenToMove.forEach((c) => {
      const worldMatrix = c.matrixWorld.clone();
      parent.add(c);
      const parentInv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
      const localMatrix = new THREE.Matrix4().multiplyMatrices(parentInv, worldMatrix);
      localMatrix.decompose(c.position, c.quaternion, c.scale);
      c.rotation.setFromQuaternion(c.quaternion);
    });

    parent.remove(folder);
    this.selectObject(null);
    this.callbacks.onSceneModified();
    return true;
  }

  // Play Mode logic
  public setVirtualKey(code: string, isDown: boolean) {
    this.keysPressed[code] = isDown;
  }

  // Play Mode logic
  public startPlayMode() {
    if (this.isPlayMode) return;
    this.isPlayMode = true;

    // Detach editor gizmo & helpers
    this.transformControls.detach();
    this.selectionBox.visible = false;
    this.gridHelper.visible = false;
    this.axesHelper.visible = false;

    // Save editor camera transform state and disable orbit controls
    this.prePlayCameraPos.copy(this.camera.position);
    this.prePlayCameraQuat.copy(this.camera.quaternion);
    this.prePlayOrbitTarget.copy(this.orbitControls.target);
    this.orbitControls.enabled = false;

    // Hide all supportive wires, camera helpers, light helpers, and gizmos during gameplay
    this.scene.traverse((obj) => {
      const name = (obj.name || '').toLowerCase();
      const type = (obj.type || '').toLowerCase();
      if (
        (obj as any).isCameraHelper ||
        (obj as any).isLightHelper ||
        (obj as any).isHelper ||
        (obj as any).isEditorOnly ||
        obj.userData?.isEditorOnly ||
        name.includes('helper') ||
        name.includes('gizmo') ||
        type.includes('helper')
      ) {
        obj.userData.__prePlayVisible = obj.visible;
        obj.visible = false;
      }
    });

    // Snapshot transforms of all scene objects so Stop can cleanly restore them
    this.prePlaySnapshot = [];
    this.sceneObjectsGroup.traverse((obj) => {
      this.prePlaySnapshot.push({
        id: obj.uuid,
        pos: obj.position.clone(),
        rot: obj.rotation.clone(),
        scale: obj.scale.clone()
      });
    });

    // Check if there's a player object to follow or possess
    const player = this.findPlayerObject();
    if (player) {
      const name = (player.name || '').toLowerCase();
      const controllerType = player.userData?.controllerType ||
        (name.includes('fpv') ? 'fpv' : name.includes('tpv') ? 'tpv' : name.includes('drone') ? 'drone' : 'fpv');

      // Ensure controllerType and characterConfig are set
      player.userData.isPlayerController = true;
      player.userData.controllerType = controllerType;
      if (!player.userData.characterConfig) {
        player.userData.characterConfig = getDefaultCharacterConfig(controllerType);
      }

      // Ensure camera is attached if missing
      if (!player.getObjectByName('PlayerCamera')) {
        const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.05, 1000);
        camera.name = 'PlayerCamera';
        camera.position.set(0, player.userData.characterConfig.eyeHeight || 1.65, 0);
        player.add(camera);
      }

      // IF FPV (First Person View): Hide player body & head meshes so First-Person Camera is completely clear and unblocked!
      if (controllerType === 'fpv') {
        player.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && child.name !== 'PlayerCamera') {
            child.userData.__prePlayMeshVisible = child.visible;
            child.visible = false;
          }
        });
      }

      // Snap camera directly to player camera position
      const playerCam = player.getObjectByName('PlayerCamera') as THREE.PerspectiveCamera | null;
      if (playerCam) {
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        playerCam.getWorldPosition(worldPos);
        playerCam.getWorldQuaternion(worldQuat);
        this.camera.position.copy(worldPos);
        this.camera.quaternion.copy(worldQuat);
      } else {
        this.camera.position.copy(player.position).add(new THREE.Vector3(0, 1.65, 0));
      }
    }

    // Focus canvas for immediate keyboard focus
    try {
      this.renderer.domElement.focus();
    } catch {
      // ignore
    }
  }

  public stopPlayMode() {
    if (!this.isPlayMode) return;
    this.isPlayMode = false;

    // Restore snapshots
    const map = new Map(this.prePlaySnapshot.map(s => [s.id, s]));
    this.sceneObjectsGroup.traverse((obj) => {
      const snap = map.get(obj.uuid);
      if (snap) {
        obj.position.copy(snap.pos);
        obj.rotation.copy(snap.rot);
        obj.scale.copy(snap.scale);
      }
    });

    // Restore all supportive wires, camera helpers, light helpers, gizmos, and player meshes
    this.scene.traverse((obj) => {
      if (obj.userData?.__prePlayVisible !== undefined) {
        obj.visible = obj.userData.__prePlayVisible;
        delete obj.userData.__prePlayVisible;
      }
      if (obj.userData?.__prePlayMeshVisible !== undefined) {
        obj.visible = obj.userData.__prePlayMeshVisible;
        delete obj.userData.__prePlayMeshVisible;
      }
    });

    // Restore editor orbit camera transform and re-enable controls
    this.orbitControls.enabled = true;
    this.camera.position.copy(this.prePlayCameraPos);
    this.camera.quaternion.copy(this.prePlayCameraQuat);
    this.orbitControls.target.copy(this.prePlayOrbitTarget);
    this.orbitControls.update();

    // Restore editor tools
    this.gridHelper.visible = true;
    this.axesHelper.visible = true;
    if (this.selectedObject) {
      this.transformControls.attach(this.selectedObject);
      this.updateSelectionBox();
      this.selectionBox.visible = true;
    }

    this.callbacks.onSceneModified();
  }

  public findPlayerObject(): THREE.Object3D | null {
    let player: THREE.Object3D | null = null;
    this.sceneObjectsGroup.traverse((obj) => {
      if (player) return;
      if (obj.userData?.isPlayerController || obj.userData?.type === 'characterController' || obj.userData?.controllerType) {
        player = obj;
        return;
      }
      const scripts = obj.userData?.scripts as any[];
      if (scripts?.some(s => s.type === 'playerController' && s.enabled)) {
        player = obj;
        return;
      }
      const name = (obj.name || '').toLowerCase();
      if (name.includes('fpv') || name.includes('tpv') || name.includes('drone') || name.includes('player')) {
        player = obj;
        return;
      }
    });

    if (!player && this.sceneObjectsGroup.children.length > 0) {
      const candidates = this.sceneObjectsGroup.children.filter(c => !(c as any).isLight && c.userData?.type !== 'water');
      player = candidates.find(c => c === this.selectedObject) || candidates[0] || null;
    }

    return player;
  }

  private updateGameLoop(deltaTime: number) {
    if (!this.isPlayMode || this.isPlayPaused) return;

    // 1. Process Character Controller
    const player = this.findPlayerObject();
    if (player) {
      const name = (player.name || '').toLowerCase();
      const isController = player.userData?.isPlayerController ||
        player.userData?.type === 'characterController' ||
        player.userData?.controllerType ||
        name.includes('fpv') || name.includes('tpv') || name.includes('drone') || name.includes('player');

      if (isController) {
        if (!player.userData.controllerType) {
          player.userData.controllerType = name.includes('tpv') ? 'tpv' : name.includes('drone') ? 'drone' : 'fpv';
        }
        if (!player.userData.characterConfig) {
          player.userData.characterConfig = getDefaultCharacterConfig(player.userData.controllerType);
        }

        // Run character physics, WASD movement, mouse look, jump, and head bobbing
        CharacterControllerSystem.updateController(
          player,
          deltaTime,
          this.keysPressed,
          this.mouseDelta,
          this.isPointerLocked || this.isPlayMode
        );

        // Reset frame mouse delta
        this.mouseDelta = { x: 0, y: 0 };

        // Synchronize engine viewport camera directly with player's active camera
        const playerCam = player.getObjectByName('PlayerCamera') as THREE.PerspectiveCamera | null;
        if (playerCam) {
          const worldPos = new THREE.Vector3();
          const worldQuat = new THREE.Quaternion();
          playerCam.getWorldPosition(worldPos);
          playerCam.getWorldQuaternion(worldQuat);

          this.camera.position.copy(worldPos);
          this.camera.quaternion.copy(worldQuat);
        } else {
          this.camera.position.copy(player.position).add(new THREE.Vector3(0, player.userData.characterConfig?.eyeHeight || 1.65, 0));
        }
      } else {
        // Fallback custom script movement
        const scripts = player.userData?.scripts as any[];
        const pScript = scripts?.find(s => s.type === 'playerController' && s.enabled);
        const speed = (pScript?.speed || 6) * deltaTime;
        const jumpForce = pScript?.jumpForce || 8;

        let moveX = 0;
        let moveZ = 0;

        if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) moveZ -= 1;
        if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) moveZ += 1;
        if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) moveX -= 1;
        if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) moveX += 1;

        if (moveX !== 0 || moveZ !== 0) {
          const moveVec = new THREE.Vector3(moveX, 0, moveZ).normalize().multiplyScalar(speed);
          player.position.add(moveVec);
          const angle = Math.atan2(moveX, moveZ);
          player.rotation.y = angle;
        }

        if (this.keysPressed['Space'] && this.isGrounded) {
          this.playerVelocityY = jumpForce;
          this.isGrounded = false;
        }

        const gravity = -20 * deltaTime;
        this.playerVelocityY += gravity;
        player.position.y += this.playerVelocityY * deltaTime;

        if (player.position.y <= 0.6) {
          player.position.y = 0.6;
          this.playerVelocityY = 0;
          this.isGrounded = true;
        }

        this.camera.position.copy(player.position).add(new THREE.Vector3(0, 1.65, 0));
      }
    }

    // 2. Rotators & Bouncers
    this.sceneObjectsGroup.traverse((obj) => {
      const scripts = obj.userData?.scripts as any[];
      if (!scripts) return;

      for (const s of scripts) {
        if (!s.enabled) continue;
        if (s.type === 'rotator') {
          const rx = THREE.MathUtils.degToRad(s.rotSpeed?.x || 0) * deltaTime;
          const ry = THREE.MathUtils.degToRad(s.rotSpeed?.y || 45) * deltaTime;
          const rz = THREE.MathUtils.degToRad(s.rotSpeed?.z || 0) * deltaTime;
          obj.rotation.x += rx;
          obj.rotation.y += ry;
          obj.rotation.z += rz;
        } else if (s.type === 'bouncer') {
          obj.position.y += Math.sin(performance.now() * 0.005) * 0.01;
        }
      }
    });
  }

  // Main Render Loop
  private startLoop() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      // Update Play Mode Game Runtime
      if (this.isPlayMode) {
        this.updateGameLoop(deltaTime);
      }

      // Animate Water Simulation Surfaces in both Editor and Play mode
      const elapsedSeconds = now * 0.001;
      const sunPos = this.sunLightHelper ? this.sunLightHelper.position : new THREE.Vector3(5, 10, 5);
      const sunCol = this.sunLightHelper ? this.sunLightHelper.color : new THREE.Color('#ffffff');
      const camPos = this.camera ? this.camera.position : new THREE.Vector3(0, 5, 10);

      this.sceneObjectsGroup.traverse((child) => {
        if (child.userData?.type === 'water') {
          WaterSystem.animateWater(child as THREE.Mesh, elapsedSeconds, sunPos, sunCol, camPos);
        }
      });

      // WASD / QE Viewport Camera Fly Navigation (Active when Right Mouse Button is held down)
      if (!this.isPlayMode && this.isRightMouseDown) {
        const moveSpeed = 15.0 * deltaTime; // Speed: 15 units per second
        const moveDir = new THREE.Vector3();
        
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        
        const right = new THREE.Vector3();
        right.crossVectors(forward, this.camera.up).normalize();

        if (this.keysPressed['KeyW'] || this.keysPressed['w']) {
          moveDir.add(forward);
        }
        if (this.keysPressed['KeyS'] || this.keysPressed['s']) {
          moveDir.addScaledVector(forward, -1);
        }
        if (this.keysPressed['KeyA'] || this.keysPressed['a']) {
          moveDir.addScaledVector(right, -1);
        }
        if (this.keysPressed['KeyD'] || this.keysPressed['d']) {
          moveDir.add(right);
        }
        if (this.keysPressed['KeyE'] || this.keysPressed['e']) {
          moveDir.y += 1.0;
        }
        if (this.keysPressed['KeyQ'] || this.keysPressed['q']) {
          moveDir.y -= 1.0;
        }

        if (moveDir.lengthSq() > 0) {
          const hasShift = this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight'] || this.keysPressed['Shift'] || this.keysPressed['shift'];
          const multiplier = hasShift ? 2.5 : 1.0;
          
          moveDir.normalize().multiplyScalar(moveSpeed * multiplier);
          
          this.camera.position.add(moveDir);
          this.orbitControls.target.add(moveDir);
        }
      }

      this.orbitControls.update();

      // Render
      this.renderer.render(this.scene, this.camera);

      // Render Camera View Picture-in-Picture Box if secondary canvas attached
      if (this.secondaryRenderer && this.secondaryCanvas) {
        this.renderCameraPreview();
      }

      // FPS & Stats update
      this.frameCount++;
      if (now - this.fpsLastUpdated >= 500) {
        const fps = Math.round((this.frameCount * 1000) / (now - this.fpsLastUpdated));
        const drawCalls = this.renderer.info.render.calls;
        const triangles = this.renderer.info.render.triangles;
        this.callbacks.onStatsUpdate({ fps, drawCalls, triangles });
        this.frameCount = 0;
        this.fpsLastUpdated = now;
      }
    };

    animate();
  }

  // Unique Name Generator
  public generateUniqueName(prefix: string): string {
    const existingNames = new Set<string>();
    this.sceneObjectsGroup.traverse((obj) => {
      if (obj.name) existingNames.add(obj.name);
    });

    if (!existingNames.has(prefix)) return prefix;

    let index = 1;
    while (existingNames.has(`${prefix}_${String(index).padStart(3, '0')}`)) {
      index++;
    }
    return `${prefix}_${String(index).padStart(3, '0')}`;
  }

  // Setup Initial Demo Scene (Req 30)
  public createInitialDemoScene() {
    // Clear any previous objects in group
    while (this.sceneObjectsGroup.children.length > 0) {
      const obj = this.sceneObjectsGroup.children[0];
      this.sceneObjectsGroup.remove(obj);
    }

    // 1. Directional Light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.name = 'Directional Light';
    dirLight.position.set(8, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const d = 12;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.normalBias = 0.03;
    dirLight.userData = { type: 'light', lightType: 'directional', scripts: [] };
    this.sceneObjectsGroup.add(dirLight);

    // 2. Ambient Light
    const ambLight = new THREE.AmbientLight(0xffffff, 0.45);
    ambLight.name = 'Ambient Light';
    ambLight.userData = { type: 'light', lightType: 'ambient', scripts: [] };
    this.sceneObjectsGroup.add(ambLight);

    // 3. Ground Plane
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.name = 'Ground';
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.userData = { type: 'mesh', meshType: 'plane', scripts: [] };
    this.sceneObjectsGroup.add(ground);

    // 4. Cube
    const cubeGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.25,
      metalness: 0.4
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.name = 'Cube';
    cube.position.set(-2.5, 0.7, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.userData = { type: 'mesh', meshType: 'cube', scripts: [] };
    this.sceneObjectsGroup.add(cube);

    // 5. Sphere
    const sphereGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.2,
      metalness: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.name = 'Sphere';
    sphere.position.set(2.5, 0.9, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphere.userData = { type: 'mesh', meshType: 'sphere', scripts: [] };
    this.sceneObjectsGroup.add(sphere);

    // 6. Player (Capsule with eyes & PlayerController script)
    const playerGroup = new THREE.Group();
    playerGroup.name = 'Player';
    playerGroup.position.set(0, 0.8, 1.5);
    playerGroup.userData = {
      type: 'mesh',
      meshType: 'capsule',
      scripts: [
        { type: 'playerController', enabled: true, speed: 6, jumpForce: 8 }
      ]
    };

    const capsuleGeo = new THREE.CapsuleGeometry(0.5, 0.8, 16, 24);
    const capsuleMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.2
    });
    const capsuleMesh = new THREE.Mesh(capsuleGeo, capsuleMat);
    capsuleMesh.castShadow = true;
    capsuleMesh.receiveShadow = true;
    playerGroup.add(capsuleMesh);

    // Cute visor eyes for the player
    const visorGeo = new THREE.BoxGeometry(0.55, 0.18, 0.35);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.35, 0.35);
    playerGroup.add(visor);

    this.sceneObjectsGroup.add(playerGroup);

    // Auto frame camera to nicely display initial demo scene
    this.camera.position.set(6, 5, 8);
    this.orbitControls.target.set(0, 1, 0);
    this.orbitControls.update();

    // Select Cube initially
    this.selectObject(cube);
    this.callbacks.onSceneModified();
    this.notifyMaterialsChanged();
  }

  public togglePausePlay() {
    this.isPlayPaused = !this.isPlayPaused;
    if (this.isPlayPaused) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } else {
      const canvas = this.renderer.domElement;
      canvas.requestPointerLock?.();
    }
  }

  // Cleanup
  public dispose() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    }
    window.removeEventListener('mouseup', this.onMouseUp);
    this.orbitControls.dispose();
    this.transformControls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
