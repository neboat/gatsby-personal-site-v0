import * as React from 'react'
import { graphql } from "gatsby"
import Layout from '../components/layout'
import Seo from '../components/seo'

const SimplePage = ({ data, children }) => {
  return (
    <Layout pageTitle={data.mdx.frontmatter.title}>
      <article className="prose prose-zinc dark:prose-invert
      prose-code:before:hidden prose-code:after:hidden
      prose-inline-code:bg-amber-50 dark:prose-inline-code:bg-amber-950">
        {children}
      </article>
    </Layout>
  )
}

export const query = graphql`
query ($id: String) {
  mdx(id: {eq: $id}) {
    frontmatter {
      title
    }
  }
}`

export const Head = ({ data }) => <Seo title={data.mdx.frontmatter.title} />

export default SimplePage