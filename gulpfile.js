const gulp = require('gulp');
const gulp_jspm = require('gulp-jspm');
const gulpsync = require('gulp-sync')(gulp);
const rename = require('gulp-rename');

 
gulp.task('buildJS', () => {
  return gulp.src('lib/inline-diff.js')
    .pipe(gulp_jspm({selfExecutingBundle: true})) // `jspm bundle-sfx main` 
    .pipe(rename('inline-diff.js'))
    .pipe(gulp.dest('build/'));
});

gulp.task('buildCSS', () => {
  return gulp.src('lib/inline-diff.css')
    .pipe(gulp.dest('build/'));
});

gulp.task('build', gulpsync.sync(['buildJS', 'buildCSS']));