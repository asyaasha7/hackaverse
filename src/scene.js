import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);
scene.fog = new THREE.Fog(0xf4f4f4, 20, 60);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xcceeff, 0xfff0f0, 0.5);
scene.add(hemiLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(5, 15, 5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 5;
spotLight.shadow.camera.far = 40;
spotLight.shadow.radius = 4;
scene.add(spotLight);

// Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 20;
orbitControls.enablePan = false;

// Stylized floor (procedural material)
const floorGeometry = new THREE.PlaneGeometry(60, 60);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0xe0e0e0,
  roughness: 0.5,
  metalness: 0.2,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Walls
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.8,
  metalness: 0.1
});

const wallGeo = new THREE.BoxGeometry(30, 4, 0.2);
[
  { pos: [0, 2, -15] },
  { pos: [0, 2, 15] },
  { pos: [-15, 2, 0], rotY: Math.PI / 2 },
  { pos: [15, 2, 0], rotY: Math.PI / 2 }
].forEach(({ pos, rotY }) => {
  const wall = new THREE.Mesh(wallGeo, wallMaterial);
  wall.position.set(...pos);
  if (rotY) wall.rotation.y = rotY;
  wall.receiveShadow = true;
  scene.add(wall);
});

// Table
const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x9e6b43,
  roughness: 0.4,
  metalness: 0.2
});

const tabletop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1), woodMaterial);
tabletop.position.set(0, 0.85, 0);
tabletop.castShadow = true;
scene.add(tabletop);

const legGeo = new THREE.BoxGeometry(0.1, 0.85, 0.1);
[
  [-0.95, 0.425, -0.45],
  [0.95, 0.425, -0.45],
  [-0.95, 0.425, 0.45],
  [0.95, 0.425, 0.45]
].forEach(([x, y, z]) => {
  const leg = new THREE.Mesh(legGeo, woodMaterial);
  leg.position.set(x, y, z);
  leg.castShadow = true;
  scene.add(leg);
});

// Flow Booth Sign
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
