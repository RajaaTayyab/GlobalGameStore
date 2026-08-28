"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/* Floating chat-bubble orbs for the contact page. Themed like a smaller
   cousin of the hero globe: chrome + instock palette, additive halo
   rings, mouse parallax, soft bloom, and theme-aware. The "bubbles" are
   rounded chrome spheres with a small tail (a tiny offset sphere)
   suggesting a speech bubble, orbited by an instock ring. */
const THEME_KEY = "gts-theme";

const DARK = {
  chrome: new THREE.Color(0xc9af8c),
  instock: new THREE.Color(0x5fae87),
  glow: 0.35,
  exposure: 0.95,
  bubbleOpacity: 0.22,
  ringOpacity: 0.12,
  tailOpacity: 0.22,
  particleOpacity: 0.16,
};
const LIGHT = {
  chrome: new THREE.Color(0x8a6b45),
  instock: new THREE.Color(0x2b6e4c),
  glow: 0.25,
  exposure: 0.9,
  bubbleOpacity: 0.24,
  ringOpacity: 0.16,
  tailOpacity: 0.26,
  particleOpacity: 0.14,
};

interface Bubble {
  group: THREE.Group;
  base: THREE.Vector3;
  speed: number;
  phase: number;
  wobble: number;
}

export default function ContactHero3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const readTheme = (): number => {
      const mode =
        document.documentElement.getAttribute("data-mode") ||
        localStorage.getItem(THEME_KEY);
      return mode === "light" ? 1 : 0;
    };

    let disposed = false;
    try {
      const scene = new THREE.Scene();
      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || window.innerHeight;
      const isMobile = width < 768;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0, 14);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = DARK.exposure;
      mount.appendChild(renderer.domElement);

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        DARK.glow,
        0.6,
        0.6
      );
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());

      const active = {
        chrome: DARK.chrome.clone(),
        instock: DARK.instock.clone(),
      };
      let mix = readTheme();
      let themeTarget = mix;
      const interp = (a: number, b: number) => a + (b - a) * mix;

      /* ---------- Chat-bubble orbs ---------- */
      const bubbles: Bubble[] = [];
      const bubbleGroup = new THREE.Group();
      const count = 5;
      for (let i = 0; i < count; i++) {
        const grp = new THREE.Group();
        const radius = 0.22 + Math.random() * 0.16;
        const mainMat = new THREE.MeshBasicMaterial({
          color: active.chrome,
          transparent: true,
          opacity: interp(DARK.bubbleOpacity, LIGHT.bubbleOpacity),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const main = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 20), mainMat);

        // Tiny "tail" sphere offset below = speech-bubble cue
        const tailMat = new THREE.MeshBasicMaterial({
          color: active.instock,
          transparent: true,
          opacity: interp(DARK.tailOpacity, LIGHT.tailOpacity),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const tail = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 0.4, 14, 12),
          tailMat
        );
        tail.position.set(radius * 0.5, -radius * 0.8, 0);

        // Instock halo ring
        const ringMat = new THREE.MeshBasicMaterial({
          color: active.instock,
          transparent: true,
          opacity: interp(DARK.ringOpacity, LIGHT.ringOpacity),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 1.6, radius * 0.04, 8, 56),
          ringMat
        );
        ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.6;
        ring.rotation.z = (Math.random() - 0.5) * 0.6;

        grp.add(main, tail, ring);

        // Keep the orbs out of the horizontal centre where the heading sits.
        const orbitR = 2.8 + Math.random() * 1.4;
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const base = new THREE.Vector3(
          Math.cos(angle) * orbitR,
          (Math.random() - 0.5) * 2.0,
          Math.sin(angle) * orbitR
        );
        grp.position.copy(base);
        grp.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          0
        );

        bubbles.push({
          group: grp,
          base,
          speed: 0.18 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          wobble: 0.2 + Math.random() * 0.4,
        });
        bubbleGroup.add(grp);
      }
      scene.add(bubbleGroup);

      /* ---------- Particle dust ---------- */
      const particleCount = 160;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const r = 3 + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        color: active.chrome,
        size: 0.04,
        sizeAttenuation: true,
        transparent: true,
        opacity: interp(DARK.particleOpacity, LIGHT.particleOpacity),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      /* ---------- Interaction ---------- */
      const handleMouseMove = (e: MouseEvent) => {
        const rect = mount.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };
      mount.addEventListener("mousemove", handleMouseMove);

      const themeObserver = new MutationObserver(() => {
        themeTarget = readTheme();
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-mode"],
      });

      let frame = 0;
      const animate = () => {
        if (disposed) return;
        frame++;
        const time = frame * 0.001;

        mix += (themeTarget - mix) * 0.06;
        if (Math.abs(mix - themeTarget) < 0.0005) mix = themeTarget;
        active.chrome.lerpColors(DARK.chrome, LIGHT.chrome, mix);
        active.instock.lerpColors(DARK.instock, LIGHT.instock, mix);

        const dim = isMobile ? 0.6 : 1;
        bloomPass.strength = interp(DARK.glow, LIGHT.glow) * dim;
        renderer.toneMappingExposure = interp(DARK.exposure, LIGHT.exposure);
        pMat.opacity = interp(DARK.particleOpacity, LIGHT.particleOpacity) * dim;

        for (const b of bubbles) {
          const a = time * b.speed + b.phase;
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          b.group.position.x = b.base.x * cos - b.base.z * sin;
          b.group.position.z = b.base.x * sin + b.base.z * cos;
          b.group.position.y =
            b.base.y + Math.sin(time * b.wobble + b.phase) * 0.5;
          b.group.rotation.y += 0.004;
          b.group.rotation.x = Math.sin(time * 0.4 + b.phase) * 0.25;
        }
        bubbleGroup.rotation.y = time * 0.03;
        particles.rotation.y = time * 0.008;

        // Gentle mouse parallax on the whole cluster
        bubbleGroup.rotation.y +=
          (mouseRef.current.x * 0.05 - bubbleGroup.rotation.y + time * 0.03) * 0.02;
        bubbleGroup.rotation.x +=
          (-mouseRef.current.y * 0.04 - bubbleGroup.rotation.x) * 0.02;

        composer.render();
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        if (!mount || disposed) return;
        const w = mount.clientWidth || window.innerWidth;
        const h = mount.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
      };
      const ro = new ResizeObserver(handleResize);
      ro.observe(mount);

      return () => {
        disposed = true;
        cancelAnimationFrame(animationRef.current);
        mount.removeEventListener("mousemove", handleMouseMove);
        ro.disconnect();
        themeObserver.disconnect();
        composer.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
        scene.traverse((obj) => {
          if (
            obj instanceof THREE.Mesh ||
            obj instanceof THREE.LineSegments ||
            obj instanceof THREE.Points
          ) {
            obj.geometry.dispose();
            const m = obj.material as THREE.Material | THREE.Material[];
            if (Array.isArray(m)) m.forEach((x) => x.dispose());
            else m.dispose();
          }
        });
      };
    } catch (err) {
      console.warn("[ContactHero3D] WebGL init failed:", err);
      return;
    }
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-auto absolute inset-0"
      aria-hidden="true"
    />
  );
}
