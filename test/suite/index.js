const { glob } = require('glob');
const Mocha = require('mocha');
const path = require('path');

async function run() {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000
    });

    const testsRoot = path.resolve(__dirname, '..');

    try {
        const files = await glob('**/**.test.js', { cwd: testsRoot });

        files.forEach(f => {
            mocha.addFile(path.resolve(testsRoot, f));
        });

        return new Promise((resolve, reject) => {
            mocha.run(failures => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error('Error loading test files:', err);
        throw err;
    }
}

module.exports = { run };
