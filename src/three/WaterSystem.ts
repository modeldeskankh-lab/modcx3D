import * as THREE from 'three';
import { WaterConfig, WaterPreset, WaterType } from '../types/editor';

export const WATER_PRESETS: Record<WaterPreset, Partial<WaterConfig>> = {
  ocean_calm: {
    waterType: 'ocean',
    preset: 'ocean_calm',
    waveHeight: 0.45,
    waveSpeed: 1.0,
    waveFrequency: 0.6,
    waveChoppiness: 0.8,
    waveDetail: 0.6,
    flowSpeed: 0.0,
    flowDirection: 0,
    flowTurbulence: 0.2,
    shallowColor: '#06b6d4', // Bright cyan
    deepColor: '#0c4a6e', // Deep blue ocean
    clarity: 0.75,
    opacity: 0.88,
    fresnelPower: 2.5,
    sunSpecular: 2.2,
    distortion: 0.4,
    foamColor: '#ffffff',
    foamIntensity: 0.5,
    foamScale: 3.5,
    foamThreshold: 0.45,
    width: 60,
    length: 60,
    subdivisions: 96,
    wireframe: false
  },
  ocean_stormy: {
    waterType: 'ocean',
    preset: 'ocean_stormy',
    waveHeight: 1.4,
    waveSpeed: 1.8,
    waveFrequency: 0.45,
    waveChoppiness: 1.5,
    waveDetail: 0.9,
    flowSpeed: 0.2,
    flowDirection: 45,
    flowTurbulence: 0.8,
    shallowColor: '#1e3a5f',
    deepColor: '#07111e',
    clarity: 0.35,
    opacity: 0.95,
    fresnelPower: 3.2,
    sunSpecular: 1.6,
    distortion: 0.8,
    foamColor: '#f1f5f9',
    foamIntensity: 1.2,
    foamScale: 5.0,
    foamThreshold: 0.3,
    width: 80,
    length: 80,
    subdivisions: 128,
    wireframe: false
  },
  ocean_tropical: {
    waterType: 'ocean',
    preset: 'ocean_tropical',
    waveHeight: 0.25,
    waveSpeed: 0.7,
    waveFrequency: 0.8,
    waveChoppiness: 0.5,
    waveDetail: 0.5,
    flowSpeed: 0.0,
    flowDirection: 0,
    flowTurbulence: 0.1,
    shallowColor: '#22d3ee', // Sparkling turquoise
    deepColor: '#0284c7', // Azure
    clarity: 0.92,
    opacity: 0.78,
    fresnelPower: 2.0,
    sunSpecular: 3.0,
    distortion: 0.3,
    foamColor: '#ffffff',
    foamIntensity: 0.4,
    foamScale: 2.5,
    foamThreshold: 0.55,
    width: 60,
    length: 60,
    subdivisions: 96,
    wireframe: false
  },
  ocean_abyss: {
    waterType: 'ocean',
    preset: 'ocean_abyss',
    waveHeight: 0.8,
    waveSpeed: 0.9,
    waveFrequency: 0.4,
    waveChoppiness: 1.1,
    waveDetail: 0.7,
    flowSpeed: 0.0,
    flowDirection: 0,
    flowTurbulence: 0.3,
    shallowColor: '#0f2744',
    deepColor: '#020617', // Pitch midnight
    clarity: 0.2,
    opacity: 0.98,
    fresnelPower: 4.0,
    sunSpecular: 1.8,
    distortion: 0.5,
    foamColor: '#38bdf8', // Bioluminescent hint
    foamIntensity: 0.3,
    foamScale: 4.0,
    foamThreshold: 0.6,
    width: 100,
    length: 100,
    subdivisions: 96,
    wireframe: false
  },
  river_rapid: {
    waterType: 'river',
    preset: 'river_rapid',
    waveHeight: 0.35,
    waveSpeed: 2.6,
    waveFrequency: 1.4,
    waveChoppiness: 1.2,
    waveDetail: 0.85,
    flowSpeed: 3.5, // Fast rushing flow
    flowDirection: 90, // Flow along River length
    flowTurbulence: 1.0,
    shallowColor: '#38bdf8', // Frothy alpine blue
    deepColor: '#0369a1',
    clarity: 0.8,
    opacity: 0.85,
    fresnelPower: 2.4,
    sunSpecular: 2.5,
    distortion: 0.7,
    foamColor: '#ffffff',
    foamIntensity: 0.9,
    foamScale: 6.0,
    foamThreshold: 0.25,
    width: 10,
    length: 60,
    subdivisions: 96,
    wireframe: false
  },
  river_gentle: {
    waterType: 'river',
    preset: 'river_gentle',
    waveHeight: 0.15,
    waveSpeed: 1.0,
    waveFrequency: 1.0,
    waveChoppiness: 0.4,
    waveDetail: 0.4,
    flowSpeed: 1.2, // Gentle glide
    flowDirection: 90,
    flowTurbulence: 0.3,
    shallowColor: '#2dd4bf', // Emerald stream
    deepColor: '#047857',
    clarity: 0.88,
    opacity: 0.8,
    fresnelPower: 2.0,
    sunSpecular: 2.2,
    distortion: 0.3,
    foamColor: '#ffffff',
    foamIntensity: 0.3,
    foamScale: 3.0,
    foamThreshold: 0.5,
    width: 10,
    length: 60,
    subdivisions: 64,
    wireframe: false
  },
  lake_clear: {
    waterType: 'lake',
    preset: 'lake_clear',
    waveHeight: 0.08,
    waveSpeed: 0.5,
    waveFrequency: 0.7,
    waveChoppiness: 0.2,
    waveDetail: 0.3,
    flowSpeed: 0.0,
    flowDirection: 0,
    flowTurbulence: 0.05,
    shallowColor: '#38bdf8',
    deepColor: '#0284c7',
    clarity: 0.95,
    opacity: 0.75,
    fresnelPower: 2.8,
    sunSpecular: 3.2,
    distortion: 0.15,
    foamColor: '#ffffff',
    foamIntensity: 0.1,
    foamScale: 2.0,
    foamThreshold: 0.8,
    width: 40,
    length: 40,
    subdivisions: 64,
    wireframe: false
  },
  lake_swamp: {
    waterType: 'lake',
    preset: 'lake_swamp',
    waveHeight: 0.05,
    waveSpeed: 0.3,
    waveFrequency: 0.5,
    waveChoppiness: 0.1,
    waveDetail: 0.2,
    flowSpeed: 0.05,
    flowDirection: 180,
    flowTurbulence: 0.1,
    shallowColor: '#65a30d', // Mossy green
    deepColor: '#365314', // Murky olive dark
    clarity: 0.15,
    opacity: 0.92,
    fresnelPower: 3.5,
    sunSpecular: 0.8,
    distortion: 0.2,
    foamColor: '#d9f99d',
    foamIntensity: 0.2,
    foamScale: 4.0,
    foamThreshold: 0.7,
    width: 40,
    length: 40,
    subdivisions: 48,
    wireframe: false
  },
  custom: {
    waterType: 'ocean',
    preset: 'custom',
    waveHeight: 0.4,
    waveSpeed: 1.0,
    waveFrequency: 0.6,
    waveChoppiness: 0.7,
    waveDetail: 0.5,
    flowSpeed: 0.0,
    flowDirection: 0,
    flowTurbulence: 0.2,
    shallowColor: '#06b6d4',
    deepColor: '#075985',
    clarity: 0.75,
    opacity: 0.85,
    fresnelPower: 2.5,
    sunSpecular: 2.0,
    distortion: 0.4,
    foamColor: '#ffffff',
    foamIntensity: 0.5,
    foamScale: 3.0,
    foamThreshold: 0.4,
    width: 50,
    length: 50,
    subdivisions: 96,
    wireframe: false
  }
};

export function getDefaultWaterConfig(type: WaterType = 'ocean'): WaterConfig {
  switch (type) {
    case 'river':
      return { ...WATER_PRESETS.river_rapid, waterType: 'river', preset: 'river_rapid' } as WaterConfig;
    case 'lake':
      return { ...WATER_PRESETS.lake_clear, waterType: 'lake', preset: 'lake_clear' } as WaterConfig;
    case 'ocean':
    default:
      return { ...WATER_PRESETS.ocean_calm, waterType: 'ocean', preset: 'ocean_calm' } as WaterConfig;
  }
}

/**
 * High-performance Water Shader with Gerstner wave displacement, multi-harmonic directional swells,
 * River flow vector animation, Sun specular glints, Fresnel reflection, and Crest foam.
 */
const WaterVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveSpeed;
  uniform float uWaveFrequency;
  uniform float uWaveChoppiness;
  uniform float uWaveDetail;
  uniform float uFlowSpeed;
  uniform float uFlowDirection; // in radians
  uniform float uFlowTurbulence;
  uniform int uIsRiver;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vWaveCrest;
  varying float vElevation;

  // Gerstner Wave calculation: returns displacement vector and accumulates normal
  vec3 calcGerstnerWave(
    vec2 dir,
    float steepness,
    float amplitude,
    float frequency,
    float speed,
    vec2 pos,
    float time,
    inout vec3 tangent,
    inout vec3 binormal
  ) {
    dir = normalize(dir);
    float k = 2.0 * 3.14159265 * frequency;
    float c = sqrt(9.8 / k) * speed;
    float f = k * (dot(dir, pos) - c * time);
    float a = amplitude;
    float q = steepness / (k * a * 4.0 + 0.0001);

    // Partial derivatives for normal calculation
    float sinF = sin(f);
    float cosF = cos(f);

    tangent += vec3(
      -dir.x * dir.x * (steepness * sinF),
      dir.x * (steepness * cosF),
      -dir.x * dir.y * (steepness * sinF)
    );

    binormal += vec3(
      -dir.x * dir.y * (steepness * sinF),
      dir.y * (steepness * cosF),
      -dir.y * dir.y * (steepness * sinF)
    );

    return vec3(
      q * a * dir.x * cosF,
      a * sinF,
      q * a * dir.y * cosF
    );
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vec2 p = worldPos.xz;

    float t = uTime * uWaveSpeed;

    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);
    vec3 waveDisp = vec3(0.0);

    if (uIsRiver == 1) {
      // River Flow: Primary directional wave train aligned with flow angle
      vec2 riverDir = vec2(cos(uFlowDirection), sin(uFlowDirection));
      vec2 perpDir = vec2(-riverDir.y, riverDir.x);
      float flowTime = uTime * uFlowSpeed;

      // Primary Flow Wave
      waveDisp += calcGerstnerWave(riverDir, uWaveChoppiness * 0.8, uWaveHeight * 0.7, uWaveFrequency * 1.2, 1.0, p, flowTime, tangent, binormal);
      // Secondary Ripples & Turbulence
      waveDisp += calcGerstnerWave(riverDir + perpDir * 0.3, uWaveChoppiness * 0.4, uWaveHeight * 0.3 * uWaveDetail, uWaveFrequency * 2.5, 1.4, p, flowTime * 1.3, tangent, binormal);
      waveDisp += calcGerstnerWave(riverDir - perpDir * 0.3, uWaveChoppiness * 0.4, uWaveHeight * 0.2 * uWaveDetail, uWaveFrequency * 3.8, 1.8, p, flowTime * 1.6, tangent, binormal);
    } else {
      // Ocean / Lake 4-Harmonic Gerstner Waves
      // Wave 1: Primary deep swell
      vec2 d1 = vec2(0.707, 0.707);
      waveDisp += calcGerstnerWave(d1, uWaveChoppiness * 0.6, uWaveHeight * 0.6, uWaveFrequency, 1.0, p, t, tangent, binormal);

      // Wave 2: Cross swell
      vec2 d2 = vec2(-0.6, 0.8);
      waveDisp += calcGerstnerWave(d2, uWaveChoppiness * 0.5, uWaveHeight * 0.35, uWaveFrequency * 1.6, 1.2, p, t * 1.1, tangent, binormal);

      // Wave 3: Secondary chop
      vec2 d3 = vec2(0.9, -0.4);
      waveDisp += calcGerstnerWave(d3, uWaveChoppiness * 0.3 * uWaveDetail, uWaveHeight * 0.2 * uWaveDetail, uWaveFrequency * 2.8, 1.5, p, t * 1.4, tangent, binormal);

      // Wave 4: High-frequency micro ripples
      vec2 d4 = vec2(-0.3, -0.95);
      waveDisp += calcGerstnerWave(d4, uWaveChoppiness * 0.2 * uWaveDetail, uWaveHeight * 0.1 * uWaveDetail, uWaveFrequency * 4.2, 2.0, p, t * 1.8, tangent, binormal);
    }

    pos += waveDisp;
    vElevation = waveDisp.y;
    vWaveCrest = clamp(waveDisp.y / (uWaveHeight + 0.001), 0.0, 1.0);

    vec3 normal = normalize(cross(binormal, tangent));
    vNormal = normalize(normalMatrix * normal);

    vec4 finalWorld = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = finalWorld.xyz;

    gl_Position = projectionMatrix * viewMatrix * finalWorld;
  }
`;

const WaterFragmentShader = /* glsl */ `
  uniform vec3 uShallowColor;
  uniform vec3 uDeepColor;
  uniform float uClarity;
  uniform float uOpacity;
  uniform float uFresnelPower;
  uniform float uSunSpecular;
  uniform vec3 uSunPosition;
  uniform vec3 uSunColor;
  uniform vec3 uCameraPosition;
  uniform vec3 uFoamColor;
  uniform float uFoamIntensity;
  uniform float uFoamScale;
  uniform float uFoamThreshold;
  uniform float uTime;
  uniform float uFlowSpeed;
  uniform float uFlowDirection;
  uniform int uIsRiver;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vWaveCrest;
  varying float vElevation;

  // Simple procedural noise for foam patterns and caustics
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float val = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      val += amp * noise(p);
      p *= 2.02;
      amp *= 0.5;
    }
    return val;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

    // Fresnel Effect (Schlick's approximation)
    float cosTheta = clamp(dot(viewDir, normal), 0.0, 1.0);
    float fresnel = pow(1.0 - cosTheta, uFresnelPower);
    fresnel = clamp(fresnel, 0.05, 0.95);

    // Sun Specular (Blinn-Phong)
    vec3 lightDir = normalize(uSunPosition);
    if (length(uSunPosition) < 0.1) {
      lightDir = normalize(vec3(0.5, 0.8, 0.3));
    }
    vec3 halfVec = normalize(lightDir + viewDir);
    float specBase = max(dot(normal, halfVec), 0.0);
    float spec = pow(specBase, 128.0) * uSunSpecular;

    // Additional Sun Glint Broad Reflection
    float broadSpec = pow(specBase, 24.0) * (uSunSpecular * 0.25);

    // Water Depth Color Interpolation
    float depthFactor = clamp((vElevation + 0.5) * 0.8, 0.0, 1.0);
    depthFactor = mix(depthFactor, 1.0 - cosTheta, 0.3);
    vec3 waterColor = mix(uDeepColor, uShallowColor, depthFactor);

    // Foam Synthesis
    vec2 foamUv = vWorldPosition.xz * (uFoamScale * 0.15);
    if (uIsRiver == 1) {
      vec2 flowVector = vec2(cos(uFlowDirection), sin(uFlowDirection)) * uFlowSpeed * 0.2;
      foamUv += flowVector * uTime;
    } else {
      foamUv += vec2(sin(uTime * 0.15), cos(uTime * 0.12)) * 0.3;
    }

    float foamNoise1 = fbm(foamUv * 3.0);
    float foamNoise2 = fbm(foamUv * 6.0 + vec2(1.7, 3.2));
    float combinedNoise = (foamNoise1 * 0.6 + foamNoise2 * 0.4);

    // Foam triggers near wave crests and peaks
    float crestFoam = smoothstep(uFoamThreshold, 1.0, vWaveCrest + (combinedNoise - 0.5) * 0.6);
    float foamMask = clamp(crestFoam * uFoamIntensity, 0.0, 1.0);

    // Blend Water Color with Foam & Sky Reflection
    vec3 skyReflection = mix(vec3(0.7, 0.85, 1.0), vec3(0.3, 0.6, 0.95), normal.y);
    vec3 surfaceColor = mix(waterColor, skyReflection, fresnel * 0.7);

    // Apply Foam
    surfaceColor = mix(surfaceColor, uFoamColor, foamMask);

    // Add Sun Specular Highlights & Glints
    vec3 sunTint = uSunColor;
    if (length(sunTint) < 0.1) sunTint = vec3(1.0, 0.95, 0.85);
    surfaceColor += (spec + broadSpec) * sunTint;

    // Final alpha blending with clarity & fresnel
    float finalAlpha = clamp(mix(uOpacity * (1.0 - uClarity * 0.5), 1.0, fresnel * 0.6 + foamMask * 0.4), 0.15, 1.0);

    gl_FragColor = vec4(surfaceColor, finalAlpha);
  }
`;

export class WaterSystem {
  /**
   * Creates a dedicated animated Three.js Water Mesh with high-density Gerstner wave simulation
   */
  public static createWaterMesh(config: WaterConfig): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(
      config.width,
      config.length,
      config.subdivisions,
      config.subdivisions
    );
    // Orient horizontally (ground level)
    geo.rotateX(-Math.PI / 2);

    const mat = this.createWaterMaterial(config);
    const mesh = new THREE.Mesh(geo, mat);

    mesh.castShadow = false;
    mesh.receiveShadow = false; // Disable standard shadow map depth comparison on water to prevent shadow acne scanline artifacts
    mesh.userData = {
      type: 'water',
      waterConfig: { ...config },
      scripts: []
    };

    return mesh;
  }

  /**
   * Creates the specialized ShaderMaterial for water rendering
   */
  public static createWaterMaterial(config: WaterConfig): THREE.ShaderMaterial {
    const shallow = new THREE.Color(config.shallowColor);
    const deep = new THREE.Color(config.deepColor);
    const foam = new THREE.Color(config.foamColor);
    const flowRad = THREE.MathUtils.degToRad(config.flowDirection || 0);

    const material = new THREE.ShaderMaterial({
      vertexShader: WaterVertexShader,
      fragmentShader: WaterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaveHeight: { value: config.waveHeight },
        uWaveSpeed: { value: config.waveSpeed },
        uWaveFrequency: { value: config.waveFrequency },
        uWaveChoppiness: { value: config.waveChoppiness },
        uWaveDetail: { value: config.waveDetail },
        uFlowSpeed: { value: config.flowSpeed },
        uFlowDirection: { value: flowRad },
        uFlowTurbulence: { value: config.flowTurbulence },
        uIsRiver: { value: config.waterType === 'river' ? 1 : 0 },
        uShallowColor: { value: shallow },
        uDeepColor: { value: deep },
        uClarity: { value: config.clarity },
        uOpacity: { value: config.opacity },
        uFresnelPower: { value: config.fresnelPower },
        uSunSpecular: { value: config.sunSpecular },
        uSunPosition: { value: new THREE.Vector3(5, 10, 5) },
        uSunColor: { value: new THREE.Color('#ffffff') },
        uCameraPosition: { value: new THREE.Vector3(0, 5, 10) },
        uFoamColor: { value: foam },
        uFoamIntensity: { value: config.foamIntensity },
        uFoamScale: { value: config.foamScale },
        uFoamThreshold: { value: config.foamThreshold }
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      wireframe: config.wireframe || false
    });

    return material;
  }

  /**
   * Updates an existing water mesh with new configuration parameters
   */
  public static updateWaterMesh(mesh: THREE.Mesh, updates: Partial<WaterConfig>) {
    if (!mesh || mesh.userData.type !== 'water') return;

    const currentConfig: WaterConfig = {
      ...mesh.userData.waterConfig,
      ...updates
    };
    mesh.userData.waterConfig = currentConfig;

    // Check if geometry dimensions or subdivisions changed
    const needsNewGeo =
      updates.width !== undefined ||
      updates.length !== undefined ||
      updates.subdivisions !== undefined;

    if (needsNewGeo) {
      mesh.geometry.dispose();
      const newGeo = new THREE.PlaneGeometry(
        currentConfig.width,
        currentConfig.length,
        currentConfig.subdivisions,
        currentConfig.subdivisions
      );
      newGeo.rotateX(-Math.PI / 2);
      mesh.geometry = newGeo;
    }

    // Update material uniforms
    const mat = mesh.material as THREE.ShaderMaterial;
    if (mat && mat.uniforms) {
      if (updates.waveHeight !== undefined) mat.uniforms.uWaveHeight.value = updates.waveHeight;
      if (updates.waveSpeed !== undefined) mat.uniforms.uWaveSpeed.value = updates.waveSpeed;
      if (updates.waveFrequency !== undefined) mat.uniforms.uWaveFrequency.value = updates.waveFrequency;
      if (updates.waveChoppiness !== undefined) mat.uniforms.uWaveChoppiness.value = updates.waveChoppiness;
      if (updates.waveDetail !== undefined) mat.uniforms.uWaveDetail.value = updates.waveDetail;
      if (updates.flowSpeed !== undefined) mat.uniforms.uFlowSpeed.value = updates.flowSpeed;
      if (updates.flowDirection !== undefined) {
        mat.uniforms.uFlowDirection.value = THREE.MathUtils.degToRad(updates.flowDirection);
      }
      if (updates.flowTurbulence !== undefined) mat.uniforms.uFlowTurbulence.value = updates.flowTurbulence;
      if (updates.waterType !== undefined) {
        mat.uniforms.uIsRiver.value = updates.waterType === 'river' ? 1 : 0;
      }
      if (updates.shallowColor !== undefined) mat.uniforms.uShallowColor.value.set(updates.shallowColor);
      if (updates.deepColor !== undefined) mat.uniforms.uDeepColor.value.set(updates.deepColor);
      if (updates.clarity !== undefined) mat.uniforms.uClarity.value = updates.clarity;
      if (updates.opacity !== undefined) mat.uniforms.uOpacity.value = updates.opacity;
      if (updates.fresnelPower !== undefined) mat.uniforms.uFresnelPower.value = updates.fresnelPower;
      if (updates.sunSpecular !== undefined) mat.uniforms.uSunSpecular.value = updates.sunSpecular;
      if (updates.foamColor !== undefined) mat.uniforms.uFoamColor.value.set(updates.foamColor);
      if (updates.foamIntensity !== undefined) mat.uniforms.uFoamIntensity.value = updates.foamIntensity;
      if (updates.foamScale !== undefined) mat.uniforms.uFoamScale.value = updates.foamScale;
      if (updates.foamThreshold !== undefined) mat.uniforms.uFoamThreshold.value = updates.foamThreshold;
      if (updates.wireframe !== undefined) mat.wireframe = updates.wireframe;
      mat.needsUpdate = true;
    }
  }

  /**
   * Applies a predefined Water Preset to a water mesh
   */
  public static applyPreset(mesh: THREE.Mesh, preset: WaterPreset) {
    const presetConfig = WATER_PRESETS[preset];
    if (!presetConfig) return;
    this.updateWaterMesh(mesh, presetConfig);
  }

  /**
   * Tick animation uniforms for all water meshes in scene
   */
  public static animateWater(
    mesh: THREE.Mesh,
    elapsedSeconds: number,
    sunPosition?: THREE.Vector3,
    sunColor?: THREE.Color,
    cameraPosition?: THREE.Vector3
  ) {
    if (!mesh || mesh.userData.type !== 'water') return;
    const mat = mesh.material as THREE.ShaderMaterial;
    if (!mat || !mat.uniforms) return;

    mat.uniforms.uTime.value = elapsedSeconds;

    if (sunPosition && mat.uniforms.uSunPosition) {
      mat.uniforms.uSunPosition.value.copy(sunPosition);
    }
    if (sunColor && mat.uniforms.uSunColor) {
      mat.uniforms.uSunColor.value.copy(sunColor);
    }
    if (cameraPosition && mat.uniforms.uCameraPosition) {
      mat.uniforms.uCameraPosition.value.copy(cameraPosition);
    }
  }
}
