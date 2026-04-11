/**
 * Create Pool Page
 * Full page version of pool creation wizard
 */

import React, { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2, ArrowLeft } from 'lucide-react'
import { usePoolWizardStore, WIZARD_STEPS } from './store/poolWizardStore'
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

export function CreatePoolPage({ onBack, onSuccess: _onSuccess }: CreatePoolPageProps) {
  const {
    currentStep,
    totalSteps,
    isLoading,
    initialize,
    reset,
    nextStep,
    prevStep,
  } = usePoolWizardStore()

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

  const handleClose = () => {
    reset()
    onBack()
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
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.background,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.cardBg,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.text,
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              创建存储池
            </h2>
            {!isLoading && (
              <span style={{ fontSize: 13, color: colors.textSecondary }}>
                {WIZARD_STEPS[currentStep].title} — Step {currentStep + 1}/{totalSteps}
              </span>
            )}
          </div>
        </div>

        {/* Step Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i < currentStep
                  ? colors.primary
                  : i === currentStep
                    ? colors.primary
                    : colors.border,
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={20} color={colors.textSecondary} />
        </button>
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
              minHeight: 0,
            }}
          >
            {getCurrentStepContent()}
          </div>

          {/* Navigation */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: colors.cardBg,
              flexShrink: 0,
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