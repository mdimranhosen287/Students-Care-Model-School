/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import AdmitCardModal from './AdmitCardModal';
import { getApiUrl } from '../lib/api';
import { 
  Lock, 
  LogOut, 
  User, 
  Key,
  Mail,
  Home,
  CheckCircle2, 
  Eye,
  EyeOff,
  Clock, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Award, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  Info,
  Sparkles, 
  Settings, 
  Users, 
  PlusCircle, 
  Trash2,
  Printer,
  Shield,
  LayoutGrid,
  Table, 
  Coins, 
  Activity, 
  FileText, 
  CheckCircle, 
  Plus, 
  Send, 
  Download, 
  DollarSign, 
  ArrowRight, 
  UserPlus,
  Phone,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  LayoutDashboard,
  CheckSquare,
  FileSpreadsheet,
  Building,
  Sliders,
  Globe,
  Video,
  Wallet,
  CreditCard,
  Contact,
  Edit3,
  Bookmark,
  Upload,
  ShieldCheck,
  X,
  Cloud,
  Folder,
  FolderPlus,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
  Database,
  Copy,
  Code,
  Heart,
  Filter,
  Barcode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { 
  initAuth, 
  googleSignIn, 
  logout as googleLogout, 
  getAccessToken, 
  listDriveFiles, 
  createDriveFolder, 
  uploadDriveFile, 
  deleteDriveFile,
  DriveFile,
  setAccessToken
} from '../lib/googleDriveService';
import { mockStudentProfile, mockHomework, mockExamResults } from '../data/schoolData';
import { getMergedFrontendData } from '../data/defaultFrontendData';
import ClassRoutineGrid from './ClassRoutineGrid';
import ClassScheduleEditor from './ClassScheduleEditor';
import StudentPromotion from './StudentPromotion';
import AdminMailbox from './AdminMailbox';
import CertificateOfExcellence from './CertificateOfExcellence';
import SeatPlan from './SeatPlan';
import AdmitCardTemplate from './AdmitCardTemplate';
import SessionSettings from './SessionSettings';
import ReportCard from './ReportCard';
import ExamHallDuty from './ExamHallDuty';
import { HomeworkItem, Notice } from '../types';
import GuardianDashboard from './GuardianDashboard';
import TeacherDashboard from './TeacherDashboard';
import AccountantDashboard from './AccountantDashboard';
import { ReportsManager } from './ReportsManager';
import ClassSections from './ClassSections';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const gpaTrendData = [
  { semester: 'Summer 24', gpa: 4.25, bnSemester: '‡¶ó‡ßç‡¶∞‡ßÄ‡¶∑‡ßç‡¶Æ ‡ß®‡ß™' },
  { semester: 'Winter 24', gpa: 4.50, bnSemester: '‡¶∂‡ßÄ‡¶§ ‡ß®‡ß™' },
  { semester: 'Summer 25', gpa: 4.75, bnSemester: '‡¶ó‡ßç‡¶∞‡ßÄ‡¶∑‡ßç‡¶Æ ‡ß®‡ß´' },
  { semester: 'Winter 25', gpa: 4.85, bnSemester: '‡¶∂‡ßÄ‡¶§ ‡ß®‡ß´' },
  { semester: 'Summer 26', gpa: 5.00, bnSemester: '‡¶ó‡ßç‡¶∞‡ßÄ‡¶∑‡ßç‡¶Æ ‡ß®‡ß¨' },
];

const formatToNiceEnglish = (str: string) => {
  if (!str) return "";
  if (str === "STUDENTS CARE MODEL SCHOOL") {
    return "Students Care Model School";
  }
  if (str === str.toUpperCase()) {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return str;
};

interface StudentPortalProps {
  lang: 'bn' | 'en';
  onBackToHome?: () => void;
}

export default function StudentPortal({ lang: propLang, onBackToHome }: StudentPortalProps) {
  // Local dynamic language state
  const [lang, setLang] = useState<'bn' | 'en'>(() => {
    const saved = localStorage.getItem('portal_lang');
    if (saved === 'en' || saved === 'bn') return saved;
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('portal_lang', lang);
  }, [lang]);

  useEffect(() => {
    const fetchLiveBannerSettings = async () => {
      try {
        const res = await fetch(getApiUrl('/api/banner'));
        if (res.ok) {
          const text = await res.text();
          if (!text.trim().startsWith('<?php') && !text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
            const data = JSON.parse(text);
            if (data && data.frontend_data) {
              setFrontendData((prev: any) => ({
                ...prev,
                ...data.frontend_data
              }));
            }
            if (data && data.settings) {
              setFrontendData((prev: any) => ({
                ...prev,
                settings: {
                  ...prev?.settings,
                  ...data.settings
                }
              }));
            }
            if (data && data.slider) {
              setFrontendData((prev: any) => ({
                ...prev,
                slider: data.slider
              }));
            }
          }
        }
      } catch (err: any) {
        // Silent catch for background banner sync
      }
    };
    fetchLiveBannerSettings();
  }, []);

  // Login Panel States
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student' | 'accountant' | 'superadmin'>(() => {
    return (localStorage.getItem('portal_selectedRole') as any) || 'admin';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('portal_username') || 'admin';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('portal_password') || 'admin';
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('portal_isLoggedIn') === 'true';
  });
  const [loggedInRole, setLoggedInRole] = useState<'admin' | 'teacher' | 'student' | 'accountant' | 'superadmin' | null>(() => {
    return (localStorage.getItem('portal_loggedInRole') as any) || null;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('portal_rememberMe') !== 'false';
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg(lang === 'bn' ? "‡¶®‡¶§‡ßÅ‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶Æ‡¶ø‡¶≤‡¶õ‡ßá ‡¶®‡¶æ!" : "New passwords do not match!");
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username, // Assuming username is email
          old_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAdminSuccessMsg(lang === 'bn' ? "‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!" : "Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        addAuditLog("Admin changed dashboard entry password.");
      } else {
        setErrorMsg(data.message || (lang === 'bn' ? "‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§" : "Failed to update password."));
      }
    } catch (err) {
      setErrorMsg(lang === 'bn' ? "‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶æ‡¶∞‡ßá ‡¶∏‡¶Æ‡¶∏‡ßç‡¶Ø‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§" : "Server error.");
    }
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  // Custom states for Redesigned Admin Dashboard
  const [adminActiveTab, setAdminActiveTab] = useState<string>(() => {
    return localStorage.getItem('portal_adminActiveTab') || 'dashboard';
  });

  // Sync session states to localStorage
  useEffect(() => {
    localStorage.setItem('portal_isLoggedIn', isLoggedIn ? 'true' : 'false');
    if (loggedInRole) {
      localStorage.setItem('portal_loggedInRole', loggedInRole);
    } else {
      localStorage.removeItem('portal_loggedInRole');
    }
  }, [isLoggedIn, loggedInRole]);

  useEffect(() => {
    localStorage.setItem('portal_selectedRole', selectedRole);
    if (rememberMe) {
      localStorage.setItem('portal_username', username);
      localStorage.setItem('portal_password', password);
    } else {
      localStorage.removeItem('portal_username');
      localStorage.removeItem('portal_password');
    }
    localStorage.setItem('portal_rememberMe', rememberMe ? 'true' : 'false');
  }, [selectedRole, username, password, rememberMe]);

  useEffect(() => {
    localStorage.setItem('portal_adminActiveTab', adminActiveTab);
  }, [adminActiveTab]);

  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isPreviewRefreshing, setIsPreviewRefreshing] = useState<boolean>(false);
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [isGuardianSidebarOpen, setIsGuardianSidebarOpen] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [smsGatewayStatus, setSmsGatewayStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsTargetClass, setSmsTargetClass] = useState('All');
  
  // Frontend settings and submenus state
  const [frontendSubTab, setFrontendSubTab] = useState<string>('banner');
  const [cardSubTab, setCardSubTab] = useState<string>('id_card');
  const [isFrontendMenuExpanded, setIsFrontendMenuExpanded] = useState<boolean>(true);
  const [isSettingsMenuExpanded, setIsSettingsMenuExpanded] = useState<boolean>(true);
  const [isCardMenuExpanded, setIsCardMenuExpanded] = useState<boolean>(false);
  
  // Page section editing state helpers
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionEditLabelBn, setSectionEditLabelBn] = useState('');
  const [sectionEditLabelEn, setSectionEditLabelEn] = useState('');
  const [sectionEditDescBn, setSectionEditDescBn] = useState('');
  const [sectionEditDescEn, setSectionEditDescEn] = useState('');
  const [sectionEditOrder, setSectionEditOrder] = useState<number>(1);
  const [activeDocTab, setActiveDocTab] = useState<string>('editor');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [sectionSearchQuery, setSectionSearchQuery] = useState<string>('');
  
  // Custom printable ID card state
  const [idCardData, setIdCardData] = useState({
    name: '',
    class: '',
    roll: '',
    bloodGroup: '',
    guardianPhone: '',
    session: '2026',
    photo: null as string | null
  });

  const [idCardFilterClass, setIdCardFilterClass] = useState('Class 3');
  const [idCardFilterSection, setIdCardFilterSection] = useState('A');
  const bulkPrintRef = useRef<HTMLDivElement>(null);

  const generateBulkPDF = () => {
    const element = bulkPrintRef.current;
    if (!element) return;
    const opt = {
      margin: 5,
      filename: `ID_Cards_${idCardFilterClass}_${idCardFilterSection}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setIdCardData(prev => ({
        ...prev,
        name: student.name,
      }));
    }
  };

  // Custom printable Certificate state
  const [certificateData, setCertificateData] = useState({
    studentName: 'Maya Rahman',
    className: 'Class 6',
    cause: 'Outstanding performance in Mathematics and co-curricular activities',
    issueDate: '2026-07-06',
    principalName: 'Mohammad Zakir Hosen',
    template: 'classic',
    backgroundImage: null as string | null,
    fontSize: 16,
    fontColor: '#000000',
    fatherName: '',
    motherName: '',
    roll: '',
    dateOfBirth: '',
    refNo: '',
    classGrade: '',
    customBody: '‡¶è‡¶á ‡¶Æ‡¶∞‡ßç‡¶Æ‡ßá ‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡ßü‡¶® ‡¶ï‡¶∞‡¶æ ‡¶Ø‡¶æ‡¶ö‡ßç‡¶õ‡ßá ‡¶Ø‡ßá, [‡¶®‡¶æ‡¶Æ], ‡¶™‡¶ø‡¶§‡¶æ: [‡¶¨‡¶æ‡¶¨‡¶æ], ‡¶Æ‡¶æ‡¶§‡¶æ: [‡¶Æ‡¶æ]‡•§ ‡¶∏‡ßá ‡¶Ö‡¶§‡ßç‡¶∞ ‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶æ‡¶≤‡ßü‡ßá‡¶∞ [‡¶∂‡ßç‡¶∞‡ßá‡¶£‡¶ø] ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡¶ø‡¶∞ ‡¶è‡¶ï‡¶ú‡¶® ‡¶®‡¶ø‡ßü‡¶Æ‡¶ø‡¶§ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡•§ ‡¶§‡¶æ‡¶∞ ‡¶∞‡ßã‡¶≤ ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ [‡¶∞‡ßã‡¶≤] ‡¶è‡¶¨‡¶Ç ‡¶ú‡¶®‡ßç‡¶Æ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ [‡¶ú‡¶®‡ßç‡¶Æ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ]‡•§\n\n‡¶∏‡ßá ‡¶Ö‡¶§‡ßç‡¶∞ ‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶æ‡¶≤‡ßü‡ßá‡¶∞ ‡¶è‡¶ï‡¶ú‡¶® ‡¶Æ‡ßá‡¶ß‡¶æ‡¶¨‡ßÄ ‡¶è‡¶¨‡¶Ç ‡¶Ö‡¶®‡ßÅ‡¶ó‡¶§ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡•§ ‡¶Ü‡¶Æ‡¶ø ‡¶§‡¶æ‡¶∞ ‡¶â‡¶ú‡ßç‡¶ú‡ßç‡¶¨‡¶≤ ‡¶≠‡¶¨‡¶ø‡¶∑‡ßç‡¶Ø‡ßé ‡¶ï‡¶æ‡¶Æ‡¶®‡¶æ ‡¶ï‡¶∞‡¶ø.'
  });

  // Custom printable Testimonial state
  const [testimonialData, setTestimonialData] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    roll: '',
    regNo: '',
    session: '',
    classExam: '',
    gpa: '',
    description: '',
    backgroundImage: null as string | null,
    fontSize: 14,
    fontColor: '#000000'
  });
  const [savedDesigns, setSavedDesigns] = useState<{name: string, settings: typeof certificateData}[]>([]);
  const [newDesignName, setNewDesignName] = useState('');

  const [showAdmitCardFor, setShowAdmitCardFor] = useState<any | null>(null);

  const [certificateSubTab, setCertificateSubTab] = useState<string>('generate');

  // Student Details submenu expansion and active sub-tab
  const [isStudentDetailsExpanded, setIsStudentDetailsExpanded] = useState(true);
  const [studentDetailsSubTab, setStudentDetailsSubTab] = useState<'student_list' | 'login_deactivate' | 'deactivate_reason'>('student_list');

  // Employee menu expansion and active sub-tab
  const [isEmployeeMenuExpanded, setIsEmployeeMenuExpanded] = useState(true);
  const [employeeSubTab, setEmployeeSubTab] = useState<'employee_list' | 'add_department' | 'add_designation' | 'add_employee' | 'login_deactivate'>('employee_list');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [selectedEmployeeDeptFilter, setSelectedEmployeeDeptFilter] = useState('All');
  const [employeeDepartments, setEmployeeDepartments] = useState<string[]>(() => {
    const saved = localStorage.getItem('school_employee_departments');
    return saved ? JSON.parse(saved) : ['Science', 'Humanities', 'Business Studies', 'Mathematics', 'Language', 'Accounts & Administration', 'General'];
  });
  const [employeeDesignations, setEmployeeDesignations] = useState<string[]>(() => {
    const saved = localStorage.getItem('school_employee_designations');
    return saved ? JSON.parse(saved) : ['Headmaster/Headmistress', 'Assistant Headmaster', 'Senior Lecturer', 'Faculty Member', 'Senior Accountant', 'Office Assistant', 'IT Support', 'Security Guard'];
  });

  useEffect(() => {
    localStorage.setItem('school_employee_departments', JSON.stringify(employeeDepartments));
  }, [employeeDepartments]);

  useEffect(() => {
    localStorage.setItem('school_employee_designations', JSON.stringify(employeeDesignations));
  }, [employeeDesignations]);

  // Academic menu expansion and active sub-tab
  const [isAcademicMenuExpanded, setIsAcademicMenuExpanded] = useState(true);
  const [academicSubTab, setAcademicSubTab] = useState<
    | 'class_section'
    | 'subject'
    | 'class_schedule'
    | 'class_routine'
    | 'teacher_class_routine'
    | 'routine_overview'
    | 'exam_hall_duty'
    | 'seat_arrangement'
    | 'teacher_schedule'
    | 'promotion'
  >('class_schedule');

  // Academic Classes list state
  const [academicClasses, setAcademicClasses] = useState<Array<{ id: string; name: string; shift: string; group: string; classTeacher: string }>>(() => {
    const saved = localStorage.getItem('school_academic_classes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'c1', name: 'Class 9-A', shift: 'Morning', group: 'Science', classTeacher: 'Mr. Abdul Hye' },
      { id: 'c2', name: 'Class 8-A', shift: 'Morning', group: 'General', classTeacher: 'Mrs. Tasnim Jahan' },
      { id: 'c3', name: 'Class 7-A', shift: 'Day', group: 'General', classTeacher: 'Mrs. Shamima Sultana' },
      { id: 'c4', name: 'Class 10-A', shift: 'Morning', group: 'Science', classTeacher: 'Mr. Rafiqul Islam' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('school_academic_classes', JSON.stringify(academicClasses));
  }, [academicClasses]);

  // Academic Subjects list state
  const [academicSubjects, setAcademicSubjects] = useState<Array<{ code: string; name: string; class: string; teacher: string; type?: string; isCombined?: boolean; parentSubject?: string }>>(() => {
    const saved = localStorage.getItem('school_academic_subjects');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { code: 'PHY-101', name: 'Physics', class: 'Class 9-A', teacher: 'Mr. Abdul Hye', type: 'Theory' },
      { code: 'CHE-102', name: 'Chemistry', class: 'Class 9-A', teacher: 'Dr. Farhana Rahman', type: 'Practical' },
      { code: 'MTH-103', name: 'Higher Math', class: 'Class 9-A', teacher: 'Mr. Rafiqul Islam', type: 'Theory' },
      { code: 'BIO-104', name: 'Biology', class: 'Class 9-A', teacher: 'Dr. Farhana Rahman', type: 'Practical' },
      { code: 'ENG-201', name: 'English', class: 'Class 8-A', teacher: 'Mrs. Tasnim Jahan', type: 'Theory' },
      { code: 'BEN-202', name: 'Bengali', class: 'Class 8-A', teacher: 'Mrs. Shamima Sultana', type: 'Theory' },
      { code: 'MAT-203', name: 'General Math', class: 'Class 8-A', teacher: 'Mr. Rafiqul Islam', type: 'Theory' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('school_academic_subjects', JSON.stringify(academicSubjects));
  }, [academicSubjects]);

  // Class Schedules state mapped as [class_name][day-period] -> {subject, teacher, room, isBreak}
  const [schedules, setSchedules] = useState<Record<string, Record<string, { subject: string; teacher: string; room: string; isBreak: boolean }>>>(() => {
    const saved = localStorage.getItem('school_class_schedules');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      'Class 9-A': {
        'Sun-Period 1': { subject: 'Physics', teacher: 'Mr. Abdul Hye', room: '301', isBreak: false },
        'Sun-Period 2': { subject: 'Chemistry', teacher: 'Dr. Farhana Rahman', room: '302', isBreak: false },
        'Sun-Period 3': { subject: 'English', teacher: 'Mrs. Tasnim Jahan', room: '301', isBreak: false },
        'Sun-Period 4': { subject: 'General Math', teacher: 'Mr. Rafiqul Islam', room: '301', isBreak: false },
        'Sun-Period 5': { subject: 'Bengali', teacher: 'Mrs. Shamima Sultana', room: '301', isBreak: false },
        'Sun-Period 6': { subject: 'ICT', teacher: 'Mr. Imran Hosen', room: 'Lab 1', isBreak: false },
        'Mon-Period 1': { subject: 'Chemistry', teacher: 'Dr. Farhana Rahman', room: '302', isBreak: false },
        'Mon-Period 2': { subject: 'Higher Math', teacher: 'Mr. Rafiqul Islam', room: '301', isBreak: false },
        'Mon-Period 3': { subject: 'Physics', teacher: 'Mr. Abdul Hye', room: '301', isBreak: false },
        'Mon-Period 4': { subject: 'English', teacher: 'Mrs. Tasnim Jahan', room: '301', isBreak: false },
        'Mon-Period 5': { subject: 'Biology', teacher: 'Dr. Farhana Rahman', room: '301', isBreak: false },
        'Mon-Period 6': { subject: 'Religion', teacher: 'Mrs. Shamima Sultana', room: '301', isBreak: false },
        'Tue-Period 1': { subject: 'Physics', teacher: 'Mr. Abdul Hye', room: '301', isBreak: false },
        'Tue-Period 2': { subject: 'General Math', teacher: 'Mr. Rafiqul Islam', room: '301', isBreak: false },
        'Tue-Period 3': { subject: 'Chemistry', teacher: 'Dr. Farhana Rahman', room: '302', isBreak: false },
        'Tue-Period 4': { subject: 'English', teacher: 'Mrs. Tasnim Jahan', room: '301', isBreak: false },
        'Tue-Period 5': { subject: 'Biology', teacher: 'Dr. Farhana Rahman', room: '301', isBreak: false },
        'Tue-Period 6': { subject: 'ICT', teacher: 'Mr. Imran Hosen', room: 'Lab 1', isBreak: false },
        'Wed-Period 1': { subject: 'Higher Math', teacher: 'Mr. Rafiqul Islam', room: '301', isBreak: false },
        'Wed-Period 2': { subject: 'Chemistry', teacher: 'Dr. Farhana Rahman', room: '302', isBreak: false },
        'Wed-Period 3': { subject: 'Physics', teacher: 'Mr. Abdul Hye', room: '301', isBreak: false },
        'Wed-Period 4': { subject: 'English', teacher: 'Mrs. Tasnim Jahan', room: '301', isBreak: false },
        'Wed-Period 5': { subject: 'Bengali', teacher: 'Mrs. Shamima Sultana', room: '301', isBreak: false },
        'Wed-Period 6': { subject: 'Religion', teacher: 'Mrs. Shamima Sultana', room: '301', isBreak: false },
        'Thu-Period 1': { subject: 'Biology', teacher: 'Dr. Farhana Rahman', room: '301', isBreak: false },
        'Thu-Period 2': { subject: 'Higher Math', teacher: 'Mr. Rafiqul Islam', room: '301', isBreak: false },
        'Thu-Period 3': { subject: 'English', teacher: 'Mrs. Tasnim Jahan', room: '301', isBreak: false },
        'Thu-Period 4': { subject: 'Bengali', teacher: 'Mrs. Shamima Sultana', room: '301', isBreak: false },
        'Thu-Period 5': { subject: 'Physics', teacher: 'Mr. Abdul Hye', room: '301', isBreak: false },
        'Thu-Period 6': { subject: 'ICT', teacher: 'Mr. Imran Hosen', room: 'Lab 1', isBreak: false }
      },
      'Class 8-A': {
        'Sun-Period 1': { subject: 'General Math', teacher: 'Mr. Rafiqul Islam', room: '204', isBreak: false },
        'Sun-Period 2': { subject: 'English', teacher: 'Mrs. Tasnim Jahan', room: '204', isBreak: false },
        'Sun-Period 3': { subject: 'Bengali', teacher: 'Mrs. Shamima Sultana', room: '204', isBreak: false },
        'Sun-Period 4': { subject: 'Science', teacher: 'Mr. Abdul Hye', room: '204', isBreak: false },
        'Sun-Period 5': { subject: 'Religion', teacher: 'Mrs. Shamima Sultana', room: '204', isBreak: false },
        'Sun-Period 6': { subject: 'ICT', teacher: 'Mr. Imran Hosen', room: 'Lab 2', isBreak: false },
        'Mon-Period 1': { subject: 'English', teacher: 'Mrs. Tasnim Jahan', room: '204', isBreak: false },
        'Mon-Period 2': { subject: 'Bengali', teacher: 'Mrs. Shamima Sultana', room: '204', isBreak: false },
        'Mon-Period 3': { subject: 'General Math', teacher: 'Mr. Rafiqul Islam', room: '204', isBreak: false },
        'Mon-Period 4': { subject: 'Science', teacher: 'Mr. Abdul Hye', room: '204', isBreak: false },
        'Mon-Period 5': { subject: 'Social Studies', teacher: 'Mrs. Tasnim Jahan', room: '204', isBreak: false },
        'Mon-Period 6': { subject: 'Arts & Craft', teacher: 'Mrs. Shamima Sultana', room: '204', isBreak: false }
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('school_class_schedules', JSON.stringify(schedules));
  }, [schedules]);

  // Exam Hall Duties state
  const [examHallDuties, setExamHallDuties] = useState<Array<{ id: string; examName: string; date: string; room: string; invigilator: string; shift: string }>>(() => {
    const saved = localStorage.getItem('school_exam_duties');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'EHD-001', examName: 'Half-Yearly Exam 2026', date: '2026-07-15', room: 'Room 301', invigilator: 'Mr. Abdul Hye', shift: 'Morning' },
      { id: 'EHD-002', examName: 'Half-Yearly Exam 2026', date: '2026-07-15', room: 'Room 302', invigilator: 'Dr. Farhana Rahman', shift: 'Morning' },
      { id: 'EHD-003', examName: 'Half-Yearly Exam 2026', date: '2026-07-16', room: 'Room 301', invigilator: 'Mr. Rafiqul Islam', shift: 'Morning' },
      { id: 'EHD-004', examName: 'Half-Yearly Exam 2026', date: '2026-07-16', room: 'Room 303', invigilator: 'Mrs. Tasnim Jahan', shift: 'Morning' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('school_exam_duties', JSON.stringify(examHallDuties));
  }, [examHallDuties]);

  // Seat Arrangements state
  const [seatArrangements, setSeatArrangements] = useState<Array<{ id: string; examName: string; classLevel: string; hallName: string; capacity: number; date: string }>>(() => {
    const saved = localStorage.getItem('school_seat_arrangements');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'SA-001', examName: 'Half-Yearly Exam 2026', classLevel: 'Class 9-A', hallName: 'Main Assembly Hall', capacity: 40, date: '2026-07-15' },
      { id: 'SA-002', examName: 'Half-Yearly Exam 2026', classLevel: 'Class 8-A', hallName: 'Auditorium Annex', capacity: 35, date: '2026-07-15' },
      { id: 'SA-003', examName: 'Half-Yearly Exam 2026', classLevel: 'Class 10-A', hallName: 'Main Assembly Hall', capacity: 45, date: '2026-07-16' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('school_seat_arrangements', JSON.stringify(seatArrangements));
  }, [seatArrangements]);

  // UI Interactive States for Academic management
  const [classScheduleActiveClass, setClassScheduleActiveClass] = useState<string>('Class 9-A');
  const [classScheduleCopyTarget, setClassScheduleCopyTarget] = useState<string>('');
  const [draggedCell, setDraggedCell] = useState<{ day: string; period: string } | null>(null);
  const [developerActiveTab, setDeveloperActiveTab] = useState<string>('overview');
  const [developerCopiedId, setDeveloperCopiedId] = useState<string | null>(null);

  // Teacher Class Routine active state variables
  const [routineTeachers, setRoutineTeachers] = useState<string[]>(() => {
    const saved = localStorage.getItem('school_routine_teachers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ['Mr. Abdul Hye', 'Dr. Farhana Rahman', 'Mr. Rafiqul Islam', 'Mrs. Tasnim Jahan', 'Mrs. Shamima Sultana', 'Mr. M. A. Hasan', 'Mr. Imran Hosen'];
  });

  const [teacherAvailability, setTeacherAvailability] = useState<Record<string, { type: string; offDays: string[] }>>(() => {
    const saved = localStorage.getItem('school_teacher_availability');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      'Mr. Abdul Hye': { type: 'Full-time', offDays: ['Fri', 'Sat'] },
      'Dr. Farhana Rahman': { type: 'Full-time', offDays: ['Fri', 'Sat'] },
      'Mr. Rafiqul Islam': { type: 'Full-time', offDays: ['Fri', 'Sat'] },
      'Mrs. Tasnim Jahan': { type: 'Full-time', offDays: ['Fri', 'Sat'] },
      'Mrs. Shamima Sultana': { type: 'Full-time', offDays: ['Fri', 'Sat'] },
      'Mr. M. A. Hasan': { type: 'Full-time', offDays: ['Fri', 'Sat'] },
      'Mr. Imran Hosen': { type: 'Full-time', offDays: ['Fri', 'Sat'] }
    };
  });

  useEffect(() => {
    localStorage.setItem('school_routine_teachers', JSON.stringify(routineTeachers));
  }, [routineTeachers]);

  useEffect(() => {
    localStorage.setItem('school_teacher_availability', JSON.stringify(teacherAvailability));
  }, [teacherAvailability]);

  // Teacher Class Routine state variables
  const [activeAddModal, setActiveAddModal] = useState<{ teacherName: string; periodId: string } | null>(null);
  const [addForm, setAddForm] = useState({ day: 'Sun', classId: 'Class 9-A', subject: 'Physics', room: '301' });

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const [newClassInput, setNewClassInput] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState({ code: '', name: '', class: 'Class 9-A', teacher: '' });

  // Exam Terms State and UI Expanded States
  const [examSubTab, setExamSubTab] = useState<string>('exam_term');
  const [isExamMenuExpanded, setIsExamMenuExpanded] = useState<boolean>(true);
  const [isExamControllerMenuExpanded, setIsExamControllerMenuExpanded] = useState<boolean>(true);
  const [examControllerSubTab, setExamControllerSubTab] = useState<string>('exam_hall_duty');

  const toggleExclusiveMenu = (menuToOpen: 'student_details' | 'frontend' | 'settings' | 'employee' | 'academic' | 'exam' | 'exam_controller' | 'card') => {
    setIsStudentDetailsExpanded(menuToOpen === 'student_details' ? !isStudentDetailsExpanded : false);
    setIsFrontendMenuExpanded(menuToOpen === 'frontend' ? !isFrontendMenuExpanded : false);
    setIsSettingsMenuExpanded(menuToOpen === 'settings' ? !isSettingsMenuExpanded : false);
    setIsEmployeeMenuExpanded(menuToOpen === 'employee' ? !isEmployeeMenuExpanded : false);
    setIsAcademicMenuExpanded(menuToOpen === 'academic' ? !isAcademicMenuExpanded : false);
    setIsExamMenuExpanded(menuToOpen === 'exam' ? !isExamMenuExpanded : false);
    setIsExamControllerMenuExpanded(menuToOpen === 'exam_controller' ? !isExamControllerMenuExpanded : false);
    setIsCardMenuExpanded(menuToOpen === 'card' ? !isCardMenuExpanded : false);
  };

  const openOnlyMenu = (menuToOpen: 'student_details' | 'frontend' | 'settings' | 'employee' | 'academic' | 'exam' | 'exam_controller' | 'card') => {
    setIsStudentDetailsExpanded(menuToOpen === 'student_details');
    setIsFrontendMenuExpanded(menuToOpen === 'frontend');
    setIsSettingsMenuExpanded(menuToOpen === 'settings');
    setIsEmployeeMenuExpanded(menuToOpen === 'employee');
    setIsAcademicMenuExpanded(menuToOpen === 'academic');
    setIsExamMenuExpanded(menuToOpen === 'exam');
    setIsExamControllerMenuExpanded(menuToOpen === 'exam_controller');
    setIsCardMenuExpanded(menuToOpen === 'card');
  };

  const [editingExamTermId, setEditingExamTermId] = useState<string | null>(null);
  const [newExamTermForm, setNewExamTermForm] = useState({
    name: '',
    year: 2026,
    startDate: '',
    endDate: '',
    status: 'Upcoming' as 'Upcoming' | 'Active' | 'Completed',
    resultDate: '',
    weightage: 0,
    description: ''
  });

  const [examTerms, setExamTerms] = useState<Array<{
    id: string;
    name: string;
    year: number;
    startDate: string;
    endDate: string;
    status: 'Upcoming' | 'Active' | 'Completed';
    resultDate: string;
    weightage: number;
    description?: string;
  }>>(() => {
    const saved = localStorage.getItem('school_exam_terms');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'T-1', name: 'First Term', year: 2026, startDate: '2026-03-01', endDate: '2026-03-15', status: 'Completed', resultDate: '2026-03-25', weightage: 25, description: 'First term general examination for academic evaluation.' },
      { id: 'T-2', name: 'Mid Term', year: 2026, startDate: '2026-07-01', endDate: '2026-07-15', status: 'Active', resultDate: '2026-07-25', weightage: 25, description: 'Mid term assessment focusing on half-yearly curriculum.' },
      { id: 'T-3', name: 'Final Term', year: 2026, startDate: '2026-12-01', endDate: '2026-12-20', status: 'Upcoming', resultDate: '2026-12-30', weightage: 50, description: 'Annual comprehensive evaluation for grade promotion.' }
    ];
  });

  const [selectedExamTermDetailId, setSelectedExamTermDetailId] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<string | null>(null);

  const [examRoutines, setExamRoutines] = useState<{ [termId: string]: Array<{ id: string; subject: string; date: string; time: string; class: string; room: string }> }>(() => {
    const saved = localStorage.getItem('school_exam_routines');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      'T-1': [
        { id: 'R-1', subject: 'English & Literature', date: '2026-03-02', time: '10:00 AM - 01:00 PM', class: 'Class 9', room: 'Room 101' },
        { id: 'R-2', subject: 'Bangla Grammar & Arts', date: '2026-03-04', time: '10:00 AM - 01:00 PM', class: 'Class 9', room: 'Room 101' },
        { id: 'R-3', subject: 'Advanced Mathematics', date: '2026-03-06', time: '10:00 AM - 01:00 PM', class: 'Class 9', room: 'Room 102' }
      ],
      'T-2': [
        { id: 'R-4', subject: 'Chemistry (Theoretical)', date: '2026-07-12', time: '10:00 AM - 01:00 PM', class: 'Class 9', room: 'Room 201' },
        { id: 'R-5', subject: 'Physics & Lab Practice', date: '2026-07-14', time: '10:00 AM - 01:00 PM', class: 'Class 9', room: 'Room 202' },
        { id: 'R-6', subject: 'Higher Mathematics', date: '2026-07-16', time: '10:00 AM - 01:00 PM', class: 'Class 9', room: 'Room 203' }
      ],
      'T-3': [
        { id: 'R-7', subject: 'General Science', date: '2026-12-02', time: '10:00 AM - 01:00 PM', class: 'Class 9', room: 'Room 103' },
        { id: 'R-8', subject: 'Social Studies', date: '2026-12-04', time: '10:00 AM - 01:00 PM', class: 'Class 9', room: 'Room 104' }
      ]
    };
  });

  const [teacherDuties, setTeacherDuties] = useState<{ [termId: string]: Array<{ id: string; date: string; teacherName: string; designation: string; room: string }> }>(() => {
    const saved = localStorage.getItem('school_teacher_duties');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      'T-1': [
        { id: 'D-1', date: '2026-03-02', teacherName: 'Mrs. Rokeya Begum', designation: 'Faculty Member', room: 'Room 101' },
        { id: 'D-2', date: '2026-03-04', teacherName: 'Mr. Hasan Al Banna', designation: 'Assistant Headmaster', room: 'Room 101' }
      ],
      'T-2': [
        { id: 'D-3', date: '2026-07-12', teacherName: 'Ms. Nila Chowdhury', designation: 'Headmistress & Senior Lecturer', room: 'Room 201' },
        { id: 'D-4', date: '2026-07-14', teacherName: 'Mr. Hasan Al Banna', designation: 'Assistant Headmaster', room: 'Room 202' },
        { id: 'D-5', date: '2026-07-16', teacherName: 'Mrs. Rokeya Begum', designation: 'Faculty Member', room: 'Room 203' }
      ],
      'T-3': [
        { id: 'D-6', date: '2026-12-02', teacherName: 'Ms. Nila Chowdhury', designation: 'Headmistress & Senior Lecturer', room: 'Room 103' }
      ]
    };
  });

  const [attendanceSheetClassFilter, setAttendanceSheetClassFilter] = useState('Class 9');
  const [attendanceSheetSubjectFilter, setAttendanceSheetSubjectFilter] = useState('Chemistry');

  // Dedicated states for Exam Setup Tab
  const [examSetups, setExamSetups] = useState<Array<{
    id: string;
    termId: string;
    class: string;
    subject: string;
    writtenMarks: number;
    writtenPassMarks: number;
    mcqMarks: number;
    mcqPassMarks: number;
    practicalMarks: number;
    practicalPassMarks: number;
    totalMarks: number;
    passMarks: number;
  }>>(() => {
    const saved = localStorage.getItem('school_exam_setups');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'ES-1', termId: 'T-2', class: 'Class 9-A', subject: 'Chemistry', writtenMarks: 50, writtenPassMarks: 17, mcqMarks: 25, mcqPassMarks: 8, practicalMarks: 25, practicalPassMarks: 8, totalMarks: 100, passMarks: 33 },
      { id: 'ES-2', termId: 'T-2', class: 'Class 9-A', subject: 'Physics', writtenMarks: 50, writtenPassMarks: 17, mcqMarks: 25, mcqPassMarks: 8, practicalMarks: 25, practicalPassMarks: 8, totalMarks: 100, passMarks: 33 },
      { id: 'ES-3', termId: 'T-2', class: 'Class 8-A', subject: 'English', writtenMarks: 80, writtenPassMarks: 26, mcqMarks: 20, mcqPassMarks: 7, practicalMarks: 0, practicalPassMarks: 0, totalMarks: 100, passMarks: 33 },
      { id: 'ES-4', termId: 'T-1', class: 'Class 9-A', subject: 'Bengali', writtenMarks: 70, writtenPassMarks: 23, mcqMarks: 30, mcqPassMarks: 10, practicalMarks: 0, practicalPassMarks: 0, totalMarks: 100, passMarks: 33 },
    ];
  });

  const [setupFormTermId, setSetupFormTermId] = useState<string>('T-2');
  const [setupFormClass, setSetupFormClass] = useState<string>('Class 9-A');
  const [setupFormSubject, setSetupFormSubject] = useState<string>('Chemistry');
  const [setupFormWritten, setSetupFormWritten] = useState<number>(50);
  const [setupFormWrittenPass, setSetupFormWrittenPass] = useState<number>(17);
  const [setupFormMCQ, setSetupFormMCQ] = useState<number>(25);
  const [setupFormMCQPass, setSetupFormMCQPass] = useState<number>(8);
  const [setupFormPractical, setSetupFormPractical] = useState<number>(25);
  const [setupFormPracticalPass, setSetupFormPracticalPass] = useState<number>(8);
  const [setupFormPassMarks, setSetupFormPassMarks] = useState<number>(33);
  const [editingSetupId, setEditingSetupId] = useState<string | null>(null);

  const [setupFilterTermId, setSetupFilterTermId] = useState<string>('All');
  const [setupFilterClass, setSetupFilterClass] = useState<string>('All');

  // Dedicated states for Exam Schedule Tab
  const [scheduleFormTermId, setScheduleFormTermId] = useState<string>('T-2');
  const [scheduleFormClass, setScheduleFormClass] = useState<string>('Class 9-A');
  const [scheduleFormSubject, setScheduleFormSubject] = useState<string>('Chemistry');
  const [scheduleFormDate, setScheduleFormDate] = useState<string>('2026-07-12');
  const [scheduleFormStartTime, setScheduleFormStartTime] = useState<string>('10:00 AM');
  const [scheduleFormEndTime, setScheduleFormEndTime] = useState<string>('01:00 PM');
  const [scheduleFormRoom, setScheduleFormRoom] = useState<string>('Room 201');
  const [editingScheduleId, setEditingScheduleId] = useState<{ termId: string; id: string } | null>(null);

  const [scheduleFilterTermId, setScheduleFilterTermId] = useState<string>('All');
  const [scheduleFilterClass, setScheduleFilterClass] = useState<string>('All');

  // New forms for routine and duty additions
  const [newRoutineForm, setNewRoutineForm] = useState({
    subject: '',
    date: '',
    time: '10:00 AM - 01:00 PM',
    class: 'Class 9',
    room: 'Room 201'
  });

  const [newDutyForm, setNewDutyForm] = useState({
    date: '',
    teacherName: '',
    designation: '',
    room: 'Room 201'
  });

  useEffect(() => {
    localStorage.setItem('school_exam_terms', JSON.stringify(examTerms));
  }, [examTerms]);

  useEffect(() => {
    localStorage.setItem('school_exam_routines', JSON.stringify(examRoutines));
  }, [examRoutines]);

  useEffect(() => {
    localStorage.setItem('school_teacher_duties', JSON.stringify(teacherDuties));
  }, [teacherDuties]);

  useEffect(() => {
    localStorage.setItem('school_exam_setups', JSON.stringify(examSetups));
  }, [examSetups]);

  // Dedicated states for Exam Marks Tab
  const [examStudentMarks, setExamStudentMarks] = useState<Array<{
    id: string;
    termId: string;
    class: string;
    subject: string;
    studentId: string;
    written: number;
    mcq: number;
    practical: number;
    total: number;
    isAbsent: boolean;
  }>>(() => {
    const saved = localStorage.getItem('school_exam_student_marks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'M-1', termId: 'T-2', class: 'Class 9-A', subject: 'Chemistry', studentId: 'STD-1026', written: 42, mcq: 20, practical: 22, total: 84, isAbsent: false },
      { id: 'M-2', termId: 'T-2', class: 'Class 9-A', subject: 'Physics', studentId: 'STD-1026', written: 40, mcq: 18, practical: 24, total: 82, isAbsent: false },
      { id: 'M-3', termId: 'T-2', class: 'Class 9-A', subject: 'Chemistry', studentId: 'STD-1031', written: 0, mcq: 0, practical: 0, total: 0, isAbsent: true },
    ];
  });

  const [marksFormTermId, setMarksFormTermId] = useState<string>('T-2');
  const [marksFormClass, setMarksFormClass] = useState<string>('Class 9-A');
  const [marksFormSubject, setMarksFormSubject] = useState<string>('Chemistry');
  const [marksFormSession, setMarksFormSession] = useState<string>('2026');
  const [isMarksSearchActive, setIsMarksSearchActive] = useState<boolean>(false);
  const [tempMarksInput, setTempMarksInput] = useState<Record<string, { written: number; mcq: number; practical: number; isAbsent: boolean }>>({});

  useEffect(() => {
    localStorage.setItem('school_exam_student_marks', JSON.stringify(examStudentMarks));
  }, [examStudentMarks]);

  // Dedicated states for Exam Hall Management
  const [examHalls, setExamHalls] = useState<Array<{
    id: string;
    roomName: string;
    capacity: number;
    location: string;
    status: 'Available' | 'Booked';
  }>>(() => {
    const saved = localStorage.getItem('school_exam_halls');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'H-1', roomName: 'Room 101', capacity: 40, location: 'Building A, 1st Floor', status: 'Booked' },
      { id: 'H-2', roomName: 'Room 202', capacity: 35, location: 'Building A, 2nd Floor', status: 'Booked' },
      { id: 'H-3', roomName: 'Main Hall', capacity: 120, location: 'Building B, Ground Floor', status: 'Available' },
    ];
  });

  const [hallFormName, setHallFormName] = useState('');
  const [hallFormCapacity, setHallFormCapacity] = useState<number | ''>('');
  const [hallFormLocation, setHallFormLocation] = useState('');
  const [hallFormStatus, setHallFormStatus] = useState<'Available' | 'Booked'>('Available');
  const [editingHallId, setEditingHallId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('school_exam_halls', JSON.stringify(examHalls));
  }, [examHalls]);

  // Dedicated states for Exam Routine Management
  const [examRoutinesList, setExamRoutinesList] = useState<Array<{
    id: string;
    termId: string;
    className: string;
    section: string;
    date: string;
    day: string;
    subjectCode: string;
    subjectName: string;
    time: string;
    room: string;
  }>>(() => {
    const saved = localStorage.getItem('school_exam_routines_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      // Class 9, Section A (Mid Term)
      { id: 'R-1', termId: 'T-2', className: 'Class 9', section: 'Section A', date: '2026-07-12', day: 'Sunday', subjectCode: 'CHE-101', subjectName: 'Chemistry', time: '10:00 AM - 01:00 PM', room: 'Room 101' },
      { id: 'R-2', termId: 'T-2', className: 'Class 9', section: 'Section A', date: '2026-07-14', day: 'Tuesday', subjectCode: 'PHY-102', subjectName: 'Physics & Lab Practice', time: '10:00 AM - 01:00 PM', room: 'Room 202' },
      { id: 'R-3', termId: 'T-2', className: 'Class 9', section: 'Section A', date: '2026-07-16', day: 'Thursday', subjectCode: 'HMA-103', subjectName: 'Higher Mathematics', time: '10:00 AM - 01:00 PM', room: 'Main Hall' },
      { id: 'R-4', termId: 'T-2', className: 'Class 9', section: 'Section A', date: '2026-07-19', day: 'Sunday', subjectCode: 'BEN-104', subjectName: 'Bengali Literature', time: '10:00 AM - 01:00 PM', room: 'Room 101' },
      { id: 'R-5', termId: 'T-2', className: 'Class 9', section: 'Section A', date: '2026-07-21', day: 'Tuesday', subjectCode: 'ENG-105', subjectName: 'English Language', time: '10:00 AM - 01:00 PM', room: 'Room 202' },

      // Class 9, Section B (Mid Term)
      { id: 'R-6', termId: 'T-2', className: 'Class 9', section: 'Section B', date: '2026-07-12', day: 'Sunday', subjectCode: 'CHE-101', subjectName: 'Chemistry', time: '10:00 AM - 01:00 PM', room: 'Room 202' },
      { id: 'R-7', termId: 'T-2', className: 'Class 9', section: 'Section B', date: '2026-07-14', day: 'Tuesday', subjectCode: 'PHY-102', subjectName: 'Physics & Lab Practice', time: '10:00 AM - 01:00 PM', room: 'Room 101' },
      { id: 'R-8', termId: 'T-2', className: 'Class 9', section: 'Section B', date: '2026-07-16', day: 'Thursday', subjectCode: 'HMA-103', subjectName: 'Higher Mathematics', time: '10:00 AM - 01:00 PM', room: 'Room 202' },

      // Class 8, Section A (Mid Term)
      { id: 'R-9', termId: 'T-2', className: 'Class 8', section: 'Section A', date: '2026-07-12', day: 'Sunday', subjectCode: 'MAT-201', subjectName: 'General Mathematics', time: '10:00 AM - 01:00 PM', room: 'Main Hall' },
      { id: 'R-10', termId: 'T-2', className: 'Class 8', section: 'Section A', date: '2026-07-14', day: 'Tuesday', subjectCode: 'SCI-202', subjectName: 'General Science', time: '10:00 AM - 01:00 PM', room: 'Room 101' },
      { id: 'R-11', termId: 'T-2', className: 'Class 8', section: 'Section A', date: '2026-07-16', day: 'Thursday', subjectCode: 'ENG-203', subjectName: 'English Reading', time: '10:00 AM - 01:00 PM', room: 'Room 202' },

      // Class 7, Section A (Mid Term)
      { id: 'R-12', termId: 'T-2', className: 'Class 7', section: 'Section A', date: '2026-07-12', day: 'Sunday', subjectCode: 'BGS-301', subjectName: 'Bangladesh & Global Studies', time: '10:00 AM - 01:00 PM', room: 'Room 101' },
      { id: 'R-13', termId: 'T-2', className: 'Class 7', section: 'Section A', date: '2026-07-14', day: 'Tuesday', subjectCode: 'REL-302', subjectName: 'Religion & Moral Education', time: '10:00 AM - 01:00 PM', room: 'Room 202' },

      // First Term (T-1) routines
      { id: 'R-14', termId: 'T-1', className: 'Class 9', section: 'Section A', date: '2026-03-02', day: 'Monday', subjectCode: 'CHE-101', subjectName: 'Chemistry (Theoretical)', time: '10:00 AM - 01:00 PM', room: 'Room 101' },
      { id: 'R-15', termId: 'T-1', className: 'Class 9', section: 'Section A', date: '2026-03-04', day: 'Wednesday', subjectCode: 'PHY-102', subjectName: 'Physics (Theoretical)', time: '10:00 AM - 01:00 PM', room: 'Room 202' },
    ];
  });

  const [routineFormTermId, setRoutineFormTermId] = useState('T-2');
  const [routineFormClass, setRoutineFormClass] = useState('Class 9');
  const [routineFormSection, setRoutineFormSection] = useState('Section A');
  const [isRoutineSearched, setIsRoutineSearched] = useState(true);

  // States for routine editing
  const [routineNewDate, setRoutineNewDate] = useState('');
  const [routineNewDay, setRoutineNewDay] = useState('Sunday');
  const [routineNewCode, setRoutineNewCode] = useState('');
  const [routineNewSubject, setRoutineNewSubject] = useState('');
  const [routineNewTime, setRoutineNewTime] = useState('10:00 AM - 01:00 PM');
  const [routineNewRoom, setRoutineNewRoom] = useState('Room 101');
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [isAddingRoutineRow, setIsAddingRoutineRow] = useState(false);

  useEffect(() => {
    localStorage.setItem('school_exam_routines_list', JSON.stringify(examRoutinesList));
  }, [examRoutinesList]);

  // Dedicated states for Exam Mark Distribution
  const [markDistributions, setMarkDistributions] = useState<Array<{
    id: string;
    className: string;
    assessmentName: string;
    terms: Array<{ name: string; percentage: number }>;
  }>>(() => {
    const saved = localStorage.getItem('school_mark_distributions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'D-1',
        className: 'Class 9',
        assessmentName: 'Final Result 2026',
        terms: [
          { name: 'Mid Term Exam', percentage: 30 },
          { name: 'Final Exam', percentage: 70 }
        ]
      },
      {
        id: 'D-2',
        className: 'Class 8',
        assessmentName: 'Academic Session 2026',
        terms: [
          { name: 'Mid Term Exam', percentage: 40 },
          { name: 'Final Exam', percentage: 60 }
        ]
      },
      {
        id: 'D-3',
        className: 'Class 7',
        assessmentName: 'Annual Promotion 2026',
        terms: [
          { name: 'First Term Exam', percentage: 20 },
          { name: 'Mid Term Exam', percentage: 30 },
          { name: 'Final Exam', percentage: 50 }
        ]
      }
    ];
  });

  const [distFormClass, setDistFormClass] = useState('Class 9');
  const [distFormAssessmentName, setDistFormAssessmentName] = useState('Final Result 2026');
  const [distFormTerms, setDistFormTerms] = useState<Array<{ name: string; percentage: number }>>([
    { name: 'Mid Term Exam', percentage: 30 },
    { name: 'Final Exam', percentage: 70 }
  ]);
  const [editingDistId, setEditingDistId] = useState<string | null>(null);
  const [newCustomTermName, setNewCustomTermName] = useState('');

  useEffect(() => {
    localStorage.setItem('school_mark_distributions', JSON.stringify(markDistributions));
  }, [markDistributions]);

  // Dedicated states for Class & Section management
  const [classSectionsList, setClassSectionsList] = useState<Array<{
    id: string;
    className: string;
    numericName: string;
    sections: string[];
  }>>(() => {
    const saved = localStorage.getItem('school_class_sections_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'CS-1', className: 'Class 9', numericName: '9', sections: ['A', 'B'] },
      { id: 'CS-2', className: 'Class 10', numericName: '10', sections: ['A', 'B', 'C'] },
      { id: 'CS-3', className: 'Class 8', numericName: '8', sections: ['A', 'B'] },
      { id: 'CS-4', className: 'Class 7', numericName: '7', sections: ['A'] }
    ];
  });

  const [csFormClassName, setCsFormClassName] = useState('Class 9');
  const [csFormNumericName, setCsFormNumericName] = useState('9');
  const [csFormSections, setCsFormSections] = useState<string[]>(['A', 'B']);
  const [editingCsId, setEditingCsId] = useState<string | null>(null);
  const [customSectionInput, setCustomSectionInput] = useState('');

  // Extra states for academic subtabs to avoid violating the Rules of Hooks
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [viewingSeatingId, setViewingSeatingId] = useState<string>('SA-001');
  const [sourceClass, setSourceClass] = useState<string>('Class 8-A');
  const [targetClass, setTargetClass] = useState<string>('Class 9-A');
  const [minGPA, setMinGPA] = useState<number>(3.00);
  const [promotionLogged, setPromotionLogged] = useState<boolean>(false);
  const [editingSubjectCode, setEditingSubjectCode] = useState<string | null>(null);
  const [subjectFilterClass, setSubjectFilterClass] = useState<string>('All');

  useEffect(() => {
    localStorage.setItem('school_class_sections_list', JSON.stringify(classSectionsList));
  }, [classSectionsList]);

  // Settings State and Sub Tabs
  const [settingsSubTab, setSettingsSubTab] = useState<string>('login_banner');
  const [schoolSettings, setSchoolSettings] = useState(() => {
    const saved = localStorage.getItem('school_general_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      schoolName: 'Students Care Model School',
      schoolNameEn: 'STUDENTS CARE MODEL SCHOOL',
      schoolNameBn: '‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡ßü‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤',
      schoolLogo: '',
      headerNotice: '‡¶∏‡¶´‡¶ü‡¶ì‡ßü‡ßç‡¶Ø‡¶æ‡¶∞ ‡¶§‡ßà‡¶∞‡¶ø ‡¶ì ‡¶∞‡¶ï‡ßç‡¶∑‡¶£‡¶æ‡¶¨‡ßá‡¶ï‡ßç‡¶∑‡¶£‡ßá: ‡¶Æ‡ßã. ‡¶á‡¶Æ‡¶∞‡¶æ‡¶® ‡¶π‡ßã‡¶∏‡ßá‡¶®, ‡¶∏‡¶ø‡¶®‡¶ø‡ßü‡¶∞ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï, ‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡ßü‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤',
      bannerEnabled: true,
      headerBgColor: '#1E63D3',
      addressEn: 'Charlakshya, Karnaphuli, Chittagong',
      addressBn: '‡¶ö‡¶∞‡¶≤‡¶ï‡ßç‡¶∑‡ßç‡¶Ø‡¶æ, ‡¶ï‡¶∞‡ßç‡¶£‡¶´‡ßÅ‡¶≤‡ßÄ, ‡¶ö‡¶ü‡ßç‡¶ü‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ',
      activeYear: 'Session 2026',
      officeMobile: '01856-478940',
      officeAddress: 'Charlakshya, Karnaphuli, Chittagong',
      primaryPassMarks: 33,
      examPassMarks: 33,
      cronEnabled: true,
      testimonialHeading: 'TO WHOM IT MAY CONCERN',
      customFields: [
        { id: 'F-1', name: 'Blood Group', type: 'Text', required: false },
        { id: 'F-2', name: 'Birth Certificate No', type: 'Number', required: true }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('school_general_settings', JSON.stringify(schoolSettings));
  }, [schoolSettings]);

  // Forms for adding academic items
  const [academicNewClassForm, setAcademicNewClassForm] = useState({ name: '', shift: 'Morning', group: 'General', classTeacher: '' });
  const [academicNewSubjectForm, setAcademicNewSubjectForm] = useState({ code: '', name: '', class: 'Class 9-A', teacher: '', type: 'Theory', isCombined: false, parentSubject: '' });
  const [academicNewDutyForm, setAcademicNewDutyForm] = useState({ examName: 'Half-Yearly Exam 2026', date: '2026-07-15', room: '', invigilator: '', shift: 'Morning' });
  const [academicNewSeatingForm, setAcademicNewSeatingForm] = useState({ examName: 'Half-Yearly Exam 2026', classLevel: 'Class 9-A', hallName: '', capacity: 40, date: '2026-07-15' });

  // States for Class & Section smarter features
  const [classFilterSearch, setClassFilterSearch] = useState('');
  const [classFilterShift, setClassFilterShift] = useState('All');
  const [classFilterGroup, setClassFilterGroup] = useState('All');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportInput, setBulkImportInput] = useState('');
  const [selectedClassForStudentList, setSelectedClassForStudentList] = useState<string | null>(null);
  const [classViewMode, setClassViewMode] = useState<'grid' | 'table'>('grid');

  // Admin Profile & Dropdown States
  const [adminProfile, setAdminProfile] = useState(() => {
    const saved = localStorage.getItem('school_admin_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      name: 'Md. Imran Hosen',
      email: 'studentscare2006@gmail.com',
      phone: '+880 1814913049',
      designation: 'Senior Teacher & Admin Office',
      bio: 'Dedicated educator and administrator at Students Care Model School.',
      avatar: 'M',
      address: '‡¶ö‡¶∞‡¶≤‡¶ï‡ßç‡¶∑‡ßç‡¶Ø‡¶æ, ‡¶ï‡¶∞‡ßç‡¶£‡¶´‡ßÅ‡¶≤‡ßÄ, ‡¶ö‡¶ü‡ßç‡¶ü‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ',
      gender: 'Male',
      bloodGroup: 'O+',
      joinDate: '2018-01-15'
    };
  });
  const [isAdminProfileModalOpen, setIsAdminProfileModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAdminMailboxModalOpen, setIsAdminMailboxModalOpen] = useState(false);

  // Sync profile to localStorage on changes
  useEffect(() => {
    localStorage.setItem('school_admin_profile', JSON.stringify(adminProfile));
  }, [adminProfile]);

  // Student list state initialized with the 12 students matching the list and more
  const [students, setStudents] = useState<Array<{
    id: string;
    photo: string;
    name: string;
    class: string;
    section: string;
    roll: string;
    group: string;
    guardianName: string;
    guardianPhone: string;
    status: 'Active' | 'Inactive';
    loginActive: boolean;
    deactivateReason?: string;
  }>>(() => {
    const local = localStorage.getItem('school_students');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Error parsing school_students from localStorage', e);
      }
    }
    return [
      { id: 'STD-1024', photo: '', name: 'Aarav Hossain', class: '8', section: 'A', roll: '12', group: 'General', guardianName: 'Rashid Hossain', guardianPhone: '+880 1711-223344', status: 'Active', loginActive: true, bloodGroup: 'O+', birthRegistration: '20121511613012345', fatherName: 'Rashid Hossain', motherName: 'Sultana Begum', fatherNid: '5541234567', motherNid: '5541234568', presentAddress: 'Charlakshya, Karnaphuli, Chattogram', permanentAddress: 'Charlakshya, Karnaphuli, Chattogram', dob: '2012-05-15', gender: 'Male' },
      { id: 'STD-1025', photo: '', name: 'Maya Rahman', class: '6', section: 'B', roll: '05', group: 'General', guardianName: 'Sumi Rahman', guardianPhone: '+880 1712-998877', status: 'Active', loginActive: true, bloodGroup: 'A+', birthRegistration: '20141511613012999', fatherName: 'Fazlur Rahman', motherName: 'Sumi Rahman', fatherNid: '5541234511', motherNid: '5541234512', presentAddress: 'Charlakshya Road, Karnaphuli, Chattogram', permanentAddress: 'Charlakshya Road, Karnaphuli, Chattogram', dob: '2014-08-20', gender: 'Female' },
      { id: 'STD-1026', photo: '', name: 'Tanvir Ahmed', class: '9', section: 'A', roll: '18', group: 'Science', guardianName: 'Karim Ahmed', guardianPhone: '+880 1718-554433', status: 'Active', loginActive: true, bloodGroup: 'B+', birthRegistration: '20111511613012888', fatherName: 'Karim Ahmed', motherName: 'Taslima Begum', fatherNid: '5541234521', motherNid: '5541234522', presentAddress: 'Ichanagar, Karnaphuli, Chattogram', permanentAddress: 'Mirkhas, Patiya, Chattogram', dob: '2011-03-10', gender: 'Male' },
      { id: 'STD-1027', photo: '', name: 'Nadia Islam', class: '7', section: 'C', roll: '22', group: 'General', guardianName: 'Lipi Islam', guardianPhone: '+880 1719-112233', status: 'Inactive', loginActive: false, deactivateReason: 'Fees Overdue', bloodGroup: 'AB+', birthRegistration: '20131511613012777', fatherName: 'Mofizul Islam', motherName: 'Lipi Islam', fatherNid: '5541234531', motherNid: '5541234532', presentAddress: 'Julodha, Karnaphuli, Chattogram', permanentAddress: 'Julodha, Karnaphuli, Chattogram', dob: '2013-11-22', gender: 'Female' },
      { id: 'STD-1028', photo: '', name: 'Rafiq Karim', class: '10', section: 'B', roll: '03', group: 'Science', guardianName: 'Jamal Karim', guardianPhone: '+880 1722-665544', status: 'Active', loginActive: true, bloodGroup: 'O-', birthRegistration: '20101511613012666', fatherName: 'Jamal Karim', motherName: 'Nazmun Nahar', fatherNid: '5541234541', motherNid: '5541234542', presentAddress: 'Charlakshya Bazar, Karnaphuli, Chattogram', permanentAddress: 'Anwara, Chattogram', dob: '2010-01-05', gender: 'Male' },
      { id: 'STD-1029', photo: '', name: 'Priya Das', class: '5', section: 'A', roll: '09', group: 'General', guardianName: 'Anil Das', guardianPhone: '+880 1731-778899', status: 'Active', loginActive: true, bloodGroup: 'B-', birthRegistration: '20151511613012555', fatherName: 'Anil Das', motherName: 'Saraswati Das', fatherNid: '5541234551', motherNid: '5541234552', presentAddress: 'Dangarchar, Karnaphuli, Chattogram', permanentAddress: 'Dangarchar, Karnaphuli, Chattogram', dob: '2015-06-18', gender: 'Female' },
      { id: 'STD-1030', photo: '', name: 'Sami Akhter', class: '8', section: 'B', roll: '14', group: 'General', guardianName: 'Nazma Akhter', guardianPhone: '+880 1741-334455', status: 'Active', loginActive: true, bloodGroup: 'A-', birthRegistration: '20121511613012444', fatherName: 'Shamsul Alam', motherName: 'Nazma Akhter', fatherNid: '5541234561', motherNid: '5541234562', presentAddress: 'Charlakshya, Karnaphuli, Chattogram', permanentAddress: 'Charlakshya, Karnaphuli, Chattogram', dob: '2012-09-12', gender: 'Male' },
      { id: 'STD-1031', photo: '', name: 'Imran Hossain', class: '9', section: 'B', roll: '21', group: 'Science', guardianName: 'Bashir Hossain', guardianPhone: '+880 1751-877766', status: 'Inactive', loginActive: false, deactivateReason: 'Academic Suspension', bloodGroup: 'AB-', birthRegistration: '20111511613012333', fatherName: 'Bashir Hossain', motherName: 'Fatema Begum', fatherNid: '5541234571', motherNid: '5541234572', presentAddress: 'Sikalbaha, Karnaphuli, Chattogram', permanentAddress: 'Sikalbaha, Karnaphuli, Chattogram', dob: '2011-12-01', gender: 'Male' },
      { id: 'STD-1032', photo: '', name: 'Farhan Masud', class: '7', section: 'B', roll: '07', group: 'General', guardianName: 'Masudur Rahman', guardianPhone: '+880 1761-334455', status: 'Active', loginActive: true, bloodGroup: 'O+', birthRegistration: '20131511613012222', fatherName: 'Masudur Rahman', motherName: 'Israt Jahan', fatherNid: '5541234581', motherNid: '5541234582', presentAddress: 'Charlakshya Block C, Karnaphuli, Chattogram', permanentAddress: 'Sandwip, Chattogram', dob: '2013-04-15', gender: 'Male' },
      { id: 'STD-1033', photo: '', name: 'Zayan Khan', class: '8', section: 'A', roll: '11', group: 'General', guardianName: 'Shamin Khan', guardianPhone: '+880 1771-889900', status: 'Active', loginActive: true, bloodGroup: 'A+', birthRegistration: '20121511613012111', fatherName: 'Shamin Khan', motherName: 'Nusrat Jahan', fatherNid: '5541234591', motherNid: '5541234592', presentAddress: 'Ichanagar, Karnaphuli, Chattogram', permanentAddress: 'Ichanagar, Karnaphuli, Chattogram', dob: '2012-02-28', gender: 'Male' },
      { id: 'STD-1034', photo: '', name: 'Tasfia Tabassum', class: '6', section: 'C', roll: '15', group: 'General', guardianName: 'Rafiqul Islam', guardianPhone: '+880 1781-445566', status: 'Active', loginActive: true, bloodGroup: 'B+', birthRegistration: '20141511613012000', fatherName: 'Rafiqul Islam', motherName: 'Shahana Begum', fatherNid: '5541234501', motherNid: '5541234502', presentAddress: 'Julodha Union, Karnaphuli, Chattogram', permanentAddress: 'Julodha Union, Karnaphuli, Chattogram', dob: '2014-10-05', gender: 'Female' },
      { id: 'STD-1035', photo: '', name: 'Sadia Afrin', class: '10', section: 'A', roll: '02', group: 'Science', guardianName: 'Selim Afrin', guardianPhone: '+880 1791-223344', status: 'Active', loginActive: true, bloodGroup: 'O+', birthRegistration: '20101511613012456', fatherName: 'Selim Afrin', motherName: 'Rina Afrin', fatherNid: '5541234611', motherNid: '5541234612', presentAddress: 'Charlakshya Road, Karnaphuli, Chattogram', permanentAddress: 'Patiya, Chattogram', dob: '2010-07-25', gender: 'Female' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('school_students', JSON.stringify(students));
  }, [students]);

  // ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶•‡ßá‡¶ï‡ßá ‡¶≤‡¶æ‡¶á‡¶≠ ‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü ‡¶≤‡¶ø‡¶∏‡ßç‡¶ü ‡¶≤‡ßã‡¶° ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø
  useEffect(() => {
    const fetchStudentsFromDatabase = async () => {
      try {
        const response = await fetch(getApiUrl('/api/students'));
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶•‡ßá‡¶ï‡ßá ‡¶Ü‡¶∏‡¶æ ‡¶°‡ßá‡¶ü‡¶æ‡¶ï‡ßá ‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü ‡¶≤‡¶ø‡¶∏‡ßç‡¶ü ‡¶∏‡ßç‡¶ü‡ßá‡¶ü‡ßá ‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®
            setStudents(data);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch students from live database, fallback to local storage:', err);
      }
    };

    fetchStudentsFromDatabase();
  }, []);

  // Dynamic Employee / Faculty state representing the database for faculty & staff
  const [employees, setEmployees] = useState<Array<{
    name: string;
    role: string;
    subject: string;
    email: string;
    phone: string;
    status: 'Active' | 'Inactive';
  }>>([
    { name: 'Ms. Nila Chowdhury', role: 'Headmistress & Senior Lecturer', subject: 'English & Literature', email: 'nila.c@scms.edu.bd', phone: '01819-223344', status: 'Active' },
    { name: 'Mr. Hasan Al Banna', role: 'Assistant Headmaster', subject: 'Advanced Mathematics', email: 'hasan.b@scms.edu.bd', phone: '01715-998877', status: 'Active' },
    { name: 'Mrs. Rokeya Begum', role: 'Faculty Member', subject: 'Bangla Grammar & Arts', email: 'rokeya.b@scms.edu.bd', phone: '01912-334455', status: 'Active' },
    { name: 'Mr. Rafiqul Islam', role: 'Information Tech Lead', subject: 'Computer Science', email: 'rafiqul.i@scms.edu.bd', phone: '01515-667788', status: 'Active' },
    { name: 'Mr. Mizanur Rahman', role: 'Senior Accountant', subject: 'Accounts & Cash Book', email: 'mizan.r@scms.edu.bd', phone: '01612-445566', status: 'Active' },
  ]);

  const [schoolClasses, setSchoolClasses] = useState<Array<{
    id: string;
    name: string;
    level: string;
    sections: string[];
    shifts: string[];
    groups?: string[];
    teacher: string;
    studentCount: number;
    attendanceAvg: number;
    subjects: Array<{ code: string; name: string }>;
    sectionAssignments?: Array<{
      section: string;
      shift: string;
      teacher: string;
      subjects: Array<{ code: string; name: string }>;
    }>;
  }>>(() => {
    const local = localStorage.getItem('school_classes_v1');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Error parsing school_classes', e);
      }
    }
    return [
      {
        id: 'class_6',
        name: 'Class 6',
        level: 'Secondary',
        sections: ['A', 'B'],
        shifts: ['Morning', 'Day'],
        teacher: 'Mrs. Rokeya Begum',
        studentCount: 85,
        attendanceAvg: 92,
        subjects: [
          { code: '101', name: 'Bangla' },
          { code: '107', name: 'English' },
          { code: '109', name: 'General Mathematics' },
          { code: '111', name: 'General Science' },
          { code: '113', name: 'Bangladesh & Global Studies' }
        ]
      },
      {
        id: 'class_7',
        name: 'Class 7',
        level: 'Secondary',
        sections: ['A', 'B'],
        shifts: ['Morning', 'Day'],
        teacher: 'Mr. Rafiqul Islam',
        studentCount: 85,
        attendanceAvg: 92,
        subjects: [
          { code: '101', name: 'Bangla' },
          { code: '107', name: 'English' },
          { code: '109', name: 'General Mathematics' },
          { code: '111', name: 'General Science' },
          { code: '113', name: 'Bangladesh & Global Studies' }
        ]
      },
      {
        id: 'class_8',
        name: 'Class 8',
        level: 'Secondary',
        sections: ['A', 'B'],
        shifts: ['Morning', 'Day'],
        teacher: 'Ms. Nila Chowdhury',
        studentCount: 85,
        attendanceAvg: 92,
        subjects: [
          { code: '101', name: 'Bangla' },
          { code: '107', name: 'English' },
          { code: '109', name: 'General Mathematics' },
          { code: '111', name: 'General Science' },
          { code: '113', name: 'Bangladesh & Global Studies' }
        ]
      },
      {
        id: 'class_9',
        name: 'Class 9',
        level: 'Secondary',
        sections: ['A', 'B'],
        shifts: ['Morning', 'Day'],
        groups: ['Science', 'Arts', 'Commerce'],
        teacher: 'Mr. Hasan Al Banna',
        studentCount: 85,
        attendanceAvg: 92,
        subjects: [
          { code: '101', name: 'Bangla' },
          { code: '107', name: 'English' },
          { code: '109', name: 'Mathematics' },
          { code: '136', name: 'Physics' },
          { code: '137', name: 'Chemistry' },
          { code: '138', name: 'Biology' }
        ]
      },
      {
        id: 'class_10',
        name: 'Class 10',
        level: 'Secondary',
        sections: ['A', 'B'],
        shifts: ['Morning', 'Day'],
        groups: ['Science', 'Arts', 'Commerce'],
        teacher: 'Mr. Rafiqul Islam',
        studentCount: 85,
        attendanceAvg: 92,
        subjects: [
          { code: '101', name: 'Bangla' },
          { code: '107', name: 'English' },
          { code: '109', name: 'Mathematics' },
          { code: '136', name: 'Physics' },
          { code: '137', name: 'Chemistry' },
          { code: '138', name: 'Biology' }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('school_classes_v1', JSON.stringify(schoolClasses));
  }, [schoolClasses]);

  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    name: '',
    level: 'Secondary',
    sections: 'A, B',
    shifts: ['Morning', 'Day'] as string[],
    groups: [] as string[],
    teacher: '',
    studentCount: 85,
    attendanceAvg: 92,
  });

  const [activeSubjectClassId, setActiveSubjectClassId] = useState<string | null>(null);
  const [activeEditClassId, setActiveEditClassId] = useState<string | null>(null);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const getAssignments = (c: typeof schoolClasses[0]) => {
    if (c.sectionAssignments && c.sectionAssignments.length > 0) {
      return c.sectionAssignments;
    }
    const defaults: Array<{
      section: string;
      shift: string;
      teacher: string;
      subjects: Array<{ code: string; name: string }>;
    }> = [];
    c.sections.forEach(sec => {
      const activeShifts = c.shifts && c.shifts.length > 0 ? c.shifts : ['Morning', 'Day'];
      activeShifts.forEach(sh => {
        defaults.push({
          section: sec,
          shift: sh,
          teacher: c.teacher || '',
          subjects: [...c.subjects]
        });
      });
    });
    return defaults;
  };

  const [isSyncingDb, setIsSyncingDb] = useState(false);

  const updateSectionTeacher = (classId: string, section: string, shift: string, teacherName: string) => {
    setSchoolClasses(prev => prev.map(c => {
      if (c.id === classId) {
        const currentAssignments = [...getAssignments(c)];
        const idx = currentAssignments.findIndex(asg => asg.section === section && asg.shift === shift);
        if (idx !== -1) {
          currentAssignments[idx] = {
            ...currentAssignments[idx],
            teacher: teacherName
          };
        } else {
          currentAssignments.push({
            section,
            shift,
            teacher: teacherName,
            subjects: [...c.subjects]
          });
        }
        return { ...c, sectionAssignments: currentAssignments };
      }
      return c;
    }));
  };

  const toggleSectionSubject = (classId: string, section: string, shift: string, subject: { code: string; name: string }) => {
    setSchoolClasses(prev => prev.map(c => {
      if (c.id === classId) {
        const currentAssignments = [...getAssignments(c)];
        const idx = currentAssignments.findIndex(asg => asg.section === section && asg.shift === shift);
        if (idx !== -1) {
          const asg = { ...currentAssignments[idx] };
          const subExists = asg.subjects.some(s => s.code === subject.code);
          if (subExists) {
            asg.subjects = asg.subjects.filter(s => s.code !== subject.code);
          } else {
            asg.subjects = [...asg.subjects, subject];
          }
          currentAssignments[idx] = asg;
        } else {
          currentAssignments.push({
            section,
            shift,
            teacher: '',
            subjects: [subject]
          });
        }
        return { ...c, sectionAssignments: currentAssignments };
      }
      return c;
    }));
  };

  // Reports & Analytics Module States
  const [reportStartDate, setReportStartDate] = useState('2026-01-01');
  const [reportEndDate, setReportEndDate] = useState('2026-12-31');
  const [reportClass, setReportClass] = useState('All');
  const [reportSection, setReportSection] = useState('All');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [activeReportSubTab, setActiveReportSubTab] = useState<'financial' | 'academic' | 'attendance' | 'registry' | 'developer'>('financial');
  const [activeReportOption, setActiveReportOption] = useState<string>('sibling_report');
  const [expandedReportCategories, setExpandedReportCategories] = useState<Record<string, boolean>>({
    student_reports: true,
    fees_reports: true,
    financial_reports: true,
    attendance_reports: true,
    human_resource_reports: true,
    examination_reports: true
  });
  const [reportPage, setReportPage] = useState(1);
  const [reportEntriesPerPage, setReportEntriesPerPage] = useState(5);

  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: '',
    role: '',
    subject: '',
    email: '',
    phone: '',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const [newDepartmentInput, setNewDepartmentInput] = useState('');
  const [newDesignationInput, setNewDesignationInput] = useState('');

  // Google Drive State Hook Integration
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'My Drive' }
  ]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadDriveFiles = async (folderId: string, tokenToUse?: string) => {
    const activeToken = tokenToUse || driveToken || getAccessToken();
    if (!activeToken) return;
    setIsDriveLoading(true);
    setUploadError(null);
    try {
      const files = await listDriveFiles(folderId);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error loading Drive files:', err);
      setUploadError(err.message || 'Failed to load files from Google Drive.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setDriveToken(token);
        if (adminActiveTab === 'google_drive') {
          loadDriveFiles(currentFolderId, token);
        }
      },
      () => {
        setGoogleUser(null);
        setDriveToken(null);
      }
    );
    return () => unsubscribe();
  }, [adminActiveTab, currentFolderId]);

  // Add Student Form States
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentPhotoFile, setStudentPhotoFile] = useState<File | null>(null);
  const [viewingStudentDetails, setViewingStudentDetails] = useState<any | null>(null);
  const [viewingAdmissionForm, setViewingAdmissionForm] = useState<any | null>(null);
  const [viewingAdmitCard, setViewingAdmitCard] = useState<any | null>(null);
  
  // Edit Student Form States
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentPhotoFile, setEditStudentPhotoFile] = useState<File | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    fullName: '',
    className: '',
    section: '',
    rollNumber: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    birthRegistration: '',
    studentPhoto: '',

    fatherPhoto: '',
    motherPhoto: '',
    fatherName: '',
    motherName: '',
    fatherProfession: '',
    motherProfession: '',
    fatherNid: '',
    motherNid: '',
    fatherMobile: '',
    motherMobile: '',
    fatherDob: '',
    motherDob: '',

    guardianName: '',
    careOf: '',
    relationWithGuardian: '',
    guardianMobile: '',
    presentAddress: '',
    permanentAddress: '',

    village: '',
    postOffice: '',
    thana: '',
    district: '',
    religion: '',
    nationality: '‡¶¨‡¶æ‡¶Ç‡¶≤‡¶æ‡¶¶‡ßá‡¶∂‡ßÄ',

    prevClass: '',
    prevRoll: '',
    prevSchool: '',
    status: 'Active' as 'Active' | 'Inactive',
    loginActive: true,
  });

  const handleEditStudentClick = (std: any) => {
    setEditingStudentId(std.id);
    setEditStudentForm({
      fullName: std.name || '',
      className: std.class || '',
      section: std.section || '',
      rollNumber: std.roll || '',
      dob: std.dob || '',
      gender: std.gender || '',
      bloodGroup: std.bloodGroup || '',
      birthRegistration: std.birthRegistration || '',
      studentPhoto: std.photo || '',

      fatherPhoto: std.fatherPhoto || '',
      motherPhoto: std.motherPhoto || '',
      fatherName: std.fatherName || '',
      motherName: std.motherName || '',
      fatherProfession: std.fatherProfession || '',
      motherProfession: std.motherProfession || '',
      fatherNid: std.fatherNid || '',
      motherNid: std.motherNid || '',
      fatherMobile: std.fatherMobile || '',
      motherMobile: std.motherMobile || '',
      fatherDob: std.fatherDob || '',
      motherDob: std.motherDob || '',

      guardianName: std.guardianName || '',
      careOf: std.careOf || '',
      relationWithGuardian: std.relationWithGuardian || '',
      guardianMobile: std.guardianPhone || std.guardianMobile || '',
      presentAddress: std.presentAddress || '',
      permanentAddress: std.permanentAddress || '',

      village: std.village || '',
      postOffice: std.postOffice || '',
      thana: std.thana || '',
      district: std.district || '',
      religion: std.religion || '',
      nationality: std.nationality || '‡¶¨‡¶æ‡¶Ç‡¶≤‡¶æ‡¶¶‡ßá‡¶∂‡ßÄ',

      prevClass: std.prevClass || '',
      prevRoll: std.prevRoll || '',
      prevSchool: std.prevSchool || '',
      status: std.status || 'Active',
      loginActive: std.loginActive !== undefined ? std.loginActive : true,
    });
    setEditStudentPhotoFile(null);
    setIsEditStudentModalOpen(true);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentForm.fullName || !editStudentForm.className || !editStudentForm.section || !editStudentForm.rollNumber || !editStudentForm.guardianMobile) {
      alert(lang === 'bn' ? '‡¶¶‡ßü‡¶æ ‡¶ï‡¶∞‡ßá ‡¶§‡¶æ‡¶∞‡¶ï‡¶æ ‡¶ö‡¶ø‡¶π‡ßç‡¶®‡¶ø‡¶§ (*) ‡¶Ü‡¶¨‡¶∂‡ßç‡¶Ø‡¶ï ‡¶ï‡ßç‡¶∑‡ßá‡¶§‡ßç‡¶∞‡¶ó‡ßÅ‡¶≤‡ßã ‡¶™‡ßÇ‡¶∞‡¶£ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§' : 'Please fill all required (*) fields: Full Name, Class, Section, Roll Number, and Guardian Mobile Number.');
      return;
    }

    setStudents(prev => prev.map(std => {
      if (std.id === editingStudentId) {
        return {
          ...std,
          photo: editStudentForm.studentPhoto || std.photo,
          name: editStudentForm.fullName,
          class: editStudentForm.className,
          section: editStudentForm.section,
          roll: editStudentForm.rollNumber.padStart(2, '0'),
          group: editStudentForm.className === '9' || editStudentForm.className === '10' ? 'Science' : 'General',
          guardianName: editStudentForm.guardianName || editStudentForm.fatherName || 'Parent / Guardian',
          guardianPhone: editStudentForm.guardianMobile,
          status: editStudentForm.status,
          loginActive: editStudentForm.loginActive,
          
          // Optional extra fields:
          dob: editStudentForm.dob,
          gender: editStudentForm.gender,
          bloodGroup: editStudentForm.bloodGroup,
          birthRegistration: editStudentForm.birthRegistration,
          fatherName: editStudentForm.fatherName,
          motherName: editStudentForm.motherName,
          fatherProfession: editStudentForm.fatherProfession,
          motherProfession: editStudentForm.motherProfession,
          fatherNid: editStudentForm.fatherNid,
          motherNid: editStudentForm.motherNid,
          fatherMobile: editStudentForm.fatherMobile,
          motherMobile: editStudentForm.motherMobile,
          fatherDob: editStudentForm.fatherDob,
          motherDob: editStudentForm.motherDob,
          careOf: editStudentForm.careOf,
          relationWithGuardian: editStudentForm.relationWithGuardian,
          presentAddress: editStudentForm.presentAddress,
          permanentAddress: editStudentForm.permanentAddress,
          village: editStudentForm.village,
          postOffice: editStudentForm.postOffice,
          thana: editStudentForm.thana,
          district: editStudentForm.district,
          religion: editStudentForm.religion,
          nationality: editStudentForm.nationality,
          prevClass: editStudentForm.prevClass,
          prevRoll: editStudentForm.prevRoll,
          prevSchool: editStudentForm.prevSchool,
        };
      }
      return std;
    }));

    setAdminSuccessMsg(lang === 'bn'
      ? `${editStudentForm.fullName} ‡¶è‡¶∞ ‡¶§‡¶•‡ßç‡¶Ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!`
      : `Successfully updated ${editStudentForm.fullName}'s information in the student roster database!`
    );

    setTimeout(() => {
      setAdminSuccessMsg('');
    }, 5000);

    setIsEditStudentModalOpen(false);
    setEditingStudentId(null);
  };

  const [addStudentForm, setAddStudentForm] = useState({
    // 1. Basic Info
    fullName: '',
    className: '',
    section: '',
    rollNumber: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    birthRegistration: '',
    studentPhoto: '',

     // 2. Parents' Info
    fatherPhoto: '',
    motherPhoto: '',
    fatherName: '',
    motherName: '',
    fatherProfession: '',
    motherProfession: '',
    fatherNid: '',
    motherNid: '',
    fatherMobile: '',
    motherMobile: '',
    fatherDob: '',
    motherDob: '',

    // 3. Parent & Contact Info
    guardianName: '',
    careOf: '',
    relationWithGuardian: '',
    guardianMobile: '',
    presentAddress: '',
    permanentAddress: '',

    // 4. Address Details
    village: '',
    postOffice: '',
    thana: '',
    district: '',
    religion: '',
    nationality: '‡¶¨‡¶æ‡¶Ç‡¶≤‡¶æ‡¶¶‡ßá‡¶∂‡ßÄ',

    // 5. Previous Education
    prevClass: '',
    prevRoll: '',
    prevSchool: ''
  });

  // Filter States for Student List
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSearch, setFilterSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Attendance Matrix states
  const [attendanceMonth, setAttendanceMonth] = useState<number>(6); // July (0-indexed 6 is July)
  const [attendanceYear, setAttendanceYear] = useState<number>(2026);
  const [attendanceFilterClass, setAttendanceFilterClass] = useState('All');
  const [attendanceFilterSection, setAttendanceFilterSection] = useState('All');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [activeSnippetsTab, setActiveSnippetsTab] = useState<'schema' | 'python' | 'node' | 'pdf_template'>('schema');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<number, 'P' | 'A' | 'F' | ''>>>(() => {
    const local = localStorage.getItem('school_attendance_data');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Error parsing school_attendance_data', e);
      }
    }
    // Pre-populate with realistic mock attendance logs for July 2026 for existing students
    const mockData: Record<string, Record<number, 'P' | 'A' | 'F' | ''>> = {};
    const defaultStudents = [
      'STD-1024', 'STD-1025', 'STD-1026', 'STD-1027', 'STD-1028',
      'STD-1029', 'STD-1030', 'STD-1031', 'STD-1032', 'STD-1033',
      'STD-1034', 'STD-1035'
    ];
    defaultStudents.forEach(id => {
      mockData[id] = {};
      for (let d = 1; d <= 31; d++) {
        const date = new Date(2026, 6, d); // July 2026
        if (date.getDay() === 5) { // Friday
          mockData[id][d] = 'F';
        } else {
          // 85% Present, 15% Absent
          mockData[id][d] = Math.random() > 0.15 ? 'P' : 'A';
        }
      }
    });
    return mockData;
  });

  useEffect(() => {
    localStorage.setItem('school_attendance_data', JSON.stringify(attendanceData));
  }, [attendanceData]);

  // Deactivate reason form helper state
  const [deactivateStudentId, setDeactivateStudentId] = useState('');
  const [deactivateReasonText, setDeactivateReasonText] = useState('');

  const [frontendData, setFrontendData] = useState(() => {
    const saved = localStorage.getItem('school_frontend_data');
    return getMergedFrontendData(saved);
  });

  // Synchronize frontendData to localStorage and dispatch custom change event to keep App.tsx in sync
  useEffect(() => {
    if (frontendData) {
      localStorage.setItem('school_frontend_data', JSON.stringify(frontendData));
      window.dispatchEvent(new Event('school_settings_updated'));
    }
  }, [frontendData]);

  const saveFrontendDataToServer = async (customMsgBn?: string, customMsgEn?: string) => {
    if (!frontendData) return;
    try {
      const response = await fetch(getApiUrl('/api/frontend-data'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ frontend_data: frontendData })
      });
      const result = await response.json();
      if (result && result.status === 'success') {
        setAdminSuccessMsg(lang === 'bn' 
          ? (customMsgBn || "‡¶§‡¶•‡ßç‡¶Ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶æ‡¶∞ ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶ø‡¶§ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!") 
          : (customMsgEn || "Settings successfully saved to server database!"));
      } else {
        setAdminSuccessMsg(lang === 'bn' 
          ? "‡¶≠‡ßÅ‡¶≤: ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶æ‡¶∞‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£ ‡¶ï‡¶∞‡¶æ ‡¶Ø‡¶æ‡ßü‡¶®‡¶ø‡•§" 
          : "Error: " + (result.message || "Failed to save settings on server"));
      }
    } catch (err: any) {
      console.error('Save frontend data to server error:', err);
      setAdminSuccessMsg(lang === 'bn' 
        ? "‡¶≠‡ßÅ‡¶≤: ‡¶®‡ßá‡¶ü‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶ï ‡¶∏‡¶Ç‡¶Ø‡ßã‡¶ó ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§" 
        : "Network error saving settings: " + err.message);
    }
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  // States for Manage Custom Pages
  const [pageTitleBn, setPageTitleBn] = useState('');
  const [pageTitleEn, setPageTitleEn] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContentBn, setPageContentBn] = useState('');
  const [pageContentEn, setPageContentEn] = useState('');
  const [pageShowInMenu, setPageShowInMenu] = useState(true);
  const [pageMenuOrder, setPageMenuOrder] = useState(1);
  const [pageStatus, setPageStatus] = useState<'active' | 'inactive'>('active');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  // Helper CRUD Functions for Custom Dynamic Pages
  const handleSavePage = () => {
    if (!pageTitleBn || !pageTitleEn || !pageSlug || !pageContentBn || !pageContentEn) {
      alert("All fields are required! ‡¶∏‡¶¨ ‡¶§‡¶•‡ßç‡¶Ø ‡¶™‡ßÇ‡¶∞‡¶£ ‡¶ï‡¶∞‡¶æ ‡¶Ü‡¶¨‡¶∂‡ßç‡¶Ø‡¶ï‡•§");
      return;
    }

    const pages = frontendData?.customPages || [];
    
    if (editingPageId) {
      // Editing an existing page
      const updatedPages = pages.map((p: any) => {
        if (p.id === editingPageId) {
          return {
            ...p,
            titleBn: pageTitleBn,
            titleEn: pageTitleEn,
            slug: pageSlug,
            contentBn: pageContentBn,
            contentEn: pageContentEn,
            showInMenu: pageShowInMenu,
            menuOrder: pageMenuOrder,
            status: pageStatus
          };
        }
        return p;
      });

      setFrontendData((prev: any) => ({
        ...prev,
        customPages: updatedPages
      }));
      setAdminSuccessMsg("Page updated successfully! ‡¶™‡ßá‡¶ú ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§");
    } else {
      // Creating a new page
      const slugExists = pages.some((p: any) => p.slug === pageSlug);
      if (slugExists) {
        alert("This Page URL slug already exists! ‡¶è‡¶á ‡¶™‡ßá‡¶ú ‡¶á‡¶â‡¶Ü‡¶∞‡¶è‡¶≤ ‡¶∏‡ßç‡¶≤‡ßç‡¶Ø‡¶æ‡¶ó ‡¶á‡¶§‡¶ø‡¶Æ‡¶ß‡ßç‡¶Ø‡ßá ‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶Æ‡¶æ‡¶®‡•§");
        return;
      }

      const newPage = {
        id: 'page_' + Date.now(),
        titleBn: pageTitleBn,
        titleEn: pageTitleEn,
        slug: pageSlug,
        contentBn: pageContentBn,
        contentEn: pageContentEn,
        showInMenu: pageShowInMenu,
        menuOrder: Number(pageMenuOrder) || 1,
        status: pageStatus
      };

      setFrontendData((prev: any) => ({
        ...prev,
        customPages: [...(prev.customPages || []), newPage]
      }));
      setAdminSuccessMsg("New custom page published successfully! ‡¶®‡¶§‡ßÅ‡¶® ‡¶™‡ßá‡¶ú ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶§‡ßà‡¶∞‡¶ø ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§");
    }

    // Reset fields
    setPageTitleBn('');
    setPageTitleEn('');
    setPageSlug('');
    setPageContentBn('');
    setPageContentEn('');
    setPageShowInMenu(true);
    setPageMenuOrder(1);
    setPageStatus('active');
    setEditingPageId(null);
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  const handleDeletePage = (pageId: string) => {
    if (!confirm("Are you sure you want to delete this custom page? ‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§‡¶≠‡¶æ‡¶¨‡ßá ‡¶è‡¶á ‡¶™‡ßá‡¶ú‡¶ü‡¶ø ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶§‡ßá ‡¶ö‡¶æ‡¶®?")) return;
    
    const pages = frontendData?.customPages || [];
    const updatedPages = pages.filter((p: any) => p.id !== pageId);
    
    setFrontendData((prev: any) => ({
      ...prev,
      customPages: updatedPages
    }));
    setAdminSuccessMsg("Page deleted successfully! ‡¶™‡ßá‡¶ú ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§");
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  const handleEditPageClick = (page: any) => {
    setEditingPageId(page.id);
    setPageTitleBn(page.titleBn || '');
    setPageTitleEn(page.titleEn || '');
    setPageSlug(page.slug || '');
    setPageContentBn(page.contentBn || '');
    setPageContentEn(page.contentEn || '');
    setPageShowInMenu(page.showInMenu !== false);
    setPageMenuOrder(page.menuOrder || 1);
    setPageStatus(page.status || 'active');
  };

  const handleTitleEnChange = (val: string) => {
    setPageTitleEn(val);
    if (!editingPageId) {
      // Auto-generate slug
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setPageSlug(generatedSlug);
    }
  };

  const frontendSubMenus = [
    { id: 'banner', labelBn: '‡¶π‡ßã‡¶Æ‡¶™‡ßá‡¶ú ‡¶¨‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞', labelEn: 'Homepage Banner' },
    { id: 'setting', labelBn: '‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏', labelEn: 'Setting' },
    { id: 'menu', labelBn: '‡¶Æ‡ßá‡¶®‡ßÅ', labelEn: 'Menu' },
    { id: 'page_section', labelBn: '‡¶™‡ßá‡¶ú ‡¶∏‡ßá‡¶ï‡¶∂‡¶®', labelEn: 'Page Section' },
    { id: 'manage_page', labelBn: '‡¶™‡ßá‡¶ú ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶ú', labelEn: 'Manage Page' },
    { id: 'slider', labelBn: '‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶æ‡¶∞', labelEn: 'Slider' },
    { id: 'features', labelBn: '‡¶¨‡ßà‡¶∂‡¶ø‡¶∑‡ßç‡¶ü‡ßç‡¶Ø‡¶∏‡¶Æ‡ßÇ‡¶π', labelEn: 'Features' },
    { id: 'comittee', labelBn: '‡¶ï‡¶Æ‡¶ø‡¶ü‡¶ø', labelEn: 'Committee' },
    { id: 'speech', labelBn: '‡¶¨‡¶ï‡ßç‡¶§‡¶¨‡ßç‡¶Ø', labelEn: 'Speech' },
    { id: 'testimonial', labelBn: '‡¶™‡ßç‡¶∞‡¶∂‡¶Ç‡¶∏‡¶æ‡¶™‡¶§‡ßç‡¶∞ / ‡¶Æ‡¶®‡ßç‡¶§‡¶¨‡ßç‡¶Ø', labelEn: 'Testimonial' },
    { id: 'service', labelBn: '‡¶∏‡ßá‡¶¨‡¶æ‡¶∏‡¶Æ‡ßÇ‡¶π', labelEn: 'Service' },
    { id: 'faq', labelBn: '‡¶ú‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶∏‡¶æ (FAQ)', labelEn: 'Faq' },
    { id: 'gallery_category', labelBn: '‡¶ó‡ßç‡¶Ø‡¶æ‡¶≤‡¶æ‡¶∞‡¶ø ‡¶ï‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶ó‡¶∞‡¶ø', labelEn: 'Gallery Category' },
    { id: 'gallery', labelBn: '‡¶´‡¶ü‡ßã ‡¶ó‡ßç‡¶Ø‡¶æ‡¶≤‡¶æ‡¶∞‡¶ø', labelEn: 'Gallery' },
    { id: 'news', labelBn: '‡¶ñ‡¶¨‡¶∞ ‡¶ì ‡¶Ü‡¶™‡¶°‡ßá‡¶ü', labelEn: 'News' },
    { id: 'notice_settings', labelBn: '‡¶®‡ßã‡¶ü‡¶ø‡¶∂‡¶¨‡ßã‡¶∞‡ßç‡¶°', labelEn: 'Notice' },
    { id: 'fast_links', labelBn: '‡¶ï‡ßÅ‡¶á‡¶ï ‡¶≤‡¶ø‡¶Ç‡¶ï', labelEn: 'Fast Links' },
    { id: 'history', labelBn: '‡¶á‡¶§‡¶ø‡¶π‡¶æ‡¶∏ ‡¶ì ‡¶ê‡¶§‡¶ø‡¶π‡ßç‡¶Ø', labelEn: 'Homepage History' },
    { id: 'teachers_list', labelBn: '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï‡¶Æ‡¶£‡ßç‡¶°‡¶≤‡ßÄ', labelEn: 'Homepage Teachers' },
    { id: 'masterpiece_students', labelBn: '‡¶ï‡ßÉ‡¶§‡ßÄ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ', labelEn: 'Masterpiece Students' },
    { id: 'videos', labelBn: '‡¶≠‡¶ø‡¶°‡¶ø‡¶ì ‡¶ó‡ßç‡¶Ø‡¶æ‡¶≤‡¶æ‡¶∞‡¶ø', labelEn: 'Homepage Videos' },
    { id: 'blog_posts', labelBn: '‡¶¨‡ßç‡¶≤‡¶ó ‡¶™‡ßã‡¶∏‡ßç‡¶ü', labelEn: 'Blog Posts' },
    { id: 'footer_settings', labelBn: '‡¶´‡ßÅ‡¶ü‡¶æ‡¶∞', labelEn: 'Footer' },
  ];

  const cardSubMenus = [
    { id: 'id_card', labelBn: '‡¶Ü‡¶á‡¶°‡¶ø ‡¶ï‡¶æ‡¶∞‡ßç‡¶°', labelEn: 'ID Card' },
    { id: 'id_card_customize', labelBn: '‡¶Ü‡¶á‡¶°‡¶ø ‡¶ï‡¶æ‡¶∞‡ßç‡¶° ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶á‡¶ú', labelEn: 'ID Card Customize' },
    { id: 'admit_card', labelBn: '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶ü ‡¶ï‡¶æ‡¶∞‡ßç‡¶°', labelEn: 'Admit Card' },
    { id: 'admit_card_customize', labelBn: '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶ü ‡¶ï‡¶æ‡¶∞‡ßç‡¶° ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶á‡¶ú', labelEn: 'Admit Card Customize' },
    { id: 'seat_plan', labelBn: '‡¶∏‡¶ø‡¶ü ‡¶™‡ßç‡¶≤‡ßç‡¶Ø‡¶æ‡¶®', labelEn: 'Seat Plan' },
    { id: 'seat_plan_customize', labelBn: '‡¶∏‡¶ø‡¶ü ‡¶™‡ßç‡¶≤‡ßç‡¶Ø‡¶æ‡¶® ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶á‡¶ú', labelEn: 'Seat Plan Customize' },
    { id: 'exam_controller_plan', labelBn: '‡¶è‡¶ï‡ßç‡¶∏‡¶æ‡¶Æ ‡¶ï‡¶®‡ßç‡¶ü‡ßç‡¶∞‡ßã‡¶≤‡¶æ‡¶∞ ‡¶™‡ßç‡¶≤‡ßç‡¶Ø‡¶æ‡¶®', labelEn: 'Exam Controller Plan' },
  ];

  const certificateSubMenus = [
    { id: 'generate', labelBn: '‡¶∏‡¶æ‡¶∞‡ßç‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶ü ‡¶ú‡ßá‡¶®‡¶æ‡¶∞‡ßá‡¶ü', labelEn: 'Certificate Generate' },
    { id: 'pottoyon', labelBn: '‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡ßü‡¶®‡¶™‡¶§‡ßç‡¶∞', labelEn: 'Pottoyon Potro' },
    { id: 'testimonial', labelBn: '‡¶ü‡ßá‡¶∏‡ßç‡¶ü‡¶ø‡¶Æ‡ßã‡¶®‡¶ø‡ßü‡¶æ‡¶≤', labelEn: 'Testimonial' },
    { id: 'excellence', labelBn: '‡¶è‡¶ï‡ßç‡¶∏‡¶ø‡¶≤‡ßá‡¶®‡ßç‡¶∏ ‡¶∏‡¶æ‡¶∞‡ßç‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶ü', labelEn: 'Excellence Certificate' },
  ];

  // Quotes rotation on Left Side of Login Page
  const leftQuotes = [
    {
      bn: "‚Äú‡¶õ‡¶æ‡¶§‡ßç‡¶∞‡¶¶‡ßá‡¶∞ ‡¶∏‡ßÅ‡¶®‡ßç‡¶¶‡¶∞ ‡¶≠‡¶¨‡¶ø‡¶∑‡ßç‡¶Ø‡ßé ‡¶ì ‡¶®‡ßà‡¶§‡¶ø‡¶ï ‡¶ö‡¶∞‡¶ø‡¶§‡ßç‡¶∞ ‡¶ó‡¶†‡¶®‡¶á ‡¶Ü‡¶Æ‡¶æ‡¶¶‡ßá‡¶∞ ‡¶è‡¶ï‡¶Æ‡¶æ‡¶§‡ßç‡¶∞ ‡¶Ö‡¶ô‡ßç‡¶ó‡ßÄ‡¶ï‡¶æ‡¶∞‡•§‚Äù",
      en: "‚ÄúOur sole commitment is to build a beautiful future and moral character for our students.‚Äù"
    },
    {
      bn: "‚Äú‡¶®‡¶ø‡¶Ø‡¶º‡¶Æ‡¶®‡¶ø‡¶∑‡ßç‡¶†‡¶æ ‡¶ì ‡¶ï‡¶†‡ßã‡¶∞ ‡¶™‡¶∞‡¶ø‡¶∂‡ßç‡¶∞‡¶Æ‡¶á ‡¶∏‡¶´‡¶≤‡¶§‡¶æ‡¶∞ ‡¶ö‡¶æ‡¶¨‡¶ø‡¶ï‡¶æ‡¶†‡¶ø‡•§‚Äù",
      en: "‚ÄúDiscipline and hard work are the keys to success.‚Äù"
    },
    {
      bn: "‚Äú‡¶≠‡¶¨‡¶ø‡¶∑‡ßç‡¶Ø‡¶§‡ßá‡¶∞ ‡¶Ø‡ßã‡¶ó‡ßç‡¶Ø ‡¶ì ‡¶∏‡ßé ‡¶®‡¶æ‡¶ó‡¶∞‡¶ø‡¶ï ‡¶ó‡¶°‡¶º‡ßá ‡¶§‡ßã‡¶≤‡¶æ‡¶á ‡¶Ü‡¶Æ‡¶æ‡¶¶‡ßá‡¶∞ ‡¶Ö‡¶ô‡ßç‡¶ó‡ßÄ‡¶ï‡¶æ‡¶∞‡•§‚Äù",
      en: "‚ÄúWe are committed to building worthy and honest citizens of the future.‚Äù"
    }
  ];
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIdx((prev) => (prev + 1) % leftQuotes.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Sync credentials on changing Role pill
  const isFirstMount = React.useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (selectedRole === 'admin') {
      setUsername('admin');
      setPassword('admin');
    } else if (selectedRole === 'teacher') {
      setUsername('teacher');
      setPassword('teacher');
    } else if (selectedRole === 'student') {
      setUsername('guardian');
      setPassword('guardian');
    } else if (selectedRole === 'accountant') {
      setUsername('accountant');
      setPassword('accountant');
    } else if (selectedRole === 'superadmin') {
      setUsername('superadmin');
      setPassword('superadmin');
    }
    setErrorMsg('');
  }, [selectedRole]);

  // Handle Login form
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password;

    // Async Backend Login Sync
    try {
      fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      }).then(res => {
        if (res.ok) return res.json();
      }).catch(() => {});
    } catch (e) {
      // ignore network errors
    }

    if (cleanUser === 'admin' && (cleanPass === 'admin' || cleanPass === 'admin123')) {
      setIsLoggedIn(true);
      setLoggedInRole('admin');
      setErrorMsg('');
      addAuditLog("Admin logged in successfully.");
    } else if (cleanUser === 'teacher' && (cleanPass === 'teacher' || cleanPass === 'teacher123')) {
      setIsLoggedIn(true);
      setLoggedInRole('teacher');
      setErrorMsg('');
      addAuditLog("Teacher logged in successfully.");
    } else if (
      (cleanUser === 'student' || cleanUser === 'guardian') &&
      (cleanPass === 'student' || cleanPass === 'guardian' || cleanPass === 'guardian123')
    ) {
      setIsLoggedIn(true);
      setLoggedInRole('student');
      setErrorMsg('');
      addAuditLog("Guardian / Student logged in successfully.");
    } else if (cleanUser === 'accountant' && (cleanPass === 'accountant' || cleanPass === 'accountant123')) {
      setIsLoggedIn(true);
      setLoggedInRole('accountant');
      setErrorMsg('');
      addAuditLog("Accountant logged in successfully.");
    } else if (cleanUser === 'superadmin' && (cleanPass === 'superadmin' || cleanPass === 'superadmin123')) {
      setIsLoggedIn(true);
      setLoggedInRole('superadmin');
      setErrorMsg('');
      addAuditLog("Super Admin logged in successfully with full credentials.");
    } else if (cleanUser === '2026105' && (cleanPass === 'student' || cleanPass === 'guardian')) { // Old backward compatibility
      setIsLoggedIn(true);
      setLoggedInRole('student');
      setErrorMsg('');
      addAuditLog("Student (Imran Hosen) logged in via traditional Student ID.");
    } else {
      const displayCred = selectedRole === 'student' ? 'guardian' : selectedRole;
      setErrorMsg(
        lang === 'bn'
          ? `‡¶≠‡ßÅ‡¶≤ ‡¶á‡¶â‡¶ú‡¶æ‡¶∞‡¶®‡ßá‡¶Æ ‡¶¨‡¶æ ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°‡•§ ‡¶°‡ßá‡¶Æ‡ßã ‡¶Ü‡¶á‡¶°‡¶ø ‡¶è‡¶¨‡¶Ç ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶π‡¶ø‡¶∏‡ßá‡¶¨‡ßá '${displayCred}' ‡¶¨‡ßç‡¶Ø‡¶¨‡¶π‡¶æ‡¶∞ ‡¶ï‡¶∞‡ßÅ‡¶®`
          : `Invalid Credentials. Please use '${displayCred}' as both username and password.`
      );
    }
  };

  const handleLogout = () => {
    addAuditLog(`${loggedInRole} logged out.`);
    setIsLoggedIn(false);
    setLoggedInRole(null);
    setErrorMsg('');
    localStorage.removeItem('portal_isLoggedIn');
    localStorage.removeItem('portal_loggedInRole');
    localStorage.removeItem('user');
    
  };

  // ----------------------------------------------------
  // GLOBAL SHARED STATE DATA (FOR ACTIVE DASHBOARD INTERACTION)
  // ----------------------------------------------------
  
  // Audits Logs
  const [auditLogs, setAuditLogs] = useState<string[]>([
    "09:12:00 AM - System initiated school database connection.",
    "09:15:30 AM - Synced SSC and HSC admission registry."
  ]);
  const addAuditLog = (msg: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAuditLogs(prev => [`${timeStr} - ${msg}`, ...prev.slice(0, 15)]);
  };

  // Student States
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>(mockHomework);
  const [activePortalTab, setActivePortalTab] = useState<string>('overview');
  
  const toggleHomeworkStatus = (id: string) => {
    setHomeworkList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' }
          : item
      )
    );
    addAuditLog(`Student updated homework status of task ${id}.`);
  };
  const pendingHomeworkCount = homeworkList.filter((h) => h.status === 'pending').length;

  // Admin States
  const [adminStats, setAdminStats] = useState({
    totalStudents: 1045,
    activeTeachers: 42,
    outstandingFees: 64200,
  });
  const [pendingAdmissions, setPendingAdmissions] = useState(() => {
    const local = localStorage.getItem('school_pending_admissions');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return [
      {
        id: '1',
        studentName: 'Fahim Shakir',
        guardianName: 'Md. Shakirul Islam',
        motherName: 'Begum Rokeya',
        guardianPhone: '+880 1814-913049',
        address: 'Charalakshya, Karnafuli, Chattogram',
        gender: 'Male',
        bloodGroup: 'A+',
        requestedClass: '9',
        previousGPA: '5.00',
        status: 'pending',
        registrationFeeStatus: 'Paid',
        transactionId: 'BKASH_TXN_F893012',
        applicantPhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=60',
        birthCertificateUrl: 'Birth_Certificate_Fahim.pdf',
        previousTranscriptUrl: 'Academic_Transcript_Class_8.pdf'
      },
      {
        id: '2',
        studentName: 'Nusrat Zaman',
        guardianName: 'Md. Zaman Akhter',
        motherName: 'Sultana Zaman',
        guardianPhone: '+880 1715-334455',
        address: 'Karnafuli, Chattogram',
        gender: 'Female',
        bloodGroup: 'O+',
        requestedClass: '6',
        previousGPA: '4.85',
        status: 'pending',
        registrationFeeStatus: 'Paid',
        transactionId: 'NAGAD_TXN_N29381',
        applicantPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=60',
        birthCertificateUrl: 'Birth_Certificate_Nusrat.pdf',
        previousTranscriptUrl: 'Transcript_Class_5.pdf'
      },
      {
        id: '3',
        studentName: 'Zubayer Al Mahmud',
        guardianName: 'Dr. Mahmudul Hasan',
        motherName: 'Kamrun Nahar',
        guardianPhone: '+880 1912-987654',
        address: 'Charalakshya, Karnafuli, Chattogram',
        gender: 'Male',
        bloodGroup: 'B+',
        requestedClass: '10',
        previousGPA: '5.00',
        status: 'pending',
        registrationFeeStatus: 'Unpaid',
        transactionId: 'N/A',
        applicantPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=60',
        birthCertificateUrl: 'Birth_Certificate_Zubayer.pdf',
        previousTranscriptUrl: 'Transcript_Class_9_Final.pdf'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('school_pending_admissions', JSON.stringify(pendingAdmissions));
  }, [pendingAdmissions]);

  // Enhanced Admission Modal and details state variables
  const [activeApproveAdmission, setActiveApproveAdmission] = useState<any | null>(null);
  const [activeViewAdmission, setActiveViewAdmission] = useState<any | null>(null);

  // Form states for approval modal
  const [approveRoll, setApproveRoll] = useState<string>('');
  const [approveSection, setApproveSection] = useState<string>('A');
  const [approveShift, setApproveShift] = useState<string>('Morning');
  const [approveGroup, setApproveGroup] = useState<string>('General');
  const [admissionSnippetsTab, setAdmissionSnippetsTab] = useState<'postgres' | 'nodejs' | 'python'>('postgres');

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    category: 'general' as any,
    urgent: false
  });
  const [adminErrorMsg, setAdminErrorMsg] = useState('');

  const handleConfirmApproveAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApproveAdmission) return;

    const adm = activeApproveAdmission;
    const finalRoll = approveRoll.trim() || '01';
    
    // Generate unique student ID
    const generatedId = `STD-2026-${1000 + students.length + 1}`;

    // Create the new student object
    const newStudentObj = {
      id: generatedId,
      photo: adm.applicantPhoto || '',
      name: adm.studentName,
      class: adm.requestedClass,
      section: approveSection,
      roll: finalRoll.padStart(2, '0'),
      group: approveGroup,
      guardianName: adm.guardianName,
      guardianPhone: adm.guardianPhone,
      status: 'Active' as const,
      loginActive: true
    };

    // Update pending application status to approved
    setPendingAdmissions(prev => prev.map(item => item.id === adm.id ? { 
      ...item, 
      status: 'approved',
      assignedId: generatedId,
      assignedSection: approveSection,
      assignedRoll: finalRoll,
      assignedShift: approveShift,
      assignedGroup: approveGroup
    } : item));

    // Append to student list
    setStudents(prev => [...prev, newStudentObj]);

    // Increment stats counter
    setAdminStats(prev => ({ ...prev, totalStudents: prev.totalStudents + 1 }));

    // Show success message and notify
    setAdminSuccessMsg(lang === 'bn' 
      ? `${adm.studentName}-‡¶è‡¶∞ ‡¶≠‡¶∞‡ßç‡¶§‡¶ø ‡¶∏‡¶Æ‡ßç‡¶™‡¶®‡ßç‡¶®! ‡¶®‡¶§‡ßÅ‡¶® ‡¶Ü‡¶á‡¶°‡¶ø: ${generatedId}, ‡¶∂‡¶æ‡¶ñ‡¶æ: ${approveSection}, ‡¶∞‡ßã‡¶≤: ${finalRoll}`
      : `Admission approved for ${adm.studentName}! New ID: ${generatedId}, Sec: ${approveSection}, Roll: ${finalRoll}`
    );
    addAuditLog(`Admin approved admission for ${adm.studentName}. Generated ID ${generatedId}.`);

    // Reset modals and form values
    setActiveApproveAdmission(null);
    setApproveRoll('');
    setApproveSection('A');
    setApproveShift('Morning');
    setApproveGroup('General');

    setTimeout(() => setAdminSuccessMsg(''), 6000);
  };

  const handleRejectAdmission = (id: string, name: string) => {
    setPendingAdmissions(prev => prev.map(adm => adm.id === id ? { ...adm, status: 'rejected' } : adm));
    setAdminSuccessMsg(lang === 'bn' ? `${name}-‡¶è‡¶∞ ‡¶Ü‡¶¨‡ßá‡¶¶‡¶® ‡¶¨‡¶æ‡¶§‡¶ø‡¶≤ ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§` : `Admission rejected for ${name}.`);
    addAuditLog(`Admin rejected admission for ${name}.`);
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    
    // We can show a notification
    setAdminSuccessMsg(lang === 'bn' ? "‡¶®‡¶§‡ßÅ‡¶® ‡¶®‡ßã‡¶ü‡¶ø‡¶∂‡¶ü‡¶ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶¨‡ßã‡¶∞‡ßç‡¶°‡ßá ‡¶™‡ßç‡¶∞‡¶ï‡¶æ‡¶∂ ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!" : "Notice successfully published to Main Notice Board!");
    addAuditLog(`Admin published new notice: "${announcementForm.title.slice(0, 30)}..."`);
    
    // Dispatch custom event to let App.tsx notice list know if needed (simulated)
    const newNotice: Notice = {
      id: 'N' + Math.floor(Math.random() * 900 + 100),
      title: announcementForm.title,
      content: announcementForm.content,
      category: announcementForm.category,
      date: new Date().toISOString().split('T')[0],
      urgent: announcementForm.urgent,
      author: "Admin Portal"
    };

    // Store custom notices locally to show in live logs
    setAnnouncementForm({ title: '', content: '', category: 'general', urgent: false });
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  // Teacher States
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [attendanceList, setAttendanceList] = useState([
    { roll: 1, name: 'Imran Hosen', present: true },
    { roll: 2, name: 'Farhan Masud', present: true },
    { roll: 3, name: 'Nusrat Jahan', present: false },
    { roll: 4, name: 'Sadia Islam', present: true },
    { roll: 5, name: 'Tasnim Ahmed', present: true }
  ]);
  const [teacherSuccessMsg, setTeacherSuccessMsg] = useState('');
  const [marksForm, setMarksForm] = useState({
    studentId: '2026105',
    subject: 'Physics',
    marks: '85'
  });

  const toggleAttendance = (roll: number) => {
    setAttendanceList(prev => prev.map(st => st.roll === roll ? { ...st, present: !st.present } : st));
  };

  const handleSubmitAttendance = () => {
    setAttendanceSubmitted(true);
    const presentCount = attendanceList.filter(s => s.present).length;
    setTeacherSuccessMsg(lang === 'bn' ? `‡¶Ü‡¶ú‡¶ï‡ßá‡¶∞ ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶ø‡¶§ ‡¶π‡ßü‡ßá‡¶õ‡ßá (${presentCount}/‡ß´ ‡¶ú‡¶® ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§)` : `Attendance submitted successfully. (${presentCount}/5 present)`);
    addAuditLog(`Teacher registered Class 9 Science attendance. Present: ${presentCount}`);
    setTimeout(() => {
      setAttendanceSubmitted(false);
      setTeacherSuccessMsg('');
    }, 4000);
  };

  const handleSubmitMarks = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSuccessMsg(lang === 'bn' ? `‡¶Ü‡¶á‡¶°‡¶ø ${marksForm.studentId}-‡¶è‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ${marksForm.marks} ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£ ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!` : `Marks (${marksForm.marks}) submitted for Student ID ${marksForm.studentId}.`);
    addAuditLog(`Teacher recorded ${marksForm.marks} marks in ${marksForm.subject} for ID ${marksForm.studentId}.`);
    setTimeout(() => setTeacherSuccessMsg(''), 4000);
  };

  // Accountant States
  const [feesStats, setFeesStats] = useState({
    totalCollected: 185000,
    salariesPaid: 120000,
    netBalance: 65000
  });
  const [transactions, setTransactions] = useState([
    { id: 'TXN1001', studentId: '2026105', type: 'Tuition Fee', amount: 2000, date: '2026-07-05', method: 'bKash' },
    { id: 'TXN1002', studentId: '2026109', type: 'Admission Fee', amount: 5000, date: '2026-07-04', method: 'Cash' },
    { id: 'TXN1003', studentId: '2026115', type: 'Exam Fee', amount: 1200, date: '2026-07-03', method: 'Rocket' }
  ]);
  const [feeForm, setFeeForm] = useState({
    studentId: '2026105',
    feeType: 'Tuition Fee',
    amount: '2000',
    method: 'bKash'
  });
  const [accountantSuccessMsg, setAccountantSuccessMsg] = useState('');

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = parseFloat(feeForm.amount) || 0;
    if (payAmt <= 0) return;

    const newTxn = {
      id: 'TXN' + Math.floor(Math.random() * 9000 + 1000),
      studentId: feeForm.studentId,
      type: feeForm.feeType,
      amount: payAmt,
      date: new Date().toISOString().split('T')[0],
      method: feeForm.method
    };

    setTransactions(prev => [newTxn, ...prev]);
    setFeesStats(prev => ({
      ...prev,
      totalCollected: prev.totalCollected + payAmt,
      netBalance: prev.netBalance + payAmt
    }));
    setAccountantSuccessMsg(lang === 'bn' ? `‡¶™‡ßá‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶∏‡¶´‡¶≤! ‡¶∞‡¶∏‡¶ø‡¶¶ ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ ${newTxn.id} ‡¶á‡¶∏‡ßç‡¶Ø‡ßÅ ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§` : `Payment recorded! Invoice ID ${newTxn.id} generated.`);
    addAuditLog(`Accountant registered ‡ß≥${payAmt} collection from student ID ${feeForm.studentId}.`);
    
    // Reset
    setFeeForm(prev => ({ ...prev, amount: '' }));
    setTimeout(() => setAccountantSuccessMsg(''), 4000);
  };

  // Super Admin States
  const [featureFlags, setFeatureFlags] = useState({
    studentReg: true,
    onlinePayment: false,
    smsAlerts: true,
    maintenanceMode: false
  });
  const [superSuccessMsg, setSuperSuccessMsg] = useState('');

  const toggleFeature = (flag: 'studentReg' | 'onlinePayment' | 'smsAlerts' | 'maintenanceMode') => {
    const updated = { ...featureFlags, [flag]: !featureFlags[flag] };
    setFeatureFlags(updated);
    addAuditLog(`Super Admin toggled feature flag [${String(flag)}] to [${updated[flag] ? 'ON' : 'OFF'}].`);
  };

  const handleDownloadBackup = () => {
    const backupData = {
      schoolName: "Students Care Model School",
      timestamp: new Date().toISOString(),
      adminStats,
      feesStats,
      admissions: pendingAdmissions,
      transactions,
      activeFlags: featureFlags,
      auditTrail: auditLogs
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SCMS_DB_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuperSuccessMsg(lang === 'bn' ? "‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ (.json) ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶°‡¶æ‡¶â‡¶®‡¶≤‡ßã‡¶° ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§" : "System DB configuration and audit trails backed up successfully.");
    addAuditLog("Super Admin initiated full database JSON backup download.");
    setTimeout(() => setSuperSuccessMsg(''), 4500);
  };

  // Helper localizer for portal headers
  const getRoleName = (role: typeof loggedInRole, l: typeof lang) => {
    if (!role) return '';
    const names = {
      admin: { bn: '‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤', en: 'Administrator Portal' },
      teacher: { bn: '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤', en: 'Teacher Workspace' },
      student: { bn: '‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤', en: 'Guardian Workspace' },
      accountant: { bn: '‡¶π‡¶ø‡¶∏‡¶æ‡¶¨‡¶∞‡¶ï‡ßç‡¶∑‡¶ï ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤', en: 'Accountant Ledger panel' },
      superadmin: { bn: '‡¶∏‡ßÅ‡¶™‡¶æ‡¶∞ ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶ï‡¶ï‡¶™‡¶ø‡¶ü', en: 'Super Admin Operations Cockpit' }
    };
    return l === 'bn' ? names[role].bn : names[role].en;
  };

  // ----------------------------------------------------
  // SUB-COMPONENT: STUDENT DASHBOARD
  // ----------------------------------------------------
  const mockWeeklySchedule = [
    { 
      day: lang === 'bn' ? "‡¶∞‡¶¨‡¶ø‡¶¨‡¶æ‡¶∞" : "Sunday", 
      periods: [
        lang === 'bn' ? "‡¶™‡¶¶‡¶æ‡¶∞‡ßç‡¶•‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶® (‡ß¶‡ßØ:‡ß¶‡ß¶ AM)" : "Physics (09:00 AM)", 
        lang === 'bn' ? "‡¶á‡¶Ç‡¶∞‡ßá‡¶ú‡¶ø (‡ßß‡ß¶:‡ßß‡ß´ AM)" : "English (10:15 AM)", 
        lang === 'bn' ? "‡¶¨‡¶æ‡¶Ç‡¶≤‡¶æ (‡ßß‡ßß:‡ß©‡ß¶ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "‡¶ó‡¶£‡¶ø‡¶§ (‡ß¶‡ßß:‡ß¶‡ß¶ PM)" : "Mathematics (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "‡¶∏‡ßã‡¶Æ‡¶¨‡¶æ‡¶∞" : "Monday", 
      periods: [
        lang === 'bn' ? "‡¶∞‡¶∏‡¶æ‡¶Ø‡¶º‡¶® (‡ß¶‡ßØ:‡ß¶‡ß¶ AM)" : "Chemistry (09:00 AM)", 
        lang === 'bn' ? "‡¶Ü‡¶á‡¶∏‡¶ø‡¶ü‡¶ø (‡ßß‡ß¶:‡ßß‡ß´ AM)" : "ICT (10:15 AM)", 
        lang === 'bn' ? "‡¶ú‡ßÄ‡¶¨‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶® (‡ßß‡ßß:‡ß©‡ß¶ AM)" : "Biology (11:30 AM)", 
        lang === 'bn' ? "‡¶ó‡¶£‡¶ø‡¶§ (‡ß¶‡ßß:‡ß¶‡ß¶ PM)" : "Mathematics (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "‡¶Æ‡¶ô‡ßç‡¶ó‡¶≤‡¶¨‡¶æ‡¶∞" : "Tuesday", 
      periods: [
        lang === 'bn' ? "‡¶™‡¶¶‡¶æ‡¶∞‡ßç‡¶•‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶® (‡ß¶‡ßØ:‡ß¶‡ß¶ AM)" : "Physics (09:00 AM)", 
        lang === 'bn' ? "‡¶á‡¶Ç‡¶∞‡ßá‡¶ú‡¶ø (‡ßß‡ß¶:‡ßß‡ß´ AM)" : "English (10:15 AM)", 
        lang === 'bn' ? "‡¶¨‡¶æ‡¶Ç‡¶≤‡¶æ (‡ßß‡ßß:‡ß©‡ß¶ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "‡¶∞‡¶∏‡¶æ‡¶Ø‡¶º‡¶® (‡ß¶‡ßß:‡ß¶‡ß¶ PM)" : "Chemistry (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "‡¶¨‡ßÅ‡¶ß‡¶¨‡¶æ‡¶∞" : "Wednesday", 
      periods: [
        lang === 'bn' ? "‡¶ú‡ßÄ‡¶¨‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶® (‡ß¶‡ßØ:‡ß¶‡ß¶ AM)" : "Biology (09:00 AM)", 
        lang === 'bn' ? "‡¶Ü‡¶á‡¶∏‡¶ø‡¶ü‡¶ø (‡ßß‡ß¶:‡ßß‡ß´ AM)" : "ICT (10:15 AM)", 
        lang === 'bn' ? "‡¶¨‡¶æ‡¶Ç‡¶≤‡¶æ (‡ßß‡ßß:‡ß©‡ß¶ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "‡¶â‡¶ö‡ßç‡¶ö‡¶§‡¶∞ ‡¶ó‡¶£‡¶ø‡¶§ (‡ß¶‡ßß:‡ß¶‡ß¶ PM)" : "Higher Math (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "‡¶¨‡ßÉ‡¶π‡¶∏‡ßç‡¶™‡¶§‡¶ø‡¶¨‡¶æ‡¶∞" : "Thursday", 
      periods: [
        lang === 'bn' ? "‡¶∏‡¶æ‡¶™‡ßç‡¶§‡¶æ‡¶π‡¶ø‡¶ï ‡¶ï‡ßÅ‡¶á‡¶ú (‡ß¶‡ßØ:‡ß¶‡ß¶ AM)" : "Weekly Quiz (09:00 AM)", 
        lang === 'bn' ? "‡¶°‡¶ø‡¶¨‡ßá‡¶ü ‡¶ï‡ßç‡¶≤‡¶æ‡¶¨ (‡ßß‡ß¶:‡ßß‡ß´ AM)" : "Debate Club (10:15 AM)", 
        lang === 'bn' ? "‡¶ï‡ßç‡¶∞‡ßÄ‡¶°‡¶º‡¶æ ‡¶ò‡¶®‡ßç‡¶ü‡¶æ (‡ßß‡ßß:‡ß©‡ß¶ AM)" : "Sports Hour (11:30 AM)", 
        lang === 'bn' ? "‡¶™‡¶∞‡¶æ‡¶Æ‡¶∞‡ßç‡¶∂ ‡¶∏‡¶≠‡¶æ (‡ß¶‡ßß:‡ß¶‡ß¶ PM)" : "Counseling (01:00 PM)"
      ] 
    },
  ];

  const renderStudentDashboard = () => {
    return <GuardianDashboard lang={lang} setLang={setLang} onLogout={handleLogout} />;
  };

  const _disabled_renderStudentDashboard = () => (
    <div>
      {/* Tab navigation bar */}
      <div className="bg-white border-b border-gray-150 px-6 sm:px-8 flex overflow-x-auto scrollbar-none gap-2 py-2">
        {[
          { id: 'overview', label: lang === 'bn' ? '‡¶∏‡¶Ç‡¶ï‡ßç‡¶∑‡¶ø‡¶™‡ßç‡¶§ ‡¶§‡¶•‡ßç‡¶Ø' : 'Overview', icon: GraduationCap },
          { id: 'homework', label: lang === 'bn' ? `‡¶¨‡¶æ‡ßú‡¶ø‡¶∞ ‡¶ï‡¶æ‡¶ú (${pendingHomeworkCount})` : `Homework (${pendingHomeworkCount})`, icon: BookOpen },
          { id: 'results', label: lang === 'bn' ? '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ‡¶∞ ‡¶´‡¶≤‡¶æ‡¶´‡¶≤' : 'Term Results', icon: Award },
          { id: 'schedule', label: lang === 'bn' ? '‡¶∏‡¶æ‡¶™‡ßç‡¶§‡¶æ‡¶π‡¶ø‡¶ï ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶®' : 'Class Schedule', icon: Calendar },
          { id: 'profile', label: lang === 'bn' ? '‡¶™‡ßç‡¶∞‡ßã‡¶´‡¶æ‡¶á‡¶≤' : 'My Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activePortalTab === tab.id;
          return (
            <button
              id={`portal-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActivePortalTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#025644] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {activePortalTab === 'overview' && (
            <motion.div
              key="student-overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Profile Card and Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø ‡¶Æ‡ßÇ‡¶≤‡ßç‡¶Ø‡¶æ‡¶Ø‡¶º‡¶®" : "Attendance Streak"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">{lang === 'bn' ? "‡¶ö‡¶Æ‡ßé‡¶ï‡¶æ‡¶∞" : "Excellent"}</span>
                    <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">{mockStudentProfile.attendanceRate}% {lang === 'bn' ? "‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§" : "Presence"}</span>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "‡¶¨‡¶æ‡¶ï‡¶ø ‡¶™‡ßú‡¶æ/‡¶ï‡¶æ‡¶ú" : "Pending Homework"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">
                      {pendingHomeworkCount} {lang === 'bn' ? "‡¶ü‡¶ø ‡¶ï‡¶æ‡¶ú" : "Tasks"}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold mt-0.5 block">{lang === 'bn' ? "‡¶è‡¶á ‡¶∏‡¶™‡ßç‡¶§‡¶æ‡¶π‡ßá ‡¶ú‡¶Æ‡¶æ ‡¶¶‡¶ø‡¶§‡ßá ‡¶π‡¶¨‡ßá" : "Due by this week"}</span>
                  </div>
                  <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "‡¶ó‡¶°‡¶º ‡¶ú‡¶ø‡¶™‡¶ø‡¶è ‡¶Æ‡¶æ‡¶®" : "Average GPA Grade"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">GPA 4.90</span>
                    <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">{lang === 'bn' ? "‡¶è+ ‡¶ö‡¶Æ‡ßé‡¶ï‡¶æ‡¶∞" : "A+ Excellent Status"}</span>
                  </div>
                  <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <Award className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                    <h4 className="font-extrabold text-gray-900 text-base mb-4">{lang === 'bn' ? "‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï‡ßá‡¶∞ ‡¶Ø‡ßã‡¶ó‡¶æ‡¶Ø‡ßã‡¶ó‡ßá‡¶∞ ‡¶§‡¶•‡ßç‡¶Ø" : "Guardian Contact Details"}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "‡¶™‡ßç‡¶∞‡¶ß‡¶æ‡¶® ‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï" : "Primary Guardian"}</span>
                        <span className="font-bold">{mockStudentProfile.guardian}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "‡¶®‡¶ø‡¶¨‡¶®‡ßç‡¶ß‡¶ø‡¶§ ‡¶Æ‡ßã‡¶¨‡¶æ‡¶á‡¶≤" : "Registered Phone"}</span>
                        <span className="font-bold font-mono">{mockStudentProfile.phone}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "‡¶∞‡¶ï‡ßç‡¶§‡ßá‡¶∞ ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™" : "Registered Blood Group"}</span>
                        <span className="font-bold text-red-600">{mockStudentProfile.bloodGroup}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "‡¶¨‡¶∞‡ßç‡¶§‡¶Æ‡¶æ‡¶® ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ" : "Current Grade Status"}</span>
                        <span className="font-bold text-emerald-700">{lang === 'bn' ? '‡ßØ‡¶Æ ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ' : mockStudentProfile.className}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-900 text-base">{lang === 'bn' ? "‡¶∞‡¶¨‡¶ø‡¶¨‡¶æ‡¶∞‡ßá‡¶∞ ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏‡ßá‡¶∞ ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶®" : "Sunday Class Schedule"}</h4>
                      <button onClick={() => setActivePortalTab('schedule')} className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer">
                        {lang === 'bn' ? "‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶® ‡¶¶‡ßá‡¶ñ‡ßÅ‡¶®" : "View Full Week"}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {mockWeeklySchedule[0].periods.map((period, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="h-7 w-7 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm font-bold text-gray-800">{period}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                    <h4 className="font-bold text-gray-900 text-base mb-4">{lang === 'bn' ? "‡¶´‡¶≤‡¶æ‡¶´‡¶≤ ‡¶∏‡¶Ç‡¶ï‡ßç‡¶∑‡ßá‡¶™" : "Quick Grade Summary"}</h4>
                    <div className="space-y-3.5">
                      {mockExamResults.slice(0, 4).map((res) => (
                        <div key={res.subject} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-bold">{lang === 'bn' && res.subject === "Physics" ? "‡¶™‡¶¶‡¶æ‡¶∞‡ßç‡¶•‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶®" : lang === 'bn' && res.subject === "Chemistry" ? "‡¶∞‡¶∏‡¶æ‡¶Ø‡¶º‡¶®" : lang === 'bn' && res.subject === "Higher Mathematics" ? "‡¶â‡¶ö‡ßç‡¶ö‡¶§‡¶∞ ‡¶ó‡¶£‡¶ø‡¶§" : lang === 'bn' && res.subject === "English Language" ? "‡¶á‡¶Ç‡¶∞‡ßá‡¶ú‡¶ø" : res.subject}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-gray-500">{res.marks}/100</span>
                            <span className="font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded-md text-xs">
                              {res.grade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setActivePortalTab('results')}
                      className="w-full py-2.5 mt-5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-100 transition-colors cursor-pointer text-center block"
                    >
                      {lang === 'bn' ? "‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶Æ‡¶æ‡¶∞‡ßç‡¶ï‡¶∂‡¶ø‡¶ü ‡¶¶‡ßá‡¶ñ‡ßÅ‡¶®" : "View Full Marksheet"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activePortalTab === 'homework' && (
            <motion.div
              key="student-homework"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "‡¶π‡ßã‡¶Æ‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶ï ‡¶™‡ßç‡¶≤‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞" : "Homework Planner"}</h4>
                  <p className="text-xs text-gray-500">{lang === 'bn' ? "‡¶ï‡¶æ‡¶ú ‡¶∏‡¶Æ‡ßç‡¶™‡¶®‡ßç‡¶® ‡¶ö‡¶ø‡¶π‡ßç‡¶®‡¶ø‡¶§ ‡¶ï‡¶∞‡¶§‡ßá ‡¶¨‡¶ï‡ßç‡¶∏‡ßá ‡¶ü‡¶ø‡¶ï ‡¶¶‡¶ø‡¶®" : "Check/uncheck tasks to mark them completed"}</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-800 font-bold border border-amber-200 px-3 py-1.5 rounded-xl">
                  {pendingHomeworkCount} {lang === 'bn' ? "‡¶ü‡¶ø ‡¶ï‡¶æ‡¶ú ‡¶¨‡¶æ‡¶ï‡¶ø ‡¶Ü‡¶õ‡ßá" : "Pending Tasks"}
                </span>
              </div>

              <div className="space-y-3">
                {homeworkList.map((item) => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isCompleted
                          ? 'bg-gray-50/50 border-gray-200/50 opacity-70'
                          : 'bg-white border-gray-100 hover:border-gray-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-4 text-left">
                        <button
                          onClick={() => toggleHomeworkStatus(item.id)}
                          className={`h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-[#025644] border-[#025644] text-white'
                              : 'border-gray-300 hover:border-emerald-500 bg-white'
                          }`}
                        >
                          {isCompleted && <Check className="h-4 w-4" />}
                        </button>

                        <div className="space-y-1 grow">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/50">
                              {lang === 'bn' && item.subject === "Physics" ? "‡¶™‡¶¶‡¶æ‡¶∞‡ßç‡¶•‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶®" : lang === 'bn' && item.subject === "Chemistry" ? "‡¶∞‡¶∏‡¶æ‡¶Ø‡¶º‡¶®" : lang === 'bn' && item.subject === "Higher Mathematics" ? "‡¶â‡¶ö‡ßç‡¶ö‡¶§‡¶∞ ‡¶ó‡¶£‡¶ø‡¶§" : item.subject}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1 font-bold">
                              <Clock className="h-3 w-3" /> {lang === 'bn' ? "‡¶ú‡¶Æ‡¶æ‡¶∞ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ:" : "Due Date:"} {item.dueDate}
                            </span>
                          </div>
                          <h5 className={`font-bold text-gray-900 text-base ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {lang === 'bn' && item.id === "hw1" ? "‡¶Ö‡¶ß‡ßç‡¶Ø‡¶æ‡¶Ø‡¶º ‡ß´: ‡¶ó‡¶§‡¶ø‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶æ‡¶∞ ‡¶ó‡¶æ‡¶£‡¶ø‡¶§‡¶ø‡¶ï ‡¶∏‡¶Æ‡¶∏‡ßç‡¶Ø‡¶æ" : lang === 'bn' && item.id === "hw2" ? "‡¶ú‡ßà‡¶¨ ‡¶∞‡¶∏‡¶æ‡¶Ø‡¶º‡¶® ‡¶è‡¶¨‡¶Ç ‡¶Ü‡¶£‡¶¨‡¶ø‡¶ï ‡¶ó‡¶†‡¶® ‡¶∏‡¶Ç‡¶ï‡ßç‡¶∑‡ßá‡¶™‡¶£" : lang === 'bn' && item.id === "hw3" ? "‡¶§‡ßç‡¶∞‡¶ø‡¶ï‡ßã‡¶£‡¶Æ‡¶ø‡¶§‡¶ø‡¶ï ‡¶Ö‡¶∏‡¶Æ‡¶§‡¶æ ‡¶∏‡¶Æ‡¶æ‡¶ß‡¶æ‡¶® ‡¶∏‡ßá‡¶ü" : item.title}
                          </h5>
                          <p className="text-sm text-gray-600 leading-relaxed font-semibold">
                            {lang === 'bn' && item.id === "hw1" ? "‡¶ó‡¶§‡¶ø‡¶∞ ‡¶∏‡¶Æ‡ßÄ‡¶ï‡¶∞‡¶£ ‡¶¨‡ßç‡¶Ø‡¶¨‡¶π‡¶æ‡¶∞ ‡¶ï‡¶∞‡ßá ‡¶∏‡ßÉ‡¶ú‡¶®‡¶∂‡ßÄ‡¶≤ ‡¶™‡ßç‡¶∞‡¶∂‡ßç‡¶® ‡ßß ‡¶•‡ßá‡¶ï‡ßá ‡ß´ ‡¶∏‡¶Æ‡¶æ‡¶ß‡¶æ‡¶® ‡¶ï‡¶∞‡•§" : lang === 'bn' && item.id === "hw2" ? "‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ‡¶ï‡¶ï‡ßç‡¶∑‡ßá ‡¶¶‡ßá‡¶ì‡¶Ø‡¶º‡¶æ ‡¶®‡ßã‡¶ü‡¶¨‡ßÅ‡¶ï ‡¶Ö‡¶®‡ßÅ‡¶∏‡¶∞‡¶£ ‡¶ï‡¶∞‡ßá ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶≤‡¶ï‡ßã‡¶π‡¶≤ ‡¶ì ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶≤‡¶°‡¶ø‡¶π‡¶æ‡¶á‡¶°‡ßá‡¶∞ ‡¶™‡¶æ‡¶∞‡ßç‡¶•‡¶ï‡ßç‡¶Ø ‡¶§‡ßà‡¶∞‡¶ø ‡¶ï‡¶∞‡•§" : lang === 'bn' && item.id === "hw3" ? "‡¶Ö‡¶®‡ßÅ‡¶∂‡ßÄ‡¶≤‡¶®‡ßÄ ‡ß≠.‡ß® ‡¶è‡¶∞ ‡¶∏‡¶ï‡¶≤ ‡¶ó‡¶æ‡¶£‡¶ø‡¶§‡¶ø‡¶ï ‡¶∏‡ßÇ‡¶§‡ßç‡¶∞‡¶æ‡¶¨‡¶≤‡ßÄ ‡¶ñ‡¶æ‡¶§‡¶æ‡¶Ø‡¶º ‡¶≤‡¶ø‡¶ñ‡ßá ‡¶Ü‡¶®‡¶¨‡ßá‡•§" : item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activePortalTab === 'results' && (
            <motion.div
              key="student-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-4">
                <div>
                  <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "‡¶Ö‡¶∞‡ßç‡¶ß-‡¶¨‡¶æ‡¶∞‡ßç‡¶∑‡¶ø‡¶ï ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ‡¶∞ ‡¶Æ‡¶æ‡¶∞‡ßç‡¶ï‡¶∂‡¶ø‡¶ü" : "Half-Yearly Mock Exam Marksheet"}</h4>
                  <p className="text-xs text-gray-500">{lang === 'bn' ? "‡¶Æ‡ßÇ‡¶≤‡ßç‡¶Ø‡¶æ‡¶Ø‡¶º‡¶® ‡¶∏‡ßá‡¶∂‡¶®: ‡¶ó‡ßç‡¶∞‡ßÄ‡¶∑‡ßç‡¶Æ‡¶ï‡¶æ‡¶≤‡ßÄ‡¶® ‡ß®‡ß¶‡ß®‡ß¨" : "Grading Term: Summer Session 2026"}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 px-3 py-1.5 rounded-xl">
                    {lang === 'bn' ? "‡¶∏‡¶∞‡ßç‡¶¨‡¶∂‡ßá‡¶∑ ‡¶ú‡¶ø‡¶™‡¶ø‡¶è: ‡ß´.‡ß¶‡ß¶" : "Final GPA: 5.00"}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-800 font-bold border border-blue-100 px-3 py-1.5 rounded-xl">
                    {lang === 'bn' ? "‡¶ó‡ßç‡¶∞‡ßá‡¶°: ‡¶è+" : "Overall Grade: A+"}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">{lang === 'bn' ? "‡¶¨‡¶ø‡¶∑‡¶Ø‡¶º ‡¶ì ‡¶ï‡ßã‡¶∞‡ßç‡¶∏" : "Subject Course"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "‡¶™‡ßç‡¶∞‡¶æ‡¶™‡ßç‡¶§ ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞" : "Obtained Marks"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "‡¶≤‡ßá‡¶ü‡¶æ‡¶∞ ‡¶ó‡ßç‡¶∞‡ßá‡¶°" : "Letter Grade"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "‡¶∏‡¶∞‡ßç‡¶¨‡ßã‡¶ö‡ßç‡¶ö ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞" : "Max Cap"}</th>
                      <th className="pb-3 text-right font-semibold">{lang === 'bn' ? "‡¶Æ‡¶®‡ßç‡¶§‡¶¨‡ßç‡¶Ø" : "Remarks"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                    {mockExamResults.map((res) => (
                      <tr key={res.subject} className="hover:bg-gray-50/50">
                        <td className="py-4 font-bold text-gray-900">{lang === 'bn' && res.subject === "Physics" ? "‡¶™‡¶¶‡¶æ‡¶∞‡ßç‡¶•‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶®" : lang === 'bn' && res.subject === "Chemistry" ? "‡¶∞‡¶∏‡¶æ‡¶Ø‡¶º‡¶®" : lang === 'bn' && res.subject === "Higher Mathematics" ? "‡¶â‡¶ö‡ßç‡¶ö‡¶§‡¶∞ ‡¶ó‡¶£‡¶ø‡¶§" : lang === 'bn' && res.subject === "English Language" ? "‡¶á‡¶Ç‡¶∞‡ßá‡¶ú‡¶ø ‡¶≠‡¶æ‡¶∑‡¶æ" : res.subject}</td>
                        <td className="py-4 text-center font-mono font-semibold">{res.marks}</td>
                        <td className="py-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-extrabold border ${
                            res.grade === 'A+'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {res.grade}
                          </span>
                        </td>
                        <td className="py-4 text-center font-mono text-gray-400">{res.maxMarks}</td>
                        <td className="py-4 text-right text-xs text-[#025644] font-bold">
                          {res.marks >= 90 ? (lang === 'bn' ? '‡¶Ö‡¶∏‡¶æ‡¶ß‡¶æ‡¶∞‡¶£' : 'Outstanding') : res.marks >= 80 ? (lang === 'bn' ? '‡¶ö‡¶Æ‡ßé‡¶ï‡¶æ‡¶∞' : 'Excellent') : (lang === 'bn' ? '‡¶∏‡¶®‡ßç‡¶§‡ßã‡¶∑‡¶ú‡¶®‡¶ï' : 'Satisfactory')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grade Improvement Line Chart utilizing Recharts */}
              <div className="mt-8 pt-8 border-t border-gray-150">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3 text-left">
                  <div>
                    <h5 className="font-extrabold text-[#025644] text-base">
                      {lang === 'bn' ? "‡¶ó‡ßç‡¶∞‡ßá‡¶° ‡¶¨‡¶æ ‡¶ú‡¶ø‡¶™‡¶ø‡¶è ‡¶â‡¶®‡ßç‡¶®‡¶§‡¶ø‡¶∞ ‡¶ö‡¶ø‡¶§‡ßç‡¶∞" : "Academic GPA Improvement Trend"}
                    </h5>
                    <p className="text-xs text-gray-500 font-semibold">
                      {lang === 'bn' ? "‡¶¨‡¶ø‡¶ó‡¶§ ‡ß´ ‡¶∏‡ßá‡¶Æ‡¶ø‡¶∏‡ßç‡¶ü‡¶æ‡¶∞‡ßá‡¶∞ ‡¶ú‡¶ø‡¶™‡¶ø‡¶è (GPA) ‡¶≠‡¶ø‡¶§‡ßç‡¶§‡¶ø‡¶ï ‡¶§‡ßÅ‡¶≤‡¶®‡¶æ ‡¶ö‡¶ø‡¶§‡ßç‡¶∞" : "Comparative GPA improvement tracking over the last 5 semesters"}
                    </p>
                  </div>
                  
                  {/* Stats badge showing total improvement */}
                  <div className="flex items-center gap-2 bg-[#025644]/5 text-[#025644] border border-[#025644]/10 rounded-xl px-3 py-1.5 self-start md:self-auto">
                    <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
                    <span className="text-xs font-extrabold">
                      {lang === 'bn' ? "+‡ßß‡ß≠.‡ß¨% ‡¶ß‡¶æ‡¶∞‡¶æ‡¶¨‡¶æ‡¶π‡¶ø‡¶ï ‡¶â‡¶®‡ßç‡¶®‡¶§‡¶ø" : "+17.6% Consistent Progress"}
                    </span>
                  </div>
                </div>

                {/* Line Chart Container */}
                <div className="w-full h-72 bg-slate-50/50 rounded-2xl border border-gray-100 p-4 sm:p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={gpaTrendData}
                      margin={{ top: 10, right: 15, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey={lang === 'bn' ? "bnSemester" : "semester"} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        domain={[4.0, 5.05]} 
                        ticks={[4.0, 4.2, 4.4, 4.6, 4.8, 5.0]}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#0f172a] text-white p-3 rounded-xl border border-slate-700 shadow-lg text-xs font-semibold">
                                <p className="font-extrabold">{lang === 'bn' ? payload[0].payload.bnSemester : payload[0].payload.semester}</p>
                                <p className="text-emerald-400 mt-1">
                                  {lang === 'bn' ? '‡¶™‡ßç‡¶∞‡¶æ‡¶™‡ßç‡¶§ ‡¶ú‡¶ø‡¶™‡¶ø‡¶è' : 'Earned GPA'}: <span className="font-mono text-sm font-black">{payload[0].value.toFixed(2)}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                        cursor={{ stroke: '#025644', strokeWidth: 1, strokeDasharray: '4 4' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gpa" 
                        stroke="#025644" 
                        strokeWidth={3} 
                        dot={{ fill: '#025644', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: '#f59e0b' }} 
                        name="GPA"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activePortalTab === 'schedule' && (
            <motion.div
              key="student-schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "‡¶∏‡¶æ‡¶™‡ßç‡¶§‡¶æ‡¶π‡¶ø‡¶ï ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏‡ßá‡¶∞ ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶® ‡¶ì ‡¶∏‡¶Æ‡¶Ø‡¶º" : "Weekly Routine & Periods"}</h4>
                <p className="text-xs text-gray-500">{lang === 'bn' ? "‡ßØ‡¶Æ ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ - ‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶® ‡¶∂‡¶æ‡¶ñ‡¶æ '‡¶ï' ‡¶è‡¶∞ ‡¶®‡¶ø‡¶Ø‡¶º‡¶Æ‡¶ø‡¶§ ‡¶∏‡¶Æ‡¶Ø‡¶º‡¶∏‡ßÇ‡¶ö‡ßÄ" : "Regular classes schedule for Grade IX - Science Section A"}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {mockWeeklySchedule.map((sched) => (
                  <div key={sched.day} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs text-left">
                    <h5 className="font-extrabold text-[#025644] border-b border-gray-100 pb-2 mb-3 text-sm">
                      {sched.day}
                    </h5>
                    <div className="space-y-2.5">
                      {sched.periods.map((period, i) => {
                        const [subj, time] = period.split(' (');
                        return (
                          <div key={i} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100/60">
                            <p className="text-xs font-bold text-gray-900 leading-tight">{subj}</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">({time.slice(0, -1)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activePortalTab === 'profile' && (
            <motion.div
              key="student-profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                {/* Banner */}
                <div className="h-32 sm:h-40 bg-gradient-to-r from-[#025644] to-[#01352a] relative">
                  <div className="absolute inset-0 bg-grid-white/[0.08] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]" />
                  <div className="absolute bottom-4 right-4 sm:right-6">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold rounded-full border border-white/20 tracking-wide">
                      {lang === 'bn' ? "‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶¨‡¶∞‡ßç‡¶∑: ‡ß®‡ß¶‡ß®‡ß¨" : "Session: 2026"}
                    </span>
                  </div>
                </div>

                {/* Profile Header Block */}
                <div className="px-6 pb-6 relative">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-16 sm:-mt-20 mb-6">
                    <div className="h-28 w-28 sm:h-36 sm:w-36 bg-white rounded-3xl p-1.5 shadow-md border border-gray-100 shrink-0 mx-auto sm:mx-0">
                      <div className="h-full w-full bg-[#f0f9f6] rounded-2xl flex items-center justify-center text-[#025644]">
                        <GraduationCap className="h-16 w-16 sm:h-20 sm:w-20 stroke-[1.5]" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left grow space-y-1 sm:pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                          {mockStudentProfile.name}
                        </h3>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-md border border-emerald-150 w-fit mx-auto sm:mx-0">
                          {lang === 'bn' ? "‡¶®‡¶ø‡¶¨‡¶®‡ßç‡¶ß‡¶ø‡¶§ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ" : "Active Student"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-bold">
                        {lang === 'bn' ? "‡¶Ü‡¶á‡¶°‡¶ø ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞: " : "Student ID: "} <span className="font-mono">{mockStudentProfile.id}</span>
                      </p>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? "‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡ßü‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤" : "Students Care Model School"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Academic info */}
                    <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <BookOpen className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶ó‡¶§ ‡¶§‡¶•‡ßç‡¶Ø" : "Academic Credentials"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ" : "Grade/Class"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "‡ßØ‡¶Æ ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ" : mockStudentProfile.className}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶∂‡¶æ‡¶ñ‡¶æ" : "Section"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶® '‡¶ï'" : mockStudentProfile.section}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶∞‡ßã‡¶≤ ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞" : "Class Roll"}</span>
                          <span className="font-mono font-extrabold text-[#025644] bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-md text-xs">{mockStudentProfile.roll}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™" : "Group Stream"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶®" : "Science"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Personal details */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <User className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "‡¶¨‡ßç‡¶Ø‡¶ï‡ßç‡¶§‡¶ø‡¶ó‡¶§ ‡¶§‡¶•‡ßç‡¶Ø" : "Personal Records"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶∞‡¶ï‡ßç‡¶§‡ßá‡¶∞ ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™" : "Blood Group"}</span>
                          <span className="font-extrabold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-md text-xs">{mockStudentProfile.bloodGroup}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶ú‡¶®‡ßç‡¶Æ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ" : "Date of Birth"}</span>
                          <span className="font-extrabold text-gray-800">12th May, 2011</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶≤‡¶ø‡¶ô‡ßç‡¶ó" : "Gender"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "‡¶™‡ßÅ‡¶∞‡ßÅ‡¶∑" : "Male"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶ß‡¶∞‡ßç‡¶Æ" : "Religion"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "‡¶á‡¶∏‡¶≤‡¶æ‡¶Æ" : "Islam"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Contact details */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <Phone className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "‡¶Ø‡ßã‡¶ó‡¶æ‡¶Ø‡ßã‡¶ó ‡¶ì ‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï" : "Guardian & Contact"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between flex-wrap gap-1">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï" : "Guardian"}</span>
                          <span className="font-extrabold text-gray-800">{mockStudentProfile.guardian}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶Æ‡ßã‡¶¨‡¶æ‡¶á‡¶≤" : "Contact Phone"}</span>
                          <span className="font-mono font-extrabold text-gray-800">{mockStudentProfile.phone}</span>
                        </div>
                        <div className="flex justify-between flex-wrap gap-1">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶á‡¶Æ‡ßá‡¶á‡¶≤" : "Email Address"}</span>
                          <span className="font-mono text-xs font-extrabold text-[#025644] hover:underline">imran.parent@scms.edu.bd</span>
                        </div>
                        <div className="flex justify-between flex-wrap gap-1 text-right">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶∏‡ßç‡¶•‡¶æ‡ßü‡ßÄ ‡¶†‡¶ø‡¶ï‡¶æ‡¶®‡¶æ" : "Permanent Address"}</span>
                          <span className="font-extrabold text-gray-800 text-xs max-w-[150px] leading-tight">
                            {lang === 'bn' ? "‡¶ö‡¶∞‡¶≤‡¶ï‡ßç‡¶∑‡ßç‡¶Ø‡¶æ, ‡¶ï‡¶∞‡ßç‡¶£‡¶´‡ßÅ‡¶≤‡ßÄ, ‡¶ö‡¶ü‡ßç‡¶ü‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ" : "Charlakshya, Karnaphuli, Chattogram"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Rate Visual section */}
                  <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 border border-emerald-100/60 rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 bg-white rounded-xl border border-emerald-100 flex items-center justify-center text-[#025644] shadow-xs">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h5 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø‡¶∞ ‡¶ñ‡¶§‡¶ø‡ßü‡¶æ‡¶® (‡¶ö‡¶≤‡¶§‡¶ø ‡¶∏‡ßá‡¶∂‡¶®)" : "Attendance Record (Current Session)"}</h5>
                        <p className="text-xs text-gray-500 font-semibold">{lang === 'bn' ? "‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶∏‡¶æ‡¶Æ‡¶ó‡ßç‡¶∞‡¶ø‡¶ï ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏‡ßá ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø‡¶∞ ‡¶™‡¶æ‡¶∞‡¶´‡¶∞‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßç‡¶∏ ‡¶ö‡¶Æ‡ßé‡¶ï‡¶æ‡¶∞!" : "Excellent! You are maintaining an elite presence streak this term."}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-40 bg-gray-200/80 rounded-full h-3 shrink-0 overflow-hidden border border-gray-300/40">
                        <div 
                          className="bg-[#025644] h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${mockStudentProfile.attendanceRate}%` }} 
                        />
                      </div>
                      <span className="font-mono text-sm font-black text-emerald-800 bg-white border border-emerald-150 px-2.5 py-1 rounded-lg shadow-xs">
                        {mockStudentProfile.attendanceRate}%
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderGoogleDriveTab = () => {
    const handleSignIn = async () => {
      setIsDriveLoading(true);
      setUploadError(null);
      try {
        const result = await googleSignIn();
        if (result) {
          setGoogleUser(result.user);
          setDriveToken(result.accessToken);
          addAuditLog(`Admin connected Google Drive account: ${result.user.email}`);
          loadDriveFiles(currentFolderId, result.accessToken);
        }
      } catch (err: any) {
        console.error('Sign-in failed:', err);
        setUploadError(err.message || 'Failed to sign in with Google.');
      } finally {
        setIsDriveLoading(false);
      }
    };

    const handleSignOut = async () => {
      setIsDriveLoading(true);
      try {
        await googleLogout();
        setGoogleUser(null);
        setDriveToken(null);
        setDriveFiles([]);
        setFolderPath([{ id: 'root', name: 'My Drive' }]);
        setCurrentFolderId('root');
        addAuditLog('Admin disconnected Google Drive integration.');
      } catch (err: any) {
        console.error('Sign-out failed:', err);
      } finally {
        setIsDriveLoading(false);
      }
    };

    const handleCreateFolderSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newFolderName.trim()) return;
      setIsDriveLoading(true);
      setUploadError(null);
      try {
        await createDriveFolder(newFolderName, currentFolderId);
        setNewFolderName('');
        setIsCreatingFolder(false);
        addAuditLog(`Created Google Drive folder: "${newFolderName}"`);
        await loadDriveFiles(currentFolderId);
      } catch (err: any) {
        console.error('Folder creation failed:', err);
        setUploadError(err.message || 'Failed to create folder in Google Drive.');
      } finally {
        setIsDriveLoading(false);
      }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      setUploadError(null);
      addAuditLog(`Uploading file to Google Drive: "${file.name}"`);
      try {
        await uploadDriveFile(file, currentFolderId);
        addAuditLog(`Successfully uploaded file: "${file.name}" to Google Drive`);
        await loadDriveFiles(currentFolderId);
      } catch (err: any) {
        console.error('File upload failed:', err);
        setUploadError(err.message || 'Failed to upload file to Google Drive.');
      } finally {
        setIsUploading(false);
      }
    };

    const handleDeleteFileClick = async (fileId: string, fileName: string) => {
      const confirmed = window.confirm(
        lang === 'bn' 
          ? `‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§‡¶≠‡¶æ‡¶¨‡ßá "${fileName}" ‡¶´‡¶æ‡¶á‡¶≤‡¶ü‡¶ø ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠ ‡¶•‡ßá‡¶ï‡ßá ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶§‡ßá ‡¶ö‡¶æ‡¶®?` 
          : `Are you sure you want to delete "${fileName}" from Google Drive?`
      );
      if (!confirmed) return;

      setIsDriveLoading(true);
      setUploadError(null);
      try {
        await deleteDriveFile(fileId);
        addAuditLog(`Deleted Google Drive file: "${fileName}"`);
        await loadDriveFiles(currentFolderId);
      } catch (err: any) {
        console.error('Delete failed:', err);
        setUploadError(err.message || 'Failed to delete file from Google Drive.');
      } finally {
        setIsDriveLoading(false);
      }
    };

    const navigateToFolder = (folderId: string, folderName: string) => {
      const newPath = [...folderPath, { id: folderId, name: folderName }];
      setFolderPath(newPath);
      setCurrentFolderId(folderId);
    };

    const navigateToBreadcrumb = (index: number) => {
      const clickedItem = folderPath[index];
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolderId(clickedItem.id);
    };

    const formatBytes = (bytes?: string | number) => {
      if (!bytes) return 'N/A';
      const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
      if (isNaN(num)) return 'N/A';
      if (num === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(num) / Math.log(k));
      return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="bg-white border border-gray-150 rounded-[32px] p-6 shadow-2xs text-left space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-100 font-extrabold px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 uppercase tracking-wider">
              <Cloud className="h-3.5 w-3.5" /> {lang === 'bn' ? '‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠ ‡¶∏‡ßç‡¶ü‡ßã‡¶∞‡ßá‡¶ú' : 'Google Drive Storage'}
            </span>
            <h3 className="font-extrabold text-gray-900 text-lg mt-1.5">
              {lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶â‡¶° ‡¶´‡¶æ‡¶á‡¶≤ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶®‡ßç‡¶° ‡¶°‡¶ï‡ßÅ‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶∏‡ßá‡¶®‡ßç‡¶ü‡¶æ‡¶∞' : 'Cloud Document & File Center'}
            </h3>
            <p className="text-xs text-gray-400 font-bold">
              {lang === 'bn' 
                ? '‡¶Ö‡¶®‡¶≤‡¶æ‡¶á‡¶® ‡¶≠‡¶∞‡ßç‡¶§‡¶ø ‡¶´‡¶∞‡¶Æ, ‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶ö‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶è‡¶¨‡¶Ç ‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü ‡¶´‡¶æ‡¶á‡¶≤ ‡¶∏‡¶∞‡¶æ‡¶∏‡¶∞‡¶ø ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠‡ßá ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶ú ‡¶ï‡¶∞‡ßÅ‡¶®‡•§' 
                : 'Directly manage admission folders, student files, notices, and class syllabi securely in Google Drive.'}
            </p>
          </div>
          {googleUser && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
              <div className="text-right">
                <p className="text-xs font-black text-gray-800">{googleUser.displayName}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{googleUser.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black transition-all cursor-pointer"
              >
                {lang === 'bn' ? '‡¶≤‡¶ó ‡¶Ü‡¶â‡¶ü' : 'Disconnect'}
              </button>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {uploadError && (
          <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3">
            <span className="text-rose-600 font-black text-lg leading-none shrink-0">&times;</span>
            <div className="text-xs font-bold text-rose-800">
              <p className="font-black mb-0.5">{lang === 'bn' ? '‡¶§‡ßç‡¶∞‡ßÅ‡¶ü‡¶ø ‡¶ò‡¶ü‡ßá‡¶õ‡ßá' : 'An error occurred'}</p>
              <p>{uploadError}</p>
            </div>
          </div>
        )}

        {/* NOT AUTHENTICATED STATE */}
        {!googleUser ? (
          <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-xs">
              <Cloud className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-extrabold text-gray-900">
                {lang === 'bn' ? '‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠ ‡¶≤‡¶ø‡¶Ç‡¶ï ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Connect Google Drive'}
              </h4>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                {lang === 'bn' 
                  ? '‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠ ‡¶è‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü‡ßá‡¶∞ ‡¶∏‡¶æ‡¶•‡ßá ‡¶∏‡¶Ç‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßá ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶¶‡ßá‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ‡¶´‡¶æ‡¶á‡¶≤ ‡¶Ü‡¶™‡¶≤‡ßã‡¶° ‡¶è‡¶¨‡¶Ç ‡¶°‡¶æ‡¶â‡¶®‡¶≤‡ßã‡¶° ‡¶∏‡ßÅ‡¶¨‡¶ø‡¶ß‡¶æ ‡¶ö‡¶æ‡¶≤‡ßÅ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§' 
                  : 'Link your Google account to access, structure, and upload school documents directly to your persistent cloud storage.'}
              </p>
            </div>

            {/* Custom Google Styled Button */}
            <button
              onClick={handleSignIn}
              disabled={isDriveLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-black border border-gray-300 rounded-2xl px-6 py-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDriveLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#ea4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.3 7.52 8.9 5.04 12 5.04z" />
                  <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.45c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.38-4.87 3.38-8.5z" />
                  <path fill="#fbbc05" d="M5.36 14.5c-.25-.75-.4-1.55-.4-2.5s.15-1.75.4-2.5L1.5 6.5C.54 8.42 0 10.58 0 12s.54 3.58 1.5 5.5l3.86-3z" />
                  <path fill="#34a853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.01.68-2.3 1.09-4.3 1.09-3.1 0-5.7-2.48-6.64-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z" />
                </svg>
              )}
              <span className="text-sm">{lang === 'bn' ? '‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶è‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü ‡¶¶‡¶ø‡ßü‡ßá ‡¶∏‡¶æ‡¶á‡¶®-‡¶á‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          /* AUTHENTICATED STATE - MAIN BROWSER UI */
          <div className="space-y-4">
            {/* Toolbar controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 border border-slate-100 p-3.5 rounded-2xl">
              {/* Breadcrumb / Path */}
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                {folderPath.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <span className="text-gray-300 text-xs font-black">/</span>}
                    <button
                      onClick={() => navigateToBreadcrumb(idx)}
                      disabled={idx === folderPath.length - 1}
                      className={`text-xs font-extrabold transition-all cursor-pointer ${
                        idx === folderPath.length - 1 
                          ? 'text-gray-900 font-black' 
                          : 'text-[#025644] hover:underline'
                      }`}
                    >
                      {item.name === 'root' ? (lang === 'bn' ? '‡¶Ü‡¶Æ‡¶æ‡¶∞ ‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠' : 'My Drive') : item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Back button */}
                {folderPath.length > 1 && (
                  <button
                    onClick={() => navigateToBreadcrumb(folderPath.length - 2)}
                    className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-all cursor-pointer flex items-center justify-center"
                    title={lang === 'bn' ? '‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡ßá‡¶∞ ‡¶´‡ßã‡¶≤‡ßç‡¶°‡¶æ‡¶∞‡ßá ‡¶´‡¶ø‡¶∞‡ßÅ‡¶®' : 'Go back'}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}

                {/* Create Folder Toggle */}
                <button
                  onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#005c53] font-black text-xs rounded-xl border border-emerald-100/50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FolderPlus className="h-4 w-4" />
                  {lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶´‡ßã‡¶≤‡ßç‡¶°‡¶æ‡¶∞' : 'New Folder'}
                </button>

                {/* File Upload Selector */}
                <label className="px-3.5 py-2 bg-[#025644] hover:bg-[#01352a] text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {lang === 'bn' ? '‡¶´‡¶æ‡¶á‡¶≤ ‡¶Ü‡¶™‡¶≤‡ßã‡¶°' : 'Upload File'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Inline Folder Creation Form */}
            {isCreatingFolder && (
              <motion.form
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateFolderSubmit}
                className="p-4 bg-[#f0faf8] border border-[#d2efe9] rounded-2xl flex items-center gap-3"
              >
                <Folder className="h-5 w-5 text-[#005c53]" />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? '‡¶´‡ßã‡¶≤‡ßç‡¶°‡¶æ‡¶∞‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ...' : 'Folder name...'}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#005c53]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#025644] hover:bg-[#01352a] text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? '‡¶§‡ßà‡¶∞‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? '‡¶¨‡¶æ‡¶§‡¶ø‡¶≤' : 'Cancel'}
                </button>
              </motion.form>
            )}

            {/* List / Grid Browser of Files */}
            {isDriveLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#025644]" />
                <p className="text-xs text-gray-400 font-bold">{lang === 'bn' ? '‡¶´‡¶æ‡¶á‡¶≤ ‡¶≤‡ßã‡¶° ‡¶π‡¶ö‡ßç‡¶õ‡ßá...' : 'Fetching items from Google Drive...'}</p>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-20 border border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center">
                  <Folder className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900">{lang === 'bn' ? '‡¶è‡¶á ‡¶´‡ßã‡¶≤‡ßç‡¶°‡¶æ‡¶∞‡¶ü‡¶ø ‡¶ñ‡¶æ‡¶≤‡¶ø' : 'Folder is empty'}</h4>
                  <p className="text-xs text-gray-400 font-bold max-w-xs mt-1">
                    {lang === 'bn' 
                      ? '‡¶è‡¶ñ‡¶æ‡¶®‡ßá ‡¶ï‡ßã‡¶® ‡¶´‡¶æ‡¶á‡¶≤ ‡¶¨‡¶æ ‡¶∏‡¶æ‡¶¨-‡¶´‡ßã‡¶≤‡ßç‡¶°‡¶æ‡¶∞ ‡¶™‡¶æ‡¶ì‡ßü‡¶æ ‡¶Ø‡¶æ‡ßü‡¶®‡¶ø‡•§ ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶™‡ßç‡¶∞‡ßü‡ßã‡¶ú‡¶®‡ßÄ‡ßü ‡¶´‡¶æ‡¶á‡¶≤‡¶ü‡¶ø ‡¶Ü‡¶™‡¶≤‡ßã‡¶° ‡¶ï‡¶∞‡ßÅ‡¶®‡•§' 
                      : 'Create a new folder or drag files here to start organizing files in Google Drive.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {driveFiles.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  return (
                    <div
                      key={file.id}
                      className="bg-white border border-gray-150 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs hover:border-[#005c53]/30 transition-all group text-left"
                    >
                      {/* Top Info */}
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isFolder 
                            ? 'bg-emerald-50 text-[#005c53]' 
                            : 'bg-slate-50 text-slate-500'
                        }`}>
                          {isFolder ? (
                            <Folder className="h-5.5 w-5.5" />
                          ) : (
                            <FileText className="h-5.5 w-5.5" />
                          )}
                        </div>

                        {/* Title & Type */}
                        <div className="min-w-0 flex-1">
                          <h5
                            onClick={() => {
                              if (isFolder) {
                                navigateToFolder(file.id, file.name);
                              }
                            }}
                            className={`text-xs font-extrabold truncate text-gray-900 ${
                              isFolder ? 'cursor-pointer hover:text-[#025644] hover:underline' : ''
                            }`}
                            title={file.name}
                          >
                            {file.name}
                          </h5>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5 font-mono uppercase tracking-wider">
                            {isFolder ? (lang === 'bn' ? '‡¶´‡ßã‡¶≤‡ßç‡¶°‡¶æ‡¶∞' : 'Folder') : formatBytes(file.size)}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Info & Action triggers */}
                      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-gray-400">
                        <span>{formatDate(file.modifiedTime)}</span>
                        
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer referrerPolicy"
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all"
                              title={lang === 'bn' ? '‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠‡ßá ‡¶¶‡ßá‡¶ñ‡ßÅ‡¶®' : 'View in Google Drive'}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteFileClick(file.id, file.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                            title={lang === 'bn' ? '‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡ßÅ‡¶®' : 'Delete'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const today = new Date();
    
    // Dynamic Greeting
    const hours = today.getHours();
    let dynamicGreetingEn = 'Good morning';
    let dynamicGreetingBn = '‡¶∂‡ßÅ‡¶≠ ‡¶∏‡¶ï‡¶æ‡¶≤';
    if (hours >= 12 && hours < 17) {
      dynamicGreetingEn = 'Good afternoon';
      dynamicGreetingBn = '‡¶∂‡ßÅ‡¶≠ ‡¶Ö‡¶™‡¶∞‡¶æ‡¶π‡ßç‡¶®';
    } else if (hours >= 17 && hours < 20) {
      dynamicGreetingEn = 'Good evening';
      dynamicGreetingBn = '‡¶∂‡ßÅ‡¶≠ ‡¶∏‡¶®‡ßç‡¶ß‡ßç‡¶Ø‡¶æ';
    } else if (hours >= 20 || hours < 5) {
      dynamicGreetingEn = 'Good night';
      dynamicGreetingBn = '‡¶∂‡ßÅ‡¶≠ ‡¶∞‡¶æ‡¶§‡ßç‡¶∞‡¶ø';
    }

    // Dynamic English Date Format
    const englishDateStr = today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Dynamic Bangla Date Format
    const getBanglaDateStr = (date: Date) => {
      const year = date.getFullYear();
      let boishakhYear = year - 593;
      let boishakhDate = new Date(year, 3, 14); // April 14
      if (date < boishakhDate) {
        boishakhYear = year - 594;
        boishakhDate = new Date(year - 1, 3, 14);
      }
      const diffTime = Math.abs(date.getTime() - boishakhDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      if (isLeapYear) {
        lengths[10] = 31;
      }
      
      const banglaMonths = [
        '‡¶¨‡ßà‡¶∂‡¶æ‡¶ñ', '‡¶ú‡ßç‡¶Ø‡ßà‡¶∑‡ßç‡¶†', '‡¶Ü‡¶∑‡¶æ‡ßù', '‡¶∂‡ßç‡¶∞‡¶æ‡¶¨‡¶£', '‡¶≠‡¶æ‡¶¶‡ßç‡¶∞', '‡¶Ü‡¶∂‡ßç‡¶¨‡¶ø‡¶®', 
        '‡¶ï‡¶æ‡¶∞‡ßç‡¶§‡¶ø‡¶ï', '‡¶Ö‡¶ó‡ßç‡¶∞‡¶π‡¶æ‡¶Ø‡¶º‡¶£', '‡¶™‡ßå‡¶∑', '‡¶Æ‡¶æ‡¶ò', '‡¶´‡¶æ‡¶≤‡ßç‡¶ó‡ßÅ‡¶®', '‡¶ö‡ßà‡¶§‡ßç‡¶∞'
      ];
      
      let remainingDays = diffDays;
      let banglaMonthIdx = 0;
      for (let i = 0; i < lengths.length; i++) {
        if (remainingDays < lengths[i]) {
          banglaMonthIdx = i;
          break;
        }
        remainingDays -= lengths[i];
      }
      const banglaDay = remainingDays + 1;
      const banglaDaysOfWeek = ['‡¶∞‡¶¨‡¶ø‡¶¨‡¶æ‡¶∞', '‡¶∏‡ßã‡¶Æ‡¶¨‡¶æ‡¶∞', '‡¶Æ‡¶ô‡ßç‡¶ó‡¶≤‡¶¨‡¶æ‡¶∞', '‡¶¨‡ßÅ‡¶ß‡¶¨‡¶æ‡¶∞', '‡¶¨‡ßÉ‡¶π‡¶∏‡ßç‡¶™‡¶§‡¶ø‡¶¨‡¶æ‡¶∞', '‡¶∂‡ßÅ‡¶ï‡ßç‡¶∞‡¶¨‡¶æ‡¶∞', '‡¶∂‡¶®‡¶ø‡¶¨‡¶æ‡¶∞'];
      const dayOfWeek = banglaDaysOfWeek[date.getDay()];
      
      const toBanglaDigits = (num: number) => {
        const digits = ['‡ß¶', '‡ßß', '‡ß®', '‡ß©', '‡ß™', '‡ß´', '‡ß¨', '‡ß≠', '‡ßÆ', '‡ßØ'];
        return num.toString().split('').map(d => digits[parseInt(d)] || d).join('');
      };
      
      return `${dayOfWeek}, ${toBanglaDigits(banglaDay)} ${banglaMonths[banglaMonthIdx]}, ${toBanglaDigits(boishakhYear)}`;
    };
    const banglaDateStr = getBanglaDateStr(today);

    // Dynamic Hijri Date Format
    const getHijriDateStr = (date: Date, l: 'bn' | 'en') => {
      try {
        const locale = l === 'bn' ? 'bn-BD-u-ca-islamic-umalqura' : 'en-US-u-ca-islamic-umalqura';
        const formatter = new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        let parts = formatter.format(date);
        const daysOfWeekEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const daysOfWeekBn = ['‡¶∞‡¶¨‡¶ø‡¶¨‡¶æ‡¶∞', '‡¶∏‡ßã‡¶Æ‡¶¨‡¶æ‡¶∞', '‡¶Æ‡¶ô‡ßç‡¶ó‡¶≤‡¶¨‡¶æ‡¶∞', '‡¶¨‡ßÅ‡¶ß‡¶¨‡¶æ‡¶∞', '‡¶¨‡ßÉ‡¶π‡¶∏‡ßç‡¶™‡¶§‡¶ø‡¶¨‡¶æ‡¶∞', '‡¶∂‡ßÅ‡¶ï‡ßç‡¶∞‡¶¨‡¶æ‡¶∞', '‡¶∂‡¶®‡¶ø‡¶¨‡¶æ‡¶∞'];
        const weekday = l === 'bn' ? daysOfWeekBn[date.getDay()] : daysOfWeekEn[date.getDay()];
        
        if (l === 'bn') {
          if (!parts.includes('‡¶π‡¶ø‡¶ú‡¶∞‡¶ø') && !parts.includes('‡¶π‡¶ø‡¶ú‡¶∞‡ßÄ')) {
            parts = parts + ' ‡¶π‡¶ø‡¶ú‡¶∞‡¶ø';
          }
          return `${weekday}, ${parts}`;
        } else {
          if (!parts.includes('AH')) {
            parts = parts + ' AH';
          }
          return `${weekday}, ${parts}`;
        }
      } catch (e) {
        return l === 'bn' ? '‡¶∂‡¶®‡¶ø‡¶¨‡¶æ‡¶∞, ‡ß®‡ß¨ ‡¶Æ‡¶π‡¶∞‡¶∞‡¶Æ, ‡ßß‡ß™‡ß™‡ßÆ ‡¶π‡¶ø‡¶ú‡¶∞‡¶ø' : 'Saturday, Muharram 26, 1448 AH';
      }
    };
    const hijriDateStrBn = getHijriDateStr(today, 'bn');
    const hijriDateStrEn = getHijriDateStr(today, 'en');

    const heatmapDays = [
      { day: 1, rate: 45, color: 'bg-teal-50 text-teal-800 border-teal-200/40' },
      { day: 2, rate: 95, color: 'bg-[#025644] text-white border-teal-700/30 shadow-xs shadow-teal-500/10' },
      { day: 3, rate: 88, color: 'bg-teal-500 text-white border-teal-600/40' },
      { day: 4, rate: 82, color: 'bg-teal-300 text-teal-900 border-teal-400/50' },
      { day: 5, rate: 91, color: 'bg-teal-500 text-white border-teal-600/40 shadow-xs' },
      { day: 6, rate: 94, color: 'bg-[#025644] text-white border-teal-700/30 shadow-xs shadow-teal-500/10' },
      { day: 7, rate: 85, color: 'bg-teal-300 text-teal-900 border-teal-400/50' },
      { day: 8, rate: 76, color: 'bg-teal-100 text-teal-800 border-teal-200/50' },
      { day: 9, rate: 52, color: 'bg-teal-50 text-teal-800 border-teal-200/50' },
      { day: 10, rate: 92, color: 'bg-[#025644] text-white border-teal-700/30' },
      { day: 11, rate: 90, color: 'bg-teal-500 text-white border-teal-600/40' },
      { day: 12, rate: 80, color: 'bg-teal-300 text-teal-900 border-teal-400/50' },
      { day: 13, rate: 61, color: 'bg-teal-100 text-teal-800 border-teal-200/50' },
      { day: 14, rate: 48, color: 'bg-teal-50 text-teal-800 border-teal-200/50' },
      { day: 15, rate: 96, color: 'bg-[#025644] text-white border-teal-700/30' },
      { day: 16, rate: 84, color: 'bg-teal-300 text-teal-900 border-teal-400/50' },
      { day: 17, rate: 81, color: 'bg-teal-300 text-teal-900 border-teal-400/50' },
      { day: 18, rate: 92, color: 'bg-[#025644] text-white border-teal-700/30' },
      { day: 19, rate: 93, color: 'bg-[#025644] text-white border-teal-700/30' },
      { day: 20, rate: 72, color: 'bg-teal-100 text-teal-800 border-teal-200/50' },
      { day: 21, rate: 95, color: 'bg-[#025644] text-white border-teal-700/30 shadow-xs' },
      { day: 22, rate: 91, color: 'bg-teal-500 text-white border-teal-600/40 shadow-xs' },
      { day: 23, rate: 93, color: 'bg-[#025644] text-white border-teal-700/30 shadow-xs' },
      { day: 24, rate: 86, color: 'bg-teal-500 text-white border-teal-600/40' },
      { day: 25, rate: 55, color: 'bg-teal-50 text-teal-800 border-teal-200/50' },
      { day: 26, rate: 88, color: 'bg-teal-500 text-white border-teal-600/30' },
      { day: 27, rate: 83, color: 'bg-teal-300 text-teal-900 border-teal-400/50' },
      { day: 28, rate: 58, color: 'bg-teal-50 text-teal-800 border-teal-200/50' },
      { day: 29, rate: 92, color: 'bg-[#025644] text-white border-teal-700/30 shadow-xs' },
      { day: 30, rate: 94, color: 'bg-[#025644] text-white border-teal-700/30 shadow-xs' },
      { day: 31, rate: 74, color: 'bg-teal-100 text-teal-800 border-teal-200/50' },
    ];

    return (
      <div className="space-y-6">
        {/* Beautiful Greetings Header (Transparent Canvas Background with floating Badges) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-left">
          <div className="space-y-1.5">
            <h2 className="text-2.5xl sm:text-3.5xl font-black tracking-tight text-gray-900 flex items-center gap-2">
              {lang === 'bn' ? `${dynamicGreetingBn}, ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶®!` : `${dynamicGreetingEn}, Admin!`} <span className="inline-block">üèµÔ∏è</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-bold">
              {lang === 'bn' 
                ? `‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡ßü‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤‡ßá ‡¶Ü‡¶ú‡¶ï‡ßá ‡¶ï‡¶ø ‡¶ï‡¶ø ‡¶ò‡¶ü‡¶õ‡ßá ‡¶§‡¶æ ‡¶¶‡ßá‡¶ñ‡ßá ‡¶®‡¶ø‡¶®, ${englishDateStr}‡•§` 
                : `Here's what's happening at Students Care Model School today, ${englishDateStr}.`}
            </p>
          </div>
          
          {/* Calendar Badges side-by-side as in Screenshot 1 */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            {/* English Date */}
            <div className="bg-white border border-gray-150 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="h-9 w-9 rounded-xl bg-slate-50 text-gray-500 border border-gray-100 flex items-center justify-center shrink-0">
                <Globe className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">English</span>
                <span className="text-xs font-black text-gray-800 block">{englishDateStr}</span>
              </div>
            </div>

            {/* Bangla Date */}
            <div className="bg-white border border-gray-150 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex items-center justify-center shrink-0">
                <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] font-bold text-emerald-600 tracking-wider block mb-0.5">‡¶¨‡¶æ‡¶Ç‡¶≤‡¶æ</span>
                <span className="text-xs font-black text-gray-800 block">{banglaDateStr}</span>
              </div>
            </div>

            {/* Hijri Date */}
            <div className="bg-white border border-gray-150 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50 flex items-center justify-center shrink-0">
                <Clock className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] font-bold text-amber-600 tracking-wider block mb-0.5">‡¶π‡¶ø‡¶ú‡¶∞‡¶ø</span>
                <span className="text-xs font-black text-gray-800 block">{lang === 'bn' ? hijriDateStrBn : hijriDateStrEn}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Stats Row with SVG Sparklines on the right of values */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { 
              labelBn: "‡¶Æ‡ßã‡¶ü ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ", 
              labelEn: "Total Students", 
              value: students.length.toString(), 
              change: students.filter(s => s.status === 'Active').length > 0 ? `+${((students.filter(s => s.status === 'Active').length / students.length) * 100).toFixed(0)}% Act` : "0%",
              trend: "up", 
              sparkData: [12, 14, 13, 15, 14, 16, students.length * 2], 
              color: "#a855f7", 
              bg: "purple" 
            },
            { 
              labelBn: "‡¶Æ‡ßÅ‡¶≤‡¶§‡ßÅ‡¶¨‡¶ø ‡¶≠‡¶∞‡ßç‡¶§‡¶ø ‡¶Ü‡¶¨‡ßá‡¶¶‡¶®", 
              labelEn: "Pending Admissions", 
              value: pendingAdmissions.filter((adm: any) => adm.status === 'pending').length.toString(), 
              change: `Req: ${pendingAdmissions.length}`, 
              trend: "neutral", 
              sparkData: [8, 10, 9, 11, 10, 12, pendingAdmissions.filter((adm: any) => adm.status === 'pending').length * 4], 
              color: "#10b981", 
              bg: "emerald" 
            },
            { 
              labelBn: "‡¶ï‡¶∞‡ßç‡¶Æ‡¶∞‡¶§ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï", 
              labelEn: "Active Teachers", 
              value: employees.filter(e => e.status === 'Active').length.toString(), 
              change: `Tot: ${employees.length}`, 
              trend: "up", 
              sparkData: [10, 8, 11, 9, 12, 11, employees.filter(e => e.status === 'Active').length * 5], 
              color: "#d97706", 
              bg: "amber" 
            },
            { 
              labelBn: "‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ‡¶∏‡¶Æ‡ßÇ‡¶π", 
              labelEn: "Active Classes", 
              value: Array.from(new Set(students.map(s => s.class))).length.toString(), 
              change: "Real-time", 
              trend: "up", 
              sparkData: [4, 5, 5, 6, 6, 7, Array.from(new Set(students.map(s => s.class))).length * 3], 
              color: "#f43f5e", 
              bg: "rose" 
            }
          ].map((stat, idx) => {
            const isUp = stat.trend === 'up';
            return (
              <motion.div 
                key={idx} 
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white border border-gray-150 p-6 md:p-7 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-2xs hover:shadow-md text-left transition-all relative overflow-hidden group"
              >
                {/* Top Row: Icon on left, trend badge on right */}
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-3xs transition-transform group-hover:scale-110 ${
                    stat.bg === 'purple' ? 'bg-[#f3e8ff] text-[#a855f7]' :
                    stat.bg === 'emerald' ? 'bg-[#e6f4f1] text-[#025644]' :
                    stat.bg === 'amber' ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-[#ffe4e6] text-[#e11d48]'
                  }`}>
                    {stat.bg === 'purple' ? <Users className="h-5 w-5" /> :
                     stat.bg === 'emerald' ? <GraduationCap className="h-5 w-5" /> :
                     stat.bg === 'amber' ? <BookOpen className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
                  </div>

                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {stat.change}
                  </span>
                </div>

                {/* Bottom Row: [Value & Label] on left, Sparkline on right */}
                <div className="flex items-end justify-between mt-2">
                  <div className="space-y-0.5 text-left pl-1">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 block tracking-tight font-mono leading-none">{stat.value}</span>
                    <span className="text-[10px] sm:text-[11px] text-[#475569] font-bold block whitespace-nowrap">
                      {lang === 'bn' ? stat.labelBn : stat.labelEn}
                    </span>
                  </div>

                  {/* Sparkline layout to match Screenshot 1 */}
                  <div className="w-20 h-8 flex items-center justify-end">
                    <svg className="w-full h-full" viewBox="0 0 100 30">
                      <defs>
                        <linearGradient id={`gradient-${stat.bg}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stat.color} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={stat.color} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M ${stat.sparkData.map((val, i) => `${i * (100 / (stat.sparkData.length - 1))} ${30 - val}`).join(' L ')}`}
                        fill="none"
                        stroke={stat.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={`M 0 30 L ${stat.sparkData.map((val, i) => `${i * (100 / (stat.sparkData.length - 1))} ${30 - val}`).join(' L ')} L 100 30 Z`}
                        fill={`url(#gradient-${stat.bg})`}
                        opacity="0.15"
                      />
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Row 3: Three Highlight Cards (Total Collection, Pending Dues, Overdue) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card A: Total Collection */}
          <div className="bg-[#029a9c] text-white p-6 rounded-2xl shadow-xs flex flex-col justify-between min-h-[180px] relative overflow-hidden group border border-teal-500/30">
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-50">{lang === 'bn' ? '‡¶Æ‡ßã‡¶ü ‡¶ï‡¶æ‡¶≤‡ßá‡¶ï‡¶∂‡¶®' : 'Total Collection'}</span>
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-white/15">
                <Coins className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="my-3 text-left space-y-1">
              <h3 className="text-3xl font-black tracking-tight leading-none font-sans">
                ‡ß≥ 1,25,760
              </h3>
              <p className="text-[11px] text-teal-100/90 font-bold">{lang === 'bn' ? '‡¶ö‡¶≤‡¶§‡¶ø ‡¶Æ‡¶æ‡¶∏ ‚Ä¢ ‡¶ü‡¶æ‡¶∞‡ßç‡¶ó‡ßá‡¶ü‡ßá‡¶∞ ‡ßÆ‡ßß%' : 'This month ‚Ä¢ 81% of target'}</p>
            </div>
            <div className="w-full">
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white h-1.5 rounded-full transition-all duration-500" style={{ width: '81%' }} />
              </div>
            </div>
          </div>

          {/* Card B: Pending Dues */}
          <div className="bg-[#fff9e6] border border-[#fde68a] p-6 rounded-2xl shadow-xs flex flex-col justify-between min-h-[180px] group text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">{lang === 'bn' ? '‡¶¨‡¶ï‡ßá‡ßü‡¶æ ‡¶™‡¶æ‡¶ì‡¶®‡¶æ' : 'Pending Dues'}</span>
              <div className="h-10 w-10 bg-amber-200/60 rounded-xl flex items-center justify-center text-amber-800 shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-amber-300/30">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="my-2 text-left">
              <h3 className="text-3xl font-black tracking-tight leading-none text-amber-950">
                ‡ß≥ 28,430
              </h3>
              <p className="text-[11px] text-amber-900/80 font-extrabold mt-1">{lang === 'bn' ? '‡ßß‡ß™‡ß® ‡¶ú‡¶® ‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï‡ßá‡¶∞ ‡¶™‡ßá‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶¨‡¶æ‡¶ï‡¶ø' : '142 guardians pending payment'}</p>
            </div>
            <button className="w-full max-w-fit mt-1 px-4 py-1.5 bg-white hover:bg-amber-50 text-amber-900 text-xs font-black rounded-xl border border-amber-200/60 transition-all cursor-pointer shadow-3xs flex items-center justify-center">
              {lang === 'bn' ? '‡¶∞‡¶ø‡¶Æ‡¶æ‡¶á‡¶®‡ßç‡¶°‡¶æ‡¶∞ ‡¶™‡¶æ‡¶†‡¶æ‡¶®' : 'Send reminders'}
            </button>
          </div>

          {/* Card C: Overdue */}
          <div className="bg-[#ffe4e6] border border-[#fda4af] p-6 rounded-2xl shadow-xs flex flex-col justify-between min-h-[180px] group text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#881337]">{lang === 'bn' ? '‡¶Ö‡¶§‡¶ø‡¶∞‡¶ø‡¶ï‡ßç‡¶§ ‡¶¨‡¶ø‡¶≤‡¶Æ‡ßç‡¶¨‡¶ø‡¶§' : 'Overdue'}</span>
              <div className="h-10 w-10 bg-rose-200/80 rounded-xl flex items-center justify-center text-[#881337] shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-rose-300/30">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <div className="my-2 text-left">
              <h3 className="text-3xl font-black tracking-tight leading-none text-[#881337]">
                ‡ß≥ 9,870
              </h3>
              <p className="text-[11px] text-[#9f1239] font-extrabold mt-1">{lang === 'bn' ? '‡ß©‡ßÆ ‡¶ü‡¶ø ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü ‚Ä¢ ‡ß©‡ß¶+ ‡¶¶‡¶ø‡¶® ‡¶Ö‡¶§‡¶ø‡¶¨‡¶æ‡¶π‡¶ø‡¶§' : '38 accounts ‚Ä¢ > 30 days'}</p>
            </div>
            <button className="w-full max-w-fit mt-1 px-4 py-1.5 bg-white hover:bg-rose-100 text-[#881337] text-xs font-black rounded-xl border border-rose-300 transition-all cursor-pointer shadow-3xs flex items-center justify-center">
              {lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü ‡¶∞‡¶ø‡¶≠‡¶ø‡¶â' : 'Review accounts'}
            </button>
          </div>
        </div>

        {/* Row 4: Student & Fee Overview & Fee Collection Status Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student & Fee Overview Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-150 p-6 rounded-2xl shadow-2xs text-left flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? '‡¶õ‡¶æ‡¶§‡ßç‡¶∞ ‡¶ì ‡¶´‡¶ø ‡¶ì‡¶≠‡¶æ‡¶∞‡¶≠‡¶ø‡¶â' : 'Student & Fee Overview'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? '‡¶¨‡¶ø‡¶ó‡¶§ ‡ßÆ ‡¶Æ‡¶æ‡¶∏ ‚Ä¢ ‡¶¶‡ßç‡¶¨‡ßà‡¶§ ‡¶Ö‡¶ï‡ßç‡¶∑' : 'Last 8 months ‚Ä¢ dual axis'}</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-extrabold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block" />
                  <span className="text-gray-500">{lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ' : 'Students'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 block" />
                  <span className="text-gray-600">{lang === 'bn' ? '‡¶´‡¶ø ‡¶ï‡¶æ‡¶≤‡ßá‡¶ï‡¶∂‡¶®' : 'Fees'}</span>
                </div>
              </div>
            </div>

            <div className="w-full h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { name: 'Nov', students: 1010, fees: 89000 },
                    { name: 'Dec', students: 1040, fees: 93000 },
                    { name: 'Jan', students: 1070, fees: 97000 },
                    { name: 'Feb', students: 1100, fees: 100000 },
                    { name: 'Mar', students: 1120, fees: 103000 },
                    { name: 'Apr', students: 1150, fees: 107000 },
                    { name: 'May', students: 1190, fees: 112000 },
                    { name: 'Jun', students: 1248, fees: 125760 },
                  ]}
                  margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    domain={[700, 1400]}
                    tick={{ fill: '#047857', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    domain={[70000, 140000]}
                    tickFormatter={(val) => `‡ß≥${(val / 1000).toFixed(0)}k`}
                    tick={{ fill: '#1d4ed8', fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 800, color: '#1e293b' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="students" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="fees" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Collection Status Donut Chart */}
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-2xs text-left flex flex-col justify-between">
            <div className="pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? '‡¶´‡¶ø ‡¶ï‡¶æ‡¶≤‡ßá‡¶ï‡¶∂‡¶® ‡¶∏‡ßç‡¶ü‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶∏' : 'Fee Collection Status'}</h3>
              <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? '‡¶Ü‡¶ó‡¶∏‡ßç‡¶ü ‡¶Æ‡¶æ‡¶∏‡ßá‡¶∞ ‡¶´‡¶ø ‡¶∏‡¶æ‡¶∞‡¶∏‡¶Ç‡¶ï‡ßç‡¶∑‡ßá‡¶™' : 'August summary'}</p>
            </div>

            <div className="flex flex-col items-center justify-center my-auto py-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="25.12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="57.77"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-gray-950 leading-none">77%</span>
                  <span className="text-[10px] text-gray-500 font-extrabold mt-1">{lang === 'bn' ? '‡¶∏‡¶Ç‡¶ó‡ßÉ‡¶π‡ßÄ‡¶§' : 'Collected'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold text-[#475569] pt-3 border-t border-gray-100 mt-2">
              <div>
                <span className="block text-blue-600 font-black">‡ß≥97k</span>
                <span>{lang === 'bn' ? '‡¶∏‡¶Ç‡¶ó‡ßÉ‡¶π‡ßÄ‡¶§' : 'Collected'}</span>
              </div>
              <div>
                <span className="block text-orange-500 font-black">‡ß≥18k</span>
                <span>{lang === 'bn' ? '‡¶¨‡¶ï‡ßá‡ßü‡¶æ' : 'Pending'}</span>
              </div>
              <div>
                <span className="block text-red-500 font-black">‡ß≥10k</span>
                <span>{lang === 'bn' ? '‡¶¨‡¶ø‡¶≤‡¶Æ‡ßç‡¶¨‡¶ø‡¶§' : 'Overdue'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Grid & Top Performers Leaderboard Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Attendance Heatmap */}
          <div className="lg:col-span-7 bg-white border border-gray-150 p-6 rounded-2xl shadow-2xs text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? '‡¶¶‡ßà‡¶®‡¶ø‡¶ï ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø ‡¶π‡¶ø‡¶ü‡¶Æ‡ßç‡¶Ø‡¶æ‡¶™' : 'Daily Attendance Heatmap'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶¶‡ßá‡¶∞ ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø ‡¶ò‡¶®‡¶§‡ßç‡¶¨‡ßá‡¶∞ ‡¶∞‡ßá‡¶ï‡¶∞‡ßç‡¶°' : 'Student attendance density records'}</p>
              </div>
              <span className="text-xs font-black text-[#005c53] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                {lang === 'bn' ? '‡¶Ü‡¶ó‡¶∏‡ßç‡¶ü ‡ß®‡ß¶‡ß®‡ß¨' : 'August 2026'}
              </span>
            </div>

            {/* Heatmap Grid of Days */}
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <span key={idx} className="text-center text-xs font-black text-slate-400 py-1">{day}</span>
              ))}
              {heatmapDays.map((d) => (
                <div
                  key={d.day}
                  title={`Day ${d.day}: ${d.rate}% attendance`}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all hover:scale-110 border cursor-pointer ${d.color}`}
                >
                  {d.day}
                </div>
              ))}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-4 text-xs font-extrabold text-gray-500 pt-1">
              <span className="text-[11px] uppercase tracking-wider">{lang === 'bn' ? '‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø ‡¶π‡¶æ‡¶∞:' : 'Attendance Rate:'}</span>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-lg bg-teal-50 border border-teal-200 block" />
                <span>&lt; 50%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-lg bg-teal-100 border border-teal-200 block" />
                <span>50% - 75%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-lg bg-teal-300 border border-teal-400 block" />
                <span>75% - 85%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-lg bg-teal-500 border border-teal-600 block" />
                <span>85% - 93%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-lg bg-[#025644] border border-teal-700 block" />
                <span>&gt; 93%</span>
              </div>
            </div>
          </div>

          {/* Top Performers Leaderboard */}
          <div className="lg:col-span-5 bg-white border border-gray-150 p-6 rounded-2xl shadow-2xs text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? '‡¶∏‡ßá‡¶∞‡¶æ ‡¶™‡¶æ‡¶∞‡¶´‡¶∞‡ßç‡¶Æ‡¶æ‡¶∞ ‡¶≤‡¶ø‡¶°‡¶æ‡¶∞‡¶¨‡ßã‡¶∞‡ßç‡¶°' : 'Top Performers Leaderboard'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? '‡¶è‡¶ï‡¶æ‡¶°‡ßá‡¶Æ‡¶ø‡¶ï ‡¶ì ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø ‡¶∏‡ßç‡¶ï‡ßã‡¶∞‡ßá ‡¶∏‡ßá‡¶∞‡¶æ ‡ß´ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ' : 'Top 5 students in academics & attendance'}</p>
              </div>
              <span className="text-xs font-black text-[#005c53] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                {lang === 'bn' ? '‡¶ö‡¶≤‡¶§‡¶ø ‡¶ü‡¶æ‡¶∞‡ßç‡¶Æ' : 'Current Term'}
              </span>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-4">
              {[
                { rank: 1, name: 'Sajid Hasan', class: 'Class 9-A', score: '98.5%', badge: 'üèÜ Golden A+' },
                { rank: 2, name: 'Tasnim Rahman', class: 'Class 10-A', score: '97.2%', badge: '‚≠ê High Attendance' },
                { rank: 3, name: 'Arefin Chowdhury', class: 'Class 8-B', score: '95.8%', badge: '‚≠ê Top Grade' },
                { rank: 4, name: 'Maliha Islam', class: 'Class 9-B', score: '94.3%', badge: '‚≠ê Consistently Active' },
                { rank: 5, name: 'Nabil Ahmed', class: 'Class 7-A', score: '93.1%', badge: '‚≠ê Excel' }
              ].map((student) => (
                <div key={student.rank} className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                      student.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      student.rank === 2 ? 'bg-slate-150 text-slate-700 border border-slate-200' :
                      student.rank === 3 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-gray-100 text-gray-500 border border-gray-150'
                    }`}>
                      {student.rank}
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-gray-900 text-xs block">{student.name}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{student.class} ‚Ä¢ {student.badge}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gray-900 text-xs">{student.score}</span>
                    <span className="text-[9px] text-emerald-600 font-bold block">‚òÖ Score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeveloperHub = () => {
    const handleCopyCode = (id: string, codeText: string) => {
      navigator.clipboard.writeText(codeText);
      setDeveloperCopiedId(id);
      setTimeout(() => setDeveloperCopiedId(null), 2000);
    };

    const escapeStr = (str: string) => (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

    // 1. Dynamic Full School Settings Code (Lines 521 - 542)
    const dynamicSchoolSettingsCode = `// File: /src/components/StudentPortal.tsx (Lines 521 - 542)
// Replace lines 521 to 542 inside StudentPortal.tsx to set your active settings as the hardcoded system default:
    return {
      schoolName: '\${escapeStr(schoolSettings.schoolName)}',
      schoolNameEn: '\${escapeStr(schoolSettings.schoolNameEn)}',
      schoolNameBn: '\${escapeStr(schoolSettings.schoolNameBn)}',
      schoolLogo: '\${escapeStr(schoolSettings.schoolLogo)}',
      headerNotice: '\${escapeStr(schoolSettings.headerNotice)}',
      bannerEnabled: \${schoolSettings.bannerEnabled},
      headerBgColor: '\${schoolSettings.headerBgColor}',
      addressEn: '\${escapeStr(schoolSettings.addressEn)}',
      addressBn: '\${escapeStr(schoolSettings.addressBn)}',
      activeYear: '\${escapeStr(schoolSettings.activeYear)}',
      officeMobile: '\${escapeStr(schoolSettings.officeMobile)}',
      officeAddress: '\${escapeStr(schoolSettings.officeAddress)}',
      primaryPassMarks: \${Number(schoolSettings.primaryPassMarks) || 33},
      examPassMarks: \${Number(schoolSettings.examPassMarks) || 33},
      cronEnabled: \${!!schoolSettings.cronEnabled},
      testimonialHeading: '\${escapeStr(schoolSettings.testimonialHeading)}',
      customFields: \${JSON.stringify(schoolSettings.customFields, null, 8)}
    };`;

    // 2. School Identity & Branding Code (Lines 522 - 528)
    const brandingCode = `// File: /src/components/StudentPortal.tsx (Lines 522 - 528)
// Replace lines 522 to 528 inside StudentPortal.tsx to update default school names, logo and colors:
      schoolName: '\${escapeStr(schoolSettings.schoolName)}',
      schoolNameEn: '\${escapeStr(schoolSettings.schoolNameEn)}',
      schoolNameBn: '\${escapeStr(schoolSettings.schoolNameBn)}',
      schoolLogo: '\${escapeStr(schoolSettings.schoolLogo)}',
      headerNotice: '\${escapeStr(schoolSettings.headerNotice)}',
      bannerEnabled: \${schoolSettings.bannerEnabled},
      headerBgColor: '\${schoolSettings.headerBgColor}',`;

    // 3. Contacts & Session Addresses Code (Lines 529 - 533)
    const contactsCode = `// File: /src/components/StudentPortal.tsx (Lines 529 - 533)
// Replace lines 529 to 533 inside StudentPortal.tsx to update default addresses and active session:
      addressEn: '\${escapeStr(schoolSettings.addressEn)}',
      addressBn: '\${escapeStr(schoolSettings.addressBn)}',
      activeYear: '\${escapeStr(schoolSettings.activeYear)}',
      officeMobile: '\${escapeStr(schoolSettings.officeMobile)}',
      officeAddress: '\${escapeStr(schoolSettings.officeAddress)}',`;

    // 4. Pass Marks & Testimonials Code (Lines 534 - 537)
    const passMarksCode = `// File: /src/components/StudentPortal.tsx (Lines 534 - 537)
// Replace lines 534 to 537 inside StudentPortal.tsx to update default pass marks and scheduling status:
      primaryPassMarks: \${Number(schoolSettings.primaryPassMarks) || 33},
      examPassMarks: \${Number(schoolSettings.examPassMarks) || 33},
      cronEnabled: \${!!schoolSettings.cronEnabled},
      testimonialHeading: '\${escapeStr(schoolSettings.testimonialHeading)}',`;

    // 5. Custom Student Fields Code (Lines 538 - 541)
    const customFieldsCode = `// File: /src/components/StudentPortal.tsx (Lines 538 - 541)
// Replace lines 538 to 541 inside StudentPortal.tsx to update default custom admission registry fields:
      customFields: \${JSON.stringify(schoolSettings.customFields, null, 8)}`;

    // 6. Routine System States (Lines 463 - 473)
    const stateCode = `// File: /src/components/StudentPortal.tsx (Lines 463 - 473)
// Teacher Class Routine state variables declared at the top component level to respect React Hooks Rules:
  // Teacher Class Routine state variables
  const [activeAddModal, setActiveAddModal] = useState<{ teacherName: string; periodId: string } | null>(null);
  const [addForm, setAddForm] = useState({ day: 'Sun', classId: 'Class 9-A', subject: 'Physics', room: '301' });

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const [newClassInput, setNewClassInput] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState({ code: '', name: '', class: 'Class 9-A', teacher: '' });`;

    // 7. Left Sidebar Menu configuration (Lines 3727 - 3749)
    const menuCode = `// File: /src/components/StudentPortal.tsx (Lines 3727 - 3749)
// Replace lines 3727 to 3749 inside StudentPortal.tsx to modify or reorder Left-Side Navigation links:
    const menuItems = [
      { id: 'dashboard', label: lang === 'bn' ? '‡¶°‡ßç‡¶Ø‡¶æ‡¶∂‡¶¨‡ßã‡¶∞‡ßç‡¶°' : 'Dashboard', icon: LayoutDashboard },
      { id: 'frontend', label: lang === 'bn' ? '‡¶´‡ßç‡¶∞‡¶®‡ßç‡¶ü‡¶è‡¶®‡ßç‡¶° ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏' : 'Frontend', icon: Sliders },
      { id: 'student_details', label: lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶§‡¶•‡ßç‡¶Ø' : 'Student Details', icon: Users },
      { id: 'admission', label: lang === 'bn' ? '‡¶≠‡¶∞‡ßç‡¶§‡¶ø ‡¶ï‡¶æ‡¶∞‡ßç‡¶Ø‡¶ï‡ßç‡¶∞‡¶Æ' : 'Admission', icon: UserPlus },
      { id: 'employee', label: lang === 'bn' ? '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶ì ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï' : 'Employee', icon: GraduationCap },
      { id: 'classes', label: lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶∞‡ßÅ‡¶Æ' : 'Classes', icon: BookOpen },
      { id: 'fees', label: lang === 'bn' ? '‡¶´‡¶ø ‡¶ï‡¶æ‡¶≤‡ßá‡¶ï‡¶∂‡¶®' : 'Fees', icon: Wallet },
      { id: 'card', label: lang === 'bn' ? '‡¶Ü‡¶á‡¶°‡¶ø ‡¶ï‡¶æ‡¶∞‡ßç‡¶° ‡¶§‡ßà‡¶∞‡¶ø' : 'Card Management', icon: CreditCard },
      { id: 'certificate', label: lang === 'bn' ? '‡¶∂‡¶Ç‡¶∏‡¶æ‡¶™‡¶§‡ßç‡¶∞' : 'Certificate', icon: Award },
      { id: 'academic', label: lang === 'bn' ? '‡¶è‡¶ï‡¶æ‡¶°‡ßá‡¶Æ‡¶ø‡¶ï ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶®' : 'Academic', icon: Calendar },
      { id: 'exam', label: lang === 'bn' ? '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶ì ‡¶´‡¶≤‡¶æ‡¶´‡¶≤' : 'Exam', icon: FileText },
      { id: 'attendance', label: lang === 'bn' ? '‡¶π‡¶æ‡¶ú‡¶ø‡¶∞‡¶æ ‡¶ñ‡¶æ‡¶§‡¶æ' : 'Attendance', icon: CheckSquare },
      { id: 'notice', label: lang === 'bn' ? '‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶™‡¶æ‡¶¨‡¶≤‡¶ø‡¶∂‡¶æ‡¶∞' : 'Notice', icon: Bell },
      { id: 'homework', label: lang === 'bn' ? '‡¶¨‡¶æ‡ßú‡¶ø‡¶∞ ‡¶ï‡¶æ‡¶ú' : 'Homework', icon: BookOpen },
      { id: 'sms', label: lang === 'bn' ? '‡¶¨‡¶æ‡¶≤‡ßç‡¶ï ‡¶è‡¶∏‡¶è‡¶Æ‡¶è‡¶∏' : 'Bulk Sms And Email', icon: MessageSquare },
      { id: 'student_accounting', label: lang === 'bn' ? '‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü ‡¶π‡¶ø‡¶∏‡¶æ‡¶¨' : 'Student Accounting', icon: DollarSign },
      { id: 'office_accounting', label: lang === 'bn' ? '‡¶Ö‡¶´‡¶ø‡¶∏ ‡¶ï‡ßç‡¶Ø‡¶æ‡¶∂ ‡¶¨‡ßÅ‡¶ï' : 'Office Accounting', icon: FileSpreadsheet },
      { id: 'reports', label: lang === 'bn' ? '‡¶ï‡¶æ‡¶∞‡ßç‡¶Ø‡¶ï‡ßç‡¶∞‡¶Æ ‡¶∞‡¶ø‡¶™‡ßã‡¶∞‡ßç‡¶ü' : 'Reports', icon: Activity },
      { id: 'google_drive', label: lang === 'bn' ? '‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠ ‡¶∏‡ßç‡¶ü‡ßã‡¶∞‡ßá‡¶ú' : 'Google Drive Storage', icon: Cloud },
      { id: 'settings', label: lang === 'bn' ? '‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏' : 'Settings', icon: Settings },
      { id: 'developer_hub', label: lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ó‡¶æ‡¶á‡¶°' : 'Code Change Guide', icon: Code },
    ];`;

    // 8. Academic Dialog Modals (Lines 7371 - 7620)
    const modalsCode = `// File: /src/components/StudentPortal.tsx (Lines 7371 - 7620)
// This code block handles the 5 beautiful custom academic dialog modals:

                        {/* Modal: Assign Routine Slot */}
                        {activeAddModal && (
                          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-xs">
                            <div className="bg-white rounded-2xl border border-gray-150 p-6 w-full max-w-md shadow-xl space-y-4 text-left">
                              {/* Routine slots selection form */}
                            </div>
                          </div>
                        )}

                        {/* Modal: Add Teacher Row */}
                        {showTeacherModal && (
                          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-xs">
                            {/* Input form for registering custom routine teachers */}
                          </div>
                        )}

                        {/* Modal: Working Days Setup */}
                        {showDayModal && (
                          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-xs">
                            {/* Checkbox matrix to enable/disable days from layout */}
                          </div>
                        )}

                        {/* Modal: Create Class */}
                        {showClassModal && (
                          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-xs">
                            {/* Input box to register new class definitions */}
                          </div>
                        )}

                        {/* Modal: Create Subject */}
                        {showSubjectModal && (
                          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-xs">
                            {/* Subject course creation forms */}
                          </div>
                        )}`;

    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-6 md:p-8 shadow-2xs text-left space-y-6">
        {/* Header & Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-xl flex items-center gap-2">
              <span className="text-[#005c53]">üíª</span>
              {lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ì ‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶Ü‡¶∞‡ßç‡¶ï‡¶ø‡¶ü‡ßá‡¶ï‡¶ö‡¶æ‡¶∞ ‡¶ó‡¶æ‡¶á‡¶°' : 'Developer & Code Change Guide'}
            </h3>
            <p className="text-xs text-gray-400 font-bold">
              {lang === 'bn' 
                ? '‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡ßü‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤‡ßá‡¶∞ ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤‡ßá ‡¶ï‡¶∞‡¶æ ‡¶∏‡¶æ‡¶Æ‡ßç‡¶™‡ßç‡¶∞‡¶§‡¶ø‡¶ï ‡¶ï‡ßã‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®‡ßá‡¶∞ ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶°‡¶ø‡¶∞‡ßá‡¶ï‡ßç‡¶ü‡¶∞‡¶ø' 
                : 'Complete directory of recent custom code changes and modal structures in the Admin Portal'}
            </p>
          </div>
          <span className="self-start md:self-auto px-3.5 py-1.5 bg-emerald-50 border border-emerald-150 text-[#005c53] text-[11px] font-black rounded-xl flex items-center gap-1.5 shadow-3xs animate-bounce">
            <span className="h-2 w-2 rounded-full bg-[#005c53] animate-pulse" />
            {lang === 'bn' ? '‡¶Ö‡¶ü‡ßã-‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ï‡ßã‡¶° ‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü' : 'Live Auto-Sync Active'}
          </span>
        </div>

        {/* Informative Warning Card */}
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-start gap-3.5 text-slate-700">
          <div className="h-9 w-9 rounded-xl bg-slate-100 text-[#005c53] border border-slate-200 flex items-center justify-center shrink-0">
            <Code className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-extrabold text-slate-900">
              {lang === 'bn' ? '‡¶°‡¶æ‡¶á‡¶®‡¶æ‡¶Æ‡¶ø‡¶ï ‡¶ï‡ßã‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶®‡¶ø‡¶∞‡ßç‡¶¶‡ßá‡¶∂‡¶®‡¶æ‡¶¨‡¶≤‡ßÄ' : 'Developer Interactive Guidance'}
            </p>
            <p className="leading-relaxed font-semibold text-gray-500">
              {lang === 'bn' 
                ? '‡¶Ü‡¶™‡¶®‡¶ø ‡¶Ø‡¶ñ‡¶® ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤‡ßá‡¶∞ ‡¶ï‡ßã‡¶®‡ßã ‡¶Ö‡¶™‡¶∂‡¶® ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶¨‡ßá‡¶®, ‡¶è‡¶á ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®‡¶∏‡¶Æ‡ßÇ‡¶π ‡¶∏‡ßç‡¶¨‡ßü‡¶Ç‡¶ï‡ßç‡¶∞‡¶ø‡ßü‡¶≠‡¶æ‡¶¨‡ßá ‡¶®‡¶ø‡¶ö‡ßá‡¶∞ ‡¶ï‡ßã‡¶° ‡¶¨‡ßç‡¶≤‡¶ï‡ßá ‡¶™‡ßç‡¶∞‡¶§‡¶ø‡¶∏‡ßç‡¶•‡¶æ‡¶™‡¶ø‡¶§ ‡¶π‡¶¨‡ßá‡•§ ‡¶Ü‡¶™‡¶®‡¶ø ‡¶∂‡ßÅ‡¶ß‡ßÅ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßá ‡¶®‡¶ø‡¶ö‡ßá ‡¶¶‡ßá‡¶ì‡ßü‡¶æ ‡¶®‡¶ø‡¶∞‡ßç‡¶¶‡¶ø‡¶∑‡ßç‡¶ü ‡¶≤‡¶æ‡¶á‡¶® ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞‡ßá ‡¶™‡ßá‡¶∏‡ßç‡¶ü ‡¶ï‡¶∞‡ßá ‡¶™‡¶æ‡¶∞‡ßç‡¶Æ‡¶æ‡¶®‡ßá‡¶®‡ßç‡¶ü‡¶≤‡¶ø ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶§‡ßá ‡¶™‡¶æ‡¶∞‡¶¨‡ßá‡¶®‡•§' 
                : 'Whenever you change any option in the Admin Panel settings, the generated code blocks below will automatically update with your live values! Simply copy the updated code and replace the specified line ranges.'}
            </p>
          </div>
        </div>

        {/* Section Tabs inside the hub */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
          {[
            { id: 'overview', labelBn: '‡¶∏‡¶æ‡¶∞‡¶∏‡¶Ç‡¶ï‡ßç‡¶∑‡ßá‡¶™', labelEn: 'Overview' },
            { id: 'settings_full', labelBn: '‡¶™‡ßÇ‡¶∞‡ßç‡¶£‡¶æ‡¶ô‡ßç‡¶ó ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ ‡¶ï‡ßã‡¶° (Lines 521-542)', labelEn: 'Full Settings State (Lines 521-542)' },
            { id: 'settings_parts', labelBn: '‡¶Ü‡¶Ç‡¶∂‡¶ø‡¶ï ‡¶ï‡ßã‡¶° ‡¶¨‡ßç‡¶≤‡¶ï‡¶∏‡¶Æ‡ßÇ‡¶π', labelEn: 'Partial Code Segments' },
            { id: 'state', labelBn: '‡¶∞‡ßÅ‡¶ü‡¶ø‡¶® ‡¶∏‡ßç‡¶ü‡ßá‡¶ü (Lines 463-473)', labelEn: 'Routine States (Lines 463-473)' },
            { id: 'menu', labelBn: '‡¶∏‡¶æ‡¶á‡¶°‡¶¨‡¶æ‡¶∞ ‡¶Æ‡ßá‡¶®‡ßÅ (Lines 3727-3749)', labelEn: 'Sidebar Menu (Lines 3727-3749)' },
            { id: 'modals', labelBn: '‡¶è‡¶ï‡¶æ‡¶°‡ßá‡¶Æ‡¶ø‡¶ï ‡¶Æ‡ßã‡¶°‡¶æ‡¶≤ (Lines 7371-7620)', labelEn: 'Academic Modals (Lines 7371-7620)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDeveloperActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                developerActiveTab === tab.id
                  ? 'bg-[#005c53] text-white shadow-3xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800'
              }`}
            >
              {lang === 'bn' ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Dynamic content rendering based on tab selection */}
        <div className="space-y-6">
          {developerActiveTab === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              <h4 className="font-extrabold text-gray-800 text-sm">
                {lang === 'bn' ? '‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶Ü‡¶∞‡ßç‡¶ï‡¶ø‡¶ü‡ßá‡¶ï‡¶ö‡¶æ‡¶∞ ‡¶ì ‡¶≤‡¶æ‡¶á‡¶≠ ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ü‡ßç‡¶∞‡ßç‡¶Ø‡¶æ‡¶ï‡¶ø‡¶Ç' : 'System Architecture & Live Code Sync'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left bg-emerald-50/20">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-150 text-[#005c53] flex items-center justify-center font-bold text-xs shadow-3xs">1</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? '‡¶≤‡¶æ‡¶á‡¶≠ ‡¶Ö‡¶ü‡ßã-‡¶Ü‡¶™‡¶°‡ßá‡¶ü' : 'Live Code Updates'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? '‡¶Ø‡ßá‡¶ï‡ßã‡¶®‡ßã ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ ‡¶ì ‡¶Ö‡¶™‡¶∂‡¶® ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶≤‡ßá ‡¶§‡¶æ ‡¶∏‡¶∞‡¶æ‡¶∏‡¶∞‡¶ø ‡¶ï‡ßã‡¶° ‡¶¨‡ßç‡¶≤‡¶ï‡¶ó‡ßÅ‡¶≤‡ßã‡¶∞ ‡¶≠‡¶ø‡¶§‡¶∞ ‡¶∏‡ßç‡¶¨‡ßü‡¶Ç‡¶ï‡ßç‡¶∞‡¶ø‡ßü‡¶≠‡¶æ‡¶¨‡ßá ‡¶¨‡¶∏‡ßá ‡¶Ø‡¶æ‡ßü‡•§' 
                      : 'Any branding changes you make on screen are instantly injected into the copyable code snippets.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shadow-3xs">2</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? '‡¶∏‡¶†‡¶ø‡¶ï ‡¶≤‡¶æ‡¶á‡¶® ‡¶ü‡ßç‡¶∞‡ßç‡¶Ø‡¶æ‡¶ï‡¶ø‡¶Ç' : 'Precise Line Markers'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? '‡¶ï‡ßã‡¶°‡ßá‡¶∞ ‡¶ï‡ßã‡¶® ‡¶≤‡¶æ‡¶á‡¶® ‡¶•‡ßá‡¶ï‡ßá ‡¶ï‡ßã‡¶® ‡¶≤‡¶æ‡¶á‡¶® ‡¶è‡¶°‡¶ø‡¶ü ‡¶ï‡¶∞‡¶¨‡ßá‡¶® ‡¶§‡¶æ‡¶∞ ‡¶è‡¶ï‡¶¶‡¶Æ ‡¶®‡¶ø‡¶ñ‡ßÅ‡¶Å‡¶§ ‡¶á‡¶®‡¶°‡ßá‡¶ï‡ßç‡¶∏ ‡¶ì ‡¶≤‡¶æ‡¶á‡¶® ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ ‡¶¶‡ßá‡¶ì‡ßü‡¶æ ‡¶Ü‡¶õ‡ßá‡•§' 
                      : 'Provides the exact line ranges inside StudentPortal.tsx to locate, delete and paste code blocks with zero doubt.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shadow-3xs">3</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? '‡¶®‡¶ø‡¶∞‡¶æ‡¶™‡¶¶ ‡¶∏‡¶ø‡¶ô‡ßç‡¶ó‡ßá‡¶≤ ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï‡ßá ‡¶ï‡¶™‡¶ø' : 'Secure Copy to Clipboard'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? '‡¶è‡¶ï‡¶ü‡¶ø ‡¶¨‡¶æ‡¶ü‡¶®‡ßá ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï ‡¶ï‡¶∞‡ßá‡¶á ‡¶ï‡ßã‡¶°‡¶ó‡ßÅ‡¶≤‡ßã ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£‡¶∞‡ßÇ‡¶™‡ßá ‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá ‡¶Ø‡¶æ‡¶¨‡ßá, ‡¶ï‡ßã‡¶®‡ßã ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßÅ‡ßü‡¶æ‡¶≤ ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶ù‡¶æ‡¶Æ‡ßá‡¶≤‡¶æ ‡¶®‡ßá‡¶á‡•§' 
                      : 'Never miss a bracket or syntax character. Use the Copy Code button for error-free transfer of custom logic.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-[#005c53]/10 text-[#005c53] flex items-center justify-center font-bold text-xs shadow-3xs">4</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? '‡¶°‡¶ø‡¶´‡¶≤‡ßç‡¶ü ‡¶Æ‡¶æ‡¶® ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£' : 'Hardcode Default Settings'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? '‡¶ï‡ßã‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®‡ßá‡¶∞ ‡¶™‡¶∞ ‡¶¨‡ßç‡¶∞‡¶æ‡¶â‡¶ú‡¶æ‡¶∞ ‡¶Æ‡ßá‡¶Æ‡ßã‡¶∞‡¶ø ‡¶ñ‡¶æ‡¶≤‡¶ø ‡¶ï‡¶∞‡¶≤‡ßá‡¶ì ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶®‡¶æ‡¶Æ ‡¶ì ‡¶Æ‡¶æ‡¶®‡¶ó‡ßÅ‡¶≤‡ßã ‡¶∏‡¶æ‡¶∞‡¶æ‡¶ú‡ßÄ‡¶¨‡¶® ‡¶∏‡ßç‡¶•‡¶æ‡ßü‡ßÄ ‡¶•‡¶æ‡¶ï‡¶¨‡ßá‡•§' 
                      : 'Keeps your custom school logo, colored theme banner, and pass marks persistent across any user session.'}
                  </p>
                </div>
              </div>

              {/* Quick Status Info */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2 text-xs">
                <p className="font-extrabold text-gray-800">{lang === 'bn' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏‡ßá‡¶∞ ‡¶∏‡¶Ç‡¶ï‡ßç‡¶∑‡¶ø‡¶™‡ßç‡¶§ ‡¶§‡¶•‡ßç‡¶Ø:' : 'Active Applied Configuration Status:'}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-500 font-bold">
                  <div>‚Ä¢ {lang === 'bn' ? '‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤ ‡¶®‡ßá‡¶Æ:' : 'School:'} <span className="text-gray-900 font-black">{schoolSettings.schoolName}</span></div>
                  <div>‚Ä¢ {lang === 'bn' ? '‡¶¨‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶≤‡¶æ‡¶∞:' : 'Banner Color:'} <span className="text-gray-900 font-black" style={{ color: schoolSettings.headerBgColor }}>{schoolSettings.headerBgColor}</span></div>
                  <div>‚Ä¢ {lang === 'bn' ? '‡¶™‡¶æ‡¶∏ ‡¶Æ‡¶æ‡¶∞‡ßç‡¶ï (‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ):' : 'Pass Marks:'} <span className="text-gray-900 font-black">{schoolSettings.examPassMarks}%</span></div>
                  <div>‚Ä¢ {lang === 'bn' ? '‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶´‡¶ø‡¶≤‡ßç‡¶° ‡¶∏‡¶Ç‡¶ñ‡ßç‡¶Ø‡¶æ:' : 'Custom Fields:'} <span className="text-gray-900 font-black">{schoolSettings.customFields.length}</span></div>
                </div>
              </div>
            </div>
          )}

          {developerActiveTab === 'settings_full' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-sm">
                    {lang === 'bn' ? '‡¶™‡ßÇ‡¶∞‡ßç‡¶£‡¶æ‡¶ô‡ßç‡¶ó ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ ‡¶∏‡ßç‡¶ü‡ßá‡¶ü ‡¶Ö‡¶¨‡¶ú‡ßá‡¶ï‡ßç‡¶ü ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®' : 'Full Settings State Return Object'}
                  </h4>
                  <p className="text-[11px] text-[#005c53] font-black mt-1">
                    {lang === 'bn' 
                      ? 'üìç StudentPortal.tsx ‡¶´‡¶æ‡¶á‡¶≤‡ßá‡¶∞ ‡ß´‡ß®‡ßß ‡¶•‡ßá‡¶ï‡ßá ‡ß´‡ß™‡ß© ‡¶≤‡¶æ‡¶á‡¶®‡ßá‡¶∞ ‡¶≠‡ßá‡¶§‡¶∞‡ßá‡¶∞ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶è‡¶á ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶™‡ßá‡¶∏‡ßç‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®‡•§' 
                      : 'üìç Locate lines 521 to 542 in StudentPortal.tsx, erase them completely and paste this exact updated block.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('settings_full', dynamicSchoolSettingsCode)}
                  className="px-3.5 py-2 bg-[#005c53] hover:bg-[#034d45] text-white text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'settings_full' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-200" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'settings_full' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code')}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 border border-slate-800 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed text-left max-h-[400px]">
                <code>{dynamicSchoolSettingsCode}</code>
              </pre>
            </div>
          )}

          {developerActiveTab === 'settings_parts' && (
            <div className="space-y-6 animate-fade-in text-left">
              <h4 className="font-extrabold text-gray-800 text-sm border-b border-gray-100 pb-2">
                {lang === 'bn' ? '‡¶Ü‡¶Ç‡¶∂‡¶ø‡¶ï ‡¶ï‡ßã‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ (‡¶Ø‡ßá‡¶ï‡ßã‡¶®‡ßã ‡¶è‡¶ï‡¶ü‡¶ø ‡¶Ö‡¶Ç‡¶∂ ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®)' : 'Partial Settings Configurations (Copy specific blocks to target sections)'}
              </h4>

              {/* Branding Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <div className="text-xs font-bold text-gray-700">
                    üè∑Ô∏è {lang === 'bn' ? '‡ßß. ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤ ‡¶™‡¶∞‡¶ø‡¶ö‡¶ø‡¶§‡¶ø ‡¶ì ‡¶¨‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞ ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ (Lines 522-528)' : '1. School Identity & Banner Theme (Lines 522-528)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_brand', brandingCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_brand' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_brand' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Segment')}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 text-cyan-400 border border-slate-800 rounded-xl overflow-x-auto text-[10px] font-mono max-h-[160px]">
                  <code>{brandingCode}</code>
                </pre>
              </div>

              {/* Contacts Address Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <div className="text-xs font-bold text-gray-700">
                    üìû {lang === 'bn' ? '‡ß®. ‡¶†‡¶ø‡¶ï‡¶æ‡¶®‡¶æ ‡¶ì ‡¶Æ‡ßã‡¶¨‡¶æ‡¶á‡¶≤ ‡¶®‡¶æ‡¶Æ‡ßç‡¶¨‡¶æ‡¶∞ ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ (Lines 529-533)' : '2. Address & Mobile Contacts (Lines 529-533)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_contact', contactsCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_contact' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_contact' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Segment')}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 text-cyan-400 border border-slate-800 rounded-xl overflow-x-auto text-[10px] font-mono max-h-[140px]">
                  <code>{contactsCode}</code>
                </pre>
              </div>

              {/* Pass Marks Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <div className="text-xs font-bold text-gray-700">
                    üéì {lang === 'bn' ? '‡ß©. ‡¶™‡¶æ‡¶∏ ‡¶Æ‡¶æ‡¶∞‡ßç‡¶ï‡¶∏ ‡¶ì ‡¶™‡ßç‡¶∞‡¶∂‡¶Ç‡¶∏‡¶æ‡¶™‡¶§‡ßç‡¶∞ ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ (Lines 534-537)' : '3. Pass Marks & Certificate Template (Lines 534-537)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_pass', passMarksCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_pass' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_pass' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Segment')}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 text-cyan-400 border border-slate-800 rounded-xl overflow-x-auto text-[10px] font-mono max-h-[140px]">
                  <code>{passMarksCode}</code>
                </pre>
              </div>

              {/* Custom Registry Fields */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <div className="text-xs font-bold text-gray-700">
                    üìÇ {lang === 'bn' ? '‡ß™. ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶∂‡¶® ‡¶´‡¶ø‡¶≤‡ßç‡¶°‡¶∏ ‡¶ï‡ßã‡¶° (Lines 538-541)' : '4. Custom Student Enrollment Fields (Lines 538-541)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_fields', customFieldsCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_fields' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_fields' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Segment')}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 text-cyan-400 border border-slate-800 rounded-xl overflow-x-auto text-[10px] font-mono max-h-[140px]">
                  <code>{customFieldsCode}</code>
                </pre>
              </div>
            </div>
          )}

          {developerActiveTab === 'state' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? '‡¶∞‡ßÅ‡¶ü‡¶ø‡¶® ‡¶Æ‡¶°‡¶ø‡¶â‡¶≤ ‡¶∏‡ßç‡¶ü‡ßá‡¶ü ‡¶≠‡ßá‡¶∞‡¶ø‡¶Ø‡¶º‡ßá‡¶¨‡¶≤' : 'Top-Level Routine State Declaration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? 'React ‡¶π‡ßÅ‡¶ï ‡¶®‡¶ø‡ßü‡¶Æ‡¶æ‡¶®‡ßÅ‡¶Ø‡¶æ‡ßü‡ßÄ ‡¶è‡¶á ‡¶ï‡ßã‡¶°‡¶ü‡¶ø StudentPortal.tsx-‡¶è‡¶∞ ‡ß™‡ß¨‡ß© ‡¶•‡ßá‡¶ï‡ßá ‡ß™‡ß≠‡ß© ‡¶®‡¶Ç ‡¶≤‡¶æ‡¶á‡¶®‡ßá ‡¶∞‡ßü‡ßá‡¶õ‡ßá‡•§' : 'Must reside unconditionally at the component root level (Lines 463 to 473) to keep render ordering stable.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('state', stateCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'state' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'state' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code')}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 border border-slate-800 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed text-left max-h-[350px]">
                <code>{stateCode}</code>
              </pre>
            </div>
          )}

          {developerActiveTab === 'menu' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶∏‡¶æ‡¶á‡¶°‡¶¨‡¶æ‡¶∞ ‡¶Æ‡ßá‡¶®‡ßÅ ‡¶ï‡¶®‡¶´‡¶ø‡¶ó‡¶æ‡¶∞‡ßá‡¶∂‡¶®' : 'Left-Side Navigation Configuration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? 'üìç StudentPortal.tsx ‡¶´‡¶æ‡¶á‡¶≤‡ßá‡¶∞ ‡ß©‡ß≠‡ß®‡ß≠ ‡¶•‡ßá‡¶ï‡ßá ‡ß©‡ß≠‡ß™‡ßØ ‡¶®‡¶Ç ‡¶≤‡¶æ‡¶á‡¶®‡ßá‡¶∞ ‡¶≠‡ßá‡¶§‡¶∞‡ßá‡¶∞ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡ßá ‡¶¨‡¶æ‡¶Æ ‡¶™‡¶æ‡¶∂‡ßá‡¶∞ ‡¶∏‡¶æ‡¶á‡¶°‡¶¨‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶á‡¶ú ‡¶ï‡¶∞‡ßÅ‡¶®‡•§' : 'üìç Locate lines 3727 to 3749 inside StudentPortal.tsx to modify or reorder Left-Side Navigation links.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('menu', menuCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'menu' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'menu' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code')}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 border border-slate-800 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed text-left max-h-[350px]">
                <code>{menuCode}</code>
              </pre>
            </div>
          )}

          {developerActiveTab === 'modals' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? '‡¶è‡¶ï‡¶æ‡¶°‡ßá‡¶Æ‡¶ø‡¶ï ‡¶Æ‡ßã‡¶°‡¶æ‡¶≤‡¶∏‡¶Æ‡ßÇ‡¶π‡ßá‡¶∞ ‡¶∞‡ßá‡¶®‡ßç‡¶°‡¶æ‡¶∞‡¶ø‡¶Ç ‡¶ï‡ßã‡¶°' : 'Academic Modals JSX Integration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? 'üìç ‡¶è‡¶á ‡¶ï‡ßã‡¶°‡¶ó‡ßÅ‡¶≤‡ßã StudentPortal.tsx ‡¶´‡¶æ‡¶á‡¶≤‡ßá‡¶∞ ‡ß≠‡ß©‡ß≠‡ßß ‡¶•‡ßá‡¶ï‡ßá ‡ß≠‡ß¨‡ß®‡ß¶ ‡¶≤‡¶æ‡¶á‡¶®‡ßá ‡¶Ö‡¶¨‡ßç‡¶¶‡¶ø ‡¶∞‡ßá‡¶®‡ßç‡¶°‡¶æ‡¶∞ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§' : 'üìç These modals control data creation, located within lines 7371 to 7620 inside StudentPortal.tsx.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('modals', modalsCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'modals' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'modals' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code')}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-emerald-400 border border-slate-800 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed text-left max-h-[350px]">
                <code>{modalsCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // SUB-COMPONENT: FULL ADMIN COCKPIT WITH SIDEBAR
  // ----------------------------------------------------
  const renderAdminFullDashboard = () => {
    // Left Sidebar Menu Items list
    const menuItems = [
      { id: 'dashboard', label: lang === 'bn' ? '‡¶°‡ßç‡¶Ø‡¶æ‡¶∂‡¶¨‡ßã‡¶∞‡ßç‡¶°' : 'Dashboard', icon: LayoutDashboard },
      { id: 'frontend', label: lang === 'bn' ? '‡¶´‡ßç‡¶∞‡¶®‡ßç‡¶ü‡¶è‡¶®‡ßç‡¶° ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏' : 'Frontend', icon: Sliders },
      { id: 'student_details', label: lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶§‡¶•‡ßç‡¶Ø' : 'Student Details', icon: Users },
      { id: 'admission', label: lang === 'bn' ? '‡¶≠‡¶∞‡ßç‡¶§‡¶ø ‡¶ï‡¶æ‡¶∞‡ßç‡¶Ø‡¶ï‡ßç‡¶∞‡¶Æ' : 'Admission', icon: UserPlus },
      { id: 'employee', label: lang === 'bn' ? '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶ì ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï' : 'Employee', icon: GraduationCap },
      { id: 'classes', label: lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶∞‡ßÅ‡¶Æ' : 'Classes', icon: BookOpen },
      { id: 'fees', label: lang === 'bn' ? '‡¶´‡¶ø ‡¶ï‡¶æ‡¶≤‡ßá‡¶ï‡¶∂‡¶®' : 'Fees', icon: Wallet },
      { id: 'card', label: lang === 'bn' ? '‡¶Ü‡¶á‡¶°‡¶ø ‡¶ï‡¶æ‡¶∞‡ßç‡¶° ‡¶§‡ßà‡¶∞‡¶ø' : 'Card Management', icon: CreditCard },
      { id: 'certificate', label: lang === 'bn' ? '‡¶∂‡¶Ç‡¶∏‡¶æ‡¶™‡¶§‡ßç‡¶∞' : 'Certificate', icon: Award },
      { id: 'academic', label: lang === 'bn' ? '‡¶è‡¶ï‡¶æ‡¶°‡ßá‡¶Æ‡¶ø‡¶ï ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶®' : 'Academic', icon: Calendar },
      { id: 'exam_controller', label: lang === 'bn' ? '‡¶è‡¶ï‡ßç‡¶∏‡¶æ‡¶Æ ‡¶ï‡¶®‡ßç‡¶ü‡ßç‡¶∞‡ßã‡¶≤‡¶æ‡¶∞ ‡¶™‡ßç‡¶≤‡ßç‡¶Ø‡¶æ‡¶®' : 'Exam Controller Plan', icon: FileText },
      { id: 'exam', label: lang === 'bn' ? '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶ì ‡¶´‡¶≤‡¶æ‡¶´‡¶≤' : 'Exam', icon: FileText },
      { id: 'attendance', label: lang === 'bn' ? '‡¶π‡¶æ‡¶ú‡¶ø‡¶∞‡¶æ ‡¶ñ‡¶æ‡¶§‡¶æ' : 'Attendance', icon: CheckSquare },
      { id: 'notice', label: lang === 'bn' ? '‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶™‡¶æ‡¶¨‡¶≤‡¶ø‡¶∂‡¶æ‡¶∞' : 'Notice', icon: Bell },
      { id: 'homework', label: lang === 'bn' ? '‡¶¨‡¶æ‡ßú‡¶ø‡¶∞ ‡¶ï‡¶æ‡¶ú' : 'Homework', icon: BookOpen },
      { id: 'sms', label: lang === 'bn' ? '‡¶¨‡¶æ‡¶≤‡ßç‡¶ï ‡¶è‡¶∏‡¶è‡¶Æ‡¶è‡¶∏' : 'Bulk Sms And Email', icon: MessageSquare },
      { id: 'student_accounting', label: lang === 'bn' ? '‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü ‡¶π‡¶ø‡¶∏‡¶æ‡¶¨' : 'Student Accounting', icon: DollarSign },
      { id: 'office_accounting', label: lang === 'bn' ? '‡¶Ö‡¶´‡¶ø‡¶∏ ‡¶ï‡ßç‡¶Ø‡¶æ‡¶∂ ‡¶¨‡ßÅ‡¶ï' : 'Office Accounting', icon: FileSpreadsheet },
      { id: 'reports', label: lang === 'bn' ? '‡¶ï‡¶æ‡¶∞‡ßç‡¶Ø‡¶ï‡ßç‡¶∞‡¶Æ ‡¶∞‡¶ø‡¶™‡ßã‡¶∞‡ßç‡¶ü' : 'Reports', icon: Activity },
      { id: 'google_drive', label: lang === 'bn' ? '‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶°‡ßç‡¶∞‡¶æ‡¶á‡¶≠ ‡¶∏‡ßç‡¶ü‡ßã‡¶∞‡ßá‡¶ú' : 'Google Drive Storage', icon: Cloud },
      { id: 'settings', label: lang === 'bn' ? '‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏' : 'Settings', icon: Settings },
    ];

    // Trigger SMS Broadcasting Simulation
    const handleSmsBroadcast = (e: React.FormEvent) => {
      e.preventDefault();
      if (!smsMessage.trim()) return;
      setSmsGatewayStatus('sending');
      addAuditLog(`Admin triggered bulk SMS broadcast to ${smsTargetClass}. Content: "${smsMessage.slice(0, 30)}..."`);
      setTimeout(() => {
        setSmsGatewayStatus('success');
        setAdminSuccessMsg(lang === 'bn' ? `‡¶ó‡¶æ‡¶∞‡ßç‡¶°‡¶ø‡ßü‡¶æ‡¶® ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™‡ßá ‡¶è‡¶∏‡¶è‡¶Æ‡¶è‡¶∏ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶™‡¶æ‡¶†‡¶æ‡¶®‡ßã ‡¶π‡ßü‡ßá‡¶õ‡ßá!` : 'Bulk SMS broadcast successfully delivered!');
        setTimeout(() => {
          setSmsGatewayStatus('idle');
          setSmsMessage('');
          setAdminSuccessMsg('');
        }, 3000);
      }, 2500);
    };

    return (
      <div className="min-h-screen bg-[#F1F5F9] flex">
        {/* LEFT SIDEBAR - Desktop and Mobile Drawer */}
        <aside className={`fixed inset-y-0 left-0 bg-white text-gray-800 border-r border-gray-150 w-64 z-50 transform transition-transform duration-300 md:translate-x-0 md:static shrink-0 flex flex-col justify-between overflow-y-auto ${
          isAdminSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Logo Card Section */}
          <div className="p-4 space-y-5">
            <div className="bg-[#005c53] p-4 rounded-[22px] flex items-center gap-3.5 shadow-sm">
              <div className="h-11 w-11 bg-white text-[#005c53] rounded-2xl flex items-center justify-center shrink-0 shadow-3xs">
                <GraduationCap className="h-6 w-6 stroke-[2]" />
              </div>
              <div className="text-left">
                <h2 className="font-extrabold text-white text-sm tracking-tight leading-tight">Students Care</h2>
                <p className="text-[10px] text-emerald-200 font-bold leading-none mt-1.5 uppercase tracking-wide">Model School</p>
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = adminActiveTab === item.id;
                const hasDropdown = item.id !== 'dashboard' && item.id !== 'reports' && item.id !== 'classes' && item.id !== 'fees';

                if (item.id === 'student_details') {
                  const isStudentDetailsActive = adminActiveTab === 'student_details';
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          toggleExclusiveMenu('student_details');
                          setAdminActiveTab('student_details');
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          isStudentDetailsActive 
                            ? 'bg-[#005c53] text-white shadow-xs font-black' 
                            : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isStudentDetailsActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isStudentDetailsActive ? (
                          <ChevronRight className="h-3.5 w-3.5 text-white shrink-0" />
                        ) : (
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isStudentDetailsExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                      
                      {isStudentDetailsExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6">
                          <button
                            onClick={() => {
                              setAdminActiveTab('student_details');
                              setStudentDetailsSubTab('student_list');
                              setIsAdminSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                              isStudentDetailsActive && studentDetailsSubTab === 'student_list'
                                ? 'bg-emerald-50 text-[#005c53] shadow-xs'
                                : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53]'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isStudentDetailsActive && studentDetailsSubTab === 'student_list' ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                            <span className="truncate">{lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ' : 'Student List'}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setAdminActiveTab('student_details');
                              setStudentDetailsSubTab('login_deactivate');
                              setIsAdminSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                              isStudentDetailsActive && studentDetailsSubTab === 'login_deactivate'
                                ? 'bg-emerald-50 text-[#005c53] shadow-xs'
                                : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53]'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isStudentDetailsActive && studentDetailsSubTab === 'login_deactivate' ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                            <span className="truncate">{lang === 'bn' ? '‡¶≤‡¶ó‡¶á‡¶® ‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º' : 'Login Deactivate'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setAdminActiveTab('student_details');
                              setStudentDetailsSubTab('deactivate_reason');
                              setIsAdminSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                              isStudentDetailsActive && studentDetailsSubTab === 'deactivate_reason'
                                ? 'bg-emerald-50 text-[#005c53] shadow-xs'
                                : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53]'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isStudentDetailsActive && studentDetailsSubTab === 'deactivate_reason' ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                            <span className="truncate">{lang === 'bn' ? '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º‡¶§‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∞‡¶£' : 'Deactivate Reason'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === 'frontend') {
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="w-full flex items-center bg-gray-50 rounded-2xl">
                        <button
                          onClick={() => {
                            setAdminActiveTab('frontend');
                          }}
                          className={`flex-grow flex items-center gap-3 px-4 py-3 rounded-l-2xl text-xs font-black transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-[#005c53] text-white shadow-xs font-black' 
                              : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span>{item.label}</span>
                        </button>
                        <button
                          onClick={() => toggleExclusiveMenu('frontend')}
                          className="px-3 py-3 text-gray-500 hover:text-[#005c53]"
                        >
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isFrontendMenuExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {isFrontendMenuExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6 max-h-[380px] overflow-y-auto scrollbar-none">
                          {frontendSubMenus.map((sub) => {
                            const isSubActive = adminActiveTab === 'frontend' && frontendSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  openOnlyMenu('frontend');
                                  setAdminActiveTab('frontend');
                                  setFrontendSubTab(sub.id);
                                  setIsAdminSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                                  isSubActive
                                    ? 'bg-emerald-50 text-[#005c53] shadow-xs'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-[#005c53]' : 'bg-emerald-150/45'}`} />
                                <span className="truncate">{lang === 'bn' ? sub.labelBn : sub.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === 'card') {
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="w-full flex items-center bg-gray-50 rounded-2xl">
                        <button
                          onClick={() => {
                            setAdminActiveTab('card');
                          }}
                          className={`flex-grow flex items-center gap-3 px-4 py-3 rounded-l-2xl text-xs font-black transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-[#005c53] text-white shadow-xs font-black' 
                              : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span>{item.label}</span>
                        </button>
                        <button
                          onClick={() => toggleExclusiveMenu('card')}
                          className="px-3 py-3 text-gray-500 hover:text-[#005c53]"
                        >
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isCardMenuExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {isCardMenuExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6 max-h-[380px] overflow-y-auto scrollbar-none">
                          {cardSubMenus.map((sub) => {
                            const isSubActive = adminActiveTab === 'card' && cardSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  openOnlyMenu('card');
                                  setAdminActiveTab('card');
                                  setCardSubTab(sub.id);
                                  setIsAdminSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                                  isSubActive
                                    ? 'bg-emerald-50 text-[#005c53] shadow-xs'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-[#005c53]' : 'bg-emerald-150/45'}`} />
                                <span className="truncate">{lang === 'bn' ? sub.labelBn : sub.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === 'employee') {
                  const isEmployeeActive = adminActiveTab === 'employee';
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="w-full flex items-center bg-gray-50 rounded-2xl">
                        <button
                          onClick={() => {
                            setAdminActiveTab('employee');
                          }}
                          className={`flex-grow flex items-center gap-3 px-4 py-3 rounded-l-2xl text-xs font-black transition-all cursor-pointer ${
                            isEmployeeActive 
                              ? 'bg-[#005c53] text-white shadow-xs font-black' 
                              : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isEmployeeActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                        <button
                          onClick={() => toggleExclusiveMenu('employee')}
                          className="px-3 py-3 text-gray-500 hover:text-[#005c53]"
                        >
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isEmployeeMenuExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {isEmployeeMenuExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6">
                          {[
                            { id: 'employee_list', labelBn: '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ', labelEn: 'Employee List' },
                            { id: 'add_department', labelBn: '‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®', labelEn: 'Add Department' },
                            { id: 'add_designation', labelBn: '‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶® ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®', labelEn: 'Add Designation' },
                            { id: 'add_employee', labelBn: '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®', labelEn: 'Add Employee' },
                            { id: 'login_deactivate', labelBn: '‡¶≤‡¶ó‡¶á‡¶® ‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º', labelEn: 'Login Deactivate' }
                          ].map((sub) => {
                            const isSubActive = isEmployeeActive && employeeSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  openOnlyMenu('employee');
                                  setAdminActiveTab('employee');
                                  setEmployeeSubTab(sub.id as any);
                                  setIsAdminSidebarOpen(false);
                                  if (sub.id === 'add_employee') {
                                    setIsAddEmployeeModalOpen(true);
                                  }
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                                  isSubActive
                                    ? 'bg-emerald-50 text-[#005c53] shadow-xs font-black'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                                <span className="truncate">{lang === 'bn' ? sub.labelBn : sub.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === 'settings') {
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="w-full flex items-center bg-gray-50 rounded-2xl">
                        <button
                          onClick={() => {
                            setAdminActiveTab('settings');
                          }}
                          className={`flex-grow flex items-center gap-3 px-4 py-3 rounded-l-2xl text-xs font-black transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-[#005c53] text-white shadow-xs font-black' 
                              : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span>{item.label}</span>
                        </button>
                        <button
                          onClick={() => toggleExclusiveMenu('settings')}
                          className="px-3 py-3 text-gray-500 hover:text-[#005c53]"
                        >
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isSettingsMenuExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {isSettingsMenuExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6">
                          {[
                            { id: 'general_settings', labelBn: '‡¶∏‡¶æ‡¶ß‡¶æ‡¶∞‡¶£ ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏', labelEn: 'General Settings' },
                            { id: 'school_settings', labelBn: '‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤ ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏', labelEn: 'School Settings' },
                            { id: 'role_permission', labelBn: '‡¶∞‡ßã‡¶≤ ‡¶™‡¶æ‡¶∞‡¶Æ‡¶ø‡¶∂‡¶®', labelEn: 'Role Permission' },
                            { id: 'session_settings', labelBn: '‡¶∏‡ßá‡¶∂‡¶® ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏', labelEn: 'Session Settings' },
                            { id: 'translations', labelBn: '‡¶Ö‡¶®‡ßÅ‡¶¨‡¶æ‡¶¶', labelEn: 'Translations' },
                            { id: 'cron_job', labelBn: '‡¶ï‡ßç‡¶∞‡¶® ‡¶ú‡¶¨', labelEn: 'Cron Job' },
                            { id: 'system_student_field', labelBn: '‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü ‡¶´‡¶ø‡¶≤‡ßç‡¶°', labelEn: 'System Student Field' },
                            { id: 'custom_field', labelBn: '‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶´‡¶ø‡¶≤‡ßç‡¶°', labelEn: 'Custom Field' },
                            { id: 'report_card', labelBn: '‡¶∞‡¶ø‡¶™‡ßã‡¶∞‡ßç‡¶ü ‡¶ï‡¶æ‡¶∞‡ßç‡¶°', labelEn: 'Report Card' },
{ id: 'change_password', labelBn: '‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®', labelEn: 'Change Password' },
                          ].map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                openOnlyMenu('settings');
                                setAdminActiveTab('settings');
                                setSettingsSubTab(item.id);
                                setIsAdminSidebarOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                                settingsSubTab === item.id ? 'bg-emerald-50 text-[#005c53] shadow-xs' : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53]'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${settingsSubTab === item.id ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                              <span className="truncate">{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }


                if (item.id === 'exam_controller') {
                  const isExamControllerActive = adminActiveTab === 'exam_controller';
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="w-full flex items-center bg-gray-50 rounded-2xl">
                        <button
                          onClick={() => {
                            setAdminActiveTab('exam_controller');
                          }}
                          className={`flex-grow flex items-center gap-3 px-4 py-3 rounded-l-2xl text-xs font-black transition-all cursor-pointer ${
                            isExamControllerActive 
                              ? 'bg-[#005c53] text-white shadow-xs font-black' 
                              : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isExamControllerActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                        <button
                          onClick={() => toggleExclusiveMenu('exam_controller')}
                          className="px-3 py-3 text-gray-500 hover:text-[#005c53]"
                        >
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isExamControllerMenuExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {isExamControllerMenuExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6">
                          {[
                            { id: 'exam_hall_duty', labelBn: '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶π‡¶≤ ‡¶°‡¶ø‡¶â‡¶ü‡¶ø', labelEn: 'Exam Hall Duty' },
                            { id: 'seat_arrangement', labelBn: '‡¶Ü‡¶∏‡¶® ‡¶¨‡¶ø‡¶®‡ßç‡¶Ø‡¶æ‡¶∏', labelEn: 'Seat Arrangement' },
                            { id: 'seat_plan', labelBn: '‡¶∏‡¶ø‡¶ü ‡¶™‡ßç‡¶≤‡ßç‡¶Ø‡¶æ‡¶®', labelEn: 'Seat Plan' }
                          ].map((sub) => {
                            const isSubActive = isExamControllerActive && examControllerSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  openOnlyMenu('exam_controller');
                                  setAdminActiveTab('exam_controller');
                                  setExamControllerSubTab(sub.id as any);
                                  setIsAdminSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                                  isSubActive
                                    ? 'bg-emerald-50 text-[#005c53] shadow-xs font-black'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                                <span className="truncate">{lang === 'bn' ? sub.labelBn : sub.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                if (item.id === 'academic') {
                  const isAcademicActive = adminActiveTab === 'academic';
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="w-full flex items-center bg-gray-50 rounded-2xl">
                        <button
                          onClick={() => {
                            setAdminActiveTab('academic');
                          }}
                          className={`flex-grow flex items-center gap-3 px-4 py-3 rounded-l-2xl text-xs font-black transition-all cursor-pointer ${
                            isAcademicActive 
                              ? 'bg-[#005c53] text-white shadow-xs font-black' 
                              : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isAcademicActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                        <button
                          onClick={() => toggleExclusiveMenu('academic')}
                          className="px-3 py-3 text-gray-500 hover:text-[#005c53]"
                        >
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isAcademicMenuExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {isAcademicMenuExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6">
                          {[
                            { id: 'class_section', labelBn: '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶è‡¶¨‡¶Ç ‡¶∏‡ßá‡¶ï‡¶∂‡¶®', labelEn: 'Class & Section' },
                            { id: 'subject', labelBn: '‡¶¨‡¶ø‡¶∑‡¶Ø‡¶º', labelEn: 'Subject' },
                            { id: 'class_schedule', labelBn: '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶∂‡¶ø‡¶°‡¶ø‡¶â‡¶≤', labelEn: 'Class Schedule' },
                            { id: 'class_routine', labelBn: '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶®', labelEn: 'Class Routine' },
                            { id: 'teacher_class_routine', labelBn: '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶®', labelEn: 'Teacher Class Routine' },
                            { id: 'routine_overview', labelBn: '‡¶∞‡ßÅ‡¶ü‡¶ø‡¶® ‡¶ì‡¶≠‡¶æ‡¶∞‡¶≠‡¶ø‡¶â', labelEn: 'Routine Overview' },
                            { id: 'teacher_schedule', labelBn: '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï‡ßá‡¶∞ ‡¶∏‡¶Æ‡ßü‡¶∏‡ßÇ‡¶ö‡ßÄ', labelEn: 'Teacher Schedule' },
                            { id: 'promotion', labelBn: '‡¶™‡ßç‡¶∞‡¶Æ‡ßã‡¶∂‡¶®', labelEn: 'Promotion' }
                          ].map((sub) => {
                            const isSubActive = isAcademicActive && academicSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  openOnlyMenu('academic');
                                  setAdminActiveTab('academic');
                                  setAcademicSubTab(sub.id as any);
                                  setIsAdminSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                                  isSubActive
                                    ? 'bg-emerald-50 text-[#005c53] shadow-xs font-black'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                                <span className="truncate">{lang === 'bn' ? sub.labelBn : sub.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === 'exam') {
                  const isExamActive = adminActiveTab === 'exam';
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="w-full flex items-center bg-gray-50 rounded-2xl">
                        <button
                          onClick={() => {
                            setAdminActiveTab('exam');
                          }}
                          className={`flex-grow flex items-center gap-3 px-4 py-3 rounded-l-2xl text-xs font-black transition-all cursor-pointer ${
                            isExamActive 
                              ? 'bg-[#005c53] text-white shadow-xs font-black' 
                              : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isExamActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                        <button
                          onClick={() => toggleExclusiveMenu('exam')}
                          className="px-3 py-3 text-gray-500 hover:text-[#005c53]"
                        >
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isExamMenuExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      
                      {isExamMenuExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6">
                          {[
                            { id: 'exam_term', labelBn: '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶ü‡¶æ‡¶∞‡ßç‡¶Æ', labelEn: 'Exam Term' },
                            { id: 'exam_routine', labelBn: '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶∞‡ßÅ‡¶ü‡¶ø‡¶®', labelEn: 'Exam Routine' },
                            { id: 'exam_hall', labelBn: '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶π‡¶≤', labelEn: 'Exam Hall' },
                            { id: 'exam_distribution', labelBn: '‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ ‡¶¨‡¶£‡ßç‡¶ü‡¶®', labelEn: 'Distribution' },
                            { id: 'exam_setup', labelBn: '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶∏‡ßá‡¶ü‡¶Ü‡¶™', labelEn: 'Exam Setup' },
                            { id: 'exam_marksheet_template', labelBn: '‡¶Æ‡¶æ‡¶∞‡ßç‡¶ï‡¶∂‡¶ø‡¶ü ‡¶ü‡ßá‡¶Æ‡¶™‡ßç‡¶≤‡ßá‡¶ü', labelEn: 'Marksheet Template' },
                            { id: 'exam_schedule', labelBn: '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶∏‡¶Æ‡ßü‡¶∏‡ßÇ‡¶ö‡ßÄ', labelEn: 'Exam Schedule' },
                            { id: 'exam_marks', labelBn: '‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ ‡¶á‡¶®‡¶™‡ßÅ‡¶ü', labelEn: 'Marks' }
                          ].map((sub) => {
                            const isSubActive = isExamActive && examSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  openOnlyMenu('exam');
                                  setAdminActiveTab('exam');
                                  setExamSubTab(sub.id);
                                  setIsAdminSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                                  isSubActive
                                    ? 'bg-emerald-50 text-[#005c53] shadow-xs font-black'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                                <span className="truncate">{lang === 'bn' ? sub.labelBn : sub.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === 'settings') {
                  const isSettingsActive = adminActiveTab === 'settings';
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          toggleExclusiveMenu('settings');
                          setAdminActiveTab('settings');
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          isSettingsActive 
                            ? 'bg-[#005c53] text-white shadow-xs font-black' 
                            : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isSettingsActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isSettingsActive ? (
                          <ChevronRight className="h-3.5 w-3.5 text-white shrink-0" />
                        ) : (
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isSettingsMenuExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                      
                      {isSettingsMenuExpanded && (
                        <div className="pl-4 pr-1 py-1 space-y-1 border-l border-emerald-500/10 ml-6 max-h-[220px] overflow-y-auto">
                          {[
                            { id: 'school_settings', labelBn: '‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤ ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏', labelEn: 'School Settings' },
                            { id: 'report_primary', labelBn: '‡¶∞‡¶ø‡¶™‡ßã‡¶∞‡ßç‡¶ü ‡¶ï‡¶æ‡¶∞‡ßç‡¶° ‚Äî ‡¶™‡ßç‡¶∞‡¶æ‡¶á‡¶Æ‡¶æ‡¶∞‡¶ø', labelEn: 'Report Card ‚Äî Primary Section' },
                            { id: 'report_exam', labelBn: '‡¶∞‡¶ø‡¶™‡ßã‡¶∞‡ßç‡¶ü ‡¶ï‡¶æ‡¶∞‡ßç‡¶° ‚Äî ‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ', labelEn: 'Report Card ‚Äî Examination' },
                            { id: 'section_customization', labelBn: '‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶á‡¶ú‡ßá‡¶∂‡¶®', labelEn: 'Section Customization' },
                            { id: 'testimonial_template', labelBn: '‡¶™‡ßç‡¶∞‡¶∂‡¶Ç‡¶∏‡¶æ‡¶™‡¶§‡ßç‡¶∞ ‡¶ü‡ßá‡¶Æ‡¶™‡ßç‡¶≤‡ßá‡¶ü', labelEn: 'Testimonial Template' },
                            { id: 'testimonial_manager', labelBn: '‡¶™‡ßç‡¶∞‡¶∂‡¶Ç‡¶∏‡¶æ‡¶™‡¶§‡ßç‡¶∞ ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶ú‡¶æ‡¶∞', labelEn: 'Testimonial Manager' },
                            { id: 'cron_job', labelBn: '‡¶ï‡ßç‡¶∞‡¶® ‡¶ú‡¶¨', labelEn: 'Cron Job' },
                            { id: 'login_banner', labelBn: '‡¶≤‡¶ó‡¶á‡¶® ‡¶¨‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞', labelEn: 'Login Banner' },
                            { id: 'system_student_field', labelBn: '‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü ‡¶´‡¶ø‡¶≤‡ßç‡¶°', labelEn: 'System Student Field' },
                            { id: 'custom_field', labelBn: '‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶´‡¶ø‡¶≤‡ßç‡¶°', labelEn: 'Custom Field' },
                            { id: 'database_backup', labelBn: '‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™', labelEn: 'Database Backup' },
                            { id: 'user_login_log', labelBn: '‡¶á‡¶â‡¶ú‡¶æ‡¶∞ ‡¶≤‡¶ó‡¶á‡¶® ‡¶≤‡¶ó', labelEn: 'User Login Log' },
                            { id: 'change_password', labelBn: '‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®', labelEn: 'Change Password' },
                            { id: 'user_credentials', labelBn: '‡¶á‡¶â‡¶ú‡¶æ‡¶∞ ‡¶ï‡ßç‡¶∞‡ßá‡¶°‡ßá‡¶®‡¶∂‡¶ø‡ßü‡¶æ‡¶≤', labelEn: 'User Credentials' }
                          ].map((sub) => {
                            const isSubActive = isSettingsActive && settingsSubTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setAdminActiveTab('settings');
                                  setSettingsSubTab(sub.id);
                                  setIsAdminSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-left ${
                                  isSubActive
                                    ? 'bg-emerald-50 text-[#005c53] shadow-xs font-black'
                                    : 'text-gray-500 hover:bg-slate-50 hover:text-[#005c53] font-bold'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSubActive ? 'bg-[#005c53]' : 'bg-[#005c53]/20'}`} />
                                <span className="truncate">{lang === 'bn' ? sub.labelBn : sub.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAdminActiveTab(item.id);
                      setIsAdminSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer group text-left ${
                      isActive 
                        ? 'bg-[#005c53] text-white shadow-xs font-black' 
                        : 'text-gray-600 hover:bg-slate-50 hover:text-[#005c53]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#005c53]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive ? (
                      <ChevronRight className="h-3.5 w-3.5 text-white shrink-0" />
                    ) : hasDropdown ? (
                      <ChevronDown className="h-3 w-3 text-gray-400 opacity-70 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Profile/Logout Section */}
          <div className="p-4 border-t border-gray-150 bg-white">
            <div className="flex items-center justify-between gap-2">
              <button 
                onClick={() => setIsAdminProfileModalOpen(true)}
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-all text-left cursor-pointer focus:outline-none group"
              >
                <div className="h-10 w-10 bg-[#005c53]/10 text-[#005c53] font-black rounded-full flex items-center justify-center font-mono shrink-0 shadow-3xs uppercase">
                  {adminProfile.name.charAt(0)}
                </div>
                <div className="text-left leading-none min-w-0 flex-1 pl-1">
                  <p className="text-xs font-black text-gray-800 truncate group-hover:text-[#005c53] transition-colors">{adminProfile.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶®' : 'Admin'}</p>
                </div>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setAdminActiveTab('settings');
                    setSettingsSubTab('school_settings');
                  }}
                  className="p-1.5 hover:bg-slate-50 text-gray-400 hover:text-[#005c53] rounded-lg transition-colors cursor-pointer"
                  title="System Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isAdminSidebarOpen && (
          <div 
            onClick={() => setIsAdminSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-3xs z-40 md:hidden"
          />
        )}

        {/* RIGHT CONTENT FRAME */}
        <div className="grow flex flex-col min-w-0">
          {/* HEADER BAR */}
          <header className="bg-white border-b border-gray-150 h-16 px-6 sm:px-8 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
            {/* Mobile Sidebar Toggle Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAdminSidebarOpen(true)}
                className="md:hidden p-2 bg-gray-50 border border-gray-150 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <Sliders className="h-5 w-5 text-[#01352a] transform rotate-90" />
              </button>
              
              {/* Search Bar Capsule */}
              <div className="relative max-w-xs hidden sm:block">
                <Search className="absolute inset-y-0 left-3.5 h-4 w-4 my-auto text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students, teachers, classes..."
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-full text-xs font-bold text-gray-700 transition-all"
                />
              </div>
            </div>



            {/* Right Side Info Badges */}
            <div className="flex items-center gap-4">
              {/* Removed Back to Website button */}
              {/* Notification bell with active counts */}
              <div className="relative group">
                <button className="h-9 w-9 bg-gray-50 border border-gray-150 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors cursor-pointer">
                  <Bell className="h-4.5 w-4.5 text-gray-500" />
                </button>
                <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  3
                </span>
              </div>

              {/* Language Switcher Segmented Control next to user profile */}
              <div className="bg-gray-100 border border-gray-200/80 p-0.5 rounded-xl flex items-center shadow-3xs">
                <button
                  onClick={() => setLang('bn')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                    lang === 'bn' 
                      ? 'bg-[#005c53] text-white shadow-3xs' 
                      : 'text-gray-500 hover:text-[#005c53]'
                  }`}
                >
                  BN
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center ${
                    lang === 'en' 
                      ? 'bg-[#005c53] text-white shadow-3xs' 
                      : 'text-gray-500 hover:text-[#005c53]'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Header profile badge */}
              <div className="relative border-l border-gray-150 pl-4">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-90 transition-all text-left cursor-pointer focus:outline-none"
                >
                  <div className="h-8.5 w-8.5 bg-emerald-100 text-[#01352a] font-black text-xs rounded-xl flex items-center justify-center border border-white shadow-2xs uppercase">
                    {adminProfile.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-black text-gray-900 leading-tight">{adminProfile.name}</p>
                    <p className="text-[9px] text-[#025644] font-extrabold uppercase tracking-wider mt-0.5">
                      {lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶Ö‡¶´‡¶ø‡¶∏' : 'Admin Office'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Card */}
                {isProfileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-4 text-center animate-fade-in-down">
                      {/* Avatar & Info */}
                      <div className="px-5 pb-4 flex flex-col items-center">
                        <div className="h-16 w-16 bg-emerald-100 text-[#01352a] font-black text-2xl rounded-full flex items-center justify-center border-4 border-emerald-50 shadow-md mb-3 uppercase">
                          {adminProfile.name.charAt(0)}
                        </div>
                        <h4 className="font-black text-gray-900 text-sm">{adminProfile.name}</h4>
                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">
                          {lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶®' : 'Admin'}
                        </p>
                        
                        {/* Big Red Logout Button */}
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{lang === 'bn' ? '‡¶≤‡¶ó‡¶Ü‡¶â‡¶ü' : 'Logout'}</span>
                        </button>
                      </div>

                      <hr className="border-gray-100 my-1" />

                      {/* Dropdown Options */}
                      <div className="px-2">
                        {/* Profile Option */}
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsAdminProfileModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-xl transition-all cursor-pointer text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#005c53] flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block font-black">{lang === 'bn' ? '‡¶™‡ßç‡¶∞‡ßã‡¶´‡¶æ‡¶á‡¶≤' : 'Profile'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßç‡¶∞‡ßã‡¶´‡¶æ‡¶á‡¶≤ ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®' : 'Update admin information'}</span>
                          </div>
                        </button>

                        {/* Reset Password Option */}
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setAdminActiveTab('settings');
                            setSettingsSubTab('change_password');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-xl transition-all cursor-pointer text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Key className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block font-black">{lang === 'bn' ? '‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü' : 'Reset Password'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? '‡¶≤‡¶ó‡¶á‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®' : 'Change login password'}</span>
                          </div>
                        </button>

                        {/* Mailbox Option */}
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsAdminMailboxModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-xl transition-all cursor-pointer text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Mail className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block font-black">{lang === 'bn' ? '‡¶Æ‡ßá‡¶á‡¶≤‡¶¨‡¶ï‡ßç‡¶∏' : 'Mailbox'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? '‡¶®‡ßã‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶ì ‡¶Æ‡ßá‡¶∏‡ßá‡¶ú' : 'Inbound alerts & support'}</span>
                          </div>
                        </button>

                        {/* School Settings Option */}
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setAdminActiveTab('settings');
                            setSettingsSubTab('school_settings');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-xl transition-all cursor-pointer text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Settings className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block font-black">{lang === 'bn' ? '‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤ ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏' : 'School Settings'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? '‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶æ‡¶≤‡¶Ø‡¶º‡ßá‡¶∞ ‡¶∏‡¶æ‡¶ß‡¶æ‡¶∞‡¶£ ‡¶™‡¶∞‡¶ø‡¶ö‡¶ø‡¶§‡¶ø' : 'Update general parameters'}</span>
                          </div>
                        </button>

                        <hr className="border-gray-100 my-1" />

                        {/* Logout Option */}
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <LogOut className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block font-black">{lang === 'bn' ? '‡¶≤‡¶ó‡¶Ü‡¶â‡¶ü ‡¶∏‡ßá‡¶∂‡¶®' : 'Logout'}</span>
                            <span className="text-[10px] text-rose-400 font-bold">{lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶°‡ßç‡¶Ø‡¶æ‡¶∂‡¶¨‡ßã‡¶∞‡ßç‡¶° ‡¶•‡ßá‡¶ï‡ßá ‡¶¨‡¶ø‡¶¶‡¶æ‡ßü' : 'Sign out from control room'}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* MAIN PANELS AND ROUTERS */}
          <main className="grow p-6 overflow-y-auto max-w-7xl w-full mx-auto">
            
            {/* Direct success/error notification banners */}
            {adminSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-2"
              >
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span>{adminSuccessMsg}</span>
              </motion.div>
            )}

            {/* TAB-BY-TAB DYNAMIC RENDERER */}
            {adminActiveTab === 'dashboard' && renderAdminDashboard()}

            {/* DEVELOPER HUB & CODE CHANGE GUIDE */}
            {adminActiveTab === 'developer_hub' && renderDeveloperHub()}

            {/* EXAM CONTROLLER PANEL */}
            {adminActiveTab === 'exam_controller' && (
              <>
                {examControllerSubTab === 'exam_hall_duty' && <ExamHallDuty />}
                {examControllerSubTab === 'seat_arrangement' && <div className="p-6 text-gray-500">Seat Arrangement (Coming Soon)</div>}
                {examControllerSubTab === 'seat_plan' && <SeatPlan />}
              </>
            )}

            {/* STUDENT DETAILS PANEL */}
            {adminActiveTab === 'student_details' && (() => {
              // Filtering student array
              const filteredStudents = students.filter(s => {
                const matchSearch = filterSearch ? (
                  s.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
                  s.id.toLowerCase().includes(filterSearch.toLowerCase()) ||
                  s.guardianName.toLowerCase().includes(filterSearch.toLowerCase()) ||
                  s.guardianPhone.toLowerCase().includes(filterSearch.toLowerCase())
                ) : true;
                const matchClass = filterClass !== 'All' ? s.class === filterClass : true;
                const matchSection = filterSection !== 'All' ? s.section === filterSection : true;
                const matchGroup = filterGroup !== 'All' ? s.group.toLowerCase() === filterGroup.toLowerCase() : true;
                const matchStatus = filterStatus !== 'All' ? s.status === filterStatus : true;
                return matchSearch && matchClass && matchSection && matchGroup && matchStatus;
              });

              // Paged students (8 items per page)
              const startIndex = (currentPage - 1) * 8;
              const paginatedStudents = filteredStudents.slice(startIndex, startIndex + 8);
              const totalPages = Math.ceil(filteredStudents.length / 8) || 1;

              // Dynamic file exports (Excel and PDF)
              const triggerExport = (format: 'Excel' | 'PDF') => {
                if (format === 'Excel') {
                  const headers = ['SL', 'ID', 'Roll', 'Name', 'Class', 'Section', 'Guardian', 'Phone', 'Status'];
                  const rows = filteredStudents.map((s, idx) => [
                    idx + 1,
                    s.id,
                    s.roll,
                    s.name,
                    s.class,
                    s.section,
                    s.guardianName,
                    s.guardianPhone.replace(/^\+880\s*/, ''),
                    s.status
                  ]);
                  
                  const csvContent = "\uFEFF" + [
                    headers.join(','),
                    ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `Students_Roster_Class_${filterClass}_Sec_${filterSection}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  setAdminSuccessMsg(lang === 'bn' 
                    ? `‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶¶‡ßá‡¶∞ ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá Excel (CSV) ‡¶´‡¶æ‡¶á‡¶≤ ‡¶π‡¶ø‡¶∏‡ßá‡¶¨‡ßá ‡¶è‡¶ï‡ßç‡¶∏‡¶™‡ßã‡¶∞‡ßç‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!` 
                    : `Exported student roster database to Excel (CSV) successfully!`
                  );
                  setTimeout(() => setAdminSuccessMsg(''), 4000);
                } else if (format === 'PDF') {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const dateStr = new Date().toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      second: 'numeric',
                      hour12: true
                    });
                    
                    const classText = filterClass === 'All' ? 'All' : filterClass;
                    const sectionText = filterSection === 'All' ? 'All' : filterSection;
                    
                    let rowsHtml = '';
                    filteredStudents.forEach((s, idx) => {
                      const formattedPhone = s.guardianPhone.replace(/^\+880\s*/, '').replace(/\s+/g, '');
                      rowsHtml += `
                        <tr>
                          <td class="text-center" style="font-weight: 600;">${idx + 1}</td>
                          <td><div class="photo-box"></div></td>
                          <td class="text-center" style="font-family: monospace; font-size: 12px; font-weight: 600;">${s.roll}</td>
                          <td style="font-weight: 600; color: #1e293b;">${s.name}</td>
                          <td class="text-center" style="font-weight: 600;">${s.class}</td>
                          <td class="text-center" style="font-weight: 600;">${s.section}</td>
                          <td style="color: #475569;">${s.guardianName}</td>
                          <td style="font-family: monospace; font-size: 12px; color: #475569;">${formattedPhone}</td>
                          <td class="text-center"><span class="${s.status === 'Active' ? 'status-active' : 'status-inactive'}">${s.status}</span></td>
                        </tr>
                      `;
                    });

                    const htmlContent = `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Student Roster Print - STUDENTS CARE MODEL SCHOOL</title>
                          <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                            body {
                              font-family: 'Inter', sans-serif;
                              margin: 0;
                              padding: 40px;
                              color: #1e293b;
                              background-color: #f8fafc;
                              display: flex;
                              justify-content: center;
                            }
                            .page-container {
                              width: 100%;
                              max-width: 850px;
                              background-color: #ffffff;
                              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                              border-radius: 8px;
                              padding: 50px 40px;
                              box-sizing: border-box;
                              border: 1px solid #e2e8f0;
                            }
                            .header {
                              text-align: center;
                              margin-bottom: 25px;
                            }
                            .title {
                              font-size: 26px;
                              font-weight: 800;
                              color: #0f172a;
                              margin: 0;
                              letter-spacing: -0.02em;
                              text-transform: uppercase;
                            }
                            .address {
                              font-size: 12px;
                              color: #475569;
                              margin: 6px 0 0 0;
                              font-weight: 600;
                            }
                            .filters {
                              font-size: 13px;
                              font-weight: 700;
                              color: #1e293b;
                              margin: 10px 0 0 0;
                            }
                            .meta-info {
                              font-size: 10px;
                              color: #64748b;
                              margin: 12px 0 15px 0;
                              font-weight: 600;
                            }
                            table {
                              width: 100%;
                              border-collapse: collapse;
                              margin-top: 15px;
                            }
                            th {
                              background-color: #ffffff;
                              color: #475569;
                              font-weight: 700;
                              font-size: 10px;
                              text-transform: uppercase;
                              border: 1px solid #cbd5e1;
                              padding: 10px 8px;
                              text-align: left;
                              letter-spacing: 0.05em;
                            }
                            td {
                              border: 1px solid #cbd5e1;
                              padding: 10px 12px;
                              font-size: 11px;
                              color: #334155;
                              vertical-align: middle;
                            }
                            .text-center {
                              text-align: center;
                            }
                            .photo-box {
                              width: 42px;
                              height: 48px;
                              border: 1px solid #cbd5e1;
                              margin: 0 auto;
                              background-color: #f8fafc;
                              border-radius: 2px;
                            }
                            .status-active {
                              color: #16a34a;
                              font-weight: 700;
                            }
                            .status-inactive {
                              color: #dc2626;
                              font-weight: 700;
                            }
                            @media print {
                              body {
                                background-color: #ffffff;
                                padding: 0;
                                display: block;
                              }
                              .page-container {
                                box-shadow: none;
                                border: none;
                                padding: 0;
                                max-width: 100%;
                              }
                              @page {
                                size: portrait;
                                margin: 1.5cm;
                              }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="page-container">
                            <div class="header">
                              <h1 class="title">STUDENTS CARE MODEL SCHOOL</h1>
                              <p class="address">Charalakshya, Karnafuli, Chattogram</p>
                              <p class="filters">Class: ${classText} &nbsp;|&nbsp; Section: ${sectionText}</p>
                              <p class="meta-info">Total: ${filteredStudents.length} ‚Ä¢ Generated: ${dateStr}</p>
                            </div>
                            <table>
                              <thead>
                                <tr>
                                  <th style="width: 5%" class="text-center">SL</th>
                                  <th style="width: 12%" class="text-center">Photo</th>
                                  <th style="width: 8%" class="text-center">Roll</th>
                                  <th style="width: 23%">Name</th>
                                  <th style="width: 8%" class="text-center">Class</th>
                                  <th style="width: 10%" class="text-center">Section</th>
                                  <th style="width: 16%">Guardian</th>
                                  <th style="width: 12%">Phone</th>
                                  <th style="width: 8%" class="text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${rowsHtml}
                              </tbody>
                            </table>
                          </div>
                          <script>
                            window.onload = function() {
                              setTimeout(function() {
                                window.print();
                              }, 350);
                            };
                          </script>
                        </body>
                      </html>
                    `;
                    printWindow.document.open();
                    printWindow.document.write(htmlContent);
                    printWindow.document.close();
                  }
                }
              };

              // Beautiful real printed classroom blank attendance sheets
              const triggerPrintAttendance = () => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  const classText = filterClass === 'All' ? 'All' : filterClass;
                  const sectionText = filterSection === 'All' ? 'All' : filterSection;

                  // Generating 31 days columns
                  let daysHeaders = '';
                  for (let d = 1; d <= 31; d++) {
                    daysHeaders += `<th class="col-day">${d}</th>`;
                  }

                  let rowsHtml = '';
                  filteredStudents.forEach((s, idx) => {
                    let blankCells = '';
                    for (let d = 1; d <= 31; d++) {
                      blankCells += `<td></td>`;
                    }
                    rowsHtml += `
                      <tr>
                        <td class="text-center" style="font-weight: 600;">${idx + 1}</td>
                        <td class="text-center" style="font-family: monospace; font-size: 11px; font-weight: 600;">${s.roll}</td>
                        <td class="col-name" style="font-weight: 600; font-size: 11px;">${s.name}</td>
                        ${blankCells}
                      </tr>
                    `;
                  });

                  const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Attendance Sheet - STUDENTS CARE MODEL SCHOOL</title>
                        <style>
                          @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
                          body {
                            font-family: 'Inter', 'Hind Siliguri', sans-serif;
                            margin: 0;
                            padding: 20px;
                            color: #1e293b;
                            background-color: #f1f5f9;
                            display: flex;
                            justify-content: center;
                          }
                          .page-container {
                            width: 100%;
                            max-width: 1150px;
                            background-color: #ffffff;
                            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                            border-radius: 8px;
                            padding: 40px 30px;
                            box-sizing: border-box;
                            border: 1px solid #cbd5e1;
                          }
                          .header {
                            text-align: center;
                            margin-bottom: 20px;
                          }
                          .title-bn {
                            font-family: 'Hind Siliguri', sans-serif;
                            font-size: 26px;
                            font-weight: 700;
                            margin: 0;
                            color: #000000;
                            letter-spacing: -0.5px;
                          }
                          .address-bn {
                            font-family: 'Hind Siliguri', sans-serif;
                            font-size: 12px;
                            font-weight: 600;
                            color: #334155;
                            margin: 4px 0 0 0;
                          }
                          .sheet-title {
                            font-size: 12px;
                            font-weight: 700;
                            color: #0f172a;
                            margin: 10px 0 0 0;
                          }
                          table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 15px;
                          }
                          th, td {
                            border: 1px solid #000000;
                            padding: 4px 2px;
                            font-size: 10px;
                            text-align: center;
                            font-weight: 500;
                          }
                          th {
                            font-weight: 700;
                            background-color: #ffffff;
                          }
                          .col-sl {
                            width: 3%;
                          }
                          .col-roll {
                            width: 4%;
                          }
                          .col-name {
                            width: 18%;
                            text-align: left;
                            padding-left: 6px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                          }
                          .col-day {
                            width: 2.4%;
                            font-size: 8px;
                          }
                          tr {
                            height: 26px;
                          }
                          @media print {
                            body {
                              background-color: #ffffff;
                              padding: 0;
                              display: block;
                            }
                            .page-container {
                              box-shadow: none;
                              border: none;
                              padding: 0;
                              max-width: 100%;
                            }
                            @page {
                              size: landscape;
                              margin: 1cm;
                            }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="page-container">
                          <div class="header">
                            <h1 class="title-bn">‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡ßü‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤</h1>
                            <p class="address-bn">‡¶ö‡¶∞‡¶≤‡¶ï‡ßç‡¶∑‡ßç‡¶Ø‡¶æ, ‡¶ï‡¶∞‡ßç‡¶£‡¶´‡ßÅ‡¶≤‡ßÄ, ‡¶ö‡¶ü‡ßç‡¶ü‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ</p>
                            <p class="sheet-title">Monthly Attendance Sheet ‚Äî July 2026 &nbsp;|&nbsp; Class: ${classText} &nbsp;|&nbsp; Section: ${sectionText}</p>
                          </div>
                          <table>
                            <thead>
                              <tr>
                                <th class="col-sl">SL</th>
                                <th class="col-roll">Roll</th>
                                <th class="col-name">Name</th>
                                ${daysHeaders}
                              </tr>
                            </thead>
                            <tbody>
                              ${rowsHtml}
                            </tbody>
                          </table>
                        </div>
                        <script>
                          window.onload = function() {
                            setTimeout(function() {
                              window.print();
                            }, 350);
                          };
                        </script>
                      </body>
                    </html>
                  `;
                  printWindow.document.open();
                  printWindow.document.write(htmlContent);
                  printWindow.document.close();
                }
              };

              // Delete student handler
              const handleDeleteStudent = (id: string, name: string) => {
                if (confirm(lang === 'bn' ? `${name}-‡¶ï‡ßá ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶•‡ßá‡¶ï‡ßá ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶§‡ßá ‡¶ö‡¶æ‡¶®?` : `Are you sure you want to delete ${name} from records?`)) {
                  setStudents(prev => prev.filter(s => s.id !== id));
                  setAdminSuccessMsg(lang === 'bn' ? `${name}-‡¶è‡¶∞ ‡¶∞‡ßá‡¶ï‡¶∞‡ßç‡¶° ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!` : `Student record of ${name} has been deleted.`);
                  setTimeout(() => setAdminSuccessMsg(''), 4000);
                }
              };

              return (
                <div className="space-y-6">
                  {/* Dynamic Inner Tab Selection Headers */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => setStudentDetailsSubTab('student_list')}
                        className={`text-sm font-black pb-2.5 border-b-2 transition-all cursor-pointer ${
                          studentDetailsSubTab === 'student_list'
                            ? 'border-[#025644] text-[#025644]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ' : 'Student List'}
                      </button>
                      <button
                        onClick={() => setStudentDetailsSubTab('login_deactivate')}
                        className={`text-sm font-black pb-2.5 border-b-2 transition-all cursor-pointer ${
                          studentDetailsSubTab === 'login_deactivate'
                            ? 'border-[#025644] text-[#025644]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {lang === 'bn' ? '‡¶≤‡¶ó‡¶á‡¶® ‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º' : 'Login Deactivate'}
                      </button>
                      <button
                        onClick={() => setStudentDetailsSubTab('deactivate_reason')}
                        className={`text-sm font-black pb-2.5 border-b-2 transition-all cursor-pointer ${
                          studentDetailsSubTab === 'deactivate_reason'
                            ? 'border-[#025644] text-[#025644]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {lang === 'bn' ? '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º‡¶§‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∞‡¶£' : 'Deactivate Reason'}
                      </button>
                    </div>
                  </div>

                  {studentDetailsSubTab === 'student_list' && (
                    <div className="space-y-6">
                      {/* Sub-Header Row */}
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="text-left">
                          <h3 className="font-extrabold text-gray-900 text-2xl tracking-tight">
                            {lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶¨‡ßÉ‡¶®‡ßç‡¶¶' : 'Students'}
                          </h3>
                          <p className="text-xs text-gray-400 font-bold mt-1">
                            {filteredStudents.length} {lang === 'bn' ? '‡¶ú‡¶® ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶∞ ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ' : `of ${students.length} students`}
                          </p>
                        </div>

                        {/* Top Action Buttons (Excel, PDF, Attendance, Add Student) */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => triggerExport('Excel')}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-emerald-600 font-extrabold">üóÇÔ∏è</span>
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={() => triggerExport('PDF')}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-red-500 font-extrabold">üìï</span>
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={triggerPrintAttendance}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-blue-500 font-extrabold">üìù</span>
                            <span>{lang === 'bn' ? '‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø ‡¶∂‡¶ø‡¶ü' : 'Blank Attendance'}</span>
                          </button>
                          <button
                            onClick={() => setIsAddStudentModalOpen(true)}
                            className="bg-[#025644] text-white hover:bg-[#013f32] px-4 py-2 text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                          >
                            <Plus className="h-4 w-4 stroke-[3]" />
                            <span>{lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Add New Student'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Filter Grid Section */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-3xs text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
                          {/* Search Input */}
                          <div className="lg:col-span-2 relative">
                            <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-gray-400" />
                            <input
                              type="text"
                              value={filterSearch}
                              onChange={(e) => {
                                setFilterSearch(e.target.value);
                                setCurrentPage(1);
                              }}
                              placeholder={lang === 'bn' ? "‡¶®‡¶æ‡¶Æ, ‡¶Ü‡¶á‡¶°‡¶ø ‡¶¨‡¶æ ‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï..." : "Search by name, ID, class, guardian..."}
                              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-bold text-gray-700 transition-all placeholder:text-gray-400"
                            />
                          </div>

                          {/* Class Filter */}
                          <select
                            value={filterClass}
                            onChange={(e) => {
                              setFilterClass(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 text-xs font-black text-gray-600 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#025644] transition-all"
                          >
                            <option value="All">{lang === 'bn' ? '‡¶∏‡¶ï‡¶≤ ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏' : 'All Classes'}</option>
                            <option value="5">Class 5</option>
                            <option value="6">Class 6</option>
                            <option value="7">Class 7</option>
                            <option value="8">Class 8</option>
                            <option value="9">Class 9</option>
                            <option value="10">Class 10</option>
                          </select>

                          {/* Section Filter */}
                          <select
                            value={filterSection}
                            onChange={(e) => {
                              setFilterSection(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 text-xs font-black text-gray-600 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#025644] transition-all"
                          >
                            <option value="All">{lang === 'bn' ? '‡¶∏‡¶ï‡¶≤ ‡¶∂‡¶æ‡¶ñ‡¶æ' : 'All Sections'}</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                          </select>

                          {/* Group Filter */}
                          <select
                            value={filterGroup}
                            onChange={(e) => {
                              setFilterGroup(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 text-xs font-black text-gray-600 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#025644] transition-all"
                          >
                            <option value="All">{lang === 'bn' ? '‡¶∏‡¶ï‡¶≤ ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™' : 'All Groups'}</option>
                            <option value="General">General</option>
                            <option value="Science">Science</option>
                          </select>

                          {/* Status Filter */}
                          <select
                            value={filterStatus}
                            onChange={(e) => {
                              setFilterStatus(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 text-xs font-black text-gray-600 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#025644] transition-all"
                          >
                            <option value="All">{lang === 'bn' ? '‡¶∏‡¶ï‡¶≤ ‡¶∏‡ßç‡¶ü‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶∏' : 'All Status'}</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      {/* Main Student Directory Table */}
                      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-3xs text-left">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/70 border-b border-gray-150 text-gray-400 uppercase tracking-wider font-extrabold text-[10px]">
                                <th className="py-3 px-4 w-10">
                                  <input type="checkbox" className="rounded-xs accent-[#025644]" />
                                </th>
                                <th className="py-3 px-4">Student ID</th>
                                <th className="py-3 px-4">Photo</th>
                                <th className="py-3 px-4">Name</th>
                                <th className="py-3 px-4">Class</th>
                                <th className="py-3 px-4">Section</th>
                                <th className="py-3 px-4">Roll</th>
                                <th className="py-3 px-4">Guardian Contact</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold text-gray-700">
                              {paginatedStudents.length === 0 ? (
                                <tr>
                                  <td colSpan={10} className="py-12 text-center text-gray-400 font-bold">
                                    {lang === 'bn' ? '‡¶ï‡ßã‡¶® ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶∞ ‡¶§‡¶•‡ßç‡¶Ø ‡¶™‡¶æ‡¶ì‡ßü‡¶æ ‡¶Ø‡¶æ‡ßü‡¶®‡¶ø‡•§' : 'No student directory records match selected filters.'}
                                  </td>
                                </tr>
                              ) : (
                                paginatedStudents.map((std) => (
                                  <tr key={std.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-4">
                                      <input type="checkbox" className="rounded-xs accent-[#025644]" />
                                    </td>
                                    <td className="py-3 px-4 font-mono font-black text-gray-950">{std.id}</td>
                                    <td className="py-3 px-4">
                                      <div className="h-8 w-8 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-[#025644] font-black font-mono text-xs shadow-3xs overflow-hidden">
                                        {std.photo ? (
                                          <img src={std.photo} alt={std.name} className="h-full w-full object-cover" />
                                        ) : (
                                          <User className="h-4 w-4" />
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-900 font-black">{std.name}</td>
                                    <td className="py-3 px-4 font-extrabold text-gray-700">{std.class}</td>
                                    <td className="py-3 px-4 text-gray-600 font-extrabold">{std.section}</td>
                                    <td className="py-3 px-4 font-mono text-slate-500 font-black">{std.roll}</td>
                                    <td className="py-3 px-4 text-left leading-tight">
                                      <p className="text-gray-800 text-xs font-extrabold">{std.guardianName}</p>
                                      <p className="text-gray-400 font-mono text-[10px] mt-0.5">{std.guardianPhone}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full inline-flex items-center gap-1 border ${
                                        std.status === 'Active'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                          : 'bg-rose-50 text-rose-700 border-rose-100'
                                      }`}>
                                        <span className={`h-1 w-1 rounded-full ${std.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        {std.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button 
                                          title={lang === 'bn' ? "‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶∞ ‡¶§‡¶•‡ßç‡¶Ø ‡¶¶‡ßá‡¶ñ‡ßÅ‡¶®" : "View Student Details"}
                                          onClick={() => {
                                            setViewingStudentDetails(std);
                                          }}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#025644] rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </button>
                                        <button 
                                          title={lang === 'bn' ? "‡¶™‡ßç‡¶∞‡¶¨‡ßá‡¶∂‡¶™‡¶§‡ßç‡¶∞ ‡¶°‡¶æ‡¶â‡¶®‡¶≤‡ßã‡¶° / ‡¶™‡ßç‡¶∞‡¶ø‡¶®‡ßç‡¶ü" : "Download Admit Card"}
                                          onClick={() => {
                                            setViewingAdmitCard(std);
                                          }}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-sky-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center text-sm"
                                        >
                                          <span>üé´</span>
                                        </button>
                                        <button 
                                          title={lang === 'bn' ? "‡¶∏‡¶Æ‡ßç‡¶™‡¶æ‡¶¶‡¶®‡¶æ ‡¶ï‡¶∞‡ßÅ‡¶®" : "Edit"}
                                          onClick={() => handleEditStudentClick(std)}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#025644] rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                        <button 
                                          title="Download PDF Roster"
                                          onClick={() => triggerExport('PDF')}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                        </button>
                                        <button 
                                          title="Pin Record"
                                          onClick={() => {
                                            setAdminSuccessMsg(lang === 'bn' ? `${std.name}-‡¶è‡¶∞ ‡¶∞‡ßá‡¶ï‡¶∞‡ßç‡¶° ‡¶™‡¶ø‡¶® ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!` : `${std.name} has been pinned to priority list.`);
                                            setTimeout(() => setAdminSuccessMsg(''), 4000);
                                          }}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Bookmark className="h-3.5 w-3.5" />
                                        </button>
                                        <button 
                                          title="Delete Student"
                                          onClick={() => handleDeleteStudent(std.id, std.name)}
                                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Bar */}
                        <div className="bg-slate-50/50 border-t border-gray-150 px-5 py-3.5 flex items-center justify-between">
                          <p className="text-xs text-gray-500 font-bold">
                            {lang === 'bn' 
                              ? `‡¶™‡ßç‡¶∞‡¶¶‡¶∞‡ßç‡¶∂‡¶ø‡¶§: ${startIndex + 1}-${Math.min(startIndex + 8, filteredStudents.length)} ‡¶Æ‡ßã‡¶ü: ${filteredStudents.length}`
                              : `${startIndex + 1}-${Math.min(startIndex + 8, filteredStudents.length)} of ${filteredStudents.length} students`
                            }
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="px-2.5 py-1.5 text-xs font-black rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-40"
                            >
                              ‚ùÆ
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-all ${
                                  currentPage === i + 1
                                    ? 'bg-[#025644] text-white shadow-3xs'
                                    : 'border border-gray-200 text-gray-600 bg-white hover:bg-slate-50'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="px-2.5 py-1.5 text-xs font-black rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-40"
                            >
                              ‚ùØ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: LOGIN DEACTIVATE CONTROL */}
                  {studentDetailsSubTab === 'login_deactivate' && (
                    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-3xs text-left space-y-6">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-lg">
                          {lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶≤‡¶ó‡¶á‡¶® ‡¶®‡¶ø‡¶Ø‡¶º‡¶®‡ßç‡¶§‡ßç‡¶∞‡¶£ ‡¶™‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤' : 'Student Login Status Control'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? '‡¶Ö‡¶∏‡ßç‡¶•‡¶æ‡¶Ø‡¶º‡ßÄ‡¶≠‡¶æ‡¶¨‡ßá ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶¶‡ßá‡¶∞ ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏‡ßá‡¶∏ ‡¶´‡ßç‡¶∞‡¶ø‡¶ú ‡¶¨‡¶æ ‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Temporarily freeze or activate student credentials for portal logins'}
                        </p>
                      </div>

                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-gray-150 text-gray-400 font-extrabold text-[10px] uppercase">
                              <th className="py-3 px-4">Student ID</th>
                              <th className="py-3 px-4">Student Name</th>
                              <th className="py-3 px-4">Generated Username</th>
                              <th className="py-3 px-4">Login status</th>
                              <th className="py-3 px-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-gray-700">
                            {students.map((std) => (
                              <tr key={std.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-3.5 px-4 font-mono font-black text-gray-950">{std.id}</td>
                                <td className="py-3.5 px-4 font-black text-gray-900">{std.name}</td>
                                <td className="py-3.5 px-4 font-mono text-xs text-indigo-700">{std.id.toLowerCase().replace('-', '')}</td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                                    std.loginActive 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    {std.loginActive ? 'Login Enabled' : 'Login Deactivated'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => {
                                      setStudents(prev => prev.map(p => p.id === std.id ? { 
                                        ...p, 
                                        loginActive: !p.loginActive,
                                        status: !p.loginActive ? 'Active' : 'Inactive'
                                      } : p));
                                      setAdminSuccessMsg(lang === 'bn' 
                                        ? `${std.name}-‡¶è‡¶∞ ‡¶≤‡¶ó‡¶á‡¶® ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏‡ßá‡¶∏ ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!` 
                                        : `Login status toggled for ${std.name} successfully.`
                                      );
                                      setTimeout(() => setAdminSuccessMsg(''), 4000);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                                      std.loginActive 
                                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100' 
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                                    }`}
                                  >
                                    {std.loginActive ? (lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏‡ßá‡¶∏ ‡¶∏‡ßç‡¶•‡¶ó‡¶ø‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Deactivate Login') : (lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏‡ßá‡¶∏ ‡¶∏‡¶ö‡¶≤ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Enable Login')}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: DEACTIVATE REASON REGISTRY */}
                  {studentDetailsSubTab === 'deactivate_reason' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                      {/* Form to set reason */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-3xs space-y-4 h-fit">
                        <div>
                          <h4 className="font-extrabold text-gray-900 text-sm">
                            {lang === 'bn' ? '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º‡¶§‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∞‡¶£ ‡¶®‡¶•‡¶ø‡¶≠‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Log Deactivation Reason'}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">
                            {lang === 'bn' ? '‡¶ï‡ßã‡¶® ‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶∞ ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤ ‡¶¨‡¶®‡ßç‡¶ß‡ßá‡¶∞ ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£ ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Assign official suspension reasons to de-enrolled students'}
                          </p>
                        </div>

                        <div className="space-y-3.5">
                          <div>
                            <label className="block text-[10px] uppercase font-extrabold text-gray-500 mb-1.5">Select Student</label>
                            <select
                              value={deactivateStudentId}
                              onChange={(e) => setDeactivateStudentId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-gray-700 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#025644]"
                            >
                              <option value="">-- {lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶®‡¶ø‡¶∞‡ßç‡¶¨‡¶æ‡¶ö‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Select Student'} --</option>
                              {students.filter(s => !s.loginActive).map(s => (
                                <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-extrabold text-gray-500 mb-1.5">Reason Description</label>
                            <textarea
                              rows={3}
                              value={deactivateReasonText}
                              onChange={(e) => setDeactivateReasonText(e.target.value)}
                              placeholder={lang === 'bn' ? "‡¶Ø‡ßá‡¶Æ‡¶®: ‡¶¨‡¶ï‡ßá‡¶Ø‡¶º‡¶æ ‡¶´‡¶ø ‡¶™‡¶∞‡¶ø‡¶∂‡ßã‡¶ß ‡¶®‡¶æ ‡¶ï‡¶∞‡¶æ, ‡¶∂‡ßÉ‡¶ô‡ßç‡¶ñ‡¶≤‡¶æ ‡¶≠‡¶ô‡ßç‡¶ó ‡¶á‡¶§‡ßç‡¶Ø‡¶æ‡¶¶‡¶ø‡•§" : "E.g. Fees overdue for 3 consecutive terms, disciplinary action."}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-[#025644]"
                            />
                          </div>

                          <button
                            onClick={() => {
                              if (!deactivateStudentId || !deactivateReasonText.trim()) {
                                alert(lang === 'bn' ? '‡¶¶‡ßü‡¶æ ‡¶ï‡¶∞‡ßá ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶è‡¶¨‡¶Ç ‡¶ï‡¶æ‡¶∞‡¶£ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®‡•§' : 'Please select a student and type the reason.');
                                return;
                              }
                              setStudents(prev => prev.map(s => s.id === deactivateStudentId ? { ...s, deactivateReason: deactivateReasonText } : s));
                              setAdminSuccessMsg(lang === 'bn' ? "‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º‡¶§‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∞‡¶£ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£ ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§" : "Deactivation reason registered successfully.");
                              setDeactivateStudentId('');
                              setDeactivateReasonText('');
                              setTimeout(() => setAdminSuccessMsg(''), 4000);
                            }}
                            className="w-full py-2 bg-[#025644] hover:bg-[#01352a] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                          >
                            {lang === 'bn' ? '‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Save Reason Record'}
                          </button>
                        </div>
                      </div>

                      {/* Reasons display log */}
                      <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl p-5 shadow-3xs space-y-4">
                        <div>
                          <h4 className="font-extrabold text-gray-900 text-sm">
                            {lang === 'bn' ? '‡¶∏‡ßç‡¶•‡¶ó‡¶ø‡¶§‡¶ï‡¶∞‡¶£ ‡¶∞‡ßá‡¶ú‡¶ø‡¶∏‡ßç‡¶ü‡ßç‡¶∞‡¶ø' : 'Suspension Registry'}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">
                            {lang === 'bn' ? '‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ‡ßá ‡¶∞‡ßá‡¶ï‡¶∞‡ßç‡¶°‡¶ï‡ßÉ‡¶§ ‡¶∏‡ßç‡¶•‡¶ó‡¶ø‡¶§ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏‡ßá‡¶∏ ‡¶∞‡ßá‡¶ú‡¶ø‡¶∏‡ßç‡¶ü‡ßç‡¶∞‡¶ø' : 'Currently documented suspended logins with official grounds'}
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-extrabold text-[10px] uppercase">
                                <th className="py-2.5 px-3">Student</th>
                                <th className="py-2.5 px-3">Class</th>
                                <th className="py-2.5 px-3">Official Reason</th>
                                <th className="py-2.5 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                              {students.filter(s => !s.loginActive).length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-400 font-bold">
                                    No suspended or deactivated login accounts currently.
                                  </td>
                                </tr>
                              ) : (
                                students.filter(s => !s.loginActive).map((std) => (
                                  <tr key={std.id} className="hover:bg-slate-50/50 transition-all">
                                    <td className="py-3 px-3">
                                      <p className="text-gray-900 font-black">{std.name}</p>
                                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{std.id}</p>
                                    </td>
                                    <td className="py-3 px-3">Class {std.class}</td>
                                    <td className="py-3 px-3">
                                      <span className="text-rose-700 bg-rose-50 border border-rose-100/40 rounded-lg px-2.5 py-1 text-[10px] inline-block max-w-[200px] truncate">
                                        {std.deactivateReason || 'No specific reason logged.'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <button
                                        onClick={() => {
                                          setStudents(prev => prev.map(s => s.id === std.id ? { ...s, loginActive: true, status: 'Active', deactivateReason: undefined } : s));
                                          setAdminSuccessMsg(`${std.name} has been reactivated and restored to active roster.`);
                                          setTimeout(() => setAdminSuccessMsg(''), 4000);
                                        }}
                                        className="text-[10px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-black px-2.5 py-1.5 rounded-lg cursor-pointer"
                                      >
                                        Reactivate
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ADMISSION APPLICATION QUEUE PANEL */}
            {adminActiveTab === 'admission' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">
                        {lang === 'bn' ? '‡¶Ö‡¶®‡¶≤‡¶æ‡¶á‡¶® ‡¶≠‡¶∞‡ßç‡¶§‡¶ø ‡¶Ü‡¶¨‡ßá‡¶¶‡¶® ‡¶ï‡ßã‡¶Ø‡¶º‡ßá‡¶∞‡¶ø' : 'Admission Application Queue'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? '‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï‡¶¶‡ßá‡¶∞ ‡¶™‡¶æ‡¶†‡¶æ‡¶®‡ßã ‡¶≠‡¶∞‡ßç‡¶§‡¶ø ‡¶Ü‡¶¨‡ßá‡¶¶‡¶® ‡¶™‡¶∞‡ßç‡¶Ø‡¶æ‡¶≤‡ßã‡¶ö‡¶®‡¶æ ‡¶è‡¶¨‡¶Ç ‡¶Ö‡¶®‡ßÅ‡¶Æ‡ßã‡¶¶‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Review and approve/reject online registration forms filed by guardians'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>{pendingAdmissions.filter((a: any) => a.status === 'pending').length} {lang === 'bn' ? '‡¶ü‡¶ø ‡¶Ü‡¶¨‡ßá‡¶¶‡¶® ‡¶Ö‡¶™‡ßá‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡¶§' : 'Applications Pending'}</span>
                    </div>
                  </div>

                  {adminSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-xs font-bold">
                      {adminSuccessMsg}
                    </div>
                  )}

                  <div className="space-y-4">
                    {pendingAdmissions.map((adm: any) => (
                      <div key={adm.id} className="p-5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:shadow-2xs transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Applicant Photo */}
                          <div className="h-14 w-14 rounded-2xl border border-gray-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                            {adm.applicantPhoto ? (
                              <img src={adm.applicantPhoto} alt={adm.studentName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-gray-400 font-extrabold text-lg">{adm.studentName[0]}</span>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-gray-900 text-sm">{adm.studentName}</h4>
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black rounded-lg">
                                {lang === 'bn' ? '‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡¶¨‡¶∞‡ßç‡¶§‡ßÄ ‡¶ú‡¶ø‡¶™‡¶ø‡¶è' : 'GPA'} {adm.previousGPA}
                              </span>
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase tracking-wider ${
                                adm.registrationFeeStatus === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {lang === 'bn' ? (adm.registrationFeeStatus === 'Paid' ? '‡¶´‡¶ø ‡¶™‡¶∞‡¶ø‡¶∂‡ßã‡¶ß‡¶ø‡¶§' : '‡¶´‡¶ø ‡¶Ö‡¶™‡¶∞‡¶ø‡¶∂‡ßã‡¶ß‡¶ø‡¶§') : `${adm.registrationFeeStatus} Registration`}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 font-semibold">
                              <p>{lang === 'bn' ? '‡¶Ö‡¶≠‡¶ø‡¶≠‡¶æ‡¶¨‡¶ï' : 'Guardian'}: <span className="text-gray-800 font-bold">{adm.guardianName}</span></p>
                              <p>{lang === 'bn' ? '‡¶Ü‡¶¨‡ßá‡¶¶‡¶®‡¶ï‡ßÉ‡¶§ ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ' : 'Requested Class'}: <span className="text-emerald-700 font-extrabold">Class {adm.requestedClass}</span></p>
                              <p className="sm:col-span-2">{lang === 'bn' ? '‡¶Æ‡ßã‡¶¨‡¶æ‡¶á‡¶≤' : 'Contact Phone'}: <span className="text-gray-700 font-mono font-bold">{adm.guardianPhone}</span></p>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200/60">
                          {/* View details button */}
                          <button
                            onClick={() => setActiveViewAdmission(adm)}
                            title={lang === 'bn' ? '‡¶¨‡¶ø‡¶∏‡ßç‡¶§‡¶æ‡¶∞‡¶ø‡¶§ ‡¶Ü‡¶¨‡ßá‡¶¶‡¶®‡¶™‡¶§‡ßç‡¶∞ ‡¶¶‡ßá‡¶ñ‡ßÅ‡¶®' : 'View Full Application Profile'}
                            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-extrabold"
                          >
                            <Eye className="h-4 w-4" />
                            <span>{lang === 'bn' ? '‡¶™‡ßç‡¶∞‡ßã‡¶´‡¶æ‡¶á‡¶≤' : 'Profile'}</span>
                          </button>

                          {adm.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => {
                                  setActiveApproveAdmission(adm);
                                  // Pre-set a suggested roll
                                  const classStudents = students.filter(s => s.class === adm.requestedClass);
                                  const nextRollNum = classStudents.length + 1;
                                  setApproveRoll(nextRollNum.toString());
                                  setApproveSection('A');
                                  setApproveShift('Morning');
                                  setApproveGroup(parseInt(adm.requestedClass) >= 9 ? 'Science' : 'General');
                                }}
                                className="px-4 py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1.5"
                              >
                                {lang === 'bn' ? '‡¶Ö‡¶®‡ßÅ‡¶Æ‡ßã‡¶¶‡¶® ‡¶Æ‡¶°‡¶æ‡¶≤' : 'Approve Admission'}
                              </button>
                              <button 
                                onClick={() => handleRejectAdmission(adm.id, adm.studentName)}
                                className="px-3 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                              >
                                {lang === 'bn' ? '‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡¶æ‡¶ñ‡ßç‡¶Ø‡¶æ‡¶®' : 'Reject'}
                              </button>
                            </>
                          ) : adm.status === 'approved' ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs font-black rounded-xl">
                                ‚úì {lang === 'bn' ? '‡¶Ö‡¶®‡ßÅ‡¶Æ‡ßã‡¶¶‡¶ø‡¶§ ‡¶ì ‡¶∏‡¶ø‡¶ô‡ßç‡¶ï‡¶°' : 'Approved & Synced'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                Assigned ID: {adm.assignedId || 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-150 text-rose-700 text-xs font-black rounded-xl">
                              ‚úï {lang === 'bn' ? '‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡¶æ‡¶ñ‡ßç‡¶Ø‡¶æ‡¶§' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {pendingAdmissions.length === 0 && (
                      <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-250 rounded-2xl text-gray-400 font-bold text-xs">
                        {lang === 'bn' ? '‡¶ï‡ßã‡¶®‡ßã ‡¶Æ‡ßÅ‡¶≤‡¶§‡ßÅ‡¶¨‡¶ø ‡¶Ü‡¶¨‡ßá‡¶¶‡¶® ‡¶™‡¶æ‡¶ì‡ßü‡¶æ ‡¶Ø‡¶æ‡ßü‡¶®‡¶ø‡•§' : 'No pending admission requests.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* ARCHITECTURAL & DATABASE CODE CORNER (EPITOME OF CRAFT) */}
                <div className="hidden bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                      <Code className="h-5 w-5 text-[#025644]" />
                      <span>{lang === 'bn' ? '‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶Ü‡¶∞‡ßç‡¶ï‡¶ø‡¶ü‡ßá‡¶ï‡¶ö‡¶æ‡¶∞ ‡¶ì ‡¶è‡¶™‡¶ø‡¶Ü‡¶á ‡¶á‡¶û‡ßç‡¶ú‡¶ø‡¶®‡¶ø‡¶Ø‡¶º‡¶æ‡¶∞‡¶ø‡¶Ç ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶∏‡ßç‡¶ü‡ßá‡¶ú' : 'Database Architecture & Backend Controller Export'}</span>
                    </h4>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      {lang === 'bn' ? '‡¶≠‡¶∞‡ßç‡¶§‡¶ø ‡¶™‡ßç‡¶∞‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º‡¶æ ‡¶Ö‡¶ü‡ßã‡¶Æ‡ßá‡¶∂‡¶®‡ßá‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ‡¶™‡ßç‡¶∞‡ßã‡¶°‡¶æ‡¶ï‡¶∂‡¶®-‡¶∞‡ßá‡¶°‡¶ø ‡¶∏‡ßç‡¶ï‡¶ø‡¶Æ‡¶æ, ‡¶ü‡ßç‡¶∞‡¶æ‡¶®‡¶ú‡ßá‡¶ï‡¶∂‡¶® ‡¶ü‡ßç‡¶∞‡¶ø‡¶ó‡¶æ‡¶∞ ‡¶è‡¶¨‡¶Ç ‡¶ï‡¶®‡ßç‡¶ü‡ßç‡¶∞‡ßã‡¶≤‡¶æ‡¶∞ ‡¶ï‡ßã‡¶°' : 'Full-stack production schemas, robust relational database transitions and safe auto-promotion codebases'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 border-b border-gray-100 pb-2.5">
                    <button
                      onClick={() => setAdmissionSnippetsTab('postgres')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        admissionSnippetsTab === 'postgres' 
                          ? 'bg-[#025644] text-white' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150'
                      }`}
                    >
                      PostgreSQL DDL & Trigger
                    </button>
                    <button
                      onClick={() => setAdmissionSnippetsTab('nodejs')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        admissionSnippetsTab === 'nodejs' 
                          ? 'bg-[#025644] text-white' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150'
                      }`}
                    >
                      Node.js Express Controller
                    </button>
                    <button
                      onClick={() => setAdmissionSnippetsTab('python')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        admissionSnippetsTab === 'python' 
                          ? 'bg-[#025644] text-white' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-150'
                      }`}
                    >
                      Django Transaction Controller
                    </button>
                  </div>

                  <div className="relative bg-slate-900 rounded-2xl p-4 overflow-x-auto border border-slate-800 text-left font-mono text-[11px] leading-relaxed text-slate-100 max-h-[360px]">
                    <button 
                      onClick={() => {
                        let textToCopy = '';
                        if (admissionSnippetsTab === 'postgres') {
                          textToCopy = `-- PostgreSQL Schema and Triggers\nCREATE TYPE payment_status_enum AS ENUM ('Pending', 'Paid');\nCREATE TYPE application_status_enum AS ENUM ('Pending', 'Approved', 'Rejected');\n\nCREATE TABLE admission_applications (\n  id SERIAL PRIMARY KEY,\n  applicant_name VARCHAR(100) NOT NULL,\n  guardian_name VARCHAR(100) NOT NULL,\n  guardian_phone VARCHAR(20) NOT NULL,\n  requested_class VARCHAR(10) NOT NULL,\n  previous_gpa DECIMAL(3,2) NOT NULL,\n  transaction_id VARCHAR(50) UNIQUE DEFAULT 'N/A',\n  payment_status payment_status_enum DEFAULT 'Pending',\n  application_status application_status_enum DEFAULT 'Pending',\n  documents_url JSONB DEFAULT '{}'::jsonb,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE SEQUENCE student_id_seq START WITH 1000;\n\n-- Automated trigger workflow for student database on approved applications\nCREATE OR REPLACE FUNCTION auto_promote_application_to_student()\nRETURNS TRIGGER AS $$\nDECLARE\n  new_student_id VARCHAR(20);\n  next_seq INT;\nBEGIN\n  IF NEW.application_status = 'Approved' AND OLD.application_status != 'Approved' THEN\n    next_seq := nextval('student_id_seq');\n    new_student_id := 'STD-2026-' || next_seq;\n    \n    INSERT INTO students (id, name, class, section, roll, group_name, guardian_name, guardian_phone, status)\n    VALUES (\n      new_student_id,\n      NEW.applicant_name,\n      NEW.requested_class,\n      'A', -- Default assigned section\n      '01', -- Default roll number\n      'General',\n      NEW.guardian_name,\n      NEW.guardian_phone,\n      'Active'\n    );\n  END IF;\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;`;
                        } else if (admissionSnippetsTab === 'nodejs') {
                          textToCopy = `// Node.js Express Server Backend Endpoint with Transaction\nimport { Router } from 'express';\nimport { pool } from '../db/pg'; // postgres client pool\n\nconst router = Router();\n\nrouter.post('/api/admission/approve/:id', async (req, res) => {\n  const applicationId = req.params.id;\n  const { roll, section, group, shift } = req.body;\n\n  const client = await pool.connect();\n  try {\n    // Initiate safe relational database transaction\n    await client.query('BEGIN');\n\n    // 1. Retrieve the registration application first\n    const selectQuery = 'SELECT * FROM admission_applications WHERE id = $1 FOR UPDATE';\n    const appRes = await client.query(selectQuery, [applicationId]);\n    if (appRes.rows.length === 0) {\n      throw new Error('Application profile not found.');\n    }\n\n    const appData = appRes.rows[0];\n    if (appData.application_status === 'Approved') {\n      throw new Error('Application is already approved.');\n    }\n\n    // 2. Auto-generate sequential student ID based on current year\n    const countRes = await client.query('SELECT COUNT(*) FROM students');\n    const nextIndex = parseInt(countRes.rows[0].count) + 1001;\n    const customStudentId = \`STD-2026-\${nextIndex}\`;\n\n    // 3. Create active student record\n    const studentInsertSql = \`\n      INSERT INTO students (id, photo, name, class, section, roll, group_name, guardian_name, guardian_phone, status, login_active)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active', true)\n    \`;\n    await client.query(studentInsertSql, [\n      customStudentId,\n      appData.documents_url?.applicant_photo || '',\n      appData.applicant_name,\n      appData.requested_class,\n      section || 'A',\n      roll || '01',\n      group || 'General',\n      appData.guardian_name,\n      appData.guardian_phone\n    ]);\n\n    // 4. Set application queue status to Approved\n    const updateAppSql = \`\n      UPDATE admission_applications \n      SET application_status = 'Approved', transaction_id = $2\n      WHERE id = $1\n    \`;\n    await client.query(updateAppSql, [applicationId, customStudentId]);\n\n    // Commit transaction safely\n    await client.query('COMMIT');\n    res.status(200).json({\n      success: true,\n      message: 'Student promoted successfully.',\n      studentId: customStudentId\n    });\n  } catch (error) {\n    await client.query('ROLLBACK');\n    res.status(500).json({ success: false, error: error.message });\n  } finally {\n    client.release();\n  }\n});`;
                        } else {
                          textToCopy = `# Python Django/DRF Class Admission Approval Controller\nfrom django.db import transaction\nfrom rest_framework.decorators import api_view\nfrom rest_framework.response import Response\nfrom rest_framework import status\nfrom .models import AdmissionApplication, Student\n\n@api_view(['POST'])\n@transaction.atomic\ndef approve_admission_application(request, pk):\n    try:\n        # Lock application record during transaction block\n        application = AdmissionApplication.objects.select_for_update().get(pk=pk)\n    except AdmissionApplication.DoesNotExist:\n        return Response({"error": "Application record not found"}, status=status.HTTP_404_NOT_FOUND)\n        \n    if application.application_status == 'Approved':\n        return Response({"error": "Already approved"}, status=status.HTTP_400_BAD_REQUEST)\n        \n    roll = request.data.get('roll', '01')\n    section = request.data.get('section', 'A')\n    group = request.data.get('group', 'General')\n    shift = request.data.get('shift', 'Morning')\n    \n    try:\n        # Generate Student unique sequence id\n        total_students = Student.objects.count()\n        generated_student_id = f"STD-2026-{1000 + total_students + 1}"\n        \n        # Create student profile\n        student = Student.objects.create(\n            id=generated_student_id,\n            name=application.applicant_name,\n            student_class=application.requested_class,\n            section=section,\n            roll=roll,\n            group=group,\n            shift=shift,\n            guardian_name=application.guardian_name,\n            guardian_phone=application.guardian_phone,\n            status='Active',\n            login_active=True\n        )\n        \n        # Sync application status\n        application.application_status = 'Approved'\n        application.transaction_id = generated_student_id\n        application.save()\n        \n        return Response({\n            "success": True,\n            "student_id": generated_student_id,\n            "message": "Student promoted successfully"\n        }, status=status.HTTP_200_OK)\n        \n    except Exception as e:\n        # Transaction auto-rolls back on exception block\n        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)`;
                        }
                        navigator.clipboard.writeText(textToCopy);
                        alert(lang === 'bn' ? '‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶ï‡ßç‡¶≤‡¶ø‡¶™‡¶¨‡ßã‡¶∞‡ßç‡¶°‡ßá ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Copied schema/code to clipboard successfully!');
                      }}
                      className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code'}</span>
                    </button>
                    {admissionSnippetsTab === 'postgres' && (
                      <pre>{`-- PostgreSQL Schema and Triggers
CREATE TYPE payment_status_enum AS ENUM ('Pending', 'Paid');
CREATE TYPE application_status_enum AS ENUM ('Pending', 'Approved', 'Rejected');

CREATE TABLE admission_applications (
  id SERIAL PRIMARY KEY,
  applicant_name VARCHAR(100) NOT NULL,
  guardian_name VARCHAR(100) NOT NULL,
  guardian_phone VARCHAR(20) NOT NULL,
  requested_class VARCHAR(10) NOT NULL,
  previous_gpa DECIMAL(3,2) NOT NULL,
  transaction_id VARCHAR(50) UNIQUE DEFAULT 'N/A',
  payment_status payment_status_enum DEFAULT 'Pending',
  application_status application_status_enum DEFAULT 'Pending',
  documents_url JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE student_id_seq START WITH 1000;

-- Automated trigger workflow for student database on approved applications
CREATE OR REPLACE FUNCTION auto_promote_application_to_student()
RETURNS TRIGGER AS $$
DECLARE
  new_student_id VARCHAR(20);
  next_seq INT;
BEGIN
  IF NEW.application_status = 'Approved' AND OLD.application_status != 'Approved' THEN
    next_seq := nextval('student_id_seq');
    new_student_id := 'STD-2026-' || next_seq;
    
    INSERT INTO students (id, name, class, section, roll, group_name, guardian_name, guardian_phone, status)
    VALUES (
      new_student_id,
      NEW.applicant_name,
      NEW.requested_class,
      'A', -- Default assigned section
      '01', -- Default roll number
      'General',
      NEW.guardian_name,
      NEW.guardian_phone,
      'Active'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`}</pre>
                    )}
                    {admissionSnippetsTab === 'nodejs' && (
                      <pre>{`// Node.js Express Server Backend Endpoint with Transaction
import { Router } from 'express';
import { pool } from '../db/pg'; // postgres client pool

const router = Router();

router.post('/api/admission/approve/:id', async (req, res) => {
  const applicationId = req.params.id;
  const { roll, section, group, shift } = req.body;

  const client = await pool.connect();
  try {
    // Initiate safe relational database transaction
    await client.query('BEGIN');

    // 1. Retrieve the registration application first
    const selectQuery = 'SELECT * FROM admission_applications WHERE id = $1 FOR UPDATE';
    const appRes = await client.query(selectQuery, [applicationId]);
    if (appRes.rows.length === 0) {
      throw new Error('Application profile not found.');
    }

    const appData = appRes.rows[0];
    if (appData.application_status === 'Approved') {
      throw new Error('Application is already approved.');
    }

    // 2. Auto-generate sequential student ID based on current year
    const countRes = await client.query('SELECT COUNT(*) FROM students');
    const nextIndex = parseInt(countRes.rows[0].count) + 1001;
    const customStudentId = \`STD-2026-\${nextIndex}\`;

    // 3. Create active student record
    const studentInsertSql = \`
      INSERT INTO students (id, photo, name, class, section, roll, group_name, guardian_name, guardian_phone, status, login_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active', true)
    \`;
    await client.query(studentInsertSql, [
      customStudentId,
      appData.documents_url?.applicant_photo || '',
      appData.applicant_name,
      appData.requested_class,
      section || 'A',
      roll || '01',
      group || 'General',
      appData.guardian_name,
      appData.guardian_phone
    ]);

    // 4. Set application queue status to Approved
    const updateAppSql = \`
      UPDATE admission_applications 
      SET application_status = 'Approved', transaction_id = $2
      WHERE id = $1
    \`;
    await client.query(updateAppSql, [applicationId, customStudentId]);

    // Commit transaction safely
    await client.query('COMMIT');
    res.status(200).json({
      success: true,
      message: 'Student promoted successfully.',
      studentId: customStudentId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});`}</pre>
                    )}
                    {admissionSnippetsTab === 'python' && (
                      <pre>{`# Python Django/DRF Class Admission Approval Controller
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import AdmissionApplication, Student

@api_view(['POST'])
@transaction.atomic
def approve_admission_application(request, pk):
    try:
        # Lock application record during transaction block
        application = AdmissionApplication.objects.select_for_update().get(pk=pk)
    except AdmissionApplication.DoesNotExist:
        return Response({"error": "Application record not found"}, status=status.HTTP_404_NOT_FOUND)
        
    if application.application_status == 'Approved':
        return Response({"error": "Already approved"}, status=status.HTTP_400_BAD_REQUEST)
        
    roll = request.data.get('roll', '01')
    section = request.data.get('section', 'A')
    group = request.data.get('group', 'General')
    shift = request.data.get('shift', 'Morning')
    
    try:
        # Generate Student unique sequence id
        total_students = Student.objects.count()
        generated_student_id = f"STD-2026-{1000 + total_students + 1}"
        
        # Create student profile
        student = Student.objects.create(
            id=generated_student_id,
            name=application.applicant_name,
            student_class=application.requested_class,
            section=section,
            roll=roll,
            group=group,
            shift=shift,
            guardian_name=application.guardian_name,
            guardian_phone=application.guardian_phone,
            status='Active',
            login_active=True
        )
        
        # Sync application status
        application.application_status = 'Approved'
        application.transaction_id = generated_student_id
        application.save()
        
        return Response({
            "success": True,
            "student_id": generated_student_id,
            "message": "Student promoted successfully"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Transaction auto-rolls back on exception block
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)`}</pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* EMPLOYEE AND FACULTY REGISTRY PANEL */}
            {adminActiveTab === 'employee' && (
              <div className="space-y-6">
                {/* 1. EMPLOYEE LIST SUB-TAB */}
                {employeeSubTab === 'employee_list' && (
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-lg">
                          {lang === 'bn' ? '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶ì ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï ‡¶°‡¶ø‡¶∞‡ßá‡¶ï‡ßç‡¶ü‡¶∞‡¶ø' : 'Faculty & Staff Directory'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold">
                          {lang === 'bn' ? '‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤‡ßá‡¶∞ ‡¶∏‡¶ï‡¶≤ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï ‡¶ì ‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ‡¶∞ ‡¶§‡¶•‡ßç‡¶Ø ‡¶¶‡ßá‡¶ñ‡ßÅ‡¶®' : 'Browse and manage all registered teaching and administrative personnel'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => {
                            setEmployeeSubTab('add_employee');
                          }}
                          className="px-4 py-2 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          + {lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Add Employee'}
                        </button>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-gray-400" />
                        <input
                          type="text"
                          placeholder={lang === 'bn' ? '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶ñ‡ßÅ‡¶Å‡¶ú‡ßÅ‡¶®...' : 'Search employees...'}
                          value={employeeSearchQuery}
                          onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 focus:border-[#025644] focus:outline-none rounded-xl text-xs font-bold text-gray-700 shadow-3xs"
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <select
                          value={selectedEmployeeDeptFilter}
                          onChange={(e) => setSelectedEmployeeDeptFilter(e.target.value)}
                          className="w-full bg-white border border-gray-200 focus:border-[#025644] focus:outline-none rounded-xl text-xs font-bold text-gray-700 py-1.5 px-3 cursor-pointer shadow-3xs"
                        >
                          <option value="All">{lang === 'bn' ? '‡¶∏‡¶¨ ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü' : 'All Departments'}</option>
                          {employeeDepartments.map((dept, idx) => (
                            <option key={idx} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* List Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {employees
                        .filter(emp => {
                          const matchesSearch = emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                            emp.role.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                            emp.subject.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                            emp.email.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                            emp.phone.includes(employeeSearchQuery);
                          const matchesDept = selectedEmployeeDeptFilter === 'All' || emp.subject.toLowerCase().includes(selectedEmployeeDeptFilter.toLowerCase()) || emp.role.toLowerCase().includes(selectedEmployeeDeptFilter.toLowerCase());
                          return matchesSearch && matchesDept;
                        })
                        .map((emp, i) => (
                          <div key={i} className="bg-gray-50 border border-gray-150 rounded-2xl p-5 space-y-3.5 hover:shadow-2xs transition-shadow relative">
                            {/* Status Badge */}
                            <span className={`absolute top-4 right-4 text-[10px] font-black px-2 py-0.5 rounded-full ${
                              emp.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {lang === 'bn' 
                                ? (emp.status === 'Active' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü' : '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡ßü')
                                : emp.status
                              }
                            </span>

                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-emerald-50 text-[#025644] border border-emerald-100/30 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                                {emp.name.split(' ').slice(-1)[0] ? emp.name.split(' ').slice(-1)[0][0] : 'T'}
                              </div>
                              <div className="text-left leading-tight min-w-0 pr-12">
                                <h4 className="font-extrabold text-sm text-gray-900 truncate">{emp.name}</h4>
                                <p className="text-[11px] text-gray-400 font-bold mt-0.5">{emp.role}</p>
                              </div>
                            </div>

                            <div className="text-xs text-gray-500 font-semibold space-y-1.5 pt-1.5 border-t border-gray-200/65">
                              <p>{lang === 'bn' ? '‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü / ‡¶¨‡¶ø‡¶∑‡ßü' : 'Dept / Specialization'}: <span className="text-gray-800 font-bold">{emp.subject}</span></p>
                              <p>{lang === 'bn' ? '‡¶á‡¶Æ‡ßá‡¶á‡¶≤' : 'Email'}: <span className="text-gray-700 font-bold font-mono text-xs truncate block">{emp.email}</span></p>
                              <p>{lang === 'bn' ? '‡¶Æ‡ßã‡¶¨‡¶æ‡¶á‡¶≤' : 'Mobile'}: <span className="text-gray-700 font-bold font-mono">{emp.phone}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-150">
                              <button 
                                onClick={() => {
                                  setEmployees(prev => prev.map((e) => e.email === emp.email ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e));
                                }}
                                className="py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer text-center"
                              >
                                {emp.status === 'Active' 
                                  ? (lang === 'bn' ? '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡ßü' : 'Deactivate') 
                                  : (lang === 'bn' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü' : 'Activate')
                                }
                              </button>
                              <button 
                                onClick={() => {
                                  setEmployees(prev => prev.filter((e) => e.email !== emp.email));
                                }}
                                className="py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-200 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer text-center"
                              >
                                {lang === 'bn' ? '‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡ßÅ‡¶®' : 'Remove'}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 2. ADD DEPARTMENT SUB-TAB */}
                {employeeSubTab === 'add_department' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Add New Department'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? '‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤‡ßá‡¶∞ ‡¶è‡¶ï‡¶æ‡¶°‡ßá‡¶Æ‡¶ø‡¶ï ‡¶¨‡¶æ ‡¶™‡ßç‡¶∞‡¶∂‡¶æ‡¶∏‡¶®‡¶ø‡¶ï ‡¶®‡¶§‡ßÅ‡¶® ‡¶¨‡¶ø‡¶≠‡¶æ‡¶ó ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Register a new academic or administrative department'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">{lang === 'bn' ? '‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ' : 'Department Name'}</label>
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? '‡¶Ø‡ßá‡¶Æ‡¶®: Science, Commerce, Language' : 'e.g. Science, Commerce, Language'}
                            value={newDepartmentInput}
                            onChange={(e) => setNewDepartmentInput(e.target.value)}
                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!newDepartmentInput.trim()) {
                              alert(lang === 'bn' ? '‡¶¶‡ßü‡¶æ ‡¶ï‡¶∞‡ßá ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®!' : 'Please enter a department name!');
                              return;
                            }
                            if (employeeDepartments.map(d => d.toLowerCase()).includes(newDepartmentInput.trim().toLowerCase())) {
                              alert(lang === 'bn' ? '‡¶è‡¶á ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü‡¶ü‡¶ø ‡¶á‡¶§‡¶ø‡¶Æ‡¶ß‡ßç‡¶Ø‡ßá ‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶Æ‡¶æ‡¶®!' : 'This department already exists!');
                              return;
                            }
                            setEmployeeDepartments(prev => [...prev, newDepartmentInput.trim()]);
                            setNewDepartmentInput('');
                            addAuditLog(`Admin added a new employee department: ${newDepartmentInput.trim()}`);
                          }}
                          className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          {lang === 'bn' ? '‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Save Department'}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {lang === 'bn' ? '‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶Æ‡¶æ‡¶® ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ' : 'Existing Departments'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? '‡¶¨‡¶∞‡ßç‡¶§‡¶Æ‡¶æ‡¶®‡ßá ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤‡ßá ‡¶Ö‡¶®‡ßÅ‡¶Æ‡ßã‡¶¶‡¶ø‡¶§ ‡¶¨‡¶ø‡¶≠‡¶æ‡¶ó‡¶∏‡¶Æ‡ßÇ‡¶π' : 'List of currently active school departments'}
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-1">
                        {employeeDepartments.map((dept, index) => {
                          const associatedCount = employees.filter(e => e.subject.toLowerCase().includes(dept.toLowerCase()) || e.role.toLowerCase().includes(dept.toLowerCase())).length;
                          return (
                            <div key={index} className="py-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-[#025644] flex items-center justify-center font-bold text-xs">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-xs font-black text-gray-800">{dept}</p>
                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{associatedCount} {lang === 'bn' ? '‡¶ú‡¶® ‡¶∏‡ßç‡¶ü‡¶æ‡¶´/‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï' : 'associated members'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (associatedCount > 0) {
                                    alert(lang === 'bn' 
                                      ? '‡¶è‡¶á ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü‡ßá‡¶∞ ‡¶∏‡¶æ‡¶•‡ßá ‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶Ü‡¶õ‡ßá, ‡¶§‡¶æ‡¶á ‡¶è‡¶ü‡¶ø ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶∏‡¶Æ‡ßç‡¶≠‡¶¨ ‡¶®‡ßü!' 
                                      : 'Cannot delete department. There are active employees assigned to it!'
                                    );
                                    return;
                                  }
                                  setEmployeeDepartments(prev => prev.filter((_, i) => i !== index));
                                  addAuditLog(`Admin deleted employee department: ${dept}`);
                                }}
                                className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete Department"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ADD DESIGNATION SUB-TAB */}
                {employeeSubTab === 'add_designation' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶® ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Add New Designation'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶ì ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï‡¶¶‡ßá‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ‡¶®‡¶§‡ßÅ‡¶® ‡¶™‡¶¶ ‡¶¨‡¶æ ‡¶â‡¶™‡¶æ‡¶ß‡¶ø ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Register a new official designation or job title'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">{lang === 'bn' ? '‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶®‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ' : 'Designation Name'}</label>
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? '‡¶Ø‡ßá‡¶Æ‡¶®: Assistant Lecturer, Senior Officer' : 'e.g. Assistant Lecturer, Senior Officer'}
                            value={newDesignationInput}
                            onChange={(e) => setNewDesignationInput(e.target.value)}
                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!newDesignationInput.trim()) {
                              alert(lang === 'bn' ? '‡¶¶‡ßü‡¶æ ‡¶ï‡¶∞‡ßá ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶®‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®!' : 'Please enter a designation name!');
                              return;
                            }
                            if (employeeDesignations.map(d => d.toLowerCase()).includes(newDesignationInput.trim().toLowerCase())) {
                              alert(lang === 'bn' ? '‡¶è‡¶á ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶®‡¶ü‡¶ø ‡¶á‡¶§‡¶ø‡¶Æ‡¶ß‡ßç‡¶Ø‡ßá ‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶Æ‡¶æ‡¶®!' : 'This designation already exists!');
                              return;
                            }
                            setEmployeeDesignations(prev => [...prev, newDesignationInput.trim()]);
                            setNewDesignationInput('');
                            addAuditLog(`Admin added a new employee designation: ${newDesignationInput.trim()}`);
                          }}
                          className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          {lang === 'bn' ? '‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶® ‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Save Designation'}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {lang === 'bn' ? '‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶Æ‡¶æ‡¶® ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶® ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ' : 'Existing Designations'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? '‡¶¨‡¶∞‡ßç‡¶§‡¶Æ‡¶æ‡¶®‡ßá ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤‡ßá ‡¶Ö‡¶®‡ßÅ‡¶Æ‡ßã‡¶¶‡¶ø‡¶§ ‡¶™‡¶¶ ‡¶¨‡¶æ ‡¶™‡¶¶‡¶¨‡ßÄ‡¶∏‡¶Æ‡ßÇ‡¶π' : 'List of currently active school designations'}
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-1">
                        {employeeDesignations.map((desig, index) => {
                          const associatedCount = employees.filter(e => e.role.toLowerCase().includes(desig.toLowerCase())).length;
                          return (
                            <div key={index} className="py-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-[#025644] flex items-center justify-center font-bold text-xs">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-xs font-black text-gray-800">{desig}</p>
                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{associatedCount} {lang === 'bn' ? '‡¶ú‡¶® ‡¶∏‡ßç‡¶ü‡¶æ‡¶´/‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï' : 'associated members'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (associatedCount > 0) {
                                    alert(lang === 'bn' 
                                      ? '‡¶è‡¶á ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶®‡ßá‡¶∞ ‡¶∏‡¶æ‡¶•‡ßá ‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶Ü‡¶õ‡ßá, ‡¶§‡¶æ‡¶á ‡¶è‡¶ü‡¶ø ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶∏‡¶Æ‡ßç‡¶≠‡¶¨ ‡¶®‡ßü!' 
                                      : 'Cannot delete designation. There are active employees assigned to it!'
                                    );
                                    return;
                                  }
                                  setEmployeeDesignations(prev => prev.filter((_, i) => i !== index));
                                  addAuditLog(`Admin deleted employee designation: ${desig}`);
                                }}
                                className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete Designation"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ADD EMPLOYEE INLINE FORM SUB-TAB */}
                {employeeSubTab === 'add_employee' && (
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-6 max-w-2xl mx-auto">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">
                        {lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ/‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Add New Employee/Teacher'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï‡¶Æ‡¶®‡ßç‡¶°‡¶≤‡ßÄ ‡¶¨‡¶æ ‡¶∏‡ßç‡¶ü‡¶æ‡¶´‡ßá‡¶∞ ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶™‡ßç‡¶∞‡ßã‡¶´‡¶æ‡¶á‡¶≤ ‡¶§‡¶•‡ßç‡¶Ø ‡¶á‡¶®‡¶™‡ßÅ‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Fill up the primary service record to onboard a new faculty or administrative staff member'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? '‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶®‡¶æ‡¶Æ' : 'Full Name'}</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Muhammad Jafar"
                          value={newEmployeeForm.name}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? '‡¶™‡¶¶‡¶¨‡ßÄ / ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶®' : 'Designation / Title'}</label>
                        <select
                          value={newEmployeeForm.role}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="">{lang === 'bn' ? '-- ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶® ‡¶®‡¶ø‡¶∞‡ßç‡¶¨‡¶æ‡¶ö‡¶® ‡¶ï‡¶∞‡ßÅ‡¶® --' : '-- Select Designation --'}</option>
                          {employeeDesignations.map((desig, idx) => (
                            <option key={idx} value={desig}>{desig}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? '‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü / ‡¶¨‡¶ø‡¶∑‡ßü' : 'Department / Subject'}</label>
                        <select
                          value={newEmployeeForm.subject}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="">{lang === 'bn' ? '-- ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶®‡¶ø‡¶∞‡ßç‡¶¨‡¶æ‡¶ö‡¶® ‡¶ï‡¶∞‡ßÅ‡¶® --' : '-- Select Department --'}</option>
                          {employeeDepartments.map((dept, idx) => (
                            <option key={idx} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? '‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡ßç‡¶∞‡ßá‡¶∏' : 'Official Email'}</label>
                        <input
                          type="email"
                          placeholder="e.g. jafar.m@scms.edu.bd"
                          value={newEmployeeForm.email}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? '‡¶Æ‡ßã‡¶¨‡¶æ‡¶á‡¶≤ ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞' : 'Mobile Number'}</label>
                        <input
                          type="text"
                          placeholder="e.g. 01712-112233"
                          value={newEmployeeForm.phone}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? '‡¶™‡ßç‡¶∞‡¶æ‡¶•‡¶Æ‡¶ø‡¶ï ‡¶∏‡ßç‡¶ü‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶∏' : 'Initial Status'}</label>
                        <select
                          value={newEmployeeForm.status}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="Active">{lang === 'bn' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü (Active)' : 'Active'}</option>
                          <option value="Inactive">{lang === 'bn' ? '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡ßü (Inactive)' : 'Inactive'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setEmployeeSubTab('employee_list');
                        }}
                        className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        {lang === 'bn' ? '‡¶¨‡¶æ‡¶§‡¶ø‡¶≤' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => {
                          if (!newEmployeeForm.name.trim() || !newEmployeeForm.role.trim() || !newEmployeeForm.subject.trim() || !newEmployeeForm.email.trim() || !newEmployeeForm.phone.trim()) {
                            alert(lang === 'bn' ? '‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶∏‡¶ï‡¶≤ ‡¶ò‡¶∞ ‡¶™‡ßÇ‡¶∞‡¶£ ‡¶ï‡¶∞‡ßÅ‡¶®!' : 'Please complete all form fields!');
                            return;
                          }
                          setEmployees(prev => [...prev, { ...newEmployeeForm }]);
                          addAuditLog(`Admin onboarded a new employee: ${newEmployeeForm.name} (${newEmployeeForm.role})`);
                          setNewEmployeeForm({
                            name: '',
                            role: '',
                            subject: '',
                            email: '',
                            phone: '',
                            status: 'Active'
                          });
                          setEmployeeSubTab('employee_list');
                        }}
                        className="px-5 py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl shadow-3xs transition-all cursor-pointer"
                      >
                        {lang === 'bn' ? '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Onboard Employee'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. LOGIN DEACTIVATE SUB-TAB */}
                {employeeSubTab === 'login_deactivate' && (
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-6">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">
                        {lang === 'bn' ? '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶≤‡¶ó‡¶á‡¶® ‡¶®‡¶ø‡ßü‡¶®‡ßç‡¶§‡ßç‡¶∞‡¶£ ‡¶™‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤' : 'Employee Login Access Panel'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï ‡¶ì ‡¶ï‡¶∞‡ßç‡¶Æ‡¶ï‡¶∞‡ßç‡¶§‡¶æ‡¶¶‡ßá‡¶∞ ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤ ‡¶≤‡¶ó‡¶á‡¶® ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏‡ßá‡¶∏ ‡¶Ö‡¶® ‡¶¨‡¶æ ‡¶Ö‡¶´ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Enable or disable interactive web-portal logins for any registered staff member instantly'}
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded-2xl">
                      <table className="w-full text-xs text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] tracking-wider border-b border-gray-150">
                          <tr>
                            <th className="px-5 py-3.5">{lang === 'bn' ? '‡¶®‡¶æ‡¶Æ ‡¶ì ‡¶∞‡ßã‡¶≤' : 'Name & Title'}</th>
                            <th className="px-5 py-3.5">{lang === 'bn' ? '‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡ßç‡¶∞‡ßá‡¶∏' : 'Official Email'}</th>
                            <th className="px-5 py-3.5">{lang === 'bn' ? '‡¶°‡¶ø‡¶≠‡¶æ‡¶á‡¶∏ ‡¶¨‡¶æ ‡¶Ü‡¶á‡¶™‡¶ø' : 'Last Secure Activity'}</th>
                            <th className="px-5 py-3.5 text-center">{lang === 'bn' ? '‡¶≤‡¶ó‡¶á‡¶® ‡¶∏‡ßç‡¶ü‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶∏' : 'Authentication Access'}</th>
                            <th className="px-5 py-3.5 text-right">{lang === 'bn' ? '‡¶™‡¶¶‡¶ï‡ßç‡¶∑‡ßá‡¶™' : 'Quick Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150">
                          {employees.map((emp, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#025644] flex items-center justify-center font-bold">
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-gray-800">{emp.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{emp.role}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 font-mono font-medium text-gray-500">{emp.email}</td>
                              <td className="px-5 py-4">
                                <p className="font-bold text-gray-700">{lang === 'bn' ? '‡¶Ü‡¶ú, ‡ßß‡ß¶:‡ß®‡ß™ ‡¶Æ‡¶ø‡¶®‡¶ø‡¶ü' : 'Today, 10:24 AM'}</p>
                                <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">IP: 103.245.12.{10 + idx}</p>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                  emp.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  {emp.status === 'Active' ? (lang === 'bn' ? '‡¶Ö‡¶®‡ßÅ‡¶Æ‡ßã‡¶¶‡¶ø‡¶§' : 'Allowed') : (lang === 'bn' ? '‡¶®‡¶ø‡¶∑‡¶ø‡¶¶‡ßç‡¶ß' : 'Blocked')}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setEmployees(prev => prev.map((e, i) => i === idx ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e));
                                    addAuditLog(`Admin toggled login status for ${emp.name} to ${emp.status === 'Active' ? 'Inactive' : 'Active'}`);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-colors cursor-pointer ${
                                    emp.status === 'Active'
                                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                >
                                  {emp.status === 'Active' ? (lang === 'bn' ? '‡¶≤‡¶ó‡¶á‡¶® ‡¶¨‡¶®‡ßç‡¶ß ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Deactivate Login') : (lang === 'bn' ? '‡¶≤‡¶ó‡¶á‡¶® ‡¶ö‡¶æ‡¶≤‡ßÅ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Activate Login')}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CLASSES MANAGEMENT PANEL */}
            {adminActiveTab === 'classes' && (
              <div className="space-y-6">
                {/* Header Card with dynamic action */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                      <GraduationCap className="h-6 w-6 text-[#025644]" />
                      <span>{lang === 'bn' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ ‡¶ì ‡¶∏‡ßç‡¶§‡¶∞ ‡¶∞‡ßá‡¶ú‡¶ø‡¶∏‡ßç‡¶ü‡ßç‡¶∞‡¶ø' : 'Active Classes & Level Registry'}</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">
                      {lang === 'bn' ? '‡¶™‡ßç‡¶∞‡¶ß‡¶æ‡¶® ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï ‡¶ì ‡¶è‡¶ï‡¶æ‡¶°‡ßá‡¶Æ‡¶ø‡¶ï ‡¶∏‡ßç‡¶§‡¶∞ ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶è‡¶¨‡¶Ç ‡¶®‡¶§‡ßÅ‡¶® ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Manage core school grading levels, assigned class teachers, shifts, groups and subjects'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewClassForm({
                        name: '',
                        level: 'Secondary',
                        sections: 'A, B',
                        shifts: ['Morning', 'Day'],
                        groups: [],
                        teacher: employees.length > 0 ? employees[0].name : '',
                        studentCount: 45,
                        attendanceAvg: 95
                      });
                      setIsAddClassModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Add New Class'}</span>
                  </button>
                </div>

                {/* Grid of Classes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {schoolClasses.map((cl) => {
                    return (
                      <div key={cl.id} className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-3xs hover:shadow-2xs transition-all relative flex flex-col justify-between text-left">
                        
                        <div className="space-y-3">
                          {/* Top row: name and level badge */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-black text-slate-800 text-base">{cl.name}</h4>
                              <span className="text-[10px] text-slate-400 font-bold">{cl.level} Level</span>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-black px-2.5 py-1 rounded-lg">
                              Active
                            </span>
                          </div>

                          {/* Class Teacher Assignment inline card showing Section & Shift Mapping */}
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-left">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <User className="h-3 w-3 text-[#025644]" />
                              <span>{lang === 'bn' ? '‡¶∂‡¶æ‡¶ñ‡¶æ ‡¶ì ‡¶∂‡¶ø‡¶´‡¶ü ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï‡¶¨‡ßÉ‡¶®‡ßç‡¶¶' : 'Section & Shift Teachers'}</span>
                            </label>
                            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                              {getAssignments(cl).map((asg, asgIdx) => (
                                <div key={asgIdx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
                                  <span className="text-slate-500 font-bold text-[11px]">{asg.section} ({asg.shift}):</span>
                                  <span className="text-[#025644] font-extrabold text-[11px]">{asg.teacher || (lang === 'bn' ? '‡¶®‡¶ø‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡¶®‡¶ø' : 'Not Assigned')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold text-slate-500">
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? '‡¶∂‡¶æ‡¶ñ‡¶æ' : 'Sections'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.sections.join(', ')}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? '‡¶∂‡¶ø‡¶´‡¶ü' : 'Academic Shift'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.shifts.join(', ')}</p>
                            </div>
                            {cl.groups && cl.groups.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? '‡¶ó‡ßç‡¶∞‡ßÅ‡¶™ ‡¶∏‡¶Æ‡ßÇ‡¶π' : 'Academic Groups'}</p>
                                <p className="text-slate-800 font-extrabold mt-0.5">{cl.groups.join(', ')}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶∏‡¶Ç‡¶ñ‡ßç‡¶Ø‡¶æ' : 'Pupils'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.studentCount} Students</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? '‡¶ó‡¶°‡¶º ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø' : 'Attendance Avg'}</p>
                              <p className="text-emerald-700 font-black mt-0.5">{cl.attendanceAvg}%</p>
                            </div>
                          </div>

                          {/* Subjects Count */}
                          <div className="flex items-center justify-between text-xs font-semibold bg-[#025644]/5 p-2 px-3 border border-[#025644]/10 rounded-xl">
                            <span className="text-slate-600 flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-[#025644]" />
                              <span>{lang === 'bn' ? '‡¶Æ‡ßã‡¶ü ‡¶¨‡¶ø‡¶∑‡¶Ø‡¶º' : 'Subjects Mapped'}</span>
                            </span>
                            <span className="font-extrabold text-[#025644]">{cl.subjects.length} Subjects</span>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 mt-4 shrink-0">
                          <button
                            onClick={() => {
                              setActiveSubjectClassId(cl.id);
                              setNewSubjectCode('');
                              setNewSubjectName('');
                            }}
                            className="py-2 bg-white hover:bg-slate-50 text-[#025644] text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-3xs"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                            <span>{lang === 'bn' ? '‡¶¨‡¶ø‡¶∑‡¶Ø‡¶º ‡¶∏‡¶Æ‡ßÇ‡¶π' : 'Manage Subjects'}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setActiveEditClassId(cl.id);
                            }}
                            className="py-2 bg-[#025644]/5 hover:bg-[#025644]/10 text-slate-700 text-xs font-bold rounded-xl border border-[#025644]/10 transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <Settings className="h-3.5 w-3.5 text-[#025644]" />
                            <span>{lang === 'bn' ? '‡¶ï‡¶®‡¶´‡¶ø‡¶ó‡¶æ‡¶∞' : 'Configure'}</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FEES COLLECTION PANEL */}
            {adminActiveTab === 'fees' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                {/* Accountant fee form proxy inside admin */}
                <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">Direct Tuition & Fees Collection</h3>
                    <p className="text-xs text-gray-400 font-bold">Issue invoice receipt instantly to student ledger</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-150/70 p-4 rounded-xl text-xs font-semibold text-slate-700">
                    üí° This form submits collection straight to the real transactions database, updating total receivables instantly.
                  </div>
                  
                  {/* Reuse accountant fee form state or render neat inputs */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    setAdminSuccessMsg("Fees collected successfully! Receipt recorded to Office Cash Book.");
                    addAuditLog(`Admin received fee collection from student ID 2026102.`);
                    setTimeout(() => setAdminSuccessMsg(''), 4000);
                  }} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="block font-bold text-gray-400">Student ID</label>
                      <input type="text" placeholder="e.g. 2026105" required className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-gray-400">Fee Category</label>
                      <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white text-gray-700 font-bold cursor-pointer">
                        <option>Monthly Tuition Fee</option>
                        <option>Half-Yearly Exam Fee</option>
                        <option>Syllabus & Diary Purchase</option>
                        <option>Sports & Cultural Fund</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-gray-400">Amount (BDT)</label>
                        <input type="number" placeholder="‡ß≥ Amount" required className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-gray-400">Payment Channel</label>
                        <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white text-gray-700 font-bold cursor-pointer">
                          <option>Cash (‡¶®‡¶ó‡¶¶)</option>
                          <option>bKash (‡¶¨‡¶ø‡¶ï‡¶æ‡¶∂)</option>
                          <option>Rocket (‡¶∞‡¶ï‡ßá‡¶ü)</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white font-black rounded-xl shadow-sm transition-all cursor-pointer">
                      Confirm Fee Collection
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="font-extrabold text-gray-900 text-base">Outstanding Fee Reminders</h3>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">Action Required</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Nafis Ahmed', roll: '10', class: 'Class 9', due: '‡ß≥ 3,200', month: 'June Tuition' },
                      { name: 'Sumaiya Khan', roll: '04', class: 'Class 8', due: '‡ß≥ 1,500', month: 'Exam Fee' },
                      { name: 'Rohan Talukder', roll: '18', class: 'Class 10', due: '‡ß≥ 4,800', month: 'May - June Tuition' }
                    ].map((due, i) => (
                      <div key={i} className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-150/70 rounded-xl">
                        <div className="text-xs">
                          <p className="font-extrabold text-gray-800">{due.name} ({due.class})</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{due.month} Outstanding</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-rose-600 text-sm bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">{due.due}</span>
                          <button onClick={() => {
                            setAdminSuccessMsg(`SMS alert reminder successfully sent to ${due.name}-parent!`);
                            addAuditLog(`Admin sent due fee SMS reminder to guardian of ${due.name}.`);
                            setTimeout(() => setAdminSuccessMsg(''), 4000);
                          }} className="px-3 py-1.5 bg-[#025644] hover:bg-[#01352a] text-white text-[10px] font-black rounded-lg shadow-3xs cursor-pointer transition-all">
                            Send Alert
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STUDENT IDENTITY CARD GENERATOR */}
            {adminActiveTab === 'card' && (
              <>
                {cardSubTab === 'id_card' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                    <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">Identity Card Generator</h3>
                        <p className="text-xs text-gray-400 font-bold">Configure and generate student ID cards</p>
                      </div>
                      <div className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Select Student</label>
                          <select onChange={(e) => handleStudentSelect(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold">
                            <option value="">Select a student</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Upload Student Photo</label>
                          <input type="file" onChange={handlePhotoChange} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                            <label className="block font-bold text-gray-400">Class</label>
                            <input type="text" value={idCardData.class} onChange={(e) => setIdCardData(prev => ({ ...prev, class: e.target.value }))} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                           </div>
                           <div className="space-y-1">
                            <label className="block font-bold text-gray-400">Roll</label>
                            <input type="text" value={idCardData.roll} onChange={(e) => setIdCardData(prev => ({ ...prev, roll: e.target.value }))} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                           </div>
                        </div>
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Session</label>
                          <select value={idCardData.session} onChange={(e) => setIdCardData(prev => ({ ...prev, session: e.target.value }))} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold">
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                            <label className="block font-bold text-gray-400">Class</label>
                            <select value={idCardFilterClass} onChange={(e) => setIdCardFilterClass(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold">
                              <option>Class 3</option>
                              <option>Class 4</option>
                            </select>
                           </div>
                           <div className="space-y-1">
                            <label className="block font-bold text-gray-400">Section</label>
                            <select value={idCardFilterSection} onChange={(e) => setIdCardFilterSection(e.target.value)} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold">
                              <option>A</option>
                              <option>B</option>
                            </select>
                           </div>
                        </div>
                        <button onClick={generateBulkPDF} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-sm cursor-pointer transition-all">
                          <Download className="h-4 w-4" /> Generate Bulk PDF
                        </button>
                        <button onClick={() => window.print()} className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white font-black rounded-xl shadow-sm cursor-pointer transition-all">
                          Print ID Card
                        </button>
                      </div>
                    </div>

                    {/* Live ID Card Preview Panel */}
                    <div className="lg:col-span-7 flex flex-col items-center justify-center bg-gray-100/50 border border-gray-200 rounded-2xl p-6 shadow-inner min-h-[350px]">
                      <style>
                        {`
                          @media print {
                            body * { visibility: hidden; }
                            #id-card-preview, #id-card-preview * { visibility: visible; }
                            #id-card-preview { position: absolute; left: 0; top: 0; }
                          }
                        `}
                      </style>
                      <div id="id-card-preview" className="w-[300px] bg-white border border-gray-250 rounded-2xl overflow-hidden shadow-lg select-none">
                        {/* ID Card Top Header */}
                        <div className="bg-[#025644] p-4 text-white text-center border-b border-yellow-500/30">
                          <h4 className="font-black text-[11px] uppercase tracking-wider">Students Care Model School</h4>
                          <p className="text-[8px] font-bold text-emerald-200 tracking-widest uppercase mt-0.5">Academic Identity Card</p>
                        </div>

                        {/* ID Card Core Body */}
                        <div className="p-5 text-center flex flex-col items-center space-y-3.5">
                          <div className="h-24 w-24 bg-emerald-50 text-[#025644] rounded-full flex items-center justify-center border-2 border-[#025644]/20 shadow-inner overflow-hidden">
                            {idCardData.photo ? <img src={idCardData.photo} alt="Student" className="h-full w-full object-cover" /> : <User className="h-14 w-14" />}
                          </div>

                          <div className="space-y-1">
                            <h3 className="font-extrabold text-base text-gray-900 leading-tight">{idCardData.name || 'Student Name'}</h3>
                            <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">{idCardData.class || 'Class'} Scholar</p>
                            <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Session: {idCardData.session}</p>
                          </div>

                          <div className="w-full bg-gray-50 border border-gray-150 rounded-xl p-3 text-xs text-left text-gray-600 font-bold space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Class Roll:</span>
                              <span className="font-mono text-gray-800 font-black">{idCardData.roll}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Blood Group:</span>
                              <span className="text-red-600 font-black">{idCardData.bloodGroup}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Guardian:</span>
                              <span className="font-mono text-gray-800 text-[11px]">{idCardData.guardianPhone}</span>
                            </div>
                          </div>
                          <div className="w-full flex justify-between items-end mt-2">
                             <Barcode className="h-10 w-24" />
                             <div className="text-center">
                                <div className="w-20 h-8 border-b-2 border-gray-800"></div>
                                <p className="text-[8px] font-bold text-gray-600">Principal Signature</p>
                             </div>
                          </div>

                          {/* Styled barcode lines */}
                          <div className="w-full flex justify-center gap-0.5 items-center h-6 opacity-60">
                            {[1,3,1,1,4,1,2,3,1,3,2,1,4,1,2].map((w, idx) => (
                              <span key={idx} className="bg-black h-full" style={{ width: `${w}px` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mt-4">Standard size: 85.6mm x 54mm (CR-80 size layout)</p>
                    </div>
                    {/* Hidden Bulk Print Container */}
                    <div ref={bulkPrintRef} className="hidden print:block">
                      {students.filter(s => s.class === idCardFilterClass && s.section === idCardFilterSection).map(s => (
                        <div key={s.id} className="page-break-after-always w-[300px] bg-white border border-gray-250 rounded-2xl overflow-hidden shadow-lg select-none p-5 text-center flex flex-col items-center space-y-3.5 mb-10">
                          <div className="bg-[#025644] p-4 text-white text-center border-b border-yellow-500/30 w-full mb-3">
                            <h4 className="font-black text-[11px] uppercase tracking-wider">Students Care Model School</h4>
                          </div>
                          <div className="h-24 w-24 bg-emerald-50 text-[#025644] rounded-full flex items-center justify-center border-2 border-[#025644]/20 shadow-inner overflow-hidden">
                            <User className="h-14 w-14" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-base text-gray-900 leading-tight">{s.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">{s.class} Scholar</p>
                            <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Session: {idCardData.session}</p>
                          </div>
                          <div className="w-full bg-gray-50 border border-gray-150 rounded-xl p-3 text-xs text-left text-gray-600 font-bold space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Roll:</span>
                              <span className="font-mono text-gray-800 font-black">{s.roll}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Blood Group:</span>
                              <span className="text-red-600 font-black">N/A</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Guardian:</span>
                              <span className="font-mono text-gray-800 text-[11px]">{s.guardianPhone}</span>
                            </div>
                          </div>
                          <div className="w-full flex justify-between items-end mt-2">
                             <Barcode className="h-10 w-24" />
                             <div className="text-center">
                                <div className="w-20 h-8 border-b-2 border-gray-800"></div>
                                <p className="text-[8px] font-bold text-gray-600">Principal Signature</p>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {cardSubTab === 'admit_card' && (
                   <div className="space-y-4">
                      {/* Filter Controls */}
                      <div className="bg-white border border-gray-150 rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-2xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">Academic Year</label>
                          <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold w-36">
                            <option>2026</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">Exam</label>
                          <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold w-44">
                            <option>Annual Examination</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">Class</label>
                          <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold w-32">
                            <option>Class 3</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">Section</label>
                          <select className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold w-24">
                            <option>A</option>
                          </select>
                        </div>
                        <button onClick={() => window.print()} className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800">
                          <Filter className="h-4 w-4" />
                        </button>
                        <button onClick={() => window.print()} className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 text-xs font-bold">
                          Print All
                        </button>
                      </div>

                      <style>
                        {`
                          @media print {
                            body * { visibility: hidden; }
                            #all-admit-cards-print, #all-admit-cards-print * { visibility: visible; }
                            #all-admit-cards-print { position: absolute; left: 0; top: 0; }
                            .page-break-after-always { page-break-after: always; }
                          }
                        `}
                      </style>

                      <div className="hidden print:block" id="all-admit-cards-print">
                        {students.map(s => (
                          <div key={s.id} className="page-break-after-always">
                            <AdmitCardModal 
                              student={{
                                  name: s.name,
                                  id: s.id,
                                  classSection: `${s.class} (${s.section})`,
                                  roll: s.roll,
                                  guardian: s.guardianName,
                                  contact: s.guardianPhone
                              }}
                              onClose={() => {}}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
                        <h3 className="font-extrabold text-gray-900 text-base">Admit Card Management</h3>
                        <p className="text-xs text-gray-400 font-bold">Select a student to preview and print admit card.</p>
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-gray-200">
                               <th className="p-2">Name</th>
                               <th className="p-2">Roll</th>
                               <th className="p-2">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {students.slice(0,5).map(s => (
                              <tr key={s.id}>
                                 <td className="p-2 font-bold">{s.name}</td>
                                 <td className="p-2 font-mono">{s.roll}</td>
                                 <td className="p-2">
                                    <button onClick={() => setShowAdmitCardFor(s)} className="text-emerald-700 font-black underline cursor-pointer">Preview</button>
                                 </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   </div>
                )}
                {showAdmitCardFor && (
                  <AdmitCardModal 
                    student={{
                        name: showAdmitCardFor.name,
                        id: showAdmitCardFor.id,
                        classSection: `${showAdmitCardFor.class} (${showAdmitCardFor.section})`,
                        roll: showAdmitCardFor.roll,
                        guardian: showAdmitCardFor.guardianName,
                        contact: showAdmitCardFor.guardianPhone
                    }}
                    onClose={() => setShowAdmitCardFor(null)}
                  />
                )}
                {cardSubTab === 'id_card_customize' && (
                  <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
                    <h3 className="font-bold text-gray-900">ID Card Customize</h3>
                    <p className="text-sm text-gray-500">Customize ID card templates here.</p>
                  </div>
                )}
                
                {cardSubTab === 'admit_card_customize' && <AdmitCardTemplate />}
                
                {cardSubTab === 'seat_plan' && (
                  <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
                    <h3 className="font-bold text-gray-900">Seat Plan</h3>
                    <p className="text-sm text-gray-500">View and generate seat plans here.</p>
                  </div>
                )}
                
                {cardSubTab === 'seat_plan_customize' && (
                  <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
                    <h3 className="font-bold text-gray-900">Seat Plan Customize</h3>
                    <p className="text-sm text-gray-500">Customize seat plan layouts here.</p>
                  </div>
                )}
                
                {cardSubTab === 'exam_controller_plan' && (
                  <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
                    <h3 className="font-bold text-gray-900">Exam Controller Plan</h3>
                    <p className="text-sm text-gray-500">Manage exam controller plans here.</p>
                  </div>
                )}
              </>
            )}


            {/* ACADEMIC CERTIFICATE PORTAL */}
            {adminActiveTab === 'certificate' && (
              <div className="space-y-6">
                {/* Sub-menu Navigation */}
                <div className="flex space-x-2 bg-white p-1 rounded-xl border border-gray-150 shadow-sm">
                  {certificateSubMenus.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setCertificateSubTab(sub.id)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                        certificateSubTab === sub.id
                          ? 'bg-[#025644] text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {sub.labelEn}
                    </button>
                  ))}
                </div>

                {certificateSubTab === 'generate' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                    <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">Certificate Generator</h3>
                        <p className="text-xs text-gray-400 font-bold">Configure and issue physical achievement credentials</p>
                      </div>
                      <div className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Student Name</label>
                          <input 
                            type="text" 
                            value={certificateData.studentName || ''} 
                            onChange={(e) => setCertificateData(prev => ({ ...prev, studentName: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Class Grade</label>
                          <input 
                            type="text" 
                            value={certificateData.className || ''} 
                            onChange={(e) => setCertificateData(prev => ({ ...prev, className: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Honor Description Reason</label>
                          <textarea 
                            rows={3}
                            value={certificateData.cause || ''} 
                            onChange={(e) => setCertificateData(prev => ({ ...prev, cause: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Certificate Template</label>
                          <select
                            value={certificateData.template || ''}
                            onChange={(e) => setCertificateData(prev => ({ ...prev, template: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold"
                          >
                            <option value="classic">Classic</option>
                            <option value="modern">Modern</option>
                            <option value="elegant">Elegant</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Select Saved Design</label>
                          <select
                            onChange={(e) => {
                                const design = savedDesigns.find(d => d.name === e.target.value);
                                if (design) setCertificateData(design.settings);
                            }}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold"
                          >
                            <option value="">Select a design...</option>
                            {savedDesigns.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2">
                           <input type="text" value={newDesignName} onChange={e => setNewDesignName(e.target.value)} placeholder="Design Name" className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                           <button onClick={() => { if(newDesignName) { setSavedDesigns([...savedDesigns, {name: newDesignName, settings: certificateData}]); setNewDesignName(''); } }} className="px-4 py-2 bg-[#025644] text-white font-black rounded-xl">Save</button>
                        </div>
                        <div className="space-y-1">
                          <label className="block font-bold text-gray-400">Background Image</label>
                          <input type="file" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setCertificateData(prev => ({ ...prev, backgroundImage: reader.result as string }));
                                reader.readAsDataURL(file);
                            }
                          }} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block font-bold text-gray-400">Font Size (px)</label>
                                <input type="number" value={certificateData.fontSize || 0} onChange={(e) => setCertificateData(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 0 }))} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="block font-bold text-gray-400">Font Color</label>
                                <input type="color" value={certificateData.fontColor || '#000000'} onChange={(e) => setCertificateData(prev => ({ ...prev, fontColor: e.target.value }))} className="w-full h-12 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644]" />
                            </div>
                        </div>
                        <button onClick={() => {
                          setAdminSuccessMsg("Academic certificate document rendered and ready to print!");
                          addAuditLog(`Admin generated certificate of excellence for: "${certificateData.studentName}".`);
                          setTimeout(() => setAdminSuccessMsg(''), 4000);
                        }} className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white font-black rounded-xl shadow-sm cursor-pointer transition-all">
                          Generate & Print
                        </button>
                      </div>
                    </div>

                    {/* Certificate Frame Layout */}
                    <div className="lg:col-span-8 flex flex-col items-center justify-center bg-gray-100/50 border border-gray-200 rounded-2xl p-6 shadow-inner min-h-[400px]">
                      {certificateData.template === 'classic' && (
                        <div className="w-full max-w-[550px] bg-amber-50/20 border-8 border-double border-amber-600/60 p-6 sm:p-8 rounded-lg shadow-xl text-center space-y-6 relative select-none bg-white" style={{ backgroundImage: certificateData.backgroundImage ? `url(${certificateData.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: `${certificateData.fontSize}px`, color: certificateData.fontColor }}>
                          <div className="absolute inset-0 border border-amber-600/30 m-1 pointer-events-none" />
                          <div className="space-y-1.5">
                            <h4 className="font-serif italic font-extrabold text-amber-800 text-lg sm:text-xl">Certificate of Appreciation</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Students Care Model School, Chattogram</p>
                          </div>
                          <p className="text-xs text-gray-400 italic">This academic award is proudly presented to</p>
                          <div className="space-y-1">
                            <h3 className="font-serif italic text-2xl sm:text-3xl text-amber-900 border-b-2 border-amber-600/30 w-fit mx-auto pb-1 px-4">{certificateData.studentName || 'Student Name'}</h3>
                            <p className="text-[10px] text-gray-500 font-bold mt-1">Scholar of {certificateData.className || 'Class'}</p>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto italic font-serif px-4">
                            "{certificateData.cause || 'Reason for certificate'}"
                          </p>
                          <div className="flex justify-between items-end pt-8 px-4 text-[10px] text-gray-400 font-bold">
                            <div className="text-center space-y-1"><p className="font-serif italic text-gray-700">{certificateData.principalName}</p><div className="border-t border-gray-200 w-24 pt-1">Principal Signature</div></div>
                            <div className="h-10 w-10 bg-amber-600/10 rounded-full flex items-center justify-center border-2 border-amber-600/30"><Award className="h-5 w-5 text-amber-700" /></div>
                            <div className="text-center space-y-1"><p className="font-serif italic text-gray-700">{certificateData.issueDate}</p><div className="border-t border-gray-200 w-24 pt-1">Date of Issue</div></div>
                          </div>
                        </div>
                      )}
                      
                      {certificateData.template === 'modern' && (
                        <div className="w-full max-w-[550px] bg-gray-900 text-white p-8 sm:p-12 rounded-lg shadow-2xl text-center space-y-8 relative select-none border border-gray-700" style={{ backgroundImage: certificateData.backgroundImage ? `url(${certificateData.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: `${certificateData.fontSize}px`, color: certificateData.fontColor }}>
                          <div className="space-y-1">
                             <h4 className="font-black text-xl uppercase tracking-[0.2em] text-emerald-400">Certificate</h4>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Students Care Model School</p>
                          </div>
                          <div className="space-y-4">
                             <p className="text-xs text-gray-400">Awarded to</p>
                             <h3 className="font-bold text-3xl text-white border-y border-emerald-900/50 py-4">{certificateData.studentName || 'Student Name'}</h3>
                             <p className="text-xs text-emerald-500 font-bold">{certificateData.className || 'Class'}</p>
                          </div>
                          <p className="text-xs text-gray-300 italic">"{certificateData.cause || 'Reason for certificate'}"</p>
                          <div className="flex justify-between items-center pt-8 border-t border-gray-800">
                             <div className="text-left text-[9px] text-gray-500">Principal: {certificateData.principalName}</div>
                             <div className="text-right text-[9px] text-gray-500">Date: {certificateData.issueDate}</div>
                          </div>
                        </div>
                      )}

                      {certificateData.template === 'elegant' && (
                        <div className="w-full max-w-[550px] bg-white p-8 sm:p-12 rounded-lg shadow-2xl text-center space-y-8 relative select-none border-t-8 border-emerald-800" style={{ backgroundImage: certificateData.backgroundImage ? `url(${certificateData.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', fontSize: `${certificateData.fontSize}px`, color: certificateData.fontColor }}>
                          <div className="absolute top-2 left-2 w-10 h-10 border-l-2 border-t-2 border-emerald-800"></div>
                          <div className="absolute top-2 right-2 w-10 h-10 border-r-2 border-t-2 border-emerald-800"></div>
                          <div className="absolute bottom-2 left-2 w-10 h-10 border-l-2 border-b-2 border-emerald-800"></div>
                          <div className="absolute bottom-2 right-2 w-10 h-10 border-r-2 border-b-2 border-emerald-800"></div>
                          <h4 className="font-serif font-extrabold text-2xl text-emerald-900 uppercase">Certificate of Excellence</h4>
                          <div className="space-y-2">
                             <p className="text-sm text-gray-600">This is to certify that</p>
                             <h3 className="font-bold text-3xl text-emerald-950 font-serif italic">{certificateData.studentName || 'Student Name'}</h3>
                             <p className="text-xs text-gray-500">of {certificateData.className || 'Class'}</p>
                          </div>
                          <p className="text-xs text-gray-700 italic border-l-4 border-emerald-200 pl-4 text-left">"{certificateData.cause || 'Reason for certificate'}"</p>
                          <div className="flex justify-around items-end pt-12 text-[10px] text-gray-500">
                             <div className="text-center">{certificateData.principalName}<div className="border-t border-gray-300 w-32 mt-1 pt-1">Principal</div></div>
                             <div className="text-center">{certificateData.issueDate}<div className="border-t border-gray-300 w-32 mt-1 pt-1">Date</div></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {certificateSubTab === 'excellence' && (
                  <CertificateOfExcellence />
                )}

                {certificateSubTab === 'customize' && (
                  <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
                    <h3 className="font-bold text-gray-900">Certificate Customize</h3>
                    <p className="text-sm text-gray-500">Customize certificate templates here.</p>
                  </div>
                )}

                {certificateSubTab === 'pottoyon' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
                    {/* Form Panel */}
                    <div className="lg:col-span-4 space-y-4">
                        <h3 className="font-bold text-gray-900 mb-4">‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡ßü‡¶®‡¶™‡¶§‡ßç‡¶∞ (Pottoyon Potro)</h3>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Student Name</label>
                            <input type="text" value={certificateData.studentName || ''} onChange={(e) => setCertificateData(prev => ({...prev, studentName: e.target.value}))} className="w-full p-2 border rounded" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Father Name</label>
                            <input type="text" value={certificateData.fatherName || ''} onChange={(e) => setCertificateData(prev => ({...prev, fatherName: e.target.value}))} className="w-full p-2 border rounded" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Mother Name</label>
                            <input type="text" value={certificateData.motherName || ''} onChange={(e) => setCertificateData(prev => ({...prev, motherName: e.target.value}))} className="w-full p-2 border rounded" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Class</label>
                            <input type="text" value={certificateData.classGrade || ''} onChange={(e) => setCertificateData(prev => ({...prev, classGrade: e.target.value}))} className="w-full p-2 border rounded" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Roll</label>
                            <input type="text" value={certificateData.roll || ''} onChange={(e) => setCertificateData(prev => ({...prev, roll: e.target.value}))} className="w-full p-2 border rounded" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Date of Birth</label>
                            <input type="text" value={certificateData.dateOfBirth || ''} onChange={(e) => setCertificateData(prev => ({...prev, dateOfBirth: e.target.value}))} className="w-full p-2 border rounded" />
                        </div>
                         <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Ref No.</label>
                            <input type="text" value={certificateData.refNo || ''} onChange={(e) => setCertificateData(prev => ({...prev, refNo: e.target.value}))} className="w-full p-2 border rounded" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Custom Body</label>
                            <textarea value={certificateData.customBody || ''} onChange={(e) => setCertificateData(prev => ({...prev, customBody: e.target.value}))} className="w-full p-2 border rounded" rows={5} />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Background Image</label>
                            <input type="file" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setCertificateData(prev => ({ ...prev, backgroundImage: reader.result as string }));
                                    reader.readAsDataURL(file);
                                }
                            }} className="w-full p-2 border rounded" />
                        </div>
                        <button onClick={() => window.print()} className="w-full py-2 bg-blue-600 text-white rounded font-bold">Print Certificate</button>
                    </div>
                    {/* Preview Panel */}
                    <div className="lg:col-span-8">
                        <div className="relative w-full max-w-[600px] aspect-[1/1.4] mx-auto border" style={{ backgroundImage: `url('${certificateData.backgroundImage || '/testimonial-bg-CUH7xwLC.jpeg'}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            {/* Absolute positioned elements */}
                            
                            {/* Body */}
                            <div className="absolute top-[250px] left-[50px] right-[50px] text-lg leading-relaxed text-center">
                                <p className="font-bold text-xl mb-4">‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡ßü‡¶®‡¶™‡¶§‡ßç‡¶∞</p>
                                <p className="text-left whitespace-pre-line">
                                    {certificateData.customBody
                                        .replace(/\[‡¶®‡¶æ‡¶Æ\]/g, certificateData.studentName || '[‡¶®‡¶æ‡¶Æ]')
                                        .replace(/\[‡¶¨‡¶æ‡¶¨‡¶æ\]/g, certificateData.fatherName || '[‡¶¨‡¶æ‡¶¨‡¶æ]')
                                        .replace(/\[‡¶Æ‡¶æ\]/g, certificateData.motherName || '[‡¶Æ‡¶æ]')
                                        .replace(/\[‡¶∂‡ßç‡¶∞‡ßá‡¶£‡¶ø\]/g, certificateData.classGrade || '[‡¶∂‡ßç‡¶∞‡ßá‡¶£‡¶ø]')
                                        .replace(/\[‡¶∞‡ßã‡¶≤\]/g, certificateData.roll || '[‡¶∞‡ßã‡¶≤]')
                                        .replace(/\[‡¶ú‡¶®‡ßç‡¶Æ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ\]/g, certificateData.dateOfBirth || '[‡¶ú‡¶®‡ßç‡¶Æ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ]')
                                    }
                                </p>
                            </div>
                            
                            {/* Signature */}
                            <div className="absolute bottom-[50px] right-[50px] text-center">
                                <div className="border-t border-black w-40 pt-1">‡¶™‡ßç‡¶∞‡¶ß‡¶æ‡¶® ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï</div>
                            </div>
                        </div>
                    </div>
                  </div>
                )}

                {certificateSubTab === 'testimonial' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
                    {/* Left: Input Form */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400">Student Name</label>
                        <input type="text" value={testimonialData.studentName} onChange={(e) => setTestimonialData(prev => ({...prev, studentName: e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400">Father Name</label>
                        <input type="text" value={testimonialData.fatherName} onChange={(e) => setTestimonialData(prev => ({...prev, fatherName: e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400">Mother Name</label>
                        <input type="text" value={testimonialData.motherName} onChange={(e) => setTestimonialData(prev => ({...prev, motherName: e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Roll No</label>
                            <input type="text" value={testimonialData.roll} onChange={(e) => setTestimonialData(prev => ({...prev, roll: e.target.value}))} className="w-full p-2 border rounded" />
                         </div>
                         <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Registration No</label>
                            <input type="text" value={testimonialData.regNo} onChange={(e) => setTestimonialData(prev => ({...prev, regNo: e.target.value}))} className="w-full p-2 border rounded" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Session</label>
                            <input type="text" value={testimonialData.session} onChange={(e) => setTestimonialData(prev => ({...prev, session: e.target.value}))} className="w-full p-2 border rounded" />
                         </div>
                         <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400">Class/Exam</label>
                            <input type="text" value={testimonialData.classExam} onChange={(e) => setTestimonialData(prev => ({...prev, classExam: e.target.value}))} className="w-full p-2 border rounded" />
                         </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400">GPA/Result</label>
                        <input type="text" value={testimonialData.gpa} onChange={(e) => setTestimonialData(prev => ({...prev, gpa: e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400">Character Description</label>
                        <textarea value={testimonialData.description} onChange={(e) => setTestimonialData(prev => ({...prev, description: e.target.value}))} className="w-full p-2 border rounded" rows={5} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="block text-xs font-bold text-gray-400">Font Size (px)</label>
                              <input type="number" value={testimonialData.fontSize} onChange={(e) => setTestimonialData(prev => ({...prev, fontSize: parseInt(e.target.value) || 14}))} className="w-full p-2 border rounded" />
                          </div>
                          <div className="space-y-1">
                              <label className="block text-xs font-bold text-gray-400">Font Color</label>
                              <input type="color" value={testimonialData.fontColor} onChange={(e) => setTestimonialData(prev => ({...prev, fontColor: e.target.value}))} className="w-full p-2 border rounded h-10" />
                          </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400">Background Image</label>
                        <input type="file" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setTestimonialData(prev => ({ ...prev, backgroundImage: reader.result as string }));
                                reader.readAsDataURL(file);
                            }
                        }} className="w-full p-2 border rounded" />
                      </div>
                      <button onClick={() => window.print()} className="w-full py-2 bg-blue-600 text-white rounded font-bold">Generate & Print</button>
                    </div>

                    {/* Right: Preview */}
                    <div className="lg:col-span-8 p-4 bg-white border rounded-lg relative" style={{fontSize: testimonialData.fontSize + 'px', color: testimonialData.fontColor, backgroundImage: testimonialData.backgroundImage ? `url(${testimonialData.backgroundImage})` : 'none', backgroundSize: 'cover', minHeight: '600px'}}>
                        <div className="text-center">
                            <h1 className="font-bold text-3xl underline">TESTIMONIAL</h1>
                            <p className="mt-4 text-justify">
                                This is to certify that <span className="font-bold">{testimonialData.studentName}</span>, son/daughter of <span className="font-bold">{testimonialData.fatherName}</span> and <span className="font-bold">{testimonialData.motherName}</span>, Roll No: <span className="font-bold">{testimonialData.roll}</span>, Registration No: <span className="font-bold">{testimonialData.regNo}</span>, Session: <span className="font-bold">{testimonialData.session}</span>, Class/Exam: <span className="font-bold">{testimonialData.classExam}</span> has secured GPA <span className="font-bold">{testimonialData.gpa}</span>.
                            </p>
                            <p className="mt-4 text-justify">
                                {testimonialData.description}
                            </p>
                        </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ACADEMIC TIMETABLES & MULTI-OPTION HUB */}
            {adminActiveTab === 'academic' && (() => {
              const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
              const PERIODS = [
                { id: 'Period 1', name: 'Period 1', time: '08:00 AM - 08:45 AM' },
                { id: 'Period 2', name: 'Period 2', time: '08:45 AM - 09:30 AM' },
                { id: 'Period 3', name: 'Period 3', time: '09:30 AM - 10:15 AM' },
                { id: 'Period 4', name: 'Period 4', time: '10:30 AM - 11:15 AM' },
                { id: 'Period 5', name: 'Period 5', time: '11:15 AM - 12:00 PM' },
                { id: 'Period 6', name: 'Period 6', time: '12:00 PM - 12:45 PM' }
              ];

              const availableSubjects = [
                'Subject', 'Physics', 'Chemistry', 'Higher Math', 'Biology', 'English', 'Bengali', 'ICT', 'General Math', 'Social Studies', 'Religion', 'Arts & Craft', 'Science'
              ];

              const availableTeachers = [
                'Teacher', 'Mr. Abdul Hye', 'Dr. Farhana Rahman', 'Mr. Rafiqul Islam', 'Mrs. Tasnim Jahan', 'Mrs. Shamima Sultana', 'Mr. M. A. Hasan', 'Mr. Imran Hosen'
              ];

              // Check conflicts across different classes
              const checkConflict = (day: string, periodId: string, currentTeacher: string, currentRoom: string) => {
                if (!currentTeacher && !currentRoom) return null;
                if (currentTeacher === 'Teacher' && currentRoom.trim() === '') return null;

                for (const classId of Object.keys(schedules)) {
                  if (classId === classScheduleActiveClass) continue;
                  const otherCell = schedules[classId][`${day}-${periodId}`];
                  if (otherCell && !otherCell.isBreak) {
                    if (currentTeacher && currentTeacher !== 'Teacher' && otherCell.teacher === currentTeacher) {
                      return { type: 'Teacher Conflict', message: `${currentTeacher} is already teaching ${classId} during this period.` };
                    }
                    if (currentRoom && currentRoom.trim() !== '' && otherCell.room && otherCell.room.trim().toLowerCase() === currentRoom.trim().toLowerCase()) {
                      return { type: 'Room Conflict', message: `Room ${currentRoom} is already occupied by ${classId} during this period.` };
                    }
                  }
                }
                return null;
              };

              // Drag and drop handlers
              const handleDragStart = (day: string, periodId: string) => {
                setDraggedCell({ day, period: periodId });
              };

              const handleDrop = (day: string, periodId: string) => {
                if (!draggedCell) return;
                const sourceKey = `${draggedCell.day}-${draggedCell.period}`;
                const targetKey = `${day}-${periodId}`;

                setSchedules(prev => {
                  const classScheds = prev[classScheduleActiveClass] || {};
                  const sourceData = classScheds[sourceKey] || { subject: '', teacher: '', room: '', isBreak: false };
                  const targetData = classScheds[targetKey] || { subject: '', teacher: '', room: '', isBreak: false };

                  return {
                    ...prev,
                    [classScheduleActiveClass]: {
                      ...classScheds,
                      [sourceKey]: targetData,
                      [targetKey]: sourceData
                    }
                  };
                });
                setDraggedCell(null);
                setAdminSuccessMsg("Classes successfully swapped/moved!");
                setTimeout(() => setAdminSuccessMsg(''), 3500);
              };

              // Copy schedule handler
              const handleCopySchedule = () => {
                if (!classScheduleCopyTarget) {
                  setAdminErrorMsg("Please select a target class to copy the schedule to!");
                  setTimeout(() => setAdminErrorMsg(''), 3500);
                  return;
                }
                if (classScheduleCopyTarget === classScheduleActiveClass) {
                  setAdminErrorMsg("Source and target classes must be different!");
                  setTimeout(() => setAdminErrorMsg(''), 3500);
                  return;
                }

                const sourceSchedule = schedules[classScheduleActiveClass] || {};
                setSchedules(prev => ({
                  ...prev,
                  [classScheduleCopyTarget]: { ...sourceSchedule }
                }));
                setAdminSuccessMsg(`Successfully copied schedule from ${classScheduleActiveClass} to ${classScheduleCopyTarget}!`);
                setTimeout(() => setAdminSuccessMsg(''), 4000);
              };

              return (
                <div className="space-y-6">
                  {/* Dynamic Alert messages */}
                  <AnimatePresence>
                    {adminSuccessMsg && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{adminSuccessMsg}</span>
                      </motion.div>
                    )}
                    {adminErrorMsg && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-black flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>{adminErrorMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* =================================================== */}
                  {/* SUB-TAB 1: CLASS & SECTION                          */}
                  {/* =================================================== */}
                  {academicSubTab === 'class_section' && (() => {
                    // Common default section presets
                    const commonSections = ['A', 'B', 'C', 'D', 'E'];

                    // Filtered list
                    const filteredClassSections = classSectionsList.filter(item => {
                      return !classSearchQuery.trim() || 
                        item.className.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
                        item.numericName.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
                        item.sections.some(sec => sec.toLowerCase().includes(classSearchQuery.toLowerCase()));
                    });

                    // Handle Form Submission
                    const handleSaveClassSection = (e: React.FormEvent) => {
                      e.preventDefault();

                      if (!csFormClassName.trim()) {
                        alert(lang === 'bn' ? '‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®!' : 'Please enter a Class Name!');
                        return;
                      }

                      if (!csFormNumericName.trim()) {
                        alert(lang === 'bn' ? '‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶®‡¶ø‡¶â‡¶Æ‡ßá‡¶∞‡¶ø‡¶ï ‡¶®‡¶æ‡¶Æ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®!' : 'Please enter a Numeric Name!');
                        return;
                      }

                      if (csFormSections.length === 0) {
                        alert(lang === 'bn' ? '‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ö‡¶®‡ßç‡¶§‡¶§ ‡¶è‡¶ï‡¶ü‡¶ø ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶¨‡¶æ ‡¶ü‡¶æ‡¶á‡¶™ ‡¶ï‡¶∞‡ßÅ‡¶®!' : 'Please select or add at least one section!');
                        return;
                      }

                      if (editingCsId) {
                        // Update
                        setClassSectionsList(prev => prev.map(item => item.id === editingCsId ? {
                          ...item,
                          className: csFormClassName.trim(),
                          numericName: csFormNumericName.trim(),
                          sections: [...csFormSections]
                        } : item));
                        addAuditLog(`Updated class and section details for ${csFormClassName}`);
                        setAdminSuccessMsg(lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶ì ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£‡ßÄ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Class and Section details updated successfully!');
                        setEditingCsId(null);
                      } else {
                        // Check for duplicate
                        const isDuplicate = classSectionsList.some(item => 
                          item.className.toLowerCase() === csFormClassName.trim().toLowerCase()
                        );
                        if (isDuplicate) {
                          alert(lang === 'bn' ? '‡¶è‡¶á ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ ‡¶á‡¶§‡¶ø‡¶Æ‡¶ß‡ßç‡¶Ø‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶ø‡¶§ ‡¶Ü‡¶õ‡ßá!' : 'This Class Name already exists!');
                          return;
                        }

                        // Create
                        const newId = `CS-${Date.now()}`;
                        const newItem = {
                          id: newId,
                          className: csFormClassName.trim(),
                          numericName: csFormNumericName.trim(),
                          sections: [...csFormSections]
                        };
                        setClassSectionsList(prev => [...prev, newItem]);
                        addAuditLog(`Created class and section: ${csFormClassName}`);
                        setAdminSuccessMsg(lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶ì ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£ ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'New Class and Section saved successfully!');
                      }

                      // Reset form
                      setCsFormClassName('Class 9');
                      setCsFormNumericName('9');
                      setCsFormSections(['A', 'B']);
                      setCustomSectionInput('');

                      setTimeout(() => {
                        setAdminSuccessMsg('');
                      }, 4000);
                    };

                    const handleEditClassSection = (item: typeof classSectionsList[0]) => {
                      setEditingCsId(item.id);
                      setCsFormClassName(item.className);
                      setCsFormNumericName(item.numericName);
                      setCsFormSections([...item.sections]);
                    };

                    const handleDeleteClassSection = (id: string, className: string) => {
                      if (confirm(lang === 'bn' 
                        ? `‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§‡¶≠‡¶æ‡¶¨‡ßá "${className}" ‡¶è‡¶¨‡¶Ç ‡¶è‡¶∞ ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£‡ßÄ ‡¶°‡¶ø‡¶≤‡¶ø‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶ö‡¶æ‡¶®?` 
                        : `Are you sure you want to delete "${className}" and its section mapping?`
                      )) {
                        setClassSectionsList(prev => prev.filter(item => item.id !== id));
                        addAuditLog(`Deleted class and section mapping for ${className}`);
                        setAdminSuccessMsg(lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶ì ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£‡ßÄ ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!' : 'Class and Section mapping deleted!');
                        
                        if (editingCsId === id) {
                          setEditingCsId(null);
                          setCsFormClassName('Class 9');
                          setCsFormNumericName('9');
                          setCsFormSections(['A', 'B']);
                        }

                        setTimeout(() => {
                          setAdminSuccessMsg('');
                        }, 4000);
                      }
                    };

                    const handleToggleCheckboxSection = (sec: string) => {
                      if (csFormSections.includes(sec)) {
                        setCsFormSections(prev => prev.filter(s => s !== sec));
                      } else {
                        setCsFormSections(prev => [...prev, sec]);
                      }
                    };

                    const handleAddCustomSection = () => {
                      const trimmed = customSectionInput.trim();
                      if (!trimmed) return;
                      
                      // Avoid duplicates
                      if (csFormSections.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
                        setCustomSectionInput('');
                        return;
                      }

                      setCsFormSections(prev => [...prev, trimmed]);
                      setCustomSectionInput('');
                    };

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in">
                        
                        {/* Left Side: Create / Add Class & Section Form */}
                        <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-5">
                          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="p-2.5 bg-emerald-50 text-[#025644] rounded-xl">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-extrabold text-gray-950 text-base">
                                {editingCsId 
                                  ? (lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶ì ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶∏‡¶Ç‡¶∂‡ßã‡¶ß‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Edit Class & Section') 
                                  : (lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶ì ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Add Class & Section')}
                              </h3>
                              <p className="text-xs text-gray-400 font-bold">
                                {lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ ‡¶è‡¶¨‡¶Ç ‡¶§‡¶æ‡¶∞ ‡¶Ö‡¶ß‡ßÄ‡¶®‡ßá ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶®‡¶ø‡¶∞‡ßç‡¶ß‡¶æ‡¶∞‡¶£ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Define new class level and set up assigned sections'}
                              </p>
                            </div>
                          </div>

                          <form onSubmit={handleSaveClassSection} className="space-y-4">
                            
                            {/* Class Name Input */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider">
                                {lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ (Class Name)' : 'Class Name'} <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={csFormClassName}
                                onChange={(e) => setCsFormClassName(e.target.value)}
                                placeholder="e.g., Class 9, Class 10"
                                className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 focus:bg-white text-gray-800 rounded-xl font-bold text-xs outline-none focus:border-[#025644] transition-all"
                              />
                            </div>

                            {/* Numeric Name Input */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider">
                                {lang === 'bn' ? '‡¶®‡¶ø‡¶â‡¶Æ‡ßá‡¶∞‡¶ø‡¶ï ‡¶®‡¶æ‡¶Æ (Numeric Name)' : 'Numeric Name'} <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={csFormNumericName}
                                onChange={(e) => setCsFormNumericName(e.target.value)}
                                placeholder="e.g., 9, 10"
                                className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 focus:bg-white text-gray-800 rounded-xl font-bold text-xs outline-none focus:border-[#025644] transition-all"
                              />
                            </div>

                            {/* Multiple Sections Selection & Input */}
                            <div className="space-y-3.5 border-t border-dashed border-gray-150 pt-4">
                              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider">
                                {lang === 'bn' ? '‡¶∏‡ßá‡¶ï‡¶∂‡¶®‡¶∏‡¶Æ‡ßÇ‡¶π (Sections)' : 'Sections Selection'} <span className="text-rose-500">*</span>
                              </label>

                              {/* Standard Checkbox Selection */}
                              <div className="space-y-2">
                                <span className="text-[10px] text-gray-400 font-bold block">
                                  {lang === 'bn' ? '‡¶∏‡¶æ‡¶ß‡¶æ‡¶∞‡¶£ ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶®‡¶ø‡¶∞‡ßç‡¶¨‡¶æ‡¶ö‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®:' : 'Select common sections:'}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {commonSections.map((sec) => {
                                    const isChecked = csFormSections.includes(sec);
                                    return (
                                      <label
                                        key={sec}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                                          isChecked
                                            ? 'bg-emerald-50 text-[#025644] border-emerald-300'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleToggleCheckboxSection(sec)}
                                          className="w-3.5 h-3.5 text-[#025644] focus:ring-[#025644] border-gray-300 rounded cursor-pointer"
                                        />
                                        <span>{sec}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Tag / Custom Section Text Input */}
                              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">
                                  {lang === 'bn' ? '‡¶Ö‡¶®‡ßç‡¶Ø‡¶æ‡¶®‡ßç‡¶Ø ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®:' : 'Add other custom section / group:'}
                                </span>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={customSectionInput}
                                    onChange={(e) => setCustomSectionInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomSection();
                                      }
                                    }}
                                    placeholder={lang === 'bn' ? '‡¶Ø‡ßá‡¶Æ‡¶®: Science, Commerce' : 'e.g., Pink, Blue, Science'}
                                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none font-semibold focus:border-[#025644] placeholder-gray-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddCustomSection}
                                    className="px-3 py-1.5 bg-[#025644] hover:bg-[#013f31] text-white text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                    {lang === 'bn' ? '‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Add'}
                                  </button>
                                </div>
                              </div>

                              {/* Selected Sections Active Chips */}
                              {csFormSections.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                    {lang === 'bn' ? '‡¶®‡¶ø‡¶∞‡ßç‡¶¨‡¶æ‡¶ö‡¶ø‡¶§ ‡¶∏‡ßá‡¶ï‡¶∂‡¶®‡¶∏‡¶Æ‡ßÇ‡¶π:' : 'Currently Selected:'}
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {csFormSections.map((sec) => (
                                      <span
                                        key={sec}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-[#025644] border border-emerald-100 rounded-full text-xs font-bold"
                                      >
                                        <span>{sec}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleCheckboxSection(sec)}
                                          className="text-emerald-700 hover:text-rose-600 rounded-full p-0.5 hover:bg-emerald-100 transition-colors"
                                          title={lang === 'bn' ? '‡¶¨‡¶æ‡¶¶ ‡¶¶‡¶ø‡¶®' : 'Remove Section'}
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Submit Actions Button */}
                            <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100">
                              <button
                                type="submit"
                                className="flex-1 py-3 bg-[#025644] hover:bg-[#01352a] text-white font-black text-xs rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:translate-y-[-0.5px]"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                {editingCsId 
                                  ? (lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Update Class') 
                                  : (lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Save Class')}
                              </button>

                              {/* Reset / Cancel Button */}
                              {(editingCsId || csFormClassName !== 'Class 9' || csFormNumericName !== '9' || csFormSections.length !== 2) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCsId(null);
                                    setCsFormClassName('Class 9');
                                    setCsFormNumericName('9');
                                    setCsFormSections(['A', 'B']);
                                    setCustomSectionInput('');
                                  }}
                                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                  {lang === 'bn' ? '‡¶∞‡¶ø‡¶∏‡ßá‡¶ü' : 'Reset'}
                                </button>
                              )}
                            </div>
                          </form>
                        </div>

                        {/* Right Side: Class & Section List Table */}
                        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
                          
                          {/* Title & Search bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                            <div>
                              <h3 className="font-extrabold text-gray-950 text-base">
                                {lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶è‡¶¨‡¶Ç ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ' : 'Class & Section List'}
                              </h3>
                              <p className="text-xs text-gray-400 font-bold">
                                {lang === 'bn' ? '‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ‡ßá‡¶∞ ‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ ‡¶è‡¶¨‡¶Ç ‡¶®‡¶ø‡¶∞‡ßç‡¶ß‡¶æ‡¶∞‡¶ø‡¶§ ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶∏‡¶Æ‡ßÇ‡¶π‡ßá‡¶∞ ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£‡ßÄ' : 'Active classes and their mapped section divisions'}
                              </p>
                            </div>
                            
                            {/* Simple Quick Search */}
                            <div className="relative w-full sm:w-48">
                              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <input 
                                type="text"
                                value={classSearchQuery}
                                onChange={(e) => setClassSearchQuery(e.target.value)}
                                placeholder={lang === 'bn' ? '‡¶Ö‡¶®‡ßÅ‡¶∏‡¶®‡ßç‡¶ß‡¶æ‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®...' : 'Search class/sec...'}
                                className="w-full pl-8.5 pr-3 py-1.5 bg-gray-50 border border-gray-200 focus:bg-white text-gray-800 rounded-xl text-xs font-bold outline-none focus:border-[#025644] transition-all"
                              />
                              {classSearchQuery && (
                                <button
                                  onClick={() => setClassSearchQuery('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {filteredClassSections.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left text-gray-700 whitespace-nowrap">
                                <thead className="bg-slate-50 border-y border-gray-150 uppercase text-[10px] font-black text-gray-500 tracking-wider">
                                  <tr>
                                    <th className="py-3 px-3 text-center w-12">SL</th>
                                    <th className="py-3 px-4">{lang === 'bn' ? '‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ (Class Name)' : 'Class Name'}</th>
                                    <th className="py-3 px-4">{lang === 'bn' ? '‡¶®‡¶ø‡¶â‡¶Æ‡ßá‡¶∞‡¶ø‡¶ï ‡¶®‡¶æ‡¶Æ' : 'Numeric Name'}</th>
                                    <th className="py-3 px-4">{lang === 'bn' ? '‡¶®‡¶ø‡¶∞‡ßç‡¶ß‡¶æ‡¶∞‡¶ø‡¶§ ‡¶∏‡ßá‡¶ï‡¶∂‡¶® (Assigned Sections)' : 'Assigned Sections'}</th>
                                    <th className="py-3 px-4 text-center w-24">{lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶∂‡¶® (Action)' : 'Action'}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-150">
                                  {filteredClassSections.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                      
                                      {/* SL Column */}
                                      <td className="py-4 px-3 text-center font-mono font-black text-gray-400">
                                        {(index + 1).toString().padStart(2, '0')}
                                      </td>

                                      {/* Class Name */}
                                      <td className="py-4 px-4 font-extrabold text-gray-950">
                                        {item.className}
                                      </td>

                                      {/* Numeric Name */}
                                      <td className="py-4 px-4 font-mono font-black text-[#025644] text-center w-28">
                                        {item.numericName}
                                      </td>

                                      {/* Assigned Sections (Badges) */}
                                      <td className="py-xúÏ}Îo#IrÁwˇ9rªEÌàIëzYÍÅZ“Lk›/àöô]4”%VI,wë≈≠*∂ƒïÿ|˚¡0|ÄΩwÄm`ax›3∞˜v˚aoÏ•·ø‰"ÚQÔ™Ã,RjuØ
3->äôYôëëøàËêÒEΩ≥‡à‚µm⁄oHﬂ1|ˇ©1¥vNÎÇ‡?ısœì3c\o5∫ri÷∞·[˝¿vG~chåk5x∑L‡üCÛbâÏ< 5çˆ`ê˛ÿ≠üÚ⁄öÓ\≤.Øtõ{‰ÿ#´NÁÃØ˜≠Q`y8—ÌFóåßı&¸99´[CÀ3≥ﬁmí¿∫Í/˛∞ŸÓÆu:/…âÎôˆ'ºØ’lÆ¨7âÁNF¶e÷á&ˇY´5æxIN›QP?qsAkÏ:ÖŒ–ïﬁb¨‡jËÙ≥¥§ﬁ√ˆ
§j„€+Å˘‡oæ\˘Ÿe4Iæ∑¢:¢Ì¿åS¨vá≤[+F
≥≤[Ç¨˛t‚ˆÈTºElk±üß¬îòv@NÇ¿iL}ñ˙+-‚	¶cxjˆC=¬vG{é›ΩsY£d`åL«¬¡Ô·lˆò¥©·TjPí8÷Œ•cåŒ»ŒŒY<-íœ»‚ª∑ø{˜ˆóÔæ˝õwoˇÌ›€ˇ|˜ˆÌª∑ﬂ¡ÚÓÌOﬂΩ˝ıªoˇﬁ/í-≤Hßâ1€£≥EΩŒ„§ÖÇñ‹7ñ∑U*Mÿ-‚√÷j∑mº•àsFœ˘6NGΩÔ:ÆÁì˛ƒÛ]Ø>vmJÆ#‘'€˛õ≥¯#ùü`;"ß∂„Ï,å‹ëµ@¸¿s_√ó0(h|á∏@ﬁÿ÷˘C˜bg°Iö§›Åˇ¥àûˆ>6Ço˛1»Ïæ1ﬁY†Û≤˚ÙOaRmõ¡`g°Ω@ÃùÖ'≠È>Z3⁄§#i6Î‚M´æáøÉ¯€z˚MΩ;ÑµÎ¥:ıM¸ó◊jµÌBˇ}‹j—7≠Ó£Õ7u˙ë≥—Ën¨’Èø?^ +öSΩs≠ÛìÌ∆u Ú/˚ñc÷+"ÿ3B¢aõÀT6Bzùõ‹¯%ïˇ¯Ó€üÄ¨¯w¯ÛÓÌob‚ÇOËºÜÁ˙V(-¯õf\X–œ÷õÕ;Y1?Y±I÷ùzccmù ∑∑:Ì].Z≠µFkòøıhæny—Ç5€‹Ï¬ø›ç«]≤>ÏíŒõµaßæˇ¬∑ÕØ:Fã¥òËÅ˜0%±˜§ıfıIá¨Zk∑Rb\óˆ∑z*Õ™hö–÷âkNeÕ¡m∆âcïﬂ&}ﬁ%`¯r['≠ÇÜŸZãkó‘ÌæUü÷W•Tûn+nªåÅø@Júy∆4îÙM'&N'éì≤VL√X¶xG—n6.À‡¿‡)mf•€ºFñüõ∑Zè∫√Vá4CNFΩ`-‚kxÒ®{ãzAÙ5º•ø˛j3¶X‘€O∫–pÙΩ˛~’ç2XKÙŸ~≤é†©$ îò^âk∑ù¯j“UÙáÃLÖ◊ûÅ∂jå¨6ª*Dí∑}˛Ù›∑ç™ˆ∑MUmT¿Cﬂ¡˚_0¸wtW=¸∑p'˙ﬂΩ˚ˆgÏ˚_·{|˚}B∑›ß.°Z πO∏"‡”=ÿ2?ëÓ¡€+ÉétÇ∆ô˘πS|64.ÍÁ8m√ã∫1	\‚XÜ	J@›≥„¬2+Œÿ/Ë”ˇ2úáﬂ“Ÿ˘5’>–R˘‘Iﬁ¬l¸ùA|ˇ+˙´ˇ†∑ˇ:4iPa˘¥ïÔ¬o˛çﬁˇÎwoˇïuë^ëø•-˝eŒ¢¸RÙÙü¥…ˇbw}G_±Q}Àzy˜ˆ_V’ª˝9]≤Á0=æE&0∞Ä÷º!(yÙµcù&–∑2Pıàoº±»‘ùxTû)œÿí¿ºS]ãÙ›—©}6ÒÊöRX˜Ò¨@q¸∑ﬂó¥ºÙ«9_-’†Øú/Páﬂ—ø
4}l≠˜Â√˙ÒÓC“ﬁ¬óﬂ?ÿ;ÓëΩ›„›«œæ(z÷í÷Ê86£oò÷–Ó˜&'«∆	crÚß¿Óã‰˛˝Çù8Ωk¬.y> ” µR&nu£Õ≤}·¿Æ∫F¸Åa∫Áñs;%M±iØ≤t¶[÷ÕI≤?„ÿ∫#ø,ËÈdhn—◊û{éØ$x/|H'VpnY#ÍD*€0∑%Dº=XM8≠
e~ì+ŒôDíH1ˇóJåˇÚ‡ÁT8¸Ü~˙S&÷ˇ.%ø~G_ˇ´ê0(¥®‡Ë±E'{ @xÏÅ·∏Â¶à¯’“9PÔtb|†@:/√†ﬁ™<oc≤Û7lJB°.õ®Âú{ÿ¶˙œ	y˝-ΩﬂÒy˝-ˇ=ˆø˚©û®ﬁ∑NAì"~‡}ˆŸº˜Ÿº˚ÀÑs!|aZm|¯ÉRD≥O˘ÿÍ€ÜcˇîÕ!P2ÿ¢íı*Õ±åbáÈü€ÚÃæÁéÅáÀ›rﬂ≠‹YªÌ'ñìGI°ø?FSh¿SQƒ§…»≈3ô
$ïﬁ≤ˇùÆÎoËß?cÎ∫EWëOùõ-…Ù”')}Vﬂr`ÕKG˚∆p&÷Œ%'÷=ÌΩ|gvG{xL¯eÕ¢æPzô6jV#0º3+h–n$∂aŒöå/Í´x¿”é[N9ªB;fB¡¶pÍˆ'˛ñ;	®ıÖfˇ(u ¥&DFjŸ—Gìt√à=fı¬/Û»HtwåjüÛÖ]«YxP‡ˆ˛˛MZ’£?b‘awnØ∞%Y€2ˇ!Óƒ©èé5:KÌiJ4≤œ2?≈Û≈>“@ø1B/û§Å-≤Î¡$7N=wXYÁ`µò‚Ä4ƒı)a1ˇ‡“RyªKÏò≥O˝à*úb1Ë)%˝Ÿï`ˆÓˇ´6…Âé∞)+VòE5%œ<€$¯j*~ΩEú≥≠ËÌ*í≈ZŒü£¶ˇ‹Y,óiívL%∂u)-Á‹qΩõ–ÈÑÍÜ˛»S;(óÁ ÁyBÀWÛ∫TÕkKO⁄SVx°&∂!41(µ)/-ò[∞é¯ÏÓ¡-?D¸å‘T8%IÕ—ø¶
ƒwggIumQ∆¬»ƒyΩá™m:G˙˝ÜI¥üg«ÅTˆ•7dc(ﬂK‰˛ÇºI/¥Pb+®§éB.|e∞Öd∆TM'◊ﬁÃ˘˘.ó¢0èb3>Æ]R≠Êxqô†ÑfØ(√K¶ám÷w·≥¿2˙Àc7†éØéñÎM¡æïè‚JÓ˝MÔÚ/ZMD[»M¢ç:_ÔkëÿbCPqh≈–≤£gﬁ‚√Ä,ç@…XÏ4˙9S)Ï£æÂ(8Eƒπ@Ÿ]í©lG°wpg“–B=Øúê≠∆ÿ≥ﬁ¿öÄ5bLú†&°˚î‘>1r©∂Å4€<{ÙgFänCÇÊ∑-œ
&ﬁ®ºœæ;Ú¬ÙR ı;D>ÇF‡~9ÉZk¯>îÙ©≤“eI*ÿ»¨€¸ÿ®Bù»wáñ∑%¥&:¯¯®)˘≈û§]Ómü¿mŸ·'oíåB**Ë—ïOmÊ–xûÎ=Òœ2{œµ™€uæ˝Ydsáû◊ø¢^m4ÎwÜv˝?≈øg[ÁØc9‹˛ÛOÄQé∂ü0©â·xñaN≈ÍÛÄqÌ4ÿ}ü,(Px“c{hÅÈR´	ª*˘ËããKÀdµŸl*¥¶¬≤ù4±±R¨!õ„o§´ÀØà,g§7º>#ó§—h‰ÛÚ2ﬂc‰ØrÏøE|•KóaÜm˝˝oÈÇ¸zì~ﬂÚ˝ﬁK®z!∑˝é˙9¿x˝?t£˚E¸t„ü)œ˝L®Å‘∑¯1/b7´	’t26ç¿2ÅõËH†t™¿RÖ{"Uñ∫"ñ„[Û„™R˙ñJ“ü≈ÂóhW0O)]^Ê±¸Ö§ﬂÍHÕèRBæêéÑﬁº,W"Á*ﬂ^~4‚'◊Ïƒ≥ÁRAî›ﬂˇ%%é∏f…"¥O#˙•v<Û4—}Œ]Ì7-íJæΩ∫ä[+ëSÖ;W%nâr„!˘D`ÛRTb⁄M#F”äNÏ‰‡öåÎ˛ƒq˚Øs=∏kJô≤C∞òZ¯?›Ø≈y)qŒÖü,^Ò8â¥â+Ã⁄ÖﬂS√Ó+¯ˆÈmˆh<)wÔ„≈ú89òpÏ¿∫`.-/Y˘+:) Ùø€"OPoáF`˜˝er0:sl@'≈jú5ÚøïÎ\ûı£âÌY¶ÙFÓ´-±
ÂùÂùbH<!Œkó°ºÊí/y∆BMó@eQÃût∞`ñ6f)<Øx÷—Õè&ùïjxI‹r◊BR~–ÕÍ„ìÈsﬂZ¸yóRá‰ÊÔùh5[ÀO;·'7&$Páπv!¡•;!ëºTÖƒ1ù5éË—34[!‚√øÂ‡>‰åy˜Ìüì}V& ËÀõó
∞º$Ã%‡5+w1ìc~Ïıûò´2‚ / ”É ,·È¢Ç{¨	†]ú<Çoÿftœ∏‚Ö⁄<ª$@zã4(Ä]/¶l¯ÊaÙ¶’åÔbﬂmƒø⁄Äo^“	¬™8G£8JÅœ–µÃè¸JÜg`wÈiÇ«†k|îB>«¶–øZ¸·ìj!~ÚÅ
‘Ò–N∏zÆ}`û•ªm†¸J–ÿ‚‰a–ÿ7§FΩº?gê˙Ô/@Ea¶£U±æÍ(5ÜÁû‹ﬁ7r°p·ó8íú∞	òe#	Ôùa0œËª¸±àÔp(ˇÛ›€†£˘«¯ƒÍòØ=Ù¡íû ıôB§~¶-D0µd(dA–≤)˚´ˇ˙ƒΩê€ï∂π≥`˚‚Ÿ‰˜”ñ-≥P:Em]ª\ä∫äI'>æe260¬é∑ëΩ»éûØ&nCJ[‘mÉzáúﬂo˛ä" √®∏ÄäÀπ’HŒi'KÅ1|˚C¶0± î]é®1p©QU€§ˇ6</¯i¯Áó\Ë°¥˘	;_¯?Cx˚O<ÿäb∏?£ ‚¿ê¿<
˚≤íêRªæmJ’u®U˘kÎÛó)ù8≠¸ùÄ◊Gî í⁄s Rbï∏ﬁEe1I~•†∫(jVÍ∫ïLªJ T≥îrÃ( äÑïÜÆı1i[jÈR
FûbQØ´PlΩNinNí)|Æe˝]f‡ß4^É>Òc‚b)ˆT∞U∂!¥V}a—˚U,z&TQ•îB≠Û£8£+a≤≤„m¬tøè–d«ô‡¥Zj
R∂+˚p>ªﬂ‹¨R6®Î7FÊ·Œ-ø§£4,í)gˇê€¿EeHåÍBÁ“xcÿÊ·?ÂdÄ´PêÏ¢hòI @UR&‰dä» §c†1F95Õ›M7åR’Ÿ#rbì¿%åñ»Fÿ}4Â¬P)îÇã>Ì[Fq9ºÊK<5‰Z\˚©ùo¨¯ßac∏T§Oå—b)úËí3¶ÊP…-à)§R,6ÍùÚGï ÀÁŒƒﬂ≥ΩæcÂXÅ
€j)&+E.≈.˝áà¢fxõˇÕr˛Âp5¶ôP¬+?X)?T*VπoïŒ≥J¥«ˆ
FkH£øgG≠ ÌDÃüÿ«€»πÂô;”Íçs∂’wù:>#ÜñoY˘áúyÍ ˜l”ƒX=±›≈vùh¿∞=ñÌE€GNÂHë(´<<ïcå1+äñõXF"ëi&,2'"1à)xÑ˜13»û˛ktﬁú€¶íÁc[-èå7ôÈG´ùL∫⁄{ºΩ™5óø◊ÉÔr–v◊’y
πì’ôwœi@¸ﬁ}ÒÉ'ÊΩß'LÛö§¬∆¬;}ﬂ>CTL´⁄mí
ÛÜW±‰<=YTÌ[%È∂ú-ÁLyêT¿≤ı)·/rò>ı®b«’‘ÉMYêÍ∞*9a
¬/09Q
Ì¡+õEÇ≠ÀÆ„,¢ü
æg∏˙qˆn_Ä$ˆé]!ûM‡∞À¶Jå^,.@9K∫¢T7√F‡:=ÿw.◊ØíƒΩë»<òì›f*◊DSø
º›?I'ò»èÉKdÉKÀ»ˇEu£ø`ﬁX8	fÇ„Ô©·∆÷<u`∏Ë 4h.¿F#lÂ9¬b3KZ*ﬂ´∏fJ—◊üª8UÖî…2ÛONñâÕ”Ú´Q'aÈ˝ï· Iô#wïA‚X¨ùáÜyf—Tè©‰¨~&iò¶íæYèéÖË˚V≥©ÿ	rc8X§¬Ë¨VïI˛(”9∫„]6Ÿø‚pyòWf‘·˘ÓåÉ6Ü'0.1dˆ.6`ˆÅ∆p’2∏ÍK4Ó«EôM=πqCRò–\9]¡ßIg2÷… üJÚü‹„s≈†;u˛¯Ü|JZW:ú_‹ù†ïÕÆÿxPØıd-ŒóZÙA8öπå=i&‡Ù$!Z«Yª”öéxI–L´◊t–◊ïÛhÂî‰¿$öI¶/CuC+c∫fuçõùNÖb1ö≥î^°ÀW¡Õ˜x“étˆõ∏1JÓ]&•ﬂ’´+›$·ó\˛^w}N+z'Âôn”§^>è¿ˆ»¥œ‹p'‡oc[ˇ$‰Öi◊NƒNB–êÓÛVòf≠ˇZπÃØGåä#.?˘¡™Y≈_ÛB%®<ø%y—ÌTÊ
p@ÑYº∏4ß-Lª éN
≠ %qf≠t£ûw)yU»¬îºÚì7àΩT…2»4XS≠›·¡Eb8ÚÚÏ≈bÖ“R•Çn∂U⁄OLS\∂∏X©5
Œ3ä¥SIzï˙Ö]ÎT 
5‡Xz¨¯¡V~Y<ì™^S/Vhe!û)Ózk¢mcW´’NÆR-)• J_⁄ímñ=ÔS∂ïÁıâ#Éúá{á“Ø¢¯ì$txUC{/fçT˘…œ$Û
ˆ€W¬áO$ﬁîIWœ¸‰Uµö[2áÏ5Gaí®Nî'IË7 F8Ø‹å 9ˆ–~_í‰5ÿyª/Uí;““a…k˚(TˆëÃúJ∂\≠Øn∫r√ÍŸ{º€Îëﬁﬁ£É˝/êZoÔË‡‡iÔ—≥c“˚aÔ¯‡	Ÿ?Ë~ÒtÈ˝ïn†lÛç⁄ò9q,Z¡aõr„·>Ìz¿J Mé=wË“C8⁄Z/òò`T<ü4ïæ˛‡fW´#VÎËŸó«áO»Ò·ì¯ñÌ´√ÉØébø{œã¬¨Î£®∂Qñ∆˘¶ãi∞”Ã#6ª‰+€:∑ºπU¨`.‘#®`Ù	Àä∏ƒaYÜÄj0m?lÿÖ,ZÆÅqVS:õûi√N=KIÆÑ¶’ s{´›{∞ÂÉ¯O˘∑:ar˛ÿlv˚›’óë∆ÅuL,òÉ—%´-†o:ÅYÕœÏzLÑ™+◊IJ◊„π« v⁄Í É√—üìpôd0ô∆†ó’ùN≠#ìú†éøã&≥åCrCäì´íës(-cÉ«÷ÀŸí>ø¥-¢˝„[ .bJKP‰A¥˜
⁄—)Cë§Ô®¯ÑÍ4Ê‹c’`ä#$[ˆ)lá,V¨3ó—e≈lÛÕ“PZñ¡ïÀÜ’î±Ä∞S|JSò’≥<o“B*∆v≈êZËn)›≥›Á’û,?÷ŸN⁄8å÷ú|b§€ö82Ï≥A ‹}¸Â˛¡SZEÏËÄ<y∂5”gœ√◊ûÀWp^·öq·¡≥”Sã≈Ôøˇ¸ÔI±Ñê‘áKœ,,ïh%w,Q0^Ñ≥tCê¡igÅ°ÇPs°ß¨
üu[®ÊÂ◊°T€Õ|î™‚πy€∑ö+b±íÂæ1UCÌ]>?8:|∂ﬂ£Úm¨ì#°nL%ú‚†îÏx,^+bN†«”÷z€xπ ¡™˙[A/ôQ)Ã†ﬁƒr'–Y`ku¶∂*·)2Ü∫r[©úÂ˛Ó{ﬂ<˚¸õØ˛Ñ“ÜiL’®#ƒ¬¿/îŒ∞3ásEDíöí‡;˛⁄∑™É(…ñgª¶.∏¨o9à,´	„ﬂQ$É_‚ÀÂ’“ãW˜Ë Î˜.Yó»HØÿ∑È«” «s{Æ;dØlˇ!ÿ=Ø∑»©Å¯´+5g©6Æ…‰|é1	~(^´{ó8)>L<ÚçÅπVVõÙPwQÊênQsêa¯¯ìƒh*Ü7ãW6ä„
Ò{P˚t˝1”}Fë6YÛ‚eõ“:Mj≥ï÷ç6ƒ¥ √≈á≠%âª,ñ≈1do≤≤:ó˛y5Ú¯∆∞âc2ˆ#∞"†	{ªŒPY-bÅ9”Äƒ7˘# ¿l∏»ÃÙºıÈ ÓbÖAk:ÃUÛ∏ŒH¥
´©U∞√±˚YYxP◊Ê’Cuˇø¢O_%l^~å €»|˛RèˇÔ–Ônë„É›ΩGG)WqŒıﬁ\ƒ\ö|ì„*.;DfA&"˙1∆Ó8X|‚5»Ó	h‰—‘¬Là˚¡ÁÜ70F92CcÑü‚mG∆©˝#∏Òœ>,n“oêc√ŸCÚ}c Ä{ch“õ8¥/~ChêGÜıu8Ù@<r}kîèyYb¬¶¡dï≠ûSı¡/y˛Kbõòóå©_≠®RBÏTº·ìÊÊàü:ÅøP#Æä@/…&€ô&€â&;ÿd´π’Vor5”‰j‘$m
õl¡hïõÏdöÏƒölÒ&€:Mv3MvcM∂Ÿ\¬_çπ\À4πñhíÕÂ*õÀ
TCçè«áΩc$ò≈ﬁÑQ£KˇO(w|môÙ›`≤X‘÷ 
al[Ñ"Û„àí~ÅEL«¬õ≈—ËÙ•xÿß∏ûqf5|+8¨amëïï˛&y Ë√xøﬂ{ˆ¥ÅÁ£3˚tô≈‡ê“∏L˙ÜK™ú¯BUÏGHB.‘l«¶Ÿæ¯]ª±õä˚À~,àÙ0…”#XöS˚l‚‘Ø *à(ñ5RÜõtä·&WrÍ¬búbÏGÓπî¿‡~~;‹ç$∆gÓ)C“	-•:Z0ˆ#Y)?zäˆ®ÔLLÀè˜æT¨ìwîl#*€ìŒÊÇçïïÃâ?Aú`^$~_jÉ„‚fà•ò)U√î %FZª(…Û9–]≈0Å{z∫oL˝-Ú‚ey}ô2 XÒs(ˆ’ΩÀÿ∏Æàaö¨®_a¸ÕdLkóÇ¥Ê∆*:ñ8∏Á|âû∏¶·‘®´¢:üYC‰∏´±üÃ∆m%t˛≈R›$8JC¶W÷££“C1ª∫ç‚’ù«⁄*Jæp\éõzô}|.{p;ÆÜÖÎjÙÉ¬∫∞jÈb®◊LÂ’R—ÛΩRî…I6“À¯˙-Ê˙:4…ç˚é∑'k«4¶<È˛°π,ºzÃâ«Z3M|Í¬ m‰!°"Ñ4W,◊∏/“O°Ì0√VôkêŒ˛‡%»‹ƒ[l®‰˜â{3.ÕCÍ—‹)ó‚|RJn	†Òe)πü˘HCÁ j≥UäãO:RãEtÒ,pß*NF°î,éƒœìa˛
º•>5)ÒÄ‡˜.˘Ù_–éÿsÇBçƒ÷°d#òœ6@·—qﬁ(´Ÿ© Y8ÓUK∏∞ﬂ§‰ü!Èóë)ô—¢*¸Øüì,wˇ~äØ¬K4"ÜÃ.¸qıCë¥Ûø…£l°’î¬áò˘LÏrq•˛˝mmè,gåÅõ.¡R:Å9∑¨◊Œî ⁄b‚Yº^±G%dy™®_”ˆ‹…(®¢Ç`‚Å>ˇq≥hbûQA—xmM˝òeŸÄ¡@oÇ È7∑çà4ŸŸUÿdH[≤Û26>c…lªJD XÖ∂Åµ∏·o˚¥ì‘π˚OË\∂ÀR–©˝Ù”≤æãY§ò˛ãø	Ÿ
˙≠,"pG0MHVBã@dggñ«~$sk$qåz#î1æ'@-œ⁄ÜA‰ƒ»}>çz)⁄¢ÚæÎê°πE_{`W¿Î2 nA÷2‡•HEiÆ6…¡~†nÆÀEÜ‘’∆ÍÓqé%$)eVTQÜ–Â≈29wΩ◊ékò˛2Ôb(˜€úÄÏ•Öº$;ìLnI¢ÄlÅxH#W'ªUÿì¬Á◊Å'k‚ïlÚÚxR»fúôŒgíÃ£õ»´å(YJ9‹ôÕéR˙\J	>ì8f|Ùs˙oê•úÏìOΩ^J [A4˚∆Ùé`nû`("ÔÉ#∫/‹ëÀÕìù¯ê`x†Í…‹<…©ˇ0à&s‘™G&≤P™NßﬂÈ&B©“ëRço	U–ÉÍ|™Pßh„√ Ç∏Mzb"ìˆyAx≥J
⁄Ë¸≤©´üóõÂÓò<u¡^∂˚Ü‹(ø4íﬁ>Y˙±¥u7¶3óÃì§ÒE∫FHAµøL2Õ,)#{à —S√¥ÍvY<.Òñ¥+¨H ‰¯∫._p∂‹È	SÄöJµ¨Ë.Ë√ë#◊«9zBM|û0_«Ÿ¢‡JÖ
≈úC’¢ÜäS◊√÷œÎ/Z@Ú‹ä◊<fª~—jÂÂµKƒ≈¢ƒ$£»	+B"{—Z£»k>ÇÃ2,D∞Rr¸>6$}ƒëï;*j^;úbhíÿmÏ¢F∞PY\“fû9Ÿ∞H’?‹Imﬂ‘§F¿–èRWodR–ÿküTê3Î•bÜƒì:◊6Ÿ¨ãúmz(5˜©œêúÎ¯∂~/∏s3b¸ì⁄ΩôIçC—?˛I]ª©Iç¿¯7!j7£x=n#Ê¯È@Ïn†BI±+±*C∏ŸÄË4|:^'E)NSπñT¨ﬁI´ô
ÆOï
ÕÀÇı„Ú‚q”ä°†O]©‡GÌ~Fì*^@Ü∆xåGπ!TKÿ6TûV)àO)ÓN)∫1Ωä¥•@ëË‘bQ	$ƒù‰Åÿy4∑4Æù»1»!Dî.£V¯G+<åÎQ∂J˘…Bè[»Í´≥ø†ﬁ"æ^,…íÎë=◊ôu…Ê§/‹ÄÅŒFı¿ÎË(ƒ^’¨°Z =∫DqT’⁄ΩÒ+ì$J7I.#“ëuNAX;©Çæ∫Ÿ\Ì%⁄B@Wa¸
ø©4v•Ëía˚√JµAdÚ^ålã3˚ñØTÀnÆ=-kk<}¡‹Ù˝¸•Z˙äXEoU⁄Q@≠_íòk›Øô•8Î§åU –®qç˘âÀÚ÷mP≈aÊújŸK3C¢»u(»ÑØ‘+>«ØlÖjå«NÑÓî»-iñ¨Œ{†ÀW«/ï¬Ë±(ïµN^:ÕWH«ÆsXòºR†É¸ ØP	™ÃiÏîØ8˘∑≈
¡GÈ¬Èπ¿ôäì>(dâKÙ¶-ëÙŸp^©¿ıÅke5aˆÉÜÚﬂnAqûÎ¯7§A*◊?éıÛæ5IfÁ–“ ÔEõå 6Œ¶MŒ-úw)EÁ]°j≥≈‘46≈À\£¨[À†4æ8˜Û–CXΩ.U$*Pù`¶/—1TΩp¬,∫∆B® .<_V€†S?7ºÄ7æ¨“uÔ‰≤f÷y“‹ä©ìÏÇºj4ﬂ)FÔ˘“\ *O7ábÄ"M"f*âÁH‘ó%L÷Ÿ>>·˜-5∏9È°–|SS3Â_¸™Vjá]a
»JøÆÆ!äkÊÇ?Ï∫Cù]‹\üx{¬ìàmﬁÄëÔ~\«iN$üÏ*˜C»g9msªã∆ö4e¬åùl—$ôéh¥o%ª8ÔT_Â‘ÑË (‚1c‘ V≤ª·UôòÙ&¸w’∆ö»?Ê[l≈è√r %ƒJ≤ñUD ˜™Æ5ﬁïgüÂGeßÑ-ÅoC∞{Xr*BüÍóË◊Ì/Æµ•®Ncf´ıyı™ jÎÓ«Ï™∫ÌT+áóæÀP”7°ôÍS˚◊ktÛ#ofeóÉ{S?NÊl¯∞•[µÊ2Ye9ûÆyôåÕÕ}~eDÎt†«ñí
/Yê0∞˝–ÈèÅ©Ùû#˙p_π/û2Ãy {◊v⁄æÈaDÄ?∆+zfÇ∞‰&±{ìπ,»’Ãôß±ÂÕ#kÄb´≥Á(öŸ4”Œò%¨	[k¯cP÷jãıEM˛ƒ£ß1>4(&aÊk˝„•˘d=(†,Bï„∞Ö6∆P≠Ã.OxTÂ ñ±¬œ".¡πPH)TtqÓ¬Ve≈G`ãz˚û4Ó÷KIn£ÏU¡-OB´PÍ{ ˛é~?3ÇœànYoÓÇ…ù˙ÜgÍÏÜa#q6•€†Åyƒ®oÈ”Á£Såç$År#Â›c£æà10Èc∆D>˝¨ãœ≥‡◊ˆãú¡«1çV{F√Òß};ÈπÅ\√ìBÀ!·£™4¨W,"=ºP©[ëá4YG,≈kﬁ`E-Ù]_™£	èwWZ"‘$ÆLI$´>,mÕ6¸az—ã‚a6h	ß…®Ù F’)òSﬂÂPLñ$?Ã˝¿Õ•zÔ7Ï…õª/Æ [[-¢'êfî‹ŸN™i+â+∂>∆â∂-	|O<¨„E<]h	ßtSgæ»ìí#z2R\è3é€ÃıÖª∞µÿ∞$ìåu6Òi´ô œÒèg¨4Õ.~∏Ãs¨‚zTiß¢`˙AÚ†πM„[€J1œπÌU6‰+Ò‰RY8d˛Eı ”ñÒCVMT_® ◊≥ÒÙ|ÎŸ|ëâ¥´a≤œ(ˇÍVdäUt9“DÅ4„j%ªÜ0”úÂ£Ø.ëIR≈%_4_~Fkò—Ñ•,◊f}∑b/°5+jÅ§∫y>ò˙vﬂØÿ	/DÖ…U+¸æ ˙UpÁúYs–\BàõÜ∂y&u ﬂR–∑¯û}ò‚·~/u*€®JZ†<œñd {Uå9˘J0A%	Õ¬“Å´©ç’ƒ{™jÅ!ºî)˙J}∑¿]Ç;õ†‘VãluπÕ<¥MP“≤ë<);ÆƒD≈“NÅ"Hu¿Ni˚§ 	‡qì-Ys+|PïV∫	Ë	/¶|I6£√qfˆh¬*X‘:ıµ•ô}‡´ÀdÌŒ~ÁèfˆŒ~ÁøÛÅœÒÓ;xbw>;∏˛∞Ó|‡*É∫ÛÅÎ^w>p•ÎŒÆs›˘¿Ÿ/Ô|‡ÚÎŒ~ÁøÛÅﬂ˘¿Ô|‡—u]>xf®πƒÍñª∏c∂O"∑“F*iïr.%:äl›£»÷HscÃ
È¶≠öˆö;Ωc…âsí;T¥(/£4CÍ‚¶Ä\ÒN•¨Y
îw%ã/í®ÿ0Y¢0∏SLÃñõj[‹Cñ˜¢ÂÀ≥b'T	›§ÿßˆÖÖuó@?®S*ß$¥≤÷îÌ£ï@π*ô‰öú@¶÷∆â3Ò‰qÔÖï¡‚üíBce0æΩçã˙9û˜pÚá	_U'J,Â}JYâ/ïx˝ÌA'cÀß›0aÒ.lÈ$âl•I†”%¡–tÜ¿6ï§júSÈ#Ø‘ÁU∆êó:#ÙÎ‡Fü≤Ÿî“„•Ã$ıú™;¶åG˘]ß†B√ÃÄ^9¥Qœ"Yﬁ¯*œ_Z^Êç7>S$ˆ∂cúXNy v°£®ìtπ—™E¥=•ûÛxF'≤:O≠„ ’5YÄ≤˙WÕ\Ã·n~E©'¬Qf\°iß·ÓI≈CÆ
˝>G!à©‚ÛÜ‰≈¨4#zµ4Sˇi9ì#V •j¸£ZÃ„⁄L1èÍqéÍ*ô:ïÍYjT¶®Ÿ©âÕ€$€òèaﬂ~c˚@ˇ:bN#ùO£#òCú(˝6ìBG"=B◊J2Ué∫8…ÕÒ≤™VèK5œ‹˙ºÛÃ)Ó,)w›_˙éØµ√ƒSπ¡oÈ)¨»ìo—≠tı z©ó„EïUs¿|x…}t`·√6d›Cäc∞ka»–y«êôÎ2Ìô•	3Vô#·∑qéƒ∑ú#√ó∞:¯∫Ôö÷’“{Í±'›íßDWÍ¶=O‘Xìiÿÿøö~ÌY?öÿû•¶héÅÏ≠<†ÂÌ,Xç≥Ym∂ñ…c„Ñ¥‘∫KIz~}-bÉù+\ãÃ∏e¢B…lØ∆'°Ì	è(¢îtLH}sP—ç¢ª»4áY+‹≤ô◊ì•-Bß¥Ùa˙∞%Vcn;¿û1Í[éíPU∑jÙó–ßµ%,ûˆ™eHìg71Ì‹kà™πŒΩíù∏ΩÇ~3Y’IC≥'‰v”K	πÁÂŒu‡ûÛõ#˜∫¸‰ü°ü=khÿ#{t&RKì2c>Í≤„%xÈ-Ùˇœ˘¿Œx>Œ ™úƒË8p…ûm™9˚’›˝Ωı◊N«∑n»„?ãœøÇ¸íﬁwôag˝Z@–€83y˘u||∞ë¢≠ôìŸòû#Ï≠ár$™Ãcx1œ2Ã):eQÎí`Ä8c€llØåÂs°VLßÿ8Q9‰PôÖT1;VÒÖa8“©&	>⁄¡pÏ∏SÀÚ…–•L+>Onò·–æ¬BECZòvKiB ∂MŒ†˛¢›¶ˆTXîvJã“™◊∂…öƒ¨§i◊ƒQ˚ôZ»?™äüÀE¬Çã%«°h!^ÀJ˘é)ñ2S^7cïbùRpçr‡Ew]v∆¢Y@»°∑¢∫ê"UÉT¢x£
v(SÛ˚∂öÄE[kUSˇ√≥◊∑ﬁá!"ΩIzKâ~µTS4Cz˝ÅÎ:≥¯íû¿ŒtVEm∏˝Ê3%ˇÄ˘|Ìz˙í»d<_0O/FO7™Ÿﬂ,è™*ÇòXˆÌ	ÍŸ‘ÉáÅÕ»ƒ¿WÅ7È”#	,T– «†u˙h8ÜgÜXtDı⁄˙‰s–…ç)ç´Ô`∑√¶¢k“≠N8ÊÂÜﬂ'ãO\˙ÁxÇôÂø∂L˙n0¡?02¸£Z|°q‘+d⁄>soí°z¢§ÚJXaΩïag28VŒ“™b°÷ó	ÓTV˙¸í≈Ÿ”eA(¸BX$¢_‡B·7˘.~˝‰7∏ö¯¸•ø√%¶ø ◊&ø¬e«Øa‚ãÇ0Ò¸ÃƒÉ3≠‰©àKäRjãêKi÷vRHqLd-œphÌEº_œD∞âo`ãY‰(°u	§ü*ËÍ’ïº'>n˛*&ÛÈàæfcQ§æD ˙π»Z6BEë\MW◊ﬁuuwµmSE8ÍÏπX∑k”œUúÍÊDÏv4}Õº∑ÊônôœA¿ûgÅ:KL™y”€ÓtÔﬂ›õ”∆SÎú”ácΩ±ú˘ÎﬂU˝~j‡x*(Ì3B€kî¥(®»gü•—™))ûò\Ëìë≈÷Â,K\U˘5=⁄O¿Cú«•-Y´hê™Çdõ[‰UﬂÒÎ˜.˜Å®#˜º∂tıJ5ˆuDCís¢˙S`ü[®ΩzËﬁV∑•·ˇª/¨*h ø£4ÕΩjÿ≠◊ ª'Êƒ!è¶ñö
ß≤ìøT¢$äı⁄@∫˝æ<Óü’^1Q≤pÔ21õW§O≈çI|v3
€È'ØT˚9∂áñ;	j±PÉd«ããKÀdµŸl™∂¯4>>¸π‚ÔrEöÇˆ(üˆ‹√&…Ø>§ÄFÿ GÅ±cè”j÷wó˘Îç˙C-∏]íETΩÏº]ííìÿ∫;`]È} ∞._•“]Â;d]‚ﬁ;dù‰äíÔ„DÎ÷@Î¯Dàx©MÕoº≥™ø¨ÍtºœºçÍ8Y›ô’Ö◊{0´˘ PeåFÊT¥ÆEÏ–≠1ØaÀ´h^cL5ØsÉü“LUΩ/K∂îM‡–ZœLµñù3"™≈WÀ—ì<›®¿Ûa≥∑ŒZbäŸÎô˘ºùf{|òµKN]ããÀú0_‡¯:F+¥∏®ò†¨X÷ﬁŸ˚Z1ØÊ«aÒ?ÙC0}ıBÍÚ§ﬁL¶~Ç˙sCÂ)?‹Öÿ—Î√E\Û—¯…Ÿg∏ˇÒ|î31è:Ë∑*Û∞-‰éyËı·1Oò{?pôØ‚z3-‰*ê◊,›ôfsóu!s›•A)ºÔˆÒÁ!áì∫Z˘fÁPn\/èÜñ∆ófÆÀ¸Ë`‰’†2ß!ì¿ù¡ ñ ÈSûÔÒÓ¸)}›ù?]√˘'ΩèˆJ˚wπû®¬-<«⁄—ø
Nπ∞5Ù›Ô>$k[‰ËŸó«áO»≥Øéæ:<¯ö<Ÿ=>:¸Aˆw≈≠Õql±\«∆	√ˇÛËËoê÷ﬂÿ÷˘bÒÅ\·πW¡YW¸8œΩ¯9W[€–h]°w≠äˆL∑%«WeÅË€ÉU•⁄I·—ïs∂ Å¯Œ4LÀ˝Ñ∆êì˚¿t√°·M∑W´%=™˝≥p˜=w‰ªémRﬂ≤12úi`˜}‚ûÚ@ˆ∞úb®Mës◊{Ì∏Üâµ–F&Õ$E`§é˝cäﬁ.âu/ﬂêë˛‰˘°¥\[zm0Â Õ;ÄE|ê™˛p+zªJwÚ“5 íX,¨£0äÉûÍ∆rÊ(X÷qN÷ÿã∫_Tëñ˛≤√‚ΩÅ’›˚—”4$N	±ﬁè¨⁄è\| QıÈ
hYK%.≥&à2‚çò±¬J3€Cå[Uâ:)Î>gÎ£ÿT(∂p…+ÆR57Q…’É}´V3˙˝-2¢)Ï∏ó†á7m≥Lè>yH¥D>%…£√‚Æ,üO≠ı–)'QÆ~“oÿ>-Hºƒìà»MÆñIsÈä<Ü&ûU3ë/áÑúdJzwû¿LdYì~zΩ|Iª®Ãî_˙ò9Â6≥c¯|≈º»c«∏kÁòëéÅrb∆èƒ®˜*Lß¨–˝¸âOT1OQ/~≠‰«˙®LªéÂ{∂◊wn˜¶=f1bºXƒÅOˆ≠ ‰î•T‚HìŸ@(-6â |—ÒºhØÙÀMÈ+€ü¿Æ¯1°!™´LóSûªD%’R0+O√›HÄ≥®n…ãÚ=Î˜'0ï˝)ÈF0ÒÀAZRÌoh∆¥ø∂∑ï˘´À˜j^xúÓ∆;$QÄù˘•Evb¯‰»Í√to≥˙Ò®:Oîoƒ¨uZ(Èÿòú∞∫yéˆ1ÄuåºÀ8√Ëz†∞AÉíG≠—
Ym.ëÔ0ÖñYõí’ä¡ˆQòΩ˝Àâ7%wìE¥HîHãõD◊ëöOÕSòBEX∆Öÿ˘Èq⁄F3,äzÙu~á)ç<Ã.£ïø˙#ÚπÌ8j“ïˆ•X»!5≥‹π.‹ç4SÕóê(˜&=ÿ¶iç‘fª§$Ù¡“x%ìgô<sr,?ò:÷ŒÂ%9∑Õ`∞E^›KÃœ+ru•qÑ+ΩMqèÃ3Â/cåyE‹IÄV¸jìfq¶º™'ÒvMqc’UUz)´,^_e‘˙Í¶˝mÎ[‰‡ªO»£›«è…˛ó«?,zRÚ˝m÷Ö1¸f ¥˝ç9	¶wﬁ∂Ñ∑Ì &á<B∆ﬂá…!ªpwdÕ—œ o{Ù∆>≥agr1çÊùcÙÇ¢ACŒ&∂i· û¢ﬂ⁄#–Úp·E¿åûä˛5©Ê‰úe¸f≈k∆ÛÀìÁ∆»rJ#0rËJí’œ8u©e˝¨¶å≤#ç√ha(%»b“’ŸîÄÌ∫êv
f,˝‘:«ÅÖï†JkTÔ Ω'Fjjÿwﬂ
êê†[#§\Ì~IÏãèˆÎÕÊ"˘î–Dn€OIkiõ y	˛ZÜºé·˘cç÷.)g=epexÏ”˙-√ÉÕí
Öv≥Ω∂à”¸ﬂ’õÎ ˜E˘D8«&ô}êDóbús–ÿ¥ˇX”71òlJ£¿‰Ã	ˇ}ï_nPQßÆ)Çæ‰e∆B≠M∏©"π©oQÖ∂àB9l'HJ~ü[¥#áLÛ∞-·V∑î [Xñ2%hKˆ?D¥§"ö$RPå9ê$óI’a&¢ôœÈ∂z˚Î,≠07∆±÷r¥kÙá™5°ÜaQI_Tæß3˜á<æn`ö6oR]kÖ`©eÃô2™ZSùI”D´j±xÏq°Z„ga1Kµükπ‡7˘‰K-n50…Mí=µ.0jÔ∫àıîõ#[ÏÌ∫…ñi^s'€ôh?“=°'å‡—È°≠Œ$ X‰b¶:˚uS37n°÷Wÿ‘‡ÇÃf~Å[D¯tp™©}c á+Îlä∞·€∂q
-∆¨´òã‚f˘#fâ^7ó$ÏÈﬂ_^	—ptæØd°˝â¢_˘ÑÊgfﬂ-.Èb˛ÁÜ¯WYÕ9≤≠ -âÃ€ùüNwµ∑›ÏòùN∑ùrD∆s|'œû∏› 3À‡.ﬁz÷Ã≤˝‹ô¯y(’",õ8wì[ÃiéÖ˛î 
`p¬[ÜŸA∑4îc„Ò9≠[•„õvŒ∂@O™„√»£E—5≠s,πÕ∆ì•®Ë∏Ñwcpå±o©˙÷ÇÅeò•>ˆÙyJ"¶#Q+B⁄ }ˆ1Kx˝‹∆yYå®¬+•î¿SÿüÇAÍ‘·¶“·˛ˆJ0®÷ ıÈ<ƒmµzÃT´˙ÎƒV]µÍå∏/‚j≠$¬@®_}°Ú∂‡…Ía+@s2∫<qÕi|L¿n@Jı)·/ràq=yv&;T∞gt;´°ø|ImO2Â%‡7i∞I2äbI‘pÅôª…≥¡°;rc∞≥Ö·`r%3[ﬁO¥3eõ‘≥v"¢¡D√‘'PΩ—Òc⁄Ê,≠©i3™|≥—’+∞Q§—Á{ËsRœﬂlÖ.¯êÕxH°HÉa&∞ê5◊PŸaVb”ÄXÕÚÑ©Jıj ≈¶Ù\ìk›¥®ç	\MoŒ·Âıu3›d2F¢f~/eÒÉB“ß1ìñ©ò7*Ï|ŒŸ£RHÀƒÆ)†æJdœı≠z∫zJ<≈Ω!¨ä°ÿeÖ’¬8ïyıÿ3¸Aªjö>⁄ÑNÏ™…∑uπ]m‡¶^ÆƒSEw6Ù≥÷W7¸⁄ÿ"ΩÉ›c≤{t¥˚ÙãÉ'Oèãûı˝ø|Àæ1<ù1Cêüã“ö‚“LmnÀ‹ç~Jv∂˚Ω
#≥Fq““•]b8'Ï-=∏˛öùí˛·ãÊÀú∞¸ûiÛC®ÕÇQ„sJb3YQ”©ejŒ≈pgÒÉ±vFK%¿¨øa1∏ºxî:ÇØ'Å¢›áõß•UèuCo —j-v™±∆=&~`xÂYlCZœbµÙ \ÂNÇé¨™[∑Œ¶jﬁW∂}!÷IPŒsX#y
‹J¿∂*ŸZ”‡6>LÍqFj√gÂ7’‹≠ò#%l4Ú∂*ÁlÂ8∂ﬁÆ*å-ˆh“L¢Ú,¢Iwz¨m5@%§«Xd(ïôSL:œ›i ë⁄¡tãtöy(8Ö‰ùÖ–6üS$JçPûòƒúé@‡P·!EµÕW3-@∂›ÆSR}8€lÁ?qÜTGµIœ‚;h€á}˛3+¿mn∑Î<.≠àHòç€™†Çââ™Ôd0,‡∫HTWœî¶¡yÒù·r¶ΩÓªÀ[X|g•hΩkÊ∫( Áˆ§ﬁÕEw'¶∏÷ÍVjA+yoπPj⁄çàÑH'ºïû˘&Ÿù«MËvGynèk˝§Üî·/]'ˇ±,9j¸äÔŒBKi±	ñπ¡õÔû#k
õÈfvÎ–@{J'2]rÓfÛúﬁΩq¶—BtW‡UT˜\…X‹=3	œÇæïÔõﬁj>~¿⁄ k¥ñqà>1∆™9T‚‰…IÂ)âÈﬁccäiòõ›˛1Ãau/ıÜn§u7ïBE3∏ìíMsC¿îåÙµÁû„Î\2Uh∆û|ÃZ[µ`\%9O©$fõ®Tå+Ã›NÚCip∫ô(“qÃΩΩ•úôE◊ò>…´Í¯˚*’Nï¬∏q¿L+à≥ñNˆºÃ»/Z≠ÒÖBBu%ƒuÊh}æQTÌqø{˜ ˇÜñl¢6ÊZ∫˝¿Î“{.Ûéú?SKU…qØòúJ0≈wæUdËP÷ù{∆∏@†%π?GìT—±V9@±‚Bi∑)á’j ƒd	Ø‚πßr» éWTŒy•åJ{ø3 c°ø≤Fçå^
s⁄^˘S
íèoJŸÅÊ./prìì«ﬂ¥RoM79ÁIçÂÄ.öW·T!˚ñˇ÷VÑ7Õ}ñU+Ü–K®+Rü–”@	ÔO{ZKÍÍ—§Çb*Ì8Ï§–Nà'‰Um∏jõÈTπJ’) .?à¿äﬁ√ß_~q¯x˜¯ŸŸ?Ë˝	πOæ~tx|ŸÓ—>©}~ÙÏÈÒí:YTò∞îO∑K.¸i-ôÉ~CŸ„ã◊%“˛¥qÍπàÁ`†í-ñÅshèjÌŒr>/‰t˚±àoñ)Œ‚–º–Ç53†Á¬·r‘4Å∞UpØbñœËäÚ}ÚﬁÆRƒ%‰_ÈÂ‰%j•ù¶”'Iß	´4Â†Hk9¨•@ü*WÙ—òè4`?ìüÒœéeò»,,Ë
EπdÀ£=ê;®øÇ:v⁄Zo/ÀGÇµëZ£Ã%B?%•º‚•à0/K:©›Ûº¸uKdKn—(@6Ì ∂ô>Z¡k9RòB9Åu9ÜS@≠@$¯‘™Q
Œ§É-ı4Õû€:∑OΩ*:ÖêgÑï›•πL@à©ÿ@ (·^PLúcÇÀ–∑˙|ˇÛL|«≥dñ>”(‰Ø,¯üÄ>@Åø˜÷Ñlnë„É›ΩGG§ˇÓ˘¯ÄÏ~µ˙ √√«á…±Ô-4ÄWÛ˘F$-WÄı∑ê‚UAK(◊r§l–‚e·Fò—kê›Ëï<öZòa—Bcç™ÕÙ˚û5≤Åb–ÜÛc&A¿tãC„q®É ˚[++ÙΩﬂòå| 7–Ëª√ïÒ¿\`‹NgΩµæ⁄Ï÷€ÎÌngÛ§€Z]˚!Í;Ëß7Ç˚ßv∞”˜‹Ò˝Û‡Û˚?⁄Ÿh.í´"¸Øxñv¸Yˆ·Y>7ºÅ12»ë1Ç‡…>PÙ$œ=˜‘Ú}W˜Y÷W;õk´›ÕVß]?Ÿ07÷·£k¥Á8´È•92NÌ¡‚˙é1ÃyTEIolımcÏ5üd≠ŸMmsΩﬁ<Ÿ\Ì∂7˙´≠ñ1á«Ë$√oêc√ŸCÚ}cêª(£3˛ π±·‘·¯ÙÕ«Ÿhv667Å‘÷ZŒhmök@j›y–Y7ÛDΩÅ1Ñ¡êﬁƒj2rÍ°Ì:ÓŸ4V◊Uwy÷ª´ÌÕ’Õµfß~≤v“=iö'mx3áÁYK⁄Ú»s◊ÁpÔòÏπ∞5"‰Y˚9ZõÕçÓÍZßnú6[≠Õ”ı˛âµ>áÁXO?«·Ã0Ú»ı≠ºÁËπ»(¡§∂ÂWìeùıvsss≠”]ﬂË÷ªk›„‰¥sz⁄±'˜iÓ∞¥¥'æh¬ıd;àê∫O£(ë«ˆ–F≈fÆ¡X=+@ì=úE
ˇ>¶áˆáπí¸1Ê{∏IÓƒ„u˘¸Nÿ XÆè¯¥| ÕRzùqYâ˙+Ú,‚4CV•`å ûQ…{±≤Bˆß?¡„jÒ–t.»…¶«aæ1¨pÆJõs`ÓY+¢®8ÕrÀìófymMe·Ä5‡±X·∂CS≈√-˙É0m¸âWó°MÒ‚22{8>ÆDõ—ÿLc kÒ(πâ¯¯,0¸wí√|∂ÙRn¶c¯mO¸+jÇS˝4h0	ÀÍ◊‡∑¢Ñçí+πxü~*çÃ] v¬ÔKo`≥M•Ã\ª£RÜÁ‘vúÁôR<Ëi∑ú(Ãì¢ÿï∞3Q°G6DÌÍ<A¶6è‚ô<€:˘á®q◊ú8Cç&pâˇ~«ÅL©BÈ+´Õ¬∫.´jPã<TG¶êõöS7›÷ VœÒü≤7πõ*⁄\æÒû=z]W;?F¸·å¯^üÆÍWƒp|«¯-±ö<∆À‰∏Tê¿Í¿(ÄVN-œ≥ºÁÆc˜ß;#∑.>RLo†uÚ˝ºﬁdƒ¢ÎÃGÂ‰fh  û…úa]17*` ﬁ[vØ//ﬂˆØr='î…+©”é˜>ﬂ”ÆBDm£´QM´Ä£ Íi%ÍÕÇõ¿)^YôÕ£íqˆìÃí:ZIy|˘RH‰+°À]”AqIq-TÀır…S1wíNq≠’Ç‚Z…˝NΩ¿÷§Jáe˘ï¥»êZ[`≈èHù&3Q·¯Ç2‚òûOëƒYYÚli=y∂$÷XvÍœÍh\◊9˚Ã7›x›1Õäks1∑ö@>«_Óc÷ôáª«{è»Û£gOû>{ö˘›{s1è=wË"≥À}Àwná¸CÄ¸–˙Ù≥˘ú≥ß·‡¬ÍO–nf…[,ìL-√´ÉMNNh«·B˙XR–rÏ3≥òäbèóÊL/fF;€ÌÕ˛RîÔﬁ÷t.ª·ÚÑÑ@ˆ<xdœ6≤∫TF ~®·å=wjD’‡˝}M[°ç\Â‚€{—h˚uƒæjáœ–áJfg…ç˙ÆÄK¬KΩPÙ‹7£7ı¸–c÷èÈ≤œJkåxJhÌ8∫·£µÍ§Q–`´µàØﬂ#µ©Ÿ—7ö)Ë9‹àÔ/ûÔÜ{©=±G¢.p∑—l™«vkV"RèÎˆkº≥–l®‹b1‡µàbﬁUºYø&å&∑jP‘˙ÎZ~‹ˆ-®o4øbF∑â+é¯*ì› OúP]%GËé–Õ¶u„Inî§ÄÎ›?"@_xpX%o‘Fs¶ü?uÖgÌöRM…ÓRÃ¸\!Á3m®y?vœŒ,≥x¿Ø*àT√4i∆¯]ÌMRG,fvô§¿ #à '˜í(Z˜ízïÍ L∂‡.îñ‘Ú;Á•ïNè!ô?⁄éÜ¸	Ÿà¨øƒ-ÃT¥ÃÜÚ‘R¯u‘íK+§ïæΩ¡ÒÌ‹8U0&%œ§¿b=˝y˛l·Û¬OQuÃ7Ç^¢o©–?˜,
p‹3Üò˘u’ò˘d§|÷PÒ¢Çõ†4næäa∏vbéÓ≥TV‰»:≥˝¿ì÷=á'•‡q∫míéâ`á="–¿≥„¬RÒÆÁ¯ºëeˇ˝OO^Ù~ÿ;>xÚíÙ"$b÷É‡Y@ò&$n£!á k˜ˇ9“ò-!FüÔ c◊N]«v˝ ùF§Ö=ˆé˜Î≠fªCvœxÉ5ﬂÄ'¨—˝¢”ÿË.·é¬|«˚¯:±πÃs´M“3Ü6Ÿ}=@Ÿ&Ü–j^Û˛?   ˇˇÏ}ks◊ï‡_πf<&8!@º¯-…°H ‚ÑîºeèW„çö@ìË1Ä∆t¢.´o%ZW*ï™ı*ŸÚ∏J„ä")∂FVÈÉcWMYE5ø`~¬ﬁsÓ£owﬂÓæÇi±S@„ˆÌ˚8Á‹Û>Íj‰ø[˚Vè¸ú2‰|µ“πcÅ(?@G˘øâTgA‹	˙≤ÀKkÎÙµÖ∆¿˝E≤÷„P1CD&“˙}õ-noj–=¡∫z &Åt◊ØΩ˚Q`jX^m4»Úµç˜÷Wa…◊ó·ŒÂÎÎÎ.Rﬁ@¨Â4©‡Ù‡ﬂkWãWÆ≠Øò ˆ∏BiRSí§ù∆ê_¢
≠	+œ%˘2!L⁄≥ó‚˛¸	˙EÉ®…Y‹èù	>Ö‹H§&ró§öx‡;ÜûÅúÒÿÎÛC†yà RË@Â¿1m◊	&“vÈ@Û(´ˇ∏¥A∂÷6V∑ñ.A†«’≤±¥˘ÛFåÔ8∞Ä±eUi#É‹⁄H•§Sg≠b,èÉ·l?ØQ˛µcÌì∑euH·}«GãÕ^€ÓãÓ:¥˝gwõ8>≈vá‚T*û“rJ)vªp±L5|≥7√G^ÇïúÂ!
¢Ò*oµb,ß≥÷_∆…≠buR_áΩâdwì 
N2·M‚ÎuÔ¿ÎDáË&yCÎèÙ ™˜–>π"˚n–©¶◊T[Ê˘$@>€Ón"€≥ƒ‡5Ï%JŸú€»∫PÈ©à˛ah‚üô£üÈø-œÌ”;CØ(‹ÏRie[	∂/È≤_À ÉöEk€w;@=ÿWÒNˆM*>ÿ◊æ¸°4M.„\üB.—u≠€E*€†ıw!0Ùv‡ŒOY>,÷©%o»‚\Á"‰Gvﬂ©<!∆eP+ò“ÏÂA}È‹‹>)\aNÄ≠°áôÚ°O=ä¶BF‚vGóTì6üä°WêôÀ§—°âò@ö≥tg„”¢(eÿÒm≥3t˚´Å:„†c—≠B¬æ›õ§r—‰ã_Ωx¯˚ûæx¸≈ÉG¯˘	ﬂ˝w¸˚)Ω˚˚ÂΩx7¸˝ﬂ^<¯Åﬁz¨<¸Ωı‚¡wìîˇôº∂≥„`lIò¯øEﬁWañ=n“$’ìAé≥QﬂaˇçÎ∑EÙx{ÙÃq˜J∂Örã’ë˜c:‹?)WgÁ@˘£ÍÉ*µYàçWÙAöºn¶«4‰X§I\£«T`@ãRµ ˝kÍ¥ã∫úˇ·≈É?ê>∏CíÄ˛.‹z¯kz¡óAÌä€bm*„ºÊU—F#∞ÎáŒ„BèR˙‡©¶¿ì§¨·¢¢’≤*Ãâo!≠ëû®„Ç`qÂ(t;¸XÏÂ√¯^.w®¥+(êÕ1€√q•ó£Ïµ!"úG∑&êw˙V ≥8*tM≈`ı∂≥€.ÓPπΩ<O¬S8ÔÒ´(ìº˘’ú>j5È€*◊a¨"‹Jà7…}JÀæ˜ä7™ïr∑˚Zãm˙Ì‹<|ÎÉ0‹Â„	¸Á¬«d†Î÷≥i†ÕÕjÖ,îúÈÌ"◊c¯éîÃ #ïπ≤∫¥ë˚´ÀËMYh¥-0T†3'W~6/¶[lUß 8/Yfºÿrá ¶©K∑ 8±Ó∂inßpÕI|cUöY»É–(ú´;	ﬁá¿ﬂ †<Kå´%~≥Ì∫ùÜ=Ä,$~â}Ö°]ÍQ¬ë¯Îjœ,ÅKªj¥&Zè»≠<Ë√*)˙∞±¨É’jy∂ÔÎÅˇd∫f!!yRÇ≤‘R≥Dóƒ<˝QlÓ7_<xÚ‚·Ô°‹ÎùûÅπ22oÿY{√›v:ˆ·M∫.7ŸÁÃ¶á‰jﬂy_{Gº–ÈÌ∏?Ûõ]ød∑Ü•Ìºbrµãæ¯—ﬂé0Ûµè∆/ÄÕºÅ Ã,îUø|ßáô«ôWÉû¨G?’b˚f…ÑáI¿D»ÙïJNW‘ΩC
±-z3‘Ñïƒ!EÚ‚!Â3‡ﬂ«⁄vJ54˙î∑∫	Z·I£≠C“ëÍD¥{Í@≈˝§—∂ÌÄ6:R¢ö"\PKvôí˜(2‚#‰Œ’=üF£8V˜)Ù+LmÇj'çPÉóLw€Hö‰„’ã.7ÅóÆˆì¨Å⁄´â˚Év†ÀXÃõ—%ºë’pî“Ó⁄·1Òˇo/ﬁ”º≤1ƒ∞Lut¸Vv„±ç>.˜˛∏H~Ωê“Æ`≠áÿoÊré¡8ccLÀÀî—¯@–ß	Ù ÏÍ§e7]À∆Ÿ6Äf(v©H*Pêö‚Tí
	d≠_	@˝_m¯¸ºˇ OπßT,˚˚w‚)”ÅRÈ;lÃN_Ÿ	¥ˇ#ﬁÇ˝cbú’k9Pî√'+Ù\‹WI’[§—Ùú~‡)`NhÎ¶;ÜU√5.:°î>8©†"p«Í˚ZÂÇÒÒon€ñA˝Ù†Ωë°§@-"¢Õå¿ñVˇögË|¯Ò0•∏!=D\àGaN.¸›$9<‘jyû"˜ÅR?ˆ⁄«8TÕ™Û…„˚!?	O ‚·›'8·yC9ˆôd,ze6yVøEˆK:76Å'ùüÜ¶±∂Ú 'ë:üùÅqﬂ«Mπ%@⁄©-ı¸=:NyÆ∫ØzÇ’rÚ3…Ù”DJ&æ§Å1ˇCÔ’e5y∫OÑ:>Ãmå,ÿ]À˚ÿœ;t⁄⁄3¶÷3π»ı˘¡∂€⁄7 ÅÇ»±Ó•d™
X.‘gπ‡Kw›•‡ªLÈ|a™‰Ùö⁄Ø_HÊ√OL+Ôó|tb´œ‹&Mí[Àëa*%>• °íyvf∏‡º√î/N49s¬Ò*≤íÄŸ€ZyÄX‰°Pôª@á¡Ç\≈ûñ¿œ@3«a?Í†tbÀ9ñÊû¶«j0ºå¡ËW(¨¯“≠ó”z9ú∏¯∫ø&ÑÀ¥L\í§Ωd:Ub˘ÎÒfŸT3!$ﬂzmr;*N^8ò”–©ƒ-[HÒˆ–X¯◊ÂÑûsÈQ=P¶à›˙≠øc—s’ÚÜ_ÔìtF∞pÎ≥Ô1Œ
›‡v¯ó˚xR_uâá≤∏E|ëAÈN `˜¿ºy\«÷î0(ÚKÜ2†‹†úHë%åÒÅvkŒ–∆ ïä∞ò•C∞o>±∏z€Ó`‡vç‘{¯Jìê˚Ã¿?á÷äjñ™Ã\÷¨Tâ{«°Z∏˜ä≥f*æP§¯û¢·å4Ä˜’ﬂ"®ﬂIc°π¶#§äB(«KkΩ[ŒÆ”ÅD≤¡ˆê∑(•åa8W°ÌBzho3YI“Ì†¡ıà+™ëIUa‘Ä1‹[„.ôQù7‚Z>äSõ¨ΩêÓMßoAÅ+Ó‹÷°¥’›AÕ˝q,∫y(≥Ü˙¨>·ù;°éAçÔ±ûé¨√7µ‘˝hT§œ¬À„Q/ãT•<Bøï¿√Nú≤wûAq˚ì>ß}Ñ]Ì>‡äB÷'aƒ3‚L#z˙4¢u…±Î‡*tú#ÊskõF<FˆèQUì>ƒ¿<ƒîÅÃ∆CIÓ–ÛèSÅT◊Hñ˙&!‡it‹¡âÂ∑¸ÿÉ£ÌœràJbó1J˝Å˛Ω–…câŒe|˛4+‡‘H¶ø‚'„h˙´ó©Ω2V‘Y‡y≤íàOπ*·t0Gà∞_òU«‚3ÍÚÜì°—ªÃ*#8#©‘é<<ùÃ%’‰ë§/T⁄Í•bXûÎvsè*ßLûGIB˚Wß9ö5‘’_âÊ(ëµ)éòsˆ=∆™†\¸3FF8oÛÉC£≤ﬁ÷ÒvAë	¶Ç–Ap∆:” E['‘VM+≠Zè¨‘'B–ÈÎªvÀveî[BÊäM8±.j>YÿøÜ"…πÂ%É¢æ≈ˇ&5•ÏAˆ»∑ÿ’c˛jë1«¨jŸƒ`Ë∑»ªCÙÒ¯®‹_sË'åú@ŸZ_|ÒaI/û¢ñpña.Ch0≤~¥˝√øæx¯Ä‡/œ≈¨yDŸ'b˛èô&Y]íáä sü…¡ﬂ1 '°Ó°L‰ü%q∏œ∫¯ûuFâCﬁy>Çy˛Ωû»AﬁUv˜Kˆ;›üO•%G@≈ÿVˇä~’Ë∫ôú˛v,FèZÔ«"DÓæò˘¶¨äR«/ÒwÊ&uªz&Ô˛ªQ˛nZ*∏û(„Üq≈:ïe$˛@‚ŒÙ÷◊ÏùúAg„ê⁄µ«H•“·˜·=¸≥‹¿øq](€∆¸;Ò◊é˚	n¸SR∏∂±9%WV}Ó»ùz∆ñqö‹a≥πãﬂü®+˛X¯ûq%Àc!P}Õˇr_vyèÎ
˘ÁÁ¡~Õm! ˛w|Ëª?‚≤‰Ò!ıﬁe◊Ö£]—ÍüÈÒï“¸Í|√ ¸sf»"Ö$‚wW“	˙w
©ıÜÈI√nzˆ¿ÚˆIÅâ∑n∑J8{Í«≠πœ‘¬£∂˛7–B"ö8'2µÛPÍ∞kÅÈèˆ®Íœ£è~ûgw8∫zæÖùiÁS.€+Ûnƒc˘r!aŒÄù≈ü 3Ç9û2ÄfGÉcQ4.∞Å‘Bw|ü,u:nì}_n[ûI(<Æ˙ôv˛4kÁ¨}M°Ñ)Ëòï˜ÈÁmß™'Úe´9ÏˆU;ı+Wxz?éôæVÇZTßAæ‰√p©ÃåLxºÏQk‹áS¸i?≈}«%_î”ÈK9≈U∑Üµû3†€t⁄’˛Ï∞fJzﬁÓøNòÔKU˜kìﬁÃ °lXWGÛRIy÷mâ¯cπ6	z≈⁄ti	6n$mzÓQÂ˜,=fÖ=Gÿ3uΩû˜ÈùyÅ,ˆWzÄﬁìò4æ(•Î®L1OÈi,Ä/∆:OÉ3m~FÎ3m~“e¬Ï&{s&Èı”¡LÎ+UŸRE
$ÆÌ_v=õ\£”D¯ójÄ¯kΩ"JB|<f}ùÕ4˝_<¸⁄L”/ïELÁ˙˚‚nù\.
+ÄU’/]’OT3Ä /¬ ¿◊lø¬]	4·A®Qm9@©ÊÑi"4˛_è(§óÅWœ∑åvÜ¢CFà ë¡€ß8y¶îæ£∫&∫ ´&ó«uy&,
|´ÿËüq∞UÏ4lÎ>óÔ8“ ˛5Ÿ Ùù¿ïØDÙﬁs6ˆØ8∞D Â3ç›TÄ·Ê◊“PpW‹}"=*C´ÕΩ-·	ñ»ê˛˝fªa˝¸´∫.øA9˛πåå¯Çç<p¡;”˙gº˙4j˝πé_:å´J˙L€ˇ#“ˆõ'πAÍœ	¸ÍymfMMûÎÑ‰‰R4‹.R∂u2‘±å„´õ‰˝µ’»µM≤ueï¨¨n±B◊ﬁ_›ƒﬁ[zwUü”|‘JΩ˝¿ˇ'ö6ÚVºëò–;π(àLöNß– kWWVˇë¨Ø5∂†ˆ◊äÀ◊÷Øo\%W÷ﬁΩRºº∂≤∫æ∂ı!Y_˙⁄ı-:õÑ>S´√≈r}∑≠^´c7¨[∂/π@
ˆ"Ÿ§|‡†tŸı∫´∑lH¥úQ .AÍ|⁄r≈ﬁ±ÜùA!µ8ë≥C
oÙÏ=ÒRx∆˛ñû”Ö Jñ4\õO\ÌÑ
ê MÙ≥÷ö ®\Â€—ÿ/¿êab/*ÿ¬…Ÿcù”=Ã™ãU*ï”m`¢ã$e˙Y@9‚E¬ãÂE˚Å3{¿í¿,QÙy˘§t_≥∫¥{-}á¸÷ˇb0>¨˝°Ωüı4eN(ÍG¸∆|œÍuœÜC–⁄µó^∂òb}ÀÔY]∑lzP©,>bÂ«‘nÈ¡6–ó.M›µaøÖ  z®ÙÄDY:Ë<Ã™a»≈ñ(8µ.=±;TÍN«¨†4E√‰ÊVÒÕÿ¥Rœ›£áƒÕÙÅ±ßÈú8ÖÀ¬bßµ»ﬂı#¬ÂIH	X,œÀï…q ≥ÏØ2õŸﬂÀ¬g9¶jˆòÚ‚suˆÂ†q6é≈∞ÙÿÅœ”∆? Oöûçd¿Ç>bƒ »3ôNRy“ô W¯L«⁄MiGõ\Ø^!cNfl9C5ÄêÙv
Beu)Ò$´°@Ä…Î˝¶Kó{7£Ω
ÚY}+Äú£!ùúL€»îm>L·ÀR´Ω∞+CP!ù›EÂ´–∞‘ô∏9ÂC÷A»_v;√.ù)ÄPÓ\ÂjÂ√Ù∂ïŸp’ïæZZ≈ó∫ÎŸ¿˝≈()πAíU√∫ÁÑ=w€ÚÕ4⁄qÊ◊H»’dµMÙL∏ßh+üHΩÎ∑®P}®òuÇ¨˙¿]0˜”‰îŸòµczÑ:ª_≥˜$∆êD«¯éÓOÒ°-µZÑ-utÉO1í®ù#‰m•±Êa>Ô¸%%cöCàà.ˆpÒ∏Ê?I'´ËßÎ¡E¡s_’.A˜QsŒîD!ıl‡‰’/N”:∏∑ ¥’l=Àüx-‘Å2«8V«'€v«›É
sÛJq~Iü ;îÃ∑ÈqÁC%√R9ó	¿ò®Àjß4q{ç·v◊\8àÎ
uŒú&ûëX'©n@û∫Ë$±2∫¶RÕ8çÇπ¢’∏˜˜ÈÜQNëø¿l•”∞VoßMù^80Éı¡~ü”ñÏí*pyº∫ºQ„[Vgh_–ãùF∏Ωe
†ª¥õ¨â≤êÇY.êÄ]F∆ë j÷^¬QP÷«––ﬁßc∑)EµΩ∫Ω˛)‰Ö\d™jzTZÈßû+¶·0p ÿ•›“4Ÿ†l
∞JÆCEµ¶»∑‚£óm√ﬂqõî{ÂwÉ:P¸ˆÆZ¯I2QõÿúÆÂË]çµ·fdR”,G˙£¿3R	·ı"GøÁ¢åA˙R ≠Ã #è‚vˇ+FL©k&(øG≤ï|ı‰™áí˝1,äÄ(jîÕ∞k›¶Õ+¶Õ»!H∞«IC ®0Uú2'ã'âÿDì$ú(≤≥H„Ø’y,≤8"Î]P÷Åôºïc'!07À≥-3*‚π{˛ÖÉ⁄ë∞VQ∫'ÚÜt;«≈“§∏–∞Ä]Œ”‹U\É@™ø´p:‹œÜD‡ÄNÑ±ª‹’Ø?ªÈÏ8M(Â;ÜMòõO\è4›.ÉgNQ "E†˝£‚´"K[v≥›söPG’Ú¨ÆO
îîÌ8˛ ¶7;∂’#¨ß:ZŸ∑®'IÀÚ€v+¶TÎCe(AÂjfTÙu	Dé{ù∆B∫‰n&P::ÌÓ∂!ïMtzDÎ!ÉE0®[:1?WB˜’«W
{ˆTÑ¯?G¸5ˆ˝Å›e{eÉC≥!…4-2c“ôâáW-á˙ì]»ö≥$ t´ŸÂ,ﬂIâ=§ùñ!@ä◊Àì`td≤¿cÛ%Y¿wº ¨LO%„3õ3G„Ò'ú}ÃÓaÓD?⁄—'¨+ëSœÚ)π⁄7?¸‡“ûº6Dˆ)é=N	ÆAm.„2Ÿ.M#î>éêßBaû”j“hux~Üı4Ú´Y"Ùƒºà“aˆπ»ﬂ»3ß˝ÕÀn∑ﬂ°≤ïñîëÒ0Í‹Âc˘á@i,"—Ò8‰~ Ã~\`{Õà„úóÑø <ùÏÔ§wLòx˜Ω%e≠‡ÓqëL‘NO*øÇ.‘;j∞=(åıp%Priefæ«M“„ﬁ#Î#‡:Md›®|~‚WŒ«yL<ö—©¨‘fÇó„´s¢à8öì¶dPÔÑˆ∏B·«3™:Æ„$<õ»+$∆ºJˇ3Ù–“,r}UÎGäπ	Œû«ç∑“©Ókc◊∏ÉàÚË—ãéyÉê%ÆãE˘áÖ±CÖ∞Å≠®Ç∂œ¨zı˘Ì·`ê·F+.Ü>é⁄l/"#-V%q†*lª∑loë›™‘vjïèl(z‡∞ME¢0∏4áûÔz≈æÎ‡bpœ¡<[)QO\Y∏Ji÷dbÜÖZ¡ˇ∫˜~»UÖ:OŸÏQ]·:ä{·o±!3oá#µπéKçÊÛﬂcóﬁ¡0è”„S•’ü„cß´FföﬂÕt˜Œœ0ƒ3‚4€lú%Çgèòí[z2uúÊ«≤‚‰¢◊h1.±>Ú˘∑á/3o˜eÍ˚®π'|¯2ˆãèΩ/óó|¯ „3ærx–á/s˙ïÊ]ii Ú(«ñŒ≤	ôÂô•·sÊƒ∑ê6Ch5›éÎ˘ësÀÛéí5Û±»FÒ\§¥[ÜZú„<ñÇze∑5`4ç¨Û3‡DkÇù⁄´™aæiÿ¬LõGâiòGLC=gLC:(∏õm{∞g€=}nMÄ‰˛∂ë9ÿ,ä‚8„(r:«}‹Y÷qñ˘Ä{ÉJFÄ¨;æYW≥(ÇQ‚∆kWr7@Æåg°l4!ªTbË@h	ÖYÁñ∆G¶^˙\¨Î#ôvCı˝´– ^‡Ãèq¢ÊáènÃ%eË—_≠¶’≤ªNìt˙+%2∂a)X£t-¶≤\‘ı!.¨¢$"·
 ë∑o∂uÜ—ébﬂåB@≤6(Qã<3ﬁ°&xTHhy^c˙®¡íöq≥ÜÇ ±”°∂iäìÙÑ»òàF Y$!≤ô ú#˝h4„qi’∫÷”≤g+Í∏<˘öC§ó§pYÕ»ª¿“≈6÷Û‰tMxWM”=%mV‰F8V#_⁄Ÿ§!f,Ge6y∏zøm’M˚•ëy´ºÑVÀÏÖLCe˛B”Tå9r˛≤|øÍ$(A°(S‹'¸É&È¯ºzƒöûÆq≈<¡pjMáRË€πƒ[ñ'¡ÒπÑªi0uyP “0=¶”2ïc‚Ç√–´í&7Êc:ÃÛ`∞;7wÈ±÷◊H:oÊœId)6™ö√ôYƒA)ã˘*∞“„óû™ÊÚ#ïoöÎ¬Ûd$E[Ì∫±ëá]ëîΩÄ™TÙå“s©¯Á√ëì3√ÏÇ8˘)©‰-&iÕπ&Aﬁ[π˝ˆïW'-îôs´“Qíq-∑q^È3ó÷-∏F—øWDÁ€ÉFB
≠GÔV qEôb)ÕED=ÜïFX·’2t 3ávJbÌ˜Üª˘f‡‡d”ÌüâöOÒdR%¢‘cL€…cú•˘ZüJ”◊Ë‹n9ˆπ2‹Œô◊8a£∆Êú¡ïGS£¢ìKI∫ñÚˆ∏ÃmÕ:˙≈“w≠€≈Ω‚çjùµÛÜ=H(-` ™õ‹¯®ùR~ÿœë*U\S`“8ñÖ´Enƒƒ‚pe&G·m ﬂ9¡U8È≥ ˛Vn¥myÛ&œëæì=0¬'b7«u†•,éàóR˘<RΩ	Ü#Ê±ë|‰#-ãF∏dµvÕa¯˚åV*/Q˘‹tzËz†: úãÎ¿2@GP¶ˇ®ö°Û……Ô&0Î√HÓµùõ≥UJâÔ ≈ıQ˘ﬂ≤p‡Ê=‚ò∑;C[ø(£≈Ô#:∑¿VˆŒæ)›≥π˚ß2ƒ—*:å∞TÖ$PIHŸ´t◊˝h(ÉπE_\°óÁ|:/ëœ„C¡ûÅÄÂÒ€Q^u\bã±ÉKn8•s}üÚ∫3íÈ]kÊ>‹pƒ?^°(ØÄ*u ã?‡• a„}.cHÅcÆJÖ6Ã-ÆhJ;vÙú`-Í“‘ùj—Fô†«ÿ—"O«ŒnÜ◊V$ÁÖÅ¸Ò˘’˝ê•°çH∫'L›ïﬁÚ¯˙®*K O€iF∏º¸\Zœ ÅùÊŒA°è‚&\ÃaHä„y\ÇãyIV{¥Ná"q∞*±π|vÇK:aó™”Úà
7$ÂÏ≠#’#	;ãd´q|äªˆ	Õ≠”ê+SLëÇ£°_sG'Âôqe*o¯‰àô¸É‘íË]y\áïˇÒ~˙AÊ I>È±c
öü∫#äÆrÌÑR+6»Ø›1eËîwzúËÉøøb4é<◊◊cäq˙√ãwå”®J/è'ºƒvÒ5ÚëœdOÊ¢ÛËÓŸdﬂ»?ÏYΩ§”l±MƒÇ}2gı;ìSYu íÆ‰˙;Náˆ≠îàx#0Çfe›O∫4i∏ŸÑ"Ÿ¯MzV
˛§K[,Cµ„é∫`„Òàéı8∆ÆQº•√◊hæ”·kdOÍ5¢_ul,G≤_£˚\áØë=∞√◊®˛ÿ·k¶üÖAzµÏëñ\?#èï/Ú\ﬂNgå∞EŒ€ü6÷hÀ≥¸vı8x£|Oçdk —⁄∏ﬁ≠!iæå+‚ j∏YÕéΩ¥Z‚¸°,öˆß4≥m∏»X„ 5^mFS(≠∞’∂âﬂv˜»v«jŸÚ¢ﬁ≤:XÏ®«¨O‡∞∂„ÙZë¬[I5‘R +äAﬂ¢t$•N%îq±}p§Á£⁄‰∑np∆Ë#ê}o|î¸j÷S´~Û~xπiV	<÷QbO#‘Œ~?s∆~? ˙@˘CJ„ˆúAõlÉIêëä‹·$H61H∂Èvàﬂ]ƒœ˙95≤Ù˙ıÃ :QÉPÇ îq–HpôOL-ê‚ÌÙâ•Ã‚@çUÓëiﬂxœıV|zÕIÁ€!A<;ÊÖÆR‰∂q à~ΩÛ.]¬@ÿ…ô™Ì7Ï™”aN8≈]` x±f⁄µc®¬Q6¥lÂrGg~`_¬ÀlAÁiG√J≥ä–ˇ∆ããÑﬂL+∆RR>‚ıé£µW’"‘RãNìxmÔœïﬂÔ•¥Îsô˛RM·1cA˜),8M*ÑSVçt≠ ˜köıÀ≠¡Ä FH©ËÆï]˝i.D;]œtz¬vZPÁú≤à æÕ6ÀÃ¬J∆UU√Poî√à≤vˆt¢I˘/¬ë¢≥QˇÙ#ä&PêÇ‘Y∑2.yÙ bAì!¶∫NYÍ: $ç BŸà∑ftx—cï“øuœÔëªìITó–Û…U„˜LCñL¯y”`“∆÷“÷ZckmôÚÇ◊76ñ6?$õî%ÃÀ ƒJwu[JÈÆnlvÌXv‡\q©≥j\™∂Lj“D—Ü c{GÅÌ—Ê≤Ûx‰ÙÄ?›∑Ø‘—Œ—¡Œô¡≤a8°iÏy(èyNÎ©'»›K‘3„Áø–˚,`ê"xá,SäÔ@bﬂú3Jö0@:Ô≈ÖP0;÷Â<¸¡∞Öô π˛ÿGjÆsÄöJå¸BÊ·Ê‡ÙÃ"’Gâà<—òJKg◊ïà øŒ«ÙH¸ácA‘eõ[ñ˜∫·Í#q˛˝k˘˝ æ Îˇﬂ _´ûÕÄõX∑ œ‘?SvÁU°≠™0	XN™‹Ã⁄™f¢j∫kÃÕu¸x⁄h;vßı∫aiTTãäy,v®W\ëi≠wÀŸu:÷¿ı^VJ6≥≥rãÈ·é	ödÚ·[WVÈõ´´dcÈVÅ!'ÀKõ+2C´À[k◊Æ6»ÊÍªNZ]!ó>ƒÆ7V7èŒ™á™Ïö≤Í?√î*%*]\_YΩ∫≈4ŒÔmÆ6‡K„ ÍÍ˝∂F?øwQ◊úÌyq4Bñêµ&¨πåh'G l9ãîòfD‹ñ"z<SÉ°OtúœS∫6Ø⁄∆2".2çc∆˝óùéΩEª◊‰∆Æ™‹i}¸ÆñN>|X :ïoå®≤b7§DBñùU£m€®	0L”cú4C#9	«•(àA!ôJÃgLy9ì"k®!`9‡@ç˘)ˆ˛oÀùñûs}ÊßËfÙ{º˜ﬁWäÔDœeätvgjû?≤ë±æÛ⁄â||Oe†·g‚A∏ıÖ–u~CD„g¨ñ´ ≤ﬂ0˝ùª˚5œêÑ∆ÿ∏øåµ¥<‡/]Û*sÓdH≤{6<•*”ŒR©ÑùiYNg?¨îmRÍEòü∞z˛d;EÆ¥ıËÈNò†’†ˆÉºJ≈êT…Ã&lÑC˝ër‚+J—>ËUNV"…√A(NsêÓÒÁ NMÌ√Í\Èò™o˘3ÉPU»chπ∂l;/ﬁ¥Ö…ú…2h›À®GÄ íX|˜e∞Q≤Xl°å_JÏ7Zß‚()´”XP”C/ûhCDz¢ÎÑÑyY≈.Tk.°∞›(…èPëêúõ∏»?Ω⁄ˆS)ã+ÂóRΩ«®ÈIBÎ@CD¯<Ch^då©a»≤K·¡~EXÀqxÍ˘sçÆ(¢µÈMèÓ}äi‚„ë±˜ΩˆæÔ4È9…?π√k@g∞SÂÀë;^ÌÌvø=që8ráó(»v¨âãÏﬂB¥∆\M¿<xb§Äáô≤Â9ªªÔﬁCæÙ=œFô∑euLªhÿ»–Rˆ]BÜÚ®I=Ã–ÔÓ˘d2†Rì§Eqºå:gc]Ã∫5ÏÅää\ê]î(ZÌ†è√•˝µVayÎ"6/vx˚¢ÚrCGIpëΩ”‹Â?ÙX©	;R0uœ$vá@¶o¢Î~’sŸ±:M3|–Íÿﬁ@üÜ_'Ù|™T_˝í•ã9a˛ö…Xü„è‡-*≥†Ú1wˆú^À›É_ç∆˘#¯ºÒ¥2r
◊‘D…¨l1[µrT∂°vE‘;§;(÷≥-#¢Ö»o{£kõíΩ>Rù¨DmÑ'Fú5–&w] £Ø6ıÚ’,®}2“ˆ=˜ˆæp˚∏Ñ—@t»z–±ˆÖœ`øY•c∫Ó¥.Ld–5ŒE›Yß’≤çBÍF:SÕ∆!/S–∑("⁄ˇ2¥Ω}&Ë∫^a≤¥„‹∂[ìSPÉˆ ÷∆:'ËfOâ‡∫ã	ƒÿ“⁄≈v€Åze”∂ö~»Húc
Õâ¸ßı?≤∑Á#3™g@ô2q—åØ Øñò—aÛ⁄ı≠µ´`UŸ⁄\˚GiuÿX∫
NÔgFáatHv–ü…AÔÄqÚMèíMQ]<K(‡‡9Äù,U)cxm
…±»±@d°Ïóß5+.¬≠·äüähx_qe˘„4∑S»˝x*W¿\[–«\>g:Sôè‡±∞&‹œv…~ƒ<ﬂX∂∆E˚∑‹ıT8úﬁG[»”¿ﬁ1^Õˇ&ì¶–≠n˝´È?M‘qktºnSﬁó5ZËßçÅ⁄¬sªD~n€}•™¬kpµHã˘|”Á˜Oú∆ﬂ@ﬂŸ@€≈⁄ëˆ±`Ä<
ÄÌM®$®ÊD4Eïê≥& ˜¶âÉÃçiOú3Ê–vcáD4x'DòÂ…gáJﬂ5kc<%cæΩíœît9\Nî2ÇBzÆ◊µ:‡U–À˘éÉiÌJùÁí¡≤y˘4-çÊ€≈ÆF≈}‰N‘ı0^‰Ã,¨QZ¢Mw•ÙÙ=íJ$yºÀUWÑÁ—˜| I˚ŒnœnôV¡U0MÕjBzöt`°¯∆ç#©öx'yÙL∫˜NiGìGõtd%Á0Á‘ÖÎ<SsD19äºAd¢	Wd|ã+bÆtº˙s	±V"[´KÀWV7… ZÉJáóÆÉõYæ≤¥πEfò¯∏r}ÎC~ÁLV<≤bíá¯$Eù…óˇZ“Ög
y%5—ì¢√e´9Ïˆ	z˘.CD‰k(5ÍDm¥âßÖærÈ/˚ò±4h`‡$ìiäü±‚√˙Ωy,â® $Œ ºêìﬁê ö(VFCoCºW ©éW:‹¿] µ1“váCW◊úÿ8–:;¬•\RHÜµTåÑ§[Êã¢§`^}xù¿N†H®x £@ÿó@òO‹ì”+ãÈÂ¨L£=à¢ÚhR AÆ¨—ú	jïxÚé´˘2Ñ∫IÀp.óGﬂÁπn7ølõ/OOÆö&R&n	ôÿ∏¬≈qƒ±†è”&G	˝ê\ˇ¿àl!ÿQ‚nŒÑ‡Ñ`@GìÅYyD`Õ[ßtCy©∞‡¢˘ó›ö;07G*ì®ï_FœÅ´ód≤_ælò∂Ú·’•çµen1›Ä ÆÀ◊67»∆µïÎÎ´r˝Í
ï†!-»%6ﬁê¥J’0&çùq€nÉäˆ0ƒMÚñ¥Áó·’BÈsc)î>ÇÃ~‘ÚÁ#äô#HZ2Ë˚>|q,éÍëæAÒü‚»≤‘í°ﬂ  p}q·«]Ïú3ﬂcHŸî3iSTû˚,^Ò@Ì	±≤˘oEh∆]ç˘í-¯Ø≈[ÔkñΩﬂ∑1&≈-ß«»îﬂq,I\ìuS)Åå>0Óâ®ù˝±ó:œç*RRÂ	ÊBÁòowù∏gıH˙0)µôÍ∏bn¸<8é3%r;¥πﬂ
@˘]∏uÿyülAÿú.¸Áù^hÍøœrõ√lLΩŒ˚îµ∞€tÆ∂wa¬.Ìñ»g¯3p—¶|›⁄6ÌäáÙÏ=N4 o¥¥v¢∏ÍQ&/êR©ﬂ¶	À"	GêCS!GÀµAi8ñ§+–6$ÑP qL)ºöq‹ÄŸ:õ1T∆J¡ìÜVfÙ9H¡âØè£@
?†º8–¬‡g ◊ÈE ç”À§·t)F˘Åì~~T ãtÆK§H ¯¯ﬁ∆—P‹õéu‡g®√Æ”ã:©π¡‡∏,Ù¶ÎvO:N¡Iµl†∞aóëPœ}ºàØ8C$vù.M-Êo◊ÛÓê6=˙0Ê·kâ±a2Ò∆üÑ"Ô{)≥ê˜ˇIG·Od=Ò@Ü~É)˙:6ƒZ7yuZËΩCGKv¿±¿√<Jå%Ç_tò¨k$í€KÏ1]B¶Io=œÓxñ{Ë√8K~¯‚ôÓÕ´˙7~@lë‹†+#ü&H1¬5Mú÷"ππY|Û x˙Rœ›+Lﬁ$áæÒ–¥ZÖY;Me(u4vãºô$‰2[πpö∏#UéäSZ”]íR∞y!†VŒ¬AåSö‘0y∆] çß}D∆œ±≥eíüÖCÛE«MnõM€˜7¸]π
iQÖJVπ~áÈÉûE
µEØÅ’táÎ˙F¿ü@ÚŸ†‡<‹óPhLÕË‘@x†}d*ÛË\''ß¶I≠\.∑,uı≠î„ëHÈñ0m"Y‡≤í†è«ˆe‚≤…
˙}…<è4πy¨[∂F„nî‹ÆôUiƒëö‡áπ¥æ~my	ù4œ9/ﬂêuÄ”∏Æi=Î:-H?C%ë(˙ûv£NöùÊA®åFXî>~°‰pq√ªåtß˙jΩ”a1ƒ2jxwà©Ÿ–P] †,m≥≥#\ÙŒ¨9Yœè[u†A1}n55ùö@ß‹µº:Ñ\âôÅï©≈/πQÖzsˆüâ;@ùWª}®‘Ee,wﬂ∂y˝0n^Ñª»Ï‚ÚF≤9ôótd∞ò©¢h»·ò[^!DY—®#O7-à≠≈J` {G~,yn«0ä¿èÒ+Õ´›ó™‘&– P∑ ?I†%≥J%–%Sñ±'d8´ìÔãE˝ÈöêV±XDÏßO-∑]◊∑CÁ(˝Ò0oÆ®É â–Gò~ÕÎ%ÃS∏
sR!0Òb1Ô¯Lıvyr^ù^ırË¯O2Jb«I6J ÛcIÖ>3GÍÆ£=ë2TıD¿øﬁ™≤$BKNóe•VÆë∆`VIE§3õJpùNõäégFï=~	ïØƒyı@p8ﬂ2¶G√È‚‹RNáå1}∫jƒº5z.2f|-,ºÖG≈´6Œl©Éèfùa}úN˚{`°‡…Õ3+'Ÿ<√ı-<˘ç£˙˚c $⁄cíDhLéÉU!ﬁå≥I˘L7íöõÓ^n#å*®Ê∞ı®Ç©˘c'¿Ób^≠∑πhuIñówÖín?bw‡uz/2Ñ?{$Õ.AT´{Í’]¢Ä†â⁄Œ∞√p9€~C≠xNåAì‘6X9≥lÚƒ°>R-ürÜ∫ÕíUBp3•~™y`íJHU…Ú(€Ω¶’˜áú(fFÒÏ§&©B5â@uî€ÓFca ^AM‡<uò≈fáõKGãL≤sÙÅ0ˇà„Åé√» ©Drr8Uò“˛§ï'Œk∆@∆Ó¿ë€noY€1·˚/ƒíb§p2„Ãò'`GÆ°z
X'õ◊ÿˆ·Y˘Eƒ_$eäˆA ¬hÁtÄ\À‰V±29MzÏ∏ºÏxÙm‹$9‘üÅÚ±jÿÜ”2|®¶æ £Û«4OQv0q=xÇÖxñYXñ»≠‚D€g,—≤∫D¬3#c™ÀÍ˙∞g≤ü©Eüôœ~¶}f.ˇz˙TÊ†k¨hÍz4äK¡;ÏQ≤î5“FÒR¸©KŸO-«üZŒ3√ô¬*hóüt≠ÀîâÛõï›=«J\lm∑ÑwG@ÒCˇy˘d/Y,
xªÉnº|_k!Uü¶-º´'R⁄õêós8ødØ¿ÀœÚlÜ'∏z~ ®¿Agôä•=ﬁ/‹uwœˆñ©–Zò*y6Íä
ì¨{∫?îS+—µõ( ˜~UIcz6W9˙“í”kvÜîﬂ/ÑÁ=Bh¯V–4÷K¬í∂gπmS.ë£É®î)v*§[ë5b´ÖüFJ€√Êb∂
≥î∞Üñó~èU◊=à;zººBaµcÉº
»8C|ÎFpJÁ.à›OƒÀ6>.B◊hk∫XJ*0y	cÚÙ§Ë•ÏœÂ≥bÔX√Nb›‘WÒqÅ,#®©Ç[‹Oâ/t≤∫jdıî.WìòY™ ∞îΩ…ö(øo7ù*»115Q‹Ì
®GäXó¶p“0Cb)ÌñlπÿπVÚrQ8πéôw)Ÿu0SB√à1f©´Ç—éà$⁄+9åËFGA˜!Y/Q*ïºdΩ ”SÑ$≠ı~∏Ò~r[æÀn+Ù¯8yuf)E_¡üf˙ê∞&?«úYÉ@ZOnÕÙ AkPà$1ŸÏºd+}Hyuùß\Ù ïW ÷ΩyõJä" Lëbñœú	Àò(ÓI¢bÖﬁ˝˛ãÃgÍVB^≠@¯d¬iU’íàâ•l‡¢“.≈¢ûùTêÅëU˙;∞$qwÛ§’cÙ7ÉÄ£√ÓS¿yü≈8;î¸àd cåK
Z∞ckQsnû·∏˛ É„)òòH£oH´á•èÃàƒR´%:˙0¡î‹QyItcdè¯Pf›†3dìvX3ãã3êŸ™ìÈá˛¨¶tc”ˆ°ÿÿpª‹±∂m∞¬
–›Íﬂi∫_òl{Uå⁄>vÕw›∞5@~AπaÚ4`BÅ*ÂJ #´~£–£õî‹|Õ_B÷ò∑ﬂ§tx«¢T^œPkîÍI§XØlO åiRO“¡¶Ë{3é∞Áﬁ"z'∏;19˙F˘£îaÎ÷893@£0…≤Ëõ¬%¥ﬁ7JY æÂÅO˘ PocPı0Ú€6=tƒ»h/¡-5{œWlà0åÏ:ú˝†uÔÌ*Iÿçî=QÅvΩ„x›ÈΩ)Ãèd∫˛Á“œ
B.J´+Dïûæ<å©∑∞ù<¡ªˇ ®Û◊Häü!Mø#3∞=zÁ&•À7ó<õÏªC:Y˛aœÍaKóuOånÛÙQ»ÿ™£{Áfäô)Ì®:)xﬁ†KG±≈ÏPe{®Âº˝óÕoÎ◊‹(8L,-[Û4Ûd¬mù¨äÛpRD÷‹¥û?íBÔıœ$⁄9NÇ|gA˙i†˜(—”–˛lm¨ì´Ó¿i⁄<?”y‰€ä‹kî≤§ÃO©ã˜÷∂§ÌyëK∑o˜ËDß…‰/∂)p~ú4e‘˚(=L•j<2tø+ˆ¿r:täAá≈`°óàI?©OË›¶.®/yáƒêÆ¸D"Ñå>·¢§ëÚ-(îÄ}≤Ïì}µØDB—≈ú§Ö£‘S—IzÔìy⁄O≈á∑é¢iäÏ=ˇ †1D
›L¿¢Û/Ÿ<y~ !O˚ö∑H*˝€ƒw;t“‹nÕ⁄ï∑IüiMÈoU˙#8ÆæÕ˝:Œ.ïkYÜ”∑ôì¬é’u:TÌ∫=›f˘˝=€Ÿm”s‹[ﬂ&Ëñ∞H~Rüüùù;˜ˆƒ≈7x@úüV¶JÙç∞¶™i ìSáÁg≠1Oc¶ë2¥ÚNeæj·–DM§mÔ"KkÕ_∆‚Øú_R…BÎÇgÁÍÛıÖÌH˜,á≤Ïp_§==¶π•˙'á¶—r¸~4ËuıBπ¨¨	zíÚ|‚u|◊õ!Ó“ •ÎVímT∏A±‰]Ùí)ä^v*;≥;ÁîeÇUöÉ˜pﬂœj9Cë¿dà\ßá>µ|Y∫ñ∑ÎÙä∑œ⁄M\d:eÍp#sÍ«Àâ()ñm^› ä]=W€Ê;áπù^Ÿ∏¥ ¶€≈ÚNkßŒáÃ≥≈'ô˛ñ@˘nNï˛Ÿuzå˜–∂P·íÃèΩ÷€B"ùmS*ù≤|m€JY]X_»JyÒ⁄Œé”t¿[Ån…¿Ç≈Eù&âŒ€ß"lW∫ÕœúnﬂıdËu
ìÌ¡†Ô/ŒÃ¿Ê¯•]◊›ÌÿVﬂÒKM∑;”Ù˝Í;€.¨¡&.Ó—Õ˚Â–ﬁû•ˇÕ—ˇ æ`/œïÀoq∫‡ÔY˝,GΩm∑µO¬¯<âÔ†<ìoı¸¢o{Œé]ı≤J#8(kAØ∑	‚qõ√[•4˚vÜGrâÆ7%MY·¯Ä®ØP/`5óÜ§TêŒ@›ã=ß5hSpü-≥;@NIô@˝ãÃÒ^u#¢o%-w∞RmV7¶*‹Ãx#@,æGá¿"íﬂ@U[SÜ°≤MµL;∏â√ÎªÃ]ërLvÀﬁgéé [Æ€)v‹]∑®ƒì8bgI≠™yÂBà∆s‚nˆ6ƒπ+™s1>‚úéû…ÌÊ}4AÀπHÜ˝æÌ5-üNöäé wpí·ÓïK≥;≈GG!Õ Ÿ^G.9:z
ÅeV¸¨»1–ä¡0{(Ä…EL8f5X,÷ê«ƒÈÜr‡äoÉ∫5&ú£ó#x∏W‰±e8˘G≤€Eñ(∞Ë`¶∑ªm ”¯øRya*sôÄÓ1Ú_Y#¯˛6K0ÄpU èbN xyu«#ïäîª}µ¨Å˘ZY.è∫ÆJGDv¨ù¶z∏„äW	ãÜA∞´ˆ¬NŸlÓhëTÊµﬁÍ)–1S"¥»ë⁄7a"‡°P0ññÂS*ˇ`Èë;(6€Nß%…ÆÏ"ÆÃ∫bëÄÈº-§FΩ± ¥É®º¢a≠“{cL∆·ßS•\˛;πx¥Ôé’˜)ºàOaL©Í¡*å∞Úµ"T3a–Ü≈NG#6¥.%÷d]´’+≥≥©ìO‚Ñz>ëŸÕÿÕ◊‡¡•ÆÏ|9tJô° æ!÷gèÌ^ÎÌ¯aêuú8ªE†»¨≥Õé3>f™’DùÄ`∞áÖÿ>ÑY¡„>•Ù,∆‘gÜrqfTBPY%âÚÏ…äIH·ΩP¯AÜqô=é  ≤ΩIÔ>ÌW*Œ¶ÀÁg“eõÛ∞§©Çäå∂æ0Y∑å kı…Ë˙d∆g´3^◊$£UP÷Ï¬D:qÒøÓ˝·k„¢6ÌJ§?dê@ eﬂÊÈN˙Ôp>Ù+´=Ù’hl]_YΩ∫’ ÀKõ´PífuÍæ\ª∂éï++oÔG^.òH›˚)Hy∂ÔÛóCÒûéı±ﬂﬁ∑¶…œ-Øgı€√é3Mñ)é¨]∑∑;iV3M›	ïIú∏Eh◊Æ≤úg[k´[Kó÷Wç¢èÕ)/ñlóa^≥|yxˇ@õ'.ÜÄ(`Ët¡¢ö‚E°åµƒc6G®‚5‚ë%î;q-W‚hóxliP† È-k–’ru.ﬂhMõ”~∞(á∑w◊2ÿïò¢ÜB7yOáSØl◊ﬁ£ÁÑÉ|µÏ	˝√∞≥O*s”‰ò∂Œ¨≤®od)ŸÇñ)FëHóbâ˘iç õâãçıÛ3ÉvÓNT	*ÄJ™Rg˝¢≥˜[d≈⁄Oˇt§‹WÕvoâ8†©Èbºlºåba9$ˇH˝UXËŸ4√ó\uM{L÷ıFZô»˘AÀ".¿mn†£G‚MÄ+PîÉdNQÂ¬ƒ¨ƒ–àÓR«+õ⁄<√ãV>≤‡t-Ø∫j+_∫(¥–ªb–v|µ>¯ ‚%‘©„Çﬁ4âº5Z*⁄ÃÖU«§¢qû≈}±—uVTs19/æFÌ
õãî”⁄hÃ¨nØ^€Z[^-âú©îÎÜÖF„„“´O=¢õc„:ó4¨∆æäìwm ¸¢3∑¥%pœán…»ì≤“dı%…ÂF£ÃHÀtû€ÈPA∆›!@FÙqcö◊ilÜ!{@
˛Dœ…ò¨…§≥òò	À;∂Ë‚˘d¬›6(˝Ï@9>  ø‰1≥IvøÈ9˝å<q¬y•◊q-p“ﬂˆêu)dg«·è¢¿ùU–5CÙÃË˘ô4ÚCE†D£\íKô÷Ù◊Ï∏ÿfÓ£83`ﬂr„}Y∑ëäÈ{lA€FH+º9Ùa‚ƒ‰X´ùl¨ÉÀQ¿P¿7ïPø; ﬂ≈qé_,æÍN&dÀ	T2ùSÙ1æÑüÚSRôJ
∏9!=0êôFﬂâ©âõÈÌUg√∂hΩœjã¶Ú¨Fhúû–õäìBR÷∏ÈﬂZf*?∫“êp–Z∫5CÔø›§R∏o.;≈ÖÈ^^Ω|y"…≈ß‰ánüÜº'mFw˜Ã∆Ù±¡ØSÒœˇ‘K2„≤1⁄Ω&]æ÷uœÅ®e¸r}s≠=ıizl|¨÷¢nb /G]ò∞&ûÜÁJ‡V8†ê¥=ÿÖâ∂gÔLL+„1T '}¸&`¬/88ˇB#◊˝B+÷ïË|ì(ãúê¨´∞6Ö%mî©ï±√›zv◊Ωegt´ßY<WüÚ4)#‚;AA÷H<ˆnCû¬yô∆√Ÿ⁄JIàÀ'Ù4ˆ≥j∂*u§0/—∑«k~CzÓö4È≤‹ßgÕèæ°œQ,¨NR±‰ë"•üí(KSÍﬂ⁄ß$ö%Ì"OvúN¥nê∞≈ßŸ«¿ê≤$dÀ¿OMê[éΩw…Ω}ax—jù˛?[µ⁄∑P¬ÉÓ÷)ä4≠˛Ö	ÎÑrK‰ˆ ^ò®Nê÷Öâç©[R∏R)V⁄ïπ‡+©‹™ñfÇ;≈Rı\≠4_ûÔÁJıJù‡_ÒsY˛¸~Ö∂®ì˙-⁄Lyû5(Bãı|$ÛwIt_#ÿ¸˝˙/3´©S∂Â÷Ó—¥l&∞]3´É `f€Ú≥s]Jßª¬E˜%#√°<‚fπI!ÇÈSjwq3#’eÁj´/z@Q=!…ÍH´aI ◊Èè2`#Ò¡{äìÒìi"<√€ﬂ±¢tU?aπ!¿>¿Ëx’3ëPç˜…¶≈”ë®≈¨ejíÌ}tYûÊJÄé}ÀÓLátô˚ë*Gf@yV¶≠åZ“m-_k¨4BÍû¬ÅS)©d'+û€á3?#Wb6‡ÃjÒ‰øË‰B‘rJj∑ Pg)†J≥'úPÕè¡ä∫ÁòX©r¡m¸HA.ŒT‚ÇÓÙY†`ê]ò◊ZH‚ƒ≈s˚∆|Á≥¥Q#îU¬◊Ç◊r◊K¿pﬁO√∂<Ñ2¢iƒïôIPü5∏4…k˘Û∂P.+‹C¥Z •öÖ#¨SÆ,Éô@¨∆≠Äd20À« √Q.2?~!±°ëF"^é/–Âƒ∑≠Ç™â‚ÿ¨BV~mìöŸ9y—-fÓ{çNÖo9T´Úg∫Á§ÄK¿h?~|•tüI⁄«MˆÒ-gTˇdP}5›"í˝Êdø©í˝&R§ øáÎ)äÏ'à†fòˇ&o|x”ÏúhûZbW+	üÜ◊ã‹I˘©¿ß/‰P¸ÚJâùP!7π„Ô9#x'É‡ÖÛ°"…ÛG yæJÚ|^r ÑÜ˘'óÜe¸ú¯;∏K,7ÙR33≈∂V´+<≠1ß7È2 ˝ò0aerX√tò…Y‰Dãóâ9U‘+îÜ„}«ﬁEDRãP˛ªlü∂¨˙d@U|ﬂ.ŒI‹Q&Ãß∑*µùZÖWPbXQÇ*hœı˛~W¢}•[Cµcåòhı˙U˛v|„oˆã7äxzÖ	±zN~ﬂ±Zv—I›ÏºJ˚:iÎ'UiO9T€WfI•j’HÇ?*t#ÀÑ})WËÁl˝˘ÿÏ’R}vÅéeπVöØU…|È\‘˙≥’Å!íŸfΩTü_†#[(UÁ®ŒïfÎ¥1Âl™ÛuR/ïgÁã≥•Ú\ùﬁø¡sÛ§\ƒÁä¯˚≠8?˚ÄYAk°aÊ
v¿_Qµöq5ÍùT÷&ª~B*ENß«@çWXã·Nﬁ€ÆÂµîà∑◊¥rÌ4#‡Å•vòÿﬁò¿Œu.#2hÓRu	f@‡ê‘"ÔY= ÁÊc£#L∞˜Eπè∞≥"à.îAôâ"/k`,*∆}£$å·Q$âcvT±Ñ≤êx&u…‚ÉËöna$⁄u‡¯…|ÃΩƒ¯qÓìÀﬁ3CÑcÃ‘•–ëæcx‘ûgıÂYœ√®‚îøéÜ€d≥nœ-¢◊–—≈BöﬁVµÂAYel2Ì"tXŒTb÷‚®î≈ãÚÕ]÷‚[ò«ÏÊ⁄∫~√áøBK"§∞e$Ó[§a◊._^[^[Z¢?»ÊÍªkç≠ÕÀsõE·Û Ú≥≤≤<îL7≠É™·¢˛ÛWˇóË¯(R)øçí6Ω√ÿx}MëËíòTêµdyÛdﬂ@äã£"Ωq∆ˆ:û„À¨L]˝Í≤Æ”à|™`I·NıkZ°œœÇ⁄Ìhâ'-≥ä—íFu ›¯_**ﬂ:6>uûTÊ€U´J™ËR-VoÎÚkë~ø2´|%’[¡ØÙﬂvµ[%ıˆ\jÁR:¯ew°X©æ?õ˛Dªbƒ3Û≈…Ê-≈e¬cJ≥’sYªMú¡!V3tÀê0û”ê,àüº∑rô2 ‡{Ï¥Aqø=iêºÇ§Ru≠Œ>6⁄êø™˚kÅıuRôªU·‚iπLˇ•|-÷n+›bΩXG/±.ΩŸÅo]˙Â˝˙À¬√/ëQ˙}´û!SÙeƒüJEá
ü£wèóZël≠ûªG·“Ÿ›•‡wåHôßËÔHâQcò¶œx8=ôx∆√ôÈ≈3ûœùp<£?≥‰⁄N4Ygﬂpb˜{4™¬©í‰ÉõÅQ°Jﬁ<àøêO-–©T„\(ÎÍu"“•zË gDxÍPcà»M‚#ﬁ Zœî¬ÎW&€"¡.îQµ•ÎøÕîj∞„nãÀoC@ºô4»$\ês’xò¶'œ´:ÒÕc„u)ßz´2GŒÖ+Êß¡¸$ckï¥˚]Ä¶ÏD¥,=j8Ã
D[4Swe¨Dgf%fÛÖ˘(≈0"/–Å6Y∆åÁN„=Ümﬂ‡÷·x™U=£Äz'&e∆,¥Ïv5lÖZØ∫Tùôa(iœf)lBŒﬂÁM;¿-')ø∏Æß1W.bo≈àßÖe¶ƒ„‹≠*eÖÎÌRô2«s•sµ˙•R+-ÃŒ5ÈÚ’ap•Y*WJssTÆÉK±∂^añóz≥XöãJ≠V+VKsÁÍ¸s≠Tü£œÆ◊J5‡À±¡üJïsU ìcG§v<p,€æ·¬jÚùÁ	H*◊P=‡[ôü∫]•òΩoÍá	ûò∫!Ê*ÙOzö•Ä¥4#¶ÌY#a„<eS˛üû ]g §ÚH∆√<Qù]ÂÎÿR<ëLµπ†êÄ»Z3i'≈} õ‹®"úd‹sjB{á+<˛=ìqFpŒ8:)#sz˝a¶«Sp1OËMTç_û˝/C«≥çq4Íb≈E∏CÛÁO+õ◊èHÉ*3@ÄK„ÌÑVú¥pFıÌÏπ-È Éä1∆ãnLqÕ,p1ºŸáîPîfœ∂?>Ω(ƒ›Á9ÍÏÁ«3W¡‡“@Ù˛ÿ zˇ¥¬ÛäN∏ÃEöÉ¢p‹4ô‹p≈ß≠°ÌÛèÿ≠û¸≤’¶„·ü/”≥Üg^∞C>Ñ>~Ùìôó_pÖ¸˝ ÇÄ¯|ÒÄUî0s“Æ,w=Âıé{jÎ|D!î•Í»R¡@ˆñc ‰∑*úˇ¡oØêp$URf±Xçóu√Ë_ÓY,*eéáz	È»L…ﬁyA∑cﬂ∞
ºtü°¿z◊ÒÅŸÖ≠≤Kª•iÂﬁi°öØöP3œú^‡.≥Õ0•%‰–9ë¯√>Ãt3‘C”∆Xnb˘ j±RÆò‡Ø;©©O/qG0%⁄gtJ	lkcB$4”çë4∂æ3§ æ ©0Ò(O|vzëäiÎû|•íõÖ…´"∑€È@3Ìò–≠◊„A3a?√≠Ïã≥|]g`ìzKπTyÆíÁÊH(vÀÓµx‡ƒo¡*Ûba€T≈ÿ®#ΩVÚÇ?˙ ¿™«KZΩﬁë‰ç∏oZ5ÊõV”˚¶ÖB´(<ªÚ%QÒvü%@bº∑’k⁄c·À‹öÀ€è∂Ô>|é}o—Ïhû≈Ã¡ˇenQÃé¶7ê}è€ˆLJ¬ø‚ˆ•Î}∞∞Ì`a]]_ÃÜˆT1∂˝9ﬁäÚÿ•‡ ÊÈ˚g¿î5&ÔÅ©ƒb‹‚rMˇÃbïx`M˛®3n4éåV⁄>ÜCà˚ªh†}múP˚àÁû(∞bñvπ]ç'ÖÎÄZ?VeT∏£F~3_ÄdëVŸ.É=èëÆp=•úÀ•◊ƒ_W3ì†Iµj∞Ò¸x<ÉXéê«ƒlàË)<(k-xi›B»™3&´ê´⁄[µ¸ d∑â¶R©¨X(µEû.‚@¢ƒh~ÚT}u?UiÀÎú¢cˆq‚
√A	îÅ«#ê®òÒﬂÔ*÷˛*Êo_òKû£üÏÃ$Û B7∆©Wu#5œû¬ü!nàÕaã—D^Ï0*JP2l*ñÊrÂô1§6á'ùú<\Ã„ªw‹êzª1Z∏qIÃ3f›G	©ªõ:Ÿ·‰√GPÙ#wûB>«6I3Ê¡¥¢Dêy„øeY‚î],»1ﬂ QÍC€Úés€yA¢ÒÆaÓ¢?
léeÅcÁFê-)H‘¬:ŒΩ’eI*¢u
ëH’›≈˛VÅC>YÅGñªCx—Æ„\Ùh©ØWÄYÊÉàf)ºù£ı):vow–&IŸ(≤!äÒ2Û¬Ì"To7√zVi7Æ1ﬁêI?¢wAÆì—òû)L!À]E≤M÷ffAp7≈˝YQX}%O@bí6ù«4ìÕ5k¶Ÿ¯ƒB™$á–ıÕdØX©N\¸âyQ≤îûÎjïÉloJF?√Óa≤
À·ÀQ»ï˜36U„˚[D≠«0§]Úz=∑ïo,ãA≈´jÓt£¯˛≈ÉgdÜDÏ#“8¢XFd∫ÒnóÕ™ö5D7‘ﬂ‡†æA∫ãg1˜ΩÊáoûQôU«„-MK(^%Où-‰çoQFàB^2g“ıeÑÿ∑iBπv˚ˆT>ø9JXò«ÔÛ‰)cñ
UIgÀj4
Ûsm°≠c›ÿ¿!∆ŸäD*F©“‡Æ€sı‘∏û√ò¡[¿U≈
L•ÅÀ+2Mï˙V´…Ô
’i2Y6◊ü‚\†Ñ†ô]àB∏”#â◊ ÖhdÆEâ%5ILÎ-AkT´Ñì_ß∫	≈+ ı&R^æüˇ›#ÌT¯Ù8°ª•WÁ≤º= ™©e¬∆∞s!]"dÇôUB	ö§’1 D·PœIF+ä‰"KìﬁDús…KΩDºŸIt•–u,ﬂΩ†˜ôc!πyÅ1ö°+™^Æ°z9KÀ±˙'‰J EâRúƒ.cyªú€õ'(ó=1¬˛"[6NRÛˇ  ˇˇÏ}mo7ñÓ_°'jÕË≠ª%K÷⁄Ÿ∞èÂd?xçQªª$ıMøh∫∫-k5ÏÊ"õ],πÿAvp≥|õâçÃLf‡πpë˘+¡˝w¬Â9á¨"´»"Ÿ/í•®0„®ªã,…sxxxŒÛL|Ì† ˙Ä+» 6S}
å>ºHL¯:/Ÿµ˛qå‚Q^#–ß’ÓÑ6ìû!È,xpB†P‘+$Bπëê9™‰FJ€9»|£´ﬂÏ∑"c0¸+πg˙öN…Ìü$ÆÑ¿ÀKK'áÂ2cï'´eíá-ÒÕ“/Ød4ÊËò›˘+tHO2"i¡d0tÀe∂r˚≤IV.k0hÍG@@[iÛ1\./œ_A>˙≠\Æ,¨U cóˇ{∑\∆Âï€WûÃ„W≠5†◊õ«˝≥Ωµ™êÖ¬"Åírì⁄õQ+ÍG±Âõ’9f0U'*Œﬂ†3‰?(¸Ëå~©—P„&*‘Ωn%´¢¯†I4~∑z.–z&$–Wÿjk~aP*ÂÂ !ºÂÚÂÖrïKh˘ˆ*ˇ9¡E,Û¡ªreÖˇª∂≤vwÖ≠∂WÿÚìÀÌÂ˘À¸_˛Î“
Õ&tŒ´üY˘Iusô≠Óï/øÓb=‚N%‡no'∑o^&Ø≥à=s+@L*Õj)S÷¸¥I$Yïe\p
\ån-õOB˝N`Ãªu¥Î §√`≥Àœóeá6#„¿¨q≠±ˆ∫øê¶Xc´T€klôˇ;Ö≠Ìïó6W∏zÿ+/´˛´Öê©Âäy:y ˇL·YÇ8!=è}MŒ@¥6@¿êÂ¸õÑB˝∏t/‡∫˚n79Â|∆ËÇ'ñ£∏≥10«î€Æ=ùG“å6ùr≤VTÉÙ˘^‘™=ç‹∫∆ŒÒú√o±Ì Ê¢…Ö3Ù/$¨‹üÈªO≤ßdÁh£cF&ÀéôJs¸\9Ô˚íÄÀ?z‰ﬂ√áèÒÛ?BÑ≥8Ëˇ.âMÜgˇã|"˚_LœÍê≤ÌbrÆ¯åı9÷Ú5U¸)ﬁ
-.¨Ñ∑r€s÷ŸˆÉΩ®±&LÉzjÚ˝¥N”j∆}ÆíŸbX≥√˙{ÕYàÿ=>ª‚à‡–y/b‰∑ãLƒﬂs	}¬ÓÚ¢q‘Îsk:Z¬=ú\åÇ_ÏıVø÷ﬁgãl´π€‡áHÕ‚’ÌèÉΩﬂÁÎG6ç≈î≤‘ª-àÑƒø©’Lx@TG¸>˙(≥g.|è∫öÙ;srSöã˚ˆ-»$ºBÏ>#y¸hùf˝+¸ﬂ_ÒÔoËõ≈å œˇúÂW¯Ôx˛?|MGæ—{∑ªŒ∂66∑Ôø˜˛É;Ôﬁöá0ò≈Ú“2úµé9D‘ ˆWyÜç˚äÔI‚˝ä4”'¥.êB˚Fﬁıí…≤üaŸó*>7kΩJ2˙Éó’òm‘¯‹€Ï6¢ uu˘L∏—h7;ÄUPì'…”å”,Ω∂ÿ€a$Ω}·_D–ù∂®œ2gzAFó ÿäÚ.‡K€ÚZ!˙ˆdy/íÑiÃøLB¡ƒ°“ù¥Ägá)¥.÷¬†C%ÁA‚4ß™cRŒ¯üΩ˘ŒƒI≈õ9+Ú#´3ˇh[L¨Ö–»√Ÿí©ö#X°˘˙˘†ˆò>ˇbØ÷jÕ ŒßKªŒß[ü•P{	sçï¢uv?™’˚∞äﬂz¬G≤ é;ZÿÔEpœÕhß6hıKPÁÊ+]ÄVA•0g˙Ωfª4;Àz_7;cÓ (&≤Œ†yw≥VXpÄÁØ∑≈%h4˛ã¡%{ËÖìA‡Zï\ÏP„{s÷_·ò^fù©Øføüo–jıfˇpùΩ; hÈí,∂!~Ä@Û•Y{\¢ûHxW|c/√¸˛ NKl·gÀÌC.¿{≥VdnçIêÚ˜PÅ≥Á‚•#µ#ÜÌLÅ|∏pÖ⁄‘ÎQo∆ªAXõﬂIÂ`”/¯ÍO"HÌ„¬Ç§¢ûIì5ÛwB-√/‡	ΩêF™·ƒ‘X≥ŸÄﬁÔÇ˙|»¢∑bmìá‰´¡≤O≤fÉ€ﬂ∑Á/AlÃBß{¿%}˚G5Î
fI^®r°ÑøÁdÁ>ÚõØ|ßÒ:Œ÷Ç◊9sE^0cÕZvqëk|˛ä<mºÉˇx[È*;GÅr£ú]^7À	Âu3Õ•“Ãç'µf|ùen©™^ÚBÿnÜ‡æÉ-X4≈çŸ…`mıpéq3l…¯Î–ÿuYÜ∆Àe¶Í:&úsì1íBÒpÈQA[sÔïE–›≈8 x∑‘6éÂ§÷	{,'ïç˜4¿R§nFÏf:˙í⁄8∆HÆ`PÕ“ßÇ~3ÖW∏”Ïµsza[ÆG/»_Û˝áˆîíÛ9˘ó4Ω¿ï2Ω]dñì;ÿS|Çû!(Û‚≠mp‚‹‡˜aw¿uÇ¯„††Î]÷¿WLk}k{vSjßŸÍ√íXS¯ãÚ˘‰ßÄ©ü3*∏s,™◊‹Ö>Íµ!≠™Y´ÇµÚ_ÊYl≥¿ûP∫ôõ›ä7S¿≠|3º∞(gT¬Êª≠n7oı¶†ãU4¥«ùS£N	¬ªsçR¨°œ“¬Í€W¥È≥,:”Ω5p˜2Â{ØyÑÉ«ˆ.‰]m5\≠s{pá˘6Ï^⁄l{T,¢ÂBLß≤r¿Yëú∫Py'á¢EŸ§6ﬂ<;Ì˛„˘™ç“ºò‘>wv[)éjÙŒàœüäÆ∞=˛∂Ø;Ø˘V)gŸW3ßùó€Âe∂¥WiÛèK{uÖ-›Æ∂·” ÊàÉhÛ©∫Ãˇ≥<øú~‡]P^z2ø"#' HQI?±Ú^TÌ¶Ôqù∫ùZNÔŸ’Ωj]Ócÿã#}-t∫˘ô8“˝ñF¿ë·‹Äá˚0mòëâ4BWK
96î∆{Ø.ÓU£e~±∏Ö›#ÂÌı˛„…Dä3u"h ng?≈ësÊï‰GAŸ«T'æFÏ”‰b}æ*≈å/∞âKÉµöÌfﬂÂ5w}¯yvÌø[…K`Lµ$¥îIúƒv?,WÂ≤BX%¿¶w{¬ë»AÔ_PSi».fU¢ßë¶Z6ï3§é«øß”r3¶¿Z/ÍFÁ¸Ò¿Œ$ƒL«+*0ôé;%ˆ∫„6°©˘±EÚ®ôöàôÇ®é}_Y™Ã±ÕZ≥C*/≈V7˝Íz∫h3•~§<,1Gm…7ZSqJ8˝‚É√©”T‰(ãá∫pçwü\Åí®,∞≠®÷gâ?˜ÏÎÖtI÷†o(=üï¥æòïTz≥ƒwP—LHÊ€`¡:—h3öAæ˙Ë⁄!ŸvÍÇá:Z1d¥»D’»œø˛·˘WäÊX^:W^ä¢∫¿nFqΩ◊$ÜôE&Ω?çÒ1≠{Úô¢a°[™%sˇH-bÎΩâ®x√Z/™MFKÙ∫Òµ£™K02jBæ“Ëj"q8M—êx{–l!3Íç9V·€ÅwZ›nOQÊﬂœÑé‡√7ˇû™ò∫æX^`‰d7{›˝F˜‡«†(í`®òÖ"ü^qÀÇNôDî¸=¡'»€0A•«è.¶¬’õYÀk1SúøÏWlÊÌn˜√®·∆9¬íMÊÙ7
û6òãI∑ôCÏ˛ # ˇä´≈Üøƒ√>‰F/%Âiz•£‡Õˆñiçú5äÇ∆ø˙ùX≈d%¬»KTòö"¶Äg;|¯„¸¥è †òpW ∏1âùﬂ0˚Œ|møDOÔ›_"0$ª¨àB–{& `≤ÈA&s¿ıƒ…∆Ä"” qWJ;ÃÍ"s5°f≠=úQ§†Z«ìùcŒ≤úÿŸ¿
+W[Àl˘.§Wz‰8ye7M∆ª?û˜€óﬂœ±-”8oÀÙìçΩo˙∂∆ﬂ·º;IÓŒˆ∫É∑uÊ√˙XŒtT<:û∂lj ,⁄-IÂÈKﬂ-ú<NÁ}CÒ:Ñp4ò≈@Á≈wõqﬂâDZtXº6â√‚"ug\qÒ8QKBê≤,Áà’„ÂbE{bGâ#~)UÂ_	ú7ÚÌ4Ï_è£∏W¯¶wÇh2=3–~lßAe˛Ü…,´g&˜j∆c¬+$âßEöoOwë [j‹Ä„+ ·’˜j‡§„;ﬁ…‡%Ä®™®6Â„;CÄC¢xÀ*TõÖ`i)ßeΩ •r RÆ¸∫è¸:Æ«ø“XÈC…ÊA∑_k·ºé˘'ßFˆáíNœ0èípTÅ∑<Ù√ïvcNçy4õkòÙx–«˛\˚º∫d—Â+«˚Ï	¯ú«”≠éıl©”	©l;j^,‡YÑI∂òú-˚„ˆZﬂêéÕÕ≥}Â∫∆nà≥≥Lnı;]&∞i“5º®∏—'“Uï5ø∆iéª…ÙL
ılÅƒû¬≥¶å'™≥/û≥W∫∑¢a√‹ìs¨Ÿáo‡fè€°;ãOí–Ùè∂ıM◊êÀ¸gvÈ(•-û	√…ã£# 'u&_^^¬¡ùz¡x&á·LÁ¡´SFò>*Òü≤t ™dä·<cwè¢ÍÃ]r%§K¥‹ô©ºzH»áÚê¿Ÿ·Fîµwyùafk.œ≈[@qk7O—Gˆ≤nòßUïC pè¥º§aQ\I≤í˙&‰˚≥ÍΩA#ÌyJØ‘Ô?«Ûú”Ñû§Avi%®†ñü5ÖñÁ¡≤xÅ@Q†C ∑kç›	(Ç—`°èî<4öT Aö˜L“.Ú∞9∂ë«+Ú∏€éƒÏàƒµa^	§^›	ÅÊ^ÍÄ†"Â‹Üø∆jùf∂4˚É8É¬aäMRr˙Ê?nAMÛ√’KÍwNHÖÜì>ÂÁ}Ú≥Å⁄ë«‚õÃË˚ùvNk‹ß¢ ≈QÈ€^G• SÎD(π”¥Å¥·U1É^4E<…7ÏP(Ω¨Ä›∞ß¿RÆo(@w˛.≠˚ı≈È”2'Â˚#BÂÓı<ÎU/§¢ˆ”'¯)∏ÄD_òc:∞¬dî¡‰·Ω_O`Ôõ850ﬁ#Îﬂ˚ΩAª}·∫˝Ä∫›…^‡‹∞‹éWtm¸A∏]áXn¸lÀ©üekªÜâ¿y7∞ˆ‰§ˆt§ê{â≠áËMs€â∂]–‡Ωù}ƒÏ>F.DΩ»	¡Ìﬂ>ÿmSˇ|ïºoäC˝«$UˆÎıR¥l	'ùléˇ(#
ˇ¢U¶aOªr‡”—¯£äµ˝ç%#˛áﬂâ„íÅàﬁ ^Äåjç ı∑5πË≈}%Gº€£~ó·&2]èSç3±ÆÂ¶ÜˇŸÄónÚéΩp@±€ﬁ€'vÆk¨VØ5¢v≥é–ﬁQUdæ“#*≤˜Ø≥á∆7>B∞√ôç˘ÚåD◊åÛWfÿ–'òî©dÀ¨πÀT≥eV›eñ≥e.œqÄ‡ a7ƒmæ›Î∂t™πKfﬁivj-@‡¥˙» >cnﬂÃ—…lãW˛û¢õ∑"ﬁêFç…€›ZØ¡x3ˆãkÔtº∑ }ÄéäÓ~%ÔAƒ•ÚFÚ™T¬ªßŸF≠UÄøÄÀ6ƒ)A`
Ø®∂±∆!Éfùãı°µó±–=*√;¶=$∑@≥‚Æ…ı®TäÌ9tC°OÏß¨$ÚT·ÎÖÙ°≥
ì-ôQ≥òπ79õ*vÆˆ¢ ∫V^Z≤cá’ZQØü	€∂*.Ñ®£X¡óíEÇ÷ÖW4¸˝E≤xºí7˝QçAzùê.ô¡¯VÆ*|	êÏ_ΩA´ÉÄ±˚N‡ﬁïD»°f$¯ÎÏ“ë⁄√7f∑Ìo¥Œ∂oız›ﬁˆ`œ0±`¥|clb®xwæ¡J"à—Ù4À√¨®b÷ÿÙõ„L¡àÉyUvÃ%GÑÒGO˘≠ºÑÂFÆy6kΩ’yj@G)Ä/Ptådjâ#
 –JSh=ëP‘´ˆ©ˆ‘ã›–æ∑ó™âxëb5ù»R`èQCÑ!∑y◊2u≠‹⁄[ŸºÚï˛√qq5^{≤≥˛SB∑'d&`~3ZÚÛg\ƒÕ‹˜-æﬁ¨d_îƒ?éÊW&†fë^¢–â,˜$PÃ—√∂of†ñm≠Lã°|8ú±˙S-£eW"3tî'3⁄k"CÈ.fÂtŒâ’ª—Å°#H¥“ŸO∞|ùâVáÀ^ µ–@∞Ó»Xîó∫©D)±÷Ì»ê7ç√T2ÿπÓ:p¬ñÃÜ3XÏ¬Lﬂ‰ã⁄¢∞üÁ÷{∫⁄Ø≥ÍíÕ‡W*†∂JØ.Mn“⁄œGsÉ€]l}
Îiª˝uDùŒ∂∞8&Ë”Ì¨2E° ^òÓ—ß)á∑'Í3xﬁaq]ó˙Œ;,äjÕ§>∆¥Å¡”Á˚q≥±‡7ùÎavZY+‰WŸ≈`LjÀ™˙“Q“ﬁ!m/È-^,T¶âK…Î⁄Úÿ‡Q2hYZtîô7Ω√[Ê}@1ñ∂√ ò⁄Y|$dm€b™ΩWÓµé’-B‚ˆ47%&˜X0‹bc„√Ìm´ä˚√ñÃL°ëóÕL=≈K'\c/üZ%·K(\vkÒl Åﬂh4†gÔ Tú9í:Y€!!J
qˆ»ÏóB~J≥√^#—L=˜„˝ﬂJ
LÇì≤NˇùåË™ükÚ—√R
>zTß@Üã](¶o©„—%Á‹ÅqóK.·˝Övl˜n˜ Ímv¬∞æ≥uæ~kÅõé=¬XLÂö¯âLÆˇpå…ìÜ#òÂ˛¸'Uw>êúõ@ÍYkÒÌV„VçBΩﬁÁ9çìﬂJaÎ^]]pmn[ZÎÕ˚Qª˚$“§≥ŸiDOyC—9\l“ö_Z]—KøH3° AWtx¿®Ü„Ω§ó’)◊‚9¿˛ª˘ò»Ö=≠˘◊dÛ¡ò8˝¥°„Ow∏“NÄ 	!ﬂ©5¢˘f«zÆj€#Í¨¬ŸÑñâf√„ÊzéZFCáXôï@&Ã*,"K^"√,`ŒP8˚‹1ó€KæQmÛæ≠Ó-,ï˘◊ÂU˘«2˛¡g±¸kÖïÀ…wey˝±ä,ÌKKª#Ëd9å•˝ÙS;ﬂq∑T)hkÛµ§
WO∞^ò„±Û
d,*ˇFÚ≠Ù? ∫\√l∫m*ƒπÄòiêd≠Ÿ?	ˇÖúø≈ÙÁ?<ˇËáÁ_êw!±¶¥nM¨ﬁƒ™¶s“/ìL˜J¢˜+CﬂÇ/fúhìDÄ,«ëú¬˙›ætƒ\}¡.*Æw{—ÎJk†Œ3ΩÅì÷Ävƒ[xrÿ¢yDñ ú—ë&È∑b'ì	†sX	{Ç2èœc’œYeR<—R4+EugG Íolh54T«ˇ‘ D≥P†^p¢£á¨;gápÖ&w›1A¢|"B±ƒH÷i[€Ï‘[ÉF$˝N|Yyã—O‡%…ª$nn{•Ò ª›çÛÑ*u≈TODîºRJà“b=Âptéyq˚æÖë_´°±àqÛ≠¿K°”{Êgù?®∏}<ïñàëp1è r]ò”Üô#fgÒ"≈òqËj»3¨#Ω&sÅî‰üÿ«ÅP3™Í‰ÕIïØÀ?|’òOrÖ˘wHî¥y¬Õ˙Äõ™ØT<}Ø€~xQwå[e{•Ä÷ﬁ¨a,*o&yÛyıî§+ÎèY\ª(¶±t¬Ù4Çã)A#ƒ"(Hâi/O‡L™ﬂÍ–_XX@5ˇ^˚é’∏êÉV9ìF/‹nÔµ˚ò[Çæ0_•¢ Ù&j4mµìS@§¬óõ ﬂ¬M
y¶≥∏‘€;•˙4-–±‚e˚˘X–≠˚}«ÓÕ‚7,ÇñıX£3p«a*"«fNf^I1˙N†›}+XÅqíïﬁòM1eq4ˇVÓ˜c¸—CõzÄJÿ0Fó∆ÅôµÕÊ£ΩCπÈ ‚¨!gg∞1f=ëwwÀìp‹fs
EK«a∞J∏A2l“Tq⁄˛¸—˙—#Z,Ï9q ‰π’Éê±•Üno}• ŒV@7Äê£éıvµã∆Á⁄”ÿà#µ&8ÊÀ)äî'ÿtìÁn3{≈Ô¥√ΩØKÍÛ!ìW	úºêÂÕ±‰(w◊û^ªXv-QÈÂI"%/a	·ÿ§~æ`9S»|úIgôslø÷ã£;ù~÷.¢‹ﬂájñFe	!ëÃgÎAõ∑øñ¡0»B‰i€%ãY°ö~„„ôwÔI¢„!hE~(åxí.√:(Ø‚!⁄]pwÛ¡eeRΩ"4√æ#£Fìå√≤ÔˆÆP¸è—–?åÿôö‡x#£}àyO@Ïz?PG»òY|èÛCÅë¬“n–UG√¸¿î81ºè⁄G÷G“áóxxÇÅx›ÊˆE˚ôö@Â.6∆®Î‚¡„y<Ckr)hD¨^"ñô®2vkÒ≤∂ªMlR£≠«ó≤≈∑ASº˝Z*‡+Hw_#Ó*¥‘É´¬ÔP◊Ñ%∞N8é|L(\å•[±E∂—mÔs]–ÈØOj#feÛ¡Ò5%˝=Wp	õ-tÁ#_&ÁU>Ú.ÿì∆ÚIGU¢∏?áÕ›∏ööOÌÜ~?Í4Äv»kπ3ê≥´ß}òµÛ˛%..q‘n¢»XÃ¬p\J⁄ﬂ‡	5u2ƒWjls`ßÁ8X|Ò&ÆcÃèjá¯Ìè≥∂G!M´”
Jœùµ]π¬-áÚÂˆ⁄¸⁄m‡ |∏Ø`ëu-z90√góá(˚>FŒP6/'.Ó§õ[@ÑhÃø◊i≤˜}8†xßµ\¶@¡…38iÀßÊ¯Ÿ· ô`•l/Œ*dFÈ∑”8Z∂£÷JÁvÊ¯µà>™¢ùFÑõbÖ;˙IX`ﬂ·Iœ+yÃœ•Òøì4j@Ç‘O`µ4ÿ÷†=3\üàÈ4äeï˜{˙òYôæ=⁄NÇI’Ó’°?∞∑ ÿôwñ¶æ∫DL
û6¿‡jpÂ3æ·5:ÿàáŒÛÛ·∏'ÑÂUΩNûM|˙+XÖ°'5t%£ÖRΩ#D∆◊glV;ˇKƒwñ‡‘ÅÙ«µV≥!øò§ÉŸŒ›’k){®}Í=¶ûÂ|-√ü°¯B.…ÔFQ#ˆ;ƒ	Í<˜&Ï∏oävxÍ#qNÁu”IP7ö1 é6Æô–£¸OÍè∂S˛ÍjéùZ„¥0TèÀL]…ÚR_≤ß|&=eRmìñXûl€ëïJÌQ+vÃVz≠„pØÚ6âWÎt˚–;›æºvâ¢f~u≈¶¶^.û©p|’SBƒΩ∆VoØËπ-Wt\Ùe--Êäñ≥È7e∂‹Çú6ˇñˇ¡ø‚>òfÍ§P
s9å–M9¶Ô…$ô∏Äp<È¿√“J¸h¡Ò*¡∑yÏî¯’Øt\&‘ì)6•Ú≥ΩE˜ÂìÙ’⁄Ò‹_Ò
õ2{π+y>ΩB!¥í·`∆‚c¡"kt$§◊D†’çöê^v¯ı
…õ÷Øa(•˝≤ïÏ¢≥œPá$4√˘‡5¶Ô¯)Óˇ"∂…®i≈+Ô’3∆pØÂ3ﬂG\ÖÙ~å‹Ê’I‰6Ÿ¡AâgÑÈﬁï˙IÎÔK H4“ﬁkc£Ì??Ò\œl]X^ß9˛ŸäâBKÒù)à_6TœÒHLò‰©®ıò’ÍΩ._˛Õùùli÷äûD≠ÈfzöΩ’Ñô”ûçoÒß.é—Àç›v‚å›éú§è'‰ìm»WCèo·ÕÖ; ó¬… o{ÏèÜI^Í«√…“»üu¸÷›qIøÕﬂ>iΩ”yrNó¡øˇGOÁ(•¶≥`∑LÛ6(?o:mÀÆE!<ˆí∂ˆ‹å˙µfKtöÈóì§lÁùà.¡Ÿ”¡›Ó¡Æb‘m*ÙO@†: ™àT'¯B-V=√h·^˜u]èÀÜæ<m.tƒH:6t⁄[èŸ5À„±ˆ$Ì—a[ßC{™+≤	ΩyÊ•/å~v…'éüáÂÀÇ07C®mÄ¶ı¶’ñ=\ÃTeSÛìÊf{Õ˝Ò'ÊxD¥xàˆêÃÙL+k0:!4¥\`ë⁄”øêãú4MÛÄåÙ,<lVnÇî‚È¡J(æ∏ö·É3∆ìÜ–kÜƒcˆ<∫V„+íi¥–ã0Ø4#=q33≥ ó©ö°üÜÎ·D‘∂)kçr@.[ß‰⁄enà'ñIfó5OK}Lå…z˘5Ê±~∏®U5çﬂ	pR£ãqBî¥v•∏ó”#\sÃËXi*?>j⁄srjv‚≤ú'êÙ
ƒyñZ‡‚sÜ	·…ß')Ó„2PüK˙YLKCﬁ}Ô?'°$°>ú/_>£,‘KcqeÈıçõí ƒeæ™^÷!Ç3aTóµº¢.‡°Ri(U"©Rô«ı©=ô-Ÿ´¿VäjXNïîûWî
4·lSZA˘√'	ôµ·¯>=ë<≈§÷%∞Néƒ/2÷0≥+ÕLÅ3‰ﬂ…» N˘µÇÒÃˇ˝q<ê9iß@ë?˘∞[ò›îÈöwƒ≤ˆ7ê˝-Gxùß˘!8·¯d)ÆçøNç„öw“`ﬂEnΩ∏»ﬁqã›võwU<x¸ﬂ¢z?fÕ√”KLŸ¨ı"VOÑ≈Pì†…∆:∂Dsç=úπ∑w7Î1∏á6ˆ¢6åÃ!|∏ÕGÖØ>õ\y√«∑õ|	ÿ≈_nuv[Õòæç:ªµV˛¸Y‘ÅmlR`´[ûæ≠z3ÇÃ÷9;j5w·âˇ}g„¡Ã#Sóπ#ﬁÔ49‡ìL@"%˝ QÑ›	' „ªÈ]˛È†	'i‘oºób{ø@1Ÿ-
∏¸JrbƒòLLõK≈$<p˝©‚&pÕC‘Ëë‘DÂô7z\-ÏÙ∫ÌR':`[Qø$Z”ÊÄ∏"?àèfÕ¸|0}∞·‘N˚˚”ÎÒÊ‡mº18eÒÉˆÍÊhKÒBµ~}/ä1∫Pv≈$[¢™öπ—jahiå˛gÒmÓ^s`üˆ:+“ n$£¢<&;TÈùÊá.ıe∏à™5ÚÇX˚?À∫/ˆ"Ø'˘jD≤âØ1¡¸ùLºøÌ5!wú–ÖÿOsøon¸‹˙€Ω ãÒ—∂w∏ç[u‘Âãƒîkmt
≥é≥G‰£LÇZº`JpÅxÃÕ«∆=öñ¬_z©˜§ß“ª
õÑo÷˙µﬁ]íÄıTá–‰∑Ö‡‚L^œh€ÕB;*∑}a+p@ùÑ≥lΩxí9™Ä*Æ&ÌC[UÌ˙/-U$”π†hA¥q∂U±/€RIFlú’¥«0Øl’ı-∞n‘÷f§OW≈|ªô‡HcD¡.bwáp˚d˘∞≥µ–QÔ0ÈTπ‹ùÜKËoÖ·âˇëJ£ï$⁄∆¶‘	’Yπ˜ÏLó~$îf®±MfˇHËP•”R"ñˆâ∆À,Y–¯’4÷N|´Ñ:=J+%“N]QsgVswﬁ“∆}íıÅ˙≠-OuÛLVô·RÊÙÃ<≥g6L>d ÖFò	.û=√<®BÙ…Œ%8n?xπSÏ√(⁄'+ÿ‚¢i¨Çóﬁ ¨K•y¶·f–°•Ú™GæÊî*+~7b≠k˜&á_’⁄:„˜ πlî™Uõ≠ˆm+™ı¯f&é+§∂õç>—õ⁄°≥üö9N«f «˜¿ßîˇª÷9Ù‚˘ñ
«IÙùtYn)·ˆüBYzpè"B\®ê∞Ò¸ß,S-Ω¿ÈÆñOÊá¥Ü]Å`“∏êY.¯°©ò`∫e,7z·çIDä*í«"bœLtÖÜ=›åN∂>2´z¬	´-Ya<È¨ƒW
±@Ãn˚±£7cZ|2Öã)ŒmÊÍà‹Ê”_·ÉX»mãºõÜ‹∞ÃãBÜeﬁ«¢R˝ñjÚ[ë tk“∂çB{P˝Z0TL†‘∆sÛ≈QB7_Ú7ï/Öﬁ≈>üf=çL„ª—m⁄ùu≈◊%‹ÄìeÌuæñ;Ô4s`i?®\R≤N-âN¥ö\F°rts˚B⁄‡ˇ˝¸˛øWüz1=¯ƒ∞eÙôÛ<›∂·Ω¢|Ñ+˜øªï‡5ù_£Én¯5»É“Umå£-Nf>«x∏íÉ“Éë(9sÑÏx›b⁄:Â˝ìB˙Çí?Rè°ÈÃ¯+•ÃIh–Õ1Æ“ÁT@-5ØÏô¬≥G_æúl2_',≤⁄q4}Eñ#}ı\¸ú¡[¡≥f«ãkú¥Ò~ToÓ4Î‚x•$9Ò…Í1ã>∞ªYùﬂıö5HoÊÀı†G≈hE≈y∫”£S’*g(#0’¸´Iä(="îÁ8û6L»U;~Á‘hïKIOÃ≤üdxè~r|Ñ∂ûú&;sh‰OÁ	À;ÎªòÛÌ≤ö¬ÍòÁ0≥¢]1Û¢)o:™äh=QÊ[ÿ˘§ºH˝ho˚*Ì-~ÉŸ$^!V‚Fµﬁ–µ≤◊ê–ñÈﬂìÓTËû\Z}Bµˆ=.±ﬂã<˚¥7§˛…u“kØÖÈ∑#?ËÆ‰‹FF{ËJ çˇîw∑  <¿£dhL/ÓÛ5ÿ‘i‰cÇæ˘Ä‚sM”Io∞¨¡r§_Æqr¢f˝xïøú8¿Q ö
]Ÿ‚ƒÈÃIù>º.ˇ! v≠^»¿WΩR4≤ﬂãIo˛∆≈Î…ü˛∑T∑ñV∑6ÅÍV”ÍV'P]y)≠˛ˆØ™3j¸ÿVp°uŒÚ M€ÊˇMGÊ¨$ﬁXÆŒIºˆ´≤<]}s óòÛ›]ŒŸ§áıR<‡1¬{ÑoD…DœÀœ◊ìø^?üNDµ\éüÒ°Ÿ‘"E*Å‹±Si´j?«à¡ˇÎ¶Ig·D˘E≤3Ó3ÚÁΩHÛiJ‘◊o2Tªúpû¨?;9Ião*>©¢æ*qùûj O>IkÆæ‰SMF•˙Ã/SìJd∂ﬂ∞êx8¨tsÜ5™¥”µ0ä◊6L!Õgõ¯>i
à^LD~hÃ>~DÃ˛)®Ö$@Y.	›¬+Có%/	àŒG·ÒL˜≤ íõ_/JÊ—(ñ≥°ﬁ·ÀûÆy—&ù?=¸œÿ*>”tôŒ‘y„’Ä'÷êµPèö-®è˝Ñ--T´ˆ¯ëÏÂÅbMó—Ï™hDuÖƒÄ≥+¿ŒöY¥w‚˙i“.rô/¡!ÂùÎñÏe—-˜<\éÚ*ÿ‚®rj÷ £ë∂OX˛ÚÅØ° z›Ê√H,ˆ?üåq◊:Ì6ﬁß∏x%±œ!uõõˇ?Ü˛∆œœ-<Áun·È◊òZòO∫Sk›AL„Ëñùt<∑Í¨◊πUwn’9.É>ôêE'ÂÛ‹ö≥\'cÕ•i”ì≥ÈN•1g¿¯ë\Ø–GBi»ﬁ:∑Ïú◊πeß_cj‚dÍùZ˚.M/› ”sNŒm=ÎunÎù€zéÀ™a&dÒÈ≤zn˜YÆ„∂˚&ƒjû`h5Æ‡ò≈Åá⁄t¬Yê9®¶,=W¿ 4ÉûMè,•mö`´∆|∑”:úu⁄¥£ÜEçµ<F`T±Yïç\()Ω£[˘Óöı ı“ãû1Lˆ¯Pæ◊1¢≤Èóåº4 1qŒÑGïó¨ÒQ:5ùMï§Ÿì¶x'Ö±›’/Â‚£
pË+≤gJN“h£ƒ§ù¢äM˙ÌôócÇÊ;.	ÙXÕq¢ã¯9op¨≤´ëlBUK6€Ôªs±Ω(h^∆ÿFWe⁄åPÇ‘;K´B_ï´;’≤0–î»R}}	ºeÇ|ä˚1Ôæé‹\?ˇıÏﬂæ˜Ûy%§èêínKJœf{¡Í“ÑÔ˜NŒ3◊.sÊπ9È˝/JËÊü)∑ﬁOv´ep ?æñÏX f¥ÎÈû¥.ad.	ÖKŸ$H·JM[’Ùl"ê#Á≤¸‰#í#q£å∂»≤;vø§Ã=Ïè5€á∏£psh˝´ãêUn˚ΩxEÄ’‡> ≤õ¿F4¸MÅ+]¥L¡é¨Ïàı‹“%n'ﬂÆ5vã8Ì¨å¸µX‹^«ø{›¯€®ÙG˝É(Íà»Ë¢≥Ö‚Ì®€E6ñ ÏÛà!√WæO≥Ï”Iu,:2«D“z%æ∆ó¯˝ó‚$'M"x\‹üG◊ ú4~ÎG0Ÿ≠DRˇ_êN˚k˘‰K⁄Üö—CCW uI$r5Q£›mD≠X… 5¢Wû*;É·†ŒíéÅ¸«‡ãï⁄s%C≤√w Õ"Ç3Aá»âüC„wöêÅÅeª—e6∏ly–jR7ø]Îi¥-ëáfŒ!`q’ÊZslJ}¡„√C*):".påñ§ì Ùﬂ_ëãÓ◊…o¨§˜	yÙÔé/1QsÏ+£¶*UL$ÁE≈È≤Oát-‰|l¢©Éôå·≠÷≈Îä“œh–fN^' ◊1æôÅ”¡3ë`%Ø_~b*)>tÛß_•PHZÖ¿+2jø<IΩ2
¬àÆV ‰\´8¥Jv¬$äEÄV®ñ1‡.&v·> &T4.slGên1™⁄á»{ÇËD∂ò ™≈-&°Õ}a≈cÒ àCÉ¨aGÌ¥∫ÛDX®|Õª/Xò´Hij–3âs#QBøp€∫U€˜ÿØ_ÌÔE5◊´˝û∂RŸ¡ñ∫‹˘_õ∆æZ≈‡ïÅ®AÅ»˘à ;(◊Nóﬂòa√·ı≠ªW˚{c<ßj®ªZ° ›8!ﬁÀ†>%d»õr≥°Æ)/Ÿ≠9!Ù$Òk$0%âL'ÿ7÷»‹$$w˙Õ+€õg	æPc[O∞uñÉn%,ÓGˆc›´ˆ≠<Û°„Nﬂ¶˘∞]CMj˜*Ú]´Ø)25®å≤fGÆ™.Lü»ÑÃ∫Xâh±öçßXÙ˙Ea∫}bvL˜ãá∆æ§Ír3†ÿj&àz»[¯4Ô,Á{ˇ’ÑZ,Ω…Ôw>Ït:v2É¸cõÒQ[∑>Àíç•/’¥∞RÍW!~|ˆÇu◊ÎFFf∞h«–∑P:∑é∂w1Â"Lv…?X€–]|,‘Sı≈ä‰(OAÔ)∆VNØ·∂_ò¶wÿ.öÅ=†°•¿S^^W˚ß2ù/¥ªùÆb,yáÛ÷r©d?eeÔ.ˆŒ‹õ§rºM"Ïf‘Ø5[>˚õ‰ëÊN©ºe÷“N-]È^ÒK”v‘®‚ÜÈÜÎ”8®vÖp…∑ß∞aæaÔ∂71÷@27Ùj˚ÅÔíÁ>xäıÌc∑kgÚ˙	ºÈë¬ÏÖk#∞!≤[Î>ûùÃ;x&<æ∑Ú!é£vﬂ3È◊ìÎ⁄¥_.pñ›¨b$*◊Ñıl™Y5∑⁄j«4üA3Âh“ÜÅúØ]q;EÌ-ûØÚPT'ÎC\√µQått®ÌORÃˇuõuftÆµ·‘Eƒ;Y$X<‡–ˇîãÜ$M,dÈsëQ$r<àßY“§S.:µ‰h¢°◊q. #
àÖ°Û4ã	eÖLVDBD¡∞g®h{{VHóNøÂqh{Tõ∆∫êvïºM–<Wi˛iN Sé{¿z›8JF?¨éx&;X	„Ìk3V‰˛eoc4ˆIéós€o»ÒÖÌP_π˝Ó‘ìwxelßg^ÅzÖÂ®Wío@¥©&voÙf{Î]— ÎJ˜JÆo¥}E˛eC"eäÑ=Zã∂…‰“Kö¶@ƒ&¢Iø.'ÙÂá‰í1û,¶u—p{Y	AiÌ:rò\”/dΩ4–µUµüˆÊ´ºü‡ﬂã~iÓI]~È5˙BBÃ⁄ß[L≤Ï‡íÕ~éi‰Òìí##u*0¢Gß'2⁄rfîº#@h˛”"5zµxØ2i±Ò/1á¢œq+\>úWŒôŒ'≤Æ»%◊)∫…ÕòTúIT¥ÍC÷C%3Å|‰£F.¯P”W%Fﬂ&àj⁄ﬁ2Ù‹—E∆}YıiÎ‚ıˇzˆõ?yf£Óªwÿ:⁄Ax>æ«BˆFWº‡ˇ≤Äº¶ﬂS`Éê–wˇ'”®…Ü¯$ aa>Ä»ÄÎAq◊ùÔvÒÃùa0,çÚÅeÌZøæG∞˝ΩàQ4üt‹;òl·rKCa2ﬁíœ∑€}éµkOÁ`√xê·q$)/ÛõdR™„?$ÒÚIöŒ◊ò4•qBÆé/i”sπ,Ÿ^Yù©%<!9`~<Ë≤Z5Ô¨√Ó†'ÁÎˆÿ ¢Ú¯¡ÛU.ëQãıª,ÜTÁP
Úcö]«1qúãEÅ¶.˙,˙’˙T√⁄1ú-Ò6‰æ∆Lâ≠¡„µ«4%·Û/0çn/ä˙ø‡z{¥ÏåÕió’˚c‰¿ÊèÃm
ª(YÙÍ^’•~ı4—÷Æ9z<CÛ˝-ä≈3LQÅiˇçÃm|ô§˝´,‡$ÆüK[ÒΩùùf6ÓG˚›^üm‘zˆ@t.FëÌU≠oíj~ó?`à‰˜‚©8>-Ò\∆°Ï”Îa∞g˙Ì+)—8HØ/¸;¸L|í–€Ôuπï…ˆ{›ù(éπY…ﬂzø«≠Iå	n’∏0˜A„˜X‹4¯‚Ãz‘'8„∞/,“V e@¨2k7rI|óãë<3[œ"úØd1¡áÑC}W%Y˙a©Ë7ü≈:ÁÏê⁄„∏€ äGÚ¨{ê….Ω3yáeÁ øX”›`äÎ+u¶‰P$cˇ¸Y`¯$öq:üR∂/^ﬂ⁄ÿ‹b[}æ—CŸ®=¥jΩDFäS•"í⁄V¶◊˙rù˚Nâé˝?˛É◊⁄HJÄÓ{…§TÒÖ_H4˛,`p›˝B»¸˚©ñ˝[%≤˙w¥pSÕ/!˚')ª_·ø¬ˇ(Õ114_IΩÛ--Õüë3|£g2aöÔ®∏”´AWƒßò*î¨ÅÅS∞‡ÚU†ﬁÁÚSkpEﬁãjr›°$Í~T´Ô¡∆0äêN)‘Îc· Ë±‹Ú·îÆ"°Úúç8i6∫Ì}ËÉüAÃˇ‘…xSqŸ6?MR‚i∞ücIŒ4≤™ì*Q¿_“0'k‘Ôp÷%9Ú0É>°‚ﬂ„jı[EÖ∆2kMJaÙ}ëå6s_ÃßÄ∞Ÿl◊ZêçRÁbãòÆ·‚Aã+ÙVs=∑Î1È®›¸{∞ÁπÊovb.Ë}÷Ó>nÚ˘˜§å<ç¨?Y~7Éb>—Éñ0~J÷–‚≈Ev;jÌÉP:‰|ÔwÂãWñ˜u–‹Ï∆Ê‚ΩMCÇï<‡˜>Ëﬁÿº∑…Æ±î‹Í˜÷ tv¢õÅv˚Ç∏}V∆ÏŒÃòΩÙ¿á{‹LÊ∑œ¡0Úˇ>ÇXe™a!ﬁo5˚•ôu[Ïq+Í3(ŒãÏ◊∏≠}ß”/%’ïó,•Ëπµˆ>]cÒÎ◊ﬂ˝sA∏∑ISj”“dÒ0¸œºå˚Æ∑Ë?Î÷õ’nÁ;Õ€JŸ´¸x€Kóé‡ÛpõWò+ΩΩ}ÈH´l∏~Èàzv».¡[∑Mˇ∆dﬂõgv6M$öVò“«ÄyFO∑N0,3ÎAfÃ/hT¿¸∑ßÛ´º¥æ¥T8…pSDÛTt?óK◊¯ÈÏ:˛˚wÒOJ76uosv±iô7¯p,È˜hòù1«2|[”Îö‰ÃÜBÂ˝Ó˚ê9∂¡!hP&0µπë´2K˛Ùöuf’vC©æHÍª∆ñN|ûáÕÔwDJÍ"_m€|~~Ã◊Ü©wò:\ÎE	jãùôﬁØéuHñbLêº∆Œ‹€;åõıxfv&Q†a·√mnBsŸt¯¯v≥€ÍÓ‚/∑:ª|A£o£Œ._›‡œüE∞•ì[]‹œm’õQß¡7˜£Vso¯ﬂw6Ã<2ıÖπ#ﬁÔ49‡v4∫ªìˆÓí§#Õ
>ïëçô4!°à˙ç˜RlÔ(&ªQ$0'|Œ‰X)≈ò]NëÀ8±‰ÚÄîî?O‘œt$≤eAàΩ∆Õ{£«≠†Öù^∑]ÕV‘/=\XX–Z7«‡õ‹8>Pzs«›=∂œgF¥”ÏÄÒ—Ì∂eé≥µyp”{"f…}(T^*„8“ﬂÂÔ™Ú˜rÚwEπø¢‹_QÓØ–˝7‹ÓˆöÉ6|⁄¨Ò	~õO~ò#ÊÉ‰t9 1ì)OÄZ@{ø∏…Ms·≥[2S*©Ë{˚uÅÔª{Õ(.Å°süˇºÎ¯¯Óp˚vÚ©Ræ”€¯€£Ç•¡?ï™0ãJÊï‰3Y∂á˘≥ı+∆ˇCπ^|µ‚ﬂb{J∂L>èzsñﬂƒ´¸
∂˚˙Hi[Fë∆E06f∆°ôwa8´IgQ˜„ä≈hŸU¿gƒÚ¡gtg,R⁄tQWnw.ÍQL˘6Ÿ‚âQfP+ÈÕÖÛA}1æÓ©è6wô’ö¬3d\ÅÆZáéõ;SäK|N‹Áªﬂ˛hƒ[O∏E¥¿u‹s3⁄©Ò›P©–$Ê€°ö˛Ô»Öï?0ª!(©yKñ(¨7Í4ÇjΩE˜÷ŸœT»ÕÅ|Ûálû€ºŸ«É}`5xdñ¢h◊÷DNj»ëe∆’ÀP…sLj∞<ß√ùí;7YVlƒ–6!+2À"IäΩù»ærKQ±%òÆUzª¢∆6ﬁkAc9°îIm(TÆBï"Ÿ,NU’û._é˘Xx¿¡ı)5!ˇˆ≤96ÖJó+%≥iU»ÚF—∫6 ¬LpïÖ˜‘ﬁ‰ﬂ∏J¡D_◊ßª´™πıºÈ‰*ˆà^¨á¬BEáVF”3yÈ’‚·„]‹n9!◊ï…Í(aò?Î D,(<¥ø”–:Ÿá,jÒ}Ñ˝]π"ÿÇµUµcz≤ld0k§Ë")Á◊HŒù¢Â5ﬁpÒ1«<zÁç„à‚®¬8í8é.ê#âd·$≈ücPTç}∂+ïLC∫'.ú∂’ô⁄çxız«õÒÆ…6Ñ≥–π&Fº"~∆(|Ñ'ùˇ@?ê◊[;D1¢∑ã≥™~Å0¿)∆Øú\∞ç ot(;ÍÇ±°÷h‡^nw∑¥ç/ô(áH´∂˛‹∞ Œ[≤´r7‹∂>ÙV÷2*uxÉ-%Jvßç∆Y»vöi¸∆;h'ﬁüøt¢æ¿wC•Y≥ØH+¶ﬂˆ˘‹l¨”#Ï≥y4}™ßÇÙS∏^
“GfóˆE"&vOõ±Ä)6Ìö¿C5y(&≥	æ$Ÿƒ9uÓ<≤+&´^2o!·:^ÕÙgåﬁ˚Ìx:âkúPç$+:)X±n'ÛHéUCY÷Æg6ZQ≠'_áµ˘?µ]≥≤·;M>´≈Aùa§fffÁÿÚ“íŸáo’ÄY‚•0˛Ï9X≠◊˘V‘¢¸ç¢oƒBïàO§(‰'©	ƒG!ÊÚVúﬂÚ3üôvQ5j˘£§≈h+ÕH€˙@£9I+π¡ê2Â°4≈+%fRIãÎ˜*	3çäAß€$9±£ÒÌÕ7YÚa°Ÿ©∑ÆgÊgf].àáË˘∏«ˇ?æ¯éó“⁄ƒ9*Ø*Ö"Ó/—lóÏT´ŸŒêﬁïRÊØî<›ª.·‡…’$o´«aX,NÈB[7SÆ≥ËãL]∞:“ÉHç(Ú"„$+Ù∫XŒ)¬?ó~«ë*lı⁄πUd[⁄•/(0‰3˙ÖÖ„Á"0I_3>˝·´O‰JaÈ2ìôÛZd¨“Á‰À~ãï∏˙|é∑oÙ"àƒÂ/(˛8Äé~ó5(¶ø◊åì•#Sæ@êF5H{ÍQùc2Rº˜NÖVà˘?#ƒ0¨ÜÜyF$·c∫≠±e43h¢êyÎ„≥Ø	ZÛ¸ª9œ1¨	π/˝º.°€-õ[¿Ù≠[c•V °ˆBA3Õˆ¿ÃÉ˘äm»çñ¿LÌYLö Ò}Ä%0SY™\û_Zù/˚6”wÒiÈ2≠QÈar¿"U ËåÜnÌ*—–e
á^YZhSx–PYæÜ\”ªƒ/y∂6z∞ﬂ-Rö6$IIá>ën´ò≥z¢t[.n™ëò©ôïƒúË¢»Ç »¸Q;ZEöÏ	ilø˝ççüO¶€Q^m:›™fF≈ëvÃ°%ÙØ2õ=g⁄µ˘63Înü˘ê?º}‹ú˙g
∑Õ∑LàD¶m.◊rÒx9«‘E6N5ò¸ñ¯ñèç.J_¸ñ‚ùì<5GÙ˛ó
ˆøêÛœíä3©<œÂÕ·ŸlƒèÖπj]ôÊ`Ã∑	˚QΩ…øBo ˇL)k¸≤G{hØ÷jQXwÒM€è)ß∆ë‘VÃ∆UêÃÊd(¿Ë	œj7˚í4Sîö®e∆‚ÀB19)™,ªˆÍÏ⁄˛úÉ:wV)ÈâYˆì‘ÌG]s|<6ΩËóÉ¶9SΩ$›MŒfÅ&owNÇÚ&«çmŒ;©†‚´bâ¢†‚@·◊ª*≈r≤‘í„dP¶∆ï3*,g KT6¨ƒˇ:åjΩ°õ¯ıc÷¢Õ õl+¢¸3¨Å§Zƒ˝*RäX)”RÂ:È4Ë¢Q∏∑‹!…—•ç‘ıî”√∏gñıy`Ç,.2»ùÔw¸ÃS'¢≤”ÏA†° KÔÓ‡óñŸ‹aµ'µfí=_k„VÄ9†º”»áìºxd‰‹Ò-Ünì>Yâ=Z]ø\ÛaxæŒXÆ/Z ]\c–™MÉX÷◊"‰ƒƒ¡¶yq√LégÕZ›h\k÷ÍF„[≥V7ÁVÁƒÅ:6cAQúa#Ag+â7ñÜ@“1 2˝‰õ 
zYﬁ∂É—zÿÚ•Õ(ﬁÃ»u*p7sÜ◊î∏#=πå≤“èâmiÑCîM˘˘zÚW»≤·rÎD!?ïÑ89ÀJ…Íú’›|•§34˜	ıŒD4V≥≥?pÈÇƒ'†KFﬂ€`¥’X^<;;√>ñ‚æ/4)<m<E√4˚7Ÿ≠NÉ˛¬Ã±”π@Gï‰êe´‚•ì˝/i$76í.MÏç¥ì]Ï)¬ûB,≈|˜n‘±y=∂©ëküic√5é›ÇÍÎY∞OxÏìåÄI5ï,èâ⁄:£¬%b6∆-˙q.XˆkBˆ,Ü “ÀEÑP8ÀÜ--Çﬂ‰†X)‡%+aPGH©5u—4ˆ„ø‚≤*ˆº;ß+ˆ–C„ <Fn¸>ü0—ó¥®gDúˇ≥Ñ}±Œî·˛¸áÁ_˝úÇG¢Ö›Ö9ñ ñi‰.ü]-„Ô¸	>Ÿq¢˙à˚Ã
èSá†1îòü~Éß”ùÀ>∆ÑrÒ9u«˜ÒdºƒY£√ÒT√¬q˝ˇPB¨∂pÃxnéL t)!ê–(˛$(ò8ì√u˙œ©u#Q∏è`rQ
˘—˝Vä—wEU^ú#¥n§ãkÊî!–©åﬂ)ˇ™\›©ñ˙ª¢Ët@´B6ÇZÖ‚>lHïÒÂ(àÛøû˝€˜ûÃ~ºT£Ñ}⁄?ÕY
∆îÏT∏ﬂ«ú
ˇ–I∏ÃqùÊ«gÚ.”Cﬁs¿S=dÿàÎG¯cöE_Nü0üÑª'õë∫Œ-'¬ô–w'≤iY·º•≥ﬁmu{Ò‰œ&¨´Eüæ§àÏè]µkM·R·X Æ.B@ßu◊Ú+Ó« å.	ı◊É˚õÔMˆé‡m-Ãı¯¬¸≠? Y%∞DalÓ€µ∆n±'∑ò'nØ„ﬂΩÓ¸m\G˝É(Í‡Pïo¸Xu¿öÏpª2FÃ]òÏ)çY”ŸÕK
ŸÊß6⁄sÓlãÉﬁG	{ÒÌ˙ˆgÇΩ√“Eåù1⁄\¸ÓÍ6Q≈w*±C∂Ô$^˜˝ê∂e∫#<Xpˆq!;ä€5ì·ñÀ@ª£Ëqæ Të-™8€EW
%¬¢¢,–Ÿv0ø”,R8ñ9MŸ44≥HU0Li-u2.ÏR'≠Ç√f}%µÓ€µ^êÆÄ}7ø™ss…e\©ÖZ96Ù* }zRI Ç ËÛ[∂˚¸‹d©ñ)§ƒ¸c∫Ó_Q∏ù¸∆JzüÃ‚‰“ø;æ‹¨áM¡„Z©e"—®:*Ö÷ÑnMÆMÕ_‚‹ÜÈæè≠V7r7‰1g?√˛˝] ”Iêy Ø_l*/wx÷ã!¿ﬂ°[(^;£\À÷.£ÔÁî≈÷üÎán…NõDΩàPÌ 3Fê˜‰Cº›.V
†„í«vQÅƒïá≥ÄN∑<ôwÚ Uû`¥˜#Ω'Â=¡ÔIh{sYwZ<@V¨≥ºR;≠Ó¡¸”y»ª)‘œ÷-ÖW≤ƒU¢Ï Î°î>Q™°∏ﬁ™Ì{Ï⁄Øˆ˜¢Z√„l¶ﬂ”÷3õ{"xYSEè‡l±∂y9$Nº™ ¸{ë≈˝C`¯>b¸!˝=ÆΩ÷ﬁòa√·ı≠ªW˚{„<«Pw•Bïõî™)Ì<o∫a@Íõ¬àüF◊Ï-¥$jaˇzŒaOß°ÀˆÜÍﬁè4wüxÓ(ÏNc«oòc.ïzÛcI.¯Ω§}ë'v;æMÛaáö<d˜*“Å´Ø…ıóº˘C&˛HÑWèjQ¯E›.º~CﬁƒñfÕ∆”P"˝¢T√fº1Ëıxˇ∑`ë	Íø∞â–ø‹GÒ`ù|ˆ|éæ‡B√E¥cË[(®£Ì]n0ÓN0.˘Ù$]Üû‰ÛT=˚\\¡	öú≤Häı≈ï%7ç2]√m˜1\>2	.œQ†3DTì€ƒí◊’~#+”+9©6y{€›NWY¿ºV#—^>√ŸOYŸªçã˝Ü„pO©úwÜ≤>0ÃyôDº`÷ˆ…Û6/-¨‘g©ëéVƒx§gÊp∑W>ÛHq4˛õè˝é∆•sÁ&8gÁ5ﬂY%@§NÆ\√C‹±»ô¶n4“◊k±XdÄı·$/∞è4XÃíöﬁª›,P[Êå ìπß€ÂÖ¨π¶ÎHÖÂù‚∞è6•'® 2ÒÄ¥ñ≤m'¶í‰d"LG©Çh;®!≤ªÎ>>ØÃ;L[Áå&óˇ  ˇˇÏΩ{s#«ï/¯ø>E
#ô‡à Ò‡´ŸÕ÷Ä ÿMãØ!ÿíÌv(Çp„5(†ªiöÎâòp‹òòÎçıïΩÎÎ]≠wÏñB÷xﬁàπöà˘´t¯‹˘{Œ…Ã™¨™Ã¨àñZc¡® wû<yÚ‰9øìÊ√Ô‹}1~û[ˇÎ∑4√b∂Áˆ:
…±û®ae∆˝Ô√ˇmÊ˝OÏnxç¸µÌnÚ™ûÀ©Òe7_i·gˇœMGKÿÅ~£◊e:3–P©‰,Ãî÷î”˘IIQåhì{pbe€d≥5≈ËPáRZ‚©üÈ¨Ú‘èo°«Ç·Ëƒû¬´!‘&¥ì“˙6|!]XxP˘~¿Llßod9]Ì:\TyÑLΩ'óæ›ª‚[ÚáO¯Æø«Y ‚/0π"‰∫Ì3‡$jùf2ßdE8∫euú.h)>√øôd˜äPYÈ,S√:¿rº¯oÙb—Pcc,Iïì¯"CXÃk1i€É5$F¯ïÆ¢—¿sÌÀàRL±é(˝7e!ùéÔ¢Ùµ≠§Wµ√ßQ6„'ç[S
“G']“çó-Q2ó›$◊&8†¡a)B¡-òz∆πﬂW≠‚‘%>® ìC)§ÇDk˜»F:K…ÚÛ.‚zˇ¸_R:ycä´»)5dˇ∫Z(LÔgûÇÄàç}Héü¿ﬂñÆ·_ø˚	Fﬂ&.»≈äüS¬/ô∏v¡d]õ¨?¿;·phñÛ O£ q˘≠4–Ä¡ûÄ«åü‰≈`5£•$q[e≠.§Á<œ=√iú†?3N$wq¯É?ˇÊ€"ˇﬁø‹TÄºqCÄ⁄"rM ˆ˝	ÅvˇÑªõ,ƒµÎSL5"e:-Z–ÈÀ¡d$ÁìFlÇ˜”0◊tﬁáÖÂvVs‰∂;ÆX'ëy›¡¯´†ÇD∆o·∫vK€[c≠ö}‡z1ª®	—DÊÖıI„‘ip˙¬ﬂg=gÙƒ[ _%s∞%Ë<^Ôπ„…Ø ±<¸.G˘Ûª˙…ß∑jÃ{™9@î∆&X28¶~>°6∂fìp´°åBœ¨MK˜ü0Íå«nˇ b[ëy7¸;ˇLMº…V∫€/˙†˙∑ÈäÌ5ˇNYZµy<rö„N”È¶+xNûX¸È`ú∂ËqêtìÅÄie$·,Hå,bÈvŸ7èôÎi6A‘yp¿Ö”\qaâ°ç⁄v3‰Ú;Œ:ø‡LTÜì±
4€¢(¶÷'√LÑı•À@ÙéY`◊˙∏T~#J·F¸ÉÔxíìl¸sYQ∫‹w∫ÁπÔªŒ®{ô≤	Âpf™µ“ÔOúÆ¨PSﬂ#À,”j¶9j√ìmÖ≥ç¶Oò¯™?Òæ·Ü?J¶™?S~Æç4π —\Îir≠Ds≠•…µÕµjÃeõ¡%„"!’ÒaµS‚ÁHòìzhN¸»R	=Æ´sr|qÈuö^reFÓw⁄ ;8„ã‰| ú‘˙Ìn«KëGôëmß€ôa>à{∫≠˙x“Ç”	Nà'æ ∞z‚∑ŸêG†ÑÀmr∫›<Å1”ã™„πY√âRPØèrbtÂnÁG˚Oº‡˚s~‰¬ä2c±∞∞(¢m¶(^ ÿk+∏˝ª—'¢xî'R‘±;Èv%8¸c.Uºu•ÔﬁuŒkŸı„©œØπ“ß®<U⁄á¬Ñ*ﬁaÇ"Ò„[EumÀu•§($F;3ñ#H-48ö¬¥°‹ÙÚ›2¬4°RÑFg‘º`M∂qyä†;îVY£∂`~\ÇS∑7‹C4¶Mv‚6£÷∑Ùä	âqìıÈ≤ı6Y/¯·Àg¡£éWixP˚&kp÷Ï≥Îª´›”R˚0¬kÚ0ä5ßyëÃa4Å…ÈD¿Ûë¥«œ=„ôÄÍüÂL¿3N}&‡ŸlgÇ§¨ºs¢µí ;&¨Ñòób‡lTäy‘á1émfá>%…:‰iƒ3ï®Õœ ølâjÙ≥¯œlöıÛ…G∆\Ê≠ˆ∞»7øB‚ÄYS(£dM πöa ¥œ¸éGnÖa°EJcìU ;sœ£,úı·5ÙS7;@∂ÙÅ3fsˇêó
kí´{÷â≤Å˙>gtâØ:-áÑ“f¸æ”ÂŒf»á˝UÖ>Ô∏]–ƒƒ.∞≥ò>˙◊ü$W®1í¡Z¯y◊•3~ßGq^ÈL´K«#©@›\Â"´_T3G˙ÇàŒ#•a¢%I=B˙RÇÓGÀ
+§ƒgAÃî€ÇâÄÃ(_Á°ÑlaI|ÔÙ≥≤p1 ãÈâSÜ§Œö÷lBDËá>E<⁄¥¨{Qäí⁄ºf“Bqjœß\ú≥≠±/;ƒ0`›∏Õ'ç¡sxçHX%ú…X
ïÁ∂|â¬¿¯ıüßÄ≥äûôì˙L_§Ñ£F/∂"uΩ+˜RûãÊÚh{H*%ï£l"I•˘IÌeŒó ùßò«SAÍíÑg»TÈ˙Í√¨ã‚0¥=OxæO°?¬si˙!Õ=¥üæD x™äº∑ÿC††®¨™?èœA>ñÛÉ+ÍáñLH&Å9ªRE)`Ñ≈à®∞`
ÑFïØu8j∏¡iöÍˆÂ.IN‹∆3J¢uˆ”•Òiÿ>Bïf©8|†ÿÎ∑‹Á–ÊË“©Ç^~{¥0"÷ŒòVQµV·ÒæªE˙ºË†?•zÑé]õÏÒAÓ≠+tá…˜œ≤ãäæù¨õYüóÕË§ò3–|lF&√ú\Ã√fl,Y‘ΩPˆ!≈fa[Qâ*aÛò∂ÏÈ6ìiKOππ0Œq6∆ìf{÷∂∆¥•:WÙl;a'∫–ôÚ•4Û14∆¬ÜÔ"l¥Êô˛\WãÏkŸh›Ê”]•bz}“l∫ûw‡µxù>,G7SLEË˚ÔËŒËÛf:Â˝=°¢˝%ˇå[8Úü+E˝≥p*˛B$√π?)8§d]ÚÔ‚ñÕ–ÔMCnÃ¥ÙI:i)‚	⁄åxºãËµ˘ÊÇa<úV´2iu∆˚ÉvˆqùJ·%b@∑Æ¢åÂöeïáeIM' ôYéûÜÖ
	i&’¸í`Úèß—˚¢@ﬁÈπêƒm∫HÌ\/ò∆z±R(¶≠º&üçëÜ«‰B\}T«ù∆ãÇ™{_z–À˘¿\Ü¨%-Ê>È0öo
=∂$-Ÿq˚<ú$D%Ôi;å± .r´¥›ÈneFœìÉ'≤…û´Ë+ùa∏=xæï)¿.SZÅˇ'€‹ùÒÖ(nø”wõŒp+CmÕ(O8ËÙ#è?@ÄÄ≠L)√Z[ôÉ2[qä¨’ä≈\Ò¢∏¸d≈ß•¸ÍF$ó/›*Á◊Î›‹Z~•∏¬ËØ|]_ø_Ñ+lÂ)$SÚÛ9L±_∆ØlˇVdÒeF…ﬂ_˘Q¢ùÍùeÏõ°;¶Ä -'Y$Œ	ÇÙCip|ë•πërwi4®"qr≥Ñ_q¥àì_Ê˛≤OF!-œÖt^´‹Ê∫˘˜L>˛#ı˘Fv!üPá•%Ÿ‹Ÿv]ûXlÏîòø◊8MA»≤Rò^¢xæƒdIÓùe$aòoDö#dèŒVdΩV˜≤€V~Æ§Ä¡ƒ}§òÁ  dœ≥3Å«œu>—51õ.
¿2
û/6ù—ˆ7åÜôıg1¿û3⁄eíÌ®Äã
V	π0∫¨õˇ§§Ép%”á1‹ôê‚&1˚l—ŒÀ‹I∫ú>≤L<ÑLOÅ+ú1ÑègPcuπa¥s≈Lpû`ôâhV«◊‹Ó√z‡_k˝dwü◊ç≥îpÑ˝ƒˇ¢ªÔœ˘^˚%∫9¿FùçÕbÉÀxR_úès&®ÖÎ¸ñ~]P5°ù/êg&(“~˘\9Ô„Ã¸Ò∑Ä Àä‡l¨ûR∏uÏ´û…ÊÜL‘Ú-{]XXÿÏúòò7ÛT&ÊM¡ƒºo,[…≥ä0∏È√Û˛¬§µ∏‰3ﬂÖe£#≥(0?√OøNv«[™ŸØÂ[v˜ö∞ª*w©PZÀ‹ïãÕÔYWC≠Œ⁄;·µÒ=á%ìz_€ÿH—^éHX ®yúª2DIzHíHDΩ∞Èøù‚√vkSáªå®„
7P^/@Sok2"„YænQ@^Ê$ºÑÀ‹√±ÚÙ¥?Ìu—
ª»≠ºÆ◊EÇF•"+ªπµ‹ZØî[u÷Ÿ:¥ØéV‡_˛´Pƒs∏ƒIªÀÖt˝*˛˘Èg≈Rìt)§˚√Ñ¿WIÒ≠!9\°hÃâÎM∫ËU»∏`ﬁˇU'æŸ√kﬁ‰vWπŸı√
\tZ0|∆VN ÈHÁˆ˙Á÷pFlpŒƒ
Ä]ò3ÙÈ§9…bVB (Ê>À≥ë3åÖ?å±ã§ı7kêû¥‚i‰t¿°%64¿⁄.∆Ó¿£‚´@˜‘ë
æ.1§G»ß;ìÕ∞"õº•Hì=ñ¿Èë[é≈wÛcÂsı3À’œdJ:ÂIz¥“§¡ª=πP!Á?∞!µm†ì•ëùN9:øÓ;h9Á ˇı
á ¬◊Á®ÉêR≈ívR¡_]EQ!RÏu;EaGZØD∆”Œö*Z(UìQ  £î_ëå"ªz3I•ÃÂîUV,wWÿ ~Ò[Oâ{ñB ·üÈ—àèËq‹ˆÔ3≤f‡V	¬ú„iÆK… Ct(XRâ-%~ò˙±¨Æ˙¶uìLÍB^T◊K‹∫‚dG»„∞¬ﬂˇ"íJ7)JˆôÚŸ˙!b>â√~PîÂúıëH@°\/>N5Hh;ÕÌii¬ÙÎiU¨Î¥9ﬁ˙„¿ûWﬂ÷SnåogVêààïå¸FŸW5ÁëkÖ ‚ˇπó¥¯(ñÿ≠ß•^Å≠\‰≈^n-´º?äÂ¸∆ÍZ≥ò_≈S$/îr≈¸⁄⁄:+Ê◊À•\yR¿∂“ÃÂ◊◊·]π\ŒïÚk∑Vƒ˜r~eÚÓóÛÂV\£då^Âã∑J¨ÃbÂ‰SçËÚ+g%!å:Ω˘…J˛†13é≤+.›í≠mëCÀ˛˜æU¨ÙÏÀèˇÚ„À/?Ü*~/˛Y‘≥ê®πÚØ(	2∞óø˚mj.q8ÄÅ7ÙÑıqs–?Ô¥≈πCÂKlÇµ¨≈}¢Xó¸8áŒ®ü’≤´ÖÂ“*¸1?ßµü§AM∂<‘AäèR¬–C1Üb8ﬁCëàO˘À;ò'ú+bØ˛I§f\ˇ˝v¨#æ¡•Œ”ÎeÓöL»a=Râ…\≤òól[ö|Y°of∫H{Ë¡˝:Ó˚∫7≈sZw÷\KæRÄ#˜âÎ·ÃÖäÑ‡Ë;L€‡&QE	÷ËÅ“‰4à"ËG& ÌÔbÄáı¥Ò˘\ßQÑ¯1•÷MöÅ’–}MR†\ºﬁ—≈ú
T˛N:ÿ[—©ò˝
≥_Q}tg•œi5ˇëNI'Én7}p∫õ’õ WÊK©kÖbKÕ©Öeˆ,∑R–4ÓqDíˆE–E∂óAâÀâ'Buó’$ŸÚï∑Z#⁄≥,»≈≤›æàLmÜ_·ˆ˙Øøä∂œ,ÎãÎ≤›˘ùZÔ?˜!ítû=)mË{láπà∂æEe§6Õ©E+¶-(fÚüJ±wííπ°∏˝•Ô”¨¶¥@‹)#?Ú¶ç˛òíi∆vWäÛ(Æ⁄RGyƒœ◊Ì™ÆoyêVùnsÇ[VÎµ˜_è~¶äeâü)‚Y‚áõø◊”‰UC[˙7êb?«» ∫@ó¶—_¬,ó¥‡“Ü°ƒœ4X˝$º¡ﬁÕ‡d4e‘äXüøËBNFÔí˝ñ4ÇVÁá¨Vg4ŒññÿBaa™ÄS
¢™Ò Më&Ê7`≥FÏö«‚l_ù,?eƒ*√3!|]oÃÉäÌÌl2uqM0kñÈ
KW‚ƒ7ùµÚ¥a◊®ò»–!Ñ=›ª∆4sS«”ªC›ö2ì4◊‡–\”Eê¡OïnÖÚ9œ∑bÓ‘•¥:¸Z[z:}Å“‹—ƒëë	Î6¬Èkäô°E◊≤¡Y
Œñ‰N1?õ2~‘ùJöåuπ…ÿcÉ/πksËÇﬂ∂YE.¡õ≥0O0˝¡o˚œ@!≤Ò≈h0i_–>g0OãŸï©åm·Z5„âBˆïX¥Ö¨÷¬ˆSÏ∞ÚCº¿Ê‹—´a™†:¯âiÈúÜ7ËN`öHÀGìÊ‘*ªÇ∏-d≠F„05«Å¶ﬂtœx+Ÿ2Ç√Ì∑€ÖÚ˘z∑_¡‹*‡<Ù™∑	ÑÆ¸vã¯vãxÌ∂àY◊ÌÎª=Dµáﬂn ÁÎ›$"‹o‡V·´∆^ıÜ°Ç4ªm|ªmºf€∆ÕVÚÎªyÀúf†ÇÁV(ÛŸ=få=NEF¶ˇÍqßOƒÃ]Å1ÁûÂäkºö!y7¶”_3[‰\?@nòú¯rµa´ÖãëÈä!+VeÌb‹]uΩíf:t≈˛8ïákh6Mù◊¡<o’‘À4¥˝{¸÷U‰íÊö-«åßd'”/áôh[å@U"®œÖ®WnB‘1[_@‘ùo9ü˘&úÌFïÑ•ü^6ÁsibÜ
Öí4|©B4‰FbÖƒFÙWv/µ∏\à2æÀè(h,ÁHÖË§:Múl?À+ﬁjS9BG≥åS›á˚©Sõ˛§^∆Or‰kQqrÙkë0)6Oñdá∫ìã@Êü8±)\cEM1lœ5ùø◊XÔÔ%YÜ€O„uí∆ëñ¯ Á]JCîq#∏^kÛY“!'› WŸàœ÷Mùe{æ	ÂîŒ≤>kÒùÕØNÁ=À?≥ô¥øJ‡UQÁºL⁄7ÿ˙˝UßƒJ!æ<ΩÂˇÑ/ä+¡œ\È˝[J⁄\È"WÓÂälNg¨‹Éß¡è˜W^±•:	D,Î)Q´•è..˝Ô0n” 52¬O7˛"¢Çw*…cW¶K6∆^F{[[ödgè8cÇS¥zïF∫…ö£hQ™4‰˛≠:Oª5yJ*á—Ë≤⁄ÄeµÒ
ó’ú0çø)^"©V^™ÛÏùãïò9∞r≥…ÍLÜˇØìO|´á	¶?¯~lóúΩ˜ùÂãïd¥Édÿb8äÂ%¢«≠‘Y◊uZ$_¬·‚y*œ”È}wﬁ≈ìaƒóí@£+ﬂ'd¸¸|ˆÁÔxTÄ?H „ü ÒT∆wöπ˘’ıëqÄ‡~Í{˝¸Qâa	êGÛí~K&ÆòΩuT8Ê_JÎ˜9˚O˝˜hÊ´Èf:`ÎînAhb{·é@ÄÑˇ;Í^≤˛¿è|–Â,<?
;ãœEßœìπmHÏéº<;∫†‘ä:Ïﬂ6%™~ÿÎVŸS7Ÿâ(—Ö(q…Éo|kÕl hÃ§9X\/fc«M˛hU(ﬂÔÏ›€;≠Ï≥ ÈiÌpßrX≠±˙˝ZÌ4&⁄_9ÜÅZú:æƒ¥Qh9˝¶ª@ ˙XÀÀÏÏ"ËŸ’r.ÒZá¡/>O˛®∞ﬁx…À≠k1€^ˇ ﬂ≥-åî…0îO6®c /±‡7O˙+.±¬bŒ»î>6tAÈ"‹Veº(>Ù≤Wå; mÜjø^bŸ≥%÷°év∞Ü∏ç-sªËßÉ8x>4åFÜ·è=rEå.Dû˘Æ”ü8£ÀÃÀÏ∫çë¸~Ä¯"¯•2u∫¸	Ω¯ÓÑÄxxﬁ•˜ïIV~´ªC87‡u¸8jé‚Î!¨˘x«m∫∫ßx2Ë5ák«UÏá˛√Ò‘võGw[Œl1ƒı‚Jr◊≤•–Äx§˜›‚Äz·–Ã˘NøŸÖäΩl¥êp∫E}Ùg˜õ±¿Xi(øb¥“¯ZW˙,cÉÖÛ	‡œﬂƒZÈvQJî(a˙‘)™ìXÀÒ"‰õpï2∫ÆRô√T≠0GWß¯ã“k˘K-AvË≥zŸÏ∫∞ú;∞	a â«.h°¢8À›e«¸ü
ˇgóˇ≥†%‡Ò†›Ó—R1˙ï¿8¥bxhÄG9~`Jù;D»ıa–∆z#Åa‰Ø4Q'Ÿ5µ>ÿ6/T2„-µ¯á–r†–á´«»≤}‡6i‹~L√ˆc5ÃEÈ≥a‡+ø:§òÖE*3ks¯±`CŸéï|ï)ÚUî|ªÊ|2…Ç÷á"6J[îAWö†eΩã5Ãh(»®R£&±fjØc€]<,ä⁄Û·`4f’˙˚ÅV{ﬁDÌæê©¥‰œu”<3%«ÃëÂ#{∆*Û˜Ωáë}˚ëâ°˜J∞O.‘˜ñƒΩ¸EéíK∑DMi∏-gëz—Oßx˛π≥•ÓÚ‰ùwÙëÿDxT¥«;Œ%¨≠k]Ï´∏Ã ª¿Ô+èG.›PA´˘qcø∆¿é›j%ú∂ª†sÈ·£3<√°1o¨!ü+êaZœçéW88Cﬁ¥*úq!h√Fc:ﬁ◊öÃó≥êz%|àãÊ°>òÈfH÷÷ÒvG»2Ö¿[ãóH«¿,Vm·ZüR i'ƒøU◊≥wÛπˇY÷oÀªƒqª1‹ ∑¢r%áSg·ùwbe˚9ë«)Ûb (fÑS$d÷áN”Mê‚ı∆œ;(ŸoÖâÊµf∫6…Ö/RñªœÜJ\é&[dç!ÕA†⁄Ì<w[Ÿ"∫∆-ºMÉ\»ﬁ÷≥o¡ì„‚6ÕAÎ9¥/ì"n™.Tˆ(ÄÍS¿¶ fFˇ^}
e‹E4u˜•^©‡(dÔiñ2?òÏ÷vw30r∫Q}¯∏~˙`ßvxZg’ IçÌ‘ˆYΩzˇËhüÂ‡Á·È˝˝Ô´«–ì⁄ΩΩ˙iÌÑG!îõÃÛÙ˜ÁÇÛ5º
ØÈÎ«èÚ®çÃ.,-h„~>|\ÂZ’ú™$º•±¸ﬂMΩÃ|bé?u•’Ò7©<ë6πÒ⁄·r_±fö¬Çˆ ¯Çå˛°üƒ5Ó≤«ô∑Æ‡+åpù¯3ú_F.ŸJeó3À Œ.d2ã◊ô«ãAMÒìãÏ¡˙ñ≠™—4_ﬁÜØŸá)=ZÔÁ`˝¢vp^›n^8#ï∑&„Û‹∆Ìçh„á–!O~p≤üoé\`˘GÑ%ø≥Xß1[∑”˘ZÉÊ§ákìgÆu]¸ïÕ8MNÃìÁ¸®”ò¿ˆíππÁpjÜF§Kè Ë›Å”Ç<èÎ’É˙Y∞iüçù®Ù˙HFÛR“ô≤dÆœ≤9„®S¸.„s·E˙≠ÍEß€ b{M›h"∆∞.òy∏∏ë€<uC≈iè@÷hÆb&éOk°≠$uÎÁBmäè|‰•/Õ1]πúõ—uëá§„—˛˛»aêx!?ı„ø˛L™\ø@E:*v?˜¡óT¸§è?
 ‡Îöø…s¡„ΩRû‘pbp;µe° ∞qΩ´fBaitô++‰\ŒDW⁄ˆà8≤>AÑˆiø∆‚ªÍ„∏∂jœ)«¿ìP 8ﬁŸeßnoà◊ÿ–
∑9!6õ≠¨∞}8ìxMgËFŸízd°rÇuÜ≈m°Ñ∂T˜dì5ÉÆÎ†ñÉ£»€é3C,ÍÉNøÖ¸î=£/˘¨ Ë∞À≥©ìÙPV{S…≠ódùÆ;Ê#µ›h}ÀÜÉ·dË·Pˆe>≠§OUgn@Û}ÀÎ8óîtáñyü‹Pà«çÁ˛∏◊5ß-G Ωö”ºò‚ÿdŸUk”ßö˘pÛÕ>¨2óÚŸY/Ü”ã©ô‘èøÊîs=ÁÑã¡π·¬mCêq˝˘Á*r“ÈLQ‰./„ú –èºOäÔl±«æÊZ~9◊ôª$v]ì)⁄„øòòd	82˙0≥≠é§7æÏJTÜg.“#ÔÓ∂nãnßb9∑Â∏çc,Nu◊6ìøh¡ÁNØ”Ω‹Dé7 {ê€¸ﬂÎ¸‰”¥ü2÷¬cH_e™æ®áÃ¥•´E!ÜËJ∏æ!Hx·é	†Éÿ=ÇTŸdUtK∑ çPıÎ¬\=ßsöhcpskˇNÛIõÏJr≤Á≈Û’Û[Êis8ïxo07ná≤Á€∑t^rœµÕßé[$jáßiké…ﬁU√•¥j‹¯·9ÖeOæ¡*Uãt‘õr˚¥™*Ö∞Û0Sü–ÌÍ ˇû“˜\˙N◊ØªtMZw2èäF¯õ≤F“Ï˜—\Ê≠<2îŒy!i'<ÿΩ5‰”∫µæ^Xª-ÕoÂ„∆ jπpÎ∂¿G2⁄›PƒvTÄ€Ém†}úJ‘ú}Æ#w WÌåÅ≈Ú∑"©?ıúÓmÙ„iw˙πÒ`∏…äê…XÃè≠^~öéxMRÔ'Y›0ﬂysÁ®z˙˝„%“Ut«Ù_YpÿÓå;„Æ{◊™/SÙd˚µù{µË-Â2ïI√o6`˘õNèŒìQ7ªp1ΩÕÂeú/ﬂ⁄pvº|s–[nz^È]æ/nÌ!õŸ|≥ı7péªΩ
ˇ≠¡ÎﬂF°ùV«ÉS⁄Âñ˜ÃöÙ›Tyœmu~†±¬¿˝Õ–iª Ñq˙Å_W¯$ï Öz=∂÷Îô;˛!tª+?SAœ·œÅØ96ût∆9jï„ÜGõÅæ	˚®Âï≠˘˛ '˙ÃƒP!—˜][6Ûﬁ%K}!âfÅÊN©û”˜rû;Íú€"BÄ%•?(Ÿf@3ﬁÁŒy”ú…‹˜<î”;ù>|m√†ühúkK&!m≤“JB∑Ñ˚ù”ÍL<ÖRRÚÁ9nÔD»†l∂ˇaT+6j7úlaâ˛ó/¨Z˝Ix≠ƒô7ËvZÏØöç÷™[¥ezÜ∫∏`
o'6±Û#ÍΩƒ‡X:eô%æÅÂ8∞∞méR6MÏç¡x<Ë¡‹RÕÃz◊z¿A‰∑ô:„5/ÉnéÿnÚ∫„,´î@°˝Xhö%)ÑªK“Z…è‰Ç∂ıõ™≤-àl¿Erx4"˙@8:[ìá”õ4¶—b¬úÀQZY_]]ªïzÏ◊Ìc/G,⁄”[[∫‹s«NÆÉµ¶ÂW¸Ë1oÜ·]ˆëıY"§c≈µÑ-f¨8≈†cOäÈ-óWä´˝ˇ¯;¨Í}=Áaûkby˘‡íkÉP>8OÕF¬$ádÔó∂æÔpFôíÍì]˙˝|ö≈Ó:Ùü%ÓÁ±uGæ•DJ›Á7Ãv*õâO¯≤í4 S∑v¥	GÛ\ì.›ßàÌ>-kú]Ü‰Jf∆u«‰‚π„Æ≤7˘1…ÈèÂ ⁄Í˘ öVõ¶”…$5¿—7‡‹uKnI€Ä[∑äçbcn875‡º‹\◊7†ß?w °3ûå\œ:Ô*WZI8g¯|›Òl	}∑Yná∞) EÄ…ŸdöN;áõMä%(X,äOr!ﬁZq çç4¸FÇ4É	Ì∑Ï‚‹t|4Ω(&µ–4&	í≈\∑È|c‹œ%Î!n≤9ë˜wö-Ñ4ØB˛öÊí$ED∆ÑVpOÛM&\Õß8⁄ŸùfB7…~ÍiMÿºç∑ÀÖ€ùe≥˙ÔéÁ!p4F__ﬁØåÓ~áÄ•n«±@⁄Scg~Ç¨¡∫Ù…‡g+#lËqv1s˜?>˙≈'ˇÛãü1ä9éV	d]±L‚hY±#ÃÅíúøìı«¢QaEè≠3J¯¢≠å™y∞cOB¯∞ﬁ®Ö¥ñ|⁄Î¥Z]◊6Ê¢–ã¢l©™V»Xî¿@D≈¥>∑~©Útùπ[ΩpFN◊y‚]\:KÏ=g‘wŒ'›ŒÉ0QÌë”c?f5o‹BΩJqÏÌ¬~ª^\]YO·0ô¨bHA∫3è§B+˛˘:ÖﬂpËfl{ør¯ûoÄJó Gªª{’Ω æP∑/†ÒÁîÜ§<ΩÎ¡Ÿﬁ–œ—∂TÊÒD<uûJWã4ÑzË:l3l‡3´Mˆ4†vä∞ÉÎ¯¿6)|‰dë∞Êì√‚§˙•\ª	¡¨¥J∑æü&ñO<˚Á◊ÅèÀl≈àV†sÃîƒú∆>@
°+·÷"•©Ó≠´µf"•≈˙WÊ£'Õl$
®4fÕœ¯Ì‰‹I R)"4›IÅı÷ï4Ø±çf"®Tä5ßp€‡Ïf_l·,t>ÇÌàÿ·©Î4/@H´À¢í√:jK„Øu◊È"L6c9(Ã4;Cåîô≤Ev9∆˙“ké:√±πh!z¡¨=E?@4Õ(ª∞st lÁ˜∞íZKF/º‡3–µ%ˆ+rüMpø^æ7ÈUﬂÅ–l!‘
¢êˆ¶˝±∆$E1∫Õ˚∂Íd≤´iñ61Üq≥Xc⁄ÕÓ¿”ÄhÕ¥©Ä©¨¥QÃÓ:ó0ì,+lò}aÊzQcù≠µÆ˛€	
#îÛúﬁ∞ÎÊ∫Ë_Ã›£#…C÷‘É!ÅiöOáE≥#Ë,œÕ¡-e|«f}p∂Vƒñ¿HÔXS(z‹ñ¡k˙ÜVø™›“åñÉ∆™X\ƒêçVöÅåÄåã2⁄Ôá‘uÉ{4~ÆπÖ¨ôk@ùoKˇ÷%8¡ø-aLq‰6ˆåË/Ma≠>e€úÒE~48ËAWÔ≤BæXB)¯ò„æöÆ}Æ{™gT¬s•∑Çã>”x>dN∏}˛P,ûWî*:=ÒSYﬁ=g<Í<˚ÄËl˙5º2∂€∏"XëÜïBΩÀ~ì¶AÆô$~√ßË´rı®vÅ¯eœY•ÆÑ ∑Ëub@_!€1î¯ç`!◊´Ê`‘ÚrœqÚ‚kË)"ÄÍ®U í„úqO<Vu†ëëºHëûY0ˇ„¶÷≈Fq√9Öƒó¶4˘1¬S¢í8í˙¶∆f»©tdwà—“•:\&ü~ÌpÈ_õ<gn\p|)Di.n/éÕ–œı]xoîé ≤!äZ÷7Z¯¨ƒ÷ÅâπË*⁄XœØﬁ∆Ö“rœùIwåÓÇ]ºA` COºÒà––£5D˚,∞∞H8Û§óôƒ#ìËW-§÷∏Ö-Ê9íônôÔTN+€ïzçUwÿv•˙^˛≠}Ô¯Ë‰îUèvjÏ¥ˆΩ”∫∂’C‘6IŒÏ=ß:h·FÚ8óc≈|Ä yJJ9o™ÉëÀv‹*óáù¶˜Fı§V9Ö**€˚5ÛK¿uâügù{ørRΩ_9…ÆüÏTNæœﬁ´}ü{π£äüëÿ·—);|∞øœﬂs‡+ô†{/Q™Ç"¢)–…ÜÌû÷Ó’N"Ø⁄0Ú¿∏Õy›¡†uÜóJC5ï»=ˆŸq˙gI}“≈êü•;èJM∞S€≠<ÿ?Ö•MkaÅUÔ◊™Ô!`%›;dY˘j	ÌÇ˘íYX≠D‹?œÉ!:#YagLY}prR;<=√áo‡äÜŸﬂÉ!yé B»Ma¶aˇn‚é:Æ?ﬂ{á;µÔ°ÁôúÛ3èc|˙dê•â[íÛ≥$z&*)Âπ⁄÷∏rÍ<‡#—\ò∏î≠ïìW )¨^;A›~å∏DxR€≠Aø´µz–‹ È"vcß∂_É⁄´ïzµ≤S„•ë~˝¨É„£'9)jöÌ⁄Èµ⁄!+–‚,≈Ñ\¢p¨ßGôÔ÷è∑ôGkƒ¡q>ê≠lÇõ)f6YÊ›VJ¯≠Çﬂ ¯mæÅÑ+ò5·§ùëÄÍ∑’ß®´ÎÖÕÕzÉ~É◊OæÅg¢Nøç2yAMƒ¢LiîÈ˙ÿGP˘LT5ª∫ƒJ]Úëk2Dmù9cv∫wP´üVéc¥Íø·yÓ˝ÌÉSÊoIù®%ÓEI‹«˚À√v˝o˜QnvËñ-Yx˜âêµ9? ÔßG‡˘A˝èæπ1líHèNÄ¶é˜+’€}pX=›
Ú:SÉóô]|„§v˙‡‰∞ŒNOˆÓ·¯UÍÏ≠∑ﬁÿ©U˜+'5Í‘7∫Ñb´G';|ßˇò(cæÈ\éÒü,ÇÌø‹Æ›€;§$ª–z^∞í:–}ıˆ◊›ì£F§qÜZ›3ºK»÷>»dµ»ˆèéé˝Ωeoó√Édq48vzøv⁄}d'†ÚÎ;L1W´Ì◊„U49AAé∂ Xs{ª¸7~«∂Ú_Ùª&˜†E∑#)≠5≈∆6‘õP¢7ƒ–(â—17‘¨Iøb†‹ì£á;Ÿ¨(~sS,"È…KE˙OÖdî/‡
}ﬂØ◊“’Ñ1/9v˛X(´«ñ#OÕÈ”ﬂ~Jπ˝∆[o±˝ ·Ωï{56Ï€ﬁﬂua)JÊ.®<jü¡ëI≥bÄNÅ>qœäÌ¡1ma∞¬îTH√µJı>å÷o‘æW´>8Mªo«’ÃB>∫_˙GC∑?º|ﬁïÚëp¥à«o ÷¨ˇ+OK¿#x¢›jŒ*x◊#%⁄1÷?ÍÔÇàπƒ∂…ˆfâ’;-7RÃd‹È˙•Ä0sﬂùÙ˙g‹^ˇç7@fEŸ§⁄pü\ı{¡SqÒI|W∂bŒ+≈)uqì˙ü…pêÿ{¢``}¨·SÏ–¡ï_öµòä”!PDûFOÉ¡zb_öïßbÎì!v«„lçΩ`J¯ë4•∑ƒT Ω%‚øäåv>‘ÿgàC‰è€¢!Y Bxzœy.âGyÓü∞≈Œ3
ZœU0h◊ôÄÓˇä’˙$ìy+ﬁ*y≤‰˜ÚﬁÖÎéﬂáØè‡«‡Ÿ=Hàê˙XıÈh‚™eù¬¶ÓÜÆ9#Å˝‰u˜êG!îF4˜tWX≠Æñaáá&«ûaÊ3≠3| ∫håqñ™¯⁄⁄ni∑.ﬁf(ûü{ãﬁ››-U´·¢˝gÜ¢SNn64pÁV§ŸÚô°lŒŒìõ]≠≠Ï¨Eö-üäÊƒÅ&Çg`ãx@∂O†˘Uß€iå:ê-˘∂ä≈%≤œ€B2Yb¡¿¿Gá∏YÕÃﬁåÖwK∑ Î¢∞ë€Ü7:CA{YøÄ}‘Œç/:˝3dnK∞ †Ì
∂ê°e˘˚&_ê≈-TÈ£úëπ–T9∆É·TÈπı\ä,îc1¥^âSlSúø˚dÂ œµ›3G»f*≈Õ wã…s¬Éj-3≥BÊeB%Âì'lM7˘Ç9Ñõïw‰nÑhÈÚ{ˆb0Í¸ß›≠å(∑‰€p˘èdQàDw÷˘∑èÁJÔaÒQ˛ÇN°ÃrIY—Å*¡@ï‘ïh†Œ3¬ÜIÂ¬Qœ+≠´`'W]â]Ì:*5≈†¡äÈ@á;Õ∞≠lØÆÆï#ç|%√VRÜ≠TP	O(îq/Ñ«∑@7Sﬂ'‡ﬂ∏°çê˙çx`ÑﬂA$‚QN∂∏€∂ËC—Ë` •EJê€/AÃ7‰∑ ∏ñΩùy$˚¡QÊ≤-B[…Ã~dË‚ä⁄≈µ†ãÿo8≠¡	Ì‰ˆ'=;≤¢ìK¨(‚Ñ.1k®ø!‚÷
MàE[~I<®≈b([^0zåºÂÑ0ÌÎõOº_îœ5Íß3_°°≈„æŒ¸·¢Jıwh¿"‚‹[U.>'PPúDRp©61ºE9∞0∑≤(G,¥9%RíÖà÷>Ã¿¶˘»/L›úÀ*« Bﬂ¨•≠ƒJÎ”≤YL¡C

„]œeàÃq¬¬8¬(îìckÂ[ú˝•®»Jù∆±K»Á˘+&-M~?È•≤E‘ªîãã°C¥ìã
∂x8∏™ò◊JË-W4ûÒªyyá®lÎÑq∫∫&{2ããåíÜ—D™HF÷/≈Jå~¢˘Õo2è	Õ~:Á°—⁄Bbx®ÉŒp&™à¸°tn7^÷qBY™åüXX%°0E®è•S®êXw’”gËÜËÆJ3Ì± w·Ï˛¸∑œ≤Ãce≥ ÎﬂF0≈ãºYªT‡øÄi≠I¢9_ÿ™=8<›€Õ÷–“Ûz≥≤Gˇ‚ÜõY\òÇ√Ü+ò∑∞’êöMD3äyäI„ú¬X∆zöÒ´‹`¸÷_˘¯≠œ:~Îsøe¸`Ë≤ïÔ“†ΩSyè˛]ºõôx∂{âqòfÿçW>∞≥,d‰^ŒP#ÂPƒB=Lï’0'RäwQHÈ}ΩëPÂ)ŸBe·Qûl—°¨UK∫m%]±lIXUÆ[“Ì(ÈJ+Ådlø´¿Ó÷¬‚dºúòÜ2€\
^17 û*rﬁö*Á˙Ã97îúEı¸⁄»{ŒS7{û!po~*;SO¢g˛Ò3ˇºÎ=œ,öî…˝AÀ•ΩÁá^DìLOø[g§^py›t∏ïﬂ§œ/∏ìNW±å°lu‘>f}øü• Dc\€Îqﬁ_cÀM«D˝Èm?)i8Q"Ô–Ç”—ÛÏ+∫Ÿ˚ÅÍÖÙnnH	π∫ÆW,§&Â§ÿ5è#≤ºå÷\Ôr[Î∂”Ô”2ÊÖê6°J ÑÆuYPZ*ª<-Ã3¶ƒÑ<ΩÓîfUŒ,e	nxEFhµ:Í8¿F8ÍÆÚ√Ô·ít æbŒ®›Ä‘\”∑¿Æπ5¢(ísB»µìP®¯œH·OŒ€’Hë\Â)ReΩW,`πõÄ+Pƒ$œÖg‹SoÅó‡%LF∂∏®®y6‰|·Uæ;vBC
Û”;Nû~÷H§Œöèü8ëN¶ÁÓè˘R‹”[DcÔ¸ÂR¡πj8TA¬Ñ˙#”îF∆ﬂ/wnSPR¶†¥"ß†úÁ™"©Í9√aßﬂˆáxˆ∏KZã∫rQ“Ö"µî¿4m·pIJ†§ Dí™^·&xwÅ«`w>Z$-ÓŸÈköBiD5Te§«'$úápEi¸VµS·xÈMdò≈›_±EVèvBπ5’¬ücÊ≥Ú5áÀiÈ.z†îfuÍp≈o1∆á¢KW⁄#îÍÿ©äónÏ≥‰Â˛ä≥‰q Ñi≤RNaÂ∏í«Ëò]iá¸Õ„fq!´ë ¯ö<bæ·[!i¡—FE%.	Ïp“√s%ŸΩ#·d}#’I(ÿ®LÂG<ä«8“E5RQ†Èë∞lµØyIº|qÀí∫MODÊ|4’‘[Å˛„ãªéÀöjÂWÚî!¥ƒyÓE≈¡ßË˙ÊC'íéB\⁄SÃº∏@ú˙Àk?ãx“á/Ô·ó¯≤øËó(˜'<‘ Èäâmÿ]˚á”ê#'¥O®¡~Ãˇ¡cπŒBÖÆœ^h≈XËÜ°P~
Å„^CÉÀñ¥x>4WG¨›^p∂1RŸÏ¡VkΩ!‚	s©pâ˚•Â∫Y+&ïñE’Jµç›BàYL¡§¥πS≤)mﬁ¥åJ…,Úˆˇ+SåÆ⁄’ÏzöçÀ/êWTwôÑ}%íÒ]∂ÄcB>])vúêIª_‘›-<ÉŒÿNG©€üÆïsŸ≤πuÖ≤ek,ÿÁ‘ZN,JpÈ•0è^ê±E®j‡÷H•ï˘T Õ0“V∫;ßJ…d%<_|ã[À
ut˘!ƒ]U|Áje<D˘™û€ö˜•EE°KP¨ÈﬁØÔK•êﬂ§:·‹œÒÓÁ—ÏÕ ˚ä∂˙µ ¡-mÇı§·.BÁô”	î§J·~⁄ sπŸb´Öxg°£ A˙ákìF=¿è[Á~(*å¡Ñ˜‡º˜;àJ√d@ªE¥Ä	¯ù;X)jë}∑Ö∆πêÈ\=Ôn¿SOÖû^ÍıÿF==-VzZ∏ÙÎÒ«ÄÀ√0Â˜›ÓS9;t'Ë†@lZ[n)O‡{+Pz≤Åy∞x
qûÆP<ß÷“Ìwƒ ¿≠-“
Æù;ÎWiÄ…6Çbõ!∞MP{xÎDP¿hÛºICﬂ∏0æ¥l¬⁄ ˙ F√–Ë0fûäUY÷–ÅT5úV€M ÆÊs
J±ÅÛ˘ÙáxÛ≈¯Ë∞ö-Ω‘„0ÀN&°H:ŸÿÑclB-∂∑'ÑHú‚—¥Ï-√dÜNlFÒLËó:‘)»∆Ôõ‹Ç ∫©ês√ÂY1qS·ÜÀ≥B‹¶¬µ¯á±6ÑOb 4⁄tÿ≥j•Q\Ÿ‘(≤zÃXB¨ë¶‡Q¨W3≤kJñ≠ k0ö
h¶
‰áâL
ÅzªÖ≠õX£ö15*£à1
≤gYå‡t›¢Îá∞i[ ‹’xZ
ë‘ø+π•ﬁèT`í†(sªT4dåˇîOﬂÃÂÑÔ∞pÍ‹F)1óã¶K ª	‹ÿl‡b≥Aâ)?¸ØÒJ‡[≈"|"y¨∂·êÃÌŸß
6!π–”eÆ∏Z`ƒ›VÆÙºÀÜπ5∆C“¿OèØK‘¡ûtô[”‚ªi]-ˇ5;Ö2ÅE∞ø^÷akD€ã‹ëX$Úf÷mo“wT◊¬wËGœÀq.ÂsN¡*Y€ÊV|8‹—BÅπU<›ùT¥J˚BÌ¿zK¨◊»mò¥¡
„ÂsEsÉñ9òÎáB–x‰œJ∑ô7J›±ÌU/‹Êì˙ﬂMúë´÷y„Û˛Û∆£¡7˜∞î_}îaÀ6LªËjéºø(á∆wÖFë®?4ˆ∑
¢w@`¿‰õOh@. FÓ ÀA∑µÔË\ª˘Ö-¨ÑÚlËzCµâº%û“>ÿË˘vÜ€òeX´¬˜ ı›‘8æ 
Zﬁí∞πVΩÕ…Lµ”˜1ø{πƒdƒw”µ);<Óµ∆pPGà7â&ÁÂç˝7@Ú⁄b‰E	RéLt¢ru—nº€Bä”•|A+ÌyÆú_e√KXíêaÚ/rÁù±‰/e¨Iªî@Ñaû€=œëGÆz˙%∫ÃäëÓ\@Âœî†#b∏ÈNœªπ·§ÎπñÖ MÆ,·ØØY*‹\Ûäse`¶ıIDÀK¥óuöåB^>S•√ ˛A¶ÍÁÒzõ¡œrsÖsRØåÏ/*¡‚$¡A@ôÍ>£üx§ôÄ:¨Å'√],¿L√häO¨ÀE#O’6¿√˘œË"Ë∂mº˝ÅáSj”*4i’BRâ®ÁñÍ‚Ì!JÁè¡9÷~>»Í|ß\OªN‚∂XÒΩ5uw€Ü⁄êÒ˜∆,s˜ ÇœƒjÆ”4¿Û”¥|^wöUx*çû¸Ω^∞1ŸWFÕˇÒ—˝◊◊ùh+à ‘v)aT´éªO∑1¸'%ÿ˘ı€i§Í†π≥O®¸WúL˘ÛWL§?ˇá◊ùH9Ó™«≤˜QﬂÁ@§|l7B¨UÅªfàtˆóFñçÓƒı©í~ƒâíøRö¸ÛØ~Û∫ì$H%”à9–"ià-ÚqﬁÎvön∂∞T^ºfπò∞|#í5æ0”\Ê·ÜØàü>–Ÿ≥¬≠Â—Ù3ùXù∏
VÀÎÒÖ µ)iEÏòÙﬁkô•˜Uæ™åtJá	πÊ[Úˆáì±°À∫ˆå‹.!¢™¿ˆ°I–Ü‡Wﬁ§h°“DÌJÅN√t'cOÀÓF¶@ÊPπ2ìãﬁeOÕ·cª]u—¡^Yî$ÅÃXRq∑'ÖZyÎm¡˝Í:¿l]e]ë5í?ÎÊ·t€FÁ¨`—VﬁVú{1Ë]meƒ‡IgÓ∆%Y\≥e∂∑ìœÁm=Q∆˚?ªπ[l8Ç·•£∫AS»IπDZíÊƒ€èÉs<òå)∏*∆.SylX≠ÄX$¡Æs’˜:∏rµ…ÔÏfx≤ç]K:cYWÔåCTŒÿñÄÁv›¶ôúbd¢BhsŸ)E)"=π$k~É˘4i|h»◊¬[%Ít8ôHn9»M7˚z:1M†e	Üƒê˘‡f*›.H˛A0% ˙ó/æx˘‚√ó/˛ﬂ˛ÌÂ«ˇÙÚ≈Á/?˛ÈÀˇ¸Ú≈üÓ,ÛÏ©À_ïó´Sg]ìY◊¶Œ∫.≥ÆOùuCf›ò:Î-ôı÷‘Yãô∑XH |gôØÎ"î±™^›2îØn¥E!ﬂ.Eu) †c±µ¯‚Àó/~ß&ØJÊÆ$à ‘ô∑ÉÃ€SgÆô´s!l.m◊)·`4O≤¶íg%g ú=$◊Â(5ˇÖê≥rP…˜úa6€„éØΩΩwàﬂ´I6O‹À≠+Ãq-'à~¿)(p)L&BÛêß¢±˚"Cƒ!7#ˇ@ì^†ßs∞º{1	ı…—CÌ21EΩ≤Ö≤	¡dg‚Øàì≠ƒHEcWÑ'·óm<î ™¿˚f	ŒJhâ)%c∫l]ÃRÏÿM˘†Xà]+®grÖﬁÅ¨K±+∞à∞´ø⁄çÆ™@\{aª˛èè>˛4¿–¡¿ñ_{∞÷ÊZ£%≈LÛ@08J4µ‰„u·‚ÿåpR˝Ë5Ë>ı‰—∏°…•˛‰“Øu™Á0∑~˘Ø`nˇ—"‹±∞ñôyjg‘"äìm*ﬂ≥(PlÊœFŒPØåS<`´@ΩÄ\2q}À™Ÿ4"Z∑ò›"ŒÆ∆ ûå:±/™ß1¯∏ Ó˙å˛F/•n‚_Iw˙mª~ÉÓëÖÖ‘6 6X< ≥”ø‰~ïj<`ÕÀfW%d…Qé˝˘ˇ˙o9óæã]¯ïÎÆÌˆˆÛı43M&4ñ¡D"„FµÁÑ|¡IÕ≤≈Õ¿®x—TMµ˛æçE•4ØÚ%!_Ÿ°ZFhd$´jöõ˘ã \ç1≈ºBÀêîÚíœˇ¢oV,⁄´›ë÷¶Dﬁ´≠≈ˇÂﬂˇœ/~ñdg$…]Ã>ÕQ¢míœÔ¨dÖ6πú,e–ÚyQ…$Ñ¨%ÿ°‚Ïπ”ıÏ øo2©	™∞\\Söˇ¢<WBª∫é ~˛·î$≥3'„ j>B≈˘j]Xˇ”“óºçéXfæ&.µˆ¶•0N™È¬\Ë¨“j±C˜ô´”Í8∞Ÿ˚AJÊJo nÓyP°®Î`–r∫Ì`Zzãú¢8˘˘tÒP¯¡<Bb[ôù‘ËT´•≠Rå∂f§ñ„Ó$b ∂¥-€Ìl%i‡ä1MO¶˜Ûæ5=p:}M»%∫EM}_ö⁄]Y˝HÁ]¯q—i¡–§º5ıs=ß´CÛ©@q	]èÊÔ4÷ÎÙsœ‡‰ \Œ∂C@äòÓ#˚çr‘í}5|*µû[Å®!Ä•E‘Íê•˙%û∫PKGˆ ë’?›Fõòπ[ﬂ«Äˆ3◊S⁄∞ïÌ#PÕ\⁄WRˆ1ÆfÆ	˘¿jâa¥„'ó¸ZõlV¢”_b<,üüŒV·Ô®›p≤Ö%˙_æP^|ƒ~î+*Ç5'7‘˙˙°,K,[€∆A9¸òÖ§IÖ_à¢ìW~ˆ0¥ºÜ€)Kø§rÇΩü .˝¡ ˇû“˜\˙~ÅwGÔd=Ö≤’ÌåW‘Ò¯ôôê•cëpì 0∫ÛD?Heââ◊MÛÅ∫Nì> ‹´«¥œQS¶.e√ÏØ\Bd$ﬂ∑í¶ü¸q{ó-(ÜÀ!#√çBÅÄ`Rîy˝ÿN∞¯±Ø˛1®ã8ÀóÉk5ÌJ.máp0töù1à’´Å%ï†€¥Â'Øz∆VÃıb,Di¯CBfª=r€®¸î«∏KÀ&låx-DiQØNW›8_F›’Õv M≈R˜õπ[i‹¨ÙR!^:Á˙h3ßlôªo'U§∫Mjﬂ⁄Âå;cB⁄P
Tí@Óíâ/ÅŸ¶—PáKﬁVŸ!ŸÃüÿaªù’›±uW&i·]U§dbu2R3{á≠_GÊ§XäO≈TŒ_Ús8aÖÉòµ=g‹º†ª	~]KÉõG†óºPÊ„bt‡Ú˚¥ı8÷§∞éÃ"pI˚–Z¶à6 `∞ı<’6ÆÛñaåcÒïuy8Ïæí%!œÚ2j´ï(õÚÇZƒYñ‘Ì∏—∏‰—OeY†*“æù‹”ib};óâÇÉ&ˆ∑:é¶(ﬂÍGƒ[Ÿ‰B4·∏ıΩ&àE4/‚/Teÿ †¬t““êi%ﬁÂ<!*w9H ÇS.*ﬁ(Äºêÿ˙)d´úÇ©1_1!˜r9døH»v)?‹Ó	Òå7NŸ∂VÑßïP˚Üß%√&„≥∂ﬁ†?àâi>øY:BÄ^'s˛I€?ˇòvÛ>1˙€z®LËú;âg√õvØd¥ïŸ\MŸCDi}UI©lùüd˜Q1¬—O{W¢xM¨ø”o/ﬁtLV"≥—lƒé”’°Òt»9I«Îí8^C%NKÒYOu™Iá`øA∂ó(\LcW…“n≈`[ÆcŒﬁ∑»‘!ï_.«‘ÕJRAÉ}oV¥™ãC#êˆ®EâI{™Û:YA?Ce|≠•\I;ó–êNShXˆÒ.û¿ÌSÆñŸU-¸Ûj.j7”Ü®%ÒXN)ƒ-h"¡GgUç¬.◊$ã8¸CPó0!uãyã*kÖóÖ(ß)˙èîtÎq{3O7&(Í…ë2c∫πgÒé©P ˝ãä–∞áÑé»≤VRwEÅÎU{TπIè¸‡õvá
∫q_vo“ó¿ã6‚¯ôæ<O©PX^K›ìt%µLÕ?∏Õßﬁ(¶’]ÚO‰Ür<h∑ªp≤≈…»*†ˆíô•›t"™—\Dßæónâ»‹§ˇº»›nª¸÷U0≈iTîÚ√Ì!ØøﬁÃX]}°T1RõÌ!Ü>∑ r[0¥˛"É≈ÖÙ5ßﬂŸ£¢â∏?ª‡ˇ$
q#Àt∫ò‡£v<∑ê~hßì(R
’âäV˛IT∑Úy©IçGKh[7√aÔÁ{˛0Kà±”d7.Uá∂ïÂM‘3˝ºè&∆°∂åÛﬂ6x˙ÅªEeÚä-g¶A·◊B	Á’î„‡´O÷Rﬂ	oïasºàò˛®-ZS*Iza\äî∑EÈVıT~˝vÍAäTâ*Óƒõ"ÿbÓ≥<P3µØUX∆ËKª)8ﬂqŸæ€a›¬ˆ˙Á∂;å-6H6øz”/nÌÕ¬hÅΩVÄﬂS†ÜÃâıBXÒí⁄†<…ƒŸ‰OeEŒfShÃŒW»Ï|›◊ÙZQ4EZNÙ◊Î2wè”⁄¡…›+˚Ú≈øìø‡Ø_æ¯”Àü'Xù≥dT¬Øx(ußéõè£JU?éb´Éa¸áó/>y˘ÒO^æ¯ù1—˙w4§ø˝∆©Ò£C"lÇèw¢ΩØo°]»íÀ˘O–Áï;ûø¯å®¯sÚÖ˝ÔÙÍ#N—˚}˚‰7)¸<ïÎÜOB.Ì$<Ë˜ú—êpñun6Æ”y≤ÑÂd(wVÎ^≤˜;Ó3VOÑ78˜ï•¡C.÷û∏Ìé∆Î≥wi™Wv˚œù⁄˚µ˝£„⁄	€©úV∂+ı˚€ÆTﬂ´Ó∞Í—Nçù÷é˜+ßµ:´}Ô¯Ë‰î›∞=-îŒ≠ÿ"l&T˚–àQ®TÛ¿õﬁ8∑o¶¥ÊVcócç[\jã^/;‡{≤ÿa(,4úäÿæQy⁄@ìPÕ‚«øåØív†∞ãïÿ∫zÜ,dÊfÉ‘:A°≥ùm†)·ÇQÔw ˘ÿc˜'ç;À+∂≈=#ÜVÑÂS™ éﬁ∏=rÎªè
n>¢^Û¬Ì9¬yÑ(·¬¯ﬁcÔ Ì6ÄÿÒÂ¯b–'ìÖ√AÀÕˇ–c.ÔÆ◊uÜ–€,eoB‚AOÂò˙2∆£
ú`ÇQ˘ºE≥yI2ºñÈ≠÷Ç_∑MnURéÓ˛	”ï»s§ƒ=GäÍfÏl˝˜)´ı€·i)_0ˆÀÃÒìN1g˚‘i∞:L≈OÂœöÜë¿èàÖ∫∏=m8#RöºGÊäuZàåqaâuùÜãq›˛„£üˇ£J≤uô†	›dC˛∆„è©ÛJtAC%C¢‰P%ˇÎ?I˙ŒÜnx˘ºªTBoéƒÛîï`Ïs•ä?ˇÔ˙À&+‚ù5D•ßËCÎ¸l,¢xÖáÎˇE‹Bw0øöhÙ/”A˚ø•Êê )ëÏ~C*q(,…‚^:2Vìú(:ÀKa⁄ß]¶t’πzkñVlYÁÄ„]å:˝'πñó˛v¢ë+%i}úh´È:Ö∑<AeÇVƒañÂKÌ`9.Ø$™à6ÉÚ∞sCá–"˚FÏÊØd◊=ŸîVÛJ"Rõr«Ód¬I„„ˇ‘Âúqª;Äiﬂ·mR≥F±AJ·¯í®|d¡$Ò-y—D÷Çç‡¯E3.ÓS®Vâé¨ˇDôÏ,<T)«Á£≥∞I•¡*ßfÖjS¬Ïp:váüG˘ÛNøï”≤\∑±’º¯nãÊ±ûm*ŒæÛ¥”v∆ÉQæŸÌg‘‚±qû≤r¬¨ZRcG;ny_º%	YO;=w0g}~î’ütªãKVz¡R u*<%ˇr< ¨PPÌ©∞™®¡¡z¯Ù]s!ü€åín€éQ"
6:‚¢doT6∫iÅth °‘IÇâ¯ù3iΩÿ™\2FîΩ˛âÁ.ü‚7Ÿü˝I
eÑÂ|îdäù‘h»e¯îV¶S¸M8óM’ÍÒ%1ˆˆ◊dï‡¿|géSå#Ñ.Úp∑xÓ∂Xœyûª»=,oPÔÜ∏tÜ#ﬂÊ_ º¬5«˝úÙ BSﬁ‡U›˜m%zôEÓÏ;ﬂ—ÏfÊ`*NlT\l£òæ8⁄3∞∞»~1C√‘≠Kålf⁄ÄπüìöJõ!¬úØ≥—ãwînˆ˜ﬁØ±√£”ΩjçmUNvÿÒÉÌ˝Ω˙˝⁄ILæπr0óáîëwöºÁ—5üÁ¬o≤Eû∫aÅH Î˜Å±7]Ç+AÄVãVÆB∫≠öºiÇÉŸA¨Õä,]»®/áçB’JÊÓÒ§—Ìxl•√ClsD®)C>mèN´ÈÄ88?Ô4—(Jhd=÷Íå‹&ÍpÅùè0r<SÊm`€(î¥+f¶ÈÙÎìFØ3ˆAÒx’yπ¯#û‡äùrôœå‡wáŒ!u,I¯:W0⁄#EÁO—4ÈŒ2Â6ñM8‹f”Ü€úh‰˛›§ÉJoc
	ë©ﬁ.rû¨ß¶D åîÅN)OÈ≈Ú˘<˛Z‚VYõ,ü	‹%Ä¶‡0TÚ¥%äÅE¿_ E´_§≈ Tfr#¥
LCkÿm◊v~WJ°üé|g ‡*,Ôˆ`tô@ºLB≥⁄LoL§◊uLçüÜ˛d·1‰ä;%öh1=%¶"ΩêÈ¥ÔGÃI¯ò1#ÚJ√∑Ìˆ—¨!s˜ˇíåø+¬i:-∑◊ifÓVƒ∑
qü;ΩÃ›¸MCÏ„ºöﬁœ!<%H≈´!s‘»“ Ü5k\…$N.yyÉO6œ-¸ú±Nk+√e¶‹®⁄BŸr$[YÒ<1ô€“¨7^Œ+Ymºhe≠âVL±Ãƒä	≠§rptÕÁ#:›H´â%Y.Ê—µ°FrFâ¬9t÷6j€#5ﬂ=pFOÿ ì¥˚œp˝ïH02‚®êd™<˙vRo∞8	:IeÃ€∫*[◊góeDàW Õ¯¡«øïg4Ø∏ˆBp7èdˆåÆ˜~∑É÷Ö±ÃVKNÈLb®€¢ÎŒ–%y6Çär<‚GCgÕwwñÒpc:tìeø	¿P∂Cﬁ oŒZ<?ıvÿ∂£È˙+<öŒv lyƒMà∫∞<”Y‘ƒ…LÒôåwªWÚƒ±PAz“ÕU~t·PTX`éÌ∏PñÖ%rªÉ‘ﬂù@ãWóå~ÅƒFx(§§Ö`cC‹>Û%AP˘}ß{ûC7A(•õNü^* π	»0`j`Òñë&†Ä§‘O@®iÄ!ÿ=èBN†Íã<êÎ.=ë®ı£]ó“]ºnm’‚WÖ√0©ti™È¢∂É!B_+	ÃP%h	cµ
	u…`,vS¢®éƒ∏
6¥f}ÈúóØ˙c!î°ZÃ°-h]nàrféBa'¿êAe	á}´L|L`ˆh†–b»WNπ≠Mj†-†]≤¡Rd®Ë˛]ÿÃ¯pi5√∑≈∏J±—·ƒfΩp¶âcpIt¸∞øK…û‹-B˛Øœ◊®±®˘B<¡áØÌ ;ÖmßÓï^∫1d–>÷<‘©óÔ‘>8:yèù‘ÓÌ’OOæüN©|1Ëπœ£'©‘ 7ÿ0§Kπ?≠iñ∂â£LΩ°bM±âﬁ=Ü≠£ékﬁJßSÍû‚ÂÉÙùv§9î}ôÉ3µ\ßÖÚ•«`Kô‡ŸÏ$fêÖ[i}Ï:h˘•¶j¢ë©∂{√f≈@∆¸!‘aÅç⁄¿õ¨zõåœ%€G´4ÏniX§°º"ª~1ÿsE_‡ÕÅóg˚É°≥`⁄l’⁄+›∂€9Ït‘i˙0ÇÿÄ„— ˆ˘û´#R·ñÆ˛QûΩÁå:ΩT®ı€$Ÿ‚¡≈È≤öÁ9óå¥Ê¥„«öP,D«†hêúúŒ%É¶b◊øË%Ì˙3Ó˘ˇ -πÁÖxL˙m˙	÷√1œ€ûO«ÁÃ›´ã^^LG"|ÜıŒŸ∂Å  *r±6.a#Öö≈î%‘<ï~åÔi	H.±ûÑ∑_KÃˆ∏ãä≥]sﬁÉ-º”ßC.WXÑA&a®s{E≈§˚ùâÀ«\/3∏Òïn´Ω…é∫˝`ˇ=V?®≥Ìì£ NµR?e˜*ßµ*)∑VÿWtYk;ÁÆ}ÉÆ`∑'›'4‰x‹'–√SwÑ'¿Ó‹nb´Éﬁp XÊt›Ï‘„Ü;tˆn¯WµÍµl{‚åZX ΩA£ÉAnpSüœ•lΩÁ˘◊√sπç}o√NIÁ2X≥3Ï‡9‡P›péwc∞⁄x¥M[Q=t:Ãz(˚4±ìˇ≥ﬁs˘8Ô	“˜X∂∏TZŸ‡¥ø8√ï’©êw}Ÿ|◊iN∫"≤±:{©B4ı√Õ≤c≤§¬ÊÆnZ¨äV)x#}¡sΩ{{%kÛÏ«œ@Í=pº'Ï>π%/L~SßöVàq´WÅWvˆ3¿A=‘ÿµã$Æ»/∆Ñ›:	⁄øy,6ã3Üû˚
Æâ\8r¥QóﬁÇÖp‡<gH∂Õ£≠¡bYL{cîpa¥bfbÚæ»ò ˛4è¶]∫'ö.Óv¨m◊">‡’¢◊”]4’˝|3ÖH~Øê¶ªA2‹≈GOtiE√±ùáêp~Ø~¿÷sçŒ8àxÍ”%s˚Õ⁄»¶:7‹UÊ\˙/K:˜nz∞ﬁ©J_µI˛E$+ÿ§ÄyE¸àoF0®Ø˛˙ŒoÔ¶ƒ˚_çzLÈ)ŒËÎ6?Ÿ∏}ú˘TÊ˙¢+^ÕSÄıOz€¿‚Q
ıÜÅö˜M!ùÿ¸ l˙ﬂ@lüˆíp>áßà3wtΩb∞4.7á˙â)bµq{–£aº˜ªÈëLJ	Ç™|DÁv.;AÔàqßá2.àKÉ^o“Ô4˘’_p$√w\GàQFÌÁØ4„®˙äë_LD»Ër‚êô YLJ∫·ºÖN‘˙9áï#ù	ä‹ô¿˜D∏¥ë“å¶Ä2w¢˛1WXœ÷X°¥Y\ﬂ,›zƒˆvˆkõ˛¥¡
ËãHÆá˜®tõî7ﬁ!%-}çb√oÎT~Ú`–øçõtëÚÚÆîãèÿqÌpgÔﬁ&√”{—üÓM0‡OP”Nëõ˘≥Ÿù xp!˚ÌXº
ZQPwÈ;=©÷ˆNO©uﬁZﬁ§Æ¥‚≤ÙÈŸÎ4πµD”OöMÿEÁ8¸⁄n„ê”ÿÚ›CË¬eáœQ!”˘ëçzïE7µ–@◊O+ßÍ4ƒc9œ‡÷nóˆ:Ü“."ƒ¬µîCÅ„Ú·¡ÕˆÚÕyMFzví»‰¥ï"%è#e¥…NÅ√ç‡πƒxÂÍ›Q∏3Ô‚´πM¨ü>ÿ©û≤JµzÙ‡I?•Œì#∆ú9Õ&¬ö8≈7˚bQÇ’Wx'=‘jπùßdõ≤Ô∂⁄x|ûÀ#⁄ﬁ‡=·‡ú¡!Édp‰=û0Fi8]˜·7çÁÆÀZEùnó3˙›+∆¥“Ωñ¢ï.ìNQ7“⁄…U:cÁ,ıˆ"ºõ∂BÌEÑGıö$2ù‚Ç√U˘0π-ñ=ΩËx§h∂BgÈ´-—10F#õpK^r	éóˇø¨¥RZVkÆ»¨<é´åd¶Ö,õ”xF@°c£y§Ê“˛ôœ8Ú™u£»ynå^^YªÆkª«öfh•ÅJxd•e <ñ ≤å+àÖ∞û}À≥mæÿÁ3≤T∑n`ãK+3PÁM∂ö£›]tâTvöj•~üÌ◊vÓ•ıå$ü:˜k›tt◊+s›té®è¨Í†á"m2l{0x2ßù¶2iuÑ∞ÁCv·æÜÄQ¬x≈i·¿vÉñs8h.¬¡4Hq£˝&M,›‚Ë û{=û“3-Vk|ªh]›˘;¿<mÿ∑ht?:¿Ôıüp∂ì¬œj3ßç]´Õ|z9LàÔ™ÕÜQ>¶Œ∆TKâJ◊Æ≠3ú±58ar`¬p‘„¯Ìö&KY0"¥›ÿn¡ÀÇ`„Á∆‡_‚døºjÛïbLÒrTW°ª$π+™Në÷Ô◊&√BÑ¥ø7cYñÙô®u™åHî`!™¡ˇF¡)‚ˆÃ–C7Ëπ≠Œ§«kv03ñKÎ&,pRLQÿ∆±pßó˜›ÜnFq2B{aΩo"ú‘Á≥Œæ√*áï˝ÔüÓUÎl$é°êJ>πh∞∆9·/úæõj¨È uµ∑Æo|8<Bî$ÖÎm]Ö~jR4U?¯ü.ç;Æ…ÇÒîN´Eõˆ˛ öß¸à¶\N·˙˜ÎßµV=:‹›ª˜‡§r∫wt√}`ˇt/wZŸfıiøÍ)u Óe∞t∆O∂C;∂ÌZú√I∑ﬂá: Â£Jé2DÍ§ëöK•◊üáºóÍ¿kFå◊€^¬Òe4é°…€åvlfòV;=ƒˆ¿7+?„VÖ‚E1~B1†k
#C£+áö’Ã†ÍÇò(E°>¨s4YF´ï”b£O
Cƒ*GpléX˛—Àè˙Ú≈˝˛©Ñ–˛{¯…$N¸g§]¨_z–Ê∑·˛§aºÌK∏√úV‰Á √%ÈOMÊa“ı¯CDjÒ{Í€/9l8ıˆﬂ‡9ÙÛÁå¿‹?ı|Ç)?˛à›aê~+!«ˇôÜ¢:Ëüw⁄"¯0á#≤zÒÿ±”wªñA1›YO(A<J(œÌu§5i¡ÍÀ∂JCÙŒÍÈø“˝G G	’?•˛Cä_qà{¯ªƒ(Õ?‚ê~¸è¯Î3%˜'|òÒ1œ¯)%˝\PQº˚’¸˜rÃ1ÌóT€o≈»ø¯249TŸOx≈<˚/xu—˜±µ¬_"gQˇÚßH®‘HF‰Ò9ï˙…Àﬂ˝÷:ThŒNõ£ÿÔX∑§Œ¯râ5F\ÒÇ¶Ô¿Ÿ@ÓDd	“‰-¿≈Xì°Äˆ‹Êd¿±±€iv\è5\8˙Â-tdPÂO··=-îµQ{sC€l¡A…B∞®»≤œuq¨íΩ‡å>oQY∂d-z”ÊÉ´Z!ﬂÆ‰∂^ü4`´œè¥5War≥ã◊¨R=›{ø6oLÇ‡2<÷_˝i†∏…ÿ∑œ∫uB§K>öd<≥
1‘éWzÖ·œ–π‘N9 åúûNÀ§€H~M,Êe˘#ì[Èáú1i∂RæÅÜga·⁄≤>• J◊TC«/ˇüœ”ø†ßãŒº¯g=õ1È/‘mÛ3åªﬁ>ì˛∑<IÑ≥¬0<R@T¡>Ök4:#Ë)ö¯qúu.—JÔayÀCÉ6˜ãòö#:ìè¶K(¿sv‹sg“gçÄ£à˜@ w~’z‡µ≥—â»$Süâﬂ”¸¸ó∏¸-ÏÔi`y»ìˇ¡ßÑÀe˛D˛w¯˚fF6#0x‰– UÀ<Á©€
_gå]RNOŸuD’7kÎÀœõ”A∫Flaaqâ≠òa]ØCj!˚M∑Ó_ãÄfáó¯˙¶Ïˆ<6ãBùelƒV/∑+Ñ‰Ø‚œÑp™ä^¯˝7L2™?®¸g{D¡†N\L	ñÕ,
QJL9¸HìWjâdÑy˛[îTk*Kã∂î?‡
~^ãYÎ®⁄–á‹ﬁøJ ¬6·¡ä—Ú'Ö≥}©ÏˇÉËU‚~»= a0^íÂ˚∂Ë’êlP˛∑$õˆÂÎÕªˇA™∏^Ö$G"ˆOiﬂÚˇ)óò˛@«‰œ‰£?“Zû˜›ÓGûê„›Î≤¯ï3o”´YjﬂÆà–ÎØÉÑÈ/I†t¨`¯ÉÎÅ∑¸.îˇ[pz©
($Ç¥+≠÷ç9_+íçzï4-™¯ñ®”æLBáÉÅÔ±P‚1t^ùè	©•)ª>B}bÑ∆§rwÍpxk¥ù“¢€Osÿå+ˇ9tRÁß¨Wû(ùÖq lQpLû+∆©÷≈jWtZõå/8v√ÚH2ΩF´IœÜ"„W´—äË± Ê®µ˙T*¬Nó_JA˚7F’øÁè≤Mc•˜ÊÁ∫ôﬂÓœ?ıa˝ ç£ØMhgq}ô9S’d2©ëLƒ,*}Ö°|5¢≥ZG$∑µ™˘∏4ßÿª?••˝9È˛ëY(ÇoŒ0	Í¨O„ˇ,óñÙÅæjr$«Ä
t˚e5ú(Ê“¿∏æ¬}o6óÈØp?°k±üÉÇ}
›gÛõ¬æ˚Ã>}áAÇoßÓSÁ_É˛˝˛ïØÒçÏŒtwÆ≥‹‰Ö&,‘p¢oÿlßá˛•∆)m¶ﬂ‹„Ù$.eR˙ ‰ºXU1O⁄˚œps…s¶∏∫u¯Uh(+QÂfs¨ÍL#ärCº≥¶cCy…T;c]˚®=\hwGπ›]Ç6∫ #Ãî¸[ ⁄Ïí©%ié`X8h‡wèlÇŒ§£€y«Ì∂(ESøÂ;˝fRxŸ0,ö7ø
Ò€∆·gº´É9√˝ÑŸqYxDƒç˘Ù¬çô ≈ ˆHv·ô- ∑ı/˘zÉ÷§Î≤é«p$F¨Â>uªÉ!¢eõ=S-«/´MA)LÚ˛_˛;u»=Ø.¸™ß]Cûˇ[ùµìÍ3…Ÿqƒ)Õ?I+'4‚ì˘Úœ˝Úªz‚Ò	3ˆ Ì‘÷˛éZãZA~Ù•4„B}·ØÂÊø2R#˛ì4µ;7i¯Xcù ∂Bå)CÙjê≈æ)Ï—˛ áÒ◊Z≥iÛÁ2‡≠˙LN~#Xsﬁ{¶∆àG_†ﬁ6}ÑuÓëôâ√“:£1≠Ão§=ÉçÏÙƒõJ	eµmêƒ πk¸N»SX)Lg⁄ ã qu®©·k1q∏πfd:˜Âí≈}Y_ﬁ+ºc0≠‡,±âﬂäï˘‚Kˆˆ"-KîX∆«ÒXÕ˜ˆ†?Aß€ôÓ5aÛ®uØÊ
!ZÀ&⁄QyÓ^=ó˝%ﬂ'|•⁄Ø|+gΩ≈˝GíÖ~J¥|Ol*¬“Ω”¥¿ΩŸ˛ˇ   ˇˇ @—ã¬xúÏ}ks«µ‡˜¸ä6íò‡|»2,“·íxCQäH9õïUÚ0Ã@$√∞*Ò›ƒ7Â∫õ^%ªπÆUyc”*G±U˙‡»U)ÎØ®Úv¬ûs∫{¶Á=Äis*ëâyÙ„ÙÈ”Á}¶ß¶ÿ∂’Ï;ı≠ù n€puf[˝nKoUˆLÒƒÍª¶—’+]´´Àó-ª•€ï€ﬂüöûª0;{ß¥=ñr]≤zÆauŸ}ÕÏÎÛ•ñaÎM˜Óé≠µtß¥∞¶ªÆn≥+Ùìï4¡'ÿ“[û`ó«/MÚèãı†;M€†[•Ö˘„æŒ ◊˚Æ„j›ñ—›ô`W,´5¡64◊p∂µ¶kŸ˚π∫ª4ÈË&Ã ˘ùKì-„~“„Ùá[}◊Öâ∏˚=òá”ﬂÍnâ5MÕq÷µ‹⁄≠l˜Mìıˆ+3÷Ã[÷∂ÓÎvùﬂ™ÕÃMkwò´ÔπbU∑≠Æ[Ÿ2µÊ=uÅù∂÷≤v+Ná5˚∂cŸïûetq1:neöﬁ‘ÈÜkk]«@»T4Ë~€‘˜¥€q‰øË;Æ±Ω/ÓhΩ t
Z\⁄–`9îyµ+≥l∑2[bìÏ¿‘∫;l~~ûçmu«ÿõlÏ≈—Á/>˚èGO^}Û‚Ë˝G_–Û9{qÙ‡≈—£GÖ/é˛$|/}˜·Ò≥GÔ—ª®çøø8˙ˇﬁ˙º2∆Ílå∆s√6:öΩœñ≠Ó∂±”∑5úÿa‚BÚ≈äüÂ•…mÀÓƒ=K@ÄÒ√ÔEÓL˛€ËoU\mãÕ‘ŸMΩgŸ.[÷Ï˚ÁØˇkÏi£K£dˇ2ÁÅ{P›Å66°	©Mç‹’·€1ˆÍ´¨7D°∫:u‡;_¸ß[xøRõõÚpjê™Wπ kzœ·XdÍ€.szZSØÏ√c≠pvı 6l˘ä—M¿ìKi˚§=´éè–:≤µ-ÀlÒ>ipØÅ„#ÿ)-ƒ·’¬¿Æ ?r‰¯F˛˛ò@çÔ‡ç_+hÙ!b⁄ÅlÂG_sÂè˛Éﬁ${:NXñ∂ÄÂ´∆Nõm aÅ_„cáó&€≥â”Ô©≥ß	JP”¥gâÆ„ñpƒOúÔ†œhå_“OÄ√ˆáˇﬂø8˙3=˘3KyÛ+zG´xÒÒ@˛ìÿ“¿èUx¡ÔßåˆÙÛü=ƒ?¡'í¸Â≈ßü=´ªÃmÎLkuå&£#ÖÈx
pòñŸ∆‡[˛Ï∂4§ÒN QÜ¬¶€Ü{¡©"»{Iõ9/·6gVwÉhı¸AYgÛ@√VNØˆl˝>…}[Îõny¸çÑ7aÔ.∂ ;6˙Õ¶Ó8◊úùrxKâËV|5Ç(/˚!Ω‰ÛôwÎo{Öu¡ˇ	ˇæRÇ≈(ˆ:{	†å÷DdóÑà9@g[Øîg≠µZã˝ñ·ÆY;ÂÕü55÷±¯—B≠+;GÌhßo¥t‰Wújr'0öM££gS.”j≈¿zll|Ç¡>öJhÂP›Çí∂Õ2πΩÌßlÀ◊¶¶œƒ0…›±ò¸SiZ¶S©±N´Óˇú¶ˆB⁄	jOé∞ñ ¨]2µ-›åIT
ííœÈ¡3Êü◊Ñ¢¨¸√q±ÅÂrﬁÄ˛ÿ5ÕæÁ–Cÿâ4ê‘°›^ﬂe©|!g£∫˝Œñnó“_Â¨„Å”l[ñπ!–µähÜc£°¶∑`uó€ ›£ÄUÅÊ ∏˜ÒI˘ÄU´D	&X†ã:Îi∂£Øv›≤^u5{Gw´4≤qv8>ûƒâ+ÜK‹´ÃTÁêYúÜˇ¿!NÎÁuÃ1>="Q Fì≤Ã'äÕT˝"ùé"¸à~?ıËËáí4>Ù–|πﬂÈõ	 õx‹¸LZÈ¿t.oúí.$âë∞tπ¥@3Ø±ÚÙ‹«Ÿè8 ¶É?gXynÍáÉâ|x¶ñÔˆ5ìµé}`Œâ≠öô©Œ¸êÈZ≥}.›ù^È.é∑ô\ß≤Ÿíü±n∂.y~∂P∂:∆/
tÇÈ∫€T??ÌB¢Ÿã£?º8z(√óÁÑX>„ÀπÁáíS!¬.qMÚ*—E:v)Ì+EF˙ãÿ!æ„Õ'ÅÈL®b’oh_=ÁSˆ'ˇòÓ˝ç¶˘ßxFˇs)$<ñ·'Ñ˛Êí2ÿb´≈@å“L§û &ÂÄ¿ûû3Hc ñ4€z´oÍp%≤óÄ8åXÄtFe∞"«0NÕ˛ä|ÑXô«Ó˛é„c¡Pà ‚#Ç- %Ï_Po™ ,÷ÔÅåíü7˚≈ƒ1Øbm„:9Q…+óú42©,ﬂ9◊˘LnÎ'\Î¿!xÃ7[ìò»πìÉuèûv»,Ò yÁ([ÄM’ÄÒÚY"ó€8°yoÀ⁄+Ij∞å7 ª¢Ã_1E– ^‚öew·8‰IeÍ≤ôÏ≥0ﬂm¯π¡øû‘n¯É$öúÚ˘Ö–·&∑Ö8vÆ–qsæ1ÿΩ´€ö˘ÿMCÔ6ıÔ¿Ló≠NG∑õ˙‰¢Ì:/â d	∞p¯¬π[¬–Ö≥˜;'«ÜEé√¨`¨V="∆˙íÎÜ«ÃŸ?ùñ…π:€‘∞´kh&¸›Èô¿"Êó`]ˇÎªÆ¯˙\Äımﬁ_qd°Òsœ∆ 
‘«¢ï8,˘áO9Æ2≈≠œ	Øtl´jS˙˚Sdè<˘ïˇEäSﬂîò:uÔ”ßr?qoÄØ=c‚áﬁ√ﬂë9Û°4(ä1|&?Ò¨â∑HÆaM›a4ÒÔ-≠«ËÎhˆé—±µ≠kàbéªoÍ$√ÓnWG°ÀÿÈjnﬂ÷ôk∏ÊYd≥.	≈2j€è§h˚(À\®"§‹Úp,"Ÿ∂—’L„óEÌÑ:¸‘qÉ≈¥åp’àúõO êí±uøíªÒ⁄ô“‹Z¢l¿M‹LìWa◊¡ çÿ*à3»&® òŸÒ£˝‘Y–(xn<!TÊ∫ª«Ñ•ﬁy&\^éHY˜k¬]È@∂·Ñ¡E0WEN!&º≈M\–x∑iÙÄ¨M2DàéÊ† rZ÷x–Ö<∑ò±$çƒÉ8ÃÙ‰∑í≈ÛàßCƒ∏1Æi]m¿:êÑ—·ü9¯Ω˜%Ì˚∞E∞’ÂAŒ›}à$J3” ›Gäƒìà"ñ‘!,éƒ‡ÒõXêF>æ ºG2”dÃs"yÓ[à<3ÄêLﬁ2Ù]∂C=dpU	•gÇ[˙Ïê8¢Ôë'úµè»Õ∂fkM$@ G'·}≥¶¶Tzä$x€ÑΩ–6Z-Ω+ô‡df∂∫©«êwâﬁÄ€5µû£ßëT•µ‘◊µC˚<xNV∂"{=ı“µÄn[Ì®Wô)-¨:0p´+ó&›vÒØ7‹> ‘exk∞»X8˘s]≥08Œ ﬂr ⁄ËUZX$˝VV3‹Nc/2ñ˙íªeµˆ’a *@~˜ô¯√√ﬁÄTñsÅCx‰qû†ÄNìs…Úùl°u¥“b!˛tπqs∏∂È@ﬂk0ıTèk÷ŒyDcÀmk∑’Ó€˚Éµ¬ÕÕØ≥2f|∞6.°¶8B„o◊¶z{wêç%Úgbıö4ZπÂo\® -íOTrDtƒg˚ƒl]öƒ,2˙ ß~ÎÛ± 
öFÛHÇ$j&êÂ2qˆ»≤0î}A˛CUœ‘ÅÿWK„ÖÇIÕ„Íqé∆yΩè3tZa∆VwiÅÜ¡n¨\NgÓº9e¿,}”æÃm3=‡∂1¥ªj9éftœ∑Ã˘ñ9È-OÒK§â}*»◊(êΩVgÀ6¨ŒøZ[˘•∞&|q˜÷÷∑ZÙ∫˝˝ZcfÒ‚‚){1ÓP\!ùŒ¬bﬂµ:ƒ«¸6ÑOúç±cû™œA&xc1P^íTU05éﬁ18cÛñn€˚L„„2ölˆ:yÌu-!2†Ú›æﬁóû{<†÷ÛÁ≥ùÍ(‰	OYû[é˛Ÿ⁄-Uùï®ßŸ“›]=áàíé—5PMSZX—`iéŒV4√‹gKuÊZñºR–äm‹◊·ö∏ﬁQ·µWµ“¬Õ~◊a:P=`z5XoóMM◊·Ω≈kH<{Ü"$–˚çüÆ1«EŸ“÷w‘0íKaﬂ÷Õ˝‰e¶¡d®k#äWhíGE]R/FW'Dz≈FB5d:Cû€‡ªd§´—π£FƒÄ≠—E™€:Ä“Å¢¸√)§˛wÏä’<ÎÈ°P)z‹Ë‹≠‘j¨§U=I±ãJåÊ8¿W‡K¸M1õ∫∂k\'Õ*—™=ˇ≈–;báÛ£Åﬂj∂ŒTnèç›∑¥-«2˚ﬁÆ’´‹ûF&âˇ∆≥!p√;lù–¨f`VÍ]Ò#0!~´]ôÌzÖî≈Å	©:Îz™°êﬂﬁô¶õãﬁAı3]øΩË¬ ∑¥nSg◊6Dê¸ÒŒMêñI=gëzﬁ Íπ	Ì“Iı¿têî˜4¿Â0kõ6¢¬∆·äõî3s5_)ÕÔ¿§3Áƒ‰[FLF-G\¨≥5k«ËˇÉæ6¨|mqs˘jcÉ›⁄h‹dÀ7çıç´◊7Ÿç∆ÕÀçÂÕµüèÁó7Ll˘.˜‚…-såV\ò)f©AA& .$.a j‹ò“AS&ƒü</ú«ãåÙØÚÓ>ñfáO•Q_ODåˆÃËdA_ß(C≠t Ú S›15êC,XU«4hÎÄ4≤mYD‡lt ¢Zå·ZîV‡Ñ™&N)]râ}ÜLI<ju∆π8∂äd›p˜Ω √X4•ÜèU»Õ-<≈€8ê‚n°ö)ôv‰¥>^î8çBNÍì¡≤åV;Rê¯©t&ÛRé‡¶?·	Å"2s
!L¶ã∞T«Ü4à∞úˆU∫ãL∫ìÃéS,>√U
‰ÒGxuçÁp~…'≥p›Jrﬁ‚?q‹Èí”¿õﬂAqo≠≥‡Øï% ¶sÆ«èíp.Z…(˘î‹ˇˇÊƒ ∏@°HXHπåoßîñÌ‚?û¡#¢yOX‡†∞¢*ˇô)À!)s¿å≠[x~ZYÀZozI"∂S/%≤
r=æVÔÿh“¡øPÅ¯œˇﬁìwUÏ∆ﬂV‚kè⁄‚8Ù™bﬂˆ,ø‹>xÄü!–‰Aˇ…n0ó«ót
\ÂÓM€2M4∆¨É ‹‘y4Úƒ˜Œ@ #˝PÀ‡≠g3Áéƒ1ÄX≠e—€⁄uÊf≤(n¸1¡˝˘téÈ†Pª8≥GÖ∞∑Á›Ô0ì{)WP±ß∑J«väÍOöã•üÆ≥M´«n/Ÿ<[ËôÊÊ˘qVŸ©«√âÚ˚q‡ç!è#ns< 5yo0¶>ÔëûúfÉOÙ„Ú,f∫Ìµç¶î›W; ∫õzZó'ßÛ+∆åÁ4°$Q∏~FöQéáÿ˙ƒí2ò-%ÉÃù´@_û
4S	:Tÿ¬w[;@nN@·$ë¶{á÷ñ-[¶e'{œ;ZÊy¿üø˜øóKÁ)ˇnî2\:¡ßvrEè,‚L3ib:ˇπ¥C ¢LC≤†¢óAxP'”NÁ0(Üí(dÅ)Éä]õ\˙£o”“êƒår¡âJû¶ÿf¿Â^d˝^O∑õ»"øËIY\PS–3sli`˚oè}ø÷∏0≥236¡∆æﬂ∏<˝YkLø>≥ƒˇúZz˝bmÏNµ£ı Â&-cú))2@·¬ò„U∆ÓÈ˚ÛÕ7yq<ÊÕÁ¿dºB~î°a3Ê·E1ÚÛ‰N∆©øﬂHŒY˙k{2Eªˇ†uà”˝AÍ¶%„`√Éƒ˜ú?B∆ij¶<ÿﬁà«ƒopS˛ÿ·;π∆ûâªåe2ánmX}”Iô›”p⁄ß‘–Ëª1†—=≥:û3m‡Ë«m«ß˚ñé˚ñŒ±oÄ«ßK®ZlµlL5s*i©∆wlÑ‘kˇèc_8v§;ÖT‡ƒ±ëOØ˝súã}!ÏTÏfP∆‹ÚP@∏…^[U™I îÂ_˘2aÂp°ãOÂó#ásL6,ÓÃ«ï‘lK⁄D@‰ »Ú%]sfˇJØ¶c™Ω∂tW3Ã¥™9ù(ÀøÿK£L˜≤ÁÑ≈«|È\BI`“15Só1P…ÑHév¬¡/^|˘u°‰/“îüUAå6G¥„Ò⁄ps?»r@~ΩŒ6ˆXk&s*\6t≥U†¸}}W8ˆﬂ›∆Øø’éy´/RöºœãÈxø#)‚#Ør7<‰ySx’èßâÂ»8Ê∆-úè¬«úYÊo ∆{Œá¸Ñœ2\i")˚L\Œû˚˝OãF∏C€L&$Û
oÒ¶¯Ó Ûe?Ê–<¢T6_)∫æ·≠*.‚¨˙Ñøü)3∂ ƒ2 …A[Vs‡€Å—6pò≠ø€7lÚLw§Wvkø´a∂nN«¡ÿRLuFSf∆£y{üH4¯Ä‡ˇ	“/B[ JØüÛD_ãÔÇl√Ükdíçñ=5Æ≥ßÒBÇ¶—˙ƒ≠ËÈ •…µ∏iÜ“É€có5@A˚Ì1ákÜ&ô,íÚâ«ÿ…dîlÏöyõÔùÿ∑ï∂WWbõ˛H|õü∂π‚æé…o˝îRÿ‹ïæf∑≠Àn¥ë≈«ˆ~KTÁπœ`ärô‹√±Î±Ã¿˙õX2-´≈”‚”˜f}Œ•/ç¥ ÃhÌeX9Ë$#õº{òn_{ı8˜ñ;˛0€g·Ä~ò√è&1ıaYyD9‚≤K…ˇñ·[fZ>¸ûßaæÑXÏ†∂≥á9Á~ì”¶÷∞ìÜuMVúÁ≤LeRNKô<œQô$⁄p∂-Ôxd7±’i…lYõ™ã@∑¢ÇØ˜vVé!»5=à|d¬K∏bWñtíñ≈Qî •H* HdîºŸ/≤å‘o·û{»πq[iÌ.-| e
&“}*)¸?íªıKO†¯»À§S-¨_ÚhùXπcÖÁäw˙ΩûI‹®fJ’µXSÎQ˙Â~◊x∑Ø≥éÓj∞˘5÷Í€®Yìå≠’›≤ê…ÍÓ§IY ä,≠f>}fM&pÍéKÛÿ<ÎŸVßÁ∆…&èàù¸çW∫/‹·®=&Ö“?Ú&Í$q4Ñ_1a3ó;pıt≠°±Õ ¯⁄xÜ~6M/ü¡RH≠}ñ*ëFŒ∑_ù›_U’€Ï ÿﬂ:{ÁrÂ+@‹™]k∑<~¯ŒMuÇñìíŸÓπ¿cy>ÿ÷LGgáwRáp8û
©dµ[äñ4∆—´üˇÕg)í≥øyÃÜz3!ÃLûÊN€@Ãa${Z.ùi
Mºaˆù sÅVï]¸7ë¡lÑ ÷{5,’#x`÷ 9∫$…@ó9I5§†®"™Âñ“ËÌ™—
Ê∆√D0Èå@ëÏ/~0„‹‘‰lzˆ∆—DVF1íÛ∆‡Œ!&fƒxÑÚ,”«r\≈sz#@˙ëk‚}Iaê≈À<±-GIµ 7^√*‹ÆÖô^©€4Ì~∂·/èØ†]n üõˆá©ÑÚW∑,c[ﬁ∆~∑aØêÙ)7Nrºø2({¶ù+∞-ë~{ÑX,iàÛ„è˝5WÒËq2›%œt'Õ\ï±16mÕiO'Hx©òïe5H≤µE®V´3/9üHÀó[(kâÔÚ,äß_.;vCê/8q+à—x¥ëãl˘œ§)‰9Ö~<QBÌÈIU·Uzï›‘õ∏-ˆè›¯óóƒW—ãÇÔI©Í/Ù∆ˇ¢øˇƒ<gÄ0)c>∆I∂ºÒ÷∏'ÑR@åHe±o‰y??‡√àJN^$†	bÉ≠∑u ®ÍÁÓí6¿œnqjAI>¨Óò÷5-≠èÅZäJ“‚˘àä	§GHÕdhh_ñÜª}√µA
+·üDç'·X›7∞Ú–á˘æª]π8Qb?bz∑iµÙ[7W1S±’ß¸Ø◊◊´éã")pSÂ «ó~úà˛Õ≈.|d7@ÜA¥¨fE·j”÷a˜7∏`\”∆R€R[©¢ù∆Ö!¨Ùr©mÎ€•	9œA[ë¯-Ω√'y7D'ÔD≠*Çù¸Ω5q’í-yx≈òüJ˘¿uioE	ç¸“Òä+F'õÅ˝;IÌc∂‹é∆‰ƒE˛6£Ú¥…)=ÚºêíÖg°îÏµH÷pœV#ﬁÖxÜe¸7tﬂöT±QU_ BzÎ‡`xx	µlt[∆éÖUzΩXf‹3L∆	!ÇˆB¨Ù;Ω,1`∞@Û’n”Ï∑táaB-[!Óò–◊2Ö‹SClyŒ˜xÎ;úoOr¥Xç?–„NÒ|I¸π˚L÷;˙\™:≈ª˜]F≥é‘9Ú7p†KäÌ√SŸ0—ﬂmyÁn¶∑_Úøı¥ŒÈÒ;O%?ÁD√ø.]ÜUŸ ÜIk9m]wiá‘öÒêÀ	´x<‰£±◊‘MS8~0˙≈h“Œ∑ár¸’´T´d!z LOπ◊ÕsYÓÎ±W[Ô£§†uA,ûPÎüHw·Áí	'íCõM@yó¡Æﬂ)-{⁄~'∞cCÃ…¸»e]ó=!(¬éú”ˇ∫¥ç:âT@Îl¡éè\6∫îV8cSJOåÓ}Ûy‡¥&˜-”≥ÚÇ¯ß#÷◊L◊Ÿ-÷ó{—√ø˘’5}¯Ó.Oˇûkkê"˛^%qam˝ÒêSµ@êD¶	úñh+I`éWo≠éﬂO7∆Eì;ª~Ìù'ü¸=^ÂœTı¿Âœ~G>Á ˘≠r"|¨Tá|&î[+ﬁ{‚ˆ«§¯⁄˚‘’3©©π©kf≈˘èa—L◊"€5ÊíGí>ÈÍàîò÷âºhœ·pÁM sÁÖ˝7^b°G¬˚’ÉUYîº¡$ªiôVzD*¥.i +≤Ñ˘ıÅäE™~Â´y^—è¡¨MÕT/ŒUkµŸÍ‹Ï`5„Æµ™lµß8ñØÉ˝Y&¶p¿tõVK€ü`SÎ3”Ï∆µ¡Î¿)≈˘⁄∂E˛’kF∑ø7teπéÁudxR™‚aêÄa7WÖ<@i.¿Á¨ãwj "é
π6≈9t”≤:¨˚{{{HÃö≠◊ÊFÑY⁄∂fÄY≠y}„ªåYß©z`m¶ŒxL6ª†‹EõS~øW˙nO|xŒ¥á∏NQyŒôÚVˆs·(Y_©(˝ò%≈îr÷‡jΩ¶›+ƒÆñó Y˘ˇCÏ¯OlÒ*∂ÊÖ∫%)"·ÿÌ®5ıÖZ±}´œKê† ]3©fû≠ªË{≈–ÓáN©˜tΩ«_Aré∂≠è(ÏñßeÍ|0rëÆ^mØ≤ãÂL3„®2ÛMË∂mŸ◊úÚHäÆ5@AÒ@‚K,?°…&Èë¥†i+°}ü ˚}ù⁄Ub∆&”Í¶I)i3Ë‘IˆîÄôà|¬m‹∆¨cÅmóï¥Tâ≠9p⁄÷Óu≥Â—ÿ7ôH∏Qg%I?Ká2øFì˜Ê£O\‚åÂ‡KÂ`jåÒCœ!ˆ¥§¿H”ø"rd6ΩòDyA0ñ_	¡5XpÿÀìK<2VØÚz≤˜›ªêöﬂ˜Ft-/5ˆıÎ€€I°6uz!·i≤*7ÀK´P‚€„ﬂVﬂﬁÙ›¥ÆÔµì‡˚ú;©Îøøãî¶æ3;HùÛ+!xûÿ
Æ·˘ ΩÉº ûE‡œ^hz(‰n£»Å5v≥âvÚ]¡∑éÆ‡Kﬂôçû˜+1=±]◊”∏	ÜÍ˙CæπS‹{M
oß4XwÕÇ°À;4Ä¥§ êû»'⁄Gä;+âÀäWÃî®HÄÁzâB∆ƒäµLf‚^]Aát≈ÌâÍJ›Óm«Æõ˘ö=òªä„“€ﬂoÂÊy"Ωøü®!∏kÍoû%‹7E⁄À¬‹˚¸H4œOÁøÀ
[¬ÙJ–{‡ÂÔâS†EØ!ÀçYO∑Enáô˙}†ãn)  öµ·†ºo›”}ÁÌœméÚçóhs$%<—2w–ÙË`Ä50CÉ[ÛŸ˙2MÜã§—Qäü[ì<•RÉ›mj∂~∑cµts0[ÃFà #;·`ú∞©‰˙n≠”π%fû∏ç»K‹ïñˆQ¯–[ß€ WZŒ!wmÀÍ‹m˜∑Ü3ÌM2¢(g)wŸh0!;ìë
ß°Âé©•õtêäH}Cw‘8WJ÷óOÿ¸∆∂°#«∆W=5ìiúú˙=†ë"O/¡|lrmjL	Q∆¨zí~Ω¶,UßqŒÙùK,‹I,OÆQ⁄og«6ö˘^XRA)ÂÚÕÎÎõçıˆ≥∆“∆ÍfÉ≠-ÆØ¨Æ_açÕM¯ÔFDT·æ<1e€¶ nÒf”/fõ¿Ûu:u˙€∂v“9Æfª¯^$s¿lü≈Kb∆áH‡®rœèå¨|öÖtIj&Kí∫˝˝ZcfÒ‚¢p≈EHä:ç§ÓJ∆Ÿ´VGÔ!«ŒÎH&¢n{f QHC‚ÙsÙéë¡◊4Ä¯PzO◊Í…ú“®ÔÈ ¥üΩ˛êH†|ÿ’ƒ∆Az`i“º¢3é•‰£(¥¬H#π÷∞¶íæƒÇù2üûW$ı=Õ{XTw¯Œ‘2≠WLk+§&fFπ,êõ≠a¿/Æóïå5©Ó›ŸX÷†"&ñ2~uÔ]”ª}Ã∆–mï;xúv0n∆‡˛≥JZÂF˜–À˙;⁄mPH©
R#“"|®ƒã?ñ™É˜•∑√œ3¯#/RE˙H÷Õá˜D™Êûpï 0yìüÈWT€~?——#Íﬂê2_c`zÈÍ·«/nÎLxi~õVoÇ9&‚/W# cÇ¯$Ë˛0:Bm*)'èP˚a0•Nπ™/ˆÕJ•¬ñ◊◊7ÈœXï`⁄—ëSòUı9ÏÛ°9˚›&Y¬„Ñ€ÆΩü¬œÚ8tF’≤y÷’wŸeÒ3-$;Ò¡‰$k 1i∫Ä,˚‚0.v€0u
H√√ƒ¥v¨å1·+´dTR„wtWD≈/ÌØ∂ c¯R[Æê˝ilúiª∫ymçæØ&Oõ˘˝¿2{?0ó†xÙ÷Ì©;Èi–$,´]1∆±â∏vRBµÇ˚"ı»(È1÷™€¬ÇË<´^‚wëÒ:p§!B/ua‘r[–éW¸ {Ö˝ÍWl,-=AbÛçÏÊ4ÔU}Il›{c‡∆SÜÓΩQºq›0∞›rl√à◊∞ù∆´¯VÒ∂∑9ÛÚs]≥≥ªP^.ﬁS[7{»%BHæ0 Ä:öa&∂KOã7∫´o!∫eCEºXº~äPÂ Ï^îóÌÈ2¥øa¸ß¥AπI π˙îüQ∑3”ci˘Kzæbk-6…;M˘>2T52bLö/í‘[v2JàÁ 3Nÿ∏=¯ìrjªàC€∫€ló·ÃYÏ–NylRÎìÇ+üH=:∫€∂Z0•◊76«“rõ°Ê¢ÓM.˘H‰0ˆ&Ü•‰¥‰<)MK⁄è«£¯B˛W’!£Ä®ù¬ù5«“ODøîˆB´ï#…ËeeµGûbTéßûC(Ûè o≤SÿâI÷ìfü•¬K}>pr“"∆b≈ ﬁˆÇÃÎ-#/T¡àAEiÒY<©( iY◊‹OÈcdEk∑⁄˝4∞Ω2≤¢¸Ø1ëuHˆ{W»H%R©ì W‰krKˇÇÏÆ1Iæ¸bbÅL ÒeƒbÚ®ÒãÜÑÙFÅ*cXXóAvSÛ2ﬁ¶ay>(˝çG‘÷ãM“K˜N·ª_Ú“9¬˛È'<[1:ù√Ÿè<“Åa‡‰Å§ó.kîiÊãW QJCã§]p»öÑ‚e›∂”híTÀ‘´‰_ªqıÂ^@∆õn’·8¬&íG Í≤fö¯ €M]îÖ≥Ä:4Q¡è)±] oi¿∞ë≥È:lªﬂ•~-ôH'V«:Esb∞≤ÆÊ—O«3—Vlf>˚‘d]Ikóp;.è¸ÑÆê8EÍıΩ ãûühUú=◊ﬂ™UT§äæ”™˜*°¨j:±J˝D5X¬m“∑,_Ω~}ç≠]ør=VÖ¬Ø$•H™[º€k4_uí^5§Ù.-(cÕv]Õï…∏X’‡vef›.R©‰Y„Lè¿∞ﬂåX^ÉpyáJÂ4¶EMÁöì& ¨≥Ã´Ë‹Ÿaé›úOÔÏêi¶;èu4-vÉ”ΩRû‰Í#<~¨≠_†ÅÖRÖf‰¨£‡&»Ã˜ä’.≈+Í±õ¿ú*eΩ}3 @˙‚ÿI9*’‚Á˙ã.ø”¬xölºz+Ë·ä7BÓ≠=≈–¡A€◊p˜+Sµ*¸cyóƒæG´∏.'î9ÅÏdÏü=»^Ê\¶f|/˝çdãî“Fh«+à…©éÑë(”7!…∆5Éµ˛ﬂ√?˛„ˇ>˚Cû4‰æ“b C•œ†å¶R›fLÅÔK‘úf°ì—ö/Ö‘¬Yü†GE»è—eÚ_≤^WÈ—‡EéÉ¡Ÿí•–À£Œ|ﬁ/_Mö„7´∑ßÓd{î†‘çÔg…”j6Ø"+¨ ÒM∫ëûöU^¸„™≈Sœ#ç≤[Œ˘ ”7b∫oV9”üox¨Ø‹…Ëï>sÎ"›–¯ówD®¿∞BœHúª¡<Ωóï øHÉá0
ˇ≥Ë‡Çﬁ∫π∆q:˚Î¨AddÛœ8!Ú1CBœoÒzS¶O.PÜª∑Wô•X(^ßÆq·ÚÏÂZ†N› lcπqÒéWvfÍı≈º∏î;îö°‡ñÃ™‹<Àü"ü‰€ﬂ_ûÉQÃﬁ≤4˜≠Q§¬ıËc:_yπ™éúLeÌ1ÌöbÓL«Œ´bê’“ì∏O”z%∑ÒJ|Ä„∫iÌ≤Z `RB'3ò•c◊Ø5Xyiq˝ ⁄‚xû∫ì<2A8M‡°ê©/ä»»,ÏafóHÂêäﬂwùC0Û,9B3”"^d¶'V´U¨2Ç3∑`îæ[\»ÈiœI]í¥hŒå}:ªxΩ∫qıtbv„%bv„≥Âï~ﬁ¯î}˙åPˆ≈ïïõççç”I’=œîìG}ØÎsÃ◊ô°ÈJüJzÓ9DΩ4ú>ßÊﬁïóöœújﬁX]]gÎ∑Æ-5næ$§œÈ≠Wö}≠67˚ZÈ‰7é‡ˇ≈ufh˙ÂÎ∑÷W+ÏÁç≈SäŸ!'—“ÙTÌ‚K@oeÁX.ÆºT~ˆåP˘k◊óV◊lí›∏z}Ωq™∏ÈÃ|Úà/{>«zqù⁄ﬁ∏∂∏∫v™∞ò\Á_kÇ›û„Ø∏“©v∂ﬁ_ÜïW–7å àÿñSD˚üoGå~?àÅÁM1ò›úª!É£ƒ{îúéfª‹π„e±qˆ]¨]ju“Ÿûcÿ8bh≈∑ŒY›8â€&{[ £sÅm†c'ÎŸ‡$V÷ôQåW6æ¿z‰d≈ÁÈ·VKÕ´ò •a]ÏÇ0„!A2l9?©ÖëÔÌ•≈Âü\πâ¬[ææv=ó,ìÀ3ÕùîZ…qxJÇ—D–fúüy©F8~Î˚µ∆Öôïô±å”µô»t~ËHÊõÈÑFôM±…Ú∞»ˆ]–£⁄k„?
EI"C!œÇ%r⁄∂—ΩWôÚ®X∆ífπx¿†ÿ9;Ö¥Ï„ÏÑ∏æ\ÀÁízP`&£ËÕ≥vB§ÇçÏ‘óØØo≤ç’ˇ⁄ Ã-…:3}x„øåß'“≠H6Ó„Lz“1∫Û•⁄≈Ï˜¥Ω˘“lˆ{EËSƒgò6…ô‘1"…—Wªn8Ø¯1™6m;èïë#q÷l¨ÀiQËƒCèe⁄k@î®JÌK•>^˜Y#>Wn.Æ¨6Äº¯|Íâ—É»dí¸#C—ôãπç«˚∂ıÊΩ-k/ì: 
„´zk˛‡ïW
E˜gnü”á""çê3QXål⁄êã:c
*≥î˜kVnπÀÉ¸ãR[[p*ËıÌÛ)!¥…g>OÿåÑs°$∫∑`:÷∂ãQÆ¿|¥Ÿpíï≠2ÿ¿hb^•Œa"Ah~}mc≥áQ¡=◊OfXH5 ììfjºdÅÉ|ö‡êUÖèá]û˜7›â´{·z’K∏q#B‚ûÏ„ùä	|≠äzvsØn˙ñûÏ"Ï˘ Qƒ>M.tõºN≠ÏÆî√{)3'*ùÒá◊ís'!≥8F≥2ƒ'rL»ﬁV∞2f[ÈMãe^89ıZ(ïZj\UﬁjòE@=u6≠›Ü=ë
XíYˇ>e(ß¡3Y‡9•<xñò"%ÔÉOˇJ))4®tEÔbÊJ?œˇ í≤§òÅ&ÒJ¸K EL‰<'à-∂#zı0…è‰OàúFº[øpê†Ö‰‡ÌDÆtò*MH1Ò	+/–L-€%o‘∆ç°¬NY–¿…Vs¬ëòQ¨f8Ì”ÜcüßÃ}ˇ«¢8vUfÍªfma Úç6˝î`Y.«õSÂvséaQªæΩm4`&ñaQ0clÉí8.r«Ìë°9öékŸÓ1ß«9ÊLcY⁄£¸˝ƒ4Ω:åjXÛTmfnZªìª¢pß9’o$L¶f1O!ìDƒ4¡Í∆‚ïHWÀõ´◊◊ãIW»∂ﬂut &6≤Ï÷8¨Øà3ÏÓ*O(ë§=â©W!UE◊™ÿò◊≥£¨$‹É≥ØijwXØ2»ú§¨©∑zπ˘˛ÆH#àqIc≤ıﬁŸı¸Pˇ“·µ<RÎÌÚ"8^Óµ5mﬂ¬D◊¡Ö‚y‡Ì¥™{4å‰<˚ı…ãs¡jT4 C_}SﬂÍfks=ÿd˜öÄUﬁŸv„æ·¿wÓ˛•ùπ%a6„æXæ*r¿3Å‘ÅZ4ùƒR4©§,ı¸a!óR¬°lÁî<π#Úgé(Xπs¨àbª ÿ€NÊÙ≈ªO„	ßØÓ˙–ı†ä⁄ôVº≈ï)Œõl≥m8l◊0yMø]€ê´ƒ^«®©π¢Rût.·Ûì–:YrÁs)ê…ENpÕp‹:ªù„†wÃ¿Ùæ"Î
…c,îÈP<B¡w,oÓE¯¶•;M€Ë·∞x´∫myuY®É5Äﬁm≥éˆÀfXèõb–elsQ®ØÉÌâ°|Ò‚≥˜xYN^Û	çè‡^~‚Òã£˜©≠º*œyKûÂÛi±æˆ
S>ë∫∞Gâ9%ü—›ß≤(∆«Í*pÅ£y&‰©≥⁄„áÎ@÷ê ó)G¨N◊rç¶ÆÆŒ:›aK‡ppi—¸π‚Ó+>˛¸Ù—YCı™Àx‚Zé;,öÎ'Sì˚â∆Bˇôl˙1ï‰Ü©ˇùE«‡ØA®hÈ7TmµÖˇì>¡Ñ™p◊á€ÙPpsz∫ﬁl´pªa›¶—^}C}&f≥¸·*´^Yé=yÒŸØcÄ˙3›lZÃ∆)¢7y≈ëıŸRcK˙Ëﬁ—óvY∆èiG
>ï™’'Ò8õ8Ëgr≠|¿?ñ/~‚·∫®ò°Xèô°÷é˙æ´.«"ﬁ`ìÏ*.Àﬁ.J‹Ù)£∞ZAFÇÁˇ>ˇ%ãı>ãY§%€–∑·‘Ët4{üY€Å%·#°e€Ú›W;∫kÕ¯≠ê±L·∂Ö7ÆMˇc§>ÓO”Æ™Ÿ˘“ãUîuté˛‚/◊ÏPÀµ≠√ßÄΩÍä-[p»^®"£≠ww‹∂\4ü*N˝ªƒH^¯°ú›3˘ﬁ◊1´Û}ﬂ'D€ZY(CG˝ò,‹-ä¯ËvóA«]zª2Ÿ;ƒﬂœ(4'æ>·’4Êuç>«e€ÂÅkø√Wyπ"j’kÊK"j™Dõıóhn®%*"§´á+»¿të˙,aŸI∂zÀÉãø{¯∂zƒ'ıπ§Í ö£òµÒ;†µΩ≥%´*Q±?,I©[YOÎÍfÏ¢< ˛¡Øº˝˜é P_⁄¸õ,,u⁄+b5øíÖ¶|∞«ñˆ!}a(HÔh¶©{¥â&mX…+Åbv%4ˇÄ!^∑∞=èÍ≤÷ÈıAP◊M}À&6S∆ H¬mFâô?ê8†˙ù}AÓQõﬂø¯Ïø∏¿˘@Áz5ªøËŒrƒMõãÄkCA˘£cuÕT°ºÈﬂ&Ç√ÌÇ@x,€–CdÁal–_«Óq>ÀO˘„C∏Ùû¥Éz[<éÅï›„<9_ƒèsÕÏw∫∆€ÈGfP‰-^€–ÔßOﬁ æQé·xºø~ø%∆ˆπoï≈=är˛éˆã√±Z∫}?ƒ£áEZ—+}£Ö.Ä∏x¸-'ÓÑ˜Ÿ«g≤ù$∞í 1†á_qZ≥@õË∂Å5fÉáÜ…πÇÕ›ë„ÍôI¬Ú¯ÍæÊw@Ñ'@ëûÖWÎQêFy’‰ú˝y}∏”[{W]çÀã?eãÕ&4mê$•¿ˇù 	ˇÃ—Ê#QÙá˜ø%ù˝Üï°ïÒ†_∂ıw˚:˙a0ÕAá2¯Âpaõƒ∫-bµ–Í∞›7¯Œ.úIEÿAAa¸„ëƒÛß·≠åÈ#&8ø!Uõ
5LÔ‰ÒéÀNÊìfﬂ/(‡i'ÄØ“&*`pÌÑßdœUÑyÈ˝ïô•>œ»?Ù◊ö°§JÄﬁdMÒ◊‚w¶˛ZAÂæxc.®Õè§ÚLu‹JSCeÈ¯Põ$úoí—ÂIû9dnÃMmkc]ªoÏpF¡Ä	∑x¡°-ÍÍGä‚][Î	w›é[ôã∏˚âEõ#g¿¥§i∫'Aût™¸ä—:Üä„æØÃmû
⁄‡©[˛V¥p2±‰'Ò‡6ö|uiCT¸åwÆK'©Úhk∂ıé¶éT≥µ˚∫…Æ;ÇQõDVyI8¶éå'Ñ?†¡~¡	æÏä(x3ÃhQál[»"∆åÀº,G^9ÚGäÄ∆iO=Õ÷Sy*<º‚◊0ÉÖç€“ïqbÕK∂Ñ7§KñÂ¢ —c∑VCC},XÈ«Lñ°˝Bû¸¡Cú1UâïÅ&éÛNµ£ı eû˝;-ï~e¯=}˛¿≠≠tí9∞Œ©<Y_±ö@! ÿUÓÔ$˘Ì´ëh
›ïƒV⁄kúNÄL7aﬂŸÅ˛Añ\S¶E¶?úZÊ1¯&†ó4ˇ ¸œ¬ Á÷∆2[©˚≠ƒúVµ9Â¥JoÏù¥µ»(qDN_LÓ|Æî‰V≈∆Å©àø≥ÿ≥œ∞d~∂i<—Ú∫lı<Ÿ,◊≥µ$dMzy‡üd¸•.Cß]ÿê`aı‰:Ía|W´Ø‹>};f¿o>hl€JÎÇÔÍïm†r£õfg•U˙ÁGJ∏(S>8»æ¬n†˛òµP‡¬çn¿¬ÿ≥-¨5Cïúj¶óx¿KAê¢r≥Ïç¶‹ÖQåF,´>îÂ÷	‹&˜ÿ~Ù ß[z‹£8◊¬åÄ∏µTŸ\\bµ:[[}´¡+´õ◊o&#TÑŒH&•~yé¡i¸nëÅ˜H‹ï´fã∂Æ±2—-ÉIOçF;¿ùl”j+m§q£Öù†°ÚVh2≤¯ìÈ©©…◊√ºÊX‘:‡ˆ¨∏CÁG¯∏fo(⁄v¶”€ Ã∞Ä~	sºÂMºÓM√ó/úã=)s÷¬¡•ûIàì Uäp≈7ŒöVÛ^=’D√ÓX]À[o•kíxÒüHÀ‡åü∆Û»uÓ¥JÙ qr–,'€sôÔ‰,fU¨îUîH5BS§*≥•$w?ïé—Ω,…b˘/AÙ@‰»É˘ Fe¬“;#çMHj’sΩÃ7+ZIq∆ú∆Ìy\Ükq0˜∫ S—	/≈8«€¬ISË{=◊p<çˆé_q.öëñ¬±ﬂãØ≈Â†à˜≤ÃìyÇ‚9kÍNxf#^öŸ–À±	2uΩLåj+‚|U R/ˇªO+¶.çSóŒ*¶Ü<˝Öá”Ù[ã≈+æ≤ûl ‰´ËBX±8›ãm[ªŒ¸¡tºà¢+éx$tï7tFëı[ãêQ≤˙XZ	ˇ"|&…-¨‡G¬˝cB{íò;:À:£ò{F»,Ú√¿
WP4 !pÊMòÕR«µµ[©MŒ‰˙≤ 3m£˝|ΩèK€Í:Æ{Ó}CùÂeR‚åJózÀ√™‡›E4»ºÖ!36µUÊÛoß\˚	Øa˜Ü"¥±Ú¡0á˙!ÁÆ…ªπ≤_D`ç$/¶å¥D^[gG/®È°ãg¢†;3R€RÃ"≈≤ä^Ø‘XFGs$åZ¢<±ÜÚJXG6Œl›Ì€›<•ayΩb‘¬∞,8
ﬂÙc:0M›Ì;„‹(	¸Hí¸ïâ·≥™—"Ìvt‡yKˇÚ	®\≠‚DÚWñŒIQ—≥Xçò6⁄˘'E¥ÅZjD[*2&·»$N¢ióñ$RΩrU.Œ[UY‡å%O´áπ
0+õ¢
§»-ó5¬˜	∂Â„Ω ÇV%†å≥äº≥%Ó‰ÍjaZKnCµîπÊÇ_ﬁY≈ü19?é∏™›P‹‘EﬂÌÙ—O})mù‡ €ÛJwµQ;¨e:•·ï\E:>‹∫9Ωùn=DE#?\L∆/5}ÿ(-øêd—≈ã¨∫∫f7€Ñu?Ì√ÅÕ.&¶mb[Z±ÃÚ…¡“ë5K®¬€∫…£8èü+•nËÛ+nÉR÷O˚∫Ωüµ)R‰•ï¢öÑÏΩ"§nœG|SJ"CÆßàâò‡“∞ûÁè‰Ñ˝ÚP∆∏†Ω%Vg%Å—êﬂ≠}‚&–}Åe®µÉ_ïû{êl1\åkï/}ßé/cè«`Bñì ^'%≈`ê˙B\€r,≥èI>–Ÿå∆µz¥2E,∑^Ù·Öf3Zö
à§<n8lTÏ®©v-æ&äE*Çw€¥v+m£’“ªY˙Ù$Òt‘EË´◊œ^EÎªV}uµ-3p<gQZ6Zze_˛·“WÓ≈∫∑d´\åÍçf!*DÀƒ<œq)2xZÕ<:F◊Œ•Õq€qÃ–å‹<¸,1ë€û/]ÑﬁKkæ–m◊çoßß<pØ≤üË˚£hUÿßÿäÓjÜÈ∞ÚZ≠›Ò·èÖLmäÉÜbKé´è‘«MŒlÔD9)»◊	ºïâmÿlâÏçC1• Äc˜(∫w˘.fπ»ø"ï"˙ï ≠nœ9∞ÊïË°,’FïîO8Á⁄£wÈHüg—&´ÆµfÌÍˆ2–ñ§l±·K"ã=êW';™›¶ŸoÈN˘]>±_˝™@k\ı3Í#kë4hm≤SëõÈ›—ﬂR\Y Àß Ö"áπˆG@E9¡8˜Íå€s2£)¸17¡Ò,‡`‘ssˇUE ßrX…ô≥¬rCt¢±%≠E©ò0†7ï˝	µïá ÊOL¶z£K‚BT´ -‚'zsr·§¶xszRJ-`∏À3ﬂ4ÜâC⁄+B(¶Síì≈Ç“*bñ√É#èœ©ˇ∂€ 0)√ÅU'∂µ	Äh£\ˆ"Kù`cû ]T$“b4À-ùÁ“Ï±ï•h»àOÜY]°†á©Y∆rçAM
ÔÒø# pÍpñä'a?m°µ`Æ_˜J∞Ó[oyº;˛Ìó≤êõÔ÷∏;uço@≈°∫–ÚQ¥XùI≤WdñÖ6KnkÆ|π‡ﬁ
∫åmÙ∑\Ú≈]5qıµ€µÆ°…3àUP∑ß∑∞zTeWƒ´Òø;≠DÔíÏä^Å±Ö6/!¸Ó`=FÊÁW‡º>
uCÒläü∆“z]† ãvJ•¯÷'«äﬂ¯ëÙ^ò¬(áxò4FØàíF2H«í¬[Üêlìgè\‚ëXßÄ…©ÙØböAˇ¿Ô_√‘ã
r˛EÜuiVÁ4;ø1=<¯Ææ+p`ûΩ‚Ty≤ä|¬[¥1Sﬂ—ö˚?—˜Øi=Ã–|õŒ«EÔ†;Úv].cîœMÊuktQœ÷Ào…ˆ/ôiLI:6Ls^V,5C÷0ÚDÇ^F¡aöÈõ¸åRC¡M{ógz¶û˙—K39LSJ
ß`Bß°Äœì˘IÜÜiåÁı2û ¶
∑î”BΩB;ˆú∫;os∫qßxªH}¸V_}ï≈“ªA“®\#¬W!WâËê¯ÑÍMHÈﬁÕ`„`Ï∂u •Ÿ®±",æ˜M>?êa;íŒ^‰ƒÂ'OÚè©¬[°Ë§{Q±~Úπ˘◊®Q}@$∆3»ø
„Fú√è4Ã¯)Ã≈Íã‹Ê≠ú˛=Å^Úy˙Ã‰ÛÙQ&\©‘º'û≥Ü™^„Q∑µ)ø{(Öâ‘´ëQàˇ“ÅªBZ»ûf£˘)¢ëd≠>ODfF]s0&æÇipcº2S£Ñ¡€¸¢»~"‚‘Î⁄Öãw∆D"È\‰¿Kœ\º
Kp≈∏{e›ƒJT®$û√¡–Ë'(æTh/∏h;·*å\ÊU%rÚZ\ò“PTqØ2Gk£ﬁ)¥:≈÷'ßè?øÚ˙c+_Ñƒˇ•BÑ§˙Éw¬ä9“’$öÃá⁄0Å‹$`ì–¬®∫ Ç€¶ò Ô 0örX:Fπ/ˇM¶A¸R¶8|D√‰©ü∆∆·Ô∏/üíü‘ôtÚ˙Ê*πi‰Ò∂ÒØ”•_‰ÄñçnÆl—FÁ=ëﬂÃy©⁄í–>Pœ≈”+¡A&ÏG3†≠•∏ fp•c-√!Qj˛Äå}ÑS≈8Ω°4?û|≈ï>∑Å˝ T¸∂xÆﬁÈq[·<uwõf|á€µä6i –(´∞⁄–+ç@„ﬁËi∏]Ò’ã€—0≥˚/=mçÇvhù`Fko‹ØI∆Ôâ	xƒ~ƒjÉJô¬ÄZ MeÿÉ√¨Á\IbEù°‚<¯qr·˘∞æ4[+)bYÿÃ¥”xdGqÎúVoˆyñ∫à=;\ﬁ;üÔm¯‚ñç“5Ëî›Í˘∂´œ?>-tfÂ„N√·ë≠∂7©ÚR∑Ûs&Û 8g~4äsÊGÁÁÃ˘9Ë‚ªzŒå˛8Y±v’¢ ?éı@9^1P¯*èﬁØ‰€j&èãvÎ¬
›ò§^æì÷Õ5¸Ê√5'R·ƒ{≈å›t#“tcMÛº#û€‰I(≈ì=My¸j®îÉL Îì–ÿD£Ø#∞¸Ï£IIgÁÇ	ò”TH¿È_Öÿ·òº≠3l∑2ì+∆Viá¥gÿXqEZ1öÀâhŒ7sÖ
eßπÅñ0x#+>ò≤ÜàŒŸÜEát,°‚á∏ìÊ¶ÎcÚ$;˜b"<Ò&π|¬¡©‚,É∆•ãaGW/ÅÚtNﬂ†;m\lˆCæÒ˚6„˚Á˚ùœxY‹õ:˙ÕË8n2<∞û∫t©Nπó˙f–=–q+¿C5YœTrJ◊î˘Ãe˘b^2çÖKé\ÙŒB®h-˙˝ÒÏ™±”fF:pŸé≠Î§0¶⁄Dº≠3¡zFì<èxùÊwIµå≈g±§ù„zlÕ∂ecuË3˜†‘Z≠ ànŸ;TÎπâ≈8†”ÆíÙû®…€E∏}Ü¶‡¢ùáû*ÿlÎLÎª0#√ÒÍ^ŸRÓÁÏã(w	ZàIÜ€Áy…YØmòñc¡
è)PıÛUYı3∞Xx`aí¡~MÄ–6ﬂ`tDË∑Ä)W◊öm,“ÃÎsO∞¶Â´~MKeH+∆@I ØmYá*í0gﬂ¡ç¶î•ÙÓ∏^%2†¡èE,∫ÑjôAeHt$XÇ&k~õˇÏ`%SÍqJ´’“ˆ^+ı≥ri≤üí›-O£∏GyrˆO◊Ÿ "¸±∏—`ÀW◊ã‰Ì%{ €ŒWüã<ŒZüúÅ¡§ıqßÅÔ!Ú÷óÆÌo¸tçyEÜ¸ÚEØäÚEŸy€≈t–XÑ”˜¬-4÷bâuæ6Ëz⁄'z+Íú√Iı´ê|ﬂıÙ|»ƒ0dù,ôiG^f¡z°c¢©S—§yˆN ≤jÇƒj¿6’ﬂ~[.Ã€o{+„(øÒΩ‰¯ÚΩ˝ˆíŸä,qÙÂç~â¬€o_¶™∫é¸ËçÔ}èVî-€@uÃ œ˘M
úáu>¿Q–ÖO∂◊ﬂ2±4oøÀΩÑ˙Ω≤Íc»[Ø◊õ‘ly,∞Æc˛weo–Ï¥–aOE~∑≤`¥¬A¨Ú	wc.èâÊÔﬁ”˜«∆+˝ÆÒn?˘˛%Àª[›∞î˚öû¯¢yL˛®… f\¬7íF˝Nœıä=; ¢O,0∑wyh%~)jñk	_n¡©´k]¯í\‘O0Ù8TÉ6◊ƒåé=tzé˙Üt ;åE°ñµ€çE¢ñmıV∑{¿	8aTÚZ<|'K6ÓÚäyñ]möFo≤Í.⁄:’∞Òwg¶ê,~S‚Tä6[Mßó“ô`”sô:—¸≈sJÚIŸØÊ¶µ@ˆ´ƒd5Ÿ≈øØøx	`¥?àNﬂ˘‘ñ*ı…Yº±êËHé]ØokS—ö:°™-"ñ-îÓ$€íHy_~àÆÅíP…2‡:À∑0÷‰$ãV@ºlòz9s:ë&;ﬁ	6π◊]˛?~‹ÏﬂªD/™Ωv/ÎÄOi•hΩ¢gÈÒÙ=ÜGŸO‚	û’…ñùæEbFAqtò7xÅ3Ò—v\W7ÉØ%p2N2ÒÌÙ˙vœ˝yk$>Ç4®É“A)+L8£|%|LAõY‡Ë˜ƒÀ„√˜?–$î,€¡+»ñïÀiSô∆oC«≠ò◊DZ &ı)¡%Q éœv}‘„ÒÍé˚qä«–Æ`Ç≤A¶2¢b˛„‘Ç«í&Äœﬂ˝@eıÍNU*«,‚≥/Æû¡v¶í{ñ≥|#ÿuˆ$£…˝RÍ·úéÈÍCLW∆T`CjÈî„ö…ŸÛ
	.úU8˝|:péS}8 ®âZ2ŸÒØ∂î
ÛP(UlLUJÉÒçÿñ#|Õﬂy_8iÛéô»`v\ÄêBn@p)x †ºG	ÚÄ£mÌN^Â6*äÙ•@ë?Ó•S:.Ë'ÓÅ"sΩﬁZhjìı4∑Ω´Ì„vWUCrNÚ=`T∆ﬂ3yò›» ¸˙XVTæúr¶UUŒ∫«Ê^≈ÙF≤8N€ Lù--.ˇ§±æ¬÷Æ_Y]fÀ◊◊7o^_[k*é‹‰Å6¶>`Å‰oØ°E™Gñ¥Ê=,?≥|Û÷äåKp±Úç´7∆è”ÿr≥n£¡ò≈^oÚ™Îˆ&˝8ì‰á9©»Î˛√<∫ò3`lÒ—S\.Ω	3˚rﬁÑÉò∑ﬂF»º˝∂ö∑ﬂ&ÿpJ“+˛ÂΩk–è	®FÌ0º±õ:àÅéÎ_b¬”ö(∑‚m/‰~–úˇ¿3°Õ´ç◊Îƒx-Ìá TjN˚;∫´jÏE˝}Cﬂ-è°+D∑*››´ÚZ•A@CMã‹,<så36û™ıÁ1Óeˆõˇ1°éõ˝†ÁˇÃÛæf#ïüV‰›ÚÌ Æx‚*¢—æmÿzÎWú)˙UG€´OœÕÖÚäx2_ëoBÚ}*Ÿ'Òi⁄'zæOÇKü~VØ˘q´wî•ıaw[≤¡wPlkéo&RæS÷¢≤ ñœo,ä<0††◊–D¸/˙ﬁ@„‹—OÆ¥§3XF§:ñä?úÅÊ…( πp&0~«K∂w?i÷8 òmbiå◊qÜøp¨n˘∂7E\P}√Aäw‚˙º32ìVê5k…cÃ'?Á∆≠Si‹ä.√ı>7sG\¿Ã5]Zx’tﬂxsp≥â0A^Éé~ïç‡å∆0Hﬁ#“¥¬†å¢}¡⁄®úÕ∞Õ*Lç^≤Dß¡öÀé∑eEøâ≈#á •Ve+Ü”3µ}®“Ònæ‘ÕÅU/> ÒÖAú)èáËÈFg˛…dv”FVK÷á&π‘ëkh…8ˇ<äi©¨wéÅdÛÊﬁ¥$ãû.!Â… S¢M∂ÚcXΩêΩI¶´Ï1ØLzd=€ÍÈ∂kËÉ´aá‹'ú•ñ•ê`4≤-+W!~˚¢’®T∑ŸX≤2≤yHéÔí§5πNx˙YûAºâ0˜D¬¢ÏÀù¿ +ÒÚ'{F«§†f`Ñfò;Ÿg√–d/Eoëh˚ﬁù05CG—FFs∫$Úâ*RNúQ%YPπûˇ$UM 	EGÊ)PRñ?’aÄ|J˘åô*[¸Ö∂ßÿ| i≥-4W/ãÀPıfí◊8	Œ"å˜	
8ˇ—Òl7°¡!£Æ(ˇ∞Æˇ+ºoR	z¨ÔAûù§`¢èxÁ†„#Ÿ{içº\Èlù-≠-Æ4ÿ⁄‚œØﬂ⁄dõçk7÷7EÃ£[¶÷“œ-£AÀËÖmÍùÍÔÿ[ ⁄≤Ú’ÕkkÏU∂dY.VZèÕ´q#—4á€Ã™¥JhÒÙU$RÑHÖŒ∑¿"Jsï∆–5VyÃ‘ˆ≠æÎTiˆc„ﬂ˚±òryLIÜ{>rÕóö .‘∞û˙ó~≥ÇEQo´j‡}uªÇÑBÕó:[±rª:ıÂï\ÇEj◊h‹>¶(K’î‰XËj∂∫ç‘Ú∞ÄGÙÉªëô ¥I.%‘∞L¨∂
,lﬂû\IﬂI≠zä/¨ì√Ëí÷›15*d*}	”>J´FM˚[°ÛRBJáo[6F]ó}Âl*¸-òù÷¬¡}UYà7Ï09É~v©	à¨~Ïy\”ßÙ4ΩÔ[°]ÄÔ ∞¡ªz7s …ô
ªãM›lÎÕ{[÷^Ibf§Æ–›
ΩWÚ{ˆ3”sΩEŸz«`$	£à_|Zè√û+^˚‡:“tà≠%˛ÉmxiüÙ(RQ”d97KûJ≥$_$<›œ-ë¡Gy…ÿ´ÖÀº#:€—1xÜK˙ÑﬂÿqJÜ!{úí£»;¬Q¥—‚Íg≈"——Á|Ê(9—JJ#p+>∆¡g1]£ùàúo#ûK<®å>é#ƒ° S8¬UBtcZZŒèx–Qf{ÙÉ˜&Ä;bƒÌzm€«–∞?plúãÑã¸∆±ˆ¬»Iuï ÷úT˜\@:æﬁxÀ£∆1ﬁ—c4…»`Ì˙⁄…À)“‚ô€êÙÉ“¡AÈêl§9ØË∞t»óÈ8®Np,¯ ªÒ„ÚÂbeTÚıìbxXR‰ÊCB±;ÓΩ{¬ê<Ü∆e\êuÇ¢≤†¿©/ï
R≠?‚:¢£P‹ÿÇXñ†±´w|Àv<H1’N!ÇæÓe‰á¡‡D;ëÁ„
†”«F◊îø<äÎ∏Mπﬂè3J°A™R©∞kãÎãWÏ˛Sæ|kmÌÁÏÚ≠ıÂÕ’ÎÎãkl•±±ze}úﬁå≥NHs∆FÀ≥Mu¥.∫¢Å#—Bïdù∫“?≠=Ø!dc¡ëhtª e’’Ó∂≈SÛ&ZŸ¬CBœÿﬂ2tãkUl4ﬂt<Ñ¡<˛V≈’53öªWæVEwa+öW20QÀìn>ª‘ûçòŒÑè Ñ: ›tâhÕJ√˛û⁄6®¿£™à
<û¶˙ ¶ê‹«î≤·ÀGˇuº8z˛‚Ë√¸ò»„#Ü˜Dâ:^nÔ“Õ˜È'<zHƒ >ÛFì-|≠π5≤kÑöTfÂ»æ4ŸûMyZƒBË•eŒ,YÇJ™î@`˙Ñ ÔarìÙ˚°
ä ‰‡Õ«ÙGœ˘ÀO¯óÎ˝Á¸ˇÚ¯≈—{îKø˝F˛ÒúØfÿÄø>|ÒÔ¯1=á∑ﬁóCy¬îı˘çÃÃÒƒ{∆_ˇ~3\W^LGˇI`,/>˝$"∞Í<U”Z-ÉÁ¯ˇ   ˇˇÏ}ms«ëÊ˜˚%ÿ!º¿‡Ö%aIÍ@ îp_ñ Ìu0xbc¶Åisfz∂{ÜL#BÎõ∑·:v}≤‚lﬂÒt¢(≠Lsºôäÿê"Óó(ˆ¯'\efUwuOUuuœ (Ù3”/’ıíôï˘‰ì,AÊ›Ûôb5ûf>?â]∞DêäHl¬¡]¯.®,∆!¸‹⁄Ì}¯1D*—=;◊πàA ¶Öœ´A}“¬˚mVv5†µ•ƒt„"Jï5πµ≠‘#…V(ÕE‘ìöóñŸ©[±œÂP¡|‡3Äÿq˝é∆W‚t=ﬂ|]ﬂÿ;∂’hÛ—Á•ˆn4¸qc˛÷Ì›%Â„ ∂sB‹Â√µŸ√5hïßœ6π¸[Ã¶‡]Ä…tJ¡ÆÄá◊L üo2o!o‹ºˇåR3FSøq~q8 êVòMeqVu$ûøÕz€3g {….¿
¥OŒaÃ[m®∂ZQ+Ò\o‚ï j»∏{’$ïSA¿ÔæOıM@ß¨7Ì2	}¡’T.&÷OJnÙ(ËB¯·B¬)¶Ë≥…·hx˛–WlÕhçB˝0©÷2O∑G3ãkTÿ5–0X¿P‚~NısJ◊æIÎ›PC(‡[\JÖ_lA¶K›öS)ıöµr◊l∂ª•.X!eY≤i‚™≤çkÖ{Î›+\ÅÍxÇ-¬%T≈&OIl{•sOz¢Æq—ÖÖ•n∫Y[ã¸&÷¸R™’¿WP¿f{W¸öFÎ·3ñ ·z¥¯WÊRtö!	'Y+⁄ÿ·_E“Ô¸ﬂV	⁄€Ï~2°|F“∆Î6¸v±ëé˜u(^c©.„REÑpŸï*Ìgãé◊aiCY*=*ò†´VEÚv!€ø¥0≤Ôa„ÜàﬁHÑH‡ﬁ„ÿk#…›h&A„'Ï'ˆÄM¶≈óá]ò@&?‡´3,+ûÏÛû»˝¬√D?} 7“{·ﬂü⁄ßˆ=Ø=/‹Ô•b◊æ≤π.hAÅBÆ|âÏQe∂_Á‰ÆﬂØ„çJ)É∫GF∏DÎ,$∆^Z!p'l‚¥Êü\ÙÌ]ÒK8Ëc≠nÿısªÃt ºŒßå≠˚-k÷eYàÄöòEØ≤eæUöâπû9Åk‰.êœ•?·k›2ëƒæNêºuÉkï–o˚Tê
¶C\n˛Øïùˇ¸S≥-Ø•ﬂæÌãÄP"0ÈgŸÕÃk^π˙_c^ ≈>∆¢-îQQ?@˝î¡ø&øœsî“™¨˛ )Yâèıcî„∞‡~n<ZR–K¢√6ÇÓ]ﬁÉ˝-)eØ˜Öº1Ïyká{bcâ£Nû6É:KAc‚"Æ X¬b	ÕÏ&K»ecRºˆsc>06]∫^ΩŒ€é√ˆÄœ}ò|°Ù√û,Íñı1™@C0>'.Œ:ıßÉå*!•rrJ€øEE!≥§»ˆ6Èh‹ÔdeSΩn¿¨XÒ è™˘ÿÿ⁄Ï≠ˇÍÕ¸dnÊçô€≥ª”PS≥∞°FåµgŒ±^4NYÜC™ëjr=ó8˚h∏Ì„bw»è^∂aÇääúQaÒ220Á∑#?›È}Í+n®}Xnr≤–ŸY(Zí%VH
ƒ/8=hr±ﬂB<Ô∏çg≠ªÖâ∑X…éπÚI˜‹…2è(3ˇÖgçeb©ÁÊ‰Ñátv%b6óqhûI£c•∂®EN<Rê≠~ß}9åt=≠’ù–Ë\È◊°›<˘2cøÌ7˙∏TÎ7ÎÙ®>¬`Ô?¸ñb[®,aî }Wÿ%/≤ƒ’TS¡z∂(Ö’2ÌÜIF=Ÿ˚Ö)ÅÖß2‘˜˜2VÙ9´°àô¬."·üùÃÚrKö@WÖk≥t/LÃóPmâ„™ÍÚM=_W±ây; CœWQd¬’4àˆ∏öÒÇ5˘ŸjˆÄ§˙8Ô\…‘~®ò⁄)õnTÈm‹vß$ƒÏΩØ⁄bxÎj˛·pÕŒP iz›˝cπa_íSHu®#'»„¨Ë°Xjmœ&!G√»“K=6Ë⁄¸)n–˛åœŒµ`]\Hmêü‹Z¡∑8√F[ü¬ı*¬
Ï‰⁄◊5™¢,B…∞zdÂãñı…B+Ω»˜ÏÎ9
˜‚˜J˘dùX$d§<¡˘Ú\*øí—ÀGB ®dÁˇ[ä"÷ÎugÁTz™&n“»’±ÚMu¸f0ËdÒlC˘ÆöqLÆ€ól]YΩ∏…“*Î«=¥µµ≈MLbÇ†:>*âµ¸»Ø∞hJ˚tá∑ßãFs†≠8ÿÓ}∂LFó0Íh_4ÖàÉm@ûıMÔ÷9¥ıπ¶«˜ÂeN¯>;Êå)·;ø„Õéõ*ò†}ãc9—…Çx” xöÏj|=;‰‘ªW‘„ È)Ë1¡y ûÁB&	€Íœﬂ<˛h^ÉØF3.÷îı|&®§çø~ˆu ˜]‡åÌ±Mœb\≠=\o_à∞o ¡Ô∞^î˛R3*.^Ç˜⁄K¡ÀÓ¡Å∑ïíﬁh\Ñâ∆wÉ‚ÈÃÇßÜãÍ§WÈ&˘ÒSñ›;„·KB“È¶çK™ìf≈ÍfΩaäZÕÑÚQ˜©ùøˆΩˆª_ìôP@¯Õz_ì«O n›û™∑˝ÓnøuÄØ^ãmÎΩxEó„–»S`( H∑‚åI‚Ó˝¸tZ1±KÂÌ¯o{=+∆ôn®ßa üiyAÁr√¨,Ø4T©cWÅE•ãΩL$œ$∞@§å1Ωm≠√AÃÍ∫∏dA1nà≠¡j1—Cπ¥ä∫C≤≈9z…±Ö?ó
ˆCdéN‡Ÿ‘|∏M˚π»sÄV|Ã[A:<qæç˛túÈŸÈ–à¬∂âá»‘ùûØ'p ùQºà¿K}æ÷˘<ûŸg‚!‚ä√$Æ{cå0á..xGyZìqŸ∞…Ö‹Ö˚gr£Ú∫:¨Ÿ=Ñ-»lF\œÿ’ê—ÎRb
£˙ŸM∂œ˜`Eäçú3|ë¸R‡~¸ˇÎK»Õ!7ﬂ«è\:ƒ»Iñ;´∞{ß¿V-ºSÒ–wº^≠ù≥Ñ.cÿ∂ﬂñÑÙ]üˆ«ı†ô€dá$˜ÏπnñOâ0äŸ.WO=«ÅÎTÇ·6ãppŸÜ6Û¬ “v@tºwgˆfn-à∞ô”Ì4Vf!É&∑˚—†€˙≈1MÂçÛ
{∫O¯H>¯È«"øÑ“ˆ"∫KÎãò— ıÆ 7ÛFôñˆÈ,Õ-@=:ò2w†ùPqIzîŒNPèŸYˆ7~5ÎE>˛`ê”\‹KlMëêµ¬éèYpÇEö˛‹¢/ı†∞’)∑¬∑˘›j∏|ıb”+˜éIÖF"k˜¿·wÅu˘ÀÆ§ﬂ‘&E⁄ûˇù˜7"'ßŸ}·áÛ°¨%€œÿ^–Â˚¡z3‡≥Å˜!=QiO…L≥ÖBÍ¿‹%ÆK\ù&ê.ÑnQ[=2˘“∞mQ“¶¥® <“’wfN…qÁiDoHàz∏Ø@æ◊ﬁÂ˜ÓzmÑ"f6≠‡S€Éíî:§#dœwñvnzgmÖf≥`ÿÄe"∑22´≠å	ÌÿBî&∏$ˆ
◊+;^õÔù\ÃΩ§UÜP≈\°Î"wü¸^>Ë¢szyHgºûÀ¡]J¡5Û~öß‰\›Üwá•⁄[Ñ5"7»ÔdéÕ:Åä
 Eπ.)©·Ü√Ñ◊ù∏à[∑%1	:›Ç0ñÉR&AI¬ÕFMn]bR$‘†Yª£`‹ãù<ŸC7ËœDΩà⁄˛¸Ì†ŸÙª%∆ª‹hbç‰MAà9(Åœπ‰5wÌ©Wôgä\•$†£¢úX2Ãì≈öüKæﬂUºKÈµπ<Ì}¬e®ı-ﬁƒ=@â•mõÀr»BΩ†ª[JÖ⁄|øyîLS“ /7¡MP/ñ\˙4<∏I…ç±n)TP
t¢§â›íÖfœ“…<•@ûo›ÿ∂¨2Ö"dL5‰VL–á–π$à’tI~çj&µ†≈◊e∂≥NŸÒÍë€ãRR·N ?°À∆q$Èõd:i3"–ìÕE&q"ª˜P9ö⁄ª/l¬_˘LµÃjÂ.%7cˆUøÌ˜∫Pæ∂*√NwÀ¿ãLzMŒΩíVˇ‚G}+Ú‚÷¬Q˚!Ï9]º¡\™A
fÕP%	Ì)im	˝	≈Hü∑˝vè€0ãh≥»ä¡R«òh[
'◊õ9À‘‡`æ‘Ç†L‡‡≠<„úe‚Z,Èıl
Ü)ô"ˇŸ3_“.‘˜y¯/&‘û;„òÒOΩ/2°"$˚Cí€ü¿ e‰?√˙ˆ!˛ùD√.AU€ÎX)_ê∑ßi5[äÍCù¥uÓÖy¶›€.*x5ëÑ
-òiq≤œñäÔüoœ«˝(ÏÓjÕ„«ÿÑ–˝ˆ‹ü
=BKí-«ÕËáK‘Q7KwºYõ|BÑQ	ÌhzÑvƒ2‡ÂC\~â©T˛{9PèU÷7ƒ%}ÚÅ:üàò¶ƒ?ëëŒ'√¢ #òˇÌ=o?f;A˝ñçøö¿\Qø†É„ïq»‡ΩÄº§JÖ€£ª1€ˆΩ7Ω¯ˆeøé‡–`¥Òx.∆p?&KKù34¿†@>π†˚cQh‹>˘±	>iË81ﬁ7ˇîIøﬂb«?†·{H√_ÊC
º5¶Æ}Ü„˝©7
2?c~â*\Å º—¥;À¥«wç1„´6"Ä,ˇ¢®˜D1JU‡O¢E ƒ7ñë£\˜Oì’£¡E–òa†Ôf7 ‰.7πóèÊF…Æ‡˘€ÉπÙ+å?ìÇÚ#6‹¿/ì’ˆ%ıyfiæ/Ä'~.o¯Äf∆Ô°ü¸ÅñÛáJÀæ`µô)˚JÃ=T4ÙJÃ:(ÁS2˛ÍØ›„&„Äk>Ü@3®Àö‹Ú°r^‹Á„…¬Rá1´aÆæ◊‡É‹	3Ò>îJƒ3sÁ¶Ü˙¸Ï¿Ôv!‡’˛jº∞ÔÊıµµï∑À—Ï∆=ﬂo¥Ãª0π≠NòÂÏ≠¶˘uàrUøÍÔxÉvﬂ≥É≤¶óïX˝V∏ÈG‹¶6yE&píëƒ˚Ñúë	KÇÜÖπ˚öË_Jü%üÂÔ1ßã£ÄÑ—Gt·s‰°|&u‡ìD§Âê∏"kÂKI^˙{˛Ô+”¶◊6·éÉEÙ*[écÆ«Ωnü)_”®Yãáô(øä˙¬´1v◊+˙ÕÑ°”Ωfsy¿7á·nmÇRÄ+Ûª+œ’fió°7V¯q]_–Ï‡@g”åïèπê´Û›ˆRû‡\zNÂı7ÈıKRr&`Ä˜™p_>qannˆçπA¿&‘A~G#t…·Å%Ù14ÓP^◊¬¸ùxÜƒ>Õ˙Ñ3°2>{\úÇÜÃ†™íA–à'ÂŒOòMø¯‡∏h£`£à.	ãZùÊ–r∞Õ©CÀ€ü∏®ÙèZSgjÏŸˆN3"ÁIç’IÃ¡ﬁ]?ÇF^ÍBËpr≤ Kü•*πËFDú›/é´◊Î®Jßãœ§/±˚ÚÒ”,ÛK,ó5]¯>ïËk^4◊hô˛G9˜”Í∏«wÚØΩìÌ§M˛1L<√W˝8ÿÌR˛È±ÚÕ¥ë'W»g^‚ÑÕÛóZ»gñ¿±ïı Ù9π≤>Û'lº YõÇ$UµpKV4ÌØ¯q¨#qõÓn¥í·l—XYf{Czú‘ôûº¿	õÂVé§√Àπ" iÄ#_'W¯'/p“ñƒëN˚ú;sΩìÛfØzMˆ*Ê‚⁄1l¶e≥ê]6CD´©≤	ƒ£,*ÜàG#¡è≥Ô˜◊Œ;ÏÆ∑¬~ËJ¸®Cﬁ¡?‡ccqg	ˇé 0ôw⁄=o∫õ∑fÊ¿:óÅÇ+¯è$æÖ¿l∑¢†{wf”K^ÊB˙∞üVî¥íŒƒæt5ü:ª,ézÒîªÁÛ⁄˝J¸d"€S∏B≈B∑!ÚÕGä∂ª††\qπÁo∆~î}ÓÎ¸°Øó‰•¿G…'Ñ’∞òœºtÖR∏$˛Î¶µãœ^\^Hª∫¿óÉ6π@Öåu.Ô◊⁄XãÒ“˛z≥6ŸÍÃÙ`™P5‡…©7ÎÑê:‚U»ïêÙÛVN§3ãûñ	•~&ÿ%R9¶§¯~Ç∫tú#:O®=~P9bî!ÚÍ3"¸Úõ«”â[£ qÇyóA!:	¢¬ä^…ìKÅXÀœ·°Yl1û€»l˙‰ﬁsâMLp£«¡™ëáy≤c‚L)¯"…A¬OÁ≤»Wß…^iªcaÕ0≥«»äç–"úï7¸NËúvPfF:tæ#l÷Õá‚r8;CxpQ|
±fço@ñ!7ùxÈ∞Ï/Úkëv˜,≥—®≤VÜ6éÎ∆º#¿•3⁄û@Â¸(lãÉ}Qv
Ìm'ƒ<‘»*Zó´ºF√ÔqÛÁÿÏ˜\.QZ∑.M∑‘J¯á.`“Èü„7Î∑ÊnªeŒ;¨◊L9–s#B«¿e~É¯Ö;Ì›†vQ›^`5Dbï§>Ä÷„u‚ıﬂ¨G~<h˜›ﬂÛR-qì‘=PÍ¢Dî∫äÂF…´á≈ã“â¢Å®<ÓC!ãR7/ìˇ¬eò;øÉÎçJŒ@¯o9ÜÅÁjÑ÷Ç€\‰@IQ\A≤XˇáêúJX4¸ä˘Ö:ﬁ)Ìÿa–$7Iu ⁄x—™Löm*ù¢”Tü=Ô©~ùùåç˛ÊÀÄSzëìÊ…È`ÜïplQπtrÉYC/r¬ñ¬	EÆ—|?†5ò!´/pmËENÿTY•˛…¿≠Âfœ…ñ¯´ß¯5”ß¯µ¸¨_9È∂ÃKú∞Ÿ~äc;Æ86eVùle∞rägsƒ≥i=[/≤mDˇ†
v”ˆ◊)ÏmTÿ,⁄∑˙¶πØÄøÅ°ŒN1pŸìN1p)Œ;¡eéo#N'ñ^V úÊ]O¡pß`∏cÜ”≠…à”ÆôSP\Ê(äÛNQq⁄„˜mD≈ÈeÃ)2Óg¯ŸÅ(Qˇõ®ÄF;FÆ¬	ùVÇÍò%∂1
∞LÒ<§ªëºA'IÓ\
ú/hÏ?cøî/Yn,z°P‰pc•äç/ÛnuÉìŸ«Û≥¿3YéÌÚÌıÕ≠k7~TéÓ≤ƒ˝0⁄?ˆ|ó∞Ó˚◊í&ı˘·ëQn6ZaÿfoS«	·dLècAÓœR|íg+ÚIöúΩf˜dïh{aTÂGæ±µÊÉ∏Â7ΩØ≈&´cX]∑9√P˜”YCï6"‚!ÍND|5ÕîóﬂÇºê–∂QÍ⁄µ€aÃ%πnõ~‹àÇ^9ÙíSÄéÇsglÉ`õV	g…—N*U À2•l?π[DÂ\ªÂl"„‘æ>¿%üËù~Éw-ªŸkz}?>‚Íµ≠ıï5∆ˇ˘˛⁄çrfD7ÑzÔƒ“‚1ö&Ö3&& ÇË
Ωn*¸ï©bV|ŸTµ"òŒ¥¸=ﬂO’∫Oe–+°ó¸S<ã,Õ/àÅC≤Ô/wªºQåb∞+^Ùw+±ôìŒ˜ÜBíü5W˛,⁄Ä
ŒÅõ{9ãò–æwRßB-wˆ,SF˝4°…ê~$Îl‰Y˘3=ï˙&ãñ<ëÁ>¢ pÜBü∏¸óP˜SîáC5/,Ô∆GkgAùÑ∑⁄¢8Û€>€ˆ∫]±ﬂ·ßx}>°˙∞lY;‡[Ær¬=pôÜ‰AçÎFÁ˘Ÿ^i—V ≤õOÀ„òßzAx>]¢"PWv nA_8*^µ[®tu*ó§“V–∏ÎG	@ÃxáJ*7˚àa›j”¨zΩJ2~‚¨*ÂÍE≈BΩK¢-U^U`π›kı8è˘Ê«:ä	∑v¯Näz—n¨ì vÕÖLÕÆ‹≤Ó8&∞““ÁR5ΩóWA6ˇC¢Âˇ§Ú’1Å≠ZÎ¯|∞ªç}Ê©ìü&E_ß´Ÿgëî	Úì&ıqRp]≤ŸXÛb+\ô™9'§öÎ`.2—o¬˚ˆ≥‚áDR3ΩtQõ∑ñ76÷n¸à≠,o≠ΩU⁄ﬂ∑Îµ€~¥ˇNÉõ'ªV«ﬂ∏-uç˝¨´¶˜Fb¶œlCäÙ¬ƒE
_£˛NÿB∂Bm¸ÿlõ±y{ë◊+@0eÖ∫Ë≤Ù©ıé◊´’xN≥†˘.
≥(¡Ü‹ı˜/‹ÁÁfúw*éO´;Ê
È⁄¢∆3oûC›f`ã≥ú•Éï‹∑6yß≈Ï+Ëœù†Õﬂ≠÷Ä€7ÿ+|ûÚ÷ÜÇ\¥Â–≥ñ2-sàÇ©I¿·!MÜÅm&W“˚.v˙ù¬[ŒŒÚ)Ãï/àkÊÌ¿∞b£†~TC◊ãëÃãoü+„ö€êTSÅÚòHj¢:{(k´}ûT∑”®A⁄c=ÀÓ¥pªóQwôZjá™:ì∑s<ÑP∑â5û*jNy˘¡4õ_ú+8≠ bô∑èúi∆Ùª◊•Õú W˜¢ªˆhÁ´}>Òb€k√°¨>aì˘jsÌïá®ä¯Å$ ¥J◊ﬂõ·KX`U≤X®d⁄PÓ7œ€l‹Òß&t`πƒ7Z‡5;:ds	πL2ôÔ ÒaÑ…f^r
Poo]ŸXáè‚ƒ©7iüaõÄyÖü5≈eumÁÍî≈-.ΩÌ
c^≈ä¥9|›0Z7ä›7»&m—(˛ïVı®ûQ‘NIïSU›L†≥Óπ‰XΩÛox-]˜(≠Äx∏ze‚™ø«A#4¢V±éd°6±hí¨§:+$ï∫—“√÷›4àYÍ/7õIùü6’1Œ¬†óØ]€*‚ÿ	C˛‚!écÇò¯#ÆÑáIUY=™Â0ó±ßòÏ©#ÅP†+bG<8l\’5"ø…{ñˇYÆ8Á∏bQ£Q;Jp|%ÏÌG¡n´O°
∞B^,÷ÇF,mxLˇﬂø2®AÃ6˚øﬁ|v%‰ˆ:#pNQV7‡äò›q&5Îˆ◊JŒ÷\Û y[OÁG8G‘ù9qw$·Ú’]]æ≤æ¬6÷7∑ÿ çõ´lmu}Î⁄Æ]n∞ÂçvÈÊ∆∆⁄÷,˛æµ|i”¨onMr´p09Õ&„v¿ß¸µ„{‹zˆc¯ªÚ^Ô˚>¸›˜cæ	ª\Æ·|Ú¸e«˚;¯Oÿµ'7Ec˙%Óø√'œ›òÓ‡5Z~Ûo‚>|Ax‰^‡C_¨:¯˛oKàm∑√›wzaÃøø]∫ç6?)Æe’‰jD≥yH∂><Û˚˛æ‚RïlÚ¢MÊ‰ß•‹Ÿ:iûﬁ<f∞’Qeÿ·^wÍñh¡m6∑¥ªÕWÿ◊ïßÒ2!ﬂidtöÑ|’˙–∫{‚v8G*ôı)¶ƒç≥\ÑBYèY»û7o}˛pä#Ä‚∫b1>¸É^œè∞=ˇΩqÌ˜¯H@…π(dõ8*v¶F|¢2ëç@Ê¯ 
¸sßÓuà…ñœz'h∞=;9ë¥OÍ∆ËæhM!î<œ√©∂XébíáóÙW:‰õS‹À(µÒ≈∏0	ô
h±ˆŸ˝dÖ’€~w∑ﬂ:`∏¯ÍjÙÉ{∂]dë?˙Ë…3ïóAß>¨ã%Ë⁄_b›†f
\¸I”»ÕœoQöyW?È<M.æä?Z‡•MMQ° ’◊qU6íZó4Ò¸Ã4.ﬁ◊‰Ù|7û∏àÎî}B#ÏØÿºC¿B<Œ9∑l.n…`ySmIúFS•öJ¶2ëÓYbîëÑd(•ßèè˘lƒ†äòôSN∑wN“Ï…œ∫h"˝g	g\2¡RÁWíî{˘ò⁄ËI«Nƒ[ë∑ Â®(ó;&3√‡Y3√ieW§◊W[v§ãY5é™Ï‘dÄÚ…≈ÌSQYYZñ‚%¬›¨”ƒ.ó8ùÏoqïıÉ~€/Üú©G≈|‘¨s?ª?uM«ó¸™êå©ìa®âÛÏB*¿¯ﬁ ˜ËÒ4˝ºÑØ¿∑	±õt+!ﬂú‰ënØœÖØ/ÊÅ«ÙıÇ˜_(‰YS∞Víe›äÌsh¥ìrë/«\Jî‚h-:B1QTèS1QUL¨ùäâS11,&V´$ä)çíP‚“ã2‘NMáGè∂ˆ©õè¡“'D˘¬©úx	‰Dìb$Aqj$8<ztAq,lÑSAq¢≈•ÂïÔøu„⁄Õ´´l˝ Ú[kedÑŒq;Ñˇ>Sî≥iªekf~!·ë•	1?îõNez‰	f«@ Kápô#πúS¨xµÑ/6ΩÅ†Ñ%«Úu.oúÑ∞t∏“¬ävæ’∑st5ãºãju6WzX— WnB'2A<’˘ÃRªc8 —∆—4/‹øÉ2|.ú˘nWπ„NsUÅJééJÑrtTVΩp ±ZÜSbÍŸonÕ›.«≥fÂ¨sf¨Àﬁkd::2lt‹bÄò}ÈNÉc|Vá<*— aSF≥BpÆ.•iY>∏rÜâ<JëΩ·ïÜ±2ùõx®Ûπévîì•AG9ÇﬂjøŒ|’πWñµ3âo™˙ìêY™ıΩÙZ÷P
6%¢¬ºôµk˜πe!q5˝Í:1J∞˚ñ–∑Æ,øÕ‡0bAòçΩæ•pÉõ≈<íΩ}h7AÀPN‰öU∆†)Îœë*Û¯ëm˙´:C‡u¬[ID‡ıS◊´^ÇÌ~:†úGq${etg¡xwï=¢≤N˙ºÇ◊†îZv÷x'–‡®¶]e·âR¸áG+•0øqπ◊kÔ≥´·ﬁÚ®ú„ÚTçCUÚbû £‰(#èO;ôûLYA˜.´AŸáY∂ŸÏÚˇ ˇœ9&òäa—Â5;AÛI,)ìb‚¿Ù˝iF¨’Ô˜‚•ŸYˇ]Ø”k˚ıFÿ)èﬂ‡Î;Á44SÙËëÂÙÛ1àÕ3y¶ ¯Kï9‘ å~˜yÇ˜óõ~	•W1ÄKøkfóÆÈF©ÆñW'Ë^òpˆ•®2å¶l)-#nù:&ÀÆÁE±øﬁÌ◊≤Bpä^·€bÈ·®ùZyßªŒ"—’˜˙É∏ú¨ä˝∂ﬂpV™(âÒaît)l÷e˛◊ØC¨W9kâMä?OwäNèM~–`ú
ÉYÂŒóïŒ±¶ê@d¥r&h÷O\\∆ˇYMî•TŸ_Û…Cæ…¢K*>A.≤âãÎ‚/x
±bˇ9ÀÃ]·qÁgI^åœ<ÚIÖßÿË &£'Yˆ˙¿Nüø$q8{JµC|“=&Y2…±@“:∑|MEº#(7πTrôSÒu7Í˙{ÑÔπ‡$ÚÉÊ„ÌˆÎ›pØ6UÔáõJØMπà€$¡h2GMEîˆœê8ÁÚ
û™=˛9íäﬂ>ùt~xÓ&ÅMJÙí»aq∫Å:Obı]™68©|˛;¯ÍìJjßWIˇä¬RÙzü·µø¬¢ÍXxÈ„GŒç¿ó∏6àòˇn√o∑Å∑Á7Ω›pwi±B¸ÓΩÄO+åÄ;›[@#&ùNVB3TÁık9fèò§5˙Ω¥(‰U‚ﬁ¯ûæuŸï0Ú]/%O∆§∑Õuî”5¬÷œ¨ë{Y”.∑êÍ^⁄XÖó8 @∑ÖÀ,aﬂHªX 3o<ù¨˚€£∑˛†ÔÎÑJΩÁ!Ê	õ	4V@¯ ÃØ¢¸fw~œÑôÌH∞Ìh˛¿ä≈≈TÒı6∑˝ıŸ–»á#k”Ä	„Ë’§Ôwé»¥~¥Ô¨Ås©iéN|tA—…KÎﬂvõµî8Ëøl^ªZ'¥∑Dj	¡XÌéÌä¸∏«ˇ ÎÌyo®ﬂo¥j|ì¥‹nFÌ⁄‰¨◊f%˜Õ¥ìË¯˝V»UÒ‰ıkõ[n≤2lÓ/%oZºËKΩ ¿Í‰Î…˜≠ˇ8ª.Ω8MqèW_wÀÏ~Ÿùë({ÃŒ≤ç∞¡wbP˙	P–|{2òtz&´Ï—ÜK7È :∑’`¥˘|@¶¥w$g—;MﬁÖ√≥C%Hr€÷πΩŒj˜<>g∏‚Ô‘Iπ âaïäﬁÇ¯üAä&>D^∑ﬂ6ÒD™«^–Â¬™ﬁœ[É˚÷`1—_≤‰ÛﬂØìN´M_î˝õ4ûW‚›Zæÿ”Ñ≈‰¶∆«Daj# N»Müdk&iÅıﬂ&FæüPxèÚÃãºõaÙ∑Ωÿ≈ÖÉ„Ä˘‡ûqôπn˝Û'¥≠û-ï{›è2¥·H˚…C±o˝¯æÙZÖ‹Vò‡fêXèıoL"æ£ò∏Ïmz‰ºç≥Ω3·2·ã@¬ÀÁyÕè"ó≈Ú'l˚uZ^õº˛ˆıL€Î%æN·v≈≠„+Ì≤◊noÉ^G1Px≈Q
ãQ÷f—Ω«π0ü·^çˆEœ∞PÃÀß…Å&Ë/pSÙ!±®öÌi5Ê¢x5Í˛ˆæ√2,öxCåÃöô›|vnn|ƒÛπÍ,ËKÀ–Ód9û¢«∑.üù÷‰‘ âMı0™õ•ÂIãë®
Ø&/tÏPlc4j|Àèzv[ùÇ3Ò&lì&!FÜìwèãT(y∑üÅ¨›–ÿ˚¨À˚ì[{oE^s‡¡ÄÆx=.S0ë˘û¡Ï¿d&w⁄l~ªπ“Úwï˚–∑åæv∏ÀÚû5ïÎÒ3ª‰5w}óÀ/Ö·›k‹‚VÓ |ÔÙ=/∫€FVœ‰‰Wóﬂå˝HΩ?≥∑¯RrÍ¬∑}/Í+ó”gáW Œ§\Hü].Ù⁄|¶yëz≠¸ ·rÃúSg~6«€ì.7uWp+Î2w°¥ï◊ÜŸ≤ΩÀ?rÒ&æÅ¯ÅKÛA*WÀ–ÉÀ•¿_¶\*ËÃú.≈Jü µ≤™”≈˜nûÙï´È◊À„ª˚ µ¸ìÎÖΩA‘k´oL_àÀ+åwƒ'ôÅúZ	;|{é¨Fè#£f:ï¸o Ô¨õ¸x/@cnb≥ˆ0Lõ}K“av>ÛΩ¢|Ó'pıcVŸtwU¶˜Væ≠|gëÈ=IDVΩ["1” Ø™øªô ããØ*ﬂìDkzC≠UÔFí5Ω~Æ|7∑È›sıªI¨‹P|U˘û$òï9ûKyvΩ[ìÍ åk±Ë«ÅApåÃ÷ú·hNÛ„∆Õ÷‹˜Ω∂[3û˜Ÿöo}gnn±±xÊ∂ôÆy%å|vYüÄ/ÓGÿà.˜√eqæ‚u¡[ ˛ß4Öˆ§¨—Úx;yw|$íﬂ9Ë≤V∞€öq‰AHì∆´4˘ˆ´ì4Œë@˘≥Ï|◊:˚≥‹:Äﬁ›	v˘ü∂‰ Õm˜Ôê›óÉ’¡$Ï˛˛ÈOYHéaØ5¿ß¨m¿ñò¸u~UuªÚ€˛ñlÜvW€¸¥}hÀbhg∏Ö“¯Õ∑”|£¿Ïcä≈Ï‹Ñ“ ñ$P‘ö ÑvæÕ¶Ωgêf ÒN˚}¨?(y%8oS€COéì•üÔ·sÉª“⁄ÿÀö*ws·OÂ_B6.¥L∫q›SÔﬂ¡ö´*43◊™TRJˇ¶-í»73{ÃDñÀ/^á≠méí1»`D'Óî"›14b9≈dJƒò#*”ΩG›SÂKP3îße®ƒ˜˛BSi§∫]b¯–z¢~C55>¯RHO+<ZV¢ùå/¯hﬂëæJZŒ—Û¡ªB?G‰Ñ/CFQ5uë%;çùÊé€æ∑êhˆ5GÊçëû Ix=ÓÁÃ˜Œ6≤â ù∏∏±˛É5v˝∆⁄÷◊~X`^[^òsÓe”àÑ·µﬂòS£‹‚‡€{¥5K‘È–6â+ñô3Ÿ¶DA˜ÓÃWéãQ1Ò@≤'ñ‹õ9fVΩúCıRÌdæ©∫*Yf!Væ3Zño*ﬁDAN√ˇÂ∂Ëô˜nY•H…(w&Ô´∏µtΩ“ΩÈ”(7ﬁYq˜ƒ5+mû◊∑;Ánªﬂæh>∏…ËVá∆+[ì;¶i∆Â·9.œMø›(È9zááê[¬‚‹ô-A‰≈÷&ÓL‹Ï:?ˆ£π@vm®§ÑeL’o˘Ádtö≠HV8D7òª-¯<ÈL'UÏâQŒ˜I&ìí©öÛ…»É˝ÕªæÕoÊÿi
«6ÇÄâlÁ#Í≥‚Sòw°ø
‡2ΩÊ§òéyTR˘¢*mF» ÀJ=îT:\-’¯•*Rfñao±±L=w Y=≈î†d˘ ˜áçXÏéëò2«ë¡7n⁄»JîëÈv.≥õ#W‰N⁄ñC.ﬂé¶ŒNÇ»R‰êŒ	}Gö“ó:{tÆ†$©OzÇ_¡ë<Úhmê√îlïH©é^¥!øÀﬂºv–ﬂgkÕA˝ﬂ#àÆ≤Uß¢ãéqâÆµS—uÃEWuÑó“±d6¨T58ÃÊ›/ K∑.dŒ±$…Söw/A–∞I¸√l«ˇ&;Ò¸·T–œô0·‹_!Xˇ!¿Ó+âŸÚ•é‡8ï≤påA ÊK ![™ 	£IÂú◊ø§\6–DúZîáT,	[6öàD3Ò¿⁄ ŸºÚ/ªòC4ÌAáÌ˝ˇ:‚k¢Ì«1ıÍ¬Ì‘Ñ|°¬ÌÿYêß¬Õtº(õÛÏÿÔ-Ú∂æX:ÓwX≤w•Ü¸í mCX•¨ÿµ˜Êb¬†N–û≤Î
ßÛµ„Ω;”Ã"Ç“˛å7Ëáeº˝Ÿ<$Å€kTî£AºâF~S »æ“¶Q®°ÍÀeÀè–Ah3j¢ª§°£Z:*bf“c¸’zF®◊3% œ%9] ´!:JóÈ)•íË@áŒ
e/œ¬Újß† \Arß3º!=îï[a‹)àûC
$nxmf~~.ÇLVy°ıËûY4ìrXE÷d¡5
üeJ§¡·.wÈ–ÒiÓcˇL €Ò]„¯Ú(Wmáé2\â†≠˚ÃŸN9Ê√VÀÁ"å0'ÀXπ#(‡üôΩ»Î‘∑äÒ`ì,ù†Ü≈"⁄T‚±í9Aπ°$˘ππ3.É"Eõ{ìB∂Ò‘¶x°6¬Oóís¨ä™Gµ*ˆfŒ1@ÅeïÃ]∞#
ÌéÔbÀ∂wF¥1 ˚$ÂÜˇÖ;;|÷ÕÃ”ßTã'∆"ËC.„É>d
ù/øò?Üö]yŸW_eÁÛyƒ≤é^∆TÍG·]Ê÷ô€Äb˛÷Ë{Á«4sác_ø∞®§PæÄBEòAπ"
eÀ(d¸¿¯N/¿ˇk´á0ˇÌsÁ
#o©sWsÍqïPÂ&î-ôêÙº”∏—ëä|ÑSI°ëã˘ReGâ™Õá^·à#î+çph¯ˇëO≤Œtõâ=˛

2Ûπà¯DzNÅ‰√N˛VHXT.0Mbpâ‚
2Q˛EñWxÇ µ/î•¯ê¯:+‘RP9fé™í¬î`ÒÑ“å~é—˘ˇõÄxîxDg=«◊¶ü¿œUä-1ÔÉÛ%"öÎ5®∂–wëƒÈ•â\«±‹∆¥Úé
«UJüÁpM∂∆Åú /mïÉ‘~QÍ»∑ûV·q®u†¶Ôä∏ò8#; ©$ÿ¶õ^`…GÊ›ÛU∂n˙º‚P≈ÑEƒÀ<µü}Û¯K#o˙sÅpÜ+˛$ˇ.‡Mœ–4/”â,9ô§∑"“Z¢V<ˇ`©Ô#œ8æ˛+E÷ÒaÒ1ﬂ˙ŒºÓLÛÃm;!ÛIXBbf¶“.;≠ÛáÕ∑lç›ô| gB¡ÑB0K-h4i+ô‘)@!£†¬MT@jh5∫ù®Ö60R
Íæ˚Y:Î$ò	¸Bﬁ¿QXπüñ•+¬àrá/7ÍW…ˇ7\Õ¬ö^∞+"ˇ≥qFçïP√ˇ'vŒ¯ˆñ˜≥CŸwä„¶¸3˛ë˚ 6gäHﬁ‰Ó¥ÄÊYﬁŒ&,oE˘P#p∂ı∂bFÆåjbE*so‚‚˙ÍKz√ç˛ÀöPêﬂQÉ=^¬'Y y¶—˜˝˝€Çâãy1N¢‰˚Ñä+HgWPÅäÀ—Ÿ®ZÒwr\4=ïˆ›ºƒ¨ﬂq)ÑRÏƒ,E¬5N
._ÿ(‘[nQjópØI·/—˚◊∂Ï7˙u.|bXS¬◊D°éÀk?`µ™–‹úúíˆIó+WQo`‡Â√õ’˚·F∏ÁG+\E◊¶ÍA∑—4˝∏<,S ô†I¿Bÿœ˜≈˘"](π¿yèÓêJ%8ﬁ˚`îî- ñC√Î}Ø¸ƒÅJ$Ïƒ≈˚ ¿ß≤<eIGí>QN\Àú(s≠rgíGO‘%ØjŒ^”ú≠ﬁ\ÃÇÉr•≈ÀƒÀ(aµ[¯:∑Oh-Òíjãé
Å¥bFRNij¡4]ûF‘ÇcXS‹»¬;Jø∞ã,Òv∑ÏHÈ˝).0U é*&$∑ü`Æ≠]Œ⁄Gc◊	 UlWñ≤(iaÛiﬁÉ@Î∫‹$@XƒÙ(r«ÇŒo°ÿE6W\;N5 í;‹ö∆◊0ZÛ≠ZçˇV¬‡g£%JÜÄã§Q˚‚ø¸6Ô˛_°êãÌ¸Zr
<L¢´àîØË∞√–u√QXóØ»≈ÊV„P}„ÑÁÍÇ”Ω√≠◊÷ÆΩ`ÔÅ ≈Qã(ö"zÌ1ùyI{(£Ph∂7T˚6çSP≠Q‹È_ÀÓs¨äÂÿ≈-Ã≈*≥]"0XGNaPbÃr∏jê·Œ–H¢	¨„+πpQÕ{bLIà")¨yáç∏S¥ﬁ4/ì´ÚjE‹±ﬁx\‚≈!*Æáë√EŒãïd¸I3*Sµ©° ÉÊ˘ìÓ{ )	Dï{‹√›∂ˇN3Bñ¨`	}o·◊´ùö{ﬁ˘Ÿé(oô7‚Óœ~è-ØÆ≤´k?dkWÆo\˚—⁄õe[kÀ+oØ›`WÆ≠.o∞ÔÕ¶SÍ~sÅ≥∆ıC∏Ô˚W¬¶◊∆ö`º9Í 2Éw˘d∫êy1ó¢„ﬁòõõ=«?ÛI”å¬Ã∏(Eπ!?·€r~€π)œ».'Ò≠3∞∑Oäu¥ôÿr@∆˚ÃÒ4Æ∂e"¸˜Z∑ÛE<¥0?]¿%˜F ªëΩÌ{pµ∑ıÔ—õ9‚≥C5>íáìúÁ˝ŒI_HûrçÖn
ùoùrüº€÷R°%√úÜÅ˙¡nÀî-9ƒú7Ÿﬁó‚˙)"zHbø7;ÑÂyﬂƒ´‘òrœn˘‹˜#-Ã˘Ÿ÷m'¢d±â¸TjââîÀK$ˆ≈s	oDj0	m Ùê¶#~eì%®IÌ¡˜ç˘’å©wÈ!ü) ˜ë˝ˇﬂí•Vpíej4Ü
¯s•*8û}¸»¯ûPú¸…-Ì√Ø1h˜˜!báRë[©ï—·3{gáu|§nèY∏≥4 O•È˜Ω†◊'Ù„©âÁd∫Ÿ$ ôBPí[+k;ﬂ∞h˜‘ôJ1—ªÈ2V¶S.˚úæ7Ω¢ë≠ô˙√™V;≠ˇ6´W!%|QÎm7©PΩü ƒ‹f#
€ò∞À.áQá≠’¡µììÃC<ü'a 
”¯ªZ√ œ‹=«√~bÚ´1\≥»;ß¶2îêv	◊≥\:»|Œ∫x`óAGAõ&1fYxv‚‚˜Ã—=ãÿ‚Ú-r
w._∫r5¿`[2Láº∏|5]Õ^≠lÑì≠Æ(Aõuﬁ¬ÜTˇîañ±’®ŒÆx≠Ì¡ˆ b7ºV«3¿¨Ü]íπÕ§Œ=yÎ;˛¬ŒÇøs€ÑﬁœDÙ»öKØ£&Úg
≥Âåﬁä÷ÆXΩœçâIøHJÊ˛¢“/´œêw∞∫‹∫ÖÕ,ÆßBU>˛
W’™ª]¬âÕ≤a{ƒÂe]`Qï‚(äaôq	kL‰Æ∫–‡ûÓM∑‘6˝n¿ı˜Üﬂ Pû1≥ÛD.4C ¿Ï.?)kÜêÌ_†ô…-…?†*˙_d,‚*z"Õ¿á∏~6{>ò_¡O‰⁄†Û˚Æ¢òZ>ÓÖ$n;⁄Z∫ﬁ⁄è1/`•Âw¿ﬁˇ-'√◊ﬂFïˆ -≈¯«3Ü±Øe∂ ßRß≠u¯N\ƒë«/z!˙–òí+Ø˜:ƒõé∂
;h8÷£ˇ7:q›oÍ€Õo—:<¡ÎÜr∏û‡:KÁSπÈÇÆõ+·v¿∑©Wëà‚EØõ

¨◊‚#<ÓeÉ7mŸÃÕø6ø0Û∑x|ãñã·ÎÈ°†¨HÚD~,ıÒ!®f/ÉÖÄ¡dôYà*õe"17±).nûﬂ«~û: MQ∂\¬˝≤H∑7¯´2Ÿˆ‰`≈ßÌô˜πß¨'i˝Ü(Ä>Ω?WÔ⁄ˆHsbøvôöôØπÜ}ÁxMû¡Z™…≈∫¸nS@®T:	[¿∆ËØ. %≥?[-ÿ/rëìÛ;ô¸XŒ.é—Ω›Ümo‚xÜ≥k≈Î6¸∂F∏ô£»c	=»Ä`ØË<¨ı~tj»"5Ù;∏qløã›©Ì4úm'†â N0£”º∂ıköæ
%L%∞O Á^ƒº~…“ËÏ~ë0(6ÒQºﬁˆ!m'‡sÖLÜÑÄ}çÎìF@a‘ıøÍµ_:≤G‚D€‹Jt™ù\Ø±É€Ü≠C„Uyµg	Ú°Oì˝…ıg˛=ÒhòOõ-Û	¬¨¥<D,[L–Aﬁ;€$†ÕïxW7ÒÇÃF—ø·ÖÔ'Ä§˜)Läh!Hã˛˜0$ß"ü}1<|ä”ÉÂ¿@∆I…_h+Ë¯|
◊aù√……©ivvnnNüÚZ,æœUÄ ç$Ø≠Êµ´Ë6ú
 J	Ø3Ülà‹*0åà¨Ø˝êmn›\]ª∫≈V◊∂ñ◊76uÄõ{Åøtw7˚É&7V)∂˝R‚mŒún4 ˙! ù>Ô4mã7ãwÔ¸\6W\Ö3ˇg2HM~úõ1?’4`Åœô”œo§#ö≤zb∑+¡0˘xû`g$ıQ #v∆∏n∆ÏØG·¯ïƒ*6û2Aé∆	:“ø˘á¯.ÌÜQ+ v\}ïú¯ÑL8~9tﬂ@á∑¡nã¸_s,‹·Ê ˆËdÃz>W!]Ø=Õº_ ù†1ç‰Iª/j^XVyOÒ©l ‡@E~õ°ØK‡Ñ~†Á5»‰<E	ÂQB+ùÓètÆ4ÙjÈ §™‚-#∑F´˙v#Ø÷œÙ√ôs∏SQ:ª»¯∑8|ä¬+öºDr‹ê|`1ß„Œ˛Ö{√zb—QO, vz·,R◊fÜ>≈…îWÀRø™ìœQk¿ŒíËõ∆t·ÛAgó≈Q„ÇÌ˙æÎÎõŒ@ÑR∂k–86Jà;ﬁÌ¸}çÈÁS\f[8¨(Á@E/‰ÌÏŸ9ÛÙ.VãNÕÜA˘D¡áâ·(±ÊXaƒ&K ì—√Çñ7£É'.⁄z⁄ÃÙ¢◊r:RùE°P\Ë)2ê9%«é°©Zù2e∞ˇxÔˇ,ÚLÇÊ¸à´≥%Ú¡Ûó&LS€w`π)(ÕﬂÚÈvõ|r·mπaLgî“xÎ3≠ c3˘4íﬂêıKÂb:∂Ãœ°±¬Iw£∞NdI)≤ÚøNT†Ú»Ó?;MKÍ_˛Îsm«'ÊŒ£j˝Å`æÉ¸åÜ„R;õ\3ÑÉûeH∂·,<	Ké^˚+c——ŒùÇ^√úŸk¯a∏◊Î—{Ìøˇ≥°◊`Ø˝å:ÁWÂñ^M?û~∏GÌà¬ì=b©,bXZËã¢W∂π£Ë†Ze Ó+√ÚÙZ22*îÌ~Tòlxe(wíK¬tõÉ;é%€KW(≥f*E√ê§õ_bÀ¬‹gØ≤Ë>ãˆY–›	]m3]d.µßÛ6W
0WúT˙ƒòiRØò“"ç˝î‘4∫!,ƒQ∏b.˛Â·o~)µònı˛ZBà>Dô˜4…ÎÄ˙Ûüã-a∫°{®(º/»{ö€ˇÍÜ
ëÇ;ﬁö¢∆zÎ†´XBlXBÒÂ˝7Ç®]ﬂıãn?-r$ÀS'»d4√ÒôÈ˙î…Ë˘’'‘ﬂäPIA‘o…Ó&4Ê’pi≤ÄËÀb,ÈMº◊-&ﬁ64!”P{WgóÌ≠∞Â]ûêQR}ø•ÒXE∆¡Ü„Rq¥é.€4√ÌóπœüaˇÏˆ®õﬂ¬|ÿ£Íﬂ]|⁄À‹≈cWA|SÙKv:⁄¥≥l’Ôq√ø√;Ë» ±¶˘¿É˘Ù2é¡'IHK‘~;ÿ•›ﬂëtr$ûá˝ºŒœÔºåΩ¸Å˘ ü5FlQäSè_¥¸Aˇ®:Ωõ>˚]ÇR~Üb/)k8…´ç∆Ê˜¬ªé>ÀòõtoIO˚©ıÌf}ˇÛßˇÒﬁØ¯ˇJˇ=∂Ÿ‚üQúÑè¯4ì-≤‡7î÷˝'E?!;=E¡ä≠Iu∏Æ'ÅCíÙ©ıùÄ$—˛+)â'.{˝Êù√çó&éF2Ï‡C·/≥·ëÔw$ÍÇ¢.0D˘5´]]_ù √˙j≈Q®∏≈c¡W¿K<©‘—,Å+·Xù€∞Ú˝n[È0ıcqLñ hÆxf†eee”ÔÂvˇ1#Ëu±ÿIçãKd‹ˆcYGÆFdWè—;Ô∑—˝a–o%ÔÒ&ªS˚nâ¶Ó@?T
wºÛÂﬂd…∞ØTb>	M
Å•—gî}6Náù‚*ò◊ç;‚rawqfIf´˙±$Ú9›W8xıe€I‰sÉ”D&ïKÒ∆aMäA·{àçê¸ˆâ;$ˇ}RL£‰.ñvù<å,^«¨≥CnHBòı4È∞°ﬁ≠]Á}®—k§ß'sﬂ‚˙6ó…6’™‘Ù ™¥†TåÒ§Û™Ì{Mòô ∑ﬂım—^®ÜﬁHNê+-/j{w„÷æ7ÕæÔE]Ø◊¥Éi†dÏ˜Cﬁ›ã.0A‹AœV	`‘ÒWñ
Äæß|?Íx]ÕÁø&Ä|ß7FP6gó_ì˜Çp≥5YÄ”™uÓ◊å·ﬁf£ÜmËÛ9ö £˜ì6ôN;ÊZ-’kø˛£›Cñí§=…àg\õ∂ØY'Ÿ‰<⁄\√Êÿ”6ÿJπ…Œ8π…l¯,ÄÇb3´Ù}ÎcÌmÍ‘«≤‰WË¨oz¢˝Ó’-íB”vlﬁÇÏ¬,∂i≠∫Ê¯èÅÄH]/aàGÿÛ¯»oE«‘õèA˝/∞p’∫ø¢Éû;Ü1(´Äçƒ◊πoè0°^˙ùöB[+ÁfÂn§ﬂ>Zxıı!∏π¬˜ÁX¬Y§l^3Ê⁄LW@L”ïõ˘ §KñÿZÓ&Ô¡ú-ú˘"ÿ¡?aæGä≥5›hâkmQ?ºª7-çIÂ2a7·wØM6¯Àô≥–ÌiCÜÏÙB“í[I∫Är)F9∂Ü◊§¨ÃinVJ˜5€éÓÑ%y¯/ˇWk *sπI#±˝!"µ†îıÁ…èjb0AJ∏HX_e∞ÚNKUçÒ¨{1Ó0_‚ò˜%fÛk'„ãù=
∆Y…o.Ó,˙˛Ì¸v‚h¶œPNï◊lzÕ˘€e¶’o˛ßvZ˝IÒ¡‰˘#N#@ˇQÂ?¢mÇ9ï–ßù~51∞DâΩÓu€°◊úΩŒQˇL∫>L˛„8·‚ª˚ô…ü”d»ª˚G(ßÚ€sjIôiˆO4moi“<ë ÎœT¬ì*s≠è“¨‹<˛Eküw4i±’ÿ*∆65Fa¨H¡‹√*h•∆/Ñîbyı ˙ÊÊ˙µ´ÏÚµWÿÍµ^›∏∂º Á÷ıÎW∑,$5Ö^ÆaYC˙v˝˛-ƒ⁄l5;\b1Âc?e0;A◊oÚøq&ã-$Bíó&uq3í\A6z|ÑïpÂÖπRxD_Ù◊C¬ã`¯˘1	ˆcÚçÕ~#„{Oê$/˚ã“<ßVgOQ˜Ï-;ﬁ„üjú‚
2Væ∂<x;“<Y∆ºdn(ø≥‹-F⁄õ·>AˆiÊfÚ;ÀÕ›F€œﬂã8`~gÏÜß˘nH/òÕúì}∞8_Œı«Éø˛O∫©º>.öÏ=˛π¬DáÀr˝Bæ∂'≤ñ—ΩßùÛ=˛d∏É„lÔâ1ƒºeqå=ò˚Æ„u’Øádˇ5mnïóR⁄E”ÇÜØ>Ì«·vˆ·4¥ÔÀ¬ï∆üêÚ‚=l∆{öπ°;ÀÿÆ/Íàû<Ï˝o>˘"–0|ˇ~Ê© ◊∆«ÙE˘¢Ã˝ÚuÄ2w˙—xÔfÿËá—PQ»ÎÎo>˘'¢ÄÃ˜‘–Ô∆¥¬AÃu«éü}∆¯ﬁ_‚ù> ≈–è⁄ı	s›amJD}¢Ü™i µ}•üâä-Z˝C⁄«UÒà“ÔøGI&Ñ˛ nôoÚœŒµÍˇ  ˇˇÏ}ms‹∆ïÓ_È0)œ0Êºì≈Âæ(f]Idë≤ùΩZU	ú9XÕÊQ¥¢*«©Dµïªõ)Ÿ{m◊*©»¢"À≤ b˚ã˝WÙˆ'‹>˝4ÄÓ0/‰Pú)[$@w£˚ú”ßOü~e´ÑZZV∑ŸÀ$_Xn§û˜Ú)ˆZBU≈.*k€Î7õ-C,ö|ÉßÜpuX—˛/ﬂ\8é⁄·ä≤¢FÀ¡ÖZÃb˘Â~"¯ ¸H#Ÿ ’°æK53$	|√hS&˜u,Äû‚◊Ìwv=Gê¿.A†N/ä¥ Úv¬§˛=}öøúT<˜¬Õ∫ô{}¸47á{‚¯ò˛xF¸ù˛xN|Eº†?æ¶?^“ﬂ‰nIªä10”ÊÕì`FÁK7ÀÖã∑Js(ﬂÑVê∑[u≥g8ÆπŸıÿı0Ç¢¨«˜±Kjx§◊oÿ¨ﬂ!¿É{ΩâÜª=≠‚≥'∫NFA?≤ªãnØmy˘\!Ò#fÓÂ”0\µ8é¶¯Bn„
çíoVo=(Òﬂ+¬ÔÂ[nGWﬁ¨ÕQÃ˚eGZ¯@6Ü≤x«$çJÀË6€&YÖÜxX$ùŒ˙nÁ‡@∏[ÌFû±5ﬂhõÎÍ—f3ü#˜íP¡‡e‡Õr≥Ô≠n◊tﬁΩqÌj|~&ñœá6|õ§Q÷>©õ”pL‹¨E˘Ω!>Êm—ıé⁄f±g”Â&0J{Æ›Ó{fÃ§	˜ZMêî+˜ÓÈÓkô Çñ‚F…¿7ñt‰Nˇ≈ˆÏÊQë“8Øµ¨v3OÀòMÏ#\.õ’ÿ†¸û^Ï√wäºÙ¯x‡+q¿_m@Bçî‡ °É◊¯˘8ãÓ•ñ◊ëCë∑L£©ÿ¯"4ﬂó#ë∫B∞œ\nCíÿ∂∫wPÀ1˜WfZû◊sóK%G∏EJÒjÙ,˜Nß‘p›Í;˚F«j≠ºãªÈÌ]˚*}«Z>ƒ√˘œÛÂÚ?-‡ˇÒˇ Â∑ö6,∆—ä{hÙf`Zô!£Í∂LSÖÄw…m8Vœ#»I~cMº$6¨6~π&n¥eÊÚ•ΩUU‘§⁄VÅ—EìX}œeîÉ7E¸MÒÏ·]∑Ä]|k?:“BF„Œâ›¿~∞çM9âÚ®`wëÕTı]=£	˘QÀ†D‘∑uÁ¿Í.£≤˙ñ¬°πw«Ú
ƒ¥–6b£ìÀ»ºIø?≥:=€Òå®Ñ⁄3ƒ”™å´Ó¶fp\ÎCs’Áì_ø≤–Èd´ÀîJl.ïTyâHâ )Râi£>H?≈ΩπT&Ë0ù{). @SÊ‡…TòTØ§ﬁA◊)Báƒmò≈frøﬂ%ijy5ê∂ˇ·àõ¬‡#†ß*◊/ôº±Æ‰A J'gã·ô≈1;ˆ]ìŒ,¸˝`∆`3©û˝|-(`è˝jö»/Ëåﬂ•¥Z&óM6∑•ÛUbΩ—^,Ï;1«+úC8¿“$∆x¬bº	x1-pUz>&ˆΩAü€yÃﬂ∞{h’¿N}ösêv)œq¨¶ EIì{¢»>Iâ:ÑÃ—§2sL6u¬"qÎ≥Ä'fz+´í@∑‘–Ñi·Åï8_±X · °…éH∑/,Ÿìã|Kœè˝;Ÿ˙Ÿ‚T÷ßìt(ÕY659‘*¸`i|Çpπ(Uwèı[#ıå«LæßÏyßΩ¢€È]ﬂ"√π∫_ø`Â≥Ãéá§ñW"Ú≤;û&§òômñ~ä¸Â YDDØÔ¡eúN’Ü∫ƒ•UtÂi Õˆø∞Î™Zt´^YEÌíq∑UPƒÅvZ;M≈|UŒ»ïÕ.
Ó<2∫V‘†◊oª¶“J©HÜ„:N˜„·õøíˇÑÖWæuœ2EA¡K˛˛<⁄^ø¢L?◊‰Å§ÖË|8—Hπˇü–$X?4µröœ6¯©°´√ù,ªñ˘‡…6HQsæftÔ.nË|iÊ´‹ HëÆóPË,S1ãØ§8≠B∫P¸¢åx¥¬ßOñ§„SÉ&•wÕ®ﬂ6É»ÍoÂ˛}‘±∫Ôí÷ÅJ•
Q*Ù@T)˝zwBz>h¯öçWƒ‰∏U~∑e Ω °ÂµËöÖ†‰ûﬂ%VK∂"Ñ8õFÉ”X¸é@Gâ«Aõr2UY¸f´ñ€±⁄m£eq¶z˙ã’QæA|XE‹ÁòÚÕ
q«#n@Ëåè∆0˛^‰∑ƒ¯—ù&∫Ù
QRÚ˜K~X.zˇ˝R9Î™xGy1Ô˝™qÏNÈª%ëπÉûŒ·>~°$Úπ∏A4˝£vû‹=ÒH÷,ß—o∏˝ˆÅHI’~Ì∫¡»Ω{VÒ*∂∆¯üíŸºjﬂ[ô)£2õπkÑ&keÜ»+∫◊iw]\.ïãáµ¢Ìî∞M)óp…⁄™qÂ¸rÿÊ5p%ÿ°∆˝È¨ÃÃ/ÇpÏ;∏M¨;˘@lﬂ¡€ÚÛ}Ú—Ã……µïÖ⁄6*ïı˘•HmêuÃæY7∞•s?^Cµa™≠]ﬂÅø‚‡ÖU/fÓêûÅÌ∂e◊*Ø6èÆ.÷–|Ωøp]≈ﬂ,.¢´µˇı>˛ˆ«J◊wXµ®û<˝Ä]AÏUÿõD˙Ï—dXôπH‰±k}àÎ≠‡ø†Äzk
ÓÄû;⁄&Ω„
ççœ!‚ôÀªhÌR	»ÿ®•,çZ ÷¶kh7Uõ$√^ôß√˝Ã⁄«"ÉA)¢W⁄“‚(K„o
•R⁄%0AöÛT⁄ôÉù?"„ánÄH¨kéˇ˙e&Ú*$P)∞bZïÿ]ì0*‹dq+∂®@Úñ—åfeFÈV˘˝±Ôä6zßàóÆ–≈ø·I∫⁄e†Ñ#[Á+◊⁄t¸Z}'V„æX'÷áÙ˛B‘´qï}Ó»(é∏˜6hÔ1‚7l¨Í;êQªqÌÆΩªµu5©3™⁄ŒàáwnV*¸∞õw≤BdPú _Ü>#Óﬂ∑ß';=<'1˛B>,$Ù\˘åCè?`ji^ìæ˜îhì‘yx t_ö•°Ë‰ñŸÓ!4Ì„„ßØèè_ø$ˇ>+º>~AæzA˛~˛˙¯‹°°{é¸∑øø>˛?9= 0@b«¶1¿7Ï^aá‰(‘{∏È¬úÑÒá`"Y]≈ÍÿØc ß8∂Ó≠ŒÉSÃW≤Å´ﬂƒæ†ŸÙ◊ `JÊÖ»DöCª∫ÿy@“Q™h÷∆	˙%M=H‚HÚ_< ï$)&Lï$IqêDZòí¯G«ò§®Ï3-+Gzúgi©üy©˛Ôµm "–o∞÷M:√≠ØÊíøÿˆÎÜ9®D<ÜæçÉM}>g∫*µgËÈ'AëµœÎU9yçæâ/€¿¿ÃVÎ˚∂›„»∏rO≈)&{∫w6¿(é‘A@0î!h-·"Ç∞â$≈ıƒC∫1RÓw$çÀ†√≤f;,"yÖb´yÓ‰]¿Œƒ…∫8ƒP€∂]3=Ä°>fÇÁQ£çÆ”‹ÿÏ{gô§PÅ!ã›€Kr‹SÌ“T¥;g§úLP‹$’∞˘ cÙà;>KÀ≥◊O?.§1P&¬™Å]ÎËvw”&Y®¢¿Ïà¨]I6ÂI@©6∏MRLBSJï02qåÉ	˘ ﬂ)¸≥ÒùûR™ ¸Òuí;5Ñ¶*R)"Œ<K¿>3+ïfÿTSà≤\údP%Bû∏ò_”Á~ƒπ˘€'íe–√h9Ö»»÷Áz±„¿HUbX®EuLüO@HÌUçW*(1‰f£∑êÑ%([Ã#ˆ˚†V4≠‹*y û4Ú5úÑ≈dH`ÃLÔÓ+N1‰•’¥˜¥v&çmÕj|OrœˆœŸ2˘«U√óıÒ…éqÑt4√hÀ&ÈH«Ë∂faÌ/ùì jÃRë∆UãàB˜£M†…ÍƒÈ≠O•™Õáì)ó‹HÙ‚X‰{dT–ML∂Aíä£å¶b"ÏPh4ı‚1∞UzŒ¡:~úÏëãúKó:í¡}2üúƒ8FÉ∞oÍ‹AáòbŒËµ·õBk0}∞π„˙Ê:2∞X¨o≠Nù◊7Ày•bπ.∞XNàÌ€òÜ(Ë®?@áı3Ò´ ˇÈ∂F◊≠Êƒ{∞µ"¢Ã;Sˆ¯Ô‘ÉU∞EM∂Uíä°åej"¨œ‘Éı?È<X:íÇÀ2b 2Ág|œãgKáûz∂?ù∞πdÍ—æ±-«©G{Œ<Zü$q‚M–|—ß&¢á&∑ˆâ-zŒûd€D<”ˆË¯9ıgc‰NÀ‚°›o∏Ëb”ıp≤ÌîT0xàÒ´B>· Æ6*4Å~ÚxlZ(◊Ù˘]¶…	…∑c√4∂h€v=DŒ¡√^ıçñ—5œuÿ‡≤∫Û]YMQm≤M;*åm–¡yˆDÆáíç#ï:äÊ–0–uı^Ω—÷„Ka"9s„Ë§C(OÃ£«Óv≤ıLé]ìõMﬂÓpz‚dÏ˛BqD^lÔØ3*>À;:GﬁÁW‘˚<ÊZ6·ûFDYærÿısµ‡•ëå…;E&b†u|ŒÜW˚ò'[=e‚±€¸4c±à|vz~xÛll∆å…|º†Ê„˜SÍkû≠¸»T:ª3—%gö¸£mÇ2àJæúLàßr±˛Ô9Âs>õ<öÏQ1√(gr˝ÀkÒ!ùêô%4§zc∫}ì8Â%Ë:€‰9˝ŸË#⁄E7l¥—ÓÃ	={Ò5ù%æÅÿeú8ò¯1%«`~Ø<ÑÖ\˘ú¨ SôïÒï¡(≠§ó>“ q”Y*4G&2o—?v≤
ÕŸ^Ìº‰Ÿœ"¡2ë∞$ŸƒèP¸«œÈ‚|≤'∂‘íbŒfÙ¨£NRQUfgœE>**‘ßçäâ¿ ˝¶Õå"≠∑‹C≤Å≥‰dd!çùªHÌúe˜]éx6ô≥‚72cc{ßxwO˝˝ˇ|<»ÍÍTåë"PèàçÕ…‚˚!]…g€˝–¿v€lòh’æáÚ˙≈1æˆˇHÛ?%°NÕáˇ´éåèh«+ƒbhÃ ˚î1sÀ•˘ HR∑4î!_á@cøPˆèÈá 
π@çhg„ìTØyêFb_*ıu2°∏F
àkéC kG¿≈è0öì?(@8√ËÅ˚∏ÖIØ∂U˝)c’q˘Ab≈lü?ê:èV‚
˝Ç∂ÇÀß–£{∑?·ıµY,ƒN=J•dRﬁ«œ©[~Èú/	Ïéœ©Ì£ÂÚCàóBá—˘‰è˛;≠û°Áü‡{
ÃõÂ•˘I&Oxïl˜~AbÓ	¢˘'∏*ZÓêÒb/§W%L[ﬂpM%!Ï„«à°ˇ≤‰¡ä‚hõE?¶ÀÊãá≠Î[Ê©ëŸu¿~õK~Öê§^:Ñü∞Ì:!ÌÏ9ü¬æ§Û¯ü}ÙŸÔ¯\«	∑	8-©˝òﬁ˚àí–¢`B`mxƒ£‚œÈ;|A∆4Ò
‰»7ãﬂê‚>•è»ﬂJD@{B^Ïπü™ø<ßd˜	¢‘õ|>j8Ê„¯Ù.n–¯u⁄öcÈˇ·5ˇ3>∆œƒÖ5«æ∏˚Ω °içYÔ%∏ëª÷A◊˙éâv€∂ó£1¥Hfi®”≥8käp!"R˘B9-zà
'	¢*∆ú"ùÑ¡m He>uûë”Î∞ŒT%ÆvÕCD~ô-zˆÊÓ[~ŒrŒ¬πŸõÂ[√∆ŸËª^ñ§˙ézY:éæØU˝æoA\%˝Î¶:ßZoÊ’õﬁ7:áq<=2$jKj∫bµ€@∫m;	*)Vf«tåvìx⁄ÒµøJ°Gº:‡Ã3Øxª*Ÿ÷åCG>ïÒ89õì·Úd/	û˚,4Í$g¡	BVæ\”h¥ÿ¿U*±Ÿó∏>√8‚µ¡qÇUx”è|gì˘0„m“∞ìW–¸Ïnåµ˘Y∑ ÇÊ¶€•Òeê∫Í/˝EM€¯3⁄Pwë»”P> 9vLJ‡ûå«·=ÏíÈè©Í@Sπo©QC≥L}Ûeò~ŒÛWyÃ%è√ÃMÏ®æ6 /Œ€ˆuãÉùsî_>Ddw€GiY¯B¡3><^<~ì6=ÔûÜEix•0È"·’%´VÑ?)¬Æƒ–H›éå@I.2÷´ _Àü»!>@Ë¨»0J£øjb%πúHÑ*ˆï@ü˘`6è˚‹ˇdÏ˝ÕçP}˝⁄Ê¿\_GÎ[\ø∫U_G%¥Ω≥y˝Ä∞◊ØÜ§Mú˚º5√i¢∑ﬁB˘8/9%∑ffùt‡/ß§ˆ´|óñ¶¶óßê˛û ÂÔÈ”
ˆy(Éåÿœÿà˘w≤ôë°•o≥'ÃN¯enéxn‡ƒèÈègÙ«ﬂÈèÁÙ«WÙ«˙„k˙„%˝ÒMÓV∏"i[äéŸ√mÊK7ÀÖã∑Js(ﬂÑVê>[u≥g8ÆπŸıÿı[Y…ÊÈêéûhœE∏‡ÇIÔòíÕ´ndKü)Ÿºx) õ˜ëœ˙◊_ƒ—)≤Ã≥;7aJy£yË…ÇÈö“´€3%§GßHHˇØSF˙ï=e§>SF˙…b§?<ÙÓù£ÅhË·9-ΩîÉÂ^{ÊÚˇ<˛œØtZgõãﬁè-Ω‡h^!®ï!Èôcz6»ËüÛù5ëπ·ïüÈY_ÂÉwûERÍn$Ê+Hz5Ò…Ωmá—7¬‘"∞¸X∞ù#¬Oﬂ:ÕsDCO6Ÿ)Ëô˛Ï„¯ˇfJ?üdRS—jê»H/Ω:8!=ëå,dÙ1*zabI1‡)XÎœÈ<±–hñﬂ	|z#dõW˚“óéì≠á√hÚö^M]X≥÷3∂5∞ –x∑≥‹øC§∞˜„·Íl]N÷'“πK€%'∂Øñ;ù‹_ÍÁ~^&¸M-X„◊(˝r=êIº\n‰!{,‡p¢¯éûÔ^ËLÙùıD_ÃÓÀ;*‹,À5ÏëSU*òwÒeóÙîÿk∏„=¢ò™)DÂ∑-JÈq˘vâözM‹"‰˚˛]ÿFnk¸âIÎ•=+¨»‘™úô]JÂH±¸{Ê˜Ø]Ò•js2`´Áâib∆ºú£ÿókıXHàä´ëë9±¥"±zh2˙o£;Ñ ì„ƒr)º›5ªi∂YüÎX%ˇ∞‹Å<VÚI∏†M ìΩ¯®ôq—oπíXó—€Ñ‚ı%'~˝ÜørﬁW ˚vw»6^Àp⁄∆∑udÃ°ˇe8]£◊Í∑≠9Ñ/‡â
ø`óNéÈ‚íóñ ïãï Re±ºTÀÓøJ{U‹–'˝^(ı~ a˚íeÛí¸äeƒy€Ä=ót‚Cíô„ˇ˚'“°ú/˜9¿∑@~MÓ’dˆW+(˛%l¢Aoo∏0Z¿8ªå™ÂJ¥±πy}UjÛãükXp·⁄“¸ ˝´z"&Òx!‰NáùN™lˇ∫ˆ≥‘ŸÍCqÅíû‚ï]-F∫{d∂¡Âòœ¨9Zá∑@Sc®ˆxF≈+!˚Íí.ë»ÊGFJÿM.†wÎWØ˛e£æsı_–∆ØÎ◊T5√£é-$ÃÑ≠Û™qd˜==QÁ@ 'ã$˝FB‰Ëû.¡Xµ^ÅπçÒråÏÍÙ;ôÚ%hÖ•tÈèƒõîxâ~∞ê.∏mÙ¥≥'è´ÜÔqt	C§Òr$1C˚í◊-jËz7	U·a°R™©TŒôπ,”ï8´e46¬Œd-ÉƒœàúíÀ3∞©ÿ«Lˇ"Àq⁄eÏÉ˛Çz˜3°r|á3±£5∫qB|&¬K˘ü¬„¥π>¸(ÒI`âøÉî%÷Ì»äºû´aäúA/—îæÈ)/:8Ùl	Ìödgj,zîÇ=÷˛€íˆˇ‚~(≠)añ£äÚí$óæ‡ÉPÃﬁ∆}põˆÅ‰R.éuéÏ^ÏÏm˝1"YÁGˆ8ÿApå6H}E%è`P(âÒXoﬂ>iŒ*¡!ÁÀ:Hé∏–q·á‘«d
‚*$û$>_cœb&¢¢Ï◊ÿ£Çt °◊~DuΩØäo ﬂx„O;$ŒÉÏŸ√πÚÛëçuiîØâñ&ÍÄ°lπVÖ≥íK±µ•∞∞-UCõŒ—ù|Æ·µP∫-røèbÉ‹#}ıN$I"ˆVÁÄ§¡)
xÄå∂'πH|‚€ì•[Òÿ{ˇ¡◊ºüfc	>≥X#⁄Îh±*1?≈–Ü6Ûy¨=ŸPºÁF∑–x2A4ˆX™îﬁò(ç7ﬂºq'Ÿâ±ÇöﬂÑ`FeÊÚÓ⁄µ]º‰5:ΩTÿCI«84'nìNx»Àƒ‚iÛ·y\eS·Â|CßwıÀÁLÈﬂsºmj∞ l¯P&µ<§á5¯2c8ﬂBÕﬂ∆=£cQ†\à õÕ~€üæOÙÃEW-WÕR 9	4™öáK≠yuƒ9:r—ºÍÿ&HpµÃŒë?ï'[ éB˙òDX?&∏Å~ÅHøc·.|˝∫x«Ó{V® xÎˆÛ ˛K1˝®êÌ√‘¡°Kû:ßõﬂ·D¢´Aö‘]™I#|/A„Ù$∏i≠®€Bœ,BÏh^Ó1ÖŒH“‹n SÒZC‘Vï◊¶°@PËNâ∫-lcÃ°˘WÚù"¿§ÍÀÉ‰Jı><≠mç≠„¬bøPØöß∫ÿl≥Mf&∫Ù1W8ﬂJ˝⁄ B©|°ëÓ.´¢<yáá«…Ó
·Ü"˘d(ËZT¡∂v€¿ëK„:´ﬁ+êÅ–+ñóqü÷Ø°*W‡◊ÌkIu$:Á#È˙≈ìÍ˙gt«Jﬁı’nÛ¸u˝“∏∫˛!Èw˚Ç⁄V˛Ó|ÀmùO…øxÇ›/~ﬁ˝ÁQ˙´Âquˇß>™È‰kÄˆ÷¡˛_√=O›[W˜~œPπò;˜7ﬂ©˙ÇHˆS“ıø2ª∞6¿+ÀÏ6Ã≥–˝	/mº+i±∑Ÿu=ßOv\Ç öiaá]}ñ≥…,$ﬂJ†~R^:f”ÍwÑ¸-©&äj£^JÜ≤l‘1’–≤#ıbc†T¸ß>ÿÖœ¸ç/§ˇ øÛ°Ê^q@:ö‚Òåá‘!äus°QÛlÑ≠	Z„ôˆÓÚ`©I©_Y#»ÔêcÙ≈ ÜRó±B2π~"›¿íàû˜Ë#Ô0pB¸Ø<w%‹œè8|∫$«RÀ¸å3Y€xˆáûâÇ ¸‡„í!˘Úâ∂+ -∂àÆ€¬àCbà&2 ˝`ôlƒ"Ñx¸Ã{Fµ g˚–ÚZê”sL_ÑØeπBözÒîG¯YQ9¥üæïÎÓ 3Ú!
}$ T>ÛSï˛*l)=Ñ¨»<Od{)å¸c?˘o)Æˇô«ﬂ>£ï>≤÷û‚JfÉs.ø˙#ôY8ﬁom>˛˚öûå>(–—€Ûï˙ªLe≤ÏTã®éeõ§¶ãÏ}D2åªk5P”ºk5LÂ›é·x=ÿXqÁ˘„–-”ù%‰∆˝Æ—«í‰XbYÉ√ée¥]˘°î4Ø}ÑeÃnY{ñgû∫L˝]!S¥ì_Òﬁ˝ö
ò?¢ ≈à¬ˇ˝é¶,~Eìf‚#Ö«ÊÖÌıÇß|Cç$*¯ø—6|ÔCÇ˛;i©üS…Që|Lÿ§aÆ√ç:x¶Cé	«À…⁄çFøwÊ¡r˜nÚHñæ··ÅÙ`JƒOT ø%Ïô˚êDGåI√Ót¿«!ß}>n•t¸xµéÂÚƒè,^D•>p¡èm†¯	NÉ?∑´™Vº¨$¨,?®IP"I¥ôvOÑÃ"«->›'GŒ¢ôÕ˛¨„¯∫…{oN˛¿èã≤ÔSﬁÅˇHFcn÷]Î¿jûÌLf/∆6BàB ¨?FOQHH∫óµÌÿ˚E¥Ó—é—Í›å;m#=±hÂ˛\¯]#ò≈⁄di5ù∞aı∞!+!ÿ€|Äß»q√vú¢∆ù j\}}]ﬂ¯Äc q˘›µùççÎªÔn›@ıµµ˜vÍ76¬‚vﬂrÎÕ&K√Ωf7çˆVO◊Ä'‘= ísTPRBc‘î–’¥–I¬G‰O“èjPå∏j/“Sor\åJÉfã°ÉêACs*xÿñ"tNÔRQR¡)dáRPÕ†˛Z€•UÊ`e≈úX´K±w¡{≈ÛAª≥%æ<®ÕuÏ|7pªE©ÍJhï¡W⁄Œ∏Â‹îÈY~/·‰lê!˘ ¬ŒËQqæù™?ˇ-ÜÏ¥á…„fR:|©à´L†‹ “3•êjKÚ êT{<ı˘ÔEﬂ[§sœ~cøπo Ë•ÛˆÓ∆⁄çÕ≠Î®≤ÏüZ5\Ïâmb	K5q”ZÀ˚∆˛“- K
€ïõ?7´˚UsˇVËà7Ä‰vÀ	#	62]≈ìjy°±PÄ“’…ï¢‰ıT	*≤Êd:¬E9-TŸC‚,ö<’Ô`áÜ@%È≤˙D≥»58‚Xc—\4À°SØU±<õÌ∞ŒTÁ)/F»ô—Wi4õF≥rk∞,≈àiƒÇY^â/-ZÃ	[ 6_9ü«˙µw´§Õ†æo¯ñê¿á3˚Ωù"Ì4H:’î .e.@+cviRnÈ•ÑM¶˜ò»äøà«}1¢õâ	üätO?\dò)£e_¶≠H¡ÓßÎ	M“¢’Ìı=MπﬁQèxãm¸˝çÜŸÛVf¨éq`ñ~©ªUÏO"v∫õÒ$‹¬ΩâgaSù+õ†±Bc—
2ãÿÕ:0Ω"¸ÌæSºYæ•œ£ò¨po|˝€§ı
~à>©ØÄ7–°nÂ
xxá|°Ñ}0@IÃÃã√]i\h·Ÿ¸}T,R∆9$j·2"Â≥~|ßËònøÌ!√Â8”fõ¨¿åΩ¸®ªÎÜgº∑s5MgÍdIëLËG©&óJƒ–+/ÎîXÊ¸S9MdûπöáÅÓÿùuQ;SﬁØp¢äbìª€…@„¨d˜— #
O«&Tz2?f•ó≈0¿«ò†≈ 9x}c2s˘ó¨«∆9µIÑ‚u¶ÎÆ—Óõ±I¶0r*ã—KßπºËÂ¿Úë6ÄñÍ™#Ë-‹Õ¶≥¬OÛ‚ÖÚHi«Ÿ›ª$g>ZöÃ|e⁄˜\¬–YrdÄÄN7‚Á–2ÌæG(ê¶F˝.ì†%Ñù-‡«|EÍ¿t.°]≤œË∆ÓUâ‚0e÷øÍ1®â_vV=ôÅèxÚ
º÷è¥{$‰Bf8–%lÁb^›©˘Ã'¨dÒ’K%ZRÜ ∏$/04¡ßˇMj¯åÊ•F€1@ãºÜER√wÏË/£)˛/˛)˛{æÁÒdd/∞ƒkX"5¸>†UyIœ» è®ÏJô^)ì“üí-†¡J«FàXó3oΩ˘˝©õ]év0z£ÀJûö\ÈpEMÓ.>ﬁiËY=™zlÙ %Æ%Æ∆K¸dÄ◊Ç◊‚%~zéÙ_Ä 8#´àÚ”è¡VÖµí!ΩJi∞¶ÀòÑ	ÂÖAˆ	B°Ñö6î0åéT·ò)$uÆZé◊JäEùiöZ!;,ª26ÌΩ1h!.u≥uT…§ÑU®Qk¡5£mvõFË`µ]Léúj¯˝hB≈Q°å:G>75¡[èlÁHPã5	b8Nå~˝
˜ùÈ$ÜXın´\¸H—jπP˛i±ŸT`ÊíQ∏´5êª™)úµÉ◊∞6Õ\ÜâÎ"ßœ\ÿ≥Cä£?„æ>˛(sô[^6’…æ“~&R`ø'ï´˜QœÑÍÆ∂mªâ~Ö•∞áÚÙmçˆÏXTy™"5ç\ùÉ¢ß*™©t˝ÌôÀı∑≥?V¿è2?∂äk[Õ^€*Æm5{m[∏∂≠Ïµm·⁄∂≤◊Váó´vuxΩzÚ˚•≤J )÷Èç’hMxÔh«<∞\|3ÈôÎvëòoˇîÁK?z‰”–5˛ˆc≠Y”zÒ…ÀiÖÕÉ6ãMVŸ¢A_¥¸,ˆ/¥†Æ\@Ñ˝Xic&¡Vøîñ˙‡‡iá’e¥Mà›I…„9≠ßòx(;¥¢”——&*Ç0»zD¶ï¿“‡W^∫ „pÛ˘∞„V‡'QüD¿ûæÁ˚4>˛ |BŒvQGOz(oà0I(ù≤öòNy≈ Æ(°√KÕ“í§raπô‰F )ÙE9ü¥≤à:Sæ∑W®*˘œtªë–iã$]í√ôö)≥˜Xß≥ÕH&C Iµµê:⁄ú%´µ&*Öy+ı9ßlò3≈±qßAí#˛'u5g$µïÆHg¯ƒÚvà$§…o’d∏
Öå"¡5|™>5UëÊ*D¨“ßπ*s‰ñ‚yÆeÏ9@¶´>◊UõÌö"õ6„5SŒk∆¨◊ÃyØ√fæf…}:âu»4÷¥â¨Ç≤ç"è5E&Î‡π¨˙lVm>´>jùú)†F"NLj≠ÄwEß»úõú’:Ëélç€
≠…V.Aı»î⁄Âßê9Ë1ï˜IG˚!~õƒQ…`¶íˆoïy®§±I)vÉÁ¢˙≈g›Dä,:˝NMJGU,?Ax¯©Â3±¸§≠NÎîh¢@L◊Ö’ÆLûs™”hDbNì^‘É∂åQ‡ÉJ≤ã˝$àÔhrùÙŸNÍ|ßûﬂ{i“âbÂÏö¿0Aq‰"sü1∂®ˇÇ µºHµ#$©bµÔ‚ûpÒ<ƒ#ï¯pi/Ú·Ò„Ak∏a≤Ûƒ~·ôQ!îåÅJ^∑ûç¶?yÁêrˇ?I”+˙ä·t†ÕÙ'œCˇ›ç—ˆ)9!MÏLY‘ÎõÎ‰=XÕq:VsHﬂ°RFX–√÷Ù3	ÊwÍ=à≤~Õﬁ≥ÿv~îIirtÄ6råj@+R ï_ÛœT–ô“Ç,ôâ≤¶ß»N$è%´K⁄,E¯ËTf]üØü°4f={Ê"|§ŸãDÙù¬“I ˇ¿Øy¯§Jbî¶0÷»Fäâ4çë4"~n‰Po–i∫6¬˝3r"¯“uÉÕ˙úŒ‡|◊u∫}6∆Ì3~P$º{Ê{Jõg{õgB!”Õ≥ÈÊôÊ3›<”|“yRÇ≤M7œî7ΩyF'»ÈÊô–˛ÊY4OkÇ6œ®våmÛ,(~»eøﬂ©”Õ3ˆô¸Ö`¬õgQu8°Õ36åwÛ,Z…tÛL3î„Ÿ<{◊ÓªÊ°µè%–ˇï»›ßd#Á≤SÙ∑Awµ¶[s⁄íßª]
_`2vªÿ|<¶›.øÙÈn◊yûÓ'|∑ãJÈwªƒ
¶ª]ÁUﬁ§›.*—„€ÌÚÀüÓvI?Á`∑+ıÖ4k¸†"zã7‡U≈…Q$$úÒƒZQ˛Æ£‰K8ã8HøÍN”2∫$óÑÒ†7¢i¸¢kÑ>¿6(ÆãPx6√Ú1xG%◊ﬁåC—Jc{& L÷Äaukü ≈ØMVõ¨7p”∂ˆG.Â¥ÿ!‰õtôΩ?ïkŸµIëÎ‚Ì⁄]BPç|€]
ì3òÊGcÅÏqX>¿-‡π4À*ô¬¯DÜoD0>4Òê' FŒÌd«˘≤ii“L†Ã•Ω◊m Œ˘!Ñê·_°ËóÉΩÍ∞ñ≤_HyåË<saªñtlóÈOá˛c*PÙSƒ!S^H·˝û‚èoÛX¯lî(∫cÅ˚·Óß>í6§oõ=äñ5~6	ˆtºP?CØ¯Ù$:„Cl;¶Î`,^¯77…IÄÇ∞kh(Ìóc∫+˜´Í©XÆ=⁄÷äë{·‚áã	ﬂ+¥8\Ài˘…FOàÌ,˚≈€¶”1∫ì ’º!cìÎHCK∂ﬂsÁW∂S_HTù_Ê2à÷Mœ∞⁄ÓõNù/∆ﬁ|’øÛ≈?“8˛Íœàs‚ºú‚/∏;¶–Îôàﬂ∑⁄m„¿O∫°=tö°©ª¥A#∑Y¨‹!LÔ™i‰u‚gb€ı–P∫S¡˛+œ˘˙/Ù}:Ç›√ç¢m˝|Ï=ÑxìN≥ißME|“E¸ñÉ˜ó˛DwZíÌA[F.‘§‘!‰ôÙ–Tàe◊&Eà◊⁄jx+RÀø=E9n≤Êå\îy¡CH≥ﬂUS”<ÈRΩc∂≠~Ä‚òoÑùöCÌ∞Êåcå<ÑTìL”Ô©÷H~	Ò§∫√ÙıÒo5˚S=ê]õ=∏nP÷À;‚dîÁ#8¡ˆ‚NG'∫A”FÆBŸgo∑x¸2õ˙Bö8◊¬2⁄∆ùnŸ}m4˚ç‰88ŸP◊BQˆ¢tõ¸¯cÅ˚E@≥~¸Q¸§–èÁ=ﬁÂ˜‚á∂Ò?fS“ë‡ãæíDüRÙ ∑õ4yõT¥‰abºW… MßeŸµâ” BU´ñ¸W$Lûth¨-ãºC¡£w >Ô“Æº0π˘;˛¯Ì6Z∂›°”eö@πzû
Îèo…ÅﬁáÈsy«í’íLﬂ`ƒ=A¡gÛ¯]Ï“.÷Ö-ﬁ=û¡K˛-Öëkmt≈∂ib_ùÿØˆ=œÓ ∂v£z÷+,Ú~Û‚»mq–6é¸evõƒ≠´â`\é’ΩS(KÙÙ“iê§∞∂≠∆,Ü\
7›@…€mıÃn~ﬂhª¶T¿ƒóπáﬂ&|Vå·éü~aÅ˘‘`≤‡;0ay"_W•fµ8îóß∞êiqŒtÚ#ù5£€0€—°Ω<D˜Àõ NÍgQËL¸Zƒ8˛Ê7(zÕŸE◊§"*πs&Kòî\'™°≠å∂Èx˘66nheeÂˆ∫9Ù 3˝òn˙?¢~;÷—+Å¸b–ü1⁄µ¸/gÒï?kˇnÍ°`ÌÊûS˚¬V˘o…4Ga÷x˙7ø÷ﬂB¡_>…°eî€nõ∞§€∑∞LÄ\8ÊˇÈ[^u@ï˚ñŸnb◊õ‰¡@oŒ—ï…⁄•]8G˝4⁄cs»¿)O?-ÊîàUéÈıùÆ¸™‹öÀ*ï–öc¬aYÉ@àπt‡p˘¨.Úg(Úæõç2ZQÜ¡Ì›ÎÖ_‹«v©åﬁF◊ØU‹o€∂ì'øbk⁄,∆øDÒ≥nœ©
ÎQ±®`“ﬂ)* ñø\NY@óú’RhÑÚ©]J©îE˘”òxÉô®ûsà+´‘±bœ¿W¨+’9î+ÁfïPöb•ñ5ªòÉN”ﬂS)U‹mX&∂`D~evM«h´˚:|>Ns2OR}¿˙Bîù∞,˘jí\+ñÜÆ∫Z™eÍÅÛ˚
(≥Ú]¸æÜKÖ^]-#yóR ìw äru≥EVi%ó5)gÎmu)F≥c‰8˝æLÙ~Àœ={swkó¿Ï·ø‹^€ÚÚππŸõÂ[ “⁄ˆÅ’•=∞å'¬æ∫øTﬂÉq±{GFç†r„®z¢	á–£{xˆû∫ﬂ‚§¥I¥∏ ≤D™!•<*ü±÷î(o	uã¿U	‹3	Ì–îΩ!©?¿Ç´XízCÚ¨%°^~Ù@ñüPª¢ÒbB÷%“Ë_I®]ˆ¨E=’∞„ñ“√ùÍ	Cz¨-≈;ıLIs◊&Ÿ´Kâ%'§5+KÚS˝‰©ÖÍiT ‰-Â”,_Eñ£|&HP§"ËFëmæ*∂{5nç∞?•ﬁ”ç6è´b‘⁄gwdø†}íá$îa≈”˛Ií≈ÀPVéÎáAnûÍà‹öUÄß¨]X"ooÌﬁ nΩâ]]¿Úºûª\*πÏx— ñ\,z®ÎØ¥ãªS«+ˆZ=‡q^ h•ï1∏‡&áÔe˜™¿{˜õE£á◊‘Õ|º¡‹ú⁄GL.\·x	‹N~ûxàÒ|«1πÊ«À`íK8›¡Q˚ó…u˜¿¡TWÃªÚb`].ÆZÆh◊≈·J=W{XµîøÖÈ5Z˘”´˜¨˜úv>W2zVâïÈ‚ıÑ≤)”kŸMX cıP˙°{v€°}˘ÍÒ¡¨ÙklUÕnœ:¯i∫Ë≈?‹‚øπv¸Zx™âuFèZM!ò}G≠i∑Õ¢È8x}ö[5w¿Ñ:ëãÀx†b-¶¥◊rÏC¢€§@x†ÿ¡$ùÉ‰å%^ ê’ã}05Î(Yı¯ïxËÜ"©SyO·UB>«‘¸ôM‰ˆ¸ö`Né‰m†=÷ìıÌÕÑûSµ™aÄ‘‚ûJ”™t„áQ6B˛Ωj“©„ïWwóæÙ5˜ ≈R¥ıt˚1bfP‰ÖØH==˛Çæ¢ªˇ|o„KöWäGBB[Ù¶«ı	-Äûï˘î«µHÙÏæ˘Ò9˛˜g∑ÜHé8Æ∏Ìx®5ÔÄÁM,KAL…&ßÿaÏ˜◊T‘ì•ÁÒlΩÉ=Q<á‚äﬂXÊª∏ÅäZ‚õ)J´ÃﬁrYoÚ'C›M~îH}K0ØÎÓ"kgıe¢Pﬂ!!4w≈ó‹öó˙^w_àc[}[àM ©¥§éWÏâ-÷”âÕKuØ∞∫Nl¢˛¶z9©∞‰˚ÑµoRa	7ÖCÄ=a´^çHW∏…5'ømt•´π3∂öUﬂÎØW5≈	KSı]l	™—zΩ©Ì=∂≤TﬂZCÊ8jÏ«<ë˜)Câ?˛H◊ì|©Ìn∂\‘ﬂ√Ü9˘Ï˘@µ~KÿáÃ6´ﬂ∞:¶›˜Ú˘`£=<ÕÁ¿Y^Ä]Y¡Ræ’ÆÁÕüWkÊﬁ-qÁ≥“ú7õKlÁìÓã¶Ÿµ¥∫dè[Œ‹$\ëmM∂èŸiF68”Ìj^⁄mAPw≠e6ÓHå∏ñYÂÚéy◊¬ﬁ1≈N¥∫}SE]¢⁄#ïm∞«vË#_Ã
Î¢˚ñª—¥º®∏†∑ﬁ
Q:≈x√¨{ÿı°êüÂÄÏbπ\Z,g∑ÈÿΩ¬^ªÔêÂv<˚Û√¬Õã¯sãêø©gî¨r|o÷™ê4√ÜÚ[YÚE«∏WÄ}ÍvÑæo·™´w[∑‚d]°Õt?∑ ñ%˘3Hnxór•ÀeËÌ·7WS—	=Ë¬ﬁóﬂÅ{¶whÜ©≈‘Ÿ™Ï¶V-ÜÒ}•L>∫H”Kh>Ø ∞3óAåì£etﬂ§*Ï_*µj“FÙ‚mp•Ù?>Ûè"±ÍΩ`sﬂ+Á¢&=J?«vu]≤Â‹≥›Î* TÍ)”\b_g ëi\ Dbæ|»G_WH	“≈"=m^GJ≥˜Î∞±§ﬂ©±ÀbªX2|\~cØmí† Eñ≈&=ç2ÂÆ⁄Ã¿àA«xnﬁ"ùpˆ˚Õ}SFK˚BÃ–Ø,s1G´Ük5N€˜$ÚÚ+EŸÎΩÖøEe≤}ß√ı]P®4È÷*öË–gÑÅ…PÀGZ ÀyU™^îz≤±h.öÂ–»eH}n™‡*‡¬Ï†'∆v»G(ULõÅ˘.±¿œcE€ªUZêMI˛ GÁãPVãûÎ2`∫‘2
ÆÀ$¶ÀûK)À%∞ú.feπT0Ê	I√>…ee`äK¡•&Ø<ë µebÀL¥ñI-á£¥LOhâ¡-Çu©xá‰¬ä	3‹pev86<f"Ê†,ò:¬¶RWÙIÙ	d€tf˛+KJ=”·˘O	Ps8À6ƒY7Õ1áL§ŒCp≥Icß˛X@øLÊMgùíË}ÿÒÂ*'ãJ©AAƒ=KIË√∆ΩeT7„.z◊v]Ï9•¥´—SgÊ|4∫9Ïâ…<=–YäùŸ<˛(ç†'RU*dÿo˚8ÑXÿ &≈gÌDM‚öö¥òÇ£íF*√p\¶xxë?º8¿√¯√xxâ?º4¿√˘√x∏RÊOW ) «8#'‹‹∞„úéO®ü¿ˆ¯M€˚á°Ò∑ïßfÜ|13L –õz Mı__‡Òµ‡Òµ7^kÖ≥TDsŸ!wÍø‰ ØN›5í8∆°Óbä»êÓqyaÍèÌxº><?‚ 	A˚e†‘LÖ!°gƒT®QSGÉ9®ˆ4≥r_æZ0JÃì¢$Il£!†äJMêΩpÒƒª78,•6~÷)8f9s˛ÕNXev»√ÙÁPK#aQöD˝[ÖQDrD«£ÑAÍËQÃoù*„	(c˝ÌôÀı∑≥?V¿è≤3Ø·⁄V≥◊∂äk[Õ^€Æm+{m[∏∂≠Ïµ’·ÂÍº]^Øû¸~g÷"âôËË∫}bÿf1√MãÉ˝ägﬁåwFúxÑ√}6‹Ÿ⁄ΩÒÉù—4»")t!Q≈RmKf[ ≤mH‘Û†á#N~◊NÊ˙páÔa˝CπcÈ…$∆˙ôà¥9òÀ@3GØn$¢cÜ‡Ç¸Â6ª˚cÍCÑ32ëN¬S˘ôy„Ω<sôˇvrö<çæ
:™J◊K9—4 e~œæß6¿Vse‰Ω@LMÅuÇZ †@≥◊ÀeÙääÒµÖµ%µZ∞„AñÆKR†∫bÍV6Ô€∑ñ◊i„÷À∫Rñs≠∂x‚ÏÀT à˙h"ﬁıv€>28iÍıU2}‘…iû’ÒGû’Òò¢R"r ÁSÇ™ˇˇÒ'~¨Û{≤˛=='˙àÉò˝Ù˙¯1‚Ñ_üP–2•Ç$ÁÂ§æêŸª∫åËA{7ó)ex[Ä¬BπTç&ì!±{d˘¬§‰%ûVÆMÆ#o&∫fLuW5}BÏéö≠N‚JËä3∑r,duÚÆ‡#{¢“F≥v˘‡ií_”Êr#sAt<sY"„B_.Á %>∫TPUTu;\„Õ≤Úœ∑é%œJ8=;ƒVí? ◊µÙ6-2®5Æ˙¥ùC:F£ﬁB:ôÒŒèO
ƒ≥ÃC»BPÃT"üÇû>√	Avx¯Ñ kzæd y?Y9A_≥ﬂ‡	öæú8AÎú§≥5A–„–J∏b(ùúN–Íó¡¯èwÇéÉçL'hU√OY∆7Aá1]¶Ù	'|)æ÷ÜAjÀ⁄˚[>€}ñÄàc$çà–+c	â–¢”≈DjEÒ…·ıÜÃÛø'êf?¿fî¬$a‡f˝ÒXO[Oh¢ùﬂw˛q/Ièe‚™Á∆ßÚ4Ü‰©Ñ‘¿€ù~ó˙«ËŒ˜¶ÁDã=õãËí "‚ãÍ· Y›„ó˚§…}X…drèÁtWíå~¶Çøv⁄),‹Z^+ò9È:ˆÁ|_Ë—©	ºÉoÙb/G˙J¯i$zéÖSÊ–{›Üz·<®ÅÚ¬®2X&”≥⁄¶`èæ◊]B!z]Åz&ıDıZué)«yáèB©¬ì£Wß(ºÂ¿äÙ>cZ@€∂ÎÕ°Ñ≠3ÙIµ69ˆ°ªrøz:G)`ı3⁄¥‹ã÷áÙÎ7g⁄Ê»¶!≈≥∑~$Ë–ù§VD†V«†10◊©fú≤f§æê& 2?çº+©ÛcY•Ö1YÇ,£‰ Àº¿_oM≥c5–xT3ﬂû@Ê…DW"lÒii‚è?:5ø{@û¯îﬁ¡–DÒkc‡áqƒ¯|.+'ï^&ﬂŸi·”ä˜êº;£ßÉü
˜§Ωü™»Îiﬁá˙ÏLÔ±zıºKÍS¯°êΩ5ˇ<äÜÆí¨à/˝˙Õ!|«F°Ÿ6)∆;ÎÍ,]kvÄ∂πIÏ©ﬂ¡¸KÂÒ&rM0X|ÿÜ∆k
Ït¬dXÎÎÎ◊6wwaâZﬂﬁﬁŸzø~]€Z«ˇä
üûN©˜z¢:ßu~#Y)∞$LI)§·Ç8)E˚ ño©&§êNj˜CÃt@ÍNí
¸¯O4€‡9:Dw_ü“à¯üe0ú‹≥z&xVﬂ~x&ªË-t≈Z°M‰ÀqNzPvP^å˘¥º±wø˝˙È∏ó¯îD4qFΩèñÅÿN™ÖUù$<‹Vº:˛˛†¿Õ=√¡ﬂb›ó≈IYÑº7∆CæQó∂áR‚Mπ73±j7è∞SFÿ7$∂¶‹ªª˝ΩéÂÒ9yÕÓÓ[N'⁄π¢V≈FI:÷Ay”Ì∂¡ÀÏPc<+–pW∫3ÍIkπ·Vr·ïúÃ"≈¥Ú¯wÿ:I15ëóÃ=–m‘≠Íí◊tlEwõˆßR¡ﬁ&πìÍ8|öñ4/rÆ‹K,ﬂ5V˘¬¢‚ÈS“ÃJy/»ù,=jG√$¶H≥œä,
H∞%˛tÜ#ØÇ•éô wZt&Vï£]=.¨,4P=ôØ¸ïÀ˛/·´ãÛÛ∑RÀ‹ÄŸº xÕ‡¨C‡ØÅΩyt=xt]ˇ®‹ „¶Ÿ∞ƒñœûR´@bK‰ÖË¨‡ ?£tµyı´ª2SQ]Ö©ƒrîSDÿrËÈ≥è•µ°@°Y<(jcœ§}dzkY˚Ä›f˙{F‘Äíâı˙Ècò€‡ËÃ∆∑ìÈW#ú◊†ºAf5xn:ß¡1÷ôpzí¸BG(Î<cöÔQöáG8”ÄûÙEAOÚÔ[Æ4á÷>[°X.∫à“πRûïj—}ºƒvÕÕÆóOÂyœ¢À+∏¿H‡ÃoÍ§)‰·î«ßX'IÖuí~5:ù‘Çmjtí<w:˘ˇ  ˇˇÏ}mo«ïÓ˜˝e!1…í‚´,1íä§l&|[íJvØW7nŒ4á˜Lœv˜àbâØ\‰É°5÷+¨VY“UG–‚&
∞∞Ä˚Kå˝%∑Œ©óÆÍÆ™Ó)Jf√∞83›’›UßNù:Á9œ9ısr´¯ù‘è`êa1é˜–∞¯7ó©9KÁ„49wıΩ^€Îi‡TæÇ÷ø <võªuõ^à⁄m*Ö¿Á⁄Khw–ië∏	>;˜Â}â¯ÛØÒÔˇ"bµ`\C¶?î‹∂’°:ÀÂ©øÏ4)Ág(8ÒÀ‰lÒñ9•¯¥ùî”6°3Ö«≠tó§•‡({Û4!,NËY¨≤Æ08âÓ˛5¶º<`>Yæ>¿¡∏œXÖÓãæﬁ◊∏íÉ˚réiå^çmƒQ;¬±ˇIæ&4ﬁ¢]–ú-bp3¬Ê€8¬E_ç’{|W<Î3"§ÍzU˛C^ƒÑgö˛¸KyÌW¢jx6÷C/Ö{ËÆ†—z∆yƒ›Ëáa©ÙÛ_ÿ”3f-: 	é-∏:û∂Ù	ŒµóÏÇºYx√x#÷˚˜Û#vèˇ»_‚cv
øﬂ7_<¥Ù©tù√ÍûÓËHnpB–™·Ö·È‚®“ÈöÓ˘§·uöÜ∂ÇN·W‹ΩLÁRê˚@JõÙHØ–í,/í∑IÉÓ+ËâÅBõPp‹‚ú∑ª£ç=k€£ŸÜâùf¡ñæ⁄SÆ0ãÀM.viÏÛbptWz>&õGÚûp∏ªæ'ﬁ∂"Z∆ÂAßÕsTG,në.[<º ®%ËÑ7èöﬁ„≥≤«3Bˆ:˝jrzv ªY#^÷á°≈∞xâÈaYO1ÍΩƒj/Wé}ãËwï¿ﬂÁÄùz|OYS
’çLÇlYîCçÊŸÈYHìp˘<(ª#FÿººÙr˝∆ 
DÿWñÊæ∏¥=øº≤e∂ˇ8˜_q§˝‚ÒF⁄ßÈg°ˆ
€@„´mSòßG¢öv5T◊LÍvÍ‰DŒ:,nYd_hÿr$ Xl}”DGõàDøñD¢˘πüπ=Eã	,LúÙÎàÚ…Ê<Ÿ`÷ÇQù£ÈoÂk w◊ù‘˛ÍøC»wlµöÛ{<Vh‘Ø˚>'≠∆^€ÇÊê•)¥y¿îX§U ï>oƒ/TàÌçŒa£qîdÀ>~(6á_[€:¸‡–*˝Ùº-˝û∞sÏ√çN>÷y;ú“ tMeı£¡.à˙∑rùö^]E`üvPhî	˚sUXíıi©p~|¡~œv-.émì$S…%˙7∞Ù„V•∏‹o˙∑høfdAåùÆ¡n¿™≤˝C2 L°FtS˙¯ÒÖñèOjo,
_◊∆πhC~raG‰RmyŒ!U§É‰ÇA∂ç¬InDPeS®€+I{ˇé£}∆n¨ôπ1©ßÌY„ö{}ÀÎÄÊ™ÃŸõ;|jFÛ8ŸˆlycKX-™£§V'¬-ø‘é¨£ ΩnóŒØì≤W˝Å—Aé/¥[$âW*4sHº05ü®*\Ωﬂ–DÂñj¥Û3†So@ˇú£/æÎ«±oDÙWŒu¢1Òïuª3BµñıUåLñÓ-Û4HIŸΩ?q”±¬=ä·i*S.d§û¨õ*¶Vb˘Ü4Õ˛/`ƒ˘rfœ‡±•·Ø≈•ër∆ÂÌ:ªu{,∞0£≥”˙Ùj ø†≥`ï≈®“†_éª:òÁ^}gÎâT*M‚~Ô°≠¡8’ã˝˝Ó∆<÷”kGÍwz∂7Rû\Ù∫±øª¸ñÙ˛á‰<ôüòx]˚¸ôp[?î¶€gB¥©Eˆ˚Y©¡7Xô6ˆnV4è¸‚dh˛{Œ{ûÍﬁ}Æ¯˛?c"ã•9O†YPÏA®M˘˙ˆa!ÎVa˜sÍ«#wp;ÍDïªöﬂú⁄#ˇµÌÁÁ"zÙà˝°Eó∞ì∑aá·1KzyÒDª8ÕnΩ‹D°^;?ﬂØLí˝Énkz°«”7ºéV=U™§B¥›æ¡?õ=«uØÑ9zWûtVq;ÅõôÚå‹àM´8
%º`ÈÙ™\$í5i;º≥›⁄I÷@ª=y#°gC˘∫Éª◊€x Ø†ÚøT˛T≥DEˆ«7∞øılq¥x˝é˘ΩƒÄ
2€E?ıÇ0q≈>–âddX±¯v zÊ@¢Ù8·π´Ömé9iÏ8◊“wZ•N1À{kúó<ÖCásºÃÊ∞∆ÎR'¯Ç˘JÍÚ¢–nŸ´eD¸’î‡	æa5V;Üa:™Ïe=N≈uJ^B¿Ö0ÕCÒBk®gΩ0Hîó∫F€Ω¶üÏ÷WË≥$ËèUóËb‘HX!æ0H™‚ø⁄ﬁùª=•ˇH‰ÍºDk?s0W˜ÁÃlÕË(.⁄Ë-dm^…t‡*ﬁ’E•Å»|ÿ≥´gıc!{JÒPªj£) €p≥ B†ã£c‹Âÿ◊¶Q3´ê§	ˇœ -ﬁÿáØà¿}})æzÃ‘Ëfô£Ù,≠ E«6T^„î	ìÔñ|◊ƒÊ¨T˜j‘13›q¿ŸzjïÄ9/áø›<wïâΩﬂ,©≠S∂I:◊ì◊á&ﬁEG—si a¢*ÿÙ)C/ÍÛm…„åÇoº0r∫º∂Ω¥9ø∞Ω¸„%≤∏¸ÓÚˆ¸
Y\_∏±∫¥∂ΩE66ó°Te_: BIuYØªn_æÑ˛6Ωÿå¨∫d€Ï~˛#
Ì]â8{"äÜg(Üƒ}¢î∆}!Ô,åÕªﬂ<˙ÅOP®∑d‰:o¶ı⁄àëEóµøÔÜ±¡*_¡é;jI÷¬*BV!ø§jÒ7@è©bfÚV%/c≥*çA«\®≤≤Ò‚Ì$Qÿ£ØêF›1zC j–˜∆&/P·°ˇSût∞Q‚ëvBÏ3⁄)%Æ®n.Im√n¸éÓ¢ã£wú¥Å◊¯Œ¢€Àæ¿ÙÄıÎ◊óñÁWéueËÊºEŒﬁaäa¡(wu»µ^6 nõ∆≤GúKö€/jˆåÊ{˝bU«Ëª z,Ø8⁄U6pNWß≈;;ôÛŒÍqÓ™’és˚Uù„Zg–e∆…∏P´ÖGñ÷áæ©∂z"Eo˜⁄6º‘¢hëµHnöÕˆ˙ämÅêsWß&&ß&gß.LO“ø.MœLÚ÷J<‘u~/yH√"X«?¸£ "Éz‹úCm–œªÈ›8ﬂ`&ÙÛ‘{^öF≠ÿkèjì∂ÏIΩ◊H3ùôu¶bÉ÷^KL™Ï‹’ˇæ˜)·ö$< [»Rj9W=<sÓÍu¨	déÿ¬∏)
ÏFñXÔG(Qk⁄2Ùc≤(;¬Á∫‹ ú≥%{⁄7\ä€§æMó≠Ì˘’ç•≈W`πàó®hªº{ÕöÌ^◊j¿(=så&å∏Ke#ÊZD’5Ë”eËê∂OUw
¥x[tc›izÒ¡qX3ÎªtÓCVüa~~ªê‘◊r∆†^9ﬁÊkÑåëI	]:éZÁæÓÁùV£¶í˜®n⁄LPˇ¥õ~“Szõ(.5Ÿ≤Ëè:ôØ≤¨*Ùãœo‰8ﬁ¢Ì≈ˆ%?‡Ak∑ ‘DRH≠◊≈´úÎ(ßóèbôı$≥êÑ∑",ÌÓI€GBh2ç8©ÚØMx≠ƒ∫ì»ÃPÛw%∆ﬂù©q¡ë5≠$kX≤|Ànâ“Û¿í!œ6å®5!q&9IE'¥yóõ%wu©6¢& êï«ëtùQ[“5níîxÕ6πbJ¿˚æÂ2óÄî^S»≈ß∑∑^u˛<x~©Èëí§◊j1§xÖaB§´9Å√ÁÎ°xn	≤Ö+íwa|7©å'(Û„xˆ<}†º≠`{>váïE g[ÎAGj˜˝N+›#ﬂ#ìÆûQﬁî∆∆”h+•Ûπ5<‚ÏWùUrh~® Ÿ»÷5ƒ)™™\¡∏Ñ2´ÿKå∆âNN≤#‡ª∞»ÿÓpXÖÖ·¬1p'˛´„x*bÜy¶ñ5Ë`}…Tö‡?"u@a•/ˇ"Y[˙	YXôﬂ2≤…|ì	£¨lÒFÚÒ«¸I@˛[2à4Ây¿O0Ú˘+6ç¥˚≤jòcÕ&YÛ˜≥ç?O~2G5˚ÀqûÌìqﬂ≤ò^8O%—flMwÒ˝© ˘çµ,¡◊RkbL†<_H0p>ªÜ#—å∂äsGiY‘èx›+ëfı/˙ª¿õ–†rµYØ∆˝+Ùo˘ê2ù∞Ö˛ÇES‰Mc∫’ï‡COÍ32æÆU√ß†Ê*˘vdNo5¿FZ-V ·tåç*,W&Äs(Mf7•T…SyÒza:l∞hÇ]2¸V«ﬂ«±¡*b˙z„‘àkSéƒ~⁄ã©Y]∏N±Tóõ‘Ü¸ ˇ¸ÈwÓ⁄äV¢}?^xÑZ`»Ù;|˛˝ˇÂç˝|bÏ“ÕÛ≠Q2Ù”°ë√äèW¯Ïk0Ë§å[û~ûèc˙d⁄YØ"d<ÈÜ50GáFLø∂ΩÆ0ºYÁ–˜∫ÓYˆ^∆kt{ù÷W…ƒàµC≈√ÆÔ¸å>∫i4ÁD∑è~Üü#ÖA0ùä⁄"w.~g:Yt‹úËYÂu®™›=Gﬁß÷¸Mc®är˜„˙…p:j´¸ÈÏK”È©Ô5ˆ®–œÁﬂáÌw®äHÛ•¸˛÷	”ı^ö“Ì.∞èÕﬂjÂ–~É.Õ°áiÈÙ%ﬂ7ØsT(öt4á&'&áF˘–±ÿÁ945©]ÙNv—Ω&Hˆ™\u)ªäÔÑ»*dg O`B[04p≥›°AƒÈ:¿îÿS~"æ/À*Ú”†≠`oG≠|™˙üÆ%Ik¯É 9§;bã&Ï40C»~@•u«K®Ò":˛≠˜†óŒ˜öA∫—∆b8-·πà'l∂Ò∆©BLw7µÍ\çßom?Í•√ôã+˜ÊCC#£ÑÆ}ÖÎÛ^€±…◊Ü^3FÒ~UÂﬁ`å5óE=‰ÅñÒ¨lÁM<-oágo8¬ùg‚Û–°≈ÅÃŸñh'˛◊&‘ ≤Ï`˝/´"„dÙÁÏÃEaµy„
Õk •∆°LiT-Z‰˚gΩ;99J6BÔ`î¨QÕèJ)_Íg£°h«˚Æ†~qìˇøésLÇ ¬l„s_vDáã„wñ]ä}˛88 Ms µ¯ '7™™ŒÇ◊På-.?ù|‡‘LˆË¸Ω™| &ßJÚ¿›1˝ÛòWXÅ}ºp?y/„}˙mW¬)∞à˚3„J,ê‚}µ[:® -Úﬂ¿ù>AUzõœI_∑µÛ•ªîõï€Ã|~cT[ﬁsn†ªBÒ∑Uóz˛’q+!æM†í€°oª":wu-ΩA<^[Õ=MÔ¯Ìn¯~Çõ˛a˙qînªocÁ[9¿¯m?ÙÆ‹°' "ÌÌ.3¥Æf∫Ôo¢˛Ê1±%T∆£v€£≤µDÈé∆\Âıò‘≤rÁÌá∂øêaÒÆlãOµÁnˇ∏ijø… ÁvÊäÈﬂ÷û%◊F…¬õl[[0éV>ÅÑïûM“ÓÖi–3g#s"  K∆kW/¿v¢÷)¬¯ÍNt€OÍÕG3ÆıïÕGQÌ+7ÒuGrU-ÒÀ⁄ì“D≥ó§˙æ
åí°EÔ`Ë&SÊ…^|â;HyaUéùFÿk˙	4e√ 0∑πu±êCÖ´E≤Wp◊ò–ŒÜàôû‘öãi8—øÆ⁄ÇÏ` Æ¡‘Vâè˜úÂ7Èbág+◊ƒéÇŒ≥çÖ8 D!5ø’HÈU§ö.ÂNi·Åi˙√M–ß∂«!Ò√ƒ√(¢á»[tÊÅWy2ÁÔã8q‰j[WÛ”Œy¶≤˚£§Ó:nRû‡~gØ&Wñ&Ó([F-*í«≈üj˘⁄®ÿı*j…õ°◊ÛAlUµÁ^xƒPKn0:}◊˚±◊-”ˆ¿Eµ=‘3ÉE=2°˙[›æU?ã;e™ü65’ﬂÍû©~◊qú™_•ÍÁ¡E“ÍûºÍ£<àP˝-8∑Ö™$¯[¢˙ÈÃ8Jøˇ=ƒ‡• q–øÂuRÃ—`N•Kà∆°z˙ñﬂ«Ç≈¶	Nü'`ûó·Ê~h)]µ∏O∂íiïï µ1¯#Ç‰ü%Ø.WÀP ”…FØkÜ¬≥°8Œ
›FáÅ>®S?µ‹∫‘ ù+µäxª'·µt∏ko~xM§˛3$É¢ûü ©Õ.ÛúfÛ%˛.∑Ã2˙æ~‚ﬁˆn_90^€ÔP∞ﬁ˙´i≤h@õÅŒñº«5].}ªÁÀÈ´◊©frùhÌŒz(W{ö±rgÙÍ*›yƒ$¥7∞FÁq‰„Ùü»Wß;~Û¯ü$∞<üÃáË4'ø§PÊ_Âø@•Ã≠◊~∏¥∞Ωlª≤2Ì∆YùﬂÿX^{◊^'sãAÚ8†R`äôÄlãŒ0≥•ØêDE“=Sß9‹ÄÎ„‘ ≈‰8C˚⁄ﬁ !–J£ıL =P=—∏µ?Ÿ9Gœœ9û"û‰`IéŒ´À“q—x¢†`]—À◊¢ËCÃ	”2Ä2Ê¬ëôç?¯ŒEÍ9pvL’ˇ˘õ«˜9´˝N}8
¶ﬁ_QûÉÒ$2n˜è>†Z…“,üÄ† ”°óêUØ€•}ÛA≤1ùhê	EUSäàV¬J¸ªLÂ—z1+®®}ÕÚçhŒU¡ ˇ\aUˇÉ)ÅàØ÷gÕÖ2‰ròJ“R/åZ£ç‡oû%$íäzq4zaØM5A◊í-d…rm≠™ßÄÀ¸k]uW≠Ñ˛jÚÜ¨®î πCıÌ
µÕ’V}QØw»‡„∆ôc¯
ë´¿PÌ¢ÅØJ¿Ì+≤÷óU≠»‘V€eœ™ªÏ£=6ó@pN˛¸|Ê—‰[`3rÅÕHÎ,≥—¡k™VÙ≥HÕÅüpï`4»v_õ,õ”¶óÏÂΩ¬ÍÆcJlJ≥Y¶ÌQ3'©Uuô:ûÁfÊ;óı¸ßÙC·zêd˝ãájπi°ñe:î”ˆgI¢Z„¶|XÃÕÑzQ&ÿTEvió¯È8Á·z6!;>ù^6›È‰q÷õ,£.c&7K√GÙv ¡nÚ!2¥[>äï∑æ4£ß;6Ìˆ|®ú|∑√ÚR∂û1€[”%≠»ÅC¯$—ì≤xÿ*:N°|YX{⁄Aáö„Ôœf1ÜRv?9¨t∆a)wGxà≥ê∫£¥Yl‘≤å^££–à∫áÃÕéß8åÜÏ®» ì÷t4¬¡lhTkàm!ÂÜSù\A•p%|sYÌdé Ü9ïØxdyÜçl∂ÛË‚O©∏ÃÁ;¸ÅÅFP ï?,ãE‚IŒ·Øﬂ(oØB 4óƒ∑È∑©©”î÷Ów2	%ª±»†'Ü}ã)ì/˜4e/W∞IÌ(Êé]òPËßx6ô¶OÍ§ŸQ:·∑c∫¥O’azëó:¸xŸ9Œônw°ªñ…zê¨√©,ƒÜî—ÍL™ØQV©ÍÚ•R Œ‘.™§;˜ÛÎ≈E£CÈÄÏ.ÖçênΩãC<àBIvC \ë¡B2¬G¶ﬂIÊ”›6”tâa`	RS/ÉßttyYÑRç≠ãµ.[¡©¿<ƒ‘Ä~t"%*ÄÇ †ÔÏpf†≤#ã‚âm}âΩbâﬁ)WÁcrÆ÷äH¯…âI◊+√w”E∆¿öÒ;˛uﬁI€_8œ˛¸ˆ9‹Án&ÏNbÂ„ˆáˇ˜õá/øy¬.Î©ïÖ^gi⁄ßYÙ◊¨˘◊Ïpã>\}4—ÁÈÜ
ª√ŸL0¸d˛Õπ')◊ÿØäEÂq
@º•ÀSÅπ«÷Í v?GÿıT‹ÌTŸÂ(,*p∫‹·åJRcﬂçfT9≈Ó#áEFıpn{\ì∞|õ„‹ﬁh€öyŒq"659≈BÜøì_fGHı∑Ÿ).∫CvNbPTé”≠[(É∆©ƒ∑x,é‚ﬂ∑o£‹Üô\´
—´ßëˆ∫r´BGœÎ/SXtYÙN’pBø†ùäÅŸãΩŒhë",˚Tp@S∆ÉØÇç÷–¬W Ù?ŒcFñó∑9IÍ‚“ˆ¸Ú 9O÷◊Æ/ø{cs~{y}ÕY¢
Òÿp#J„g†ë<hdj ®‚uÇ6¸t»Æ◊ƒEm˙Ôÿ•Y“Ï≈X§å»3Ä…†&[~ö“Às°cò‹≈€Ôq	¸å¡ı5-Ö0íÖ®≥¥z1«∑—M6ÀõÅ…ëFâ p0Jr˘’éD≤€<ï¶_jóé©WJ„„◊hy|Õjöõ∏P‡GÛ'p>≤Üı3Q¿öëﬂ˛Æ)µvzßƒ∑8” 
rŸv©¬ÉjcàK¯ï"±-ßˆ‡‡aøj»ä≤jú·U˙√´T%π≠FsKcc;;O4y£€D.»D®LHÈ2©8ïv“H1yT~«<√£Ãs·à`ûk»òπÍß}{èlF˚£$TB“.-∂&Ùñ”KönYñ®s2©:ßö¥zÆúÆÕ«f∑f©Sìª4S¿zA≠`f∂”{Ps]wt∫‹/[«¨;ÃÌƒ˝Cp˚C:"ó_∆~-Û¨˛“≤¬ùUH+±ù◊xÊÄ¿íu•{˙:8‰‡0L=ó%Ø”‹„4öﬂ“…ÁàVù0Õ¶Òû¢⁄4¥=P∫MC˚'Cπâ7∂“ı±_›’˝N¿ºíÃÄÀ`&º!ä˙ËÃÄlé€∞2(o±µˇ›´ç#ö€á*œ
bËÍ‹Ár◊ƒPŒÎ£:Ürµ£NÜ˝™Å≠5Ö“GZrjr-¬ÒöÆRvw†≥‘µ±Æ§\42-
e5ñt˝‘üôFœë'N¶ù÷√˝9x—SØìÜ}o-~[fÀËÎÍHá€ıUÍ»¡∞5≤t+J+kc&‘]&„ÂâÏïr ˙•}Ñ#«ˇ•ÈÊÍÃèpîRÄaÁºZH|Ñr*08Í–Å¡Qãé⁄¥`pÑ>VK‚ìÙ
Ç?äcv≥
>Ω_ñ18‰#åw{…^ôdà£2wòv∆J∑Â ÜpkkVÙâøCÈ⁄*ü≥¸AOÄ´éÏ;©MWâ◊î≠fpòYÃXª}◊∑xÄ7†§|¥+P(	πÜkUU¨¸Lπ£aÂ•ûó.l,€∏æ∏œÏÎq]‘Ω-ï‘«üufÕY˛5a˘.`æŸ˘Ã÷˛ÁeÈ™¬≈%PH ™ì˙tÉ˙£∏ÔÇÓ€íŒ∏I‰*»ûÂ÷â\Ω	jX(â3Ÿ`÷Œåd;íC9Ï{~G(⁄>-kQ:3gkÖ¢+£∆ü~ÛËcC¡SõŒ¯Ùòú‹’$F5#Ì 7Lƒe1„œY÷≠9Ä˝õ∏ãÜÍvbÖ`Ù]·|Ç{ﬂ–ß?≤Ä˘gç~Œä∫~)Æˇ˜X" _áèK÷€{ABËÈûOË∆ë[B+Üêı!¡Nb(Ktcéì†'ˆ|-’7'ÄËÛöM“ébNÈwõ`èÔx§¿÷∂˚Âm)˘AátAø{T›∂!bº„5[æ-Uﬂ¢suñ^ds–E„bÂπ…ÒŸRÃ∏ûl˘£d¿óË€¸£
ﬁÉ÷Q{í:ÙÁ∏[∫≤ª	)…ŒñÈö’“≥·tm{·Æ#èÍs|V&;W[πMâŒ˘m+ÏU™gr«%7πTjûzå–ïL0n∂’JWÆîã\ˇ/é≥ºe€Qñ∑,h
ûµå£R€ß3mπN.±Vl≤êDS≠“	¨X∞Ÿå©ì3Le9HCz√EüÓ∏}ñ/Óh©∆oßA€O‹2êúbõ∂-¢nó‡_˜ËL%Àl&/‰aƒ¨lw≠Uì9u4¨ÆâÃ3¶x¿,ãdÂú’˝±…Û∂àû?òL8’nÁqy .ñ~9¢d™:⁄}≈ô£ˆÙ∑…8È≈˙y∫?h1~¡…àå!ãFßPä6ˆí†!‚{Zhâ:ŸÑÃoÖDïòK’•&“Ò$KäË ªú\9Rj· ÇönkÎHV]e{Æö%gœŒdΩ„Œ≥,µ‘‹SÎ¨ƒ.´ô¯X3ıé
9ùWÏJﬁDõÃï¡Y%%œ\(œ≤_⁄öz°Mk
%ä–æcÆI´sõ}zŒó◊∂ó6Á∂óºD∂ñ0çÌm≤ıﬁÚım≤µ±¥∞|}yAœr€™…ëHÀŒónNòÕùR_¯çƒèè∆O„vÑ+°OÛŸ5‡•8∏ìª:92:WÉsRE¡ÿCxHîN»˘,®≤Íuè‰7ØÌDv'5U˜%sorwn°À•5ßπlÛ9J¨ÁüKﬁ·˚‹ã,¸ΩŸ`0Wıó–ª-\xå)L$Kê†CÁT–Ïâ$&ôôƒìD¬sJ3ü!∏ã·4íóêF‘ﬁ	:ànq—GˆÅl±jªáïÆ4Ï%€t'√j÷+sKzIkî–ˇ	«§›x® ç»<ó¨≈√ì
'⁄z®üÂdã€2GÀqïX+]î;≤%o•‚ÃïÍÛ¸d!2^Ùﬂ¢≤œ÷
˜7,Ã®Jwéö.tTÿÒ=ÖÏÁ~*wøU£±,Ôä÷ÄÀªÄ}zß¿Ó…æóë«£˜æ-Ãvé–˚V!‘tËyNx„rb’,±ãØÅd1é∫tÜ⁄—uˆG*«"+◊V$•*X83˝GkØlˆÅŸó4Çßıñ”ù¡_¥W¬O,I0…Ó'yÂãZ◊x¡Y¬ô|∂Û÷∑ß∏ä¿?¿‘%5¸*‚8&¬™„b®Gô •5òIv´jÒ∞BüB÷"aæx¥ﬂ„¥,€";Ó¯Ìn¯>\“èt€›*°À‚k¢5¿Æ>“H?≤ùÔ’Ïœ:OhßUÓÔL‚Pœ+◊ß¢R0æPJ∑¢ˆª“∞›2 ÊúºQRŸL®ƒÑ£N é⁄¡L8Œüá›ô_Y…,c∫_G◊ï⁄``éG·`ûCºPÏhéYÕ◊çëJêUµi^1‹ Imñ©Æ∫=Ï¡{{B±2zõL—ké«mˆ|™Ñ'Õ:Kƒa«&ÎÙ1<˙˚¥©õ‡f≠—
ÛHöõ™qfáÕgYÊ´TèJf~jÂ3ÖoVO\Q^vŒ$gï•ÍÉTzc´U¿æï‡æyOÂî‚©ÃpÅ9ç©"T∞ Zπî√¨ÙO±GøF·∫&
P∏ìQm“G^§JˆayTùüy*Wâµıµ%9Cœñ{”gÀ?éaY8[	¥«8U+Å®ô†Qê~Yd·5ZÿVÌAó¯KY˝3ÙΩ‘ˇ µ˛ÄúGò>)L˘û9ÊÁ1“‹pûπºÀvCVÔè3ûƒØ}Eﬁ” ;KÖô√jå®Î79^*+–' /.JO≠7™πà ∂≥G^Àá©∏µ√${@∏ß"G‡cY@°P√‚	ï>f©¨‚:/ VµLòwÀh◊á~,^i[b=Ÿ·ïÀÜ‹~›)K‰%∫j ÙÊr∆˙Ø6Re»˜ﬁNyàI=∏%î∞âC∏#N¢∂/H ŒÉ2"‰çúJπæŸ°e˝‚€ÿ2«h_âø&A@ˆãI}e´42¸È´%gG›‘·ÏêIƒb™€FöÎÖ%çZ≠Pxûπ∂¨Ïy¶√T…›,ü|0I©ûü†K[Â;óf©fG^PC¢)9dk»É!¥∆÷’¸bZ‘Ë}Tä+πsûâÓÍ‚˜Í%åh˜/∑î‘ì+e‡®f$Wr_Wxƒív ≠Ω2æïˆﬂç¡ØÛ(`n.¬Ñè…ˇå:tXy≤ãù≠wÏÖ|eúJÏ lh™ì≠Ç‹'q{¯É˘ÿ'Qèx;IˆR?<† ä∑Ôu∞^@åµÔLà¡ÃfDÍîn%`õP3Ea—{2ˇ`ƒΩsw{Xx∆N∆V—qR!…Ü∂©‘¥Œ2-Îó´«
´^ïgá5a2cYx0#Ñ/}†#√ä√6´´€êÏCu∂”≈X®ùïX7&±â©Ãs´|keŒ∂qg/⁄L+lÆüíáuÚÏ9Ó+‹¸+€.¸ÆVdPıßçtgì˜SÈÚé›•>Æa´Ê»d%?dYÄ§=á«—æπnÅ¡úÆ¡§_0 åu¯˘«ñgècˇ 7ì˜9F¯üÈáßsd#J“VÏo˝ı
fZámÂΩ‘€ˇ¬6]*Ãßà ¸H@≥Å/suÈ“ÛJj6áÂ(è˛ÃÍúRñ™-«_Ëkì}Œ|9^ßaeäÕÊ∫ÒÁ,-q%jx!ŸÚn9≥OŒRÈge5≠´[ ⁄IñSOqiá“Vöuvhˆ√6ÅóÈ,r“‹±Ò∫ó‘«¿≤]qqŒÀ˝≈¢‹_r?êÚDGó˘ÁË!ªÀXA$.¸≈àf&ƒ˝Oá≠ÉNÉ%|HE*Ul/°CÃﬁ÷cQÆõ— fL3H¿ÂáÆx2zˇ≈€@ÀÈÂ%&Ÿr÷Ëp˜\~+m,wËh{P»@ÌßÌB«ÿäËå„„Nª÷˙√˘Ûd+h˜@fIsá4˝–;‡9ùK∑ÈÓháÄÑ>~Ók£Êﬂˆ=¯ÀûÔÌ{¶Ïëç8jâ?L€ãB™Ÿ¸ñ;J&ÈÚ‡⁄âTÜ]/L\„0(’®å[S»∑⁄G¿û§inÚÜ—±òCèW¥†Á°ä˘)wÄ˝TQ±Cò¿ê˚]¯Páú√Æ	\O{¨ xv† ¯§j≈Y∑>R’ÃE]Ø§∞o+„qµjqE[πtú¸9ãsèZ˜˚`·≥˝ÇÃöP:∆“1ÏÄÆáTE¢_¡+JÖ%t•>wµ‘¡eﬂ©ô≠ıhî˝Ó‚Ó2^(∆;7™„X6ÎEm¬/•ƒÀ÷˝§;p„Ó_π∞Èù<{ËˇùirÆ˛yä6´sp9¥‰∆ˆEæ£dØh[e)9RÔÙ]Ï“Úı_ïû\≥x·ï
á^∏ÍA9√92ø∏∫ºF66◊Ø/Ø@íËˆˆÚ⁄ª[‚ƒ¸EµÔtyûMò∫»˘tì°æù·®ÈÍ∏Ñ>dBB(¢®˜GYπBtı˜W™2∫Dπ¬bÅ¬vÑ)ppˇ¬ph¡ÑWÓ‹!\ﬂÕëâQíPíÓ¢'∆/Õé˙’‰,TK*\Õ5âvı§ºz/ù0^ÈﬂÜÇTnZ∏Rçì‰K-N^Z±wÄ1÷BÕ≈|aE•>£tÇx9ùÉyΩ_ú Z5ä%≤Ömb∂1;≠-l]∫⁄«õªx*πr∂c¬äÌ»e)õ÷TTãµ"B˛±°ˆk“oCï∫&¯%˚Ú˛£Ôx äI<Q»AÈ˛^∏å≤çÀ˙à~‰	Ìt⁄>oâ(·XÊ2¥%ó¯≈ƒ;ONLúøÿØs¨ÊãÀƒ`¿¯RfÊfπæsÅóàøˆ…/‘t‚ßpSÏGÑ∂„µ0fì‰ °íBÕV⁄ΩABÖ)•∆gów3X¡tG≤Î«†HÌ5ò˚™.hﬁ[îo/ãµe≥RÁõí*u3Ûß5§äj6ò ˚ê™ç(å qˇ‘DÇÆ*Ω`TûT…A˜hT¨<8 Eüü#…∑ymì≥ÓˇÇÕˇ˛÷Ô[äÊS¢Èß^&r©m3Õ¨'ï˜f”Uäµ¬ºRî¶±∂õJÎ$É?ŸV·åÆ≠Qÿkw»ôøEÌÔòºMÆ’£M•w•7uMÌ=X¢ßñ≥Ñw¥
0,¸6üÒé”≥åÔ∫∞-õ3c
ç9E·K†
ﬂ≈Êq`¥h∫°‘‹„O.cÏ‚fŸNµ›$Ì∫E¨T·¬Sf:∆{^<üOÙCêÓLWÈ§Ò]ïÆπ„‚s1{ºÿ©y‘i0S~¯Æ†‚x…Äãfe¡k’!!Œ@œÑìï$/⁄Ä†ê‡\aºñÁåùØÇt/JÉ•^∆È2£œﬁÅµ,í_£ §_ΩT4ﬁÚbÖ-¨ëd†Œ¡ê >G⁄ZX›√Õ‡ÿƒdL
?:”Ø¡hHkÓ»ìë8 Ú£∆˘!5-¿üÔÛàË∫™r¡MK)z ™/XñM,‡.WVñÌz‡áÕ˛ñïãrÿÌ‘.É,*'ﬁ+ˆ∫ã ôn]çÃ°êÄR˘B Úü"Ω=Àõˇ]∆>âÚx&„ö¨ ÛcZ7∂^!ÕtüXZü¡ﬁê_)›∏?’•j cÍë⁄®`=‘ôJÅä%,ÊjòÂ∏À"G◊ Ä’ÿ(‡RœÎ"+AJ"H—á∞
7øS‰)™l∫õ¯%2…|ç¶C3{Í¡œ
•Ò≥…a˚&«Rõn&ﬂêiÒè∏€~…%èÔK‡√«∏§|Ã∂Â8e÷wwÉF‡ÖÏ˝<k|hÛ∏¶6>¯	ÉÕûM€ÔXíkÎÕò*G.≥∞æ4Eœ8A|'ı†¬º˚k¥∏t·y?K∞Ÿ≥Yb˚f…ª~ßâµΩÅ√)2«∂d{Ø¡LyÆ›?√9¡ﬁ∞⁄d‡§µÂ∑Ö˜º ≥v#¡‹E˜Jd¯ùBéÇK§KrÎu^∑U/Ùmf7D∞XÎœ<é˙U9⁄r∑πNW\€çæ¬H¿Kñ+Õˆªxvü∑ZO˜&”≈'«ˇf&R∫«§º¸éÂîmU4«µ0äö‰]*+›◊^k<ì¸A“©&—<Tzûb+/|º⁄dnÑ˜ºF…⁄>”*ÍqÁ˝°˘ÔAAÏ˘1¯ˇ5¸˚˛ΩéØ„ﬂÛÏáy˙´ö›äªU∏5ñFzç§hÑøØ‚ˇ´È
7%cÂôÌ¸—ÜYÄIDÃﬂÍòÚ˝L¯˜Y~§∞~æ!·áÑ3Vp¶Ÿó,gø@í–®0˚/√”z±ÔπfÌ'WÓLU(ø£´á ™[ÄßT+QMup˙åd∫˚HÇüÀ&«˙e≈z≥`æŸDÿ˝Î?˛=´>ã{Q^Ôãπ«ûb–¢Œõ=wqæ:#MD¬l5R≠Ç ˜≤4W#◊ C}û◊@üê1{¬∏xÅF&eE7o¡ÿìKHÎ;	”¯kÖAIUfGN	ü2jN…ƒLSVl0`™◊ójâåAe’cÍÄrÍ50'≥nû)ŒÔXˆ‹ê)ÃRly,s>ˇmN/KP ˘Áà|˘€`r	VÁóWÆ≠ˇyõÃØ,mnül.¡™Ñ;—m=ó¿î≈x˛<YÎx l«ãHõÆ]^ã”jg3/˘˚Ú~n0Óê†…˚‹´4Ù#/ÜƒB≤úÑ^õ3jÖKdìäFÜFÀ…1»‹_P;¸~√4Éd(N˜Rÿ“¿ %ëó#b¸~tg˝9Ú>dﬁ%¢@|KwÂ(¬Ôy·Óÿﬂ˙^ê•€Ùôªƒm/˛0!çòN 8Ëc“*—”>%ìsì≥d~ï˛‡ﬂn¯qóæœ–¶U„êâc2Jñë∆«*h^Ú!°÷T/≈äÙΩn#jC2ì„Ó„dõû…±—…µx»ÙÙw!Ái¥Üõ˛]ÁÔ:«q_j–”6ˆ}—4ê∏Å™°=t âå–:]bÄœäÏPÎÌC,.YÑ],JÂ-i·'°÷dËß§óê;@O±Mƒ>	†râDtn'Ú‚&iq£Go6Ø∑MıÕáÄß/´âÌzg*ê∏Çí√<œ,ì÷)EZW‡úæ¡.Yjˆ"pÓY"™˜¯B¢íZ,XˆµÇ¸J˙Ä≤∏|:óR∏lüÉæΩ¬6y¡æ	°ÀQ@˚Ü=iµíL8ˇ÷ßcS’ƒíwv€˚–g<ET*∞ëí§Ω&¿≤1+’kyLwŸı±ﬂbh|q'N!Íì†-ööò∫êó∆E¯a#:ç†K[xõ	•leîbe≤SÅhR	å}zXπÙ— {/é:êyåŸå3†¥Ä{R>r¡ªèR∫áœgZM©ÃvEG¬nQå5íΩPBUº%ºiSãëÏ¯∞É¿Kâ±∫0x?ﬁLØ¸=5Ûhãé	<ŒéOõÙ…{Ù≠¶'“=ÿkt\»¶ﬂ¢èë–.P%-◊IRä!≠‹&ƒ”™«0gΩÑ.‰áùdòóy)”∑ßL~ï/œ˜ ?|"Iu§;„K°L
\Î¶O;ÑsÕ¢Íè£®Õk´%˚ú'U +ˆ“$]=†€5ô•,Í—mJ|Ë3:-÷ÆhÉ¥®ñ¢ˆv≤≈¯éQf7{T!·(≠∆„dπMm0Ú^D;ã˛mÂEˆΩ ™¸¥Ö‚¨[FÑUv[Pj=∫7§¢ªÎµ˙‚tOù‡$gÿêÙM/${`Ry!à¿d”ç\"‰nèé0»‚®a™8È§!~'Íµˆ≠ÿì¥ìz ûxã*d‹Æ˙qDÖ:S¢ çäÙTíºEÚ∂ÿ"±ÂS”÷ÅEœo£ ªÑÓgŸÂÇÛµàt‹Õ’¸™ï#∆I'Ó≤Ãâ,≠ÖÓ'æˇaxêqM,ÑQØIÆQcº◊’ì⁄Ω∏±G{¶ô¡	É.ˆb§åe≠Ì∞÷@Æ'ßËà≈äAÌÄ<lïI∑Àò”pÈ≠∞Ñomœoﬂÿ"õKÎõ€s08¸çÄ¿µç
›±äuAÍ6∏7Sê¿ GÜ?Ëœ¢˝’qÉﬂ§ÉäP®QûRíåí]ﬂO4bÄüQÂKÔEÇõ¿⁄Óè%{>‹ÑÛ¡†Ù5‚É.∑5Äwÿ£@®B?CíF1µQ‰¿l°úlAŒag¸]g”ßüö	˘1.l>¨–3S9Q‘$ÒÊ˜u/ÅÖˆïeœÇ…ÆÂ“~ærG¸uàÛÇ’\?Dœ ’Eœ@ﬁ™ûÅ‚vŒ∞É“íxXˆtv∂m3§¥É◊“Æ˛+‹5åıq∞+∑n\[X_›X_[Z€û#€KÛÔ-míü¨o˛hkc~aÈHÌ≥Jå
â/zã^≤«¨∆+ú»ÖIÜâH-iœuƒˆE9ñ∞S•Úº–è©A‡u:öÁÈ/’ïePÈ‹Jµ2ñÏi˙ˇ±…	=yŸí*Õ§ïMô—¶ã=ïDsﬁå1À	äz∂ÁøW[œ¿π®ÛæZ≤ÄÂ3©"{	Î®•ÊúÜL‡ÖL`Ó…(J¡+ar d‘HdD–Ñ.≤òôç&"óÑlÎ!¯ßÒΩ/(ö¬ê€m*Æ*ùzê„≠éCiæ∑p/›N4˝T¨@mM÷0Ñr— å"Ç Ápôæ«6Ÿl€√LÀ˚2€G≥<œ—U¸Á0•k√ûﬂÏÖTU„^˚ú—´d~Ëi¡-óO1Z.Ú`≈ógø[ı∂µôÕÛ‚;·Òô1-ìß?˛ÊÒ#ˆK∞æáΩo,TB‘ä≠ÿ%Ô¬öﬁì∑ÈRIÜ∑ÿ˛yƒ‘%Ö†òjHÌñ}¯_I˛úX(Ys+ﬂÂ™);M/ó«ÅﬁˆB~≤Íèõ˜˝øÈ≥„+ƒ[ﬁg≤ÒB§?ao—ç¿6Y_|Û¯ó(Û¢FÈ∑@èeéL^ú ΩnÔ$)ù	L†èÉìædÏ>'»B¥—Ez´G{ˇVêDÒ—'	5}9C√ßP\$gs£dnXº/ÑﬂV$ŸÚ=‰}ñ~ˇ±ÊÆ¯àãGtÈZ>út∞~óπ(è:c$˝≤:c¶fò+ïﬂ¥˛¥ë≠f]¶0AãzK≈ÑË"≠3<<î†mÊ˝ùﬂ–∫ˇôPHÃ˝sÒS"Úç]dö∑lﬂ£”poìt˝&d≈€°J*¨9⁄ÏΩb..’œ‚Ö#ŸÁÏ4M’R1l).*è%iòú:Gπt>MaùEΩ63ñw“BF˘B≠,?ıqjåY›ﬁ«Mí–ñÃVgÿ](m$¯wä 
⁄;¢†~î’=≈Tõ
l£úÚH.†í …‡®b&ÎYÒ-+zÙBÃ<!#b}|(Ï≈E¸äätl2w‘¡π|tΩ»Jd¢c3ó˙`E˚≥µ@NÜÊîep∆⁄E
#áÒúßv'cÎ‹ŸCŸNÇ,ˇ=UòÛUµèC¨ÖOâäK”¶äK§¿Xw<9&+t@xi•‘XíoÀ
•„qÜ∂JEñ’õπs‹[: ƒ)ö‘ïgπP‹ıõú^ïÊË¥ô.&/j\˘fb6U3{ÈÉjú(
ÈÄ≤ ¿Y∞A
Øí]…ú´–æ≥
èµ§Ä˜í±LôBÊodeè|ÁÅDÀf≠(◊òcqp"\∏ú}«L§Lü•ã˛G+ú˝TT!{QY^Ü,mÕa[f´!g9ôö8¸†ÿe¶—ø£º’àâB †Ãxsikim{YI≠yø≤\=ç]l†◊≤ oL.cÌrÉF4»ùî∏=Ø”}F‚ïIú˛<»„. 0_P!lÍX◊¢ÚÕHç ∏“¿NûRqV9’mXµq(¯*˝1≥ërÂé»3‹G¬/Œq£s‡±›	vVÈÇ]¡¸–d<&¬TÃjSéAp,¬çdkßÃV,r}Xàtã@ë>Lº¡x&Aqπr$j…º€’q“§
Ó:ŸHøùÌpsèn&wéÜOùœÿˆ°…ö)∑*Uæ,≤€‘∫ªÓÃ`µ´ª÷l›a’ò¨»Ú‚)o]^<gá¿[Î<*Ÿ“Ü_9“¡[¿∂8ŒÉªÀ∆‚ç&Ä˚™∏TVc0w¯4JdsÄª—íËR€¿ﬂ£ΩÏ«WŒaQàÆON·¨'ÉW˛CKÖÒJº˘nÕG∑≈d_±∂Í¢¨Ø–:∏∂,Dt!ı]ÚÃ2«*â,ks@+–'’ƒıK`)˛ﬁ∏—sπŒ:Ê˝z¢gRaÓ÷“hæyﬁ◊®˚k›È=j˝–¡YıRzπóZﬂ˜QY‡sÙõ∞¨‹Gøcñ4ﬁ_i©÷\®uŸ≤ºÈ=úW_⁄{W\Ì∏£-”N§Ô\ÜÌäÁ’N%ßò‡“U`bÉhòS?bA¥gÙ˝òÉ≈Ãñ›ıù‘ T∆¨£a¿AGª <1¯ƒåjÃ≤(≥%π”kÔò¶e;Ë\9g‡ÿh{∑Øúõ4±o4"˛UTWıµ!6TMj˜ƒòÒAO±∂,>¨eµŒo L”≈ËcqÂπ6∑∂5ç©›ö5j™olıÁ´≤]©≥…ßv∑dÌ4	ﬂ•†î∂%EÁD>Ì«b—˛˘˛†1jÛÎ7÷∂Á◊∂…∆¸⁄“ ëöW!jÛç ‘Î§C©eMíy ™©¨•w<˘„JÌ4°‘L„“PM˚ÎA«Î`⁄CØÍäú!÷‹∏Éœ—£˜P‘8∂üGË©¬˚fè œ ÍπÎ ú^à¬ê•aØémè-AZuöó[|Û¯?Ô TGy<çR/î˜ÆqKS•ëÚ@ôw.>v+·zÉwıSey "*Ü*éöã†˙<ﬁñºM®¢0ˆ‡∏‡st›>√ïÕ”úÛÌÆæÖ˝J˘˚!Ûƒ≥BsÖar›kÙB»B }ëNﬁ/hÜNü¨	ø‹Æ∆›ÃÊFû“m”ˇ!èxBîrrê\´ıG.5ñ®X/ÕL «'IÍÌÓÇX˙5§è´°Û—‹#LúE™ Ωx+hôB»g≥Gù=Od…5ØÍπü{ADßCiXÛSam$¨VJÆQyÓ4¸£Œ	≠¥œúéüÚõıπƒ·=
Îõ@xV^‹Ç˛W6Õƒ`û?±I¯€7±*‡<–ÁÎtLYµ‡M?Ò„[˛Äó≤"»ıà0:¨l9^ßI∑‚7[ÙU˛∏∑®
⁄˜*GEg_£®®¡¶x¢¢øgSD1º≥<û4ˇà©0:kÓ‚daYÑO®QNóıH™P$î›Ä∑y=›±P∫tÙ	ΩŒ.<ãÉ~ã„†\˚®¬cVSlı…6ïø£ƒ<Öh“°©A&oÍ,ﬁâÅ∏Ì:≈a	∞e_qæN:†láÜ˘≈LQ©-’	BÚ6C[Yü· ı•XÒÜÂÖÏ˛z;uû A÷õ[˝¸Ï)‡bˆ ≤ô:˜^ÒvÏ∑~ÆÏ:æ‰[wf	ÛJp⁄≥‡CàˆN.4˙˙Ø ˜]∆◊
Ã˙ó…˛Ô ~˙ü\»⁄∞©#√◊∑G˙_èmÅP
ù¨∞V{¯ É–á¨•æVi⁄Ñı»Ÿ}ö‹∞5`¢- èæb®fØìU?›ãöÉX∑€ÿ“ ƒîµt∂j„™±Û#”_≈®v‚@¶¡˛4Rc˘YÛZ^Û‹U¸z¬Í[÷iCW¯ìÚ!à:n“ô‡ßÁÆ≤°—g"ÎÎæ£ù£.kﬂBCŒs ®˘û†4˝I ø^≤^∞¿]BeºMñì§ÂûnEA£Ëx´å\–‹P:Lü˚°⁄%‰`
¬ Œ®w^#g‘ı Ù∑©<ú2î”€Ùµûè1HÊ7gTêœÑq˜S"æÇ|˙~®‹@»D√€òhòÔ›È äS;äãÅj@∏§õ¯ÂÓ*hhp™)’X>å≤†SOk¡
s`∫ßÅ?PÇ¯Ï#Àãóœß{ï/„>¶Z◊¿∫÷Pò∏∆<Î¿π´Ã»4_Møçã:ﬂ8ó”ù®©9€©–P≥i∏Ò©tp◊P‹QıKVMoìUŸ#ƒ,_5Ω=45œh>ÛÙ¸¨ï_=’rw¯≤#34M¥"B¢÷!ª-ÌÉòZõ¶Çµ8G‡⁄ÃEXª	„πÜpîùπ¡ëDÕµy¡~ÊØmπ7¡wJ-é%|:'Iw≠0ÕÓ∂ﬂzm6,MV∏ªè6qí¿,,HÊ[E[”¶˘c*sCœÉŸì∑§Pë÷åTiê∏ucciìç/¨ØmoÆØ–~¥±º}§;©ÿD‰ŒAﬁ¡Åa±I¬!nxbøü!O217$}Ä7£}¿ÿ3bø¯√ô7»ysﬂãË‰{œ˜¬tØ:¨a Ã3¡*cÁı§õÎ®ÈèˇPèÃØà…˙è˙C"LaÚAuf<¬Ï8Œ	∫àk—AÛå√|ã1ü◊`´2	†ôAnä¨D≠ñﬂ$»|÷üöˆõt å•A[>=Ÿó·Q%$ﬂŒÔ*UïﬁÆæFNìÏÒc”$ªÕ¸∆rü¬«%B◊}€◊»÷AßA˛˚óˇA∂V∑»Fß^xÍ§okK…ùâü.~í&~æ◊RÓ§9öv{q7, ‡Ó@U`2˙ùV∫wH8◊y“»oSÄ1ÚÔ]ÅÙÅ‡;±jµË6∏UÑ≥…wÀƒÿ‚4¨%»&©<®PñAÿıΩîö\¨2 '‰gTL' ºr·Ñ‹∫[~
’”3î|°ø˙Ê—s"PÓ≤ 5s‹~• üÔÀä<0è∏(x"æbltøam>-¥˘úÛéb9àUØ„µ|å&pì,Êò
‘ëù¡fﬂ='Æg≤69'·ê<¶ã+ï^•"_J±\N‹åsÂÏrïÅF'€ÂÆIˇ+j·⁄%Ke«ä	HO∞‘”Øÿá•ü˛7ã¸Z@à±ﬂ?ò˙_1MÛk˛æéMe Ú¢¿Üø[ÈΩ˘Í ﬁΩ,Sd>ÈﬁºáVië› *"5Uf®Ñ.Pé*\√cKıŸ¯Ëålt◊ôr‚éW⁄&⁄23ùÅÇN%®”ŸË\Ùs\E_=∫:gObf¢ÎãáŒ‹îçÜNiƒNCW$°3¯ÓmoF_bim˛⁄ “"∆-.o±Eß®â/Œ_VTÕ‘úP1,ÄﬂÂ1T¥õ;S2E%Ûî„‡ÙÈ3¯Ê—ßú'ÂÒ«™Z—∫]ÑÆÈéÁ‰¥ äü“Òé±w≤C’
Ωd/∆∫T{>.«´QÿΩx'ºj•¢=Ãõ¶WÙó;V’2=áõlVÑß•≤¯ar¶U,Ö%æZÂπ¨0Ò[ƒ«˝ñ•˜˝V(AæØÍËk®°&+€zÇ& v¥Z`ü@)J‡5ÄÁ°∆â®WÊÌ@¡™≈P¨ºÕ˛±)ÌÑı∆´V'ÚAﬁ4UíΩÿÒ®æÒZº&v‚Pò6åºf©˙®W'æTæXŸ"ø;+OËí)Ç7Ì‡ÕNy}J9≤ôO†Nœ4Êó≈{ÎNÇt„Ã‹8¸"sqÚsj]±˜∫g›ºõH>5&—
≠˘Äèˇ,πÔ˙»º	˘ËBîÑëç°9ˇπDL≠_îc7{VÓî=Vô|	}ç˛Îìt*Ò·f~‚m@eøÓ
DÕñn¡b¥µéË≈ë †K:!¬:—gtÿ∂ÜÖzr2∑Æ*ı	Ç‘'òö¬•◊]≠ÄèoÄ≈3® èaöeŒ¡îyµFÂoî@ıf3B,+gÄÁh∞–G™‚1(l
µ9Û2¬ªÜ	…$UÙ“T¿‘∏n2±ånt!,3†∏ﬂn•ﬂÁSñQQ´∏æTcF7~¥„ÅT¨Ìæ†≥’à¡f‰äôÊÜm¬Æ‹W
¿ˇ@9ìvsˇé£}∂jÏNÏ^⁄ΩxìóèΩÂÁ\ÿ◊©jCÇÅ™f{^ÀÜ7µ∫1	Nóé°f’Nê!ÅÿÇaÖ‘Ÿ	©pŒ_úµ%'tãã¢·Ç:};)‘k’íã§^VXÖóÜı$g÷9L∫Obw)ÑÇÅß/j1fˆ\∂‰+Î{÷ÜÎ®›§C%ô≠¿^@¥¶õm∫…¶ÀΩÿK|ƒv⁄0‡ﬂktΩ∫ﬁ?≈]ø‘iÖA≤ÁÏr£±‡∑#®Œ|√ì˘âøì‡zè◊j≥XF∞®*Ù…π$¡õ˘mVﬁôöÀÆiø4ÈÆL®¯wÏ˝ô©ÔﬁÑ‡¸9Ò›õƒ÷ô]™Iµïﬂômï-XÏf⁄\g√ùî>3ËÑJi0\b≠¶áUyçÅˆöö!∏¬˚có.ê=¯_∂ÀT’h†ÅÄ’ÜK€òñA¬Vß\h“z€ùàMÔå¿◊›:◊Q€QzÑª§πh$@◊‰ç: T€—{Q€¨¶˙y87õS∏¡'ΩÔcYÌÒ©¨c≈5V‘ £¸+·Ω«∏¯~œ+l‡á?* õl›§O—ãs6ıb´L§ò?R˙~ –úBaÛöÉE©yB<ÑRÕ%/K.Øè∏-Öôv ¢]{µCx}¬Î 2:Y+ö^¨mÆØ¡ºÕYˆ`crg…æüö(n˝ä_®8—√â∂‡u≠ˆ:∂X¥‘©l&Áç¡±t)[§UœÁ∆ÑûCJÕÆ¢æ®rÕ;∆W˝…“ ¬˙ÍŸ^7πô∫eõ–ó'R™èÁz8ïN±|(Ëûe˚∆‚“⁄ˆYòﬂ\"´ÎãK+dk·ΩııïÇë€≠∂1Õië*VÙâ»_˜"˙Á…*+i_¢b%$Aôcmæ—ÁÏVˆã5‚.ÔM]ß°Ï]ÿ≠“%ˇŒqåâMF“Èµ≤~O≥6"8GÃ($|ıº"ÉW¿>HﬁßÍº§¯iπy˚Ê¯Náj$◊	~ß˛üt+úÁ†•&éÂ;ŸΩÿûÏßtG÷¥eÏ‡…‡˘cõ¥ÊÌ≤⁄`{∏s`Õ[w«Ëû”V˝+◊'ÿµÙÊ`}Ìè]îÍ=Å˚,≈ôM‘È ıπ
•|HEëøÜÀ3πE†PbüÓÛ¡õ¿Oãå5/Õi_∫JÈ;k!/ˇVœ∫Æ˜}Ë¶ﬁˇˇ…àdi≤‡≈>Yçö~Hz%◊UyuQÍÍÁ
Â˘.Ê‹˝$Á (<$∫Ù~ØG?•/†øy¸Oå⁄Çsâhú‰ä{P˘ÚÒ«sú>vú`î‰+ôË)ÕFIÚdT:Y(´SÒ¨X§˚Ó®B≥	8ëjóE]Xæ7k‚kIY¿N|NÚx•·â…ãì3ó&ß'f.ç∏Ü¢≤ˇê˘◊©êÒç˝çeßuè∂˘dπâ!”Ä® S%Lˇu#œÑä'ÖU1kﬁ…IB¡©èv,√ZΩ¯99:Ç{
-Ÿö∂ÏqZØEWø”Ç5ÓÎÌT¸—{q–˘pl"o∫“õLÃ4g&nV2òJ≠WSE`c|—X˜3g*œÜ„” ∏aﬁ8)ÿÇJÔU±´)vbLµ”ﬁc
ª4tñ˘¢•˜{SÖ%dZ±Èf\y&z_U,,ÛBE€|,ÎT op–1’Hû™∞1ÿ¯zûrÂ’Æ–;Gêﬂ<U©≤®¥∏‚˝Fƒˆ0˝"5[ˇ$»/`˝X¨Çb!˙TÍ±∞Ó>æØ`®µ/E›Àgô∆7_<<gzv⁄◊7ËÁ Í≈ƒo…x"∫¥;˜ÅwÉ*<è%ä‚MëÑ:nÛﬁ• ÆõQËsn†∆^–≠à¡µo?¶ÅÖØ∫©ÅıËŒ˚≈§F,µXUŸ%H6ÂYÒ39µ]ê˙^cœèïK∂˘7éã8(BπË›Ì∞¿sﬁ*´=°>`ˆ%…w˜M∂©àig*Å
ı`°ç Ÿ¢:Ê
ÔpøâΩ¬WéÕÔÆÀ;¥Q±÷86ÏÔﬂÀ€ö·s&ÅyìB¿_Ω•ºŒ0oìx Ó?)æíºíø:T†ƒ%Æs7¯(9˜–¸*9«˘:Œ≈æ√^˚(µõ	lÀoô›ü⁄ù›ùºIrÎﬂ˛»/¿—î[.Wªı.©"˜>∫Û*ßäs1'àF)K´†≈0ﬂÀ¥π4ìZ—IÜCà” \7‹\çÉÑπªöw´&[ò⁄Ú◊Ûu}Ò#ì1^`d0ûu,◊w¸8é‚Bñæºï1[_é¨˝Y≥XWNﬁáñúèÄa“=ûª§ïªW°ixBÕ<|qòd‚2¬õLy˘‡ÂüQn
ô]¬™5b$$FåÖ£t|1M_Y∫æ<€fæ’%˙⁄∆∂xß^e@BÑ5º‹±êF˜¯˝™r˚IØ¯UgÔõëÿ.ÈÉ∂D»s<|__¶VŸ◊1ÙÍ§˙!;£ÑäB∑W≥°ª(A£ÃÔ• 6u≤F≥πÑìHt¯IrWæZë}ëŒΩá≈°úlì>Ó${—æxÿK‡å √\X·§/|Üà≥¨&UaéHÀ¶¬1ŒífI°‚o—\…Õñˇ˛ÂT¸œ‹òu.fG≥Ωãàè-EÍÜﬂRe∞\dî<Ë–ñ YOXå|ƒb∆∞4Î¯Úºëkl]©’∂ÀMüÀK˛˙ÓÆ≈iDßú`˘µûqhˆ8UR|ÂI≈}Çq∑k“ì6¥gn3°˙µ°0k1ã +éµçLŒÆÖ 7Ä+i'∫ma*Åªﬂ§õHøÌµı™ïPÕ§ˆ6ÂUô‚„MZD^˙$ã:·Å˘·åS∂–kßc—w°«⁄`YÓdÕ)+Î&0Îúj™†p3è/∆ÙT≠a¬&hﬂÑô_ˆ\Ÿs–Õ	#¬“Á›4Õ·ˇIG˙cÔOﬂ¥MCÀtsˇ`Ù˛:ã¥ÒÄã>˝N≤ç˛≥∆HÀﬁã¥-U∂ÿ3ŸL˘≤⁄√\ãõN®‰¡ú¨·Rü%¢ÓÄ’©¯TT¿bNƒG¯√cqÁcΩ'Bj$<ÉŒ˝L87ˇ"›ê‚iòıÙ +3 öd>·/D<ßüqÊ`¸ªíg }∞¿ä’HI¬H –òÂ€#‚Å™ÊÂ‰˘¬∞7Oy£?®l¨õ©∆8˚‘CåYö9µ≠Àp•ÕÆ•‹Ñuÿˇ¿Üáu?Ku˝W:˝´∏≈≠(ï˝Ûc&öy’¥,è€∆EãmÀ qcÔNOïÊÂP;R53πUHøeMô≤Œ∫v:6SûÉ3àêà9•Ö—^<S[~⁄ÎíÛd%Ë|ò∏¬µ&^ÇÈWÿK fJ≈_ûÅU´#wª·–($˘€€B:Ü8éç,◊XeQ°ãpU»¢g≥J˚"√ë~cq´A^féW“„¡.ﬁ:T÷Ñc{új(∆∑ÌÌåX›„Æ´Üád∑YùﬂÏ˙Ò§Ga∏ﬂÅÙÓ¯{ﬁ≠ ä!Œ—é¢toà⁄¸‚ƒ©ﬁµ=dçeäX´Û<√•„æ(˝¯#+t·_*sIà…>C≤ÃÕ]VÛë)ºOP9>!µ«hQ:÷¢WBOo@á·ñÑò…–µfœ'Ÿ)	ÉY÷À*C
· ¸Æ ⁄c_gr™∞üÚ•EïCû®ÂÆ`m7häZMi8≤b∆é¿·—ŸÉWÁë'ò”ìÕ•µ≈•Õ#5
*‚≠ a|éÀù=[©ê‘4Ãﬁ‰Ø¯ï!øLFyÄ‘ÿ∆JØ”5V“ó∂&°‰ø ≈_["(jº«ITøô’ÊZªÃ∂y2H(√äºó+w¯áT3à©ßFeËßC∫')Î∫,TõÑ,ä;¿ß–Ç¥Œ|4çË=óñVín
¿è\¶á∞Ü¬ÿ7§ñvFπàp⁄®ùd8óÌöO? <45ns€Ì±ãπÁ¶ﬂ t∫º„§‡¯PSc´%∆N["nN’1QÂ:êPÍ˜öÄ˚ó˜¶ÎÁ·J'+xô1£|Ó¥¸Ê¥ÆMîQî˙B¸to∫√Z√Ù+¨@C’ †b‰ƒ¢èƒ· øZHh=¡‘„$g˘°[˚A
öétÅ@ÃçÉVæÎ*@MtV”?çÇ´$∂„Ço“lWO˙,@(x5pSˆ°
£(“yî•ñÊ}ˆü~ÿWb€PÑ`€2@≠€¡Z£QÃ}5£aL=u£±¥V: ÊÜY°%yºöù†ùR!.–˝ˇ   ˇˇ Én%8xúåR—J√0}ﬂW\˙∞∫AËîâ0◊…ƒATú?ê6±-tπÂ&›:F_ø¿Gﬂ˙~Q?≈÷v≥îÂ%9'Áú‹õ$ccH6ÏºÄj…ŒG`dfp1Aà+Iì›ˆi≈º†2¨“˜0ç<”@ò*!ÀbêÑ§vjçu0q•#°b>∆H¸î4K0RFí’É˝òu÷ ”;R~ÃµæÁKÈZaU˘öç-p§:·j∂çπ
¿u]∞=e√ÿeÒYÔeÒZoeÒa√Ï*ScÁSÁ€‘…ô:^jv∏©#¢’∂†E[gèHÜ«pçbC'ﬂÈ*Y∑ËÄp]_ı:åå¥~¬∑1Å∑Í	cŸî≠M*§26Ù˚@≤∫YZ4Ã◊°áúƒ… ˇ/Äãe§:ˆyçè5…˝PR«˛‹0GüÓ˚’0¸WÛ=ylåNIáù,jÚØv:Ô¥_.{yÔ  ˇˇ ÎtÂX