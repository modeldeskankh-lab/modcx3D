import { SceneObjectData } from './types/editor';
import { EditorEngine } from './three/EditorEngine';
import { SceneSerializer } from './utils/sceneSerializer';

export class SceneManager {
  private currentSceneName = 'My Horror Scene';
  private engine: EditorEngine | null = null;
  private isDirty = false;

  constructor(engine?: EditorEngine) {
    if (engine) this.engine = engine;
  }

  public setEngine(engine: EditorEngine) {
    this.engine = engine;
  }

  public getSceneName(): string {
    return this.currentSceneName;
  }

  public setSceneName(name: string) {
    this.currentSceneName = name;
  }

  public markDirty() {
    this.isDirty = true;
  }

  public markClean() {
    this.isDirty = false;
  }

  public getIsDirty(): boolean {
    return this.isDirty;
  }

  public serializeScene(): any {
    if (!this.engine) return null;
    return SceneSerializer.serialize(this.engine, this.currentSceneName);
  }

  public deserializeScene(sceneData: any) {
    if (!this.engine) return;
    SceneSerializer.deserialize(this.engine, sceneData);
    if (sceneData.name || sceneData.sceneName) {
      this.currentSceneName = sceneData.name || sceneData.sceneName;
    }
    this.isDirty = false;
  }
}
