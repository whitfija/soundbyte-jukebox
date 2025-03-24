function updatePreview() {
    const imageUrl = document.getElementById('imageurl').value;
    const preview = document.getElementById('imagePreview');
    
    if (imageUrl) {
        preview.src = imageUrl;
    } else {
        preview.src = '/img/legacy/placeholder_cover.png';
    }
}
