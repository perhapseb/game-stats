import express from "express";
import fetch from "node-fetch";

const app = express();

// cache per ids
const cache = {};
const CACHE_TTL = 30 * 1000;

app.get("/games", async (req, res) => {
  const ids = req.query.ids;
  if (!ids) {
    return res.status(400).json({ error: "Missing ids" });
  }

  const now = Date.now();
  if (cache[ids] && now - cache[ids].time < CACHE_TTL) {
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(cache[ids].data);
  }

  try {
    // 1) game stats
    const gamesRes = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${ids}`
    );
    const gamesJson = await gamesRes.json();

    // 2) thumbnails
    const thumbsRes = await fetch(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${ids}&size=256x256&format=Png&isCircular=false`
    );
    const thumbsJson = await thumbsRes.json();

    // map thumbnails by universeId
    const thumbMap = {};
    thumbsJson.data.forEach(t => {
      thumbMap[t.targetId] = t.imageUrl;
    });

    // attach thumbnails
    gamesJson.data.forEach(g => {
      g.thumbnail = thumbMap[g.id] || null;
    });

    cache[ids] = {
      time: now,
      data: gamesJson
    };

    res.set("Access-Control-Allow-Origin", "*");
    res.json(gamesJson);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Roblox data" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Proxy running");
});
