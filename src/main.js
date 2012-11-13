"use strict";

var Translator = require("./Translator.js"),
    Combiner = require("./Combiner.js"),
    Program = require("./Program.js"),
    translate = Translator.translate;
    
function translateFile(filename, options) {

    options || (options = {});
    
    return options.combine ?
        Combiner.combine(filename, options) :
        translate(Combiner.readFile(filename), options);
};

exports.translate = translate;
exports.translateFile = translateFile;

if (module === require.main)
    Program.run();