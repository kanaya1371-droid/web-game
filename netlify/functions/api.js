kconst express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// =====================
// DB CONNECT
// =====================
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}
connectDB();

// =====================
// MODELS
// =====================
const UserSchema = new mongoose.Schema({
  username: String,
  whatsapp: String,
  password: String,
  status: { type: String, default: "pending" }, // pending | active
  bannedUntil: Date,
  coins: { type: Number, default: 0 },
  controlMode: { type: String, default: "normal" } // normal | lose | win
});
const User = mongoose.model("User", UserSchema);

const OtpSchema = new mongoose.Schema({
  username: String,
  code: String,
  purpose: String,
  expiresAt: Date
});
const Otp = mongoose.model("Otp", OtpSchema);

const RequestSchema = new mongoose.Schema({
  username: String,
  amount: Number,
  type: String, // deposit | withdraw
  status: { type: String, default: "pending" }
});
const Request = mongoose.model("Request", RequestSchema);

// =====================
// REGISTER
// =====================
app.post("/register", async (req, res) => {
  const { username, whatsapp, password } = req.body;
  if (!username || !whatsapp || !password)
    return res.status(400).json({ msg: "Data tidak lengkap" });

  if (await User.findOne({ username }))
    return res.status(400).json({ msg: "Username sudah ada" });

  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, whatsapp, password: hash });
  res.json({ msg: "Daftar berhasil, minta OTP ke admin" });
});

// =====================
// LOGIN
// =====================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ msg: "User tidak ada" });
  if (user.status !== "active")
    return res.status(403).json({ msg: "Akun belum aktif" });

  if (user.bannedUntil && Date.now() < user.bannedUntil)
    return res.status(403).json({ msg: "Akun dibanned" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ msg: "Password salah" });

  res.json({
    msg: "Login berhasil",
    userId: user._id,
    coins: user.coins,
    controlMode: user.controlMode
  });
});

// =====================
// ADMIN: LIST USERS
// =====================
app.get("/admin/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// =====================
// ADMIN: SET CONTROL MODE
// =====================
app.post("/admin/control", async (req, res) => {
  const { username, mode } = req.body;
  if (!["normal", "lose", "win"].includes(mode))
    return res.status(400).json({ msg: "Mode tidak valid" });

  await User.updateOne({ username }, { controlMode: mode });
  res.json({ msg: "Control mode diupdate" });
});

// =====================
// ADMIN: GENERATE OTP
// =====================
app.post("/admin/generate-otp", async (req, res) => {
  const { username, purpose } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ msg: "User tidak ada" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await Otp.deleteMany({ username, purpose });

  await Otp.create({
    username,
    code,
    purpose,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  res.json({ otp: code, whatsapp: user.whatsapp });
});

// =====================
// VERIFY OTP
// =====================
app.post("/verify-otp", async (req, res) => {
  const { username, code } = req.body;
  const otp = await Otp.findOne({ username, code, purpose: "register" });
  if (!otp || Date.now() > otp.expiresAt)
    return res.status(400).json({ msg: "OTP tidak valid" });

  await User.updateOne({ username }, { status: "active" });
  await Otp.deleteMany({ username });
  res.json({ msg: "Akun aktif" });
});

// =====================
// GAME BET + CONTROL MODE
// =====================
app.post("/bet", async (req, res) => {
  const { userId, bet, win } = req.body;
  const user = await User.findById(userId);

  if (!user) return res.status(404).json({ msg: "User tidak ada" });

  const delta = win ? bet : -bet;
  user.coins += delta;
  await user.save();

  res.json({ msg: "OK", controlMode: user.controlMode });
});

module.exports.handler = serverless(app);
