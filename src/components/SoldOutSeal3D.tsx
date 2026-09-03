"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* "Vault sealed" three.js seal for sold-out product cards: a chrome torus
   rotating around a wireframe icosahedron, themed like a containment ring.
   Sized small so it can sit over the product image without dominating. */
const THEME_KEY = "gts-theme";

const DARK = {
  chrome: new THREE.Color(0xc9af8c),
  ringOpacity: 0.7,
  shellOpacity: 0.45,
};
const LIGHT = {
  chrome: new THREE.Color(0x8a6b45),
  ringOpacity: 0.7,
  shellOpacity: 0.5,
};

export default function SoldOutSeal3D() {
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
      const size = Math.min(mount.clientWidth, mount.clientHeight) || 96;
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 4.2);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      let mix = readTheme();
      let themeTarget = mix;
      const interp = (a: number, b: number) => a + (b - a) * mix;

      const chrome = DARK.chrome.clone();

      const group = new THREE.Group();

      // Outer ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: chrome,
        transparent: true,
        opacity: interp(DARK.ringOpacity, LIGHT.ringOpacity),
      });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.045, 10, 96),
        ringMat
      );
      ring.rotation.x = Math.PI / 2.2;
      group.add(ring);

      // Wireframe icosahedron (the "vault")
      const shellMat = new THREE.LineBasicMaterial({
        color: chrome,
        transparent: true,
        opacity: interp(DARK.shellOpacity, LIGHT.shellOpacity),
      });
      const shell = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.7, 0)),
        shellMat
      );
      group.add(shell);

      scene.add(group);

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
        const t = frame * 0.001;

        mix += (themeTarget - mix) * 0.06;
        if (Math.abs(mix - themeTarget) < 0.0005) mix = themeTarget;
        chrome.lerpColors(DARK.chrome, LIGHT.chrome, mix);

        ringMat.opacity = interp(DARK.ringOpacity, LIGHT.ringOpacity);
        shellMat.opacity = interp(DARK.shellOpacity, LIGHT.shellOpacity);

        group.rotation.x = t * 0.35;
        group.rotation.y = t * 0.55;
        ring.rotation.z = t * 0.4;

        renderer.render(scene, camera);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        disposed = true;
        cancelAnimationFrame(animationRef.current);
        themeObserver.disconnect();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
        scene.traverse((obj) => {
          if (
            obj instanceof THREE.Mesh ||
            obj instanceof THREE.LineSegments
          ) {
            obj.geometry.dispose();
            const m = obj.material as THREE.Material | THREE.Material[];
            if (Array.isArray(m)) m.forEach((x) => x.dispose());
            else m.dispose();
          }
        });
      };
    } catch (err) {
      console.warn("[SoldOutSeal3D] WebGL init failed:", err);
      return;
    }
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
