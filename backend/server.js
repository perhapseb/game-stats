import express from "express";
import fetch from "node-fetch";

const app = express();

// ✅ GLOBAL CORS (fixes GitHub Pages fetch issues)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const cache = {};
const CACHE_TTL = 30 * 1000;

// -------- GAMES (stats + icons) --------
app.get("/games", async (req, res) => {
  const ids = req.query.ids;
  if (!ids) return res.status(400).json({ error: "Missing ids" });

  const now = Date.now();

  if (cache[ids] && now - cache[ids].time < CACHE_TTL) {
    return res.json(cache[ids].data);
  }

  try {
    // 1) Game stats
    const gamesRes = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${ids}`
    );
    const games = await gamesRes.json();

    // 2) Game icons (square, reliable)
    const iconsRes = await fetch(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${ids}&size=256x256&format=Png&isCircular=false`
    );
    const icons = await iconsRes.json();

    const iconMap = {};
    if (Array.isArray(icons.data)) {
      icons.data.forEach(i => {
        if (i.state === "Completed") {
          iconMap[i.targetId] = i.imageUrl;
        }
      });
    }

    games.data.forEach(g => {
      g.icon = iconMap[g.id] || null;
    });

    cache[ids] = { time: now, data: games };

    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch games" });
  }
});


// -------- GROUP INFO --------
app.get("/group", async (req, res) => {
  const groupId = req.query.id;
  if (!groupId) return res.status(400).json({ error: "Missing group id" });

  try {
    const r = await fetch(
      `https://groups.roblox.com/v1/groups/${groupId}`
    );
    const data = await r.json();

    res.json({
      name: data.name,
      members: data.memberCount
    });
  } catch (err) {
    console.error("Group fetch error:", err);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Proxy running");
});
