/**
 * Shared category constants for app store
 */

import {
  Brain,
  Lock,
  FolderSync,
  Camera,
  Settings,
  Database,
  Monitor,
  Wallet,
  Gamepad2,
  Gauge,
  Home,
  Briefcase,
  Network,
  Shield,
  HardDrive,
} from 'lucide-react';

export const categoryLabels: Record<string, string> = {
  ai: '人工智能',
  authentication: '身份认证',
  backup: '备份',
  cameras: '摄像头',
  custom: '自定义',
  database: '数据库',
  development: '开发',
  financial: '财务',
  games: '游戏',
  health: '健康',
  'home-automation': '智能家居',
  management: '管理',
  media: '媒体',
  monitoring: '监控',
  networking: '网络',
  productivity: '生产力',
  security: '安全',
  storage: '存储',
};

export const categoryIcons: Record<string, React.ReactNode> = {
  ai: <Brain size={16} />,
  authentication: <Lock size={16} />,
  backup: <FolderSync size={16} />,
  cameras: <Camera size={16} />,
  custom: <Settings size={16} />,
  database: <Database size={16} />,
  development: <Monitor size={16} />,
  financial: <Wallet size={16} />,
  games: <Gamepad2 size={16} />,
  health: <Gauge size={16} />,
  'home-automation': <Home size={16} />,
  management: <Briefcase size={16} />,
  media: <Monitor size={16} />,
  monitoring: <Gauge size={16} />,
  networking: <Network size={16} />,
  productivity: <Briefcase size={16} />,
  security: <Shield size={16} />,
  storage: <HardDrive size={16} />,
};
