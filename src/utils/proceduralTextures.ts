/**
 * Generates procedural textures using HTML5 Canvas
 * Provides instant rich textures for the 3D Game Editor without needing external network assets.
 */
import * as THREE from 'three';

export interface TexturePreset {
  id: string;
  name: string;
  category: string;
  generate: () => THREE.Texture;
  thumbnail: string;
}

function createDataURL(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 256): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  return canvas.toDataURL();
}

function canvasToTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export const TEXTURE_PRESETS: TexturePreset[] = [];
