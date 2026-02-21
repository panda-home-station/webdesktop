import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Ansi from 'ansi-to-react';
import { api as client } from '../../../src/api/client';

// Types
type HistoryItem = {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  cwd?: string;
};

const TerminalApp: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    setHistory([
      {
        id: 'welcome',
        type: 'output',
        content: `\x1b[1;36m ____                 _        ___  ____  \x1b[0m
\x1b[1;36m|  _ \\ __ _ _ __   __| | __ _ / _ \\/ ___| \x1b[0m
\x1b[1;36m| |_) / _\` | '_ \\ / _\` |/ _\` | | | \\___ \\ \x1b[0m
\x1b[1;36m|  __/ (_| | | | | (_| | (_| | |_| |___) |\x1b[0m
\x1b[1;36m|_|   \\__,_|_| |_|\\__,_|\\__,_|\\___/|____/ \x1b[0m

\x1b[1;32mWelcome to Panda OS Terminal\x1b[0m
\x1b[90mSystem ready. Type \x1b[1;33;4mhelp\x1b[0m\x1b[90m to list commands.\x1b[0m`
      }
    ]);
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  // Focus input when loading finishes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Auto-scroll to bottom
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history, input, isLoading]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      
      // Add command to display history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        type: 'command',
        content: cmd,
        cwd: cwd
      };
      
      setHistory(prev => [...prev, newHistoryItem]);
      setCommandHistory(prev => [...prev, cmd]);
      setHistoryIndex(-1);
      setInput('');
      setIsLoading(true);

      if (!cmd) {
        setIsLoading(false);
        return;
      }

      if (cmd === 'clear') {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      if (cmd === 'help') {
        setHistory(prev => [...prev, {
          id: Date.now().toString() + '-help',
          type: 'output',
          content: `\x1b[1;36mPanda OS Terminal Help\x1b[0m

\x1b[1;33mBuilt-in Commands:\x1b[0m
  \x1b[1;32mhelp\x1b[0m     Show this help message
  \x1b[1;32mclear\x1b[0m    Clear the terminal screen

\x1b[1;33mSystem Commands:\x1b[0m
  \x1b[1;32mls\x1b[0m       List directory contents (alias: ll, la)
  \x1b[1;32mcd\x1b[0m       Change directory
  \x1b[1;32mtouch\x1b[0m    Create a new file
  \x1b[1;32mmkdir\x1b[0m    Create a new directory
  \x1b[1;32mrm\x1b[0m       Remove files or directories
  \x1b[1;32mpwd\x1b[0m      Print working directory
  \x1b[1;32mcat\x1b[0m      Concatenate and display file content
  \x1b[1;32mcp\x1b[0m       Copy files and directories
  \x1b[1;32mmv\x1b[0m       Move or rename files and directories

\x1b[90mAll standard Linux commands are supported.\x1b[0m`
        }]);
        setIsLoading(false);
        return;
      }

      // Handle aliases
      let finalCmd = cmd;
      if (cmd === 'll') finalCmd = 'ls -la';
      else if (cmd === 'la') finalCmd = 'ls -a';

      try {
        const res = await client.execCommand(finalCmd);
        
        // Update CWD
        if (res.cwd) {
          let displayCwd = res.cwd;
          if (displayCwd.startsWith('/home/jolly')) {
            displayCwd = '~' + displayCwd.substring(11);
          }
          setCwd(displayCwd);
        }

        const output = res.stdout + (res.stderr ? '\n' + res.stderr : '');
        if (output) {
          setHistory(prev => [...prev, {
            id: Date.now().toString() + '-out',
            type: 'output',
            content: output
          }]);
        }
      } catch (err: any) {
        setHistory(prev => [...prev, {
          id: Date.now().toString() + '-err',
          type: 'error',
          content: `\x1b[1;31mError: ${err.message || 'Command execution failed'}\x1b[0m`
        }]);
      } finally {
        setIsLoading(false);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.ctrlKey && e.key === 'c') {
       setInput(prev => prev + '^C');
       setHistory(prev => [...prev, {
          id: Date.now().toString(),
          type: 'command',
          content: input + '^C',
          cwd: cwd
       }]);
       setInput('');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only focus input if user is not selecting text
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) {
      inputRef.current?.focus();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // If right click (button 2), ensure input is focused to prevent focus loss
    // BUT only if there is no selection, otherwise focus will clear the selection
    if (e.button === 2) {
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        inputRef.current?.focus();
      }
    }
  };

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    
    // Check if there is actual text selected
    if (selectedText.length > 0) {
      try {
        // Try using the modern Clipboard API first
        await navigator.clipboard.writeText(selectedText);
      } catch (err) {
        console.warn('Clipboard write failed, falling back to execCommand', err);
        // Fallback to deprecated execCommand for broader compatibility
        try {
          document.execCommand('copy');
        } catch (execErr) {
          console.error('execCommand copy failed', execErr);
        }
      }
      
      selection?.removeAllRanges();
      // Ensure focus is returned to input
      inputRef.current?.focus();
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: '#0c0c0c',
        color: '#cccccc',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        fontSize: '16px',
        padding: '16px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      {history.map((item) => (
        <div key={item.id} style={{ marginBottom: '2px' }}>
          {item.type === 'command' ? (
             <div style={{ display: 'flex', alignItems: 'center' }}>
               <span style={{ color: '#c678dd', fontWeight: 'bold', marginRight: '6px' }}>root@nas</span>
               <span style={{ color: '#5c6370', marginRight: '6px' }}>:</span>
               <span style={{ color: '#61afef', fontWeight: 'bold', marginRight: '10px' }}>{item.cwd}</span>
               <span style={{ color: '#e06c75', fontWeight: 'bold', marginRight: '10px' }}>$</span>
               <span style={{ color: '#cccccc' }}>{item.content}</span>
             </div>
          ) : (
             <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.2' }}>
               <Ansi>{item.content}</Ansi>
             </div>
          )}
        </div>
      ))}
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#c678dd', fontWeight: 'bold', marginRight: '6px' }}>root@nas</span>
        <span style={{ color: '#5c6370', marginRight: '6px' }}>:</span>
        <span style={{ color: '#61afef', fontWeight: 'bold', marginRight: '10px' }}>{cwd}</span>
        <span style={{ color: '#e06c75', fontWeight: 'bold', marginRight: '10px' }}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cccccc',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: '16px',
            flex: 1,
            outline: 'none',
            padding: 0,
            margin: 0
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default TerminalApp;
