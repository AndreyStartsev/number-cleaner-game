// DigiClean - Mediterranean Beach Excavator (Ultra-Detailed Immovable Buried Relics Engine)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Character Pools: Digits, Russian Alphabet (А-Я), English Alphabet (A-Z)
const DIGIT_CHARACTERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const RU_CHARACTERS = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И',
  'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т',
  'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь',
  'Э', 'Ю', 'Я'
];

const EN_CHARACTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 
  'U', 'V', 'W', 'X', 'Y', 'Z'
];

// Pronunciation Maps for Speech Synthesis
const RU_SPEECH_MAP = {
  'А': 'А', 'Б': 'Бэ', 'В': 'Вэ', 'Г': 'Гэ', 'Д': 'Дэ', 'Е': 'Е', 'Ё': 'Ё',
  'Ж': 'Жэ', 'З': 'Зэ', 'И': 'И', 'Й': 'И краткое', 'К': 'Ка', 'Л': 'Эл',
  'М': 'Эм', 'Н': 'Эн', 'О': 'О', 'П': 'Пэ', 'Р': 'Эр', 'С': 'Эс', 'Т': 'Тэ',
  'У': 'У', 'Ф': 'Эф', 'Х': 'Ха', 'Ц': 'Цэ', 'Ч': 'Че', 'Ш': 'Ша', 'Щ': 'Ща',
  'Ъ': 'Твёрдый знак', 'Ы': 'Ы', 'Ь': 'Мягкий знак', 'Э': 'Э', 'Ю': 'Ю', 'Я': 'Я'
};

const EN_SPEECH_MAP = {
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G',
  'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
  'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U',
  'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z'
};

const DIGIT_RU_NAMES = ['Ноль', 'Один', 'Два', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять'];
const DIGIT_EN_NAMES = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

// Game Settings State & Storage (Auto-detects default language pool based on user region locale)
function detectRegionDefaultSettings() {
  const userLangs = (navigator.languages || [navigator.language || 'ru']).map(l => String(l).toLowerCase());
  const isRussianRegion = userLangs.some(l => l.startsWith('ru') || l.includes('by') || l.includes('kz') || l.includes('mo'));

  return {
    includeRussianDigits: isRussianRegion,
    includeEnglishDigits: !isRussianRegion,
    includeRussian: isRussianRegion,
    includeEnglish: !isRussianRegion,
    isShuffle: true
  };
}

let settings = detectRegionDefaultSettings();
let sequentialIndex = 0;

function loadSettings() {
  try {
    const saved = localStorage.getItem('digiclean_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      settings = Object.assign(settings, parsed);
    } else {
      settings = detectRegionDefaultSettings();
    }
  } catch (e) {
    settings = detectRegionDefaultSettings();
  }
}

function saveSettings() {
  try {
    localStorage.setItem('digiclean_settings', JSON.stringify(settings));
  } catch (e) {}
}

loadSettings();

function getActiveCharacterPool() {
  let pool = [];

  if (settings.includeRussianDigits) {
    for (let i = 0; i <= 9; i++) {
      pool.push({ char: String(i), lang: 'ru' });
    }
  }

  if (settings.includeEnglishDigits) {
    for (let i = 0; i <= 9; i++) {
      pool.push({ char: String(i), lang: 'en' });
    }
  }

  if (settings.includeRussian) {
    RU_CHARACTERS.forEach(c => pool.push({ char: c, lang: 'ru' }));
  }

  if (settings.includeEnglish) {
    EN_CHARACTERS.forEach(c => pool.push({ char: c, lang: 'en' }));
  }

  if (pool.length === 0) {
    settings.includeRussianDigits = true;
    for (let i = 0; i <= 9; i++) {
      pool.push({ char: String(i), lang: 'ru' });
    }
    saveSettings();
  }

  return pool;
}

function getNextCharacter() {
  const pool = getActiveCharacterPool();
  if (settings.isShuffle) {
    return pool[Math.floor(Math.random() * pool.length)];
  } else {
    if (sequentialIndex >= pool.length) sequentialIndex = 0;
    const item = pool[sequentialIndex];
    sequentialIndex = (sequentialIndex + 1) % pool.length;
    return item;
  }
}

let currentLevelIndex = 0;
let activeCharacter = null;

// Next Round Setup Buffer (Prepared silently during victory sweep)
let nextChar = '0';
let nextHue = 340;
let nextX = 0;
let nextY = 0;

let particles = [];
let activeTouches = [];
let oceanWave = new OceanWave();

// Top Covering Sand Layer Canvas - FULL 1:1 CRISP HIGH-RESOLUTION (100% SOLID OPAQUE)
const dirtCanvas = document.createElement('canvas');
const dirtCtx = dirtCanvas.getContext('2d');
const DIRT_SCALE = 1.0;

// Procedural Micro-Sand Grain Texture Pattern (100% SOLID OPAQUE WITH QUARTZ GLINTS)
const sandPatternCanvas = document.createElement('canvas');
const sandPatternCtx = sandPatternCanvas.getContext('2d');

// Font Glyph Mask Canvas
const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d');
const MASK_SCALE = 0.2;

// Inflatable Pool Toy Texture Canvas
const tileCanvas = document.createElement('canvas');
const tileCtx = tileCanvas.getContext('2d');
const TILE_SIZE = 512;

let cleanProgress = 0;
let isWinning = false;
let winTimer = 0;
let phaseTimer = 0;
let progressCheckTimer = 0;

// Three-phase non-linear hydrodynamic wave sweep state: 'receding_pre' -> 'advancing' -> 'receding_post'
let sweepWaveY = -100;
let sweepStartWaveY = -100;
let sweepPhase = 'advancing';

// Beach Shell Props & Dynamic Wave Transport Arrays
let beachProps = [];
let oldBeachProps = []; // Props floating away with receding wave
let pendingNewProps = [];

// Real Ocean Waves Audio Recording (Authentic Live Field Recording of Ocean Surf)
let realOceanAudio = new Audio();
realOceanAudio.loop = true;
realOceanAudio.volume = 0.35;
realOceanAudio.src = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Oceanwavescrushing.ogg/Oceanwavescrushing.ogg.mp3';

// Sound Synth Engine Fallback
let audioCtx = null;
let oceanNoiseNode = null;
let oceanGainNode = null;
let digSynth = null;
let squeakSynth = null;
let splashSynth = null;
let mainMute = false;

// Generate High-Definition Crisp Micro-Sand Grain Texture with Specular Quartz Glints
function generateSandPattern() {
  sandPatternCanvas.width = 512;
  sandPatternCanvas.height = 512;
  sandPatternCtx.fillStyle = '#e2c598';
  sandPatternCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 1.2 + 0.4;
    const isDark = Math.random() < 0.52;
    sandPatternCtx.fillStyle = isDark ? '#b89467' : '#f5e4c4';
    sandPatternCtx.beginPath();
    sandPatternCtx.arc(x, y, r, 0, Math.PI * 2);
    sandPatternCtx.fill();
  }

  // Specular Quartz Micro-Glints
  sandPatternCtx.fillStyle = '#ffffff';
  for (let q = 0; q < 450; q++) {
    const qx = Math.random() * 512;
    const qy = Math.random() * 512;
    sandPatternCtx.fillRect(qx, qy, 1.2, 1.2);
  }
}
generateSandPattern();

function initAudio() {
  if (realOceanAudio) {
    realOceanAudio.play().catch(e => {});
  }

  if ('speechSynthesis' in window && voiceList.length === 0) {
    voiceList = window.speechSynthesis.getVoices();
  }

  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  try {
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
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    oceanNoiseNode = audioCtx.createBufferSource();
    oceanNoiseNode.buffer = noiseBuffer;
    oceanNoiseNode.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;

    oceanGainNode = audioCtx.createGain();
    oceanGainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);

    oceanNoiseNode.connect(filter);
    filter.connect(oceanGainNode);
    oceanGainNode.connect(audioCtx.destination);
    oceanNoiseNode.start();
  } catch (e) {}

  digSynth = {
    play: (volume = 0.08) => {
      if (mainMute || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130 + Math.random() * 70, audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.07);
      } catch (e) {}
    }
  };

  squeakSynth = {
    play: (volume = 0.12, freq = 260) => {
      if (mainMute || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.11);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch (e) {}
    }
  };

  splashSynth = {
    play: () => {
      if (mainMute || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.42);
      } catch (e) {}
    }
  };
}

// Soft Low-Frequency Water Pullback / Undertow Sound for Phase 1 Drawback
function playUndertowSound() {
  if (!audioCtx || mainMute) return;
  try {
    const bufferSize = audioCtx.sampleRate * 0.6;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    const now = audioCtx.currentTime;
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.linearRampToValueAtTime(140, now + 0.5);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.25);
    gainNode.gain.linearRampToValueAtTime(0.001, now + 0.55);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.55);
  } catch (e) {}
}

// REAL VOICE MP3 PLAYER WITH CUTE CHILD VOICE PITCH MODULATION
let letterAudioObject = null;

function speakCharacter(target) {
  if (mainMute || !target) return;

  let char = target;
  let lang = 'ru';

  if (typeof target === 'object') {
    char = target.char || target;
    lang = target.lang || (/[А-Яа-яЁё]/.test(char) ? 'ru' : 'en');
  } else if (activeCharacter && activeCharacter.char === target) {
    char = activeCharacter.char;
    lang = activeCharacter.lang || (/[А-Яа-яЁё]/.test(char) ? 'ru' : 'en');
  } else {
    lang = /[А-Яа-яЁё]/.test(char) ? 'ru' : 'en';
  }

  const charCode = char.charCodeAt(0);
  const candidateUrls = [];

  if (lang === 'ru') {
    candidateUrls.push(`audio/ru_${charCode}.mp3`);
    candidateUrls.push(`audio/ru_${char}.mp3`);
    candidateUrls.push(`audio/${charCode}.mp3`);
    candidateUrls.push(`audio/${char}.mp3`);
  } else {
    candidateUrls.push(`audio/en_${char}.mp3`);
    candidateUrls.push(`audio/en_${charCode}.mp3`);
    candidateUrls.push(`audio/${char}.mp3`);
    candidateUrls.push(`audio/${charCode}.mp3`);
  }

  try {
    if (letterAudioObject) {
      letterAudioObject.pause();
      letterAudioObject = null;
    }

    const tryPlayAudio = (index) => {
      if (index >= candidateUrls.length) {
        console.warn(`[MP3 Audio] Could not play any candidate URL for '${char}' (${lang}):`, candidateUrls);
        speakWithWebSpeech(char, lang);
        return;
      }
      const audioUrl = candidateUrls[index];
      console.log(`[MP3 Audio] Playing local child-voiced MP3: ${audioUrl}`);
      letterAudioObject = new Audio(audioUrl);
      letterAudioObject.volume = 1.0;

      const playPromise = letterAudioObject.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`[MP3 Audio] Success playing: ${audioUrl}`);
        }).catch(e => {
          console.warn(`[MP3 Audio] Failed playing ${audioUrl}, trying next candidate...`, e);
          tryPlayAudio(index + 1);
        });
      } else {
        speakWithWebSpeech(char, lang);
      }
    };

    tryPlayAudio(0);
  } catch (e) {
    console.error(`[MP3 Audio] Error playing character sound for '${char}':`, e);
    speakWithWebSpeech(char, lang);
  }
}

function speakWithWebSpeech(char, lang = 'ru') {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();

    let textToSpeak = char;
    let bcp47 = lang === 'ru' ? 'ru-RU' : 'en-US';

    if (/[0-9]/.test(char)) {
      const idx = parseInt(char, 10);
      if (lang === 'ru') {
        textToSpeak = DIGIT_RU_NAMES[idx] || char;
        bcp47 = 'ru-RU';
      } else {
        textToSpeak = DIGIT_EN_NAMES[idx] || char;
        bcp47 = 'en-US';
      }
    } else if (/[А-Яа-яЁё]/.test(char)) {
      textToSpeak = RU_SPEECH_MAP[char] || char;
      bcp47 = 'ru-RU';
    } else if (/[A-Za-z]/.test(char)) {
      textToSpeak = EN_SPEECH_MAP[char] || char;
      bcp47 = 'en-US';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = bcp47;
    utterance.rate = 0.90;
    utterance.pitch = 1.35; // Cute Child Pitch

    const voices = window.speechSynthesis.getVoices();
    const voiceMatch = voices.find(v => v.lang.startsWith(bcp47.slice(0, 2)));
    if (voiceMatch) {
      utterance.voice = voiceMatch;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {}
}

function playLetterAudio(char) {
  speakCharacter(char);
}

// Rushing Ocean Wave Sound Effect for Victory Wash-Away (Triggered EXACTLY as Wave Rolls Down!)
function playWaveRushSound() {
  if (realOceanAudio) {
    try {
      realOceanAudio.volume = 0.85;
      setTimeout(() => {
        if (realOceanAudio) realOceanAudio.volume = 0.35;
      }, 4500);
    } catch (e) {}
  }

  if (!audioCtx || mainMute) return;
  try {
    const bufferSize = audioCtx.sampleRate * 3.5;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    const now = audioCtx.currentTime;
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(850, now + 1.8);
    filter.frequency.exponentialRampToValueAtTime(140, now + 3.4);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.38, now + 1.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 3.5);
  } catch (e) {}
}

// WEIGHTED DISTRIBUTION: PEBBLES, FAN SHELLS, SPIRAL SHELLS, STARFISH, CRABS & RARE BURIED RELICS
function generateBeachProps(targetX = width / 2, targetY = height / 2) {
  const props = [];
  const minDim = Math.min(width, height);

  // Original total count of beach items
  const count = Math.min(22, Math.max(12, Math.floor(width / 34)));

  // Buried relic logic (80% chance for 1 buried artifact under sand)
  if (Math.random() < 0.80) {
    const artifacts = ['bottle', 'boot', 'fish_skeleton', 'anchor', 'treasure'];
    const chosenArtifact = artifacts[Math.floor(Math.random() * artifacts.length)];
    const angle = Math.random() * Math.PI * 2;
    const radius = minDim * 0.25 + Math.random() * 30;
    const relicSize = minDim * 0.11;

    props.push({
      x: Math.min(width - 45, Math.max(45, targetX + Math.cos(angle) * radius)),
      y: Math.min(height - 70, Math.max(140, targetY + Math.sin(angle) * radius)),
      type: chosenArtifact,
      size: relicSize,
      rotation: (Math.random() - 0.5) * 0.8,
      color: '#d4a373',
      isFloating: false,
      isBuried: true, // IMMOVABLE UNDER SAND!
      uncoverProgress: 0.0, // GRADUAL ARCHEOLOGICAL EXCAVATION PROGRESS
      vx: 0,
      vy: 0,
      vRotation: 0
    });
  }

  // Organic, natural distribution slightly denser near the target letter (no rigid rings)
  for (let i = 0; i < count; i++) {
    let px, py;
    if (i < 10) {
      // Natural organic offset around letter
      const offsetX = (Math.random() - 0.5 + Math.random() - 0.5) * minDim * 0.22;
      const offsetY = (Math.random() - 0.5 + Math.random() - 0.5) * minDim * 0.22;
      px = Math.min(width - 30, Math.max(30, targetX + offsetX));
      py = Math.min(height - 50, Math.max(130, targetY + offsetY));
    } else {
      px = (i * (width / count) + Math.sin(i * 2) * 45 + Math.random() * 30) % (width - 60) + 30;
      py = 140 + ((i * 85 + Math.random() * 30) % (height - 220));
    }

    const rand = Math.random();
    let propType = 'pebble';
    let propSize = minDim * (0.022 + Math.random() * 0.028);

    if (rand < 0.10) {
      propType = 'shell';
      propSize = minDim * (0.045 + Math.random() * 0.025);
    } else if (rand < 0.16) {
      propType = 'spiral_shell';
      propSize = minDim * (0.042 + Math.random() * 0.022);
    } else if (rand < 0.20) {
      propType = 'starfish';
      propSize = minDim * (0.052 + Math.random() * 0.028);
    } else if (rand < 0.23) {
      propType = 'crab';
      propSize = minDim * (0.048 + Math.random() * 0.024);
    }

    props.push({
      x: px,
      y: py,
      type: propType,
      size: propSize,
      rotation: Math.random() * Math.PI * 2,
      color: ['#f4acb7', '#ffcad4', '#d8e2dc', '#b8c0ff', '#fde2e4', '#e2ece9'][i % 6],
      isFloating: false,
      isBuried: false,
      vx: 0,
      vy: 0,
      vRotation: 0
    });
  }
  return props;
}

function renderInflatablePoolToy(char, hue) {
  tileCanvas.width = TILE_SIZE;
  tileCanvas.height = TILE_SIZE;
  tileCtx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);

  const cx = TILE_SIZE / 2;
  const cy = TILE_SIZE / 2;
  const fontSize = 270;

  tileCtx.textAlign = 'center';
  tileCtx.textBaseline = 'middle';
  tileCtx.font = `700 ${fontSize}px Fredoka, Rubik, "Arial Rounded MT Bold", sans-serif`;

  // 1. Heat-Sealed Vinyl Outer Border Seam
  tileCtx.save();
  tileCtx.strokeStyle = `hsl(${hue}, 85%, 22%)`;
  tileCtx.lineWidth = 34;
  tileCtx.lineJoin = 'round';
  tileCtx.strokeText(char, cx, cy);
  tileCtx.restore();

  // 2. Volumetric Inflatable Body Gradient (3D Cushion Normals)
  const vinylGrad = tileCtx.createRadialGradient(cx - 50, cy - 50, 15, cx, cy, 190);
  vinylGrad.addColorStop(0, `hsl(${hue}, 100%, 82%)`);
  vinylGrad.addColorStop(0.35, `hsl(${hue}, 100%, 58%)`);
  vinylGrad.addColorStop(0.75, `hsl(${hue}, 95%, 40%)`);
  vinylGrad.addColorStop(1, `hsl(${hue}, 90%, 25%)`);
  
  tileCtx.fillStyle = vinylGrad;
  tileCtx.fillText(char, cx, cy);

  // 3. Inner Heat-Weld Plastic Seam Line
  tileCtx.save();
  tileCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  tileCtx.lineWidth = 6;
  tileCtx.lineJoin = 'round';
  tileCtx.strokeText(char, cx, cy);
  tileCtx.restore();

  // 4. Blinn-Specular Glossy Sun Highlights
  tileCtx.save();
  tileCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  tileCtx.fillText(char, cx - 8, cy - 8);
  tileCtx.restore();

  // Sharp Sun Spot Glint
  tileCtx.save();
  tileCtx.fillStyle = '#ffffff';
  tileCtx.beginPath();
  tileCtx.ellipse(cx - 50, cy - 60, 18, 9, -Math.PI / 4, 0, Math.PI * 2);
  tileCtx.fill();
  tileCtx.restore();
}

function getRandomCharacterPosition(w = width, h = height) {
  const minX = Math.max(90, w * 0.18);
  const maxX = Math.min(w - 90, w * 0.82);
  const posX = minX + Math.random() * (maxX - minX);

  const minY = Math.max(200, h * 0.28);
  const maxY = Math.min(h - 130, h * 0.82);
  const posY = minY + Math.random() * (maxY - minY);

  return { x: posX, y: posY };
}

let nextLang = 'ru';

function initLevel() {
  isWinning = false;
  winTimer = 0;
  phaseTimer = 0;
  sweepWaveY = 0;
  sweepStartWaveY = 0;
  sweepPhase = 'advancing';
  cleanProgress = 0;
  particles = [];
  oldBeachProps = [];

  const nextItem = getNextCharacter();
  const randomChar = typeof nextItem === 'object' ? nextItem.char : nextItem;
  const itemLang = typeof nextItem === 'object' ? nextItem.lang : (/[А-Яа-яЁё]/.test(randomChar) ? 'ru' : 'en');
  const hues = [340, 195, 45, 130, 270, 25, 185, 315, 90, 165];
  const currentHue = hues[Math.floor(Math.random() * hues.length)];

  // Fully dynamic responsive random position across full beach area (portrait & landscape)
  const pos = getRandomCharacterPosition(width, height);
  const randomX = pos.x;
  const randomY = pos.y;

  activeCharacter = new ElasticCharacter(randomChar, randomX, randomY, currentHue);
  activeCharacter.lang = itemLang;
  activeCharacter.rotation = (Math.random() - 0.5) * 0.7;

  renderInflatablePoolToy(randomChar, currentHue);
  beachProps = generateBeachProps(randomX, randomY);

  // Create FULL 1:1 Crisp High-Definition Top Sand Layer Canvas (100% SOLID OPAQUE)
  dirtCanvas.width = width * DIRT_SCALE;
  dirtCanvas.height = height * DIRT_SCALE;
  
  dirtCtx.save();
  dirtCtx.fillStyle = '#e2c598'; // Opaque solid sand base
  dirtCtx.fillRect(0, 0, dirtCanvas.width, dirtCanvas.height);

  const pat = dirtCtx.createPattern(sandPatternCanvas, 'repeat');
  dirtCtx.fillStyle = pat;
  dirtCtx.fillRect(0, 0, dirtCanvas.width, dirtCanvas.height);
  dirtCtx.restore();

  maskCanvas.width = width * MASK_SCALE;
  maskCanvas.height = height * MASK_SCALE;
  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  maskCtx.save();
  const maskCX = randomX * MASK_SCALE;
  const maskCY = randomY * MASK_SCALE;
  const maskFontSize = 270 * MASK_SCALE;

  maskCtx.translate(maskCX, maskCY);
  maskCtx.rotate(activeCharacter.rotation);
  maskCtx.textAlign = 'center';
  maskCtx.textBaseline = 'middle';
  maskCtx.font = `700 ${maskFontSize}px Fredoka, Rubik, "Arial Rounded MT Bold", sans-serif`;
  maskCtx.fillStyle = '#ffffff';
  maskCtx.fillText(randomChar, 0, 0);
  maskCtx.restore();

  cleanProgress = 0.0;
}

function redrawMask() {
  if (!activeCharacter) return;
  maskCanvas.width = width * MASK_SCALE;
  maskCanvas.height = height * MASK_SCALE;
  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  maskCtx.save();
  const maskCX = activeCharacter.x * MASK_SCALE;
  const maskCY = activeCharacter.y * MASK_SCALE;
  const maskFontSize = 270 * MASK_SCALE;

  maskCtx.translate(maskCX, maskCY);
  maskCtx.rotate(activeCharacter.rotation);
  maskCtx.textAlign = 'center';
  maskCtx.textBaseline = 'middle';
  maskCtx.font = `700 ${maskFontSize}px Fredoka, Rubik, "Arial Rounded MT Bold", sans-serif`;
  maskCtx.fillStyle = '#ffffff';
  maskCtx.fillText(activeCharacter.char, 0, 0);
  maskCtx.restore();
}

function resizeGame() {
  const oldW = width;
  const oldH = height;

  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;

  if (oldW && oldH && activeCharacter) {
    const relX = activeCharacter.x / oldW;
    const relY = activeCharacter.y / oldH;
    const minX = Math.max(90, width * 0.18);
    const maxX = Math.min(width - 90, width * 0.82);
    const minY = Math.max(200, height * 0.28);
    const maxY = Math.min(height - 130, height * 0.82);

    activeCharacter.x = Math.max(minX, Math.min(maxX, relX * width));
    activeCharacter.y = Math.max(minY, Math.min(maxY, relY * height));
  }

  if (oldW && oldH && (oldW !== width || oldH !== height) && dirtCanvas && dirtCanvas.width > 0) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dirtCanvas.width;
    tempCanvas.height = dirtCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(dirtCanvas, 0, 0);

    dirtCanvas.width = width * DIRT_SCALE;
    dirtCanvas.height = height * DIRT_SCALE;

    const pat = dirtCtx.createPattern(sandPatternCanvas, 'repeat');
    dirtCtx.fillStyle = pat;
    dirtCtx.fillRect(0, 0, dirtCanvas.width, dirtCanvas.height);

    dirtCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, dirtCanvas.width, dirtCanvas.height);
  } else {
    dirtCanvas.width = width * DIRT_SCALE;
    dirtCanvas.height = height * DIRT_SCALE;
    const pat = dirtCtx.createPattern(sandPatternCanvas, 'repeat');
    dirtCtx.fillStyle = pat;
    dirtCtx.fillRect(0, 0, dirtCanvas.width, dirtCanvas.height);
  }

  redrawMask();
}

window.addEventListener('resize', resizeGame);
document.addEventListener('fullscreenchange', resizeGame);
document.addEventListener('webkitfullscreenchange', resizeGame);

function calculateProgress() {
  if (isWinning || !activeCharacter) return;

  const maskW = maskCanvas.width;
  const maskH = maskCanvas.height;
  if (maskW === 0 || maskH === 0) return;

  const maskData = maskCtx.getImageData(0, 0, maskW, maskH).data;
  
  const tempDirtCanvas = document.createElement('canvas');
  tempDirtCanvas.width = maskW;
  tempDirtCanvas.height = maskH;
  const tempDirtCtx = tempDirtCanvas.getContext('2d');
  
  // DISABLE SMOOTHING INTERPOLATION SO ALPHA VALUES ARE NOT BLENDED/CORRUPTED DURING DOWNSCALING!
  tempDirtCtx.imageSmoothingEnabled = false;
  tempDirtCtx.webkitImageSmoothingEnabled = false;
  tempDirtCtx.mozImageSmoothingEnabled = false;
  tempDirtCtx.drawImage(dirtCanvas, 0, 0, maskW, maskH);
  
  const dirtData = tempDirtCtx.getImageData(0, 0, maskW, maskH).data;

  let totalPoints = 0;
  let cleanedPoints = 0;

  for (let i = 0; i < maskData.length; i += 4) {
    const isFontZone = maskData[i] > 100;
    if (isFontZone) {
      totalPoints++;
      const sandAlpha = dirtData[i + 3];
      if (sandAlpha < 210) {
        cleanedPoints++;
      }
    }
  }

  cleanProgress = totalPoints > 0 ? (cleanedPoints / totalPoints) : 0;

  // 100% RELIABLE VICTORY TRIGGER (cleanProgress >= 0.65)
  if (cleanProgress >= 0.65) {
    triggerVictory();
  }
}

// NON-LINEAR HYDRODYNAMIC VICTORY WAVE TRIGGER (receding_pre -> advancing -> receding_post)
function triggerVictory() {
  isWinning = true;
  winTimer = 0;
  phaseTimer = 0;
  sweepWaveY = oceanWave ? oceanWave.getCurrentWaveY() : 115;
  sweepStartWaveY = sweepWaveY;
  sweepPhase = 'receding_pre';

  // Pronounce character in high-quality real audio voiceover!
  if (activeCharacter) {
    speakCharacter(activeCharacter);
  }

  oldBeachProps = beachProps.map(p => ({ ...p, isFloating: true }));
  beachProps = [];

  const nextItem = getNextCharacter();
  nextChar = typeof nextItem === 'object' ? nextItem.char : nextItem;
  nextLang = typeof nextItem === 'object' ? nextItem.lang : (/[А-Яа-яЁё]/.test(nextChar) ? 'ru' : 'en');
  const hues = [340, 195, 45, 130, 270, 25, 185, 315, 90, 165];
  nextHue = hues[Math.floor(Math.random() * hues.length)];

  // Fully dynamic responsive random position across full beach area (portrait & landscape)
  const pos = getRandomCharacterPosition(width, height);
  nextX = pos.x;
  nextY = pos.y;

  pendingNewProps = generateBeachProps(nextX, nextY);
  playUndertowSound();
}

function updateFullscreenUI() {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    if (isFS) {
      settingsBtn.classList.add('hidden');
    } else {
      settingsBtn.classList.remove('hidden');
    }
  }
}

document.addEventListener('fullscreenchange', updateFullscreenUI);
document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

function toggleFullScreen() {
  const doc = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (doc.requestFullscreen) {
      doc.requestFullscreen().then(updateFullscreenUI).catch(e => {});
    } else if (doc.webkitRequestFullscreen) {
      doc.webkitRequestFullscreen().catch(e => {});
    }
    try { window.scrollTo(0, 1); } catch (e) {}
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(updateFullscreenUI).catch(e => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen().catch(e => {});
    }
  }
  setTimeout(updateFullscreenUI, 100);
}

const fsBtn = document.getElementById('fullscreenBtn');
if (fsBtn) {
  fsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullScreen();
  });
  fsBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullScreen();
  }, { passive: false });
}

function handlePointerDown(x, y, id) {
  initAudio();

  let touch = activeTouches.find(t => t.id === id);
  if (!touch) {
    activeTouches.push({ id, x, y, px: x, py: y });
  } else {
    touch.x = x; touch.y = y; touch.px = x; touch.py = y;
  }
}

// PROCEDURAL JAGGED ORGANIC SAND CONTOUR EROSION BRUSH & FINGER-PUSHED BEACH PROPS PHYSICS
function handlePointerMove(x, y, id) {
  let touch = activeTouches.find(t => t.id === id);
  if (!touch) {
    touch = { id, x, y, px: x, py: y };
    activeTouches.push(touch);
  }

  touch.px = touch.x;
  touch.py = touch.y;
  touch.x = x;
  touch.y = y;

  const pushRadius = 85;
  const touchVx = touch.x - touch.px;
  const touchVy = touch.y - touch.py;

  // Touch Physics & Archeological Excavation for Beach Props
  for (const prop of beachProps) {
    if (prop.isBuried) {
      const dx = prop.x - touch.x;
      const dy = prop.y - touch.y;
      const dist = Math.hypot(dx, dy);
      const excavateRadius = Math.max(80, prop.size * 1.6);
      if (dist < excavateRadius) {
        prop.uncoverProgress = Math.min(1.0, (prop.uncoverProgress || 0) + 0.04);
      }
      continue;
    }

    if (prop.isFloating) continue;
    const dx = prop.x - touch.x;
    const dy = prop.y - touch.y;
    const dist = Math.hypot(dx, dy);

    if (dist < pushRadius && dist > 1) {
      const force = (1.0 - dist / pushRadius) * 2.8;
      const nx = dx / dist;
      const ny = dy / dist;

      prop.vx += nx * force * 1.8 + touchVx * 0.2;
      prop.vy += ny * force * 1.8 + touchVy * 0.2;
      prop.vRotation += (Math.random() - 0.5) * 0.08 * force;

      if (digSynth && Math.random() < 0.2) {
        digSynth.play(0.04);
      }
    }
  }

  const rubRadius = Math.min(width, height) * 0.085;
  dirtCtx.save();
  dirtCtx.globalCompositeOperation = 'destination-out';
  
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const tx = touch.px + (touch.x - touch.px) * (i / steps);
    const ty = touch.py + (touch.y - touch.py) * (i / steps);
    
    const radGrad = dirtCtx.createRadialGradient(tx, ty, rubRadius * 0.15, tx, ty, rubRadius * 1.15);
    radGrad.addColorStop(0, 'rgba(0,0,0,1)');
    radGrad.addColorStop(0.4, 'rgba(0,0,0,0.85)');
    radGrad.addColorStop(0.75, 'rgba(0,0,0,0.4)');
    radGrad.addColorStop(1.0, 'rgba(0,0,0,0)');

    dirtCtx.fillStyle = radGrad;

    dirtCtx.beginPath();
    const points = 18;
    for (let p = 0; p <= points; p++) {
      const angle = (p / points) * Math.PI * 2;
      const noise = Math.sin(angle * 5 + tx * 0.08) * 0.18 + Math.cos(angle * 3 + ty * 0.08) * 0.14 + (Math.random() - 0.5) * 0.16;
      const r = rubRadius * (1.0 + noise);
      const px = tx + Math.cos(angle) * r;
      const py = ty + Math.sin(angle) * r;
      if (p === 0) dirtCtx.moveTo(px, py);
      else dirtCtx.lineTo(px, py);
    }
    dirtCtx.closePath();
    dirtCtx.fill();

    for (let c = 0; c < 3; c++) {
      const cAngle = Math.random() * Math.PI * 2;
      const cDist = rubRadius * (0.8 + Math.random() * 0.35);
      const cx = tx + Math.cos(cAngle) * cDist;
      const cy = ty + Math.sin(cAngle) * cDist;
      const cRadius = rubRadius * (0.2 + Math.random() * 0.25);

      dirtCtx.beginPath();
      for (let p = 0; p <= 10; p++) {
        const a = (p / 10) * Math.PI * 2;
        const n = (Math.random() - 0.5) * 0.35;
        const cr = cRadius * (1.0 + n);
        const cpx = cx + Math.cos(a) * cr;
        const cpy = cy + Math.sin(a) * cr;
        if (p === 0) dirtCtx.moveTo(cpx, cpy);
        else dirtCtx.lineTo(cpx, cpy);
      }
      dirtCtx.closePath();
      dirtCtx.fill();
    }
  }
  dirtCtx.restore();

  if (digSynth && Math.random() < 0.25) {
    digSynth.play(0.06);
  }

  if (activeCharacter && !activeCharacter.isFloating) {
    const dist = Math.hypot(activeCharacter.x - x, activeCharacter.y - y);
    if (dist < 150 && squeakSynth && Math.random() < 0.15) {
      squeakSynth.play(0.08, 180 + Math.random() * 100);
    }
  }
}

function handlePointerUp(id) {
  activeTouches = activeTouches.filter(t => t.id !== id);
}

// Unified HTML5 PointerEvents (Touch, Mouse, Stylus, Trackpad)
canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  handlePointerDown(e.clientX, e.clientY, e.pointerId);
});

canvas.addEventListener('pointermove', e => {
  if (e.buttons > 0 || e.pointerType === 'touch') {
    handlePointerMove(e.clientX, e.clientY, e.pointerId);
  }
});

canvas.addEventListener('pointerup', e => {
  handlePointerUp(e.pointerId);
});

canvas.addEventListener('pointercancel', e => {
  handlePointerUp(e.pointerId);
});

// Fallback Touch & Mouse Listeners
canvas.addEventListener('mousedown', e => handlePointerDown(e.clientX, e.clientY, 'mouse'));
canvas.addEventListener('mousemove', e => { if (e.buttons > 0) handlePointerMove(e.clientX, e.clientY, 'mouse'); });
canvas.addEventListener('mouseup', e => handlePointerUp('mouse'));

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    handlePointerDown(t.clientX, t.clientY, t.identifier);
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    handlePointerMove(t.clientX, t.clientY, t.identifier);
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    handlePointerUp(t.identifier);
  }
}, { passive: false });

// NON-LINEAR HYDRODYNAMIC VICTORY WAVE ENGINE WITH SYNCHRONIZED AUDIO & ORGANIC FLOAT-AWAY PROPS
function update() {
  oceanWave.update(width, height, activeTouches);

  if (activeCharacter) {
    activeCharacter.update(activeTouches);
  }

  // Update Beach Props Physics
  const currentShorelineY = oceanWave ? oceanWave.getCurrentWaveY() : 115;

  for (let i = beachProps.length - 1; i >= 0; i--) {
    const prop = beachProps[i];

    if (prop.isFloating) {
      prop.y -= 2.2;
      prop.x += Math.sin(winTimer * 0.08 + prop.x) * 0.8;
      prop.rotation += prop.vRotation;
      prop.vRotation *= 0.95;

      if (Math.random() < 0.25) {
        particles.push(new Particle(
          prop.x + (Math.random() - 0.5) * prop.size,
          prop.y + (Math.random() - 0.5) * prop.size,
          'foam'
        ));
      }

      if (prop.y < -60) {
        beachProps.splice(i, 1);
      }
    } else {
      if (!prop.isBuried) {
        prop.x += prop.vx;
        prop.y += prop.vy;
        prop.rotation += prop.vRotation;

        prop.vx *= 0.72;
        prop.vy *= 0.72;
        prop.vRotation *= 0.70;

        if (prop.x < 30) { prop.x = 30; prop.vx *= -0.5; }
        if (prop.x > width - 30) { prop.x = width - 30; prop.vx *= -0.5; }
        if (prop.y > height - 60) { prop.y = height - 60; prop.vy *= -0.5; }

        if (prop.type !== 'pebble' && prop.y <= currentShorelineY + 45) {
          prop.isFloating = true;
          prop.vy = -2.2;
          if (splashSynth && Math.random() < 0.6) splashSynth.play();
        }
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update(width, height);
    if (!p.active) particles.splice(i, 1);
  }

  progressCheckTimer++;
  if (progressCheckTimer % 25 === 0) {
    calculateProgress();
  }

  if (isWinning) {
    winTimer++;
    phaseTimer++;

    if (sweepPhase === 'receding_pre') {
      const duration = 30;
      const progress = Math.min(1.0, phaseTimer / duration);
      const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

      const drawbackTargetY = Math.max(35, sweepStartWaveY - 45);
      sweepWaveY = sweepStartWaveY + (drawbackTargetY - sweepStartWaveY) * ease;

      if (progress >= 1.0) {
        sweepPhase = 'advancing';
        sweepStartWaveY = sweepWaveY;
        phaseTimer = 0;

        playWaveRushSound();
      }
    } else if (sweepPhase === 'advancing') {
      const duration = 65;
      const progress = Math.min(1.0, phaseTimer / duration);
      const ease = Math.sin(progress * Math.PI / 2);

      const targetAdvanceY = height * 0.72;
      sweepWaveY = sweepStartWaveY + (targetAdvanceY - sweepStartWaveY) * ease;

      dirtCtx.save();
      dirtCtx.globalCompositeOperation = 'source-over';
      const pat = dirtCtx.createPattern(sandPatternCanvas, 'repeat');
      dirtCtx.fillStyle = pat;

      const time = oceanWave ? oceanWave.waveTime : 0;
      dirtCtx.beginPath();
      dirtCtx.moveTo(0, 0);
      dirtCtx.lineTo(dirtCanvas.width, 0);

      for (let x = dirtCanvas.width; x >= 0; x -= 12) {
        const waveExp = Math.exp(Math.sin(x * 0.012 + time * 1.6) - 1.0);
        const waveNoise = Math.sin(x * 0.032 - time * 0.9) * 8 + Math.cos(x * 0.055 + time * 2.2) * 4;
        const wy = sweepWaveY + waveExp * 44 + waveNoise + 24;
        dirtCtx.lineTo(x, wy);
      }

      dirtCtx.closePath();
      dirtCtx.fill();
      dirtCtx.restore();

      for (let i = pendingNewProps.length - 1; i >= 0; i--) {
        const np = pendingNewProps[i];
        if (np.y <= sweepWaveY + 40) {
          beachProps.push(np);
          pendingNewProps.splice(i, 1);
        }
      }

      if (activeCharacter && sweepWaveY >= activeCharacter.y - 60) {
        activeCharacter.isFloating = true;
        activeCharacter.y += 3.5;
        activeCharacter.scaleX = 1.0 + Math.sin(winTimer * 0.15) * 0.12;
        activeCharacter.scaleY = 1.0 + Math.cos(winTimer * 0.15) * 0.12;
        activeCharacter.vx = Math.sin(winTimer * 0.08) * 1.8;

        if (splashSynth && Math.random() < 0.04) splashSynth.play();
      }

      if (progress >= 1.0) {
        sweepPhase = 'receding_post';
        sweepStartWaveY = sweepWaveY;
        phaseTimer = 0;
      }
    } else if (sweepPhase === 'receding_post') {
      const targetTideY = oceanWave ? oceanWave.getCurrentWaveY() : 115;
      const duration = 55;
      const progress = Math.min(1.0, phaseTimer / duration);
      const ease = progress * progress * (3 - 2 * progress);

      sweepWaveY = sweepStartWaveY + (targetTideY - sweepStartWaveY) * ease;

      dirtCtx.save();
      dirtCtx.globalCompositeOperation = 'source-over';
      dirtCtx.fillStyle = '#e2c598';
      dirtCtx.fillRect(0, 0, dirtCanvas.width, dirtCanvas.height);
      const pat = dirtCtx.createPattern(sandPatternCanvas, 'repeat');
      dirtCtx.fillStyle = pat;
      dirtCtx.fillRect(0, 0, dirtCanvas.width, dirtCanvas.height);
      dirtCtx.restore();

      if (activeCharacter) {
        activeCharacter.y -= 7.5;
        activeCharacter.vx = Math.sin(winTimer * 0.1) * 2.2;
        activeCharacter.vRotation = 0.03;
        activeCharacter.scaleX = 1.0 + Math.sin(winTimer * 0.25) * 0.15;

        if (Math.random() < 0.6) {
          particles.push(new Particle(
            activeCharacter.x + (Math.random() - 0.5) * 90,
            activeCharacter.y + (Math.random() - 0.5) * 40,
            'foam'
          ));
        }
      }

      for (let i = oldBeachProps.length - 1; i >= 0; i--) {
        const prop = oldBeachProps[i];
        prop.y -= 7.0;
      }

      if (progress >= 1.0 && activeCharacter && activeCharacter.y < -180) {
        currentLevelIndex++;
        isWinning = false;
        
        activeCharacter = new ElasticCharacter(nextChar, nextX, nextY, nextHue);
        activeCharacter.lang = nextLang;
        activeCharacter.rotation = (Math.random() - 0.5) * 0.7;
        renderInflatablePoolToy(nextChar, nextHue);

        maskCtx.fillStyle = '#000000';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.save();
        const maskCX = nextX * MASK_SCALE;
        const maskCY = nextY * MASK_SCALE;
        const maskFontSize = 270 * MASK_SCALE;
        maskCtx.translate(maskCX, maskCY);
        maskCtx.rotate(activeCharacter.rotation);
        maskCtx.textAlign = 'center';
        maskCtx.textBaseline = 'middle';
        maskCtx.font = `700 ${maskFontSize}px Fredoka, Rubik, "Arial Rounded MT Bold", sans-serif`;
        maskCtx.fillStyle = '#ffffff';
        maskCtx.fillText(nextChar, 0, 0);
        maskCtx.restore();

        oldBeachProps = [];
        cleanProgress = 0.0;
      }
    }
  }

  draw();
  requestAnimationFrame(update);
}

// ULTRA-HIGH DETAIL 3D ORGANIC BEACH PROP & BURIED RELIC SHADER
function render3DBeachProp(ctx, prop) {
  ctx.save();
  ctx.translate(prop.x, prop.y);
  ctx.rotate(prop.rotation);

  const sz = prop.size;

  // 1. SOFT NATURAL CONTACT SHADOW ON SAND
  const shadowRadiusX = prop.isBuried ? sz * 0.55 : (prop.isFloating ? sz * 0.9 : sz * 0.65);
  const shadowRadiusY = prop.isBuried ? sz * 0.38 : (prop.isFloating ? sz * 0.6 : sz * 0.45);
  const shadowOffsetY = prop.isFloating ? 6 : 2;
  const shadowAlpha = prop.isBuried ? 0.14 : (prop.isFloating ? 0.25 : 0.18);

  const shGrad = ctx.createRadialGradient(1, shadowOffsetY, sz * 0.1, 1, shadowOffsetY, shadowRadiusX * 1.1);
  shGrad.addColorStop(0, prop.isFloating ? `rgba(0, 40, 80, ${shadowAlpha})` : `rgba(45, 25, 10, ${shadowAlpha})`);
  shGrad.addColorStop(0.6, prop.isFloating ? `rgba(0, 40, 80, ${shadowAlpha * 0.4})` : `rgba(45, 25, 10, ${shadowAlpha * 0.4})`);
  shGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.ellipse(1, shadowOffsetY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  if (prop.type === 'pebble') {
    // 2. PHOTOREALISTIC 3D OCEAN PEBBLE / SMOOTH RIVER STONE
    const pGrad = ctx.createRadialGradient(-sz * 0.3, -sz * 0.3, 1, 0, 0, sz * 1.1);
    pGrad.addColorStop(0, '#f2ece4');
    pGrad.addColorStop(0.25, prop.color);
    pGrad.addColorStop(0.7, '#7a6755');
    pGrad.addColorStop(1, '#3b2f24');

    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, sz, sz * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // Granite Speckles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-sz * 0.4, -sz * 0.2, 1.5, 1.5);
    ctx.fillRect(sz * 0.3, sz * 0.1, 1.5, 1.5);

    // Specular Glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-sz * 0.35, -sz * 0.28, sz * 0.32, sz * 0.16, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

  } else if (prop.type === 'shell') {
    // 3. PHOTOREALISTIC 3D SCALLOP SEASHELL
    const sGrad = ctx.createRadialGradient(-sz * 0.2, -sz * 0.4, 2, 0, 0, sz * 1.2);
    sGrad.addColorStop(0, '#ffffff');
    sGrad.addColorStop(0.35, prop.color);
    sGrad.addColorStop(0.75, '#cba587');
    sGrad.addColorStop(1, '#6e4a33');

    ctx.fillStyle = sGrad;

    ctx.beginPath();
    ctx.moveTo(-sz * 0.4, sz * 0.65);
    ctx.lineTo(sz * 0.4, sz * 0.65);
    ctx.lineTo(sz * 0.52, sz * 0.82);
    ctx.lineTo(-sz * 0.52, sz * 0.82);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-sz * 0.35, sz * 0.65);
    ctx.bezierCurveTo(-sz * 1.15, sz * 0.15, -sz * 1.05, -sz * 0.75, -sz * 0.6, -sz * 0.95);

    const ribsCount = 9;
    for (let r = 0; r <= ribsCount; r++) {
      const angle = -0.6 + (r / ribsCount) * 1.2;
      const rx = Math.sin(angle) * (sz * (1.0 + (r % 2 === 0 ? 0.05 : 0)));
      const ry = -Math.cos(angle) * (sz * (0.95 + (r % 2 === 0 ? 0.05 : 0)));
      ctx.lineTo(rx, ry);
    }

    ctx.bezierCurveTo(sz * 1.05, -sz * 0.75, sz * 1.15, sz * 0.15, sz * 0.35, sz * 0.65);
    ctx.closePath();
    ctx.fill();

    for (let r = 0; r < ribsCount; r++) {
      const a1 = -0.55 + (r / ribsCount) * 1.1;
      const a2 = -0.55 + ((r + 0.5) / ribsCount) * 1.1;

      ctx.strokeStyle = 'rgba(55, 25, 10, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, sz * 0.65);
      ctx.quadraticCurveTo(Math.sin(a1) * sz * 0.5, -Math.cos(a1) * sz * 0.5, Math.sin(a1) * sz * 0.96, -Math.cos(a1) * sz * 0.96);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, sz * 0.65);
      ctx.quadraticCurveTo(Math.sin(a2) * sz * 0.5, -Math.cos(a2) * sz * 0.5, Math.sin(a2) * sz * 0.96, -Math.cos(a2) * sz * 0.96);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 240, 220, 0.35)';
    ctx.lineWidth = 1.2;
    for (let ring = 0.35; ring <= 0.85; ring += 0.22) {
      ctx.beginPath();
      ctx.arc(0, sz * 0.65, sz * ring, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-sz * 0.2, -sz * 0.55, sz * 0.35, sz * 0.14, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

  } else if (prop.type === 'spiral_shell') {
    // 4. PHOTOREALISTIC 3D SPIRAL CONE SEASHELL
    const spGrad = ctx.createLinearGradient(-sz * 0.4, -sz * 0.8, sz * 0.4, sz * 0.8);
    spGrad.addColorStop(0, '#ffffff');
    spGrad.addColorStop(0.3, prop.color);
    spGrad.addColorStop(0.7, '#b8860b');
    spGrad.addColorStop(1, '#4a2c11');

    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.45, sz * 0.7);
    ctx.bezierCurveTo(-sz * 0.6, sz * 0.2, -sz * 0.35, -sz * 0.5, 0, -sz * 1.15);
    ctx.bezierCurveTo(sz * 0.35, -sz * 0.5, sz * 0.6, sz * 0.2, sz * 0.45, sz * 0.7);
    ctx.closePath();
    ctx.fill();

    const whorls = 6;
    for (let w = 0; w < whorls; w++) {
      const wy = sz * (0.6 - (w / whorls) * 1.6);
      const wRadiusX = sz * (0.45 * (1.0 - w / (whorls + 1)));
      const wRadiusY = sz * 0.12;

      ctx.strokeStyle = 'rgba(60, 30, 10, 0.5)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, wy, wRadiusX, wRadiusY, -Math.PI / 8, 0, Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(-2, wy - 2, wRadiusX * 0.9, wRadiusY * 0.8, -Math.PI / 8, 0, Math.PI);
      ctx.stroke();
    }

    const apGrad = ctx.createRadialGradient(-sz * 0.1, sz * 0.55, 1, 0, sz * 0.55, sz * 0.35);
    apGrad.addColorStop(0, '#ffeedd');
    apGrad.addColorStop(0.6, '#d4a373');
    apGrad.addColorStop(1, '#582f0e');
    ctx.fillStyle = apGrad;
    ctx.beginPath();
    ctx.ellipse(0, sz * 0.6, sz * 0.38, sz * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (prop.type === 'starfish') {
    // 5. PHOTOREALISTIC 3D ORGANIC MEDITERRANEAN STARFISH
    const sfGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, sz * 1.15);
    sfGrad.addColorStop(0, '#ffffff');
    sfGrad.addColorStop(0.2, prop.color);
    sfGrad.addColorStop(0.75, '#b83b48');
    sfGrad.addColorStop(1, '#52141f');

    ctx.fillStyle = sfGrad;
    ctx.beginPath();
    const arms = 5;
    for (let i = 0; i < arms; i++) {
      const tipAngle = (i * 72 - 90) * Math.PI / 180;
      const nextTipAngle = ((i + 1) * 72 - 90) * Math.PI / 180;
      const innerAngle = ((i + 0.5) * 72 - 90) * Math.PI / 180;

      const tipX = Math.cos(tipAngle) * sz;
      const tipY = Math.sin(tipAngle) * sz;
      const innerX = Math.cos(innerAngle) * (sz * 0.34);
      const innerY = Math.sin(innerAngle) * (sz * 0.34);

      if (i === 0) ctx.moveTo(tipX, tipY);
      ctx.quadraticCurveTo(Math.cos(tipAngle + 0.25) * (sz * 0.62), Math.sin(tipAngle + 0.25) * (sz * 0.62), innerX, innerY);
      ctx.quadraticCurveTo(Math.cos(nextTipAngle - 0.25) * (sz * 0.62), Math.sin(nextTipAngle - 0.25) * (sz * 0.62), Math.cos(nextTipAngle) * sz, Math.sin(nextTipAngle) * sz);
    }
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (sz * 0.85), Math.sin(angle) * (sz * 0.85));
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 245, 230, 0.9)';
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      for (let r = 0.25; r <= 0.82; r += 0.18) {
        const dotX = Math.cos(angle) * (sz * r);
        const dotY = Math.sin(angle) * (sz * r);
        const dotR = 1.8 * (1.1 - r * 0.5);

        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

  } else if (prop.type === 'crab') {
    // 6. ULTRA-RARE 3D MEDITERRANEAN BEACH CRAB
    const cGrad = ctx.createRadialGradient(-sz * 0.2, -sz * 0.2, 1, 0, 0, sz * 1.1);
    cGrad.addColorStop(0, '#ffa468');
    cGrad.addColorStop(0.4, prop.color);
    cGrad.addColorStop(0.8, '#b83828');
    cGrad.addColorStop(1, '#5e150b');

    ctx.fillStyle = cGrad;

    ctx.strokeStyle = '#8a2418';
    ctx.lineWidth = 3.0;
    for (let side = -1; side <= 1; side += 2) {
      for (let leg = -0.5; leg <= 0.5; leg += 0.35) {
        ctx.beginPath();
        ctx.moveTo(side * (sz * 0.45), leg * (sz * 0.4));
        ctx.quadraticCurveTo(side * (sz * 0.95), leg * (sz * 0.7), side * (sz * 0.85), leg * (sz * 1.05));
        ctx.stroke();
      }
    }

    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.translate(side * (sz * 0.55), -sz * 0.55);
      ctx.rotate(side * Math.PI / 4);

      const clawGrad = ctx.createRadialGradient(-4, -4, 1, 0, 0, sz * 0.6);
      clawGrad.addColorStop(0, '#ffa468');
      clawGrad.addColorStop(0.5, '#d9402b');
      clawGrad.addColorStop(1, '#66160b');
      ctx.fillStyle = clawGrad;

      ctx.beginPath();
      ctx.ellipse(0, 0, sz * 0.35, sz * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffdfc4';
      ctx.beginPath();
      ctx.ellipse(side * 3, -6, sz * 0.12, sz * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 0.68, sz * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -sz * 0.1, sz * 0.35, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();

  } else if (prop.type === 'bottle') {
    // 7. ULTRA-HIGH DETAIL 3D GLASS PIRATE BOTTLE WITH PARCHMENT SCROLL & RIBBON
    const bGrad = ctx.createLinearGradient(-sz * 0.35, 0, sz * 0.35, 0);
    bGrad.addColorStop(0, 'rgba(230, 250, 245, 0.96)');
    bGrad.addColorStop(0.35, 'rgba(100, 215, 185, 0.82)');
    bGrad.addColorStop(0.75, 'rgba(40, 145, 120, 0.88)');
    bGrad.addColorStop(1, 'rgba(15, 75, 55, 0.95)');

    ctx.fillStyle = bGrad;

    // Tapered Glass Bottle Chamber
    ctx.beginPath();
    ctx.roundRect(-sz * 0.32, -sz * 0.22, sz * 0.64, sz * 0.95, 14);
    ctx.fill();

    // Bottle Neck & Molded Lip Rim
    ctx.fillRect(-sz * 0.14, -sz * 0.62, sz * 0.28, sz * 0.44);
    ctx.fillRect(-sz * 0.18, -sz * 0.68, sz * 0.36, sz * 0.09);

    // Natural Cork Stopper with Cork Texture Lines
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(-sz * 0.12, -sz * 0.78, sz * 0.24, sz * 0.12);
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-sz * 0.12, -sz * 0.78, sz * 0.24, sz * 0.12);

    // Parchment Message Scroll Inside Bottle
    ctx.fillStyle = '#f4e2d8';
    ctx.beginPath();
    ctx.roundRect(-sz * 0.22, -sz * 0.08, sz * 0.44, sz * 0.66, 6);
    ctx.fill();

    // Red Tied Ribbon String & Wax Seal
    ctx.strokeStyle = '#d90429';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.22, sz * 0.2);
    ctx.lineTo(sz * 0.22, sz * 0.2);
    ctx.stroke();

    ctx.fillStyle = '#9e2a2b'; // Red Wax Seal
    ctx.beginPath();
    ctx.arc(0, sz * 0.2, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Curved Specular Glass Glint Streak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillRect(-sz * 0.24, -sz * 0.18, sz * 0.07, sz * 0.82);

  } else if (prop.type === 'boot') {
    // 8. ULTRA-HIGH DETAIL 3D OLD SUNKEN SAILOR LEATHER BOOT
    const bootGrad = ctx.createLinearGradient(-sz * 0.45, -sz * 0.6, sz * 0.45, sz * 0.6);
    bootGrad.addColorStop(0, '#6c4a38');
    bootGrad.addColorStop(0.4, '#432818');
    bootGrad.addColorStop(0.85, '#220f06');
    bootGrad.addColorStop(1, '#0f0500');

    ctx.fillStyle = bootGrad;

    // Boot Shaft & Foot Contour
    ctx.beginPath();
    ctx.moveTo(-sz * 0.28, -sz * 0.68);
    ctx.lineTo(sz * 0.18, -sz * 0.68);
    ctx.lineTo(sz * 0.18, 0);
    ctx.quadraticCurveTo(sz * 0.72, sz * 0.22, sz * 0.62, sz * 0.52);
    ctx.lineTo(-sz * 0.38, sz * 0.52);
    ctx.lineTo(-sz * 0.38, -sz * 0.68);
    ctx.closePath();
    ctx.fill();

    // Double Leather Stitching Seam Lines
    ctx.strokeStyle = 'rgba(255, 220, 180, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(-sz * 0.22, -sz * 0.62);
    ctx.lineTo(-sz * 0.22, 0);
    ctx.quadraticCurveTo(sz * 0.55, sz * 0.18, sz * 0.5, sz * 0.45);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Treaded Rubber Sole
    ctx.fillStyle = '#140802';
    ctx.fillRect(-sz * 0.42, sz * 0.44, sz * 1.05, sz * 0.14);

    // Brass Eyelets & Crossed Laces
    ctx.fillStyle = '#e9c46a';
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 1.5;
    for (let eye = -0.52; eye <= -0.08; eye += 0.14) {
      ctx.beginPath();
      ctx.arc(sz * 0.08, sz * eye, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (prop.type === 'fish_skeleton') {
    // 9. ULTRA-HIGH DETAIL 3D PREHISTORIC FISH SKELETON / FOSSIL BONES
    ctx.strokeStyle = '#fffbe6';
    ctx.fillStyle = '#fffbe6';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';

    // Backbone Spine Line
    ctx.beginPath();
    ctx.moveTo(-sz * 0.65, 0);
    ctx.lineTo(sz * 0.48, 0);
    ctx.stroke();

    // Anatomical Fish Skull with Teeth
    ctx.beginPath();
    ctx.moveTo(sz * 0.48, -sz * 0.24);
    ctx.lineTo(sz * 0.76, -sz * 0.05);
    ctx.lineTo(sz * 0.68, sz * 0.08); // Lower jaw
    ctx.lineTo(sz * 0.48, sz * 0.24);
    ctx.closePath();
    ctx.fill();

    // Orbital Eye Socket Hole
    ctx.fillStyle = '#2b1e16';
    ctx.beginPath();
    ctx.arc(sz * 0.58, -sz * 0.08, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 9 Curved Vertebral Rib Pairs
    ctx.strokeStyle = '#fffbe6';
    ctx.lineWidth = 2.2;
    for (let r = -0.5; r <= 0.32; r += 0.11) {
      const ribHeight = sz * (0.38 - Math.abs(r) * 0.32);
      ctx.beginPath();
      ctx.moveTo(sz * r, -ribHeight);
      ctx.lineTo(sz * r, ribHeight);
      ctx.stroke();
    }

    // Fin Ray Bones (Dorsal & Tail Fin)
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.65, 0);
    ctx.lineTo(-sz * 0.85, -sz * 0.4);
    ctx.moveTo(-sz * 0.65, 0);
    ctx.lineTo(-sz * 0.9, 0);
    ctx.moveTo(-sz * 0.65, 0);
    ctx.lineTo(-sz * 0.85, sz * 0.4);
    ctx.stroke();

  } else if (prop.type === 'anchor') {
    // 10. ULTRA-HIGH DETAIL 3D CAST-IRON ANCHOR WITH COILED HEMP ROPE!
    const aGrad = ctx.createLinearGradient(-sz * 0.45, -sz * 0.65, sz * 0.45, sz * 0.65);
    aGrad.addColorStop(0, '#7f8c8d');
    aGrad.addColorStop(0.4, '#34495e');
    aGrad.addColorStop(0.85, '#2c3e50');
    aGrad.addColorStop(1, '#1a252f');

    ctx.strokeStyle = aGrad;
    ctx.fillStyle = aGrad;
    ctx.lineWidth = 5.2;
    ctx.lineCap = 'round';

    // Central Shank
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.62);
    ctx.lineTo(0, sz * 0.68);
    ctx.stroke();

    // Top Ring Shackle
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, -sz * 0.75, sz * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Crossbar Stock
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(-sz * 0.42, -sz * 0.48);
    ctx.lineTo(sz * 0.42, -sz * 0.48);
    ctx.stroke();

    // COILED HEMP ROPE WRAPPED AROUND ANCHOR SHANK!
    ctx.strokeStyle = '#d4a373'; // Hemp Rope
    ctx.lineWidth = 2.8;
    for (let coil = -0.3; coil <= 0.1; coil += 0.15) {
      ctx.beginPath();
      ctx.ellipse(0, sz * coil, 6.5, 3.5, Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Curved Arms & Triangular Flukes
    ctx.strokeStyle = aGrad;
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(0, sz * 0.38, sz * 0.48, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(side * (sz * 0.45), sz * 0.52);
      ctx.lineTo(side * (sz * 0.62), sz * 0.28);
      ctx.lineTo(side * (sz * 0.35), sz * 0.32);
      ctx.closePath();
      ctx.fill();
    }

  } else if (prop.type === 'treasure') {
    // 11. ULTRA-HIGH DETAIL 3D GOLDEN PIRATE TREASURE CHEST (COINS, RUBIES & EMERALDS!)
    const chestGrad = ctx.createLinearGradient(-sz * 0.45, 0, sz * 0.45, 0);
    chestGrad.addColorStop(0, '#a66a38');
    chestGrad.addColorStop(0.5, '#7f4f24');
    chestGrad.addColorStop(1, '#583101');

    ctx.fillStyle = chestGrad;

    // Main Wooden Chest Body
    ctx.beginPath();
    ctx.roundRect(-sz * 0.48, -sz * 0.08, sz * 0.96, sz * 0.62, 7);
    ctx.fill();

    // 3D Wooden Plank Seams
    ctx.strokeStyle = 'rgba(40, 20, 5, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-sz * 0.48, sz * 0.12, sz * 0.96, 0.1);
    ctx.strokeRect(-sz * 0.48, sz * 0.32, sz * 0.96, 0.1);

    // Vaulted Lid
    const lidGrad = ctx.createRadialGradient(0, -sz * 0.22, 1, 0, 0, sz * 0.65);
    lidGrad.addColorStop(0, '#e6b89c');
    lidGrad.addColorStop(0.6, '#b07d62');
    lidGrad.addColorStop(1, '#7f4f24');
    ctx.fillStyle = lidGrad;

    ctx.beginPath();
    ctx.ellipse(0, -sz * 0.08, sz * 0.48, sz * 0.3, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Iron Straps & Rivets
    ctx.fillStyle = '#212529';
    ctx.fillRect(-sz * 0.48, -sz * 0.08, sz * 0.1, sz * 0.62);
    ctx.fillRect(sz * 0.38, -sz * 0.08, sz * 0.1, sz * 0.62);
    ctx.fillRect(-sz * 0.07, -sz * 0.08, sz * 0.14, sz * 0.62);

    // Rivet Head Bolts
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(-sz * 0.44, sz * 0.02, 2.2, 2.2);
    ctx.fillRect(sz * 0.42, sz * 0.02, 2.2, 2.2);
    ctx.fillRect(-sz * 0.44, sz * 0.38, 2.2, 2.2);
    ctx.fillRect(sz * 0.42, sz * 0.38, 2.2, 2.2);

    // Overflowing Shiny Gold Coins
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(-sz * 0.18, -sz * 0.12, 4.0, 0, Math.PI * 2);
    ctx.arc(sz * 0.15, -sz * 0.15, 3.8, 0, Math.PI * 2);
    ctx.arc(-sz * 0.05, -sz * 0.18, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Ruby & Emerald Gemstones
    ctx.fillStyle = '#d90429'; // Red Ruby
    ctx.beginPath();
    ctx.arc(sz * 0.02, -sz * 0.14, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38b000'; // Green Emerald
    ctx.beginPath();
    ctx.arc(-sz * 0.28, -sz * 0.06, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Keyhole Lock Escutcheon Plate
    ctx.fillStyle = '#e9c46a';
    ctx.beginPath();
    ctx.arc(0, sz * 0.2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillRect(-1.4, sz * 0.2, 2.8, 5.0);
  }

  ctx.restore();
}

// Render Main Canvas Pass
function draw() {
  // 1. UNDERLYING SEABED: SHARES SAME DETAILED SAND PATTERN + SLIGHT DARKENING & SOFT DEPTH SHADOW!
  const pat = ctx.createPattern(sandPatternCanvas, 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, width, height);

  // Dynamic Wet Sand Saturation Tint (under shallow water)
  ctx.fillStyle = 'rgba(75, 52, 30, 0.28)';
  ctx.fillRect(0, 0, width, height);

  // Soft Depth Shadow Overlay
  ctx.fillStyle = 'rgba(0, 15, 30, 0.08)';
  ctx.fillRect(0, 0, width, height);

  // Dynamic Wet Sand Water Absorption Sheen Reflection Film
  const wetSheen = ctx.createLinearGradient(0, 60, 0, 260);
  wetSheen.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
  wetSheen.addColorStop(0.6, 'rgba(255, 255, 255, 0.12)');
  wetSheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = wetSheen;
  ctx.fillRect(0, 60, width, 200);

  // 2. GROUNDED CHARACTER (under sand layer)
  if (activeCharacter && !activeCharacter.isFloating) {
    ctx.save();
    ctx.translate(activeCharacter.x, activeCharacter.y);
    ctx.rotate(activeCharacter.rotation);
    ctx.scale(activeCharacter.scaleX, activeCharacter.scaleY);

    ctx.shadowColor = 'rgba(70, 45, 25, 0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 18;
    ctx.shadowOffsetY = 24;
    ctx.drawImage(tileCanvas, -TILE_SIZE / 2, -TILE_SIZE / 2);

    ctx.shadowColor = 'rgba(35, 18, 5, 0.75)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
    ctx.drawImage(tileCanvas, -TILE_SIZE / 2, -TILE_SIZE / 2);

    ctx.restore();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw Inflatable Vinyl Pool Toy Character (Grounded under sand)
    ctx.save();
    ctx.translate(activeCharacter.x, activeCharacter.y);
    ctx.rotate(activeCharacter.rotation);
    ctx.scale(activeCharacter.scaleX, activeCharacter.scaleY);

    ctx.drawImage(tileCanvas, -TILE_SIZE / 2, -TILE_SIZE / 2);

    // LOCALIZED VINYL DENT DEPRESSION & STRETCHED TENSION HIGHLIGHT
    if (activeCharacter.dentDepth > 0.05) {
      ctx.save();
      const dx = activeCharacter.dentX;
      const dy = activeCharacter.dentY;
      const depth = activeCharacter.dentDepth;

      const dentGrad = ctx.createRadialGradient(dx, dy, 2, dx, dy, 42 * depth);
      dentGrad.addColorStop(0, `rgba(0, 0, 0, ${0.38 * depth})`);
      dentGrad.addColorStop(0.6, `rgba(40, 10, 0, ${0.18 * depth})`);
      dentGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dentGrad;
      ctx.beginPath();
      ctx.arc(dx, dy, 42 * depth, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * depth})`;
      ctx.lineWidth = 4 * depth;
      ctx.beginPath();
      ctx.arc(dx, dy, 36 * depth, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // 3. DRAW BURIED ARTIFACTS / RELICS (REQUIRE SUSTAINED EXCAVATION RUBBING TO REVEAL)
  for (const prop of beachProps) {
    if (prop.isBuried) {
      const prog = prop.uncoverProgress || 0;
      if (prog > 0.05) {
        const artifactAlpha = Math.min(1.0, (prog - 0.05) / 0.40);

        ctx.save();
        ctx.globalAlpha = artifactAlpha;
        render3DBeachProp(ctx, prop);
        ctx.restore();
      }
    }
  }

  // 4. Draw Particles (Foam only)
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. DRAW TOP COVERING SAND LAYER (dirtCanvas)
  ctx.save();
  
  // Layer A: Outer Sunlit Golden Sand Ridge Crest (Яркий Золотистый Гребень Песчаного Вала)
  ctx.shadowColor = 'rgba(255, 245, 200, 0.98)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(dirtCanvas, 0, 0);

  // Layer B: Deep Inner Slope Shadow Wall (Контрастная Темная Тень Склона Вала)
  ctx.shadowColor = 'rgba(40, 18, 5, 0.95)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = -12;
  ctx.shadowOffsetY = -12;
  ctx.drawImage(dirtCanvas, 0, 0);

  // Layer C: Warm Sand Berm Elevation Lip Mass (Масса и Высота Насыпанного Вала)
  ctx.shadowColor = 'rgba(140, 95, 45, 0.85)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(dirtCanvas, 0, 0);

  // Layer D: Base Sand Fill
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  dirtCtx.save();
  dirtCtx.restore();
  ctx.drawImage(dirtCanvas, 0, 0);

  ctx.restore();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 5.2 DRAW GROUNDED SURFACE 3D BEACH PROPS ON TOP OF THE SAND LAYER!
  for (const prop of beachProps) {
    if (!prop.isBuried) {
      render3DBeachProp(ctx, prop);
    }
  }

  // 5.4 DRAW OLD FLOATING 3D BEACH PROPS (FLOATING AWAY WITH RECEDING WAVE)
  for (const prop of oldBeachProps) {
    render3DBeachProp(ctx, prop);
  }

  // 5.5 DRAW FLOATING BUOYANT CHARACTER (WHEN isFloating === true)
  if (activeCharacter && activeCharacter.isFloating) {
    ctx.save();
    ctx.translate(activeCharacter.x, activeCharacter.y);
    ctx.rotate(activeCharacter.rotation);
    ctx.scale(activeCharacter.scaleX, activeCharacter.scaleY);

    ctx.shadowColor = 'rgba(0, 50, 90, 0.55)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 12;

    ctx.drawImage(tileCanvas, -TILE_SIZE / 2, -TILE_SIZE / 2);
    ctx.restore();
  }

  // 6. SINGLE UNIFIED OCEAN SURF PASS (WITH RARE SWIMMING FISH, JELLYFISH, OCTOPUSES & STINGRAYS)
  oceanWave.draw(ctx, width, height, isWinning, sweepWaveY, winTimer);

  // 8. Cinematic Lens Vignette Pass
  const vigGrad = ctx.createRadialGradient(width/2, height/2, Math.max(width, height)*0.4, width/2, height/2, Math.max(width, height)*0.75);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, 'rgba(0,10,20,0.32)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);
}

// SETTINGS MODAL UI HANDLER
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingsModal = document.getElementById('settingsModal');

const chkRussianDigits = document.getElementById('chkRussianDigits');
const chkEnglishDigits = document.getElementById('chkEnglishDigits');
const chkRussian = document.getElementById('chkRussian');
const chkEnglish = document.getElementById('chkEnglish');
const chkShuffle = document.getElementById('chkShuffle');

function syncCheckboxesFromSettings() {
  if (chkRussianDigits) chkRussianDigits.checked = settings.includeRussianDigits;
  if (chkEnglishDigits) chkEnglishDigits.checked = settings.includeEnglishDigits;
  if (chkRussian) chkRussian.checked = settings.includeRussian;
  if (chkEnglish) chkEnglish.checked = settings.includeEnglish;
  if (chkShuffle) chkShuffle.checked = settings.isShuffle;
}

function updateSettingsFromCheckboxes() {
  settings.includeRussianDigits = chkRussianDigits ? chkRussianDigits.checked : true;
  settings.includeEnglishDigits = chkEnglishDigits ? chkEnglishDigits.checked : true;
  settings.includeRussian = chkRussian ? chkRussian.checked : true;
  settings.includeEnglish = chkEnglish ? chkEnglish.checked : true;
  settings.isShuffle = chkShuffle ? chkShuffle.checked : true;

  if (!settings.includeRussianDigits && !settings.includeEnglishDigits && !settings.includeRussian && !settings.includeEnglish) {
    settings.includeRussianDigits = true;
    if (chkRussianDigits) chkRussianDigits.checked = true;
  }

  saveSettings();
}

if (settingsBtn) {
  const openSettings = (e) => {
    e.preventDefault();
    e.stopPropagation();
    syncCheckboxesFromSettings();
    if (settingsModal) settingsModal.classList.remove('hidden');
  };
  settingsBtn.addEventListener('click', openSettings);
  settingsBtn.addEventListener('touchstart', openSettings, { passive: false });
}

if (closeSettingsBtn) {
  const closeSettings = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (settingsModal) settingsModal.classList.add('hidden');
  };
  closeSettingsBtn.addEventListener('click', closeSettings);
  closeSettingsBtn.addEventListener('touchstart', closeSettings, { passive: false });
}

if (saveSettingsBtn) {
  const saveSettingsHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateSettingsFromCheckboxes();
    if (settingsModal) settingsModal.classList.add('hidden');
  };
  saveSettingsBtn.addEventListener('click', saveSettingsHandler);
  saveSettingsBtn.addEventListener('touchstart', saveSettingsHandler, { passive: false });
}

// Start Game
initLevel();
update();
