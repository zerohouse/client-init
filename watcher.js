var path = '/update/deploy',
    port = 7777,
    secret = 'secret',
    cmd = [
        'git pull',
        'grunt build',
        'rm -rf /usr/share/nginx/html/dist',
        'mv dist /usr/share/nginx/html'
    ];

var http = require('http');
var createHandler = require('github-webhook-handler');
var handler = createHandler({path: path, secret: secret});
var exec = require('sync-exec');

http.createServer(function (req, res) {
    handler(req, res, function () {
        res.statusCode = 404;
        res.end('no such location');
    });
}).listen(port);

handler.on('error', function () {
    console.log(err);
});

handler.on('push', function () {
    cmd.forEach(function (cmd) {
        console.log(exec(cmd).stdout);
    });
});