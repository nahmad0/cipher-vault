'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { challenges, isUnlocked } from '../../lib/challenges';

export type WorldProps = { solved: string[]; paused: boolean; destination: [number, number] | null; onNear: (id: string | null) => void; onInteract: (id: string) => void; onError: () => void; movement: React.MutableRefObject<Set<string>> };
export default function World(props: WorldProps) {
  const host = useRef<HTMLDivElement>(null); const live = useRef(props); live.current = props;
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); } catch { live.current.onError(); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; renderer.setClearColor('#080e19');
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#080e19', 0.014);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 180); camera.position.set(27, 33, 36); camera.lookAt(0, 0, -1);
    scene.add(new THREE.AmbientLight('#9dbae5', 1.3));
    const light = new THREE.DirectionalLight('#cfeaff', 2.4); light.position.set(8, 25, 14); light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048); Object.assign(light.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25 }); scene.add(light);
    const materials: THREE.Material[] = []; const geometries: THREE.BufferGeometry[] = []; const textures: THREE.Texture[] = [];
    const mat = (color: string, emissive?: string) => { const m = new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .4, emissive: emissive || '#000000', emissiveIntensity: emissive ? 1.4 : 0 }); materials.push(m); return m; };
    const dark = mat('#152236'), wall = mat('#27384b'), trim = mat('#456075'), mint = mat('#68f5d2', '#32caaa');
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, parent: THREE.Object3D = scene) => {
      const g = new THREE.BoxGeometry(w, h, d); geometries.push(g); const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    box(27, .6, 33, 0, -.4, 0, dark);
    const grid = new THREE.GridHelper(32, 32, '#365064', '#1d3041'); grid.position.y = -.08; scene.add(grid);
    // Low perimeter walls preserve sightlines into the playable space.
    box(27, 1, .4, 0, .3, -16.4, wall); box(.4, 1, 33, -13.4, .3, 0, wall); box(.4, 1, 33, 13.4, .3, 0, wall);
    for (let z = -15; z <= 15; z += 5) { box(.12, .05, 2.3, -12.9, .12, z, mint); box(.12, .05, 2.3, 12.9, .12, z, mint); }
    for (let z = -13; z < 14; z += 3) box(.09, .025, 1.2, 0, .025, z, trim);
    const obstacles: { x: number; z: number; w: number; d: number }[] = [];
    const stationMeshes: { group: THREE.Group; glow: THREE.MeshStandardMaterial; ring: THREE.Mesh; id: string }[] = [];
    const label = (text: string, color: string, x: number, y: number, z: number) => {
      const c = document.createElement('canvas'); c.width = 512; c.height = 96; const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#09131fe8'; ctx.fillRect(0, 0, 512, 96); ctx.fillStyle = color; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.fillText(text, 256, 60);
      const texture = new THREE.CanvasTexture(c); textures.push(texture); const m = new THREE.SpriteMaterial({ map: texture, depthTest: false }); materials.push(m);
      const s = new THREE.Sprite(m); s.position.set(x, y, z); s.scale.set(4.7, .88, 1); scene.add(s);
    };
    challenges.forEach((c, i) => {
      const [x, z] = c.position; const group = new THREE.Group(); group.position.set(x, 0, z); scene.add(group);
      const glow = mat(c.color, c.color);
      box(4.5, .18, 4, 0, .02, 0, wall, group); box(2.5, 1.1, 1.5, 0, .65, 0, dark, group);
      box(2.6, .15, 1.7, 0, 1.25, 0, trim, group); box(2.3, 1.4, .18, 0, 2, -.4, dark, group);
      box(2.05, 1.1, .04, 0, 2, -.29, glow, group);
      for (let j = 0; j < 4; j++) box(1.4 - j * .22, .055, .05, -.2, 2.35 - j * .22, -.25, dark, group);
      box(.9, .04, .4, 0, 1.36, .35, glow, group);
      const rg = new THREE.TorusGeometry(1.65, .035, 8, 48); geometries.push(rg); const ring = new THREE.Mesh(rg, glow); ring.rotation.x = -Math.PI / 2; ring.position.y = .17; group.add(ring);
      obstacles.push({ x, z, w: 1.55, d: 1.05 }); stationMeshes.push({ group, glow, ring, id: c.id });
      label(`0${i + 1} / ${c.category}`, c.color, x, 3.5, z);
    });
    // Server racks, recessed lights, and raised conduits create a compact cyber facility.
    for (const x of [-10.5, -7.6, 7.6, 10.5]) for (const z of [-10.6, -.2]) {
      box(1.9, 2.9, 1.15, x, 1.4, z, dark); obstacles.push({ x, z, w: 1.2, d: .85 });
      for (let j = 0; j < 7; j++) { box(1.65, .23, .05, x, .3 + j * .36, z + .6, wall); box(.13, .065, .065, x + .55, .3 + j * .36, z + .64, mint); }
    }
    const exitGlow = mat('#415465'); box(4.4, .08, 3.2, 0, .07, 13, exitGlow); box(.35, 3.6, .35, -2.2, 1.8, 13.5, wall); box(.35, 3.6, .35, 2.2, 1.8, 13.5, wall); box(4.7, .35, .35, 0, 3.5, 13.5, exitGlow);
    label('EXTRACTION', '#a7c7d8', 0, 4.4, 13.5);
    const player = new THREE.Group(); player.position.set(0, 0, 8.8); scene.add(player);
    box(.65, .9, .48, 0, 1, 0, mat('#d4e9ef'), player); box(.52, .5, .48, 0, 1.72, 0, dark, player); box(.44, .16, .05, 0, 1.73, .255, mint, player);
    box(.22, .56, .28, -.2, .33, 0, trim, player); box(.22, .56, .28, .2, .33, 0, trim, player);
    box(.17, .7, .22, -.44, 1, 0, wall, player); box(.17, .7, .22, .44, 1, 0, wall, player);
    const haloGeo = new THREE.TorusGeometry(.65, .045, 8, 32); geometries.push(haloGeo); const halo = new THREE.Mesh(haloGeo, mint); halo.rotation.x = -Math.PI / 2; halo.position.y = .08; player.add(halo);
    const beamGeo = new THREE.ConeGeometry(.25, .5, 3); geometries.push(beamGeo); const beam = new THREE.Mesh(beamGeo, mint); beam.position.y = 2.6; beam.rotation.z = Math.PI; player.add(beam);
    const keys = live.current.movement.current; let target: THREE.Vector3 | null = null; let lastDestination = live.current.destination; let near: string | null = null;
    const ray = new THREE.Raycaster(); const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); const pointer = new THREE.Vector2();
    const click = (e: PointerEvent) => { if (live.current.paused) return; const rect = el.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); ray.setFromCamera(pointer, camera); const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(plane, hit)) { target = hit; target.x = THREE.MathUtils.clamp(target.x, -12, 12); target.z = THREE.MathUtils.clamp(target.z, -15, 15); } };
    const down = (e: KeyboardEvent) => { if (live.current.paused || (e.target as HTMLElement)?.matches('input,textarea')) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault(); keys.add(e.key.toLowerCase()); if (e.key.toLowerCase() === 'e' && near) live.current.onInteract(near); };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase()); const blur = () => keys.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); renderer.domElement.addEventListener('pointerdown', click);
    const resize = () => { const w = el.clientWidth; const h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.position.set(27, 33, 36).multiplyScalar(w / h < 1 ? 1.4 : 1); camera.updateProjectionMatrix(); camera.lookAt(0, 0, 0); };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();
    let frame = 0; let previous = performance.now(); const v = new THREE.Vector3();
    const valid = (x: number, z: number) => Math.abs(x) < 12.5 && Math.abs(z) < 15.5 && !obstacles.some(o => Math.abs(x - o.x) < o.w + .3 && Math.abs(z - o.z) < o.d + .3);
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate); const dt = Math.min((now - previous) / 1000, .05); previous = now;
      if (live.current.destination !== lastDestination) { lastDestination = live.current.destination; if (lastDestination) target = new THREE.Vector3(lastDestination[0], 0, lastDestination[1]); }
      if (!live.current.paused) {
        v.set(0, 0, 0);
        if (keys.has('w') || keys.has('arrowup')) v.z -= 1; if (keys.has('s') || keys.has('arrowdown')) v.z += 1;
        if (keys.has('a') || keys.has('arrowleft')) v.x -= 1; if (keys.has('d') || keys.has('arrowright')) v.x += 1;
        if (v.lengthSq()) { target = null; v.applyAxisAngle(new THREE.Vector3(0, 1, 0), .644); }
        else if (target) { v.subVectors(target, player.position); v.y = 0; if (v.length() < .2) { target = null; v.set(0, 0, 0); } }
        if (v.lengthSq()) { v.normalize(); const step = dt * (keys.has('shift') ? 7 : 4.6); const nx = player.position.x + v.x * step; const nz = player.position.z + v.z * step;
          if (valid(nx, player.position.z)) player.position.x = nx; if (valid(player.position.x, nz)) player.position.z = nz;
          player.rotation.y = Math.atan2(v.x, v.z); player.children[0].position.y = 1 + Math.sin(now * .014) * .04;
        }
        let closest: string | null = null; let distance = 3.4;
        challenges.forEach(c => { const d = Math.hypot(player.position.x - c.position[0], player.position.z - c.position[1]); if (d < distance) { closest = c.id; distance = d; } });
        if (Math.hypot(player.position.x, player.position.z - 13) < 2.8) closest = 'exit';
        if (closest !== near) { near = closest; live.current.onNear(near); }
      }
      beam.position.y = 2.7 + Math.sin(now * .003) * .1;
      stationMeshes.forEach((s, i) => { const done = live.current.solved.includes(s.id); const unlocked = isUnlocked(challenges[i], live.current.solved); s.glow.color.set(done ? '#68f5d2' : unlocked ? challenges[i].color : '#43526a'); s.glow.emissive.copy(s.glow.color); s.glow.emissiveIntensity = done ? 1.5 : unlocked ? .7 + Math.sin(now * .002 + i) * .2 : .12; s.ring.visible = unlocked; });
      exitGlow.color.set(live.current.solved.length === challenges.length ? '#68f5d2' : '#415465'); exitGlow.emissive.copy(exitGlow.color); exitGlow.emissiveIntensity = live.current.solved.length === challenges.length ? 1 : 0;
      renderer.render(scene, camera);
    }; frame = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); renderer.domElement.removeEventListener('pointerdown', click); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); grid.geometry.dispose(); (grid.material as THREE.Material).dispose(); renderer.dispose(); renderer.domElement.remove(); keys.clear(); };
  }, []);
  return <div className="world" ref={host} aria-label="3D facility. Use WASD or arrow keys to move, E to interact. Click the floor to walk." />;
}
