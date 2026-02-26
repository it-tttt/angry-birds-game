import { 
  Entity,
  WebGLEngine, 
  Vector3, 
  StaticCollider, 
  PlaneColliderShape,
  MeshRenderer,
  PrimitiveMesh,
  UnlitMaterial,
  Color,
  BoxColliderShape
} from '@galacean/engine';
import { Bird } from '../entities/Bird';
import { Pig, GameState } from '../entities/Pig';
import { Block } from '../entities/Block';
import { Slingshot } from '../entities/Slingshot';
import { GameManager } from '../managers/GameManager';
import { ObjectPool } from '../managers/ObjectPool';

export class GameScene {
  private engine: WebGLEngine;
  private rootEntity: Entity;
  private slingshot: Slingshot | null = null;
  private pigs: Pig[] = [];
  private blocks: Block[] = [];
  private gameManager: GameManager | null = null;

  constructor(engine: WebGLEngine, rootEntity: Entity) {
    this.engine = engine;
    this.rootEntity = rootEntity;
  }

  async init() {
    // 重置游戏就绪状态
    GameState.isGameReady = false;
    
    // 创建地面
    this.createGround();

    // 创建弹弓和小鸟
    this.createSlingshot();

    // 创建建筑和小猪
    this.createLevel();

    // 设置游戏管理器
    this.setupGameManager();

    // 设置重新开始按钮
    this.setupRestartButton();
  }

  // 设置游戏就绪状态
  public setGameReady() {
    GameState.isGameReady = true;
    console.log('游戏开始！伤害判断已启用');
  }

  private createGround() {
    const groundEntity = this.rootEntity.createChild('ground');
    groundEntity.transform.setPosition(0, -0.5, 0);

    // 添加静态碰撞体作为地面
    const collider = groundEntity.addComponent(StaticCollider);
    const planeShape = new PlaneColliderShape();
    collider.addShape(planeShape);

    // 创建地面的可视化（绿色地面）
    const groundVisual = groundEntity.createChild('groundVisual');
    groundVisual.transform.setPosition(0, -0.5, 0);
    groundVisual.transform.setRotation(-90, 0, 0);
    groundVisual.transform.setScale(50, 50, 1);

    const renderer = groundVisual.addComponent(MeshRenderer);
    renderer.mesh = PrimitiveMesh.createPlane(this.engine);
    const material = new UnlitMaterial(this.engine);
    material.baseColor = new Color(0.4, 0.7, 0.3, 1); // 草绿色
    renderer.setMaterial(material);

    // 添加侧边墙防止物体飞出
    this.createWall(-15, 5, 0);
    this.createWall(15, 5, 0);
  }

  private createWall(x: number, y: number, z: number) {
    const wallEntity = this.rootEntity.createChild('wall');
    wallEntity.transform.setPosition(x, y, z);

    const collider = wallEntity.addComponent(StaticCollider);
    const boxShape = new BoxColliderShape();
    boxShape.size = new Vector3(1, 20, 10);
    collider.addShape(boxShape);
  }

  private createSlingshot() {
    const slingshotPos = new Vector3(-8, 2, 0);
    
    // 创建弹弓底座
    const baseEntity = this.rootEntity.createChild('slingshotBase');
    baseEntity.transform.setPosition(slingshotPos.x, slingshotPos.y - 1, slingshotPos.z);
    baseEntity.transform.setScale(0.5, 2, 0.5);

    const renderer = baseEntity.addComponent(MeshRenderer);
    renderer.mesh = PrimitiveMesh.createCuboid(this.engine);
    const material = new UnlitMaterial(this.engine);
    material.baseColor = new Color(0.4, 0.2, 0.1, 1); // 棕色
    renderer.setMaterial(material);

    // 创建弹弓（限制5只小鸟）
    this.slingshot = new Slingshot(this.engine, this.rootEntity, slingshotPos, 5);
    
    // 设置游戏开始回调
    this.slingshot.setOnGameStart(() => {
      this.setGameReady();
    });
  }

  private createLevel() {
    // 建筑和小猪的位置（屏幕右侧）
    const baseX = 8;
    const baseY = 1;

    // 第一层：地基
    this.createBlock(baseX - 2, baseY, 0, 1, 3, 1); // 左柱子
    this.createBlock(baseX + 2, baseY, 0, 1, 3, 1); // 右柱子
    this.createBlock(baseX, baseY + 2.5, 0, 4, 0.5, 1); // 顶部横梁

    // 在建筑中间放置小猪
    this.createPig(baseX, baseY + 1, 0);

    // 第二层
    this.createBlock(baseX - 1.5, baseY + 3.5, 0, 1, 2, 1);
    this.createBlock(baseX + 1.5, baseY + 3.5, 0, 1, 2, 1);
    this.createBlock(baseX, baseY + 5, 0, 3, 0.5, 1);

    // 第二只小猪
    this.createPig(baseX, baseY + 3.8, 0);
  }

  private createBlock(x: number, y: number, z: number, width: number, height: number, depth: number) {
    const block = new Block(this.engine, this.rootEntity, new Vector3(x, y, z), width, height, depth);
    this.blocks.push(block);
  }

  private createPig(x: number, y: number, z: number) {
    const pig = new Pig(this.engine, this.rootEntity, new Vector3(x, y, z));
    this.pigs.push(pig);
  }

  private setupGameManager() {
    const managerEntity = this.rootEntity.createChild('gameManager');
    this.gameManager = managerEntity.addComponent(GameManager);
    this.gameManager.setGameScene(this);
  }

  private setupRestartButton() {
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  public checkWinCondition() {
    // 过滤掉已经被销毁的小猪(entity已不存在)
    this.pigs = this.pigs.filter(pig => pig.getEntity() && !pig.getEntity().destroyed);
    
    // 检查所有小猪是否被击倒
    const allPigsDead = this.pigs.every(pig => !pig.isAlive());
    
    if (allPigsDead && this.pigs.length > 0) {
      this.showWinMessage();
    }
  }

  private showWinMessage() {
    const instruction = document.getElementById('instruction');
    const restartBtn = document.getElementById('restart-btn');
    
    if (instruction) {
      instruction.textContent = '🎉 胜利！所有小猪都被击倒了！';
      instruction.style.background = 'rgba(0,255,0,0.5)';
    }
    
    if (restartBtn) {
      restartBtn.style.display = 'block';
    }
  }
}
