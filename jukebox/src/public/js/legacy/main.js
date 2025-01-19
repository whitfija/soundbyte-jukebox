var row

function convertString(str){
    return str.replace(/\//g, 'flagslash').replace(/\?/g, 'flagqmark').replace(/\#/g, 'flaghash')
}

function start(){
    row = event.target
}

function dragover(){
    var e = event
    e.preventDefault(); 
  
    let children= Array.from(e.target.parentNode.parentNode.children);
    
    if(children.indexOf(e.target.parentNode)>children.indexOf(row)) 
        e.target.parentNode.after(row);
    else
        e.target.parentNode.before(row);
    row.classList.add('edited')
    e.target.parentNode.classList.add('edited')
}

function updateRanks(){
    var albums = document.getElementsByClassName("album")
    var edits = []
    for (i = 1; i <= albums.length; i++){
        //if (albums[i-1].classList.contains('edited')){
            //edits.push([parseInt(albums[i-1].id),i])
        //}
        edits.push([albums[i-1].id,i])
    }

    location.href = '/update/' + JSON.stringify(edits)
}

function search(param){
    location.href = '/search/' + param
}

function updateAlbum(albumid){
    var title = document.getElementById("title")
    var artist = document.getElementById("artist")
    var year = document.getElementById("year")
    var genre = document.getElementById("genre")
    var imageurl = document.getElementById("url")

    var details = {}
    details.id = albumid
    details.title = convertString(title.value)
    details.artist = convertString(artist.value)
    details.year = year.value
    details.genre = convertString(genre.value)
    details.imageurl = convertString(imageurl.value)

    send_string = JSON.stringify(details)

    location.href = '/album/update/' + send_string
}

function addAlbum(){
    var album = document.getElementById("title")
    var artist = document.getElementById("artist")
    var year = document.getElementById("year")
    var genre = document.getElementById("genre")
    var imageurl = document.getElementById("url")

    var new_album = {}
    new_album.album = convertString(album.value)
    new_album.artist = convertString(artist.value)
    new_album.year = year.value
    new_album.genre = convertString(genre.value)
    new_album.imageurl = convertString(imageurl.value)

    send_string = JSON.stringify(new_album)

    location.href = '/add/' + send_string
}

function sortAlbums(sort_type){
    var query_table = JSON.parse(document.getElementById('query_table_contents').innerHTML)
    id_list = []
    for (x of query_table){
        id_list.push(x.albumID)
    }

    var info = {}
    info.type = sort_type
    info.ids = id_list
    info_string = convertString(JSON.stringify(info))
    location.href = '/sort/' + info_string
}

function deleteAlbum(albumid){
    var confirmation = confirm("Are you sure you want to delete this album?")

    if (confirmation == true){
        location.href = '/delete/' + albumid
    }
}