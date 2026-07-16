import React, { useState } from 'react'
export function SendFlow() {
  const [step] = useState(0)
  return <div data-testid='send-flow'>Step {step + 1}</div>
}
