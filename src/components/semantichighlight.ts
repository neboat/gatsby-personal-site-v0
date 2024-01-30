import { ThemedToken, ThemeRegistrationResolved } from 'shiki/bundle/web'

/**
 * Subcomponent of a ThemedToken with its own explanation.
 */
type ExplainedSubtoken = {
    token: ThemedToken,
    content: string,
    scopes: string[],
    index: number
}

/**
 * Extract the explained subtokens from the given token.
 * @param parsedToken A given ThemedToken.
 * @returns An array of explained subtokens, or `undefined` if no explanation is available.
 */
function getExplainedSubtokens(parsedToken: ThemedToken) {
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

/**
 * Recognized semantic scopes
 */
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

////////////////////////////////////////////////////////
// Utility methods generating themed tokens

/**
 *  Check if the given selector matches the scope.
 */
// Copied from shiki source.
function matchesOne(selector: string, scope: string): boolean {
    let selectorPrefix = selector + '.'
    if (selector === scope || scope.substring(0, selectorPrefix.length) === selectorPrefix) {
        return true
    }
    return false
}

/**
 * Check if any of the selectors match any of the scopes.
 * @param selectors Array of selectors to check for.
 * @param scopes Array of scopes to check.
 * @returns `true` if any of `selectors` match any of the `scopes`, `false` otherwise.
 */
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

// Copied from shiki source.
function matches(
    selector: string,
    selectorParentScopes: string[],
    scope: string,
    parentScopes: string[]
): boolean {
    if (!matchesOne(selector, scope))
        return false

    let selectorParentIndex = selectorParentScopes.length - 1
    let parentIndex = parentScopes.length - 1
    while (selectorParentIndex >= 0 && parentIndex >= 0) {
        if (matchesOne(selectorParentScopes[selectorParentIndex], parentScopes[parentIndex]))
            selectorParentIndex -= 1
        parentIndex -= 1
    }

    if (selectorParentIndex === -1)
        return true

    return false
}

// Copied from shiki source.
function explainThemeScope(
    theme: ThemeRegistrationResolved,
    scope: string,
    parentScopes: string[],
): any[] {
    const result: any[] = []
    let resultLen = 0
    for (let i = 0, len = theme.settings.length; i < len; i++) {
        const setting = theme.settings[i]
        let selectors: string[]
        if (typeof setting.scope === 'string')
            selectors = setting.scope.split(/,/).map(scope => scope.trim())
        else if (Array.isArray(setting.scope))
            selectors = setting.scope
        else
            continue

        for (let j = 0, lenJ = selectors.length; j < lenJ; j++) {
            const rawSelector = selectors[j]
            const rawSelectorPieces = rawSelector.split(/ /)

            const selector = rawSelectorPieces[rawSelectorPieces.length - 1]
            const selectorParentScopes = rawSelectorPieces.slice(0, rawSelectorPieces.length - 1)

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

/**
 * Create a new themed token from a previous themed token.
 * @param token Original themed token.
 * @param explained Subtoken of `token` with its own explanation.
 * @param newScope Optional new scope to add to the new themed token.
 * @returns A new themed token, based on the original, with the content of the explained subtoken and an additional new scope, if provided.
 */
function createNewThemedToken(
    token: ThemedToken,
    explained: ExplainedSubtoken,
    newScope?: { name: string, theme: ThemeRegistrationResolved }
): ThemedToken {
    // Compute the offset of the explained subtoken
    const offset = token.explanation ?
        token.explanation.slice(0, explained.index).reduce(
            (acc, current) => acc + current.content.length,
            token.offset) :
        token.offset
    // Setup new token based on previous token
    var newToken: ThemedToken = {
        content: explained.content,
        offset: offset,
        color: token.color,
        fontStyle: token.fontStyle
    }
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

/**
 * Stack structure for maintaining semantic scopes.
 */
class ScopeStack {
    stack: SemanticScope[] = ['source']
    depth: number = 0

    /**
     * Push a new scope onto the stack.
     * @param newScope New scope to push.
     */
    push(newScope: SemanticScope) {
        this.stack.push(newScope)
        this.depth++
        console.log(this.stack)
    }

    /**
     * Pop the scope from the top of the stack.
     */
    pop() {
        this.stack.pop()
        this.depth--
        console.log(this.stack)
    }

    /**
     * Read the top of the stack.
     * @returns The semantic scope at the top of the stack.
     */
    top(): SemanticScope {
        return this.stack[this.depth]
    }

    /**
     * Read an entry from the top of the stack.
     * @param index The index of the stack entry to read.
     * @returns The semantic scope `index` entries from the top of the stack.
     */
    ancestor(index: number): SemanticScope {
        return this.stack[this.depth - index]
    }
}

/**
 * Check if the given content matches a non-builtin type.
 * @param content Content string to check.
 * @param learnedTypes Array of globally-defined non-builtin types.
 * @param templateParameters 2D array of template parameters defined at the point of the content string.
 * @returns `true` if `content` matches one of the types in `learnedTypes` or `templateParameters`, `false` otherwise.
 */
function isKnownType(
    content: string,
    learnedTypes: string[],
    templateParameters: string[][]
): boolean {
    const type = content.trim().split(' ')[0]
    if (learnedTypes.includes(type))
        return true
    for (const parameterSet of templateParameters) {
        if (parameterSet.includes(type))
            return true
    }
    return false
}

/**
 * If the given content string matches a known non-builtin type, return that type.
 * @param content Content string to check.
 * @param learnedTypes Array of globally-defined non-builtin types.
 * @param templateParameters 2D array of template parameters defined at the point of the content string.
 * @returns The type that matches `content`, if `content` matches one of the types in `learnedTypes` or `templateParameters`, or `''` otherwise.
 */
function getKnownType(
    content: string,
    learnedTypes: string[],
    templateParameters: string[][]
): string {
    const type = content.trim().split(' ')[0]
    if (learnedTypes.includes(type))
        return type
    for (const parameterSet of templateParameters) {
        if (parameterSet.includes(type))
            return type
    }
    return ''
}

/**
 * Split the given explained subtoken and update the array of explained subtokens containing it accordingly.
 * @param explained Explained subtoken to split.
 * @param splitIndex Index at which to split `explained`.
 * @param subtokens Array of explained subtokens containing `explained`.
 * @param explainedIdx Index of `explained` within `subtokens`.
 */
function splitTokenAtIndex(
    explained: ExplainedSubtoken,
    splitIndex: number,
    subtokens: ExplainedSubtoken[],
    explainedIdx: number
): void {
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

/**
 * If the start of an explained subtoken is a known type, split that type from the explained subtoken.
 * @param explained Explained subtoken.
 * @param subtokens Array of explained subtokens containing `explained`.
 * @param explainedIdx Index of `explained` in `subtokens`.
 * @param learnedTypes Array of known types.
 * @param templateParameters Template parameters defined at this point.
 * @returns Depending on the first word in `explained`, either that word, if the word is not a known type;
 * the empty string, if the word is a known type; or `undefined` on error.
 */
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

/**
 * Add a new token to the array of new tokens, pushing any preceding explained tokens
 * onto the stack that are not already present.
 * @param newTokens Array of new tokens to update.
 * @param token Token to push onto `newTokens`.
 * @param index Index of `token` in `explained`.
 * @param explained Original array of explained subtokens.
 */
function pushNewToken(
    newTokens: ThemedToken[],
    token: ThemedToken,
    index: number,
    explained: ExplainedSubtoken[]
) {
    const originalToken = explained[index].token
    for (const subtoken of explained.slice(newTokens.length, index))
        newTokens.push(createNewThemedToken(originalToken, subtoken))
    newTokens.push(token)
}

/**
 * Add type to array of learned types.
 * @param newType Type to add.
 * @param learnedTypes Array of learned types.
 */
function learnType(
    newType: string,
    learnedTypes: string[]
) {
    learnedTypes.push(newType.trim())
}

/**
 * If the top of the scope stack is `template`, pop it and update the set of template parameters accordingly.
 * @param scopeStack Stack of semantic scopes.
 * @param templateParameters Stack of template parameters.
 */
function maybePopTemplate(
    scopeStack: ScopeStack,
    templateParameters: string[][]
) {
    if (scopeStack.top() === 'template') {
        scopeStack.pop()
        templateParameters.pop()
    }
}

export function SemanticHighlight (tokens: ThemedToken[][], _theme: ThemeRegistrationResolved) {
    var scopeStack: ScopeStack = new ScopeStack;
    var learnedTypes: string[] = []
    var templateParameters: string[][] = []
    var newTemplateParameters: string[] = []
    var newType: string = ''
    var semanticTokens: ThemedToken[][] = []
    for (const token of tokens) {
        var semanticParsedTokens: ThemedToken[] = []
        for (const parsed of token) {
            const subtokens = getExplainedSubtokens(parsed)
            if (!subtokens) {
                semanticParsedTokens.push(parsed)
                continue
            }
            var newTokens: ThemedToken[] = []
            for (var explainedIdx = 0; explainedIdx < subtokens.length; explainedIdx++) {
                const explained = subtokens[explainedIdx]
                const scopes = explained["scopes"]

                if (matchesAny(['comment'], scopes))
                    continue

                if (scopeStack.top() === 'structure') {
                    if (matchesAny(['punctuation.section.block.end.bracket.curly'], scopes)) {
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
                        if (matchesAny(['punctuation.section.block.end.bracket.curly.namespace'], scopes))
                            scopeStack.pop()
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
                            { name: 'entity.name.type.defined', theme: _theme })
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
                    if (newTokens.length != 0)
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
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
                        if (unsplitType)
                            newType = unsplitType
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
                    if (newTokens.length != 0)
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
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
                    if (newTokens.length != 0)
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
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
                    if (newTokens.length != 0)
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
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
                    if (newTokens.length != 0)
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
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
                    if (newTokens.length != 0)
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
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
                    if (matchesAny(['punctuation.definition.end.bracket.square'], scopes))
                        scopeStack.pop()
                    if (newTokens.length != 0)
                        pushNewToken(newTokens, createNewThemedToken(parsed, explained), explainedIdx, subtokens)
                }

                if (matchesAny(['punctuation.section.block.begin'], scopes)) {
                    scopeStack.push('block')
                } else if (matchesAny(['punctuation.section.block.end'], scopes)) {
                    scopeStack.pop()
                    if (matchesAny(['punctuation.section.block.end.bracket.curly.namespace'], scopes))
                        scopeStack.pop()
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
                for (const newToken of newTokens)
                    semanticParsedTokens.push(newToken)
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
