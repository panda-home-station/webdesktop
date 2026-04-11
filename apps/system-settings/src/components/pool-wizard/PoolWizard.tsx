/**
 * Pool Wizard Component
 * Main wizard container with step management
 */

import React, { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { usePoolWizardStore, WIZARD_STEPS } from './store/poolWizardStore'
import { validateStep, stepHasWarnings } from './utils/validation'
import { GeneralStep } from './steps/GeneralStep'
import { DataStep } from './steps/DataStep'
import { LogStep, SpareStep, CacheStep, MetadataStep, DedupStep } from './steps/VdevStep'
import { ReviewStep } from './steps/ReviewStep'
import { colors } from '@apps/system-settings/styles/theme'

interface PoolWizardProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PoolWizard({ open, onClose, onSuccess: _onSuccess }: PoolWizardProps) {
  const {
    currentStep,
    totalSteps,
    isLoading,
    initialize,
    reset,
    nextStep,
    prevStep,
  } = usePoolWizardStore()

  // Initialize on open
  useEffect(() => {
    if (open) {
      initialize()
    }
  }, [open, initialize])

  // Handle successful creation
  const state = usePoolWizardStore.getState()
  useEffect(() => {
    if (state.isCreating === false && !state.error && !state.isLoading) {
      // Pool was created successfully - check if we need to notify
    }
  }, [state.isCreating, state.error, state.isLoading])

  const handleNext = () => {
    const errors = validateStep(usePoolWizardStore.getState(), currentStep)
    if (Object.keys(errors).length > 0) {
      return
    }
    nextStep()
  }

  const handlePrev = () => {
    prevStep()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const getCurrentStepContent = () => {
    const errors = validateStep(usePoolWizardStore.getState(), currentStep)
    const warnings = stepHasWarnings(usePoolWizardStore.getState(), currentStep)

    switch (currentStep) {
      case 0:
        return <GeneralStep errors={errors} />
      case 1:
        return <DataStep errors={errors} warnings={warnings} />
      case 2:
        return <LogStep errors={errors} warnings={warnings} />
      case 3:
        return <SpareStep errors={errors} warnings={warnings} />
      case 4:
        return <CacheStep errors={errors} warnings={warnings} />
      case 5:
        return <MetadataStep errors={errors} warnings={warnings} />
      case 6:
        return <DedupStep errors={errors} warnings={warnings} />
      case 7:
        return <ReviewStep />
      default:
        return null
    }
  }

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const stepErrors = validateStep(usePoolWizardStore.getState(), currentStep)
  const hasStepErrors = Object.keys(stepErrors).length > 0

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          width: 950,
          height: 560,
          backgroundColor: colors.cardBg,
          borderRadius: 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modal-pop 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            创建存储池
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isLoading && (
              <span style={{ fontSize: 13, color: colors.textSecondary }}>
                {WIZARD_STEPS[currentStep].title}
                <span style={{ marginLeft: 6 }}>Step {currentStep + 1}/{totalSteps}</span>
              </span>
            )}
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color={colors.textSecondary} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              color: colors.textSecondary,
            }}
          >
            <Loader2 size={24} className="spin" />
            <span>加载中...</span>
          </div>
        )}

        {/* Wizard Content */}
        {!isLoading && (
          <>
            {/* Step Content */}
            <div
              style={{
                flex: 1,
                overflow: 'hidden',
                backgroundColor: colors.background,
                minHeight: 0,
              }}
            >
              {getCurrentStepContent()}
            </div>

            {/* Navigation */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: colors.cardBg,
              }}
            >
              <button
                onClick={handlePrev}
                disabled={isFirstStep}
                style={{
                  ...styles.navButton,
                  ...(isFirstStep ? styles.navButtonDisabled : {}),
                }}
              >
                <ChevronLeft size={18} />
                上一步
              </button>

              {!isLastStep ? (
                <button
                  onClick={handleNext}
                  disabled={hasStepErrors}
                  style={{
                    ...styles.navButtonPrimary,
                    ...(hasStepErrors ? styles.navButtonDisabled : {}),
                  }}
                >
                  下一步
                  <ChevronRight size={18} />
                </button>
              ) : (
                <div style={{ width: 80 }} />
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes modal-pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 12px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: colors.text,
  },
  navButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  navButtonPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 12px',
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
  },
  stepIndicator: {
    fontSize: 12,
    color: colors.textSecondary,
  },
}
