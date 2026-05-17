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

const game = new Phaser.Game(config);
