import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface ModelAsset {
  id: string;
  name: string;
  filename: string;
  path: string; // e.g. "models/house.glb"
  folderLocation?: string; // e.g. "C:/GameAssets/Characters/Meshy_AI_Anatomy.glb"
  fileLocation?: string;
  fileSize?: string;
  data: ArrayBuffer | Blob;
  base64?: string;
}

export interface TextureAsset {
  id: string;
  name: string;
  filename: string;
  path: string; // e.g. "textures/wall.webp"
  data: Blob;
  mimeType: string;
}

export interface HDRIAsset {
  id: string;
  name: string;
  filename: string;
  path: string; // e.g. "textures/sundowner_overlook_1k.exr"
  format: 'hdr' | 'exr' | 'equirect';
  data: ArrayBuffer | Blob;
  mimeType?: string;
  base64?: string;
}

export interface PublicAssetItem {
  id: string;
  name: string;
  path: string;
  url: string;
  category?: string;
  thumbnail?: string;
  description?: string;
}

export interface PublicAssetManifest {
  models: PublicAssetItem[];
  textures: PublicAssetItem[];
  hdris: PublicAssetItem[];
  scenes: PublicAssetItem[];
}

export class AssetManager {
  private static instance: AssetManager;

  private models: Map<string, ModelAsset> = new Map();
  private textures: Map<string, TextureAsset> = new Map();
  private hdris: Map<string, HDRIAsset> = new Map();
  private gltfExporter = new GLTFExporter();

  private publicManifest: PublicAssetManifest = {
    models: [],
    textures: [],
    hdris: [],
    scenes: []
  };

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Scan & fetch public folder assets from /assets.json
   */
  public async loadPublicAssetsManifest(): Promise<PublicAssetManifest> {
    try {
      const res = await fetch('/assets.json');
      if (res.ok) {
        const data = await res.json();
        this.publicManifest = {
          models: data.models || [],
          textures: data.textures || [],
          hdris: data.hdris || [],
          scenes: data.scenes || []
        };
      }
    } catch (e) {
      console.warn('No public assets manifest found or failed to load /assets.json:', e);
    }
    return this.publicManifest;
  }

  public getPublicManifest(): PublicAssetManifest {
    return this.publicManifest;
  }

  /**
   * Fetch a public model file from the public folder and register it in memory
   */
  public async loadPublicModel(item: PublicAssetItem): Promise<ModelAsset> {
    const fetchUrl = item.url || (item.path.startsWith('/') ? item.path : `/${item.path}`);
    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error(`Failed to load public model from ${fetchUrl} (status ${res.status})`);
    }
    const buffer = await res.arrayBuffer();
    const filename = item.path.split('/').pop() || `${item.id}.glb`;
    const asset: ModelAsset = {
      id: item.id,
      name: item.name,
      filename,
      path: item.path,
      fileSize: formatFileSize(buffer.byteLength),
      data: buffer
    };
    this.models.set(item.id, asset);
    return asset;
  }

  /**
   * Register a user-imported GLB/GLTF model file
   */
  public async registerModelFile(file: File, customId?: string, folderLocation?: string): Promise<ModelAsset> {
    const buffer = await file.arrayBuffer();
    // Sanitize filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const id = customId || cleanName.replace(/\.[^/.]+$/, '');
    const path = `models/${cleanName}`;
    const detectedFolder = folderLocation || (file as any).webkitRelativePath || file.name;

    const asset: ModelAsset = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ''),
      filename: cleanName,
      path,
      folderLocation: detectedFolder,
      fileLocation: detectedFolder,
      fileSize: formatFileSize(file.size),
      data: buffer
    };

    this.models.set(id, asset);
    return asset;
  }

  /**
   * Register a model binary from an existing ArrayBuffer or Blob
   */
  public registerModelData(
    id: string,
    name: string,
    filename: string,
    data: ArrayBuffer | Blob,
    folderLocation?: string,
    fileSize?: string
  ): ModelAsset {
    const cleanName = filename.endsWith('.glb') ? filename : `${filename}.glb`;
    const byteLength = data instanceof ArrayBuffer ? data.byteLength : data.size;
    const asset: ModelAsset = {
      id,
      name,
      filename: cleanName,
      path: `models/${cleanName}`,
      folderLocation: folderLocation || `models/${cleanName}`,
      fileLocation: folderLocation || `models/${cleanName}`,
      fileSize: fileSize || formatFileSize(byteLength),
      data
    };
    this.models.set(id, asset);
    return asset;
  }

  /**
   * Convert any Three.js 3D Object/Mesh into a binary GLB file and register it as an asset
   */
  public async exportObjectAsGLB(object: THREE.Object3D, name: string): Promise<ModelAsset> {
    return new Promise((resolve, reject) => {
      this.gltfExporter.parse(
        object,
        (gltf) => {
          const buffer = gltf as ArrayBuffer;
          const cleanName = `${name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.glb`;
          const asset: ModelAsset = {
            id: `model_${name.toLowerCase()}`,
            name,
            filename: cleanName,
            path: `models/${cleanName}`,
            data: buffer
          };
          this.models.set(asset.id, asset);
          resolve(asset);
        },
        (error) => {
          reject(error);
        },
        { binary: true }
      );
    });
  }

  /**
   * Register an uploaded image file as a texture
   */
  public async registerTextureFile(file: File, customId?: string): Promise<TextureAsset> {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const id = customId || cleanName.replace(/\.[^/.]+$/, '');
    const path = `textures/${cleanName}`;

    const asset: TextureAsset = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ''),
      filename: cleanName,
      path,
      data: file,
      mimeType: file.type || 'image/png'
    };

    this.textures.set(id, asset);
    return asset;
  }

  /**
   * Register a procedural HTML5 Canvas texture as a PNG TextureAsset
   */
  public async registerCanvasTexture(id: string, name: string, canvas: HTMLCanvasElement): Promise<TextureAsset> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error(`Failed to convert canvas to blob for texture ${name}`));
          return;
        }
        const filename = `${id}.png`;
        const asset: TextureAsset = {
          id,
          name,
          filename,
          path: `textures/${filename}`,
          data: blob,
          mimeType: 'image/png'
        };
        this.textures.set(id, asset);
        resolve(asset);
      }, 'image/png');
    });
  }

  /**
   * Register a procedural texture from a Data URL (base64)
   */
  public async registerDataUrlTexture(id: string, name: string, dataUrl: string): Promise<TextureAsset> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const filename = `${id}.png`;
    const asset: TextureAsset = {
      id,
      name,
      filename,
      path: `textures/${filename}`,
      data: blob,
      mimeType: 'image/png'
    };
    this.textures.set(id, asset);
    return asset;
  }

  /**
   * Alias for registering procedural canvas textures
   */
  public async registerProceduralTexture(id: string, filename: string, textureOrDataUrl: any): Promise<TextureAsset> {
    if (typeof textureOrDataUrl === 'string' && textureOrDataUrl.startsWith('data:')) {
      return this.registerDataUrlTexture(id, id, textureOrDataUrl);
    }
    if (textureOrDataUrl && textureOrDataUrl.image) {
      return this.registerCanvasTexture(id, id, textureOrDataUrl.image);
    }
    // Fallback: create 1x1 white png
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    return this.registerCanvasTexture(id, id, canvas);
  }

  public getModel(idOrPath: string): ModelAsset | undefined {
    if (!idOrPath) return undefined;
    if (this.models.has(idOrPath)) return this.models.get(idOrPath);
    const normalized = idOrPath.toLowerCase().replace(/^models\//, '').replace(/^\//, '');
    for (const asset of this.models.values()) {
      const assetNorm = asset.path.toLowerCase().replace(/^models\//, '').replace(/^\//, '');
      if (
        asset.path === idOrPath ||
        asset.filename === idOrPath ||
        asset.id === idOrPath ||
        asset.name === idOrPath ||
        assetNorm === normalized ||
        asset.filename.toLowerCase() === normalized ||
        asset.name.toLowerCase() === normalized
      ) {
        return asset;
      }
    }
    return undefined;
  }

  public getTexture(idOrPath: string): TextureAsset | undefined {
    if (!idOrPath) return undefined;
    if (this.textures.has(idOrPath)) return this.textures.get(idOrPath);
    const normalized = idOrPath.toLowerCase().replace(/^textures\//, '').replace(/^\//, '');
    for (const asset of this.textures.values()) {
      const assetNorm = asset.path.toLowerCase().replace(/^textures\//, '').replace(/^\//, '');
      if (
        asset.path === idOrPath ||
        asset.filename === idOrPath ||
        asset.id === idOrPath ||
        asset.name === idOrPath ||
        assetNorm === normalized ||
        asset.filename.toLowerCase() === normalized
      ) {
        return asset;
      }
    }
    return undefined;
  }

  public updateFolderLocation(idOrPath: string, folderLocation: string) {
    const asset = this.getModel(idOrPath);
    if (asset) {
      asset.folderLocation = folderLocation;
      asset.fileLocation = folderLocation;
    }
  }

  public async getModelBuffer(idOrPath: string): Promise<ArrayBuffer | null> {
    const asset = this.getModel(idOrPath);
    if (!asset) return null;
    if (asset.data instanceof ArrayBuffer) return asset.data;
    if (asset.data instanceof Blob) {
      return await asset.data.arrayBuffer();
    }
    return null;
  }

  public async getModelBase64(idOrPath: string): Promise<string | undefined> {
    const asset = this.getModel(idOrPath);
    if (!asset) return undefined;
    if (asset.base64) return asset.base64;
    const buf = await this.getModelBuffer(idOrPath);
    if (buf) {
      asset.base64 = bufferToBase64(buf);
      return asset.base64;
    }
    return undefined;
  }

  /**
   * Register a user-imported HDR (.hdr), EXR (.exr), or 360 image (.png/.jpg) file
   */
  public async registerHDRIFile(file: File, customId?: string): Promise<HDRIAsset> {
    const buffer = await file.arrayBuffer();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const id = customId || cleanName.replace(/\.[^/.]+$/, '');
    const path = `textures/${cleanName}`;

    let format: 'hdr' | 'exr' | 'equirect' = 'equirect';
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.hdr')) format = 'hdr';
    else if (lower.endsWith('.exr')) format = 'exr';

    const asset: HDRIAsset = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ''),
      filename: cleanName,
      path,
      format,
      data: buffer,
      mimeType: file.type || (format === 'hdr' ? 'image/vnd.radiance' : format === 'exr' ? 'image/x-exr' : 'image/png'),
      base64: bufferToBase64(buffer)
    };

    this.hdris.set(id, asset);
    // Also store in textures map so generic texture Lookups can locate it
    this.textures.set(id, {
      id,
      name: asset.name,
      filename: asset.filename,
      path: asset.path,
      data: new Blob([buffer], { type: asset.mimeType }),
      mimeType: asset.mimeType || 'image/png'
    });

    return asset;
  }

  /**
   * Register an HDRI blob or buffer (e.g. from procedural canvas export)
   */
  public registerHDRIBlob(
    id: string,
    name: string,
    filename: string,
    data: Blob | ArrayBuffer,
    format: 'hdr' | 'exr' | 'equirect' = 'equirect'
  ): HDRIAsset {
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `textures/${cleanName}`;
    const asset: HDRIAsset = {
      id,
      name,
      filename: cleanName,
      path,
      format,
      data,
      mimeType: format === 'hdr' ? 'image/vnd.radiance' : format === 'exr' ? 'image/x-exr' : 'image/png'
    };
    this.hdris.set(id, asset);

    const blob = data instanceof Blob ? data : new Blob([data]);
    this.textures.set(id, {
      id,
      name,
      filename: cleanName,
      path,
      data: blob,
      mimeType: asset.mimeType || 'image/png'
    });

    return asset;
  }

  public getHDRI(idOrPath: string): HDRIAsset | undefined {
    if (!idOrPath) return undefined;
    if (this.hdris.has(idOrPath)) return this.hdris.get(idOrPath);
    const normalized = idOrPath.toLowerCase().replace(/^textures\//, '').replace(/^hdri\//, '').replace(/^\//, '');
    for (const asset of this.hdris.values()) {
      const assetNorm = asset.path.toLowerCase().replace(/^textures\//, '').replace(/^hdri\//, '').replace(/^\//, '');
      if (
        asset.path === idOrPath ||
        asset.filename === idOrPath ||
        asset.id === idOrPath ||
        asset.name === idOrPath ||
        assetNorm === normalized ||
        asset.filename.toLowerCase() === normalized
      ) {
        return asset;
      }
    }
    return undefined;
  }

  public getAllHDRIs(): HDRIAsset[] {
    return Array.from(this.hdris.values());
  }

  public async getHDRIBuffer(idOrPath: string): Promise<ArrayBuffer | null> {
    const asset = this.getHDRI(idOrPath);
    if (!asset) return null;
    if (asset.data instanceof ArrayBuffer) return asset.data;
    if (asset.data instanceof Blob) {
      return await asset.data.arrayBuffer();
    }
    return null;
  }

  public async getHDRIBase64(idOrPath: string): Promise<string | undefined> {
    const asset = this.getHDRI(idOrPath);
    if (!asset) return undefined;
    if (asset.base64) return asset.base64;
    const buf = await this.getHDRIBuffer(idOrPath);
    if (buf) {
      asset.base64 = bufferToBase64(buf);
      return asset.base64;
    }
    return undefined;
  }

  public getAllModels(): ModelAsset[] {
    return Array.from(this.models.values());
  }

  public getAllTextures(): TextureAsset[] {
    return Array.from(this.textures.values());
  }

  public clear() {
    this.models.clear();
    this.textures.clear();
    this.hdris.clear();
  }
}
