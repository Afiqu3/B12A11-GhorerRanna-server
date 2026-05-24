const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { createCollections } = require("./config/database");
const { registerRoutes } = require("./routes");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Server is running");
  });

  const collections = createCollections();
  registerRoutes(app, collections, stripe);

  return app;
}

module.exports = { createApp };
