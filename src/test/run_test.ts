import { runTests } from '@vscode/test-electron';
import * as path from 'path';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // Changed from '1.105.0' to 'stable' to always use the latest VS Code version
        await runTests({
            version: 'stable',
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-extensions'
            ]
        });
    } catch (_err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
