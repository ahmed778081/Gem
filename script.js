// === INISIALISASI DASAR ===
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const themeSelector = document.getElementById('themeSelector');
const btnPlay = document.getElementById('btnPlay');
const preGameAreaDiv = document.getElementById('preGameArea');
const gameControlsDiv = document.getElementById('gameControls');
const playerNameInput = document.getElementById('playerNameInput');
const leaderboardListEl = document.getElementById('leaderboardList');

console.log("Elemen Dasar Dimuat:", { canvas, context, themeSelector, btnPlay, preGameAreaDiv, gameControlsDiv, playerNameInput, leaderboardListEl }); // DEBUG

const tileSize = 20;
const tileCountX = 20;
const tileCountY = 20;
canvas.width = tileSize * tileCountX;
canvas.height = tileSize * tileCountY;

// === PENGATURAN TEMA WARNA ===
const themes = {
    default: { background: '#DDDDDD', snakeHead: 'darkgreen', snakeBody: 'green', food: 'red', bonusFood: 'gold', obstacle: '#808080', text: 'black', pauseOverlay: 'rgba(0,0,0,0.5)', pauseText: 'white' },
    dark: { background: '#1E1E1E', snakeHead: '#33CC33', snakeBody: '#228B22', food: '#FF6347', bonusFood: '#FFD700', obstacle: '#555555', text: '#E0E0E0', pauseOverlay: 'rgba(50,50,50,0.6)', pauseText: '#FFFFFF' },
    retro: { background: '#000000', snakeHead: '#00FF00', snakeBody: '#00AA00', food: '#FF0000', bonusFood: '#FFFF00', obstacle: '#0000FF', text: '#FFFFFF', pauseOverlay: 'rgba(0,0,100,0.5)', pauseText: '#FFFF00' },
    ocean: { background: '#87CEEB', snakeHead: '#008000', snakeBody: '#2E8B57', food: '#FF4500', bonusFood: '#FFD700', obstacle: '#A0522D', text: '#000080', pauseOverlay: 'rgba(0,0,139,0.5)', pauseText: '#FFFFFF' }
};
let currentTheme;

// === INISIALISASI AUDIO ===
let audioContext; try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.warn('Web Audio API is not supported'); audioContext = null; }
function playEatFoodSound() { if(!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.type='sine';o.frequency.setValueAtTime(600,audioContext.currentTime);g.gain.setValueAtTime(0.1,audioContext.currentTime);o.start();o.stop(audioContext.currentTime+0.075); }
function playBonusFoodSound() { if(!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.type='triangle';o.frequency.setValueAtTime(900,audioContext.currentTime);g.gain.setValueAtTime(0.12,audioContext.currentTime);o.start();g.gain.exponentialRampToValueAtTime(0.00001,audioContext.currentTime+0.2);o.stop(audioContext.currentTime+0.2); }
function playCrashSound() { if(!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.type='sawtooth';o.frequency.setValueAtTime(120,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(60,audioContext.currentTime+0.15);g.gain.setValueAtTime(0.15,audioContext.currentTime);o.start();o.stop(audioContext.currentTime+0.15); }

// === DEFINISI LEVEL & STATE ===
const allLevelObstacles = [
    [{x:5,y:5},{x:6,y:5},{x:7,y:5},{x:12,y:14},{x:13,y:14},{x:14,y:14}],
    [{x:3,y:3},{x:4,y:3},{x:5,y:3},{x:6,y:3},{x:7,y:3},{x:tileCountX-4,y:tileCountY-4},{x:tileCountX-5,y:tileCountY-4},{x:tileCountX-6,y:tileCountY-4},{x:tileCountX-7,y:tileCountY-4},{x:tileCountX-8,y:tileCountY-4},{x:Math.floor(tileCountX/2),y:7},{x:Math.floor(tileCountX/2),y:8},{x:Math.floor(tileCountX/2),y:10}],
    [...Array.from({length:tileCountX},(_,i)=>({x:i,y:0})),...Array.from({length:tileCountX},(_,i)=>({x:i,y:tileCountY-1})),...Array.from({length:tileCountY-2},(_,i)=>({x:0,y:i+1})),...Array.from({length:tileCountY-2},(_,i)=>({x:tileCountX-1,y:i+1})),{x:5,y:Math.floor(tileCountY/2)},{x:6,y:Math.floor(tileCountY/2)},{x:tileCountX-6,y:Math.floor(tileCountY/2)-1},{x:tileCountX-7,y:Math.floor(tileCountY/2)-1}],
    [{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)-2},{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)-1},{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)+1},{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)+2},{x:Math.floor(tileCountX/2)-2,y:Math.floor(tileCountY/2)},{x:Math.floor(tileCountX/2)-1,y:Math.floor(tileCountY/2)},{x:Math.floor(tileCountX/2)+1,y:Math.floor(tileCountY/2)},{x:Math.floor(tileCountX/2)+2,y:Math.floor(tileCountY/2)}],
    [...Array.from({length:tileCountX-6},(_,i)=>({x:3+i,y:4})),...Array.from({length:tileCountX-6},(_,i)=>({x:3+i,y:tileCountY-5})),{x:Math.floor(tileCountX/2),y:7},{x:Math.floor(tileCountX/2),y:8},{x:Math.floor(tileCountX/2),y:tileCountY-9},{x:Math.floor(tileCountX/2),y:tileCountY-8}],
    [{x:3,y:3},{x:4,y:3},{x:3,y:4},{x:4,y:4},{x:tileCountX-5,y:3},{x:tileCountX-4,y:3},{x:tileCountX-5,y:4},{x:tileCountX-4,y:4},{x:3,y:tileCountY-5},{x:4,y:tileCountY-5},{x:3,y:tileCountY-4},{x:4,y:tileCountY-4},{x:tileCountX-5,y:tileCountY-5},{x:tileCountX-4,y:tileCountY-5},{x:tileCountX-5,y:tileCountY-4},{x:tileCountX-4,y:tileCountY-4},{x:Math.floor(tileCountX/2)-1,y:Math.floor(tileCountY/2)},{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)}]
];
let headX, headY, snakeParts, velocityX, velocityY, foodX, foodY, score;
let gameIntervalId = null; let obstacles = []; let currentLevel; let currentSpeed;
const initialSpeed = 7; const speedIncrementPerLevel = 1; const pointsPerLevel = 50; let nextLevelScoreThreshold;
let bonusFoodX, bonusFoodY; let bonusFoodActive = false; let bonusFoodTimer = 0;
const BONUS_FOOD_DURATION = 100; const BONUS_FOOD_SCORE = 50; const BONUS_FOOD_SPAWN_CHANCE = 0.25;
let isPaused = false;
const btnPauseResume = document.getElementById('btnPauseResume');
const btnResetHighScore = document.getElementById('btnResetHighScore');
const MAX_SPAWN_FOOD_ATTEMPTS = 500;
let currentPlayerName = "Pemain";

// === LEADERBOARD LOGIC ===
const LEADERBOARD_KEY = 'snakeGameLeaderboard'; const MAX_LEADERBOARD_ENTRIES = 5; let leaderboard = [];
function loadLeaderboard() { const s=localStorage.getItem(LEADERBOARD_KEY);leaderboard=s?JSON.parse(s):[];console.log("Leaderboard dimuat:",leaderboard)}
function saveLeaderboard() { localStorage.setItem(LEADERBOARD_KEY,JSON.stringify(leaderboard));console.log("Leaderboard disimpan:",leaderboard)}
function addScoreToLeaderboard(name, newScore) {
    let scoreActuallyAddedOrUpdated = false;
    const existingPlayerIndex = leaderboard.findIndex(entry => entry.name === name);
    if (existingPlayerIndex !== -1) {
        if (newScore > leaderboard[existingPlayerIndex].score) {
            leaderboard[existingPlayerIndex].score = newScore;
            scoreActuallyAddedOrUpdated = true;
        }
    } else {
        if (leaderboard.length < MAX_LEADERBOARD_ENTRIES || newScore > (leaderboard[MAX_LEADERBOARD_ENTRIES - 1]?.score || 0)) {
            leaderboard.push({ name: name, score: newScore });
            scoreActuallyAddedOrUpdated = true;
        }
    }
    if (scoreActuallyAddedOrUpdated) {
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
        saveLeaderboard();
        displayLeaderboard();
        return true;
    }
    return false;
}
function displayLeaderboard() { if(!leaderboardListEl){console.error("leaderboardListEl tidak ditemukan!");return}leaderboardListEl.innerHTML='';if(0===leaderboard.length)leaderboardListEl.innerHTML='<li style="text-align:center; color: #777;"><i>Belum ada skor tertinggi!</i></li>';else leaderboard.forEach((e,t)=>{const n=document.createElement("li");n.style.padding="6px 0",n.style.borderBottom="1px solid #eee",t===leaderboard.length-1&&(n.style.borderBottom="none"),n.textContent=`${t+1}. ${e.name} - ${e.score}`,leaderboardListEl.appendChild(n)})}
function resetGlobalHighScore() { if(confirm("Yakin ingin mereset semua skor tertinggi?")){leaderboard=[];saveLeaderboard();displayLeaderboard();alert("Papan Skor Tertinggi direset!")}}

// === FUNGSI-FUNGSI GAME ===
function loadObstaclesForLevel(level) { const i=level-1;obstacles=i>=0&&i<allLevelObstacles.length?JSON.parse(JSON.stringify(allLevelObstacles[i])):(console.warn(`Level ${level} tidak terdefinisi, menggunakan rintangan dari level ${allLevelObstacles.length}.`),JSON.parse(JSON.stringify(allLevelObstacles[allLevelObstacles.length-1])))}
function placeInitialSnake() { let e=3,t=!1;const n=1,o=0;for(let l=0;l<15;l++){let s=0,a=0;if(l>0){let r=Math.floor((Math.sqrt(4*l-3)+1)/2),c=Math.floor((l-((2*r-1)**2-(2*r-1))/2)/(r||1));pos_on_side=(l-((2*r-1)**2-(2*r-1))/2)%(r||1),r>0&&(0===c?(s=pos_on_side-Math.floor(r/2),a=-r):1===c?(s=r,a=pos_on_side-Math.floor(r/2)):2===c?(s=-(pos_on_side-Math.floor(r/2)),a=r):3===c&&(s=-r,a=-(pos_on_side-Math.floor(r/2))))}let r=Math.floor(tileCountX/2)+s,c=Math.floor(tileCountY/2)+a;if(!(r<0||r>=tileCountX||c<0||c>=tileCountY)){let h=!1,u=[];for(let d=0;d<e;d++){let p=r-d,f=c;if(p<0||p>=tileCountX||f<0||f>=tileCountY||obstacles&&obstacles.some(e=>e.x===p&&e.y===f)){h=!0;break}u.push({x:p,y:f})}if(h)continue;if(u.length===e){let g=u[0].x+n,y=u[0].y+o;g<0||g>=tileCountX||y<0||y>=tileCountY||obstacles&&obstacles.some(e=>e.x===g&&e.y===y)||u.slice(1).some(e=>e.x===g&&e.y===y)?void 0:(snakeParts=u,headX=snakeParts[0].x,headY=snakeParts[0].y,t=!0);break}}}t||(console.warn("PERINGATAN: Gagal menempatkan ular dengan aman."),headX=Math.floor(tileCountX/2),headY=Math.floor(tileCountY/2),snakeParts=[],Array.from({length:e}).forEach((e,t)=>{snakeParts.push({x:Math.max(0,headX-t),y:headY})}),snakeParts.length>0?(headX=snakeParts[0].x,headY=snakeParts[0].y):(headX=Math.floor(tileCountX/2),headY=Math.floor(tileCountY/2),snakeParts=[{x:headX,y:headY}])),velocityX=n,velocityY=o}
function spawnBonusFood() { if(bonusFoodActive)return;let e,t,n,o=0;do{n=!1,e=Math.floor(Math.random()*tileCountX),t=Math.floor(Math.random()*tileCountY),o++,o>MAX_SPAWN_FOOD_ATTEMPTS&&(console.warn("Tidak bisa menemukan tempat untuk makanan bonus."),bonusFoodActive=!1);if(snakeParts&&snakeParts.some(n=>n.x===e&&n.y===t))n=!0;if(obstacles&&obstacles.some(n=>n.x===e&&n.y===t))n=!0;if(foodX===e&&foodY===t)n=!0}while(n);bonusFoodX=e,bonusFoodY=t,bonusFoodActive=!0,bonusFoodTimer=BONUS_FOOD_DURATION}

function prepareNewLevelSetup() {
    console.log("prepareNewLevelSetup() dipanggil.");
    isPaused = false; if(btnPauseResume) btnPauseResume.textContent = 'Pause';
    loadObstaclesForLevel(currentLevel);
    let collisionWithNewObstacle = false;
    if (snakeParts && obstacles) { for (const part of snakeParts) { if (obstacles.some(obs => obs.x === part.x && obs.y === part.y)) { collisionWithNewObstacle = true; break; }}}
    if (collisionWithNewObstacle) {
        playCrashSound(); console.warn("Game Over: Naik level ke rintangan.");
        addScoreToLeaderboard(currentPlayerName, score); showStartScreenUI(); return;
    }
    if (!spawnFood(true)) {
        console.error("Kritis: Gagal spawn makanan di level baru!");
        addScoreToLeaderboard(currentPlayerName, score); showStartScreenUI(); return;
    }
    bonusFoodActive = false; startGameLoop(currentSpeed);
}

if (btnResetHighScore) { btnResetHighScore.addEventListener('click', resetGlobalHighScore); }

function spawnFood(isCalledFromResetRoutine = false) {
    let newFoodX, newFoodY, collision, attempts = 0;
    do {
        collision = false; newFoodX = Math.floor(Math.random()*tileCountX); newFoodY = Math.floor(Math.random()*tileCountY); attempts++;
        if (attempts > MAX_SPAWN_FOOD_ATTEMPTS) {
            if (isCalledFromResetRoutine) { console.error("CRITICAL: Tidak ada tempat aman untuk spawn makanan saat reset."); return false; }
            console.warn("Max spawn food attempts reached."); return false;
        }
        if (snakeParts && snakeParts.some(p=>p.x===newFoodX&&p.y===newFoodY)) collision=true;
        if (obstacles && obstacles.some(obs=>obs.x===newFoodX&&obs.y===newFoodY)) collision=true;
        if (bonusFoodActive && bonusFoodX===newFoodX && bonusFoodY===newFoodY) collision=true;
    } while (collision);
    foodX = newFoodX; foodY = newFoodY; return true;
}

function setupNewGame() {
    console.log("Memulai setupNewGame()"); // DEBUG: Awal fungsi
    isPaused = false;
    if(btnPauseResume) btnPauseResume.textContent = 'Pause';
    score = 0;
    currentLevel = 1;
    currentSpeed = initialSpeed;
    nextLevelScoreThreshold = pointsPerLevel;
    bonusFoodActive = false;
    if (gameIntervalId) {
        clearInterval(gameIntervalId);
        gameIntervalId = null;
        console.log("Interval game lama dihentikan dari setupNewGame."); // DEBUG
    }
    console.log("Variabel game direset."); // DEBUG

    loadObstaclesForLevel(currentLevel);
    console.log("Rintangan level dimuat."); // DEBUG
    placeInitialSnake();
    console.log("Ular awal ditempatkan."); // DEBUG
    
    if (!spawnFood(true)) {
        console.error('Error: Gagal memuat makanan awal saat setupNewGame!'); // DEBUG
        if (context && currentTheme) {
            context.fillStyle = 'red';
            context.font = '18px Arial'; context.textAlign = 'center';
            context.fillText('Error memuat makanan!', canvas.width / 2, canvas.height / 2);
            context.textAlign = 'left';
        }
        return false; // Penting: return false jika gagal
    }
    console.log("Makanan awal berhasil di-spawn."); // DEBUG
    
    if (currentTheme && context) {
        console.log("Menggambar papan awal setelah setupNewGame."); //DEBUG
        drawBackground(); drawObstacles(); drawSnake(); drawFood(); drawGameInfo();
    } else {
        console.warn("currentTheme atau context tidak tersedia saat menggambar papan awal."); // DEBUG
    }
    console.log("setupNewGame() selesai, return true."); // DEBUG: Akhir fungsi sukses
    return true; // Penting: return true jika berhasil
}

function startGameLoop(speed) {
    console.log(`Memulai startGameLoop() dengan kecepatan: ${speed}`); // DEBUG
    if (gameIntervalId) {
        clearInterval(gameIntervalId);
        console.log("Interval game lama (jika ada) dihentikan sebelum memulai yang baru."); // DEBUG
    }
    currentSpeed = speed;
    if (!isPaused) {
        gameIntervalId = setInterval(gameLoop, Math.max(50, 1000 / currentSpeed));
        console.log("Interval game BARU dimulai dengan ID:", gameIntervalId); // DEBUG
    } else {
        console.log("Game dijeda, interval tidak dimulai dari startGameLoop."); // DEBUG
    }
}

function moveSnake() {
    if (isPaused) return;
    let nextHeadX = headX + velocityX; let nextHeadY = headY + velocityY;
    if (nextHeadX < 0) nextHeadX = tileCountX - 1; else if (nextHeadX >= tileCountX) nextHeadX = 0;
    if (nextHeadY < 0) nextHeadY = tileCountY - 1; else if (nextHeadY >= tileCountY) nextHeadY = 0;

    if (obstacles.some(obs => obs.x === nextHeadX && obs.y === nextHeadY)) {
        playCrashSound(); addScoreToLeaderboard(currentPlayerName, score);
        console.log("Tabrakan dengan rintangan! Game Over."); // DEBUG
        showStartScreenUI(); return;
    }
    if (snakeParts && snakeParts.length > 1 && snakeParts.slice(1).some(part => part.x === nextHeadX && part.y === nextHeadY)) {
        playCrashSound(); addScoreToLeaderboard(currentPlayerName, score);
        console.log("Tabrakan dengan diri sendiri! Game Over."); // DEBUG
        showStartScreenUI(); return;
    }
    headX = nextHeadX; headY = nextHeadY;
    let ularBertambahPanjang = false;
    if (bonusFoodActive && headX === bonusFoodX && headY === bonusFoodY) {
        playBonusFoodSound(); score += BONUS_FOOD_SCORE; bonusFoodActive = false;
    }
    if (headX === foodX && headY === foodY) {
        playEatFoodSound(); ularBertambahPanjang = true; score += 10;
        if (currentTheme && context) drawGameInfo(); // Update skor langsung
        if (score >= nextLevelScoreThreshold) {
            currentLevel++; currentSpeed += speedIncrementPerLevel; nextLevelScoreThreshold += pointsPerLevel;
            if (gameIntervalId) { clearInterval(gameIntervalId); gameIntervalId = null; }
            prepareNewLevelSetup(); return;
        }
        if (!spawnFood()) {
            console.error("Gagal spawn makanan setelah makan! Game Over."); // DEBUG
            addScoreToLeaderboard(currentPlayerName, score); showStartScreenUI(); return;
        }
        if (!bonusFoodActive && Math.random() < BONUS_FOOD_SPAWN_CHANCE) { spawnBonusFood(); }
    }
    const newHead = { x: headX, y: headY };
    if (snakeParts) { snakeParts.unshift(newHead); if (!ularBertambahPanjang) { if (snakeParts.length > 0) snakeParts.pop(); }} else { snakeParts = [newHead]; }
}

function gameLoop() {
    if (isPaused) return;
    moveSnake();
    if (gameIntervalId === null && !isPaused) { console.log("gameLoop: intervalId null, keluar."); return; } // DEBUG
    if (bonusFoodActive) { bonusFoodTimer--; if (bonusFoodTimer <= 0) { bonusFoodActive = false; } }
    if (!currentTheme) currentTheme = themes.default;
    drawBackground(); drawObstacles(); drawSnake(); drawFood(); drawBonusFood(); drawGameInfo();
}

// === FUNGSI DRAWING ===
function drawBackground() { if(!context||!currentTheme)return;context.fillStyle=currentTheme.background;context.fillRect(0,0,canvas.width,canvas.height)}
function drawSnake() { if(!context||!snakeParts||!currentTheme)return;snakeParts.forEach((e,t)=>{context.fillStyle=0===t?currentTheme.snakeHead:currentTheme.snakeBody;context.fillRect(e.x*tileSize,e.y*tileSize,tileSize,tileSize)})}
function drawObstacles() { if(!context||!obstacles||!currentTheme)return;context.fillStyle=currentTheme.obstacle;obstacles.forEach(e=>{context.fillRect(e.x*tileSize,e.y*tileSize,tileSize,tileSize)})}
function drawFood() { if(!context||void 0===foodX||!currentTheme)return;context.fillStyle=currentTheme.food;context.fillRect(foodX*tileSize,foodY*tileSize,tileSize,tileSize)}
function drawBonusFood() { if(!context||!bonusFoodActive||!currentTheme)return;context.fillStyle=currentTheme.bonusFood;const e=Math.abs(Math.sin(Date.now()/180)),t=tileSize*.8,n=tileSize*.2*e,o=t+n,l=(tileSize-o)/2;context.fillRect(bonusFoodX*tileSize+l,bonusFoodY*tileSize+l,o,o)}
function drawGameInfo() { if(!context||!currentTheme)return;context.fillStyle=currentTheme.text;context.font="16px Arial";context.textAlign="left";context.fillText("Skor: "+score,8,20);context.fillText("Level: "+currentLevel,8,60)}
function drawPausedMessage() { if(!context||!currentTheme)return;context.fillStyle=currentTheme.pauseOverlay;context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle=currentTheme.pauseText;context.font="bold 28px Arial";context.textAlign="center";context.fillText("PAUSED",canvas.width/2,canvas.height/2);context.font="16px Arial";context.fillText("Tekan P atau Escape untuk Lanjut",canvas.width/2,canvas.height/2+30);context.textAlign="left"}

// === KONTROL UI & GAME FLOW BARU ===
function drawStartScreen() {
    console.log("Menggambar drawStartScreen(). Tema saat ini:", currentTheme ? "Ada" : "NULL"); // DEBUG
    if (!context) { console.error("Context tidak ada di drawStartScreen"); return; }
    if (!currentTheme) { console.warn("currentTheme tidak ada di drawStartScreen, fallback."); currentTheme = themes.retro; }
    context.fillStyle = currentTheme.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = currentTheme.text;
    context.font = 'bold 28px Arial'; context.textAlign = 'center';
    context.fillText('ULO GONDRONG', canvas.width / 2, canvas.height / 2 - 100);
    context.font = '18px Arial';
    context.fillText('Pilih tema, isi nama, dan tekan "Mulai Main!"', canvas.width / 2, canvas.height / 2 - 60);
    context.textAlign = 'left';
}

function showStartScreenUI() {
    console.log("Menampilkan showStartScreenUI()."); // DEBUG
    if (gameIntervalId) { clearInterval(gameIntervalId); gameIntervalId = null; console.log("Interval dihentikan dari showStartScreenUI."); } // DEBUG
    if (preGameAreaDiv) preGameAreaDiv.style.display = 'block'; else console.error("preGameAreaDiv tidak ditemukan!"); // DEBUG
    if (gameControlsDiv) gameControlsDiv.style.display = 'none'; else console.error("gameControlsDiv tidak ditemukan!"); // DEBUG
    if (themeSelector) themeSelector.disabled = false; else console.warn("themeSelector tidak ditemukan!"); // DEBUG
    if (playerNameInput) playerNameInput.disabled = false; else console.warn("playerNameInput tidak ditemukan!"); // DEBUG
    if (btnPlay) btnPlay.disabled = false; else console.warn("btnPlay tidak ditemukan!"); // DEBUG

    const initialThemeName = themeSelector ? themeSelector.value : 'retro';
    currentTheme = themes[initialThemeName] || themes.retro;
    if (themeSelector && themeSelector.value !== initialThemeName && themes[initialThemeName]) {
         themeSelector.value = Object.keys(themes).find(key => themes[key] === currentTheme) || initialThemeName;
    } else if (themeSelector && !themes[initialThemeName] && Object.keys(themes).length > 0) { // Jika value tidak valid, set ke key pertama themes
         const firstThemeKey = Object.keys(themes)[0];
         themeSelector.value = firstThemeKey; 
         currentTheme = themes[firstThemeKey];
         console.log("Fallback tema selector ke:", firstThemeKey); // DEBUG
    }
    
    loadLeaderboard(); displayLeaderboard(); drawStartScreen();
}

function showGameScreenUI() {
    console.log("Menampilkan showGameScreenUI()."); // DEBUG
    if (preGameAreaDiv) preGameAreaDiv.style.display = 'none';
    if (gameControlsDiv) gameControlsDiv.style.display = 'block';
    if (themeSelector) themeSelector.disabled = true;
    if (playerNameInput) playerNameInput.disabled = true;
    if (btnPlay) btnPlay.disabled = true;
}

if (btnPlay) {
    btnPlay.addEventListener('click', () => {
        console.log("Tombol 'Mulai Main' DIKLIK."); // DEBUG UTAMA
        currentPlayerName = playerNameInput.value.trim().substring(0, 15) || "Pemain";
        console.log("Nama Pemain Diset ke: ", currentPlayerName); // DEBUG
        if (!currentTheme) { 
            currentTheme = themes[themeSelector.value] || themes.retro; // Fallback jika belum diset
            console.log("Tema di-fallback/diambil dari selector:", themeSelector.value); // DEBUG
        }
        
        console.log("Memanggil setupNewGame() dari event listener btnPlay..."); // DEBUG
        if (setupNewGame()) {
            console.log("setupNewGame() BERHASIL. Memanggil startGameLoop dan showGameScreenUI."); // DEBUG
            startGameLoop(currentSpeed); 
            showGameScreenUI();
        } else {
            console.error("setupNewGame() GAGAL. Kembali ke layar awal (showStartScreenUI)."); // DEBUG
            showStartScreenUI(); 
        }
    });
} else { console.error("FATAL: Elemen Tombol Play (btnPlay) TIDAK ditemukan saat menambah event listener!"); }

if (themeSelector) {
    themeSelector.addEventListener('change', function(event) {
        const selectedThemeName = event.target.value;
        console.log(`Event: Tema dipilih dari dropdown: ${selectedThemeName}`); // DEBUG
        if (themes[selectedThemeName]) {
            currentTheme = themes[selectedThemeName];
            console.log("currentTheme diperbarui karena perubahan dropdown."); // DEBUG
            if (preGameAreaDiv && preGameAreaDiv.style.display !== 'none') { drawStartScreen(); }
        } else { console.warn(`Tema "${selectedThemeName}" dari dropdown tidak ditemukan.`); }
    });
} else { console.warn("Elemen Pemilih Tema (themeSelector) TIDAK ditemukan saat menambah event listener."); }

function togglePauseResume() { isPaused=!isPaused,isPaused?(btnPauseResume&&(btnPauseResume.textContent="Resume"),drawPausedMessage()):(btnPauseResume&&(btnPauseResume.textContent="Pause"),startGameLoop(currentSpeed))}
function handleDirectionChange(newVX, newVY) { if(!isPaused||0===newVX&&0===newVY)if(snakeParts&&snakeParts.length>1){if((0!==velocityX||0!==velocityY)&&newVX===-velocityX&&newVY===-velocityY)return}(0===newVX&&0===newVY)||(velocityX=newVX,velocityY=newVY)}
document.getElementById('btnUp')?.addEventListener('click',()=>handleDirectionChange(0,-1));document.getElementById('btnLeft')?.addEventListener('click',()=>handleDirectionChange(-1,0));document.getElementById('btnRight')?.addEventListener('click',()=>handleDirectionChange(1,0));document.getElementById('btnDown')?.addEventListener('click',()=>handleDirectionChange(0,1));btnPauseResume?.addEventListener('click',togglePauseResume);
document.addEventListener('keydown',e=>{if(isPaused&&"p"!==e.key&&"P"!==e.key&&"Escape"!==e.key)return;switch(e.key){case"ArrowUp":case"w":case"W":handleDirectionChange(0,-1),e.preventDefault();break;case"ArrowDown":case"s":case"S":handleDirectionChange(0,1),e.preventDefault();break;case"ArrowLeft":case"a":case"A":handleDirectionChange(-1,0),e.preventDefault();break;case"ArrowRight":case"d":case"D":handleDirectionChange(1,0),e.preventDefault();break;case"p":case"P":case"Escape":togglePauseResume(),e.preventDefault()}});

// === MULAI SCRIPT ===
if (!canvas || !context) {
    console.error("Canvas tidak ditemukan.");
    document.body.innerHTML = '<p>Error: Canvas "gameCanvas" tidak ditemukan.</p>';
} else {
    console.log("Inisialisasi Awal: Canvas dan context ditemukan. Memanggil showStartScreenUI()."); // DEBUG
    showStartScreenUI(); 
}
