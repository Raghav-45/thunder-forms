'use client'

interface PickerDocument {
  id?: string
  name?: string
}

interface PickerResponse {
  action: string
  docs?: PickerDocument[]
}

interface GooglePickerBuilder {
  addView: (view: unknown) => GooglePickerBuilder
  setAppId: (appId: string) => GooglePickerBuilder
  setCallback: (callback: (response: PickerResponse) => void) => GooglePickerBuilder
  setDeveloperKey: (developerKey: string) => GooglePickerBuilder
  setOAuthToken: (oauthToken: string) => GooglePickerBuilder
  setOrigin: (origin: string) => GooglePickerBuilder
  build: () => { setVisible: (visible: boolean) => void }
}

interface GooglePickerApi {
  Action: { PICKED: string; CANCEL: string }
  DocsView: new (viewId: string) => {
    setMimeTypes: (mimeTypes: string) => unknown
    setMode: (mode: string) => unknown
    setIncludeFolders: (include: boolean) => unknown
    setSelectFolderEnabled: (enabled: boolean) => unknown
  }
  DocsViewMode: { LIST: string }
  PickerBuilder: new () => GooglePickerBuilder
  ViewId: { SPREADSHEETS: string; FOLDERS: string }
}

declare global {
  interface Window {
    gapi?: {
      load: (
        name: string,
        options: { callback: () => void; onerror: () => void },
      ) => void
    }
    google?: { picker?: GooglePickerApi }
  }
}

function pickerConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY,
    projectNumber: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER,
  }
}

function loadGooglePicker(): Promise<GooglePickerApi> {
  if (window.google?.picker) return Promise.resolve(window.google.picker)

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-picker]')
    const loadPicker = () => {
      if (!window.gapi) {
        reject(new Error('Google Picker failed to load'))
        return
      }
      window.gapi.load('picker', {
        callback: () => {
          if (window.google?.picker) resolve(window.google.picker)
          else reject(new Error('Google Picker is unavailable'))
        },
        onerror: () => reject(new Error('Google Picker failed to initialize')),
      })
    }

    if (existing) {
      if (window.gapi) return loadPicker()
      existing.addEventListener('load', loadPicker, { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Picker failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.dataset.googlePicker = 'true'
    script.addEventListener('load', loadPicker, { once: true })
    script.addEventListener('error', () => reject(new Error('Google Picker failed to load')), { once: true })
    document.head.appendChild(script)
  })
}

/**
 * Google Picker appends its iframe outside the component that launches it.
 * Give a parent dialog a paint to release its modal pointer-event lock before
 * making that iframe visible.
 */
export function waitForGooglePickerLayer() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve())
    })
  })
}

export async function chooseGoogleSpreadsheet(accessToken: string) {
  return chooseGoogleDriveItem(accessToken, { viewId: 'SPREADSHEETS' })
}

export async function chooseGoogleDriveFolder(accessToken: string) {
  return chooseGoogleDriveItem(accessToken, { viewId: 'FOLDERS', selectFolder: true })
}

async function chooseGoogleDriveItem(
  accessToken: string,
  options: { viewId: 'SPREADSHEETS' | 'FOLDERS'; selectFolder?: boolean },
): Promise<{ id: string; name: string | null } | null> {
  const { apiKey, projectNumber } = pickerConfig()
  if (!apiKey || !projectNumber) throw new Error('Google Picker is not configured')

  const picker = await loadGooglePicker()
  return new Promise((resolve) => {
    const view = new picker.DocsView(picker.ViewId[options.viewId])
    view.setMode(picker.DocsViewMode.LIST)
    if (options.viewId === 'SPREADSHEETS') {
      view.setMimeTypes('application/vnd.google-apps.spreadsheet')
    }
    if (options.selectFolder) {
      view.setIncludeFolders(true)
      view.setSelectFolderEnabled(true)
    }
    new picker.PickerBuilder()
      .addView(view)
      .setAppId(projectNumber)
      .setDeveloperKey(apiKey)
      .setOAuthToken(accessToken)
      .setOrigin(window.location.origin)
      .setCallback((response) => {
        if (response.action === picker.Action.PICKED) {
          const document = response.docs?.[0]
          resolve(document?.id ? { id: document.id, name: document.name || null } : null)
        } else if (response.action === picker.Action.CANCEL) {
          resolve(null)
        }
      })
      .build()
      .setVisible(true)
  })
}
