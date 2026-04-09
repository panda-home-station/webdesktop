import { useState } from 'react'
import { Section, Row, Switch } from './shared'

export function RemoteAccess() {
  const [sshEnabled, setSshEnabled] = useState(true)
  const [vncEnabled, setVncEnabled] = useState(false)

  return (
    <div>
      <Section title="终端服务" footer="允许通过 SSH 协议访问系统终端。请确保使用强密码。">
        <Row
          label="SSH"
          value={<Switch checked={sshEnabled} onChange={setSshEnabled} />}
          border={false}
        />
      </Section>

      <Section title="桌面共享" footer="允许通过 VNC 客户端查看和控制系统桌面。">
        <Row
          label="VNC 远程桌面"
          value={<Switch checked={vncEnabled} onChange={setVncEnabled} />}
          border={false}
        />
      </Section>
    </div>
  )
}
