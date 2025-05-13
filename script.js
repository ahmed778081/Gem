// Mengakses elemen canvas dari HTML
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// --- PENGATURAN DASAR GAME ---
const tileSize = 20;
const tileCountX = 20;
const tileCountY = 20;
canvas.width = tileSize * tileCountX;
canvas.height = tileSize * tileCountY;

// --- STATE GAME (KONDISI PERMAINAN) ---
let headX, headY, snakeParts, velocityX, velocityY, foodX, foodY, score;
let currentSpeed, nextSpeedIncreaseScore, gameIntervalId = null;
const initialSpeed = 7, speedIncrement = 1, scoreThresholdForSpeedIncrease = 50;

const obstacles = [
    {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}, {x: 12, y: 14}, {x: 13, y: 14}, {x: 14, y: 14},
    {x: tileCountX / 2, y: 3}, {x: tileCountX / 2, y: tileCountY - 4}
];
let isPaused = false;
const btnPauseResume = document.getElementById('btnPauseResume');
const MAX_SPAWN_FOOD_ATTEMPTS = 500;

console.log("LOG SCRIPT: Script.js mulai dimuat.");

function startGameLoop(speed) {
    if (gameIntervalId !== null) {
        console.log(`LOG KECEPATAN: Membersihkan interval lama ID: ${gameIntervalId}`);
        clearInterval(gameIntervalId);
        gameIntervalId = null; // Set ke null setelah clear
    }
    currentSpeed = speed;
    if (!isPaused) {
        gameIntervalId = setInterval(gameLoop, 1000 / currentSpeed);
        console.log(`LOG KECEPATAN: Game loop BARU dimulai/diperbarui. Kecepatan: ${currentSpeed}, ID Interval BARU: ${gameIntervalId}`);
    } else {
        console.log("LOG GAME: startGameLoop dipanggil saat dijeda, interval TIDAK dimulai ulang karena isPaused=true.");
    }
}

function spawnFood(isCalledFromResetRoutine = false) {
    // ... (fungsi spawnFood dari langkah 23, yang mengembalikan true/false dan punya fallback) ...
    let newFoodX, newFoodY, collision, attempts = 0;
    console.log("LOG FOOD SPAWN: Mencoba menempatkan makanan...");
    do {
        collision = false;
        newFoodX = Math.floor(Math.random() * tileCountX);
        newFoodY = Math.floor(Math.random() * tileCountY);
        attempts++;
        if (attempts > MAX_SPAWN_FOOD_ATTEMPTS) {
            console.error(`LOG FOOD ERROR: Gagal menemukan tempat untuk makanan setelah ${attempts - 1} percobaan!`);
            if (isCalledFromResetRoutine) {
                console.warn("LOG FOOD WARNING: Gagal spawn makanan saat reset game. Mencoba fallback ke (0,0) jika aman.");
                let fallbackSafe = true;
                for(let obs of obstacles) if(obs.x === 0 && obs.y === 0) { fallbackSafe = false; break; }
                if (snakeParts && snakeParts.length > 0 && snakeParts.some(p => p.x === 0 && p.y === 0)) fallbackSafe = false; // Cek juga ular awal
                if (fallbackSafe) {
                    foodX = 0; foodY = 0;
                    console.log(`LOG FOOD SPAWN: Makanan darurat di (${foodX}, ${foodY})`);
                    return true;
                } else {
                    console.error("FATAL: Tidak bisa menempatkan makanan awal. Cek rintangan & posisi awal ular.");
                    return false;
                }
            }
            return false;
        }
        if(snakeParts) { for (let part of snakeParts) if (part.x === newFoodX && part.y === newFoodY) { collision = true; break; } }
        if (collision) continue;
        for (let obs of obstacles) if (obs.x === newFoodX && obs.y === newFoodY) { collision = true; break; }
    } while (collision);
    foodX = newFoodX; foodY = newFoodY;
    console.log(`LOG FOOD SPAWN: Makanan baru di (${foodX}, ${foodY}), percobaan: ${attempts}`);
    return true;
}

function resetGame() {
    console.log("LOG GAME: resetGame CALLED");
    isPaused = false; // Pastikan game tidak dimulai dalam kondisi pause
    if(btnPauseResume) btnPauseResume.textContent = 'Pause';

    headX = Math.floor(tileCountX / 2);
    headY = Math.floor(tileCountY / 2);
    // Pastikan snakeParts didefinisikan SEBELUM spawnFood dipanggil jika spawnFood membutuhkannya
    snakeParts = [ { x: headX, y: headY }, { x: headX - 1, y: headY }, { x: headX - 2, y: headY } ];
    velocityX = 1; velocityY = 0; score = 0;
    console.log(`LOG RESET: State direset. vx=${velocityX}, vy=${velocityY}, head=(${headX},${headY}), score=${score}, isPaused=${isPaused}`);

    currentSpeed = initialSpeed;
    nextSpeedIncreaseScore = scoreThresholdForSpeedIncrease;
    
    if (!spawnFood(true)) {
        console.error("ERROR RESET GAME: Gagal menempatkan makanan awal! Game mungkin tidak bisa dimulai.");
        if (gameIntervalId !== null) { clearInterval(gameIntervalId); gameIntervalId = null; }
        if (context) {
            context.fillStyle = 'red'; context.font = '18px Arial';
            context.textAlign = 'center';
            context.fillText('Error: Gagal memuat makanan!', canvas.width / 2, canvas.height / 2);
        }
        return; 
    }
    
    startGameLoop(currentSpeed); 
    console.log("LOG GAME: resetGame Selesai. Loop seharusnya dimulai.");
}

function drawBackground() { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); }
function drawSnake() {
    // console.log(`LOG DRAW_SNAKE: Dipanggil. Panjang: ${snakeParts ? snakeParts.length : 'null/undef'}.`);
    if (!context || !snakeParts || snakeParts.length === 0) { return; }
    context.fillStyle = 'green';
    snakeParts.forEach(part => context.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize));
}
function drawObstacles() { context.fillStyle = '#808080'; obstacles.forEach(obs => context.fillRect(obs.x*tileSize, obs.y*tileSize, tileSize, tileSize));}
function drawFood() { context.fillStyle = 'red'; context.fillRect(foodX * tileSize, foodY * tileSize, tileSize, tileSize); }
function drawScore() { context.fillStyle = 'black'; context.font = '16px Arial'; context.fillText('Skor: ' + score, 8, 20); }
function drawPausedMessage() { /* ... (tidak berubah) ... */ }

const btnUp = document.getElementById('btnUp');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDown = document.getElementById('btnDown');

function handleDirectionChange(newVX, newVY) {
    // Tidak perlu cek isPaused di sini jika event listener sudah menanganinya
    console.log(`LOG KONTROL: Mencoba ubah arah ke vx=${newVX}, vy=${newVY}. Saat ini: vx=${velocityX}, vy=${velocityY}`);
    const isCurrentlyMovingRight = velocityX === 1;
    const isCurrentlyMovingLeft = velocityX === -1;
    const isCurrentlyMovingUp = velocityY === -1;
    const isCurrentlyMovingDown = velocityY === 1;
    let changed = false;
    if (newVY === -1 && !isCurrentlyMovingDown) { velocityX = 0; velocityY = -1; changed = true; }
    else if (newVY === 1 && !isCurrentlyMovingUp) { velocityX = 0; velocityY = 1; changed = true; }
    else if (newVX === -1 && !isCurrentlyMovingRight) { velocityX = -1; velocityY = 0; changed = true; }
    else if (newVX === 1 && !isCurrentlyMovingLeft) { velocityX = 1; velocityY = 0; changed = true; }

    if (changed) console.log(`LOG KONTROL: Arah DIUBAH ke vx=${velocityX}, vy=${velocityY}`);
    else console.log(`LOG KONTROL: Arah TIDAK diubah.`);
}

// Modifikasi event listener tombol arah agar lebih aman dengan isPaused
if (btnUp) btnUp.addEventListener('click', function() { if (!isPaused) handleDirectionChange(0, -1); else console.log("Input ATAS diabaikan (paused)"); });
if (btnLeft) btnLeft.addEventListener('click', function() { if (!isPaused) handleDirectionChange(-1, 0); else console.log("Input KIRI diabaikan (paused)"); });
if (btnRight) btnRight.addEventListener('click', function() { if (!isPaused) handleDirectionChange(1, 0); else console.log("Input KANAN diabaikan (paused)"); });
if (btnDown) btnDown.addEventListener('click', function() { if (!isPaused) handleDirectionChange(0, 1); else console.log("Input BAWAH diabaikan (paused)"); });

function moveSnake() {
    // console.log(`LOG MOVE_SNAKE (AWAL): vx=${velocityX}, vy=${velocityY}, head=(${headX},${headY})`);
    if (velocityX === 0 && velocityY === 0 && snakeParts.length > 3) { // Cek kondisi aneh
        console.warn("PERINGATAN MOVE_SNAKE: Kecepatan (vx,vy) keduanya 0! Ini tidak seharusnya terjadi.");
        // Untuk mencegah hang, kita coba beri kecepatan default jika ini terjadi
        // Ini hanya fallback darurat, idealnya kita tahu kenapa vx/vy bisa jadi 0.
        // velocityX = 1; // Atau arah terakhir sebelum jadi 0
    }

    let nextHeadX = headX + velocityX; let nextHeadY = headY + velocityY;
    if (nextHeadX < 0) { nextHeadX = tileCountX - 1; } else if (nextHeadX >= tileCountX) { nextHeadX = 0; }
    if (nextHeadY < 0) { nextHeadY = tileCountY - 1; } else if (nextHeadY >= tileCountY) { nextHeadY = 0; }

    for (let obs of obstacles) if (obs.x === nextHeadX && obs.y === nextHeadY) { console.warn("Tabrakan RINTANGAN!"); resetGame(); return; }
    for (let part of snakeParts) if (part.x === nextHeadX && part.y === nextHeadY) { console.warn("Tabrakan DIRI SENDIRI!"); resetGame(); return; }
    
    headX = nextHeadX; headY = nextHeadY;
    let ateFood = false;
    if (headX === foodX && headY === foodY) {
        ateFood = true; score += 10;
        if (!spawnFood()) { resetGame(); return; }
        if (score >= nextSpeedIncreaseScore) { /* ... (logika kecepatan) ... */ }
    }
    const newHead = { x: headX, y: headY };
    snakeParts.unshift(newHead);
    if (!ateFood) { snakeParts.pop(); }
}

// >>> MODIFIKASI: Tambahkan log lebih detail di gameLoop <<<
function gameLoop() {
    console.log(`LOG GAMELOOP: Top. isPaused=${isPaused}. Interval ID: ${gameIntervalId}`);
    if (isPaused) {
        // console.log("LOG GAMELOOP: Dijeda, tidak ada aksi."); // Log ini bisa terlalu sering
        return;
    }
    console.log("LOG GAMELOOP: Menjalankan logika game (move, draw)...");
    moveSnake();
    drawBackground(); drawObstacles(); drawSnake(); drawFood(); drawScore();
}

function togglePauseResume() {
    isPaused = !isPaused;
    if (isPaused) {
        if (gameIntervalId !== null) {
            clearInterval(gameIntervalId);
            // Set gameIntervalId ke null SETELAH clear, agar startGameLoop tahu interval sudah berhenti
            gameIntervalId = null; 
            console.log("LOG PAUSE: Interval dihentikan.");
        } else {
            console.log("LOG PAUSE: Interval sudah null, tidak ada yang dihentikan.");
        }
        if(btnPauseResume) btnPauseResume.textContent = 'Resume';
        console.log("LOG GAME: Game Paused.");
        drawPausedMessage();
    } else {
        if(btnPauseResume) btnPauseResume.textContent = 'Pause';
        console.log(`LOG GAME: Game Resumed. State sblm startGameLoop: vx=${velocityX}, vy=${velocityY}, isPaused=${isPaused}`);
        // Saat resume, panggil startGameLoop untuk memulai kembali intervalnya.
        startGameLoop(currentSpeed);
    }
}
if (btnPauseResume) btnPauseResume.addEventListener('click', togglePauseResume);

// --- MULAI GAME ---
console.log("LOG GAME: --- STARTING GAME (DEBUGGING 'TIDAK BERGERAK') ---");
resetGame();
console.log("LOG GAME: Game script.js dimuat. Perhatikan log untuk detail, terutama `LOG KECEPATAN` dan `LOG GAMELOOP`.");

