// electron/storage.js
// Desktop storage adapter - bridges Electron IPC to localStorage API
// When running in Electron, persists data to userData directory as JSON files

const isDesktop = typeof window !== 'undefined' && window.isDesktop === true

class DesktopStorage {
  constructor() {
    this.cache = {}
    this.dataPath = null
  }

  async init() {
    if (!isDesktop || !window.electronAPI) return
    this.dataPath = await window.electronAPI.getUserDataPath()
    await this._loadAll()
  }

  async _loadAll() {
    if (!this.dataPath) return
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const files = await fs.readdir(this.dataPath)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const key = file.replace('.json', '')
          const data = await fs.readFile(path.join(this.dataPath, file), 'utf-8')
          this.cache[key] = JSON.parse(data)
        }
      }
    } catch (e) {
      console.warn('Desktop storage init error:', e)
    }
  }

  getItem(key) {
    if (isDesktop && this.cache[key] !== undefined) {
      return JSON.stringify(this.cache[key])
    }
    return localStorage.getItem(key)
  }

  setItem(key, value) {
    if (isDesktop) {
      this.cache[key] = JSON.parse(value)
      this._persist(key)
    }
    localStorage.setItem(key, value)
  }

  removeItem(key) {
    if (isDesktop) {
      delete this.cache[key]
      this._deleteFile(key)
    }
    localStorage.removeItem(key)
  }

  async _persist(key) {
    if (!this.dataPath || !window.electronAPI) return
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      await fs.mkdir(this.dataPath, { recursive: true })
      await fs.writeFile(
        path.join(this.dataPath, `${key}.json`),
        JSON.stringify(this.cache[key], null, 2)
      )
    } catch (e) {
      console.warn('Desktop persist error:', e)
    }
  }

  async _deleteFile(key) {
    if (!this.dataPath) return
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      await fs.unlink(path.join(this.dataPath, `${key}.json`))
    } catch {}
  }

  async exportAll() {
    return JSON.stringify(this.cache, null, 2)
  }

  async importAll(jsonString) {
    const data = JSON.parse(jsonString)
    Object.assign(this.cache, data)
    for (const key of Object.keys(data)) {
      await this._persist(key)
    }
    // Also update localStorage
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }
}

export const desktopStorage = new DesktopStorage()

// Patch localStorage for desktop mode
export function patchLocalStorage() {
  if (!isDesktop) return

  const originalGetItem = localStorage.getItem.bind(localStorage)
  const originalSetItem = localStorage.setItem.bind(localStorage)
  const originalRemoveItem = localStorage.removeItem.bind(localStorage)

  localStorage.getItem = (key) => {
    const val = desktopStorage.getItem(key)
    return val !== null ? val : originalGetItem(key)
  }

  localStorage.setItem = (key, value) => {
    desktopStorage.setItem(key, value)
    originalSetItem(key, value)
  }

  localStorage.removeItem = (key) => {
    desktopStorage.removeItem(key)
    originalRemoveItem(key)
  }
}
