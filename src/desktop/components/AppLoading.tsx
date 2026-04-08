export default function AppLoading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: '#ffffff',
          fontSize: 14,
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '16px 24px',
          borderRadius: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="spinner" />
        <span>加载中...</span>
      </div>
    </div>
  )
}
