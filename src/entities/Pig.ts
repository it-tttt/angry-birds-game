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

// 全局游戏状态
export class GameState {
  public static isGameReady: boolean = false;
}

export class PigScript extends Script {
  private collider!: DynamicCollider;
  private health: number = 80;
  private maxHealth: number = 80;
  private isDead: boolean = false;
  private deadTimer: number = 0;
  private lastCollisionTime: number = 0;
  private collisionCooldown: number = 0.1; // 碰撞冷却时间，防止同一次碰撞多次计算

  onAwake() {
    this.collider = this.entity.getComponent(DynamicCollider)!;
  }

  onUpdate(deltaTime: number) {
    // 死亡后等待一段时间再销毁（播放死亡动画时间）
    if (this.isDead) {
      this.deadTimer += deltaTime;
      if (this.deadTimer > 1.5) {
        this.entity.destroy();
      }
      return;
    }

    // 更新碰撞时间
    this.lastCollisionTime += deltaTime;

    // 掉下边界
    if (this.entity.transform.position.y < -5) {
      this.die();
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
    if (this.isDead) return;
    
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
    
    // 只处理与小鸟和建筑的碰撞
    if (!isBird && !isBlock) return;

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
    if (impactSpeed > 1.0) {
      let damage = 0;
      let source = '';

      if (isBird) {
        // 小鸟碰撞伤害更高
        damage = (impactSpeed - 1.0) * 30;
        source = '小鸟撞击';
      } else if (isBlock) {
        // 建筑碰撞伤害
        damage = (impactSpeed - 1.0) * 25;
        source = '建筑撞击';
      }

      if (damage > 0) {
        this.takeDamage(damage, source);
        this.lastCollisionTime = 0; // 重置碰撞冷却
      }
    }
  }

  private takeDamage(damage: number, source: string = '') {
    if (this.isDead) return;

    this.health -= damage;
    
    if (damage > 5) {
      console.log(`🐷 猪受到 ${damage.toFixed(1)} 点伤害 (${source})，剩余生命: ${this.health.toFixed(1)}`);
    }
    
    // 根据生命值更新颜色（受伤的猪变暗变红）
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.updateColor(healthPercent);

    if (this.health <= 0) {
      this.die();
    }
  }

  private updateColor(healthPercent: number) {
    const renderer = this.entity.getComponent(MeshRenderer);
    if (renderer) {
      const material = renderer.getMaterial() as UnlitMaterial;
      // 从绿色渐变到深红色（受伤效果）
      const r = 0.3 * healthPercent + 0.8 * (1 - healthPercent);
      const g = 0.8 * healthPercent + 0.2 * (1 - healthPercent);
      const b = 0.3 * healthPercent + 0.2 * (1 - healthPercent);
      material.baseColor = new Color(r, g, b, 1);
    }
  }

  private die() {
    if (this.isDead) return;
    
    this.isDead = true;
    this.deadTimer = 0;
    
    // 改变颜色表示死亡
    const renderer = this.entity.getComponent(MeshRenderer);
    if (renderer) {
      const material = renderer.getMaterial() as UnlitMaterial;
      material.baseColor = new Color(0.3, 0.3, 0.3, 1); // 变灰
    }

    console.log('Pig defeated!');
    
    // 添加击倒效果：施加一个向上的力
    if (this.collider) {
      this.collider.applyForce(new Vector3(0, 5, 0));
    }
  }

  public isAlive(): boolean {
    return !this.isDead;
  }
}

export class Pig {
  private entity: Entity;
  private script: PigScript;

  constructor(engine: WebGLEngine, parent: Entity, position: Vector3) {
    // 创建小猪实体
    this.entity = parent.createChild('pig');
    this.entity.transform.position = position;

    // 添加动态碰撞体（方形）
    const collider = this.entity.addComponent(DynamicCollider);
    collider.mass = 0.8; // 降低质量，让猪更容易被推动
    
    const boxShape = new BoxColliderShape();
    boxShape.size = new Vector3(1, 1, 1);
    collider.addShape(boxShape);

    // 创建可视化（绿色方块）
    const renderer = this.entity.addComponent(MeshRenderer);
    renderer.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);
    const material = new UnlitMaterial(engine);
    material.baseColor = new Color(0.3, 0.8, 0.3, 1); // 绿色
    renderer.setMaterial(material);

    // 添加脚本
    this.script = this.entity.addComponent(PigScript);
  }

  public isAlive(): boolean {
    return this.script.isAlive();
  }

  public getEntity(): Entity {
    return this.entity;
  }
}
