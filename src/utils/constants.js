export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MEMBER: 'member',
}

export const ASSET_TYPES = {
  DOMAIN:      'domain',
  NETWORK:     'network',
  WEBAPP:      'webapp',
  SOURCE_CODE: 'source_code',
  URL_CRAWL:   'url_crawl',
}

export const SCAN_ENGINES = {
  [ASSET_TYPES.DOMAIN]:      'Greenbone',
  [ASSET_TYPES.NETWORK]:     'Greenbone',
  [ASSET_TYPES.WEBAPP]:      'Nuclei',
  [ASSET_TYPES.SOURCE_CODE]: 'Semgrep',
  [ASSET_TYPES.URL_CRAWL]:   'Katana',
}

export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH:     'high',
  MEDIUM:   'medium',
  LOW:      'low',
  INFO:     'info',
}

export const SEVERITY_COLORS = {
  critical: '#DC2626',
  high:     '#EA580C',
  medium:   '#D97706',
  low:      '#2563EB',
  info:     '#6B7280',
}

export const STATUS = {
  OPEN:        'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED:    'resolved',
  ACCEPTED:    'accepted',
}

export const STATUS_COLORS = {
  open:        '#DC2626',
  in_progress: '#2563EB',
  resolved:    '#16A34A',
  accepted:    '#6B7280',
}

// Activity category → CSS custom-property value
export const ACTIVITY_CATEGORY_COLORS = {
  scan_started:           'var(--color-cat-scan)',
  scan_completed:         'var(--color-cat-success)',
  scan_failed:            'var(--color-cat-error)',
  vulnerability_found:    'var(--color-cat-vulnerability)',
  vulnerability_resolved: 'var(--color-cat-success)',
  asset_added:            'var(--color-cat-asset)',
  ticket_created:         'var(--color-cat-ticket)',
  ticket_resolved:        'var(--color-cat-success)',
  user_invited:           'var(--color-cat-user)',
  credit_added:           'var(--color-cat-credit)',
}

export const ACTIVITY_CATEGORY_LABELS = {
  scan_started:           'Scan Started',
  scan_completed:         'Scan Done',
  scan_failed:            'Scan Failed',
  vulnerability_found:    'Finding',
  vulnerability_resolved: 'Resolved',
  asset_added:            'Asset Added',
  ticket_created:         'Ticket',
  ticket_resolved:        'Ticket Closed',
  user_invited:           'User',
  credit_added:           'Credits',
}

export const SCAN_TYPE_LABELS = {
  domain:      'Domain',
  network:     'Network',
  webapp:      'Web App',
  source_code: 'Source Code',
}
