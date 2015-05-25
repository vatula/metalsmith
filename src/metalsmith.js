
var absolute = require('absolute');
var assert = require('assert');
var clone = require('clone');
var fs = require('co-fs-extra');
var is = require('is');
var matter = require('gray-matter');
var Mode = require('stat-mode');
var path = require('path');
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

class Metalsmith {
    constructor(directory) {
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
     * @param {Function, Array} plugin
     * @return {Metalsmith}
     */

    use(plugin){
        this.plugins.push(plugin);
        return this;
    };

    /**
     * Get or set the working `directory`.
     *
     * @param {Object} directory
     * @return {Metalsmith}
     */

    directory(directory = null){
        if (!arguments.length) return path.resolve(this._directory);
        assert(is.string(directory), 'You must pass a directory path string.');
        this._directory = directory;
        return this;
    };

    /**
     * Get or set the global `metadata` to pass to templates.
     *
     * @param {Object} metadata
     * @return {Metalsmith}
     */

    metadata(metadata){
        if (!arguments.length) return this._metadata;
        assert(is.object(metadata), 'You must pass a metadata object.');
        this._metadata = clone(metadata);
        return this;
    };

    /**
     * Get or set the source directory.
     *
     * @param {String} path
     * @return {String | Metalsmith}
     */

    source(path){
        if (!path) return this.path(this._source);
        assert(is.string(path), 'You must pass a source path string.');
        this._source = path;
        return this;
    };

    /**
     * Get or set the destination directory.
     *
     * @param {String} path
     * @return {undefined | String | Metalsmith}
     */

    destination(path = null) {
        if (!path) return this.path(this._destination);
        assert(is.string(path), 'You must pass a destination path string.');
        this._destination = path;
        return this;
    };

    /**
     * Get or set the maximum number of files to open at once.
     *
     * @param {Number} max
     * @return {Number, Metalsmith}
     */

    concurrency(max){
        if (!arguments.length) return this._concurrency;
        assert(is.number(max), 'You must pass a number for concurrency.');
        this._concurrency = max;
        return this;
    };

    /**
     * Get or set whether the destination directory will be removed before writing.
     *
     * @param {Boolean} clean
     * @return {Boolean | Metalsmith}
     */
    clean(clean){
        if (!clean) return this._clean;
        assert(is.boolean(clean), 'You must pass a boolean.');
        this._clean = clean;
        return this;
    };

    /**
     * Optionally turn off frontmatter parsing.
     *
     * @param {Boolean} frontmatter
     * @return {Boolean, Metalsmith}
     */

    frontmatter(frontmatter) {
        if (!arguments.length) return this._frontmatter;
        assert(is.boolean(frontmatter), 'You must pass a boolean.');
        this._frontmatter = frontmatter;
        return this;
    };

    /**
     * Add a file or files to the list of ignores.
     *
     * @param {String | Array.<String>} files The names of files or directories to ignore.
     * @return {Metalsmith | Array.<String>}
     */
    ignore(files){
        if (!arguments.length) return this.ignores.slice();
        this.ignores = this.ignores.concat(files);
        return this;
    };

    /**
     * Resolve `paths` relative to the root directory.
     *
     * @param {...Object} paths Array of strings
     * @return {String}
     */

    path(...paths) {
        paths.unshift(this.directory());
        return path.resolve(...paths);
    };

    /**
     * Build with the current settings to the destination directory.
     *
     * @return {Object}
     */

    build() {
        return unyield(function*(){
            var clean = this.clean();
            var dest = this.destination();
            if (clean) yield rm(dest);

            var files = yield this.read();
            files = yield this.run(files);
            yield this.write(files);
            return files;
        }).apply(this);
    }

    /**
     * Run a set of `files` through the plugins stack.
     *
     * @param {Object, Array, Function} args
     * @return {Object}
     */

    run(...args) {
        return unyield(function*(files, plugins){
            var ware = new Ware(plugins || this.plugins);
            var run = thunkify(ware.run.bind(ware));
            var res = yield run(files, this);
            return res[0];
        }).apply(this, args);
    }

    /**
     * Read a dictionary of files from a `dir`, parsing frontmatter. If no directory
     * is provided, it will default to the source directory.
     *
     * @param {String, Function} args (optional)
     * @return {Object}
     */

    read(...args) {
        return unyield(function*(dir){
            dir = dir || this.source();
            var read = this.readFile.bind(this);
            var concurrency = this.concurrency();
            var ignores = this.ignores || null;
            var paths = yield readdir(dir, ignores);
            var files = [];
            var complete = 0;
            var batch;

            while (complete < paths.length) {
                batch = paths.slice(complete, complete + concurrency);
                batch = yield batch.map(read);
                files = files.concat(batch);
                complete += concurrency;
            }

            return paths.reduce(memoizer, {});

            function memoizer(memo, file, i) {
                file = path.relative(dir, file);
                memo[file] = files[i];
                return memo;
            }
        }).apply(this, args);
    }

    /**
     * Read a `file` by path. If the path is not absolute, it will be resolved
     * relative to the source directory.
     *
     * @param {String} args
     * @return {Object}
     */

    readFile(...args) {
        return unyield(function*(file){
            var src = this.source();
            var ret = {};

            if (!absolute(file)) file = path.resolve(src, file);

            try {
                var frontmatter = this.frontmatter();
                var stats = yield fs.stat(file);
                var buffer = yield fs.readFile(file);
                var parsed;

                if (frontmatter && utf8(buffer)) {
                    try {
                        parsed = matter(buffer.toString());
                    } catch (e) {
                        var err = new Error('Invalid frontmatter in the file at: ' + file);
                        err.code = 'invalid_frontmatter';
                        throw err;
                    }

                    ret = parsed.data;
                    ret.contents = new Buffer(parsed.content);
                } else {
                    ret.contents = buffer;
                }

                ret.mode = Mode(stats).toOctal();
                ret.stats = stats;
            } catch (e) {
                if (e.code == 'invalid_frontmatter') throw e;
                e.message = 'Failed to read the file at: ' + file + '\n\n' + e.message;
                e.code = 'failed_read';
                throw e;
            }

            return ret;
        }).apply(this, args);
    }

    /**
     * Write a dictionary of `files` to a destination `dir`. If no directory is
     * provided, it will default to the destination directory.
     *
     * @param {Object} args
     * @param {String} dir (optional)
     */

    write(...args) {
        return unyield(function*(files, dir){
            dir = dir || this.destination();
            var write = this.writeFile.bind(this);
            var concurrency = this.concurrency();
            var keys = Object.keys(files);
            var complete = 0;
            var batch;

            while (complete < keys.length) {
                batch = keys.slice(complete, complete + concurrency);
                yield batch.map(writer);
                complete += concurrency;
            }

            function writer(key){
                var file = path.resolve(dir, key);
                return write(file, files[key]);
            }
        }).apply(this, args);
    }

    /**
     * Write a `file` by path with `data`. If the path is not absolute, it will be
     * resolved relative to the destination directory.
     *
     * @param {String} file
     * @param {Object} data
     */

    writeFile(file, data) {
        return unyield(function*(file, data){
            var dest = this.destination();
            if (!absolute(file)) file = path.resolve(dest, file);

            try {
                yield fs.outputFile(file, data.contents);
                if (data.mode) yield fs.chmod(file, data.mode);
            } catch (e) {
                e.message = 'Failed to write the file at: ' + file + '\n\n' + e.message;
                throw e;
            }
        }).apply(this, [file, data]);
    }
}

/**
 * Export `Metalsmith`.
 */

module.exports = Metalsmith;
