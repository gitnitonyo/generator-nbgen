import angular from 'angular';

import config from './nbgenCalendarConfig.js';
import template from './nbgenCalendar.html';
import moduleName from '..';

import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'

import '@fullcalendar/core/main.css'
import '@fullcalendar/daygrid/main.css'
import '@fullcalendar/timegrid/main.css'
import '@fullcalendar/list/main.css'

import _ from 'underscore'

const name = 'nbgenCalendar';
const controllerAs = 'calendarCtrl';

class NbgenCalendarCtrl {
    constructor($element) {
        'ngInject';

        this.$config = config
        this.$element = $element
    }

    $onInit() {
        // all controllers have been initialized
        this.$calendarContainer = this.$element.find('.calendar-container').get(0);
        const _this = this;
        const calendarBaseOptions = {
            plugins: [ 
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin
            ],
            dateClick(info) {
                _this.$calendar.gotoDate(info.date);
                _this.dateClick({$info: info});
            },
            events: _this.events,
        }
        const calendarOptions = _.extend({}, calendarBaseOptions, _this.options)
        this.$calendar = new Calendar(this.$calendarContainer, calendarOptions)        
    }

    $onDestroy() {
        // scope is about to be destroyed; do cleanup
        this.$calendar.destroy();
    }

    $postLink() {
        // all elements have been linked
        
        this.$calendar.render()
    }

    $onChanges(changesObj) {    // eslint-disable-line

    }

    $doCheck() {

    }
}

angular.module(moduleName)
    .component(name, {
        template,
        controllerAs: controllerAs,
        controller: NbgenCalendarCtrl,
        bindings: {
            $calendar: '=calendar',
            dateClick: '&',
            events: '=',
            options: '<',
        }
    })
