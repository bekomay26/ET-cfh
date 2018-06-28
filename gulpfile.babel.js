import gulp from 'gulp';
import sass from 'gulp-sass';
import concat from 'gulp-concat';
import mocha from 'gulp-mocha';
import sourcemaps from 'gulp-sourcemaps';
import { listen, changed } from 'gulp-livereload';
import nodemon from 'gulp-nodemon';
import bower from 'gulp-bower';
import babel from 'gulp-babel';
import cover from 'gulp-coverage';

gulp.task('styles', () => {
  return sass('public/css/common.scss', { style: 'expanded' })
    .pipe(gulp.dest('public/css'));
});

gulp.task('nodemon', () => {
  nodemon({
    verbose: true,
    script: 'server.js',
    ignore: ['README.md', 'node_modules/**', 'public/lib/**', '.DS_Store'],
    ext: 'js html jade scss css',
    watch: ['app', 'config', 'public', 'server.js'],
    delayTime: 1,
    env: { PORT: 3000 },
    NODE_ENV: process.env.NODE_ENV
  });
});

gulp.task('watch', () => {
  gulp.watch(['public/css/**'], ['styles']);
  gulp.watch(['public/css/common.scss, public/css/views/articles.scss'], ['styles']);
  listen();
  gulp.watch([
    'public/views/**',
    'public/css/**',
    'public/js/**',
    'app/**/**'
  ]).on('change', changed);
});

gulp.task('export', () => {
  gulp.src('public/lib/bootstrap/dist/css/*')
    .pipe(gulp.dest('public/lib/bootstrap/css'));
  gulp.src('public/lib/bootstrap/dist/js/*')
    .pipe(gulp.dest('public/lib/bootstrap/js'));
  gulp.src('public/lib/bootstrap/dist/fonts/*')
    .pipe(gulp.dest('public/lib/bootstrap/fonts'));
  gulp.src('public/lib/angular-ui-utils/modules/route/route.js')
    .pipe(gulp.dest('public/lib/angular-ui-utils/modules'));
});

// Default task(s).
gulp.task('default', ['export', 'nodemon', 'watch']);
// Test task.
gulp.task('test', () => {
  return gulp.src(['test/**/*.js'])
    .pipe(cover.instrument({
      pattern: ['**/test*'],
      debugDirectory: 'debug'
    }))
    .pipe(mocha({
      reporter: 'spec',
      exit: true,
      globals: {
        should: require('should')
      },
      compilers: 'babel-register'
    }))
    .pipe(cover.gather())
    .pipe(cover.format())
    .pipe(gulp.dest('reports'));
});
// Babel task.
gulp.task('build', () => gulp.src([
  './**/*.js',
  '!node_modules/**',
  '!public/lib/**',
  '!gulpfile.babel.js',
  '!bower_components/**/*'
])
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(concat('all.js'))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('./dist')));

// Bower task.
gulp.task('install', () => {
  return bower({
    directory: './public/lib',
  });
});