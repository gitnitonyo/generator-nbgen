// eslint-disable
/**
 * supporting gulp tasks for automating file injections and conversions
 */
var gulp = require('gulp'),
    inject = require('gulp-inject'),
    replace = require('gulp-string-replace'),
    fs = require('fs'),
    appVersion = require('./package.json').version,
    hjson = require('gulp-hjson'),
    path = require('path')

var extend = require('underscore').extend;
var series = gulp.series;

var starttag = '// inject:imports:{{ext}}',
    endtag = '// endinject';

var jsClientImportsFile = 'imports/ui/imports.js';
var jsServerImportsFile = 'imports/api/imports.js';
var scssImportsFile = 'imports/ui/scss/_imports.scss';
var scssCommonImportsFile = 'imports/ui/scss/_components.scss';

var filePatterns = {
    jsImports: {
        target: jsClientImportsFile,
        srcMatches: [
            'imports/ui/app/**/*.js',
            'client/imports/ui/app/**/*.js',
        ],
        dest: 'imports/ui',
    },
    serverJsImports: {
        target: jsServerImportsFile,
        srcMatches: [
            'imports/api/**/*.js', 
            'server/imports/api/**/*.js',
            '!imports/api/imports.js'
        ],
        dest: 'imports/api',
    },
    scssImports: {
        target: scssImportsFile,
        srcMatches: [
            'imports/ui/app/**/*.scss', 
            'client/imports/ui/app/**/*.scss'
        ],
        dest: 'imports/ui/scss',
    },
    scssCommonImports: {
        target: scssCommonImportsFile,
        srcMatches: [
            'imports/ui/components/**/*.scss', 
            '!imports/ui/components/scss/**/*.scss'
        ],
        dest: 'imports/ui/scss',
    },
    i18nTransform: {
        srcMatches: [
            'imports/ui/i18n/**/*.hjson',
            'imports/ui/app/**/i18n/**/*.hjson',
        ],
        dest: 'public/i18n',
    }
}

var jsImportsInjectOptions = {
    relative: true,
    starttag: starttag,
    endtag: endtag,
    transform: function (filepath) {
        return `import './${filepath}';`
    }
}

var scssImportsInjectOptions = extend({}, jsImportsInjectOptions, {
    transform: function (filepath) {
        return `@import "${filepath}";`;
    }
})

// write the injection tags to generated files
gulp.task('inject-js-client-files', function (cb) {
    var contents = '// inject:imports:js' + '\n' +
        '// endinject';
    fs.writeFile(jsClientImportsFile, contents, cb);
});

gulp.task('inject-js-server-files', function (cb) {
    var contents = '// inject:imports:js' + '\n' +
        '// endinject';
    fs.writeFile(jsServerImportsFile, contents, cb);
});

gulp.task('inject-scss-client-files', function (cb) {
    var contents = '// inject:imports:scss' + '\n' +
        '// endinject';
    fs.writeFile(scssImportsFile, contents, cb);
});

gulp.task('inject-scss-common-files', function (cb) {
    var contents = '// inject:imports:scss' + '\n' +
        '// endinject';
    fs.writeFile(scssCommonImportsFile, contents, cb);
});



// sync version in package.json & mobile-config.js
gulp.task('version-sync', function () {
    return gulp.src('./mobile-config.js')
        .pipe(replace(/version\: \'(.+)\'/, 'version: ' + "'" + appVersion + "'"))
        .pipe(gulp.dest('./'));
});

gulp.task('js-imports', function () {
    var filePattern = filePatterns.jsImports;
    return gulp.src(filePattern.target)
        .pipe(inject(
            gulp.src(filePattern.srcMatches, filePattern.options),
            jsImportsInjectOptions
        ))
        .pipe(gulp.dest(filePattern.dest))
});

gulp.task('server-js-imports', function () {
    var filePattern = filePatterns.serverJsImports;

    return gulp.src(filePattern.target)
        .pipe(inject(
            gulp.src(filePattern.srcMatches, filePattern.options),
            jsImportsInjectOptions
        ))
        .pipe(gulp.dest(filePattern.dest))
})

gulp.task('scss-imports', function () {
    var filePattern = filePatterns.scssImports;

    return gulp.src(filePattern.target)
        .pipe(inject(
            gulp.src(filePattern.srcMatches, filePattern.options),
            scssImportsInjectOptions
        ))
        .pipe(gulp.dest(filePattern.dest))
})

gulp.task('scss-common-imports', function () {
    var filePattern = filePatterns.scssCommonImports;

    return gulp.src(filePattern.target)
        .pipe(inject(
            gulp.src(filePattern.srcMatches, filePattern.options),
            scssImportsInjectOptions
        ))
        .pipe(gulp.dest(filePattern.dest))
})

// convert hjson to hjson
gulp.task('i18n-transform', function () {
    var filePattern = filePatterns.i18nTransform;
    return gulp.src(filePattern.srcMatches, filePattern.options)
        .pipe(hjson({
            to: 'json'
        }))
        .pipe(gulp.dest((fileVinyl) => {
            let currentPath = path.dirname(fileVinyl.path)
            while (currentPath && path.basename(currentPath) !== 'i18n') {
                currentPath = path.dirname(currentPath)
            }
            fileVinyl.base = currentPath
            return filePattern.dest;
        }))
})

gulp.task('watch', function () {
    gulp.watch(filePatterns.jsImports.srcMatches, filePatterns.jsImports.options, series('js-imports'));
    gulp.watch(filePatterns.scssImports.srcMatches, filePatterns.scssImports.options, series('scss-imports'));
    gulp.watch(filePatterns.scssCommonImports.srcMatches, filePatterns.scssCommonImports.options, series('scss-common-imports'));
    gulp.watch(filePatterns.i18nTransform.srcMatches, filePatterns.i18nTransform.options, series('i18n-transform', 'js-imports'));
    gulp.watch(filePatterns.serverJsImports.srcMatches, filePatterns.serverJsImports.options, series('server-js-imports'))
})

gulp.task('generated-files', series(
    'inject-js-client-files', 
    'inject-scss-client-files', 
    'inject-scss-common-files', 
    'inject-js-server-files'
));

gulp.task('pre-dev', series(
    'generated-files',
    // 'version-sync',
    'js-imports',
    'server-js-imports',
    'scss-imports',
    'scss-common-imports',
    'i18n-transform'
));

gulp.task('build', series('pre-dev'));

gulp.task('default', series(
    'pre-dev',
    'watch'
))