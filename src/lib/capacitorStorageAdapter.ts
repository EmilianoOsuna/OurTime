import { Preferences } from '@capacitor/preferences'

export const capacitorStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key })
    console.log(`[DIAG] adapter.getItem("${key}") →`, value ? `found (${value.slice(0, 40)}...)` : 'null')
    return value
  },
  setItem: async (key: string, value: string): Promise<void> => {
    console.log(`[DIAG] adapter.setItem("${key}", ${value.slice(0, 40)}...)`)
    await Preferences.set({ key, value })
  },
  removeItem: async (key: string): Promise<void> => {
    console.log(`[DIAG] adapter.removeItem("${key}")`)
    await Preferences.remove({ key })
  },
}
