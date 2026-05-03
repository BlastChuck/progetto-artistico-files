const STORAGE_KEY = 'dbDemoData_v2';

// ==== DOM ELEMENTS ====
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const filterType = document.getElementById('filter-type');
const statsBar = document.getElementById('stats-bar');
const itemsList = document.getElementById('items-list');
const detailsPanel = document.getElementById('details-panel');
const breadcrumb = document.getElementById('breadcrumb');
const addItemBtn = document.getElementById('add-item-btn');
const panelTitle = document.getElementById('panel-title');
const resetButton = document.getElementById('reset-button');
const modal = document.getElementById('record-modal');
const closeModal = document.getElementById('close-modal');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');
const recordForm = document.getElementById('record-form');
const formFields = document.getElementById('form-fields');
const modalTitle = document.getElementById('modal-title');

// ==== STATE ====
let data = loadData();
let currentView = null; // null = tutti, { type, id } = dettagli elemento
let searchResults = [];
let currentEdit = null;
let currentCategoryFilter = ''; // Traccia la categoria filtrata
let currentFormType = null;
let toastTimeoutId = null;

// ==== INIT ====
function initialize() {
  renderStats();
  renderAllItems();
  setupEventListeners();
}

function setupEventListeners() {
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  filterType.addEventListener('change', handleSearch);
  addItemBtn.addEventListener('click', () => showTypeSelector());
  resetButton.addEventListener('click', handleReset);
  closeModal.addEventListener('click', closeModalWindow);
  cancelButton.addEventListener('click', closeModalWindow);
  saveButton.addEventListener('click', handleFormSubmit);

  // Aggiungi listener ai pulsanti categoria
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategoryFilter = e.target.dataset.category;
      renderAllItems();
    });
  });
}

// ==== DATA MANAGEMENT ====
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = generateDemoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeDataShape(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    const seed = generateDemoData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function normalizeDataShape(rawData) {
  const normalized = {
    students: Array.isArray(rawData?.students) ? rawData.students : [],
    artworks: Array.isArray(rawData?.artworks) ? rawData.artworks : [],
    loans: Array.isArray(rawData?.loans) ? rawData.loans : [],
    exhibitions: Array.isArray(rawData?.exhibitions) ? rawData.exhibitions : [],
    feedback: Array.isArray(rawData?.feedback) ? rawData.feedback : []
  };

  // Ripara dati salvati in collezioni sbagliate da vecchi bug del form.
  const movedFromArtworks = [];
  normalized.artworks = normalized.artworks.filter((item) => {
    const isArtwork = item && typeof item === 'object' && 'studentId' in item && 'title' in item;
    if (!isArtwork) movedFromArtworks.push(item);
    return isArtwork;
  });

  movedFromArtworks.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    if ('artworkId' in item && 'destination' in item) {
      normalized.loans.push(item);
      return;
    }
    if ('artworkId' in item && 'teacher' in item) {
      normalized.feedback.push(item);
      return;
    }
    if ('location' in item && 'period' in item) {
      normalized.exhibitions.push(item);
    }
  });

  return normalized;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderAllItems();
  renderStats();
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

  const exhibitions = exhibitionNames.map((name, index) => ({
    id: `E${index + 1}`,
    name,
    location: randomFrom(['Sala Blu', 'Cortile', 'Auditorium', 'Spazio X', 'Atrio Principale']),
    period: `0${1 + index}/05/2026 - 0${3 + index}/05/2026`,
    status: randomFrom(['Programmata', 'In corso', 'Conclusa'])
  }));

  const artworks = artworkTitles.map((title, index) => {
    const author = randomFrom(students);
    const shouldBeInExhibition = Math.random() > 0.5;
    const exhibition = shouldBeInExhibition ? randomFrom(exhibitions) : null;
    return {
      id: `A${index + 1}`,
      title,
      studentId: author.id,
      exhibitionId: exhibition?.id || '',
      type: randomFrom(['Pittura', 'Scultura', 'Digital art', 'Installazione', 'Multimedia']),
      status: exhibition ? 'In mostra' : randomFrom(['In corso', 'Completato', 'In prestito']),
      value: `${Math.floor(300 + Math.random() * 1200)} €`
    };
  });

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

// ==== SEARCH & FILTER ====
function handleSearch() {
  const query = searchInput.value.toLowerCase().trim();
  const typeFilter = filterType.value;
  
  searchResults = [];
  
  if (!query) {
    renderAllItems();
    return;
  }

  // Ricerca in studenti
  if (!typeFilter || typeFilter === 'students') {
    data.students.forEach(item => {
      if (item.name.toLowerCase().includes(query) || 
          item.id.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query)) {
        searchResults.push({ ...item, entityType: 'students' });
      }
    });
  }

  // Ricerca in opere
  if (!typeFilter || typeFilter === 'artworks') {
    data.artworks.forEach(item => {
      if (item.title.toLowerCase().includes(query) || 
          item.id.toLowerCase().includes(query)) {
        searchResults.push({ ...item, entityType: 'artworks' });
      }
    });
  }

  // Ricerca in prestiti
  if (!typeFilter || typeFilter === 'loans') {
    data.loans.forEach(item => {
      if (item.id.toLowerCase().includes(query) || 
          item.destination.toLowerCase().includes(query)) {
        searchResults.push({ ...item, entityType: 'loans' });
      }
    });
  }

  // Ricerca in mostre
  if (!typeFilter || typeFilter === 'exhibitions') {
    data.exhibitions.forEach(item => {
      if (item.name.toLowerCase().includes(query) || 
          item.id.toLowerCase().includes(query)) {
        searchResults.push({ ...item, entityType: 'exhibitions' });
      }
    });
  }

  // Ricerca in feedback
  if (!typeFilter || typeFilter === 'feedback') {
    data.feedback.forEach(item => {
      if (item.id.toLowerCase().includes(query) || 
          item.teacher.toLowerCase().includes(query)) {
        searchResults.push({ ...item, entityType: 'feedback' });
      }
    });
  }

  renderSearchResults();
}

// ==== RENDERING ====
function renderStats() {
  statsBar.innerHTML = '';
  const stats = [
    { icon: '👤', label: 'Studenti', value: data.students.length },
    { icon: '🎨', label: 'Opere', value: data.artworks.length },
    { icon: '📦', label: 'Prestiti', value: data.loans.length },
    { icon: '🎭', label: 'Mostre', value: data.exhibitions.length },
    { icon: '⭐', label: 'Feedback', value: data.feedback.length }
  ];

  stats.forEach(stat => {
    const div = document.createElement('div');
    div.className = 'stat-item';
    div.innerHTML = `<span class="stat-icon">${stat.icon}</span><span class="stat-label">${stat.label}</span><strong>${stat.value}</strong>`;
    statsBar.appendChild(div);
  });
}

function renderAllItems() {
  searchResults = [];
  
  // Raccogli tutti gli elementi con il loro tipo
  if (!currentCategoryFilter || currentCategoryFilter === 'students') {
    data.students.forEach(item => {
      searchResults.push({ ...item, entityType: 'students', displayName: item.name, displayIcon: '👤' });
    });
  }
  if (!currentCategoryFilter || currentCategoryFilter === 'artworks') {
    data.artworks.forEach(item => {
      searchResults.push({ ...item, entityType: 'artworks', displayName: item.title, displayIcon: '🎨' });
    });
  }
  if (!currentCategoryFilter || currentCategoryFilter === 'loans') {
    data.loans.forEach(item => {
      searchResults.push({ ...item, entityType: 'loans', displayName: `Prestito: ${item.destination}`, displayIcon: '📦' });
    });
  }
  if (!currentCategoryFilter || currentCategoryFilter === 'exhibitions') {
    data.exhibitions.forEach(item => {
      searchResults.push({ ...item, entityType: 'exhibitions', displayName: item.name, displayIcon: '🎭' });
    });
  }
  if (!currentCategoryFilter || currentCategoryFilter === 'feedback') {
    data.feedback.forEach(item => {
      searchResults.push({ ...item, entityType: 'feedback', displayName: `Feedback (${item.teacher})`, displayIcon: '⭐' });
    });
  }

  currentView = null;
  
  // Aggiorna il titolo del pannello in base al filtro
  if (currentCategoryFilter) {
    panelTitle.textContent = getTypeLabelPlural(currentCategoryFilter);
  } else {
    panelTitle.textContent = 'Archivio completo';
  }
  
  renderSearchResults();
  updateBreadcrumb();
}

function renderSearchResults() {
  itemsList.innerHTML = '';

  if (searchResults.length === 0) {
    itemsList.innerHTML = '<p class="no-results">Nessun risultato trovato</p>';
    detailsPanel.innerHTML = '';
    return;
  }

  const groups = {};
  searchResults.forEach(item => {
    const groupType = item.entityType || item.type;
    if (!groups[groupType]) groups[groupType] = [];
    groups[groupType].push(item);
  });

  const typeOrder = ['students', 'artworks', 'loans', 'exhibitions', 'feedback'];
  typeOrder.forEach(type => {
    if (!groups[type]) return;

    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <span class="category-icon">${getIconForType(type)}</span>
      <span class="category-label">${getTypeLabelPlural(type)}</span>
    `;
    itemsList.appendChild(header);

    groups[type].forEach(item => {
      const div = document.createElement('div');
      div.className = 'item-card';
      const itemType = item.entityType || item.type;
      div.onclick = () => selectItem(itemType, item.id);
      
      const displayText = item.displayName || item.name || item.title || item.id;
      const displayIcon = item.displayIcon || getIconForType(itemType);
      
      div.innerHTML = `
        <span class="item-icon">${displayIcon}</span>
        <div class="item-info">
          <div class="item-name">${displayText}</div>
        </div>
      `;
      itemsList.appendChild(div);
    });
  });
}

function selectItem(type, id) {
  if (!data[type]) return;
  currentView = { type, id };
  updateBreadcrumb();
  renderItemDetails(type, id);
}

function renderItemDetails(type, id) {
  detailsPanel.innerHTML = '';
  const item = data[type].find(i => i.id === id);

  if (!item) return;

  const detailsHTML = document.createElement('div');
  detailsHTML.className = 'details-container';

  // Titolo principale
  const header = document.createElement('div');
  header.className = 'details-header';
  header.innerHTML = `
    <div>
      <h2>${getIconForType(type)} ${item.name || item.title || item.id}</h2>
      <p class="item-id">ID: ${item.id}</p>
    </div>
    <div class="details-actions">
      <button onclick="editItem('${type}', '${id}')" class="button button--secondary">Modifica</button>
      <button onclick="deleteItem('${type}', '${id}')" class="button button--secondary">Elimina</button>
    </div>
  `;
  detailsHTML.appendChild(header);

  // Dettagli principali
  const detailsSection = document.createElement('div');
  detailsSection.className = 'details-section';
  detailsSection.innerHTML = '<h3>Dettagli</h3>';
  
  const details = document.createElement('div');
  details.className = 'details-content';
  
  if (type === 'students') {
    details.innerHTML = `
      <div class="detail-row"><label>Nome:</label><span>${item.name}</span></div>
      <div class="detail-row"><label>Classe:</label><span>${item.class}</span></div>
      <div class="detail-row"><label>Media:</label><span>${item.average}</span></div>
      <div class="detail-row"><label>Email:</label><span>${item.email}</span></div>
    `;
  } else if (type === 'artworks') {
    const student = data.students.find(s => s.id === item.studentId);
    const exhibition = item.exhibitionId ? data.exhibitions.find(e => e.id === item.exhibitionId) : null;
    details.innerHTML = `
      <div class="detail-row"><label>Titolo:</label><span>${item.title}</span></div>
      <div class="detail-row"><label>Autore:</label><span>${student?.name || '---'}</span></div>
      <div class="detail-row"><label>Tipo:</label><span>${item.type}</span></div>
      <div class="detail-row"><label>Stato:</label><span>${item.status}</span></div>
      <div class="detail-row"><label>Mostra:</label><span>${exhibition?.name || 'Nessuna'}</span></div>
      <div class="detail-row"><label>Valore:</label><span>${item.value}</span></div>
    `;
  } else if (type === 'loans') {
    const artwork = data.artworks.find(a => a.id === item.artworkId);
    details.innerHTML = `
      <div class="detail-row"><label>Opera:</label><span>${artwork?.title || '---'}</span></div>
      <div class="detail-row"><label>Destinazione:</label><span>${item.destination}</span></div>
      <div class="detail-row"><label>Corriere:</label><span>${item.courier}</span></div>
      <div class="detail-row"><label>Periodo:</label><span>${item.period}</span></div>
      <div class="detail-row"><label>Stato:</label><span>${item.status}</span></div>
    `;
  } else if (type === 'exhibitions') {
    const exhibitionArtworks = data.artworks.filter(a => a.exhibitionId === item.id);
    details.innerHTML = `
      <div class="detail-row"><label>Evento:</label><span>${item.name}</span></div>
      <div class="detail-row"><label>Luogo:</label><span>${item.location}</span></div>
      <div class="detail-row"><label>Periodo:</label><span>${item.period}</span></div>
      <div class="detail-row"><label>Stato:</label><span>${item.status}</span></div>
      <div class="detail-row"><label>Opere esposte:</label><span>${exhibitionArtworks.length}</span></div>
    `;
  } else if (type === 'feedback') {
    const artwork = data.artworks.find(a => a.id === item.artworkId);
    details.innerHTML = `
      <div class="detail-row"><label>Opera:</label><span>${artwork?.title || '---'}</span></div>
      <div class="detail-row"><label>Docente:</label><span>${item.teacher}</span></div>
      <div class="detail-row"><label>Voto:</label><span>${item.score}</span></div>
      <div class="detail-row"><label>Tipo:</label><span>${item.type}</span></div>
    `;
  }
  
  detailsSection.appendChild(details);
  detailsHTML.appendChild(detailsSection);

  // Relazioni
  const relatedSection = document.createElement('div');
  relatedSection.className = 'details-section related-section';
  relatedSection.innerHTML = '<h3>Elementi correlati</h3>';
  
  const relatedList = document.createElement('div');
  relatedList.className = 'related-list';
  
  if (type === 'students') {
    // Mostra le opere dello studente
    const studentArtworks = data.artworks.filter(a => a.studentId === id);
    const studentFeedback = data.feedback.filter(f => {
      const artwork = data.artworks.find(a => a.id === f.artworkId);
      return artwork && artwork.studentId === id;
    });

    if (studentArtworks.length > 0) {
      relatedList.innerHTML += `<div class="related-group"><strong>🎨 Opere (${studentArtworks.length})</strong></div>`;
      studentArtworks.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'related-item';
        btn.textContent = a.title;
        btn.onclick = () => selectItem('artworks', a.id);
        relatedList.appendChild(btn);
      });
    }

    if (studentFeedback.length > 0) {
      relatedList.innerHTML += `<div class="related-group"><strong>⭐ Feedback ricevuti (${studentFeedback.length})</strong></div>`;
      studentFeedback.forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'related-item';
        btn.textContent = `${f.teacher} - Voto: ${f.score}`;
        btn.onclick = () => selectItem('feedback', f.id);
        relatedList.appendChild(btn);
      });
    }
  } else if (type === 'artworks') {
    // Mostra autore, prestiti, feedback
    const author = data.students.find(s => s.id === item.studentId);
    const artworkLoans = data.loans.filter(l => l.artworkId === id);
    const artworkFeedback = data.feedback.filter(f => f.artworkId === id);
    const exhibition = item.exhibitionId ? data.exhibitions.find(e => e.id === item.exhibitionId) : null;

    if (author) {
      relatedList.innerHTML += `<div class="related-group"><strong>👤 Autore</strong></div>`;
      const btn = document.createElement('button');
      btn.className = 'related-item';
      btn.textContent = author.name;
      btn.onclick = () => selectItem('students', author.id);
      relatedList.appendChild(btn);
    }

    if (artworkLoans.length > 0) {
      relatedList.innerHTML += `<div class="related-group"><strong>📦 Prestiti (${artworkLoans.length})</strong></div>`;
      artworkLoans.forEach(l => {
        const btn = document.createElement('button');
        btn.className = 'related-item';
        btn.textContent = `${l.destination} (${l.status})`;
        btn.onclick = () => selectItem('loans', l.id);
        relatedList.appendChild(btn);
      });
    }

    if (artworkFeedback.length > 0) {
      relatedList.innerHTML += `<div class="related-group"><strong>⭐ Feedback (${artworkFeedback.length})</strong></div>`;
      artworkFeedback.forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'related-item';
        btn.textContent = `${f.teacher} - ${f.score}/10`;
        btn.onclick = () => selectItem('feedback', f.id);
        relatedList.appendChild(btn);
      });
    }
    if (exhibition) {
      relatedList.innerHTML += `<div class="related-group"><strong>🎭 In mostra</strong></div>`;
      const btn = document.createElement('button');
      btn.className = 'related-item';
      btn.textContent = exhibition.name;
      btn.onclick = () => selectItem('exhibitions', exhibition.id);
      relatedList.appendChild(btn);
    }
  } else if (type === 'loans') {
    // Mostra opera
    const artwork = data.artworks.find(a => a.id === item.artworkId);
    if (artwork) {
      relatedList.innerHTML += `<div class="related-group"><strong>🎨 Opera</strong></div>`;
      const btn = document.createElement('button');
      btn.className = 'related-item';
      btn.textContent = artwork.title;
      btn.onclick = () => selectItem('artworks', artwork.id);
      relatedList.appendChild(btn);
    }
  } else if (type === 'feedback') {
    // Mostra opera
    const artwork = data.artworks.find(a => a.id === item.artworkId);
    if (artwork) {
      relatedList.innerHTML += `<div class="related-group"><strong>🎨 Opera</strong></div>`;
      const btn = document.createElement('button');
      btn.className = 'related-item';
      btn.textContent = artwork.title;
      btn.onclick = () => selectItem('artworks', artwork.id);
      relatedList.appendChild(btn);
    }
  } else if (type === 'exhibitions') {
    const exhibitionArtworks = data.artworks.filter(a => a.exhibitionId === id);
    if (exhibitionArtworks.length > 0) {
      relatedList.innerHTML += `<div class="related-group"><strong>🎨 Opere in mostra (${exhibitionArtworks.length})</strong></div>`;
      exhibitionArtworks.forEach((artwork) => {
        const btn = document.createElement('button');
        btn.className = 'related-item';
        btn.textContent = artwork.title;
        btn.onclick = () => selectItem('artworks', artwork.id);
        relatedList.appendChild(btn);
      });
    }
  }

  if (relatedList.children.length > 0) {
    relatedSection.appendChild(relatedList);
    detailsHTML.appendChild(relatedSection);
  }

  detailsPanel.appendChild(detailsHTML);
}

// ==== MODAL & FORMS ====
function openModal(type = null, editId = null) {
  currentEdit = editId;
  
  if (!type && currentView) {
    type = currentView.type;
    editId = currentView.id;
  }

  if (!type && editId === null) {
    showTypeSelector();
    return;
  }

  const isEdit = editId !== null;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  
  modalTitle.textContent = isEdit ? `Modifica` : `Aggiungi nuovo`;
  currentFormType = type;
  buildForm(type, editId);
}

function closeModalWindow() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  formFields.innerHTML = '';
  currentEdit = null;
  currentFormType = null;
  document.querySelector('.modal-actions .button--primary').style.display = '';
}

function showTypeSelector() {
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  modalTitle.textContent = 'Seleziona il tipo di record';
  formFields.innerHTML = '';
  currentFormType = null;
  
  const types = [
    { value: 'students', label: '👤 Studente', desc: 'Aggiungi un nuovo studente' },
    { value: 'artworks', label: '🎨 Opera', desc: 'Aggiungi una nuova opera' },
    { value: 'loans', label: '📦 Prestito', desc: 'Registra un nuovo prestito' },
    { value: 'exhibitions', label: '🎭 Mostra', desc: 'Crea una nuova mostra' },
    { value: 'feedback', label: '⭐ Feedback', desc: 'Aggiungi un feedback' }
  ];

  const container = document.createElement('div');
  container.style.display = 'grid';
  container.style.gap = '1rem';

  types.forEach(type => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'button button--primary';
    btn.style.justifyContent = 'flex-start';
    btn.style.padding = '1.2rem';
    btn.style.marginBottom = '0.5rem';
    btn.style.border = 'none';
    btn.innerHTML = `<div style="flex: 1; text-align: left;"><div style="font-weight: 500;">${type.label}</div><div style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.25rem;">${type.desc}</div></div>`;
    btn.onclick = () => {
      formFields.innerHTML = '';
      currentFormType = type.value;
      buildForm(type.value, null);
      recordForm.onsubmit = null;
      document.querySelector('.modal-actions .button--primary').style.display = '';
    };
    container.appendChild(btn);
  });

  formFields.appendChild(container);
  document.querySelector('.modal-actions .button--primary').style.display = 'none';
}

function buildForm(type, editId) {
  currentFormType = type;
  formFields.innerHTML = '';
  const item = editId ? data[type].find(i => i.id === editId) : null;

  if (type === 'students') {
    formFields.appendChild(createField('Nome', 'name', item?.name || ''));
    formFields.appendChild(createField('Classe', 'class', item?.class || ''));
    formFields.appendChild(createField('Media', 'average', item?.average || ''));
    formFields.appendChild(createField('Email', 'email', item?.email || ''));
  } else if (type === 'artworks') {
    formFields.appendChild(createSelect('studentId', 'Autore', data.students, item?.studentId));
    formFields.appendChild(createField('Titolo', 'title', item?.title || ''));
    formFields.appendChild(createSelect('type', 'Tipo', ['Pittura','Scultura','Digital art','Installazione','Multimedia'], item?.type));
    formFields.appendChild(createSelect('status', 'Stato', ['In corso','Completato','In mostra','In prestito'], item?.status));
    formFields.appendChild(createSelect('exhibitionId', 'Mostra', data.exhibitions, item?.exhibitionId, { includeEmptyOption: true, emptyLabel: 'Nessuna mostra' }));
    formFields.appendChild(createField('Valore', 'value', item?.value || ''));
  } else if (type === 'loans') {
    formFields.appendChild(createSelect('artworkId', 'Opera', data.artworks, item?.artworkId));
    formFields.appendChild(createField('Destinazione', 'destination', item?.destination || ''));
    formFields.appendChild(createField('Corriere', 'courier', item?.courier || ''));
    formFields.appendChild(createField('Periodo', 'period', item?.period || ''));
    formFields.appendChild(createSelect('status', 'Stato', ['In transito','Consegnato','Ritardo'], item?.status));
  } else if (type === 'exhibitions') {
    formFields.appendChild(createField('Evento', 'name', item?.name || ''));
    formFields.appendChild(createField('Luogo', 'location', item?.location || ''));
    formFields.appendChild(createField('Periodo', 'period', item?.period || ''));
    formFields.appendChild(createSelect('status', 'Stato', ['Programmata','In corso','Conclusa'], item?.status));
  } else if (type === 'feedback') {
    const artworkSelect = createSelect('artworkId', 'Opera', data.artworks, item?.artworkId);
    formFields.appendChild(artworkSelect);
    
    // Aggiungi un campo info che mostra lo studente autore
    const studentInfo = document.createElement('div');
    studentInfo.id = 'feedback-student-info';
    studentInfo.style.padding = '0.75rem 1rem';
    studentInfo.style.borderRadius = '12px';
    studentInfo.style.background = 'rgba(93, 140, 255, 0.1)';
    studentInfo.style.color = 'var(--primary)';
    studentInfo.style.fontSize = '0.9rem';
    studentInfo.style.border = '1px solid rgba(93, 140, 255, 0.2)';
    
    // Mostra lo studente al caricamento
    if (item?.artworkId) {
      const artwork = data.artworks.find(a => a.id === item.artworkId);
      const student = artwork ? data.students.find(s => s.id === artwork.studentId) : null;
      if (student) {
        studentInfo.innerHTML = `<strong>📌 Studente:</strong> ${student.name} (${student.class})`;
      }
    } else if (data.artworks.length > 0) {
      const firstArtwork = data.artworks[0];
      const student = data.students.find(s => s.id === firstArtwork.studentId);
      if (student) {
        studentInfo.innerHTML = `<strong>📌 Studente:</strong> ${student.name} (${student.class})`;
      }
    }
    
    formFields.appendChild(studentInfo);
    
    // Aggiungi listener al select per aggiornare le info
    const select = artworkSelect.querySelector('select');
    select.addEventListener('change', () => {
      const selectedArtworkId = select.value;
      const artwork = data.artworks.find(a => a.id === selectedArtworkId);
      const student = artwork ? data.students.find(s => s.id === artwork.studentId) : null;
      if (student) {
        studentInfo.innerHTML = `<strong>📌 Studente:</strong> ${student.name} (${student.class})`;
      }
    });
    
    formFields.appendChild(createField('Docente', 'teacher', item?.teacher || ''));
    formFields.appendChild(createField('Voto', 'score', item?.score || ''));
    formFields.appendChild(createSelect('type', 'Tipo', ['Formativo','Ufficiale'], item?.type));
  }
}

function createField(labelText, name, value = '') {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.name = name;
  input.value = value;
  input.required = true;
  label.appendChild(input);
  label.prepend(document.createTextNode(labelText));
  return label;
}

function createSelect(name, labelText, options, selectedValue = '', config = {}) {
  const label = document.createElement('label');
  const select = document.createElement('select');
  select.name = name;
  const { includeEmptyOption = false, emptyLabel = '---' } = config;
  select.required = !includeEmptyOption;

  if (includeEmptyOption) {
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = emptyLabel;
    select.appendChild(emptyOption);
  }

  options.forEach(option => {
    const opt = document.createElement('option');
    if (typeof option === 'object') {
      opt.value = option.id;
      opt.textContent = option.name || option.title;
    } else {
      opt.value = option;
      opt.textContent = option;
    }
    select.appendChild(opt);
  });

  select.value = selectedValue || '';
  label.appendChild(select);
  label.prepend(document.createTextNode(labelText));
  return label;
}

function handleFormSubmit() {
  const payload = {};
  for (let element of recordForm.elements) {
    if (element.name) {
      payload[element.name] = element.value.trim();
    }
  }

  const type = currentFormType || currentView?.type;
  if (!type || !data[type]) {
    alert('Seleziona prima il tipo di record da creare.');
    return;
  }
  
  if (currentEdit) {
    const item = data[type].find(i => i.id === currentEdit);
    if (!item) return;
    Object.assign(item, payload);
    
    // Se abbiamo appena aggiunto un feedback, aggiorna la media dello studente
    if (type === 'feedback') {
      updateStudentAverageFromFeedback(currentEdit);
    }
  } else {
    const nextId = getNextId(type);
    payload.id = nextId;
    data[type].push(payload);
    
    // Se abbiamo appena aggiunto un feedback, aggiorna la media dello studente
    if (type === 'feedback') {
      updateStudentAverageFromFeedback(nextId);
    }
  }

  const actionLabel = currentEdit ? 'aggiornato' : 'salvato';
  showToast(`${getTypeLabel(type)} ${actionLabel} con successo`);

  saveData();
  closeModalWindow();
  if (currentView) {
    renderItemDetails(type, currentEdit || payload.id);
  } else {
    renderAllItems();
  }
}

function updateStudentAverageFromFeedback(feedbackId) {
  const feedback = data.feedback.find(f => f.id === feedbackId);
  if (!feedback) return;

  const artwork = data.artworks.find(a => a.id === feedback.artworkId);
  if (!artwork) return;

  const student = data.students.find(s => s.id === artwork.studentId);
  if (!student) return;

  // Calcola la media dei voti di tutti i feedback associati alle opere di questo studente
  const studentArtworks = data.artworks.filter(a => a.studentId === student.id);
  const feedbackScores = data.feedback
    .filter(f => studentArtworks.some(a => a.id === f.artworkId))
    .map(f => parseFloat(f.score));

  if (feedbackScores.length > 0) {
    const average = (feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length).toFixed(2);
    student.average = average;
  }
}

function getNextId(type) {
  const prefixMap = {
    students: 'S',
    artworks: 'A',
    loans: 'L',
    exhibitions: 'E',
    feedback: 'F'
  };
  const prefix = prefixMap[type] || type[0].toUpperCase();
  const count = data[type].length + 1;
  return `${prefix}${count}`;
}

function editItem(type, id) {
  currentEdit = id;
  openModal(type, id);
}

function deleteItem(type, id) {
  if (confirm('Eliminare questo record?')) {
    data[type] = data[type].filter(i => i.id !== id);
    saveData();
    currentView = null;
    renderAllItems();
  }
}

function handleReset() {
  if (confirm('Eliminare tutti i dati e rigenerare il demo?')) {
    data = generateDemoData();
    saveData();
    currentView = null;
    renderAllItems();
  }
}

// ==== UTILITIES ====
function getTypeLabel(type) {
  const map = {
    students: 'Studente',
    artworks: 'Opera',
    loans: 'Prestito',
    exhibitions: 'Mostra',
    feedback: 'Feedback'
  };
  return map[type] || type;
}

function getTypeLabelPlural(type) {
  const map = {
    students: 'Studenti',
    artworks: 'Opere',
    loans: 'Prestiti',
    exhibitions: 'Mostre',
    feedback: 'Feedback'
  };
  return map[type] || type;
}

function getIconForType(type) {
  const map = {
    students: '👤',
    artworks: '🎨',
    loans: '📦',
    exhibitions: '🎭',
    feedback: '⭐'
  };
  return map[type] || '📄';
}

function showToast(message) {
  let toast = document.getElementById('save-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'save-toast';
    toast.className = 'toast-message';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('visible');

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

function updateBreadcrumb() {
  breadcrumb.innerHTML = '';

  const home = document.createElement('button');
  home.className = 'breadcrumb-item';
  home.textContent = '📚 Archivio';
  home.onclick = () => {
    currentView = null;
    renderAllItems();
    updateBreadcrumb();
  };
  breadcrumb.appendChild(home);

  if (currentView) {
    const item = data[currentView.type].find(i => i.id === currentView.id);
    const span = document.createElement('span');
    span.className = 'breadcrumb-separator';
    span.textContent = ' / ';
    breadcrumb.appendChild(span);

    const current = document.createElement('span');
    current.className = 'breadcrumb-item active';
    current.textContent = `${getIconForType(currentView.type)} ${item?.name || item?.title || item?.id}`;
    breadcrumb.appendChild(current);
  }
}

// ==== START ====
initialize();
