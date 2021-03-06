var fs = require('fs'),
    path = require('path'),
    bower = require('bower'),
    Promise = require('pinkie-promise'),
    endpointParser = require('bower-endpoint-parser'),
    cp = require('./cp'),
    bemConfig = require('bem-config')(),
    config = bemConfig.moduleSync('bem-lib-site-data') || {};

module.exports = function(pathToLib) {
    var libName = path.basename(pathToLib),
        libConfig = config && config.libs && config.libs[libName] || {},
        libDeps = libConfig.deps || [],
        targetDirectory = path.join(config.tempFolder || 'tmp', 'bower', pathToLib.replace(/\.\.\//g, '')),
        pathToBowerJson = path.resolve(pathToLib, 'bower.json'),
        hasBowerJson = fs.existsSync(pathToBowerJson);

    return new Promise(function(resolve, reject) {
        if (!hasBowerJson && !libDeps.length) return resolve();

        var deps = hasBowerJson && require(pathToBowerJson).dependencies || {},
            depsArr = Object.keys(deps).concat(libDeps).map(function(dep) {
                return endpointParser.json2decomposed(dep, deps[dep]).source;
            });

        bower.commands.install(depsArr, {
            forceLatest: true,
            production: true
        }, {
            directory: path.relative(pathToLib, targetDirectory),
            cwd: pathToLib
        })
            .on('end', function(installed) {
                if (!hasBowerJson) return resolve(installed);

                cp(pathToBowerJson, path.join(config.tempFolder || 'tmp', 'data', libName, 'bower.json'))
                    .then(function() {
                        resolve(installed);
                    })
                    .catch(reject);
            })
            .on('error', function(err) {
                reject(err);
            });
    });
};
