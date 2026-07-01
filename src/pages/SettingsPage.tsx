import React from 'react'
import { useTheme } from '../hooks/useTheme'
export function SettingsPage(){
  const{theme,setTheme}=useTheme()
  return(
    <div className='max-w-lg mx-auto p-6 space-y-8'>
      <h1 className='text-2xl font-bold'>Settings</h1>
      <section>
        <h2 className='text-lg font-semibold mb-3'>Appearance</h2>
        <div className='grid grid-cols-3 gap-2'>
          {(['light','dark','system'] as const).map(t=>(
            <button key={t} onClick={()=>setTheme(t)} className={'py-2 rounded border capitalize '+(theme===t?'border-blue-500 bg-blue-50':'border-gray-200')}>{t}</button>
          ))}
        </div>
      </section>
    </div>
  )
}
