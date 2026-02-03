import express from "express";
import cors from "cors";
import { vendors } from "./data/vendors.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/vendors", (req, res) => {
  res.json(vendors);
});

app.get("/api/vendors/:slug", (req, res) => {
  const vendor = vendors.find(v => v.slug === req.params.slug);
  if (!vendor) return res.status(404).json({ error: "Vendor not found" });
  res.json(vendor);
});

const PORT = process.env.PORT || 5175;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
