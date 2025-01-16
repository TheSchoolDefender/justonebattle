class Enemy {
  constructor(x, y) {
    this.element = document.createElement('div');
    this.element.className = 'enemy';
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.health = 100;
    
    // Add health bar
    this.healthBar = document.createElement('div');
    this.healthBar.className = 'enemy-health-bar';
    this.healthBar.style.width = '100%';
    this.element.appendChild(this.healthBar);
    
    document.getElementById('game-screen').appendChild(this.element);
    this.speed = 2;
    this.isPoisoned = false;
    this.isStunned = false;
    this.poisonDamageInterval = null;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.healthBar.style.width = `${this.health}%`;
    return this.health <= 0;
  }

  startPoison() {
    if (this.isPoisoned) return;
    
    this.isPoisoned = true;
    this.element.style.filter = 'sepia(100%) hue-rotate(50deg)';
    
    this.poisonDamageInterval = setInterval(() => {
      this.takeDamage(5);
      if (this.health <= 0) {
        clearInterval(this.poisonDamageInterval);
      }
    }, 1000);
  }

  stun() {
    if (this.isStunned) return;
    
    this.isStunned = true;
    this.element.style.filter = 'brightness(1.5)';
    const originalSpeed = this.speed;
    this.speed = 0;
    
    setTimeout(() => {
      this.isStunned = false;
      this.speed = originalSpeed;
      this.element.style.filter = '';
    }, 2000);
  }

  moveTowards(playerX, playerY) {
    const enemyX = parseInt(this.element.style.left);
    const enemyY = parseInt(this.element.style.top);
    
    const angle = Math.atan2(playerY - enemyY, playerX - enemyX);
    const newX = enemyX + Math.cos(angle) * this.speed;
    const newY = enemyY + Math.sin(angle) * this.speed;
    
    this.element.style.left = `${newX}px`;
    this.element.style.top = `${newY}px`;
    
    return {x: newX, y: newY};
  }
}

class Inventory {
  constructor() {
    this.items = [];
    this.maxSpace = 20;
    this.isOpen = false;
    this.isUnlocked = false;
    this.selectedItem = null;
    this.element = document.createElement('div');
    this.element.className = 'inventory';
    this.element.style.display = 'none';
    
    this.detailsPanel = document.createElement('div');
    this.detailsPanel.className = 'inventory-details';
    this.element.appendChild(this.detailsPanel);
    
    this.slotsContainer = document.createElement('div');
    this.slotsContainer.className = 'inventory-slots';
    this.element.appendChild(this.slotsContainer);
    
    document.body.appendChild(this.element);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'i' && this.isUnlocked) {
        this.toggleInventory();
      }
    });
  }

  toggleInventory() {
    this.isOpen = !this.isOpen;
    this.element.style.display = this.isOpen ? 'flex' : 'none';
    this.render();
  }

  addItem(item) {
    if (this.items.length < this.maxSpace) {
      const existingItem = this.items.find(i => i.type === item.type);
      if (existingItem) {
        existingItem.count = (existingItem.count || 1) + 1;
      } else {
        this.items.push({ ...item, count: 1 });
      }
      this.render();
      return true;
    }
    return false;
  }

  updateDetailsPanel(item) {
    if (!item) {
      this.detailsPanel.innerHTML = '<p>Select an item to view details</p>';
      return;
    }

    const weaponDetails = {
      fork: {
        desc: "Fast throwing fork - Why the actual fork did they add this",
        stats: { damage: 15, attackSpeed: 800 }
      },
      knife: {
        desc: "Spinning throwing knife - Hard to cut :(",
        stats: { damage: 25, attackSpeed: 2000 }
      },
      spoon: {
        desc: "Triple throw spoon - What the hell??",
        stats: { damage: 25, attackSpeed: 1000 }
      },
      trident: {
        desc: "Loyalty III",
        stats: { damage: 40, attackSpeed: 1000 }
      },
      shovel: {
        desc: "I am a creature of the night",
        stats: { damage: 35, attackSpeed: 1200 }
      },
      sword: {
        desc: "it's so massive",
        stats: { damage: 45, attackSpeed: 1500 }
      }
    };

    const details = weaponDetails[item.type];
    const canCombine = this.getItemCount(item.type) >= 3;
    const currentlyEquipped = window.gameInstance.selectedWeapon === item.type;

    this.detailsPanel.innerHTML = `
      <img src="https://eagershop.vercel.app/${item.type}.png" alt="${item.type}">
      <h3>${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</h3>
      <p>${details.desc}</p>
      <div class="stats">
        <div>Damage: ${details.stats.damage}</div>
        <div>Attack Speed: ${details.stats.attackSpeed}ms</div>
      </div>
      <div class="item-actions">
        <button ${currentlyEquipped ? 'disabled' : ''} onclick="window.gameInstance.inventory.equipItem('${item.type}')">
          ${currentlyEquipped ? 'Equipped' : 'Equip'}
        </button>
        <button onclick="window.gameInstance.inventory.sellItem('${item.type}')">Sell</button>
        ${canCombine ? `<button onclick="window.gameInstance.inventory.combineItems('${item.type}')">Combine (${this.getItemCount(item.type)}/3)</button>` 
                     : `<button disabled>Combine (${this.getItemCount(item.type)}/3)</button>`}
      </div>
    `;
  }

  equipItem(type) {
    window.gameInstance.selectWeapon(type);
    this.render();
  }

  sellItem(type) {
    const index = this.items.findIndex(item => item.type === type);
    if (index !== -1) {
      this.items[index].count--;
      if (this.items[index].count <= 0) {
        this.items.splice(index, 1);
      }
      this.render();
    }
  }

  getItemCount(type) {
    const item = this.items.find(i => i.type === type);
    return item ? item.count : 0;
  }

  combineItems(type) {
    if (this.getItemCount(type) >= 3) {
      // Remove 3 items
      const index = this.items.findIndex(item => item.type === type);
      this.items[index].count -= 3;
      if (this.items[index].count <= 0) {
        this.items.splice(index, 1);
      }

      // Add combined item
      const combinedTypes = {
        fork: 'trident',
        knife: 'sword',
        spoon: 'shovel'
      };

      this.addItem({ type: combinedTypes[type] });
      this.render();
    }
  }

  render() {
    if (!this.isOpen) return;
    
    this.slotsContainer.innerHTML = '';
    for (let i = 0; i < this.maxSpace; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      
      if (this.items[i]) {
        const item = this.items[i];
        slot.innerHTML = `
          <img src="https://eagershop.vercel.app/${item.type}.png" alt="${item.type}">
          <span class="item-count">${item.count || 1}</span>
        `;
        slot.onclick = () => this.updateDetailsPanel(item);
      }
      
      this.slotsContainer.appendChild(slot);
    }

    if (!this.selectedItem && this.items.length > 0) {
      this.updateDetailsPanel(this.items[0]);
    }
  }
}

class Crate {
  constructor(x) {
    this.element = document.createElement('div');
    this.element.className = 'crate';
    this.element.style.left = `${x}px`;
    this.element.style.top = '-50px';
    this.landed = false;
    
    // Random landing height between 100px and window height - 150px
    this.targetY = Math.random() * (window.innerHeight - 250) + 100;
    
    document.getElementById('game-screen').appendChild(this.element);
    this.fall();
  }

  fall() {
    let currentY = -50;
    const fallSpeed = 3;
    
    const fall = () => {
      currentY += fallSpeed;
      this.element.style.top = `${currentY}px`;
      
      if (currentY < this.targetY && !this.landed) {
        requestAnimationFrame(fall);
      } else {
        this.landed = true;
        this.checkCollection();
      }
    };
    
    fall();
  }

  checkCollection() {
    if (!this.landed) return;
    
    const interval = setInterval(() => {
      const player = document.getElementById('player');
      const playerRect = player.getBoundingClientRect();
      const crateRect = this.element.getBoundingClientRect();
      
      if (this.checkCollision(playerRect, crateRect)) {
        this.collect();
        clearInterval(interval);
      }
    }, 100);
  }

  checkCollision(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
  }

  collect() {
    // Random weapon drop
    const weapons = ['fork', 'knife', 'spoon'];
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
    
    const game = window.gameInstance;
    game.inventory.addItem({ type: randomWeapon, count: 1 });
    
    this.element.style.animation = 'collect 0.5s forwards';
    setTimeout(() => {
      this.element.remove();
    }, 500);
  }
}

class Game {
  constructor() {
    this.currentScreen = 'title';
    this.selectedWeapon = null;
    this.enemies = [];
    this.projectiles = [];
    this.attackCooldown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.gameStarted = false;
    
    this.weaponStats = {
      fork: { 
        damage: 15,
        attackSpeed: 800,
        projectileSpeed: 12,
        size: 40
      },
      knife: {
        damage: 25,
        attackSpeed: 2000,
        projectileSpeed: 15,
        size: 50
      },
      spoon: {
        damage: 10, 
        attackSpeed: 1000,
        projectileSpeed: 20,
        size: 45,
        shots: 3
      },
      trident: {
        damage: 40,
        attackSpeed: 1000,
        projectileSpeed: 25,
        size: 60
      },
      shovel: {
        damage: 35,
        attackSpeed: 1200,
        projectileSpeed: 18,
        size: 55
      },
      sword: {
        damage: 45,
        attackSpeed: 1500,
        projectileSpeed: 22,
        size: 65
      }
    };
    
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 100;
    this.inventory = new Inventory();
    this.crateInterval = null;
    this.playerHealth = 100;
    
    this.initializeEventListeners();
    this.spawnEnemyInterval = null;
    
    this.saveBtn = document.getElementById('save-btn');
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.saveGame());
    }
  }

  initializeEventListeners() {
    document.getElementById('start-btn').addEventListener('click', () => this.showScreen('weapon-select'));
    document.getElementById('load-btn').addEventListener('click', () => this.loadGame());
    
    const weaponCards = document.querySelectorAll('.weapon-card');
    weaponCards.forEach(card => {
      card.addEventListener('click', () => this.selectWeapon(card.dataset.weapon));
    });

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.attackCooldown) {
        this.attack();
      }
    });
  }

  attack() {
    if (this.attackCooldown) return;

    const player = document.getElementById('player');
    const playerRect = player.getBoundingClientRect();
    const playerX = playerRect.left + playerRect.width / 2;
    const playerY = playerRect.top + playerRect.height / 2;
    
    const stats = this.weaponStats[this.selectedWeapon];
    this.attackCooldown = true;
    
    const projectile = document.createElement('div');
    projectile.className = `projectile ${this.selectedWeapon}-projectile`;
    document.getElementById('game-screen').appendChild(projectile);
    
    const angle = Math.atan2(this.mouseY - playerY, this.mouseX - playerX);
    projectile.style.transform = `translate(-50%, -50%) rotate(${angle + Math.PI/2}rad)`;
    
    let currentX = playerX;
    let currentY = playerY;
    let returnPhase = false;
    
    projectile.style.width = `${stats.size}px`;
    projectile.style.height = `${stats.size}px`;
    
    let hasHitEnemy = false;
    let distance = 0;

    const moveProjectile = () => {
      if (this.selectedWeapon === 'trident' && !returnPhase) {
        distance += stats.projectileSpeed;
        if (distance >= window.innerWidth / 2) {
          returnPhase = true;
        }
      }

      if (returnPhase) {
        const playerNewRect = player.getBoundingClientRect();
        const returnAngle = Math.atan2(
          playerNewRect.top + playerNewRect.height / 2 - currentY,
          playerNewRect.left + playerNewRect.width / 2 - currentX
        );
        currentX += Math.cos(returnAngle) * stats.projectileSpeed * 1.5;
        currentY += Math.sin(returnAngle) * stats.projectileSpeed * 1.5;
        
        const projectileRect = projectile.getBoundingClientRect();
        const playerCurrentRect = player.getBoundingClientRect();
        if (this.checkCollision(projectileRect, playerCurrentRect)) {
          projectile.remove();
          return;
        }
      } else {
        currentX += Math.cos(angle) * stats.projectileSpeed;
        currentY += Math.sin(angle) * stats.projectileSpeed;
      }
      
      projectile.style.left = `${currentX}px`;
      projectile.style.top = `${currentY}px`;
      
      let shouldRemoveProjectile = false;
      
      this.enemies.forEach((enemy, index) => {
        const enemyRect = enemy.element.getBoundingClientRect();
        const projectileRect = projectile.getBoundingClientRect();
        
        if (this.checkCollision(projectileRect, enemyRect)) {
          if (enemy.takeDamage(stats.damage)) {
            enemy.element.remove();
            this.enemies.splice(index, 1);
            this.gainXP(10);
          } else {
            // Apply passive abilities
            switch(this.selectedWeapon) {
              case 'shovel':
                enemy.startPoison();
                break;
              case 'sword':
                enemy.stun();
                break;
            }
          }
          
          if (this.selectedWeapon === 'knife') {
            if (hasHitEnemy) {
              shouldRemoveProjectile = true;
            }
            hasHitEnemy = true;
          } else if (this.selectedWeapon === 'trident') {
            // Trident pierces through everything
          } else if (this.selectedWeapon !== 'knife' && this.selectedWeapon !== 'trident') {
            shouldRemoveProjectile = true;
          }
        }
      });
      
      if (shouldRemoveProjectile || 
          (currentX < 0 || currentX > window.innerWidth || 
           currentY < 0 || currentY > window.innerHeight && this.selectedWeapon !== 'trident')) {
        projectile.remove();
        return;
      }
      
      requestAnimationFrame(moveProjectile);
    };
    
    moveProjectile();

    switch(this.selectedWeapon) {
      case 'fork':
      case 'trident':
        setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
        break;
      case 'knife':
      case 'sword':
        projectile.style.animation = 'spin 1s linear infinite';
        setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
        break;
      case 'spoon':
      case 'shovel':
        const spreadAngles = [-0.2, 0, 0.2];
        let shotsFired = 0;
        const fireNextShot = () => {
          if (shotsFired >= stats.shots) {
            setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
            return;
          }

          const newProjectile = document.createElement('div');
          newProjectile.className = `projectile ${this.selectedWeapon}-projectile`;
          document.getElementById('game-screen').appendChild(newProjectile);
          
          const newAngle = angle + spreadAngles[shotsFired];
          newProjectile.style.transform = `translate(-50%, -50%) rotate(${newAngle + Math.PI/2}rad)`;
          
          let projX = playerX;
          let projY = playerY;
          
          newProjectile.style.width = `${stats.size}px`;
          newProjectile.style.height = `${stats.size}px`;
          
          const moveSpoonProjectile = () => {
            projX += Math.cos(newAngle) * stats.projectileSpeed;
            projY += Math.sin(newAngle) * stats.projectileSpeed;
            
            newProjectile.style.left = `${projX}px`;
            newProjectile.style.top = `${projY}px`;
            
            this.enemies.forEach((enemy, index) => {
              const enemyRect = enemy.element.getBoundingClientRect();
              const projectileRect = newProjectile.getBoundingClientRect();
              
              if (this.checkCollision(projectileRect, enemyRect)) {
                if (enemy.takeDamage(stats.damage)) {
                  enemy.element.remove();
                  this.enemies.splice(index, 1);
                  this.gainXP(10);
                }
                newProjectile.remove();
                return;
              }
            });
            
            if (projX < 0 || projX > window.innerWidth || 
                projY < 0 || projY > window.innerHeight) {
              newProjectile.remove();
              return;
            }
            
            requestAnimationFrame(moveSpoonProjectile);
          };
          
          moveSpoonProjectile();
          shotsFired++;
          
          if (shotsFired < stats.shots) {
            setTimeout(fireNextShot, 100);
          }
        };
        
        fireNextShot();
        break;
    }
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    document.getElementById(`${screenId}`).classList.add('active');
    this.currentScreen = screenId;
  }

  selectWeapon(weapon) {
    this.selectedWeapon = weapon;
    const player = document.getElementById('player');
    player.innerHTML = `
      <div id="health-bar" style="width: 100%"></div>
      <img src="https://eagershop.vercel.app/${weapon}.png" class="player-weapon" alt="${weapon}">
    `;

    if (!this.gameStarted) {
      this.showScreen('game-screen');
      this.startGame();
      this.gameStarted = true;
      // Add starter weapon to inventory
      this.inventory.addItem({ type: weapon });
    }
  }

  loadGame() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const saveData = JSON.parse(event.target.result);
          
          // Restore game state
          this.playerHealth = saveData.playerHealth;
          this.level = saveData.level;
          this.xp = saveData.xp;
          this.xpToNextLevel = saveData.xpToNextLevel;
          this.selectWeapon(saveData.selectedWeapon);
          this.inventory.items = saveData.inventory;
          this.inventory.isUnlocked = saveData.inventoryUnlocked;
          
          // Update UI
          document.getElementById('health-bar').style.width = `${this.playerHealth}%`;
          document.getElementById('level-info').textContent = `Level ${this.level}`;
          this.updateXPBar();
          
          // Start game
          this.showScreen('game-screen');
          if (!this.gameStarted) {
            this.startGame();
            this.gameStarted = true;
          }
          
          // Start crate spawning if unlocked
          if (this.inventory.isUnlocked && !this.crateInterval) {
            this.startCrateSpawning();
          }
          
        } catch (error) {
          console.error('Error loading save file:', error);
          alert('Invalid save file!');
        }
      };
      
      reader.readAsText(file);
    };
    
    fileInput.click();
  }

  saveGame() {
    // Pause game mechanics
    clearInterval(this.spawnEnemyInterval);
    if (this.crateInterval) clearInterval(this.crateInterval);
    
    // Create save data object
    const saveData = {
      playerHealth: this.playerHealth,
      level: this.level,
      xp: this.xp,
      xpToNextLevel: this.xpToNextLevel,
      selectedWeapon: this.selectedWeapon,
      inventory: this.inventory.items,
      inventoryUnlocked: this.inventory.isUnlocked
    };
    
    // Convert to JSON and create blob
    const saveBlob = new Blob([JSON.stringify(saveData)], {type: 'application/json'});
    const saveUrl = URL.createObjectURL(saveBlob);
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = saveUrl;
    downloadLink.download = 'just_one_battle_save.json';
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Resume game mechanics
    this.startSpawningEnemies();
    if (this.inventory.isUnlocked) {
      this.startCrateSpawning();
    }
  }

  startGame() {
    const player = document.getElementById('player');
    const stats = this.weaponStats[this.selectedWeapon];
    
    this.initializePlayerMovement(player, stats.size);
    this.startSpawningEnemies();
  }

  startSpawningEnemies() {
    this.spawnEnemyInterval = setInterval(() => {
      if (this.enemies.length < 5) {
        const spawnPoint = this.getRandomSpawnPoint();
        this.enemies.push(new Enemy(spawnPoint.x, spawnPoint.y));
      }
    }, 2000);

    this.updateEnemies();
  }

  getRandomSpawnPoint() {
    const edge = Math.floor(Math.random() * 4);
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    switch(edge) {
      case 0: return {x: 0, y: Math.random() * height}; 
      case 1: return {x: width, y: Math.random() * height}; 
      case 2: return {x: Math.random() * width, y: 0}; 
      case 3: return {x: Math.random() * width, y: height}; 
    }
  }

  updateEnemies() {
    const update = () => {
      const player = document.getElementById('player');
      const playerRect = player.getBoundingClientRect();
      const playerX = playerRect.left + playerRect.width / 2;
      const playerY = playerRect.top + playerRect.height / 2;

      this.enemies.forEach((enemy, index) => {
        const pos = enemy.moveTowards(playerX, playerY);
        const enemyRect = enemy.element.getBoundingClientRect();
        
        if (this.checkCollision(playerRect, enemyRect)) {
          this.playerHealth -= 1; 
          const healthBar = document.querySelector('#health-bar');
          healthBar.style.width = `${this.playerHealth}%`;
          
          if (this.playerHealth <= 0) {
            alert('Game Over!');
            location.reload();
          }
        }

        this.projectiles.forEach((projectile, index) => {
          const projectileRect = projectile.getBoundingClientRect();
          if (this.checkCollision(projectileRect, enemyRect)) {
            if (enemy.takeDamage(this.weaponStats[this.selectedWeapon].damage)) {
              enemy.element.remove();
              this.enemies.splice(index, 1);
              this.gainXP(10);
            }
            projectile.remove();
          }
        });
      });

      requestAnimationFrame(update);
    };

    update();
  }

  checkCollision(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
  }

  initializePlayerMovement(player, weight) {
    const speed = (100 - weight) / 10;
    const keys = {};
    
    document.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    setInterval(() => {
      let x = parseInt(player.style.left) || 50;
      let y = parseInt(player.style.top) || 50;

      if (keys['a'] || keys['arrowleft']) x -= speed;
      if (keys['d'] || keys['arrowright']) x += speed;
      if (keys['w'] || keys['arrowup']) y -= speed;
      if (keys['s'] || keys['arrowdown']) y += speed;

      x = Math.max(0, Math.min(x, window.innerWidth - 50));
      y = Math.max(0, Math.min(y, window.innerHeight - 50));

      player.style.left = x + 'px';
      player.style.top = y + 'px';
    }, 16);
  }

  gainXP(amount) {
    this.xp += amount;
    
    if (this.xp >= this.xpToNextLevel) {
      this.levelUp();
    }
    
    this.updateXPBar();
  }

  updateXPBar() {
    const xpBar = document.getElementById('xp-bar');
    const percentage = (this.xp / this.xpToNextLevel) * 100;
    xpBar.style.width = `${percentage}%`;
    document.getElementById('level-info').textContent = `Level ${this.level}`;
  }

  levelUp() {
    this.level++;
    this.xp = 0;
    this.xpToNextLevel *= 1.5;
    
    if (this.level === 2) {
      this.inventory.isUnlocked = true;
      this.startCrateSpawning();
      this.showLevelUpMessage('Unlocked: Inventory and Crates!');
    }
  }

  startCrateSpawning() {
    this.crateInterval = setInterval(() => {
      const x = Math.random() * (window.innerWidth - 50);
      new Crate(x);
    }, 10000);
  }

  showLevelUpMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'level-up-message';
    messageElement.textContent = message;
    document.body.appendChild(messageElement);
    
    setTimeout(() => messageElement.remove(), 3000);
  }
}

window.addEventListener('load', () => {
  window.gameInstance = new Game();
});
