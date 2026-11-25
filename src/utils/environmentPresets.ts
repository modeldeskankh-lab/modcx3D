import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { SkyConfig, FogConfig, EnvironmentSettings } from '../types/editor';

export interface EnvironmentPreset {
  id: string;
  name: string;
  category: 'studio' | 'outdoor' | 'night' | 'stylized';
  thumbnailColor: string;
  description: string;
  sky: Partial<SkyConfig>;
  fog?: Partial<FogConfig>;
  generateTexture?: () => THREE.Texture;
}

export const DEFAULT_SKY_CONFIG: SkyConfig = {
  type: 'color',
  presetId: undefined,
  color: '#c0c0c0',
  topColor: '#1e293b',
  bottomColor: '#0a0d14',
  backgroundIntensity: 1.0,
  backgroundBlurriness: 0.0,
  environmentIntensity: 1.0,
  rotation: 0,
  turbidity: 8,
  rayleigh: 2.5,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  sunElevation: 45,
  sunAzimuth: 180,
  exposure: 1.0
};

export const DEFAULT_FOG_CONFIG: FogConfig = {
  type: 'exp2',
  color: '#13151b',
  density: 0.015,
  near: 10,
  far: 100
};

export const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  sky: DEFAULT_SKY_CONFIG,
  fog: DEFAULT_FOG_CONFIG
};

/**
 * Generate rich equirectangular panorama textures procedurally for fast, reliable, zero-latency HDR/Sky presets
 */
function createEquirectangularCanvas(width = 1024, height = 512, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [];

export class SkyLoaderHelper {
  private static rgbeLoader = new RGBELoader();
  private static exrLoader = new EXRLoader();
  private static textureLoader = new THREE.TextureLoader();

  /**
   * Load HDR (.hdr), EXR (.exr), or standard image (.png/.jpg) from File or ArrayBuffer
   */
  public static async loadSkyFile(file: File): Promise<{
    texture: THREE.Texture;
    format: 'hdr' | 'exr' | 'equirect';
    name: string;
  }> {
    const fileName = file.name.toLowerCase();
    const objectUrl = URL.createObjectURL(file);

    try {
      if (fileName.endsWith('.hdr')) {
        const texture = await new Promise<THREE.DataTexture>((resolve, reject) => {
          this.rgbeLoader.load(objectUrl, resolve, undefined, reject);
        });
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.needsUpdate = true;
        return { texture, format: 'hdr', name: file.name };
      } else if (fileName.endsWith('.exr')) {
        const texture = await new Promise<THREE.DataTexture>((resolve, reject) => {
          this.exrLoader.load(objectUrl, resolve, undefined, reject);
        });
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.needsUpdate = true;
        return { texture, format: 'exr', name: file.name };
      } else {
        // Standard Equirectangular Image (JPG, PNG, WebP)
        const texture = await new Promise<THREE.Texture>((resolve, reject) => {
          this.textureLoader.load(objectUrl, resolve, undefined, reject);
        });
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        return { texture, format: 'equirect', name: file.name };
      }
    } finally {
      // Don't revoke immediately so WebGL can upload to GPU
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    }
  }
}
