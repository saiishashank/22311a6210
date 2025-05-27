const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const VALID_IDS = ["p", "f", "e", "r"];
const WINDOW_SIZE = 10;
const THIRD_PARTY_URLS = {
  p: "http://20.244.56.144/evaluation-service/primes",
  f: "http://20.244.56.144/evaluation-service/fibo",
  e: "http://20.244.56.144/evaluation-service/even",
  r: "http://20.244.56.144/evaluation-service/rand",
};
const TOKEN = process.env.BEARER_TOKEN;

let windowState = [];

async function fetchNumbersById(numberid) {
  let numbers = [];

  try {
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => source.cancel(), 500);

    const response = await axios.get(THIRD_PARTY_URLS[numberid], {
      timeout: 500,
      cancelToken: source.token,
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    clearTimeout(timeout);

    numbers = Array.isArray(response.data.numbers) ? response.data.numbers : [];
  } catch {
    numbers = [];
  }

  const merged = [...windowState, ...numbers];
  const unique = Array.from(new Set(merged));
  windowState = unique.slice(-WINDOW_SIZE);

  const avg =
    windowState.length > 0
      ? (
          windowState.reduce((sum, n) => sum + Number(n), 0) /
          windowState.length
        ).toFixed(2)
      : 0.0;

  return {
    windowCurrState: windowState,
    numbers,
    avg: Number(avg),
  };
}

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/numbers/:numberid", async (req, res) => {
  const { numberid } = req.params;

  if (!VALID_IDS.includes(numberid)) {
    return res.status(400).json({ error: "Invalid numberid" });
  }

  try {
    const data = await fetchNumbersById(numberid);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
