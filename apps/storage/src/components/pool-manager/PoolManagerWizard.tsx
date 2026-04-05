/**
 * Pool Manager Wizard Component
 * Multi-step wizard for creating storage pools
 */

import React, { useState } from 'react';
import { usePoolManagerStore } from '@truenas/stores/pool-manager';
import { useStorageDashboardStore } from '@truenas/stores/storage-dashboard';
import GeneralStep from './steps/GeneralStep';
import DataStep from './steps/DataStep';
import LogStep from './steps/LogStep';
import SpareStep from './steps/SpareStep';
import CacheStep from './steps/CacheStep';
import MetadataStep from './steps/MetadataStep';
import DedupStep from './steps/DedupStep';
import ReviewStep from './steps/ReviewStep';

export default function PoolManagerWizard() {
  const {
    currentStep,
    totalSteps,
    canProceed,
    createPool,
    reset,
    loadAvailableDisks,
  } = usePoolManagerStore();

  const { loadDashboard } = useStorageDashboardStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  React.useEffect(() => {
    loadAvailableDisks();
    return () => reset();
  }, [loadAvailableDisks, reset]);

  const steps = [
    { title: 'General', component: GeneralStep },
    { title: 'Data', component: DataStep },
    { title: 'Log', component: LogStep },
    { title: 'Spare', component: SpareStep },
    { title: 'Cache', component: CacheStep },
    { title: 'Metadata', component: MetadataStep },
    { title: 'Deduplication', component: DedupStep },
    { title: 'Review', component: ReviewStep },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      store.currentStep += 1;
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      store.currentStep -= 1;
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await createPool();
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to create pool:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (showSuccess) {
      loadDashboard();
    }
    // Navigate back to dashboard
    router.push('/storage');
  };

  if (showSuccess) {
    return (
      <SuccessScreen onClose={handleClose} />
    );
  }

  const CurrentStep = steps[currentStep].component;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Create Storage Pool</h1>
        <p style={styles.subtitle}>
          Follow the steps to configure your new storage pool
        </p>
      </div>

      {/* Progress Steps */}
      <StepIndicator
        steps={steps.map(s => s.title)}
        currentStep={currentStep}
      />

      {/* Current Step Content */}
      <div style={styles.stepContent}>
        <CurrentStep />
      </div>

      {/* Navigation */}
      <div style={styles.navigation}>
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          style={{
            ...styles.navButton,
            opacity: currentStep === 0 ? 0.5 : 1,
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            style={{
              ...styles.primaryButton,
              opacity: canProceed() ? 1 : 0.5,
              cursor: canProceed() ? 'pointer' : 'not-allowed',
            }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={!canProceed() || isSubmitting}
            style={{
              ...styles.primaryButton,
              opacity: (!canProceed() || isSubmitting) ? 0.5 : 1,
              cursor: (!canProceed() || isSubmitting) ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Pool'}
          </button>
        )}

        <button
          onClick={handleClose}
          style={styles.cancelButton}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div style={styles.stepIndicator}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isFuture = index > currentStep;

        return (
          <div
            key={step}
            style={{
              ...styles.stepItem,
              ...(isCompleted ? styles.stepCompleted : {}),
              ...(isCurrent ? styles.stepCurrent : {}),
              ...(isFuture ? styles.stepFuture : {}),
            }}
          >
            <div
              style={{
                ...styles.stepNumber,
                ...(isCompleted ? styles.stepNumberCompleted : {}),
                ...(isCurrent ? styles.stepNumberCurrent : {}),
              }}
            >
              {index + 1}
            </div>
            <span style={styles.stepLabel}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

interface SuccessScreenProps {
  onClose: () => void;
}

function SuccessScreen({ onClose }: SuccessScreenProps) {
  return (
    <div style={styles.successContainer}>
      <div style={styles.successIcon}>✓</div>
      <h2 style={styles.successTitle}>Pool Created Successfully</h2>
      <p style={styles.successMessage}>
        Your storage pool has been created and is ready to use.
      </p>
      <button
        onClick={onClose}
        style={styles.successButton}
      >
        Done
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    overflow: 'auto' as const,
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  header: {
    padding: '24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  stepIndicator: {
    display: 'flex',
    gap: '8px',
    padding: '24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    overflowX: 'auto' as const,
  } as React.CSSProperties,
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    minWidth: '120px',
  } as React.CSSProperties,
  stepCompleted: {
    backgroundColor: '#e8f5e9',
  } as React.CSSProperties,
  stepCurrent: {
    backgroundColor: '#e3f2fd',
  } as React.CSSProperties,
  stepFuture: {
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  stepNumber: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#bdbdbd',
    color: 'white',
  } as React.CSSProperties,
  stepNumberCompleted: {
    backgroundColor: '#4caf50',
  } as React.CSSProperties,
  stepNumberCurrent: {
    backgroundColor: '#1976d2',
  } as React.CSSProperties,
  stepLabel: {
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  stepContent: {
    flex: 1,
    padding: '24px',
    overflow: 'auto' as const,
  } as React.CSSProperties,
  navigation: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
  } as React.CSSProperties,
  navButton: {
    padding: '10px 24px',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #bdbdbd',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  primaryButton: {
    padding: '10px 24px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: '#f44336',
    border: '1px solid #f44336',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  successContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '48px',
    backgroundColor: 'white',
  } as React.CSSProperties,
  successIcon: {
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: 600,
    color: 'white',
    backgroundColor: '#4caf50',
    borderRadius: '50%',
    marginBottom: '24px',
  } as React.CSSProperties,
  successTitle: {
    margin: '0 0 16px',
    fontSize: '24px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  successMessage: {
    margin: '0 0 32px',
    fontSize: '16px',
    color: '#666',
    textAlign: 'center' as const,
    maxWidth: '400px',
  } as React.CSSProperties,
  successButton: {
    padding: '12px 32px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
};
