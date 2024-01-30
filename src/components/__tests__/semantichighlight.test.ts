import { getHighlighter, ThemedToken } from 'shiki'
import { SemanticHighlight } from '../semantichighlight'
import { expect, test } from 'vitest'

// Grammars for Cilk languages
import cilkcGrammar from "../../langs/cilkc.tmLanguage.json"
import cilkcppGrammar from "../../langs/cilkcpp.tmLanguage.json"

// Create a shiki theme from the Cilkbook code theme.
import cilkbookTheme from '../../codethemes/cilkbook.json'

// Make a shiki highlighter with Cilk/C++ and Cilk/C languages and Cilkbook
// theme.
const makeHighlighter = async () => {
    const highlighter = await getHighlighter({
        themes: [ cilkbookTheme ],
        langs: ['c', 'cpp',
            { ...cilkcppGrammar },
            { ...cilkcGrammar }]
    })
    return highlighter
}

// Given code and a language, perform syntax and semantic highlighting, and
// return the resulting themed tokens.
const TestHighlight = async (code: string, lang: string, theme: string = 'cilkbook') => {
    const highlighter = await makeHighlighter()
    const tokens = highlighter.codeToThemedTokens(code, {
        lang: lang,
        theme: theme,
        includeExplanation: true
    })
    const _theme = highlighter.getTheme(theme)
    return SemanticHighlight(tokens, _theme)
}

// Check the given themed tokens against expectation.  The expected parameter
// contains an ordered list of tokens and associated scopes to look for in the
// given themed tokens.
const checkTokenScopes = (
    tokens: ThemedToken[][],
    expected: { content: string, scopeName: string[] }[]
) => {
    var eIdx = 0
    // Scan each token in each line.
    for (const line of tokens) {
        for (const tok of line) {
            // If the token has an explanation, examine its explanations.
            if (tok.explanation) {
                for (const ex of tok.explanation) {
                    // If the explanation's content matches the next piece of expected content,
                    // compare the scopes.
                    if (ex.content.trim() == expected[eIdx].content) {
                        // Check that the scopes on this explanation contain the expected scopes.
                        const scopesArray = expected[eIdx].scopeName.map((scopeName) =>
                            [{
                                scopeName: expect.stringMatching(scopeName),
                                themeMatches: expect.anything(),
                            }])
                        expect(ex).toEqual({
                            content: ex.content,
                            scopes: expect.arrayContaining(scopesArray[0])
                        })
                        // Advance to the next piece of expected content.
                        eIdx++
                        if (eIdx == expected.length)
                            // Nothing more to check.  Exit.
                            return
                    }
                }
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
// Unit tests.
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
