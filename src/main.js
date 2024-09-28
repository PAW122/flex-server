import express from "npm:express";
import process from "node:process";
import {Database} from "./datrabase/db.js"
import fs from "node:fs";


const server = express();
const port = 3000;

const db = new Database("./db.json")
db.init()
const chatHistoryFile = './chat_history.txt';
loadChatHistory()

const frontFolder = process.cwd() + "/src/web";
server.use("/", express.static(frontFolder))

server.get("/", (_req, res) => {
    return res.sendFile(process.cwd() + "/src/web/index.html")
})

server.get("/canvas", (req, res ) => {
    return res.sendFile(process.cwd() + "/src/web/art.html")
})

// Middleware do parsowania JSON
server.use(express.json());

let messages = [];
const filePath = "./chat_history.json";
// Endpoint do wysyłania wiadomości
server.post("/send_msg", (req, res) => {
    const { message } = req.body;
    if (message) {
        messages.push(message)
         saveToFile();
        res.status(200).json({ status: 'Message sent' });
    } else {
        res.status(400).json({ status: 'Message cannot be empty' });
    }
});

// Endpoint do odczytywania wiadomości
server.get("/read_msg", (req, res) => {
     readFile((chatHistory) => {
        res.status(200).json(chatHistory);
    });
});

server.post('/db_save', (req, res) => {
    const body = req.body;
    const path = body.path;
    const data = body.data;

    if (!path || !data) {
        res.status(403).json({ message: 'Invalid data' });
        return;
    }

    // Dodajemy dane do bazy (przykład)
    db.write(path, data);

    res.status(200).json({ message: 'Data saved successfully' });
});

server.post("/db_read", (req, res) => {
    const body = req.body
    const path = body.path
    if (!path) {
        res.status(403)
        return
    }
    const data = db.read(path)
    res.status(200).json({data: data});
    return
})

server.get("/get_leaderboard", async (req, res) => {
    const scores = await db.read("score");
    if (!scores) return res.status(403).send("No scores found");

    // Przekształcenie obiektu w tablicę
    const scoresArray = Object.entries(scores).map(([name, data]) => ({
        name,
        score: data.score,
        ...data // Możesz dodać inne właściwości, jeśli chcesz
    }));

    // Sortowanie wyników od największego do najmniejszego
    scoresArray.sort((a, b) => b.score - a.score);

    // Dodawanie numeracji do wyników
    const leaderboard = scoresArray.map((player, index) => ({
        rank: index + 1, // Numeracja zaczyna się od 1
        name: player.name,
        score: player.score,
        ...player // Możesz dodać inne właściwości, jeśli chcesz
    }));

    res.status(200).json(leaderboard);
});
// Nowy endpoint do sprawdzania i kupowania ulepszeń
server.post("/buy_upgrade", (req, res) => {
    const { playerName, upgradeType } = req.body;
    
    if (!playerName || !upgradeType) {
        res.status(400).json({ message: 'Invalid data' });
        return;
    }

    const playerData = db.read(`score.${playerName}`);
    if (!playerData) {
        res.status(404).json({ message: 'Player not found' });
        return;
    }

    let cost;
    switch(upgradeType) {
        case 'autoClicker':
            cost = Math.floor(10 * Math.pow(1.6, playerData.autoClickers || 0));
            break;
        case 'multiplier':
            cost = Math.floor(50 * Math.pow(1.6, playerData.multipliers || 0));
            break;
        case 'goldenMices':
            cost = Math.floor(200 * Math.pow(3, playerData.goldenMices || 0));
            break;
        case 'luckyCoin':
            cost = Math.floor(500 * Math.pow(3, playerData.luckyCoins || 0));
            break;
        case 'timeWarp':
            cost = Math.floor(1000 * Math.pow(5, playerData.timeWarps || 0));
            break;
        default:
            res.status(400).json({ message: 'Invalid upgrade type' });
            return;
    }

    if (playerData.score < cost) {
        res.status(400).json({ message: 'Insufficient funds' });
        return;
    }

    // Aktualizacja danych gracza
    if (upgradeType === "goldenMices") {
             playerData.score -= cost;
             playerData["goldenMices"] = (playerData["goldenMices"] || 0) + 1;
             // Zapisanie zaktualizowanych danych
        db.write(`score.${playerName}`, playerData);

        res.status(200).json({ 
            message: 'Upgrade purchased successfully', 
            newScore: playerData.score,
            newUpgradeCount: playerData[upgradeType]
        });
        return
    } else {
            playerData.score -= cost;
    playerData[upgradeType + 's'] = (playerData[upgradeType + 's'] || 0) + 1;        
    }


    // Zapisanie zaktualizowanych danych
    db.write(`score.${playerName}`, playerData);

    res.status(200).json({ 
        message: 'Upgrade purchased successfully', 
        newScore: playerData.score,
        newUpgradeCount: playerData[upgradeType + 's']
    });
});

// Funkcja do zapisywania wiadomości do pliku
function saveToFile() {
    fs.writeFile(chatHistoryFile, messages.join('\n'), (err) => {
        if (err) {
            console.error('Error saving to file:', err);
        } else {
            console.log('Chat history saved to file.');
        }
    });
}

// Funkcja do odczytywania wiadomości z pliku
function readFile(callback) {
    fs.readFile(chatHistoryFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            callback([]);
        } else {
            const chatHistory = data.split('\n').filter(Boolean); // Filtruje puste linie
            callback(chatHistory);
        }
    });
}

// Funkcja do ładowania historii czatu
function loadChatHistory() {
    readFile((chatHistory) => {
        messages.push(...chatHistory); // Dodaje wczytane wiadomości do tablicy
        console.log('Chat history loaded:', messages);
    });
}

server.listen(port)
