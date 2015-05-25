'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var absolute = require('absolute');
var assert = require('assert');
var clone = require('clone');
var fs = require('co-fs-extra');
var is = require('is');
var matter = require('gray-matter');
var Mode = require('stat-mode');
var _path = require('path');
var readdir = require('recursive-readdir');
var rm = require('rimraf');
var thunkify = require('thunkify');
var unyield = require('unyield');
var utf8 = require('is-utf8');
var Ware = require('ware');

/**
 * Thunks.
 */

readdir = thunkify(readdir);
rm = thunkify(rm);

/**
 * Initialize a new `Metalsmith` builder with a working `directory`.
 *
 * @param {String} directory
 */

var Metalsmith = (function () {
    function Metalsmith(directory) {
        _classCallCheck(this, Metalsmith);

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

    _createClass(Metalsmith, [{
        key: 'use',

        /**
         * Add a `plugin` function to the stack.
         *
         * @param {Function, Array} plugin
         * @return {Metalsmith}
         */

        value: function use(plugin) {
            this.plugins.push(plugin);
            return this;
        }
    }, {
        key: 'directory',

        /**
         * Get or set the working `directory`.
         *
         * @param {Object} directory
         * @return {Object, Metalsmith}
         */

        value: function directory(_directory) {
            if (!arguments.length) return _path.resolve(this._directory);
            assert(is.string(_directory), 'You must pass a directory path string.');
            this._directory = _directory;
            return this;
        }
    }, {
        key: 'metadata',

        /**
         * Get or set the global `metadata` to pass to templates.
         *
         * @param {Object} metadata
         * @return {Object, Metalsmith}
         */

        value: function metadata(_metadata) {
            if (!arguments.length) return this._metadata;
            assert(is.object(_metadata), 'You must pass a metadata object.');
            this._metadata = clone(_metadata);
            return this;
        }
    }, {
        key: 'source',

        /**
         * Get or set the source directory.
         *
         * @param {String} path
         * @return {String, Metalsmith}
         */

        value: function source(path) {
            if (!arguments.length) return this.path(this._source);
            assert(is.string(path), 'You must pass a source path string.');
            this._source = path;
            return this;
        }
    }, {
        key: 'destination',

        /**
         * Get or set the destination directory.
         *
         * @param {String} path
         * @return {undefined, String, Metalsmith}
         */

        value: function destination(path) {
            if (!arguments.length) return this.path(this._destination);
            assert(is.string(path), 'You must pass a destination path string.');
            this._destination = path;
            return this;
        }
    }, {
        key: 'concurrency',

        /**
         * Get or set the maximum number of files to open at once.
         *
         * @param {Number} max
         * @return {Number, Metalsmith}
         */

        value: function concurrency(max) {
            if (!arguments.length) return this._concurrency;
            assert(is.number(max), 'You must pass a number for concurrency.');
            this._concurrency = max;
            return this;
        }
    }, {
        key: 'clean',

        /**
         * Get or set whether the destination directory will be removed before writing.
         *
         * @param {Boolean} clean
         * @return {Boolean, Metalsmith}
         */
        value: function clean(_clean) {
            if (!arguments.length) return this._clean;
            assert(is.boolean(_clean), 'You must pass a boolean.');
            this._clean = _clean;
            return this;
        }
    }, {
        key: 'frontmatter',

        /**
         * Optionally turn off frontmatter parsing.
         *
         * @param {Boolean} frontmatter
         * @return {Boolean, Metalsmith}
         */

        value: function frontmatter(_frontmatter) {
            if (!arguments.length) return this._frontmatter;
            assert(is.boolean(_frontmatter), 'You must pass a boolean.');
            this._frontmatter = _frontmatter;
            return this;
        }
    }, {
        key: 'ignore',

        /**
         * Add a file or files to the list of ignores.
         *
         * @param {String, [String]} files The names of files or directories to ignore.
         * @return {Metalsmith}
         */
        value: function ignore(files) {
            if (!arguments.length) return this.ignores.slice();
            this.ignores = this.ignores.concat(files);
            return this;
        }
    }, {
        key: 'path',

        /**
         * Resolve `paths` relative to the root directory.
         *
         * @param {String} paths ...
         * @return {String}
         */

        value: function path() {
            var paths = [].slice.call(arguments);
            paths.unshift(this.directory());
            return _path.resolve.apply(_path, paths);
        }
    }, {
        key: 'build',

        /**
         * Build with the current settings to the destination directory.
         *
         * @return {Object}
         */

        value: function build() {
            return unyield(regeneratorRuntime.mark(function callee$2$0() {
                var clean, dest, files;
                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            clean = this.clean();
                            dest = this.destination();

                            if (!clean) {
                                context$3$0.next = 5;
                                break;
                            }

                            context$3$0.next = 5;
                            return rm(dest);

                        case 5:
                            context$3$0.next = 7;
                            return this.read();

                        case 7:
                            files = context$3$0.sent;
                            context$3$0.next = 10;
                            return this.run(files);

                        case 10:
                            files = context$3$0.sent;
                            context$3$0.next = 13;
                            return this.write(files);

                        case 13:
                            return context$3$0.abrupt('return', files);

                        case 14:
                        case 'end':
                            return context$3$0.stop();
                    }
                }, callee$2$0, this);
            })).apply(this);
        }
    }, {
        key: 'run',

        /**
         * Run a set of `files` through the plugins stack.
         *
         * @param {Object, Array, Function} args
         * @return {Object}
         */

        value: function run() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return unyield(regeneratorRuntime.mark(function callee$2$0(files, plugins) {
                var ware, run, res;
                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            ware = new Ware(plugins || this.plugins);
                            run = thunkify(ware.run.bind(ware));
                            context$3$0.next = 4;
                            return run(files, this);

                        case 4:
                            res = context$3$0.sent;
                            return context$3$0.abrupt('return', res[0]);

                        case 6:
                        case 'end':
                            return context$3$0.stop();
                    }
                }, callee$2$0, this);
            })).apply(this, args);
        }
    }, {
        key: 'read',

        /**
         * Read a dictionary of files from a `dir`, parsing frontmatter. If no directory
         * is provided, it will default to the source directory.
         *
         * @param {String, Function} args (optional)
         * @return {Object}
         */

        value: function read() {
            for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
            }

            return unyield(regeneratorRuntime.mark(function callee$2$0(dir) {
                var read, concurrency, ignores, paths, files, complete, batch, memoizer;
                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            memoizer = function memoizer(memo, file, i) {
                                file = _path.relative(dir, file);
                                memo[file] = files[i];
                                return memo;
                            };

                            dir = dir || this.source();
                            read = this.readFile.bind(this);
                            concurrency = this.concurrency();
                            ignores = this.ignores || null;
                            context$3$0.next = 7;
                            return readdir(dir, ignores);

                        case 7:
                            paths = context$3$0.sent;
                            files = [];
                            complete = 0;

                        case 10:
                            if (!(complete < paths.length)) {
                                context$3$0.next = 19;
                                break;
                            }

                            batch = paths.slice(complete, complete + concurrency);
                            context$3$0.next = 14;
                            return batch.map(read);

                        case 14:
                            batch = context$3$0.sent;

                            files = files.concat(batch);
                            complete += concurrency;
                            context$3$0.next = 10;
                            break;

                        case 19:
                            return context$3$0.abrupt('return', paths.reduce(memoizer, {}));

                        case 20:
                        case 'end':
                            return context$3$0.stop();
                    }
                }, callee$2$0, this);
            })).apply(this, args);
        }
    }, {
        key: 'readFile',

        /**
         * Read a `file` by path. If the path is not absolute, it will be resolved
         * relative to the source directory.
         *
         * @param {String} args
         * @return {Object}
         */

        value: function readFile() {
            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            return unyield(regeneratorRuntime.mark(function callee$2$0(file) {
                var src, ret, frontmatter, stats, buffer, parsed, err;
                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            src = this.source();
                            ret = {};

                            if (!absolute(file)) file = _path.resolve(src, file);

                            context$3$0.prev = 3;
                            frontmatter = this.frontmatter();
                            context$3$0.next = 7;
                            return fs.stat(file);

                        case 7:
                            stats = context$3$0.sent;
                            context$3$0.next = 10;
                            return fs.readFile(file);

                        case 10:
                            buffer = context$3$0.sent;

                            if (!(frontmatter && utf8(buffer))) {
                                context$3$0.next = 25;
                                break;
                            }

                            context$3$0.prev = 12;

                            parsed = matter(buffer.toString());
                            context$3$0.next = 21;
                            break;

                        case 16:
                            context$3$0.prev = 16;
                            context$3$0.t0 = context$3$0['catch'](12);
                            err = new Error('Invalid frontmatter in the file at: ' + file);

                            err.code = 'invalid_frontmatter';
                            throw err;

                        case 21:

                            ret = parsed.data;
                            ret.contents = new Buffer(parsed.content);
                            context$3$0.next = 26;
                            break;

                        case 25:
                            ret.contents = buffer;

                        case 26:

                            ret.mode = Mode(stats).toOctal();
                            ret.stats = stats;
                            context$3$0.next = 37;
                            break;

                        case 30:
                            context$3$0.prev = 30;
                            context$3$0.t1 = context$3$0['catch'](3);

                            if (!(context$3$0.t1.code == 'invalid_frontmatter')) {
                                context$3$0.next = 34;
                                break;
                            }

                            throw context$3$0.t1;

                        case 34:
                            context$3$0.t1.message = 'Failed to read the file at: ' + file + '\n\n' + context$3$0.t1.message;
                            context$3$0.t1.code = 'failed_read';
                            throw context$3$0.t1;

                        case 37:
                            return context$3$0.abrupt('return', ret);

                        case 38:
                        case 'end':
                            return context$3$0.stop();
                    }
                }, callee$2$0, this, [[3, 30], [12, 16]]);
            })).apply(this, args);
        }
    }, {
        key: 'write',

        /**
         * Write a dictionary of `files` to a destination `dir`. If no directory is
         * provided, it will default to the destination directory.
         *
         * @param {Object} args
         * @param {String} dir (optional)
         */

        value: function write() {
            for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                args[_key4] = arguments[_key4];
            }

            return unyield(regeneratorRuntime.mark(function callee$2$0(files, dir) {
                var write, concurrency, keys, complete, batch, writer;
                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            writer = function writer(key) {
                                var file = _path.resolve(dir, key);
                                return write(file, files[key]);
                            };

                            dir = dir || this.destination();
                            write = this.writeFile.bind(this);
                            concurrency = this.concurrency();
                            keys = Object.keys(files);
                            complete = 0;

                        case 6:
                            if (!(complete < keys.length)) {
                                context$3$0.next = 13;
                                break;
                            }

                            batch = keys.slice(complete, complete + concurrency);
                            context$3$0.next = 10;
                            return batch.map(writer);

                        case 10:
                            complete += concurrency;
                            context$3$0.next = 6;
                            break;

                        case 13:
                        case 'end':
                            return context$3$0.stop();
                    }
                }, callee$2$0, this);
            })).apply(this, args);
        }
    }, {
        key: 'writeFile',

        /**
         * Write a `file` by path with `data`. If the path is not absolute, it will be
         * resolved relative to the destination directory.
         *
         * @param {String} file
         * @param {Object} data
         */

        value: function writeFile(file, data) {
            return unyield(regeneratorRuntime.mark(function callee$2$0(file, data) {
                var dest;
                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            dest = this.destination();

                            if (!absolute(file)) file = _path.resolve(dest, file);

                            context$3$0.prev = 2;
                            context$3$0.next = 5;
                            return fs.outputFile(file, data.contents);

                        case 5:
                            if (!data.mode) {
                                context$3$0.next = 8;
                                break;
                            }

                            context$3$0.next = 8;
                            return fs.chmod(file, data.mode);

                        case 8:
                            context$3$0.next = 14;
                            break;

                        case 10:
                            context$3$0.prev = 10;
                            context$3$0.t0 = context$3$0['catch'](2);

                            context$3$0.t0.message = 'Failed to write the file at: ' + file + '\n\n' + context$3$0.t0.message;
                            throw context$3$0.t0;

                        case 14:
                        case 'end':
                            return context$3$0.stop();
                    }
                }, callee$2$0, this, [[2, 10]]);
            })).apply(this, [file, data]);
        }
    }]);

    return Metalsmith;
})();

/**
 * Export `Metalsmith`.
 */

module.exports = Metalsmith;