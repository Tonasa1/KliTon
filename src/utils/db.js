// Local Database utilities for ThermaScan using localStorage
import jsPDF from 'jspdf';
import 'jspdf-autotable';
const REPORTS_KEY = 'thermascan_reports';
const LOCATIONS_KEY = 'thermascan_locations';
const SETTINGS_KEY = 'thermascan_settings';
const OFFICERS_KEY = 'thermascan_officers';
const ATTENDANCE_KEY = 'thermascan_attendance';
const SESSION_KEY = 'thermascan_session';
const ACTIVITIES_KEY = 'thermascan_activities';
const INSPEKSI_LOCATIONS_KEY = 'thermascan_inspeksi_locations';
const ANALIS_LOCATIONS_KEY = 'thermascan_analis_locations';
const STATION_COORDS_KEY = 'thermascan_station_coords';
const HANDOVERS_KEY = 'thermascan_handovers';
const DEVICE_LOGS_KEY = 'thermascan_device_logs';

const DEFAULT_OFFICERS = [
  'FAHRIL',
  'JUMAHIR',
  'IMAN TAQWA',
  'ANDI MAJJAJARENG'
];

const USERS_KEY = 'thermascan_users';

const DEFAULT_USERS = [
  { username: 'admin', role: 'Administrator', password: 'admin123', jobdesk: 'suhu' },
  { username: 'supervisor', role: 'Supervisor', password: 'spv123', jobdesk: 'suhu' },
  { username: 'supervisor1', role: 'Supervisor', password: 'spv123', jobdesk: 'analis' },
  { username: 'manager1', role: 'Manager', password: 'manager123', jobdesk: 'suhu' },
  // === SUHU ===
  { username: 'FAHRIL', role: 'Operator', password: 'operator123', jobdesk: 'suhu' },
  { username: 'JUMAHIR', role: 'Operator', password: 'operator123', jobdesk: 'suhu' },
  { username: 'IMAN TAQWA', role: 'Operator', password: 'operator123', jobdesk: 'suhu' },
  { username: 'ANDI MAJJAJARENG', role: 'Operator', password: 'operator123', jobdesk: 'suhu' },
  // === ANALIS ===
  { username: 'MARINDRA BONE', role: 'Operator', password: 'operator123', jobdesk: 'analis' },
  { username: 'MUHAMMAD RUSTAM', role: 'Operator', password: 'operator123', jobdesk: 'analis' },
  { username: 'M.RIDHO ASSARIY', role: 'Operator', password: 'operator123', jobdesk: 'analis' },
  { username: 'ARI', role: 'Operator', password: 'operator123', jobdesk: 'analis' },
  { username: 'MUTMAINNAH', role: 'Operator', password: 'operator123', jobdesk: 'analis' },
  { username: 'NUR FADILLAH', role: 'Operator', password: 'operator123', jobdesk: 'analis' },
  // === INSPEKSI ===
  { username: 'MUHAMMAD FADHIL', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'RIZAL BAKRI', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'NUR MUHAMMAD SADMAN', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'MUHAMMAD AKSAN RIJAL', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'IRFAN. H', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'DZAKY FAHMI PAHLEVI', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'BAYU PURNAMA', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'ALIF ALAMSYAH', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'SAENAL RIPALDI', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'RIVALDO', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'AMIRULLAH', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'IRWANDI', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'MUHAMMAD FIRMANSYAH SY', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'SULAEMAN', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'STEVIANUS TANDIONG', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
  { username: 'ALFIANUS METOLY', role: 'Operator', password: 'operator123', jobdesk: 'inspeksi' },
];

const DEFAULT_LOCATIONS = [
  'Pintu Keluar T4',
  'Pintu Keluar T5',
  'Pintu keluar masuk T45',
  'pintu keluar masuk T23',
  'LBS/Dome T4',
  'Gudang Buffer',
  'Dome T4',
  'Dome T5',
  'Gudang BKS',
  'Hopper',
  'Area Produksi',
  'Gudang Bahan Baku',
  'Ruang Kontrol',
  'Area Conveyor',
  'Laboratorium Utama',
  'Lab Kimia',
  'Lab Fisika',
  'Area Sampling',
  'Lainnya...'
];

// Koordinat GPS per stasiun kerja (Opsi B - geofence per lokasi)
const DEFAULT_STATION_COORDS = {
  // === SUHU stations ===
  'Pintu Keluar T4': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Pintu Keluar T5': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Pintu keluar masuk T45': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'pintu keluar masuk T23': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'LBS/Dome T4': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'LBS/Dome T5': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Gudang Buffer': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Dome T4': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Dome T5': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Gudang BKS': { lat: -4.81749419956391, lon: 119.48346663528389, radius: 100 },
  'Hopper': { lat: -4.81749419956391, lon: 119.48346663528389, radius: 100 },
  'Hopper BKS': { lat: -4.81749419956391, lon: 119.48346663528389, radius: 100 },
  'Gedung QA': { lat: -4.786429, lon: 119.614090, radius: 20 },
  'OGS': { lat: -4.786256, lon: 119.614108, radius: 25 },
  // === INSPEKSI stations ===
  'Area Produksi': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Gudang Bahan Baku': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Ruang Kontrol': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Area Conveyor': { lat: -4.786256, lon: 119.614108, radius: 25 },
  // === ANALIS stations ===
  'Laboratorium Utama': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Lab Kimia': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Lab Fisika': { lat: -4.786256, lon: 119.614108, radius: 25 },
  'Area Sampling': { lat: -4.786256, lon: 119.614108, radius: 25 },
};

const DEFAULT_SETTINGS = {
  highTempAlert: 60.0,
  feverTempAlert: 80.0,
  enableGeofence: true,
  // 1. Suhu - Day Shift & Piket
  geofenceSuhuDayLat: -4.786256,
  geofenceSuhuDayLon: 119.614108,
  geofenceSuhuDayRadius: 100,
  // 2. Suhu - Shift (1, 2, 3)
  geofenceSuhuShiftLat: -4.786256,
  geofenceSuhuShiftLon: 119.614108,
  geofenceSuhuShiftRadius: 100,
  // 3. Inspeksi - Shift (1, 2, 3)
  geofenceInspeksiShiftLat: -4.786256,
  geofenceInspeksiShiftLon: 119.614108,
  geofenceInspeksiShiftRadius: 100,
  // 4. Analis - Day Shift & Piket
  geofenceAnalisDayLat: -4.786256,
  geofenceAnalisDayLon: 119.614108,
  geofenceAnalisDayRadius: 100
};

// Initialize default data if not present
if (!localStorage.getItem(OFFICERS_KEY)) {
  localStorage.setItem(OFFICERS_KEY, JSON.stringify(DEFAULT_OFFICERS));
}
// Always merge DEFAULT_USERS: add new users AND update jobdesk/role/password of existing ones
const _existingUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const _mergedUsers = [..._existingUsers];
DEFAULT_USERS.forEach(defUser => {
  const idx = _mergedUsers.findIndex(u => u.username === defUser.username);
  if (idx === -1) {
    _mergedUsers.push(defUser); // tambah user baru
  } else {
    // perbarui jobdesk, role, password jika ada perubahan dari kode
    _mergedUsers[idx] = { ..._mergedUsers[idx], ...defUser };
  }
});
localStorage.setItem(USERS_KEY, JSON.stringify(_mergedUsers));
if (!localStorage.getItem(LOCATIONS_KEY)) {
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(DEFAULT_LOCATIONS));
}
if (!localStorage.getItem(SETTINGS_KEY)) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
}
if (!localStorage.getItem(REPORTS_KEY)) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(ATTENDANCE_KEY)) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(ACTIVITIES_KEY)) {
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(INSPEKSI_LOCATIONS_KEY)) {
  localStorage.setItem(INSPEKSI_LOCATIONS_KEY, JSON.stringify(DEFAULT_LOCATIONS));
}
if (!localStorage.getItem(ANALIS_LOCATIONS_KEY)) {
  localStorage.setItem(ANALIS_LOCATIONS_KEY, JSON.stringify(DEFAULT_LOCATIONS));
}
// Merge station coords: keep user custom edits, but update Biringkassi stations to physical coordinates if using old defaults
const _existingCoords = JSON.parse(localStorage.getItem(STATION_COORDS_KEY) || '{}');
const _mergedCoords = { ...DEFAULT_STATION_COORDS, ..._existingCoords };
['Gudang BKS', 'Hopper', 'Hopper BKS'].forEach(st => {
  if (!_mergedCoords[st] || Math.abs(_mergedCoords[st].lat - (-4.786256)) < 0.005) {
    _mergedCoords[st] = DEFAULT_STATION_COORDS[st];
  }
});
localStorage.setItem(STATION_COORDS_KEY, JSON.stringify(_mergedCoords));

if (!localStorage.getItem(HANDOVERS_KEY)) {
  localStorage.setItem(HANDOVERS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(DEVICE_LOGS_KEY)) {
  localStorage.setItem(DEVICE_LOGS_KEY, JSON.stringify([]));
}

export const db = {
  _safeSetItem(key, list) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn("Quota exceeded! Stripping oldest images to free space...");
      let success = false;
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].image && list[i].image.length > 100) {
          list[i].image = ''; // Strip image
          try {
            localStorage.setItem(key, JSON.stringify(list));
            success = true;
            break;
          } catch (err) {}
        }
      }
      if (!success) {
        try {
          localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
        } catch (err) {
          console.error("Still exceeding quota after slicing.");
        }
      }
    }
  },

  // --- DEVICE & MULTI-ACCOUNT AUDIT ---
  getDeviceId() {
    let id = localStorage.getItem('thermascan_device_id');
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
      localStorage.setItem('thermascan_device_id', id);
    }
    return id;
  },

  getDeviceLogs() {
    try {
      const data = localStorage.getItem(DEVICE_LOGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  recordDeviceLog(username, role, action = 'Login') {
    if (!username) return;
    try {
      const logs = this.getDeviceLogs();
      const newLog = {
        id: 'dlog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        deviceId: this.getDeviceId(),
        username,
        role: role || 'Operator',
        action,
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      const trimmed = logs.slice(0, 200);
      this._safeSetItem(DEVICE_LOGS_KEY, trimmed);
      this.uploadSettingsToCloud();
    } catch (e) {
      console.error('Failed to record device log:', e);
    }
  },

  getMultiAccountAudit() {
    const logs = this.getDeviceLogs();
    const attendance = this.getAttendance();
    const reports = this.getReports();
    const activities = this.getActivities();
    const handovers = this.getHandovers();

    const deviceMap = new Map();

    const processEntry = (deviceId, username, role, action, timestamp) => {
      if (!deviceId || !username) return;
      if (role && role !== 'Operator') return; // Focus audit on Operator accounts

      if (!deviceMap.has(deviceId)) {
        deviceMap.set(deviceId, {
          deviceId,
          users: new Map(),
          firstSeen: timestamp,
          lastActive: timestamp
        });
      }
      const dev = deviceMap.get(deviceId);
      if (new Date(timestamp) > new Date(dev.lastActive)) dev.lastActive = timestamp;
      if (new Date(timestamp) < new Date(dev.firstSeen)) dev.firstSeen = timestamp;

      if (!dev.users.has(username)) {
        dev.users.set(username, { name: username, count: 1, lastActive: timestamp, lastAction: action });
      } else {
        const u = dev.users.get(username);
        u.count++;
        if (new Date(timestamp) > new Date(u.lastActive)) {
          u.lastActive = timestamp;
          u.lastAction = action;
        }
      }
    };

    logs.forEach(l => processEntry(l.deviceId, l.username, l.role, l.action || 'Login', l.timestamp));
    attendance.forEach(a => processEntry(a.deviceId, a.officer, 'Operator', `Absen ${a.type || ''}`, a.timestamp));
    reports.forEach(r => processEntry(r.deviceId, r.officer, 'Operator', `Input Suhu (${r.location || ''})`, r.timestamp));
    activities.forEach(act => processEntry(act.deviceId, act.officer, 'Operator', 'Input Kegiatan', act.timestamp));
    handovers.forEach(h => {
      if (h.senderName) processEntry(h.senderDeviceId || h.deviceId, h.senderName, 'Operator', 'Kirim Serah Terima', h.sentAt || h.timestamp);
      if (h.receiverName) processEntry(h.receiverDeviceId || h.deviceId, h.receiverName, 'Operator', 'Terima Serah Terima', h.receivedAt || h.timestamp);
    });

    const result = [];
    deviceMap.forEach((dev, key) => {
      const userList = Array.from(dev.users.values());
      const isMulti = userList.length > 1;
      result.push({
        deviceId: key,
        userCount: userList.length,
        isMultiAccount: isMulti,
        users: userList,
        lastActive: dev.lastActive,
        firstSeen: dev.firstSeen
      });
    });

    return result.sort((a, b) => {
      if (a.isMultiAccount !== b.isMultiAccount) return b.isMultiAccount ? -1 : 1;
      return new Date(b.lastActive) - new Date(a.lastActive);
    });
  },

  // --- SESSION LOGIN SYSTEM ---
  login(role, username, password, jobdesk = 'suhu') {
    const users = this.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === role);
    if (!user || user.password !== password) {
      return null;
    }
    
    // Additional validation
    if (role === 'Supervisor') {
      if (username.toLowerCase() === 'supervisor1' && jobdesk !== 'analis') {
        return null;
      }
    } else if (role === 'Operator') {
      if (user.jobdesk !== jobdesk) {
        return null;
      }
    }

    const session = { 
      role, 
      name: user.username, 
      jobdesk: role === 'Supervisor' && username.toLowerCase() === 'supervisor1' ? 'analis' : jobdesk 
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.recordDeviceLog(user.username, user.role, 'Login Aplikasi');
    return session;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentSession() {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  },

  // --- REPORTS (Suhu Alat) ---
  getReports() {
    try {
      const data = localStorage.getItem(REPORTS_KEY);
      return data ? JSON.parse(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];
    } catch (e) {
      console.error('Failed to parse reports:', e);
      return [];
    }
  },

  saveReport(report) {
    try {
      const reports = this.getReports();
      const newReport = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        deviceId: this.getDeviceId(),
        ...report
      };
      reports.push(newReport);
      this._safeSetItem(REPORTS_KEY, reports);
      this.recordDeviceLog(newReport.officer, 'Operator', `Input Suhu (${newReport.location || ''})`);
      this.uploadReportToCloud(newReport); // Upload to Supabase in background
      return newReport;
    } catch (e) {
      console.error('Failed to save report:', e);
      return null;
    }
  },

  deleteReport(id) {
    try {
      const reports = this.getReports();
      const filtered = reports.filter(r => r.id !== id);
      this._safeSetItem(REPORTS_KEY, filtered);
      return true;
    } catch (e) {
      console.error('Failed to delete report:', e);
      return false;
    }
  },

  clearAllReports() {
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify([]));
      return true;
    } catch (e) {
      console.error('Failed to clear reports:', e);
      return false;
    }
  },

  // --- ATTENDANCE (Absensi Petugas) ---
  getAttendance() {
    try {
      const data = localStorage.getItem(ATTENDANCE_KEY);
      return data ? JSON.parse(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];
    } catch (e) {
      console.error('Failed to parse attendance:', e);
      return [];
    }
  },

  saveAttendance(attendance) {
    try {
      const list = this.getAttendance();
      const newEntry = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        deviceId: this.getDeviceId(),
        ...attendance
      };
      list.push(newEntry);
      this._safeSetItem(ATTENDANCE_KEY, list);
      this.recordDeviceLog(newEntry.officer, 'Operator', `Absen ${newEntry.type || ''}`);
      this.uploadAttendanceToCloud(newEntry); // Upload to Supabase in background
      return newEntry;
    } catch (e) {
      console.error('Failed to save attendance:', e);
      return null;
    }
  },

  deleteAttendance(id) {
    try {
      const list = this.getAttendance();
      const filtered = list.filter(a => a.id !== id);
      this._safeSetItem(ATTENDANCE_KEY, filtered);
      return true;
    } catch (e) {
      return false;
    }
  },

  updateAttendance(updatedRecord) {
    try {
      const list = this.getAttendance();
      const idx = list.findIndex(a => a.id === updatedRecord.id);
      if (idx === -1) return false;
      list[idx] = updatedRecord;
      this._safeSetItem(ATTENDANCE_KEY, list);
      // Upload perubahan ke Supabase
      this.uploadAttendanceToCloud(updatedRecord);
      return true;
    } catch (e) {
      console.error('Failed to update attendance:', e);
      return false;
    }
  },

  clearAllAttendance() {
    try {
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- ACTIVITIES (Kegiatan Inspeksi & Analis) ---
  getActivities() {
    try {
      const data = localStorage.getItem(ACTIVITIES_KEY);
      return data ? JSON.parse(data).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];
    } catch (e) {
      console.error('Failed to parse activities:', e);
      return [];
    }
  },

  saveActivity(activity) {
    try {
      const list = this.getActivities();
      const newEntry = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        deviceId: this.getDeviceId(),
        ...activity
      };
      list.push(newEntry);
      this._safeSetItem(ACTIVITIES_KEY, list);
      this.recordDeviceLog(newEntry.officer, 'Operator', 'Input Kegiatan');
      this.uploadActivityToCloud(newEntry);
      return newEntry;
    } catch (e) {
      console.error('Failed to save activity:', e);
      return null;
    }
  },

  deleteActivity(id) {
    try {
      const list = this.getActivities();
      const filtered = list.filter(a => a.id !== id);
      this._safeSetItem(ACTIVITIES_KEY, filtered);
      return true;
    } catch (e) {
      return false;
    }
  },

  clearAllActivities() {
    try {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([]));
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- HANDOVERS (Serah Terima Pekerjaan) ---
  getHandovers() {
    try {
      const data = localStorage.getItem(HANDOVERS_KEY);
      return data ? JSON.parse(data).sort((a, b) => new Date(b.sentAt || b.timestamp || Date.now()) - new Date(a.sentAt || a.timestamp || Date.now())) : [];
    } catch (e) {
      console.error('Failed to parse handovers:', e);
      return [];
    }
  },

  saveHandover(handover) {
    try {
      const list = this.getHandovers();
      const newEntry = {
        id: `ho_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentAt: new Date().toISOString(),
        status: 'pending',
        senderDeviceId: this.getDeviceId(),
        ...handover
      };
      list.push(newEntry);
      this._safeSetItem(HANDOVERS_KEY, list);
      this.recordDeviceLog(newEntry.senderName, 'Operator', 'Kirim Serah Terima');
      this.uploadHandoverToCloud(newEntry);
      return newEntry;
    } catch (e) {
      console.error('Failed to save handover:', e);
      return null;
    }
  },

  updateHandover(updatedRecord) {
    try {
      const list = this.getHandovers();
      const idx = list.findIndex(h => h.id === updatedRecord.id);
      if (idx === -1) return false;
      list[idx] = updatedRecord;
      this._safeSetItem(HANDOVERS_KEY, list);
      this.updateHandoverOnCloud(updatedRecord);
      return true;
    } catch (e) {
      console.error('Failed to update handover:', e);
      return false;
    }
  },

  deleteHandover(id) {
    try {
      const list = this.getHandovers();
      const filtered = list.filter(h => h.id !== id);
      this._safeSetItem(HANDOVERS_KEY, filtered);
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- OFFICERS (Petugas) & USERS ---
  getUsers() {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  },

  saveUser(user) {
    try {
      const users = this.getUsers();
      const existingIdx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
      const updatedUser = {
        password: 'operator123', // default
        jobdesk: 'suhu',         // default
        ...user
      };
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...updatedUser };
      } else {
        users.push(updatedUser);
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      this.uploadUserToCloud(updatedUser);
      return true;
    } catch (e) {
      return false;
    }
  },

  deleteUser(username) {
    try {
      const users = this.getUsers();
      const filtered = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
      localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
      this.deleteUserFromCloud(username);
      return true;
    } catch (e) {
      return false;
    }
  },

  changePassword(username, oldPassword, newPassword) {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && user.password === oldPassword) {
        user.password = newPassword;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        this.uploadUserToCloud(user);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  resetPassword(username, newPassword) {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user) {
        user.password = newPassword;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        this.uploadUserToCloud(user);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  getOfficers() {
    const users = this.getUsers();
    return users.filter(u => u.role === 'Operator').map(u => u.username);
  },

  saveOfficer(name, jobdesk = 'suhu') {
    return this.saveUser({ username: name, role: 'Operator', password: 'operator123', jobdesk });
  },

  deleteOfficer(name) {
    return this.deleteUser(name);
  },

  // --- LOCATIONS ---
  getLocations() {
    try {
      const data = localStorage.getItem(LOCATIONS_KEY);
      return data ? JSON.parse(data) : DEFAULT_LOCATIONS;
    } catch (e) {
      return DEFAULT_LOCATIONS;
    }
  },

  saveLocation(location) {
    try {
      const locations = this.getLocations();
      const trimmed = location.trim();
      if (trimmed && !locations.includes(trimmed)) {
        locations.push(trimmed);
        localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
        this.uploadSettingsToCloud();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  deleteLocation(location) {
    try {
      const locations = this.getLocations();
      const filtered = locations.filter(l => l !== location);
      localStorage.setItem(LOCATIONS_KEY, JSON.stringify(filtered));
      this.uploadSettingsToCloud();
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- LOCATIONS PER JOBDESK ---
  getLocationsByJobdesk(jobdesk) {
    return this.getLocations();
  },

  saveLocationByJobdesk(jobdesk, location) {
    return this.saveLocation(location);
  },

  deleteLocationByJobdesk(jobdesk, location) {
    return this.deleteLocation(location);
  },

  // --- STATION COORDINATES (Per-station geofence - Opsi B) ---
  getStationCoords() {
    try {
      const data = localStorage.getItem(STATION_COORDS_KEY);
      return data ? JSON.parse(data) : DEFAULT_STATION_COORDS;
    } catch (e) {
      return DEFAULT_STATION_COORDS;
    }
  },

  getStationCoord(stationName) {
    const coords = this.getStationCoords();
    return coords[stationName] || null;
  },

  saveStationCoord(stationName, lat, lon, radius) {
    try {
      const coords = this.getStationCoords();
      coords[stationName] = { lat: parseFloat(lat), lon: parseFloat(lon), radius: parseInt(radius, 10) };
      localStorage.setItem(STATION_COORDS_KEY, JSON.stringify(coords));
      this.uploadSettingsToCloud();
      return true;
    } catch (e) {
      return false;
    }
  },

  saveAllStationCoords(coordsObj) {
    try {
      localStorage.setItem(STATION_COORDS_KEY, JSON.stringify(coordsObj));
      this.uploadSettingsToCloud();
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- SETTINGS ---
  getSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      this.uploadSettingsToCloud();
      return updated;
    } catch (e) {
      return null;
    }
  },

  // --- UTILS ---
  getTemperatureStatus(temp, settings = null) {
    const s = settings || this.getSettings();
    const t = parseFloat(temp);
    if (isNaN(t)) return { label: 'Invalid', class: 'status-invalid', color: '#6b7280' };
    
    if (t >= s.feverTempAlert) {
      return { label: 'PANAS (ALERT)', class: 'status-fever', color: '#ef4444' };
    } else if (t >= s.highTempAlert) {
      return { label: 'HANGAT (WARNING)', class: 'status-subfever', color: '#f59e0b' };
    } else {
      return { label: 'NORMAL', class: 'status-normal', color: '#10b981' };
    }
  },

  exportToCSV(reports) {
    if (!reports || reports.length === 0) return false;
    
    // Header
    const headers = ['ID Laporan', 'Waktu Pengukuran', 'Suhu (C)', 'Status', 'Lokasi', 'Nama Petugas', 'Catatan'];
    
    // Rows
    const rows = reports.map(r => {
      const statusObj = this.getTemperatureStatus(r.temperature);
      const formattedDate = new Date(r.timestamp).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      });
      return [
        r.id,
        formattedDate,
        r.temperature,
        statusObj.label,
        r.location,
        r.officer || '-',
        r.notes ? r.notes.replace(/\n/g, ' ') : '-'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    this.downloadFile(csvContent, 'Laporan_Suhu_ThermaScan');
    return true;
  },

  exportAttendanceToCSV(attendanceList) {
    if (!attendanceList || attendanceList.length === 0) return false;

    // Header
    const headers = ['ID Absen', 'Waktu Absen', 'Nama Petugas', 'Tipe Absensi', 'Latitude', 'Longitude', 'Akurasi GPS (m)', 'Link Google Maps', 'Terindikasi Fake GPS', 'Keterangan/Alasan'];

    // Rows
    const rows = attendanceList.map(a => {
      const formattedDate = new Date(a.timestamp).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      });
      const mapsLink = a.latitude && a.longitude ? `https://www.google.com/maps?q=${a.latitude},${a.longitude}` : '-';
      return [
        a.id,
        formattedDate,
        a.officer,
        a.type,
        a.latitude || '-',
        a.longitude || '-',
        a.gpsAccuracy || '-',
        mapsLink,
        a.isFakeGps ? 'YA' : 'TIDAK',
        a.notes ? a.notes.replace(/\n/g, ' ') : '-'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    this.downloadFile(csvContent, 'Laporan_Absensi_ThermaScan');
    return true;
  },

  exportActivitiesToCSV(activities) {
    if (!activities || activities.length === 0) return false;

    const headers = ['ID Kegiatan', 'Waktu', 'Jobdesk', 'Nama Petugas', 'Lokasi', 'Keterangan Kegiatan', 'Catatan Tambahan'];

    const rows = activities.map(a => {
      const formattedDate = new Date(a.timestamp).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      });
      return [
        a.id,
        formattedDate,
        a.jobdesk || '-',
        a.officer || '-',
        a.location || '-',
        a.description ? a.description.replace(/\n/g, ' ') : '-',
        a.notes ? a.notes.replace(/\n/g, ' ') : '-'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    this.downloadFile(csvContent, 'Laporan_Kegiatan_ThermaScan');
    return true;
  },

  exportToPDF(reports) {
    if (!reports || reports.length === 0) return false;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('Laporan Suhu ThermaScan', 14, 15);
    doc.setFontSize(10);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    const tableData = reports.map(r => {
      const statusObj = this.getTemperatureStatus(r.temperature);
      return [
        new Date(r.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        r.temperature,
        statusObj.label,
        r.location,
        r.officer || '-',
        r.notes || '-'
      ];
    });

    doc.autoTable({
      startY: 28,
      head: [['Waktu', 'Suhu (C)', 'Status', 'Lokasi', 'Petugas', 'Catatan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('Laporan_Suhu_ThermaScan.pdf');
    return true;
  },

  exportActivitiesToPDF(activities) {
    if (!activities || activities.length === 0) return false;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('Laporan Kegiatan ThermaScan', 14, 15);
    doc.setFontSize(10);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    const tableData = activities.map(a => [
      new Date(a.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      a.jobdesk || '-',
      a.officer || '-',
      a.location || '-',
      a.description || '-',
      a.notes || '-'
    ]);

    doc.autoTable({
      startY: 28,
      head: [['Waktu', 'Jobdesk', 'Petugas', 'Lokasi', 'Kegiatan', 'Catatan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('Laporan_Kegiatan_ThermaScan.pdf');
    return true;
  },

  exportAttendanceToPDF(attendanceList) {
    if (!attendanceList || attendanceList.length === 0) return false;
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('Laporan Absensi Petugas', 14, 15);
    doc.setFontSize(10);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    // Hitung ringkasan kesimpulan
    let hadir = 0, cuti = 0, sakit = 0, izin = 0;
    attendanceList.forEach(a => {
      if (a.type === 'Check In' || a.type === 'Check Out') hadir++;
      else if (a.type === 'Cuti') cuti++;
      else if (a.type === 'Sakit') sakit++;
      else if (a.type === 'Izin') izin++;
    });

    // Tampilkan ringkasan
    doc.setFontSize(11);
    doc.text('Ringkasan Kehadiran:', 14, 30);
    doc.setFontSize(10);
    doc.text(`Hadir (Check In/Out): ${hadir}`, 14, 36);
    doc.text(`Sakit: ${sakit}`, 14, 42);
    doc.text(`Izin: ${izin}`, 14, 48);
    doc.text(`Cuti: ${cuti}`, 14, 54);

    const tableData = attendanceList.map(a => [
      new Date(a.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      a.officer,
      a.type,
      a.status || '-',
      (a.latitude && a.longitude) ? 'Ya' : 'Tidak',
      a.isFakeGps ? 'YA' : 'TIDAK',
      a.notes || '-'
    ]);

    doc.autoTable({
      startY: 60,
      head: [['Waktu', 'Petugas', 'Tipe', 'Status Approval', 'Ada GPS', 'Fake GPS', 'Catatan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('Laporan_Absensi_ThermaScan.pdf');
    return true;
  },

  // --- CLOUD SYNC CONFIG (SUPABASE) ---
  getSupabaseConfig() {
    const DEFAULT_URL = 'https://xevvfgbzmybyehlaiisx.supabase.co';
    const DEFAULT_KEY = 'sb_publishable_nhgq0NRhvniCXK5ETG22-w_OspHUO2q';

    let storedUrl = localStorage.getItem('thermascan_supabase_url');
    let storedKey = localStorage.getItem('thermascan_supabase_key');

    if (!storedUrl || !storedUrl.includes('xevvfgbzmybyehlaiisx')) {
      storedUrl = DEFAULT_URL;
      localStorage.setItem('thermascan_supabase_url', DEFAULT_URL);
    }
    if (!storedKey || storedKey.length < 20) {
      storedKey = DEFAULT_KEY;
      localStorage.setItem('thermascan_supabase_key', DEFAULT_KEY);
    }

    return {
      url: storedUrl,
      key: storedKey
    };
  },

  saveSupabaseConfig(url, key) {
    const cleanedUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    localStorage.setItem('thermascan_supabase_url', cleanedUrl);
    localStorage.setItem('thermascan_supabase_key', key.trim());
    return true;
  },

  async testSupabaseConnection(url, key) {
    try {
      const cleanedUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      };
      const res = await fetch(`${cleanedUrl}/rest/v1/reports?select=id&limit=1`, { headers });
      return res.ok;
    } catch (e) {
      console.error('Connection test failed:', e);
      return false;
    }
  },

  async syncWithCloud() {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return null;

    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      // 1. Fetch from Supabase
      const reportsRes = await fetch(`${url}/rest/v1/reports?select=*`, { headers });
      let cloudReports = reportsRes.ok ? await reportsRes.json() : [];
      cloudReports = cloudReports.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        officer: r.officer,
        location: r.location,
        equipmentName: r.equipment_name || r.equipmentName || '',
        temperature: r.temperature,
        notes: r.notes || '',
        image: r.image || '',
        status: r.status || 'Normal',
        jobdesk: r.jobdesk || 'suhu'
      }));

      const attRes = await fetch(`${url}/rest/v1/attendance?select=*`, { headers });
      let cloudAtt = attRes.ok ? await attRes.json() : [];
      
      // Convert cloud snake_case keys to camelCase for local React state
      cloudAtt = cloudAtt.map(a => ({
        id: a.id,
        timestamp: a.timestamp,
        officer: a.officer,
        jobdesk: a.jobdesk || 'suhu',
        type: a.type,
        image: a.image,
        latitude: a.latitude,
        longitude: a.longitude,
        gpsAccuracy: a.gps_accuracy,
        isFakeGps: a.is_fake_gps,
        notes: a.notes,
        status: a.status || 'Disetujui',
        spvApproval: a.spv_approval,
        managerApproval: a.manager_approval
      }));

      // 2. Merge Reports
      const localReports = this.getReports();
      const mergedReportsMap = new Map();
      
      // Load cloud first
      cloudReports.forEach(r => mergedReportsMap.set(r.id, r));
      // Overwrite/Add local
      localReports.forEach(r => mergedReportsMap.set(r.id, r));
      
      const mergedReports = Array.from(mergedReportsMap.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
      this._safeSetItem(REPORTS_KEY, mergedReports);

      // 3. Merge Attendance
      const localAtt = this.getAttendance();
      const mergedAttMap = new Map();
      
      cloudAtt.forEach(a => mergedAttMap.set(a.id, a));
      localAtt.forEach(a => mergedAttMap.set(a.id, a));
      
      const mergedAtt = Array.from(mergedAttMap.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
      this._safeSetItem(ATTENDANCE_KEY, mergedAtt);

      // 4. Upload missing local reports to cloud
      const cloudReportIds = new Set(cloudReports.map(r => r.id));
      const reportsToUpload = localReports.filter(r => !cloudReportIds.has(r.id));
      
      for (const r of reportsToUpload) {
        const mapped = {
          id: r.id,
          timestamp: r.timestamp,
          officer: r.officer,
          location: r.location,
          equipment_name: r.equipmentName || r.equipment_name || '',
          temperature: r.temperature,
          notes: r.notes || null,
          image: r.image || null,
          status: r.status || 'Normal',
          jobdesk: r.jobdesk || 'suhu'
        };
        await fetch(`${url}/rest/v1/reports`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(mapped)
        });
      }

      // 5. Upload missing local attendance to cloud
      const cloudAttIds = new Set(cloudAtt.map(a => a.id));
      const attToUpload = localAtt.filter(a => !cloudAttIds.has(a.id));
      
      for (const a of attToUpload) {
        const mapped = {
          id: a.id,
          timestamp: a.timestamp,
          officer: a.officer,
          jobdesk: a.jobdesk || 'suhu',
          type: a.type,
          image: a.image,
          latitude: a.latitude,
          longitude: a.longitude,
          gps_accuracy: a.gpsAccuracy,
          is_fake_gps: a.isFakeGps,
          notes: a.notes || null,
          status: a.status || 'Disetujui',
          spv_approval: a.spvApproval || null,
          manager_approval: a.managerApproval || null
        };
        await fetch(`${url}/rest/v1/attendance`, {
          method: 'POST',
          headers,
          body: JSON.stringify(mapped)
        });
      }

      // 6. Fetch activities from cloud
      let cloudActivities = [];
      try {
        const actRes = await fetch(`${url}/rest/v1/activities?select=*`, { headers });
        cloudActivities = actRes.ok ? await actRes.json() : [];
      } catch (e) {
        // Table might not exist yet, that's ok
      }

      // 7. Merge Activities
      const localActivities = this.getActivities();
      const mergedActMap = new Map();
      cloudActivities.forEach(a => mergedActMap.set(a.id, a));
      localActivities.forEach(a => mergedActMap.set(a.id, a));
      const mergedActivities = Array.from(mergedActMap.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      this._safeSetItem(ACTIVITIES_KEY, mergedActivities);

      // 8. Upload missing local activities to cloud
      const cloudActIds = new Set(cloudActivities.map(a => a.id));
      const actToUpload = localActivities.filter(a => !cloudActIds.has(a.id));
      for (const a of actToUpload) {
        try {
          await fetch(`${url}/rest/v1/activities`, {
            method: 'POST',
            headers,
            body: JSON.stringify(a)
          });
        } catch (e) {
          // Ignore if table doesn't exist
        }
      }

      // 8.5. Fetch & Merge Handovers from cloud
      try {
        const cloudHandovers = await this.fetchHandoversFromCloud();
        const localHandovers = this.getHandovers();
        const mergedHoMap = new Map();
        cloudHandovers.forEach(h => mergedHoMap.set(h.id, h));
        localHandovers.forEach(h => mergedHoMap.set(h.id, h));
        const mergedHandovers = Array.from(mergedHoMap.values())
          .sort((a, b) => new Date(b.sentAt || b.timestamp || Date.now()) - new Date(a.sentAt || a.timestamp || Date.now()));
        this._safeSetItem(HANDOVERS_KEY, mergedHandovers);

        // Upload missing local handovers to cloud
        const cloudHoIds = new Set(cloudHandovers.map(h => h.id));
        const hoToUpload = localHandovers.filter(h => !cloudHoIds.has(h.id));
        for (const h of hoToUpload) {
          await this.uploadHandoverToCloud(h);
        }
      } catch (e) {
        // Ignore if table doesn't exist
      }

      // 9. Fetch users from cloud
      let cloudUsers = [];
      try {
        const userRes = await fetch(`${url}/rest/v1/users?select=*`, { headers });
        cloudUsers = userRes.ok ? await userRes.json() : [];
      } catch (e) {
        // Table might not exist yet
      }

      // 10. Merge Users — cloud diambil dulu, lalu LOCAL menimpa (agar koreksi jobdesk dari kode tetap berlaku)
      const localUsers = this.getUsers();
      let mergedUsers = localUsers;
      
      if (cloudUsers.length > 0) {
        const mergedUserMap = new Map();
        // Cloud dimasukkan dulu
        cloudUsers.forEach(u => mergedUserMap.set(u.username.toLowerCase(), {
          username: u.username,
          role: u.role,
          password: u.password,
          jobdesk: u.jobdesk || 'suhu'
        }));
        // LOCAL menimpa cloud — agar DEFAULT_USERS yang sudah dikoreksi selalu menang
        localUsers.forEach(u => mergedUserMap.set(u.username.toLowerCase(), u));
        mergedUsers = Array.from(mergedUserMap.values());
        localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));

      }

      // 11. Upload missing local users to cloud
      const cloudUsernames = new Set(cloudUsers.map(u => u.username.toLowerCase()));
      const usersToUpload = localUsers.filter(u => !cloudUsernames.has(u.username.toLowerCase()));
      for (const u of usersToUpload) {
        try {
          await fetch(`${url}/rest/v1/users`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({
              username: u.username,
              role: u.role,
              password: u.password,
              jobdesk: u.jobdesk || 'suhu'
            })
          });
        } catch (e) {
          // Ignore
        }
      }

      // 12. Fetch & Merge settings (locations, stationCoords, geofence) from cloud
      try {
        await this.fetchSettingsFromCloud();
      } catch (e) {
        // Ignore if table doesn't exist
      }

      const mergedHandovers = this.getHandovers();
      return { reports: mergedReports, attendance: mergedAtt, activities: mergedActivities, handovers: mergedHandovers };
    } catch (e) {
      console.error("Sync failed:", e);
      throw e;
    }
  },

  async uploadReportToCloud(report) {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      };
      const mapped = {
        id: report.id,
        timestamp: report.timestamp,
        officer: report.officer,
        location: report.location,
        equipment_name: report.equipmentName || report.equipment_name || '',
        temperature: report.temperature,
        notes: report.notes || null,
        image: report.image || null,
        status: report.status || 'Normal',
        jobdesk: report.jobdesk || 'suhu'
      };
      await fetch(`${url}/rest/v1/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mapped)
      });
    } catch (e) {
      console.error("Failed to upload report to cloud:", e);
    }
  },

  async uploadAttendanceToCloud(attendance) {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      };
      
      const mapped = {
        id: attendance.id,
        timestamp: attendance.timestamp,
        officer: attendance.officer,
        jobdesk: attendance.jobdesk || 'suhu',
        type: attendance.type,
        image: attendance.image,
        latitude: attendance.latitude,
        longitude: attendance.longitude,
        gps_accuracy: attendance.gpsAccuracy,
        is_fake_gps: attendance.isFakeGps,
        notes: attendance.notes || null,
        status: attendance.status || 'Disetujui',
        spv_approval: attendance.spvApproval ? (typeof attendance.spvApproval === 'object' ? JSON.stringify(attendance.spvApproval) : attendance.spvApproval) : null,
        manager_approval: attendance.managerApproval ? (typeof attendance.managerApproval === 'object' ? JSON.stringify(attendance.managerApproval) : attendance.managerApproval) : null
      };

      await fetch(`${url}/rest/v1/attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mapped)
      });
    } catch (e) {
      console.error("Failed to upload attendance to cloud:", e);
    }
  },

  updateAttendanceStatus(id, status, approverName, role) {
    try {
      const list = this.getAttendance();
      const entry = list.find(a => a.id === id);
      if (entry) {
        entry.status = status;
        if (role === 'Supervisor') {
          entry.spvApproval = approverName;
        } else if (role === 'Manager') {
          entry.managerApproval = approverName;
        }
        localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
        this.updateAttendanceOnCloud(entry);
        return entry;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async updateAttendanceOnCloud(attendance) {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      };
      
      const mapped = {
        id: attendance.id,
        timestamp: attendance.timestamp,
        officer: attendance.officer,
        jobdesk: attendance.jobdesk || 'suhu',
        type: attendance.type,
        image: attendance.image,
        latitude: attendance.latitude,
        longitude: attendance.longitude,
        gps_accuracy: attendance.gpsAccuracy,
        is_fake_gps: attendance.isFakeGps,
        notes: attendance.notes || null,
        status: attendance.status || 'Disetujui',
        spv_approval: attendance.spvApproval ? (typeof attendance.spvApproval === 'object' ? JSON.stringify(attendance.spvApproval) : attendance.spvApproval) : null,
        manager_approval: attendance.managerApproval ? (typeof attendance.managerApproval === 'object' ? JSON.stringify(attendance.managerApproval) : attendance.managerApproval) : null
      };

      await fetch(`${url}/rest/v1/attendance?id=eq.${attendance.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(mapped)
      });
    } catch (e) {
      console.error("Failed to update attendance on cloud:", e);
    }
  },

  async uploadActivityToCloud(activity) {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      };
      await fetch(`${url}/rest/v1/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify(activity)
      });
    } catch (e) {
      console.error("Failed to upload activity to cloud:", e);
    }
  },

  async uploadHandoverToCloud(handover) {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      };
      const mapped = {
        id: handover.id,
        type: handover.type,
        jobdesk: handover.jobdesk,
        shift_from: handover.shiftFrom || null,
        shift_to: handover.shiftTo || null,
        sender_name: handover.senderName,
        sender_station: handover.senderStation || null,
        sender_lat: handover.senderLat || null,
        sender_lon: handover.senderLon || null,
        sent_at: handover.sentAt || new Date().toISOString(),
        summary: handover.summary || '',
        issues: handover.issues || '',
        notes: handover.notes || '',
        receiver_name: handover.receiverName || null,
        receiver_station: handover.receiverStation || null,
        receiver_lat: handover.receiverLat || null,
        receiver_lon: handover.receiverLon || null,
        received_at: handover.receivedAt || null,
        piket_date: handover.piketDate || null,
        piket_checklist: handover.piketChecklist ? (typeof handover.piketChecklist === 'string' ? handover.piketChecklist : JSON.stringify(handover.piketChecklist)) : null,
        sender_from: handover.senderFrom || 'personnel',
        status: handover.status || 'pending',
        notified_spv: handover.notifiedSpv || false,
        notified_manager: handover.notifiedManager || false
      };
      await fetch(`${url}/rest/v1/handovers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mapped)
      });
    } catch (e) {
      console.error("Failed to upload handover to cloud:", e);
    }
  },

  async updateHandoverOnCloud(handover) {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      };
      const mapped = {
        id: handover.id,
        type: handover.type,
        jobdesk: handover.jobdesk,
        shift_from: handover.shiftFrom || null,
        shift_to: handover.shiftTo || null,
        sender_name: handover.senderName,
        sender_station: handover.senderStation || null,
        sender_lat: handover.senderLat || null,
        sender_lon: handover.senderLon || null,
        sent_at: handover.sentAt || new Date().toISOString(),
        summary: handover.summary || '',
        issues: handover.issues || '',
        notes: handover.notes || '',
        receiver_name: handover.receiverName || null,
        receiver_station: handover.receiverStation || null,
        receiver_lat: handover.receiverLat || null,
        receiver_lon: handover.receiverLon || null,
        received_at: handover.receivedAt || null,
        piket_date: handover.piketDate || null,
        piket_checklist: handover.piketChecklist ? (typeof handover.piketChecklist === 'string' ? handover.piketChecklist : JSON.stringify(handover.piketChecklist)) : null,
        sender_from: handover.senderFrom || 'personnel',
        status: handover.status || 'pending',
        notified_spv: handover.notifiedSpv || false,
        notified_manager: handover.notifiedManager || false
      };
      await fetch(`${url}/rest/v1/handovers?id=eq.${handover.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(mapped)
      });
    } catch (e) {
      console.error("Failed to update handover on cloud:", e);
    }
  },

  async fetchHandoversFromCloud() {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return [];
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      };
      const res = await fetch(`${url}/rest/v1/handovers?select=*`, { headers });
      if (!res.ok) return [];
      const cloudData = await res.json();
      return cloudData.map(h => ({
        id: h.id,
        type: h.type,
        jobdesk: h.jobdesk,
        shiftFrom: h.shift_from,
        shiftTo: h.shift_to,
        senderName: h.sender_name,
        senderStation: h.sender_station,
        senderLat: h.sender_lat,
        senderLon: h.sender_lon,
        sentAt: h.sent_at,
        summary: h.summary,
        issues: h.issues,
        notes: h.notes,
        receiverName: h.receiver_name,
        receiverStation: h.receiver_station,
        receiverLat: h.receiver_lat,
        receiverLon: h.receiver_lon,
        receivedAt: h.received_at,
        piketDate: h.piket_date,
        piketChecklist: h.piket_checklist ? (typeof h.piket_checklist === 'string' ? JSON.parse(h.piket_checklist) : h.piket_checklist) : null,
        senderFrom: h.sender_from,
        status: h.status,
        notifiedSpv: h.notified_spv,
        notifiedManager: h.notified_manager
      }));
    } catch (e) {
      console.error("Failed to fetch handovers from cloud:", e);
      return [];
    }
  },

  downloadFile(content, fileNamePrefix) {
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileNamePrefix}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async uploadUserToCloud(user) {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
      // Attempt to upsert/merge the user based on unique constraint
      await fetch(`${url}/rest/v1/users`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          username: user.username,
          role: user.role,
          password: user.password,
          jobdesk: user.jobdesk || 'suhu'
        })
      });
    } catch (e) {
      console.error("Failed to upload user to cloud:", e);
    }
  },

  async deleteUserFromCloud(username) {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
      await fetch(`${url}/rest/v1/users?username=eq.${username}`, {
        method: 'DELETE',
        headers
      });
    } catch (e) {
      console.error("Failed to delete user from cloud:", e);
    }
  },

  // --- STRIP ALL IMAGES FROM CLOUD TO FREE STORAGE ---
  async stripAllCloudImages() {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return { success: false, message: 'Cloud belum dikonfigurasi.' };
    
    const headers = { 
      'apikey': key, 
      'Authorization': `Bearer ${key}`, 
      'Content-Type': 'application/json' 
    };
    
    let totalStripped = 0;
    const tables = ['reports', 'attendance', 'activities'];
    
    for (const table of tables) {
      try {
        // Get all records with images
        const res = await fetch(`${url}/rest/v1/${table}?select=id,image&image=not.is.null&limit=1000`, { headers });
        if (!res.ok) continue;
        const data = await res.json();
        const withImages = data.filter(d => d.image && d.image.length > 10);
        
        for (const record of withImages) {
          try {
            await fetch(`${url}/rest/v1/${table}?id=eq.${record.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ image: null })
            });
            totalStripped++;
          } catch (e) {
            // skip individual errors
          }
        }
      } catch (e) {
        console.error(`Error stripping images from ${table}:`, e);
      }
    }
    
    // Also strip images from localStorage
    for (const storageKey of [REPORTS_KEY, ATTENDANCE_KEY, ACTIVITIES_KEY]) {
      try {
        const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
        data.forEach(item => { if (item.image) item.image = null; });
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {}
    }
    
    return { success: true, total: totalStripped };
  },

  async uploadSettingsToCloud() {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      };
      const payload = {
        id: 'global',
        data: {
          locations: this.getLocations(),
          stationCoords: this.getStationCoords(),
          settings: this.getSettings(),
          deviceLogs: this.getDeviceLogs()
        },
        updated_at: new Date().toISOString()
      };
      await fetch(`${url}/rest/v1/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed to upload settings to cloud:", e);
    }
  },

  async fetchSettingsFromCloud() {
    const { url, key } = this.getSupabaseConfig();
    if (!url || !key) return null;
    try {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      };
      const res = await fetch(`${url}/rest/v1/settings?id=eq.global&select=*`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.length > 0 && data[0].data) {
        const cloudData = data[0].data;
        if (cloudData.locations && Array.isArray(cloudData.locations)) {
          localStorage.setItem(LOCATIONS_KEY, JSON.stringify(cloudData.locations));
        }
        if (cloudData.stationCoords && typeof cloudData.stationCoords === 'object') {
          const _mergedCoords = { ...DEFAULT_STATION_COORDS, ...cloudData.stationCoords };
          localStorage.setItem(STATION_COORDS_KEY, JSON.stringify(_mergedCoords));
        }
        if (cloudData.settings && typeof cloudData.settings === 'object') {
          const _mergedSettings = { ...DEFAULT_SETTINGS, ...cloudData.settings };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(_mergedSettings));
        }
        if (cloudData.deviceLogs && Array.isArray(cloudData.deviceLogs)) {
          const localLogs = JSON.parse(localStorage.getItem(DEVICE_LOGS_KEY) || '[]');
          const mergedLogsMap = new Map();
          cloudData.deviceLogs.forEach(l => mergedLogsMap.set(l.id, l));
          localLogs.forEach(l => mergedLogsMap.set(l.id, l));
          const mergedLogs = Array.from(mergedLogsMap.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 200);
          localStorage.setItem(DEVICE_LOGS_KEY, JSON.stringify(mergedLogs));
        }
        return cloudData;
      }
      return null;
    } catch (e) {
      console.error("Failed to fetch settings from cloud:", e);
      return null;
    }
  }
};
