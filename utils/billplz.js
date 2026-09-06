const axios = require("axios");
const config = require("../config");

async function createBill(data) {
  try {
    const response = await axios.post(
      config.apiUrl,
      {
        collection_id: config.collectionId,

        name: data.name,
        email: data.email,
        amount: data.amount,
        description: data.description || `Booking ${data.bookingId}`,

        // =========================
        // CALLBACK / REDIRECT
        // =========================
        callback_url: `${config.backendUrl}/api/bookings/billplz-callback`,
        redirect_url: `${config.frontendUrl}/payment-success?bookingId=${data.bookingId}`,

        // =========================
        // REFERENCES (IMPORTANT)
        // =========================
        reference_1_label: "Booking ID",
        reference_1: data.bookingId,

        reference_2_label: "Payment Type",
        reference_2: data.paymentType
      },
      {
        auth: {
          username: config.apiKey,
          password: ""
        }
      }
    );

    console.log("💸 Billplz response:", response.data);

    return response.data.url; // payment URL
  } catch (err) {
    console.error("💥 Billplz Error:", err.response?.data || err.message);
    throw err;
  }
}

async function getBill(id) {
  const response = await axios.get(`${config.apiUrl}/${encodeURIComponent(id)}`, {
    auth: { username: config.apiKey, password: "" },
    timeout: 10000,
  });
  return response.data;
}

module.exports = { createBill, getBill };
