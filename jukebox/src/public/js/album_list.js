const toggleButton = document.getElementById('toggleView');
const toggleIcon = document.getElementById('toggleIcon');
const gridView = document.querySelector('.albums-grid');
const listView = document.querySelector('.albums-list');
let isGridView = true;  // grid view default

let isAscending = true;
const toggleSortDirectionButton = document.getElementById('toggleSortDirection');

// listview / gridview toggle
if (toggleButton && gridView && listView) {
    toggleButton.addEventListener('click', function () {
        isGridView = !isGridView;
        if (isGridView) {
            gridView.style.display = 'flex';
            listView.style.display = 'none';
            toggleIcon.src = '/img/nav/grid_icon.png';  // grid icon
        } else {
            gridView.style.display = 'none';
            listView.style.display = 'flex';
            toggleIcon.src = '/img/nav/list_icon.png';  // list icon
        }
    });
}

// search vars
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchByTitle = document.getElementById('searchByTitle');
const searchByArtist = document.getElementById('searchByArtist');
const searchByYear = document.getElementById('searchByYear');
const sortBySelect = document.getElementById('sortBy');

// search & filter
function filterAlbums() {
    const query = searchInput.value.toLowerCase();
    const isTitleChecked = searchByTitle.checked;
    const isArtistChecked = searchByArtist.checked;
    const isYearChecked = searchByYear.checked;
    const sortBy = sortBySelect.value;

    // get all albums in both views
    const albums = document.querySelectorAll('.album-row, .album-card');
    const albumArray = Array.from(albums); // convert for sorting

    albumArray.forEach(album => {
        const title = album.querySelector('.album-name span')?.innerText.toLowerCase() || album.querySelector('.album-name')?.innerText.toLowerCase() || '';
        const artist = album.querySelector('.album-artist span')?.innerText.toLowerCase() || album.querySelector('.album-artist')?.innerText.toLowerCase() || '';
        const year = album.querySelector('.album-year span')?.innerText.toLowerCase() || album.querySelector('.album-year')?.innerText.toLowerCase() || '';
        const ranking = album.querySelector('.album-ranking')?.innerText.replace('#', '') || ''; // remove '#' from ranking

        let matches = false;

        if (isTitleChecked && title.includes(query)) {
            matches = true;
        }
        if (isArtistChecked && artist.includes(query)) {
            matches = true;
        }
        if (isYearChecked && year.includes(query)) {
            matches = true;
        }

        album.style.display = matches ? 'flex' : 'none';

        if (matches) {
            album.setAttribute('data-view', album.closest('.albums-grid') ? 'grid' : 'list');
        }
    });

    // sort
    const sortedAlbums = albumArray.filter(album => album.style.display === 'flex'); // visible albums

    sortedAlbums.sort((a, b) => {
        let aValue = '';
        let bValue = '';

        switch (sortBy) {
            case 'ranking':
                aValue = parseInt(a.querySelector('.album-ranking').innerText.replace('#', ''));
                bValue = parseInt(b.querySelector('.album-ranking').innerText.replace('#', ''));
                break;
            case 'album':
                aValue = a.querySelector('.album-name').innerText.toLowerCase();
                bValue = b.querySelector('.album-name').innerText.toLowerCase();
                break;
            case 'artist':
                aValue = a.querySelector('.album-artist').innerText.toLowerCase();
                bValue = b.querySelector('.album-artist').innerText.toLowerCase();
                break;
            case 'year':
                aValue = a.querySelector('.album-year')?.innerText.toLowerCase();
                bValue = b.querySelector('.album-year')?.innerText.toLowerCase();
                break;
        }

        if (isAscending) {
            if (aValue < bValue) return -1;
            if (aValue > bValue) return 1;
        } else {
            if (aValue < bValue) return 1;
            if (aValue > bValue) return -1;
        }
        return 0;
    });

    // add back to views
    const gridAlbums = [];
    const listAlbums = [];

    sortedAlbums.forEach(album => {
        const view = album.getAttribute('data-view');
        if (view === 'grid') {
            gridAlbums.push(album);
        } else {
            listAlbums.push(album);
        }
    });

    // append sorted albums back
    gridAlbums.forEach(album => gridView.appendChild(album));
    listAlbums.forEach(album => listView.appendChild(album));

    // re-trigger the view switch just in case
    if (isGridView) {
        gridView.style.display = 'flex';
        listView.style.display = 'none';
    } else {
        gridView.style.display = 'none';
        listView.style.display = 'flex';
    }
}

// search button
if (searchButton) {
    searchButton.addEventListener('click', () => {
        filterAlbums();
    });
}

// enter
if (searchInput) {
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            filterAlbums();
        }
    });
}

// update search on option change
searchByTitle.addEventListener('change', filterAlbums);
searchByArtist.addEventListener('change', filterAlbums);
searchByYear.addEventListener('change', filterAlbums);
sortBySelect.addEventListener('change', filterAlbums);

// toggle sort direction when the button is clicked
if (toggleSortDirectionButton) {
    toggleSortDirectionButton.addEventListener('click', () => {
        isAscending = !isAscending;
        toggleSortDirectionButton.textContent = isAscending ? '↑↓' : '↓↑';
        filterAlbums();
    });
}