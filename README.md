nide
====

`nide` is a web-based IDE for node.js. It’s designed with simplicity and ease-of-use in mind.
`nide` was initially developed as part of the Node Knockout 48 hour coding competition.

`nide`’s current features:

- Project tree display
- File operations (create/delete/rename files and folders, hide/show hidden files)
- Syntax highlighted code editing
- OS X Lion-style automatic save
- OS X Lion-style version management with revert and side-by-side editing features
- Real time project tree filtering (using regular expressions)
- NPM integration (display currently installed packages, add/remove packages)
- Sleek interface reminiscent of TextMate
- Node.JS Documentation browsing

Planned features (post node knockout):

– Git integration
– Simultaneous multi-user editing

Instructions
============

First, install nide with:

    sudo npm install -g nide

On a new or existing directory, use the following command to setup a new nide project:

    nide init

This command will setup a `.nide` directory, automatically add it to your `.npmignore`
and `.gitignore` files, and start the `nide` server on port 8123. Fire up your web browser
at `localhost:8123` to use nide. If a directory is already a nide project, you can run
nide simply by using:

    nide