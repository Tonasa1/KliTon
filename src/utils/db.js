// Local Database utilities for ThermaScan using localStorage

const REPORTS_KEY = 'thermascan_reports';
const LOCATIONS_KEY = 'thermascan_locations';
const SETTINGS_KEY = 'thermascan_settings';
const OFFICERS_KEY = 'thermascan_officers';
const ATTENDANCE_KEY = 'thermascan_attendance';
const SESSION_KEY = 'thermascan_session';

const DEFAULT_OFFICERS = [
  'FAHRIL',
  'JUMAHIR',
  'IMAN TAQWA',
  'ANDI MAJJAJARENG'
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

const DEFAULT_SETTINGS = {
  highTempAlert: 60.0, // Warning threshold for industrial machines
  feverTempAlert: 80.0  // Danger threshold for industrial machines
};

// Initialize default data if not present
if (!localStorage.getItem(OFFICERS_KEY)) {
  localStorage.setItem(OFFICERS_KEY, JSON.stringify(DEFAULT_OFFICERS));
}
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

export const db = {
  // --- SESSION LOGIN SYSTEM ---
  login(role, username, password) {
    // Basic verification logic
    if (role === 'Administrator') {
      if (username.toLowerCase() === 'admin' && password === 'admin123') {
        const session = { role, name: 'Administrator' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      }
    } else if (role === 'Supervisor') {
      if (username.toLowerCase() === 'supervisor' && password === 'spv123') {
        const session = { role, name: 'Supervisor' };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      }
    } else if (role === 'Operator') {
      const officers = this.getOfficers();
      if (officers.includes(username) && password === 'operator123') {
        const session = { role, name: username };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      }
    }
    return null;
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

  clearAllAttendance() {
    try {
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
      return true;
    } catch (e) {
      return false;
    }
  },

  // --- OFFICERS (Petugas) ---
  getOfficers() {
    try {
      const data = localStorage.getItem(OFFICERS_KEY);
      return data ? JSON.parse(data) : DEFAULT_OFFICERS;
    } catch (e) {
      return DEFAULT_OFFICERS;
    }
  },

  saveOfficer(name) {
    try {
      const officers = this.getOfficers();
      const trimmed = name.trim().toUpperCase();
      if (trimmed && !officers.includes(trimmed)) {
        officers.push(trimmed);
        localStorage.setItem(OFFICERS_KEY, JSON.stringify(officers));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  deleteOfficer(name) {
    try {
      const officers = this.getOfficers();
      const filtered = officers.filter(o => o !== name);
      localStorage.setItem(OFFICERS_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
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

  // --- SETTINGS ---
  getSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
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
    const headers = ['ID Absen', 'Waktu Absen', 'Nama Petugas', 'Tipe Absensi', 'Latitude', 'Longitude', 'Akurasi GPS (m)', 'Link Google Maps', 'Terindikasi Fake GPS'];

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
        a.isFakeGps ? 'YA' : 'TIDAK'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    this.downloadFile(csvContent, 'Laporan_Absensi_ThermaScan');
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
      const cloudAtt = attRes.ok ? await attRes.json() : [];

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
        await fetch(`${url}/rest/v1/attendance`, {
          method: 'POST',
          headers,
          body: JSON.stringify(a)
        });
      }

      return { reports: mergedReports, attendance: mergedAtt };
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
      await fetch(`${url}/rest/v1/attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify(attendance)
      });
    } catch (e) {
      console.error("Failed to upload attendance to cloud:", e);
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
  }
};
