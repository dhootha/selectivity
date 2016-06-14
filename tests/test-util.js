'use strict';

var _ = require('lodash');
var freshy = require('freshy');
var jsdom = require('jsdom');
var tape = require('tape');

module.exports = {

    /**
     * Wrapper to easily create unit tests that test Selectivity with jQuery.
     *
     * @param name Test name.
     * @param modules Array of Selectivity modules to test, e.g. ['base', 'single'].
     * @param options Optional options object. May contain the following properties:
     *                indexResource - Filename of the index resource (default: 'testcase.html').
     *                async - Set to true to indicate the test function is asynchronous and calls
     *                        done() itself.
     * @param fn The actual test function. Receives three arguments:
     *           test - The nodeunit test instance.
     *           $input - jQuery container for the '#selectivity-input' element defined in
     *                    resources/testcase.html.
     *           $ - jQuery instance.
     */
    createJQueryTest: function(name, modules, options, fn) {

        if (options instanceof Function) {
            fn = options;
            options = {};
        }

        var indexResource = options.indexResource || 'testcase.html';

        tape(name, function(test) {
            jsdom.env({
                file: 'tests/resources/' + indexResource,
                onload: function(window) {
                    var end = test.end.bind(test);
                    test.end = function() {
                        modules.forEach(function(module) {
                            freshy.unload('../src/' + module);
                        });
                        freshy.unload('../src/apis/jquery');
                        freshy.unload('../src/selectivity');
                        freshy.unload('jquery');

                        window.close();
                        end();
                    };

                    global.document = window.document;
                    global.window = window;

                    window.$ = window.jQuery = require('jquery');

                    require('../src/selectivity');
                    require('../src/apis/jquery');
                    modules.forEach(function(module) {
                        require('../src/' + module);
                    });

                    fn(test, window.$('#selectivity-input'), window.$);

                    if (!options.async) {
                        test.end();
                    }
                }
            });
        });
    },

    /**
     * Simulates an event on a given element.
     *
     * @param element The element to trigger the event on. May also be specified through a CSS
     *                selector.
     * @param eventName Name of the event to trigger.
     * @param eventData Optional properties to assign to the event.
     */
    simulateEvent: function(element, eventName, eventData) {

        var el = element;
        if (_.isString(el)) {
            el = document.querySelector(el);
        }
        if (!el) {
            throw new Error('No such element: ' + element);
        }

        eventData = eventData || {};
        var eventInterface = 'Event';
        if (eventName === 'blur' || eventName === 'focus') {
            eventData.bubbles = false;
            eventInterface = 'FocusEvent';
        } else if (eventName === 'click' || _.startsWith(eventName, 'mouse')) {
            eventData.bubbles = true;
            eventInterface = 'MouseEvent';
        } else if (_.startsWith(eventName, 'key')) {
            eventData.bubbles = true;
            eventInterface = 'KeyboardEvent';
        }

        var event = new window[eventInterface](eventName, eventData);
        el.dispatchEvent(event);
    }

};
