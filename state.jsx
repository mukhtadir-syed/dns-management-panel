/** @jsx React.createElement */
// Main app — reducer, scenarios, modals, routing

const initialState = (seed = SEED_RECORDS) => ({
  tab: 'dns',
  records: seed,
  addingNew: false,
  editingId: null,
  draft: null,
  errors: {},
  apiError: null,
  isSaving: false,
  flashId: null,
  recordsLoading: false,
  nsLoading: false,
  empty: false,
  showPropagation: false,
  // Delete modal
  deleteId: null,
  deleteError: null,
  deleteLoading: false,
  // DNSSEC
  dnssecOn: false,
  dnssecLoading: false,
  dnssecError: false,
  dnssecDisableConfirm: false,
  // scenario forcing
  forcedApiError: false,
  forcedValidationError: null,
  forcedDeleteError: false,
});

function blankDraft(type = 'A') {
  return {
    id: null,
    type,
    name: '',
    value: '',
    ttl: 3600,
    priority: hasPriorityField(type) ? 10 : undefined,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...initialState(action.seed ?? SEED_RECORDS), ...action.overrides };

    case 'SWITCH_TAB':
      return { ...state, tab: action.tab };

    case 'START_ADD':
      return {
        ...state,
        addingNew: true,
        editingId: null,
        draft: blankDraft(),
        errors: {},
        apiError: null,
      };

    case 'START_EDIT': {
      const rec = state.records.find(r => r.id === action.id);
      if (!rec) return state;
      return {
        ...state,
        addingNew: false,
        editingId: action.id,
        draft: { ...rec },
        errors: {},
        apiError: null,
      };
    }

    case 'CANCEL':
      return {
        ...state,
        addingNew: false,
        editingId: null,
        draft: null,
        errors: {},
        apiError: null,
      };

    case 'SET_DRAFT':
      return {
        ...state,
        draft: action.draft,
        // live-revalidate fields that already had errors
        errors: Object.keys(state.errors).length
          ? validateRecord(action.draft, state.records, state.editingId)
          : state.errors,
        apiError: null,
      };

    case 'SAVE_START':
      return { ...state, isSaving: true, apiError: null };

    case 'SAVE_VALIDATE_FAIL':
      return { ...state, errors: action.errors, isSaving: false };

    case 'SAVE_API_FAIL':
      return { ...state, isSaving: false, apiError: action.message };

    case 'SAVE_SUCCESS': {
      const { draft, editingId, addingNew } = state;
      let records = state.records;
      let id;
      if (addingNew) {
        id = 'r' + Math.random().toString(36).slice(2, 8);
        records = [...records, { ...draft, id }];
      } else if (editingId) {
        id = editingId;
        records = records.map(r => r.id === editingId ? { ...draft, id: editingId } : r);
      }
      return {
        ...state,
        records,
        addingNew: false,
        editingId: null,
        draft: null,
        errors: {},
        apiError: null,
        isSaving: false,
        flashId: id,
        empty: false,
        showPropagation: true,
      };
    }

    case 'CLEAR_FLASH':
      return { ...state, flashId: null };

    case 'REQUEST_DELETE':
      return { ...state, deleteId: action.id, deleteError: null, deleteLoading: false };

    case 'CANCEL_DELETE':
      return { ...state, deleteId: null, deleteError: null, deleteLoading: false };

    case 'DELETE_START':
      return { ...state, deleteLoading: true, deleteError: null };

    case 'DELETE_FAIL':
      return { ...state, deleteLoading: false, deleteError: action.message };

    case 'DELETE_SUCCESS':
      return {
        ...state,
        records: state.records.filter(r => r.id !== state.deleteId),
        deleteId: null,
        deleteError: null,
        deleteLoading: false,
      };

    case 'TOGGLE_DNSSEC':
      return { ...state, dnssecLoading: true, dnssecError: false };

    case 'DNSSEC_DONE':
      return {
        ...state,
        dnssecOn: action.on,
        dnssecLoading: false,
        dnssecError: false,
        dnssecDisableConfirm: false,
      };

    case 'DNSSEC_FAIL':
      return { ...state, dnssecLoading: false, dnssecError: true };

    case 'REQUEST_DISABLE_DNSSEC':
      return { ...state, dnssecDisableConfirm: true };

    case 'CANCEL_DISABLE_DNSSEC':
      return { ...state, dnssecDisableConfirm: false };

    default:
      return state;
  }
}

function DeleteModal({ state, dispatch, onConfirm }) {
  const rec = state.records.find(r => r.id === state.deleteId);
  if (!rec) return null;
  return (
    <Modal onClose={() => dispatch({ type: 'CANCEL_DELETE' })}>
      <div className="modal-head">
        <div className="modal-title">Delete {rec.type} record?</div>
      </div>
      <div className="modal-body">
        This record will be removed from your zone. This cannot be undone.
        <div className="modal-record-preview">
          <TypeBadge type={rec.type} />
          <span>{rec.name === '@' ? DOMAIN : `${rec.name}.${DOMAIN}`}</span>
          <span style={{ color: 'var(--text-subtle)' }}>→</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {rec.type === 'MX' ? `${rec.priority} ${rec.value}` : rec.value}
          </span>
        </div>
      </div>
      {state.deleteError && (
        <div className="modal-error">
          <strong>Could not delete record.</strong> {state.deleteError}
        </div>
      )}
      <div className="modal-foot">
        <button className="btn" onClick={() => dispatch({ type: 'CANCEL_DELETE' })} disabled={state.deleteLoading}>
          Cancel
        </button>
        <button className="btn danger" onClick={onConfirm} disabled={state.deleteLoading}>
          {state.deleteLoading && <Spinner />}
          {state.deleteLoading ? 'Deleting' : 'Delete record'}
        </button>
      </div>
    </Modal>
  );
}

function DNSSECDisableModal({ state, dispatch, onConfirm }) {
  return (
    <Modal onClose={() => dispatch({ type: 'CANCEL_DISABLE_DNSSEC' })}>
      <div className="modal-head">
        <div className="modal-title">Disable DNSSEC?</div>
      </div>
      <div className="modal-body">
        Disabling DNSSEC removes signing for <strong>{DOMAIN}</strong>.{' '}
        <strong>Remove the DS records at your registrar first</strong> to avoid your domain going offline for validating resolvers.
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={() => dispatch({ type: 'CANCEL_DISABLE_DNSSEC' })} disabled={state.dnssecLoading}>
          Cancel
        </button>
        <button className="btn danger" onClick={onConfirm} disabled={state.dnssecLoading}>
          {state.dnssecLoading && <Spinner />}
          {state.dnssecLoading ? 'Disabling' : 'Disable DNSSEC'}
        </button>
      </div>
    </Modal>
  );
}

// ---------- Scenarios ----------
const SCENARIOS = [
  { id: 'dns',         label: 'DNS tab (default)',            tab: 'dns' },
  { id: 'add',         label: 'Add record — open',            tab: 'dns', action: 'openAdd' },
  { id: 'add-invalid', label: 'Add — validation error',       tab: 'dns', action: 'openAddInvalid' },
  { id: 'add-api',     label: 'Add — API error',              tab: 'dns', action: 'openAddApiError' },
  { id: 'edit',        label: 'Edit record',                  tab: 'dns', action: 'openEdit' },
  { id: 'delete',      label: 'Delete confirmation',          tab: 'dns', action: 'openDelete' },
  { id: 'toast',       label: 'Success toast',                tab: 'dns', action: 'showToast' },
  { id: 'loading',     label: 'Loading skeleton',             tab: 'dns', action: 'loadingAll' },
  { id: 'empty',       label: 'Empty state',                  tab: 'dns', action: 'empty' },
  { id: 'dnssec-off',  label: 'Settings — DNSSEC off',        tab: 'settings' },
  { id: 'dnssec-on',   label: 'Settings — DNSSEC on',         tab: 'settings', action: 'dnssecOn' },
  { id: 'dnssec-confirm', label: 'DNSSEC disable modal',      tab: 'settings', action: 'dnssecConfirm' },
];

Object.assign(window, {
  initialState, blankDraft, reducer, DeleteModal, DNSSECDisableModal, SCENARIOS,
});
