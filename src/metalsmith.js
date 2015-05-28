
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
    return function() {
        let args = Array.from(arguments);
        return new Promise((resolve, reject) => {
            fn(...args, function(err, ...other) {
                if (err) { reject(err); } else { resolve(other.length > 1 ? other : other[0]); }
            })
        });
    }
}

//let rm = promise(rimraf);
//let readdir = promise(recreaddir);
let rm = rimraf;
let readdir = promise(recreaddir);

/**
 * Export `Metalsmith`.
 */

module.exports = Metalsmith;

/**
 * Initialize a new `Metalsmith` builder with a working `directory`.
 *
 * @param {String} directory
 */

function Metalsmith(directory){
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

Metalsmith.prototype.use = function(plugin){
    this.plugins.push(plugin);
    return this;
};

/**
 * Get or set the working `directory`.
 *
 * @param {Object=} directory
 * @return {Object | Metalsmith}
 */

Metalsmith.prototype.directory = function(directory){
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

Metalsmith.prototype.metadata = function(metadata){
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

Metalsmith.prototype.source = function(path){
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

Metalsmith.prototype.destination = function(path){
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

Metalsmith.prototype.concurrency = function(max){
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
Metalsmith.prototype.clean = function(clean){
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

Metalsmith.prototype.frontmatter = function(frontmatter){
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
Metalsmith.prototype.ignore = function(files){
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

Metalsmith.prototype.path = function(){
    var paths = Array.from(arguments);
    paths.unshift(this.directory());
    return path.resolve.apply(path, paths);
};

/**
 * Build with the current settings to the destination directory.
 *
 * @return {Object}
 */

Metalsmith.prototype.build = async function() {
    let clean = this.clean();
    let dest = this.destination();
    if (clean) await rm(dest);

    let files = await this.read();
    files = await this.run(files);
    await this.write(files);
    return files;
};

/**
 * Run a set of `files` through the plugins stack.
 *
 * @param {Object} files
 * @param {Array=} plugins
 * @return {Object}
 */
require('thunkify');

Metalsmith.prototype.run = async function(files, plugins) {
    var ware = new Ware(plugins || this.plugins);
    let run = promise(ware.run.bind(ware));
    let res = await run(files, this);
    return res[0];
};

/**
 * Read a dictionary of files from a `dir`, parsing frontmatter. If no directory
 * is provided, it will default to the source directory.
 *
 * @param {String=} dir (optional)
 * @return {Object}
 */

Metalsmith.prototype.read = async function(dir) {
    dir = dir || this.source();
    let read = this.readFile.bind(this);
    let concurrency = this.concurrency();
    let ignores = this.ignores || null;
    let paths = (await readdir(dir, ignores)).reduce((result, item) => result.concat(item),[]);
    let files = [];
    let complete = 0;
    let batch;

    function memoizer(memo, file, i) {
        file = path.relative(dir, file);
        memo[file] = files[i];
        return memo;
    }

    while (complete < paths.length) {
        batch = paths.slice(complete, complete + concurrency);
        batch = await Promise.all(batch.map(read));
        files = files.concat(batch);
        complete += concurrency;
    }

    return paths.reduce(memoizer, Object.create(null));
};

/**
 * Read a `file` by path. If the path is not absolute, it will be resolved
 * relative to the source directory.
 *
 * @param {String} file
 * @return {Object}
 */

Metalsmith.prototype.readFile = async function(file) {
    let src = this.source();
    let ret = Object.create(null);

    if (!absolute(file)) file = path.resolve(src, file);

    try {
        let frontmatter = this.frontmatter();
        let stats = await promise(fs.stat.bind(fs))(file);
        let buffer = await promise(fs.readFile.bind(fs))(file);
        let parsed;

        if (frontmatter && utf8(buffer)) {
            try {
                parsed = matter(buffer.toString());
            } catch (e) {
                var err = new Error(`Invalid frontmatter in the file at: ${file}`);
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
        e.message = `Failed to read the file at: ${file}\n\n${e.message}`;
        e.code = 'failed_read';
        throw e;
    }

    return ret;
};

/**
 * Write a dictionary of `files` to a destination `dir`. If no directory is
 * provided, it will default to the destination directory.
 *
 * @param {Object} files
 * @param {String=} dir
 */
Metalsmith.prototype.write = async function(files, dir) {
    dir = dir || this.destination();
    let write = this.writeFile.bind(this);
    let concurrency = this.concurrency();
    let keys = Object.keys(files);
    let complete = 0;
    let batch;

    async function writer(key){
        var file = path.resolve(dir, key);
        return await write(file, files[key]);
    }

    while (complete < keys.length) {
        batch = keys.slice(complete, complete + concurrency);
        batch.map(await writer);
        complete += concurrency;
    }
};

/**
 * Write a `file` by path with `data`. If the path is not absolute, it will be
 * resolved relative to the destination directory.
 *
 * @param {String} file
 * @param {Object} data
 */

Metalsmith.prototype.writeFile = async function(file, data) {
    var dest = this.destination();
    if (!absolute(file)) file = path.resolve(dest, file);

    try {
        await fs.outputFile(file, data.contents);
        if (data.mode) return fs.chmod(file, data.mode);
    } catch (e) {
        e.message = `Failed to write the file at: ${file}\n\n${e.message}`;
        throw e;
    }

};