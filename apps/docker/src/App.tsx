/**
 * Docker Application
 * Container management for WebDesktop
 */

import { useEffect } from 'react';
import { TabsLayout, TabItem } from '@desktop/layouts/TabsLayout';
import { ContainerImages } from './components/ContainerImages';
import { DockerRegistries } from './components/DockerRegistries';
import { useDockerStore } from '@truenas/stores/docker';

export default function Docker() {
  const { status: dockerStatus, initialize: initDocker } = useDockerStore();

  useEffect(() => {
    initDocker();
  }, [initDocker]);

  const tabs: TabItem[] = [
    {
      id: 'images',
      label: 'Images',
      content: <ContainerImages />,
    },
    {
      id: 'registries',
      label: 'Registries',
      content: <DockerRegistries />,
    },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Docker</h1>
          <div style={styles.dockerStatus}>
            <span
              style={{
                ...styles.statusDot,
                backgroundColor:
                  dockerStatus.status === 'RUNNING' ? '#4caf50' : '#9e9e9e',
              }}
            />
            <span style={styles.statusText}>
              Docker {dockerStatus.status === 'RUNNING' ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div style={styles.content}>
        <TabsLayout items={tabs} defaultActiveId="images" />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  dockerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};