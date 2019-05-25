"use strict";

function startquery() {
    var query = document.getElementById("query").value
    wikipedia(query).then((j) => {
        console.log(j)
    })
}

function article(nm, src, blrb, rnk, url) {
    let art = {}
    art.name = nm
    art.source = src
    art.blurb = blrb
    art.rank = rnk
    art.url = url
    return art
}

function strip(html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

function wikipedia(query) {
    const lookupurl = "https://en.wikipedia.org/wiki/"
    const apiurl = "https://en.wikipedia.org/w/api.php?action=query&list=search&utf8=&format=json&origin=*&srsearch="
    const fullurl = apiurl + escape(query)
    return fetch(fullurl)
        .then(response => response.json())
        .then((j) => {
            const pages = j.query.search
            return pages.map((page, index) => article(page.title, 
                                                      "Wikipedia", 
                                                      strip(page.snippet), 
                                                      index,
                                                      lookupurl + escape(page.title),
                                                      ))
        })
}
