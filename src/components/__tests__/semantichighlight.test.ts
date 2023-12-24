import * as shiki from 'shiki'
import SemanticHighlight from '../semantichighlight'

// Grammars for Cilk languages
import cilkcGrammar from "../../langs/cilkc.tmLanguage.json"
import cilkcppGrammar from "../../langs/cilkcpp.tmLanguage.json"

// Setup highlighter with default languages and themes.
const cilkbookTheme = shiki.toShikiTheme(require('../../codethemes/cilkbook.json'))
const makeHighlighter = async () => {
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
    return highlighter
}

const TestHighlight = async (code: string, lang: string, theme?: 'cilkbook') => {
    const highlighter = await makeHighlighter()
    const tokens = highlighter.codeToThemedTokens(code, lang, theme)
    const _theme = highlighter.getTheme(theme)
    return SemanticHighlight(tokens, _theme)
}

const collectScopeNames = (token: shiki.IThemedToken) => {
    var scopeNames: string[] = []
    token.explanation?.map(function(ex) {
        ex.scopes.map(function(scope) {
            scopeNames.push(scope.scopeName)
        })
    })
    return scopeNames
}

const checkTokenScopes = (
    tokens: shiki.IThemedToken[][],
    expected: { content: string, scopeName: [ string ] }[]
) => {
    var eIdx = 0
    for (const line of tokens) {
        for (const tok of line) {
            if (tok.explanation) {
                for (const ex of tok.explanation) {
                    if (ex.content.trim() == expected[eIdx].content) {
                        const scopesArray = expected[eIdx].scopeName.map((scopeName) =>
                            [{
                                scopeName: expect.stringMatching(scopeName),
                                themeMatches: expect.anything(),
                            }])
                        expect(ex).toEqual({
                            content: ex.content,
                            scopes: expect.arrayContaining(scopesArray[0])
                        })
                        eIdx++
                        if (eIdx == expected.length) {
                            return
                        }
                    }
                }
            }
        }
    }
}

test.each([
    {
        code: 'int x;', lang: 'cilkc',
        expected: [
            { content: 'int', scopeName: ['^storage\.type'] },
            { content: 'x', scopeName: ['^meta\.definition\.variable\.name'] },
            { content: ';', scopeName: ['^punctuation\.terminator\.statement'] }
        ]
    },
    {
        code: 'int x;', lang: 'cilkcpp',
        expected: [
            { content: 'int', scopeName: ['^storage\.type'] },
            { content: 'x', scopeName: ['^meta\.definition\.variable\.name'] },
            { content: ';', scopeName: ['^punctuation\.terminator\.statement'] }
        ]
    },
    {
        code: 'int x, y=7, z=y;', lang: 'cilkcpp',
        expected: [
            { content: 'int', scopeName: ['^storage\.type'] },
            { content: 'x', scopeName: ['^meta\.definition\.variable\.name'] },
            { content: ',', scopeName: ['^punctuation\.separator\.delimiter'] },
            { content: 'y', scopeName: ['^meta\.definition\.variable\.name'] },
            { content: '=', scopeName: ['^keyword\.operator\.assignment'] },
            { content: '7', scopeName: ['^constant\.numeric'] },
            { content: ',', scopeName: ['^punctuation\.separator\.delimiter'] },
            { content: 'z', scopeName: ['^meta\.definition\.variable\.name'] },
            { content: '=', scopeName: ['^keyword\.operator\.assignment'] },
            { content: 'y', scopeName: ['^source'] },
            { content: ';', scopeName: ['^punctuation\.terminator\.statement'] }
        ]
    },
    {
        lang: 'cilkc',
        code: `int64_t fib(int64_t n) {
            if (n < 2) return n;
            int64_t x, y;
            cilk_scope {
              x = cilk_spawn fib(n-1);
              y = fib(n-2);
            }
            return x + y;
          }`,
        expected: [
            { content: 'int64_t', scopeName: ['^storage\.type'] },
            { content: 'fib', scopeName: ['^entity\.name\.function\.definition'] },
            { content: '(', scopeName: ['^meta\.function\.definition'] },
            { content: 'int64_t', scopeName: ['^storage\.type'] },
            { content: 'n', scopeName: ['^variable\.parameter'] },
            { content: ')', scopeName: ['^meta\.function\.definition'] },
            { content: '{', scopeName: ['^punctuation\.section\.block\.begin\.bracket\.curly'] },
            { content: 'int64_t', scopeName: ['^storage\.type'] },
            { content: 'x', scopeName: ['^meta\.definition\.variable\.name'] },
            { content: ',', scopeName: ['^punctuation\.separator\.delimiter'] },
            { content: 'y', scopeName: ['^meta\.definition\.variable\.name'] },
            { content: ';', scopeName: ['^punctuation\.terminator\.statement'] },
            { content: 'cilk_scope', scopeName: ['^keyword\.control\.cilk'] },
            { content: 'cilk_spawn', scopeName: ['^keyword\.control\.cilk'] },
            { content: 'fib', scopeName: ['^meta\.function-call', '^entity\.name\.function'] },
            { content: 'fib', scopeName: ['^meta\.function-call', '^entity\.name\.function'] },
        ]
    },
])('SemanticHighlight($code, $lang)', async ({ code, lang, expected }) => {
    const semanticTokens = await TestHighlight(code, lang)
    checkTokenScopes(semanticTokens, expected)
})
