# jsonSQL

[![npm version](https://badge.fury.io/js/jsonsql.svg?branche=master)](http://badge.fury.io/js/jsonsql)

A SQL-like query language for JSON objects.

## Install
```
npm install jsonsql
```

## Semantics

* All Fields `*`
* Result Subset `*.second_lvl.third_lvl`
* Condition `where`
* AND `&&`
* OR `||`
* Group `()`
* Equal `=`
* Not Equal `!=`
* Like `~`
* Not Like `!~`

## Generic query

##### Data Source:
```javascript
var dataSource = {
    '4866102f06de4f38bc30592e001cf423': {
        beat: {},
        holy: {addr: '88:63:df:a0:d7:03', name: 'CREEPY'},
        user: '',
        config: {},
        id: '4866102f06de4f38bc30592e001cf423',
        state: 2
    },
    'd07872f7d2e8447bbe874bbfd3fb0296': {
        beat: {},
        holy: {
            addr: '5c:51:4f:50:3a:88',
            name: 'CREEPY'
        },
        user: '',
        config: {},
        id: 'd07872f7d2e8447bbe874bbfd3fb0296',
        state: 1
    },
    'f2de1084a1f142258d5849428f09e39f': {
        beat: {},
        holy: {
            addr: '77:32:8a:c5:dd:63',
            name: 'REDSHIT'
        },
        user: '',
        config: {},
        id: 'f2de1084a1f142258d5849428f09e39f',
        state: 0,
        date: '2012-05'
    },
    'cff9580b2efa4a2ba84784c1ac80eb09': {
        beat: {},
        holy: {
            addr: '7f:e8:ee:32:cd:15',
            name: 'CRAP'
        },
        user: '',
        config: {},
        id: 'cff9580b2efa4a2ba84784c1ac80eb09',
        state: 1
    }
};  
```

- - -
#### Query with condition:
```javascript
var Query = require('jsonSQL');
var res = Query(dataSource, '* where holy.name=CRAP || (holy.name=CREEPY && (state=1 || state=2))');
console.log('======RESULT 1\n',res);
```
##### RESULT OUTPUT:

```bash
======RESULT 1
 [ { beat: {},
    holy: { addr: '88:63:df:a0:d7:03', name: 'CREEPY' },
    user: '',
    config: {},
    id: '4866102f06de4f38bc30592e001cf423',
    state: 2 },
  { beat: {},
    holy: { addr: '5c:51:4f:50:3a:88', name: 'CREEPY' },
    user: '',
    config: {},
    id: 'd07872f7d2e8447bbe874bbfd3fb0296',
    state: 1 },
  { beat: {},
    holy: { addr: '7f:e8:ee:32:cd:15', name: 'CRAP' },
    user: '',
    config: {},
    id: 'cff9580b2efa4a2ba84784c1ac80eb09',
    state: 1 } ]
```

- - -
#### Multi-Fields Query:
```javascript
var res = Query(dataSource, '*.id, *.holy.addr where holy.name=CRAP');
console.log('======RESULT 2\n',res);
```
##### RESULT OUTPUT:
```bash
======RESULT 2
 [ { id: 'cff9580b2efa4a2ba84784c1ac80eb09',
    'holy.addr': '7f:e8:ee:32:cd:15' } ]
```

## Comparsion

##### Data Source:
```javascript
var dataSource = {
  '4866102f06de4f38bc30592e001cf423': {
    name: 'Tom',
    age: 33,
    birth: new Date(2016, 1, 1)
  },
  'd07872f7d2e8447bbe874bbfd3fb0296': {
    name: 'Jack',
    age: 18,
    birth: new Date(2015, 1, 1)
  },
  'd935869b80f542a9bf3f6a59d4f635f1': {
    name: 'Peter',
    age: 26,
    birth: new Date(2014, 1, 1)
  },
};
```
- - -
#### Number comparison:
```javascript
var Query = require('jsonSQL');
var res = Query(dataSource, '* where age<=30');
console.log('======RESULT 1\n',res);
```
##### RESULT OUTPUT:
```bash
======RESULT 1
 [ { name: 'Jack',
    age: 18,
    birth: Sun Feb 01 2015 00:00:00 GMT+0800 (CST) },
  { name: 'Peter',
    age: 26,
    birth: Sat Feb 01 2014 00:00:00 GMT+0800 (CST) } ]
```

##### Date comparison:
```javascript
var Query = require('jsonSQL');
var res = Query(dataSource, '* where birth>' + new Date(2015,1,1).valueOf());
console.log('======RESULT 2\n',res);
```
##### RESULT OUTPUT:
```bash
======RESULT 2
 [ { name: 'Tom',
    age: 33,
    birth: Mon Feb 01 2016 00:00:00 GMT+0800 (CST) } ]
```

#### Date string comparison:

##### Data Source:
```javascript
var dataSource = [
  {
    "Version": "120",
    "CreateDate": "2013-05-25T06:50:25.584Z",
    "Desc": "abcdef"
  },
  {
    "Version": "121",
    "CreateDate": "2014-05-23T06:50:25.584Z",
    "Desc": "dfdsf"
  },
  {
    "Version": "122",
    "CreateDate": "2015-05-26T06:50:25.584Z",
    "Desc": "qewert"
  },
  {
    "Version": "123",
    "CreateDate": "2016-05-24T06:50:25.584Z",
    "Desc": "xfsstd"
  }
];
```
##### query:
```javascript
var Query = require('jsonSQL');
var res = Query(dataSource, '* where CreateDate>' + new Date(2014,1,1).valueOf());
console.log('======RESULT 1\n',res);
```

##### RESULT OUTPUT:
```bash
======RESULT 1
 [ { Version: '121',
    CreateDate: '2014-05-23T06:50:25.584Z',
    Desc: 'dfdsf' },
  { Version: '122',
    CreateDate: '2015-05-26T06:50:25.584Z',
    Desc: 'qewert' },
  { Version: '123',
    CreateDate: '2016-05-24T06:50:25.584Z',
    Desc: 'xfsstd' } ]
```