// index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

require("dotenv").config();   // ✅ Loads .env variables
const packagesRouter = require("./routes/packages");
app.get("/api/packages", (req, res) => {
  const packages = [
    { id: 1, name: "Pakej A", enabled: true },
    { id: 2, name: "Pakej B", enabled: true },
    { id: 3, name: "Pakej C", enabled: false }
  ];

  res.json(packages);
});

const addOnRouter = require("./routes/addOn");
app.use("/api/addon", addOnRouter);


// TEST API
app.get("/", (req, res) => {
  res.send("Node.js backend running!");
});

// START SERVER
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
