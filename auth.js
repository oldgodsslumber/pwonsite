// Shared auth + Firebase init for PWonsite.
// Imported by pwonsite.html as a module. Gates access behind Google sign-in
// with an admin-approval flow. Exposes window._fb after approval; resolves
// window._fbReady (a Promise) with the same handles for code that needs to
// wait for auth before subscribing to data.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getDatabase, ref, set, get, onValue, remove
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const ADMIN_EMAIL = 'thatwalshguy@gmail.com';

const firebaseConfig = {
  apiKey:            'AIzaSyBy1euIqLdA4AQj3FgwLfuaI-tyWDiA0XQ',
  authDomain:        'pwonsite-8795f.firebaseapp.com',
  databaseURL:       'https://pwonsite-8795f-default-rtdb.firebaseio.com',
  projectId:         'pwonsite-8795f',
  storageBucket:     'pwonsite-8795f.firebasestorage.app',
  messagingSenderId: '744803949708',
  appId:             '1:744803949708:web:665aa29133511628be6fa9',
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

window._fbReady = new Promise(resolve => { window._fbReadyResolve = resolve; });

// ── Styles ──────────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
#pw-auth-overlay { position: fixed; inset: 0; background: #0d0d12; color: #e0e0ec; z-index: 99999; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; }
#pw-auth-overlay.hidden { display: none; }
.pw-auth-card { background: #16161e; border: 1px solid #2c2c3e; border-radius: 8px; padding: 32px 28px; width: 360px; max-width: 90vw; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
.pw-auth-title { font-size: 18px; font-weight: 700; letter-spacing: .14em; margin-bottom: 4px; }
.pw-auth-sub { font-size: 12px; color: #8080a0; margin-bottom: 22px; }
.pw-auth-btn { display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; border-radius: 6px; background: #fff; color: #1f1f1f; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
.pw-auth-btn:hover { opacity: .92; }
.pw-auth-google-icon { width: 18px; height: 18px; }
.pw-auth-error { font-size: 12px; color: #e05555; margin-top: 14px; min-height: 16px; }
.pw-auth-user { display: flex; align-items: center; gap: 12px; padding: 12px; background: #1e1e28; border-radius: 6px; margin: 16px 0; text-align: left; }
.pw-auth-user img { width: 36px; height: 36px; border-radius: 50%; background: #2c2c3e; }
.pw-auth-user-info { flex: 1; min-width: 0; }
.pw-auth-user-name { font-size: 13px; font-weight: 600; }
.pw-auth-user-email { font-size: 11px; color: #8080a0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pw-auth-signout { font-size: 11px; color: #8080a0; background: none; border: none; cursor: pointer; text-decoration: underline; padding: 0; margin-top: 4px; font-family: inherit; }
.pw-auth-signout:hover { color: #e05555; }

#pw-admin-btn { position: fixed; bottom: 16px; right: 16px; background: #6c63ff; color: #fff; padding: 8px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(0,0,0,.4); z-index: 9000; font-family: inherit; }
#pw-admin-btn:hover { opacity: .92; }
#pw-admin-btn .pw-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #e05555; margin-right: 6px; vertical-align: middle; }

#pw-admin-modal { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 9500; display: none; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; }
#pw-admin-modal.show { display: flex; }
.pw-admin-card { background: #16161e; border: 1px solid #2c2c3e; border-radius: 8px; width: 90%; max-width: 540px; max-height: 80vh; display: flex; flex-direction: column; color: #e0e0ec; }
.pw-admin-head { padding: 14px 18px; border-bottom: 1px solid #2c2c3e; display: flex; justify-content: space-between; align-items: center; }
.pw-admin-title { font-size: 13px; font-weight: 700; letter-spacing: .12em; }
.pw-admin-close { background: none; border: none; color: #8080a0; font-size: 22px; cursor: pointer; padding: 0; line-height: 1; }
.pw-admin-tabs { display: flex; padding: 0 18px; border-bottom: 1px solid #2c2c3e; background: #0d0d12; }
.pw-admin-tab { padding: 10px 14px; font-size: 12px; color: #8080a0; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; font-family: inherit; }
.pw-admin-tab.active { color: #e0e0ec; border-bottom-color: #6c63ff; }
.pw-admin-list { flex: 1; overflow: auto; padding: 12px 18px; }
.pw-admin-empty { text-align: center; color: #8080a0; padding: 28px 0; font-size: 13px; }
.pw-admin-row { display: flex; align-items: center; gap: 12px; padding: 10px; background: #1e1e28; border-radius: 6px; margin-bottom: 8px; }
.pw-admin-row img { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: #2c2c3e; }
.pw-admin-row-info { flex: 1; min-width: 0; }
.pw-admin-row-name { font-size: 13px; font-weight: 600; }
.pw-admin-row-email { font-size: 11px; color: #8080a0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pw-admin-row-actions { display: flex; gap: 6px; flex-shrink: 0; }
.pw-admin-row-actions button { padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; }
.pw-admin-approve { background: #4cba6a; color: #fff; }
.pw-admin-deny    { background: #e05555; color: #fff; }
.pw-admin-revoke  { background: #2c2c3e; color: #e0e0ec; }
.pw-admin-self    { font-size: 11px; color: #8080a0; padding: 5px 10px; }
`;
document.head.appendChild(style);

// ── Overlay ────────────────────────────────────────────────────────────────
const overlay = document.createElement('div');
overlay.id = 'pw-auth-overlay';
overlay.innerHTML = `<div class="pw-auth-card" id="pw-auth-card">
  <div class="pw-auth-title">PWONSITE</div>
  <div class="pw-auth-sub">Loading…</div>
</div>`;
function attachOverlay() {
  if (document.body) document.body.appendChild(overlay);
  else window.addEventListener('DOMContentLoaded', () => document.body.appendChild(overlay));
}
attachOverlay();

const card = () => overlay.querySelector('#pw-auth-card');

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderSignIn(errorMsg) {
  card().innerHTML = `
    <div class="pw-auth-title">PWONSITE</div>
    <div class="pw-auth-sub">Sign in to continue</div>
    <button class="pw-auth-btn" id="pw-google-btn">
      <svg class="pw-auth-google-icon" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.5 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.4 16.2 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.4 36.4 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
      </svg>
      Sign in with Google
    </button>
    <div class="pw-auth-error">${escapeHtml(errorMsg || '')}</div>`;
  card().querySelector('#pw-google-btn').onclick = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
      renderSignIn(e.message || 'Sign-in failed');
    }
  };
}

function renderPending(user) {
  card().innerHTML = `
    <div class="pw-auth-title">Awaiting approval</div>
    <div class="pw-auth-sub">An admin will review your request shortly</div>
    <div class="pw-auth-user">
      <img src="${escapeHtml(user.photoURL)}" alt="" referrerpolicy="no-referrer">
      <div class="pw-auth-user-info">
        <div class="pw-auth-user-name">${escapeHtml(user.displayName)}</div>
        <div class="pw-auth-user-email">${escapeHtml(user.email)}</div>
      </div>
    </div>
    <button class="pw-auth-signout" id="pw-signout">Sign out</button>`;
  card().querySelector('#pw-signout').onclick = () => signOut(auth);
}

function showOverlay() { overlay.classList.remove('hidden'); }
function hideOverlay() { overlay.classList.add('hidden'); }

// ── Auth state machine ─────────────────────────────────────────────────────
let currentUser = null;
let isAdmin = false;
let resolved = false;

onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (!user) {
    isAdmin = false;
    showOverlay();
    renderSignIn();
    return;
  }
  // The hardcoded ADMIN_EMAIL is the "root" admin — always admin, never lockable
  // out. Additional admins are flagged on approvedUsers/{uid}.isAdmin, set from
  // the in-app admin panel.
  const isRoot = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  isAdmin = isRoot;
  if (isRoot) { grantAccess(user); return; }

  // Approved?
  let approved = false;
  try {
    const snap = await get(ref(db, `approvedUsers/${user.uid}`));
    approved = snap.exists();
    if (approved && snap.val() && snap.val().isAdmin === true) isAdmin = true;
  } catch (_) { /* fall through */ }

  if (approved) { grantAccess(user); return; }

  // Not approved → register pending request, show waiting screen
  try {
    await set(ref(db, `pendingUsers/${user.uid}`), {
      email: user.email || '',
      name:  user.displayName || '',
      photo: user.photoURL || '',
      requestedAt: Date.now()
    });
  } catch (_) { /* surface nothing — the waiting screen is the same UX either way */ }

  showOverlay();
  renderPending(user);
});

function grantAccess(user) {
  hideOverlay();
  window._fb = { db, ref, set, get, onValue };
  window._fbAuth = { user, isAdmin, rootAdminEmail: ADMIN_EMAIL, signOut: () => signOut(auth) };
  if (!resolved) {
    resolved = true;
    if (window._fbReadyResolve) {
      window._fbReadyResolve({ db, ref, set, get, onValue, user, isAdmin, rootAdminEmail: ADMIN_EMAIL });
      window._fbReadyResolve = null;
    }
  }
  window.dispatchEvent(new CustomEvent('pwonsite:auth-ready', {
    detail: { db, ref, set, get, onValue, user, isAdmin, rootAdminEmail: ADMIN_EMAIL }
  }));
  if (isAdmin) setupAdminUI();
}

// ── Admin panel (only mounted for admin) ───────────────────────────────────
function setupAdminUI() {
  if (document.getElementById('pw-admin-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'pw-admin-btn';
  btn.textContent = 'Admin';

  const modal = document.createElement('div');
  modal.id = 'pw-admin-modal';
  modal.innerHTML = `
    <div class="pw-admin-card">
      <div class="pw-admin-head">
        <div class="pw-admin-title">USER ACCESS</div>
        <button class="pw-admin-close" id="pw-admin-close" aria-label="Close">&times;</button>
      </div>
      <div class="pw-admin-tabs">
        <button class="pw-admin-tab active" data-tab="pending">Pending</button>
        <button class="pw-admin-tab" data-tab="approved">Approved</button>
      </div>
      <div class="pw-admin-list" id="pw-admin-list"></div>
    </div>`;

  function mount() {
    document.body.appendChild(btn);
    document.body.appendChild(modal);
  }
  if (document.body) mount(); else window.addEventListener('DOMContentLoaded', mount);

  btn.onclick = () => modal.classList.add('show');
  modal.querySelector('#pw-admin-close').onclick = () => modal.classList.remove('show');
  modal.onclick = e => { if (e.target === modal) modal.classList.remove('show'); };

  let activeTab = 'pending';
  let pendingData  = {};
  let approvedData = {};

  modal.querySelectorAll('.pw-admin-tab').forEach(t => {
    t.onclick = () => {
      modal.querySelectorAll('.pw-admin-tab').forEach(x => x.classList.toggle('active', x === t));
      activeTab = t.dataset.tab;
      renderList();
    };
  });

  function renderList() {
    const list = modal.querySelector('#pw-admin-list');
    const data = activeTab === 'pending' ? pendingData : approvedData;
    const entries = Object.entries(data || {});
    if (!entries.length) {
      list.innerHTML = `<div class="pw-admin-empty">${activeTab === 'pending' ? 'No pending requests' : 'No approved users yet'}</div>`;
      return;
    }
    list.innerHTML = entries.map(([uid, u]) => {
      const isSelf = currentUser && uid === currentUser.uid;
      const actions = activeTab === 'pending'
        ? `<button class="pw-admin-approve" data-uid="${uid}">Approve</button>
           <button class="pw-admin-deny" data-uid="${uid}">Deny</button>`
        : (isSelf
            ? `<span class="pw-admin-self">you</span>`
            : `<button class="pw-admin-revoke" data-uid="${uid}">Revoke</button>`);
      return `
        <div class="pw-admin-row">
          <img src="${escapeHtml(u.photo)}" alt="" referrerpolicy="no-referrer">
          <div class="pw-admin-row-info">
            <div class="pw-admin-row-name">${escapeHtml(u.name)}</div>
            <div class="pw-admin-row-email">${escapeHtml(u.email)}</div>
          </div>
          <div class="pw-admin-row-actions">${actions}</div>
        </div>`;
    }).join('');
    list.querySelectorAll('.pw-admin-approve').forEach(b => b.onclick = () => approveUser(b.dataset.uid));
    list.querySelectorAll('.pw-admin-deny').forEach(b => b.onclick = () => denyUser(b.dataset.uid));
    list.querySelectorAll('.pw-admin-revoke').forEach(b => b.onclick = () => revokeUser(b.dataset.uid));
  }

  async function approveUser(uid) {
    const u = pendingData[uid]; if (!u) return;
    await set(ref(db, `approvedUsers/${uid}`), {
      email: u.email || '', name: u.name || '', photo: u.photo || '',
      approvedAt: Date.now(), approvedBy: currentUser.email || ''
    });
    await remove(ref(db, `pendingUsers/${uid}`));
  }
  async function denyUser(uid) {
    await remove(ref(db, `pendingUsers/${uid}`));
  }
  async function revokeUser(uid) {
    if (!confirm('Revoke access for this user? They will need to be re-approved to use the app again.')) return;
    await remove(ref(db, `approvedUsers/${uid}`));
  }

  onValue(ref(db, 'pendingUsers'), snap => {
    pendingData = snap.val() || {};
    const count = Object.keys(pendingData).length;
    btn.innerHTML = count > 0 ? `<span class="pw-dot"></span>Admin (${count})` : 'Admin';
    if (activeTab === 'pending') renderList();
  });
  onValue(ref(db, 'approvedUsers'), snap => {
    approvedData = snap.val() || {};
    if (activeTab === 'approved') renderList();
  });
}
