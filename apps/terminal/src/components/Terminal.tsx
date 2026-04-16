import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { shellService } from '../services/shell.service';
import { authService } from '@truenas/services/auth';
import '@xterm/xterm/css/xterm.css';

// FontFaceObserver for font loading
const fontObserver = (fontName: string, fallback: () => void): Promise<void> => {
  return new Promise((resolve) => {
    // @ts-expect-error FontFaceSet API
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`14px "${fontName}"`).then(() => {
        resolve();
      }).catch(() => {
        fallback();
        resolve();
      });
    } else {
      fallback();
      resolve();
    }
  });
};

interface TerminalProps {
  connectionData?: Record<string, never>;
}

const Terminal: React.FC<TerminalProps> = ({ connectionData = {} }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track if we've ever successfully connected
  const shellEverConnectedRef = useRef(false);
  // Track if cleanup is in progress (prevent new connections during cleanup)
  const isCleaningUpRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const waitParentChanges = 300;

  // Initialize terminal
  const initTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    const terminal = new XTerm({
      cursorBlink: false,
      tabStopWidth: 8,
      cols: 80 as number,
      rows: 20 as number,
      focus: true,
      fontFamily: 'monospace',
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Load custom font
    fontObserver('Inconsolata', () => {
      terminal.options.fontFamily = 'monospace';
      terminal.refresh(0, terminal.rows - 1);
    }).then(() => {
      terminal.options.fontFamily = 'Inconsolata';
      terminal.refresh(0, terminal.rows - 1);
    });
  }, []);

  // Handle terminal data input
  const handleTerminalData = useCallback((data: string) => {
    shellService.send(data);
  }, []);

  // Handle terminal binary input
  const handleTerminalBinary = useCallback((data: string) => {
    shellService.send(data);
  }, []);

  // Handle resize
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (fitAddonRef.current && xtermRef.current && isConnected) {
        fitAddonRef.current.fit();
        const size = fitAddonRef.current.proposeDimensions();
        if (size && connectionId) {
          shellService.resize(size.cols, size.rows);
          xtermRef.current.focus();
        }
      }
    }, waitParentChanges);
  }, [isConnected, connectionId]);

  // Connect to shell
  const connectShell = useCallback(async () => {
    // Don't connect if we're in cleanup
    if (isCleaningUpRef.current) {
      return;
    }

    try {
      // Get one-time token like webui does, then connect
      const token = await authService.getOneTimeToken();
      await shellService.connect(connectionData, token);
    } catch (error) {
      console.error('Failed to connect to shell:', error);
    }
  }, [connectionData]);

  // Reconnect handler - called when user clicks reconnect button
  const handleReconnect = useCallback(() => {
    shellService.disconnectIfSessionActive();
    setIsReconnecting(true);
    connectShell();
  }, [connectShell]);

  // Initialize on mount
  useEffect(() => {
    initTerminal();

    // Subscribe to shell output
    const unsubOutput = shellService.onOutput((data) => {
      if (xtermRef.current) {
        xtermRef.current.write(typeof data === 'string' ? data : new Uint8Array(data));
      }
    });

    // Subscribe to connection events
    const unsubConnected = shellService.onConnected((event) => {
      setIsConnected(event.connected);
      setConnectionId(event.id || null);
      setIsReconnecting(false);
      if (event.connected) {
        shellEverConnectedRef.current = true;
      }
      // Note: reconnection is handled by shellService.scheduleReconnect()
      // We don't trigger reconnection here to avoid duplicate reconnection attempts
    });

    // Connect to shell
    connectShell();

    // Handle window resize
    window.addEventListener('resize', handleResize);

    return () => {
      // Mark cleanup in progress FIRST - before any async operations
      isCleaningUpRef.current = true;

      unsubOutput();
      unsubConnected();
      window.removeEventListener('resize', handleResize);

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      if (xtermRef.current) {
        xtermRef.current.dispose();
      }

      // Only disconnect if we've never successfully connected
      // shellEverConnectedRef survives StrictMode remounts, so this prevents
      // StrictMode's double-mount from killing an established connection
      if (!shellEverConnectedRef.current) {
        shellService.disconnectIfSessionActive();
      }

      // Reset cleanup flag after a delay to allow for StrictMode remount
      setTimeout(() => {
        isCleaningUpRef.current = false;
      }, 100);
    };
  }, [initTerminal, connectShell, handleResize]);

  // Update terminal data handlers when xterm is ready
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.onData(handleTerminalData);
      xtermRef.current.onBinary(handleTerminalBinary);
    }
  }, [handleTerminalData, handleTerminalBinary]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      backgroundColor: '#1e1e1e',
      position: 'relative',
    }}>
      {/* Terminal container */}
      <div style={{
        flex: 1,
        position: 'relative',
        opacity: isConnected ? 1 : 0.5,
      }}>
        {/* Connection overlay */}
        {!isConnected && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            zIndex: 10,
          }}>
            {isReconnecting ? (
              <>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid #3c3c3c',
                  borderTopColor: '#0078d4',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <p style={{ color: '#cccccc', marginTop: '16px' }}>连接中...</p>
              </>
            ) : (
              <>
                <p style={{ color: '#cccccc', marginBottom: '16px' }}>连接丢失。点击重连以恢复会话。</p>
                <button
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  style={{
                    backgroundColor: '#0078d4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  重连
                </button>
              </>
            )}
          </div>
        )}

        {/* XTerm terminal */}
        <div
          ref={terminalRef}
          style={{
            width: '100%',
            height: '100%',
            padding: '4px',
          }}
        />
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Terminal;