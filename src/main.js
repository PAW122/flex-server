import express from "npm:express";
import process from "node:process";
import {Database} from "./datrabase/db.js"

const server = express();
const port = 3000;

const db = new Database("./db.json")
db.init()

const frontFolder = process.cwd() + "/src/web";
server.use("/", express.static(frontFolder))

server.get("/", (_req, res) => {
    return res.sendFile(process.cwd() + "/src/web/index.html")
})

// Middleware do parsowania JSON
server.use(express.json());

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
    const scores = await db.read("score")
    if (!scores) return res.status(403);
    res.status(200).json(scores)
    return
})

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
            cost = Math.floor(10 * Math.pow(2, playerData.autoClickers || 0));
            break;
        case 'multiplier':
            cost = Math.floor(50 * Math.pow(2, playerData.multipliers || 0));
            break;
        case 'goldenMouse':
            cost = Math.floor(200 * Math.pow(2.5, playerData.goldenMice || 0));
            break;
        case 'luckyCoin':
            cost = Math.floor(500 * Math.pow(3, playerData.goldenMice || 0));
            break;
        case 'timeWarp':
            cost = Math.floor(1000 * Math.pow(5, playerData.goldenMice || 0));
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
    playerData.score -= cost;
    playerData[upgradeType + 's'] = (playerData[upgradeType + 's'] || 0) + 1;

    // Zapisanie zaktualizowanych danych
    db.write(`score.${playerName}`, playerData);

    res.status(200).json({ 
        message: 'Upgrade purchased successfully', 
        newScore: playerData.score,
        newUpgradeCount: playerData[upgradeType + 's']
    });
});

server.listen(port)