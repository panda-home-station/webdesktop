/**
 * Wizard Stepper Component
 * Horizontal step progress indicator
 */

import React from 'react'
import { Check } from 'lucide-react'
import { WIZARD_STEPS } from '../store/poolWizardStore'
import { colors } from '@apps/system-settings/styles/theme'

interface WizardStepperProps {
  currentStep: number
  onStepClick: (step: number) => void
}

export function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  return (
    <div style={styles.container}>
      {WIZARD_STEPS.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isClickable = index <= currentStep || index === currentStep + 1

        return (
          <React.Fragment key={step.id}>
            <div
              onClick={() => isClickable && onStepClick(index)}
              style={{
                ...styles.step,
                ...(isActive ? styles.stepActive : {}),
                ...(isCompleted ? styles.stepCompleted : {}),
                cursor: isClickable ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  ...styles.stepCircle,
                  ...(isActive ? styles.circleActive : {}),
                  ...(isCompleted ? styles.circleCompleted : {}),
                }}
              >
                {isCompleted ? (
                  <Check size={14} color="#fff" />
                ) : (
                  <span style={styles.stepNumber}>{step.id + 1}</span>
                )}
              </div>
              <span
                style={{
                  ...styles.stepTitle,
                  ...(isActive ? styles.titleActive : {}),
                  ...(isCompleted ? styles.titleCompleted : {}),
                }}
              >
                {step.title}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                style={{
                  ...styles.connector,
                  ...(isCompleted ? styles.connectorCompleted : {}),
                }}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    marginBottom: 24,
    overflowX: 'auto',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 8,
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  stepActive: {
    backgroundColor: `${colors.primary}15`,
  },
  stepCompleted: {
    backgroundColor: 'transparent',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    border: `2px solid ${colors.border}`,
    transition: 'all 0.2s ease',
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: colors.textSecondary,
    whiteSpace: 'nowrap' as const,
  },
  titleActive: {
    color: colors.primary,
    fontWeight: 600,
  },
  titleCompleted: {
    color: colors.text,
  },
  connector: {
    flex: 1,
    minWidth: 20,
    height: 2,
    backgroundColor: colors.border,
    margin: '0 4px',
  },
  connectorCompleted: {
    backgroundColor: colors.success,
  },
}
