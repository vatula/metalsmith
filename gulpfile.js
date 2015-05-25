var gulp = require('gulp');
var babel = require('gulp-babel');
var rename = require('gulp-rename');
var del = require('del');
var vinylPaths = require('vinyl-paths');

gulp.task('clear', function() {
    return gulp.src('lib/index.js').pipe(vinylPaths(del));
});

gulp.task('default', ['clear'], function() {
    return gulp.src('src/metalsmith.js')
        .pipe(babel({stage: 1}))
        .pipe(rename({basename: 'index'}))
        .pipe(gulp.dest('lib'));
});