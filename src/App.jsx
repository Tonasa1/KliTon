import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Camera, 
  Calendar, 
  Settings as SettingsIcon, 
  Download, 
  Trash2, 
  Plus, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  User, 
  Image as ImageIcon, 
  RefreshCw, 
  FileText, 
  ChevronRight, 
  Info,
  Sliders,
  UserCheck,
  ShieldAlert,
  LogOut,
  Lock
} from 'lucide-react';
import { db } from './utils/db';

export default function App() {
  // Authentication & Session States
  const [currentUser, setCurrentUser] = useState(null); // { role, name }
  const [loginRole, setLoginRole] = useState('Operator'); // 'Administrator' | 'Supervisor' | 'Operator'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // App States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [locations, setLocations] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [settings, setSettings] = useState({ highTempAlert: 60.0, feverTempAlert: 80.0 });
  const [toast, setToast] = useState(null);
  
  // OCR & Camera States (Untuk Suhu Alat)
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null); // base64
  const [ocrProgress, setOcrProgress] = useState(-1); // -1 means idle
  const [ocrStatusText, setOcrStatusText] = useState('');
  
  // Form States (Suhu Alat)
  const [formTemp, setFormTemp] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formOfficer, setFormOfficer] = useState('');
  const [formNotes, setFormNotes] = useState('');
  
  // Attendance Form States
  const [attOfficer, setAttOfficer] = useState('');
  const [attType, setAttType] = useState('Check In'); // 'Check In' | 'Check Out'
  const [attImage, setAttImage] = useState(null); // base64
  const [attCameraActive, setAttCameraActive] = useState(false);
  const [attGpsLoading, setAttGpsLoading] = useState(false);
  const [attGpsData, setAttGpsData] = useState(null); // { latitude, longitude, accuracy, isFakeGps }
  
  // History Sub-Tab States
  const [historySubTab, setHistorySubTab] = useState('suhu'); // 'suhu' | 'absensi'
  
  // History Filters (Suhu)
  const [filterLocation, setFilterLocation] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // History Filters (Absensi)
  const [filterAttOfficer, setFilterAttOfficer] = useState('Semua');
  const [filterAttType, setFilterAttType] = useState('Semua');
  const [searchAttQuery, setSearchAttQuery] = useState('');
  
  // Modal / Detail States
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [showOfficerInput, setShowOfficerInput] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');

  // Refs
  const videoRef = useRef(null);
  const attVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const attCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const attFileInputRef = useRef(null);
  const streamRef = useRef(null);
  const attStreamRef = useRef(null);

  // Load initial data
  useEffect(() => {
    // Check login session
    const session = db.getCurrentSession();
    if (session) {
      setCurrentUser(session);
      // Adjust default landing tab based on role
      setActiveTab('dashboard');
    }

    setReports(db.getReports());
    setAttendance(db.getAttendance());
    setLocations(db.getLocations());
    
    const dbOfficers = db.getOfficers();
    setOfficers(dbOfficers);
    
    const savedSettings = db.getSettings();
    setSettings(savedSettings);
    
    // Set default values from db
    if (dbOfficers.length > 0) {
      setLoginUsername(dbOfficers[0]);
    }
    
    const locs = db.getLocations();
    if (locs.length > 0) {
      setFormLocation(locs[0]);
    }
  }, []);

  // Update default login usernames based on role
  useEffect(() => {
    if (loginRole === 'Administrator') {
      setLoginUsername('admin');
    } else if (loginRole === 'Supervisor') {
      setLoginUsername('supervisor');
    } else if (loginRole === 'Operator') {
      const dbOfficers = db.getOfficers();
      if (dbOfficers.length > 0) {
        setLoginUsername(dbOfficers[0]);
      }
    }
    setLoginPassword('');
  }, [loginRole, officers]);

  // Sync form officers with logged-in user if they are Operator
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Operator') {
        setFormOfficer(currentUser.name);
        setAttOfficer(currentUser.name);
      } else {
        const dbOfficers = db.getOfficers();
        if (dbOfficers.length > 0) {
          setFormOfficer(dbOfficers[0]);
          setAttOfficer(dbOfficers[0]);
        }
      }
    }
  }, [currentUser]);

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // --- LOGIN & LOGOUT HANDLER ---
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      showToast("Harap isi semua kolom login!", "error");
      return;
    }

    const session = db.login(loginRole, loginUsername, loginPassword);
    if (session) {
      setCurrentUser(session);
      showToast(`Login berhasil sebagai ${session.name}!`, "success");
      
      // Reset input
      setLoginPassword('');
      
      // Default Active Tabs based on role
      setActiveTab('dashboard');
    } else {
      showToast("Username atau kata sandi salah!", "error");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      db.logout();
      setCurrentUser(null);
      stopCamera();
      stopAttCamera();
      setCapturedImage(null);
      setAttImage(null);
      setAttGpsData(null);
      showToast("Anda telah keluar dari aplikasi.", "success");
    }
  };

  // --- CAMERA MANAGEMENT (Suhu) ---
  const startCamera = async () => {
    setCapturedImage(null);
    setFormTemp('');
    setOcrProgress(-1);
    try {
      setCameraActive(true);
      setTimeout(async () => {
        if (!videoRef.current) return;
        const constraints = {
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }, 300);
    } catch (err) {
      console.error("Camera access error:", err);
      showToast("Gagal mengakses kamera. Gunakan tombol 'Unggah Foto' sebagai cadangan.", "error");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    const viewportHeight = 280;
    const targetW = 220;
    const targetH = 110;
    const scale = videoHeight / viewportHeight;
    const cropW = targetW * scale;
    const cropH = targetH * scale;
    const cropX = (videoWidth - cropW) / 2;
    const cropY = (videoHeight - cropH) / 2;
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    
    const croppedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(croppedDataUrl);
    stopCamera();
    runOCR(croppedDataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedImage(dataUrl);
      stopCamera();
      runOCR(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // --- CAMERA MANAGEMENT (Absensi) ---
  const startAttCamera = async () => {
    setAttImage(null);
    try {
      setAttCameraActive(true);
      setTimeout(async () => {
        if (!attVideoRef.current) return;
        const constraints = {
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, // Selfie camera
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        attStreamRef.current = stream;
        attVideoRef.current.srcObject = stream;
        attVideoRef.current.play();
      }, 300);
    } catch (err) {
      console.error("Camera access error:", err);
      showToast("Gagal mengakses kamera depan. Gunakan tombol 'Unggah Foto'.", "error");
      setAttCameraActive(false);
    }
  };

  const stopAttCamera = () => {
    if (attStreamRef.current) {
      attStreamRef.current.getTracks().forEach(track => track.stop());
      attStreamRef.current = null;
    }
    if (attVideoRef.current) {
      attVideoRef.current.srcObject = null;
    }
    setAttCameraActive(false);
  };

  const captureAttPhoto = () => {
    if (!attVideoRef.current || !attCanvasRef.current) return;
    const video = attVideoRef.current;
    const canvas = attCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setAttImage(dataUrl);
    stopAttCamera();
    lockGeolocation();
  };

  const handleAttFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setAttImage(dataUrl);
      stopAttCamera();
      lockGeolocation();
    };
    reader.readAsDataURL(file);
  };

  // --- GEOLOCATION & FAKE GPS DETECTION ---
  const lockGeolocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation tidak didukung oleh perangkat ini.", "error");
      return;
    }

    setAttGpsLoading(true);
    setAttGpsData(null);
    const startTime = performance.now();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const acc = position.coords.accuracy;
        
        let isFake = false;
        
        if (navigator.webdriver) {
          isFake = true;
        }
        if (acc === 0) {
          isFake = true;
        }
        if (duration < 10) {
          isFake = true;
        }
        if (Number.isInteger(lat) && Number.isInteger(lon)) {
          isFake = true;
        }

        setAttGpsData({
          latitude: lat,
          longitude: lon,
          accuracy: acc.toFixed(1),
          isFakeGps: isFake
        });
        
        setAttGpsLoading(false);
        if (isFake) {
          showToast("Peringatan: Terdeteksi indikasi manipulasi lokasi (Fake GPS)!", "error");
        } else {
          showToast("Lokasi GPS berhasil dikunci secara akurat.", "success");
        }
      },
      (error) => {
        console.error("GPS Lock Error:", error);
        let errorMsg = "Gagal mendapatkan lokasi GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Akses lokasi ditolak. Harap aktifkan GPS dan izinkan browser mengakses lokasi.";
        }
        showToast(errorMsg, "error");
        setAttGpsLoading(false);
        setAttGpsData({
          latitude: null,
          longitude: null,
          accuracy: null,
          isFakeGps: false,
          error: error.message
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // --- OCR ENGINE ---
  const runOCR = async (imageSrc) => {
    setOcrProgress(0);
    setOcrStatusText('Menyiapkan Mesin OCR...');
    try {
      const Tesseract = await import('tesseract.js');
      setOcrStatusText('Memindai Gambar...');
      const result = await Tesseract.recognize(
        imageSrc,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing') {
              setOcrProgress(Math.round(m.progress * 100));
              setOcrStatusText(`Membaca Angka: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      const rawText = result.data.text;
      console.log("OCR Result Text:", rawText);
      const detectedTemp = parseTemperatureText(rawText);
      
      if (detectedTemp) {
        setFormTemp(detectedTemp);
        showToast(`Suhu terdeteksi: ${detectedTemp}°C!`, "success");
      } else {
        showToast("Suhu tidak terdeteksi otomatis. Silakan ketik manual.", "error");
      }
      setOcrProgress(-1);
    } catch (err) {
      console.error("OCR Error:", err);
      showToast("Gagal memproses gambar otomatis. Silakan isi manual.", "error");
      setOcrProgress(-1);
    }
  };

  const parseTemperatureText = (text) => {
    if (!text) return '';
    let cleaned = text
      .replace(/[bB]/g, '6')
      .replace(/[oO]/g, '0')
      .replace(/[sS]/g, '5')
      .replace(/[iIl|]/g, '1')
      .replace(/[zZ]/g, '2')
      .replace(/[gG]/g, '9')
      .replace(/[aA]/g, '4')
      .replace(/q/g, '9');
      
    const decimalMatch = cleaned.match(/(\d+)[\.,\s](\d)/);
    if (decimalMatch) {
      return `${decimalMatch[1]}.${decimalMatch[2]}`;
    }
    
    const intMatch = cleaned.match(/(\d+)/);
    if (intMatch) {
      return `${intMatch[1]}.0`;
    }
    return '';
  };

  // --- REPORT SUBMISSIONS ---
  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!formTemp || isNaN(parseFloat(formTemp))) {
      showToast("Harap masukkan nilai suhu yang valid!", "error");
      return;
    }
    if (!formLocation) {
      showToast("Harap pilih lokasi stasiun pengukuran!", "error");
      return;
    }
    const newReport = {
      temperature: parseFloat(formTemp),
      location: formLocation,
      officer: currentUser.role === 'Operator' ? currentUser.name : formOfficer,
      notes: formNotes,
      image: capturedImage
    };
    const saved = db.saveReport(newReport);
    if (saved) {
      showToast("Laporan suhu berhasil disimpan!", "success");
      setReports(db.getReports());
      setCapturedImage(null);
      setFormTemp('');
      setFormNotes('');
      setHistorySubTab('suhu');
      setActiveTab('history');
    } else {
      showToast("Gagal menyimpan laporan.", "error");
    }
  };

  const handleSubmitAttendance = (e) => {
    e.preventDefault();
    if (currentUser.role !== 'Operator' && !attOfficer) {
      showToast("Harap pilih nama petugas!", "error");
      return;
    }
    if (!attImage) {
      showToast("Harap ambil atau unggah foto absensi!", "error");
      return;
    }
    if (attGpsLoading) {
      showToast("Sedang mengunci lokasi GPS, harap tunggu...", "error");
      return;
    }

    const newAttendance = {
      officer: currentUser.role === 'Operator' ? currentUser.name : attOfficer,
      type: attType,
      image: attImage,
      latitude: attGpsData ? attGpsData.latitude : null,
      longitude: attGpsData ? attGpsData.longitude : null,
      gpsAccuracy: attGpsData ? attGpsData.accuracy : null,
      isFakeGps: attGpsData ? attGpsData.isFakeGps : false
    };

    const saved = db.saveAttendance(newAttendance);
    if (saved) {
      showToast(`Absensi ${attType} berhasil disimpan!`, "success");
      setAttendance(db.getAttendance());
      setAttImage(null);
      setAttGpsData(null);
      setHistorySubTab('absensi');
      setActiveTab('history');
    } else {
      showToast("Gagal menyimpan absensi.", "error");
    }
  };

  const handleDeleteReport = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus laporan suhu ini?")) {
      db.deleteReport(id);
      setReports(db.getReports());
      showToast("Laporan berhasil dihapus.", "success");
      setSelectedReport(null);
    }
  };

  const handleDeleteAttendance = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus absensi ini?")) {
      db.deleteAttendance(id);
      setAttendance(db.getAttendance());
      showToast("Data absensi berhasil dihapus.", "success");
      setSelectedAttendance(null);
    }
  };

  const handleExportCSV = () => {
    if (historySubTab === 'suhu') {
      const success = db.exportToCSV(filteredReports);
      if (success) showToast("Laporan suhu diekspor ke file CSV!", "success");
      else showToast("Tidak ada data laporan suhu untuk diekspor.", "error");
    } else {
      const success = db.exportAttendanceToCSV(filteredAttendance);
      if (success) showToast("Laporan absensi diekspor ke file CSV!", "success");
      else showToast("Tidak ada data absensi untuk diekspor.", "error");
    }
  };

  // --- SETTINGS MANAGEMENT ---
  const handleSaveSettings = (e) => {
    e.preventDefault();
    db.saveSettings(settings);
    showToast("Pengaturan ambang batas suhu disimpan!", "success");
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (newLocationName.trim()) {
      const success = db.saveLocation(newLocationName);
      if (success) {
        setLocations(db.getLocations());
        setNewLocationName('');
        setShowLocationInput(false);
        showToast("Lokasi baru ditambahkan!", "success");
      } else {
        showToast("Lokasi sudah ada atau tidak valid.", "error");
      }
    }
  };

  const handleDeleteLocation = (loc) => {
    if (locations.length <= 1) {
      showToast("Minimal harus menyisakan 1 lokasi.", "error");
      return;
    }
    db.deleteLocation(loc);
    setLocations(db.getLocations());
    showToast("Lokasi berhasil dihapus.", "success");
  };

  const handleAddOfficer = (e) => {
    e.preventDefault();
    if (newOfficerName.trim()) {
      const success = db.saveOfficer(newOfficerName);
      if (success) {
        const updated = db.getOfficers();
        setOfficers(updated);
        setNewOfficerName('');
        setShowOfficerInput(false);
        showToast("Petugas baru ditambahkan!", "success");
        if (updated.length === 1) {
          setFormOfficer(updated[0]);
          setAttOfficer(updated[0]);
        }
      } else {
        showToast("Petugas sudah terdaftar.", "error");
      }
    }
  };

  const handleDeleteOfficer = (name) => {
    if (officers.length <= 1) {
      showToast("Minimal harus menyisakan 1 petugas.", "error");
      return;
    }
    db.deleteOfficer(name);
    const updated = db.getOfficers();
    setOfficers(updated);
    showToast("Petugas berhasil dihapus.", "success");
    if (!updated.includes(formOfficer)) {
      setFormOfficer(updated[0]);
      setAttOfficer(updated[0]);
    }
  };

  const handleResetData = () => {
    if (window.confirm("PERINGATAN! Tindakan ini akan menghapus seluruh data laporan suhu secara permanen. Apakah Anda ingin melanjutkan?")) {
      db.clearAllReports();
      setReports([]);
      showToast("Seluruh laporan suhu telah dikosongkan.", "success");
    }
  };

  const handleResetAttendance = () => {
    if (window.confirm("PERINGATAN! Tindakan ini akan menghapus seluruh data absensi secara permanen. Apakah Anda ingin melanjutkan?")) {
      db.clearAllAttendance();
      setAttendance([]);
      showToast("Seluruh data absensi telah dikosongkan.", "success");
    }
  };

  // --- FILTERS & ANALYTICS ---
  const filteredReports = reports.filter(r => {
    const matchLocation = filterLocation === 'Semua' || r.location === filterLocation;
    const statusObj = db.getTemperatureStatus(r.temperature, settings);
    const matchStatus = filterStatus === 'Semua' || statusObj.label.includes(filterStatus);
    
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      r.location.toLowerCase().includes(term) ||
      (r.officer && r.officer.toLowerCase().includes(term)) ||
      r.temperature.toString().includes(term) ||
      (r.notes && r.notes.toLowerCase().includes(term));
      
    return matchLocation && matchStatus && matchSearch;
  });

  const filteredAttendance = attendance.filter(a => {
    const matchOfficer = filterAttOfficer === 'Semua' || a.officer === filterAttOfficer;
    const matchType = filterAttType === 'Semua' || a.type === filterAttType;

    const term = searchAttQuery.toLowerCase();
    const matchSearch = 
      a.officer.toLowerCase().includes(term) ||
      a.type.toLowerCase().includes(term) ||
      (a.isFakeGps ? 'fake' : '').includes(term);

    return matchOfficer && matchType && matchSearch;
  });

  const getStats = () => {
    const todayStr = new Date().toDateString();
    const todayReports = reports.filter(r => new Date(r.timestamp).toDateString() === todayStr);
    
    const total = todayReports.length;
    let maxT = '-';
    let abnormalCount = 0;
    
    if (total > 0) {
      maxT = `${Math.max(...todayReports.map(r => r.temperature)).toFixed(1)}°C`;
      abnormalCount = todayReports.filter(r => {
        const statusObj = db.getTemperatureStatus(r.temperature, settings);
        return statusObj.label !== 'NORMAL';
      }).length;
    }
    
    return {
      totalToday: total,
      maxTempToday: maxT,
      alertCount: abnormalCount,
      allTimeTotal: reports.length
    };
  };

  const stats = getStats();

  const renderDashboardChart = () => {
    const chartData = [...reports]
      .slice(0, 7)
      .reverse();
      
    if (chartData.length < 2) {
      return (
        <div className="empty-state" style={{ height: '140px', padding: '10px' }}>
          <Info size={24} />
          <p style={{ fontSize: '0.75rem', marginTop: '6px' }}>
            Butuh minimal 2 laporan untuk menampilkan grafik tren suhu.
          </p>
        </div>
      );
    }

    const width = 400;
    const height = 140;
    const paddingX = 40;
    const paddingY = 25;
    
    const temps = chartData.map(r => r.temperature);
    const minTemp = Math.floor(Math.min(...temps)) - 5;
    const maxTemp = Math.ceil(Math.max(...temps)) + 5;
    const tempRange = maxTemp - minTemp;

    const points = chartData.map((d, index) => {
      const x = paddingX + (index * (width - paddingX * 2) / (chartData.length - 1));
      const y = height - paddingY - ((d.temperature - minTemp) * (height - paddingY * 2) / tempRange);
      return { x, y, temp: d.temperature, time: new Date(d.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaData = `${pathData} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return (
      <div className="chart-container">
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} className="chart-grid-line" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} className="chart-grid-line" />
          <line x1={paddingX} y1={(height - paddingY + paddingY)/2} x2={width - paddingX} y2={(height - paddingY + paddingY)/2} className="chart-grid-line" />
          
          <path d={areaData} className="chart-area" />
          <path d={pathData} className="chart-line" />
          
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" className="chart-dot" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold" fontFamily="var(--font-heading)">
                {p.temp.toFixed(1)}°
              </text>
              <text x={p.x} y={height - 8} textAnchor="middle" className="chart-axis-text">
                {p.time}
              </text>
            </g>
          ))}
          
          <text x={paddingX - 10} y={paddingY + 3} textAnchor="end" className="chart-axis-text">{maxTemp}°</text>
          <text x={paddingX - 10} y={(height - paddingY + paddingY)/2 + 3} textAnchor="end" className="chart-axis-text">{((maxTemp+minTemp)/2).toFixed(0)}°</text>
          <text x={paddingX - 10} y={height - paddingY + 3} textAnchor="end" className="chart-axis-text">{minTemp}°</text>
        </svg>
      </div>
    );
  };

  // --- ROLE TAB FILTER HELPER ---
  const isTabVisible = (tabName) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    
    if (tabName === 'dashboard' || tabName === 'scan' || tabName === 'history') return true;
    if (tabName === 'attendance') return role === 'Operator';
    if (tabName === 'settings') return role === 'Administrator';
    return false;
  };

  // ----------------- RENDER LOGIN PAGE -----------------
  if (!currentUser) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
        {/* Toast Alert */}
        {toast && (
          <div className={`toast ${toast.type}`}>
            <AlertTriangle size={18} />
            <div className="toast-content">{toast.message}</div>
          </div>
        )}

        <div className="glass-card" style={{ width: '100%', maxWidth: '380px', padding: '30px 24px', margin: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#fff', boxShadow: '0 8px 20px var(--primary-glow)' }}>
              <Lock size={26} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '4px' }}>ThermaScan</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sistem Pelaporan Suhu & Absensi Petugas</p>
          </div>

          <form onSubmit={handleLoginSubmit}>
            {/* Role Choice */}
            <div className="form-group">
              <label>Pilih Hak Akses / Peran</label>
              <select 
                className="form-control"
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value)}
                required
              >
                <option value="Operator">Operator (Staff Lapangan)</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>

            {/* Username Selection/Input based on Role */}
            <div className="form-group">
              <label>Identitas Pengguna</label>
              
              {loginRole === 'Operator' ? (
                <select 
                  className="form-control"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                >
                  {officers.map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  className="form-control"
                  value={loginUsername}
                  disabled
                  required
                />
              )}
            </div>

            {/* Password input */}
            <div className="form-group">
              <label>Kata Sandi / PIN</label>
              <input 
                type="password" 
                placeholder="Masukkan sandi..."
                className="form-control"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Masuk Aplikasi
            </button>
          </form>

          {/* Quick Helper Default Credentials */}
          <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>KUNCI AKUN DEMO:</span>
            Admin: <strong>admin</strong> / sandi: <strong>admin123</strong><br />
            Spv: <strong>supervisor</strong> / sandi: <strong>spv123</strong><br />
            Operator: Pilih Nama / sandi: <strong>operator123</strong>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- RENDER MAIN APPLICATION -----------------
  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <div className="toast-content">{toast.message}</div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Activity size={20} />
          </div>
          <div className="logo-text">
            <h1>ThermaScan</h1>
            <span>{currentUser.name}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-badge normal" style={{ fontSize: '0.65rem', padding: '2px 8px', textTransform: 'uppercase' }}>
            {currentUser.role}
          </div>
          <button className="modal-close" onClick={handleLogout} title="Log Out" style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="page-content">
        
        {/* ----------------- TAB: DASHBOARD ----------------- */}
        {activeTab === 'dashboard' && isTabVisible('dashboard') && (
          <div>
            {/* Welcome Greeting Card */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                👋 Selamat datang, {currentUser.role === 'Operator' ? `Operator ${currentUser.name}` : currentUser.name}
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="stats-grid">
              <div className="glass-card stat-card">
                <span className="label">Laporan Hari Ini</span>
                <span className="value">{stats.totalToday}</span>
                <span className="desc">Total pemantauan suhu</span>
              </div>
              <div className="glass-card stat-card">
                <span className="label">Suhu Tertinggi Hari Ini</span>
                <span className="value" style={{ color: stats.maxTempToday !== '-' ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {stats.maxTempToday}
                </span>
                <span className="desc">Suhu alat tertinggi</span>
              </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
              <div className="glass-card stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <span className="label">Peringatan Suhu Tinggi</span>
                <span className="value" style={{ color: stats.alertCount > 0 ? 'var(--danger)' : 'var(--normal)' }}>
                  {stats.alertCount} Laporan
                </span>
                <span className="desc">Mesin masuk kategori ALERT</span>
              </div>
              <div className="glass-card stat-card">
                <span className="label">Total Arsip</span>
                <span className="value">{stats.allTimeTotal}</span>
                <span className="desc">Semua laporan suhu</span>
              </div>
            </div>

            {/* Quick Action Banners */}
            <div style={{ display: 'grid', gridTemplateColumns: currentUser.role === 'Operator' ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0, padding: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Pindai Suhu Alat</div>
                <button className="btn btn-primary" onClick={() => { setActiveTab('scan'); startCamera(); }} style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '8px' }}>
                  <Camera size={14} /> Pindai Suhu
                </button>
              </div>
              {currentUser.role === 'Operator' && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0, padding: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(99,102,241,0.1) 100%)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Absensi Petugas</div>
                  <button className="btn btn-primary" onClick={() => { setActiveTab('attendance'); startAttCamera(); }} style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
                    <UserCheck size={14} /> Absen Foto
                  </button>
                </div>
              )}
            </div>

            {/* Chart Container */}
            <div className="glass-card">
              <h3 className="section-title">
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                Tren Suhu Terakhir
              </h3>
              {renderDashboardChart()}
            </div>
          </div>
        )}

        {/* ----------------- TAB: SCANNER & OCR (Suhu) ----------------- */}
        {activeTab === 'scan' && isTabVisible('scan') && (
          <div>
            {!cameraActive && !capturedImage && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                  <Camera size={32} />
                </div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Pindai Termometer Alat</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Arahkan kamera ke layar termometer digital Anda. Sistem akan memindai dan mengekstrak nilai suhu secara otomatis.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn btn-primary" onClick={startCamera}>
                    <Camera size={18} />
                    Buka Kamera Real-time
                  </button>
                  <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
                    <ImageIcon size={18} />
                    Unggah Gambar dari Galeri
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="glass-card" style={{ padding: '12px' }}>
                <div className="scanner-viewport">
                  <video ref={videoRef} className="scanner-video" playsInline muted />
                  <div className="scanner-overlay"></div>
                  <div className="scanner-target">
                    <div className="scanner-target-bottom-left"></div>
                    <div className="scanner-target-bottom-right"></div>
                  </div>
                  <div className="scanner-line"></div>
                  <span className="scanner-tip">Posisikan layar termometer di dalam kotak</span>
                </div>
                
                <div className="upload-btn-container">
                  <button className="btn btn-secondary" onClick={stopCamera}>
                    <X size={18} /> Batal
                  </button>
                  <button className="btn btn-primary" onClick={capturePhoto}>
                    <Camera size={18} /> Ambil Foto
                  </button>
                </div>
              </div>
            )}

            {/* OCR Processing Overlay */}
            {ocrProgress >= 0 && (
              <div className="glass-card ocr-progress-overlay">
                <RefreshCw size={36} className="scanning-text" style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite' }} />
                <span style={{ fontWeight: '600' }} className="scanning-text">{ocrStatusText}</span>
                <div className="progress-bar-outer">
                  <div className="progress-bar-inner" style={{ width: `${ocrProgress}%` }}></div>
                </div>
              </div>
            )}

            {/* Form Report Submission */}
            {capturedImage && ocrProgress === -1 && (
              <form onSubmit={handleSubmitReport}>
                <div className="glass-card">
                  <h3 className="section-title">
                    <FileText size={16} style={{ color: 'var(--primary)' }} />
                    Verifikasi Laporan Suhu
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                    <img src={capturedImage} alt="Crop Preview" style={{ width: '100px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--card-border)' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>Foto Terpotong</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bagian layar termometer terdeteksi</div>
                      <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ padding: '4px 8px', fontSize: '0.65rem', height: 'auto', marginTop: '6px', borderRadius: '6px' }}>
                        <RefreshCw size={10} /> Foto Ulang
                      </button>
                    </div>
                  </div>

                  {/* Temperature Field - CLEAR MANUAL EDIT WARNING */}
                  <div className="form-group">
                    <label>Suhu Alat Terdeteksi</label>
                    <div className="temp-input-wrapper">
                      <input 
                        type="number" 
                        step="0.1" 
                        placeholder="68.3" 
                        className="form-control"
                        value={formTemp}
                        onChange={(e) => setFormTemp(e.target.value)}
                        required
                      />
                      <span className="temp-unit">°C</span>
                    </div>
                    
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      💡 *Hasil Pindai di atas masih bisa diedit secara manual jika angka kurang sesuai.*
                    </span>

                    {formTemp && (
                      <div style={{ marginTop: '8px' }}>
                        <span className={`status-badge ${db.getTemperatureStatus(formTemp, settings).class}`}>
                          {db.getTemperatureStatus(formTemp, settings).label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Location Field */}
                  <div className="form-group">
                    <label>Stasiun / Lokasi</label>
                    <select 
                      className="form-control"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      required
                    >
                      <option value="" disabled>Pilih Stasiun Pengukuran</option>
                      {locations.map((loc, idx) => (
                        <option key={idx} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Officer Dropdown Selection - Locked for Operator */}
                  <div className="form-group">
                    <label>Nama Staff / Petugas</label>
                    {currentUser.role === 'Operator' ? (
                      <input 
                        type="text" 
                        className="form-control" 
                        value={currentUser.name} 
                        disabled 
                      />
                    ) : (
                      <select 
                        className="form-control"
                        value={formOfficer}
                        onChange={(e) => setFormOfficer(e.target.value)}
                        required
                      >
                        {officers.map((name, idx) => (
                          <option key={idx} value={name}>{name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Notes Field */}
                  <div className="form-group">
                    <label>Catatan Tambahan (Opsional)</label>
                    <textarea 
                      placeholder="Catat kondisi alat jika mengalami keanehan..."
                      className="form-control"
                      rows="2"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>

                <div className="upload-btn-container">
                  <button type="button" className="btn btn-secondary" onClick={() => { setCapturedImage(null); setFormTemp(''); }}>
                    Hapus
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Simpan Laporan
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ----------------- TAB: ATTENDANCE (Absensi) ----------------- */}
        {activeTab === 'attendance' && isTabVisible('attendance') && (
          <div>
            <div className="glass-card">
              <h3 className="section-title">
                <UserCheck size={16} style={{ color: '#10b981' }} />
                Absensi Petugas (Check-In / Out)
              </h3>

              <form onSubmit={handleSubmitAttendance}>
                {/* Officer Selection - LOCKED on Operator */}
                <div className="form-group">
                  <label>Nama Petugas</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={currentUser.name} 
                    disabled 
                  />
                </div>

                {/* Type Selection */}
                <div className="form-group">
                  <label>Tipe Absensi</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button 
                      type="button" 
                      className={`btn ${attType === 'Check In' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAttType('Check In')}
                      style={attType === 'Check In' ? { background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 4px 10px rgba(16,185,129,0.2)' } : {}}
                    >
                      Check In (Masuk)
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${attType === 'Check Out' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAttType('Check Out')}
                      style={attType === 'Check Out' ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', boxShadow: '0 4px 10px rgba(245,158,11,0.2)' } : {}}
                    >
                      Check Out (Keluar)
                    </button>
                  </div>
                </div>

                {/* Selfie Camera Capture */}
                <div className="form-group">
                  <label>Foto Wajah Petugas (Selfie)</label>
                  
                  {!attCameraActive && !attImage && (
                    <div style={{ border: '2px dashed var(--card-border)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                      <User size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>Ambil foto selfie stasiun kerja saat Check In / Out.</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn btn-secondary" onClick={startAttCamera} style={{ fontSize: '0.75rem', padding: '8px 12px' }}>
                          <Camera size={14} /> Buka Kamera Depan
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => attFileInputRef.current.click()} style={{ fontSize: '0.75rem', padding: '8px 12px' }}>
                          <ImageIcon size={14} /> Galeri
                        </button>
                        <input 
                          type="file" 
                          ref={attFileInputRef} 
                          style={{ display: 'none' }} 
                          accept="image/*" 
                          capture="user"
                          onChange={handleAttFileUpload} 
                        />
                      </div>
                    </div>
                  )}

                  {attCameraActive && (
                    <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid var(--card-border)' }}>
                      <video ref={attVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={captureAttPhoto}
                        style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', fontSize: '0.75rem', background: '#10b981' }}
                      >
                        <Camera size={14} /> Ambil Foto
                      </button>
                    </div>
                  )}

                  {attImage && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img src={attImage} alt="Selfie preview" style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--card-border)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Foto Terlampir</div>
                        <button type="button" className="btn btn-secondary" onClick={startAttCamera} style={{ padding: '4px 8px', fontSize: '0.65rem', height: 'auto', marginTop: '4px', borderRadius: '6px' }}>
                          <RefreshCw size={10} /> Foto Ulang
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* GPS Status Location Lock */}
                {attImage && (
                  <div className="form-group" style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>KOORDINAT LOKASI (GPS)</span>
                      <button type="button" className="btn btn-secondary" onClick={lockGeolocation} style={{ padding: '2px 8px', fontSize: '0.65rem', height: 'auto', borderRadius: '6px' }} disabled={attGpsLoading}>
                        <RefreshCw size={10} /> Lock Ulang
                      </button>
                    </div>

                    {attGpsLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
                        <span>Mendapatkan sinyal satelit GPS...</span>
                      </div>
                    )}

                    {!attGpsLoading && attGpsData && (
                      <div style={{ marginTop: '6px' }}>
                        {attGpsData.latitude ? (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#10b981' }}>GPS Terkunci Secara Akurat</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Lintang: {attGpsData.latitude.toFixed(6)}, Bujur: {attGpsData.longitude.toFixed(6)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Radius Akurasi: ±{attGpsData.accuracy} meter
                            </div>

                            {/* Fake GPS Alert indicator */}
                            {attGpsData.isFakeGps && (
                              <div className="alert-card warning" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '6px 10px', marginTop: '8px', marginBottom: 0 }}>
                                <ShieldAlert size={14} style={{ flex: 'none' }} />
                                <span>Terdeteksi kemungkinan manipulasi Fake GPS (Lokasi Tiruan)!</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '500', marginTop: '4px' }}>
                            Gagal mengunci lokasi. Pastikan GPS HP aktif.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                  disabled={!attImage || attGpsLoading}
                >
                  Kirim Absensi {attType}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- TAB: HISTORY (Riwayat) ----------------- */}
        {activeTab === 'history' && isTabVisible('history') && (
          <div>
            {/* Top Sub-Nav Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '4px', marginBottom: '14px', border: '1px solid var(--card-border)' }}>
              <button 
                className={`btn`} 
                style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.75rem', background: historySubTab === 'suhu' ? 'var(--bg-tertiary)' : 'transparent', color: historySubTab === 'suhu' ? '#fff' : 'var(--text-muted)' }}
                onClick={() => setHistorySubTab('suhu')}
              >
                <Activity size={14} style={{ marginRight: '4px', display: 'inline' }} />
                Suhu Alat ({filteredReports.length})
              </button>
              <button 
                className={`btn`} 
                style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.75rem', background: historySubTab === 'absensi' ? 'var(--bg-tertiary)' : 'transparent', color: historySubTab === 'absensi' ? '#fff' : 'var(--text-muted)' }}
                onClick={() => setHistorySubTab('absensi')}
              >
                <UserCheck size={14} style={{ marginRight: '4px', display: 'inline' }} />
                Absensi Petugas ({filteredAttendance.length})
              </button>
            </div>

            {/* Sub-Tab 1: Suhu Alat */}
            {historySubTab === 'suhu' && (
              <div>
                <div className="glass-card" style={{ padding: '14px' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Cari stasiun, petugas, suhu..."
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>LOKASI</label>
                      <select 
                        className="form-control"
                        style={{ padding: '6px 8px', fontSize: '0.75rem', marginTop: '3px' }}
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                      >
                        <option value="Semua">Semua Lokasi</option>
                        {locations.map((loc, idx) => (
                          <option key={idx} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>STATUS</label>
                      <select 
                        className="form-control"
                        style={{ padding: '6px 8px', fontSize: '0.75rem', marginTop: '3px' }}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="Semua">Semua Status</option>
                        <option value="NORMAL">NORMAL</option>
                        <option value="WARNING">WARNING</option>
                        <option value="ALERT">ALERT</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-row-between" style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Ditemukan {filteredReports.length} Laporan Suhu
                  </span>
                  <button className="btn btn-secondary" onClick={handleExportCSV} style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', borderRadius: '8px' }}>
                    <Download size={14} /> Ekspor CSV
                  </button>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="glass-card empty-state">
                    <FileText size={32} />
                    <p>Tidak ada laporan suhu ditemukan.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {filteredReports.map((r) => {
                      const status = db.getTemperatureStatus(r.temperature, settings);
                      const formattedDate = new Date(r.timestamp).toLocaleString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      return (
                        <div key={r.id} className="glass-card report-item" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setSelectedReport(r)}>
                          {r.image ? (
                            <img src={r.image} alt="Report capture" className="report-thumb" />
                          ) : (
                            <div className="report-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
                              <ImageIcon size={20} style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <div className="report-info">
                            <h4>{r.location}</h4>
                            <div className="report-meta">
                              <User size={10} /> <span>{r.officer || 'Petugas'}</span>
                              <span>•</span>
                              <Calendar size={10} /> <span>{formattedDate}</span>
                            </div>
                          </div>
                          <div className="report-value-area">
                            <span className="report-temp" style={{ color: status.color }}>
                              {r.temperature.toFixed(1)}°C
                            </span>
                            <span className={`status-badge ${status.class}`} style={{ fontSize: '0.5rem', padding: '1px 5px' }}>
                              {status.label.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 2: Absensi Petugas */}
            {historySubTab === 'absensi' && (
              <div>
                <div className="glass-card" style={{ padding: '14px' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Cari nama petugas, tipe..."
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      value={searchAttQuery}
                      onChange={(e) => setSearchAttQuery(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>PETUGAS</label>
                      <select 
                        className="form-control"
                        style={{ padding: '6px 8px', fontSize: '0.75rem', marginTop: '3px' }}
                        value={filterAttOfficer}
                        onChange={(e) => setFilterAttOfficer(e.target.value)}
                      >
                        <option value="Semua">Semua Petugas</option>
                        {officers.map((name, idx) => (
                          <option key={idx} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TIPE ABSEN</label>
                      <select 
                        className="form-control"
                        style={{ padding: '6px 8px', fontSize: '0.75rem', marginTop: '3px' }}
                        value={filterAttType}
                        onChange={(e) => setFilterAttType(e.target.value)}
                      >
                        <option value="Semua">Semua Tipe</option>
                        <option value="Check In">Check In</option>
                        <option value="Check Out">Check Out</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-row-between" style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Ditemukan {filteredAttendance.length} Riwayat Absensi
                  </span>
                  <button className="btn btn-secondary" onClick={handleExportCSV} style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', borderRadius: '8px' }}>
                    <Download size={14} /> Ekspor CSV
                  </button>
                </div>

                {filteredAttendance.length === 0 ? (
                  <div className="glass-card empty-state">
                    <UserCheck size={32} />
                    <p>Tidak ada riwayat absensi petugas ditemukan.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {filteredAttendance.map((a) => {
                      const formattedDate = new Date(a.timestamp).toLocaleString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const isCheckIn = a.type === 'Check In';
                      return (
                        <div key={a.id} className="glass-card report-item" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setSelectedAttendance(a)}>
                          <img src={a.image} alt="Selfie check" className="report-thumb" style={{ borderRadius: '50%', border: a.isFakeGps ? '2px solid var(--danger)' : '2px solid var(--card-border)' }} />
                          <div className="report-info">
                            <h4>{a.officer}</h4>
                            <div className="report-meta">
                              <Calendar size={10} /> <span>{formattedDate}</span>
                              {a.latitude && (
                                <>
                                  <span>•</span>
                                  <MapPin size={10} /> <span style={{ textDecoration: 'underline' }}>Peta</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="report-value-area">
                            <span className="status-badge" style={{ 
                              background: isCheckIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: isCheckIn ? '#10b981' : '#f59e0b',
                              border: isCheckIn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                              {a.type}
                            </span>
                            {a.isFakeGps && (
                              <span style={{ fontSize: '0.55rem', color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                                <ShieldAlert size={10} /> Fake GPS
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: SETTINGS (Pengaturan) ----------------- */}
        {activeTab === 'settings' && isTabVisible('settings') && (
          <div className="settings-list">
            
            {/* Manage Staff (Petugas) */}
            <div className="glass-card">
              <div className="flex-row-between" style={{ marginBottom: '10px' }}>
                <h3 className="section-title" style={{ marginBottom: 0 }}>
                  <User size={16} style={{ color: 'var(--primary)' }} />
                  Kelola Daftar Petugas
                </h3>
                {!showOfficerInput && (
                  <button className="btn btn-secondary" onClick={() => setShowOfficerInput(true)} style={{ padding: '4px 10px', height: 'auto', fontSize: '0.7rem', borderRadius: '6px' }}>
                    <Plus size={12} /> Tambah
                  </button>
                )}
              </div>

              {showOfficerInput && (
                <form onSubmit={handleAddOfficer} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Nama petugas baru..." 
                    className="form-control"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                    value={newOfficerName}
                    onChange={(e) => setNewOfficerName(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px', flex: 'none' }}>
                    Simpan
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowOfficerInput(false)} style={{ padding: '8px 12px', flex: 'none' }}>
                    <X size={14} />
                  </button>
                </form>
              )}

              <div className="tag-list">
                {officers.map((name, idx) => (
                  <div key={idx} className="tag-item">
                    <span>{name}</span>
                    <button className="tag-remove" onClick={() => handleDeleteOfficer(name)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Threshold Settings */}
            <form onSubmit={handleSaveSettings} className="glass-card">
              <h3 className="section-title">
                <Sliders size={16} style={{ color: 'var(--primary)' }} />
                Ambang Batas Suhu Industri
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Batas Warning (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-control"
                    value={settings.highTempAlert}
                    onChange={(e) => setSettings({ ...settings, highTempAlert: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Batas Alert (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-control"
                    value={settings.feverTempAlert}
                    onChange={(e) => setSettings({ ...settings, feverTempAlert: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Simpan Konfigurasi Suhu
              </button>
            </form>

            {/* Manage Locations */}
            <div className="glass-card">
              <div className="flex-row-between" style={{ marginBottom: '10px' }}>
                <h3 className="section-title" style={{ marginBottom: 0 }}>
                  <MapPin size={16} style={{ color: 'var(--primary)' }} />
                  Kelola Stasiun/Lokasi Alat
                </h3>
                {!showLocationInput && (
                  <button className="btn btn-secondary" onClick={() => setShowLocationInput(true)} style={{ padding: '4px 10px', height: 'auto', fontSize: '0.7rem', borderRadius: '6px' }}>
                    <Plus size={12} /> Tambah
                  </button>
                )}
              </div>

              {showLocationInput && (
                <form onSubmit={handleAddLocation} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Nama stasiun baru..." 
                    className="form-control"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px', flex: 'none' }}>
                    Simpan
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLocationInput(false)} style={{ padding: '8px 12px', flex: 'none' }}>
                    <X size={14} />
                  </button>
                </form>
              )}

              <div className="tag-list">
                {locations.map((loc, idx) => (
                  <div key={idx} className="tag-item">
                    <span>{loc}</span>
                    <button className="tag-remove" onClick={() => handleDeleteLocation(loc)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zones */}
            <div className="glass-card" style={{ borderColor: 'rgba(239, 68, 68, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 className="section-title" style={{ color: 'var(--danger)', marginBottom: 0 }}>
                Zona Bahaya (Hapus Data)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Tindakan di bawah ini bersifat permanen. Harap ekspor CSV terlebih dahulu untuk backup data.
              </p>
              <button className="btn btn-secondary" onClick={handleResetData} style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <Trash2 size={16} /> Hapus Semua Laporan Suhu
              </button>
              <button className="btn btn-secondary" onClick={handleResetAttendance} style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <Trash2 size={16} /> Hapus Semua Data Absensi
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ----------------- SUHU DETAIL MODAL ----------------- */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Detail Laporan Suhu Alat</h3>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {selectedReport.id}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedReport.image ? (
                <div style={{ width: '100%', background: '#000', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                  <img src={selectedReport.image} alt="Report detail" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '140px', background: 'var(--bg-tertiary)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
                  <ImageIcon size={32} />
                  <span style={{ fontSize: '0.75rem', marginTop: '6px' }}>Tidak ada foto terlampir</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="glass-card" style={{ padding: '12px', marginBottom: 0 }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>SUHU ALAT</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: db.getTemperatureStatus(selectedReport.temperature, settings).color }}>
                    {selectedReport.temperature.toFixed(1)}°C
                  </span>
                </div>
                <div className="glass-card" style={{ padding: '12px', marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>STATUS ALAT</span>
                  <div>
                    <span className={`status-badge ${db.getTemperatureStatus(selectedReport.temperature, settings).class}`}>
                      {db.getTemperatureStatus(selectedReport.temperature, settings).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '16px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>LOKASI ALAT</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{selectedReport.location}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <User size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>PETUGAS PENGUKUR</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{selectedReport.officer || 'Anonim'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Calendar size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>WAKTU PENGUKURAN</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {new Date(selectedReport.timestamp).toLocaleString('id-ID', {
                        dateStyle: 'long',
                        timeStyle: 'medium'
                      })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <FileText size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>CATATAN</span>
                    <span style={{ fontSize: '0.85rem', color: selectedReport.notes ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {selectedReport.notes || 'Tidak ada catatan.'}
                    </span>
                  </div>
                </div>
              </div>

              {currentUser.role !== 'Operator' && (
                <button className="btn btn-secondary" onClick={() => handleDeleteReport(selectedReport.id)} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', marginTop: '8px' }}>
                  <Trash2 size={16} /> Hapus Laporan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- ATTENDANCE DETAIL MODAL ----------------- */}
      {selectedAttendance && (
        <div className="modal-overlay" onClick={() => setSelectedAttendance(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Detail Absensi Petugas</h3>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {selectedAttendance.id}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedAttendance(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '100%', background: '#000', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                <img src={selectedAttendance.image} alt="Selfie attendance" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="glass-card" style={{ padding: '12px', marginBottom: 0 }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>NAMA PETUGAS</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedAttendance.officer}</span>
                </div>
                <div className="glass-card" style={{ padding: '12px', marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>TIPE ABSEN</span>
                  <div>
                    <span className="status-badge" style={{ 
                      background: selectedAttendance.type === 'Check In' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: selectedAttendance.type === 'Check In' ? '#10b981' : '#f59e0b',
                      border: selectedAttendance.type === 'Check In' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                      {selectedAttendance.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fake GPS Alert indicator */}
              {selectedAttendance.isFakeGps && (
                <div className="alert-card warning" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 0 }}>
                  <ShieldAlert size={18} style={{ flex: 'none' }} />
                  <div>
                    <strong style={{ display: 'block' }}>Kecurigaan Manipulasi Lokasi!</strong>
                    <span>Absensi ini dicurigai menggunakan Fake GPS berdasarkan pengecekan browser.</span>
                  </div>
                </div>
              )}

              <div className="glass-card" style={{ padding: '16px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Calendar size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>WAKTU ABSENSI</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {new Date(selectedAttendance.timestamp).toLocaleString('id-ID', {
                        dateStyle: 'long',
                        timeStyle: 'medium'
                      })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>KOORDINAT GPS</span>
                    {selectedAttendance.latitude ? (
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>
                          Lat: {selectedAttendance.latitude.toFixed(6)}, Lon: {selectedAttendance.longitude.toFixed(6)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                          Akurasi GPS: ±{selectedAttendance.gpsAccuracy} meter
                        </span>
                        
                        <a 
                          href={`https://www.google.com/maps?q=${selectedAttendance.latitude},${selectedAttendance.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 'bold' }}
                        >
                          Lihat Lokasi di Google Maps
                        </a>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tidak ada data GPS.</span>
                    )}
                  </div>
                </div>
              </div>

              {currentUser.role !== 'Operator' && (
                <button className="btn btn-secondary" onClick={() => handleDeleteAttendance(selectedAttendance.id)} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', marginTop: '8px' }}>
                  <Trash2 size={16} /> Hapus Absensi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Conditional Items based on Role) */}
      <nav className="bottom-nav">
        {isTabVisible('dashboard') && (
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); stopCamera(); stopAttCamera(); }}>
            <Activity />
            <span>Dashboard</span>
          </div>
        )}
        
        {isTabVisible('scan') && (
          <div className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => { setActiveTab('scan'); startCamera(); stopAttCamera(); }}>
            <Camera />
            <span>Pindai Suhu</span>
          </div>
        )}

        {isTabVisible('attendance') && (
          <div className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); startAttCamera(); stopCamera(); }}>
            <UserCheck />
            <span>Absensi</span>
          </div>
        )}
        
        {isTabVisible('history') && (
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); stopCamera(); stopAttCamera(); }}>
            <Calendar />
            <span>Riwayat</span>
          </div>
        )}
        
        {isTabVisible('settings') && (
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); stopCamera(); stopAttCamera(); }}>
            <SettingsIcon />
            <span>Pengaturan</span>
          </div>
        )}
      </nav>
    </div>
  );
}
