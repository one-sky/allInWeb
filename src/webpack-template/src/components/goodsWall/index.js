import React, { Component } from 'react';
import AjaxModel from './js/model';
import './css/goodswall.less';

class GoodsWall extends Component {
    constructor(props) {
        super(props);
        Object.assign(this, AjaxModel);
        this.state = {
            ajaxParam: this.props.ajaxParam || {},
            templates: this.props.templates,
            initLoading: this.props.initLoading,
            ajaxUrl: this.props.ajaxUrl,
            ajaxType: this.props.ajaxType || 'get',
            ajaxDataType: this.props.ajaxDataType || 'json',
            firstScreenData: this.props.firstScreenData,
            bottomHeight: this.props.bottomHeight || 2000,
            preHandleData: this.props.preHandleData, // 数据处理
            isEnd: false, // 结束加载
            items: [],
            callBack: this.props.callBack,
            key: $('#J_Page .curPage').data('page'),
            time: Date.now(),
        };
    }

    componentDidMount() { // 页面渲染后
        this.catch = this.catch || [];
        this.catch.push('1');
        this.initLoaderTimer();
    }

    componentWillReceiveProps(props) {
        this.state.ajaxParam = props.ajaxParam;
    }

    componentDidUpdate() { // 在组件的更新已经同步到 DOM 中之后立刻被调用。该方法不会在初始化渲染的时候调用
        if (!this._isLoading) {
            this._updated = true;
        }

        YOOGA.initLazy();
        if (this.state.callBack) {
            this.state.callBack();
            this.state.callBack = null;
        }
    }

    componentWillUnmount() {
        this.destroy();
    }

    _updated = true;

    ajaxSuccBack(res) {
        if (this.state.preHandleData) {
            res = this.state.preHandleData.call(this, res) || {};
        }

        let start = res.start;
        let page = res.page;
        let isEnd = res.isEnd;

        let items = res.items;
        if (!items && res.data) {
            items = res.data.items;
            start = res.data.start;
            page = res.data.page;
            isEnd = res.data.isEnd;
        }
        if (!this.state.items) {
            this.state.items = [];
        }
        this.state.items = this.state.items.concat(items || []);

        this.setState({
            start,
            page,
            isEnd,
            nowTime: res.nowTime,
        });
        this.state.result = {
            isEnd,
            start,
            page,
            items: this.state.items,
        };
    }

    render() {
        const state = this.state;
        const Templates = state.templates;
        let InitLoading = Loading;
        if (typeof state.initLoading === 'function') {
            InitLoading = state.initLoading;
        }

        return (
            <div className="wall-container clearfix">
                <div className="wall-col clearfix">
                    <Templates
                        items={state.items}
                        parent={this.props.parent}
                        page={state.page}
                        nowTime={state.nowTime}
                        isEnd={state.isEnd}
                        isNoData={state.isEnd && state.items.length === 0}
                    />
                </div>
                {
                    state.initLoading && !state.isEnd && !state.page && <InitLoading />
                }
                {
                    !state.isEnd && state.page && <Loading loadingClass={this.props.loadingClass} />
                }
            </div>
        );
    }
}

class Loading extends Component {
    render() {
        return (
            <div className={`wall_loading ${this.props.loadingClass}`}>
                {
                    !this.props.loadingClass && <img
                        src="data:image/gif;base64,R0lGODlhIwAjALMIAGpqaoqKinx8fHV1dWNjY5iYmFxcXFFRUf///wAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxRUJEQzMxNkM2NTkxMUU0OTU5REUzNzNFMEY0ODA2OCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDoxRUJEQzMxN0M2NTkxMUU0OTU5REUzNzNFMEY0ODA2OCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjFFQkRDMzE0QzY1OTExRTQ5NTlERTM3M0UwRjQ4MDY4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjFFQkRDMzE1QzY1OTExRTQ5NTlERTM3M0UwRjQ4MDY4Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEBQoACAAsAAAAACMAIwAABGkQyUmrvTjrzbv/YCiOZGme5HGgmKqykmFI7ooUhSnLtI3jpd2s8ssFhxYgbCkhEDiBgMjp1ESjIeozc5Vmt1YvEwYAYAQCU7lsQaNLazNiMJC403A5nW7Hs/Z1YxJ8goWGh4iJiouMLBEAIfkEBQoACAAsCAAIABIAEgAABE4QySmNoThbmykh1SYdB/Z94UiW0wliK9u+GdndHQDgU1EgOh3P5wvucMSfkIfwMZmDwS0QwESjGSqVcpUiBAKJtsr1gsFi8u0cfkrQnQgAIfkEBQoACAAsCAAIABIAEgAABE4QySkJoThbmykA1SYZBvZ94UiW0wliK9u+Gdnd3TDg03EgOh3P5wvucMSfkIfwMZkCwa1QwESjGSqVcpUiAgGJtsr1gsFi8u0cfkrQnQgAIfkEBQoACAAsCAAIABIAEgAABE4QySkBoDhbm+kY1SYRBPZ94UiW0wliK9u+GdndnSDgk2EgOh3P5wvucMSfkIfwMZmBwO1wwESjGSqVcpUiCgWJtsr1gsFi8u0cfkrQnQgAIfkEBQoACAAsCAAIABIAEgAABE4QySnHoDhbm6kQ1SYBAPZ94UiW0wliK9u+GdndXRDgE0EgOh3P5wvucMSfkIfwMZmFws1gwESjGSqVcpUiDgeJtsr1gsFi8u0cfkrQnQgAIfkEBQoACAAsCAAIABIAEgAABE4QySmFoDhbm2kI1SYNA/Z94UiW0wliK9u+GdndXVHgEwAgOh3P5wvucMSfkIfwMZmHw41AwESjGSqVcpUiDAaJtsr1gsFi8u0cfkrQnQgAIfkEBQoACAAsCAAIABIAEgAABE4QySlDoDhbm2kp1SYJAvZ94UiW0wliK9u+Gdnd3XHg0zAgOh3P5wvucMSfkIfwMZkGww0AwESjGSqVcpUiCASJtsr1gsFi8u0cfkrQnQgAIfkECQoACAAsCAAIABIAEgAABE4QySlLoThbm+k51SYFAfZ94UiW0wliK9u+GdndnWHgkyAgOh3P5wvucMSfkIfwMZkEwm0wwESjGSqVcpUiAACJtsr1gsFi8u0cfkrQnQgAOw=="
                    />
                }
                { this.props.loadingClass ? '正在加载中...' : '加载中...' }
            </div>
        );
    }
}

export default AjaxModel(GoodsWall);
