const STORAGE_KEY = 'dbDemoData_v1';
const sections = {
  students: {
    title: 'Studenti',
    description: 'Gestisci gli studenti creatori e i loro dati anagrafici.',
    columns: ['ID', 'Nome', 'Classe', 'Media', 'Email', 'Azioni'],
    fields: ['name', 'class', 'average', 'email']
  },
  artworks: {
    title: 'Opere',
    description: 'Gestisci le opere, il tipo e lo stato di conservazione.',
    columns: ['ID', 'Titolo', 'Autore', 'Stato', 'Valore', 'Azioni'],
    fields: ['title', 'type', 'status', 'value']
  },
  loans: {
    title: 'Prestiti',
    description: 'Monitora i prestiti delle opere e lo stato di restituzione.',
    columns: ['ID', 'Opera', 'Destinazione', 'Corriere', 'Data', 'Stato', 'Azioni'],
    fields: ['destination', 'courier', 'period', 'status']
  },
  exhibitions: {
    title: 'Mostre',
    description: 'Gestisci mostre, date e tasse organizzative.',
    columns: ['ID', 'Evento', 'Location', 'Periodo', 'Stato', 'Azioni'],
    fields: ['name', 'location', 'period', 'status']
  },
  feedback: {
    title: 'Feedback',
    description: 'Registra commenti e punteggi dei docenti sulle opere.',
    columns: ['ID', 'Opera', 'Docente', 'Voto', 'Tipo', 'Azioni'],
    fields: ['teacher', 'score', 'type']
  }
};

const tabs = document.querySelectorAll('.tab-button');
const sectionTitle = document.getElementById('section-title');
const sectionDescription = document.getElementById('section-description');
const tableHead = document.getElementById('table-head');
const tableBody = document.getElementById('table-body');
const statsGrid = document.getElementById('stats-grid');
const addItemButton = document.getElementById('add-item');
const resetButton = document.getElementById('reset-button');
const modal = document.getElementById('record-modal');
const closeModal = document.getElementById('close-modal');
const saveButton = document.getElementById('save-button');
const recordForm = document.getElementById('record-form');
const formFields = document.getElementById('form-fields');
const modalTitle = document.getElementById('modal-title');

let activeSection = 'students';
let data = loadData();
let currentEdit = null;

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = generateDemoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const seed = generateDemoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  render();
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateDemoData() {
  const studentNames = ['Luca Bianchi', 'Sofia Rossi', 'Marco Verdi', 'Elena Neri', 'Giulia Fontana'];
  const artworkTitles = ['Eco-Paesaggio', 'Ritratto luce', 'Scultura fluida', 'Installazione sonora', 'Video painting'];
  const exhibitionNames = ['Galleria 21', 'Arte Urbana', 'Fiera Creativa', 'Mostra Nuova', 'Festival d\'Arte'];
  const destinations = ['Museo Città', 'Galleria Privata', 'Spazio Espositivo', 'Collezionista', 'Evento Locale'];
  const teachers = ['Prof. Sala', 'Prof.ssa Gallo', 'Prof. Moretti', 'Prof.ssa Pini', 'Prof. Leone'];

  const students = studentNames.map((name, index) => ({
    id: `S${index + 1}`,
    name,
    class: `4${['A','B','C','D','E'][index]}`,
    average: (7 + Math.random() * 2).toFixed(2),
    email: `${name.toLowerCase().replace(/\s/g, '.')}@liceoartistico.edu`
  }));

  const artworks = artworkTitles.map((title, index) => {
    const author = randomFrom(students);
    return {
      id: `A${index + 1}`,
      title,
      studentId: author.id,
      type: randomFrom(['Pittura', 'Scultura', 'Digital art', 'Installazione', 'Multimedia']),
      status: randomFrom(['In corso', 'Completato', 'In mostra', 'In prestito']),
      value: `${Math.floor(300 + Math.random() * 1200)} €`
    };
  });

  const exhibitions = exhibitionNames.map((name, index) => ({
    id: `E${index + 1}`,
    name,
    location: randomFrom(['Sala Blu', 'Cortile', 'Auditorium', 'Spazio X', 'Atrio Principale']),
    period: `0${1 + index}/05/2026 - 0${3 + index}/05/2026`,
    status: randomFrom(['Programmata', 'In corso', 'Conclusa'])
  }));

  const loans = artworks.slice(0, 4).map((artwork, index) => ({
    id: `L${index + 1}`,
    artworkId: artwork.id,
    destination: randomFrom(destinations),
    courier: randomFrom(['Corriere Sicuro', 'SpeedArt', 'ArteExpress']),
    period: `0${2 + index}/05/2026 - 0${5 + index}/05/2026`,
    status: randomFrom(['In transito', 'Consegnato', 'Ritardo'])
  }));

  const feedback = artworks.map((artwork, index) => ({
    id: `F${index + 1}`,
    artworkId: artwork.id,
    teacher: randomFrom(teachers),
    score: 6 + Math.floor(Math.random() * 5),
    type: randomFrom(['Formativo', 'Ufficiale'])
  }));

  return { students, artworks, loans, exhibitions, feedback };
}

function renderStats() {
  statsGrid.innerHTML = '';
  const cards = [
    { label: 'Studenti', value: data.students.length },
    { label: 'Opere', value: data.artworks.length },
    { label: 'Prestiti', value: data.loans.length },
    { label: 'Mostre', value: data.exhibitions.length },
    { label: 'Feedback', value: data.feedback.length }
  ];
  cards.forEach(item => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
    statsGrid.appendChild(card);
  });
}

function renderTable() {
  const section = sections[activeSection];
  sectionTitle.textContent = section.title;
  sectionDescription.textContent = section.description;
  tableHead.innerHTML = `<tr>${section.columns.map(col => `<th>${col}</th>`).join('')}</tr>`;
  tableBody.innerHTML = '';

  const rows = data[activeSection];
  rows.forEach(row => {
    const tr = document.createElement('tr');
    if (activeSection === 'students') {
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${row.name}</td>
        <td>${row.class}</td>
        <td>${row.average}</td>
        <td>${row.email}</td>
        <td>${actionButtons(row.id)}</td>`;
    } else if (activeSection === 'artworks') {
      const author = data.students.find(s => s.id === row.studentId)?.name || '---';
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${row.title}</td>
        <td>${author}</td>
        <td>${row.status}</td>
        <td>${row.value}</td>
        <td>${actionButtons(row.id)}</td>`;
    } else if (activeSection === 'loans') {
      const artwork = data.artworks.find(a => a.id === row.artworkId)?.title || '---';
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${artwork}</td>
        <td>${row.destination}</td>
        <td>${row.courier}</td>
        <td>${row.period}</td>
        <td>${row.status}</td>
        <td>${actionButtons(row.id)}</td>`;
    } else if (activeSection === 'exhibitions') {
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${row.name}</td>
        <td>${row.location}</td>
        <td>${row.period}</td>
        <td>${row.status}</td>
        <td>${actionButtons(row.id)}</td>`;
    } else if (activeSection === 'feedback') {
      const artwork = data.artworks.find(a => a.id === row.artworkId)?.title || '---';
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${artwork}</td>
        <td>${row.teacher}</td>
        <td>${row.score}</td>
        <td>${row.type}</td>
        <td>${actionButtons(row.id)}</td>`;
    }
    tableBody.appendChild(tr);
  });
}

function actionButtons(id) {
  return `<div class="row-actions">
      <button onclick="editRecord('${id}')" class="button button--secondary">Modifica</button>
      <button onclick="deleteRecord('${id}')" class="button button--secondary">Elimina</button>
    </div>`;
}

function editRecord(id) {
  openModal(id);
}

function deleteRecord(id) {
  if (confirm('Eliminare questo record?')) {
    data[activeSection] = data[activeSection].filter(row => row.id !== id);
    saveData();
  }
}

function openModal(editId = null) {
  currentEdit = editId;
  const isEdit = editId !== null;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  modalTitle.textContent = isEdit ? `Modifica ${sections[activeSection].title.slice(0, -1)}` : `Nuovo ${sections[activeSection].title.slice(0, -1)}`;
  buildForm(editId);
}

function closeModalWindow() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  formFields.innerHTML = '';
  currentEdit = null;
}

function buildForm(editId) {
  formFields.innerHTML = '';
  const section = sections[activeSection];
  const item = editId ? data[activeSection].find(row => row.id === editId) : null;

  const fields = section.fields;
  if (activeSection === 'students') {
    fields.forEach(name => {
      const label = createField(labelize(name), name, item ? item[name] : '');
      formFields.appendChild(label);
    });
  } else if (activeSection === 'artworks') {
    recordForm.appendChild(createSelect('studentId', 'Autore', data.students, item ? item.studentId : data.students[0]?.id));
    recordForm.appendChild(createField('Titolo', 'title', item ? item.title : ''));
    recordForm.appendChild(createSelect('type', 'Tipo', ['Pittura','Scultura','Digital art','Installazione','Multimedia'], item ? item.type : 'Pittura'));
    recordForm.appendChild(createSelect('status', 'Stato', ['In corso','Completato','In mostra','In prestito'], item ? item.status : 'In corso'));
    recordForm.appendChild(createField('Valore', 'value', item ? item.value : '600 €'));
  } else if (activeSection === 'loans') {
    recordForm.appendChild(createSelect('artworkId', 'Opera', data.artworks, item ? item.artworkId : data.artworks[0]?.id));
    recordForm.appendChild(createField('Destinazione', 'destination', item ? item.destination : 'Museo Città'));
    recordForm.appendChild(createField('Corriere', 'courier', item ? item.courier : 'ArteExpress'));
    recordForm.appendChild(createField('Periodo', 'period', item ? item.period : '05/05/2026 - 10/05/2026'));
    recordForm.appendChild(createSelect('status', 'Stato', ['In transito','Consegnato','Ritardo'], item ? item.status : 'In transito'));
  } else if (activeSection === 'exhibitions') {
    recordForm.appendChild(createField('Evento', 'name', item ? item.name : 'Mostra Intensa'));
    recordForm.appendChild(createField('Location', 'location', item ? item.location : 'Sala Blu'));
    recordForm.appendChild(createField('Periodo', 'period', item ? item.period : '12/05/2026 - 16/05/2026'));
    recordForm.appendChild(createSelect('status', 'Stato', ['Programmata','In corso','Conclusa'], item ? item.status : 'Programmata'));
  } else if (activeSection === 'feedback') {
    recordForm.appendChild(createSelect('artworkId', 'Opera', data.artworks, item ? item.artworkId : data.artworks[0]?.id));
    recordForm.appendChild(createField('Docente', 'teacher', item ? item.teacher : 'Prof. Sala'));
    recordForm.appendChild(createField('Punteggio', 'score', item ? item.score : '7'));
    recordForm.appendChild(createSelect('type', 'Tipo', ['Formativo','Ufficiale'], item ? item.type : 'Formativo'));
  }
}

function createField(labelText, name, value) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.name = name;
  input.value = value || '';
  input.required = true;
  label.textContent = labelText;
  label.appendChild(input);
  return label;
}

function createSelect(name, labelText, options, selectedValue) {
  const label = document.createElement('label');
  const select = document.createElement('select');
  select.name = name;
  select.required = true;
  if (Array.isArray(options)) {
    options.forEach(item => {
      const option = document.createElement('option');
      option.value = typeof item === 'object' ? item.id : item;
      option.textContent = typeof item === 'object' ? `${item.name || item.title || item} (${item.id})` : item;
      select.appendChild(option);
    });
  }
  select.value = selectedValue || '';
  label.textContent = labelText;
  label.appendChild(select);
  return label;
}

function labelize(key) {
  const map = {
    name: 'Nome',
    class: 'Classe',
    average: 'Media',
    email: 'Email',
    title: 'Titolo',
    type: 'Tipo',
    status: 'Stato',
    value: 'Valore',
    destination: 'Destinazione',
    courier: 'Corriere',
    period: 'Periodo',
    location: 'Location',
    teacher: 'Docente',
    score: 'Punteggio'
  };
  return map[key] || key;
}

function handleSectionChange(event) {
  const target = event.target.closest('.tab-button');
  if (!target) return;
  tabs.forEach(tab => tab.classList.remove('active'));
  target.classList.add('active');
  activeSection = target.dataset.section;
  render();
}

function handleTableAction(event) {
  const button = event.target.closest('button');
  if (!button || !button.dataset.action) return;
  const id = button.dataset.id;
  if (button.dataset.action === 'edit') {
    openModal(id);
  }
  if (button.dataset.action === 'delete') {
    if (confirm('Eliminare questo record?')) {
      data[activeSection] = data[activeSection].filter(row => row.id !== id);
      saveData();
    }
  }
}

function handleFormSubmit() {
  const payload = {};
  for (let element of recordForm.elements) {
    if (element.name && element.value !== undefined) {
      payload[element.name] = element.value.trim();
    }
  }
  if (activeSection === 'students') {
    if (currentEdit) {
      const item = data.students.find(row => row.id === currentEdit);
      Object.assign(item, payload);
    } else {
      const nextId = `S${data.students.length + 1}`;
      data.students.push({ id: nextId, ...payload });
    }
  } else if (activeSection === 'artworks') {
    if (currentEdit) {
      const item = data.artworks.find(row => row.id === currentEdit);
      Object.assign(item, payload);
    } else {
      const nextId = `A${data.artworks.length + 1}`;
      data.artworks.push({ id: nextId, ...payload });
    }
  } else if (activeSection === 'loans') {
    if (currentEdit) {
      const item = data.loans.find(row => row.id === currentEdit);
      Object.assign(item, payload);
    } else {
      const nextId = `L${data.loans.length + 1}`;
      data.loans.push({ id: nextId, ...payload });
    }
  } else if (activeSection === 'exhibitions') {
    if (currentEdit) {
      const item = data.exhibitions.find(row => row.id === currentEdit);
      Object.assign(item, payload);
    } else {
      const nextId = `E${data.exhibitions.length + 1}`;
      data.exhibitions.push({ id: nextId, ...payload });
    }
  } else if (activeSection === 'feedback') {
    if (currentEdit) {
      const item = data.feedback.find(row => row.id === currentEdit);
      Object.assign(item, payload);
    } else {
      const nextId = `F${data.feedback.length + 1}`;
      data.feedback.push({ id: nextId, ...payload });
    }
  }
  saveData();
  closeModalWindow();
}

function handleReset() {
  if (confirm('Eliminare tutti i dati e rigenerare il demo?')) {
    data = generateDemoData();
    saveData();
  }
}

function render() {
  renderStats();
  renderTable();
}

addItemButton.addEventListener('click', () => openModal());
resetButton.addEventListener('click', handleReset);
closeModal.addEventListener('click', closeModalWindow);
cancelButton.addEventListener('click', closeModalWindow);
saveButton.addEventListener('click', handleFormSubmit);
tabs.forEach(tab => tab.addEventListener('click', handleSectionChange));
tableBody.addEventListener('click', handleTableAction);

render();
