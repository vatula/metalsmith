'use strict';

var _toConsumableArray = require('babel-runtime/helpers/to-consumable-array')['default'];

var _Array$from = require('babel-runtime/core-js/array/from')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Object$create = require('babel-runtime/core-js/object/create')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var absolute = require('absolute');
var assert = require('assert');
var clone = require('clone');
var fs = require('fs');
var is = require('is');
var matter = require('gray-matter');
var Mode = require('stat-mode');
var path = require('path');
var recreaddir = require('recursive-readdir');
var rimraf = require('rimraf');
var utf8 = require('is-utf8');
var Ware = require('ware');

/**
 * Thunks.
 */

function promise(fn) {
    return function () {
        var args = _Array$from(arguments);
        return new _Promise(function (resolve, reject) {
            fn.apply(undefined, _toConsumableArray(args).concat([function (err) {
                for (var _len = arguments.length, other = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    other[_key - 1] = arguments[_key];
                }

                if (err) {
                    reject(err);
                } else {
                    resolve(other.length > 1 ? other : other[0]);
                }
            }]));
        });
    };
}

//let rm = promise(rimraf);
//let readdir = promise(recreaddir);
var rm = rimraf;
var readdir = promise(recreaddir);

/**
 * Export `Metalsmith`.
 */

module.exports = Metalsmith;

/**
 * Initialize a new `Metalsmith` builder with a working `directory`.
 *
 * @param {String} directory
 */

function Metalsmith(directory) {
    if (!(this instanceof Metalsmith)) return new Metalsmith(directory);
    assert(directory, 'You must pass a working directory path.');
    this.plugins = [];
    this.ignores = [];
    this.directory(directory);
    this.metadata({});
    this.source('src');
    this.destination('build');
    this.concurrency(Infinity);
    this.clean(true);
    this.frontmatter(true);
}

/**
 * Add a `plugin` function to the stack.
 *
 * @param {Function | Array} plugin
 * @return {Metalsmith}
 */

Metalsmith.prototype.use = function (plugin) {
    this.plugins.push(plugin);
    return this;
};

/**
 * Get or set the working `directory`.
 *
 * @param {Object=} directory
 * @return {Object | Metalsmith}
 */

Metalsmith.prototype.directory = function (directory) {
    if (!arguments.length) return path.resolve(this._directory);
    assert(is.string(directory), 'You must pass a directory path string.');
    this._directory = directory;
    return this;
};

/**
 * Get or set the global `metadata` to pass to templates.
 *
 * @param {Object} metadata
 * @return {Object | Metalsmith}
 */

Metalsmith.prototype.metadata = function (metadata) {
    if (!arguments.length) return this._metadata;
    assert(is.object(metadata), 'You must pass a metadata object.');
    this._metadata = clone(metadata);
    return this;
};

/**
 * Get or set the source directory.
 *
 * @param {String=} path
 * @return {String | Metalsmith}
 */

Metalsmith.prototype.source = function (path) {
    if (!arguments.length) return this.path(this._source);
    assert(is.string(path), 'You must pass a source path string.');
    this._source = path;
    return this;
};

/**
 * Get or set the destination directory.
 *
 * @param {String=} path
 * @return {String | Metalsmith}
 */

Metalsmith.prototype.destination = function (path) {
    if (!arguments.length) return this.path(this._destination);
    assert(is.string(path), 'You must pass a destination path string.');
    this._destination = path;
    return this;
};

/**
 * Get or set the maximum number of files to open at once.
 *
 * @param {Number=} max
 * @return {Number | Metalsmith}
 */

Metalsmith.prototype.concurrency = function (max) {
    if (!arguments.length) return this._concurrency;
    assert(is.number(max), 'You must pass a number for concurrency.');
    this._concurrency = max;
    return this;
};

/**
 * Get or set whether the destination directory will be removed before writing.
 *
 * @param {Boolean=} clean
 * @return {Boolean | Metalsmith}
 */
Metalsmith.prototype.clean = function (clean) {
    if (!arguments.length) return this._clean;
    assert(is.boolean(clean), 'You must pass a boolean.');
    this._clean = clean;
    return this;
};

/**
 * Optionally turn off frontmatter parsing.
 *
 * @param {Boolean=} frontmatter
 * @return {Boolean | Metalsmith}
 */

Metalsmith.prototype.frontmatter = function (frontmatter) {
    if (!arguments.length) return this._frontmatter;
    assert(is.boolean(frontmatter), 'You must pass a boolean.');
    this._frontmatter = frontmatter;
    return this;
};

/**
 * Add a file or files to the list of ignores.
 *
 * @param {String | String[]} files The names of files or directories to ignore.
 * @return {String[] | Metalsmith}
 */
Metalsmith.prototype.ignore = function (files) {
    if (!arguments.length) return this.ignores.slice();
    this.ignores = this.ignores.concat(files);
    return this;
};

/**
 * Resolve `paths` relative to the root directory.
 *
 * @param {String} paths...
 * @return {String}
 */

Metalsmith.prototype.path = function () {
    var paths = _Array$from(arguments);
    paths.unshift(this.directory());
    return path.resolve.apply(path, paths);
};

/**
 * Build with the current settings to the destination directory.
 *
 * @return {Object}
 */

Metalsmith.prototype.build = function callee$0$0() {
    var clean, dest, files;
    return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                clean = this.clean();
                dest = this.destination();

                if (!clean) {
                    context$1$0.next = 5;
                    break;
                }

                context$1$0.next = 5;
                return rm(dest);

            case 5:
                context$1$0.next = 7;
                return this.read();

            case 7:
                files = context$1$0.sent;
                context$1$0.next = 10;
                return this.run(files);

            case 10:
                files = context$1$0.sent;
                context$1$0.next = 13;
                return this.write(files);

            case 13:
                return context$1$0.abrupt('return', files);

            case 14:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this);
};

/**
 * Run a set of `files` through the plugins stack.
 *
 * @param {Object} files
 * @param {Array=} plugins
 * @return {Object}
 */
require('thunkify');

Metalsmith.prototype.run = function callee$0$0(files, plugins) {
    var ware, run, res;
    return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                ware = new Ware(plugins || this.plugins);
                run = promise(ware.run.bind(ware));
                context$1$0.next = 4;
                return run(files, this);

            case 4:
                res = context$1$0.sent;
                return context$1$0.abrupt('return', res[0]);

            case 6:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this);
};

/**
 * Read a dictionary of files from a `dir`, parsing frontmatter. If no directory
 * is provided, it will default to the source directory.
 *
 * @param {String=} dir (optional)
 * @return {Object}
 */

Metalsmith.prototype.read = function callee$0$0(dir) {
    var read, concurrency, ignores, paths, files, complete, batch, memoizer;
    return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                memoizer = function memoizer(memo, file, i) {
                    file = path.relative(dir, file);
                    memo[file] = files[i];
                    return memo;
                };

                dir = dir || this.source();
                read = this.readFile.bind(this);
                concurrency = this.concurrency();
                ignores = this.ignores || null;
                context$1$0.next = 7;
                return readdir(dir, ignores);

            case 7:
                paths = context$1$0.sent.reduce(function (result, item) {
                    return result.concat(item);
                }, []);
                files = [];
                complete = 0;
                batch = undefined;

            case 11:
                if (!(complete < paths.length)) {
                    context$1$0.next = 20;
                    break;
                }

                batch = paths.slice(complete, complete + concurrency);
                context$1$0.next = 15;
                return _Promise.all(batch.map(read));

            case 15:
                batch = context$1$0.sent;

                files = files.concat(batch);
                complete += concurrency;
                context$1$0.next = 11;
                break;

            case 20:
                return context$1$0.abrupt('return', paths.reduce(memoizer, _Object$create(null)));

            case 21:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this);
};

/**
 * Read a `file` by path. If the path is not absolute, it will be resolved
 * relative to the source directory.
 *
 * @param {String} file
 * @return {Object}
 */

Metalsmith.prototype.readFile = function callee$0$0(file) {
    var src, ret, frontmatter, stats, buffer, parsed, err;
    return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                src = this.source();
                ret = _Object$create(null);

                if (!absolute(file)) file = path.resolve(src, file);

                context$1$0.prev = 3;
                frontmatter = this.frontmatter();
                context$1$0.next = 7;
                return promise(fs.stat.bind(fs))(file);

            case 7:
                stats = context$1$0.sent;
                context$1$0.next = 10;
                return promise(fs.readFile.bind(fs))(file);

            case 10:
                buffer = context$1$0.sent;
                parsed = undefined;

                if (!(frontmatter && utf8(buffer))) {
                    context$1$0.next = 26;
                    break;
                }

                context$1$0.prev = 13;

                parsed = matter(buffer.toString());
                context$1$0.next = 22;
                break;

            case 17:
                context$1$0.prev = 17;
                context$1$0.t0 = context$1$0['catch'](13);
                err = new Error('Invalid frontmatter in the file at: ' + file);

                err.code = 'invalid_frontmatter';
                throw err;

            case 22:

                ret = parsed.data;
                ret.contents = new Buffer(parsed.content);
                context$1$0.next = 27;
                break;

            case 26:
                ret.contents = buffer;

            case 27:

                ret.mode = Mode(stats).toOctal();
                ret.stats = stats;
                context$1$0.next = 38;
                break;

            case 31:
                context$1$0.prev = 31;
                context$1$0.t1 = context$1$0['catch'](3);

                if (!(context$1$0.t1.code == 'invalid_frontmatter')) {
                    context$1$0.next = 35;
                    break;
                }

                throw context$1$0.t1;

            case 35:
                context$1$0.t1.message = 'Failed to read the file at: ' + file + '\n\n' + context$1$0.t1.message;
                context$1$0.t1.code = 'failed_read';
                throw context$1$0.t1;

            case 38:
                return context$1$0.abrupt('return', ret);

            case 39:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this, [[3, 31], [13, 17]]);
};

/**
 * Write a dictionary of `files` to a destination `dir`. If no directory is
 * provided, it will default to the destination directory.
 *
 * @param {Object} files
 * @param {String=} dir
 */
Metalsmith.prototype.write = function callee$0$0(files, dir) {
    var write, concurrency, keys, complete, batch, writer;
    return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                writer = function writer(key) {
                    var file;
                    return _regeneratorRuntime.async(function writer$(context$2$0) {
                        while (1) switch (context$2$0.prev = context$2$0.next) {
                            case 0:
                                file = path.resolve(dir, key);
                                context$2$0.next = 3;
                                return write(file, files[key]);

                            case 3:
                                return context$2$0.abrupt('return', context$2$0.sent);

                            case 4:
                            case 'end':
                                return context$2$0.stop();
                        }
                    }, null, this);
                };

                dir = dir || this.destination();
                write = this.writeFile.bind(this);
                concurrency = this.concurrency();
                keys = _Object$keys(files);
                complete = 0;
                batch = undefined;

            case 7:
                if (!(complete < keys.length)) {
                    context$1$0.next = 16;
                    break;
                }

                batch = keys.slice(complete, complete + concurrency);
                context$1$0.next = 11;
                return writer;

            case 11:
                context$1$0.t0 = context$1$0.sent;
                batch.map(context$1$0.t0);

                complete += concurrency;
                context$1$0.next = 7;
                break;

            case 16:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this);
};

/**
 * Write a `file` by path with `data`. If the path is not absolute, it will be
 * resolved relative to the destination directory.
 *
 * @param {String} file
 * @param {Object} data
 */

Metalsmith.prototype.writeFile = function callee$0$0(file, data) {
    var dest;
    return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                dest = this.destination();

                if (!absolute(file)) file = path.resolve(dest, file);

                context$1$0.prev = 2;
                context$1$0.next = 5;
                return fs.outputFile(file, data.contents);

            case 5:
                if (!data.mode) {
                    context$1$0.next = 7;
                    break;
                }

                return context$1$0.abrupt('return', fs.chmod(file, data.mode));

            case 7:
                context$1$0.next = 13;
                break;

            case 9:
                context$1$0.prev = 9;
                context$1$0.t0 = context$1$0['catch'](2);

                context$1$0.t0.message = 'Failed to write the file at: ' + file + '\n\n' + context$1$0.t0.message;
                throw context$1$0.t0;

            case 13:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this, [[2, 9]]);
};