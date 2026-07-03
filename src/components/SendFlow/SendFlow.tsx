import React, { useState } from 'react'
export function SendFlow() {
  const [step, setStep] = useState(0)
  return <div data-testid='send-flow'>Step {step + 1}</div>
}
