import express from "express";
import fetch from "node-fetch";

const app = express();
const cache = {};
const CACHE_TTL = 30 * 1000;

// -------- GAMES (stats + thumbnails) --------
app.get("/games", async (req, res) => {
  const ids = req.query.ids;
  if (!ids) return res.status(400).json({ error: "Missing ids" });

  const universeIds = ids.split(",").map(Number);

  try {
    // 1) Game stats
    const gamesRes = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${ids}`
    );
    const games = await gamesRes.json();

    // 2) Game thumbnails (CORRECT METHOD)
    const thumbsRes = await fetch(
      "https://thumbnails.roblox.com/v1/games/multiget/thumbnails",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universeIds,
          size: "768x432",
          format: "Png",
          isCircular: false
        })
      }
    );

    const thumbs = await thumbsRes.json();

    // map thumbnails
    const thumbMap = {};
    thumbs.data.forEach(t => {
      if (t.state === "Completed") {
        thumbMap[t.targetId] = t.imageUrl;
      }
    });

    // attach thumbnails
    games.data.forEach(g => {
      g.thumbnail = thumbMap[g.id] || null;
    });

    res.set("Access-Control-Allow-Origin", "*");
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

    res.set("Access-Control-Allow-Origin", "*");
    res.json({
      name: data.name,
      members: data.memberCount
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Proxy running");
});
