import { useEffect, useRef } from 'react';
import { IconArrowLeft, IconArrowUpRight, IconCheck } from '@tabler/icons-react';
import { SettingsWorkspace } from './SettingsWorkspace.jsx';
import './settings-variants.css';

export function SettingsStandalone({ close, returnLabel, toast, ...workspaceProps }) {
  const backRef = useRef(null);
  useEffect(() => { backRef.current?.focus({ preventScroll: true }); }, []);
  return <main className="settings-standalone" aria-label="Настройки 3">
    <header className="settings-standalone-header">
      <button ref={backRef} className="settings-return" onClick={close} title={`Вернуться: ${returnLabel}`}><IconArrowLeft size={19} stroke={1.7} /><span>Вернуться в сервис</span></button>
      <div className="settings-standalone-brand"><img src="/iq-logo.svg" alt="IQ Mentor" /><span>Настройки</span></div>
      <a className="settings-google-reference" href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer" aria-label="Референс Google — открыть в новой вкладке" title="Референс Google — открыть в новой вкладке">
        <span>Референс</span><img src="/google-wordmark.svg" width="74" height="24" alt="Google" /><IconArrowUpRight size={14} aria-hidden="true" />
      </a>
    </header>
    <SettingsWorkspace {...workspaceProps} modal title="Настройки 3" />
    {toast && <div className="toast" role="status"><IconCheck size={18} />{toast}</div>}
  </main>;
}
