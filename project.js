var fs = require('fs')

exports.init = function() {
    try {
        fs.mkdirSync('.nide', '755')
    } catch (e) {
        console.error('Cannot initialize new project. `.nide` already exists.')
        process.exit(-1)
    }
}

exports.chdir = function(dir) {
    if (dir) {
        try {
            process.chdir(dir)
        } catch (e) {
            console.error('Could not enter directory `' + dir + '`.')
            process.exit(-1)
        }
    }
}