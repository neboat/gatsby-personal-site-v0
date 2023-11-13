import * as shiki from 'shiki'
// import { Theme } from 'shiki-themes';
// import { Lang, ILanguageRegistration } from 'shiki-languages';

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

type ExplainedSubtoken = {
    token: shiki.IThemedToken,
    content: string,
    scopes: string[],
    index: number
}

function getExplainedSubtokens(parsedToken: shiki.IThemedToken) {
    const explanation = parsedToken["explanation"]
    if (explanation) {
        var tokenScopes: ExplainedSubtoken[] = []
        var index = 0
        for (const explained of explanation) {
            const content = explained["content"]
            const scopes = explained["scopes"].map(scope => scope.scopeName)
            tokenScopes.push({token: parsedToken, content, scopes, index})
            index++
        }
        return tokenScopes
    }
    return undefined
}

// Recognized semantic scopes
type SemanticScope =
    | 'source'
    | 'vardef'
    | 'assignment.rhs'
    | 'function.head'
    | 'function.body'
    | 'parens'
    | 'block'
    | 'namespace'
    | 'template'
    | 'typename'
    | 'typedef'
    | 'template.spec'
    | 'cast'
    | 'structure'
    | 'struct.name'
    | 'arrayidx'
    | 'type'
const SemanticScopes: SemanticScope[] = [
    'source', // Top-level scope
    'vardef',
    'assignment.rhs',
    'function.head',
    'function.body',
    'parens',
    'block',
    'namespace',
    'template',
    'typename',
    'typedef',
    'template.spec',
    'cast',
    'structure',
    'struct.name',
    'arrayidx',
    'type'
]

////////////////////////////////////////////////////////
// Utility methods generating themed tokens

// Check if the given selector matches the scope
function matchesOne(selector: string, scope: string): boolean {
    let selectorPrefix = selector + '.'
    if (selector === scope || scope.substring(0, selectorPrefix.length) === selectorPrefix) {
        return true
    }
    return false
}

// Check if any of the selectors match any of the scopes.
function matchesAny(
    selectors: string[],
    scopes: string[]
): boolean {
    for (const selector of selectors) {
        let scopeIndex = scopes.length - 1
        while (scopeIndex >= 0) {
            if (matchesOne(selector, scopes[scopeIndex])) {
                return true
            }
            scopeIndex--
        }
    }
    return false
}

function matches(
    selector: string,
    selectorParentScopes: string[],
    scope: string,
    parentScopes: string[]
): boolean {
    if (!matchesOne(selector, scope)) {
        return false
    }

    let selectorParentIndex = selectorParentScopes.length - 1
    let parentIndex = parentScopes.length - 1
    while (selectorParentIndex >= 0 && parentIndex >= 0) {
        if (matchesOne(selectorParentScopes[selectorParentIndex], parentScopes[parentIndex])) {
            selectorParentIndex--
        }
        parentIndex--
    }

    if (selectorParentIndex === -1) {
        return true
    }
    return false
}

function explainThemeScope(theme: shiki.IShikiTheme, scope: string, parentScopes: string[]): any[] {
    let result: any[] = [], resultLen = 0
    if (!theme)
        return result
    for (let i = 0, len = theme.settings.length; i < len; i++) {
        let setting = theme.settings[i]
        let selectors: string[]
        if (typeof setting.scope === 'string') {
            selectors = setting.scope.split(/,/).map(scope => scope.trim())
        } else if (Array.isArray(setting.scope)) {
            selectors = setting.scope
        } else {
            continue
        }
        for (let j = 0, lenJ = selectors.length; j < lenJ; j++) {
            let rawSelector = selectors[j]
            let rawSelectorPieces = rawSelector.split(/ /)

            let selector = rawSelectorPieces[rawSelectorPieces.length - 1]
            let selectorParentScopes = rawSelectorPieces.slice(0, rawSelectorPieces.length - 1)

            if (matches(selector, selectorParentScopes, scope, parentScopes)) {
                // match!
                result[resultLen++] = setting
                // break the loop
                j = lenJ
            }
        }
    }
    return result
}

// Create a new themed token from a previous themed token.
function createNewThemedToken(
    token: shiki.IThemedToken,
    explained: ExplainedSubtoken,
    newScope?: { name: string, theme: shiki.IShikiTheme }
): shiki.IThemedToken {
    // Setup new token based on previous token
    var newToken: shiki.IThemedToken = { content: explained.content, color: token.color, fontStyle: token.fontStyle }
    // Setup token explanation.
    if (token.explanation) {
        newToken.explanation = [token.explanation[explained["index"]]]
        // If there's a new explanation, push it to the list of explanations.
        if (newScope) {
            const themeMatches = explainThemeScope(newScope["theme"], newScope["name"], explained["scopes"])
            newToken.explanation[0]["scopes"].push({ scopeName: `${newScope["name"]}.sema`, themeMatches })
            // If we found a new theme match, update the token's formatting based on it.
            if (themeMatches.length > 0) {
                newToken.color = themeMatches[themeMatches.length - 1].settings["foreground"]
                newToken.fontStyle = themeMatches[themeMatches.length - 1].settings["fontStyle"]
                if (!newToken.fontStyle)
                    newToken.fontStyle = 0
            }
        }
    }
    return newToken
}

// Simple stack structure for maintaining semantic scopes.
class ScopeStack {
    stack: SemanticScope[] = ['source']
    depth: number = 0

    push(newScope: SemanticScope) {
        this.stack.push(newScope)
        this.depth++
        console.log(this.stack)
    }

    pop() {
        this.stack.pop()
        this.depth--
        console.log(this.stack)
    }

    top(): SemanticScope {
        return this.stack[this.depth]
    }

    ancestor(
        index: number
    ): SemanticScope {
        return this.stack[this.depth - index]
    }
}

function isKnownType(
    content: string,
    learnedTypes: string[],
    templateParameters: string[][]
): boolean {
    const type = content.trim().split(' ')[0]
    if (learnedTypes.includes(type)) {
        console.log(`Found learned type ${type}`)
        return true
    }
    for (const parameterSet of templateParameters) {
        if (parameterSet.includes(type)) {
            console.log(`Found template parameter ${type}`)
            return true
        }
    }
    return false
}

function getKnownType(
    content: string,
    learnedTypes: string[],
    templateParameters: string[][]
): string {
    const type = content.trim().split(' ')[0]
    if (learnedTypes.includes(type)) {
        return type
    }
    for (const parameterSet of templateParameters) {
        if (parameterSet.includes(type)) {
            return type
        }
    }
    return ''
}

function splitTokenAtIndex(
    explained: ExplainedSubtoken,
    splitIndex: number,
    subtokens: ExplainedSubtoken[],
    explainedIdx: number
) {
    const content = explained.content
    const splitContent = content.substring(splitIndex)
    if (splitContent === '') {
        console.log(`No need to split token from "${content}"`)
        return
    }
    const splitToken: ExplainedSubtoken = { ...explained }
    splitToken.content = splitContent
    explained.content = content.substring(0, splitIndex)
    subtokens.splice(explainedIdx + 1, 0, splitToken)
}

function splitTypeToken(
    explained: ExplainedSubtoken,
    subtokens: ExplainedSubtoken[],
    explainedIdx: number,
    learnedTypes: string[],
    templateParameters: string[][]
): string | undefined {
    const content = explained.content
    const type = getKnownType(content, learnedTypes, templateParameters)
    if (type === '') {
        console.log(`Failed to find known type in subtoken "${content}"`)
        console.log(learnedTypes)
        console.log(templateParameters)
        return content.trim().split(' ')[0]
    }
    const typeIdx = content.indexOf(type)
    if (typeIdx < 0) {
        console.log(`ERROR: Type not found in subtoken "${content}"`)
        return undefined
    }
    splitTokenAtIndex(explained, typeIdx + type.length, subtokens, explainedIdx)
    return ''
}

// Add a new token to the array of new tokens, pushing any preceding explained tokens
// onto the stack that are not already present.
function pushNewToken(
    newTokens: shiki.IThemedToken[],
    token: shiki.IThemedToken,
    index: number,
    explained: ExplainedSubtoken[]
) {
    const originalToken = explained[index].token
    for (const subtoken of explained.slice(newTokens.length, index)) {
        newTokens.push(createNewThemedToken(originalToken, subtoken))
    }
    newTokens.push(token)
}

function learnType(
    newType: string,
    learnedTypes: string[]
) {
    learnedTypes.push(newType.trim())
}

function maybePopTemplate(
    scopeStack: ScopeStack,
    templateParameters: string[][]
) {
    if (scopeStack.top() === 'template') {
        scopeStack.pop()
        templateParameters.pop()
    }
}

const SemanticHighlight = (tokens: shiki.IThemedToken[][], theme?: string) => {
    const _theme = highlighter.getTheme(theme)
    console.log(_theme)
    var scopeStack: ScopeStack = new ScopeStack;
    var learnedTypes: string[] = []
    var templateParameters: string[][] = []
    var newTemplateParameters: string[] = []
    var newType: string = ''
    var semanticTokens: shiki.IThemedToken[][] = []
    for (const token of tokens) {
        var semanticParsedTokens: shiki.IThemedToken[] = []
        for (const parsed of token) {
            const subtokens = getExplainedSubtokens(parsed)
            if (!subtokens) {
                semanticParsedTokens.push(parsed)
                continue
            }
            var newTokens: shiki.IThemedToken[] = []
            for (var explainedIdx = 0; explainedIdx < subtokens.length; explainedIdx++) {
                const explained = subtokens[explainedIdx]
                const scopes = explained["scopes"]

                if (matchesAny(['comment'], scopes)) {
                    continue
                }

                if (scopeStack.top() === 'structure') {
                    if (matchesAny(['punctuation.section.block.end.bracket.curly', 'punctuation.section.block.end.bracket.curly'], scopes)) {
                        scopeStack.pop()
                        maybePopTemplate(scopeStack, templateParameters)
                        continue
                    } else if (matchesAny(['storage.type.struct'], scopes)) {
                        scopeStack.push('vardef')
                        scopeStack.push('struct.name')
                        continue
                    }
                }

                if (scopeStack.top() === 'block') {
                    if (matchesAny(['punctuation.section.block.end'], scopes)) {
                        scopeStack.pop()
                        if (matchesAny(['punctuation.section.block.end.bracket.curly.namespace'], scopes)) {
                            scopeStack.pop()
                        }
                        continue
                    }
                }

                if (scopeStack.top() === 'template') {
                    if (matchesAny(['storage.type.template.argument.typename'], scopes)) {
                        scopeStack.push('typename')
                        continue
                    } else if (matchesAny(['punctuation.section.angle-brackets.end.template'], scopes)) {
                        if (newTemplateParameters.length > 0) {
                            templateParameters.push(newTemplateParameters)
                            newTemplateParameters = []
                        }
                    } else if (isKnownType(explained.content, learnedTypes, templateParameters)) {
                        splitTypeToken(explained, subtokens, explainedIdx, learnedTypes, templateParameters)
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme})
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        // scopeStack.push('vardef')
                        continue
                    // } else if ((scopeStack.ancestor(1) === 'cast' || scopeStack.ancestor(1) === 'vardef') && explained.content.trim() === '>') {
                    //     scopeStack.pop()
                    //     explainedIdx--
                    }
                    if (newTokens.length != 0) {
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                    }
                }

                if (scopeStack.top() === 'template.spec') {
                    if (explained.content.trim() === '>') {
                        // const semanticParsedToken = createNewThemedToken(parsed, explained,
                        //     { name: 'punctuation.section.angle-brackets.end.template', theme: _theme })
                        // pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        scopeStack.pop()
                        explainedIdx--
                        continue
                    } else if (isKnownType(explained.content, learnedTypes, templateParameters)) {
                        splitTypeToken(explained, subtokens, explainedIdx, learnedTypes, templateParameters)
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme})
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        // scopeStack.push('vardef')
                        continue
                    } else if (explained.content.trim() === '*') {
                        // Create new token with additional scope
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'storage.modifier.pointer', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    } else if (explained.content.trim() === '&') {
                        // Create new token with additional scope
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'storage.modifier.reference', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    }
                    if (newTokens.length != 0) {
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                    }
                    continue
                }

                if (['source', 'block', 'structure', 'template'].includes(scopeStack.top())) {
                    if (matchesAny(['meta.function.definition'], scopes)) {
                        scopeStack.push('function.head')
                    } else if (matchesAny(['storage.type.namespace.definition'], scopes)) {
                        scopeStack.push('namespace')
                    } else if (matchesAny(['storage.type.template'], scopes)) {
                        scopeStack.push('template')
                    } else if (matchesAny(['entity.name.scope-resolution'], scopes)) {
                        continue
                    } else if (matchesAny(['storage.type.struct'], scopes)) {
                        scopeStack.push('vardef')
                        scopeStack.push('struct.name')
                    } else if (isKnownType(explained.content, learnedTypes, templateParameters)) {
                        splitTypeToken(explained, subtokens, explainedIdx, learnedTypes, templateParameters)
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme})
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        scopeStack.push('vardef')
                    } else if (matchesAny(['storage.type.built-in'], scopes)) {
                        scopeStack.push('vardef')
                    } else if (matchesAny(['keyword.other.using', 'keyword.other.typedef'], scopes)) {
                        scopeStack.push('typedef')
                    } else if (matchesAny(['punctuation.section.block.begin.bracket.curly.struct', 'punctuation.section.block.begin.bracket.curly.class'], scopes)) {
                        scopeStack.push('structure')
                    } else if (matchesAny(['entity.name.type.alias', 'entity.name.type.class'], scopes)) {
                        learnType(explained.content, learnedTypes)
                    }
                    continue
                }

                if (scopeStack.top() === 'typename') {
                    if (matchesAny(['entity.name.type.template'], scopes)) {
                        newTemplateParameters.push(explained.content)
                    } else if (explained.content === ',') {
                        scopeStack.pop()
                    } else if (matchesAny(['punctuation.section.angle-brackets.end.template'], scopes)) {
                        if (newTemplateParameters.length > 0) {
                            templateParameters.push(newTemplateParameters)
                            newTemplateParameters = []
                        }
                        scopeStack.pop()
                        explainedIdx--
                    }
                    continue
                }

                if (scopeStack.top() === 'typedef') {
                    if (matchesAny(['entity.name.type'], scopes)) {
                        newType = explained.content.trim()
                    } else if (matchesAny(['meta.body.function', 'meta.body.struct', 'meta.tail.struct', 'meta.body.class', 'meta.block', 'meta.parens', 'source'], scopes.slice(-1))) {
                        const unsplitType = splitTypeToken(explained, subtokens, explainedIdx, learnedTypes, templateParameters)
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        if (unsplitType) {
                            newType = unsplitType
                        }
                        continue
                    } else if (matchesAny(['punctuation.terminator.statement'], scopes)) {
                        if (newType != '') {
                            learnType(newType, learnedTypes)
                            newType = ''
                        }
                        scopeStack.pop()
                        maybePopTemplate(scopeStack, templateParameters)
                    } else if (matchesAny(['keyword.operator.assignment'], scopes)) {
                        scopeStack.push('assignment.rhs')
                    } else if (matchesAny(['storage.type.struct'], scopes)) {
                        scopeStack.push('struct.name')
                    } else if (matchesAny(['punctuation.section.block.begin.bracket.curly'], scopes)) {
                        scopeStack.push('structure')
                    } else if (isKnownType(explained.content, learnedTypes, templateParameters)) {
                        splitTypeToken(explained, subtokens, explainedIdx, learnedTypes, templateParameters)
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    } else if (matchesAny(['variable.other.definition.pointer.function'], scopes)) {
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    }
                    if (newTokens.length != 0) {
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                    }
                    continue
                }

                if (scopeStack.top() === 'struct.name') {
                    if (!matchesAny(['entity.name.type'], scopes)) {
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                    }
                    scopeStack.pop()
                    continue
                }

                if (scopeStack.top() === 'function.head') {
                    if (matchesAny(['punctuation.terminator.statement'], scopes)) {
                        scopeStack.pop()
                        maybePopTemplate(scopeStack, templateParameters)
                    } else if (matchesAny(['punctuation.section.block.begin.bracket.curly'], scopes)) {
                        scopeStack.pop()
                        scopeStack.push('function.body')
                    }
                    if (newTokens.length != 0) {
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                    }
                    continue
                }
                
                if (scopeStack.top() === 'function.body') {
                    if (matchesAny(['punctuation.section.block.begin.bracket.curly'], scopes)) {
                        scopeStack.push('function.body')
                    } else if (matchesAny(['punctuation.section.block.end.bracket.curly'], scopes)) {
                        scopeStack.pop()
                        maybePopTemplate(scopeStack, templateParameters)
                    } else if (matchesAny(['keyword.operator.cast'], scopes)) {
                        scopeStack.push('cast')
                    } else if (matchesAny(['entity.name.scope-resolution'], scopes)) {
                        continue
                    } else if (matchesAny(['storage.type'], scopes)) {
                        scopeStack.push('vardef')
                    } else if (isKnownType(explained.content, learnedTypes, templateParameters)) {
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme})
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        scopeStack.push('vardef')
                    }
                    continue
                }

                if (scopeStack.top() === 'vardef') {
                    if (matchesAny(['entity.name.function'], scopes)) {
                        // Create new token with additional scope
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.function.definition', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        scopeStack.pop()
                        scopeStack.push('function.head')
                        continue
                    } else if (matchesAny(['meta.function.definition.parameters'], scopes)) {
                        scopeStack.pop()
                        scopeStack.push('function.head')
                    } else if (matchesAny(['punctuation.section.block.begin.bracket.curly'], scopes)) {
                        scopeStack.push('structure')
                    } else if (matchesAny(['punctuation.terminator.statement'], scopes)) {
                        scopeStack.pop()
                    } else if (explained.content.trim() === '<') {
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'punctuation.section.angle-brackets.begin.template', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        scopeStack.push('template.spec')
                        continue
                    } else if (scopeStack.ancestor(1) === 'template' && explained.content.trim() === '>') {
                        scopeStack.pop()
                        explainedIdx--
                        continue
                    } else if (matchesAny(['keyword.operator.assignment'], scopes)) {
                        scopeStack.push('assignment.rhs')
                    } else if (matchesAny(['punctuation.definition.begin.bracket.square'], scopes)) {
                        scopeStack.push('arrayidx')
                    } else if (matchesAny(['variable.other.object', 'variable.object'], scopes.slice(-1))) {
                        // Create new token with additional scope
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'meta.definition.variable.name', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    } else if (matchesAny(['meta.body.function', 'meta.body.struct', 'meta.tail.struct', 'meta.body.class', 'meta.block', 'meta.parens', 'source'], scopes.slice(-1))) {
                        var splitIndex = -1
                        if (matchesAny(['meta.body.struct', 'meta.body.class', 'meta.block'], scopes.slice(-1))) {
                            splitIndex = explained.content.indexOf(':')
                            if (splitIndex > 0) {
                                splitTokenAtIndex(explained, splitIndex, subtokens, explainedIdx)
                            } else if (splitIndex < 0) {
                                splitIndex = explained.content.indexOf('[')
                                if (splitIndex > 0) {
                                    splitTokenAtIndex(explained, splitIndex, subtokens, explainedIdx)
                                }
                            }
                        }
                        if (splitIndex === 0) {
                            pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                            continue
                        }
                        // Create new token with additional scope
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'meta.definition.variable.name', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    } else if (explained.content === '*') {
                        // Create new token with additional scope
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'storage.modifier.pointer', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    } else if (explained.content === '&') {
                        // Create new token with additional scope
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'storage.modifier.reference', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    }
                    if (newTokens.length != 0) {
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                    }
                    continue
                }

                if (scopeStack.top() === 'parens') {
                    if (matchesAny(['punctuation.section.parens.end.bracket.round'], scopes)) {
                        scopeStack.pop()
                    } else if (isKnownType(explained.content, learnedTypes, templateParameters)) {
                        splitTypeToken(explained, subtokens, explainedIdx, learnedTypes, templateParameters)
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    } else if (explained.content.trim() === '<') {
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'punctuation.section.angle-brackets.begin.template', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        scopeStack.push('template.spec')
                        continue
                    }
                    if (newTokens.length != 0) {
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                    }
                }
                
                if (scopeStack.top() === 'assignment.rhs') {
                    if (matchesAny(['punctuation.terminator.statement'], scopes)) {
                        scopeStack.pop()
                        explainedIdx--
                    } else if (matchesAny(['punctuation.separator.delimiter'], scopes)) {
                        scopeStack.pop()
                    } else if (matchesAny(['punctuation.section.parens.begin'], scopes)) {
                        scopeStack.push('parens')
                    } else if (scopeStack.ancestor(1) === 'template' && explained.content.trim() === '>') {
                        scopeStack.pop()
                        explainedIdx--
                    } else if (isKnownType(explained.content, learnedTypes, templateParameters)) {
                        splitTypeToken(explained, subtokens, explainedIdx, learnedTypes, templateParameters)
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'entity.name.type.defined', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        continue
                    } else if (explained.content.trim() === '<') {
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'punctuation.section.angle-brackets.begin.template', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        scopeStack.push('template.spec')
                        continue
                    }
                    if (newTokens.length != 0) {
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                    }
                    // continue
                }
                
                if (scopeStack.top() === 'cast') {
                    if (explained.content.trim() === '<') {
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'punctuation.section.angle-brackets.begin.template', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                        scopeStack.push('template.spec')
                    } else if (explained.content.trim() === '>') {
                        const semanticParsedToken = createNewThemedToken(parsed, explained,
                            { name: 'punctuation.section.angle-brackets.end.template', theme: _theme })
                        pushNewToken(newTokens, semanticParsedToken, explainedIdx, subtokens)
                    // } else if (matchesAny(['punctuation.section.angle-brackets.end.template'], scopes)) {
                        scopeStack.pop()
                        maybePopTemplate(scopeStack, templateParameters)
                    }
                    continue
                }

                if (scopeStack.top() === 'arrayidx') {
                    if (matchesAny(['punctuation.definition.end.bracket.square'], scopes)) {
                        scopeStack.pop()
                    }
                    if (newTokens.length != 0) {
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                    }
                }

                if (matchesAny(['punctuation.section.block.begin'], scopes)) {
                    scopeStack.push('block')
                } else if (matchesAny(['punctuation.section.block.end'], scopes)) {
                    scopeStack.pop()
                    if (matchesAny(['punctuation.section.block.end.bracket.curly.namespace'], scopes)) {
                        scopeStack.pop()
                    }
                } else if (matchesAny(['punctuation.section.angle-brackets.begin.template'], scopes)) {
                    scopeStack.push('template')
                } else if (matchesAny(['punctuation.section.angle-brackets.end.template'], scopes)) {
                    if (newTemplateParameters.length > 0) {
                        templateParameters.push(newTemplateParameters)
                        newTemplateParameters = []
                    }
                    scopeStack.pop()
                }
            }
            if (newTokens.length === 0) {
                semanticParsedTokens.push(parsed)
            } else {
                for (const newToken of newTokens) {
                    semanticParsedTokens.push(newToken)
                }
            }
        }
        semanticTokens.push(semanticParsedTokens)
    }
    if (scopeStack.depth != 0) {
        console.log("Unpopped scope stack!")
        console.log(scopeStack)
    }
    return semanticTokens
}

const CilkBookHighlight = (code: string, lang: string, theme?: 'cilkbook') => {
    const tokens = highlighter.codeToThemedTokens(code, lang, theme)
    console.log(tokens)
    const semanticTokens = SemanticHighlight(tokens, theme)
    console.log(semanticTokens)
    return shiki.renderToHtml(semanticTokens)
}

export default CilkBookHighlight