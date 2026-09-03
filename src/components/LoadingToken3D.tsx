"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* Small three.js token for the loading splash: a chrome icosahedron with
   a wireframe shell and a faint instock inner glow, rotating gently.
   Keeps the same Vault & Chrome palette as the hero globe. */
const THEME_KEY = "gts-theme";

const DARK = {
  chrome: new THREE.Color(0xc9af8c),
  instock: new THREE.Color(0x5fae87),
  opacity: 0.55,
};
const LIGHT = {
  chrome: new THREE.Color(0x8a6b45),
  instock: new THREE.Color(0x2b6e4c),
  opacity: 0.6,
};

export default function LoadingToken3D() {
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
      const size = Math.min(mount.clientWidth, mount.clientHeight) || 120;
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 5);

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

      const active = {
        chrome: DARK.chrome.clone(),
        instock: DARK.instock.clone(),
      };

      const group = new THREE.Group();

      // Chrome icosahedron (the token)
      const tokenMat = new THREE.MeshBasicMaterial({
        color: active.chrome,
        transparent: true,
        opacity: interp(DARK.opacity, LIGHT.opacity),
      });
      const token = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1, 0),
        tokenMat
      );
      group.add(token);

      // Wireframe shell
      const shellMat = new THREE.LineBasicMaterial({
        color: active.chrome,
        transparent: true,
        opacity: 0.35,
      });
      const shell = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.35, 0)),
        shellMat
      );
      group.add(shell);

      // Instock inner glow
      const glowMat = new THREE.MeshBasicMaterial({
        color: active.instock,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), glowMat);
      group.add(glow);

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
        active.chrome.lerpColors(DARK.chrome, LIGHT.chrome, mix);
        active.instock.lerpColors(DARK.instock, LIGHT.instock, mix);

        tokenMat.opacity = interp(DARK.opacity, LIGHT.opacity);

        group.rotation.x = t * 0.5;
        group.rotation.y = t * 0.7;
        glow.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12);

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
      console.warn("[LoadingToken3D] WebGL init failed:", err);
      return;
    }
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
