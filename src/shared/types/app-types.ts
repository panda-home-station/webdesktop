/**
 * App Types
 * Type definitions for Docker Apps functionality
 */

// App States
export type AppState = 'RUNNING' | 'DEPLOYING' | 'STOPPED' | 'CRASHED' | 'UNKNOWN';

// Docker Config
export interface DockerConfig {
  pool: string | null;
  overwrite_committed_images: boolean;
  auto_backup: boolean;
  autoUpgrade: boolean;
  latest_applications_container_image_update: boolean;
  enable_image_updates: boolean;
}

export interface DockerStatusData {
  status: DockerStatus | null;
  description: string | null;
}

export type DockerStatus = 'RUNNING' | 'STOPPED' | 'ERROR' | 'INITIALIZING';

// Installed App
export interface App {
  id: string;
  name: string;
  state: AppState;
  upgrade_available: boolean;
  version: string;
  latest_version: string;
  metadata: AppMetadata;
  used_ports: AppPort[];
  volumes: AppVolume[];
  environment: Record<string, string>;
  pods: AppPod[];
  control_port: number;
  chart_sources: string[];
  custom_compose_config: string | null;
  portals: Record<string, string>;
}

export interface AppMetadata {
  name: string;
  version: string;
  description: string;
  train: string;
  catalog: string;
  icon: string | null;
  app_readme: string | null;
  human_version: string;
  last_update: string;
  maintainers: { name: string; email: string }[];
  tags: string[];
  screenhots: string[];
  sources: string[];
  recommended: boolean;
}

export interface AppPort {
  host: number;
  container: number;
  protocol: string;
}

export interface AppVolume {
  type: string;
  source: string;
  destination: string;
  mode: string;
}

export interface AppPod {
  id: string;
  name: string;
  status: string;
  containers: AppContainer[];
}

export interface AppContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  reason: string;
}

// Available App (from catalog)
export interface AvailableApp {
  name: string;
  title: string;
  description: string;
  catalog: string;
  train: string;
  categories: string[];
  icon_url: string | null;
  latest_version: string | null;
  latest_human_version: string | null;
  version: string;
  recommended: boolean;
  app_readme: string | null;
  maintainers: { name: string; email: string }[];
  tags: string[];
  sources: string[];
}

// Container Image
export interface ContainerImage {
  id: string;
  repo_tags: string[];
  repo_digests: string[];
  created: string;
  size: number;
  is_official: boolean;
}

// Docker Registry
export interface DockerRegistry {
  id: string;
  name: string;
  url: string;
  certificate: string | null;
  password: string | null;
  username: string | null;
  verify_cert: boolean;
}

// App Stats
export interface AppNetworkStats {
  interface_name: string;
  rx_bytes: number;
  tx_bytes: number;
}

export interface AppStats {
  app_name: string;
  cpu_usage: number;
  memory: number;
  networks: AppNetworkStats[];
  blkio: {
    read: number;
    write: number;
  };
}

// Job
export interface Job<T = unknown> {
  id: number;
  method: string;
  arguments: unknown[];
  progress: {
    percent: number;
    description?: string;
  };
  state: 'WAITING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ABORTED';
  result: T | null;
  error: string | null;
  exception: string | null;
  exc_info: {
    type: string;
    message: string;
    trace: string;
  } | null;
  time_started: string | null;
  time_finished: string | null;
}

// Pool
export interface Pool {
  id: number;
  guid: string;
  name: string;
  path: string;
  status: string;
  topology: unknown;
  is_upgraded: boolean;
  scan: unknown;
}

// API Query Options
export interface QueryParams {
  filters?: unknown[][];
  options?: {
    order_by?: string[];
    limit?: number;
    offset?: number;
    count?: boolean;
    get?: boolean;
    extra?: Record<string, unknown>;
  };
}

// Chart Schema Types
export interface ChartSchemaNodeConf {
  type: string;
  required?: boolean;
  default?: unknown;
  enum?: { value: string; description: string }[];
  max_length?: number;
  min_length?: number;
  min?: number;
  max?: number;
  editable?: boolean;
  immutable?: boolean;
  hidden?: boolean;
  show_if?: string[][];
  subquestions?: ChartSchemaNode[];
  items?: ChartSchemaNode[];
}

export interface ChartSchemaNode {
  group?: string;
  label: string;
  description?: string;
  schema: ChartSchemaNodeConf;
  variable: string;
}

export interface ChartSchemaGroup {
  name: string;
  description: string;
}

export interface ChartSchema {
  app_metadata?: Record<string, unknown>;
  readme?: string;
  changelog?: string;
  schema: {
    groups: ChartSchemaGroup[];
    questions: ChartSchemaNode[];
  };
  values?: Record<string, ChartFormValue>;
}

export type ChartFormValue = string | number | boolean | Record<string, unknown> | ChartFormValue[] | null;

// App Create
export interface AppCreate {
  values?: Record<string, ChartFormValue>;
  app_name: string;
  catalog_app: string;
  train: string;
  version?: string;
  custom_compose_config_string?: string;
  custom_app?: boolean;
}

// Catalog App (from catalog.get_app_details)
export interface CatalogApp {
  name: string;
  title?: string;
  description?: string;
  categories: string[];
  icon_url?: string;
  app_readme?: string;
  maintainers: { name: string; email: string }[];
  tags: string[];
  recommended: boolean;
  versions: Record<string, {
    healthy: boolean;
    schema: ChartSchema;
  }>;
  latest_version?: string;
  schema?: ChartSchema;  // Top-level schema used by webui
}