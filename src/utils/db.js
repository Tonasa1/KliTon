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
  'Gudang Buffer',
  'Dome T4',
  'Dome T5',
  'Gudang BKS',
  'Hopper',
  'Lainnya...'
];

const DEFAULT_INSPEKSI_LOCATIONS = [
  'Area Produksi',
  'Gudang Bahan Baku',
  'Ruang Kontrol',
  'Area Conveyor',
  'Lainnya...'
];

const DEFAULT_ANALIS_LOCATIONS = [
  'Laboratorium Utama',
  'Lab Kimia',
  'Lab Fisika',
  'Area Sampling',
  'Lainnya...'
];

const DEFAULT_SETTINGS = {
  highTempAlert: 60.0, // Warning threshold for industrial machines
  feverTempAlert: 80.0, // Danger threshold for industrial machines
  enableGeofence: false,
  geofenceLat: -6.200000,
  geofenceLon: 106.816666,
  geofenceRadius: 100
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
  localStorage.setItem(INSPEKSI_LOCATIONS_KEY, JSON.stringify(DEFAULT_INSPEKSI_LOCATIONS));
}
if (!localStorage.getItem(ANALIS_LOCATIONS_KEY)) {
  localStorage.setItem(ANALIS_LOCATIONS_KEY, JSON.stringify(DEFAULT_ANALIS_LOCATIONS));
}

export const db = {
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
        ...report
      };
      reports.push(newReport);
      localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
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
      localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
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
        ...attendance
      };
      list.push(newEntry);
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
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
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(filtered));
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
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(list));
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
        ...activity
      };
      list.push(newEntry);
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(list));
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
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(filtered));
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
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- LOCATIONS PER JOBDESK ---
  getLocationsByJobdesk(jobdesk) {
    if (jobdesk === 'inspeksi') {
      try {
        const data = localStorage.getItem(INSPEKSI_LOCATIONS_KEY);
        return data ? JSON.parse(data) : DEFAULT_INSPEKSI_LOCATIONS;
      } catch (e) {
        return DEFAULT_INSPEKSI_LOCATIONS;
      }
    } else if (jobdesk === 'analis') {
      try {
        const data = localStorage.getItem(ANALIS_LOCATIONS_KEY);
        return data ? JSON.parse(data) : DEFAULT_ANALIS_LOCATIONS;
      } catch (e) {
        return DEFAULT_ANALIS_LOCATIONS;
      }
    }
    return this.getLocations(); // default: suhu
  },

  saveLocationByJobdesk(jobdesk, location) {
    const key = jobdesk === 'inspeksi' ? INSPEKSI_LOCATIONS_KEY : jobdesk === 'analis' ? ANALIS_LOCATIONS_KEY : LOCATIONS_KEY;
    try {
      const locations = this.getLocationsByJobdesk(jobdesk);
      const trimmed = location.trim();
      if (trimmed && !locations.includes(trimmed)) {
        locations.push(trimmed);
        localStorage.setItem(key, JSON.stringify(locations));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  deleteLocationByJobdesk(jobdesk, location) {
    const key = jobdesk === 'inspeksi' ? INSPEKSI_LOCATIONS_KEY : jobdesk === 'analis' ? ANALIS_LOCATIONS_KEY : LOCATIONS_KEY;
    try {
      const locations = this.getLocationsByJobdesk(jobdesk);
      const filtered = locations.filter(l => l !== location);
      localStorage.setItem(key, JSON.stringify(filtered));
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
    return {
      url: localStorage.getItem('thermascan_supabase_url') || 'https://pwfmkjexbxuucnxmcvpp.supabase.co',
      key: localStorage.getItem('thermascan_supabase_key') || 'sb_publishable_rKK-Hev-JCnfa_UI-Kjwog_3twu3_nG'
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
      const cloudReports = reportsRes.ok ? await reportsRes.json() : [];

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
        
      localStorage.setItem(REPORTS_KEY, JSON.stringify(mergedReports));

      // 3. Merge Attendance
      const localAtt = this.getAttendance();
      const mergedAttMap = new Map();
      
      cloudAtt.forEach(a => mergedAttMap.set(a.id, a));
      localAtt.forEach(a => mergedAttMap.set(a.id, a));
      
      const mergedAtt = Array.from(mergedAttMap.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(mergedAtt));

      // 4. Upload missing local reports to cloud
      const cloudReportIds = new Set(cloudReports.map(r => r.id));
      const reportsToUpload = localReports.filter(r => !cloudReportIds.has(r.id));
      
      for (const r of reportsToUpload) {
        await fetch(`${url}/rest/v1/reports`, {
          method: 'POST',
          headers,
          body: JSON.stringify(r)
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
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(mergedActivities));

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

      // 9. Fetch users from cloud
      let cloudUsers = [];
      try {
        const userRes = await fetch(`${url}/rest/v1/users?select=*`, { headers });
        cloudUsers = userRes.ok ? await userRes.json() : [];
      } catch (e) {
        // Table might not exist yet
      }

      // 10. Merge Users
      const localUsers = this.getUsers();
      let mergedUsers = localUsers;
      
      if (cloudUsers.length > 0) {
        const mergedUserMap = new Map();
        localUsers.forEach(u => mergedUserMap.set(u.username.toLowerCase(), u));
        cloudUsers.forEach(u => mergedUserMap.set(u.username.toLowerCase(), {
          username: u.username,
          role: u.role,
          password: u.password,
          jobdesk: u.jobdesk || 'suhu'
        }));
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

      return { reports: mergedReports, attendance: mergedAtt, activities: mergedActivities };
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
        'Content-Type': 'application/json'
      };
      await fetch(`${url}/rest/v1/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify(report)
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
        spv_approval: attendance.spvApproval || null,
        manager_approval: attendance.managerApproval || null
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
        spv_approval: attendance.spvApproval || null,
        manager_approval: attendance.managerApproval || null
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
        'Content-Type': 'application/json'
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
  }
};
