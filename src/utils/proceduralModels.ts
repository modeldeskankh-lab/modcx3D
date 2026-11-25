/**
 * Built-in procedural 3D model generators for instant drag-and-drop assets
 */
import * as THREE from 'three';

export interface ModelPreset {
  id: string;
  name: string;
  category: string;
  createMesh: () => THREE.Group;
  description: string;
}

export const MODEL_PRESETS: ModelPreset[] = [];
