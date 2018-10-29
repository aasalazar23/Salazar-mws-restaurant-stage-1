const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
const eslint = require('gulp-eslint');

gulp.task('default', ['copy-html', 'copy-imgs', 'styles', 'lint'], function() {
  gulp.watch('sass/**/*.scss', ['styles']);
  gulp.watch("js/**/*.js", ['lint']);
  gulp.watch('/*.html', ['copy-html']);
  gulp.watch('img/*', ['copy-imgs']);

  browserSync.init({
    server: "./dist"
  });
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
    .pipe(gulp.dest("dist/css"))
    .pipe(browserSync.stream());
});

gulp.task('copy-html', function() {
  gulp.src('./*.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-imgs', function() {
  gulp.src('img/*')
    .pipe(gulp.dest('dist/img'));
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