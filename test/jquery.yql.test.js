require('../entry.js'); // Require jQuery and jQuery-YQL

var $ = jQuery,
    test = require('tape');

var setup = function() {
    var fixture = {
        element: $('<div>').appendTo($('body')),
        timeout: 3000,
        feed: 'http://xml-rss.de/xml/site-atom.xml',
        ajax: $.ajax,
        fakeAjax: function(content) {
            fixture.ajax = function(settings) {
                settings.success({
                    query: {
                        results: {
                            feed: {
                                entry: [{
                                    summary: content,
                                    link: content
                                }]
                            }
                        }
                    }
                });
            };
        }
    };

    return fixture;
}


var teardown = function(fixture) {
    if(typeof fixture.ajax === 'function') {
        $.ajax = fixture.ajax;
        fixture.ajax = null;
        console.log('teardown complete');
        assert.end();
        t.end();
    }
};

test('jquery.yql', function (t) {
    t.test('renders an unordered list', function(assert) {
        assert.plan(1);

        var fixture = setup(),
            $container = fixture.element,
            expected = /<ul><li>foo<\/li><\/ul>/;

        $container.yql(fixture.feed, 'subtitle', {
            limit: 1,
            entryTemplate: [
                "<li>",
                "{subtitle}",
                "</li>"
                ].join('')
        }, function() {
            var content = container.html().replace(/\n/g, '');
            console.log('YQL returned: ' + content);
            assert.true(expected.test(content));
//            teardown(fixture);
            assert.end();
            t.end();
        });
    });
});
