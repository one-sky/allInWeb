#图墙
- templates:  模板
- firstScreenData: 开始数据，如果有数据，开始不发起请求。数据格式为【图墙的标准返回格式】
- ajaxParam:  参数请求
- ajaxUrl:  请求地址
- ajaxType:  请求类型， 默认为get
- ajaxDataType: 返回类型 默认 json
- preHandleData:  数据处理  对数据格式不符合图墙数据格式或需要提取里面数据的时候需要用到，
- initLoading： 初始状态的loading，默认不显示，可设为true值或自定模板

#图墙的标准返回格式：

```json

{
    code: 0,
    msg: "xx",
    data{
        items: [],
        start: res.start,
        page: res.page,
        isEnd: res.isEnd
    }
}
```
或
```json
{
    status：{code: 0, msg:""}
    items: [], // 数组
    start: res.start,
    page: res.page, // 前端会把此数据当做下一次请求的参数传递
    isEnd: res.isEnd // 图强是否完结
}

```

#使用例子
```js
<GoodsWall
    templates={ArticleTxt}
    ajaxUrl={self.state.requestUrl}
    ajaxParam={{uri: self.state.uri}}
    initLoading
/>
```

模板的接收数据 this.props.items
