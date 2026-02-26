import {
  Entity,
  WebGLEngine,
  Vector3,
  Vector2,
  Script,
  Pointer,
  PointerButton,
  PointerPhase,
  Camera,
  Ray,
  MeshRenderer,
  PrimitiveMesh,
  UnlitMaterial,
  Color
} from '@galacean/engine';
import { Bird } from './Bird';
import { GameState } from './Pig';

export class SlingshotScript extends Script {
  private slingshot!: Slingshot;
  private camera!: Camera;
  private isDragging: boolean = false;
  private dragStartPos: Vector3 = new Vector3();
  private currentDragPos: Vector3 = new Vector3();
  private trajectoryEntities: Entity[] = []; // 轨迹点实体

  constructor(entity: Entity) {
    super(entity);
  }

  setSlingshot(slingshot: Slingshot) {
    this.slingshot = slingshot;
  }

  onAwake() {
    // 获取相机
    const cameraEntity = this.engine.sceneManager.activeScene.findEntityByName('camera');
    if (cameraEntity) {
      this.camera = cameraEntity.getComponent(Camera)!;
    }
  }

  onUpdate() {
    if (!this.slingshot || !this.camera) return;

    const inputManager = this.engine.inputManager;
    const pointers = inputManager.pointers;

    if (pointers && pointers.length > 0) {
      const pointer = pointers[0];

      // 开始拖拽
      if (pointer.phase === PointerPhase.Down) {
        this.handlePointerDown(pointer);
      }
      // 拖拽中
      else if (pointer.phase === PointerPhase.Move && this.isDragging) {
        this.handlePointerMove(pointer);
      }
      // 结束拖拽（鼠标/触摸松开）
      else if (pointer.phase === PointerPhase.Up && this.isDragging) {
        this.handlePointerUp(pointer);
      }
    } 
    // 移动端触摸松开后，指针会从数组中移除
    // 如果 pointers 为空但还在拖拽状态，说明手指刚松开
    else if (this.isDragging) {
      this.handlePointerUp(null);
    }
  }

  private handlePointerDown(pointer: any) {
    if (!this.slingshot.canLaunch()) return;

    const worldPos = this.screenToWorld(pointer.position.x, pointer.position.y);
    if (!worldPos) return;

    // 检查是否点击在小鸟附近
    const birdPos = this.slingshot.getBirdPosition();
    const distance = Vector3.distance(worldPos, birdPos);

    if (distance < 2) {
      this.isDragging = true;
      this.dragStartPos.copyFrom(worldPos);
    }
  }

  private handlePointerMove(pointer: any) {
    const worldPos = this.screenToWorld(pointer.position.x, pointer.position.y);
    if (!worldPos) return;

    this.currentDragPos.copyFrom(worldPos);
    this.slingshot.updateDrag(worldPos);
    
    // 计算并显示轨迹
    const slingshotPos = this.slingshot.getPosition();
    const dragOffset = new Vector3();
    Vector3.subtract(slingshotPos, this.currentDragPos, dragOffset);
    
    // 限制最大拖拽距离
    const maxDrag = 3;
    const dragDistance = dragOffset.length();
    if (dragDistance > maxDrag) {
      dragOffset.scale(maxDrag / dragDistance);
    }
    
    const launchVelocity = dragOffset.scale(5);
    this.updateTrajectory(this.slingshot.getBirdPosition(), launchVelocity);
  }

  private handlePointerUp(pointer: any) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.clearTrajectory(); // 清除轨迹线
    
    // 计算发射速度
    const slingshotPos = this.slingshot.getPosition();
    const dragOffset = new Vector3();
    Vector3.subtract(slingshotPos, this.currentDragPos, dragOffset);

    // 限制最大拖拽距离
    const maxDrag = 3;
    const dragDistance = dragOffset.length();
    if (dragDistance > maxDrag) {
      dragOffset.scale(maxDrag / dragDistance);
    }

    // 速度与拖拽距离成正比
    const launchVelocity = dragOffset.scale(5);

    // 发射小鸟
    this.slingshot.launch(launchVelocity);
  }

  private screenToWorld(screenX: number, screenY: number): Vector3 | null {
    if (!this.camera) return null;

    const ray = new Ray();
    this.camera.screenPointToRay(new Vector2(screenX, screenY), ray);

    // 计算射线与Z=0平面的交点
    // ray.origin + t * ray.direction = (x, y, 0)
    // 解出 t: t = -ray.origin.z / ray.direction.z
    if (Math.abs(ray.direction.z) < 0.0001) return null;

    const t = -ray.origin.z / ray.direction.z;
    const worldPos = new Vector3();
    worldPos.x = ray.origin.x + t * ray.direction.x;
    worldPos.y = ray.origin.y + t * ray.direction.y;
    worldPos.z = 0;

    return worldPos;
  }

  /**
   * 更新抛物线轨迹预览
   * @param startPos 起始位置
   * @param velocity 初始速度
   */
  private updateTrajectory(startPos: Vector3, velocity: Vector3) {
    this.clearTrajectory();

    const gravity = -9.81; // 重力加速度
    const timeStep = 0.1; // 时间步长
    const maxPoints = 10; // 最多显示25个点
    
    for (let i = 1; i <= maxPoints; i++) { // 从1开始，跳过起始点
      const t = i * timeStep;
      
      // 抛物线运动公式: p = p0 + v*t + 0.5*a*t^2
      const x = startPos.x + velocity.x * t;
      const y = startPos.y + velocity.y * t + 0.5 * gravity * t * t;
      const z = startPos.z + velocity.z * t;
      
      // 只有当点明确低于地面时才停止（地面在y=-0.5左右）
      if (y < -1.0) {
        break;
      }
      
      // 如果飞得太远，停止绘制
      if (Math.abs(x) > 30) {
        break;
      }
      
      // 创建轨迹点
      const dotEntity = this.entity.createChild(`trajectory_${i}`);
      dotEntity.transform.setPosition(x, y, z);
      dotEntity.transform.setScale(0.1, 0.1, 0.1);
      
      const renderer = dotEntity.addComponent(MeshRenderer);
      renderer.mesh = PrimitiveMesh.createSphere(this.engine, 0.5);
      const material = new UnlitMaterial(this.engine);
      
      // 轨迹点颜色从白色渐变到透明
      const alpha = 1 - (i / maxPoints);
      material.baseColor = new Color(1, 1, 1, alpha);
      renderer.setMaterial(material);
      
      this.trajectoryEntities.push(dotEntity);
    }
  }

  /**
   * 清除轨迹线
   */
  private clearTrajectory() {
    for (const entity of this.trajectoryEntities) {
      entity.destroy();
    }
    this.trajectoryEntities = [];
  }
}

export class Slingshot {
  private engine: WebGLEngine;
  private rootEntity: Entity;
  private position: Vector3;
  private bird: Bird | null = null;
  private controlEntity: Entity;
  private script: SlingshotScript;
  private birdsUsed: number = 0;
  private maxBirds: number = 5; // 最多5只小鸟
  private onGameStart?: () => void;

  constructor(engine: WebGLEngine, parent: Entity, position: Vector3, maxBirds: number = 5) {
    this.engine = engine;
    this.rootEntity = parent;
    this.position = position;
    this.maxBirds = maxBirds;

    // 创建控制实体用于处理输入
    this.controlEntity = parent.createChild('slingshotControl');
    this.script = this.controlEntity.addComponent(SlingshotScript);
    this.script.setSlingshot(this);

    // 创建初始小鸟
    this.createBird();
    this.updateBirdCountDisplay();
  }

  // 设置游戏开始回调
  public setOnGameStart(callback: () => void) {
    this.onGameStart = callback;
  }

  private createBird() {
    this.bird = new Bird(this.engine, this.rootEntity, this.position.clone());
  }

  public canLaunch(): boolean {
    return this.bird !== null && !this.bird.isLaunched();
  }

  public getBirdPosition(): Vector3 {
    if (this.bird) {
      return this.bird.getEntity().transform.position;
    }
    return this.position;
  }

  public getPosition(): Vector3 {
    return this.position;
  }

  public updateDrag(dragPos: Vector3) {
    if (!this.bird || this.bird.isLaunched()) return;

    // 计算拖拽偏移
    const offset = new Vector3();
    Vector3.subtract(dragPos, this.position, offset);

    // 限制拖拽范围
    const maxDrag = 3;
    const distance = offset.length();
    if (distance > maxDrag) {
      offset.scale(maxDrag / distance);
    }

    // 只允许向后拖拽（限制在弹弓左侧）
    if (offset.x > 0) {
      offset.x = 0;
    }

    // 更新小鸟位置
    const newPos = new Vector3();
    Vector3.add(this.position, offset, newPos);
    this.bird.getEntity().transform.position = newPos;
  }

  public launch(velocity: Vector3) {
    if (!this.bird || this.bird.isLaunched()) return;

    // 第一次发射时，设置游戏就绪状态
    if (this.birdsUsed === 0) {
      GameState.isGameReady = true;
      console.log('🎮 游戏开始！伤害判断已启用');
      
      // 调用游戏开始回调
      if (this.onGameStart) {
        this.onGameStart();
      }
    }

    // 发射小鸟
    this.bird.launch(velocity);
    this.birdsUsed++;

    // 更新提示文本
    const instruction = document.getElementById('instruction');
    if (instruction) {
      instruction.textContent = '等待小鸟击中目标...';
    }

    // 3秒后创建新小鸟（如果还有剩余）
    setTimeout(() => {
      if (this.birdsUsed < this.maxBirds) {
        this.createBird();
        const instruction = document.getElementById('instruction');
        if (instruction) {
          instruction.textContent = '拖动红色小鸟并松手发射！';
        }
      } else {
        const instruction = document.getElementById('instruction');
        if (instruction) {
          instruction.textContent = '⚠️ 小鸟用完了！';
          instruction.style.background = 'rgba(255,100,100,0.5)';
        }
        // 检查是否失败
        this.checkGameOver();
      }
      this.updateBirdCountDisplay();
    }, 3000);

    this.updateBirdCountDisplay();
  }

  private updateBirdCountDisplay() {
    const instruction = document.getElementById('instruction');
    if (instruction && this.birdsUsed < this.maxBirds) {
      const remaining = this.maxBirds - this.birdsUsed;
      instruction.textContent = `🐦 剩余小鸟: ${remaining} | 拖动小鸟发射！`;
    }
  }

  private checkGameOver() {
    // 5秒后检查游戏结果
    setTimeout(() => {
      const instruction = document.getElementById('instruction');
      const restartBtn = document.getElementById('restart-btn');
      
      if (instruction) {
        instruction.textContent = '😢 游戏结束！小鸟用完了！';
        instruction.style.background = 'rgba(255,0,0,0.5)';
      }
      
      if (restartBtn) {
        restartBtn.style.display = 'block';
      }
    }, 5000);
  }

  public getBirdsUsed(): number {
    return this.birdsUsed;
  }

  public getBirdsRemaining(): number {
    return this.maxBirds - this.birdsUsed;
  }
}
