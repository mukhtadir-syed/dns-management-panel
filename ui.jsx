/** @jsx React.createElement */
// Shared UI: Toast, Modal, Toggle, Skeleton, CopyButton, Spinner

function Spinner({ size = 12 }) {
  const s = size === 'lg' ? 'spinner lg' : 'spinner';
  return <span className={s} />;
}

function CopyButton({ text, label = 'Copy', size = 'sm' }) {
  const [copied, setCopied] = React.useState(false);
  const onClick = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className={'copy-btn ' + (copied ? 'copied' : '')} onClick={onClick}>
      {copied ? <Icon.Check /> : <Icon.Copy />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}

function Toast({ toast, onClose }) {
  const icon = toast.kind === 'error'
    ? <span style={{ color: 'var(--danger)' }}><Icon.Alert size={14} /></span>
    : <span style={{ color: 'var(--success)' }}><Icon.CheckCircle size={14} /></span>;
  return (
    <div className={'toast ' + (toast.kind || 'success')}>
      <span className="toast-icon">{icon}</span>
      <div className="toast-body">
        <div className="toast-title">{toast.title}</div>
        {toast.desc && <div className="toast-desc">{toast.desc}</div>}
      </div>
      <button className="close" onClick={onClose} aria-label="Close"><Icon.X /></button>
    </div>
  );
}

function ToastStack({ toasts, onClose }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => <Toast key={t.id} toast={t} onClose={() => onClose(t.id)} />)}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, kind: 'success', ...t }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, 4000);
  }, []);
  const close = (id) => setToasts(prev => prev.filter(x => x.id !== id));
  return { toasts, push, close };
}

function Modal({ children, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ on, loading, onClick }) {
  return (
    <button
      className={'toggle ' + (on ? 'on ' : '') + (loading ? 'loading' : '')}
      onClick={loading ? undefined : onClick}
      role="switch"
      aria-checked={on}
      disabled={loading}
    >
      {loading && (
        <span style={{
          position:'absolute', top: '50%', left: on ? 'calc(100% - 18px)' : '6px',
          transform: 'translate(-50%, -50%)', color: on ? 'white' : 'var(--text-muted)'
        }}>
          <Spinner />
        </span>
      )}
    </button>
  );
}

function Skeleton({ width = '100%', height = 12, style = {} }) {
  return <span className="skeleton" style={{ width, height, display: 'block', ...style }} />;
}

Object.assign(window, { Spinner, CopyButton, Toast, ToastStack, useToasts, Modal, Toggle, Skeleton });
