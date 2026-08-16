import * as THREE from 'three';

export class SkyAndWeather {
  public scene: THREE.Scene;
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;

  public gameTime: number = 6000; // 0 to 24000 (6000 = Noon, 18000 = Midnight)
  public timeSpeed: number = 20; // 24000 ticks in ~20 minutes

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.4);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -35;
    this.sunLight.shadow.camera.right = 35;
    this.sunLight.shadow.camera.top = 35;
    this.sunLight.shadow.camera.bottom = -35;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.gameTime = (this.gameTime + delta * this.timeSpeed * 10) % 24000;

    // Calculate celestial angle (0 to 2*PI)
    const angle = (this.gameTime / 24000) * Math.PI * 2 - Math.PI / 2;

    const sunDistance = 45;
    const sunX = playerPos.x + Math.cos(angle) * sunDistance;
    const sunY = playerPos.y + Math.sin(angle) * sunDistance;
    const sunZ = playerPos.z + 10;

    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunLight.target.position.copy(playerPos);

    // Is Day or Night?
    const isDay = sunY > playerPos.y;

    if (isDay) {
      this.sunLight.intensity = Math.max(0.2, (sunY - playerPos.y) / sunDistance) * 1.3;
      this.scene.background = new THREE.Color(0x38bdf8);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0xbae6fd);
      }
      this.ambientLight.intensity = 0.45;
    } else {
      // Night time
      this.sunLight.intensity = 0.05;
      this.scene.background = new THREE.Color(0x030712);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x0f172a);
      }
      this.ambientLight.intensity = 0.15;
    }
  }
}
