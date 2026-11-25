import { SceneObjectData } from '../types/editor';

export interface TransformSnapshot {
  pos: { x: number; y: number; z: number };
  rot: { x: number; y: number; z: number }; // in radians
  rotDeg?: { x: number; y: number; z: number }; // in degrees
  scale: { x: number; y: number; z: number };
}

export type HistoryAction =
  | {
      type: 'transform';
      objectId: string;
      description?: string;
      before: TransformSnapshot;
      after: TransformSnapshot;
    }
  | {
      type: 'create';
      objectId: string;
      description?: string;
      object3D: any;
      objectData?: SceneObjectData;
    }
  | {
      type: 'delete';
      objectId: string;
      description?: string;
      object3D: any;
      objectData?: SceneObjectData;
    }
  | {
      type: 'material';
      objectId: string;
      description?: string;
      before: any;
      after: any;
    }
  | {
      type: 'property';
      objectId: string;
      property: string;
      description?: string;
      before: any;
      after: any;
    };

export class HistoryManager {
  private undoStack: HistoryAction[] = [];
  private redoStack: HistoryAction[] = [];
  private maxHistory = 50;

  public push(action: HistoryAction) {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new user action
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public peekUndo(): HistoryAction | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1];
  }

  public peekRedo(): HistoryAction | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1];
  }

  public undo(): HistoryAction | null {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
      return action;
    }
    return null;
  }

  public redo(): HistoryAction | null {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
      return action;
    }
    return null;
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

