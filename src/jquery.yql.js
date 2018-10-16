/**
 * JQuery YQL
 * @description: An easy-to-use yql plugin for jquery with templating (based on jquery-rss by @sdepold)
 * @dependson: YQL, jQuery, CryptoJS, OAuth
 * @author: Damola Mabogunje
 * @version: 0.1
 */

// require('../libs');

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
            sort: null,
            offset: 0,
            limit: 10,
            layoutTemplate: '<ul>{entries}</ul>',
            entryTemplate: '<li>{entry}</li>',
            effect: 'show',
            tokens: {},
            error: function(err) {
                var error = err || new Error('No Data Retrieved');
                console.log(error);
                throw(error);
            },
            onData: function() {},
            onSuccess: function(data) {}
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
        self.query = 'select {0} from {1} where url="{2}" limit {3} offset {4}';

        if(!$.inArray(self.options.input, self.INPUTS)) {
            self.options.input = 'xml';
        }

        if(!$.inArray(self.options.output, self.OUTPUTS)) {
            self.options.output = self.options.input;
        }
        
        if($.type(self.options.tables) == 'string') {
            self.options.tables = self.options.tables.split(',');
        } else if (!$.isArray(self.options.tables)) {
            self.options.tables = '*';
        }

        self.params = {
            q: self.query.format(self.options.tables.join(','), self.options.input, self.options.url, self.options.limit, self.options.offset),
            format: self.options.output,
//            crossProduct: "optimized",
            callback: callback.name
        };

        if(this.options.sort) {
            if(typeof this.options.sort === 'string') {
                var sortStr = '|sort("{0}")'.format(this.options.sort);
                self.params.q += sortStr;
            }
        }

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
                } 
            }, {consumer: self.options.oauth} || {});

            $.ajax({
                url: self.request.url,
                method: self.request.method,
                data: OAuth(self.options.oauth).authorize(self.request),
                success: callback
            });
        } else {
            $.ajax({ 
                url: self.request.url, 
                method: self.request.method,
                success: callback
            });
        }

    };

    YQL.prototype.render = function() {
        var self = this;

        this.load(function(data) {
            try {
                self.feed = data.query.results
                self.entries = [];

                if($.isEmptyObject(self.feed)) {
                    var msg = 'No results returned from {0}. Please check your query';
                    throw new Error(msg.format(self.options.url));
                } else if(self.feed.hasOwnProperty('error')) {
                    throw new Error(self.feed.error);
                } else {
                    self.entries = self.entries.concat(self.feed[Object.keys(self.feed)[0]]);
                }
//                console.log(JSON.stringify(self.entries, null, 4));
            } catch (e) {
                self.feed = null;
                self.entries = [];
                return self.options.error.call(self, e.message);
            }

            var html = self.generateHTMLForEntries();
            self.target.append(html.layout);

            if(html.entries.length !== 0) {
                if($.isFunction(self.options.onData)) {
                    self.options.onData.call(self);
                }

                var container = $(html.layout).is('entries') ? html.layout : $('entries', html.layout);
                self.appendEntriesAndApplyEffects(container, html.entries);
            }
        });
    };

    YQL.prototype.appendEntriesAndApplyEffects = function(target, entries) {
        var self = this;

        $.each(entries, function(idx, entry) {
            var $html = self.wrapContent(entry);

            if(self.options.effect === 'show') {
                target.before($html);
            } else {
                $html.css({display: 'none'});
                target.before($html);
                self.applyEffect($html, self.options.effect);
            }
        });

        target.remove();
    }

    YQL.prototype.generateHTMLForEntries = function() {
        var self = this;
        var result = {entries: [], layout: null};

        $(this.entries).each(function() {
            var entry = this;
            var evaluatedString = self.evaluateStringForEntry(self.options.entryTemplate, entry);

            result.entries.push(evaluatedString);
        });

        if(!!this.options.entryTemplate) {
            result.layout = this.wrapContent(
                this.options.layoutTemplate.replace('{entries}', '<entries></entries>')
            );
        } else {
            result.layout = this.wrapContent('<div><entries></entries></div>');
        }

        return result;
    };

    YQL.prototype.applyEffect = function($element, effect, callback) {
        var self = this;

        switch(effect) {
            case 'slide':
                $element.slideDown('slow', callback);
                break;
            case 'slideFast':
                $element.slideDown(callback);
                break;
            case 'slideSynced':
                self.effectQueue.push({element: $element, effect: 'slide'});
                break;
            case 'slideFastSynced':
                self.effectQueue.push({element: $element, effect: 'slideFast'});
                break;
        }
    };

    YQL.prototype.executeEffectQueue = function(callback) {
        var self = this;

        var executeEffectQueueItem = function() {
            var item = self.effectQueue.pop();

            if(item) {
                self.applyEffect(item.element, item.effect, executeEffectQueueItem);
            } else if(callback) {
                callback();
            }
        };

        executeEffectQueueItem();
    };

    YQL.prototype.wrapContent = function(content) {
        if(($.trim(content).indexOf('<') !== 0)) {
            // this content has no markup, create a surrounding div
            return $('<div>' + content + '</div>');
        } else {
            return $(content);
        }
    };

    YQL.prototype.evaluateStringForEntry = function(string, entry) {
        var self = this;
        var result = string;

        $(string.match(/(\{.*?})/g)).each(function() {
            var token = this.toString();
            result = result.replace(token, self.getValueForToken(token, entry));
        });

        return result;
    };

    YQL.prototype.getTokenMap = function(entry) {
        if (!this.feedTokens) {
            this.feedTokens = this.entries.map(flattenObject);
        }

        return $.extend({
            feed: this.feedTokens,
            index: $.inArray(entry, this.entries),
            totalEntries: this.entries.length
        }, this.options.tokens);
    };

    YQL.prototype.getValueForToken = function(_token, entry) {
        var tokenMap = this.getTokenMap(entry);
        var token = _token.replace(/[\{\}]/g, '');
        var result = (tokenMap.feed[tokenMap.index][token]) ? tokenMap.feed[tokenMap.index][token] : tokenMap[token]; 
//        console.log(tokenMap.feed[tokenMap.index]);

        if(typeof result !== 'undefined') {
            return ((typeof result === 'function') ? result(entry, tokenMap) : result);
        } else {
            var error = new Error('Unknown token: ' + _token + ', url:' + this.options.url);
            this.options.error.call(self, error.message);
        }
    };

    $.fn.yql = function(url, select, options, callback) {
        new YQL(this, url, select, options, callback).render();
        return this;
    };
})(jQuery);


/* HELPER METHODS */

String.prototype.format = String.prototype.format || function () {
	'use strict';
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

Object.resolve = function (path, obj) {
	'use strict';
    return path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : undefined;
    }, obj || self);
};

function flattenObject(o) {
    return Object.keys(o).reduce(function(obj, prop) {
        var type = Object.prototype.toString.call(o[prop]);

        switch (type) {
            case '[object Object]':
                if(o[prop]) {
                    var flatObj = flattenObject(o[prop]);
                    
                    Object.keys(flatObj).forEach(function(key) {
                        obj[prop + '.' + key] = flatObj[key];
                    });
                }
                break;
            case '[object Array]':
                obj[prop] = o[prop].reduce(flattenArray, []);
                break;
            case '[object Date]':
                obj[prop] = o[prop].toString();
                break;
            default:
                obj[prop] = o[prop];
                break;
        }

        return obj;
    }, {});
};

function flattenArray(acc, val, idx) {
//    console.log(JSON.stringify(val, null, 4));
//    console.log(acc, idx, val);
    return Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(flattenObject(val));
};

/* ----- */
