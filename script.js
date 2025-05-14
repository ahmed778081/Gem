// === INISIALISASI DASAR ===
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const themeSelector = document.getElementById('themeSelector');
const btnPlay = document.getElementById('btnPlay');
const preGameAreaDiv = document.getElementById('preGameArea');
const gameControlsDiv = document.getElementById('gameControls');
const playerNameInput = document.getElementById('playerNameInput');
const leaderboardListEl = document.getElementById('leaderboardList');

// --- URL API LEADERBOARD ANDA (PASTIKAN INI BENAR) ---
const LEADERBOARD_API_URL = "https://script.google.com/macros/s/AKfycbyF6vre7WzXCZ1tKGK4K-_NeS1Gvv-KGBb0iBj7y9tveNhGtbOOA01jJ52MHgO1fug/exec"; // URL ANDA

console.log("Skrip Dimuat. Elemen Dasar:", { canvas, context, themeSelector, btnPlay, preGameAreaDiv, gameControlsDiv, playerNameInput, leaderboardListEl });
console.log("URL API Leaderboard:", LEADERBOARD_API_URL);

const tileSize = 20; const tileCountX = 20; const tileCountY = 20;
canvas.width = tileSize * tileCountX; canvas.height = tileSize * tileCountY;

// === PENGATURAN TEMA WARNA ===
const themes = { /* ... Definisi tema Anda ... */
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
const allLevelObstacles = [ /* ... Definisi Level 1-6 Anda ... */ [{x:5,y:5},{x:6,y:5},{x:7,y:5},{x:12,y:14},{x:13,y:14},{x:14,y:14}],[{x:3,y:3},{x:4,y:3},{x:5,y:3},{x:6,y:3},{x:7,y:3},{x:tileCountX-4,y:tileCountY-4},{x:tileCountX-5,y:tileCountY-4},{x:tileCountX-6,y:tileCountY-4},{x:tileCountX-7,y:tileCountY-4},{x:tileCountX-8,y:tileCountY-4},{x:Math.floor(tileCountX/2),y:7},{x:Math.floor(tileCountX/2),y:8},{x:Math.floor(tileCountX/2),y:10}],[...Array.from({length:tileCountX},(_,i)=>({x:i,y:0})),...Array.from({length:tileCountX},(_,i)=>({x:i,y:tileCountY-1})),...Array.from({length:tileCountY-2},(_,i)=>({x:0,y:i+1})),...Array.from({length:tileCountY-2},(_,i)=>({x:tileCountX-1,y:i+1})),{x:5,y:Math.floor(tileCountY/2)},{x:6,y:Math.floor(tileCountY/2)},{x:tileCountX-6,y:Math.floor(tileCountY/2)-1},{x:tileCountX-7,y:Math.floor(tileCountY/2)-1}],[{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)-2},{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)-1},{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)+1},{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)+2},{x:Math.floor(tileCountX/2)-2,y:Math.floor(tileCountY/2)},{x:Math.floor(tileCountX/2)-1,y:Math.floor(tileCountY/2)},{x:Math.floor(tileCountX/2)+1,y:Math.floor(tileCountY/2)},{x:Math.floor(tileCountX/2)+2,y:Math.floor(tileCountY/2)}],[...Array.from({length:tileCountX-6},(_,i)=>({x:3+i,y:4})),...Array.from({length:tileCountX-6},(_,i)=>({x:3+i,y:tileCountY-5})),{x:Math.floor(tileCountX/2),y:7},{x:Math.floor(tileCountX/2),y:8},{x:Math.floor(tileCountX/2),y:tileCountY-9},{x:Math.floor(tileCountX/2),y:tileCountY-8}],[{x:3,y:3},{x:4,y:3},{x:3,y:4},{x:4,y:4},{x:tileCountX-5,y:3},{x:tileCountX-4,y:3},{x:tileCountX-5,y:4},{x:tileCountX-4,y:4},{x:3,y:tileCountY-5},{x:4,y:tileCountY-5},{x:3,y:tileCountY-4},{x:4,y:tileCountY-4},{x:tileCountX-5,y:tileCountY-5},{x:tileCountX-4,y:tileCountY-5},{x:tileCountX-5,y:tileCountY-4},{x:tileCountX-4,y:tileCountY-4},{x:Math.floor(tileCountX/2)-1,y:Math.floor(tileCountY/2)},{x:Math.floor(tileCountX/2),y:Math.floor(tileCountY/2)}]];
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

// === LEADERBOARD LOGIC (ONLINE) ===
const MAX_LEADERBOARD_ENTRIES = 5;
let leaderboard = [];

async function loadOnlineLeaderboard() {
    console.log("Memulai loadOnlineLeaderboard(). URL:", LEADERBOARD_API_URL);
    if (!LEADERBOARD_API_URL) {
        console.error("LEADERBOARD_API_URL belum diset!");
        leaderboard = []; displayLeaderboard(); return;
    }
    try {
        const response = await fetch(LEADERBOARD_API_URL);
        console.log("loadOnlineLeaderboard: Response status:", response.status);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal memuat leaderboard: ${response.status} ${response.statusText}. Server: ${errorText}`);
        }
        const onlineScores = await response.json();
        if (!Array.isArray(onlineScores)) {
            console.error("Data leaderboard yang diterima bukan array:", onlineScores);
            throw new Error("Format data leaderboard tidak valid.");
        }
        leaderboard = onlineScores;
        console.log("Leaderboard online berhasil dimuat:", leaderboard);
    } catch (error) {
        console.error('Error detail saat memuat leaderboard online:', error);
        leaderboard = [];
        if (leaderboardListEl) leaderboardListEl.innerHTML = `<li style="text-align:center; color: red;"><i>Gagal memuat: ${error.message}</i></li>`;
    }
    displayLeaderboard();
}

async function submitScoreToGoogleSheet(name, newScore) {
    const playerNameForSubmit = name || "Pemain Anonim";
    const scoreForSubmit = typeof newScore === 'number' ? newScore : 0;

    console.log(`Mencoba mengirim skor: ${playerNameForSubmit} - ${scoreForSubmit} ke ${LEADERBOARD_API_URL}`);
    if (!LEADERBOARD_API_URL) {
        console.error("LEADERBOARD_API_URL belum diset untuk submit skor!");
        alert("Gagal menyimpan skor: URL server tidak valid.");
        return;
    }
    try {
        // --- MENGGUNAKAN mode: 'no-cors' ---
        // Ini akan mengirim request tanpa menunggu validasi CORS dari server.
        // Konsekuensinya, kita tidak bisa membaca response body dari server (response.ok, response.json() akan error).
        // Kita hanya bisa berasumsi request "terkirim" jika tidak ada network error.
        await fetch(LEADERBOARD_API_URL, {
            method: 'POST',
            mode: 'no-cors', // <--- PERUBAHAN DI SINI
            // 'Content-Type': 'application/json', // Header ini mungkin diabaikan atau menyebabkan masalah dengan 'no-cors'
                                                 // Apps Script doPost dengan e.postData.contents akan tetap bisa membaca body.
            body: JSON.stringify({ name: playerNameForSubmit, score: scoreForSubmit }),
        });

        console.log('Skor "dikirim" ke Google Sheet (mode no-cors). Status server tidak bisa diverifikasi dari client.');
        alert("Skor Anda sedang diproses untuk leaderboard!"); // Beri feedback umum ke pengguna

        // Karena tidak ada konfirmasi server langsung, kita muat ulang leaderboard
        // untuk melihat apakah data kita sudah masuk (ini akan ada sedikit jeda).
        // Tambahkan sedikit penundaan sebelum memuat ulang agar server punya waktu memproses.
        setTimeout(() => {
            console.log("Memuat ulang leaderboard setelah submit (dengan jeda)...");
            loadOnlineLeaderboard();
        }, 2000); // Jeda 2 detik, bisa disesuaikan

    } catch (error) {
        // Error di sini biasanya adalah error jaringan (misalnya, server tidak terjangkau),
        // bukan error dari logika Apps Script (karena kita tidak membaca responsnya).
        console.error('Error JARINGAN saat mengirim skor (mode no-cors):', error);
        alert(`Gagal mengirim skor online (masalah jaringan). Error: ${error.message}.`);
    }
}

function displayLeaderboard() { /* ... fungsi displayLeaderboard Anda tetap sama ... */
    if (!leaderboardListEl) { console.error("leaderboardListEl tidak ditemukan!"); return; }
    leaderboardListEl.innerHTML = '';
    if (leaderboard.length === 0) {
        leaderboardListEl.innerHTML = '<li style="text-align:center; color: #777;"><i>Belum ada skor tertinggi atau gagal memuat!</i></li>';
    } else {
        leaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            li.style.padding = "6px 0"; li.style.borderBottom = "1px solid #eee";
            if (index === leaderboard.length - 1) li.style.borderBottom = "none";
            const displayName = entry.name || "Tanpa Nama";
            const displayScore = typeof entry.score === 'number' ? entry.score : 0;
            li.textContent = `${index + 1}. ${displayName} - ${displayScore}`;
            leaderboardListEl.appendChild(li);
        });
    }
}
function resetGlobalHighScore() { alert("Untuk mereset leaderboard online, hapus data secara manual di Google Sheet Anda.");}

// === FUNGSI-FUNGSI GAME ===
// ... (loadObstaclesForLevel, placeInitialSnake, spawnBonusFood, prepareNewLevelSetup, dll. tetap sama seperti versi sebelumnya yang tombol play-nya sudah berfungsi) ...
function loadObstaclesForLevel(level) { const i=level-1;obstacles=i>=0&&i<allLevelObstacles.length?JSON.parse(JSON.stringify(allLevelObstacles[i])):(console.warn(`Level ${level} tidak terdefinisi, menggunakan rintangan dari level ${allLevelObstacles.length}.`),JSON.parse(JSON.stringify(allLevelObstacles[allLevelObstacles.length-1])))}
function placeInitialSnake() { let e=3,t=!1;const n=1,o=0;for(let l=0;l<15;l++){let s=0,a=0;if(l>0){let r=Math.floor((Math.sqrt(4*l-3)+1)/2),c=Math.floor((l-((2*r-1)**2-(2*r-1))/2)/(r||1));pos_on_side=(l-((2*r-1)**2-(2*r-1))/2)%(r||1),r>0&&(0===c?(s=pos_on_side-Math.floor(r/2),a=-r):1===c?(s=r,a=pos_on_side-Math.floor(r/2)):2===c?(s=-(pos_on_side-Math.floor(r/2)),a=r):3===c&&(s=-r,a=-(pos_on_side-Math.floor(r/2))))}let r=Math.floor(tileCountX/2)+s,c=Math.floor(tileCountY/2)+a;if(!(r<0||r>=tileCountX||c<0||c>=tileCountY)){let h=!1,u=[];for(let d=0;d<e;d++){let p=r-d,f=c;if(p<0||p>=tileCountX||f<0||f>=tileCountY||obstacles&&obstacles.some(e=>e.x===p&&e.y===f)){h=!0;break}u.push({x:p,y:f})}if(h)continue;if(u.length===e){let g=u[0].x+n,y=u[0].y+o;g<0||g>=tileCountX||y<0||y>=tileCountY||obstacles&&obstacles.some(e=>e.x===g&&e.y===y)||u.slice(1).some(e=>e.x===g&&e.y===y)?void 0:(snakeParts=u,headX=snakeParts[0].x,headY=snakeParts[0].y,t=!0);break}}}t||(console.warn("PERINGATAN: Gagal menempatkan ular dengan aman."),headX=Math.floor(tileCountX/2),headY=Math.floor(tileCountY/2),snakeParts=[],Array.from({length:e}).forEach((e,t)=>{snakeParts.push({x:Math.max(0,headX-t),y:headY})}),snakeParts.length>0?(headX=snakeParts[0].x,headY=snakeParts[0].y):(headX=Math.floor(tileCountX/2),headY=Math.floor(tileCountY/2),snakeParts=[{x:headX,y:headY}])),velocityX=n,velocityY=o}
function spawnBonusFood() { if(bonusFoodActive)return;let e,t,n,o=0;do{n=!1,e=Math.floor(Math.random()*tileCountX),t=Math.floor(Math.random()*tileCountY),o++,o>MAX_SPAWN_FOOD_ATTEMPTS&&(console.warn("Tidak bisa menemukan tempat untuk makanan bonus."),bonusFoodActive=!1);if(snakeParts&&snakeParts.some(n=>n.x===e&&n.y===t))n=!0;if(obstacles&&obstacles.some(n=>n.x===e&&n.y===t))n=!0;if(foodX===e&&foodY===t)n=!0}while(n);bonusFoodX=e,bonusFoodY=t,bonusFoodActive=!0,bonusFoodTimer=BONUS_FOOD_DURATION}
function prepareNewLevelSetup() { console.log("prepareNewLevelSetup() dipanggil untuk Level:", currentLevel); isPaused = false; if(btnPauseResume) btnPauseResume.textContent = 'Pause'; loadObstaclesForLevel(currentLevel); let collisionWithNewObstacle = false; if (snakeParts && obstacles) { for (const part of snakeParts) { if (obstacles.some(obs => obs.x === part.x && obs.y === part.y)) { collisionWithNewObstacle = true; break; }}} if (collisionWithNewObstacle) { playCrashSound(); console.warn("Game Over: Naik level ke rintangan."); submitScoreToGoogleSheet(currentPlayerName, score); showStartScreenUI(); return; } if (!spawnFood(true)) { console.error("Kritis: Gagal spawn makanan di level baru!"); submitScoreToGoogleSheet(currentPlayerName, score); showStartScreenUI(); return; } bonusFoodActive = false; startGameLoop(currentSpeed); }
if (btnResetHighScore) { btnResetHighScore.addEventListener('click', resetGlobalHighScore); }
function spawnFood(isCalledFromResetRoutine = false) { let newFoodX,newFoodY,collision,attempts=0;do{collision=!1,newFoodX=Math.floor(Math.random()*tileCountX),newFoodY=Math.floor(Math.random()*tileCountY),attempts++;if(attempts>MAX_SPAWN_FOOD_ATTEMPTS)return isCalledFromResetRoutine?(console.error("CRITICAL: Tidak ada tempat aman untuk spawn makanan saat reset."),!1):(console.warn("Max spawn food attempts reached."),!1);snakeParts&&snakeParts.some(p=>p.x===newFoodX&&p.y===newFoodY)&&(collision=!0),obstacles&&obstacles.some(obs=>obs.x===newFoodX&&obs.y===newFoodY)&&(collision=!0),bonusFoodActive&&bonusFoodX===newFoodX&&bonusFoodY===newFoodY&&(collision=!0)}while(collision);return foodX=newFoodX,foodY=newFoodY,!0}
function setupNewGame() { console.log("Memulai setupNewGame()");isPaused=!1;if(btnPauseResume)btnPauseResume.textContent="Pause";score=0,currentLevel=1,currentSpeed=initialSpeed,nextLevelScoreThreshold=pointsPerLevel,bonusFoodActive=!1;if(gameIntervalId){clearInterval(gameIntervalId),gameIntervalId=null,console.log("Interval game lama dihentikan.")}console.log("Variabel game direset.");loadObstaclesForLevel(currentLevel),console.log("Rintangan dimuat.");placeInitialSnake(),console.log("Ular ditempatkan.");if(!spawnFood(!0)){console.error("Error: Gagal memuat makanan awal!");if(context&&currentTheme){context.fillStyle="red",context.font="18px Arial",context.textAlign="center",context.fillText("Error memuat makanan!",canvas.width/2,canvas.height/2),context.textAlign="left"}return!1}console.log("Makanan awal di-spawn.");if(currentTheme&&context){console.log("Menggambar papan awal.");drawBackground(),drawObstacles(),drawSnake(),drawFood(),drawGameInfo()}else console.warn("Tema/context hilang saat menggambar papan.");return console.log("setupNewGame() selesai, return true."),!0}
function startGameLoop(speed) { console.log(`Memulai startGameLoop(), kecepatan: ${speed}`);if(gameIntervalId){clearInterval(gameIntervalId),console.log("Interval lama dihentikan.")}currentSpeed=speed;if(!isPaused){gameIntervalId=setInterval(gameLoop,Math.max(50,1e3/currentSpeed)),console.log("Interval BARU dimulai:",gameIntervalId)}else console.log("Game dijeda, interval tidak dimulai.")}
function moveSnake() { if (isPaused) return; let nextHeadX = headX+velocityX, nextHeadY = headY+velocityY; if(nextHeadX<0)nextHeadX=tileCountX-1;else if(nextHeadX>=tileCountX)nextHeadX=0; if(nextHeadY<0)nextHeadY=tileCountY-1;else if(nextHeadY>=tileCountY)nextHeadY=0; if(obstacles.some(obs=>obs.x===nextHeadX&&obs.y===nextHeadY)){playCrashSound();submitScoreToGoogleSheet(currentPlayerName,score);console.log("Tabrakan rintangan!");showStartScreenUI();return} if(snakeParts&&snakeParts.length>1&&snakeParts.slice(1).some(part=>part.x===nextHeadX&&part.y===nextHeadY)){playCrashSound();submitScoreToGoogleSheet(currentPlayerName,score);console.log("Tabrakan diri sendiri!");showStartScreenUI();return} headX=nextHeadX;headY=nextHeadY;let ularBertambahPanjang=!1;if(bonusFoodActive&&headX===bonusFoodX&&headY===bonusFoodY){playBonusFoodSound();score+=BONUS_FOOD_SCORE;bonusFoodActive=!1} if(headX===foodX&&headY===foodY){playEatFoodSound();ularBertambahPanjang=!0;score+=10;if(currentTheme&&context)drawGameInfo();if(score>=nextLevelScoreThreshold){currentLevel++;currentSpeed+=speedIncrementPerLevel;nextLevelScoreThreshold+=pointsPerLevel;if(gameIntervalId)clearInterval(gameIntervalId),gameIntervalId=null;prepareNewLevelSetup();return}if(!spawnFood()){console.error("Gagal spawn makanan stlh makan!");submitScoreToGoogleSheet(currentPlayerName,score);showStartScreenUI();return}if(!bonusFoodActive&&Math.random()<BONUS_FOOD_SPAWN_CHANCE)spawnBonusFood()} const newHead={x:headX,y:headY};if(snakeParts){snakeParts.unshift(newHead);if(!ularBertambahPanjang&&snakeParts.length>0)snakeParts.pop()}else snakeParts=[newHead]}
function gameLoop() { if(isPaused)return;moveSnake();if(null===gameIntervalId&&!isPaused)return console.log("gameLoop: intervalId null."),void 0;if(bonusFoodActive&&(bonusFoodTimer--,bonusFoodTimer<=0&&(bonusFoodActive=!1)),!currentTheme)currentTheme=themes.default;if(!snakeParts||0===snakeParts.length){}drawBackground(),drawObstacles(),drawSnake(),drawFood(),drawBonusFood(),drawGameInfo()}

// === FUNGSI DRAWING ===
function drawBackground() { if(!context||!currentTheme)return;context.fillStyle=currentTheme.background;context.fillRect(0,0,canvas.width,canvas.height)}
function drawSnake() { if(!context){console.error("drawSnake: context tidak ada.");return}if(!currentTheme){console.error("drawSnake: currentTheme tidak ada.");return}if(!snakeParts||0===snakeParts.length)return;snakeParts.forEach((e,t)=>{let n;n=0===t?(currentTheme.snakeHead||"green"):(currentTheme.snakeBody||"lightgreen"),context.fillStyle=n,context.fillRect(e.x*tileSize,e.y*tileSize,tileSize,tileSize)})}
function drawObstacles() { if(!context||!obstacles||!currentTheme)return;context.fillStyle=currentTheme.obstacle;obstacles.forEach(e=>{context.fillRect(e.x*tileSize,e.y*tileSize,tileSize,tileSize)})}
function drawFood() { if(!context||void 0===foodX||!currentTheme)return;context.fillStyle=currentTheme.food;context.fillRect(foodX*tileSize,foodY*tileSize,tileSize,tileSize)}
function drawBonusFood() { if(!context||!bonusFoodActive||!currentTheme)return;context.fillStyle=currentTheme.bonusFood;const e=Math.abs(Math.sin(Date.now()/180)),t=tileSize*.8,n=tileSize*.2*e,o=t+n,l=(tileSize-o)/2;context.fillRect(bonusFoodX*tileSize+l,bonusFoodY*tileSize+l,o,o)}
function drawGameInfo() { if(!context||!currentTheme)return;context.fillStyle=currentTheme.text;context.font="16px Arial";context.textAlign="left";context.fillText("Skor: "+score,8,20);context.fillText("Level: "+currentLevel,8,60)}
function drawPausedMessage() { if(!context||!currentTheme)return;context.fillStyle=currentTheme.pauseOverlay;context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle=currentTheme.pauseText;context.font="bold 28px Arial";context.textAlign="center";context.fillText("PAUSED",canvas.width/2,canvas.height/2);context.font="16px Arial";context.fillText("Tekan P atau Escape untuk Lanjut",canvas.width/2,canvas.height/2+30);context.textAlign="left"}

// === KONTROL UI & GAME FLOW BARU ===
function drawStartScreen() { /* ... kode tetap sama ... */ console.log("Menggambar drawStartScreen(). Tema saat ini:",currentTheme?"Ada":"NULL");if(!context){console.error("Context tidak ada di drawStartScreen");return}if(!currentTheme){console.warn("currentTheme tidak ada di drawStartScreen, fallback.");currentTheme=themes.retro}context.fillStyle=currentTheme.background,context.fillRect(0,0,canvas.width,canvas.height),context.fillStyle=currentTheme.text,context.font="bold 28px Arial",context.textAlign="center",context.fillText("ULO GONDRONG",canvas.width/2,canvas.height/2-100),context.font="18px Arial",context.fillText('Pilih tema, isi nama, dan tekan "Mulai Main!"',canvas.width/2,canvas.height/2-60),context.textAlign="left"}
function showStartScreenUI() { /* ... kode tetap sama ... */ console.log("Menampilkan showStartScreenUI().");if(gameIntervalId){clearInterval(gameIntervalId),gameIntervalId=null,console.log("Interval dihentikan dari showStartScreenUI.")}if(preGameAreaDiv)preGameAreaDiv.style.display="block";else console.error("preGameAreaDiv tidak ditemukan!");if(gameControlsDiv)gameControlsDiv.style.display="none";else console.error("gameControlsDiv tidak ditemukan!");if(themeSelector)themeSelector.disabled=!1;else console.warn("themeSelector tidak ditemukan!");if(playerNameInput)playerNameInput.disabled=!1;else console.warn("playerNameInput tidak ditemukan!");if(btnPlay)btnPlay.disabled=!1;else console.warn("btnPlay tidak ditemukan!");const e=themeSelector?themeSelector.value:"retro";currentTheme=themes[e]||themes.retro,themeSelector&&themeSelector.value!==e&&themes[e]?themeSelector.value=Object.keys(themes).find(t=>themes[t]===currentTheme)||e:themeSelector&&!themes[e]&&Object.keys(themes).length>0&&(themeSelector.value=Object.keys(themes)[0],currentTheme=themes[Object.keys(themes)[0]],console.log("Fallback tema selector ke:",Object.keys(themes)[0]));loadOnlineLeaderboard(),drawStartScreen()}
function showGameScreenUI() { /* ... kode tetap sama ... */ console.log("Menampilkan showGameScreenUI().");if(preGameAreaDiv)preGameAreaDiv.style.display="none";if(gameControlsDiv)gameControlsDiv.style.display="block";if(themeSelector)themeSelector.disabled=!0;if(playerNameInput)playerNameInput.disabled=!0;if(btnPlay)btnPlay.disabled=!0}

// === EVENT LISTENERS ===
if (btnPlay) { btnPlay.addEventListener('click', () => { console.log("Tombol 'Mulai Main' DIKLIK."); currentPlayerName = playerNameInput.value.trim().substring(0, 15) || "Pemain"; console.log("Nama Pemain Diset ke: ", currentPlayerName); if (!currentTheme) { currentTheme = themes[themeSelector.value] || themes.retro; console.log("Tema di-fallback/diambil dari selector:", themeSelector.value); } console.log("Memanggil setupNewGame() dari event listener btnPlay..."); if (setupNewGame()) { console.log("setupNewGame() BERHASIL. Memanggil startGameLoop dan showGameScreenUI."); startGameLoop(currentSpeed); showGameScreenUI(); } else { console.error("setupNewGame() GAGAL. Kembali ke layar awal (showStartScreenUI)."); showStartScreenUI(); } }); } else { console.error("FATAL: Elemen Tombol Play (btnPlay) TIDAK ditemukan saat menambah event listener!"); }
if (themeSelector) { themeSelector.addEventListener('change', function(event) { const selectedThemeName = event.target.value; console.log(`Event: Tema dipilih dari dropdown: ${selectedThemeName}`); if (themes[selectedThemeName]) { currentTheme = themes[selectedThemeName]; console.log("currentTheme diperbarui karena perubahan dropdown."); if (preGameAreaDiv && preGameAreaDiv.style.display !== 'none') { drawStartScreen(); } } else { console.warn(`Tema "${selectedThemeName}" dari dropdown tidak ditemukan.`); } }); } else { console.warn("Elemen Pemilih Tema (themeSelector) TIDAK ditemukan saat menambah event listener."); }
function togglePauseResume() { isPaused=!isPaused,isPaused?(btnPauseResume&&(btnPauseResume.textContent="Resume"),drawPausedMessage()):(btnPauseResume&&(btnPauseResume.textContent="Pause"),startGameLoop(currentSpeed))}
function handleDirectionChange(newVX, newVY) { if(!isPaused||0===newVX&&0===newVY)if(snakeParts&&snakeParts.length>1){if((0!==velocityX||0!==velocityY)&&newVX===-velocityX&&newVY===-velocityY)return}(0===newVX&&0===newVY)||(velocityX=newVX,velocityY=newVY)}
document.getElementById('btnUp')?.addEventListener('click',()=>handleDirectionChange(0,-1));document.getElementById('btnLeft')?.addEventListener('click',()=>handleDirectionChange(-1,0));document.getElementById('btnRight')?.addEventListener('click',()=>handleDirectionChange(1,0));document.getElementById('btnDown')?.addEventListener('click',()=>handleDirectionChange(0,1));btnPauseResume?.addEventListener('click',togglePauseResume);
document.addEventListener('keydown',e=>{if(isPaused&&"p"!==e.key&&"P"!==e.key&&"Escape"!==e.key)return;switch(e.key){case"ArrowUp":case"w":case"W":handleDirectionChange(0,-1),e.preventDefault();break;case"ArrowDown":case"s":case"S":handleDirectionChange(0,1),e.preventDefault();break;case"ArrowLeft":case"a":case"A":handleDirectionChange(-1,0),e.preventDefault();break;case"ArrowRight":case"d":case"D":handleDirectionChange(1,0),e.preventDefault();break;case"p":case"P":case"Escape":togglePauseResume(),e.preventDefault()}});

// === MULAI SCRIPT ===
if (!canvas || !context) {
    console.error("Canvas tidak ditemukan.");
    document.body.innerHTML = '<p>Error: Canvas "gameCanvas" tidak ditemukan.</p>';
} else {
    console.log("Inisialisasi Awal: Canvas dan context ditemukan. Memanggil showStartScreenUI().");
    showStartScreenUI();
}
