"use strict";

var _fs = _interopRequireDefault(require("fs"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _plist = _interopRequireDefault(require("plist"));

var _vscodeTextmate = require("vscode-textmate");

var _vscodeOniguruma = require("vscode-oniguruma");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var PRINT = true;

_fs["default"].promises.readFile("./syntaxes/sindarin.YAML-tmLanguage").then(function (value) {
  var tmLanguage = _jsYaml["default"].load(value.toString());

  var tmPlist = _plist["default"].build(tmLanguage);

  _fs["default"].promises.writeFile("./syntaxes/sindarin.tmLanguage", tmPlist).then(function () {
    if (PRINT) {
      print();
    }
  });
});

function print() {
  var wasmBin = _fs["default"].readFileSync('./node_modules/vscode-oniguruma/release/onig.wasm').buffer;

  var vscodeOnigurumaLib = (0, _vscodeOniguruma.loadWASM)(wasmBin).then(function () {
    return {
      createOnigScanner: function createOnigScanner(patterns) {
        return new _vscodeOniguruma.OnigScanner(patterns);
      },
      createOnigString: function createOnigString(s) {
        return new _vscodeOniguruma.OnigString(s);
      }
    };
  });
  var registry = new _vscodeTextmate.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: function () {
      var _loadGrammar = _asyncToGenerator(function* (scopeName) {
        if (scopeName === 'source.sindarin') {
          return _fs["default"].promises.readFile('./syntaxes/sindarin.tmLanguage').then(function (data) {
            return (0, _vscodeTextmate.parseRawGrammar)(data.toString());
          });
        } else {
          console.log("Unknown scope name: " + scopeName);
          return Promise.resolve(null);
        }
      });

      function loadGrammar(_x) {
        return _loadGrammar.apply(this, arguments);
      }

      return loadGrammar;
    }()
  });
  registry.loadGrammar('source.sindarin').then(function (grammar) {
    if (grammar) {
      var text = ["from \"test\" import { output };", "a = \"ok\";", "b = random();", "output(a + b);"];
      var ruleStack = _vscodeTextmate.INITIAL;

      var _loop = function _loop(i) {
        var line = text[i];
        var lineTokens = grammar.tokenizeLine(line, ruleStack);
        console.log(lineTokens.tokens.map(function (token) {
          return _extends({}, token, {
            value: line.substring(token.startIndex, token.endIndex)
          });
        })); // console.log(`\nTokenizing line: ${line}`);
        // for (let j = 0; j < lineTokens.tokens.length; j++) {
        //     const token = lineTokens.tokens[j];
        //     console.log(` - token from ${token.startIndex} to ${token.endIndex} ` +
        //       `(${line.substring(token.startIndex, token.endIndex)}) ` +
        //       `with scopes ${token.scopes.join(', ')}`
        //     );
        // }

        ruleStack = lineTokens.ruleStack;
      };

      for (var i = 0; i < text.length; i++) {
        _loop(i);
      }
    } else {
      console.log("Missing grammar");
    }
  });
}