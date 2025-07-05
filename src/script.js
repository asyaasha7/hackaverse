import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterControls } from './characterControls.js';
import { KeyDisplay } from './utils.js';
import * as fcl from "@onflow/fcl";

fcl.config()
  .put("accessNode.api", "https://rest-testnet.onflow.org") // Flow Testnet
  .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn") // Hosted wallet login
  .put("app.detail.title", "Hackaverse")
  .put("app.detail.icon", "https://placekitten.com/100/100");

// Scene
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
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#000000';
ctx.font = 'bold 64px sans-serif';
ctx.fillText('Flow', 170, 150);
const plateTexture = new THREE.CanvasTexture(canvas);
const plateMaterial = new THREE.MeshStandardMaterial({ map: plateTexture });
const plateGeometry = new THREE.PlaneGeometry(3, 2);
const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
plateMesh.position.set(0, 1.5, -1.5);
scene.add(plateMesh);

// Load controllable character
let characterControls;
const loader = new GLTFLoader();
loader.load('/model/Soldier.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    }
  });
  model.scale.set(1, 1, 1);
  model.position.set(0, 0, 5);
  scene.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const animationMap = new Map();
  gltf.animations.filter(c => c.name !== 'TPose').forEach(c => {
    animationMap.set(c.name, mixer.clipAction(c));
  });

  characterControls = new CharacterControls(model, mixer, animationMap, orbitControls, camera, 'Idle');
});
let npcModel;
// Load idle NPC behind table
const npcLoader = new GLTFLoader();
npcLoader.load('/model/Soldier.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    }
  });

  model.scale.set(1, 1, 1);
  model.position.set(0, 0, -1.2); 
  model.rotation.y = Math.PI;     
  npcModel = model;
  scene.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const idleClip = gltf.animations.find(a => a.name === 'Idle');
  if (idleClip) {
    const idleAction = mixer.clipAction(idleClip);
    idleAction.play();
  }

  const clock = new THREE.Clock();
  function updateIdleNPC() {
    const delta = clock.getDelta();
    mixer.update(delta);
    requestAnimationFrame(updateIdleNPC);
  }
  updateIdleNPC();
});

// Keyboard control
const keyPressed = {};
const keyDisplayQueue = new KeyDisplay();

document.addEventListener('keydown', (e) => {
  keyDisplayQueue.down(e.key);
  if (e.shiftKey && characterControls) {
    characterControls.switchRunToggle();
  } else {
    keyPressed[e.key.toLowerCase()] = true;
  }
});

document.addEventListener('keyup', (e) => {
  keyDisplayQueue.up(e.key);
  keyPressed[e.key.toLowerCase()] = false;
});

document.addEventListener('keydown', (e) => {
  if (dialogActive && e.key === 'Enter') {
    dialogIndex++;
    if (dialogIndex < dialogLines.length) {
      showDialog(dialogLines[dialogIndex]);
    } else {
      hideDialog();
    }
  }
});

// Main loop
const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  if (characterControls) characterControls.update(delta, keyPressed);
  orbitControls.update();

  // Check distance to NPC
  if (characterControls && npcModel) {
    const playerPos = characterControls.model.position;
    const npcPos = npcModel.position;
    const distance = playerPos.distanceTo(npcPos);
  
    if (distance < 2 && !dialogActive) {
      dialogActive = true;
      showQuizQuestion(0); // Start quiz
    } else if (distance >= 2 && dialogActive) {
      hideDialog();
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let currentQuestion = 0;
let correctAnswers = 0;
let dialogActive = false;

const quiz = [
  {
    question: "What is Flow?",
    options: [
      { text: "A Layer 2 on Ethereum", correct: false },
      { text: "A scalable blockchain for consumer apps", correct: true },
      { text: "An exchange", correct: false }
    ]
  },
  {
    question: "Which language does Flow use for smart contracts?",
    options: [
      { text: "Solidity", correct: false },
      { text: "Cadence", correct: true },
      { text: "Rust", correct: false }
    ]
  },
  {
    question: "Which company helped build Flow?",
    options: [
      { text: "OpenSea", correct: false },
      { text: "Dapper Labs", correct: true },
      { text: "Coinbase", correct: false }
    ]
  }
];

const dialogBox = document.createElement('div');
dialogBox.style.position = 'absolute';
dialogBox.style.bottom = '20px';
dialogBox.style.left = '50%';
dialogBox.style.transform = 'translateX(-50%)';
dialogBox.style.padding = '12px 18px';
dialogBox.style.background = 'rgba(0,0,0,0.85)';
dialogBox.style.color = '#fff';
dialogBox.style.fontFamily = 'sans-serif';
dialogBox.style.fontSize = '16px';
dialogBox.style.borderRadius = '8px';
dialogBox.style.maxWidth = '420px';
dialogBox.style.display = 'none';
dialogBox.style.zIndex = '10';
document.body.appendChild(dialogBox);

function showQuizQuestion(index) {
  const q = quiz[index];
  dialogBox.innerHTML = `<div style="margin-bottom:12px;"><strong>Mentor:</strong> ${q.question}</div>`;
  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.style.margin = '6px';
    btn.style.padding = '10px 16px';
    btn.style.background = '#00bbff';
    btn.style.border = 'none';
    btn.style.color = '#fff';
    btn.style.fontWeight = 'bold';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.onmouseenter = () => (btn.style.background = '#008ecc');
    btn.onmouseleave = () => (btn.style.background = '#00bbff');
    btn.onclick = () => {
      dialogBox.innerHTML = `<div style=\"margin-bottom:10px;\">You selected: <strong>${opt.text}</strong></div>`;
      setTimeout(() => {
        if (opt.correct) {
          correctAnswers++;
        }
        currentQuestion++;
        if (currentQuestion < quiz.length) {
          showQuizQuestion(currentQuestion);
        } else {
          endQuiz();
        }
      }, 800);
    };
    dialogBox.appendChild(btn);
  });
  dialogBox.style.display = 'block';
}

function endQuiz() {
  dialogBox.innerHTML = '';
  if (correctAnswers === quiz.length) {
    dialogBox.innerHTML = `
      <div><strong>Mentor:</strong> Great job! You've passed the quiz and earned a Flow T-shirt NFT!</div>
      <button id="loginBtn" style="margin-top:12px; padding:10px 16px; background:#00bbff; border:none; color:#fff; font-weight:bold; border-radius:6px; cursor:pointer;">Login with Flow</button>
    `;
    document.getElementById('loginBtn').onclick = async () => {
      const user = await fcl.authenticate();
      const snapshot = await fcl.currentUser().snapshot();
      if (snapshot.addr) {
        dialogBox.innerHTML += `
          <div style="margin-top:10px; color:#00ff99;">✅ Logged in as ${snapshot.addr}</div>
          <button style="margin-top:12px; padding:10px 16px; background:#00ff99; border:none; color:#000; font-weight:bold; border-radius:6px; cursor:pointer;" onclick="mintFlowNFT()">Mint NFT</button>
        `;
      }
    };
  } else {
    dialogBox.innerHTML = `
      <div><strong>Mentor:</strong> Almost there! Brush up on Flow and come back anytime.</div>
      <a href="https://developers.flow.com/" target="_blank" style="color:#00ffff; display:inline-block; margin-top:10px; font-weight:bold;">📘 Read Flow Docs →</a>
    `;
  }
  dialogBox.style.display = 'block';
  // Reset for next round
  currentQuestion = 0;
  correctAnswers = 0;
} 

function hideDialog() {
  dialogBox.style.display = 'none';
  dialogActive = false;
}

window.mintFlowNFT = async function mintFlowNFT() {
  const user = await fcl.currentUser().snapshot();
  if (!user.addr) {
    alert("Please login with your Flow wallet first.");
    return;
  }

  try {
    const txId = await fcl.mutate({
      cadence: `
        import HackathonSwag from 0x3594cc98fd019c01

        transaction {
          prepare(acct: AuthAccount) {
            HackathonSwag.mintTo(acct)
          }
        }
      `,
      proposer: fcl.currentUser().authorization,
      payer: fcl.currentUser().authorization,
      authorizations: [fcl.currentUser().authorization],
      limit: 100,
    });

    dialogBox.innerHTML += `
      <div style="margin-top:10px; color:#00ff99;">🎉 Transaction submitted! <a href="https://testnet.flowscan.org/transaction/${txId}" target="_blank">View on Flowscan</a></div>
    `;
  } catch (err) {
    dialogBox.innerHTML += `<div style="color:red; margin-top:10px;">❌ Mint failed: ${err.message}</div>`;
    console.error("Minting error:", err);
  }
};