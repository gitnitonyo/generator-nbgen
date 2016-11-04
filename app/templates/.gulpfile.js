/* eslint-disable */
/**
 * supporting gulp tasks for automating file injections and conversions
 */
var gulp = require('gulp'),
    tap = require('gulp-tap'),
    hjson = require('hjson'),
    dest = require('gulp-dest'),
    inject = require('gulp-inject');

var extend = require('underscore').extend;

var starttag = '// inject:imports:{{ext}}',
    endtag = '// endinject';

var filePatterns = {
    jsImports: {
        target: 'client/imports/imports.js',
        options: { cwd: 'client/imports' },
        srcMatches: ['ui/components/**/*.js', 'ui/app/**/*.js'],
        dest: 'client/imports',
    },
    serverJsImports: {
        target: 'server/main.js',
        options: { cwd: 'server' },
        srcMatches: ['imports/**/*.js'],
        dest: 'server',
    },
    scssImports: {
        target: 'client/imports/scss/_common.scss',
        options: { cwd: 'client/imports' },
        srcMatches: ['ui/components/**/*.scss', 'ui/app/**/*.scss'],
        dest: 'client/imports/scss',
    },
    i18nTransform: {
        options: { cwd: 'client/imports' },
        srcMatches: ['i18n/**/*.hjson'],
        dest: 'public/i18n',
    }
}

var jsImportsInjectOptions = {
    relative: true,
    starttag: starttag,
    endtag: endtag,
    transform: function(filepath) {
        return `import './${filepath}';`
    }
}

var scssImportsInjectOptions = extend({}, jsImportsInjectOptions, {
    transform: function(filepath) {
        return `@import "${filepath}";`;
    }
})

gulp.task('default', [
    'pre-dev',
    'watch'
]);

gulp.task('js-imports', function() {
    var filePattern = filePatterns.jsImports;
    gulp.src(filePattern.target)
        .pipe(inject(
            gulp.src(filePattern.srcMatches, filePattern.options),
            jsImportsInjectOptions
        ))
        .pipe(gulp.dest(filePattern.dest))
})

gulp.task('server-js-imports', function() {
    var filePattern = filePatterns.serverJsImports;

    gulp.src(filePattern.target)
        .pipe(inject(
            gulp.src(filePattern.srcMatches, filePattern.options),
            jsImportsInjectOptions
        ))
        .pipe(gulp.dest(filePattern.dest))
})

gulp.task('scss-imports', function() {
    var filePattern = filePatterns.scssImports;

    gulp.src(filePattern.target)
        .pipe(inject(
            gulp.src(filePattern.srcMatches, filePattern.options),
            scssImportsInjectOptions
        ))
        .pipe(gulp.dest(filePattern.dest))
})

// convert hjson to hjson
gulp.task('i18n-transform', function() {
    var filePattern = filePatterns.i18nTransform;
    gulp.src(filePattern.srcMatches, filePattern.options)
        .pipe(tap(function(file) {
            var jsonContent = JSON.stringify(hjson.parse(file.contents.toString('utf8')));
            file.contents = new Buffer(jsonContent);
        }))
        .pipe(dest({ext: 'json'}))
        .pipe(gulp.dest(filePattern.dest))
})

gulp.task('build', ['pre-dev']);

gulp.task('pre-dev', [
    'js-imports',
    'server-js-imports',
    'scss-imports',
    'i18n-transform'
]);

gulp.task('watch', function() {
    gulp.watch(filePatterns.jsImports.srcMatches, filePatterns.jsImports.options, ['js-imports']);
    gulp.watch(filePatterns.scssImports.srcMatches, filePatterns.scssImports.options, ['scss-imports']);
    gulp.watch(filePatterns.i18nTransform.srcMatches, filePatterns.i18nTransform.options, ['i18n-transform']);
    gulp.watch(filePatterns.serverJsImports.srcMatches, filePatterns.serverJsImports.options, ['server-js-imports'])
})
