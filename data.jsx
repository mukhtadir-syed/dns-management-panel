/** @jsx React.createElement */
// Sample DNS data, validation helpers, record-type metadata.

const DOMAIN = 'northwind.app';

// TTL options (seconds)
const TTL_OPTIONS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
  { value: 14400, label: '4 hours' },
  { value: 86400, label: '1 day' },
];
const ttlLabel = (v) => {
  const m = TTL_OPTIONS.find(x => x.value === v);
  if (m) return m.label;
  if (v < 60) return `${v}s`;
  if (v < 3600) return `${Math.round(v/60)}m`;
  if (v < 86400) return `${Math.round(v/3600)}h`;
  return `${Math.round(v/86400)}d`;
};

const RECORD_TYPES = ['A','AAAA','ALIAS','CAA','CNAME','MX','SRV','TXT','NS'];

const TYPE_DESC = {
  A: 'IPv4 address',
  AAAA: 'IPv6 address',
  ALIAS: 'Apex CNAME alternative',
  CAA: 'Certificate authority authorization',
  CNAME: 'Canonical name / alias',
  MX: 'Mail exchange',
  SRV: 'Service locator',
  TXT: 'Text record',
  NS: 'Name server',
};

// Seed records
const SEED_RECORDS = [
  { id: 'r1', type: 'A', name: '@', value: '198.51.100.42', ttl: 3600 },
  { id: 'r2', type: 'A', name: 'www', value: '198.51.100.42', ttl: 3600 },
  { id: 'r3', type: 'A', name: 'api', value: '198.51.100.58', ttl: 300 },
  { id: 'r4', type: 'AAAA', name: '@', value: '2001:db8::1', ttl: 3600 },
  { id: 'r5', type: 'AAAA', name: 'www', value: '2001:db8::1', ttl: 3600 },
  { id: 'r6', type: 'CNAME', name: 'docs', value: 'northwind.github.io.', ttl: 1800 },
  { id: 'r7', type: 'CNAME', name: 'blog', value: 'ghost.northwind.app.', ttl: 1800 },
  { id: 'r8', type: 'MX', name: '@', priority: 10, value: 'mx1.emailroute.net.', ttl: 3600 },
  { id: 'r9', type: 'MX', name: '@', priority: 20, value: 'mx2.emailroute.net.', ttl: 3600 },
  { id: 'r10', type: 'TXT', name: '@', value: 'v=spf1 include:_spf.emailroute.net ~all', ttl: 3600 },
  { id: 'r11', type: 'TXT', name: '_dmarc', value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@northwind.app', ttl: 3600 },
  { id: 'r12', type: 'CAA', name: '@', value: '0 issue "letsencrypt.org"', ttl: 86400 },
];

// Name servers (placeholder, brand-neutral)
const NAMESERVERS = [
  'ns1.dns.northwind-hosting.net',
  'ns2.dns.northwind-hosting.net',
  'ns3.dns.northwind-hosting.net',
  'ns4.dns.northwind-hosting.net',
];

// DS records (DNSSEC)
const DS_RECORDS = [
  { keyTag: 2371, algorithm: '13 (ECDSAP256SHA256)', digestType: '2 (SHA-256)', digest: 'A1B2C3D4E5F60718293A4B5C6D7E8F909182A3B4C5D6E7F80918A1B2C3D4E5F6' },
  { keyTag: 59312, algorithm: '13 (ECDSAP256SHA256)', digestType: '2 (SHA-256)', digest: 'B2C3D4E5F60718293A4B5C6D7E8F90918A1B2C3D4E5F6071829A3B4C5D6E7F80' },
];

// ---- Validation ----
const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_RE = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const HOSTNAME_RE = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\.?$/;
const NAME_RE = /^(@|\*|[a-zA-Z0-9_]([a-zA-Z0-9_-]{0,62}[a-zA-Z0-9_])?(\.[a-zA-Z0-9_]([a-zA-Z0-9_-]{0,62}[a-zA-Z0-9_])?)*)$/;

function validateRecord(rec, all = [], editingId = null) {
  const errors = {};
  // Name
  if (!rec.name || !rec.name.trim()) {
    errors.name = 'Name is required';
  } else if (!NAME_RE.test(rec.name.trim())) {
    errors.name = 'Invalid subdomain name';
  }

  // TTL
  const ttl = Number(rec.ttl);
  if (!Number.isFinite(ttl) || ttl < 60 || ttl > 86400) {
    errors.ttl = 'TTL must be between 60 and 86400';
  }

  // Type-specific
  const v = (rec.value || '').trim();
  if (!v) {
    errors.value = 'Value is required';
  } else {
    switch (rec.type) {
      case 'A':
        if (!IPV4_RE.test(v)) errors.value = 'Enter a valid IPv4 address';
        break;
      case 'AAAA':
        if (!IPV6_RE.test(v)) errors.value = 'Enter a valid IPv6 address';
        break;
      case 'CNAME':
      case 'ALIAS':
      case 'NS':
        if (!HOSTNAME_RE.test(v)) errors.value = 'Enter a valid hostname';
        break;
      case 'MX': {
        const p = Number(rec.priority);
        if (!Number.isFinite(p) || p < 0 || p > 65535) errors.priority = 'Priority must be 0–65535';
        if (!HOSTNAME_RE.test(v)) errors.value = 'Enter a valid mail server hostname';
        break;
      }
      case 'SRV':
        if (!/^\d+\s+\d+\s+\d+\s+\S+$/.test(v)) errors.value = 'Format: priority weight port target';
        break;
      case 'CAA':
        if (!/^\d+\s+(issue|issuewild|iodef)\s+"[^"]+"$/.test(v)) errors.value = 'Format: flags tag "value"';
        break;
    }
  }

  // Conflict: CNAME cannot coexist with other records on same name
  if (!errors.name && !errors.value) {
    const others = all.filter(r => r.id !== editingId && r.name === rec.name);
    if (rec.type === 'CNAME' && others.length > 0) {
      errors.name = 'CNAME cannot coexist with other records on the same name';
    } else if (rec.type !== 'CNAME' && others.some(r => r.type === 'CNAME')) {
      errors.name = 'A CNAME already exists for this name';
    }
    // Duplicate exact record
    const dup = others.find(r => r.type === rec.type && r.value === v &&
      (rec.type !== 'MX' || r.priority === Number(rec.priority)));
    if (dup) errors.value = 'A record with these exact values already exists';
  }

  return errors;
}

const hasPriorityField = (t) => t === 'MX' || t === 'SRV';

Object.assign(window, {
  DOMAIN, TTL_OPTIONS, ttlLabel, RECORD_TYPES, TYPE_DESC,
  SEED_RECORDS, NAMESERVERS, DS_RECORDS,
  validateRecord, hasPriorityField,
});
