import React, { Component } from 'react';
import GoodsWall from 'components/goodsWall';

import Product from './product';

import './css/index.less';


export default class Index extends Component {
    render() {
        const { desc, icon = 0, align = 'left' } = this.props;
        return (
            <div
                ref={(c) => { this.page = c; }}
                // styleName="Page"
            >
                <div styleName="title" style={{ textAlign: align }}>
                    {icon ? <i className="wptFM icon-fm-aixin" /> : ''}{desc}
                </div>
                <GoodsWall
                    templates={Product}
                    // ajaxUrl={}
                    // ajaxParam={{}}
                />
            </div>
        );
    }
}
