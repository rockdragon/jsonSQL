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

var Query = require('../index');
var res = Query(dataSource, '* where CreateDate>' + new Date(2014,1,1).valueOf());
console.log('======RESULT 1\n',res);