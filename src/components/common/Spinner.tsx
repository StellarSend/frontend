import React from 'react'
type S='sm'|'md'|'lg'
const SZ:Record<S,string>={sm:'h-4 w-4',md:'h-8 w-8',lg:'h-12 w-12'}
export function Spinner({size='md' as S}={}) {
  return <div className={SZ[size]+' animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'} />
}
