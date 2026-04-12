/**
 * Create Pool Page
 * Full page version of pool creation wizard
 */

import React, { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { usePoolWizardStore } from './store/poolWizardStore'
import { validateStep, stepHasWarnings } from './utils/validation'
import { GeneralStep } from './steps/GeneralStep'
import { DataStep } from './steps/DataStep'
import { LogStep, SpareStep, CacheStep, MetadataStep, DedupStep } from './steps/VdevStep'
import { ReviewStep } from './steps/ReviewStep'
import { colors } from '@apps/system-settings/styles/theme'

interface CreatePoolPageProps {
  onBack: () => void
  onSuccess: () => void
}

export function CreatePoolPage({ onBack: _onBack, onSuccess }: CreatePoolPageProps) {
  const {
    currentStep,
    totalSteps,
    isLoading,
    createdSuccessfully,
    initialize,
    reset,
    nextStep,
    prevStep,
  } = usePoolWizardStore()

  // Handle pool creation success - navigate back when pool is created
  useEffect(() => {
    if (createdSuccessfully) {
      // Small delay to let the UI show success state briefly
      const timer = setTimeout(() => {
        onSuccess()
        reset()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [createdSuccessfully, onSuccess, reset])

  // Initialize on mount
  useEffect(() => {
    initialize()
    return () => {
      reset()
    }
  }, [initialize, reset])

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

  return (
    <div
      style={{
        backgroundColor: colors.background,
      }}
    >
      {/* Loading State */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: colors.textSecondary,
            padding: 40,
          }}
        >
          <Loader2 size={24} className="spin" />
          <span>加载中...</span>
        </div>
      )}

      {/* Wizard Content */}
      {!isLoading && (
        <>
          {getCurrentStepContent()}

          {/* Navigation */}
          <div
            style={{
              marginTop: 12,
              padding: '16px 24px',
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgb(242, 242, 247)',
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

            {/* Step Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentStep ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: i <= currentStep
                      ? colors.primary
                      : colors.border,
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>

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

      <style>{`
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
    padding: '10px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
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
    padding: '10px 20px',
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
  },
}