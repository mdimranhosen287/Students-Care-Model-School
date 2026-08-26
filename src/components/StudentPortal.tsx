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
      setErrorMsg(lang === 'bn' ? "‡¶®‡¶§‡ßÅ‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶Æ‡¶ø‡¶≤‡¶õ‡ßá ‡¶®‡¶æ!" : "New passwords do not match!");
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
        setAdminSuccessMsg(lang === 'bn' ? "‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!" : "Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        addAuditLog("Admin changed dashboard entry password.");
      } else {
        setErrorMsg(data.message || (lang === 'bn' ? "‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§" : "Failed to update password."));
      }
    } catch (err) {
      setErrorMsg(lang === 'bn' ? "‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶æ‡¶∞‡ßá ‡¶∏‡¶Æ‡¶∏‡ßç‡¶Ø‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§" : "Server error.");
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
    customBody: '‡¶è‡¶á ‡¶Æ‡¶∞‡ßç‡¶Æ‡ßá ‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡¶Ø‡¶º‡¶® ‡¶ï‡¶∞‡¶æ ‡¶Ø‡¶æ‡¶ö‡ßç‡¶õ‡ßá ‡¶Ø‡ßá, [‡¶®‡¶æ‡¶Æ], ‡¶™‡¶ø‡¶§‡¶æ: [‡¶¨‡¶æ‡¶¨‡¶æ], ‡¶Æ‡¶æ‡¶§‡¶æ: [‡¶Æ‡¶æ]‡•§ ‡¶∏‡ßá ‡¶Ö‡¶§‡ßç‡¶∞ ‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶æ‡¶≤‡¶Ø‡¶º‡ßá‡¶∞ [‡¶∂‡ßç‡¶∞‡ßá‡¶£‡¶ø] ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡¶ø‡¶∞ ‡¶è‡¶ï‡¶ú‡¶® ‡¶®‡¶ø‡¶Ø‡¶º‡¶Æ‡¶ø‡¶§ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡•§ ‡¶§‡¶æ‡¶∞ ‡¶∞‡ßã‡¶≤ ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ [‡¶∞‡ßã‡¶≤] ‡¶è‡¶¨‡¶Ç ‡¶ú‡¶®‡ßç‡¶Æ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ [‡¶ú‡¶®‡ßç‡¶Æ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ]‡•§\n\n‡¶∏‡ßá ‡¶Ö‡¶§‡ßç‡¶∞ ‡¶¨‡¶ø‡¶¶‡ßç‡¶Ø‡¶æ‡¶≤‡¶Ø‡¶º‡ßá‡¶∞ ‡¶è‡¶ï‡¶ú‡¶® ‡¶Æ‡ßá‡¶ß‡¶æ‡¶¨‡ßÄ ‡¶è‡¶¨‡¶Ç ‡¶Ö‡¶®‡ßÅ‡¶ó‡¶§ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡•§ ‡¶Ü‡¶Æ‡¶ø ‡¶§‡¶æ‡¶∞ ‡¶â‡¶ú‡ßç‡¶ú‡ßç‡¶¨‡¶≤ ‡¶≠‡¶¨‡¶ø‡¶∑‡ßç‡¶Ø‡ßé ‡¶ï‡¶æ‡¶Æ‡¶®‡¶æ ‡¶ï‡¶∞‡¶ø.'
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
      schoolNameBn: '‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡¶Ø‡¶º‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤',
      schoolLogo: '',
      headerNotice: '‡¶∏‡¶´‡¶ü‡¶ì‡¶Ø‡¶º‡ßç‡¶Ø‡¶æ‡¶∞ ‡¶§‡ßà‡¶∞‡¶ø ‡¶ì ‡¶∞‡¶ï‡ßç‡¶∑‡¶£‡¶æ‡¶¨‡ßá‡¶ï‡ßç‡¶∑‡¶£‡ßá: ‡¶Æ‡ßã. ‡¶á‡¶Æ‡¶∞‡¶æ‡¶® ‡¶π‡ßã‡¶∏‡ßá‡¶®, ‡¶∏‡¶ø‡¶®‡¶ø‡¶Ø‡¶º‡¶∞ ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï, ‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡¶Ø‡¶º‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤',
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
      alert(lang === 'bn' ? '‡¶¶‡¶Ø‡¶º‡¶æ ‡¶ï‡¶∞‡ßá ‡¶§‡¶æ‡¶∞‡¶ï‡¶æ ‡¶ö‡¶ø‡¶π‡ßç‡¶®‡¶ø‡¶§ (*) ‡¶Ü‡¶¨‡¶∂‡ßç‡¶Ø‡¶ï ‡¶ï‡ßç‡¶∑‡ßá‡¶§‡ßç‡¶∞‡¶ó‡ßÅ‡¶≤‡ßã ‡¶™‡ßÇ‡¶∞‡¶£ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§' : 'Please fill all required (*) fields: Full Name, Class, Section, Roll Number, and Guardian Mobile Number.');
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
      ? `${editStudentForm.fullName} ‡¶è‡¶∞ ‡¶§‡¶•‡ßç‡¶Ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!`
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
          ? "‡¶≠‡ßÅ‡¶≤: ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶æ‡¶∞‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£ ‡¶ï‡¶∞‡¶æ ‡¶Ø‡¶æ‡¶Ø‡¶º‡¶®‡¶ø‡•§" 
          : "Error: " + (result.message || "Failed to save settings on server"));
      }
    } catch (err: any) {
      console.error('Save frontend data to server error:', err);
      setAdminSuccessMsg(lang === 'bn' 
        ? "‡¶≠‡ßÅ‡¶≤: ‡¶®‡ßá‡¶ü‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶ï ‡¶∏‡¶Ç‡¶Ø‡ßã‡¶ó ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§" 
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
    { id: 'pottoyon', labelBn: '‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡¶Ø‡¶º‡¶®‡¶™‡¶§‡ßç‡¶∞', labelEn: 'Pottoyon Potro' },
    { id: 'testimonial', labelBn: '‡¶ü‡ßá‡¶∏‡ßç‡¶ü‡¶ø‡¶Æ‡ßã‡¶®‡¶ø‡¶Ø‡¶º‡¶æ‡¶≤', labelEn: 'Testimonial' },
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
          ? `‡¶≠‡ßÅ‡¶≤ ‡¶á‡¶â‡¶ú‡¶æ‡¶∞‡¶®‡ßá‡¶Æ ‡¶¨‡¶æ ‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶°‡•§ ‡¶°‡ßá‡¶Æ‡ßã ‡¶Ü‡¶á‡¶°‡¶ø ‡¶è‡¶¨‡¶Ç ‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶π‡¶ø‡¶∏‡ßá‡¶¨‡ßá '${displayCred}' ‡¶¨‡ßç‡¶Ø‡¶¨‡¶π‡¶æ‡¶∞ ‡¶ï‡¶∞‡ßÅ‡¶®`
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
    setAdminSuccessMsg(lang === 'bn' ? `${name}-‡¶è‡¶∞ ‡¶Ü‡¶¨‡ßá‡¶¶‡¶® ‡¶¨‡¶æ‡¶§‡¶ø‡¶≤ ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§` : `Admission rejected for ${name}.`);
    addAuditLog(`Admin rejected admission for ${name}.`);
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    
    // We can show a notification
    setAdminSuccessMsg(lang === 'bn' ? "‡¶®‡¶§‡ßÅ‡¶® ‡¶®‡ßã‡¶ü‡¶ø‡¶∂‡¶ü‡¶ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶¨‡ßã‡¶∞‡ßç‡¶°‡ßá ‡¶™‡ßç‡¶∞‡¶ï‡¶æ‡¶∂ ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!" : "Notice successfully published to Main Notice Board!");
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
    setTeacherSuccessMsg(lang === 'bn' ? `‡¶Ü‡¶ú‡¶ï‡ßá‡¶∞ ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶ø‡¶§ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá (${presentCount}/‡ß´ ‡¶ú‡¶® ‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§)` : `Attendance submitted successfully. (${presentCount}/5 present)`);
    addAuditLog(`Teacher registered Class 9 Science attendance. Present: ${presentCount}`);
    setTimeout(() => {
      setAttendanceSubmitted(false);
      setTeacherSuccessMsg('');
    }, 4000);
  };

  const handleSubmitMarks = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSuccessMsg(lang === 'bn' ? `‡¶Ü‡¶á‡¶°‡¶ø ${marksForm.studentId}-‡¶è‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ${marksForm.marks} ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£ ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!` : `Marks (${marksForm.marks}) submitted for Student ID ${marksForm.studentId}.`);
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
    setAccountantSuccessMsg(lang === 'bn' ? `‡¶™‡ßá‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶∏‡¶´‡¶≤! ‡¶∞‡¶∏‡¶ø‡¶¶ ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ ${newTxn.id} ‡¶á‡¶∏‡ßç‡¶Ø‡ßÅ ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§` : `Payment recorded! Invoice ID ${newTxn.id} generated.`);
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
    
    setSuperSuccessMsg(lang === 'bn' ? "‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ (.json) ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶°‡¶æ‡¶â‡¶®‡¶≤‡ßã‡¶° ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§" : "System DB configuration and audit trails backed up successfully.");
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
          { id: 'homework', label: lang === 'bn' ? `‡¶¨‡¶æ‡¶°‡¶º‡¶ø‡¶∞ ‡¶ï‡¶æ‡¶ú (${pendingHomeworkCount})` : `Homework (${pendingHomeworkCount})`, icon: BookOpen },
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
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "‡¶¨‡¶æ‡¶ï‡¶ø ‡¶™‡¶°‡¶º‡¶æ/‡¶ï‡¶æ‡¶ú" : "Pending Homework"}</span>
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
                  <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "‡¶π‡ßã‡¶Æ‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶ï ‡¶™‡ßç‡¶≤‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞" : "Homework Planner"}</h4>
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
                        {lang === 'bn' ? "‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡¶Ø‡¶º‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤" : "Students Care Model School"}
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
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "‡¶∏‡ßç‡¶•‡¶æ‡¶Ø‡¶º‡ßÄ ‡¶†‡¶ø‡¶ï‡¶æ‡¶®‡¶æ" : "Permanent Address"}</span>
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
                        <h5 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "‡¶â‡¶™‡¶∏‡ßç‡¶•‡¶ø‡¶§‡¶ø‡¶∞ ‡¶ñ‡¶§‡¶ø‡¶Ø‡¶º‡¶æ‡¶® (‡¶ö‡¶≤‡¶§‡¶ø ‡¶∏‡ßá‡¶∂‡¶®)" : "Attendance Record (Current Session)"}</h5>
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
              <span className="text-sm">{lang === 'bn' ? '‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶è‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü ‡¶¶‡¶ø‡¶Ø‡¶º‡ßá ‡¶∏‡¶æ‡¶á‡¶®-‡¶á‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Sign in with Google'}</span>
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
                      ? '‡¶è‡¶ñ‡¶æ‡¶®‡ßá ‡¶ï‡ßã‡¶® ‡¶´‡¶æ‡¶á‡¶≤ ‡¶¨‡¶æ ‡¶∏‡¶æ‡¶¨-‡¶´‡ßã‡¶≤‡ßç‡¶°‡¶æ‡¶∞ ‡¶™‡¶æ‡¶ì‡¶Ø‡¶º‡¶æ ‡¶Ø‡¶æ‡¶Ø‡¶º‡¶®‡¶ø‡•§ ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶™‡ßç‡¶∞‡¶Ø‡¶º‡ßã‡¶ú‡¶®‡ßÄ‡¶Ø‡¶º ‡¶´‡¶æ‡¶á‡¶≤‡¶ü‡¶ø ‡¶Ü‡¶™‡¶≤‡ßã‡¶° ‡¶ï‡¶∞‡ßÅ‡¶®‡•§' 
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
        '‡¶¨‡ßà‡¶∂‡¶æ‡¶ñ', '‡¶ú‡ßç‡¶Ø‡ßà‡¶∑‡ßç‡¶†', '‡¶Ü‡¶∑‡¶æ‡¶¢‡¶º', '‡¶∂‡ßç‡¶∞‡¶æ‡¶¨‡¶£', '‡¶≠‡¶æ‡¶¶‡ßç‡¶∞', '‡¶Ü‡¶∂‡ßç‡¶¨‡¶ø‡¶®', 
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
                ? `‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡¶Ø‡¶º‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤‡ßá ‡¶Ü‡¶ú‡¶ï‡ßá ‡¶ï‡¶ø ‡¶ï‡¶ø ‡¶ò‡¶ü‡¶õ‡ßá ‡¶§‡¶æ ‡¶¶‡ßá‡¶ñ‡ßá ‡¶®‡¶ø‡¶®, ${englishDateStr}‡•§` 
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
              labelBn: "‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ‡¶∏‡¶Æ‡ßÇ‡¶π", 
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
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">{lang === 'bn' ? '‡¶¨‡¶ï‡ßá‡¶Ø‡¶º‡¶æ ‡¶™‡¶æ‡¶ì‡¶®‡¶æ' : 'Pending Dues'}</span>
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
                <span>{lang === 'bn' ? '‡¶¨‡¶ï‡ßá‡¶Ø‡¶º‡¶æ' : 'Pending'}</span>
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
      { id: 'homework', label: lang === 'bn' ? '‡¶¨‡¶æ‡¶°‡¶º‡¶ø‡¶∞ ‡¶ï‡¶æ‡¶ú' : 'Homework', icon: BookOpen },
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
                ? '‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡¶Ø‡¶º‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤‡ßá‡¶∞ ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡¶æ‡¶≤‡ßá ‡¶ï‡¶∞‡¶æ ‡¶∏‡¶æ‡¶Æ‡ßç‡¶™‡ßç‡¶∞‡¶§‡¶ø‡¶ï ‡¶ï‡ßã‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®‡ßá‡¶∞ ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶°‡¶ø‡¶∞‡ßá‡¶ï‡ßç‡¶ü‡¶∞‡¶ø' 
                : 'Complete directory of recent custom code changes and modal structures in the Admin Portal'}
            </p>
          </div>
          <span className="self-start md:self-auto px-3.5 py-1.5 bg-emerald-50 border border-emerald-150 text-[#005c53] text-[11px] font-black rounded-xl flex items-center gap-1.5 shadow-3xs animate-bounce">
            <span className="h-2 w-2 rounded-full bg-[#005c53] animate-pulse" />
            {lang === 'bn' ? '‡¶Ö‡¶ü‡ßã-‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ï‡ßã‡¶° ‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º' : 'Live Auto-Sync Active'}
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
                ? '‡¶Ü‡¶™‡¶®‡¶ø ‡¶Ø‡¶ñ‡¶® ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤‡ßá‡¶∞ ‡¶ï‡ßã‡¶®‡ßã ‡¶Ö‡¶™‡¶∂‡¶® ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶¨‡ßá‡¶®, ‡¶è‡¶á ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®‡¶∏‡¶Æ‡ßÇ‡¶π ‡¶∏‡ßç‡¶¨‡¶Ø‡¶º‡¶Ç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º‡¶≠‡¶æ‡¶¨‡ßá ‡¶®‡¶ø‡¶ö‡ßá‡¶∞ ‡¶ï‡ßã‡¶° ‡¶¨‡ßç‡¶≤‡¶ï‡ßá ‡¶™‡ßç‡¶∞‡¶§‡¶ø‡¶∏‡ßç‡¶•‡¶æ‡¶™‡¶ø‡¶§ ‡¶π‡¶¨‡ßá‡•§ ‡¶Ü‡¶™‡¶®‡¶ø ‡¶∂‡ßÅ‡¶ß‡ßÅ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßá ‡¶®‡¶ø‡¶ö‡ßá ‡¶¶‡ßá‡¶ì‡¶Ø‡¶º‡¶æ ‡¶®‡¶ø‡¶∞‡ßç‡¶¶‡¶ø‡¶∑‡ßç‡¶ü ‡¶≤‡¶æ‡¶á‡¶® ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞‡ßá ‡¶™‡ßá‡¶∏‡ßç‡¶ü ‡¶ï‡¶∞‡ßá ‡¶™‡¶æ‡¶∞‡ßç‡¶Æ‡¶æ‡¶®‡ßá‡¶®‡ßç‡¶ü‡¶≤‡¶ø ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶§‡ßá ‡¶™‡¶æ‡¶∞‡¶¨‡ßá‡¶®‡•§' 
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
                      ? '‡¶Ø‡ßá‡¶ï‡ßã‡¶®‡ßã ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ ‡¶ì ‡¶Ö‡¶™‡¶∂‡¶® ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶≤‡ßá ‡¶§‡¶æ ‡¶∏‡¶∞‡¶æ‡¶∏‡¶∞‡¶ø ‡¶ï‡ßã‡¶° ‡¶¨‡ßç‡¶≤‡¶ï‡¶ó‡ßÅ‡¶≤‡ßã‡¶∞ ‡¶≠‡¶ø‡¶§‡¶∞ ‡¶∏‡ßç‡¶¨‡¶Ø‡¶º‡¶Ç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º‡¶≠‡¶æ‡¶¨‡ßá ‡¶¨‡¶∏‡ßá ‡¶Ø‡¶æ‡¶Ø‡¶º‡•§' 
                      : 'Any branding changes you make on screen are instantly injected into the copyable code snippets.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shadow-3xs">2</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? '‡¶∏‡¶†‡¶ø‡¶ï ‡¶≤‡¶æ‡¶á‡¶® ‡¶ü‡ßç‡¶∞‡ßç‡¶Ø‡¶æ‡¶ï‡¶ø‡¶Ç' : 'Precise Line Markers'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? '‡¶ï‡ßã‡¶°‡ßá‡¶∞ ‡¶ï‡ßã‡¶® ‡¶≤‡¶æ‡¶á‡¶® ‡¶•‡ßá‡¶ï‡ßá ‡¶ï‡ßã‡¶® ‡¶≤‡¶æ‡¶á‡¶® ‡¶è‡¶°‡¶ø‡¶ü ‡¶ï‡¶∞‡¶¨‡ßá‡¶® ‡¶§‡¶æ‡¶∞ ‡¶è‡¶ï‡¶¶‡¶Æ ‡¶®‡¶ø‡¶ñ‡ßÅ‡¶Å‡¶§ ‡¶á‡¶®‡¶°‡ßá‡¶ï‡ßç‡¶∏ ‡¶ì ‡¶≤‡¶æ‡¶á‡¶® ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞ ‡¶¶‡ßá‡¶ì‡¶Ø‡¶º‡¶æ ‡¶Ü‡¶õ‡ßá‡•§' 
                      : 'Provides the exact line ranges inside StudentPortal.tsx to locate, delete and paste code blocks with zero doubt.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shadow-3xs">3</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? '‡¶®‡¶ø‡¶∞‡¶æ‡¶™‡¶¶ ‡¶∏‡¶ø‡¶ô‡ßç‡¶ó‡ßá‡¶≤ ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï‡ßá ‡¶ï‡¶™‡¶ø' : 'Secure Copy to Clipboard'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? '‡¶è‡¶ï‡¶ü‡¶ø ‡¶¨‡¶æ‡¶ü‡¶®‡ßá ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï ‡¶ï‡¶∞‡ßá‡¶á ‡¶ï‡ßã‡¶°‡¶ó‡ßÅ‡¶≤‡ßã ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£‡¶∞‡ßÇ‡¶™‡ßá ‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá ‡¶Ø‡¶æ‡¶¨‡ßá, ‡¶ï‡ßã‡¶®‡ßã ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßÅ‡¶Ø‡¶º‡¶æ‡¶≤ ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶ù‡¶æ‡¶Æ‡ßá‡¶≤‡¶æ ‡¶®‡ßá‡¶á‡•§' 
                      : 'Never miss a bracket or syntax character. Use the Copy Code button for error-free transfer of custom logic.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-[#005c53]/10 text-[#005c53] flex items-center justify-center font-bold text-xs shadow-3xs">4</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? '‡¶°‡¶ø‡¶´‡¶≤‡ßç‡¶ü ‡¶Æ‡¶æ‡¶® ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£' : 'Hardcode Default Settings'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? '‡¶ï‡ßã‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®‡ßá‡¶∞ ‡¶™‡¶∞ ‡¶¨‡ßç‡¶∞‡¶æ‡¶â‡¶ú‡¶æ‡¶∞ ‡¶Æ‡ßá‡¶Æ‡ßã‡¶∞‡¶ø ‡¶ñ‡¶æ‡¶≤‡¶ø ‡¶ï‡¶∞‡¶≤‡ßá‡¶ì ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶®‡¶æ‡¶Æ ‡¶ì ‡¶Æ‡¶æ‡¶®‡¶ó‡ßÅ‡¶≤‡ßã ‡¶∏‡¶æ‡¶∞‡¶æ‡¶ú‡ßÄ‡¶¨‡¶® ‡¶∏‡ßç‡¶•‡¶æ‡¶Ø‡¶º‡ßÄ ‡¶•‡¶æ‡¶ï‡¶¨‡ßá‡•§' 
                      : 'Keeps your custom school logo, colored theme banner, and pass marks persistent across any user session.'}
                  </p>
                </div>
              </div>

              {/* Quick Status Info */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2 text-xs">
                <p className="font-extrabold text-gray-800">{lang === 'bn' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏‡ßá‡¶∞ ‡¶∏‡¶Ç‡¶ï‡ßç‡¶∑‡¶ø‡¶™‡ßç‡¶§ ‡¶§‡¶•‡ßç‡¶Ø:' : 'Active Applied Configuration Status:'}</p>
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
                  <span>{developerCopiedId === 'settings_full' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code')}</span>
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
                    <span>{developerCopiedId === 'part_brand' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Segment')}</span>
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
                    <span>{developerCopiedId === 'part_contact' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Segment')}</span>
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
                    <span>{developerCopiedId === 'part_pass' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Segment')}</span>
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
                    <span>{developerCopiedId === 'part_fields' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Segment')}</span>
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
                    {lang === 'bn' ? 'React ‡¶π‡ßÅ‡¶ï ‡¶®‡¶ø‡¶Ø‡¶º‡¶Æ‡¶æ‡¶®‡ßÅ‡¶Ø‡¶æ‡¶Ø‡¶º‡ßÄ ‡¶è‡¶á ‡¶ï‡ßã‡¶°‡¶ü‡¶ø StudentPortal.tsx-‡¶è‡¶∞ ‡ß™‡ß¨‡ß© ‡¶•‡ßá‡¶ï‡ßá ‡ß™‡ß≠‡ß© ‡¶®‡¶Ç ‡¶≤‡¶æ‡¶á‡¶®‡ßá ‡¶∞‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§' : 'Must reside unconditionally at the component root level (Lines 463 to 473) to keep render ordering stable.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('state', stateCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'state' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'state' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code')}</span>
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
                  <span>{developerCopiedId === 'menu' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code')}</span>
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
                    {lang === 'bn' ? 'üìç ‡¶è‡¶á ‡¶ï‡ßã‡¶°‡¶ó‡ßÅ‡¶≤‡ßã StudentPortal.tsx ‡¶´‡¶æ‡¶á‡¶≤‡ßá‡¶∞ ‡ß≠‡ß©‡ß≠‡ßß ‡¶•‡ßá‡¶ï‡ßá ‡ß≠‡ß¨‡ß®‡ß¶ ‡¶≤‡¶æ‡¶á‡¶®‡ßá ‡¶Ö‡¶¨‡ßç‡¶¶‡¶ø ‡¶∞‡ßá‡¶®‡ßç‡¶°‡¶æ‡¶∞ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá‡•§' : 'üìç These modals control data creation, located within lines 7371 to 7620 inside StudentPortal.tsx.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('modals', modalsCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'modals' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'modals' ? (lang === 'bn' ? '‡¶ï‡¶™‡¶ø ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied!') : (lang === 'bn' ? '‡¶ï‡ßã‡¶° ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßÅ‡¶®' : 'Copy Code')}</span>
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
      { id: 'homework', label: lang === 'bn' ? '‡¶¨‡¶æ‡¶°‡¶º‡¶ø‡¶∞ ‡¶ï‡¶æ‡¶ú' : 'Homework', icon: BookOpen },
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
        setAdminSuccessMsg(lang === 'bn' ? `‡¶ó‡¶æ‡¶∞‡ßç‡¶°‡¶ø‡¶Ø‡¶º‡¶æ‡¶® ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™‡ßá ‡¶è‡¶∏‡¶è‡¶Æ‡¶è‡¶∏ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶™‡¶æ‡¶†‡¶æ‡¶®‡ßã ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!` : 'Bulk SMS broadcast successfully delivered!');
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
{ id: 'change_password', labelBn: '‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®', labelEn: 'Change Password' },
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
                            { id: 'teacher_schedule', labelBn: '‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶ï‡ßá‡¶∞ ‡¶∏‡¶Æ‡¶Ø‡¶º‡¶∏‡ßÇ‡¶ö‡ßÄ', labelEn: 'Teacher Schedule' },
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
                            { id: 'exam_schedule', labelBn: '‡¶™‡¶∞‡ßÄ‡¶ï‡ßç‡¶∑‡¶æ ‡¶∏‡¶Æ‡¶Ø‡¶º‡¶∏‡ßÇ‡¶ö‡ßÄ', labelEn: 'Exam Schedule' },
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
                            { id: 'change_password', labelBn: '‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®', labelEn: 'Change Password' },
                            { id: 'user_credentials', labelBn: '‡¶á‡¶â‡¶ú‡¶æ‡¶∞ ‡¶ï‡ßç‡¶∞‡ßá‡¶°‡ßá‡¶®‡¶∂‡¶ø‡¶Ø‡¶º‡¶æ‡¶≤', labelEn: 'User Credentials' }
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
                            <span className="block font-black">{lang === 'bn' ? '‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü' : 'Reset Password'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? '‡¶≤‡¶ó‡¶á‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶®' : 'Change login password'}</span>
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
                            <span className="text-[10px] text-rose-400 font-bold">{lang === 'bn' ? '‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶°‡ßç‡¶Ø‡¶æ‡¶∂‡¶¨‡ßã‡¶∞‡ßç‡¶° ‡¶•‡ßá‡¶ï‡ßá ‡¶¨‡¶ø‡¶¶‡¶æ‡¶Ø‡¶º' : 'Sign out from control room'}</span>
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
                    ? `‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶¶‡ßá‡¶∞ ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá Excel (CSV) ‡¶´‡¶æ‡¶á‡¶≤ ‡¶π‡¶ø‡¶∏‡ßá‡¶¨‡ßá ‡¶è‡¶ï‡ßç‡¶∏‡¶™‡ßã‡¶∞‡ßç‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!` 
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
                            <h1 class="title-bn">‡¶∏‡ßç‡¶ü‡ßÅ‡¶°‡ßá‡¶®‡ßç‡¶ü‡¶∏ ‡¶ï‡ßá‡¶Ø‡¶º‡¶æ‡¶∞ ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶∏‡ßç‡¶ï‡ßÅ‡¶≤</h1>
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
                                    {lang === 'bn' ? '‡¶ï‡ßã‡¶® ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ‡¶∞ ‡¶§‡¶•‡ßç‡¶Ø ‡¶™‡¶æ‡¶ì‡¶Ø‡¶º‡¶æ ‡¶Ø‡¶æ‡¶Ø‡¶º‡¶®‡¶ø‡•§' : 'No student directory records match selected filters.'}
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
                                        ? `${std.name}-‡¶è‡¶∞ ‡¶≤‡¶ó‡¶á‡¶® ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏‡ßá‡¶∏ ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!` 
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
                                alert(lang === 'bn' ? '‡¶¶‡¶Ø‡¶º‡¶æ ‡¶ï‡¶∞‡ßá ‡¶∂‡¶ø‡¶ï‡ßç‡¶∑‡¶æ‡¶∞‡ßç‡¶•‡ßÄ ‡¶è‡¶¨‡¶Ç ‡¶ï‡¶æ‡¶∞‡¶£ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®‡•§' : 'Please select a student and type the reason.');
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
                        {lang === 'bn' ? '‡¶ï‡ßã‡¶®‡ßã ‡¶Æ‡ßÅ‡¶≤‡¶§‡ßÅ‡¶¨‡¶ø ‡¶Ü‡¶¨‡ßá‡¶¶‡¶® ‡¶™‡¶æ‡¶ì‡¶Ø‡¶º‡¶æ ‡¶Ø‡¶æ‡¶Ø‡¶º‡¶®‡¶ø‡•§' : 'No pending admission requests.'}
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
                        alert(lang === 'bn' ? '‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶ï‡ßç‡¶≤‡¶ø‡¶™‡¶¨‡ßã‡¶∞‡ßç‡¶°‡ßá ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Copied schema/code to clipboard successfully!');
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
                                ? (emp.status === 'Active' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º' : '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º')
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
                              <p>{lang === 'bn' ? '‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü / ‡¶¨‡¶ø‡¶∑‡¶Ø‡¶º' : 'Dept / Specialization'}: <span className="text-gray-800 font-bold">{emp.subject}</span></p>
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
                                  ? (lang === 'bn' ? '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º' : 'Deactivate') 
                                  : (lang === 'bn' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º' : 'Activate')
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
                              alert(lang === 'bn' ? '‡¶¶‡¶Ø‡¶º‡¶æ ‡¶ï‡¶∞‡ßá ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®!' : 'Please enter a department name!');
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
                                      ? '‡¶è‡¶á ‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü‡ßá‡¶∞ ‡¶∏‡¶æ‡¶•‡ßá ‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶Ü‡¶õ‡ßá, ‡¶§‡¶æ‡¶á ‡¶è‡¶ü‡¶ø ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶∏‡¶Æ‡ßç‡¶≠‡¶¨ ‡¶®‡¶Ø‡¶º!' 
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
                              alert(lang === 'bn' ? '‡¶¶‡¶Ø‡¶º‡¶æ ‡¶ï‡¶∞‡ßá ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶®‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®!' : 'Please enter a designation name!');
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
                                      ? '‡¶è‡¶á ‡¶°‡ßá‡¶ú‡¶ø‡¶ó‡¶®‡ßá‡¶∂‡¶®‡ßá‡¶∞ ‡¶∏‡¶æ‡¶•‡ßá ‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶Ü‡¶õ‡ßá, ‡¶§‡¶æ‡¶á ‡¶è‡¶ü‡¶ø ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶∏‡¶Æ‡ßç‡¶≠‡¶¨ ‡¶®‡¶Ø‡¶º!' 
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
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? '‡¶°‡¶ø‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶Æ‡ßá‡¶®‡ßç‡¶ü / ‡¶¨‡¶ø‡¶∑‡¶Ø‡¶º' : 'Department / Subject'}</label>
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
                          <option value="Active">{lang === 'bn' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º (Active)' : 'Active'}</option>
                          <option value="Inactive">{lang === 'bn' ? '‡¶®‡¶ø‡¶∑‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º (Inactive)' : 'Inactive'}</option>
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
                        {lang === 'bn' ? '‡¶ï‡¶∞‡ßç‡¶Æ‡¶ö‡¶æ‡¶∞‡ßÄ ‡¶≤‡¶ó‡¶á‡¶® ‡¶®‡¶ø‡¶Ø‡¶º‡¶®‡ßç‡¶§‡ßç‡¶∞‡¶£ ‡¶™‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤' : 'Employee Login Access Panel'}
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
                      <span>{lang === 'bn' ? '‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ ‡¶ì ‡¶∏‡ßç‡¶§‡¶∞ ‡¶∞‡ßá‡¶ú‡¶ø‡¶∏‡ßç‡¶ü‡ßç‡¶∞‡¶ø' : 'Active Classes & Level Registry'}</span>
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
                                  <span className="text-[#025644] font-extrabold text-[11px]">{asg.teacher || (lang === 'bn' ? '‡¶®‡¶ø‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡¶®‡¶ø' : 'Not Assigned')}</span>
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
                        <h3 className="font-bold text-gray-900 mb-4">‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡¶Ø‡¶º‡¶®‡¶™‡¶§‡ßç‡¶∞ (Pottoyon Potro)</h3>
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
                                <p className="font-bold text-xl mb-4">‡¶™‡ßç‡¶∞‡¶§‡ßç‡¶Ø‡¶Ø‡¶º‡¶®‡¶™‡¶§‡ßç‡¶∞</p>
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
                        setAdminSuccessMsg(lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶ì ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£‡ßÄ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Class and Section details updated successfully!');
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
                        setAdminSuccessMsg(lang === 'bn' ? '‡¶®‡¶§‡ßÅ‡¶® ‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶ì ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶Ç‡¶∞‡¶ï‡ßç‡¶∑‡¶£ ‡¶ï‡¶∞‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'New Class and Section saved successfully!');
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
                        setAdminSuccessMsg(lang === 'bn' ? '‡¶ï‡ßç‡¶≤‡¶æ‡¶∏ ‡¶ì ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£‡ßÄ ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶π‡¶Ø‡¶º‡ßá‡¶õ‡ßá!' : 'Class and Section mapping deleted!');
                        
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
                                {lang === 'bn' ? '‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ‡ßá‡¶∞ ‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡¶Ø‡¶º ‡¶∂‡ßç‡¶∞‡ßá‡¶£‡ßÄ ‡¶è‡¶¨‡¶Ç ‡¶®‡¶ø‡¶∞‡ßç‡¶ß‡¶æ‡¶∞‡¶ø‡¶§ ‡¶∏‡ßá‡¶ï‡¶∂‡¶® ‡¶∏‡¶Æ‡ßÇ‡¶π‡ßá‡¶∞ ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£‡ßÄ' : 'Active classes and their mapped section divisions'}
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
               xúÏ}Îo#IrÁwˇ9rªEÌàIëzYÍÅZ“Lk›/àöô]4”%VI,wë≈≠*∂ƒïÿ|˚¡0|ÄΩwÄm¿0ºÓÿ{ªã˝∞∑Ï•·ø‰"ÚQÔ™Ã,RjuØ
3->äôYôëëøà $˜⁄L“wﬂj≠ùÖÒ¥ﬁ!„¯Á‘ı°;rŸ´«Ëø&Åu‘_¸a≥›]Ît^≤∑}kX9Ø∑7¸A~/ŸÎ“¨ac4Zû›«æØ∫Ωò˛@ÒÊÀïÔë]ﬂ∑œFñIzV?∞›ëOjÛÃÚó»˜Vî{-ò&ç'ﬁ6Ì7Ò6NÎÇ‡?ısœì3c\o5∫äIÙ˘s5Ü∆∏VÉwÀ˛94/ñ»ŒR”hÈèç—˙	!Ø≠ÈŒ%ÎÚJ˜∑±	±Gé=≤Ít^¡|AZ0—ÌFó¿§7·œ…Y›™1≥ﬁm¶)ÚƒıL¯˚ﬁ◊j6W÷õƒs'#”2ÎCìˇ¨’_º‰ÙÌ:ÊÇ÷ÿu
/ú!Urc◊ˆ
ÆÜN?KKÍ=lØ A™6Æœuú◊fg±∏îôï›dıß?∞Oß‚-2`[ã˝t8¶‰¿¥ÚpÓHcZË≥ú–_iO0√S≥Í∂;⁄sÏ˛ÎùÀ cd:~gìK—N•µ—!ŸÅcÌ\:∆ËåÏÏÏê≈ì—"˘å,æ{˚€woÒÓ€øy˜ˆﬂﬂΩ˝œwoﬂæ{˚º Ôﬁ˛Ù›€_Ω˚ˆ/‡˝"Ÿ"ãt
ü„±=:[‘Î<NZ(h…¿}cy[•“Ñ›">l≠v€∆ÀPä8g$åëo„t‘˚Æ„z>ÈO<ﬂıÍc◊¶‰™1B=q≤Ìø9ã?“9… ∂#rj;ŒŒ¬»Yƒ<˜5|	ÉÚÄ∆˜pà‰çmù?t/vö§I⁄¯OãËiÔc#ÊÉÃÓ„ù:/±Oˇ&!ıÒ◊∂v⁄ƒ‹Yx“jëÓ£5£M⁄0íf≥/ﬁ¥Z·{¯;àø≠∑ﬂ‘ªCXªN´Sﬂƒ˘w≠Vª±—ﬁ Ùﬂ«≠}”Í>⁄|Sß9çÓ∆Zù˛˚„≤¢9’+0◊:?Ÿ^a\ß,/ÒB±o9V`}∞"Ç?#$∂πLo#§◊π…ç_PŸèÔæ˝	»äˇÄ?Ôﬁ˛:&.¯ÑŒ[`xÆoÖ“Çøi∆Ö˝lΩŸºìÛìõd›©76÷÷	p{´”ﬁÂr°’Zk¥VÅ˘[è÷·Î∂ê-X≥ÕÕ.¸ª—›x‹%Î√.ÈºYvÍk/|€¸™c¥HãâxS{OZoVüt»˙†µv+%∆uiop´ß“¨ä¶	mù∏ÊT÷‹fú8V˘m“Á]Ü/∑u“!hò≠µÑÍvﬂ™OÎ´R*O∑∑]∆¿_ %Œ<cJ	˙¶ìß«IY+¶·¿LÂÔË/⁄Õ¶√e||#•Õ¨tõ◊»ÚÛcÛVÎQwÿÍêf»…®¨E|/ucoQ/àæÜ∑Ù◊_m∆ãz˚Ié>£∑¡ﬂØ∫ÒOkâ>€O÷Q 4ïÄ”+qÌˆ†_M∫ä˛êô©⁄3–Vçë’fWÖHÚ∂œüæ˚ˆØQ’˛ˆØ©™ç
¯Ø©˛[xˇs¶ÅˇñÓ™†áˇÓ$BCˇªwo˘ÓÌˇc∑¸í~ƒﬁÉﬁ˛_ü–Õ˜©K®.@ÓGû‹â-ÛÈNºΩ2ËHßiúô•?≈mC„¢~éì7º®ì¿%éeò†
‘=À1.,≥‚º˝ú>/¬Ÿ¯ù£_QÌïøAÕ‰Ì?√T–yƒ˜ø§ø˙Ω˝W°aÉjÀˇ†≠|~ÛÔÙ˛_Ω{˚o¨ãÙ∫¸-mÈ/sñÊ¢ßˇ§M˛ªÎ;˙äçÍ[÷Àª∑ˇö∞≠ﬁ˝€œËí=áÈÒ-2ÅˇÉÅÁA’£ØÎ4 0Åæê…òÄ¬G|„çE¶Óƒ#†¯LA¥x~¿ñÊùj\§ÔéNÌ≥âg0ï¬∫èg›äª‡ø-¯æ§Â•?Œ˘¯j©}Â|Åö¸é˛U†ÔckΩ/÷èwíˆæ¸˛¡ﬁqèÏÌÔ>~ˆE—≥ñ¥6«±}√¥Üvø7996Nì¯ìì?v_$˜ÔÏ«ÈΩˆ Û©Ìê2q´môÌˆ÷5‚”=á∑ú€)iä≠{≠ê•3›≤nNí˝Å–ü†˚;ÙŒÇ∂NÜÊ}ÌπÁ¯:·FÇ˜¬ìtbÁñ5¢Æ§≤ms[Bƒ€É’ÑÎ™PÚ7πz·úI$YÅ¡ô‰y3*~M?˝)ìÏóí_ø•ØˇMHZTpÙÿ¢ì=ê <ˆå¿p‹rÉD¸jÈ(àw:1>P ùóaPoUûÜ∑1Ÿ˘kæô	°.õ®Âú{ÿ÷˙/	y˝-ΩﬂÒy˝ˇ=ˆø˚©û®ﬁ∑NAü"~‡}ˆŸº˜Ÿº˚ÀÑs!|aZ-}¯ÉRD≥O˘ÿÍ€ÜcˇTŒ!P2X§íı*Õ±åbáÈü€ÚÃæÁéÅáÀùrÆ‹eªÌ'ñìGI°◊?FSh∆SQƒ§…»≈ìô
$ïﬁ≤ˇÉÆÎØÈßˇÃ÷uãÆ"ü:7[íÈßOR˙¨æÂ¿öóéˆç·L¨ùKN¨{⁄{˘ŒÏéˆòÀöE=>†Ù2m‘¨F`xgV–†›H,ƒú5_‘WÒòß∑ürvÖvÃêÇM·‘ÌO¸-wPç˛QÍhMàå‘≤£ß&Èå{ÃÍÖ_ÊóëË*Ó’>Áªé≥†¿˘¸˝Î¥™G	~ƒ®√Ó‹^a-J≤&∂e˛C‹âS5ktˆ⁄“îhdüe~äßå}§Å~cÑæ<I[d◊ÉInúzÓ∞6≤Œ¡j1≈ià5ÍS¬b^¬••Úvóÿa'=9V:ÊãAœ*ŸÅ≥`ˆÓˇ´6…ÂÓ∞)+VòE5%œ<€$¯j*~ΩEú≥≠ËÌ*í≈ZŒü£¶ˇ‹Y,óiívX%∂u)-Á‹qΩõ–ÈÑÍÜ^…S;(óÁ ßzBÀWÛ∫TÕkKœ€S∂x°&∂!41(µ)/-ò[∞é¯ÏÓ¡-?J¸å‘T8%IÕ—ø¶
ƒw'hIumQ∆¬»ƒyΩá™m:G˙%˝ÜI¥üe«ÅTˆ•7dc(ﬂK‰˛ÇºI/¥Pb+´§D.<f∞Öd∆TM'◊ﬁÃ˘˘.ó¢0èb3>Æ]R≠Êxqô†ÑfØ(√K¶ám÷w·≥¿2˙Àc7†éØéñÎM¡æïè‚JÓNÔÚ/ZMƒ\»èN¢ç:_ÔkëÿI"DPqh≈0≤óﬁ‚√Ä,ç@…XÏ4˙S)Ï£æÂ(8EƒÈ@Ÿ]í©lG°wpg“–B=Øúê≠∆ÿ≥ﬁ¿öÄ5bLú†&°˚î‘>1r©∂Å4€<{ÙgFänCÇÊ∑-œ
&ﬁ®ºœæ;Ú¬ÙR ı;D>ÇF‡~9ÉZk¯>îÙ©≤“eI*ÿ»¨€¸ÿ®Bù»wáñΩ%¥&:¯¯®)˘≈û§]Ómü¿mŸ·'oíåB**Ë—ïOmÊ–xûÎ=Òœ2{œµ™RlváŒ◊ø¢Óm¥Ï”7á÷˝?≈oaËØbv9¸‚gü, ª.l?aX√Ò,√úä5€h@∞˚>YP£º«ˆ–¶V÷Uróñ…j≥ŸThMÖ)d˚ib{YCf«··ﬂHcó?^qŒHux}F.I£—»ÁËeæ∆ò@∞E|ΩKóaÜÕ˝˝oÏÇ¸zì~ﬂÚ˝Lrì`∏ﬂRoò∞ˇánw?èüq¸Âπ  ı0˛.∆çà„`¨&‘…ÿ4Àn¢#¡C”©K2TÏâTYÍäXéoÕGò´ Í€+O"4ò_†Å¡\¶tÖôÎÚÁBñ~´#8?J!˘B:ê[xÛ≤\õú´à{˘—H†b˚S"é≤ª¸ø*%4W#*¶w<5—õŒ=Ô7-õJæΩ∫ä/ëèÖ˚Z%^är[œ$˘D`ÛR®b⁄k#F”ä‰àõå'ˇƒq˚Øs∫kJ∞ÈôX®"~«œ˚kÒß^Jú|·'ãW<~"mÙ
Cw·¡˜‘0˝
ﬁ~zõ=O ˛x1ú'éD2;∞4òNÀÀE\˛íN
HˇÔ∂»T›°ÿ}ôåŒ€–I±gç¸oÂ˙óg˝hb{ñ)Ωë{oKÏDygyÁ¢O»ı⁄e(∏πLûzÄtSÄ∆%–ZÜg,»•ÕÇ\
œƒ+û~t3¶I˜•⁄ë^à‹Ÿê!t◊˙HEHÏ$∏ﬁ•‘±π˘{'<ZÕ÷2¸”éF¯…ç		TfÆ]H0çÈNH$/U!qLgç£zÙTÕVé¯pƒ≈o8‹9„_ﬂ}˚Á§Füï	˙ÚÊ%Éê /	s…axÕ ]Ãˆò{Ω'Ê™åA¿KÅÚÙ@Kxﬁ®‡*+ƒ®E'Â∂ù…3ÓÅx°v*œ.	tÄﬁ"`◊ãÑMæyΩi5„_¡ªÿwÒØ6‡õótÇÅ*Œ—(é[‡3t-Û#?ìí!ÿ]zö‡1Ë•êœ7+∞˛§fàü|†ÚG<…nükﬂ
òóÈn'(øR®4∂8y¿4ˆ©QèÔœéÉ˛˚s–R%3ZÎ´.ÉRcxÓ¿}#~â#…â•`(Z6íﬁÛåæÀã¯áÚ?ﬂΩ˝:öåè@‹°>Ä˘J“Cå…·âMÛù0~˘L[é m…8PHê†eVˆVˇıâ{!7-msg¡ˆ≈≥…Ôß-[f°tä⁄∫vπuìN||Àdl`o#{ê=nM‹Üî∂®-⁄ı9‡$&EîáqQqós´ëú”å[ñ¢e¯<ÜLabï3–ªQ)¬„R£™∂Oˇmxp”œ/∏–CiÛv÷[~òˆüxvF%@ƒÅ!* |ˆe% •v%–€Ù™Î–¨Ú◊÷Á/|:…`˜—%Äà§ˆúrïX(ÆzQqLí_)h/ä ï∫z%S∞í"5-•3J≥"y•°n}L
óZ2Üîéëß[‘Î*[ØSÖõìd
ükŸÄóÄ¬)ç„`ÖO¸òƒXä†>,VÜvmV_ÿı~ª^Ö	U¥)•@Ï¸ËŒËJÆÏ¥õ0ıÔc5\ÛÇ÷j©)HôØÏ√˘lÄs3LŸ†Æﬂà;ì¥¸Rêé“pI¶ü˝CnÃï!1™ùK„ça;òùÑˇ8îìÆv@¡≥ã¢a&)UIôêìA("êéÅ∆Â‘4wg›0Jdgè»âeLhî0Z"_xycÙ—zîC•f/˙¥o≈ÂX0Òƒëka–AÏC§rÙº±‚üÜë=å·R@1Fã%x2†KŒ ò∏C%Û &òJ±ÿ0®w U*/ü;œˆ˙éïc*D2l´%†¨—T”Ù;]ÕP7ˇõeÃ·jL?°>ÑW~S~U.6¨rﬂ
*ùgï(êÌå‚êF~œ\A⁄âX@±è;∂ês;&˛ Ûz¶’Ál´Ô:u|FÌ-ﬂ≤0"9Û‘Óÿ¶â1|bªãÌ::QÇa{,å,Êè¶£ ë"Q∂	>xx*«c∂%P6=∞åDö”L∏dN§b2@=R& Óc∆ê=˝◊Ëø9∑M%Á«∂Zñ/o2
éV;ôíµ˜x{%Tk.Ø/E·Â¿ÓÆµˇ¬ìÉŸôwœi4@0Ôæ¯ÒÛ·”s¶˘?MRgcëü"wL´⁄míÛÜW±º<S=bTÌ[%+∂Ã-ò/˛ ¨ÄkÎS¬_‰}" R≈î´©«°≤»&◊aUrbÑk`r¢ÔÉW6¡[ó]«YDW|œ "Ù„Ï›*Ó IXª0RB<õ 8`óMï¿	ºX§ÄruE¡*nÜΩ¿uz∞1Ó\Æ_%â{#ëö0'ÒÕ¥Æâ<‹<~¯ºíŒ=ëóHóñëˇã™G¡|‚jy‚D.õßÆ† å°5ÄF“5¬hÑ-†<}Xlfi∆KÂ{◊L)0[‚6bß™ê2YÍ˛……2±yﬁ~5Í‰—≠ Ωø2B9)sÆ2hBãµCk#–\ê©‰¨~Viò«íæYèáË˚V≥©ÿ	rc8X§¬ËƒVïI˛(”Iº„F]∂Ä‚pyÏWf‘·)ÔåÉ6Ü'0.1dˆ.6`ˆÅ∆p’RºÍK4Ó EôMùπq[RX—\?]¡ßIß:÷I€ü™ê‹„s≈†;ç˛¯Ü|JZW:ú_‹ù†ïÕÆÿx±˛âû¨≈˘RCG3ó±'-ÖT	ò©pgÌNk:2&A3≠f\”AwKTÔ£ïS≥ÛGhf°æ’≠îÍöÂ7nv:™…hŒRzÖ._,∑‡„˘<“âq‚ˆ(πwôî~WØÆt≥à_r˘{›T8≠Ëùóg∫Mìz˘<#ÿ#”>s√ùÄøçm¸ìêW¶];S;	°C∫œ[aöµJ h%;ø1*NE∏¸‰g;®f8≈+ô†Ú¸67∫îÍ¿\¬2UãKs⁄¬¥+ÊËd◊™\3g÷R8Í)ôíWÖM…+?£ÉÿKï,ÉLÉEQ÷⁄me$Ü#è)œ^,òQ(-UZ‡±·f[•ç–4≈eããïZ£ê‡<£Hª1ï|X©_Ë—µNâ¢PéeŒäümÂ◊¡c©ÍEGbïX‚I‰Æ∑h⁄6vµZÌ*’íR≠Ù•-Ÿf©·Û>e[y≤ü88à!zË…w(˝*ä?IäáW≈¡¥˜b÷hA†¸LØ`ø}%|¯ÙA‚MôtıÃO^U{†π%v»^s&âÚEyíÑﬁpbÑÛ ÕícœÌ˜%IÆQÉù∑˚R%Ô#≠} ñº¯èBÈ…Ã©$“’˙Í¶ã:¨nëΩ«ªΩÈÌ=:ÿˇÚÒ©ıˆéûˆ=;&Ωˆéûê˝Éﬁ·Oã
÷ﬁ@U 6ﬂ¯†çô«¢≈∂Y•7˛Ó”Æ¨§‹‰ÿsá.=Ñ£≠ıÇâ	F≈sÒiASÈÎnvµ:bµéû}y|¯ÙÄ>9Ä/`Ÿæ:<¯˙‡(ˆª˜ºX º¡Z±>äBeûo∫Œ;Õ<b≥Kæ≤≠sÀõ[1Êb@=Ç
Fü∞<iÅKÏVlh”ˆœÜ]»¢ïÁ`°•≥â·ô6Ï‘≥Tk‡JhZ≠<∑G∞⁄ç±[>àˇî´ÊÌÒáÕf∑ﬂ]}i¯Q«+Ü3"Kb†Â≈„∞’¸§ø†«D¿∫rù§t=û{cß≠0D˝9	óIÊ ìiz	ﬂÈ‘–3…	äAâªh2À8$7∞8π*)9G”26xlΩ±ú-ÈÛKq€"Ï?æ•ÏR,¶¥:EJ{Ø†ù
I˙éÍR(ØAcŒù¡0b¶8≥•ëü2Ãv»b≈:s_VL€0ﬂte∏ebπúaXπ;≈ß‰±1ÖY-1ÀÛ˜&-∞blW©ÖÓñ“ç1€}^q ÚcùÌ§ç√hÕ…'F∫≠â#É¿>¿›«_Ó<•∆é»ìg˚èQ3}ˆÏ1ÏqÌπÏqÁ~<;=µ±>QlÒ˛˚œˇûKIÈ∏ÙÃ¬aΩâVr«e„U:K7¢v$j!5} 
Ù)·P∑Åj^ﬁqmPµ›Ã™*ûõg∞}´π"K]ÓS5‘ﬁÂÛÉ£√g˚=*ﬂ∆ a0*·∆T¬)J… œûÅ«B∂"Êz<m≠∑çó`\†™±Ùí)øU…ÍM¨Ñù∂VgjÎ†°"Ûa(°+∑ïÍ_ÓÔ˛∞˜Õ≥œø˘˙‡‡O(mò∆Tç:B,¸BÈ;s8WDA$	°…!	æ„?†}´:àí,`y∂kÍÇÀ˙ñÉ»≤ö0˛˝E2¯%∞\^-Ωxuè≤~ÔíuâåÙä}+ê~<1p<K∞Á∫Cˆ ˆÇ›Ûzãúàø∫Rsñj„öLŒÁ·ì‡á‚µ∫wâì“‡√ƒ#ﬂòkeµIuµ`Èu0ÜèÄ?∞@å¶bx≥H@pe£8¥‡øµO˜–Sn—g)î5ü± d∂)-·§6[i›hCL0\|ÿZí∏∞ÀbYCˆ&˚Q´sÈüó+èoõ8 cﬂ1+ö∞∑Îï’b òÛ0H|ì?¢ÃÜãÃLœ[üÆÏ.V¥¶√\5°[·åD´∞öZ;0ªüÂëÖumP=ƒQ˜ˇ+˙ÙU"ÁÂ«≤ç\¡Á/ı¯˝Ó9>ÿ›{tpîrÁ\ÔÕEÃ•…79Æ‚≤Cd¶dÇ¢cx‡Na…É≈'^ÉÏûÄ∂@M-Lâ∏|nxcdê#c04F¯)ﬁvdú⁄?ÇA·√‚&˝96¸ë=$ﬂ7¢¯∞70Üˆ– Ωâ@˚¢·'0Ñyd¯Q_áCÑ¿#◊∑F˘xêó!&lLVÙÍ9U¸íÁø$∂âŸ…ò˙’äj'ƒ>A≈>innÅ¯©¯€5‚™Ùíl≤ùi≤ùh≤ÉM∂ö[mı&W3MÆFM“¶∞…åVπ…N¶…N¨…o≤≠”d7”d7÷dõÕ%¸’òÀµLìkâ&Ÿ\Æ≤π¨@5‘¯x|ÿ;FÇYÏM5∫ÙœÒÑr«◊ñIﬂ&ãEm≠¨¡∂Eh,2?é(ÈXƒt,ºY]ÄN_äÅœpzÅÎgV√∑Ç√¿÷Y≈ÈoíÇ>å˜˚ΩgOx.1:≥OßëπP)ÌÄÀ§o∏§ ÈÅﬂ!ÑP≈~Ñ$‰BÕvÏ`öÌãﬂµª©∏ø‡«Ç»ì<=Ç•9µœ&ûA˝™¨öàb≠#e∏Ißnr%ß.¨”)∆~‰ûK	ÓÁ∑√›Hb|Êû2t!ù–R™£5c?íU˘£˜ßH°aè˙Œƒ¥¸xÔKe¡:0yG…6¢B>ÈÑ.ÿXYù¯ƒ	ÊE‚˜•68.n∂ÅXñôR5L©∞Pb4†µã"=ü›’Q‹∏ßß˚∆‘ﬂ"/^ñ◊ö)Äˇ0áb_›ªåçÎä¶…
Ï∆ﬂL∆¥‹q)Hk>`¨¢°cıÛÅ{ŒóËâkNç∫*™ÛŸë5tAéÎ∞˚…l‹VB˜q‡_,€MÇ£4$`ze=:z0 =0≥´€(^›y¨≠¢‰«Â∏˘ßó)—«Á≤∑„jX∏ÆF?h ¨˚ •ñ.Üz9U^H=o–+%@ôúd#ΩåØﬂ2aÆØCì\—∏Ôx{≤vLc ≥ÔöÀ¬´«úx¨5”ƒß.“F*BHs≈rç˚"›Ò⁄ìlïπÈ·^QÇÃMº≈ÜJ~ü∏7„“<§Õùr)Œ'•‰ñ–_ñí˚ôè4tÆ¨6[•∏¯§#µXDœw™‚dJ…‚H¸<9Ê†¿[ÍSCü~ÔíOˇÌà- 1'(‘HlJ6Ç˘lÁç≤Bû
íÖ„^µÑ˚MJæÈí~ôí-™¬ˇ˙Y0…r˜Ôß¯*±D#b»Ï¬WQ?I;ˇõ< ZΩA)|à…œƒ.WÍﬂﬂ÷ˆ»r∆∏È¨©∏Å·êsÀzÌL	¢-&û≈ãqTBñg°ä˙5maœùåÇ**&ËÛ7ã&Êç◊÷‘èYñÏÙ&°ú~s€àHìù]ÖMÜ¥%;/c”·3ñÃ∂´D§åUhX¶˛Ü±O;IùøˇÑﬁ¿eª,ù⁄O?-ÎªòEäÈø¯õê≠†ﬂ "íwC—úd%¥DvvfyÏG2∑F«®7B…„{‘ÚƒmTANè‹Á”®ó•-ä Ôªö[Ùµvº.‡$. ^äTî¶kìÏWÍÊ∫\dH]m¨Ów·XBíRfEeh ]^,ìs◊{Ì∏ÜÈ/S.Ürø±Õ	»ﬁPZ»¿K≤√0…‰ñ$
»ñyêÅá4“u≤[eÅ=)úqûqx∞&^)¿&Øì'Öl&¡ôÈ|&…T∫â‘ àíï°îs¿ùŸÏ(•œ•î„3âc∆G?ßˇ& Y ˘>˘‘Îe•ºD≥oLÔÊÊ	Ü"Ú>8b°˚¬π‹<π–âˇ 	Ü™ﬁëÃÕìü˙Éh2G≠zd"•Ít˙ùn"î*M)’¯ñP=®Œß
u:Ä6>"à€§◊!&2˘a?@1ëÑ7´§†çŒ/°∫JyπYÓé…SÏeªo»çÚK#ÈÌì•K[wc:s…å1IÍ_§ÀÑ‘¸À$”Ãíí1≤á=5L´nó≈„“Ôaaª¬¢@~∞ÄØÎÚgÀùû0®©dQÀÍ˛‡Ç>1Ï9r}ú£'‘ƒÁ9Ûuú-
°T®PÃ9T-j®8{=L`˝º˛¢$!œ≠x-¡Ca∂Î≠V^^ªD\Q,JL2äú∞"$≤≠5äºÊ#»,√Bd+%œÔcC“GŸQπ£¢ÊµS¿)Ü&â›f·Å¿.jï≈%m@·ôì-ãTÌÒ√ù‘ˆMMj˝¯'uıF&5çΩˆI9≥^*fH<0©smìÕ∫ÿ¿Ÿ¶áRsüjÒ…πnqÄoÎ˜ÇÄ;7C¿q ˆ«?©›õô‘8˝„ü‘µõö‘å¢v3ä◊„6Raéè0êƒÓ*îk±B+°2ÑõàN√ß„uRî‚4ïÀI≈Íù¥ö©‡˙d]©–º,Xˇ0./7≠
˙‘ê
^p§A—û·g4©í·dhå«xîBµƒÅmCÂiïÇ¯î‚Óî¢”´HãQ
âN- ï@B‹IàùGsÀ@„*—â√Å"@Dπ‡"Ò0jÖ¥¢¡√∏~e´îü,Ù∏Ö¨æ:KÒÍ-‚Î≈í,πŸsù…P'ëlN:¬˝ ËlT‹±NÅéÇ@ÏUÕj™5–£K‘GU-ﬂø2I¢tì‰2"YÁÑµì™È´õÕ—^¢-t∆ØõJcWä.∂?,VƒAf Ô≈»∂HP1≥oYJµÏÊ∫–”≤∂∆”¸¡Mﬂœ_™•Ø8ÄUÙV•‘jÒU!âπ÷˝öYä≥N X•ç2◊òü∏,o›UfŒ©ñΩ4”0$Í\áÇÏA¯JΩËs¸ ©∆xÏDËNIÄ‹íf’Íºö±Çu¸R©çÄReÎ‰•”|ÖtÏ:áÖ…+:»Ú
ï† ú∆N˘äì[¨|î.ú~Pêú©8ÈÉBñ∏Do⁄)¡·AØëÁï
\?∏VVf?h(èÒÌ«Q‡πéC§r	‰X?Ô[ìdv-Ú^¥…®l„l⁄‰l—¬yóRqﬁ™6[LMcSºÃ5*Ò¿∫µJ„ãs0=Ñ’ÎR’A¢u—	fÍC’'Ã¢k,Ñ™Ï¬Éeµ:’s√x√·À*_˜N^ kf≠ë'Õ≠ò:….»´FÛùbÙû/Õ•¨Úts((“$b¶íxéD}Y¬dùÌ„ÓpﬂRÉõSë
ÕW055S˛≈Øj•vÿ¶Ä¨ÙÎÍ¢∏f.¯√Æk0‘Ÿ≈Õıâ∑'<âÿÊŸÒÓG¿uúÊƒ@Ú…Ær?Ñ|ñ”6∑ªh‹†IS&Ãÿ…MAíÈàF˚Vr!∞ãÛNıUûAMàÆå¬ 3Fb%´±^ïâIﬂa¬Wm¨â¸£aæ≈V¸8,ß\B¨$kYErØÍZ3·]yˆY~TQvJÿ¯6ªá%ß"Ù©~â>qm—˛‚Z[QäÍ4f∂ZüWØ™¨∂Ó~ÃÆ™€NµÚwxÈª5}ö©>µpΩF7?ÚfVv9∏7ı„d˛¿Ü[∫Uk.ìUÊë„Èöó…¯–º–‹ÁWVp@¥N qlâ!©í˘€ù˛òJ?‡9¢˜ï˚‚9!√ú ∞w=`ßÌKëF§¯c‹±¢7a&hÒKnª7ôÀÇ\=¿úy[ﬁ<≤(∂:{Å¢ô}A3ÌåY¬ö∞µÜ?e≠∂X_‘‰O<z„CÉbfæ÷?^öO÷É¢ 2!T9ãQhc<Ò’ ÏÚÑGUÄ`+¸,‚úÖîBEÁ.l_V|∂®∑Ô‡I„nù±î‰6 ^¨—Ú$Ù±z•æW‡Ô(‡˜3#(åËñıÊ.hë‹©ox¶Œn6gS∫ò7AlÅ˙ñ>}>:≈ÿHÿ!7Rﬁ=ˆ1Íãì>fL‰”œ∫¯<~mø±»¸p”hµg4⁄∑ìŒ¿ë»5<)¥>™J√ qÖ°¡"“√ï∫yHìuƒ‚Q∞ÊV‘Bﬂı•:öxw•%BM¬‡J1¿‘êDÚ±Í√“÷l√¶Ω(fÉñpöå˙@Øl‘QùÇ9ı]≈dIÚ√‹ˇ0 ‹\™˜~√ûºπ˚‚
≤µ’"ziF…ùÌ§ö∂í∏bÎcú¯`{–Rê¿˜ƒ√:^Wƒ”Öñp˙@7uÊã<)9‚†'#≈ı8„∏Õ\_∏[ã K2…Xg#ü∂ö	ˇx∆J”Ï‚áÀ<«*ÆGïv*
¶$ö€4æµ≠Ûú€^eCæO.ïÖCÊ_T0Ma?d’DıUÅ™|=Oœ¡∑ûÕôHª&˚åÚØnE¶XEó#MH3ÆV≤k3ÕY>˙Í	ü$U\ÚEÛÂg¥ÜMX rqm÷w+ˆZC±¢¯A™õÁÉ©o˜˝äùBTò\µ¬Ô´¨_wqŒô5Õ%Ñ∏i¯`õgRÕ }ãÔ	—áI!Ó'ÒRß≤=Å™§ ÛlI≤W¡òìØsTí–,,x±ö⁄XMºWp°™¬Kô¢Ø‘w‹%X±≥ŸJmµ¯«Vó€ÃC€%-…ì“∞„JLT,ç·(ÇTÏî∂O
ê ~7Ÿí5∑¬gUi•õÄûRaö¡ót`3:ºgfè&¨ÇE≠S_[öŸæ∫L÷Ó|‡w>hfÔ|‡w>;¯ÔæÛÅ'FpÁøÛÅÎÎŒÆ2®;∏ÓuÁW∫Ó|‡:◊ùú˝ÚŒ.øÓ|‡w>;¯ù¸Œ]◊ÂègÜöK¨nπã;f˚$r+m§íV)ÁR¢£»÷=älç47∆¨ên⁄
°iØπ”;ñú8'πCEãÚ2J3§.n* »ÔT ö•@yW≤¯"âäCë%
É[0≈ƒl…∞©&∞≈=$ay/ZŒ∞<+vBï–Mä}j_XXw	ÙÉ:•rJB+kMπ–˛1Z	î´íIÆ…	¥`z`mú8O˜^X,ûÒπ )4V„€€–∏®ü„y'¯ëUu¢œRé–˜ßîï¯Râ◊ﬂt2∂|⁄ÔÚ¡ñNí»Vö1]ÌAGalSI™∆9ï>ÚJ}^eúy©3BønÙ)õM)=^ LRœI°∫c xîﬂu
*4ÃËïC;ı,íÂçØÚ¸•Âeﬁx„3Ebo;∆âÂî`:ä:Ió≠ZD€SÍ9ègt"´”Ò‘:Æ\]3ê(´Ôp’Ã≈ﬁ·ÊWîz"åe∆övÓûT<‰™–ÔsÇò*>ˇ`H^Ã∫AÉ‡1¢WK3eÒèëñì19b•\™∆?™≈<ÆÕÛ®Á®Æí©S©ûU†FeäöùöÿºM≤ç˘ˆÌ7∂ÙØ#Ê4“È4:Ç9ƒYÅ“o3)t$“#t≠$SÂ®ãì‹/´jı∏TÛÃ≠œ;œú‚Œír7—˝•Ô¯Z;L<ï¸ñû¬ä<I›JW¢óz9^TπQ5Ãá«ê‹G>lC÷Õ0§8ªÜΩêwôπ.”ûY ë0cï9~ÁH|À92|	´ÉØ˚Æi]-›±ß{‚—-y:At•o⁄£ÒDç5ôÜç˝´È◊ûı£âÌYjäÊ»ﬁ¿ZﬁŒÇ’8kê’fkô<6NHK≠ªî‰†Á◊◊"6ÿπ¬µ»å[&*îÃˆj|⁄ûËÅ"JI«Ñ‘7›(∫ãLsòµ¬=!õy=Y⁄"¥qJK¶[bE1Ê∂Ï£æÂ(	Uu´F	}Í¡Q[¬‚iØZÜ4y÷p”ŒΩÜË†öÎ‹+Ÿâ€+Ë7ìUÌê44kqBÓ`7Õ∞î¿ë{^Ó\˜Ó9ø9rØÀO˛˙Ÿ≥ÜÜ=≤Gg"µ4Ÿ!3Ê£.;ÓPÇóﬁBˇˇúO ¸·å' Ô„† )@åéó|·Ÿ¶ö≥_››ﬂKQÌ‘p|ÎÜ<˛≥¯¸+»/È}óv÷ØΩç3ìó_««)⁄ö9ôçÈ9¬.–z(G¢ <Üg√Ò,√ú¢Sµ.	à3∂Õ∆ˆ X>j≈täçïCïYH≥c_àÜ#ùz`í‡£«é;µ,ü]¡‰±‚≥‰ÜN Ì+,T4§Öi∑î&§Ïa€T‡Í/⁄mjOÖEiß¥(≠zmõ,a°IL¡JZêv}@µü©Ö¨Ò£™¯π\$,H±Xä‚µ¨îÔòb)3Âu3VP)÷)◊(^§q◊eg,öu ¥Äz+™)R5Hï°!ä7™`á25øo´	X¥µV5ı?<+–q}Î}"“õ§∑îh·WK5E3§◊∏ÆC0ã/ÈYÏLgÂÒP‘Å€Ô`>ÛPÚ? òœ◊Æá°Ô!âL∆ÛÛÙbÙt£ö˝≠¡Ú®j°"àâeﬂû†ûM=xÿåL|xì>=í¿BrZßÄÜcxfàE'@TØ≠°O>ù‹ò“∏˙ûv;ºa*∫&›ÍÑc^æ`¯}≤¯ƒ•é'òY~ÒkÀ§Ô¸#√?0™≈óGΩB¶Ì3˜&Ÿ!™'J*ØÑ÷+PFp&ÉcÂ,≠™!j}ô‡Ne•ü¡¿/Yú=]Ñ¬¿_ ÑEÇ` ˙.~ì_‡“·◊O~É´âﬂ¿ﬂQ˙;\b˙´pmÚ+\v¸ä&~±(sœœL<8”Jûëä∏§(•∂πîfm◊¿ Ö«¿D÷–Úá∆∞—^ƒ˚ıLõ¯∂òEé Qó@˙©‚ÄÆ^]i¿{‚„ÊØb2üéËk&1’Å@ÍK§¨ü+Å¨e#T…’ÙwuÌ]WwW€6UÑc°Œûãuª6˝\e¡©nNƒnG”◊Ã{kûÈñ˘Ïy®≥Ñ¡¡§ö7ΩÌN˜˛=—Ω9m<µŒ9}8÷Àôø˛Q’ÔßéßÇ“>#¥ΩFIAãÇ*Ä|ˆY≠öí‚â…Ö>Yl]¡≤ƒïQï_”£˝‹0ƒyºP⁄íµä©*H∂πE^ıø~Ôrà∫1rœkKWØTc_G4$91'™?ıˆi∞Ö⁄´áÓmÂp[˛ø˚¬°Ç¶¸;J”‹´Ü›z≤{bNÚhj©©p*;˘K%J¢Xü°§€Ô[¿„˛YÌ%˜.≥yµ@˙T‹òƒg7£∞ù~ÚJµüc{hπì†5Hvº∏∏¥LVõÕ¶jãO„„√ü+˛.W§)hèÚiœ=lí¸ÍC
∏a§Å≠|;ˆ8≠f}wôøﬁ®?‘Ç€%YD’Àû¡€%)9â≠ª÷ïﬁ˜ÎÚU*›UæC÷%ÓΩC÷IÆ∏!˘>N¥n¥éOÑàÁê⁄‘¸∆;´˙˜À™N«˚Ã€®éì’ùY]xΩ≥öØU∆hdNEÎZƒ›Û∂ºäÊ5∆$QÛ:17¯)ÕT’˚Ú!∞dKŸ≠ıÃTk—9#¢Z|µ]Å0…”ç
<6{Î¨u!¶òΩûôœ€i∂«áYª‰‘µ∏∏Ã	_ÒéØc¥Bããä	 äeÌùΩØÛj~ˇÛG?”W/§.OÍÕdÍ'®?7TûÚ√]àΩ>ºPT¡5çüÏë}Ü˚œG9Û®É~´2€BÓòá^ÛÑπ˜ó˘*Æ7”BÆyÕ“ùi6wY2◊]î¬˚nr8©´ïoavÂF¿ıÚhhi‹qiÊ∫ÃèF^*sj2i ‹|†l˘°ú>Â˘ÔŒü“◊›˘”5ú?q“˚hO†¥óÎâ*å–¬s¨˝´‡î[CﬂÌÒÓC≤∂Eéû}y|¯ÙÄ<˚Í‡Ë´√ÉØ…ì›„£√dW‹⁄«K¡ulú0¸?èé˛i˝çmù/»û{úu≈è√‹ãüsµE∞ç÷z◊Z°hœt[r|Uàæ=XU™ù]9gàÔL√¥‹Oh9πL7ﬁt{e∞Z“£j–?wﬂsGæÎÿ&ı-#√ôvﬂ'Ó)dÀ)Ü⁄9wΩ◊ékòXmd“LRFÍÿ?¶ËÌíX˜Ú	ÔOûJÀµ•◊S–ºX§¡©Í∑¢∑´t'/]£,â≈¬:
£8Ë©n\ géÇeÁÑ `çΩ®˚5AiÈ/;,ﬁX˝◊ΩM0MC‚îÎ˝»™˝»≈ßUüÆÄñµT·2kÇ(#ﬁà+¨4√±=ƒ∏Uï®ì≤Ós∂N1äMÖbóº‚*Usï\=x—∑j5£ﬂﬂ"#ö¬é{	zx”0ÀTÒËìá§AK‰SíÏ0j0,Ó Ú˘‘˙Q}ërÂÍ'˝ÜÌ”ÇƒK<âàÏ–‰jô4óÆ»ch`‚YÂ0˘rH»I¶§ÁpÁ	ÃDñ5Èß◊Àó¥ã L˘•èôSn3;ÜœWÃã<våªvÆÅÈ('f¸HåzØ¬t 
›œü¯DÛıÒÇ‡◊J~¨è Ù∑ÎX^∞g{}Ávo
—cì!∆ãÅE¯dﬂ
@NYJ%é4IëÑ“bì¬œãˆJø,—îæ≤˝	ÏäèA¢∫ $qY1ÂπKTR-Â≥Ú4‹ç8ãÍñº(ﬂ≥~SŸüí^`ø§%’˛ÜfL˚k+p[ôø∫|ØÊÖ«ÈnºCÿô_ZT`'ÜOé¨>L˜6´è™ÛÙA˘FÃZßÖíéç…Ÿ ´õÁhÛ◊ X«»k ∞å3åÆ
4(y‘jÒ≠ê’Ê˘Sh	üµ))Q≠lÖŸﬂøúxSr7YDãDâ¥∏It©˘‘<Öi!TÑe\àùoêß-@`4√¢®G_Áwò‚—»√¸‡2Z˘´?"ü€é£&]i_äÖR3ÀùÎ¬›H3e—|	ârØa“≥Åmö÷Hm∂KJ¢A,çW2yñ…√ê1'«ÒÉ©cÌ\^ís€[‰’Ωƒ¸º"WWG∏“€˜»<S˛2∆òWƒùh≈Ø6i&g ´zﬂqa◊7V]UÖ°ó‚∞ ‚ıU6A≠Øn⁄ﬂ∂æE~∞˚Ñ<⁄}¸òÏy¸√¢'%Ô—ﬂf]√o@€ﬂòì`zÁmKx€`r»#d¸}ò≤Î «qG÷˝l°¸∂GoÏ3v&”hé–9F/(4‰lbõû‚Y!zΩ°=-^ÃË©Ë_ìjNŒY∆oVºfåp1ø<ynå,ß4#áÆ$ipP˝åSóZ÷œj (;“8åÜRÇ,V ]ùM	ÿÆiß`v¡“O≠sXX†™‰∞FıÆ‹{b§¶Ü}˜≠ πô±5B —Óó¡æxhøﬁl.íO	Ì@‰∂˝î¥ññ±©úáë‡Øe»Îû?÷hÌír÷SWÜ«>≠ˇ–2<ÿ,©Ph7€kãX0-¿ØÒ]ΩπroQîO@ÑslíŸÈ@t)∆9çΩ@˚è5MPpÉ…¶4
|Aﬁ¡úﬂW˘ÂuÍÍó"ËK^f,‘⁄ÑõÍ íõäUhã(‘ë√vÇ§‰gÒπE;r»4€npK	∞Öe)SÇ∂dˇCDK*¢I2 ≈òIrôTf"ö˘ún´«∞øŒ“
sc[`-˜@ªF®ZjïÙEÂ{:s»„Îf¶iÛ&’µVñ˙Q∆ú)£™ı0’Yê4-@¥™[†Å«.™5~f≥T˚πVQ±ë~ìOæ‘‚Vì‹$ŸSÎ£ˆÆãËQOπ9≤≈ﬁÆõlôÊ5w≤˝êâˆ#›z¬ùë*–ÍL¢åE.!f™≥_75s√‡Ja}ÖM.(∞¡lÊ∏E¥Äø–Aßö⁄7¶ºp∏≤Œ¶æmØ–bå¿∫äπ(nñ?bñËusI¬û˛˝Âï∞GÁÎJ⁄ü(˙êOh~fˆ›‚í.Ênàï’ú#€™‹í»¸¡±›˘ÈtWãq€ÕéŸÈ$p€)Gd<«wÚÏâ;–˝°<≥Ó‚-†gÕ‹!€œùâüáQM ¬≤âs7π≈úÊXËO	Ä° ó!ºeòtK”A96ü”∫U:æiÁlÙ§:>å<Z]”:«í€l<YääéKxW0«˚ñ™o-XÜYÍcOüß$b:U∞"§“g≥Ñ◊œmúë≈à*ºRJ	<Ö˝)$°Nn*ÓoØÉjPüŒC‹V´∑¡Lµ™øNl’U°Œà˚B!Æ÷J"Ñ˙E—*oÓë¨∂4'£À◊ú∆«Ï§Tü˛"á◊ìgg≤C+qfA∑≥˙Àó‘ˆ4 S^“~ìõ$„†(ñDwòπë<∫#7;[xé&W2≥Â˝D;S∂˘–A=k'"L4L}’?¶mŒ“öö6S† 7]ΩE}.∞á>'ı¸ÕVË"ÅŸ,Åáät1fYsïf%6à—,Oò
ØTØR|`Jœ5π÷Mã⁄ò¿’TÒÊ^^_7”M&c‘a¡· jÊ˜"Q?($}3iôäy£¬ŒÁú=
/Ö¥LÏJêÍª°Dˆ\ﬂ™ß´ßƒSÏ—‚¡™ä]V(Q-åSôWè=√¥´¶È£MËƒÆ*Òó|[ó€e–nÍÂJ<UtgC?k}u”¿Øç-“;ÿ=&ªGGªOø8xrÙ∏ËYﬂÀ∑å‡√Û–3˘π(≠)Œ!Õ‘Ê∂Ã›Ëßdá`k±O–´02k'ç ]⁄%Üs¬ﬁ“É[·œ°I—)Èæhæ,¿	K¡Ô	ü6?Ñ⁄,5>ß$6ìÂ5mêZ¶Ê\wF?»kg¥TÃ˙ÉÄÀãG©#¯z∏` ⁄}∏yZZıX7Ù¶≠÷bßk‹c‚ÜWû≈6Øı,VKØÃEPÓ$Ë»™∫uK‡l™Ê}`€bùÂ<á5íß¿≠l´í≠5n„√§g§6|VéqSÕ›äô1R¬F#o´rŒVécÎÌ™¬ÿbè&Õ$*œ"ötß«⁄V¥QBzåEÜRô9≈§Û‹ù©L∑HßôáÇSHﬁYmÛ9E¢‘ÂâIÃÈRT€|5”d€Ì:%’á≥Õv˛gHuTõÙ¸'N∞Ûá∂}ÿÁ?≥‹ÊqªŒ„“äàÑŸ∏≠
*!òò®˙ﬁ@√ÆãDuıLiúﬂÆ!g⁄˚·æªºÖ≈wVä÷ªfÆãrnOÍ›,Ptwb⁄ÅÎa≠n•¥í˜ñ°¶›àHàt¬[)¿‡ôoí›y‹ÙÅnwîÁˆ∏÷OjH˛“uÚÀí£∆?†¯Ó,¥îõ`ôºYÒÓ9≤¶∞ônf∑¥ßt"”%Án6œÈÌ`–g-DwQEuœïåU¡›3ì,Ô[âÒæÈ≠Ê„¨Õ≤&@káËc¨öAÂ NûúTûíòû1Ò·=6¶ò∆ÅπŸÌ√V˜RoËFZwS)T4É;)9–4∑0L…H_{Ó9æŒ%ëQÖfÏ…«¨µU∆UÚóÛîJbˆA∞yÅJ≈∏¬¸—Ì$?î¶ßõâ"«‹€[ ôYt˝ÄÈìº™éøØRÌT)å\¿¥Ç8kÈ$`œÀå¸¢’_($TWB\géF—w‡A’æ˜∞woh˘¡&
ocﬁ°•€º.ΩÁ2Ô»˘3µDQï˜˙á…©S|Á[EÜe›πgåZí˚s4IÌQkï+N!îVpãëbqX≠BLñ*û{*á‚xEÂúW ®¥˜;£<˙+k4—»Ë•0ß°Ìï?•° ˘¯¶îhÓÚ'79©1q¸ÒM+ı—tìsû‘XË¢yN≤o˘ØamEx”‹gYµbç1Å±Ñ∫"uÒ	=›P î˛¥∑†µ§ÆÌA*(¶“é√N
ÌÑxB>Q’Ü´∂ëNï´TÕê‚ÚÉØÔ=|˙’·áèwèüë˝Éﬁüê˚‰ÎGá«üÌÌì⁄ÁGœû/©ìEÖ	K˘tª‰¬è¡ë÷í9Ë7î=æx]"ÌOßûãx*Ÿb8áˆ®÷Ó,Á·ÛB.A∑ãÅ¯fô‚,Õ-X3É z.Ï.G˝AkQ˜*f˘åÆ(ﬂ'ÔÌ*EúQB˛ïNQN~P¢V⁄i:Ωpítö∞JSäÑ±ñ√Z:!Ù©rEç˘Hˆ3â/1ÒÏXÜâÃ¬ÇÆP‰êK∂<ö—πÉ +®cß≠ı∂Ò≤|$X©Ö1J†¡\"ÙÒSRqP [ ^äÛ≤§ì⁄=œÀ_∑D∂‰çd”`õÈ£ºñ#Ö)îXóc8‘
DÇA≠•‡L:ÿRO”Ïπ≠s˚‘´¢SyFXŸ]öÀÑòäÄÓ≈¿ƒ9&∏}´œ˜?è¡ƒwÏ1KfÈ30çB˛ Ç/Ò	Ë¯{oMh¿Ê9>ÿ›{tpDzÔ˛óè»ÓWª†Ø<<||òL˚ﬁBx5üoD“r’– Xô!^5¥Ñ"p-G -^˛`Ñ©ΩŸ=Å^…£©Ö-4÷®⁄LøÔY#(m8?0FaL∑84Œá:Ç±øµ≤Bﬂ˚ç…»rÛçæ;\‹¿∆Ìt÷[Î´ÕnΩΩæ—Óv6O∫≠’µœ¢æÉ~z#∏j;}œﬂ?ﬂ>øˇ£ùçÊ"π*¬ˇägi«üeûÂs√#ÉÉ!ûÏEOÚ‹sO-ﬂwuüe}µ≥π∂⁄›lu⁄ıìsc>0∫F{è≥ö^ö#„‘˛,Œ°Ô√úßAUîÙ∆Vﬂ60∆^ÛI÷öm–‘6◊ÎÕìÕ’n{£ø⁄jsxåNÚ1¸96¸ë=$ﬂ7πãr0:É·¿ê^@éè@ø—|úçfgcsHm≠Ôå÷¶π§÷ùùu3O‘CÈM†&#Á°⁄Æ„ûMcu]uógΩª⁄ﬁ\›\kvÍ'k'›ì¶y“Ü7sxûµ4°=1– è?w}˜é…û[#Bûµü£µŸ‹ËÆÆ5·qÍ∆i≥’⁄<]ÔüXÎsxéıÙs¡#è\ﬂ {éûãåBLj[~5Y÷Yo777◊:›ıçnΩª÷›0NN;ßßK·qrüÊ. KK{‚ã&\O∂É©˚‰1äÚylmTlÊå’≥ƒ1Ÿ√…P§Ô3`*qhò+…cé ±áõd‡N<^óœÔÑÄÂ˙àOÀ“,•◊óï®ø"œ"NÛ7dU
Ê¡‡ïº++dœp˙<ÆMÁÇúLazåÊ#¡¿
Á™¥9Êûµ"ä†Åä”,∑<yiñ◊÷4QXÛ ãn;4U1L—¢?”∆Ôêxu⁄/.#≥á„„J¥çÕ4¶ºèíõàèœ√'9ÃaK/Âf:Ü—F@Òƒø¢&8’OÉì∞¨~~+Jÿ(˘±íã˜ÈßÚ—»‹≤`'¸æÙ6k¿—TZ¿Ãµ;*exNm«yû)≈Éé@êvÀâ¬<)ä]	;zdC‘ÆŒdjÛ(û…≥˝†ìàwÕâ3‘(`íó¯·w»î*îæ≤⁄,¨Î≤™µ»Cud
π©9u”m0`ıˇ)+pìª©‚°ç¿Â‡‡Ÿ£◊uµÛcƒœàÔıÈ⁄°æqE'¿wåﬂ´…¡cºLéK	¨århÂ‘Ú<À{Ó:v∫≥0rÎ‚#≈ÙZ'_ÒaÒ◊œÎMF,j∞Œ|DPNnÅ‚ôå0¡÷’s£‚Ωe˜˙ÚÚ=aÒ*w–sBôºí:ÌxÔÛ=Ì*D‘6∫’¥
8™¨ûV¢Ó—,∏	ú‚ïïi—<*g?…,©£ïî«W ê/ÖDæ∫‹5ó◊Bµ|P/ó<s'È◊Z-(Æï‹Ô‘lÕ0A™tXñ_Iã©±V¸à‘…Ò`2é/(#éÈ˘Iúï%œñ÷ìgKb˝áeß˛¨é∆uù≥œ|”ç◊”<†∏6s´	‰s¸Â>fùy∏{º˜à<?zˆ‰ŸÒ·≥ßôﬂΩ7Ûÿsá.2ª‹∑|Áv»?¥·»ç†?@ﬂ1õœ9{.¨˛Ìfñº≈2…‘2º:ÿ‰‰Ñv.§è%-«>≥1ã©8—!ˆ(pâaæ¡Ùbf¥≥›ﬁÏ/e@˘ÓmMÁ≤.OHdœÉGˆlC!´Ke§ÏáŒÿs'†FTﬁ—◊¥⁄»U.æΩ›êÅ∂_GÏ´v¯}®dvqÜë‹®Ô
∏$º‘Eœmp3jpSØ¡=f˝ò.˚¨¥∆àßÑ÷é£>0Z´N∂öQã¯˙=Rõö}£ôÇû√çËÒ˛‚˘n∏Gê⁄{$ÍwÕ¶zl∑f%"ı∏n?∞∆;ÕÜZ¡-ﬁPã(¶1‡]≈õık"¡X`r´E=°øÆÂ«mﬂÇ˙FÛ+ftõ∏‚àØ2Ÿƒ	’UrÑÓ›lZ7û‰FI™q∏ﬁ˝#ÙÖáUÚFm4g˙˘SWx÷Æ)’îÏ.≈Ãœr>ﬂÜö˜c˜ÏÃ2kÅ¸™ÇH5LìfåÅﬂ’^—$uƒbfóI
¨<Çpr/©ÅÇ°u/©'P©¬dæ‡BiI-øs^ZÈÙí˘£›·ÿ±`»üêç»˙K‹¬LEÀl(A-Ö_G-π¥BZÈ€ﬂŒçScRÚL
,÷s–üÁœ>/¸uP˜¿|#Ë%˙ñZ ˝sœ¢«=Ûgàô_WçôOF g›/*∏	J„Ê€†Ük'ÊË>KeEé¨3€<i›sò·qR
Œß€&Èòvÿ#<À1.,Ôzéœ+YˆﬂˇÙ˜‰EÔáΩ„É'/IO BB!fç0xûÑiB‚6r®ºNˇˇ  ˇˇÏ}˝s«ï‡ø“fº&∏!@|ë¢hIER7§Ë#({}Z_4Üƒ¨v≈Xï¯*—πR[Æ:üí+Ø´ºÆ(íckeï~pÏ™+Î_Q›_∞¬ı{˝1=3=3= Hë'1zz˙„Ω◊Ô˚·˚ØÏP±E˙ËÛ†ÔzÉ∑„∏˛»/@ﬁÿÿZ.V ’:Y¥<Î∏®˘ùaœãzi~v
N¶;^YÜœ°√eúÉ®ïI√Í:dÒ√6–61ÑJ˘áP#ˇ’⁄∑z‰óî!Á#®ï.”D˘:Çœ˛]å†8‚N–ó][\]£Ø-4÷`Ë/ê’áä"2Èê∆–Ô€Ùhq{ScÄ∆Ë	÷–0ŸÑ†ª∂ÒˆÅ©ai•— KÎÔ¨≠¿í5n.¡ùk7◊÷ﬁ_†ºÅXÀiR¡È¡ø7ä◊7÷ñM {\°4©)I“Nc»/QÖ÷ÑïÁí|ô&ÌŸKq˛˝¢A‘‰,Ó«Œü¬n$RπKRM<Cœ@ŒxÏı˘!–ÖÉ<D)Ù†r‡ò∂Îîiªât†yxçï\\'[´Î+[ãW!–„∆2Y_‹¸e#∆wX¿ÿ2ã™¥ëAnm§R“â©≥V1ñ«¡∂üîÌX˚d›mYRx◊Ò—b≥◊∂{ƒ¢ªmˇŸ›&éO±›°á8ïäß¥ú“Aä›.\,S_∆ÏÕëóá`%'EyàÇhº¬[-€ÀÈ¨∂¿óqr´Xù‘◊≈ao¢ Ÿ›§≤Ç”CáLxì¯zK≈[:—!∫Iﬁ“˙#Ω≤Í=¥OÓÉ»æt™È5’ñy)	ê¸∂ªáõ»ˆ,1x{âR6Á.≤.Tz*¢ö¯gÊËg˙oÀs˚ÙŒ–+
7ªT⁄GŸ÷_ÉÌK˙ÑÏ¡2»†f¡⁄ˆ›PˆUºì}ìäˆµ/ËM@EìÀ8ó«ßêKt]Înë 6h˝ùΩÅ∏CÄ≥ƒSñãu*F…≤8◊ƒπ˘ë›∆w*Oàq‘J¶4{@yPü@:7∑O
◊ô`kËa¶|ËSè¢©êë∏›¬—%’§ÕßbËdÊ2ith"&–BáÊ,›ﬂŸx¿¥(JŸv|€Ï≈˛j†Œ8ËXt´ê∞o˜&©\4˘‚·◊/˝ÎãáO_<|˛‚·W¯˘æ˚¯˜cz˜SˆÀˇxÒo¯˚øøx¯#ΩıXy¯[zÎ≈√Ô')ˇ3π±≥„`lIò¯øAﬁWañ=n“$’ìAé≥QﬂaˇçÎ∑EÙx{ÙÃq˜J∂Örã’ë˜c:‹[?+WgÁ@˘£ÍÉ*µYàçWÙAöºn¶«4‰X§I\£«T`@ãRµ ˝kÍ¥ã∫úÚ‚·Hﬁ#I@n=˙-ΩÖ‡À†vŸm±6ïqﬁ Û™h#ÉÿıCÁq°G)˝TS‡IR÷pQ—jYÊƒ∑ê÷HOTåqA∞8Ür∫~,ˆÚQ|/ó:T⁄»àÊòÌ·∏“À—vcàÁ—≠	‰ùæ’á≤∆,é
]S1XΩÌÏ∂ã;Tn√@/¬ìŒ{¸*ä¡$o~5ßèZM˙Æ uE´∑‚Mrü“≤ÔΩ‚≠j•‹Ì~ Ü÷bõ~ªxæıAÓÚÒ˛s·c2–uÎŸ4–ãÊfµ¬JŒÙnëÎ1|äGJfÄëJâ\_Y\Ü»˝ï%Ù¶,4⁄ò*–Åôì+?õ”-∂™Súó,3^lπC”‘•õúXw€4∑S∏Ê$æ±*Mç,‰AhxŒ’ùÔC‡oePû%∆UåøŸv›N√@øƒæ¬–Æˆ(·H¸u•gñ¿•]5Z≠GdÇVÙaï}ÿX÷¡jµ<€˜uã¿2]≥êê<)AYj©Y¢Kbû˛(6˜€/>yÒËxÑPÓıﬁãáœ¿\ô∑Ï¨ΩÓn;˚6]ó€Ïsf”CÚﬂµÔºáØΩ'^ËÙv‹_¯ÕÆ_≤[√“v^1π“E_¸ËoGò˘⁄G„ó¿f
ﬁ@ÂfÊÀ™_æ”√Ã„Ã´AOVç£üj±˝≥dBÇ√$‡"d˙J%ß+jÜﬁ"ÖÿΩj¬J‚ê"yÒàÚÒÔcÑm;•} [›≠§—÷!ÈHu¢⁄ç=u†‚~“h€v¿)QM.®%ªL…{ÒrÁÍûœ£Q´˚˙¶6AµìF®¡K¶ªm$MÚÒÍEó€¿ÀW˚åI÷@mÇ’ƒ˝A;–5,ÊÕËﬁ»j8JiwÌò¯ˇ7î˝ˇØÊ≠ç!Ff™‰∑≤èmêpıòƒ˜«Ú´ËÖƒvÀ=ƒ~3˝p∆IcäûX≤¥à“‚>MË†êW'-ªÈÚp6Œπ@{@¥ÉOEzVÅé‘≠í¥H n˝F¿Íﬂ¯j√Áø‡˝áx–=•íŸ¯€Á∏Oô	ÙJﬂccv ÀN†˝ÒÏì‰¨^ÀÅ∫>Y¶G„æJ≠ﬁ ç¶ÁÙgsZ[7›1,ÆÒ“	Ö±† ¬©ïÇ;Vﬂ◊ÍáÁçOHxs€∂J®ÌΩà%e∫hmr‘ ∂¥*ÿ<CÁ√èG*≈E	È$™‡B<sr˛Ô&…·°V—Û9πg,ê˝∞w–>∆°jÜWΩê<æÔÚì ˛+º˚g úÔ`(«>ìåEØÃ&œÍ˜»≈~IÁ∆&D†Û”–4Vó_˙$R@Ác†30Ó∏)˜¢H;µ≈ûøG«√)œ˜eO∞ZNû`&ô~öHâ√ƒó40ÏËΩ|†¨&O˜â–>Ä˘†yÇëªky˙yáN[{∆‘z&πæ4ÿv[˚ÊC9é9÷Ω¥ÉLU+Ü˙,|i‡Æπ|ó(ù/Lïú^≥C˚ı…åc¯â)‡Ê˝íèæAlıô¡§I~k92Ã¶ƒß‰T2O–úwòı≈âÊgN8æBuVÚ 0{[+ãT*s®1Xú´ÿ”∏˙hÊ8ÏGîNrπ»2›Û¡ÙXÜìå~Ö¬∫/›z9≠ì‡ƒïW˝5y( \¶ïÚ‡í$ÌÑÈTâ•∞«õeSÂÑ\ê|Î¡∑…Ì4®8y˘`NCß∑l>≈·/@c·bóz,¶˜HD˚@ô"vÎx¥˛ÅqDœU„~}@“]¥¡¬≠Oô⁄Ä1WÃyÄ}«nˇÚ œÎ.ÒP¢?∞àS2h_¿[ ò@èk‚ÿ K~…Pî€î5Ú!Ü1V–nÕ˘⁄dSCA”u&Œ'÷ Wo€‹Æëû_i{?è©¯Á–lQÕ“ôôã√:Àï*w‚ò4@S˜^q÷ÃR≈JÉ?PÑ úù (`˚;¯{iå4◊wÑRÂXliµw«Ÿu:êQ6ÿÚ’î1Á™X†]Ho&+I∫¥ºqE5íâ§-Ç 0Nû{n‹'3™#«#\ŒØ‚d'k;§´G”È[PÏä;∫u(ëuwPãÎnû ¨°>√O¯îÁ©cPÈ{¨ß#ÎÛM≠v?]È3ÜÛÚú‘Âu*_°K‡m'P‚>¬3∏9(lÙ‚·g¥õ∞Á›{ûR»çxRúkGœûv¥.πwhÖ~–<d^nì¬¿Åá…˛1™m“á≤1› 3˘P¬;Ù¸„‘'’5Ç¶~ê)®ÿCwp*˙?ˇ‡å˚≥¢íÌÂTåR∏ˇ ¥ÙX∑s	ü?À*95¸Éi¥¯9öFÎ$ıY∆ É:ãFOVÒ)ó@I<ÇVÊàn˜Û≥ÍX|F`N`8:æ∞≠2¬Å3ííÌ»√”…_rPM^zÚ£“ñ4√Ú\∑õ{T9ÂÛ<j´⁄ø<]“¨°.©˛RtIâ<nHïƒ<∂ø` »è˛'cgÑG∑88¥:"[ar=áü`")'≠sÖP¥uBÕ’¥í´ıX!K}Çùøk∑úaWFøU@?dÆó—ÑÎ"§.$~„WX$yº|.É£d∞‘w¯„ﬂ§äÉ=»˘ªzÇ‚£ﬂ,0ôU≥"õ$˝y{àæˇ ﬂ ’ÅOÃB]Öës([Î+/=*ÈEU‘∏ ⁄2‰e8‹Û◊A+P?˙ÎãG	˛Ú\ÃöGö}$Êˇò©ó’%y§H4òL¸=#™J˛,È√÷≈¨3JÚŒÛ+òÁ'Ë DÚæ≤ª_≤ﬂÈ˛|§*†ê"-cª˝vG£gí˚èÿΩò*ƒã ∫b˛˜ò˙*J&øƒﬂô’ÿ’3y˜?ÑÛ˜”RÂıD=Ã&–πSπÜÅ‰è$ÓMo}√^Àôu69„«ZÖ&Ó™õ˘gπì„:R∂ü˘∑‰Ø%6ËOp*ø +l¨oN…≈U·ƒ†{rÀû±CdÇ&˜ÿlÓ„˜'Í¢?ûi\ÛÚXWﬂBÛø<ê]~¡à¸ÛÛ`ø·ñ¿É{PÙ›qYÚxÇŒÔöÎ¬1Øh˚œı˚ 
ÈÂˇá{æe ˛3sëBº/	˝;Öd{›Ü¸â§a7={`y˚§¿D]∑€µú=ı”÷Ëg™ÊQÖˇ;h!Mô*{®Öÿµ¿$H{	Ù˜ä_“OGiœ”?]gﬂ¬éŒUˆ©óÌ≥y?‚œ¸Ÿë0ã¿é„èÂ¡‹R@≥#Ñ¡±®*X˛@|°;æO;∑…æ/µ-œ$VW˝\_ñıı÷æ°P¬Tˆ 	Ã˙˚í4ˆâU’O˘ö’v˚™˝˙•¯k<Ω«åaÀA±™≥†_Ùa∏TxF¶ºNz‘Á‚o€èqFﬂs6F˙RNq’›aµÁË6ùu ;¨ôÄû∑˚ØíˆÊ{¢™mVúY9û.Î∆h>¨#)≤√J.†,◊& A/Y≥.M%¡∆ç§Yœ=™¸~ß«¨ºÁ{Æ∫◊Ûæ!’S"/ê≈˛Jˇ–/§&Cõ/ Ì:*_Ã”>B™`ç±‘‡\≥ü—˙\≥ütôª…éûI:˛l•0” KÂv†+e®$nXr=õl–˘""H[ Ä˛FØàRÇ%èŸEm3ıˇ£èæ1SˇÀ’c˙◊Ø∞/Ó˜…e§∞2XU”Ö˝HµR#¨\âÕvÛk‹õ@1$ç’pê√*îjcò&¬ 9◊3⁄x˚|«Ëh(1dô¬%‘}åÛg:Í{™b¢ß≤jä˘\ög¬∆¿wãM‡Y ºä	ám‡gÚ5GZﬂø&†æÛµàˆ{ŒÜˇ5ô∏|J¢±û
à!Ù¸VöÓãªO§„ehÕπS&<°Ñ/†AáıÛoë•˘
˜œe0≈ÁlÅßﬁπ) „’g—¿ˇ“µ¸Xı‘Á&Äüê	¿<≈‡»RN‡`/iÛqj≤c'§4«¯£·vë2≤ê◊éÂ)_Ÿ\'ÔÆÆºG66…÷ı≤º≤≈ lºª≤â?º≥¯ˆä>8∏ˇ®ı}·˚Ø@"H¥w$dª>x-1xr)ôjùN°AVo,Ø¸#Y[mlA	Ì˜6äKk7◊oêÎ´o_/^[]^Y[›zü¨-æøqsãŒ&°œ‘öƒp±·m´◊ÍÿÎé-∆K.ìÇΩ@6)C8(]sΩÓ “3gTí≤Kêpü∂\∂w¨agPH-i‰Ïê¬k={OºﬁÉ·¬•ÅÁt!Êí•◊f!W;°‚§M˝¨∂¶2Í]˘ˆ@4ˆ0dò¸ãZ∑pJ˜XÁt≥™iïJ•¡tFòËIô~VPƒxÅ{—~‡«Ã∞ê0ÀY}^˛â‡¡◊¨.Ì^Kﬂ!ˇÅu«øå+ÜhGÔg=Mô
Ç˙—ø±ﬂ≥z›≥·¥vÌƒ•ó-¶XﬂÚ{V◊-€« T<ãèX˘1µõCz∞ÙEÇKS≠mÿo°:à™A ∑ñ:≥*ürEqÜ•N≠fOÏï√”1+(h@—2πΩU|˝ 6≠‘s˜Ë!q;}`Ïi:'N·≤∞ÿi-w˝Ñpy	ÀäÂ ‰8êYˆWôÕÏÔ§Yé©ö=¶º¯\ù=4Œ∆±ÿvã;yZ¿¯˘…@”≥ëX–GåŸ)”â@*O:3C˘
üi]ª)Ìhì·’+§c,√¬…å-g®íﬁNA®¨.%ûd50y≥ﬂtÈrÔf¥WA>´oê≥`4°ììiô≤Õá)|YjçveË*§≥ª†|˙ñp7«†Ë»˘Kngÿ•3 ù·\≠óò^˘∂2Æ’“W≤¯Rõ=¯ƒ•27HÕjXÌ„¢0Ún[æôé˚ Œ¸	πö\∏âÓ
_(jÀ'R˚jV)∂û ?pÃß∆49e6¶ÌòæBµ›oŸ{ÉL¢c¸G˜ß¯–[-Bâñ::É¡çßÑI‘Úr¡“ò¯0x˛Bî1Mç!DD˚\<nHRÀ*äÍ«zp—Ñ¯<PU»üIE–T°3%QHCx~GUÃÜì√ÓH m5õCœ¬¢)ƒu‡DÖ43é’Ò…∂›q˜†.ù√\Uú_”'»%Ûmz‹˘Pˇ∞îFé≈e0¶eÌ≤Z¡)M‹^c∏›uó‚∫ÇCùáßâª$VóDÅGG™6êßö:I¨ßÆ©o3N3aÆp6Ó«ΩaîS‰Ô0[)√‰ÌÜ5ﬂiSß◊Ã`}∞ﬂÁ¥%ª\ØIo‘¯é’⁄óıbßQnoâË.Ì√Êen¢,§`ñ$`óëq§≤∆Ωópîı14Ω˜)ƒÿmJQmÔ≤nØøE
©$ò™ö&ÖV˙©ÄÅÁä±8vi∑4M÷)õÑ¨íí√PQ≠)Æ8Óe[ıw‹&Â^˘›†zøΩ´ñãíG‘ lŒ	◊érátπ∆är32©Ññ#m}ÉQ‡ô˜©Ñjë£ﬂâsQ&})ÄVÊäëGÒ;åˇ√®‘5îäﬂ£ŸJæ|r’C…˛E¿À5 fÿµÓ“Ê”Ê	‰$ÿ„$á!eTò*Nôì≈”Dl¢YNŸY§ÒWãÍ<âëı.(Î¿Lﬁ ç±ìòõÂŸñÒ‹=ˇÚAÌHX´(]éyC∫ù„biRºhX/ÁiÓ+B ’ﬂW8ÓjC"p@'¬ÿ]ÓûÍÅ†›tvú& x√&ÃÕ'ÆGönKï¡3gè(eë"–˛QÒeë•-ªŸÓ9M®æjyV◊'Öu
—vÄe÷õ€ÍëVa≠X\‘ì§e˘mªS™ı°ûî†r53*˙∫"«˝Pcq^r7(ùvw€ê &∫=B¯ê¡"È-=õü+!˝ÅÍ„kÖ={*Bˇüá√ ˚˛¿Ó≤Ω≤¡≈Ÿêdö÷•1ÈÃƒ√´ñC˝….dÕYﬁÂ∫UåÏrñÔ§ƒ“NÀ ≈´ÏI0:≤Y‡∫˘≠íA‡{^V&áßíÒâÕô#ãÒ¯Œ>f˜0w´ÌË÷ï»©g˘î\Ìõ~piœ	^N"˚îîßWéH7óqôló&ÑJ\»•0j5i¥:º4√z˘’,wzbÓDÈ3˚\IÛ»Û≠˝ÂKn∑ﬂ°4≤ïíªë≥1ÍÙÂc˘á@…,‚—Ò¯‰æ',\f{≈Ë„ÁúùÑøüê ;†Ïî˝ú˛éâoø≥®,‹=.¬â:
„yÂWS¿Ö⁄C]∂ıÉ±ˆÆz.mÕÃ#‚∏	{‹Gcd≠\gâ∏≠œÔU¸“π9oÄ9	^1Rïï˛Lpt|uNq˜@s“îÃÍ]—NÄ7ﬁ<£*E‡:N“¡çºDÚaå¿+T¸?Gﬂ }!#◊Zµ~¢òõ‡Úy‹x+]ÎŒ±6vç;î(èv}ÈòOY‰ŸQTÄXT;TDÿä*Ë¸Ã*__⁄Œ¥‚bË‡„®Õˆ"2“bEQ
√∂{«ˆÿ≠JmßV˘Ä¡Ü¢[VT 
ÉKsË˘ÆWÏª.˜¨¡„±ïµ»ïÖ´îfM&f_®¸œ/˛◊èπ WÁ©∑=™É!\Gq2¸=6dFÓp‡6◊t`ç“|^|Ï“ªÊq}|™¥˙s|l‡z5¬»LSøôÓﬁ•ÜxF\Éfõç§‰ApÅ‚ÏSrKO¶é”¸ÚAV¥\Ù-“%÷G>/˜eÊÛæL=‡#5˜á_∆ﬁÒ±˜ÂÚï_y<Á√W?˙eÓUæ“|Ï#-MYÂÿ“Ÿ7!È°<≥4|Œú¯“fË≠¶€q=?rnôaﬁQj>…)ûãlwKPƒ≥cú‚RPØÏ∂å¶Éui\iç±S€`6åƒÅ[òÑÛ(ë∆ŸPœŸêŒ
Óf€ÏŸvOüv πømd6ã•8ŒhäúÆ¿qOwñêúÂ?‡>°í kéoñ‡’,ñ`îhÇÒö∆ïê1„Y(9M»:ï@ZBaŸ˘àeıë)ô>Î˙ïLæ°F Ä’ he/pÈ«∞8QƒGgÊò2ÙËØV”jŸ]ßI∫˝ï€∞z¨Q“SY.Í VQÇpÄHÈ7[é∫DÑâÇhG±oF! YÜâÿEû4ÔP<6$¥â<Â1}‘`IÕ∏Y√8à¡êÿÈP
x◊4—IzÆdLG#ê,í+ŸLŒëô4ö9â¥jùÎiâµu\ûTŒ!é2OR∏¨f§íùgôdky“Ω&º´¶Èøûí™6+~#±ë/#m“3ñ£2õ<\Ω˜∂Í¨}¢Cd>+'¬jôΩêi®Ã_hö¢1G:`ñ
Xù%(eä˚Ñ–‰#ø†±¶ßk@\1Ö0úZ”ƒ°˙n.ÒñeKp|.·nAzL]6Ä4LõÈ¥LÂÉË‡Ù*á$Üyè˘òÛ<ÏŒ¡Ì]z¨ı5íŒÎyƒsY@äç™ÊpfqP b~á
¨Ù¯•ß™π¸HÂ¬€Ê∫<ôJ—Vªfl‰aW$õ/†*=£Ù\«G*^˙p‰‰L>{Ä N~N*πFã…[sÆIä˜FnÔ}Â’IeÊ‚™tîd\ÀmúW˙Ã•uÆQÙo¡—ƒ˘ˆ†ëêH´¿—;áH\Q¶XJsQèaeÑVxµH¿Ã°ùRZ˚Ω·n˛Ö88Ÿ4G˚ß"ùÊS¸ âUâ(ı≥xÚHg©@ﬁËSizÉŒÌécÔëÎ√Ìú˘éÛ—v1jl«\y45Ò7*:πî‘k)oèÀ¿‹÷¨£_,mq◊∫[‹+ﬁ™÷Y;oÿÉD” †∫…çè⁄)Âá˝9S≈5&çcY∏Zd·FÃ9WfﬁÒp¨ﬁ¶Ò=ë+\Öì>ÂoÂFã—ñ7o≤ÒI<Ÿ#p"Çs\Zj]„àx)ïœ#ï¢`8b!…G>“"±òÑ´Vk◊‹Üøœh•Ú≤ïœ¡mßáÆ™£Ã≈∏˛,te˙è™…:üú¸.a¬ ≥ﬁ0å‰é€π±â1ÀQ•î¯≤Q\ïˇ-Òûﬁ#éyª3¥ÂÄÒã2Z¸>‚P°s<`eÔÏõ“=ªëª*C≠ÿ√KUHï‘@ÄîÌJw‡è∆4òı≈zyŒßÛ“˘<nÏâhX◊ÂU«%π˚∏‰U:◊w)ª;#˘ﬁ’fÓÛG¸”ïãÚ °‚≤äC^ ê7ﬁÂbÜî9F`¨Th√$„ä≤$0eGè
÷¢.≠›©Faü	zåù.ÚÄÏÏf8neAr^»œ_ZŸ⁄à§{w¬‘√PÈ-èªèz°æ∂ùeÑÀÀ¡•uÿiÓÍ(ûB¡≈|Ü§Dû««%∏òë‰∂GÎDÒ)´êÀm'∏§øv©˙-èÿ°DRŒ˛—:Rùí∞≥H⁄⁄«ßx,aØëË¨—:y3≈t)8⁄˙5˜uRûÁQ¶ÚÜ?beéò’?»1âñ«uX˘ÓßT–`Æú‰ñ;¶†˘ô;¢Ë*◊N…!µlÉÒ SP?ÅNy«°«â>
¸kñJì·»s}m¶HMßO^<ºgúOU:z<·Âé∞ãoêè|&≥y2/ùØﬁb°‡ûMˆ›!Òá¸√û’@^Õ€D¨Â'ìWø59ïU"ÈJ.±„thﬂJ≠à◊;hV˙˝§KìèõM(íñ?P¶gÂ‚O∫¥U3TSÓ®6ßËXè„a|‡≈a:|çÊ>æFv¶_#∫V«∆rGÎ5∫€u¯Ÿ	;|çÍíæFaZπQ§óÀiIp¿Ò3ÚX˘"œıÌt∆[‰‡å∞˝Ycç∂<ÀoWèÉ7 ˜‘HÊ¶≠çK·"·°ëÊÀ∏XÆ,îõ’Ïÿk¨%ŒÍ£iJ≥‹Ü´ç5Æo¬h3öäiÖ≠∂M¸∂ªG∂;VÀ&ê ıé’¡Ç`G-=6`•xüµß◊äT‡J*¶ñXZ˙5ƒp )+ÿh(Å†åãÌÉ/=’&øuã3FÄÏ{ÎÉ‰W≥ûZXú˜√+Q≥:·±é{°àÜp˝ô3v˝—Í R∑Á⁄d¨ÇåT‰é(A≤âq≤M∑C¸Ó~ˆ(‡–œ©¡†◊Øg∆†@‹âáƒ†å´íFÇ◊|bvÅ_h†O/e
j¨rèDÅH˚∆;Æ7∞:‡÷kfH∫‘	‚Ÿa/t˝ìÇ∑çcAÙÎ≠XxÈ¬Né‡TmøaoùÛ√)(S∆ã5”ÆC9é≤°e+óG:s˚ú◊aF`*;O≥PV~ò’à˛w^êXd˛fZ1ñõÚ+^˚8ZÑU-K˝'µ5âW˚˛L˘˝¢‘x}.Û` J°)<f,Ë>ÖßIÖp ™ëÆ’£B$Å¢s†¢π5PŸ")›u†ƒ´?ÕÖhßk„ôNo@‰N*üS¿∑Ÿ¶bôYd…∏ kÍçrX Q÷ŒûÇ.F4)F8Xt6Í¢~§X—*ÚAê˝ ã·6@∆EèD,n2ƒT◊)K]ßÄ§Qô/Ò÷,…Å£Qz≤v˙7¢˙="Úx2°Í*˙?πjüi‡í	KoR⁄ÿZ‹Zml≠.QvÊ˙˙‚Ê˚dìrÖyyÄXØnK)„U√ΩÕ.©Àú+:uVçN’ÉóI}öË ⁄PÖl˛(‡=Zÿ\v6èú~ón˙6†ñ:⁄9:ÿ93p6*4°#Â1ˇi=/ı˘°/UÕ¯˘/Ù>§8ﬁ!KîË;êﬁ√7géí¶<êŒáq>“¿Nv90la÷rÆBˆë†Î‹†¶R√#?óAxá9ò=≥xıQ‚"O5¶RŸ“Ÿu%¢ÚØb™$˛√± ÍHŒ-À{’pı+q˛˝+÷ı˚Q|AÄøÒƒ≠Jú6Éoi›ÇÑSˇLôûóÖπ™z¿$r9©ê∞lÁÿöâ≠ÈéÆ1◊Ò£j£Ìÿù÷´Ü®QÅ-*Ï± ¢^qß’ﬁg◊ÈX◊{YX®⁄ÃéÀ-¶ç;&4hí…äo]_°ˇmÆ¨êı≈Xûú,-n.7»i¨,m≠n‹hêÕïˇrì˛¥≤LÆæè‹l¨lù[›5Â÷3~Ü)UJT¿∏πºrcãÈùﬂŸ\i¿ó∆ıïï-˙mï~~Ó¢∆9€ˇ‚hÑ,!}MX—Qé@ÿr÷,1Mç∏-ıx CœË8	æ@È⁄’Bñzëi"3ÌøÊtÏ-⁄ΩF,7∂sÂ∞SÂŒÔ„wµtÚ—£R∂‹ë®ÇcDı$H7§PBÕU£m€®0Ã◊cú4C/9âÀ•Fà—!ô™ÃgL9ì"k(#bu‡@ô˘1ˆ˛=oÀ]óûs≠Ê«ËlÙØxÔ)6|†‘‚·ôàû´·(“ÎùÈ{˛»«∫Ã´)Ú!>ïAáü*œ¬›œÖﬁÛ["⁄?c^XπP¶ú˝VÍíËŸﬂúI±—h‡çÕ·sŒgˆÉß,¶ÎbeB$√ùÑ¥Ivœ∆Z»†fe˙Z*‰ÇÏ”"-ÀÈÏá’¥MJ…”Ã‚VœﬂÉ®Ë¡¡’∏=È	ìõ°P‘~êl	!2-ôYâç©?R¢|EM⁄GìΩ ’ÍO'yPUj2>˛⁄©˘~X	,ÉıùÇ,f@™ |>”VtÁuù∂0√3YÇ!›;âRE"π≈w_C %µu¡Í˘≈ƒ~£≈+éí«:çÌ≈=dˆ‚Ÿ7@§ßªN`∏ ‹Ö –%‘º%„„ä·íãW¯á£W¬~*e—c•|"U}åöû&¥Èfà´g8ÕKê1≠Yr)Hÿ/	q˘ éuC=ü#Ø—≈µ6=£ÈÈΩOëM|<2ø”ﬁ˜ù&=*˘á#w∏nË‡¨v™|9r«+Ω›é„∑'ÆGÓ*Ÿé5qÖ˝{JË÷ò´òGTå13C∂<gwó‚›;»öæ„ŸË8≥Ó∂¨éiyZä√æK(¿P6ï"©áô˚›=üLTjí¥(.Ç´ÇQÁÃç¨ÉY≥Ü=–XëÀ≤ã•@+t|∏∫ø⁄*L"{]ƒÊ≈o_T^nË=	~s°wö«Ñ+5aG
¶>õƒÓ–3»ÙMt›oX` #;VßkÜZ€Ë”ÛÎ‰ûèï⁄¨_≤42"WÏ£ﬂ21Î3¸¸•E›b∂T\Êœû”kπ{´±9ü7^BÉVFû‚öZ)ô/f´Véä#‘¥à∫åt≈zˆ°eD¥˘motÂS≤+H™ÁïÅ¥çƒàì¢⁄‰˛Ly‘◊¶Æﬂ†©çæÔ@¶⁄æÁﬁ›æ†ó0∫àŸê:÷æpƒÏ7´ cL◊ù÷Ââ∫f¬π®;Î¥Z∂Qú›Hg
£Ÿ8‰%
˙Â¬BD˚_Ü∂∑œd]◊+Lñvúªvkr
*‘^ﬂZ_„›·)\s1±[˙Aõ¢ÿn;–∞l⁄Vs¿œ#ôäsL°£9q"ÉøÂ¥˛[ˆˆ|`Fı(S&.öÒ ·’≥Aln‹‹ZΩFñ≠Õ’îFàı≈‡	nÉ86àdóçÒY Ù.ßﬂÒU≤"Í∏ãg	¸˜<∞ì•0Â±Ø†â!9@9ù,tˇÚ¥fEG∏q<Ïπ"⁄>P¸[˛8Õ-rKûÑ*†≥ãt|ØóœòÚT¶*x,Ï≤Ωµøbq,B[„Ω˝{·ï Q†Å‰i`Ø	`ì…TËn7çÆ◊Ùü&Íâ∏˚5˙d∑)ÔÀä
-t·∆n·‘]"ø¥ÌæRsaà∫Z§≈‹¡ÈÛ˚ßNıo†¯á\°Ìbmé»r˚XN@¿¸&‘T3&ö"L»É	”É{”ƒA«4«'Œ3l;á±£"◊"œÚ|ÑD•Úöµ1ûâ±‡^…g™∫~(JÒ"=◊ÎZ+ËÂ|Gé„¡¥≤•ŒâaŸº∏öñRÛÌbÈX#„>Ú(Íz/rfé÷(≠
—¶˚RÜ˙APK§zºDÀWÔ—˜| R˚ŒnœnôU^¡Ö0Õ›j`zñîa°Ë«ı#Èúx'yN∫˜NiGìG≠tdmg5Á‘¯Ö˝<◊wDë9äøA‹¢	c‰
|ÉkdˆtºäsQ±V"[+ãK◊W6…ÚjÉäâWoÇ˚Y∫æ∏πEfòπ|sÎ}~Á\h<BcíÁ¯DFùkÈˇZ“o
©%5R—ì¢√5´9Ïˆ	zˇ.Aº‰+(>jennOãçÂb`4Dˆ1cl–ÿ¿©&”?cäı€ÛX“Q·YàûA¸!ßæ!â4Q∏å∆ÊÜ8∞@dØå∏é1ºîq)b(Ó∞Æhpr†ÅvÑ∑9úπ>‰ò"q©0	Yπ J¡¬˙˛˙ÑùB¡Pq¢G±∞5.±0ü–'ßW”ÀYΩF{E•“§É\i•9‘*ÒÏ7Ú•(uìñ!\Rèæœs›n~	7_"ü\uO§d‹í±qå„ãcÒ gM(é˙Oê\ˇ»#QÿQ¢rŒE·DaCGìÑYyaÕ[ßtC9Q1X“äÃnÕù¡»õ#›I‘Ë/cÎ¿ÛK≤⁄'/
õÜ≠-øcq}uâP◊!ºÎ⁄∆Ê:YﬂXæπ∂“ 7o,S9b’Ç|c„X´T#÷xH7ı6®ÄC‹$oH£p~I^≠ß>7ñzÍ#HÓG≠í>¢∞9Çº%£¬0¿è”4
·oQ[¸ß8æ,∂dl8à	\qDD‡¯qóEÁ,¯2;ÂÃÌïÍ>çƒ\<T„}b∂F,É˛{≤q_o”dÀ˛[ÒÓö≈Ô˜m◊A—ÀÈ1zÂw‹À(◊§‘›≈ºK ØÅÕÃ}"†gÏ•—s„LÑ¶Ty6∫–ÅÊ€]'Óq=ízLJp¶*Øòá?é„L	éÓÔwb˛Æ_ˆÎ'[ê56ßwˇ%ß◊ö∫ˆ≥\Ë0!SáÙ>e3Ï6ùÆÌ]û∞Kª%r›Ÿ^º∑)1_≥∂Mª‚Q={èS»3-äÜùË¢	nÑzîIƒ§T*¡∑i¬ﬂ≤@¬¡‰–TÊ—rpPMé%ı
î	ë<J@Y
ﬂfR`∂ŒfÃï±ö¥añ°R6B¢Ï„«( èÜ(÷/¥0g¯9¿uv@ÔÃƒ“n8] ëQÆ‡¥!ïÚùÓ‚:)ír>æ≥~4Ï∑ßc∆x≈9ˆ∞ÎÏbOj‚É¿}08?Æ#ΩÈ∫›”éS0FR-Ëoÿ•G$‘|/"¡+Œâ]gKqã)ﬂıÏ;dZè˛¸Üyp[b‰òÃœÒ'°◊˚AJ»,|‰˝?“ç¯#YÖ<ê§_czøé¡ÿM^–ñ zÔ–—í6_3è!cπ„«;&K!â|¯{Lóê)÷õCœ≥{û˙0N¨æxr|ÛB@≈çê[ ∑Ë√ »ß	Rå0DMßµ@no_? ∂æ‘s˜
Sá∑…·Üo<4-pa÷NSL BMç›"Ø'…πÃz.<)ÓH≈¶‚î÷tó§ l^;®ï≥÷„î&5LûqH„i<ÖÒsÏlô‰ga≈–+¡|—qì√f”ˆ˝uWGÆBUF°R5∞ﬂcñ°gëÚn=l»	™Dàá}-‡R8˘lhp*ÓKX4¶itÇ B–æ
2zt∆ììS”§V.óè€4éLä∫áV Òh•tÛò6˝,pYŸ”«c3ÒÊdï ødIö>÷[£É7 •?nØÕ™¥ÏHÁMp—\\[€XZDˇÕsÎŒ…[w¢éqó6≠ßÉbi@OÈÇ®‰Ewƒ≥nÊI≥‹<’ﬂÀÉ“˜/îI.ÓáxüQÔT?BÕ¢w:,ŒXFÔ1É˙% ™ã
î±†mvvÑÎﬁπe'Î˘q+4(¶O¡¶f]Ë¥éªñWìê+yS ÷æ2Âò‚=7™ho.0!d®ÛJ∑%æ®§ÂÓ€6/<f√Õ+pY^\ﬁH∆'ÛZêå3U‘9‹sK-Ñ(+’d‰È¶e±µXÌLπbo…è%œÌÿ F¯1~≈°yô\„ó⁄$[J‰Á"I∂d"j£$[£d”2ˆêg~“·}±®?]≤/ãà˝Ù©•∂Î˙vË•?ÊÕ'u ˙”ØyΩáÉy
bN*&^	>Êü©ˆ.O^¨≥´dˇI÷IåÓ8Õ÷Iy~å¡4©°–ÁvI›ut†'RÜ™û
¯◊€VE»…Ÿ≤Ø‘ ’# “å+©àtnY	Æ≥iY—ÒÏ¬¥¢«'`W˘ZúWáÛcz4|ê.˛Õ 3u»$”ß´F,¡[£#c¿Ô—¬r]xTºlÕñZj¯h6÷«Ÿ¥“∞±vû‹H≥|öç4\ﬂ¬S„8j H¢U&IÑ∆‘9XH‚ı8õîœÄ#©πÈÓÂ6≈®Çjãè*òö?v
¨/∆ë◊z≥ãVQób|y[ËÈˆ#¶ag◊ˆ"¸#1I“Úƒ¸Á1º∞ß^Æ›%
öÄÓSWì≥Ì7TåÁ4¬4ImÉUÁ1'œ/Í#·Ú)sàQ›,ß%ƒ=SH†ÓÊ≤Ñåñ,›≤›kZ}»ÈbfObjíQTì/TW}πÌÓaîÊ‘<œSáYL`Êp∏≈tƒ±»<GSÚè8 ô1åêJ$'áSÖ)ÌOZë‚íf¥aÏﬁú∫ç·ˆñµÕæˇJ,)'ÛŒåéd5T¿=Ÿº>∑œ /"4˘
)S¥⁄P.F;ßd\&∑äï…i“c'Ê5«£oÉÁ&…°˛îèUÉ«÷ùñ·C5ı]PZù?¶yärÑâÎÅ¿,à(Ÿ≥ƒ*ˆ¿≤DnÖ'⁄>câñ‘%.S]R◊á=3ü˝L-˙ÃÖÏgÍ—gÊÚØßO≈∫ñ¡ä¶ÆG£∏º≥¡%ãY#mØ∆ü∫ö˝‘R¸©•<3úô!¨–ÜÒI◊∞ÑÍê_øÈQÒ›s¨ƒ≈¡÷vK∏©q_1+ ØªÏ%KFØcw–çWÇÔ´-§
^‡‹¥ÖwıDJ{“◊cö Á◊¨4∏˚YûÕWœO¯"Ë,Q…¥GBc¡˚•ÅªÊÓŸﬁï[S%œFuQaíuO˜árj%z¢vì»CŸ‡¬Ø*…É`Lo¡Ê "G_ZrzÕŒê≤¸Öºß@ﬂ
ö∆zIB“ˆ,µm %r4cï2ﬁNÖ~+≤Fl5¢”Hiõcÿ\“Vañ÷–Ú“Ô·±Í∫âGèó◊)¨vlYgào›¡ÄNÈﬂ1˝âxŸ∆ß¡Kà„‚*mM´@I¶*/¡b¨@
ü’î]‚i~ñÌkÿI,èÄ*+>.eÅeMUpãª*ÒÖN÷Xç¨°“≈ÊÍ≥ÛòK59¿Cñ÷7YÂ˜Ì¶≥Ce9&Ï£>ä;_IëÏ“‘N~H¨¶›rÄ3õ◊J^1
*71;/•º&iJhÒ(⁄,5V/ZëJ{%á—›Ë(ËV$k'J•íó¨`⁄ä0å§µﬁ7ﬁOnÀ7b…mÖ^ ﬂ'oÃ,¶h-¯”L+É◊‰Áòck Ï…≠ô6$hjë$>õÇùól´©∞nÚ¥ÃÇ$†
$ª◊bSIQGô©SÃ2ü3y”®¬=ITØ–ªa√?`ÅzK»Ω»üÃK≠*\ë1£ÓúDTÊ•à‘≥ì™70‚J∆$Ó}û¥¿¡cå
'#uÿ}
‰!¥gäíëlƒBå}I¡vx-hNœs4◊_y–<…Ù-iﬁ„∞ÙÅùXlµ¢TbBG"&ò∂;
#'D:é‚  ò°ßtûlÍ‚‰kiqâ2Øu2—⁄îzl⁄>‘'nÅS÷∂¢6C∏z\˝{"M˜ìçaè"åQ{¿
√Æ˘ﬁ∂¯/h√9Lû|(0õ@•\Iyd%¬xztìíõØ˙ã»&ÛˆõîÔXî÷ÎôkçÇ=â ÎÔ	Ä1MÍI˙¯√˝c’a∆V›[@gw'&Sﬂ*ê2l›˙Kgh&Y }S∏Ñ÷˚∆@)´¿∑<)n™ÜÉ√¶á~π m‡%x©fÔ˘≤aáë] 4Ω]%S	ªë≤Á 3–ÆwØ#¿∑Ö	„+ô€ˇπ¥…≥2“üâ‚Ï
]•'Ñ/œc.Ï(OÓø1˝í‚gHŸÔ…,m_Ωuõ“Â€ãûMˆ›!ù,ˇ∞gı0¶•ÖÀÉz(F∑y~)‰p’—Ωu;E¢Ã{T˝J>Ø—•£ÿbv¥≤=‘≤‡˛I3ﬁ˙57´Àñ=ÕZôp['∑‚TúÒ57πÁè§ê|˝3	Ávé√ ﬂqê~ Ë}LÙ$îA[Îk‰Ü;pö6œ÷œ‘C^Ö¡∂"?%.)ÛS™ÈΩá1i{^”Ì€=:—i2˘´m
ü&M’@JS©⁄èU≤=∞úÑbﬂaQòƒ@Ë(bbP™:CG™ÀÍKﬁ"1º+?±	!P∏îÈ_§¨˚£íîÖóâ“`0 †ˆÅΩHËΩò€‘£¢pùz*:IÔ}2O˚©¯p‡÷QÔBØΩÁ_ta##∂ÇHA§€	Xti‡%[+/ jø#ÉıH•ó¯náÆ‚œö€≠YªÚ&È3%*˝≠JW÷7π€B«Ÿ•.KÑ˙&ÛYÿ±∫Náä•]∑Á¢#-øøg;ªmzÉ√ÎõΩ»œÍfgÁ.æ9qÂıÉû—ÁÁï©}cåÎÖ*EöÚ‰‘·•ôAkÃ”òÖi§≠ºSπPµph¢Ü“∂wÖ%¿Ê/cYŒØ©à¡v¡≥sıı˘ÌH˜,€≤Ïp_dG=¶π•z,á¶—r¸~T	Ëáı|π¨¨	˙ñÚ|‚u|◊Î!” ÛÎVímT∏AâÂ]tö)ä^v*;≥;ïeÇUöÉ˜pWœj9CÅ¿dà\ßá^∂|Y∫ñ∑ÎÙä∑œ⁄M\a eÍp#sÍ«Àâ()ñÌÇ∫ïªz±∂Õws>Ω¥qiAL∑ãÂù÷NùôÁïO2˝-ÅÚ›û*˝≥ÎÙÔ°m°¬%ôF{åπÖD:€¶T:e˘⁄∂ï≤∫∞æê∞Ú ∆Œé”t¿yÅn…¿Ç¬∆EùJâŒ€ß"lW∫KÕ/únﬂıdËu
ìÌ¡†Ô/ÃÃ¿Ê¯•]◊›ÌÿVﬂÒKM∑;”Ù˝Í[€.Ø¬&.Ï—Õ˚Â–ﬁú•ˇÕ—ˇ æ`//ñÀop∫ÏÔY˝,øΩm∑µO¬¯<âÔ†<ìoı¸¢o{Œé]ı≤J#8(kAØ7	‚qõ√[•4˚fÜèrâÆ7%MY˘Ä®ØP/`5óÜ§TêŒ@Öå=ß5hSpü-≥;@NHô@•åÃÒ^u#¢o%-w∞RmV7¶*‹Ãx#@,æGá¿"∂ﬂ@g[SÜ°≤MµL;∏â√ÎªÃ{ërL68…›±3GGÂ-◊Ì;ÓÆ[T"L±≥§V’ºr>D„9q7{‚\¯’πqQGœ‰vsÇà.õ†Ë\ √~ﬂˆöñO'MEGÄ;8…p˜ •YÉù‚££áêfÄlØ#ó=Ö¿2+~V‰h≈`ò=¿‰"&≥,k»øcPå‚tC9p≈∑A]àö.“KÅ<‹+ÛÚÿ2ú|â#Ÿ›"KùXt0”€›∂
Âi¸_©<?ïπL@˜ãò@Y#¯˛&K0Ä V èbñ xyu«#ïäîª}µ¨Å˘ZY.è∫ÆJGDÁw¨ù¶z∏„äW	ãÜA∞´ˆ¸NŸlÓhöTÊ%ﬁ .–1S"¥¿Sì*9a"‡°P0ññÂS*ˇ`Ëë;(6€Nß%…ÆÏb∞Ã∫b±ÅÈº-§FΩ±ê¥É®º¢a≠“{cL∆·ßS•\˛;πx¥Ôé’˜)ºàOaL©Í¡*å∞Úµ"T3a–Ü≈NG#6¥.%÷d]´’+≥≥©ìO‚Ñ˙B"≥õ±õ;Æ;¿ÉK]ŸÂ–)eÜ¯^ÑXü=R¥{≠7„áA÷q‚ÏÅ"∞Œ6;Œ¯pò©VuÇ	¿Êc˚f˝9è˚|¸‘›≥Sü‹≈ôQ	Aeï$ ≥'+D!ÖdÙB·∆eˆ8*»ˆ&Ω˚¥_©8õ.G\öIóm.¡í¶
*2˛˙ÚDd›2¬Æ’'£Îì±≠>Ãx]ìWA¥À	<Ëƒïˇ¸‚ìoåkﬂ¥+ë˛êA)ó}oPòß;Èø≈˘<–Ø¨Ù–i£±usyÂ∆VÉ,-nÆ@Âöï5(≥±±Üe.+oÔG^.òH›˚)Hy∂ÔÛóCçüéı°ﬂﬁ∑¶…/-Øgı€√é3Mñ(é¨]∑∑;iV]M›	ïIú∏kWo∞,h[´Î+[ãW◊Vå‚ëÕ)/ñlóa¶≥|ôxˇ@õ'ÆÑÄ(`Ët¡¢ö‚°åµƒc6G®‚5‚ë%î;q-W‚hy®iP† È-k–’ru.ﬂhMõ”~∞†á7˜€2ÿïò¢ÜB7yOáS/m◊ﬁ°ÁÑÉ|FˆÑ˛aÿŸ'ïπirL[g÷YTÉ7≤îlAÀ£H§K±ƒ¸¥FÂÕƒï∆⁄•ôA;w'*ãµB%U©≥~—˜˚≤lÌèß:RÓÆÖfª7Dy–TèÙ1ﬁy6^F±∞Xí§˛*¨?tnöa©Ln∏¶=&Îz#≠Ã ‰“ ãe‡67–—#Ò6¿( A2ß®rybVbhDw©„ïMmä·E+Y?∫ñ7\µ∆ï/]ZË`1h;>‚|äáÒÍ‘qAoõ‚-mfÇ¬*çcR—8œ‚æÿäË:+™πòúﬂ
£ˆÖÕ i≠7fV6ã76∂VóVä@"g*Â∫a=“¯xÑÙ*∆SèËÊÿ∏.&´±ÔÉ‚‰mõ2øË’-m	‹Ûaô[2Ú$±4Y}…Arπ—(W“ùÅÁv:Têqwê}ôÊuõa»êÇ?—s2&k2È,&f¬ÚÜ-∫x>YÇË∑uJ?;P≤è2»'| f6…n‡7=ßüë9N8ØÙ:Æﬁ˙;√≤.ÖÏ|9¸Q∏≥ÍæfàûΩ4ìF~®îhîKÚ*”ö˛ö‚‹Ã›gfÏ[jº+k;R1}è-h€»iô7á>L¸èòãQ∂ìç5p9

¯¶2Íw`‡ª8ŒÒû≈7‹…Ñ¸9ÅÉJ¶sä>‰ó·ÛA~N*SIq∑'§2”Ë;15q;ΩΩÍå`ÿ≠˜Ym—Tû’ç”zSqRÃA 7˝;KLÂGWRZ@∑fË˝7õT
˜Ì¡Â·`ß8?˝O√k+◊ÆM$π˛ú‹‚¬-‡”ê"œË.‚ûŸòP6¯uÍ˛˘üzIf\6Fª◊§À◊∫È9ƒå_nnÆÇ°ß>Mèç’í’Må$‚U´÷D¬”\	‹
í∂áª0—ˆÏùâie<Êè
‰§èﬂL¯Á_i‰∫_i≈∫ùoeëìíUbñ¿¶PÄ°§ç2µÄv∏[œÓ∫wÏånı4ã«‰Íì†&ÂHúg'(»â«~¬m»™¬ì:/Ò8y8[[)˘QbÊèûÿ~VMûC•éÊ%˙ˆxipHÿ]ì"]ﬁ˚Ù<˙—7ÙY˛ äû’iA!ñNR$˘SreiJ˝;ª·E≥§]§‚…é”ÈÄ÷Ú∑¯î#˚Rññl	¯©	r«±˜Æ∫w/O /Z≠”ˇg´V˚Jx–›Eë¶’ø<ÅcùPÓaâ‹~§¡À’	“∫<±^#u´B*¿W*≈Jª2|%ï;’“Ï|pßX™^¨ï.î/täs•z•NØ¯π,~∑B[‘I˝m¶<œ°≈Z>íwQt_#ÿ¸›˙Ø3ãÆS∂ÂŒÓ—¥l&∞]3´å `f€Ú≥s]Üß˚¬E˜G%.ïä3'›ÕíBŸß‘¥Ó‚fFÚ' —’2&^	Åb{BÊ’ëƒ8û‡!.’eÿF‚É_(~∆O¶âhoœ*M–U˝à%å¸˚¸c‡UœDñ5ﬁ[$øOP¢Vªñ…J∂˜—kyöÎ:ˆª3RdÓG™(ôËYπ∑2
$TH∑µ|≠±z	©{
gN•D§ûù,{né˝å§\â)Ç3Khƒ3£üQkt(…ﬁ@ù•Ä*-üpH5?CÍûcb® ∑!#π8SAîz‘gÅÇA a^Ä!â%O¯süœRHçPk!b^S»]D#jx?€Ú@ ®WfnA}*·“,§¨ÂO&@ÿ|π¨0—îj§épOπÚf±∫¬…¿,I(9?∫»¸¸¯eÑTáFJmz9æXóS‚b¥
b®&∫c≥¬YI∑M
!dgy‰ï∏ò≈Ô:æ„P	¨ üÈûì.£˝¯Ò•“}&l7Ÿ«∑úS˝”Aı’åHˆõ#ê˝¶JˆõHëÇåkÆß(∞ü éöa˛ÎºÒ·m≥s¢yfâ]≠$‹^-r'ÂßüæêCÒÀK%vBãx‹‰éøÁú‡ùÇŒêä$œÅ‰˘*…Ûy*Êü^ñÒs‚Ô@‡Æ≤l—ãÕÃ§€Z≈Æp∂∆,ﬂ§?»®dR’Ñ’Œa”a&gÂ-^&fVQØP2éw{OTry-BÈ≤›⁄≤ä6dêU˜}∑8'q?@DôBüﬁ™‘vj^Vâa}D™†=W˝˚]âˆîn=‘é1b¢UÌW˘€ÒI¡Ÿ/ﬁ*‚È&ƒÍ9]¯}«jŸE'u≥ÛÍÌÎ§]¨üVΩ=ÂPs_ô%ï™U#5àˇ®–ç,ˆ•\°ü≥UËc3!TKıŸy:ñ•ZÈB≠J.î.÷A≥?[≠"ôm÷KıÛtdÛ•Í‹<°¡≈“lù6¶úMıBù‘KÂŸ≈ŸRyÆNÔâﬂ‡π§\ƒÁä¯˚≠xa&≥*◊B√ÃÏÄø¢î5„j‘;©¨MvEÖTäúNèÅ/≥P1¬˝º∑]Àk)AnØi#‰⁄iv¿'JÌ0’Ω1ÅúÎ\*Fd0–‹´Í*ÃÄ4¿'©Eﬁ±zîœÕ«FGåò`Úãra;fE3‡](=Ç¬E^Ë¿4^"T°˚VHˇ¬I« L©b	euÒLÍí≈—5›¬`¥õ¿ÒìÎ,˛ò;äÒ„‹'ñ¿gÜﬂò©Í£#}«©=œÍÀ≥ûGR≈)m∑…ñ›û[D«°™§ãÖ4≠∆≠¯jÀÉ≤ ÿd⁄EË∞ú©ƒ∆Q)ãW&‰õ;∫¨≈∑0èŸ·{E˘˘˝ãGÅÕ—o–òImï˚…ÿ∆µk´K´ãkAŸ\y{µ±µ˘æaŸn≥Xb^q~VVúáRÍ¶ıQ5å‘ˇ˚Õˇ&:VäB˙o£‘Mo1N^_h$∫$&ïÂG-eû¿?Ç8PÜÂ‚¥»∆pÖqeAÖ√ég˙2+_∆¿∫,ˆ4"´*∏RÖÃFT˝öV(ŒÛ„†v7Z˜IÀØbÃ§Q}HCg˛eQÂ[«∆™^ ïÌ™U%UÙ©´wäu˘µHø_üUæíÍù‡W˙oª⁄≠íz{.µÉã)¸∫;_¨TﬂùM¢]1bõ˘‚d≥ó‚2a3•ÂÍπ¨È&é·∑∫eHò€iHƒ°OﬁYæFy ã=v⁄†8·ç4HvAR©ΩäVmm»_Ì˝ï¿˙:©Ã›©p	µ\¶ˇRækwäïn±^¨£ØXóﬁÏ¿∑.˝Ún˝§K‰ï>F˜™g»}q©R—aÜ¬'√√Ë›„A≈≈V$m´ÁÓQ∏tvw)¯#RÊ)<Rz‘X¶9«3Nœ*ûÒpfûÒåÁsgœËœ,π∂MÓŸ◊úÿ=√çJs™$˘‡v`W®í◊‚o‰S´v*%:ÁÀ∫"ûàt©~∫Ú—û:‘ÿ"rì¯Å7àŸ3•˙ï…6J∞≈TmI˚o_3•JÏ£∏Á‚D›o&ÚId^5¶È…Û≤N<|Ûÿx] ©ﬁ©ÃQÜs˛∫˘)ÜC0?…ÿZ%ÌæF†)A≠KèN ÛÅ—V“‘]6+—ôY›Ÿ|¡~z1ÃÜ»∑B†YF÷6„Y√É”∏Gèa€78Ñu8û™IïCèE*†ÍâIô1#-ª]bÖ‚´.µgÊ° @⁄≥Y
õêˇ˜≈DÎpÀI˙/ÆÎ¡iÃïÀÜÿõ@1"á√Yaô)Ò∏xßJY·zªT¶ÃÒ\Èbmû~©‘JÛ≥sM∫|u\iñJ¿ï“‹ï´¡ÊR¨≠UòÒ•ﬁ,ñ.ÄQ•V´´•πãu˛πV™œ—g◊j•Âÿå‡O• ≈*Â…±#R;8ñsﬂpa5YœÛD$
®≠ÃU]ÜèÆPÃﬁ7u≈gL›ÛV˙«¯'=YÜ≤@⁄1ö—”ˆ¨ëºq	¢≥©@ÅÆ3Çy§>„aûXÅŒÆÚuéGn)˛H¶
]–I@à≠ô¿ì‚Deé–	ŒTf2Ó?5°=ê√ïˇû	ê8#8j‹ùîë9Ω˛0”Ô)∏ò?Dˆ&F¨∆/œ˛ó°„Ÿ∆hu¥‚R‹°˘ÛÅøïÕkáG¬àï ¿•ÒyB[NZ\£zävvçúótêA%„E7&∫f∆∏ﬁÏCÓ(P≥g€û]‚NÙuˆÛ„çô√`pi zl ΩV·y]'\ÊRÕ¡-QDnöLÆª‚”÷–ˆ˘«˜ÏVO~Ÿj”Òœ◊ËY√S0XÉ°ü?@O?˙…Ã◊/∏B^êA¿|ær¿JKòπÍWñ”ûÚz˜=µu>¢JWudä 9a çKè1 Ú[Œˇ‡∑óH8R*,≥≥X,»I«0Åì=éE˘ÃÒ0°(ôà)ô</Î6Ì[VôóÓ”‘^Ô:>ª∞Uvi∑4≠‹;+ÑÛe3jö≥À‹g¶∫Ñ|:ß_cÿáYo∆Ézh‡ﬁM,]_)V ”3¸U« 5„Ÿ≈†¿#Lâ<«Iù\#€òp	Ìu„¡%ç—ÔØ≤/¿+ÃC Û†ù]ºb:ª'k©‰iaR´Hıv6–F;&4C3ˆx–Lÿ¬œq+˚‚\_◊òƒgÖﬁA.U™´Ö§∫9ä„≤{-ƒ±\∞ º∂EÿHU1∂ÓH˜ïº‡œ¿r∞Í˙íVæw$ë#Ó§Vç9©’ÙNj°0+
è«ÆÇITø=`…ê˚mıöv«X˛27ÎÚˆ£Ìªè ücﬂ√[4;öã1sˆ?…-ä‘Ùñ≤p€ûâCÈO¯˜a‹ t≥¨≥´Îã”û*V∑?«;sQÎ\˘@√<õˇ¥∆‰F0ïXõ[\@n£Ÿ†Y‹≤…AÉ`∆≠ÁÇ¡ëëK€¡«p8Q‡–ﬂ.öh_[Ô‘A‚π'Í≠òeanW„	‚:†ƒèU!Æƒ»®Q‡Ã)` I•U∂À`œc§+\^E©ÓrµG¡5Ò◊ïÃhX≠¨E<WO∆ ñ#‰:1"˙G
 Z^iF∑≤ç…*‰*>√ñA≠FHŸ≠D"´T*+JCmëßãxí(¡GÑüëÇ´>ç∫"Ñ¨¥w“1˚;qÖ—°
í@“„®TÃ¿Ô*fˇ*èÌÔ`òQû£@üÏÿ$3ÕB7∆…Xu#5O¶¬ü·nà”Qå—hE^˛0*MPJl*ôÊrÎ3§BáÁ†ú<\»„«w	\ízª1r∏tI‰3ÊﬁG	Øªõ:‹·‰√P$w⁄B>«6I3˛¡¥∆Dêy„øcI„î],Û…1'!Q%Í}€Úés€yâ¢ÒÆaÓ2?	lé%ÖcÁFê<)»T«:ŒΩ’% I*´uëHÿ›«˛NöÇCŒYÅkñªCxØ„\ÙhÒØóÄYÊÉàf<ü£+:vow–&WHŸ( !äÒ2√›"‘s7√zV{7ÆÒﬁê[?¢zA∆ì—òûL!`EíO÷ff^p7≈˝YQ∏}%m@bŒ6ù˜4Õïk¶5⁄¯ƒB⁄*á0ıÕdØX©N\˘ôyô≤îûÎj›Él∑JF?√~b≤.À·…å(Í÷˚)	€¨Ö˛"¨◊cUçÆzΩ>äπo,KBÂ¨j˙t˘·≈√gdÜD%“J¢òHde∫Ònö–™öJD7‘ﬂ·†æE@∫è'2w≈ÊGpûQôUÕ„-MK+^=Où-$ìoQvàBj2g’ıÂÖÿ∑iByw˚ÓT>7:J^òÔìÁ)cñöUIgÀj|
ÛsÖq°—cÕÿ“!∆Ÿäƒ.FiR‚Æ€sı4πû√™¡[¿U≈ L•ÅÀ+5Mï˙V´Ò
’i2Y6W§‚\†¥†ôÅàBx◊#°◊ Ö(eÆEâ•9ILÎ-AkWÎÜì_ßΩ	- fR^æüˇ›#ÌT¯ 9•ª•◊Î≤L> ™©Â√∆∞s!•"‰ÇôUBYõ§˘1 J·P/Jv+ä‰"uìﬁVús…K¿D<€Ht•–ç,ﬂùPÇM2(˛   ˇˇÏ}mo7ñÓ_°'jÕË≠ª%K÷⁄	Ÿ∞èÂd?xçQªª$’Møh∫ZñµöÓÊ"õ]πÿAvp≥‰õâçÃLf·YÁKÊØ˚Ó¸ÑÀsYEVëE≤_$ÀQa∆QwY,íÁúÁ1?«KÂÜN∆<lWﬁœ\G?≥À◊ò;˛∑ (gE…[\e6»QF⁄ª¿·I”•#å/öeìU5”_;LÄ>‡
VÄÿTü£/æå√Kv≠L£xî◊á†ˆiµ;¡Œ§H≈>úpı EãP™$‰í*©í“v2ﬂËƒÉvdå!˜L_”Q>9ˇ”T÷Äpxyi	Ê∞\Ê¨ÚtµL3≥%‚YˆÂïú∆»ªxÖÈiÇH§-ò∞nµ Vn]÷A ™UM˝òh+>ÜÀ’Â˘+»ÃGøU´µÖµ ÔÚÔT´¯°∫rÎ „y¸™Ω¥{Û¯Ø˛∑ˆ¬a–≤PXHPZníB{#jGÉ» ∂|≥:«¶ÍD≈˘tÜ¸;%àˇ]“œïhj‹DÖ∫ﬂK¢tU4â∆ÔVœZo¡Ñ˙
[mœ/¨nCm°∫\ª.Ñ∑ZΩºP≠s	≠ﬁZÂ?ßHâU>xWÆ¨◊V÷Ó¨∞’Œ
[~|π≥<ôˇÀ]z_°ﬂ˛Œyı3´>Æo.≥’ΩÍÂó]¨G‹©‹ÌÌÍˆM”‰uñ1£ÁnÖcàI£yÅ/·c™öü6)´≥úNê—≠eÛy®ﬂ9åy∑évvlv˘˘≤¢å‡Ëfddò5Æ5÷^v(“klı˝zgç-ÛÁØ∞µΩÍ“Ê
W{’eu¡µDµZ”@P'Ì‚å©c>KXÁ2ÏÁ1∞…ô◊P≤ú£RÎíØü>ÕÓ\}ﬂÈ•'ûo√H]ƒxÙ}6Ht;ç'Û»ß—°O÷éí>ﬂè⁄ç'ëõ[◊ÿEû3˘M∂@JB∫pû˛;	7˜g˙Ó„<˝)Y;⁄ôÀÚ#ß2 ?UŒ˛æ$@ÛèÅ<˘˜·#¸¸,˝øKCï·Ÿˇ,üà! çp<¨¥ãÈ„Á‘®œ∞ñØ©‚OVhqi%ºï€û£∞Œ∂ÔÔE˝à≈<J™}ƒw’:ÉL;N\1…∞∏À{qÇ≈Ï.ü]Iƒ‡ z/bD∏ãLÑ„s9}ÃÓÒ¢I‘põ:Z¬Cú\ºÇ_(ˆ÷†—Ÿgãl+ﬁÌD§&ÒéÍF
…ﬁU$ü’b	 öΩ6DE‚ﬂÄ‡jÊB $~}î…4óH]Y˙ù<π	œ≈}˚ñìd^!vüí<~∏N≥˛˛Ô/¯˜7ÙÕbNÄÁx ÖÚ+¸˜èã?<}äæ¶ÉﬂháΩ”[g[õ[ã˜ﬁ}Ô˛ÌwnŒCHÃbuiN\Gà""  ˚´|éç˚≈˜ô‰˜~AöÈ„tu ùˆçºÒ9ì≈?≈‚œUËnä›zëÊBZ\\∂—‡”o≥◊ä⁄Ä‡’„ì·z´w¿†!èîß'ßô|±…√ÿz	√ø<®);vQüeŒ˝Ç'.D∞'Â]¿W∑ÂµR`Ó…≤b§ãà\ÎQ7ßëa‚Ù…P⁄¿î≥√îxZKkÈ –ÈíÛDq ≥’1/g¸œ·|'„§"–ú˘±Ÿô¥-)÷B‡‰·l≈TÕ1¨”|ΩﬂxD„
ü±◊h∑g‘é¥›‰3n¿2>åäπ∆*—:ª5öÉXÀo>Ê#Y÷-Ï˜#∏ÁF¥”8h*»ÁxáU.@´†Rò∂É~‹©ÃŒ≤~ƒWœÓﬂò;äâT4hﬁÌ÷¨4@¬˘´√mIçÜˇb†…z‰dX∏V%ó;˘¬¬¬ﬁúıW8rÅóYgÍ´ŸÔÁõµF3≠≥w x∫"ãmà Ù|i÷^WÇ®*≤ﬁﬂÿÀepêd%∂≥Âˆ!‡ΩY+n∑F5HI}-Æ¿ŸsÒ“±⁄√ãv*A>\∏Hm4õQíl&ªAHúﬂIÂP‘œ¯ÍO"l≠‰ƒÇ§¢>óÜ1*ÁÔò&ä^»¢÷j,[GÏÄﬁÔÇ}»¢6∑emìá‰´
¡≤O≤∏≈≠[Ûóé!Nf°€;‰íæ˝£öu%≥§(‘∏P¬ﬂs≤s˙ÕWæﬂxgkIﬁk¯úM∏"/ô±f-ª∏»5>EÑ•6ﬁ¡º•tïù¡@πQŒ.ØõÂÑÚ∫ôÊReÊ˙„F‹øgIôõ™™ó¨∂õ!–ÑÔcKMqc~2X[=úc‹[2˛:46D]ñ°ÒrYÜ©∫éYË‹jå§P<XzX“÷¬˚C%|tw1é2ﬁ-µM¿Äc9©u∆ÀIe„=∞©õªôé¡dGÉ6N0Tí+T≥Ù©§ü¡L·Óƒ˝NA/lÀıËym>•ˇ–6Åít>#/ì¶∏rB∏ãÃrä€äè—?eûΩπÆúÎ‹‡>Ípù ˛8l ${èµ≥Zﬂ‹û≈î⁄â€X@RkÍQ>ü¸0ısNwODıöª–GΩ∂D£U5kU∞VÇÃÇ!ãÌèKÏŸ •õªŸ≠xs‹ 7W¿[ãrF%læ€Í|ÛVœa
∫\EC{ﬂ95
Åó ¯;◊(Â˙UZX}˚ä6}ñCFg∏Ü˚^•5èc€ﬁÅL¨≠∏≈’:∑qàêç√Ó´Õ∑G(Z.z™*áù5I∫Kÿµ'Iz@Zñ_j°˚-“◊Ó?öØ€8œÀYÔÁ∏µÚGÔ˘‚	È
€„o˚≤ü_aµjûÀq5wÚyπS]fK{µˇ∏¥qQWÿ“≠z>≠l^Åòàü™À¸?ÀÛÀŸﬁ’•«Û+2ä¢
AµÏ´>ÊuA’nrÁ1™€©ÂÙû]›´áëÈ>Ú¡¬8÷◊Bßõ/êß#€oiÙ9Fx∏áÆH£€pµ§î~CiLπ¯Í‚^›1ZV4ãgÿ=RﬁéÔÔ0∂L$=”Å'¬‡vˆ¸!9g^Hˆt–ê}lÄz‚kƒ>CÓë!6‡´R¬¯õ∫4X;Óƒó„‹q˙·ÁŸµˇnÂ5Å1’“2∫$q_⁄˝∞\U»
]ñÄ®ﬁÎGN IΩ?†A9v•!W∏úsâ“ùFöj˘¥Œ¿:∆ˇûŒÃÕ‡òÉΩ¨ùÛ«Pì`4Ø®`g:ÓîòÏé€Æ¶Ê«r)Bijh êf“:ˆ}m©6«6qóT^Üπn˙’ıt˙fFI9Ybé⁄qﬁ¶4‚î–4˙≈úSg∞(BñuÈÔ>π%Q[`[Qc¿RÓ´Ø≤U$]Éæ°Ñ}V—˙bVR0Ët¬ﬂEE3!ôÔÄÎÑ®Õi˘Í£kát€©kËhqƒê”"U#?<˝˙áß_)öcyÈ\Qx)ä˙ª%Õ~L‰3ãLz~„#4(Z·˜‰3E√B∑T+Ê˛ëZƒ÷{Q'Üç~‘òåñË˜ìk«uó`‰‘Ñ|•—’DÍpö¢!Ò÷A‹Fﬁ‘Îs¨∆∑o∑{Ωæ¢Ãøø:Çˇ=U1u}±º¿»%»nÙ{˚≠ﬁ·èAQ§ÒP)HEø‡ñù2â('¯{"ÇO8∏aÇJè]LÖ´7∑ñ7¶8ŸØÿÃ[ΩﬁQÀçr6Ñ'$≥ÃÈon40”n3GŸ˝A˛Wäéá}»ú^IÀ”Ù F¡õ.◊ 9éÖéıÖX≈d!Ç…+Tòö"¶Äg;|®Â¸¥è`†»pW˙∏1°ùﬂ0Œ‹mø§Oﬁ_"00ª™àB˙{2 ∞≥ÈA¶t¿ı$ ÷ˇf°‚ÆÙvàô’DÊmBÕ]{4ˇ IAµé';'úq9±≥ÅV≠∑óŸÚHµÙ»wÚ töå7<ã<Ô∑?Xøüc[¶tñﬁñÎ'í{ﬂTnç‘√ywöËù?Ïu«oÎtÜı±Z`Ì®y∞v<i€‘@X.µ[í&Jﬁ·ó [:yúŒ˚2íÜÚu°i0ëÅŒãÔƒ…¿âMZvXº6â√‚2ug\qÒÄQKZê≤,ä’„ÂrE{jGâ#~)UÂ_Æ7ÚÌ4Ï_é£∏¯¶wÇh2=?–~lß¡f˛Ü…\´œMÓ’ú«ÑWHOã4ﬂûÓ"q*‰∂4∏«W <¬kÓ5¿1H«wºì¡K QUQc «wÜ áTÒVUÿ61¿“RAÀzÅK¿§\Yv+Yvåè_”XÈC…Ê~o–h„ºN¯'ßFˆóŒŒ0è”pTÅ¿<ÙCöv„Oçy4[hò4Ùx†–']Ω∫d—Â+'Ì	]ƒ÷≠è˛l©”	≤l;j^,!_ÑI∂òû-˚c¯ZﬂPèÕÕ≥}∫∆nà≥≥Lnı);[&∞i“5º®∏—'“Uµ5ø∆iéª…ÙL˚lA»û⁄≥æå'¬≥/∂≥W“∑¢aœ‹ìs,n˘C9à≥«måêûEÉ'shˆé«€˙¶äk»e4ªt\å“œÑ·‰≈—åÂ”:”///·‡ŒΩ@<sè√0ßã¿âı)£MW¯ÄOe: a2Ö≈pû±ªGQuÊ.π“%ZÓÃT^=$‰CyH‡Ï& €ªºŒö0≥5óÁ‚ä-†∏Ω[‰Ì#{Y7Ã≥™™!p∏«Z^“∞,Æ$]I}sÚ}åYıﬁ†ëˆ<•WÍ˜ü„E"jBO“Avi%¿†ñü5Ö∂Á¡≤xÅ@Q†C ∑≠›	(Ç— ¢èï<4öT AöM⁄.
±9∂Q»k
πÁéƒÏËƒﬂaQ	∞^›	^Íê`#Â‹Ü≈∆›∏[ö˝É68É¬!ãMRr˙Ê?nAMÛ√ÿKÎwNHÖÜì>Á}˙≥Å⁄QƒÂõÃË˚ùvNk‹ß¢ ≈QÈ[^G• SÎD(›”¥Aµ·U1É^4Q<’7ÏP(ª¨‡›∞ß¿R∆o(XwÒ.π˚Â≈Ï”2ßÎ˚#BËÒı<ÎU/§¢ˆ≥'¯∏ÄD_òc:∞¬dî¡‰°æ_NêÔõ83êﬁ#Îﬂ˚Ωº}°ª˝@ª›…^@››éWtm¸π]áXn,mÀ©üekªÜâ@{ü4»ˆ‰§ˆl§ê{â≠áËM€âº]–√ùÜ~$Ï∆/D˝»	«Ì‚>nS/}•æuK˝«4gˆÎGı2lâ.ùÓíˇ(CˇS´LÉ¢v%√g√ÚGz˚Kj¸øˇá&á-‹ñ˝ 5Z-@8Í3ntqu–OJ≤xØO]/„Nd\
˙ ¶pb].J M¥/ÛïŒΩ A±€ﬁ›' Æk¨—l¥¢N‹D§Ô(Å*r_È°˘˚◊Ÿ„#Í·Ã∆|uF¬l	2˙+3lh∆LÀ‘Úe÷‹eÍ˘2´Ó2À˘2ógåÄ@K Å∞í_óÓˆd:’‹%3o«›F†¯⁄$lü1∑oÊ∫Ëd∂≈´«OŸÕ[oH´¡Ö‰≠^£ﬂbº˚Âµwªº7!èÄŒ Ó~%Ô~ƒ•Úz˙™T¬ªßŸF£›< «ómXÇ^Qc7b≠#>qìãıëµó±–]*√;¶=dπ@≥íÆÃöQ•ítÊ–Ö"¿?±ü≤äHXÖØ≤áŒ
LL∂dÜÃÉÁﬁP‰l™ ∫⁄ã˙Zui…"÷hG˝A.~€™∏´éÇü_H	Z^h¿–˜Ô“≈„ÖºÈèj0ö–Îy…d,∆∑rU·Kà@hˇÍ5Zû›w Ø"bGA[ √?[góé’.æ6ªm£u∂}≥ﬂÔı/∞˚{Üâ3†s¿«Ò)6Å˘ÄwÁk¨"¢MO≥<Ã
/&ÒçMøY¿Œ∞8òWe®«\rD<ÙÑﬂ KXn‰ög≥—ˇ@ùßòdê¯•AK¶ñ∏¿í°`	≠¥Ü÷S	EΩj/ëiOΩÿuÌ{{y`ûH÷2V”	-% ˇ5Dráw-S◊ZAï°ΩÂêÕ+_Èo0 Q#ª';Î?$å{∆mBV·7CNﬁ,ºwˇ†ÕW}ùÏöò¡…—,+Ét†.√R“è@ ∫—°Âûô|ÿˆçÚ≤≠ïY1î†3V¶E°d¥Ï™DgÜéÚg¶A{I$)€ÀLF¨FÉx~':4t	‚<˚âóË31Óp	l Œ!à‡ãÚR7‘·®§ñª.ÚÜq∞*õ◊]N€äŸàÎ]òÏõ|Cª∂˜‹íœV˛uV_≤ˇJ‘6CÈ’%„6Äõ∑ˆ∆Û—‹‡∂F[üa}⁄n°®ÛF.,î)$u'Ø|°©Ö &á{Ùi ·Ì©ûwX\◊®æÛã¢2EìiÄÅÆ«`¸¯ﬁ‹l8¯bPzX¡¢VV˘U~I®⁄2¡F∆Øætú∂w»w€≈K«zãá]*5ı0yb`[^√LEK´èÚ.Û¶◊x”º-(«ÿvÿ„k;oíèÑ∏m[Uµ˜*º÷I€§° ›fÎS"vè“-v;^ ›ﬁ¶´∏?lÌÃy˝Ã’SæÜ¬5ˆ:™Uæñ¬e7_úÎ≠ÙÏm ís Ö#ÉR7oD§4J! ôS aiˆ‚kDõô;ˇ#ºˇ[Iì©tRNÍøëM}AuÏ”±d£Ké{XS¡q/`L`‚î»pπ_≈Ù-u<˙IíÇè0Èqi¬µ|∞–≈éÌ›ÈF˝ﬁNﬁw∂Œ◊o-Ò›—£G+#À©\?ñ©˜ﬂ  1π◊pÛ¸†ˇ®ÍŒ˚íóà?mæ˚j¡⁄Q™7√˚º†qä˚D©"l›´´Æ-¬çlCkù¢y/ÍÙGöt∆›VÙÑ7=∆Â∂≠˘•’uΩÚã,O
“gp]áåjAﬁM{â0ü
-ûd†±õèi^ËÊ”öM6<Ñ©'P:˛táÌ»“ ÛùF+öèª÷ÛV€fQÁæ'¥L4cwŸp˛2vƒ DàrAX°PÖHÛ˙òÄ9ﬁs˛¬´œ<@A#Òqπ≥Ñ¡ıÔ€˙ﬁ¬Rï]]ï,„|ÀøVXµö~Wï∑—´»Áæ§Òπ;BRñ√¯‹œ>Å∞Ûw€ óB78_KFqıdÎô9`ª®C∆‚*j'ﬂVˇì ´+¥Õ¶·¶B^PóôqAﬁ¶˝ìpgàÒ˘ëQˆ√”·hD‡>KÕ*≠sSÛ75ØÈıÀ4!˛ôí˛¬–Ω‡ùŸgá ¡a%ÜÆ∞AÔêØ!	◊c∞ùJöΩ~Ù≤≤®ì√ÃÇ‡d?†≠Ò‚	ûi∏% ét§y˙≠ÿí¡dÑV¡û†%¸ÛƒqGıÛGôv¥Õ
‡Q›Î\Ü.Z«’aB5§—<b®ÍËËëÌŒŸ°Üc°Ì›ÙVê`†àö–D»1íM⁄ﬂ∆›f˚†I_\ﬁdÙxKIÚ.âõá€^ŸæÚnw„<M]°◊ì√%˜î¿¥ò∆Vy†º
:«∫æ}É?<Wñ-AãÄ8ﬂ
¿±g-µm˛+ÔBıÂËÈâ(∂‹p@(- ëyDõ˚hƒÇNÃ@;ãó©«ú7POæ¬ö“ú≤lIÓä}¸àK£*P^0’üTŸ˘áØ2Û…$·Øp°¯©™6O∏Y$Tıï ßÔ∂^‘ù1„V‹^y†ª7Ø õ	Å‡|^=UÈJ$ˆ◊é ü∞i,ù0=ç‡¢U–ÿ≥7R‡À39ãˆ∑∫¯P”ø€«Óc.Á‡ìUé´—Â˜Ö~ùÊ"Ü†ÀÉwÃWØÖh3…âZÒAGÌÁ@©ÙÂ&¿œpÉ"£Èt.Ûˇ¬ñ©9≠t¨xŸAI˛tÎ˛¿±ç≥xÀ†h=ñÈ|ƒIÿLÅH≥π≥öRíæËxﬂJƒV`®dï◊f3ZÕøïˇÙP® 6L“•q`i≠¿¥≈†“ào:“áplHÌ9ÿáÿà∆û»ªªÂI∏Ú„9ÉÆ•2X(‹†6i™97¸—˙a$-Ï9q$‰πÁÉêΩ•Ünˇ}≠˛V@=Äê£éıvæã∆Á⁄ìƒà;µ&8
Ê´Íî'8tìÁ∂3´≈Ô¸√Ω¡KÎÛ!ãìWiúºêŒ±‰(w7û\ªXu-QŸÂI:%/a·ÿdGÄæ‡k»|¿Ißõslø—O¢€›Aﬁ4¢ﬂájñFm	!îåhÎ—õœøñ√<»CÍi;&ãY°ö~„„ôßÔI‰k!ËF~®çx∂.= "$:={Û¡eURΩ"X√Ó#ßF”ƒƒ™Ô	ÆPºê—–BåX!πòö‡¯ #£ÉàyW@Úz?PG»ôy<ê#DÅë¬“i–XG√	¿†85|ê:H6H2àóxxÇáx›ÊvJ˚ôö@˝.6∆®ÎíÉGÛxòs)hE¨Y,"V¢®3¶kÒ≤∂ªMmR£≠«ó≤≈∑ASæ˝Z*·7»v_#Ó*¥‹É∑¬ÔÄ◊9∞N∏è|L(Äåe[±E∂—ÎÏs]–¨Oj#fe+Û¡(Ò5%˝ùWp	õ≠ÜÁ#_&ˇU1/ÿô∆
JgV˜£d0ÁÒn\M
-®v√`u[@S‰µ‹»‹ (÷”>Ã[ÑEˇó$Íƒ(2≥0‹√óáíˆ7xBMùQñÌÿÈŒ_=Éâk«$≥¡©Ü⁄!~˚„ºÌQG‘˙¬¥¬‘ƒs'EÖW≠qÀ°zπ≥6øvÀhÓkXd]ãgŒEŒŸÂ! æ∆ÖÊë3∏ÕÀâK=ŸÊÄ#ZÛÔv€GÏ›ÉúQºGmó)PrN⁄Íô9á6£I8∞(X%ﬂã≥
˘QˆÌ4NóÌ(∑“πù;Å-£õ™iß·¶XÈé~ÿwx“ÛBûÙsi¸_$çﬁá ê.-∂u–ôÆOƒt≈≤*˙=}Ã¨\ﬂoß·•j˜Í!ÿ[˛Ã;K__]"f`s5xÛﬂ8ìƒCÁ˘˘p‹¬Ú™^áœ&~j}ä-¨¬÷ì∫í”Bôﬁ"„Î36´ùˇ+b=+pÍ@˙„˝F;n…/&È`ˆÖwıZÜÿûvüzè©g9_À2J“¸5†âU˘ù(j%~Á8A˝Áﬁáù‘˙MëØÇ}$öÍ¢z:-ŒÍVú HiÎ⁄±	g ˇ∞˛x;£ºÆ≠5˙@©ı∏d÷µ<ïı%{h⁄S&ÌÊ1iâ ∂#Y©5ñió re◊:>Ò:oìxµno Ω”;‰+lèXmÊWWL∞kÍÂ¢¶
ád=#‹›klı÷äûrEáR_÷reÆhπ2{êìSeÀmHÃÈo˘¸+˛·˝	¡¨N*+≈ï›ay*ÉO&Ûƒ/«ìG<,◊ƒèOè¢RúG~ÿÚ«9åÄ_˝JGpBmôaY*?Îë\t_1_-°ùc¡˝5Ø`ø)”ûªÚÍ≥+A+éì`,>bÇ±F7vBvME¡P›hx
ŸeGVPØêîj˝Ö*#Âå°\UÌ9Œëîü∏e¢˜M9¸ÿH&K˚eT∂‚¨ï˜™«9Çèü™T:3ª‡¥…ˆ{πÌãö‘D⁄≥ñÍ|Ås0íÍ>≤!èëˆº:â¥Á2+#8:qÃåÁSIv!%î÷ﬂÁî£òÁñ'FuÃa¥›xÈßû öO¨Nˆ¥ÜC[AS®{)‹3C¸ÀßáÍπü∞	ì?Âû∞F≥ﬂ„ã`+ﬁŸâ¿ÆfÌËq‘ûn®Ÿ	QOâ=ÌÈ˙Áqv˛‚√¬nß.a@Ê- ŒIˆyÇFŸÜ<6t óﬁ\∫rπ#úÙ∂«˛hàË•ñ<ö,˝©0œo›ó3‹LÓìÓ;ù'˚dwT2Zêcfiî±7ù∂ÂW$çO{I[ÅnDÉF‹ùf˙Â4ﬂy'¢{pˆlPø{ê≥uõä∑é≤*◊	ÂP]œëZ®€}=Ÿ„í©/OõJAîNÖLùvÿcvÕÚx§?i{tÄ◊È∞¶ÍälBoû{ÈÀ£ü_ÚâËAı≤‡€ÕÒq@lΩYπe7sóECC…ÿº«ƒ§πŸ∆^º?˛ƒè«4¿íâÇ∫ÈAmF'Ñ≈6á ,2}∑≤ì”¶¢iPÄëûÖá√ Mêë<€"X˘»Wstr∆“vŒêl√ûG◊j|ÂOè˙∆ÊUf§?nffV˘2S3Ù”p=ú«⁄÷ e≠QŒÀeÎî‘õ†DÒƒ¿>ÈÌ≤Êi©èâa/øƒ4ÿ/ïµ™¶—‚;Jkt4Nà—÷Æ°'svúk!+kÂ««l{ŒmÕN]ñã¥íàÅò“2\|Œq&ú wı$≈}\ÎsI≥‘∆êwﬂ˚œ9¨9¨èÊ´ó_QÎú•±∏≤ÙÚ∆PIÑ‚*_U/Î¬πê™À⁄
^Søá∞©,¨™
QUôÃ„˙ø‘ôøÃñÏU`+e5,gJJœ+Jöj3bá˝]√«)∂·?;î<√ÑÿeæNÈêƒ/iÙÛÔ%dVñ´á…_» W˘öˇ˚œ‚Ñ w‰N#Ú°≈ºE6Ô4j;ÿg‹∆C™∏SvëàêÜì”Â∆6˛:5rlﬁI˚.VÏ≈Eˆ∂¿î[‹Ëu:º´íÉGˇ#jw`bg£±f*,Üöø6÷±%™¿(ôkÏ¡Ã›Ω£$n&‡!⁄ÿã:02G·æ mr˝ﬂä˘*∞ãø‹ÏÓ∂„Ñæç∫ªçv˛,Í¬N6-∞’k©ﬂV3é ◊u‚è⁄Ò.ú?Òøoo‹üyh
Ê2wƒ{›¯ó|í	ê§¥ÄLä ˝"·Gôc|CΩÀ?∆pòF˝∆{)±˜ì›¢èÀØ$oFÇÈ≈¥/¡±ƒQL„g—•*nÔú1VçIMTûyΩœµ–¬Nø◊©t£C∂*¿S¢5m»-äÉ¯p÷LÊ”NÌ¥ø?Ωoﬁ∆ÉS?hØnª/‘4˜¢√e«`QLª%:´ôÎÌ6∆ò&ËÇﬂÓ5G¯iè°„"≠ÏF:* cÚCï›i~à‡˚P_Üã®˙P#wàµˇÛ‘‚†˚/VÒfö¡Üq$õXî·Èƒ˚€~Ÿ‰Ñ7ƒ~Z¯}s„Á÷ﬂÓˆjå?àÓ∞Ω√-‹≠£._$r]k£3vú="=eú‰%SÇƒ#nA∂Ó“î∞Ù˛Z“K•øß=ï›U⁄$,x£1hîPıí¨g:Ñ&ø-gÚzN„ÿn⁄Qπ]Ë[ÅCÍ$úeÎÂìÃQÙPy5Y⁄™Í4i©"ùŒ%EKZ†ç≥≠ä}9ÿñJrb„¨¶§=Üye´nêjÅu£n∞6#{∫*(Ê€Õ$H;!
v-<ƒ›ßÀáùÊΩÑ¡záIG†JÔ|0\B+,P¸èL≠º“61•N®Œ œgÁƒÙ£´4É«à–m2˚'FúéË2ÿ'â≥$N/·`”¯=Ò≠R∂ı(´îË=uEEüymTŒÚyS˜1xŸsúÎ7∑<I◊Õ3YeèÀ»÷sÛÃû‚0˝˘êÉa&∏∏¯Û†)8‘';\¸·∏˝§·	$Q±¢hü0≠`ˇâã¶±
^z+∑.UVlõÜõAáV™´¯öS©≠¯›àµÆy‹õ.~UkÎåﬂ‰≤Q©◊m∂ÿ∑Ì®—Áõô$Ùê∆l6DÅj{ÑŒêjÊAõ.ﬂœú2≤F˜»ã\*'+x⁄YdπeÏ‹∑}
Âπƒ=äq°B¬∆Ûü≤TLµÙßªZ>ù“vUbÄH„.@"dπ‡áfbÇUËñ]∞‹ËuÑ7&)™H~ãµ=7—Œˆl0:3˚»Ï)o¨∂dÖ1™≥
_)ƒ1ªÌ«£'¥¯‰
óì°€Ã’Y–ßø¬áíï€÷y7[πa•Ö+ΩèQ§˝-’w#AdÈ•m;0”ˆ@˝µ1l®úg;®çÁå£Ñn¡o>9∆_
¿K à>À}ôÌw£◊>Ët◊	%_ó0Nó‹◊˘ZÓ‘‹±•˝∏rI…@µ ':Òk
yÖ›—M…Éˇ˝Ÿˇ˘/>Ò¢âd=ŒÈ3Á©∫~√{Q˘Ô_kªï6õ_£cp¯5»ÉÛUmå£-Nﬁ>«x∏ŒíÉRÖë3(9wäÏx›r.:Ë˝ìBˇ˙åRÄ?TO¢Èÿ¯´dtJh”Õ1Æ“Áîsf-ªÏsÖèæ|>+(fæN9fµi˙äåG˙Í©¯9áΩÇ«Õé◊kì˝®ÔƒMq¬RãúxÅtıòE∑ òﬁ¨…Ôà˙qíú˘r}–O¢Ör¸¢Úl›í≥È—âlïcîxlK~Ç’$Éôﬂs`OP‰™‘sjºÀï¥'fŸOrdH?99∫[O¢ñù;7ÚßyãÑÂùw_LÇwŸèMa{,õY»“Æò…“îº7aECπû(/.Ï|2≤§¡§∏ï?¯aoŸ´øé¢FËZ
ŸKHwKÁÙØè…w&tO!π>Â_˚óÿÔE∂}÷Rˇ:È•◊BÅ‰‹ëåWzt#>t%Â∆Ç*z\ee@R2:¶ü¯lÍ∂äaAè _Ü|@˘—¶Èç§CX÷`è:“/◊89¥~º _N‡( SÖÆ|Ò ZuÊ$Væ!ˇ!v≠^p¡WΩ4‡ãUo˛˙≈7“?˝n©n-´nm’≠f’≠N†∫ÍRV¸Ì_·UgÏ¯â≠‡BÎº +7mõˇãºÈ¨"ﬁXÆŒiºÙ´≤<`}s óòÛ›]ŒŸ§GˆRH¡#˘ﬂ(àí©ûóüﬂHˇz˘|:’“9~∆áf?P_àD©x«ŒØ≠:®˝#ˇØõs$õÖ%…ÁÕî∏œ»ü˜,À™©P_øŒ0~PÌrB{≤˛ÏT\‰$-ø©¸0§é~¯∫Dwz¢¡<˘§Æπ˙íO5òÍ3øLMVxíŸ~ CF Á∞r–÷®2 O◊¬(^€0Ö4ümÍ˚§) >x—˘anî–˝¯±3˚'¢ñ2Â	&t|Ÿ]ñÏpd"éÖÿ«3‹ÀHo~πxöG„]ŒG{á/{∫‰Eõt˛Ù,ˆ?g´¯†M”e:SÁuåWûXCN‘B3ä€P˚	[Z®◊Ì!$˘À—ö.£ŸU”ÿÎJŸ-fWÄù5%iÔÙı≥§]‰2_Å)B ˛:◊-˘À¢[Óz∏ÂU≤≈QÂ‘¨AFcrü∞¸^BÙ∫Õá¶XÏ%6~>„Æ}÷mºOp/B‚†Cˆ67ˇ7~.˝çüü[xŒÎ‹¬”Ø1µ0ütg÷∫Éò∆—-;Ëxn’YØs´Ó‹™s\}2!ãN Áπ5gπN«öÀ2ß'g”ùIcŒ Û#	`°èÑ“êΩunŸ9ØsÀNø∆‘ƒÈ‘;≥ˆ]ñ^2∫ïßÁúú€z÷Î‹÷;∑ıóU√L»‚”eı‹Ó≥\'m˜MàÁ<Ö—j1\¡1ãµÈÑ;,≤ wPMYzÆÄh=õY…⁄4ÿV≠˘^∑}4Î¥iGã10jyå¿®r≥*πPQzG1∂ä›5ÎA@Í•=5bò.ÏÛ°|∑kf”/yi¿b
‚ü-	è™.Y„£tÇ:õ*…≤'MÒN
áª´_ ≈G‡–Wd_)9…¢yåìuä*6Ÿ∑Øî∏ú:ﬂII†«jéÌDƒœyÉcïpçƒc∫®Z“∞Ÿ˛¿ùãÌ≈CAÛ2¡6∫˙+◊.‡Öﬂyr˙™Zﬂ©WÖÅ¶DñÍcËKÊ-‰ÎP‹èßÙu‹Ô‡˙˘ÎÁˇ˙Ωü»+!}Ñît[Rz>€€àWó%|øáàrûπﬁpô3œÕIÔˇ©‰Å˛GÒŸêrÎ˝d∑Zˆ cm…è¿FªûÓIÓFÈíπ‰ëMÇÆ‘¥uMœ¶i0r.ÀO>"9C hã<Åªy˜s ‹√.ÒX≥}Ë;J◊1á÷ø∫YÂ∂ﬂÀWXÓ&ª	lq√_–“eÀDÏ»Í…¡éX¿-·vÚ≠Fk∑úá”ŒÕ»_ã%ùu¸ªﬂ;ÑøçJˇQ48å¢Æàå.;[(ﬂé∫]d#a©L0¡æÒÅ¯2|Â˚,À>õT'¬Ò†#sL$≠W‚k|âﬂ)NrrID)÷F`É–“¯› m‰wi˝ˇâº⁄_ÀØ ÕXí7ºGám]Å’%Ò»’\çNØµ'C`l4àgy™Ü≥:KF!É;nTéœï€ﬂƒeZ'Éî/r?á∆I"êÓ49 Àñv£ÀrpôÛ†ÿ§z~´—Rj9~"Â\ ¡‚⁄/ÃªÊÿóÉGGßVRvJ\‚9-!H«&A ¿ø )›ø§ø±äﬁ'‰8–ø;π‹DÕ∑Ø8åöu®T1ë¥CT5ß◊>“µê#≤âfÊíÜØ∑€ﬂ∞pï~JãÄ6[pB8∏éÒMú§âƒ+y˘R3IÒ·ù?˚*≈ D‚–*Ñ_ëS+¯ÂiÍïQ@FtµB ÁZ≈°UÚ&U,∑"@µåÅx1yº˜0£qôc;ÇzãQ’>åﬁ∏ò ∏≈Å-&j1	mÓc+Nã˚¿ dÉKjß›;ú'B¿RÂkﬁx!√\EnSÉûI˝©∫˙Ö€÷Ì∆æ«ñ˝Í`/jx–π^Ùµï Êõ^∞‘ÂŒ/∆X€4÷:∆_®T¨¿zåŒ«ÏhBπv∫¸⁄ﬂÿ∫suq∞7∆sÍÜ∫Î5™‹"æÍS¢Üº.◊—1ÍÍêÍíΩ—öBœ?µVASöÀtä}cŒM£rßﬂº™Ωyñ¯5ºı[g9ÎV"„Nqd?“Ωjﬂ c:ÒÙmöÌ5‘‰°vØ"Òµ˙ö$„HCÀ®jv‰™Í≈Ù	N»≠K`ÄUà+n=)Å£◊/ä‘øc∂_D<‹0$aóõ≈V3°‰–Cﬁƒˇ†yg9‚˚ËáØ~G¿≈“°¸^˜ÉnÔ∞kÁ3(>6N6à„∫}$∞˜Yûr,{©ÿ¬M©_•Ú˘÷]Øô¡¢CﬂBŸ‹:ﬁﬁ≈¨ã‚IŸ%ˇxmCwÒ±P÷Wp(“”<¿ß^9ªÜ€~ëöﬁëªhˆÅåñbG<Lyy]¥új»tƒ–Èu{ä±‰eÃ[À•í˝îUΩ[∏8h9”o“ ¸6aà∞—†∑}ˆ7È#ÕùRxÀº•ùY∫“Ω‚ó©Ì®QÖ”◊'IPÌ0.
ÌíoOa√|#ﬂmobé≠ÅHd<q<Ï7ˆﬂ•HÎ€«n◊éÂıCx”A"E⁄◊F`Cd∑6}<;πwÃy*}oÂBúDùﬂ3È◊ìÎ⁄¥_.pñ›¨b$0◊Ñıl¶Y5∑⁄j«4üA3»“ÜÅ\¨]°;eÌ-üØÚ\T'@h√µQåtw®ÌORÃˇuõunt∆µ·‘Eƒ;_$X<‡–ˇåãÜ§ÒM,dÈsëQ$
làgY≤º3.:¡‰h¢°◊q. #
àÖßÛ,ã	%ÜLVDBD¡∞g®i{{VKóNøÂqhgTõ∆zêyïæM–<Wi˛ôN SNz¿˙Ω$JG?¨éx&;X)ÔÌK3V‰˛eoa@ˆiéós€oHÒEÓP_È˝n7”wxelßgjÅzÖ•®Wör@Ã©&éoÙf{Î]— ÎJ˜BÆo¥}E˛eI"%ãÑ=Zã∂˘‰“KöeA$•¢Iø.ßIÙÂ‰í1û,fu—p{U	AiÔ:“ò\”/dΩ4–µuµüˆÊÎºü·ﬂã~ôÓi]~6˙BB¸⁄g[LÚ·í”~éiÚìí#/u&0¢Gß'2⁄rfîº#@h˛≥"5˜˚çdØ6i±Ò/1á¢œq+\>¥WŒôŒ'≤Æ»%◊)ª…MöTûLT∂ÍC÷C-7Å[|‰£V!¯P”W%Fﬂ¶†j⁄ﬁíÙ‹—E∆}Y˝I˚‚˝¸7ÚLH›wÔ∞u¿Éî|è	Ñ*ÏSåÆx∆ˇe©Møß¿!5†Ô˛N¶QíÒëÑÂ)˛Ä>#Æ◊-\\Éæ”√ìwÜ!±: áóuÉÊƒˆ"F1u|*–°‚†¥ÖÀ-•)=xK1ÒJlÙô÷i<ô?Ñ—#DÜkƒÒ§Õo“ë»8èˇêFÕß…:_cÍîFF¸19<æ§e¨ê‘e…¸ s∫Ë¨-·……S‰~ˇà5Z®2xı˙r*∞^ü@xü&x– E3j≥Aè%êˆ‹ ⁄BAÑLÏ$Êés’(QŸÂ—üeøZüjXDÜ≥ﬁÜ¬◊ò2±uË~„ÕJ¯¸Ãß€ã¢¡/∏ﬂu;cÛﬁÂÄ1ÚaãgÁ6Õ]ñ8zuØÓ“√z h{◊Fû£¸˛≈‚sÃUÅiˇçLr|ûB ®å‡$±üI£Ò›ùù∏	ë˜¢˝^¿6˝ª/:√…ˆÍ÷7
…5øÀ0VÚ{Òá‘ü°¢¯ÇT∫îÌ/È13˚ˆÖj
"§7áw˛?S ”«)€˝^è[úløﬂ€âíÑõò¸≈˜˚‹≤ƒ¯‡vÉÀÛ Ù~ü%ÉÉ_®Yü∫'váE‡JÕÅèUeùV!°Ôr9∞áarÎÖÛµ|R&XÂê|hbÛ™•f ,É¯qY‹s¡&i<JzÌ ıËA⁄u€•ß¶ËºLc‰k∫KLqÉeéıí|älÏa≈H„G3N_t@˜≈7∂66∑ÿ÷ÄÔ˚PBè⁄ç~*)Â…”A…L-”õ˝oπ⁄}ßÀ~èˇßÔ"I⁄Än}Œ§xÒÒüI@˛,∞p˛ùê¯˜-a˙∑J¨ı¥Œß˘÷œRi˚G)«_·ø¬ˇ(m41F_IÙ--”üí(3å∆JE"5ﬂiµpÿÄÙÆàO7U@Y™`˝ÂãBs¿e©—‚zΩ5>‡*ªK…’É®—‹Écµ ÕR´KñÀ“Ö“)nÖ’ƒ)ieÊ9-qˆlÙ:˚–?É>òˇ®ñÒÊ‰≤mN~í¶ ”x?∂ìúodd•V™åø§ëNó¨/pÓ•πÛ0â>¶‚ﬂ„‚ı[E§?eπ%Ç¶¶∞óöêÂ€ 1´Æg‹i¥!W•…•AZ\Á%mÆ‚€Ò>®~nÔcJR'˛{∞Û˘Zw.˜÷È=ä˘,|Gá#O&ÎOñ¸m£ÑO˜÷A[XDk‡Ò‚"ªµ˜A4∫‰öÙ‰ã◊ñ˜u–ÂÏ˙Ê‚›MCÇ∂‹Á˜ﬁÔ]ﬂºª…Æ±
î‹Ù◊‡twKbüÅó˚Ç∏}VFÙŒÃò}Ù¿{‹vÊ∑œ¡0Úˇ>ÑHf™a!Ÿo«É Ã∫-2πÁEˆ‹ ø›T“Í™KñRÙ‹FgB≤±¯◊Xµ‚pwì¶‘¶•…‚a¯ü◊x˜]o“÷≠7´›Œw†∑î≤W˘;
∂ó.√Á·6Ø˛0W$z{˚“±VŸp˝“1ıÏê]:Ü∑nõ*˛ç…Ë7œ*ÏlöH4≠0·èˇ Ûåûnù`Xf÷˝Ã2ò_–®Ä˘%nœÊWui}i©tí·fòË©Ë~Æ,V˛Æı”Ÿu¸˜ÔíüTÆo˛ÍÓÊÏblô7¯p,È˜hòù~1«r|[”Îö‰ÃÜBÂÉﬁ{êW∂¡!hP&0µπë´6K˛Ùöufñ’v]©æHÎª∆ñN}ûáÕÔ∑E¬Í"_s;|~˜~¬◊ÜâyòX‹ËG)¶ãæôﬁØâuHcLüº∆Ã‹›;J‚f23{ï®¿1G·7™πlH:||+Óµ{ª¯ÀÕÓ._–Ë€®ªÀW7¯ÛgQ¨Î¥¿V7y[Õ8Í6#¯Ê^‘éw!-áˇ}{„˛ÃCS_ò;‚Ωn¸ÀnçA£{;Y?‡æI:»–∏‡SÈöŸaÈF‘oºó{ø@1Ÿ- à"Ω9%|&oK%¡‹säk∆â%ó?@¨§Ïz‚Ü¶˚ Õ≈(BÏ5Ri˛ÿÎ}n-ÏÙ{ù
∏m∂¢AÂ¡¬¬Ç÷∫9ﬂ∆Ò!†÷õ;ÓéË±}>3¢ù∏∆GØ◊ë–÷Ê¡MÔä,iò%˜†Pu©ä„H◊îøÎ ﬂÀÈﬂ5Â˛örMπøF˜_?‡ÊwØt‡”fÉO[|Ú√1ø§ÆÀHòLàL⁄&17–ÖüÃnQ»<™¥¢kÏ]Ï◊æÔ«QRCÁﬂÆ„„ª√≠‹M»∂z@ŸPs`r„oKñˇD´“+ôÖTëœdÿx=‡œ˛’ØˇeÇÒ’äãÌ©ÿÚÄ¯<ÍœY~ØVÚ+XÎ#%uÒMDíÅ‹òaáfbÜ·¨&ùe›è+Zî‹ßQHeWÅ¶Àüu–ùâHx”E]π›π®G	e„‰ão§DyòA≠d7óŒı≈¯∫ß>⁄‹eVk
OòqdÑ j:åpM):`,Ò9qèÔÅ†o>Ê"T"—◊Ipœçhß¡wCïRìòoá˙h˙ø-V˛¿¸Ü†¢j‰-Y¢¥ﬁ®€
™ı&›_ZÁ W!7äÕ≤ynÛÊˆÅ’‡ë9å¢9\OX”<©!«RîW/C%2≠¡Ú4ú∑wH¬oﬂ`MÑ_±1C@€Ñ¨\»-ã$)ˆv"=ÀME≈V`R∏XÈÌV∂ın˙À	•¸PjC°‡Ë™°ÿ»∏<ëU{¬;|9Êk`È©◊ß‘Ñ‚€ÀÊÿ*]ÆÑÕÿ™êÂ%å¢um Ñô‡*Ô©º¡øqïÇâæÆOwWTsÎE”…UÏΩX•Ö N≤å¶g˙,“´Â#¬∆ªº›rBÆ+ì’Q¬0÷ïâXRxhß°u≤Y‘Ê˚˚ªrE∞k;™j«ÙdŸ&»`÷H).–ERŒØëú;EÀkº·‚céYˆŒ«≈QÖq$q] G…“Iä?ó˛*
∆†¨˚lW*ôÜtO\8m´3¥Î-(4õQíl&ª&√€ÏBáù+◊/‡Û3:Ây!}ﬂ⁄iäﬁ];DÅ_ HB,Áól#Ä…é∫`«sh¥Z∏º”€≠l„K¶ !“ÍÖ≠?7¨ÚÛñÏ*É‹∑≠œΩï∑å*]ﬁ`K	á“Ñ›i´Ö¡≤•føÒ6⁄â˜Ê/É®/›Pe÷Ï+“ä)∆∑}>«≠uzÑ}6è¶ØBıTê~
◊KA˙»Ïr√æ^ƒƒN‚Iú∞ërC–Æ	<Tìáb2õ‡KíMúSÁŒCªb≤Í%ÛÆì’L∆ÿæﬂéßì∏∆	’H≤"°ìÇUÎusøÄ‰X5îe‡zf£5˙ÚuXáˇ”ÿ5+>0∞”‰≥Z‘Fjffvé-/-ô}¯fëQ˝ò√!^
£”¡ûÉ’zùoEA—! ﬂ(˙F|!Tâ¯DäB~íö@|b.o≈˘-?ÛôiU£ñ?NkP0éÊ∞±“å¥≠œ CZê¥ä*)WéK3»øRb&U¥®Øí0”®t∫MíS;œ–^ù•‚n≥}–‚öqf~f÷ÂÇxÄûèª¸ˇs‡kÅ?‡x)´Mú£Ú™2†‚¡ÕN≈Œ≈öÔÈ]©‰N*È”ΩÎûBM¢Ò∂z&Åµ¡‚î.¥u3’zI1ãæ»’´#ç1à‘à"/ÚQÚBØãÂú"¸sy·w©‚¡VøSXE∂•]˙å¬C>•ˇPp°5~&ÇîÙ5„ìæ˙ÿ∫“§—&∆ƒ∫Ùπ≥ﬂdÆƒÖJüÖì¡ÌÎ˝"t˘;ä?!äc–c- îÏ≈I∫z‰ ó»“®6âc[=™lBvä˜ˆ©‘1ˇ‚gáöÊIa7:∂åˆMÖ@ãC2ÔÅ|68Aãâ£∑‡BÜ≈°•ü˚%tﬂeÛòæu´ÆåÍ
‰#‘p(i¶Ÿ0òπ?_≥π—$òI¶=ãIõ@9«0	fjKµÀÛK´ÛUﬂf˙Æb#≠a¶≈*;UX≠J±ùÅ“Ì]%P∫Jë“k"ôç¬*À◊êízB¸%#◊F?ûºE Ê&*%)È–#sï≥[OîòÀ≈b5áï!ì8]åy¨ôfjµ»rB!€Ì∑øÒ"¸ÛIà;.™Mß’ÃΩ8“÷˘C4â~¥Yt.Ô]õo3≥ÓˆôO˚√€«ç™¢Ë€bÀÑH‰⁄ÊÚ1óèósL]¥d·§dÅŸqaôq≈PÈ≤,«o)¸9ÕbsGı© fˇõÄCˇ4≠;óÎÛTﬁûÓFLZòÃ÷ì)B`&|À∞5c˛z¯g i„@ÿ=öD{çvõ¬¡∏£è!ê?°åG÷[9oWI∂õìÀ #)0T´$√¶414ë–å≈¨ÖírZ§Z6*Ó’1®∏˝	
uñ≠J⁄≥Ï'ôê∫Ê‰o˙—/bsT¶zIbúÇŸ85N—Ùú9NÅH€úâRC›◊<H$ﬁÇäÖ_Ô™|ÃÈj_J£ì√gò´ŒtH≥ú §,ëﬁ∞
ˇÎ(jÙán≤‚óèÉãˆ+Ø≥≠à¢Ò_ad†ﬂ"ñPAêdƒ*πﬁêZ®–IgAç¬“ÂßHè1eò§Æß‹Ë∆m≥¨œ=dqëAr˝†«Ä
hû:êù∏AáVΩ∑É_Ràfº√èq“=_k„VÄ9∏º€*Üñº8e‰‹±.ÜnìnYâ=r]ø\ÛaxæŒXÆÉZ ±\c∞MÉÇ÷◊"‰Dœ¡¶y±»LéëÕZ›h¨l÷ÍFcf≥V7;VÁDå:1cARVº¬FÇŒ#Vo,Å¥&b ‰˙…TAÙ≤ºm£ı∞ÂK∞QæôëÎT‡nÊ^g|‰éıD3 P;xDºL#¨¢l∫h»œo§Ö,n¥!∑æÒÄÚSIË Ä≥êWY)Y˝≥∫õØívÜÊ>°ﬁôà∆äª˚.ΩC‡ô‡t	¬Ë{åºÀÀÇ«gØ∞è•ºÔKM
O[ “0Â˛uv≥€¢?√Ñ0wrG'u.∏√Q%˘dŸÍá¯Èd◊Y∏Ωëˆjjrd˝ÏíaO)ˆîc)…‡æw√•éek»3È±≠çÙp˚ï∂7\£·ÿ0x@ƒæ
2ˆ1,îÚ–Lï1©¨“E2U^Ø®|â‡çq•K∆ÄúÀñ˝öêUã13Ç$sA^eÛññ¬o
à≠ã§˜úU∞?®#§‘ö∫hªrdÒâ]	{ﬁù”{Ë°qeC∏Ç~üOòhèKZ‘7"‘ˇY"ê>[g ?}˙√”Ø~xJQ$—¬Ó¬K!LÇ¥xW_]-„Ô
>ﬂ£˙à˚Ã
è≥á†1î∏†~Éß”£ñÀû∆ZÑ{Ò>πv«˜Ù‰|≈Y+N‡ê™eƒV$tœWb≠∂pÃ¯oéî t,!¥–(^%(ò∫î√Ùü3ÎL¢†¡D‰¢ Ú£Æï#Ùä™º8Jh› ê◊Ã3(C†ER¬3¬˛UµæSØ
úxE—ÈÄ*V•Ï"µ≈}ÿìj„ÕQ4Á_?ˇ◊Ô=ô¸x¨Fâˇ¥EÄZ)çy⁄ô|øáY˛aîpôc<≠-»ÂcfœÜ|ËÄ{H≤;.◊è&»02‰åæL@aÏ?)„O>A!tµ[NE4%˝N%‘≤ŒyÀh≥◊Óıì…üSX◊(äD}N—3ÿ%{kÆõ“√±\]Ñ‡NØÂW‹ïH]˘Ø«˙#fﬂÎÏmAÚ0Z‘ˇÍ…E˝[@äK‡ñ¬8›∑≠›rØn9ÉN“Y«ø˚ΩC¯€∏<äáQ‘≈ï†.ﬂ¯ë˛ÍÄJˇ»·v%2åò 0Ÿõíàz∏Â9EpÛø≥Ûmé9∑∏Âa£¬èÿû˚SA¯ÇQÍ"‰Œ|.~˜Ë9QÀw*Dæ˚$ö˜Ωp∏eL∫#=ÖXpvs)°ä€5ÈV´@÷£hsæ,‘ëi™<FW
Ö¬¢¢2–Òv8øó©Œ¬¶àuGZ‰/ò'∂ñRôîˆ™ìÜ¡a¬É‚íÍ˜≠F?Hiø≠_UæÖ§3Æ›¬N≤{z¿F=≠Ã ¡et.€]ÄnÆUÀ,R0ì˜/(ﬂˇí˛∆*züÃ‚‰“ø;π¿‹º√M„dZ©e"ß”®=j•fÖnVÆMÕ}‚‹ïÈÆêÎÌv	ùR<Ai`s¸="”…ê…/_¿&/å¯™+C‘øC∑PwNπ‡óß¨]FâË/(
∏?◊-›íü6©zÒ€
få»Ô…«}ª=ÆU«%èÌ&	<G›ﬁ àrÔ‰¡…<¡	ÜO0Ù{Çaﬂì–ˆ>Ê≤ÓΩ∏è‰Y!f3∏ßv⁄Ω√˘'ÛêåS™ü≠ª
Øä´ƒÏU‘CÈ¢T'Bˇp;º›ÿ˜ÿæ_ÏEçñ«QÕ†Ø≠g6?E≤¶.ä·.ÿbmÛrD4zuï8¯"KG@~Ã¯C{\{≠Ω6√Ü√7∂Ó\]ÏçÛC›µUnR™¶\Ù¢ÈÜQ™Ø#~-\≥∑–í®ÂËâÄô=ùÜ.€ZÅd9˝ƒàG·òp>;~€”©Z“°I>¬Ô%˜Ë≥îr±◊ımöÁ8‘‰!æWëP\}MÆ ∏Õ1ÒG*øzúãBLÍváUr{ ˛4ã[OJäÙãR„d„†ﬂÁ˝ﬂ>XF&:Är,'ÇsŒ;0wä˝Ÿ˜9Ém—é°o°l†é∑wπÕ∏o8Õ∏‰”ìtzíœSı4tq'hz‚"I⁄Wñ‹¸Àt∑›G>p˘»$\∏BG}Ä‘qNn+K^W≠ºL/¨§⁄‰ˆÌÙ∫=eÛZêD{˘g?eUÔ6.ZéÉ>•rﬁ ¡0f˝ÇyÛßH¯º¥∞Pü•F:ÇX„ëùOò‹Ó˘‹#≈a˘o>Ú;,7î.ú°‡úQ\ÿ|sïÇï:Èuq(Á
ò∫Qxl'©6ÄSΩ¿N<Nc1{jzÔt{∞@ÂÃô≥*Oˇ  ˇˇÏΩˇs#«ë/¯ª˛ä,‡ä ÒÖﬂÜ3-Ç3¥HM`$;∆ú–·–0òöfƒŸé˚|q~≤Ô¸|Á€[{§∞µ∂¬±Oq!ˇ+˛ﬁ˛	óôU’]›]]› Ai¥lqÄÓ˙^YYYYôüL(QµÂäÊ∆¯∫∫œ•
›{É”>I/êAÑlÑÕè—ÌâJBô≤J–]´ä‹35Dw;ç⁄+‘áõÊ97ª.1~ë[ˇÎ∑4Éb∂kz
…-±û®}aeŒ˝Ô√ˇmÓ˝OÏnxô¸•ÌnÚŒûÀ©õ—e∑Xi·gˇœuGKXÜ~•◊e:√–@©‰k,Ãîˆï≥˘IIWå@î˚pbe;dø5√ËPáRZÂ©üŸ,Ù‘èg≠«±ÉcB –â=ÖüC†Mh3•ıv¯L:µÛ/Ω†ö:DOœ‡r∂⁄uê©ÚÎõ∫O/<Î˛v’≥2‰üÚ-\ï≥‚ó≈_`rE»˜ª	Ü¡I‘:ÀdŒ»äpt+Í8ù”R|é3…Å≤“Y©?tÄÂÄÚ_È≈¢	†∆œXñ*'ÒEÜπX‘b“¬π˚kHåçÆ¢±„⁄ÊeD)fXGî˛´≤êöcÀ=/i+È¶v¯4 f¸§qtJ·’B˙Ë§[@∫Ù2%JÜË2õÁö4;,á(∏SèªCW¸™aú∫dÇUyr(Têh˘ûÒHg/Yy—G»ÔüˇkJ∑èQDq:•a◊ä≈ŸùœS±±…È‚c¯õŒ‰5d,¸by?∆ ›ƒπdÒsôˆs&/_¯o≤∑MÅÊå`¢GN0döh¿Û(’®;G`E~Cƒ ‚µ' 6„'yU≠j)I‘zY´X/Úœq>gÒ∆œú3 ˝˛ËM∆øy¶….:∞oúÃ ‚∂s„ÇL®ﬁ?Ê‡Ô≥±œ0€à¶iuhÒCø/úÈXN)s∆lä◊’0›tˆáEf˜zslw{.Æ^+1ëπ}gÚEB‚&`‡¿f√”€ÿZ5{¬’RnI“â¨”V”jq√ﬂßk¸‘ÕíS|L%H=^ıŸìÈØ±<¸.QI˘Ûª˙…ß∑BR£˙©fuõ`»Ëcùz˘Ñ
ŸòMB≤2
ù≥~4›Ò¡∏7ôÿ√C,àmá‰›‡Ô¬s5Ò[+ÍvoØË√⁄∑”;hˇ@Y^3y<∂⁄ì^€Íß+xLûX|”ô§-z‚'›b lF	D∏#Y∫iˆ¨e÷;~ö≠ò†Î<ò`∂ô/eóö¨Ì∑é"ø„‹Û3ŒG%≥Ò4[§(¶>$;MÑ˛•ãAtô…≤+}+ØÂ`#˛¡ÛF…KN˛©¨(]Ó[˝≥¸wmk‹øHŸÑJ∞	s’ZßV_V®©Ô±añi5˚”6ÈÉ…6BﬁÜ”'L|Õõxœé£$%SÕõ)/◊fö\ïpÆç4πV√π÷”‰ZÁZãÕeö¡%£"a ’Ò†!µS‚ÂHòìF`Nº T	=n®sr|~·ˆ⁄nreFÓ˜∫Á ;ZìÛ‰| ú‘á›~œMëGôë´ﬂõc>à{⁄ù∆d⁄Åì
Nà+æ |‚wºQè@ó€‰ÅÛ∫ﬁ<Å1”ãöÂ⁄πò”•†^Â:¬hÃ˝ﬁ)P†x¡˜Á¬ÿ&¸ã∆"õ]—9S/@Óµ∏ ˇ›Q< ìŸuÏM˚}	 ˇÑKo]Íªwï˜ﬁDZvıdÊ¡ÛjÆˆ')*OUÅˆ°0ßävÑ†E¸ËGFQ]€r]))
â–ŒúÂRé¶0mƒ7Ω|∑Ç N®`°—∑œôEìª<E`J´¨QSL@/vA”åˆ´iãùÿmg‹π#„ú^2!1n±!]ºﬁf Î˘?<˘Ã‘s´-jﬂb-«Å„Êê]›≈ÿÓ10µCº¶ £X∑⁄Á…F»úN<I{¸\0à=P˝Ûú	x∆ôœ<õÈLêîïwN¥Vd/#+!4¶8Sïb˘ıaLdì	¢GI≤y1X%jÛ2¿/SbÖΩ,ﬁ3SFüfΩ|ÚQlÆ¯ÄÆÊ0 ◊øb‚ÄS(£dLÁ ôöc ¥œc¯
√Bãî∆&ßT|àÕ}ó≤p÷áW“œÏ‹d¡•èØ©0[ò{¯áúVXõ<«ÿÛHî-T˘Y„|’ÎX$î&0„˜≠>˜=C>Ï≠R?àÙYœÓ£Ä&&6À~ƒ≤0}ÙØ7I ÆPc$É5ÛæMg‡ÉﬁÄ¬¡“ôVóéG[Å∫π EVø§f)ÙùáJ√ÑKízÑÙ•¯›óT ƒêü1Sv&2£|]Är≈eÒΩ7Ã…¬≈(/•'Nø:∑f¬G?Ú(‚Òña›ãRî‘Òkˆç ßˆ|∆≈9ﬂ™˚≤E÷ç›~⁄r^¿shD¬*·L∆∏P®<ª„IÊ8«Øˇ<˘úUÙ,>©«ÙEJ8jÒí+T◊ªr/E·π∏_mIeA¢§rîM$©4/©πÃ≈§ıåˆ∏*Ñ]íô™}O}ò≥QÜ∂Ì˜Ù«@x6M?§ŸÂêàÊ”óàOUë≥·6{ñUıÁÒ»«r~pÖ@›ì¿í	»$0gó™Ë!å†‚Ö°QEÂké∂ö¶∫=πKí∑˜Ã“hùΩ√ti<éy¢ x©8x†ÿvÏ–Ê“©Ç^~}¥àD¨ù0ç¢.j≠Ç„}wõÙy·AHıùº∂ÿì√¸[óËS:œsKäæÆûƒ≥4>/[·Iâœ@Û±öå¯‰b∂"ì`»¢ÓÖ≤)6”äJ\P	õ«¨eœ∂ôÃZz ÕÖqé≥•0û4€≥∂5q˚W™sµOœ¶v°ù)_JsC#,l4uœs~¡±ñ=≥üÎÍ°}-Æ;˛tWÌÄòﬁò∂€∂Î∫›(O•Ç„ù)f#Ù˝wtgÙiQùÚ˛Åp“˛ïí¬x∏˘Oï¢˛E8&í·ç‹_àR≤1˘wqKáñhí˜¶áí!7fZ˙$ùtÒÕF\ﬁEt‚øx33VßSùvzìßõ{“†Rxâ4¸≠À0cπb9Â!áKYV”	|¶%ñßßA°BÇúI5ø$ò¬ìYÙæ(ê˜∂í∏I©ùÎl‹8@/Vã≈‚¢°—õ7’g3tdÃcr'Æä˛™å£R„EAÕÇΩ/=Êb‡/ñìãütŒ◊Ö§ZïñÕH~><N¿í˚¨Ñ√XcÁ˘µ⁄ÓÙ∑32èÁIÁ)ºlsÁÁ˙Mg"Ó8/∂3Eÿe ´ˇd˚ªë59≈ÙÜv€mg®≠ÂÈ˜ùﬁ0Ù¯ÿŒî3¨≥ù9¨∞U´ƒJPm±T óŒKÎ˛OVzV.¨m˙OÚÖÚ≠Ja£∏—œØVK´å˛ ◊EÔı˚%H± VüA2%?Oê«¸ 6oU_aî¸˝’&⁄¨ﬁYÅ¡æﬁc
h“Jíu‚Ç†I?î¿◊tö€©w˜≠UÑNnô+nàÚY‡+›[˘…Ë§ï¢ì.
ôï[ﬁA7¬‰„?Sü?cdÚ1uX1®$À;”ﬁ2>Å/ÊÌ8V2±6ò(§/Û1Yñ;(áIÈÎ î&bô„∏ïÿ† √Ïwïü´)∞1q7)8ƒ2YıÏéùp˙π„”':+& ÷ÖÅYf¬ã¨ãµBdÊº¡YÚ°ÇÅôdA*∞»¬‚UB.°.gßDDYÈ0X…Ï·GbnNH}ìò}æ∏ËÓ6]I}&f&öß Ê Õã	bct&πf\t≈XpëöâhV›‹¬z‡_Î√d†◊¢≥\ëÑ˝7ƒˇ¬œ˘^˚9z=¿^ùÕRòÀS_ú§s.®≈¸ö~YP5§],∫g&(“~˘\•‡!œ¸Ò∑ ™ Àâ‡l¨ëR∏ø9ˆ’HámsM&j˘öÖΩ.,,h|NLÃùÉâπ*sg`bÓWñâ≠XUò›ÉÙ·∫c“ZTÚâÁ≈¬r·ëY(†¡ß_&ª„-∏iv«k˘ö›Ω&Ï.’].ñ◊3wÂ‚≈_sb~C÷µ@Ak«˚Nx˚ûÉâíaΩßml%CêhØH$PÄ‘<Iéoô¥$=HI(ﬁ^–¿LÒALªıôCbÜîÚ
Öã{(w‡„©∑3ì	-_71ëBÇÊ$Öã¸£<±ÚÙ¥?Î•—*;œØæÆóF'Ç◊FÂ+ó˙˘ı¸˙†ú_≥6ÿ¥/êV·_˛´X¬∏ IªÀt˝*9ÏÁƒRìt)§˚‡√ÑhXI—ç!9ò°hÃâÌN˚Ë[»∏`RÄÀ^t?2ﬂºŒØrøÎ≈8Ôu`¯bX%∂#Aú€û9¨eçôs∆ƒ
Ä]ò3ÙŸ§9…bVê(Òa<`ñÁck	éaIÎoﬁ»=iØ≈”` È†DÀ
ê®èæ]ä‹Ñá≈WÛ!®#†]bú1éôOw&[AE6˘Lë&{"°‘C∑KÔE ÁÍg*ñ´ü≥dP:„Iz¸“§ æ=Ωq"?∞µ≠Øì•ëùM9∫∏Ó[h?Á ˇuÉCç·Ès‘AH©bI;© ±.√ÿ)ˆ:®ùíµ#mXB„◊ö*ê(UëQ* £TnHFë]Ωû§R·r +U˙´lı†tãm§DBK!êœÏ∞DLÙ$j¯	4p´a—Ò±4W¯•‰é?ÂA;Ù–RøÙ˛XN]˝è‡∫EÜu_™´en`ÒG≤&‰ÒY·ÔI•≥%˚D˘Ñ¨Ω∏1äƒAo( ÚGÇ“˙çH‡¢\-=I5HhAÕ≠ii‘ÙÎi[¨Î¥9⁄˙cﬂ™Wﬂ÷&7…ç∂3+HÑ∆J∆Ç£ÇÃ´öÛ»ıb
XÒˇ‹K⁄;|î Ï÷≥Ú†»Vœ≈“ ø^∏UŸÑ•JasmΩ]*¨·)íÀ˘Ra}}Éï
ïrær )‡[mÁÆR©‰ÀÖı[´‚{•∞∫y*Ö *+≠S2FØ
•[eV·±JÚ©Ft˘∆YI µév˛L≤í?jåç√¨&L›≤ÀÌíˇôˇ<;™HπW˝·’G/W^}˝A¸≥§g$a”Â_QdcØ~˜€‘º‚»ÅsÅ;q¬πÌœz]q˙Py»2õ¢s-Îpˇ(÷'üŒë5Ü5@Ëjπµ‚Jy˛øTXH“£&[!Í†∆«©dË!·Øâ≠H$(∏}Ç˝ÃŒ1YÔºR3rÅa7“œ¯RgôÈ2w„Ã…aURâ…b\≤∞ólgö|e°of∫ |Ó¡úaÉå¯=ú‚Ex•;qÆ'_,¿¡˚ƒvGpÚBu¬p •äypùÄÑ¢c`Ai{ÍÙ"êÉwqË‡ë=mË>€ÍÑ‘!^¨©ç8˝¿Z‡÷&)Ü.^ÚËBŒ6'ÆËT‰~ïÉ‹Ø™˛∫”ß¥öˇLg•ßﬂO¥Ózı¶Úõ˘\jƒZ°òSjaÖ=œØ5ç{íß=Atâ≠D%Q‚r‚âP‡Â4…@¬ºÒVk|ñÈX∂€î©Õ+ÿ^Ôı—÷ÿSÀyBªlwHäß÷{œÇ}%]dO õ˙û¯€aH.¢≠oIŸ©Mj—j\ã≤äΩ¸Ô•p¯;I…‹ùP‹”˜YVSZÄÓî!y”FÖL…4#ª+≈n©£?‚ÁÀv[◊∑áºIkVø=≈-´Û⁄˚≤á?3≈∏ƒœq.Ò√ç`|ÔÎYÚ™!/Ω{H±ücƒ ] Ã∏—œ˙a
V*EZpŸ¥·)Ò3Ü?	o∞w38ÕÕ"«„/∫Pî·Çd_≈òÀ	C´#V´5û‰ À,[ÃŒ®b¶ BT5^º)“ƒ‚lﬁ¡à\ˆœÄ·À°1Ágåds¿Lk7ò`c˚ª[L]\≥“ög∫Ç“Uè8Òug≠2k86*&4tàhO∑Ø˝‹ÃqˆÓP∑fÃ$ç68L◊lëe3@’[qé|÷ãÌàÑ;s)ùûãøŒ∂ûáŒ^†4zå„»»Ñu·Ï5Eå—BËk9ç,˚hgÀr'°Õô?ÍN%«˙‹plå1CF‹Õ9pÕo⁄¨BW·äÂYê';ò°3¡;Á9H dF69;”Ó9Ìs1FjÎ2ï±eØTcûHÄdOâEªP¿v-hÖ0√+?’{lŒœ±f
∂ÉüàñŒjπN
”DZ>öD?`ßVŸÂ«s!õ5áô94˝∫kxÆÄÑ_»ñ·nøﬁ.îœóª]x
ÜØ‡VÁ°õﬁ&∆ÚÎ-‚Î-‚µ€"Ê]∑ØÔˆ÷~ΩI(ü/wìipøÇ[ÖßªÈCl˛z€¯z€xÕ∂çÎ≠‰◊wÛ‡ó9m_œ≠P≥{ÃìúäMˇÂìﬁêàô;&cŒ?œó÷y5#ÚqLßøf¶à∫^‡‹ 9ÒÂj¬Y#”ï∂¨ ⁄≈xºÍz%Õt‡ä˝I*?◊¿l∆u^˘{´¶^¶°‡ì∑.Có4Wl%br8#;ô}9ÃE€bjM}!DΩz¢é∏Ÿzí†Ó§8Ã·∏Õ◊·l◊í®$D˝Ï≤ëÄ;_òH#f®∞¯I√ì*DCÆ%VHúDoeÇ—å+≈0√·ª¸òb»réTO™’∆…ˆ≤‹Võ :úeíÍ>‹Kù⁄Ù'Ö3~í#bãäì£bãÑIë±y≤$k8¸–ù\>ˇÃqpbS8»äö"8üÎ:ØØâﬁÎK≤{ò∆˜$ç;-ˇïœªîÜ(£FpÉŒ÷s≤§CN∫I≥!œ≠Î∫Ã< ]fC|÷‡A[XõÕáñÊ3løIVQÁ¢€7Ÿ∆˝5´Ã -æ<ªÂ˝ÑœK´˛œ|˘˝[J⁄|˘<_‰KlNg¨2Äß¡è˜Woÿ^ù"Æıå÷“Só˛7∑iÂ·≠}ë T¡;ï‰∑+”%cØ†Ω≠)M≤ÀGî1¡)Z=ÜJ#›dÕQ∏(Uq/Wùø›∫ÇÅ<%ï€hxYm¬≤⁄º¡eµ |„ØäØH™ïóÍ<{Á|5bŒ¨<ﬁädm.√ˇl»˜$¡?Öü	á™?r<Ô ∂Gé_âK¸Œ ˘j2ÚA2ä1»ÚÑ1‡∂Í¨o[í2·àÒ"ïÍÏ~<Ô‚˘0‰çK√…!°—≠Ôc2Å˛«ˆÿÁÔxúÄ?JP„üzCÂY&Èü©∫ﬂxa=·ßû˚œü•%ÒÁ´ ô5/È∑dÎä…—mGh˛•∂˛wè≈ˇ‘{èˆæöû¶É∫NÈÑ∂∂Áˆ$I¯O•˛:^8Ñ>èj·z°ŸYt:zCÊL«llw!±=vÏH√ÖR;(Û∞|€ñP˚A˜#XnœÏdo¢D_¢ƒµÚ|Ï[cÊ∏å±ô4'å´•\‰<°…Æ
˝›˝{˚ÕÍ´6õı£›ÍQ≠Œ˜ÎıfD∆ø¥06«∑hZ-æ ,4VËX√∂ù%Ã}Äáïv∂tÒÍXxø√‡óÇ&Å* ‘‹ì<ÂÂf∂òmxàÔŸ6Üœdﬂ'ÁWèÅÊóôˇõ'}áïñYq© áeJ:øtÉ´:vT8;É‹%„û@[Å⁄ØñYÓtôı®£=¨!jlãQ»Ï>:Ï`TûÌ√·"EL$|èåCéE£ìgæeß÷¯"≥Ã2{vk,ø"‹~©é∆Ω>B/æ5i €û˜È}u⁄ÖUÉﬂˆxØ?¥'é¯zkF>ﬁµ€∂ÓÍ)òzÕ—€q{Ò q<µ›Ê!√ÌN’õ3S`qΩ•∏ó\†∑l+4 Èù∏8æ^0^s°7l˜°b7.$ònI±˛Ê,0R
≤¬4∫÷ï>ÀÄ·~·|¯Û7qÅV˚}\%tò>uäÍ$Ùr¥˘&X•åçÆ´TÊà´Vÿ•´S¸EÈµ¸%

ó†âEÙYªh˜mXŒ=ÿÑ02Â‘eÁ¥P—úÂÔ≤Ï1ˇß ˇŸ„ˇdµ<q∫›>-£[	å#!j+∆ºÒÜxîÂE´‘˘E| ú.÷ä∂#©	E…Æ`®ı∏y°ío´≈?Çê'Ö>Ü=ÜõÇ∑E„ˆ#∂—®a(Jü£ay’!≈dó®Ãp¨Õ·àd;VÚUg»WUÚÌ≈ÁìI≤Zgä»(mS]iÇñıé.∆ÿ£Å»£Jçöƒö©Ωälw—»H∞(Í/FŒx¬jç˜}!¨˛¢çj~!Si…ü+©yfJéƒáõÌu¿Ã€˜ÖˆÌ«ql›òPäÄ}2€8».˚ûà˚ª¯ã<&óC˛âö“p[Œ!ı¢√NÈ6¸sg[›Â·…;ÔË√≥â&PiOv≠X;W∫ÄXQô3ê7À/.è«6]UA´˘quø}∆¿éÌ1™'¨Æù’˘ˆ—;œqh‚7÷ÄÛ»0ù±X88#ﬁ¥q!hcIc:Û◊òÃì≥êz%|ÑãÊë>¬È5fH÷÷s˜∆=»2É¿[ãH«¿,÷L1\üQTi+¿øU¥wè∏#ZŒkÀªƒqªâπ(@nEÂJßŒ¬;Ô$–ˆr"èSÊ%.£òNëêYOM7Aä˚?Ï¢dø$öw‘6ƒ”≈®Mæ|°≤Ñ~.P‚J8Ÿ˚;åsæ’^ÔÖ›…ï–G.˚6r±P|[œæOéä€4ùtt–æL
√©˙RôS† ™OõÇò˝{uHÙ)îqè)¢≠ª8’JmTG!3∏œj∞l∏ÿê˘ﬁtØæ∑óÅë”çÍ£'çÊ√›˙Q≥¡j’ì:;|∞[?`ç⁄˝X~5Ô|W=Üû‘ÔÌ7öıöPn0œ—ÒüŒW*∏¶Øû<.†Z2ó]ŒjÉÅ>zR„Q[’ú™$º≠±¸ﬂ-ΩÃ|bé?u•5Ò7©<ë6πÒ⁄ò‚r_1fö¬Çˆ ¯Çå˛°üƒ5Ó≤'ô∑.·+åpÉ¯3ú_∆6MÂV2+ Œf3ôÏ“UÊ…í_SÙ‰"{Ω°a´jıùñ‡À;5˜»'•«À ¿‚E¨_TÆ¿´€Ìsk¢Úˆtrñﬂºù’à6^\Ì1Ú‰á'ÖˆÿñˇÄ†Â‡wÎåÕ÷ÔüBæé”ûpmÚÃıæçør+£…ây
\Ä˜ZSÿ^2Ác˚NÕ–àtÈΩÔX»Û§Q;lú˙õˆ)—ÿiï^ù…h^JB:UñÃ’)"8`ubä◊eºi. Œ»∞S;Ôı;9lo\7⁄9¨ãp,nlúgv†8Ì»‚UCÃ‰ÍœÅ
~-¥ï§n˝T®MÒëƒÙy|†W.ÁÊ@t]‚Íx¿?s<$^»OΩ†∞?ì*◊œP£éä›O=&Cÿ'∫l±'\v∆8∞æ†'ïúÓNm\ 8lTı™ôà@§X`fÀ
9£ã#-m{D|Yè¶¸B˚¥a#q_ıÒ]cπjè*«¿ñP8ﬁ›cM{0¬+mhÖ›ûßÕUWŸK‹∂5≤√úI=µP9˛R√‚∂QH€¬{∫≈Zé”∑-Ttp\y”âfÑE}–vê•≤ÁÙ•‡¿"Çæ«<maë:a≈µ7ï‹za÷Í€c‡?R·çñ∏l‰å¶#'Ä≤Øi%ï™:sÕÙ≠†c^R“ù[}xC9˜û˚ìA?ÓDm8µ È’≠ˆ˘' ÀæZõ>’‹ÁõØˆyEêπ4ñœÕ{~â9¿»Òó I˝¯k:ó·£N∞¸ëeo«◊Å.Cá Më÷EÓQë—2Œ®˝»{§¯Œ6{‚ôdnÉ¨ÂïsïπKí◊ô•=˘õ9ÉIñÄ#£øã∑ª√ët'}â–‹F£z‰›˝Œman—ÔuA2Áv∑qå≈¡Ó d˛.¯ÃÙ˙[»Ò≤πÕ/Û›ﬁAD›D[™ÿ˙ÿÈ´L’ıúô∂tµ(Ñ∆]	÷7…Ø›1tªG*[Ï%ª|´“
T/p/‚´ÁtNÙ‹ÿˇñ’~⁄%ìºl«YÈlÌÏV¸49úJº◊òák∑CYáãmÜ]>+€g⁄fxS«≠µ√”65'ŒˆU√•¥ö‹¯˘9ÖaOæ∆*µãt⁄õq˚4j+Ö∞Û(”ò“´ÉõÙ˝õæ”Ï›î6¨Ã„G¢ﬁ¶¨ëÜ4˚}8W¸VJÁ<ó4ÑÓÔﬁÚÈ‹⁄ÿ(Æﬂñ¶∏Úqku≠Rºu[`%≈ZﬂP$w‘Åõ√o†≠úJ‘ú}n wqÄ´ˆ&¿bãÖ[!é4t∆´}z∫Ωa~‚å∂X	Ú ã˘1’á•¶#ﬁ8©˜úì¨nòÔºπ˚†÷¸ÓqùÈ*∫˜_0ŸÓLzìæ}◊®2STeı›{ıË-Âä+ìÜ?ﬁÜÂÔ{:GL«˝\ˆ|2π[++8n°Î8]8Ååzn°ÌV⁄Æ[~óÔã€˚»f∂û√l˝=ú„nØ¡Îﬂ¸∑Y,~≥”s·îv±Ì>∑Fq*o™|`wz?–!·˛~dum¬8˝¿ÅØ/|íJÄBäÉ[‚;˛!§ªK/SQœ·œÄØ9∂ûˆ&yjïÁ∂G[ìæ˚®·ï©Ö°ì}fb®êËá∂)[¸ﬁ%C}â&KsßT◊∫y◊˜ŒLŒ!!¿ê“õîçL3†ÔÕ3Î¨ü)æÔ$(g8±zC8¯öÜA?—8◊ÜLB.⁄bÂ’Ñn	W<´”õ∫0
Â§‰/Ú‹ˆàêAŸl˛√8Wl‹mYπ‚2˝ØP\3˙ñZâ=2◊È˜:ÏÌVgÕ.ô2=Gk]\0≈∑õÿ˚!ı^‚Ò:ÜNfâo`y2lö£îM;CÀôLúÃM1’‹¿¨˜≠ëD~õ´3n˚‹q˙ybª…Îé≥¨r9ˆ?`°iñ§ÓR,Icq$?íØ⁄Ÿo˘À¶L ≤…„—àË°ÈL=LNw⁄öiDK	s.Giucmm˝VÍ±ﬂ0èΩQ\∞h[oHlËÚ¿ûX˘Üÿöï_Ò£«¢BàwmöG÷câêéï÷S∂ò±“kÄé=)¶∑RY-≠≈Ëø¯«€aUOÏ/à¯π&ñWè ˘.Âã`Ås¥¿l$Lr@ˆûsiÎ˚gî©>ô—•ﬂœgYÏ°CˇY‚~Yw‰XN§¥‡—}q√l¶≤π¯Ñ7 ´I2sk«[p4œ∑ÈŒ–~Ü8Ô≥≤∆˘eHÆda\wL.ùYˆ{ìì¨·DQÆ¨Øù≠Ækµi:ùLR,}Œlªlóµ∏u´‘*µ÷Ä≥∏úU⁄˙î·Ùg/¢.$¥&”±ÌÁ]ÂJ´	ÁèÔ£kû)°ÁBÀM∂Ñ3†99üL”ÎÊq≥I±ãEÒI.ƒ[´V•µôFÇﬂLÇfa0Å›·ñYúõçè¶≈§ö∆$A≤XË6]hMÜ˘d=ƒu6'ÚO≥Öê&‡&‰ØYŒ IÚWHdLh˜:ﬂb¬Ì|Ü£ùπ—i&tãº·gû÷ÑÕ;ˆVc≈†pª≥Ø˛ªc¬|ùé—Ôó˜+£ªﬂ!ê©€ëA,íˆ4∂3KA÷‡]Ü9C≤˘ŸŒzú[ ‹˝èﬂ¸‚„ˇ˘ŸœE!G´≤ÆX!oq¥¨ÿAIé‡…˙c—®†¢«‘%î—vF’<ò√≥'°}o‘Ä¬fK>Ù:ùæmsQËyI∂TU+dJ` ¢RZœ[ØTy∫Œ‹≠ù[c´o=uœ/¨eˆû5Zg”~oô¡ò®Óÿ∞±∫;È†^•¥â?ˆ˜è`ø›(≠≠n§ôLYâHA∫sè§B+ﬁ˘:Ö˜p‡flÁ†zÙûgÉJó ˆˆˆk˚’°nœ¢˝Áå∂§<ΩÌ˙·ÄYoËh^*Û∏"¬:O•´E⁄
B=t∂4äX÷&{ 3EòÅv<êõî>t≤HXÛ…!rR SÆ›Ñ`V^#Ü€8H◊'ö}ùÛkﬂÕeæbD+–?f∆¢Nc Ö–’`këé“T˜÷eZ3ë“"˝´ä—ôfæT[ÛÊÁ¸vrÓ$0©—öÓ§@ÖzÎRö◊òF3`*≈öS∏≠v3/∂`:¡vDÏ∞i[Ìs“≤®‰è⁄“∏≈k√∂˙YÖÕY
3Ìﬁ£f¶lëYé1æt€„ﬁh_¥Ω`÷ü°+ öÊÇîÀÓ>8ÊÛ¨§Nv9÷œˇDtMâΩ Ö‹g‹ØñÅoEMzï±Ô@h6åàê1‘
¢êˆ¶˝â∆$E1∫-xÊÍd≤´iñ61Ü±sXc⁄Ìæ„j¥f⁄T¿LV⁄(f˜≠òIñ6Ãû0sµ§±Œ÷ZW{ä<B
Â]k0Í€˘>∫sÈPÚÄ5µ3"`ÕCß˝TÒYå˜ù«ÈπÌå–R∆Ûm÷jKaE,ë	bÈk
Dí€éqúæ¶’Øj∑¥ £%¸†±*2$B£UDg #†ÿEÓ˜#Ízåá4~Æ∏Öl<◊Ä:77ﬂñ.ÆÀpÇ[Bö‚»YlÏ`⁄¬Z}∆∂ZìÛ¬h–@WÔ≤b°TF)¯òc¿∆7\˚\˜Tœ®ÑÛ 6Jo~¶Ò|»úp˚¸ëX<‡Ø(UÙ‚ß≤º÷d‹{Ù—ŸÙkx	dÏvqE∞¢+Ö∫√6MÉ\3I¸ÜO—ÂÍQÎÒÀû'≤ J].îØ–ÎƒÄæ@∂S‚WÇ\Ø⁄Œ∏„2‰ûì‰≈k¡3D˜¡’Q´@$«9Bü∏¨fA#Cyë"ûY0ˇ„∂÷≈Fq√iB‚ã∏4˘1¬S¢í8î˙∫⁄f»©@tduà—“•:\qn˝⁄·“'æäÛúπv¡—•¶π®Ω86C?◊w1¯m¥Q:*À(jEﬂh·≥YqÃEW—ÊFaÌ6.îé}fM˚tÏ„zÍN∆ÑåÆ!‹gáE¬ô+ΩÃ$$ô¿Í µ^√-l©¿¡ÃtÀ|∑⁄¨ÓTuV=⁄e;’⁄{u¯∑˛ù„'MV{∞[gÕ˙wöm´G0®]íúŸVÕÈ‡FÚ$üg•Çè#Ÿ$•â75gl≥]{Ä Â—yØÌæQ;©WõPEuÁ†Ó¡~	ƒ.ÒÛ¥◊aÔWOj˜´'π5†Ç„ì˝√Í…wŸ{ıÔrGwÙAÒR†#;z–dG¯{é}%î#Ô%Pï_D8:Ÿ∞˝£f˝^˝$Ù™#å;>o´Ô8ùSºT©©DÓ)∞œû5<MÍÉóê.>Ä¸›·êTjÇ›˙^ı·Añ6≠Ö,´›Ø◊ﬁCÃ*J∫ƒrÚ’2⁄Û%ì]≠DË?◊Ö!:%YagLY{xrR?jû‚√7pE√ÏÔ√êº@!‰¶0”0Å?ò⁄„ûÌÕ˜˛—n˝;Ë«y*Á¸‘Â0_é<2»—ƒ-À˘Y=ïî\mk\9urâëh.H\ ÷ …ÀÄ÷®ü†n?B\1DxRﬂ´CøkıÜﬂ\?Èvc∑~Pá⁄k’F≠∫[Á•ë~˝¥á„°'9)jöùzÛÉz˝àiqñJbB.P8÷”#åÃ∑évòKkƒ¡q>ê≠lÅõ)e∂XÊ›V ¯≠äﬂ*¯mæÅÑ+ò5A•ùíÄÍµ’£®À´Ï÷÷˜]gÿ‚ıìo‡©®”k£L^Tqá®∏4 Ùå<¯#®¸&™ñ[[feüÆãÖ¢»5!âvN≠	kÓ÷ÕÍ·qÑVΩ7<œ√£˝o?¨3e˛ñ’âZ¶·^íƒ}|∞2Í6æ}Är≥’B∑lq»¬ªOÆÕ{¡hx?]“˜˚@ òxÙÕO@`ìD˙‡hÍ¯†Z´≥ΩáGµÊ>PêW–©2ºÃ‹“'ıÊ√ì£kûÏﬂ√Ò´6ÿ[oΩ±[ØTOÍ‘1®o|≈÷úÏÚùn¸c™å˘ñ'pY±o¯drgÂN˝ﬁ˛%ŸÉ÷Û Äï4ÄÓkMÿ_˜N2"çS‘Íû‚]BÓ®˛A¡'´%v‡¡±∑∑ÏÔÒbx¿,«ö˜ÎGÅ›GvZ!øæ√sµ˙A#ZPUSêÂdiÇ5∑ø«„wl+ˇE∞+Ar˜[t;îB–∫_SdlΩ	$zCçís›¡öÙ+ =yh7ó≈omâE$=y©HÔ©êå
E\a¢Ôçz∫öp!˙„%«ŒeuB‚»r‰©9]c˙€o@)∑ﬂxÎ-vP=∫˜∞zØŒF˝Q◊˝Añ¢dÓÇ˙'„Ó)ô4+ËË˜‡ÒM\hèiÉ¶§BÆWk˜a¥>x£˛ùzÌa3ÌRºU3˘ËbrÓåÏ·Ë‚E_ G¬— èﬂ@∏YÔWÅ.ñÄGD{jŒ™x7 %⁄1÷?ÓÅàπÃv»ˆfô5z;TÃt“Î{•Ä0sﬂüÜß‹^ˇç7@fEŸ§⁄`ülı{!TqÒI|W∂bŒ+≈)uiã˙ü…púÿ{¢``}¨eSÏ—¡ï_öuòä”!PDû;„ß-«yJ"√@ÏÎ~≥
Tlc:¬Ó∏úÕ¢±L	?í–Ùñôä•∑L¸Wëﬁ.˚°àºq˚@4$«DRÔy´¿%"Ò®¿˝∂ŸYFÏπÙÌ*„”˝7X}H0ô∑‚≠í+ãAp~∑‡û€ˆ‰}¯˙®¯~8œÔABÑ◊«™õ„©≠ñ’ÑM›Ç\sF˚…)ÍÓ!èB"(·çiÓzW\´≠U`áá&GûaÊS!≠3| ˙håqö™¯˙˙^yØ,ﬁ{S<?˜$Ω∑∑WÆ’ÇE{œbäL9πŸ–¿›[°fÀg1esvû‹ÏZ}uw=‘l˘,¶hNh"xJ±∂â‰Üù_≥˙Ω÷∏π—íoªTZ&˚ºm$ìeÊ|Dqù’v`ˆÊ,¨¥WæUŸÖçÌ.¨∏Ò)öÀ*zÈ£vnrﬁûäÄs€Çá˘ÕhW∞ç-«Øÿ≥ò<+ãÀ÷Ë£búëπ–L9&Œh¶Ù‹z.E ±XØƒ)v(Êﬂ}≤rêã`èªˆ)Å#‰2’“Vı[•å‰9è‡AµñôyQÛ2Åí
…∂Æõ|¡ÇÕ*Xr7B¿t˘=wÓå{?ƒ√i;#ÇÀ-{6\ﬁ#YÇ—ùv@˛‚π“}Tz\8'ÉS(≥RVBx† 0PeµEe®≥å∞aRπ0C‡3ﬂJÎ“ﬂ…∆UóbWª JM1h∞bz–·^;8l´;kkÎïP#odÿ  ∞ïã*·	Ö2Ó%Ç¯∂£`Ëf\‡·/¥Rü¢å;F<Œ¡…w€a(2A•ºD	2b˚%î˘ñ¸Êc◊≤∑3èe?8–\Ó—„%h+ôŸèc∫∏™vq›Ô"∂∆NkpB;«Ÿ√ÈÄƒéúË‰2+	¡Ñ8°MÃj¿oÇ∏ΩJSb—∂W0|æ»Våﬁ€Co9°¯L;¯˙˙ÔÂqMÖáz)ƒÃWihÒ∏/Ñ3o∏®ÉR˝∞ê8∑Ã÷îÅãŒ	%<ë‘\™MoI,<ÃØ.…lNâÖîe!¢µè2∞i>ˆ
S7ßƒ≤*ë≤P«7oi´ë“Ü¥lñRê¢¬xóÇs sú∞G0é0
ï«˛‰òöE˘ñD)*2RgÏÿ%‰Ûæ|ÉIK·Oz©\	ı.ï“R`ƒÌ$ƒ¢ÇCÜ-9.WµÛZºÂä∆S~ó#/o‡ïÀ`ù0NóW§aœAf`q°Q“0ö`A’>…»∫¢•â—K¥∏˘MÊ1Å¡OÔ,0Z€®BµﬂŒDë?êŒÓGÀ:N(KïÒ´&¶ıët
ÚÎûz˙‹ê›’h¶]V˝ú›ﬂÉˇXûπ¨bVe˛€Ùû–xë7kó
¸Á3≠uI4gŸÌ⁄ÉáGÕ˝Ω\-=Ø∂™˚Ù/n∏ô•Ï6X¡¢∏Ö©Ü‘l"úQÃSËHÂ±el§øÍ5∆o„∆«ocﬁÒ€X¿¯m*„Có´~ãÌùÍ{ÙÔ“]ÿÃƒ≥ï»K≈4˜¿nﬁ¯¿nŒ;∞êë«x9EçîEACı0U÷ò9ëRºçBÇHÔÈçÑ*O»≤’Ï„Ÿ¢CYkÜt;J∫R≈ê∞¶$‹0§€U“ïW}…‹ﬂ~◊Ä›≠≈…h9eÆΩ‰ºﬂÄhF®Ãœyk¶úsÁ‹Trñ‘Ûk´‡ZœÏ‹YÜΩ˘©ÏT=âûz«œ¬ãæ˚"≥ßL:õˆûÔª!M2=˝VÉë8kÛ4∫iq+øÈê_p∑¶ΩæbCŸ®}Ãy~?À~†∆®∂◊Â&º9û∆ñõéâ6(˙”€^R“p¢D$ﬁ°;¶£ÁπÔ=Qt≥yˆ=’È{‹‹êru)\/Y@M ÉH±+Jde≠∏ﬁÂ∂÷k8§eÃ!mBçî	YÆu…*-ïä]ûÊSbBûà^˚wJÛ*g≤~YÇ^íZ≠é{∆∞é∫k¸p¿{∏,à/ô5Ó∂ 5◊ÙeŸ∑FEré‚°Ëè∏v
ﬂ‡)·…Y∑*í´|BE™¨˜í˘,wpäò‰πå{Íey	ﬁP¬d‰JKäögSŒ^Â€/T1º0?Ω„‰ÈgçT@Í¨yàA—âÈd
oÓæ˜Ñ/≈≠ ΩÖ4FŒ[ïºê´ˆ{O$L®ß1äõ“–¯{Â.l
  îWÂT
\U$’Ck4ÍªﬁœzIkQW)	C∫@L§é{Ç¶-1Iâï‰GIR’K"‚Ô.ÏÓ£«Kd£≈=;=MS ç®Ü™ı¯ÑÑÛ¿ Æ*MÉﬂ™v*¯/Ωâs∏˚+∂»Í—.ÜPnÕ¥ÉÁò≈¨|Õ·rV∫(•YÅ:\Ú€@Û°Ë“ïˆ•:∂G™‚•˚<yπø‚<9«añ¨îì∆@X9Æ0@f_∆!sπY\¿jƒèø&èòoxVHZ0|¥QQâK;ö\IvDÔH8YœHuà7*SyAè¢aétÅçThz$,[Õk^ío_‹≤§>‘AÖ˘M55≈V†ˇ¯‚n‡≤¶Z˘ï<e,qû{I±G∆)ºæ˘–â§„¿óˆ∆6/™ß˛ :É√œûÙ·À{¯eæ,y% ˝	µrG∫d‚Bvó'ﬁ·Ù{‰»	Ì¡™ˇÉÛø˜DÆ≥@°ÛZç-t3¶P~ÙÅ„ûˇC˝+Ü¥x>åØéX{ˇl%&b¨≤ŸK&‚≠÷#ƒÊR·2#ˆKÀu?¥V‚TZU/◊7˜äf1ì“ÊN…¶¥y”2*%≥»Î€ˇS∏L1R∏jWU≥ÎY6.Ø4@^U›eˆïP∆wY«Ñ|∫RÏ8ìvØ®ª€xù≥'úéR∑?]+≤esÎ
eÀ÷X∞/®µ4úXî‡“KaΩ cã@/‘ÿ≠°J´ã©îõa§≠toAïí…Jpæ¯∑îËÚCàª™¯Œ’ xàÚT=∑5ÔÀKä*Bó†‚'X◊Ω_ıﬂóÀæMu¬?∏ü„‹œ√Ÿ€~ˆUmıÎ~Ç[⁄I	6É]Ñ$÷s´Á+%Hï¬˝¥AÊ≤sﬂã	Ø8‡ùéÇTÈÆ‚42Ë~‹9ÛBQaÑó&ºá Ø‡ΩﬂAT&c⁄e(®ù L¿Ô‹¡JQãÿ¥0ŒLÁÄÔAx˜<ıTËÈÂ¡Äm—””b•ßÖKø
∏<S~ﬂÓ?≥ë3±#{ä
ƒ¶ı∞Âq Â)`"}|oJO6∞†O#n¬”çOÅ«©Ü5Ét{â‡÷i◊NÑùı™åÅ…é≈éá¿éÉ⁄”¿['ÇÜõÁN[˙∆Ò•e÷W7V7[1çbÊ©XïmHUÀÍtÌ‚
a>ß†8üGà7_äŒÄ´Ÿ–K=≥Ïd˙qI'"«·«°õ€@$NÒ∑Ï√%ú88≈3°_ÍPß õxxﬂ‰§ —MÖú,œàâõ
7Xû‚6Æ≠œ?tàµ|⁄ âA£Má=´V∆ïMç"´«å5!ƒ∆r√¸ åıèÏöíe+¿ö>å¶ö©9Ea"SÅBÜ†ﬁÓÑaÎ÷®ÉfLç ƒŸ3Ç,Üp∫Ó —ÿâ¥-eÓj<-ÖHÍ›ï‹RÔG™0IPT|ªT4dåˇîOﬂÃÁÖÔ∞pÍ‹A)1üßK ª‹ÿ|‡bÛAâ)?ºØÒJ‡[E"|"z¨∂·àÃ[›<Ÿß
6!π–”Eæ¥VdƒÌNæ¸¢œF˘u∆C“¿OóØK‘¡ûtë_◊‚ªi]Æ¸k:#aÅL`ÏÔVtÿ·ˆ"w$âºôıª[Ù’µ˙1pÛúKyúS∞J÷µF˘UOv¥Xd£V~-ûÓN*Z•}Åv`Ωe6hÂK&LZÖÒrF˘ÉπAÀè<Lçı#!h<ˆf•ﬂÕ•áÓòÅˆjÁv˚i„Skl´uû√¯<áˇ‹…ÿyjÁïkè3l≈Ñi^Õ°˜Áï¿ÿ‡Æ–Í#ıá∆˛VQÙò|˚)m»Ö|ƒ»]`9Ë∂ˆMùk7ø∞ÖïPô]o§6ë∑ƒU⁄=ﬂŒp3kM¯^Ÿûõ«@AÀ]6◊™∑9ô©ˆÜ."Ê˜/ñô˙wÌC ó{≠Ò<‘‚M¢…πÖÿ˛«@Úöb‰Ö	RéLx}¢rµ—nºﬂAä“•|A+ÌEæRXc£XíêaÚœÛgΩâ‰/¨Iªî@ÑaÆ›?ÀìGÆz˙%∫‚1C›9á ü+@Gƒ`ä0“ΩÅ5±Û£iﬂµAö\¬__±T∏πÒ+JÃU3mL Z^†Ωƒ∏◊fÑÇ˜ÚÈò*2U8è;ÿÚñqê˝ü´úìxehqQ	%	˛ò T˜˝ƒ#Õ¯‘a<úËRf˛@S<b])≈ÚTm<1úˇ/Ç~◊ƒ€∫8Å6≠Aì÷$ïàzn®. –°t˛ÿú#ÌÁsÅ¨Œc¡p¿ı¥'a‡$nãﬂ[SwøS2˛¡„ÇeÓ^ô8BÕUöc~∆-ü◊ùfûJ£'oMLˆ∆®˘?~Û_ˇÙ∫mQô∫∂"%,Äj’q˜Ë6Çˇ§;øz˚oçT-4wˆïˇäí)~√D˙Ûx›âî„Æ∫,w’1miD «v3¿Z±+ÜHgkdŸÍOmè*ÈGî(ÈÒç“‰_ıœØ;IrÄT2çX -“êH— ‹~ØmÁäÀï•+ñèÀ◊"Ÿÿ1¬4óy∏·+‚ßè:{Vπµ<ö~¶´W¡Zqe#∫§6%≠àëﬁùxÈ}çØ™X:•√á\Û,yá£È$¶À∫ˆåÌ>!¢™¿°I–ˇW!N—B•â⁄ï≠ñÎÙßOÀˆF¶HÊP˘
ìã¡EOÕ¡cªYu—√^î$ÅÃRq∑'ÖZyÎM¡úaÌ`∂/s∂á» ü≥p∫Ì¢sV∞d*o+Œ>w˙@W€1x“ôªuA◊lÖÌÔ
SOîÒ~ŒO√£~˛çaxÈ®£)‰§\&-I{Ínâ«˛πä?v¶
Æä±ÀTT+ â?áúE›.ººEmÚ:ªúÏÿÆ%ù±Å+Éw«Œï3¶%‡⁄}ªON2Q!¥csô)E)"=π$k~˝˘å”¯–êØ∑J‘Èp2·ë‹Ú"êõnˆıt7ÅÜ%Ïåà!Û¡ÕT˚}ê¸˝`J@ÙØ^~ˆÍÂáØ^˛æ˝€´è˛È’ÀO_}Ù”W/ˇÂ’Àø‹Y·ŸSóø&/÷fŒ∫.≥ÆœúuCf›ò9Î¶Ã∫9s÷[2Î≠ô≥ñä2o©òî˘Œ
_7∆E(cU›‹2îØÆµE!_/Eu) †cëµ¯ÚÛW/g&ØjÊÆ$àÍÃôw¸Ã;3gÆ˘ôk!l.m7(°3^$YS…Ûí3eŒëÎròöˇF»Y9®÷(óp«◊¡~áª	DÔU˝è$õßˆ≈ˆ%Ê∏íD?‡‰ª&a¸êß¢±˚"Cƒ!7#Ô@ì^†ßs∞º{âÍì£áöebä"zi
dÇ…Œƒ_'Zâëä&∂O¬/€x(ï	TÅ˜Õúï–SJ∆tŸ∏ò•ÿ±[ÚA©πVPœ‰
ΩYó#W`!aWµ^TÅ∏˛äÌÖÈ:¯?~Û—Ô}L`∏5kùcÆu1ZRÃ4É£DSK>^Á6éÕ'’ã^ÉŒ·3O.çò\z‡M.˝⁄¶zsÎïs˚ÔàaOÑµÃ‹S;ßfôêPúÏP˘ÆAÅb2˜x>∂Fzeúj‡[Í‰íâÍ[÷‚M#¬uãŸ-·ÏjÏ‡…ÿ¢kÏEı,Áƒ]ü”ﬂ•¥œMº+Èﬁ∞k÷o–=≤∞ê⁄«FY¬ãd∂Ü<¬°RM÷æh˜ÖQBéÂÿ_ˇØˇ&ësÈªà—Ö_πÓz…lˇa>_œ2”dBcL$2n$QA»ú‘[‹åäM’‘ÔõXTJÛ*OÚî™eÑFF2™¶πôë«±®ÃµCQÃ+¥Iπ!/{¸/¸f’†m1⁄imJ‰Ω⁄zdaaÒ_˛‰~ˆ≥$;#IÓbˆiémì<~g$+4∞°»Âdq(Éñ/ä≤xH&!Ù`-˛FÁŒ¨ækV˛}ïIMàP≈ï“Zê“ºïÖöÿ’uTˆÛg$1òù†P#*ŒC`Ë¬˙üñæ‰mtî¿¸7ã•0q—®•∞ˇ3-ÖqÇPMBg’NáŸœΩ[ùNœÇÕﬁR≤PzqsﬂÖ
E]áN«Íc¥ÉYÈ-tä‚‰Á—≈#·Ûâmu~R£S≠ñ∂ ⁄öìZé˚”êX–“∂b∂≥ï§Ås(∆4=UƒΩ_Ù≠È°’jB.—-jÍ˚“‘∂Ë ÍGz8Î√èÛ^Ü&Â≠©óÎ]∆ü
«ê¿ıòo˛ÚGcÉﬁ0ˇN¿·Ï`:§àÈ>6ﬂ(á-Ÿ◊ÇßR„π≈7ZD≠X™_‡©µtdo°YΩ”m∏âôªçh?w=ÂMSŸ’‹u†mpi5e_„jÓöê¨ïF;~z¡Øµ…f%<Õ—’ V¿£ÚË≈iÒt˛éª-+W\¶ˇäï•«Ïá˘í2 XsrCç/q°Ô ≤ƒ≤5mî√ãYHöT¯Ö(:…qÂÁCÀk∏ù≤Ù∫ 'ÿ˚)‚“:¯∑Iﬂ?∞È˚9˛›¸Ωïy¸( V¥3ZQœÂgfBñéD¬M*#÷ù'¸A*KLƒ∏nö‘UöÙ>·^>°}vÑö2uy(Æ`ï22†XÚ}+i˙˘«∑wYV±0\ŸnãìMQÊ’3¡‚«ºB¯'F]ƒYæ\£iWriõ8ÑŒ»j˜& VØ˘ñTÇn”ñüºÍKX1WKë•¡	ô›ÓÿÓR†Ú&èqóñMòÒzÄ“¬^'úÆ˙Qæå∫´ÎÌ öä•Ó7s∑⁄∫^ÈÂb¥tŒı—fNŸ2wﬂN™Huõ‘æ5Àw&Ñ¥°4®
$Å¸_|≥ÕXC.yeád3báEXÏfVw«‘]ô§ÉwUêíâ’…HÕÏ∂qöìR9:39…œë#¬
˚1k÷§}Nw¸∫ñ7è@?.y°Ã«%÷ÅÀÎ”Jÿ„Xì¬82K¿%ÕCkò"⁄¿}Ä¡ŒãT€∏Ã[Ü1éƒW÷Â·∞˚JñÑ<++®≠V¢l >hgXRøgá„íá?~îeÅ™H˚vrOgâım]$
öÿﬂÍ8∆E˘V?˙ ﬁ »&¢	«≠Ô5A,¢yπ°&√V˙¶ìñFH€/Ò.Á	π@π+~úrIÒæ@q §‡lbÎgê≠∆\pÚß2¿H<≈Ñd‹+ïÄ˝"!ò§¸pª'ƒ3J‹8e€:!ûVFÌûñb6èµú°”<~≤,tÑ ΩJÊ>¸ì∂ﬁ1Ì˙}Ù;ÎclÍ°2°Ó$ûØ€Ωrú†≠ÃÊZ "JÎMM$§r~í=@≈G?¿?\â‚∂±˛ﬁ∞ªt›1YÕnH≥9NáTá±ßk_ŒI:^ó≈Ò*±:äœz™SM:‘ Û≤πD·bπJñv+1∂%!·:‚Ï}ãLR˘≈‡rL›|†$4ÿÛa%£∫80ièZîò¥ßÅ:ØíÙsT∆◊Z ï¥{ÈµÖÜÂ Ô‚	‹>Âjô_’¬?7´pQÎ∏û6D-â«rJ!nA	>:ßjˆ∏÷ Yƒ·Ç∫Ñ	iXÃ€ÃWY+º∏R,Ü9M…{§§€à⁄˚ƒ≥tcÇ¢û)3¶õ{Ìò
Ö†‹ø®>{HËà,k5uW∏^µG’ÎÙ»ªænw®†k˜eÔ:}ÒΩhCéüÈ{¡Ûîã≈ïı‘=I∑PRÀ‘¸É€|ÍçbV›%ˇÑn('N∑€áì-NFNµóÃ,Ì¶RçÊC:ù‡ΩtGDÊ&˝Áy˛ñ–p€Â∑.˝)N£¢îny˘‰≠‡f∆ÚËÍ•äë⁄bòÄh1ÙπÖWé€Ç°ıÑ/e”◊ú~gã&‚˛Ïúˇì(LDç,”Èb¸è⁄Ò|6˝–Œ&Q§™≠¸ì®nÂÚRìèé–∂n√ﬁ/ˆ¸/!FNì˝®TÿVV x4QœÙã>öƒç∞e\¸»x∂¡≥åÿù¯®(*ì/`P‘h9s
øJ8Ø¶O}≤û˙ñHx´å⁄ì%ƒÙﬂDmQ6H©$Èq)Rﬁ•[’óP˘’€©O)R%™∏olLä`Éπœ ƒGÕ‘æVa√/Õ¶‡|«evÑut€û9lœq&$ì_ΩÇÈµˆfA¥¿A«GÑÔ)–ÊDæz!®xImPûd‚ÁOeÖŒÊShÃŒW…Ï|√”:a4EZNÙ◊Î2wè”⁄¡…›+˜ÍÂøìø‡Ø_Ω¸À´óü&Xù≥dT¬/x(ußéÎè£JU?éb´Éa¸áW/?~ı—è_Ω¸=:c¢;ÙÔhH˚ï“ÿ√èià∞	Æ=ﬁâˆærºÖv!G.Á?FüWÓx˛Ú¢‚O…ˆø”´ﬂpäÜﬂ/È€«_πâH·Á©\7\{Úi'··p`çüÇÑ≥¬Ë®sΩqùÕì%(wò Cπ≥ZˇÇΩﬂ≥ü∞z <ÁÃSñ˙πX{bw{nØœ‹•ô^ôÌ?wÎÔ◊◊OÿnµY›©6ÍÏõlßZ{Ø~¥ÀjvÎ¨Y?<>®6ÎVˇŒÒÉì&ªˇpgV(ù[ëEÓ€L®ˆ°!£P©ÊÅ7ÉI~›7ﬁLi-: ØE.5∆∑∏‘;‹Å/v¿˜d±√(Ph8±y·£Ú¥Ö&°ö≈è9;^$!Ï@aÁ´ëu·bn∞êô«§6
ùÌÓ M	å∆∞…'.ª?m›Y9_5-Ó91¥B¸(ßîRqÏ∏ìÓÿn|˚ ‹|D›ˆπ=∞ÑÚQ¬ÖÒΩÀﬁ⁄m)∞„ã…π3$ìÖ#ßcæÔ2õw◊mè{#Ëmé≤∑!±3AE9¶>ÇÖÒ®Ñ'ò†ÑET>w)ﬁº$^+Ó≠÷Ç_˘∑MEnURéÓ˛	”ï…s§Ã=GJÍf„Ôl˝]˚´ª·YπPåÌW<«O:≈PúÌ¶’bòäü…ü5#Å!uq{⁄≤∆§0åGz;2ó¨◊¡@dDàŸe÷∑Z6∆u˚èﬂ¸¸Uím»mËËÒ7.LùW¢∆T2"JTÚø˛ì§Ôú3≤á£ã˝%øzÛ@<OY	∆>W™¯Îˇ˛°∑lr"ﬁπ_C8Pzä>tŒN'"äWp∏˛è@ƒ-tÛ™	Gˇä;h?Ê∑t¿ %í›oH%°É!Y‘KßJ∆jíìEÁx)ÃB˚¥ãîÆ:óO`Õ“ä≠Ëp‹Ûqo¯4¡Ú“ﬂN¥ÚÂ$≠èn5]ßñ'®L–ä8»r¬|©Î/«ï’D—ñ_vnd˙@hﬂà‹¸ïÕ∫'ìﬁh^âC@DjRÓò˝Ç‚F“¯¯?≥9g‹È;0Ìª<†Mj÷H"ñ"H)_ïá,ò$æ%/ö–Z0øh∆≈›ÑjïË»˙Oò…Œ√Cïr<>:õT ¨rfV®6%»gcw¯y\8Î;π	›¿!õ¡uYÕKÔ∞hÎŸ§‚Zœz]k‚åÌ~o‘r¨qá«vƒy …	3jI]å9ÍŸ‰}—ñ$dmˆ∂3ù‰<~Íó5úˆ˚KÀVz—P U*<%ˇr‚V(
x®ˆTXUÿ‡`#x˙Æπê«ÌF
FIøk∆(«:‚¢d´làÈ¶“°-áRO$	&‚wÃ§ıb´r…Rˆz'ûª|äﬂd˝ı«)îÜÛQí)vR†!¡SZÖNi7·\6Sˇ©«ƒÿØŸﬂx ´Ê;£`úö∞`"tiêáª≈ª√÷ã¸y˛Qeìz7¬•3{6ˇ‡≈Æ18v‡Át–RöÚœ®ÍæoB(—À,ró`ﬂ¸¶fáàgq≈âÕÇäãl≥G{⁄/Êhò∫u`â°m#û6`Ó§¶“f1Á´•\¯‚•õÉ˝˜ÎÏËAsøVg;™'ªÏ¯·Œ¡~„~˝$"ﬂ\ZåÀC HNzmﬁÛöOÑs‡7Ÿ"O›4ä@$êá¿ÿ€6¡ï†
@+àÖ+W!›÷‚ºiÇÉôA¨„Y∫êQ!^Ö™ïÃ›„i´ﬂsœŸJáG4ÿÒ°f˘¥3v¨N€–9;Îµ—(Jhd]÷ÈçÌ6ÍpÅùç1r<SÊm`;(îƒhW‚	ò¶À6¶≠Ao‚Å‚Ò.™Ûp?F<¡+<Â2_<Çﬂ:S‘±$·Î\¡hèùo¢i“ù [6·p«õ.(0‹Òâ∆ˆ¶=Tz«¶êô ‡Ì¡ »zjF§ÃPËîÚåNó¨P(‡Øenïµ≈Çô¿]“hJ nC•@ãQ"°ƒ ∞¯KπhU‡ã¥Xô LnVA‹–∆l¯¶Î3ø+ß–ÅœFæspñw◊_$/ì–¨&”õ8“kã:f∆äOC≤	r≈éô„h1=%¶"ΩÄÈ¥ÁGÍœIò1'ÚJ√∑k—¨!s˜ˇíåø)¬j[{–kgÓV≈∑9
±_XÉÃ›:¸MCÏ·º∆Ω_@xJêä◊Ê®°•A6Î∆∏íIú\ÚÚ6ül9/¸ú±^g;√e¶¸®⁄BŸÚ$[Ò<1ô›—¨7^Œç¨6^¥≤÷D+fXfb≈VR% 8∫Óq¯1ùn§Uâƒ
-ó¯—5°FrFâ¬9t÷4j€C5ﬂ=¥∆OŸC ì¥˚œq˝ÖH02‚®êdj<˙vRo∞8	ZI≈yÓn_VÜÎÛÀ2"D¯H3^ÒØÂÕ+ÆΩ‹Õ%ô=£ÎΩ◊møuA,≥µ≤@:”Éò˘Í∂∫ãÈí<¡E9Ò£ILg„ÔÓ¨‡·$˙&Ó–Mñ!¸& CŸéx[Äº9kq¸‘€aõé¶7x4ùÔ Í€Úàõuaπqg—8Nü)ˆn˜Rû8≤u§ß˝|ıáÁEÖÖ±ëÊÿÆuo….ì€§˛÷Zº∂L`ÙY·°êí≤˛∆Ü∏}Òó~Â˜≠˛Y›°TînzCrxa®(Á.¿' c¿Ä©-Ä≈[)ÜöÄíR?°¶i Ü`w]
9Å™/Ú@nÿÙDV†÷[
w]Jw—∫µUã;\#N•KSMµ=	∏¯ZM`Ü*AK√∞ÂP@®Kc1õÖu$±´`Sk÷óŒy˘r8B™≈b#4£≠ÕëŒÃa(Ï2®,·∞o4ÉâéIÃZy )ª≥EÕ@4¥K6X
›øõô¢.≠f¯¢W)6:úÿåÓ˛4q.âéÙw	!ŸìªE¿ˇ5‰˘6çøOp¡¿!Ö≈k∫ÚNa€©{•ónb2hkÍ‘À˜÷?xpÚ;©ﬂ€o4OæõN©|ÓÏÁŒ¯i*µÚ56LÈRÓOÎö•«QfﬁP1ä¶ÿDÔã
√÷qœéﬂJgSÍ6ÒÚÜA˙^w“àJéæÃ¡ô:∂’A˘“e∞•LÒlv3»¬å¥>±-¥¸“Sç£ëô∂˚òÕ˛íÅå˘}8®√{0Ól≥⁄9lZ0>Ï ≠“∞∏•aMêJÑÚ
Ì˙%œ}Å7ánÅ8#+∑Ÿ™µW˚]ª5∂Xs‹Î:CAl¿ÒÿÅ}~‡FÍﬂ’_º•´\`ÔY„ﬁ UÍ√.I∂xp±˙¨Ó∫÷#≠9Ì¯ë&îä·1(≈åHNVÔáA”±Îüív˝9˜¸Gﬂ∞ÀˆÊY1ì˛Zõ~Çıpƒs¿¥Á”Ò9s˜Ú|P”ëüaºs6m†≤≤™\¨≠ÿH°f1e	5œ§„{ZíK§'¡Ì◊≥=Í¢¢∆l◊ú˜`ÔÈêÀAêIj≈∆^Q1È∆~wjÛ1¬Àú˚J∑’^gG›yxk6ÿŒ…ÉÍn≠⁄h≤{’f˝Éj ≠’ˆ]÷öŒπÎ_°+ÿùiˇ)9˜	Ù∞ièÒÿ_ÿMlÕå!¿2´oèaßû8xb—ŸªÂ]’™◊≤›©5ÓÙ`úVÉ‹‡¶æòKŸ∆¿ıÆár˚:ﬁÜ5IÁ2Xª7Í·9‡P›hÅwc∞⁄x¥MQ=t:ÃF ˚,±ìˇ≥ﬁsy8Ô	“wYÆ¥\^›‰¥ø4«ïUS»ªûlægµß}Ÿ\õøT!öz·fŸ1YRas◊ã◊-VE´ºôæ‡ÖﬁΩ›»⁄º˚Òsêz-˜)ªOÓ@…ìﬂ‘©¶b‹5‡ﬂ’›√˝£pP5vùòEU‰ó"¬çnù¯Ì_à<õ≈9Cœ}◊Dá69∫®KÔ¿B8¥^0$€ˆπÖ—÷`±,•Ω1J∏0ZçgbÚæ(6A >¸hMªÙ@4]‹Ì0X€∂1Dºœ´EØgªhjx˘Ê
ë¸^!ÕvÉs>—•9ç&fB¬˘Ω∆!€»∑z?‚©GóÃ∂¥ëMun∏´ÃπÙ7^ëtÓ^˜,`ºSã)5x’ìHÚ/"Y¡&¸»õ(‚˜@|ãÉ˙‚ØÔºˆnIºˇµ∞«îû‚b˝ #›Ê'{à3üEeÆ'∫‚’0Xˇ§∑ı-•P3Pãæ)§õWπÄÌBˇƒˆY/	sx
9sá◊+ª@„Ú¯P?E¨6n:c¥bÔ˝Æ{$ìRÇ Ñ—ÖùÀN–;b“†å‚í3LáΩ6ø˙Ûèd¯éÎ1 ®˘¸ïfU_1Úã		}Ap"S9´ÇIÈM7ú∑–âZ?Á∞r§3Aâ;xû¶ Rö—îPÊÓ#‘?Êã˘‚:+ñ∑J[Â[èŸ˛ÓA}Àõ6XC)¿vÒïnì
±wHIK_£ÿ⁄:ìü<X¡Ùn„¶}§ºGº+ï“cv\?⁄›?∫∑≈ÙﬁCÙgÜ{¯S‘¥S‰f~¿l˜ß^\»|;máÇV‰◊]~Ãö'’£∆·~≥Ih˛”äp' u†}†O◊\gú[KåË7¸”vv—ø∂€8‰4∂|˜∫pŸ·3T»Ù~h¢ûò ¬õZ`†ÕjÛaÉÜx¬BÁy‹⁄Ô”ûC«P⁄e@Ñ»^I98.‹l/ﬁ\‘d§g'âLN[)RÚÒÿ¡)„-÷7±ÄÁ„ï´wD·>Ã‹Û/Ê6±—|∏[?j≤j≠ˆ‡·í~Jù'Gå9µ⁄mÑå„_ÌãE	V_ÂùtQ´e˜ûëm Å›È‚Òy!åh{É˜ÑŒÉC…‡»{\aå“≤˙Ó√oœlõu¶6ä:˝>gÙ◊∫Wåh•E+]!ù¢n§µì´‡uFŒYÍÌEpé€
µr’kí–tä{sT„√dwXÆyﬁsI—lÑŒ“W[¶c`åF6·ñº‰6Ø>˙Yyµº¨6æ¢xÂqtXe$3-dŸÇ∆3
Õ
aÓ"˝·ü≈å#ØZ7äú˜‡∆Ëîï±g€¶{¨YÜV®GVZ¶,b`©,√∏ÇXÎŸ≥<€·ã}1#KuÎ∂¥πº:u^g´y∞∑á.ë NS´6Ó≥É˙ÓΩ¥ûë‰Sg©õéÓze°õŒÍ#´YË°Hõ€qúß⁄i™”NO{?$``Á1Ók%åW¨6l7h9á”ÄÊ"LÉ◊⁄o“ƒ“ù#éÆÏπ;‡)É∏≈jåoé°´;òß˚éÓG¯˝·3g;)¸¨6s⁄ÿµ⁄ÃÕãQB|Wm6åÚ1s6¶ZJT∏vMeƒ√É&&F=éﬁÆ≈√d)FÑ∂õò-xôlÚ"6¯ó8ŸØ¨ô|•òSº÷UË.IÓä™ì@§5≈{ƒµ≈∞!ÌÔœYñ!}åÅLÿ:UF$J∞’‡ˇ˚#Åä‡q{ÊË°éÏNo:‡5;ò9À•u8)¶(l„X∏5HÅ˚nBèGqäÖˆéÖıæé|pRGúœ˚&´Uæ€‹Ø5ÿ.HC!ï|0∂˛0∆ÁÑø<¥Ül™ë¶É‘’›æƒø—·p	Qí∂ª}¯©I-–TΩ‡∫4ˆ§·'ÛDSZùm⁄4O˘Nπí<¬çÔ6öıCV{p¥∑Ô·Iµπˇ‡Ü˚·As?ﬂ¨Ó∞Fù¥_çî: {Ç2X:„'”°€ˆ-Œ·§;¬?=êÚQ%G"u⁄ Õ•“Î/BﬁKu‡çGå◊€^¬Òe<â†…õåvLfòF;=ƒÆ„ôäüQ´BÒ¢=°ƒ†k
#√XW4k<ÉjbäA)
ÙaÉ£…2Z≠ú[CR"V9ÇcsƒÚﬂº˙ËßØ^˛ë—ÔüJÌü¿O&q‚?!Ìb„¬Ö~0Ø˜ß≠ÿ€æÑ;ÃYE~2\ñ˛‘da?L∫àHÌ/ˇ@}˚%áßﬁ˛<á~˛úò˚ÔΩS ?Ωz˘ˇƒ;å”o%Í¯ø–h‘ú·YØ+‚x@Ü/.;∂Üvﬂ0.qD∆Cäíí∆ µ=iPZ4zÖÜ¬∞≥“(}BΩ~I=˝ç“ü≈ ‡X!¨˙Ôi —Ø8–=¸]fòÏ£ƒÅ˝ËÒ◊'JÛ¡∆«<„Ô)ÈßÇˆà÷‡›œ®Úüx#ˇ)e˚Ωv®ÁÛ¿Qe?ÊÛÏø‡’1ƒ‡«÷~â®EY¸À_B}‡]¸òˇ!µÎ«¯˚wø5éµ”)v=÷√ç©7πXf≠1Wø†<7ê>ﬂFB5πÀ>|qñ˝t$ÄÖ]ª=CpxÏ˜⁄=€e-Ä)≈(ÙgÛû–:VásMm¡G…N∞§H¥/t—¨í}·b=ﬂ¬í≤l…z¯æÕÉX5ø] ÕΩ1m¡Ü_ò8¥A◊`rsKW¨ZkÓø_üÉC&q≈<÷ ô†¥≈‰∑«¿ubB®K¶d<5ä2‘éΩ»fËÃÇcjo8è4ƒOOßk“m'ø&Û±≤ë¸ô…ıCŒò4*ﬂFÉ≥êΩ2A≠œ®∏“55ôßFO?ùy˘/z6`“ü©õÁ'}#∏;|"9¸oyígÖax8¢∞®Ç}
i6≤∆–S4Ù„hÎ\Æï>ƒÚÆámÓ28¶tqûö6a5 œŸµœ¨iíãÖE‘R¡Û◊C∑õOD&ô:¯L¸ÅÊÁ_π‹Âma?°ÅÂÅO˛ü.ùy˘ﬂ·ÔõŸå@‚ëC+W-s≠gv'x)úâÌírÜ e®s ∞v(ƒYW_~!æ0∞kx¿≤Ÿ•e∂ÓzPôÔ„∏çˇz:;∏ƒ7f3eˆ˚0Á1ŸÍÏcCˆ∞zÈ]!$o"‰SUÙ¬ÔˇÃ$£˙£ v∆Íƒ≈î`ﬂÃR`•Dñ√è4|•ñHFX‡?±E	QHµ∆∞Å≤¥ò+~˘≥¡Æ‡Áµ∞õ5é™	É(¡˘˝ã§\?xì8^1⁄F˛¢0∑œïÌ„…J π ∆ÎBµ|ã¬›’˙ÂMµi_æﬁÏ˚§Ç+XHx$bˇ=m˝@˛?ÂB”È§¸â|ÙgZ‚ÊÛæ›·»≥CÚ¿{]Vø{Êm∫ôı†÷ıäº˛2HXQì}Œ≈⁄?	U˛ñﬂ•åÚN/C>E£éDêvµ”£UÁkE“¢Q7I”¢äØâ:ÌÀ$ò88xÆeLÁÊúMH?MŸı°ÍC5&Öíª”ÄÛ[P©E0ï%öÛfËd˘/Å√:?0`ΩÚPÈ´-bßÃ'ŒÖ%v™uA€µ÷„é√∞<íLØ‘jS∆”ë»¯≈*µB™¨dÅ*Æ~/u·?WÿˆßﬁAQØ¿·¡Å6È≠Ùû˝\„#Ûõ}˚g>≤_⁄„±3>tªÑ|’öI¿3UY&≥ê2)éûÖq•ß®à)_çÓ¨÷ m¨j1ÓÕ)∂Ôﬂ”Í˛î4ˇ»ÃD¡∑hòu‚gqáñL∫D_∂9∞£O∫]≥LÒpıQ]op˜õœÉ˙ú»èÈ~Ï«¸∏ê8ãGˆÛ≈Õ‚–~nû¡#?¡◊≥wΩŸÛnEˇç~ˇ S ávj∫ìŒª–ânÛBñk0—Wl¬”„â‰åsmÙQí◊4>5}ab_§ì™‘'˝ Ê∏À‰9S\fä:º*4ƒï(ùrs:V≥fëLπÅﬁi€2I•ºd*xÜÜ=ò`l]Û®= v˚NÀRÓ{ó°MNdeÑüí@ÄY"œ>ŸøPíˆÜı˚Nøªd+t*‡ŒzvøCi( ≤¯˝∏–∂˚ê¬Õáa)ﬁ°Ûãê∆M|~9ºÊ»I÷qÜ	aµ£r%∞âê{sÛ‹é ≈ &I.{äÉÃ≤¿pΩkøÅ”ôˆm÷séƒòuÏgvﬂ!ävº«™·4f¥2(I˛ØˇÀc«„πÌ5Ñøı¨À`ƒÛmt†≥übRõ&9;é8•˘'i˜Ñ∆}Újˇ/û‡C~{O<>a∆n‹BAmÌÔ®µ®$‰CüK√.T˛Zﬁi˛âëVÒü§ÒÖÿ—∏ë√G{±2,H7¢◊ä|(∂Na°ˆG9åø÷2HC@õoe–gr˛√ösóŸs5v<˙¶∞Ô#d–∏gqO}»$HñÊ»Ohe~%-Ldß'ﬁT:)£µÉ$VŒ-Xõ`y∂ô¬na6cYH¨#M_ä—√ıµ$≥π5ónÕ˙Ún !nÁàM¸V¨Ãóü≥∑óhY¢ƒ 0néÀrh±ó	√):„fÿˇ  ˇˇ ∑§-˚xúÏ}ks◊ï‡˜¸äk$cÇÇ$¯êeF§√$qBQäH9ìïUrh5–pwC$√∞*…líMπfÛ!´d7„Zó7éÏr[•é\5eˇU˛¿ÓOÿsŒΩ∑˚ˆ˚6 R§MîM˝∏œsŒ=ÔÛ-ñÛyhÿ}sÒ»k∂«ﬁ2}ﬂÍÓyì=◊ÍÓ·-√ÛnÓÔò}+Øßª⁄6∫{–N’gãKÃ3˝≠Hã’ûk>ƒ;’#699âø&Xºó÷3\œ\Ô˙Us“7‹=”ü§Òç≥„ÒÒ„‹!4mhe”Ëòãï˝⁄nﬂ∂YÔ†6;9œzáµ¯ggØ∂Ááµ˘i∂„∏-”ˇ´3””l◊iˆΩxnøm˘&sù~∑e∂j∂∏„Ù}€ÍöµÆ”5Â√ºâªﬂûûôø47wØí∑LSKô7ØLµ¨á9∑·Æ:AØg4Õ⁄a≠^…~ﬁ≤ç”VﬂÛÕüœwnz∫≤td√û±≈≈E6∂”co∞±èˇ¯‚£Ò¯Èãè~Û‚Ò/ı‚Ò/Ÿã«œÈ€s∫˜>›˚î·∑«_æx?>clÏök¥`´Ÿ÷°Áõ∂}ÿ3«éØL—(r«Èô∂ŸÙœ»Êç∆ÍÙ|ÀÈ
¨©¥,F~–2Ω “ ;Î˝d’ÂÔN∞Â	∂2¡V'ÿ’Ò+S¸Âr=ò^”µËReiM˛xh≤ÍÕæÔ˘Fó|Ç]sú÷€2|À€5öæ„juweäØ˝ÄêôsßÔ˚0‡ @∂ø”±¸J⁄&÷fqoÉ-`mÁ°È.KıŸ˘„#»Âª∫Ît˝⁄ém4®Ïµçñ≥_Û:¨Ÿw=«≠ı´ãõ—Òk3¸ı¶I|◊ËzÆLÕÄÓwmÛÄAªO>ìæÁ[ªáÚÁû—´Õ‰Ä≈ï-∂CôWª6«ˆks@xñÜbü»Û)}Åü_J=zÒ¯„èˇJËˆGq—Ìs∏ŒÒóÙÏ#j„Ô/ˇôøO˝!<§Ò‹‚§ï≠:›]kØÔ8·±,zeäoV˙,ØLÌ:n'Ì^  ©N\;ö˙g∂’ﬂ©˘∆õ]`∑Õû„˙l’p[Ï?ˇ¨q`t¨.çí˝ÛTrúGû8H†çmhÇñ‘•FÓõÓ{ıUVMbåv‘!ÖÜ‘Å¥Hòö†Í’.I¿ö98ŸÊÆœ$æƒå.¨≥o÷vÂkV7NÆ‰·I{NÅ7t‰;é›b!…~¡^:È~JP–ı.¡íj_ ﬂ–R„3x·Á
}I¿ÖêˆH [ı≈„/8à2I˘ê='(À€¿ÍukØÕ∂Ä∞¿Øq<⁄sô”Ô%N(π‘Ú§(Àë>qéA—?£ü∞è`ÿøáˇ˚‚ÒüËŒüXŒìü”ç?µJ_!~#}ë#ß¶∫^˚#ú˛äz¸O¸é˜>îD‡œ/˛Ú!G[”g~€dF@©c5ù*ÃƒÉÄ/+ ök »µ‡k∑e ôgp  ï≤X$†m¶€aàﬁ$Æz/ü3¡Ò
b:∞s[DÆvÓ(cÛLb‰ÄNÆôªFﬂˆ´„ﬂÀx–wπ ≤’o6M`˜ºΩj|'+ôW~C¢P/a˚}Œ–¿œ‡“ﬂıJ[Éøˇ˛æRÅ˝®{ÜiM'7¨â /…ÛÄ⁄∂^©dN‹hµñ˚-Àﬂpˆ™Z÷4Ÿƒf‡G	µ©‡è⁄—^ﬂjô»µxìŸù¿h∂≠é	¸Mµ*˘Ô¯rèççO0¿¶ÈåVéè”XÃ9&Q2@B9_C62±cÑwœµ`6ß÷tlØVgù÷B¯sÜŒŸKyÁÏÈ1¡ôd‚∫ÒúÖß6A)´˛”∏¿aπù(”0jË¶lu{}?_–‚ÃT∑ﬂŸ1›\a#K∞C0;a©.“≈ÖHóq˚Ù†˘}T?Õ'•Hﬂ£ﬂœR˙{Ö:æ@˙jø”∑íD∂Ò–˘ë	‰“/ÏÁWË#©Hseâf^g’ô˘gﬂÂ1˝9À™Û”ˇ4òÏá'ke©ÒNﬂ∞YÀÚ‡.ù¯´ŸŸ…Ÿb¶—l_àygWÃKc≤G&‡©¸∂$«gEæõ[êÃ?[ÖUv:÷OKJvÇÔ∫ﬂT_øêÒb2⁄ã«ø{Ò¯	W—}N ıWï˝ï˙:¡¨mó∞&Ÿï‰&ù∏∏ˆπ",˝Y`H ÔxÒid:™|ı¬+°ï'ˇÑÆ˝ç¶˘«tvˇ)*<ëg·á|	C‰ííÿr´≈@ò2l§Å8&EÅ=Äûû7@c!î4€f´oõpÂ≤óÉ¯±.,“9ïƒ‚õT¬85˚+≤bgû¿=∏˙k⁄åC!6Äàc∫ ∂Jk)óˇU±MU±≈˙=áQû‚ì¬Á∞úP¥@nZ'ß*iIK#ìÕt∏œÅxœÁ≥üê$¡ÂöƒJn·™{d|tº„öÃ'PíâN2ÿTÿœ(óQƒ'résB@övúÉä§	´x ,…BMS$‡(n8nóå)∏"π¨]1´}Êªf?◊!∏ÿ”BàﬂI“…È_®Zàq-ƒ·sçùƒXb◊ÃÆÈˆ7 %∂öñŸmöﬂÄôÆ:ùéÈ6Õ©e◊˜^(c·¸Ö£∑Ñ°«Ô7Nöçøè3Ñ©ˆÑ0 Ø[?Gdˇl*Áÿ∂	€q∫ña√˜Nœ.Q_éı√∑Ô˚‚Ì164ÅŒÅÖNƒO´´*´>Œü˘‚3kLi˚s
",€™˛îæˇÖƒŸ«ÅÀøIjh\Ãù}ˆ3âR‹?‡ã¿º¯˚‡ÊØ…¿˘~`b‰√¯HæÔêt√ö¶T¬j‚˜£'ÈÎÓû’˘µmeûhõ$ÃÓ[~◊D—À⁄Î~ﬂ5ôo˘ˆyïhã`. òtÑzO ∏kXU∞îàá#.%€µ∫Üm˝¥¨Ÿ–Ñü&¢YJÀ∏¥ëü+·iŸU
∞˜sâêÔr¬CürÀâÇÉ€àOS◊Mrú±ëg0êâP01≤ì±&˚Y`Q·Öâî@ôÎÒûîßöÉyLäªüÏJØ≤≠‡D .π*p
a·MnÓÇ∆ªM´dmä!@t≈ê≥≤«Én‰Öıå odû≈qæGﬂbñŒ)ûA„RT–∏atç=X÷Å‰å˘BÃ–`˘~#iﬂg -Ç≥~_‰‹˚áH¢49}™\˝XqóxöêEƒûQ$Xã«b¯Œø¡ZîH>Æ!ºG2Ÿ-X‡S¢∆H{ÄNﬁ¥Ã}∂Gz=dpU!•gÇ_˙ÏëDbêcú≥∑qëõm√5öHÄîóñO‚xëÇ””*=Eºk.¥≠VÀÏJ&8õŸT∑ÕÚ‚ëË∏]€ËyfIıQ`À=q}7ÜÁ—s≤∂ì¿ıL–À◊˙mµ£^m∂≤¥Óy¿¿≠Ø]ôÚ€ÂﬂﬁÚ˚∞†>√KÉµ@V√©õÜ;ËÄ¡Òyó/¢ã˛Pï•e“r5˜›<ˆ¢`´Ø¯;NÎPÄ≤‰˜êâ/ÙF§2Õé¡Q¿yxxÇ8MÕgÀw≤ÖV|ë®k†ïãÒß´ç€€¿µÕ\˙^á©ÁÇxZ”∞w»#[m;˚≠vﬂ=¨nw~ùUq0„Éµqı≈	∑>›;∏ál,iíß9kv–∞—™I4îøq£¢¥HﬁQ…—ëêÌÿ∫2Ö#XdÙ8Œ}7‰cA¥≠ÊêI4l ÀU‚Ïëea(˚Ç¸á
ˇûm±ü¨åG
rIÍWès .‡ËCòπ¨¨AßglïÂÆ,—0ÿ≠µ´˘Ã]0ßÇ5ÀG⁄óâ63¢çetÿu«Û´{Å2(s⁄(wÒÀ§â}*…◊(êΩ∂¿V]ÿùqvÙ•∞&ºqˇ'ŒŒ◊ZÙ∫˚Ìzcv˘ÚÚ=){1Ó\\#ùŒ“rﬂw:ƒ«”˙m	ˇ8 W ‘†ÉL$≈n8>†º$©™`j<≥cq∆ÊM”µvô¡«e5Ÿ‡:yu!2†ÚùæŸó^|< 6ÌsΩ…Q»Å≤\[é^≈⁄-Uùï©ßŸ1˝}SCD…è‰(ä¶Å©,≠ÄGÜg≤5√≤Ÿ
≠:ÛåUﬁ)hÕµöôÎöπﬂI·µWı “Ì~◊c&P=`zÿoüMœ,¿sÀ7êxˆ,DH†˜[?‹`ûè≤•kÓY®a$ﬂ¬æk⁄áŸ€LÉ)P◊&Ø–$èê∞∫§^LÓNåÙ
DB5d>CÆm3Ú’Ë‹]#a
@Ç÷Ë"’mùå@È@Q˛ã·îRˇ{nÕÈúıÃÇ»®=n˜kı:kiUORÏ¢ñ¢9é¯RÃf¡ÿÖ=^ Õ*—™É¡ÿ3√˘—¿/5⁄fjw«∆ÓâK∆éÁÿ˝‡	ﬂÈ’ÓŒ ìƒ„Ÿπ6ëNhV≥0+ı™¯ôø‘ÆÕão˚¡∑ò≤82!Ug]†Cœµ îÚﬁ;◊ts98®~dö ¢ó}ÿ˘ñ—mölÎ∆ñàú?¬π“≤'©ÁRœ[@=∑Å°›C:©òíÚû·¬ryÃŸe ç®∞Ò∏‚&Áƒ,‹ÕóAJı›ÿ¢tÊÇò|Õà…®ÂàÀl√Ÿ≥∫¿ˇ†ª´ﬁXﬁ^Ωﬁÿbw∂∑Ÿ÷ÍÌFcsÎ˙Õmv´q˚jcu{„«„˙ÚÜç-ﬂÁé<⁄2«h≈ÖŸrñd"‚BÊFVçS:H`™dÄ¯c‡àÛ$bëë.V¡’'“Ïi‘¿á∆3£=;:ŸC–◊Ã) ∞+ìÚ>¿T˜l‰«V’≥-BêFváúã@‘!Cã1ºB˚è“
úPìôS ó\RÔ!Sfè˙„\[G≤n˘áA∞a*òR√'*‰jOÈ6§∏;®f ¶ö÷«À¶Q»…=c2W∞*#◊+@¸LÒ'Rë‡C¢øÚDA	±9áÊ»”e∏™ìID^Œ{+ﬂK&ﬂOf«)vÔ·FEíõ#ª∆5¸_Ùƒ∂ﬁ[Y˛[¸'é;_xXh;(Ô∞u\∂ädƒ|Êı‰AéF'$üë«··Ø&T¶E%‚CÚ(fz;m ∂lˇ6èÑÚ=cÉ£Úä™ˇWƒ¶"ü§¬3∂È‡ÍM¨høÈ!Uéÿµl≥í…-»˝d¯ÿB«E´~C>¿?ˇ~ Ø™–çø≈Zâ∑jã?‘≈°G{@¯t`¸Â&Ç»ì∞¯2ç¯wÉy=æ§S‡:wäﬂj∫ém£=fd‡¶…”£â$ôÇÁå§‚!”Ôã®ºÙ~jb$é$k£à˛ªŒæ∑x4[Dq”è	ÓÓœßsBÖ⁄≈π=*Ñ…òÔ~áŸ‹QπÜ˙à≥U9±SdPóR-Æ~fÅm;=&`{≈ÂYDœ5CœèÉ∏÷N=NïÂO[ﬁíÒ$·9«≥äÃªÉ1ı∫GzA0pû>”Måã¥ò∑◊∂öR|_ÔÄÙ.ÃÍy]ûû⁄Ø3ÆiE…∂£pç¥§ú±çÙ1à1e0sJôª–Çæ<-h°t®»Öo∂vÄ<ùÄ¬I"L˜Ì-[ul«Õ&ˆÅÉ¥L¯Ä?˛ µŒ3˛ﬁ(e∏|ÇOÌh≈Ä,‚Lib>ˇπ≤GÎUDôÜdAE/É†,M¶ù—∞)∆≤)-S-ª7Z˙£Ø”÷êƒår¡©JÅ#¶@3‡r/≥~Øg∫MdáﬂÙ¨t.®)ËŸ(lˇ›±o◊óf◊f«&ÿÿ∑WÁ‡C_Îçô◊gW¯◊Èï◊/◊«ÓMvå^µ⁄§mL≥&%(º5eÏÅy∏x‘,$ë«ºyH∆OÃïr 0lÍA~(R~ÒËà< 8ı—úe∏∑Go#S¥ˇß®» ¨cúÓwrëñÏÉMåÔs˛Øiÿ&`”{#nø¡≠˘c«okçΩv+^H›⁄∞˙¶”24∫{∂Âµœ®)†—=qc@£{nu<Á⁄¿¡èõèœ(Ù≠ú<Ù≠\@ﬂ ∑œñPµ‹jπòpÊL“RÉÓƒi–˛ß>p‚@w)®Äâ#üA˚0ó˙@‹Øÿ/†å⁄ÚPD∏)ﬁ[U™… ó~ÙÚaix—•ÁÙ”HÈúûãªÙq=5€ëfê:`qyÜíΩπ∞∞N¯…/±c´Ω∂Lﬂ∞ÏºR:ëe:]V¯9 ùFôÙÂ¿ãKêzI]b©`ÚÅµPù1PÖD÷v√O_|0˘E©0“ö_T/AåV#ÊÒdÕ∏⁄7ä‹ê__êe9efÖ´ñi∑Jd†∑Ô˜˛˚ª¯ˆ◊:ÃQ∑CZa‘‡˜/$Q¸8(ß√ÌÔÛÏ)º»≥Ã2er”6.·Œ/Û7Òæ‚C~ gØ=ëïÉ&-sLê
˛œè_2èp∑∂wôÃL‰‚≠qåßœ~¬Ù1Â¥˘\©‹ı%o˝/“Ï"N¨˘ÛÈY3S´B¨¬:π nÀ#aÇ«\ÛùæÂíã∫'›≥[á]ìwphxôb÷®sö>3“„ ¸TB¬ªjŒS⁄´$IˆW<Q:Á∞•¨5≤ VKƒ â™◊ﬂ3x›A÷h“vÙl%’‰∫‹<sÈ—›±´Ä†˚÷ò«ıCSLVN˘0`ÔdV 	6v√I<Õq'ıi•Ìıµ‘¶ﬂ/#˛LW˝ÿ9hÑ¶∞—k}√mYFó›j#ªè≠˛ä»œW!≥)Jjro;Ñ±'2'Î3lb≈vúœïOÔıa<¡æ4t–^O0´uP`Ò†#çÏÏqæ≠5ÓÖ‘„lúv8b±_Œ“¸X√ß&≥@iπyDâ„àπÀIˇ¶ÂY;v^í|/à≥0_,ˆ
–‹πcÕπﬂÊ™5Ï‰á·a≥’©-3dö—ùôYbgﬂŒIv+Tùï\óıÈ˙VV·’‡Œãë†%yßÊáïèLêâ◊Û*íTÚÚ:ä°¥√©•@Zâº¢õ3"◊Hu2=Ç]˘UpGiC.9¸ÖÀLÊ çd˜O‚ÏgÅ|Ò^êa9•rZ ‚~∆CxR≈ê5ûCﬁÎ˜z61ßÜ-9VﬂaM£Giô˚]Îùæ…:¶o 	0X´Ô¢ÆMÚπNw«An´ªó'å©/äTùzJŒÍM`‹=ü™Í±E÷sùNœOU>&æÚAyø‹ÂéáÚ1)¶˛Å7±@HC8Ls1á±êØG¥vY/P⁄Ê)Îx© /R.“»9.∞ª‚≠IıÚ;>xÅΩ}µˆù£5 qì]gø:~¸ˆMuÇ∂ìí‹¯¿lÒ^ÿ5lœd«˜ráp<ûªRŸä∏Ωiä˜W==/\»[dgÖ∏ıbFÏô<3ÏΩ˛Å∏ƒDV5--jeºe˜Ω(óÅ¶ñ}¸õ…iD!ıAùKı òA»9…≤⁄eá&R) ™»l⁄‚==iµ¢9Û0AL>;P&+L·8?=5óü’q4·ñâËåÏ|2bá5‰≈Ç¿èX˛≈hZYæóbAû¡ê~hç@</)2z≈—(Æ„))DB«X©€w0,uõßÔ/∂ÍòˆJÎÜ†¸⁄¥?N˝îr◊¬R∑’]ÏwpÖƒPâ8ŸAH¸S@Ÿ-_¥D˙b±•1˛èﬂ˜\Ö7†«Ÿtó‹’Ω<VblªÜ◊û…ır!´»é4êà=jQΩæ¿Ç§}"]ü∂h÷/ﬁÁŸœætv‚¶°P|‚FíA h8YÙüK„»WÚT—˝g [≈wÈUv€l"Zû∏9H'_…Gøî≤’üÈâˇEﬂˇ»ç5©bû∆)∂∫ıÊx äRîå»oAhÛyBﬂÂ√HJN^<†	bÉk∂M ®˘Á>î.¨ü€‚‘ÇízX ≠k;Fnµ•¶≈˝»õö-P’æ,±}ÀwA
´‡W¢∆S?ÒúÓ˜∞"–á≈æø[ª<Qaﬂef∑È¥Ã;∑◊1É±”ß˙/[77'=ER‡¶™Qé/ˇ8˝€À]x…mÄÉh9Õ>ä¬ìM◊Ïop¡∏:fåÂ∂•∂2âfÜkeV+m◊‹≠L»y⁄äÑhÈm>…˚1:y?"jM‚æ≠ﬂ[w-€∞áükT% ∏"Æ(≠°_B?iEÍd3ÄøS‘>f—ÌLN\ÙW‡Å3*ﬂMÈëÁãî,<ã•jØ'≤âFÒd,Ó3.C‡Dhoõ\±Q’c B˚·`xÃ	µlu[÷ûÉU~vΩTf<∞S¶	!Çˆ@¨ı;Ω"1`∞ËÛın”Ó∑Lèa¢-W!ÓòË7
Ö‹3Cly.¯tc<úoœrΩXçﬂ—óøq∑étæ$˝‹}.Î }"UùgZÓØ¢âG™y˘8”%—â8¸·¡lŸhîÔ∂Ç£∑–0ÖÖÔÍÁÄ˙ÑùÁR†∫~Æ\Ö]Ÿû…hym”Ù3…áTúù˝ê€	ªx2§q–4m[∏Ç0˙≈h“ﬁ◊áx¸5®c´d·$!0d<„˝ï,ˆ$®º˜^V<ª O©É•'ÒWí'¬ìN#ñõM |üÓÔâúó=„∞¡€ó2cr’4eOH %T!¸\YÖFΩLZ`tv`'G	ÆZ] à;\ÄöÉíÑ´˚–¡l_¥pFì˚úY∫‰ ˝Óà73Ïé˚ÀÏ·Øæﬁ¶Ô›ÁyÑ·ÔÖ⁄È‚oU*WÀ–ó˜9aãÑPZƒiã∂∞‘&ÅˆÍ‰]xS\7πÏjmzb&ÒÊﬂ”ïQ·dUÁ\~Ô◊t„æ*øRŒÖî
íœÖ¢Î≈•O\˛@¨*>ˆÍÍπ‘⁄‹6ªÊÉ,»∞∞¶ÔêÛÕ#UüÚMƒKÃ˚D∂èˆ∏_'P∫ãbê·/±$Å˛˙≠¡*1Jˆ`ä›vÏ´A¢2ï€ì¥êY¡ÑãÊ@%#ï¡ÙjK^ÖÉ4Î”≥ìóÁ'Îıπ…˘π¡Í ›hM≤ı‰X‚≥J|·ÄEÍ∂ùñq8¡¶//ÃŒ∞[7Øßkªπ^oX›˛¡–’Á2òû◊ëÁ…©úáB"F^≠*z “\í◊¨ùwfJ'é
∏∂≈9t€q:¨
¯Ωª;$dÕ-‘ÁGY[∆Æ·Z Y£ysÎõYg©¬`}vÅÒ†mvñrÌO˙û∞Ù‚˝ûxÒÇoèqùË»˘ÁÀSXŸOÑO†¬˝JΩÈ,+Ëî{µF7Ïe∞ÓAΩvµ
˝3Œ–ˇ‚»¬KPÿ˝£ .sù
%‚ù¥Øﬁ°X,vËÙy±T¬6U◊sMΩ±Z—MıÅiˆ¯É"äŒ3vÕ≈≈¡µlìFÓSƒ˘´c‘ˆ±ia†UaZ #”u˜Ü∑G>J…ÌÜUP|í¯.ÀWh≤Y
•##jÏ h?§µ—>boÁvïôXÉ…ÏªyrGNv:{2|¥
#4Û‡Oxîªòü,Ç|EÈMï»õ#ØÌÏﬂ¥[±}Éâ‘¨"	iÂXf‚hÚﬁBJK±±}®M¢1~x…ûïdy∫∏HºéÃªóíR/∫å’WbÎ≠Nd‘%Ê9	ßW{=€•ãÆ] ÕãËë‹À+çCÛÊÓnV Œ=êq7[≠[‰∫U*EÓ…cVƒ·∑°6Õ˝°ê	ﬁ◊D¶n¯d:")M}cêHùÛ+±ı<5$äÓ·ïA¢ æáÁ¯Sƒã…[≈xs‡QÜ≈7—éÓ}:„ ã>Ùç¡Ω¯º_IYﬂS√¡‰æûE<,Œ˙ÖPqÌ5)Àù—ÄﬁÜR.I—`íì*RÜ°êBh\u∏Óú∞.Æ*2]9˚¢"^h*JY)ˆ3ôIH¯|≈}5–K#¥3™õu[¯øù∏∂"Êåˆh"ÓE_$Çøí(ÙT∫á?U#u#V÷_EúN∏Áä4.>ëÂ∏{˙c—<?£ˇ.Îr˝ª\bæÄèÇî?iZ°⁄‡ıg3ÎôÆHÁ„1€|h¬£«
¨÷∫pb>tò°_â¸∂H˘ƒK¥Eírû(ÜƒhíÙ0∏¢¡-íz6¿BS‚2Èxî…V≈l√Oeâc˜õÜkﬁÔ8-”ÃF≥’"¿»~8XßlBππﬂE´µñ•¿¸ìÜàº6^eiÂ•≥u∂≠ï%·4rﬂuúŒ˝vg8ìﬂ#är. aô“ùçä”	â°t˛ZÓπZπM©Åt‚∑LO=Åµπ¶xÉÚ[ªñâ|ﬂEt*4lfprˆÄfù^¢)‹‰ﬁ‘ô∆çk($˝zMŸ™N+·∑˙+Vñ¯≤pˇ1ù•ÑoÁ«fZ¯\\^AYÂÍÌõõ€çÕ5ˆ£∆ ÷˙vÉm,oÆ≠o^c[çÌm¯w+!∞p	«á@XŸu©$\∫9ı‘´`¶f
úΩŒ}wù˝åƒBûo∏>>ó».0ó¡gÒZöÈ·ÜGrqTÈégUFÓ?=Cæ<5[$O›˝vΩ1ª|yYxÈ‚Jäè§˜ ÜŸÎN«Ï!«ŒPfÇn{v iHC‚ÙÛÃéU¿◊4Ä¯PFPﬂÈ…L‘®¯È L°Ω˛êH†|ÿìô.+<åÉÙ2¿÷‰9LKŸGQláëFrıa]%}ôï>eÚΩ†∫*~ö∞Ô>ùπı]ØŸŒNL_ÕûrU 7€¿†`‹/'jr=øã°:Æ%@çL,g¸*Ó›0ª}Ãÿ–mU;xúv0_"c?«ﬂò$ır£{‰
-î∆b⁄Çú√à	øW‚DûHÌ¡o§ƒ”¿c¯Ω îE»˙èH‹?ô9Ô©‘—=ÂäïﬂaÇß09∞(”˝õLÔè§«CŒBçÅ$πá{º*Æ7dn:Ω√	ÊŸø\ç å	ÊÍc¿ì†CƒËA≤©¨º=B˘á—zL‘HÂ
ø‘'kµ[Yﬁ‹l‹¶Ø©ä¡º£CSXT.:Óbxá›&Yé‰åÀæ{ò√œÚXuFﬁ≤E÷5˜ŸUÒ3/l;Û∆‘k 1i˙ ,á‚0.v◊≤MäX√√ƒvˆúÇ1·#Îd]RÇÁ˜L_DŒØÆ∑™c¯P[Æë!jlúªæ}cÉﬁèfOìüÖ˝¿6?0ﬂÄxÚ“›È{˘©“‰ZNpt≈«&“⁄…â‚h›ó©GFyí∞V›VRÁô˜2ﬂKå◊É#z•£ñhAOxA’¨‡ˆ≥ü±±ºôÕ7äõo–|P.&≥ı‡âÅœzD˘∆MÀ¬v´©#\:çO‚SÂ€ﬁÂÃÀèM√-ÓBy∏|Om”Ó!wîπBÚÅ®cXvfªt∑|£˚ÊÇ[Ò™àÀ˜¿O*yY‹ãÚ†=]Öˆ∑¨ü‚î∂(IU´O˘u;;3ñó„$£ÁkÆ—¬ ›i Áë°™ìc∫‘|ë§ﬁq≥AB‹≤‡ƒƒÌ¡L‹iÏ Ìö~≥]Ö3gπgA;’±)£gM	Æ`|"˜Ëò~€i¡în›‹⁄ÀÀÜöãÖ`rŸG¬ áq01¨!ß%ÁI©\ÚŒx<≈ªpÚoìD≈Óæ9ñ"ÜÕÑÄ†¥€-çD§Wï›yR9û-†ÃQ*ﬂ)Ns'&πê5˚"^Ó˝ÅòÊ@1k∂Ä2ªl∞çº∂#ù¶≈odÒ§¢ §edE|˚0ßè}êù˝…ñËßÅÌUëÂﬂ∆Df"ŸÔ}QS#óHÂNJØ†»‰´˛)Ÿ]SÅÖU»"	ó”Îè•‰Z„7J÷âÈç"µ…∞nÉ4ÏÊ¶ 8f&&≈ÕÉrΩU˙è¥](7… 1<Öı~‹∆ø|»ì£':¸Àæ–êåÁTΩr’†l,0eúª≤ï<»»BÑc÷$(ØöÆõGÜê™:∂9InÚ’±[◊oQf‰ΩÈ“úHÿDˆ ßÆ∂ço°»›4E=9Du¸ò9€ß4ò`ÅãÃM◊cª˝.¯Ÿt‚$;’K(5i´ –kËÒlºxJÛ»MÎïµ}ó”m¿OË
IT¢÷ﬂ´ºf˙©ñ”…–”s-ÆZxE*Í;≠Ö^Ì≤‚;TTÜ'Uµü©À∏LZó’Î7on∞çõ◊n¶*R¯'K5íÎ”ñÓõÃlù•]ç©æ+K Xã=Yµró+:‹ÆÕŒ†WﬁÂHÆù=.tå{œàÌµñ˜®∫êÜÔ1mj>Ôúe6Qf]ddE7·ŒÛ‹Êb~g«Ã∞˝E¨¡È∞[úÙU¢ÎI?¬Ô«Ÿ˘	öY(©hAv[1
nà,|Æ\ÈS¸$x3XT•*x»f&Ÿ»êMÉSI£–-~“<Å—xF¯œê•◊lE^ÒBÃ€µßò;¯R˙Z˛amöÉVçø,Øíô8tpó„à
'PºÅå˝„ΩG≈€¨ep∆ÁÚü»∂K)mƒ0^°@dv»ŒÖ$LEÖ
YñÆY¨¡ıˇﬁˇ√˛ﬂÁø”IX^‡:-¶<TÚÒ X‡ @
‹Ç)pºD˝i8Y≠≈JL9\Ù
˙UÙÄ¸X`P¶˛πËqï.÷®ëçm(ñ/Öv5Áãaık“ø1yw˙^±_	 ﬁ¯|ëT≠ˆÁÚ
¥¬ /ﬂ¶˘I\Âáø<È§ƒã¿K£ß9_9bzGL˜çIŒ˜ÎÕ ?k¬èv⁄z•Om≠A¢õ˙ÉÍbâµB=œ]¨›†ŒCœ•“/”‡q	à¬ñ=‹–;∑78Lø]4àÇºˇ'ÑC1Du}ª◊2—râﬁΩÉ⁄ÖFÒ“vçKWÁÆ÷#•Ì÷Ê´çÀ˜Ç5”Ø/_∫·≈•‹°T7à≈∫VÙÊi ˘$  ﬂ˝ˆÍ<åbÓﬁêeΩÔÙà"ïÆå@/”˘ [–™Or:Uπsƒ¥àπ◊0q;ØüQBVÀO˜>C˚ïe‚∆OÊ◊mgü’sìLY¿,ùò¯∏π|£¡™+Àõ◊6ñ«uJUÚò»\ ·4ÅGFÊ>(%ãÃ∞«Ö_aïCJ(aﬂ,ë©#∞hDjÊ+DÇ@Õ@¨VÎ]ƒjÓ¿(CÁ∏òÎ”Åóª%y¡ù}6ªpΩæu˝lBv„%Bv„≤Â'ˇº	)˚Ã9°ÏÀkk∑[[gì™˛)ß˙A◊ê/>ÁÜ¶ }&Èy‡ı“`˙Çö]j>{N®yc}}ìmﬁπ±“∏˝íÄ^”gØ2˜Z}~Óµ È#é‡˛≈Á‹–Ù´7ÔlÆ5÷ÿèÀg≤cÆ¢ïôÈ˙Âó ﬁ 0.†\|t©¸‹9°Ú7nÆ¨o4ÿªu˝Êf„Lq7“•˘Ù_ˆ|ı‚snh{„∆Ú˙∆ôÇbr†	¨	v{ø‚ìOµãı˛2∏ºÜæaTdƒuº2⁄=å=>àÅÎfÃY]Ml–cpî®èä◊1\ü{"wÇ\6ﬁ°èUNùN>€sà#ÜVuŒ+‚d¢M1Z £sâm°c'Îπ¿$÷›ôQå◊@æƒz‰d≈ÁÈG◊≠ûõf1óK√
⁄{¥¬å»∞i8~R#«ÌïÂ’\ªç¬[ΩπqSKñ—r«Ãs'•V4OI0ö∏¥Áß.’àGq}ªﬁ∏4ª6;Vp∫ñ#ÖŒ)|2ü–(≥I!6E≈æãzTüfm¸£Pî,2Û,ËQö!ØÌZ›µÈÄäliëãG	“`¿. Ëƒ(~†gßƒı¿öû?HÓAÅ!úåb8œ€	ëªldßæzssõm≠ˇó@nÈx÷Ÿô„[ˇ:ûª¯#8ëênç@rèÈI«Í.VÍóãü3+s≈œï°O±%>«¥IŒd#í<sΩÎ«”åü°j⁄¨tåa†≥·bYNãb'z,ÆQ¢2∂/ï˙—‹Áç¯\ªΩº∂ﬁ ÚÚ©ßFì…ÚèåESz,jöÄ˜mõÕ;ŒA!u ∆GÕ÷‚—+ØîäÒ/Dü”á2BèF»ô(,åXåb⁄†E¢1µ9 ˛5'CbyîQäoNΩæC>%6E„‘ÛÑ-H;K•{0–sv}t•‘Û†-F¿aHV± `äy;èâ4°˙˙Bc≥áÅ¡=?LiXJ5 SîjºdΩ=Õp»™¬'ÄÆ¿˚õÆ§ïAHpΩÍâ%‹∏ qœˆÒŒÖæWe=ªπW7ΩÀ	OqïvΩÍ©w≥ã§¶∞SKø+e—^ œâJßL¯·5Ê<¡I»\é…‹ÈÈ3r∏ï¨“Ä9◊Dí”r˘◊ŒN¿K®ñW•õH	®ßŒ∂≥e∫ÄY°Äô˚Ô#QÄ2<óeæ¢ƒœ3”Bî»˛êTπfv1ÖeòñÉ'ÇŸYxjLë@Ûx%«2V#%xû”ƒ€Ω¿ÛgœGÉﬁá-m8H‹Bv¸v&c:LÈ¶-$öxáUW`—l£ÿ+o‘ˆç°"ŒX‹¿È÷w¬ëqÛÑA¨fyÌ≥cNügÃÉˇ∆í0v]¶Ïª·Ï`,Ú≠6˝å@ôñÔÕôÚºπÄ∞$Ñ›‹›µö0´∞)ò:∂AŸóπÔˆ»@ç|Máµbô≥„sÆ°,Ôñ~ç?1Õ†2£Ÿ<]üùü1Ói◊¯ÓTSGÚdn:Û<)2KJÃì≠n-_kÄÄµ∫Ω~s≥úÄÖl˚}œ§úb#Ksç√∫erÅÿ0√ÓÆÛúY
îî¬R[TÛùöã	>; N¬5¯1˜öq©~èıjÛë‰I ûªßÕ˜è∞ÇEALÀS¨˙..Ôá*òØÓâ+!ﬂ>ØÜ§_€0Ãx›(ûﬁÕ´¿G√»N∏O´>uy>ZvÇ™®¨oõ;}ÀnM`∫óL_∞À{{¿n<¥<¯À?ú†¸Û"…$Ã¿e‹+îAE2x&Ä⁄c ∞Bã6¨@'≥fM*+]=øY ´î`®ÿ?E'}Ñ~Úàí%å0Õä(øÇΩKÀ…ºæ¯≤o|ûp˙ö~∏∫¡™¢6AÊoq}ä˜€n[€∑l^‹oﬂµ‰.ÒÜ4jæ®ä§ì—%~~“∫@Ìî.%íπ»	nXûø¿ÓjºÙéYòÁW§û`]!yå≈íä[(¯éÈf`ÑwZ¶◊t≠ã∑j∫NP†Ö™2»Q√“˚m÷1~‚∏+‰qkzçm/v¥=1îO_|ÙK^¢ì«|JC„#¯î◊°xÚ‚Ò/iÆÇr_Òjñ<›Á«§»˙"®P˘T™√>ŒÃ,˘úÆ>ì’1>PoP•Õ«0`ûVü`<ıê5‰ÄÙíÂà›È:æ’4’›Ÿ§+l≈énÕ«4Æª˚úèˇ›∞*}rG6P√Í3ﬁ_q£	«VœÄ}Çì©…]ESWˇπl˙	ÈÜ©ˇù%«ÓA¨ÄÈóTyÜˇì^¡Ã™p5\∑ô°÷ÕÎôf≥≠Æ€-◊Í6≠Í[Í=1õîÌèW\Í£pË˘Ûãè~û≤®?2Ì¶”¡Ñú"Äìóπ_ë M∂§ˇ Ó√Û	Àík¸ÑÜXÅ√gävıi:ÿfé˚π‹ÆpÌü»?¿]T{âLRl…ÏP[ß}ﬂWwd/∞-æSÏ:–.«=åÓKÊ
®’dDuxé€8¯ﬂ_≤vÔÛî}Zq-séN«pô≥Ÿ>⁄πù–âµc˙Æ’L«Ü‚ùäè)Ç¡T∏Z˝ârπOïª™oÁª/6Rñ’y¸Áp«ÊÜ⁄±]^V7m’Å£ˆ™∏A]≥ªÁ∑ΩËæÖ¥¿ÍøI†‰ÖÇﬂó≥{.ü˚"eÉ~`Ü‰h◊h"#eô®%ì’ºEM”Ì2Ë∏K∑S7ßIBåxNI°˘r‚„Aïc^ÊË‹FÅ1_
p˚5> ´Q´A3üi˚c-Ÿl∏EÛCm–$}3rD\C6¶ã4h N±’ÿS¡∫Ñƒ!ˆc>©O$má•yú≤7aT±∂cvvdë%™˝á’$)á+Î]”N›îGƒEÑÂ∏ü#˙ıÅÕø…:Sèc∏"vÛsYw*\ˆî:”·J_j•˜€6Úƒèî∂Âµ»1ªøòøÀÆ"4Åõ⁄æJY‘U£”ÎÉ∏n⁄ÊéKÃ¶8ía!	∂exd·@“5ÏÏS˙˛I@m~˚‚£ˇNÀı$≤úèdyp˛bP≈˚”ÄÓ¸‹ºπà~m®FnƒÍ8]À∞’Uﬁ/¡·÷A <ékô1≤Ûà†ÙÁ©8Œg˘~˚˜1X˙•4à(û∆∆ Óqûú;‚á∫a˜;]kÇÌıÅ/≥(Ñâ6Ømôs∏®` _*'q:Åä>‹ø_{˚Uhû≈}úd¬fúÓóác∏L˜aåS>ãt£◊˙V}qÛ¯S^⁄!2ëœeq:I`%&b@7?Á¥*eÉ∂—KŒF1ív≥ª'«’≥·ïåÌ	÷}¡7&ÌÄàO‡ë"#<èÔ÷«Q_êsw‰ı·No„u7Æ.ˇê-7õ–¥EÚî≤˛œÈ‡@¯'6ÔâÄ8ºˇ-ÈÏó¨
≠åß,˙U◊|ßo¢C3<Ù,É_πI∏€!nmª}ﬂ€áÛ"K¨à˚$( å_>ñp˛,é
œiìﬁcÇ≥R≈±È¯¢j¨È=7π‚¨û)˘ˆ√ Åé¯* m¢ ◊Q™v≠öÃ£»ÛØÃ,˜~A"“®„÷,U$U"ı¶Íä„ø2q‹ä™¯≈ÛQù~"ßgÆWû2™H”á:%·Öì]óN'ãÊêI2∑çùÄèM„°µ«&‹‚ıkÑ2¥¨œ©ã˜]£'¸v;~m>·˜'6mûºÛJíÊi†y2©,D™#¨á°J∑π+hC†t˘[\›¬…¿íüƒÉ€j:÷ï-Q 4›À.ü§ £≠Ÿ6;Ü:R√5ö6ªaÌ	Fm
≈XÂ!1‡î≤2Å˛à˚)'¯b∞k¢˛Õ0£EM≤Î ãò2b,˘≤öx ‰»?V4ÆN{Ë∑û…S·Q8‡UøÜ, nÀT∆â%0Ÿ
^Ñ%]qâª≥Íq¿‚í~¿dU⁄OÂY¡oºé3•H±2–ÃqﬁõÏΩjïßœÀ©Ø£`.˘ìV+üd¨9G*O5◊◊ú&Pà*v•ùä‡ËÌ,~5$M°ªíÿJ´ç◊âê‚à'ÓD#–ﬂ)RÜ ¥» àS+<ﬂ íF`ôZò·Û⁄Xa+a+)ßU}^9≠Ú;~;o/
jù¿ÑêÛ7ìª≈´&˘ìq`*‚˚q±'{Òñm∆/6êg⁄_WùûÖ'õ„óÃÉÏ®Io√˙gôÄ©Àÿi◊6$Zg=ª¨zﬁ’bÏÁœ–öq†èö\Z]ê„}≥∂TÆfuÛ¨≠¥KˇxÔ˜r]î)G‹d_a∑PãÃZñ(p·V7bgÏπù°íﬁd°ªxƒWAê¢r≥å¶⁄ÖQå'Ï´·*K‘â\&'Ÿº˜H”?=ÌVöÉAÜB‹Y©m/Ø∞˙€X≥¡kÎ€7ogTÇŒH&•|Ó¡y¸nÅÅ˜H‹UØfÀÆi∞*—-ãLœK;¬ùl”z+o§i£L0Py;4ï@~gfzzÍıx)ØyñtÉé8?+N—˙ ü6¬bÑí1Œ—a◊a:Ωù¬TËù0üÄ[ﬁƒÎ¡4B˘œπ‘ìR≥(nılF¿îV5(Çï–Dk;Õ…&v«È:¡Ó;]óƒãˇDZg¸ûòà@ÓsßUYJÄó∆…A≥újœ>£Y’™\M´$ëjƒ¶ HUaKYN*£kó"PR4D˘◊(x pËÄÜ^˝®¢àXzf§
Y≠òö¥¢ïóÃ˘h _‡«e˘v7Û†+ù“N¯Q¸Å5ûÆöBﬂÉ‡πÅ„i∞w¸ìÊ®πïh)^≤
[Z2ät_KùÿYWp¬3ó’,^=$(¨ÿı 1©≠HÛX©JΩ¸/πÿ}V!uedê∫r^!5Ê'n<ú¶_[(^ïıdS&èEo¬ä]¿Èjl∂ÎÏ{ãG3:pëWÒHË*oËúÎ◊ ìdıâ¥˛Y¯2Lë·[X¡˜è!ÌiBÓHË,oËúBÓ9!≥»+\C—HC‡‘ÕXÃRßµµ_´OÕjΩYíôv—~æŸ«≠¥∫â˚Æç7‘ô.ìÇŒ®t©7V?I,¢AÍVà,@$j´ ÁG'-|¬œ∞8Ö	!ñﬁj®4±FπäD`Md1¶åºåA[ÁG/)ÑÄK`¢†+≥R€SÃE‚≈ä™_Ø‘XEG{$åS⁄"ùFy%Æ#gÆÈ˜›ÆNçX^∏òµ0x+«Ç8√»ÃWw˜ﬁ87J¬ç0ûDøD1º6iµHªù∏n`>¡%É''q"˙eÇ•sRRÙ,◊F#•çFâ6b˛I	m†ñ…ñ åI82âì(~⁄ÂeãT?Z%åuÀ+xÄ±Ë¥z¨UâYAäI E~µjºO∞ùÓ≈"ì¥(„¨&ØÏà+Z]ç"X´dÌÌh¿ñ2W≠ı”ùU˙£˘r¬UÌñ‚¶∆(oØè~jËKÈö¥ﬁ±Ï=ØË∏´ç⁄a≠–)?ŸÂ§”ÉÆõ3ªEA◊…C4√P4Ú√u¿<b¸£Ê•Öa‡≤,∫¯!´Æi∏Õ6A›˚p`≥´ñç…õÿéQ.≈|v»tbœÚ™x√ÆiÛËŒ„kÂ÷-Xz}≈mT
‚ãı√æÈ!Eé¸£¥RVì–1€ BöÓb¬7•B!2§¡·äpäòH	1çÎy˛@Nÿø eåª⁄[a¨"`#¯ªsH¸¿za°/∞∏ˆÕ°Útíì"EÇKq≠
•Ô‹Ò‡x
$9	‡Á¥ƒ†R_äÄ;ûc˜1’:õ—∆¯Nèv¶åÂ6HÜ>º∞c√lFBKsbπèûHÄä5°Ç«Æ°≈◊Fë£A≈Â›µù˝Z€jµÃnë>=Iu˙ÙsP3˙æSD_}c«éè¿Y‘"CÀVÀ¨ /¡ CÂ^™{K±¡«ÿﬁdn¢Q∞ÃL¯úñ(ÉÁ◊‘—1˙Æñ6«oß1C≥y¯!Xa0"øΩXπΩWñ∂6B†ﬂÆõ–NOŸ‡^e?0G—™∞O±5”7,€c’¥Z5∫„√7û∫2ıiæ4[rR}\¢>nsf˚d'≤ÃIÅ^'T!¥aKÄ≈àC1• ÄSq›ªB3-2¬?â	˝ä∆íNÓœ9∞Êï‰°,’Fï§'úsÌ—;t§/≤dììæ≥·ÏõÓ*–ñ¨¥±ÒèD{ ?\ùÌh“Í6Ì~ÀÙ™Ôâ˝Ïg%Z„™üQ∑ÿYã§AãhsêùJ\ÃÔnà˛V“˙+Z0=≠êàk·GDE9¡,8∑ÁFSÑ8ƒx‹á≥àÉqTœÕ˝WúÍbeÁœäê¢ç≠-J»ÑΩπÏO|®-*´;ûîîıVóƒÖ§VAZ:ƒOÙÊ‰¬I]ÒÊ§îzƒ"p9ïf°ˇh
á¥WÑPÃ‰§(K]f‹HßåYü”iøU`.RÜªNlj –FπÌe∂:√∆<≠]]$—b2◊m]‡“∞ïïd»HHÜŸÇBAèssçiçAÕø#ŒpÍpV 'üv–ÖZ0◊ØµXˆ#Ük∂ﬁøá5-$r‡’:wßÆsT™KmEã-0Iˆ Ã≤≤h[sÂ√%q+Í2∂’ﬂÒ…wu‘ƒ5‘Ó÷Î∏á6œ#VCU‹ÅŸ¬2Rµ}Ø∆øwZôﬁ%≈•Ω"cã!/¸Ó`=FÊÁW‰º>
tcÒläü∆ ÊÇ ñÏîjÚmN-èï!æ%‡#1–{a£“◊§1ä5	ÍÅ(K“»^í∆â/Iiî·$€Ê9$Wx$÷‡F4ıÅ·ßúf0¸`á?√‘À
r·áÎ“¨Œi∂æ1=>¯Æπ/``ëΩ‚MÚdz¬[≤1€‹3öá?0o=Ã”|óŒœGÔ†{Ú;ÜÆ ó1JÈ&Sª5∫®gkçÈ[≤√èÃ4¶$¶π +ñö!kòy:¡ Ø‡0MâÙMaF©°÷Õxágz¶û 2H69LSJ
ßhBß°ü'
ì”œ@‰=ïMïnI”B˝ƒ0pN≈Œªún‹+ﬂ.Rü∞’W_e©ÙnÇ4*◊à¯ßî´DrH|BMHÈ>Xö¡∆¡ÿ›`’Åîd{†∆ ∞¯¡;z~ √v$ùΩ»â+LûS•Q°Ï§{Qπ~Ù‹å¬œ®A}@ ∆3(¸îÜç4áiò	ôã›Œ[ö˛=ë^Ù<}fı<}î	ó*5ÔI‡¨°™◊x‘m}:,ÀKa"ıjdD‚øt‡Æë≤g∏h~Jh$Y´œìëô—4<åâØa&‹ØÄ¬‘(ÒÂm
~Qd?q˙u„“Â{c"ëâÙ	.s‡Âg.â~JKpÂ∏{eﬂƒN‘®6û«ó+¢—NP|®‚^t”ˆ‚µπÃ´J‰ÏΩ*π1Ò≠°.®:‚AmûˆFΩRjw Ìè¶è?ˇË˙c+oƒƒç
±bR˝—€q≈Èj2MÊC!L$7…%@⁄UWYm ©¸é"£©∆’†cî˚Úﬂdƒœdä√èiò<ı”ÿ8|O{Û˘I=íI'ﬂ•wÆìõÜé∑M¯9[˙EÓ ∏Â∏ËÊ ñ]tﬁ˘Õºó™-â·Åz∂(û^2q?öm-ÂU6É+mkYâRãGdÏ#¯õ.«È•˘	‰+ÆÙπÏW°‚ß¥∞≈ªÕNè€
©ªª4„{‹ÆU∂…DëFYç’ánXiF?HÉ'ÌäØ~¯b{fvˇi†Õ£Qê¬m†Ãjåáï…¯5"∑ÿwY}A©PPÀ†©{t∏Éı¨ï$VT*œÉü$^íè˚·K≥µí"ñ≈Õ¸Q;M@v∑Œır4a_`©Kÿ≥„uæı|o„nŸ®‹ÄNŸù^ôwÀ±
ˇ¯√≥RgvY>Ó,≈j{õ*O uª8g
?ÁÃwGqŒ|˜‚úπ8g"]|Sœô—'kŒ~)¢Zˆ@˘œ=PNVæ £˜+˘∫ö…”bCÖ›∫¥B7%©WË§5|sç∞π∆pÕâT8È^1cC7›H4›E”<ÔH‡6yJÒlOSø+Â »Ü$45—Ëk—¨0˚hV“Ÿ˘hÊº%pÜüRÏpJﬁ÷Y∂_õ’ä±U⁄!Ì6V^ëVéÊr"™˘§V®Pqöh	É7ä‚É) kàaù»6,:db	ï0ƒ-ö47_?òí'Ÿ{ê·â…ÂéD-g4Ü]é;∫	îg4]|£Ó¥i±aÿ9¯¶„m¡1ˆèˇ˙:üÒ‚∏∑MÙõ1q>·∫…¿Ö‹≠Àu Ω“∑£ÓÅû_™…z∂íS∫ÆÃgæ»Ûäm-]Ò|‡¢˜ñb•k—Ôèﬂ`◊≠Ω6≥:–Åœˆ\”$Ö1’&‚≈hΩ	÷≥ö‰yƒ´5øC™e,Aã%Ì<è◊ck∂®Cü⁄ÉR+∂*#∫„ÓQ≈Á&„ÄNªJ“{^†J$o‡öÇÀv/{™`ªm2£Ô√å,_ƒ´≈Kπü∞ˇ=,•‹•’≤@L≤¸>œKŒzmÀv<˛)=¶H·œWe·œ»f·XõŒÀj¬
Ìr£u@GÑ~W 7çfK5Ûù%«≠i˘jX”R“öµ´$Ä◊uúéGIòwË!¢)e)É+~Pâ(≠`ã«"ñ›BµÃ†2$∫ílAìµæmåˆ∞ò)uã0eà›jáÆï˙Ç≈π2’œ…Ó¶S∆(ÌñNŒ˛ô∂∂_ñ∑lkız„∆rôº˝¢dœ@y˚„˘Íµ»sÈ¨ıÖœMZüvÒ"o}eÈ∆·÷7XPd(,_Ù™(_Tú∑ΩTLçE8}/›Ac-ZÁ{ÉÆß}¢∑¢Œ0úTø
…˜˝@ˇ¿áLC—…Ròv‰eñ≠:&ö:MZdo˜aE÷mêX-@SÛ≠∑‰∆ºıV∞3ûÚ˝{ﬂ ~Åoﬂ[o≠ÿ}†ÿ¿'ﬁÍ˜ê(ºı÷U™™Î…óæ˜≠o—é≤U(†ây ‰9øMÅÛ∞Ø¿x
∏…ˆ˙;6ñÊÌwπóPøWU}yÎMj∂:Ÿ◊±âΩj0hˆ⁄Ë∏ß"øZ[≤ZÒ Vyáª1W«DÛ˜òác„µ•~◊zßüà|çøÑíÂ˝ùn\JK}ÃÃ|¡ø:¶‘dm	3.·Y£HægjΩábœÜËÃÌ}ZâoäöÅ’z∆õ;pÍöFﬁ$Wı=.X™A´51´cBùûß>!ùÚéSA®ÂÏwSÅ®Â:Ωı›∆p^îÇèﬂ.íçªºbû„N6m´∑ÉŸ‰>⁄&’∞	±≥P»éø©p*≈[¨&MSã∆KÈL∞ô˘Bù®~ÒEMI>+˚’¸å…~ïô¨¶∏¯◊‡ıØ¿"Å”{!ıÇ≠ =F4ã7ñ…±ÎıH‡m}:YS'VµEƒ≤≈“ù$b€b)Ô+—µP*!YFº†bg˘f¬ööb…
àW-€\@ŒúN§©NpÇM¿Á>ˇèü˜#¯{üË≈dØ›+:‡3BZ)ZØÏYz2}%è·QˆìyÇu≤„Ê£H ((éÛ/qÊ =⁄éÎÍfÒ±ÓAﬁI&"Ωù^ﬂÌŸ¢ø`èƒ´Æ Í®rT)
.h âS–f—rÙ{b¯’Ò·˚h
ÀveÀ*«’º©Ã‡ª±„VÃk"/ ì˙îÀ%A çœv‘„ÒÍûˇ=‚O†]¡/ô àä˘èSKö±|!ˆï5'˜&e†pÃ">øqıÃÿPdÿôJÓYŒÚ{—Æã'ôLÓóSÁlL◊b∫2¶RKßú‘ÃHæ(ûWLpâ¿¨¬ÈÎmË¿U8Œ–"ò√-Çö¯†%3êù¸nK©PáB©bcd™RLoƒu<A‡Î!Ë æp“Ê3ë¡Ï§B
π¡•‡ÅV ÂÂ4J†≥mgÍ:∑QQ§ø(Íâ¸q/ù“qA? ÃıfOh°©M÷3¸ˆæqxÇËÆ™Ü‰ú‰s¿®åoÃ‰qq#Î#`YQ˘r∆ôVU48Î:k®Ωã˘ç5pí∂ïŸ∂≤º˙É∆Ê€∏ym}ï≠ﬁ‹‹æ}sc£Q™8rì⁄ÿÊÄíøæÜ©Y1ö∞¸ÃÍÌ;k2.	ñãUo]ø5~í∆ñ[òu∂x¿,˜zS◊}ø7é¿õ"?Ã)E^oÍËbŒÅ±%OipπÚÃÏ[»y‚¬ºıÆÃ[o)KÛ÷[¥6‹ÇíıH¯CyÓÙc√MeUìvﬁÿmƒ@œå/©hMîKÈ∂røéhŒøò–’∆àÒZ9å@®4º&*ˆ˜L_’ÿã‡˚áñπ_CWàÓ§twüåê◊I4‘t»Õ"0«xc„πZ„^K¬æ„Ú/Í∏Ÿwz·è»<∂E1Ú0Q˘jmI^≠ﬁç¿J Æ"ç·”ñk∂~∆ô¢üuåÉÖô˘˘X^ë@Ê+ÛNLû¢W%˚$^Õ{≈‘{%∫Ö—Ò	Q‡g∞aı0nıû≤µ·⁄›ïlΩ»*∂/4)Ô){Q[€6ñå	@¿kh"˛ãæ7–8˜Gì;ÌÈåñôÀÖŒ@ÛdU-òâåﬂí-•]œö5é2M\ - Ò&Œ'û”≠ﬁ¶à€É™o¯í‚ï¥>ÔçÃ§•ÅeÕZÚ…œÖqÎL∑í≈pø/Ã\—ó0sÕTñ^µ˝ÔΩ1∏YäDò(ØAGø FpFcò$ÔëhZaPF—æ`mTŒfÿf¶àF/Y¢≥`ÕJe« €≤íÔéƒ‚°°r©O≤5ÀÎŸ∆!TÈäx7oöˆ¿™óp!ÒÅ¯A\(èáËFg˛)dvÛFVœ÷áfπ‘ëkéh…8ˇ<äi©¨∑∆@äyÛ`ZíE◊YóòÚdê©E¡¶X˘1¨å(FíôIváòW¶=≤ûÎÙL◊∑Ã¡’∞C‚	g©%¢îåFÜR©r¬w(ZçJu[Ö1+#[ƒÅhºó%≠ID8ÂòÁyÈ&BÌâƒEŸó;Åv‚ÂO ıå*IQÕ¿Õ0˜äœÜ°…:~ΩÖ∆¢EÏ{˜‚‘UeÕÈë¸…7$©H9ïÂL*i»Ç ı4¯ïT5ã$%òßHIYR¸L≥»gîœòùdÀ?1õØK⁄lÕ’À‚2TΩô‰5NÉ≥à√}Ü.ºu2Ë&4x#d‘Âv¿ı•Ò&ó†ß˙Ë`ZîÇâ>2÷[Ééè˜Úyπ“π∂≤±º÷`À?æygõm7n‹⁄Xﬁnî1èÓÿFÀº∞åF-£+∏(l€ÏÙP«ﬁ—ñUØoﬂÿ`Ø≤«ÒÅ∑2zl˛Dç£âfx‹f6IªÑœPE"EËàTË},¢4Wi˝æPcU«l„–È˚ﬁ$Õ~l¸[ﬂSÆéâ"…p-Æ≈JƒÖ6Pø‚Ê“ ‚O÷∞Ë#ÍmU|®nWÄ0 ®≈Jgß&vnﬂ§¢æºíK¥HÌç;ÑeÉ†öí
}√U—H-pD?∏+ô	bHr%£ÜefµUxaiã¯ˆÏJö¯Ln’S|`ìFWåÓûmP!SÈKò˜R^5“d⁄á‘
ùW2R:|◊q1Í∫*ﬂ ©G≤@`ŒÍ¥ñééË≠⁄RDºa««Ÿ,µ+M dıÂ¿„ö^•ª˘-Ô
ÌºΩjvíMê©∞ª@Íf€l>ÿq*“0#uçÆ÷ËπJÿsòëòÓõ- ÷;#…EÍ¯“”z|p^Ï\|Ô£˚I”!PK¸Émàı“>P§≤¶…Ë9rañ<ìfIæIx∫_X"£#NÚ.í±WóGt±£cÙó"Ù	ø©„îCÒ8%G°;¬Q¥—‚Ó≈"——Áb·(39—JJ#p+>¡¡1]£ùàúo#ûK:®å>ç#ƒ° S8¬]Bt6⁄ZŒèx–If{ÙÉ&Ä1‚vÉ∂›h886ŒEÇE~·D{a‰¥∫ kN´{. ù\oºÂQ√áÔË!ö…»`ÌÜ⁄…¯√9“‚πCHZÙ£ —QÂòl§9çØpÎ∏rÃ∑È$®Nt,¯Â›ÙqÖr±2*˘¯i1>,)rÛ!°ÿùˆÄŸ=Âï<Å∆e\PtÇ¢≤†ƒ©/ï
R≠?‚:°£P‹ÿ¢Pñ°±ªwr€v2@1’Œ!Ç°Óe‰á¡‡D;ìÁ„
†≥«F◊T∏=äÎ§M⁄œß•– U´’ÿçÂÕÂkvˇTØﬁŸÿ¯1ªzgsu{˝ÊÊÚ[kl≠_€ß'”¨SG“ú±’ﬂ	lS£ãÓÅh‡»¥PeYß.≈ÙOQkœk∏≤©ÀëitªŒe’ıÓÆ√SÛfZŸ‚CBœÿﬂ≤LãÔ‘\4ﬂtÄ¡<˛NÕ7;ôªW>W%wq+ZP2∞Úˇ  ˇˇÏ}{s«ëÁˇ˜)J∞CxÅ¡É%aIÍ@ îpKÄ~É'6fò6g¶gªg¡4"d_ÿ‹á◊±Îìg˚é´3EÀ2M+x≤qAE‹'QÏ'G∏ Ã™ÓÍû™ÍÍûPË?HÃL?™Îëôï˘À_ßÖù¿∏uv(t&¸x(Ó®dÎn%B4À6˚7â⁄6Î¿√™à<¢©æØ)$˜!R6¸Â´«ˇ7!Í¯ÍÒó_=~üøy¸é¡w¢DïõÉoÒÀ¯ëˇÙƒÍ>WÛAÉ≠˛;kdWpjv¿ItPƒë}~∂u÷ÚkôaBÀ\X≤0◊+V7(vÔ¶GX~»Mﬁ«œ’Æ»Ù?ÛüÄ>„ÒótÚßtÂ4ˇÙKÏ˝/ÈäÙ'˙Â…WèÇ\*pÌs˘«ó4¿∞¡ˇ˙ï8x÷<Öü¯@∂ÊS¶—è%9«ß…ot˙G¸3É˚P=AxÅGôÊ|ı—£ÇN·OlQÃk6IP+¡y˜|&úÑçßôœObAå$Ü"[D±EpæÍ ëq?7ºv{~ëMtœﬂé¡{.¬ k·SkPü¥PõuÅ]hÕ)1„∏îR≈Mny+%I≤EJsAı§Ï•eÇÍÌÁr®>≈˘ìÄèŸü√ohòq=n@ÔÛ-x–ıçd[ì6O}^vÔFAì¡?P7Ê/ﬁﬁ]R>.†Ñ;'Ñ^>hõ=_ÉnŸw˙lìK¡%¡o
>òOó° Ï
¯yÕ4˘&ÛÚ∆Õ¿˚œ(ïc4UÁáciùŸÁQÕaUJ‚˘€¨∑=sròÏb¨@Â‹∆º’Üö´uo¿ıˆ ^	¢ÜåæóQPREÑ˝Ó˚TÂ4Àz”.ñ‡–ó]M•Û'r	%Gè±.‰.$úbäVõéâÁ}›÷åÓ(‘ìäl-Ût{L≥∏RÖ]É%ÓÁTEßtú¥Í5Ñ¬æ≈U¯up¡Tc∫‘≠9tQØY+wÕf{∞[ÍÇ“ó%õ&Æ*€∏V∏∑ﬁΩ¬u®é-ÿr!\BµlÚƒƒ∂ßQR˜§'™]XX∆†ûu‡µ»obÂ/•f|el∂w≈ØiÃ>c!Æ Aëœq}.5@ßiípíµÆçV$˝ŒØJËﬁf˝ìM¯E‡3í6^∑·∑ãMuºØC	Kçó≤/"êÄÀÆTÅó8[z§∏KäSÈ±¡`µ*íœ∞πÿ˛πÖÔê}ª∑EÙF"Pø«&XINGÎ†<	?a?±ú2-æ<¸Ë¬Ú˘ì_ùaqÒd∑˜Dn&˙Èπœ¯êﬁˇ˛ÿ>µÔyÌÅ·~/ªˆïÕuA re‡K|è*≥˝:∑ w˝~o\P»H‘=≤√%fg!1ˆ“:Å;acßïˇ‰¢oÔä_¬A´iu√Æü€k¶SÊu>el›oY≥.ÀBÑ’ƒ,zï-Û›“LÃıÃ	\#pÅ|*Ω
_Íñâ#æuÇÆ\´DÄÅ€ß≤T0‚rÛ≠Ï¸Áüömy-˝ˆu_ÑÅI?Ànﬁÿ`^; UÛ(ˆ4m°åä˙
Ëü°˛%y>G)≠ ÍêòïXY?B9Ó'‡Ã£%Ω$:l#ËﬁÂ=ÿo—írPˆzw»√˛∑v∏'6ñ81∫‡Ái3®∂4&.‚
Ç%,ñ–Ãn≤Ñ\6&≈k?7∆ Úc”•Î’ÎºÌ8l¯‹áY¡J?Ï…“nYO£
7„s‚‚¨S:»®R*'ß¥˝[TJQR0Käloìé∆˝NV6’˚·Ãä≤©Íëèç≠Õﬁ˙ØﬁÃÁfﬁòπ=ª;ï5KjƒX{ÊÎE„îe8§©ÜÅ◊sâøèÜ€>.v∑¸Ëua&Y°‘ï/#s~;Ú”ùëﬁßæ‚Ü⁄áU‡&'ù]êÖ¢%YbÖ§p¸Ç”É&˚-DıŒÄÁx¶—∫[xëÇã•ëÏò+/êtœù,Òà2Û_x÷X&¢znNNxHjW‚fsáÊô4FVjãZ‰ƒ#ŸÍw⁄ó√H◊”Z›	çŒÄ⁄Õì/3ˆ€~£èKµ∞ä≥NèÍ"ˆ>√Ø)¬Ö F	í»pÖ]Ú"Kà_›A5¨gãÅRX3”nòd‘ìΩ_ò[x*~?ñ·¢OYEÃv	¯Ïdñó[“Ω*\õù†{abæÑjKWUóoÍ˘∫äMÃ€·P$zæä"Æ¶˘C¥«’ºà¨π»»V£∞T’«yÁJ¶ˆC≈‘~HAŸt£Jo„∂;%!fÔ}’√[WÛóákvÜT”ÎÓÀ„¯RùB™÷@9Ag˝@Î¬©µeºÄ‰˝ÉK7-ı‰†k{ˆ«¯»ø‚„á±.Æ•f»On·õúg£≠R·Ä¡v	ÚnèÎJUa"°ÉgX˝≤ÚEÀzf°ï^‰{ˆUÖ{ÒÖ˚ã•<≥øLÏ2Uû‡˘\Ü+üÀ)ÛâÄË 1ïÏˇM±ƒzΩÓÏ¢JP’ÑNø:V™éﬂù,∂m(–U?é…Å˚í≠+´/7YZeΩπá∂∂∂∏°I¨T”GE%±ñ˘MiœÓP¯ˆt—h¥€ù†œñâŒË∆Ìã¶wê`»øæÈ›√öá∂>◊Ù¯>¬ΩÃ…ﬂgÁœú1%Á˜ΩŸqs@≈¿oq/gÅ:Y@oO_çØgáüz˜*@{Ä=Â`=&Pè ÛπêI¬º˙ÎWè?≤¡W£Ö¬kJA{>ëaT“∆ü?˚:}Å.pF¯ÿ¶g1∆÷¥∑/DXÜ7êíÄ@xXª Ä)çèØƒ{Ì%‚ew‚áÅ√€J	p4é¬D„ªÚtfAäV√Eıﬂ»Ût´¸¯)ÀÓ†ÖÒ·Èt”∆%UÑL≥Çv≥>1E-äâf¬˙®ª’ÇŒﬂ
˚^{â›Ø…,(&¸fΩÅØIã„G?b∑nO’€~w∑ﬂ:¿WØ≈∂ı^º¢ÀÒi‰È0e§[q∆q˜~~∫	≠òÿ•Úv|â∑ΩûÏL7‘S2Âœä¥!ãsπaVñW∞‘1≠¿¢ã“≈^¶íÜgíY ^∆òﬁ∂÷°!fıa]\2ÑÑ†H7Dÿ`µò®¢\ZE›!ô„}Âÿ¬üJ˚°5GWlÍ>‹¶˝T$<@+>‚≠ û∏‡Fx:ŒÙÏthDë€ƒIƒÍNœ◊ì9ÂŒ(^DÊ•æ_Î|œÏ3Òáq≈¡WâÖΩ1FòCº£<≠…∏lÿ‰BÓ¬˝≥πQy]ù÷LBd6#.ègÏj»Ëu)CÖQ-Ì&€Á{∞"≈FŒæH~ÆÖq?~Œˇ˙BI∞˙Ú´èπÙâë¢,wVaOÅπZxß‚—ÔxΩZ˙g	}«∞s-æ-…Èª˛>mëÎA33º…&I ÓŸs -üa≥]Æ°zéc	™D≈m‚≤mÊÂ§ÄDËxÔŒÏÕ‹ZÒ3ß€iÕBBMnˆ£A∑·ıãÉõ ÁeˆtüÄí|”èEÆ	•ÌEÏó÷5•A&^ÄÊç2,M‘Yö[ tB2eÓ@õ°‚LíÙ(ù¶†≥≥Ï¸j÷ã|®¬ ø®πóÿ6Z#!kÖ3‚©4˘¸πQ_ÍAaäUnÖoÛª’ ˙Í1DÆWÓìÇç(D÷ÓÅœÔÎÚó]Iø©Mä>ˇ:ÔnGNN≥˚¬'Ê-bZJ∂ü±Ω†À∑Ñıf¿gÔCz¢“ûí7<òfÖLÇπK\ó∏:/L {.›¢h∂zd“ßaÁ¢‰7 ^iQÅz§´ÔÃúíÏ Œ”àﬁ2ÿıp_Å|ÆΩÀÔ›ı⁄àIÃÏ[¡≠∂ˇ:d9(7t»K»ûÔ,Ì‹Ù2Œ⁄
-gA∏À>,ÑpedV[+⁄±+Ñ(M JÏÆWvº6ﬂ>πX|I´—äπBÔEÓ>˘Ì|–EˇÙ6“
êŒx=óèª8îék¶	‡˝4Oâ∫∫=?nKµ∑tDûêﬂ»dõuB ãr]RR√Ü	∏;qwoKbt$ÃÒ,•LÇíÑõçö‹∫ƒ§HòB≥vG¡∏˚y≤án–üâåz∏˝9¯€A≥ÈwKåwπ—.…õÇsP®s…kÓ⁄s∞2œ8π$*K@G(D9±dò9&ã5?ó|ø´8ò‡”ksy˙˛0ÑÀPÎ[ºâ{ K€6óÂêuzAw∑î
µπ5pôJ¶§^néö¨ ¶,9æÙix|ì"cﬂ≤†&ËD…√%;Õû¥ìyJÅTnª±m\e(™G»‡j»mô†1rL’Èí¸ïMjGãØÀljùíÂ’#∑#•P6d∆#Æ ~B«ç„H“!∂$H|0“ñD–¢'[åLEv¢7µw_ÿnÑøÚôjâ÷ ]JnA∆6Ï´~€Ô#Ü°&<nUÜùÓ2ñÅâıö|%À˛≈è˙V‰≈≠Ö£ˆCÿy∫¯ÑπT/¬8Ãö°Ú⁄S“Ç˙ä!?o˚Ì∑dV÷f+ê$Éıè1Ô∂`Æ7sñ©Q¬|˝%Rô‡¿gy∆9ÈƒµÇ“ÎŸå 2A ≤?fÜæ§]®Ôˇˆﬂ>L¯>5¶∆œê Ä"{üebƒRˆª$’?¡J@Ü
ÓC¸;	ã]ÇR∑◊#∞Ræ`tO“j∂ç:?hÎúÛLª√]TÄk"'Z0”‚$û-Ë?ﬂ.ûè˚Qÿ›’…è±/™˚gÏπø&ºzõ$sé”ó®£nôÓx≥6˘Ñ£˛ö“ÙÌàePÃ⁄∏<CS(∫¸c9PèU8(˝·=Bw>¡M	$~"CûO0òıú.Ãqƒ¡†ΩÁÌ«l'hî†ﬂíËÒWº+Ítsa‡2º◊  òTæ0b{at7f€æ7‡¶ﬂƒÏ◊%å6üÀÒ†H‹O¥j©£ÜÜh»?t jê€e"ü56¡¿ﬂC„è£NaÙèô§˜˚5vˇƒá@ÃÙe>§8\c>€'¯^+—G¡ÛGÉÕØcÜK†8ö¶gI¯¯&2f|˘FôÂü@+ü(U	ë¸IT´HI˙∆2Ñîˇq≤å4H	6å˚›ÏÄÂÂ∂w·:“‹(B|&{ê`ô~ÅÚ'Rb˛û7ãdŸ}A}ûY£ÔËFé?ó7|@ì„∑ÿåqÆ>Gú6Ó3Võô≤Ø ‹sÂXC«ƒ¨3Ä⁄q>ÂÈœ†ﬁÒ⁄=n>∏F·√\‚1É"±¨…ç"JÎ≈}>§,‹!’≥¶Ò{>Œù†1ÔC-ÂA<≥0∑pn a¥œœ,òoÜ^ÌØ∆+–Ùn^_[[yªo‹Û˝FÀL¡3í€ÌdN‡˙ö_á!W˚´˛é7h˜MQ<®{zYâﬁoÖõ~ƒÌkììdÁâæ?ê{2!gI ≤0}Es˝È≈‰˝=Êtqb êH˙=]¯9RT>ì˙I"ÿr\ë ÚÖ¬n˙[˛Ô+”¶7∆·éÉÅÙ*[écÆ÷Ωnü)_”¿âãEâô(—äÍbÆ1ˆÿ+˙ΩÖ°ﬂΩfsy¿˜ä·nmÇÏSÄ1Ûª+œMgió§∑]¯q]_ÙÏ‡@g‚åï≥πê…Û›ˆRû ‡\ÚNÂı7ÈıKv&»`Ä˝™0`nqannˆçπ¡¡&4 AÅG£{…·Ñ%SÙy4nX^◊¬ˇùXÜΩ∆SÕ:ä3Ò3>{\|ÑÜå°™¬Aêåce÷OòMø∏·∏hﬂ`£ë.	óZùÊ–r∞Õ©CÀÍü∏®ÙèZwgjÏπ¯N4"JEí’IÃ¡ﬁ]?ÇF^ÍB<qr≤ OKü(•Íπ®GÑ°›/∂◊Î®Mßãœ§/±˚ÚÒ”,ÛK,óS]¯>ï»m^4G◊h< G9˜”
∫«wÚØΩìÌ§M˛1L<√W˝8ÿÌR^Í±ÚÕ¥ë'W»g^‚ÑÕÛóZ»gñ¿±ïı Ù9π≤>Û'lº YõÇ$ÖµpKV4ÌØ¯q¨##qõÓnt	í0·l—XYf{C}ú‘ôûº¿	õÂV•;√Àπ" iÄ#_'W¯'/p“ñƒëN˚ú;sΩìÛfØzMˆ*ÊË⁄!m¶e≥ê]6C4¨©≤â≈£,*ÜH#Òè≥Ô∑ÊŒ;ÏÆ∑¬~ËJ©‚¡?‡ccqg	ˇé <ôw⁄=o∫õ∑fÊ¿:ó¡á+pê$?æÖhm∑¢†{wfËK^ÊBZÏüVî¥íŒƒætD:ü:ª,ézÒîªÁÛ⁄˝J¸d"€S∏B≈B∑!ŒG
ªªÄ¢\ë∫Áo∆~î}ÓÎ¸°Øó‰´¿G…'¿’∞òœºtÖR∏Ë¶µãœ^\^Hª∫¿!óC6π@Ö"çu.Ô◊⁄XØÒ“˛z≥6ŸÍÃÙ`™P≈‡…©7ÎDî:¬
UñêÙÛVÆ§3ãûñ+	•~&ÿ%‡S9•LB∫tú#XO®=úP9bî!ÎÑ#¸¸´«”â[£ qB}ó%:	¢¬z_…ìKaZÀœ·°Yl1û€»l˙‰ﬁsâMLp£«¡™ëáy≤cï‚L})¯"IL¬OÁ≤@Xß…^iªCcÕ®≥«»ôç#úï7¸NËúÖPfF:tæ#ä÷Õá‚r8;C)x–Q|
±f…o@ñ!7ù¯È∞Ï/Úkëv˜,≥—®≤VÜ6éÎ∆º#¿•3⁄û@Â)lãÉ}Qv
Ìm' =T%»*Zó´ºF√ÔqÛÁÿÏ∑\.QZ∑.M7> bÄ.`“Èü„7Î∑Ênª•”;¨◊L9≥–s#¬ Ò¿e~É¯Ö;›†vQ›^`5cï‰CÄ÷„u‚ıﬂ¨G~<h˜›ﬂÛR-qì‘=PÍ¢Dî∫äÂF…´á≈ã“â¢Å∆<ÓCôãR7/ì√eò;ÈÉÎçJŒ@¯o9ÜÅÁjÑ÷Ç€\‰¿SQ\_≤Xˇáêú

X4¸äÈÜ:ﬁ)Ìÿa–$aIu ⁄x´Löm*ù¢”Tü=Ô©~ùùåç˛ÊÀÄSzëìÊ…È`ÜïplQπtrÉYC/r¬ñ¬	EÆ—|?†5ò!´/pmËENÿTY•˛…¿≠Âfœ…ñ¯´ß¯5”ß¯µ¸¨_9È∂ÃKú∞Ÿ~äc;Æ86eVùle∞rägsƒ≥i=[/≤mDˇ†
v”ˆ◊)ÏmTÿ,⁄∑˙¶πØÄøÅ°ŒN1pŸìN1p)Œ;¡eéØ#N'ñ^V úÊ]O¡pß`∏cÜ”≠…à”ÆôSP\Ê(äÛNQq⁄„˜uD≈ÈeÃ)2Óg¯ŸÅ+Qˇõ(ãF;F∫¬	ùVÇ™ô%∂1
∞LÒ<§ªëºA'IÓ\
ü/hÏ?cøî/en¨Ñ°0Êpc•äê/ÛnuÉìŸ«Û≥@5YéÚÌıÕ≠k7æ_éÒ≤ƒ˝0⁄?ˆîó∞¸óí)ıÛCÂ£‹l¥¬∞Õﬁ¶æ9Œ…ò)ÜÉ<†•(%œV§î4˘{Õ *˜¬¿ ˜}/bk1PŒqÀo:`ã≠V«»∫n"Ü°Óß≤F*ÌEƒC‘Õà¯jö).øy!—m£‡µ+∏√òKr›6˝∏Ωr &ß≈ÁŒÿ¡6≠⁄í£ùT6∂îóeJŸ~r7ä ywÀôE∆©}}ÄK>—;7¸ÔZv≥◊Ù˙~|$6ƒ’k[Î+kåˇÛÌµÂ,ân"ﬁâ•—c¥(L
gL
L
—U{›T,SOƒ¨¯≤Ÿjô0ùu˘:øü™ï8û ∏%ñCG˘«xõü	á§·_Óvy£»`WºË>ñg3ÁúÔä$WkÆ&Z∑ïù-7˜r1°}Ô§rÖZÌY¶¬˙hEì-˝HVz»”Ûgz*!¯ˇD÷Äx"œ}D1‡ë>ë˙ˇ&·ßí(á™`XﬁçèV”ÇÇ	nµE!0Á∑}∂ÌuªbÀ√OÒ˙|BıaŸ≤v¿w\ÂÑ{‡5…â◊ç>ŒÛ≥Ω“¢≠îe7üÃ1OıÇ}∫DE¨˛*Æ˛Ïî›ÇæpTºj∑PÈÍT.I•≠†q◊èåòÒïTnˆ√∫’¶Yızï™.d\≈YU ’ãçÖzóD[™º™ s∫◊Ít8ÛÕëunÌ'úı¢'‹X'ï5ÚöãööΩπe=pL`Ì•O•jz/ØÇl.àDÀˇY-Í3ﬂ6l≠„ÛÒÓ6ˆôßŒöU‹pX\Øf∑ER2»Oö‘«yi]¿atÃf#Œãqe∂Ê\ëjJ¨[òπ»Jø	Ô€œJ íJ,ı“’mﬁZﬁÿXªÒ}∂≤ºµˆViØﬂÆ◊n˚—˛;n°ÏZ›„6÷5&¥Æƒﬁâ•>≥â“)<|=å˙;a;Ÿ
µ=c≥ElFËÌE^Ø «îïÎ¢À“ß÷;^ØV„=8ÕÇÊª(Ã“r◊ﬂøpüüõÒﬂ©h>5H¨nö+$mãÚœºyıú]‡-Œ¢ñ
WpÎ⁄‰ù≥¨†?wÇ6∑Znﬂ`Øy [_rQòCœZ ¥Ã!¶J¿;$#â4Ü∑ô\IKÏõÿÈw
o9;Àß0◊ø Æô∑√äçÇZnP(]/F2/æt|ÆèknCRM c")(àÌ°¨≥ˆiRÏN£	iõı,ªŸ¬_^„eJ´∂MﬁIÃpB¡‹&÷{™®?ÂQ8”l~qÆ‡¥ÇËeﬁPN0W§”Ô^ó∆s*e›ÎÒ⁄#üØˆ˘ÙãmØQç≤:áMv¨Õ«WÆ*	j¥ ê+]oÜ/dÅ[…‚¢íiCy‡XKo≥pÛ«üö–Á'iÅ+‘ÏÒ,ê–%§3IfæU Ùá2õy˝…)@$ºΩuec>äßﬁ§ám R‰~÷ó˝A‘µù´S∑∏∑´çix+ÍÊ5ƒh›(∂m‹,õ¥=D£Ç¯WZƒoX†ÄFQ>%OU•3Å^ªG‰õcU¥œ_Z∫ÓQZÒ–UÀƒUè%2ÇiD≈bÃBÖbQ&YauV+u«•G±ª)≥‡_n6ì.2:Bm⁄cú•B/_ª∂U6‹±Ü¸≈¬«@Ò'\ì:≥zêÀ!*.cg1ŸYGÇ®@∑ƒéxpÿ∏¬kD~ìw.ˇ≥\πŒqÖ¶F#{:îX˘Jÿ€èÇ›Vü"`ãºXËçX⁄,p†˛ø?2(LÃ6˚ø8ﬂ|v%‰V;#¨NqW7‡äò›q&5Îˆî◊Jæ◊\Û 9_O„ËGGGû9Éw$—Û’Ô_]æ≤æ¬6÷7∑ÿ çõ´lmu}Î⁄Æ`n∞ÂçvÈÊ∆∆⁄÷,˛æµ|i”¨rnMr€p09Õ&„v¿ß¸µ„{‹Üˆc¯ªÚ^Ô˚>¸›˜cæª\Æ·|Ú¸e«˚G¯OX∑'7Hc˙%Óø√'œ›òÓ‡5Z~Ûo‚>|AÂ^‡CD_¨:¯˛oKàm∑√›wzaÃøø]∫ç6?)Æe5Â*E≥ëH?<Û€˛æ‚ RılÚ¢\Ê‰ß•‹Ÿ:iûﬁºg∞·QeX„^wÍñh¡m6∑¥{	ÕW·◊’ßÒ2a·idtöÑ|’ä—∫{‚¶8G3ôı/¶Té≥\¢BYèYû7o}˛päÇ‚∫bw1>ºÉ^œè^ÏÉÉøqRÔ˜¯H@∫(dõ8*vÓF|¢AëHÊ ¯ ¬pßÓuà…ñœz3h∞=;9Q¥OÍ∆`øhM!∏<œÃ©∂XébíôóÙW:ÛõS\Õ(µÒ≈∏0	ôäo±ˆŸ˝dÖ’€~w∑ﬂ:`∏¯ÍjÙÉ{∂Ωdëo˙ËÈ4ïóA?¨ã%ËÊ_b›Äh
‹˝I”»ÂœoQöy∑?È<Mvæ
GfZ`™MMQ° ˘◊qU6⁄ZóƒÒ¸Ã4.ﬁ◊‰Ù|7û∏àÎî}¬$ÏÔÿºCB<Œ9C∑lvn…¿ySmIúFS•RúJ&7ëÓYbî£ÑdX•ßèè˘lƒ ãòôSN∑wN“Ï…ˇ∫h"˝g	g\2ÂRÁW“ñ{˘¯⁄Ëi»NT[ë∑ e≠(ó;¶s≈‡Y3√ieW$‹W[v§ãY5é™Ï‘d ˙…≈SQ°Y]ñb*¬›¨”ƒ.óJùÏoqïıÉ~€/F†©G≈’¨ã?ª?uM–ó¸™êû©ìa®âÛÏB*¿¯ﬁ ˜ËÒ4˝ºÑØ¿∑	±õt+!ﬂú‰ënØœÖQ±/Êq»ÙıÇÇX(d^S†Wíw›
ısh¥ìrë/«\Jîbm-:B1QåTèS1QUL¨ùäâS11,&V´‰ç)çí»‚“ã÷NMáGè∂ˆ©õè¡“'Ä˘¬©úx	‰Dìb$Aqj$8<ztAq,lÑSAq¢≈•Âïoøu„⁄Õ´´l˝ Ú[kedÑŒq;Ñ?Sî¬iªekf~!añ•	1?î(õNez‰)g«@)Kápô#›úw¨xµÑA6ΩÅ â%«Úu.oú±t∏≈ävæ’∑s6ãºãjΩ6W¬X— W∂B'zA<’˘ÃRªc8 …—4/‹øÉ2|.ú˘fWπ„N|UÅ\ééJstTVΩp ’ZÜebÍŸonÕ›.«ºfe±sÊ∞Àﬁkdf::2¸t‹bÄò}ÈNÉc|Vá<*ÕaSF≥BpÆ.•úiYÜ∏rÜâ<J—ø·ïÜ±2¡õx®Ûπévîì•AG9 ﬂj§øŒ÷πWñ«3≠o™˙ìêY™ıΩÙZ÷P
6%¢ŒºΩµk˜πe!ï5˝Í:1J˝ñ–∑ÆºøÕ‡0bAòçΩæ•îÉõ≈<íΩ}h7AÀ0P‰öU∆†)Îœ—,ı¯üë˙yù!ˆ:°1Å‘Ü?!ˆ˙©ÎçU/¡vøPŒ£8íΩ2∫≥`ºäªÇ QY'}^¡kPJ-;kºËpT”Æ≤D©
˛√£ïRòÂ∏‹Îµ˜Ÿ’poyTŒqy*è∆!è*y1OÂQrîëGéßùLO&â¨ç†{ó’†ƒ,€lv˘ÄáÁL≈∞ËÚöù é˘Ü$ñJ1Qbzç˛4#÷Í˜{Ò“Ï¨ˇÆ◊Èµ˝z#Ïî«oıÜùsö)zÙ»r˙˘ƒféô<S ¸•
ÖjFø˚<¡˚ÀM?ÇÑ“´ò¿•ﬂµ≥K◊t£‘WÀ´t/L8˚RTFS∂îçñ∑Œìe◊Û¢ÿ_ÔˆkY!8EØu±Ùp‘N≠º”]gëËÍ{˝A\NV≈~€o∏
+Uîƒ¯0Jå∫î6	Î2ˇÎé◊é!÷´úµƒ&≈üß;Eß«è&?h0Nà¡¨rgÕJÁXSH 2Z94Î'..„ˇ¨&
’ÊÏ/âvÉÔ≥Ë™äëÎl‚‚∫¯D<ŸÕruW{‚˘Yí„ﬂ9è|R·)6á≤)©≈©ñΩ>P÷ÁÇ0I4ŒûXÌ•tèLñLu,êw≈‚éÑ._YÔ –s.ï_ÊÑ|›ç∫˛°|.8	˛†πƒxª˝z7‹´M’˚·&‘kS.B7I3öÃ—Tœ˝3d–yÄàÇpájíä¬„∑O'ùü˛ªI†ïΩ$2Yún ·ŒìXïóJ<N*¢ˇæ˙√ø$5’á´ß?ß‡Ωﬁ'xÌ/∞ÿ:d˙Ëës#%Æ"Êø€€m ÃÌ˘Mo7‹›G~¨ÜáÄø{/‡”
„‡N˜ âIßìï ’˝RéŸ#A&˘ç~G/-
|ï∏7æÁÜÔE]v%å|◊K…ü1ÈmsMÂtç∞¯3ÎGd‡CÓ¥À-§“óñV·%8¡p·≤KX9“∫F¿ÃO'Î˛ˆË≠?(≈;°“yà|¬fô–>#¨(ÀŸùÎ3°h;Zl;&É?∞b—ÒU|ΩÕw ˙úh$â√ëµi¿éqÙj“ã˜ªG|Z?⁄w÷à¿<Ñ5M'>∫`È‰•uèoªÕZJÙ_6Ø]≠få["µÑÊlw«vE~‹„ÄÇıˆºÄ7‘Ô7Z5æUZÓ7£vmr÷Î≥íg⁄It¸~+‰™xÚ˙µÕ-7Y6˜óí7-^Ù•^¿uÚı‰˚÷á]óﬁ¥¶∏«´Øäªeˆ¿ÇÚŒ»î=fgŸFÿ‡˚1®XhæIL:=üUˆh√•õteù€j0⁄|> _⁄;íπËù&Ô¬·Ÿ°“$πmÓ‹^g5à{ü3\ÒwÍ§åÄƒ∂J≈pA|äœ Eì"Ø€oõ#’c/ËraUoäÁ≠¡}k∞òË/ŸÚ˘Ô∂◊Iß’Ä¶/ ˛Mœ+Òn-_j¬brS„#¢3µQg'DßO≤Öîú˘˘.~Ba? Û/ÚnÜ—ﬂˆbˇ&éÊÉì∆eÊ∫ıœü—∂z∂TÓuü!'BX|q⁄Ω~Ùﬂ{-äBn.LpKH,…zá∑ÊﬂTL\ˆÇ6uR‡∆ŸöpôÛEûå‡‰ÂSΩÊGëÀz∂˝∫-ØM^˚z¶m¯ı_™pª‚÷Ò≈vŸk∑∑Aµ£$(º‚(Â≈(À≥Ëﬁ„\õœpªF[£gX¿¶Ê”dõ@sÙg∏/˙êU≠4˜¥&ÛÀQºç@{ﬂa1ÕΩ!éfMßLÇÜ>;77>*˙\’Ù´e(x≤|O
Ècéä€òäˇNkxjP≈¶:’ç”Úe¶≈ÖHZÖWìG:v(¬1YæÂG=”≠NÕô8ÊIì#Û…ª«•*T√[áœ@ﬂnhÏ}÷Â˝…mæ∑"Ø9`@Wº+î»|œ‡v`≤ì;m∂ø›\i˘çª }Ë[F_;‹eyœãö ı¯ô]ÚöªæÀÂó¬Ó5nw+wÄèæwzâû›m#√gÚÚ+áÀo∆~§^ãüŸ[|)9u·€æıïÀÈ≥√Ö+sR.§œ.zm>”ºHΩV~Âp9f—©≥?Ñ„mÉaóõ∫+∏°uôªPÚ k√lŸﬁÂπxﬂ@,¡•˘ ï´e¬ÂR‡2S.‘fNóbPÂZY(’È‚{∑P˙ ’ÙÖÎÂÒ›}ÂZ˛…ı¬ﬁ Íµ’7¶/ƒÂ∆;‚ìÃè@N≠Ñæ…Ém«V£«ë]3ùJ˛7Âw÷≠~º†Ω7±|≤Õâæ%È6;ü˘^Q>˜ì?∏˙1´l∫ª*”{+ﬂVæ3â»Ùû$"´ﬁ-ëòÈÂW’ﬂ]äLÂ≈≈WïÔI¢5Ω!â÷™w#…öﬁ?Wæâ€Ùn¯π˙›§ Vn(æ™|OÃ œ•?ªﬁ≠Ie∆µXÙÇ„¿ 8FfnŒ5ßπr„fnÓ˚^€Öπœ{ÅÃÕ∑æ17∑ÿX<s€L›ºF>ª,åO¿˜#oƒ	Ø˚·2:_Ò∫‡0 /TöB€R÷hyºùºª>…ıtY+ÿmÕ ¶8Ú ∞…„xWö|˚’ÄIÁ°èéZvæÎù	Zn@ÔÓª¸O[¢ÂâÊÉ∂ªx»ÓÄÀ¡Í`ÇˇËG¨Ñ«∞◊öT÷6`KL˛:ø™∫]˘mK∂Cª´Çm~⁄>4Åe1¿3‹Bi¸Ê€ÜÜiæQ`ˆ1≈bvn	¬jeKXjMêC;ﬂfSx‡3®3 áä®ß˝>÷îÇ<éíú∑©Ì!†'«œRÅ€˜y¬])nÏÂNïªπéßÚ/!Z¶ı∏Ó©˜ÔÄ`ÕâU¶ôkU™)ΩSâI<‰õô=f"ÀÂØ√Và6G…d¢ìwJ±ú‚3%tÃ°Èﬁ£ÓiÛ%h S4T‚~°i5R›.1|h=Qøà§ö|)‘ßï-+—N∆|¥Ô»_%EÁËπ·]a†#Ú√ó!¶®ö∆É¯íù∆Ns«ømﬂ[H	4˚ö#ãÑ∆HOÂ§»˜sÊ{gŸDêN\‹XˇŒª~cÌ;Îkﬂ-0Ø-/Lä9˜≤iD¬⁄oÃ©—nqÌ=⁄ö%jvhõƒÀÃôlS¢†{wfé+«≈®òx ŸKÓÕú3´^Œ°z©ˆ2
ﬂT]ï,≥+ﬂ-À7o¢ ™·èr[ÙÃä˚
∑¨R∞dî;ì˜U‹Z∫^ÈﬁÙiîõÔ¨∏{‚öï6œÎ€ãçùs∑›o_4‹dt	´C„ï≠…”4„ÚóáÁ&áÎnîTΩ√C»-aqÓÃøñ‡Ú‚kÑw&Óvùü˚—\,ª6T^Bã5¶z∏¸Û2@M∏V$.¢û‰›|ût¶ñ*ˆƒ(Áã˚$´I…ZÕ˘ddè¡˛Ê]ﬂÊ7sÏ4Öo°¿DºÛ{Í≥‚SXx°ø:‡2ΩÊ§òéëTR)π£*mF»ÀJ=î¥:\-’∏¶*“gñar±1N=8wÄZ=≈î e˘< ˜áçX¯éëX3«ëÕ7n
…JÙëÈv.≥õ#W‰N⁄ñC^ﬂé¶ ŒN≤»RDëŒ…}Göﬁó:{tÆ†$¡OzÇ_¡ëHÚhmê√îlï™é^¥!◊À?ºv–ﬂgkÕA˝ﬂ#àÆ≤tUß¢ãéqâÆµS—uÃEWuFÑó“±|6¨Te8ÃÊ›œ W∑.dŒ±$’Söw?ñ8hÿ$˛äaŒ„?âÙN<8!ÙS&ÃE8˜∏yBúÛGè™I⁄Úïè‡8¥påA–Ê+"9[™Ë	£	Êú„ø§h6∞FúïáT;	[6öîDKÒ € ÎºÚ/ªòL4ÌAáÌ˝ˇ:‚k¢Ì«1ıÍ¬Ì‘ä|°¬Ìÿëß¬Õtº(≥ÛÏ»-Ú∂æX:ÙwX≤w•Ü¸í¿mCd•¨ÿµ˜ÊbB†N–û≤ÒäßÛµ„Ω;”ÿ"‚¸“˛å7Ëáe˛ŸT$›kTî£AºâTF~S`»¡“¶Q¥°ÍàÀe´ë–AÄ3j¢ª§°£Z=:*¬f“c¸≈{F(ﬂ3%8œ%9] ´!:JWÌ)•íË@üŒ
e/œ"Újß†>\A~ß3¬!=îï[a‹)éû $nxmf~~.≈ÇLVyˆËûY@aìrpE‹d¡5üe*¶¡·.wÈ–«ÒiÓcˇL™›Ò]C˘Ú(W|áé2\â∏≠˚ÃŸN9Ê√VÀÁ"å`'ÀXπ#(‡üôΩ»Î⁄∑äÒ`ì,ù†Ü≈"⁄TÒ±í9AÈ°$˘ππ3.É"Òõ{ìB∂Ò‘¶x°6"Póís¨ä™Gµ*ˆfŒ1 ÇerïÃ0]∞#
ÌéobÀ∂wF¥1 $ÂÜˇÖ;;|÷ÕÃ”ßTã'∆ÇËC.„É>$
ù/øò?Üö]yŸW_eÁÛ©ƒ≤¨^∆TÍG·]Ê÷ô€ d˛⁄Ë{Á«7sGd_ø∞(¨PæûBE§Aπö
e´*d¸¿¯N/¿ˇk+è0ˇısÁÍ$o©sWsÍqïPÂÎ'î≠†êÙº”∏—ëä|AÑSI°ëã˘ eGâ"ŒGQ%·ËÎ$î´îphâ #üdùÔ6C{¸d
täÙü€áù‚%™≥ê–©\`ö·µd∆¸ã¨∂ëjü)´Ò!qwV(≠†íÕUaÖ(”‚	Â˝ˇ¢ÛˇùyîÅDg}éØM%˛ ?W©Ω¿«º:Ãó–hÆ›†¯B;‹E6dõ&ñ«ÍŸ 39:\(‹W)èû√5Ÿír*ø¥ER+F){ ﬂzZYÑ«°ÙÅö«ˇ5®y‡bËåX˚ §í`õnzÅòwœW5ÿV∏ÈG|ä/÷~Ú’„/å4Íü®3\Òg˘wIı‚ï:ë%*ìTWD`KdÎÇ˘Lˆ}§«x•»L>,nÊ[ﬂò˜œùiûπm'g>	´»B“ÃT
fß%d>„∞πó≠A<ì3‰lB.ò–	fiçVm%´:%(dTxä
≠v∑ç†PFAA„w?Km}Äd3Å_»!8
É „”≤òEÒAÓÂF˝*π áÎ[Xì¬∂bEDÄ6˛®±≤j∏ ≈˛ﬂﬁÚ~6í(˚fq‹ÙFÚ?ÚcŸÊL·õ‹†Pæ!„€ŸÑÒ≠(7j˛∂ﬁ∂C»ï]M¨HeÓM\\_]bIo∏QÅπb*ÄÚõj0…K8'K9%o¡4˙∂ø[∞r1/∆Iî|ü–rÈÏ
*–r9zUC˛Nééã¶„¢≤√æôóòı;.uQäΩô•π∆I«Â‡ÖÜÀ-\Ì˜5)¸‚%zˇ⁄ˆ¸FøŒÖOåkJ8ΩÅ4‘qy`¨ú@ïõõìS“>Ère‡Í$
‚å¿\`x≥z?‹˜¸hÖ´Ë⁄T=Ë6⁄É¶◊Äìe
∞î,	†˚˘æ8_‰%8o”]êR©«{åã≤E¢¿rhxΩ†ÔµÉöBQâÑù∏x_·C∆ß,I“' âkôe“UÓLrj·â∫DVÕŸkö≥’õãYpPÆ‰xô`~y“ %æv_Áˆ	≠1^Rm—Q!¢V¨¬»@ È/Md-òf¢À”–ZpkçyG…Êvë%Ó6É	!ù@≈≈¶
PR≈‰‰ˆÃ’∂ÀY˚hÏ:!°äÌ R%-l>Õ{q]óõàåò„EY–¡˘-ª»ÊäK…©@rá[s¿˛Fk^£U´ÒﬂJò¸l¥D…pë4j_‹‚óﬂÊ}¡ˇ+¥ r·ù_J~ÅáIå!ì‡]¶ÿÍn8
ÀÙπÿ‹™™oúp^]pz£¢wæıﬁ⁄µÏ=PY£8jEs@CØ=¶3/ièfj ÕˆÜ™·¶°
™>ä;˛kŸ}éU±ª–ÖY£Xe∂KpÀ‚»)åKåYWç3‹ö IÄ w<óbüHºGB˘Ha–;ÏÄƒù¢%ßyü\ÈWC4‚éı∆„Z/>QqIåi(ÚX%„OöQ9ò™M≈47»ütﬂaIÄ™§ˆ„nÓ∂˝wöí˛cYkHÓ{ø^çË‘‹ÛŒœvº@yÀºwˆ[lyuï]]˚.[ªr}„⁄˜◊÷ÿ,€Z[^y{ÌªrmuyÉ}k6ùR˜ÉòÀú5Æ"¬}ﬂø6Ω6ñ„ÕQ˜êEºÀ'{–Ö,åπ)˜∆‹‹Ï9˛ôOöfˆ`∆EC) ˘!ﬂôÛÉ»œM˘xFq9âoùYÄÌ}Rª£ÕƒÆ≤ﬂ˜`éßqç∞-ì‚ﬂX∏◊∫ùØÈ°Ö¸Èb.πè0ÿçÏmﬂÉ®Ω≠èﬁÃ9pü*˘ë<tòÛ<ÔzN˙B“ñkåtSLË|ÎÃêÂ›∂ñ-Ê4‘v[¶Ã…!z‡º’ˆæîÿO◊CB˚ΩŸ!Dœ˚&“`0Z•“î≥xvÀÁ∂∏i9aŒœ∂Œh;a8%køH®RZL°\^⁄ ë∞/>ó8Gd
ì ßLi:‚ßPHYBõ‘|_QöœgLΩK˘D—øè¿øK“ZAQñ©⁄¸	Í‡OïR·ƒˆ—#„{B≈pr)∑|4wº∆†›ﬂá†JEn®FTUáœÏù÷Òë…=f·ŒN–Äúï¶ﬂ˜Çv\ü–èß&§gêÈf´(gAën≠\¨Ìx|œ¢›Vg4(≈DÔ¶ÀXôNπLt˙<ıäF∂fÌ´ZÌ¥˛^VØBz¯¢÷·nR°zWàπÕF∂1yó]£[·´Ék''ôá2x>OD¬@¶!xµ,ÜAûπ;èá]≈‰V√∏fëwNMk(!ÌÍgπtêù%ÏÒ(¿.ÉéÇ6M¬Ã≤Ìƒ≈oô|?∞≈Î[‰„]ætÂjÄ¡∂dõ9r˘j∫öΩZŸ'ª]Që6ÎøÖ=©˛)√åc´Qù]ÒZ€ÉÌAƒnx≠ég [{%s˚IùáÚ÷7¸ÖùÁ∂	…ü	Í¿#4ó^GM2‰“fÀΩ≠]±z'û+ì~ëîÃ:¸E•_Vü ' vπu˚=X\OÖ™|¸W’™ª]ÇäÕ≤a{ƒÂe]`Åï‚@äaôq	kLÍÆ∫–‡ûÓM∑‘6˝n¿ı˜Üﬂ \û1ÀÛD.4C¿Ï1?)kÜÌü°ô…-…ﬂ°*˙_d,‚*z"Ã@Ùä‡⁄Ï˘`Å?î´hsÄ.∏êbj˘∏◊í∏ÌhÀÈzk?∆Åïñﬂ{xˇk¥¢_µ⁄4‡œÓ≈æîi+Kµ∂÷·õ!pG~øËÖËCcJÆDºf‹Îo:⁄*Ï†ÌXè˛s‹Ëƒuø9®o7øFÎØJÊzÇÎD,ùèÂæ	∏nÆÑ€ﬂ©^E^äΩn*(∞^ãè∏óﬁt¥e37ˇ⁄¸¬Ã˜¯-√◊'“IAÈë‰å¸HÍ¢G0¯PÕéÉ…2≥0T6ÀD&bnbSt‹<øè˝<-Ùömπ‰˚eëzopYÂ3Ô…Õ.*R€≥sZO≤¸± c∂Æ∂Ì©Ê<Ìb5{4)ps9˚ŒÅõ<≠µ6fìz˘›¶ÄS©∂»ç—q]îZ8f«∂c6Pb‰B&&/x≤0¬ú]"£ªΩ˚ﬂ$÷Òg◊ä◊m¯mçà3áì«6z¿Ä¬^—πZÎ˝(Ë‘êZjËwÁÿ~{T€)h>€N@CAú`F™ym?Í◊4}ˇX@-îêïÄf<Å,|ˇ˙9K#]∞zD"° ƒÚz€áÏ¥ùÄO.9r6ÆO¡Y◊ˇ™W|ı»Nâµs+Q:®r«nP¥çWÂıüi0»ü>iLˇ'7†˘˜ƒµa>EÏ∫Ã'˚“ÚI∞l°0!	yg 
mì@7W‚]›‹s8AE¡ﬂOIÔS»TíS—æ>≈Ä˚¡èr¿ „§‰/¥t|>ÖkâºŒø·‰‰‘4;;77ßœÄ-ñ‡Á* ÁFŸV;€UzŒ
ê•Ñå◊YCfDÓ§vƒw÷◊æÀ6∑nÆÆ]›b´k[ÀÎõ:ÕΩ¿ﬂ∫ªõ˝Aì[´Á~)±7gN¡7L˝òNüÜöø∂≈õ≈ªw~.õ:ÆBä+dJMùõ1?’@`Å“ô≥—{§#öä{b€+Å1˘<¡—»=…£Flëq›2åﬂ_è¬p0âUl(HeÇçÄ§ÛÒ]&⁄#@V|Ï∏˙*9Ò	ôp¸rËæ	@oÉ›˘æÊX∏√ÕÏ—…òı|ÆB∫^{öyæî;AcÈîv^‘º.∞ØÚû‚SŸ 2@Éä8C_ó¿}G'Œkêÿyä #ÜVF›TË\ThË‘“A<HU≈[OnçVıÌF^3‡≠üÈá3¶tß¢tvëÒoq ¯ÖW4πã‰∏- ¡bN?∆ù%¸;
˜Üıƒ¢£ûX ı¬Y6§ÆÃú}ä∑)Øñ•~+T/&Á£÷‡ÅÕ%–7çŸ√ÁÉŒ.ã£∆€ı|◊◊7ùÅh•l◊†q"lîw:º€˘˚≥—ß∏Ã2∂pXQŒ/Ää^»)⁄Ÿ≥sÊË}≠ùöçáÚâÇ#¬'PbÕ±¬–Mñ&£á]oFO\¥ı¥ô¯EØÂt;ã~`º–3f ëJé,CÂU1¥:%Œ`ˇÒﬁˇ6X‰üÕ˘{ÆŒñ»Öœ_ö<0MmlﬂÅÂ¶†4Õˇ•€mÚi»Ö∑ÂÜ1ùQJ„¨œ¥2åÕP‰”H~C÷/ïëÈÿAá∆¯o$˚çBBëÂ®» #¸:QÅjÏ#ªˇÏ4-˘®{¯«œµüò;èÿırÄ˘ÚéKÌ0lrÕzñ!ŸÜ≥$,EzÌÔå≈H(x
zÛwdØ·á·^√ØGÔµˇ˛ØÜ^ÉΩˆ3Íú\ï[z4˝x˙·˛µ#
_Lˆà•‚àai°/ä^ŸÊé¢Éjò)ªØÈ”k…»®ƒP∂˚Q¡≤·ï°‹I.	”mÓX(ól/]e†Ãö©\ÑCíjl~â-süΩ n†˚,⁄gAw'tµÕt!∫‘ûŒ€\)ÿ\qRÈìdJ¶IΩf Nã4ˆSR€”ËÜ∞H·äπ¯∑áø˙π‘b∫’˚Kâ%˙eﬁ”$«J”*∂ÑÈÜÓ°¢>#Ôinˇ´*ÑÓDÅk
Î≠ÉJ$c	œa	≈ó˜ﬂw}◊/Z®˛¥í,mù‡ñ—«Ôd‚ÎS&#°O‰W†˛Œ†XÑJ
¢~Kv7¡2ØÜKìº_cIo‚Ωn1Ò∂°	ôÄ⁄ª:ªloÖ-ÛÑåíÍ„¯5ç«*Ó0óä„†utŸF†nøÃ}˛;¯`∑@›¸Ê∆UˇÓ‚”^Ê.Œª
˙õ¢_≤”—¶ùe´~è˛ﬁAG6 â5ÕÃßóq˛êÑ¥ÑAÌ∑É]⁄˝I'G‚yÿœÎ¸¸ŒÀÿÀø∞Y·Q≤›æ*à˙É˛˛Quz7}$ˆªƒ•¸≈^RË‡3píWçÃÔÖ%v}ñ17ÈﬁíûˆSÎ€Õ˙˛◊èˇ„Ω_ˇ˛Hˇ=∂Ÿ‚üPúÑè¯4ì%.≤‡Wî‚˝gE?!;=E¡ä≠Iu∏Æ'ÅC¬Ù©ıùÄ$È˛πîƒóΩ~s–·∆KG#v°páóŸ»˜;ÚvAôó¢¸í’ÆÆØNÂáa}µ‚(T‹‚à±‡+‡%äTÍhñ¿ï,ÅN¯uX˘~∑-Åtéz	à±8&K ¥W<3–Ä2Åá≤≤È∑rªˇÅÙ∫Xlè§∆≈%2n˚±¨#W#≤´«Ëù˜€hà~7Ë∑í˜xì›©}≥ƒSw†*Ö;^Ü˘ÚYDÏπ
CÃg£â@!ê£4˙å“–∆È∞S@\S„:†qG\Œ#Ï.Œ,…¥U?ñ§>ß˚
Ø˛/l;â|íp∫É»‰t…≤~√8¨I1(|±íﬂ>qÁè‰øOjkî‹%¿“Æ†ìáë√Îòu∂aHI»≥û&6‘ªµÎºØ ’#zçÙÙdÓ[\ﬂ∆Z3Ÿ¶ZıÄö!D•Åî2C ût^µ}Ø	3‰ˆªæ-⁄k’–……Rc•ÂEmÔn‹⁄˜¶Ÿ∑Ω®ÎıZÉv0Ùå˝~»ªªc—&hÇª"ËŸ
å:˛ÍR!dˇ{˙Ò˜£é◊’ÃÄ¸˜/√êÔÙ‚f¡˙ÊÏ„ÀÚ^b∂&´rZœ˝öq-‹€l¥¬∞=`>—@Sy “Ê#Sk«\±•™Ìó≤;…RŒ¥'	çk”Vı5Î'õû^õ+9Ä[ê⁄&[)OŸ'Oô¢hPÏofÄ£Ô~¨ΩMù˙Xñà|é˛jîâºWg¥H
≠€±9≤≥ÿ¨µ™õ„?z"uΩD"aœ„#ø/ÄozHıøÄ√UÎ˛ä>xÓ∆†¨6Ú`Áæ=¬¥zÈ Äjän≠úûïªë~ia⁄w‰ÿáL‡Ê
ﬂ¢cô3jëzÕ∞k3{=`1MW¬oÊ+ì.YbwhπõDÑt∂PËã\`Ö˘)‘÷t£a0ÆµE˝fdÏ¸›Ñµ4ÊïÀú›ÑÓΩ6Ÿ‡/gND∑g‘	LrÃ%È eÂ8^ì≤2ß∏yX)„◊l;∫ìó¸Ì·ø˝≠Å®¯ÃÂ&çƒˆá÷Ç˙÷ü&?™π¡Ñ*·"a}ï¡ 3¯9,u6∆≥Ó≈∏√|âcﬁóò–Øùå/vˆ(0g%Qºπ∏≥Ë˚∑Û€â£ô>CiU^≥È5ÁoóôVø˙ü⁄iıg≈ìÁO8ç  HIîˇåf¿3¥	>DT¬¶˛eRÜH∏÷ƒ¿Cˆj∏◊má^sˆ:WD˝c0È˙0˘è„ÑãÔÓg&|NÛ!ÔÓ°ú oœ©%e¶Ÿø¸…¥Ω•IÛDb¨?Q9O™Ãµ>J≥rÛl¯≠¡7|ﬁ—d∆V#¨€‘XÖ¥"≈s´†ïvø^äÂ’+ÎõõÎ◊Æ≤À◊n\a´◊æ{u„⁄Ú*ü[◊o¨_›≤Td‘zπÜeïÏ€ı˚7D¿´µ’d¯pâ≈X¶è˝à¡HÏ]ø…ˇ∆ô0,∂êI^öT Õ†Hr%⁄ËÒ÷∆ïÊä„â—ﬂ=/Ç·#«$ÿè…wPF6˚çÒ=A¬ºÏ/JÛúZùy<ﬁ≥∑Ïx√è™yp
-»<X˘⁄Ú‡ÌHÛdˆ~êπ°¸Œr∑ôoÜ˚Ÿ«ôõ…Ô,7tm?/¢Å˘ç±ûÊª!Ω`6sNˆ¡‚|9{‘˛˛?È¶:P?¯∏0h≤˜¯Á
.Àı˘⁄û»Íf".°ùÛ=˛d∏É„lÔâ1ƒºeqå=ò˚Æ„uìØˇ?   ˇˇÏ}În‹F∂Ó´‘hii¢æK≤¨m9ªuÒD8∂%HN2˚x0’M©9Ónˆ!ŸñèÅLccŒû˘8Ÿ'	vf«Ú8ém‰«ƒíWÒ#úG8µÍB…™"Ÿ©eu#±§&YU¨Zk’™U´æoY÷ ˝’†π˝ºî–F‡P≥Í¶X€ÔÏ›pÂthp*KÂ%ÇzÒi∆GŸê›•l◊û·¥ôÑ˚ï=x}ÙGä°°¯˛A®V·ke5c3
ï•
ïª®,ªa◊=€âı›Ú˙˘ı—_(d¥ßb◊ï4ÌûãÁé=3\«Á‰Ω_ëíæâEÏ¢T?A÷SË&O™˜ß°˛f ±}˜…Kˇ¿\§Ûù}“N<åûd‡K∆å~œmY°o¢ußmïPK”Í4zbô‰Àç‘ÛJp/aØ%TUÏ¢≤∂›^£—4ƒ¢…7xjWáÌÛÕÖ£®ΩÆ(+™7\®≈,ñ_ÓgÇØÃO5í≠‹PÍªT3Cí‡¡¿◊çÂv_√Ëπ ~ù^{«s	Ï4ÍÙ¢H o'<A ·ﬂ”ß˘ÀI≈s7‹¨Îπ◊Gèr≥∏'ééËè«Ù«?Ëè'Ù«wÙ«S˙„{˙„˝Ò<wC⁄Uåìô6o¶‡ò?z∫xΩî?£∏?ã¶–
Ú∂b´Æw«57:ªQîı¯vIèÙ˙5õı;xpØ7œp∑ßU|ˆdBw¬·(ËGvw¡Ì∂,o:óèF¸àYÑ{9È4W5é¶)æêá€∏º£‰¡Îï˜ä¸˜≤{È∆Ωõ—ï7k≥Dß˝≤#-º'CYºcíF•it-ì¨B√ã<,íNg˝	∑s| ‹≠vΩgœ
ÿöØ∑L¯uÂp£1ù#˜òPﬁ‡eÁ·Õr3Ô¨N«tﬁΩvÂr|~!ñœá6|õ§Q÷ú™õSwL‹¨E”9zC|Ã·€ÇÎ∂ÃB◊¶ÀM‡ò6v]ª’ÛÃòIÓ?∞ %(WÍﬁ—›◊4-≈ç,íÅo\È»ù˛ãÌ⁄ç√%v^mZ≠∆4-c&±èp	∏lVcùvxz±ﬁ)“„„ÅØƒu Y∞5PÇ+^„O«Iu/4Ω∂ñºi≈∆!˛æâ‘ÂÉ}éê‡r|˙êº¿ñ’πÖöéπ∑<’ÙºÆªT,B8¬-P∆W£kπ∏w⁄≈∫ÎVﬁŸ3⁄VÎp˘]‹MoÔXÿWÈ9÷“Œù+ï˛eˇøÄˇ?W*Ω’∞∞a1ó›£;ì–ÚU∑iö*ºn›±∫OÚSo‡%±aµÀ5p†-S/È≠™r†&’∂"åÜAöƒbË{.°º)‚oäg◊Ë∏yÏ‚[{—ë*0Í∑ˆIÏˆÉml IîG˝ ªãl¶™ÔÍ»èZBÄ&¢æ≠m8˚Vg	ï‘∑‰Ã›[ñó'¶Ö∂%ÿò\BÊ»˚˝Ö’Ó⁄égD5 ‘ûûVe\˝k◊ÿ75É„ZöK®6ó¸˙Â˘v;[ÌX¶Tbs°®“»DöH0HëJÃı˚)‹Ëı≈àiﬂ·`qö2á O¶¬Ã†z%ı∫NÅ: Ü∞`ì¿,6ì{ΩISõV√i˚NÄ∏)>pp™r˝í…ÎJÓßÏ†tr<±ûY≥mﬂ6ÈÃ¬ﬂf6ìÍ…–g—º˘ÿø°™π·û¸ÇŒ¯](B´earŸdsS:_’!÷ÌeQ¿¬æsº¬9Ñc,Mbå',&Äœ)¡Ä“ÇW§Gdb_@–ÙŸ±}ú«Èkv≠ÿ©OsÙ “.Â9éïTπ(irOŸ')¡Å„Oá‡Å9†Tfl`À¶NX$n}|‡ƒdoeUî‡÷æù0-B∞íÁ;‡d$4ﬂÈ∂Ü%€rëoÈ)≤ˇ ª?õú‹:‚wí>•iÀÊÅ&çZÖ",ÕÉO¿.‰p¢ÍÚ¢˛¿¡§Û∞…K ·p_Ë∑ÙÑ;ΩÒ§¢=WwÌW¨
ñﬂqüTÙBÑ`vaﬂ”ÑD3≥≈íPëø($Ki‡ÖËˆ<X©ÏÅÎIb˚£œSóÿ§¥ÍÆ<§Iˆ^UKo’+´h^2Óπ
Íÿ◊~kª°ÿâØ»9∫≤Y'Ä√ùCF«jÉ&t{-◊T⁄*Ûp\ÕÈÆ<|ÛwÚÔ_± 7Yæ(Ëx—ﬂ•G[kóîIËölê‘¢›Üß)w··ö
+£«®VNˆŸ?5Üu∏ìe◊2?Ÿ‚a)j—WçŒm√≈√ù/Õï)‰ı"
ÜeÍ!ÊÚG‰¢UHóKÇ∑BîèV¯ ¢t|™0¿dªÙ∂ıﬁ¶Y.ﬂΩã⁄VÁ]©¬:P.W VÖÓ)+•_BÔn@`œG_µÒ∫ò∫öﬁi¿≥r`yM∫êfÅ(πüÁwâ’¿í≠$N≈f“‡L?ã#–¬Q2BŸ¶úOUñøŸäÂ∂≠VÀhZúæû˛bµïoV :Ç™|ΩLúÚà':È£q∞˘1~tøânΩ@îá¸˝åôã^¿?SŒ∫*&RﬁGÃáølÕS˙nI§†gt∏ßüØiÖ|ÓíMˇ®˝'Ç{O<íUÀ©˜ZnøΩ/GTRµ_ªzroÔáUºÇ≠1˛gä‰7ØÿwñßJ®Ñ¿fC·ÀZû"ÚäÓ¥[ó∆óä≈ÉÉÉ¬Aµ`;˚ElSJE\≤∂j\yø∂yu\	6A®~H:ÀSs`˚nÎN˛≈·∆w∂¸rè|4srrm%°∂ırymn1R‰≥o÷lÈ«¿èWQuêj´Á¸w‡ØÿaïÛô;§k`ªámŸº÷´Œ°ÀU4WEÔœüCóÒ7Ërı¬Ωèø˝ü±“ıV)®'Oø`W{ˆ&ë˛ {Ùô ñßŒ˘√_ÏX‚zÀ¯/(†÷¡öÇ;†çÁéñIÔ∏D#‰SA†xÍ‚ZΩPÑ26j1K£≥µÈ
⁄I’&…∞óÁË∞C?≥ˆÒÅ» DPä(DÉï∂∏0Ã“¯õB©˝îvLêÊTïvÊ`ßê»¯°k köC¿~ôâ	ú
¨òf96AW%‘
◊YG‹à/*êº%4•ŸHôR∫U~Ï9ƒÉ"Géﬁ)‡•Åá+tÒoxíÑÜÆt:·0ó˙ Â6¬fYﬂèï∏;÷éu#¿?ul\e7¬…;2êCÓ¿u⁄Åå€´⁄ˆ:§÷Æ_F;´Ônn^NÍåä∂3‚AûÎÂr?ÏÈØ0¿£/à¯É¿Ô…éœä§åﬂ@‘áEÖ>Ç+_pÚØ»Zö‡§Ô=%Ï¬8uû*›ï¶k(:πi∂∫¿M˚¯Ë—Î££◊Gœ»øèÛØèûíØûíøüº>zé;4tœQûˇˆè◊Gﬂ„g πG	HÏÿ46¯ö›ÕoìdÖZ7Ωn@∞ì∞ˇ|$´£X ˚uÙÂ«ñæï9ã˘b6ˆÿ4˛2 L…úºÄêsh€BD;äeÕÚ8Aø§9I|I˛ãGyì$≈Ñiì$πí†A3kˇËÿìTï}≤eÂHèÇÛ·,.ñ‚ì/’ˇ›ñ$AñªIáπı^_Ù◊€~›∞5ïàÁ—∑c∞ªè¿ÌLW•ˆ0=˝$(≤ˆyΩ*'/”∑ fÿòŸÇ}œv¢;Ô©¯≈dOwÔ¿N≈î⁄»Ü2ƒ≠%ºD9Q†•∏ûxtH7F -è§qÈwXVmá%/rl5Áùº+¸ô8q«jŸ∂k¶3‘áM<j¥–Uö$ªç›Ô,sÉ60d±ªªIæ{™çö≤vˇåîì	sÉõ§*6`åp«'`ly¸˙—«˘4¶"‹DX5∞k›˜nÿ$U‘ò±ÇU°+…6¢|"	Ë’˙∑IäÈAàdJâ°F&ÆÉqT!‰GÖñ#æ”#ÍAÂÖ?æOrß∞¬TE ƒYh	gf°“l≥j
Qñãì≥DHx Û[¿e˙íCÒÉ8#˚§≤Ü-•Ÿ]/∂a@©
ûµ®éÈ» ©Ω™—J%	Ç$mÙí0e{§¿ÅÔ◊ä¶ïª~%OCﬂìFæì∞ò	Ïô	˛›]≈qÜi©D5Ï]≠ùIc[≥ﬂ„ƒOÿ:[&?F‚∏j∏≥>>ﬁ1éêfmŸ§"Èı÷¨˝•s¿AçX*“ò¢JQ¥4"Yù8Ωı)W¥âqÚ"Âíå^âcèÄLÉ
ÍâÒ6HRqîQVåÖ
ç¶^<˙∂JO8j«O„=rëÍr√BG2∏oLÊì„«hˆMù;ËS¸y∆6|Sám¶6w\›XCãµÕïâÛ˙f9ØT,◊FÀ1±=#”ıË∞~!~ AΩ¡÷Ë™’{∂Z@îÖg‚¡˝Éz∞
Ê®Ò∂JR1î1NçÖıôx∞˛'ùKGR`YÊAMÊÏåÔYÒlÈ–SœvÏß6óL<⁄7÷£•‚8ÒhœòGÎ&éΩ	ö+¯EÙ‹‰Ê±EÔ√Òì˝lõàß⁄=°˛låÂiI<∫˚úã.6]˜«€NI≥éáè∞*‰‚j£BcË'è∆¶ÖrMO·êﬂföúê|;‚1Lcã∂l◊C‰4<ÏU_kˇ\É.´Æ;‚ï’U«€±”¬ÿ˝ÃëßO‰∫x Ÿ8R©£∞æ]áPo·≈m=æ&íS7éQA:ÑÚƒ¸7zÏæbá[OÂÿ5∏ŸÙÌ~ß'é«ÓœáÊ≈ˆ˛*„‰≥º√3‰}~GΩœ#ÆecÓiÑ–îÂk á]?S^…Ô±Sd"Z«Álxµèy≤’# πÕOc1
»g™ÁÁ7O«fÃàÃ«Sj>>·»RﬂÛlÂ>¶“È›òâ.9”‰m∏ATÙÂdL<ï„àıø‰ºîO¯lÚ`ºG=D£úM»ı,Ø…átLfñ–êÍ=å…ˆMB‡4îsî†ÎlìÁ‰g£såq]≥—zH4«ÙÏ≈˜tñx±À8É0ÒcÓKé¡ºÚØ‹áÖ\˘í¨ Sôï—ï¡(≠§ó>“ Q”Y,LG&2o—?∂≥
ÕÈ^Ì<„Ÿœ"”2ë∞$Ÿ|B¢cˇó\¯íÆœ«{nK-|!mFñAè;ÍÑÂQyfÊL‚£“B›⁄®§›o⁄‰(R|Àù$¯KéG“ò∫Û‘‘YvœÂ∏g„91>óŸ£Û;EΩ{‰oôê•ÒsnçéÒºbﬂˆHÆ«cƒÜÁÿÅ~ê±‰CÓ~å`´e6ˆM¥bﬂA”˙U2æˆHÛ?'1N$ÕGˇ´ëåj€À«8còÃ ïqÃ≈π TR∑Fîaaá cr?_ÚœÎáê
¬@çqá‰ì∞w±üFb_(ˆt2°∆ªF
ƒkH ãH@ èpúì?:@J√üË…˚∏ùIØπ˝qc’π˘~Ç Ölü?ô:òV‰
˝î∂ÖK'–√{∑ø‚ÖµY,÷N]K•dR&»/©sÍ¨/	Ïé/©Ì£Â:DúBá—YÂœ˛N;≠û°hÁü·{ÚÅ[ÀÙNÚZŸN"¸Çƒ<DsQpm¥Ëß C∆ﬁ)HµJûøûs}•p=∞ÔüÂÉ‰B`m\†ÙG¥ìŸÙqüBx˝¿|72ﬂˆŸá≥©ﬁÂü$ŸóéËglOHG{¬'µoÈ‰˛©L˚#ü˝8#7¡≠%8¢˜>†,µ(òX3h˘˙_Òa]Bºõ…ÚÂsR‚ÁÙ)Âªâ¯h…Î=Ò9‚◊ Ñg<√h>Dî°ìO“A%G|@ˇìﬁ≈≠øNtƒ˜˛S8aÕˇåˆcqŸFm«ëØ~G@‡ZcÎª	Êéµﬂ1ºûc¢ùñÌeq-°YRÍ¬ú-N•"òàe>_Jã-¢œI∞ä¨Hgf%éôœpÑßÈÙ∞;¨3Ui≠Û ë_f
ûΩ±≥…V¶3ú⁄ZnÊzÈ∆†Q8˙Æ%â¿√^±é¢Ô´øÔõuIˇ∫È`Pƒ˘◊G£yÒ¶˜çŒãMèà©≈Rû.Y≠pãnŸN¬JäÂÇŸ6£’ Ów|¡¿ØR`¡!/ºÛÃKﬁÆr∂E£⁄ëOe|qNNÓ∞˘piºó
O|¶ı íK¥‡ò-_¥Éô4Zl‡6˘Ã‹†A|Ùj>:¡3
Ìæ úô—6i–),hxx
v@F⁄¸¨€As”Ì‰¯bH=˜g˛‚Ç¶v|Íát®ﬂH§j Á €Ü∂%”˙ÜÌÉ ˆÕÙßYu∞°©¸∏‘‡¢YÊ¿π√L?˘˘@Êõ£›ÿNÜÍk}0Ë\≤mèëº8ÿKG”´¿üàÏNÎ0-k_(¥∆á«ãG∑b“¶ÁÈ”-Œ∂-] \√‰ﬂä0-Exòh©€ñQ-…EB∆è¿p˘3:DÒFilXM¡$óâP≈æË6ÔÕL„>˜ˇ{c˝T[ª≤q†Ÿ◊–⁄ÊW/o÷÷Pmmo\ΩXÌµÀ!iß?o’pË≠∑–tú«úía3ÀNm:ùwzÌ0}á‚ö¶¶£ßê˛û ÂÔÈ”
∂z(Éåÿ/ÿà˘w≤…ë°)•o≥+LP¯eÆ‹xnP«èËè«Ù«?Ëè'Ù«wÙ«S˙„{˙„˝Ò<w#\ë¥-«Ïbâ6ßã◊K˘Û7ä˚≥h∫≠ }$∂Íz◊p\s£„±Î7≤í””!>1=ûãp¡yìﬁ1!ßW›»÷@rzÒR@NÔ!"üyÙÔøä¢d•gwn¿îÚFÛ÷ì7”5!∞W∑gB`èNê¿˛ﬂ'ˆC*{¬`/|&ˆ„≈`&xÎ›[á}—÷√sZ÷z)UÀù÷‘≈ˇ˜ı_æ”•pùzÓz?ºÙî„~Ö@Y ∞gæÈÈ Ø¬wŸDéá~Z@§3d}5ºÛíÚ|#1âA“´ë¿àœn;åª∏é◊¶«≤Ì2{¯÷iú!Œz≤∂…ŒWœLÄ@Uéø7r&\ıIÜ 5o}†âÙı“´˝≥◊…»¬\„≠ÊñûÇ‚˛T1‘çv`û¿º7Djzµ!}È83{8í&Ôp°©·’πÖ0≈=„e çw€K]p=Dæ{?$ÆNÁÂ¥~"˜ª¥]>d€ÍºKBbX£ ïRªùõÂ´˝‹/K‰Éø	´¸ÂjŒ°{2âóÀç<jè%‡¸^ﬂRnÕE«ùá}=—≥ªF›ÚÛ◊KÖR;ÂTïÚÊm|Ÿ%=%ˆÓxè(¶j
QπnR.]æc¢&iw	y@6ì["DÁza◊¡
+r∫*gÊDØR9R,Güπ˛+FGGë©⁄ü®Ìyí∆yö§1''4ˆÂZ=V„Jd$B~,≠H¨ﬁöå˛€P*¿º∆¥\äÖw≈nò-÷Ì:VIV,˜aßï|C≤ŒisÙdÔ>l]Ù{DÓÖÃ÷%Ù6·É}∆YbüSñXNKÈdü¡ŸÃkNÀ∏Â6çYÙ?ßctõΩñ5ã<W·l„“…ô^\Ú‚b©|æ\^,/î´Ÿ]XiØä€˙§?√ã•Í˜%oﬂ≤_íh±Ñ8…PÌíNºO≤t¸ˇJ:îìÎ>¨Ë¿Ô…Ω˙\_‚p5<É›4ËufBjóP•TÆ‡≤÷76Æ.°run~·˛sÀ.\[úÎßãUOƒ„%æœáúÍ∞¨”©ïmdó√ﬁñ⁄,[`4ŒSíTºæ´∆HzÕ8sôïGÎˆÊiöU†£<O≠x!$c=@“≈#Ÿˇ»H	€ yÙnÌÚ•¸ø≠◊∂/ˇZˇmÌ
û Çfx‘AÜÑôÇ∞{^6Ìûß'ˆÏeÅ‰·Hà?ı”•´V-0√1˛BéÈÇû^;S• ≈∞ò.!í¯î_—èra√∑åÆvéÇ‚‰÷=é.sàt ^î$Êl_°•]ıÉ °6<»óãUï 9Se∫g¡åFHÿ—≠%ê¯)ëÉri
v"öÈ_‰|)N”å=q¡kPoÉ&TéÔp∆v¥Ü7NàOFxAˇsxú6÷%>	,Úwê≤ ∫mŸ@Bÿ35LëÎEö€˜=Fá—éI∂®F¢G)ÿ”cÌø)iˇØÓÜÚõ¶c#ÃÚU—¥$[¡•/x/‘37q‹§} yÜîáãcù#ªÖ;sS0ÖH÷Ÿë=éåú∂2G_P…# wb4÷€∑A ≥Jpû¡Ÿ≤íC/t\¯YˆôÇ∏
âéœ÷D¡∂òIÜÿh˚5ˆ∞á ù2DË¯|]Ô´‚¿7Óˇ@‘6âˆ‡{ˆ`Æ¸\dá]kƒkb«É•â:l(€hÆV‡Ù‰blm),lãï–ÓstKü≈Ü´x-înØ‹Ô£ÿ wI_Ω…ñàΩÑ’ﬁ'˘päÓ!£ÂI.ü8¸ˆd©√V<ˆÓÔ [á˜”l/¡gkDBc-V%f‰ß⁄–Æ>è∏'ä˜‹ËFœ*àF ãÂR¬ì•QÁÎÁ!Ù$;›#VP¢úÃ(O]‹YΩ≤ÉóºFªõ
®(È<áÊn“QŸ©ôXHm.<è´l*ºúoËbAıé~˘ú5è·%áË¶6˚¿…áR®Ò!ù¨A¢¡Yj◊ÔmãbÎBŸlÙZ&∏ı=¢j.∫lπjb…Ò– ¶Q—$;\hŒ©„Œ—¡ã∆‚Ug9Aà+%v∏|†(™<Î1‡R6¿/…qœ/p)˝1∏céoyE#¢BGo€=œÍ áÔg]~NŸã…ë!¶(e≤õò:Jt¡SgyÛ;úHò5HKì˙MUIÑÑÔ+hºü≠ı_ËAF"Õ…]ß–¡IöœÇ€‡+^sÄ⁄*Ú⁄îÇí∫±C%ÅD•n€*shRñ|£ÄK2©˝öÖÖs?π^ΩÀOká≈vcÇG:àÿ/‘…Ê˘/<TÑpbõâ~Ã„éæR7∑<_,ù+B‡;Ö´(OﬁÁ!¿r≤ﬂB®ÂÇ¿>
zºï±››2∞^‰“x“™˜
ƒ Ùä•%‹ßµ+(èJe¯uÎJRâæ˙P∫~·∏∫˛±ÑÎMÏ˝JßqˆzqTΩüt=ç»}Eét+dwæÂ6œ¶ü?∆ÓW ?Å≥® ï“®F‡sˆÄtÚ@äkc_∞Óû•Ó≠å™{_2.Ê⁄}„;X_…˛oäP@∫˛7fVx≠côù∫y∫?!¶Ç%-ˇ6:ÆÁÙ»VÑK–G3-ı∞€œrY"Iá‰[	"PB*L€lXΩ∂ê⁄%¢ŸDëo‘ãÀPˆç:–ZÇ§^xÙï•ˇ»á¬IÖü˚B˙OrÒGëÓ«≠£yèyú§H§75œFÿö†UûÑÔ.ıó≤î˙ï5Ç¸9d_ ,ui,$√Îg“,πË!ˇ˚>4C2ƒˇ Z¬˝¸¿«`è'æ@ ôüâ&kœJ„ÿ4‘ôW>í ïoj{ífË™-ê8∞ ∂h"“Ç Ω…F,ràá–ºc¥Q2∫,Ø	©1]«tÒuÄ`öñ+$±Nxêî„A˚ÈÈ¯± &Ôsú—¢Âc?ÖÈÔ¬V”}»ôúÊ9nœÑ¡ˇ⁄œúEäÎü
qπ/hΩÖú∂G∏ûô‡ Ã'B["ÛG∆‚£oÄˇ˛äf.<¶
Ã6R˜7æjˇ¬¥LüJ’∞8`√‘pëΩáH
≤cw¨:jò∑≠∫È¢i∑m8^ˆ\‹YD˛80ºz”tgOrØcÙ∞09÷áX‹‡tÜc-Aˆ(Âﬂkb1≥õ÷ÆÂô'.VˇPàÌ‰ºwøß2ˆi$wˆ#î¸˜Gö”¯Õ™˝ô¬◊(<<O}∞ß<y‡9µ^∑(ÔˇFõÒ“á˝“X?ÈíÅ®t$Ø|0Ÿ§ëÆé⁄x Cé	ß–… ⁄ızØ{F¬r˜n≤H&ø··±Ù`nƒOîÁ!cø%Ïö{êbGLJ›n∑¡Ÿ!áÇ˚>í•Ù!¸P∂è°ÂÚ¥ê,ÓDπ>î¡Ow¯˙	ﬁÉ?…´=¯VX≠$H-?“IP%I öùâOD÷"ß2˚>(ÿ¢©œ˛‹„8Ω…€	oNæ‚GJY‹˜Ô¿&Éî1Î∂µoµœv∆≥c{$D!Œ÷£ÖÁã(~$›È⁄rÏΩZs
h€h∂çN∆}∏!èûX¥r˜.¸Æåcm*µ©Œ?2X∑∫ÿêÏ|ˆ?¿Äπ¡DN¿Âé\Æ∂∂ÜÆÆ¿èã1,πÈù’Ìıı´;Ôn^Cµ’’˜∂k◊÷√‚v◊rkçK“Ωb7å÷fO◊ 3'‘=8íS!TPR"hTïï¥eI:H‰O“èjÏå∏j/–ìqr¯år>ÉÊıÉû°¬åê·EÉu* Ÿfñ"tN¯RQRA.dá[PÕ†Î˛ä€•UÊ`q≈úX´CQz¡{≈ÛA´≥%æ<®ç5Ï|◊qª©ÍJhï¡W⁄Œ∏Â‹êÈŸÙ^≈…π%CÚÙü—„‰|wUF\å›iú«Õ§t¯R"Wô@π§ÁN!ó$C n©ˆîxÍ3‚æ'∂@ÁûΩ˙^cœîë9JÁÌùı’kõWQy…?5¥b∏ÿ€¿ñj‚¶µñˆåΩ≈¿∏∂+◊iVˆ*Êﬁç–1p¿“·Ìñ”+Frod∫ä'’“|}æ ´´34 …Î©≤VdÕ…t¿ãr`®ãƒZ4Ø™◊%‡u-lÄJ,“Â¸âhgë!jp 2∞˙Çπ`ñB¶^´by6[aù©ÃQçê3£Ø“h4åF˘F9å”à≥(º_Z¥∏>˛@læ$r>áık˜FQõ_}◊-!gˆ{+ERjêí™)#î{ \Äf∆‹”§Ã”	ªMÔ1ë~è˚BD7”A…†4~"∏»0SFÀæH[ëÇ%P◊ö|F´”ÌyörΩ√.Ò[
à
˙1Íu≥Î-OYmcﬂ,˛Zw´ÿüDÏt7„I∏â=zœ¬¶a7V6mÖ∆¢ed∞õµoz¯€}ßpΩtCá±G°[·ﬁ$î?Ç∏#HÎ%¸}R_o†C› e|6˘BèG˙` ¶8Mp1Rtkt-§q”@ÁœNﬂEÖ!wúE¢.!R>Î«w
éÈˆZ2\G}o&±…
Ë¡ÿ;¡èöªfx∆{€ó”t¶Ó∏ñÌÑ~îjr°HΩÚ≤NâeŒo0ï”4Á©ã°qxè–Yµ2•á$*(6πªÌ§–J6 Ä¢tlB•ÁˆcVQ∫pYÉÄ\Ç)JQêÉ◊˜0&SÕz<aúSõD(^g∫n≠ûõ‰`
#Á§≤ΩtöÀã^
,ih©Æ:ïﬁƒ›l:À¸¨/^à¡êîvúM–›;@äÊ#™…±¿W&ÿÆqœ%Ø%«òy#~-”ÓyÇÇ˘'n‘Ô¢1	ZVŸÒ—~X$LGı⁄%˚ÇnÔQï(VSf-Ò´Åö¯eg’ìq¯à'ﬂß¿k˝HªKB.t`¶ÄN]Bú.&»–ùö/|öK_ΩP§%e®lûKÚ<C|Ùﬂ§Ü/héj¥}‘∞¿kX 5¸»—ê˛6ú‚œÒ‚œë‚_Ú=èáC{ÅE^√"©·ìÄÑtX5úÁ5ú'5<&<§≤À%^xπDJD∂Ä˙+!b]NΩıÊ{Ù'nv9¬ç.+ybr•√5π;d¯xßı°gµ@®j‘∞—}î∏î∏/Ò≥>J\J\çó¯˘“H„î¨b  O<[>–JÜÙ*eÀö,c$î˙Ÿ'Ö™⁄P¬ J8TÑ≥ßê◊πb9^3)it"ÏijeÑÏ∞Ï ÿ∞wG†Ö∏‘!Ã÷-P%péU°Ü≠AxWçñŸi°”÷>º19{íØ‚˜£	á˘j˙\÷ì=≤ù#A6÷l$Ùâ86˙ı‹w¶ìb’ª≠rÒﬂ'E´Â≤O˘ß≈fSÅqòKÜ·Æj‘@Ó™¶p÷¬^¡⁄4u˛%Æ_àÃ>saóÃ6)é˛å¯˙Ë£ÃenzMÿT'?¯J˚±pNÅ˝ûTÆﬁG=™ª“≤Ì˙ñ¬.ö¶ok¥fF¢ ªP©iËÍ=QÈ»PI•koO]¨Ωù˝±<~,ü˘±\€Jˆ⁄Vpm+Ÿk€ƒµmfØm◊∂ôΩ∂º\≠è∑´¡Î’íﬂ/ïUR^H±&Ho¨Ük™¿{G€ÊæÂ‚õIœ\µƒ|˚«=ü˘—Î /òÜÆÒ∑kÕö÷ãO^N+l¥Yl≤ ık¯¢Âg±°u˘"$…J3∂r•¥‘Ô„∏ O;¨,°-¬ÈÊHJœi=¡ƒCŸ°ùé7QÑA÷#jÑ≠øÚ‚9œõO¿Ä∑<?è˙0Ç ıíÔ”¯†TpÄ!9€E=È°º¬$°t Jb:Â%É∏¢Ñ2/5ìKí ÖÂf.êπL–Â|“úœ. ÍL˘Ónæ¢‰H”ÌzDBßMít}@˛gjÓßÃﬁcùŒ6#ô)'’Ê|Íhsñ¨÷™xh®¶∑‘Áú≤aŒ«∆ùIé¯ü‘’úí‘V~∏"Qú·À€!íê&øUì·*2å◊T‡™˙‘TEö´±JüÊ™Ãë[åÁπñ8ÏgôÆ˙\Wm∂käHl⁄å◊L9Ø≥^3ÁΩö˘ö%˜u‡$÷”X”&≤
 6å<÷ô¨˝Á≤Í≥Yµ˘¨˙®ur¶Äß81©µﬁù"snrVkø;≤Un+¥&[π’UjóüJ∏Ê†WƒTTﬁ$5Ï3ÑÿoG%ÉôJ⁄øUÊ°í∆&•ÿıüãÍüu)≤ËÙ;5)U±¸··ßñO≈Úì~¥:≠S¢±R 50]Vª2ux¬°®~J£â9MzQ⁄2BÅ*….ˆ„ æ√…u“g;©Ûù∫~Ô•I'äï≥c:Äƒ≈ë_àÃ}¡`Dÿ¢˛+Ç‘Ú4’éê§äïûã{¬≈ÛˇçT‚„¶=Âà©œJÆôFùl>±_xrT(£Øí◊Ï∫g„ÇÈOﬁ?§\¸Ô—_HÎ˚+˙í·¥°ÕÙ'OEˇ„ ç“)9!SÏT’´kc‰@XçQ˙Vc@˜°\BX–#◊Ù3x‚@à≤~≈ﬁµÿé~îji|tÄ6rÑj@+PJÂﬂÚœD–©“Ç,…â≤¶ßHP$è%´K⁄DE¯ËTfMü≤üÅ4f-{Ú"|§	åDÙù¸‚q ﬂØy¯§ cîf1V…^äåÈ7ìë4"ÅnËho”i≤Ö6ƒ-4r(’uÉÕ˙úŒ‡|„u≤É6¬4~V$ºÅÊ{B˚gm{˚gB!ì˝≥…˛ôÊ3Ÿ?”|“yRÇ≤Mˆœî7ºF'»…˛ô–˛˛Y4Ukåˆœ®vålˇ,(~¿eøﬂ©ì˝3ˆˇÖ`¬˚gQu8¶˝36åvˇ,Z…dˇL3î£Ÿ?{◊ÓπÊÅµá%–ˇï»›Ád#ÁŸ)˙¶ﬂ]≠…Ó\R…ì/Ö;0^lJ—Üó_˙d√Î,œ¯cæ·E•tÑ^bìØ≥™o“ÜïË—mx˘ÂO6º§ü3∞·ï˙Bö„äU~\ΩEÈ¬‚¯àŒ˘$bµ ◊a≤&úF4§ﬂÙßaâKBz–—4˛Ü◊Ö5BcÎ›E(<õ·˘º£„ko∆—h•±=@&´@µ∫π«b‡Vˇùpñ˛ú%∏<2qØ„÷mÓ]–i±à8È5{o"⁄≤k„"⁄€ƒ·µ;ÑØ˘Êª&BfxÕFÇ›„∞&|Ä[¿0tiñU2¡Ûâﬂê|h˙!OCå‡…¯e”“§˘@ôK{ØS¿/ÚC$√øB—œ˙)z≈a-eøêÚÔyÊ¬v,xŸ.“ü<˝ÁTËË'H¶ºê¬>!ËﬂÊ±⁄0·tGÇ˚√=P}0m@˜6{ -kmÏÈh1^ÙÈŸt∆∆áÿrLñ¬Xºoníì a◊–P⁄/«>póÔV‘S±\/∫¥¨C˜ ¬≈‡‚!V2hq∏ñìÚì!í2ö(€iˆã∑Lßmt∆A™yCF&◊ë
ñløÁŒÆlßæê&Æ:∑ƒe≠ôûaµ‹71¢:WàΩ%¯™„ßå¢q¸’ßàì„º ú‚Ø∏;¢ËÎ)ôàﬂ∑Z-cﬂOΩ°=tí°©€¥AC∑Y¨‹LÔ™IuÏgb€ı–&pªS¡˛;œ¸˙/Ç¯}2Ç›≈ç¢m˛|Ï=ÄxìN≥ißMD|‹E¸ñÉ˜∑˛DwRíÌA[Ü.‘§‘‰ôÙ–Dàe◊∆Eà◊ '⁄™{4Ã8A9n∞Ê]îy¡H≥ﬂU”<ÓRΩm∂¨}~å‚àoÑùòCÌ∞Êåbå<ÄTìd”óTÎ-øàxÍ?›axÙ˙Ëö˝áâ»Æçã\5(}ãÂrVJìÛ;¡∂„NF-:AÎÜÆBŸßo√xÙbõ˙BöP◊¸⁄¬ùnŸ=≠7zıc‰;8ﬁh◊|Aˆ¢tß¸ËcÅ˚i@π~ÙQ¸º–Og=‰Â˜‚*á∂?fC“ë‡éæêíEüP ∑õ4y˚T¥‰A¬ºW… MffŸµ±” B[´ñ¸$Rûth§-âºC¡√w >Î“Æº0æ)<˛¯Ì‘õ∂›a‘eö@y{	Kê¯…ﬁ˚È3zGí€¬L_b»y=A¡}ÁÙ¯ΩÏ“^÷/ﬁUú–K˛-Öîk-t…∂iz_çÚŸØÙ<œÓ»6x£™÷Õ/~Û‚(nq 7éfvƒ≥´ä¿\é’πï/ITı¬.iê§∞∂¨˙-,Ü\
7‹@…€mvÕŒÙû—rM©Äâ/søM¯–√ #n˝ﬁﬁ¸ﬁ<s´# e¡w`¬ÚDæÆHÒÃ™qX.Oa!”bûÈ‰G&:´Fßn∂$¢C{yÄÓóÉ7¥‘/¢0ö¯µà}¸˝ÔQÙö?"≤ãÆIETr	¶Mñ6)πN)T√\-”Ò¶[ÿ∏°ÂÂeî€Ì‰–;(ñöÖ~BÚ·Ë>(◊–+ê¸1Îè€ÙØgï?õˇOn†`üì˝¬û˘`28˙≥0w<˙∆ØıP∑sh	Â∂Z&,Ïˆ,, é˘øzñÉ◊PÂûe∂ÿ'	1–°≥t}2ãvh/ŒRoçv⁄,2∞R ÛP9%Äïcz=ß#ø*7ËÚÇäE¥Íòpp÷ àb.;\~kå¸
DÜÔfçñ’¯aÄLpsÁ⁄Z˛Ww±i*°∑—√kˆZ∂ÌLì_±í5Ï6ñ‰_£Û¯éô{7gUÖu)™XT6ÈÔ$ã`.ß,†CŒm)îB˘Tù.®T˙¢|é)Mº¡LTœ9ƒ°U™Y°k‡+Vó , ïr3 Çˆ)q±R—â¶ùœAßÈÔ)óà6Ó‘-1¢ø1;¶c¥‘}>+ß9•'©>‡Å! N[}5IÆKCG]-’2ı¿yÜá›îÉâ˘6~_√•BØÆñ—æKIÊ…; iπ∫Ÿ"œ¥í›öî≥˘∂∫£—∂êúÑ_"˙øMœ<{cgsá†Ó·ø‹nÀÚ¶s◊r3◊K7î•µÏ}´C{`	œÖ=u©æ„bw·ç,GÂ∆QıD§G7ÛÏ]uø≈ijìàrïeâ‰CJyT>-BØ)AﬂÍq¨ÿh⁄°))zCRÄWë8$ıÜ‰YˇJBΩ¸Ç;?°vE	‚≈Ñ6¨I§—øíPªÏYˇäz™aÁ.•ß<’ÜÙ|[äìvÍô6íÔÆÕ∂WóÀ.N»oVñ‰Á¸…s’-Ú©îY\ ßY‚ä,IF˘Lê!†»I–ç"€ÖUÏ˚j‹aóJΩ;¶m5VE™µœnÀ~A˚$èJ(#!äßÔ˝ã<0ãW¢¨◊èÑ\<’Yπ1£( OY;∞Jﬁ⁄‹πF‹zª∫ÄÎ·y]w©Xt€ÿÒ¢1,πXÙ⁄P◊!^lÍvªÄ éWË6ª∞‰ˆº “J+cË¡éÊÀÓUa˘Ó5
F/´”9s≥j1πpÖ„%p_8˘y‚!∆«‰ò/É]H.aﬂwáÌ_&◊›S]1[Ô ãÅ•π∏jπ§]á+ıl\iÏa’BP˛¶WoNÔõ^≠kΩÁ¥¶sE£kYô.^O(õ“6Ω¶›Ä0V•∫k7∞⁄ìØÔÕHø∆V’ÏL„9@áFMΩ¯á[¯ùkw¿ØÖßXgÙ ÷$èŸ∑ÙH€†ëvÀ,òéÉ◊ßπ£~¨A®Éπ∏Ñá*÷BL{M«> ∫ΩN
Ñ
m<—Aˆ9H†Z‚)QΩÿ◊·T≥>ÅíUèﬂSâán(í:ï˜^%LÁx Äö?≥Å‹^Ωé_Ã…!ûº¥Àz≤∂µë–s™V’êZ‹SiZïn¸/ F»øWM:5ºÚÍÏ–óæ‚ÓáYä∂æÉn˛*∆s√ÏÔ=
¡Ÿù†«»ü“¿W4ÄÔp|KS˛NÅIHhãﬁÙ5áI}H†áf>Áq-={%lÅ|âˇ˝≈MEõ!ò#-n>mÕk‡©ãSV≤…âv˛]√5ıdÈ|<aocgO£∏‚ü¿∑ó”‹@E-Ò-•afoπ§	9˘Û°Ó&?P§æ%ò⁄uwëÂ≥˙2èR®Ô„öª‚´nÕÀ	}Øª/Dº≠æ-ƒ/êTZR«ããˆƒñ	KÍƒÊ•∫WX`'6QSx…úTXÚ}¬Ú7©∞Ñõ¬Q@çû∞ÖØF§ã‹‰öìﬂ6∫ÿ’‹[–™Ôıó¨ö‚Ñ’©˙.∂
’hΩø‰‘ˆ[\™Ô	-#sÌÍcû‘˚à·∆}§ÎIæê‘v7[1ÍÔ·k√ú|ΩßZ¬%ÏFfõÿØYm”Óy””¡v{x¶œÅø<≤Ç•"™ΩœÎø¨Ã/TÕ›‚˛gπ1g6Ÿ˛'›M≥wiu»N∑úÀhπ"õõl7≥›àls¶€€º∞”Ñ∏Ój”¨ﬂíP)`.	  ≈mÛ∂Öd
•huz¶äÃDµS*€fèÌ”GæòñFw-wΩayQqAoΩ"yä1âYw∞ÎC@KSÿ˘R©∏P"˛n√±ª˘›Vœ!ô
 MyˆÁá˘ÎÁÒÁ°ÉSe–(yÊ¯‡_ØV {Ü'$∫≤å∂q'ª’≠[|ﬂƒUWn7oƒÈªB[Í~ÜA,W Úgê‚.e+Jó—–›≈oÆ&ßz–ÖÌ/øwMÔ¿ìç©sTiNÕjÔ˙JôÖtû&ô–ƒ^`ß.Ç!&GKËÆHUÿ+æPlV•çË∆€‡J	Å|. EÜ’{]ÄÊæWŒEz¨~ñmÏ∫d◊πk;$∫›Uê5®ÿU&ªƒæŒî-"”∏îÈ"ƒ|˘2êè‹Æê"‰ç	‘z⁄ÏéîfÔ∑ac¿øÛRcó≈v±¨¯:∏¸∆nÀ$qA
4ãMze" ]¥ôaÉéÒ$Ω:·Ï’˜{¶å®0ˆÖò™_^‚béV◊™#‘Ôq$Ëó≤◊{	ä2Ã¨˚v#Û;ØPi“ˇ¨U4◊°«(5í°ñè¥$òs™ÑΩ(e}¡\0K°ëÀê›ÃW¿U¿ˇÑ˘Bèçˇ2êèP¬ò 6}3`bÅü√ä∂{£8/õí¸éŒ°ƒ=˚e¿}©+dÏóI‹ó	ÃóRﬁK‡=]» {©‡–≤á}⁄Àrﬂ§ó: KMÇy"E@:≤ÀTóôà.3“\Frôû‚;Ç[ÎR19»é97f∏· 4Ïp$lpnÃDfÃ~y1u¸NL•ÆËSÈË∑ÈÃ¸Wñ?îz¶√Û+ûÚ†Êp®mÄCoöÛôhû8È‡'î∆é7|[@øNfMgùíÿ~ÿ!Â*'ãJ©AAƒ=iIË(√˙ù%T3„6z◊v]Ï9•¥´—≥ßÊ$|4∫Ÿ9Ï±…<=ŸYåﬁ<˙(ç†'íW*dÿo˚(ÑXÿ &≈ßÌ\M‚öö¥òÇµíF*R√pÛ\¶Ê˚xxÅ?º–«√Á¯√Á˙xxë?ºÿ«√Á˘√Á˚x∏\‚OóK)‡«($«‹‹∞úùO®ü¡˘M€˚Ö°Ò∑ï'fÜ|˙13L ˙–õZ Mµ>_	_È„Ò’‡Ò’7^kÖ„TDsŸiwÍ?„h/N‹5í8F°Óbä»ÄÓqi~‚èÏúº><◊Ù 1¡¸e`ÿL&°'»T®QC«äŸØˆ4≤RaæZ0Lìcb$Il√!£äJMêæpÒƒª7A,•6z*8i9u˛ÕN^e∂…√ÙÁ@dKCaTG˝[ÅQDrDG£ÑAÍQÃoù(„1(cÌÌ©ãµ∑≥?ñ«èÂ≥≥∞·⁄V≤◊∂Çk[…^€&Æm3{mõ∏∂ÕÏµ’‡Âj}º]^Øñ¸~ß÷"âôËË™}l g1√MãÅ˝ägﬁ˜|FúxÑ√}÷ÓŸ⁄Ω—£û—4»")t$Q≈RmKf[ ≤mH‘ı†á# O~◊éÁ˙põÔa˝CydÈ·$∆ öπŸüÀ@3áØn$¢cÜ@É¸Â6:˚c‚CÑ32ëN¬S˘ôy„Ω<uëˇv|ö<çæ:™J◊K9—‘!e~◊æ£6¿Vcy
‰=OLMûuÇZ †@≥◊Œe¯ä¬äÒµÖµ%µZ∞„AñÆKR†:bÍV6Ô€∑¶◊n·÷À∫Rñs≠∂xÁ‚LÃT à˙h"ﬁµVÀ>28iÍıe2}‘»iû’Ògû’Ò5ÖßD‰ ŒÁaˇ1˛„Ø¸dÁK≤˛í}¿qÃ~¶g9Áˇ˙åBó)u$95'ıÖ4(ﬂï%Dè€ªπLY√ªÿ‰ÁK≈J4gò\(π›CK&%/ÚÃrm∆p•y´0Ô5#Æ®´)“ËCrlwÿ‰uoBóSÃà∫ïc!´ìw≠Ä#Ÿı6ö∏ÀOìˇö6ù3ôs¢ÔÅò◊˙r9W6(Ò1–eÉ™∫†¢€‰m¢ïƒu$©V¬⁄vì¸∏™eªÈkùAr≈gÒ–7ˆ.“Òåp‘xtR g@Çb&Ç˘AÙåL≤ì¬√'$ !p”≥%…[  	˙ä˝O–ÙÂƒ	ZÁ$ùÆ	:@óÖVäÿÈ‰dÇVøÙ∆¥tod2A´~¬Ç0∫	:Î2ô†è9ÁKÒµ6R]
0ﬂﬂBN&S@ƒÄ1íFDËïëÑDh—Èb"’Ç¯ä‰¸z›Ê˘O∞ŸœºÅÊá0…ﬂƒY¿Ü<“◊cökÁ˜ù‚K“côHkFπ˜)‚<ç *Ñ"’˜éßﬂ•˛I∫≥ΩÔ9÷bœÊ"∫$Ä†8Ö£∫ﬂOb˜ËÂ>irTÚ˚ô‹„i›eº$£üâ‡«Øùt≈∑Cñ◊fN∫âŒÑ˝	ﬂzpb/É·æÿÀ¡˛~âûe·îYÙ^ßÆC_8j†º0¨$ñÒÙ¨∂(ﬁ£ÔuQàjóE†K=QΩ÷AùÜc —ﬁ·£P™0Â’)äpŸ∑"Ωœ¯–ñÌz≥Ë°B@kÄR≠Mé}‡.ﬂ≠úÃi
X˝73˜¢ı!˝˙ÕôÄ∂8∏iH1¸Æü8FÙG«©¿’®F“u¢'¨©/§	¥Ã¬*ÔÉ∆°Í¸pVq~qñ ◊(9Œ2'–…◊ÍF√l[u¥Õ`’D∏«ê|2÷Òïy|Z÷¯£èNÃıÓì6>•É00o¸ÍË‚á4>õ+Àq%âó…wvñ¯¥‚= M¸ˆŸ·'¬=FÙÔ'*ız÷˜¡‰>;Ò{DÚÖé=Î
ê˙¬Ñ~ ào#<Bè¬¢´$+ÑÊKø~s¯ﬂ±Qh¥L
ˆŒ∫:K◊öm†pnìÍw0ˇ“_|ºâ§6£ÒÚü"<3Î÷˙⁄⁄ïçùX•÷∂∂∂7ﬂØ]FW6◊ø¢¬ﬂ•«Tj›ÆÉá®∆)ûﬂHz
,	v
iƒ ŒN—⁄èe]™ô)§ì⁄›Kºì‘?˛3Õ9xL—=ÿG4.˛©èì;WèÁÍ%·äg≤ãﬁBó,‡˙–DæÁ§'f˚%»òKKê{˜õØ˝â;äèHPÛg◊˚h	Ó§Z»·’I⁄√M†«´·Ô˜;Ä‡‹5¸-÷pYúîE»{c4,5i{(7ﬁÑÑ#0+v„;eÑÜCb+`
¡Ωª”€m[üìWÌŒûÂ¥£ù{/jU¸Haî≠Ca4¡7›ûºÃ6e3∆≥çx•;¨û¥úl17^Ã…,RL+è˛à≠ìƒ Sy…‹=˝G›™.yM«Vt7i*‹·m¢¡;©é√ßaπ¿˜"ÁÕM±ƒÚ]cï/,*ûn15/ÕØî˜Ç‹…“√'pXLb*Å@˚¥»¢ 	[‰ØAg8Ú*XÍ¯ó	rßÖ9`beP9⁄—ƒ Bµ–ì”·ïørŸ?‰%|e~anÓFjôÎ3ßWØÈåu  ÷@X#èÆèÆÈ’°d‹7tÇÅÚÈSjZlëºùUÄŸ¡gîé6ªæmuñß ™´0ïXérä[],]c6‡±¥6#(4˚tÏ©¥/˝LoMkÄ£[LOâPbÒÔ^?˙Ê6x:≥Òe˙’Á5(O*Wˇ  ˇˇÏ}ms«uÓwˇäÀÄk ƒ+E¬$]  J∞A@9π
Ø5ÿ,∆⁄›ŸÃÃÑiTŸJ≈ä+uÀTå*
+
cäThYf1õ˛"V›_¢ /π}ŒÈÓÈôÈÓôY,¿aJ%.vg∫{∫Oü>ØœaÓSû;=” Y'=r(Ò≠P›s∆; XﬂÉ*Ò§Å}Ç0å⁄>}7à®wÏ
%àŸ∆UÁÈ©1„.∫√UÏÿ_Ì&£ï$Ô1v˘o0g8SC}Ÿ6‰óZÆ«'|O‚|e˜$}5º=ÈD›tÏI|ÓtOÇØ,ª($Aÿ®\«{(X¸EÃç’‹•ãQüπ¸Nø„uÉ$!ZæÇ÷øí1x‘Õ›∫M/ÖùßB vÌ«|:¯∂OtÇc∂º/1
˝kÖ-Ù' ?ˇôˇP“Ì ¨C7ñ´[vŸY"EgÁÅpÚóÈ˘b–[jî€vZm€òÔ0$7#»ö$-ïGiÊm˛LJú]	Â÷PNø∆ƒó˚dìÎÎ}\åœ[Ë3˘¿◊“˙˙Or0_.«Ë'·ƒFvB\˚üÑ—`kBG„->Õ‡"3#º`~ÿ∆.⁄j¨÷„ªr¨Oò§™œ˘S˘?Ú$&-”¸Á_™gøí¯ “F3Ù\öáÓJ<≠'˝Gˆ∆ˇ¯J®‡ˇÖFO[|A>î`[$L<oÈ7∏◊û”œD≥Ü˜±#ö˝œÚ+vO¸(^‚#∫EÙ˜ÕÁ,s™LÁp∫'{í;ÃÉ‡¥jxÌˆÎ·™ÚÌöÏ˘¨·uõ∫∂Çn‚W¬ºÃ„bë˚Ä õÙXøí≠.≥7YÉÎ¸∆¿kCõP&p“bú∑õ£çΩpk€ΩŸÜçù§ŒñÅ⁄3.7ãÀL.µ4∫¡|›îû˜…ÊÉyOÿ›]ﬂo;-Ç!zmÛŸ˘¬-‘eÛáWYµçÊUÀŒ¯ºöÒTÜP≥ŒøöûùüÒn÷ÄóÕ°Åh—-^"zXŒSÙz/QÉÀÀï}ﬂ“˚]≈Ò˜)ÜO›«3I+$˜FHAZJrtË=;Nã#ÿ¡$\<¸ÓàNˆwWW~¬ÆﬁX['˚⁄Í“"ÜÖ/Øl/ÆÆmŸ˝ÌÔ˛˛v∂ü?^g˚,ˇ‚‘€^A¥†ø⁄Ù¬<Ng6†ÿpv3ùUßßrbQw$Áæ\–vÀë`˜M{≈2|¸ZÅäÊ∑ŒÎˆÖ&2q”_«@ütœ≥å•+pS~∫ÓºØœ◊‡¬æk´€lÿﬂìë©~’˜Ä5Œ⁄Ü4G,M°ÿ´≈L…sZè° Ó˘'b{£ÿh∆È…èõ√Ø≠mæh%ãAfﬁñœËè˙„F∑÷]y{D•!÷8ï’îRåw¡¿èI+Ë©È’ı „háê2eWÖS9ª-5èœÈ˜TqqÅÖdÙ$ïS.√°AS˚î¥ï‚qøÈﬂ‚Û∆HŒ7;?%Ç›@§U•*D<N“P#
z	ˇ∞Ú%ññíèkÎÖØká∫dñ¸4ŒÖÆ\úKµ„9¨¢l$Á¥m‘	ﬂ‚>tÑ*†ä^òïW‚Œ~é¬}Ç9ŒàwYTƒt6yœÍ⁄‹ÿ˘[^ÖÄÆä˛úΩâ≈gÊ2F'õ⁄ñ∂§‘¢À1ZÇ%Ä#‹ÚKÂ»:–Îı¯ûÒ∫	ΩÍç6r|—†”bq‘∏T°ôCÊµÛç:√ÕŒä®BRw~–Íòü3¸≈w˝(Ú£çê˜qpÈL7úê_Y5û1Œµ¨ØbÑ¥tkÕ≥@%eoÙﬁ‘MáÑ:äa4ï±RtOö¶ä	ñwæ!YÛ@¸a‚‚8≥ÁÒX”◊‚—(9„Òàrù]∫=ñ»0£Ω”:z›ê?–…_e™2—_é^t/~≤≥ÈT:^Ü˛ﬁCYÉ¿’ãÛ˝ˆ∆"Õ&Ÿé’üÙT7“F.g›8ﬂ=—%ÔˇêùeÛìSSØÍú?ëñÎJt˚Dí6ó»„<kı¯ÜK”∆ŸMË±_¸Çç,~ﬂŸÁK=ªO5Ûˇ'D≤X¶ÛfëÍÅ‚Bù WwÀêŸhZ•‹/0 è<¡ù∞Vûj—9óG∫˛+;œO•È!}»8òpí∑A√Hí^]>—)N“ÆWõH‘Îg•ÈabÄpµ¶ﬂˆt˙Ü◊ı€’ºOïJ™∞å∂o∞œ¶„∏ÍuÇˆAÁU‰ùUT'Pô)W`î"6´áRhÀ§WE$Q»Øq«aùÌÌI≤f⁄Â…1ø´ËÕ»ª— æV˜∆c·{ñˇ•ˆYbŒ˛Ÿ'"ƒÅ>gs∆Q‚y¯;≤{…ï®∂À~‚ÌÿÂ˚@#íg≈.‡€±Îa*`!Î*<sπ†ÊòÛ∆ﬁÇ{-só)ô#∞f≈L`qÇ≥
∞p‰pAÃÅYŒ ≈∫Xƒ	æ`æ‰Ä˛Ç¢˙¥[ˆj)"5&xÇoXﬁéBEàGïΩ¨' π^íº'ñBC(êÊÅ|°u‰≥^;H¥ó∫¬€h{M?ﬁ¨Ø0`y–wuìËrÿà©(_;à´∆ƒ+∏Ω;}{Lˇ°L◊yé“~j  S˜ß$∂¶t$óÃÍ-•mQ’tË,ﬁ5E•é»º€≥óMÏ«ä.vîf°vI9í;T¥·^fà KééuWk_LÕÃBÓã8M¯ZzÒûå}¯ä…–Ø/ÂWèàç>#…©g9h	∂°∏Úí%DLæõn]\
àÕX©Î∫◊1›5r¿›zÍñÄ8Øñø”<sô»ﬁoñŸ)SíN…ı§»µƒ G±âw—PÙTâ≤∆HQ=ﬁÙ10f√Ã∑ï'O‡
æˆƒ<L-tu}{esqi{ı›∂º˙ˆÍˆ‚[ææt„⁄ ˙ˆ€ÿ\¡•*zÈê`%ıcΩÓπ}Òj–ˆ∑˘√gd’#€~`?√¯Á?"—ﬁUg_»‚i
„~°ï…}.Ô‘ç-Çvøy¯&·øA¢ﬁRûÎºò÷Ô`ò,ö¨˝}wúÚ‰∏£÷f-ú"Ï§òT≠—cz•òπºT)*≈ÿ§J£”1Á™¨,ºx;qÿÓÛWH¬ﬁÔ5¯ø{”Á8Òˇi#ùÇÿ(9§ù6˘Ùv*ä+≤õä€P«oeMtQò†·N‡aÏ5~¬]tC&“/0C‡˙’´´K´ãk«zåRÄs^"ßwò°òC ]r•¥õn€∆jFúGö€.j∂åÊg˝|U√Ë€@zîZÓj
ú”‘i±ŒNÁ¨≥ŸAúπlï„‹vUÁ∫÷Ytït2)Ÿja»J˙»*’VK§úç¢ÆmãWÇ¢-∂*•Ÿ,ø†≠ÿÊ9syfjzfz~Ê‹Ï4ˇtavnZ¥Vb°Æ3L¯ΩdêÜC∞‹è8¸°™j√nŒ†6ÏÒn@Ü7Ó7ÿ	ÉåziœKí∞yùÒÃ¶-È∞uç$Âôâëgj2hÌ≥ƒƒ Œ\˛ü{3¡I⁄l!BJ%Á*kìuœúπ|ãô=∂∞nªµK§˜#‘™5©Éà,öFX@^W
¿K#∂§£=q¡•®&,∫lm/^€XY~íã|âä≤À€ë◊Ï£ÿæ‰ı¨å63«(¬»^*1WBŒÆÅüÆ¬Ñt|Œ∫@∆€‚äu∑ÈE«!Õ\ﬂÂ{˚˚Û€%–dí:Œ(‘+=‡ä˘cl]BÁGé„ÑŒ"`ÚN◊¬¶ﬂfÔpﬁ&a¥âPÜ?⁄M?Ó∑ﬁMïäl©˜GﬂÃó!≤¨jË]¸˛ÿqºE«ã>à~¿Ç÷È@ Pq!3≥._ÂÂêér|˘(ÚëôOíÑ$≠u‡aÈÙNZ>íDìrƒaHHïxUê¬k%÷ùDfÜû¬´b¸›ôÁâ”Z≤Ü%—w∏p‡/Ωp,Úl€!ó&TúâÅéd“G—m÷r”‰ÆÁF\D±B„8ÚÆs+jK∫„¬Mú0ØŸaóL	x?∞<Ê"ê“g
È¯º{ÎSgœÇÂóã	ã˚≠EäGaªÛ˘iéN‡ˆÅÛıê<∑$ﬁ¬%Ω0π¥9çå∆HÛìxŒ<P^V∞çèzËrZ|∂ı>Ld¶ø…∂ﬂm%{Ï˚l⁄53∆õ÷ÿdn%|?∑F«úÛöñY©r7vçî™*OúP*agâêú¯¶8;2|[áUÄŒ,¿Ò¡‚ø8xÄ«“gò´°¨AK “$,¯°
'≈p†˘óŸ˙ Oÿ“⁄‚ñ% àõDå™∏≈k	…0Ûß ˘oŸ0“îk‰Åûœ_—62 ÔãêU√k6Ÿ∫øü*˛"˘…Ï’,«y~@–}À9`z·<îäv¯36›≈˜Á,Áü¨ï	æV\¬!&dîÁ3úœÆaEO4!W	¯®LıCQ˙¿äÂÑY˝À˛.‡&48Üö’(‰ü⁄˛-R¶c:X·ö2o”m8Øz\î©u≠2>6W±Üœ∑#sz´2" kQ} ÁkldaπJF±(2˚®îr&œÈ≈Î∑ìQÉDÏ≤—7∫˛>ÆÎÚ◊õ‰B\áÀp,Úì~ƒ≈Í¬sö§∫⁄‰2‰˚¯ÒßﬂΩch+\˜˝h…ã˝—1.Å!ÿÔËŸ˜˛è7ÒÛ©â7œ∂∆Ÿ»OG∆ﬂ/Ø»◊ –)∑å~^å">≤ÃÄ¨O16˜⁄0«G∆Løvºûºir¯{› Û,ΩóÒô¨º.ÎÀljÃ:°r∞◊w~∆án“ÇÇÊÇúˆq√œ0„¨∞¶[ë[‰Ó≈ÔL7Àâ[ê3´Ωgµr∫ÿ{\öøilYQÆ?¡ü∑#∑ ﬂN_önO|Ø±«9@ˆ~Ò≠q8§Ô,që‰•˝ˆ÷)”Û^ípu »oµrd~É.Ãá–«¥t˛íÔôœ9NMæö#”S”#„biG»˜9¬MMfz+}hÖ?ƒ{Uû∫ê>%4!v≤3*0Ê-∏Y¯Ó–@‚¸ %Œî´ZÉÔ©JÉ˝ﬂ4p+–Ì∏îœY_£·Û≥$nçæo`9á\#ªhL∑Åz¿ˆN≠;^ÃÖ9ÒoºoËÉ?∫ÿo…Z»_ä|ÄµÑq1O >§x„Va¶ﬁM≠:œ@„Ì€A«˚…hj‚ Ω˘»»ÿ8„gﬂT·˘√√º’vb∫Äµë-£Yø™boêc›ÜeQy®≈<+À√y/ì∑√F”7∆3˘˜»°≈Ä,–ñ¯$˛/ójZv ˇóíqÇ˙ÄÊ"±⁄¨qåÊuÌQcïPbUÎÉ!ˇivßß«ŸF€;gÎ\FÛ£ÉR∆W˝Ÿ((⁄„}◊êø∏Òˇ_≈=¶Ç ¿n{_v,.éﬂY¥˚˛q¿îõˆ rÒ!n!TU›Ø [L~Y8p∞Åop1Ÿ„˚˜≤ˆÄÅ?÷íÓNdˇ˛Û
+ ê˙S}˚¥]NÅutËc
ó˛HFä‘6xl˘¢j]‰øÅû~É™ºõOŸ@›⁄!”]ÃávÂ6âœØÎ°„=g∫+yêx[˝®_7j ŸêRáæÌåËÃÂıPŒÛDy5˜6Ω„wzÌ¿˜cT˙G˘ü„\Ìæçìo≈ ›~‡\∫√o>Tu⁄;=¥.ß›˝õóh∞},\l1ßÒ∞”Ò8Ì@9QÆ—ò+°ºõZœ–˝ê¿ˆ6*ﬂï6∞¸´ˆﬁ\ 7mmi7‚ﬁNM1ÉÀ⁄ã„Ï 8[zùekKå£OGF¬IOõÑu˙Ì$ËµSc#  ã'k0@v¨ó*BˇÍNx€èÎÌGs\Î€è≤‡Wn?‚ÎéÂ
[‚óµ7•)Õ^EêÙ=(0ŒFñΩÉëõƒÃ„Ω
Ò%˛Ì ∆»É≠r2Ë6⁄˝¶CS∂2õ[µTxZƒ{sç)⁄Ÿ‡1À&µÊ|ŒË_WyA∫àŸ5Å⁄äÒâYÉª¸&?Ïp‚lõË*<€Z»\ä”âÆ∆Jüb’x©0JK§4HÛn?µ-∞ºôﬂé˝!FH÷Ö¿ﬁ‡;(∏ »úø[ÇX‰•ë£`€Y6?;U¿ú'ñ±?ZÍÆ£ìÚ˜À∏3DAπ≤4qGÂ2.QY"y\¯©ñØçå=[H-~=¯zﬁâ≠≥ˆ‹è …á«£Ìz?Úze‹^pqn%Õ‡_YíL≤˛Vo`÷O~ßîıÛ¶Ü¬˙[ΩS÷Ô∫éìıK£b˝¬π»ZΩìg˝r0⁄@$Îo¡Ω-d˝@¡ﬂ÷œw∆K¿Ù◊!n .}˚ ˝[^7¡2*]¿hŒßo˘Ë‰õf‰ú>À¿¡º®‹ÕÉ¿R∫ qül1”*'ïK1◊¯c‰üÆW´P”k≥ç~œ
OKqúE∫ç-¯†N	’rÈ2†¢¢s’V1ﬁ¡nIx%çÓÚ€Ü^™ˇÑ
´1t<ñnµœ%ÃÊs6˙=!ô•¯|˝"»Ω„›æt¬xmøCÕzÎØ¶Õí	¥Ín…Ö˜∏∂ÀÖo˜~y˘JvÍô\'Zæ≥^î´=ÕXº3ÙÍ™ﬁyƒ$¥◊∞LÁq‰„û»Wg:|ÛËU`y>ô£”ú±¯%Ö2øìˇvï2∑n\˘— “ˆ†¸Õ⁄⁄‚ï[Ï⁄‚∆∆Í˙€ˆ:ô[í∑$ä!¶ò	H*:1`í•/±Xè(‰:S∑9⁄ÄÁì\ ≈‰8C˚› C†µFe‘3ÉÙ@˝F£jˇRdÁ=?ÁxäxZ"Krt^\ñé∆cÎÇà^ºÜ`NX&Û  cŒŸ¯˝Ôﬁ—®^ŒN(†˙?´™Ò´"ÁÑ J˛ì:*ë‡›?|ü3&KÀb_8Ädá~ÃÆyΩüû˜À–êçE√Ã)™öUƒ\ë%T‡ﬂU6O~"”≤ä˘_(ÒË~∆ *°‰üjÍ0eâ¡:‚4c(a!∏í5ºƒká≠qçQ‡"]Hfı£(hÙ€˝g	=K⁄ê%q»•cUœWâÿY^µ*˙ãI ≤ÜßTN"™zW(¬hf≠∂2åŸ¬áGn‹?ÜØ0Ñ†Í√]§!0Z…∏˚äıeÂ+rHµ’‘Ìy]›>Jıcs-Ñ2êﬂ“¬sÇÿbK¥)óhSZ7ö>√sÂTÀ4˚î´£Å,p÷ƒ9eQTõ^ºó∑Î»åTP”çñ—WSÉ©ï{ôÊ^‰iÊóÊˇc=â¸è¢¸ç»Îü?–SÀ•ü9.ÒSÅÂüféÊ{1Â…bŒ&‘âS:Á≥«ßÁ¿O&°hè`ª1€Ò˘n≥±R'.å≥elpbπôÇ(n¢øSßëF¡ÂΩ[y©,#ı&f›´ÔvªºDÖmfÃrÿlI+– â>Õ2gKôbﬁnçÉ÷Pæ\	Eù†À≈Ù˜ÊSﬂC)ÍüZVæxìp≤ª=?ÃY`›1	ômd∫;
√Ëj¢Ó%s#ø„-"Ω*"À§ó5Mùs∞’"’R)¢˙Ê
*π1·Jgµõ0Êø‚ïÊ6“›.ºé£?ÂB·™ÿÔê¿ *5~XÊ£ƒõ*‹#^øQﬁ^«h.πo”Ôp…ß©ÑﬂÔ¶ v#ôYœ å)√/7ö≤ó+à®vys ŒMi∞T"À,√OÍ ßÈU∫·∑#~Ãœ‘AÄQè:Ï{È=Œùn7≠ªé…zïë1àG@\H-ï‡v&€◊(∑Tı¯“°fÁj[ ˝ÛÁ≈y£°aÇÏ¶Üç6◊«ãK<åJNY \¨¡Ç?"g–ÍIÊ€›b”lâl`ıriØ=£tÃzôÛBe∆Z≤Õdi ˚1ó	`*ùqBÜ „ÈrÊß“ï˙¯§Æ_"µX|{⁄”yèù´µbú¸Ù‘¥ÎïåŒΩŸ"û`MÔû¯:o¬ÃŸgø}'Ñ»õ“ªv˘xÈ˝¡Û‡˘7Ω´ÇEz)F…‡)è˚e¶˛ukÇ6]nÍáßèF˝"QÉ8›ÜüÃø9ïìrÔr≈Eb¯h\O`‘@x¬Yz*@˚ÿZÇtıß¢⁄SE›—`V‡v•Íå+‘„‹çßX:≈ÈcáE»˝rÍ?ÆMXÆÔ8ıúå~≥(@P§vìc,lÙª˘ìvå%·`ZOÒ‹±Ct2£r‹n’•ß¶óﬂb∫8ä›ﬂÆOïägÍ∏*:~ÜG™/ÏıîÊ¬◊–Psa·hÇ|™:çÌ©Ëø=1ø“´TÚL∫nK®hÆÍ2Dä	Ìê¢K
'i·+ç	éçÊCKVñW∑ñÍÚ ˆ‚Í⁄;ÀñÆØ_]}˚∆Ê‚ˆÍıu{Ñ…
gã«^¢5~[íè-ôJp	Û∫A>]∂Î5Òﬂüáaáˇ;qaû5˚÷rQÚ4eÿq([~í«s¢céCπãz€ÔÒ¸Ñ¢˙3\
CMñ¬Ón–ÍG"é?hí\^è¯í7iúÈ@„,óÜùö(ú≤ ıÛÃ£˙ìJ˛¯5
_SÈsd
ÂmKÜp UÌ˙â,uM0πø+˙N≠3Çñ*π -ÅIàÎÇ®∑=ŒÛ†.Æ» ó"Æ —-R*~—1-⁄¡q–2X@KU8‹jÄ∏Ã±6∂ªÛêî7zMDçå%◊Ñ‰/ó”*ç`îGEÇÃcA∫¢}Œ1⁄Á
bk^ÛèøΩ«6√˝ä~ìBúB‹)î7∂¶˛ñQö∫,KÈ9ô§û°ÉRZMXNgâÖ≥ä}≥‘∫)lõÖ-`}†VÆ0IÓº.±g-û.;LEó≈Ç≈ÎŸüÑ°∫?‰+“ph~·W2S»j8-+ÒYﬁ€yÖwÓ†.i*›€◊Å6óaÎ9P/·zïˆû ‹¸ñn>á€ÍÑ9ç}	î”–ˆPÅ9Ìü8'vlˆ£_›u O@ºRÇ´ &º&å˙ËÇ¥«-Xò∑Tm'∆uµQ@∫q∏u`ÂiÈå,;w:º‹’3¥˚®£°=Ì®®ajhgM°∆ëéúö®åpΩ¢ßî›"Ë,äm,ô´¿çòåíYMƒ=øïÍÅ¶—r‰…õ˘§ıQ?Cz‚uìˆÅà«∑ñ…-ìe¿éuy§√Ú˙"y‰ppi›å“äÔòuèhº<ÂΩRV¿† ëpÂê¬2ºπ:F$\•`a89/+áPW‡0∏jÅá¡U@Æ∂èuïƒ&ΩÑQ ≈5ªY%b}P<2∏‘&{˝xØå2‰Ue,”·◊m9 $áü?º≥5-%ﬁ°ÙlU„,Ë	†ö¡Uœj[‚3eäV¨3∏Ãxg‘Ó¿’«-‡(>Ó @îò]¡≥™jÙ¸\πìâûW|^ô∞mQ⁄∆Û≈ïäf?èÎ∆·€rMm˙ìÛÆ‡Y3@Õ@}W®æŸ¯Lgˇ”
˘¨“ %cëÄ$t;ıò	˝Gw(ø+òﬂñâ&§"Wıˆ4·N&MqŸBÀ¶I◊≥v∫$)%ájÿ’~áC⁄æ3k·:Skk9§´|«Û#CuTÈ°N¡˜àTÓÊâF&Ìoò£Kû„O)!◊Ï…~ÜM‹Eqı∫±öW˙Æ¥BA˜˜d‘…y˛	∫•üRÿ/ÂÛ_‚àˇûT˛Ç?|TÍπﬁﬁb∆ˇKˆ|∆5å‚íÏ±˘Ò‡L‡&äªD{Ê$ªcœœd!°ñ—}^≥…:a‰è√-]Q÷>w˙ÛÑÍ£.ˇ∂›@oKﬁ∫¨åﬁ„|∑Æ„ØŸÚmI˝Êõˆè∂à	:èƒ\,V7=9_EûM∂˛QÂK∏émrNÔµÉñ#—gíÊs“Õ]âﬂåï$n´LŒjô€p{FœpóûG&:9ØÚ†´·¶Ëº˛
JKı$o„∫‰÷"óe-≤í19∫í,&‰∑ZôÃï“î´d»Î4•Ÿvï•4KÉ@$4„∆®‘ˆÀô—\'Õ8Sü≤ê_[≠”ÊXe”S'ùò”rê¥yáÀ>WΩ}J•w¥,‰7ì†„«Ó	J∫±ç€Q∑mØ˙|ß≤U:∆•‡ôU˙Æujíu'√Åı3ëLdö)ÃrHVŒe›üò>ks·˝√…ç”-·v∏ó˚`{°úÃ1-}’—ÓN'µ'ƒM¡Z/œœó+‘6&8í1Á’® *$§çΩÉ8hH__&+¥QùlñÊ∑Ç®J$¶j≤R)Èx2(•ßÄgóéîo8ß[‡:í`WY§´&ÃŸS6iv‹…ó•¬ö[h™"†ïàf5≥!kÊC¬U!—Sƒª2:Q,s•uVãòíNh¡ÅÜî|9(®M=7ß5£ G¯‹ëç“ ≈\ÚÊÄVÙ’ıÌïÕ≈•Ì’wWÿ÷ fµΩ…∂ﬁYΩ∫Õ∂6VñVØÆ.eìﬁ∂j*Ú≈≤£¨õÛßds/©]¸FÏGGCØq≈µp°èÛ…6D†ß∞yRfÏØ•ÄÀﬁ"Yè8fgSÀ5Øw$zmÉ≤;Õ©∫]YXñ+ÿu≥Æ∫å·6üµDìˇT°&Ã…“ÍõÆô≠øÑˆ®[x≥„ÀhbiÏ∫|[ÕæÃiRâJîßÑ1%"À4µÇ—ncy
iÑùù†ã¡..|…]¨ÃƒngÂáΩdáo‰xTœÉ%„§∑∆ˇü4O⁄Âá
ë©˝íZ<<)Ô¢mÜ* ^Ó@˛∏-ó¥<,£¨•çGµd∂‘L∫äÉûù.8 ãV\‰˜È1^°√Ÿ¸æŒw∏Ù¬WU∆>bÍß§˝‹OÂF∏j8óÂ≥‚Aµ0º‡–_o‡?È{ÂÖ<˙L·€¬nACzﬂ*àõ˛†Ó ¸∏y5ÕÛg [é¬ﬂ°ˆ`;˚ê Cìµg+‚UÑúπAÄ¶3Øl∂ÑŸè¥lD^f∂úÒ¢Âa&‚∆í|ìÙ¶†Wq®U1êÏ%Æ)vªx°—¨Üäßàd‚ÿ„¨ÜiE^«du\»UÚ™BSπ,3d†At’%*ˇ©3d=î‚ãJ˚MNÀí/“ÎéﬂÈµ√ﬂÓK˛'_√NØä≥¯ö(–”áí˘ü§¸^N?÷°èTÎﬂô”°ﬂWŒOeâa|°Ñk£vOª÷∞]2 ,ùºPRYL®‰ Ñ´é;Æ⁄.M∏ŒûÌá-Æ≠•í1WŸ1öBÇJÌ—=
◊\§pëÒPÑ_hr¥aÕ	◊ç±J¨z”‡ΩdË anV9Ø∫=Í¡{{í±‡M hG«#Fõ˛U
/M'Kzc'¶ÎÃ3˝=ﬁ‘M∞¥÷hÖåíÊ¶™˙ùÈ≤ô-ÀÃï˙U…œ,n≠|ß4œfÛX¥ó]0—YÂ°THu◊7∂Z%ˆ∑RÙoﬁX9£+”¡§∆L1l∞∫r!π287\É
Öœ¯ôl.R·ÇTFŒ…G)IïDƒr˜∫∏Û•<(÷ØØØ®Mzz2ÿõ>=ƒu'√Èaê∆Ku»∫
ŸB t£
1ºZ)l∆ü´‚°mﬂã‡"„í		s*•@ø$“…¸|º¥0ú%√wôNdµ9K‚Ÿd2≠qYÅ1ì«bTwı¸¶üJ+˚…‡⁄gfB™Ÿä Ù⁄£≈a´¡‘Ú`…äc* {Hñ∏«2e‡#Ud¡TÌ‚t0}D˘T∂]´ZSÃªÂ|ˆ€~.|º“6∂¯}“ÀfÆr€xgD†¢®ÁU#f_fLœô“ ™-VY,|ß‹›§_B$äiÔ0!Ã»Ü„∞„K<àÓA2ë1Â•ùJi¿ÈïI∆∑±%È@9¡&ÑAàıóÈìŸ#Æ“ à—WÀ%NØ∫Y≈È•ÚãÂ‚Uí2fh$ñ$lµ⁄“
-fe+4_¶J¶g5Ú·‰´Ç´~äpï{.M`MØ<‡‚DS!Ã÷†ÉõçN◊¸ëZdÍîï+ÈπEÊÚÜÛ’K!…Ù_./È7Wt–¿UMZÆd Æ0ƒív eæ≤†|ki wT~ù°Ä–π>bˇ;ÏÚeÈ‰Gªﬁs {RôM—URï∞WùlΩÑEâ:£Ô/F>;˚Ã€â√v?Ò€úYâÔˆΩ.Và∞Pû)ÄáÛU•Å
Ë;S4Ä])„…˜«‹*º€‘"rxR0Å7äîÍì¥¥M≠vö{Yøﬁ_=¿X˝©<p¨)D3RU
S¨ÿ…“	3V^∂]]• á&™£W˝¢v¿‚¨0âMÃ§V\Ì[8+s≤ç;ü—v`ZCË©èX'_ƒƒ}ÖJ¡øí∫{¸˝©^ØAÁWQ“ùe>H»DvπÇ≠öΩîQE‚Œ~é¬}sU›õ9[gø  ´ à˚è-ˇ◊˛>ÍìüâpDX·{L˛Õˇxº¿6¬8iE˛÷_≠±Q‚:§Õ/{â∑VÜm~Tòo ˘ëÇŒÜ~Ã’ERœ3©˘\\Gπ'h>7e©Èr¸uÉæñ!≥O…ú„uVŸtØN◊¬Ü◊f[ﬁ-ñˆ…I*Éú¨¶suK;;YÏ¡qÍi∂Ì6º¥ÅùÆå¸∞ÖM‡cYÄ9%Óÿ ﬂKjh·ÿÆx8ÁÈ˛|ëÓ/H∫JÒ¢£”¸S¥êQ=¨ß*F¸E◊fJƒÉoá≠ÉnÉÚ?#U,∂Û%¶∑ı»›µ„ :∆éi1ò¸–î#„˝/ÔÿZm//Üó®∞…V”FGì®Ô≤[eˆ¡jóØ∂5Ùy⁄.Lå≠˛Aúqr“)◊Z8{ñmù>–,kÓ∞¶ﬂˆDäÁ mÆ= ‡”∑Éü˚ôUÛo˚ç>|≤C x˚^Ä|l#
;AÏèÚˆ¬6gè¥?ÂÜﬂé≥i~<∏4ë™À∞Îµc◊:ã5jÎ÷îÙ≠œ kIíS@ﬁ@:÷yËãb¸ﬁd1?∞üj,vìrøKÍàsŸ37ÿhèïœïüT%9´Í£XÕBÿÛAr z[ƒ´ïãk‹ ç©„Dl»Iú{\∫ﬂ	üÙïA°'wL$8=¡ã‰º`4Ø,$Ûì˙ÃÂRó]S3KÎœP(˚‘‚ÓRÅÑÉÊ∆yev—¥hl~)5 ^¥Íìn«ç{~’¡ñù‰I®Â√ˇÔÃösÕœc<∞©¬gà™•€g˘âR≥íQ]¥£dÏH≥3p)LÀ◊ﬂ)Ωπfi√KÆlYC(ç≈ÿ‚Úµ’u∂±y˝ÍÍ‰ånoØÆøΩ%oÃ?Tªßãã¥a6¯!Ás%C)æ√ë+Ú”q7h˚X´	
°ƒbv> ä¢©∞BÜê›%ãÀvBLáÉ˛À†”ætÁ¸nÅMç≥òê\ãûöº0?Œ¯W”ÛPH©¥‡$ôßß’””¯ËîÒIˇ6‘™™–i·I›Oí/ƒ8[¿|iEﬁ˙XÛeµÍç "\Ê|Ê˘~qc i’(•H€‘|c~6s∞ı¯ah_oa‚©d ëS÷è\“≤ÈLE∂Xª\"§# ¢Qì~
ÿ5¡.9ê}¥è˚≤ŒƒB"0›ﬂKìQ™(QÆ–á¸OëﬂŒ∑-˚ñ…èe&C["qâ]LæÛÙ‘‘ŸÛÉ«jæ∏J¶å/Uñnö˜+b.DÖe˙¨AR~Æß?ÜNqM±¥]ØÖ>ìà≈1ß.∂ÚÈbNL	>{böA
Ê…Æ#µWh®†Y∑(W/ãµU3SJIïÖ©¯ä€“F32òë
™ç∞BˇK[ã!ªñ8ıÇPyR’›´Q±(·ê	¸˝1ÑÃk€òÅˇ	§ﬂ74Œ#∑D”Oº†+=2£föAP*Îf≥Uk" ≥¬|Rî¶¥vöZJÎ4Ö?Ÿ*~∆œ÷•∞›ÔtŸ[º≈ÂÔàΩ…Æ‘RÂΩÚ'Ä]s˘'Î,…¶ôSÚ; Ö0,¸6ü˝é€≥
ª†ñÕÄò1É¬ú∆U†ä–bÛq ¥dxC©∏'FÆ|Ï≤≥TSÌ4Ygá´àïä_x⁄ÓB√¿dcœãì—©A∞”ùi„:Ã4æ´6U2è\˛]Ã$/Nj>ˆtÄ`SK Ò]	ÀÒ\≈.ö˘Ö®dá¯∏	∞Nêí<uCÖä“ïÚkôŒ8ˇz¥Óy%ì ·+W]*˜ŸÁ∞ñPÚk‰ö¸´Á”[]Æ†≈Éí`:¯*Üè"í∂ñÆmM†>815]Ü
S◊èØ∆Ï+∞J†{àÚE`ú»˘üqA~ƒ•0È˚«º"Yˆ5ª†”Rƒû≤⁄÷≥e+º´√Öä∂]¸vs∞ìÂºZv;“À0KŒ…˜¿zæÓís¶Æ´a;TàË"U>ìa˘èˆû“Ëó‚Q"=^ÖEËì"˝(ä÷aØ!i∫o,≠ﬁós»ñÓ–?¯•.Õébíﬁ®ƒAÃ7î∆*ñÄ6Tî}–ü_®pñtVãzÉå≠∆F!4’1^YI∞$∆)˙‡Y!èÛÎ±E#ÀÊ
≈/E,ìz¡Wh;4”QWhçün€Ô∞9V:\ü|M∂≈?†¬˝\˙J®~ä¯OïèH9«]s}w7h^õ¶`»«á6èkÁ`„√ﬂ3ÿÏÈn±˝é5ªˆ`XØ«n1òsI»˙J=¿Ò›ƒÉ˙SÓØ–˘“ÉÒó`≥ßªƒˆ;Ïí∑˝nã™Shˆp©ˆ^ÅùÚTsΩÇ{Çﬁ∞⁄f†§µÈ∑Ö}üÄ©›·P∞0‘Ω~´ê©‡"Èí<˚,“€5ØÌ€$ocë7Îœ¬õ’ˆ´¢∂Â∫π O\[G_°?‡9%Mì ãwÿ’ıdœ!5}°ôÂƒgëí=¢ÚÚÀA‹™pé+Ì0l≤∑9≠Ù^yÆÒD¡	)ªöäÈ·‘ÛgX{·„Â&;–ˆ3|éí∂} UÙÎŒ{#ãﬂáäŸãˇ+¯˘
~æéüØ„ÁE˙aëˇBeµ[QØ
zc∑ë?£@·Ûe¸5^·i¨º≥ù?⁄"`”!ô\[~ê‚fÀ5–Á“1¸Ä	‹
Å=˚úQp˜Àx>vˇE≠˘ûk˜G·~|ÈŒLÖö<YˆÑu´ÚîrÖ ¨…^>!ôkqs’Ñå√±æCY«.Xl61¯˛’ﬂ	ˇû¶EõΩ,Ø˜Ç…‹£Qõ‘E≥ß‰.Ø·WK'HﬂX¶ÕVÉ»‘ (_Jv5"PÏÁ…!8fOó/êì)Z…ä7Ï…••úäi¸µ¬¢ƒ[f[Gfâÿ2zf…‘\S’p0Te™7óz—åaÂ÷c*Íê2Î3!ù$›<—úﬂQtH≥4vÄÏ üœõÜ®ó%ha˘gq˘Í∑·d\[\]ªr˝ØŸõlqmes˚d3
ÆyA{'ºùÕ(0Â2û=ÀVÅ¿∫Ñ∑„C¨√œ.Ø% 3wöó˙˝{/∑wX–§(~aU˘±Az![ç€^áç¿¬∂Å©Ec#„ÎdÅhÓ/»~?ÅnÂøy"—„ûKYp%äEÑı«5ÎO˝!}.À»oπVé$¸é◊ﬁù¯ﬂã⁄lÂ6sF‹Ò¢b÷à¯¶åè‚-°B=ü·Éq6=µ0=œØÒ¸€?ÍÒ˜ŸÙ°ö<Ñe‚öå≥UÖÒ±4ö¿∏4’O∞R}ø◊;ê“‰Ë}ímÛ;EÑtº«%6;˚=»|áÖÅ®ZCß€˝€ÓqÙÀzﬁ∆æ/õ(7`5|Ü ùZÁG†Z±.Ω}ÄÂF ó∞áïC9Ω≈ç π'ŸF€i≤Ì'¨≥∫ R±MD>†ñ•wn'Ù¢&kQ£œ;õÑ◊€Ê¸ÊàÁ/õ!7>1ºgNêxÇ≤√<Ï,QÎåF≠◊(Ïúø¡.[iˆ%p˙,!’{‚ R!πR_kqÅ_)PöóOÍ“Jô≠„8¯€k∞ì70‰7f¸8
¯‹–H€a+NâÛo|æf'–Yä…Óx¯ÑVƒ©9`q“oBp6Ê¶z-/ÄÌÆ¶>Ú[ì/{p¢>; ¢ô©ôsyj\Ü6¢†€zºÖ7â(U+„¥||âaïŸnƒ	¢…)0Ú˘] ÂÚ°Aˆ^v!ˇs9†¥ ÑR9
·]M)Ÿ√1¡¡WìK™r^ëÑ&ø[ñ£F“ä9ãÉ∑Ñwb.1≤4àÄ¬¨±∏Uä¡˛D3˝nw\Ã†-æ&0úü7È≥ı˘[ÕN%{H∞W¯∫∞Mø≈áÛ)–)-7Iää!π‹Fƒ≥:G∞gΩòÏGﬂlT~)„∑\Niô¸*_≥Ô>˛Ò≠£Ã_Jf˙@Ü∂n˙|BÓ,≤˛(;¢⁄Zº/ SΩ‚,MÛ”¶=C≥úÉÖ}Æ¶¥É|’¢ve¨s¿πóß8±≥ka‘ÖÔAªŸÁ	WÈZ4…V;\cÔÑ|≤¯/–Vûdﬂ	†ÓOG2Œ˙›VY∑¿‘˙\7‰§ªÎu˛‚\ßéqìS6§~ÛŸàT^H‡ Úãπ"K∫€„+¥∏lò3Næiòﬂ˚≠=Ï°˘ ív»ªË"CFuïÒwàBN‘)j‘®ßÂÕiî∑EáƒñœE[8ñ=øÉÏ"∫gnWŒ◊“”q7WÖ7P≈√úîs‚.ÂO§…Ht?Ò˝⁄)‚ƒR;Ï7Ÿ.å˜{Ÿ‘v/jÏÒôiÊIp @ÇÀ˝Åc©µjËzzÜØX§1‰à∆f`ô|q{ÑüÜ+»¥¬æµΩ∏}cãmÆl\ﬂ‹^Ä≈o0Æd@hà¸∂<oÉæâAåËœ¬ùÏ´|Éﬂ‰ãåP≤QëXè≥]ﬂè3 ?„Ãó˜≈ÇN‡l˜'‚=:®0H}çË†'d@_) Œê¡Œ'aƒeG$9<[H'[0Å8€›Ù˘_ÕòΩãõ'Ù‹Lé3îxÛY+ÅˆÖÂ–Ç»Æ	ÂJ~ætG~:ƒ}Aµÿ—2¿9E—2êóÍ•e†®Œ4®L*ÂPßw€î!≠|˛êOıwPkò‡¢'∑n\ôX∫~m„˙˙ ˙ˆ€^Y\zgeì˝‰˙Êè∑6óVé‘>i(2$qË-{ÒIçóúQÜ	N-Ó,Ù¥†ÌÛj-ASì≈Ûº∂qÅ¿Îv3ñß;¢xWöGïÕ„÷R©µï∞‰PÛˇOLOeSò-	”"MZª—îmj∞X‚SKß1gœsù†ÃggÅPæ:Ÿ<úÛYÙWK.∞ìN≤º~âK˙Ìú√ê|Æê,,ÖE)X%LÑ` ·å¯ÛCÛ≥QDîê.~Ω ˛Y|Ôsß0dxõ ≠*£dzÎÎPöı-ÕK∑„*ñ•∂Êk\9o zNÄ3xLﬂ#%õ‘-?S	?…Û?≈œ$S~6Ï˘Õ~õ≥j‘µœ≠JÊAœJÑπ|ñ	ÄsëÀÉ 1œ1—[ı∂32ü»7N¬£?í0≠R®=˙Ê—C˙é“¨Ô·,¸πJò^√ß‰m8s¡zÚ&?*ŸËÈœc¶)) ≈ÑC.∑Ï√ˇJ≤Ët«B…1ò;˘..qNŸmzπl˛sº€s˘Õönﬁˆˇ∫ÔéØ0ﬁÚ3¢çg2i¯xãfR≤>ˇÊ—/ë,e’“-!ÅÀô>?≈6˙Ω†}ºõ§t'ˇ@ûN˙í,.8bO∞•p/‰áÙVüœ˛≠ ££o.˙já‡G‹ tüÓçíΩa5>ìv[ïj˚Xïûåëô+>‰=~ñ/2h¬oìâÚ®;FÅ0Î;fféL©¢”˙€FµöNôÜ-À/”¢ã‡Œ∞0(	ﬁ,Ê;Ø–¶ˇâdHd~áΩ¯1ì)G/2Ì[:«˜¯vG‹õlMø1[Ûv8ì 9ké∂;Â¨òkMrx·J∏;M[µTDl∑ä@Áµa)ÉÊß.∞ea]L8gëÔÅÃå•û2.£|πâVö¢zé99∆|VﬁG%IÚKr´”Ì.ôJf%Dè;Ef8ùù\–†8 ∫N13ÄRÅmî©T¡ åUƒ‰¨AV~K•èû…ù'B»ò<HyqŸª¢Fõdé:8ì˜Æ±âL†lÊÇÑTî¡Ä∂ñ…I£9U1úâN»»!<ÁﬁŸÑEzsˆH™I∞’øÊ∑JÒ`±*˜qêµ$˛Ywiv Twâı¢B0÷O≠…_Q`)1È∆n©\Q2ÖÌ∂≠^ëÂÙpÓBÛV6 ƒR4ùeûπ»Ö¢÷o2zU⁄£≥f–ò<©	ÊõíŸLëÃÏ™!£h∏∆êµ ∆ê[®C·UrAW*Á2¥Ô¨≈c-,`ç{…Q¶î!åä72•CæÛæåDKw≠¨ﬁòrpF∏:˚ÆNôè•áˆGk8˚9;®˘¢cΩåX⁄Z¿∂ÃRCNr25q¯~q L´G{´2êîÅôS0Ê ÷ ˙ˆbìZÛ4~eyzÒ
=l Ÿ≤ﬁòL∆ô«—@wä‚ˆºn≥ÌîWJqŸÒBÄ–ñ˘ú¬¶Øu-@ﬂ⁄®1‰‰=Œ*«∫ß6.Ö8•?"ô"WÓ·ä<QŒ}Ñ˝07Y$<“Np≤JÏ‚
Êó&Ö2ë¢bZ§‚X0é<‹πˆí…äEAn 	ë´x(2Äà7œD(.SéäZ2kªôD\5ÈÑZ'≠Ùõ©Üõx≤üasÁ¿¯Ù˝åmöÑ°πrŸ†R˝À"¿Mù@wwÄ;	¨÷eu◊ù≠ª¨0+6∫∫<F+%¸≠´ÀgÏ!÷jèZ∂¥·WÈé¡[Äπ8)úª´∆é¶ ˜kÚQUGå¬‹·Øq¶ö3∏%âó¸=>À~tÈñ Ô˙Ùî1úıƒ¬‡ıF¸–“√xUº3Ú›öènÛ…æ:dmÂEô∫ºíÒ‡Ò≤Ú≥‘wë4%èU¢ZjsH4+P™QÏKLÑ•!¯F%$õ˛+Ïp÷eØh⁄ìÕ8Û
s]+s†πÛºπ1kB¨’”;\ ‚ãsÕK¯„^b}ﬂﬂ»ü¢ÈÑs˛éÑiÏ_k©÷Æ\¿lYﬁÙn≠/Ì≥+üvÙhÀ≈¥#Í;Ob;Ô9FŒS….&AuµH±ÇL4*¸©èíÌ	≈}?Òbè>¢ì˜˙N‚‡-#iB°√]à=3ò≈ålÃr.”©‹ÌwvL€≤t/ù1¿ltº€óŒLõ 8
?ŸU}nàU„Öô≥{j¬8–óò[k9∞Û:ÄiªÕ,Æ¥"ó~k+V”òŸ≠Y¨¶∫nõ_ç•é>íœ2(∏À⁄m2°® ï4ì¢}"ü˘cÚ≤d>é˝`ÿajãKK◊o¨o/Æo≥ç≈ıïµ#5ØG©-6|)Øõ-P-mí-B¨öé]z«S?û™ΩLÅj¶u VM[˚´A◊ÎbÊ∞
åú≠πC>E£ﬁY@X:·H•®â©úÁ˝=â$ 8à¨Ó*ÑO/ÖÌ6%cç^õÿûX6Üj’â3»ÿ∫µPÉo˝◊ÿ∆ÖûL¬ƒk´ækti™:Rà?–∂ûõ›
æ>XÇ¡∆˙±rêR6¿üòIïY">B1zÏôΩ…ñ8ªr¬q≈—Ò”˚4P®l∑Ê¨pwÖEˆ+ÌÛ2…S›πR<πÍ5˙mHG èëÔﬂ/hK0]vø∆¢?ËÆFoÊ	sá†rÂÈ?:&æ`Zu9»≤ÕÃG.Gñ"©hñÊf Â≥8ÒvwÅ,}èã”GèØì¢Ûn›#lúeŒΩh+hô|…ßªGﬂ=_®
4zÇ’S-éÓìmD\R√∫üHô#¶ÇX	ª¬Èπ€è∫sTå•}Át˝Dt6‡)á}é8ÍY˘|√?‹2Ç≈˘¸â6·W§=—ïq=0Á◊˘öRÒ‡M?ˆ£[˛êè≤b¥Î„È∞ 	${Ω‘!uk~≥≈_ÂÔ∞û{ã≥†}Ô†≤{t˛rèdäW¿=˙{⁄"YÒ;Õ)	ÙâãÒçs˜e x∆Es~≤@ÇÌêº¢‘ÅhÛ‘/˙r˚E˘È1òWÙ*=xÍ˝˚DÓÖGTS*¸lõ”ﬂQúüí4˘ø–‘0S4uÍ¯Dè‹v≠„pÿ2±ˆÖ  –4¢QÒ01*Ω•:>AH‰¶»+Î˛†i©œÂ°7™§˛≥Ì‘FY;∑¸i0@5SßÔ5o«ﬁıSMÒ¯RhÔ$ã¬pô±‡ d{'Á#}ıOÂœ$t∆◊Z»Ã/—˛Ô¿ë˙_Ç»:†◊±—+À€cÉü«6è®âNW8´=»0¯!µ4–)ÕgÅ—åúû—/3Åõµ¢n+ä`!ëù]ÛìΩ∞9å£ªÉ-ÉR©•”ÉéùÉµ˛2˛√îö!&ˆß±'–∫◊Úög.„?––TÒ≤NË8∏º$F"»˚"Í4∏…7ÉüúπLˇB£Odÿgévéz≤}√Lˆ
fx.SÀ&{1xAX$Àxì≠∆q™?›
ÉF—¸V9ä!cå FÌkîÜ¬ÑêLAª≤IÍ≠W»$u5h˚€ú^2´TôÕÈkI?¸ëd@'p»'íåÑ*ñÎ_AÜx}kTn-TÍ·mL=ÃOpÇ f≈]åÛïàÂZ5¿o“ã˝r£¥
¿8Óîdp?å‰ê£Œx-ÃiÅ…^&âHl@∂∫|Òl≤W˘1ai™ıh“µÄj≈5yh¿Œ\&Q”¸4ˇ6*≤}„J\Lv¬f∆ÍŒâÜOÄ&à+»‚Çªñ‚éŒí(}5πmL_•!Dî¡ö‹ûö˚h>ıÏºq=…dÛàìGÂlöÄF–óƒeDÍñœèÅL≠Ms¬Z^`lj(¨›ÑÒ^É_ éÂ‡H´Ω Eã◊∂ÙÕùãy	GÁÑÌÆ5¶››ÒõAøCÀ“§jﬁ¥âõ§eA˛Aﬁ∞PmMõˆè©øvO^òBFZ”eï˘8¸¯ƒ≠+õz|È˙˙ˆÊı5˛Ô“è7V∑è‘ì™àh:àD8¥PElíâà7C¥bøü*æLÅäπ% Fq3‹áê{äJ4qÓµGH∫ÔÑ|ÛΩ„{ÌdØz|√å#p0èQê´Ñ◊Î1LêÎ◊a”ü¸D@v1›"b◊<XH¬4Ñ$Lctù90a~˜?ƒøµaBãÑjæEXË5´Lh∆îõaka´Â7b°FÅ&›aìoôâ$Ë®—≥m0ïOÓî.s¶—•∞È-@Ôk‘¡Â4—û1êlñ•›,n¨H|Ç"≤ºoi˚
€:Ë6ÿˇ¸Ú?ÿ÷µ-∂Fâ◊~È®okãÀùí_ñ¸p¸bø$¬Hs4
Ïı£^ªHÉw<ËÅ≥¿x≤Ìw[…ﬁ!ËÁÉQ£Ë¶œ(æwÅÚ¡wŸ–E`£»E∑Ö€Â®$ú$?-G cã›∞!õ®z¯—Ö™0¬ÆÔ%\‰¢Z¢ü¿ôNãÂ‹	Yv∑¸BU_∂xCÖ ˙´o>e2‹]’Ω&√ÌWZÙg™Fèåú«ËÚ|!ø"|∫¢6⁄|*êH±@ƒ5ØÎµ|t(ë$Êà‘ëç¡fÛΩÄ≤'Zõ^PAë"-¶á'U∂nEæ∏b9ù∏1Ë ÒÊ*áSLçl{&˛Ø)‘&∂ñZèìëæ¿‚Oø¢?˛UÉ˙ø‰%¯µ$zHø*ÉÎE°4]4ÃØ˚˚j96µ»ì-Ø“{ã”Aæ{Y »bªÕuÛ>J•I»v®ë‘‘±¢b~D@•8æ®úp√0Ô≥!‘ÒÈÆsÜW>& 33>ùîNá¨À‚”π Èãæ⁄ˆ¯ÈúéƒåM72ùπ)0ù÷àòÆKg∞›€ﬁåøƒ ˙‚ïµïeÑê[^›¢?äFQÇú…≈¨±öô…b»áﬂnTSå=6w däLÊ±àÜÀûHüP§¿7?VŒIù≠d¶]zØπ∆sr\eÕO¯zGXâØ;€·lÖ?≤a•™ê∆'·x9
ı%&·E3ïÃ`^7æí}πce-≥®dSYûnò®ràÒ)W±îö¯Rrïß™Êƒo1DÓ∑îÁ˜[…x(˘3ùü¿\G®êÎ	ä(€Q–jÅ|≈)Ê ∆√ÖY¡Ã€ÅV,å†|yø¿˚«*§tböçÕN‘@^7VíæÿÒ∞°x-_ëö8î™má^≥î}‘´_J_îL∂,zßÇÖ.ö“¢f]1xÛ3ﬁ¿1x•®Ÿd®™gZÛãÚΩ≥FÇ94„ÃÃ8‚!sπÚ3z]]©{›≥*ÔÊíí˜e’Iî¬Äkﬁg£ì?ãe∆€~RpJB]íí¥ “ö°K»‘˙Eyÿ‡føKPi4XwÚuÑ¯5⁄ØO“®$ñõÏƒ€ò	àªk‡5[πá—Zÿ:¢G ]»"#Ã†}.πùâÖzoz:wÆjÇ.T,òô¡£◊]ø@¨oÄÂ”PAä=û¿dÀúÅ)µjcdßøqıúÕbiÅº'÷ˆºxJùBµŒ<çà©!"ôÊ¨Ç?ö»Huà]7âXF3∫$ñ9`‹o∂íà-ÀÖ®∞U<_™a•ˇ¥«È±6|˙ÇÓV#T∆ÿêê+oö'Z⁄òû‹◊J¿ˇÄ9≥Ns?G·>ùªSªvœﬂeo˘9ˆUŒ⁄i`ç≥Ÿæ◊Ú•‡Õ•.&„tÒ.ñqÓI!ê-ê÷LùüRÁÏ˘y[~BØË∞(≤A®≥∑„B◊,Cr¡÷´ö´≤£pû‰ƒ:áHW¬Àéÿ]° ‡eµì<ó˘⁄˘ûNÑ·9.7eC%IV†ê≠e≈∂¨»ñ•{©K|HCfB‡kLΩˇ2LΩˇO˝J∑’‚=ÁîÖøBΩÊ+ËûŸO¸ùœ{|6≥ãïã≥BüM∞[AÏ–ŒÔP¡g..ª∂˝^–‰Zôd9Ô˛ƒ{s3ﬂª	Œ3¯8ıΩõÃ6ô=p™)∂ï◊Ã%∑J,Í,≥◊)∆p'·cû–B™`
ÅkÇØ’‰„∞2Ø	‡^3sè@¯∞?q·€ÉˇÂ√vâ•qé‡mµM¯ ƒt:Â\ì÷nwBæ4Ï_á‘un¢∂√0Ùv;HrﬁH1@◊Êª@T€·;a«áXM˝Ô—‹nN†ÉKN¥ﬂG™˛„cUŸJp¨±B˘W“,zè†˘~/jn‡‘î7È‹‰£Ô≈{±’*“ƒE}?á –C°}-ÇEπx¬<•Zà^$π<?≤&€âˆÏıGÓı)pØk«Ët-oz±⁄yˆmŒ”¿&îfIﬂœLUø¢‚5(˙∏—ñºûU^«ãí∫!õÕdº1ñ.§GÇíÍ≈ﬁò fír±+—_T{Ê-„´˛demÈ˙µ∂}›dfÍï)Ü@_ëK©œ58Z±|)∏Œ≤}cye}{ã--nÆ∞k◊óW÷ÿ÷“;◊ØØÑ‹^5≈4«Eñ8YÒ±øÍá¸=Œ≤kT‰æÑ≈™êmèuÑí›k†≠Ï´∆]‹õ.öN€jvA[ÂG~ŒÅçI%#Óˆ[Èº'iÇ≠Ósæzûë¡+‡ƒÔqˆ VR¸kµy˚Ê‰Nós$◊~∑‡˛üv3‹Á¿•¶ÜÂ;i_§ì˝îkdM[∆jHÀ)iÕ€e’¬ˆPs	`Õ>ùª\Á¥’ÀÕ	N-Ô§Ø˝âÛä›°%pü≤úi£ŒVÆÿU∞(Â3@*í¸<ûŸ’0Ü∫˘\ˇÕ;l?+3ZÙº$«}πîwŒlÑ<˝[-ÎYæßÒC7ˇˇ˚OÑ$RU•Ÿí˘ÏZÿÙ€å¢WrSïg•¶~a°–∆w>gÓg9@aêh“˚}÷˚©lyzÒ‡õGˇH Q$QÆôµ/}¥ †d'zIæRâûJÏ `í/∆ïQër@	¯I±l˜›qo‚DÓÎ^\Ú∫P 75ÒµB-†ü≤|º“Ë‘Ù˘Èπ”≥Ss∆\KQŸ~(Ñ¸´ú»Ñbc’)›£l>].b®4 N»ú	Û›ëgí≈≥BÇ™‹5oÂ(°`‘G9ñb-çV¸Aé}	%Ÿö≤ÏqJØESøSÇ5ÍÅı xjˆËΩ(Ë~01ï]y'SsÕπ©õï¶RÈ’T#ÿË_4VÕ	Ñ⁄ÿp}Z©∑ùN
≤†6{U$¡jåùBmŒ¥wàaó∫ŒR[¥¢√¢ﬁ∞7S8Bf5ônŒïgíù´äufûÈ—6©≤  tMUìg*Ë!?õß\˘¥+⁄ ÁHú«:`÷}ñ Oºíæ˝˚ƒ_ß¢”Oˇ–è‰)(¢è{ñûªi∏¿}›ßˆ•,Ü˘$©ÒÕÁŒòÜœß˚Ws¬~ƒ¸@]Ä1¢«gt–78œÛ(WÔh <‘I√‚ò’ó≈nÜm_0∞5ˆÇ^≈¿<˛ˆ#Œ»É’KGwﬁ+."ócπ–
Åï›ëqÜêCP≥ˇfá„∂ﬂkÏ˘ëˆ»∂¯∆Òêàã–zªœ',ú]•’(Ù¶_≤¸tﬂ$Ω"‚ì©˘*ÙãºAº≈ŸÃ%1·~gËûúö?(<óÛwdV≈Z¯XŸ–& ,°ŒànÕπ9©¿¨ß00YoiØ3*⁄dƒ˜å_I=˘_]NPÚ◊Ωbî‹{h~ïúÌ|mÁRı∞Õ>JAgFãm˘-5£˚3ªÛª”7YÓê˙lMπS≥∂[{°`•˛dÌW9nús;ÅCJ;]%2Üπ/ì~iÜ∂‚õó∑ïπò∏πD3˙	sΩöVì8Ã≈˘´˘bø¯à“0Bœ;NÏ;~ÖQ!Q_ueLÿóó#qﬁL÷ïÛ˜Âï…œ«ò≈î5z %›êöâN√j¶‚ÀÀD1¬…îöÜ˛9≠SHÓíÇ≠1&FE≈»µp‘ì/fÍÀ+ÕÿWw€$∏∫àí€ò‚-ﬁ™W+ê1…A/w,Ë—}—_UÑ?≈·≥0~’1¸ÊTxó2C[ú‰94æj_ VÈÎfuZˇ#Ω£ç"+≤¶Kw^!òWÀ6Mros7ëúì±|±$-˙$ù{C áv≥ç˛≈∏ÔÖ˚r†N‡é ¡\J·Ü`_∏ƒëwYE™¬QíMÖ=b‹%mÿ%xãøE{%∑[˛ÁóˇQÒ?sc÷ΩdÿMpMˆ.}liT7˙ÜNÉÂt†ÂAó∑¡ıå‹‰S@sÜ£9bûÚ‡å--µ vπÌsqÂ¿øæªk±Òm7X~≠'öçNï_yDQO0jª&>i¯Ã)∫1≥f.fay≈µ∂·…ŸŸ†$‡¿%ÌÑ∑Õ$Ã)~˜õ\âÙ;>`\_≥b™ôÿﬁ¶z*e|¢I…gà>é&¬n˚¿<8„ñ-Ã∏Í»/˘XG∆Xñ€YsÃ ™¶ìSú*0‹‘Ëãn=ùkÉß0ç¥+aÊù+WN+ªÔf1÷˛'Q¯Å?ÒﬁÏM€6¥l7˜F∞≥`õ˘êÍw
pÙü3∏¥Ù^¨c©∏Ec≤â"ÍÀ*.n∫°íy”≤FKÕñp….ª‚cYãÏàÒáGÚ&Å zO:÷˛»D%‹˚â4q˛EY"?*x’0˜È~Zr@6Iñ·œ•3Ïßü8X¸\…∏	†é∑}Äç’HXLP hL≥Ó1ÓÅs	2täº|)[MöwΩ—$T¶g%U£7ÅæaÆfésg…∏íæk)=·Z˘?–
—
PŒÎøíıáTÄ%åZa¢¶Ëá∆î4ÛŸi9$-é"€ñû„…ﬁùù)M–·“§.l
ŸêKMQ≥&ªN21Wûå3ﬂà9∑Ö ∞ˆ©-?È˜ÿY∂t?à]~[¿√<,ú%”f …ãû^´&˜zÌ¿7––Ú›€|;áé5◊XwQ√çpÃ‚wSÌø}ôÍ»ø1ê∏U,/ +qÛ`óçéÓ]Nk“º=…ôA≈m{;cV#πÎ©—5Ì#V8=?7¢∞›ﬁGÔ@*Zw¸=ÔVF‡ÌËÑa≤7¬m÷qÊ∑9Îµ≤∆a≈¨≈zû‡ÈÒô,˝ËC·4”†√ø‘∂”g‚åQ%}FT·õªTíxﬁoêE>ïæµG$®6ë:ñ-ÑVﬂÄ/∆-/hcbo¿ù=ü•∑ƒ‰≥6ñ„Ü\C¯]ïC»~‡‰‚ %J+-Dá<nÀ]	‚n‡µéõR◊d≈"\Å√£É	_[Dÿ`Å&Ã6W÷óW6è‘(0ä7Çò‡WªcŸ‰•Bé”(Ω…wƒìmÒòÚ
g©±Ùõ^Â'≠B%.mM:EŸ/~¡äø∂§É‘ÿùõ®ﬁôt€ÊZª(ú∑)ñ2P(Ö 4òKwƒáCŒü!¶©Ø{h¯_á\?)õ∫‘mõBÍ—‚(2[gzZ˜=ó•Ví}
q πƒ)µ[ Â§fp¿#FßFÌò√π‰◊|6* Ë°¿q[D¥›û8ü7ˇVe◊Âç(#àû)[-Ov÷‚}sFUrÆ#0™B]_Sˇ≈ΩŸ˙iπ ‡ ^F–òÉ~Ó¥¸ˆ¥ûŸ(„Hı_ÍﬁliHk∞pç7"M&ˆ†Æë¸€πÇDˇ?   ˇˇ U)}xú‘U¡n”@Ω˜+F’I•%NH@*IP= U5H™J]{∑∂’ÕÆµªnEπp@‚8rÛâ¿∑¯SX€mboÉâ¯bÔÏÃÓõ˜f∆£.ân'{p˜åÃ
|Üï:√3:n]3öB§ÈL!ürM%8F˝÷&`Ÿ=ÄSÃÉ¶ÛH˚°Òã#∆‡†ª™9⁄á{RkäÜ.xBUΩÓÃ}◊ÖπœÜ E¬	%(eë
1sÙ<U0ì®◊¿f.ı≠oÿ √"ˇfºlw`<EuëA€Ò∏”YYæƒÀ´8E}É'^†höjt—s„ÙÆ◊»å¨°≤ ¥ƒ\E:aCÜüH%$äET¬~∫¥Ó`å«c(p¿ÉmÄ◊f'@O‹˛≈`pYAòáÜé[#¡)ùâÜoBqKÂaï√˝yé∏∫jr1±ˆÛÏGû˝ ≥œyˆ”|4yÔVƒˇçÙQÉ˛júú=*¿®Ív´yœÈÃ\O‡˚7†|¢û*í®‚Ì&ﬁ¢‡Zøs¬Ë©D¢õ`ü)`‘Zˆ¡∞*Ö*ÁBIIπxπ¶È~ªg,•‘∆G‚RÔ“›Ç⁄¿hNñ*∞8xSæ`B*´"Z5¯Võ¸ﬁ'∫ûRhêœ—†]ÀU≈òOñÕæ6eSˆÀ∑<˚íg_ÛÏªSD≈ö≥uÀ†Üj∂í£˙‘näZ˙AHç≤®©gèﬂ@äyAuY±µ©πd"(y«œ£l•b§r`$5Ã ieyãUË	,Iª÷®[¿dÒZ¯Q±ﬁ5XS\¸Rj·+ÀŒ∑˚æ©ç≠çª£íòJ;ìia¸S:5ù÷üùW{´Ωﬂ   ˇˇ ›Fm