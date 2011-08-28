#!/usr/bin/env node

var nko = require('nko')('EhXaOhxAiOnjSvKc');
var program = require('commander');
var server = require('./server');
var project = require('./project');
var exec = require('child_process').exec

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
    .version('0.1.0')
    .option('-p, --port <number>', 'use a custom http port')
 
program
    .command('init [directory]')
    .description('Initialize a new project and listen for connections.')
    .action(function(dir){checkForDependencies(function(){
        project.chdir(dir)
        project.init()
        project.start()
        server.listen(program.port || process.env.PORT || 8123)
    })})
  
program
    .command('listen [directory]')
    .description('Listen for connections.')
    .action(function(dir){checkForDependencies(function(){
        project.chdir(dir)
        project.start()
        server.listen(program.port || process.env.PORT || 8123)
    })})    

if (process.argv.length > 2) {
    program.parse(process.argv);
} else {
    project.start()
    server.listen(program.port || process.env.PORT || 8123)
}
