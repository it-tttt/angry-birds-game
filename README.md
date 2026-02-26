# Angry Birds Game

一个使用 Galacean Engine 和 Galacean Skills(https://github.com/ArimaKana/galacean-skills) 开发的类似愤怒的小鸟的移动端2D物理游戏。

## 🎮 游戏玩法

- 🎯 **目标**：在限定的小鸟数量内击倒所有绿色小猪
- 🔴 **小鸟**：用红色圆球表示（可拖拽发射）
- 🟢 **小猪**：用绿色方块表示
- 🟤 **建筑**：用棕色方块表示（可被破坏）

## 操作说明

1. **拖动小鸟**：点击并拖动左侧的红色小鸟
2. **蓄力发射**：向后拖拽越远，发射力度越大
3. **松手发射**：松开手指/鼠标发射小鸟
4. **观察剩余**：顶部显示剩余小鸟数量
5. **击倒目标**：击倒所有小猪获胜
6. **注意限制**：只有5只小鸟，用完则失败

## 🏆 胜利条件

- 在5只小鸟内击倒所有小猪
- 小猪倾斜30度或移动速度超过3m/s即判定击倒
- 建筑破坏会压倒小猪

## 💀 失败条件

- 用完小鸟但仍有小猪存活
- 5秒后自动显示失败界面

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

游戏将在浏览器中自动打开，默认地址为 `http://localhost:3000`

### 3. 构建生产版本

```bash
npm run build
```

构建的文件将输出到 `dist` 目录。

## 技术栈

- **Galacean Engine**: 主游戏引擎
- ✅ 速度型碰撞伤害

### 破坏系统
- ✅ 建筑生命值系统
- ✅ 受损视觉反馈
- ✅ 爆炸破碎效果
- ✅ 自动清理机制

### 移动端优化
- ✅ 响应式设计，支持横竖屏
- ✅ 触摸控制
- ✅ 高DPI屏幕支持
- ✅ 性能优化

### 游戏机制
- ✅ 弹弓拖拽系统
- ✅ 小鸟数量限制（5只）
- ✅ 多重击倒判定（角度+速度）
- ✅ 实时UI反馈
- ✅ 自动胜利/失败判定
- ✅ 对象池管理
### 移动端优化
- ✅ 响应式设计，支持横竖屏
- ✅ 触摸控制
- ✅ 高DPI屏幕支持
- ✅ 性能优化

### 游戏机制
- ✅ 弹弓拖拽系统
- ✅ 小鸟发射机制
- ✅ 小猪倒下检测（基于旋转角度）
- ✅ 自动胜利判定
- ✅ 重新开始功能

## 项目结构
，优化击倒）
│   │   ├── Block.ts         # 建筑方块（可破坏）
│   │   └── Slingshot.ts     # 弹弓系统（限制数量）
│   └── managers/
│       ├── GameManager.ts   # 游戏管理器
│       └── ObjectPool.ts    # 对象池系统（新增）
├── index.html               # HTML入口
├── CHANGELOG.md             # 更新日志（新增）
├── DEVELOPMENT.md           # 开发指南
│   │   └── GameScene.ts     # 主游戏场景
│   ├── entities/
│   │   ├── Bird.ts          # 小鸟实体（圆形）
│   │   ├── Pig.ts           # 小猪实体（方形）
│   │   ├── Block.ts         # 建筑方块
│   │   └── Slingshot.ts     # 弹弓系统
│   └── managers/
│       └── GameManager.ts   # 游戏管理器
├── index.html               # HTML入口
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 开发说明

### 碰撞体类型

- **DynamicCollider**: 用于小鸟、小猪和建筑（受物理影响）
- **StaticCollider**: 用于地面和墙壁（不移动）

### 形状类型

- **SphereColliderShape**: 小鸟使用球形碰撞
- **BoxColliderShape**: 小猪和建筑使用方形碰撞
- **PlaneColliderShape**: 地面使用平面碰撞
关键参数

#### 小鸟数量限制
```typescript
// src/entities/Slingshot.ts
private maxBirds: number = 5;  // 修改最大小鸟数量
```

#### 小猪击倒阈值
```typescript
// src/entities/Pig.ts
if (angleX > 30 || angleZ > 30) {  // 角度阈值（度）
  this.die();
}

if (speed > 3) {  // 速度阈值（m/s）
  this.die();
}
```

#### 建筑破坏参数
```typescript
// src/entities/Block.ts
private health: number = 100;     // 建筑生命值
private maxHealth: number = 100;

// 伤害计算
const damage = (speed - 2) * 15;  // 速度阈值2m/s，伤害系数15
```

#### 物理属性
```typescript
// Bird.ts
collider.mass = 1.0;           // 小鸟质量

// Pig.ts
collider.mass = 1.0;           // 小猪质量

// Block.ts
collider.mass = 1.0;           // 建筑质量
```

#### 弹弓力度
```typescript
// Slingshot.ts
const maxDrag = 3;              
collider.mass = 2.0;           // 小猪质量
boxShape.size = new Vector3(1, 1, 1);  // 小猪大小
```

### Block.ts
```typescript
collider.mass = 5.0;           // 建筑质量
```

### Slingshot.ts
```typescript
const maxDrag = 3;             // 最大拖拽距离
const launchVelocity = dragOffset.scale(5);  // 发射力度倍数
```

## 浏览器支持

- Chrome (推荐)
- Safari
- Firefox
- Edge
- 移动端浏览器

## 📚 文档

- [CHANGELOG.md](CHANGELOG.md) - 详细的功能更新说明
- [DEVELOPMENT.md](DEVELOPMENT.md) - 开发指南和API文档

## 🎯 快速开始流程

1. **克隆或下载项目**
2. **安装依赖**：`npm install`
3. **启动开发服务器**：`npm run dev`
4. **开始游戏**：在浏览器中拖动小鸟发射
5. **调整参数**：参考上方的游戏平衡调整部分

## 🐛 已知问题

- TypeScript语言服务可能显示模块找不到，但实际编译运行正常
- PhysX物理引擎需要JavaScript模式，WASM模式可能需要额外配置

## 🔧 故障排除

### 小鸟无法发射
- 检查是否已使用完5只小鸟
- 确认是否在小鸟附近点击

### 小猪不倒下
- 检查小猪质量是否过大
- 确认角度和速度阈值设置

### 建筑不破坏
- 检查碰撞速度是否足够
- 确认生命值和伤害系数设置

## 许可证

MIT
