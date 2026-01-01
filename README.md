# One-Sided Refactor Verifier

A Visual Studio Code extension that helps verify refactorings where code is extracted from one file into new files. This extension analyzes the refactoring to ensure that extracted methods are properly moved and no functionality is lost.

## 🎯 Purpose

When refactoring code by extracting classes or methods from a large file into new, smaller files, this extension helps you verify that:
- All removed methods from the original file exist in the new files
- The original file has actually become smaller
- No methods were accidentally duplicated or lost
- The refactoring maintains code integrity

## ✨ Features

- **Method Extraction Verification**: Automatically detects methods removed from the original file
- **Multi-File Analysis**: Checks that extracted methods exist in the new files
- **Visual Report**: Provides a detailed HTML report with color-coded results
- **Multi-Language Support**: Works with JavaScript, TypeScript, Java, Python, C#, C++, Go
- **Warnings & Errors**: Clear identification of potential issues
- **Size Verification**: Ensures the refactored file is actually smaller

## 📦 Installation

### From VSIX File

If you have the `.vsix` file:

```bash
code --install-extension one-sided-refactor-verifier-1.0.0.vsix
```

Or in VS Code:
1. Open Extensions view (`Ctrl+Shift+X`)
2. Click the `...` menu at the top
3. Select "Install from VSIX..."
4. Choose the `.vsix` file

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/hjstephan/one-sided-refactor-verifier.git
   cd one-sided-refactor-verifier
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile TypeScript:
   ```bash
   npm run compile
   ```

4. Test in development mode:
   - Open the folder in VS Code
   - Press `F5` to open a new VS Code window with the extension loaded

### Build VSIX Package

To create your own `.vsix` package:

```bash
# Install dependencies (includes vsce)
npm install

# Compile the extension
npm run compile

# Create the VSIX package
npx vsce package

# Install the created package
code --install-extension one-sided-refactor-verifier-1.0.0.vsix
```

## 🚀 Usage

### Step-by-Step Process

1. **Complete Your Refactoring**
   - Start with your original large file
   - Extract code into new files
   - Keep a copy of the original file for comparison

2. **Run Verification**
   - Open the refactored file in VS Code
   - Use one of these methods:
     - Press `Ctrl+Shift+R V` (or `Cmd+Shift+R V` on Mac)
     - Right-click in editor → "Verify One-Sided Refactoring"
     - Command Palette (`Ctrl+Shift+P`) → "Verify One-Sided Refactoring"

3. **Select Files**
   - First, select the **original file** (before refactoring)
   - Then, select all **new files** created during refactoring

4. **Review Results**
   - A detailed report opens showing:
     - ✅ Pass/Fail status
     - ❌ Errors (missing methods, lost functionality)
     - ⚠️ Warnings (potential issues)
     - 📊 Summary statistics
     - 🗑️ List of removed methods
     - ✅ Remaining methods in refactored file
     - 📁 Content of new files

## 📋 Example Scenario

### Before Refactoring
**UserService.ts** (500 lines)
```typescript
class UserService {
  createUser() { ... }
  deleteUser() { ... }
  validateEmail() { ... }
  validatePassword() { ... }
  sendEmail() { ... }
  formatEmail() { ... }
}
```

### After Refactoring
**UserService.ts** (200 lines)
```typescript
class UserService {
  createUser() { ... }
  deleteUser() { ... }
}
```

**EmailValidator.ts** (new file)
```typescript
class EmailValidator {
  validateEmail() { ... }
  formatEmail() { ... }
}
```

**PasswordValidator.ts** (new file)
```typescript
class PasswordValidator {
  validatePassword() { ... }
}
```

**EmailService.ts** (new file)
```typescript
class EmailService {
  sendEmail() { ... }
}
```

Run the verifier, and it will confirm all extracted methods are accounted for!

## 🔍 What the Extension Checks

### ✅ Success Criteria
- All methods removed from original file exist in new files
- Refactored file is smaller than original
- No duplicate methods between refactored and new files

### ❌ Error Conditions
- Method removed but not found in any new file
- Missing functionality

### ⚠️ Warning Conditions
- Refactored file is not smaller than original
- Method exists in both refactored file and new files (potential duplication)

## 🛠️ Supported Languages

The extension uses enhanced regex patterns to detect methods in:
- **JavaScript/TypeScript**: `function name()`, `name()`, arrow functions, class methods
- **Java**: Full support with modifiers like `public`, `private`, `protected`, `static`, `final`, `abstract`, `synchronized`, generic types, and `throws` clauses
- **C#**: `public/private/protected/internal`, `static`, `virtual`, `override`, `abstract`, `sealed`, `async`
- **Python**: `def name():`
- **C/C++**: Function declarations with modifiers
- **Go**: `func name()` and methods with receivers

### Java Support Details

The extension properly handles Java methods with:
- Access modifiers: `public`, `private`, `protected`
- Non-access modifiers: `static`, `final`, `abstract`, `synchronized`, `native`
- Generic return types: `<T>`, `List<String>`, etc.
- Array return types: `String[]`, `int[][]`
- Exception declarations: `throws IOException, SQLException`
- Multiple modifiers: `public static final`

**Example Java methods detected:**
```java
public void createUser() { }
private static String getUserName() { }
protected final List<User> getUsers() throws SQLException { }
public abstract <T> T findById(int id);
synchronized void updateCache() { }
```

## ⚙️ Configuration

Currently, the extension works out-of-the-box with no configuration needed.

Future versions may include:
- Custom method detection patterns
- Configurable warnings/errors
- Integration with version control
- Automatic test coverage verification

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

1. Fork the repository: https://github.com/hjstephan/one-sided-refactor-verifier
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to your branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Areas for Improvement
- Better language-specific parsing (using AST parsers)
- Git integration for automatic before/after detection
- Test coverage mapping
- Call graph analysis
- Refactoring suggestion features
- Support for more programming languages

## 📝 Known Limitations

- Method detection uses regex (not full AST parsing)
- Cannot verify runtime behavior (only static structure)
- Does not check if method calls were updated correctly
- Limited support for complex method signatures with generics

## 📄 License

MIT License

Copyright (c) 2026 hjstephan86

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## 🐛 Issues & Feedback

Found a bug or have a suggestion? Please report it on GitHub:

**GitHub Issues**: https://github.com/hjstephan/one-sided-refactor-verifier/issues

When reporting issues, please include:
- VS Code version
- Extension version
- Programming language being analyzed
- Sample code that reproduces the issue (if applicable)
- Expected vs actual behavior

Feature requests and pull requests are always welcome!

## 🎓 Tips for Best Results

1. **Keep originals**: Save a copy of your original file before refactoring
2. **Incremental verification**: Verify after each extraction step
3. **Review warnings**: Even if verification passes, check warnings for potential issues
4. **Manual review**: Use this tool as an aid, not a replacement for code review
5. **Test coverage**: Always run your test suite after refactoring

---

**Happy Refactoring! 🎉**
