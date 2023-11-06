import * as React from "react"
import { Link } from "gatsby"

const Header = ({ siteTitle }) => (
  <header>
    <ul className="flex border-b">
      <li className="-mb-px mr-1">
        {/* <a className="bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 text-blue-700 font-semibold" href="/">Home</a> */}
        <Link to="/">Home</Link>
      </li>
      <li className="mr-1">
        {/* <a className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold" href="/cilk-highlight">Code Highlighter</a> */}
        <Link to="/code-highlight">Code Highlighter</Link>
      </li>
      <li className="mr-1">
        {/* <a className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold" href="/about">About</a> */}
        <Link to="/about">About</Link>
      </li>
    </ul>
  </header>
)

export default Header
