
const notifier = require('node-notifier');
const os = require('os');

const isLinux = os.platform() === 'linux';

// 消息通知
module.exports = function notify(title, message, sound = false) {
    // linux不执行弹出信息
    if (isLinux) return;

    notifier.notify({
        title,
        message,
        sound,
    }, (err) => {
        if (err) console.error(err);
    });
}
