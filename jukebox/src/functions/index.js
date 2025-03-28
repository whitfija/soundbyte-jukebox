const path = require('path');
const {onRequest} = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require("express");
const albumRoutes = require('./routes/albumRoutes');
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const session = require('express-session');
const FirestoreStore = require('firestore-store')(session);
const cookieParser = require('cookie-parser');

const { requireAuth, checkPassword } = require('./routes/auth');

initializeApp();

const app = express();

app.get('/_ah/health', (req, res) => {
  res.status(200).send('OK');
});

// session setup
app.use(cookieParser());
app.use(
  session({
      store: new FirestoreStore({
          database: admin.firestore()
      }),
      name: '__session',
      secret: "i-quite-like-music-and-my-name-is-jakob-2154",
      resave: true,
      saveUninitialized: true,
      cookie: {
          expires: 86400000, 
          maxAge: 86400000, // 1 day
          secure: false,
          httpOnly: false
      }
  })
);

// public folder --> static files
app.use('/public', express.static('./public'));
app.use(express.urlencoded({extended: true}))

app.set('view engine', 'ejs');

app.use('/album', albumRoutes);

// console.log('hello world')


// index route
app.get('/', async (req, res) => {
    const albumsSnapshot = await admin.firestore()
        .collection('albums')
        .orderBy('ranking')
        .get();
    const albums = albumsSnapshot.docs.map(doc => doc.data());
    res.render('index', { albums });
  });

// search route
app.get('/search', async (req, res) => {
  const albumsSnapshot = await admin.firestore()
      .collection('albums')
      .orderBy('ranking')
      .get();
  const albums = albumsSnapshot.docs.map(doc => doc.data());
  res.render('search', { albums });
});

// sort route
app.get('/sort', requireAuth, async (req, res) => {
  const albumsSnapshot = await admin.firestore()
      .collection('albums')
      .orderBy('ranking')
      .get();
  const albums = albumsSnapshot.docs.map(doc => doc.data());
  res.render('sort', { albums });
});

// login (GET)
app.get('/login', (req, res) => {
  if (req.session.authenticated) {
      return res.redirect('/');
  }
  res.render('login');
});

// login (POST)
app.post('/login', checkPassword, (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.error('Error destroying session:', err);
      }
      res.redirect('/');
  });
});

if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Local server running on port ${PORT}`));
}

// firebase handles http requests
exports.app = functions.https.onRequest(app);