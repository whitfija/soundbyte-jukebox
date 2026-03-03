const cards = document.querySelectorAll('.battle-card');

let isProcessing = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

cards.forEach(card => {
  card.addEventListener('click', async () => {

    if (isProcessing) return;
    isProcessing = true;

    const winnerID = Number(card.dataset.id);
    const loserCard = [...cards].find(c => c !== card);
    const loserID = Number(loserCard.dataset.id);

    card.classList.add('winner');
    loserCard.classList.add('loser');

    await fetch('/battle/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerID, loserID })
    });

    await sleep(800);

    document.querySelector('.battle-arena').classList.add('fade-out');

    await sleep(300);

    await loadNewPair();

    document.querySelector('.battle-arena').classList.remove('fade-out');
    card.classList.remove('winner');
    loserCard.classList.remove('loser');

    isProcessing = false;
  });
});

const params = new URLSearchParams(window.location.search);
const windowSize = params.get('window') || 250;

async function loadNewPair() {
  const res = await fetch(`/battle/pair?window=${windowSize}`);
  const { albumA, albumB } = await res.json();

  const [cardA, cardB] = document.querySelectorAll('.battle-card');

  updateCard(cardA, albumA);
  updateCard(cardB, albumB);

  document.title = `${shorten(albumA.album)} vs ${shorten(albumB.album)} | soundbyte`;
}

function shorten(str, max = 25) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function updateCard(card, album) {
  card.dataset.id = album.albumID;
  card.querySelector('img').src = album.imageurl;
  card.querySelector('.battle-artist').textContent = album.artist;
  card.querySelector('.battle-album').textContent = album.album;
  card.querySelector('.battle-ranking').textContent = `#${album.ranking}`;
}

document.getElementById('nextBattle')
  .addEventListener('click', loadNewPair);

document.getElementById('difficultySelect')
  .addEventListener('change', e => {
    const value = e.target.value;
    document.querySelector('.battle-arena').classList.add('fade-out');
    window.location.href = `/battle?window=${value}`;
  });