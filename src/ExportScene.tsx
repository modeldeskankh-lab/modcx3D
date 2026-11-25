import React, { useState } from 'react';
import JSZip from 'jszip';
import { X, Download, AlertTriangle, CheckCircle2, Package, Layers, FolderTree, Code2 } from 'lucide-react';
import { EditorEngine } from './three/EditorEngine';
import { AssetManager } from './AssetManager';
import { SceneObjectData } from './types/editor';

interface ExportSceneProps {
  isOpen: boolean;
  onClose: () => void;
  engine: EditorEngine | null;
  defaultSceneName?: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ExportScene: React.FC<ExportSceneProps> = ({
  isOpen,
  onClose,
  engine,
  defaultSceneName = 'My Horror Scene',
  onShowToast
}) => {
  const [sceneName, setSceneName] = useState(defaultSceneName);
  const [version, setVersion] = useState('1.0');

  // Export Layout options
  const [exportLayout, setExportLayout] = useState<'visual_studio' | 'raw_assets'>('visual_studio');
  const [flatRoot, setFlatRoot] = useState(true);

  // Asset & Scene Options
  const [includeModels, setIncludeModels] = useState(true);
  const [includeTextures, setIncludeTextures] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [includeHierarchy, setIncludeHierarchy] = useState(true);
  const [includeTransforms, setIncludeTransforms] = useState(true);
  const [includeCameras, setIncludeCameras] = useState(true);
  const [includeLights, setIncludeLights] = useState(true);

  // Status
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportZip = async () => {
    if (!engine) {
      setErrorMessage('Editor engine is not ready');
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const assetManager = AssetManager.getInstance();
      const zip = new JSZip();
      const folderName = sceneName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'MyScene';
      
      // Determine root folder in zip
      const root = flatRoot ? zip : zip.folder(folderName);
      if (!root) {
        throw new Error('Failed to initialize ZIP directory');
      }

      // For Visual Studio layout, static assets go inside public/
      const isVS = exportLayout === 'visual_studio';
      const assetsBase = isVS ? root.folder('public') : root;
      if (!assetsBase) {
        throw new Error('Failed to create public/ assets directory');
      }

      // 1. Gather all objects from engine
      const sceneObjects: SceneObjectData[] = [];
      const objectsGroup = engine.sceneObjectsGroup;

      for (const child of objectsGroup.children) {
        if (child.name === '__EDITOR_HELPERS__') continue;
        sceneObjects.push(engine.extractObjectData(child));
      }

      // 2. VALIDATION
      const objectIdSet = new Set<string>();

      for (const obj of sceneObjects) {
        if (!obj.id) {
          throw new Error(`Object "${obj.name}" has no valid ID.`);
        }
        if (objectIdSet.has(obj.id)) {
          obj.id = `${obj.id}_${Math.random().toString(36).substring(2, 6)}`;
        }
        objectIdSet.add(obj.id);

        if (
          isNaN(obj.position.x) ||
          isNaN(obj.position.y) ||
          isNaN(obj.position.z) ||
          isNaN(obj.rotation.x) ||
          isNaN(obj.rotation.y) ||
          isNaN(obj.rotation.z) ||
          isNaN(obj.scale.x) ||
          isNaN(obj.scale.y) ||
          isNaN(obj.scale.z)
        ) {
          throw new Error(`Object "${obj.name}" contains invalid / NaN transform values.`);
        }

        if (obj.modelAssetId || obj.type === 'mesh' || obj.type === 'group') {
          const modelAssetPath = obj.userData?.assetPath;
          if (modelAssetPath) {
            const asset = assetManager.getModel(modelAssetPath);
            if (!asset && includeModels) {
              throw new Error(`Export failed\nMissing asset:\n${modelAssetPath}\nPlease re-import the asset and try again.`);
            }
          }
        }

        if (obj.material?.mapName) {
          const texName = obj.material.mapName;
          if (texName.startsWith('blob:')) {
            throw new Error(`Invalid temporary browser blob URL found for texture: ${texName}. Only permanent assets are exported.`);
          }
        }

        if (includeHierarchy && obj.parentId) {
          const parentExists = sceneObjects.some((o) => o.id === obj.parentId);
          if (!parentExists) {
            obj.parentId = undefined;
          }
        }
      }

      // 3. GENERATE MODELS FOLDER (inside public/models/ if VS layout)
      const modelsFolder = assetsBase.folder('models');
      const modelsManifest: { id: string; name: string; path: string; filename: string }[] = [];

      if (includeModels && modelsFolder) {
        const allModels = assetManager.getAllModels();
        for (const model of allModels) {
          modelsFolder.file(model.filename, model.data);
          modelsManifest.push({
            id: model.id,
            name: model.name,
            path: model.path,
            filename: model.filename
          });
        }

        for (const child of objectsGroup.children) {
          if (child.name === '__EDITOR_HELPERS__') continue;
          if ((child as any).isLight || (child as any).isCamera) continue;

          const existingPath = child.userData?.assetPath;
          const isAlreadyInManifest = existingPath && modelsManifest.some((m) => m.path === existingPath || m.path.endsWith(existingPath) || existingPath.endsWith(m.path));

          if (!isAlreadyInManifest) {
            try {
              const exported = await assetManager.exportObjectAsGLB(child, child.name || 'Object');
              modelsFolder.file(exported.filename, exported.data);
              child.userData.assetPath = exported.path;
              if (!modelsManifest.some((m) => m.id === exported.id)) {
                modelsManifest.push({
                  id: exported.id,
                  name: exported.name,
                  path: exported.path,
                  filename: exported.filename
                });
              }
            } catch (err) {
              console.warn(`Could not export object ${child.name} as GLB`, err);
            }
          }
        }
      }

      // 4. GENERATE TEXTURES & HDRI FOLDER (inside public/textures/ if VS layout)
      const texturesFolder = assetsBase.folder('textures');
      const texturesManifest: { id: string; name: string; path: string }[] = [];
      const hdrisManifest: { id: string; name: string; path: string; format: string }[] = [];

      if (includeTextures && texturesFolder) {
        const allTextures = assetManager.getAllTextures();
        for (const tex of allTextures) {
          texturesFolder.file(tex.filename, tex.data);
          texturesManifest.push({
            id: tex.id,
            name: tex.name,
            path: tex.path
          });
        }

        const allHdris = assetManager.getAllHDRIs();
        for (const hdri of allHdris) {
          texturesFolder.file(hdri.filename, hdri.data);
          hdrisManifest.push({
            id: hdri.id,
            name: hdri.name,
            path: hdri.path,
            format: hdri.format
          });
        }

        // Also check if current sky environment is HDRI and make sure its texture is present
        const currentSky = engine.environmentSettings.sky;
        if (currentSky.type === 'hdri' && currentSky.hdriName) {
          const matchingHdri = assetManager.getHDRI(currentSky.hdriName) || (currentSky.hdriUrl ? assetManager.getHDRI(currentSky.hdriUrl) : undefined);
          if (matchingHdri && !hdrisManifest.some((h) => h.id === matchingHdri.id)) {
            texturesFolder.file(matchingHdri.filename, matchingHdri.data);
            hdrisManifest.push({
              id: matchingHdri.id,
              name: matchingHdri.name,
              path: matchingHdri.path,
              format: matchingHdri.format
            });
          }
        }
      }

      // 5. GENERATE MATERIALS FOLDER (inside public/materials/materials.json)
      const materialsFolder = assetsBase.folder('materials');
      const materialsList: any[] = [];

      if (includeMaterials && materialsFolder) {
        for (const obj of sceneObjects) {
          if (obj.material) {
            const matId = `mat_${obj.name.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_')}`;
            let texturePath = null;
            if (obj.material.mapName) {
              const tex = assetManager.getTexture(obj.material.mapName);
              texturePath = tex ? tex.path : `textures/${obj.material.mapName}`;
            }

            materialsList.push({
              materialId: matId,
              objectName: obj.name,
              type: 'MeshStandardMaterial',
              color: obj.material.color,
              metalness: obj.material.metalness,
              roughness: obj.material.roughness,
              texture: texturePath,
              transparent: !!obj.material.transparent,
              opacity: obj.material.opacity,
              wireframe: !!obj.material.wireframe
            });
          }
        }
        materialsFolder.file('materials.json', JSON.stringify(materialsList, null, 2));
      }

      // 6. GENERATE SCENE.JSON (inside public/scene.json)
      const exportedObjects = sceneObjects
        .filter((obj) => {
          if (!includeCameras && obj.type === 'camera') return false;
          if (!includeLights && obj.type === 'light') return false;
          return true;
        })
        .map((obj) => {
          const rotRad = [
            (obj.rotation.x * Math.PI) / 180,
            (obj.rotation.y * Math.PI) / 180,
            (obj.rotation.z * Math.PI) / 180
          ];

          let assetPath: string | null = obj.userData?.assetPath || obj.modelUrl || null;
          if (assetPath) {
            // Find exact casing from modelsManifest
            const matched = modelsManifest.find(
              (m) =>
                m.path === assetPath ||
                m.path.toLowerCase() === assetPath!.toLowerCase() ||
                m.id === obj.userData?.modelAssetId ||
                m.filename === assetPath ||
                m.name.toLowerCase() === obj.name.toLowerCase()
            );
            if (matched) {
              assetPath = matched.path;
            }
          } else if (obj.type === 'model' || obj.userData?.type === 'model') {
            const matched = modelsManifest.find(
              (m) =>
                m.name.toLowerCase() === obj.name.toLowerCase() ||
                m.id.toLowerCase() === obj.name.toLowerCase()
            );
            if (matched) {
              assetPath = matched.path;
            } else {
              assetPath = `models/${obj.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.glb`;
            }
          }

          const isLight = obj.type === 'light';
          const isCamera = obj.type === 'camera';
          const isModel = !isLight && !isCamera && (!!assetPath || obj.type === 'model' || obj.userData?.type === 'model');

          const baseObj: any = {
            id: obj.id,
            name: obj.name,
            type: isLight
              ? `${obj.light?.type ? obj.light.type.charAt(0).toUpperCase() + obj.light.type.slice(1) : 'Directional'}Light`
              : isCamera
              ? 'PerspectiveCamera'
              : isModel
              ? 'GLB'
              : 'Mesh',
            meshType: !isLight && !isCamera && !isModel ? (obj.meshType || obj.userData?.meshType || 'cube') : undefined,
            asset: isModel ? assetPath : null,
            material: obj.material ? {
              color: obj.material.color,
              roughness: obj.material.roughness,
              metalness: obj.material.metalness,
              opacity: obj.material.opacity,
              transparent: !!obj.material.transparent,
              wireframe: !!obj.material.wireframe
            } : undefined
          };

          if (includeTransforms) {
            baseObj.transform = {
              position: [obj.position.x, obj.position.y, obj.position.z],
              rotation: rotRad,
              scale: [obj.scale.x, obj.scale.y, obj.scale.z]
            };
          }

          if (includeHierarchy) {
            baseObj.parent = obj.parentId || null;
          }

          baseObj.visible = obj.visible;
          baseObj.castShadow = !!obj.castShadow;
          baseObj.receiveShadow = !!obj.receiveShadow;

          if (obj.type === 'light' && obj.light && includeLights) {
            baseObj.color = obj.light.color;
            baseObj.intensity = obj.light.intensity;
            if (obj.light.distance) baseObj.distance = obj.light.distance;
          }

          if (obj.type === 'camera' && includeCameras) {
            baseObj.fov = 60;
            baseObj.near = 0.1;
            baseObj.far = 2000;
          }

          return baseObj;
        });

      const envSettings = engine.getEnvironmentSettings();
      const sceneJsonData = {
        version: 1,
        sceneName: sceneName.trim(),
        environment: envSettings,
        objects: exportedObjects
      };

      assetsBase.file('scene.json', JSON.stringify(sceneJsonData, null, 2));

      // 7. GENERATE PROJECT.JSON
      const projectJsonData = {
        name: sceneName.trim(),
        version: `${version}.0`,
        type: '3D Scene',
        format: 'Clikk Scene',
        sceneFile: isVS ? 'public/scene.json' : 'scene.json'
      };
      assetsBase.file('project.json', JSON.stringify(projectJsonData, null, 2));

      // 8. GENERATE ASSETS.JSON
      const assetsJsonData = {
        models: modelsManifest,
        textures: texturesManifest,
        hdris: hdrisManifest
      };
      assetsBase.file('assets.json', JSON.stringify(assetsJsonData, null, 2));

      // 9. IF VISUAL STUDIO LAYOUT: GENERATE SRC/ FOLDER WITH SCRIPTS & ROOT FILES!
      if (isVS) {
        const srcFolder = root.folder('src');
        if (srcFolder) {
          const componentsFolder = srcFolder.folder('components');
          const servicesFolder = srcFolder.folder('services');

          // src/types.ts
          srcFolder.file('types.ts', `export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MaterialDef {
  materialId: string;
  objectName: string;
  type: string;
  color: string;
  metalness: number;
  roughness: number;
  texture?: string | null;
  transparent?: boolean;
  opacity?: number;
  wireframe?: boolean;
}

export interface SceneObjectDef {
  id: string;
  name: string;
  type: string;
  meshType?: string;
  asset?: string | null;
  material?: {
    color?: string;
    roughness?: number;
    metalness?: number;
    opacity?: number;
    transparent?: boolean;
    wireframe?: boolean;
  };
  transform?: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  parent?: string | null;
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  color?: string;
  intensity?: number;
  distance?: number;
  fov?: number;
  near?: number;
  far?: number;
}

export interface SceneData {
  version: number;
  sceneName: string;
  environment?: any;
  objects: SceneObjectDef[];
}
`);

          // src/services/SceneLoader.ts
          if (servicesFolder) {
            servicesFolder.file('SceneLoader.ts', `import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { SceneData, SceneObjectDef, MaterialDef } from '../types';

export interface LoadedSceneResult {
  sceneData: SceneData;
  objectsMap: Map<string, THREE.Object3D>;
  camera: THREE.PerspectiveCamera | null;
  lights: THREE.Light[];
  sceneRoot: THREE.Group;
}

export class SceneLoader {
  private gltfLoader = new GLTFLoader();
  private textureLoader = new THREE.TextureLoader();
  private rgbeLoader = new RGBELoader();
  private exrLoader = new EXRLoader();
  private materialsMap = new Map<string, THREE.Material>();
  private knownAssets: { id: string; name: string; path: string }[] = [];
  private knownHdris: { id: string; name: string; path: string; format?: string; filename?: string }[] = [];

  public async loadAssetsManifest(): Promise<void> {
    const urls = ['/assets.json', './assets.json', 'assets.json'];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models)) {
            this.knownAssets = data.models;
          }
          if (Array.isArray(data.hdris)) {
            this.knownHdris = data.hdris;
          }
          return;
        }
      } catch {
        // try next
      }
    }
  }

  public async applyEnvironment(environmentData: any, targetScene: THREE.Scene): Promise<void> {
    if (!environmentData) return;
    const sky = environmentData.sky;
    const fog = environmentData.fog;

    // Fog Setup
    if (fog) {
      if (fog.type === 'exp2') {
        targetScene.fog = new THREE.FogExp2(new THREE.Color(fog.color || '#13151b'), fog.density ?? 0.015);
      } else if (fog.type === 'linear') {
        targetScene.fog = new THREE.Fog(new THREE.Color(fog.color || '#13151b'), fog.near ?? 10, fog.far ?? 100);
      } else if (fog.type === 'none') {
        targetScene.fog = null;
      }
    }

    // Sky & Environment Setup
    if (!sky) return;

    if (sky.type === 'hdri') {
      let hdriPath = sky.hdriUrl || sky.hdriName || '';
      const candidates: string[] = [];
      if (hdriPath) {
        const clean = hdriPath.replace(/^\\/+/, '');
        candidates.push(hdriPath, \`/\${clean}\`, \`./\${clean}\`);
        if (!clean.startsWith('textures/')) {
          candidates.push(\`textures/\${clean}\`, \`/textures/\${clean}\`, \`./textures/\${clean}\`);
        }
      }

      for (const hEntry of this.knownHdris) {
        if (hEntry.filename) {
          candidates.push(\`textures/\${hEntry.filename}\`, \`/textures/\${hEntry.filename}\`, \`./textures/\${hEntry.filename}\`);
        }
        if (hEntry.path) {
          const clean = hEntry.path.replace(/^\\/+/, '');
          candidates.push(hEntry.path, \`/\${clean}\`, \`./\${clean}\`);
        }
      }

      const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);

      let loadedTexture: THREE.Texture | null = null;
      for (const url of uniqueCandidates) {
        try {
          const isHdr = url.toLowerCase().endsWith('.hdr');
          const isExr = url.toLowerCase().endsWith('.exr');

          if (isHdr) {
            loadedTexture = await new Promise<THREE.Texture>((resolve, reject) => {
              this.rgbeLoader.load(url, resolve, undefined, reject);
            });
          } else if (isExr) {
            loadedTexture = await new Promise<THREE.Texture>((resolve, reject) => {
              this.exrLoader.load(url, resolve, undefined, reject);
            });
          } else {
            loadedTexture = await new Promise<THREE.Texture>((resolve, reject) => {
              this.textureLoader.load(url, resolve, undefined, reject);
            });
          }

          if (loadedTexture) {
            loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
            loadedTexture.colorSpace = THREE.SRGBColorSpace;
            break;
          }
        } catch {
          // try next
        }
      }

      if (loadedTexture) {
        targetScene.background = loadedTexture;
        targetScene.environment = loadedTexture;
      } else if (sky.color) {
        targetScene.background = new THREE.Color(sky.color);
      }
    } else if (sky.type === 'color') {
      targetScene.background = new THREE.Color(sky.color || '#c0c0c0');
      targetScene.environment = null;
    } else if (sky.type === 'gradient') {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, sky.topColor || '#1e293b');
        grad.addColorStop(1, sky.bottomColor || '#0a0d14');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 512);
        const gradTex = new THREE.CanvasTexture(canvas);
        gradTex.mapping = THREE.EquirectangularReflectionMapping;
        gradTex.colorSpace = THREE.SRGBColorSpace;
        gradTex.needsUpdate = true;
        targetScene.background = gradTex;
        targetScene.environment = gradTex;
      }
    } else {
      targetScene.background = new THREE.Color(sky.color || '#c0c0c0');
    }
  }

  public async loadMaterials(materialsUrl = '/materials/materials.json'): Promise<Map<string, THREE.Material>> {
    const urls = [materialsUrl, './materials/materials.json', 'materials/materials.json'];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const materialsList: MaterialDef[] = await res.json();

        for (const matDef of materialsList) {
          let mapTexture: THREE.Texture | undefined;
          if (matDef.texture) {
            const texUrls = [
              matDef.texture,
              matDef.texture.startsWith('/') ? matDef.texture : \`/\${matDef.texture}\`,
              \`./\${matDef.texture.replace(/^\\/+/, '')}\`
            ];
            for (const tUrl of texUrls) {
              try {
                mapTexture = await new Promise<THREE.Texture>((resolve, reject) => {
                  this.textureLoader.load(tUrl, resolve, undefined, reject);
                });
                if (mapTexture) break;
              } catch {
                // next candidate
              }
            }
          }

          const material = new THREE.MeshStandardMaterial({
            color: matDef.color,
            metalness: matDef.metalness ?? 0.1,
            roughness: matDef.roughness ?? 0.8,
            map: mapTexture,
            transparent: !!matDef.transparent,
            opacity: matDef.opacity ?? 1,
            wireframe: !!matDef.wireframe,
            side: THREE.DoubleSide
          });

          this.materialsMap.set(matDef.objectName, material);
          this.materialsMap.set(matDef.materialId, material);
        }
        return this.materialsMap;
      } catch (err) {
        // continue
      }
    }
    return this.materialsMap;
  }

  private async loadGLTFAsset(assetPath: string, objectName: string): Promise<THREE.Object3D | null> {
    const cleanPath = assetPath ? assetPath.replace(/^\\/+/, '') : '';
    const candidates: string[] = [];

    if (assetPath) {
      candidates.push(assetPath);
      candidates.push(\`/\${cleanPath}\`);
      candidates.push(\`./\${cleanPath}\`);
    }

    // Match from known assets manifest
    if (this.knownAssets.length > 0) {
      const match = this.knownAssets.find(
        (a) =>
          a.path === assetPath ||
          a.path.toLowerCase() === cleanPath.toLowerCase() ||
          a.id.toLowerCase() === objectName.toLowerCase() ||
          a.name.toLowerCase() === objectName.toLowerCase() ||
          a.path.toLowerCase().endsWith(cleanPath.toLowerCase())
      );
      if (match) {
        const p = match.path.replace(/^\\/+/, '');
        candidates.push(match.path, \`/\${p}\`, \`./\${p}\`);
      }
    }

    // Generic name-based fallbacks
    if (objectName) {
      candidates.push(\`models/\${objectName}.glb\`, \`/models/\${objectName}.glb\`, \`./models/\${objectName}.glb\`);
      candidates.push(\`models/\${objectName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}.glb\`);
      candidates.push(\`/models/\${objectName.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_')}.glb\`);
    }

    // Deduplicate
    const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);

    for (const url of uniqueCandidates) {
      try {
        const gltf = await new Promise<any>((resolve, reject) => {
          this.gltfLoader.load(url, resolve, undefined, reject);
        });
        if (gltf && gltf.scene) {
          const model = gltf.scene;
          model.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              m.castShadow = true;
              m.receiveShadow = true;
              if (m.material) {
                if (Array.isArray(m.material)) {
                  m.material.forEach((mat) => {
                    mat.side = THREE.DoubleSide;
                    mat.needsUpdate = true;
                  });
                } else {
                  m.material.side = THREE.DoubleSide;
                  m.material.needsUpdate = true;
                }
              }
            }
          });
          return model;
        }
      } catch {
        // Try next candidate
      }
    }
    return null;
  }

  public async loadScene(
    sceneJsonUrl = '/scene.json',
    targetScene: THREE.Scene
  ): Promise<LoadedSceneResult> {
    await this.loadAssetsManifest();
    await this.loadMaterials('/materials/materials.json');

    const sceneUrls = [sceneJsonUrl, './scene.json', 'scene.json'];
    let sceneData: SceneData | null = null;

    for (const url of sceneUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          sceneData = await res.json();
          break;
        }
      } catch {
        // try next
      }
    }

    if (!sceneData) {
      throw new Error(\`Failed to load scene file from \${sceneJsonUrl}\`);
    }

    await this.applyEnvironment(sceneData.environment, targetScene);

    const objectsMap = new Map<string, THREE.Object3D>();
    const lights: THREE.Light[] = [];
    const sceneRoot = new THREE.Group();
    sceneRoot.name = '__SCENE_ROOT__';
    targetScene.add(sceneRoot);

    let primaryCamera: THREE.PerspectiveCamera | null = null;

    // Load each object asynchronously and await all models
    const objectPromises = sceneData.objects.map(async (objDef) => {
      let threeObj: THREE.Object3D;

      if (objDef.type.includes('Light')) {
        const color = new THREE.Color(objDef.color || '#ffffff');
        const intensity = objDef.intensity ?? 1;

        if (objDef.type === 'DirectionalLight') {
          const light = new THREE.DirectionalLight(color, intensity);
          light.castShadow = !!objDef.castShadow;
          if (light.castShadow) {
            light.shadow.mapSize.width = 2048;
            light.shadow.mapSize.height = 2048;
            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = 500;
          }
          threeObj = light;
          lights.push(light);
        } else if (objDef.type === 'PointLight') {
          const light = new THREE.PointLight(color, intensity, objDef.distance || 50);
          light.castShadow = !!objDef.castShadow;
          threeObj = light;
          lights.push(light);
        } else if (objDef.type === 'SpotLight') {
          const light = new THREE.SpotLight(color, intensity);
          light.castShadow = !!objDef.castShadow;
          threeObj = light;
          lights.push(light);
        } else {
          const light = new THREE.AmbientLight(color, intensity);
          threeObj = light;
          lights.push(light);
        }
      } else if (objDef.type === 'PerspectiveCamera' || objDef.type === 'Camera') {
        const cam = new THREE.PerspectiveCamera(
          objDef.fov || 60,
          window.innerWidth / window.innerHeight,
          objDef.near || 0.1,
          objDef.far || 2000
        );
        threeObj = cam;
        if (!primaryCamera) primaryCamera = cam;
      } else {
        const group = new THREE.Group();
        threeObj = group;

        const isGLB = objDef.type === 'GLB' || !!objDef.asset;
        if (isGLB && (objDef.asset || objDef.name)) {
          const model = await this.loadGLTFAsset(objDef.asset || '', objDef.name);
          if (model) {
            group.add(model);
          } else {
            console.warn(\`[SceneLoader] Fallback mesh created for: \${objDef.name} (Asset: \${objDef.asset})\`);
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = this.materialsMap.get(objDef.name) || new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.6 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = !!objDef.castShadow;
            mesh.receiveShadow = !!objDef.receiveShadow;
            group.add(mesh);
          }
        } else {
          // Primitive geometry
          let geo: THREE.BufferGeometry;
          const meshType = (objDef.meshType || 'cube').toLowerCase();
          switch (meshType) {
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
              geo = new THREE.PlaneGeometry(10, 10);
              break;
            case 'ground':
              geo = new THREE.PlaneGeometry(60, 60);
              geo.rotateX(-Math.PI / 2);
              break;
            case 'torus':
              geo = new THREE.TorusGeometry(0.7, 0.25, 16, 48);
              break;
            case 'capsule':
              geo = new THREE.CapsuleGeometry(0.4, 0.8, 16, 24);
              break;
            case 'cube':
            default:
              geo = new THREE.BoxGeometry(1, 1, 1);
              break;
          }

          let mat: THREE.Material = this.materialsMap.get(objDef.name) as THREE.Material;
          if (!mat && objDef.material) {
            mat = new THREE.MeshStandardMaterial({
              color: objDef.material.color || '#94a3b8',
              roughness: objDef.material.roughness ?? 0.6,
              metalness: objDef.material.metalness ?? 0.1,
              opacity: objDef.material.opacity ?? 1,
              transparent: !!objDef.material.transparent,
              wireframe: !!objDef.material.wireframe,
              side: THREE.DoubleSide
            });
          }
          if (!mat) {
            mat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
          }

          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = !!objDef.castShadow;
          mesh.receiveShadow = !!objDef.receiveShadow;
          group.add(mesh);
        }
      }

      threeObj.name = objDef.name;
      threeObj.visible = objDef.visible !== false;

      if (objDef.transform) {
        threeObj.position.set(objDef.transform.position[0], objDef.transform.position[1], objDef.transform.position[2]);
        threeObj.rotation.set(objDef.transform.rotation[0], objDef.transform.rotation[1], objDef.transform.rotation[2]);
        threeObj.scale.set(objDef.transform.scale[0], objDef.transform.scale[1], objDef.transform.scale[2]);
      }

      objectsMap.set(objDef.id, threeObj);
    });

    await Promise.all(objectPromises);

    // Second pass: Link Parent-Child Hierarchy
    for (const objDef of sceneData.objects) {
      const child = objectsMap.get(objDef.id);
      if (!child) continue;

      if (objDef.parent && objectsMap.has(objDef.parent)) {
        const parent = objectsMap.get(objDef.parent);
        parent?.add(child);
      } else {
        sceneRoot.add(child);
      }
    }

    return { sceneData, objectsMap, camera: primaryCamera, lights, sceneRoot };
  }
}
`);

            // src/services/GameScripts.ts
            servicesFolder.file('GameScripts.ts', `import * as THREE from 'three';

export interface GameScript {
  update: (delta: number) => void;
  destroy?: () => void;
}

/**
 * Rotator Script: Continuously rotates an object around its axes
 */
export function attachRotator(object: THREE.Object3D, speed: { x?: number; y?: number; z?: number } = { y: 1 }): GameScript {
  return {
    update: (delta: number) => {
      if (speed.x) object.rotation.x += speed.x * delta;
      if (speed.y) object.rotation.y += speed.y * delta;
      if (speed.z) object.rotation.z += speed.z * delta;
    }
  };
}

/**
 * Bobber Script: Adds gentle floating sinusoidal oscillation
 */
export function attachBobber(object: THREE.Object3D, amplitude = 0.5, frequency = 2): GameScript {
  const initialY = object.position.y;
  let elapsed = 0;
  return {
    update: (delta: number) => {
      elapsed += delta;
      object.position.y = initialY + Math.sin(elapsed * frequency) * amplitude;
    }
  };
}

/**
 * Basic First-Person / Keyboard Controller (WASD + Space)
 */
export function createKeyboardController(camera: THREE.Camera, domElement: HTMLElement) {
  const keys: Record<string, boolean> = {};
  const moveSpeed = 8.0;

  const onKeyDown = (e: KeyboardEvent) => {
    keys[e.code] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  return {
    update: (delta: number) => {
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, camera.up).normalize();

      if (keys['KeyW'] || keys['ArrowUp']) camera.position.addScaledVector(forward, moveSpeed * delta);
      if (keys['KeyS'] || keys['ArrowDown']) camera.position.addScaledVector(forward, -moveSpeed * delta);
      if (keys['KeyD'] || keys['ArrowRight']) camera.position.addScaledVector(right, moveSpeed * delta);
      if (keys['KeyA'] || keys['ArrowLeft']) camera.position.addScaledVector(right, -moveSpeed * delta);
      if (keys['Space']) camera.position.y += moveSpeed * delta;
      if (keys['ShiftLeft']) camera.position.y -= moveSpeed * delta;
    },
    destroy: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    }
  };
}
`);
          }

          // src/components/SceneViewer.tsx
          if (componentsFolder) {
            componentsFolder.file('SceneViewer.tsx', `import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneLoader, LoadedSceneResult } from '../services/SceneLoader';
import { createKeyboardController, GameScript } from '../services/GameScripts';

export const SceneViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sceneResult, setSceneResult] = useState<LoadedSceneResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(60);
  const [loading, setLoading] = useState(true);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d1117');
    scene.fog = new THREE.FogExp2('#0d1117', 0.015);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 2000);
    camera.position.set(0, 8, 16);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // Studio Lighting Fallback
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.8);
    dirLight.position.set(12, 20, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight('#60a5fa', '#1e293b', 0.5);
    scene.add(hemiLight);

    // 3. Load Exported Scene Data
    const loader = new SceneLoader();
    let scripts: GameScript[] = [];
    let keyboardCtrl = createKeyboardController(camera, renderer.domElement);

    loader
      .loadScene('/scene.json', scene)
      .then((res) => {
        setSceneResult(res);
        if (res.camera) {
          camera.copy(res.camera);
        } else {
          // Auto-frame camera to loaded scene objects
          const box = new THREE.Box3().setFromObject(res.sceneRoot);
          if (!box.isEmpty() && isFinite(box.min.x)) {
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0 && maxDim < 5000) {
              controls.target.copy(center);
              const dist = Math.max(maxDim * 1.8, 4);
              camera.position.set(center.x, center.y + Math.max(size.y * 0.5, 1.2), center.z + dist);
              controls.update();
            }
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load scene in Visual Studio Viewer:', err);
        setLoading(false);
      });

    // 4. Animation Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // FPS Calculation
      frameCount++;
      if (now - lastFpsUpdate >= 500) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      keyboardCtrl.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 5. Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      keyboardCtrl.destroy();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 8, 16);
    controlsRef.current.target.set(0, 2, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d1117] font-sans select-none">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 text-white">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium tracking-wide">Loading Scene Assets...</p>
        </div>
      )}
    </div>
  );
};
`);
          }

          // src/App.tsx
          srcFolder.file('App.tsx', `import React from 'react';
import { SceneViewer } from './components/SceneViewer';

export default function App() {
  return <SceneViewer />;
}
`);

          // src/main.tsx
          srcFolder.file('main.tsx', `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

          // src/index.css
          srcFolder.file('index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #0d1117;
  color: #f3f4f6;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
`);
        }

        // Root Files for Visual Studio Project:
        // package.json
        root.file('package.json', JSON.stringify({
          name: folderName.toLowerCase().replace(/_/g, '-'),
          private: true,
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview'
          },
          dependencies: {
            'lucide-react': '^0.468.0',
            'react': '^18.3.1',
            'react-dom': '^18.3.1',
            'three': '^0.160.0'
          },
          devDependencies: {
            '@types/react': '^18.3.3',
            '@types/react-dom': '^18.3.0',
            '@types/three': '^0.160.0',
            '@vitejs/plugin-react': '^4.3.0',
            'autoprefixer': '^10.4.19',
            'postcss': '^8.4.38',
            'tailwindcss': '^3.4.4',
            'typescript': '^5.4.5',
            'vite': '^5.3.1'
          }
        }, null, 2));

        // postcss.config.js
        root.file('postcss.config.js', `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

        // tailwind.config.js
        root.file('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`);

        // index.html
        root.file('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${sceneName.trim()}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="bg-[#0d1117] text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

        // vite.config.ts
        root.file('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});
`);

        // tsconfig.json
        root.file('tsconfig.json', JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: false,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true
          },
          include: ['src']
        }, null, 2));

        // .gitignore
        root.file('.gitignore', `# Logs
logs
*.log
npm-debug.log*

# Dependency directories
node_modules/
dist/
dist-ssr/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`);

        // .env.example
        root.file('.env.example', `# Visual Studio Environment Configuration
VITE_APP_TITLE="${sceneName.trim()}"
`);

        // metadata.json
        root.file('metadata.json', JSON.stringify({
          name: sceneName.trim(),
          description: `Visual Studio project export for ${sceneName.trim()} with 3D scene runtime`,
          version: '1.0.0'
        }, null, 2));
      }

      // 10. GENERATE README.MD
      const readmeText = `# ${sceneName.trim()} — Visual Studio 3D Project

Exported directly from the **3D Scene Designer** for **Visual Studio** / **VS Code**.

## Directory Layout (Direct Visual Studio Support)
\`\`\`
${folderName}/
├── public/                 <-- STATIC ASSETS (Served directly at runtime)
│   ├── models/            <-- Binary .glb 3D models from your scene
│   ├── textures/          <-- Texture images (.png)
│   ├── materials/
│   │   └── materials.json <-- Material definitions (PBR, roughness, color, texture maps)
│   ├── scene.json         <-- Complete scene hierarchy, transforms, lights, and cameras
│   ├── assets.json        <-- Catalog of model & texture paths
│   └── project.json       <-- Project manifest
├── src/                    <-- GAME SCRIPTS & SOURCE CODE
│   ├── components/
│   │   ├── SceneViewer.tsx <-- Interactive Three.js viewport with OrbitControls & dynamic lighting
│   │   └── GameHUD.tsx     <-- In-game HUD overlay (object stats, camera switch, controls)
│   ├── services/
│   │   ├── SceneLoader.ts  <-- Production Three.js loader parsing /scene.json & GLBs
│   │   └── GameScripts.ts  <-- Player WASD controller, rotators, and game behaviors
│   ├── App.tsx             <-- Main React application
│   ├── main.tsx            <-- Entry point
│   ├── types.ts            <-- TypeScript type definitions
│   └── index.css           <-- Styling for canvas and HUD
├── package.json            <-- Visual Studio npm configuration
├── tailwind.config.js      <-- Tailwind CSS configuration
├── postcss.config.js       <-- PostCSS configuration
├── vite.config.ts          <-- Vite development server configuration
├── tsconfig.json           <-- TypeScript build configuration
├── index.html              <-- HTML mounting document
└── README.md               <-- Documentation and instructions
\`\`\`

---

## Quick Start (Run immediately in Visual Studio / VS Code):

1. Open the project folder in **Visual Studio** or **VS Code**.
2. Open the built-in terminal (\`Ctrl + \`\` or **Terminal -> New Terminal**).
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Launch the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open your browser at the displayed local URL (typically \`http://localhost:3000\`).

---

## How to Add Your Game Logic:

- **Scene Assets in \`public/\`**: You can replace or add new \`.glb\` models into \`public/models/\` or textures into \`public/textures/\`.
- **Game Scripts in \`src/services/GameScripts.ts\`**: Implement your game rules, collision handlers, audio sound effects, enemy AI, or character state machines.
- **Scene Loader in \`src/services/SceneLoader.ts\`**: Extend how lights, physics rigidbodies, or shaders are applied when \`scene.json\` is parsed.
`;
      root.file('README.md', readmeText);

      // 11. GENERATE ZIP BLOB & DOWNLOAD
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${folderName}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);

      onShowToast(`Exported ${folderName}.zip with Visual Studio layout!`, 'success');
      onClose();
    } catch (err: any) {
      console.error('Export failed:', err);
      setErrorMessage(err.message || 'Failed to generate ZIP archive.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#333842] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-xs text-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#15171d] border-b border-[#282b33] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={17} className="text-cyan-400" />
            <span className="font-semibold text-white text-sm">Export Scene for Visual Studio</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#282c35] rounded text-gray-400 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Scene Name */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-gray-400 font-medium">Scene Name</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="e.g. My Horror Scene"
                className="w-full bg-[#101216] border border-[#2d313b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-400 font-medium">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
                className="w-full bg-[#101216] border border-[#2d313b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>

          {/* Project Layout Selector */}
          <div className="space-y-2 pt-1 border-t border-[#282b33]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <FolderTree size={13} className="text-cyan-400" />
                Folder Layout Architecture
              </span>
              <span className="text-[10px] text-cyan-400 font-medium">Visual Studio Ready</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportLayout('visual_studio')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  exportLayout === 'visual_studio'
                    ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-md'
                    : 'bg-[#12141a] border-[#282c35] text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white mb-1">
                  <Code2 size={14} className="text-cyan-400" />
                  Visual Studio Project
                </div>
                <div className="text-[10px] leading-relaxed text-gray-400">
                  <strong className="text-gray-300">public/</strong> (models, textures, scene.json) + <strong className="text-gray-300">src/</strong> (scripts, loader, viewer) + package.json
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportLayout('raw_assets')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  exportLayout === 'raw_assets'
                    ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-md'
                    : 'bg-[#12141a] border-[#282c35] text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white mb-1">
                  <Package size={14} className="text-gray-400" />
                  Raw Assets Only
                </div>
                <div className="text-[10px] leading-relaxed text-gray-400">
                  Direct scene assets at root (models, textures, scene.json) for custom game pipelines.
                </div>
              </button>
            </div>
          </div>

          {/* Visual Studio Folder Preview */}
          {exportLayout === 'visual_studio' && (
            <div className="p-3 bg-[#101216] border border-[#2d313b] rounded-lg font-mono text-[11px] text-gray-300 space-y-1">
              <div className="text-gray-400 text-[10px] uppercase font-sans font-semibold tracking-wider mb-1.5 flex items-center justify-between">
                <span>Target Project Hierarchy</span>
                <span className="text-emerald-400 font-mono">VS Code / Visual Studio</span>
              </div>
              <div className="text-cyan-300">📁 {sceneName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'MyScene'}/</div>
              <div className="pl-3 text-amber-300">📁 public/ <span className="text-gray-500 font-sans">(Direct static folder support)</span></div>
              <div className="pl-6 text-gray-400">📁 models/ <span className="text-gray-500">(*.glb files)</span></div>
              <div className="pl-6 text-gray-400">📁 textures/ <span className="text-gray-500">(*.png images)</span></div>
              <div className="pl-6 text-gray-400">📁 materials/ <span className="text-gray-500">(materials.json)</span></div>
              <div className="pl-6 text-gray-400">📄 scene.json</div>
              <div className="pl-6 text-gray-400">📄 assets.json</div>
              <div className="pl-3 text-cyan-400">📁 src/ <span className="text-gray-500 font-sans">(Scripts & loaders)</span></div>
              <div className="pl-6 text-gray-400">📁 services/ <span className="text-gray-500">(SceneLoader.ts, GameScripts.ts)</span></div>
              <div className="pl-6 text-gray-400">📁 components/ <span className="text-gray-500">(SceneViewer.tsx, GameHUD.tsx)</span></div>
              <div className="pl-6 text-gray-400">📄 App.tsx, main.tsx, types.ts</div>
              <div className="pl-3 text-emerald-400">📄 package.json, tailwind.config.js, postcss.config.js, vite.config.ts, index.html</div>
            </div>
          )}

          {/* ZIP Structure Option */}
          <div className="flex items-center justify-between p-2.5 bg-[#12141a] border border-[#282c35] rounded-lg">
            <div>
              <div className="text-xs font-medium text-gray-200">Flat Project Root in ZIP</div>
              <div className="text-[10px] text-gray-400">Prevents double-nested folders when extracting in Windows Explorer</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={flatRoot}
                onChange={(e) => setFlatRoot(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Assets Checkboxes */}
          <div className="space-y-2 pt-1 border-t border-[#282b33]">
            <span className="text-gray-400 font-semibold uppercase text-[11px] tracking-wider">
              Asset Filters
            </span>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-[#12141a] p-2 rounded border border-[#282c35]">
                <input
                  type="checkbox"
                  checked={includeModels}
                  onChange={(e) => setIncludeModels(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0"
                />
                <span className="text-gray-300">Models</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-[#12141a] p-2 rounded border border-[#282c35]">
                <input
                  type="checkbox"
                  checked={includeTextures}
                  onChange={(e) => setIncludeTextures(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0"
                />
                <span className="text-gray-300">Textures</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-[#12141a] p-2 rounded border border-[#282c35]">
                <input
                  type="checkbox"
                  checked={includeMaterials}
                  onChange={(e) => setIncludeMaterials(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0"
                />
                <span className="text-gray-300">Materials</span>
              </label>
            </div>
          </div>

          {/* Scene Checkboxes */}
          <div className="space-y-2 pt-1 border-t border-[#282b33]">
            <span className="text-gray-400 font-semibold uppercase text-[11px] tracking-wider">
              Scene Elements
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-[#12141a] p-2 rounded border border-[#282c35]">
                <input
                  type="checkbox"
                  checked={includeHierarchy}
                  onChange={(e) => setIncludeHierarchy(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0"
                />
                <span className="text-gray-300">Hierarchy</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-[#12141a] p-2 rounded border border-[#282c35]">
                <input
                  type="checkbox"
                  checked={includeTransforms}
                  onChange={(e) => setIncludeTransforms(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0"
                />
                <span className="text-gray-300">Transforms</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-[#12141a] p-2 rounded border border-[#282c35]">
                <input
                  type="checkbox"
                  checked={includeCameras}
                  onChange={(e) => setIncludeCameras(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0"
                />
                <span className="text-gray-300">Cameras</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-[#12141a] p-2 rounded border border-[#282c35]">
                <input
                  type="checkbox"
                  checked={includeLights}
                  onChange={(e) => setIncludeLights(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-0"
                />
                <span className="text-gray-300">Lights</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#15171d] border-t border-[#282b33] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded font-medium text-xs transition-colors shadow-lg"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating VS Project...</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Export Visual Studio Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

