import React from "react"
interface Props { value: string; onChange: (v: string) => void }
export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search contacts..."
        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
