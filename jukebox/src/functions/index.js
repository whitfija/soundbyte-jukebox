const path = require('path');
const {onRequest} = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const albumRoutes = require('./routes/albumRoutes');
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();

const app = express();

// public folder --> static files
app.use(express.static('../public'));

app.set('view engine', 'ejs');

app.use('/albums', albumRoutes);

console.log('hello world')

// index route
app.get('/', async (req, res) => {
    const albumsSnapshot = await admin.firestore()
        .collection('albums')
        .orderBy('ranking')
        .get();
    const albums = albumsSnapshot.docs.map(doc => doc.data());
    res.render('index', { albums });
  });

// firebase handles http requests
exports.app = functions.https.onRequest(app);