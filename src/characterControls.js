import * as THREE from 'three'
import { DIRECTIONS, KeyDisplay } from './utils.js';


export class CharacterControls {
  constructor(model, mixer, animationMap, orbitControl, camera, currentAction) {
    this.model = model
    this.mixer = mixer
    this.animationMap = animationMap
    this.orbitControl = orbitControl
    this.camera = camera
    this.currentAction = currentAction

    this.fadeDuration = 0.2
    this.runVelocity = 5
    this.walkVelocity = 2
    this.toggleRun = true

    this.walkDirection = new THREE.Vector3()
    this.rotateAngle = new THREE.Vector3(0, 1, 0)
    this.rotateQuaternion = new THREE.Quaternion()
    this.cameraTarget = new THREE.Vector3()

    this.animationMap.forEach((value, key) => {
      if (key === currentAction) value.play()
    })
  }

  switchRunToggle() {
    this.toggleRun = !this.toggleRun
  }

  update(delta, keysPressed) {
    const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true)

    let play = 'Idle'
    if (directionPressed && this.toggleRun) play = 'Run'
    else if (directionPressed) play = 'Walk'

    if (this.currentAction !== play) {
      const toPlay = this.animationMap.get(play)
      const current = this.animationMap.get(this.currentAction)
      current.fadeOut(this.fadeDuration)
      toPlay.reset().fadeIn(this.fadeDuration).play()
      this.currentAction = play
    }

    this.mixer.update(delta)

    if (this.currentAction === 'Run' || this.currentAction === 'Walk') {
      const angle = Math.atan2(
        this.camera.position.x - this.model.position.x,
        this.camera.position.z - this.model.position.z
      )

      const offset = this.directionOffset(keysPressed)
      this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angle + offset)
      this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.2)

      this.camera.getWorldDirection(this.walkDirection)
      this.walkDirection.y = 0
      this.walkDirection.normalize()
      this.walkDirection.applyAxisAngle(this.rotateAngle, offset)

      const velocity = this.currentAction === 'Run' ? this.runVelocity : this.walkVelocity
      const moveX = this.walkDirection.x * velocity * delta;
      const moveZ = this.walkDirection.z * velocity * delta;
      
      const bounds = { minX: -1.1, maxX: 1.1, minZ: -0.6, maxZ: 0.6 };
      const nextX = this.model.position.x + moveX;
      const nextZ = this.model.position.z + moveZ;
      
      if (
        nextX < bounds.minX || nextX > bounds.maxX ||
        nextZ < bounds.minZ || nextZ > bounds.maxZ
      ) {
        this.model.position.x = nextX;
        this.model.position.z = nextZ;
        this.updateCameraTarget(moveX, moveZ);
      }
      

      this.updateCameraTarget(moveX, moveZ)
    }
  }

  updateCameraTarget(moveX, moveZ) {
    this.camera.position.x += moveX
    this.camera.position.z += moveZ

    this.cameraTarget.x = this.model.position.x
    this.cameraTarget.y = this.model.position.y + 1
    this.cameraTarget.z = this.model.position.z
    this.orbitControl.target = this.cameraTarget
  }

  directionOffset(keysPressed) {
    let offset = 0

    if (keysPressed['w']) {
      if (keysPressed['a']) offset = Math.PI / 4
      else if (keysPressed['d']) offset = -Math.PI / 4
    } else if (keysPressed['s']) {
      if (keysPressed['a']) offset = (Math.PI * 3) / 4
      else if (keysPressed['d']) offset = (-Math.PI * 3) / 4
      else offset = Math.PI
    } else if (keysPressed['a']) {
      offset = Math.PI / 2
    } else if (keysPressed['d']) {
      offset = -Math.PI / 2
    }

    return offset
  }
}