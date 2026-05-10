import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CountryState {
  selectedCountry: string
  setCountry: (country: string) => void
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      selectedCountry: '',
      setCountry: (country) => set({ selectedCountry: country }),
    }),
    { name: 'vhh-country' },
  ),
)
