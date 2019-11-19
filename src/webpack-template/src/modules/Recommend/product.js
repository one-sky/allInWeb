import React, { Component } from 'react';

import './css/product.less';

export default class Product extends Component {

    renderItem = (item) => (
        <Link
            key={item.saleUri}
            href={`/uri/${item.id}`}
        >
            <div styleName="item">
                <LazyImage styleName="image" src={item.img} />
                <div styleName="info">
                    <div styleName="desc" className="fi-theme-black">{item.desc}</div>
                    <div styleName="tag">
                        {
                            item.tagList && item.tagList.map(i => (
                                <i className="wptFM fi-theme-color " styleName={`${this.renderTag(i)} size`} />
                            ))
                        }
                    </div>
                    <div styleName="bottom">
                        <span className="fi-theme-orange" styleName="price">
                            <span className="fi-money-normal fi-theme-black">￥ </span>
                            {item.price}
                        </span>
                        <span className="fi-theme-color">
                            <i className="wptFM icon-fm-attention" styleName="icon" />
                            <span styleName="num">{item.attention}</span>
                        </span>
                    </div>
                
                </div>
            </div>
        </Link>
    )
  
  renderTag = (tag) => {
      if (tag == '包邮') {
          return 'icon-fm-baoyou';
      } else if (tag == '包退') {
          return 'icon-fm-baotui';
      }
      return '';
  }

  render() {
      //   const { items = [] } = this.props;
      const items = [
          {
              id: 1,
              img: 'https://b2-q.mafengwo.net/s14/M00/F9/33/wKgE2l0LNSeADtvvAAJeUHG2_So60.jpeg?imageMogr2%2Fthumbnail%2F%21750x690r%2Fgravity%2FCenter%2Fcrop%2F%21750x690%2Fquality%2F90',
              desc: '翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠',
              tagList: ['包邮', '包退'],
              price: 200,
              attention: 120
          }, {
              id: 2,
              img: 'https://n3-q.mafengwo.net/s8/M00/A2/BA/wKgBpVYfQ3qAW4lGAADfj5rcROU25.jpeg?imageMogr2%2Fthumbnail%2F%21206x170r%2Fgravity%2FCenter%2Fcrop%2F%21206x170%2Fquality%2F100',
              desc: '翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠',
              tagList: ['包邮', '包退'],
              price: 199,
              attention: 40
          }, {
              id: 3,
              img: 'https://n3-q.mafengwo.net/s7/M00/94/D7/wKgB6lTLXK2AeJZkAAOgWqNKOQo85.jpeg?imageMogr2%2Fthumbnail%2F%21280x180r%2Fgravity%2FCenter%2Fcrop%2F%21280x180%2Fquality%2F100',
              desc: '翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠',
              tagList: ['包邮', '包退'],
              price: 299,
              attention: 340
          }, {
              id: 4,
              img: 'https://p2-q.mafengwo.net/s10/M00/13/3F/wKgBZ1mvxFKAJa29AAPF2zeReW068.jpeg?imageMogr2%2Fthumbnail%2F%21375x225r%2Fgravity%2FCenter%2Fcrop%2F%21375x225%2Fquality%2F100',
              desc: '翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠翡翠',
              tagList: ['包邮', '包退'],
              price: 199,
              attention: 220
          }
      ];

      if (items.length === 0) {
          return <div styleName="root" />;
      }

      return (
          <div styleName="root">
              <div styleName="list">
                  {items.map(item => this.renderItem(item))}
              </div>
          </div>
      );
  }
}
