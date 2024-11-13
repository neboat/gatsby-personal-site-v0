/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/
 */

import './src/styles/global.css'

import { wrapRootElement as wrap } from './src/components/wrap-root-element';
export const wrapRootElement = wrap;