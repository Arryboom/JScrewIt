/*
global
CHARACTERS,
COMPLEX,
CONSTANTS,
DEFAULT_16_BIT_CHARACTER_ENCODER,
DEFAULT_8_BIT_CHARACTER_ENCODER,
JSFUCK_INFINITY,
LEVEL_STRING,
OPTIMAL_B,
SIMPLE,
Empty,
ScrewBuffer,
array_isArray,
array_prototype_forEach,
assignNoEnum,
createConstructor,
createOptimizer,
createSolution,
expressParse,
json_stringify,
maskIncludes,
math_abs,
noop,
object_keys,
*/

var APPEND_LENGTH_OF_DIGITS;
var APPEND_LENGTH_OF_DIGIT_0;
var APPEND_LENGTH_OF_PLUS_SIGN;
var APPEND_LENGTH_OF_SMALL_E;

var Encoder;

var replaceIndexer;
var replaceMultiDigitNumber;
var resolveSimple;

(function ()
{
    function createReplaceString(optimize)
    {
        function replaceString(encoder, str, bond, forceString)
        {
            var replacement = encoder.replaceString(str, optimize, bond, forceString);
            if (!replacement)
                encoder.throwSyntaxError('String too complex');
            return replacement;
        }
        
        return replaceString;
    }
    
    function evalNumber(preMantissa, lastDigit, exp)
    {
        var value = +(preMantissa + lastDigit + 'e' + exp);
        return value;
    }
    
    function formatPositiveNumber(number)
    {
        function getMantissa()
        {
            var lastDigitIndex = usefulDigits - 1;
            var preMantissa = digits.slice(0, lastDigitIndex);
            var lastDigit = +digits[lastDigitIndex];
            var value = evalNumber(preMantissa, lastDigit, exp);
            for (;;)
            {
                var decreasedLastDigit = lastDigit - 1;
                var newValue = evalNumber(preMantissa, decreasedLastDigit, exp);
                if (newValue !== value)
                    break;
                lastDigit = decreasedLastDigit;
            }
            var mantissa = preMantissa + lastDigit;
            return mantissa;
        }
        
        var str;
        var match = /^(\d+)(?:\.(\d+))?(?:e(.+))?$/.exec(number);
        var digitsAfterDot = match[2] || '';
        var digits = (match[1] + digitsAfterDot).replace(/^0+/, '');
        var usefulDigits = digits.search(/0*$/);
        var exp = (match[3] | 0) - digitsAfterDot.length + digits.length - usefulDigits;
        var mantissa = getMantissa();
        if (exp >= 0)
        {
            if (exp < 10)
                str = mantissa + getExtraZeros(exp);
            else
                str = mantissa + 'e' + exp;
        }
        else
        {
            if (exp >= -mantissa.length)
                str = mantissa.slice(0, exp) + '.' + mantissa.slice(exp);
            else
            {
                var extraZeroCount = -mantissa.length - exp;
                var extraLength = APPEND_LENGTH_OF_DOT + APPEND_LENGTH_OF_DIGIT_0 * extraZeroCount;
                str =
                    replaceNegativeExponential(mantissa, exp, extraLength) ||
                    '.' + getExtraZeros(extraZeroCount) + mantissa;
            }
        }
        return str;
    }
    
    function getExtraZeros(count)
    {
        var extraZeros = Array(count + 1).join('0');
        return extraZeros;
    }
    
    function getMultiDigitLength(str)
    {
        var appendLength = 0;
        array_prototype_forEach.call(
            str,
            function (digit)
            {
                var digitAppendLength = APPEND_LENGTH_OF_DIGITS[digit];
                appendLength += digitAppendLength;
            }
        );
        return appendLength;
    }
    
    function replaceIdentifier(encoder, identifier, bondStrength)
    {
        var solution;
        if (identifier in encoder.constantDefinitions)
            solution = encoder.resolveConstant(identifier);
        else if (identifier in SIMPLE)
            solution = SIMPLE[identifier];
        if (!solution)
            encoder.throwSyntaxError('Undefined identifier ' + identifier);
        var groupingRequired =
            bondStrength && solution.hasOuterPlus ||
            bondStrength > BOND_STRENGTH_WEAK && solution.charAt(0) === '!';
        var replacement = solution.replacement;
        if (groupingRequired)
            replacement = '(' + replacement + ')';
        return replacement;
    }
    
    function replaceNegativeExponential(mantissa, exp, rivalExtraLength)
    {
        var extraZeroCount;
        if (exp % 100 > 7 - 100)
        {
            if (exp % 10 > -7)
                extraZeroCount = 0;
            else
                extraZeroCount = 10 + exp % 10;
        }
        else
            extraZeroCount = 100 + exp % 100;
        mantissa += getExtraZeros(extraZeroCount);
        exp -= extraZeroCount;
        var extraLength =
            APPEND_LENGTH_OF_DIGIT_0 * extraZeroCount +
            APPEND_LENGTH_OF_SMALL_E +
            APPEND_LENGTH_OF_MINUS +
            getMultiDigitLength(-exp + '');
        if (extraLength < rivalExtraLength)
        {
            var str = mantissa + 'e' + exp;
            return str;
        }
    }
    
    var STATIC_CHAR_CACHE = new Empty();
    var STATIC_CONST_CACHE = new Empty();
    
    var CharCache = createConstructor(STATIC_CHAR_CACHE);
    var ConstCache = createConstructor(STATIC_CONST_CACHE);
    
    var quoteString = json_stringify;
    
    APPEND_LENGTH_OF_DIGIT_0    = 6;
    APPEND_LENGTH_OF_PLUS_SIGN  = 71;
    APPEND_LENGTH_OF_SMALL_E    = 26;
    
    APPEND_LENGTH_OF_DIGITS     = [APPEND_LENGTH_OF_DIGIT_0, 8, 12, 17, 22, 27, 32, 37, 42, 47];
    
    Encoder =
        function (mask)
        {
            this.mask           = mask;
            this.charCache      = new CharCache();
            this.complexCache   = new Empty();
            this.constCache     = new ConstCache();
            this.stack          = [];
        };
    
    var encoderProtoSource =
    {
        callResolver: function (stackName, resolver)
        {
            var stack = this.stack;
            var stackIndex = stack.indexOf(stackName);
            stack.push(stackName);
            try
            {
                if (~stackIndex)
                {
                    var chain = stack.slice(stackIndex);
                    throw new SyntaxError('Circular reference detected: ' + chain.join(' < '));
                }
                resolver.call(this);
            }
            finally
            {
                stack.pop();
            }
        },
        
        complexFilterCallback: function (complex)
        {
            var result = this.complexCache[complex] !== null;
            return result;
        },
        
        constantDefinitions: CONSTANTS,
        
        createStringTokenRegExp: function ()
        {
            var regExp = RegExp(this.strTokenPattern, 'g');
            return regExp;
        },
        
        defaultResolveCharacter: function (char)
        {
            var charCode = char.charCodeAt();
            var entries;
            if (charCode < 0x100)
                entries = DEFAULT_8_BIT_CHARACTER_ENCODER;
            else
                entries = DEFAULT_16_BIT_CHARACTER_ENCODER;
            var defaultCharacterEncoder = this.findDefinition(entries);
            var replacement = defaultCharacterEncoder.call(this, charCode);
            var solution = createSolution(replacement, LEVEL_STRING, false);
            return solution;
        },
        
        findBase64AlphabetDefinition: function (element)
        {
            var definition;
            if (array_isArray(element))
                definition = this.findDefinition(element);
            else
                definition = element;
            return definition;
        },
        
        findDefinition: function (entries)
        {
            for (var entryIndex = entries.length; entryIndex--;)
            {
                var entry = entries[entryIndex];
                if (this.hasFeatures(entry.mask))
                    return entry.definition;
            }
        },
        
        findOptimalSolution: function (entries)
        {
            var result;
            entries.forEach(
                function (entry, entryIndex)
                {
                    if (this.hasFeatures(entry.mask))
                    {
                        var solution = this.resolve(entry.definition);
                        if (!result || result.length > solution.length)
                        {
                            result = solution;
                            solution.entryIndex = entryIndex;
                        }
                    }
                },
                this
            );
            return result;
        },
        
        getPaddingBlock: function (paddingInfo, length)
        {
            var paddingBlock = paddingInfo.blocks[length];
            if (paddingBlock !== undefined)
                return paddingBlock;
            this.throwSyntaxError('Undefined padding block with length ' + length);
        },
        
        hasFeatures: function (mask)
        {
            var included = maskIncludes(this.mask, mask);
            return included;
        },
        
        hexCodeOf: function (charCode, length)
        {
            var optimalB = this.findDefinition(OPTIMAL_B);
            var result = charCode.toString(16).replace(/b/g, optimalB);
            result = Array(length - result.length + 1).join(0) + result.replace(/fa?$/, 'false');
            return result;
        },
        
        // The maximum value that can be safely used as the first group threshold of a ScrewBuffer.
        // "Safely" means such that the extreme decoding test is passed in all engines.
        // This value is typically limited by the free memory available on the stack, and since the
        // memory layout of the stack changes at runtime in an unstable way, the maximum safe value
        // cannot be determined exactly.
        // The lowest recorded value so far is 1844, measured in an Android Browser 4.2.2 running on
        // an Intel Atom emulator.
        // Internet Explorer on Windows Phone occasionally failed the extreme decoding test in a
        // non-reproducible manner, although the issue seems to be related to the output size rather
        // than the grouping threshold setting.
        maxGroupThreshold: 1800,
        
        optimizeComplexCache: function (str)
        {
            if (str.length >= 100)
            {
                for (var complex in COMPLEX)
                {
                    if (!(complex in this.complexCache))
                    {
                        var entries = COMPLEX[complex];
                        var definition = this.findDefinition(entries);
                        if (!definition)
                            this.complexCache[complex] = null;
                    }
                }
                this.optimizeComplexCache = noop;
            }
        },
        
        replaceExpr: function (expr, optimize)
        {
            var unit = expressParse(expr);
            if (!unit)
                this.throwSyntaxError('Syntax error');
            var replacers = optimize ? OPTIMIZING_REPLACERS : REPLACERS;
            var replacement = this.replaceExpressUnit(unit, false, [], NaN, replacers);
            return replacement;
        },
        
        replaceExpressUnit: function (unit, bond, unitIndices, maxLength, replacers)
        {
            var mod = unit.mod || '';
            var pmod = unit.pmod || '';
            var groupingRequired = bond && mod[0] === '+';
            var maxCoreLength =
                maxLength - (mod ? (groupingRequired ? 2 : 0) + mod.length : 0) - pmod.length;
            var ops = unit.ops;
            var opCount = ops.length;
            var primaryExprBondStrength =
                opCount || pmod ?
                BOND_STRENGTH_STRONG : bond || mod ? BOND_STRENGTH_WEAK : BOND_STRENGTH_NONE;
            var output =
                this.replacePrimaryExpr(
                    unit,
                    primaryExprBondStrength,
                    unitIndices,
                    maxCoreLength,
                    replacers
                );
            if (output)
            {
                for (var index = 0; index < opCount; ++index)
                {
                    var op = ops[index];
                    var type = op.type;
                    if (type === 'call')
                    {
                        output += '()';
                        if (output.length > maxCoreLength)
                            return;
                    }
                    else
                    {
                        var opOutput;
                        var opUnitIndices = unitIndices.concat(index + 1);
                        var maxOpLength = maxCoreLength - output.length - 2;
                        var str = op.str;
                        if (str != null)
                        {
                            var strReplacer = replacers.string;
                            opOutput =
                                strReplacer(this, str, false, false, opUnitIndices, maxOpLength);
                        }
                        else
                        {
                            opOutput =
                                this.replaceExpressUnit(
                                    op,
                                    false,
                                    opUnitIndices,
                                    maxOpLength,
                                    replacers
                                );
                        }
                        if (!opOutput)
                            return;
                        if (type === 'get')
                            output += '[' + opOutput + ']';
                        else
                            output += '(' + opOutput + ')';
                    }
                }
                output += pmod;
                if (mod)
                {
                    output = mod + output;
                    if (groupingRequired)
                        output = '(' + output + ')';
                }
            }
            return output;
        },
        
        replacePrimaryExpr: function (unit, bondStrength, unitIndices, maxLength, replacers)
        {
            var output;
            var terms;
            var identifier;
            if (terms = unit.terms)
            {
                var count = terms.length;
                var maxCoreLength = maxLength - (bondStrength ? 2 : 0);
                for (var index = 0; index < count; ++index)
                {
                    var term = terms[index];
                    var termUnitIndices = count > 1 ? unitIndices.concat(index) : unitIndices;
                    var maxTermLength = maxCoreLength - 3 * (count - index - 1);
                    var termOutput =
                        this.replaceExpressUnit(
                            term,
                            index,
                            termUnitIndices,
                            maxTermLength,
                            replacers
                        );
                    if (!termOutput)
                        return;
                    output = index ? output + '+' + termOutput : termOutput;
                    maxCoreLength -= termOutput.length + 1;
                }
                if (bondStrength)
                    output = '(' + output + ')';
            }
            else if (identifier = unit.identifier)
            {
                var identifierReplacer = replacers.identifier;
                output =
                    identifierReplacer(this, identifier, bondStrength, unitIndices, maxLength);
            }
            else
            {
                var value = unit.value;
                if (typeof value === 'string')
                {
                    var strReplacer = replacers.string;
                    output = strReplacer(this, value, bondStrength, true, unitIndices, maxLength);
                }
                else if (array_isArray(value))
                {
                    if (value.length)
                    {
                        var replacement =
                            this.replaceExpressUnit(
                                value[0],
                                false,
                                unitIndices,
                                maxLength - 2,
                                replacers
                            );
                        if (replacement)
                            output = '[' + replacement + ']';
                    }
                    else if (!(maxLength < 2))
                        output = '[]';
                }
                else
                {
                    if (typeof value === 'number' && !isNaN(value))
                    {
                        var abs = math_abs(value);
                        var negative = value < 0 || 1 / value < 0;
                        var str;
                        if (abs === 0)
                            str = '0';
                        else if (abs === Infinity)
                            str = JSFUCK_INFINITY;
                        else
                            str = formatPositiveNumber(abs);
                        if (negative)
                            str = '-' + str;
                        output = STATIC_ENCODER.replaceString(str);
                        if (str.length > 1)
                            output = '+(' + output + ')';
                        if (bondStrength)
                            output = '(' + output + ')';
                    }
                    else
                        output = replaceIdentifier(STATIC_ENCODER, value + '', bondStrength);
                    if (output.length > maxLength)
                        return;
                }
            }
            return output;
        },
        
        replaceStaticString: function (str, maxLength)
        {
            var replacement = STATIC_ENCODER.replaceString(str, false, true, true, maxLength);
            return replacement;
        },
        
        replaceString: function (str, optimize, bond, forceString, maxLength)
        {
            var optimizer =
                optimize && (this.optimizer || (this.optimizer = createOptimizer(this)));
            var buffer = new ScrewBuffer(bond, forceString, this.maxGroupThreshold, optimizer);
            var match;
            this.optimizeComplexCache(str);
            if (!this.strTokenPattern)
                this.updateStringTokenPattern();
            var regExp = this.createStringTokenRegExp();
            while (match = regExp.exec(str))
            {
                if (buffer.length > maxLength)
                    return;
                var token;
                var solution;
                if (token = match[2])
                    solution = this.resolveCharacter(token);
                else if (token = match[1])
                    solution = SIMPLE[token];
                else
                {
                    token = match[0];
                    solution = this.resolveComplex(token);
                    if (!solution)
                    {
                        var lastIndex = regExp.lastIndex - token.length;
                        this.updateStringTokenPattern();
                        regExp = this.createStringTokenRegExp();
                        regExp.lastIndex = lastIndex;
                        continue;
                    }
                }
                if (!buffer.append(solution))
                    return;
            }
            var result = buffer + '';
            if (!(result.length > maxLength))
                return result;
        },
        
        resolve: function (definition)
        {
            var solution;
            var type = typeof definition;
            if (type === 'function')
                solution = definition.call(this);
            else
            {
                var expr;
                var level;
                var optimize;
                if (type === 'object')
                {
                    expr        = definition.expr;
                    level       = definition.level;
                    optimize    = definition.optimize;
                }
                else
                    expr = definition;
                var replacement = this.replaceExpr(expr, optimize);
                solution = createSolution(replacement, level);
            }
            return solution;
        },
        
        resolveCharacter: function (char)
        {
            var solution = this.charCache[char];
            if (solution === undefined)
            {
                this.callResolver(
                    quoteString(char),
                    function ()
                    {
                        var charCache;
                        var entries = CHARACTERS[char];
                        if (!entries || array_isArray(entries))
                        {
                            if (entries)
                                solution = this.findOptimalSolution(entries);
                            if (!solution)
                                solution = this.defaultResolveCharacter(char);
                            charCache = this.charCache;
                        }
                        else
                        {
                            solution = STATIC_ENCODER.resolve(entries);
                            charCache = STATIC_CHAR_CACHE;
                        }
                        solution.char = char;
                        if (solution.level == null)
                            solution.level = LEVEL_STRING;
                        charCache[char] = solution;
                    }
                );
            }
            return solution;
        },
        
        resolveComplex: function (complex)
        {
            var solution = this.complexCache[complex];
            if (solution === undefined)
            {
                this.callResolver(
                    quoteString(complex),
                    function ()
                    {
                        var entries = COMPLEX[complex];
                        var definition = this.findDefinition(entries);
                        if (definition)
                        {
                            solution = this.resolve(definition);
                            if (solution.level == null)
                                solution.level = LEVEL_STRING;
                        }
                        else
                            solution = null;
                        this.complexCache[complex] = solution;
                    }
                );
            }
            return solution;
        },
        
        resolveConstant: function (constant)
        {
            var solution = this.constCache[constant];
            if (solution === undefined)
            {
                this.callResolver(
                    constant,
                    function ()
                    {
                        var constCache;
                        var entries = this.constantDefinitions[constant];
                        if (array_isArray(entries))
                        {
                            solution = this.findOptimalSolution(entries);
                            constCache = this.constCache;
                        }
                        else
                        {
                            solution = STATIC_ENCODER.resolve(entries);
                            constCache = STATIC_CONST_CACHE;
                        }
                        constCache[constant] = solution;
                    }
                );
            }
            return solution;
        },
        
        resolveExprAt: function (expr, index, entries, paddingInfos)
        {
            if (!entries)
                this.throwSyntaxError('Missing padding entries for index ' + index);
            var paddingDefinition = this.findDefinition(entries);
            var paddingBlock;
            var indexer;
            if (typeof paddingDefinition === 'number')
            {
                var paddingInfo = this.findDefinition(paddingInfos);
                paddingBlock = this.getPaddingBlock(paddingInfo, paddingDefinition);
                indexer = index + paddingDefinition + paddingInfo.shift;
            }
            else
            {
                paddingBlock = paddingDefinition.block;
                indexer = paddingDefinition.indexer;
            }
            var fullExpr = '(' + paddingBlock + '+' + expr + ')[' + indexer + ']';
            var replacement = this.replaceExpr(fullExpr);
            var solution = createSolution(replacement, LEVEL_STRING, false);
            return solution;
        },
        
        throwSyntaxError: function (message)
        {
            var stack = this.stack;
            var stackLength = stack.length;
            if (stackLength)
                message += ' in the definition of ' + stack[stackLength - 1];
            throw new SyntaxError(message);
        },
        
        updateStringTokenPattern: function ()
        {
            function mapCallback(complex)
            {
                var str = complex + '|';
                return str;
            }
            
            var strTokenPattern =
                '(' + object_keys(SIMPLE).join('|') + ')|' +
                object_keys(COMPLEX)
                .filter(this.complexFilterCallback, this)
                .map(mapCallback).join('') +
                '([\\s\\S])';
            this.strTokenPattern = strTokenPattern;
        },
    };
    
    assignNoEnum(Encoder.prototype, encoderProtoSource);
    
    var APPEND_LENGTH_OF_DOT    = 73;
    var APPEND_LENGTH_OF_MINUS  = 154;
    
    var BOND_STRENGTH_NONE      = 0;
    var BOND_STRENGTH_WEAK      = 1;
    var BOND_STRENGTH_STRONG    = 2;
    
    var OPTIMIZING_REPLACERS = { identifier: replaceIdentifier, string: createReplaceString(true) };
    
    var REPLACERS = { identifier: replaceIdentifier, string: createReplaceString(false) };
    
    var STATIC_ENCODER = new Encoder([0, 0]);
    
    replaceIndexer =
        function (index)
        {
            var replacement = '[' + STATIC_ENCODER.replaceString(index) + ']';
            return replacement;
        };
    
    replaceMultiDigitNumber =
        function (number)
        {
            var str = formatPositiveNumber(number);
            var replacement = STATIC_ENCODER.replaceString(str);
            return replacement;
        };
    
    resolveSimple =
        function (simple, definition)
        {
            var solution;
            STATIC_ENCODER.callResolver(
                simple,
                function ()
                {
                    solution = STATIC_ENCODER.resolve(definition);
                }
            );
            return solution;
        };
}
)();
