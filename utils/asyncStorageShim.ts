const memory = new Map<string, string | null>()

const AsyncStorage = {
  async getItem(key: string) {
    return memory.get(key) ?? null
  },
  async setItem(key: string, value: string | null) {
    memory.set(key, value ?? '')
  },
  async removeItem(key: string) {
    memory.delete(key)
  },
  async clear() {
    memory.clear()
  }
}

export default AsyncStorage
