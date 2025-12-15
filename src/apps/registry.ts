import React from 'react'

type Manifest = {
  name: string
  title?: string
  entry: string
  capabilities?: string[]
  icons?: { default?: string }
}

type AppDef = {
  id: string
  title: string
  capabilities: string[]
  iconUrl?: string
  load: () => Promise<React.ComponentType<any>>
}

const manifests: Record<string, Manifest> = Object.fromEntries(
  Object.entries(import.meta.glob('../apps/**/manifest.json', { eager: true })).map(([p, m]) => [
    p,
    (m as any).default ?? (m as any)
  ])
)

const entries = import.meta.glob('../apps/**/src/**')
const assets = import.meta.glob('../apps/**', { eager: true, import: 'default', query: '?url' })

const apps: AppDef[] = Object.entries(manifests)
  .map(([mpath, m]) => {
    const dir = mpath.slice(0, mpath.lastIndexOf('manifest.json'))
    const entryRel = m.entry.replace(/^\.\//, '')
    const entryPath = `${dir}${entryRel}`
    const loader = entries[entryPath]
    if (!loader) return null
    const iconRel = m.icons?.default?.replace(/^\.\//, '')
    const iconPath = iconRel ? `${dir}${iconRel}` : undefined
    const iconUrl = iconPath ? (assets[iconPath] as string | undefined) : undefined
    return {
      id: m.name,
      title: m.title ?? m.name,
      capabilities: Array.isArray(m.capabilities) ? m.capabilities : [],
      iconUrl,
      load: async () => {
        const mod = await (loader as () => Promise<any>)()
        return mod.default as React.ComponentType<any>
      }
    }
  })
  .filter(Boolean) as AppDef[]

export function listApps() {
  return apps
}

export async function loadApp(id: string) {
  const app = apps.find((a) => a.id === id)
  if (!app) throw new Error(`app not found: ${id}`)
  return app.load()
}
