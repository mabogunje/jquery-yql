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
                var error = err || 'No Data Retrieved';
                console.log(error);
            },
            onData: function() {},
            onSuccess: function(data) {
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
    YQL.HTML_TAGS = ['doctype', 'html', 'head', 'title', 'base', 'link', 'meta', 'style', 'script', 'noscript',
        'body', 'article', 'nav', 'aside', 'section', 'header', 'footer', 'h1-h6', 'hgroup', 'address',
        'p', 'hr', 'pre', 'blockquote', 'ol', 'ul', 'li', 'dl', 'dt', 'dd', 'figure', 'figcaption',
        'div', 'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'col', 'colgroup',
        'form', 'fieldset', 'legend', 'label', 'input', 'button', 'select', 'datalist', 'optgroup',
        'option', 'textarea', 'keygen', 'output', 'progress', 'meter', 'details', 'summary', 'command',
        'menu', 'del', 'ins', 'img', 'iframe', 'embed', 'object', 'param', 'video', 'audio', 'source',
        'canvas', 'track', 'map', 'area', 'a', 'em', 'strong', 'i', 'b', 'u', 's', 'small', 'abbr', 'q',
        'cite', 'dfn', 'sub', 'sup', 'time', 'code', 'kbd', 'samp', 'var', 'mark', 'bdi', 'bdo', 'ruby',
        'rt', 'rp', 'span', 'br', 'wbr'
    ];
         

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
            q: self.query.format(self.options.tables, self.options.input, self.options.url, self.options.limit, self.options.offset),
            format: self.options.output,
            callback: callback,
            crossProduct: 'optimized',
        };

        self.request = {
            url: self.api + '?' + $.param(self.params),
            method: 'GET'
        };

        console.log(this.request.url);
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
                method: self.request.method,
                data: OAuth(self.options.oauth).authorize(self.request),
            });
        } else {
            $.ajax({ 
                url: self.request.url, 
                method: self.request.method,
            });
        }
    };

    YQL.prototype.render = function() {
        var self = this;

        this.load(function(data) {
            try {
                console.log(data);
                self.payload = data;
                self.entries = data;
            } catch (e) {
                self.payload = null;
                self.entries = [];
                return self.options.error.call(self, e.message);
            }
        });
    }

    $.fn.yql = function(url, select, options, callback) {
        new YQL(this, url, select, options, callback).render();
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
                per_page: 5,
                v: '2',
            }
        },
    );
})(jQuery);

