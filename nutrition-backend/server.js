const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory DB
let nutritionData = [];
let weightData = [];

// ===== NUTRITION =====
app.get("/nutrition", (req, res) => {
  res.json(nutritionData);
});

app.post("/nutrition", (req, res) => {
  nutritionData.push(req.body);
  res.json({ message: "Added" });
});

app.delete("/nutrition/:id", (req, res) => {
  const id = Number(req.params.id);
  nutritionData = nutritionData.filter((item) => item.id !== id);
  res.json({ message: "Deleted" });
});

// ===== WEIGHT =====
app.get("/weight", (req, res) => {
  res.json(weightData);
});

app.post("/weight", (req, res) => {
  weightData.push(req.body);
  res.json({ message: "Added" });
});

app.delete("/weight/:id", (req, res) => {
  const id = Number(req.params.id);
  weightData = weightData.filter((w) => w.id !== id);
  res.json({ message: "Deleted" });
});

app.listen(5000, () => console.log("Server running on port 5000"));