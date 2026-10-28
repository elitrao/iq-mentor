const assets = import.meta.glob('./assets/avatars/animals/*.png', { eager: true, query: '?url', import: 'default' });

// Assignments belong to employees, never to their current row or sort position.
const animalsByName = {
  'Морозова Ольга Николаевна': 'fox',
  'Лебедев Дмитрий Олегович': 'dog',
  'Новикова Ирина Игоревна': 'rabbit',
  'Петров Сергей Владимирович': 'penguin',
  'Васильева Наталья Андреевна': 'cat',
  'Зайцев Андрей Петрович': 'hedgehog',
  'Белова Светлана Олеговна': 'koala',
  'Соловьёв Павел Игоревич': 'owl',
  'Крылова Татьяна Сергеевна': 'panda',
  'Макаров Николай Андреевич': 'bear',
  'Фомина Юлия Павловна': 'deer',
  'Семенов Виктор Олегович': 'horse',
  'Виноградова Дарья Игоревна': 'otter',
  'Богданов Артём Сергеевич': 'tiger',
  'Калинина Алина Петровна': 'tropical-fish',
  'Романов Максим Игоревич': 'lion',
  'Захарова Вера Андреевна': 'duck',
  'Киселёв Денис Олегович': 'raccoon',
  'Алексеева Полина Сергеевна': 'frog',
};
const animals = Object.values(animalsByName);

export function animalAvatarFor(name) {
  const stableHash = Array.from(name.trim().toLocaleLowerCase('ru')).reduce((hash, char) => (Math.imul(hash, 31) + char.codePointAt(0)) >>> 0, 0);
  const animal = animalsByName[name] || animals[stableHash % animals.length];
  return assets[`./assets/avatars/animals/${animal}.png`];
}
