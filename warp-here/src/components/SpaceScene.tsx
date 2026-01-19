"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { GradientTexture, Stars, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useWarpStore } from "@/lib/state";

const easeOutBounce = (t: number) => {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const CameraRig = () => {
  const stress = useWarpStore((state) => state.stress);
  const { camera } = useThree();

  useFrame(() => {
    const targetFov = 50 - stress * 4; // Narrower FOV under stress feels more claustrophobic.
    const targetZ = 3.4 - stress * 0.35; // Subtle dolly-in to embody time pressure.

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08);
      camera.updateProjectionMatrix();
    }
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);
  });

  return null;
};

const Astronaut = ({ visible }: { visible: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Object3D>(null);
  const dustRef = useRef<THREE.Mesh>(null);
  const dropStartRef = useRef<number | null>(null);
  const dustStartRef = useRef<number | null>(null);
  const hopStartRef = useRef<number | null>(null);
  const lastHopTokenRef = useRef(0);
  const { scene: astronautScene } = useGLTF("/assets/astronauta_export.glb");
  const normalizedAstronaut = useMemo(() => {
    const clone = astronautScene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    clone.position.sub(center);

    const maxHeight = Math.max(size.y, 0.001);
    const scale = 0.9 / maxHeight; // Aim for a ~0.9 unit tall astronaut.

    return { scene: clone, scale };
  }, [astronautScene]);

  const env = useWarpStore((state) => state.env);
  const mode = useWarpStore((state) => state.mode);
  const astronautColors = useWarpStore((state) => state.astronautColors);
  const stress = useWarpStore((state) => state.stress);
  const hopToken = useWarpStore((state) => state.hopToken);

  useEffect(() => {
    const resolveColor = (name: string) => {
      if (name.includes("visor") || name.includes("glass")) return astronautColors.visor;
      if (name.includes("helmet")) return astronautColors.helmet;
      if (name.includes("glove")) return astronautColors.gloves;
      if (name.includes("boot") || name.includes("shoe")) return astronautColors.boots;
      if (name.includes("belt")) return astronautColors.belt;
      if (name.includes("pack") || name.includes("backpack"))
        return astronautColors.backpack;
      if (name.includes("trim") || name.includes("accent") || name.includes("stripe"))
        return astronautColors.accents;
      return astronautColors.suit;
    };

    normalizedAstronaut.scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materialList = Array.isArray(child.material)
        ? child.material
        : [child.material];
      const name = `${child.name} ${materialList[0]?.name ?? ""}`.toLowerCase();

      for (const material of materialList) {
        if (!("color" in material)) continue;
        const target = resolveColor(name);
        material.color.set(target);
        if (name.includes("visor") || name.includes("glass")) {
          if ("transparent" in material) {
            material.transparent = true;
            material.opacity = 0.7;
          }
        }
        if ("emissive" in material) {
          material.emissive.set(astronautColors.accents);
          material.emissiveIntensity = 0.06;
        }
        material.needsUpdate = true;
      }
    });
  }, [astronautColors, normalizedAstronaut.scene]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;

    if (mode === "ARRIVED" && dropStartRef.current === null) {
      dropStartRef.current = clock.getElapsedTime();
    }

    if (mode !== "ARRIVED") {
      dropStartRef.current = null;
      dustStartRef.current = null;
      hopStartRef.current = null;
    }

    const elapsed = clock.getElapsedTime();
    const gravityRatio = clamp(env.gravity / 9.8, 0, 1.6);
    const gravityT = clamp(gravityRatio / 1.2, 0, 1);
    const lowGravity = clamp(1 - gravityT, 0, 1);
    // Tuned for readability: low gravity is floaty and tall; high gravity is tight.
    const bobSpeed = lerp(0.35, 1.6, gravityT);
    const bobAmp = lerp(0.18, 0.07, gravityT);
    const bob = Math.sin(elapsed * bobSpeed) * bobAmp;
    const drift =
      (Math.sin(elapsed * 0.28) * 0.05 + Math.cos(elapsed * 0.18) * 0.03) *
      lowGravity;

    const coldShake = Math.max(0, Math.min(1, (0 - env.temperatureC) / 80));
    const hotDroop = Math.max(0, Math.min(1, (env.temperatureC - 40) / 80));
    const shake = Math.sin(elapsed * 18) * 0.02 * coldShake;

    let dropOffset = 0;
    let arrivalSquash = 0;
    if (dropStartRef.current !== null) {
      const t = Math.min((elapsed - dropStartRef.current) / 0.55, 1);
      dropOffset = (1 - easeOutBounce(t)) * 1.0;
      if (t > 0.65) {
        arrivalSquash = Math.sin(((t - 0.65) / 0.35) * Math.PI) * 0.12;
      }
      if (t > 0.75 && dustStartRef.current === null) {
        dustStartRef.current = elapsed;
      }
    }

    if (hopToken !== lastHopTokenRef.current && mode === "ARRIVED") {
      lastHopTokenRef.current = hopToken;
      hopStartRef.current = elapsed;
    }

    let hopOffset = 0;
    if (hopStartRef.current !== null) {
      const hopHeight = lerp(0.18, 0.6, lowGravity);
      const hopDuration = lerp(0.35, 0.8, lowGravity);
      const hopT = (elapsed - hopStartRef.current) / hopDuration;
      if (hopT >= 1) {
        hopStartRef.current = null;
      } else {
        hopOffset = Math.sin(Math.PI * hopT) * hopHeight;
      }
    }

    const breathSpeed = 1.4 + stress * 2.4;
    const breath = Math.sin(elapsed * breathSpeed) * (0.02 + stress * 0.02);
    const postureSquash = stress * 0.08 + arrivalSquash;
    const postureStretch = stress * 0.05 + arrivalSquash * 0.6;

    group.position.y = -0.3 + bob + dropOffset + hopOffset;
    group.position.x = shake + drift;
    group.rotation.z = shake * 0.6;
    group.rotation.x = -0.2 * hotDroop;

    const baseScale = normalizedAstronaut.scale;
    mesh.scale.set(
      baseScale * (1 + postureStretch),
      baseScale * (1 - postureSquash + breath),
      baseScale * (1 + postureStretch)
    );

    if (!normalizedAstronaut.scene.userData.__castShadow) {
      normalizedAstronaut.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
        }
      });
      normalizedAstronaut.scene.userData.__castShadow = true;
    }

    if (dustRef.current) {
      if (dustStartRef.current === null) {
        dustRef.current.visible = false;
      } else {
        const dustT = (elapsed - dustStartRef.current) / 0.6;
        if (dustT >= 1) {
          dustRef.current.visible = false;
          dustStartRef.current = null;
        } else {
          dustRef.current.visible = true;
          const puffScale = lerp(0.4, 1.4, dustT);
          dustRef.current.scale.set(puffScale, puffScale, puffScale);
          const material = dustRef.current.material as THREE.MeshBasicMaterial;
          material.opacity = lerp(0.25, 0, dustT);
        }
      }
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      <primitive
        ref={meshRef}
        object={normalizedAstronaut.scene}
        position={[0, -0.05, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <mesh ref={dustRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#b7c3d6" transparent opacity={0} />
      </mesh>
    </group>
  );
};

const Ground = ({ visible }: { visible: boolean }) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} visible={visible}>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color="#1f2d45" roughness={1} />
    </mesh>
  );
};

const SceneContents = () => {
  const env = useWarpStore((state) => state.env);
  const mode = useWarpStore((state) => state.mode);
  const farParticleRef = useRef<THREE.Points>(null);
  const nearParticleRef = useRef<THREE.Points>(null);
  const streakRef = useRef<THREE.LineSegments>(null);
  const fogNearRef = useRef<THREE.Mesh>(null);
  const fogFarRef = useRef<THREE.Mesh>(null);

  const farParticles = useMemo(() => {
    const count = 700;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 30 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.7;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  const nearParticles = useMemo(() => {
    const count = 320;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 8 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.6;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  const fogTexture = useMemo(() => {
    const size = 64;
    const data = new Uint8Array(size * size);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.floor(Math.random() * 255);
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.AlphaFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.5, 2.5); // Small repeat keeps noise soft, not blocky.
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Line streaks appear only during scaling to sell motion.
  const streaks = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 6);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const x = (Math.random() - 0.5) * 18;
      const y = (Math.random() - 0.5) * 10;
      const z = -20 - Math.random() * 50;
      const length = 0.6 + Math.random() * 1.2;

      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z - length;

      speeds[i] = 0.6 + Math.random() * 1.4;
    }
    return { positions, speeds };
  }, []);

  useFrame(({ clock }, delta) => {
    if (farParticleRef.current) {
      const t = clock.getElapsedTime();
      farParticleRef.current.rotation.y = t * 0.015;
      farParticleRef.current.rotation.x = Math.sin(t * 0.03) * 0.02;
    }

    if (nearParticleRef.current) {
      const t = clock.getElapsedTime();
      nearParticleRef.current.rotation.y = -t * 0.03;
      nearParticleRef.current.rotation.x = Math.sin(t * 0.05) * 0.03;
    }

    if (fogNearRef.current) {
      const t = clock.getElapsedTime();
      fogNearRef.current.position.y = -0.2 + Math.sin(t * 0.08) * 0.4;
      fogNearRef.current.rotation.z = Math.sin(t * 0.05) * 0.04;
    }

    if (fogFarRef.current) {
      const t = clock.getElapsedTime();
      fogFarRef.current.position.y = 0.6 + Math.sin(t * 0.06) * 0.3;
      fogFarRef.current.rotation.z = -Math.sin(t * 0.04) * 0.03;
    }

    if (streakRef.current) {
      const material = streakRef.current.material as THREE.LineBasicMaterial;
      const targetOpacity = mode === "SCALING" ? 0.55 : 0.12;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.1);

      if (material.opacity > 0.01) {
        const positions = streakRef.current.geometry.attributes.position
          .array as Float32Array;
        for (let i = 0; i < streaks.speeds.length; i += 1) {
          const speed = streaks.speeds[i] * (mode === "SCALING" ? 16 : 2);
          const zIndex = i * 6 + 2;
          const zStart = positions[zIndex];
          const nextZ = zStart + speed * delta;
          const resetZ = -70;
          const length = positions[zIndex] - positions[zIndex + 3];

          if (nextZ > 2) {
            const x = (Math.random() - 0.5) * 18;
            const y = (Math.random() - 0.5) * 10;
            positions[zIndex - 2] = x;
            positions[zIndex - 1] = y;
            positions[zIndex] = resetZ;
            positions[zIndex + 1] = x;
            positions[zIndex + 2] = y;
            positions[zIndex + 3] = resetZ - length;
          } else {
            positions[zIndex] = nextZ;
            positions[zIndex + 3] = nextZ - length;
          }
        }
        streakRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} />
      <Stars
        radius={120}
        depth={60}
        count={1600}
        factor={2 + env.radiation * 1.5}
        saturation={0.2 + env.radiation * 0.6}
        fade
      />
      {/* Two particle layers simulate depth of field without post-processing. */}
      <points ref={farParticleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[farParticles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#bcd8ff"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </points>
      <points ref={nearParticleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nearParticles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.14}
          color="#e6f2ff"
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={streakRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[streaks.positions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#e9f6ff"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </lineSegments>
      <mesh ref={fogFarRef} position={[0, 0.6, -2]} rotation={[0, 0, 0.12]}>
        <planeGeometry args={[8, 4]} />
        <meshBasicMaterial
          alphaMap={fogTexture}
          color="#93b9ff"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={fogNearRef} position={[0, -0.2, 0.6]} rotation={[0, 0, -0.12]}>
        <planeGeometry args={[6, 3]} />
        <meshBasicMaterial
          alphaMap={fogTexture}
          color="#b8d7ff"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
      {/* Inverted sphere adds a subtle tint without flattening the stars. */}
      <mesh scale={120}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide} transparent opacity={0.12} depthWrite={false}>
          <GradientTexture
            stops={[0, 0.6, 1]}
            colors={["#05070f", "#0a1630", "#0c2142"]}
          />
        </meshBasicMaterial>
      </mesh>
      <Ground visible={mode === "ARRIVED"} />
      <Astronaut visible={mode === "ARRIVED"} />
      <CameraRig />
    </>
  );
};

export const SpaceScene = () => {
  return (
    <Canvas
      className="absolute inset-0 z-10"
      camera={{ position: [0, 0.4, 3.4], fov: 50 }}
      dpr={[1, 1.6]}
      shadows
    >
      <SceneContents />
    </Canvas>
  );
};

useGLTF.preload("/assets/astronauta_export.glb");
