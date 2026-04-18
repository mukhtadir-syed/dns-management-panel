/** @jsx React.createElement */
// Settings tab — DNSSEC toggle + DS records

function DSRecordsBlock() {
  return (
    <div className="ds-list">
      <div className="ds-header">
        <div>Key tag</div>
        <div>Algorithm</div>
        <div>Digest type</div>
        <div>Digest</div>
        <div style={{ textAlign: 'right' }}>&nbsp;</div>
      </div>
      {DS_RECORDS.map(ds => (
        <div className="ds-row" key={ds.keyTag}>
          <div>{ds.keyTag}</div>
          <div>{ds.algorithm}</div>
          <div>{ds.digestType}</div>
          <div className="digest" title={ds.digest}>{ds.digest}</div>
          <CopyButton
            text={`${ds.keyTag} ${ds.algorithm.split(' ')[0]} ${ds.digestType.split(' ')[0]} ${ds.digest}`}
            label="Copy"
          />
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ state, dispatch }) {
  const { dnssecOn, dnssecLoading, dnssecError } = state;

  const toggle = () => {
    if (dnssecLoading) return;
    if (dnssecOn) {
      dispatch({ type: 'REQUEST_DISABLE_DNSSEC' });
    } else {
      dispatch({ type: 'TOGGLE_DNSSEC' });
    }
  };

  return (
    <div>
      <div className="section">
        <div className="section-head no-border">
          <div style={{ flex: 1 }}>
            <div className="section-title"><Icon.Shield /> DNSSEC</div>
            <div className="section-desc" style={{ marginTop: 3 }}>
              Cryptographically sign DNS responses to prevent spoofing and cache poisoning.
            </div>
          </div>
        </div>

        <div className="section-body" style={{ paddingTop: 0 }}>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 16,
            background: 'var(--surface-2)'
          }}>
            <div className="toggle-row">
              <div className="toggle-body">
                <div className="toggle-title">
                  Enable DNSSEC for {DOMAIN}
                </div>
                <div className="toggle-desc">
                  When enabled, you must copy the DS records below into your domain registrar to complete the chain of trust. Changes can take up to 24 hours to fully propagate.
                </div>
                {dnssecError && (
                  <div style={{
                    marginTop: 10,
                    color: 'var(--danger)',
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <Icon.Alert />
                    Could not update DNSSEC.{' '}
                    <button
                      style={{
                        background: 'none', border: 'none', color: 'var(--danger)',
                        textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit'
                      }}
                      onClick={() => dispatch({ type: 'TOGGLE_DNSSEC' })}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
              <Toggle on={dnssecOn} loading={dnssecLoading} onClick={toggle} />
            </div>

            {dnssecOn && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>DS records for your registrar</div>
                    <div className="section-desc" style={{ marginTop: 2 }}>
                      Add these DS records at your registrar to activate DNSSEC validation.
                    </div>
                  </div>
                </div>
                <DSRecordsBlock />

                <div className="setting-hint">
                  <span style={{ color: 'oklch(0.55 0.14 75)', marginTop: 1 }}><Icon.Info size={14} /></span>
                  <div>
                    <strong>Don't have DS records set at your registrar yet?</strong> DNSSEC is <em>enabled</em> on our side,
                    but your domain will not be fully validated until your registrar publishes these DS records to the parent zone.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SettingsTab, DSRecordsBlock });
