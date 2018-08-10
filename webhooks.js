var port = 4002
var domain = '5itech.club'
var http = require('http')
var exec = require('child_process').exec
var url_random = Math.random().toString(36).substr(2);
var url = "/webhooks/push/" + url_random

http.createServer(function (req, res) {
    if(req.url === url){
      // 该路径与WebHooks中的路径部分需要完全匹配，实现简易的授权认证。
        exec('git pull origin master && hexo g')
    }
    res.end()
}).listen(port)
console.log('Webhook runing at: http://' + domain + ':' + port + url);
