import {
  Entity,
  WebGLEngine,
  Vector3,
  DynamicCollider,
  SphereColliderShape,
  MeshRenderer,
  PrimitiveMesh,
  UnlitMaterial,
  Color,
  Script
} from '@galacean/engine';

export class BirdScript extends Script {
  private collider!: DynamicCollider;
  public launched: boolean = false;
  private lifeTimer: number = 0;
  private maxLifeTime: number = 10; // 10秒后自动销毁

  onAwake() {
    this.collider = this.entity.getComponent(DynamicCollider)!;
  }

  onUpdate(deltaTime: number) {
    if (this.launched) {
      this.lifeTimer += deltaTime;
      
      // 超时或掉出边界则销毁
      const pos = this.entity.transform.position;
      if (this.lifeTimer > this.maxLifeTime || pos.y < -5 || Math.abs(pos.x) > 20) {
        this.entity.destroy();
      }
    }
  }

  public launch(velocity: Vector3) {
    if (this.launched) return;
    
    this.launched = true;
    this.collider.isKinematic = false;
    this.collider.linearVelocity = velocity;
  }

  public reset() {
    this.launched = false;
    this.lifeTimer = 0;
    this.collider.isKinematic = true;
    this.collider.linearVelocity = new Vector3(0, 0, 0);
    this.collider.angularVelocity = new Vector3(0, 0, 0);
  }
}

export class Bird {
  private entity: Entity;
  private script: BirdScript;

  constructor(engine: WebGLEngine, parent: Entity, position: Vector3) {
    // 创建小鸟实体
    this.entity = parent.createChild('bird');
    this.entity.transform.position = position;

    // 添加动态碰撞体（球形）
    const collider = this.entity.addComponent(DynamicCollider);
    collider.isKinematic = true; // 初始为运动学模式，不受物理影响
    collider.mass = 1.0;
    
    const sphereShape = new SphereColliderShape();
    sphereShape.radius = 0.5;
    collider.addShape(sphereShape);

    // 创建可视化（红色球体）
    const renderer = this.entity.addComponent(MeshRenderer);
    renderer.mesh = PrimitiveMesh.createSphere(engine, 0.5);
    const material = new UnlitMaterial(engine);
    material.baseColor = new Color(0.9, 0.2, 0.2, 1); // 红色
    renderer.setMaterial(material);

    // 添加脚本
    this.script = this.entity.addComponent(BirdScript);
  }

  public getEntity(): Entity {
    return this.entity;
  }

  public launch(velocity: Vector3) {
    this.script.launch(velocity);
  }

  public reset() {
    this.script.reset();
  }

  public isLaunched(): boolean {
    return this.script.launched;
  }
}
