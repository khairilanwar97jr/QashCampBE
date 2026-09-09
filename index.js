const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./config/supabase");

const app = express();
// const port = process.env.PORT || 5000; // 👈 bila nak run local

// middleware
app.use(cors());

// IMPORTANT for Billplz callback & high-res base64 string snapshots
app.use(express.json({ limit: "50mb" })); // 👈 UPDATED TO ALLOW LARGE PAYLOADS
app.use(express.urlencoded({ limit: "50mb", extended: true })); // 👈 UPDATED TO ALLOW LARGE PAYLOADS

// IMPORTANT for Billplz callback
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// ROOT
// --------------------
app.get("/", (req, res) => {
  res.send("Node.js backend running!");
});

// --------------------
// TEST SUPABASE CONNECTION
// --------------------
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("package")
      .select("*");

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// --------------------
// ROUTES
// --------------------
app.use("/api/packages", require("./routes/packages"));
app.use("/api/addon", require("./routes/addOn"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/bookings", require("./routes/booking"));
app.use("/api/bookings", require("./routes/review"));
app.use("/api/reviews", require("./routes/publicReviews"));
app.use("/api/checklist", require("./routes/checklist"));
app.use("/api/moments", require("./routes/moments"));



// --------------------
// START SERVER
// --------------------
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);  // 👈 bila nak run local
// });

// --------------------
// VERCEL FIX
// --------------------
module.exports = app;  // 👈 bila nak run vercel

// 👈 bila nak run vercel masukkan .env file
