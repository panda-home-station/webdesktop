import React from 'react'
import { Sparkles, Terminal, Search, Workflow, Globe, Box } from 'lucide-react'
import { Agent, Tool } from '../types'

export const SIDEBAR_EXPANDED = 240
export const SIDEBAR_COLLAPSED = 60
export const CHAT_MIN_WIDTH = 450
export const WORKSPACE_MIN_THRESHOLD = 450
export const RESIZER_WIDTH = 1

export const MOCK_AGENTS: Agent[] = [
  { 
    id: 'general', 
    name: '智能助手', 
    description: '通用的 AI 助手，协助日常任务', 
    icon: <Sparkles size={18} />, 
    status: 'online',
    systemPrompt: '你是一个全能的智能助手，能够回答各种问题并提供建议。请保持友好、简洁且专业的态度。'
  },
  { 
    id: 'coder', 
    name: '代码专家', 
    description: '擅长编程、调试和架构设计', 
    icon: <Terminal size={18} />, 
    status: 'online',
    systemPrompt: '你是一个顶尖的软件工程师 and 架构师。在编写代码时，注重性能、可维护性和安全性。请直接提供高质量的代码片段和深度的技术见解。'
  },
  { 
    id: 'researcher', 
    name: '研究员', 
    description: '深度搜索和信息汇总分析', 
    icon: <Search size={18} />, 
    status: 'online',
    systemPrompt: '你是一个严谨的研究员。在提供信息时，请务必客观、详尽，并尽可能引用来源（即使是模拟的）。擅长分析复杂数据和总结长篇文章。'
  },
  { 
    id: 'workflow-master', 
    name: '流程大师', 
    description: '自动化工作流编排与执行', 
    icon: <Workflow size={18} />, 
    status: 'online',
    systemPrompt: '你是一个工作流编排专家。你的任务是帮助用户将复杂任务拆解为可执行的步骤，并模拟工作流的执行过程。在回复时，请使用清晰的步骤描述。'
  },
]

export const AVAILABLE_TOOLS: Tool[] = [
  { id: 'web_search', name: '网页搜索', icon: <Globe size={14} />, description: '在互联网上搜索最新信息' },
  { id: 'file_system', name: '文件系统', icon: <Box size={14} />, description: '读写本地文件系统' },
  { id: 'terminal', name: '终端执行', icon: <Terminal size={14} />, description: '运行系统命令和脚本' },
]
