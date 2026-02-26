import { Entity } from '@galacean/engine';

/**
 * 对象池管理器
 * 用于高效管理频繁创建和销毁的游戏对象
 */
export class ObjectPool<T> {
  private availableObjects: T[] = [];
  private activeObjects: Set<T> = new Set();
  private createFunc: () => T;
  private resetFunc: (obj: T) => void;
  private onGetFunc?: (obj: T) => void;
  private onReleaseFunc?: (obj: T) => void;

  constructor(
    createFunc: () => T,
    resetFunc: (obj: T) => void,
    initialSize: number = 0,
    onGetFunc?: (obj: T) => void,
    onReleaseFunc?: (obj: T) => void
  ) {
    this.createFunc = createFunc;
    this.resetFunc = resetFunc;
    this.onGetFunc = onGetFunc;
    this.onReleaseFunc = onReleaseFunc;

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFunc();
      this.availableObjects.push(obj);
    }
  }

  /**
   * 从池中获取一个对象
   */
  public get(): T {
    let obj: T;

    if (this.availableObjects.length > 0) {
      obj = this.availableObjects.pop()!;
    } else {
      obj = this.createFunc();
    }

    this.activeObjects.add(obj);
    
    if (this.onGetFunc) {
      this.onGetFunc(obj);
    }

    return obj;
  }

  /**
   * 将对象归还到池中
   */
  public release(obj: T): void {
    if (!this.activeObjects.has(obj)) {
      console.warn('尝试释放不在活动列表中的对象');
      return;
    }

    this.activeObjects.delete(obj);
    this.resetFunc(obj);
    
    if (this.onReleaseFunc) {
      this.onReleaseFunc(obj);
    }

    this.availableObjects.push(obj);
  }

  /**
   * 获取当前活动对象数量
   */
  public getActiveCount(): number {
    return this.activeObjects.size;
  }

  /**
   * 获取池中可用对象数量
   */
  public getAvailableCount(): number {
    return this.availableObjects.length;
  }

  /**
   * 获取所有活动对象
   */
  public getActiveObjects(): T[] {
    return Array.from(this.activeObjects);
  }

  /**
   * 清空对象池
   */
  public clear(): void {
    this.availableObjects = [];
    this.activeObjects.clear();
  }
}

/**
 * 实体对象池管理器
 * 专门用于管理 Entity 的对象池
 */
export class EntityPool {
  private pool: ObjectPool<Entity>;

  constructor(
    createFunc: () => Entity,
    initialSize: number = 0
  ) {
    this.pool = new ObjectPool<Entity>(
      createFunc,
      (entity) => {
        // 重置实体状态
        entity.isActive = false;
      },
      initialSize,
      (entity) => {
        // 激活实体
        entity.isActive = true;
      },
      (entity) => {
        // 禁用实体
        entity.isActive = false;
      }
    );
  }

  public get(): Entity {
    return this.pool.get();
  }

  public release(entity: Entity): void {
    this.pool.release(entity);
  }

  public getActiveCount(): number {
    return this.pool.getActiveCount();
  }

  public getAvailableCount(): number {
    return this.pool.getAvailableCount();
  }

  public getActiveEntities(): Entity[] {
    return this.pool.getActiveObjects();
  }

  public clear(): void {
    this.pool.clear();
  }
}
