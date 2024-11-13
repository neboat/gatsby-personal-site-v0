import * as React from "react"
import Cite from "citation-js"
import { Bib } from "./bibentry"

const MyBib = require('!!raw-loader!../bib/mypapers.bib')
const MyPapers = new Cite(MyBib.default.toString())

export const Reference = ({ citekeys }) => {
    const papers = MyPapers.data.filter(paper => citekeys.includes(paper["citation-key"]))
    return (
        <details>
            <summary>{papers.length > 1 ? <i>References</i> : <i>Reference</i>}</summary>
            {papers.map(paper => {
                return <Bib key={paper.id} paper={paper} />
            })}
        </details>
    )
}
