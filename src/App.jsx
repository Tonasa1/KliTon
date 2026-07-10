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
  Lock,
  ClipboardList,
  FlaskConical,
  CheckSquare
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { db } from './utils/db';

// Helper function to convert canvas to grayscale and high-contrast for better OCR
const preprocessImage = (canvas) => {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Grayscale + High Contrast filter
  const contrast = 120; // 0 to 255
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Grayscale conversion
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Apply contrast
    let val = factor * (gray - 128) + 128;
    
    // Clamp to [0, 255]
    val = Math.max(0, Math.min(255, val));
    
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);
};

// Haversine Formula for Geofencing
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d; // Distance in meters
};

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
  const [attNotes, setAttNotes] = useState('');
  
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

  // History Date Range Filter
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [showOfficerInput, setShowOfficerInput] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');

  // Cloud Sync States
  const [cloudUrl, setCloudUrl] = useState('');
  const [cloudKey, setCloudKey] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  // Jobdesk Selection State
  const [selectedJobdesk, setSelectedJobdesk] = useState('suhu'); // 'suhu' | 'inspeksi' | 'analis'

  // Activity States (Inspeksi & Analis)
  const [activities, setActivities] = useState([]);
  const [actImage, setActImage] = useState(null);
  const [actCameraActive, setActCameraActive] = useState(false);
  const [actFormDescription, setActFormDescription] = useState('');
  const [actFormNotes, setActFormNotes] = useState('');
  const [actFormLocation, setActFormLocation] = useState('');
  const [actFormOfficer, setActFormOfficer] = useState('');
  const [actLocations, setActLocations] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [historyActSubTab, setHistoryActSubTab] = useState('kegiatan'); // 'kegiatan' | 'absensi'
  const [searchActQuery, setSearchActQuery] = useState('');
  const [filterActLocation, setFilterActLocation] = useState('Semua');
  const [settingManageJobdesk, setSettingManageJobdesk] = useState('suhu');
  const [settingLocations, setSettingLocations] = useState([]);

  // Users management states
  const [users, setUsers] = useState([]);
  const [newOfficerJobdesk, setNewOfficerJobdesk] = useState('suhu');
  const [newOfficerRole, setNewOfficerRole] = useState('Operator');
  const [newOfficerPassword, setNewOfficerPassword] = useState('operator123');
  
  // Password profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileOldPassword, setProfileOldPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');

  // Password reset admin modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Approval tab states
  const [approvalFilter, setApprovalFilter] = useState('Semua'); // 'Semua' | 'Pending SPV' | 'Pending Manager'

  // Refs
  const videoRef = useRef(null);
  const attVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const attCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const attFileInputRef = useRef(null);
  const streamRef = useRef(null);
  const attStreamRef = useRef(null);
  const actVideoRef = useRef(null);
  const actCanvasRef = useRef(null);
  const actFileInputRef = useRef(null);
  const actStreamRef = useRef(null);

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
    
    const dbUsers = db.getUsers();
    setUsers(dbUsers);
    
    const savedSettings = db.getSettings();
    setSettings(savedSettings);
    setActivities(db.getActivities());
    
    // Set default values from db
    if (dbOfficers.length > 0) {
      setLoginUsername(dbOfficers[0]);
    }
    
    const locs = db.getLocations();
    if (locs.length > 0) {
      setFormLocation(locs[0]);
    }

    // Load and trigger Supabase Sync
    const config = db.getSupabaseConfig();
    setCloudUrl(config.url);
    setCloudKey(config.key);
    if (config.url && config.key) {
      setSyncLoading(true);
      db.syncWithCloud().then(res => {
        if (res) {
          setReports(res.reports);
          setAttendance(res.attendance);
          if (res.activities) setActivities(res.activities);
          setUsers(db.getUsers());
          showToast("Data tersinkronisasi otomatis dengan Cloud DB.", "success");
        }
      }).catch(err => {
        console.error("Auto sync failed:", err);
      }).finally(() => {
        setSyncLoading(false);
      });
    }
  }, []);

  // Auto-refresh dari cloud setiap 30 detik
  useEffect(() => {
    const config = db.getSupabaseConfig();
    if (!config.url || !config.key) return;
    const interval = setInterval(async () => {
      try {
        const res = await db.syncWithCloud();
        if (res) {
          setReports(res.reports);
          setAttendance(res.attendance);
          if (res.activities) setActivities(res.activities);
          setUsers(db.getUsers());
        }
      } catch (e) {
        // silent fail for background sync
      }
    }, 30000); // setiap 30 detik
    return () => clearInterval(interval);
  }, []);


  // Update default login usernames based on role and jobdesk
  useEffect(() => {
    if (loginRole === 'Administrator') {
      setLoginUsername('admin');
    } else if (loginRole === 'Manager') {
      setLoginUsername('manager1');
    } else if (loginRole === 'Supervisor') {
      if (selectedJobdesk === 'analis') {
        setLoginUsername('supervisor1');
      } else {
        setLoginUsername('supervisor');
      }
    } else if (loginRole === 'Operator') {
      const allowedUsers = users.filter(u => u.role === 'Operator' && u.jobdesk === selectedJobdesk);
      if (allowedUsers.length > 0) {
        setLoginUsername(allowedUsers[0].username);
      } else {
        setLoginUsername('');
      }
    }
    setLoginPassword('');
  }, [loginRole, selectedJobdesk, users]);

  // Sync form officers with logged-in user if they are Operator
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Operator') {
        setFormOfficer(currentUser.name);
        setAttOfficer(currentUser.name);
        setActFormOfficer(currentUser.name);
      } else {
        const dbOfficers = db.getOfficers();
        if (dbOfficers.length > 0) {
          setFormOfficer(dbOfficers[0]);
          setAttOfficer(dbOfficers[0]);
          setActFormOfficer(dbOfficers[0]);
        }
      }
    }
  }, [currentUser]);

  // Load locations based on jobdesk
  useEffect(() => {
    if (currentUser) {
      const jd = currentUser.jobdesk || 'suhu';
      if (jd === 'inspeksi' || jd === 'analis') {
        setActLocations(db.getLocationsByJobdesk(jd));
        const locs = db.getLocationsByJobdesk(jd);
        if (locs.length > 0) setActFormLocation(locs[0]);
      } else {
        // Operator suhu: gunakan lokasi suhu untuk kegiatan
        const locs = db.getLocationsByJobdesk('suhu');
        setActLocations(locs);
        if (locs.length > 0) setActFormLocation(locs[0]);
      }
    }
  }, [currentUser]);

  // Sync settingLocations when settingManageJobdesk changes
  useEffect(() => {
    setSettingLocations(db.getLocationsByJobdesk(settingManageJobdesk));
  }, [settingManageJobdesk, currentUser]);

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

    const session = db.login(loginRole, loginUsername, loginPassword, selectedJobdesk);
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
      stopActCamera();
      setCapturedImage(null);
      setAttImage(null);
      setAttGpsData(null);
      setAttNotes('');
      setActImage(null);
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
    
    const videoWidth = video.videoWidth || video.clientWidth || 640;
    const videoHeight = video.videoHeight || video.clientHeight || 480;
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
    const originalCroppedDataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);
    
    // Create OCR preprocessed image
    const ocrCanvas = document.createElement('canvas');
    ocrCanvas.width = cropW;
    ocrCanvas.height = cropH;
    const ocrCtx = ocrCanvas.getContext('2d');
    ocrCtx.drawImage(cropCanvas, 0, 0);
    preprocessImage(ocrCanvas);
    const ocrDataUrl = ocrCanvas.toDataURL('image/jpeg', 0.9);
    
    setCapturedImage(originalCroppedDataUrl);
    stopCamera();
    runOCR(ocrDataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        setCapturedImage(dataUrl);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        preprocessImage(tempCanvas);
        
        runOCR(tempCanvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = dataUrl;
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // --- CAMERA MANAGEMENT (Absensi) ---
  const startAttCamera = async () => {
    setAttImage(null);
    lockGeolocation();
    try {
      setAttCameraActive(true);
      setTimeout(async () => {
        if (!attVideoRef.current) return;
        const constraints = {
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        attStreamRef.current = stream;
        attVideoRef.current.srcObject = stream;
        await attVideoRef.current.play();
      }, 600); // Delay diperbesar agar elemen video sudah ter-mount
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

  // --- CAMERA MANAGEMENT (Kegiatan/Activity) ---
  const startActCamera = async () => {
    setActImage(null);
    try {
      setActCameraActive(true);
      setTimeout(async () => {
        if (!actVideoRef.current) return;
        const constraints = {
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        actStreamRef.current = stream;
        actVideoRef.current.srcObject = stream;
        await actVideoRef.current.play();
      }, 600); // Delay diperbesar agar elemen video sudah ter-mount
    } catch (err) {
      console.error("Activity camera error:", err);
      showToast("Gagal mengakses kamera.", "error");
      setActCameraActive(false);
    }
  };

  const stopActCamera = () => {
    if (actStreamRef.current) {
      actStreamRef.current.getTracks().forEach(track => track.stop());
      actStreamRef.current = null;
    }
    if (actVideoRef.current) {
      actVideoRef.current.srcObject = null;
    }
    setActCameraActive(false);
  };

  const captureActPhoto = () => {
    if (!actVideoRef.current || !actCanvasRef.current) return;
    const video = actVideoRef.current;
    const canvas = actCanvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    setActImage(dataUrl);
    stopActCamera();
  };

  const handleActFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setActImage(event.target.result);
      stopActCamera();
    };
    reader.readAsDataURL(file);
  };

  // Watermark helper to draw Timemark information on captured or uploaded photos
  const watermarkImage = async (imgElement, width, height) => {
    const canvas = attCanvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imgElement, 0, 0, width, height);
    
    setAttGpsLoading(true);
    
    // Time & Date details
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dayStr = now.toLocaleDateString('id-ID', { weekday: 'long' });
    
    // Reverse Geocoding Address from current GPS coordinates
    let addressText = '';
    const currentGps = attGpsData;
    
    if (currentGps && currentGps.latitude) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000); // 2-second timeout
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentGps.latitude}&lon=${currentGps.longitude}&zoom=18&addressdetails=1`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'id', 'User-Agent': 'KliTonApp/1.0' }
        });
        clearTimeout(id);
        const data = await res.json();
        if (data && data.address) {
          const parts = [
            data.address.road || data.address.village || data.address.suburb || '',
            data.address.district || data.address.city_district || '',
            data.address.city || data.address.regency || ''
          ].filter(Boolean);
          addressText = parts.join(', ');
        }
      } catch (e) {
        console.error("Reverse geocoding failed, falling back to coords:", e);
      }
    }
    
    if (!addressText && currentGps && currentGps.latitude) {
      addressText = `Lat: ${parseFloat(currentGps.latitude).toFixed(6)}, Lon: ${parseFloat(currentGps.longitude).toFixed(6)} (Akurasi: ±${currentGps.accuracy}m)`;
    } else if (!addressText) {
      addressText = 'Lokasi GPS tidak aktif / tidak terkunci';
    }
    
    // Draw Dark banner background overlay at the bottom
    const bannerH = Math.round(height * 0.22);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, height - bannerH, width, bannerH);
    
    // Font setup
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    
    // Time Text
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(timeStr, 20, height - bannerH + 12);
    
    // Date & Day Text
    ctx.font = '13px sans-serif';
    ctx.fillText(`|  ${dateStr}  |  ${dayStr}`, 125, height - bannerH + 24);
    
    // Wrapped Address/GPS coordinates
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    
    const wrapText = (text, x, y, maxWidth, lineHeight) => {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    };
    
    wrapText(addressText, 20, height - bannerH + 52, width - 40, 15);
    
    // Watermark tag top right
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText('KliTon Timemark Verified', width - 150, 12);
    
    setAttGpsLoading(false);
    return canvas.toDataURL('image/jpeg', 0.5);
  };

  const captureAttPhoto = async () => {
    if (!attVideoRef.current) return;
    const video = attVideoRef.current;
    
    try {
      const vW = video.videoWidth || video.clientWidth || 640;
      const vH = video.videoHeight || video.clientHeight || 480;
      const base64 = await watermarkImage(video, vW, vH);
      if (base64) {
        setAttImage(base64);
      }
    } catch (e) {
      console.error("Error capturing/watermarking photo:", e);
      showToast("Gagal mengambil foto. Silakan coba lagi.", "error");
    } finally {
      stopAttCamera();
    }
  };

  const handleAttFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();
      img.onload = async () => {
        const base64 = await watermarkImage(img, img.width, img.height);
        if (base64) {
          setAttImage(base64);
        }
      };
      img.src = dataUrl;
      stopAttCamera();
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
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
    );
  };

  // --- OCR ENGINE ---
  const runOCR = async (imageSrc) => {
    setOcrProgress(0);
    setOcrStatusText('Menyiapkan Mesin OCR...');
    let worker = null;
    try {
      const { createWorker } = await import('tesseract.js');
      worker = await createWorker('eng');
      
      // Limit OCR to only allow digits and decimal separators
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789., ',
      });
      
      setOcrStatusText('Memindai Gambar...');
      setOcrProgress(50);
      
      const { data: { text } } = await worker.recognize(imageSrc);
      console.log("OCR Raw Whitelisted Text:", text);
      
      const detectedTemp = parseTemperatureText(text);
      
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
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  };

  const parseTemperatureText = (text) => {
    if (!text) return '';
    
    // Replace commas with dots and strip whitespaces/newlines
    let cleaned = text.replace(/,/g, '.').replace(/[\r\n\s]+/g, '');
    
    // 1. Try finding decimal numbers (e.g. 28.3)
    const decimalMatch = cleaned.match(/(\d+)[\.](\d)/);
    if (decimalMatch) {
      return `${decimalMatch[1]}.${decimalMatch[2]}`;
    }
    
    // 2. Fallback: If no decimal point found, but a string of digits (e.g. 283 -> 28.3)
    const digitMatch = cleaned.match(/(\d+)/);
    if (digitMatch) {
      const digits = digitMatch[1];
      if (digits.length >= 3) {
        const integerPart = digits.slice(0, -1);
        const decimalPart = digits.slice(-1);
        return `${integerPart}.${decimalPart}`;
      } else if (digits.length === 2) {
        return `${digits}.0`;
      }
      return `${digits}.0`;
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

    let attJobdesk = currentUser.jobdesk || 'suhu';
    if (currentUser.role !== 'Operator') {
      const u = users.find(user => user.username === attOfficer);
      if (u && u.jobdesk) attJobdesk = u.jobdesk;
    }

    const isApprovalRequired = ['Sakit', 'Izin', 'Cuti'].includes(attType);

    const newAttendance = {
      officer: currentUser.role === 'Operator' ? currentUser.name : attOfficer,
      jobdesk: attJobdesk,
      type: attType,
      image: attImage,
      latitude: attGpsData ? attGpsData.latitude : null,
      longitude: attGpsData ? attGpsData.longitude : null,
      gpsAccuracy: attGpsData ? attGpsData.accuracy : null,
      isFakeGps: attGpsData ? attGpsData.isFakeGps : false,
      notes: isApprovalRequired ? attNotes : '',
      status: isApprovalRequired ? 'Pending SPV' : 'Disetujui',
      spvApproval: null,
      managerApproval: null
    };

    const saved = db.saveAttendance(newAttendance);
    if (saved) {
      showToast(`Absensi ${attType} berhasil disimpan!`, "success");
      setAttendance(db.getAttendance());
      setAttImage(null);
      setAttGpsData(null);
      setAttNotes('');
      setHistorySubTab('absensi');
      setActiveTab('history');
    } else {
      showToast("Gagal menyimpan absensi.", "error");
    }
  };

  // --- ACTIVITY SUBMISSION ---
  const handleSubmitActivity = (e) => {
    e.preventDefault();
    if (!actImage) {
      showToast("Harap ambil atau unggah foto kegiatan!", "error");
      return;
    }
    if (!actFormDescription.trim()) {
      showToast("Harap isi keterangan kegiatan!", "error");
      return;
    }
    const newActivity = {
      jobdesk: currentUser.jobdesk,
      officer: currentUser.role === 'Operator' ? currentUser.name : actFormOfficer,
      location: actFormLocation,
      description: actFormDescription,
      notes: actFormNotes,
      image: actImage
    };
    const saved = db.saveActivity(newActivity);
    if (saved) {
      showToast("Laporan kegiatan berhasil disimpan!", "success");
      setActivities(db.getActivities());
      setActImage(null);
      setActFormDescription('');
      setActFormNotes('');
      setHistoryActSubTab('kegiatan');
      setActiveTab('history');
    } else {
      showToast("Gagal menyimpan laporan kegiatan.", "error");
    }
  };

  const handleDeleteActivity = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) {
      db.deleteActivity(id);
      setActivities(db.getActivities());
      showToast("Kegiatan berhasil dihapus.", "success");
      setSelectedActivity(null);
    }
  };

  const handleResetActivities = () => {
    if (window.confirm("PERINGATAN: Semua data kegiatan akan DIHAPUS PERMANEN. Lanjutkan?")) {
      db.clearAllActivities();
      setActivities([]);
      showToast("Seluruh data kegiatan telah dikosongkan.", "success");
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

  // --- CLOUD SYNC MANAGEMENT (SUPABASE) ---
  const handleSaveSupabaseConfig = async (e) => {
    e.preventDefault();
    setSyncLoading(true);
    const success = await db.testSupabaseConnection(cloudUrl, cloudKey);
    if (success) {
      db.saveSupabaseConfig(cloudUrl, cloudKey);
      showToast("Koneksi Supabase Cloud berhasil disimpan!", "success");
      
      // Trigger sync immediately!
      try {
        const res = await db.syncWithCloud();
        if (res) {
          setReports(res.reports);
          setAttendance(res.attendance);
          setUsers(db.getUsers()); // Update users state
          showToast("Sinkronisasi data awal berhasil!", "success");
        }
      } catch (err) {
        showToast("Gagal melakukan sinkronisasi data awal.", "error");
      }
    } else {
      showToast("Koneksi Supabase gagal. Periksa kembali URL dan API Key Anda.", "error");
    }
    setSyncLoading(false);
  };

  const handleManualSync = async () => {
    if (!cloudUrl || !cloudKey) {
      showToast("Harap konfigurasi cloud database terlebih dahulu!", "error");
      return;
    }
    setSyncLoading(true);
    try {
      const res = await db.syncWithCloud();
      if (res) {
        setReports(res.reports);
        setAttendance(res.attendance);
        setUsers(db.getUsers()); // Update users state
        showToast("Sinkronisasi cloud berhasil diselesaikan!", "success");
      } else {
        showToast("Koneksi cloud belum dikonfigurasi.", "error");
      }
    } catch (err) {
      showToast("Gagal melakukan sinkronisasi. Periksa koneksi internet.", "error");
    } finally {
      setSyncLoading(false);
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
      const success = db.saveLocationByJobdesk(settingManageJobdesk, newLocationName);
      if (success) {
        setSettingLocations(db.getLocationsByJobdesk(settingManageJobdesk));
        if (settingManageJobdesk === 'suhu') {
          setLocations(db.getLocationsByJobdesk('suhu'));
        } else {
          setActLocations(db.getLocationsByJobdesk(settingManageJobdesk));
        }
        setNewLocationName('');
        setShowLocationInput(false);
        showToast("Lokasi baru ditambahkan!", "success");
      } else {
        showToast("Lokasi sudah ada atau tidak valid.", "error");
      }
    }
  };

  const handleDeleteLocation = (loc) => {
    if (settingLocations.length <= 1) {
      showToast("Minimal harus menyisakan 1 lokasi.", "error");
      return;
    }
    db.deleteLocationByJobdesk(settingManageJobdesk, loc);
    setSettingLocations(db.getLocationsByJobdesk(settingManageJobdesk));
    if (settingManageJobdesk === 'suhu') {
      setLocations(db.getLocationsByJobdesk('suhu'));
    } else {
      setActLocations(db.getLocationsByJobdesk(settingManageJobdesk));
    }
    showToast("Lokasi berhasil dihapus.", "success");
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (newOfficerName.trim()) {
      const userObj = {
        username: newOfficerName.trim(),
        role: newOfficerRole,
        password: newOfficerPassword,
        jobdesk: (newOfficerRole === 'Operator' || newOfficerRole === 'Supervisor') ? newOfficerJobdesk : 'suhu'
      };
      
      const success = db.saveUser(userObj);
      if (success) {
        const updatedUsers = db.getUsers();
        setUsers(updatedUsers);
        setOfficers(db.getOfficers());
        setNewOfficerName('');
        setNewOfficerPassword('operator123');
        setShowOfficerInput(false);
        showToast("Pengguna baru berhasil ditambahkan!", "success");
      } else {
        showToast("Username sudah terdaftar.", "error");
      }
    }
  };

  const handleDeleteUser = (username) => {
    if (username.toLowerCase() === 'admin') {
      showToast("Tidak dapat menghapus akun Administrator utama.", "error");
      return;
    }
    db.deleteUser(username);
    const updatedUsers = db.getUsers();
    setUsers(updatedUsers);
    setOfficers(db.getOfficers());
    showToast("Pengguna berhasil dihapus.", "success");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (profileNewPassword !== profileConfirmPassword) {
      showToast("Sandi baru dan konfirmasi tidak cocok.", "error");
      return;
    }
    const success = db.changePassword(currentUser.name, profileOldPassword, profileNewPassword);
    if (success) {
      showToast("Kata sandi berhasil diubah!", "success");
      setShowProfileModal(false);
      setProfileOldPassword('');
      setProfileNewPassword('');
      setProfileConfirmPassword('');
    } else {
      showToast("Sandi lama salah atau akun tidak ditemukan.", "error");
    }
  };

  const handleResetPasswordAdmin = (e) => {
    e.preventDefault();
    const success = db.resetPassword(resetUsername, resetNewPassword);
    if (success) {
      showToast(`Sandi untuk ${resetUsername} berhasil direset!`, "success");
      setShowResetModal(false);
      setResetUsername('');
      setResetNewPassword('');
      setUsers(db.getUsers());
    } else {
      showToast("Gagal mereset sandi.", "error");
    }
  };

  const handleApproveAttendance = (id, status) => {
    const approverName = currentUser.name;
    const role = currentUser.role;
    const res = db.updateAttendanceStatus(id, status, approverName, role);
    if (res) {
      setAttendance(db.getAttendance());
      showToast(`Absensi berhasil ${status.includes('Ditolak') ? 'ditolak' : 'disetujui'}!`, "success");
    } else {
      showToast("Gagal memproses persetujuan.", "error");
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
    // Role-based filter: Operator only sees their own reports
    if (currentUser && currentUser.role === 'Operator') {
      if (r.officer !== currentUser.name) return false;
    }
    
    const matchLocation = filterLocation === 'Semua' || r.location === filterLocation;
    const statusObj = db.getTemperatureStatus(r.temperature, settings);
    const matchStatus = filterStatus === 'Semua' || statusObj.label.includes(filterStatus);
    
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      r.location.toLowerCase().includes(term) ||
      (r.officer && r.officer.toLowerCase().includes(term)) ||
      r.temperature.toString().includes(term) ||
      (r.notes && r.notes.toLowerCase().includes(term));
      
    // Date filter
    const itemDate = new Date(r.timestamp);
    const afterStart = historyStartDate ? itemDate >= new Date(historyStartDate) : true;
    const beforeEnd = historyEndDate ? itemDate <= new Date(historyEndDate + 'T23:59:59') : true;

    return matchLocation && matchStatus && matchSearch && afterStart && beforeEnd;
  });

  const filteredAttendance = attendance.filter(a => {
    // Role-based filter
    if (currentUser) {
      if (currentUser.role === 'Operator') {
        if (a.officer !== currentUser.name) return false;
      } else if (currentUser.role === 'Supervisor' && currentUser.name !== 'supervisor') {
        // SPV specific jobdesk
        if (a.jobdesk !== currentUser.jobdesk) return false;
      }
    }
    
    const matchOfficer = filterAttOfficer === 'Semua' || a.officer === filterAttOfficer;
    const matchType = filterAttType === 'Semua' || a.type === filterAttType;

    const term = searchAttQuery.toLowerCase();
    const matchSearch = 
      a.officer.toLowerCase().includes(term) ||
      a.type.toLowerCase().includes(term) ||
      (a.isFakeGps ? 'fake' : '').includes(term);

    // Date filter
    const itemDate = new Date(a.timestamp);
    const afterStart = historyStartDate ? itemDate >= new Date(historyStartDate) : true;
    const beforeEnd = historyEndDate ? itemDate <= new Date(historyEndDate + 'T23:59:59') : true;

    return matchOfficer && matchType && matchSearch && afterStart && beforeEnd;
  });

  const filteredActivities = activities.filter(a => {
    // Role-based filter: Operator only sees their own activities
    if (currentUser && currentUser.role === 'Operator') {
      if (a.officer !== currentUser.name) return false;
    }
    // Jobdesk filter
    if (currentUser && currentUser.jobdesk) {
      if (a.jobdesk !== currentUser.jobdesk) return false;
    }
    const matchLocation = filterActLocation === 'Semua' || a.location === filterActLocation;
    const term = searchActQuery.toLowerCase();
    const matchSearch = 
      (a.officer && a.officer.toLowerCase().includes(term)) ||
      (a.location && a.location.toLowerCase().includes(term)) ||
      (a.description && a.description.toLowerCase().includes(term)) ||
      (a.notes && a.notes.toLowerCase().includes(term));
      
    // Date filter
    const itemDate = new Date(a.timestamp);
    const afterStart = historyStartDate ? itemDate >= new Date(historyStartDate) : true;
    const beforeEnd = historyEndDate ? itemDate <= new Date(historyEndDate + 'T23:59:59') : true;
      
    return matchLocation && matchSearch && afterStart && beforeEnd;
  });

  const getStats = () => {
    const todayStr = new Date().toDateString();
    
    // Filter reports based on Operator name first
    const visibleReports = reports.filter(r => {
      if (currentUser && currentUser.role === 'Operator') {
        return r.officer === currentUser.name;
      }
      return true;
    });
    
    const todayReports = visibleReports.filter(r => new Date(r.timestamp).toDateString() === todayStr);
    
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
      allTimeTotal: visibleReports.length
    };
  };

  const stats = getStats();

  const handleDownloadChart = async () => {
    const chartElem = document.getElementById('dashboard-chart');
    if (!chartElem) return;
    try {
      const canvas = await html2canvas(chartElem, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Grafik_Suhu_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (e) {
      console.error('Failed to download chart:', e);
    }
  };

  const renderDashboardChart = () => {
    // Filter reports based on Operator name first
    const visibleReports = reports.filter(r => {
      if (currentUser && currentUser.role === 'Operator') {
        return r.officer === currentUser.name;
      }
      return true;
    });

    const chartData = [...visibleReports]
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
    const maxTemp = Math.ceil(Math.max(...temps, settings.highTempAlert)) + 5;
    const tempRange = maxTemp - minTemp;

    const points = chartData.map((d, index) => {
      const x = paddingX + (index * (width - paddingX * 2) / (chartData.length - 1));
      const y = height - paddingY - ((d.temperature - minTemp) * (height - paddingY * 2) / tempRange);
      return { x, y, temp: d.temperature, time: new Date(d.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaData = `${pathData} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    const warningY = height - paddingY - ((settings.highTempAlert - minTemp) * (height - paddingY * 2) / tempRange);

    return (
      <div style={{ position: 'relative' }}>
        <button 
          onClick={handleDownloadChart}
          className="btn btn-secondary" 
          style={{ position: 'absolute', top: '-30px', right: '0', padding: '4px 8px', fontSize: '0.65rem' }}
          title="Unduh Grafik"
        >
          <Download size={14} style={{ marginRight: '4px' }} /> Unduh (.png)
        </button>
        <div className="chart-container" id="dashboard-chart" style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '14px' }}>
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
            
            {/* Standard Warning Line */}
            {warningY >= paddingY && warningY <= height - paddingY && (
              <g>
                <line x1={paddingX} y1={warningY} x2={width - paddingX} y2={warningY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,4" />
                <text x={paddingX - 5} y={warningY + 3} textAnchor="end" fill="#f59e0b" fontSize="8" fontWeight="bold">Batas</text>
              </g>
            )}

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
      </div>
    );
  };

  // --- ROLE TAB FILTER HELPER ---
  const isTabVisible = (tabName) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    const jobdesk = currentUser.jobdesk || 'suhu';
    
    if (tabName === 'dashboard' || tabName === 'history') return true;
    if (tabName === 'scan') return jobdesk === 'suhu' && (role === 'Operator' || role === 'Supervisor' || role === 'Administrator');
    // Kegiatan: semua Operator & Supervisor, BUKAN Administrator
    if (tabName === 'activity') return role === 'Operator' || role === 'Supervisor';
    if (tabName === 'attendance') return role === 'Operator';
    if (tabName === 'settings') return role === 'Administrator';
    // Approval: hanya Supervisor & Manager
    if (tabName === 'approval') return role === 'Supervisor' || role === 'Manager';
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
                <option value="Manager">Manager</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>

            {/* Jobdesk Choice */}
            <div className="form-group">
              <label>Pilih Jobdesk</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '6px' }}>
                {[
                  { value: 'suhu', label: 'Suhu', icon: '🌡️', desc: 'Pemantauan suhu' },
                  { value: 'inspeksi', label: 'Inspeksi', icon: '🔍', desc: 'Kegiatan inspeksi' },
                  { value: 'analis', label: 'Analis', icon: '🧪', desc: 'Kegiatan analis' }
                ].map(jd => (
                  <div 
                    key={jd.value}
                    onClick={() => setSelectedJobdesk(jd.value)}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: selectedJobdesk === jd.value ? '2px solid var(--primary)' : '2px solid var(--card-border)',
                      background: selectedJobdesk === jd.value ? 'rgba(99,102,241,0.1)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{jd.icon}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: selectedJobdesk === jd.value ? 'var(--primary)' : 'var(--text-primary)' }}>{jd.label}</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '2px' }}>{jd.desc}</div>
                  </div>
                ))}
              </div>
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
                  <option value="" disabled>Pilih Nama Operator</option>
                  {users.filter(u => u.role === 'Operator' && u.jobdesk === selectedJobdesk).map((u, idx) => (
                    <option key={idx} value={u.username}>{u.username}</option>
                  ))}
                </select>
              ) : loginRole === 'Supervisor' ? (
                <select 
                  className="form-control"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                >
                  <option value="" disabled>Pilih Supervisor</option>
                  {users.filter(u => u.role === 'Supervisor' && (u.jobdesk === selectedJobdesk || u.username === 'supervisor')).map((u, idx) => (
                    <option key={idx} value={u.username}>{u.username} {u.username !== 'supervisor' ? `(${u.jobdesk})` : '(General)'}</option>
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
            <span>{currentUser.name} • {(currentUser.jobdesk || 'suhu').charAt(0).toUpperCase() + (currentUser.jobdesk || 'suhu').slice(1)}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="status-badge normal" style={{ fontSize: '0.65rem', padding: '2px 8px', textTransform: 'uppercase' }}>
            {currentUser.role}
          </div>
          <button className="modal-close" onClick={() => setShowProfileModal(true)} title="Ganti Sandi" style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <User size={14} />
          </button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <button
                  onClick={async () => {
                    const config = db.getSupabaseConfig();
                    if (!config.url || !config.key) { showToast('Cloud belum dikonfigurasi.', 'error'); return; }
                    setSyncLoading(true);
                    try {
                      const res = await db.syncWithCloud();
                      if (res) {
                        setReports(res.reports);
                        setAttendance(res.attendance);
                        if (res.activities) setActivities(res.activities);
                        setUsers(db.getUsers());
                        showToast('Data berhasil diperbarui dari Cloud!', 'success');
                      }
                    } catch(e) {
                      showToast('Gagal refresh data.', 'error');
                    } finally {
                      setSyncLoading(false);
                    }
                  }}
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--primary)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={10} style={{ animation: syncLoading ? 'spin 1s linear infinite' : 'none' }} />
                  {syncLoading ? 'Memuat...' : 'Refresh Data'}
                </button>
              </div>
            </div>


            <div className="stats-grid">
              {(currentUser.jobdesk || 'suhu') === 'suhu' && (
                <div className="glass-card stat-card">
                  <span className="label">Laporan Hari Ini</span>
                  <span className="value">{stats.totalToday}</span>
                  <span className="desc">Total pemantauan suhu</span>
                </div>
              )}
              {(currentUser.jobdesk || 'suhu') === 'suhu' && (
                <div className="glass-card stat-card">
                  <span className="value" style={{ color: stats.maxTempToday !== '-' ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {stats.maxTempToday}
                  </span>
                  <span className="label">Suhu Tertinggi Hari Ini</span>
                  <span className="desc">Suhu alat tertinggi</span>
                </div>
              )}
              {(currentUser.jobdesk || 'suhu') !== 'suhu' && (
                <div className="glass-card stat-card">
                  <span className="label">Total Kegiatan</span>
                  <span className="value">{activities.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}</span>
                  <span className="desc">Kegiatan hari ini</span>
                </div>
              )}
              {(currentUser.jobdesk || 'suhu') !== 'suhu' && (
                <div className="glass-card stat-card">
                  <span className="label">Total Arsip Kegiatan</span>
                  <span className="value">{activities.length}</span>
                  <span className="desc">Semua laporan kegiatan</span>
                </div>
              )}
            </div>

            {(currentUser.jobdesk || 'suhu') === 'suhu' && (
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
            )}

            {/* Quick Action Banners */}
            <div style={{ display: 'grid', gridTemplateColumns: currentUser.role === 'Operator' ? ((currentUser.jobdesk || 'suhu') === 'suhu' ? '1fr 1fr 1fr' : '1fr 1fr') : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {(currentUser.jobdesk || 'suhu') === 'suhu' && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0, padding: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>🌡️ Pindai Suhu Alat</div>
                  <button className="btn btn-primary" onClick={() => { setActiveTab('scan'); startCamera(); }} style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '8px' }}>
                    <Camera size={14} /> Pindai Suhu
                  </button>
                </div>
              )}
              {/* Kegiatan — tampil untuk semua jobdesk (suhu, inspeksi, analis) kecuali role tertentu */}
              {(currentUser.role === 'Operator' || currentUser.role === 'Supervisor') && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0, padding: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {(currentUser.jobdesk || 'suhu') === 'suhu' ? '📋' : (currentUser.jobdesk === 'inspeksi' ? '🔍' : '🧪')} Kegiatan {(currentUser.jobdesk || 'suhu') === 'suhu' ? 'Lapangan' : (currentUser.jobdesk === 'inspeksi' ? 'Inspeksi' : 'Analis')}
                  </div>
                  <button className="btn btn-primary" onClick={() => { setActiveTab('activity'); startActCamera(); stopCamera(); stopAttCamera(); }} style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '8px' }}>
                    <Camera size={14} /> Ambil Foto Kegiatan
                  </button>
                </div>
              )}
              {currentUser.role === 'Operator' && (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0, padding: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(99,102,241,0.1) 100%)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Absensi Petugas</div>
                  <button className="btn btn-primary" onClick={() => { setActiveTab('attendance'); startAttCamera(); }} style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
                    <UserCheck size={14} /> Absen Foto
                  </button>
                </div>
              )}
            </div>


            {/* Advanced Dashboard Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 className="section-title" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                  <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
                  Top Uploader (7 Hari)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(() => {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    const countMap = {};
                    reports.forEach(r => {
                        if (new Date(r.timestamp) >= sevenDaysAgo && r.officer) countMap[r.officer] = (countMap[r.officer] || 0) + 1;
                    });
                    activities.forEach(a => {
                        if (new Date(a.timestamp) >= sevenDaysAgo && a.officer) countMap[a.officer] = (countMap[a.officer] || 0) + 1;
                    });
                    const top = Object.entries(countMap).sort((a,b) => b[1] - a[1]).slice(0, 3);
                    if (top.length === 0) return <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Belum ada data mingguan.</span>;
                    return top.map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                        <span style={{ fontWeight: 'bold' }}>{idx+1}. {t[0]}</span>
                        <span style={{ color: 'var(--primary)' }}>{t[1]} Laporan</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="glass-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 className="section-title" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                  <UserCheck size={14} style={{ color: '#10b981' }} />
                  Sedang Bertugas (Live)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(() => {
                    const todayStr = new Date().toDateString();
                    const todayAtt = attendance.filter(a => new Date(a.timestamp).toDateString() === todayStr);
                    const latestEvents = {};
                    todayAtt.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(a => {
                        latestEvents[a.officer] = a;
                    });
                    const checkedIn = Object.entries(latestEvents).filter(([_, event]) => event.type === 'Check In').map(e => e[0]);
                    if (checkedIn.length === 0) return <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tidak ada petugas di lapangan.</span>;
                    return checkedIn.map((officer, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }}></div>
                        <span>{officer}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Chart Container — hanya tampil untuk jobdesk suhu */}
            {(currentUser.jobdesk || 'suhu') === 'suhu' && (
              <div className="glass-card">
                <h3 className="section-title">
                  <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                  Tren Suhu Terakhir
                </h3>
                {renderDashboardChart()}
              </div>
            )}
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

        {/* ----------------- TAB: ACTIVITY (Kegiatan Inspeksi/Analis) ----------------- */}
        {activeTab === 'activity' && isTabVisible('activity') && (
          <div>
            {!actCameraActive && !actImage && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                  <Camera size={32} />
                </div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Dokumentasi Kegiatan {(currentUser.jobdesk || 'inspeksi') === 'inspeksi' ? 'Inspeksi' : 'Analis'}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Ambil foto kegiatan Anda di lapangan, lalu isi keterangan dan lokasi.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn btn-primary" onClick={startActCamera}>
                    <Camera size={18} />
                    Buka Kamera
                  </button>
                  <button className="btn btn-secondary" onClick={() => actFileInputRef.current.click()}>
                    <ImageIcon size={18} />
                    Unggah dari Galeri
                  </button>
                  <input 
                    type="file" 
                    ref={actFileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleActFileUpload} 
                  />
                </div>
              </div>
            )}

            {actCameraActive && (
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
                  <video ref={actVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                </div>
                <div className="upload-btn-container">
                  <button className="btn btn-secondary" onClick={stopActCamera}>
                    <X size={18} /> Batal
                  </button>
                  <button className="btn btn-primary" onClick={captureActPhoto}>
                    <Camera size={18} /> Ambil Foto
                  </button>
                </div>
              </div>
            )}

            {actImage && (
              <form onSubmit={handleSubmitActivity}>
                <div className="glass-card">
                  <h3 className="section-title">
                    <ClipboardList size={16} style={{ color: 'var(--primary)' }} />
                    Laporan Kegiatan {(currentUser.jobdesk || 'inspeksi') === 'inspeksi' ? 'Inspeksi' : 'Analis'}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                    <img src={actImage} alt="Activity Preview" style={{ width: '100px', height: '75px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--card-border)' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>Foto Kegiatan</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Dokumentasi aktivitas lapangan</div>
                      <button type="button" className="btn btn-secondary" onClick={startActCamera} style={{ padding: '4px 8px', fontSize: '0.65rem', height: 'auto', marginTop: '6px', borderRadius: '6px' }}>
                        <RefreshCw size={10} /> Foto Ulang
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Keterangan Kegiatan *</label>
                    <textarea 
                      placeholder="Jelaskan kegiatan yang sedang dilakukan..."
                      className="form-control"
                      rows="3"
                      value={actFormDescription}
                      onChange={(e) => setActFormDescription(e.target.value)}
                      style={{ resize: 'none' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Lokasi</label>
                    <select 
                      className="form-control"
                      value={actFormLocation}
                      onChange={(e) => setActFormLocation(e.target.value)}
                      required
                    >
                      <option value="" disabled>Pilih Lokasi</option>
                      {actLocations.map((loc, idx) => (
                        <option key={idx} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nama Staff / Petugas</label>
                    {currentUser.role === 'Operator' ? (
                      <input type="text" className="form-control" value={currentUser.name} disabled />
                    ) : (
                      <select 
                        className="form-control"
                        value={actFormOfficer}
                        onChange={(e) => setActFormOfficer(e.target.value)}
                        required
                      >
                        {officers.map((name, idx) => (
                          <option key={idx} value={name}>{name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Catatan Tambahan (Opsional)</label>
                    <textarea 
                      placeholder="Catatan tambahan jika ada..."
                      className="form-control"
                      rows="2"
                      value={actFormNotes}
                      onChange={(e) => setActFormNotes(e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>
                </div>

                <div className="upload-btn-container">
                  <button type="button" className="btn btn-secondary" onClick={() => { setActImage(null); setActFormDescription(''); setActFormNotes(''); }}>
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

        {/* ----------------- TAB: APPROVAL (Supervisor & Manager) ----------------- */}
        {activeTab === 'approval' && isTabVisible('approval') && (() => {
          const role = currentUser.role;
          const jd = currentUser.jobdesk || 'suhu';

          // Filter absensi yang butuh approval
          const pendingList = attendance.filter(a => {
            const needsAction = a.status === 'Pending SPV' || a.status === 'Pending Manager';
            if (!needsAction) return false;
            // Supervisor hanya melihat jobdesk-nya, atau data lama yang tidak punya jobdesk
            if (role === 'Supervisor') return !a.jobdesk || a.jobdesk === jd;
            // Manager melihat semua
            return true;
          });

          const filteredPending = approvalFilter === 'Semua'
            ? pendingList
            : pendingList.filter(a => a.status === approvalFilter);

          const handleApprove = (id) => {
            const rec = attendance.find(a => a.id === id);
            if (!rec) return;
            let updatedRec;
            if (role === 'Supervisor' && rec.status === 'Pending SPV') {
              updatedRec = { ...rec, status: 'Pending Manager', spvApproval: { by: currentUser.name, at: new Date().toISOString() } };
            } else if (role === 'Manager' && rec.status === 'Pending Manager') {
              updatedRec = { ...rec, status: 'Disetujui', managerApproval: { by: currentUser.name, at: new Date().toISOString() } };
            } else return;
            db.updateAttendance(updatedRec);
            setAttendance(db.getAttendance());
            showToast('Absensi berhasil disetujui!', 'success');
          };

          const handleReject = (id) => {
            const rec = attendance.find(a => a.id === id);
            if (!rec) return;
            const updatedRec = { ...rec, status: 'Ditolak', rejectedBy: currentUser.name, rejectedAt: new Date().toISOString() };
            db.updateAttendance(updatedRec);
            setAttendance(db.getAttendance());
            showToast('Absensi telah ditolak.', 'error');
          };

          return (
            <div>
              <div className="glass-card" style={{ marginBottom: '16px' }}>
                <h3 className="section-title">
                  <CheckSquare size={16} style={{ color: 'var(--primary)' }} />
                  Persetujuan Izin / Cuti / Sakit
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {role === 'Supervisor' ? `Menampilkan absensi divisi ${jd} yang menunggu persetujuan Anda.` : 'Menampilkan semua absensi yang menunggu persetujuan akhir.'}
                </p>
                {/* Filter buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Semua', 'Pending SPV', 'Pending Manager'].map(f => (
                    <button key={f} onClick={() => setApprovalFilter(f)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '4px 10px', background: approvalFilter === f ? 'var(--primary)' : '', color: approvalFilter === f ? '#fff' : '' }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPending.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <CheckCircle size={40} style={{ color: 'var(--normal)', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tidak ada absensi yang menunggu persetujuan.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredPending.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(rec => (
                    <div key={rec.id} className="glass-card" style={{ padding: '14px', marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{rec.officer}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(rec.timestamp).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span className={`status-badge ${rec.type === 'Sakit' ? 'warning' : rec.type === 'Izin' ? 'normal' : 'info'}`} style={{ fontSize: '0.65rem' }}>{rec.type}</span>
                          <span className="status-badge warning" style={{ fontSize: '0.6rem' }}>{rec.status}</span>
                        </div>
                      </div>
                      {rec.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', marginBottom: '10px' }}>
                          📝 {rec.notes}
                        </div>
                      )}
                      {rec.image && (
                        <img src={rec.image} alt="Bukti" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px', border: '1px solid var(--card-border)' }} />
                      )}
                      {/* Tombol aksi hanya muncul jika status sesuai role */}
                      {((role === 'Supervisor' && rec.status === 'Pending SPV') || (role === 'Manager' && rec.status === 'Pending Manager')) && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary" onClick={() => handleApprove(rec.id)} style={{ flex: 1, fontSize: '0.75rem', padding: '8px' }}>
                            <CheckCircle size={14} /> Setujui
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleReject(rec.id)} style={{ flex: 1, fontSize: '0.75rem', padding: '8px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
                            <X size={14} /> Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <button 
                      type="button" 
                      className={`btn ${attType === 'Check In' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAttType('Check In')}
                      style={attType === 'Check In' ? { background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 4px 10px rgba(16,185,129,0.2)' } : {}}
                    >
                      🟢 Check In (Masuk)
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${attType === 'Check Out' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAttType('Check Out')}
                      style={attType === 'Check Out' ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', boxShadow: '0 4px 10px rgba(245,158,11,0.2)' } : {}}
                    >
                      🟠 Check Out (Keluar)
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      className={`btn ${attType === 'Sakit' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAttType('Sakit')}
                      style={attType === 'Sakit' ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', boxShadow: '0 4px 10px rgba(239,68,68,0.2)', fontSize: '0.7rem', padding: '8px 4px' } : { fontSize: '0.7rem', padding: '8px 4px' }}
                    >
                      🔴 Sakit
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${attType === 'Izin' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAttType('Izin')}
                      style={attType === 'Izin' ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', boxShadow: '0 4px 10px rgba(59,130,246,0.2)', fontSize: '0.7rem', padding: '8px 4px' } : { fontSize: '0.7rem', padding: '8px 4px' }}
                    >
                      🔵 Izin
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${attType === 'Cuti' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAttType('Cuti')}
                      style={attType === 'Cuti' ? { background: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: 'none', boxShadow: '0 4px 10px rgba(6,182,212,0.2)', fontSize: '0.7rem', padding: '8px 4px' } : { fontSize: '0.7rem', padding: '8px 4px' }}
                    >
                      🟡 Cuti
                    </button>
                  </div>
                </div>

                {/* Selfie Camera Capture */}
                <div className="form-group">
                  <label>
                    {['Check In', 'Check Out'].includes(attType) 
                      ? 'Foto Wajah Petugas (Selfie) *' 
                      : 'Foto Surat Keterangan / Bukti Eviden *'}
                  </label>
                  
                  {!attCameraActive && !attImage && (
                    <div style={{ border: '2px dashed var(--card-border)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                      <User size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                        {['Check In', 'Check Out'].includes(attType)
                          ? 'Ambil foto selfie di lokasi stasiun kerja saat Check In / Out.'
                          : 'Ambil atau unggah foto surat keterangan dokter/bukti izin.'}
                      </p>
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

                            {/* Geofence Distance Indicator */}
                            {(() => {
                              if (settings.enableGeofence && ['Check In', 'Check Out'].includes(attType)) {
                                const dist = calculateDistance(
                                  attGpsData.latitude,
                                  attGpsData.longitude,
                                  settings.geofenceLat,
                                  settings.geofenceLon
                                );
                                if (dist !== null) {
                                  const isWithin = dist <= settings.geofenceRadius;
                                  return (
                                    <div style={{ 
                                      marginTop: '8px', 
                                      padding: '8px 12px', 
                                      borderRadius: '8px', 
                                      background: isWithin ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                                      border: isWithin ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', 
                                      fontSize: '0.75rem' 
                                    }}>
                                      <div style={{ fontWeight: 'bold', color: isWithin ? '#10b981' : '#ef4444' }}>
                                        {isWithin ? '🟢 Anda berada di dalam area absensi' : '🔴 Anda berada di luar area absensi'}
                                      </div>
                                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        Jarak ke kantor: <strong>{dist.toFixed(1)} meter</strong> (Batas Maksimal: {settings.geofenceRadius} meter)
                                      </div>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}
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

                {/* Notes/Keterangan Field for Sakit/Izin/Cuti */}
                {!['Check In', 'Check Out'].includes(attType) && (
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label>Keterangan / Alasan *</label>
                    <textarea 
                      placeholder="Tuliskan keterangan detail alasan sakit, izin, atau cuti..."
                      className="form-control"
                      rows="3"
                      value={attNotes}
                      onChange={(e) => setAttNotes(e.target.value)}
                      style={{ resize: 'none' }}
                      required
                    />
                  </div>
                )}

                {(() => {
                  const isGeofenceBlocked = 
                    settings.enableGeofence && 
                    ['Check In', 'Check Out'].includes(attType) && 
                    attGpsData && 
                    attGpsData.latitude && 
                    calculateDistance(
                      attGpsData.latitude,
                      attGpsData.longitude,
                      settings.geofenceLat,
                      settings.geofenceLon
                    ) > settings.geofenceRadius;

                  return (
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ 
                        width: '100%', 
                        marginTop: '16px', 
                        background: isGeofenceBlocked 
                          ? 'var(--bg-tertiary)' 
                          : attType === 'Check In' ? 'linear-gradient(135deg, #10b981, #059669)'
                          : attType === 'Check Out' ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : attType === 'Sakit' ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : attType === 'Izin' ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                          : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        border: 'none',
                        cursor: isGeofenceBlocked ? 'not-allowed' : 'pointer'
                      }}
                      disabled={!attImage || attGpsLoading || isGeofenceBlocked}
                    >
                      {isGeofenceBlocked ? '⚠️ Di Luar Radius Absensi' : `Kirim Absensi ${attType}`}
                    </button>
                  );
                })()}
              </form>
            </div>
          </div>
        )}

        {/* ----------------- TAB: HISTORY (Riwayat) ----------------- */}
        {activeTab === 'history' && isTabVisible('history') && (
          <div>
            {/* Top Sub-Nav Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '4px', marginBottom: '14px', border: '1px solid var(--card-border)' }}>
              {(currentUser.jobdesk || 'suhu') === 'suhu' ? (
                <>
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
                </>
              ) : (
                <>
                  <button 
                    className={`btn`} 
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.75rem', background: historyActSubTab === 'kegiatan' ? 'var(--bg-tertiary)' : 'transparent', color: historyActSubTab === 'kegiatan' ? '#fff' : 'var(--text-muted)' }}
                    onClick={() => setHistoryActSubTab('kegiatan')}
                  >
                    <ClipboardList size={14} style={{ marginRight: '4px', display: 'inline' }} />
                    Kegiatan ({filteredActivities.length})
                  </button>
                  <button 
                    className={`btn`} 
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.75rem', background: historyActSubTab === 'absensi' ? 'var(--bg-tertiary)' : 'transparent', color: historyActSubTab === 'absensi' ? '#fff' : 'var(--text-muted)' }}
                    onClick={() => setHistoryActSubTab('absensi')}
                  >
                    <UserCheck size={14} style={{ marginRight: '4px', display: 'inline' }} />
                    Absensi Petugas ({filteredAttendance.length})
                  </button>
                </>
              )}
            </div>

            {/* Global Date Filter for History */}
            <div className="glass-card" style={{ padding: '10px 14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                Filter Rentang Waktu
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Dari Tanggal</label>
                  <input type="date" className="form-control" style={{ padding: '6px 8px', fontSize: '0.75rem' }} value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Sampai Tanggal</label>
                  <input type="date" className="form-control" style={{ padding: '6px 8px', fontSize: '0.75rem' }} value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Sub-Tab 1: Suhu Alat */}
            {(currentUser.jobdesk || 'suhu') === 'suhu' && historySubTab === 'suhu' && (
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => db.exportToPDF(filteredReports)} style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', borderRadius: '8px' }}>
                      <Download size={14} /> PDF
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportCSV} style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', borderRadius: '8px' }}>
                      <Download size={14} /> CSV
                    </button>
                  </div>
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

            {/* Sub-Tab 2: Kegiatan (Inspeksi / Analis) */}
            {(currentUser.jobdesk || 'suhu') !== 'suhu' && historyActSubTab === 'kegiatan' && (
              <div>
                <div className="glass-card" style={{ padding: '14px' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="Cari kegiatan, lokasi, petugas..."
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      value={searchActQuery}
                      onChange={(e) => setSearchActQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>LOKASI</label>
                    <select 
                      className="form-control"
                      style={{ padding: '6px 8px', fontSize: '0.75rem', marginTop: '3px' }}
                      value={filterActLocation}
                      onChange={(e) => setFilterActLocation(e.target.value)}
                    >
                      <option value="Semua">Semua Lokasi</option>
                      {actLocations.map((loc, idx) => (
                        <option key={idx} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex-row-between" style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Ditemukan {filteredActivities.length} Kegiatan
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => db.exportActivitiesToPDF(filteredActivities)} style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', borderRadius: '8px' }}>
                      <Download size={14} /> PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => db.exportActivitiesToCSV(filteredActivities)} style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', borderRadius: '8px' }}>
                      <Download size={14} /> CSV
                    </button>
                  </div>
                </div>

                {filteredActivities.length === 0 ? (
                  <div className="glass-card empty-state">
                    <ClipboardList size={32} />
                    <p>Tidak ada data kegiatan ditemukan.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {filteredActivities.map((a) => {
                      const formattedDate = new Date(a.timestamp).toLocaleString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      return (
                        <div key={a.id} className="glass-card report-item" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setSelectedActivity(a)}>
                          {a.image ? (
                            <img src={a.image} alt="Activity capture" className="report-thumb" />
                          ) : (
                            <div className="report-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
                              <ImageIcon size={20} style={{ color: 'var(--text-muted)' }} />
                            </div>
                          )}
                          <div className="report-info" style={{ flex: 1 }}>
                            <h4>{a.location}</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.description}</p>
                            <div className="report-meta" style={{ marginTop: '4px' }}>
                              <User size={10} /> <span>{a.officer || 'Petugas'}</span>
                              <span>•</span>
                              <Calendar size={10} /> <span>{formattedDate}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Absensi Petugas */}
            {(((currentUser.jobdesk || 'suhu') === 'suhu' && historySubTab === 'absensi') || 
              ((currentUser.jobdesk || 'suhu') !== 'suhu' && historyActSubTab === 'absensi')) && (
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
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                        <option value="Cuti">Cuti</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-row-between" style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Ditemukan {filteredAttendance.length} Riwayat Absensi
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => db.exportAttendanceToPDF(filteredAttendance)} style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', borderRadius: '8px' }}>
                      <Download size={14} /> PDF
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportCSV} style={{ padding: '6px 12px', fontSize: '0.7rem', height: 'auto', borderRadius: '8px' }}>
                      <Download size={14} /> CSV
                    </button>
                  </div>
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
                              background: a.type === 'Check In' ? 'rgba(16, 185, 129, 0.15)' 
                                        : a.type === 'Check Out' ? 'rgba(245, 158, 11, 0.15)'
                                        : a.type === 'Sakit' ? 'rgba(239, 68, 68, 0.15)'
                                        : a.type === 'Izin' ? 'rgba(59, 130, 246, 0.15)'
                                        : 'rgba(6, 182, 212, 0.15)',
                              color: a.type === 'Check In' ? '#10b981'
                                   : a.type === 'Check Out' ? '#f59e0b'
                                   : a.type === 'Sakit' ? '#ef4444'
                                   : a.type === 'Izin' ? '#3b82f6'
                                   : '#06b6d4',
                              border: a.type === 'Check In' ? '1px solid rgba(16, 185, 129, 0.3)'
                                    : a.type === 'Check Out' ? '1px solid rgba(245, 158, 11, 0.3)'
                                    : a.type === 'Sakit' ? '1px solid rgba(239, 68, 68, 0.3)'
                                    : a.type === 'Izin' ? '1px solid rgba(59, 130, 246, 0.3)'
                                    : '1px solid rgba(6, 182, 212, 0.3)'
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
            
            {/* Manage Staff & Users */}
            <div className="glass-card">
              <div className="flex-row-between" style={{ marginBottom: '10px' }}>
                <h3 className="section-title" style={{ marginBottom: 0 }}>
                  <User size={16} style={{ color: 'var(--primary)' }} />
                  Kelola Pengguna & Peran
                </h3>
                {!showOfficerInput && (
                  <button className="btn btn-secondary" onClick={() => setShowOfficerInput(true)} style={{ padding: '4px 10px', height: 'auto', fontSize: '0.7rem', borderRadius: '6px' }}>
                    <Plus size={12} /> Tambah User
                  </button>
                )}
              </div>

              {showOfficerInput && (
                <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--card-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Username..." 
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      value={newOfficerName}
                      onChange={(e) => setNewOfficerName(e.target.value)}
                      required
                    />
                    <select 
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      value={newOfficerRole}
                      onChange={(e) => setNewOfficerRole(e.target.value)}
                    >
                      <option value="Operator">Operator</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Password default..." 
                      className="form-control"
                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      value={newOfficerPassword}
                      onChange={(e) => setNewOfficerPassword(e.target.value)}
                      required
                    />
                    {(newOfficerRole === 'Operator' || newOfficerRole === 'Supervisor') && (
                      <select 
                        className="form-control"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                        value={newOfficerJobdesk}
                        onChange={(e) => setNewOfficerJobdesk(e.target.value)}
                      >
                        <option value="suhu">Suhu</option>
                        <option value="inspeksi">Inspeksi</option>
                        <option value="analis">Analis</option>
                      </select>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px', flex: 1 }}>
                      Simpan Pengguna
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowOfficerInput(false)} style={{ padding: '8px 12px', flex: 'none' }}>
                      Batal
                    </button>
                  </div>
                </form>
              )}

              <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px' }}>Username</th>
                      <th style={{ padding: '8px' }}>Peran</th>
                      <th style={{ padding: '8px' }}>Jobdesk</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.username !== 'admin').map((u, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{u.username}</td>
                        <td style={{ padding: '8px' }}>{u.role}</td>
                        <td style={{ padding: '8px' }}>{u.jobdesk || '-'}</td>
                        <td style={{ padding: '8px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.65rem' }}
                            onClick={() => {
                              setResetUsername(u.username);
                              setShowResetModal(true);
                            }}
                          >
                            Reset Sandi
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            onClick={() => handleDeleteUser(u.username)}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

            {/* Geofencing Settings */}
            <form onSubmit={(e) => {
              e.preventDefault();
              db.saveSettings(settings);
              showToast("Pengaturan Geofencing absensi disimpan!", "success");
            }} className="glass-card">
              <h3 className="section-title">
                <MapPin size={16} style={{ color: 'var(--primary)' }} />
                Konfigurasi Geofencing Kantor
              </h3>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="checkbox" 
                  id="enableGeofence"
                  checked={settings.enableGeofence || false}
                  onChange={(e) => setSettings({ ...settings, enableGeofence: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="enableGeofence" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 'bold' }}>
                  Aktifkan Batas Lokasi (Geofencing)
                </label>
              </div>

              {settings.enableGeofence && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Latitude Kantor</label>
                      <input 
                        type="number" 
                        step="0.000001" 
                        placeholder="-6.200000"
                        className="form-control"
                        value={settings.geofenceLat !== undefined ? settings.geofenceLat : ''}
                        onChange={(e) => setSettings({ ...settings, geofenceLat: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Longitude Kantor</label>
                      <input 
                        type="number" 
                        step="0.000001" 
                        placeholder="106.816666"
                        className="form-control"
                        value={settings.geofenceLon !== undefined ? settings.geofenceLon : ''}
                        onChange={(e) => setSettings({ ...settings, geofenceLon: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        if (!navigator.geolocation) {
                          showToast("Geolocation tidak didukung browser ini.", "error");
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setSettings({
                              ...settings,
                              geofenceLat: parseFloat(position.coords.latitude.toFixed(6)),
                              geofenceLon: parseFloat(position.coords.longitude.toFixed(6))
                            });
                            showToast("Koordinat lokasi admin saat ini berhasil diisi.", "success");
                          },
                          (err) => {
                            showToast("Gagal mengambil lokasi admin: " + err.message, "error");
                          }
                        );
                      }}
                      style={{ fontSize: '0.75rem', padding: '6px 12px', width: '100%', marginBottom: '8px' }}
                    >
                      📍 Gunakan Koordinat Perangkat Ini
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Radius Batas Toleransi (Meter)</label>
                    <div className="temp-input-wrapper">
                      <input 
                        type="number" 
                        placeholder="100" 
                        className="form-control"
                        value={settings.geofenceRadius !== undefined ? settings.geofenceRadius : ''}
                        onChange={(e) => setSettings({ ...settings, geofenceRadius: parseInt(e.target.value, 10) })}
                        required
                      />
                      <span className="temp-unit">meter</span>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Simpan Konfigurasi Geofencing
              </button>
            </form>

            {/* Manage Locations */}
            <div className="glass-card">
              <div className="flex-row-between" style={{ marginBottom: '10px' }}>
                <h3 className="section-title" style={{ marginBottom: 0 }}>
                  <MapPin size={16} style={{ color: 'var(--primary)' }} />
                  Kelola Stasiun/Lokasi
                </h3>
                {!showLocationInput && (
                  <button className="btn btn-secondary" onClick={() => setShowLocationInput(true)} style={{ padding: '4px 10px', height: 'auto', fontSize: '0.7rem', borderRadius: '6px' }}>
                    <Plus size={12} /> Tambah
                  </button>
                )}
              </div>

              {/* Selector for which jobdesk to manage */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>PILIH JOBDESK UNTUK DIKELOLA</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {['suhu', 'inspeksi', 'analis'].map(jd => (
                    <button
                      key={jd}
                      type="button"
                      className="btn"
                      onClick={() => setSettingManageJobdesk(jd)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '0.7rem',
                        borderRadius: '6px',
                        background: settingManageJobdesk === jd ? 'var(--primary)' : 'var(--bg-tertiary)',
                        color: settingManageJobdesk === jd ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {jd.charAt(0).toUpperCase() + jd.slice(1)}
                    </button>
                  ))}
                </div>
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
                {settingLocations.map((loc, idx) => (
                  <div key={idx} className="tag-item">
                    <span>{loc}</span>
                    <button className="tag-remove" onClick={() => handleDeleteLocation(loc)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cloud Sync Config (Supabase) */}
            <div className="glass-card">
              <h3 className="section-title">
                <RefreshCw size={16} style={{ color: 'var(--primary)', animation: syncLoading ? 'spin 2s linear infinite' : 'none' }} />
                Sinkronisasi Cloud (Supabase)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Hubungkan aplikasi ini ke Cloud Database Supabase agar data otomatis sinkron antardevice (HP & Laptop).
              </p>
              
              <form onSubmit={handleSaveSupabaseConfig} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label>Supabase URL</label>
                  <input 
                    type="text" 
                    placeholder="https://xxxx.supabase.co" 
                    className="form-control"
                    value={cloudUrl}
                    onChange={(e) => setCloudUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Supabase Anon Key / API Key</label>
                  <input 
                    type="password" 
                    placeholder="eyJhbGciOi..." 
                    className="form-control"
                    value={cloudKey}
                    onChange={(e) => setCloudKey(e.target.value)}
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={syncLoading}>
                    {syncLoading ? 'Menguji Koneksi...' : 'Simpan & Hubungkan'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleManualSync} style={{ flex: 1 }} disabled={syncLoading || !cloudUrl || !cloudKey}>
                    <RefreshCw size={12} style={{ marginRight: '4px', display: 'inline', animation: syncLoading ? 'spin 1.5s linear infinite' : 'none' }} /> Sync Manual
                  </button>
                </div>
              </form>

              {/* SQL script helper */}
              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  📋 SQL SCHEMA UNTUK SUPABASE (PENGATURAN AWAL):
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Copy-paste kode SQL di bawah ini ke SQL Editor di akun Supabase Anda, lalu klik "Run" untuk membuat tabel:
                </span>
                <textarea
                  readOnly
                  className="form-control"
                  style={{ fontFamily: 'monospace', fontSize: '0.55rem', height: '150px', resize: 'none', background: '#0e1117', color: '#10b981', border: '1px solid #1f2937' }}
                  value={`-- 1. Buat tabel reports
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ,
    temperature FLOAT8,
    location TEXT,
    officer TEXT,
    notes TEXT,
    image TEXT
);

-- 2. Buat tabel attendance
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ,
    officer TEXT,
    type TEXT,
    image TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    gps_accuracy FLOAT8,
    is_fake_gps BOOLEAN
);

-- 3. Buat tabel activities
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ,
    jobdesk TEXT,
    officer TEXT,
    location TEXT,
    description TEXT,
    notes TEXT,
    image TEXT
);

-- 4. Nonaktifkan RLS (agar mudah diakses frontend)
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;`}
                />
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
                      background: selectedAttendance.type === 'Check In' ? 'rgba(16, 185, 129, 0.15)' 
                                : selectedAttendance.type === 'Check Out' ? 'rgba(245, 158, 11, 0.15)'
                                : selectedAttendance.type === 'Sakit' ? 'rgba(239, 68, 68, 0.15)'
                                : selectedAttendance.type === 'Izin' ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(6, 182, 212, 0.15)',
                      color: selectedAttendance.type === 'Check In' ? '#10b981'
                           : selectedAttendance.type === 'Check Out' ? '#f59e0b'
                           : selectedAttendance.type === 'Sakit' ? '#ef4444'
                           : selectedAttendance.type === 'Izin' ? '#3b82f6'
                           : '#06b6d4',
                      border: selectedAttendance.type === 'Check In' ? '1px solid rgba(16, 185, 129, 0.3)'
                            : selectedAttendance.type === 'Check Out' ? '1px solid rgba(245, 158, 11, 0.3)'
                            : selectedAttendance.type === 'Sakit' ? '1px solid rgba(239, 68, 68, 0.3)'
                            : selectedAttendance.type === 'Izin' ? '1px solid rgba(59, 130, 246, 0.3)'
                            : '1px solid rgba(6, 182, 212, 0.3)'
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

                {selectedAttendance.notes && (
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '10px' }}>
                    <FileText size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>KETERANGAN / ALASAN</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                        {selectedAttendance.notes}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {['Sakit', 'Izin', 'Cuti'].includes(selectedAttendance.type) && (
                <div className="glass-card" style={{ padding: '16px', marginBottom: 0, marginTop: '12px' }}>
                  <h4 style={{ fontSize: '0.8rem', marginBottom: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '4px' }}>Status Persetujuan</h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Supervisor:</span>
                    {selectedAttendance.spvApproval ? (
                      <span className="status-badge" style={{ background: selectedAttendance.spvApproval.status === 'Disetujui' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: selectedAttendance.spvApproval.status === 'Disetujui' ? '#10b981' : '#ef4444', fontSize: '0.65rem', padding: '2px 6px' }}>
                        {selectedAttendance.spvApproval.status} ({selectedAttendance.spvApproval.by})
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manager:</span>
                    {selectedAttendance.managerApproval ? (
                      <span className="status-badge" style={{ background: selectedAttendance.managerApproval.status === 'Disetujui' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: selectedAttendance.managerApproval.status === 'Disetujui' ? '#10b981' : '#ef4444', fontSize: '0.65rem', padding: '2px 6px' }}>
                        {selectedAttendance.managerApproval.status} ({selectedAttendance.managerApproval.by})
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</span>
                    )}
                  </div>

                  {/* Action Buttons for Approvers */}
                  {currentUser.role === 'Supervisor' && !selectedAttendance.spvApproval && selectedAttendance.status === 'Pending SPV' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.75rem' }} onClick={() => handleApproveAttendance(selectedAttendance.id, 'Disetujui SPV')}>
                        Setujui
                      </button>
                      <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleApproveAttendance(selectedAttendance.id, 'Ditolak SPV')}>
                        Tolak
                      </button>
                    </div>
                  )}

                  {currentUser.role === 'Manager' && selectedAttendance.spvApproval && selectedAttendance.spvApproval.status === 'Disetujui' && !selectedAttendance.managerApproval && selectedAttendance.status === 'Pending Manager' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.75rem' }} onClick={() => handleApproveAttendance(selectedAttendance.id, 'Disetujui Manager')}>
                        Setujui
                      </button>
                      <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleApproveAttendance(selectedAttendance.id, 'Ditolak Manager')}>
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentUser.role === 'Administrator' && (
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
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); stopCamera(); stopAttCamera(); stopActCamera(); }}>
            <Activity />
            <span>Dashboard</span>
          </div>
        )}
        
        {isTabVisible('scan') && (
          <div className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => { setActiveTab('scan'); startCamera(); stopAttCamera(); stopActCamera(); }}>
            <Camera />
            <span>Pindai Suhu</span>
          </div>
        )}

        {isTabVisible('activity') && (
          <div className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => { setActiveTab('activity'); startActCamera(); stopCamera(); stopAttCamera(); }}>
            <ClipboardList />
            <span>Kegiatan</span>
          </div>
        )}

        {isTabVisible('approval') && (() => {
          const jd = currentUser.jobdesk || 'suhu';
          const pendingCount = attendance.filter(a => {
            if (currentUser.role === 'Supervisor') return a.status === 'Pending SPV' && a.jobdesk === jd;
            if (currentUser.role === 'Manager') return a.status === 'Pending Manager';
            return false;
          }).length;
          return (
            <div className={`nav-item ${activeTab === 'approval' ? 'active' : ''}`} onClick={() => { setActiveTab('approval'); stopCamera(); stopAttCamera(); stopActCamera(); }} style={{ position: 'relative' }}>
              <CheckSquare />
              <span>Approval</span>
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '8px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {pendingCount}
                </span>
              )}
            </div>
          );
        })()}

        {isTabVisible('attendance') && (
          <div className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); startAttCamera(); stopCamera(); stopActCamera(); }}>
            <UserCheck />
            <span>Absensi</span>
          </div>
        )}
        
        {isTabVisible('history') && (
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); stopCamera(); stopAttCamera(); stopActCamera(); }}>
            <Calendar />
            <span>Riwayat</span>
          </div>
        )}
        
        {isTabVisible('settings') && (
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); stopCamera(); stopAttCamera(); stopActCamera(); }}>
            <SettingsIcon />
            <span>Pengaturan</span>
          </div>
        )}
      </nav>
      {/* Hidden Canvas elements for image capturing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={attCanvasRef} style={{ display: 'none' }} />
      <canvas ref={actCanvasRef} style={{ display: 'none' }} />

      {/* ----------------- ACTIVITY DETAIL MODAL ----------------- */}
      {selectedActivity && (
        <div className="modal-overlay" onClick={() => setSelectedActivity(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Detail Kegiatan</h3>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {selectedActivity.id}</span>
              </div>
              <button className="modal-close" onClick={() => setSelectedActivity(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedActivity.image ? (
                <div style={{ width: '100%', background: '#000', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                  <img src={selectedActivity.image} alt="Activity detail" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '140px', background: 'var(--bg-tertiary)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
                  <ImageIcon size={32} />
                  <span style={{ fontSize: '0.75rem', marginTop: '6px' }}>Tidak ada foto terlampir</span>
                </div>
              )}

              <div className="glass-card" style={{ padding: '16px', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>LOKASI</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{selectedActivity.location}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <User size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>PETUGAS</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{selectedActivity.officer || 'Anonim'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Calendar size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>WAKTU</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {new Date(selectedActivity.timestamp).toLocaleString('id-ID', {
                        dateStyle: 'long',
                        timeStyle: 'medium'
                      })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <FileText size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>KETERANGAN</span>
                    <span style={{ fontSize: '0.85rem' }}>{selectedActivity.description}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Info size={16} style={{ color: 'var(--primary)', flex: 'none', marginTop: '2px' }} />
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>CATATAN</span>
                    <span style={{ fontSize: '0.85rem', color: selectedActivity.notes ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {selectedActivity.notes || 'Tidak ada catatan.'}
                    </span>
                  </div>
                </div>
              </div>

              {currentUser.role !== 'Operator' && (
                <button className="btn btn-secondary" onClick={() => handleDeleteActivity(selectedActivity.id)} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', marginTop: '8px' }}>
                  <Trash2 size={16} /> Hapus Laporan
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ----------------- PROFILE MODAL (Ganti Sandi) ----------------- */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Ubah Kata Sandi</h3>
              <button className="modal-close" onClick={() => setShowProfileModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="form-group">
                <label>Kata Sandi Lama</label>
                <input type="password" required className="form-control" value={profileOldPassword} onChange={e => setProfileOldPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Kata Sandi Baru</label>
                <input type="password" required className="form-control" value={profileNewPassword} onChange={e => setProfileNewPassword(e.target.value)} minLength={6} />
              </div>
              <div className="form-group">
                <label>Konfirmasi Sandi Baru</label>
                <input type="password" required className="form-control" value={profileConfirmPassword} onChange={e => setProfileConfirmPassword(e.target.value)} minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- ADMIN RESET MODAL ----------------- */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Reset Sandi: {resetUsername}</h3>
              <button className="modal-close" onClick={() => setShowResetModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleResetPasswordAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="form-group">
                <label>Kata Sandi Baru</label>
                <input type="text" required className="form-control" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', background: 'var(--danger)' }}>Reset Sandi</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
