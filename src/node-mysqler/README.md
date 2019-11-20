### 所有的均返回一个promise对象
1. 数据库连接
```
DB.conn({
    host: "xxx",
    user: "xxx",
    password: "xxx",
    port: "xxx",
    database: "xxx",
    keyMatch: true/false 
  });
```
* 一般数据库表中存储字段为下划线形式如：first_name， 而getter、setter等key值处理为驼峰式，keyMatch设为false，会自动进行处理，所有字段传入key值以驼峰的习惯传入
* keyMatch 为 true 时，传入key与表中存储字段名一致，不作处理
* keyMatch 为一次连接后的全局对象

2. 数据库insert，支持批量
```
DB.insert(tablename, dataList, callback);
tablename: string
dataList: array,支持key顺序打乱，若数组的行上key值个数，以第一行为准
```

3. 数据库查询 支持模糊查询
```
DB.select(tablename, fields, condition,callback);
fields: any    array的时候查询多个字段，其余为 * （查询所有字段），若差一个字段，请放到数组中
condition: 
* array in 多个条件里
* object value为单值的时候是=； 对象的时候拼接lowOption、low、highOption、high，high与highOtion可为空 lowOption可取：like < <= > >= 
example: condition = {id: 1,year: {lowOption: '>=', low:12, highOption: '<', high: 14}}, workType: ['前端工程师', 'python工程师']}
```
4. 数据更新，支持模糊匹配更新,多值更新
```
DB.update(tablename, attrs, condition,callback);
attrs: object
```

5. 数据库删除， 支持模糊匹配删除
```
DB.delete(tablename, condition,callback);
```

example/index 中有相应的例子，可供参考

