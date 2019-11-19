import { PureComponent, Component } from 'react'

// 图墙返回数据类型
interface ResponseData {
    code: number,
    page: number,
    msg: string,
    data: {
        items: any[],
        [key?: string]: any,
    },
}

interface WallProps {
    templates: Component,
    initLoading: Component,
    ajaxUrl: string, // 需不需要立即加载数据
    ajaxType: string, // 请求类型
    ajaxDataType: string, // 后端返回数据类型
    ajaxParam: object, // 请求参数
    firstScreenData: ResponseData, // 首屏数据
    bottomHeight: number, // 距离底部多远，触发加载
    // 预处理数据
    preHandleData: (res: ResponseData) => ResponseData,
    callback: () => void,
    // 作为props传递给templates
    parent: any,
}

export default class extends PureComponent <WallProps> {

}
