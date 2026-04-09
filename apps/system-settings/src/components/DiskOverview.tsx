import { Section, Row } from './shared'

export function DiskOverview() {
  return (
    <div>
      <Section title="物理硬盘">
        <Row label="Disk 1 (NVMe)" value="Samsung 980 PRO 1TB" onClick={() => {}} />
        <Row label="Disk 2 (SATA)" value="WD Red Plus 4TB" onClick={() => {}} />
        <Row label="Disk 3 (SATA)" value="WD Red Plus 4TB" border={false} />
      </Section>
      <Section title="RAID 阵列">
        <Row label="RAID 模式" value="RAID 1 (镜像)" />
        <Row label="状态" value={<span style={{ color: '#34c759' }}>健康</span>} border={false} />
      </Section>
    </div>
  )
}
