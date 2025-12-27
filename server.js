const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend OK - Railway");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ⛔ JANGAN HARDCODE PORT
const PORT = process.env.PORT;

if (!PORT) {
  console.error("PORT environment variable not set");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
