import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Lock, Edit3, Save, X } from 'lucide-react';

const Terminal = ({
  fileSystem = {},
  saveFile = () => {},
  createDirectory = () => {},
  deleteFile = () => {},
  currentUser,
  onOpenFile = () => {},
  reloadFileSystem = () => {},
  updateTheme = () => {},
  updateDesktopLayout = () => {}
}) => {
  const [history, setHistory] = useState([
    { type: 'system', content: 'Welcome to AirOS Terminal v2.0' },
    { type: 'system', content: 'Type "help" for available commands' }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [sudoMode, setSudoMode] = useState(false);
  const [awaitingPassword, setAwaitingPassword] = useState(false);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [passwordAttempts, setPasswordAttempts] = useState(0);

  // Breeze editor state
  const [editorMode, setEditorMode] = useState(false);
  const [editorFile, setEditorFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorCursorLine, setEditorCursorLine] = useState(0);
  const [editorModified, setEditorModified] = useState(false);

  const inputRef = useRef(null);
  const terminalRef = useRef(null);
  const editorTextRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (editorMode && editorTextRef.current) {
      editorTextRef.current.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [editorMode]);

  const addToHistory = (type, content) => {
    setHistory(prev => [...prev, { type, content }]);
  };

  const getPrompt = () => {
    const user = currentUser?.email?.split('@')[0] || 'user';
    const prompt = sudoMode ? '#' : '$';
    return `${user}@airos:${currentDirectory}${prompt}`;
  };

  const resolvePath = (path) => {
    if (!path) return currentDirectory;
    if (path.startsWith('/')) return path;
    if (path === '..') {
      if (currentDirectory === '/') return '/';
      const parts = currentDirectory.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/');
    }
    if (path === '.') return currentDirectory;
    if (currentDirectory === '/') return `/${path}`;
    return `${currentDirectory}/${path}`;
  };

  const copyFile = async (sourcePath, destPath) => {
    const source = fileSystem[sourcePath];
    if (!source) return false;
    
    if (source.type === 'directory') {
      await createDirectory(
        destPath.substring(0, destPath.lastIndexOf('/')), 
        destPath.substring(destPath.lastIndexOf('/') + 1)
      );
      const children = source.children || [];
      for (const child of children) {
        const childSourcePath = `${sourcePath}/${child}`;
        const childDestPath = `${destPath}/${child}`;
        await copyFile(childSourcePath, childDestPath);
      }
    } else {
      await saveFile(destPath, source.content || '', 'file');
    }
    return true;
  };

  // Breeze editor functions
  const openBreezeEditor = (filePath) => {
    const file = fileSystem[filePath];
    if (!file) {
      addToHistory('error', `breeze: ${filePath}: No such file`);
      return;
    }
    if (file.type === 'directory') {
      addToHistory('error', `breeze: ${filePath}: Is a directory`);
      return;
    }

    const content = file.content || '';
    if (content.startsWith('data:')) {
      addToHistory('error', 'breeze: cannot edit binary files');
      return;
    }

    setEditorFile(filePath);
    setEditorContent(content);
    setEditorCursorLine(0);
    setEditorModified(false);
    setEditorMode(true);
  };

  const saveBreezeFile = async () => {
    if (editorFile) {
      await saveFile(editorFile, editorContent, 'file');
      setEditorModified(false);
      addToHistory('system', `Saved ${editorFile}`);
    }
  };

  const closeBreezeEditor = async (save = false) => {
    if (save && editorModified) {
      await saveBreezeFile();
    }
    setEditorMode(false);
    setEditorFile(null);
    setEditorContent('');
    setEditorModified(false);
  };

  // Enhanced tab completion
  const handleTabCompletion = () => {
    const parts = currentInput.split(' ');
    const commandPart = parts[0];
    const lastPart = parts[parts.length - 1];

    // Command completion
    if (parts.length === 1) {
      const commands = [
        'ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'rm', 'mv', 'cp',
        'echo', 'open', 'tree', 'find', 'grep', 'whoami', 'date', 'calc',
        'clear', 'help', 'sudo', 'breeze', 'npm', 'kill', 'wc', 'theme', 'layout'
      ];
      const matches = commands.filter(cmd => cmd.startsWith(lastPart));
      
      if (matches.length === 1) {
        setCurrentInput(matches[0] + ' ');
      } else if (matches.length > 1) {
        addToHistory('output', matches.join('  '));
      }
      return;
    }

    // File/directory completion
    const pathPart = lastPart.includes('/') 
      ? lastPart.substring(0, lastPart.lastIndexOf('/') + 1)
      : '';
    const namePart = lastPart.includes('/')
      ? lastPart.substring(lastPart.lastIndexOf('/') + 1)
      : lastPart;

    const searchDir = pathPart 
      ? resolvePath(pathPart)
      : currentDirectory;

    if (fileSystem[searchDir]?.type === 'directory') {
      const items = fileSystem[searchDir].children || [];
      const matches = items.filter(item => item.startsWith(namePart));

      if (matches.length === 1) {
        const fullPath = searchDir === '/' ? `/${matches[0]}` : `${searchDir}/${matches[0]}`;
        const isDir = fileSystem[fullPath]?.type === 'directory';
        parts[parts.length - 1] = pathPart + matches[0] + (isDir ? '/' : '');
        setCurrentInput(parts.join(' '));
      } else if (matches.length > 1) {
        addToHistory('output', matches.join('  '));
      }
    }
  };

  const executeCommandInternal = async (cmd) => {
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Check for app init commands
    const appInitPattern = /^(\w+)\s+init$/i;
    const initMatch = cmd.match(appInitPattern);
    if (initMatch) {
      const appName = initMatch[1].toLowerCase();
      const validApps = ['react', 'vue', 'svelte', 'node', 'express', 'vite', 'next'];
      
      if (validApps.includes(appName)) {
        addToHistory('system', `Initializing ${appName} project...`);
        addToHistory('output', `Creating ${appName} project structure in ${currentDirectory}`);
        
        // Create basic project structure
        const projectDir = currentDirectory === '/' 
          ? `/${appName}-project`
          : `${currentDirectory}/${appName}-project`;
        
        await createDirectory(currentDirectory, `${appName}-project`);
        await createDirectory(projectDir, 'src');
        await saveFile(`${projectDir}/package.json`, 
          JSON.stringify({ name: `${appName}-project`, version: '1.0.0' }, null, 2),
          'file'
        );
        await saveFile(`${projectDir}/README.md`, `# ${appName} Project\n\nInitialized with AirOS Terminal`, 'file');
        
        addToHistory('system', `✓ ${appName} project initialized successfully`);
        reloadFileSystem?.();
        return;
      } else {
        addToHistory('error', `${appName}: unknown application. Try: react, vue, svelte, node, express, vite, next`);
        return;
      }
    }

    switch (command) {
      case 'breeze':
        if (!args[0]) {
          addToHistory('error', 'breeze: missing file operand. Usage: breeze <file>');
        } else {
          const filePath = resolvePath(args[0]);
          
          // Create file if it doesn't exist
          if (!fileSystem[filePath]) {
            await saveFile(filePath, '', 'file');
            reloadFileSystem?.();
            // Wait a bit for fileSystem to update
            setTimeout(() => openBreezeEditor(filePath), 100);
          } else {
            openBreezeEditor(filePath);
          }
        }
        break;

      case 'theme':
        if (!sudoMode) {
          addToHistory('error', 'Permission denied. Use: sudo theme <name>');
        } else if (!args[0]) {
          addToHistory('error', 'theme: missing theme name. Available: default, sunset, scorpio, dragonfruit, ocean, volcanic, lavender');
        } else {
          const themes = ['default', 'sunset', 'scorpio', 'dragonfruit', 'ocean', 'volcanic', 'lavender'];
          if (themes.includes(args[0])) {
            updateTheme(args[0]);
            addToHistory('system', `Theme changed to: ${args[0]}`);
          } else {
            addToHistory('error', `theme: unknown theme '${args[0]}'`);
          }
        }
        break;

      case 'layout':
        if (!sudoMode) {
          addToHistory('error', 'Permission denied. Use: sudo layout <type>');
        } else if (!args[0]) {
          addToHistory('error', 'layout: missing layout type. Available: wheel, grid');
        } else {
          if (args[0] === 'wheel' || args[0] === 'grid') {
            updateDesktopLayout(args[0]);
            addToHistory('system', `Desktop layout changed to: ${args[0]}`);
          } else {
            addToHistory('error', `layout: unknown layout '${args[0]}'`);
          }
        }
        break;

      case 'mv':
        if (args.length < 2) {
          addToHistory('error', 'mv: missing operands. Usage: mv <source> <destination>');
        } else {
          const srcPath = resolvePath(args[0]);
          const destPath = resolvePath(args[1]);
          
          if (!fileSystem[srcPath]) {
            addToHistory('error', `mv: ${args[0]}: No such file or directory`);
          } else if (fileSystem[destPath]) {
            addToHistory('error', `mv: ${args[1]}: Destination already exists`);
          } else {
            await copyFile(srcPath, destPath);
            await deleteFile(srcPath);
            addToHistory('output', '');
            reloadFileSystem?.();
          }
        }
        break;

      case 'cp':
        if (args.length < 2) {
          addToHistory('error', 'cp: missing operands. Usage: cp <source> <destination>');
        } else {
          const srcPath = resolvePath(args[0]);
          const destPath = resolvePath(args[1]);
          
          if (!fileSystem[srcPath]) {
            addToHistory('error', `cp: ${args[0]}: No such file or directory`);
          } else if (fileSystem[destPath]) {
            addToHistory('error', `cp: ${args[1]}: Destination already exists`);
          } else {
            await copyFile(srcPath, destPath);
            addToHistory('output', '');
            reloadFileSystem?.();
          }
        }
        break;

      case 'find':
        if (!args[0]) {
          addToHistory('error', 'find: missing search term');
        } else {
          const searchTerm = args[0].toLowerCase();
          const results = [];
          
          const searchDir = (path) => {
            const dir = fileSystem[path];
            if (!dir || !dir.children) return;
            
            dir.children.forEach(child => {
              const fullPath = path === '/' ? `/${child}` : `${path}/${child}`;
              if (child.toLowerCase().includes(searchTerm)) {
                const isDir = fileSystem[fullPath]?.type === 'directory';
                results.push(`${isDir ? '📁' : '📄'} ${fullPath}`);
              }
              if (fileSystem[fullPath]?.type === 'directory') {
                searchDir(fullPath);
              }
            });
          };
          
          searchDir('/');
          
          if (results.length === 0) {
            addToHistory('output', `No results found for '${args[0]}'`);
          } else {
            addToHistory('output', `Found ${results.length} result(s):\n${results.join('\n')}`);
          }
        }
        break;

      case 'grep':
        if (args.length < 2) {
          addToHistory('error', 'grep: missing operands. Usage: grep <pattern> <file>');
        } else {
          const pattern = args[0].toLowerCase();
          const filePath = resolvePath(args[1]);
          
          if (!fileSystem[filePath]) {
            addToHistory('error', `grep: ${args[1]}: No such file`);
          } else if (fileSystem[filePath].type === 'directory') {
            addToHistory('error', `grep: ${args[1]}: Is a directory`);
          } else {
            const content = fileSystem[filePath].content || '';
            if (content.startsWith('data:')) {
              addToHistory('error', 'grep: cannot search binary files');
            } else {
              const lines = content.split('\n');
              const matches = lines
                .map((line, i) => ({ line, num: i + 1 }))
                .filter(({ line }) => line.toLowerCase().includes(pattern));
              
              if (matches.length === 0) {
                addToHistory('output', `No matches found for '${args[0]}'`);
              } else {
                const output = matches
                  .map(({ line, num }) => `${num}: ${line}`)
                  .join('\n');
                addToHistory('output', output);
              }
            }
          }
        }
        break;

      case 'ls': {
        const lsPath = args[0] ? resolvePath(args[0]) : currentDirectory;
        if (!fileSystem[lsPath]) {
          addToHistory('error', `ls: ${lsPath}: No such directory`);
        } else if (fileSystem[lsPath].type !== 'directory') {
          addToHistory('error', `ls: ${lsPath}: Not a directory`);
        } else {
          const items = fileSystem[lsPath].children || [];
          if (items.length === 0) {
            addToHistory('output', '(empty directory)');
          } else {
            const itemsWithTypes = items.map(item => {
              const fullPath = lsPath === '/' ? `/${item}` : `${lsPath}/${item}`;
              const isDir = fileSystem[fullPath]?.type === 'directory';
              return isDir ? `📁 ${item}/` : `📄 ${item}`;
            });
            addToHistory('output', itemsWithTypes.join('\n'));
          }
        }
        break;
      }

      case 'cd':
        if (!args[0]) {
          setCurrentDirectory('/');
          addToHistory('output', '');
        } else {
          const newPath = resolvePath(args[0]);
          if (!fileSystem[newPath]) {
            addToHistory('error', `cd: ${args[0]}: No such directory`);
          } else if (fileSystem[newPath].type !== 'directory') {
            addToHistory('error', `cd: ${args[0]}: Not a directory`);
          } else {
            setCurrentDirectory(newPath);
            addToHistory('output', '');
          }
        }
        break;

      case 'pwd':
        addToHistory('output', currentDirectory);
        break;

      case 'cat':
        if (!args[0]) {
          addToHistory('error', 'cat: missing file operand');
        } else {
          const catPath = resolvePath(args[0]);
          if (!fileSystem[catPath]) {
            addToHistory('error', `cat: ${args[0]}: No such file`);
          } else if (fileSystem[catPath].type === 'directory') {
            addToHistory('error', `cat: ${args[0]}: Is a directory`);
          } else {
            const content = fileSystem[catPath].content || '(empty file)';
            if (content.startsWith('data:image')) {
              addToHistory('output', `[Image file - ${content.length} bytes]`);
            } else if (content.startsWith('data:')) {
              addToHistory('output', `[Binary file - ${content.length} bytes]`);
            } else {
              addToHistory('output', content);
            }
          }
        }
        break;

      case 'mkdir':
        if (!args[0]) {
          addToHistory('error', 'mkdir: missing directory name');
        } else {
          const mkdirPath = resolvePath(args[0]);
          if (fileSystem[mkdirPath]) {
            addToHistory('error', `mkdir: ${args[0]}: File exists`);
          } else {
            const parent = mkdirPath.substring(0, mkdirPath.lastIndexOf('/')) || '/';
            const name = mkdirPath.substring(mkdirPath.lastIndexOf('/') + 1);
            await createDirectory(parent, name);
            addToHistory('output', '');
            reloadFileSystem?.();
          }
        }
        break;

      case 'touch':
        if (!args[0]) {
          addToHistory('error', 'touch: missing file name');
        } else {
          const touchPath = resolvePath(args[0]);
          if (fileSystem[touchPath]) {
            addToHistory('output', '');
          } else {
            await saveFile(touchPath, '', 'file');
            addToHistory('output', '');
            reloadFileSystem?.();
          }
        }
        break;

      case 'rm':
        if (!args[0]) {
          addToHistory('error', 'rm: missing operand');
        } else {
          const rmPath = resolvePath(args[0]);
          if (!fileSystem[rmPath]) {
            addToHistory('error', `rm: ${args[0]}: No such file or directory`);
          } else {
            await deleteFile(rmPath);
            addToHistory('output', '');
            reloadFileSystem?.();
          }
        }
        break;

      case 'echo':
        addToHistory('output', args.join(' '));
        break;

      case 'open':
        if (!args[0]) {
          addToHistory('error', 'open: missing file operand');
        } else {
          const openPath = resolvePath(args[0]);
          if (!fileSystem[openPath]) {
            addToHistory('error', `open: ${args[0]}: No such file`);
          } else if (fileSystem[openPath].type === 'directory') {
            addToHistory('error', `open: ${args[0]}: Is a directory`);
          } else {
            onOpenFile(args[0], openPath);
            addToHistory('output', `Opening ${args[0]}...`);
          }
        }
        break;

      case 'tree': {
        const buildTree = (path, prefix = '', isLast = true) => {
          const items = fileSystem[path]?.children || [];
          let result = [];
          
          items.forEach((item, index) => {
            const isLastItem = index === items.length - 1;
            const fullPath = path === '/' ? `/${item}` : `${path}/${item}`;
            const isDir = fileSystem[fullPath]?.type === 'directory';
            const connector = isLastItem ? '└── ' : '├── ';
            const icon = isDir ? '📁' : '📄';
            
            result.push(`${prefix}${connector}${icon} ${item}`);
            
            if (isDir) {
              const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
              result = result.concat(buildTree(fullPath, newPrefix, isLastItem));
            }
          });
          
          return result;
        };
        
        const treeOutput = ['📁 ' + currentDirectory, ...buildTree(currentDirectory)];
        addToHistory('output', treeOutput.join('\n'));
        break;
      }

      case 'whoami':
        addToHistory('output', currentUser?.email || 'guest');
        break;

      case 'date':
        addToHistory('output', new Date().toString());
        break;

      case 'calc':
        if (!args[0]) {
          addToHistory('error', 'calc: missing expression');
        } else {
          try {
            const expression = args.join(' ');
            const result = Function('"use strict"; return (' + expression + ')')();
            addToHistory('output', `${expression} = ${result}`);
          } catch {
            addToHistory('error', 'calc: invalid expression');
          }
        }
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'help':
        addToHistory('output', `Available commands:
  
File System:
  ls [path]            - List directory contents
  cd <path>            - Change directory
  pwd                  - Print working directory
  tree                 - Display directory tree
  
File Operations:
  cat <file>           - Display file contents
  touch <name>         - Create a new file
  mkdir <name>         - Create a new directory
  rm <path>            - Remove file/directory
  mv <src> <dest>      - Move or rename file/directory
  cp <src> <dest>      - Copy file/directory
  find <name>          - Search for files/directories
  grep <text> <file>   - Search for text in file
  
Editing:
  breeze <file>        - Open file in Breeze text editor
  open <file>          - Open file in app
  
App Initialization:
  <appname> init       - Initialize app project (react, vue, svelte, node, etc.)
  
Utilities:
  echo <text>          - Print text to terminal
  calc <expression>    - Calculate math
  whoami               - Display current user
  date                 - Display date and time
  clear                - Clear the terminal
  
System Administration:
  sudo <command>       - Execute command with admin privileges
  sudo su              - Enter persistent sudo mode
  exit su              - Exit persistent sudo mode
  theme <name>         - Change desktop theme (requires sudo)
  layout <type>        - Change desktop layout (requires sudo)`);
        break;

      default:
        addToHistory('error', `${command}: command not found. Type 'help' for available commands.`);
    }
  };

  const executeCommand = async (cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);
    addToHistory('command', `${getPrompt()} ${trimmedCmd}`);

    const parts = trimmedCmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (command === 'sudo') {
      if (args.length === 0) {
        addToHistory('error', 'sudo: missing command. Usage: sudo <command> or sudo su');
        return;
      }
      setPendingCommand(args.join(' '));
      setAwaitingPassword(true);
      addToHistory('command', '[sudo] password for ' + (currentUser?.email?.split('@')[0] || 'user') + ':');
      return;
    }

    if (sudoMode && trimmedCmd === 'exit su') {
      setSudoMode(false);
      addToHistory('system', 'Exited sudo mode');
      return;
    }

    await executeCommandInternal(trimmedCmd);
    setCurrentInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (awaitingPassword) {
        // Simplified password handling - just accept any non-empty input
        if (currentInput) {
          setAwaitingPassword(false);
          if (pendingCommand === 'su') {
            setSudoMode(true);
            addToHistory('system', 'Elevated privileges granted. Type "exit su" to exit sudo mode.');
          } else if (pendingCommand) {
            setSudoMode(true);
            executeCommandInternal(pendingCommand);
            setSudoMode(false);
          }
          setPendingCommand(null);
        }
        setCurrentInput('');
      } else {
        executeCommand(currentInput);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!awaitingPassword && commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!awaitingPassword && historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!awaitingPassword) {
        handleTabCompletion();
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    } else if (e.key === 'c' && e.ctrlKey) {
      if (awaitingPassword) {
        e.preventDefault();
        addToHistory('system', '^C');
        setAwaitingPassword(false);
        setPendingCommand(null);
        setCurrentInput('');
      }
    }
  };

  const handleEditorKeyDown = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveBreezeFile();
    } else if (e.ctrlKey && e.key === 'x') {
      e.preventDefault();
      closeBreezeEditor(editorModified);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (editorModified) {
        if (window.confirm('Save changes before closing?')) {
          closeBreezeEditor(true);
        } else {
          closeBreezeEditor(false);
        }
      } else {
        closeBreezeEditor(false);
      }
    }
  };

  if (editorMode) {
    const lines = editorContent.split('\n');
    
    return (
      <div style={{
        height: '100%',
        background: '#1a1a1a',
        color: '#00ff00',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '8px 12px',
          background: '#0d0d0d',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#888'
        }}>
          <Edit3 size={16} />
          <span style={{ fontSize: '13px' }}>Breeze Editor</span>
          <span style={{ color: '#00ffff', marginLeft: '8px' }}>{editorFile}</span>
          {editorModified && <span style={{ color: '#ffff00', marginLeft: '4px' }}>●</span>}
          <span style={{ marginLeft: 'auto', fontSize: '11px' }}>
            Ctrl+S: Save | Ctrl+X: Exit | ESC: Cancel
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          <textarea
            ref={editorTextRef}
            value={editorContent}
            onChange={(e) => {
              setEditorContent(e.target.value);
              setEditorModified(true);
            }}
            onKeyDown={handleEditorKeyDown}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#00ff00',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              resize: 'none',
              lineHeight: '1.5'
            }}
            spellCheck={false}
          />
        </div>

        <div style={{
          padding: '8px 12px',
          background: '#0d0d0d',
          borderTop: '1px solid #333',
          display: 'flex',
          gap: '16px',
          fontSize: '12px',
          color: '#888'
        }}>
          <span>Lines: {lines.length}</span>
          <span>Chars: {editorContent.length}</span>
          <span style={{ marginLeft: 'auto', color: editorModified ? '#ffff00' : '#00ff00' }}>
            {editorModified ? 'Modified' : 'Saved'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        height: '100%',
        background: '#1a1a1a',
        color: '#00ff00',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <div style={{
        padding: '8px 12px',
        background: sudoMode ? '#8b0000' : '#0d0d0d',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#888',
        transition: 'background 0.3s'
      }}>
        {sudoMode ? <Lock size={16} color="#ff0000" /> : <TerminalIcon size={16} />}
        <span style={{ fontSize: '13px', color: sudoMode ? '#ff0000' : '#888' }}>
          AirOS Terminal {sudoMode && '(ROOT)'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px' }}>
          {awaitingPassword ? 'Enter password' : 'Ctrl+L to clear | Tab to complete'}
        </span>
      </div>

      <div
        ref={terminalRef}
        style={{
          flex: 1,
          padding: '12px',
          overflow: 'auto',
          lineHeight: '1.5'
        }}
      >
        {history.map((entry, index) => (
          <div
            key={index}
            style={{
              color: entry.type === 'error' ? '#ff5555' : 
                     entry.type === 'command' ? '#ffff00' : 
                     entry.type === 'system' ? '#00ffff' : '#00ff00',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              marginBottom: entry.type === 'output' ? '8px' : '0'
            }}
          >
            {entry.content}
          </div>
        ))}

        <div style={{ display: 'flex', color: sudoMode ? '#ff0000' : '#ffff00' }}>
          <span style={{ marginRight: '8px' }}>
            {awaitingPassword ? '' : getPrompt()}
          </span>
          <input
            ref={inputRef}
            type={awaitingPassword ? 'password' : 'text'}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: awaitingPassword ? '#ffff00' : '#00ff00',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              caretColor: sudoMode ? '#ff0000' : '#00ff00'
            }}
            spellCheck={false}
            autoComplete="off"
            placeholder={awaitingPassword ? '••••••••' : ''}
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;
