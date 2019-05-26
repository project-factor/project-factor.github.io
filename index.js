"use strict";

function startquery() {
    clearSources()

    const query = document.getElementById("query").value
    Promise.all([wikipedia(query), newsapi(query)]).then((v) => {
        const wikis = v[0]
        const artcles = v[1]

        wikis.forEach(wiki => {
            const ent = document.createElement("div")
            ent.className = "entry"
            ent.id = "wiki" + wiki.rank

            const title = document.createElement("h3")
            const link = document.createElement("a")
            link.href = wiki.url
            link.appendChild(document.createTextNode(wiki.name))
            title.appendChild(link)
            ent.appendChild(title)

            const text = document.createElement("p")
            text.appendChild(document.createTextNode(wiki.blurb))
            ent.appendChild(text)

            document.getElementById("wikipedia").appendChild(ent)
        })

        artcles.forEach(art => {
            console.log(art)

            const ent = document.createElement("div")
            ent.className = "entry"
            ent.id = "story" + art.rank

            const title = document.createElement("h3")
            const link = document.createElement("a")
            link.href = art.url
            link.appendChild(document.createTextNode(art.name))
            title.appendChild(link)
            ent.appendChild(title)

            const src = document.createElement("h3")
            src.appendChild(document.createTextNode(art.source))
            ent.appendChild(src)

            const text = document.createElement("p")
            text.appendChild(document.createTextNode(art.blurb))
            ent.appendChild(text)

            document.getElementById("npj").appendChild(ent)
        })

        // make sources visible
    })
}

function clearSources() {
    // Hide sources

    const wiki = document.getElementById("wikipedia")
    Array.from(wiki.children).forEach(child => {
        if (child.tagName == "DIV") wiki.removeChild(child)
    })

    const npj = document.getElementById("npj")
    Array.from(npj.children).forEach(child => {
        if (child.tagName == "DIV") npj.removeChild(child)  
    })
}

function article(nm, src, blrb, rnk, url) {
    const art = {}
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
            return pages.map((page, index) => article(page.title, "Wikipedia", strip(page.snippet), index, lookupurl + escape(page.title)))
        })
}

function newsapi(query) {
    const newsapikey = "d943dcac77304701987917fb319681d9" // To be dealt with
    const sources = "bbc-news,bbc-sport,associated-press"
    const baseurl = "https://newsapi.org/v2/everything?language=en&sortBy=relevancy&pageSize=10"
    const apiurl = baseurl + "&apikey="+newsapikey+"&sources="+sources+"&q="
    const fullurl = apiurl + escape(query)
    return fetch(fullurl)
        .then(response => response.json())
        .then((j) => {
            const pages = j.articles
            return pages.map((page, index) => article(page.title, page.source.name, page.description, index, page.url))
       })
}
