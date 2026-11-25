import * as THREE from 'three';
import { SceneObjectData } from './types/editor';

export interface SelectionState {
  selectedObject: THREE.Object3D | null;
  selectedData: SceneObjectData | null;
  selectedId: string | null;
}

export class SelectionManager {
  private selectedObject: THREE.Object3D | null = null;
  private onSelectionChanged?: (obj: THREE.Object3D | null) => void;

  constructor(onSelectionChanged?: (obj: THREE.Object3D | null) => void) {
    this.onSelectionChanged = onSelectionChanged;
  }

  public setSelection(obj: THREE.Object3D | null) {
    this.selectedObject = obj;
    this.onSelectionChanged?.(obj);
  }

  public getSelection(): THREE.Object3D | null {
    return this.selectedObject;
  }

  public clearSelection() {
    this.setSelection(null);
  }

  public isSelected(obj: THREE.Object3D): boolean {
    return this.selectedObject === obj;
  }
}
