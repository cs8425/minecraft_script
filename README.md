# minecraft_script

This is a simple tool for auto give command to minecraft server.


### Install
  Install node.js, and
> $ git clone https://github.com/cs8425/minecraft_script.git

### Config

edit `app.js`:
```
var config = {
	dir: '/home/mc/server/',   // location of minecraft server
	filename: 'minecraft_server.jar',  // file name of minecraft server
	opts: 'nogui',
	jvm: 'java',   // jvm path
	start_cmd: '-Xmx3G -Xms512M -XX:+UseConcMarkSweepGC -XX:+CMSIncrementalPacing -XX:ParallelGCThreads=2 -XX:+AggressiveOpts -jar',
	mcport: 25576  // your minecraft server port here!
};
```

### Script
`script.json`:

```
[
    ["/.*joined the game.*/", "console.log('some one join!');"],
    ["regex string", "string to build function"]
]
```

for variable in function:
'd' : original match string
'arr' : regex match output
'cmd()' : send command to server(`cmd('say Hi~')`)
'rand(min,max)' : random number, round to integer
'data' : object to storage data/status, share to all function

### Run
> node app.js
