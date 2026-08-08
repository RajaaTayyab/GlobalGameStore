"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const CHROME_HEX = 0xc9af8c;

export default function Hero3DScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const wireframeMat = new THREE.LineBasicMaterial({
      color: CHROME_HEX,
      transparent: true,
      opacity: 0.05,
    });

    // Distant wireframe sphere — suggests a "vault" / containment field
    const sphereWire = new THREE.WireframeGeometry(new THREE.SphereGeometry(10, 24, 16));
    const sphere = new THREE.LineSegments(sphereWire, wireframeMat);
    scene.add(sphere);

    // Distant wireframe cube — adds structure / gaming feel
    const cubeWire = new THREE.EdgesGeometry(new THREE.BoxGeometry(18, 18, 18));
    const cube = new THREE.LineSegments(cubeWire, wireframeMat);
    cube.rotation.set(0.4, 0.6, 0);
    scene.add(cube);

    // Subtle grid plane receding into depth
    const gridHelper = new THREE.GridHelper(40, 12, CHROME_HEX, CHROME_HEX);
    (gridHelper.material as THREE.Material).opacity = 0.03;
    (gridHelper.material as THREE.Material).transparent = true;
    gridHelper.position.y = -6;
    gridHelper.rotation.x = Math.PI / 2.5;
    scene.add(gridHelper);

    // Very subtle particle field — digital dust
    const particleCount = 50;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 6 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 2;
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: CHROME_HEX,
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    mount.addEventListener("mousemove", handleMouseMove);

    let frame = 0;
    const animate = () => {
      frame++;
      const time = frame * 0.0008;

      sphere.rotation.y = Math.sin(time * 0.3) * 0.03;
      sphere.rotation.x = Math.cos(time * 0.2) * 0.02;

      cube.rotation.y = time * 0.02;
      cube.rotation.x = time * 0.01;

      particles.rotation.y += 0.00003;

      // Subtle mouse parallax
      sphere.rotation.y += mouseRef.current.x * 0.01;
      sphere.rotation.x += mouseRef.current.y * 0.01;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      mount.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 -z-10" aria-hidden="true" />;
}