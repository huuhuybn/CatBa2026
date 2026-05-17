import Phaser from 'phaser';
import { io } from 'socket.io-client';
import { catBaQuotes } from '../data/CatBaJokes.js';

export default class PlazaScene extends Phaser.Scene {
  constructor() {
    super('PlazaScene');
    this.players = {}; // Store other players
  }

  preload() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Vẽ thanh Loading của Phaser
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Đang tải bản đồ Đảo Cát Bà...',
      style: { font: '24px Arial', fill: '#ffffff' }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: { font: '20px Arial', fill: '#ffffff' }
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffcc00, 1); // Màu vàng
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load assets (Đổi thành đường dẫn tương đối ./ để tránh lỗi 404 khi deploy)
    this.load.image('bg', './assets/bg.png');
    // Load the JSON map (exported as .tmj)
    this.load.tilemapTiledJSON('map', './assets/gatePoly.tmj');
    // Load Frog spritesheet (32x32 based on dimensions)
    this.load.spritesheet('frog', './assets/Frog.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    // 1. Setup Map
    this.cameras.main.setBackgroundColor('#000000');
    
    // Initialize Tilemap
    const map = this.make.tilemap({ key: 'map' });
    
    // Add tileset (The name 'bg' must match the name of the tileset inside Tiled)
    const tileset = map.addTilesetImage('bg', 'bg');
    
    // Draw the background image directly (matching Image Layer 1)
    this.add.image(0, 0, 'bg').setOrigin(0, 0);

    // Create the 'Area' layer which contains collision data
    const areaLayer = map.createLayer('Area', tileset, 0, 0);
    
    // Set collision for any tile index > 0 in the Area layer
    areaLayer.setCollisionByExclusion([-1, 0]);

    // Create Frog Animations
    this.anims.create({
      key: 'idle',
      frames: [ { key: 'frog', frame: 0 } ],
      frameRate: 10
    });
    this.anims.create({
      key: 'walk',
      // The user specified 11 frames, but image is 384px (12 frames). We'll use 0 to 10 as requested.
      frames: this.anims.generateFrameNumbers('frog', { start: 0, end: 10 }),
      frameRate: 20,
      repeat: -1
    });

    // 2. Setup Local Player (Frog Sprite)
    // Bắt đầu ở giữa bản đồ (Map size: 1536 x 1024)
    const startX = 1536 / 2;
    const startY = 1024 / 2;
    
    this.player = this.physics.add.sprite(startX, startY, 'frog');
    this.player.setOrigin(0.5, 0.5);
    
    // Phóng to con ếch lên 1.5 lần
    this.player.setScale(1.5);
    
    // Tên hiển thị trên đầu Player
    this.player.nameText = this.add.text(startX, startY - 40, 'Bạn', {
      fontFamily: 'Arial',
      fontSize: 28, // Tăng gấp đôi
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 5,
      resolution: 3
    }).setOrigin(0.5, 0.5);
    
    // Thu nhỏ hitbox chỉ tính phần chân (chiều rộng 20px, chiều cao 10px, đặt ở sát dưới đáy frame 32x32)
    this.player.body.setSize(20, 10);
    this.player.body.setOffset(6, 22);
    
    this.player.body.setCollideWorldBounds(true);
    
    // Add collision between player and the Area layer
    this.physics.add.collider(this.player, areaLayer);
    
    // 2.5 Setup 10 Random NPC Frogs
    this.npcs = this.physics.add.group();
    
    // Giới hạn khu vực sinh ra ếch tập trung tại ĐÚNG một điểm ở giữa màn hình
    const centerX = 1536 / 2;
    const centerY = 1024 / 2;
    
    // Array chứa tên người (đã được viết tắt)
    const npcNames = [
      'LoanTT', 'MaiDTT', 'DinhTV', 'HangLT', 'MinhHN', 'DatLT', 'ThuyVT', 'HoaDV', 
      'NganDT', 'LocNV', 'HuyNH', 'HungNQ', 'AnhNH', 'HaLT', 'LoanNT', 'NgocBQ', 
      'NhungNH', 'ThuyDT', 'TrungDQ', 'MinhTHT', 'AnhND', 'HungCV', 'ChinhPD', 
      'LuuDV', 'NgocNV'
    ];
    
    // Lấy ngẫu nhiên 10 tên từ danh sách
    const selectedNames = Phaser.Utils.Array.Shuffle([...npcNames]).slice(0, 10);
    
    // Tạo 10 con ếch tương ứng với 10 cái tên vừa bốc ngẫu nhiên
    for (let i = 0; i < selectedNames.length; i++) {
      const npc = this.npcs.create(centerX, centerY, 'frog');
      
      npc.setOrigin(0.5, 0.5);
      npc.setScale(1.5);
      npc.body.setSize(20, 10);
      npc.body.setOffset(6, 22);
      npc.body.setCollideWorldBounds(true);
      npc.body.setBounce(1); // Bật lại khi đụng tường
      
      // Tạo tên trên đầu ếch NPC
      npc.originalName = selectedNames[i];
      npc.isSpeaking = false;
      npc.nameText = this.add.text(centerX, centerY - 40, npc.originalName, {
        fontFamily: 'Arial',
        fontSize: 28, // Tăng gấp đôi
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
        resolution: 3
      }).setOrigin(0.5, 0.5);
      
      npc.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
      npc.anims.play('walk', true);
    }
    
    this.physics.add.collider(this.npcs, areaLayer);
    this.physics.add.collider(this.npcs, this.npcs);
    
    // Đợi 2 giây sau khi vào game mới kích hoạt va chạm giữa Player và NPC
    this.time.delayedCall(2000, () => {
      this.physics.add.collider(this.player, this.npcs, (player, npc) => {
        if (!npc.isSpeaking) {
          npc.isSpeaking = true;
          const quote = Phaser.Math.RND.pick(catBaQuotes); // Lấy ngẫu nhiên 1 câu
          
          // Hiển thị bong bóng chat
          npc.nameText.setText(quote);
          npc.nameText.setStyle({ 
            wordWrap: { width: 300, useAdvancedWrap: true }, 
            fontSize: '24px', 
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#ffffff',
            padding: { left: 8, right: 8, top: 8, bottom: 8 },
            resolution: 3
          });
          // Nâng bong bóng lên cao một chút để không che mất ếch
          npc.nameText.setY(npc.y - 70); 
          
          // Trả lại tên cũ sau 4 giây
          this.time.delayedCall(4000, () => {
            if (npc && npc.nameText) {
              npc.nameText.setText(npc.originalName);
              npc.nameText.setStyle({ 
                wordWrap: null, 
                fontSize: '28px', 
                backgroundColor: 'transparent',
                color: '#ffffff',
                padding: 0,
                resolution: 3
              });
              npc.nameText.setY(npc.y - 40);
              npc.isSpeaking = false;
            }
          });
        }
      });
    });
    
    // Randomly change NPC directions every 2 seconds
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        this.npcs.getChildren().forEach(npc => {
          if (Phaser.Math.Between(0, 10) > 8) { // 20% đứng im
            npc.setVelocity(0, 0);
            npc.anims.play('idle', true);
          } else {
            npc.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
            npc.anims.play('walk', true);
          }
        });
      },
      loop: true
    });
    
    // Set world bounds based on map dimensions
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05); // smooth camera follow

    // 3. Setup Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // 4. Setup Networking (Socket.IO)
    this.setupSocket();
    
    // 5. Kiểm tra thiết bị di động (hoặc màn hình cảm ứng) để hiển thị Joystick
    if (this.sys.game.device.os.android || this.sys.game.device.os.iOS || this.sys.game.device.input.touch) {
      this.createVirtualJoystick();
    }
  }

  createVirtualJoystick() {
    this.joystickActive = false;
    this.joystickVector = new Phaser.Math.Vector2(0, 0);

    const gh = this.scale.height;

    // Vẽ vòng tròn nền mờ ở góc dưới bên trái (cách lề trái 225px, cách lề dưới 225px)
    this.joystickBase = this.add.circle(225, gh - 225, 150, 0x888888, 0.5)
      .setDepth(100)
      .setScrollFactor(0);
      
    // Vẽ nút gạt bên trong
    this.joystickThumb = this.add.circle(225, gh - 225, 75, 0xcccccc, 0.8)
      .setDepth(101)
      .setScrollFactor(0);

    this.input.on('pointerdown', (pointer) => {
      // Vì setScrollFactor(0), tọa độ joystickBase.x,y là tọa độ trên camera viewport
      // So sánh với pointer.camera.x hoặc pointer.x 
      if (Phaser.Math.Distance.Between(pointer.x, pointer.y, this.joystickBase.x, this.joystickBase.y) < 225) {
        this.joystickActive = true;
        this.updateJoystick(pointer);
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.joystickActive) {
        this.updateJoystick(pointer);
      }
    });

    this.input.on('pointerup', () => {
      this.joystickActive = false;
      this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
      this.joystickVector.set(0, 0);
    });
  }

  updateJoystick(pointer) {
    const maxDist = 150;
    let angle = Phaser.Math.Angle.Between(this.joystickBase.x, this.joystickBase.y, pointer.x, pointer.y);
    let dist = Phaser.Math.Distance.Between(this.joystickBase.x, this.joystickBase.y, pointer.x, pointer.y);

    if (dist > maxDist) {
      dist = maxDist;
    }

    this.joystickThumb.x = this.joystickBase.x + Math.cos(angle) * dist;
    this.joystickThumb.y = this.joystickBase.y + Math.sin(angle) * dist;

    // Vector điều hướng (-1 đến 1)
    this.joystickVector.x = (this.joystickThumb.x - this.joystickBase.x) / maxDist;
    this.joystickVector.y = (this.joystickThumb.y - this.joystickBase.y) / maxDist;
  }

  setupSocket() {
    // Connect to the local server we will build later
    this.socket = io('http://localhost:3000', {
      autoConnect: false // We can change to true when server is ready, or keep it true and let it try
    });
    
    // For now, let's connect automatically
    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('Connected to Server!');
      // Send our initial position
      this.socket.emit('newPlayer', {
        x: this.player.x,
        y: this.player.y
      });
    });

    // Receive current players
    this.socket.on('currentPlayers', (players) => {
      Object.keys(players).forEach((id) => {
        if (players[id].playerId === this.socket.id) {
          // It's us, do nothing since we already created our player
        } else {
          // Add other player
          this.addOtherPlayer(players[id]);
        }
      });
    });

    // New player joined
    this.socket.on('newPlayerJoined', (playerInfo) => {
      this.addOtherPlayer(playerInfo);
    });

    // Player disconnected
    this.socket.on('playerDisconnected', (playerId) => {
      if (this.players[playerId]) {
        this.players[playerId].destroy();
        delete this.players[playerId];
      }
    });

    // Player moved
    this.socket.on('playerMoved', (playerInfo) => {
      if (this.players[playerInfo.playerId]) {
        this.players[playerInfo.playerId].setPosition(playerInfo.x, playerInfo.y);
      }
    });
  }

  addOtherPlayer(playerInfo) {
    // Create Frog sprite for other player
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'frog');
    otherPlayer.setTint(0xffaaaa);
    otherPlayer.setScale(1.5); // Cùng kích thước với local player
    otherPlayer.anims.play('idle', true);
    
    otherPlayer.nameText = this.add.text(playerInfo.x, playerInfo.y - 40, 'Người chơi khác', {
      fontFamily: 'Arial',
      fontSize: 28,
      color: '#ffaaaa',
      stroke: '#000000',
      strokeThickness: 5,
      resolution: 3
    }).setOrigin(0.5, 0.5);
    
    this.players[playerInfo.playerId] = otherPlayer;
  }

  update() {
    const speed = 200;
    let isMoving = false;
    
    // Cập nhật vị trí chữ trên đầu Local Player
    if (this.player.nameText) {
      this.player.nameText.setPosition(this.player.x, this.player.y - 40);
    }
    
    // Cập nhật vị trí chữ cho Other Players (tạm thời để ở đây)
    Object.values(this.players).forEach(other => {
      if (other.nameText) {
        other.nameText.setPosition(other.x, other.y - 40);
      }
    });
    
    // Reset velocity
    let vx = 0;
    let vy = 0;

    // Horizontal movement (Bàn phím)
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      vx = -speed;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      vx = speed;
    }

    // Vertical movement (Bàn phím)
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      vy = -speed;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      vy = speed;
    }
    
    // Áp dụng Joystick (ghi đè phím nếu có thao tác chạm)
    if (this.joystickVector && (this.joystickVector.x !== 0 || this.joystickVector.y !== 0)) {
      vx = this.joystickVector.x * speed;
      vy = this.joystickVector.y * speed;
    }

    this.player.body.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      isMoving = true;
      if (vx < 0) this.player.setFlipX(true);
      if (vx > 0) this.player.setFlipX(false);
    }
    
    // Play animation
    if (isMoving) {
      this.player.anims.play('walk', true);
    } else {
      this.player.anims.play('idle', true);
    }

    // Emit movement to server if we moved
    const x = this.player.x;
    const y = this.player.y;
    
    if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
      if (this.socket && this.socket.connected) {
        this.socket.emit('playerMovement', { x: x, y: y });
      }
    }
    
    // Save old position data
    this.player.oldPosition = {
      x: this.player.x,
      y: this.player.y
    };
    
    // Cập nhật hướng nhìn và vị trí tên cho NPCs
    if (this.npcs) {
      this.npcs.getChildren().forEach(npc => {
        if (npc.body.velocity.x < 0) {
          npc.setFlipX(true);
        } else if (npc.body.velocity.x > 0) {
          npc.setFlipX(false);
        }
        
        // Kéo chữ đi theo NPC
        if (npc.nameText) {
          const offset = npc.isSpeaking ? 70 : 40;
          npc.nameText.setPosition(npc.x, npc.y - offset);
        }
      });
    }
  }
}
