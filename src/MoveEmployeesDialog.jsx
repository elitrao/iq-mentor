import { useState } from 'react';
import { ApiDialog } from './ApiDialog.jsx';
import { DepartmentBadge } from './DepartmentDialog.jsx';

export function MoveEmployeesDialog({ count, departments, close, onMove }) {
  const [destination, setDestination] = useState(undefined);
  const [error, setError] = useState('');
  return <ApiDialog title="Переместить в отдел" closeLabel="Закрыть перемещение сотрудников" close={close} className="employee-move-dialog">
    <form onSubmit={(event) => { event.preventDefault(); try { onMove(destination); } catch (cause) { setError(cause.message); } }}>
      <p className="api-record-note">Выбрано сотрудников: {count}</p>
      <fieldset className="employee-move-options"><legend className="employee-visually-hidden">Отдел назначения</legend>
        {[{ id: '', name: 'Без отдела' }, ...departments].map((department) => <label key={department.id}>
          <input type="radio" name="destination-department" value={department.id} checked={destination === department.id} onChange={() => { setDestination(department.id); setError(''); }} />
          {department.id ? <DepartmentBadge department={department} /> : <span>Без отдела</span>}
        </label>)}
      </fieldset>
      {!departments.length && <p className="api-record-note">Пока нет отделов. Создайте отдел в списке сотрудников.</p>}
      {error && <p className="api-record-error" role="alert">{error}</p>}
      <footer><button type="button" className="light-button" onClick={close}>Отменить</button><button type="submit" className="dark-button" disabled={destination === undefined}>Переместить</button></footer>
    </form>
  </ApiDialog>;
}
