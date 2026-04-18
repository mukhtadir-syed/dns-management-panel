/** @jsx React.createElement */
// RecordRow + EditRow — inline editing form for records

function TypeBadge({ type }) {
  return <span className="type-badge" data-t={type}>{type}</span>;
}

function formatValue(rec) {
  if (rec.type === 'MX') return <span><span className="dim">{rec.priority} </span>{rec.value}</span>;
  return rec.value;
}

function RecordRow({ rec, isFlashing, onEdit, onDelete }) {
  return (
    <tr className={isFlashing ? 'flash' : ''}>
      <td data-label="Type"><TypeBadge type={rec.type} /></td>
      <td data-label="Name" className="name-cell mono">{rec.name === '@' ? <span><span style={{color:'var(--text-subtle)'}}>@</span> <span style={{color:'var(--text-subtle)'}}>({DOMAIN})</span></span> : rec.name}</td>
      <td data-label="Value" className="value-cell mono">{formatValue(rec)}</td>
      <td data-label="TTL" className="ttl-cell">{ttlLabel(rec.ttl)}</td>
      <td className="action-cell">
        <button className="btn ghost" onClick={() => onEdit(rec.id)} title="Edit"><Icon.Edit /></button>
        <button className="btn ghost" onClick={() => onDelete(rec.id)} title="Delete"><Icon.Trash /></button>
      </td>
    </tr>
  );
}

function EditRow({ draft, setDraft, errors, onSave, onCancel, isSaving, apiError, onRetry }) {
  const showPriority = hasPriorityField(draft.type);
  const update = (k, v) => setDraft({ ...draft, [k]: v });

  const colSpan = 5;
  return (
    <React.Fragment>
      <tr className="edit-row">
        <td colSpan={colSpan}>
          <div className={'edit-form' + (showPriority ? ' has-priority' : '')}>
            <div className="field">
              <label>Type</label>
              <select
                className={'select' + (errors.type ? ' err' : '')}
                value={draft.type}
                onChange={e => {
                  const t = e.target.value;
                  setDraft({ ...draft, type: t, priority: hasPriorityField(t) ? (draft.priority ?? 10) : undefined });
                }}
              >
                {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {showPriority && (
              <div className="field">
                <label>Priority</label>
                <input
                  className={'input mono' + (errors.priority ? ' err' : '')}
                  type="number"
                  min="0" max="65535"
                  value={draft.priority ?? ''}
                  onChange={e => update('priority', e.target.value)}
                />
                {errors.priority && <span className="inline-error"><Icon.Alert />{errors.priority}</span>}
              </div>
            )}

            <div className="field">
              <label>Name</label>
              <div className={'input-suffix' + (errors.name ? ' err' : '')}>
                <input
                  value={draft.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="@, www, api..."
                  spellCheck={false}
                  autoFocus
                />
                <span className="suffix">.{DOMAIN}</span>
              </div>
              {errors.name ? (
                <span className="inline-error"><Icon.Alert />{errors.name}</span>
              ) : (
                <span className="hint">@ = {DOMAIN}</span>
              )}
            </div>

            <div className="field">
              <label>Value</label>
              <input
                className={'input mono' + (errors.value ? ' err' : '')}
                value={draft.value}
                onChange={e => update('value', e.target.value)}
                placeholder={placeholderFor(draft.type)}
                spellCheck={false}
              />
              {errors.value ? (
                <span className="inline-error"><Icon.Alert />{errors.value}</span>
              ) : (
                <span className="hint">{TYPE_DESC[draft.type]}</span>
              )}
            </div>

            <div className="field">
              <label>TTL</label>
              <select
                className={'select' + (errors.ttl ? ' err' : '')}
                value={draft.ttl}
                onChange={e => update('ttl', Number(e.target.value))}
              >
                {TTL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="edit-actions">
              <button className="btn" onClick={onCancel} disabled={isSaving}>Cancel</button>
              <button className="btn primary" onClick={onSave} disabled={isSaving}>
                {isSaving && <Spinner />}
                {isSaving ? 'Saving' : 'Save'}
              </button>
            </div>
          </div>

          {apiError && (
            <div className="form-banner">
              <span style={{ color: 'var(--danger)', marginTop: 1 }}><Icon.Alert size={14} /></span>
              <div className="banner-text">
                <strong>Could not save record.</strong>{' '}
                {apiError}
              </div>
              <button className="btn sm" onClick={onRetry}>
                <Icon.Refresh /> Retry
              </button>
            </div>
          )}
          {/* Spacer so banner doesn't hug the bottom */}
          {apiError && <div style={{ height: 12 }} />}
        </td>
      </tr>
    </React.Fragment>
  );
}

function placeholderFor(t) {
  switch (t) {
    case 'A': return '192.0.2.1';
    case 'AAAA': return '2001:db8::1';
    case 'CNAME': case 'ALIAS': return 'target.example.com.';
    case 'MX': return 'mx1.example.com.';
    case 'TXT': return 'v=spf1 include:_spf.example.com ~all';
    case 'SRV': return '10 60 5060 sipserver.example.com.';
    case 'CAA': return '0 issue "letsencrypt.org"';
    case 'NS': return 'ns1.example.com.';
    default: return '';
  }
}

Object.assign(window, { RecordRow, EditRow, TypeBadge });
