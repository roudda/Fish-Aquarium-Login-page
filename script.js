/**
 * AQUA WORLD - Interactive Ocean Login Page
 * Enhanced with Scuba Swimmer, Manta Ray, Jellyfish, Sea Turtle, Plankton & Water Ripples
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const oceanContainer = document.getElementById('oceanContainer');
  const fishStage = document.getElementById('fishStage');
  const bubblesLayer = document.getElementById('bubblesLayer');
  const planktonLayer = document.getElementById('planktonLayer');
  const rippleLayer = document.getElementById('rippleLayer');
  const passwordInput = document.getElementById('passwordInput');
  const usernameInput = document.getElementById('usernameInput');
  const eyeToggleBtn = document.getElementById('eyeToggleBtn');
  const avatarBadge = document.getElementById('avatarBadge');
  const privacyBadge = document.getElementById('privacyBadge');
  const badgeText = document.getElementById('badgeText');
  const soundToggleBtn = document.getElementById('soundToggle');
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');

  // --- Configuration ---
  const CONFIG = {
    swimBounds: {
      minX: 40,
      maxX: () => Math.min(window.innerWidth * 0.52, window.innerWidth - 380),
      minY: 80,
      maxY: () => window.innerHeight - 170
    },
    hideSpots: [
      { x: -50, y: window.innerHeight * 0.45, label: 'coral-deep' },
      { x: 25, y: window.innerHeight * 0.72, label: 'anemone-bed' },
      { x: -30, y: window.innerHeight * 0.22, label: 'upper-reef' },
      { x: 50, y: window.innerHeight * 0.85, label: 'bottom-kelp' },
      { x: -40, y: window.innerHeight * 0.58, label: 'rock-cave' },
      { x: 20, y: window.innerHeight * 0.35, label: 'coral-ledge' }
    ]
  };

  let isPasswordActive = false;
  let isPasswordRevealed = false;

  // =========================================================
  // 1. BASE MARINE CREATURE CLASS
  // =========================================================

  class MarineEntity {
    constructor(options) {
      this.id = options.id;
      this.type = options.type;
      this.templateId = options.templateId;
      this.width = options.width || 120;
      this.height = options.height || 75;
      this.viewBox = options.viewBox || '0 0 250 140';
      this.scale = options.scale || 1;
      
      this.x = options.startX || Math.random() * (window.innerWidth * 0.35) + 60;
      this.y = options.startY || Math.random() * (window.innerHeight * 0.5) + 120;
      this.targetX = this.x;
      this.targetY = this.y;
      this.baseSpeed = options.speed || 1.4;
      this.currentSpeed = this.baseSpeed;
      this.direction = 1; // 1 = right, -1 = left
      this.rotation = 0;
      this.shyShout = options.shyShout || "🙈 No peeking!";
      this.isFleeing = false;
      this.hideSpot = options.hideSpot || CONFIG.hideSpots[0];
      this.customClass = options.customClass || '';

      this.timeOffset = Math.random() * 1000;
      this.idleTimer = 0;

      this.createElement();
      this.pickNewTarget();
    }

    createElement() {
      this.el = document.createElement('div');
      this.el.className = `fish-swimmer ${this.type}-item ${this.customClass}`;
      this.el.style.width = `${this.width}px`;
      this.el.style.height = `${this.height}px`;
      this.el.style.left = `${this.x}px`;
      this.el.style.top = `${this.y}px`;

      // Speech bubble for reactions
      this.bubbleEl = document.createElement('div');
      this.bubbleEl.className = 'fish-speech-bubble';
      this.bubbleEl.textContent = this.shyShout;
      this.el.appendChild(this.bubbleEl);

      // SVG wrapper
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', this.viewBox);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');

      // Clone template directly
      const template = document.getElementById(this.templateId);
      if (template) {
        const clone = template.cloneNode(true);
        clone.removeAttribute('id');
        svg.appendChild(clone);
      }
      this.el.appendChild(svg);

      // Click to interact
      this.el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dartAway(e.clientX, e.clientY);
      });

      fishStage.appendChild(this.el);
    }

    pickNewTarget() {
      const maxX = CONFIG.swimBounds.maxX();
      const maxY = CONFIG.swimBounds.maxY();
      
      this.targetX = Math.max(CONFIG.swimBounds.minX, Math.random() * maxX);
      this.targetY = Math.max(CONFIG.swimBounds.minY, Math.random() * maxY);

      this.direction = (this.targetX >= this.x) ? 1 : -1;
      
      const dy = this.targetY - this.y;
      const dx = Math.abs(this.targetX - this.x) || 1;
      this.rotation = Math.max(-18, Math.min(18, (dy / dx) * 25));
    }

    dartAway(fromX, fromY) {
      const awayDir = (this.x < fromX) ? -1 : 1;
      this.targetX = Math.max(30, Math.min(CONFIG.swimBounds.maxX(), this.x + awayDir * 190));
      this.targetY = Math.max(90, Math.min(CONFIG.swimBounds.maxY(), this.y + (Math.random() * 100 - 50)));
      this.currentSpeed = this.baseSpeed * 3.2;
      this.direction = awayDir;
      spawnSmallBubbleBurst(this.x + this.width / 2, this.y + this.height / 2);
      playBubblePopAudio();
    }

    fleeToCoral(hideout) {
      this.isFleeing = true;
      this.el.classList.add('fleeing');
      this.el.classList.add('shy');
      
      this.hideSpot = hideout;
      this.targetX = this.hideSpot.x;
      this.targetY = this.hideSpot.y;

      this.direction = -1; // Turn away from password card
      this.rotation = (Math.random() * 12) - 6;
      this.currentSpeed = this.baseSpeed * 2.8;

      this.bubbleEl.textContent = this.shyShout;
    }

    returnFromCoral() {
      this.isFleeing = false;
      this.el.classList.remove('fleeing');
      this.el.classList.remove('shy');
      this.currentSpeed = this.baseSpeed * 1.3;
      
      this.direction = 1;
      
      setTimeout(() => {
        if (!isPasswordActive) {
          this.pickNewTarget();
        }
      }, 150 + Math.random() * 400);
    }

    update(time) {
      if (this.isFleeing) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.x += dx * 0.12;
        this.y += dy * 0.12;
        this.direction = -1;
        this.rotation = Math.sin(time * 0.01) * 3;
      } else {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 25) {
          this.idleTimer++;
          this.y += Math.sin((time + this.timeOffset) * 0.003) * 0.4;
          if (this.idleTimer > 45 + Math.random() * 50) {
            this.idleTimer = 0;
            this.pickNewTarget();
          }
        } else {
          const angle = Math.atan2(dy, dx);
          const step = this.currentSpeed;
          this.x += Math.cos(angle) * step;
          this.y += Math.sin(angle) * step;

          this.y += Math.sin((time + this.timeOffset) * 0.004) * 0.35;
          
          if (this.currentSpeed > this.baseSpeed) {
            this.currentSpeed *= 0.98;
          }
        }
      }

      const flip = (this.direction === 1) ? 1 : -1;
      this.el.style.left = `${this.x}px`;
      this.el.style.top = `${this.y}px`;
      this.el.style.transform = `scale(${this.scale}) scaleX(${flip}) rotate(${this.rotation * flip}deg)`;
    }
  }

  // =========================================================
  // 2. SCUBA DIVER SWIMMER CLASS
  // =========================================================

  class ScubaSwimmer extends MarineEntity {
    constructor(options) {
      super(options);
      this.bubbleTimer = 0;
      this.bubbleInterval = 180 + Math.random() * 80;
    }

    pickNewTarget() {
      // Swimmer patrols gracefully along upper-to-middle depths
      const maxX = CONFIG.swimBounds.maxX() + 40;
      this.targetX = Math.max(80, Math.random() * maxX);
      this.targetY = Math.max(100, Math.min(window.innerHeight * 0.65, Math.random() * (window.innerHeight * 0.55) + 90));

      this.direction = (this.targetX >= this.x) ? 1 : -1;
      const dy = this.targetY - this.y;
      const dx = Math.abs(this.targetX - this.x) || 1;
      this.rotation = Math.max(-12, Math.min(12, (dy / dx) * 16));
    }

    emitRegulatorBubbles() {
      // Trailing exhaust bubbles from scuba regulator mouthpiece
      const headX = (this.direction === 1) ? this.x + this.width * 0.68 : this.x + this.width * 0.32;
      const headY = this.y + this.height * 0.38;
      
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (!bubblesLayer) return;
          const bubble = document.createElement('div');
          bubble.className = 'bubble';
          const size = Math.random() * 10 + 6;
          bubble.style.width = `${size}px`;
          bubble.style.height = `${size}px`;
          bubble.style.left = `${headX + (Math.random() * 16 - 8)}px`;
          bubble.style.bottom = `${window.innerHeight - headY}px`;
          bubble.style.animationDuration = `${Math.random() * 3 + 3}s`;
          bubblesLayer.appendChild(bubble);

          setTimeout(() => bubble.remove(), 4000);
        }, i * 140);
      }
    }

    fleeToCoral(hideout) {
      super.fleeToCoral(hideout);
      // Raise hand over mask and look away
      this.el.classList.add('shy');
      this.bubbleEl.textContent = "🤿 Checking my dive gauges! No peeking! 🫧";
    }

    update(time) {
      super.update(time);

      // Periodically breathe bubbles
      this.bubbleTimer++;
      if (this.bubbleTimer > this.bubbleInterval) {
        this.bubbleTimer = 0;
        this.bubbleInterval = 180 + Math.random() * 120;
        this.emitRegulatorBubbles();
      }
    }
  }

  // =========================================================
  // 3. JELLYFISH CLASS (RHYTHMIC VERTICAL DRIFT)
  // =========================================================

  class Jellyfish extends MarineEntity {
    constructor(options) {
      super(options);
      this.driftAngle = 0;
    }

    pickNewTarget() {
      // Jellyfish gently bob upwards and diagonally
      const maxX = CONFIG.swimBounds.maxX() * 0.9;
      this.targetX = Math.max(90, Math.random() * maxX);
      this.targetY = Math.max(70, Math.random() * (window.innerHeight * 0.6) + 80);
      this.direction = (this.targetX >= this.x) ? 1 : -1;
      this.rotation = (Math.random() * 10) - 5;
    }

    update(time) {
      if (this.isFleeing) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.x += dx * 0.08;
        this.y += dy * 0.08;
      } else {
        // Slow buoyant pulsating drift
        this.y += Math.sin((time + this.timeOffset) * 0.002) * 0.6 - 0.15;
        this.x += Math.cos((time + this.timeOffset) * 0.0015) * 0.4;
        
        // Wrap around if too high
        if (this.y < 50) {
          this.y = window.innerHeight * 0.75;
          this.pickNewTarget();
        }
      }

      this.el.style.left = `${this.x}px`;
      this.el.style.top = `${this.y}px`;
      this.el.style.transform = `scale(${this.scale}) rotate(${this.rotation}deg)`;
    }
  }

  // =========================================================
  // 4. SPAWN MARINE ECOSYSTEM & SWIMMER
  // =========================================================

  const creatures = [];

  function initMarineEcosystem() {
    // 1. Underwater Scuba Swimmer / Diver
    creatures.push(new ScubaSwimmer({
      id: 'diver',
      type: 'swimmer',
      templateId: 'swimmer-diver',
      width: 175,
      height: 90,
      viewBox: '0 0 320 120',
      scale: 1,
      speed: 1.1,
      startX: 180,
      startY: 130,
      shyShout: "🤿 Looking at corals! 100% Private! 🫧",
      hideSpot: { x: -60, y: window.innerHeight * 0.18, label: 'upper-surface' }
    }));

    // 2. Majestic Manta Ray
    creatures.push(new MarineEntity({
      id: 'manta',
      type: 'manta',
      templateId: 'creature-manta',
      width: 180,
      height: 120,
      viewBox: '-80 0 300 160',
      scale: 1.05,
      speed: 1.2,
      startX: 220,
      startY: 320,
      shyShout: "🫧 Gliding deep into the shadows!",
      hideSpot: { x: -70, y: window.innerHeight * 0.65, label: 'deep-blue' }
    }));

    // 3. Green Sea Turtle (Honu)
    creatures.push(new MarineEntity({
      id: 'turtle',
      type: 'turtle',
      templateId: 'creature-turtle',
      width: 130,
      height: 90,
      viewBox: '0 0 160 110',
      scale: 0.95,
      speed: 1.0,
      startX: 140,
      startY: 460,
      shyShout: "🐢 Ancient secret mode engaged!",
      hideSpot: CONFIG.hideSpots[3]
    }));

    // 4. Bioluminescent Jellyfish
    creatures.push(new Jellyfish({
      id: 'jellyfish',
      type: 'jelly',
      templateId: 'creature-jellyfish',
      width: 80,
      height: 140,
      viewBox: '0 0 100 240',
      scale: 0.85,
      speed: 0.6,
      startX: 280,
      startY: 240,
      shyShout: "✨ Bioluminescence dimmed for privacy!",
      hideSpot: { x: 40, y: window.innerHeight * 0.75, label: 'kelp-shade' }
    }));

    // 5. Moorish Idol (Iconic long streamer fin)
    creatures.push(new MarineEntity({
      id: 'moorish-idol',
      type: 'moorish-idol',
      templateId: 'fish-moorish-idol',
      width: 125,
      height: 110,
      viewBox: '20 -90 160 190',
      scale: 0.92,
      speed: 1.5,
      startX: 310,
      startY: 260,
      shyShout: "🫣 Not looking! Privacy strictly respected!",
      hideSpot: CONFIG.hideSpots[5]
    }));

    // 6. Hero Blue Tang ("Dory")
    creatures.push(new MarineEntity({
      id: 'dory',
      type: 'blue-tang',
      templateId: 'fish-blue-tang',
      width: 140,
      height: 85,
      viewBox: '0 0 250 140',
      scale: 1,
      speed: 1.4,
      startX: 110,
      startY: 290,
      shyShout: "🙈 Not looking! Privacy!",
      hideSpot: CONFIG.hideSpots[0]
    }));

    // 7. Main Clownfish ("Nemo")
    creatures.push(new MarineEntity({
      id: 'nemo',
      type: 'clownfish',
      templateId: 'fish-clownfish',
      width: 105,
      height: 65,
      viewBox: '0 0 250 140',
      scale: 0.92,
      speed: 1.6,
      startX: 210,
      startY: 190,
      shyShout: "🤫 Shh! Looking away!",
      hideSpot: CONFIG.hideSpots[1]
    }));

    // 8. Yellow Tang
    creatures.push(new MarineEntity({
      id: 'yellow-tang',
      type: 'yellow-tang',
      templateId: 'fish-yellow-tang',
      width: 110,
      height: 75,
      viewBox: '0 0 250 140',
      scale: 0.95,
      speed: 1.3,
      startX: 290,
      startY: 420,
      shyShout: "🫣 Eyes off the screen!",
      hideSpot: CONFIG.hideSpots[2]
    }));

    // 9. School of Damselfish
    spawnSchoolingFish(7);
  }

  function spawnSchoolingFish(count) {
    const schoolContainer = document.createElement('div');
    schoolContainer.className = 'school-wrapper';
    fishStage.appendChild(schoolContainer);

    for (let i = 0; i < count; i++) {
      const swimmer = document.createElement('div');
      swimmer.className = 'tiny-school-fish';
      swimmer.style.left = `${150 + i * 24 + Math.random() * 20}px`;
      swimmer.style.top = `${210 + i * 16 + Math.random() * 20}px`;
      swimmer.style.opacity = `${0.35 + Math.random() * 0.35}`;
      schoolContainer.appendChild(swimmer);
    }
  }

  // =========================================================
  // 5. BIOLUMINESCENT PLANKTON PARTICLES
  // =========================================================

  function initBioluminescentPlankton(count = 35) {
    if (!planktonLayer) return;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'plankton-dot';
      const size = Math.random() * 4 + 2;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${Math.random() * 100}vw`;
      dot.style.top = `${Math.random() * 100}vh`;
      dot.style.animationDuration = `${Math.random() * 6 + 5}s`;
      dot.style.animationDelay = `${Math.random() * 5}s`;
      
      // Alternate hues (cyan, teal, indigo)
      const colors = ['#38bdf8', '#06b6d4', '#2dd4bf', '#818cf8'];
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      dot.style.background = chosenColor;
      dot.style.boxShadow = `0 0 10px ${chosenColor}, 0 0 20px ${chosenColor}`;

      planktonLayer.appendChild(dot);
    }
  }

  // =========================================================
  // 6. WATER RIPPLE CLICK INTERACTION
  // =========================================================

  function createWaterRipple(x, y) {
    if (!rippleLayer) return;
    const ripple = document.createElement('div');
    ripple.className = 'water-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `120px`;
    ripple.style.height = `120px`;

    rippleLayer.appendChild(ripple);
    playBubblePopAudio(850 + Math.random() * 150);

    setTimeout(() => {
      ripple.remove();
    }, 1000);
  }

  window.addEventListener('pointerdown', (e) => {
    // Only create ripples on non-form elements
    if (!e.target.closest('.glass-card') && !e.target.closest('.sound-toggle-btn')) {
      createWaterRipple(e.clientX, e.clientY);
    }
  });

  // Interactive mouse proximity repulsion
  let mouseThrottle = 0;
  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - mouseThrottle < 30) return;
    mouseThrottle = now;

    if (!isPasswordActive) {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      creatures.forEach(creature => {
        const cx = creature.x + (creature.width / 2);
        const cy = creature.y + (creature.height / 2);
        const dist = Math.hypot(cx - mouseX, cy - mouseY);
        if (dist < 85 && !creature.isFleeing) {
          creature.dartAway(mouseX, mouseY);
        }
      });
    }
  });

  // Animation Loop
  function animate(timestamp) {
    creatures.forEach(c => c.update(timestamp));
    requestAnimationFrame(animate);
  }

  // =========================================================
  // 7. PASSWORD PRIVACY INTERACTION
  // =========================================================

  function triggerPrivacyMode(enable) {
    if (isPasswordActive === enable) return;
    isPasswordActive = enable;

    if (enable) {
      privacyBadge.classList.add('shy-active');
      badgeText.textContent = "🙈 Privacy Mode: Diver & marine life scattered to protect your password!";
      
      avatarBadge.classList.add('shy-mode');

      creatures.forEach((creature, idx) => {
        const spot = CONFIG.hideSpots[idx % CONFIG.hideSpots.length];
        creature.fleeToCoral(spot);
      });

      playBubblePopAudio(440);
    } else {
      privacyBadge.classList.remove('shy-active');
      badgeText.textContent = "Fishes & diver are swimming peacefully";

      avatarBadge.classList.remove('shy-mode');

      creatures.forEach(c => c.returnFromCoral());
    }
  }

  if (passwordInput) {
    passwordInput.addEventListener('focus', () => {
      triggerPrivacyMode(true);
    });

    passwordInput.addEventListener('input', () => {
      if (!isPasswordActive) {
        triggerPrivacyMode(true);
      }
      if (Math.random() < 0.3) {
        spawnAmbientBubble();
      }
    });

    passwordInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement !== passwordInput) {
          triggerPrivacyMode(false);
        }
      }, 250);
    });
  }

  // Eye Toggle (Show/Hide Password)
  if (eyeToggleBtn && passwordInput) {
    eyeToggleBtn.addEventListener('click', () => {
      isPasswordRevealed = !isPasswordRevealed;
      const eyeOpenIcon = eyeToggleBtn.querySelector('.eye-open');
      const eyeClosedIcon = eyeToggleBtn.querySelector('.eye-closed');

      if (isPasswordRevealed) {
        passwordInput.type = 'text';
        eyeOpenIcon.classList.add('hidden');
        eyeClosedIcon.classList.remove('hidden');
        
        creatures.forEach(c => {
          if (c.bubbleEl) c.bubbleEl.textContent = "👀 Password revealed?!";
        });
      } else {
        passwordInput.type = 'password';
        eyeOpenIcon.classList.remove('hidden');
        eyeClosedIcon.classList.add('hidden');

        creatures.forEach(c => {
          if (c.bubbleEl) c.bubbleEl.textContent = c.shyShout;
        });
      }
    });
  }

  // Interactive Avatar Badge Click
  if (avatarBadge) {
    avatarBadge.addEventListener('click', () => {
      const isShy = avatarBadge.classList.toggle('shy-mode');
      if (isShy) {
        badgeText.textContent = "Fish badge is feeling shy!";
      } else {
        badgeText.textContent = "Fishes & diver are swimming peacefully";
      }
      playBubblePopAudio(520);
    });
  }

  // =========================================================
  // 8. FLOATING BUBBLES GENERATOR
  // =========================================================

  function spawnAmbientBubble() {
    if (!bubblesLayer) return;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = Math.random() * 22 + 8;
    const startX = Math.random() * (window.innerWidth * 0.6);
    const duration = Math.random() * 6 + 5;

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${startX}px`;
    bubble.style.animationDuration = `${duration}s`;

    bubble.addEventListener('click', () => {
      playBubblePopAudio(700 + Math.random() * 200);
      bubble.remove();
    });

    bubblesLayer.appendChild(bubble);

    setTimeout(() => {
      if (bubble.parentElement) {
        bubble.remove();
      }
    }, duration * 1000);
  }

  function spawnSmallBubbleBurst(x, y) {
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const size = Math.random() * 12 + 6;
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      b.style.left = `${x + (Math.random() * 40 - 20)}px`;
      b.style.bottom = `${window.innerHeight - y + (Math.random() * 20 - 10)}px`;
      b.style.animationDuration = `${Math.random() * 3 + 2.5}s`;
      bubblesLayer.appendChild(b);

      setTimeout(() => b.remove(), 4000);
    }
  }

  setInterval(spawnAmbientBubble, 900);

  // =========================================================
  // 9. SYNTHESIZED WEB AUDIO API
  // =========================================================

  let audioCtx = null;
  let isAudioActive = false;
  let ambientGain = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startOceanAmbience() {
    initAudioContext();
    if (ambientGain) return;

    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, audioCtx.currentTime);

    ambientGain = audioCtx.createGain();
    ambientGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 1.5);

    whiteNoise.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    whiteNoise.start(0);
  }

  function stopOceanAmbience() {
    if (ambientGain && audioCtx) {
      ambientGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      setTimeout(() => {
        ambientGain = null;
      }, 800);
    }
  }

  function playBubblePopAudio(freq = 600) {
    if (!isAudioActive || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.14);
    } catch (e) {}
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      isAudioActive = !isAudioActive;
      const soundOff = soundToggleBtn.querySelector('.sound-off');
      const soundOn = soundToggleBtn.querySelector('.sound-on');

      if (isAudioActive) {
        soundOff.classList.add('hidden');
        soundOn.classList.remove('hidden');
        soundToggleBtn.style.borderColor = '#38bdf8';
        startOceanAmbience();
      } else {
        soundOff.classList.remove('hidden');
        soundOn.classList.add('hidden');
        soundToggleBtn.style.borderColor = '';
        stopOceanAmbience();
      }
    });
  }

  // =========================================================
  // 10. FORM SUBMISSION FEEDBACK
  // =========================================================

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const userVal = usernameInput.value.trim();
      const passVal = passwordInput.value;

      if (!userVal || !passVal) {
        showToast("Please enter your username and password", "warning");
        return;
      }

      loginBtn.disabled = true;
      const origText = loginBtn.querySelector('.btn-text').textContent;
      loginBtn.querySelector('.btn-text').textContent = "Diving In...";

      setTimeout(() => {
        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').textContent = origText;
        showToast(`Welcome back, ${userVal}! Exploring Aqua World...`, "success");
      }, 1200);
    });
  }

  function showToast(message, type = "info") {
    const existing = document.querySelector('.aqua-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'aqua-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.background = 'rgba(8, 20, 42, 0.95)';
    toast.style.border = type === 'warning' ? '1px solid #f59e0b' : '1px solid #38bdf8';
    toast.style.color = '#ffffff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '14px';
    toast.style.boxShadow = '0 10px 30px rgba(2, 6, 23, 0.8)';
    toast.style.zIndex = '9999';
    toast.style.fontSize = '0.92rem';
    toast.style.backdropFilter = 'blur(16px)';
    toast.style.transition = 'all 0.3s ease';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // =========================================================
  // 11. INITIALIZATION
  // =========================================================

  initMarineEcosystem();
  initBioluminescentPlankton(35);
  requestAnimationFrame(animate);

  for (let i = 0; i < 8; i++) {
    setTimeout(spawnAmbientBubble, i * 400);
  }
});
