/**
 * Serializer and Deserializer for 3D Game Editor Scenes
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EditorEngine } from '../three/EditorEngine';
import { EditorSceneData, SceneObjectData, SerializedModelAsset, SerializedHDRIAsset } from '../types/editor';
import { AssetManager, bufferToBase64, base64ToBuffer } from '../AssetManager';
import { SkyLoaderHelper } from './environmentPresets';
import { WaterSystem, getDefaultWaterConfig } from '../three/WaterSystem';
import { CharacterControllerSystem } from '../three/CharacterControllerSystem';

export class SceneSerializer {
  private static gltfLoader = new GLTFLoader();

  /**
   * Serialize current editor scene into a complete EditorSceneData structure
   */
  public static async serializeAsync(engine: EditorEngine, sceneName = 'MyGame'): Promise<EditorSceneData> {
    const objects: SceneObjectData[] = [];
    const assetManager = AssetManager.getInstance();

    for (const child of engine.sceneObjectsGroup.children) {
      if (child.name === '__EDITOR_HELPERS__') continue;
      const objData = engine.extractObjectData(child);

      // If object is a model with an asset, attach base64 if available
      if (objData.modelAssetId) {
        const base64 = await assetManager.getModelBase64(objData.modelAssetId);
        if (base64 && objData.modelMetadata) {
          objData.modelMetadata.glbBase64 = base64;
        }
      }
      objects.push(objData);
    }

    // Collect all registered model assets
    const serializedModels: SerializedModelAsset[] = [];
    for (const modelAsset of assetManager.getAllModels()) {
      let b64 = modelAsset.base64;
      if (!b64) {
        const buf = await assetManager.getModelBuffer(modelAsset.id);
        if (buf) {
          b64 = bufferToBase64(buf);
          modelAsset.base64 = b64;
        }
      }

      serializedModels.push({
        id: modelAsset.id,
        name: modelAsset.name,
        filename: modelAsset.filename,
        path: modelAsset.path,
        folderLocation: modelAsset.folderLocation || modelAsset.fileLocation,
        fileLocation: modelAsset.fileLocation || modelAsset.folderLocation,
        fileSize: modelAsset.fileSize,
        glbBase64: b64
      });
    }

    // Collect all registered HDRI assets
    const serializedHdris: SerializedHDRIAsset[] = [];
    for (const hdriAsset of assetManager.getAllHDRIs()) {
      let b64 = hdriAsset.base64;
      if (!b64) {
        const buf = await assetManager.getHDRIBuffer(hdriAsset.id);
        if (buf) {
          b64 = bufferToBase64(buf);
          hdriAsset.base64 = b64;
        }
      }
      serializedHdris.push({
        id: hdriAsset.id,
        name: hdriAsset.name,
        filename: hdriAsset.filename,
        path: hdriAsset.path,
        format: hdriAsset.format,
        base64: b64
      });
    }

    return {
      name: sceneName,
      version: '1.2.0',
      objects,
      environment: engine.getEnvironmentSettings(),
      assets: {
        models: serializedModels,
        hdris: serializedHdris
      }
    };
  }

  /**
   * Synchronous fallback serialize
   */
  public static serialize(engine: EditorEngine, sceneName = 'MyGame'): EditorSceneData {
    const objects: SceneObjectData[] = [];
    const assetManager = AssetManager.getInstance();

    for (const child of engine.sceneObjectsGroup.children) {
      if (child.name === '__EDITOR_HELPERS__') continue;
      const objData = engine.extractObjectData(child);
      if (objData.modelAssetId && objData.modelMetadata) {
        const asset = assetManager.getModel(objData.modelAssetId);
        if (asset?.base64) {
          objData.modelMetadata.glbBase64 = asset.base64;
        }
      }
      objects.push(objData);
    }

    const serializedModels: SerializedModelAsset[] = assetManager.getAllModels().map((m) => ({
      id: m.id,
      name: m.name,
      filename: m.filename,
      path: m.path,
      folderLocation: m.folderLocation,
      fileLocation: m.fileLocation,
      fileSize: m.fileSize,
      glbBase64: m.base64
    }));

    const serializedHdris: SerializedHDRIAsset[] = assetManager.getAllHDRIs().map((h) => ({
      id: h.id,
      name: h.name,
      filename: h.filename,
      path: h.path,
      format: h.format,
      base64: h.base64
    }));

    return {
      name: sceneName,
      version: '1.2.0',
      objects,
      environment: engine.getEnvironmentSettings(),
      assets: {
        models: serializedModels,
        hdris: serializedHdris
      }
    };
  }

  /**
   * Reconstruct scene and models from saved JSON data
   */
  public static async deserialize(
    engine: EditorEngine,
    data: EditorSceneData,
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    onProgress?.(10, 'Initializing WebGL 2.0 Engine & clearing scene viewport...');
    const assetManager = AssetManager.getInstance();

    // 1. Clear existing objects
    while (engine.sceneObjectsGroup.children.length > 0) {
      const obj = engine.sceneObjectsGroup.children[0];
      engine.sceneObjectsGroup.remove(obj);
    }
    engine.selectObject(null);

    // 2. Re-register any embedded HDRI assets into AssetManager
    onProgress?.(25, 'Re-registering Environment HDRIs & Sky Shaders...');
    if (data.assets?.hdris) {
      for (const hdriData of data.assets.hdris) {
        if (hdriData.base64) {
          const buffer = base64ToBuffer(hdriData.base64);
          const registered = assetManager.registerHDRIBlob(
            hdriData.id,
            hdriData.name,
            hdriData.filename,
            buffer,
            hdriData.format
          );
          registered.base64 = hdriData.base64;
        }
      }
    }

    // 3. Reconstruct environment (Sky, HDRI, Fog)
    onProgress?.(40, 'Reconstructing Sky, Physical Lights & Atmospheric Fog...');
    if (data.environment) {
      if (data.environment.sky?.type === 'hdri' && data.environment.sky.presetId) {
        engine.applyEnvironmentPreset(data.environment.sky.presetId);
        engine.updateEnvironment(data.environment);
      } else if (data.environment.sky?.type === 'hdri' && data.environment.sky.hdriName) {
        const found = assetManager.getHDRI(data.environment.sky.hdriName) || (data.environment.sky.hdriUrl ? assetManager.getHDRI(data.environment.sky.hdriUrl) : undefined);
        if (found) {
          const buf = await assetManager.getHDRIBuffer(found.id);
          if (buf) {
            const blob = new Blob([buf]);
            const file = new File([blob], found.filename);
            await engine.applyHDRIFile(file);
          }
        }
        engine.updateEnvironment(data.environment);
      } else {
        engine.updateEnvironment(data.environment);
      }
    }

    // 4. Re-register any embedded model assets into AssetManager
    onProgress?.(60, 'Re-registering GLTF / GLB Model Assets & Material Maps...');
    if (data.assets?.models) {
      for (const assetData of data.assets.models) {
        if (assetData.glbBase64) {
          const buffer = base64ToBuffer(assetData.glbBase64);
          const registered = assetManager.registerModelData(
            assetData.id,
            assetData.name,
            assetData.filename,
            buffer,
            assetData.folderLocation || assetData.fileLocation,
            assetData.fileSize
          );
          registered.base64 = assetData.glbBase64;
        }
      }
    }

    // 5. Reconstruct objects
    const totalObjs = data.objects.length;
    for (let i = 0; i < totalObjs; i++) {
      const objData = data.objects[i];
      const percent = Math.round(65 + ((i + 1) / (totalObjs || 1)) * 30);
      onProgress?.(percent, `Reconstructing Object ${i + 1}/${totalObjs}: "${objData.name}"`);
      await this.reconstructObject(engine, objData);
    }

    onProgress?.(100, 'Scene Reconstruction Complete!');
    engine.callbacks.onSceneModified();
    engine.frameAll();
  }

  private static async reconstructObject(engine: EditorEngine, data: SceneObjectData): Promise<THREE.Object3D> {
    const assetManager = AssetManager.getInstance();

    // Check if this object is a 3D GLB Model
    const isModel =
      data.type === 'model' ||
      !!data.modelMetadata?.glbBase64 ||
      !!data.modelAssetId ||
      !!data.presetId;

    if (isModel) {
      let glbBuffer: ArrayBuffer | null = null;

      if (data.modelMetadata?.glbBase64) {
        glbBuffer = base64ToBuffer(data.modelMetadata.glbBase64);
      } else if (data.modelAssetId) {
        const asset = assetManager.getModel(data.modelAssetId);
        if (asset) {
          glbBuffer = await assetManager.getModelBuffer(asset.id);
        }
      }

      if (glbBuffer) {
        return new Promise((resolve) => {
          this.gltfLoader.parse(
            glbBuffer!,
            '',
            (gltf) => {
              const root = gltf.scene;
              root.name = data.name;
              root.position.set(data.position.x, data.position.y, data.position.z);
              root.rotation.set(
                THREE.MathUtils.degToRad(data.rotation.x),
                THREE.MathUtils.degToRad(data.rotation.y),
                THREE.MathUtils.degToRad(data.rotation.z)
              );
              root.scale.set(data.scale.x, data.scale.y, data.scale.z);
              root.visible = data.visible ?? true;

              const folderLocation =
                data.folderLocation ||
                data.modelMetadata?.folderLocation ||
                data.modelMetadata?.fileLocation ||
                data.userData?.folderLocation;

              root.userData = {
                type: 'model',
                isPrefabRoot: true,
                assetPath: data.modelUrl || `models/${data.modelMetadata?.filename || data.name + '.glb'}`,
                filename: data.modelMetadata?.filename || `${data.name}.glb`,
                modelAssetId: data.modelAssetId || data.modelMetadata?.id || root.uuid,
                folderLocation: folderLocation,
                fileLocation: folderLocation,
                fileSize: data.modelMetadata?.fileSize,
                sourceType: data.modelMetadata?.sourceType || 'local_file',
                scripts: data.scripts || [],
                locked: data.locked || false,
                ...(data.userData || {})
              };

              root.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const m = child as THREE.Mesh;
                  m.castShadow = data.castShadow ?? true;
                  m.receiveShadow = data.receiveShadow ?? true;
                  if (m.material) {
                    if (Array.isArray(m.material)) {
                      m.material.forEach((mat) => { mat.side = THREE.DoubleSide; });
                    } else {
                      m.material.side = THREE.DoubleSide;
                    }
                  }
                }
              });

              engine.sceneObjectsGroup.add(root);
              resolve(root);
            },
            () => {
              // Fallback if parse fails: create fallback mesh
              const fallback = this.createFallbackMesh(data);
              engine.sceneObjectsGroup.add(fallback);
              resolve(fallback);
            }
          );
        });
      }

      if (data.presetId) {
        try {
          const presetObj = engine.addPresetModel(data.presetId);
          if (presetObj) {
            presetObj.name = data.name;
            presetObj.position.set(data.position.x, data.position.y, data.position.z);
            presetObj.rotation.set(
              THREE.MathUtils.degToRad(data.rotation.x),
              THREE.MathUtils.degToRad(data.rotation.y),
              THREE.MathUtils.degToRad(data.rotation.z)
            );
            presetObj.scale.set(data.scale.x, data.scale.y, data.scale.z);
            presetObj.visible = data.visible ?? true;
            presetObj.userData = {
              ...presetObj.userData,
              folderLocation: data.folderLocation || data.modelMetadata?.folderLocation,
              fileLocation: data.folderLocation || data.modelMetadata?.fileLocation,
              scripts: data.scripts || [],
              locked: data.locked || false
            };
            return presetObj;
          }
        } catch {
          // fallback
        }
      }
    }

    let obj: THREE.Object3D;

    if (data.type === 'light') {
      const lType = data.light?.type || 'directional';
      const color = data.light?.color || '#ffffff';
      const intensity = data.light?.intensity ?? 1.5;

      if (lType === 'directional') {
        const d = new THREE.DirectionalLight(new THREE.Color(color), intensity);
        d.castShadow = data.light?.castShadow ?? true;
        obj = d;
      } else if (lType === 'point') {
        const p = new THREE.PointLight(new THREE.Color(color), intensity, data.light?.distance ?? 15);
        p.castShadow = data.light?.castShadow ?? true;
        obj = p;
      } else if (lType === 'spot') {
        const s = new THREE.SpotLight(new THREE.Color(color), intensity, data.light?.distance ?? 20);
        s.castShadow = data.light?.castShadow ?? true;
        obj = s;
      } else {
        obj = new THREE.AmbientLight(new THREE.Color(color), intensity);
      }
    } else if (data.type === 'camera') {
      obj = new THREE.PerspectiveCamera(data.camera?.fov || 50, 16 / 9, data.camera?.near || 0.1, data.camera?.far || 1000);
    } else if (data.type === 'water' || data.water) {
      const waterCfg = data.water || getDefaultWaterConfig(((data as any).water?.waterType) || 'ocean');
      obj = WaterSystem.createWaterMesh(waterCfg);
      obj.castShadow = false;
      obj.receiveShadow = data.receiveShadow ?? true;
    } else if (data.type === 'characterController' || data.characterController) {
      const ctrlType = data.characterController?.controllerType || (data.meshType as any) || 'fpv';
      obj = CharacterControllerSystem.createPlayerObject(ctrlType, data.characterController);
    } else {
      // Mesh
      let geo: THREE.BufferGeometry;
      switch (data.meshType) {
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
        case 'cube':
        default:
          geo = new THREE.BoxGeometry(1, 1, 1);
          break;
      }

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(data.material?.color || '#64748b'),
        roughness: data.material?.roughness ?? 0.4,
        metalness: data.material?.metalness ?? 0.1,
        opacity: data.material?.opacity ?? 1,
        transparent: data.material?.transparent ?? false,
        wireframe: data.material?.wireframe ?? false,
      });

      obj = new THREE.Mesh(geo, mat);
      obj.castShadow = data.castShadow ?? true;
      obj.receiveShadow = data.receiveShadow ?? true;
    }

    obj.name = data.name;
    obj.position.set(data.position.x, data.position.y, data.position.z);
    obj.rotation.set(
      THREE.MathUtils.degToRad(data.rotation.x),
      THREE.MathUtils.degToRad(data.rotation.y),
      THREE.MathUtils.degToRad(data.rotation.z)
    );
    obj.scale.set(data.scale.x, data.scale.y, data.scale.z);
    obj.visible = data.visible ?? true;
    obj.userData = {
      type: data.type,
      meshType: data.meshType,
      scripts: data.scripts || [],
      locked: data.locked || false,
      folderLocation: data.folderLocation,
      fileLocation: data.folderLocation,
      ...(data.userData || {})
    };

    engine.sceneObjectsGroup.add(obj);
    return obj;
  }

  private static createFallbackMesh(data: SceneObjectData): THREE.Object3D {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = data.name;
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.rotation.set(
      THREE.MathUtils.degToRad(data.rotation.x),
      THREE.MathUtils.degToRad(data.rotation.y),
      THREE.MathUtils.degToRad(data.rotation.z)
    );
    mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
    mesh.userData = { ...data.userData, type: 'model', isPrefabRoot: true };
    return mesh;
  }

  public static downloadJSON(sceneData: EditorSceneData, filename?: string) {
    const jsonStr = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${sceneData.name.toLowerCase().replace(/\s+/g, '_')}_scene.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public static async parseFile(file: File): Promise<EditorSceneData> {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.objects || !Array.isArray(data.objects)) {
      throw new Error('Invalid scene format. Missing "objects" array.');
    }
    return data;
  }
}
