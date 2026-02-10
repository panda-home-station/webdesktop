export type Container = {
  id: string
  names: string[]
  image: string
  state: string
  status?: string
  created: number
  ports: [number, number | null, string | null][]
}

export type Image = {
  id: string
  repo_tags: string[]
  size: number
  created: number
  exposed_ports?: number[]
  env?: string[]
  volumes?: string[]
}

export type Volume = {
  Name: string
  Driver: string
  Mountpoint: string
  CreatedAt?: string
}

export type Network = {
  Name: string
  Id: string
  Driver: string
  Scope: string
  Internal: boolean
  Attachable: boolean
  Ingress: boolean
  IPAM: {
    Driver: string
    Config: { Subnet: string; Gateway: string }[]
  }
}

export type Mirror = {
  id: string
  name: string
  host: string
  enabled: boolean
}
