const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { requireAuth } = require('./auth');

async function getBattlePair(windowSize = 250) {
  const snapshot = await admin.firestore()
    .collection('albums')
    .select('albumID', 'artist', 'album', 'imageurl', 'ranking')
    .get();

  const albums = snapshot.docs.map(d => d.data());

  if (albums.length < 2) {
    throw new Error('not enough albums');
  }

  const albumA = albums[Math.floor(Math.random() * albums.length)];

  const window = windowSize;

  const nearby = albums.filter(a =>
    a.albumID !== albumA.albumID &&
    Math.abs(a.ranking - albumA.ranking) <= window
  );

  const pool = nearby.length
    ? nearby
    : albums.filter(a => a.albumID !== albumA.albumID);

  const albumB = pool[Math.floor(Math.random() * pool.length)];

  return { albumA, albumB };
}

// /battle
router.get('/', requireAuth, async (req, res) => {
  try {
    const windowSize = Number(req.query.window) || 250;
    const { albumA, albumB } = await getBattlePair(windowSize);
    res.render('battle', { albumA, albumB, windowSize  });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.get('/pair', requireAuth, async (req, res) => {
  try {
    const windowSize = Number(req.query.window) || 250;
    const pair = await getBattlePair(windowSize);
    res.json(pair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/move', requireAuth, async (req, res) => {
  const { winnerID, loserID } = req.body;

  const albumsRef = admin.firestore().collection('albums');

  try {
    const winnerSnap = await albumsRef.where('albumID', '==', winnerID).get();
    const loserSnap = await albumsRef.where('albumID', '==', loserID).get();

    if (winnerSnap.empty || loserSnap.empty) {
      return res.status(404).json({ success: false });
    }

    const winnerDoc = winnerSnap.docs[0];
    const loserDoc = loserSnap.docs[0];

    const winnerRank = winnerDoc.data().ranking;
    const loserRank = loserDoc.data().ranking;

    if (winnerRank < loserRank) {
      return res.json({ success: true });
    }

    const batch = admin.firestore().batch();

    const shiftSnapshot = await albumsRef
      .where('ranking', '>=', loserRank)
      .where('ranking', '<', winnerRank)
      .get();

    shiftSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        ranking: doc.data().ranking + 1
      });
    });

    batch.update(winnerDoc.ref, { ranking: loserRank });

    await batch.commit();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;