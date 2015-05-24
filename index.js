var AND = '&&'
    , OR = '||'
    , AND_STR = 'and'
    , OR_STR = 'or'
    , NOT = '!'
    , EQUAL = '='
    , LIKE = '~'
    , NOTEQUAL = NOT + EQUAL
    , NOTLIKE = NOT + LIKE
    , WILDCARD = '*'
    , DELIMITER = '.'
    , LEFT = '('
    , RIGHT = ')'
    , WHERE = 'where'
    , synopsis = {
        pathway: [],
        groups: {}
    }
    , lexicalities = {}
    , options = {};

function Tokenize(query) {
    var parts = __splitTrim(query, WHERE);
    var pathway = parts[0];
    var where = parts[1];

    synopsis.pathway = __splitTrim(pathway, DELIMITER);
    if (synopsis.pathway[0] == WILDCARD)
        synopsis.pathway.shift();

    var lastLeft = -1,
        lastRight = -1,
        current = 0;
    while (current < where.length) {
        if (where[current] === LEFT) {
            lastLeft = current;
        } else if (where[current] === RIGHT) {
            lastRight = current;
            if (lastRight > lastLeft && lastLeft !== -1) {
                var k = 'gr' + '_' + new Date().getTime();
                synopsis.groups[k] = where.substring(lastLeft + 1, lastRight);
                where = where.replace(LEFT + synopsis.groups[k] + RIGHT, k);
                current = -1;
            }
        }
        current += 1;
    }
    LogicalGrouping(lexicalities, where);
}
function LogicalGrouping(current, where) {
    var lastAnd = __findIndex(where, AND),
        lastOr = __findIndex(where, OR);

    if (lastAnd !== Number.MAX_VALUE || lastOr !== Number.MAX_VALUE) {
        if (lastAnd < lastOr) {
            current.and = current.and || [];
            var parts = __splitTrim(where, AND);
            current.and.push(parts[0]);
            LogicalGrouping(current.and, parts[1]);
        } else {
            current.or = current.or || [];
            var parts = __splitTrim(where, OR);
            current.or.push(parts[0]);
            LogicalGrouping(current.or, parts[1]);
        }
    } else {
        if (synopsis.groups[where]) {
            where = synopsis.groups[where];
            LogicalGrouping(current, where);
        } else {
            if (Array.isArray(current))
                current.push(where);
            else
                current.or = [where];
            ExtractExpression(lexicalities.or ? lexicalities.or : lexicalities.and)
        }
    }
}
function ExtractExpression(logicalGroup) {
    for (var k in logicalGroup) {
        if (logicalGroup.hasOwnProperty(k)) {
            if (Array.isArray(logicalGroup[k])) {
                ExtractExpression(logicalGroup[k]);
            }
            else if (typeof logicalGroup[k] === 'string') {
                if (__contains(logicalGroup[k], NOTEQUAL)) {
                    var parts = __splitTrim(logicalGroup[k], NOTEQUAL);
                    logicalGroup[k] = {
                        ne: [
                            parts[0],
                            parts[1]
                        ]
                    };
                } else if (__contains(logicalGroup[k], NOTLIKE)) {
                    var parts = __splitTrim(logicalGroup[k], NOTLIKE);
                    logicalGroup[k] = {
                        nreq: [
                            parts[0],
                            parts[1]
                        ]
                    };
                } else if (__contains(logicalGroup[k], EQUAL)) {
                    var parts = __splitTrim(logicalGroup[k], EQUAL);
                    logicalGroup[k] = {
                        eq: [
                            parts[0],
                            parts[1]
                        ]
                    };
                } else if (__contains(logicalGroup[k], LIKE)) {
                    var parts = __splitTrim(logicalGroup[k], LIKE);
                    logicalGroup[k] = { // rough eq
                        req: [
                            parts[0],
                            parts[1]
                        ]
                    };
                }
            }
        }
    }
}

function __findIndex(str, token) {
    var index = str.indexOf(token);
    return index === -1 ? Number.MAX_VALUE : index;
}
function __splitTrim(str, token) {
    return str.split(token).map(function (p) {
        return p.trim();
    });
}
function __contains(a, b) {
    return a.indexOf(b) > -1;
}
function __hierarchize(obj, dottedPath) {
    var parts = __splitTrim(dottedPath, DELIMITER);
    var res = obj;
    for (var p in parts)
        if (res.hasOwnProperty(parts[p]))
            res = res[parts[p]];
        else
            return '';
    return res.toString();
}
function __iterate(obj) {
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            if (!Array.isArray(obj[k]) && typeof obj[k] === 'object') {
                __iterate(obj[k]);
            } else {
                console.log(k, ':', obj[k]);
            }
        }
    }
}
function FilterOR(lexicality, row) {
    var res = false;
    for (var k in lexicality) {
        var filterFunc = (k === AND_STR ? FilterAND : (k === OR_STR ? FilterOR : Filter));
        res = res || filterFunc(lexicality[k], row);
        if(options.trace)
            console.log(synopsis.step, '======((( or', lexicality[k], res);
        if (res) return res;
    }
    return res;
}
function FilterAND(lexicality, row) {
    var res = true;
    for (var k in lexicality) {
        var filterFunc = (k === AND_STR ? FilterAND : (k === OR_STR ? FilterOR : Filter));
        res = res && filterFunc(lexicality[k], row);
        if(options.trace)
            console.log(synopsis.step, '======((( and', lexicality[k], res);
        if (!res) return res;
    }
    return res;
}
function Filter(lexicality, row) {
    synopsis.step += 1;
    //console.log(synopsis.level, 'lexicality', lexicality);
    if (lexicality.or) {
        var res = FilterOR(lexicality.or, row);
        if(options.trace)
            console.log(synopsis.step, 'OR', lexicality, res);
        return res;
    } else if (lexicality.and) {
        var res = FilterAND(lexicality.and, row);
        if(options.trace)
            console.log(synopsis.step, 'AND', lexicality, res);
        return res;
    } else if (typeof lexicality === 'object') {
        if (lexicality.eq) { // =
            return __hierarchize(row, lexicality.eq[0]) === lexicality.eq[1];
        } else if (lexicality.ne) { // !=
            return __hierarchize(row, lexicality.ne[0]) !== lexicality.ne[1];
        } else if (lexicality.req) { // ~
            return __contains(__hierarchize(row, lexicality.req[0]), lexicality.req[1]);
        } else if (lexicality.nreq) { // ~
            return !__contains(__hierarchize(row, lexicality.nreq[0]), lexicality.nreq[1]);
        } else {
            return Filter(lexicality, row);
        }
    }
}
function Parse(dataSource) {
    var result = [];
    for (var k in dataSource)
        if (Filter(lexicalities, dataSource[k]))
            result.push(dataSource[k]);
    return result;
}
function Fields(result) {
    if (result && synopsis.pathway.length > 0) {
        return result.map(function (ele) {
            return __hierarchize(ele, synopsis.pathway.join('.'));
        });
    }
    return result;
}
function Query(dataSource, query, opts) {
    synopsis = {
        pathway: [],
        groups: {},
        step: 0
    };
    lexicalities = {};
    opts = opts || {
        trace :false
    };
    options = opts;
    Tokenize(query);
    return Fields(Parse(dataSource));
}

if (typeof(module) != 'undefined' && typeof(module.exports) != 'undefined') module.exports = Query;
if (typeof(window) != 'undefined') window.Query = Query;