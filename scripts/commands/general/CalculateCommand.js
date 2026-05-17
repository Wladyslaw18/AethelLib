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
    // native parameter definitions (excess tokens to capture complex inputs).
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

    // ----------------------------------------------------------------------------
    // | method: execute                                                          |
    // | entry point for the calculator. joins tokens and triggers the parser.    |
    // ----------------------------------------------------------------------------
    execute(_data, player, args) {
        // combine all arguments into a single string.
        const expression = args.join(" ")
        if (!expression) {
            player.sendMessage("\xA7c\xA7l» \xA77Syntax Error: Math expression required.");
            player.sendMessage("\xA77Example: /ae:calculate 2 + 3 * (4 / 2)");
            return
        }

        try {
            // resolve the expression result using our safe parsing pipeline.
            const result = safeMathParse(expression)
            player.sendMessage(`\xA7a\xA7l» \xA7fResult: \xA7e${expression} = \xA7a${result.toLocaleString()}`);
        } catch (error) {
            // catch and display syntax errors or math logic failures (e.g. div by 0).
            player.sendMessage(`\xA7c\xA7l» \xA77Error: ${error.message}`);
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
function safeMathParse(expression) {
    // regex sanitization: only allow numbers, basic ops, decimals, and whitespace.
    const clean = expression.replace(/[^0-9+\-*/().\s]/g, '')
    // if the cleaned string differs from the input, we had illegal characters.
    if (clean !== expression.trim()) throw new Error("Invalid characters in expression.");

    // sanity check: balanced parentheses.
    let parenCount = 0
    for (const char of clean) {
        if (char === '(') parenCount++
        if (char === ')') parenCount--
        // if we ever have more closing than opening, it's invalid.
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
    let current = ''
    for (let i = 0; i < expr.length; i++) {
        const char = expr[i]
        if (/\s/.test(char)) {
            // skip whitespace but finalize current number if it exists.
            if (current) { tokens.push(current); current = '' }
        } else if (/[0-9.]/.test(char)) {
            // keep building multi-digit numbers or decimals.
            current += char
        } else if (/[+\-*/()]/.test(char)) {
            // finalize number before pushing the operator.
            if (current) { tokens.push(current); current = '' }
            tokens.push(char)
        }
    }
    // catch any trailing numbers.
    if (current) tokens.push(current)
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
    // define operator priority levels.
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 }
    
    for (const token of tokens) {
        if (!isNaN(token)) {
            // numbers go straight to output.
            output.push(parseFloat(token))
        } else if (token === '(') {
            // opening parens wait on the operator stack.
            operators.push(token)
        } else if (token === ')') {
            // closing parens pop operators until matching open paren.
            while (operators.length && operators[operators.length - 1] !== '(') output.push(operators.pop())
            operators.pop() 
        } else {
            // handle operators based on precedence.
            // pop higher or equal priority operators from the stack to the output.
            while (operators.length && precedence[operators[operators.length - 1]] >= precedence[token]) output.push(operators.pop())
            operators.push(token)
        }
    }
    // dump remaining operators.
    while (operators.length) output.push(operators.pop())
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
        } else {
            // pull two values for the operator.
            const b = stack.pop()
            const a = stack.pop()
            if (a === undefined || b === undefined) throw new Error("Malformed expression.");

            // execute operation.
            switch (token) {
                case '+': stack.push(a + b); break
                case '-': stack.push(a - b); break
                case '*': stack.push(a * b); break
                case '/': 
                    // mandatory safety check.
                    if (b === 0) throw new Error("You can't divide by zero!");
                    stack.push(a / b); 
                    break
                default: throw new Error("Unknown operator.");
            }
        }
    }
    // if the stack has exactly one item, that's our result.
    if (stack.length !== 1) throw new Error("Calculation failed.");
    return stack[0]
}
