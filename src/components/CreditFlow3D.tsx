"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ThemePalette, observeThemeMode, rand, themeIsLight } from "@/lib/three-theme";

interface Props {
  className?: string;
  /** Number of animated coins (an accent, not a fountain). */
  coins?: number;
  seed?: number;
}

interface Coin {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  speed: number;
  offset: number;
  phase: number;
  spin: number;
}

/**
 * Rising credit stream for money/loyalty sections thin chrome/oxblood discs
 * pour upward, spin, and fade out like a balance being minted, flanked by
 * faint beams. All tints lerp with the active theme.
 */
export default function CreditFlow3D({
  className = "absolute inset-0 -z-10",
  coins = 16,
  seed = 1,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const palette = new ThemePalette();
    palette.init(themeIsLight());

    let disposed = false;
    let visible = true;

    const scene = new THREE.Scene();
    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 60);
    camera.position.set(0, 1.2, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 768 ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    /* Vertical credit streams thin additive columns at each edge */
    const beamGeo = new THREE.CylinderGeometry(0.035, 0.035, 11, 8, 1, true);
    const beamMatL = new THREE.MeshBasicMaterial({
      color: palette.chrome,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamL = new THREE.Mesh(beamGeo, beamMatL);
    beamL.position.set(-4.6, 0.4, -1.5);
    scene.add(beamL);

    const beamMatR = beamMatL.clone();
    beamMatR.color = palette.instock;
    beamMatR.opacity = 0.04;
    const beamR = new THREE.Mesh(beamGeo, beamMatR);
    beamR.position.set(4.6, 0.4, -1.5);
    scene.add(beamR);

    /* Rising coins */
    const ids: Coin[] = [];
    const coinColors = [palette.chrome, palette.chrome, palette.oxblood, palette.instock];
    for (let i = 0; i < coins; i++) {
      const geo = new THREE.CylinderGeometry(rand(0.16, 0.24), rand(0.16, 0.24), 0.03, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: coinColors[i % coinColors.length],
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      // coin faces the camera; tumble is added in the loop
      mesh.rotation.x = Math.PI / 2;

      /* push wide coins toward the edges so the section centre stays readable */
      const edgeBias = Math.abs(i - coins / 2) / (coins / 2); // 0 centre .. 1 edges
      const baseX = (Math.random() < 0.5 ? -1 : 1) * (1.5 + edgeBias * 4.2) + rand(-0.6, 0.6);
      const baseZ = rand(-4.6, -1.4);

      ids.push({
        mesh,
        baseX,
        baseZ,
        offset: Math.random(),
        speed: rand(0.35, 0.7),
        phase: rand(0, Math.PI * 2),
        spin: rand(0.008, 0.03),
      });
      scene.add(mesh);
    }

    /* Interaction */
    const mouse = { x: 0, y: 0 };
    const handleMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMouse);

    const stopTheme = observeThemeMode(() => palette.setLight(themeIsLight()));

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(mount);

    let raf = 0;
    const animate = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;

      const t = now * 0.001;
      palette.tick();
      beamMatL.opacity = palette.n(0.04, 0.07);
      beamMatR.opacity = palette.n(0.035, 0.06);

      for (const c of ids) {
        const raw = c.offset + t * c.speed;
        const y = ((raw % 10) + 10) % 10 - 3.7; // loop -3.7 → 6.3
        const fade = Math.max(0, 1 - Math.pow(Math.abs((y - 1) / 5.2), 1.5));
        const m = c.mesh.material as THREE.MeshBasicMaterial;
        m.opacity = palette.n(0.5, 0.55) * fade * 0.9;
        c.mesh.position.set(c.baseX + Math.sin(raw * 1.7 + c.phase) * 0.25, y, c.baseZ);
        c.mesh.rotation.y += c.spin * (1 + mouse.x);
        c.mesh.rotation.z += c.spin * 0.5;
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mount || disposed) return;
      const nw = mount.clientWidth || window.innerWidth;
      const nh = mount.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouse);
      stopTheme();
      io.disconnect();
      ro.disconnect();
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
  }, [coins, seed]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}