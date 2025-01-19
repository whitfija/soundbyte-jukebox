const functions = require("firebase-functions");
const express = require("express");
const path = require("path");
const app = express();

// public folder --> static files
app.use(express.static(path.join(__dirname, "public")));

// index route
app.get("/", (req, res) => {
  res.send("<h1>soundbyte jukebox</h1>");
});

// firebase handles http requests
exports.app = functions.https.onRequest(app);

