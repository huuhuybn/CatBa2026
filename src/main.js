import Phaser from 'phaser';
import PlazaScene from './scenes/PlazaScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1536, // Kích thước bằng đúng với map (96 * 16)
    height: 1024, // Kích thước bằng đúng với map (64 * 16)
    // Đề xuất xoay ngang nếu chơi trên điện thoại
    orientation: Phaser.Scale.LANDSCAPE
  },
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Top-down, no gravity
      debug: false
    }
  },
  scene: [PlazaScene]
};

// JS đã tải xong, ẩn màn hình loading
document.getElementById('loading-screen').style.display = 'none';

// Hiển thị lớp phủ yêu cầu bấm nút để vào game
const startOverlay = document.getElementById('start-overlay');
startOverlay.style.display = 'flex';

document.getElementById('start-btn').addEventListener('click', async () => {
  // Cố gắng bật toàn màn hình
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (e) {
    console.log("Fullscreen API error:", e);
  }
  
  // Cố gắng xoay ngang màn hình (Chỉ hoạt động trên di động và sau khi đã bật toàn màn hình)
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (e) {
    console.log("Orientation Lock error:", e);
  }
  
  // Ẩn lớp phủ và khởi tạo game
  startOverlay.style.display = 'none';
  const game = new Phaser.Game(config);
});
