const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;
let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("casino");
  }
  return db;
}

exports.handler = async (event) => {
  try {
    const db = await connectDB();
    const users = db.collection("users");

    const path = event.path.replace("/.netlify/functions/api", "");
    const method = event.httpMethod;

    // TEST API
    if (path === "" && method === "GET") {
      return json({ message: "API running" });
    }

    // REGISTER
    if (path === "/register" && method === "POST") {
      const { username, whatsapp, password } = JSON.parse(event.body);

      if (!username || !whatsapp || !password) {
        return error("Data tidak lengkap");
      }

      const exists = await users.findOne({ username });
      if (exists) return error("Username sudah terdaftar");

      await users.insertOne({
        username,
        whatsapp,
        password,
        coins: 0,
        role: "user",
        status: "pending",
        createdAt: new Date()
      });

      return json({ message: "Daftar berhasil, tunggu OTP admin" });
    }

    // LOGIN
    if (path === "/login" && method === "POST") {
      const { username, password } = JSON.parse(event.body);
      const user = await users.findOne({ username, password });

      if (!user) return error("Login gagal");

      return json({
        userId: user._id,
        coins: user.coins,
        role: user.role
      });
    }

    return error("Route tidak ditemukan", 404);
  } catch (e) {
    return error(e.message);
  }
};

function json(data) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}

function error(message, code = 400) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  };
}
