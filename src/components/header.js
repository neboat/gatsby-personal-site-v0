import * as React from "react"
import { Link } from "gatsby"

const navLinkClass = "bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold"
const activeNavLinkClass = "text-orange-700"
const NavLink = ({ children, ...props }) => (
  <Link
    {...props}
    className={navLinkClass}
    activeClassName={activeNavLinkClass}
  >{children}</Link>
)

const Header = ({ siteTitle }) => (
  <header>
    <ul className="flex border-b">
      <li className="-mb-px mr-1">
        <NavLink to="/">Home</NavLink>
      </li>
      <li className="mr-1">
        <NavLink to="/code-highlight">Code Highlighter</NavLink>
      </li>
      <li className="mr-1">
        <NavLink to="/about">About</NavLink>
      </li>
    </ul>
  </header>
)

export default Header
