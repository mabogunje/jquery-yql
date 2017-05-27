/**
 * JQuery YQL
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

    var YQL = function(target, url, select, options, callback, oauth) {
        this.target = target;

        this.options = $.extend({
            host:'https://query.yahooapis.com/v1/public/yql',
            oauth: null,
            input: 'xml',
            output: 'json',
            url: url,
            resource: '',
            tables: select || '*',
            params: {},
            error: function(err) {
                error = err || 'No Data Retrieved';
                console.log(error);
            },
            onData: function() {},
            onSuccess: function(data) {
                console.trace();
                console.log(JSON.stringify(data));
                //$(target).append(data.results);
                //console.log(JSON.stringify(data.results));
            }
        }, options || {});

        this.options.url = [
            this.options.url,
            this.options.resource,
            '?',
            $.param(this.options.params)
        ].join('');

        this.callback = callback || this.options.onSuccess; 
    }

    YQL.INPUTS = ['html', 'xml', 'json', 'rss', 'atom'];
    YQL.OUTPUTS = ['xml', 'json'];

    YQL.prototype.load = function(callback) {
        var self = this;
        self.api = self.options.host;
        self.query = 'select {0} from {1} where url="{2}"';

        if(!$.inArray(self.options.input, self.INPUTS)) {
            self.options.input = 'xml';
        }

        if(!$.inArray(self.options.output, self.OUTPUTS)) {
            self.options.output = self.options.input;
        }
        
        if(Array.isArray(self.options.tables)) {
            self.options.tables = self.options.tables.join(', ').trim();
        }

        self.params = {
            q: self.query.format(self.options.tables, self.options.input, self.options.url),
            format: self.options.output,
            callback: self.callback,
            crossProduct: 'optimized',
        };

        self.request = {
            url: self.api + '?' + $.param(self.params),
            method: 'GET'
        };

        if(self.options.oauth) {
            self.options.oauth = $.extend({
                consumer: { key: null, secret: null },
                signature_method: 'HMAC-SHA1',
                hash_function: function(base_string, key) {
                    return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
                }, 
            }, {consumer: self.options.oauth} || {});

            $.ajax({
                url: self.request.url,
                type: self.request.method,
                data: OAuth(self.options.oauth).authorize(self.request),
                success: callback,
            });
        } else { 
            $.ajax({ 
                url: self.request.url, 
                type: self.request.method,
                success: callback, 
            });
        }
    };

    YQL.prototype.render = function() {
        var self = this;

        this.load(function(data) {
            try {
                self.feed = data.results;
                self.entries = null;
                return self.callback.call(self, data);
            } catch (e) {
                self.feed = null;
                self.entries = [];
                return self.options.error.call(self);
            }
        });
    }

    $.fn.yql = function(url, select, options, callback) {
        var test = new YQL(this, url, select, options, callback)
        test.load('test.callback');
        return this;
    };

    $('body').yql(
        'https://www.goodreads.com/review/list/',
        ['reviews.review.book.title', 'reviews.review.book.link', 'reviews.review.book.authors.author.name'],
        {
            resource: '64620959.xml',
            input: 'xml',
            params: {
                key: 'M15FipoFYVCIwLylLqznPw',
                shelf: 'to-read',
                sort: 'title',
                v: '2',
            }
        }   
    );
})(jQuery);

