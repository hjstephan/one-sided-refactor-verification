const { runTests } = require('@vscode/test-electron');
const path = require('path');

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        await runTests({
            version: 'stable',
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--disable-extensions', '--disable-gpu']
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
