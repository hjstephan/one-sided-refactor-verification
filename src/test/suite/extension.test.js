const assert = require('assert');
const vscode = require('vscode');

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('hjstephan86.one-sided-refactor-verifier'));
    });

    test('Extension should activate', async () => {
        const ext = vscode.extensions.getExtension('hjstephan86.one-sided-refactor-verifier');
        if (ext) {
            await ext.activate();
            assert.ok(ext.isActive);
        }
    });

    test('Should register verify command', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('refactor-verifier.verify'));
    });

    test('Method extraction - JavaScript functions', () => {
        const content = `
function createUser() {
    console.log('create');
}

function deleteUser() {
    console.log('delete');
}

const updateUser = () => {
    console.log('update');
};
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.strictEqual(methods.length, 3, `Expected 3 methods but found ${methods.length}: ${methods.map(m => m.name).join(', ')}`);
        assert.ok(methods.some(m => m.name === 'createUser'));
        assert.ok(methods.some(m => m.name === 'deleteUser'));
        assert.ok(methods.some(m => m.name === 'updateUser'));
    });

    test('Method extraction - Java methods', () => {
        const content = `
public class UserService {
    public void createUser() {
        System.out.println("create");
    }

    private static String getUserName() {
        return "name";
    }
}
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.ok(methods.length >= 2);
        assert.ok(methods.some(m => m.name === 'createUser'));
        assert.ok(methods.some(m => m.name === 'getUserName'));
    });

    test('Method extraction - Python methods', () => {
        const content = `
def create_user():
    print("create")

def delete_user(user_id):
    print("delete")
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.ok(methods.length >= 2);
        assert.ok(methods.some(m => m.name === 'create_user'));
        assert.ok(methods.some(m => m.name === 'delete_user'));
    });

    test('Should skip comments', () => {
        const content = `
// This is a comment
function validFunction() {
    console.log('valid');
}
// function commentedFunction() { }
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.strictEqual(methods.length, 1);
        assert.ok(methods.some(m => m.name === 'validFunction'));
    });

    test('Analysis - Successful refactoring', () => {
        const original = `
function createUser() {}
function deleteUser() {}
function validateEmail() {}
        `.trim();

        const refactored = `
function createUser() {}
function deleteUser() {}
        `.trim();

        const newFile = `
function validateEmail() {}
        `.trim();

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [{ path: 'email.js', content: newFile }]
        );

        assert.strictEqual(analysis.removedMethods.length, 1);
        assert.strictEqual(analysis.errors.length, 0);
    });

    test('Analysis - Missing method error', () => {
        const original = `
function createUser() {}
function lostFunction() {}
        `.trim();

        const refactored = `
function createUser() {}
        `.trim();

        const newFile = `
function someOtherFunction() {}
        `.trim();

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [{ path: 'new.js', content: newFile }]
        );

        assert.strictEqual(analysis.removedMethods.length, 1);
        assert.ok(analysis.errors.length > 0);
        assert.ok(analysis.errors[0].includes('lostFunction'));
    });

    test('Analysis - File size warning', () => {
        const original = `function a() {}`;
        const refactored = `
function a() {}
function b() {}
function c() {}
        `;

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [{ path: 'new.js', content: 'function d() {}' }]
        );

        assert.ok(analysis.warnings.some(w => w.includes('not smaller')));
    });
});

function extractMethodsForTest(content) {
    const methods = [];
    const lines = content.split('\n');

    const patterns = [
        // JavaScript/TypeScript function declarations
        /(?:function\s+|(?:public|private|protected|static|async)\s+)*(\w+)\s*\([^)]*\)\s*{/,
        // Arrow functions: const/let/var name = () =>
        /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
        // Java methods
        /(?:public|private|protected|static|final|abstract|synchronized|native)\s+(?:(?:public|private|protected|static|final|abstract|synchronized|native)\s+)*(?:<[^>]+>\s+)?(?:\w+(?:<[^>]+>)?(?:\[\])*)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w\s,]+)?\s*{/,
        // Python
        /def\s+(\w+)\s*\([^)]*\)\s*:/,
    ];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || 
            trimmed.startsWith('*') || trimmed.length === 0) {
            return;
        }

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                methods.push({
                    name: match[1],
                    parameters: line.trim(),
                    line: index + 1
                });
                break;
            }
        }
    });

    return methods;
}

function analyzeRefactoringForTest(originalContent, refactoredContent, newFiles) {
    const path = require('path');
    const originalMethods = extractMethodsForTest(originalContent);
    const refactoredMethods = extractMethodsForTest(refactoredContent);

    const newFileMethods = new Map();
    for (const file of newFiles) {
        newFileMethods.set(
            path.basename(file.path),
            extractMethodsForTest(file.content)
        );
    }

    const removedMethods = originalMethods.filter(
        om => !refactoredMethods.some(rm => rm.name === om.name)
    );

    const warnings = [];
    const errors = [];

    for (const removed of removedMethods) {
        let found = false;
        for (const [, methods] of newFileMethods) {
            if (methods.some(m => m.name === removed.name)) {
                found = true;
                break;
            }
        }
        if (!found) {
            errors.push(`Method '${removed.name}' was removed but not found in any new file`);
        }
    }

    const originalLines = originalContent.split('\n').length;
    const refactoredLines = refactoredContent.split('\n').length;

    if (refactoredLines >= originalLines) {
        warnings.push(
            `Refactored file (${refactoredLines} lines) is not smaller than original (${originalLines} lines)`
        );
    }

    return {
        removedMethods,
        remainingMethods: refactoredMethods,
        newFileMethods,
        warnings,
        errors
    };
}
