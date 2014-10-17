/* global DEBUG */
(function (self)
{
    'use strict';
    
    // BEGIN: Features /////////////////
    
    var FEATURE_INFOS =
    {
        NO_SAFARI_LF:
        {
            description:
                'Feature linked to a string representation of dynamically generated functions ' +
                'typical for most browsers with the notable exception of Safari.\n' +
                'More specifically, in this representation, the character at index 22 is a line ' +
                'feed ("\\n").',
            check: function ()
            {
                return (Function() + '')[22] === '\n';
            }
        },
        NO_IE_SRC:
        {
            description:
                'Feature linked to a string representation of native functions typical for ' +
                'most browsers with the notable exception of Internet Explorer.\n' +
                'A remarkable trait for this feature is the lack of characters in the beginning ' +
                'of the string before "function".',
            check: function ()
            {
                return /^function Object\(\) \{(\n   )? \[native code\][^]\}/.test(Object);
            },
            excludes: ['IE_SRC']
        },
        V8_SRC:
        {
            description:
                'Feature linked to a string representation of native functions found in the V8 ' +
                'JavaScript engine.\n' +
                'V8 is used among others in Chrome, Opera, Android Browser and Node.js.\n' +
                'Remarkable traits are the lack of characters in the beginning of the string ' +
                'before "function" and a single whitespace before the "[native code]" sequence.',
            check: function ()
            {
                return /^.{19} \[native code\] \}/.test(Object);
            },
            includes: ['NO_IE_SRC'],
            excludes: ['FF_SAFARI_SRC']
        },
        FF_SAFARI_SRC:
        {
            description:
                'Feature linked to a string representation of native functions typically found ' +
                'in Firefox and Safari.\n' +
                'Remarkable traits are the lack of characters in the beginning of the string ' +
                'before "function" and a line feed with four whitespaces ("\\n    ") before the ' +
                '"[native code]" sequence.',
            check: function ()
            {
                return /^.{19}\n    \[native code\]\n\}/.test(Object);
            },
            includes: ['NO_IE_SRC'],
            excludes: ['V8_SRC']
        },
        IE_SRC:
        {
            description:
                'Feature linked to a string representation of native functions typical for ' +
                'Internet Explorer.\n' +
                'Remarkable traits are the presence of a line feed character ("\\n") in the ' +
                'beginning of the string before "function" and a line feed with four whitespaces ' +
                '("\\n    ") before the "[native code]" sequence.',
            check: function ()
            {
                return /^\nfunction Object\(\) \{\n    \[native code\]\n\}/.test(Object);
            },
            excludes: ['NO_IE_SRC']
        },
        GMT:
        {
            description:
                'Feature linked to the property that the string representation of a Date object ' +
                'contains the text "GMT" after the first 25 characters.\n' +
                'Although ECMAScript states that string representation of dates is ' +
                'implementation dependent, most engines align to the same format, making this ' +
                'feature available in all supported engines except Internet Explorer.',
            check: function ()
            {
                return /^.{25}GMT/.test(Date());
            }
        },
        SELF:
        {
            description:
                'Existence of the global object property self.\n' +
                'This feature is not available in Node.js.',
            check: function ()
            {
                return self != null;
            }
        },
        WINDOW:
        {
            description:
                'Feature linked to the property that the string representation of the global ' +
                'object evaluates to "[object Window]".\n' +
                'Not available in Android Browser versions prior to 4.4.2 and Node.js.',
            check: function ()
            {
                return (self + '') === '[object Window]';
            },
            excludes: ['DOMWINDOW']
        },
        DOMWINDOW:
        {
            description:
                'Feature linked to the property that the string representation of the global ' +
                'object evaluates to "[object DOMWindow]".\n' +
                'Only available in Android Browser versions prior to 4.4.2.',
            check: function ()
            {
                return (self + '') === '[object DOMWindow]';
            },
            excludes: ['WINDOW']
        },
        ATOB:
        {
            description:
                'Existence of the global object functions atob and btoa.\n' +
                'This feature is not available in Internet Explorer versions prior to 11 and ' +
                'Node.js.',
            check: function ()
            {
                return self != null && 'atob' in self && 'btoa' in self;
            }
        },
        NAME:
        {
            description:
                'Existence of the name property for functions.\n' +
                'This feature is not available in Internet Explorer.',
            check: function ()
            {
                return 'name' in Function();
            }
        },
        UNDEFINED:
        {
            description:
                'Feature linked to the property that Object.prototype.toString.call() evaluates ' +
                'to "[object Undefined]".\n' +
                'This behavior is defined by ECMAScript, but Android Browser prior to 4.1.2 does ' +
                'not comply with the specification and so this feature is not available in that ' +
                'browser.',
            check: function ()
            {
                return Object.prototype.toString.call() === '[object Undefined]';
            }
        },
        FILL:
        {
            description:
                'Existence of the native function Array.prototype.fill.\n' +
                'Currently only available in Firefox 31, Safari 7.1 and later versions.',
            check: function ()
            {
                return Array.prototype.fill;
            }
        },
        QUOTE:
        {
            description:
                'Existence of the native function String.prototype.quote.\n' +
                'Only available in Firefox.',
            check: function ()
            {
                return String.prototype.quote;
            }
        },
        ENTRIES:
        {
            description:
                'Feature linked to the property that the string representation of ' +
                'Array.prototype.entries() evaluates to "[object Array Iterator]".\n' +
                'This feature is available in Firefox, Chrome 38, Opera 25, Safari 7.1 and later ' +
                'versions.',
            check: function ()
            {
                return Array.prototype.entries && ([].entries() + '') === '[object Array Iterator]';
            }
        },
        
        DEFAULT:
        {
            description: 'Minimun feature level, compatible with all supported engines.'
        },
        COMPACT:
        {
            description:
                'All new browsers\' features.\n' +
                'No support for Node.js and older browsers like Internet Explorer 10 or Android ' +
                'Browser 4.1.2.',
            includes: ['ATOB', 'GMT', 'SELF', 'UNDEFINED', 'WINDOW']
        },
        NO_IE:
        {
            description:
                'Features available in all supported engines except Internet Explorer.\n' +
                'Includes features used by JSfuck with the exception of "UNDEFINED", which is ' +
                'not available in older Android Browser versions.',
            includes: ['GMT', 'NAME', 'NO_IE_SRC']
        },
        FF31:
        {
            description: 'Features available in Firefox 31 and later versions.',
            includes:
            [
                'ATOB',
                'ENTRIES',
                'FF_SAFARI_SRC',
                'FILL',
                'GMT',
                'NAME',
                'NO_SAFARI_LF',
                'QUOTE',
                'SELF',
                'UNDEFINED',
                'WINDOW'
            ]
        },
        IE9:
        {
            description:
                'Features available in Internet Explorer 9.\n' +
                'Compatible with Internet Explorer 10, 11 and possibly later versions.',
            includes: ['IE_SRC', 'NO_SAFARI_LF', 'SELF', 'UNDEFINED', 'WINDOW']
        },
        IE10:
        {
            description:
                'Features available in Internet Explorer 10.\n' +
                'Compatible with Internet Explorer 11 and possibly later versions.',
            includes: ['ATOB', 'IE_SRC', 'NO_SAFARI_LF', 'SELF', 'UNDEFINED', 'WINDOW']
        },
        IE11:
        {
            description:
                'Features available in Internet Explorer 11.\n' +
                'Possibly compatible with later versions.',
            includes: ['ATOB', 'GMT', 'IE_SRC', 'NO_SAFARI_LF', 'SELF', 'UNDEFINED', 'WINDOW']
        },
        NODE:
        {
            description:
                'Features available in Node.js.\n' +
                'Also compatible with Chrome, Opera and Android Browser 4.1.2 or later.',
            includes: ['GMT', 'NAME', 'NO_SAFARI_LF', 'UNDEFINED', 'V8_SRC']
        },
    };
    
    function getFeatureMask(features)
    {
        var result = 0;
        if (features !== undefined)
        {
            if (!Array.isArray(features))
            {
                features = [features];
            }
            features.forEach(
                function (feature)
                {
                    feature += '';
                    if (!featureMaskMap.hasOwnProperty(feature))
                    {
                        throw new ReferenceError('Unknown feature ' + JSON.stringify(feature));
                    }
                    var mask = featureMaskMap[feature];
                    result |= mask;
                }
            );
        }
        return result;
    }
    
    var featureMaskMap = { };
    var availableFeatureMask;
    var incompatibleFeatureMasks = [];
    
    // Assign a bit mask to each checkable feature
    (
    function ()
    {
        function completeFeature(feature, ignoreExcludes)
        {
            var mask = featureMaskMap[feature];
            if (mask == null)
            {
                var info = FEATURE_INFOS[feature];
                if (info.check)
                {
                    mask = 1 << bitIndex++;
                    if (info.check())
                    {
                        availableFeatureMask |= mask;
                        autoIncludes.push(feature);
                    }
                }
                mask ^= 0;
                var includes = info.includes || (info.includes = []);
                includes.forEach(
                    function (include)
                    {
                        var includeMask = completeFeature(include);
                        mask |= includeMask;
                    }
                );
                var excludes = info.excludes || (info.excludes = []);
                if (ignoreExcludes !== true)
                {
                    excludes.forEach(
                        function (exclude)
                        {
                            var excludeMask = completeFeature(exclude, true);
                            var incompatibleMask = mask | excludeMask;
                            incompatibleFeatureMasks.push(incompatibleMask);
                        }
                    );
                }
                info.name = feature;
                var available = (mask & availableFeatureMask) === mask;
                info.available = available;
                featureMaskMap[feature] = mask;
            }
            return mask;
        }
        
        var bitIndex = 0;
        var features = Object.getOwnPropertyNames(FEATURE_INFOS);
        var autoIncludes = [];
        features.forEach(completeFeature);
        FEATURE_INFOS.AUTO =
            {
                description: 'All features available in the current engine.',
                includes: autoIncludes.sort(),
                excludes: [],
                name: 'AUTO',
                available: true
            };
        featureMaskMap.AUTO = availableFeatureMask;
    }
    )();
    
    // END: Features ///////////////////
    
    // BEGIN: Definers /////////////////
    
    var FB_PADDINGS =
    [
        ,
        ,
        ,
        ,
        ,
        ,
        ,
        'FHP_3_NO + FBEP_4_S',
        ,
        'FHP_5_N + FBEP_4_S',
        'FHP_1_S + FBEP_9_U',
        ,
        '[FHP_3_NO] + FBEP_9_U',
        ,
        ,
        'FHP_5_N + [RP_1_NO] + FBEP_9_U'
    ];
    
    var FB_NO_IE_PADDINGS =
    [
        ,
        ,
        ,
        ,
        ,
        'RP_1_NO + FBEP_4_S',
        ,
        'RP_3_NO + FBEP_4_S',
        ,
        'FBEP_9_U',
        '[RP_1_NO] + FBEP_9_U',
        ,
        '[RP_3_NO] + FBEP_9_U'
    ];
    
    var FH_PADDINGS =
    [
        ,
        'FHP_1_S',
        ,
        'FHP_3_NO',
        ,
        'FHP_5_N',
        'FHP_5_N + [RP_1_NO]',
        'FHP_3_NO + [RP_4_N]',
        'FHP_3_NO + [RP_5_N]',
        // Unused:
        // 'FHP_5_N + [RP_4_N]'
    ];
    
    var R_PADDINGS =
    [
        '[]',
        'RP_1_NO',
        ,
        'RP_3_NO',
        'RP_4_N',
        'RP_5_N',
        'RP_6_SO'
    ];
    
    function createDefinitionEntry(definition, featureArgs, startIndex)
    {
        var features = Array.prototype.slice.call(featureArgs, startIndex);
        var featureMask = getFeatureMask(features);
        var entry = { definition: definition, featureMask: featureMask };
        return entry;
    }
    
    function define(definition)
    {
        var result = createDefinitionEntry(definition, arguments, 1);
        return result;
    }
    
    function defineFBCharAt(expr, index)
    {
        var entries;
        switch (index)
        {
        case 18:
            entries =
            [
                define(12),
                define(3, 'V8_SRC'),
                define(0, 'FF_SAFARI_SRC'),
                define(0, 'IE_SRC')
            ];
            break;
        case 20:
        case 30:
            entries =
            [
                define(10),
                define(0, 'V8_SRC'),
                define(6, 'FF_SAFARI_SRC'),
                define(5, 'IE_SRC')
            ];
            break;
        case 23:
            entries =
            [
                define(7),
                define(0, 'V8_SRC'),
                define(3, 'FF_SAFARI_SRC'),
                define(3, 'IE_SRC')
            ];
            break;
        case 25:
            entries =
            [
                define(15),
                define(5, 'NO_IE_SRC'),
                define(1, 'FF_SAFARI_SRC'),
                define(0, 'IE_SRC')
            ];
            break;
        case 32:
            entries =
            [
                define(9),
                define(0, 'V8_SRC'),
                define(4, 'FF_SAFARI_SRC'),
                define(3, 'IE_SRC')
            ];
            break;
        case 34:
            entries =
            [
                define(7),
                define(9, 'NO_IE_SRC'),
                define(6, 'V8_SRC'),
                define(3, 'FF_SAFARI_SRC'),
                define(1, 'IE_SRC')
            ];
            break;
        }
        var definition =
            entries ? createCharAtDefinition(expr, index, entries, FB_PADDING_INFOS) : null;
        var result = createDefinitionEntry(definition, arguments, 2);
        return result;
    }
    
    function defineFHCharAt(expr, index)
    {
        var entries;
        switch (index)
        {
        case 3:
        case 13:
            entries =
            [
                define(7),
                define(0, 'NO_IE_SRC'),
                define(6, 'IE_SRC')
            ];
            break;
        case 6:
        case 16:
            entries =
            [
                define(5),
                define(4, 'NO_IE_SRC'),
                define(3, 'IE_SRC')
            ];
            break;
        case 8:
        case 18:
            entries =
            [
                define(3),
                define(1, 'IE_SRC')
            ];
            break;
        case 9:
            entries =
            [
                define(1),
                define(0, 'IE_SRC')
            ];
            break;
        case 11:
            entries =
            [
                // Unused:
                // define(9),
                define(0, 'NO_IE_SRC'),
                define(0, 'IE_SRC')
            ];
            break;
        case 12:
            entries =
            [
                define(8),
                define(0, 'NO_IE_SRC'),
                define(0, 'IE_SRC')
            ];
            break;
        case 14:
            entries =
            [
                define(6),
                define(5, 'IE_SRC')
            ];
            break;
        case 15:
            entries =
            [
                define(5),
                define(4, 'IE_SRC')
            ];
            break;
        }
        var definition =
            entries ? createCharAtDefinition(expr, index, entries, FH_PADDING_INFOS) : null;
        var result = createDefinitionEntry(definition, arguments, 2);
        return result;
    }
    
    function definePadding(paddingStrings, shift)
    {
        var definition = { paddingStrings: paddingStrings, shift: shift };
        var result = createDefinitionEntry(definition, arguments, 2);
        return result;
    }
    
    var FB_PADDING_INFOS =
    [
        definePadding(FB_PADDINGS, 0),
        definePadding(FB_NO_IE_PADDINGS, 0, 'NO_IE_SRC'),
        definePadding(R_PADDINGS, 0, 'V8_SRC'),
        definePadding(R_PADDINGS, 4, 'FF_SAFARI_SRC'),
        definePadding(R_PADDINGS, 5, 'IE_SRC')
    ];
    
    var FH_PADDING_INFOS =
    [
        definePadding(FH_PADDINGS, 0),
        definePadding(R_PADDINGS, 0, 'NO_IE_SRC'),
        definePadding(R_PADDINGS, 1, 'IE_SRC')
    ];
    
    // END: Definers ///////////////////
    
    // BEGIN: Encoder //////////////////
    
    // Definition syntax has been changed to match JavaScript more closely. The main differences
    // from JSFuck are:
    // * Support for constant literals like "ANY_FUNCTION", "FHP_3_NO", etc. improves readability
    //   and simplifies maintenance.
    // * 10 evaluates to a number, while "10" evaluates to a string. This can make a difference in
    //   certain expressions and may affect the mapping length.
    // * String literals must be always double quoted.
    
    var CHARACTERS =
    {
        'a':            '"false"[1]',
        'b':
        [
            defineFHCharAt('Number', 12),
            define('(ARRAY_ITERATOR + [])[2]', 'ENTRIES')
        ],
        'c':
        [
            defineFHCharAt('ANY_FUNCTION', 3)
        ],
        'd':            '"undefined"[2]',
        'e':            '"true"[3]',
        'f':            '"false"[0]',
        'g':
        [
            defineFHCharAt('String', 14)
        ],
        'h':            '(101)[TO_STRING]("21")[1]',
        'i':            '([RP_5_N] + undefined)["10"]',
        'j':
        [
            define('(Function("return{}")() + [])["10"]'),
            define('(self + [])[3]', 'SELF'),
            define('(ARRAY_ITERATOR + [])[3]', 'ENTRIES')
        ],
        'k':            '(20)[TO_STRING]("21")',
        'l':            '"false"[2]',
        'm':
        [
            define('(RP_6_SO + Function())["20"]'),
            defineFHCharAt('Number', 11, 'NO_IE_SRC'),
            defineFHCharAt('Number', 11, 'IE_SRC')
        ],
        'n':            '"undefined"[1]',
        'o':
        [
            defineFHCharAt('ANY_FUNCTION', 6)
        ],
        'p':            '(211)[TO_STRING]("31")[1]',
        'q':            '(212)[TO_STRING]("31")[1]',
        'r':            '"true"[1]',
        's':            '"false"[3]',
        't':            '"true"[0]',
        'u':            '"undefined"[0]',
        'v':
        [
            defineFBCharAt('FILTER', 25),
            defineFBCharAt('FILL', 23, 'FILL')
        ],
        'w':
        [
            define('(32)[TO_STRING]("33")'),
            define('(self + [])["slice"]("-2")[0]', 'SELF'),
            define('(self + [])["13"]', 'WINDOW'),
            define('(RP_4_N + self)["20"]', 'DOMWINDOW')
        ],
        'x':            '(101)[TO_STRING]("34")[1]',
        'y':            '(RP_3_NO + [Infinity])["10"]',
        'z':            '(35)[TO_STRING]("36")',

        'A':
        [
            defineFHCharAt('Array', 9),
            define('(RP_3_NO + ARRAY_ITERATOR)[11]', 'ENTRIES')
        ],
        'B':
        [
            defineFHCharAt('Boolean', 9)
        ],
        'C':
        [
            define('escape(""["italics"]())[2]'),
            define(null, 'ATOB')
        ],
        'D':
        [
            define('escape("]")[2]'),
            define('btoa("00")[1]', 'ATOB')
        ],
        'E':
        [
            defineFHCharAt('RegExp', 12),
            define('btoa("01")[2]', 'ATOB')
        ],
        'F':
        [
            defineFHCharAt('Function', 9)
        ],
        'G':
        [
            define('(RP_5_N + Date())["30"]', 'GMT'),
            define('btoa("0false")[1]', 'ATOB')
        ],
        'H':
        [
            define('btoa(true)[1]', 'ATOB')
        ],
        'I':            '"Infinity"[0]',
        'J':
        [
            define('btoa(true)[2]', 'ATOB')
        ],
     // 'K':    ,
        'L':
        [
            define('btoa(".")[0]', 'ATOB')
        ],
        'M':
        [
            define('(RP_4_N + Date())["30"]', 'GMT'),
            define('btoa(0)[0]', 'ATOB')
        ],
        'N':            '"NaN"[0]',
        'O':            '(RP_3_NO + Function("return{}")())["11"]',
        'P':
        [
            define('btoa(""["italics"]())[0]', 'ATOB')
        ],
        'Q':
        [
            define('btoa(1)[1]', 'ATOB')
        ],
        'R':
        [
            defineFHCharAt('RegExp', 9),
            define('btoa("0true")[2]', 'ATOB')
        ],
        'S':
        [
            defineFHCharAt('String', 9)
        ],
        'T':
        [
            define('(RP_3_NO + Date())["30"]', 'GMT'),
            define('btoa(NaN)[0]', 'ATOB')
        ],
        'U':
        [
            define('(RP_3_NO + Function("return{}")()[TO_STRING]["call"]())["11"]', 'UNDEFINED'),
            define('(RP_4_N + btoa(false))["10"]', 'ATOB')
        ],
        'V':
        [
            define('btoa(undefined)["10"]', 'ATOB')
        ],
        'W':
        [
            define('(self + RP_3_NO)["slice"]("-10")[0]', 'SELF'),
            define('(RP_3_NO + self)["11"]', 'WINDOW'),
            define('(self + [])["11"]', 'DOMWINDOW')
        ],
        'X':
        [
            define('btoa("1true")[1]', 'ATOB')
        ],
        'Y':
        [
            define('btoa("a")[0]', 'ATOB')
        ],
        'Z':
        [
            define('btoa(false)[0]', 'ATOB')
        ],

        '\n':
        [
            define('(Function() + [])["23"]'),
            define('(Function() + [])["22"]', 'NO_SAFARI_LF'),
            define('(RP_1_NO + FILTER)["20"]', 'FF_SAFARI_SRC'),
            define('(RP_3_NO + FILL)["20"]', 'FF_SAFARI_SRC', 'FILL'),
            define('(ANY_FUNCTION + [])[0]', 'IE_SRC')
        ],
        '\x1e':
        [
            define('(RP_5_N + atob("NaNfalse"))["10"]', 'ATOB')
        ],
        ' ':
        [
            defineFHCharAt('ANY_FUNCTION', 8),
            define('(RP_1_NO + FILTER)["20"]', 'V8_SRC'),
            define('(RP_3_NO + FILTER)["20"]', 'V8_SRC', 'FILL'),
            define('(FILTER + [])["20"]', 'FF_SAFARI_SRC'),
            define('(RP_3_NO + FILL)["21"]', 'FF_SAFARI_SRC', 'FILL')
        ],
    //  '!':    ,
        '"':            '""["fontcolor"]()["12"]',
    //  '#':    ,
    //  '$':    ,
        '%':
        [
            define('escape(FILTER)["20"]'),
            define('escape(false + FILL)["20"]', 'NO_IE_SRC', 'FILL'),
            define('escape(ANY_FUNCTION)[0]', 'IE_SRC'),
            define(null, 'ATOB'),
        ],
    //  '&':    ,
    //  '\'':   ,
        '(':
        [
            defineFHCharAt('FILTER', 15),
            defineFHCharAt('FILL', 13, 'FILL')
        ],
        ')':
        [
            defineFHCharAt('FILTER', 16),
            defineFHCharAt('FILL', 14, 'FILL')
        ],
    //  '*':    ,
        '+':            '(+"1e100" + [])[2]',
        ',':            '([]["slice"]["call"]("false") + [])[1]',
        '-':            '(+".0000000001" + [])[2]',
        '.':            '(+"11e20" + [])[1]',
        '/':            '"0false"["italics"]()["10"]',
        ':':
        [
            define('(RegExp() + [])[3]'),
            define(null, 'ATOB')
        ],
    //  ';':    ,
        '<':            '""["italics"]()[0]',
        '=':            '""["fontcolor"]()["11"]',
        '>':            '""["italics"]()[2]',
        '?':            '(RegExp() + [])[2]',
    //  '@':    ,
        '[':
        [
            defineFBCharAt('FILTER', 20),
            defineFBCharAt('FILL', 18, 'FILL')
        ],
        '\\':
        [
        
            define('""["fontcolor"]()["quote"]()["13"]', 'QUOTE'),
            define(null, 'ATOB'),
            define('(ANY_FUNCTION + [])["quote"]()[1]', 'IE_SRC', 'QUOTE'),
            define('(FILTER + [])["quote"]()["20"]', 'FF_SAFARI_SRC', 'QUOTE'),
            define('(RP_3_NO + FILL)["quote"]()["21"]', 'FF_SAFARI_SRC', 'FILL', 'QUOTE')
        ],
        ']':
        [
            defineFBCharAt('FILTER', 32),
            defineFBCharAt('FILL', 30, 'FILL')
        ],
        '^':
        [
            define('atob("undefinedfalse")[2]', 'ATOB')
        ],
    //  '_':    ,
    //  '`':    ,
        '{':
        [
            defineFHCharAt('FILTER', 18),
            defineFHCharAt('FILL', 16, 'FILL')
        ],
    //  '|':    ,
        '}':
        [
            defineFBCharAt('FILTER', 34),
            defineFBCharAt('FILL', 32, 'FILL')
        ],
    //  '~':    ,
        
        '\x8a':
        [
            define('(RP_4_N + atob("NaNundefined"))["10"]', 'ATOB')
        ],
        '\x8d':
        [
            define('atob("0NaN")[2]', 'ATOB')
        ],
        '\x96':
        [
            define('atob("00false")[3]', 'ATOB')
        ],
        '\x9e':
        [
            define('atob(true)[2]', 'ATOB')
        ],
        '£':
        [
            define('atob(NaN)[1]', 'ATOB')
        ],
        '¥':
        [
            define('atob("0false")[2]', 'ATOB')
        ],
        '§':
        [
            define('atob("00undefined")[2]', 'ATOB')
        ],
        '©':
        [
            define('atob("falsefalse")[1]', 'ATOB')
        ],
        '®':
        [
            define('atob("NaNtrue")[3]', 'ATOB')
        ],
        '±':
        [
            define('atob("0false")[3]', 'ATOB')
        ],
        '¶':
        [
            define('atob(true)[0]', 'ATOB')
        ],
        'º':
        [
            define('atob("undefinedfalse")[0]', 'ATOB')
        ],
        '»':
        [
            define('atob(true)[1]', 'ATOB')
        ],
        'Ö':
        [
            define('atob("0NaN")[1]', 'ATOB')
        ],
        'Ú':
        [
            define('atob("0truefalse")[1]', 'ATOB')
        ],
        'Ý':
        [
            define('atob("0undefined")[2]', 'ATOB')
        ],
        'â':
        [
            define('atob("falsefalseundefined")["11"]', 'ATOB')
        ],
        'é':
        [
            define('atob("0undefined")[1]', 'ATOB')
        ],
        'î':
        [
            define('atob("0truefalse")[2]', 'ATOB')
        ],
        'ö':
        [
            define('atob("0false")[1]', 'ATOB')
        ],
        'ø':
        [
            define('atob("undefinedundefined")["10"]', 'ATOB')
        ],
    };
    
    var CONSTANTS =
    {
        // JavaScript globals
        
        Array:          '[][CONSTRUCTOR]',
        Boolean:        '(false)[CONSTRUCTOR]',
        Date:           'Function("return Date")()',
        Function:       'ANY_FUNCTION[CONSTRUCTOR]',
        Number:         '(0)[CONSTRUCTOR]',
        RegExp:         'Function("return/false/")()[CONSTRUCTOR]',
        String:         '("")[CONSTRUCTOR]',
        
        atob:
        [
            define('Function("return atob")()', 'ATOB')
        ],
        btoa:
        [
            define('Function("return btoa")()', 'ATOB')
        ],
        escape:         'Function("return escape")()',
        self:
        [
            define('Function("return self")()', 'SELF')
        ],
        unescape:       'Function("return unescape")()',
        
        // Custom definitions
        
        ANY_FUNCTION:
        [
            define('FILTER'),
            define('FILL', 'FILL')
        ],
        ARRAY_ITERATOR:
        [
            define('[]["entries"]()', 'ENTRIES')
        ],
        CONSTRUCTOR:    '"constructor"',
        FILL:
        [
            define('[]["fill"]', 'FILL')
        ],
        FILTER:         '[]["filter"]',
        TO_STRING:
        [
            define('"toString"'),
            define('"to" + String["name"]', 'NAME')
        ],
        
        // Function body extra padding blocks: prepended to a function to align the function's body
        // at the same position on different browsers.
        // The number after "FBEP_" is the maximum character overhead. The letters after the last
        // underscore have the same meaning as in regular padding blocks.
        FBEP_4_S:       '[[true][+!!(RP_5_N + ANY_FUNCTION)["40"]]]',
        FBEP_9_U:       '[false][+!(RP_5_N + ANY_FUNCTION)["40"]]',
        
        // Function header padding blocks: prepended to a function to align the function's header
        // at the same position on different browsers.
        // The number after "FBP_" is the maximum character overhead. The letters after the last
        // underscore have the same meaning as in regular padding blocks.
        FHP_1_S:        '[[0][+!!(+(ANY_FUNCTION + [])[0] + true)]]',
        // Unused:
        // FHP_2_NO:       '+(+!(+(ANY_FUNCTION + [])[0] + true)+[0])',
        FHP_3_NO:       '+(1 + [+(ANY_FUNCTION + [])[0]])',
        FHP_5_N:        '!!(+(ANY_FUNCTION + [])[0] + true)',
                
        // Regular padding blocks.
        // The number after "RP_" is the character overhead.
        // The postifx "_S" in the name indicates that the constant always evaluates to a string or
        // an array.
        // The postfix "_N" in the name indicates that the constant does not always evaluate to a
        // string or an array, but it never evaluates to undefined.
        // The postfix "_U" in the name indicates that the constant can evaluate to undefined.
        // A trailing "O" as in "_NO" and "_SO" is appended to the name if the constant resolves to
        // an expression containing a plus sign ("+") out of brackets not preceded by an exclamation
        // mark ("!"). When concatenating such a constant with other expressions, the outer plus
        // constant should be placed in the beginning whenever possible in order to save an extra
        // pair of brackets in the resolved expressions.
        RP_1_NO:        '0',
        RP_3_NO:        'NaN',
        RP_4_N:         'true',
        RP_5_N:         'false',
        RP_6_SO:        '"0false"',
    };
    
    var DEFAULT_CHARACTER_ENCODER =
    [
        define(
            function (character)
            {
                var charCode = character.charCodeAt(0);
                var encoder =
                    charCode < 0x100 ? encodeCharacterByUnescape8 : encodeCharacterByUnescape16;
                var result = createSolution(encoder.call(this, charCode), LEVEL_STRING, false);
                return result;
            }
        ),
        define(
            function (character)
            {
                var charCode = character.charCodeAt(0);
                var encoder = charCode < 0x100 ? encodeCharacterByAtob : encodeCharacterByEval;
                var result = createSolution(encoder.call(this, charCode), LEVEL_STRING, false);
                return result;
            },
            'ATOB'
        )
    ];
    
    var LEVEL_STRING    = 1;
    var LEVEL_OBJECT    = 0;
    var LEVEL_NUMERIC   = -1;
    var LEVEL_UNDEFINED = -2;
    
    var SIMPLE =
    {
        'false':        '![]',
        'true':         '!![]',
        'undefined':    '[][[]]',
        'NaN':          '+[![]]',
        'Infinity':     '+"1e1000"',
    };
    
    var quoteCharacter = JSON.stringify;
    var simplePattern;
    
    function createCharAtDefinition(expr, index, entries, paddingInfos)
    {
        function definition()
        {
            var padding = this.findBestDefinition(entries);
            if (padding != null)
            {
                var paddingInfo = this.findBestDefinition(paddingInfos);
                var paddingString = paddingInfo.paddingStrings[padding];
                var indexer = index + padding + paddingInfo.shift;
                if (indexer > 9)
                {
                    indexer = '"' + indexer + '"';
                }
                var fullExpr = '(' + paddingString + '+' + expr + ')[' + indexer + ']';
                var result = createSolution(this.replace(fullExpr), LEVEL_STRING, false);
                return result;
            }
        }
        
        return definition;
    }
    
    function createDigitDefinition(digit)
    {
        function definition()
        {
            var result = createSolution(encodeDigit(digit), LEVEL_NUMERIC);
            return result;
        }
        
        return definition;
    }
    
    function createSolution(replacement, level, outerPlus)
    {
        var result = Object(replacement);
        result.level = level;
        result.outerPlus = outerPlus;
        return result;
    }
    
    function encodeCharacterByAtob(charCode)
    {
        var BASE64_ALPHABET_HI_2 = ['NaN', 'false', 'truefalse', '0'];
        var BASE64_ALPHABET_HI_4 =
        [
            'A',
            'F',
            'Infinity',
            'NaNfalse',
            'S',
            'W',
            'a',
            'false',
            'i',
            'n',
            'r',
            'true',
            'y',
            '0',
            '4',
            '8',
        ];
        var BASE64_ALPHABET_HI_6 =
        [
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'Infinity',
            'J',
            'K',
            'L',
            'M',
            'NaN',
            'O',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z',
            'a',
            'b',
            'c',
            'd',
            'e',
            'false',
            'g',
            'h',
            'i',
            'j',
            'k',
            'l',
            'm',
            'n',
            'o',
            'p',
            'q',
            'r',
            's',
            'true',
            'undefined',
            'v',
            'w',
            'x',
            'y',
            'z',
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '+',
            '/',
        ];
        var BASE64_ALPHABET_LO_2 = ['000', 'NaN', 'falsefalsefalse', '00f'];
        var BASE64_ALPHABET_LO_4 =
        [
            '0A',
            '0B',
            '0i',
            '0j',
            '00',
            '01',
            '02',
            '03',
            '04',
            '05',
            '0a',
            '0r',
            '0s',
            '0t',
            'undefinedfalse',
            '0f',
        ];
        var BASE64_ALPHABET_LO_6 =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        
        var param1 = BASE64_ALPHABET_LO_6[charCode >> 2] + BASE64_ALPHABET_HI_2[charCode & 0x03];
        var postfix1 = '(' + this.resolveString(param1) + ')';
        if (param1.length > 2)
        {
            postfix1 += this.replace('[0]');
        }
        var length1 = postfix1.length;
        
        var param2Left = BASE64_ALPHABET_LO_4[charCode >> 4];
        var param2 = param2Left + BASE64_ALPHABET_HI_4[charCode & 0x0f];
        var index2 = 1 + (param2Left.length - 2) / 4 * 3;
        if (index2 > 9)
        {
            index2 = '"' + index2 + '"';
        }
        var postfix2 = '(' + this.resolveString(param2) + ')' + this.replace('[' + index2 + ']');
        var length2 = postfix2.length;
        
        var param3Left = BASE64_ALPHABET_LO_2[charCode >> 6];
        var param3 = param3Left + BASE64_ALPHABET_HI_6[charCode & 0x3f];
        var index3 = 2 + (param3Left.length - 3) / 4 * 3;
        if (index3 > 9)
        {
            index3 = '"' + index3 + '"';
        }
        var postfix3 = '(' + this.resolveString(param3) + ')' + this.replace('[' + index3 + ']');
        var length3 = postfix3.length;
        
        var postfix =
            length1 <= length2 && length1 <= length3 ?
            postfix1 :
            length2 <= length3 ? postfix2 : postfix3;
        var result = this.resolveConstant('atob') + postfix;
        return result;
    }
    
    function encodeCharacterByEval(charCode)
    {
        var hexCode = this.hexCodeOf(charCode, 4);
        var result =
            this.resolveConstant('Function') + '(' +
            this.resolveString('return"\\u' + hexCode + '"') + ')()';
        if (hexCode.length > 4)
        {
            result += this.replace('[0]');
        }
        return result;
    }
    
    function encodeCharacterByUnescape16(charCode)
    {
        var hexCode = this.hexCodeOf(charCode, 4);
        var result =
            this.resolveConstant('unescape') + '(' + this.resolveString('%u' + hexCode) + ')';
        if (hexCode.length > 4)
        {
            result += this.replace('[0]');
        }
        return result;
    }
    
    function encodeCharacterByUnescape8(charCode)
    {
        var hexCode = this.hexCodeOf(charCode, 2);
        var result =
            this.resolveConstant('unescape') + '(' + this.resolveString('%' + hexCode) + ')';
        if (hexCode.length > 2)
        {
            result += this.replace('[0]');
        }
        return result;
    }
    
    function encodeDigit(digit)
    {
        switch (digit)
        {
        case '0':
            return '+[]';
        case '1':
            return '+!![]';
        default:
            var result = '!![]';
            do { result += '+!![]'; } while (--digit > 1);
            return result;
        }
    }
    
    // Determine whether the specified solution contains a plus sign out of brackets not preceded by
    // an exclamation mark.
    function hasOuterPlus(solution)
    {
        if (solution.outerPlus != null)
        {
            return solution.outerPlus;
        }
        var unclosed = 0;
        var outerPlus =
            solution.match(/!\+|./g).some(
                function (match)
                {
                    switch (match)
                    {
                    case '+':
                        return !unclosed;
                    case '(':
                    case '[':
                        ++unclosed;
                        break;
                    case ')':
                    case ']':
                        --unclosed;
                        break;
                    }
                    return false;
                }
            );
        solution.outerPlus = outerPlus;
        return outerPlus;
    }
    
    function isFollowedByLeftSquareBracket(expr, offset)
    {
        for (;;)
        {
            var character = expr[offset++];
            if (character === '[')
            {
                return true;
            }
            if (character !== ' ')
            {
                return false;
            }
        }
    }
    
    function isPrecededByOperator(expr, offset)
    {
        for (;;)
        {
            var character = expr[--offset];
            if (character === '+' || character === '!')
            {
                return true;
            }
            if (character !== ' ')
            {
                return false;
            }
        }
    }
    
    function replaceToken(wholeMatch, number, quotedString, string, space, literal, offset, expr)
    {
        var replacement;
        if (number)
        {
            replacement = encodeDigit(number[0]);
            var length = number.length;
            for (var index = 1; index < length; ++index)
            {
                replacement += '+[' + encodeDigit(number[index]) + ']';
            }
            if (length > 1)
            {
                replacement = '+(' + replacement + ')';
            }
            if (isPrecededByOperator(expr, offset))
            {
                replacement = '(' + replacement + ')';
            }
        }
        else if (quotedString)
        {
            replacement =
                this.resolveString(
                string,
                isPrecededByOperator(expr, offset) ||
                isFollowedByLeftSquareBracket(expr, offset + wholeMatch.length)
                );
        }
        else if (space)
        {
            replacement = '';
        }
        else if (literal)
        {
            if (literal in CONSTANTS)
            {
                replacement = this.resolveConstant(literal);
            }
            else if (literal in SIMPLE)
            {
                replacement = this.resolveSimple(literal);
            }
            else
            {
                throw new SyntaxError(
                    'Undefined literal ' + literal + ' in the definition of ' +
                    this.peekLastFromStack()
                    );
            }
            if (isPrecededByOperator(expr, offset) && hasOuterPlus(replacement))
            {
                replacement = '(' + replacement + ')';
            }
        }
        else
        {
            throw new SyntaxError(
                'Unexpected character ' + quoteCharacter(wholeMatch) + ' in the definition of ' +
                this.peekLastFromStack()
                );
        }
        return replacement;
    }
    
    function Encoder(featureMask)
    {
        this.featureMask = featureMask;
        this.characterCache = { };
        this.constantCache = { };
        this.stack = [];
    }
    
    Encoder.prototype =
    {
        callResolver: function (stackName, resolver)
        {
            var stack = this.stack;
            var stackIndex = stack.indexOf(stackName);
            stack.push(stackName);
            try
            {
                if (stackIndex >= 0)
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
        
        encode: function (input, wrapWithEval)
        {
            var output = this.resolveString(input);
            if (wrapWithEval)
            {
                output = this.resolveConstant('Function') + '(' + output + ')()';
            }
            return output;
        },
        
        findBestDefinition: function (entries)
        {
            for (var index = entries.length; index-- > 0;)
            {
                var entry = entries[index];
                if (this.hasFeatures(entry.featureMask))
                {
                    return entry.definition;
                }
            }
        },
        
        hasFeatures: function (featureMask)
        {
            return (featureMask & this.featureMask) === featureMask;
        },
    
        hexCodeOf: function (charCode, length)
        {
            var result = charCode.toString(16);
            if (!this.hasFeatures(featureMaskMap.ENTRIES))
            {
                result = result.replace(/b/g, 'B');
            }
            result = Array(length - result.length + 1).join(0) + result.replace(/fa?$/, 'false');
            return result;
        },
        
        peekLastFromStack: function ()
        {
            var stack = this.stack;
            var result = stack[stack.length - 1];
            return result;
        },
        
        replace: function (expr)
        {
            var replacement =
                expr.replace(
                // IE 9 doesn't interpret '[^]' correctly; using '[^"]' instead.
                /([0-9]+)|("([^"]*)")|( +)|([$A-Z_a-z][$0-9A-Z_a-z]*)|[^!()+[\]]/g,
                this.replaceToken || (this.replaceToken = replaceToken.bind(this))
                );
            return replacement;
        },
        
        resolveCharacter: function (character)
        {
            var solution = this.characterCache[character];
            if (solution === undefined)
            {
                this.callResolver(
                    quoteCharacter(character),
                    function ()
                    {
                        var expr;
                        var entries = CHARACTERS[character];
                        if (Array.isArray(entries))
                        {
                            expr = this.findBestDefinition(entries);
                        }
                        else
                        {
                            expr = entries;
                        }
                        if (expr == null)
                        {
                            var defaultCharacterEncoder =
                                this.findBestDefinition(DEFAULT_CHARACTER_ENCODER);
                            solution = defaultCharacterEncoder.call(this, character);
                        }
                        else if (expr instanceof Function)
                        {
                            solution = expr.call(this);
                        }
                        else
                        {
                            var replacement = this.replace(expr);
                            solution = createSolution(replacement, LEVEL_STRING);
                        }
                        this.characterCache[character] = solution;
                    }
                );
            }
            return solution;
        },
        
        resolveConstant: function (constant)
        {
            var solution = this.constantCache[constant];
            if (solution === undefined)
            {
                this.callResolver(
                    constant,
                    function ()
                    {
                        var expr;
                        var entries = CONSTANTS[constant];
                        if (Array.isArray(entries))
                        {
                            expr = this.findBestDefinition(entries);
                        }
                        else
                        {
                            expr = entries;
                        }
                        this.constantCache[constant] = solution =
                            createSolution(this.replace(expr));
                    }
                );
            }
            return solution;
        },
        
        resolveSimple: function (simple)
        {
            var solution = SIMPLE[simple];
            if (!(solution instanceof Object))
            {
                this.callResolver(
                    simple,
                    function ()
                    {
                        SIMPLE[simple] = solution = createSolution(this.replace(solution));
                    }
                );
            }
            return solution;
        },
        
        resolveString: function (string, strongBound)
        {
            var result;
            var multipart = false;
            var fullLevel;
            if (string)
            {
                if (!simplePattern)
                {
                    simplePattern = Object.getOwnPropertyNames(SIMPLE).join('|') + '|[^]';
                }
                var regExp = new RegExp(simplePattern, 'g');
                var match;
                while (match = regExp.exec(string))
                {
                    var token = match[0];
                    var solution;
                    var level;
                    if (token in SIMPLE)
                    {
                        solution = this.resolveSimple(token);
                        level = solution.level;
                        if (level === undefined)
                        {
                            var value = eval(solution + '');
                            solution.level =
                                level =
                                value === undefined ? LEVEL_UNDEFINED : LEVEL_NUMERIC;
                        }
                    }
                    else
                    {
                        solution = this.resolveCharacter(token);
                        level = solution.level;
                    }
                    if (
                        result &&
                        (fullLevel < LEVEL_OBJECT && level < LEVEL_OBJECT ||
                        hasOuterPlus(solution)))
                    {
                        if (level > LEVEL_UNDEFINED)
                        {
                            solution = '[' + solution + ']';
                        }
                        else if (fullLevel > LEVEL_UNDEFINED)
                        {
                            result = '[' + result + ']';
                        }
                        else
                        {
                            result += '+[]';
                        }
                    }
                    if (result)
                    {
                        multipart = true;
                        fullLevel = LEVEL_STRING;
                        result += '+' + solution;
                    }
                    else
                    {
                        fullLevel = level;
                        result = solution + '';
                    }
                }
            }
            else
            {
                fullLevel = LEVEL_OBJECT;
                result = '[]';
            }
            if (fullLevel < LEVEL_STRING)
            {
                multipart = true;
                result += '+[]';
            }
            if (multipart && strongBound)
            {
                result = '(' + result + ')';
            }
            return result;
        }
    };
    
    // Create definitions for digits
    (function ()
    {
        for (var number = 0; number < 10; ++number)
        {
            var digit = number + '';
            CHARACTERS[digit] = createDigitDefinition(digit);
        }
    }
    )();
    
    // END: Encoder ////////////////////
    
    // BEGIN: JScrewIt /////////////////
    
    function areFeaturesAvailable(features)
    {
        var featureMask = getFeatureMask(features);
        return (featureMask & availableFeatureMask) === featureMask;
    }
    
    function areFeaturesCompatible(features)
    {
        var featureMask = getFeatureMask(features);
        var result = isFeatureMaskCompatible(featureMask);
        return result;
    }
    
    function encode(input, wrapWithEval, features)
    {
        var encoder = getEncoder(features);
        var output = encoder.encode(input, wrapWithEval);
        return output;
    }
    
    function getEncoder(features)
    {
        var featureMask = getFeatureMask(features);
        if (!isFeatureMaskCompatible(featureMask))
        {
            throw new ReferenceError('Incompatible features');
        }
        var encoder = encoders[featureMask];
        if (!encoder)
        {
            encoders[featureMask] = encoder = new Encoder(featureMask);
        }
        return encoder;
    }
    
    function isFeatureMaskCompatible(featureMask)
    {
        var result =
            incompatibleFeatureMasks.every(
                function (incompatibleFeatureMask)
                {
                    var result =
                        (incompatibleFeatureMask & featureMask) !== incompatibleFeatureMask;
                    return result;
                }
            );
        return result;
    }
    
    function setUp(self)
    {
        if (self != null)
        {
            self.JSFuck = self.JScrewIt = JScrewIt;
        }
    }
    
    var encoders = { };
    
    var JScrewIt =
    {
        areFeaturesAvailable:   areFeaturesAvailable,
        areFeaturesCompatible:  areFeaturesCompatible,
        encode:                 encode,
        FEATURE_INFOS:          FEATURE_INFOS,
    };
    
    setUp(self);
    
    if (typeof module !== 'undefined')
    {
        module.exports = JScrewIt;
    }
    
    // END: JScrewIt ///////////////////
    
    // BEGIN: Debug only ///////////////
    
    if (typeof DEBUG === 'undefined' || DEBUG)
    {
        (function ()
        {
            function defineConstant(constant, definition)
            {
                constant += '';
                if (!/^[$A-Z_a-z][$0-9A-Z_a-z]*$/.test(constant))
                {
                    throw new SyntaxError('Invalid identifier ' + JSON.stringify(constant));
                }
                if (constant in CONSTANTS)
                {
                    throw new ReferenceError(constant + ' already defined');
                }
                CONSTANTS[constant] = definition + '';
            }
            
            function replace(input, features)
            {
                var encoder = getEncoder(features);
                var output = encoder.replace(input);
                return output;
            }
            
            JScrewIt.debug =
            {
                defineConstant: defineConstant,
                hasOuterPlus:   hasOuterPlus,
                replace:        replace,
                setUp:          setUp
            };
        })();
    }
    
    // END: Debug only /////////////////

})(typeof self === 'undefined' ? null : self);
