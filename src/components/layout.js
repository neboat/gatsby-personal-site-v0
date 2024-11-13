/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/how-to/querying-data/use-static-query/
 */

import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"
import "./layout.css"

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        buildTime(formatString: "YYYY-MM-DD")
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
      <div
        style={{
          // margin: `0 auto`,
          // maxWidth: `var(--size-content)`,
          padding: `var(--size-gutter)`,
        }}
        className="dark:bg-zinc-900"
      >
        <main className="flex flex-col min-h-screen items-center">{children}</main>
        <footer
          style={{
            marginTop: `var(--space-5)`,
            fontSize: `var(--font-sm)`,
          }}
          className="text-zinc-500"
        >
          © {new Date().getFullYear()} {data.site.siteMetadata?.title}
          {` `}
          &middot; Last updated {data.site.buildTime}
          {` `}
          &middot; Built with
          {` `}
          <a href="https://www.gatsbyjs.com">Gatsby ↗</a>
          {` `}
          &middot; <a href="http://accessibility.mit.edu/">Accessibility ↗</a>
        </footer>
      </div>
    </>
  )
}

export default Layout
