import * as React from "react"
import Layout from "../../components/layout"
import Seo from "../../components/seo"
import Cite from "citation-js"
import { formatAnnotation, Bib } from "../../components/bibentry"

const MyBib = require('!!raw-loader!../../bib/mypapers.bib')
const MyPapers = new Cite(MyBib.default.toString())

const featuredPapers = ["SchardlLe23", "LeisersonThEm20", "SchardlMoLe17"]

const PapersPage = () => {
    // console.log(MyPapers)
    MyPapers.data.sort((a, b) => {
        const compareYearsIssued = b.issued["date-parts"][0][0] - a.issued["date-parts"][0][0]
        if (compareYearsIssued !== 0)
            return compareYearsIssued
        const compareMonthsIssued = a.issued["date-parts"][0][1] - b.issued["date-parts"][0][1]
        return compareMonthsIssued
    })
    return (
        <main>
            <Layout pageTitle="Papers">
                <article className="prose prose-zinc dark:prose-invert prose-code:before:hidden prose-code:after:hidden">
                    <h1>Papers</h1>
                    <h2>Featured papers</h2>
                    {MyPapers.data.filter(paper => featuredPapers.includes(paper["citation-key"])).map(paper => {
                        return <Bib key={'featured-' + paper.id} paper={paper} idprefix="featured-" annote={formatAnnotation(paper)} /> // classExtra="border-stone-300 border-l-rose-700 dark:border-stone-600 dark:border-l-rose-400" />
                    })}
                    <h2>All papers</h2>
                    {MyPapers.data.map(paper => {
                        return <Bib key={paper.id} paper={paper} annote={formatAnnotation(paper)} />
                    })}
                </article>
            </Layout>
        </main>
    )
}

/**
 * Head export to define metadata for the page
 *
 * See: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const Head = () => <Seo title="Papers" />

export default PapersPage