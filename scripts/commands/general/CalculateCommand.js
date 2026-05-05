/*
 * INDUSTRIAL_ARITHMETIC_EVALUATOR
 * ----------------------------------------------------------------------------
 * A high-performance, hardened mathematical parsing engine. Rejects the 
 * use of unsafe execution-vectors (eval) in favor of a deterministic 
 * shunting-yard algorithm for O(N) resolution.
 *
 * PHILOSOPHY: Mathematics is the language of industry. Use this 
 * evaluation-vector to calibrate industrial calculations without 
 * compromising system-integrity.
 */
export const CalculateCommand = {
    name: "calculate",
    description: "Evaluates raw mathematical expressions using a safe industrial-grade parsing engine.",
    usage: "!calculate <expression>",
    permission: "essentials.calculate",
    category: "GENERAL",

    /* 
     * EXECUTION_PIPELINE
     */
    execute(_data, player, args) {
        const expression = args.join(" ")
        if (!expression) {
            player.sendMessage("§cERROR: EXPRESSION_REQUIRED");
            player.sendMessage("§7Example: !calculate 2 + 3 * (4 / 2)");
            return
        }

        try {
            const result = safeMathParse(expression)
            player.sendMessage(`§aCALCULATION_SUCCESSFUL: ${expression} = §e${result}`);
        } catch (error) {
            player.sendMessage(`§cCALCULATION_FAILURE: ${error.message.toUpperCase()}`);
        }
    }
}

/* 
 * SAFE_PARSING_PROTOCOL
 * Orchestrates sanitization, validation, tokenization, and RPN-evaluation.
 */
function safeMathParse(expression) {
    const clean = expression.replace(/[^0-9+\-*/().\s]/g, '')
    if (clean !== expression.trim()) throw new Error("UNAUTHORIZED_TOKENS_DETECTED");

    let parenCount = 0
    for (const char of clean) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) throw new Error("STACK_ERROR: UNBALANCED_PARENTHESES");
    }
    if (parenCount !== 0) throw new Error("STACK_ERROR: UNBALANCED_PARENTHESES");

    const tokens = tokenize(clean)
    const rpn = toRPN(tokens)
    return evaluateRPN(rpn)
}

/* 
 * TOKENIZATION_VECTOR
 */
function tokenize(expr) {
    const tokens = []
    let current = ''
    for (let i = 0; i < expr.length; i++) {
        const char = expr[i]
        if (/\s/.test(char)) {
            if (current) { tokens.push(current); current = '' }
        } else if (/[0-9.]/.test(char)) {
            current += char
        } else if (/[+\-*/()]/.test(char)) {
            if (current) { tokens.push(current); current = '' }
            tokens.push(char)
        }
    }
    if (current) tokens.push(current)
    return tokens
}

/* 
 * SHUNTING_YARD_ORCHESTRATOR
 */
function toRPN(tokens) {
    const output = []
    const operators = []
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 }
    for (const token of tokens) {
        if (!isNaN(token)) {
            output.push(parseFloat(token))
        } else if (token === '(') {
            operators.push(token)
        } else if (token === ')') {
            while (operators.length && operators[operators.length - 1] !== '(') output.push(operators.pop())
            operators.pop() 
        } else {
            while (operators.length && precedence[operators[operators.length - 1]] >= precedence[token]) output.push(operators.pop())
            operators.push(token)
        }
    }
    while (operators.length) output.push(operators.pop())
    return output
}

/* 
 * RPN_RESOLUTION_ENGINE
 */
function evaluateRPN(rpn) {
    const stack = []
    for (const token of rpn) {
        if (typeof token === 'number') {
            stack.push(token)
        } else {
            const b = stack.pop()
            const a = stack.pop()
            if (a === undefined || b === undefined) throw new Error("MALFORMED_STACK_STATE");
            switch (token) {
                case '+': stack.push(a + b); break
                case '-': stack.push(a - b); break
                case '*': stack.push(a * b); break
                case '/': 
                    if (b === 0) throw new Error("ZERO_DIVISION_EXCEPTION");
                    stack.push(a / b); 
                    break
                default: throw new Error("UNKNOWN_OPERATOR_EXCEPTION");
            }
        }
    }
    if (stack.length !== 1) throw new Error("STACK_RESOLUTION_FAILURE");
    return stack[0]
}
