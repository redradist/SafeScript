let assert = require("assert");
let fs = require("fs");
let path = require("path");
let babel = require("@babel/core");

function test(fixtureName) {
    it(fixtureName, function () {
        let fixturePath = path.resolve(__dirname, 'fixtures', fixtureName, 'fixture.js');
        let expectedPath = path.resolve(__dirname, 'fixtures', fixtureName, 'expected.js');
        let actual = babel.transformFileSync(fixturePath, {
            plugins: ['./dist'],
        }).code;
        let expected = fs.readFileSync(expectedPath, { encoding: 'utf8' });
        assert.strictEqual(actual + '\n', expected);
    });
}

[ 'function', 'class' ].map(test);
