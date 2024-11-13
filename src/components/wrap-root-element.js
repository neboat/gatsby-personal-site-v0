import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { Code } from "./codeblock"

const components = {
    pre: props => <Code {...props} />,
    wrapper: ({ children }) => <>{children}</>,
};

export const wrapRootElement = ({ element }) => {
    return <MDXProvider components={components}>{element}</MDXProvider>;
};