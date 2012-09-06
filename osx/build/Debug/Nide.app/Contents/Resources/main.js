#!/usr/bin/env node

var program = require('commander');
var server = require('./server/server');
var project = require('./server/project');
var exec = require('child_process').exec
var path = require('path')
var fs = require('fs')

var packageJSON = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf-8'))

var checkForDependencies = function(callback) {
    exec('which npm', function(err, stdout, stderr) {
        if (err) {
            console.error('Could not find `npm` command. Is npm installed?')
            process.exit(-1)
        } else {
            callback()
        }
    })
}

program
    .version(packageJSON.version)
    .option('-H, --host <ip_address>', 'only accept traffic directed to a specific ip')
    .option('-p, --port <number>', 'use a custom http port')
    .option('-u, --username <username>', 'require a username for authentication')
    .option('-P, --password <password>', 'require a password for authentication')
    .option('-d, --no-downgrade', 'do not downgrade, force run as root (must already be root)')
    .option('-b, --no-browser', 'do not attempt to launch the default browser')
program
    .command('init [directory]')
    .description('Initialize a new project and listen for connections.')
    .action(function(dir){checkForDependencies(function(){
        // Work around name collision caused by "password" function provided by commander
        var password = program.password instanceof Function ? undefined : program.password
        if (dir && !path.existsSync(dir)) {
            console.log('Created `' + dir + '` directory.')
            fs.mkdirSync(dir)
        }
        project.chdir(dir)
        project.init()
        project.start()
        server.listen(program.port || process.env.PORT || 8123, program.host, program.username, password, program.downgrade, program.browser)
    })})

program
    .command('listen [directory]')
    .description('Listen for connections.')
    .action(function(dir){checkForDependencies(function(){
        // Work around name collision caused by "password" function provided by commander
        var password = program.password instanceof Function ? undefined : program.password
        project.chdir(dir)
        project.start()
        server.listen(program.port || process.env.PORT || 8123, program.host, program.username, password, program.downgrade, program.browser)
    })})

if (process.argv.length > 2) {
    if (process.argv[2].charAt(0) == '-') {
        process.argv.splice(2, 0, 'listen')
    }
    program.parse(process.argv);
} else {
    process.argv.push('listen');
    program.parse(process.argv);
}
