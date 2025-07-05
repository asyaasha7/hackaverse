import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdedede);
scene.fog = new THREE.Fog(0xdedede, 10, 50);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 8);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0xbcbcbc })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Walls
const wallGeo = new THREE.BoxGeometry(30, 4, 0.2);
const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
[
  { pos: [0, 2, -15] },
  { pos: [0, 2, 15] },
  { pos: [-15, 2, 0], rotY: Math.PI / 2 },
  { pos: [15, 2, 0], rotY: Math.PI / 2 }
].forEach(({ pos, rotY }) => {
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(...pos);
  if (rotY) wall.rotation.y = rotY;
  scene.add(wall);
});

// Table
const tableMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
const tabletop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1), tableMat);
tabletop.position.set(0, 0.85, 0);
scene.add(tabletop);

const legGeo = new THREE.BoxGeometry(0.1, 0.85, 0.1);
[
  [-0.95, 0.425, -0.45],
  [0.95, 0.425, -0.45],
  [-0.95, 0.425, 0.45],
  [0.95, 0.425, 0.45]
].forEach(([x, y, z]) => {
  const leg = new THREE.Mesh(legGeo, tableMat);
  leg.position.set(x, y, z);
  scene.add(leg);
});

// Booth plate with Flow texture
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 256;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#7cc7c0';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#0000aa';
ctx.font = 'bold 64px sans-serif';
ctx.fillText('Flow', 170, 150);
const plateTexture = new THREE.CanvasTexture(canvas);
const plateMaterial = new THREE.MeshStandardMaterial({ map: plateTexture });
const plateGeometry = new THREE.PlaneGeometry(3, 2);
const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
plateMesh.position.set(0, 1.5, -1.5);
scene.add(plateMesh);

export { scene, camera, renderer, orbitControls };
