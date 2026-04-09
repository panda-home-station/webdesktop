import { Section, Row } from './shared'

export function NetworkSettings() {
  return (
    <div>
      <Section title="以太网">
        <Row label="接口" value="eth0" />
        <Row label="状态" value={<span style={{ color: '#34c759' }}>已连接</span>} />
        <Row label="IP 地址" value="192.168.1.100" />
        <Row label="MAC 地址" value="00:11:22:33:44:55" border={false} />
      </Section>

      <Section title="DNS">
        <Row label="DNS 服务器" value="自动 (8.8.8.8)" onClick={() => {}} border={false} />
      </Section>
    </div>
  )
}
