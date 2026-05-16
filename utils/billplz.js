const axios = require('axios');
const config = require('../config');

async function createBill({ name, email, amount, bookingId, bookingRef }) {
  try {
const response = await axios.post(
  config.apiUrl,
  {
    collection_id: config.collectionId,
    name,
    email,
    amount,
    description: `Booking ID: ${bookingId}`,

    // 🔥 IMPORTANT
    callback_url: 'https://supernormally-martial-monica.ngrok-free.dev/api/bookings/billplz-callback',
    redirect_url: `http://localhost:5173/payment-success?bookingId=${bookingId}`,

    reference_1_label: 'Booking ID',
    reference_1: bookingId
  },
  { auth: { username: config.apiKey, password: '' } }
);


    console.log('💸 Billplz response:', response.data);
    return response.data.url;
  } catch (err) {
    console.error('💥 Billplz Error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { createBill };
