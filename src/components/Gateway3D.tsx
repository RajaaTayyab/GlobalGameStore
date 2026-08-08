"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ThemePalette, observeThemeMode, themeIsLight } from "@/lib/three-theme";

interface Props {
  className?: string;
  seed?: number;
}

/**
 * A faint "gateway" hologram — two concentric rings orbiting a wireframe core
 * with particles spiralling along its axis. Reads as an activation/dispatch
 * point for transaction-heavy or terminal sections (closing CTA, product
 * header, contact).
 */
export default function Gateway3D({ className = "absolute inset-0 -z-10", seed = 1 }: Props) {
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

    const camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 60);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 768 ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.position.set(0, -1.4, -2);
    scene.add(group);

    /* Wireframe core */
    const coreMat = new THREE.LineBasicMaterial({
      color: palette.chrome,
      transparent: true,
      opacity: 0.35,
    });
    const core = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.7, 1)),
      coreMat
    );
    group.add(core);

    /* Concentric rings */
    const ringGeo = new THREE.TorusGeometry(1.6, 0.014, 8, 96);
    const ringMatA = new THREE.MeshBasicMaterial({
      color: palette.chrome,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ringA = new THREE.Mesh(ringGeo, ringMatA);
    ringA.rotation.set(1.15, 0, 0);
    group.add(ringA);

    const ringMatB = ringMatA.clone();
    ringMatB.color = palette.oxblood;
    ringMatB.opacity = 0.16;
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.01, 8, 96), ringMatB);
    ringB.rotation.set(1.5, 0.4, 0);
    group.add(ringB);

    const ringMatC = ringMatA.clone();
    ringMatC.color = palette.instock;
    ringMatC.opacity = 0.14;
    const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.008, 8, 96), ringMatC);
    ringC.rotation.set(0.6, -0.3, 0);
    group.add(ringC);

    /* Axial particle spiral */
    const pCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const a = (i / pCount) * Math.PI * 6;
      pPos[i * 3] = Math.cos(a) * 0.28;
      pPos[i * 3 + 1] = (i / pCount - 0.5) * 5;
      pPos[i * 3 + 2] = Math.sin(a) * 0.28;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: palette.chrome,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const spiral = new THREE.Points(pGeo, pMat);
    group.add(spiral);

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
      coreMat.opacity = palette.n(0.35, 0.4);
      ringMatA.opacity = palette.n(0.2, 0.28);
      ringMatB.opacity = palette.n(0.16, 0.22);
      ringMatC.opacity = palette.n(0.14, 0.2);
      pMat.opacity = palette.n(0.4, 0.5);

      core.rotation.y = t * 0.4 + mouse.x * 0.1;
      core.rotation.x = Math.sin(t * 0.3) * 0.5;

      ringA.rotation.z = t * (0.25 + seed * 0.02);
      ringB.rotation.z = -t * 0.18;
      ringC.rotation.z = t * 0.35;

      spiral.rotation.y = t * 0.7;
      spiral.position.y = ((t * 0.6) % 5) - 0.5;

      group.rotation.y += (mouse.x * 0.06 - group.rotation.y) * 0.03;
      group.rotation.x += (-mouse.y * 0.04 - group.rotation.x) * 0.03;

      const pulse = 1 + Math.sin(t * 1.6) * 0.05;
      core.scale.setScalar(pulse);

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
  }, [seed]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}