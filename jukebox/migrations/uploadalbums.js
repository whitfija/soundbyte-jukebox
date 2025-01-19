const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// load albums data from .json file (sql export)
const albums = JSON.parse(fs.readFileSync('./1-18export.json', 'utf8'));

async function uploadAlbums() {
  const batch = db.batch();

  albums.forEach((album) => {
    const docName = `${album.artist.replace(/[^a-zA-Z0-9]/g, '_')}_${album.album.replace(/[^a-zA-Z0-9]/g, '_')}`.toLowerCase();
    const docRef = db.collection('albums').doc(docName);
    batch.set(docRef, { ...album, dateadded: admin.firestore.Timestamp.now() });

  });

  await batch.commit(); // batch write
  console.log('albums uploaded successfully!');
}

uploadAlbums().catch((error) => {
  console.error('error uploading albums:', error);
});
