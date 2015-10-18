# jsonSQL
A SQL-like query language for JSON objects.

## Install
`npm install jsonsql`

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

## Example

#### Data Source:
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
#### Query by jsonSQL:
```javascript
var Query = require('jsonSQL');
var res = Query(dataSource, '* where holy.name=CRAP || (holy.name=CREEPY && (state=1 || state=2))');
console.log('======RESULT 1\n',res);
```
#### RESULT OUTPUT:

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
#### RESULT OUTPUT:
```bash
======RESULT 2
 [ { id: 'cff9580b2efa4a2ba84784c1ac80eb09',
    'holy.addr': '7f:e8:ee:32:cd:15' } ]
```
