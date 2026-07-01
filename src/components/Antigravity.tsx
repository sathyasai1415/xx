/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface AntigravityInnerProps {
  count?: number;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  particleSize?: number;
  lerpSpeed?: number;
  color?: string;
  autoAnimate?: boolean;
  particleVariance?: number;
  rotationSpeed?: number;
  depthFactor?: number;
  pulseSpeed?: number;
  particleShape?: 'capsule' | 'sphere' | 'box' | 'tetrahedron';
  fieldStrength?: number;
}

const AntigravityInner = ({
  count = 300, magnetRadius = 10, ringRadius = 10, waveSpeed = 0.4,
  waveAmplitude = 1, particleSize = 2, lerpSpeed = 0.1, color = '#FF9FFC',
  autoAnimate = false, particleVariance = 1, rotationSpeed = 0, depthFactor = 1,
  pulseSpeed = 3, particleShape = 'capsule', fieldStrength = 10,
}: AntigravityInnerProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMouseMoveTime = useRef(0);
  const virtualMouse = useRef({ x: 0, y: 0 });

  const particles = useMemo(() => {
    const temp = [];
    const width = viewport.width || 100;
    const height = viewport.height || 100;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const z = (Math.random() - 0.5) * 20;
      temp.push({
        t: Math.random() * 100,
        speed: 0.01 + Math.random() / 200,
        mx: x, my: y, mz: z, cx: x, cy: y, cz: z,
        randomRadiusOffset: (Math.random() - 0.5) * 2,
      });
    }
    return temp;
  }, [count, viewport.width, viewport.height]);

  useFrame(state => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { viewport: v, pointer: m } = state;

    const mouseDist = Math.sqrt((m.x - lastMousePos.current.x) ** 2 + (m.y - lastMousePos.current.y) ** 2);
    if (mouseDist > 0.001) { lastMouseMoveTime.current = Date.now(); lastMousePos.current = { x: m.x, y: m.y }; }

    let destX = (m.x * v.width) / 2;
    let destY = (m.y * v.height) / 2;

    if (autoAnimate && Date.now() - lastMouseMoveTime.current > 2000) {
      const time = state.clock.getElapsedTime();
      destX = Math.sin(time * 0.5) * (v.width / 4);
      destY = Math.cos(time) * (v.height / 4);
    }

    virtualMouse.current.x += (destX - virtualMouse.current.x) * 0.05;
    virtualMouse.current.y += (destY - virtualMouse.current.y) * 0.05;

    const targetX = virtualMouse.current.x;
    const targetY = virtualMouse.current.y;
    const globalRotation = state.clock.getElapsedTime() * rotationSpeed;

    particles.forEach((particle, i) => {
      particle.t += particle.speed / 2;
      const { t, mx, my, mz, randomRadiusOffset } = particle;

      const projFactor = 1 - particle.cz / 50;
      const projX = targetX * projFactor;
      const projY = targetY * projFactor;

      const dx = mx - projX, dy = my - projY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let targetPos = { x: mx, y: my, z: mz * depthFactor };

      if (dist < magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation;
        const wave = Math.sin(t * waveSpeed + angle) * 0.5 * waveAmplitude;
        const dev = randomRadiusOffset * (5 / (fieldStrength + 0.1));
        const r = ringRadius + wave + dev;
        targetPos = {
          x: projX + r * Math.cos(angle),
          y: projY + r * Math.sin(angle),
          z: mz * depthFactor + Math.sin(t) * waveAmplitude * depthFactor,
        };
      }

      particle.cx += (targetPos.x - particle.cx) * lerpSpeed;
      particle.cy += (targetPos.y - particle.cy) * lerpSpeed;
      particle.cz += (targetPos.z - particle.cz) * lerpSpeed;

      dummy.position.set(particle.cx, particle.cy, particle.cz);
      dummy.lookAt(projX, projY, particle.cz);
      dummy.rotateX(Math.PI / 2);

      const distFromRing = Math.abs(Math.sqrt((particle.cx - projX) ** 2 + (particle.cy - projY) ** 2) - ringRadius);
      const scaleFactor = Math.max(0, Math.min(1, 1 - distFromRing / 10));
      const finalScale = scaleFactor * (0.8 + Math.sin(t * pulseSpeed) * 0.2 * particleVariance) * particleSize;
      dummy.scale.setScalar(finalScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {particleShape === 'capsule' && <capsuleGeometry args={[0.1, 0.4, 4, 8]} />}
      {particleShape === 'sphere' && <sphereGeometry args={[0.2, 16, 16]} />}
      {particleShape === 'box' && <boxGeometry args={[0.3, 0.3, 0.3]} />}
      {particleShape === 'tetrahedron' && <tetrahedronGeometry args={[0.3]} />}
      <meshBasicMaterial color={color} />
    </instancedMesh>
  );
};

const Antigravity = (props: AntigravityInnerProps) => (
  <Canvas camera={{ position: [0, 0, 50], fov: 35 }}>
    <AntigravityInner {...props} />
  </Canvas>
);

export default Antigravity;
