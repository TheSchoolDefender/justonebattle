class Enemy {
  constructor(x, y, size = 30, healthMultiplier = 1) {
    this.element = document.createElement('div');
    this.element.className = 'enemy';
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.style.width = `${size}px`;
    this.element.style.height = `${size}px`;
    this.health = 100 * healthMultiplier;

    // Add health bar
    this.healthBar = document.createElement('div');
    this.healthBar.className = 'enemy-health-bar';
    this.healthBar.style.width = '100%';
    this.element.appendChild(this.healthBar);
    
    document.getElementById('game-screen').appendChild(this.element);
    this.speed = 2;
    this.isPoisoned = false;
    this.isStunned = false;
    this.isBleeding = false;
    this.isSlowed = false;
    this.poisonDamageInterval = null;
    this.bleedDamageInterval = null;
    this.slowInterval = null;
    this.isBoss = false;
    this.attackCooldown = false;
  }

  bossAttack(playerX, playerY) {
    if (this.attackCooldown) return;
    this.attackCooldown = true;
    const enemyX = parseInt(this.element.style.left) + (parseInt(this.element.style.width)/2);
    const enemyY = parseInt(this.element.style.top) + (parseInt(this.element.style.height)/2);
    const angle = Math.atan2(playerY - enemyY, playerX - enemyX);
    const projectile = document.createElement('div');
    projectile.className = `projectile trident-projectile`;
    document.getElementById('game-screen').appendChild(projectile);
    
    let currentX = enemyX;
    let currentY = enemyY;
    let returnPhase = false;
    const moveProjectile = () => {
      if (!returnPhase) {
        currentX += Math.cos(angle) * 8;
        currentY += Math.sin(angle) * 8;
        
        if(Math.abs(currentX - enemyX) > 300) {
          returnPhase = true;
        }
      } else {
        const returnAngle = Math.atan2(enemyY - currentY, enemyX - currentX);
        currentX += Math.cos(returnAngle) * 12;
        currentY += Math.sin(returnAngle) * 12;
        
        const enemyRect = this.element.getBoundingClientRect();
        const projectileRect = projectile.getBoundingClientRect();
        if(this.checkCollision(projectileRect, enemyRect)) {
          projectile.remove();
          return;
        }
      }
      projectile.style.left = `${currentX}px`;
      projectile.style.top = `${currentY}px`;

      const player = document.getElementById('player');
      const playerRect = player.getBoundingClientRect();
      const projectileRect = projectile.getBoundingClientRect();
      if(this.checkCollision(projectileRect, playerRect)) {
        window.gameInstance.playerHealth -= 5
        const healthBar = document.querySelector('#health-bar');
        healthBar.style.width = `${window.gameInstance.playerHealth}%`;
        projectile.remove()
      }

      if (currentX < 0 || currentX > window.innerWidth ||
          currentY < 0 || currentY > window.innerHeight) {
        projectile.remove();
        return;
      }
      requestAnimationFrame(moveProjectile);
    };
    moveProjectile();
    setTimeout(() => this.attackCooldown = false, 2000);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.healthBar.style.width = `${(this.health > 0 ? this.health : 0)}%`;
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

  startBleed() {
    if (this.isBleeding) return;
    
    this.isBleeding = true;
    this.element.style.filter = 'brightness(0.8) saturate(1.2) contrast(1.2) hue-rotate(200deg)';
    
    this.bleedDamageInterval = setInterval(() => {
      this.takeDamage(3);
      if (this.health <= 0) {
        clearInterval(this.bleedDamageInterval);
        this.element.style.filter = '';
      }
    }, 1000);
  }

  startSlow() {
    if (this.isSlowed) return;
    
    this.isSlowed = true;
    const originalSpeed = this.speed;
    this.speed = originalSpeed / 2;
    this.element.style.filter = 'brightness(0.9) saturate(0.8)';
    
    this.slowInterval = setInterval(() => {
      this.speed = originalSpeed
      this.element.style.filter = '';
      clearInterval(this.slowInterval);
      this.isSlowed = false;
    }, 3000)
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

  checkCollision(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
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
    window.gameInstance.togglePause(this.isOpen);
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
      'comically-large-fork': {
        desc: "Bigger fork. Still a fork but just bigger!",
         stats: { damage: 35, attackSpeed: 800 }
      },
      knife: {
        desc: "Spinning throwing knife - Hard to cut :(",
        stats: { damage: 25, attackSpeed: 2000 }
      },
      'comically-large-knife': {
        desc: "Spinning throwing knife - Hard to cut :( but biger!",
         stats: { damage: 45, attackSpeed: 2000 }
      },
      spoon: {
        desc: "Triple throw spoon - What the hell??",
        stats: { damage: 15, attackSpeed: 1000 }
      },
      'comically-large-spoon': {
         desc: "Triple throw spoon - What the hell?? but biger",
        stats: { damage: 30, attackSpeed: 1000 }
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
      },
       bow: {
        desc: "A ranged weapon",
        stats: { damage: 20, attackSpeed: 1800 }
      },
        'water-gun': {
           desc: "Its a water gun! ",
            stats: { damage: 5, attackSpeed: 1800}
        },
        'regular-gun': {
            desc: "Basic gun",
           stats: { damage: 50, attackSpeed: 1200}
        }
    };

    const details = weaponDetails[item.type];
    const canCombine = this.getItemCount(item.type) >= this.getCombineCost(item.type);
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
        ${canCombine ? `<button onclick="window.gameInstance.inventory.combineItems('${item.type}')">Combine (${this.getItemCount(item.type)}/${this.getCombineCost(item.type)})</button>` 
                     : `<button disabled>Combine (${this.getItemCount(item.type)}/${this.getCombineCost(item.type)})</button>`}
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

  getCombineCost(type) {
    const combineCosts = {
      fork: 3,
      knife: 3,
      spoon: 3,
      'comically-large-fork': 5,
      'comically-large-knife': 5,
      'comically-large-spoon': 5,
      bow: 3
    };
    return combineCosts[type] || 0;
  }

  combineItems(type) {
    const cost = this.getCombineCost(type)
    if (this.getItemCount(type) >= cost) {
      // Remove items
      const index = this.items.findIndex(item => item.type === type);
      this.items[index].count -= cost;
      if (this.items[index].count <= 0) {
        this.items.splice(index, 1);
      }

      const combinedTypes = {
        fork: 'comically-large-fork',
        knife: 'comically-large-knife',
        spoon: 'comically-large-spoon',
        'comically-large-fork': 'trident',
        'comically-large-knife': 'sword',
        'comically-large-spoon': 'shovel',
        bow: 'water-gun'
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
        let imageUrl = `https://eagershop.vercel.app/${item.type}.png`
        if(item.type === 'comically-large-fork') {
          imageUrl = 'https://eagershop.vercel.app/fork.png'
        }
        if(item.type === 'comically-large-knife') {
          imageUrl = 'https://eagershop.vercel.app/knife.png'
        }
        if(item.type === 'comically-large-spoon') {
          imageUrl = 'https://eagershop.vercel.app/spoon.png'
        }
        slot.innerHTML = `
          <img src="${imageUrl}" alt="${item.type}" style="width: ${item.type.startsWith('comically-large') ? '90%' : '70%'}; height: ${item.type.startsWith('comically-large') ? '90%' : '70%'}">
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
    const level3Weapons = ['bow', 'regular-gun'];
    const game = window.gameInstance;
      
    let randomWeapon;
    if (game.level >= 3 && Math.random() < 0.3) {
      randomWeapon = level3Weapons[Math.floor(Math.random() * level3Weapons.length)];
    } else {
      randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
    }
    
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
    this.aimingLine = null;
    this.bowRotation = 0;
    this.isPaused = false;
    
    this.weaponStats = {
      fork: { 
        damage: 15,
        attackSpeed: 100,
        projectileSpeed: 12,
        size: 40
      },
      'comically-large-fork': {
        damage: 35,
        attackSpeed: 100,
        projectileSpeed: 15,
        size: 60
      },
      knife: {
        damage: 25,
        attackSpeed: 2000,
        projectileSpeed: 15,
        size: 50
      },
      'comically-large-knife': {
        damage: 45,
        attackSpeed: 2000,
        projectileSpeed: 18,
        size: 70
      },
      spoon: {
        damage: 15, 
        attackSpeed: 1000,
        projectileSpeed: 15,
        size: 45
      },
      'comically-large-spoon': {
        damage: 30,
        attackSpeed: 1000,
        projectileSpeed: 18,
        size: 65
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
      },
      bow: {
        damage: 20,
        attackSpeed: 1800,
        projectileSpeed: 20,
        size: 20
      },
      'water-gun': {
        damage: 5,
        attackSpeed: 1800,
        projectileSpeed: 15,
        size: 30
      },
      'regular-gun': {
        damage: 50,
        attackSpeed: 1200,
        projectileSpeed: 20,
        size: 10
      }
    };
    
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 50;
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

  togglePause(isInventoryOpen) {
      this.isPaused = isInventoryOpen
        if (this.isPaused) {
          clearInterval(this.spawnEnemyInterval);
          if (this.crateInterval) clearInterval(this.crateInterval);
        } else {
            this.startSpawningEnemies();
            if (this.inventory.isUnlocked) {
                this.startCrateSpawning();
            }
        }
  }

  updateBowAim() {
    if (this.selectedWeapon !== 'bow') {
      return;
    }
    
    const player = document.getElementById('player');
    const playerRect = player.getBoundingClientRect();
    const playerX = playerRect.left + playerRect.width / 2;
    const playerY = playerRect.top + playerRect.height / 2;
    const angle = Math.atan2(this.mouseY - playerY, this.mouseX - playerX);
    
    // Rotate the bow
    this.bowRotation = angle + Math.PI/2;
    const bowElement = player.querySelector('.player-weapon');
    if (bowElement) {
      bowElement.style.transform = `translate(-50%, -50%) rotate(${this.bowRotation}rad)`;
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
      this.updateBowAim();
    });
      
    document.addEventListener('click', (e) => {
      if (this.currentScreen === 'game-screen' && !this.isPaused) {
        this.attack();
      }
    });
      
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.currentScreen === 'game-screen') {
             this.togglePause(!this.isPaused);
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
    
    const angle = Math.atan2(this.mouseY - playerY, this.mouseX - playerX);
    const projectile = document.createElement('div');
    projectile.className = `projectile ${this.selectedWeapon}-projectile`;
    document.getElementById('game-screen').appendChild(projectile);
    
    projectile.style.transform = `translate(-50%, -50%) rotate(${angle + Math.PI/2}rad)`;
    
    let currentX = playerX;
    let currentY = playerY;
    let returnPhase = false;
    
    projectile.style.width = `${stats.size}px`;
    projectile.style.height = `${stats.size}px`;
    
    let hasHitEnemy = false;
    let distance = 0;
      
    switch(this.selectedWeapon) {
      case 'regular-gun':
        const bullet = document.createElement('div');
        bullet.className = `projectile regular-gun-projectile`;
        document.getElementById('game-screen').appendChild(bullet);
        
        let bulletX = playerX;
        let bulletY = playerY;
        bullet.style.width = `${stats.size * 3}px`;
        bullet.style.height = `${stats.size/2}px`;
        
        const moveRegularGunProjectile = () => {
          const enemyDistances = this.enemies.map(enemy => {
            const enemyRect = enemy.element.getBoundingClientRect();
            const distX = enemyRect.left + enemyRect.width / 2 - bulletX;
            const distY = enemyRect.top + enemyRect.height / 2 - bulletY;
            return { enemy, distance: Math.sqrt(distX * distX + distY * distY) };
          });
          
          let closestEnemy = null;
          let minDistance = Infinity;
          enemyDistances.forEach(item => {
            if (item.distance < minDistance) {
              minDistance = item.distance;
              closestEnemy = item.enemy;
            }
          });
          
          let targetX = this.mouseX
          let targetY = this.mouseY;
          if (closestEnemy) {
            const enemyRect = closestEnemy.element.getBoundingClientRect();
            targetX = enemyRect.left + enemyRect.width / 2
            targetY = enemyRect.top + enemyRect.height/2
          }
          
          const homingAngle = Math.atan2(targetY - bulletY, targetX - bulletX);
          
          bulletX += Math.cos(homingAngle) * stats.projectileSpeed;
          bulletY += Math.sin(homingAngle) * stats.projectileSpeed;
          bullet.style.left = `${bulletX}px`;
          bullet.style.top = `${bulletY}px`;
          
          this.enemies.forEach((enemy, index) => {
            const enemyRect = enemy.element.getBoundingClientRect();
            const projectileRect = bullet.getBoundingClientRect();
            
            if (this.checkCollision(projectileRect, enemyRect)) {
              if (enemy.takeDamage(stats.damage)) {
                enemy.element.remove();
                this.enemies.splice(index, 1);
                this.gainXP(10);
              }
              bullet.remove();
              return;
            }
          });
          
          if (bulletX < 0 || bulletX > window.innerWidth || 
              bulletY < 0 || bulletY > window.innerHeight) {
            bullet.remove();
            return;
          }
          
          requestAnimationFrame(moveRegularGunProjectile);
        };
        moveRegularGunProjectile();
        setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
        break;
      case 'bow':
        const arrow = document.createElement('div');
        arrow.className = `projectile arrow-projectile`;
        document.getElementById('game-screen').appendChild(arrow);
        
        let arrowX = playerX;
        let arrowY = playerY;
        
        arrow.style.width = `${stats.size * 2}px`;
        arrow.style.height = `${stats.size / 2}px`;
        arrow.style.transform = `translate(-50%, -50%) rotate(${angle + Math.PI/2}rad)`;
        arrow.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))';
        
        const moveArrowProjectile = () => {
          arrowX += Math.cos(angle) * stats.projectileSpeed;
          arrowY += Math.sin(angle) * stats.projectileSpeed;
          
          arrow.style.left = `${arrowX}px`;
          arrow.style.top = `${arrowY}px`;
          
          this.enemies.forEach((enemy, index) => {
            const enemyRect = enemy.element.getBoundingClientRect();
            const projectileRect = arrow.getBoundingClientRect();
            
            if (this.checkCollision(projectileRect, enemyRect)) {
              if (enemy.takeDamage(stats.damage)) {
                enemy.element.remove();
                this.enemies.splice(index, 1);
                this.gainXP(10);
              } else {
                enemy.startBleed();
              }
              arrow.remove();
              return;
            }
          });
          
          if (arrowX < 0 || arrowX > window.innerWidth || 
              arrowY < 0 || arrowY > window.innerHeight) {
            arrow.remove();
            return;
          }
          
          requestAnimationFrame(moveArrowProjectile);
        };
        moveArrowProjectile();
        setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
        break;
      case 'water-gun':
        const water = document.createElement('div');
        water.className = `projectile water-gun-projectile`;
        document.getElementById('game-screen').appendChild(water);
        
        let waterX = playerX;
        let waterY = playerY;
        
        water.style.width = `${stats.size}px`;
        water.style.height = `${stats.size}px`;
        
        const moveWaterProjectile = () => {
          waterX += Math.cos(angle) * stats.projectileSpeed;
          waterY += Math.sin(angle) * stats.projectileSpeed;
          
          water.style.left = `${waterX}px`;
          water.style.top = `${waterY}px`;
          
          this.enemies.forEach((enemy, index) => {
            const enemyRect = enemy.element.getBoundingClientRect();
            const projectileRect = water.getBoundingClientRect();
            
            if (this.checkCollision(projectileRect, enemyRect)) {
              if (enemy.takeDamage(stats.damage)) {
                enemy.element.remove();
                this.enemies.splice(index, 1);
                this.gainXP(10);
              } else {
                enemy.startSlow();
              }
              water.remove();
              return;
            }
          });
          
          if (waterX < 0 || waterX > window.innerWidth || 
              waterY < 0 || waterY > window.innerHeight) {
            water.remove();
            return;
          }
          
          requestAnimationFrame(moveWaterProjectile);
        };
        moveWaterProjectile();
        setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
        break;
      case 'spoon':
      case 'comically-large-spoon':
        // Create a fan pattern with 5 projectiles
        const spoonSpreadAngles = [-0.4, -0.2, 0, 0.2, 0.4];  
        spoonSpreadAngles.forEach(spreadAngle => {
          const newProjectile = document.createElement('div');
          newProjectile.className = `projectile ${this.selectedWeapon}-projectile`;
          document.getElementById('game-screen').appendChild(newProjectile);
          
          const newAngle = angle + spreadAngle;
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
        });
        setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
        break;
      case 'shovel':
        const shovelSpreadAngles = [-0.4, -0.2, 0, 0.2, 0.4];  
        shovelSpreadAngles.forEach(spreadAngle => {
          const newProjectile = document.createElement('div');
          newProjectile.className = `projectile ${this.selectedWeapon}-projectile`;
          document.getElementById('game-screen').appendChild(newProjectile);
          
          const newAngle = angle + spreadAngle;
          newProjectile.style.transform = `translate(-50%, -50%) rotate(${newAngle + Math.PI/2}rad)`;
          
          let projX = playerX;
          let projY = playerY;
          
          newProjectile.style.width = `${stats.size}px`;
          newProjectile.style.height = `${stats.size}px`;
          
          const moveShovelProjectile = () => {
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
                } else {
                  enemy.startPoison();
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
            
            requestAnimationFrame(moveShovelProjectile);
          };
          moveShovelProjectile();
        });
        setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
        break;
      default:
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
              
              if (this.selectedWeapon === 'knife' || this.selectedWeapon === 'comically-large-knife') {
                if (hasHitEnemy) {
                  shouldRemoveProjectile = true;
                }
                hasHitEnemy = true;
              } else if (this.selectedWeapon === 'trident') {
                // Trident pierces through everything
              } else if (this.selectedWeapon !== 'knife' && this.selectedWeapon !== 'trident' && this.selectedWeapon !== 'comically-large-knife') {
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
          case 'comically-large-fork':
            setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
            break;
          case 'knife':
          case 'sword':
          case 'comically-large-knife':
            projectile.style.animation = 'spin 1s linear infinite';
            setTimeout(() => this.attackCooldown = false, stats.attackSpeed);
            break;
        }
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
    
    let weaponImg = `
      <img src="https://eagershop.vercel.app/${weapon}.png" class="player-weapon" alt="${weapon}" style="width: ${this.weaponStats[weapon].size * (weapon.startsWith('comically-large') ? 1.5 : 1)}px; height: ${this.weaponStats[weapon].size * (weapon.startsWith('comically-large') ? 1.5 : 1)}px;">
    `
    if (weapon === 'bow') {
      weaponImg = `
        <img src="https://eagershop.vercel.app/${weapon}.png" class="player-weapon" alt="${weapon}">
      `
    }
    player.innerHTML = `
      <div id="health-bar" style="width: 100%"></div>
      ${weaponImg}
    `;

    const weaponImage = player.querySelector('.player-weapon');
    weaponImage.style.top = '50%';
    weaponImage.style.left = '70%';
    
    if (!this.gameStarted) {
      this.showScreen('game-screen');
      this.startGame();
      this.gameStarted = true;
      // Add starter weapon to inventory
      this.inventory.addItem({ type: weapon });
    }
    this.updateBowAim()
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
    player.style.backgroundImage = `url('https://static.vecteezy.com/system/resources/previews/027/216/308/non_2x/potato-potato-transparent-background-ai-generated-free-png.png')`;
    player.style.backgroundSize = 'contain';
    player.style.backgroundRepeat = 'no-repeat';
    player.style.backgroundPosition = 'center';
    this.initializePlayerMovement(player, stats.size);
    this.startSpawningEnemies();
  }

  startSpawningEnemies() {
    this.spawnEnemyInterval = setInterval(() => {
      if (this.enemies.length < 5) {
        const spawnPoint = this.getRandomSpawnPoint();
        let enemySize = 30;
        let healthMultiplier = 1;
        if (this.level >= 3 && this.level <= 10) {
          enemySize = 30 + (this.level - 2) * 10;
          healthMultiplier = 1 + (this.level - 2) * 0.5;
        }
        
        if (this.level >= 10) {
          enemySize = 100;
          healthMultiplier = 5;
          const boss = new Enemy(spawnPoint.x, spawnPoint.y, enemySize, healthMultiplier);
          boss.isBoss = true;
          this.enemies.push(boss);
          return;
        }
        this.enemies.push(new Enemy(spawnPoint.x, spawnPoint.y, enemySize, healthMultiplier));
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
      if(this.isPaused) {
        requestAnimationFrame(update);
        return;
      }
      const player = document.getElementById('player');
      const playerRect = player.getBoundingClientRect();
      const playerX = playerRect.left + playerRect.width / 2;
      const playerY = playerRect.top + playerRect.height / 2;

      this.enemies.forEach((enemy, index) => {
        const pos = enemy.moveTowards(playerX, playerY);
        const enemyRect = enemy.element.getBoundingClientRect();
        
        if (enemy.isBoss) {
          enemy.bossAttack(playerX, playerY)
        }
        
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
    const speed = (100 - weight) / 15;
    const keys = {};
    
    document.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    setInterval(() => {
        if(this.isPaused) return;
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
    if (this.level === 3) {
      this.showLevelUpMessage('Unlocked: New Weapons!');
    }
    if (this.level >= 10) {
      this.showLevelUpMessage("You've reached max level, a formidable enemy approaches...");
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
