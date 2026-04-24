/**
 * Interface Form Dialog Component
 * Create/Edit network interface
 */

import React, { useState, useEffect } from 'react'
import { X, Plus, AlertCircle } from 'lucide-react'
import { networkService } from '@truenas/services/network'
import { Modal } from '@desktop/components/Modal'
import type { NetworkInterface } from '@truenas/types/network-types'
import { NetworkInterfaceType as InterfaceType } from '@truenas/types/network-types'

const colors2 = {
  primary: '#0066cc',
  primaryLight: '#e6f0fa',
  primaryDark: '#004999',
  danger: '#dc3545',
  dangerLight: '#fceaea',
  warning: '#ff9500',
  success: '#34c759',
  successLight: '#e8f8ed',
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  background: '#f5f5f7',
  cardBg: '#ffffff',
  border: '#e5e5ea',
  borderHover: '#ccc',
  shadow: '0 2px 8px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 16px rgba(0,0,0,0.12)',
}

interface InterfaceFormDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editInterface?: NetworkInterface | null
  _existingInterfaces?: NetworkInterface[]
}

interface FormData {
  type: InterfaceType
  name: string
  description: string
  ipv4_dhcp: boolean
  ipv6_auto: boolean
  aliases: Array<{ address: string; netmask: number; type: 'INET' | 'INET6' }>
  mtu: string
  bridge_members: string[]
  enable_learning: boolean
  lag_protocol: string
  lag_ports: string[]
  xmit_hash_policy: string
  lacpdu_rate: string
  vlan_parent_interface: string
  vlan_tag: string
  vlan_pcp: string
}

const emptyForm: FormData = {
  type: InterfaceType.Bridge,
  name: '',
  description: '',
  ipv4_dhcp: false,
  ipv6_auto: false,
  aliases: [],
  mtu: '',
  bridge_members: [],
  enable_learning: false,
  lag_protocol: 'LACP',
  lag_ports: [],
  xmit_hash_policy: 'LAYER2',
  lacpdu_rate: 'FAST',
  vlan_parent_interface: '',
  vlan_tag: '',
  vlan_pcp: '0',
}

const lagProtocols = [
  { label: 'LACP', value: 'LACP' },
  { label: 'Failover', value: 'FAILOVER' },
  { label: 'Load Balance', value: 'LOAD_BALANCE' },
  { label: 'Round Robin', value: 'ROUND_ROBIN' },
]

const xmitPolicies = [
  { label: 'Layer 2', value: 'LAYER2' },
  { label: 'Layer 2+3', value: 'LAYER2+3' },
  { label: 'Layer 3+4', value: 'LAYER3+4' },
]

const lacpduRates = [
  { label: 'Fast', value: 'FAST' },
  { label: 'Slow', value: 'SLOW' },
]

const typeHelpText: Record<string, string> = {
  [InterfaceType.Bridge]: '在多个网络之间创建逻辑链接',
  [InterfaceType.LinkAggregation]: '将多个网络连接合并到一个接口中',
  [InterfaceType.Vlan]: '分开并隔离连接段',
}

export function InterfaceFormDialog({
  open,
  onClose,
  onSaved,
  editInterface,
  _existingInterfaces = [],
}: InterfaceFormDialogProps) {
  const [form, setForm] = useState<FormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bridgeMembers, setBridgeMembers] = useState<Array<{ label: string; value: string }>>([])
  const [lagPorts, setLagPorts] = useState<Array<{ label: string; value: string }>>([])
  const [vlanParents, setVlanParents] = useState<Array<{ label: string; value: string }>>([])

  const isNew = !editInterface

  useEffect(() => {
    if (!open) return

    const loadChoices = async () => {
      setLoading(true)
      try {
        const interfaces = await networkService.queryInterfaces()
        const physicalIfaces = interfaces.filter(
          (i: NetworkInterface) => i.type === InterfaceType.Physical
        )

        const mapToOptions = (ifaces: NetworkInterface[]) =>
          ifaces.map((i: NetworkInterface) => ({ label: i.name, value: i.name }))

        setBridgeMembers(mapToOptions(physicalIfaces))
        setLagPorts(mapToOptions(physicalIfaces))
        setVlanParents(mapToOptions(interfaces.filter((i: NetworkInterface) => i.type === InterfaceType.Physical)))
      } catch (err) {
        console.error('Failed to load choices:', err)
      } finally {
        setLoading(false)
      }
    }

    loadChoices()
  }, [open])

  useEffect(() => {
    if (editInterface) {
      setForm({
        type: editInterface.type,
        name: editInterface.name,
        description: editInterface.description || '',
        ipv4_dhcp: editInterface.ipv4_dhcp,
        ipv6_auto: editInterface.ipv6_auto,
        aliases:
          editInterface.aliases?.map((a) => ({
            address: a.address,
            netmask: a.netmask || 24,
            type: (a.type as 'INET' | 'INET6') || 'INET',
          })) || [],
        mtu: editInterface.mtu?.toString() || '',
        bridge_members: [],
        enable_learning: false,
        lag_protocol: 'LACP',
        lag_ports: [],
        xmit_hash_policy: 'LAYER2',
        lacpdu_rate: 'FAST',
        vlan_parent_interface: '',
        vlan_tag: '',
        vlan_pcp: '0',
      })
    } else {
      setForm(emptyForm)
    }
  }, [editInterface])

  const handleChange = (field: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addAlias = () => {
    handleChange('aliases', [...form.aliases, { address: '', netmask: 24, type: 'INET' as const }])
  }

  const updateAlias = (index: number, field: string, value: string | number) => {
    const newAliases = [...form.aliases]
    newAliases[index] = { ...newAliases[index], [field]: value }
    handleChange('aliases', newAliases)
  }

  const removeAlias = (index: number) => {
    handleChange('aliases', form.aliases.filter((_, i) => i !== index))
  }

  const toggleArrayItem = (field: 'bridge_members' | 'lag_ports', value: string) => {
    const current = form[field]
    if (current.includes(value)) {
      handleChange(field, current.filter((v) => v !== value))
    } else {
      handleChange(field, [...current, value])
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)

    try {
      const params: Record<string, unknown> = {
        type: form.type,
        name: form.name,
        description: form.description,
        ipv4_dhcp: form.ipv4_dhcp,
        ipv6_auto: form.ipv6_auto,
        mtu: form.mtu ? parseInt(form.mtu) : undefined,
      }

      if (form.aliases.length > 0 && !form.ipv4_dhcp) {
        params.aliases = form.aliases.map((a) => ({
          type: a.type,
          address: a.address,
          netmask: a.netmask,
        }))
      }

      if (form.type === InterfaceType.Bridge) {
        params.bridge_members = form.bridge_members
        params.enable_learning = form.enable_learning
      }

      if (form.type === InterfaceType.LinkAggregation) {
        params.lag_protocol = form.lag_protocol
        params.lag_ports = form.lag_ports
        params.xmit_hash_policy = form.xmit_hash_policy
        params.lacpdu_rate = form.lacpdu_rate
      }

      if (form.type === InterfaceType.Vlan) {
        params.vlan_parent_interface = form.vlan_parent_interface
        params.vlan_tag = parseInt(form.vlan_tag)
        if (form.vlan_pcp) params.vlan_pcp = parseInt(form.vlan_pcp)
      }

      if (isNew) {
        await networkService.createInterface(params)
      } else {
        await networkService.updateInterface(editInterface!.id, params)
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save interface:', err)
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (saving) return
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isNew ? '添加接口' : '编辑接口'}
      width={720}
      bodyStyle={{ padding: 0 }}
      headerExtra={
        <button onClick={handleClose} style={styles.closeButton}>
          <X size={18} />
        </button>
      }
    >
      <div style={styles.container}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <span>加载中...</span>
          </div>
        ) : (
          <>
            <div style={styles.formBody}>
              {/* Left Column - Basic Settings */}
              <div style={styles.column}>
                {isNew && (
                  <div style={styles.section}>
                    <div style={styles.fieldRow}>
                      <span style={styles.labelInline}>接口类型</span>
                      <select
                        value={form.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        style={styles.typeSelectInline}
                      >
                        <option value={InterfaceType.Bridge}>网桥</option>
                        <option value={InterfaceType.LinkAggregation}>链路聚合</option>
                        <option value={InterfaceType.Vlan}>VLAN</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Basic Info Row */}
                <div style={styles.compactSection}>
                  <div style={styles.fieldRow}>
                    <span style={styles.labelInline}>名称</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      style={{
                        ...styles.input,
                        ...(!isNew ? styles.inputDisabled : {}),
                      }}
                      placeholder="例如: eth0"
                      readOnly={!isNew}
                    />
                  </div>

                  <div style={styles.fieldRow}>
                    <span style={styles.labelInline}>MTU</span>
                    <input
                      type="number"
                      value={form.mtu}
                      onChange={(e) => handleChange('mtu', e.target.value)}
                      style={styles.input}
                      placeholder="1500"
                      min={576}
                      max={9216}
                    />
                  </div>

                  <div style={styles.fieldRow}>
                    <span style={styles.labelInline}>描述</span>
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      style={styles.input}
                      placeholder="可选描述"
                    />
                  </div>
                </div>

                {/* IP Settings - Compact Toggle Pills */}
                <div style={{ ...styles.section, marginTop: 12 }}>
                  <div style={styles.fieldRow}>
                    <span style={styles.labelInline}>IP 配置</span>
                    <div style={styles.togglePills}>
                      <label style={{
                        ...styles.togglePill,
                        ...(form.ipv4_dhcp ? styles.togglePillActive : {}),
                      }}>
                        <input
                          type="checkbox"
                          checked={form.ipv4_dhcp}
                          onChange={(e) => handleChange('ipv4_dhcp', e.target.checked)}
                          style={styles.hiddenInput}
                        />
                        <span>DHCP</span>
                      </label>
                      <label style={{
                        ...styles.togglePill,
                        ...(form.ipv6_auto ? styles.togglePillActive : {}),
                      }}>
                        <input
                          type="checkbox"
                          checked={form.ipv6_auto}
                          onChange={(e) => handleChange('ipv6_auto', e.target.checked)}
                          style={styles.hiddenInput}
                        />
                        <span>IPv6 自动</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Static IPs - Compact */}
                {!form.ipv4_dhcp && (
                  <div style={styles.section}>
                    <div style={styles.staticIpHeader}>
                      <span style={styles.sectionLabel}>静态 IP</span>
                      <button onClick={addAlias} style={styles.addButtonSmall}>
                        <Plus size={12} />
                        添加
                      </button>
                    </div>
                    <div style={styles.aliasList}>
                      {form.aliases.map((alias, i) => (
                        <div key={i} style={styles.aliasCompactRow}>
                          <select
                            value={alias.type}
                            onChange={(e) => updateAlias(i, 'type', e.target.value)}
                            style={styles.aliasTypeSelectSmall}
                          >
                            <option value="INET">IPv4</option>
                            <option value="INET6">IPv6</option>
                          </select>
                          <input
                            type="text"
                            value={alias.address}
                            onChange={(e) => updateAlias(i, 'address', e.target.value)}
                            style={styles.aliasInputCompact}
                            placeholder="192.168.1.100/24"
                          />
                          <button onClick={() => removeAlias(i)} style={styles.removeButtonSmall}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Type-specific Settings */}
              <div style={styles.columnRight}>
                {isNew && (
                  <div style={styles.typeHelpCard}>
                    <div style={styles.sectionLabel}>类型说明</div>
                    <div style={styles.typeHelp}>
                      {typeHelpText[form.type]}
                    </div>
                  </div>
                )}

                {form.type === InterfaceType.Bridge && (
                  <div style={styles.section}>
                    <div style={styles.fieldRow}>
                      <span style={styles.labelInline}>网桥成员</span>
                      <div style={styles.checkboxGroupInline}>
                        {bridgeMembers.length === 0 ? (
                          <span style={styles.noData}>无可用接口</span>
                        ) : (
                          bridgeMembers.map((member) => (
                            <label key={member.value} style={styles.checkboxItem}>
                              <input
                                type="checkbox"
                                checked={form.bridge_members.includes(member.value)}
                                onChange={() => toggleArrayItem('bridge_members', member.value)}
                                style={styles.checkbox}
                              />
                              <span style={styles.checkboxLabel}>{member.label}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {form.type === InterfaceType.LinkAggregation && (
                  <div style={styles.section}>
                    <div style={styles.fieldRow}>
                      <span style={styles.labelInline}>聚合协议</span>
                      <select
                        value={form.lag_protocol}
                        onChange={(e) => handleChange('lag_protocol', e.target.value)}
                        style={styles.input}
                      >
                        {lagProtocols.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.fieldRow}>
                      <span style={styles.labelInline}>成员接口</span>
                      <div style={styles.checkboxGroupInline}>
                        {lagPorts.length === 0 ? (
                          <span style={styles.noData}>无可用接口</span>
                        ) : (
                          lagPorts.map((port) => (
                            <label key={port.value} style={styles.checkboxItem}>
                              <input
                                type="checkbox"
                                checked={form.lag_ports.includes(port.value)}
                                onChange={() => toggleArrayItem('lag_ports', port.value)}
                                style={styles.checkbox}
                              />
                              <span style={styles.checkboxLabel}>{port.label}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    {['LACP', 'LOAD_BALANCE'].includes(form.lag_protocol) && (
                      <div style={styles.fieldRow}>
                        <span style={styles.labelInline}>传输哈希</span>
                        <select
                          value={form.xmit_hash_policy}
                          onChange={(e) => handleChange('xmit_hash_policy', e.target.value)}
                          style={styles.input}
                        >
                          {xmitPolicies.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {form.lag_protocol === 'LACP' && (
                      <div style={styles.fieldRow}>
                        <span style={styles.labelInline}>LACPDU</span>
                        <select
                          value={form.lacpdu_rate}
                          onChange={(e) => handleChange('lacpdu_rate', e.target.value)}
                          style={styles.input}
                        >
                          {lacpduRates.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {form.type === InterfaceType.Vlan && (
                  <div style={styles.section}>
                    <div style={styles.fieldRow}>
                      <span style={styles.labelInline}>父接口</span>
                      <select
                        value={form.vlan_parent_interface}
                        onChange={(e) => handleChange('vlan_parent_interface', e.target.value)}
                        style={styles.input}
                      >
                        <option value="">选择接口</option>
                        {vlanParents.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.fieldRow}>
                      <span style={styles.labelInline}>VLAN Tag</span>
                      <input
                        type="number"
                        value={form.vlan_tag}
                        onChange={(e) => handleChange('vlan_tag', e.target.value)}
                        style={styles.input}
                        placeholder="1-4094"
                        min={1}
                        max={4094}
                      />
                    </div>

                    <div style={styles.fieldRow}>
                      <span style={styles.labelInline}>优先级</span>
                      <select
                        value={form.vlan_pcp}
                        onChange={(e) => handleChange('vlan_pcp', e.target.value)}
                        style={styles.input}
                      >
                        {Array.from({ length: 8 }, (_, i) => (
                          <option key={i} value={i.toString()}>{i}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}


                {error && (
                  <div style={styles.error}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button onClick={handleClose} style={styles.cancelButton} disabled={saving}>
            取消
          </button>
          <button
            onClick={handleSubmit}
            style={styles.saveButton}
            disabled={saving || !form.name || (!isNew && !editInterface)}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: '80vh',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    color: colors2.textSecondary,
  },
  formBody: {
    display: 'flex',
    gap: 20,
    padding: '16px 20px 20px',
    overflowY: 'auto' as const,
    flex: 1,
    borderTop: `1px solid ${colors2.border}`,
  },
  column: {
    flex: 1,
    minWidth: 0,
    paddingTop: 12,
  },
  columnRight: {
    flex: 1,
    minWidth: 0,
    paddingTop: 12,
    borderLeft: `1px solid ${colors2.border}`,
    paddingLeft: 20,
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 60,
    color: colors2.textSecondary,
  },
  spinner: {
    width: 32,
    height: 32,
    border: `3px solid ${colors2.border}`,
    borderTopColor: colors2.primary,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  section: {
    marginBottom: 14,
  },
  typeHelpCard: {
    background: colors2.cardBg,
    border: `1px solid ${colors2.border}`,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: colors2.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 8,
  },
  staticIpHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  field: {
    marginBottom: 14,
    flex: 1,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: colors2.text,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 14,
    border: `1px solid ${colors2.border}`,
    borderRadius: 10,
    outline: 'none',
    color: colors2.text,
    background: colors2.cardBg,
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputDisabled: {
    background: colors2.background,
    color: colors2.textTertiary,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${colors2.border}`,
    borderRadius: 10,
    outline: 'none',
    color: colors2.text,
    background: colors2.cardBg,
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  fieldRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center' as const,
  },
  labelInline: {
    display: 'block',
    width: 70,
    fontSize: 13,
    fontWeight: 500,
    color: colors2.text,
    flexShrink: 0,
  },
  typeSelectInline: {
    flex: 1,
    padding: '10px 12px',
    fontSize: 14,
    fontWeight: 500,
    border: `1px solid ${colors2.border}`,
    borderRadius: 10,
    outline: 'none',
    color: colors2.text,
    background: colors2.cardBg,
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
  },
  typeHelp: {
    fontSize: 12,
    color: colors2.textSecondary,
    marginTop: 10,
    padding: '10px 14px',
    background: colors2.background,
    borderRadius: 10,
    lineHeight: 1.5,
  },
  compactSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  togglePills: {
    display: 'flex',
    gap: 8,
  },
  togglePill: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 14px',
    background: colors2.background,
    border: `1px solid ${colors2.border}`,
    borderRadius: 20,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: colors2.textSecondary,
    transition: 'all 0.2s',
  },
  togglePillActive: {
    background: colors2.primaryLight,
    borderColor: colors2.primary,
    color: colors2.primary,
  },
  hiddenInput: {
    display: 'none',
  },
  aliasList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  aliasCompactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  aliasInputCompact: {
    flex: 1,
    padding: '8px 10px',
    fontSize: 13,
    border: `1px solid ${colors2.border}`,
    borderRadius: 10,
    outline: 'none',
    color: colors2.text,
    fontFamily: 'monospace',
    background: colors2.cardBg,
  },
  aliasTypeSelectSmall: {
    padding: '8px',
    fontSize: 12,
    border: `1px solid ${colors2.border}`,
    borderRadius: 10,
    outline: 'none',
    color: colors2.text,
    background: colors2.cardBg,
    cursor: 'pointer',
  },
  removeButtonSmall: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    color: colors2.textSecondary,
    transition: 'color 0.2s',
  },
  addButtonSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    background: 'transparent',
    border: `1.5px dashed ${colors2.primary}`,
    borderRadius: 20,
    cursor: 'pointer',
    color: colors2.primary,
    transition: 'all 0.2s',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  checkboxGroupInline: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    background: colors2.background,
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: colors2.primary,
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colors2.text,
    fontWeight: 500,
  },
  noData: {
    fontSize: 13,
    color: colors2.textTertiary,
    padding: '10px 0',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    background: colors2.dangerLight,
    color: colors2.danger,
    borderRadius: 12,
    fontSize: 13,
    marginTop: 8,
    fontWeight: 500,
  },
  footer: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    padding: '12px 20px',
    borderTop: `1px solid ${colors2.border}`,
    background: colors2.background,
  },
  cancelButton: {
    padding: '9px 20px',
    fontSize: 14,
    background: colors2.cardBg,
    border: `1px solid ${colors2.border}`,
    borderRadius: 10,
    cursor: 'pointer',
    color: colors2.text,
    fontWeight: 500,
  },
  saveButton: {
    padding: '9px 24px',
    fontSize: 14,
    fontWeight: 600,
    background: colors2.primary,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(0,102,204,0.3)',
  },
}
