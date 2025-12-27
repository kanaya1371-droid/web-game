// netlify/functions/api.js

let USERS = [];
let OTPS = [];

// GANTI KEY ADMIN DI SINI
const ADMIN_KEY = "agung137";

// helper response
const res = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  const path = event.path.replace("/.netlify/functions/api", "");
  const data = event.body ? JSON.parse(event.body) : {};

  // ================= REGISTER =================
  if (path === "/register") {
    const { username, whatsapp, password } = data;
    if (!username || !whatsapp || !password) {
      return res(400, { message: "Data tidak lengkap" });
    }

    const exist = USERS.find(u => u.username === username);
    if (exist) {
      return res(400, { message: "Username sudah ada" });
    }

    USERS.push({
      username,
      whatsapp,
      password,
      saldo: 0,
      status: "pending",
      bannedUntil: null,
    });

    return res(200, { message: "Daftar berhasil, lanjut OTP" });
  }

  // ================= LOGIN =================
  if (path === "/login") {
    const { username, password } = data;
    const user = USERS.find(
      u => u.username === username && u.password === password
    );

    if (!user) return res(401, { message: "Login gagal" });

    if (user.bannedUntil && Date.now() < user.bannedUntil) {
      return res(403, { message: "Akun dibanned" });
    }

    if (user.status !== "active") {
      return res(403, { message: "Belum verifikasi OTP" });
    }

    return res(200, { message: "Login sukses", user });
  }

  // ================= REQUEST OTP =================
  if (path === "/request-otp") {
    const { username } = data;
    const user = USERS.find(u => u.username === username);
    if (!user) return res(404, { message: "User tidak ditemukan" });

    return res(200, {
      message: "Minta OTP via WhatsApp admin",
      wa:
        "https://wa.me/628XXXXXXX?text=Halo admin, minta OTP untuk user " +
        username,
    });
  }

  // ================= VERIFY OTP =================
  if (path === "/verify-otp") {
    const { username, otp } = data;
    const valid = OTPS.find(
      o => o.username === username && o.otp === otp
    );
    if (!valid) return res(400, { message: "OTP salah" });

    const user = USERS.find(u => u.username === username);
    if (user) user.status = "active";

    return res(200, { message: "OTP benar, akun aktif" });
  }

  // ================= ADMIN LOGIN =================
  if (path === "/admin/login") {
    if (data.key !== ADMIN_KEY) {
      return res(401, { message: "Key admin salah" });
    }
    return res(200, { message: "Admin login sukses" });
  }

  // ================= ADMIN USERS =================
  if (path === "/admin/users") {
    return res(200, USERS);
  }

  // ================= ADMIN OTP GENERATE =================
  if (path === "/admin/generate-otp") {
    const { username } = data;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    OTPS.push({ username, otp });

    const user = USERS.find(u => u.username === username);
    if (!user) return res(404, { message: "User tidak ada" });

    return res(200, {
      otp,
      wa:
        "https://wa.me/" +
        user.whatsapp.replace(/^0/, "62") +
        "?text=Kode%20OTP%20kamu:%20" +
        otp,
    });
  }

  // ================= ADMIN BAN =================
  if (path === "/admin/ban") {
    const { username, minutes } = data;
    const user = USERS.find(u => u.username === username);
    if (!user) return res(404, { message: "User tidak ada" });

    user.bannedUntil =
      minutes === "permanent"
        ? Infinity
        : Date.now() + minutes * 60000;

    return res(200, { message: "User dibanned" });
  }

  return res(404, { message: "Endpoint tidak ditemukan" });
};
