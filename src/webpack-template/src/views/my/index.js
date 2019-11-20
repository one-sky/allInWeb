import React, { Component } from "react";
import cx from "classnames";
// import Recommend from "modules/Recommend"; // 推荐

import S from "./css/index.less";

// const API = YOOGA.Util.handleApi({
//   find: "/v1.0/find/index"
// });
const getMaxLimit = (num, limit = 30, symbol = "+") =>
  num > limit ? `${limit}${symbol}` : num;

export default class Index extends Component {
  state = {
    userinfo: {
      headimgurl:
        "https://b4-q.mafengwo.net/s11/M00/99/F2/wKgBEFt2MyOAMIxMAAHUpWQ4bGg00.jpeg?imageMogr2%2Fthumbnail%2F1125x%2Fquality%2F90",
      nickname: "justKidding",
      money: 500,
      coupon: 10
    },
    banner:
      "https://p4-q.mafengwo.net/s14/M00/7E/7B/wKgE2l1EKiyAIrizAAI_0vf2k3U927.jpg?imageView2%2F2%2Fw%2F604%2Fh%2F604%2Fq%2F90%7CimageMogr2%2Fstrip%2Fquality%2F90"
  };

  render() {
    const { userinfo, banner } = this.state;
    return (
      <div
        ref={c => {
          this.page = c;
        }}
        styleName="Page"
      >
        <div className={`${S.head} fi-theme-bgColor`}>
          <i className={`yoogaFM icon-fm-setting ${S.setting}`} />
          <span className={`yoogaFM fi-stack ${S.msg}`}>
            <i className={`yoogaFM icon-fm-kefu ${S.size}`} />
          </span>
        </div>
        <div className={`${S.userinfo} fi-theme-bgColor`}>
          <div
            className={S.avatar}
            style={{ backgroundImage: `url(${userinfo.headimgurl})` }}
          />
          <div>
            <div className={`fi-theme-black ${name}`}>
              <span>Hi~ </span> {userinfo.nickname}
            </div>
            <div className={S.text}>
              <span>
                现金：<span className="fi-money-normal">¥ </span>
                {userinfo.money}
              </span>
              <span className={S.coupon}>优惠券：{userinfo.coupon}张</span>
            </div>
          </div>
        </div>
        <div className={S.history}>
          <a href="/my/attention">
            <div className={cx(S.arrow, S.arrow1)}>
              <i className="yoogaFM icon-fm-shoucanged" />
            </div>
            <div className={S.text}>我的收藏</div>
          </a>
          <a href="/my/order?r=buyer_newLikeSale">
            <div className={cx(S.arrow, S.arrow2)}>
              <i className="yoogaFM icon-fm-dingdan" />
            </div>
            <div className={S.text}>我的订单</div>
          </a>
          <a href="/my/traces?r=buyer_newAttentionShop">
            <div className={cx(S.arrow, S.arrow3)}>
              <i className="yoogaFM icon-fm-lishi" />
            </div>
            <div className={S.text}>我的历史</div>
          </a>
        </div>
        {/* <LazyImage styleName="banner" src={banner} /> */}

        <div className={S.menuMain}>
          <div className={S.title}>更多服务</div>
          {/* 菜单九宫格 */}
          <div className={S.menuItem}>
            <a href="/balance?r=buyer_balance">
              <div className={S.navItem}>
                <div className={`fi-theme-color ${navIcon}`}>
                  <i className="yoogaFM icon-fm-newuser" />
                </div>
                <div className={S.name}>新人有礼</div>
              </div>
            </a>
            <a href="/balance?r=buyer_balance">
              <div className={S.navItem}>
                <div className={`fi-theme-color ${S.navIcon}`}>
                  <i className="yoogaFM icon-fm-coupon" />
                </div>
                <div className={S.name}>优惠券</div>
              </div>
            </a>
            <a href="/balance?r=buyer_balance">
              <div className={S.navItem}>
                <div className={`fi-theme-color ${S.navIcon}`}>
                  <i className="yoogaFM icon-fm-invite" />
                </div>
                <div className={S.name}>邀请有礼</div>
              </div>
            </a>
            <a href="/balance?r=buyer_balance">
              <div className={S.navItem}>
                <div className={`fi-theme-color ${navIcon}`}>
                  <i className="yoogaFM icon-fm-newuser" />
                </div>
                <div className={S.name}>我的钱包</div>
              </div>
            </a>
          </div>
        </div>

        {/* <div styleName="recommend">
          <Recommend desc="猜你喜欢" />
        </div>
        <Menu
          scrollHide
          menus={["首页", "分类", "购物车", "我的"]}
          current={3}
        /> */}
      </div>
    );
  }
}
