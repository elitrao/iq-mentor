import { useEffect, useRef } from 'react';
import { IconX } from '@tabler/icons-react';

export function ApiDialog({ title, close, children, className = '', closeLabel = 'Закрыть окно API', onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    dialog.querySelector('input:not([readonly])')?.focus();
    return () => { dialog.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={ref} className={`api-record-dialog ${className}`} aria-labelledby="api-record-dialog-title" onCancel={(event) => { event.preventDefault(); (onCancel || close)(event); }}>
    <header><h2 id="api-record-dialog-title">{title}</h2><button type="button" aria-label={closeLabel} onClick={close}><IconX size={20} /></button></header>{children}
  </dialog>;
}

export function ApiUsersDialog({ entry, close }) {
  const users = entry.users || [];
  return <ApiDialog title="Пользователи интеграции" close={close}>
    <p className="api-record-note">{entry.name}</p>
    {users.length ? <ul className="api-users-list">{users.map((user) => <li key={user.id}>{user.name}</li>)}</ul> : <p className="api-users-empty">Пользователей пока нет</p>}
    <footer><button className="light-button" type="button" onClick={close}>Закрыть</button></footer>
  </ApiDialog>;
}
