import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/games", async (req, res) => {
  const universeIds = req.query.ids;

  if (!universeIds) {
    return res.status(400).json({ error: "Missing universeIds" });
  }

  try {
    const r = await fetch(
      `https://games.roblox.com/v1/games?universeIds=${universeIds}`
    );

    const data = await r.json();

    // CORS (this is the entire point)
    res.set("Access-Control-Allow-Origin", "*");

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Roblox request failed" });
  }
});

app.listen(3000, () => {
  console.log("Proxy running on port 3000");
});
