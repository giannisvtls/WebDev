var works = [];
var id=[];
var templates = {};

if (document.URL.includes("index.html")) {
    document.getElementsByClassName('search')[0].addEventListener('submit', searchBar);
    document.getElementsByClassName('search')[1].addEventListener('submit', searchBar);
    
}

/**Scroll to the top */
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

/**Listens to the favourite button, responds on click, if filled remove, if not filled add */
function handleFavorites(){
    
    var fav = document.querySelectorAll('[id^="book-key-"]');
    for(const element of fav){
        element.addEventListener('click', async (event) =>{
            let buttonID = event.target.parentElement.id
            let action;
            if(buttonID.endsWith('active')) {
                action = 'remove'
                buttonID = event.target.parentElement.id.split("_").shift()
                buttonID = buttonID.slice(9);
                buttonID = parseInt(buttonID)
                let toDelete = works[buttonID].workid
                fetch(`/api/favorites/${toDelete}`, {
                    method: "DELETE"
                })
                    .then(res => res.json())
                    .then(() => console.log('success'))
            }else{
                action = 'add'
                buttonID = buttonID.slice(9);
                buttonID = parseInt(buttonID)
                const response = await fetch('/api/action', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: action,
                        workid: works[buttonID].workid, 
                        title: works[buttonID].titleweb,
                        author: works[buttonID].authorweb
                    })
                })
                const success = await response.json()
            }
            if(action === 'add') {
                element.id = event.target.parentElement.id + '_active'
                event.target.className = "fa fa-heart"
            }
            if(action === 'remove') {
                element.id = event.target.parentElement.id.split("_").shift()
                event.target.className = "fa fa-heart-o"
            }
        })
    }
}

/**Nested fetch, gets the results of the user search from the API
 * Posts the results to the server
 * Server searches for matches and returns works that are already favorited
 * Posts all works and fills the favourite button if a book is already in the favorites list
 */
function searchBar(e){
    e.preventDefault();
    works = []
    if(e.target.id === 'search-center') var userSearch = document.getElementById("search-bar").value
    if(e.target.id === 'search-side') var userSearch = document.getElementById("search-input").value
    document.getElementById("sidebar-aside").style.display = "none";
    document.getElementById("title-list").style.display = "none";
    document.getElementById("search-center").style.display = "none";
    
    fetch('https://reststop.randomhouse.com/resources/works?start=0&max=20&expandLevel=1&search=' + encodeURIComponent(userSearch.trim()), {
        headers: {
            'Accept': 'application/json'}
    })
    .then(res => res.json())
    .then(async data => {
        works = data.work
        
        const response = await fetch('/api/works', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                works: works
            })
        })
        const success = await response.json()
        id = []
        for(var key in success) {
            if(success.hasOwnProperty(key)){
                id = success[key]
            }
        }
        id.forEach((ev)=>{
            console.log(ev)
        })
        return success
    })
    .then(() => {
        document.getElementById("go-top").style.display = "block";
        document.getElementById("sidebar-aside").style.display = "flex";
        document.getElementById("title-list").style.display = "flex";
        document.getElementsByTagName("html")[0].style['overflow-y'] = "scroll";
        
        printResults()
        printSidebar()
        handleFavorites()
    })
}


/**
 * If users search returns results, display them, else display a 'results no found' page
 * If results are displayed, check if work is already favorited to display appropriate heart icon
 * Last if is about the displayed book covers, some works returned a single title which resulted in a single object,
 *      while others returned multiple titles which resulted in an array of objects
 */
function printResults(){
    templates.searchResults = Handlebars.compile(`
    {{#if (isdefined this)}}
        {{#each this}}
            <section class="book-container"  id="{{workid}}">
                <section class="book-title">
                    {{#if (isfav workid)}}
                        <button id="book-key-{{@key}}_active" target="_book-favorite"><i class="fa fa-heart" aria-hidden="true"></i></button>
                    {{else}}
                        <button id="book-key-{{@key}}" target="_book-favorite"><i class="fa fa-heart-o" aria-hidden="true"></i></button>
                    {{/if}}
                    <h2 class="book-title"">{{titleweb}}</h2>
                    <q class="book-author">Written By: {{authorweb}}</q>
                </section>                                          
                {{#if (isdefined titles.isbn)}}
                    <figure><img class="book-picture" alt="book-cover-{{workid}}" src = "https://reststop.randomhouse.com/resources/titles/{{titles.isbn.0.$}}" height="200px"></figure>
                {{else}}
                    <figure><img class="book-picture" alt="book-cover-{{workid}}" src = "https://reststop.randomhouse.com/resources/titles/{{titles.isbn.$}}" height="200px"></figure>
                {{/if}}
            </section>
        {{/each}}
    {{else}}
        <figure id="no-results">
            <img alt="no-results" src="@Resources/search.png" height="200px">
            <figcaption>Could not find any results for your search.</figcaption>
        </figure>
    {{/if}}`)
    let temp = templates.searchResults(works)
    let div = document.getElementById("title-list")
    div.innerHTML = temp
}

/**Print a sidebar with work titles, on click moves the user to the appropriate work */
function printSidebar(){
    templates.searchSidebar = Handlebars.compile(`{{#each this}} 
    <li class="sidebar-list">
        <a href=index.html#{{workid}}>{{titleshort}}</a>
        <hr>
    </li>
    {{/each}}`)
    let temp = templates.searchSidebar(works)

    let div = document.getElementById("sidebar-list")
    div.innerHTML = temp
}

Handlebars.registerHelper('isfav', function (value) {
    if(id.includes(value)) return true;
});

Handlebars.registerHelper('isdefined', function (value) {
    return Array.isArray(value)
});