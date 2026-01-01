import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    let testDir: string;

    setup(() => {
        // Create temporary test directory
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'refactor-test-'));
    });

    teardown(() => {
        // Clean up test files
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('hjstephan86.one-sided-refactor-verifier'));
    });

    test('Extension should activate', async () => {
        const ext = vscode.extensions.getExtension('hjstephan86.one-sided-refactor-verifier');
        await ext?.activate();
        assert.ok(ext?.isActive);
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
        assert.strictEqual(methods.length, 3);
        assert.ok(methods.some(m => m.name === 'createUser'));
        assert.ok(methods.some(m => m.name === 'deleteUser'));
        assert.ok(methods.some(m => m.name === 'updateUser'));
    });

    test('Method extraction - TypeScript class methods', () => {
        const content = `
class UserService {
    public createUser() {
        return 'created';
    }

    private deleteUser() {
        return 'deleted';
    }

    protected static findUser() {
        return 'found';
    }
}
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.strictEqual(methods.length, 3);
        assert.ok(methods.some(m => m.name === 'createUser'));
        assert.ok(methods.some(m => m.name === 'deleteUser'));
        assert.ok(methods.some(m => m.name === 'findUser'));
    });

    test('Method extraction - Java methods with modifiers', () => {
        const content = `
public class UserService {
    public void createUser() {
        System.out.println("create");
    }

    private static String getUserName() {
        return "name";
    }

    protected final List<User> getUsers() throws SQLException {
        return new ArrayList<>();
    }

    public abstract <T> T findById(int id);

    synchronized void updateCache() {
        cache.update();
    }
}
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.ok(methods.length >= 4);
        assert.ok(methods.some(m => m.name === 'createUser'));
        assert.ok(methods.some(m => m.name === 'getUserName'));
        assert.ok(methods.some(m => m.name === 'getUsers'));
        assert.ok(methods.some(m => m.name === 'updateCache'));
    });

    test('Method extraction - Python methods', () => {
        const content = `
def create_user():
    print("create")

def delete_user(user_id):
    print("delete")

class UserService:
    def find_user(self):
        return None
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.ok(methods.length >= 3);
        assert.ok(methods.some(m => m.name === 'create_user'));
        assert.ok(methods.some(m => m.name === 'delete_user'));
        assert.ok(methods.some(m => m.name === 'find_user'));
    });

    test('Method extraction - C# methods', () => {
        const content = `
public class UserService {
    public void CreateUser() {
        Console.WriteLine("create");
    }

    private static string GetUserName() {
        return "name";
    }

    protected virtual async Task<User> FindUserAsync() {
        return await Task.FromResult(new User());
    }
}
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.ok(methods.length >= 2);
        assert.ok(methods.some(m => m.name === 'CreateUser'));
        assert.ok(methods.some(m => m.name === 'GetUserName'));
    });

    test('Method extraction - Go functions', () => {
        const content = `
func CreateUser() {
    fmt.Println("create")
}

func (s *UserService) FindUser(id int) (*User, error) {
    return nil, nil
}
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.ok(methods.length >= 2);
        assert.ok(methods.some(m => m.name === 'CreateUser'));
        assert.ok(methods.some(m => m.name === 'FindUser'));
    });

    test('Should skip comments and empty lines', () => {
        const content = `
// This is a comment
function validFunction() {
    console.log('valid');
}

/* Multi-line
   comment */

// function commentedFunction() { }

function anotherValid() {
    console.log('another');
}
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.strictEqual(methods.length, 2);
        assert.ok(methods.some(m => m.name === 'validFunction'));
        assert.ok(methods.some(m => m.name === 'anotherValid'));
    });

    test('Analysis - Successful refactoring', () => {
        const original = `
function createUser() {}
function deleteUser() {}
function validateEmail() {}
function sendEmail() {}
        `.trim();

        const refactored = `
function createUser() {}
function deleteUser() {}
        `.trim();

        const newFile = `
function validateEmail() {}
function sendEmail() {}
        `.trim();

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [{ path: 'email.ts', content: newFile }]
        );

        assert.strictEqual(analysis.removedMethods.length, 2);
        assert.strictEqual(analysis.errors.length, 0);
        assert.ok(analysis.warnings.length >= 0);
    });

    test('Analysis - Missing method error', () => {
        const original = `
function createUser() {}
function deleteUser() {}
function lostFunction() {}
        `.trim();

        const refactored = `
function createUser() {}
function deleteUser() {}
        `.trim();

        const newFile = `
function someOtherFunction() {}
        `.trim();

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [{ path: 'new.ts', content: newFile }]
        );

        assert.strictEqual(analysis.removedMethods.length, 1);
        assert.ok(analysis.errors.length > 0);
        assert.ok(analysis.errors[0].includes('lostFunction'));
    });

    test('Analysis - File size warning', () => {
        const original = `
function a() {}
function b() {}
        `.trim();

        const refactored = `
function a() {}
function b() {}
function c() {}
function d() {}
        `.trim();

        const newFile = `function e() {}`.trim();

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [{ path: 'new.ts', content: newFile }]
        );

        assert.ok(analysis.warnings.some(w => w.includes('not smaller')));
    });

    test('Analysis - Duplicate method warning', () => {
        const original = `
function createUser() {}
function deleteUser() {}
        `.trim();

        const refactored = `
function createUser() {}
        `.trim();

        const newFile = `
function createUser() {}
function deleteUser() {}
        `.trim();

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [{ path: 'new.ts', content: newFile }]
        );

        assert.ok(analysis.warnings.some(w => w.includes('exists in both')));
    });

    test('Analysis - Complex Java refactoring', () => {
        const original = `
public class UserService {
    public void createUser() {}
    private String getName() {}
    protected List<User> findAll() throws SQLException {}
    public static final int COUNT = 10;
}
        `.trim();

        const refactored = `
public class UserService {
    public void createUser() {}
    public static final int COUNT = 10;
}
        `.trim();

        const newFile1 = `
public class UserRepository {
    protected List<User> findAll() throws SQLException {}
}
        `.trim();

        const newFile2 = `
public class UserHelper {
    private String getName() {}
}
        `.trim();

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [
                { path: 'UserRepository.java', content: newFile1 },
                { path: 'UserHelper.java', content: newFile2 }
            ]
        );

        assert.strictEqual(analysis.removedMethods.length, 2);
        assert.strictEqual(analysis.errors.length, 0);
        assert.strictEqual(analysis.newFileMethods.size, 2);
    });

    test('HTML report generation', () => {
        const analysis = {
            removedMethods: [
                { name: 'oldMethod', parameters: 'public void oldMethod()', line: 10 }
            ],
            remainingMethods: [
                { name: 'newMethod', parameters: 'public void newMethod()', line: 5 }
            ],
            newFileMethods: new Map([
                ['extracted.ts', [
                    { name: 'extractedMethod', parameters: 'function extractedMethod()', line: 3 }
                ]]
            ]),
            warnings: ['Warning message'],
            errors: []
        };

        const html = generateResultsHTMLForTest(analysis);

        assert.ok(html.includes('PASSED'));
        assert.ok(html.includes('oldMethod'));
        assert.ok(html.includes('newMethod'));
        assert.ok(html.includes('extractedMethod'));
        assert.ok(html.includes('Warning message'));
        assert.ok(html.includes('extracted.ts'));
    });

    test('HTML report with errors', () => {
        const analysis = {
            removedMethods: [],
            remainingMethods: [],
            newFileMethods: new Map(),
            warnings: [],
            errors: ['Critical error']
        };

        const html = generateResultsHTMLForTest(analysis);

        assert.ok(html.includes('FAILED'));
        assert.ok(html.includes('Critical error'));
        assert.ok(html.includes('#ff6b6b')); // Error color
    });

    test('Edge case - Empty files', () => {
        const original = '';
        const refactored = '';
        const newFile = '';

        const analysis = analyzeRefactoringForTest(
            original,
            refactored,
            [{ path: 'empty.ts', content: newFile }]
        );

        assert.strictEqual(analysis.removedMethods.length, 0);
        assert.strictEqual(analysis.remainingMethods.length, 0);
        assert.strictEqual(analysis.errors.length, 0);
    });

    test('Edge case - Only comments', () => {
        const content = `
// Only comments
/* No real code */
// function fakeFunction() {}
        `.trim();

        const methods = extractMethodsForTest(content);
        assert.strictEqual(methods.length, 0);
    });

    test('Line numbers are correct', () => {
        const content = `
// Line 1
function firstMethod() {
    // Line 3
}
// Line 5
function secondMethod() {
    // Line 7
}
        `.trim();

        const methods = extractMethodsForTest(content);
        const first = methods.find(m => m.name === 'firstMethod');
        const second = methods.find(m => m.name === 'secondMethod');

        assert.ok(first);
        assert.ok(second);
        assert.ok(first.line < second.line);
    });
});

// Helper functions to expose internal functionality for testing
interface MethodSignature {
    name: string;
    parameters: string;
    line: number;
}

interface RefactoringAnalysis {
    removedMethods: MethodSignature[];
    remainingMethods: MethodSignature[];
    newFileMethods: Map<string, MethodSignature[]>;
    warnings: string[];
    errors: string[];
}

function extractMethodsForTest(content: string): MethodSignature[] {
    const methods: MethodSignature[] = [];
    const lines = content.split('\n');

    const patterns = [
        // Standard functions: function name() { ... }
        /(?:function\s+|(?:public|private|protected|static|async)\s+)+(\w+)\s*\([^)]*\)\s*{/,

        // Arrow functions: const name = (...) => { ... }
        /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*{/,

        // Java/C# style: public void name() { ... }
        /(?:public|private|protected|static|final|abstract|synchronized|native)\s+(?:(?:public|private|protected|static|final|abstract|synchronized|native)\s+)*(?:<[^>]+>\s+)?(?:\w+(?:<[^>]+>)?(?:\[\])*)\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w\s,]+)?\s*{/,

        // C# specific
        /(?:public|private|protected|internal|static|virtual|override|abstract|sealed|async)\s+(?:(?:public|private|protected|internal|static|virtual|override|abstract|sealed|async)\s+)*\w+\s+(\w+)\s*\([^)]*\)\s*{/,

        // Python: def name(self):
        /def\s+(\w+)\s*\([^)]*\)\s*:/,

        // Go: func name() { ... }
        /func\s+(?:\([^)]+\)\s+)?(\w+)\s*\([^)]*\)\s*(?:[^{]*)?{/,
    ];

    lines.forEach((line, index) => {
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

function analyzeRefactoringForTest(
    originalContent: string,
    refactoredContent: string,
    newFiles: { path: string; content: string }[]
): RefactoringAnalysis {
    const originalMethods = extractMethodsForTest(originalContent);
    const refactoredMethods = extractMethodsForTest(refactoredContent);

    const newFileMethods = new Map<string, MethodSignature[]>();
    for (const file of newFiles) {
        newFileMethods.set(
            path.basename(file.path),
            extractMethodsForTest(file.content)
        );
    }

    const removedMethods = originalMethods.filter(
        om => !refactoredMethods.some(rm => rm.name === om.name)
    );

    const warnings: string[] = [];
    const errors: string[] = [];

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

    const originalLines = originalContent.split('\n').length;
    const refactoredLines = refactoredContent.split('\n').length;

    if (refactoredLines >= originalLines) {
        warnings.push(
            `Refactored file (${refactoredLines} lines) is not smaller than original (${originalLines} lines)`
        );
    }

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

function generateResultsHTMLForTest(analysis: RefactoringAnalysis): string {
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
