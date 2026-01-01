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

### From Source

1. Clone or download this repository
2. Open the folder in VS Code
3. Run `npm install` to install dependencies
4. Run `npm run compile` to compile TypeScript
5. Press `F5` to open a new VS Code window with the extension loaded

### Package & Install

```bash
npm install -g vsce
vsce package
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

The extension uses regex patterns to detect methods in:
- **JavaScript/TypeScript**: `function name()`, `name()`, arrow functions
- **Java/C#**: `public/private/protected type name()`
- **Python**: `def name():`
- **C/C++**: Function declarations
- **Go**: `func name()`

## ⚙️ Configuration

Currently, the extension works out-of-the-box with no configuration needed.

Future versions may include:
- Custom method detection patterns
- Configurable warnings/errors
- Integration with version control
- Automatic test coverage verification

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Better language-specific parsing (using AST parsers)
- Git integration for automatic before/after detection
- Test coverage mapping
- Call graph analysis
- Refactoring suggestion features

## 📝 Known Limitations

- Method detection uses regex (not full AST parsing)
- Cannot verify runtime behavior (only static structure)
- Does not check if method calls were updated correctly
- Limited support for complex method signatures with generics

## 📄 License

MIT License - feel free to use and modify as needed.

## 🐛 Issues & Feedback

If you encounter issues or have suggestions, please report them through your issue tracker or feedback mechanism.

## 🎓 Tips for Best Results

1. **Keep originals**: Save a copy of your original file before refactoring
2. **Incremental verification**: Verify after each extraction step
3. **Review warnings**: Even if verification passes, check warnings for potential issues
4. **Manual review**: Use this tool as an aid, not a replacement for code review
5. **Test coverage**: Always run your test suite after refactoring

---

**Happy Refactoring! 🎉**
