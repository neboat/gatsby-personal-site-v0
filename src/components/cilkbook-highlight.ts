import { getHighlighter, hastToHtml, tokensToHast, ShikiTransformerContext, ShikiTransformerContextCommon, addClassToHast, TokenStyles, FontStyle, ThemedToken, HtmlRendererOptions, codeToHtml } from 'shiki/bundle/web'
// import { Element, Root, Text } from 'hast'
import { SemanticHighlight } from './semantichighlight'

// Grammars for Cilk languages
import cilkcGrammar from "../langs/cilkc.tmLanguage.json"
import cilkcppGrammar from "../langs/cilkcpp.tmLanguage.json"

// Setup highlighter with default languages and themes.
import cilkbookTheme from '../codethemes/cilkbook.json'

// // Copied from shiki source.
// function getTokenStyleObject(token: TokenStyles) {
//     const styles: Record<string, string> = {}
//     if (token.color)
//         styles.color = token.color
//     if (token.bgColor)
//         styles['background-color'] = token.bgColor
//     if (token.fontStyle) {
//         if (token.fontStyle & FontStyle.Italic)
//             styles['font-style'] = 'italic'
//         if (token.fontStyle & FontStyle.Bold)
//             styles['font-weight'] = 'bold'
//         if (token.fontStyle & FontStyle.Underline)
//             styles['text-decoration'] = 'underline'
//     }
//     return styles
// }

// // Copied from shiki source.
// function stringifyTokenStyle(token: Record<string, string>) {
//     return Object.entries(token).map(([key, value]) => `${key}:${value}`).join(';')
// }

// // Copied from shiki source.
// export function tokensToHast(
//     tokens: ThemedToken[][],
//     options: HtmlRendererOptions,
//     transformerContext: ShikiTransformerContextCommon,
// ) {
//     const {
//         transformers = [],
//     } = options

//     const lines: (Element | Text)[] = []
//     const tree: Root = {
//         type: 'root',
//         children: [],
//     }

//     let preNode: Element = {
//         type: 'element',
//         tagName: 'pre',
//         properties: {
//             class: `shiki ${options.themeName || ''}`,
//             style: options.rootStyle || `background-color:${options.bg};color:${options.fg}`,
//             tabindex: '0',
//             ...Object.fromEntries(
//                 Array.from(
//                     Object.entries(options.meta || {}),
//                 )
//                     .filter(([key]) => !key.startsWith('_')),
//             ),
//         },
//         children: [],
//     }

//     let codeNode: Element = {
//         type: 'element',
//         tagName: 'code',
//         properties: {},
//         children: lines,
//     }

//     const lineNodes: Element[] = []

//     const context: ShikiTransformerContext = {
//         ...transformerContext,
//         get tokens() {
//             return tokens
//         },
//         get options() {
//             return options
//         },
//         get root() {
//             return tree
//         },
//         get pre() {
//             return preNode
//         },
//         get code() {
//             return codeNode
//         },
//         get lines() {
//             return lineNodes
//         },
//     }

//     tokens.forEach((line, idx) => {
//         if (idx)
//             lines.push({ type: 'text', value: '\n' })

//         let lineNode: Element = {
//             type: 'element',
//             tagName: 'span',
//             properties: { class: 'line' },
//             children: [],
//         }

//         let col = 0

//         for (const token of line) {
//             let tokenNode: Element = {
//                 type: 'element',
//                 tagName: 'span',
//                 properties: {},
//                 children: [{ type: 'text', value: token.content }],
//             }

//             const style = token.htmlStyle || stringifyTokenStyle(getTokenStyleObject(token))
//             if (style)
//                 tokenNode.properties.style = style

//             for (const transformer of transformers)
//                 tokenNode = (transformer?.span || transformer?.token)?.call(context, tokenNode, idx + 1, col, lineNode) || tokenNode

//             lineNode.children.push(tokenNode)
//             col += token.content.length
//         }

//         for (const transformer of transformers)
//             lineNode = transformer?.line?.call(context, lineNode, idx + 1) || lineNode

//         lineNodes.push(lineNode)
//         lines.push(lineNode)
//     })

//     for (const transformer of transformers)
//         codeNode = transformer?.code?.call(context, codeNode) || codeNode

//     preNode.children.push(codeNode)

//     for (const transformer of transformers)
//         preNode = transformer?.pre?.call(context, preNode) || preNode

//     tree.children.push(preNode)

//     let result = tree
//     for (const transformer of transformers)
//         result = transformer?.root?.call(context, result) || result

//     return result
// }



// const highlighter = await getHighlighter({
//     themes: ['slack-dark', 'slack-ochin', cilkbookTheme],
//     langs: ['c', 'cpp',
//         { ...cilkcppGrammar },
//         { ...cilkcGrammar }
//     ],
// })

var cachedHighlighter: any = null

// Make a shiki highlighter with Cilk/C++ and Cilk/C languages and Cilkbook
// theme.
const makeHighlighter = async () => {
    if (!cachedHighlighter)
        cachedHighlighter = await getHighlighter({
            themes: [ 'slack-dark', 'slack-ochin', cilkbookTheme ],
            langs: ['c', 'cpp',
                { ...cilkcppGrammar },
                { ...cilkcGrammar }
            ],
        })
    return cachedHighlighter
    // const highlighter = await getHighlighter({
    //     themes: [ 'slack-dark', 'slack-ochin', cilkbookTheme ],
    //     langs: ['c', 'cpp',
    //         { ...cilkcppGrammar },
    //         { ...cilkcGrammar }
    //     ],
    // })
    // return highlighter
}

// Perform syntax and semantic highlighting on the given code, using the
// specified language (and theme), and render the result to HTML.
const CilkBookHighlight = async (code: string, lang: string, theme: string = 'cilkbook') => {
    // return codeToHtml(code, {lang: 'c++', theme: 'slack-ochin'})
    const highlighter = await makeHighlighter()
    // NOTE: The following does not work, because we need to set `includeExplanation` to `true`
    // when generating themed tokens for SemanticHighlight to properly analyze the code.
    return highlighter.codeToHtml(code, {
        lang: lang,
        theme: theme,
        includeExplanation: true,
        transformers: [{
            tokens(tokens) { console.log(tokens); return SemanticHighlight(tokens, highlighter.getTheme(theme)) },
            pre(pre) { addClassToHast(pre, 'p-2.5 text-sm') }
        }]
    })
    // const tokens = highlighter.codeToThemedTokens(code, {
    //     lang: lang,
    //     theme: theme,
    //     includeExplanation: true
    // })
    // const _theme = highlighter.getTheme(theme)
    // const context: ShikiTransformerContextCommon = {
    //     meta: {},
    //     options: {
    //         lang: lang,
    //         theme: theme
    //     },
    //     codeToHast: highlighter.codeToHast,
    // }
    // const semanticTokens = SemanticHighlight(tokens, _theme)
    // console.log(semanticTokens)
    // const hastTokens = tokensToHast(semanticTokens, {
    //     fg: _theme.fg,
    //     bg: _theme.bg,
    //     transformers: [{
    //         pre(pre) { addClassToHast(pre, 'p-2.5 text-sm') }
    //     }]
    // }, context)
    // return hastToHtml(hastTokens)
}

export default CilkBookHighlight
