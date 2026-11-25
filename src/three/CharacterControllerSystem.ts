import * as THREE from 'three';
import { ControllerType, CharacterControllerConfig } from '../types/editor';

export function getDefaultCharacterConfig(type: ControllerType): CharacterControllerConfig {
  switch (type) {
    case 'fpv':
      return {
        controllerType: 'fpv',
        moveSpeed: 6.5,
        sprintMultiplier: 1.8,
        jumpForce: 8.5,
        mouseSensitivity: 0.0022,
        gravity: 22,
        eyeHeight: 1.65,
        headBobbing: true,
        flashlight: true,
        cameraDistance: 0.0,
        cameraHeight: 1.65,
        cameraLag: 0.0,
        flightSpeed: 10,
        ascendSpeed: 6,
        pitchSpeed: 1.5,
        yawSpeed: 2.0,
        rollTilt: false,
        hoverDamping: 0.92,
        headlights: false
      };
    case 'tpv':
      return {
        controllerType: 'tpv',
        moveSpeed: 6.0,
        sprintMultiplier: 1.9,
        jumpForce: 8.5,
        mouseSensitivity: 0.0022,
        gravity: 22,
        eyeHeight: 1.5,
        headBobbing: false,
        flashlight: false,
        cameraDistance: 4.2,
        cameraHeight: 2.0,
        cameraLag: 0.12,
        flightSpeed: 10,
        ascendSpeed: 6,
        pitchSpeed: 1.5,
        yawSpeed: 2.0,
        rollTilt: false,
        hoverDamping: 0.92,
        headlights: false
      };
    case 'drone':
      return {
        controllerType: 'drone',
        moveSpeed: 12.0,
        sprintMultiplier: 2.2,
        jumpForce: 0,
        mouseSensitivity: 0.002,
        gravity: 0,
        eyeHeight: 0.3,
        headBobbing: false,
        flashlight: false,
        cameraDistance: 2.5,
        cameraHeight: 0.8,
        cameraLag: 0.08,
        flightSpeed: 14.0,
        ascendSpeed: 7.0,
        pitchSpeed: 2.0,
        yawSpeed: 2.5,
        rollTilt: true,
        hoverDamping: 0.94,
        headlights: true
      };
  }
}

export class CharacterControllerSystem {
  /**
   * Build 3D mesh model hierarchy for FPV Player, TPV Player, or Drone
   */
  public static createPlayerObject(
    type: ControllerType,
    config?: Partial<CharacterControllerConfig>
  ): THREE.Group {
    const fullConfig = { ...getDefaultCharacterConfig(type), ...config };
    const group = new THREE.Group();
    group.name = type === 'fpv' ? 'FPV Player' : type === 'tpv' ? 'TPV Player' : 'Drone Controller';
    group.userData = {
      type: 'characterController',
      controllerType: type,
      characterConfig: fullConfig,
      isPlayerController: true,
      velocity: new THREE.Vector3(),
      isGrounded: true,
      pitch: 0,
      yaw: 0,
      runAnimTimer: 0
    };

    if (type === 'fpv') {
      this.buildFPVMesh(group, fullConfig);
    } else if (type === 'tpv') {
      this.buildTPVMesh(group, fullConfig);
    } else if (type === 'drone') {
      this.buildDroneMesh(group, fullConfig);
    }

    return group;
  }

  /**
   * Build First Person Character with Capsule body, Visor head, Flashlight & Camera
   */
  private static buildFPVMesh(group: THREE.Group, config: CharacterControllerConfig) {
    // 1. Capsule Body (Semi-translucent placeholder in editor, invisible/hidden in FPV gameplay)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });

    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.9, 8, 16);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.name = 'PlayerBody';
    bodyMesh.position.y = 0.85;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 2. Visor Head
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.3
    });
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.name = 'PlayerHead';
    headMesh.position.set(0, config.eyeHeight, 0);
    headMesh.castShadow = true;
    group.add(headMesh);

    // 3. Direction Indicator Pointer (Nose / Arrow)
    const visorGeo = new THREE.BoxGeometry(0.3, 0.12, 0.2);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0, -0.22);
    headMesh.add(visorMesh);

    // 4. Perspective Camera attached at eye height
    const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.05, 1000);
    camera.name = 'PlayerCamera';
    camera.position.set(0, config.eyeHeight, 0);
    group.add(camera);

    // 5. Flashlight / Headlamp
    const flashlight = new THREE.SpotLight(0xffffff, config.flashlight ? 2.5 : 0, 30, Math.PI / 5, 0.3, 1.2);
    flashlight.name = 'PlayerFlashlight';
    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, -5);
    camera.add(flashlight);
    camera.add(flashlight.target);

    // Camera Helper for editor visual inspection
    const camHelper = new THREE.CameraHelper(camera);
    camHelper.name = 'PlayerCameraHelper';
    camHelper.visible = true;
    (camHelper as any).isEditorOnly = true;
    group.add(camHelper);
  }

  /**
   * Build Third Person Character (Stylized Humanoid Rig) with Orbit Follow Camera
   */
  private static buildTPVMesh(group: THREE.Group, config: CharacterControllerConfig) {
    const mainMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.35,
      metalness: 0.3
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.2
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.7
    });

    const modelGroup = new THREE.Group();
    modelGroup.name = 'CharacterModel';

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.65, 0.3);
    const torso = new THREE.Mesh(torsoGeo, mainMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    modelGroup.add(torso);

    // Chest Core (Glow reactor)
    const coreGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const core = new THREE.Mesh(coreGeo, accentMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.05, -0.16);
    torso.add(core);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const head = new THREE.Mesh(headGeo, darkMat);
    head.name = 'TPVHead';
    head.position.y = 1.68;
    head.castShadow = true;
    modelGroup.add(head);

    // Visor strip
    const visorGeo = new THREE.BoxGeometry(0.28, 0.08, 0.16);
    const visor = new THREE.Mesh(visorGeo, accentMat);
    visor.position.set(0, 0.02, -0.15);
    head.add(visor);

    // Left & Right Arms
    const armGeo = new THREE.CapsuleGeometry(0.08, 0.45, 6, 12);
    const leftArm = new THREE.Mesh(armGeo, darkMat);
    leftArm.name = 'LeftArm';
    leftArm.position.set(0.36, 1.15, 0);
    leftArm.castShadow = true;
    modelGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, darkMat);
    rightArm.name = 'RightArm';
    rightArm.position.set(-0.36, 1.15, 0);
    rightArm.castShadow = true;
    modelGroup.add(rightArm);

    // Left & Right Legs
    const legGeo = new THREE.CapsuleGeometry(0.1, 0.55, 6, 12);
    const leftLeg = new THREE.Mesh(legGeo, darkMat);
    leftLeg.name = 'LeftLeg';
    leftLeg.position.set(0.18, 0.45, 0);
    leftLeg.castShadow = true;
    modelGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, darkMat);
    rightLeg.name = 'RightLeg';
    rightLeg.position.set(-0.18, 0.45, 0);
    rightLeg.castShadow = true;
    modelGroup.add(rightLeg);

    // Backpack / Thruster
    const packGeo = new THREE.BoxGeometry(0.35, 0.4, 0.15);
    const pack = new THREE.Mesh(packGeo, darkMat);
    pack.position.set(0, 1.15, 0.2);
    pack.castShadow = true;
    modelGroup.add(pack);

    group.add(modelGroup);

    // Attached Third Person Camera
    const camera = new THREE.PerspectiveCamera(65, 16 / 9, 0.1, 1000);
    camera.name = 'PlayerCamera';
    camera.position.set(0, config.cameraHeight, config.cameraDistance);
    camera.lookAt(0, 1.4, 0);
    group.add(camera);

    // Camera Helper
    const camHelper = new THREE.CameraHelper(camera);
    camHelper.name = 'PlayerCameraHelper';
    camHelper.visible = true;
    (camHelper as any).isEditorOnly = true;
    group.add(camHelper);
  }

  /**
   * Build 6-DOF Quadcopter Drone Model with 4 Rotating Propellers & Gimbal Camera
   */
  private static buildDroneMesh(group: THREE.Group, config: CharacterControllerConfig) {
    const droneGroup = new THREE.Group();
    droneGroup.name = 'DroneChassis';

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.8
    });
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.6
    });
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3
    });
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.5,
      roughness: 0.1
    });

    // Central Aerodynamic Fuselage
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.16, 0.8);
    const body = new THREE.Mesh(bodyGeo, shellMat);
    body.position.y = 0.4;
    body.castShadow = true;
    droneGroup.add(body);

    // Top Canopy Dome
    const domeGeo = new THREE.SphereGeometry(0.24, 16, 12);
    const dome = new THREE.Mesh(domeGeo, carbonMat);
    dome.position.set(0, 0.48, -0.05);
    dome.scale.set(1, 0.5, 1.4);
    droneGroup.add(dome);

    // 4 Diagonal Rotor Arms
    const armPositions = [
      { x: 0.6, z: -0.6, ledColor: 0x22c55e },  // Front Right (Green)
      { x: -0.6, z: -0.6, ledColor: 0x22c55e }, // Front Left (Green)
      { x: 0.6, z: 0.6, ledColor: 0xef4444 },   // Rear Right (Red)
      { x: -0.6, z: 0.6, ledColor: 0xef4444 }    // Rear Left (Red)
    ];

    const rotorBlades: THREE.Mesh[] = [];

    armPositions.forEach((pos, idx) => {
      // Carbon arm rod
      const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85);
      const arm = new THREE.Mesh(armGeo, carbonMat);
      arm.position.set(pos.x * 0.5, 0.4, pos.z * 0.5);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = Math.atan2(pos.z, pos.x);
      droneGroup.add(arm);

      // Motor Hub
      const motorGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16);
      const motor = new THREE.Mesh(motorGeo, carbonMat);
      motor.position.set(pos.x, 0.44, pos.z);
      droneGroup.add(motor);

      // Propeller Disc / Blade
      const propGeo = new THREE.BoxGeometry(0.7, 0.015, 0.08);
      const prop = new THREE.Mesh(propGeo, rotorMat);
      prop.name = `RotorBlade_${idx}`;
      prop.position.set(pos.x, 0.52, pos.z);
      droneGroup.add(prop);
      rotorBlades.push(prop);

      // Nav LED
      const armLedMat = new THREE.MeshStandardMaterial({
        color: pos.ledColor,
        emissive: pos.ledColor,
        emissiveIntensity: 2.0
      });
      const ledGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const led = new THREE.Mesh(ledGeo, armLedMat);
      led.position.set(pos.x, 0.38, pos.z);
      droneGroup.add(led);
    });

    // Landing Gear Skids
    const skidGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9);
    const leftSkid = new THREE.Mesh(skidGeo, carbonMat);
    leftSkid.position.set(0.35, 0.18, 0);
    leftSkid.rotation.x = Math.PI / 2;
    droneGroup.add(leftSkid);

    const rightSkid = new THREE.Mesh(skidGeo, carbonMat);
    rightSkid.position.set(-0.35, 0.18, 0);
    rightSkid.rotation.x = Math.PI / 2;
    droneGroup.add(rightSkid);

    // Front Gimbal Camera Sensor
    const sensorGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const sensor = new THREE.Mesh(sensorGeo, carbonMat);
    sensor.position.set(0, 0.34, -0.42);
    droneGroup.add(sensor);

    const lensGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
    const lens = new THREE.Mesh(lensGeo, ledMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0.34, -0.5);
    droneGroup.add(lens);

    // Dual Headlights / Searchlights
    if (config.headlights) {
      const searchlight = new THREE.SpotLight(0xffffff, 3.5, 45, Math.PI / 4, 0.25, 1.2);
      searchlight.name = 'DroneHeadlight';
      searchlight.position.set(0, 0.35, -0.45);
      searchlight.target.position.set(0, -0.5, -8);
      droneGroup.add(searchlight);
      droneGroup.add(searchlight.target);
    }

    group.add(droneGroup);

    // Attached Drone Follow / Chase Camera
    const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1000);
    camera.name = 'PlayerCamera';
    camera.position.set(0, config.cameraHeight, config.cameraDistance);
    camera.lookAt(0, 0.4, -2);
    group.add(camera);

    // Camera Helper
    const camHelper = new THREE.CameraHelper(camera);
    camHelper.name = 'PlayerCameraHelper';
    camHelper.visible = true;
    (camHelper as any).isEditorOnly = true;
    group.add(camHelper);
  }

  /**
   * Process Physics & Controller Movement on each frame during Game Play Mode
   */
  public static updateController(
    player: THREE.Object3D,
    deltaTime: number,
    keys: Record<string, boolean>,
    mouseDelta: { x: number; y: number },
    pointerLocked: boolean
  ) {
    const config: CharacterControllerConfig = player.userData.characterConfig || getDefaultCharacterConfig(player.userData.controllerType || 'fpv');
    const type: ControllerType = player.userData.controllerType || 'fpv';

    if (!player.userData.velocity) {
      player.userData.velocity = new THREE.Vector3();
    }
    const vel: THREE.Vector3 = player.userData.velocity;

    // Mouse Look (Yaw & Pitch) with smooth lerp
    const sens = config.mouseSensitivity || 0.0022;
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
      player.userData.targetYaw = (player.userData.targetYaw ?? player.userData.yaw ?? 0) - mouseDelta.x * sens;
      // Mouse move UP (negative dy) should tilt camera UP (negative pitch rotation around X axis)
      player.userData.targetPitch = (player.userData.targetPitch ?? player.userData.pitch ?? 0) + mouseDelta.y * sens;
      // Clamp Pitch between -85 deg and 85 deg
      player.userData.targetPitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, player.userData.targetPitch));
    }

    const lerpSpeed = Math.min(1.0, deltaTime * 35);
    if (player.userData.targetYaw !== undefined) {
      player.userData.yaw = THREE.MathUtils.lerp(player.userData.yaw || 0, player.userData.targetYaw, lerpSpeed);
    }
    if (player.userData.targetPitch !== undefined) {
      player.userData.pitch = THREE.MathUtils.lerp(player.userData.pitch || 0, player.userData.targetPitch, lerpSpeed);
    }

    const yaw = player.userData.yaw || 0;
    const pitch = player.userData.pitch || 0;

    // Apply rotation to root or camera based on type
    const playerCam = player.getObjectByName('PlayerCamera') as THREE.PerspectiveCamera | null;

    // Crouch & Sprint handling
    const isCrouching = !!keys['ControlLeft'] || !!keys['ControlRight'] || !!keys['KeyC'];
    const isSprinting = !isCrouching && (!!keys['ShiftLeft'] || !!keys['ShiftRight']);

    const targetEyeHeight = isCrouching ? config.eyeHeight * 0.6 : config.eyeHeight;
    player.userData.currentEyeHeight = THREE.MathUtils.lerp(
      player.userData.currentEyeHeight ?? config.eyeHeight,
      targetEyeHeight,
      deltaTime * 10
    );
    const currentEyeHeight = player.userData.currentEyeHeight;

    // Dynamic FOV for sprinting
    if (playerCam) {
      const targetFOV = isSprinting ? 85 : 75;
      if (Math.abs(playerCam.fov - targetFOV) > 0.1) {
        playerCam.fov = THREE.MathUtils.lerp(playerCam.fov, targetFOV, deltaTime * 8);
        playerCam.updateProjectionMatrix();
      }
    }

    if (type === 'fpv') {
      player.rotation.y = yaw;
      if (playerCam) {
        playerCam.rotation.x = pitch;
        playerCam.position.y = currentEyeHeight;
      }

      // Movement Input (W: Forward, S: Backward, A: Left, D: Right)
      let moveForward = 0;
      let moveRight = 0;
      if (keys['KeyW'] || keys['w'] || keys['W'] || keys['ArrowUp']) moveForward += 1;
      if (keys['KeyS'] || keys['s'] || keys['S'] || keys['ArrowDown']) moveForward -= 1;
      if (keys['KeyD'] || keys['d'] || keys['D'] || keys['ArrowRight']) moveRight += 1;
      if (keys['KeyA'] || keys['a'] || keys['A'] || keys['ArrowLeft']) moveRight -= 1;

      const speedMult = isCrouching ? 0.5 : isSprinting ? config.sprintMultiplier : 1.0;
      const speed = config.moveSpeed * speedMult;

      const moveDir = new THREE.Vector3(moveRight, 0, -moveForward);
      if (moveDir.lengthSq() > 0.001) {
        moveDir.normalize();
        moveDir.applyEuler(new THREE.Euler(0, yaw, 0));
        player.position.addScaledVector(moveDir, speed * deltaTime);

        // Head bobbing
        if (config.headBobbing && playerCam && !isCrouching) {
          player.userData.runAnimTimer = (player.userData.runAnimTimer || 0) + deltaTime * (isSprinting ? 14 : 9);
          const bob = Math.sin(player.userData.runAnimTimer) * (isSprinting ? 0.07 : 0.04);
          playerCam.position.y = currentEyeHeight + bob;
        }
      } else if (config.headBobbing && playerCam) {
        playerCam.position.y = THREE.MathUtils.lerp(playerCam.position.y, currentEyeHeight, 0.2);
      }

      // Jump & Gravity
      if (keys['Space'] && player.userData.isGrounded) {
        vel.y = config.jumpForce;
        player.userData.isGrounded = false;
      }

      vel.y -= config.gravity * deltaTime;
      player.position.y += vel.y * deltaTime;

      // Ground Collision
      if (player.position.y <= 0) {
        player.position.y = 0;
        vel.y = 0;
        player.userData.isGrounded = true;
      }
    } else if (type === 'tpv') {
      // Third Person Controller
      let moveForward = 0;
      let moveRight = 0;
      if (keys['KeyW'] || keys['w'] || keys['W'] || keys['ArrowUp']) moveForward += 1;
      if (keys['KeyS'] || keys['s'] || keys['S'] || keys['ArrowDown']) moveForward -= 1;
      if (keys['KeyD'] || keys['d'] || keys['D'] || keys['ArrowRight']) moveRight += 1;
      if (keys['KeyA'] || keys['a'] || keys['A'] || keys['ArrowLeft']) moveRight -= 1;

      const speedMult = isCrouching ? 0.5 : isSprinting ? config.sprintMultiplier : 1.0;
      const speed = config.moveSpeed * speedMult;

      const charModel = player.getObjectByName('CharacterModel');
      const inputVector = new THREE.Vector3(moveRight, 0, -moveForward);
      const isMoving = inputVector.lengthSq() > 0.001;

      if (isMoving) {
        inputVector.normalize();
        // Move relative to camera yaw
        inputVector.applyEuler(new THREE.Euler(0, yaw, 0));
        player.position.addScaledVector(inputVector, speed * deltaTime);

        // Rotate Character model smoothly towards movement vector
        if (charModel) {
          const targetAngle = Math.atan2(inputVector.x, inputVector.z);
          charModel.rotation.y = THREE.MathUtils.lerp(
            charModel.rotation.y,
            targetAngle + Math.PI,
            deltaTime * 12
          );
        }

        // Animate legs & arms
        player.userData.runAnimTimer = (player.userData.runAnimTimer || 0) + deltaTime * (isSprinting ? 16 : 10);
        const stride = Math.sin(player.userData.runAnimTimer) * 0.6;
        const leftLeg = player.getObjectByName('LeftLeg');
        const rightLeg = player.getObjectByName('RightLeg');
        const leftArm = player.getObjectByName('LeftArm');
        const rightArm = player.getObjectByName('RightArm');

        if (leftLeg) leftLeg.rotation.x = stride;
        if (rightLeg) rightLeg.rotation.x = -stride;
        if (leftArm) leftArm.rotation.x = -stride * 0.8;
        if (rightArm) rightArm.rotation.x = stride * 0.8;
      } else {
        // Return limbs to neutral
        const leftLeg = player.getObjectByName('LeftLeg');
        const rightLeg = player.getObjectByName('RightLeg');
        const leftArm = player.getObjectByName('LeftArm');
        const rightArm = player.getObjectByName('RightArm');
        if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.2);
        if (rightLeg) rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.2);
        if (leftArm) leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.2);
        if (rightArm) rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 0.2);
      }

      // Jump & Gravity
      if (keys['Space'] && player.userData.isGrounded) {
        vel.y = config.jumpForce;
        player.userData.isGrounded = false;
      }

      vel.y -= config.gravity * deltaTime;
      player.position.y += vel.y * deltaTime;

      if (player.position.y <= 0) {
        player.position.y = 0;
        vel.y = 0;
        player.userData.isGrounded = true;
      }

      // Position Third Person Orbit Follow Camera
      if (playerCam) {
        const camDist = config.cameraDistance || 4.2;
        const camHeight = config.cameraHeight || 2.0;

        // Calculate offset in spherical coordinates based on pitch and yaw
        const cx = Math.sin(yaw) * Math.cos(pitch) * camDist;
        const cy = camHeight + Math.sin(-pitch) * camDist;
        const cz = Math.cos(yaw) * Math.cos(pitch) * camDist;

        playerCam.position.set(cx, cy, cz);
        playerCam.lookAt(0, 1.4, 0);
      }
    } else if (type === 'drone') {
      // 6-DOF Drone Flight Controller
      player.rotation.y = yaw;

      const isBoosting = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
      const flightSpeed = (config.flightSpeed || 14.0) * (isBoosting ? config.sprintMultiplier : 1.0);
      const ascendSpeed = config.ascendSpeed || 7.0;

      let forward = 0;
      let strafe = 0;
      let vertical = 0;
      let turn = 0;

      if (keys['KeyW'] || keys['w'] || keys['W'] || keys['ArrowUp']) forward += 1;
      if (keys['KeyS'] || keys['s'] || keys['S'] || keys['ArrowDown']) forward -= 1;
      if (keys['KeyD'] || keys['d'] || keys['D'] || keys['ArrowRight']) strafe += 1;
      if (keys['KeyA'] || keys['a'] || keys['A'] || keys['ArrowLeft']) strafe -= 1;
      if (keys['Space']) vertical += 1;
      if (keys['KeyC'] || keys['ControlLeft']) vertical -= 1;
      if (keys['KeyE']) turn += 1;
      if (keys['KeyQ']) turn -= 1;

      // Spin Propeller Blades
      const now = performance.now() * 0.05;
      for (let i = 0; i < 4; i++) {
        const blade = player.getObjectByName(`RotorBlade_${i}`);
        if (blade) {
          blade.rotation.y = now * (i % 2 === 0 ? 1 : -1);
        }
      }

      // Drone Banking & Tilt
      const chassis = player.getObjectByName('DroneChassis');
      if (chassis) {
        const targetPitchTilt = -forward * 0.25;
        const targetRollTilt = -strafe * 0.25;
        chassis.rotation.x = THREE.MathUtils.lerp(chassis.rotation.x, targetPitchTilt, 0.1);
        chassis.rotation.z = THREE.MathUtils.lerp(chassis.rotation.z, targetRollTilt, 0.1);
      }

      // Calculate 3D Flight Vector
      const flightDir = new THREE.Vector3(strafe, 0, -forward);
      if (flightDir.lengthSq() > 0.001) {
        flightDir.normalize();
        flightDir.applyEuler(new THREE.Euler(0, yaw, 0));
        vel.x = THREE.MathUtils.lerp(vel.x, flightDir.x * flightSpeed, 0.1);
        vel.z = THREE.MathUtils.lerp(vel.z, flightDir.z * flightSpeed, 0.1);
      } else {
        vel.x *= config.hoverDamping || 0.94;
        vel.z *= config.hoverDamping || 0.94;
      }

      if (vertical !== 0) {
        vel.y = THREE.MathUtils.lerp(vel.y, vertical * ascendSpeed, 0.1);
      } else {
        vel.y *= config.hoverDamping || 0.94;
      }

      if (turn !== 0) {
        player.userData.yaw += turn * (config.yawSpeed || 2.0) * deltaTime;
      }

      player.position.addScaledVector(vel, deltaTime);

      // Drone Floor Bound
      if (player.position.y < 0.2) {
        player.position.y = 0.2;
        vel.y = 0;
      }

      // Update Drone Camera Pitch
      if (playerCam) {
        playerCam.rotation.x = pitch;
      }
    }
  }
}
