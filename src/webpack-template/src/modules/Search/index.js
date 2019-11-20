import React, { PureComponent } from "react";
import "./styles.less";

export default class Search extends PureComponent {
  render() {
    return (
      <div styleName="searchComponent">
        <span className="yoogaFM fi-stack" styleName="mainQry">
          <i
            className="yoogaFM icon-fm-search fi-theme-black"
            styleName="size"
          />
        </span>
        <span>请输入商品名称或分类</span>
      </div>
    );
  }
}
