const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Route to fetch albums
router.get('/', async (req, res) => {
  const albumsSnapshot = await admin.firestore().collection('albums').get();
  const albums = albumsSnapshot.docs.map(doc => doc.data());
  res.render('index', { albums });
});

// Route to add a new album
router.post('/new', async (req, res) => {
  const { artist, album, year } = req.body;
  await admin.firestore().collection('albums').add({
    artist, album, year, dateadded: admin.firestore.Timestamp.now()
  });
  res.redirect('/'); // Redirect back to album list
});

// Route to delete an album
router.delete('/:albumId', async (req, res) => {
  const albumId = req.params.albumId;
  await admin.firestore().collection('albums').doc(albumId).delete();
  res.status(200).send('Album deleted');
});

module.exports = router;
