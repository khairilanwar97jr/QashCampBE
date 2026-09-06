const axios = require("axios");

const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

function getEmailJsConfig() {
  const config = {
    serviceId: process.env.EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID,
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing EmailJS configuration: ${missing.join(", ")}`);
  }

  return config;
}

async function sendPaymentReceipt(templateParams) {
  const config = getEmailJsConfig();

  const response = await axios.post(
    EMAILJS_SEND_URL,
    {
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      accessToken: config.privateKey,
      template_params: templateParams,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );

  return response.data;
}

module.exports = { sendPaymentReceipt };
