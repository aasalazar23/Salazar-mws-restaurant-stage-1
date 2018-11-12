const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const pump = require('pump');
//const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const pngq = require('imagemin-pngquant');
const jpegtran = require('imagemin-jpegtran');
const responsive = require('gulp-responsive');

gulp.task('default', ['copy-html', 'copy-imgs', 'styles', 'lint'], function() {
  gulp.watch('sass/**/*.scss', ['styles']);
  gulp.watch("js/**/*.js", ['lint']);
  gulp.watch('/*.html', ['copy-html']);
  gulp.watch('img/*', ['copy-imgs']);
  gulp.watch('./*.html')
    .on('change', broswerSync.reload);

  browserSync.init({
    server: "./dist"
  });
});

gulp.task('styles-dist', function() {
  gulp
    .src('sass/**/*.scss')
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        browsers: ["last 2 versions"]
      })
    )
    .pipe(sass({outputStyle: 'compressed'})) // compresses css
    .pipe(gulp.dest("dist/css"))
    .pipe(browserSync.stream());
});

gulp.task('styles', function() {
  gulp
    .src('sass/**/*.scss')
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        browsers: ["last 2 versions"]
      })
    )
    .pipe(gulp.dest("./css"))
    .pipe(browserSync.stream());
});

gulp.task('copy-html', function() {
  gulp.src('./*.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-imgs', function() {
  gulp.src('./img-originals/*')
  .pipe(responsive({
          // Resize all JPG images to three different sizes: 200, 500
          '*.jpg': [{
            width: 300,
            rename: { suffix: '-300px' },
          }, {
            width: 480,
            rename: { suffix: '-480px' },
          }, {
            // Compress, strip metadata, and rename original image
            rename: { suffix: '-original' },
          }],
          // Resize all PNG images to be retina ready
          '*.png': [{
            width: 250,
          }, {
            width: 250 * 2,
            rename: { suffix: '@2x' },
          }],
        }, {
          // Global configuration for all images
          // The output quality for JPEG, WebP and TIFF output formats
          quality: 50,
          // Use progressive (interlace) scan for JPEG and PNG output
          progressive: true,
          // Strip all metadata
          withMetadata: false,
        }))
  .pipe(gulp.dest('./img'));
});

gulp.task('scripts', function(cb) {
  pump([
    gulp.src('js/**/*.js'),
    sourcemaps.init(),
    concat('all.js'), //concatonation
    sourcemaps.write(),
    gulp.dest('dist/js')
  ], cb);
});

gulp.task('scripts-dist', function(cb) {
  pump([
    gulp.src('js/**/*.js'),
    //sourcemaps.init(),
    //babel(),
    //concat('all.js'), //concatonation
    uglify(), // minimization
    //sourcemaps.write(),
    gulp.dest('dist/js')
  ], cb);
});

gulp.task('lint', function() {
    return (
        gulp
            .src(['js/**/*.js'])
            // eslint() attaches the lint output to the eslint property
            // of the file object so it can be used by other modules.
            .pipe(eslint())
            // eslint.format() outputs the lint results to the console.
            // Alternatively use eslint.formatEach() (see Docs).
            .pipe(eslint.format())
            // To have the process exit with an error code (1) on
            // lint error, return the stream and pipe to failOnError last.
            .pipe(eslint.failOnError())
    );
});

gulp.task('dist', ['copy-html', 'copy-imgs', 'styles', 'lint', 'scripts-dist']);