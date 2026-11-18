export const SAMPLE_LOG_DATASETS: Record<string, { label: string; fileName: string; format: 'CSV' | 'JSON' | 'TXT'; description: string; content: string }> = {
  auth_gateway_sample: {
    label: 'Enterprise Auth & Gateway Logs (Synthetic CSV)',
    fileName: 'data/enterprise_auth_gateway.csv',
    format: 'CSV',
    description: '42 server telemetry records featuring normal traffic, a brute-force login burst, privileged export activity, and off-hours admin access.',
    content: `timestamp,source_ip,username,event_type,status_code,endpoint,bytes
2026-11-17T14:02:11Z,10.24.18.14,elena.vance,LOGIN_SUCCESS,200,/api/v1/auth/session,1240
2026-11-17T14:04:19Z,10.24.18.22,marcus.chen,API_READ,200,/api/v1/projects/summary,3420
2026-11-17T14:07:05Z,10.24.19.40,priya.nair,API_READ,200,/api/v1/reports/weekly,8910
2026-11-17T14:11:32Z,10.24.18.14,elena.vance,TOKEN_REFRESH,200,/api/v1/auth/refresh,640
2026-11-17T14:15:48Z,10.24.20.11,david.kim,API_WRITE,201,/api/v1/deployments,2180
2026-11-17T14:18:02Z,185.220.101.47,admin,LOGIN_FAILED,401,/api/v1/auth/login,412
2026-11-17T14:18:09Z,185.220.101.47,admin,LOGIN_FAILED,401,/api/v1/auth/login,412
2026-11-17T14:18:16Z,185.220.101.47,root,LOGIN_FAILED,401,/api/v1/auth/login,412
2026-11-17T14:18:24Z,185.220.101.47,secops_svc,LOGIN_FAILED,401,/api/v1/auth/login,412
2026-11-17T14:18:31Z,185.220.101.47,admin,LOGIN_FAILED,401,/api/v1/auth/login,412
2026-11-17T14:18:39Z,185.220.101.47,admin,LOGIN_FAILED,403,/api/v1/admin/console,520
2026-11-17T14:18:45Z,185.220.101.47,admin,LOGIN_FAILED,401,/api/v1/auth/login,412
2026-11-17T14:22:10Z,10.24.22.9,sarah.connor,API_READ,200,/api/v1/inventory,4120
2026-11-17T14:25:51Z,10.24.18.22,marcus.chen,API_READ,200,/api/v1/projects/metrics,2910
2026-11-17T14:31:04Z,91.132.147.82,svc_backup,PRIVILEGED_EXPORT,200,/api/v1/admin/export_users,2450000
2026-11-17T14:31:48Z,91.132.147.82,svc_backup,CONFIG_ACCESS,200,/api/v1/admin/keys?token=sk_live_99812,18400
2026-11-17T14:32:12Z,91.132.147.82,svc_backup,DATABASE_DUMP,200,/api/v1/admin/db_export,4820000
2026-11-17T14:36:29Z,10.24.19.40,priya.nair,API_READ,200,/api/v1/reports/weekly,7820
2026-11-17T14:40:15Z,203.0.113.91,ops_deploy,LOGIN_FAILED,401,/api/v1/auth/login,398
2026-11-17T14:40:44Z,203.0.113.91,ops_deploy,LOGIN_FAILED,401,/api/v1/auth/login,398
2026-11-17T14:41:12Z,203.0.113.91,ops_deploy,LOGIN_FAILED,401,/api/v1/auth/login,398
2026-11-17T14:41:50Z,203.0.113.91,ops_deploy,LOGIN_FAILED,401,/api/v1/auth/login,398
2026-11-17T14:45:03Z,10.24.18.14,elena.vance,API_WRITE,200,/api/v1/tickets/update,1560
2026-11-17T14:48:19Z,172.16.44.105,legacy_sync,SERVICE_ERROR,502,/api/v1/gateway/webhook,680
2026-11-17T14:48:34Z,172.16.44.105,legacy_sync,SERVICE_ERROR,500,/api/v1/gateway/webhook,680
2026-11-17T14:48:49Z,172.16.44.105,legacy_sync,SERVICE_ERROR,503,/api/v1/gateway/webhook,680
2026-11-17T14:49:02Z,172.16.44.105,legacy_sync,SERVICE_ERROR,500,/api/v1/gateway/webhook,680
2026-11-17T14:52:18Z,10.24.20.11,david.kim,API_READ,200,/api/v1/deployments,2050
2026-11-17T14:55:40Z,10.24.22.9,sarah.connor,LOGOUT,200,/api/v1/auth/logout,310
2026-11-17T02:14:08Z,45.142.212.19,k.patel,ADMIN_PROBE,403,/api/v1/root/config,510
2026-11-17T02:15:11Z,45.142.212.19,k.patel,ADMIN_PROBE,403,/api/v1/admin/tokens,510
2026-11-17T02:16:40Z,45.142.212.19,k.patel,LOGIN_SUCCESS,200,/api/v1/auth/session,1120
2026-11-17T15:01:12Z,10.24.18.14,elena.vance,API_READ,200,/api/v1/dashboard,3490
2026-11-17T15:04:29Z,10.24.19.40,priya.nair,API_READ,200,/api/v1/metrics,2780
2026-11-17T15:08:55Z,10.24.20.11,david.kim,API_READ,200,/api/v1/health,520
MALFORMED_ROW_CORRUPTED_TELEMETRY_LINE_MISSING_FIELDS
2026-11-17T15:12:04Z,10.24.22.9,sarah.connor,API_READ,200,/api/v1/projects,4100`,
  },
  api_json_audit: {
    label: 'Cloud API Gateway Audit (Synthetic JSON)',
    fileName: 'data/cloud_api_audit.json',
    format: 'JSON',
    description: 'JSON telemetry stream capturing API token probing, automated scraping bursts, and normal microservice calls.',
    content: JSON.stringify(
      [
        { timestamp: '2026-11-17T16:00:10Z', source_ip: '10.10.4.12', username: 'gateway_proxy', event_type: 'API_READ', status_code: 200, endpoint: '/v2/orders', bytes: 1840 },
        { timestamp: '2026-11-17T16:01:22Z', source_ip: '10.10.4.19', username: 'billing_svc', event_type: 'API_WRITE', status_code: 201, endpoint: '/v2/invoices', bytes: 2450 },
        { timestamp: '2026-11-17T16:02:04Z', source_ip: '198.51.100.77', username: 'api_crawler', event_type: 'LOGIN_FAILED', status_code: 401, endpoint: '/v2/auth/token', bytes: 380 },
        { timestamp: '2026-11-17T16:02:09Z', source_ip: '198.51.100.77', username: 'api_crawler', event_type: 'LOGIN_FAILED', status_code: 401, endpoint: '/v2/auth/token', bytes: 380 },
        { timestamp: '2026-11-17T16:02:15Z', source_ip: '198.51.100.77', username: 'api_crawler', event_type: 'LOGIN_FAILED', status_code: 401, endpoint: '/v2/auth/token', bytes: 380 },
        { timestamp: '2026-11-17T16:02:21Z', source_ip: '198.51.100.77', username: 'api_crawler', event_type: 'LOGIN_FAILED', status_code: 403, endpoint: '/v2/admin/secrets', bytes: 420 },
        { timestamp: '2026-11-17T16:02:29Z', source_ip: '198.51.100.77', username: 'api_crawler', event_type: 'LOGIN_FAILED', status_code: 401, endpoint: '/v2/auth/token', bytes: 380 },
        { timestamp: '2026-11-17T16:05:44Z', source_ip: '192.0.2.154', username: 'analytics_export', event_type: 'PRIVILEGED_EXPORT', status_code: 200, endpoint: '/v2/admin/export_customers', bytes: 3920000 },
        { timestamp: '2026-11-17T16:06:11Z', source_ip: '192.0.2.154', username: 'analytics_export', event_type: 'CONFIG_ACCESS', status_code: 200, endpoint: '/v2/admin/key_vault', bytes: 19200 },
        { timestamp: '2026-11-17T16:09:30Z', source_ip: '10.10.4.12', username: 'gateway_proxy', event_type: 'API_READ', status_code: 200, endpoint: '/v2/health', bytes: 420 },
      ],
      null,
      2
    ),
  },
  syslog_txt_burst: {
    label: 'SSH & Perimeter Syslog Stream (Synthetic TXT)',
    fileName: 'data/perimeter_ssh_syslog.txt',
    format: 'TXT',
    description: 'Raw plaintext SSH and perimeter firewall log stream with embedded password masking tests and brute-force patterns.',
    content: `2026-11-17T18:10:02Z ip=10.0.1.25 user=deploy status=200 event=SSH_AUTH_OK /var/log/auth.log
2026-11-17T18:11:14Z ip=45.95.147.200 user=root status=401 event=SSH_AUTH_FAILED password=supersecret123 /sshd
2026-11-17T18:11:18Z ip=45.95.147.200 user=root status=401 event=SSH_AUTH_FAILED password=admin2026 /sshd
2026-11-17T18:11:21Z ip=45.95.147.200 user=admin status=401 event=SSH_AUTH_FAILED /sshd
2026-11-17T18:11:25Z ip=45.95.147.200 user=ubuntu status=401 event=SSH_AUTH_FAILED /sshd
2026-11-17T18:11:29Z ip=45.95.147.200 user=root status=401 event=SSH_AUTH_FAILED /sshd
2026-11-17T18:14:05Z ip=10.0.1.32 user=ops_lead status=200 event=CONFIG_READ /etc/nginx/nginx.conf
2026-11-17T18:16:40Z ip=10.0.1.25 user=deploy status=200 event=SERVICE_RESTART /systemd/api`,
  },
};
