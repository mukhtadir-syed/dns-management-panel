/** @jsx React.createElement */
// App root — orchestrates state, scenarios, effects

function Scenarios({ current, setCurrent }) {
  const [open, setOpen] = React.useState(false);
  const currentLabel = (SCENARIOS.find(s => s.id === current) || SCENARIOS[0]).label;
  return (
    <React.Fragment>
      {open && (
        <div className="scenarios" onClick={e => e.stopPropagation()}>
          <div className="scenarios-head">
            <div className="scenarios-title">
              <Icon.List size={12} /> Scenarios
            </div>
            <button className="scenarios-collapse" onClick={() => setOpen(false)} aria-label="Close">
              <Icon.X size={12} />
            </button>
          </div>
          <div className="scenarios-list">
            {SCENARIOS.map((s, i) => (
              <div
                key={s.id}
                className={'scenario-item' + (current === s.id ? ' active' : '')}
                onClick={() => { setCurrent(s.id); setOpen(false); }}
              >
                <span className="scenario-num">{String(i+1).padStart(2,'0')}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <button className="scenarios-toggle" onClick={() => setOpen(o => !o)}>
        <Icon.List size={12} />
        <span>Scenarios</span>
        <span className="kbd">{currentLabel}</span>
      </button>
    </React.Fragment>
  );
}

function TopBar({ tab, setTab }) {
  return (
    <div className="topbar">
      <div className="topbar-brand">
        <span className="brand-mark" />
        <span>Northwind Hosting</span>
      </div>
      <div className="breadcrumb">
        <span className="sep">/</span>
        <span>Domains</span>
        <span className="sep">/</span>
        <span className="current">{DOMAIN}</span>
      </div>
      <div className="topbar-right">
        <span>Help</span>
        <div className="avatar">MT</div>
      </div>
    </div>
  );
}

function PageHeader({ tab, setTab, recordCount }) {
  return (
    <div className="page-header">
      <div className="page-header-inner">
        <div className="domain-row">
          <div className="domain-name">{DOMAIN}</div>
          <span className="status-pill"><span className="dot" /> Active</span>
          <span style={{ color: 'var(--text-subtle)', fontSize: 12.5 }}>Premium DNS</span>
        </div>
        <div className="domain-sub">
          Manage DNS records and DNSSEC for this zone.
        </div>
        <div className="tabs" role="tablist">
          <button
            className={'tab' + (tab === 'dns' ? ' active' : '')}
            role="tab"
            aria-selected={tab === 'dns'}
            onClick={() => setTab('dns')}
          >
            <Icon.Records /> DNS
            <span className="count">{recordCount}</span>
          </button>
          <button
            className={'tab' + (tab === 'settings' ? ' active' : '')}
            role="tab"
            aria-selected={tab === 'settings'}
            onClick={() => setTab('settings')}
          >
            <Icon.Settings /> Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [state, dispatch] = React.useReducer(reducer, undefined, () => initialState());
  const [scenario, setScenario] = React.useState(() => {
    try { return localStorage.getItem('dns_scenario') || 'dns'; } catch { return 'dns'; }
  });
  const { toasts, push, close } = useToasts();
  const pushRef = React.useRef(push);
  pushRef.current = push;

  // Persist scenario
  React.useEffect(() => {
    try { localStorage.setItem('dns_scenario', scenario); } catch {}
  }, [scenario]);

  // Apply scenario
  React.useEffect(() => {
    const s = SCENARIOS.find(x => x.id === scenario) || SCENARIOS[0];
    const tab = s.tab;

    // reset base
    const base = { tab };

    switch (s.action) {
      case 'openAdd':
        dispatch({ type: 'RESET', overrides: { tab, addingNew: true, draft: blankDraft('A') } });
        break;
      case 'openAddInvalid': {
        const draft = { ...blankDraft('A'), name: 'www', value: '192.0.2.999', ttl: 3600 };
        const errors = { value: 'Enter a valid IPv4 address' };
        dispatch({ type: 'RESET', overrides: { tab, addingNew: true, draft, errors } });
        break;
      }
      case 'openAddApiError': {
        const draft = { ...blankDraft('A'), name: 'www', value: '198.51.100.99', ttl: 3600 };
        dispatch({ type: 'RESET', overrides: {
          tab, addingNew: true, draft,
          apiError: 'The upstream DNS provider returned an error. Try again in a moment.',
        } });
        break;
      }
      case 'openEdit': {
        const rec = SEED_RECORDS.find(r => r.id === 'r3');
        dispatch({ type: 'RESET', overrides: {
          tab, editingId: rec.id, draft: { ...rec, value: '198.51.100.77' }
        } });
        break;
      }
      case 'openDelete':
        dispatch({ type: 'RESET', overrides: { tab, deleteId: 'r7' } });
        break;
      case 'showToast':
        dispatch({ type: 'RESET', overrides: { tab, flashId: 'r3', showPropagation: true } });
        // delay push so toast shows after paint
        setTimeout(() => pushRef.current({
          kind: 'success',
          title: 'A record added',
          desc: 'api.northwind.app → 198.51.100.77',
        }), 120);
        break;
      case 'loadingAll':
        dispatch({ type: 'RESET', overrides: { tab, recordsLoading: true, nsLoading: true } });
        break;
      case 'empty':
        dispatch({ type: 'RESET', overrides: { tab, records: [], empty: true } });
        break;
      case 'dnssecOn':
        dispatch({ type: 'RESET', overrides: { tab, dnssecOn: true } });
        break;
      case 'dnssecConfirm':
        dispatch({ type: 'RESET', overrides: { tab, dnssecOn: true, dnssecDisableConfirm: true } });
        break;
      default:
        dispatch({ type: 'RESET', overrides: base });
    }
  }, [scenario]);

  // Clear flash animation after it plays
  React.useEffect(() => {
    if (!state.flashId) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), 2000);
    return () => clearTimeout(t);
  }, [state.flashId]);

  // Interactive save handler — triggered via dispatch 'SAVE'
  React.useEffect(() => {
    const handler = (e) => {
      if (e.detail?.type !== 'SAVE') return;
      // Validate
      const errs = validateRecord(state.draft, state.records, state.editingId);
      if (Object.keys(errs).length) {
        dispatch({ type: 'SAVE_VALIDATE_FAIL', errors: errs });
        return;
      }
      dispatch({ type: 'SAVE_START' });
      setTimeout(() => {
        dispatch({ type: 'SAVE_SUCCESS' });
        const isAdd = state.addingNew;
        pushRef.current({
          kind: 'success',
          title: isAdd ? `${state.draft.type} record added` : 'Record updated',
          desc: `${state.draft.name === '@' ? DOMAIN : state.draft.name + '.' + DOMAIN}${isAdd ? '' : ' updated'}`,
        });
      }, 750);
    };
    window.addEventListener('__dns_action', handler);
    return () => window.removeEventListener('__dns_action', handler);
  }, [state.draft, state.records, state.editingId, state.addingNew]);

  // Override the dispatch to intercept SAVE & DNSSEC actions
  const wrappedDispatch = React.useCallback((action) => {
    if (action.type === 'SAVE') {
      // Validate inline
      const errs = validateRecord(state.draft, state.records, state.editingId);
      if (Object.keys(errs).length) {
        dispatch({ type: 'SAVE_VALIDATE_FAIL', errors: errs });
        return;
      }
      dispatch({ type: 'SAVE_START' });
      setTimeout(() => {
        dispatch({ type: 'SAVE_SUCCESS' });
        const isAdd = state.addingNew;
        const recName = state.draft.name === '@' ? DOMAIN : state.draft.name + '.' + DOMAIN;
        pushRef.current({
          kind: 'success',
          title: isAdd ? `${state.draft.type} record added` : 'Record updated',
          desc: recName,
        });
      }, 700);
      return;
    }
    if (action.type === 'TOGGLE_DNSSEC') {
      dispatch({ type: 'TOGGLE_DNSSEC' });
      const willBe = !state.dnssecOn;
      setTimeout(() => {
        dispatch({ type: 'DNSSEC_DONE', on: willBe });
        pushRef.current({
          kind: 'success',
          title: willBe ? 'DNSSEC enabled' : 'DNSSEC disabled',
          desc: willBe ? 'Copy the DS records to your registrar.' : 'Signing removed for this zone.',
        });
      }, 900);
      return;
    }
    dispatch(action);
  }, [state.draft, state.records, state.editingId, state.addingNew, state.dnssecOn]);

  const onDeleteConfirm = () => {
    dispatch({ type: 'DELETE_START' });
    setTimeout(() => {
      dispatch({ type: 'DELETE_SUCCESS' });
      pushRef.current({ kind: 'success', title: 'Record deleted' });
    }, 650);
  };

  const setTab = (tab) => {
    // pick closest scenario
    if (tab === 'dns' && state.tab !== 'dns') setScenario('dns');
    else if (tab === 'settings' && state.tab !== 'settings') {
      setScenario(state.dnssecOn ? 'dnssec-on' : 'dnssec-off');
    }
  };

  return (
    <div className="app">
      <TopBar />
      <PageHeader tab={state.tab} setTab={setTab} recordCount={state.records.length} />

      <div className="main">
        <div className="main-inner">
          {state.tab === 'dns'
            ? <DNSTab state={state} dispatch={wrappedDispatch} />
            : <SettingsTab state={state} dispatch={wrappedDispatch} />
          }
        </div>
      </div>

      <ToastStack toasts={toasts} onClose={close} />

      {state.deleteId && (
        <DeleteModal state={state} dispatch={dispatch} onConfirm={onDeleteConfirm} />
      )}

      {state.dnssecDisableConfirm && (
        <DNSSECDisableModal
          state={state}
          dispatch={dispatch}
          onConfirm={() => {
            dispatch({ type: 'TOGGLE_DNSSEC' });
            setTimeout(() => {
              dispatch({ type: 'DNSSEC_DONE', on: false });
              pushRef.current({ kind: 'success', title: 'DNSSEC disabled', desc: 'Signing removed for this zone.' });
            }, 800);
          }}
        />
      )}

      <Scenarios current={scenario} setCurrent={setScenario} />
    </div>
  );
}

function __mountApp() {
  const ReactDOM = window.ReactDOM;
  const root = document.getElementById('root');
  if (!root || !ReactDOM || !ReactDOM.createRoot) {
    setTimeout(__mountApp, 50);
    return;
  }
  ReactDOM.createRoot(root).render(<App />);
}
__mountApp();
