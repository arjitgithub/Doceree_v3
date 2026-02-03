// example: server/routes/vendors.js
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { slug: "factset", name: "FactSet", tagline: "Company level data and analytics" },
    { slug: "sp-global", name: "S&P Global", tagline: "Ratings and market intelligence" },
    { slug: "lseg", name: "LSEG", tagline: "Fixed income, benchmarks, and pricing" },
    { slug: "bloomberg", name: "Bloomberg", tagline: "Market data, news, and analytics" },
    { slug: "morningstar", name: "Morningstar", tagline: "Fund research and investment data" },
    { slug: "preqin", name: "Preqin", tagline: "Private markets data and insights" },
    { slug: "genscape", name: "Genscape", tagline: "Energy and commodities intelligence" },
    { slug: "ravenpack", name: "RavenPack", tagline: "News analytics and alternative data" },
  ]);
});

export default router;
