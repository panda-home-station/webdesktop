import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { shellService } from '../services/shell.service';
import { authService } from '@truenas/services/auth';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  connectionData?: Record<string, never>;
}

const Terminal: React.FC<TerminalProps> = ({ connectionData = {} }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  // Use refs for values needed in callbacks to avoid recreating callbacks
  const isConnectedRef = useRef(false);
  const connectionIdRef = useRef<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const waitParentChanges = 300;

  // Initialize terminal and register event handlers
  const initTerminal = useCallback(() => {
    if (isInitializedRef.current || !terminalRef.current) {
      return;
    }

    const terminal = new XTerm({
      cursorBlink: false,
      tabStopWidth: 8,
      cols: 80,
      rows: 20,
      focus: true,
      fontFamily: '"Courier New", monospace',
      fontSize: 14,
      fontWeight: 'normal',
      fontWeightBold: 'bold',
      allowTransparency: false,
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#cccccc',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#3c3c3c',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Register data handlers BEFORE opening terminal
    terminal.onData((data) => {
      shellService.send(data);
    });

    terminal.onBinary((data) => {
      shellService.send(data);
    });

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    isInitializedRef.current = true;
  }, []);

  // Handle resize - uses refs to avoid recreating callback when state changes
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (fitAddonRef.current && xtermRef.current && isConnectedRef.current) {
        fitAddonRef.current.fit();
        const size = fitAddonRef.current.proposeDimensions();
        if (size && connectionIdRef.current) {
          shellService.resize(size.cols, size.rows);
          xtermRef.current.focus();
        }
      }
    }, waitParentChanges);
  }, []); // No dependencies - uses refs

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
      // Update refs first to ensure handleResize uses latest values
      isConnectedRef.current = event.connected;
      connectionIdRef.current = event.id || null;
      // Then update state (triggers re-render for UI)
      setIsConnected(event.connected);
      setIsReconnecting(false);
    });

    // Connect to shell - capture connectionData at effect creation time to avoid stale closure
    const currentConnectionData = connectionData;
    authService.getOneTimeToken().then((token) => {
      shellService.connect(currentConnectionData, token);
    }).catch((error) => {
      console.error('Failed to connect to shell:', error);
    });

    // Handle window resize
    window.addEventListener('resize', handleResize);

    return () => {
      unsubOutput();
      unsubConnected();
      window.removeEventListener('resize', handleResize);

      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }

      isInitializedRef.current = false;
      shellService.disconnectIfSessionActive();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - all dependencies captured via refs or stable refs

  // Reconnect handler - captures connectionData at creation time via ref
  const handleReconnect = useCallback(() => {
    const currentConnectionData = connectionData;
    shellService.disconnectIfSessionActive();
    setIsReconnecting(true);
    authService.getOneTimeToken().then((token) => {
      shellService.connect(currentConnectionData, token);
    }).catch((error) => {
      console.error('Failed to reconnect:', error);
      setIsReconnecting(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - connectionData captured via const above

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