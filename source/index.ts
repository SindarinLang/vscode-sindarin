import fs from "fs";
import yaml from "js-yaml";
import plist from "plist";
import { Registry, parseRawGrammar, INITIAL } from "vscode-textmate";
import { loadWASM, OnigScanner, OnigString } from "vscode-oniguruma";

type TmLanguageSetting = {
  scope: string;
  settings: {
    vsclassificationtype: string;
  };
}

type TmLanguage = {
  name: string;
  uuid: string;
  settings: TmLanguageSetting[];
}

const PRINT = true;

fs.promises.readFile("./syntaxes/sindarin.YAML-tmLanguage").then((value) => {
  const tmLanguage = yaml.load(value.toString()) as TmLanguage;
  const tmPlist = plist.build(tmLanguage);
  fs.promises.writeFile("./syntaxes/sindarin.tmLanguage", tmPlist).then(() => {
    if(PRINT) {
      print();
    }
  });
});

function print() {
  const wasmBin = fs.readFileSync('./node_modules/vscode-oniguruma/release/onig.wasm').buffer;
    const vscodeOnigurumaLib = loadWASM(wasmBin).then(() => {
      return {
        createOnigScanner(patterns: string[]) {
          return new OnigScanner(patterns);
        },
        createOnigString(s: string) {
          return new OnigString(s);
        }
      };
    });
    
    const registry = new Registry({
      onigLib: vscodeOnigurumaLib,
      loadGrammar: async (scopeName: string) => {
        if(scopeName === 'source.sindarin') {
          return fs.promises.readFile('./syntaxes/sindarin.tmLanguage').then((data) => {
            return parseRawGrammar(data.toString());
          });
        } else {
          console.log(`Unknown scope name: ${scopeName}`);
          return Promise.resolve(null);
        }
      }
    });
    
    registry.loadGrammar('source.sindarin').then((grammar) => {
      if(grammar) {
        const text = [
          `from "test" import { output };`,
          `a = "ok";`,
          `b = random();`,
          `output(a + b);`
        ];
        let ruleStack = INITIAL;
        for (let i = 0; i < text.length; i++) {
            const line = text[i];
            const lineTokens = grammar.tokenizeLine(line, ruleStack);
            console.log(lineTokens.tokens.map((token) => ({
              ...token,
              value: line.substring(token.startIndex, token.endIndex)
            })));
            // console.log(`\nTokenizing line: ${line}`);
            // for (let j = 0; j < lineTokens.tokens.length; j++) {
            //     const token = lineTokens.tokens[j];
            //     console.log(` - token from ${token.startIndex} to ${token.endIndex} ` +
            //       `(${line.substring(token.startIndex, token.endIndex)}) ` +
            //       `with scopes ${token.scopes.join(', ')}`
            //     );
            // }
            ruleStack = lineTokens.ruleStack;
        }
      } else {
        console.log("Missing grammar");
      }
    });
}
