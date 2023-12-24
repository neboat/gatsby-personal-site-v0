import * as shiki from 'shiki'
import SemanticHighlight from './semantichighlight'

// Grammars for Cilk languages
import cilkcGrammar from "../langs/cilkc.tmLanguage.json"
import cilkcppGrammar from "../langs/cilkcpp.tmLanguage.json"

// Setup highlighter with default languages and themes.
const cilkbookTheme = shiki.toShikiTheme(require('../codethemes/cilkbook.json'))
shiki.setCDN('https://unpkg.com/shiki/')
const highlighter = await shiki.getHighlighter({
    theme: 'slack-dark',
    langs: [ 'c', 'cpp' ,
    {
        id: 'cilkcpp',
        scopeName: "source.cilkcpp",
        grammar: cilkcppGrammar,
        // displayName: 'Cilk/C++',
        aliases: ['cilk', 'cilkcpp']
    },
    {
        id: 'cilkc',
        scopeName: "source.cilkc",
        grammar: cilkcGrammar,
        // displayName: 'Cilk/C',
        aliases: ['cilkc']
    }]
})
await highlighter.loadTheme(cilkbookTheme)
await highlighter.loadTheme('slack-ochin')
// console.log(highlighter.getLoadedThemes())
// const cilkcLanguage = {
//     id: 'cilkc',
//     scopeName: "source.cilkc",
//     grammar: cilkcGrammar,
//     displayName: 'Cilk/C',
//     aliases: ['cilk-c']
// }
// const cilkcppLanguage = {
//     id: 'cilkcpp',
//     scopeName: "source.cilkcpp",
//     grammar: cilkcppGrammar,
//     displayName: 'Cilk/C++',
//     aliases: ['cilk', 'cilk-cpp'] }
// await highlighter.loadLanguage(cilkcLanguage)
// await highlighter.loadLanguage(cilkcppLanguage)

const CilkBookHighlight = (code: string, lang: string, theme?: 'cilkbook') => {
    const tokens = highlighter.codeToThemedTokens(code, lang, theme)
    console.log(tokens)
    const _theme = highlighter.getTheme(theme)
    console.log(_theme)
    const semanticTokens = SemanticHighlight(tokens, _theme)
    console.log(semanticTokens)
    return shiki.renderToHtml(semanticTokens)
}

export default CilkBookHighlight
