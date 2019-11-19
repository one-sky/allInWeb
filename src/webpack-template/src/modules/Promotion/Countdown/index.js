import React, { PureComponent } from "react";
import YOOGA from "yooga";
import "./index.less";

export default class Countdown extends PureComponent {
  state = {
    MTime: this.props.MTime || 0, // 毫秒时间
    endTime: this.props.endTime || 0, // 结束时间
    hour: "", // 计数器小时
    minute: "", // 计数器分钟
    second: "" // 计数器秒
  };

  componentDidMount() {
    this.show();
  }

  componentWillUnmount() {
    this.hide();
  }

  show() {
    const { MTime, endTime } = this.state;
    this.startCounDownUpdate(MTime, endTime);
    this.startUpdateMTime();
  }

  // 清空定时器
  hide() {
    window.clearInterval(this.counterInterval);
    window.clearInterval(this.MTimerUpdaterInterval);
  }

  // 每 5 秒与服务端同步时间
  startUpdateMTime = () => {
    // window.clearInterval(this.MTimerUpdaterInterval);
    // this.MTimerUpdaterInterval = window.setInterval(() => {
    //     this.API.getMTime({}, (res) => {
    //         if (Number(res.code) !== 0) {
    //             YOOGA.Modal.alert(res.msg);
    //             return;
    //         }
    //         this.setState({
    //             MTime: res.data.MTime,
    //         });
    //     });
    // }, 5000);
  };

  // 启动倒计时定时更新
  startCounDownUpdate = (MTime, endTime) => {
    this.updateCountDown(endTime - MTime);
    let lastTime = new Date().getTime();

    window.clearInterval(this.counterInterval);
    this.counterInterval = window.setInterval(() => {
      lastTime = this.intervalUpdateCountDown(lastTime);
    }, 100);
  };

  // 避免重复发请求的控制变量
  inTimeListFetching = false;

  // 倒计时更新逻辑
  intervalUpdateCountDown = lastTime => {
    const currentTime = new Date().getTime();
    const MTime = this.state.MTime + currentTime - lastTime;

    this.setState({
      MTime
    });

    // 已经到目标时间了，重新获取 时间列表以及秒杀列表
    if (this.state.endTime < MTime && !this.inTimeListFetching) {
      this.inTimeListFetching = true;

      // this.props.getTimeList();
      this.hide();
    } else {
      this.updateCountDown(this.state.endTime - MTime);
    }

    return currentTime;
  };

  // 生成倒计时数据并更新
  updateCountDown = duration => {
    const CD = YOOGA.Util.formatCountDown(duration);
    const hour = CD.hour || "00";
    const minute = CD.min || "00";
    const second = CD.sec || "00";
    this.setState({
      hour,
      minute,
      second
    });
  };

  render() {
    const { hour, minute, second } = this.state;
    return (
      <div styleName="container">
        <span styleName="countdown">
          <em>{hour}</em> : <em>{minute}</em> : <em>{second}</em>
        </span>
      </div>
    );
  }
}
