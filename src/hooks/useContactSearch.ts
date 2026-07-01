import { useMemo } from "react"
import { useDebounce } from "./useDebounce"
import type { Contact } from "./useContacts"
export function useContactSearch(contacts: Contact[], query: string) {
  const debouncedQuery = useDebounce(query, 200)
  return useMemo(() => {
    if (!debouncedQuery.trim()) return contacts
    const q = debouncedQuery.toLowerCase()
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
    )
  }, [contacts, debouncedQuery])
}
