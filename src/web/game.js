let score = 0;
let currentPlayer = null;
let saveInterval = null;
let clickValue = 1;
let autoClickers = 0;
let multipliers = 0;
let goldenMices = 0;
let luckyCoins = 0;
let timeWarps = 0;
let inventory = [];

const scoreElement = document.getElementById('score');
const clickButton = document.getElementById('clickButton');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const logoutButton = document.getElementById('logoutButton');
const saveButton = document.getElementById('saveButton');
const shopButton = document.getElementById('shopButton');
const inventoryButton = document.getElementById('inventoryButton');
const closeShopButton = document.getElementById('closeShop');
const closeInventoryButton = document.getElementById('closeInventory');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authSection = document.getElementById('authSection');
const gameSection = document.getElementById('gameSection');
const shopSection = document.getElementById('shopSection');
const inventorySection = document.getElementById('inventorySection');
const inventoryList = document.getElementById('inventoryList');
const playerNameSpan = document.getElementById('playerName');
const earningAnimationContainer = document.getElementById('earningAnimationContainer');
const leaderboardList = document.getElementById('leaderboardList');
const refreshleaderboard = document.getElementById('refreshButton');

const autoClickerCostElement = document.getElementById('autoClickerCost');
const autoClickerOwnedElement = document.getElementById('autoClickerOwned');
const multiplierCostElement = document.getElementById('multiplierCost');
const multiplierOwnedElement = document.getElementById('multiplierOwned');
const goldenMouseCostElement = document.getElementById('goldenMouseCost');
const goldenMouseOwnedElement = document.getElementById('goldenMouseOwned');
const luckyCoinCostElement = document.getElementById('luckyCoinCost');
const luckyCoinOwnedElement = document.getElementById('luckyCoinOwned');
const timeWarpCostElement = document.getElementById('timeWarpCost');
const timeWarpOwnedElement = document.getElementById('timeWarpOwned');

const buyAutoClickerButton = document.getElementById('buyAutoClicker');
const buyMultiplierButton = document.getElementById('buyMultiplier');
const buyGoldenMouseButton = document.getElementById('buyGoldenMouse');
const buyLuckyCoinButton = document.getElementById('buyLuckyCoin');
const buyTimeWarpButton = document.getElementById('buyTimeWarp');


// ======CHAT
    // chat
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton');

 // Funkcja do odczytywania wiadomości
        const readMessages = async () => {
            const response = await fetch('/read_msg');
            const messages = await response.json();
            chatMessages.innerHTML = messages.map(msg => `<div>${msg}</div>`).join('');
        };

        // Funkcja do wysyłania wiadomości
        const sendMessage = async () => {
            const message = chatInput.value;
            if (message) {
                await fetch('/send_msg', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                });
                chatInput.value = ''; // Wyczyść pole tekstowe
                readMessages(); // Odśwież wiadomości
            }
        };

        sendChatButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
// ======CHAT

function scaleNumber(number) {
    const suffixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let scale = 0;
    let scaledNumber = number;

    while (scaledNumber >= 1000 && scale < suffixes.length - 1) {
        scaledNumber /= 1000;
        scale++;
    }

    if (scale === 0) {
        return Math.floor(scaledNumber).toString();
    }

    scaledNumber = Math.floor(scaledNumber * 10) / 10;

    if (scale <= suffixes.length) {
        return scaledNumber.toFixed(1) + suffixes[scale - 1];
    } else {
        const extraScale = Math.floor((scale - suffixes.length) / suffixes.length) + 1;
        const suffixIndex = (scale - 1) % suffixes.length;
        return scaledNumber.toFixed(1) + suffixes[suffixIndex].repeat(extraScale);
    }
}

function updateScore() {
    scoreElement.textContent = scaleNumber(score);
}

function updateShop() {
    autoClickerOwnedElement.textContent = scaleNumber(autoClickers);
    multiplierOwnedElement.textContent = scaleNumber(multipliers);
    goldenMouseOwnedElement.textContent = scaleNumber(goldenMices);
    luckyCoinOwnedElement.textContent = scaleNumber(luckyCoins);
    timeWarpOwnedElement.textContent = scaleNumber(timeWarps);

    autoClickerCostElement.textContent = scaleNumber(Math.floor(10 * Math.pow(1.6, autoClickers)));
    multiplierCostElement.textContent = scaleNumber(Math.floor(50 * Math.pow(1.6, multipliers)));
    goldenMouseCostElement.textContent = scaleNumber(Math.floor(200 * Math.pow(3, goldenMices)));
    luckyCoinCostElement.textContent = scaleNumber(Math.floor(500 * Math.pow(3, luckyCoins)));
    timeWarpCostElement.textContent = scaleNumber(Math.floor(1000 * Math.pow(5, timeWarps)));
}

function updateInventory() {
    inventoryList.innerHTML = '';
    inventory.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        inventoryList.appendChild(li);
    });
}

async function updateLeaderboard() {
    try {
        let response = await fetch("get_leaderboard", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch leaderboard");
        }

        let leaderboardData = await response.json();
        leaderboardList.innerHTML = '';

        // Iteracja przez dane liderów
        leaderboardData.forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${player.rank}. ${player.name}</span> <span>${scaleNumber(player.score)}</span>`;
            leaderboardList.appendChild(li);
        });

        readMessages()
    } catch (error) {
        console.error("Error updating leaderboard:", error);
    }
}


function startAutoSave() {
    saveInterval = setInterval(saveGame, 1200); // Save every minute
}

function stopAutoSave() {
    clearInterval(saveInterval);
}

async function saveGame() {
    if (!currentPlayer) return;

    try {
        let response = await fetch("db_save", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: `score.${currentPlayer}`,
                data: { 
                    score: score,
                    autoClickers: autoClickers,
                    multipliers: multipliers,
                    goldenMices: goldenMices,
                    luckyCoins: luckyCoins,
                    timeWarps: timeWarps,
                    inventory: inventory
                }
            })
        });

        if (!response.ok) {
            throw new Error("Save failed");
        }

        console.log("Game saved successfully");
        updateLeaderboard();
    } catch (error) {
        console.error("Error saving game:", error);
        alert("Failed to save game. Please try again.");
    }
}

async function loadGame() {
    if (!currentPlayer) return;

    try {
        let response = await fetch("db_read", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: `score.${currentPlayer}`
            })
        });

        if (!response.ok) {
            throw new Error("Load failed");
        }

        let body = await response.json();
        if (body && body.data) {
            score = body.data.score || 0;
            autoClickers = body.data.autoClickers || 0;
            multipliers = body.data.multipliers || 0;
            goldenMices = body.data.goldenMices || 0;
            luckyCoins = body.data.luckyCoins || 0;
            timeWarps = body.data.timeWarps || 0;
            inventory = body.data.inventory || [];
            console.log(body.data)
            updateScore();
            updateShop();
            updateInventory();
            console.log("Game loaded successfully");
        }
    } catch (error) {
        console.error("Error loading game:", error);
    }
}

async function authenticate(isSignup) {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username || !password) {
        alert("Please enter both username and password");
        return;
    }

    try {
        let response = await fetch(isSignup ? "db_save" : "db_read", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: `users.${username}`,
                data: isSignup ? { password: password } : undefined
            })
        });

        if (!response.ok) {
            throw new Error("Authentication failed");
        }

        if (!isSignup) {
            let body = await response.json();
            if (!body || !body.data || body.data.password !== password) {
                throw new Error("Invalid credentials");
            }
        }

        currentPlayer = username;
        playerNameSpan.textContent = username;
        authSection.style.display = 'none';
        gameSection.style.display = 'block';
        loadGame();
        startAutoSave();
        startAutoClicker();
        updateLeaderboard();
    } catch (error) {
        console.error("Authentication error:", error);
        alert(isSignup ? "Signup failed. Please try again." : "Login failed. Please check your credentials.");
    }
}

function logout() {
    currentPlayer = null;
    score = 0;
    autoClickers = 0;
    multipliers = 0;
    goldenMices = 0;
    luckyCoins = 0;
    timeWarps = 0;
    inventory = [];
    clickValue = 1;
    updateScore();
    updateShop();
    updateInventory();
    stopAutoSave();
    stopAutoClicker();
    authSection.style.display = 'block';
    gameSection.style.display = 'none';
    shopSection.style.display = 'none';
    inventorySection.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
}

function showEarningAnimation(amount, x, y) {
    const animationElement = document.createElement('div');
    animationElement.className = 'earning-animation';
    animationElement.textContent = '+' + scaleNumber(amount);
    animationElement.style.left = x + 'px';
    animationElement.style.top = y + 'px';
    earningAnimationContainer.appendChild(animationElement);

    setTimeout(() => {
        earningAnimationContainer.removeChild(animationElement);
    }, 1000);
}

let clickCount = 0;
let lastClickTime = Date.now();

function click(event) {
    const currentTime = Date.now();
    
    // Sprawdź, czy minęła sekunda od ostatniego resetu
    if (currentTime - lastClickTime >= 1000) {
        clickCount = 0; // Resetuj licznik kliknięć
        lastClickTime = currentTime; // Zaktualizuj czas ostatniego resetu
    }

    clickCount++; // Zwiększ licznik kliknięć

    // Sprawdź, czy liczba kliknięć przekracza 10
    if (clickCount > 10) {
        return; // Nie zwiększaj wyniku
    }

    let increment = clickValue * (Math.pow(1.5, multipliers));
    if (Math.random() < 0.05 * goldenMices) {
        increment *= 10;
    }
    if (Math.random() < 0.01 * luckyCoins) {
        increment *= 100;
    }
    score += increment;
    updateScore();
    showEarningAnimation(increment, event.clientX, event.clientY);
}

let autoClickerInterval;

function startAutoClicker() {
    autoClickerInterval = setInterval(() => {
        let increment = autoClickers * clickValue * (Math.pow(1.5, multipliers)) * (Math.pow(1.1, timeWarps));
        score += increment;
        updateScore();
        if (increment > 0) {
            showEarningAnimation(increment, window.innerWidth / 2, window.innerHeight / 2);
        }
    }, 1000 / (1 + 0.1 * timeWarps));
}

function stopAutoClicker() {
    clearInterval(autoClickerInterval);
}

async function buyUpgrade(type) {
    console.log("buy-actions")
    if (!currentPlayer) return;

    try {
        let response = await fetch("/buy_upgrade", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerName: currentPlayer,
                upgradeType: type
            })
        });

        if (!response.ok) {
            console.log(response)
            console.log(type)
            console.log(currentPlayer)
            throw new Error("Purchase failed");
        }

        let result = await response.json();
        score = result.newScore;

        switch(type) {
            case 'autoClicker':
                autoClickers = result.newUpgradeCount;
                break;
            case 'multiplier':
                multipliers = result.newUpgradeCount;
                break;
            case 'goldenMices':
                goldenMices = result.newUpgradeCount;
                break;
            case 'luckyCoin':
                luckyCoins = result.newUpgradeCount;
                break;
            case 'timeWarp':
                timeWarps = result.newUpgradeCount;
                stopAutoClicker();
                startAutoClicker();
                break;
        }

        updateScore();
        updateShop();
        console.log("Upgrade purchased successfully");
        saveGame();
    } catch (error) {
        console.error("Error purchasing upgrade:", error);
        alert("Failed to purchase upgrade. Please try again.");
    }
}

clickButton.addEventListener('click', click);
loginButton.addEventListener('click', () => authenticate(false));
signupButton.addEventListener('click', () => authenticate(true));
logoutButton.addEventListener('click', logout);
saveButton.addEventListener('click', saveGame);
shopButton.addEventListener('click', () => {
    shopSection.style.display = 'block';
    inventorySection.style.display = 'none';
});
// refreshleaderboard.addEventListener('click', updateLeaderboard)
inventoryButton.addEventListener('click', () => {
    inventorySection.style.display = 'block';
    shopSection.style.display = 'none';
});
closeShopButton.addEventListener('click', () => shopSection.style.display = 'none');
closeInventoryButton.addEventListener('click', () => inventorySection.style.display = 'none');

buyAutoClickerButton.addEventListener('click', () => buyUpgrade('autoClicker'));
buyMultiplierButton.addEventListener('click', () => buyUpgrade('multiplier'));
buyGoldenMouseButton.addEventListener('click', () => buyUpgrade('goldenMices'));
buyLuckyCoinButton.addEventListener('click', () => buyUpgrade('luckyCoin'));
buyTimeWarpButton.addEventListener('click', () => buyUpgrade('timeWarp'));

updateScore();
updateShop();
updateInventory();
updateLeaderboard();

// Update leaderboard every 1 minutes
setInterval(updateLeaderboard, 60000);
