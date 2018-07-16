layui.use(['element', 'form'], function () {
    var element = layui.element,
        layer = layui.layer;
    var $ = layui.jquery;
    $(document).on('click', 'a', function (event) {
        var container = $('#wrapper'); //容器
        $.pjax.click(event, {
            container: container
        });
    });
    $(document).on('pjax:send', function () {
        //发送请求开始时
        $("#wrapper").addClass('blur');
    });
    $(document).on('pjax:complete', function () {
        //发送完成后
    });
});
window.publicMethod = {
    loginOut: function () {
        layui.use(['element', 'form'], function () {
            var element = layui.element,
                layer = layui.layer;
            var $ = layui.jquery;
            $.ajax({
                url: '/loginout',
                type: "get",
                success: function (d) {
                    layer.alert(d.msg, {}, function () {
                        if (d.resultCode == "1") {
                            location.href = "/login";
                        }
                    });
                },
                error: function () {
                    layer.alert('退出登录失败');
                }
            });

        });
    },
    getList: function (opt) {
        var _this = this;
        $.ajax({
            url: opt.url,
            type: "get",
            dataType: "json",
            data: opt.data || {},
            success: function (d) {
                opt.suc(d) || function () {
                    console.log(d);
                }
            },
            error: function (d) {
                opt.fail(d) || function () {
                    console.log(d);
                }
            }
        });
    }
}
function _renderNormalList(conf) {
    layui.use(['element', 'laypage', 'layer'], function () {
        var laypage = layui.laypage,
            layer = layui.layer;
        var renderList = {
            renderList: function (pageNow, isFirst) {
                var self = this;
                pageNow = pageNow || 1;
                window.publicMethod.getList({
                    url: conf.listUrl || "/api/taskusers",
                    data: {
                        pagesize: listData.pagesize,
                        page: pageNow
                    },
                    suc: function (d) {
                        window.listData.data = d.items;
                        window.listData.show = true;
                        setTimeout(function () {
                            window.listData.showLoading = false;
                        }, 300);
                        if (isFirst != true) {
                            return;
                        }
                        //完整功能
                        laypage.render({
                            elem: 'pagger-wrap',
                            count: d.rows,
                            curr: self.hashpage,
                            limit: listData.pagesize || 5,
                            layout: ['count', 'prev', 'page', 'next', 'skip'],
                            hash: true,
                            jump: function (obj, first) {
                                if (!first) {
                                    window.listData.showLoading = true;
                                    self.renderList(obj.curr);
                                    self.curr = obj.curr;
                                    $(window).scrollTop(0);
                                }
                            }
                        });
                    },
                    fail: function () {
                        window.listData.show = false;
                    }
                });
            },
            init: function () {
                var self = this;
                window.listData = {
                    show: false,
                    showLoading: false,
                    data: [],
                    pagesize: conf.pagesize || 10
                };
                try {
                    self.hashpage = location.hash.split("!true=")[1];
                } catch (e) {
                    self.hashpage = 1;
                }
                self.renderList(self.hashpage, true);
            },
            deleteSql: function (id) {
                var self = this;
                layer.confirm('是否确认删除？', {
                    btn: ['确认', '取消'] //按钮
                }, function () {
                    $.ajax({
                        url: "/api/delsql",
                        data: {
                            id: id,
                            action: conf.delAction||""
                        },
                        success: function (d) {
                            if (d.success == true) {
                                layer.alert(d.msg);
                                renderList.renderList(renderList.curr);
                            }
                        },
                        error: function (d) {
                            layer.alert(d.message);
                        }
                    });
                }, function () {
                    console.log('取消删除了');
                });
            }
        }
        renderList.init();
        new Vue({
            el: conf.vueWrap || '#app',
            data: listData,
            methods: {
                delSql: renderList.deleteSql
            }
        });
    });
}
