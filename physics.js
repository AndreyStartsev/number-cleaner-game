// DigiClean - Mediterranean Beach Physics Engine (Submerged Ocean Creatures, Jellyfish & Touch Fleeing Engine)

class ElasticCharacter {
  constructor(char, x, y, hue = 340) {
    this.char = char;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.hue = hue;

    this.rotation = 0;
    this.vRotation = 0;

    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.vx = 0;
    this.vy = 0;

    this.isFloating = false;

    // Localized Vinyl Cushion Denting Surface Parameters
    this.dentX = 0;
    this.dentY = 0;
    this.dentDepth = 0;
  }

  update(touches) {
    if (this.isFloating) {
      // Free floating physics during ocean wave wash-away
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.vRotation;
      this.vx *= 0.95;
      this.vy *= 0.95;
      this.vRotation *= 0.95;

      this.scaleX += (1.0 - this.scaleX) * 0.1;
      this.scaleY += (1.0 - this.scaleY) * 0.1;
      this.dentDepth *= 0.85;
      return;
    }

    // GROUNDED IN SAND: ZERO WORLD MOVEMENT (НЕ СКАКАТЬ / НЕ ПОПРЫГИВАТЬ)
    this.vx = 0;
    this.vy = 0;
    this.vRotation = 0;

    let maxDent = 0;
    let localDentX = 0;
    let localDentY = 0;

    for (const touch of touches) {
      const dx = touch.x - this.x;
      const dy = touch.y - this.y;
      const dist = Math.hypot(dx, dy);

      const dentRadius = 140;
      if (dist < dentRadius) {
        const indent = (1.0 - dist / dentRadius);
        if (indent > maxDent) {
          maxDent = indent;
          localDentX = dx;
          localDentY = dy;
        }
      }
    }

    // Localized surface squishing under finger pressure (Проминание надувной виниловой подушки)
    const targetScaleX = 1.0 - maxDent * 0.08;
    const targetScaleY = 1.0 - maxDent * 0.06;

    // Smooth viscous air-cushion recovery without spring bouncing
    this.scaleX += (targetScaleX - this.scaleX) * 0.2;
    this.scaleY += (targetScaleY - this.scaleY) * 0.2;

    this.dentX = localDentX;
    this.dentY = localDentY;
    this.dentDepth += (maxDent - this.dentDepth) * 0.25;
  }
}

class Particle {
  constructor(x, y, type = 'sand') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.life = 1.0;

    if (type === 'foam') {
      this.size = Math.random() * 8 + 4;
      this.color = 'rgba(255, 255, 255, 0.85)';
      this.decay = 0.02 + Math.random() * 0.02;
    } else {
      this.size = Math.random() * 3 + 1;
      this.color = `rgba(230, 200, 160, ${Math.random() * 0.6 + 0.4})`;
      this.decay = 0.03;
    }
    this.active = true;
  }

  update(w, h) {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    if (this.life <= 0) this.active = false;
  }
}

// PHOTOREALISTIC OCEAN SURF & SUBMERGED SEA CREATURES ENGINE (WITH JELLYFISH & TOUCH FLEEING)
class OceanWave {
  constructor() {
    this.waveTime = 0;
    
    // Persistent Swash Foam Residue Trails left on wet sand
    this.swashFoamTrails = [];

    // Swimming Underwater Sea Creatures (Very Rare Encounters, Paired Swimming & Touch Fleeing)
    this.seaCreatures = [];
  }

  getCurrentWaveY() {
    const time = this.waveTime;
    return 115 + Math.sin(time * 0.8) * 35;
  }

  update(w, h, touches = []) {
    this.waveTime += 0.016;
    const time = this.waveTime;

    // VERY RARE PROCEDURAL SEA CREATURE SPAWNER (Ocean is calm; creatures swim by rarely as a magical surprise)
    if (this.seaCreatures.length === 0 && Math.random() < 0.0008) {
      const types = ['fish', 'fish', 'jellyfish', 'jellyfish', 'octopus', 'stingray'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const dir = Math.random() < 0.5 ? 1 : -1;
      const startX = dir > 0 ? -90 : w + 90;
      const speed = (dir > 0 ? 1.0 : -1.0) * (Math.random() * 0.4 + 0.7);

      // Larger Stingray (60-74px)
      const size = chosenType === 'stingray' ? (Math.random() * 14 + 60) :
                  (chosenType === 'octopus' ? 32 :
                  (chosenType === 'jellyfish' ? 28 : 24));

      const primaryColor = chosenType === 'fish' ? ['#ff9e00', '#00b4d8', '#ff70a6'][Math.floor(Math.random() * 3)] :
                          (chosenType === 'jellyfish' ? ['#ff70a6', '#7209b7', '#48cae4'][Math.floor(Math.random() * 3)] : '#e63946');

      const primaryY = Math.random() * 45 + 35;

      this.seaCreatures.push({
        type: chosenType,
        x: startX,
        y: primaryY,
        vx: speed,
        vy: 0,
        size: size,
        color: primaryColor,
        phase: Math.random() * Math.PI * 2,
        isStartled: false
      });

      // PAIRED SWIMMING: Fish and Jellyfish occasionally swim in pairs! (45% chance)
      if ((chosenType === 'fish' || chosenType === 'jellyfish') && Math.random() < 0.45) {
        this.seaCreatures.push({
          type: chosenType,
          x: startX - dir * (Math.random() * 25 + 25),
          y: primaryY + (Math.random() - 0.5) * 28,
          vx: speed * 1.02,
          vy: 0,
          size: size * (0.85 + Math.random() * 0.2),
          color: primaryColor,
          phase: Math.random() * Math.PI * 2,
          isStartled: false
        });
      }
    }

    // UPDATE & TOUCH INTERACTIVITY: "Все морские обитатели если их тронуть улепетывают"
    for (let i = this.seaCreatures.length - 1; i >= 0; i--) {
      const sc = this.seaCreatures[i];

      // Check Touch Proximity to Startle Creatures
      for (const touch of touches) {
        const dx = sc.x - touch.x;
        const dy = sc.y - touch.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 85 && !sc.isStartled) {
          sc.isStartled = true;
          sc.vx *= 2.8; // Dart away rapidly!
          sc.vy = (dy >= 0 ? 1 : -1) * (Math.random() * 1.5 + 1.5);
          sc.size *= 1.1; // Panic swell
        }
      }

      sc.x += sc.vx;
      if (sc.vy) {
        sc.y += sc.vy;
        sc.vy *= 0.94;
      }

      // Clean up when safely offscreen
      if ((sc.vx > 0 && sc.x > w + 110) || (sc.vx < 0 && sc.x < -110)) {
        this.seaCreatures.splice(i, 1);
      }
    }

    // Swash Deposit: Leaves persistent damp foam trails on wet sand
    if (Math.random() < 0.3) {
      const tx = Math.random() * w;
      const waveExp = Math.exp(Math.sin(tx * 0.012 + time * 1.5) - 1.0);
      const baseWaveY = 115 + Math.sin(time * 0.8) * 35 + waveExp * 45;
      
      this.swashFoamTrails.push({
        x: tx,
        y: baseWaveY - Math.random() * 14,
        r: Math.random() * 14 + 5,
        alpha: Math.random() * 0.4 + 0.35,
        decay: 0.0025 + Math.random() * 0.0025
      });
    }

    for (let i = this.swashFoamTrails.length - 1; i >= 0; i--) {
      const st = this.swashFoamTrails[i];
      st.alpha -= st.decay;
      if (st.alpha <= 0) this.swashFoamTrails.splice(i, 1);
    }
  }

  // SINGLE UNIFIED OCEAN WAVE RENDER PASS (C2-CONTINUOUS PHASE TRANSITION)
  draw(ctx, w, h, isWinning = false, sweepWaveY = -100, winTimer = 0) {
    const time = this.waveTime;
    
    const baseWaveY = (isWinning && sweepWaveY > -80)
      ? sweepWaveY 
      : (115 + Math.sin(time * 0.8) * 35);

    // 1. Draw Persistent Swash Foam Residue Trails on Wet Sand
    ctx.save();
    for (const st of this.swashFoamTrails) {
      const fGrad = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.r);
      fGrad.addColorStop(0, `rgba(255, 255, 255, ${st.alpha})`);
      fGrad.addColorStop(0.5, `rgba(215, 245, 255, ${st.alpha * 0.6})`);
      fGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. EXPONENTIAL SINE WAVE CREST STACKING (exp(sin(x) - 1.0))
    const wavePoints = [];
    for (let x = 0; x <= w + 20; x += 12) {
      const waveExp = Math.exp(Math.sin(x * 0.012 + time * 1.6) - 1.0);
      const waveNoise = Math.sin(x * 0.032 - time * 0.9) * 8 + Math.cos(x * 0.055 + time * 2.2) * 4;
      const y = baseWaveY + waveExp * 44 + waveNoise;
      wavePoints.push({ x, y });
    }

    // 2.5 RENDER RARE SWIMMING SEA CREATURES (FISH, JELLYFISH, OCTOPUS, STINGRAY) UNDER THE WATER LAYER!
    ctx.save();
    for (const sc of this.seaCreatures) {
      ctx.save();
      ctx.translate(sc.x, sc.y + Math.sin(time * 2 + sc.phase) * 6);
      if (sc.vx < 0) ctx.scale(-1, 1);

      const sz = sc.size;

      if (sc.type === 'fish') {
        // 3D Tropical Fish swimming underwater
        const tailAngle = Math.sin(time * (sc.isStartled ? 16 : 8) + sc.phase) * 0.28;

        // Tail Fin
        ctx.save();
        ctx.translate(-sz * 0.5, 0);
        ctx.rotate(tailAngle);
        ctx.fillStyle = '#ff7b00';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-sz * 0.6, -sz * 0.45);
        ctx.quadraticCurveTo(-sz * 0.4, 0, -sz * 0.6, sz * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Fish Body
        const fGrad = ctx.createLinearGradient(-sz * 0.5, 0, sz * 0.5, 0);
        fGrad.addColorStop(0, sc.color);
        fGrad.addColorStop(0.6, '#48cae4');
        fGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, sz * 0.6, sz * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stripes & Eye
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(-sz * 0.1, -sz * 0.35, sz * 0.12, sz * 0.7);
        ctx.fillStyle = '#03045e';
        ctx.beginPath();
        ctx.arc(sz * 0.32, -sz * 0.1, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sz * 0.3, -sz * 0.14, 1.2, 1.2);

      } else if (sc.type === 'jellyfish') {
        // 3D TRANSLUCENT JELLYFISH (PULSING UMBRELLA BELL & DELICATE TENTACLES)
        const pulse = Math.sin(time * (sc.isStartled ? 9 : 4.5) + sc.phase) * 0.15;

        // 4 Oral Arms & Stinging Tentacles Undulating Below Bell
        ctx.strokeStyle = sc.color;
        ctx.lineWidth = 1.8;
        for (let t = -3; t <= 3; t += 2) {
          const wave = Math.sin(time * 6 + t * 0.8) * 8;
          ctx.beginPath();
          ctx.moveTo(t * 3, 6);
          ctx.quadraticCurveTo(t * 5 + wave, 18, t * 7 + wave * 1.4, 32);
          ctx.stroke();
        }

        // Inner Glowing Bell Coils
        const innerGrad = ctx.createRadialGradient(0, -6, 2, 0, 0, sz * 0.5);
        innerGrad.addColorStop(0, '#ffffff');
        innerGrad.addColorStop(0.6, sc.color);
        innerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.ellipse(0, -6, sz * 0.35, sz * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Translucent Umbrella Bell Dome
        const jGrad = ctx.createRadialGradient(-3, -12, 1, 0, -4, sz * 0.75);
        jGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        jGrad.addColorStop(0.4, sc.color);
        jGrad.addColorStop(0.85, 'rgba(180, 220, 255, 0.6)');
        jGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

        ctx.fillStyle = jGrad;
        ctx.beginPath();
        ctx.ellipse(0, -8, sz * (0.6 + pulse), sz * (0.45 - pulse), 0, 0, Math.PI * 2);
        ctx.fill();

        // Rhopalia Lobe Margin Edges along Bell Rim
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, -4, sz * (0.58 + pulse), sz * 0.12, 0, 0, Math.PI);
        ctx.stroke();

      } else if (sc.type === 'octopus') {
        // 3D Octopus swimming underwater
        const pulse = Math.sin(time * (sc.isStartled ? 7 : 3) + sc.phase) * 0.14;

        // 8 Undulating Tentacles
        ctx.strokeStyle = '#b5179e';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        for (let t = -3; t <= 4; t++) {
          const angle = (t / 4) * 0.8;
          const wave = Math.sin(time * (sc.isStartled ? 9 : 5) + t * 0.6) * 12;
          ctx.beginPath();
          ctx.moveTo(Math.sin(angle) * 8, Math.cos(angle) * 8 + 6);
          ctx.quadraticCurveTo(Math.sin(angle) * 18 + wave, 22, Math.sin(angle) * 26 + wave * 1.5, 34);
          ctx.stroke();
        }

        // Bulbous Mantle Head
        const octGrad = ctx.createRadialGradient(-4, -6, 2, 0, 0, sz * 0.7);
        octGrad.addColorStop(0, '#ff70a6');
        octGrad.addColorStop(0.5, '#7209b7');
        octGrad.addColorStop(1, '#3a0ca3');
        ctx.fillStyle = octGrad;

        ctx.beginPath();
        ctx.ellipse(0, -4, sz * (0.55 + pulse), sz * (0.65 - pulse), 0, 0, Math.PI * 2);
        ctx.fill();

        // Cute Specular Eyes
        for (let side = -1; side <= 1; side += 2) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(side * 7, 2, 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(side * 7 + 0.5, 2, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (sc.type === 'stingray') {
        // GRAND 3D MANTA RAY / STINGRAY (LARGER SIZE: 60-74px)
        const wingFlap = Math.sin(time * (sc.isStartled ? 6 : 3) + sc.phase) * sz * 0.28;

        // Long Whip Tail
        ctx.strokeStyle = '#2b2d42';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-sz * 0.5, 0);
        ctx.quadraticCurveTo(-sz * 1.2, Math.sin(time * 4) * 10, -sz * 1.9, 0);
        ctx.stroke();

        // Diamond Pectoral Body & Wingtips
        const rayGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, sz * 0.85);
        rayGrad.addColorStop(0, '#a2abb8');
        rayGrad.addColorStop(0.5, '#4a4e69');
        rayGrad.addColorStop(1, '#1d1e2c');
        ctx.fillStyle = rayGrad;

        ctx.beginPath();
        ctx.moveTo(sz * 0.65, 0);
        ctx.quadraticCurveTo(0, -sz * 0.7 - wingFlap, -sz * 0.5, 0);
        ctx.quadraticCurveTo(0, sz * 0.7 + wingFlap, sz * 0.65, 0);
        ctx.closePath();
        ctx.fill();

        // Spine Ridge Line & Eyes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-sz * 0.4, 0);
        ctx.lineTo(sz * 0.55, 0);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sz * 0.38, -6, 3.0, 0, Math.PI * 2);
        ctx.arc(sz * 0.38, 6, 3.0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.restore();

    // 3. DISTANCE-FIELD SHORELINE ALPHA MASK & COLOR GRADIENT PASS (DRAWN OVER SUBMERGED CREATURES!)
    const maxWaveY = Math.max(...wavePoints.map(p => p.y));
    const seaGrad = ctx.createLinearGradient(0, 0, 0, maxWaveY + 55);
    seaGrad.addColorStop(0, 'rgba(0, 65, 120, 0.97)');       // Deep sapphire ocean body
    seaGrad.addColorStop(0.35, 'rgba(0, 125, 175, 0.88)');   // Mid-depth cyan
    seaGrad.addColorStop(0.65, 'rgba(65, 195, 222, 0.55)');  // Clear turquoise
    seaGrad.addColorStop(0.85, 'rgba(150, 230, 250, 0.25)'); // Translucent water film
    seaGrad.addColorStop(0.96, 'rgba(210, 245, 255, 0.08)'); // Micro water margin
    seaGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');     // Zero alpha

    ctx.fillStyle = seaGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    for (let i = wavePoints.length - 1; i >= 0; i--) {
      ctx.lineTo(wavePoints[i].x, wavePoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // 4. SOFT NATURAL SEA FOAM ALONG LEADING EDGE (DRAWN ON TOP OF WATER SURFACE!)
    ctx.save();
    for (let x = 10; x < w; x += 22) {
      const waveExp = Math.exp(Math.sin(x * 0.012 + time * 1.6) - 1.0);
      const frontY = baseWaveY + waveExp * 44;
      
      const noiseMod = (Math.sin(x * 0.08 + time * 3) * 0.5 + 0.5);
      const fRadius = 14 + noiseMod * 12;

      const foamGrad = ctx.createRadialGradient(x, frontY, 1, x, frontY, fRadius);
      foamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
      foamGrad.addColorStop(0.5, 'rgba(230, 248, 255, 0.75)');
      foamGrad.addColorStop(0.85, 'rgba(200, 240, 255, 0.35)');
      foamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = foamGrad;
      ctx.beginPath();
      ctx.arc(x, frontY, fRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
