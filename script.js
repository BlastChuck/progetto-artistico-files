const tasks = [
  { name: 'Analisi dei requisiti', owner: 'Viola Scappazzoni, Andrea Burlui, Giorgio Astolfi', status: 'completed', start: '2026-03-25', end: '2026-03-30' },
  { name: 'Individuare le entità, attributi e pk', owner: 'Viola Scappazzoni', status: 'completed', start: '2026-03-29', end: '2026-03-29' },
  { name: 'Suddivisione dei compiti', owner: 'Giorgio Astolfi, Andrea Burlui, Viola Scappazzoni', status: 'completed', start: '2026-03-30', end: '2026-03-30' },
  { name: 'Riformulazione della consegna', owner: 'Giorgio Astolfi, Andrea Burlui, Viola Scappazzoni', status: 'completed', start: '2026-03-30', end: '2026-03-30' },
  { name: 'Modello ER', owner: 'Viola Scappazzoni, Giorgio Astolfi', status: 'completed', start: '2026-03-30', end: '2026-04-17' },
  { name: 'Modello su designer polito', owner: 'Giorgio Astolfi', status: 'completed', start: '2026-03-30', end: '2026-04-15' },
  { name: 'Modello ristrutturato', owner: 'Viola Scappazzoni', status: 'completed', start: '2026-04-15', end: '2026-04-17' },
  { name: 'Versione 1', owner: 'Team', status: 'completed', start: '2026-03-25', end: '2026-04-01' },
  { name: 'Versione 2', owner: 'Team', status: 'completed', start: '2026-04-01', end: '2026-04-07' },
  { name: 'Versione 3', owner: 'Team', status: 'completed', start: '2026-04-07', end: '2026-04-13' },
  { name: 'Modello logico', owner: 'Andrea Burlui', status: 'completed', start: '2026-04-15', end: '2026-04-22' },
  { name: 'Entità, attributi e pk', owner: 'Andrea Burlui', status: 'completed', start: '2026-04-12', end: '2026-04-12' },
  { name: 'Vincoli referenziali', owner: 'Andrea Burlui', status: 'completed', start: '2026-04-20', end: '2026-04-20' },
  { name: 'Modello fisico', owner: 'Giorgio Astolfi, Viola Scappazzoni', status: 'completed', start: '2026-04-17', end: '2026-04-20' },
  { name: 'Creazione database vuoto', owner: 'Viola Scappazzoni', status: 'completed', start: '2026-04-17', end: '2026-04-17' },
  { name: 'Popolamento database', owner: 'Giorgio Astolfi, Andrea Burlui, Viola Scappazzoni', status: 'completed', start: '2026-04-20', end: '2026-04-20' },
  { name: 'Test', owner: 'Andrea Burlui', status: 'completed', start: '2026-04-22', end: '2026-04-27' },
  { name: 'Presentazione', owner: 'Giorgio Astolfi', status: 'completed', start: '2026-04-20', end: '2026-05-03' },
  { name: 'Gantt', owner: 'Viola Scappazzoni', status: 'completed', start: '2026-04-08', end: '2026-05-03' },
  { name: 'Sito web con database', owner: 'Giorgio Astolfi', status: 'completed', start: '2026-04-20', end: '2026-04-27' },
  { name: 'Sito per presentazione', owner: 'Giorgio Astolfi', status: 'completed', start: '2026-04-20', end: '2026-04-27' }
];

const timelineBody = document.getElementById('timeline-body');

function parseDate(value) {
  return new Date(value + 'T00:00:00');
}

function formatDate(date) {
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

const startDates = tasks.map(task => parseDate(task.start));
const endDates = tasks.map(task => parseDate(task.end));
const timelineStart = new Date(Math.min(...startDates));
const timelineEnd = new Date(Math.max(...endDates));
const totalMs = timelineEnd - timelineStart + 24 * 60 * 60 * 1000;

function positionPercent(date) {
  return ((date - timelineStart) / totalMs) * 100;
}

tasks.forEach(task => {
  const taskStart = parseDate(task.start);
  const taskEnd = parseDate(task.end);
  const left = positionPercent(taskStart);
  const right = positionPercent(new Date(taskEnd.getTime() + 24 * 60 * 60 * 1000));
  const width = Math.max(right - left, 1);
  const row = document.createElement('div');
  row.className = 'timeline-row';

  const label = document.createElement('div');
  label.innerHTML = `<strong>${task.name}</strong><span>${task.owner}</span>`;

  const barWrapper = document.createElement('div');
  barWrapper.className = 'timeline-bar-wrapper';
  const bar = document.createElement('div');
  bar.className = `timeline-bar status-${task.status}`;
  bar.style.left = `${left}%`;
  bar.style.width = `${width}%`;
  bar.style.transition = 'width 0.5s ease, left 0.5s ease';
  barWrapper.appendChild(bar);

  const dates = document.createElement('div');
  dates.innerHTML = `<strong>${formatDate(taskStart)} — ${formatDate(taskEnd)}</strong><span>${task.status === 'completed' ? 'Fatto' : task.status === 'blocked' ? 'Bloccato' : 'In svolgimento'}</span>`;

  row.append(label, barWrapper, dates);
  timelineBody.appendChild(row);
});

const timelineHeader = document.querySelector('.timeline__header');
if (timelineHeader) {
  const startLabel = document.createElement('div');
  startLabel.textContent = formatDate(timelineStart);
  const middleLabel = document.createElement('div');
  middleLabel.textContent = formatDate(new Date((timelineStart.getTime() + timelineEnd.getTime()) / 2));
  const endLabel = document.createElement('div');
  endLabel.textContent = formatDate(timelineEnd);
  timelineHeader.append(startLabel, middleLabel, endLabel);
}
