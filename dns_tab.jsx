/** @jsx React.createElement */
// DNS tab — name servers + records table with full state management

function NameServers({ loading }) {
  return (
    <div className="section">
      <div className="section-head">
        <div>
          <div className="section-title"><Icon.Server /> Name servers</div>
          <div className="section-desc" style={{ marginTop: 3 }}>
            Set these at your domain registrar to point {DOMAIN} to our DNS.
          </div>
        </div>
      </div>
      <div className="section-body">
        <div className="ns-grid">
          <div>
            <div className="ns-list">
              {loading ? (
                Array.from({length: 4}).map((_, i) => (
                  <div className="ns-row" key={i}>
                    <span className="ns-index">ns{i+1}</span>
                    <Skeleton width="62%" height={13} />
                    <Skeleton width={58} height={22} style={{ borderRadius: 4 }} />
                  </div>
                ))
              ) : NAMESERVERS.map((ns, i) => (
                <div className="ns-row" key={ns}>
                  <span className="ns-index">ns{i+1}</span>
                  <span className="ns-value">{ns}</span>
                  <CopyButton text={ns} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="ns-instructions">
              <strong style={{ color: 'var(--text)' }}>How to update name servers</strong>
              <ol>
                <li>Log in at your domain registrar</li>
                <li>Find the <strong>Nameservers</strong> or <strong>DNS</strong> section</li>
                <li>Replace any existing entries with the four above</li>
                <li>Save — propagation can take up to 24 hours</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon.Records size={20} /></div>
      <div className="empty-title">No DNS records yet</div>
      <div className="empty-desc">
        Add an A, CNAME, MX or TXT record to start routing traffic for {DOMAIN}.
      </div>
      <button className="btn primary" onClick={onAdd}>
        <Icon.Plus /> Add your first record
      </button>
    </div>
  );
}

function SkeletonTable({ rows = 8 }) {
  return (
    <table className="rec-table">
      <thead>
        <tr>
          <th style={{width: 80}}>Type</th>
          <th>Name</th>
          <th>Value</th>
          <th style={{width: 110}}>TTL</th>
          <th style={{width: 80}} className="action-cell">Action</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({length: rows}).map((_, i) => (
          <tr key={i}>
            <td><Skeleton width={48} height={18} style={{ borderRadius: 4 }} /></td>
            <td><Skeleton width={`${50 + (i*7) % 30}%`} /></td>
            <td><Skeleton width={`${60 + (i*11) % 25}%`} /></td>
            <td><Skeleton width={60} /></td>
            <td className="action-cell"><Skeleton width={60} height={22} style={{ borderRadius: 4, marginLeft: 'auto' }} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TypeFilterMenu({ value, onChange, records, onClose }) {
  const counts = React.useMemo(() => {
    const c = {};
    records.forEach(r => { c[r.type] = (c[r.type] || 0) + 1; });
    return c;
  }, [records]);
  const types = RECORD_TYPES.filter(t => counts[t]);

  const Item = ({ selected, left, right, onClick }) => (
    <button
      className="menu-item"
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '16px 1fr auto',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
      }}
    >
      <span style={{ color: 'var(--accent)', display: 'flex', justifyContent: 'center' }}>
        {selected ? <Icon.Check size={12} /> : null}
      </span>
      <span style={{ textAlign: 'left', overflow: 'hidden' }}>{left}</span>
      <span style={{ color: 'var(--text-subtle)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        {right}
      </span>
    </button>
  );

  return (
    <div className="menu" style={{ minWidth: 200 }}>
      <Item
        selected={value === 'ALL'}
        left={<span style={{ fontWeight: value === 'ALL' ? 500 : 400 }}>All types</span>}
        right={records.length}
        onClick={() => { onChange('ALL'); onClose(); }}
      />
      <div className="menu-divider" />
      {types.map(t => (
        <Item
          key={t}
          selected={value === t}
          left={<TypeBadge type={t} />}
          right={counts[t]}
          onClick={() => { onChange(t); onClose(); }}
        />
      ))}
    </div>
  );
}

function DNSTab({ state, dispatch }) {
  const {
    records, addingNew, editingId, draft, errors, apiError,
    isSaving, flashId, recordsLoading, nsLoading, empty,
  } = state;

  const [query, setQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [filterOpen, setFilterOpen] = React.useState(false);

  const startAdd = () => dispatch({ type: 'START_ADD' });
  const startEdit = (id) => dispatch({ type: 'START_EDIT', id });
  const cancel = () => dispatch({ type: 'CANCEL' });
  const save = () => dispatch({ type: 'SAVE' });
  const setDraft = (d) => dispatch({ type: 'SET_DRAFT', draft: d });
  const requestDelete = (id) => dispatch({ type: 'REQUEST_DELETE', id });

  // Close filter menu on outside click
  React.useEffect(() => {
    if (!filterOpen) return;
    const onClick = (e) => {
      if (!e.target.closest('.filter-chip-wrap')) setFilterOpen(false);
    };
    // Use click so mousedown on scrollbars doesn't immediately close & block scroll
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [filterOpen]);

  const q = query.trim().toLowerCase();
  const filtered = (empty ? [] : records).filter(r => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (!q) return true;
    return (
      r.type.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      String(r.value).toLowerCase().includes(q)
    );
  });
  const displayRecords = filtered;
  const hasActiveFilters = typeFilter !== 'ALL' || q.length > 0;

  return (
    <div>
      <NameServers loading={nsLoading} />

      <div className="section">
        <div className="toolbar">
          <div className="section-title" style={{ marginRight: 8 }}>
            <Icon.Records /> DNS records
          </div>
          <span className="result-count">
            {recordsLoading ? '' : hasActiveFilters
              ? `${displayRecords.length} of ${records.length}`
              : `${displayRecords.length} record${displayRecords.length === 1 ? '' : 's'}`}
          </span>
          <div style={{ flex: 1 }} />
          <div className="search">
            <span className="icon-wrap"><Icon.Search /></span>
            <input
              placeholder="Search by name, value, type…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={recordsLoading || empty}
            />
          </div>
          <div className="filter-chip-wrap" style={{ position: 'relative' }}>
            <button
              className="filter-chip"
              onClick={() => setFilterOpen(o => !o)}
              disabled={recordsLoading || empty}
              style={typeFilter !== 'ALL' ? { borderColor: 'var(--accent-border)', background: 'var(--accent-bg)', color: 'var(--accent)' } : undefined}
            >
              {typeFilter === 'ALL' ? 'All types' : typeFilter}
              <Icon.ChevronDown />
            </button>
            {filterOpen && (
              <TypeFilterMenu
                value={typeFilter}
                onChange={setTypeFilter}
                records={records}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>
          <div className="toolbar-right">
            <button className="btn primary" onClick={startAdd} disabled={addingNew || editingId || recordsLoading}>
              <Icon.Plus /> Add record
            </button>
          </div>
        </div>

        {recordsLoading ? (
          <SkeletonTable />
        ) : empty && !addingNew ? (
          <EmptyState onAdd={startAdd} />
        ) : displayRecords.length === 0 && !addingNew ? (
          <div className="empty" style={{ padding: '40px 24px' }}>
            <div className="empty-icon"><Icon.Search size={18} /></div>
            <div className="empty-title">No matching records</div>
            <div className="empty-desc">
              Try a different search term or clear the type filter.
            </div>
            <button className="btn sm" onClick={() => { setQuery(''); setTypeFilter('ALL'); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <table className="rec-table">
            <thead>
              <tr>
                <th style={{width: 80}}>Type</th>
                <th>Name</th>
                <th>Value</th>
                <th style={{width: 110}}>TTL</th>
                <th style={{width: 100}} className="action-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addingNew && (
                <EditRow
                  draft={draft}
                  setDraft={setDraft}
                  errors={errors}
                  onSave={save}
                  onCancel={cancel}
                  isSaving={isSaving}
                  apiError={apiError}
                  onRetry={save}
                />
              )}
              {displayRecords.map(r =>
                editingId === r.id ? (
                  <EditRow
                    key={r.id}
                    draft={draft}
                    setDraft={setDraft}
                    errors={errors}
                    onSave={save}
                    onCancel={cancel}
                    isSaving={isSaving}
                    apiError={apiError}
                    onRetry={save}
                  />
                ) : (
                  <RecordRow
                    key={r.id}
                    rec={r}
                    isFlashing={flashId === r.id}
                    onEdit={startEdit}
                    onDelete={requestDelete}
                  />
                )
              )}
            </tbody>
          </table>
        )}

        {state.showPropagation && (
          <div className="propagation-note">
            <Icon.Clock />
            DNS changes can take a few minutes to propagate worldwide.
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { DNSTab });
