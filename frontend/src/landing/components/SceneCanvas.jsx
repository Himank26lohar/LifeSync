import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";

function AmbientShapes() {
  const group = useRef(null);

  useFrame((state) => {
    if (!group.current) {
      return;
    }

    const elapsed = state.clock.getElapsedTime();
    group.current.rotation.z = elapsed * 0.03;
  });

  return (
    <group ref={group}>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.35}>
        <Sphere args={[1.15, 48, 48]} position={[-1.35, 0.45, -0.5]}>
          <MeshDistortMaterial color="#7C5CFF" distort={0.2} speed={1.2} transparent opacity={0.42} />
        </Sphere>
      </Float>

      <Float speed={1.2} rotationIntensity={0.18} floatIntensity={0.28}>
        <Sphere args={[0.85, 48, 48]} position={[1.2, -0.2, 0.2]}>
          <MeshDistortMaterial color="#00D4FF" distort={0.18} speed={1.1} transparent opacity={0.34} />
        </Sphere>
      </Float>

      <Float speed={0.9} rotationIntensity={0.12} floatIntensity={0.24}>
        <Sphere args={[0.46, 48, 48]} position={[0.25, 1.05, -0.2]}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.08} />
        </Sphere>
      </Float>
    </group>
  );
}

export default function SceneCanvas() {
  return (
    <div className="scene-canvas scene-canvas--ambient">
      <Canvas camera={{ position: [0, 0, 4.8], fov: 40 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.1} />
          <pointLight color="#7C5CFF" intensity={18} distance={8} position={[-2, 1.5, 2]} />
          <pointLight color="#00D4FF" intensity={16} distance={8} position={[2, -1, 2]} />
          <AmbientShapes />
        </Suspense>
      </Canvas>
    </div>
  );
}
