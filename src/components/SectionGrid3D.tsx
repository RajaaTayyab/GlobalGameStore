"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ThemePalette, observeThemeMode, rand, themeIsLight } from "@/lib/three-theme";

interface Props {
  /** Position the layer inside a `relative` section (defaults to full bleed behind). */
  className?: string;
  /** Number of floating wireframe vault shards. */
  floaters?: number;
  /** Vary per-instance so sections never mirror each other's drift. */
  seed?: number;
}

interface ShardState {
  baseY: number;
  speed: number;
  phase: number;
  amp: number;
  rot: number;
}

/**
 * Receding "vault floor" hologram for standalone sections: a faint perspective
 * grid on the horizon, chrome/oxblood wireframe shards drifting in front, and
 * sparse digital dust. Cheaper than the hero (additive materials, no bloom)
 * and pauses whenever the section leaves the viewport.
 */
export default function SectionGrid3D({
  className = "absolute inset-0 -z-10",
  floaters = 5,
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

    const camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 80);
    camera.position.set(0.6, 0.5, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 768 ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    /* Receding "vault floor" grid */
    const grid = new THREE.GridHelper(32, 22, palette.chrome, palette.chrome);
    const gridMat = grid.material as THREE.LineBasicMaterial;
    gridMat.color = palette.chrome;
    gridMat.transparent = true;
    gridMat.opacity = 0.06;
    grid.position.set(0, -3.6, 0);
    grid.rotation.x = Math.PI / 2.65;
    scene.add(grid);

    /* Soft chrome glow on the horizon */
    const glowMat = new THREE.MeshBasicMaterial({
      color: palette.chrome,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(8.5, 48), glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, -3.5, -1);
    scene.add(glow);

    /* Floating vault shards */
    const floatGroup = new THREE.Group();
    const shards: THREE.LineSegments[] = [];
    for (let i = 0; i < floaters; i++) {
      const geo =
        i % 2 === 0
          ? new THREE.EdgesGeometry(new THREE.OctahedronGeometry(rand(0.6, 1.0)))
          : new THREE.EdgesGeometry(
              new THREE.BoxGeometry(rand(0.7, 1.3), rand(0.7, 1.3), rand(0.7, 1.3))
            );
      const mat = new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? palette.oxblood : palette.chrome,
        transparent: true,
        opacity: rand(0.12, 0.22),
      });
      const shard = new THREE.LineSegments(geo, mat);
      const x = (i / Math.max(floaters - 1, 1) - 0.5) * 10 + (i % 2 === 0 ? seed : -seed) * 0.4;
      shard.position.set(x, rand(-1.8, 1.6), rand(-4, -0.5));
      shard.userData = {
        baseY: shard.position.y,
        speed: rand(0.4, 0.9) * (seed % 2 === 0 ? 1 : -1),
        phase: rand(0, Math.PI * 2),
        amp: rand(0.25, 0.5),
        rot: rand(0.002, 0.005),
      } satisfies ShardState;
      floatGroup.add(shard);
      shards.push(shard);
    }
    scene.add(floatGroup);

    /* Sparse digital dust */
    const dustCount = 130;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 22;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 8 - 1;
      dustPos[i * 3 + 2] = rand(-4, 1);
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: palette.chrome,
      size: 0.05,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

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

    let frame = 0;
    let raf = 0;
    const animate = () => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;

      frame++;
      const t = frame * 0.001;

      palette.tick();
      gridMat.opacity = palette.n(0.05, 0.07);
      glowMat.opacity = palette.n(0.08, 0.14);

      floatGroup.rotation.y = t * 0.03 + mouse.x * 0.02;
      floatGroup.rotation.x = -mouse.y * 0.012;
      for (const shard of shards) {
        const s = shard.userData as ShardState;
        shard.position.y = s.baseY + Math.sin(t * s.speed + s.phase) * s.amp;
        shard.rotation.y += s.rot * (1 + mouse.x * 0.3);
        shard.rotation.x += s.rot * 0.6;
      }

      dust.rotation.y = t * 0.004 + mouse.x * 0.01;

      renderer.render(scene, camera);
    };
    animate();

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
      dustGeo.dispose();
    };
  }, [floaters, seed]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}