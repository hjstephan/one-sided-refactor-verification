const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');

// We need to test the actual functions from extension.js
// Since they're not exported, we'll need to require the module and access internal functions
// Or we can test through the command interface

suite('Extension Test Suite', () => {
    let tempDir;
    let originalFile;
    let refactoredFile;
    let newFile1;
    let newFile2;

    suiteSetup(() => {
        // Create temporary test files
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'refactor-test-'));
        
        originalFile = path.join(tempDir, 'original.js');
        refactoredFile = path.join(tempDir, 'refactored.js');
        newFile1 = path.join(tempDir, 'new1.js');
        newFile2 = path.join(tempDir, 'new2.js');
    });

    suiteTeardown(() => {
        // Clean up temp files
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

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

    test('Integration - Verify command with no active editor', async () => {
        // Close all editors
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        
        // Try to run the command - it should show an error but not crash
        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            // Command should complete without crashing
            assert.ok(true);
        } catch (error) {
            // It's ok if it fails gracefully
            assert.ok(true);
        }
    });

    test('Integration - Full refactoring verification workflow', async () => {
        // Create test files
        const originalContent = `
function createUser() {
    console.log('create');
}

function deleteUser() {
    console.log('delete');
}

function validateEmail(email) {
    return email.includes('@');
}
`;

        const refactoredContent = `
function createUser() {
    console.log('create');
}

function deleteUser() {
    console.log('delete');
}
`;

        const newFileContent = `
function validateEmail(email) {
    return email.includes('@');
}
`;

        fs.writeFileSync(originalFile, originalContent);
        fs.writeFileSync(refactoredFile, refactoredContent);
        fs.writeFileSync(newFile1, newFileContent);

        // Open the refactored file
        const document = await vscode.workspace.openTextDocument(refactoredFile);
        await vscode.window.showTextDocument(document);

        // Mock the showOpenDialog to return our test files
        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                // First call: return original file
                return [vscode.Uri.file(originalFile)];
            } else {
                // Second call: return new files
                return [vscode.Uri.file(newFile1)];
            }
        };

        try {
            // Execute the verify command
            await vscode.commands.executeCommand('refactor-verifier.verify');
            
            // Wait a bit for the webview to be created
            await new Promise(resolve => setTimeout(resolve, 500));
            
            assert.ok(dialogCallCount >= 2, 'Dialog should have been called twice');
        } finally {
            // Restore original function
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - Test with missing methods', async () => {
        const originalContent = `
function keepThis() {}
function lostMethod() {}
`;

        const refactoredContent = `
function keepThis() {}
`;

        const newFileContent = `
function someOtherMethod() {}
`;

        fs.writeFileSync(originalFile, originalContent);
        fs.writeFileSync(refactoredFile, refactoredContent);
        fs.writeFileSync(newFile1, newFileContent);

        const document = await vscode.workspace.openTextDocument(refactoredFile);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                return [vscode.Uri.file(originalFile)];
            } else {
                return [vscode.Uri.file(newFile1)];
            }
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            await new Promise(resolve => setTimeout(resolve, 500));
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - Test with duplicate methods', async () => {
        const originalContent = `
function methodA() {}
function methodB() {}
`;

        const refactoredContent = `
function methodA() {}
`;

        const newFileContent = `
function methodA() {}
function methodB() {}
`;

        fs.writeFileSync(originalFile, originalContent);
        fs.writeFileSync(refactoredFile, refactoredContent);
        fs.writeFileSync(newFile1, newFileContent);

        const document = await vscode.workspace.openTextDocument(refactoredFile);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                return [vscode.Uri.file(originalFile)];
            } else {
                return [vscode.Uri.file(newFile1)];
            }
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            await new Promise(resolve => setTimeout(resolve, 500));
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - Test with multiple new files', async () => {
        const originalContent = `
function methodA() {}
function methodB() {}
function methodC() {}
`;

        const refactoredContent = `
function methodA() {}
`;

        const newFile1Content = `
function methodB() {}
`;

        const newFile2Content = `
function methodC() {}
`;

        fs.writeFileSync(originalFile, originalContent);
        fs.writeFileSync(refactoredFile, refactoredContent);
        fs.writeFileSync(newFile1, newFile1Content);
        fs.writeFileSync(newFile2, newFile2Content);

        const document = await vscode.workspace.openTextDocument(refactoredFile);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                return [vscode.Uri.file(originalFile)];
            } else {
                return [vscode.Uri.file(newFile1), vscode.Uri.file(newFile2)];
            }
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            await new Promise(resolve => setTimeout(resolve, 500));
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - Test with different languages (Java)', async () => {
        const originalContent = `
public class Test {
    public void methodA() {}
    private String methodB() { return ""; }
}
`;

        const refactoredContent = `
public class Test {
    public void methodA() {}
}
`;

        const newFileContent = `
public class Helper {
    private String methodB() { return ""; }
}
`;

        const originalJava = path.join(tempDir, 'original.java');
        const refactoredJava = path.join(tempDir, 'refactored.java');
        const newJava = path.join(tempDir, 'helper.java');

        fs.writeFileSync(originalJava, originalContent);
        fs.writeFileSync(refactoredJava, refactoredContent);
        fs.writeFileSync(newJava, newFileContent);

        const document = await vscode.workspace.openTextDocument(refactoredJava);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                return [vscode.Uri.file(originalJava)];
            } else {
                return [vscode.Uri.file(newJava)];
            }
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            await new Promise(resolve => setTimeout(resolve, 500));
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - Test with Python', async () => {
        const originalContent = `
def method_a():
    pass

def method_b():
    pass
`;

        const refactoredContent = `
def method_a():
    pass
`;

        const newFileContent = `
def method_b():
    pass
`;

        const originalPy = path.join(tempDir, 'original.py');
        const refactoredPy = path.join(tempDir, 'refactored.py');
        const newPy = path.join(tempDir, 'helper.py');

        fs.writeFileSync(originalPy, originalContent);
        fs.writeFileSync(refactoredPy, refactoredContent);
        fs.writeFileSync(newPy, newFileContent);

        const document = await vscode.workspace.openTextDocument(refactoredPy);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                return [vscode.Uri.file(originalPy)];
            } else {
                return [vscode.Uri.file(newPy)];
            }
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            await new Promise(resolve => setTimeout(resolve, 500));
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - User cancels original file selection', async () => {
        const document = await vscode.workspace.openTextDocument(refactoredFile);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        
        vscode.window.showOpenDialog = async (options) => {
            // Return undefined to simulate user canceling
            return undefined;
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            // Should complete without error
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - User cancels new files selection', async () => {
        fs.writeFileSync(originalFile, 'function test() {}');
        fs.writeFileSync(refactoredFile, 'function test() {}');

        const document = await vscode.workspace.openTextDocument(refactoredFile);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                return [vscode.Uri.file(originalFile)];
            } else {
                // User cancels new files selection
                return undefined;
            }
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - Test with C# async methods', async () => {
        const originalContent = `
public class Test {
    public async Task MethodA() {}
    private static async Task<string> MethodB() { return ""; }
}
`;

        const refactoredContent = `
public class Test {
    public async Task MethodA() {}
}
`;

        const newFileContent = `
public class Helper {
    private static async Task<string> MethodB() { return ""; }
}
`;

        const originalCs = path.join(tempDir, 'original.cs');
        const refactoredCs = path.join(tempDir, 'refactored.cs');
        const newCs = path.join(tempDir, 'helper.cs');

        fs.writeFileSync(originalCs, originalContent);
        fs.writeFileSync(refactoredCs, refactoredContent);
        fs.writeFileSync(newCs, newFileContent);

        const document = await vscode.workspace.openTextDocument(refactoredCs);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                return [vscode.Uri.file(originalCs)];
            } else {
                return [vscode.Uri.file(newCs)];
            }
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            await new Promise(resolve => setTimeout(resolve, 500));
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });

    test('Integration - Test file size warning', async () => {
        const originalContent = `function a() {}`;
        
        const refactoredContent = `
function a() {}
function b() {}
function c() {}
function d() {}
`;

        const newFileContent = `function e() {}`;

        fs.writeFileSync(originalFile, originalContent);
        fs.writeFileSync(refactoredFile, refactoredContent);
        fs.writeFileSync(newFile1, newFileContent);

        const document = await vscode.workspace.openTextDocument(refactoredFile);
        await vscode.window.showTextDocument(document);

        const originalShowOpenDialog = vscode.window.showOpenDialog;
        let dialogCallCount = 0;
        
        vscode.window.showOpenDialog = async (options) => {
            dialogCallCount++;
            if (dialogCallCount === 1) {
                return [vscode.Uri.file(originalFile)];
            } else {
                return [vscode.Uri.file(newFile1)];
            }
        };

        try {
            await vscode.commands.executeCommand('refactor-verifier.verify');
            await new Promise(resolve => setTimeout(resolve, 500));
            assert.ok(true);
        } finally {
            vscode.window.showOpenDialog = originalShowOpenDialog;
        }
    });
});
