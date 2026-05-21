// ----------------------------------------------------------------------------
// | object: CalculateCommand                                                  |
// | command definition for a sandboxed mathematical parsing engine.           |
// | avoids eval() and uses shunting-yard to ensure security and performance.  |
// ----------------------------------------------------------------------------
export const CalculateCommand = {
    // internal name.
    name: "calculate",
    // human-readable description.
    description: "Calculate a math expression",
    // syntax guide.
    usage: "/ae:calculate <expression>",
    // required permission level.
    permission: "essentials.calculate",
    // command category.
    category: "GENERAL",
    // Handled by script to avoid native parsing errors.
    native: false,
    // RAW_CHAT_MODE: Intercept the full message before any engine tokenization.
    // Required because Bedrock rejects +, *, / as invalid string param values
    // at the client side before the server ever sees them.
    chatRaw: true,
    // parameter definitions (for help display only - not used for native registration).
    parameters: [
        { name: "expression", type: "string", optional: false }
    ],

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for the calculator. joins tokens and triggers the parser.    |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // combine all arguments into a single string.
        const expression = args.join(" ")
        if (!expression) {
            player.sendMessage("\u00A7c\u00A7l» \u00A77Syntax Error: Math expression required.");
            player.sendMessage("\u00A77Example: /ae:calculate 2 + 3 * (4 / 2)");
            return
        }

        try {
            // resolve the expression result using our safe parsing pipeline.
            const result = safeMathParse(expression)
            player.sendMessage(`\u00A7a\u00A7l» \u00A7fResult: \u00A7e${expression} = \u00A7a${result.toLocaleString()}`);
        } catch (error) {
            // catch and display syntax errors or math logic failures (e.g. div by 0).
            player.sendMessage(`\u00A7c\u00A7l» \u00A77Error: ${error.message}`);
        }
    }
}

// ----------------------------------------------------------------------------
// | function: safeMathParse                                                  |
// | orchestrates the multi-stage parsing pipeline:                           |
// | 1. Sanitization (strip garbage)                                          |
// | 2. Validation (balanced parens)                                          |
// | 3. Tokenization (split into numbers/operators)                           |
// | 4. Conversion (Shunting-yard -> Reverse Polish Notation)                 |
// | 5. Evaluation (RPN Stack calculation)                                    |
// ----------------------------------------------------------------------------
const precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '%': 2,
    '^': 3,
    'u+': 4,
    'u-': 4
};

const associativity = {
    '+': 'left',
    '-': 'left',
    '*': 'left',
    '/': 'left',
    '%': 'left',
    '^': 'right',
    'u+': 'right',
    'u-': 'right'
};

const functions = new Set([
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh', 'sqrt', 'abs', 'log',
    'ln', 'exp', 'floor', 'ceil', 'round', 'fact',
    'deg', 'rad'
]);
const constants = {
    'pi': Math.PI,
    'e': Math.E
};

function isUnary(index, tokens) {
    if (index === 0) return true;
    const prev = tokens[index - 1];
    return /[\+\-\*\/\%\^\(\)]/.test(prev) || functions.has(prev);
}

function safeMathParse(expression) {
    // regex sanitization: allow numbers, words (functions/constants), standard operators, decimals, and whitespace.
    const clean = expression.replace(/[^0-9a-zA-Z\+\-\*\/\%\^\(\)\.\s]/g, '')
    
    // sanity check: balanced parentheses.
    let parenCount = 0
    for (const char of clean) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        if (parenCount < 0) throw new Error("Unbalanced parentheses.");
    }
    if (parenCount !== 0) throw new Error("Unbalanced parentheses.");

    // execute the processing pipeline.
    const tokens = tokenize(clean)
    const rpn = toRPN(tokens)
    return evaluateRPN(rpn)
}

// ----------------------------------------------------------------------------
// | function: tokenize                                                       |
// | splits the raw string into a list of processable tokens.                 |
// ----------------------------------------------------------------------------
function tokenize(expr) {
    const tokens = []
    let i = 0
    while (i < expr.length) {
        const char = expr[i]
        
        if (/\s/.test(char)) {
            i++
            continue
        }
        
        if (/[0-9.]/.test(char)) {
            let num = ''
            while (i < expr.length && /[0-9.]/.test(expr[i])) {
                num += expr[i]
                i++
            }
            tokens.push(num)
            continue
        }
        
        if (/[a-zA-Z]/.test(char)) {
            let word = ''
            while (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
                word += expr[i]
                i++
            }
            tokens.push(word.toLowerCase())
            continue
        }
        
        if (/[\+\-\*\/\%\^\(\)]/.test(char)) {
            tokens.push(char)
            i++
            continue
        }
    }
    return tokens
}

// ----------------------------------------------------------------------------
// | function: toRPN (Shunting-yard Algorithm)                                |
// | converts infix notation (2+2) to postfix (Reverse Polish) (2 2 +).        |
// | this handles operator precedence (* before +) without complex trees.     |
// ----------------------------------------------------------------------------
function toRPN(tokens) {
    const output = []
    const operators = []
    
    for (let idx = 0; idx < tokens.length; idx++) {
        const token = tokens[idx]
        
        if (!isNaN(token)) {
            // numbers go straight to output.
            output.push(parseFloat(token))
        } else if (constants[token] !== undefined) {
            // constants go straight to output.
            output.push(constants[token])
        } else if (functions.has(token)) {
            // functions wait on operator stack.
            operators.push(token)
        } else if (token === '(') {
            // opening parens wait on the operator stack.
            operators.push(token)
        } else if (token === ')') {
            // closing parens pop operators until matching open paren.
            while (operators.length && operators[operators.length - 1] !== '(') {
                output.push(operators.pop())
            }
            if (!operators.length) throw new Error("Unbalanced parentheses.")
            operators.pop() // pop '('
            
            // if the top operator is a function, pop it to output.
            if (operators.length && functions.has(operators[operators.length - 1])) {
                output.push(operators.pop())
            }
        } else {
            // operators: check if unary or binary.
            let op = token
            if (op === '-' && isUnary(idx, tokens)) {
                op = 'u-'
            } else if (op === '+' && isUnary(idx, tokens)) {
                op = 'u+'
            }
            
            if (precedence[op] === undefined) {
                throw new Error(`Unknown token or operator: ${token}`)
            }
            
            // pop higher or equal priority operators.
            while (operators.length) {
                const top = operators[operators.length - 1]
                if (top === '(') break
                
                const topPrecedence = precedence[top] !== undefined ? precedence[top] : 5
                const currentPrecedence = precedence[op]
                
                if (
                    (associativity[op] === 'left' && topPrecedence >= currentPrecedence) ||
                    (associativity[op] === 'right' && topPrecedence > currentPrecedence)
                ) {
                    output.push(operators.pop())
                } else {
                    break
                }
            }
            operators.push(op)
        }
    }
    
    // dump remaining operators.
    while (operators.length) {
        const op = operators.pop()
        if (op === '(' || op === ')') throw new Error("Unbalanced parentheses.")
        output.push(op)
    }
    
    return output
}

// ----------------------------------------------------------------------------
// | function: evaluateRPN                                                    |
// | resolves a postfix expression using a value stack.                       |
// ----------------------------------------------------------------------------
function evaluateRPN(rpn) {
    const stack = []
    for (const token of rpn) {
        if (typeof token === 'number') {
            // push numbers to the stack.
            stack.push(token)
        } else if (functions.has(token)) {
            // evaluate functions.
            const a = stack.pop()
            if (a === undefined) throw new Error("Malformed expression.")
            
            let res
            const val = Number(a)
            switch (token) {
                case 'sin': res = Math.sin(val); break
                case 'cos': res = Math.cos(val); break
                case 'tan': res = Math.tan(val); break
                case 'asin': res = Math.asin(val); break
                case 'acos': res = Math.acos(val); break
                case 'atan': res = Math.atan(val); break
                case 'sinh': res = Math.sinh(val); break
                case 'cosh': res = Math.cosh(val); break
                case 'tanh': res = Math.tanh(val); break
                case 'floor': res = Math.floor(val); break
                case 'ceil': res = Math.ceil(val); break
                case 'round': res = Math.round(val); break
                case 'deg': res = val * 180 / Math.PI; break
                case 'rad': res = val * Math.PI / 180; break
                case 'fact':
                    if (val < 0 || !Number.isInteger(val)) throw new Error("Factorial is only defined for non-negative integers.")
                    if (val > 170) throw new Error("Factorial overflow (>170).")
                    let f = 1
                    for (let k = 2; k <= val; k++) f *= k
                    res = f
                    break
                case 'sqrt':
                    if (val < 0) throw new Error("Square root of a negative number is undefined.")
                    res = Math.sqrt(val)
                    break
                case 'abs': res = Math.abs(val); break
                case 'log':
                    if (val <= 0) throw new Error("Logarithm of non-positive numbers is undefined.")
                    res = Math.log10(val)
                    break
                case 'ln':
                    if (val <= 0) throw new Error("Logarithm of non-positive numbers is undefined.")
                    res = Math.log(val)
                    break
                case 'exp': res = Math.exp(val); break
                default: throw new Error(`Unknown function: ${token}`)
            }
            if (!Number.isFinite(res)) throw new Error("Calculation resulted in infinity.")
            stack.push(res)
        } else {
            // evaluate unary operators.
            if (token === 'u-') {
                const a = stack.pop()
                if (a === undefined) throw new Error("Malformed expression.")
                stack.push(-Number(a))
                continue
            }
            if (token === 'u+') {
                const a = stack.pop()
                if (a === undefined) throw new Error("Malformed expression.")
                stack.push(Number(a))
                continue
            }
            
            // evaluate binary operators.
            const b = stack.pop()
            const a = stack.pop()
            if (a === undefined || b === undefined) throw new Error("Malformed expression.")
            
            let res
            const valA = Number(a)
            const valB = Number(b)
            switch (token) {
                case '+': res = valA + valB; break
                case '-': res = valA - valB; break
                case '*': res = valA * valB; break
                case '/':
                    if (valB === 0) throw new Error("You can't divide by zero!")
                    res = valA / valB
                    break
                case '%':
                    if (valB === 0) throw new Error("You can't modulo by zero!")
                    res = valA % valB
                    break
                case '^':
                    res = Math.pow(valA, valB)
                    break
                default: throw new Error(`Unknown operator: ${token}`)
            }
            
            if (!Number.isFinite(res)) throw new Error("Calculation resulted in infinity.")
            if (Math.abs(res) > 1e15) throw new Error("Calculation result exceeds safe limits.")
            stack.push(res)
        }
    }
    
    // if the stack has exactly one item, that's our result.
    if (stack.length !== 1) throw new Error("Calculation failed.")
    
    const finalResult = stack[0];
    if (!Number.isFinite(finalResult)) throw new Error("Calculation resulted in infinity.")
    if (Math.abs(finalResult) > 1e15) throw new Error("Calculation result exceeds safe limits.")
    
    return finalResult
}
