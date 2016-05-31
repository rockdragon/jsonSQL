var utils = require('./utils')

var AND = '&&'
  , OR = '||'
  , AND_STR = 'and'
  , OR_STR = 'or'
  , NOT = '!'
  , EQUAL = '='
  , LIKE = '~'
  , NOTEQUAL = NOT + EQUAL
  , NOTLIKE = NOT + LIKE
  , GT = '>'
  , GE = '>='
  , LT = '<'
  , LE = '<='
  , WILDCARD = '*'
  , COMMA = ','
  , DELIMITER = '.'
  , LEFT = '('
  , RIGHT = ')'
  , WHERE = 'where'
  , synopsis = {
  pathway: [],
  groups: {}
}
  , AST = {}
  , options = {};

var print = console.log;
// ------------------ splitter -------------------- //

function Tokenize(query) {
  var parts = __splitTrim(query, WHERE);
  var pathway = parts[0];
  var where = parts[1];

  synopsis.pathway = __splitTrim(pathway, COMMA);
  for (var i = 0, len = synopsis.pathway.length; i < len; i++) {
    synopsis.pathway[i] = __splitTrim(synopsis.pathway[i], DELIMITER);
    if (synopsis.pathway[i][0] == WILDCARD)
      synopsis.pathway[i].shift();
    if (synopsis.pathway[i].length === 0)
      synopsis.pathway.splice(i, 1);
  }

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
  LogicalGrouping(AST, where);
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
      ExtractExpression(AST.or ? AST.or : AST.and)
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
        } else if (__contains(logicalGroup[k], LIKE)) {
          var parts = __splitTrim(logicalGroup[k], LIKE);
          logicalGroup[k] = { // rough eq
            req: [
              parts[0],
              parts[1]
            ]
          };
        } else if (__contains(logicalGroup[k], GE)) {
          var parts = __splitTrim(logicalGroup[k], GE);
          logicalGroup[k] = { // greater than or equal
            ge: [
              parts[0],
              parts[1]
            ]
          };
        } else if (__contains(logicalGroup[k], GT)) {
          var parts = __splitTrim(logicalGroup[k], GT);
          logicalGroup[k] = { // greater than
            gt: [
              parts[0],
              parts[1]
            ]
          };
        } else if (__contains(logicalGroup[k], LE)) {
          var parts = __splitTrim(logicalGroup[k], LE);
          logicalGroup[k] = { // less than or equal
            le: [
              parts[0],
              parts[1]
            ]
          };
        } else if (__contains(logicalGroup[k], LT)) {
          var parts = __splitTrim(logicalGroup[k], LT);
          logicalGroup[k] = { // less than
            lt: [
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
  for (var p in parts) {
    if (res.hasOwnProperty(parts[p]))
      res = res[parts[p]];
    else
      return '';
  }
  // support comparison for Date/DateString
  if(utils.isDate(res)) res = res.valueOf()
  else if(utils.isDateString(res)) res = utils.parseDateFromString(res)
  else res = res.toString()

  return res
}

function FilterOR(ASTNode, row) {
  var res = false;
  for (var k in ASTNode) {
    var filterFunc = (k === AND_STR ? FilterAND : (k === OR_STR ? FilterOR : Filter));
    res = res || filterFunc(ASTNode[k], row);
    if (options.trace)
      print(synopsis.step, '======((( or', ASTNode[k], res);
    if (res) return res;
  }
  return res;
}
function FilterAND(ASTNode, row) {
  var res = true;
  for (var k in ASTNode) {
    var filterFunc = (k === AND_STR ? FilterAND : (k === OR_STR ? FilterOR : Filter));
    res = res && filterFunc(ASTNode[k], row);
    if (options.trace)
      print(synopsis.step, '======((( and', ASTNode[k], res);
    if (!res) return res;
  }
  return res;
}
function Filter(ASTNode, row) {
  synopsis.step += 1;
  if (ASTNode.or) {
    var res = FilterOR(ASTNode.or, row);
    if (options.trace)
      print(synopsis.step, 'OR', ASTNode, res);
    return res;
  } else if (ASTNode.and) {
    var res = FilterAND(ASTNode.and, row);
    if (options.trace)
      print(synopsis.step, 'AND', ASTNode, res);
    return res;
  } else if (typeof ASTNode === 'object') {
    if (ASTNode.eq) { // =
      return __hierarchize(row, ASTNode.eq[0]) === ASTNode.eq[1];
    } else if (ASTNode.ne) { // !=
      return __hierarchize(row, ASTNode.ne[0]) !== ASTNode.ne[1];
    } else if (ASTNode.req) { // ~
      return __contains(__hierarchize(row, ASTNode.req[0]), ASTNode.req[1]);
    } else if (ASTNode.nreq) { // ~
      return !__contains(__hierarchize(row, ASTNode.nreq[0]), ASTNode.nreq[1]);
    } else if (ASTNode.gt) { // >
      return __hierarchize(row, ASTNode.gt[0]) > ASTNode.gt[1];
    } else if (ASTNode.ge) { // >=
      return __hierarchize(row, ASTNode.ge[0]) >= ASTNode.ge[1];
    } else if (ASTNode.lt) { // <
      return __hierarchize(row, ASTNode.lt[0]) < ASTNode.lt[1];
    } else if (ASTNode.le) { // <=
      return __hierarchize(row, ASTNode.le[0]) <= ASTNode.le[1];
    } else {
      return Filter(ASTNode, row);
    }
  }
}
function Parse(dataSource) {
  var result = [];
  for (var k in dataSource)
    if (Filter(AST, dataSource[k]))
      result.push(dataSource[k]);
  return result;
}
function Fields(result) {
  if (result && synopsis.pathway.length > 0) {
    //print(synopsis.pathway);
    return result.map(function (ele) {
      var res = {};
      for (var i = 0, len = synopsis.pathway.length; i < len; i++) {
        var key = synopsis.pathway[i].join(DELIMITER);
        res[key] = __hierarchize(ele, key);
      }
      return res;
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
  AST = {};
  opts = opts || {
      trace: false
    };
  options = opts;
  Tokenize(query);
  return Fields(Parse(dataSource));
}

if (typeof(module) != 'undefined' && typeof(module.exports) != 'undefined') module.exports = Query;
if (typeof(window) != 'undefined') window.Query = Query;