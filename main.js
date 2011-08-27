#!/usr/bin/env node

var nko = require('nko')('EhXaOhxAiOnjSvKc');
var express = require('express');
var program = require('commander');

program
  .version('0.1.0')
  .option('-C, --chdir <path>', 'change the working directory')
 
program
  .command('init')
  .description('Initialize a new project and listen for connections.')
  .action(function(env){
      console.log('init')
  })
  
program
  .command('run')
  .description('Listen for connections.')
  .action(function(env){
      console.log('run')      
  })

program.parse(process.argv);

var app = express.createServer();

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
    res.send('Hello World');
});

app.listen(3000);