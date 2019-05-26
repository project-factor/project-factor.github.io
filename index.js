"use strict";

function startquery() {

    const query = document.getElementById("query").value
    Promise.all([wikipedia(query), newsapi(query), arxiv(query)]).then((v) => {
        clearSources()

        const wikis = v[0]
        const articles = v[1]
        const papers = v[2]

        document.getElementById("wikipedia").appendChild(makeEntries(wikis, false))

        document.getElementById("npj").appendChild(makeEntries(articles, true))

        document.getElementById("arxiv").appendChild(makeEntries(papers, true))

        document.getElementById("sources").style.visibility = "visible"
    })
}

function makeEntries(entries, showSrc) {
    const entriesdiv = document.createElement("div")
    entriesdiv.className = "entries"

    if (entries.length == 0) {
        const err = document.createElement("div")
        err.className = "error"
        err.appendChild(document.createTextNode("Error: no elements found for query"))
        entriesdiv.appendChild(err)
    } else {
        const top = entries.shift()
        entriesdiv.appendChild(makeEntry(top, showSrc))

        if (entries.length > 0) {
            const showMore = document.createElement("div")
            showMore.className = "showMore"
            showMore.appendChild(document.createTextNode("Click here for more"))
            entriesdiv.appendChild(showMore)

            showMore.onclick = () => {
                entriesdiv.removeChild(showMore)
                entries.forEach(entry => {
                    entriesdiv.appendChild(makeEntry(entry, showSrc))
                })
            }
        }
    }
    return entriesdiv
}

function makeEntry(entry, showSrc) {
    const entrydiv = document.createElement("div")
    entrydiv.className = "entry"
    entrydiv.id = "entry" + entry.rank

    const title = document.createElement("h3")
    const link = document.createElement("a")
    link.href = entry.url
    link.appendChild(document.createTextNode(entry.name))
    title.appendChild(link)
    entrydiv.appendChild(title)

    if (showSrc) {
        const src = document.createElement("h3")
        src.appendChild(document.createTextNode(entry.source))
        entrydiv.appendChild(src)
    }

    const text = document.createElement("p")
    text.appendChild(document.createTextNode(entry.blurb))
    entrydiv.appendChild(text)

    const cite = document.createElement("button")
    cite.appendChild(document.createTextNode("Cite this article"))
    cite.onclick = () => {
        const temp = document.createElement("input")
        document.body.appendChild(temp)
        temp.value = apa(entry)
        temp.select()
        document.execCommand("copy")
        document.body.removeChild(temp)
    }
    entrydiv.appendChild(cite)

    return entrydiv
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

function apa(art) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
    const date = art.time.split("-")
    const month = monthNames[parseInt(date[1])]
    const day = parseInt(date[2]) + ""
    const today = new Date()
    return `<i>${art.name}</i>. (${date[0]}, ${month} ${day}). ` +
           `Retrieved ${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}, ` +
           `from ${art.url}`
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