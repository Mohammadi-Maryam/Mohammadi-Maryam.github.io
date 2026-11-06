
document.addEventListener("DOMContentLoaded", async function () {
  const container = document.getElementById("bib-publications");

  try {
    const response = await fetch("/main.bib");

    if (!response.ok) {
      throw new Error("Could not load main.bib");
    }

    const bibtex = await response.text();
    const entries = bibtexParse.toJSON(bibtex);

    function field(entry, name) {
      const tags = entry.entryTags || {};
      const key = Object.keys(tags).find(
        k => k.toLowerCase() === name.toLowerCase()
      );
      return key ? String(tags[key]).trim() : "";
    }

    function clean(value) {
      return value
        .replace(/\\(?:textsc|textit|textbf|emph|textrm)\s*\{([^{}]*)\}/g, "$1")
        .replace(/\\&/g, "&")
        .replace(/\\%/g, "%")
        .replace(/~/g, " ")
        .replace(/---/g, "—")
        .replace(/--/g, "–")
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function category(type) {
      const groups = {
        article: "Journal Articles",
        inproceedings: "Conference Proceedings",
        conference: "Conference Proceedings",
        incollection: "Book Chapters",
        inbook: "Book Chapters",
        book: "Books",
        phdthesis: "Dissertations and Theses",
        mastersthesis: "Dissertations and Theses"
      };

      return groups[type.toLowerCase()] || "Other Publications";
    }

    const publications = entries
      .filter(entry => entry.entryTags)
      .map(entry => ({
        type: entry.entryType.toLowerCase(),
        author: clean(field(entry, "author")),
        title: clean(field(entry, "title")),
        year: clean(field(entry, "year")),
        venue: clean(
          field(entry, "booktitle") ||
          field(entry, "journal") ||
          field(entry, "publisher") ||
          field(entry, "school") ||
          field(entry, "institution")
        ),
        doi: clean(field(entry, "doi")),
        url: clean(field(entry, "url")),
        pdf: clean(field(entry, "pdf")),
        volume: clean(field(entry, "volume")),
        pages: clean(field(entry, "pages"))
      }))
      .sort((a, b) => {
        const yearA = parseInt(a.year, 10) || 9999;
        const yearB = parseInt(b.year, 10) || 9999;
        return yearB - yearA;
      });

    const groups = {};

    publications.forEach(pub => {
      const name = category(pub.type);
      if (!groups[name]) groups[name] = [];
      groups[name].push(pub);
    });

    const order = [
      "Journal Articles",
      "Book Chapters",
      "Conference Proceedings",
      "Books",
      "Dissertations and Theses",
      "Other Publications"
    ];

    function makeLink(label, href) {
      if (!href) return null;

      const link = document.createElement("a");
      link.textContent = label;
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      return link;
    }

    container.replaceChildren();

    order.forEach(groupName => {
      if (!groups[groupName]) return;

      const heading = document.createElement("h2");
      heading.textContent = groupName;
      container.appendChild(heading);

      groups[groupName].forEach(pub => {
        const item = document.createElement("div");
        item.className = "bib-publication";

        const citation = document.createElement("p");

        const authors = document.createElement("span");
        authors.textContent = pub.author;
        citation.appendChild(authors);

        citation.appendChild(
          document.createTextNode(` (${pub.year}). `)
        );

        const title = document.createElement("em");
        title.textContent = pub.title;
        citation.appendChild(title);

        if (pub.venue) {
          citation.appendChild(
            document.createTextNode(". " + pub.venue)
          );
        }

        if (pub.volume) {
          citation.appendChild(
            document.createTextNode(", " + pub.volume)
          );
        }

        if (pub.pages) {
          citation.appendChild(
            document.createTextNode(", pp. " + pub.pages)
          );
        }

        citation.appendChild(document.createTextNode("."));
        item.appendChild(citation);

        const links = document.createElement("p");
        links.className = "publication-links";

        const doiHref = pub.doi
          ? "https://doi.org/" + pub.doi.replace(/^https?:\/\/doi.org\//, "")
          : "";

        const urlHref = pub.url;
        const pdfHref = pub.pdf;

        [
          makeLink("DOI", doiHref),
          makeLink("Website", urlHref),
          makeLink("PDF", pdfHref)
        ].filter(Boolean).forEach((link, index) => {
          if (index > 0) {
            links.appendChild(document.createTextNode(" · "));
          }
          links.appendChild(link);
        });

        if (links.childNodes.length) {
          item.appendChild(links);
        }

        container.appendChild(item);
      });
    });

    if (!publications.length) {
      container.textContent = "No publications found.";
    }

  } catch (error) {
    console.error(error);
    container.textContent =
      "Publications could not be loaded. Please try again later.";
  }
});
