'use strict';

// var cluster = require('cluster');
var net = require('net');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');

var vm = require('vm');
var repl = require("repl");

var spawn = child_process.spawn;
var exec = child_process.exec;

var config = {
	dir: '/home/mc/server/',
	filename: 'minecraft_server.jar',
	opts: 'nogui',
	jvm: 'java',
	start_cmd: '-Xmx3G -Xms512M -XX:+UseConcMarkSweepGC -XX:+CMSIncrementalPacing -XX:ParallelGCThreads=2 -XX:+AggressiveOpts -jar',
	mcport: 25576
};

var r = repl.start({
    prompt: '>',
    eval: defaultEval,
    input: process.stdin,
    output: process.stdout
});

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err);
})

var status = 1;

var pand = function (num) {
	return (num < 10) ? '0' + num : num + '';
}
var now = function () {
	var t = new Date();
	var out = '[';
	out += t.getFullYear();
	out += '/' + pand(t.getMonth()+1);
	out += '/' + pand(t.getDate());
	out += ' ' + pand(t.getHours());
	out += ':' + pand(t.getMinutes());
	out += ':' + pand(t.getSeconds()) + ']';
	return out;
}

function rand(min, max){
    return Math.round( min + Math.random()*(max-min) );
}

function defaultEval(code, context, file, cb) {
    var err, result;
    // first, create the Script object to check the syntax
    try {
        var script = vm.createScript(code, {
            filename: file,
            displayErrors: false
        });
    } catch (e) {
        // debug('parse error %j', code, e);
        err = e;
    }

    if (!err) {
        try {
            result = script.runInContext(context, { displayErrors: false });
        } catch (e) {
            err = e;
            if (err && process.domain) {
                // debug('not recoverable, send to domain');
                process.domain.emit('error', err);
                process.domain.exit();
                return;
            }
        }
    }

    cb(err, result);
}


var all = {};
all.data = {};
all.list = [];
all.tick = {};

var tick = all.tick;
var data = all.data;
var list = all.list;
function nothing(d){};
var parseScript = function() {
    var filepath = process.argv[2] ||'script.json';
    var str = fs.readFileSync(filepath);
    str = str.toString();
    var raw = JSON.parse(str);

    // console.log('raw:', raw);
    for(var i=0; i<raw.length; i++){
        var par = raw[i][0].match(/\/(.*)\/(.*)/);
        // console.log('par:', par);
        if(par.length == 3){
            raw[i][0] = RegExp(par[1],par[2]);
        }else{

        }
        try{
            raw[i][1] = Function("d", "arr", "cmd", "data", "rand", raw[i][1]);
        } catch(e){
            console.log('creat match script error!', e);
            raw[i][1] = nothing;
        }
    }

    return raw;
}
var updateScript = function() {
    list = parseScript();
    return list;
}
updateScript();

function findmatch(string) {
    for(var i=0; i<list.length; i++){
        var mch = string.match(list[i][0]);
        if(mch){
            // console.log('match:', i, list[i][0], string);
            list[i][1](string, mch, cmd, data, rand);
        }
    }
}


var proc = null;
var start_server = function(){
    var opts = config.opts.split(' ');
    var argv = config.start_cmd.split(' ');
    argv.push(config.filename);
    argv = argv.concat(opts);

    console.log('start with:', argv);

    var child = spawn(config.jvm, argv, {
        cwd: config.dir
    });

    child.stdout.on('data', function (data) {
        // console.log('stdout: ', data[data.length-1], data[data.length-2]);
        // console.log('stdout: '+ data);
        // console.log(data.toString('utf8', 0, -2));
        var str = data.toString();
        str = str.replace('\r','');
        console.log(str.replace('\n',''));
        findmatch(str);
    });

    child.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    child.on('close', function (code) {
        console.log('child process exited with code ' + code);
        if(status) var t = setTimeout(start_server, 0);
    });

    proc = child;
    status = 1;
}

function cmd(cmds){
    proc.stdin.write(cmds + '\n');
}
function stop(cmds){
    status = 0;
    proc.stdin.write('stop\n');
}

start_server();

tick['clear'] = {};
tick['clear'].list = [
	['@a', 'MagicalStick:Arrowstick'],
	['@a', 'deconstruction:deconstructiondeconstructionTable.name']
];
tick['clear'].timer = null;
tick['clear'].time = 5000;
tick['clear'].func = function(){
	var list = tick['clear'].list;
	for(var i=0; i<list.length; i++){
		if(list[i].length == 2){
			cmd('/clear ' + list[i][0] + ' ' + list[i][1]);
		}
	}
	tick['clear'].timer = setTimeout(tick['clear'].func, tick['clear'].time);
}

r.context.proc = proc;
r.context.cmd = cmd;
r.context.start = start_server;
r.context.stop = stop;

r.context.parseScript = parseScript;
r.context.list = list;
r.context.data = data;
r.context.tick = tick;
r.context.update = updateScript;
