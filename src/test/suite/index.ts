import { glob } from 'glob';
import Mocha from 'mocha'; // Change from * as Mocha
import * as path from 'path';

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });

    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((resolve, reject) => {
        // glob now returns a Promise<string[]>
        glob('**/**.test.js', { cwd: testsRoot })
            .then(files => {
                files.forEach((f: string) => {
                    mocha.addFile(path.resolve(testsRoot, f));
                });

                try {
                    // Run the mocha test
                    mocha.run((failures: number) => {
                        if (failures > 0) {
                            reject(new Error(`${failures} tests failed.`));
                        } else {
                            resolve();
                        }
                    });
                } catch (err) {
                    console.error(err);
                    reject(err);
                }
            })
            .catch(err => {
                reject(err);
            });
    });
}
