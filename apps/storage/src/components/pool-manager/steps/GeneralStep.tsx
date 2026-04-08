/**
 * General Step Component
 * Pool name and encryption configuration
 */

import React from 'react';
import { usePoolManagerStore } from '@truenas/stores/pool-manager';

export default function GeneralStep() {
  const {
    name,
    encryption,
    encryptionAlgorithm,
    encryptionPassphrase,
    generateKey,
    allowDuplicateSerials,
    setName,
    setEncryption,
    setEncryptionAlgorithm,
    setEncryptionPassphrase,
    setGenerateKey,
    setAllowDuplicateSerials,
    errors,
  } = usePoolManagerStore();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>General Configuration</h2>
      <p style={styles.subtitle}>
        Enter a name for your storage pool and configure encryption options.
      </p>

      {/* Pool Name */}
      <div style={styles.field}>
        <label style={styles.label} htmlFor="pool-name">
          Pool Name *
        </label>
        <input
          id="pool-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., tank"
          style={{
            ...styles.input,
            borderColor: errors.name ? '#f44336' : '#e0e0e0',
          }}
        />
        {errors.name && (
          <span style={styles.error}>{errors.name}</span>
        )}
      </div>

      {/* Encryption Toggle */}
      <div style={styles.field}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={encryption}
            onChange={(e) => setEncryption(e.target.checked)}
            style={styles.checkbox}
          />
          Enable Encryption
        </label>
      </div>

      {/* Encryption Options */}
      {encryption && (
        <>
          <div style={styles.separator} />

          <div style={styles.field}>
            <label style={styles.label} htmlFor="encryption-algorithm">
              Encryption Algorithm
            </label>
            <select
              id="encryption-algorithm"
              value={encryptionAlgorithm}
              onChange={(e) => setEncryptionAlgorithm(e.target.value)}
              style={styles.select}
            >
              <option value="AES-256-GCM">AES-256-GCM</option>
              <option value="AES-256-XTS">AES-256-XTS</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="generate-key">
              Key Type
            </label>
            <select
              id="generate-key"
              value={generateKey ? 'GENERATE' : 'PASSPHRASE'}
              onChange={(e) => setGenerateKey(e.target.value === 'GENERATE')}
              style={styles.select}
            >
              <option value="GENERATE">Generate Key</option>
              <option value="PASSPHRASE">Use Passphrase</option>
            </select>
          </div>

          {!generateKey && (
            <div style={styles.field}>
              <label style={styles.label} htmlFor="passphrase">
                Passphrase *
              </label>
              <input
                id="passphrase"
                type="password"
                value={encryptionPassphrase}
                onChange={(e) => setEncryptionPassphrase(e.target.value)}
                placeholder="Enter passphrase"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={allowDuplicateSerials}
                onChange={(e) => setAllowDuplicateSerials(e.target.checked)}
                style={styles.checkbox}
              />
              Allow Duplicate Serial Numbers
            </label>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '600px',
  } as React.CSSProperties,
  title: {
    margin: '0 0 8px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  subtitle: {
    margin: '0 0 24px',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  field: {
    marginBottom: '20px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    outline: 'none',
    ':focus': {
      borderColor: '#1976d2',
    },
  } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: 'white',
    ':focus': {
      borderColor: '#1976d2',
    },
  } as React.CSSProperties,
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#333',
  } as React.CSSProperties,
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  } as React.CSSProperties,
  error: {
    display: 'block',
    marginTop: '4px',
    fontSize: '13px',
    color: '#f44336',
  } as React.CSSProperties,
  separator: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '24px 0',
  } as React.CSSProperties,
};
