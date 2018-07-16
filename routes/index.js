var express = require('express');
var router = express.Router();

/*var async=require('async');
var crypto = require('crypto');
var md5 = crypto.createHash('md5');*/

var mysql=require("../util/sql");

/* GET home page. */
router.get('/', function (req, res) {
    var sql="select * from bullettest";
                mysql.readsql(sql,function(data,fields){
                    res.render('index', {data:data});
                    //res.send("ok")
                });
});

router.get('/sql/adddm',function(req, res, next){
    var text=req.query.text||"";
    var color=req.query.color||"";
    var size=req.query.size||"";
    var position=req.query.position||"";
    var time=req.query.time||"";
    if(text==""){
        res.json({success:false,msg:"fail"});
    }else{
        var sql="insert into bullettest(text,color,size,position,time) values ('"+text+"','"+color+"','"+size+"','"+position+"','"+time+"')";
            mysql.readsql(sql,function(data,fields){
                res.json({success:true,msg:"success"});
               });
             
    }
 }); 

router.get('/sql/readsql',function(req,res,next){
    
        var sql="select * from bullettest";
            mysql.readsql(sql,function(data,fields){
                    res.json(data);
            });
})
module.exports = router;
