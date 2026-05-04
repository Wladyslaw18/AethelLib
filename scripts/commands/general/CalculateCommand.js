/**
 * Calculate Command - Safe math calculator
 */

export const CalculateCommand = {
    name: "calculate",
    description: "Calculate mathematical expressions",
    usage: "!calculate <expression>",
    permission: "essentials.calculate",
    category: "utility",

    execute(data, player, args) {
        const expression = args.join(" ")
        
        if (!expression) {
            player.sendMessage("§cUsage: !calculate <expression>")
            player.sendMessage("§7Example: !calculate 2 + 3 * 4")
            return
        }

        // Safe math parser - no eval allowed
        try {
            const result = safeMathParse(expression)
            player.sendMessage(`§a${expression} = §e${result}`)
        } catch (error) {
            player.sendMessage(`§cInvalid expression: ${error.message}`)
        }
    }
}

/**
 * Safe math parser - prevents eval injection
 * Supports: +, -, *, /, (), numbers, decimals
 */
function safeMathParse(expression) {
    // Remove all characters except numbers, operators, parentheses, and decimal points
    const clean = expression.replace(/[^0-9+\-*/().\s]/g, '')
    
    if (clean !== expression.trim()) {
        throw new Error("Contains invalid characters")
    }

    // Basic validation for balanced parentheses
    let parenCount = 0
    for (const char of clean) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) throw new Error("Unbalanced parentheses")
    }
    if (parenCount !== 0) throw new Error("Unbalanced parentheses")

    // Tokenize and evaluate using shunting-yard algorithm
    const tokens = tokenize(clean)
    const rpn = toRPN(tokens)
    return evaluateRPN(rpn)
}

function tokenize(expr) {
    const tokens = []
    let current = ''
    
    for (let i = 0; i < expr.length; i++) {
        const char = expr[i]
        
        if (/\s/.test(char)) {
            if (current) {
                tokens.push(current)
                current = ''
            }
        } else if (/[0-9.]/.test(char)) {
            current += char
        } else if (/[+\-*/()]/.test(char)) {
            if (current) {
                tokens.push(current)
                current = ''
            }
            tokens.push(char)
        }
    }
    
    if (current) tokens.push(current)
    return tokens
}

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
            while (operators.length && operators[operators.length - 1] !== '(') {
                output.push(operators.pop())
            }
            operators.pop() // Remove '('
        } else {
            while (operators.length && 
                   precedence[operators[operators.length - 1]] >= precedence[token]) {
                output.push(operators.pop())
            }
            operators.push(token)
        }
    }
    
    while (operators.length) {
        output.push(operators.pop())
    }
    
    return output
}

function evaluateRPN(rpn) {
    const stack = []
    
    for (const token of rpn) {
        if (typeof token === 'number') {
            stack.push(token)
        } else {
            const b = stack.pop()
            const a = stack.pop()
            
            if (a === undefined || b === undefined) {
                throw new Error("Invalid expression")
            }
            
            switch (token) {
                case '+': stack.push(a + b); break
                case '-': stack.push(a - b); break
                case '*': stack.push(a * b); break
                case '/': 
                    if (b === 0) throw new Error("Division /* ANOMALY */")
                    stack.push(a / b); 
                    break
                default: throw new Error("Unknown operator")
            }
        }
    }
    
    if (stack.length !== 1) {
        throw new Error("Invalid expression")
    }
    
    return stack[0]
}

