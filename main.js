#!/usr/bin/env node

var nko = require('nko')('EhXaOhxAiOnjSvKc');
var program = require('commander');
var server = require('./server');
var project = require('./project');

program
    .version('0.1.0')
    .option('-p, --port <number>', 'use a custom http port')
    .option('-P, --password <password>', 'require `password` to access`')
 
program
    .command('init [directory]')
    .description('Initialize a new project and listen for connections.')
    .action(function(dir){
        project.chdir(dir)
        project.init()
        server.listen(program.port || process.env.PORT || 8123)
    })
  
program
    .command('run [directory]')
    .description('Listen for connections.')
    .action(function(dir){
        project.chdir(dir)
        project.list()
        server.listen(program.port || process.env.PORT || 8123)
    })

program.parse(process.argv);