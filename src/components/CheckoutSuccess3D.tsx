"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/* 3D gift box for the checkout success screen: a chrome cube wrapped with
   an oxblood ribbon (two crossed torus bands + a bow on top), a subtle
   instock inner glow, and sparkle particles that pop outward on a loop.
   Theme-aware (dark/light) like the hero scene. */
const THEME_KEY = "gts-theme";

const DARK = {
  chrome: new THREE.Color(0xc9af8c),
  oxblood: new THREE.Color(0xa8465a),
  instock: new THREE.Color(0x5fae87),
  glow: 0.85,
  exposure: 1.2,
  boxOpacity: 0.5,
  ribbonOpacity: 0.7,
  glowOpacity: 0.25,
  sparkleOpacity: 0.7,
};
const LIGHT = {
  chrome: new THREE.Color(0x8a6b45),
  oxblood: new THREE.Color(0x7a2432),
  instock: new THREE.Color(0x2b6e4c),
  glow: 0.7,
  exposure: 1.08,
  boxOpacity: 0.55,
  ribbonOpacity: 0.78,
  glowOpacity: 0.22,
  sparkleOpacity: 0.6,
};

interface Sparkle {
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  speed: number;
  phase: number;
  axis: THREE.Vector3;
}

export default function CheckoutSuccess3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

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
      const width = mount.clientWidth || 240;
      const height = mount.clientHeight || 240;

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.4, 6.2);

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
        0.9,
        0.2
      );
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());

      const active = {
        chrome: DARK.chrome.clone(),
        oxblood: DARK.oxblood.clone(),
        instock: DARK.instock.clone(),
      };
      let mix = readTheme();
      let themeTarget = mix;
      const interp = (a: number, b: number) => a + (b - a) * mix;

      const present = new THREE.Group();

      /* Chrome gift box (wireframe edges so it reads as a clean "vault" box,
         matching the brand language, not a solid surface). */
      const boxGeo = new THREE.BoxGeometry(2.2, 2.2, 2.2);
      const boxEdges = new THREE.EdgesGeometry(boxGeo);
      const boxMat = new THREE.LineBasicMaterial({
        color: active.chrome,
        transparent: true,
        opacity: interp(DARK.boxOpacity, LIGHT.boxOpacity),
      });
      const box = new THREE.LineSegments(boxEdges, boxMat);
      present.add(box);

      // Faint additive inner glow sphere (suggests "something inside")
      const glowMat = new THREE.MeshBasicMaterial({
        color: active.instock,
        transparent: true,
        opacity: interp(DARK.glowOpacity, LIGHT.glowOpacity),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 24), glowMat);
      present.add(glow);

      /* Oxblood ribbon: two perpendicular torus bands around the box */
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: active.oxblood,
        transparent: true,
        opacity: interp(DARK.ribbonOpacity, LIGHT.ribbonOpacity),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(1.12, 0.07, 12, 96),
        ribbonMat
      );
      ring1.rotation.x = Math.PI / 2;
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.12, 0.07, 12, 96),
        ribbonMat
      );
      ring2.rotation.y = Math.PI / 2;
      const ring3 = new THREE.Mesh(
        new THREE.TorusGeometry(1.12, 0.07, 12, 96),
        ribbonMat
      );
      ring3.rotation.z = Math.PI / 2;
      present.add(ring1, ring2, ring3);

      // Bow on top: two small loops + a knot
      const bowMat = ribbonMat.clone();
      const bow1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.06, 10, 48),
        bowMat
      );
      bow1.position.set(0.32, 1.12, 0);
      bow1.rotation.set(Math.PI / 2, 0, -0.4);
      const bow2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.06, 10, 48),
        bowMat
      );
      bow2.position.set(-0.32, 1.12, 0);
      bow2.rotation.set(Math.PI / 2, 0, 0.4);
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), bowMat);
      knot.position.set(0, 1.18, 0);
      present.add(bow1, bow2, knot);

      scene.add(present);

      /* Sparkle particles that orbit + pulse outward */
      const sparkles: Sparkle[] = [];
      const sparkleGroup = new THREE.Group();
      const sparkleCount = 28;
      for (let i = 0; i < sparkleCount; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? active.chrome : active.instock,
          transparent: true,
          opacity: interp(DARK.sparkleOpacity, LIGHT.sparkleOpacity),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.07 + Math.random() * 0.05, 0),
          mat
        );
        const base = new THREE.Vector3(
          (Math.random() - 0.5) * 3.4,
          (Math.random() - 0.5) * 3.4,
          (Math.random() - 0.5) * 3.4
        );
        mesh.position.copy(base);
        sparkles.push({
          mesh,
          base,
          speed: 0.5 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          axis: new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize(),
        });
        sparkleGroup.add(mesh);
      }
      scene.add(sparkleGroup);

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
        active.oxblood.lerpColors(DARK.oxblood, LIGHT.oxblood, mix);
        active.instock.lerpColors(DARK.instock, LIGHT.instock, mix);

        bloomPass.strength = interp(DARK.glow, LIGHT.glow);
        renderer.toneMappingExposure = interp(DARK.exposure, LIGHT.exposure);
        boxMat.opacity = interp(DARK.boxOpacity, LIGHT.boxOpacity);
        ribbonMat.opacity = interp(DARK.ribbonOpacity, LIGHT.ribbonOpacity);
        glowMat.opacity = interp(DARK.glowOpacity, LIGHT.glowOpacity);

        // Present: gentle float + slow rotation
        present.position.y = Math.sin(time * 0.9) * 0.18;
        present.rotation.y = time * 0.35;
        present.rotation.x = Math.sin(time * 0.4) * 0.12;
        glow.scale.setScalar(1 + Math.sin(time * 2.2) * 0.08);

        // Sparkles: orbit + breathe outward
        sparkleGroup.rotation.y = time * 0.12;
        sparkleGroup.rotation.x = time * 0.07;
        for (const s of sparkles) {
          const t = (time * s.speed + s.phase) % 1;
          const r = 1.2 + Math.sin(t * Math.PI) * 0.6;
          s.mesh.position.set(
            s.base.x * r,
            s.base.y * r,
            s.base.z * r
          );
          s.mesh.rotation.x += 0.03;
          s.mesh.rotation.y += 0.04;
        }

        composer.render();
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        if (!mount || disposed) return;
        const w = mount.clientWidth || 240;
        const h = mount.clientHeight || 240;
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
      console.warn("[CheckoutSuccess3D] WebGL init failed:", err);
      return;
    }
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
  );
}
