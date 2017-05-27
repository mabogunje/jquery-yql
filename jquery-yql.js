/**
 * JQuery YQL GET
 * @description: Lightweight script for performing simple YQL GET requests via JQuery, and displaying formatted results'
 * @dependson: YQL, jQuery, CryptoJS, OAuth
 * @author: Damola Mabogunje
 * @version: 0.1
 */

String.prototype.format = String.prototype.format ||
function () {
	"use strict";
	var str = this.toString();
	if (arguments.length) {
	    var t = typeof arguments[0];
	    var key;
	    var args = ("string" === t || "number" === t) ?
	        Array.prototype.slice.call(arguments)
	        : arguments[0];

	    for (key in args) {
	        str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
	    }
	}

	return str;
};

(function($) {
    'use strict';

    var YQL = function(target, url, select, mode, options, callback) {
        this.api = 'https://query.yahooapis.com/v1/public/yql';
        this.modes = ['html', 'xml', 'json', 'rss', 'atom'];

        this.target = target;
        this.url = url;

        this.options = $.extend({
            resource: '',
            datasource: '',
            params: {},
        }, options || {});
    }

    $.fn.yql = function(url, select, options, callback) {
        new YQL(this, url, select, mode, options, callback)
        alert('Hello');
        return this;
    };
})(jQuery);
