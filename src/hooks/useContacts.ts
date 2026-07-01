import { useLocalStorage } from './useLocalStorage'
export interface Contact { name: string; address: string }
export function useContacts() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('ss-contacts', [])
  const addContact = (c: Contact) => setContacts(p => p.some(x => x.address === c.address) ? p : [...p, c])
  const removeContact = (addr: string) => setContacts(p => p.filter(c => c.address !== addr))
  const findContact = (addr: string) => contacts.find(c => c.address === addr) ?? null
  return { contacts, addContact, removeContact, findContact }
}
