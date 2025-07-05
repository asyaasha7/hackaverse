import * as THREE from 'three';
import { scene, camera, renderer, orbitControls } from './scene.js';
import { showQuizQuestion, hideDialog } from './quiz.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

import { CharacterControls } from './characterControls.js';
import { KeyDisplay } from './utils.js';
import * as fcl from "@onflow/fcl";

fcl.config()
  .put("accessNode.api", "https://rest-testnet.onflow.org") // Flow Testnet
  .put("discovery.wallet", "https://fcl-discovery.onflow.org/testnet/authn") // Hosted wallet login
  .put("app.detail.title", "Hackaverse")
  .put("app.detail.icon", "https://placekitten.com/100/100");

  let dialogActive = false;

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
const fbxLoader = new FBXLoader();
const idleLoader = new FBXLoader();

let npcMixer;

fbxLoader.load('/ment/char.fbx', (fbx) => {
  npcModel = fbx;
  npcModel.scale.set(0.01, 0.01, 0.01); // adjust scale to match your world
  npcModel.position.set(0, 0, -1.2);


  npcModel.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#84d2f6'), // a soft sky blue
        roughness: 0.4,
        metalness: 0.1,
      });
    }
  });

  scene.add(npcModel);

  // Load idle animation and play
  idleLoader.load('/ment/idle.fbx', (idleAnim) => {
    npcMixer = new THREE.AnimationMixer(npcModel);
    const action = npcMixer.clipAction(idleAnim.animations[0]);
    action.play();

    // const clock = new THREE.Clock();
    // function updateIdleNPC() {
    //   const delta = clock.getDelta();
    //   if (npcMixer) npcMixer.update(delta);
    //   requestAnimationFrame(updateIdleNPC);
    // }
    // updateIdleNPC();
  });
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
      let dialogActive = false;
    }
  }
});

// Main loop
const clock = new THREE.Clock();
function animate() {
  const delta = clock.getDelta();
  if (characterControls) characterControls.update(delta, keyPressed);
  if (npcMixer) npcMixer.update(delta); 
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
