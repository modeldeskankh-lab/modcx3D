export type TransformMode = 'translate' | 'rotate' | 'scale';
export type TransformSpace = 'world' | 'local';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type TextureMapType = 'albedo' | 'normal' | 'roughness' | 'metallic' | 'alpha' | 'emissive' | 'ao' | 'other';

export interface TextureAsset {
  id: string;
  name: string;
  url: string;
  mapType: TextureMapType;
  sourceModel?: string;
  materialName?: string;
  materialId?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface MaterialConfig {
  id?: string;
  uuid?: string;
  name?: string;
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  doubleSided?: boolean;
  sourceModel?: string;
  meshCount?: number;

  // 1. Albedo / Base Color Map
  mapUrl?: string;
  mapName?: string;

  // 2. Normal Map
  normalMapUrl?: string;
  normalMapName?: string;
  normalScale?: number;

  // 3. Roughness Map
  roughnessMapUrl?: string;
  roughnessMapName?: string;

  // 4. Metallic Map
  metalnessMapUrl?: string;
  metalnessMapName?: string;

  // 5. Alpha / Transparency Map
  alphaMapUrl?: string;
  alphaMapName?: string;
  alphaTest?: number;

  // 6. Emission Map
  emissiveMapUrl?: string;
  emissiveMapName?: string;

  // 7. Ambient Occlusion (AO) Map
  aoMapUrl?: string;
  aoMapName?: string;
  aoMapIntensity?: number;
}

export interface LightConfig {
  type: 'directional' | 'point' | 'spot' | 'ambient';
  color: string;
  intensity: number;
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
  castShadow: boolean;
}

export type MaterialData = MaterialConfig;
export type LightData = LightConfig;

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
}

export type ControllerType = 'fpv' | 'tpv' | 'drone';

export interface CharacterControllerConfig {
  controllerType: ControllerType;
  moveSpeed: number;
  sprintMultiplier: number;
  jumpForce: number;
  mouseSensitivity: number;
  gravity: number;
  eyeHeight: number;
  headBobbing: boolean;
  flashlight: boolean;
  cameraDistance: number;
  cameraHeight: number;
  cameraLag: number;
  flightSpeed: number;
  ascendSpeed: number;
  pitchSpeed: number;
  yawSpeed: number;
  rollTilt: boolean;
  hoverDamping: number;
  headlights: boolean;
}

export interface ScriptConfig {
  type: 'playerController' | 'rotator' | 'bouncer';
  enabled: boolean;
  speed?: number;
  jumpForce?: number;
  rotSpeed?: Vec3;
  controllerType?: ControllerType;
}

export type WaterType = 'ocean' | 'river' | 'lake';
export type WaterPreset =
  | 'ocean_calm'
  | 'ocean_stormy'
  | 'ocean_tropical'
  | 'ocean_abyss'
  | 'river_rapid'
  | 'river_gentle'
  | 'lake_clear'
  | 'lake_swamp'
  | 'custom';

export interface WaterConfig {
  waterType: WaterType;
  preset: WaterPreset;
  // Waves & Simulation
  waveHeight: number; // 0.0 - 5.0 (Wave amplitude)
  waveSpeed: number; // 0.1 - 5.0
  waveFrequency: number; // 0.1 - 4.0 (Spatial frequency)
  waveChoppiness: number; // 0.0 - 2.0 (Gerstner steepness)
  waveDetail: number; // 0.0 - 1.0 (Secondary wave octave detail)
  
  // River Flow Dynamics
  flowSpeed: number; // 0.0 - 8.0 (Directional flow velocity)
  flowDirection: number; // 0 - 360 (Flow angle in degrees)
  flowTurbulence: number; // 0.0 - 2.0

  // Optics & Color Gradient
  shallowColor: string; // Hex color for shallow/crest water
  deepColor: string; // Hex color for deep abyss
  clarity: number; // 0.0 (murky) - 1.0 (crystal transparent)
  opacity: number; // 0.1 - 1.0
  fresnelPower: number; // 1.0 - 5.0
  sunSpecular: number; // 0.0 - 5.0 (Sun glint highlight intensity)
  distortion: number; // 0.0 - 1.0

  // Foam & Shorelines
  foamColor: string; // Hex color for foam
  foamIntensity: number; // 0.0 - 2.0
  foamScale: number; // 0.5 - 10.0
  foamThreshold: number; // 0.0 - 1.0 (Wave crest threshold to trigger foam)
  
  // Geometry & Tessellation
  width: number;
  length: number;
  subdivisions: number; // Grid segments for vertex displacement
  wireframe: boolean;
}

export interface ModelAssetMetadata {
  id: string;
  name: string;
  filename: string;
  folderLocation?: string; // Computer folder / file location e.g. "C:/Users/.../Meshy_AI_Anatomy.glb"
  fileLocation?: string;
  originalPath?: string;
  sourceType?: 'local_file' | 'url' | 'preset' | 'procedural';
  fileSize?: string;
  triangleCount?: number;
  vertexCount?: number;
  meshCount?: number;
  glbBase64?: string; // Embedded base64 GLB payload for complete self-contained scene JSON
  presetId?: string;
  lastModified?: number;
}

export interface SceneObjectData {
  id: string;
  name: string;
  type: 'mesh' | 'group' | 'light' | 'camera' | 'model' | 'water' | 'characterController';
  meshType?: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus' | 'capsule' | 'custom' | 'water' | 'fpv' | 'tpv' | 'drone';
  visible: boolean;
  locked?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  position: Vec3;
  rotation: Vec3; // in degrees for UI
  scale: Vec3;
  material?: MaterialConfig;
  materials?: MaterialConfig[];
  light?: LightConfig;
  camera?: CameraConfig;
  water?: WaterConfig;
  characterController?: CharacterControllerConfig;
  scripts?: ScriptConfig[];
  children?: SceneObjectData[];
  modelUrl?: string;
  parentId?: string;
  modelAssetId?: string;
  presetId?: string;
  modelMetadata?: ModelAssetMetadata;
  folderLocation?: string;
  userData?: any;
}

export type SkyType = 'procedural' | 'hdri' | 'color' | 'gradient' | 'none';
export type FogType = 'none' | 'exp2' | 'linear';

export interface SkyConfig {
  type: SkyType;
  presetId?: string;
  // Color & Gradient
  color: string;
  topColor?: string;
  bottomColor?: string;
  // HDRI / EXR
  hdriUrl?: string;
  hdriName?: string;
  hdriFormat?: 'hdr' | 'exr' | 'equirect';
  backgroundIntensity: number;
  backgroundBlurriness: number;
  environmentIntensity: number;
  rotation: number; // in degrees (0 - 360)
  // Procedural Sky
  turbidity: number; // 0 - 20 (default 10)
  rayleigh: number; // 0 - 4 (default 2)
  mieCoefficient: number; // 0 - 0.1 (default 0.005)
  mieDirectionalG: number; // 0 - 1 (default 0.8)
  sunElevation: number; // -10 - 90 deg (default 45)
  sunAzimuth: number; // 0 - 360 deg (default 180)
  exposure: number; // 0.1 - 3.0 (default 1.0)
}

export interface FogConfig {
  type: FogType;
  color: string;
  density: number; // for exp2, e.g. 0.015
  near: number; // for linear, e.g. 10
  far: number; // for linear, e.g. 150
}

export interface EnvironmentSettings {
  sky: SkyConfig;
  fog: FogConfig;
}

export interface SerializedModelAsset {
  id: string;
  name: string;
  filename: string;
  path: string;
  folderLocation?: string;
  fileLocation?: string;
  fileSize?: string;
  glbBase64?: string;
}

export interface SerializedHDRIAsset {
  id: string;
  name: string;
  filename: string;
  path: string;
  format: 'hdr' | 'exr' | 'equirect';
  base64?: string;
}

export interface EditorSceneData {
  name: string;
  version: string;
  environment?: EnvironmentSettings;
  objects: SceneObjectData[];
  assets?: {
    models?: SerializedModelAsset[];
    textures?: any[];
    hdris?: SerializedHDRIAsset[];
  };
}

export interface AssetRecord {
  id: string;
  name: string;
  category: 'models' | 'materials' | 'textures' | 'audio' | 'scenes';
  url: string;
  thumbnail?: string;
  format?: string;
  size?: string;
  presetData?: any;
}
