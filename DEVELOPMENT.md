# 游戏开发快速指南

## 项目结构

```
angry-birds-game/
├── src/
│   ├── main.ts              # 游戏初始化入口
│   ├── scenes/
│   │   └── GameScene.ts     # 主游戏场景（管理关卡布局）
│   ├── entities/
│   │   ├── Bird.ts          # 小鸟实体和脚本
│   │   ├── Pig.ts           # 小猪实体和脚本
│   │   ├── Block.ts         # 建筑方块实体
│   │   └── Slingshot.ts     # 弹弓系统（拖拽发射）
│   └── managers/
│       └── GameManager.ts   # 游戏管理器（胜利条件检测）
├── index.html               # HTML入口
└── package.json
```

## 核心概念

### 1. 实体系统（Entity）

每个游戏对象都是一个 Entity：
- Entity 是场景树的节点
- 通过 `addComponent()` 添加功能组件
- 通过 `transform` 控制位置、旋转、缩放

### 2. 物理系统

#### 碰撞体类型：
- **DynamicCollider**：动态物体（小鸟、小猪、建筑）
  - 受重力影响
  - 参与物理模拟
  - 可以移动和旋转
  
- **StaticCollider**：静态物体（地面、墙壁）
  - 不移动
  - 作为碰撞边界

#### 碰撞形状：
- **SphereColliderShape**：球形（小鸟）
- **BoxColliderShape**：方形（小猪、建筑）
- **PlaneColliderShape**：平面（地面）

### 3. 脚本系统（Script）

继承 `Script` 类创建自定义逻辑：

```typescript
export class MyScript extends Script {
  onAwake() {
    // 初始化，组件创建时调用一次
  }

  onUpdate(deltaTime: number) {
    // 每帧更新，deltaTime是时间增量（秒）
  }
}
```

### 4. 材质和渲染

使用 `UnlitMaterial` 创建纯色材质：

```typescript
const material = new UnlitMaterial(engine);
material.baseColor = new Color(r, g, b, a); // RGBA，范围0-1
```

## 游戏机制详解

### 弹弓系统

1. **拖拽检测**：
   - 通过 `inputManager.pointers` 获取触摸/鼠标输入
   - 使用 `PointerPhase` 判断拖拽状态（Down/Move/Up）

2. **屏幕坐标转世界坐标**：
   - 使用 `camera.screenPointToRay()` 创建射线
   - 计算射线与游戏平面（Z=0）的交点

3. **发射计算**：
   - 拖拽距离 = 弹弓位置 - 当前拖拽位置
   - 发射速度 = 拖拽距离 × 力度倍数

### 小猪倒下判定

检测小猪的旋转角度：

```typescript
const rotation = this.entity.transform.rotationQuaternion;
const euler = new Vector3();
rotation.toEuler(euler);

const angleX = Math.abs(euler.x * 180 / Math.PI);
const angleZ = Math.abs(euler.z * 180 / Math.PI);

if (angleX > 45 || angleZ > 45) {
  // 小猪倒下
}
```

### 胜利条件

通过 `GameManager` 每秒检查：
- 遍历所有小猪
- 判断是否全部倒下
- 显示胜利信息

## 调整游戏参数

### 物理参数

**小鸟（Bird.ts）**：
```typescript
collider.mass = 1.0;              // 质量
sphereShape.radius = 0.5;         // 半径
```

**小猪（Pig.ts）**：
```typescript
collider.mass = 2.0;              // 质量
boxShape.size = new Vector3(1, 1, 1);  // 大小
```

**建筑（Block.ts）**：
```typescript
collider.mass = 5.0;              // 质量越大越稳定
```

### 弹弓参数

**Slingshot.ts**：
```typescript
const maxDrag = 3;                // 最大拖拽距离
const launchVelocity = dragOffset.scale(5);  // 发射力度（倍数）
```

### 关卡布局

**GameScene.ts** 的 `createLevel()` 方法：
```typescript
// 调整建筑位置
this.createBlock(x, y, z, width, height, depth);

// 调整小猪位置
this.createPig(x, y, z);
```

## 添加新关卡

在 `GameScene.ts` 中创建新的关卡方法：

```typescript
private createLevel2() {
  const baseX = 8;
  const baseY = 1;

  // 创建更复杂的建筑结构
  this.createBlock(baseX - 3, baseY, 0, 1, 4, 1);
  this.createBlock(baseX + 3, baseY, 0, 1, 4, 1);
  this.createBlock(baseX, baseY + 3, 0, 6, 0.5, 1);

  // 放置更多小猪
  this.createPig(baseX - 2, baseY + 1, 0);
  this.createPig(baseX + 2, baseY + 1, 0);
  this.createPig(baseX, baseY + 3.5, 0);
}
```

## 调试技巧

### 1. 查看物理状态

在脚本的 `onUpdate()` 中打印信息：

```typescript
onUpdate() {
  console.log('Position:', this.entity.transform.position);
  console.log('Velocity:', this.collider.linearVelocity);
}
```

### 2. 显示碰撞边界

可以添加半透明的可视化来显示碰撞体：

```typescript
const material = new UnlitMaterial(engine);
material.baseColor = new Color(1, 0, 0, 0.3); // 半透明红色
```

### 3. 调整相机视角

在 `main.ts` 中修改相机位置：

```typescript
cameraEntity.transform.setPosition(0, 5, 20); // 向后移动看更广
camera.orthographicSize = 12; // 增大视野范围
```

## 性能优化建议

1. **限制物体数量**：建筑方块不要超过20个
2. **及时清理**：发射出屏幕的小鸟会自动销毁
3. **降低检测频率**：胜利条件每秒检查一次即可
4. **使用对象池**：如果需要频繁创建小鸟，考虑对象池

## 移动端测试

1. **Chrome DevTools 模拟器**：
   - 打开开发者工具（F12）
   - 点击设备模拟按钮
   - 选择移动设备

2. **实际设备测试**：
   - 确保电脑和手机在同一WiFi
   - 访问 `http://[你的IP]:3000`

## 常见问题

### Q: 小鸟发射没有力度？
A: 检查 `Slingshot.ts` 中的 `launchVelocity` 参数，增大倍数。

### Q: 小猪太容易倒下？
A: 增加小猪的 `mass`，或调整建筑的高度和稳定性。

### Q: 拖拽不灵敏？
A: 检查 HTML 中的 `touch-action: none` CSS 设置。

### Q: 画面模糊？
A: 确保正确设置了 `devicePixelRatio` 和 `resizeByClientSize(dpr)`。

## 扩展建议

1. **添加音效**：碰撞声、发射声
2. **添加粒子效果**：小猪被击中的爆炸效果
3. **多种小鸟**：不同能力（加速、分裂、炸弹）
4. **关卡系统**：多个关卡，保存进度
5. **计分系统**：根据使用的小鸟数量和剩余建筑计分
6. **星级评价**：1-3星评价系统
7. **慢动作**：小鸟飞行时按住屏幕慢动作
