// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA1JqC6L9CnF1sWjyWlZYlcb0074jijM_E",
  authDomain: "meowwoof-67c77.firebaseapp.com",
  projectId: "meowwoof-67c77",
  storageBucket: "meowwoof-67c77.appspot.com",
  messagingSenderId: "749375371300",
  appId: "1:749375371300:web:5708744ec73f7b8f8640b1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const adminEmails = ["ced@gmail.com"];

// Global Variables
let currentPetCard = null;
window.currentUserRole = null;

// === DOM Elements ===
// Auth Elements
const authModal = document.getElementById('auth-modal');
const registerSection = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');

// Adoption Elements
const adoptModal = document.getElementById('adopt-modal');
const adoptFullName = document.getElementById('adoptFullName');
const adoptEmail = document.getElementById('adoptEmail');
const adoptPhone = document.getElementById('adoptPhone');
const adoptAddress = document.getElementById('adoptAddress');
const adoptHousehold = document.getElementById('adoptHousehold');
const adoptHomeType = document.getElementById('adoptHomeType');
const adoptPetType = document.getElementById('adoptPetType');
const adoptDate = document.getElementById('adoptDate');
const adoptMessage = document.getElementById('adoptMessage');

// Notification Elements
const notificationContainer = document.getElementById('notification-container');
const notifBtn = document.getElementById('notifBtn');
const notifCount = document.getElementById('notifCount');

// Admin Elements
const adminDashboard = document.getElementById('admin-dashboard');
const showAdminBtn = document.getElementById('show-admin-btn');
const adoptionRequestsTbody = document.getElementById('adoption-requests');

// Content Elements
const mainContent = document.getElementById('main-content');
const featuredPetsContainer = document.getElementById('featured-pets');
const petGridContainer = document.getElementById('pet-grid');

// === Auth Functions ===
function openAuthModal() { 
  authModal.style.display = 'flex'; 
}

function closeAuthModal() { 
  authModal.style.display = 'none'; 
}

function showRegister() { 
  registerSection.style.display = 'block'; 
  loginSection.style.display = 'none'; 
}

function showLogin() { 
  registerSection.style.display = 'none'; 
  loginSection.style.display = 'block'; 
}

// Register Function
async function register() {
  const email = registerEmailInput.value;
  const password = registerPasswordInput.value;
  
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const role = adminEmails.includes(email) ? 'admin' : 'user';
    
    await db.collection('users').doc(userCredential.user.uid).set({ 
      role, 
      email 
    });
    
    alert('Registration successful!');
    showLogin();
  } catch(e) { 
    alert(e.message); 
  }
}

// Login Function
async function login() {
  const email = loginEmailInput.value;
  const password = loginPasswordInput.value;
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const role = adminEmails.includes(email) ? 'admin' : 'user';
    window.currentUserRole = role;
    
    await db.collection('users').doc(userCredential.user.uid).set({ 
      email, 
      role 
    }, { merge: true });
    
    alert('Login successful!');
    mainContent.style.display = 'block';
    authModal.style.display = 'none';
    
    if (role === 'admin') {
      loadAdminDashboard();
    }
    
    loadPets();
    loadNotifications();
  } catch(e) { 
    alert(e.message); 
  }
}

// Logout Function
function logout() {
  auth.signOut();
  mainContent.style.display = 'none';
  showAdminBtn.style.display = 'none';
  adminDashboard.style.display = 'none';
  authModal.style.display = 'flex';
  showLogin();
}

// === Pet Functions ===
async function loadPets() {
  try {
    // Fetch cats from Cat API
    const catRes = await fetch('https://api.thecatapi.com/v1/images/search?limit=4');
    const catData = await catRes.json();
    
    // Fetch dogs from Dog API
    const dogRes = await fetch('https://api.thedogapi.com/v1/images/search?limit=4');
    const dogData = await dogRes.json();
    
    // Combine pets
    const allPets = [
      ...catData.map(c => ({ url: c.url, type: 'Cat', id: c.id })),
      ...dogData.map(d => ({ url: d.url, type: 'Dog', id: d.id }))
    ];
    
    // Clear containers
    featuredPetsContainer.innerHTML = '';
    petGridContainer.innerHTML = '';
    
    // Create pet cards
    allPets.forEach(pet => {
      createPetCard(pet, featuredPetsContainer, 'card-');
      createPetCard(pet, petGridContainer, 'cardgrid-');
    });
  } catch(error) {
    console.error('Error loading pets:', error);
  }
}

function createPetCard(pet, container, idPrefix) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = idPrefix + pet.id;
  
  let adoptBtn = '';
  if (window.currentUserRole !== 'admin') {
    adoptBtn = `<button class="adopt-btn" onclick="openAdoptModal('${pet.id}', this)">Adopt</button>`;
  }
  
  card.innerHTML = `
    <div class="heart" onclick="toggleHeart(this)">❤️</div>
    <img src="${pet.url}" alt="${pet.type}">
    <h3>${pet.type}</h3>
    <p>1 year • Male</p>
    ${adoptBtn}
  `;
  
  container.appendChild(card);
}

// Filter Pets Function
function filterPets(type) {
  const cards = document.querySelectorAll('#featured-pets .card, #pet-grid .card');
  
  cards.forEach(card => {
    const petType = card.querySelector('h3').innerText.toLowerCase();
    let filterType = type === 'puppy' ? 'cat' : type;
    card.style.display = petType.includes(filterType) ? 'block' : 'none';
  });
}

// Toggle Heart Function
function toggleHeart(el) { 
  el.classList.toggle('favorited'); 
}

// === Adoption Functions ===
function openAdoptModal(petId, btn) { 
  currentPetCard = btn.parentElement; 
  adoptModal.style.display = 'flex'; 
  document.body.classList.add('modal-open'); 
}

function closeAdoptModal() { 
  adoptModal.style.display = 'none'; 
  document.body.classList.remove('modal-open'); 
}

async function submitAdoption() {
  // Get form values
  const fullName = adoptFullName.value;
  const email = adoptEmail.value;
  const phone = adoptPhone.value;
  const address = adoptAddress.value;
  const household = adoptHousehold.value;
  const homeType = adoptHomeType.value;
  const petType = adoptPetType.value;
  const date = adoptDate.value;
  const message = adoptMessage.value;
  
  // Validation
  if (!fullName || !email || !phone || !address || !household || !homeType || !petType || !date) { 
    alert('Please fill all required fields.'); 
    return; 
  }
  
  const user = auth.currentUser;
  if (!user) { 
    alert('Please login first.'); 
    return; 
  }
  
  try {
    // Save adoption request to Firestore
    await db.collection('adoptions').add({
      userId: user.uid,
      petId: currentPetCard.id.replace('card-', '').replace('cardgrid-', ''),
      fullName,
      email,
      phone,
      address,
      household,
      homeType,
      petType,
      date: firebase.firestore.Timestamp.fromDate(new Date(date)),
      message,
      status: 'On Process'
    });
    
    // Update UI
    const statusDiv = document.createElement('div');
    statusDiv.className = 'pet-status';
    statusDiv.innerText = 'On Process';
    currentPetCard.appendChild(statusDiv);
    
    const btn = currentPetCard.querySelector('button');
    if (btn) btn.remove();
    
    closeAdoptModal();
    alert('Adoption submitted! Status: On Process');
    
    // Clear form
    clearAdoptionForm();
  } catch(error) {
    alert('Error submitting adoption: ' + error.message);
  }
}

function clearAdoptionForm() {
  adoptFullName.value = '';
  adoptEmail.value = '';
  adoptPhone.value = '';
  adoptAddress.value = '';
  adoptHousehold.value = '';
  adoptHomeType.value = '';
  adoptPetType.value = '';
  adoptDate.value = '';
  adoptMessage.value = '';
}

// === Notification Functions ===
function toggleNotifications() {
  const container = notificationContainer;
  container.style.display = container.style.display === 'block' ? 'none' : 'block';
}

async function loadNotifications() {
  const user = auth.currentUser;
  if (!user) return;
  
  notificationContainer.innerHTML = '';
  
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', user.uid)
      .orderBy('timestamp', 'desc')
      .get();
    
    let unreadCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.read) unreadCount++;
      
      const notifDiv = document.createElement('div');
      notifDiv.style.padding = '8px';
      notifDiv.style.marginBottom = '6px';
      notifDiv.style.borderBottom = '1px solid #eee';
      notifDiv.style.fontSize = '0.9rem';
      notifDiv.style.background = data.read ? '#fff' : '#ffe6e6';
      notifDiv.style.borderRadius = '6px';
      notifDiv.innerText = data.message;
      
      notifDiv.onclick = async () => {
        if (!data.read) {
          await db.collection('notifications').doc(doc.id).update({ read: true });
          notifDiv.style.background = '#fff';
          unreadCount--;
          updateNotifBadge(unreadCount);
        }
      };
      
      notificationContainer.appendChild(notifDiv);
    });
    
    updateNotifBadge(unreadCount);
  } catch(error) {
    console.error('Error loading notifications:', error);
  }
}

function updateNotifBadge(count) {
  if (count > 0) {
    notifCount.style.display = 'block';
    notifCount.innerText = count;
  } else {
    notifCount.style.display = 'none';
  }
}

// === Admin Functions ===
async function loadAdminDashboard() {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (userDoc.exists && userDoc.data().role === 'admin') {
      adminDashboard.style.display = 'block';
      showAdminBtn.style.display = 'none';
      
      adoptionRequestsTbody.innerHTML = '';
      
      const snapshot = await db.collection('adoptions').orderBy('date', 'desc').get();
      
      if (snapshot.empty) {
        adoptionRequestsTbody.innerHTML = '<tr><td colspan="12" style="text-align:center;">No adoption requests found.</td></tr>';
        return;
      }
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td>${data.petId || 'N/A'}</td>
          <td>${data.fullName || 'N/A'}</td>
          <td>${data.email || 'N/A'}</td>
          <td>${data.phone || 'N/A'}</td>
          <td>${data.address || 'N/A'}</td>
          <td>${data.household || 'N/A'}</td>
          <td>${data.homeType || 'N/A'}</td>
          <td>${data.petType || 'N/A'}</td>
          <td>${data.date ? new Date(data.date.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
          <td>${data.message || ''}</td>
          <td>${data.status || 'On Process'}</td>
          <td>
            <button onclick="updateStatus('${doc.id}', 'Approved')">Approve</button>
            <button onclick="updateStatus('${doc.id}', 'Declined')">Decline</button>
          </td>
        `;
        
        adoptionRequestsTbody.appendChild(tr);
      });
    }
  } catch(error) {
    console.error('Error loading admin dashboard:', error);
  }
}

function toggleAdminDashboard() {
  if (adminDashboard.style.display === 'block') {
    adminDashboard.style.display = 'none';
    showAdminBtn.style.display = 'block';
  } else {
    adminDashboard.style.display = 'block';
    showAdminBtn.style.display = 'none';
    loadAdminDashboard();
  }
}

async function updateStatus(docId, status) {
  try {
    const adoptionDoc = await db.collection('adoptions').doc(docId).get();
    
    if (!adoptionDoc.exists) return;
    
    await db.collection('adoptions').doc(docId).update({ status });
    
    // Add notification for user
    const userId = adoptionDoc.data().userId;
    await db.collection('notifications').add({
      userId,
      message: `Your adoption request for pet ID ${adoptionDoc.data().petId} has been ${status}.`,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
    alert('Status updated!');
    loadAdminDashboard();
  } catch(error) {
    alert('Error updating status: ' + error.message);
  }
}

// === Firebase Auth State Listener ===
auth.onAuthStateChanged(async function(user) {
  if (user) {
    mainContent.style.display = 'block';
    authModal.style.display = 'none';
    
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      let role = userDoc.exists ? userDoc.data().role : 'user';
      window.currentUserRole = role;
      
      await db.collection('users').doc(user.uid).set({ 
        email: user.email, 
        role 
      }, { merge: true });
      
      if (role === 'admin') {
        loadAdminDashboard();
      }
      
      loadPets();
      
      // Real-time notification listener
      db.collection('notifications')
        .where('userId', '==', user.uid)
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
          const container = notificationContainer;
          container.innerHTML = '';
          let unreadCount = 0;
          
          snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.read) unreadCount++;
            
            const notifDiv = document.createElement('div');
            notifDiv.style.padding = '8px';
            notifDiv.style.marginBottom = '6px';
            notifDiv.style.borderBottom = '1px solid #eee';
            notifDiv.style.fontSize = '0.9rem';
            notifDiv.style.background = data.read ? '#fff' : '#ffe6e6';
            notifDiv.style.borderRadius = '6px';
            notifDiv.innerText = data.message;
            
            notifDiv.onclick = async () => {
              if (!data.read) {
                await db.collection('notifications').doc(doc.id).update({ read: true });
                notifDiv.style.background = '#fff';
              }
            };
            
            container.appendChild(notifDiv);
          });
          
          // Update badge
          notifCount.style.display = unreadCount > 0 ? 'block' : 'none';
          notifCount.innerText = unreadCount;
        });
    } catch(error) {
      console.error('Error in auth state change:', error);
    }
  } else {
    mainContent.style.display = 'none';
    showAdminBtn.style.display = 'none';
    adminDashboard.style.display = 'none';
    authModal.style.display = 'flex';
    showLogin();
  }
});

// === Initialize on Page Load ===
document.addEventListener('DOMContentLoaded', function() {
  // Set default date to today for adoption form
  const today = new Date().toISOString().split('T')[0];
  adoptDate.value = today;
  
  // Initialize Firebase (already done at top)
});
