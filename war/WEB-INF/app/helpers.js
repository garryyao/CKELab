require('core/string');
include('ringo/markdown');
include('ringo/buffer');
include('ringo/skin');
var fileutils = require('ringo/fileutils');

exports.markdown_filter = function(content) {
    var markdown = new Markdown({
        openTag: function(tag, buffer) {
            if (tag === "pre") {
                buffer.append("<pre class='code'>");
            } else {
                this.super$openTag(tag, buffer);
            }
        }
    });
    return markdown.process(content);
};

exports.navigation_macro = function(tag, context) {
    return render('./skins/navigation.html', context);
};

// We override href and matchPath macros to operate relative to this demo app
// by using the rootPath property from our config module rather than the one
// from the request object.
// The rootPath property on the request object used by default implementations
// in ringo/skin/macros contains the root path of the  innermost app,
// which in our case may be the storage or jsdoc app.

exports.href_macro = function(tag) {
    var config = require('./config');
    var path = tag.parameters[0] || '';
    return config.rootPath
        + fileutils.resolveUri('/', config.appPath, path).slice(1);
};

exports.matchPath_macro = function(tag) {
    var config = require('./config');
    var path = tag.parameters[0];
    if (config && ('/' + config.appPath).match(path)) {
        return tag.parameters[1] || "match";
    }
};
