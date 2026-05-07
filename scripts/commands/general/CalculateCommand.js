/*
 * Calculator Command
 * ----------------------------------------------------------------------------
 * A safe mathematical parsing engine using the shunting-yard algorithm.
 */

export const CalculateCommand = {
    name: "calculate",
    description: "Calculate a math expression",


    usage: "/ae:calculate <expression>",
    permission: "essentials.calculate",
    category: "GENERAL",
    parameters: [
        { name: "token1", type: "string", optional: true },
        { name: "token2", type: "string", optional: true },
        { name: "token3", type: "string", optional: true },
        { name: "token4", type: "string", optional: true },
        { name: "token5", type: "string", optional: true },
        { name: "token6", type: "string", optional: true },
        { name: "token7", type: "string", optional: true },
        { name: "token8", type: "string", optional: true }
    ],

    /* 
     * EXECUTION_PIPELINE
     */
    execute(_data, player, args) {
        const expression = args.join(" ")
        if (!expression) {
            player.sendMessage("§c§l» §7Syntax Error: Math expression required.");
            player.sendMessage("§7Example: /ae:calculate 2 + 3 * (4 / 2)");
            return
        }


        try {
            const result = safeMathParse(expression)
            player.sendMessage(`§a§l» §fResult: §e${expression} = §a${result.toLocaleString()}`);
        } catch (error) {
            player.sendMessage(`§c§l» §7Error: ${error.message}`);
        }

    }
}

/* 
 * SAFE_PARSING_PROTOCOL
 * Orchestrates sanitization, validation, tokenization, and RPN-evaluation.
 */
function safeMathParse(expression) {
    const clean = expression.replace(/[^0-9+\-*/().\s]/g, '')
    if (clean !== expression.trim()) throw new Error("Invalid characters in expression.");


    let parenCount = 0
    for (const char of clean) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) throw new Error("Unbalanced parentheses.");
    }
    if (parenCount !== 0) throw new Error("Unbalanced parentheses.");


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
            if (a === undefined || b === undefined) throw new Error("Malformed expression.");

            switch (token) {
                case '+': stack.push(a + b); break
                case '-': stack.push(a - b); break
                case '*': stack.push(a * b); break
                case '/': 
                    if (b === 0) throw new Error("You can't divide by zero!");
                    stack.push(a / b); 

                    break
                default: throw new Error("Unknown operator.");

            }
        }
    }
    if (stack.length !== 1) throw new Error("Calculation failed.");
    return stack[0]
}

