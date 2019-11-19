import React, { PureComponent } from "react";
import YOOGA from "yooga";
import Countdown from "./Countdown/index";
import "./styles.less";

export default class Promotion extends PureComponent {
  state = {
    MTime: 1565332120069, // 毫秒时间
    endTime: 1565334259000, // 结束时间
    list: [
      {
        url:
          "https://img12.360buyimg.com/mobilecms/s140x140_jfs/t1/52690/18/5901/60608/5d3a65baE5a42985e/acff99744184f539.jpg.webp",
        old: 299,
        new: 199
      },
      {
        url:
          "https://img10.360buyimg.com/jdcms/s150x150_jfs/t1/64838/36/4675/91684/5d2d9209Ecebf0a27/3d7f5353f7853fdf.jpg.webp",
        old: 399,
        new: 299
      },
      {
        url:
          "https://img10.360buyimg.com/jdcms/s150x150_jfs/t1/30698/12/10545/73985/5cb01c12E2130b153/d287916b4e82b8bc.jpg.webp",
        old: 399,
        new: 379
      }
    ]
  };

  goToCheap = () => {
    YOOGA.showPage("/cheap");
  };
  render() {
    const { list } = this.state;

    return (
      <div styleName="Page">
        <div styleName="head" {...YOOGA.onTouchEnd(this.goToCheap)}>
          <span>
            秒杀
            <span styleName="time">
              <span styleName="desc">18点场</span>
              <Countdown
                key={`${this.state.MTime}-${this.state.endTime}`}
                MTime={this.state.MTime}
                endTime={this.state.endTime}
              />
            </span>
          </span>

          <i className="wptFM icon-fm-wptFontMain fi-theme-orange" />
        </div>
        <div styleName="saleList">
          {list.map((item, i) => (
            <Link href={`/shop/${item.userId}?r=featured`} styleName="saleItem">
              <LazyImage styleName="product" key={i} src={item.url} />
              {/* <div className={S.product} style={{ backgroundImage: `url(${item.url})` }} /> */}
              <div className="fi-theme-black" styleName="new">
                <span className="fi-money-normal">¥ </span>
                {item.new}
              </div>
              <div styleName="old">
                <span className="fi-money-small">¥ </span>
                {item.old}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }
}
