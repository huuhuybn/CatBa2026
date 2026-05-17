import Phaser from 'phaser';
import PlazaScene from './scenes/PlazaScene.js';

// Kiểm tra hướng màn hình lúc vừa vào game
const isPortrait = window.innerHeight > window.innerWidth;
const gameWidth = isPortrait ? 1024 : 1536;
const gameHeight = isPortrait ? 1536 : 1024;

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: gameWidth,
    height: gameHeight
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
  // Kiểm tra xem có phải thiết bị di động không
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Cố gắng bật toàn màn hình trên di động
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      // Bỏ qua lỗi âm thầm
    }
    
    // Cố gắng xoay ngang màn hình (Chỉ hoạt động trên di động và sau khi đã bật toàn màn hình)
    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (e) {
      // Bỏ qua lỗi âm thầm (đặc biệt trên PC sẽ văng lỗi NotSupportedError)
    }
  }
  
  // Ẩn lớp phủ và khởi tạo game
  startOverlay.style.display = 'none';
  const game = new Phaser.Game(config);
});
