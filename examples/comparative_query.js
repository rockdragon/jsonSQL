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

var Query = require('../index');
var res = Query(dataSource, '* where age<=30');
console.log('======RESULT 1\n',res);

var res = Query(dataSource, '* where birth>' + new Date(2015,1,1).valueOf());
console.log('======RESULT 2\n',res);