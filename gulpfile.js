const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const pump = require('pump');
//const babel = require('gulp-babel');

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

gulp.task('styles', function() {
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

gulp.task('copy-html', function() {
  gulp.src('./*.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-imgs', function() {
  gulp.src('img/*')
    .pipe(gulp.dest('dist/img'));
});

gulp.task('scripts', function() {
  gulp.src('js/**/*.js')
    .pipe(concat('all.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function(cb) {
  pump([
    gulp.src('js/**/*.js'),
    //babel(),
    concat('all.js'), //concatonation
    uglify(), // minimization
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