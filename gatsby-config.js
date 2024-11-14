/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `Tao B. Schardl`,
    description: `Tao B. Schardl's personal website`,
    author: `@neboat`,
    siteUrl: `https://web.mit.edu/neboat/www`,
  },
  pathPrefix: `/neboat/www`,
  plugins: [
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `langs`,
        path: `${__dirname}/src/langs`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `bib`,
        path: `${__dirname}/src/bib`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `neboat-personal-site`,
        short_name: `neboat`,
        start_url: `/`,
        background_color: `#663399`,
        // This will impact how browsers show your PWA/website
        // https://css-tricks.com/meta-theme-color-and-trickery/
        // theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/person-icon.svg`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-mdx`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/src/pages`,
      },
    },
    `gatsby-plugin-postcss`,
    {
      resolve: `gatsby-transformer-remark`,
      // options: {
      //   plugins: [
      //     {
      //       resolve: `gatsby-remark-shiki`,
      //       options: {
      //         theme: 'slack-ochin', // Default
      //         langs: [
      //           {
      //             id: `cilk`,
      //             scopeName: `source.cilkcpp`,
      //             path: `${__dirname}/langs/cilkcpp.tmLanguage.json`,
      //           }
      //         ]
      //       },
      //     },
      //   ],
      // },
    },
  ],
}
