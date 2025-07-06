import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const fbxLoader = new FBXLoader();

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

const dirLight = new THREE.DirectionalLight(0xF0997D, 0.9);
dirLight.position.set(-10, 10, -1.5);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 200;
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
scene.add(dirLight);

// Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 20;
orbitControls.enablePan = false;

// Stylized floor (procedural material)
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('/floor.jpeg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10, 10); // Scale tiling

const texturedFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ map: floorTexture })
);
texturedFloor.rotation.x = -Math.PI / 2;
texturedFloor.receiveShadow = true;
scene.add(texturedFloor);

// Walls
const wallTexture = new THREE.TextureLoader().load('/wall.jpeg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(3, 1); // Tweak based on your texture

const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture });

const wallGeo = new THREE.BoxGeometry(30, 4, 0.2);

// Create walls
[
  { pos: [0, 2, -15] },
  { pos: [0, 2, 15] },
  { pos: [-15, 2, 0], rotY: Math.PI / 2 },
  { pos: [15, 2, 0], rotY: Math.PI / 2 }
].forEach(({ pos, rotY }) => {
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(...pos);
  if (rotY) wall.rotation.y = rotY;
  wall.receiveShadow = true;
  scene.add(wall);
});

// Table
const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x9a5e9b7,
  roughness: 0.8,
  metalness: 0.5
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

fbxLoader.load('/banner.fbx', (banner) => {
    banner.scale.set(0.004, 0.004, 0.004); // adjust scale if needed
    banner.position.set(6, 1.5, -3); // to the right and a bit behind the flow plane
    // banner.rotation.y = -Math.PI / 6; // slight turn toward the front
    const bannerTexture = textureLoader.load('/banner.fbm/banner.png');
    banner.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.material = new THREE.MeshStandardMaterial({
          map: bannerTexture,
          roughness: 0.5,
          metalness: 0.2
        });
      }
    });
  
    scene.add(banner);
  }, undefined, (err) => {
    console.error('Error loading banner:', err);
  });

// Flow Booth Sign
// Flow Booth Sign with centered logo and green background
const canvas = document.createElement('canvas');
canvas.width = 1024;
canvas.height = 512;
const ctx = canvas.getContext('2d');

// Light green background
ctx.fillStyle = '#a5e9b7';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Load the Flow logo image and center it
const flowImg = new Image();
flowImg.onload = () => {
  const imgWidth = 512;
  const imgHeight = 256;
  const x = (canvas.width - imgWidth) / 2;
  const y = (canvas.height - imgHeight) / 3;
  ctx.drawImage(flowImg, x, y, imgWidth, imgHeight);

  const texture = new THREE.CanvasTexture(canvas);

  const flowBoard = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 0.1),
    new THREE.MeshStandardMaterial({ map: texture })
  );

  flowBoard.position.set(0, 1, -1.5);
  flowBoard.castShadow = true;
  flowBoard.receiveShadow = true;

  scene.add(flowBoard);
};

flowImg.src = '/flow.png'; 

export { scene, camera, renderer, orbitControls };
