import { Script, Entity } from '@galacean/engine';
import { GameScene } from '../scenes/GameScene';

export class GameManager extends Script {
  private gameScene: GameScene;
  private checkTimer: number = 0;
  private checkInterval: number = 1; // 每秒检查一次

  constructor(entity: Entity) {
    super(entity);
  }

  setGameScene(scene: GameScene) {
    this.gameScene = scene;
  }

  onUpdate(deltaTime: number) {
    if (!this.gameScene) return;

    this.checkTimer += deltaTime;
    
    if (this.checkTimer >= this.checkInterval) {
      this.checkTimer = 0;
      this.gameScene.checkWinCondition();
    }
  }
}
