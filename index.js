"use strict";

function startquery() {

    const query = document.getElementById("query").value
    Promise.all([wikipedia(query), newsapi(query), arxiv(query)]).then((v) => {
        clearSources()

        const wikis = v[0]
        const artcles = v[1]
        const papers = v[2]

        let entries = document.createElement("div")
        entries.className = "entries"
        if (wikis.length == 0) {
            const err = document.createElement("div")
            err.className = "error"
            err.appendChild(document.createTextNode("Error: no elements for query \"" + query + "\""))
            entries.appendChild(err)
        } else {
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

                entries.appendChild(ent)
            })
        }
        document.getElementById("wikipedia").appendChild(entries)

        entries = document.createElement("div")
        entries.className = "entries"
        if (artcles.length == 0) {
            const err = document.createElement("div")
            err.className = "error"
            err.appendChild(document.createTextNode("Error: no elements for query \"" + query + "\""))

            entries.appendChild(err)
        } else {
            artcles.forEach(art => {
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

                entries.appendChild(ent)
            })
        }
        document.getElementById("npj").appendChild(entries)

        entries = document.createElement("div")
        entries.className = "entries"
        if (papers.length == 0) {
            const err = document.createElement("div")
            err.className = "error"
            err.appendChild(document.createTextNode("Error: no elements for query \"" + query + "\""))

            entries.appendChild(err)
        } else {
            papers.forEach(art => {
                const ent = document.createElement("div")
                ent.className = "entry"
                ent.id = "paper" + art.rank

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

                entries.appendChild(ent)
            })
        }
        document.getElementById("arxiv").appendChild(entries)

        document.getElementById("sources").style.visibility = "visible"
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

    const arxiv = document.getElementById("arxiv")
    Array.from(arxiv.children).forEach(child => {
        if (child.tagName == "DIV") arxiv.removeChild(child)
    })
}

function article(nm, src, blrb, rnk, rl, tme) {
    return {
        name: nm,
        source: src,
        blurb: blrb,
        rank: rnk,
        url: rl,
        time: tme,
    }
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
            return pages
                .map((page, index) => article(page.title, "Wikipedia", 
                                              strip(page.snippet), index, 
                                              lookupurl + page.title.replace(" ", "_"),
                                              page.timestamp.slice(0,10)))
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
        .then(j =>
            j.articles
                .map((page, index) => article(page.title, page.source.name, 
                                              page.description, index, 
                                              page.url, page.publishedAt.slice(0,10)))
        )
}

function megatrim(str, joinstr) {
    return str.trim().split("\n").map(l=>l.trim()).join(joinstr)
}

function arxiv(query) {
    const baseurl = "https://export.arxiv.org/api/query?sortBy=relevance&search_query=all:\""
    const apiurl = baseurl + query + "\"" 
    return fetch(apiurl)
        .then(response => response.text()) .then(xmltext => {
            const xml = new DOMParser().parseFromString(xmltext, "text/xml")
            return Array.from(xml.getElementsByTagName("entry"))
                .map((entry, index) => {
                    const title = megatrim(entry.getElementsByTagName("title")[0].textContent, " ")
                    const authors = Array.from(entry.getElementsByTagName("author")).map(author => 
                        author.textContent.trim()
                    ).join(", ")
                    const summary = megatrim(entry.getElementsByTagName("summary")[0].textContent, "")
                    const url = megatrim(entry.getElementsByTagName("id")[0].textContent)
                    const time = entry.getElementsByTagName("published")[0].textContent.slice(0,10)
                    return article(title, authors, summary, index, url, time)
                })
        })
}


function scrollAbout() {
    var element = document.getElementById("about");
    element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
}