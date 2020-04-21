import angular from 'angular';

import nbgenApp from '.';

angular.module(nbgenApp)
    .factory('Language', function ($http, $translate, LANGUAGES) {
        'ngInject';

        return {
            getCurrent: function () {
                let language = $translate.storage().get('NG_TRANSLATE_LANG_KEY');

                if (angular.isUndefined(language)) {
                    language = 'en';
                }

                return Promise.resolve(language)
            },
            getAll: function () {
                return Promise.resolve(LANGUAGES)
            }
        };
    })

/*
 Languages codes are ISO_639-1 codes, see http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 They are written in English to avoid character encoding issues (not a perfect solution)
 */
    .constant('LANGUAGES', [
        'en', 'ms', 'zh-tw',
        //nbGenerator will add new languages here
    ]
);
