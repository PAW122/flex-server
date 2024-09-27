import { Application, Router } from "https://deno.land/x/oak@v12.1.0/mod.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Database } from "./database/db.js";

const app = new Application();
const router = new Router();
const db = new Database("./db.json");
await db.init();

const frontFolder = `${Deno.cwd()}/src/web`;

// Middleware to serve static files
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: frontFolder,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

// Routes
router.post("/db_save", async (ctx) => {
  const body = await ctx.request.body().value;
  const { path, data } = body;

  if (!path || !data) {
    ctx.response.status = 403;
    ctx.response.body = { message: "Invalid data" };
    return;
  }

  await db.write(path, data);

  ctx.response.status = 200;
  ctx.response.body = { message: "Data saved successfully" };
});

router.post("/db_read", async (ctx) => {
  const body = await ctx.request.body().value;
  const { path } = body;
  if (!path) {
    ctx.response.status = 403;
    return;
  }
  const data = await db.read(path);
  ctx.response.status = 200;
  ctx.response.body = { data: data };
});

router.get("/get_leaderboard", async (ctx) => {
  const scores = await db.read("score");
  if (!scores) {
    ctx.response.status = 403;
    return;
  }
  ctx.response.status = 200;
  ctx.response.body = scores;
});

router.post("/buy_upgrade", async (ctx) => {
  const body = await ctx.request.body().value;
  const { playerName, upgradeType } = body;

  if (!playerName || !upgradeType) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Invalid data" };
    return;
  }

  const playerData = await db.read(`score.${playerName}`);
  if (!playerData) {
    ctx.response.status = 404;
    ctx.response.body = { message: "Player not found" };
    return;
  }

  let cost;
  switch (upgradeType) {
    case "autoClicker":
      cost = Math.floor(10 * Math.pow(2, playerData.autoClickers || 0));
      break;
    case "multiplier":
      cost = Math.floor(50 * Math.pow(2, playerData.multipliers || 0));
      break;
    case "goldenMouse":
      cost = Math.floor(200 * Math.pow(2.5, playerData.goldenMice || 0));
      break;
    case "luckyCoin":
      cost = Math.floor(500 * Math.pow(3, playerData.luckyCoins || 0));
      break;
    case "timeWarp":
      cost = Math.floor(1000 * Math.pow(5, playerData.timeWarps || 0));
      break;
    default:
      ctx.response.status = 400;
      ctx.response.body = { message: "Invalid upgrade type" };
      return;
  }

  if (playerData.score < cost) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Insufficient funds" };
    return;
  }

  // Update player data
  playerData.score -= cost;
  playerData[`${upgradeType}s`] = (playerData[`${upgradeType}s`] || 0) + 1;

  // Save updated data
  await db.write(`score.${playerName}`, playerData);

  ctx.response.status = 200;
  ctx.response.body = {
    message: "Upgrade purchased successfully",
    newScore: playerData.score,
    newUpgradeCount: playerData[`${upgradeType}s`],
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
const port = 3000;
const server = await app.listen({ port });
console.log(`Server running on http://localhost:${port}`);

// Socket.IO setup
const io = new Server(server);

const chatMessages = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  // Send existing messages to the newly connected client
  chatMessages.forEach((msg) => {
    socket.emit("chat message", msg);
  });

  socket.on("chat message", (msg) => {
    chatMessages.push(msg);
    if (chatMessages.length > 100) {
      chatMessages.shift(); // Keep only the last 100 messages
    }
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});