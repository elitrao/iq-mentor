import { IconCheck } from '@tabler/icons-react';
import './integration-connection-status.css';

export function IntegrationConnectionStatus({ connected }) {
  return <span className={`integration-connection-status${connected ? ' is-connected' : ''}`} role="status">
    {connected && <IconCheck size={14} stroke={2} aria-hidden="true" />}
    {connected ? 'Интеграция подключена' : 'Интеграция не подключена'}
  </span>;
}
