"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/* Vault & Chrome palette — chrome gold is dominant (dark), with oxblood as a
   rose counter-light and instock as a cold accent. Light mode shifts every hue
   to the theme's softer values so the scene reads "premium" in both modes
   instead of fighting the surrounding UI. */
const THEME_KEY = "gts-theme";

const DARK = {
  chrome: new THREE.Color(0xc9af8c),
  oxblood: new THREE.Color(0xa8465a),
  instock: new THREE.Color(0x5fae87),
  glow: 1.15,
  exposure: 1.18,
  coreOpacity: 0.16,
  brightOpacity: 0.5,
  icosaOpacity: 0.5,
  shellOpacity: 0.08,
  ringOpacity: 0.22,
  ring2Opacity: 0.14,
  ring3Opacity: 0.3,
  chipOpacity: 0.72,
  particleOpacity: 0.5,
  gridOpacity: 0.055,
};

const LIGHT = {
  chrome: new THREE.Color(0x8a6b45),
  oxblood: new THREE.Color(0x7a2432),
  instock: new THREE.Color(0x2b6e4c),
  glow: 0.9,
  exposure: 1.05,
  coreOpacity: 0.12,
  brightOpacity: 0.42,
  icosaOpacity: 0.62,
  shellOpacity: 0.1,
  ringOpacity: 0.3,
  ring2Opacity: 0.18,
  ring3Opacity: 0.36,
  chipOpacity: 0.8,
  particleOpacity: 0.38,
  gridOpacity: 0.07,
};

interface Chip {
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  speed: number;
  phase: number;
}

export default function Hero3DScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

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

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 0, 13);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      const dpr = Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 2);
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = DARK.exposure;
      mount.appendChild(renderer.domElement);

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        DARK.glow,
        0.75,
        0.12
      );
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());

      /* Shared colour instances let every material re-tint live as the theme
         lerps, with zero per-frame allocations. */
      const active = {
        chrome: DARK.chrome.clone(),
        oxblood: DARK.oxblood.clone(),
        instock: DARK.instock.clone(),
      };
      let mix = readTheme(); // 0 = dark, 1 = light
      let themeTarget = mix;

      const interp = (a: number, b: number) => a + (b - a) * mix;

      /* ---------- Energy core ---------- */
      const coreMat = new THREE.MeshBasicMaterial({
        color: active.chrome,
        transparent: true,
        opacity: interp(DARK.coreOpacity, LIGHT.coreOpacity),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const core = new THREE.Mesh(new THREE.SphereGeometry(1.35, 48, 32), coreMat);

      const brightMat = new THREE.MeshBasicMaterial({
        color: active.chrome,
        transparent: true,
        opacity: interp(DARK.brightOpacity, LIGHT.brightOpacity),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const bright = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 24), brightMat);

      /* Wireframe vault casing */
      const icosaMat = new THREE.LineBasicMaterial({
        color: active.chrome,
        transparent: true,
        opacity: interp(DARK.icosaOpacity, LIGHT.icosaOpacity),
      });
      const icosa = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.5, 1)),
        icosaMat
      );

      const shellMat = new THREE.LineBasicMaterial({
        color: active.chrome,
        transparent: true,
        opacity: interp(DARK.shellOpacity, LIGHT.shellOpacity),
      });
      const shell = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.SphereGeometry(4.6, 20, 14)),
        shellMat
      );

      /* Halo rings — thin additive tori read as "containment/portal" */
      const ringMat = new THREE.MeshBasicMaterial({
        color: active.chrome,
        transparent: true,
        opacity: interp(DARK.ringOpacity, LIGHT.ringOpacity),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.028, 12, 128), ringMat);
      ring.rotation.x = Math.PI / 2.15;

      const ring2Mat = ringMat.clone();
      ring2Mat.color = active.oxblood;
      ring2Mat.opacity = interp(DARK.ring2Opacity, LIGHT.ring2Opacity);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.02, 12, 128), ring2Mat);
      ring2.rotation.set(Math.PI / 2.4, 0.35, 0);

      const ring3Mat = ringMat.clone();
      ring3Mat.color = active.instock;
      ring3Mat.opacity = interp(DARK.ring3Opacity, LIGHT.ring3Opacity);
      const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.016, 12, 96), ring3Mat);
      ring3.rotation.x = Math.PI / 2;

      const heroGroup = new THREE.Group();
      heroGroup.position.set(0.45, -0.15, 0);
      heroGroup.add(core, bright, icosa, shell, ring, ring2, ring3);
      scene.add(heroGroup);

      /* ---------- Floating currency chips ---------- */
      const chips: Chip[] = [];
      const chipGroup = new THREE.Group();
      const chipCount = 14;
      const CHIP_COLORS = [active.chrome, active.chrome, active.chrome, active.oxblood, active.instock];
      for (let i = 0; i < chipCount; i++) {
        const isCoin = Math.random() > 0.45;
        const geo = isCoin
          ? new THREE.BoxGeometry(0.3, 0.3, 0.07)
          : new THREE.OctahedronGeometry(0.17, 0);
        const mat = new THREE.MeshBasicMaterial({
          color: CHIP_COLORS[i % CHIP_COLORS.length],
          transparent: true,
          opacity: interp(DARK.chipOpacity, LIGHT.chipOpacity),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);

        const radius = 2.7 + Math.random() * 2.9;
        const angle = (i / chipCount) * Math.PI * 2 + Math.random() * 0.5;
        const base = new THREE.Vector3(
          Math.cos(angle) * radius,
          (Math.random() - 0.35) * 3.2,
          Math.sin(angle) * radius
        );
        mesh.position.copy(base);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        chips.push({
          mesh,
          base,
          speed: 0.25 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
        });
        chipGroup.add(mesh);
      }
      scene.add(chipGroup);

      /* ---------- Particle field (digital dust) ---------- */
      const particleCount = 520;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const isDust = Math.random() < 0.22;
        if (isDust) {
          positions[i * 3] = (Math.random() - 0.5) * 20;
          positions[i * 3 + 1] = (Math.random() - 0.2) * 8;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 4;
        } else {
          const r = 4 + Math.random() * 5;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 1.2;
          positions[i * 3 + 2] = r * Math.cos(phi);
        }
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: active.chrome,
        size: 0.055,
        sizeAttenuation: true,
        transparent: true,
        opacity: interp(DARK.particleOpacity, LIGHT.particleOpacity),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      /* ---------- Floor grid ---------- */
      const gridHelper = new THREE.GridHelper(34, 26, active.chrome, active.chrome);
      const gridMat = gridHelper.material as THREE.LineBasicMaterial;
      gridMat.color = active.chrome;
      gridMat.transparent = true;
      gridMat.opacity = interp(DARK.gridOpacity, LIGHT.gridOpacity);
      gridHelper.position.set(0, -5.6, -2);
      gridHelper.rotation.x = Math.PI / 2.6;
      scene.add(gridHelper);

      /* ---------- Interaction ---------- */
      const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -((e.clientY / window.innerHeight) * 2) + 1;
      };
      window.addEventListener("mousemove", handleMouseMove);

      const themeObserver = new MutationObserver(() => {
        const mode =
          document.documentElement.getAttribute("data-mode") ||
          localStorage.getItem(THEME_KEY);
        themeTarget = mode === "light" ? 1 : 0;
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-mode"],
      });

      /* ---------- Render loop ---------- */
      let frame = 0;
      const animate = () => {
        if (disposed) return;
        frame++;
        const time = frame * 0.001;

        // Ease theme blend so switching modes feels like a dimmer, not a cut
        mix += (themeTarget - mix) * 0.07;
        if (Math.abs(mix - themeTarget) < 0.0005) mix = themeTarget;

        active.chrome.lerpColors(DARK.chrome, LIGHT.chrome, mix);
        active.oxblood.lerpColors(DARK.oxblood, LIGHT.oxblood, mix);
        active.instock.lerpColors(DARK.instock, LIGHT.instock, mix);

        coreMat.opacity = interp(DARK.coreOpacity, LIGHT.coreOpacity);
        brightMat.opacity = interp(DARK.brightOpacity, LIGHT.brightOpacity);
        icosaMat.opacity = interp(DARK.icosaOpacity, LIGHT.icosaOpacity);
        shellMat.opacity = interp(DARK.shellOpacity, LIGHT.shellOpacity);
        ringMat.opacity = interp(DARK.ringOpacity, LIGHT.ringOpacity);
        ring2Mat.opacity = interp(DARK.ring2Opacity, LIGHT.ring2Opacity);
        ring3Mat.opacity = interp(DARK.ring3Opacity, LIGHT.ring3Opacity);
        particleMat.opacity = interp(DARK.particleOpacity, LIGHT.particleOpacity);
        gridMat.opacity = interp(DARK.gridOpacity, LIGHT.gridOpacity);
        for (const c of chips) {
          (c.mesh.material as THREE.MeshBasicMaterial).opacity = interp(
            DARK.chipOpacity,
            LIGHT.chipOpacity
          );
        }
        bloomPass.strength = interp(DARK.glow, LIGHT.glow);
        renderer.toneMappingExposure = interp(DARK.exposure, LIGHT.exposure);

        // Vault casing rotation
        icosa.rotation.y = time * 0.12;
        icosa.rotation.x = Math.sin(time * 0.2) * 0.25;
        shell.rotation.y = -time * 0.03;
        shell.rotation.x = Math.sin(time * 0.12) * 0.1;

        ring.rotation.z = time * 0.1;
        ring2.rotation.z = -time * 0.07;
        ring3.rotation.z = time * 0.18;

        // Currency chips orbit and bob
        for (const c of chips) {
          const a = time * c.speed + c.phase;
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          c.mesh.position.x = c.base.x * cos - c.base.z * sin;
          c.mesh.position.z = c.base.x * sin + c.base.z * cos;
          c.mesh.position.y = c.base.y + Math.sin(time * 0.7 + c.phase) * 0.3;
          c.mesh.rotation.x += 0.004;
          c.mesh.rotation.y += 0.006;
        }
        chipGroup.rotation.y = time * 0.02;

        particles.rotation.y = time * 0.006;

        // Smooth mouse parallax
        heroGroup.rotation.y += (mouseRef.current.x * 0.05 - heroGroup.rotation.y) * 0.04;
        heroGroup.rotation.x += (-mouseRef.current.y * 0.035 - heroGroup.rotation.x) * 0.04;
        camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.03;
        camera.position.y += (-mouseRef.current.y * 0.35 - camera.position.y) * 0.03;
        camera.lookAt(0, -0.2, 0);

        composer.render();
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      /* ---------- Resize ---------- */
      const handleResize = () => {
        if (!mount || disposed) return;
        const w = mount.clientWidth || window.innerWidth;
        const h = mount.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
      };
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(mount);

      return () => {
        disposed = true;
        cancelAnimationFrame(animationRef.current);
        window.removeEventListener("mousemove", handleMouseMove);
        resizeObserver.disconnect();
        themeObserver.disconnect();
        composer.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
            obj.geometry.dispose();
            const m = obj.material as THREE.Material | THREE.Material[];
            if (Array.isArray(m)) m.forEach((x) => x.dispose());
            else m.dispose();
          }
        });
      };
    } catch (err) {
      // WebGL unavailable — the hero just falls back to CSS gradients
      console.warn("[Hero3DScene] WebGL init failed, skipping:", err);
      return;
    }
  }, []);

  return <div ref={mountRef} className="absolute inset-0 -z-10" aria-hidden="true" />;
}
