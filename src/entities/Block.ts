import {
  Entity,
  WebGLEngine,
  Vector3,
  DynamicCollider,
  BoxColliderShape,
  MeshRenderer,
  PrimitiveMesh,
  UnlitMaterial,
  Color,
  Script,
  Collision
} from '@galacean/engine';
import { GameState } from './Pig';

export class BlockScript extends Script {
  private collider!: DynamicCollider;
  private health: number = 60;
  private maxHealth: number = 60;
  private isDestroyed: boolean = false;
  private destroyTimer: number = 0;
  private lastCollisionTime: number = 0;
  private collisionCooldown: number = 0.1; // 碰撞冷却时间

  onAwake() {
    this.collider = this.entity.getComponent(DynamicCollider)!;
  }

  onUpdate(deltaTime: number) {
    // 已破坏，等待销毁
    if (this.isDestroyed) {
      this.destroyTimer += deltaTime;
      if (this.destroyTimer > 2) {
        this.entity.destroy();
      }
      return;
    }

    // 更新碰撞时间
    this.lastCollisionTime += deltaTime;

    // 掉下边界
    if (this.entity.transform.position.y < -5) {
      this.destroyBlock();
    }
  }

  // 碰撞开始时触发
  onCollisionEnter(collision: Collision) {
    this.handleCollision(collision);
  }

  // 碰撞持续时触发
  onCollisionStay(collision: Collision) {
    // 持续碰撞也需要检测，但频率降低
    if (this.lastCollisionTime > this.collisionCooldown) {
      this.handleCollision(collision);
    }
  }

  private handleCollision(collision: Collision) {
    if (this.isDestroyed) return;
    
    // 检查游戏是否就绪
    if (!GameState.isGameReady) return;

    // 从碰撞信息中获取对方的碰撞器
    const otherCollider = collision.shape.collider;
    if (!otherCollider) return;
    
    // 获取碰撞对象的实体
    const otherEntity = otherCollider.entity;
    if (!otherEntity) return;

    // 检查碰撞对象类型
    const otherName = otherEntity.name;
    const isBird = otherName === 'bird';
    const isBlock = otherName === 'block';
    const isPig = otherName === 'pig';
    
    // 只处理与小鸟、其他建筑和猪的碰撞
    if (!isBird && !isBlock && !isPig) return;

    // 获取碰撞对象的速度（必须是动态碰撞器）
    const otherDynamicCollider = otherCollider instanceof DynamicCollider ? otherCollider : null;
    if (!otherDynamicCollider) return;

    const otherVelocity = otherDynamicCollider.linearVelocity;
    const myVelocity = this.collider.linearVelocity;

    // 计算相对速度（碰撞强度）
    const relativeVelocity = new Vector3(
      Math.abs(otherVelocity.x - myVelocity.x),
      Math.abs(otherVelocity.y - myVelocity.y),
      Math.abs(otherVelocity.z - myVelocity.z)
    );

    const impactSpeed = Math.sqrt(
      relativeVelocity.x * relativeVelocity.x +
      relativeVelocity.y * relativeVelocity.y +
      relativeVelocity.z * relativeVelocity.z
    );

    // 根据相对速度计算伤害
    if (impactSpeed > 1.5) {
      let damage = 0;
      let source = '';

      if (isBird) {
        // 小鸟碰撞伤害更高
        damage = (impactSpeed - 1.5) * 25;
        source = '小鸟撞击';
      } else if (isBlock || isPig) {
        // 建筑或猪碰撞伤害
        damage = (impactSpeed - 1.5) * 15;
        source = '碰撞伤害';
      }

      if (damage > 0) {
        this.takeDamage(damage, source);
        this.lastCollisionTime = 0; // 重置碰撞冷却
      }
    }
  }

  private takeDamage(damage: number, source: string = '') {
    if (this.isDestroyed) return;

    this.health -= damage;
    
    if (damage > 5) {
      console.log(`🟧 建筑受到 ${damage.toFixed(1)} 点伤害 (${source})，剩余生命: ${this.health.toFixed(1)}`);
    }
    
    // 根据生命值更新颜色（受损的建筑变暗）
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.updateColor(healthPercent);

    if (this.health <= 0) {
      this.destroyBlock();
    }
  }

  private updateColor(healthPercent: number) {
    const renderer = this.entity.getComponent(MeshRenderer);
    if (renderer) {
      const material = renderer.getMaterial() as UnlitMaterial;
      // 从棕色渐变到深灰色
      const r = 0.6 * healthPercent + 0.3 * (1 - healthPercent);
      const g = 0.4 * healthPercent + 0.3 * (1 - healthPercent);
      const b = 0.2 * healthPercent + 0.3 * (1 - healthPercent);
      material.baseColor = new Color(r, g, b, 1);
    }
  }

  private destroyBlock() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    this.destroyTimer = 0;
    
    // 碎裂效果：施加随机力
    if (this.collider) {
      const randomX = (Math.random() - 0.5) * 10;
      const randomY = Math.random() * 5 + 5;
      const randomZ = (Math.random() - 0.5) * 10;
      this.collider.applyForce(new Vector3(randomX, randomY, randomZ));
    }

    // 变为深灰色表示破碎
    const renderer = this.entity.getComponent(MeshRenderer);
    if (renderer) {
      const material = renderer.getMaterial() as UnlitMaterial;
      material.baseColor = new Color(0.2, 0.2, 0.2, 0.7);
    }

    console.log('Block destroyed!');
  }

  public isBlockDestroyed(): boolean {
    return this.isDestroyed;
  }
}

export class Block {
  private entity: Entity;
  private script: BlockScript;

  constructor(
    engine: WebGLEngine,
    parent: Entity,
    position: Vector3,
    width: number = 1,
    height: number = 2,
    depth: number = 1
  ) {
    // 创建建筑方块实体
    this.entity = parent.createChild('block');
    this.entity.transform.position = position;

    // 添加动态碰撞体（方形）
    const collider = this.entity.addComponent(DynamicCollider);
    collider.mass = 1.0; // 建筑质量
    
    const boxShape = new BoxColliderShape();
    boxShape.size = new Vector3(width, height, depth);
    collider.addShape(boxShape);

    // 创建可视化（棕色方块）
    const renderer = this.entity.addComponent(MeshRenderer);
    renderer.mesh = PrimitiveMesh.createCuboid(engine, width, height, depth);
    const material = new UnlitMaterial(engine);
    material.baseColor = new Color(0.6, 0.4, 0.2, 1); // 棕色
    renderer.setMaterial(material);

    // 添加脚本
    this.script = this.entity.addComponent(BlockScript);
  }

  public getEntity(): Entity {
    return this.entity;
  }

  public isDestroyed(): boolean {
    return this.script.isBlockDestroyed();
  }
}
