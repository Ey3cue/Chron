
Compiler.Lexer = {};

(function () {

/**
 * A pattern that can be used similarly to what one would usually do to separate individual
 * tokens by splitting on white-space. By specifying valid "special" tokens in advance, matching
 * on this regular expression will split a line into valid tokens.
 *
 * Special tokens include any valid multi-character tokens specific to the grammar. All others
 * are treated as single-charcter tokens.
 */
//                      IDs      Num   Str       ==   !=    Anything else
var _splitterPattern = /([a-z]+)|(\d+)|("[^"]*")|(==)|(!=)|(\S)/g;

var _numberPattern = /\d+/;
var _charPattern = /[a-z]/;
var _stringPattern = /"[^"]*"/;
var _idPattern = /[a-z]+/;

var _tokens;

var Token = Compiler.Token;

Compiler.Lexer.analyze = function (code) {
    code = code || Compiler.sourceCode;

    _tokens = [];

    var codeByLine = code.split('\n');
    var line, pieces, token, terminated = false;

    // Outer-loop, iterates through each line
    for (var i = 0; i < codeByLine.length; i++) {
        if (terminated) {
            break;
        }

        line = codeByLine[i].trim();

        pieces = line.match(_splitterPattern); // See RegEx above for explanation

        if (!pieces) { // Blank line (or all white-space)
            continue;
        }

        // Inner-loop, iterates through pieces of each line
        for (var j = 0; j < pieces.length; j++) {
            var lexeme = pieces[j];

            if (lexeme === '$') {
                // EOF
                _tokens.push(new Token(Token.Kind.EOF_SIGN, '$', i));
                terminated = true; // Tells outer-loop to break as well
                break; // out of the inner-loop
            } else if (_stringPattern.test(lexeme)) {
                // Strings
                // "
                _tokens.push(new Token(Token.Kind.QUOTE, '"', i));

                // Remove quotes
                lexeme = lexeme.substring(1, lexeme.length - 1);

                for (var k = 0; k < lexeme.length; k++) {
                    if (_charPattern.test(lexeme[k])) {
                        // Char
                        _tokens.push(new Token(Token.Kind.CHAR, lexeme[k], i));
                    } else if (lexeme[k] === ' ') {
                        // Space
                        _tokens.push(new Token(Token.Kind.SPACE, lexeme[k], i));
                    } else {
                        // Illegal
                        Compiler.addError("Invalid character found in CharList: '" + lexeme[i] + "'", i);
                    }
                }

                // "
                _tokens.push(new Token(Token.Kind.QUOTE, '"', i));

            } else if (_numberPattern.test(lexeme)) {
                // Digits
                lexemeToTokens(lexeme, Token.Kind.DIGIT, i);

            } else if (_idPattern.test(lexeme)) {
                // Check for reserved word
                token = checkReservedWord(lexeme);

                if (token) {
                    // Reserved word
                    token.line = i + 1;
                    _tokens.push(token);
                } else {
                    // ID
                    lexemeToTokens(lexeme, Token.Kind.ID, i);
                }

            } else {
                token = checkSpecialCharacter(lexeme);

                if (token) {
                    token.line = i + 1;
                    _tokens.push(token);
                } else {
                    Compiler.addError("Invalid character found: '" + lexeme + "'", i);
                }
            }
        }
    }

    // Check for final '$'
    if (!terminated) {
        Compiler.addWarning("Program does not end with '$'", i);
        _tokens.push(new Token(Token.Kind.EOF_SIGN, '$', i));

    } else if (code.replace(/([\s\S]*?\$)/, '').replace(/\s+/g, '').length > 0) {
        // Replaces eveything up to the dollar sign with nothing, then removes any successive
        //   white-space. If the length > 0, there's characters other than white-space succeeding
        //   the EOF.
        // Kind of lengthly check here, should probably find a better way...

        Compiler.addWarning("Ignoring code after '$'", i);
    }

    Compiler.tokenStream = _tokens;

    return _tokens;
};

/**
 * Converts a given string of tokens into individual tokens. E.g. abc into characters a, b, c.
 * Used in place of making an entire lexeme into a token until (and if) multi-character tokens are
 * allowed (in particular IDs).
 *
 * @param {String} lexeme the lexeme
 * @param {Number} kind the kind of token
 * @param {Number} line the line number
 * @param {Object} legal (optional) a function to test the legaility of the token.
 * @param {String} errorMessage (optional) an error message to display if the legality test fails.
 */
function lexemeToTokens(lexeme, kind, line, legal, errorMessage) {
    if (!$.isFunction(legal)) {
        legal = function () {
            return true;
        };
    }

    if (!errorMessage) {
        errorMessage = 'Invalid token';
    }

    for (var i = 0; i < lexeme.length; i++) {
        if (legal(lexeme[i])) {
            _tokens.push(new Token(kind, lexeme[i], line));


        } else {
            // Illegal
            Compiler.addError(errorMessage + ": '" + lexeme[i] + "'", line);
        }
    }
}

/**
 * Checks if the given lexeme is a reserved word and returns the appropriate token if so.
 *
 * @param {String} lexeme the lexeme
 *
 * @return {Object} the token matching the lexeme or null if the lexeme doesn't match a token
 */
function checkReservedWord(lexeme) {
    try {
        return _reservedWordTokens[lexeme]();
    } catch (e) {
        return null;
    }
}

/**
 * A map of reserved words to a function which, when called, generates a token of the type of the
 * mapped word.
 *
 * Used in combination with a check function (see checkReservedWord function above), this is a
 * really clean and fast way to check if a lexeme is a valid token and generate a new token of the
 * correct kind at the same time.
 */
var _reservedWordTokens = {
    'while':   function () { return new Token(Token.Kind.WHILE, 'while'  ); },
    'if':      function () { return new Token(Token.Kind.IF, 'if'        ); },
    'string':  function () { return new Token(Token.Kind.TYPE, 'string'  ); },
    'int':     function () { return new Token(Token.Kind.TYPE, 'int'     ); },
    'boolean': function () { return new Token(Token.Kind.TYPE, 'boolean' ); },
    'true':    function () { return new Token(Token.Kind.BOOLVAL, 'true' ); },
    'false':   function () { return new Token(Token.Kind.BOOLVAL, 'false'); },
    'print':   function () { return new Token(Token.Kind.PRINT, 'print'  ); }
};

/**
 * Checks if the given lexeme is a special character and returns the appropriate token if so.
 *
 * @param {String} lexeme the lexeme
 *
 * @return {Object} the token matching the lexeme or null if the lexeme doesn't match a token
 */
function checkSpecialCharacter(lexeme) {
    try {
        return _specialCharacterTokens[lexeme]();
    } catch (e) {
        return null;
    }
}

/**
 * A map of reserved special characters to a function which, when called, generates a
 * token of the type of the mapped special character.
 */
var _specialCharacterTokens = {
    '$' : function () { return new Token(Token.Kind.EOF_SIGN,       '$' ); },
    '{' : function () { return new Token(Token.Kind.OPEN_BRACE,     '{' ); },
    '}' : function () { return new Token(Token.Kind.CLOSE_BRACE,    '}' ); },
    '(' : function () { return new Token(Token.Kind.OPEN_PAREN,     '(' ); },
    ')' : function () { return new Token(Token.Kind.CLOSE_PAREN,    ')' ); },
    '=' : function () { return new Token(Token.Kind.EQUALS,         '=' ); },
    '+' : function () { return new Token(Token.Kind.INTOP,          '+' ); },
    '==': function () { return new Token(Token.Kind.BOOLOP,        '==' ); },
    '!=': function () { return new Token(Token.Kind.BOOLOP,        '!=' ); }
};

})();
