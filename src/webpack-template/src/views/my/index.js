import React, { Component } from "react";
import YOOGA from "yooga";
import Recommend from "modules/Recommend"; // 推荐

import "./css/index.less";

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
        <div className="fi-theme-bgColor" styleName="head">
          <i className="wptFM icon-fm-setting" styleName="setting" />
          <span className="wptFM fi-stack" styleName="msg">
            <i className="wptFM icon-fm-kefu" styleName="size" />
          </span>
        </div>
        <div className="fi-theme-bgColor" styleName="userinfo">
          <div
            styleName="avatar"
            style={{ backgroundImage: `url(${userinfo.headimgurl})` }}
          />
          <div>
            <div className="fi-theme-black" styleName="name">
              <span>Hi~ </span> {userinfo.nickname}
            </div>
            <div styleName="text">
              <span>
                现金：<span className="fi-money-normal">¥ </span>
                {userinfo.money}
              </span>
              <span styleName="coupon">优惠券：{userinfo.coupon}张</span>
            </div>
          </div>
        </div>
        <div styleName="history">
          <Link href="/my/attention">
            <div styleName="arrow arrow1">
              <i className="wptFM icon-fm-shoucanged" />
            </div>
            <div styleName="text">我的收藏</div>
          </Link>
          <Link href="/my/order?r=buyer_newLikeSale">
            <div styleName="arrow arrow2">
              <i className="wptFM icon-fm-dingdan" />
            </div>
            <div styleName="text">我的订单</div>
          </Link>
          <Link href="/my/traces?r=buyer_newAttentionShop">
            <div styleName="arrow arrow3">
              <i className="wptFM icon-fm-lishi" />
            </div>
            <div styleName="text">我的历史</div>
          </Link>
        </div>
        <LazyImage styleName="banner" src={banner} />

        <div styleName="menuMain">
          <div styleName="title">更多服务</div>
          {/* 菜单九宫格 */}
          <div styleName="menuItem">
            <Link href="/balance?r=buyer_balance">
              <div styleName="navItem">
                <div className="fi-theme-color" styleName="navIcon">
                  <i className="wptFM icon-fm-newuser" />
                </div>
                <div styleName="name">新人有礼</div>
              </div>
            </Link>
            <Link href="/balance?r=buyer_balance">
              <div styleName="navItem">
                <div className="fi-theme-color" styleName="navIcon">
                  <i className="wptFM icon-fm-coupon" />
                </div>
                <div styleName="name">优惠券</div>
              </div>
            </Link>
            <Link href="/balance?r=buyer_balance">
              <div styleName="navItem">
                <div className="fi-theme-color" styleName="navIcon">
                  <i className="wptFM icon-fm-invite" />
                </div>
                <div styleName="name">邀请有礼</div>
              </div>
            </Link>
            <Link href="/balance?r=buyer_balance">
              <div styleName="navItem">
                <div className="fi-theme-color" styleName="navIcon">
                  <i className="wptFM icon-fm-newuser" />
                </div>
                <div styleName="name">我的钱包</div>
              </div>
            </Link>
          </div>
        </div>

        <div styleName="recommend}">
          <Recommend desc="猜你喜欢" />
        </div>
        <Menu
          scrollHide
          menus={["首页", "分类", "购物车", "我的"]}
          current={3}
        />
      </div>
    );
  }
}
