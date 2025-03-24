const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

// redirect to main page
router.get('/', async (req, res) => {
  res.redirect("/")
});

// form to add a new album
router.get('/new', (req, res) => {
    res.render('new', { album: null });  // Pass `null` for new form
});

// add new album
router.post('/new', async (req, res) => {
  const { artist, album, year, imageurl } = req.body;

  try {
      // generate document name
      const docName = `${artist.replace(/[^a-zA-Z0-9]/g, '_')}_${album.replace(/[^a-zA-Z0-9]/g, '_')}`.toLowerCase();
      const docRef = admin.firestore().collection('albums').doc(docName);

      // check if already exists
      const existingDoc = await docRef.get();
      if (existingDoc.exists) {
          return res.status(400).send('Album already exists with this name.');
      }

      const albumsSnapshot = await admin.firestore().collection('albums').get();

      // determine the next ranking and ID
      let maxRanking = 0;
      let maxID = 0;
      albumsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.ranking && typeof data.ranking === 'number') {
              maxRanking = Math.max(maxRanking, data.ranking);
          }
          if (data.albumID && typeof data.albumID === 'number') {
            maxID = Math.max(maxID, data.albumID);
          }
      });
      const newRanking = maxRanking + 1; 
      const albumID = maxID + 1;


      // save album
      await docRef.set({
          albumID,                         
          artist,
          album,
          year,
          imageurl,
          ranking: newRanking,             
          keywords: "",
          genre: "",
          dateadded: Timestamp.now()       
      });

      console.log(`Album added: ${artist} - ${album} with ID: ${albumID}, Rank: ${newRanking}`);
      res.redirect('/');

  } catch (error) {
      console.error('Error adding album:', error);
      res.status(500).send('Error adding album');
  }
});


// display individual album details
router.get('/:albumId', async (req, res) => {
  const albumId = req.params.albumId;

  try {
      let albumDoc = null;

      // if ID is numeric (albumID)
      if (!isNaN(albumId)) {
          const snapshot = await admin.firestore().collection('albums')
              .where('albumID', '==', parseInt(albumId))
              .get();

          if (!snapshot.empty) {
              albumDoc = snapshot.docs[0];  // first matching document
          }
      } else {
          // docName
          albumDoc = await admin.firestore().collection('albums').doc(albumId).get();
      }

      // album not found
      if (!albumDoc || !albumDoc.exists) {
          return res.status(404).send('Album not found');
      }

      const album = { id: albumDoc.id, ...albumDoc.data() };

      album.keywords = album.keywords || "";
      album.genre = album.genre || "";
      album.ranking = album.ranking || 0;
      album.dateadded = album.dateadded || null;

      res.render('details', { album });

  } catch (error) {
      console.error('Error fetching album:', error);
      res.status(500).send('Error loading album');
  }
});


// save album details
router.post('/:albumId', async (req, res) => {
  const albumId = req.params.albumId;
  const { artist, album, year, imageurl, ranking, keywords, genre } = req.body;

  try {
      let albumDoc = null;

      // if albumID
      if (!isNaN(albumId)) {
          const snapshot = await admin.firestore().collection('albums')
              .where('albumID', '==', parseInt(albumId))
              .get();

          if (!snapshot.empty) {
              albumDoc = snapshot.docs[0].ref;
          }
      } else {
          // docName
          albumDoc = admin.firestore().collection('albums').doc(albumId);
      }

      if (!albumDoc) {
          return res.status(404).send('Album not found');
      }

      // update album fields
      await albumDoc.update({
          artist,
          album,
          year,
          imageurl,
          ranking: parseInt(ranking) || 0,
          keywords: keywords || "",
          genre: genre || ""
      });

      console.log(`Updated album: ${albumId}`);
      res.redirect(`/album/${albumId}`);

  } catch (error) {
      console.error('Error updating album:', error);
      res.status(500).send('Error updating album');
  }
});


module.exports = router;
