exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "API OK (NO DB)" })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Register OK, lanjut OTP"
    })
  };
};
