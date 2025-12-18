import express from "express";
import fetch from "node-fetch";

const app = express();

// --- simple in-memory cache ---
let cache = {};
const CACHE_TTL = 30 * 1000; // 30 seconds

app.get("/games", async (req, res) => {
  const universeIds = req.query.ids;
  if (!universeIds) {
    return res.status(400).json({ error: "Missing universeIds" });
  }

  const now = Date.now();

  // return cached response if still valid
  if (cache[universeIds] && now - cache[universeIds].time < CACHE_TTL) {
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(cache[universeIds].data);
  }

  try {
    const r = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeIds}`
    );

    const data = await r.json();

    // store in cache
    cache[universeIds] = {
      data,
      time: now
    };

    res.set("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch {
    res.status(500).json({ error: "Roblox request failed" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Proxy running");
});
