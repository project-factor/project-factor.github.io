"use strict";

// Main function
function startquery() {
    // Get input
    const query = document.getElementById("query").value
    if (/^\s+$/.test(query)) { return } // Don't do anything is just whitespace

    // Make calls to sources
    Promise.all([wikipedia(query), newsapi(query), arxiv(query)]).then((v) => {
        
        // Clear Sources List
        clearSources()

        // Define the outputs of the promises
        const wikis = v[0]
        const articles = v[1]
        const papers = v[2]

        // Bind entries to IDs
        bindEntries(wikis, false, "wikipedia")
        bindEntries(articles, true, "npj")
        bindEntries(papers, true, "arxiv")

        // Make sources visible
        document.getElementById("sources").style.visibility = "visible"
    })
}

// Bind a list of entries to an id, optionally showing the source of the entry
function bindEntries(entries, showSrc, id) {

    // Div to contain entries
    const entriesdiv = document.createElement("div")
    entriesdiv.className = "entries" // Apply CSS class

    // If there are no entries
    if (entries.length == 0) {

        // Add an error to the entries list
        const err = document.createElement("div")
        err.className = "error"
        err.appendChild(document.createTextNode("No results found!"))
        entriesdiv.appendChild(err)
    } else { // otherwise

        //grab the top element, make it into an entry, then append it to the entries list
        const top = entries.shift()
        entriesdiv.appendChild(makeEntry(top, showSrc))

        // If there are more,
        if (entries.length > 0) {

            // define the showMore element
            const showMore = document.createElement("div")
            showMore.className = "showMore"
            showMore.appendChild(document.createTextNode("Click here for more"))
            showMore.onclick = () => { // Which on click

                // Removes itself
                entriesdiv.removeChild(showMore)

                // And adds the other entries
                entries.forEach(entry => {
                    entriesdiv.appendChild(makeEntry(entry, showSrc))
                })

                // And adds a showLess element
                entriesdiv.appendChild(showLess)
            }

            // define the showLess element
            const showLess = document.createElement("div")
            showLess.className = "showMore"
            showLess.appendChild(document.createTextNode("Click here for less"))
            showLess.onclick = () => { // Which on click

                // Removes itself
                entriesdiv.removeChild(showLess)

                // And removes the other children, except the first
                Array.from(entriesdiv.children).slice(1).forEach(child => {
                    entriesdiv.removeChild(child)
                })

                // And adds a showMore element
                entriesdiv.appendChild(showMore)

                // And scrolls to the top
                scrollId(id)
            }

            // Add a scrollMore element
            entriesdiv.appendChild(showMore)

        }
    }

    // Append the entries to the given Id
    document.getElementById(id).appendChild(entriesdiv)
}

// Make an individual entry given an article and whether or not to show the source
function makeEntry(entry, showSrc) {

    // create a div to hold the entry
    const entrydiv = document.createElement("div")
    entrydiv.className = "entry"
    entrydiv.id = "entry" + entry.rank

    // Add the title in a link and a header 3 to the entry
    const title = document.createElement("h3")
    const link = document.createElement("a")
    link.href = entry.url
    link.target = "_blank"
    link.appendChild(document.createTextNode(entry.name))
    title.appendChild(link)
    entrydiv.appendChild(title)

    // If you want to show the source, add the source in a h3 to the entry
    if (showSrc) {
        const src = document.createElement("h3")
        src.appendChild(document.createTextNode(entry.source))
        entrydiv.appendChild(src)
    }

    // Add text in a p tag to the entry div
    const text = document.createElement("p")
    text.appendChild(document.createTextNode(entry.blurb))
    entrydiv.appendChild(text)

    // create a cite button with initial text
    const cite = document.createElement("button")
    cite.textContent = "Cite this article"

    // When the button is clicked:
    cite.onclick = () => {
        // Create a temporary input element
        const temp = document.createElement("input")

        // Append it onto the document
        document.body.appendChild(temp)

        // Put the apa citation of the entyr in the element, then select it
        temp.value = apa(entry)
        temp.select()

        // copy the selection to clipboard
        document.execCommand("copy")

        // Remove the temporary element
        document.body.removeChild(temp)

        // Set the text to new text
        cite.textContent = "Copied!"
        setTimeout(() => { // which changes back in a second
            cite.textContent = "Cite this article" 
        }, 1000)
    }

    // Append the citation to the entrydiv
    entrydiv.appendChild(cite)

    // return the entrydiv
    return entrydiv
}

// Clear all the sources from the page
function clearSources() {

    // grab the wiki element
    const wiki = document.getElementById("wikipedia")
    Array.from(wiki.children).forEach(child => { // remove each div child
        if (child.tagName == "DIV") wiki.removeChild(child)
    })

    // grab the npj element
    const npj = document.getElementById("npj")
    Array.from(npj.children).forEach(child => { // remove each div child
        if (child.tagName == "DIV") npj.removeChild(child)  
    })

    // grab the arxiv element
    const arxiv = document.getElementById("arxiv")
    Array.from(arxiv.children).forEach(child => { // remove each div child
        if (child.tagName == "DIV") arxiv.removeChild(child)
    })
}

// generate an article object given
function article(nm, src, blrb, rnk, rl, tme) { // name, source, blurb, rank, url and time
    return {
        name: nm,
        source: src,
        blurb: blrb,
        rank: rnk,
        url: rl,
        time: tme,
    }
}

// Cite an article as APA
function apa(art) {
    // define a list of months
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
    
    // split the datetime into sections
    const date = art.time.split("-")

    // get the name of the current month
    const month = monthNames[parseInt(date[1])]

    // Get the source day, without leading zero
    const day = parseInt(date[2]) + ""

    // Get the current date
    const today = new Date()

    // Print APA
    return `<i>${art.name}</i>. (${date[0]}, ${month} ${day}). ` + //The article name and date
           `Retrieved ${monthNames[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}, ` + // the retrieved date
           `from ${art.url}` // and the url
}

// remove all html from text
function strip(html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

// given a query, return a list of 10 wikipedia articles
function wikipedia(query) {
    const lookupurl = "https://en.wikipedia.org/wiki/" // URL for lookup up entries
    const apiurl = "https://en.wikipedia.org/w/api.php?action=query&list=search&utf8=&format=json&origin=*&srsearch=" // url for making API requests
    const fullurl = apiurl + escape(query) // url for our specific query
    return fetch(fullurl) // fetch the full url
        .then(response => response.json()) // then jsonify the output when done:
        .then((j) => { // then, when done:
            const pages = j.query.search // for each page found
            return pages // return the map of each page to an article
                .map((page, index) => article(page.title, "Wikipedia", 
                                              strip(page.snippet), index, 
                                              lookupurl + page.title.replace(" ", "_"),
                                              page.timestamp.slice(0,10)))
        })
}

// given a query, return a list of 10 news articles
function newsapi(query) {
    const newsapikey = "d943dcac77304701987917fb319681d9" // developer key, To be dealt with?
    const sources = "bbc-news,bbc-sport,associated-press" // list of sources wanted
    const baseurl = "https://newsapi.org/v2/everything?language=en&sortBy=relevancy&pageSize=10" // base url for requests
    const apiurl = baseurl + "&apikey="+newsapikey+"&sources="+sources+"&q=" // general-purpose with api and sources
    const fullurl = apiurl + escape(query) // full url for request
    return fetch(fullurl) // fetch the full url
        .then(response => response.json()) // unpack the json
        .then(j =>
            j.articles // retunn a map of each page to an article
                .map((page, index) => article(page.title, page.source.name, 
                                              page.description, index, 
                                              page.url, page.publishedAt.slice(0,10)))
        )
}

// trim all possible whitespace
function megatrim(str, joinstr) {
    return str.trim().split("\n").map(l=>l.trim()).join(joinstr)
}

// given a query, return a list of 10 arxiv papers
function arxiv(query) {
    const baseurl = "https://export.arxiv.org/api/query?sortBy=relevance&search_query=all:\"" // url for all requests
    const apiurl = baseurl + query + "\""  // url for our specific query
    return fetch(apiurl) // fetch the full url
        .then(response => response.text()) .then(xmltext => { // then parse to text
            const xml = new DOMParser().parseFromString(xmltext, "text/xml") //make an XML parser
            return Array.from(xml.getElementsByTagName("entry")) // map each entry to a
                .map((entry, index) => {
                    const title = megatrim(entry.getElementsByTagName("title")[0].textContent, " ") // title, the title tag
                    const authors = Array.from(entry.getElementsByTagName("author")).map(author => // authors, the comma-joined list of authors tags
                        author.textContent.trim()
                    ).join(", ")
                    const summary = megatrim(entry.getElementsByTagName("summary")[0].textContent, "") // the summary, from the 'summary' tag
                    const url = megatrim(entry.getElementsByTagName("id")[0].textContent) // the URL, given from the id tag
                    const time = entry.getElementsByTagName("published")[0].textContent.slice(0,10) // time, from the published tag
                    return article(title, authors, summary, index, url, time) // return the full article
                })
        })
}

// Scroll to a given id
function scrollId(id) {
    var element = document.getElementById(id);
    element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
}
