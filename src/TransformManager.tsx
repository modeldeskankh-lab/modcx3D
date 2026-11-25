import { TransformMode, TransformSpace } from './types/editor';

export interface TransformSettings {
  mode: TransformMode;
  space: TransformSpace;
  snapEnabled: boolean;
  translationSnap: number;
  rotationSnap: number;
  scaleSnap: number;
}

export class TransformManager {
  private settings: TransformSettings = {
    mode: 'translate',
    space: 'world',
    snapEnabled: false,
    translationSnap: 1.0,
    rotationSnap: (15 * Math.PI) / 180,
    scaleSnap: 0.25
  };

  public getSettings(): TransformSettings {
    return { ...this.settings };
  }

  public setMode(mode: TransformMode) {
    this.settings.mode = mode;
  }

  public toggleSpace(): TransformSpace {
    this.settings.space = this.settings.space === 'world' ? 'local' : 'world';
    return this.settings.space;
  }

  public toggleSnap(): boolean {
    this.settings.snapEnabled = !this.settings.snapEnabled;
    return this.settings.snapEnabled;
  }
}
