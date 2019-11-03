var
  gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  browserSync = require('browser-sync').create(),
  concatModules = require('gulp-concat-modules'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglifyes'),
  concat = require('gulp-concat'),
  cleanCSS = require('gulp-clean-css'),
  rename = require('gulp-rename');

/////////////////////////
gulp.task('js', function(){
  return gulp.src('./dev/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(concatModules({
      modules:{
        'vendor.js': 'libs/*.js',
        'main.js': 'main/**/*.js'
      }
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./public/js/'));
});
gulp.task('js-lint', function () {
  return gulp.src(['./dev/js/main/**/*.js', '!./dev/js/main/out/**/*.js' ])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});
gulp.task('js-production', function(){
  return gulp.src('./dev/js/**/*.js')
    .pipe(concatModules({
      modules:{
        'main.min.js': 'main/**/*.js',
        'vendor.min.js': 'lib/*.js'
      }
    }))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js/'));
});

// CSS
  gulp.task('scss-production', function(){
    return gulp.src('./dev/scss/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(autoprefixer())
      .pipe(cleanCSS({compatibility: 'ie9'}))
      .pipe(rename(function(path){
        path.basename += '.min'
      }))
      .pipe(gulp.dest('./public/css/'))
      .pipe(browserSync.stream())
  });

  gulp.task('scss', function(){
    return gulp.src('./dev/scss/**/*.scss')
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(autoprefixer())
      .pipe(sourcemaps.write())
      .pipe(cleanCSS({compatibility: 'ie9'}))
      .pipe(gulp.dest('./public/css/'))
      .pipe(browserSync.stream());
  });
  gulp.task('css', function(){
    return gulp.src(['public/css/*.css', '!public/main.min.css'])
      .pipe(concat('main.min.css'))
      .pipe(gulp.dest('./public/css/'));
  });

// Watch
  gulp.task('default', function() {
    browserSync.init({
      proxy: 'http://lol.local/'
    });
    gulp.watch('./dev/scss/**/*.scss', ['scss']);
    gulp.watch('./dev/js/**/*.js', ['js', 'js-lint'], browserSync.reload);
    gulp.watch('templates/**/*.tpl', browserSync.reload);
  });

// Production
  gulp.task('production', ['scss', 'scss-production', 'js', 'js-production'], function() {
    return true;
  });