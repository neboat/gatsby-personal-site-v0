import * as React from "react"
import Cite from "citation-js"

const formatURL = (paper) => {
    if ('DOI' in paper) {
        return (
            <div className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-500 border border-blue-700">
                <span className="block text-md px-1">
                    <a className="text-white" href={`https://doi.org/` + paper.DOI}>DOI ↗</a>
                </span>
            </div>
        )
    }
    if ('URL' in paper) {
        return (
            <div className="bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-500 border border-blue-700">
                <span className="block text-md px-1">
                    <a className="text-white" href={paper.URL}>URL ↗</a>
                </span>
            </div>
        )
    }
    return ''
}

const formatHowPublished = (paper) => {
    if (paper.type === "thesis") {
        if (paper.genre === "phdthesis") {
            return <span>Ph.D. thesis.  {paper.publisher}</span>
        }
        if (paper.genre === "mathesis") {
            return <span>Masters thesis.  {paper.publisher}</span>
        }
    }
    var issue = ''
    if (paper.volume) {
        issue = `, ${paper.volume}(${paper.issue})`
    }
    if (paper.page) {
        issue = issue + `, ${String(paper.page).replace('-', '\u2013')}`
    }
    return <span>In <i>{paper["container-title"]}</i>{issue}</span>
}

const formatAnnotation = (paper) => {
    if (!paper.annote) {
        return ''
    }
    return <span className="block font-semibold text-rose-700 dark:text-rose-400" dangerouslySetInnerHTML={{ __html: ' ' + paper.annote + '.' }}></span>
}

const copyToClipboard = str => {
    if (navigator.clipboard) {
        // Most modern browsers support the Navigator API
        navigator.clipboard.writeText(str).then(
            function () {
                // console.log("Copying to clipboard was successful!");
            },
            function (err) {
                console.error("Could not copy text: ", err);
            }
        );
    } else {
        // Fallback using the deprecated `document.execCommand`.
        // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand#browser_compatibility
        const cb = e => {
            e.clipboardData.setData("text/plain", str);
            e.preventDefault();
        };
        document.addEventListener("copy", cb);
        document.execCommand("copy");
        document.removeEventListener("copy", cb);
    }
};

const getFormatting = (paper) => {
    const paperFormatting = 'border-l-stone-500 dark:border-l-stone-500'
    const thesisFormatting = 'border-l-yellow-500 dark:border-l-yellow-500'
    const awardedFormatting = 'border-l-rose-500 dark:border-l-rose-500'
    if (paper.type === "thesis")
        return thesisFormatting
    if (paper.annote)
        return awardedFormatting
    return paperFormatting
}

const BibEntry = ({ id, authors, year, title, howPublished, available, annote, bibtex, classExtra, ...props }) => {
    const [isCopied, setIsCopied] = React.useState(false)
    return (
        <div key={id} className='m-1'>
            <div className={'border border-l-2 bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 rounded px-4 py-2 ' + classExtra} {...props}>
                {authors.map(a => {
                    return `${a.given} ${a.family}`
                }).join(', ')}.{' '}
                {year}.{' '}
                <span className="font-semibold">{title}</span>.{' '}
                {howPublished}.{' '}
                {annote}
                <div className="mt-1 flex gap-x-1">
                    {available}
                    {/* <details><summary>BibTeX</summary>{bibtex}</details> */}
                    <button className="text-md px-1 text-white bg-blue-500 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-500 border border-blue-700"
                        onClick={() => {
                            copyToClipboard(bibtex)
                            setIsCopied(true)
                            setTimeout(() => setIsCopied(false), 1000)
                        }}>
                        {isCopied ? "BibTeX copied" : "Copy BibTeX"}
                    </button></div>
            </div>
        </div>
    )
}

const Bib = ({ paper, idprefix = '', annote = '', classExtra = '', ...props }) => (
    <BibEntry
        id={idprefix + paper.id}
        authors={paper.author}
        year={paper.issued["date-parts"][0][0]}
        title={paper.title}
        howPublished={formatHowPublished(paper)}
        available={formatURL(paper)}
        annote={annote}
        bibtex={Cite(paper).format('bibtex')}
        classExtra={getFormatting(paper) + ' ' + classExtra}
        {...props}
    />
)

export { formatURL, formatHowPublished, formatAnnotation, BibEntry, Bib }