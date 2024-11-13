import * as React from "react"
import { Link as GatsbyLink } from "gatsby"

// import * as styles from "./index.module.css"

const utmParameters = `?utm_source=neboat-personal-site`

// Since DOM elements <a> cannot receive activeClassName
// and partiallyActive, destructure the prop here and
// pass it only to GatsbyLink
const Link = ({ children, to, activeClassName, partiallyActive, ...other }) => {
    // Tailor the following test to your environment.
    // This example assumes that any internal link (intended for Gatsby)
    // will start with exactly one slash, and that anything else is external.
    const internal = /^\/(?!\/)/.test(to)

    // Use Gatsby Link for internal links, and <a> for others
    if (internal) {
        return (
            <GatsbyLink
                to={to}
                activeClassName={activeClassName}
                partiallyActive={partiallyActive}
                {...other}
            >
                {children}
            </GatsbyLink>
        )
    }
    return (
        <a href={`${to}${utmParameters}`} {...other}>
            {children}
        </a>
    )
}

export const LinkList = ({ links, ...props }) => {
    return <React.Fragment>
        {/* {(links.length > 1) ? <i>Links:</i> : <i>Link:</i>}{' '} */}
        {links.map((link, i) => (
            <React.Fragment key={link.url}>
                <Link to={link.url} {...props}>{link.text}</Link>
                {i !== links.length - 1 && <> · </>}
            </React.Fragment>
        ))}
    </React.Fragment>
}
