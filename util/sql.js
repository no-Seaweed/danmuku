module.exports={
    readsql:function(sql,callback){
        var mysql = require('mysql');
        var conn = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database:'express_dm',
            port: 3306
        });
        conn.connect();
        conn.query(sql, function(err, rows, fields) {
            if (err){console.log(err);return;};
            callback(rows,fields);
        });
        conn.end();
    },
    /*抓取url参数，req为app。get中的request*/
    getParam:function(pname,req){
        var URL=require("url");
        return URL.parse(req.url, true).query[pname]||"";
    }
}
