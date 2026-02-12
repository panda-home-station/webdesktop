import React from 'react'

export type AgentTask = {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: Date
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  id: string
  timestamp: Date
  toolCalls?: {
    name: string
    args: any
    status: 'running' | 'completed' | 'error'
    result?: string
  }[]
}

export type Agent = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: 'online' | 'busy' | 'offline'
  systemPrompt: string
}

export type AgentWorkflow = {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'error'
  steps: {
    id: string
    label: string
    status: 'pending' | 'running' | 'completed' | 'error'
  }[]
}

export interface Tool {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}
