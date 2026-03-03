const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');
const { requireAuth } = require('./auth')

// redirect to main page
router.get('/', async (req, res) => {
  res.redirect("/")
});

// form to add a new album
router.get('/new', requireAuth, (req, res) => {
    res.render('new', { album: null });  // null for new form
});

// add new album
router.post('/new', async (req, res) => {
  const { artist, album, year, imageurl, keywords, genre} = req.body;

  try {
      // generate document name
      const docName = `${artist.replace(/[^a-zA-Z0-9]/g, '_')}_${album.replace(/[^a-zA-Z0-9]/g, '_')}`.toLowerCase();
      const docRef = admin.firestore().collection('albums').doc(docName);

      // check if already exists
      const existingDoc = await docRef.get();
      if (existingDoc.exists) {
          return res.status(400).send('album already exists with this name.');
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
          keywords: keywords || "",
          genre: genre || "",
          dateadded: Timestamp.now()       
      });

      console.log(`album added: ${artist} - ${album} with ID: ${albumID}, Rank: ${newRanking}`);
      res.redirect('/');

  } catch (error) {
      console.error('error adding album:', error);
      res.status(500).send('error adding album');
  }
});

// save updated album order from sort page
router.post('/save-order', async (req, res) => {
    const { albums } = req.body;
    console.log('processing album order update...')
    // console.log('first 5 albums being processed:', albums.slice(0, 5));

    try {
        const batch = admin.firestore().batch();
        const albumsRef = admin.firestore().collection('albums');
        
        // convert ids to numbers
        const albumIDs = albums.map(a => Number(a.id));
        
        // processing in chunks to avoid limit on IN calls
        const chunkSize = 30;
        let allDocs = [];
        
        for (let i = 0; i < albumIDs.length; i += chunkSize) {
            const chunk = albumIDs.slice(i, i + chunkSize);
            const snapshot = await albumsRef.where('albumID', 'in', chunk).get();
            allDocs.push(...snapshot.docs);
        }

        // check matches
        const foundIDs = allDocs.map(doc => doc.data().albumID);
        const missingAlbums = albums.filter(a => !foundIDs.includes(Number(a.id)));
        
        if (missingAlbums.length > 0) {
            console.error('missing albums:', missingAlbums);
            return res.status(404).json({
                success: false,
                message: 'some albums not found',
                missing: missingAlbums.map(a => a.id)
            });
        }

        // update rankings
        allDocs.forEach(doc => {
            const albumData = albums.find(a => Number(a.id) === doc.data().albumID);
            batch.update(doc.ref, { ranking: albumData.ranking });
        });

        await batch.commit();
        res.status(200).json({ success: true });
        console.log('---- successful album order update')
        
    } catch (error) {
        console.error('error sorting albums:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// get random album
router.get('/random', async (req, res) => {
    try {
        const albumsRef = admin.firestore().collection('albums');
        const snapshot = await albumsRef.select('albumID').get();
        
        if (snapshot.empty) {
            return res.status(404).send('no albums found');
        }
        
        const albumIDs = snapshot.docs.map(doc => doc.id);
        const randomIndex = Math.floor(Math.random() * albumIDs.length);
        const randomAlbumID = albumIDs[randomIndex];
        
        res.redirect(`/album/${randomAlbumID}`);
        
    } catch (error) {
        console.error('error getting random album:', error);
        res.status(500).send('error getting random album');
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
          return res.status(404).send('album not found');
      }

      const album = { id: albumDoc.id, ...albumDoc.data() };

      album.keywords = album.keywords || "";
      album.genre = album.genre || "";
      album.ranking = album.ranking || 0;
      album.dateadded = album.dateadded || null;

      res.render('details', { album });

  } catch (error) {
      console.error('error fetching album:', error);
      res.status(500).send('error loading album');
  }
});

// save album details
router.post('/:albumId', requireAuth, async (req, res) => {
  const albumId = req.params.albumId;
  const { artist, album, year, imageurl, keywords, genre } = req.body;

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
          return res.status(404).send('album not found');
      }

      // update album fields
      await albumDoc.update({
          artist,
          album,
          year,
          imageurl,
          keywords: keywords || "",
          genre: genre || ""
      });

      console.log(`updated album: ${albumId}`);
      res.redirect(`/album/${albumId}`);

  } catch (error) {
      console.error('error updating album:', error);
      res.status(500).send('error updating album');
  }
});

module.exports = router;
