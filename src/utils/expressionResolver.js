/*
=================================================================
FILE: src/utils/expressionResolver.js - INTEGRATED FROM N8N-LOGIC-NODES
=================================================================
Core logic for resolving expressions like {{ item.name }} on the backend.
Enhanced to work with our workflow system's universal template parser.
*/

const resolveExpression = (expression, data) => {
    if (!expression || typeof expression !== 'string') {
        return expression;
    }

    // This regex finds all instances of {{ path.to.key }}
    return expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        try {
            const keys = path.trim().split('.');
            let current = data;
            
            for (let i = 0; i < keys.length; i++) {
                if (current === null || typeof current !== 'object' || !(keys[i] in current)) {
                    return match; // Return original {{...}} if path is invalid
                }
                current = current[keys[i]];
            }
            
            // If the resolved value is an object, stringify it.
            if (typeof current === 'object' && current !== null) {
                return JSON.stringify(current);
            }
            
            return current;
        } catch (error) {
            console.warn(`Could not resolve expression: ${match}`);
            return match; // Return original on error
        }
    });
};

module.exports = { resolveExpression };