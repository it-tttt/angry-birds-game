import { WebGLEngine, Camera, Vector3, BackgroundMode, Color } from "@galacean/engine";
import { PhysXPhysics, PhysXRuntimeMode } from '@galacean/engine-physics-physx';
import { GameScene } from './scenes/GameScene';

async function init() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // 获取设备像素比
  const dpr = window.devicePixelRatio || 1;

  // 创建引擎，使用完整物理引擎
  const engine = await WebGLEngine.create({
    canvas,
    physics: new PhysXPhysics(PhysXRuntimeMode.JavaScript)
  });

  // 设置引擎的像素比，确保渲染清晰度
  engine.canvas.resizeByClientSize(dpr);

  // 禁止触摸默认行为
  canvas.style.touchAction = 'none';

  const scene = engine.sceneManager.activeScene;
  const rootEntity = scene.createRootEntity('root');

  // 设置天空背景色
  scene.background.mode = BackgroundMode.SolidColor;
  scene.background.solidColor = new Color(0.53, 0.81, 0.92, 1); // 天蓝色

  // 创建相机（使用正交投影的伪2D模式）
  const cameraEntity = rootEntity.createChild('camera');
  const camera = cameraEntity.addComponent(Camera);
  camera.isOrthographic = true;
  camera.orthographicSize = 10;
  camera.nearClipPlane = 0.1;
  camera.farClipPlane = 100;

  // 相机位置：在Z轴方向看向XY平面
  cameraEntity.transform.setPosition(0, 5, 20);
  cameraEntity.transform.lookAt(new Vector3(0, 5, 0));

  // 移动端适配
  const updateCameraAspect = () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspectRatio = aspect;
    
    // 根据屏幕比例调整相机视野
    if (aspect < 1) {
      // 竖屏
      camera.orthographicSize = 12;
    } else {
      // 横屏
      camera.orthographicSize = 10;
    }
    
    engine.canvas.resizeByClientSize(dpr);
  };

  updateCameraAspect();

  // 监听窗口大小变化
  window.addEventListener('resize', updateCameraAspect);

  // 创建游戏场景
  const gameScene = new GameScene(engine, rootEntity);
  await gameScene.init();

  // 启动引擎
  engine.run();

  console.log('Game initialized successfully!');
}

// 启动游戏
init().catch(console.error);
