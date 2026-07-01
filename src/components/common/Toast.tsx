import React, { useEffect } from 'react'
export type TT='success'|'error'|'info'
const S:Record<TT,string>={success:'bg-green-600',error:'bg-red-600',info:'bg-blue-600'}
interface P{message:string;type?:TT;onDismiss:()=>void;duration?:number}
export function Toast({message,type='info',onDismiss,duration=3000}:P){
  useEffect(()=>{const t=setTimeout(onDismiss,duration);return()=>clearTimeout(t)},[duration,onDismiss])
  return<div className={S[type]+' text-white px-4 py-3 rounded-lg shadow flex gap-3'}><span>{message}</span><button onClick={onDismiss}>✕</button></div>
}
