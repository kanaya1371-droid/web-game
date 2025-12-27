exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { username, whatsapp, password } = body;

    if (!username || !whatsapp || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Data tidak lengkap" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Daftar berhasil, silakan minta OTP"
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Server error",
        error: err.message
      })
    };
  }
};
