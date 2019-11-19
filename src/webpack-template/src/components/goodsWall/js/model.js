export default ComposeComponent => class extends ComposeComponent {
    initLoaderTimer() {
        // 图墙容器
        const state = this.state;

        if ($.isEmptyObject(state.firstScreenData)) {
            this.fetch();
        } else {
            this.ajaxSuccBack && this.ajaxSuccBack.call(this, state.firstScreenData);
            this.state.firstScreenData = null;
        }
        // YOOGA.scroll.appendScroll("goodswall" + state.key, this.refresh.bind(this));
        this.show();
        // $(document).on('wallTab:change', function(e, reConfig){
        //    self.forceRerender.call(self, reConfig);
        // });
        if (!YOOGA[this.state.key]) {
            YOOGA[this.state.key] = {};
        }
        if (!YOOGA[this.state.key].show) {
            YOOGA[this.state.key].show = {};
        }
        if (!YOOGA[this.state.key].hide) {
            YOOGA[this.state.key].hide = {};
        }
        YOOGA[this.state.key].show[this.state.time] = () => {
            this.show();
        };

        YOOGA[this.state.key].hide[this.state.time] = () => {
            this.hide();
        };
    }

    show() {
        YOOGA.scroll.appendScroll(`goodswall${this.state.key}${this.state.time}`, this.refresh.bind(this));
    }

    hide() {
        // console.log('goodswall-hide');
        YOOGA.scroll.clear(`goodswall${this.state.key}${this.state.time}`);
    }

    forceRerender(reConfig) {
        this.state = $.extend(this.state, reConfig);
        this._isLoading = false;
        this.state.isEnd = false;
        this.state.data = [];
        YOOGA.$curPage.find('.wall-container').find('.wall-col').html('');
        if (!this.state.firstScreenData) {
            this.fetch();
        } else {
            this.ajaxSuccBack && this.ajaxSuccBack.call(this, this.state.firstScreenData);
            this.state.firstScreenData = null;
        }
    }

    refresh(scrollTop, scrollHeight) { // scrollTop 滚动高度  scrollHeight 整个滚动条高度
        // console.log("refresh:" + scrollTop);
        if (this.state.isEnd || this._isLoading || !this._updated) return;
        scrollTop = scrollTop || document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;

        // 判断滚动条高度，确定是否要加载下一屏
        const wHeight = document.documentElement.clientHeight;
        const dHeight = scrollHeight || document.body.scrollHeight; // document.documentElement.offsetHeight 不要了
        if (dHeight - (scrollTop + wHeight) < this.state.bottomHeight) {
            this.fetch();
        }
    }

    // 发异步请求获取数据
    fetch() {
        this._isLoading = true;
        this._updated = false;

        // 请求url
        const url = this.state.ajaxUrl;
        // console.log("fetch");
        const data = $.extend({ start: this.state.start, page: this.state.page }, this.state.ajaxParam);
        let ajax = YOOGA.getData;
        if (this.state.ajaxType.toLowerCase() == 'post') {
            ajax = YOOGA.postData;
        }
        ajax(url, data, (res) => {
            if (res.status && res.status.code != '0') {
                // alert(res.status.msg);
                // return;
            }
            if (res.code && res.code != '0') {
                // alert(res.msg);
                // return;
            }
            this._isLoading = false;
            this.ajaxSuccBack && this.ajaxSuccBack.call(this, res);
        });
    }

    destroy() {
        if (YOOGA[this.state.key] && YOOGA[this.state.key].hide) {
            delete YOOGA[this.state.key].hide[this.state.time];
        }
        if (YOOGA[this.state.key] && YOOGA[this.state.key].show) {
            delete YOOGA[this.state.key].show[this.state.time];
        }
        // delete YOOGA[this.state.key].hide[this.state.time];
        // delete YOOGA[this.state.key].show[this.state.time];
        YOOGA.scroll.clear(`goodswall${this.state.key}${this.state.time}`);
        // $(document).off('wallTab:change');
    }
};
