/*
 * @parame getTargetUrl:获取远程jsonp接口
 * */
var http = require('http');
var fs=require('fs');
var querystring = require('querystring');
module.exports = {
    extend: function(target, source, flag) {
        for(var key in source) {
            if(source.hasOwnProperty(key))
                flag ?
                    (target[key] = source[key]) :
                    (target[key] === void 0 && (target[key] = source[key]));
        }
        return target;
    },
    /*异步读取本地文件*/
    readJson:function(dest,callback){
        fs.readFile(dest,"utf-8",function(err,data){
            if(err){
                console.log(err);
                return {"error":"读取文件错误"}
            }
            else{
                try{
                    callback(JSON.parse(data));
                }catch(e){
                    console.log("error",e);
                }
            }
        });
    },
    /*同步读取文件*/
    readFileTb:function(fpath){
        try{
            return fs.readFileSync(fpath,'utf-8');
        }catch(e){
            return {"error":"readfile error"+e};
        }
    },
    /*文件写入*/
    writeFile:function(fpath,data,callback){
        callback=callback||function(){};
        fs.writeFile(fpath,data,function(err){
            if(err) throw err;
            callback();
        });
    },
    /*通过带协议头的url获取端口号、路径、域名*/
    getHostInfo:function(url){
        var tmpobj={};
        if(url==""||url.indexOf("://")<0){
            return {"error":"地址不能为空且必须带入http://或者https://"};
        }
        else{
            tmpobj.host=url.split("://")[1].split("/")[0];
            if(tmpobj.host.indexOf(":")>0){
                tmpobj.domain=tmpobj.host.split(":")[0];
                tmpobj.port=tmpobj.host.split(":")[1];
                tmpobj.files=url.split(tmpobj.host)[1];
            }
            else{
                tmpobj.domain=tmpobj.host;
                tmpobj.port="80";
                tmpobj.files=url.split(tmpobj.host)[1];
            }
            return tmpobj;
        }
    },
    /*获取http请求接口*/
    getTargetUrl:function(url,callback,headers){
        headers=headers||{};
        var http = require("http"),
            iconv = require('iconv-lite'),
            fs= require("fs"),
            self=this;
        var tempOtp=self.getHostInfo(url);
        if (tempOtp.error){
            console.log(tempOtp.error);
            callback({"error":tempOtp.error});
            return;
        }
        var option={
            hostname:tempOtp.domain,
            port:tempOtp.port,
            path:tempOtp.files,
            headers:headers
        };
        callback=callback||function(){};
        var req = http.request(option, function(res) {
            var str="";
            res.on("data", function(chunk) {
                html=iconv.decode(chunk, "utf-8");
                str+=html;
            });
            res.on("end", function(chunk) {
                str=str.replace(/\({/g,"{").replace(/}\)/g,"}");
                try{
                    indexData=JSON.parse(str);
                    callback(indexData);
                }catch(e){
                    //callback({"error":"请求错误","detail":e});
                    callback(str);
                }
            });
        }).on("error", function(e) {
            console.log(e.message);
        });
        req.end();
    },
    getHost:function(req){
        //req为get的时候req参数
        return req.headers.host;
    },
    /*
     *根据页面的配置json来渲染页面，并组合数据
     * @param jsonUrl： 页面配置文件的地址，格式统一
     * @param callback：组合数据完成后的回调
     * * @param callback：页面数据类型
     * */
    renderPage:function(jsonUrl,callback,postdata){
        var allData=[],transData={};
        postdata=postdata||{};
        var self=this;
        self.readJson(jsonUrl,
            function(d) {
                d.modules.forEach(function (v, k) {
                    /*获取每个模块对应的列表*/
                    var data = {
                        path:v.path,
                        postdata:postdata
                    };
                    console.log(v.method);
                    /*v.method为区别请求nodejs接口和服务端接口对应为1和0*/
                    if(v.method==1){
                        self.request(data,function(result){
                            console.log("data",result);
                            allData[k] = {"isload": true, "data": result};
                            try{
                                transData[v.moduleid] = JSON.parse(result);
                            }catch(e){
                                transData[v.moduleid] = {error:JSON.stringify(e)};
                            }
                            //res.send(data);
                        });
                    }else{
                        /*获取每个模块对应的列表*/
                        self.getTargetUrl(v.path, function (data) {
                            allData[k] = {"isload": true, "data": data};
                            transData[v.moduleid] = data;
                        });
                    }
                });
                /*当所有请求完成后执行render*/
                var timmer = setInterval(function () {
                    if (allData.length == d.modules.length) {
                        /*透传两个参数，alldata为组合后的json数据，d为模块的配置文件*/
                        callback(JSON.stringify(transData),d);
                        clearInterval(timmer);
                    }
                }, 100);
            });
    },
    /*本站接口渲染数据*/
    renderPage2:function(jsonUrl,callback){
        var allData=[],transData={};
        var self=this;
        self.readJson(jsonUrl,
            function(d) {
                d.modules.forEach(function (v, k) {
                    /*获取每个模块对应的列表*/
                    self.getTargetUrl(v.path, function (data) {
                        allData[k] = {"isload": true, "data": data};
                        transData[v.moduleid] = data;
                    });
                });
                /*当所有请求完成后执行render*/
                var timmer = setInterval(function () {
                    if (allData.length == d.modules.length) {
                        /*透传两个参数，alldata为组合后的json数据，d为模块的配置文件*/
                        //console.log(transData);
                        callback(JSON.stringify(transData),d);
                        clearInterval(timmer);
                    }
                }, 100);
            });
    },
    /*
     * post或者get请求
     * */
    request:function(data,callback){
        //json转换为字符串
        //console.log("request:data",data);
        data.postdata=data.postdata||{};
        data.postdata = JSON.stringify(data.postdata);
        var options={
            //host: data.host||'200.200.0.217',
            host: data.host||siteconfig.gateway,
            port:data.port||"8080",
            path:data.path||'/bookservice/getCatalogInfo',
            method: data.method||'POST',
            headers: data.headers||{
                'Content-Type': 'application/json',
                'Accept': 'application/json, */*'
            }
        };
        options.headers['Content-Length']=Buffer.byteLength(data.postdata);
        var requ = http.request(options, function(resq) {
            resq.setEncoding('utf8');
            var str="";
            resq.on('data', function (chunk) {
                str+=chunk;
            });
            resq.on('end',function(chunk){
                callback(str);
            });
        });
        requ.write(data.postdata);
        requ.end();
    },
    makeDate:function(date) {
        try {
            var newDate = new Date(date);
            //在小于10的月份前补0
            var month = eval(newDate.getMonth() + 1) < 10 ? '0'+eval(newDate.getMonth() + 1) : eval(newDate.getMonth() + 1);
            //在小于10的日期前补0
            var day = newDate.getDate() < 10 ? '0' + newDate.getDate() : newDate.getDate();
            //在小于10的小时前补0
            var hours = newDate.getHours() < 10 ? '0' + newDate.getHours() : newDate.getHours();
            //在小于10的分钟前补0
            var minutes = newDate.getMinutes() < 10 ? '0' + newDate.getMinutes() : newDate.getMinutes();
            //在小于10的秒数前补0
            var seconds = newDate.getSeconds() < 10 ? '0' + newDate.getSeconds(): newDate.getSeconds();
            //拼接时间
            var stringDate = newDate.getFullYear() + '-' + month + '-' + day + " " + hours + ":" + minutes + ":" + seconds;
        }catch(e){
            var stringDate = "0000-00-00 00:00:00";
        }finally{
            return stringDate;
        }

    }
}
