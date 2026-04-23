import { useState, useEffect, useCallback } from 'react';
import { colors } from '../../styles/theme';
import { networkService } from '@truenas/services/network';
import { ConfirmDialog } from '@desktop/components/ConfirmDialog';

interface PendingChangesBannerProps {
  onRefresh: () => void;
}

export function PendingChangesBanner({ onRefresh }: PendingChangesBannerProps) {
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [checkinWaiting, setCheckinWaiting] = useState(false);
  const [checkinRemaining, setCheckinRemaining] = useState<number | null>(null);
  const [checkinTimeout, setCheckinTimeout] = useState(60);
  const [isHaEnabled, setIsHaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [showCheckinDialog, setShowCheckinDialog] = useState(false);
  const [affectedServices, setAffectedServices] = useState<string[]>([]);
  const [uniqueIps, setUniqueIps] = useState<string[]>([]);

  const loadStatus = useCallback(async () => {
    try {
      const [pending, checkin, ha] = await Promise.all([
        networkService.hasPendingChanges(),
        networkService.checkinWaiting(),
        networkService.isHaEnabled(),
      ]);
      setHasPendingChanges(pending);
      setIsHaEnabled(ha);
      handleCheckinStatus(checkin);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCheckinStatus = (seconds: number | null) => {
    if (seconds !== null && seconds > 0) {
      setCheckinWaiting(true);
      setCheckinRemaining(Math.round(seconds));
    } else {
      setCheckinWaiting(false);
      setCheckinRemaining(null);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!checkinWaiting || checkinRemaining === null) return;

    const interval = setInterval(() => {
      setCheckinRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          // Reload on timeout
          window.location.reload();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [checkinWaiting, checkinRemaining]);

  const handleCommit = async () => {
    setShowCommitDialog(false);
    try {
      const services = await networkService.getServicesRestartedOnSync();
      if (services.length > 0) {
        const ips: string[] = [];
        const svcs: string[] = [];
        for (const item of services) {
          if (item.service) svcs.push(item.service);
          ips.push(...item.ips);
        }
        setAffectedServices(svcs);
        setUniqueIps([...new Set(ips)]);
      }

      await networkService.commitChanges({ checkin_timeout: checkinTimeout });
      const checkinSeconds = await networkService.checkinWaiting();
      handleCheckinStatus(checkinSeconds);
      onRefresh();
    } catch (error) {
      console.error('Failed to commit changes:', error);
    }
  };

  const handleRollback = async () => {
    setShowRollbackDialog(false);
    try {
      await networkService.rollback();
      setHasPendingChanges(false);
      setCheckinWaiting(false);
      setCheckinRemaining(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to rollback:', error);
    }
  };

  const handleCheckin = async () => {
    setShowCheckinDialog(false);
    try {
      await networkService.checkin();
      setHasPendingChanges(false);
      setCheckinWaiting(false);
      setCheckinRemaining(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to checkin:', error);
    }
  };

  if (loading || !hasPendingChanges) {
    return null;
  }

  return (
    <>
      <div style={{
        background: colors.warning + '15',
        border: `1px solid ${colors.warning}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
      }}>
        {!checkinWaiting ? (
          <div>
            <p style={{ margin: '0 0 12px 0', color: colors.text, fontSize: 14 }}>
              存在未应用的更改。在测试更改之前，网络连接可能会中断。
            </p>
            <p style={{ margin: '0 0 12px 0', color: colors.text, fontSize: 14 }}>
              检查时间（秒）:
              <input
                type="number"
                value={checkinTimeout}
                onChange={(e) => setCheckinTimeout(Number(e.target.value))}
                min={10}
                style={{
                  marginLeft: 8,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  width: 60,
                }}
              />
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, color: colors.text, fontSize: 14 }}>
            等待确认中... {checkinRemaining} 秒后自动还原更改
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!checkinWaiting && (
            <button
              onClick={() => setShowCommitDialog(true)}
              disabled={isHaEnabled}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: colors.primary,
                color: '#fff',
                fontSize: 13,
                cursor: isHaEnabled ? 'not-allowed' : 'pointer',
                opacity: isHaEnabled ? 0.5 : 1,
              }}
            >
              保存并测试
            </button>
          )}
          {checkinWaiting && (
            <button
              onClick={() => setShowCheckinDialog(true)}
              disabled={isHaEnabled}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: colors.primary,
                color: '#fff',
                fontSize: 13,
                cursor: isHaEnabled ? 'not-allowed' : 'pointer',
                opacity: isHaEnabled ? 0.5 : 1,
              }}
            >
              保留更改
            </button>
          )}
          <button
            onClick={() => setShowRollbackDialog(true)}
            disabled={isHaEnabled}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.cardBg,
              color: colors.text,
              fontSize: 13,
              cursor: isHaEnabled ? 'not-allowed' : 'pointer',
              opacity: isHaEnabled ? 0.5 : 1,
            }}
          >
            还原更改
          </button>
        </div>

        {isHaEnabled && (
          <p style={{ margin: '12px 0 0 0', fontSize: 12, color: colors.textSecondary }}>
            高可用性已启用。请通过&quot;故障转移&quot;页面管理网络设置。
          </p>
        )}
      </div>

      <ConfirmDialog
        open={showCommitDialog}
        title="保存并测试"
        message={affectedServices.length > 0
          ? `以下服务将重启: ${affectedServices.join(', ')}\n影响的IP: ${uniqueIps.join(', ')}`
          : '确定要保存并测试更改吗？'
        }
        confirmText="保存并测试"
        onConfirm={handleCommit}
        onCancel={() => setShowCommitDialog(false)}
      />

      <ConfirmDialog
        open={showRollbackDialog}
        title="还原更改"
        message="确定要还原所有挂起的更改吗？"
        confirmText="还原"
        onConfirm={handleRollback}
        onCancel={() => setShowRollbackDialog(false)}
      />

      <ConfirmDialog
        open={showCheckinDialog}
        title="保留更改"
        message={affectedServices.length > 0
          ? `以下服务已重启: ${affectedServices.join(', ')}\n影响的IP: ${uniqueIps.join(', ')}`
          : '确定要保留更改吗？'
        }
        confirmText="保留"
        onConfirm={handleCheckin}
        onCancel={() => setShowCheckinDialog(false)}
      />
    </>
  );
}