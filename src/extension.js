// extension.js
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('One-Sided Refactor Verifier is now active');

    // Command to start verification
    const disposable = vscode.commands.registerCommand(
        'refactor-verifier.verify',
        async () => {
            await verifyRefactoring();
        }
    );

    context.subscriptions.push(disposable);
}

async function verifyRefactoring() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const currentFile = editor.document.uri.fsPath;

    // Ask user to select the original file version
    const originalFileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select Original File (before refactoring)',
        filters: {
            'Source files': ['ts', 'js', 'java', 'py', 'cs', 'cpp', 'c', 'go']
        }
    });

    if (!originalFileUri || originalFileUri.length === 0) {
        return;
    }

    // Ask user to select new files created during refactoring
    const newFilesUri = await vscode.window.showOpenDialog({
        canSelectMany: true,
        openLabel: 'Select New Files (created during refactoring)',
        filters: {
            'Source files': ['ts', 'js', 'java', 'py', 'cs', 'cpp', 'c', 'go']
        }
    });

    if (!newFilesUri || newFilesUri.length === 0) {
        vscode.window.showWarningMessage('No new files selected for verification');
        return;
    }

    // Perform analysis
    await performAnalysis(
        originalFileUri[0].fsPath,
        currentFile,
        newFilesUri.map(uri => uri.fsPath)
    );
}

async function performAnalysis(originalPath, refactoredPath, newFilePaths) {
    try {
        const originalContent = fs.readFileSync(originalPath, 'utf8');
        const refactoredContent = fs.readFileSync(refactoredPath, 'utf8');
        const newFilesContent = newFilePaths.map(p => ({
            path: p,
            content: fs.readFileSync(p, 'utf8')
        }));

        const analysis = analyzeRefactoring(
            originalContent,
            refactoredContent,
            newFilesContent
        );

        displayResults(analysis);
    } catch (error) {
        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
    }
}

function analyzeRefactoring(originalContent, refactoredContent, newFiles) {
    const originalMethods = extractMethods(originalContent);
    const refactoredMethods = extractMethods(refactoredContent);

    const newFileMethods = new Map();
    for (const file of newFiles) {
        newFileMethods.set(
            path.basename(file.path),
            extractMethods(file.content)
        );
    }

    const removedMethods = originalMethods.filter(
        om => !refactoredMethods.some(rm => rm.name === om.name)
    );

    const warnings = [];
    const errors = [];

    // Check if removed methods exist in new files
    for (const removed of removedMethods) {
        let found = false;
        for (const [_fileName, methods] of newFileMethods) {
            if (methods.some(m => m.name === removed.name)) {
                found = true;
                break;
            }
        }
        if (!found) {
            errors.push(
                `Method '${removed.name}' was removed but not found in any new file`
            );
        }
    }

    // Check for size reduction
    const originalLines = originalContent.split('\n').length;
    const refactoredLines = refactoredContent.split('\n').length;

    if (refactoredLines >= originalLines) {
        warnings.push(
            `Refactored file (${refactoredLines} lines) is not smaller than original (${originalLines} lines)`
        );
    }

    // Check for potential duplicates
    for (const [fileName, methods] of newFileMethods) {
        for (const method of methods) {
            if (refactoredMethods.some(m => m.name === method.name)) {
                warnings.push(
                    `Method '${method.name}' exists in both refactored file and ${fileName}`
                );
            }
        }
    }

    return {
        removedMethods,
        remainingMethods: refactoredMethods,
        newFileMethods,
        warnings,
        errors
    };
}

function extractMethods(content) {
    const methods = [];
    const lines = content.split('\n');

    // Regex patterns for different languages
    const patterns = [
        // JavaScript/TypeScript: function name() or name() or name = () =>
        /(?:function\s+|(?:public|private|protected|static|async)\s+)*(\w+)\s*\([^)]*\)\s*(?:{|=>)/,
        // Arrow functions: const/let/var name = () =>
        /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
        // Java: modifiers returnType methodName(params)
        /(?:public|private|protected|static|final|abstract|synchronized|native)\s+(?:(?:public|private|protected|static|final|abstract|synchronized|native)\s+)*(?:<[^>]+>\s+)?(?:\w+(?:<[^>]+>)?(?:\[\])*)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w\s,]+)?\s*{/,
        // C#: modifier type name()
        /(?:public|private|protected|internal|static|virtual|override|abstract|sealed|async)\s+(?:(?:public|private|protected|internal|static|virtual|override|abstract|sealed|async)\s+)*\w+\s+(\w+)\s*\([^)]*\)\s*{/,
        // Python: def name():
        /def\s+(\w+)\s*\([^)]*\)\s*:/,
        // C/C++: type name(params)
        /(?:static|inline|virtual|explicit)?\s*\w+(?:\s*\*|\s+)(\w+)\s*\([^)]*\)\s*(?:const)?\s*{/,
        // Go: func name() or func (receiver) name()
        /func\s+(?:\([^)]+\)\s+)?(\w+)\s*\([^)]*\)\s*(?:[^{]*)?{/,
    ];

    lines.forEach((line, index) => {
        // Skip comments and empty lines
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') ||
            trimmed.startsWith('*') || trimmed.startsWith('#') ||
            trimmed.length === 0) {
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

function displayResults(analysis) {
    const panel = vscode.window.createWebviewPanel(
        'refactoringResults',
        'Refactoring Verification Results',
        vscode.ViewColumn.Two,
        {}
    );

    panel.webview.html = generateResultsHTML(analysis);
}

function generateResultsHTML(analysis) {
    const hasErrors = analysis.errors.length > 0;
    const statusColor = hasErrors ? '#ff6b6b' : '#51cf66';
    const statusText = hasErrors ? 'FAILED' : 'PASSED';

    let newFilesHTML = '';
    for (const [fileName, methods] of analysis.newFileMethods) {
        newFilesHTML += `
            <div class="file-section">
                <h3>📄 ${fileName}</h3>
                <ul>
                    ${methods.map(m => `<li>${m.name} (line ${m.line})</li>`).join('')}
                </ul>
            </div>
        `;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    padding: 20px;
                    background-color: #1e1e1e;
                    color: #d4d4d4;
                }
                .status {
                    font-size: 24px;
                    font-weight: bold;
                    color: ${statusColor};
                    margin-bottom: 20px;
                }
                .section {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #252526;
                    border-radius: 5px;
                    border-left: 3px solid #007acc;
                }
                .error {
                    border-left-color: #ff6b6b;
                }
                .warning {
                    border-left-color: #ffa500;
                }
                .success {
                    border-left-color: #51cf66;
                }
                h2 {
                    color: #007acc;
                    margin-top: 0;
                }
                h3 {
                    color: #4ec9b0;
                }
                ul {
                    margin: 10px 0;
                }
                li {
                    margin: 5px 0;
                }
                .file-section {
                    margin: 15px 0;
                    padding: 10px;
                    background-color: #2d2d30;
                    border-radius: 3px;
                }
            </style>
        </head>
        <body>
            <h1>🔍 Refactoring Verification Results</h1>
            <div class="status">Status: ${statusText}</div>

            ${analysis.errors.length > 0 ? `
                <div class="section error">
                    <h2>❌ Errors</h2>
                    <ul>
                        ${analysis.errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${analysis.warnings.length > 0 ? `
                <div class="section warning">
                    <h2>⚠️ Warnings</h2>
                    <ul>
                        ${analysis.warnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="section">
                <h2>📊 Summary</h2>
                <ul>
                    <li><strong>Methods removed from original:</strong> ${analysis.removedMethods.length}</li>
                    <li><strong>Methods remaining:</strong> ${analysis.remainingMethods.length}</li>
                    <li><strong>New files analyzed:</strong> ${analysis.newFileMethods.size}</li>
                </ul>
            </div>

            <div class="section">
                <h2>🗑️ Removed Methods</h2>
                <ul>
                    ${analysis.removedMethods.map(m => `<li>${m.name} (was at line ${m.line})</li>`).join('')}
                </ul>
            </div>

            <div class="section success">
                <h2>✅ Remaining Methods in Refactored File</h2>
                <ul>
                    ${analysis.remainingMethods.map(m => `<li>${m.name} (line ${m.line})</li>`).join('')}
                </ul>
            </div>

            <div class="section">
                <h2>📁 New Files Content</h2>
                ${newFilesHTML}
            </div>
        </body>
        </html>
    `;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
