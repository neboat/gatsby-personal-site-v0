import * as React from "react"
import { Link } from "gatsby"

const Header = ({ siteTitle }) => (
  <header>
    <ul className="flex border-b">
      <li className="-mb-px mr-1">
        <Link className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold" activeClassName="text-orange-700" to="/">Home</Link>
      </li>
      <li className="mr-1">
        <Link className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold" activeClassName="text-orange-700" to="/code-highlight">Code Highlighter</Link>
      </li>
      <li className="mr-1">
        <Link className="bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold" activeClassName="text-orange-700" to="/about">About</Link>
      </li>
    </ul>
  </header>
)

export default Header
