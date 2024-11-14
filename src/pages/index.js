import * as React from "react"
import { Link, withPrefix } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"

import Layout from "../components/layout"
import Seo from "../components/seo"
import * as styles from "../components/index.module.css"
import Content from "./index-content.mdx"

const links = [
  {
    text: "Code highlighter",
    url: "/code-highlight",
    description:
      "Make high-quality syntax-highlighted code snippets for slides.",
  },
  {
    text: "Projects",
    url: "/projects",
    description:
      "Find out more about current research and software projects.",
  },
  // {
  //   text: "Papers",
  //   url: "/papers",
  //   description:
  //     "Browse my academic bibliography.",
  // },
  {
    text: "Teaching",
    url: "/teaching",
    description:
      "Get links to slides, handouts, and other course materials.",
  },
]

const moreLinks = [
  {
    text: "GitHub",
    url: "https://github.com/neboat"
  },
  {
    text: "Google Scholar",
    url: "https://scholar.google.com/citations?hl=en&user=XTakCM0AAAAJ",
  },
  {
    text: "CV",
    url: withPrefix("/cv.pdf")
  }
]

const utmParameters = `?utm_source=neboat-personal-site` // `?utm_source=starter&utm_medium=start-page&utm_campaign=default-starter`

const IndexPage = () => {
  return (
    <Layout pageTitle="Home">
      <article className="prose prose-gray dark:prose-invert
        prose-code:before:hidden prose-code:after:hidden
        prose-inline-code:bg-amber-50 dark:prose-inline-code:bg-amber-950">
        <h1 className="flex-row">
          <StaticImage
            objectPosition="50% 40%"
            className="h-32 w-32 !align-baseline"
            alt="Picture of Tao B. (TB) Schardl"
            src="../images/self_2015_nobkg.png"
          /> {` `} <span className="inline-block align-baseline">Tao B. (TB) Schardl</span></h1>
        <Content />
        {moreLinks.map((link, i) => (
          <React.Fragment key={link.url}>
            <a
              href={`${link.url}${utmParameters}`}
              className={styles.listItemLink}>
              {link.text}
            </a>
            {i !== moreLinks.length - 1 && <> · </>}
          </React.Fragment>
        ))}
        <ul className={styles.list}>
          {links.map((link, i) => (
            <li key={link.url} className={styles.listItem}>
              <Link to={link.url}>{link.text}</Link>
              <p className={styles.listItemDescription}>{link.description}</p>
            </li>
          ))}
        </ul>
      </article>
      {/* <ul className={styles.list}>
          {links.map(link => (
            <li key={link.url} className={styles.listItem}>
              <a
                className={styles.listItemLink}
                href={`${link.url}${utmParameters}`}
              >
                {link.text} ↗
              </a>
              <p className={styles.listItemDescription}>{link.description}</p>
            </li>
          ))}
        </ul> */}
    </Layout>
  )
}

/**
 * Head export to define metadata for the page
 *
 * See: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const Head = () => <Seo title="Home" />

export default IndexPage
