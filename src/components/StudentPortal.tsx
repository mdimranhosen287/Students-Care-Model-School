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
  { semester: 'Summer 24', gpa: 4.25, bnSemester: 'à¦—à§à¦°à§€à¦·à§à¦® à§¨à§ª' },
  { semester: 'Winter 24', gpa: 4.50, bnSemester: 'à¦¶à§€à¦¤ à§¨à§ª' },
  { semester: 'Summer 25', gpa: 4.75, bnSemester: 'à¦—à§à¦°à§€à¦·à§à¦® à§¨à§«' },
  { semester: 'Winter 25', gpa: 4.85, bnSemester: 'à¦¶à§€à¦¤ à§¨à§«' },
  { semester: 'Summer 26', gpa: 5.00, bnSemester: 'à¦—à§à¦°à§€à¦·à§à¦® à§¨à§¬' },
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
      setErrorMsg(lang === 'bn' ? "à¦¨à¦¤à§à¦¨ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦®à¦¿à¦²à¦›à§‡ à¦¨à¦¾!" : "New passwords do not match!");
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
        setAdminSuccessMsg(lang === 'bn' ? "à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!" : "Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        addAuditLog("Admin changed dashboard entry password.");
      } else {
        setErrorMsg(data.message || (lang === 'bn' ? "à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤" : "Failed to update password."));
      }
    } catch (err) {
      setErrorMsg(lang === 'bn' ? "à¦¸à¦¾à¦°à§à¦­à¦¾à¦°à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤" : "Server error.");
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
    customBody: 'à¦à¦‡ à¦®à¦°à§à¦®à§‡ à¦ªà§à¦°à¦¤à§à¦¯à¦¯à¦¼à¦¨ à¦•à¦°à¦¾ à¦¯à¦¾à¦šà§à¦›à§‡ à¦¯à§‡, [à¦¨à¦¾à¦®], à¦ªà¦¿à¦¤à¦¾: [à¦¬à¦¾à¦¬à¦¾], à¦®à¦¾à¦¤à¦¾: [à¦®à¦¾]à¥¤ à¦¸à§‡ à¦…à¦¤à§à¦° à¦¬à¦¿à¦¦à§à¦¯à¦¾à¦²à¦¯à¦¼à§‡à¦° [à¦¶à§à¦°à§‡à¦£à¦¿] à¦¶à§à¦°à§‡à¦£à¦¿à¦° à¦à¦•à¦œà¦¨ à¦¨à¦¿à¦¯à¦¼à¦®à¦¿à¦¤ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¥¤ à¦¤à¦¾à¦° à¦°à§‹à¦² à¦¨à¦®à§à¦¬à¦° [à¦°à§‹à¦²] à¦à¦¬à¦‚ à¦œà¦¨à§à¦® à¦¤à¦¾à¦°à¦¿à¦– [à¦œà¦¨à§à¦® à¦¤à¦¾à¦°à¦¿à¦–]à¥¤\n\nà¦¸à§‡ à¦…à¦¤à§à¦° à¦¬à¦¿à¦¦à§à¦¯à¦¾à¦²à¦¯à¦¼à§‡à¦° à¦à¦•à¦œà¦¨ à¦®à§‡à¦§à¦¾à¦¬à§€ à¦à¦¬à¦‚ à¦…à¦¨à§à¦—à¦¤ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¥¤ à¦†à¦®à¦¿ à¦¤à¦¾à¦° à¦‰à¦œà§à¦œà§à¦¬à¦² à¦­à¦¬à¦¿à¦·à§à¦¯à§Ž à¦•à¦¾à¦®à¦¨à¦¾ à¦•à¦°à¦¿.'
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
      schoolNameBn: 'à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿà¦¸ à¦•à§‡à¦¯à¦¼à¦¾à¦° à¦®à¦¡à§‡à¦² à¦¸à§à¦•à§à¦²',
      schoolLogo: '',
      headerNotice: 'à¦¸à¦«à¦Ÿà¦“à¦¯à¦¼à§à¦¯à¦¾à¦° à¦¤à§ˆà¦°à¦¿ à¦“ à¦°à¦•à§à¦·à¦£à¦¾à¦¬à§‡à¦•à§à¦·à¦£à§‡: à¦®à§‹. à¦‡à¦®à¦°à¦¾à¦¨ à¦¹à§‹à¦¸à§‡à¦¨, à¦¸à¦¿à¦¨à¦¿à¦¯à¦¼à¦° à¦¶à¦¿à¦•à§à¦·à¦•, à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿà¦¸ à¦•à§‡à¦¯à¦¼à¦¾à¦° à¦®à¦¡à§‡à¦² à¦¸à§à¦•à§à¦²',
      bannerEnabled: true,
      headerBgColor: '#1E63D3',
      addressEn: 'Charlakshya, Karnaphuli, Chittagong',
      addressBn: 'à¦šà¦°à¦²à¦•à§à¦·à§à¦¯à¦¾, à¦•à¦°à§à¦£à¦«à§à¦²à§€, à¦šà¦Ÿà§à¦Ÿà¦—à§à¦°à¦¾à¦®',
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
      address: 'à¦šà¦°à¦²à¦•à§à¦·à§à¦¯à¦¾, à¦•à¦°à§à¦£à¦«à§à¦²à§€, à¦šà¦Ÿà§à¦Ÿà¦—à§à¦°à¦¾à¦®',
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

  // à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¥à§‡à¦•à§‡ à¦²à¦¾à¦‡à¦­ à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿ à¦²à¦¿à¦¸à§à¦Ÿ à¦²à§‹à¦¡ à¦•à¦°à¦¾à¦° à¦œà¦¨à§à¦¯
  useEffect(() => {
    const fetchStudentsFromDatabase = async () => {
      try {
        const response = await fetch(getApiUrl('/api/students'));
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¥à§‡à¦•à§‡ à¦†à¦¸à¦¾ à¦¡à§‡à¦Ÿà¦¾à¦•à§‡ à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿ à¦²à¦¿à¦¸à§à¦Ÿ à¦¸à§à¦Ÿà§‡à¦Ÿà§‡ à¦¸à§‡à¦Ÿ à¦•à¦°à§à¦¨
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
    nationality: 'à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶à§€',

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
      nationality: std.nationality || 'à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶à§€',

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
      alert(lang === 'bn' ? 'à¦¦à¦¯à¦¼à¦¾ à¦•à¦°à§‡ à¦¤à¦¾à¦°à¦•à¦¾ à¦šà¦¿à¦¹à§à¦¨à¦¿à¦¤ (*) à¦†à¦¬à¦¶à§à¦¯à¦• à¦•à§à¦·à§‡à¦¤à§à¦°à¦—à§à¦²à§‹ à¦ªà§‚à¦°à¦£ à¦•à¦°à§à¦¨à¥¤' : 'Please fill all required (*) fields: Full Name, Class, Section, Roll Number, and Guardian Mobile Number.');
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
      ? `${editStudentForm.fullName} à¦à¦° à¦¤à¦¥à§à¦¯ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!`
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
    nationality: 'à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶à§€',

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
          ? (customMsgBn || "à¦¤à¦¥à§à¦¯ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à¦¾à¦°à§à¦­à¦¾à¦° à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œà§‡ à¦¸à¦‚à¦°à¦•à§à¦·à¦¿à¦¤ à¦¹à¦¯à¦¼à§‡à¦›à§‡!") 
          : (customMsgEn || "Settings successfully saved to server database!"));
      } else {
        setAdminSuccessMsg(lang === 'bn' 
          ? "à¦­à§à¦²: à¦¸à¦¾à¦°à§à¦­à¦¾à¦°à§‡ à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤" 
          : "Error: " + (result.message || "Failed to save settings on server"));
      }
    } catch (err: any) {
      console.error('Save frontend data to server error:', err);
      setAdminSuccessMsg(lang === 'bn' 
        ? "à¦­à§à¦²: à¦¨à§‡à¦Ÿà¦“à¦¯à¦¼à¦¾à¦°à§à¦• à¦¸à¦‚à¦¯à§‹à¦— à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤" 
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
      alert("All fields are required! à¦¸à¦¬ à¦¤à¦¥à§à¦¯ à¦ªà§‚à¦°à¦£ à¦•à¦°à¦¾ à¦†à¦¬à¦¶à§à¦¯à¦•à¥¤");
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
      setAdminSuccessMsg("Page updated successfully! à¦ªà§‡à¦œ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤");
    } else {
      // Creating a new page
      const slugExists = pages.some((p: any) => p.slug === pageSlug);
      if (slugExists) {
        alert("This Page URL slug already exists! à¦à¦‡ à¦ªà§‡à¦œ à¦‡à¦‰à¦†à¦°à¦à¦² à¦¸à§à¦²à§à¦¯à¦¾à¦— à¦‡à¦¤à¦¿à¦®à¦§à§à¦¯à§‡ à¦¬à¦¿à¦¦à§à¦¯à¦®à¦¾à¦¨à¥¤");
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
      setAdminSuccessMsg("New custom page published successfully! à¦¨à¦¤à§à¦¨ à¦ªà§‡à¦œ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤");
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
    if (!confirm("Are you sure you want to delete this custom page? à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤à¦­à¦¾à¦¬à§‡ à¦à¦‡ à¦ªà§‡à¦œà¦Ÿà¦¿ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¤à§‡ à¦šà¦¾à¦¨?")) return;
    
    const pages = frontendData?.customPages || [];
    const updatedPages = pages.filter((p: any) => p.id !== pageId);
    
    setFrontendData((prev: any) => ({
      ...prev,
      customPages: updatedPages
    }));
    setAdminSuccessMsg("Page deleted successfully! à¦ªà§‡à¦œ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤");
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
    { id: 'banner', labelBn: 'à¦¹à§‹à¦®à¦ªà§‡à¦œ à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦°', labelEn: 'Homepage Banner' },
    { id: 'setting', labelBn: 'à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸', labelEn: 'Setting' },
    { id: 'menu', labelBn: 'à¦®à§‡à¦¨à§', labelEn: 'Menu' },
    { id: 'page_section', labelBn: 'à¦ªà§‡à¦œ à¦¸à§‡à¦•à¦¶à¦¨', labelEn: 'Page Section' },
    { id: 'manage_page', labelBn: 'à¦ªà§‡à¦œ à¦®à§à¦¯à¦¾à¦¨à§‡à¦œ', labelEn: 'Manage Page' },
    { id: 'slider', labelBn: 'à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¾à¦°', labelEn: 'Slider' },
    { id: 'features', labelBn: 'à¦¬à§ˆà¦¶à¦¿à¦·à§à¦Ÿà§à¦¯à¦¸à¦®à§‚à¦¹', labelEn: 'Features' },
    { id: 'comittee', labelBn: 'à¦•à¦®à¦¿à¦Ÿà¦¿', labelEn: 'Committee' },
    { id: 'speech', labelBn: 'à¦¬à¦•à§à¦¤à¦¬à§à¦¯', labelEn: 'Speech' },
    { id: 'testimonial', labelBn: 'à¦ªà§à¦°à¦¶à¦‚à¦¸à¦¾à¦ªà¦¤à§à¦° / à¦®à¦¨à§à¦¤à¦¬à§à¦¯', labelEn: 'Testimonial' },
    { id: 'service', labelBn: 'à¦¸à§‡à¦¬à¦¾à¦¸à¦®à§‚à¦¹', labelEn: 'Service' },
    { id: 'faq', labelBn: 'à¦œà¦¿à¦œà§à¦žà¦¾à¦¸à¦¾ (FAQ)', labelEn: 'Faq' },
    { id: 'gallery_category', labelBn: 'à¦—à§à¦¯à¦¾à¦²à¦¾à¦°à¦¿ à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿', labelEn: 'Gallery Category' },
    { id: 'gallery', labelBn: 'à¦«à¦Ÿà§‹ à¦—à§à¦¯à¦¾à¦²à¦¾à¦°à¦¿', labelEn: 'Gallery' },
    { id: 'news', labelBn: 'à¦–à¦¬à¦° à¦“ à¦†à¦ªà¦¡à§‡à¦Ÿ', labelEn: 'News' },
    { id: 'notice_settings', labelBn: 'à¦¨à§‹à¦Ÿà¦¿à¦¶à¦¬à§‹à¦°à§à¦¡', labelEn: 'Notice' },
    { id: 'fast_links', labelBn: 'à¦•à§à¦‡à¦• à¦²à¦¿à¦‚à¦•', labelEn: 'Fast Links' },
    { id: 'history', labelBn: 'à¦‡à¦¤à¦¿à¦¹à¦¾à¦¸ à¦“ à¦à¦¤à¦¿à¦¹à§à¦¯', labelEn: 'Homepage History' },
    { id: 'teachers_list', labelBn: 'à¦¶à¦¿à¦•à§à¦·à¦•à¦®à¦£à§à¦¡à¦²à§€', labelEn: 'Homepage Teachers' },
    { id: 'masterpiece_students', labelBn: 'à¦•à§ƒà¦¤à§€ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€', labelEn: 'Masterpiece Students' },
    { id: 'videos', labelBn: 'à¦­à¦¿à¦¡à¦¿à¦“ à¦—à§à¦¯à¦¾à¦²à¦¾à¦°à¦¿', labelEn: 'Homepage Videos' },
    { id: 'blog_posts', labelBn: 'à¦¬à§à¦²à¦— à¦ªà§‹à¦¸à§à¦Ÿ', labelEn: 'Blog Posts' },
    { id: 'footer_settings', labelBn: 'à¦«à§à¦Ÿà¦¾à¦°', labelEn: 'Footer' },
  ];

  const cardSubMenus = [
    { id: 'id_card', labelBn: 'à¦†à¦‡à¦¡à¦¿ à¦•à¦¾à¦°à§à¦¡', labelEn: 'ID Card' },
    { id: 'id_card_customize', labelBn: 'à¦†à¦‡à¦¡à¦¿ à¦•à¦¾à¦°à§à¦¡ à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦‡à¦œ', labelEn: 'ID Card Customize' },
    { id: 'admit_card', labelBn: 'à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦Ÿ à¦•à¦¾à¦°à§à¦¡', labelEn: 'Admit Card' },
    { id: 'admit_card_customize', labelBn: 'à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦Ÿ à¦•à¦¾à¦°à§à¦¡ à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦‡à¦œ', labelEn: 'Admit Card Customize' },
    { id: 'seat_plan', labelBn: 'à¦¸à¦¿à¦Ÿ à¦ªà§à¦²à§à¦¯à¦¾à¦¨', labelEn: 'Seat Plan' },
    { id: 'seat_plan_customize', labelBn: 'à¦¸à¦¿à¦Ÿ à¦ªà§à¦²à§à¦¯à¦¾à¦¨ à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦‡à¦œ', labelEn: 'Seat Plan Customize' },
    { id: 'exam_controller_plan', labelBn: 'à¦à¦•à§à¦¸à¦¾à¦® à¦•à¦¨à§à¦Ÿà§à¦°à§‹à¦²à¦¾à¦° à¦ªà§à¦²à§à¦¯à¦¾à¦¨', labelEn: 'Exam Controller Plan' },
  ];

  const certificateSubMenus = [
    { id: 'generate', labelBn: 'à¦¸à¦¾à¦°à§à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦Ÿ à¦œà§‡à¦¨à¦¾à¦°à§‡à¦Ÿ', labelEn: 'Certificate Generate' },
    { id: 'pottoyon', labelBn: 'à¦ªà§à¦°à¦¤à§à¦¯à¦¯à¦¼à¦¨à¦ªà¦¤à§à¦°', labelEn: 'Pottoyon Potro' },
    { id: 'testimonial', labelBn: 'à¦Ÿà§‡à¦¸à§à¦Ÿà¦¿à¦®à§‹à¦¨à¦¿à¦¯à¦¼à¦¾à¦²', labelEn: 'Testimonial' },
    { id: 'excellence', labelBn: 'à¦à¦•à§à¦¸à¦¿à¦²à§‡à¦¨à§à¦¸ à¦¸à¦¾à¦°à§à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦Ÿ', labelEn: 'Excellence Certificate' },
  ];

  // Quotes rotation on Left Side of Login Page
  const leftQuotes = [
    {
      bn: "â€œà¦›à¦¾à¦¤à§à¦°à¦¦à§‡à¦° à¦¸à§à¦¨à§à¦¦à¦° à¦­à¦¬à¦¿à¦·à§à¦¯à§Ž à¦“ à¦¨à§ˆà¦¤à¦¿à¦• à¦šà¦°à¦¿à¦¤à§à¦° à¦—à¦ à¦¨à¦‡ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦à¦•à¦®à¦¾à¦¤à§à¦° à¦…à¦™à§à¦—à§€à¦•à¦¾à¦°à¥¤â€",
      en: "â€œOur sole commitment is to build a beautiful future and moral character for our students.â€"
    },
    {
      bn: "â€œà¦¨à¦¿à¦¯à¦¼à¦®à¦¨à¦¿à¦·à§à¦ à¦¾ à¦“ à¦•à¦ à§‹à¦° à¦ªà¦°à¦¿à¦¶à§à¦°à¦®à¦‡ à¦¸à¦«à¦²à¦¤à¦¾à¦° à¦šà¦¾à¦¬à¦¿à¦•à¦¾à¦ à¦¿à¥¤â€",
      en: "â€œDiscipline and hard work are the keys to success.â€"
    },
    {
      bn: "â€œà¦­à¦¬à¦¿à¦·à§à¦¯à¦¤à§‡à¦° à¦¯à§‹à¦—à§à¦¯ à¦“ à¦¸à§Ž à¦¨à¦¾à¦—à¦°à¦¿à¦• à¦—à¦¡à¦¼à§‡ à¦¤à§‹à¦²à¦¾à¦‡ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦…à¦™à§à¦—à§€à¦•à¦¾à¦°à¥¤â€",
      en: "â€œWe are committed to building worthy and honest citizens of the future.â€"
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
          ? `à¦­à§à¦² à¦‡à¦‰à¦œà¦¾à¦°à¦¨à§‡à¦® à¦¬à¦¾ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡à¥¤ à¦¡à§‡à¦®à§‹ à¦†à¦‡à¦¡à¦¿ à¦à¦¬à¦‚ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦¹à¦¿à¦¸à§‡à¦¬à§‡ '${displayCred}' à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§à¦¨`
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
      ? `${adm.studentName}-à¦à¦° à¦­à¦°à§à¦¤à¦¿ à¦¸à¦®à§à¦ªà¦¨à§à¦¨! à¦¨à¦¤à§à¦¨ à¦†à¦‡à¦¡à¦¿: ${generatedId}, à¦¶à¦¾à¦–à¦¾: ${approveSection}, à¦°à§‹à¦²: ${finalRoll}`
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
    setAdminSuccessMsg(lang === 'bn' ? `${name}-à¦à¦° à¦†à¦¬à§‡à¦¦à¦¨ à¦¬à¦¾à¦¤à¦¿à¦² à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤` : `Admission rejected for ${name}.`);
    addAuditLog(`Admin rejected admission for ${name}.`);
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    
    // We can show a notification
    setAdminSuccessMsg(lang === 'bn' ? "à¦¨à¦¤à§à¦¨ à¦¨à§‹à¦Ÿà¦¿à¦¶à¦Ÿà¦¿ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¬à§‹à¦°à§à¦¡à§‡ à¦ªà§à¦°à¦•à¦¾à¦¶ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!" : "Notice successfully published to Main Notice Board!");
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
    setTeacherSuccessMsg(lang === 'bn' ? `à¦†à¦œà¦•à§‡à¦° à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à¦‚à¦°à¦•à§à¦·à¦¿à¦¤ à¦¹à¦¯à¦¼à§‡à¦›à§‡ (${presentCount}/à§« à¦œà¦¨ à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤)` : `Attendance submitted successfully. (${presentCount}/5 present)`);
    addAuditLog(`Teacher registered Class 9 Science attendance. Present: ${presentCount}`);
    setTimeout(() => {
      setAttendanceSubmitted(false);
      setTeacherSuccessMsg('');
    }, 4000);
  };

  const handleSubmitMarks = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSuccessMsg(lang === 'bn' ? `à¦†à¦‡à¦¡à¦¿ ${marksForm.studentId}-à¦à¦° à¦œà¦¨à§à¦¯ ${marksForm.marks} à¦¨à¦®à§à¦¬à¦° à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!` : `Marks (${marksForm.marks}) submitted for Student ID ${marksForm.studentId}.`);
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
    setAccountantSuccessMsg(lang === 'bn' ? `à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦¸à¦«à¦²! à¦°à¦¸à¦¿à¦¦ à¦¨à¦®à§à¦¬à¦° ${newTxn.id} à¦‡à¦¸à§à¦¯à§ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤` : `Payment recorded! Invoice ID ${newTxn.id} generated.`);
    addAuditLog(`Accountant registered à§³${payAmt} collection from student ID ${feeForm.studentId}.`);
    
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
    
    setSuperSuccessMsg(lang === 'bn' ? "à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦® à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª (.json) à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤" : "System DB configuration and audit trails backed up successfully.");
    addAuditLog("Super Admin initiated full database JSON backup download.");
    setTimeout(() => setSuperSuccessMsg(''), 4500);
  };

  // Helper localizer for portal headers
  const getRoleName = (role: typeof loggedInRole, l: typeof lang) => {
    if (!role) return '';
    const names = {
      admin: { bn: 'à¦à¦¡à¦®à¦¿à¦¨ à¦ªà§‹à¦°à§à¦Ÿà¦¾à¦²', en: 'Administrator Portal' },
      teacher: { bn: 'à¦¶à¦¿à¦•à§à¦·à¦• à¦ªà§‹à¦°à§à¦Ÿà¦¾à¦²', en: 'Teacher Workspace' },
      student: { bn: 'à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦• à¦ªà§‹à¦°à§à¦Ÿà¦¾à¦²', en: 'Guardian Workspace' },
      accountant: { bn: 'à¦¹à¦¿à¦¸à¦¾à¦¬à¦°à¦•à§à¦·à¦• à¦ªà§‹à¦°à§à¦Ÿà¦¾à¦²', en: 'Accountant Ledger panel' },
      superadmin: { bn: 'à¦¸à§à¦ªà¦¾à¦° à¦à¦¡à¦®à¦¿à¦¨ à¦•à¦•à¦ªà¦¿à¦Ÿ', en: 'Super Admin Operations Cockpit' }
    };
    return l === 'bn' ? names[role].bn : names[role].en;
  };

  // ----------------------------------------------------
  // SUB-COMPONENT: STUDENT DASHBOARD
  // ----------------------------------------------------
  const mockWeeklySchedule = [
    { 
      day: lang === 'bn' ? "à¦°à¦¬à¦¿à¦¬à¦¾à¦°" : "Sunday", 
      periods: [
        lang === 'bn' ? "à¦ªà¦¦à¦¾à¦°à§à¦¥à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨ (à§¦à§¯:à§¦à§¦ AM)" : "Physics (09:00 AM)", 
        lang === 'bn' ? "à¦‡à¦‚à¦°à§‡à¦œà¦¿ (à§§à§¦:à§§à§« AM)" : "English (10:15 AM)", 
        lang === 'bn' ? "à¦¬à¦¾à¦‚à¦²à¦¾ (à§§à§§:à§©à§¦ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "à¦—à¦£à¦¿à¦¤ (à§¦à§§:à§¦à§¦ PM)" : "Mathematics (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "à¦¸à§‹à¦®à¦¬à¦¾à¦°" : "Monday", 
      periods: [
        lang === 'bn' ? "à¦°à¦¸à¦¾à¦¯à¦¼à¦¨ (à§¦à§¯:à§¦à§¦ AM)" : "Chemistry (09:00 AM)", 
        lang === 'bn' ? "à¦†à¦‡à¦¸à¦¿à¦Ÿà¦¿ (à§§à§¦:à§§à§« AM)" : "ICT (10:15 AM)", 
        lang === 'bn' ? "à¦œà§€à¦¬à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨ (à§§à§§:à§©à§¦ AM)" : "Biology (11:30 AM)", 
        lang === 'bn' ? "à¦—à¦£à¦¿à¦¤ (à§¦à§§:à§¦à§¦ PM)" : "Mathematics (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "à¦®à¦™à§à¦—à¦²à¦¬à¦¾à¦°" : "Tuesday", 
      periods: [
        lang === 'bn' ? "à¦ªà¦¦à¦¾à¦°à§à¦¥à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨ (à§¦à§¯:à§¦à§¦ AM)" : "Physics (09:00 AM)", 
        lang === 'bn' ? "à¦‡à¦‚à¦°à§‡à¦œà¦¿ (à§§à§¦:à§§à§« AM)" : "English (10:15 AM)", 
        lang === 'bn' ? "à¦¬à¦¾à¦‚à¦²à¦¾ (à§§à§§:à§©à§¦ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "à¦°à¦¸à¦¾à¦¯à¦¼à¦¨ (à§¦à§§:à§¦à§¦ PM)" : "Chemistry (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "à¦¬à§à¦§à¦¬à¦¾à¦°" : "Wednesday", 
      periods: [
        lang === 'bn' ? "à¦œà§€à¦¬à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨ (à§¦à§¯:à§¦à§¦ AM)" : "Biology (09:00 AM)", 
        lang === 'bn' ? "à¦†à¦‡à¦¸à¦¿à¦Ÿà¦¿ (à§§à§¦:à§§à§« AM)" : "ICT (10:15 AM)", 
        lang === 'bn' ? "à¦¬à¦¾à¦‚à¦²à¦¾ (à§§à§§:à§©à§¦ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "à¦‰à¦šà§à¦šà¦¤à¦° à¦—à¦£à¦¿à¦¤ (à§¦à§§:à§¦à§¦ PM)" : "Higher Math (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "à¦¬à§ƒà¦¹à¦¸à§à¦ªà¦¤à¦¿à¦¬à¦¾à¦°" : "Thursday", 
      periods: [
        lang === 'bn' ? "à¦¸à¦¾à¦ªà§à¦¤à¦¾à¦¹à¦¿à¦• à¦•à§à¦‡à¦œ (à§¦à§¯:à§¦à§¦ AM)" : "Weekly Quiz (09:00 AM)", 
        lang === 'bn' ? "à¦¡à¦¿à¦¬à§‡à¦Ÿ à¦•à§à¦²à¦¾à¦¬ (à§§à§¦:à§§à§« AM)" : "Debate Club (10:15 AM)", 
        lang === 'bn' ? "à¦•à§à¦°à§€à¦¡à¦¼à¦¾ à¦˜à¦¨à§à¦Ÿà¦¾ (à§§à§§:à§©à§¦ AM)" : "Sports Hour (11:30 AM)", 
        lang === 'bn' ? "à¦ªà¦°à¦¾à¦®à¦°à§à¦¶ à¦¸à¦­à¦¾ (à§¦à§§:à§¦à§¦ PM)" : "Counseling (01:00 PM)"
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
          { id: 'overview', label: lang === 'bn' ? 'à¦¸à¦‚à¦•à§à¦·à¦¿à¦ªà§à¦¤ à¦¤à¦¥à§à¦¯' : 'Overview', icon: GraduationCap },
          { id: 'homework', label: lang === 'bn' ? `à¦¬à¦¾à¦¡à¦¼à¦¿à¦° à¦•à¦¾à¦œ (${pendingHomeworkCount})` : `Homework (${pendingHomeworkCount})`, icon: BookOpen },
          { id: 'results', label: lang === 'bn' ? 'à¦ªà¦°à§€à¦•à§à¦·à¦¾à¦° à¦«à¦²à¦¾à¦«à¦²' : 'Term Results', icon: Award },
          { id: 'schedule', label: lang === 'bn' ? 'à¦¸à¦¾à¦ªà§à¦¤à¦¾à¦¹à¦¿à¦• à¦°à§à¦Ÿà¦¿à¦¨' : 'Class Schedule', icon: Calendar },
          { id: 'profile', label: lang === 'bn' ? 'à¦ªà§à¦°à§‹à¦«à¦¾à¦‡à¦²' : 'My Profile', icon: User },
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
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦®à§‚à¦²à§à¦¯à¦¾à¦¯à¦¼à¦¨" : "Attendance Streak"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">{lang === 'bn' ? "à¦šà¦®à§Žà¦•à¦¾à¦°" : "Excellent"}</span>
                    <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">{mockStudentProfile.attendanceRate}% {lang === 'bn' ? "à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤" : "Presence"}</span>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "à¦¬à¦¾à¦•à¦¿ à¦ªà¦¡à¦¼à¦¾/à¦•à¦¾à¦œ" : "Pending Homework"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">
                      {pendingHomeworkCount} {lang === 'bn' ? "à¦Ÿà¦¿ à¦•à¦¾à¦œ" : "Tasks"}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold mt-0.5 block">{lang === 'bn' ? "à¦à¦‡ à¦¸à¦ªà§à¦¤à¦¾à¦¹à§‡ à¦œà¦®à¦¾ à¦¦à¦¿à¦¤à§‡ à¦¹à¦¬à§‡" : "Due by this week"}</span>
                  </div>
                  <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "à¦—à¦¡à¦¼ à¦œà¦¿à¦ªà¦¿à¦ à¦®à¦¾à¦¨" : "Average GPA Grade"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">GPA 4.90</span>
                    <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">{lang === 'bn' ? "à¦+ à¦šà¦®à§Žà¦•à¦¾à¦°" : "A+ Excellent Status"}</span>
                  </div>
                  <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <Award className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                    <h4 className="font-extrabold text-gray-900 text-base mb-4">{lang === 'bn' ? "à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•à§‡à¦° à¦¯à§‹à¦—à¦¾à¦¯à§‹à¦—à§‡à¦° à¦¤à¦¥à§à¦¯" : "Guardian Contact Details"}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "à¦ªà§à¦°à¦§à¦¾à¦¨ à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•" : "Primary Guardian"}</span>
                        <span className="font-bold">{mockStudentProfile.guardian}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "à¦¨à¦¿à¦¬à¦¨à§à¦§à¦¿à¦¤ à¦®à§‹à¦¬à¦¾à¦‡à¦²" : "Registered Phone"}</span>
                        <span className="font-bold font-mono">{mockStudentProfile.phone}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "à¦°à¦•à§à¦¤à§‡à¦° à¦—à§à¦°à§à¦ª" : "Registered Blood Group"}</span>
                        <span className="font-bold text-red-600">{mockStudentProfile.bloodGroup}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ à¦¶à§à¦°à§‡à¦£à§€" : "Current Grade Status"}</span>
                        <span className="font-bold text-emerald-700">{lang === 'bn' ? 'à§¯à¦® à¦¶à§à¦°à§‡à¦£à§€' : mockStudentProfile.className}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-900 text-base">{lang === 'bn' ? "à¦°à¦¬à¦¿à¦¬à¦¾à¦°à§‡à¦° à¦•à§à¦²à¦¾à¦¸à§‡à¦° à¦°à§à¦Ÿà¦¿à¦¨" : "Sunday Class Schedule"}</h4>
                      <button onClick={() => setActivePortalTab('schedule')} className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer">
                        {lang === 'bn' ? "à¦ªà§‚à¦°à§à¦£ à¦°à§à¦Ÿà¦¿à¦¨ à¦¦à§‡à¦–à§à¦¨" : "View Full Week"}
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
                    <h4 className="font-bold text-gray-900 text-base mb-4">{lang === 'bn' ? "à¦«à¦²à¦¾à¦«à¦² à¦¸à¦‚à¦•à§à¦·à§‡à¦ª" : "Quick Grade Summary"}</h4>
                    <div className="space-y-3.5">
                      {mockExamResults.slice(0, 4).map((res) => (
                        <div key={res.subject} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-bold">{lang === 'bn' && res.subject === "Physics" ? "à¦ªà¦¦à¦¾à¦°à§à¦¥à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨" : lang === 'bn' && res.subject === "Chemistry" ? "à¦°à¦¸à¦¾à¦¯à¦¼à¦¨" : lang === 'bn' && res.subject === "Higher Mathematics" ? "à¦‰à¦šà§à¦šà¦¤à¦° à¦—à¦£à¦¿à¦¤" : lang === 'bn' && res.subject === "English Language" ? "à¦‡à¦‚à¦°à§‡à¦œà¦¿" : res.subject}</span>
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
                      {lang === 'bn' ? "à¦ªà§‚à¦°à§à¦£ à¦®à¦¾à¦°à§à¦•à¦¶à¦¿à¦Ÿ à¦¦à§‡à¦–à§à¦¨" : "View Full Marksheet"}
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
                  <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "à¦¹à§‹à¦®à¦“à¦¯à¦¼à¦¾à¦°à§à¦• à¦ªà§à¦²à§à¦¯à¦¾à¦¨à¦¾à¦°" : "Homework Planner"}</h4>
                  <p className="text-xs text-gray-500">{lang === 'bn' ? "à¦•à¦¾à¦œ à¦¸à¦®à§à¦ªà¦¨à§à¦¨ à¦šà¦¿à¦¹à§à¦¨à¦¿à¦¤ à¦•à¦°à¦¤à§‡ à¦¬à¦•à§à¦¸à§‡ à¦Ÿà¦¿à¦• à¦¦à¦¿à¦¨" : "Check/uncheck tasks to mark them completed"}</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-800 font-bold border border-amber-200 px-3 py-1.5 rounded-xl">
                  {pendingHomeworkCount} {lang === 'bn' ? "à¦Ÿà¦¿ à¦•à¦¾à¦œ à¦¬à¦¾à¦•à¦¿ à¦†à¦›à§‡" : "Pending Tasks"}
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
                              {lang === 'bn' && item.subject === "Physics" ? "à¦ªà¦¦à¦¾à¦°à§à¦¥à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨" : lang === 'bn' && item.subject === "Chemistry" ? "à¦°à¦¸à¦¾à¦¯à¦¼à¦¨" : lang === 'bn' && item.subject === "Higher Mathematics" ? "à¦‰à¦šà§à¦šà¦¤à¦° à¦—à¦£à¦¿à¦¤" : item.subject}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1 font-bold">
                              <Clock className="h-3 w-3" /> {lang === 'bn' ? "à¦œà¦®à¦¾à¦° à¦¤à¦¾à¦°à¦¿à¦–:" : "Due Date:"} {item.dueDate}
                            </span>
                          </div>
                          <h5 className={`font-bold text-gray-900 text-base ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {lang === 'bn' && item.id === "hw1" ? "à¦…à¦§à§à¦¯à¦¾à¦¯à¦¼ à§«: à¦—à¦¤à¦¿à¦¬à¦¿à¦¦à§à¦¯à¦¾à¦° à¦—à¦¾à¦£à¦¿à¦¤à¦¿à¦• à¦¸à¦®à¦¸à§à¦¯à¦¾" : lang === 'bn' && item.id === "hw2" ? "à¦œà§ˆà¦¬ à¦°à¦¸à¦¾à¦¯à¦¼à¦¨ à¦à¦¬à¦‚ à¦†à¦£à¦¬à¦¿à¦• à¦—à¦ à¦¨ à¦¸à¦‚à¦•à§à¦·à§‡à¦ªà¦£" : lang === 'bn' && item.id === "hw3" ? "à¦¤à§à¦°à¦¿à¦•à§‹à¦£à¦®à¦¿à¦¤à¦¿à¦• à¦…à¦¸à¦®à¦¤à¦¾ à¦¸à¦®à¦¾à¦§à¦¾à¦¨ à¦¸à§‡à¦Ÿ" : item.title}
                          </h5>
                          <p className="text-sm text-gray-600 leading-relaxed font-semibold">
                            {lang === 'bn' && item.id === "hw1" ? "à¦—à¦¤à¦¿à¦° à¦¸à¦®à§€à¦•à¦°à¦£ à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§‡ à¦¸à§ƒà¦œà¦¨à¦¶à§€à¦² à¦ªà§à¦°à¦¶à§à¦¨ à§§ à¦¥à§‡à¦•à§‡ à§« à¦¸à¦®à¦¾à¦§à¦¾à¦¨ à¦•à¦°à¥¤" : lang === 'bn' && item.id === "hw2" ? "à¦¶à§à¦°à§‡à¦£à§€à¦•à¦•à§à¦·à§‡ à¦¦à§‡à¦“à¦¯à¦¼à¦¾ à¦¨à§‹à¦Ÿà¦¬à§à¦• à¦…à¦¨à§à¦¸à¦°à¦£ à¦•à¦°à§‡ à¦…à§à¦¯à¦¾à¦²à¦•à§‹à¦¹à¦² à¦“ à¦…à§à¦¯à¦¾à¦²à¦¡à¦¿à¦¹à¦¾à¦‡à¦¡à§‡à¦° à¦ªà¦¾à¦°à§à¦¥à¦•à§à¦¯ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à¥¤" : lang === 'bn' && item.id === "hw3" ? "à¦…à¦¨à§à¦¶à§€à¦²à¦¨à§€ à§­.à§¨ à¦à¦° à¦¸à¦•à¦² à¦—à¦¾à¦£à¦¿à¦¤à¦¿à¦• à¦¸à§‚à¦¤à§à¦°à¦¾à¦¬à¦²à§€ à¦–à¦¾à¦¤à¦¾à¦¯à¦¼ à¦²à¦¿à¦–à§‡ à¦†à¦¨à¦¬à§‡à¥¤" : item.description}
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
                  <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "à¦…à¦°à§à¦§-à¦¬à¦¾à¦°à§à¦·à¦¿à¦• à¦®à¦¡à§‡à¦² à¦ªà¦°à§€à¦•à§à¦·à¦¾à¦° à¦®à¦¾à¦°à§à¦•à¦¶à¦¿à¦Ÿ" : "Half-Yearly Mock Exam Marksheet"}</h4>
                  <p className="text-xs text-gray-500">{lang === 'bn' ? "à¦®à§‚à¦²à§à¦¯à¦¾à¦¯à¦¼à¦¨ à¦¸à§‡à¦¶à¦¨: à¦—à§à¦°à§€à¦·à§à¦®à¦•à¦¾à¦²à§€à¦¨ à§¨à§¦à§¨à§¬" : "Grading Term: Summer Session 2026"}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 px-3 py-1.5 rounded-xl">
                    {lang === 'bn' ? "à¦¸à¦°à§à¦¬à¦¶à§‡à¦· à¦œà¦¿à¦ªà¦¿à¦: à§«.à§¦à§¦" : "Final GPA: 5.00"}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-800 font-bold border border-blue-100 px-3 py-1.5 rounded-xl">
                    {lang === 'bn' ? "à¦—à§à¦°à§‡à¦¡: à¦+" : "Overall Grade: A+"}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">{lang === 'bn' ? "à¦¬à¦¿à¦·à¦¯à¦¼ à¦“ à¦•à§‹à¦°à§à¦¸" : "Subject Course"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "à¦ªà§à¦°à¦¾à¦ªà§à¦¤ à¦¨à¦®à§à¦¬à¦°" : "Obtained Marks"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "à¦²à§‡à¦Ÿà¦¾à¦° à¦—à§à¦°à§‡à¦¡" : "Letter Grade"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à¦¨à¦®à§à¦¬à¦°" : "Max Cap"}</th>
                      <th className="pb-3 text-right font-semibold">{lang === 'bn' ? "à¦®à¦¨à§à¦¤à¦¬à§à¦¯" : "Remarks"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                    {mockExamResults.map((res) => (
                      <tr key={res.subject} className="hover:bg-gray-50/50">
                        <td className="py-4 font-bold text-gray-900">{lang === 'bn' && res.subject === "Physics" ? "à¦ªà¦¦à¦¾à¦°à§à¦¥à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨" : lang === 'bn' && res.subject === "Chemistry" ? "à¦°à¦¸à¦¾à¦¯à¦¼à¦¨" : lang === 'bn' && res.subject === "Higher Mathematics" ? "à¦‰à¦šà§à¦šà¦¤à¦° à¦—à¦£à¦¿à¦¤" : lang === 'bn' && res.subject === "English Language" ? "à¦‡à¦‚à¦°à§‡à¦œà¦¿ à¦­à¦¾à¦·à¦¾" : res.subject}</td>
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
                          {res.marks >= 90 ? (lang === 'bn' ? 'à¦…à¦¸à¦¾à¦§à¦¾à¦°à¦£' : 'Outstanding') : res.marks >= 80 ? (lang === 'bn' ? 'à¦šà¦®à§Žà¦•à¦¾à¦°' : 'Excellent') : (lang === 'bn' ? 'à¦¸à¦¨à§à¦¤à§‹à¦·à¦œà¦¨à¦•' : 'Satisfactory')}
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
                      {lang === 'bn' ? "à¦—à§à¦°à§‡à¦¡ à¦¬à¦¾ à¦œà¦¿à¦ªà¦¿à¦ à¦‰à¦¨à§à¦¨à¦¤à¦¿à¦° à¦šà¦¿à¦¤à§à¦°" : "Academic GPA Improvement Trend"}
                    </h5>
                    <p className="text-xs text-gray-500 font-semibold">
                      {lang === 'bn' ? "à¦¬à¦¿à¦—à¦¤ à§« à¦¸à§‡à¦®à¦¿à¦¸à§à¦Ÿà¦¾à¦°à§‡à¦° à¦œà¦¿à¦ªà¦¿à¦ (GPA) à¦­à¦¿à¦¤à§à¦¤à¦¿à¦• à¦¤à§à¦²à¦¨à¦¾ à¦šà¦¿à¦¤à§à¦°" : "Comparative GPA improvement tracking over the last 5 semesters"}
                    </p>
                  </div>
                  
                  {/* Stats badge showing total improvement */}
                  <div className="flex items-center gap-2 bg-[#025644]/5 text-[#025644] border border-[#025644]/10 rounded-xl px-3 py-1.5 self-start md:self-auto">
                    <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
                    <span className="text-xs font-extrabold">
                      {lang === 'bn' ? "+à§§à§­.à§¬% à¦§à¦¾à¦°à¦¾à¦¬à¦¾à¦¹à¦¿à¦• à¦‰à¦¨à§à¦¨à¦¤à¦¿" : "+17.6% Consistent Progress"}
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
                                  {lang === 'bn' ? 'à¦ªà§à¦°à¦¾à¦ªà§à¦¤ à¦œà¦¿à¦ªà¦¿à¦' : 'Earned GPA'}: <span className="font-mono text-sm font-black">{payload[0].value.toFixed(2)}</span>
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
                <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "à¦¸à¦¾à¦ªà§à¦¤à¦¾à¦¹à¦¿à¦• à¦•à§à¦²à¦¾à¦¸à§‡à¦° à¦°à§à¦Ÿà¦¿à¦¨ à¦“ à¦¸à¦®à¦¯à¦¼" : "Weekly Routine & Periods"}</h4>
                <p className="text-xs text-gray-500">{lang === 'bn' ? "à§¯à¦® à¦¶à§à¦°à§‡à¦£à§€ - à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨ à¦¶à¦¾à¦–à¦¾ 'à¦•' à¦à¦° à¦¨à¦¿à¦¯à¦¼à¦®à¦¿à¦¤ à¦¸à¦®à¦¯à¦¼à¦¸à§‚à¦šà§€" : "Regular classes schedule for Grade IX - Science Section A"}</p>
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
                      {lang === 'bn' ? "à¦¶à¦¿à¦•à§à¦·à¦¾à¦¬à¦°à§à¦·: à§¨à§¦à§¨à§¬" : "Session: 2026"}
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
                          {lang === 'bn' ? "à¦¨à¦¿à¦¬à¦¨à§à¦§à¦¿à¦¤ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€" : "Active Student"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-bold">
                        {lang === 'bn' ? "à¦†à¦‡à¦¡à¦¿ à¦¨à¦®à§à¦¬à¦°: " : "Student ID: "} <span className="font-mono">{mockStudentProfile.id}</span>
                      </p>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? "à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿà¦¸ à¦•à§‡à¦¯à¦¼à¦¾à¦° à¦®à¦¡à§‡à¦² à¦¸à§à¦•à§à¦²" : "Students Care Model School"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Academic info */}
                    <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <BookOpen className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "à¦¶à¦¿à¦•à§à¦·à¦¾à¦—à¦¤ à¦¤à¦¥à§à¦¯" : "Academic Credentials"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦¶à§à¦°à§‡à¦£à§€" : "Grade/Class"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "à§¯à¦® à¦¶à§à¦°à§‡à¦£à§€" : mockStudentProfile.className}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦¶à¦¾à¦–à¦¾" : "Section"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨ 'à¦•'" : mockStudentProfile.section}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦°à§‹à¦² à¦¨à¦®à§à¦¬à¦°" : "Class Roll"}</span>
                          <span className="font-mono font-extrabold text-[#025644] bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-md text-xs">{mockStudentProfile.roll}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦¶à¦¿à¦•à§à¦·à¦¾ à¦—à§à¦°à§à¦ª" : "Group Stream"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨" : "Science"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Personal details */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <User className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "à¦¬à§à¦¯à¦•à§à¦¤à¦¿à¦—à¦¤ à¦¤à¦¥à§à¦¯" : "Personal Records"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦°à¦•à§à¦¤à§‡à¦° à¦—à§à¦°à§à¦ª" : "Blood Group"}</span>
                          <span className="font-extrabold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-md text-xs">{mockStudentProfile.bloodGroup}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦œà¦¨à§à¦® à¦¤à¦¾à¦°à¦¿à¦–" : "Date of Birth"}</span>
                          <span className="font-extrabold text-gray-800">12th May, 2011</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦²à¦¿à¦™à§à¦—" : "Gender"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "à¦ªà§à¦°à§à¦·" : "Male"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦§à¦°à§à¦®" : "Religion"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "à¦‡à¦¸à¦²à¦¾à¦®" : "Islam"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Contact details */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <Phone className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "à¦¯à§‹à¦—à¦¾à¦¯à§‹à¦— à¦“ à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•" : "Guardian & Contact"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between flex-wrap gap-1">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•" : "Guardian"}</span>
                          <span className="font-extrabold text-gray-800">{mockStudentProfile.guardian}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦®à§‹à¦¬à¦¾à¦‡à¦²" : "Contact Phone"}</span>
                          <span className="font-mono font-extrabold text-gray-800">{mockStudentProfile.phone}</span>
                        </div>
                        <div className="flex justify-between flex-wrap gap-1">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦‡à¦®à§‡à¦‡à¦²" : "Email Address"}</span>
                          <span className="font-mono text-xs font-extrabold text-[#025644] hover:underline">imran.parent@scms.edu.bd</span>
                        </div>
                        <div className="flex justify-between flex-wrap gap-1 text-right">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "à¦¸à§à¦¥à¦¾à¦¯à¦¼à§€ à¦ à¦¿à¦•à¦¾à¦¨à¦¾" : "Permanent Address"}</span>
                          <span className="font-extrabold text-gray-800 text-xs max-w-[150px] leading-tight">
                            {lang === 'bn' ? "à¦šà¦°à¦²à¦•à§à¦·à§à¦¯à¦¾, à¦•à¦°à§à¦£à¦«à§à¦²à§€, à¦šà¦Ÿà§à¦Ÿà¦—à§à¦°à¦¾à¦®" : "Charlakshya, Karnaphuli, Chattogram"}
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
                        <h5 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿à¦° à¦–à¦¤à¦¿à¦¯à¦¼à¦¾à¦¨ (à¦šà¦²à¦¤à¦¿ à¦¸à§‡à¦¶à¦¨)" : "Attendance Record (Current Session)"}</h5>
                        <p className="text-xs text-gray-500 font-semibold">{lang === 'bn' ? "à¦†à¦ªà¦¨à¦¾à¦° à¦¸à¦¾à¦®à¦—à§à¦°à¦¿à¦• à¦•à§à¦²à¦¾à¦¸à§‡ à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿à¦° à¦ªà¦¾à¦°à¦«à¦°à¦®à§à¦¯à¦¾à¦¨à§à¦¸ à¦šà¦®à§Žà¦•à¦¾à¦°!" : "Excellent! You are maintaining an elite presence streak this term."}</p>
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
          ? `à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤à¦­à¦¾à¦¬à§‡ "${fileName}" à¦«à¦¾à¦‡à¦²à¦Ÿà¦¿ à¦—à§à¦—à¦² à¦¡à§à¦°à¦¾à¦‡à¦­ à¦¥à§‡à¦•à§‡ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¤à§‡ à¦šà¦¾à¦¨?` 
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
              <Cloud className="h-3.5 w-3.5" /> {lang === 'bn' ? 'à¦—à§à¦—à¦² à¦¡à§à¦°à¦¾à¦‡à¦­ à¦¸à§à¦Ÿà§‹à¦°à§‡à¦œ' : 'Google Drive Storage'}
            </span>
            <h3 className="font-extrabold text-gray-900 text-lg mt-1.5">
              {lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦‰à¦¡ à¦«à¦¾à¦‡à¦² à¦…à§à¦¯à¦¾à¦¨à§à¦¡ à¦¡à¦•à§à¦®à§‡à¦¨à§à¦Ÿ à¦¸à§‡à¦¨à§à¦Ÿà¦¾à¦°' : 'Cloud Document & File Center'}
            </h3>
            <p className="text-xs text-gray-400 font-bold">
              {lang === 'bn' 
                ? 'à¦…à¦¨à¦²à¦¾à¦‡à¦¨ à¦­à¦°à§à¦¤à¦¿ à¦«à¦°à¦®, à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦…à§à¦¯à¦¾à¦Ÿà¦¾à¦šà¦®à§‡à¦¨à§à¦Ÿ à¦à¦¬à¦‚ à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿ à¦«à¦¾à¦‡à¦² à¦¸à¦°à¦¾à¦¸à¦°à¦¿ à¦—à§à¦—à¦² à¦¡à§à¦°à¦¾à¦‡à¦­à§‡ à¦®à§à¦¯à¦¾à¦¨à§‡à¦œ à¦•à¦°à§à¦¨à¥¤' 
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
                {lang === 'bn' ? 'à¦²à¦— à¦†à¦‰à¦Ÿ' : 'Disconnect'}
              </button>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {uploadError && (
          <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3">
            <span className="text-rose-600 font-black text-lg leading-none shrink-0">&times;</span>
            <div className="text-xs font-bold text-rose-800">
              <p className="font-black mb-0.5">{lang === 'bn' ? 'à¦¤à§à¦°à§à¦Ÿà¦¿ à¦˜à¦Ÿà§‡à¦›à§‡' : 'An error occurred'}</p>
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
                {lang === 'bn' ? 'à¦—à§à¦—à¦² à¦¡à§à¦°à¦¾à¦‡à¦­ à¦²à¦¿à¦‚à¦• à¦•à¦°à§à¦¨' : 'Connect Google Drive'}
              </h4>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                {lang === 'bn' 
                  ? 'à¦†à¦ªà¦¨à¦¾à¦° à¦—à§à¦—à¦² à¦¡à§à¦°à¦¾à¦‡à¦­ à¦à¦•à¦¾à¦‰à¦¨à§à¦Ÿà§‡à¦° à¦¸à¦¾à¦¥à§‡ à¦¸à¦‚à¦¯à§‹à¦— à¦•à¦°à§‡ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦¦à§‡à¦° à¦œà¦¨à§à¦¯ à¦«à¦¾à¦‡à¦² à¦†à¦ªà¦²à§‹à¦¡ à¦à¦¬à¦‚ à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡ à¦¸à§à¦¬à¦¿à¦§à¦¾ à¦šà¦¾à¦²à§ à¦•à¦°à§à¦¨à¥¤' 
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
              <span className="text-sm">{lang === 'bn' ? 'à¦—à§à¦—à¦² à¦à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦¦à¦¿à¦¯à¦¼à§‡ à¦¸à¦¾à¦‡à¦¨-à¦‡à¦¨ à¦•à¦°à§à¦¨' : 'Sign in with Google'}</span>
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
                      {item.name === 'root' ? (lang === 'bn' ? 'à¦†à¦®à¦¾à¦° à¦¡à§à¦°à¦¾à¦‡à¦­' : 'My Drive') : item.name}
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
                    title={lang === 'bn' ? 'à¦ªà§‚à¦°à§à¦¬à§‡à¦° à¦«à§‹à¦²à§à¦¡à¦¾à¦°à§‡ à¦«à¦¿à¦°à§à¦¨' : 'Go back'}
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
                  {lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦«à§‹à¦²à§à¦¡à¦¾à¦°' : 'New Folder'}
                </button>

                {/* File Upload Selector */}
                <label className="px-3.5 py-2 bg-[#025644] hover:bg-[#01352a] text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {lang === 'bn' ? 'à¦«à¦¾à¦‡à¦² à¦†à¦ªà¦²à§‹à¦¡' : 'Upload File'}
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
                  placeholder={lang === 'bn' ? 'à¦«à§‹à¦²à§à¦¡à¦¾à¦°à§‡à¦° à¦¨à¦¾à¦®...' : 'Folder name...'}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#005c53]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#025644] hover:bg-[#01352a] text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§à¦¨' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'à¦¬à¦¾à¦¤à¦¿à¦²' : 'Cancel'}
                </button>
              </motion.form>
            )}

            {/* List / Grid Browser of Files */}
            {isDriveLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#025644]" />
                <p className="text-xs text-gray-400 font-bold">{lang === 'bn' ? 'à¦«à¦¾à¦‡à¦² à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...' : 'Fetching items from Google Drive...'}</p>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-20 border border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center">
                  <Folder className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900">{lang === 'bn' ? 'à¦à¦‡ à¦«à§‹à¦²à§à¦¡à¦¾à¦°à¦Ÿà¦¿ à¦–à¦¾à¦²à¦¿' : 'Folder is empty'}</h4>
                  <p className="text-xs text-gray-400 font-bold max-w-xs mt-1">
                    {lang === 'bn' 
                      ? 'à¦à¦–à¦¾à¦¨à§‡ à¦•à§‹à¦¨ à¦«à¦¾à¦‡à¦² à¦¬à¦¾ à¦¸à¦¾à¦¬-à¦«à§‹à¦²à§à¦¡à¦¾à¦° à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤ à¦†à¦ªà¦¨à¦¾à¦° à¦ªà§à¦°à¦¯à¦¼à§‹à¦œà¦¨à§€à¦¯à¦¼ à¦«à¦¾à¦‡à¦²à¦Ÿà¦¿ à¦†à¦ªà¦²à§‹à¦¡ à¦•à¦°à§à¦¨à¥¤' 
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
                            {isFolder ? (lang === 'bn' ? 'à¦«à§‹à¦²à§à¦¡à¦¾à¦°' : 'Folder') : formatBytes(file.size)}
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
                              title={lang === 'bn' ? 'à¦¡à§à¦°à¦¾à¦‡à¦­à§‡ à¦¦à§‡à¦–à§à¦¨' : 'View in Google Drive'}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteFileClick(file.id, file.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                            title={lang === 'bn' ? 'à¦®à§à¦›à§‡ à¦«à§‡à¦²à§à¦¨' : 'Delete'}
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
    let dynamicGreetingBn = 'à¦¶à§à¦­ à¦¸à¦•à¦¾à¦²';
    if (hours >= 12 && hours < 17) {
      dynamicGreetingEn = 'Good afternoon';
      dynamicGreetingBn = 'à¦¶à§à¦­ à¦…à¦ªà¦°à¦¾à¦¹à§à¦¨';
    } else if (hours >= 17 && hours < 20) {
      dynamicGreetingEn = 'Good evening';
      dynamicGreetingBn = 'à¦¶à§à¦­ à¦¸à¦¨à§à¦§à§à¦¯à¦¾';
    } else if (hours >= 20 || hours < 5) {
      dynamicGreetingEn = 'Good night';
      dynamicGreetingBn = 'à¦¶à§à¦­ à¦°à¦¾à¦¤à§à¦°à¦¿';
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
        'à¦¬à§ˆà¦¶à¦¾à¦–', 'à¦œà§à¦¯à§ˆà¦·à§à¦ ', 'à¦†à¦·à¦¾à¦¢à¦¼', 'à¦¶à§à¦°à¦¾à¦¬à¦£', 'à¦­à¦¾à¦¦à§à¦°', 'à¦†à¦¶à§à¦¬à¦¿à¦¨', 
        'à¦•à¦¾à¦°à§à¦¤à¦¿à¦•', 'à¦…à¦—à§à¦°à¦¹à¦¾à¦¯à¦¼à¦£', 'à¦ªà§Œà¦·', 'à¦®à¦¾à¦˜', 'à¦«à¦¾à¦²à§à¦—à§à¦¨', 'à¦šà§ˆà¦¤à§à¦°'
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
      const banglaDaysOfWeek = ['à¦°à¦¬à¦¿à¦¬à¦¾à¦°', 'à¦¸à§‹à¦®à¦¬à¦¾à¦°', 'à¦®à¦™à§à¦—à¦²à¦¬à¦¾à¦°', 'à¦¬à§à¦§à¦¬à¦¾à¦°', 'à¦¬à§ƒà¦¹à¦¸à§à¦ªà¦¤à¦¿à¦¬à¦¾à¦°', 'à¦¶à§à¦•à§à¦°à¦¬à¦¾à¦°', 'à¦¶à¦¨à¦¿à¦¬à¦¾à¦°'];
      const dayOfWeek = banglaDaysOfWeek[date.getDay()];
      
      const toBanglaDigits = (num: number) => {
        const digits = ['à§¦', 'à§§', 'à§¨', 'à§©', 'à§ª', 'à§«', 'à§¬', 'à§­', 'à§®', 'à§¯'];
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
        const daysOfWeekBn = ['à¦°à¦¬à¦¿à¦¬à¦¾à¦°', 'à¦¸à§‹à¦®à¦¬à¦¾à¦°', 'à¦®à¦™à§à¦—à¦²à¦¬à¦¾à¦°', 'à¦¬à§à¦§à¦¬à¦¾à¦°', 'à¦¬à§ƒà¦¹à¦¸à§à¦ªà¦¤à¦¿à¦¬à¦¾à¦°', 'à¦¶à§à¦•à§à¦°à¦¬à¦¾à¦°', 'à¦¶à¦¨à¦¿à¦¬à¦¾à¦°'];
        const weekday = l === 'bn' ? daysOfWeekBn[date.getDay()] : daysOfWeekEn[date.getDay()];
        
        if (l === 'bn') {
          if (!parts.includes('à¦¹à¦¿à¦œà¦°à¦¿') && !parts.includes('à¦¹à¦¿à¦œà¦°à§€')) {
            parts = parts + ' à¦¹à¦¿à¦œà¦°à¦¿';
          }
          return `${weekday}, ${parts}`;
        } else {
          if (!parts.includes('AH')) {
            parts = parts + ' AH';
          }
          return `${weekday}, ${parts}`;
        }
      } catch (e) {
        return l === 'bn' ? 'à¦¶à¦¨à¦¿à¦¬à¦¾à¦°, à§¨à§¬ à¦®à¦¹à¦°à¦°à¦®, à§§à§ªà§ªà§® à¦¹à¦¿à¦œà¦°à¦¿' : 'Saturday, Muharram 26, 1448 AH';
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
              {lang === 'bn' ? `${dynamicGreetingBn}, à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨!` : `${dynamicGreetingEn}, Admin!`} <span className="inline-block">â˜…</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-bold">
              {lang === 'bn' 
                ? `à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿà¦¸ à¦•à§‡à¦¯à¦¼à¦¾à¦° à¦®à¦¡à§‡à¦² à¦¸à§à¦•à§à¦²à§‡ à¦†à¦œà¦•à§‡ à¦•à¦¿ à¦•à¦¿ à¦˜à¦Ÿà¦›à§‡ à¦¤à¦¾ à¦¦à§‡à¦–à§‡ à¦¨à¦¿à¦¨, ${englishDateStr}à¥¤` 
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
                <span className="text-[9px] font-bold text-emerald-600 tracking-wider block mb-0.5">à¦¬à¦¾à¦‚à¦²à¦¾</span>
                <span className="text-xs font-black text-gray-800 block">{banglaDateStr}</span>
              </div>
            </div>

            {/* Hijri Date */}
            <div className="bg-white border border-gray-150 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50 flex items-center justify-center shrink-0">
                <Clock className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] font-bold text-amber-600 tracking-wider block mb-0.5">à¦¹à¦¿à¦œà¦°à¦¿</span>
                <span className="text-xs font-black text-gray-800 block">{lang === 'bn' ? hijriDateStrBn : hijriDateStrEn}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Stats Row with SVG Sparklines on the right of values */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { 
              labelBn: "à¦®à§‹à¦Ÿ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€", 
              labelEn: "Total Students", 
              value: students.length.toString(), 
              change: students.filter(s => s.status === 'Active').length > 0 ? `+${((students.filter(s => s.status === 'Active').length / students.length) * 100).toFixed(0)}% Act` : "0%",
              trend: "up", 
              sparkData: [12, 14, 13, 15, 14, 16, students.length * 2], 
              color: "#a855f7", 
              bg: "purple" 
            },
            { 
              labelBn: "à¦®à§à¦²à¦¤à§à¦¬à¦¿ à¦­à¦°à§à¦¤à¦¿ à¦†à¦¬à§‡à¦¦à¦¨", 
              labelEn: "Pending Admissions", 
              value: pendingAdmissions.filter((adm: any) => adm.status === 'pending').length.toString(), 
              change: `Req: ${pendingAdmissions.length}`, 
              trend: "neutral", 
              sparkData: [8, 10, 9, 11, 10, 12, pendingAdmissions.filter((adm: any) => adm.status === 'pending').length * 4], 
              color: "#10b981", 
              bg: "emerald" 
            },
            { 
              labelBn: "à¦•à¦°à§à¦®à¦°à¦¤ à¦¶à¦¿à¦•à§à¦·à¦•", 
              labelEn: "Active Teachers", 
              value: employees.filter(e => e.status === 'Active').length.toString(), 
              change: `Tot: ${employees.length}`, 
              trend: "up", 
              sparkData: [10, 8, 11, 9, 12, 11, employees.filter(e => e.status === 'Active').length * 5], 
              color: "#d97706", 
              bg: "amber" 
            },
            { 
              labelBn: "à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼ à¦¶à§à¦°à§‡à¦£à§€à¦¸à¦®à§‚à¦¹", 
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
              <span className="text-xs font-bold uppercase tracking-wider text-teal-50">{lang === 'bn' ? 'à¦®à§‹à¦Ÿ à¦•à¦¾à¦²à§‡à¦•à¦¶à¦¨' : 'Total Collection'}</span>
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-white/15">
                <Coins className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="my-3 text-left space-y-1">
              <h3 className="text-3xl font-black tracking-tight leading-none font-sans">
                à§³ 1,25,760
              </h3>
              <p className="text-[11px] text-teal-100/90 font-bold">{lang === 'bn' ? 'à¦šà¦²à¦¤à¦¿ à¦®à¦¾à¦¸ â€¢ à¦Ÿà¦¾à¦°à§à¦—à§‡à¦Ÿà§‡à¦° à§®à§§%' : 'This month â€¢ 81% of target'}</p>
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
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">{lang === 'bn' ? 'à¦¬à¦•à§‡à¦¯à¦¼à¦¾ à¦ªà¦¾à¦“à¦¨à¦¾' : 'Pending Dues'}</span>
              <div className="h-10 w-10 bg-amber-200/60 rounded-xl flex items-center justify-center text-amber-800 shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-amber-300/30">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="my-2 text-left">
              <h3 className="text-3xl font-black tracking-tight leading-none text-amber-950">
                à§³ 28,430
              </h3>
              <p className="text-[11px] text-amber-900/80 font-extrabold mt-1">{lang === 'bn' ? 'à§§à§ªà§¨ à¦œà¦¨ à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•à§‡à¦° à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦¬à¦¾à¦•à¦¿' : '142 guardians pending payment'}</p>
            </div>
            <button className="w-full max-w-fit mt-1 px-4 py-1.5 bg-white hover:bg-amber-50 text-amber-900 text-xs font-black rounded-xl border border-amber-200/60 transition-all cursor-pointer shadow-3xs flex items-center justify-center">
              {lang === 'bn' ? 'à¦°à¦¿à¦®à¦¾à¦‡à¦¨à§à¦¡à¦¾à¦° à¦ªà¦¾à¦ à¦¾à¦¨' : 'Send reminders'}
            </button>
          </div>

          {/* Card C: Overdue */}
          <div className="bg-[#ffe4e6] border border-[#fda4af] p-6 rounded-2xl shadow-xs flex flex-col justify-between min-h-[180px] group text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#881337]">{lang === 'bn' ? 'à¦…à¦¤à¦¿à¦°à¦¿à¦•à§à¦¤ à¦¬à¦¿à¦²à¦®à§à¦¬à¦¿à¦¤' : 'Overdue'}</span>
              <div className="h-10 w-10 bg-rose-200/80 rounded-xl flex items-center justify-center text-[#881337] shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-rose-300/30">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <div className="my-2 text-left">
              <h3 className="text-3xl font-black tracking-tight leading-none text-[#881337]">
                à§³ 9,870
              </h3>
              <p className="text-[11px] text-[#9f1239] font-extrabold mt-1">{lang === 'bn' ? 'à§©à§® à¦Ÿà¦¿ à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ â€¢ à§©à§¦+ à¦¦à¦¿à¦¨ à¦…à¦¤à¦¿à¦¬à¦¾à¦¹à¦¿à¦¤' : '38 accounts â€¢ > 30 days'}</p>
            </div>
            <button className="w-full max-w-fit mt-1 px-4 py-1.5 bg-white hover:bg-rose-100 text-[#881337] text-xs font-black rounded-xl border border-rose-300 transition-all cursor-pointer shadow-3xs flex items-center justify-center">
              {lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦°à¦¿à¦­à¦¿à¦‰' : 'Review accounts'}
            </button>
          </div>
        </div>

        {/* Row 4: Student & Fee Overview & Fee Collection Status Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student & Fee Overview Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-150 p-6 rounded-2xl shadow-2xs text-left flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? 'à¦›à¦¾à¦¤à§à¦° à¦“ à¦«à¦¿ à¦“à¦­à¦¾à¦°à¦­à¦¿à¦‰' : 'Student & Fee Overview'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? 'à¦¬à¦¿à¦—à¦¤ à§® à¦®à¦¾à¦¸ â€¢ à¦¦à§à¦¬à§ˆà¦¤ à¦…à¦•à§à¦·' : 'Last 8 months â€¢ dual axis'}</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-extrabold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block" />
                  <span className="text-gray-500">{lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€' : 'Students'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 block" />
                  <span className="text-gray-600">{lang === 'bn' ? 'à¦«à¦¿ à¦•à¦¾à¦²à§‡à¦•à¦¶à¦¨' : 'Fees'}</span>
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
                    tickFormatter={(val) => `à§³${(val / 1000).toFixed(0)}k`}
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
              <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? 'à¦«à¦¿ à¦•à¦¾à¦²à§‡à¦•à¦¶à¦¨ à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸' : 'Fee Collection Status'}</h3>
              <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? 'à¦†à¦—à¦¸à§à¦Ÿ à¦®à¦¾à¦¸à§‡à¦° à¦«à¦¿ à¦¸à¦¾à¦°à¦¸à¦‚à¦•à§à¦·à§‡à¦ª' : 'August summary'}</p>
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
                  <span className="text-[10px] text-gray-500 font-extrabold mt-1">{lang === 'bn' ? 'à¦¸à¦‚à¦—à§ƒà¦¹à§€à¦¤' : 'Collected'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold text-[#475569] pt-3 border-t border-gray-100 mt-2">
              <div>
                <span className="block text-blue-600 font-black">à§³97k</span>
                <span>{lang === 'bn' ? 'à¦¸à¦‚à¦—à§ƒà¦¹à§€à¦¤' : 'Collected'}</span>
              </div>
              <div>
                <span className="block text-orange-500 font-black">à§³18k</span>
                <span>{lang === 'bn' ? 'à¦¬à¦•à§‡à¦¯à¦¼à¦¾' : 'Pending'}</span>
              </div>
              <div>
                <span className="block text-red-500 font-black">à§³10k</span>
                <span>{lang === 'bn' ? 'à¦¬à¦¿à¦²à¦®à§à¦¬à¦¿à¦¤' : 'Overdue'}</span>
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
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? 'à¦¦à§ˆà¦¨à¦¿à¦• à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦¹à¦¿à¦Ÿà¦®à§à¦¯à¦¾à¦ª' : 'Daily Attendance Heatmap'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦¦à§‡à¦° à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦˜à¦¨à¦¤à§à¦¬à§‡à¦° à¦°à§‡à¦•à¦°à§à¦¡' : 'Student attendance density records'}</p>
              </div>
              <span className="text-xs font-black text-[#005c53] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                {lang === 'bn' ? 'à¦†à¦—à¦¸à§à¦Ÿ à§¨à§¦à§¨à§¬' : 'August 2026'}
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
              <span className="text-[11px] uppercase tracking-wider">{lang === 'bn' ? 'à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦¹à¦¾à¦°:' : 'Attendance Rate:'}</span>
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
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? 'à¦¸à§‡à¦°à¦¾ à¦ªà¦¾à¦°à¦«à¦°à§à¦®à¦¾à¦° à¦²à¦¿à¦¡à¦¾à¦°à¦¬à§‹à¦°à§à¦¡' : 'Top Performers Leaderboard'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? 'à¦à¦•à¦¾à¦¡à§‡à¦®à¦¿à¦• à¦“ à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦¸à§à¦•à§‹à¦°à§‡ à¦¸à§‡à¦°à¦¾ à§« à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€' : 'Top 5 students in academics & attendance'}</p>
              </div>
              <span className="text-xs font-black text-[#005c53] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                {lang === 'bn' ? 'à¦šà¦²à¦¤à¦¿ à¦Ÿà¦¾à¦°à§à¦®' : 'Current Term'}
              </span>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-4">
              {[
                { rank: 1, name: 'Sajid Hasan', class: 'Class 9-A', score: '98.5%', badge: 'â˜… Golden A+' },
                { rank: 2, name: 'Tasnim Rahman', class: 'Class 10-A', score: '97.2%', badge: 'â˜… High Attendance' },
                { rank: 3, name: 'Arefin Chowdhury', class: 'Class 8-B', score: '95.8%', badge: 'â˜… Top Grade' },
                { rank: 4, name: 'Maliha Islam', class: 'Class 9-B', score: '94.3%', badge: 'â˜… Consistently Active' },
                { rank: 5, name: 'Nabil Ahmed', class: 'Class 7-A', score: '93.1%', badge: 'â˜… Excel' }
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
                      <span className="text-[10px] text-gray-400 font-bold">{student.class} â€¢ {student.badge}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gray-900 text-xs">{student.score}</span>
                    <span className="text-[9px] text-emerald-600 font-bold block">â˜… Score</span>
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
      { id: 'dashboard', label: lang === 'bn' ? 'à¦¡à§à¦¯à¦¾à¦¶à¦¬à§‹à¦°à§à¦¡' : 'Dashboard', icon: LayoutDashboard },
      { id: 'frontend', label: lang === 'bn' ? 'à¦«à§à¦°à¦¨à§à¦Ÿà¦à¦¨à§à¦¡ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸' : 'Frontend', icon: Sliders },
      { id: 'student_details', label: lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¤à¦¥à§à¦¯' : 'Student Details', icon: Users },
      { id: 'admission', label: lang === 'bn' ? 'à¦­à¦°à§à¦¤à¦¿ à¦•à¦¾à¦°à§à¦¯à¦•à§à¦°à¦®' : 'Admission', icon: UserPlus },
      { id: 'employee', label: lang === 'bn' ? 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦“ à¦¶à¦¿à¦•à§à¦·à¦•' : 'Employee', icon: GraduationCap },
      { id: 'classes', label: lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦°à§à¦®' : 'Classes', icon: BookOpen },
      { id: 'fees', label: lang === 'bn' ? 'à¦«à¦¿ à¦•à¦¾à¦²à§‡à¦•à¦¶à¦¨' : 'Fees', icon: Wallet },
      { id: 'card', label: lang === 'bn' ? 'à¦†à¦‡à¦¡à¦¿ à¦•à¦¾à¦°à§à¦¡ à¦¤à§ˆà¦°à¦¿' : 'Card Management', icon: CreditCard },
      { id: 'certificate', label: lang === 'bn' ? 'à¦¶à¦‚à¦¸à¦¾à¦ªà¦¤à§à¦°' : 'Certificate', icon: Award },
      { id: 'academic', label: lang === 'bn' ? 'à¦à¦•à¦¾à¦¡à§‡à¦®à¦¿à¦• à¦°à§à¦Ÿà¦¿à¦¨' : 'Academic', icon: Calendar },
      { id: 'exam', label: lang === 'bn' ? 'à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦“ à¦«à¦²à¦¾à¦«à¦²' : 'Exam', icon: FileText },
      { id: 'attendance', label: lang === 'bn' ? 'à¦¹à¦¾à¦œà¦¿à¦°à¦¾ à¦–à¦¾à¦¤à¦¾' : 'Attendance', icon: CheckSquare },
      { id: 'notice', label: lang === 'bn' ? 'à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà¦¾à¦¬à¦²à¦¿à¦¶à¦¾à¦°' : 'Notice', icon: Bell },
      { id: 'homework', label: lang === 'bn' ? 'à¦¬à¦¾à¦¡à¦¼à¦¿à¦° à¦•à¦¾à¦œ' : 'Homework', icon: BookOpen },
      { id: 'sms', label: lang === 'bn' ? 'à¦¬à¦¾à¦²à§à¦• à¦à¦¸à¦à¦®à¦à¦¸' : 'Bulk Sms And Email', icon: MessageSquare },
      { id: 'student_accounting', label: lang === 'bn' ? 'à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿ à¦¹à¦¿à¦¸à¦¾à¦¬' : 'Student Accounting', icon: DollarSign },
      { id: 'office_accounting', label: lang === 'bn' ? 'à¦…à¦«à¦¿à¦¸ à¦•à§à¦¯à¦¾à¦¶ à¦¬à§à¦•' : 'Office Accounting', icon: FileSpreadsheet },
      { id: 'reports', label: lang === 'bn' ? 'à¦•à¦¾à¦°à§à¦¯à¦•à§à¦°à¦® à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ' : 'Reports', icon: Activity },
      { id: 'google_drive', label: lang === 'bn' ? 'à¦—à§à¦—à¦² à¦¡à§à¦°à¦¾à¦‡à¦­ à¦¸à§à¦Ÿà§‹à¦°à§‡à¦œ' : 'Google Drive Storage', icon: Cloud },
      { id: 'settings', label: lang === 'bn' ? 'à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸' : 'Settings', icon: Settings },
      { id: 'developer_hub', label: lang === 'bn' ? 'à¦•à§‹à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦—à¦¾à¦‡à¦¡' : 'Code Change Guide', icon: Code },
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
              <span className="text-[#005c53]">â€¢</span>
              {lang === 'bn' ? 'à¦•à§‹à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦“ à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦® à¦†à¦°à§à¦•à¦¿à¦Ÿà§‡à¦•à¦šà¦¾à¦° à¦—à¦¾à¦‡à¦¡' : 'Developer & Code Change Guide'}
            </h3>
            <p className="text-xs text-gray-400 font-bold">
              {lang === 'bn' 
                ? 'à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿà¦¸ à¦•à§‡à¦¯à¦¼à¦¾à¦° à¦®à¦¡à§‡à¦² à¦¸à§à¦•à§à¦²à§‡à¦° à¦à¦¡à¦®à¦¿à¦¨ à¦ªà§‹à¦°à§à¦Ÿà¦¾à¦²à§‡ à¦•à¦°à¦¾ à¦¸à¦¾à¦®à§à¦ªà§à¦°à¦¤à¦¿à¦• à¦•à§‹à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨à§‡à¦° à¦¸à¦®à§à¦ªà§‚à¦°à§à¦£ à¦¡à¦¿à¦°à§‡à¦•à§à¦Ÿà¦°à¦¿' 
                : 'Complete directory of recent custom code changes and modal structures in the Admin Portal'}
            </p>
          </div>
          <span className="self-start md:self-auto px-3.5 py-1.5 bg-emerald-50 border border-emerald-150 text-[#005c53] text-[11px] font-black rounded-xl flex items-center gap-1.5 shadow-3xs animate-bounce">
            <span className="h-2 w-2 rounded-full bg-[#005c53] animate-pulse" />
            {lang === 'bn' ? 'à¦…à¦Ÿà§‹-à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à§‹à¦¡ à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦® à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼' : 'Live Auto-Sync Active'}
          </span>
        </div>

        {/* Informative Warning Card */}
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-start gap-3.5 text-slate-700">
          <div className="h-9 w-9 rounded-xl bg-slate-100 text-[#005c53] border border-slate-200 flex items-center justify-center shrink-0">
            <Code className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-extrabold text-slate-900">
              {lang === 'bn' ? 'à¦¡à¦¾à¦‡à¦¨à¦¾à¦®à¦¿à¦• à¦•à§‹à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¨à¦¿à¦°à§à¦¦à§‡à¦¶à¦¨à¦¾à¦¬à¦²à§€' : 'Developer Interactive Guidance'}
            </p>
            <p className="leading-relaxed font-semibold text-gray-500">
              {lang === 'bn' 
                ? 'à¦†à¦ªà¦¨à¦¿ à¦¯à¦–à¦¨ à¦à¦¡à¦®à¦¿à¦¨ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²à§‡à¦° à¦•à§‹à¦¨à§‹ à¦…à¦ªà¦¶à¦¨ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¬à§‡à¦¨, à¦à¦‡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨à¦¸à¦®à§‚à¦¹ à¦¸à§à¦¬à¦¯à¦¼à¦‚à¦•à§à¦°à¦¿à¦¯à¦¼à¦­à¦¾à¦¬à§‡ à¦¨à¦¿à¦šà§‡à¦° à¦•à§‹à¦¡ à¦¬à§à¦²à¦•à§‡ à¦ªà§à¦°à¦¤à¦¿à¦¸à§à¦¥à¦¾à¦ªà¦¿à¦¤ à¦¹à¦¬à§‡à¥¤ à¦†à¦ªà¦¨à¦¿ à¦¶à§à¦§à§ à¦•à§‹à¦¡à¦Ÿà¦¿ à¦•à¦ªà¦¿ à¦•à¦°à§‡ à¦¨à¦¿à¦šà§‡ à¦¦à§‡à¦“à¦¯à¦¼à¦¾ à¦¨à¦¿à¦°à§à¦¦à¦¿à¦·à§à¦Ÿ à¦²à¦¾à¦‡à¦¨ à¦¨à¦®à§à¦¬à¦°à§‡ à¦ªà§‡à¦¸à§à¦Ÿ à¦•à¦°à§‡ à¦ªà¦¾à¦°à§à¦®à¦¾à¦¨à§‡à¦¨à§à¦Ÿà¦²à¦¿ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¦¨à¥¤' 
                : 'Whenever you change any option in the Admin Panel settings, the generated code blocks below will automatically update with your live values! Simply copy the updated code and replace the specified line ranges.'}
            </p>
          </div>
        </div>

        {/* Section Tabs inside the hub */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
          {[
            { id: 'overview', labelBn: 'à¦¸à¦¾à¦°à¦¸à¦‚à¦•à§à¦·à§‡à¦ª', labelEn: 'Overview' },
            { id: 'settings_full', labelBn: 'à¦ªà§‚à¦°à§à¦£à¦¾à¦™à§à¦— à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ à¦•à§‹à¦¡ (Lines 521-542)', labelEn: 'Full Settings State (Lines 521-542)' },
            { id: 'settings_parts', labelBn: 'à¦†à¦‚à¦¶à¦¿à¦• à¦•à§‹à¦¡ à¦¬à§à¦²à¦•à¦¸à¦®à§‚à¦¹', labelEn: 'Partial Code Segments' },
            { id: 'state', labelBn: 'à¦°à§à¦Ÿà¦¿à¦¨ à¦¸à§à¦Ÿà§‡à¦Ÿ (Lines 463-473)', labelEn: 'Routine States (Lines 463-473)' },
            { id: 'menu', labelBn: 'à¦¸à¦¾à¦‡à¦¡à¦¬à¦¾à¦° à¦®à§‡à¦¨à§ (Lines 3727-3749)', labelEn: 'Sidebar Menu (Lines 3727-3749)' },
            { id: 'modals', labelBn: 'à¦à¦•à¦¾à¦¡à§‡à¦®à¦¿à¦• à¦®à§‹à¦¡à¦¾à¦² (Lines 7371-7620)', labelEn: 'Academic Modals (Lines 7371-7620)' }
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
                {lang === 'bn' ? 'à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦® à¦†à¦°à§à¦•à¦¿à¦Ÿà§‡à¦•à¦šà¦¾à¦° à¦“ à¦²à¦¾à¦‡à¦­ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦Ÿà§à¦°à§à¦¯à¦¾à¦•à¦¿à¦‚' : 'System Architecture & Live Code Sync'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left bg-emerald-50/20">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-150 text-[#005c53] flex items-center justify-center font-bold text-xs shadow-3xs">1</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? 'à¦²à¦¾à¦‡à¦­ à¦…à¦Ÿà§‹-à¦†à¦ªà¦¡à§‡à¦Ÿ' : 'Live Code Updates'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? 'à¦¯à§‡à¦•à§‹à¦¨à§‹ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ à¦“ à¦…à¦ªà¦¶à¦¨ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦²à§‡ à¦¤à¦¾ à¦¸à¦°à¦¾à¦¸à¦°à¦¿ à¦•à§‹à¦¡ à¦¬à§à¦²à¦•à¦—à§à¦²à§‹à¦° à¦­à¦¿à¦¤à¦° à¦¸à§à¦¬à¦¯à¦¼à¦‚à¦•à§à¦°à¦¿à¦¯à¦¼à¦­à¦¾à¦¬à§‡ à¦¬à¦¸à§‡ à¦¯à¦¾à¦¯à¦¼à¥¤' 
                      : 'Any branding changes you make on screen are instantly injected into the copyable code snippets.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shadow-3xs">2</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? 'à¦¸à¦ à¦¿à¦• à¦²à¦¾à¦‡à¦¨ à¦Ÿà§à¦°à§à¦¯à¦¾à¦•à¦¿à¦‚' : 'Precise Line Markers'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? 'à¦•à§‹à¦¡à§‡à¦° à¦•à§‹à¦¨ à¦²à¦¾à¦‡à¦¨ à¦¥à§‡à¦•à§‡ à¦•à§‹à¦¨ à¦²à¦¾à¦‡à¦¨ à¦à¦¡à¦¿à¦Ÿ à¦•à¦°à¦¬à§‡à¦¨ à¦¤à¦¾à¦° à¦à¦•à¦¦à¦® à¦¨à¦¿à¦–à§à¦à¦¤ à¦‡à¦¨à¦¡à§‡à¦•à§à¦¸ à¦“ à¦²à¦¾à¦‡à¦¨ à¦¨à¦®à§à¦¬à¦° à¦¦à§‡à¦“à¦¯à¦¼à¦¾ à¦†à¦›à§‡à¥¤' 
                      : 'Provides the exact line ranges inside StudentPortal.tsx to locate, delete and paste code blocks with zero doubt.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shadow-3xs">3</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? 'à¦¨à¦¿à¦°à¦¾à¦ªà¦¦ à¦¸à¦¿à¦™à§à¦—à§‡à¦² à¦•à§à¦²à¦¿à¦•à§‡ à¦•à¦ªà¦¿' : 'Secure Copy to Clipboard'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? 'à¦à¦•à¦Ÿà¦¿ à¦¬à¦¾à¦Ÿà¦¨à§‡ à¦•à§à¦²à¦¿à¦• à¦•à¦°à§‡à¦‡ à¦•à§‹à¦¡à¦—à§à¦²à§‹ à¦¸à¦®à§à¦ªà§‚à¦°à§à¦£à¦°à§‚à¦ªà§‡ à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡ à¦¯à¦¾à¦¬à§‡, à¦•à§‹à¦¨à§‹ à¦®à§à¦¯à¦¾à¦¨à§à¦¯à¦¼à¦¾à¦² à¦¸à¦¿à¦²à§‡à¦•à§à¦Ÿ à¦•à¦°à¦¾à¦° à¦à¦¾à¦®à§‡à¦²à¦¾ à¦¨à§‡à¦‡à¥¤' 
                      : 'Never miss a bracket or syntax character. Use the Copy Code button for error-free transfer of custom logic.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-[#005c53]/10 text-[#005c53] flex items-center justify-center font-bold text-xs shadow-3xs">4</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? 'à¦¡à¦¿à¦«à¦²à§à¦Ÿ à¦®à¦¾à¦¨ à¦¸à¦‚à¦°à¦•à§à¦·à¦£' : 'Hardcode Default Settings'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? 'à¦•à§‹à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨à§‡à¦° à¦ªà¦° à¦¬à§à¦°à¦¾à¦‰à¦œà¦¾à¦° à¦®à§‡à¦®à§‹à¦°à¦¿ à¦–à¦¾à¦²à¦¿ à¦•à¦°à¦²à§‡à¦“ à¦†à¦ªà¦¨à¦¾à¦° à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦¨à¦¾à¦® à¦“ à¦®à¦¾à¦¨à¦—à§à¦²à§‹ à¦¸à¦¾à¦°à¦¾à¦œà§€à¦¬à¦¨ à¦¸à§à¦¥à¦¾à¦¯à¦¼à§€ à¦¥à¦¾à¦•à¦¬à§‡à¥¤' 
                      : 'Keeps your custom school logo, colored theme banner, and pass marks persistent across any user session.'}
                  </p>
                </div>
              </div>

              {/* Quick Status Info */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2 text-xs">
                <p className="font-extrabold text-gray-800">{lang === 'bn' ? 'à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸à§‡à¦° à¦¸à¦‚à¦•à§à¦·à¦¿à¦ªà§à¦¤ à¦¤à¦¥à§à¦¯:' : 'Active Applied Configuration Status:'}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-500 font-bold">
                  <div>â€¢ {lang === 'bn' ? 'à¦¸à§à¦•à§à¦² à¦¨à§‡à¦®:' : 'School:'} <span className="text-gray-900 font-black">{schoolSettings.schoolName}</span></div>
                  <div>â€¢ {lang === 'bn' ? 'à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦•à¦¾à¦²à¦¾à¦°:' : 'Banner Color:'} <span className="text-gray-900 font-black" style={{ color: schoolSettings.headerBgColor }}>{schoolSettings.headerBgColor}</span></div>
                  <div>â€¢ {lang === 'bn' ? 'à¦ªà¦¾à¦¸ à¦®à¦¾à¦°à§à¦• (à¦ªà¦°à§€à¦•à§à¦·à¦¾):' : 'Pass Marks:'} <span className="text-gray-900 font-black">{schoolSettings.examPassMarks}%</span></div>
                  <div>â€¢ {lang === 'bn' ? 'à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦«à¦¿à¦²à§à¦¡ à¦¸à¦‚à¦–à§à¦¯à¦¾:' : 'Custom Fields:'} <span className="text-gray-900 font-black">{schoolSettings.customFields.length}</span></div>
                </div>
              </div>
            </div>
          )}

          {developerActiveTab === 'settings_full' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-sm">
                    {lang === 'bn' ? 'à¦ªà§‚à¦°à§à¦£à¦¾à¦™à§à¦— à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ à¦¸à§à¦Ÿà§‡à¦Ÿ à¦…à¦¬à¦œà§‡à¦•à§à¦Ÿ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨' : 'Full Settings State Return Object'}
                  </h4>
                  <p className="text-[11px] text-[#005c53] font-black mt-1">
                    {lang === 'bn' 
                      ? 'â€¢ StudentPortal.tsx à¦«à¦¾à¦‡à¦²à§‡à¦° à§«à§¨à§§ à¦¥à§‡à¦•à§‡ à§«à§ªà§© à¦²à¦¾à¦‡à¦¨à§‡à¦° à¦­à§‡à¦¤à¦°à§‡à¦° à¦•à§‹à¦¡à¦Ÿà¦¿ à¦®à§à¦›à§‡ à¦à¦‡ à¦•à§‹à¦¡à¦Ÿà¦¿ à¦ªà§‡à¦¸à§à¦Ÿ à¦•à¦°à§à¦¨à¥¤' 
                      : 'â€¢ Locate lines 521 to 542 in StudentPortal.tsx, erase them completely and paste this exact updated block.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('settings_full', dynamicSchoolSettingsCode)}
                  className="px-3.5 py-2 bg-[#005c53] hover:bg-[#034d45] text-white text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'settings_full' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-200" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'settings_full' ? (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied!') : (lang === 'bn' ? 'à¦•à§‹à¦¡ à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Code')}</span>
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
                {lang === 'bn' ? 'à¦†à¦‚à¦¶à¦¿à¦• à¦•à§‹à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¤à¦¾à¦²à¦¿à¦•à¦¾ (à¦¯à§‡à¦•à§‹à¦¨à§‹ à¦à¦•à¦Ÿà¦¿ à¦…à¦‚à¦¶ à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨)' : 'Partial Settings Configurations (Copy specific blocks to target sections)'}
              </h4>

              {/* Branding Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <div className="text-xs font-bold text-gray-700">
                    â€¢ {lang === 'bn' ? 'à§§. à¦¸à§à¦•à§à¦² à¦ªà¦°à¦¿à¦šà¦¿à¦¤à¦¿ à¦“ à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ (Lines 522-528)' : '1. School Identity & Banner Theme (Lines 522-528)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_brand', brandingCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_brand' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_brand' ? (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied!') : (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Segment')}</span>
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
                    â€¢ {lang === 'bn' ? 'à§¨. à¦ à¦¿à¦•à¦¾à¦¨à¦¾ à¦“ à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦¾à¦®à§à¦¬à¦¾à¦° à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ (Lines 529-533)' : '2. Address & Mobile Contacts (Lines 529-533)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_contact', contactsCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_contact' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_contact' ? (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied!') : (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Segment')}</span>
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
                    â€¢ {lang === 'bn' ? 'à§©. à¦ªà¦¾à¦¸ à¦®à¦¾à¦°à§à¦•à¦¸ à¦“ à¦ªà§à¦°à¦¶à¦‚à¦¸à¦¾à¦ªà¦¤à§à¦° à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ (Lines 534-537)' : '3. Pass Marks & Certificate Template (Lines 534-537)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_pass', passMarksCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_pass' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_pass' ? (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied!') : (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Segment')}</span>
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
                    â€¢ {lang === 'bn' ? 'à§ª. à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¶à¦¨ à¦«à¦¿à¦²à§à¦¡à¦¸ à¦•à§‹à¦¡ (Lines 538-541)' : '4. Custom Student Enrollment Fields (Lines 538-541)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_fields', customFieldsCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_fields' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_fields' ? (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied!') : (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Segment')}</span>
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
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? 'à¦°à§à¦Ÿà¦¿à¦¨ à¦®à¦¡à¦¿à¦‰à¦² à¦¸à§à¦Ÿà§‡à¦Ÿ à¦­à§‡à¦°à¦¿à¦¯à¦¼à§‡à¦¬à¦²' : 'Top-Level Routine State Declaration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? 'React à¦¹à§à¦• à¦¨à¦¿à¦¯à¦¼à¦®à¦¾à¦¨à§à¦¯à¦¾à¦¯à¦¼à§€ à¦à¦‡ à¦•à§‹à¦¡à¦Ÿà¦¿ StudentPortal.tsx-à¦à¦° à§ªà§¬à§© à¦¥à§‡à¦•à§‡ à§ªà§­à§© à¦¨à¦‚ à¦²à¦¾à¦‡à¦¨à§‡ à¦°à¦¯à¦¼à§‡à¦›à§‡à¥¤' : 'Must reside unconditionally at the component root level (Lines 463 to 473) to keep render ordering stable.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('state', stateCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'state' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'state' ? (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied!') : (lang === 'bn' ? 'à¦•à§‹à¦¡ à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Code')}</span>
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
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦¸à¦¾à¦‡à¦¡à¦¬à¦¾à¦° à¦®à§‡à¦¨à§ à¦•à¦¨à¦«à¦¿à¦—à¦¾à¦°à§‡à¦¶à¦¨' : 'Left-Side Navigation Configuration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? 'â€¢ StudentPortal.tsx à¦«à¦¾à¦‡à¦²à§‡à¦° à§©à§­à§¨à§­ à¦¥à§‡à¦•à§‡ à§©à§­à§ªà§¯ à¦¨à¦‚ à¦²à¦¾à¦‡à¦¨à§‡à¦° à¦­à§‡à¦¤à¦°à§‡à¦° à¦•à§‹à¦¡à¦Ÿà¦¿ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§‡ à¦¬à¦¾à¦® à¦ªà¦¾à¦¶à§‡à¦° à¦¸à¦¾à¦‡à¦¡à¦¬à¦¾à¦° à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦‡à¦œ à¦•à¦°à§à¦¨à¥¤' : 'â€¢ Locate lines 3727 to 3749 inside StudentPortal.tsx to modify or reorder Left-Side Navigation links.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('menu', menuCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'menu' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'menu' ? (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied!') : (lang === 'bn' ? 'à¦•à§‹à¦¡ à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Code')}</span>
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
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? 'à¦à¦•à¦¾à¦¡à§‡à¦®à¦¿à¦• à¦®à§‹à¦¡à¦¾à¦²à¦¸à¦®à§‚à¦¹à§‡à¦° à¦°à§‡à¦¨à§à¦¡à¦¾à¦°à¦¿à¦‚ à¦•à§‹à¦¡' : 'Academic Modals JSX Integration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? 'â€¢ à¦à¦‡ à¦•à§‹à¦¡à¦—à§à¦²à§‹ StudentPortal.tsx à¦«à¦¾à¦‡à¦²à§‡à¦° à§­à§©à§­à§§ à¦¥à§‡à¦•à§‡ à§­à§¬à§¨à§¦ à¦²à¦¾à¦‡à¦¨à§‡ à¦…à¦¬à§à¦¦à¦¿ à¦°à§‡à¦¨à§à¦¡à¦¾à¦° à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤' : 'â€¢ These modals control data creation, located within lines 7371 to 7620 inside StudentPortal.tsx.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('modals', modalsCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'modals' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'modals' ? (lang === 'bn' ? 'à¦•à¦ªà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied!') : (lang === 'bn' ? 'à¦•à§‹à¦¡ à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Code')}</span>
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
      { id: 'dashboard', label: lang === 'bn' ? 'à¦¡à§à¦¯à¦¾à¦¶à¦¬à§‹à¦°à§à¦¡' : 'Dashboard', icon: LayoutDashboard },
      { id: 'frontend', label: lang === 'bn' ? 'à¦«à§à¦°à¦¨à§à¦Ÿà¦à¦¨à§à¦¡ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸' : 'Frontend', icon: Sliders },
      { id: 'student_details', label: lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¤à¦¥à§à¦¯' : 'Student Details', icon: Users },
      { id: 'admission', label: lang === 'bn' ? 'à¦­à¦°à§à¦¤à¦¿ à¦•à¦¾à¦°à§à¦¯à¦•à§à¦°à¦®' : 'Admission', icon: UserPlus },
      { id: 'employee', label: lang === 'bn' ? 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦“ à¦¶à¦¿à¦•à§à¦·à¦•' : 'Employee', icon: GraduationCap },
      { id: 'classes', label: lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦°à§à¦®' : 'Classes', icon: BookOpen },
      { id: 'fees', label: lang === 'bn' ? 'à¦«à¦¿ à¦•à¦¾à¦²à§‡à¦•à¦¶à¦¨' : 'Fees', icon: Wallet },
      { id: 'card', label: lang === 'bn' ? 'à¦†à¦‡à¦¡à¦¿ à¦•à¦¾à¦°à§à¦¡ à¦¤à§ˆà¦°à¦¿' : 'Card Management', icon: CreditCard },
      { id: 'certificate', label: lang === 'bn' ? 'à¦¶à¦‚à¦¸à¦¾à¦ªà¦¤à§à¦°' : 'Certificate', icon: Award },
      { id: 'academic', label: lang === 'bn' ? 'à¦à¦•à¦¾à¦¡à§‡à¦®à¦¿à¦• à¦°à§à¦Ÿà¦¿à¦¨' : 'Academic', icon: Calendar },
      { id: 'exam_controller', label: lang === 'bn' ? 'à¦à¦•à§à¦¸à¦¾à¦® à¦•à¦¨à§à¦Ÿà§à¦°à§‹à¦²à¦¾à¦° à¦ªà§à¦²à§à¦¯à¦¾à¦¨' : 'Exam Controller Plan', icon: FileText },
      { id: 'exam', label: lang === 'bn' ? 'à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦“ à¦«à¦²à¦¾à¦«à¦²' : 'Exam', icon: FileText },
      { id: 'attendance', label: lang === 'bn' ? 'à¦¹à¦¾à¦œà¦¿à¦°à¦¾ à¦–à¦¾à¦¤à¦¾' : 'Attendance', icon: CheckSquare },
      { id: 'notice', label: lang === 'bn' ? 'à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà¦¾à¦¬à¦²à¦¿à¦¶à¦¾à¦°' : 'Notice', icon: Bell },
      { id: 'homework', label: lang === 'bn' ? 'à¦¬à¦¾à¦¡à¦¼à¦¿à¦° à¦•à¦¾à¦œ' : 'Homework', icon: BookOpen },
      { id: 'sms', label: lang === 'bn' ? 'à¦¬à¦¾à¦²à§à¦• à¦à¦¸à¦à¦®à¦à¦¸' : 'Bulk Sms And Email', icon: MessageSquare },
      { id: 'student_accounting', label: lang === 'bn' ? 'à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿ à¦¹à¦¿à¦¸à¦¾à¦¬' : 'Student Accounting', icon: DollarSign },
      { id: 'office_accounting', label: lang === 'bn' ? 'à¦…à¦«à¦¿à¦¸ à¦•à§à¦¯à¦¾à¦¶ à¦¬à§à¦•' : 'Office Accounting', icon: FileSpreadsheet },
      { id: 'reports', label: lang === 'bn' ? 'à¦•à¦¾à¦°à§à¦¯à¦•à§à¦°à¦® à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ' : 'Reports', icon: Activity },
      { id: 'google_drive', label: lang === 'bn' ? 'à¦—à§à¦—à¦² à¦¡à§à¦°à¦¾à¦‡à¦­ à¦¸à§à¦Ÿà§‹à¦°à§‡à¦œ' : 'Google Drive Storage', icon: Cloud },
      { id: 'settings', label: lang === 'bn' ? 'à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸' : 'Settings', icon: Settings },
    ];

    // Trigger SMS Broadcasting Simulation
    const handleSmsBroadcast = (e: React.FormEvent) => {
      e.preventDefault();
      if (!smsMessage.trim()) return;
      setSmsGatewayStatus('sending');
      addAuditLog(`Admin triggered bulk SMS broadcast to ${smsTargetClass}. Content: "${smsMessage.slice(0, 30)}..."`);
      setTimeout(() => {
        setSmsGatewayStatus('success');
        setAdminSuccessMsg(lang === 'bn' ? `à¦—à¦¾à¦°à§à¦¡à¦¿à¦¯à¦¼à¦¾à¦¨ à¦—à§à¦°à§à¦ªà§‡ à¦à¦¸à¦à¦®à¦à¦¸ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à¦¯à¦¼à§‡à¦›à§‡!` : 'Bulk SMS broadcast successfully delivered!');
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
                            <span className="truncate">{lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¤à¦¾à¦²à¦¿à¦•à¦¾' : 'Student List'}</span>
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
                            <span className="truncate">{lang === 'bn' ? 'à¦²à¦—à¦‡à¦¨ à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼' : 'Login Deactivate'}</span>
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
                            <span className="truncate">{lang === 'bn' ? 'à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼à¦¤à¦¾à¦° à¦•à¦¾à¦°à¦£' : 'Deactivate Reason'}</span>
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
                            { id: 'employee_list', labelBn: 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦¤à¦¾à¦²à¦¿à¦•à¦¾', labelEn: 'Employee List' },
                            { id: 'add_department', labelBn: 'à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿ à¦¯à§‹à¦— à¦•à¦°à§à¦¨', labelEn: 'Add Department' },
                            { id: 'add_designation', labelBn: 'à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨ à¦¯à§‹à¦— à¦•à¦°à§à¦¨', labelEn: 'Add Designation' },
                            { id: 'add_employee', labelBn: 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦¯à§‹à¦— à¦•à¦°à§à¦¨', labelEn: 'Add Employee' },
                            { id: 'login_deactivate', labelBn: 'à¦²à¦—à¦‡à¦¨ à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼', labelEn: 'Login Deactivate' }
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
                            { id: 'general_settings', labelBn: 'à¦¸à¦¾à¦§à¦¾à¦°à¦£ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸', labelEn: 'General Settings' },
                            { id: 'school_settings', labelBn: 'à¦¸à§à¦•à§à¦² à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸', labelEn: 'School Settings' },
                            { id: 'role_permission', labelBn: 'à¦°à§‹à¦² à¦ªà¦¾à¦°à¦®à¦¿à¦¶à¦¨', labelEn: 'Role Permission' },
                            { id: 'session_settings', labelBn: 'à¦¸à§‡à¦¶à¦¨ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸', labelEn: 'Session Settings' },
                            { id: 'translations', labelBn: 'à¦…à¦¨à§à¦¬à¦¾à¦¦', labelEn: 'Translations' },
                            { id: 'cron_job', labelBn: 'à¦•à§à¦°à¦¨ à¦œà¦¬', labelEn: 'Cron Job' },
                            { id: 'system_student_field', labelBn: 'à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦® à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿ à¦«à¦¿à¦²à§à¦¡', labelEn: 'System Student Field' },
                            { id: 'custom_field', labelBn: 'à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦«à¦¿à¦²à§à¦¡', labelEn: 'Custom Field' },
                            { id: 'report_card', labelBn: 'à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ à¦•à¦¾à¦°à§à¦¡', labelEn: 'Report Card' },
{ id: 'change_password', labelBn: 'à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨', labelEn: 'Change Password' },
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
                            { id: 'exam_hall_duty', labelBn: 'à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦¹à¦² à¦¡à¦¿à¦‰à¦Ÿà¦¿', labelEn: 'Exam Hall Duty' },
                            { id: 'seat_arrangement', labelBn: 'à¦†à¦¸à¦¨ à¦¬à¦¿à¦¨à§à¦¯à¦¾à¦¸', labelEn: 'Seat Arrangement' },
                            { id: 'seat_plan', labelBn: 'à¦¸à¦¿à¦Ÿ à¦ªà§à¦²à§à¦¯à¦¾à¦¨', labelEn: 'Seat Plan' }
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
                            { id: 'class_section', labelBn: 'à¦•à§à¦²à¦¾à¦¸ à¦à¦¬à¦‚ à¦¸à§‡à¦•à¦¶à¦¨', labelEn: 'Class & Section' },
                            { id: 'subject', labelBn: 'à¦¬à¦¿à¦·à¦¯à¦¼', labelEn: 'Subject' },
                            { id: 'class_schedule', labelBn: 'à¦•à§à¦²à¦¾à¦¸ à¦¶à¦¿à¦¡à¦¿à¦‰à¦²', labelEn: 'Class Schedule' },
                            { id: 'class_routine', labelBn: 'à¦•à§à¦²à¦¾à¦¸ à¦°à§à¦Ÿà¦¿à¦¨', labelEn: 'Class Routine' },
                            { id: 'teacher_class_routine', labelBn: 'à¦¶à¦¿à¦•à§à¦·à¦• à¦•à§à¦²à¦¾à¦¸ à¦°à§à¦Ÿà¦¿à¦¨', labelEn: 'Teacher Class Routine' },
                            { id: 'routine_overview', labelBn: 'à¦°à§à¦Ÿà¦¿à¦¨ à¦“à¦­à¦¾à¦°à¦­à¦¿à¦‰', labelEn: 'Routine Overview' },
                            { id: 'teacher_schedule', labelBn: 'à¦¶à¦¿à¦•à§à¦·à¦•à§‡à¦° à¦¸à¦®à¦¯à¦¼à¦¸à§‚à¦šà§€', labelEn: 'Teacher Schedule' },
                            { id: 'promotion', labelBn: 'à¦ªà§à¦°à¦®à§‹à¦¶à¦¨', labelEn: 'Promotion' }
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
                            { id: 'exam_term', labelBn: 'à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦Ÿà¦¾à¦°à§à¦®', labelEn: 'Exam Term' },
                            { id: 'exam_routine', labelBn: 'à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦°à§à¦Ÿà¦¿à¦¨', labelEn: 'Exam Routine' },
                            { id: 'exam_hall', labelBn: 'à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦¹à¦²', labelEn: 'Exam Hall' },
                            { id: 'exam_distribution', labelBn: 'à¦¨à¦®à§à¦¬à¦° à¦¬à¦£à§à¦Ÿà¦¨', labelEn: 'Distribution' },
                            { id: 'exam_setup', labelBn: 'à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦¸à§‡à¦Ÿà¦†à¦ª', labelEn: 'Exam Setup' },
                            { id: 'exam_marksheet_template', labelBn: 'à¦®à¦¾à¦°à§à¦•à¦¶à¦¿à¦Ÿ à¦Ÿà§‡à¦®à¦ªà§à¦²à§‡à¦Ÿ', labelEn: 'Marksheet Template' },
                            { id: 'exam_schedule', labelBn: 'à¦ªà¦°à§€à¦•à§à¦·à¦¾ à¦¸à¦®à¦¯à¦¼à¦¸à§‚à¦šà§€', labelEn: 'Exam Schedule' },
                            { id: 'exam_marks', labelBn: 'à¦¨à¦®à§à¦¬à¦° à¦‡à¦¨à¦ªà§à¦Ÿ', labelEn: 'Marks' }
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
                            { id: 'school_settings', labelBn: 'à¦¸à§à¦•à§à¦² à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸', labelEn: 'School Settings' },
                            { id: 'report_primary', labelBn: 'à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ à¦•à¦¾à¦°à§à¦¡ - à¦ªà§à¦°à¦¾à¦‡à¦®à¦¾à¦°à¦¿', labelEn: 'Report Card - Primary Section' },
                            { id: 'report_exam', labelBn: 'à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ à¦•à¦¾à¦°à§à¦¡ - à¦ªà¦°à§€à¦•à§à¦·à¦¾', labelEn: 'Report Card - Examination' },
                            { id: 'section_customization', labelBn: 'à¦¸à§‡à¦•à¦¶à¦¨ à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦‡à¦œà§‡à¦¶à¦¨', labelEn: 'Section Customization' },
                            { id: 'testimonial_template', labelBn: 'à¦ªà§à¦°à¦¶à¦‚à¦¸à¦¾à¦ªà¦¤à§à¦° à¦Ÿà§‡à¦®à¦ªà§à¦²à§‡à¦Ÿ', labelEn: 'Testimonial Template' },
                            { id: 'testimonial_manager', labelBn: 'à¦ªà§à¦°à¦¶à¦‚à¦¸à¦¾à¦ªà¦¤à§à¦° à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°', labelEn: 'Testimonial Manager' },
                            { id: 'cron_job', labelBn: 'à¦•à§à¦°à¦¨ à¦œà¦¬', labelEn: 'Cron Job' },
                            { id: 'login_banner', labelBn: 'à¦²à¦—à¦‡à¦¨ à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦°', labelEn: 'Login Banner' },
                            { id: 'system_student_field', labelBn: 'à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦® à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿ à¦«à¦¿à¦²à§à¦¡', labelEn: 'System Student Field' },
                            { id: 'custom_field', labelBn: 'à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦«à¦¿à¦²à§à¦¡', labelEn: 'Custom Field' },
                            { id: 'database_backup', labelBn: 'à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª', labelEn: 'Database Backup' },
                            { id: 'user_login_log', labelBn: 'à¦‡à¦‰à¦œà¦¾à¦° à¦²à¦—à¦‡à¦¨ à¦²à¦—', labelEn: 'User Login Log' },
                            { id: 'change_password', labelBn: 'à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨', labelEn: 'Change Password' },
                            { id: 'user_credentials', labelBn: 'à¦‡à¦‰à¦œà¦¾à¦° à¦•à§à¦°à§‡à¦¡à§‡à¦¨à¦¶à¦¿à¦¯à¦¼à¦¾à¦²', labelEn: 'User Credentials' }
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
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨' : 'Admin'}</p>
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
                      {lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦…à¦«à¦¿à¦¸' : 'Admin Office'}
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
                          {lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨' : 'Admin'}
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
                          <span>{lang === 'bn' ? 'à¦²à¦—à¦†à¦‰à¦Ÿ' : 'Logout'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'à¦ªà§à¦°à§‹à¦«à¦¾à¦‡à¦²' : 'Profile'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦ªà§à¦°à§‹à¦«à¦¾à¦‡à¦² à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨' : 'Update admin information'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦°à¦¿à¦¸à§‡à¦Ÿ' : 'Reset Password'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? 'à¦²à¦—à¦‡à¦¨ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨' : 'Change login password'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'à¦®à§‡à¦‡à¦²à¦¬à¦•à§à¦¸' : 'Mailbox'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? 'à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦“ à¦®à§‡à¦¸à§‡à¦œ' : 'Inbound alerts & support'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'à¦¸à§à¦•à§à¦² à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸' : 'School Settings'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? 'à¦¬à¦¿à¦¦à§à¦¯à¦¾à¦²à¦¯à¦¼à§‡à¦° à¦¸à¦¾à¦§à¦¾à¦°à¦£ à¦ªà¦°à¦¿à¦šà¦¿à¦¤à¦¿' : 'Update general parameters'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'à¦²à¦—à¦†à¦‰à¦Ÿ à¦¸à§‡à¦¶à¦¨' : 'Logout'}</span>
                            <span className="text-[10px] text-rose-400 font-bold">{lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦¡à§à¦¯à¦¾à¦¶à¦¬à§‹à¦°à§à¦¡ à¦¥à§‡à¦•à§‡ à¦¬à¦¿à¦¦à¦¾à¦¯à¦¼' : 'Sign out from control room'}</span>
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
                  
                  const csvContent = "" + [
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
                    ? `à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦¦à§‡à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ Excel (CSV) à¦«à¦¾à¦‡à¦² à¦¹à¦¿à¦¸à§‡à¦¬à§‡ à¦à¦•à§à¦¸à¦ªà§‹à¦°à§à¦Ÿ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!` 
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
                              <p class="meta-info">Total: ${filteredStudents.length} â€¢ Generated: ${dateStr}</p>
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
                            <h1 class="title-bn">à¦¸à§à¦Ÿà§à¦¡à§‡à¦¨à§à¦Ÿà¦¸ à¦•à§‡à¦¯à¦¼à¦¾à¦° à¦®à¦¡à§‡à¦² à¦¸à§à¦•à§à¦²</h1>
                            <p class="address-bn">à¦šà¦°à¦²à¦•à§à¦·à§à¦¯à¦¾, à¦•à¦°à§à¦£à¦«à§à¦²à§€, à¦šà¦Ÿà§à¦Ÿà¦—à§à¦°à¦¾à¦®</p>
                            <p class="sheet-title">Monthly Attendance Sheet - July 2026 &nbsp;|&nbsp; Class: ${classText} &nbsp;|&nbsp; Section: ${sectionText}</p>
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
                if (confirm(lang === 'bn' ? `${name}-à¦•à§‡ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¥à§‡à¦•à§‡ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¤à§‡ à¦šà¦¾à¦¨?` : `Are you sure you want to delete ${name} from records?`)) {
                  setStudents(prev => prev.filter(s => s.id !== id));
                  setAdminSuccessMsg(lang === 'bn' ? `${name}-à¦à¦° à¦°à§‡à¦•à¦°à§à¦¡ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!` : `Student record of ${name} has been deleted.`);
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
                        {lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¤à¦¾à¦²à¦¿à¦•à¦¾' : 'Student List'}
                      </button>
                      <button
                        onClick={() => setStudentDetailsSubTab('login_deactivate')}
                        className={`text-sm font-black pb-2.5 border-b-2 transition-all cursor-pointer ${
                          studentDetailsSubTab === 'login_deactivate'
                            ? 'border-[#025644] text-[#025644]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {lang === 'bn' ? 'à¦²à¦—à¦‡à¦¨ à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼' : 'Login Deactivate'}
                      </button>
                      <button
                        onClick={() => setStudentDetailsSubTab('deactivate_reason')}
                        className={`text-sm font-black pb-2.5 border-b-2 transition-all cursor-pointer ${
                          studentDetailsSubTab === 'deactivate_reason'
                            ? 'border-[#025644] text-[#025644]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {lang === 'bn' ? 'à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼à¦¤à¦¾à¦° à¦•à¦¾à¦°à¦£' : 'Deactivate Reason'}
                      </button>
                    </div>
                  </div>

                  {studentDetailsSubTab === 'student_list' && (
                    <div className="space-y-6">
                      {/* Sub-Header Row */}
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="text-left">
                          <h3 className="font-extrabold text-gray-900 text-2xl tracking-tight">
                            {lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦¬à§ƒà¦¨à§à¦¦' : 'Students'}
                          </h3>
                          <p className="text-xs text-gray-400 font-bold mt-1">
                            {filteredStudents.length} {lang === 'bn' ? 'à¦œà¦¨ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦° à¦¤à¦¾à¦²à¦¿à¦•à¦¾' : `of ${students.length} students`}
                          </p>
                        </div>

                        {/* Top Action Buttons (Excel, PDF, Attendance, Add Student) */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => triggerExport('Excel')}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-emerald-600 font-extrabold">â€¢</span>
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={() => triggerExport('PDF')}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-red-500 font-extrabold">â€¢</span>
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={triggerPrintAttendance}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-blue-500 font-extrabold">â€¢</span>
                            <span>{lang === 'bn' ? 'à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿ à¦¶à¦¿à¦Ÿ' : 'Blank Attendance'}</span>
                          </button>
                          <button
                            onClick={() => setIsAddStudentModalOpen(true)}
                            className="bg-[#025644] text-white hover:bg-[#013f32] px-4 py-2 text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                          >
                            <Plus className="h-4 w-4 stroke-[3]" />
                            <span>{lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Add New Student'}</span>
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
                              placeholder={lang === 'bn' ? "à¦¨à¦¾à¦®, à¦†à¦‡à¦¡à¦¿ à¦¬à¦¾ à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•..." : "Search by name, ID, class, guardian..."}
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
                            <option value="All">{lang === 'bn' ? 'à¦¸à¦•à¦² à¦•à§à¦²à¦¾à¦¸' : 'All Classes'}</option>
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
                            <option value="All">{lang === 'bn' ? 'à¦¸à¦•à¦² à¦¶à¦¾à¦–à¦¾' : 'All Sections'}</option>
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
                            <option value="All">{lang === 'bn' ? 'à¦¸à¦•à¦² à¦—à§à¦°à§à¦ª' : 'All Groups'}</option>
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
                            <option value="All">{lang === 'bn' ? 'à¦¸à¦•à¦² à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸' : 'All Status'}</option>
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
                                    {lang === 'bn' ? 'à¦•à§‹à¦¨ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦° à¦¤à¦¥à§à¦¯ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤' : 'No student directory records match selected filters.'}
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
                                          title={lang === 'bn' ? "à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦° à¦¤à¦¥à§à¦¯ à¦¦à§‡à¦–à§à¦¨" : "View Student Details"}
                                          onClick={() => {
                                            setViewingStudentDetails(std);
                                          }}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#025644] rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </button>
                                        <button 
                                          title={lang === 'bn' ? "à¦ªà§à¦°à¦¬à§‡à¦¶à¦ªà¦¤à§à¦° à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡ / à¦ªà§à¦°à¦¿à¦¨à§à¦Ÿ" : "Download Admit Card"}
                                          onClick={() => {
                                            setViewingAdmitCard(std);
                                          }}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-sky-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center text-sm"
                                        >
                                          <span>â€¢</span>
                                        </button>
                                        <button 
                                          title={lang === 'bn' ? "à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾ à¦•à¦°à§à¦¨" : "Edit"}
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
                                            setAdminSuccessMsg(lang === 'bn' ? `${std.name}-à¦à¦° à¦°à§‡à¦•à¦°à§à¦¡ à¦ªà¦¿à¦¨ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!` : `${std.name} has been pinned to priority list.`);
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
                              ? `à¦ªà§à¦°à¦¦à¦°à§à¦¶à¦¿à¦¤: ${startIndex + 1}-${Math.min(startIndex + 8, filteredStudents.length)} à¦®à§‹à¦Ÿ: ${filteredStudents.length}`
                              : `${startIndex + 1}-${Math.min(startIndex + 8, filteredStudents.length)} of ${filteredStudents.length} students`
                            }
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="px-2.5 py-1.5 text-xs font-black rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-40"
                            >&lt;</button>
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
                            >&gt;</button>
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
                          {lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦²à¦—à¦‡à¦¨ à¦¨à¦¿à¦¯à¦¼à¦¨à§à¦¤à§à¦°à¦£ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²' : 'Student Login Status Control'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'à¦…à¦¸à§à¦¥à¦¾à¦¯à¦¼à§€à¦­à¦¾à¦¬à§‡ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦¦à§‡à¦° à¦ªà§‹à¦°à§à¦Ÿà¦¾à¦² à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸ à¦«à§à¦°à¦¿à¦œ à¦¬à¦¾ à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼ à¦•à¦°à§à¦¨' : 'Temporarily freeze or activate student credentials for portal logins'}
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
                                        ? `${std.name}-à¦à¦° à¦²à¦—à¦‡à¦¨ à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!` 
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
                                    {std.loginActive ? (lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸ à¦¸à§à¦¥à¦—à¦¿à¦¤ à¦•à¦°à§à¦¨' : 'Deactivate Login') : (lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸ à¦¸à¦šà¦² à¦•à¦°à§à¦¨' : 'Enable Login')}
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
                            {lang === 'bn' ? 'à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼à¦¤à¦¾à¦° à¦•à¦¾à¦°à¦£ à¦¨à¦¥à¦¿à¦­à§à¦•à§à¦¤ à¦•à¦°à§à¦¨' : 'Log Deactivation Reason'}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">
                            {lang === 'bn' ? 'à¦•à§‹à¦¨ à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€à¦° à¦ªà§‹à¦°à§à¦Ÿà¦¾à¦² à¦¬à¦¨à§à¦§à§‡à¦° à¦¬à¦¿à¦¬à¦°à¦£ à¦¯à§à¦•à§à¦¤ à¦•à¦°à§à¦¨' : 'Assign official suspension reasons to de-enrolled students'}
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
                              <option value="">-- {lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§à¦¨' : 'Select Student'} --</option>
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
                              placeholder={lang === 'bn' ? "à¦¯à§‡à¦®à¦¨: à¦¬à¦•à§‡à¦¯à¦¼à¦¾ à¦«à¦¿ à¦ªà¦°à¦¿à¦¶à§‹à¦§ à¦¨à¦¾ à¦•à¦°à¦¾, à¦¶à§ƒà¦™à§à¦–à¦²à¦¾ à¦­à¦™à§à¦— à¦‡à¦¤à§à¦¯à¦¾à¦¦à¦¿à¥¤" : "E.g. Fees overdue for 3 consecutive terms, disciplinary action."}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-[#025644]"
                            />
                          </div>

                          <button
                            onClick={() => {
                              if (!deactivateStudentId || !deactivateReasonText.trim()) {
                                alert(lang === 'bn' ? 'à¦¦à¦¯à¦¼à¦¾ à¦•à¦°à§‡ à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦à¦¬à¦‚ à¦•à¦¾à¦°à¦£ à¦²à¦¿à¦–à§à¦¨à¥¤' : 'Please select a student and type the reason.');
                                return;
                              }
                              setStudents(prev => prev.map(s => s.id === deactivateStudentId ? { ...s, deactivateReason: deactivateReasonText } : s));
                              setAdminSuccessMsg(lang === 'bn' ? "à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼à¦¤à¦¾à¦° à¦•à¦¾à¦°à¦£ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤" : "Deactivation reason registered successfully.");
                              setDeactivateStudentId('');
                              setDeactivateReasonText('');
                              setTimeout(() => setAdminSuccessMsg(''), 4000);
                            }}
                            className="w-full py-2 bg-[#025644] hover:bg-[#01352a] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                          >
                            {lang === 'bn' ? 'à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à§à¦¨' : 'Save Reason Record'}
                          </button>
                        </div>
                      </div>

                      {/* Reasons display log */}
                      <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl p-5 shadow-3xs space-y-4">
                        <div>
                          <h4 className="font-extrabold text-gray-900 text-sm">
                            {lang === 'bn' ? 'à¦¸à§à¦¥à¦—à¦¿à¦¤à¦•à¦°à¦£ à¦°à§‡à¦œà¦¿à¦¸à§à¦Ÿà§à¦°à¦¿' : 'Suspension Registry'}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">
                            {lang === 'bn' ? 'à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦®à§‡ à¦°à§‡à¦•à¦°à§à¦¡à¦•à§ƒà¦¤ à¦¸à§à¦¥à¦—à¦¿à¦¤ à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸ à¦°à§‡à¦œà¦¿à¦¸à§à¦Ÿà§à¦°à¦¿' : 'Currently documented suspended logins with official grounds'}
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
                        {lang === 'bn' ? 'à¦…à¦¨à¦²à¦¾à¦‡à¦¨ à¦­à¦°à§à¦¤à¦¿ à¦†à¦¬à§‡à¦¦à¦¨ à¦•à§‹à¦¯à¦¼à§‡à¦°à¦¿' : 'Admission Application Queue'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? 'à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•à¦¦à§‡à¦° à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦­à¦°à§à¦¤à¦¿ à¦†à¦¬à§‡à¦¦à¦¨ à¦ªà¦°à§à¦¯à¦¾à¦²à§‹à¦šà¦¨à¦¾ à¦à¦¬à¦‚ à¦…à¦¨à§à¦®à§‹à¦¦à¦¨ à¦•à¦°à§à¦¨' : 'Review and approve/reject online registration forms filed by guardians'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>{pendingAdmissions.filter((a: any) => a.status === 'pending').length} {lang === 'bn' ? 'à¦Ÿà¦¿ à¦†à¦¬à§‡à¦¦à¦¨ à¦…à¦ªà§‡à¦•à§à¦·à¦¾à¦°à¦¤' : 'Applications Pending'}</span>
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
                                {lang === 'bn' ? 'à¦ªà§‚à¦°à§à¦¬à¦¬à¦°à§à¦¤à§€ à¦œà¦¿à¦ªà¦¿à¦' : 'GPA'} {adm.previousGPA}
                              </span>
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase tracking-wider ${
                                adm.registrationFeeStatus === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {lang === 'bn' ? (adm.registrationFeeStatus === 'Paid' ? 'à¦«à¦¿ à¦ªà¦°à¦¿à¦¶à§‹à¦§à¦¿à¦¤' : 'à¦«à¦¿ à¦…à¦ªà¦°à¦¿à¦¶à§‹à¦§à¦¿à¦¤') : `${adm.registrationFeeStatus} Registration`}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 font-semibold">
                              <p>{lang === 'bn' ? 'à¦…à¦­à¦¿à¦­à¦¾à¦¬à¦•' : 'Guardian'}: <span className="text-gray-800 font-bold">{adm.guardianName}</span></p>
                              <p>{lang === 'bn' ? 'à¦†à¦¬à§‡à¦¦à¦¨à¦•à§ƒà¦¤ à¦¶à§à¦°à§‡à¦£à§€' : 'Requested Class'}: <span className="text-emerald-700 font-extrabold">Class {adm.requestedClass}</span></p>
                              <p className="sm:col-span-2">{lang === 'bn' ? 'à¦®à§‹à¦¬à¦¾à¦‡à¦²' : 'Contact Phone'}: <span className="text-gray-700 font-mono font-bold">{adm.guardianPhone}</span></p>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200/60">
                          {/* View details button */}
                          <button
                            onClick={() => setActiveViewAdmission(adm)}
                            title={lang === 'bn' ? 'à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦†à¦¬à§‡à¦¦à¦¨à¦ªà¦¤à§à¦° à¦¦à§‡à¦–à§à¦¨' : 'View Full Application Profile'}
                            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-extrabold"
                          >
                            <Eye className="h-4 w-4" />
                            <span>{lang === 'bn' ? 'à¦ªà§à¦°à§‹à¦«à¦¾à¦‡à¦²' : 'Profile'}</span>
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
                                {lang === 'bn' ? 'à¦…à¦¨à§à¦®à§‹à¦¦à¦¨ à¦®à¦¡à¦¾à¦²' : 'Approve Admission'}
                              </button>
                              <button 
                                onClick={() => handleRejectAdmission(adm.id, adm.studentName)}
                                className="px-3 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                              >
                                {lang === 'bn' ? 'à¦ªà§à¦°à¦¤à§à¦¯à¦¾à¦–à§à¦¯à¦¾à¦¨' : 'Reject'}
                              </button>
                            </>
                          ) : adm.status === 'approved' ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs font-black rounded-xl">
                                OK {lang === 'bn' ? 'à¦…à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦“ à¦¸à¦¿à¦™à§à¦•à¦¡' : 'Approved & Synced'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                Assigned ID: {adm.assignedId || 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-150 text-rose-700 text-xs font-black rounded-xl">
                              X {lang === 'bn' ? 'à¦ªà§à¦°à¦¤à§à¦¯à¦¾à¦–à§à¦¯à¦¾à¦¤' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {pendingAdmissions.length === 0 && (
                      <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-250 rounded-2xl text-gray-400 font-bold text-xs">
                        {lang === 'bn' ? 'à¦•à§‹à¦¨à§‹ à¦®à§à¦²à¦¤à§à¦¬à¦¿ à¦†à¦¬à§‡à¦¦à¦¨ à¦ªà¦¾à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¯à¦¼à¦¨à¦¿à¥¤' : 'No pending admission requests.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* ARCHITECTURAL & DATABASE CODE CORNER (EPITOME OF CRAFT) */}
                <div className="hidden bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                      <Code className="h-5 w-5 text-[#025644]" />
                      <span>{lang === 'bn' ? 'à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦†à¦°à§à¦•à¦¿à¦Ÿà§‡à¦•à¦šà¦¾à¦° à¦“ à¦à¦ªà¦¿à¦†à¦‡ à¦‡à¦žà§à¦œà¦¿à¦¨à¦¿à¦¯à¦¼à¦¾à¦°à¦¿à¦‚ à¦¬à§à¦¯à¦¾à¦•à¦¸à§à¦Ÿà§‡à¦œ' : 'Database Architecture & Backend Controller Export'}</span>
                    </h4>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      {lang === 'bn' ? 'à¦­à¦°à§à¦¤à¦¿ à¦ªà§à¦°à¦•à§à¦°à¦¿à¦¯à¦¼à¦¾ à¦…à¦Ÿà§‹à¦®à§‡à¦¶à¦¨à§‡à¦° à¦œà¦¨à§à¦¯ à¦ªà§à¦°à§‹à¦¡à¦¾à¦•à¦¶à¦¨-à¦°à§‡à¦¡à¦¿ à¦¸à§à¦•à¦¿à¦®à¦¾, à¦Ÿà§à¦°à¦¾à¦¨à¦œà§‡à¦•à¦¶à¦¨ à¦Ÿà§à¦°à¦¿à¦—à¦¾à¦° à¦à¦¬à¦‚ à¦•à¦¨à§à¦Ÿà§à¦°à§‹à¦²à¦¾à¦° à¦•à§‹à¦¡' : 'Full-stack production schemas, robust relational database transitions and safe auto-promotion codebases'}
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
                        alert(lang === 'bn' ? 'à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦•à§à¦²à¦¿à¦ªà¦¬à§‹à¦°à§à¦¡à§‡ à¦•à¦ªà¦¿ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Copied schema/code to clipboard successfully!');
                      }}
                      className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{lang === 'bn' ? 'à¦•à§‹à¦¡ à¦•à¦ªà¦¿ à¦•à¦°à§à¦¨' : 'Copy Code'}</span>
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
                          {lang === 'bn' ? 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦“ à¦¶à¦¿à¦•à§à¦·à¦• à¦¡à¦¿à¦°à§‡à¦•à§à¦Ÿà¦°à¦¿' : 'Faculty & Staff Directory'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold">
                          {lang === 'bn' ? 'à¦¸à§à¦•à§à¦²à§‡à¦° à¦¸à¦•à¦² à¦¶à¦¿à¦•à§à¦·à¦• à¦“ à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€à¦° à¦¤à¦¥à§à¦¯ à¦¦à§‡à¦–à§à¦¨' : 'Browse and manage all registered teaching and administrative personnel'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => {
                            setEmployeeSubTab('add_employee');
                          }}
                          className="px-4 py-2 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          + {lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Add Employee'}
                        </button>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-gray-400" />
                        <input
                          type="text"
                          placeholder={lang === 'bn' ? 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦–à§à¦à¦œà§à¦¨...' : 'Search employees...'}
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
                          <option value="All">{lang === 'bn' ? 'à¦¸à¦¬ à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿ' : 'All Departments'}</option>
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
                                ? (emp.status === 'Active' ? 'à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼' : 'à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼')
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
                              <p>{lang === 'bn' ? 'à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿ / à¦¬à¦¿à¦·à¦¯à¦¼' : 'Dept / Specialization'}: <span className="text-gray-800 font-bold">{emp.subject}</span></p>
                              <p>{lang === 'bn' ? 'à¦‡à¦®à§‡à¦‡à¦²' : 'Email'}: <span className="text-gray-700 font-bold font-mono text-xs truncate block">{emp.email}</span></p>
                              <p>{lang === 'bn' ? 'à¦®à§‹à¦¬à¦¾à¦‡à¦²' : 'Mobile'}: <span className="text-gray-700 font-bold font-mono">{emp.phone}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-150">
                              <button 
                                onClick={() => {
                                  setEmployees(prev => prev.map((e) => e.email === emp.email ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e));
                                }}
                                className="py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer text-center"
                              >
                                {emp.status === 'Active' 
                                  ? (lang === 'bn' ? 'à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼' : 'Deactivate') 
                                  : (lang === 'bn' ? 'à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼' : 'Activate')
                                }
                              </button>
                              <button 
                                onClick={() => {
                                  setEmployees(prev => prev.filter((e) => e.email !== emp.email));
                                }}
                                className="py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-200 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer text-center"
                              >
                                {lang === 'bn' ? 'à¦®à§à¦›à§‡ à¦«à§‡à¦²à§à¦¨' : 'Remove'}
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
                          {lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿ à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Add New Department'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'à¦¸à§à¦•à§à¦²à§‡à¦° à¦à¦•à¦¾à¦¡à§‡à¦®à¦¿à¦• à¦¬à¦¾ à¦ªà§à¦°à¦¶à¦¾à¦¸à¦¨à¦¿à¦• à¦¨à¦¤à§à¦¨ à¦¬à¦¿à¦­à¦¾à¦— à¦¯à§à¦•à§à¦¤ à¦•à¦°à§à¦¨' : 'Register a new academic or administrative department'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">{lang === 'bn' ? 'à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿà§‡à¦° à¦¨à¦¾à¦®' : 'Department Name'}</label>
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? 'à¦¯à§‡à¦®à¦¨: Science, Commerce, Language' : 'e.g. Science, Commerce, Language'}
                            value={newDepartmentInput}
                            onChange={(e) => setNewDepartmentInput(e.target.value)}
                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!newDepartmentInput.trim()) {
                              alert(lang === 'bn' ? 'à¦¦à¦¯à¦¼à¦¾ à¦•à¦°à§‡ à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿà§‡à¦° à¦¨à¦¾à¦® à¦²à¦¿à¦–à§à¦¨!' : 'Please enter a department name!');
                              return;
                            }
                            if (employeeDepartments.map(d => d.toLowerCase()).includes(newDepartmentInput.trim().toLowerCase())) {
                              alert(lang === 'bn' ? 'à¦à¦‡ à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿà¦Ÿà¦¿ à¦‡à¦¤à¦¿à¦®à¦§à§à¦¯à§‡ à¦¬à¦¿à¦¦à§à¦¯à¦®à¦¾à¦¨!' : 'This department already exists!');
                              return;
                            }
                            setEmployeeDepartments(prev => [...prev, newDepartmentInput.trim()]);
                            setNewDepartmentInput('');
                            addAuditLog(`Admin added a new employee department: ${newDepartmentInput.trim()}`);
                          }}
                          className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          {lang === 'bn' ? 'à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿ à¦¸à§‡à¦­ à¦•à¦°à§à¦¨' : 'Save Department'}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {lang === 'bn' ? 'à¦¬à¦¿à¦¦à§à¦¯à¦®à¦¾à¦¨ à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿ à¦¤à¦¾à¦²à¦¿à¦•à¦¾' : 'Existing Departments'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨à§‡ à¦¸à§à¦•à§à¦²à§‡ à¦…à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦¬à¦¿à¦­à¦¾à¦—à¦¸à¦®à§‚à¦¹' : 'List of currently active school departments'}
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
                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{associatedCount} {lang === 'bn' ? 'à¦œà¦¨ à¦¸à§à¦Ÿà¦¾à¦«/à¦¶à¦¿à¦•à§à¦·à¦•' : 'associated members'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (associatedCount > 0) {
                                    alert(lang === 'bn' 
                                      ? 'à¦à¦‡ à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿà§‡à¦° à¦¸à¦¾à¦¥à§‡ à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦¯à§à¦•à§à¦¤ à¦†à¦›à§‡, à¦¤à¦¾à¦‡ à¦à¦Ÿà¦¿ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¸à¦®à§à¦­à¦¬ à¦¨à¦¯à¦¼!' 
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
                          {lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨ à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Add New Designation'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦“ à¦¶à¦¿à¦•à§à¦·à¦•à¦¦à§‡à¦° à¦œà¦¨à§à¦¯ à¦¨à¦¤à§à¦¨ à¦ªà¦¦ à¦¬à¦¾ à¦‰à¦ªà¦¾à¦§à¦¿ à¦¯à§à¦•à§à¦¤ à¦•à¦°à§à¦¨' : 'Register a new official designation or job title'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">{lang === 'bn' ? 'à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨à§‡à¦° à¦¨à¦¾à¦®' : 'Designation Name'}</label>
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? 'à¦¯à§‡à¦®à¦¨: Assistant Lecturer, Senior Officer' : 'e.g. Assistant Lecturer, Senior Officer'}
                            value={newDesignationInput}
                            onChange={(e) => setNewDesignationInput(e.target.value)}
                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!newDesignationInput.trim()) {
                              alert(lang === 'bn' ? 'à¦¦à¦¯à¦¼à¦¾ à¦•à¦°à§‡ à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨à§‡à¦° à¦¨à¦¾à¦® à¦²à¦¿à¦–à§à¦¨!' : 'Please enter a designation name!');
                              return;
                            }
                            if (employeeDesignations.map(d => d.toLowerCase()).includes(newDesignationInput.trim().toLowerCase())) {
                              alert(lang === 'bn' ? 'à¦à¦‡ à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨à¦Ÿà¦¿ à¦‡à¦¤à¦¿à¦®à¦§à§à¦¯à§‡ à¦¬à¦¿à¦¦à§à¦¯à¦®à¦¾à¦¨!' : 'This designation already exists!');
                              return;
                            }
                            setEmployeeDesignations(prev => [...prev, newDesignationInput.trim()]);
                            setNewDesignationInput('');
                            addAuditLog(`Admin added a new employee designation: ${newDesignationInput.trim()}`);
                          }}
                          className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          {lang === 'bn' ? 'à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨ à¦¸à§‡à¦­ à¦•à¦°à§à¦¨' : 'Save Designation'}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {lang === 'bn' ? 'à¦¬à¦¿à¦¦à§à¦¯à¦®à¦¾à¦¨ à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨ à¦¤à¦¾à¦²à¦¿à¦•à¦¾' : 'Existing Designations'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨à§‡ à¦¸à§à¦•à§à¦²à§‡ à¦…à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦ªà¦¦ à¦¬à¦¾ à¦ªà¦¦à¦¬à§€à¦¸à¦®à§‚à¦¹' : 'List of currently active school designations'}
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
                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{associatedCount} {lang === 'bn' ? 'à¦œà¦¨ à¦¸à§à¦Ÿà¦¾à¦«/à¦¶à¦¿à¦•à§à¦·à¦•' : 'associated members'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (associatedCount > 0) {
                                    alert(lang === 'bn' 
                                      ? 'à¦à¦‡ à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨à§‡à¦° à¦¸à¦¾à¦¥à§‡ à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦¯à§à¦•à§à¦¤ à¦†à¦›à§‡, à¦¤à¦¾à¦‡ à¦à¦Ÿà¦¿ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¸à¦®à§à¦­à¦¬ à¦¨à¦¯à¦¼!' 
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
                        {lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€/à¦¶à¦¿à¦•à§à¦·à¦• à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Add New Employee/Teacher'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦¶à¦¿à¦•à§à¦·à¦•à¦®à¦¨à§à¦¡à¦²à§€ à¦¬à¦¾ à¦¸à§à¦Ÿà¦¾à¦«à§‡à¦° à¦¸à¦®à§à¦ªà§‚à¦°à§à¦£ à¦ªà§à¦°à§‹à¦«à¦¾à¦‡à¦² à¦¤à¦¥à§à¦¯ à¦‡à¦¨à¦ªà§à¦Ÿ à¦•à¦°à§à¦¨' : 'Fill up the primary service record to onboard a new faculty or administrative staff member'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'à¦ªà§‚à¦°à§à¦£ à¦¨à¦¾à¦®' : 'Full Name'}</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Muhammad Jafar"
                          value={newEmployeeForm.name}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'à¦ªà¦¦à¦¬à§€ / à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨' : 'Designation / Title'}</label>
                        <select
                          value={newEmployeeForm.role}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="">{lang === 'bn' ? '-- à¦¡à§‡à¦œà¦¿à¦—à¦¨à§‡à¦¶à¦¨ à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§à¦¨ --' : '-- Select Designation --'}</option>
                          {employeeDesignations.map((desig, idx) => (
                            <option key={idx} value={desig}>{desig}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿ / à¦¬à¦¿à¦·à¦¯à¦¼' : 'Department / Subject'}</label>
                        <select
                          value={newEmployeeForm.subject}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="">{lang === 'bn' ? '-- à¦¡à¦¿à¦ªà¦¾à¦°à§à¦Ÿà¦®à§‡à¦¨à§à¦Ÿ à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§à¦¨ --' : '-- Select Department --'}</option>
                          {employeeDepartments.map((dept, idx) => (
                            <option key={idx} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'à¦‡à¦®à§‡à¦‡à¦² à¦…à§à¦¯à¦¾à¦¡à§à¦°à§‡à¦¸' : 'Official Email'}</label>
                        <input
                          type="email"
                          placeholder="e.g. jafar.m@scms.edu.bd"
                          value={newEmployeeForm.email}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦®à§à¦¬à¦°' : 'Mobile Number'}</label>
                        <input
                          type="text"
                          placeholder="e.g. 01712-112233"
                          value={newEmployeeForm.phone}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'à¦ªà§à¦°à¦¾à¦¥à¦®à¦¿à¦• à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸' : 'Initial Status'}</label>
                        <select
                          value={newEmployeeForm.status}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="Active">{lang === 'bn' ? 'à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼ (Active)' : 'Active'}</option>
                          <option value="Inactive">{lang === 'bn' ? 'à¦¨à¦¿à¦·à§à¦•à§à¦°à¦¿à¦¯à¦¼ (Inactive)' : 'Inactive'}</option>
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
                        {lang === 'bn' ? 'à¦¬à¦¾à¦¤à¦¿à¦²' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => {
                          if (!newEmployeeForm.name.trim() || !newEmployeeForm.role.trim() || !newEmployeeForm.subject.trim() || !newEmployeeForm.email.trim() || !newEmployeeForm.phone.trim()) {
                            alert(lang === 'bn' ? 'à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦¸à¦•à¦² à¦˜à¦° à¦ªà§‚à¦°à¦£ à¦•à¦°à§à¦¨!' : 'Please complete all form fields!');
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
                        {lang === 'bn' ? 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Onboard Employee'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. LOGIN DEACTIVATE SUB-TAB */}
                {employeeSubTab === 'login_deactivate' && (
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-6">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">
                        {lang === 'bn' ? 'à¦•à¦°à§à¦®à¦šà¦¾à¦°à§€ à¦²à¦—à¦‡à¦¨ à¦¨à¦¿à¦¯à¦¼à¦¨à§à¦¤à§à¦°à¦£ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²' : 'Employee Login Access Panel'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦• à¦“ à¦•à¦°à§à¦®à¦•à¦°à§à¦¤à¦¾à¦¦à§‡à¦° à¦ªà§‹à¦°à§à¦Ÿà¦¾à¦² à¦²à¦—à¦‡à¦¨ à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸ à¦…à¦¨ à¦¬à¦¾ à¦…à¦« à¦•à¦°à§à¦¨' : 'Enable or disable interactive web-portal logins for any registered staff member instantly'}
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded-2xl">
                      <table className="w-full text-xs text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] tracking-wider border-b border-gray-150">
                          <tr>
                            <th className="px-5 py-3.5">{lang === 'bn' ? 'à¦¨à¦¾à¦® à¦“ à¦°à§‹à¦²' : 'Name & Title'}</th>
                            <th className="px-5 py-3.5">{lang === 'bn' ? 'à¦‡à¦®à§‡à¦‡à¦² à¦…à§à¦¯à¦¾à¦¡à§à¦°à§‡à¦¸' : 'Official Email'}</th>
                            <th className="px-5 py-3.5">{lang === 'bn' ? 'à¦¡à¦¿à¦­à¦¾à¦‡à¦¸ à¦¬à¦¾ à¦†à¦‡à¦ªà¦¿' : 'Last Secure Activity'}</th>
                            <th className="px-5 py-3.5 text-center">{lang === 'bn' ? 'à¦²à¦—à¦‡à¦¨ à¦¸à§à¦Ÿà§à¦¯à¦¾à¦Ÿà¦¾à¦¸' : 'Authentication Access'}</th>
                            <th className="px-5 py-3.5 text-right">{lang === 'bn' ? 'à¦ªà¦¦à¦•à§à¦·à§‡à¦ª' : 'Quick Actions'}</th>
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
                                <p className="font-bold text-gray-700">{lang === 'bn' ? 'à¦†à¦œ, à§§à§¦:à§¨à§ª à¦®à¦¿à¦¨à¦¿à¦Ÿ' : 'Today, 10:24 AM'}</p>
                                <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">IP: 103.245.12.{10 + idx}</p>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                  emp.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  {emp.status === 'Active' ? (lang === 'bn' ? 'à¦…à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤' : 'Allowed') : (lang === 'bn' ? 'à¦¨à¦¿à¦·à¦¿à¦¦à§à¦§' : 'Blocked')}
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
                                  {emp.status === 'Active' ? (lang === 'bn' ? 'à¦²à¦—à¦‡à¦¨ à¦¬à¦¨à§à¦§ à¦•à¦°à§à¦¨' : 'Deactivate Login') : (lang === 'bn' ? 'à¦²à¦—à¦‡à¦¨ à¦šà¦¾à¦²à§ à¦•à¦°à§à¦¨' : 'Activate Login')}
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
                      <span>{lang === 'bn' ? 'à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼ à¦¶à§à¦°à§‡à¦£à§€ à¦“ à¦¸à§à¦¤à¦° à¦°à§‡à¦œà¦¿à¦¸à§à¦Ÿà§à¦°à¦¿' : 'Active Classes & Level Registry'}</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">
                      {lang === 'bn' ? 'à¦ªà§à¦°à¦§à¦¾à¦¨ à¦¶à¦¿à¦•à§à¦·à¦• à¦“ à¦à¦•à¦¾à¦¡à§‡à¦®à¦¿à¦• à¦¸à§à¦¤à¦° à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦à¦¬à¦‚ à¦¨à¦¤à§à¦¨ à¦¶à§à¦°à§‡à¦£à§€ à¦¯à§à¦•à§à¦¤ à¦•à¦°à§à¦¨' : 'Manage core school grading levels, assigned class teachers, shifts, groups and subjects'}
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
                    <span>{lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦¶à§à¦°à§‡à¦£à§€ à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Add New Class'}</span>
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
                              <span>{lang === 'bn' ? 'à¦¶à¦¾à¦–à¦¾ à¦“ à¦¶à¦¿à¦«à¦Ÿ à¦¶à¦¿à¦•à§à¦·à¦•à¦¬à§ƒà¦¨à§à¦¦' : 'Section & Shift Teachers'}</span>
                            </label>
                            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                              {getAssignments(cl).map((asg, asgIdx) => (
                                <div key={asgIdx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
                                  <span className="text-slate-500 font-bold text-[11px]">{asg.section} ({asg.shift}):</span>
                                  <span className="text-[#025644] font-extrabold text-[11px]">{asg.teacher || (lang === 'bn' ? 'à¦¨à¦¿à¦¯à§à¦•à§à¦¤ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à¦¨à¦¿' : 'Not Assigned')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold text-slate-500">
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'à¦¶à¦¾à¦–à¦¾' : 'Sections'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.sections.join(', ')}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'à¦¶à¦¿à¦«à¦Ÿ' : 'Academic Shift'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.shifts.join(', ')}</p>
                            </div>
                            {cl.groups && cl.groups.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'à¦—à§à¦°à§à¦ª à¦¸à¦®à§‚à¦¹' : 'Academic Groups'}</p>
                                <p className="text-slate-800 font-extrabold mt-0.5">{cl.groups.join(', ')}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'à¦¶à¦¿à¦•à§à¦·à¦¾à¦°à§à¦¥à§€ à¦¸à¦‚à¦–à§à¦¯à¦¾' : 'Pupils'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.studentCount} Students</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'à¦—à¦¡à¦¼ à¦‰à¦ªà¦¸à§à¦¥à¦¿à¦¤à¦¿' : 'Attendance Avg'}</p>
                              <p className="text-emerald-700 font-black mt-0.5">{cl.attendanceAvg}%</p>
                            </div>
                          </div>

                          {/* Subjects Count */}
                          <div className="flex items-center justify-between text-xs font-semibold bg-[#025644]/5 p-2 px-3 border border-[#025644]/10 rounded-xl">
                            <span className="text-slate-600 flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-[#025644]" />
                              <span>{lang === 'bn' ? 'à¦®à§‹à¦Ÿ à¦¬à¦¿à¦·à¦¯à¦¼' : 'Subjects Mapped'}</span>
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
                            <span>{lang === 'bn' ? 'à¦¬à¦¿à¦·à¦¯à¦¼ à¦¸à¦®à§‚à¦¹' : 'Manage Subjects'}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setActiveEditClassId(cl.id);
                            }}
                            className="py-2 bg-[#025644]/5 hover:bg-[#025644]/10 text-slate-700 text-xs font-bold rounded-xl border border-[#025644]/10 transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <Settings className="h-3.5 w-3.5 text-[#025644]" />
                            <span>{lang === 'bn' ? 'à¦•à¦¨à¦«à¦¿à¦—à¦¾à¦°' : 'Configure'}</span>
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
                    â€¢ This form submits collection straight to the real transactions database, updating total receivables instantly.
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
                        <input type="number" placeholder="à§³ Amount" required className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-gray-400">Payment Channel</label>
                        <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white text-gray-700 font-bold cursor-pointer">
                          <option>Cash (à¦¨à¦—à¦¦)</option>
                          <option>bKash (à¦¬à¦¿à¦•à¦¾à¦¶)</option>
                          <option>Rocket (à¦°à¦•à§‡à¦Ÿ)</option>
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
                      { name: 'Nafis Ahmed', roll: '10', class: 'Class 9', due: 'à§³ 3,200', month: 'June Tuition' },
                      { name: 'Sumaiya Khan', roll: '04', class: 'Class 8', due: 'à§³ 1,500', month: 'Exam Fee' },
                      { name: 'Rohan Talukder', roll: '18', class: 'Class 10', due: 'à§³ 4,800', month: 'May - June Tuition' }
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
                        <h3 className="font-bold text-gray-900 mb-4">à¦ªà§à¦°à¦¤à§à¦¯à¦¯à¦¼à¦¨à¦ªà¦¤à§à¦° (Pottoyon Potro)</h3>
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
                                <p className="font-bold text-xl mb-4">à¦ªà§à¦°à¦¤à§à¦¯à¦¯à¦¼à¦¨à¦ªà¦¤à§à¦°</p>
                                <p className="text-left whitespace-pre-line">
                                    {certificateData.customBody
                                        .replace(/\[à¦¨à¦¾à¦®\]/g, certificateData.studentName || '[à¦¨à¦¾à¦®]')
                                        .replace(/\[à¦¬à¦¾à¦¬à¦¾\]/g, certificateData.fatherName || '[à¦¬à¦¾à¦¬à¦¾]')
                                        .replace(/\[à¦®à¦¾\]/g, certificateData.motherName || '[à¦®à¦¾]')
                                        .replace(/\[à¦¶à§à¦°à§‡à¦£à¦¿\]/g, certificateData.classGrade || '[à¦¶à§à¦°à§‡à¦£à¦¿]')
                                        .replace(/\[à¦°à§‹à¦²\]/g, certificateData.roll || '[à¦°à§‹à¦²]')
                                        .replace(/\[à¦œà¦¨à§à¦® à¦¤à¦¾à¦°à¦¿à¦–\]/g, certificateData.dateOfBirth || '[à¦œà¦¨à§à¦® à¦¤à¦¾à¦°à¦¿à¦–]')
                                    }
                                </p>
                            </div>
                            
                            {/* Signature */}
                            <div className="absolute bottom-[50px] right-[50px] text-center">
                                <div className="border-t border-black w-40 pt-1">à¦ªà§à¦°à¦§à¦¾à¦¨ à¦¶à¦¿à¦•à§à¦·à¦•</div>
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
                        alert(lang === 'bn' ? 'à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦•à§à¦²à¦¾à¦¸à§‡à¦° à¦¨à¦¾à¦® à¦²à¦¿à¦–à§à¦¨!' : 'Please enter a Class Name!');
                        return;
                      }

                      if (!csFormNumericName.trim()) {
                        alert(lang === 'bn' ? 'à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦¨à¦¿à¦‰à¦®à§‡à¦°à¦¿à¦• à¦¨à¦¾à¦® à¦²à¦¿à¦–à§à¦¨!' : 'Please enter a Numeric Name!');
                        return;
                      }

                      if (csFormSections.length === 0) {
                        alert(lang === 'bn' ? 'à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦…à¦¨à§à¦¤à¦¤ à¦à¦•à¦Ÿà¦¿ à¦¸à§‡à¦•à¦¶à¦¨ à¦¸à¦¿à¦²à§‡à¦•à§à¦Ÿ à¦¬à¦¾ à¦Ÿà¦¾à¦‡à¦ª à¦•à¦°à§à¦¨!' : 'Please select or add at least one section!');
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
                        setAdminSuccessMsg(lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦“ à¦¸à§‡à¦•à¦¶à¦¨ à¦¬à¦¿à¦¬à¦°à¦£à§€ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Class and Section details updated successfully!');
                        setEditingCsId(null);
                      } else {
                        // Check for duplicate
                        const isDuplicate = classSectionsList.some(item => 
                          item.className.toLowerCase() === csFormClassName.trim().toLowerCase()
                        );
                        if (isDuplicate) {
                          alert(lang === 'bn' ? 'à¦à¦‡ à¦•à§à¦²à¦¾à¦¸à§‡à¦° à¦¨à¦¾à¦® à¦‡à¦¤à¦¿à¦®à¦§à§à¦¯à§‡ à¦¸à¦‚à¦°à¦•à§à¦·à¦¿à¦¤ à¦†à¦›à§‡!' : 'This Class Name already exists!');
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
                        setAdminSuccessMsg(lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦•à§à¦²à¦¾à¦¸ à¦“ à¦¸à§‡à¦•à¦¶à¦¨ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à¦‚à¦°à¦•à§à¦·à¦£ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'New Class and Section saved successfully!');
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
                        ? `à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤à¦­à¦¾à¦¬à§‡ "${className}" à¦à¦¬à¦‚ à¦à¦° à¦¸à§‡à¦•à¦¶à¦¨ à¦¬à¦¿à¦¬à¦°à¦£à§€ à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¤à§‡ à¦šà¦¾à¦¨?` 
                        : `Are you sure you want to delete "${className}" and its section mapping?`
                      )) {
                        setClassSectionsList(prev => prev.filter(item => item.id !== id));
                        addAuditLog(`Deleted class and section mapping for ${className}`);
                        setAdminSuccessMsg(lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦“ à¦¸à§‡à¦•à¦¶à¦¨ à¦¬à¦¿à¦¬à¦°à¦£à§€ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡!' : 'Class and Section mapping deleted!');
                        
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
                                  ? (lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦“ à¦¸à§‡à¦•à¦¶à¦¨ à¦¸à¦‚à¦¶à§‹à¦§à¦¨ à¦•à¦°à§à¦¨' : 'Edit Class & Section') 
                                  : (lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦“ à¦¸à§‡à¦•à¦¶à¦¨ à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Add Class & Section')}
                              </h3>
                              <p className="text-xs text-gray-400 font-bold">
                                {lang === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦¶à§à¦°à§‡à¦£à§€ à¦à¦¬à¦‚ à¦¤à¦¾à¦° à¦…à¦§à§€à¦¨à§‡ à¦¸à§‡à¦•à¦¶à¦¨ à¦¨à¦¿à¦°à§à¦§à¦¾à¦°à¦£ à¦•à¦°à§à¦¨' : 'Define new class level and set up assigned sections'}
                              </p>
                            </div>
                          </div>

                          <form onSubmit={handleSaveClassSection} className="space-y-4">
                            
                            {/* Class Name Input */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider">
                                {lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸à§‡à¦° à¦¨à¦¾à¦® (Class Name)' : 'Class Name'} <span className="text-rose-500">*</span>
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
                                {lang === 'bn' ? 'à¦¨à¦¿à¦‰à¦®à§‡à¦°à¦¿à¦• à¦¨à¦¾à¦® (Numeric Name)' : 'Numeric Name'} <span className="text-rose-500">*</span>
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
                                {lang === 'bn' ? 'à¦¸à§‡à¦•à¦¶à¦¨à¦¸à¦®à§‚à¦¹ (Sections)' : 'Sections Selection'} <span className="text-rose-500">*</span>
                              </label>

                              {/* Standard Checkbox Selection */}
                              <div className="space-y-2">
                                <span className="text-[10px] text-gray-400 font-bold block">
                                  {lang === 'bn' ? 'à¦¸à¦¾à¦§à¦¾à¦°à¦£ à¦¸à§‡à¦•à¦¶à¦¨ à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¨ à¦•à¦°à§à¦¨:' : 'Select common sections:'}
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
                                  {lang === 'bn' ? 'à¦…à¦¨à§à¦¯à¦¾à¦¨à§à¦¯ à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦¸à§‡à¦•à¦¶à¦¨ à¦¯à§‹à¦— à¦•à¦°à§à¦¨:' : 'Add other custom section / group:'}
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
                                    placeholder={lang === 'bn' ? 'à¦¯à§‡à¦®à¦¨: Science, Commerce' : 'e.g., Pink, Blue, Science'}
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
                                    {lang === 'bn' ? 'à¦¯à§‹à¦— à¦•à¦°à§à¦¨' : 'Add'}
                                  </button>
                                </div>
                              </div>

                              {/* Selected Sections Active Chips */}
                              {csFormSections.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                    {lang === 'bn' ? 'à¦¨à¦¿à¦°à§à¦¬à¦¾à¦šà¦¿à¦¤ à¦¸à§‡à¦•à¦¶à¦¨à¦¸à¦®à§‚à¦¹:' : 'Currently Selected:'}
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
                                          title={lang === 'bn' ? 'à¦¬à¦¾à¦¦ à¦¦à¦¿à¦¨' : 'Remove Section'}
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
                                  ? (lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦•à¦°à§à¦¨' : 'Update Class') 
                                  : (lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦¸à§‡à¦­ à¦•à¦°à§à¦¨' : 'Save Class')}
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
                                  {lang === 'bn' ? 'à¦°à¦¿à¦¸à§‡à¦Ÿ' : 'Reset'}
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
                                {lang === 'bn' ? 'à¦•à§à¦²à¦¾à¦¸ à¦à¦¬à¦‚ à¦¸à§‡à¦•à¦¶à¦¨ à¦¤à¦¾à¦²à¦¿à¦•à¦¾' : 'Class & Section List'}
                              </h3>
                              <p className="text-xs text-gray-400 font-bold">
                                {lang === 'bn' ? 'à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦®à§‡à¦° à¦¸à¦•à§à¦°à¦¿à¦¯à¦¼ à¦¶à§à¦°à§‡à¦£à§€ à¦à¦¬à¦‚ à¦¨à¦¿à¦°à§à¦§à¦¾à¦°à¦¿à¦¤ à¦¸à§‡à¦•à¦¶à¦¨ à¦¸à¦®à§‚à¦¹à§‡à¦° à¦¬à¦¿à¦¬à¦°à¦£à§€' : 'Active classes and their mapped section divisions'}
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
                                placeholder={lang === 'bn' ? 'à¦…à¦¨à§à¦¸à¦¨à§à¦§à¦¾à¦¨ à¦•à¦°à§à¦¨...' : 'Search class/sec...'}
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
                                    <th className="py-3 px-4">{lang === 'bn' ? 'à¦¶à§à¦°à§‡à¦£à§€ (Class Name)' : 'Class Name'}</th>
                                    <th className="py-3 px-4">{lang === 'bn' ? 'à¦¨à¦¿à¦‰à¦®à§‡à¦°à¦¿à¦• à¦¨à¦¾à¦®' : 'Numeric Name'}</th>
                                    <th className="py-3 px-4">{lang === 'bn' ? 'à¦¨à¦¿à¦°à§à¦§à¦¾à¦°à¦¿à¦¤ à¦¸à§‡à¦•à¦¶à¦¨ (Assigned Sections)' : 'Assigned Sections'}</th>
                                    <th className="py-3 px-4 text-center w-24">{lang === 'bn' ? 'à¦…à§à¦¯à¦¾à¦•à¦¶à¦¨ (Action)' : 'Action'}</th>
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
  xœì}ëo#IrçwÿÙr_‹Ú)’"õ²Ôµ¤™Ön¿ jfvÑhL—X%±ÜE·ªØWp6àÛ†áŒ½l†áuÏÀÞÛ]ìß8ØÿJÿ)‘zWef‘R«{U˜iñQÌÌÊŒˆŒˆüE!òk{%0þÑ)Ü	×åÊÈ®ïÛg#Ë$=«ØîÈ'µG†yfùKä+WŠm&é;†ï?3†ÖÎÂxZïñE½³ðP±hÂ´ßÆÛ8u¬‚ÿÔÏ=cLÎŒq½Õèj4gÖ°áóçjq­ï–	üsh^,‘‡¤¦ÑÒ#¢õBÞXÓKÖå•îocb{dÕé¼àƒùõ¾5
,'ºÝè˜ô&ü99«[CË3³Þm’Àºê/ÿ¸Ùî®u:¯È‰ë™ðö'¼¯Õl®¬7‰çNF¦eÖ‡&ÿY«5¾xENÝQP?qsAkì:…Î*¹±k{WC§Ÿ¥%õ¶W€ U×ç:Îk³³[+F
³²[‚¬þtâöéT¼Elk±Ÿ§Â”˜v@M‚ÀiL}–ú+-â	¦cxjöC=ÂvG{ŽÝ³sY£d`ŒLÇÂÁïálr)ZÃ©Ô 6:$;p¬KÇ‘²x2Z$Ÿ“Å÷ï~ÿþÝ¯ß÷×ïßýëûwÿùþÝ»÷ï¾‡äý»_¼÷Û÷ßý9¼_$[d‘NáSc<¶Gg‹zÇI-¸o-o«Tš°[Ä‡­ÕnÛxJçŒž1òmœŽzßu\Ï'ý‰ç»^}ìÚ”\5F¨'N¶ý·gñG:>ÀvDNmÇÙY¹#køç¾/aPÐøq¼µ­óGîÅÎB“4I»ÿi=í}lÞüÙ}c¼³@çe!öéŸÂ$¤>þÆ6ƒÁÎB{˜;O[-Ò}¼f´IFÒlÖáÅÛV+|ñ·õöÛzwk×iuê›ø/ÿ®Õj76Ú„þû¤Õ¢oZÝÇ›oëô#g£ÑÝX«Ó¶@V4§zæZç'Û+Œë”å%^( ö-Ç
¬VD°ág„DÃ6—©àm„ô:7¹ñk*þþýw?Yñoðçý»ßÅÄŸÐyÏõ­PZð7Í¸° Ÿ­7›w²b~²b“¬;õÆÆÚ:nouÚ»\.´ZkÖ*0ëñ:|Ýò¢k¶¹Ù…7ºOºd}Ø%·kÃN}þ…o›_wŒi1ÑïaJbïIëíêÓY´Ön¥Ä¸.ínõTšUÑ4¡­×œÊšƒÛŒÇ*¿Mú¼KÀðå¶NZ#³µ×.	¨Û}«>­¯J©<ÝVÜv”8óŒi(%è›NL"œN'e­˜†? 3•¿£¿h7›
—eð`ð”6³Òm^#ËÏÍ[­ÇÝa«Cš!'£^°ñ5¼xÜ½E½ úÞÒ_½S,êí§]h8úŒÞ¿îÆ?¬%úl?]GÐT JL¯ÄµÛƒN|5é*úCf¦ÂkÏ@[5FV›]"ÉÛ>ñþ»¿BUû»¿¢ª6*à¿£
øïáý¯˜þ{º«‚þïp'úß¾÷›÷ïþ»å7ô#öôöÿºG7ßg.¡º yy^p'¶Ì{Òx{eÐ‘NÓ83K~ŠÛ†ÆEý'oxQ7&KË0A¨{–c\XfÅyû}à_‡³ñïtŽ~Ku´Wþ5“wÿSAçßÿ†þê?èí¿T[þmåûð›¥÷ÿöý»a]¤×åohK‘³4¿=ý'mò¿Ø]ßÓWlTß±^Þ¿ûç„mõþ_~I—ìLo‘	ü, 8oª}íX§	ô­€LÆ>âo-2u'Åg
¢Åó¶$0ïTã"}wtjŸM<ƒ9¨Ö}<ë6PÜÿmÁ÷%-/ýIÎÇWK5è+çÔäwô¯}[ë}õ¨~¼ûˆ´·ðåöŽ{do÷x÷Éó/‹žµ¤µ9ŽÍè¦5´û½ÉÉ±qÂ˜ÄŸœü)°û"yð `?Nï°WžÀ@Hm‡”‰[ÝhËl_8°·®`˜î9¼åÜNISlÝk…,é–us’ì„Æø6ðÈ;Ú:š[ôµçžãë„	ÞOÒ‰œ[Öˆº’Ê¶Ím	oV®«BÉßäê…s&‘dRÃÿe’äÁ/©pøýôL²ÿmJ~ýž¾þ!aPhQÁÑc‹Nö@€ðØ3ÃqË.ñ«¥s  ÞéÄø@t^†A½UyÞÅdçïøf&„ºl¢–sîa[ë?%äõwTô~Ïçõßùï±_øÝ/ôDõ¾u
úñûè³Ïæ½ÏæÝ_&œáÓ‚·héÃ”Ú š}*ÈÇVß6ûg r’Á"•¬W‰h–ˆe;LøÂvgö=w<\îä{på.ÛmÇ8±œ<J
½þ1šB3žŠ"&MF.žÌT ©ô–ýot]G?ýG¶®[tùtÐ¹Ù’L?}’Ògõ-Ö¼t´ogbí\rò`ÝÓÞËwfw´7€Ç„_Ö,êñ5 —i£f5Ã;³‚íFb!æ¬Éø¢¾ŠÇ<í¸ý”³+´c†l
§nâo¹“€Ú`hÜðRÇ@kBd¤–=5IgŒØcV/ü2¿ŒDWqÇ¨öð9_Øuœ…‡Îoàïß¥U=J ð#Fpçö
kQB5±-óâNœú¨áX£3°×’¦D#û<óS<eì#ô#ôåIØ"»LrãÔs‡µ‘uÆ@P‹)HC¬QŸó.-•·»Ä;ûÔ›¨rÌ)ƒžUÒŸ]	f`ïò¿j“\îþ [²bE)QTSbñÌ³M‚ÿ ¦â×[Ä9ÛŠÞ®R!Y¬1áüjú/Œ‘åÀr™&Ya‡Ub[×‘ÒrÎ×»	N¨nè•<µƒry®|ª't±|5¯KÕ¼¶ô¼=e‹jbBó‡R›òÒ‚¹ëˆÏîlÑò£ÄÏIMA…QòÔý+ª@|_p‚–T×e,ŒLœ×û÷¨
Ñ¦s ßÐo˜DûevHeÏPpsA6†ò½Dî/È›ôB%Ö°â±Jê@äRÁc[èAfLµÑÄqríÍœŸïr)
ó(6càãÚ%Õú`Ž—	JhöŠR1¼dzØf}>,£?°<vêˆðêx`¹Þtì[ù(®ä>àô.ÿ²ÕDÌ…üè$Ú¨óõ¾‰Ä B‡Vã!;PQpéý8>üÈRÐ”œÅN£_2UòÀž1ê[Ž‚SDœ”Ý%ÙÊvzwö !í ÔóÊ	ÙjŒ=ë-¬	X#ÆÄ	jš±OIíž‘Kµ¤ÙFàÙCà ?û3Rt4¿m‰xV0ñFå}öÝ‘¦—R®ß!ò4÷«ñÔZÃ·ð¡¤O••.KR!ÀFf]Ø~àÇFêD¾;´äè-¡5ÑÁÇGMÉ/öÜ íro»·e‡Ÿ¼I2
©¨ SDT>-L´™C{tày®÷Ô?Ëì=Ôªþy±Ù:_ÿ’º·Ñ²OßZ÷ÿ¿…m ¿Ùåð‹_Þ[ v]8Ø~Â°&†ãY†9k,&¶Ð€`÷Ý[P£ð¼ÇöÐ¦VÖUr—–Éj³ÙThM…)dûib{YCfÇááßHc—?^qÎHux}N.I£ÑÈçèe¾Æ˜@°E|½K—a†ÍýÃoì‚üz“~ßòýLr“`¸ßSo˜°ÿ‡nw¿ŠŸqüå¹Ê õ0þGŒÇÁXM(¨“±i–	ÜDG‚‡¦S–*d¨Ø©²Ô±ßš0W•Õ·Wžþ\h0¿Fƒ¹Lé
3×å¯„,ýNGp~’Bò¥t ·ðæe¹69W÷ê“‘@Åö§DewùVJh®FTLîxj¢7{ÞoZ6•|{u7^"÷µJ¼å¶4žIò‰Àæ¥PÅ´×FŒ¦àÉ7Oþ‰ãößä:t×”`3Ò3±PEüžŸ÷×âO½”8ùÂO¯xüDÚè†îÂÃ¨aú¼ýô6{4ž”;üñb8O‰d8v`i0–—‹¸üþßo‘§¨ºC#°ûþ299¶? “b5ÎùßÊõ/ÏúéÄö,Sz#÷Þ–Ø‰òÎòÎ5
DŸëµËPps˜<õ é¦ K µ(Ï>XK›¹ž‰W<ýèfL“îKµ#¼$¹³!)Bè®õ‰ŠØIp-þ¼K©csóNx´š­eø§	Œð“¨Ì\»`ÓH^ªBâ˜ÎGôè©š­ññˆ‹çp?äŒ~ÿÝ'5ú¬L@Ð—7/€xI˜K+ÀkVîb¶ÇüØë1We^
”§
XÂóFWY!6@-ê8y(ß°ÍèLž)pÅµSyvI ôi° »^&lÚðÍ£èM«ÿ
ÞÅ¾Ûˆµß¼¢„TqŽFqÜŸ¡k™ù™”áÀîÒÓA×ø$…|¾Y)ð€µøó'5Cüä#•ÿ¨8âIžpû\ûVÀ¼Lw;Aù•B¥±ÅÉ¦±oHz|Épôß_–Â(™ÑªX_u”ÃÏ †ï¹ø¸ðKIN,CÑ²‘„÷Î0˜çô]þXÄw8”ÿùþÝßÑÑü}|âõÌW’ú`LOlšï„ñËçÚr´ hKÆB‚-³²?°úoNÜ¹ii›;¶/žM~?mÙ2¥SÔÖµË¥¨«˜tâã[&cƒïxÙ€ìèqkâ6¤´EmÑ6¨wÈ¹ð '1±(¢<Œ‹Š¨¸œ[äœfÜ²-ÃwàA0t`
«œÞåˆJ—Uµ}úoÂƒƒ_„~Í…J›Ÿ³³†ßóÃ„wÿÀ#°(°ûs*"Pá£°/+‰ )µ+Þæ W]‡f•¿f°>ÁàÓ9hH»Ö(D$µ”«ÄBqÕ‹Šc’üJA{QT®ÔÕ+™‚•	¨i)e8˜QšÉ+uëSR¸Ô’1¤tŒ<Ý¢^W¡ØzÒ(Üœ$Sø\Ë¼Ì Niƒ(Üócc)‚úT°XÚ!´Y}a×ûUìz&TÑ¦”±ó£;£+a¸²ÓnÂÔ¿OÕpÍZ«¥¦ e¾²ç³ÎÍ0eƒº~{T@ îLÒòKA:JÃ%™~öw¹1\T†Ä¨.t.·†í`vþãPN¸ÚÏ.Š†™¤T%eBN¡ˆ@:c”SÓÜuÃ(‘="'–1	l QrÀh‰|éaäÑGëQ.•B,˜½èÓ¾e—Ã;`ÁÄG®…A±‘ÊÑðÖŠFö0†KE Å-–àÉ€.9ƒ`â•Ìƒ˜`*ÅbÃ Þ)T©¼|áLü=Ûë;VŽ!¨É°­–€²RDSQLÓˆèj†ºùß,#`Wcú	Õð!¼òƒ˜òC¨r±a•ûV`Pé<«Dl¯`‡4ê°ð{và
ÒNÄŠ}Ü±ý€œÛÁ€0ñWž×3­Þ8g[}×©ã3bhoù–…È™§pÏÀ6MŒáÛ]l×Ñ‰ÛcY`d14UŽ‰²MðÁÃS9Æ³¥(ê°ée$ÒœfÂ%s"“ê‘‚7A q3¶€ìé¿AÿÍ¹m*9?¶Õ²|Áx“yðPp´ÚÉ”¬½'Û+Á Zsù{})
/vw­ýGžÌÎ¼{N£â(€y÷ÅŸ˜Ÿž3Íÿi’:‹üù¸cúXÕn“„˜7„¿Œåõà™’Ø(è£jß*Yñ°%`n¹Àœxñç a\[Ÿþ"‡ï‘*¦\M=•E.0¹«’» \“¥x¼²	&Øºì:Î"ºªà{¡gïVqHÂòØ…‘âÙÀ»lªNàÅ"”Ó¨+
Vq3ì®Óƒqçrý*IÜ‰Ô„9‰o† uMäáæñ«Àçýótî‰üà¸Dº¸´Œü_T=úsæWË'rÙ<s`¨4’.À¨F#låéÃb3K3^*ß«¸fJÙ·»8U…”ÉR÷ON–‰Íóö«Q'néýµáÊI™ƒw•AâX¬Zæ‚$H%gõ°JÃ<–ôÍzt8Dß·šMÅNÃÁ"F'¶ªüHòG™Nâ7ê²Õ ‡Ëc¿2£Oyg´1<q‰!³w±³4†«–âU_¢qW.ÊlêÌÛ’ÂŠæúé
>M:Õ±NÚþT€äŸ+Ýhô—À7ä3ÒºÒáüâî­lvÅÆë€†­'kq¾ÔÂÂÑÌeìIK§'ñÑ:ÎÚÖtd L‚fZÍ¸¦ƒî–¨ÞG+§fæÐÌB}ªZ)Õ5ËoÜìt*T“Ñœ¥ô
]¾.XnÁÇóy¤ãÄíQrÿ2)ý®^_éf¿äò÷º¨pZÑ;/Ït›&õòyF°G¦}æ†;Û
ø'!¯(L»v¦vB‡tŸ·Â4k• ÐJv~=bTœŠpùÉÏvPÍ*p*þ–W2Aåù]nt)Õ¹„eª—æ´…iWÌÑÉ®U¹fÎ¬¥pÔS2%¯
	š’W~F±—*Y™‹¢¬µÛ"<ÊHGSž½X0£PZª´Àc1ÂÍ¶Já¡iŠË+µF!ÁyF‘vc*ù°R¿Ð£kE¡Ëœ?ÛÊ¯;‚ÇRÕ‹ŽàÅ*±,Ä“È]oÑ´mìjµÚáUª%¥,ZéK[²ÍRÃçCÊ¶òd?qpCôÐ“ïPúU’¯‹ƒiïÇ¬Ñ‚2@ù™^Ã~ûZøðéƒÄ›2éê™÷^W{ ¹%vÈ^s&‰òEy’„Þpb„óÊÍ’cÏðí%I®Qƒ·ûR%ï#­} –¼øBéÉÌ©$ÒÕúê¦‹:¬n‘½'»½éí=>ØÿêÉ©õöŽžõ??&½ŸôŽž’ýƒÞá—ÏŠ
ÖÞ@UÊ6ßú ™Ç¢Å¶Y¥7þîÓ®¬¤ÜäØs‡.=„£­õ‚‰	FÅñiASéënvµ:bµŽžu|øì€>=€/`Ù¾><øæà(ö»¼X ¼ÁZ±>‰BežoºÎ;Í<b³K¾¶­sË›[1æb@=‚
FŸ°<iKìVlhÓöÏ†]È¢•ç`¡¥³‰á™6ìÔ³TkàJhZ­<·G°Ú±[>ˆÿ”«æíùÇÍf·ß]}iøQÇÄŠª1$]²ú¦°Õü¤¿ ÇDÀºr¤t=^xc§­0Dý9	—Iæ “iz	ßéÔÐ3É	ŠA‰ð»h2Ë8$7°8¹*)9GÓ26xb½µœ-éóKqÛ"ì?¾¥ìR,¦´:EJ{¯ 
IúŽêR(¯AcÎÁ0b¦8³¥‘Ÿ2ÌvÈbÅ:s_VLÛ0ßte¸eb¹œaX¹;Å§ä‰1…Y-1Ëó÷&-°blW©…î–Ò1Û}^qÊòcí¤ÃhÍÉ'Fº­‰#ƒÀ>ÀÝÇ_í<£ÆŽÈÓçûOP3}þü	ìqí¹ìqç~>?=µ±>Qlñê¤X>H
Ç¥ç–«M´’û•(¯ÑYºÈð´³àPQ¨¹ØSVžO	…º­Sóòk‹`ªíf>LUñÔ<ƒì[Í°Xèrß˜ªaö._>ßïQé6VÊ€‘Pù6¦òMqPJæwö<°±&Ðãik½m¼ZxƒàâTý€­ —Lñ…¨FfPobè,°µ:S[•ø™C	[¹­Tmør÷'½oŸñí7?¢´aS5ê‘0ð¥ìÌÑ\‘$€&‡$ø~ÿö­êJ²€åÙ®©-ë[âÊjÂô÷_ÉàWx¼ryµôòõ}:ÈúýKÖ%2Òkö­Àùñ´ÀñÁžëÙ+ÛVÏ›-rj úêJÍUªj29Ÿ‡cLBŠ×êþ%NJƒ|cP®•Õ&=Ò]Ô9¤[ÔAd>‚ýd 1šŠ¡Í"ÁUâÀ‚Cü”>Ý#L¸EŸQ$PÖ|Æ‚€Ù¦´€“Úl¥5£1-ÀpñakIâÂ.‹eq×›ì_Ä¬Î¥^¬<¾1lâX€Œ}Ç¬fÂÞ®3LV‹AX`ÎÃT ñMþˆ20.23=m}¶²»XaÐšîrÕtn…3­ÂjjìÀpì~–GÖµy@õGÝû¯èÑW‰›—"È6r¿ÔßÿÑ»ó»[äø`wïñÁQÊQœs}01—&ßæ8ŠËŽ™F	‰~‚Á;…Ÿz²{Úy<µ0!â>|ð…áŒ‘AŽŒÁÐá§xÛ‘qjÿn<Á3„‹›ôäØðGöüÐˆàÃÞÀÚCƒô&N í‹†ŸÂä±áG}=]ßå£A^˜°i0YÉ«T}ðKžÿ’Ø&æ&cêW+ªœûoø¤¹¹â§NàoÔˆ«"ÈK²Év¦Év¢É6ÙjnµÕ›\Í4¹5I›Â&[0Zå&;™&;±&[¼É¶N“ÝL“ÝX“m6—ðWc.×2M®%šds¹Êæ²ÕPããÉaï	f±7aÔèÒ?ÇÊßX&}7˜,µµ²BXüÚ¡‘Èü0¢¤_`Ó±ðfqp:})Z6<Ãé®gœYß
kX[dõ¦¿Mú0Þöž?kà©ÄèÌ>FæB14¤´.“¾å’*§~‡Bû’5Û±ƒi¶/~×nì¦âþr`"?Lòì–æÔ>›xõª²Z"Š•Ž”Á&b°É•œº°J§û‘{.%0¸Ÿßw#‰ñ™{Æ°…tBK©ŽVŒýHVãÞŸ"…†=ê;Óòã½/•…êÀä%ÛˆÊø¤Ó¹`ce%tâO'˜—‰ß—Úà¸¸Ùb9fJÕ0¥²B‰Ñ€Ö.Jô|tWGqLàžžîS‹¼|U^i¦þUüÃŠ}}ÿ26®+b˜&+¯ÃW3ÓbÇ¥­ù@±Š†ŽµÏî9_¢§®i85êª¨ÎgGÖÐ9®Ãjì'³q[	ÝÇa±\7	ŽÒ€é•õèèÁ€ôÀPÌ®n£xuç±¶Š’/—ãæŸ]¦DŸËÜŽ«aáºý  î,“ZºêÅTyUô¼A¯” er’ô2¾~Ë„¹¾MrE£¾ãíÉÚ1)Ï½h.¯sâ±ÖLŸº0DyH¨!ÍË5î‹tÇSh;L±Uæ¤s„?xÉG	27ñ*ù}âÞŒKóz4wÊ¥8Ÿ”’[Bh|YJîg>ÒÐ¹²Úl•¢â“ŽÔb]<Ü©Š“Q(%‹ãðóä@˜ýÂn©O|J<`ü÷ýK>ýW´#¶ Äœ P#±u(Ùæ³Pptœ7ÊÊx*HŽzÕ.ì7)ùÂ§GHúedJf´¨
ÿëgÁ$Ë=xâ«pÄˆá²\EýP$íüoò([hõ¥ð!¦>»\\©ÿp[ÛcËcØ¦K°¢Nà†CÎ-ë3%ˆµ˜x/a,ÄQ	Yž…*ê7´…=w2
ª¨ ˜v ÏÜ,š˜çTP4ÞXS?fY6`°Ð›`„rúÍm#"Mvv6Ò–ì¼ŒM‡ÏX2Û®‘2V¡m`‘nøF>í$u.üþ½ËvY:µŸ}VÖw1‹Óñ7![A¿•E$ƒí†¢ÉJhˆììÌòØdn$ŠQo„’#Æ§åiÛ0¤‚œyÀ§Q/G[?Þw24·èkì
x]¿-H[&à»§(MÖ&9Ø¯ÓÍu¹ÈpºÚHÝ=îÂ±„$¥ÌŠ*ÊÐ º¼X&ç®÷ÆqÓ_¦Ð]ä~k›½¡´—d‡a’É-I-ò i$ëd·ÊÂzR(ã<ã:ð$PM¼RpM^%O
ØLB3ÓÙL’‰t‰•#+Ã(ç@;³¹QJŸK)ÃgÅŒ~NÿM ²”³}ò©×ËIy+ˆfß˜ÞÌÍEä}tÄB÷…;r¹yr¡ÿS½#™›'>õÑdŽZõÈDHÕéô;ÝD Uš Rªñ-¡
zPOêt m|D·I¯CLd²Ã~„b"/oVIA_:u•Ðór³Ü“g.ØËvßå—FÒÛ'K>–¶îÆtæ’ùb’Ô#¾H	)¨ø—I¥™%%cd$zj˜VÝ.‹Æ¥#ÞÃ²v…%	€ü`ßÔåÎ–;=a
PSÉ¢–UýÁ}jØ#räú8GO©‰Ï3æë8[B©P¡˜s¨ZÔPqîz˜ÀúyýeHBžYñZ‚‡Â\×/[­¼¬v‰¸¢XŒ˜d9aEHd/[kyÍGY†…ÈVJžßÇ†¤8²£rGEÍk'€SM»ÍÂC]Ô*‹KÚ,€Â3'[©ÚãÇ;©í›šÔúéOêêLj{í“
rf½TÌx`RçÚ&›u±³M¥æ>Õâ’sÝâ ßÖwn†€ã@ìOR»73©q(ú§?©k75©ÿ&Díf¯Çm¤Âa ˆÝT()Öb… VBe7†OÇ«¤(Åi*“ŠU;i5SÁõÉªR¡yY°þa\^<nZ1ô™+ ¼ÜHƒ¢=ÃÏhJ%ÃÈÐñ(7„j‰Û†ÊÓ*ñ)ÅÝ)E7¦W‘–¢(J@,*„¸“<;æ–ÆU¢9†9D€ˆrÁEâaÔÊþhEƒ‡qý"ÊV);YèqY}u–ÒÔ[Ä×‹¥Xr=²ç:“¡NÙœdà…û0ÐÙ¨¸còØ«šµ T+ G—¨ŽªZ¼7~eRDé¦ÈeD:²Î)k'UÑW7—+¢½D[è*Œ_á7•Æ®]2lXª6ˆƒÌ@Þ‹‘m‘ b^ß²à•j¹Íu¡§em§/ù#"‚›¾Ÿ¿TK_q «è­J;
¨Õâ«B
s­û5sg”±:E®1;qYÖºª8ÌœQ-{i¦aHT¹ÙÃð•zÉçø•-QñØ‰Ð’ ¹%ÍšÕy4cýêø¥R=6 ¥ºÖÉK§ù
ÉØu“W
tä*A•9ò§þ¶X%ø(Y8ý  8SqÒ…,q‰Þ´%‚Ãƒ^#Î+¸~p­¬&Ì~ÐPãÛ-(Ž£Àsÿ†4HåÈ±~>´&ÉìZäƒh“QÑÆÙ´ÉÙ¢…ó.¥â¼+Tm¶˜šÆ¦x™kTâu+”Æçþ`z«Ö¥ªƒDåé¢ÌÔá%:†ª—M˜E×XUÙ…‡áËjtªá†ð†Ã—U¾î¼@ÖÌZ!Oš[1u’]Wf;Åè=_šIYåéæP
P¤IÄL%ñ‰ú²„É:ÛÇ'Üá¾¥7§"=š¯`jj¦ü‹_Õ
í°+LYé×Õ5DqÍ\î‡]×`¨³‹›ëoOx±Í0²ãÝ€ë8Í‰ä“]å~ù<§mnwÑ¸A“¦L˜±“-š‚$Óö­äB`çê«<ƒš]…A<fŒÄJVc7¼*“¾Ã„ÿ®ÚXùGÃ|‹­øqXN±„XAÖ²zä~ÕµfÂ»òì³ü¨¢è”°%ðmvNEèSý}âÚ¢ýÅµ¶¢ÕiÌlµ>¯^WYmÝý˜]U·jÅïðÒwjú&4S}jÿàzn~äÍ¬ìrpoêÇÉü¶t«Ö\&«Ì#ÇÓ5/“ñ¡y¡¹Ï¯¬à€h•”âØCRá%ò¶:ý10•~ÀsDî+÷ÅsB†9@`ïzÀNÛ—"=ŒHð'¸cEoÂLÐâ–Ü$vo2—¹zˆ9ó4¶¼ydPluö<E3û’fÚ³„5akÊZm±¾¨ÉŸxô4Æ‡Å$Ì|­¼4Ÿ¬E”eB¨r£ÐÆxâªÙå	ª Á2VøYÄ%8
)…Š.Î]Ø
¾¬ølQoßÁ“ÆÝ:c)Ém”½*X£åIècõJ}¯ÀßQÀïgFPàÑ-êÍ]Ð"¹SßðLÝ0l$Î¦t40o‚Øõ-}ú|tŠ±‘$°#Bn¤¼{ìcÔ1&}Ì˜È§ŸuñyüÚ~k‘3øá8¦ÑjÏh8þ´o'#7kxRh9$|T•†•ã
CƒE¤‡*u+ò&«ˆÅ£8`Í¬¨…¾ëKu4áñîJK„š„Á•b€©!‰äcÕ‡¥­Ù†?L/zQ<Ì-à4õ^Ù¨£:sê»ŠÉ’ä‡¹ÿa ¸¹Tïý†=ys÷Ådk«EôÒŒ’;ÛI5m%qÅÖÇ8ñÁö … ï‰‡U¼à¯ˆ§-áônêÌyRrÄAOFŠ«qÆq›¹¾p¶; –d’±ÎF >m5à9þñŒu¦ÙÅ—yŽU\*íTL?N4·i|k[)æ9·½Ê†|%ž\*‡Ì¿¨`šÂ2~Äj‰ê«Uùz6žžƒo=›/2‘v5Löå_ÝŠL±Š.Gš(f\­d×fš³|ôÕ%>Iª´äËæ«Ïi3š°”åâÚ¬ïVì%´†bE-ðƒT7/Sßîû;á…¨0¹j…ßWY¿
îâœ3kšKqÓðÁ6Ï¤à›A
úß¢“B<ÜOâ…Ne{UI”çÙ’d¯
‚1'_	æ ¨$¡YX:ðb5µ±šx¯àBU-0„—2E_©ï¸K°bg³”Újñ­.·™‡¶	JZ6’'¥aÇ•˜¨XÃ)P©Ø)mŸ ü n²%kn…ÏªÒJ7=á¥Â4ƒ/éÀftx#ÎÌMX‹Z§¾¶4³|u™¬ÝùÀï|àÑÌÞùÀï|àw>ð9Þ}çOŒàÎ~ç×Ö\ePw>pÝëÎ®tÝùÀu®;8ûå\~ÝùÀï|àw>ð;ø<º®ËÏ5—XÝrwÌöIäVÚH%­RÎ¥DG‘­{ÙinŒY!Ý´BÓ^s§w,9qNr‡Šåe”fH]ÜT +Þ©”5Kò®dñE†"K·`Š‰Ù’aSM`‹{HÂò^´œayVì„*¡›ûÔ¾°°îèuJå”„VÖšr¡ý3´(W%“\“hÁôÀÚ8q&ž<î½°2X<ãsARh¬Æ··¡qQ?ÇóNþð#á«êD	ž¥¡ïO)+ñ¥¯¿=èdlù´&,Þåƒ-$‘­4	4bº$ÚƒŽÂØ¦’Ts*}ä•ú¼Ê8òRg„~ÜèS6›Rz¼”™¤ž“BuÇ”ñ(¿ëTh˜Ð+‡v êY$Ë_åùKËË¼ñÆgŠÄÞvŒË)À.tu’.7Zµˆ¶§ÔsÏèDV§ã©u\¹ºf PVßáª™‹9¼ÃÍ¯(õD#ÊŒ+4í4Ü=©xÈU¡ßç(1U|þÁ¼˜uƒÁcD¯–fÊâ#-'crÄJ¹TT‹y\›)æQ=ÎQ]%S§R=«@Ê5;5±y›dó1ìÛomè_GÌi¤Óáitsˆ³¥ßfRèH¤GèZI¦ÊQ'¹9^VÕêq©æ™[Ÿwž9Å%ån¢ûKßñµv˜x*7ø-=…y’à-º•®F/õr¼¨r£j˜!¹,|Ø†¬›aHqv-z!ï2s]¦=³”#aÆ*s$ü6Î‘ø–sdøV_÷]ÓºZºcO=öÄ£[òl‚èJÞ´Gã‰k2ûWÓ¯=ë§Û³ÔÍ1½5€´¼«qÖ «ÍÖ2ybœ–Zw)ÉAÏ¯¯El°s…k‘·LT(™íÕø$´=áÑE”’Ž	©o*ºQt™æ0k…{B6óz²´Ehã”–>L¶ÄŠbÌmØ3F}ËQªêVþúÔƒ£¶„ÅÓ^µiò¬á&¦{ÑA5×¹W²·WÐo&«Ú!ihÖâ„ÜÁnša)#÷¼Ü¹îÜs~sä^—Ÿü3ô³g{dÎDji²CfÌG]vÜ¡/½…þÿ9Ÿ øÃO >Ä@•S€.ùÒ³M5g¿º»¿—¢þÚ©áøÖyügñùW_Òû.3ì¬_zg&/¿Ž6R´5s2Ós„] õPŽD•yÏ"†ãY†9E§,"j]gl›í•±|.ÔŠé'*‡*³*fÇ*¾#G:õÀ$ÁG;ŽwjY>º4‚ÉcÅgáÉ3œ ÚWX¨hHÓn)MHÙÃ¶©ÀÔ_¶ÛÔž
‹ÒNiQZõÚ6YÂB“˜‚•´ íú€8j?SYãGUñs¹HXb±þ8-ÄkY)ß1ÅRfÊëf¬ R¬S
®Q¼Hã®ËÎX4ë h9ôVTR¤j*CCoTÁej~ßV°hk­jê|V ãúÖ‡0D¤7Io)ÑÂ¯–jŠfH¯?p]‡`_Ò³Ø™ÎÊã¡¨-·ßÁ|æ¡ä0Ÿo\CßC™ŒçæéÅèéF5û[ƒåQÕBEË¾=A=›zð0°™ø*ð&}z$…
ä´N? ÇðÌ‹N€¨ÞX#àCŸ|:¹1¥qõ=ìvxÃTtMºÕ	Ç¼|Éðûdñ©KÿO0³üâ7–Iß&øF†`T‹¯"4Žz…LÛgîM²C"TO”T^	+¬W 2ŒàLÇÊYZUC,Ôú2ÁÊJ?ƒ_²8{º,…¿@‹Á@ô\(üþ&¿À¥Ã/à¯ŸüW¿¿£ôw¸ÄôWàÚäW¸ìø#LübQæ"žŸ™xp¦•<#qIQJmr)ÍÚ®A
)Ž‰¬¡åa£½ˆ÷ë™6ñl1‹%”£.ôSÅ]½¾Ò€÷ÄÇÍ_Åd>Ñ7Lb,ªÔ—HY?WYËF¨(’«éïêÚ»®î®¶mªÇB=ëvmú¹Ê‚SÝœˆÝŽ¦¯™÷Ö<Ó-ó9Øó,Pg	ƒƒI5ozÛîý¢{sÚxfsúp¬·–3ý;¢ª?LO¥}Fh{’‚U ùì³4Z5%Å“ÝYl]Á²Ä•Q•_Ó£ýÜ0Äy¼TÚ’µŠ©*H¶¹E^÷¿~ÿrˆº1rÏkKW¯Uc_G4$91'ª?õöi°…Ú«‡îmåp[þ¿ûÒ¡‚¦ü;JÓÜ«†Ýz²{bNòxj©©p*;ù+%J¢XŸ¡¤Ûï[ÀãþYí5%÷/³yµ@úTÜ˜Äg7£°Þ{­ÚÏ±=´ÜIP‹…$;^\\Z&«ÍfSµÅgññáÏ—+Ò´Gù´ç6I~õ1Ü0ÒÀV>	Œ{œV³¾»Ì_oÔiÁí’,¢êeÏàí’”œÄÖÝëJïûuù*•î*ß!ë÷Þ!ë$WÜü'Z·ZÇ'BÄsHmj~ãUý‡eU§ã}æmTÇÉêÎ¬.¼>€YÍW†*c42§¢u-b‡ny[^Eóc’¨y˜ü”fªê}õX²¥l‡ÖzfªµŒèœQ-¾ZŽ®@˜äéFž›½uÖºSÌ^ÏÌçí4ÛãÃ¬]rêZ\\æ„¯øÇ×1Z¡ÅEÅeÅ²öÎÞ×Šy5?‹ÿÅãŸ€é«R—'õf2õÔŸ*Oùá.ÄŽ^_(ªàšOÆOöØ>Ãýç£œ‰yÔA¿U™‡m!wÌC¯yÂÜûË|×›i!W¼féÎ4›»¬™ë.Já}·?9œÔÕÊ·0;‡r#àzy4´4î¸4s]æG#¯•95™4 î>R¶üXNŸò|wçOéëîüéÎŸ8é}²'PÚ¿ËõDFhá9ÖŽþUpÊ…­¡ïöx÷YÛ"GÏ¿:>|v@ž}pôõáÁ7äéîñÑá³¿+nmŽc‹¥à:6NþŸGG‹´þÖ¶Î‹ä
Ï½
ÎºâÇaxîÅÏ¹Ú"Ø†Fë
½k­P´gº-9¾*Dß¬*ÕN
®œ³…‡Äw¦aZî§4†œ< ¦oº½2X-éQ5èŸ…»ï¹#ßul“ú–‘áL»ï÷”²‡åCmŠœ»ÞÇ5L¬…62i&)#uìŸQôvI¬{ù†Œ„÷£‡ÒrméµÁ”4ï iðAªúÃ­èí*ÝÉK×(Kb±°ŽÂ(zªÈ™£`YÇ9!Xc/ê~MPEZúË‹÷VÿMï§LÓ8%Äz?²j?rñ)GÕ§+ e-•D¸Ìš Êˆ7bÆ
+Ípl1nU%ê¤¬ûœ­SŒbS¡ØÂ%¯¸JÕÜD%W^ô­ZÍè÷·Èˆ¦°ã^‚Þ´Ì2U<úä!iÐùŒ$;Œ‹»²|>µ~ÔC_¤œD¹z¯ß°}Zx‰'‘š\-“æÒyL<«f"_	9É”ôî<™È²&ýôzù’vQ™)¿ò1sÊmfÇðùŠy‘ÇŽq×Î50#åÄŒ‰QïU˜NY¡ûùŸ¨bž¢>^üZÉõQ™þvËöl¯ïÜîM!zÌb2Äx1°ˆŸì[È)K©Ä‘&)²PZlAø¢ãyÑ^é—%šÒ×¶?]ñ	(bBCTW™$.+¦<w‰Jª¥<`Vž†»‘ gQÝ’å{ÞïO`*ûSÒŒ`â—ƒ´¤ÚßÐŒimn+óW—ïÕ¼ð8ÝwH¢ ;óK‹
ìÄðÉ‘Õ‡éÞfõãQuž>,ßˆYë´PÒ±19`uóícþ ëy–q†Ñõ@aƒ%Z->¢²Ú\"? `
-á³6%%ªƒí£0{áû—oJî&‹h‘(‘7‰®#5Ÿš§0-„Š°Œ±óÒã´ŒfXõèëüS<y˜^F+õßÈ¶ã¨IWÚ—b!‡ÔÌrçºp7ÒLY4_B¢Ük˜ôl`›¦5R›í’’hÐKã•Lžeò0dÌÉ±@ü`êX;——äÜ6ƒÁy}?1?¯ÉÕ•Æ®ô6Å=2Ï”¿Œ1æq'Zñ«Mš	Ä™òªžÄw\Ø5AÄUWUaè¥8¬²x}•MPë«›ö·­o‘ƒï>%wŸ<!û_ÿ¤èIÉô·YÆðÛÐö·æ$˜ÞyÛÞ¶˜ò&‡ì:ÀqÜ‘5G?[(¿íÑ[ûÌ†ÉÅ4š#tŽÑŠ9›Ø¦…g€xVˆ|oh@ËÃ„3z*ú×¤š“s–ñ›¯#\Ì/O^#Ë)ÀÈ¡+IT?ãÔ¥–õ³š2ÊŽ4£…¡” ‹HWgS¶ëBÚ)˜]°ô3ëVh€*9¬Q½+÷ž©©aß}+@n@f€FlrE´û%E°/<Þ¯7›‹ä3B;¹m?#­¥el*ça$økò:†ç5Z»¤œõŒÁ•á±Oë?±6K*ÚÍöÚ"Lðk|Wo®ƒÜ[åá›döA:]ŠqÎAc/ÐþcMÜÄ`²)_w0'ü÷U~¹AEº:ü¥ú’—µ6á¦:ˆä¦"¼EÚ"
uä° )ùY|nÑŽ2ÍÃ¶D„[ÜRlaYÊ” -ÙÃÿÑ’Šh’HA1æ@’\&U‡™ˆf¾ Ûê1ì¯³´ÂÜÇXË=Ð®ÑªÖ„†E%}QùžÎÜòøºY€iÚ¼Iu­‚¥~”1gÊ¨j=Lu$M­ªÅhà±KÄ…jŸY„Å,Õ~®UTlä‚ßä“/µ¸ÕÀ$7IöÔºÀ¨½ë"zÔSnŽl±·ë&[¦yÍl?f¢ýD÷„ž0‚Gg¤‡
´:“(c‘Kˆ™êì×MÍÜ0¸…RX_aSƒ
l0›ùn-<ä/tÐÁ©¦ö)/®¬³)Â†oÛÆÁ+´#°®b.Š›å˜%zÝ\’°§ÿpy%,DÃÑù:¼’…ö'Š~äÍÏÌ¾[\ÒÅüÏñ¯²šsd[•[™?8¶;?îj1n»Ù1;n;åˆŒçøNž=qº?”g–Á]¼ô¬™;dû…3ñóP ª	DX6qî&·˜Óý)0Àà2„·³ƒni:(ÇÆãsZ·JÇ7íœmžTÇ‡‘G‹¢kZçXr›'KQÑq	ï
ÆàcßRõ­Ë0K}ìéó”DLG¢
V„´Aúìc–ðú¹ó ²Q…WJ)§°?ƒ$Ô©ÃM¥Ãýí•`P­êÓy„Ûjõ6˜©Võ×‰­ºj#Ôñ@(ÄÕZI„P¿(úBåmÁ=’ÕÃV€ædtyâšÓø˜€Ý€”êSÂ_äãzòìLv¨`%Î,èvVCù’ÚždÊK:ÀoÒ`“dÅ’¨á3w!’gƒCwäÆ`gÃ1ÀäJf¶¼ŸhgÊ6:¨gíDDƒ‰†©O z£áãÇ´ÍYZSÓf
Tùf£«W`£H£ÏöÐç¤ž¿Ù
]$ð!›%ðB‘.ÃL`!k®¡²Ã¬Ä¦±"šå	Sá•êÕ@ŠLé¹&×ºiQ¸š*ÞœÃËëëfºÉdŒ:,8DÍü~$Êâ…¤Oc&-S1oTØùœ³Gá¥–‰]	R@}7”Èžë[õtõ”xŠ=zC<XC±Ë
%ª…q*óê±gøƒvÕ4}´	ØU%þ’oër»ÚÀM½\‰§Šîlèg­¯nøµ±Ez»Çd÷èh÷Ù—Ož=ë‡~ù–|kx:c† ?¥5Å9¤™ÚÜ–¹ý”ìl-ö	zFfâ¤¤K»ÄpNØ[zp+ü94):%ýÃ—ÍW8a	>øáÓæ‡P›£Æç”Äf²¢¦RËÔœ‹áÎâbíŒ–J€YËbpyñ(u_OD»7OK«ë†Þ”£ÕZìTc{LüÀðÊ³Ø†àµžÅjé•¹ÊYU·n	œMÕ¼¯lûR¬“ œ°Fò¸•€mU²µ¦Ám|˜ÔãŒÔ†ÏÊ1nª¹[13FJØhämUÎÙÊql½]U[ìÑ¤™DåYD“îôXÛj€6JHO°ÈP*3§˜tž»Ó "µƒéé4óPp
É;¡m>§H”¡<1‰9À¡ÂCŠj›¯fZ€l»]§¤úp¶ÙÎâ©Žj“žÿÄ	vþÐ¶ûügV€ÛÜ n×y\Z‘0·UA%UßÈ`XÀu‘¨®ž)Mƒóâ;Ã5äLû0Üw—·°øÎJÑz×ÌuQ@ÎíI½›ŠîNL;p=¬Õ­Ô‚VòÞr¡ Ô´	‘Nx+<óM²;›>ÒíŽòÜ×úI)Ã_ºNþcYrÔøß…–Òb,sƒ7+Þ=GÖ6ÓÍìÖ¡öŒNdºäÜÍæ9½zãL£…è®À#ª¨î¹’±*¸{fžá}+1Þ7½Õ|ú€µ9@Öh-ã}jŒUs ¨ÄÉ““ÊSÓ3&>¼'ÆÓ807»ý3˜Ãê^êÝHën*…Šfp'%šæ†€)ékÏ=Ç×¹d"2ªÐŒ=ù˜µ¶jÁ¸JþržRIÌ>6/P©W˜?ºä‡Ò4àt3Q¤ã˜{{K93‹®0}’WÕñ÷uª*…qã €˜Vg-ìy™‘_¶Zã…„êJˆëÌÑ(ú|£"¨Ú7â~öî!þ-?ØDámÌ;´tû×¥÷\æ9®–(ª’ã^ÿ09•`Šï|«ÈÐ¡¬;÷Œq@KrŽ&©¢=*b­r€bÅ)„Ò
n1R,«Õ@ˆÉ^ÅsOåA¯¨œóJ•öag”ÇBm&½æ4´½ò§4$ŸÞ”²Í]^àä&'5&Ž?½i¥Þ šnrÎ“Ë]4¯Â©Bö-ÿ¬­ošû,«V¡1&0–PW¤.>¡§
€ÞŸö´–ÔÕ£=HÅTÚqØI¡OÈ'ªÚpÕ6#Ò©r•ªR@\~áá½‡Ï¾>üòðÉîñó#²Ðûy@¾y|x|ðèùîÑ>©}qôüÙñ’:YT˜°”O·K.üi-™ƒ~CÙã‹×%Òþ´qê¹ˆç` ’-–shjíÎr>/ätû±ˆo—)ÎâÐ¼Ð‚53 çÂárÔ4°Up¯b–ÏèŠò}òÞ®RÄ%ä_éåä%j¥¦Ó'I§	«4å Hk9¬¥@Ÿ*WôÑ˜4`?“ŸñÏŽe˜È,,è
E¹dË£=;¨¿‚:vÚZo¯ÊG‚µ‘Z£Ì%B?#¥¼â¥ˆ0/K:©Ýó¼üuKdKnÑ(@6í ¶™>ZÁk9R˜B9u9†S@­@$øÔªQ
Î¤ƒ-õ4ÍžÛ:·O½*:…g„•Ý¥¹L@ˆ©Ø@ (á^PLœc‚ËÐ·úbÿ‹L|Ç³d–>Ó(ä¯,øŸ€>@¿÷Ö„ln‘ãƒÝ½ÇG¤ÿîõä€ì~½úÊ£Ã'‡É±,4€WóùV$-W€õ·âUAK(×r¤lÐâeáF˜ÑkÝè•<žZ˜aÑBcªÍôûž5²bÐ†óc&AÀt‹Cãq¨ƒ û[++ô½ß˜Œ| 7Ðè»Ã•ñÀ\`ÜNg½µ¾ÚìÖÛëíngó¤ÛZ]û!ê;è§7‚§v°Ó÷Üñƒóàó?ÝÙh.’«"ü¯x–vüYöáY¾0¼12È‘1‚àÉ>Pô$/<÷Ôò}W÷YÖW;›k«ÝÍV§]?Ù07Öá£k´çð8«é¥92NíŸÂâúŽ1ÌyTEIolõmcì5Ÿd­ÙMms½Þ<Ù\í¶7ú«­–1‡Çè$ÃocÃÙCòCc»(£3þ ¹±áÔáøôÍÇÙhv667ÔÖZðÎhmšk@jÝyÐY7óD½1„ÁÞÄj2rê‘í:îÙ4V×UwyÖ»«íÍÕÍµf§~²vÒ=iš'mx3‡çYKÚSòØðs×çpï˜ì¹°5"äYû9Z›ÍîêZ§nœ6[­ÍÓõþ‰µ>‡çXO?ÇáÌ0òØõ­¼çè¹È(Á¤¶åW“eõvsss­Ó]ßèÖ»kÝãä´szÚ±'÷iî°´´'¾hÂõd;ˆz@ž (‘'öÐFÅf®ÁX=+@“=œE
ÿ>¦‡ö‡¹’ü1æ{¸IîÄãuùðüNØ X®ø´| ÍRzqY‰ú+ò,â4CV¥`Œ žQÉ{±²Bö§?ÁãjñÐt.ÈÉ¦Ça¾1¬p®J›s`îY+¢¨8ÍrË“—fycMeá€5à±Xá¶CSÅÃ-úƒ0mü‰W—¡Mñâ22{8>®D›ÑØLcÊkñ(¹‰øø,0üw’Ã|¶ôJn¦cømOü+j‚Sý4h0	Ëê×à·¢„’+¹xŸ}&Ì] vÂïKo`³M¥Ì\»£R†çÔvœ™R<èi·œ(Ì“¢Ø•°3Q¡G6Díê<A¦6â™<Û:ù‡¨q×œ8C&p‰ÿ~ÇL©Bé+«ÍÂº.«jP‹<TG¦›šS7ÝÖ VÏñŸ²7¹›*Ú\¾ñž=zSW;?FüáðŒø^Ÿ®êWÄp|Çø-±š<ÆËä¸TÀêÀ(€VN-Ï³¼®c÷§;#·.>RLo uòý¼ÞdÄ¢ëÌGåäfh  žÉœa]17*` Þ[v¯//ßö¯r='”É+©ÓŽ÷>ßÓ®BDm£«QM«€£Êêi%êÍ‚›À)^Y™Í£’qö“Ì’:ZIy|ùRHä+¡Ë]ÓAqIq-TËõrÉS1w’Nq­Õ‚âZÉýN½ÀÖ¤J‡eù•´ÈZ[`ÅH&3Qáø‚2â˜žO‘ÄYYòli=y¶$ÖXvêÏêh\×9ûÌ7ÝxÝ1ÍŠks1·š@>Ç_ícÖ™G»Ç{É‹£çOŸ>–ùÝs1=wè"³Ë}Ëwn‡üC€üÈúô³ùœ³§áàÂêOÐnfÉ[,“L-Ã«ƒMNNhÇáBúXRÐrì3³˜Šb—æ[L/fF;ÛíÍþR”ïÞÖt.»áò„„@ö<xdÏ6²ºTFÊ~¬áŒ=wjDÕàý}M[¡\åâÛ{ÑhûuÄ¾j‡ÏÐ‡JfgÉú®€KÂK½PôÜ7£7õüØcÖé²ÏJkŒxJhí8ºá#£µê¤QÐ`«µˆ¯? µ©ÙÑ7š)èÜˆï/_ì†{©=µG¢.p·ÑlªÇvkV"Rëök¼³Ðl¨Üb1àµˆbÞU¼Y¿&Œ&·jPÔSúëZ~Üö-¨o4¿bF·‰+Žø*“Ý OœP]%GèŽÐÍ¦uãIn”¤€ëÝÿF€¾ðà°JÞ¨æL?æ
ÏÚ5¥š’Ý¥˜ù¹BÎgàÛPó~âžYf-ð€_U©†iÒŒ1ð»Úkš¤ŽXÌì2I•GNî'5P0´î'õ*ÕA˜lÁ\(-©åwÎK+C2´;;ùÙˆ¬¿Ä-ÌT´Ì†òÔRøuÔ’K+¤•¾½ÁñíÜ8U0&%Ï¤Àb=ýyþláóÂOQuÌ7‚^¢o©Ð¿ð,
pÜ3†˜ùuÕ˜ùd¤|ÖPñð¢‚› 4n¾Ša¸vbŽ°TVäÈ:³ýÀ“Ö=‡'¥àqºm’Ž‰`‡="ÐÀ³ãÂRñ®çø¼‘eÏD^ö~Ò;>xúŠô $”aÖcàQ@–&n£!GÊëvÿR-!BŸËÿ±ë§®c»~å>#Â‚{ÇûõV³Ý!»†g¼E|šoÀóÕèfÑilt—p;aŽãƒ}|î,ÿ  ÿÿì}ýsÇ•à¿Òf¼&¸!@|‘¢hIER7¤è#({}:_4†Ä¬vÅðX•ø*Ñ¹R[ùÁ¥äÊë*¯7Š¤µµ²J?8vÕ•õ¯¨ö/¹~¯?¦g¦g¦)Òâ$¦€AOO¼÷ú}?˜úÇP+“†ÕuÈâÇm kb•òÉ Fþ»µoõÈ/)/ÎP+]<¦ˆÊWþëó#¨~‚¸ôe×W×èk5údµÇAb†ˆ$:¤1ôû6=UÜÞÔ 1zxuôìK¶ÿ Ø®m¼ûQ`dXZi4ÈÒÆú{k+°b›KpçÚÍµµ(W –ršTpvðïÆâõµe WMj2’´s2KTCA5aµ¹$\&$I{êR¼ßƒ?A¿h
59…û±ÓÀ§ ‚ûÈB‚Ôî’H¼ÆÐ'³œ z}Nþ»p„‡h!ÞÔÓvò0"m7‘4—±ò‹ëdku}ekñ*„xÜX&ë‹›¿lÄ8ŽXZfK•Ö1Èj QJ:+uv*Æì8XÀösƒr®kŸ¬»-«C
ï;>ÚjöÚvXt×¡í?¹ÛÄñ)²;ôø¦òð”–G:H±Ø…ËD`’áË˜·>òÂ¬Ø¤(QWx«e{`9Õx1Nn«“úŠ8ìM »›TJpzèŠ	o_o©£x^':DÉ[ZOÄ WV·‡öÉ½ÙwƒN5½¦Z1/%òßv÷pÙž%†­a/QÊæÜE®…ÊMEôCãþÌýLÿmynŸÞzEá`—Jû(Ãúk°zIoý"ØÔ,XÛ¾ÛêÁ¾Šw²oRåÁ¾öåÝ 	(gr™åòxrY®kÝ-R©í¾ó‰7° wð”xÈòa±NÅ(yCáš8!9²ÛøNå	1.ƒ*‰€À”f(ûéHäæöIá:sÿk=Ì‘}êQ42·[¸¸¤³ùTýÌœ%MÄú@èÐœ¥û;•å(ûÃŽo›¡£X^‹nöíÞ$•ˆ&_>üúå£yùðÙË‡/^>|ŒŸ¿$á»ÿ‰?¥w?c¿üï—ÿ†¿ÿÛË‡?Ò[O”‡¿¥·^>ü~’ò?“;;F•„‰ÿ[ä=pfyã&M’<d7%åíöß¸r[Dƒ·GÏw¯„`[!«Xy?¦½½õ³ruvÔ>ª&¨R›…¨xE¤ÉèfZkLCŽE‚ÄÀ)zL¥´(U+RÑ¿¦îº¨åÑÁù_>ü éÃ{$	èïÃ­G¿¥·|Ô.»Í!V¥2Î`^md0‹~è<.ô(¥žj
<IÊ.'Z-«bÀœøÒéá‰Š1.ÇPˆB·ÃOÄ^>ŠïåR‡
»‚Ñ³=Wb9zÀná<º5¼Ó·úPÐ˜EP¡S*†©·Ývq‡ÊmâåA`žÂy_E%˜äÇ¯fóQëHßU¹®cáVB¼IîSZö½W¼U­”»ÝÀÄZlÓo/À·>Ã]>žÀs.|LZn=›ÑÜ¬V˜ÁÂAÉ™Þ-r5†OñÁàHÉl 0R)‘ë+‹Ë³¿²„~”…FÛc!@º.srågóbºÅVu
‚ó’Æ‹-wbšºtó‚ën›fu
W›Ä7V¥‘‘;Ï€Â¹º“àwüm Ê³Ä¸ŠQÂá7Û®ÛiØÈ?â—ØWÚÕ%‰¿®ôÌR·´«Fk¢õ…LÐÇƒ:¬’¢Ë:X­–gû¾nøO¦+`’'%(H-5KtIÌÅæ~ûåÃ§/ýÊ½Þ{ùð9*#óvµ×Ým§cÞ¦ër›}ÎlzHþ—ö÷ðµ÷ÄÞŽû¿ÙõKvkXÚnÁ+&Wºè…ýÍà3_ûhäÒ ØLÁ¨œÁÌ|YõÈwz˜sœù3èÉªqÜS-¶ÿ`LHm˜ü@„L_©dsEÍÐ;¤Û¢7CMX1R$/Q>ã!þ}‚p m§ÔA£Ï@a«Û ž4Ú:$©îÓA»±'TOmÛx`£#%ª)Âµd—)"#>BÖ\ÝóÙ4ŠKuŸB¿ÂÔ&¨vÒ5øÇt·¤I>^½èrxYàjŸ3É¨M°š¸?hº†e¼]ÂYG)ê®ÿÿ†²ÿÿÓ¼µ1Ä˜Lu€üVvã±ò®“øþ´@~½Ø.c¡‡Øoæ¢ŽÁ8]cLÑK“Qú@Ä§	ô òê¤e7]ÈÆ97 hˆvð©HÏ*Ð‘š¢U’	Ä­ßXý_møüW¼ÿºgT2ûûwâS ^é{lÌ`Ù	´ÿÞ‚ýc’œÕk9P‘Ã'ËôhÜW©Õ[¤Ñôœ~à&`Nkë¦;†%Ã5þ9¡ @8µ RpÇêûZýð¼ñ		onÛ–Añô ½£¤L­ ¢M‹À–V›gè|øñ¥¸(!ÝC\ˆ‡`NÎÿÝ$9<Ô*zž!'÷ò>öÚÇ8TÍðª’Ç÷B~ž Ä?Æ»OqÂí†rì3ÉXôÊlò¬~\ìWtnlO:?Mcuù•O"t>:ã~€›r/J€´S[ìù{t<œòÜp_õ«åä	f’ég‰”8L|Iþ‡Þ«ÊjòtŸ
à˜š'Y°»–÷±Ÿwè´µgL­gr‘ëKƒm·µo>”á‘cÝK;ÈT°V¨ÏÁ—îšKÁw‰ÒùÂTÉé5;´_¿Ì8†Ÿ˜nÞ/ùèÄVŸyLšd¶–#Ã<J|JA6%óÔÌpÁy‡ù^œhfæ„ã+Ta% ³·µò ±HB¡2wƒE¸Š=-—€fŽÃ~ÔAé$—‹,Ç=L`8‰ÁèW(¬ûÒ­—Ó:™N\yÝ_“‡ÂeZ#.IÒN˜N•Xòz¼Y6UNÈÉ·|›ÜNƒŠ“—æ4t*qËæSþ4.v9¡'ÁbzD´”)b·þ€GëGôB5¾á×$ÑE,ÜúŒ©sÅœØwìö¯ð¼¾á%:ð‹8$ƒö<•Á ‚©ó¸&Ž­,a°ä—%A¹M9Q#bcíÖœ/ A65d1Q‡`â|bpõ¶ÝÁÀíéùð•&Q÷ó˜„ÍÕ,™¹8¬³\©r÷ ŽI4uïgÍ,U|¡4¨ñEÂÙi ò‡¶¿C€¿—ÆHs}GH!…PŽe–V{wœ]§¹dƒí!oPMÃp®ZÚ…ôÐðf²’¤ÛAËëWT#™HÚ"ãä¹çÆ}2£:r<Âå|';YÛ!]=šNß‚2WÜÑ­C‰¬»ƒZüãXwó<Pfõ¹}Â <wHƒJßc=YŸojµûÉèJŸ3œ—ç¤^('¨SyŒ>,·@‰ûÏ à2ä °ýÉË‡ŸÓnÂžwxpH!cÄ2âIq®={ÚÑºäÞu :TøAóy¹M
&ûÇ¨¶IbÈZÄtƒÌäC	ïÐóSŸT×šúA¦ `itÜÁ©èwüüƒ3î/rˆJž—S1JýáþƒÐÒcÅÎ%|þ,«äÔð¦ÑâGäh­“Ôg+ê,=YmÄ§\%ñZ™#D¸ÝÏÏªcñ9ádèøÂ~´ÊÎHJ¶#O'ÉA5ytéÉJ[ÌTËsÝnîQå”Ïó¨­BhÿêtI³†º¤ú+Ñ%%ò¸!UóØþ’1,(#?ú?ŒÝâàÐêˆl…ÉõD^Pv‚iˆ ¤œ´ÎBÑÖ	ÕVÓŠ­Öc%,õ©tJü®Ýr†]ýVý¹^Ff¬‹º,ø_a‘äñò…Ž’ÁRßá“*ö {ä;ìê	Š~³ÀXdVÇŠlbô[äÝ!úþ|T>19tFÎ¡l­¯¼|ô¨¤UQãhË—á4pÏ_­@iüè?^>zHð—bÖ<Òì1ÿ'L½¬.É#E¢yÀdâïqø³PýPrðI°.~`QâwžažDW†§r÷•ÝýŠýN÷çU…	hÛíß°;58“ÜÄîÅP!þDÐ=ó¿ÇÔWQ2ùþÎ<¨¾Ä®žË»ÿ)<˜¿Ÿ–*¯§Êèa6ÎÊ5$$qhzëöZÎ¬³¡È?aÐ*4pWÝÌ¿Èü×‘²ýÌ¿%ÿQbƒþ#Nå÷ d…õÍ)¹¸*tOnÙs¶bˆLÐä›Í}üþT]ô'Â3k^žáê[hþ×²Ë/¹‘~,à7ÜRxpŠ¾û#.KCÐù]s]8æmÿ¹~_Y!½üÿP`Ï·À?gf.RH¢‚÷%Á §l¯Û9‘4ì¦g,oŸ˜¨ëv» –³§~ÚýLÕ<ªð-$¢‰#SeU»˜i/þ^ñKúé(íyú‡£ëì[ØÑ¹Ê>uá²}6ïGü™Ÿ#;fØqü©<#˜[*hv„08õäËˆ/tÇ÷Éb§ã6Ù÷¥¶å™ÄÊãªŸëëÏ²¾žÁÚ7J˜Ê Y_‘Æ>Ñ ªú)_³šÃÎ`_µ_¿²§÷“˜1l9(SuÔâ‹>—
ÏÈ4€wÀIZã\œâmû)Îè{.£ÀÆH_Ê)®º;¬öœÝ¦³n`‡53 ÐóvÿuÒþÃ|OTõ¯ÍŠ3+‡ÂÓeÝÍ‡u$EvXÉ%”åÚ$èkÖ¥©$Ø¸‘4ë¹G•ßïô˜•÷aÏU÷zÞ7¤zJä²Ø_éú¥ÔÀdhóE¡]Gå‹yÚGHu¬1Vœkö3ZŸkö“.~7ÙÑ3IÇŸ­f`©Üt¥žÆM K®g“:_Di ÐßèQJ¢ä1¢¨m¦þôòÑ7fê¹zLÿúûâ~Ÿ\F
+ƒU50]ØOTÛ€ 5Â*À•Øl7¿Æ½	ãAÒ¨Q9¬B©6†i" _p]1£·ÏwŒŽ†âC–‰ lQBÝ§8¦£¾§º &z*«¦˜ÿÄ¥y.l|·ØžÀ«˜pØ~._s¤õýdÔ÷c¾Ñ~/Øð¿æ —ÏH4ÖS1„žßJÓÁ}q÷©t¼­9wÊ„'”ð4è°~þ5²4¿Cáþ…¦ø‚>ðÔ;7d¼ú,š¸â_º–«žúÜð2˜§¹AêÏ	ì%m>NMvì„”æ4Ü.RFvòÚ±<å+›ëäýÕ•ÈÆ&Ùº¾B–W¶Xõ÷W6ñ‡÷ß]Ñg÷µ²/|ÿH‰öŽ„l×o$¦O.""S­Ó)4Èêå•$k«-(žýÁFqicíæúr}õÝëÅk«Ë+k«[’µÅ7nnÑÙ$ô™Z.–!¼mõZ»aÝ±ÅxÉeR°È&e¥k®×]¹cCzæŒRv	îÓ–ËöŽ5ì
©ÅŒœRx£gï‰—Â{0\¸4ðœ.Ä\²TãÚ,äj'T\€´i¢ŸÕÖTF¥+ßˆÆ~†ƒQëNéëœîaV­R©4˜Îh] )ÓÏê Ê/^\/Úü˜Ù–f9‹¢ÏËŸ ü øšÕ¥Ýké;ä?°îøƒñaÁÍàèý¬§)sBAP?šà76 à{V¯{6‚Ö®¸ô²Åë[~Ïêºeû˜„Šgñ+?¦vsH¶¾È@piê´û-T‡ ÑC5äÖÒAçaVÍ3@®(Î°ôÂ©uì‰Ý¡rx:f(^&··ŠoÀ¦•zî=$n§Œ=MçÄ)\;­þ®Ÿ.OB"ÁbùB±\™2Ëþ*³™ý>Ë1U³Ç”Ÿ«³'ƒÆÙ8;ÀnÑc>Oÿ(?hz6’úˆƒ ;e:HåIgf(_á3­k7¥mr#¼z…tŒeX8™±åÕ BÒÛ)•Õ¥Ä“¬†&oö›.]îÝŒö*Ègõ­ rŒ† tr2m#S¶ù0…/K­Ã®}@…tv”¯B?ÀnâæY!Éí»t¦ B¹3œ«•ÓkÞVfÃµZújA_j³gŸ£Tæ©Y«}\FÞmË7ÓqÄ™_#!W“7Ñ]áKEmùT*`¿CÍê#ÅÖäâî‚ù4À˜&§ÌÆ´ ÓcTÛý–½'1È$:ÆoqtŽm±Õ"”h©£3ÜxJ˜D-!,‰³€ç/AÓÔBDt±ÿˆ‹ÇM IjYEQýD.šŸª
ùs©z€*t¦$
ihÏï¨ŠÙpr˜ Â½	¤­fsèYX4ÅƒX¢œ¨fÆ±:>Ù¶;îÔ¥s˜«ŠókúÙ¡d¾M;Ê–ÒÈ±¸L Æ´¬]V+8¥‰Ûk·»ÎàòA\Wp¨óð4q—Äêr€(ðèHÕòÔQ'‰•Ô5õmÆi&ÌÎÆ]â¸£7ŒrŠü}  f+e˜¼Ý°Ú;mêôúÃ¬öûœ¶dbËãÕèß±:Cû²^ì4êÀí-Q Ý¥}Ø¼ÌM”…Ìrá€ì22ŽTVÃ¸÷Ž‚²>†¦÷>…»M)ªí]Öíõ·H •äSUóÀ¤¢ÐJ?0ðB1‡!À.í–¦É:e“P€URr*ª5EÁÇ½l«þŽÛ¤Ü+¿Tâ·wÕrQ’áˆz„Í9áÚQîp€.×XQÎ`F&•Ðr¤­o0
<ó!•^/rô;q.ÊÀ¤¯ÐÊ\1ò(ža‡ñ¿b•ºf‚Rñ{´![ÉWO®z(ÙÁ¢xù€¢FÙ»Ö]Ú¼bÚ<‚{œä0¤Œ
SÅ)s²xšˆM4‹Â©";Ë4þzQ'"ñ#²Þe˜É[¹1vs³<Û2£"ž»ç_>¨	k¥Ëq"oH·s\,MŠ‹âå<Í}ÅA¤úû
§Ã]mHèD»ËÝS=ð´›ÎŽÓ„ÀoØ„¹ùÄõHÓíb©2xæì¥,RÚ?* ¾*²´e7Û=§	ÕW-Ïêú¤°î@!ÚŽã°Ìz³c[=ÒÁ*¬£‹‹z’´,¿m·bJµ>Ô“T®fFå@_—@ä¸j,ÎKîf¥£ÓînRÙDW A2X#½¥gó%¤?P}|­°gÏDèÿ‹p`cßØ]¶W6¸8’LÓº4&™xxÕr¨?Ù…¬9Ë»Ü@·Š‘]Îò”ØCÚi¤x•=	FGv \7¿U2|ÏcÀÊäðT2>#±9sd1ÂÙÇìænõ£}Âº9õ,Ÿ’«}óÃ.í9ÁËIdŸá€Òã”€áÊéæ2.“íÒ„0Béƒy¢æB &V‡—fXO#¿šåNOÌ(}f_(iy¾õ£¿|Éíö;”F¶Rr7r6F¾|,ÿ(™E<:ŸÜ„åËl¯}ü‚³“ð÷$ÈN(;e¿ …¿c"Å»ï-*Ëw‹p¢ŽÂx^ùÕp¡öÁP—€íAý`¬}€+žK[3óˆ8nÂ÷ÑY+×Y"îFEëó{¿rnÎ`N‚×ŒTe¥?_SEœÀ=Ðœ4%3‚zW´à…7Ï¨J¸Ž“tðD#¯|#ð
ÿÏÑ7@_HÅÈµV­Ÿ(æ&¸|7ÞJ×ºs¬]ã%Ê£D_:æB¹Fv ÕÑ¶¢
:?³Ê×—¶‡ƒA†3­¸:ø8j³½ˆŒ´XQTÅÂ°íÞ±½v«RÛ©U>b°¡hƒÃ–ˆÂàÒz¾ëû®ƒ‹Áýkðxl¥D-reá*¥Y“‰Âêÿë7ÿž«zužrÛ£úÂuÃßcCfãÇmsE–(ÍçÄÇ.½—aÏÇgJ«¿ÄÇžW#ŒÌ4ó›éî]šaxgÄ4h¶Ù8?JüÎ1¥¶ô`ê8Í/dËE¯Ñ]b}äsr_f.ïáËÔ>2Pswøðeì{_.Wùð•Çq>|åp£_æNõá+ÍÅ>ÒÒ”ãQN-yrÊ#KÃæÌ‰o!e†þÌjº×ó#Ç–æ%Ÿæ‘›â…Hv·5<;Æ.õÊnkÀgñW—fÀ“Ö(;µaÃ@|×°…98Øpaõœél `n¶íÁžm÷ôY7’ûÛF6a³PŠã¦Èé	wtgùÈYúî*²æøfù]ÍB	F	&¯e\Ià 	3ž‡rÓ„ŒS‰ñ¡%†OXR™‘és±®eî5  Œ@+{G?FÅ‰² >úB0¿”¡GµšVËî:MÒuè¯”ÈØ†Åcr¶˜ŠrQÿ‡¸¬Š‚ˆƒ+@ DF¿ÙrÔ#"LD;Š}3
i ÁÚ0ªH„.òœy‡Z˜à¡!¡Mäé£KjÆÍ†AD€ÄN‡RÀ»¦yNÒS%c6d‘TÉfrpŽÄ¤Ñ\ÈI¤UëXOË«­hãòdrq,x’Âe5#“ì<K$ÛXË“í5á]5Mÿõ”LµYáá€|	i“†˜±•Ùäáê·U_í"sY9VËì…LAeþBÓ9²³LÀê$(A¡(SÜ'üƒ&ùõˆ5=]âŠ„áÔš&¥Ðws‰·,Y‚ãs	w²cê’¡ ¤aÖL§e*Ç‡/ W9$1L{ÌÇt˜çÁ`wnïÒc­¯‘tÞÌ#ž“ÈRlT‡3³ˆƒRó;T`¥Ç/=UÍåG*Þ6W…çITŠ¦Ú5c»"É|U©è¥ç:>RqÒ‡#'gîÙqòsRÉ5ZÌÝšsM‚H¼·r;ï+¯NZ(3W¥£$ÛZnÛ¼Òg.­[p¢®ˆ&Î·„<ZŽÞ9Œ@âŠ2ÅRš‹ˆz+#Œ°Â«eè@fÍ”"ÎÚïwó/ÌÀÀÉ¦9Ú?Ù4ŸáÈ«JD¥¨'˜Ä“:KòFŸJÓtnw{\nçLwœ†°‹Qcó0ÎàÊ£©‰¿QÑÉ¥d^Ky{\æ¦fýbY‹»ÖÝâ^ñVµÎÚyÃä™– 0 ÕMn|ÔN)?ìçH™*®)0iËÂÕ"7bÊq¸2ÓŽ‡Cð6åˆï‰Tá*œôY$+7ZŒ¶¼ysçÈáÉá€œã:ÐRËGÄK©|©Ãó I>ò‘‰…$\µZ»æ~0ü}F+•—ˆ¨|n;=ô<Pýd.Æõ?` #(ÓTMŽÐùääw	˜õ†a$÷ÛÎMŒYŽ*¥Äwâú¨üoYˆ8pôqÌÛ¡-Œ_”Ñâ÷‡
[à +{gß”îÙÜýSâhµFXªB¨¤Æ¤lWºÿ~4¤ÁÜ¨/®ÐËs>—Îçq£`OŒ@Ãòxî(¯:.ÉÅØÅ%7¨Ò¹¾OÙÝÉ÷®6sŸo8âŸ®\”WÆÕ>E„òÂ ¼ñ>3¤Ì1c¥BæW”%);zT°uiíN5j;øLÐcìt‘dg7Ão+’óÂ@~¦øÒÊ~ÈØÐF$Ýƒ¿¦†JoyÜ}Ôõ%¯í,#\^.­sÀNsÿ P‡Gñ
.æ3$%ò<>.ÁÅœˆ$·=Z'ŠO‘8X•è€\n;Á%ý°KÕmyÄ…'’röÖ‘ê”„E²ÖŽ8>Åc	{gÖiÈ›)¦KÁÑŽÐ¯¹¯“òÌ82•7üsÄ¬þAŠIt°<®ÃÊÿx?ý ‚så$¯ôØ1ÍÏÜEW¹vJ©edˆ×î˜‚ò	tÊ;=NôAà_³LšG^èK3EJ:ýñåÃ{ÆéT¥£ÇS^í»øùÈç2™'óÒyü‹÷l²ï‰?äö¬Þ Òj¶Ø&b)?™»úÉ©¬zIWrˆ§CûVJE¼ØA³²ï']štÜlB‘¬ü2=+Ò¥-š¡šrG]°ñ8EÇzã×(Óák4÷éð5²3uøÑµ:6–#8Z‡¯ÑÝ®Ã×ÈNØákT—ìð5
Ó‚ÏÂ ½ZöHK‚®ˆŸ‘ÇÊy®o§3FØ"g„íÏk´åY~»z¼Q¾§F27åhm\	×	4_ÆµreÜ¬fÇ^b-qþPMûSšå6\l¬q}ƒ×E›ÑL+lµmâ·Ý=²Ý±Z6ü¨w¬Ö;jå±«Äø¬í8½V¤ WR-µˆÀÊbÐ·(!F€I©WÁFC	e\l|éù¨6ù­[œ1údß[%¿šõÔÂ’à¼^ˆš•	u”ØÓ54„ëÏœ±ëˆ>P‘Ò¸=gÐ&Û`d¤"wD	’M“mºâwð³G‡~Nî ½~=3âNÔ8” e\…4¼æ“¤øBû}v)³PPc•{$
DÚ7Þs½Õ·^3CÒ¥vHÏ{¡ëŸ»m¢_oÅÂK—0vr§jû{ët˜NAñ˜2^¬™víªq”-[¹<Ò™+Ø¼3[PØyš…Ò°êÃ¬Dô¿ñzÄ"ñ7ÓŠ±Ô”yéãhVµ*õŸÕ*Ô$^ìûså÷/‰Râõ…Lƒ)y„¦ð„± ûœ&Â)«FºV
	6ˆÎ‚æÖ`@e#ˆ¤Tt×
¯þ4¢®g:½‘;-(|NYD ßf›Šef‘%ãª®a¨7ÊaDY;{
ºÑ¤á`ÑÙ¨‹ú‘bE¨ÈAòƒ,†Û =z±¸ÉS]§,ux ’Fe¾lÄ[³$:<ŒFéÉÒéßˆBè÷ˆHãÉ„ª«èÿäªQ|¦K&,½iHickqkµ±µºDÙÁ›ëë‹›’MÊæåbU¼º-¥ŠW÷6»¢v,Qp®èÔY5:U^&åi¢ƒhC²=ø£€÷hasÙÉ<rúÁ_ºéÛ€Zêhçè`çÌÀÙ0¨Ð4„vŒl”Çü§õ¼ÔSä‡¾LT5ãç¿Òû,lâx‡,Q¢ï@zßœ9Jšð@:ÆùPH;Ùå<üÁ°…IË¹
ÙG‚®sƒšJüBfáæ`öÌâÕG‰‹<Õ˜JeKg×•ˆÊ¿^ˆ©’øÇ‚¨K 9·,ïuÃÕÇâüû,ë÷£àù‚ ãy[•8mß<Òºù¦þ‰2=¯
sUõ€IärR'`ÙÎ±5[Ó]cþ®ãGÕFÛ±;­×Q£[TØcAD½â2N«½;Î®Ó±®÷ª°2Pµ™—[LwLhÐ$“ßº¾BÿÛ\Y!ë‹ÿ°<9YZÜ\nÒXYÚZÝ¸Ñ ›+ÿí&ýie™\ý¸ÙXÙ<:·ª¹kÊ­güSª”¨€qsyåÆÓ;¿·¹Ò€/ë++[ôÛ*ýüÜEs¶ÿÅÑYBúš°þ2¢£°å,Ybšq[
êñ”†žÑq|Òµª…,#ô"ÓDfÚÍéØ[´{XnlçÊa§ÊßÇïjéä£G¥l¹#QÇˆê—H(nH¡„,š«FÛ¶Q`˜¯Ç8h†^r6—7J‰à£C2U™Ï™þ$r&EÖ<PF>ÄâÀ2óSìý{Þ–».½àZÍOÑÙè_ðÞ3lø@)ÅÃ3½PÃQ¤×;Ó÷ü‰Žuÿ„SäC|&ƒ?Sž…»_½ç·D´Îê»°j¡L9û­Ô%Ñ)²¾á9“b£ÑÀ›ÃœÏìÏXL×ÅÊ„H†;	i“ìž¥AÍÊôµTÈÙ§EZ–ÓÙ«i›”’¦™Å'¬ž¿PÑƒƒ«q=zÒ&7C¨ý ÙB4dZ2³áS¤<ùŠš´&{•«ÕŸNò ªÔd|üù³Sóý°
X:ë;YþÂ€T•ù>|®-èÎË:ma‚g²Cºw•ŠDr‹ï¾† 6Jfë‚-Ôó‹‰ýFkW%uÛŠ{ÈìÅ³o(€HOwÀpAÖ·U¡K(y7JÆÇ#Ô*Â$'®ðG/„ýTÊ¢ÇJùDŠú5=MhÒÍVÏpšW cZ²äR°_âòAê†z>G^£+ŠkmzFÓÓ{Ÿ"›øxd~¯½ï;MzTòGîpÝÐÁYìTùräŽWz»ÇoO\áŽÜáU
²kâ
û÷”Ð­10¨)
bf†lyÎî.Å»÷5}Ï³ÑqfÝmYÓ.6ò´‡}—P€¡l*ER÷»{>™¨Ô$iQ\W£Î™Y³f{ ±"—e%JV:èøpuµU˜DöºˆÍ‹Þ¾¨¼ÜÐ{üæBï4=VjÂŽL}6‰Ý¡gé›èºß°À@Fv¬NÖ´:¶7Ð§ç×É=Ÿ*¥Y¿bidD®ØG¿ebÖçø#øK‹²Ål¨¸Ì%ž=§×r÷àWc/rþ>o¼„­Œ<Å5¥R2^ÌV­/F(iuéŠõìCËˆh!òÛÞèÊ§dWTÏ+iá‰'E+´Éý™ò¨¯M]¿AS}ßLµ}Ï½»/|A.at²!t¬}áˆØoV Æ˜®;­ËtÍ„sQwÖiµl£8»‘ÎF³qÈKô-Ê……ˆö?moŸÉº®W˜,í8wíÖä¨½¾µ¾Æ	ºÂS"¸æbb1¶ôƒ6E±Ýv aÙ´­æ€ŸG2ç˜BGsâDËiýÏìíùÈŒêP¦L\4ã+ Â«%fƒØÜ¸¹µzŒ,[›«ÿ(ë‹7ÀþÜq*lÉ.ã³@è]2N¿âq²"ê¸‹g	ü<°“¥0å±¯¡‰!9@9,tÿò´fEG¸q<ì¹"Ú>Pü[þ4Í-rKž†* ³‹t|¯—Ï™òT¦*x"ì²½µ38¡­ñÞþ½ðJåŽ¨Ð@ò,0‚Œ×°Éd*t·›F×kúOõDÜý}²Û”÷eE…ºpc·pê.‘_Úv_©¹0Ä
]-ÒbîàôùýS§ú7PüC®Ðv±6Gd9},' `~ÊªM&äÁ„éÁ½iâ ‹cšãçŒ¶ÃØQë	‘gy>Â	¢RyÍÚO	‡ÄXp¯ä3U]?¥ƒŒx‘žëu­x• ôr¾#Çñ`ZØRçŽ†Ä°l^\MK©ùv±t¬qyu=Œ93Gk”V…hÓ})Cý ¨%R=^¢å†+‚÷è¿{>e©}g·g·Ì*¯àB˜æn50=KÊ°Pôãú‘tN¼“<
'Ý{§´£É£V:²¶ƒ³šsjü‹Â~žë;¢ÈÅß nÑ„±r¾Å5²
{:^E‡¹¨X+‘­•Å¥ë+›dyµAÅÄ«7ÁýŽ,]_ÜÜ"3LŽ\¾¹õ!¿s.4ž
¡1Ésx|"£Î5øôŒÿQÒo
©%5RÑ“¢Ã5«9ìö	zÿ.A¼äk(>jennO‹åb`4Dö	clÐØÀ©&Ó?gŠõÛóDÒQáYˆžAü!§¾!‰4Q¸ŒÆæ†8°@d¯Œ¸Ž1¼”q)b(î°®hpr v„·9œ¹>ä˜"q©0	Y¹ JÁÂúþðú„BÁPq¢G±°5.±0ŸÐ'§WÓËY½F{E¥Ò¤ƒ\i¥9Ô*ñì7ò¥(u“–!\R¾ÏsÝn~	7_"Ÿ\uO¤dÜ’±qŒã‹cñ gM(Žú?"¹þ‘F¢°£Dåœ‹Â#ˆÂ†Ž&	³>òÂš·Né†r¢b°à¥)˜Ýš;‚7Gº“¨Ñ_ÆÖç—dµO^6[[þðÆâúê7 ®Cx×µÍu²¾±|sm¥AnÞX¦r4ÄªùÆÆ°V©F¬ñ4nêmP†¸IÞ’Fáü’¼ZO}n,õÔGÜZ%}DasyKF…?`€5¦iÂß¢¶øÏq|YlÉØp¸âˆˆÀñã.‹ÎYð1dvÊ™Û)*Õ}‰¹x¨ÆûÄlXý÷"dã¾Þ¦É–ý·âÝ4‹ßïÛ®ƒ¢—ÓcôÊï¸–Q®I©»‹y—@^›˜ûD@ÏþØK£çÆ™M©òlt¡Í·»NÜãz$õ˜”àLU^1ÿ~Ç™àÝßïÄü!\¿:ì×O¶ klNïþKN¯?4uíg¹ÐaB¦é}ÊfØm:]Û»<a—vKäº³¼xoSb¾fm›vÅ£
zö§gZ;ÑEÜõ(“ˆH©T‚oÓ„¿e„ƒÈ¡©Ì£åà šKê("x”€8²¾Í8¤ÀlÍ˜+c5áiÃ,3B¤l„DÙÇQ ”P¬?^haÎðs€ëì"€Þ™‰¥Ýpº”#£\Ái?B*å:ÝÅuR$å
||oýhØnOÇŒ=ðŠsìa×ÙÅžÔÄû`p~\FzÓu»§§`Œ¤Z6Ðß°KH¨ù>^D‚Wœ#»Î–âS¾ëÙwÈ´ý	øóà¶ÄÈ1™ŸãÏB¯÷ƒ”Y.øÈû¥ñ'²
y I¿Áô~‚±›¼ -ôÞ¡£%;àmà¿aCÆrÇ/vL–Bùð%ö˜.!S¬7‡žg÷<1>ôaœX?|ñäøæ…€Š? ¶@nÑ‡•‘O¤aˆš&NkÜÞ,¾y l}©çî¦o“ÃßxhZàÂ¬¦˜”…š»EÞL’s™õ\xRÜ‘ŠMÅ)­é.IAØ¼vP+g­!Æ)Mj˜<ã.ÆÓ>x&
ãçØÙ2ÉÏÂŠ¡W‚ù¢ã&7†Í¦íûëþ®Ž\…4ªŒB¥j`¿Ç,CÏ#åÝ"zØ)T‰ûFÀ¥pòÙÐàTÜ—°hLÓèA„ }dôèŒ''§¦I­\.·i,™u­”ãÑJéæ1múYà²²§Ç fâÍÉ*~Å<’4)|¬;¶Fo”KÜ^›UiÙ‘Î›à¢¹¸¶¶±´ˆþ›çÖ“·îDã4.mZOÅÒ€žÒQÉ=ŠîˆgÝÌ“f¹yª¿–¥ï_(“\Üñ>£Þ©~„šEïtXœ±Œ,Þb7ôK T6(cAÛìì×½sËNÖóãV hPLŸ‚MÍº&Ðiw-¯&!Wò¦@¬|eÊ1Å{nTÑÞ\`BÈPç•nJ|QIËÝ·m^xÌ†›Wà.²¼¸¼‘ŒOæµ ,fª¨r¸æ–ZQV4ªÉÈÓMËbk±Ú™rÅÞ‘KžÛ±Œ"ðcüŠCó2¹Æ5.µI¶2”.ÈÏE’lÉDÔFI¶FÉ¦eì!Îü¤ÃûbQº&d_,ûéSKm×õíÐ9J<Ì›Oê @"ô¦_ózó.ÄœTL<¼|Ì;>Sí]ž¼XgWÉ:þ“¬“Ýqš­“òüƒiRC¡Ïí’ºëè@O¤U=ð¯·­,Š“³e_©•«G@¤1WRéÜ²\gÓ²¢ãÙ…i%DOÀ®òµ8¯
ç;Æôhø ]ü›AfêI¦OWX‚·F/FÆ,€ß£…åºð¨xÕ&š-µÔðÑl4¬³i¥acì4<¹‘fù4i¸¾…§ÆqÔ  D«L’©s°Ä›q6)ŸGRsÓÝËmŠQÕU05ìX_Œ#¯õf­¢.Åøò®ÐÓíGL/ÂÎ®íEøGb’¤å%ˆùÏcxaO½Z»K4Ý¦®&gÛo¨Ïi„1h’Ú«Îc2Nž_ÔGÂåSæ£ºYNKˆ{¦@ÝÌe	-Yºe»×´úþÓÅÌ("žÄÔ$£¨&_¨®úrÛÝÃ(-Ì+¨yž§³˜ÀÌáp‹éˆc‘)xŽ>¦äq" 2c •HN§
SÚŸ´"Å%ÍhÃØ½8uÃí-k›!&|ÿ•XR"NæÿÉj¨€{²y}nž•_DhòR¦h´¡\ŒvNÈ¸Ln+“Ó¤ÇNÌkŽGßÏM’Cý1(«­;-Ã‡jê» ´:Lóå×'XQ²g‰Uìe‰Ü
/N´}Æ-©K$\42¦º¤®{f>û™Zô™ÙÏÔ£ÏÌå_OŸŠt-ƒM]Fq1xgƒ=J³FÚ(^?u5û©¥øSKyf83CX¡á5â“®5`	Õ!¿~Ó£â»çX‰‹ƒ­í–pSã(¾bV ^wÙK–Œ<^Çî ¯ßW[H¼À¹iïê‰”ö&¤¯Ç4Î¯Yi,p÷³<›á	®žŸ2*ðDÐY¢’i„Æ‚÷KwÍÝ³½%*·¦Jžê¢Â$ëžîåÔJôDí&‡²Á…_U’Á˜Þ‚Í•EŽ¾´äôš!eùáyO¾4õ’0„¤íYjÛ”KähÆ *e
¼
)üVdØjDá§‘Ò6Ç°¹¤­Â,%¬¡å¥ßÃcÕu/¯SXíØ ²2ÎßºƒÒ¿búñ²Oƒ—ÇÅUÚš.V’
LU^‚ÅX>)ª)»ÄÓü,Û;Ö°“XUV|\ ÊËšªàwUâ¬±YC¥‹ÍÕgæ1—jr€‡,­o²>ÊïÛMg‡ÊrLØG}w¾’"Ù¥©4üXM»å g.6¯•¼bTnbv^JyLÒ”Ð0âQ´Yj¬à_´&"•öJ£»ÑQÐ­HÖN”J%/Y;À´aIk½n¼ŸÜ–oÄ’Û
½ ¾NÞ˜YLÑZð§™V$¯ÉÏ1ÇÖàØ“[3mHÐÔ"I|6;/ÙVRaÝäi™I@HvoÄ¦’¢Ž2S§˜e>gò2¦Q„{š¨^¡w?Á*†Àõ&–{+?™—ZU¸$"cFÝ8‰¨ÌK©g'Uo`Ä•þŒIÜû<iƒÇNF"àë°ûÈCh!Î%?"Ùˆ…û’‚ìðZÐœžçh®¿ò y
2&’é[Ò¼Çaé#3:±ØjE©Ä„ŽDL0mwFNˆtÅA>”1CO=è<ÙÔÅÉÖÒâd^ëd*¢?´)õØ´}¨O6Ü.§¬mEl†pô¸ú÷Dšî&ÃE£ö€†]ó½7lð_Ð†s˜<øP`6J¹’òÈJ„ñ(ôè&%7_õ‘Mæí7)5Þ±(­×3×{AÖ+Þ cšÔ“ôñ‡)úÆªÃŒ#¬º·€Î
îNL¦¾Uþ(eØºõ–ÎÐ(L²”û¦p	­÷RV€oyàS>4ÜT=7†Mý2rÚÀKðRÍÞóeÂ#» hà{»J¦v#eÏAf ]ï8^7F€oÆc™Ûÿ…´É³2ÒŸ‹âì
]¥'„/Ïc.ì(Oñî¿2ý’âçHÙïÉ,mß¹MéòíEÏ&ûîN–Ø³zÓÒÂåA=£Û<¿r¸êèÞ¹"QfŠ=ª~
%Ÿ7èÒQl1;ZÙjYpÿ¤oýš›†‹‰ÕeËžf­L¸­“[q*NŠøš›ÜóGRH¾þ™„s;Çaï8H?ô>&z’Ê ­õ5rÃ8M›gëgê!/ƒÂ`[‘Ÿ—”ù)Õô>ÀŠ˜´=/éöíè4™üÕ6…Ï“¦Œj ¥‡©TíG†*xÙXN‡B±ï°¨Lb t11(U
¡#Õeõ%ïÞ‚ŸƒØ„(\Êô¯RÖýQIÊÂËDi0PûŠÀ^$ô^ÌmêQQ¸N=¤÷>™§ýT|8pë(Šw¡×Þó¯º°‘[A¤ Òí,º4ð’­•—µß‘Áz¤Ò¿K|·CWñgÍíÖ¬]y›ô™•þV¥?‚+ëÛÜm¡ãìR—%B}›ù,ìX]§CÅÒ®ÛsÑ‘–ßß³Ý6=ŠÁáõm‚^
ägõ³³sßž¸òæAÏè‚óóÊT‰¾±ÆõB•"MyrêðÒÌ 5æiÌÂ4R†VÞ©\¨Z84QCiÛ»Â`ó—±ˆ,ç×TÄ…`»àÙ¹ú…úüv¤{–mYv¸/²£ÓÜR=–CÓh9~¿ªôCŽŒz¾\VÖ}Ky>ñ:¾ëÍƒƒiùõ+É6*	Ü Äò.:ÍE/;•Ù‹Ê2Á*ÍÁ{¸+gµœ¡¿@`2D®‡ÓC/[¾,]ËÛuzÅÛgí&®0eŠ2u¸‘9õã‚åD”ËvAÝÊŠ]½XÛæ;‡9Ÿ^Ù¸´ ¦ÛÅòNk§Î‡ÌóÊ'™þ–@ùnO•þÉuzŒ÷Ð¶Pá’L£½ÆÜB"mS*²|mÛJY]X_HXyecgÇi:à¼@·d`Aaã¢N¥Dg‡íS¶+Ý¥æN·ïz2ô:…Éö`Ð÷ff`süÒ®ëîvl«ïø¥¦Ûiú~õ†m—Waöèæý‚rhoÏÒÿæè _°—Ëå·8]ö÷¬~–ßÞ¶ÛÚ'a|žÄwPžÉ·z~Ñ·=gG®zY¥”µ ƒ×Ûñ¸Íá­Rš};ÃG¹D×›’…¦¬‹|@ÔW¨°ŒKCR*Hg BÆžÓ´)¸Ï–Ù '¤L RFæ€x¯ºÑ·’–;X‰©6«Snf¼ ß£C`Ûï ³­)CˆÐÙ¦Z¦ÜÄáõ]æ½H9&œäîØ™££ò–ëvŠw×-*&ŽØYR«j^9¢ñœ¸›½q.üŠê\Œ¸¨£gr»9AD—MPt.a¿o{MË§“¦¢#Àœd¸{åÒ¬ÁNñÑÑCH3@¶×†K‡ŽžB`†?+r´b0Ì
`rŽY‹5äß1(Fqº¡¸âÛ .DMƒ	é¥Àî•yylN¾Ä‘ìn‘¥Î ¬:˜éín[…ò4þ¯TžŸÊ\& ûEÌ ¬|›%@ +åG1K ¼¼ºã‘ÊEÊ]‹Ž¾ZÖÀ|­,—G]W¥#¢ó;ÖNS=ÜqÅ«‰„EÃ ØU{~§l6w4M*s‡oeè˜)Zà©Ix•œ0pŽP(KËò© •0ôÈ›m§Ó’dWv1Xf]±ØÀƒtÞR£ÞXHÚAT^Ñ°Vé½1&ã€ðÓ©R.ÿ\<ÚwÇêû^Ä§0¦Tõ`FXùZª™ˆ0hÃb'ƒ£Z—k2‰®Õê•ÙÙTŒÉ'qB}!‘ÙÍØÍ×àÁ¥®ì…rè”2C|/B¬Ï)Ú½ÖÛñÃ ë8qv‹@‘Xg›g|8ÌT«‰:Á`ó±}³þ‚Ç}>þêîYŒ©ÏîâÌ¨„ ²JåÙ“¢Â?2z¡ðƒã2{•d{“Þ}Ú¯TœM—#.Í¤Ë6—`IS}y"²na×ê“ÑõÉŒØVf¼®IŽ«  Úå‰tâÊýæßKß´+‘î?!—}oP§é¿ÃÙ<P¯¬ôÐg£±usyåÆVƒ,-n®@áš•5¨³±±†U.+oïG^.xHÝû)Dy¶ïó—C‰ŸŽõ±ßÞ·¦É/-¯gõÛÃŽ3M–(Š¬]··;iV\MÝ•Gœ¸kWo°$h[«ë+[‹W×VŒÂ‘Í)/–\—a¢³|‰xÿ@š'®„`(àètÁ Šâ¡ŒµÄS6Ghâ-â‘%t;q%Wâhy¤iP  á-kÐÕru.ßhM›Ó~°˜‡·wÛ2Ø•˜ž†B7yO‡S¯l×Þ£Ç„ƒlðFö„þaØÙ'•¹irL[gÖ9Tƒ7²tlAË›H¤K±Äü°FÝÍÄ•ÆÚ¥™A;w'*‡¥B%U©³~Ñõû-²lí§:Rî­…V»·DuPTô1Þy6^F±°V’¤þ*¬?ômša™Ln¸¦=&«z#­Ì äÒ ‹cà6·ÏÑ#ñ6ÀèÉA0§¨rybVbhDu©c•MMŠÝE+Yð?º–7\µÄ•/=Zè_1h;>áw|Š‡ñªÔqAo›Äá-mf‚Â*cBÑ8Ïâ¾ØŠè:+š¹˜˜ß
£ö…ÍÊi­7fV6‹76¶V—VŠ@"g*åºa9Òøx„ð*ÆS¨æØ¸.&«±ïƒÞä]›ò¾èÔ-M	Üña™2òä°4Y}ÉAr±Ñ(UÒçv:TŽqw}™æu“aÈ‚?Ñs2&j2á,&eÂò†-ºx>Y‚à·uJ?;P±2È'| f6Énà7=§Ÿ‘8Nø®ô:®Îú;Ã².…ìt9üQ”·³Ê¾fHž½4“F~¨”h“Kr*ÓZþšÂÜÌ½gfì[j¼/K;R)}-hÛÈÿh™7‡>LÜ˜‹A¶“5ð8

ø¦2êw`à»8ÎñžÅ7ÜÉ„ô9J¦oŠ>â—áòA~N*SIa·'¤2Óè:15q;½½ê‹`Ø÷YmÑRžÕmÓzKqRÈAÊ7ý;KLãGW2Z@·fèý·›T
÷íÁåá`§8?=‘ä[øsr‹Ã7}OCþ9£û‡»ec&Ùà×©øçÿÑK²ß²ÑÙ½&]¸ÖMÏèeürssµ:õiz`|¬Öªnb/W]˜°&ž†çJàO8 0´=Ø…‰¶gïLL+ã1T %}ü6àÀ¯8 ÿJ#ÑýJ+Ð•è|“hŠœ«+%°Æ„%m”©•³ÃÝzv×½cgt«§V<WŸý4)9â<;;AÊH<ðnC:žÍy‰ÈÃ©ÚJIŒK-ôŒö³jÖ*o¤°-Ñ·Çk‚C¦îš´éÞ§'Ð¾¡ÏQ,ð¬NR±<’"»Ÿ’(KEêßÙ§&š%í"LvœNôm¸Å§¼ØÇÀŠ²|dKÀIM;Ž½wÕ½{y¸Ðjþ?[§Ú·P¶ƒîÖ(Š4­þå	ë„rKäö ^ž¨NÖå‰õ©[Ræ·R)VÚ•¹à+©Ü©–fçƒ;ÅRõb­t¡|¡Sœ+Õ+u‚ÅÏeùóûÚ¢Nêwh3åyÖ -Öjð‘\€¿‹¢ûÁæï×Ym2,wvÆše³íšYI3Û–ŸÍ’ëR;Ý¾¹?*©,Bœyçþh–™"È>¥æs73²>Q^®–±0ñÛR®Ž´ Æq©þ$ã5üRq0~:MDƒçxû{Vb‚®ê',SäØçœ ¯z.Ò«ñÞ"‰µxfµÌµÌR²½îÊÓ\Ð±ïØé" s?R…È@ÏJº•Q¡Bº­…àkJHÝS8s*%"5ìdÙsûpìgdãJÌœY;#ž
\ˆZœCÉò ê,Tiò„Cªù1XP÷U.¸)ÈÅ™
Â[Ð•>róÊI,¸x¦ß˜ß|–*j„"AôZðšBîê	JÃûiØ–RPF$¸2“
ês—f!¯`-á ÂæËe…ˆÖ TÓ ¿p„{Ê•p0ˆÕ˜NfÙùCYù!ÂE&æÇ/#ä84RgC´Ëñ¹œ‚Ø£UC5Ñ›UDÈÊ¶mR!;½#/ÁÅl}¯Ñ©ð‡J`UþB÷œp	íÇ¯”î3aû¸É>¾åœêŸª¯f^D²ßì7U²ßDŠ¤Zãp=E1€ýÔóßäo›Í3Kìj%áÐðz‘;)?øô…Š_^)±ZÄã&wü=çït¼pjT$yþ$ÏWIžÏP™Ð0ÿôÒ°ŒŸw•¥‰^lffÛÖ*v…—5¦÷&ýAFñ“r&¬hk˜39Kžhñ21¥Šz…²p¼ïØ{¢„ƒHhÊƒ—íÐ–U­!ƒ¨ºï»Å9‰û"ÊÜùôV¥¶S«ðzJë#zPí¹êßïJ´ tkè¡vŒ­j¿ÊßŽObìÍ~ñVO¯0A VÏéÂï;VË.:©›Wo_'íbý´êí)'€šûÊ,©T­©AàG…nd™°/å
ýœ­B›	¡ZªÏÎÓ±,ÕJjUr¡t±šýÙjÀÉl³^ª_˜§#›/Uçæ©.–fë´1ålªê¤^*Ï^(Î–ÊsuzOüÏ] å">WÄçØoÅc0˜•·f®`ü5¬W£ÞIem²K)¤RätzÔx™Å°ˆÁîá½íZ^K‰fp{M!×N³8Qj‡9î	¼à\çR1"ƒæþTWa¤ÞH-òžÕ£|n>6:bÄ“_”ûÛ1+‚˜ïBéTœ(ò
¦¡ÒÜ·j@ÂøA’8aJK(ËŠgR—,>ˆ®éF¡ÝŽŸ\gÇÜEŒç>)°Ì=3DxÅLPé;†FíyV_žõ<„*Nùëh»M¶ìöÜ"ºP],¤inÅK[”UÆ&Ó.B‡åL%f0ŽJY¼$!ßÜÑe-¾…yÌß+ÊÏï_>úl†~ƒÆDÈfË¨ÜwHÆ6®][]Z]\¢?ÈæÊ»«­Íëu›EáóRó³²Ô<ÔP7-Œªa¤ŠDÇH‘BHûm”±éÆÇëë‹DÄ¤ ü¨Ì¸'C :Àp\œÙø£0.(¨ð×ñ_fUëÂøW—5žFdTOªÙ{ª_Ó
Åx~ÔîFË=i¹U•4*ièÄ¢ª|ëØÕ¤r¡]µª¤Š^ ÕbõN±.¿é÷ë³ÊWR½üJÿmW»URoÏ¥vp1¥ƒ_wç‹•êû³éO´+FL3_œlæR\&L¦´[½¥ÜÄ!â5C·É²`:É‚8òÉ{Ë×( þ°ÇNçÛ£‘É,HÊ uWÑbíc£ù‹¼¿X_'•¹;.Ÿ–Ëô_Š`Á×bíN±Ò-Ö‹uôëÒ›øÖ¥_Þ¯Ÿ~…œÒ§è\õY¢¯"U*:ÌPødx½{<¨¸ØŠdkõÜ=
—Îî.¿cDÊ<5€GÊŠëÀ4ÕxÆÃéÉÄ3ÎL/žñ|î„ãý™¥ ×v¢I9û†»gØ£QEN•$Ü¬
UòæAüÍ€|j±N¥2ç|YW»‘.ÕKW>#šÀS‡KDn!ð±z¦^¿2Ù&	v¡ª­dÿMài¦‡}÷[\‚hâÍ¤AÉà‚„«ÆÃ4=y^Õ‰‡o¯K9Õ;•9ÊpÎ_7?Åpæ'[«¤Ý×(4•'¢¥aéQÃ	`>P Úšº+Ãb%:3+7›/ÈÏ@+†Iy½v@4ÊÈ’f<Yxp÷è1lû‡°ÇSõ¨rè±8T<1)3f¢e·«a3¬P{Õ¥îÌ<CH{6K]òþ¾˜hÛn9IûÅ5=8¹rÙ{(Fäp8+,3%ïT)+\o—Ê”9ž+]¬ÍÓ/•Zi~v®I—¯ƒ+ÍR	¸Rš›£r5X\Šµµ
3½Ô›ÅÒ0©Ôjµbµ4w±Î?×Jõ9úìZ­T¾›ü©T¹X¥<9vDjÇ# ÇRí.¬&ÙyžØ€¤º]Õ¾•9ªË°ÑŠÙû¦Ž˜àŠ©bÞbAßâÿ¬'ËPH;F3zÚž5’7.AT6è!ÐuB0”e<Ì)ÐÙU¾Îñ¸-ÅÉT:	­5xR\¨Ì:Á•*ÂLÆ½§&´r¸àãß3gG­³“22§×fz=ó†€ˆÞÄxÕøåÙÿ<t<ÛM£nV\Š;4>ð¶²yÉðˆ@ñ¢2¸4OhÉI‹jTOÑÎ®‘ë’2¨$c¼èÆD×ÌX Ã›}Èù uiölûã³‹BÜ…ž£Î~~¼1s.Dï ÷Ï*< ë„Ë\ª9¸%jÇM“ÉuW|ÚÚ>ÿøÝêÉ/[m:þù=kxêk0ôàóGèçG?™yúWÈç’ x€ÏWXE	3G½àÊrÙS^oà¼§¶ÎGBiªŽL ¤oé1@~«Âùüö
	GJaev‹9©ã&p²Ç±¨š9&¥#1%çeÝ¦}Ë
òÒ}Z€’ë]Ç~¶Ê.í–¦•{g…p¾jF@Í>sv¹€ûÌBÃT—GçTâkû0ÛÍxPcÁ»‰¥ë+ÅJ¹bz†¿î¤¦_<»øƒ)qç8©3‚K`d.¡½n<¸¤1úãUöx…ùGyþ³³‹WLg÷4`-•,-Lj)ÞÎšÁhÇ„fhÆš	[ø9ne_œëë:“è¬Ð["È¥JuµT7GBQ\v¯ÅCx ’V™—´©*ÆÖé¾’üyøW. V]_ÒªöŽ$rÄÔª1'µšÞI-dEáñØU0‰ê·,c¿­^ÓîË_æf]Þ~´}÷àsì{x‹fGs1f®þ'¹E1ƒšÞRönÛsq(ýÿ>Œ[™nöÁB@ÀÂƒåuu}1cÚ3Åêö—xG`.Êc‚+h˜gñŸƒÖ˜Ü¦Kr‹Èm44‹Zâ!6ùãgÌ¸õ\082ni;ø&
úÛE“` íkkà=€:H<÷x™³äËíj<;\tƒø±*ÃÃ• 5œù —´ÊulyŒr…«ª(E]®ö(´&þº’™ íªUƒµˆ'Êã™Är„<'fC4ÿHqBYkÁÌèBÖž1Y…\5gØ2¨5‰ º•HX•JdÅBiˆ-²tG%Vãˆð3RdÕgQO„pt•¶ÎŽÁ9:fw'N¢04”@Èu<‘Š9ø]Åê_å}áóÉsè“ýšdšYèÆ8«n¤æ™Tøó!Ü1º"„1ªÈ‹F…	JˆMÓ\^}![†Ôçð”“‡yÜø.GRo7F®.‰|ÆÌû(Ñu·bS‡x;œ~øªäÎYÈç8Ã&iÆ>˜––È ’#oüw,cœ²ëOd29æ#$ŠC}h[Þqn;¯L4Þ5Ì]ýâ'Í±ŒpìÜ2'©á‚¢XÇ¹·ºì#IÕ´Î Éøºû¸ÂßIKpÈ7+ðÌrw¯Þuœ‹­ùõ
0ËœcÂ,}€ãs´PEÇîíÚä
)9D1^fa¸[„*îfXÏ*îÆµ€!ÞëG4/Èx2Ós!})bÝ«Hæ	ÁÚÌÌî¦¸#+
·¯äHLØ¦sžf²¢¹nÍ´4ŸXHYNåå£¾™ì+Õ‰+?3¯N–Òs]-zíUÉègØML–c9<™E½z?#a“µ0Â¿E„ñz£ªÑU¯×G±öeI¨œUCŸn ?¼|øœÌˆDI‰,H7ÞM“ ZUóˆè†ú;Ô·H÷ñDæžØüÎ3*³by¼¥iEEÂ‹æ©³…Lò-ÊþAHMæ¬º¾ªû6M(ïnßÊçEGÉóŸã½`æ<eÌR±*ÉãlYOÁc~®(.´y¬:Ä8[QÀÐÅ(mCJÜu{®ž&×s5ø`¸ªX©4py¦©Rßj5 ^¡:M&ËæzTœT4³ñAçz$”ãZ¹¥Ìµ(±,'‰¹a`½%haÉ*cÕpòëÔ£7¡œd¢Á4BÊË÷ó¿{¤
 §t·ôz]–ÆGY5µjØv.¤T„dA0³J(e“´>FY)êEÉnE‘\ämÒ›Šs.Ybý—ˆcÛ‰®z‘å[£Jp£9’›£9»¢zæê™³tÌúÿÿ  ÿÿì}mo7–î_¡'jÍè­»%KÖÚ	Ù°åd?xQ»»$õM¿hºº-k5ìæb6»,rEvq³ÌÍÝLldf2È:_2%Ø?pÿÂå9‡¬"«È"Ù]-ÙŽ
3Žº»Èb‘<‡‡‡ç<Or”gAON'Š’¶¸>Él£ŒlwÃ’¥K%&_4ËÊU5³_;J€>à
T€ÕTŸ“/ò¾ŒÃKv­H£x”×‡@öiµ;±Î¤H…>œlõÊ‹P¦$¤’*™’Òv2ßè¶‡ÈÿBî™¾¦“|rþ'™¬ÑðòÒòËa¹ÌXåÉj™$fKÀ³ôË+99Šwþ
Ò³ÄHZPªnµÊÖn]Ö1ÊªUMýhk]>†«ÕÕÅ+HËG¿U«µ¥ îòïT«ø¡ºvëÊãEüª³œ{‹ø¯ú·öÂaÈ²PXDPR®L¡½u¢ad[¾Y]`SµTqþ!ÿNùá@—ôs%˜†WªPúq”¬Šâƒ&ÑøÝú¹@ë-(I ¯°õÎâÒÀ6Ô–ª«µëBx«ÕËKÕ:—Ðê­uþs”XåƒwåÊÿwcmãÎ[ï®±ÕÇ—»«‹—ù¿ü×•îM ï\T?³êãúö*[?¨^~ÙÅzÂJÀÝÞ®nß,M^g!zæV8†(+Í{)SÕü´IDYe\p
~Œn-›ÏCýÎaÌ»u´ë °Ã`³ËÏ—eG7Ãlp­±ñ²#Á¦Ø`ëÖ»l•ÿ»x…mTW¶×¸z8¨®ªþ‡ë…ªÕš†Z>²‹,¦ø,1‹€Ÿ§ Ã&g
 \0aÈrþ•W—|ýô8v/àêû^?9ñ|Fê‚'Ä£æ³100Ç Ûm<YD2.x²NÔ€ˆôÅAÔi<‰ÜÄºÆ.òœÉo³Ý F¢Ï…óôßJ´¹?ÓwŸd¹OÉÚÑÆÈX–9•þø©rö÷%¡™ÌÉ¿‡¿ÆÏñÎâÐÿ»$RžýOò‰pÑˆÆcJ»˜œ1þŽõ9Öò5Uü)Þ
-.¬„·r×s6Ùîýƒh±6âNƒ’êó]µNÓiÇC®˜YdX»Ç†íÙ‰—Ø]>»âˆà ú b@¸‹LDãs9}Ìîó¢q4r›:Zò‚C,/^Á/{gØè²e¶ÓÞïD¤æñŽê'ŠÈ>òU$›Ôb	JÙšýDEâß àj&B 
$~}”¹4—H]Yú<¹ÙÎÅ}‡–“d^!vŸ‘<~¼I³þþï/ø÷7ôÍrF€xÊ…ò+ü÷Ë?<}Š¾¦ƒßh½×ßd;[Û;Ë÷Þÿàþí÷n.BHÌrueN\'ˆ""¾ û«ü÷Šï3Iîý‚4Ó'Éê@:íyãs&‹†ÅŸ«ÈÝ»õ"I…ŽZ\\c¶ÕàÓo»ßŠ: àÕç“áz«Ûî~AC)Ï.NN3ùºb“‡±õ"†yPStì¢>Ëœú)N\ˆ`OÊ»€¯n«…¸ÜåRb$‹ˆ\ëQ7'‘aâô™P:@“³Ç”xZEká Ðé’óDqÆ³Õ1/çüÏá|'cYhÎŠü¨ìÌ?Ú–k!nòx¾bªæÖi¾ŠÞo<¢q…Ï¿8ht:sjÚnò7d)FÅ\c•h“Ý‹Íá¬å7ó‘,ÀêŽ–Üs#ÚkŒ:ÃŠñ¹½Ç* UP)LÛ¥á Ý­ÌÏ³AÄWÏÞ_™;Š‰L4hÞíÖ¼30Âù«Ãmq†ÿb ÉzädX¸V%—;ùÒÒÒÁ‚õW8r—Ùdê«Ùïç›µF³=<Þdï wº"‹m‰ ô|eÞ^W‚¨*ÒÞßØËðe8ŠÓ;øÙrû˜ðÁ¼¶[ã¤œ¾áVàì¹xéDíˆñE; .\¤vFÍfÇÛñ~çwRù õó¾ú“[G+ù° ©¨ßIÃ•ów
JxE/¤Qkø1µ–­c6¢÷»`ÃE³¨ÃmYÛä!ùêEGB°ì“¬ÝâVø­ÅK''³ÔëqIßýQÍº‚Y’ê\(áïÙ¹ýæ+ßo¼Œ³µ í5|ÎÆ\‘ÌX³–]^æŸ¿"¢Rïà?ÞRºÊN` Ü(g—×ÍrByÝLs©2wýq£Ý¿gA™›ªª—¤¶›!Ð„ïcMqcv2X[=^`Ü[1þ:66D]–¡ñrY†©º‰IèÜjŒ¤P<XyXÐÖÜûC%|tw1Ž2Þ-µMÀ€c9©uÆËIeã=°©›	»™ŽÁdGƒ6Ž1T’+T³ô© ŸÁLáîµÝœ^Ø•ëÑ3òÚ|Fÿ¡m%é|N^&M/på„4p™å¶Ÿ Ê<{{\9×¹Á}Üq þ8j "{ŸµðÓZßÞŸÄ”Úkw†°€$ÖÔþ¢|>ù)`êçŒ
îŠê5w¡zm‰F«jÖª`­ì˜9CÛß.°g”næf·âÍp+ßLo,Ê•°ùn«óÍ[=‡)èbí1|çÔ(„]‚Øï\£kè×iaõí+ÚôY	àì{•2À7<BŒÁo{2±vÚ-®Ö¹=¸ŒC„dv_m¶=*>Ñj!ÎSU9ì¬IÆ]Â¨=‰“Ò¢üR×ož»öðÑbÝFx^LyŸ;Ç­G8zçÈçOH×ØÛ—õü
«U³TŽë™“ÏËÝê*[9¨uùÇ•ˆ‹ºÂVnÕ»ðimû
ÄDtùT]åÿY]\M?ð.¨®<^\“QUª¨¥ŸXõ1¯ªvsû8QÝN-§÷ìêA=ŒI÷‘Æ‰¾:Ý|4é~KcçÈrÀÃ}h8ÌhEÛ†«%…ìJcŠÀW—êŽÑ²¢ÁX<Ãî‘òv|‡±e"é™<F ·³Ÿâ‡É9óB’§ ƒ†ìcÒ_#éò€±!_•bÆØÄ¥Á:ín{èrœ;N?ü<»öß­´&0¦ZBZÊ–$Îã»–«êY¡ËÀ ÕûáÈ	d¨÷4(†®4ä
S.QºÓDS-›Ö™ÃWÇÃøßÓ™¹S@°u£sþxàiŠ¦ãèLÇ’Ýq›€ÕÔüXŽ"y$MÍÄÑZÇ¾¯­ÔØv£Ý#•—B®›~u=Ý ¾™òBRN–˜£¶D·)8%4~ñÁæÔ	,r|ÅC]¸Æ»O®@IÔ–ØNÔ²ÄŸûúë…tIÖ o(aŸU´¾˜—z²Ä÷PÑ”$ó]°`µÍ _}ríl;uAƒÃ-Ž2Z¤T5òÃÓ¯xú•¢9VWÎ…—¢¨/±QÜ´‰{f™IïÀ@cüŠVø=ùLÑ°Ð-ÕŠ¹¤±õ^)êÞ°1ˆåh‰Aÿ(¾vRw	FFMÈWš\M$§ïŒÚ¤M½¾Àj|;ðn§ß(
Áüûk¡#øðÇí¿¥*f®/V—¹ÙAÿ°Õ?ú1(Š$*i¡èâÜ² S&å—"øƒ&¨ôøÉÅT¸z3ky#fŠó—ýŠÍ½ÓïµÜ!¯†ð„d–9ý‚ÁæbÒmæ(»?È À¿àªCâÏñ°‰Ó+Iyš^é(xóÀeD#gÃ‘¢Ðñ¯¾k ˜ì/D0y…
SSÄðl‡³œŸö¤îJ7&t£óæàÐ™»í—ô©aÀûKfWQÏC t6#È”ø¯žDÙQðo*îJo‡˜Y]@dÞ&ÔŒÑµÇ‹ Tët²sÊ—¥¬±j½³ÊVï@ª¥G¾“W¦S9Þð@(þé¼ßþXý~Žm™ÒYx[¦Ÿ<8î}S¹5NçÝI¢wö°×¿­³AÖÇjŽ´£æAÚñ¤cSa¹ÔnI*•»Ã/•·pò8÷EÅëBÓ`"ßiÇC'6iÑañF‡ÅEêÎ¸ââ £–´ eXÍ!«ÇËÅŠöÌŽ'8üRªÊ¿\o&äÚiØ¿Gq/ðLïÑdz~ ýØNƒÍü&s­~gr¯f<&¼B’xZ¤ùötyS!·¥Á8¾à^ó ŽA:¾ã^ˆªŠ3>¾38$Š·ªÂ¶YˆVVrZÖ\*&åÊ²[óÈ²³`|ü†ÆJJ>(00÷ûÃFçuÌ?95²?¸tz†y’„£
æ±Ò´jÊ£Ù\Ã< ¡§…>E8èb èõ‹._;] hOè<¶n}jðgKNeÛQór÷"L²åälÙÃ×úÞ€zlnžýè+Ð5uCœer«'HÙé2M“®áeÅ^JWÕ6ü§9îÊé™öÙ‚]Ú³¾Œ'Â³/¶³WÒ·¢aÏÜ“¬Ýò‡rgÛ!=‹OâÐôOvõM×«,hvé$¥-ž	ÃÉ‹£#Ê'u&_^^ÁÁ{xæ‡aNçë3F›>©ð/	e: a2Åpž©»GQuæ.¹Ò%ZîÌL^=$äCyHàìð&ÊÚ»¼Îš0³5—çòš- ¸³Ÿçí#{Y7ÌÓªª!p¸'Z^Ò¸(®$YI}sò}ŒYõÞ ‘ö<¥Wê÷ŸãyjBOÒ¨»´‹`PËÏ‡‰BÇó`Y¼@ (Ð!å;Ö~	Š`2ˆè%&•ræÃF“´Ë‚BlŽíGòš†BnÃ9ƒ#1;:±Æw˜C¬WwA@‡¹—:"ØH¹·a±±F¯Ý…-Íá¨Î pÈb“”‡œ¾ù[PÓü0ö’º§Ò@¡á¤Oùù@ßŸýl väqùÊ}¿ÓÎYûL 8*}Çë¨TyŠc¥{š5¨6¼*æoÐ‹!Š‡£ú†
¥—¼ö¸C
ÂøëÎŸÃ#w¿¼˜ÝaZæì`}DÝ ¾žg½ê…B”Àþê	~
. Ñ˜¬PŽ2(êûåùþ±i€WÒ{b=à{¿7€·/t·h·;yÁ¨Û¢ÛñŠ®-ƒ? ·ëË¥-c9õ³lm×P
´÷iƒl—'µ¯F
¹—ØzˆÞ,ð·ÈÛ…!0ÜIèGÌîaüB4ˆœpÜn îSà6õÒWê[§°ÔLrf¿ÎpTÿ!Ï–èÒÉ.ù2´ð?µÊ4(jW2|:,T¡·¿±¤Æÿðû/qh2ˆÑÂm9è¢Q£Õ„£ãFÇ1Wƒx¨$‹÷Ôõ2îDÆ¥ ri¦'Öå¢ ÜÌ€@[ðÒm¾ÒÂY£ (vÛû‡DÙu5šVÔm7é;Š¡ŠÌWzhEöþMöÀøÆ'ˆz8·µX“0[‚ŒþÊ›q“2µl™w™z¶Ìº»Ìj¶Ìå9# ÐÃ@ ì†¸Ë×¥» ÙƒN5wÉÜ»í^£P|£Î	ÛçÌí›».:™íðªÁñStóNÄÒjp!y§ß´oÆaqí½Þˆ·ã&äÐ¹CÑÝï¢äÝ¸T^O^•Jx÷Ôò2Ûjtš#ppÙ†€%ˆPá5ö#Ö:æcÐnr±>¶ö2ºKexÃ´‡,hV¼Ä•ù¨U*ñ¨»€þ(þ‰ý”UDÂ*|½”>t^`b²3\`<÷†"g3ÑÕ^Ð×ª++v±F'3ñÛVÅ…Xu4øüB²HÐºðB††¿›,/äMTƒÑ„^'ÈK&c1¾•«
_BBûWoÐê ðì¾ x;BÚþÙ&»t¢vÁøù]ûm²Ý›ƒApÝ?0L,˜ÝÇG¤ØæÞo°Šˆf4=Íò0+¼˜Ä76ýf;SÀâ`^¡sÉñüÑ~+/a¹‘kžíÆà#už`’A
à”,™ZâK†‚H´ÒÚL$õª½Dª=õb×µïíåy"ÞDÈXM'<´” ücÔaÈ]ÞµL]kU†ö–c¶¨|¥¿ÁxZ Dìžì¬ÿ0î)·	Y…ß”†œ¼{ïÁ¨ÃW}ìš˜ÂÉÑ,+‚t .ÃR2ˆ@ zÑ‘åž™|Øîò²­•i1” 3VÿJ‹BÁhÙU‰Îå	ÎLƒö’HRº—)G¬&ƒx~/:2t	â<û‰—è31îp	l Î!ˆà‹òR7Ôá¨$–».ò†q°*›×]NÛŠÙˆë]˜ìÛ|C»¶÷Ü’OWþMV_±ÿJÔ6Céõã6€›·öÆóÑÜâ¶F[Ÿb}Ún¡¨³F.,”	$u7«|¡©…Ê&‡{ôiÊáí‰žwX\×¨¾ó‹¢2E“iˆ®'`üùÞÜl8øbPçzXÁ¢VVùUvI˜¨Ú2Á&Æ¯¾t’´wÌwÛÅK'z‹Ç]*5ñ0yb`[^ÃLEK«ò.‹¦×xÛ¼-(ÆØvØãk;k’O„¸m[Uµ÷Ê½ÖiÛ¤¡ ÝfëS"vOÒ-v;^ ÝÞ¦«¸?líÌšxýÌÔS¼†Â5õ:ªU¾–Âe7_œðë­ôìm ’s …#ƒR/kD$4J! ™SÈaiöâkD›©;ÿ×xÿ·’&Sè¤œÔ%›ú‚êØ§cÉF÷°¦‚ã^À˜ÀÄ)áb¿Šé[êxô“Ä9aÜçÒ„kùp©‡Û¿Ó?Š[¼0,¼ïl¯ßZà»£GO0VF–S¹2~"Sï¿”cr¯áfùAÿAÕ÷%/'6:|÷Õ:†µ£Po†÷yNãä÷‰REØºWW\[„Ù†Ö:Eó^Ôí?Ž4él÷ZÑÞPôÛ¶æ—V×õÊ/Ò<)HŸÁu0©y7é%Â|Êµx¦n>¦y¡›Okþ5Ù|ð&ž@mèøÓþµ3 HÌ÷­h±Ý³ž·Ú6‹:§€ð=¡e¢ó¸ËÞ‚ó—É°#ÖJ!Èa…BIä"ÍëSFdxÌù¯?ó @ÄÇåî
wÔ»¼oëK+Uþuu]þ±ŠðY,ÿZcÕjò]UÞF¬#ŸûŠÆçîIYãsõ	„ï¸Û¹ºÁùZ2Š«'[ÏÌÛy2WAP;ù¶úX]®m67ò‚\¸Ì,ˆ²6íŸ„;CŒÏ_ˆŒúóž~G#‚÷YbVi›˜¿‰yM§¨_&	ñÏ”|ð†îïÌ>ø(Ð8;Š €+1t…ûG|‰¹ƒíTÜì¢—•ý@f'ûmwOðì HóÀ-p¤ÍÓoÅ–& ì°
ö%(áŸ§Ž;ªŸ¿8Ê¤°£•h^ ê^@pà"tÑz8¶¨ª!fC½PG'lwÎ5mï¦°‚EÔ„&B&ˆ‘lÒþ¶ÝkvF­H: øâò6£ŸÀ[J’wIÜ<ÞõÊö•w»ç‰hê
½.k”ÜSJ Ór[å.ð:èëúöþð\Y¶D-â|+ ÇRœµÄ¶ù¯¬/Õ—£§KQl™á€PZ@"óˆ6÷Ñˆ9˜9€v/Rÿn ž|5¥8e.Ø’Ü‡ø!—FU ¼`¢?©²ñ[ò_eæ“IÂ_áBþUmžpó>H¨ê+Oß·l?¼¨;cÆ­¸½ò@wo70^•7Áù¼zªÒ•"Hì-®•?aÓT:avÁE« ±gn¤À—gríouñ/--¡¦€ÝÇ\ÎÁ'«W£Ëî7üºCÌEA—ï˜¯^Ñf’µÚ£®ÚÏ)€RáË•ÀÏpƒ"£ét.õÿÂ–©9­t¬xÙaAþtëáÐ±³x‹ h=–é|ÄiØLH³™³šR’¾èxßJÄV`¨d•7æSZÍ¿–ÿôP¨ 6LÒ•i`i­À´ù ðÂˆo:Ò‡plHíBlDc—òîny®|ÀxN¡ké€
7¨†MšjÎM ´~‰F<{A	yîù d¯@©±Û_+€¿P ä¨c½ï¢1Æ¹ö$6âNmŽ‚ÅjŠ:å	ŽÝä¹íÁjñ;ÿpoð’ú|ÈâäB'/d…s,9ÊÝ'×.V]KTzy’NÉKC86é /ø@Î2pÒéæ;lâèvo˜5(…Ç÷¡š¥Q[A%#Úzô¦Ãóod0²zÚŽÉbV¨¦‡ßøxæé;DÒ„ ùFº‘ŸÀj#ž­Ë@Â€‰nüÞ|pY•T¯Öð…ûÈ¨Ñ$1±ê»C‚+/d2´#VH&æ€&x >ÈÄè b@Þ¼ÞÔÑ2&D$ÅQ D¤°t[4ÖÉ0B0(ÎäG†„†â%žà!^·¹Ò~¦&P¿‹1êºxôhÓÚ\
Zk‹ˆ‡å‚(êL…éZ¾¬ín›Ôhëñ¥lyÍmÐo¿V
øÒÝ×„»
-7Çà­ð;à5Alî#
 céVl™mõ»‡\ô†›emÄ¬le>%¾¦¤¿ó
.a³åÂð|äËä¿ÊÇâ;³ÃXAéÌê~à|¡½ßW“BªÝ0F½Ðy-w27 Šõ´³aÞ¿ÄÅ%Žºm‹Yîa‚ËCIû<¡¦N†(Kvìôg‹/ƒžÁÄµc’ÙàTCí¿ýqÖö¨#j}iVajâ¹eQáUkÜr¨^în,nÜòÂ‡ûÚY×â™3‘3|vyˆ²¯qáƒyänórâAOº¹àˆÖâû½Î1{4„3ŠwÛQÇe
Aƒ“¶úÊœC›Ñ$X¬’íÅy…ü(ýv§Ëv”[éÜÎœÀÑMÕ´ÓˆpS¬pG_†öžô¼'ý\ÿ'I£†÷!H ¤K‹íŒºsãÍRL§I,«¼ßÓÇÌÊôíÉn^ªv¯Ž‚½áÏ¼³4ðõõbQð·6Wƒ7Ÿó³Ñ1I<tžŸÇ=!,¯êuølâ‡0 Ö'ØÂ*l=©¡+-”ê!2¾>c³Úù?"Ö³§¤?>ltÚ-ùE™f_øwW¯¥ˆí`÷™÷˜z–óµL!£$Íß :X•ß‹¢VìwŽÔî}Øi­ßù* Ø'¢©Î«§³â¬nµc )m];1áLùÖŸì¦”×õ¡µFh!µž–Ìº–¥²¾dÏMzÊ¤Ý<&-CÙv$kµÆÃ"í@®ôÚÄ'à"^çm¯Öë¡wúG|…í«Íâúš	vM½\ÔTá¬¯w÷[¿µ¦'¼\Ñ¡ÔWµ\™+Z®ÌääTÙjsºü[þÿŠø°$˜Õ²²R\ÙF§?x9™'x9ž<âa¹&~|âx•`à<òÃ–?É`üêW:‚jËËRùYä¢ûòùûj	íî¯yûÍ˜öÜ•WŸ^¡èZÉpœcñ©Œ5º±Ò«Cu“á)¤—YA½BRªõkªŒ”3Z„rU=,4´g8G~â|”‰Ü7ãðc#™,í—QÙŠ³VÞ«ç>~ªB=èÌì‚Ó&ÛïÅ¶/jNPiÏZªó=ÎÁHªûÈ†<EÚóziÏEVFptâ”Ïg’ì:AJ(­¿Ï)G1Ë-OŒ"ê˜Ãh»ñÒÏ<4›Xœìi‡¶‚¦P÷R¸gŠø—MÕs?`&*Ê=fæ ÏÁV{o/»šu¢ÇQg¶ f'D=!ö´§ë[œÇéù‹cs#¸›¸„™7‡8'Ùç	eòØÐ\xsánÈåŽpÐÛû£!¢—Zò¸\ú3ažß¹3-g¸™"Ü'Ýw6OöÉî¨¤´ ÇLÓ8(co6mË®HŸ<ö’¶Ýˆ†vGtšé—³d|çˆîÁùWƒúÝƒœÅ¨ÛTl €¸u”U¸N(‡Zèz†|ÐBÝîëÉž–L}uÖTê¢t&dê´Ãž²kV§#ýIÚ£¼Î†5UWd%½yæ¥/Œ~vÉ'r ÕË‚o7ÃÇm ±õfå–=ÜÌ]%có“æf[íÃé'æt<¶x öLüÔMj0:!,¶a‘é3¼œ4Mó€Œô,<lV®DFòt‹`å#_^ÏÐÉÃKCØ9CÂ³{]«ñ•?I<ZD›W™“þ¸¹¹yåËTÍÐOãÍpk[ƒ”µF9/—­SRo‚9ÄKø¤·Ëšg¥>J#Â^}‰i°_*kUM£Åw”Öèh,‰ÑÖ®¡'szœk!*kåÇÇl{ÎmÍÎ\–ó´’ˆ˜ÒR\|Îp&œ"wu™â>-õ¹¤¿ŽYjSÈ»ïýçÖÖÇ‹ÕË¯)‰uÆÒX^[yyc¨$Bq•¯ª—uáLHÕem¯©øßBØTVU…¨ªTæqý_é.^f+ö*°†µ¢VS%¥¥Mx½±C~‰®á“„ÛpŽŸJ¾Â„Ø¥2_'tHâ—$úù÷2+ÍUÃä/då«ü³Íÿý'qB9r§ˆ‘?ùÐbÞ”"›wµ·ñ*.Ç”'"¤áøl¹±¿ÎŒ›wÒèÐÅŠ½¼ÌÞ˜rË[ýn—wU<zô?¢æ0fíÃLLâl"ÖL„ÅP“à×Æ:vD%s=˜»{p·›1xˆ¶¢.ŒÌ1|¸ÅG…/@Û\ÃÇwÚ|ØÇ_nöö;í˜¾zûNþüYÔƒlR`§ßR¿f;‚\×ˆ?ê´÷áü‰ÿ}{ëþÜCS0—¹#>èµ9â“L€$%ý dRè	?Êãê}þé¨‡iÔo¼—b{¿@1Ù-
ñ¸üJòfÄ˜^LûKÅ$Np]ªâ&ðÎcÕè‘ÔDå™×\-íúÝJ/:b;Ñ°<%ZÓ€Ü"?ˆçÍd~0}°áÔNûûÓëñæàm¼18eñƒöêæ°KñBaó Š1ÌPvÅ´[¢³š»Þé`ŒiŒ.hñmî^s„Ÿö:.ÒÊn%£¢<&;Téæ‡¾õe¸ˆª5r‡Xû?K-º/öbo&lG²¯1AžL¼¿´!›œð†ØOs¿ooýÜúÛÝ@ñÑ¶w¸…»uÔåËD®kmtŠÀŽ³G¤§”ÁI^0%¸@<âdë.M	Ká¯½Tø{ÒSé]…MÂ‚7ÃFU/IÀfªChòÛbqq&of4Žíf¡•Û…¾°8¢NÂY¶Y<ÉU@W“ö¡­ªnó—–*’é\P´ Ú8Ûª8”ƒm©$#6Îj
Úc˜W¶ê†‰Ø4êk3Ò§«‚b¾ÝL‚¤±¢`ÑÂCÜ}²|ØiÞ¬÷˜tª$ðÎÃ%ô·ÂÅÿH¥ÑÊ+mãSê„ê¬ü|vNL?ºJ3xŒÝ&³¿4âtD—Á>ÑHœ%qz›Æï‰o•°­Gi¥Dï©+*âøÌj£b–Ï›Ú¸OÁËžá\¿¹ãIºnžÉ*{\J¶ž™gö‡ÙÏ‡ÄÐ3ÁÅÅg˜MÁ¡^î<pñ‡ãöS†ÇDÅ>Š¢CÂ´‚ý'.šÆ*xéÌºTY³lnZ©®{àkN¥¶æw#Öºáqo²pøU­­3~ËF¥^·Ù:`ßv¢Æ€ofâÐC{°Ùªí:Cª™ujºp|<sJÉÂ½c/Rp©pœ¬àIg‘å–²sßö)”å÷("Ä…
	ÏÊR1ÕÒœîjùd~HkØUˆV » ‰å‚šŠ	V¡[vÁr£×Þ˜D¤¨"ùq*ÖöÌDW8ÛÓ=ÀäÌìS°'¼±Ú’Æ¨Î*|¥Äü®z;¦Å'S¸˜Ýf®NÈ‚>û>”¬Ü¶Î»ÙÊ+½(dXé}Œº ío©&¿	"K÷0(mÛÉ˜¶· ê¯ƒaCÅ<ÛAm<·`%t&óé1þR ^AôiîÓÄl¿[ýÎ¨ÛÛ$”P|]Â8[r_çk¹sP3Ç–öãÊ%ÕœèÄ¯ÉåJtG70$þ÷çÿûÿ½øÔ‹þÁ'’õ$£Ïœ§êføïEåc\¼¬íVØt~MŽÁá× ÎWµ1Ž¶8yûãá:KJFÎ ÀsäÌ)²ãu‹¹`è ÷O
ýë3JþX=‰¦cãg¬’Ò)¡M·À¸J_PÎ™µì²ß)ü{ôåóyA1óuÂ1«HÓWd<ÒWOÅÏì<nv¼¸ÆXFÍö^»)NX*b‘/¬óè Ó›5ùÑ Ý€$g¾\q´TŒ_Tœ­[p6=9‘­rŒ2mÁO°š¤0Óâ{NìiŠ\·ƒzÎŒw¹’ôÄ<ûI†é'§GwëIt"À²3çFþ4o‘°¼³î‹2xqWýXÑ¶Ç<±™…,íŠ™,MÉ{ÓV4”ëRyqaç“’%' Åª¤¸øÁ{“È†X…ÿu5c×RÈ^Bº[:§sJž¸WB÷ä’ëþµïq‰ý^dÛ§½!õO®“^z-HÎùÁx%G72àCWRn,¨¼ÇUVæ$%£cñ¯ÁæÀ ^+ððeÈmšÞH:„eö¨#ýr“AëÇ«üåÀŽ0UèÊ UgNbõñ[òb`×Êà|Õ+a@#¾(Põ¯_|+ùÓ¿á–ê6Òê6J¨n=­n½„êª+i}ð·…W±ã§¶‚­ó:¯Ü´mþ/ò¦³Šxc¹:'ðÒ¯Êò€}òÍ\bÎwt9g“ÙK!Á£Gò¾Q%=/?¿•üõòøt(ª¥süŒÍa ¾‰R	ðŽ_[uPû9Fþ_7çH:K%ÉæÍ¸ÏÈŸ÷,Íª©P_¿É0~PírB{²þìT\ä$-¾©ø0¤Ž~øºDwz¢Á<ù¤®¹ú’O5˜ê3¿LMVx’Ùá  C& ç°rÐÖ¨" O×Â(^Û0…4Ÿmâû¤) >xÑùanÐýø±3û'¢2e	&t|Ù]–ìpd"Ž…ØÇ3ÜËHn~¹xš'ã]ÎF{‡/{ºäE›tþô4ö?c«ø MÓe:SçuLWžXCNÔR3jw >ö¶²T¯ÛCH²—¢5]F³«¦±×²ZÌ® ;kFÒÞéë¯’v‘Ë|¦)øë\·d/‹n¹ëár”WÁG•S³™ŒÉ½dùË"¼„èu›M±ØKlý¼ã®óªÛxŸâ^à…ÄA‡ìmnþoý\ú[??·ðœ×¹…§_Sja>é^Yëb'·ìd ã¹Ug½Î­ºs«ÎqôII”ÏskÎr5—fN—gÓ½’ÆœæGÀB	¥!{ëÜ²s^ç–~M©‰“©÷ÊÚwizÉäVžžsrnëY¯s[ïÜÖs\VS’Å§Ëê¹Ýg¹NÛî+‰ç<Ñj1\Á1‹µé„;,² sPMYz®€h=›YIÛ´ ØV­Å~¯s<ï´i'‹š00juŠÀ¨b³*¹PQzG1¶òÝ5ïA@ê¥=5b˜.ð¡|¿gfÓ/yiÀb
âŸ-ª®Xã£t‚:›*I³'MñN
‡»«_ÊÅGàÐWd_+9I£yŒ“vŠ*6é·¯•¸œ:ßiI ÇjŽíTÄÏyƒc•pÄcº¨ZÒ°ÙáÐ‹íÅCAó2Æ6ºú+Ó.à…ßYrúªZß«W…¦D–êcèKæ-äëPÜ§ðuÜïàúùï¿û¿~N ¯|ô	2Òm9éÙdo#\]šïýÊy¦zÃeN<7ç¼ÿ§’úùgCÆ­÷“ÝZÙÀ´%;€ízº'·K£KÂã’6	Ò·RÑÖ55›È£ÁÆ¹,?ùHäD)“­ñ„íNÜÝÏ)q»ÄcÉöaï(\ÆJÿê2$•Û~/^`1¸ì&¬„S K­E¨#ë§‡:býwtÀ„»Éw­ýbN;5#-w7ñïAÿþ6êüGÑð(Šz"0ºèh¡x7êöM¥Rb~}áá!dôÊ÷i’}:©N…âAæ(%«WÂk|‰ß)r29D	ÔF_ƒÀÒøÝ md7Iýÿ‰´Ú_Ë¯ ËXr7|ØŽŽšºªKÂ‘«©Ý~+êÄ
L†€ØhÍòL)Gu–„äAoÜ¤Ÿk²¾hiœ:N¾Hý'‰ ºÓä€l,[Ø.ËÁeÍƒb“êùÆ H©eè‰<”s‹k¿0çšc["8ŸVIÑ!qã`²| šñÿþ‚œtÿœüÆ*zŸß@ÿîôR5×¾Bã0iÒ¡RE)Y‡¨(jN§}:¤!'d¥&fr†¯w:ß²P•~F‹€6[pðB8¸ŽñÍœ¢‰„+yù2SIñ¡õUŠ‡Ä¡U¾"£VðË³Ô+“`Œèj… @ÎµŠC«d'L¢XlE€j™ð¢|¸÷0á¢q™c{‚y‹QÕ>„Þ%â[”ˆmQ"®E‰˜ehsCXqZÜÑ k\R{þÑ"ñ*_óîÀæ*R›ôLâßHÔ…Ð/Ü¶î4=¶ìW‡QÃƒÍõêp ­T6ßDð‚¥.w~!†@Ú¦±°Ö1üBebŠÐc t>aGÀÊµÓå7æØxüÖÎ«ËÃƒ)žS7Ô]¯Qån¤	ðePŸ4äM¹ŽNÙPW‡TWìÖœzšø™µ
R˜’T¦3ìkln”;ûæUíÍ³„_¨Ñ­gØ:ËQ·w†#ûkÝ«ö­<ö¡Oß¦ù°^CMj÷*ò^«¯)02Ž5°ŒªfG®«^LŸØ„ÌºX…¸±Ú­'hôúEºC¢wL÷‹€‡Æ¡äërÓ Øj&zÈÛø4ï,G|¿þá«ßn±t(Ðû¨×?êÙéòmÇ[DqÝ9Ðû,Ë8–¾TÛBM©_…òÙÖ]¯™Á¢cßBéÜ:ÙÝÇ¤‹üIÙ%ÿpmCwñ±PÏÕ—×p(’Ó<¿§]9½Æ»~šÞ»h€‹–BG<Lyy]¶œjÈtÄÐí÷úŠ±ädÌ[Ë¥’ý”U½[¸<l9³o’Êø6aˆ°Ñ°Ñîøìo’Gš;¥ð–YK;µt¥{Å/QÛQ£Š¦®Oâ Úa\Ö%ßžÂ†ù¾ÛÞÄZÈxâx4h¾Kžýà	ÖwˆÝ®Ëë‡ð¦ƒD
´®À†Ènmúxv2ïà™òTøÞÊ„8Žºm|ÏD¤Ã_O®k³~¹ÀYt{°Š‘¸\%ëÙT³jnµ)ÔŽi>ƒf8Éq¥;8_º<BwŠÚ[<_å¹6¨N6„Ð†k“é2ì4P?ÚŸ¤˜ÿ›64(êÌ0è„kã™‹ˆwºH°xÀ¡ÿ+.’Åo2±¥ÏEbB‘È‘!¾Êâ¦…¿âB¡óKN&zç2¡€Xh:_e1¡¼rE$D{†š¶g°Çaå téô[‡v'µ°i¬‡‰WÉÛÍƒp•æŸè¤<å´lÐ£d´ðÃºáˆ§ÜÁJho_š±"÷/{²Ïr¼œÛ~Cîˆ/p‡úÂÈîw»™¼sÀ+c;=SÔ+,Í@½’”"N5Q|£7Û[ïŠYWºr}£…è+ò/[8)Y$ìÑZ´¥H'—^Ò4"þè8Múu5I’ /?"—Œ9ðd9­‹~€Û«JJgß‘Åäš~!Ãè¥®­«ýt°Xçýtÿ^ôKtOêòË°Ñ/¢×~µÅ$K.)í˜Æ _–äi©S=:;‘Ñ–3£ÌàBƒ÷¿*RsÐˆje‹‰Ù8}Ž[áòa½rÎtþ08‘uE.a¸NÑMnÎ¤âd¢¢U²j™	Üâ#µrÁ‡j˜¾*1ú60ÁTÓöÎ¤çŽ.2îËêO:òQÝlî <!ßcþ ûƒ+žñY@fÓï)®€AD¨»¿‡ƒiT‚dBü‹HÂò~@Ÿ‘×ƒé.®@ßëãÁ;ÃˆXˆå£Ëºaó Îa‡£:>èÌ?vÚÂå‰ÂŒ¼%Ÿw%öúDë6ž,Áh†Ñ!Ã5áxR~æ7ÉH¤ŒÇH‚æ“\¯1sJ£"þ„ü_Ò*–Ëé²$~e]tÎ–ðÜä€)rpÌ-Ô¼¿Žû£œ
¬?`#ˆÎãÓÏY¹hF6ì³²ž@Z(hi‚ÆÜq.»8ø³èWëSkÈx¾ÂÛû3&vFî7Ñ¬„Ï¿Àtºƒ(þ‚ëïCÐ¶s6ç]VÿO‘›?:·)î¢¼Ñ«u—Ö3F;ûæ(òá÷·(¿ÃT˜ößÈÇç	€ÊNû¹´ßßÛk7!pã^tØÙVcÐb÷Eçb4ÙAÝúF!é æwù†J~/þºãsT_J—²ý%½!Æ}¦ß¾BM1„ôæðÎ_àgŠ_ú$áº?èsƒ“ú{Qs“¿øá€–Üipy‚Þ°x8jñuš¨[pÒawX®@ÐèXUÖmåòù.Ãz&·žP¸XËæd‚Q¹‡&.¯ZbÀ‚1l?.
{Î™$Gq¿3H>d] ¯]:jò¾Ë$äA~±¡{Ä/XêW/H§HÇVŒ$Üðq4çtEäp_|kgk{‡íù¶%¤ñhÔiI)Î6Jjj™ÞìÉÕî;%Vö{üøw¾‹$iºõ9“âÅWÄ"ù³€VÀ5ø·BzàßOµ|éSB­¿ u>I·~–HÛ?H9þ
ÿýþûGi£‰1úJê oi™þŒD™a0V*ò¨ùF«…ÀdwE|º©ÊZOë/_šC.K×ëƒ¨ñWÙ=Ê­Fæì£¨Y&Y]°\.”NqË­&NI+0Ïi‰³g«ß=„>øôÁâÏ@µL7'WmsòÓ$SžÆû©°ä|##+±°eü%t²d}s/I‡Iô	ÿ¯SDú3–Y"hj
ð·‰	Y¼³ê: p¶»¤ª4¹#&C‹ë¼xÔá*¾Ó>ÕÏí}ÌHê¶ÿì|¾´{1—û!ëöµù,|ÜŽŽ&žLÖŸ,?øÛF1Ÿî­QGXDkÜñò2»uA4F=òÌûòÅk«Œ¿:èrv}{ùî¶¡AÚîó{ï÷¯oßÝf×XJî›àzû¡ÏÀÊ}AÜ>/zçæÌ.zàƒn;óÛ`ùB 3Õ°vÚÃÊÜ¦-0¹çEÜ ¿ÝV’êª+–RôÜF÷"²±ø[×Xµâpw›¦Ô¶¥ÉâaøŸ7x÷]oÓ6­7«ÝÎw ·”²Wù;ð
vW.Àçñ.¯þ0W$z{÷Ò‰VÙxóÒ	õì˜]:·ïš*ÿ•Éè7Ï*ìlšH4­0ßÿ óŒžn`XfÖý>Ì2˜_Ð¨€ù%nOçWuese¥p’áfxè©è~®,Wþ¦õÓùMü÷oâŸT®oÿêîöürÛ2oðáXÒïÑ0;übe&ø¶¦9ÖUæÌ†BåKÃþV¶Å!hP&0µ¹‘«6OþôšufÕv]©¾Hê»ÆVÎ|ž‡ÍïwE¾ê2_s»|~ï~Ì×†yy˜WÜD	¤‹¼™Þ¯‰uHcÌž¼ÆÌÝ=8ŽÛÍxnö*QpcŽáÃ-nTsÙˆtøøN»ßéïã/7{û|A£o£Þ>_ÝàÏŸE=°®“;}Üäí4ÛQ¯Á7÷¢N{²røß··îÏ=4õ…¹#>èµ9âÖ4º¿—öî›¤ƒ>•‘¬™µ!Ûˆú÷Rlï(&»Qd7'tÏäm©Ä˜zNaÍ8±äòx•”\OÌÐtd¹eAˆ½F)Í{}Àm¡¥½A¿[·ÍN4¬<XZZÒZ·Àà›Ü8>ÌzsÇÝ=vÈgF´×îñÑïwe´µypÓû"IfÉ=(T]©â8Òß5åïºò÷jòwM¹¿¦Ü_Sî¯Ñý×GÜüîÚ£.|Únð	~‹O~˜#æƒÌu9 1“ùP i@»Á¸Ítá'³[2*©è{ûu‰ïÄí(®€¡sox×ññÝãVî6$[= d¨0¹ñ·‡KƒžUaŠ•LBªÈg²l<ŽðgÿêWŒÿ‡ÁøjÅ¿ÅöTli@|,¿‰W+ø,øÍ‰rºŒð&"Ç‹0nÌ(c3-Ãx^“Î¢îÇ-ŠïÓ($²« ÓˆåƒÏ:èÎXä»é¢®Üî\Ô£˜’q²Å·¢<Ì VÒ›çƒúb|ÝSmî2«5…Ì¸2Âdµ
E¶¦0–øœ¸Ç÷ÀÃ%Ðˆ7s*Šh‰ë$¸çF´×à»¡J¡IÌ·C4ýß•+`vCPQ5òŽ,QXoÔkÕz“î/¬s˜©›ùæÙ"·y³ûÀjðÈFÑ®'¬YžÔ)ÊŒ«—±’™Ô`yN‡Û{$á·o°&¢¯Øx! mBV.d–E’{;‘œå¦¢b+0)\ù«ôv#D•m½ß>ÆrB)?”ÚP¨8y…*E¤6²]œÇª=á=¾ó5°ðÔƒëSjBþíesl
•.W¾fÛªå%Œ¢Mm „™à*ï©¼Á¿q•‚‰¾©OwWTs›yÓÉUì½X……ŠN²Œ¦gò,Ò«Å#ÂÆ»¸ÝrBn*“ÕQÂ06•‰XPxl§±u²YÔáûû»rE°k;ªjÇìdÙ&È`ÖH).ÐERÎ¯‘œ;EËk¼áâcŽIöÎ§ÅI…q"qœ\ 'ÉÂIŠ?þ*
Æ ¨ûlW*™…t—.œ¶Õ™ÚõxFÍfÇÛñ¾Éð6»Ða'†Ã
Çõ<øüœNy^Hß·všbDw×Qàˆ¼b ËyÁeÛØGÇ²£.Øá­îïô÷+»ø’‰rˆ´zaëÏ«ì¼%»Ê wã]ë3Aoe-£J7ØRÂ¡4awÚjað…lG¡™Æo¼vâ½ÅK' êK|7T™7ûŠ´bŠñmŸÏíÖ&=Â>›'ÓW¡z*H?…ë¥ }dv¹a_/bb'ñ¤¬‘bCÐ®	<T“‡b2›àK’M\PçÎC»b²ê%ó®ÓÕLÆØ¾›N'qª‘dEB'«"Öïe~É±j(Ë:ÀõÌV'jäë°.ÿ§±oV6|``§Égµ8¨3ŒÔÜÜü[]Y1ûðÍ"£ú0…C¼§ƒ=«õ&ßŠ‚¢C”¿RôøB¨ñ‰…ü$5ø(Ä\ÞŠó[~æ3Ó.ªF-’Ô @-`c¥i[Ÿ…4'i7RR¦Á—¦ˆ~¥ÄLªhAÿ^%a¦Q1èt›$'v4ž¡½ù&K>,µ{ÍÎ¨Å5ãÜâÜ¼Ëñ =wùÿÀ×ÀñRZ›8GåU¥8ÅÃ%>šÝŠ‰5ÛÒ»RÉœàU’§{×%<¹šDãmõ8LkƒÅ)]hëæªõ‚b}‘©VGc©	E^¤£d…^ËEø²Âï8RÅƒ­A7·ŠìJ»ô…‡|Fÿ¡àkü\)ékÆ§?|õ‰u¥I¢MŒy/2tésrg¿Í*\‰•>'ƒ»×DèòwAÇ°ÏZ”(3<hÇÉê‘)_ K“Ú$Žmõ¤þ±’ìïíS¡!bþÅÏ	47Ì“Ântìíš
‡(dÞùlp‚ÿGoÎ…‹CîK?÷Kè¾Ëæ0}ëV])ÓÈG¨áPÐL³a0w±fr£I0— L{“6rŽ`ÌÕVj—WÖ«¾Íô]Å&ZÃL‹Uzª°ZB7:¥;ûJ t•"¥7D.|U–¯!#õ„øKB®­A4yË”ÌMLJRÒ¡&äå*æ¶.•—ËEb5…•!ÿ’]„Y¨™ejÇ´HSB½“Ý¼¨OòZÓé^53/N´sþ-¢ß@ mÉz×¦ÛÜ¼»}æÃþðöq›ê)ø6ß2!™¶¹\ÌÅãåS)Y8%Y`r\Xb\>Rº(Éñ[Š~N’ØÜAý_*xÙÿ*ÀÐ?KêÎ¤ú<•7‡g»æ²õe†˜…1ß1FÍ6ÿ
ü3¥´ñ? ê-¢ƒF§CÑ`ÜÐ·!Ž?¦„GÒ[1kWA²›“É )0R«ÛJ~M5fbl¢ ™ŠW%å¬(µl<ÜëSðpûÓê[•¤'æÙOR uÍéñÝ¢_ŽÚæ Lõ’´89«qbœ¼åY5NŽEÛœˆRCÝ×ÅmAÅ‹Â¯÷U2æd±/$ÑÉ 3ÌŒSg6”YÎ
 P–(oX…ÿu5c7UñËÇÀEÛ•7ÙNDÁø¯±2oG¨ È1b•LoH-”ë¤WAMÂÑåŽ¦HN1e”¤®§ÜØÆ]³¬Ï;dy™Aný°Ï€h‘:½ö b¨z¿¤Íök<n´;èùŠX·Ì±å½V>²<à%À'#àu1t›ôÈJìëúåšãóuÆråøÓh¥àš‚~ml°Æ¸!'v6Í‹C¦<>6ku“q²Y«›Œ—ÍZÝdÜlX/êÔŒIXñ	:‹XE¼±4’(Å Èô“¦‚(èe9xÛFëaÇ—^£x3#×©ÀÝÌk¼Îø Éèyf” 6zD¬L¬¢l²hÈÏo%…,n°!·¾ñ@òSIè €£×Y)Yý³º›¯’t†æ>¡Þ)Ecµ{‡#—Þ!èLpºaò½^MåeÁÓ³×ØÇRÜ÷…&…§-€çh˜qÿ&»ÙkÑŸaB˜9¸£ƒ:Øá¤’|²lõCü½t²ë‡,ÜÞHz519Ò~vÉ°§{Ê±”dpß»ÁR§²5ä‘ôÔÖFr¶ýZÛ®Ñpl< b_ûJyh¦Ê˜TVÉ"™(¯×T¾DìÆ´Ò%C@ÎeË~•dÕbÈŒ È\FL…×Ù¼¥¥ð›`ë2Åè=gìê)µ¦.šÅ®ãX|BWBÅžwçlÅzhZ™Ç®`?ä&:à’Œøô– ¤Ï6™2üOŸþðô«žRI´´¿´À“ -ƒðÝÕ×WËø»€‚ÏwD¼¨>â>³Âãì!h%,¨ßàéä¨…Ã2…ç†±Á^|H®Ýé==_ñEÖjÇpHÕ2B+¸ç¿+±V;8æü7'
H:–Yh¯L\Jøá-úÏ+ëL¢ ÁCä" ò#®ôŠª¼JhÝ Œ×Ì3(C ERùÁSºþUµ¾W¯
˜xEÑé€*V…Ü"µÅ}¸“jÓÍQ4§?Ï‰Õ$áŸ¶ Pk¥1K;ï0ÇÂ?Š.sˆ§µ™lÌôÙð`Av‡åúqFÆƒ™Ñ—(Œú'¡ûÉ¦'„.v«‰„&Œß‰€Z–9omö;ýA\þ1…u‰¢@Ôç<ƒ]â±µö!º)\/«ÀÕeˆít`ñZ~ÅM@Ô%qÿz¤?"ö½ÉÞ“Åü¯Ÿ^Ì¿õä·b)Ó}§ÑÚ/vêÓçÄÝMü{Ð?‚¿ëÀ£hxE=\êòé¯˜ôžaWÃ„‰åØÔÃ-Ï)€›ÿßhsÌ¹Ã-Ž‚Ÿ$~ÂàÜŸ	ºRwÆØsñ»GÏ‰Z¾S™ ²Ý'±¼ïE€Â-CÒ‘è	@À’³›éTÜÖ¨™E·ZªE›óe¡Ž4SÅ	0º²P–•~·£Å½v‘ZÀáÌákŠP§±q¤Eú‚ybk	•qa¯:I<(.©~ßi‚” ð»±úUå›K9ãÚ-ì Ë±¡WdÔ³JÌQFàªÝè&ZµÌ"% óxÿ‚òýÏÉo¬¢÷É<N.ý»Ó‹ËÍúÛˆÑ)¦•ZJ9œFíQ+4+t³rcfÞç®L÷„\ït
È\à!IðÂ˜
àï™Mú€ÌxùâýSy¡XÄ×]±‚þº…b¸3Ê¿<cí2I@N¹P¼ý¹nqè–ì´IÔ‹ßP0S~—öív¸RP—<¶'x$ì<œôúC 1È¼“!s‰à%F—ù]bÔwÚÞÇ\Ö½÷‘:+Äl÷Ô^§´ødrq
õ³uWá•@q•x½òz(¥\”êDèn‡w‡Û÷«Ãƒ¨Ñò8©´õÌæ§^ÖÔEÑ#Ú[¬m^Ž‰D¯®²_dñðØÁOÈð€k¯7æØxüÖÎ«ËÃƒižc¨»V£ÊMJÕ”Šž7Ý0HõMaÄÏ¢…öZµT =³gÓÐU{Cs>4¥Ÿøð(Žg§o›c:U:ô×’ð{É<ú,!\ì÷|›æC85yˆïUdW_“«2.|‹ÇLü‘È¯æ¢Ð’ºÝáy‡Ìˆ>ÍÚ­'hEúEˆíxk4ðþï$#@1’ƒ¹Ïæˆ;ùþø†Á…¶‹hÇØ·P:P'»ûÜf<4œf\òéIº=Éç©zº¼†49q‘íËk+nöeºÆ»î#¸|d.\¡£ jˆ0'·•%¯«ÃVV¦—ÖrRmrûvû½¾²†y-H¢½|†³Ÿ²ªw—‡-ÇAŸR9ïe‰`˜
SF¼`ÖüÉÓ=¯,­Ôg©‘Ž ÖÄx¤çæø·{>óÈ°³rCáÜ
NÅƒÍ÷V	R©“[×ðwxr¦€©¼÷Zl™`C8ÔìÃ“.s§f÷nA·ËSÆšyMÅIäÓ-óBr]Óu¢âö–2ìÿ  ÿÿì½{o#É‘/úÿ|ŠzÆ¢vDŠ½ZÝêYŠ¢ºå‘Ô²ÈžY£ÝPÉE7_f‘Ý-ËŽX‹ƒóÇÞÙ½ØcÜ½{ÖîØs¼_`¸•Æ~’™Y•U•™U¤¨™žõÐ5Y•ïŒŒŒŒŒøÅl=±“ôùCÄ4Ø‚ Ý¾¤$t9£Ý­ªˆÍ=SCäp·Òh½"}¸mžs»ëR‘â¹ó¿}K3,e{n¿«ŒPë‰:U¾öíOlnx•ümnòÆžK©[ñU÷¶È
b°„Uè·zU¦3
U‘J¿Á²Li[9ËÏ”ÅBy ÇU¶KÆ[3Œu(¥Ižú™Í<Oýø¦z6Øý€Žë)|BmBƒ)­§Ã¥C<ÿÚ§©Cóô­-g«]‡–*Ï¯¡÷üÒ7áo×|Cþð9ßÀõ÷8«AYü&W¤€\¯“`œD­³LæŒ¬G·¬ŽÓ-Å—ø7“ìl*+‰jøC§WŽ%ÿ­^,š¸jèŒ©o_d„‹E-&-’{°†Äßê*=×¾Œ(ÅëˆÒ[Rcìx¥ol%ÝÖŸFÓŒŸ4NN)<ZHtH7^¶DÉð\vÛ\›à€6‡¥·aê1Vwä~_µŠS—Lø˜*Ï¥þÍÞS éŒ%Ë¯z©Ñ¾£V¯º#jÈv½P˜Ýï<ýû”.>‡¿éÌ]#†ÂOïž›ø ,þN¦ýŠÉ‹þ›lmS 9ãxèñ0¬Í3`~y|jÔ›#¦"¿Z‘Ú°šñ“¼(¬µ”$n¹¬ÕˆôW¹—8Ÿ³áwãgÎå>¿÷'ãß|³äßù—œ
Î7Nfl[¸	°À?'@ï_pÜ÷Y1Øg˜mÒtÚ´ö¡ß—ÃéXN)ŽÙ¯ªaºéà‹Ìí!êæØít=\¼N(V"ózÃÉ×A‰{€…Û"loµj¶„ëåì²&˜YÖ§Í†Óä$†¿ÏúÎø¹·DþKæh&Jxz¼æs'Ó^byø]’òç÷õ“Oo… FõSÍà46Á’1€9õó	ý±5›Dce
gýhZºÿê“qw2qGXÛ‰È‡áßù—jâm¶^ÐmÞ~ÑGÕ¦+¶ßú©,²´n-òdì´&Ý–ÓKWð(œ<±øÆp’¶èIt›¬ie$á,HŒŒcé–Ù·”Yîi¶áÖyÁ¥F®¸´ÂÐ\mw°rùçžä|T2;Ê@³EŠbj²ÑDÔ_ºDw™%v­_å7¢nÄßøž(9ÉÉ¿”¥kÁC§wžû‘ëŒ{—)›P7a®Z+ƒÁÔéÉ
5õ=µÌ2­æ`š£æ|0ÙV´Ûhú„‰¯úïÛÐ`|¤„aªú3åçÚJ“«Íµ™&×Z4×Fš\ëÑ\ëÆ\¶é\2>!RR;%~Ž„9©‡æÄ=•Ðãº:''—^·å%çQfäa·s²Ã‘3¹HÎ§ÌImÐéu½y”Ù…ñqzÝ9æƒ¸§Û®O¦m8¨à„xâ«Œ¾'~›zˆ¸Ü&‡/¡ÛÑÍ3½¨:ž›5.…ðú(×1ÆaîuF!Å¾?çÇ.A¯È(d0KKË".gŠâ¾½¶O`ß}"ŠGyr)EûÓ^ObÇ?ãRÅ{Wúî]çü7±–]?›yðüš+½IŠÊSU }(L©â!(B?ÿ¹UT×¶\WJŠBb´3g9‚ÔBƒ£)LëM/ß­"~êAhtÆ­æÐd—§ˆÉCi•5j‹è‡-h¸ýÑÂ4m³S·5·ïÉ§WLHŒÛl@·®wÈzÁ_>u½JÓƒÚ·Ys8„ãæ€]ßÇ¨î†Ð—Ú‡^“‡Q¬9­‹d£	aN'ž¤=~.èÏTÿ<gžqæ3Ïf;$eå­•Ù5Ác%ÅgÀ RÌ“ >Œ†l3?ô)IÖ!O#¶ÐªDm~øeK¬P£ŸÅfËÐ¬ŸO>2æ2‡rµP¾ùøÌšB%kº`PÎèÐ¡}nàw<´+-R›¬:Pæàšeá¬o¤_¸ÙÉØ€¾¥¬©0[˜{ø‡VX‹¼ÆØË.H”MTù9ãK|Õm;$”&0ã÷;C>ì¯Ò |ôy×í¡€&&v‰ýœ-ÁôÑ¿þ$¸B‘ÖÂÏ{.»}
KgZ]:hêæ*Yý²š9¢XÐDt);-IêÒ—t?ZVX` %>b¦Ü6LdFù:%d+â{w•…‹Q^NOœ2ruÖ´fG?ñ)âé¶eÝ‹R”Ôæ5û„FŠS{>ãâœoÕˆ}Ù!†ëÆm=o_ÁshDÂ*áLÆºP¨<·íKöÇoÿ<œUôÌœÔgú"%5
xÇ©ëC¹—¢ð\X6—GÛCRY(©eI*ÍOj/s±é¼à`=žŠ^—$<C¦JÏWf]‡¡íyú}ý±žKÓiö8¢ýô%âÄSUäh¸Ãž EeUýy|ò±œ\!P÷$´dB2	ÌÙ•*zH#,FD…³P 4ª¨|­ÃQÃNÓT·/wIrâÆžÙPš­³˜.OÃ†÷ª4KÅáÅÁ í¾‚6G'Nôò»£…q±v~À´Šº¨µ
÷ýÒçEýI(ÕStðÚfÏŽrï]¡[L~0|™]Vô%èlõÌÌÒø¼lG'Åœæc;2æäb¶c“`É¢î…²)6ÛŠJ\P	›Ç¬eÏ¶™ÌZzÊÍ…qŽ³­0ž4Û³¶5¦ý+Õ¹: gÛ	;Ð…Î”/¥¹¡16šzÙ `£aÏìçºZd_ËFë6Ÿî*mÓëÓVËõ¼#¯c€ñô*8Ö™b6BßCwF_ÆÀÔ)ïï#íQò/¸á4ÿ¥RÔ¿çâ?Šdx#÷'ž”lLþ]ÜÒ¡¥Zä½ë#dÈ™–>I'mE<A³wø/ß]2Œ‡ÓnW¦íîäpØÉ>«S)¼DŒþÞU”±\³¬òC¥¬¨é6Ó2ËÑÓ°P!Î¤š_LþÙ,z_È»}w’¸M©ë%Ó8@/Ö
…Â¢¡Õ“×„è³•6Òð˜|É€«¢¯*ã€ÔxQPu`ïK„¹èËá¤Åâ'xóMá(ÃF¥%;Š_ “®ä½è„¡0ÖÙEn=ƒ¶;½áËãyrø^¶¸ãs}¦3Áw‡¯v2ØeJkðÿdó»‘3¹ÅvnËíd¨­åéO†ÝAäñ'°“)eX{'sTfkN‘¡ÚB±˜+^7‚Ÿ¬ø¢”_ß
žäò¥;åüfa³—ÛÈ¯×ý•¯þë‹b­½€dJ~ž ‡)Ëø•mâßŠ,¾Ì(ùÇk?K4Y½·
ƒ}3¬Ç°¤å$ëÄÁ’~*.€¯#à4·S#îXªèœÜ2á¹!ZÄe¯tå'#“–ˆLº(TVnyÝük&ÿúüGF¦!ŸS‡ƒJ²¼³í½€±Øð	l1ÇqZ(ˆ‰¥°ÁD!}…ÉŠÜA9ìHÂHßœ4WÈÂ­Èúíf¯£ü\K‹‰»I1Ïá•Éªgo<§Ÿ;4}¢§bX]”5d&¼X°:£5p3ëÎr ¼`øË$RC¯rètY7%
ÈJGáJf<b¸9!õMböùB¢—¹Ït9}à™x„™`ž‚^ ˜c0Ï¿ÆêKrÃèŠ±à"Ñ3Ð¬¸¹;€õÀ¿ÖÉþ?o<g)À29úÏˆÿE7à¿ã{íWèõ {u624ËaP.W K}c<pF€Î¹X ¿ó;øMq@Õv±Èži˜ Hû-äså¼;ógÄßBˆ‚,+F€³±zJáþöØW=°Í˜¨å;ö¶°°°ñ911o&æ©LÌ›‰yßZ&¶–gavÒ‡çý™Ikq-È¾ËFGfY €†Ÿ~“ìŽ·à¶Ù¯å;v÷–°»Lw©PÚÈÜ—‹Í‰÷Y×C­/ë;áµñ=%Ãz_ÛØLF Ñ^‘Hœ ¨y’Ú2fIzŒ’H¬½°€âÃ€v3GÃŒ(å
÷P^?ÀSo{:&Z¾nAB€æ$ …ËÜ“±òô´?ë¥Ñ»È­½­—Fˆ&‚×F¥"+{¹ÜF¿”[w6Ù&´/Öà_þ«PÄ¸ÊI»Ë…tý*9ìgÅR“t)¤ûðÃ„HXI‘­!9¡hÌ©ëM{è[È¸`R €«n|?²Þ¼É¯r¿ëÇ¸è¶aøŒ¬œ Û‘ ÎÎ‡¬éŒÙðœ‰ »0gè³Is’Å¬…QÌ!|\–—cgŒcIëoÞ¨=i¯ÅÓ@ÊépDK
Šh€¼]ŒÝ„GÅWó!¨#ž]bŒ1Ž—Ow&ÛaE6ùL‘&{"aÔ#·ËæŸÄÊçêg*–«Ÿ—È tÆ’ôà¥IÂ{{~ D.~`CjÛ@'K#;›rtqÝwÐ~Î þë‡ +Â×ç¨ƒRÅ’vRáa]E±!RìuP;EjGÚ°DÆÓ„Õš*ˆ(U“QÊ £”oIF‘]½™¤RærÊ:+–{klí°x‡m¦BK!ðÏì°DLô,nø4p«aÑñ¹4WøÉÉvè¡¥þ!0øcYpõïyôÖm2¬ùR]¯p‹ß“5!Í
ÿ«H*¥(Ù2hÈd]èÇŒùT${CQ–ß”Ö?‰ Êõò³Tƒ„ÔÜJ‘–A]A¿>‘¶Åºþ@›ã­?	¬zõmmp“Üx;Ó°‚Dh¬d(8*È¾ª9Ü(¤ÀÿÏ½¤ýÃG±Äî¼(õlí"_(ösù;å-øQ,ç·Ö7ZÅü:žB y¡”+æ766Y1¿Y.åÊ‡¾°µV.¿¹	ïÊår®”ß¸³&¾—ók÷°œ/¯±â%cô*_¼Sbe^+'ŸjD—o•„PëxPç?JVò{±q”Õ¤€©[ñã8£]ò?ÓâÿoG«#ûæ³ß½ùìõê›Ï ¢ß‰–õŒ$jºü”ÙØ›ßü:5¯8Â¹À›ûÂ¹5œw;âô¡ò6EçZÖæþQ¬G>#gk€ÐÕ²ë…ÕÒ:ü9¿ ¤GM¶BÔSEÇÐ#4†B;Þ[‘HPpûû;˜'œ+b²þy¤fäƒN¬#¾ñ¥Î2Óëgî›ÌÉaUR‰Éb\²°—lgš|e¡ofº |îÁ†ƒ:ñû8Å‹ðZwâÜH¾X€ƒ÷©ëàä…ê„Oà <Jðà&ÁE	Ö ‚Òö4.è‡+ ïâ`ˆGö´aû\§Q‡øq¦6MúõÐ­MRü\¼äÑ…œ	kþ^:4\Ñ©ÆýÇ¸_Sý	t'¦/i5ÿÎJ§Ã^/}Àº›Õ›Êoæ+©!k…âM-¨…eö2·VÐ4îYDžöÑe¶—D‰Ë‰'B—Õ$	óÖ[­ðY¤cÙn_P¦6Ã¯p{ý×_G[§–õ…vÙîˆO­÷Ÿ…ûIºÈž”¶ô=	¶Ãˆ\D[ß²²R›Ô¢5S‹–{ùßJáð7’’¹;¡¸¦ï³¬¦´øÜ)£Aò¦™’iÆvWŠý(.ÜRG~ÄÏ7í¶®oy“V^kŠ[Vû­÷e~fŠo‰Ÿb\â‡ÁÞ×³äUÃ]ú÷b?Ç€ºà—¦Ñ_
¢¬–´à–Ò†¦ÄÏ,þ$¼ÁÞÍàd4c0‹XlŸ¿èÂPFo’}–4†VçG¬Vg<É–VØRai¦83Å¢ªñâM‘&7`óFì²Çâx_ˆ7?c+Ã3!¦]Â#ìm3uqÍFkžé
KW]âÄ7µò¬±Ø¨˜ÈÐ!¢=Ý¾Æôs3Ù»GÝš1“4Úà0]³–ÁOUo…9ò9¯vbîÌ¥´»üÚ;z:{ÒèÑÄ‘‘	ë6ÂÙkŠ£EÐ×²ÁY	ÐÎVäN1B›10~ÔJŽõ¸áØC†Œ.¹›sèšß¶YE®ÂË³0Ov0ƒáïü‡/A!3²ÉÅx8í\Ð>g0R‹Y—©ŒméZ5æ‰Gö•X´…l×ÂV3ì°òCP½ÀæÜñ«a¦X;ø‰iéœ¦7ìMašHËG“DëÔ*»‚p.d³Fã03Ç¦ßtÏðkÙ2‚ÃíwÛ…òùf·_Áð-Ü*à<tÛÛÂX~·E|·E¼u[Ä¼ëöíÝ¢ÚÃï6	åóÍnî·p«ðUc·½a¨€ÍßmßmoÙ¶q³•üönü2§¨à¹Êbv9C’S‘‘é¿zÖ1sÇD`Ì¹—¹â¯fD>Žéô×ÌP×›&'¾\m8kábdºbÈ–UY»ŽW]¯¤™]±?KåçšMSçuÆ[5õ2- Ÿ½w¹¤¹f«1“ÃÙÉìËa.Ú#P•hê!êµ›uÌÍÖu'…aŽ†m¾	g»‘D%!êg—ÜùÂDƒ˜¡Ââ‡$_ª¹‘X!qý•Ý3.¢‡ïòcŠ!Ë9R!:©N'ÛÏrË[m*wèh–Iªûp?ujÓŸ>ÌøIˆ-*NŠ-&ÆæÉ’¬áðCwrøüóá'6…ƒ¬¨)†ó¹¡óúšè½¾$Ëpi|OÒ¸Óò_ù¼Kiˆ2n×oo¿$K:ä¤[ä0ñÜº©Ëlß7¡œÑe6Âg-´ùõÙ|hùg>ÃöÛau.Ê°}‹m>\wJ¬ÄÑRáË‹;þOø÷¢¸üÌ•>¾£¤Í•.rå~®ÈÖàtÆÊ}x
_àüøxí–íÕI ÒàZÏˆ`-=uqéŸq›V®‘Þºñ	@¼SI~»2]²1ö*ÚÛÚÒ$»|Äœ¢Õc¨4ÒMÖE‹R% ÷rÕùÛm(XÈSR¹F—Õ,«­[\VÂ7þ¶øŠ¤Zy©Î³÷.ÖbæÀÊÍV$ësþ/E|OüñSø™p¨úã¡ïÀöÉñ+q‰ß[½XKF>HF1†YŽ#úÜVõ\§MR&1^¥òBÝçC<F¼qi89$4ºõ}N&ÐÿÄñŸ}öù'à÷Ôø—þ†Fy–IúgªîŸü0„žðKßýçÒ’ø+ŒU€Ìš—ôk²uÅäè¶£4ÿƒ¶þwŸÅÿÒö¾šž¦ƒºNé„¶¶î$IøOð¥Þ%ýp=ÕÂóC³³øttl8³±ÛÄîØË³ Jm£ÌÃ.ñmKBí‡Ý`¹½p“½‰}‰×>ÈóÆ·ÖÌ¦ŒÆLšÆõr6vžÐäV…‚þÞÁƒƒFåUÚñ^å¸Zcõ‡µZ#&ã_9›ã[4œ&_e+´AË]"Ì}€‡ÕUö ¶tñj;—x¿Ãà—‚&* ÔÜ“¼ˆäåf¶˜í`p„ïÙ†Ïdß'TæWXð›'ý€WXa9‡eJº tƒ«2v”?ûÙ+Æ=¶Cµ_¯°ìÙ
ëRG»XCÜØ£¹=tØÁ¨<ÚFÃEŠ˜Hø#†‹G'ÏüÀLñef…eöÝæX~?B¸üR»=þ„^ü`
Ò@<¶<ïÑûÊ´«¿ÕÝ ð^	~<jM†âë1¬ùxÏm¹º«§x`2è5GoÇUìÇÄñÔv›‡wÛÎlÅõ–âJ\rÞ²£Ð€x¤wââøzáxÍùî ÕƒŠ½l´pºe}HhÄú›³ÀXi(ÈbÓøZWú,†…ó	àÏßÅZéõP\ð”ÐaúÔ)ª“ÐËñ"ä›p•26º®R™ÃT­°KW§ø‹ÒkùK-A‹è³zÙê¹°œ»°	adÊ©Ç.h¡¢98ËÝgK'üŸ
ÿgŸÿ³¤%àÉ°ÓéÑR1ú°•À8¢¶bÌh€G9~´J_DÈâpØÁz#Ñaä¯4¡(Ù5µ>7/T2ãµø'Ðò¤ÐÇ°Çp³á¶iÜ~NÃös5ÌEé³a4,¿:¤˜¥e*3œhsøbCÙN”|•òU”|ûæ|2É’Ö™"6J;”AWš e½£‹5öh(ò¨R£&±fj¯cÛ]<2,ŠÚ«Ñp<aÕúÇV{ÕB5¿©´äÏ•Ô<3%ÇÌáæ#{0ó÷½'‘}û©‰¡J°O.Õ—VOÄƒ=üE“+ÿDMi¸-g‘zÑa§xþ¹·£îòðäƒôáÙDx¨´g{Î%¬ík]@¬¸ÌÊ»Ä/.OÆ.]UA«ùqu¿ÆÀNÜ1ª'œŽ»¤óíá£3¾Ä¡1o¬!ç+aÚ¯ŒX88#Þ´*q!hcIc:ó×šÌ—³z%|‚‹æ‰>ÂéfHÖÖõöÇ]È2ƒÀ[‹—HÇÀ,Öm1\_PTi'Ä¿U´óO¸#ZÖoË‡Äq»1\ ·¢r%‡Sgáƒhû9‘Ç)óbÊ(f„S$dÖÇSÓMâþÆÏ{(Ùï„‰æµfºµÈ—/R–pÀÏ†J\&[fqÎ—A Úï¾rÛÙ"úÈ-½Oƒ\ÈÞ×³oÁ“ãâ6ÍAû´/“Âpª¾Tö(€êSÀ¦ fFÿ^}
eÜE´t§^©ê(dïE–23Ýx>yVo<Þ«7ê¬Z9­±£G{µCV¯>|ôèåàçqãááÔèiíÁA½Q;åA	å63ü]þ¹È|¯Â«ùúÙÓ<*$³K+KÚ0 OžUy¼V5§*ï(â+ÿw[/-_ƒ€#O]iuEðM*O¤Mn¼6š¸ÜQ¬Yšpk î_åÃ?ô“øÅ}ö,óÞ|…®g†“ËØ%s©ìjfÙ¥Lfiù:ól9¨)~f‘=øñÀ²I5{Ã¦àÈ»ð5û$ ¢§+ ºâ¬\T®Â«»­gBòÎtržÛº»¤jüˆÚcäÆOó­±ÌþÊÁï,ÖiÌÖëžC¾ö°5íãªä™k=e3NF“óä¹è>î6§°±d.Æî9œ—¡éÒ#zoè´!Ï³zõ¨~l×gDcg*½>’Ñ¼”„t¦,™ë3ÄnÎÃ8ê¿ËxÇœG„‘A»zÑíµ³Ø^S7Z6¬‹m.nìö‡/ÜPqÚÃ5¸«†˜ÉÉŸCüJè)IÑú¥P˜â#‚é+sˆW.áfAh]æ±éxð¿?p$$^È/ýp°ÿ]*[ÿˆºtTé~éã/Y¢¿>Óõ`›=ãR3F€D<©ÞÄ@wjãBaaãJWÍD„bÄÒ 3WVÈ‰´´í‘e}š
íÓ†‚E|ÕGv5„pÕRN€-áî²·Ïn„—ÙÐ
·5%N›­¬±C8x-gäF9“z^¡r‚¥†Åí x¶„÷|›5‡Ãžë Šƒ#ÊÛÎ2#,ê“î ,•½¤/ù!,"èpÌ³&©óPP{WÉ­cž;þ#UÝhƒËFÃÑtäáPöU>­¤LUgnHó}Ëë˜—~t'–EÛP‚Ç½çá¤ß3¥-ç ½šÓº˜áÌdÙSkÓ§šûdóí>©2—fòÙyO.†£‹©–Ô¿æˆs=ä„‹Á¹ÑÒ]CØqýáç*rüÑéÌPä>/ãœÊÐ¼OŠì°g¾1æÈZ~9×™û$y]“AÚ³?›Ó—d	82úÛ/³ÅŽ¤7¹ìIl†—.šÓ#ïîµï
C‹^·’9·è¸‹c,Žt×6Ã¿hÁçN¿Û»ÜFŽ7$«»üßëþDÔ-´¢2ÖBeH_eª¾¨'Ì´¥«E!(†èJ¸¾HxáŽ	 ƒØ=VÙfß+º¥;åf¨zxa®žÓ9M´1Ü¹µÿM§õ¼CÖ%9ÙŽóâùúùó4‡9œJ¼7˜‡·CY‡‹m†[:/¹çÚføSÇíµÃÓ²5ÇdõªáRZnü|ŠœÂ²'ß`•zE:íÍ¸}Zõ”BØy’©Oéjuˆôý—¾ÓÝë>Ý‘ÖÌÓ'¢þ¦¬‘†4û}4—y+¥…s^HÂ	voù´ïln6îJ#\ù¸¹¶^.Ü¹+P’Œv7ÃµßöÀh%§5gŸ›È]†ÀU»`±…üGÇ}§w½y:ÝAn2m³"äA2óc«×„¢¦#^“Ô{ÁIV7Ì÷ÞÝ{Tmüè¤F‰tÝ3½ÀW4¶{“î¤çÞ·ªÌUÙamïAízK¹LeÒð›­Wþ²Û§sÄtÜË.]L&#o{ugÃËw†Ãœ@F]/ßöW[žWúï‹;Èf¶_Âlý%œãî®Ãðß&ü·U(|¿Ýõà”v¹ã½tF&e7UÞwÛ]‡h¬`p9r:.aœ~àÀ×“>I%@!…~Ÿmôû&ÁŽãîÊÏTÐsøsà«@ŽÍçÝIŽZÇ_å¸ÕÑ6F£oÁ>jyekC~0Ì‰>31THô×–Íü†wÉR_H¢Y¢¹ƒSªç¼œçŽ»ç6·…ˆ`IéÏÊF¶ÐŒ÷Ö¹sÞ2g2÷=„å&Nw _Û0è'çÚ’IÈEÛ¬´–Ð-á„ç´»SF¡””üUŽ[ý2(›mÀáŠ;M'[X¡ÿåëV¯^+±Gæ{Ý6û^«Ù^w‹¶L/ÑNLáýÄ&vF½—H¼CK§,³Ä7°‡¶ÍQÊ¦‰¡9œL†}˜›Bª¹Yï9#8ˆü6Wg¼ÖÅpØËÛM^wœe•È!´ÿM³$…p—bIZ‹#ù‘¼DÐÂ~;ÀV¶e‘¸HFDJgëaòpzÓæL#ZL˜s9Jk›ëëwRý¦}ìåˆâ‚E«zKbK—ûîÄÉu1¸Ö¬üŠ=Í"¼kË>²>K„t¬¸‘‚°ÅŒgXtìI1½åòZqÝ ÿâ‡U}°¼ ÌsM,/ArÊÁçài¡ÙH˜äì=çÒÖ÷Î(3R}2£K¿ŸÏ²Ø}B‡þ³Äý<¶îÈ°”Hiá£ûâ†ÙNesñ	@Ö’dæÖŽ·áhžkÑ¡ûÞgeóË\ÉÂ¸î˜\<wÜuö.?&9ƒ‰¢\ÙX?_ÛÐjÓt:™¤8úœ»nÉ-ipçN±Yl.¬ç¦œ—[›ú”àôç.¢$t&Ó±ëYç]åJk	çŸï£Sž-¡ï<ËM¶… 69ŸLÓíäp³I±‹EñI.Ä;kN¹¹•F‚ßJ‚fa0¡ÝáŽ]œ›¦Å¤šÆ$A²Xè6oN¹d=ÄM6'òO³…&à6ä¯YÎ IòWDdLh÷7ßfÂá|†£½Ñi&t›üàgžÖ„ÍÛx«±jQ¸Ý[5«ÿîÙÐwcôøåýÊèîw^ênl¤=5vF (Èü¡Ë°á€l~v2ÂÆg—3÷ÿã¿üOF±ÇÑ",+VÉG­*ö„5P’ûw²îX4(¬ä±uD	`´“Qµö ìIÖÛ4 .×’OûÝv»çÚÆ[zQ”-UU
‹¨˜ÖßÖ/Už¬3÷«ÎØé9Ï½‹Kg…}äŒÎù´×]að&ª3vúìç¬æMÚ¨S)náƒƒcØk7‹ëk›)<%“ U)Èvî‘ThÅ?[§ðÝŠíVŽ?òíOéäÑþþAõ r(TíKhû9£)OïzA`¶„·ó4-•y<W§ÒÕ"í¡º
ÛwÅ¬j“†=lƒ"ìð:>´MÊ9U$¬ùäÀ8)Â~)WnB(+­³­¦‰æÏ¾ÁyuàÜ2_1¢è3cq§±èZ¸µHGiª{ï*|¥™Hi±þ•yÅèB3ß ‰*Íyóó~?9w„TŠM÷R`A½w%Mkl£™+•bÍ)Ü68·Ù[8`;"vØpÖhuYTr`GmiÜÚµî:=ªÂæ,…™Vw„±2S¶È.ÇX_z­qw41-Ä.X€µè ˆf¹ e—ö	ÓùÃ!¬¤öÒŠÑý.øÄŒsm‰ýÊ…ÌgÚ¯W€oÅÍy•Æw 0[Æ DHµ‚(¤½e¦1GQnó¾©:™ëjš¥MŒCÜ,Ö˜6G«7ô4¨Zm*`&m³{Î%Ì$Ë
ûe_˜¹^ÖXfk-«8E„ržÓõÜ\‹¹_t$yÈ’z8"8Í£aë¹â©hö ÇÕ¹5¡•ŒïÑ¬Ï–Â‚Xâék
ÅÛ1¸KßÐâWµYZ€Á~ÐP‹‹¡Á*b2qQFûý„ºnð‹ÆÏ5·Ž5s¨skë}éØº§÷÷%)ŽœÃÆÀžö¥%,ÕglÛ‘3¹È‡}èê}VÈK(ŸpäWsÃµÏuOõŒJ¸b£ôpÑg¯‡Ì)·Í‰ÅÓþŠRE·/~*Ë»ïLÆÝWaÿ=¿†—@ÆNWë#Ö°R¨w9hÑ4È5“Äoø}]nÕ¿ìy"¢Ô•ðBùŽ½Mèkd;†¿ì ävÕŽÛCî9I^ü·°½@ìï Rµ
DrœS à‰Çª42’)rÈ3æÒÒº×(.8H|iJãŸ#<%*‰#©oº ol‚œ

@GFqg-]ªÃeræ×—>ñµÉkæÆÇ—B”æâ¶âØý\ßÇ·ñFé¨,¢¨U}£…¿Jl˜˜‹®¢­Íüú]\(m÷Ü™ö&è*ØÃÛ2ôÔ›Œ	=ZC´Ï‹„3Oz˜I 2	{ÕFj½KØržC˜é–ù^¥QÙ­Ôk¬r¼Çv+Õjðoí¯N6XõÑ^5jÕ¨k[=‚AíÀÔáÌÞwªÃ6n$Ïr9VÌè‘RÊ‘xSŽ]¶çöQ¹<ºè¶¼wª§µJª¨ìÖ|°/Ó%~žuÛìãÊiõaå4»TprzpT9ýû¨ö#îäŽþ'~
tBbÇìøñá!Ï¯d‚Rì½„§
Šˆ¦@vpÜ¨=¨F^u`äq›ó6{Ãaû/”Fj*‘{
ì³ëÎ’úà'¤‹ ?Kw8•š`¯¶_y|Ø€¥Mka‰UÖª!R%=8fYùjm‚ù’YZ­DÀ?Ïƒ!:#YagLY}|zZ;nœáÃwpEÃìÀ¼Bô ä¦0Ó0?ºã®ëÏ÷Áñ^í¯Ð‡óLÎù™ÇÁ½ûd¥‰[‘ó³"z&*)å¹ÚÖ¸rê<â#Ñ\˜¸”­•“Wð )¬^;EÝ~Œ¸DxZÛ¯A¿«µzÐÜ é2vc¯vXƒÚ«•zµ²Wã¥‘~ý¬‹ã£'9)jšÝZã“Zí˜hq‹bB.Q8ÖÓ#ŒÌêŽw™GkÄÁq>­lƒ›)f¶Yæ]VJø­‚ßÊøm¾„+˜5¤‘€ê·Õ§¨«ë¥ííŸxÃA“×O~g¢N¿2yAMÄ¡Li”éù GPùLT5»¾ÂJ]ò‘k:BmŸ9Ö88ªÕ•£“­úoxžÇÇ?|\cÊü­¨µBÃ½,‰ûäpuÔ©ÿðåf§‰.Ùâ…wŸW›óCÐð~zŸô`/ñè››€À&‰ôÑ)ÐÔÉa¥Zcû«  ¿ 3e0x™ÙåwNkÇ§ÇuÖ8=x€ãW©³÷Þ{g¯V=¬œÖ¨cPßøŠ­>:Ýã;ÝøÇTóm_àrŒoød^gøåníÁÁ1%Ù‡ÖóÊ€•Ôî«Ø_÷O1"3Ôêžá]Bö¸öI> «evøèÑ‰¿·ìóbx˜,ÇkÇ¡ÝGvZ!¿~ÀSµÚa=^PESäh‚5w°Ïãwl+ÿE°+arZt7’BÐzPSllC½	%zG’rCÝÁšô+Ê=}ôøx/›Åoo‹E$½x©Hÿ©Œò\a¢ï‡õZºšp!ã%ÇÎeuBâØrä©9]cú»ï@)wßyï=vX9~ð¸ò ÆF½QÇûi–¢dî‚ú'ãÎ™4+èè÷àñ\hOhƒ¦¤B®Uªa´>y§öWµêãFÚ¥x7®fòÑåäb8x4r£ËW=)	'«¡xü‚Ìú¿òt±<‚'Ú¢æ¬‚p}R¢`ýãÁ>ˆ˜+l—ìnVX½Ûv#ÅL'Ýž_
ƒ0÷½ipÆmõßydV”]@ª÷ÉE@±.ŸÄwe+æ¼RœR—·©ÿ™G‡} 
ÖÇš.0Å.\ù¥Y›©Aäåpü¼9>'‘¡/öõ Yy*¶>aw<ÎfÑÐ¦„ICz+LEÐ[!þ«ÈïçC}‰0Dþ¸}"’åà!¤÷²™ç‘x”ç¾	;ì<£€õ\ƒv	èþ{¬6 	˜L[ñVÉ“Å $¿—÷.\wò1|}Rx
?†/@BÕÇªã©«–Õ€MÝC[sFûÉêî!B"(áiî‡ê®°^]/ÃMŽ=ÃÌg".
Zfø ôÐã,UñµýÒ~!\¼ÿÌP<?÷$½¿¿_ªVÃEûÏE¦œÜlhàÞH³å3CÙœ'7»Z[ÛÛˆ4[>3Í‰ÍÏ(BÀñ€ì€ ó«N¯Ûw!7Zñí‹+d›·ƒd²Â‚(a³ZC˜½9+î—î”7Eac·+n|†Æö²
~ú¨›\tg"ÌÜŽàa23Úì CËò+ö%L¾$‹[ªÒGÅ7#s¡™rL†£™ÒsË¹Y(Çrh½§Ø¥HÉÊA.þ¾;î¸gŒÍTŠÛ•3’ç<ÔZfæEÌË„JÊ'OØ†nòs7+ïÈÝaÒå÷ìÅpÜýN{;RnÅ·áòÉ¢ˆî¬òï Ï•Þ“âÓü›B™å’²¢U‚*©-*Ñ@g„“Ê…‚žVZWÁN2®º»Úu&TjŠAƒÓ…w[áa[Û]_ß(Gy+ÃVR†­TP	O(”q/„Ç·97S?$Ðß¸¡úx`„?@âqN¶¸Û¶éCñè`Ê¥eJÛ/aË7å· ±–½Ÿy*ûÁAæ²Ož.C[ÉÄ~lèâšÚÅ ‹Øo8­Á	íä¦};²¢“+¬(â„.1k¨¿! âÎMˆE;~I<¬ðÅr([^0zŒ¼å„0íðë›O¼_”Ï5ê§3_¡¡Åã¾Îüá¢JõwhÀ"âÜ
[W.>'PPœðDRp©61¼E9°ð0·¶,G,´9%R’…ˆÖ>ÉÀ¦ùÔ/LÝœË*ÇÊBß¼¥­ÅJÐ²YNÁC

ã]ÏeˆÌqÂžÀ8Â(”Ÿ“ckå[^ý¥¨ÈJÆ±KÈçù“–&¸ŸôRÙ"ê]ÊÅåÐˆ!ÒI„E…‡[<z\ÕÌk-ô–+Ïø]Ž¼¼CT6ƒuÂ8]]“†=™ÅEFIÃh¢ƒU$#ëŠ—b%F?Ñâæ7™Ç„f?ÝóÐhí 
1<ÔAg8UDþP:·/ë$¡,UÆO,¬’P˜"ÔÇÒ)TÈ¬ûêé3tC
tW¥™öXåpvÿþ;dYxæ±2ˆYåMøo+xBâEÞ¬]*ð_À´6$Ñœ/íT=>nìgkhéy½]9 qÃÍ,/ÍÀaÃ,Š[ØjHÍ&¢Å<EŽ¤qNa,c3ÍøUn0~›·>~›óŽßæÆoK?ºlå4hT>¢—ïÃf&ž­Æ^b ¦¹vëÖvkÞ…Œ<²Ëj¤
Bˆ‡©²æDJñ.
	"½¯7ª<E [ª,=Í“-:”µnI·«¤+–-	«JÂMKº=%]i-ÌƒíwØÝFXœŒ—ÓPf[ËAÁkæÄ3BeAÎ;3åÜœ;ç–’³¨ž_›yÏyáfÏ3„íÍOegêIôÌ?~æ_õ¼W™e“2y0l»´÷üÄ‹h’ééêŒ4ÀK.Oƒ€›·ò›øwsÚí)–1”­ŽÚÇ¬ï÷³„gŒk{=n‚Á›ãkl¹é˜hƒ¢?½ë'%'JDâZ°c:zžýñ3E7›c?V½~ÌÍ)!W—âÁõŠ…Ô¤<t»æDVWÑú€ë]NakÝuZÆ¼Ò&TI™°Äµ.KJK¥b—§…yÆ”˜'¢×ÁÒ¼Ê™¥ ,Á¯Èˆ­VÇ]#×'Ýu~8à=\‘ÎÃWÌwšškú–Ø5·FErŽâ#è¸v
ßà)áÉy§)’«|"Eª¬÷Š,wÁo‚˜ä¹ðŒ{ê-ñü¡„ÉÈ—5Ï–œ/¼Êw'^¨bPa~zÇÉÓÏ©€ÔYóÑ‚â'ÒÉþÜýø_ŠÛaz‹hŒà¿B*#x!WíŸ…*H˜P_cdšÒÈøûå.l
JÊ”Öä”ó\U$ÕC}g4ê:þÏpIkQW.
CºP$¤¶w‚¦-'I‰ÄFRÕK"Úï.ðìî“§Ëd£Å=;}MS(¨†ªŒôø”„óÐ ®)Mƒßªv*ü/½‰³¸û+¶ÈêÑÎ@(wfZøásÌbV¾æp9+ÝE”Ò¬Ž ®øm †øPtéJ{„RÛ#UñÒ…}ž¼Ü_qžœc‚0KVÊIc ¬×ò³'ã¿yÜ,.d5D]“GÌw|+$->Ú¨¨Ä%C€Oûx®$;¢$”¬o¤:E•©üPGñàFºpF*4=–­ö5/É€·‚/nYRÂè‰PƒÂü€¦ššâ*Ð|q×qYS­üJž2„–8Ï½¬Ø#øã]ß|èDÒqhK{c
–×ˆSyƒÁágOúðå#ü²_—ýåþ„‡Z¹#]1q¡»Ë3ÿpúcrä„öà	5øÁù?~&×Y¨ÐÍù­Ý2ÊA!pÜ~ˆað`Õ’Ï‡æÊáˆµßÎVb"Æ*›½b"Êj­?B,a.®0b¿´\"kÅÄ Ò²¨Z©¶µ_1‹˜”6wJ6¥Í›–Q)™EÞÀþŸ‚dŠ‘ÂU»¦š]Ï²qù… òšê.“°¯D2~È–pLÈ§+ÅŽ2i÷‹º¿ƒgÐ9{Âé(uûÓµr![6·®P¶lû‚ZKÃ‰E	. ½Ñ2¶õBØ©´²˜J¹FÚJ÷T)™¬„ç‹oqËaY¡Ž.?„¶«Šï\­Œ‡(_ÕsWó¾´¬¨"t	ÊA‚Ýûµà}©’á[T'üƒû9~Áý<š½d_ÓV¿$¸£M°™”`+ÜEHâ¼tºR‚T)ÜOd.7ûcChµÐï,t¤"HÿpmÒÈ øIûÜC…Ñ]"xð>ú»‚õ~Qi˜Œg—¡€v0A€¾s+E-rè¶ÑÂ82½‡¡ÝXê©ÓKý>Û
#§§ÅIO•~"þhy¢ü¡Û{á"gbÇîˆMë!ËM å) "loFO60¯O!nÃÒ5€‰§ÀâÔ‚ÂÚºýŽÀ·µEZµ!gý*ÙF@l3üµ	fOmmž7mêÆ––MØXÛ\ÛjÆËSq*ËÚ"ª¦Óî¸	ÄÁ{NA)6`>Ÿþk¾ŸN³¥—zfÙÉ$äcI'¢›0ŒMˆÅöö„ÐˆSÀ;š–½e˜Ì0Â)@ƒÍž	ýR‡:Ù˜¡}“[@7jn¸<+n*ÜpyVxÛT˜¶ÿÐ¡Õ†°iCÄ€D›wV­4Š)›AVkC‡5rÃü ŠójFuMÉ²PÍ BSÌTœâ0‘©@!#Po÷¢°ukÔA3¦Fe41FAö¬ ‹œ®{@tƒv"mK™ûOK!’úw%wÔû‘
Len—
ƒæƒŒñŸòé»¹œðN»(%ærÑtI d7›\l>(1å‡ÿU"^	|«øAD€Od#Õ6“Ùa³“#ûTÁ&$· zºÌ×Œø ÛÎ•^õØ(·Áx8øéñu‰:Á“.sZ|7Í£«Õ¿`áHX Xû‹U¶F´½È‰E"of½Î6}Gu-|‡~ô½çR>ç¬’uœQnÍÃ-Ø¨™[7ÀÓÝK…@«´/Ô¬·ÄúÍ\Ñ†I¬0^Î(Wd07hù‘ƒi ±~"§þ¬ô:‘y£ôÐ;Ð^õÂm=¯ÿtêŒ]µÎŸ—ðŸ7Ÿ»¹'¥üúÓ[µaÚEWsäýE946¸+4{ˆ„@ý¡±¿S½&ßzN› r¡ 1rXº­}_çÚÍ/la%”çC×©Mä-ñ”öÁFÏ·3ÜÆ,ÃZ¾W®ï¦ÆñPÐòV„ÍµêmNfªÝ‡hù½Ë&¾›®}HÙáq¯5~€‡ƒ:B¼I49/oì¿’×/Jrd¢“%«‹vã½6Rl˜.åZi¯råü:]Â²„“‘;ïN$)cMÚ¥"óÜÞyŽ<ªpÕÓ/aÐeÆPŒtç*©4 Ã=(ÀHwûÎÄÍ¦=Ïµ,i2pe	}}ÍRáæšW”˜+3­Oû Z^¢½Ä¸Ûb„‚÷òé˜*ð2U8×ß~–pƒŸkœ“ZxedñP	'	þ˜ÊT÷ýÄ#ÍÔa:žèbfþ@S|b]-yª¶¾ÎFA¯cãí=œŠP›Ö¡Ië’JD=·TghOP:Î±öó¹@Vç³`8àzÚ—0p·ÅŠï­©»×1Ô†Œ¿?Á˜`™ûW|&ŽPs¦ÖxŸ¦åó¶Ó¬ÂSiôäïÍ‚ÉÞ5ÿÇùŸo;ÍV”©ã*BÂˆVvŸlcðOJœóë÷ÿÜ(ÕAkgŸNù¯8•òçî4ÊQW=–}ˆÊø¶¼ åC»b¬
€Ø5Cœ³?7ªlö¦®O”ô#N“ôøvIòÿùm'IJ† EÒ)Z¤ã¼×ë¶Üla¥¼|Ír1QùF$k|a¥¹ÄÃÍ^=}<¤“g…ÛÊ£ág:¡:q¬V7ãAêRÒ
Ø1Ù½ß6Ëîë|Ué”ŽpÍ·ãŒ¦C—uí»=Â7DE/†~@“ Á¯¼IÍB¥‰Ú•¦7ìM'.ž•Ý	ŒLŒ¡re&õýËž™Ã‡v»â¢‹½²¨H8þ˜±¤âNO
µòÖÛB+ÕtÙ¹Êº>k$ÖÍÃÙ¶ƒ®XÁ²­¼¬8÷bØºÚÉˆÁ“®ÜÍK²·f«ì`/ŸÏÛz¢Œ÷K~õrwØhÃKuƒž“r‰t$­©·-§*þx8PXUŒZ¦òØ°R‘H‚9Üä,jàuqáåj“ßÙíðd»–tÂ²,®
ÞG¨š±-Ïí¹-39ÅÈDÐ6æ²SŠRDzrIÖûóiÒ÷Ðo„·JÔèp2á1Ür"„›nöõtbš@ËŽˆ!óÁÍTz=üƒPJ@ôo^ÿñÍëOß¼þ|û·7Ÿý·7¯¿|óÙ/ß¼þ—7¯ÿto•gO]þº¼XŸ9ë†Ìº1sÖM™usæ¬[2ëÖÌYïÈ¬wfÎZ,È¼ÅBRæ{«|ÝX¡ŒTu{ËPÆ»ºÑB…|·Õ¥(CŽÅÖâë¯Þ¼þ{ø;3yU2÷%ATfÎ¼dÞ9s5È\]asi»N	‡ãE’5•</9Sæì19.G©ùÏ„œ•ƒJ¾ïŒ²Ù>w{í´¹“@üV5øH²yî^î\aŽk9AôNACa2š‡<=¤ "‚9ùšô=ƒåÍ‹I¨OŽj—‰)~è•-pM&+E”h%Æ)š¸"8	¿jãT&PÞ6KhVÂJL)ÓUsèZ–¢ÆnËÅBìRA=“+ôd]Š]€E„]ýÅntPâòËØÛe0Æhõt0*å¶×©uŽ©ÖhI1Ñ<
Í,9x]¸84cœS?tz†Ï<·@3nhné?·ôkÓŸéL­_þmLí)…	á–2sÏìœzAdABm²Kå{õ‰ÍÔãåØéUqªql¨&®mY7›EDë“[ÄÉÕØÀ“±CçUã%õ,ÆÄ[_Òßè…tÀKüëèî c×nÐ²°Ž:ÀF9ÂþŠcv—<º!RM†¬uÙê	ƒ„,9É±ÿøþ/‰šKßE|.üÊ5×ËvÛûéz–™&óË`"‘q‰Ú+B½à¤fÙàæàS¼hª¦ZÿØÆ¡RšVùr¯êP­"4’U1ÍMŒ|†Ee®Çø‰bZ¡åGÊíxÉgÑ7k]‹ÕæHkO"/Õ6b‹‚‡'ÙIR3Oó“h“äó:+I¡aE,'KC¬|QTÅC1	qk	ö@¨8{îô<»ÚïÛLfBx*¬×ÃTæ¿(/”ÈÄ†¾
ƒÉY}qÜ	5ðá|=ô…ž«ÿiÉKÞBÇé+x³X7Œ7"0NªÅÂBÈ¬Òn³c÷¥›Óî:°Íû¡IJn hxP¡¨ëhØvzã`Vr‹œž8õùdñDx¿<EZ[›ŸÒè4«%­RŒ´æ$–“Þ4bö¶¯-Û­k%iàŠ1MO¦÷‹¾-=rºM %º=M}OšÚ]YüHç=øqÑmÃÐ¤¼-õs½¢+Cóy@q	]‹Fï/4Öïr/áÌ LN6ñ?E$÷±ý&9j¿¾>ŽZO,i@Ô ÀÒ"juÈ>ýÏ[¨#;å¬êk£MÌÜ¯bû¹ë)mÙÊöq§æ®-‚‹k)û‚ÈVs×„|`½Ä0ÆñóK~M¶*ÑiŽ¯±ž”F¯Î
gëðwÜi:ÙÂ
ý/_(/?e?Ë•Áš“j}‰}°•%‚­mã ~¤BÒ Â/ÄÎIŽ&?ðY^ÃÝ”¥_ÒÅ8ÝOþhˆôý—¾_àßý1Þ;™§OBlµ¡:ãu=~Z&<éXüÛ¤2ŒN<ÑRYb"ÆuÒ| ®Ó¤÷êí³#T‘©ËCÙpû+—É÷½¤éçÜ>dKŠaáêVÈ¶p«P ø—¥e^?³,~ì+„Š"ÎòåàZMº’KÛÂ!ŽœVwRõz`A%è6mùÉ«ž±„s½LþÙéŒÝ…'oðÈviÙ„o„(-êkÂéªçË¨µºÙ ©X*}3÷+Í›•^*ÄKç\må”- sÿý¤ŠTgIí[»œqoBøJCª@È]2ñ%0×4èpÉÛ*;$÷;,Àb·³º{¶îÊ$m¼£ªƒ”L¬NÆgf°ÍëÈœKñ©˜ÉåK~Ž‡"˜p©¶ïLZt)Á¯é`ip³ôÞ’É|\Œn[~ŸV£~ÆšÖ‘Y.iZËÑÀ
¶_¥ÚÆ•Þ2xq,ª².ÛW²$äY]E=µ[S^ìá@‹èŠÀ’z]7<ú	b+,EÚ·“{:K„oç2QpÐDüVÇÑÛ[ýèCw+#›\ˆ&·¾×¬ˆfåAÔ…ªVT˜NZQøì Äûœ'dCå®	DHÊeÅéÅ‚—[?ƒl5æ‚S0•!Fâ+&$ã^-‡ì	ïÀÎ å‡Û;!ŠQâÆ)ÛÖŽð´*ßð´dØd|ÖÖ†11Íç÷ kÀBGàÏëdîÃ?iûçÓnÞÇ #FÏb[•	]p'ñlxÓî•L‚¶2›ë){ˆØ¬·5‘tÊÖùIö#ó´ÿp%Š×Âú»ƒÎòMÇd-2»ÍFì8QO×œ“t¼.‰ã5Tâ´OõT§štXö»c{‰Â±4v‰,íU6%á:æâ}‡lRùÃàrLÝ| $*Ø÷aE«º84iZ”˜´§¡:¯“ôsTÆ×ZÊ•´w	é¶„†åoá	Ò>åj™_ÕÂ?·«pQë¸™6D-‰GpJ!nA	4:«jö¹Ö YÄá¸„	©óÌ;,PY+¼¸\(D9MÑ¤¤ÛŒú˜Yxº1AQOŽˆ”ÓÍ=‹wL@Pî_T\†€=$tD–µ–º+
H¯Ú£ÊMzäßÿÞ´;TÐû²“¾Î³‡Ïô½àyJ…ÂêFêž¤[(©ejþÁm>õF1«î’"7”“a§Óƒ“-NFV²—Ì,í¦Qæ":ðµt[Äã&ýçEîŽÐp›å÷®‚)N£¢”nyõì½ðfÆrèâ¥Š‘Úf˜€h‘ó¹mW–[¡Ý‚//¥¯9ýÎMÄýÙÿ'Q˜ˆ[W¦ÓÅµã¹¥ôC;›D‘R¨NT´òO¢º•È;Mj<ÚBÛºv¿Øó‡YBŒ&{q©:´­¬–ðh¢žé}41°b\üÈøFÁ³ŒØø¨(*“¯aPÔ9s
¿J8¯¦_}²‘ú–Hx©ŒZ“eDòßBmÑR˜RIÒÃQ¤¼-J·ª¯ òë÷SŸR¤JTq'ÞØØÁsŸÕI€•©}­‚1F_ÚÀùŽËÝëèv08²ýápb±A²ùÓ+H~q;oÆì·Œ@øž#0dN¨ÂŠ—Ô¦äIÆÍ&G*+jo6ŸÊ@cp¾Fç›¾¦ ßŽ¢Ÿ)Òrú£¿^w¹’ÖNî^Ù7¯ÿüõæõŸÞ¼þ2ÁÞœ%c~ÍC©;uÜ|5 ªúq[ãß¼yýù›Ï~ñæõoÑ	Ý CCúëoÝ?:€!Â$¸ñx'šûÊñÚ…,¹šÿ}]¹Ãùë/ˆŠ¿$ØÿA¯þ‰S4ü~Mß>ÿÖMD
ÿNåºáÆ“K;	}gü$œUFG›ël>,a¹ÃÊ½Ôz—ìã®û’àÔÓÀßÏ}eið‹µ§n§ë…Qúì]šé•Ýþs¯öqíðÑIí”íU•ÝJ½Æ¾Ïv+ÕjÇ{¬úh¯Æµ£“ÃJ£Vgµ¿:ytÚ`ïÎ
¡s'¶È›	Õ>4b*Õ<ð¦?ÉmÆ›)­EG¹õ˜Á¥ÆXã—ZÃb‡×Äøž,vX
§ ¶/|Tž6Ñ$T³øñ/‡`Çë‚$d(ìb-¶.¼¾á™¹Ù µN èlohJx`Ô]H>ñØÃióÞêÅšmqÏ‰á_@9Å”*ˆ“¡7éŒÝúQÁÍGÔk]¸}G¸\ß{ì Ý&;¹œ\d²p<l»ùŸxÌåÝõZãîz›¥ì-H<ì‹P¢I¡…Âx,BL Â"Ÿ·l6/I†Õ2½ÕºAðk¢à¶©àƒ¬JÊÑÝ?aº9Ž”¸ãHQÝl‚½à-£¿ç¾`µAc¼(åÆ~™9~Ò)†¢k7œ&«Ãd<üLž¬i	üˆX¨‹ÛÓ¦3&…¡¹ë‰qd®X·áÇˆ—VXÏiºÍ{~û[—ï[ÐÏm6âo<þ˜ú®„4Ô1"BŽÖÁ©;;¹ƒÑå«ÞrP½y$ž§¬ã«5üßŸú‹&+bœ5Dƒ£§èBûül""wE:¢ÙBW0¿–hÀ/Ó)û)¿¢Î€#‘ì{Cúp(­,Éâ.:²T“lÈ9ËKa§]¦ôÓ¹z––kYç}ã]Œ»ƒç¹€—þj¢™+%©|œh«é.…·<A_‚&Äa~eJ`-®®%ê‡¶ƒò°s#‡0"›FìÚ¯dW<Ù4ðVÛJ¢Q›fÇîdIãÚÿÂålq·7„ißã1lRóE’¯)Ja÷’¨|8Á$Ù-yÑDÖ‚àø-3.îT«DÖ¢vª”ãsÑy¸¤RŽà”3sBµ)an8»ÃÏÓüywÐÎNèúÙ®ÛØj^þ0EóðÎ6ýæÀyÑí8“á8ßêuGÍ¡3nópŽ8OY9aV©‡á"G]·¼/Þ’„¬nßN'YŸŸe¦½Þò
ƒ•^°”r
DÉ½œ	 ¥;Ôy*¬*jm°>z—Ã\Èçv#™¤×±#“ˆ‚N¸(Ö5†nZZr(õD’`~/ÁFZ/³*7ŒM¯Ü¹Ï§ø]ö¿ú<…&Âr8J²ÃNê4ä2|D+Óþ&Êfê?õø’ûûkF¯Jð^¾7
‡¦‰JÅB—Öx¸[¼rÛ¬ï¼Ê]äž”·¨w#\:£±oð/p]Éãa‡~NûMe¡)oð€ªîû6`½Ì"w	öýïkv3s0'6*.¶QÌ^íXXd¿˜£aêÖ%F¶3mÀÜ/HG¥ÍaÎ×ËÙè­;J7‡×Øñ£ÆAµÆvUN÷ØÉãÝÃƒúÃÚiL¾¹r0ò—‡”‘œt[¼çÑ5Ÿˆám²EžºeH €±·\B*Áó¿V‹V®â¸­›´»iâÙ‘«ÍZ,]”¨/GŠB½JæþÉ´Ùëzì¥Ãcls¨£<íŽ‡N»å€8<?ï¶Ð"­Ihd=ÖîŽÝ*p1X<ÅOæm`»(”T+f¦éêÓf¿;ñ‘ðxÕyùø#žà‡r™ÏÛwÎ!],Iø:?0Ú#Eçh—to•rË&ðm³Ý‚‚½mN4v:í¢ÆÛ˜Bâb*ƒ·ƒœ'Ó©á1#e GÊ:Á_±|>¿V¸IÖ6cfwI‡š)Q·ü”<-F‰‚b@_˜—rÑª¨i2•™Ü
­ÓÐ6|ÛÝ‚ß•R(Àg#ß9¸
Ë»3_&/“x¬6»éµD3Ä§¡?YxŒ¹bÇN‰&ZLO‰©H/d7í;‘s>fÌ	»îí¸´iÈÜÀ¿$ƒ®ÆŠpZNÛíw[™ûñmŽBÜWN?s¿S`ûà®¦÷ˆH	RñzÈ5²4È€aÃJ2‰“K^ÞÂx“Íá+?g¬ÛÞÉp™)7ê…¶P¶ÉVVOLæ¶5ë—s+«­¬5ÑŠ–™X1¡•TÁŒnø~L§iR"„"ËÅ<º6°HÎ(Q8‡ÎÚ¦@m{¤æûGÎø9{Ly’vÿ9® ¿	F’L•ÜNê'AÇ"©_z;We‹Õúü²Œˆ
~ÒŒoü;yFóŠk/wóHfÏèzïw;h]Èl½ä„`Îôfº-ºî]’g#8 (Ç#~41tÖ|Gpo'ñ7¦C7™…ð› Œ^;âmòæ¬ÅcðSo„m;šnÞâÑt¾h`È#nBÔ…å™Î¢&Nf
Êd¼Ø½’'Ž¥ÒÓ^®ò³‡ÁÂØÈ¨rlÏ…º€·,­Ï¤þÁZ¼¾BôK$6ÂC!%-‚ö™/	‚Ê:½óúB©(ÝtäíÂPQÎýOAÆ€S[ ‹·\ˆ4$¥~Â@MÓ ŒºîygU_ä~\wé‰¬@­·íº”îâuk«w¸*†I¥KSMµ]ŒºøZK`†*AKÃ¨ÙPH¨KFb±ÛEu$ÆU°¥µéKç¹|5˜¡ÕbÆ Ìh>ër+ä's;ƒ*K8ì[m`âc’€±G…æB¾rÊmoS3 mQì’­•"CE÷ïÂ`¦  †K“¾…(–UŠ'6ë…{0M€Kbâ‡]"øõäkr~¸½F-EÍâ	þ8¤°xmWÞ);u¯ôÒ!ƒö±æ¡N½üðÑQí“G§±ÓÚƒƒzãôGé”ÊÃ¾ûr8~žJ­|ƒ3€¹”ûÓ†fi›8ÊÌ*†Î›èCÑCaÕ:îºæ­t6¥n/o¤ïv È¡äÈË™©í:m”/=[ÊÏf— 1ƒ,ÜÆàê×A³/}UÌ´Ý6û+2æOà ìÑ¸l°Åª°iÁø\²C4IÃ>à–†5A*¿+²ëƒ=WôÞyyv89K¦ÍV­½Òë¸Í±Ããng8€ÄœŒ‡°Ï÷½Xý[‘úwtõóì#gÜí§j@mÐ!É.NÕ<Ï¹d¤5§?Ö„b!:EÃ€äät/q4»þE?i×ŸsÏò=·änâaèo´é'˜ÇÜl{>Ÿ3÷¯.úy1‰ØÖ;gÛ*+«ÈÅÚ¼„jS–PóLú1¾§%À¸ÄzÞ~-aÚãþ)j˜vÍy¶ðî€¹\aF˜„1 V,`ì“nì÷¦.s!¼Ì9àÆWº­ö&;êîãÃXý¨ÎvOUöª•zƒ=¨4jŸTRn­0°¯é²ÖvÎÝø]ÁîN{ÏiÈñ¸Oˆ‡wŒ'ÀÞÂnb«Ãþh(XæôÜ1ìÔ“!Æž8tönúWµêµlgêŒÛ]X ýa³‹±mpS_Ì¥l½ïù×Ã¹}oÃ¤ó¬Õuñð ¨n´À»1Xm¼Ú¦­:f=”}–€ÉÿYï¹ü¨›é{,[\)­mqÚ_žãÊª!ä]_6ßwZÓ"ˆl­Ï_ªMý³ì„,©°¹…›«ÆŸU
ÞJ_ðBïÞnem>€ýø%H½GŽ÷œ=$_ ä…ÉoêTÓ
1nõ*ðïÊÞÑÁq8¨‡»¶a‘ÄùÅ˜p£['Aû×C"ÅfqÎˆs_Ã5Ñ‘GŽêÒÛ°ŽœWÉ¶uá`5X,ËioŒ.ŒÖÌLLÞ„‚Â‚æÑ´K÷EÓÅÝƒµíZãÂ¼Zôz¶‹¦ºŸo®¸ÈoáÒl7H†»øè‰.Í¡h4±óÎÔØf®ÙaN}ºdî 5DÙTç†ûÊœKgãUIçÞMÏÖ;5C©á«6C"É¿ˆd›Ø#ï¢ˆßñÍˆõõ_ßùíÝ–`ÿëQ)=Å cÝæ'w€3¿„Ê\_tÅ«9`
°þIoX<J¡Þ0P‹¾)¤›_¹ÀìBÿ›!ˆí³^.æðñäŽ®WŒtÆåæ8?1E¬6h:c4÷~7=’I)AB•èÂÎe§è1éöQÆqiØïOÝ¿úŽdøŽë1¸¨ýü•fU_1ò‹‰=Ž?r"S9«HéO7œ·ÐƒZ?ç°r¤3A‘;øž—¶RšÑ”PæþÔ?æ
›¹Â+”¶‹›Û¥;OÙÁÞamÛŸ6X&Àõð•n“òÆ;¤¤¥¯QlømÉIž£«à ú·qÓRÞÞ•rñ);©ï?Øfxzï"ô3Ã½	ü9jÚ)^3?`¶zSD® .d¿‹·C*
ê.=eÓÊqýè Ñ ÔyÿiExºúÐŠËÐ§g¯ÓäÖb]LÃ?mµ`]àðk»CNcËw¡—>G…L÷g6ê1TÝÔB]oTë4Ä9ÏÔÖ^ö:†Ò."ÄÒµ”CãòáÁÍöòÝEMFzv’Èä´•"%ŸŒ‡ e¼ÍÀá&ð\b¼rõî‚(Üƒƒ™wñõÜ&Ö÷jÇV©V=>FÒO©óäp1gN«…˜ƒ&Nñí¾X”HõÞIµZn÷Ù¦ºíŸrÁˆ¶7xO8<gpÈ y'ŒQšN‘}øMã¹ë²öÔEQ§×ãŒþF÷Š1­t¿­h¥Ë¤SÔ´vr°ÎØ9K½½oÁ¦­P{!ÇQ½&‰L§¸‡àGU>Ln›e]ÍVÜ,}µ%:†‘hdîÈK.aÃñæ³ÿ•ÖJ+ÀjÍ™•Çña•aÌ´xeÏ"tl4)„¹‡ô‡3Ž¼jÝ(rÞƒ£—WVÆ¾ëÚî±fZi Yi™²ˆ¥²,ã
b!¬gßòl—/öÅŒ,Õ­ØâÖÊÚÔy“­æÑþ>ºD*;MµRÈk{ÒzF’Oûn:ºë•…n:¨¬ê ‡"m2lw8|¾ ¦2mw…°çðCFuã¾†hQÂxÅiáÀvƒ–s8h.ÂÁ4Hq£ý&M Ý9‚èÊž{}žÒ7-Vkp»h ]Ýù;¼<mÌ·hh?:À^q¶“bÏj3§\«ÍÜ¸%wÕfÃ3gcª¥D¥k×V†ËØ™09*a8äqüvÍŒ‘¥,×nb·àeAø¯É+cä/q²_]·ùJ1 x9ª«Ð]’ÜU'!HkŠ÷‰k›a!BÚ?˜³,KzƒLÔ:U†#J°Õ€ÿ#ŠàA{æè¡ŽôÝvwÚç5;˜9Ë¥u8) (lãX¸ÓOúnƒ7£8q½˜Þ7‘NkòYgßg•ãÊáÕ:Û	c(¤’Æ.b¬qNùË#gàÀ¦k:H]+üà$IAáz;W¡ŸšÔJÕü§KãNêA²àG<¥ÓnÓ¦}8„æ)?¢)W“G¸þ£z£vÄªŽ÷<>­4Ãp=>lä•]V¯‘ö«žRàNPKgüd;´cÛ£Å9œtø§R>ª„á¨!ã£N›9 ¹TzýEÈ{©¼f¸x½í%_Æ“”¼ÍhÇf†iµÓƒ1ÀAì}³Bñ3nU(^ã'´¦024ºrXpYÍª.ˆÉ€RêÃ&‡’e´Z9-6¤0D rDÆæpåÿôæ³_¾yý{F¿)ñ³ÿ~2	ÿië—ôƒùmx8moûî0gù9ÂpIúS“……y˜t=þaÚ_ÿŽúö3œzûoðúùwŒÜë?øœRþë›×ÿ?á»Ã8ýZBŽÿFu88ïvDð!àÈðÅc'ÎÀíYÆÅtAd=¤ñ(i¬<·ß•¥«WPd(,;+ÒÔë×ÔÓ¥Qúƒ+ÄTÿ-$úGŽrW&ûìoq`?û[üõ…RÀç|°ñ1Ïø[Jú¥ =¢5x÷ß©ò¿öGþKÊö[9ìPÏW¡)¢Ê~Á+æÙÿžWÇ€[û)ü%¢eñ/Šôwñs^ü§Ô®_àïßüÚ:ZhÔN[¤ØõX7¦îär…5Ç\ý‚ðÀß@úD|	Õä­ØÅMXöÓ‘@öÜÖtÀá±×mu]5]8 æ-¤dPèÏàç=+šµQ‡sCmÁGÉN°¨H´¯t¡¬’}áŒžoQIY¶d#zßæC¬Zß®äæ^Ÿ6aÃÏO†´AWar³Ë×¬Rm|\›ƒC&që „LPÜfïÛgà:1!Ò%S2žYEjÇ­^dø3tîÀ1µ;˜Gƒ§§Ó5é¶“_‹ù\ÙHþÀä†ú)gLš•o£áYXº¶á¬Ï¨¸Ò55™§ÿ‘ž~&:óú_ôl>Ä¤ÿ¨nž_`èðîð…äð¿æI"œ†áñˆb¢
ö)¤ÙÈCOÑÐC­s¹VúË»´9¸_Äà\˜Ò™<5]Âj ž³çž;ÓÞ$k„EÔRÁó×#¯“ND&™:øLüŽæçq¹ËßÂþš–G=ùß|J¸tæOäÿ€¿ïf`d3‰G­\µÌs^¸íð¥pÆØ%å•ÍPç@`mS|³Ž¾ü¼¹0°ktÀ–––WØšÜõ:¤²ßÇqÿtvx‰oÎcÊî÷aÏc³+ÔÙÇFìaõÒ»BHþ*þBÈ§ªè…ßÿ™IFõ{•ÿìŽ)Ô‰‹)Á¾™¥À"J‰,‡iøJ-‘Œ0Ïb‹BjaCei1W‚ògƒ]ÁÏ[a7kUQ‚óû×I¹Aä&q¼b´üIan_)ÛÇÿ&’•  r@<Œ·…jù…-ºªÊÿŽjÓ¾|»Ù÷ßH=W°ðHÄþ[ÚúüÉ…¦ßÓIùùè´ÄÍçC·7Â‘gGä÷¶¬~÷ÌÛt;ëA­á»zýM°¢&ûŠ‹µÿ*TAø[~—2Êÿ+8½T:AÚ•v{ŒVoI‹FÝ&M‹*¾#ê´/“`âàLà».”x0Ûs6!ý4e×Ç©OŒÓ˜Gî^Îoa¥ÁTZ”üiÎ›‘“å¿„ëüÀ€õÊCe ¶0N™-ŽÉ…Å8ÕºˆíŠZk›ñÇN`X^I¦Wjµ(ãÙHdüz•ZUV²ÀW¿•ºð¿SØö—þAQ¯Àáá¶é­ôžý\ã#óÛ}ûg>²_¹ãñp|äuù,®5“€gª²Lf!e’‰ž…q¥¯¨0”¯†vVëˆä¶Vµ÷æÛ÷oiuI‚¿ev¢à[4Ìƒ:ñ³¸CË&]¢¯ZØ1 Ý®Y'Šy¸¨®·¸ûÍçAý5Näçt?ö~\HœÅc÷åâfqà¾´Ïàqà»Ù»Ùìù·¢ÿF¿ÿÑW Gvjº“Î»Ð‰nñB–k8Ñ·lÂÓãƒäŒsmôq’×45}mb_¬“ªÔ'ý æ¸Ëä9S\fŠ:ü*4Ä•(rs:Vuf‘L¹ÞYË±I¥¼d*x††=š``]û¨=Yêô†MG¹ï]6{ +#ü”\"òì‘ý%iaX2lâwl…Î¤Üy×íµ)…X¿Ÿæ»ƒVRxÙð0,›:¿iÜÆçç‘Ã«Ã>9É‡ƒ„˜Úq¹ØDÄ½¹qáÆ€b“$»t†ƒÌ–€áú×~ýa{ÚsY×c8cÖv_¸½áQ´Í«–Ó˜ÕÊ &ù;wÉi¯.¼­g]#žÿ;“õ“º4É×sÄÙÅ×ÿ^^ëÿÉW|Êoî‰¿[gëÖmÔ¶þ†ÚŠêA~%ô•4éBÅá¯ämæ¿2Ò'þ7iv!ö2nÞð™ÆRAìƒ,	ÒŠèõ!ŸŠMSØ¦ý^â¯´&ÒÐeÀUô™ÜþÆ°Ú¼öRÞAý)ìø4î:ÜG2	ò†E9rÆZ“ßJÛÑé	7•6Êjç ‰•s
Ö"@žU¦°X˜ÍÌA²êHSÃ7bîpsýÈlÍ%‹C³¾¼[¼l0­à,±‰_‹•ùú+öþ2-K”UFÌñX-öa0E7Ü¹.5aó¨u·s—­emª<÷`0‰ÊŒÿ  ÿÿ çOMxœì}ksWµèw~ÅÎ Ñè ‘4z8Ž°ôÛ:È²±ä ×q9­™–¦qÏô¤»Ç’ªÎ.•:—”á^Nê¦rN*˜ÄåÁ©:•ü×ù%w­µ÷îÞýÞ=3’¥D]àhú±Ÿk­½Þ‹1q5mÃó6Ž¹XÙ¯íöm›õj³“ó¬wX›ÿììÕö\ã°6?Ív·eºâ?üîÌô4Ûuš}oÞÛo[¾É\§ßm™­Ú-ž8}ß¶ºf­ëtMù2oâî·§gæ/ÍÍÝ«°o±Ìkj)óá•©–õ0ç1<U'èõŒ¦Y;¬Õ+ÙßÀW¶±cÚêw¾yàóùÎMOW–Žl£»ÇÙØNwŒ½ÁÆ^<þó‹þýÅã§/>úÝ‹Ç¼xüÕ‹Ç¿f/?§¿žÓ³÷éÙ§ÿzüå‹Çðã“1¶ÀÆ®¹FË‚·=ßì°íÃž9v|eŠF‘;NÏ´Í¦Fv0o¤0V§ç[N—=4ì>Œ³e¹0òû0€–éU–6Lß‡a]£Ÿ¬ºü½	¶<ÁV&Øê»:~eŠ\®ÓkºÝª,­ÉMV½Ù÷=ßèâ’O°kŽÓš`[†oy»FÓwÜC­î®Lñµ2óîô}&â Èöw:–_IÛäÃÚ,îm°¬í<4Ý~«>;?cÜc¹|Ww®_Û±æuƒ½¶Ñrök^‡5û®ç¸µžcuq3:~m†Þ4é†ï]ÏÂ•©Ðý®m0h·ãÉ~Ö÷|k÷PþÜ3zµ™°¸²eÀv(ój×æØ~m®ÏÒPìby>¥?àçW€R^<þøÅã¿ºýY<@tûîs<ü5½ûˆÚøç‹ÇåÁ[¿‚Wi<·\«c¸‡lÕéîZ{}×À	gn$ß¬ôY^™ÚuÜNÚ³ ?þVâÞÑÔ¿°­þNÍ7vØì»mö×g«†Ûb5Ö80:V—ÆÈþe*9Ê#0 Ýƒ¶¡ZP—š¸oÂ·cìÕWY5m€1ÊÐ†
RÂ"!j@ªW»$ÁjæÀã0d›»>“ä÷3º°Ê¾YÛ„¯YÝ(¹’‡%í9u|ÜÐ‘kì8v‹…ûu o|{é„û)ÁÀÖ»H¨9h|) oàÏ_* ô%BÙ#hÕ¿ààÉ$ÕD ölœ ,{óª×­½6Û’¿Æ‘ü·ç2§ÞKœMr™å%–"}Òw>¢~F?aÁ ÿÿÿý‹Ç¡'a9o~NþÄ×)}}øƒôŽœ—êjÁïgŒ°ù+êñ¿ðo|ö¡Dÿ¿¾øÛ‡aMŸùm“M £ŽÕdtž0 ¾¬ d®u àÖ‚?»-	<ƒ£ è“eÀ"U3ÝCTð&qÕ{Y˜œ	ŠWÇ™ÓÝ"B½xT5ÇÙ"°ŒÍ3'{®ù(äš¹kôm¿:þýŒ7u—[  [ýfÓô¼Þ^5¾“•Lx+¿!Qˆ—ý>geàgpëŒz¥­Áßÿÿ¾Rý¨{†iM'5¬‰ /Ió€Î¶^©dNÜhµ–û-ËßpöªZÖÔØÄfàGI´©àÚÑ^ßj™È¯x“ÙÀh¶­Ž	œMµJ–²Üccã°i:£•ãã4ærŽI”PAÎ×ÌBìÑÝs-˜üSk:¶W«³Nk!ü9C'ì¥¼öôØßL2ñ	=xÎÂóš ”U¿;.pXnç-èÝ0Ü=Ôâ€­n¯ïçÉL°QÝ~gÇtsÅ&XÇ#¯Ùv{K€ë$‚Ž†vœß‚Ó]mÃâ˜ ¨ÚŠ4WEôÇ'Õ#69IÄ`‚EºX`=ÃõÌõ®_5'}ÃÝ3ýIÙ8;ÏâDøu6Ds/Ì½¯€ê§ù¤)à{ôûY@Jÿ¨PÇ÷H_íwú¶A2È6:?6\ú%€ýüŠ{$oi®,ÑÌë¬:3ÿÝqö=¾3ÑŸ³¬:?ýÝÁ¤><Y+Kwú†ÍZ–‡?ðçÄ_ÍÎNÎ~—™F³}!à]/Å™h§òÛ’ŸÉnnA2ÿlVÙéX?/)Õ	¾ë~SýüB¾‹Ih/ÿáÅã'\9÷9ÔßUöWjê³B´]ÂšdW’›tââÚçŠ°ôW!¼ãÍ§‘éL¨òÕ¯¯„>2œüº÷šæŸÓÙýO¤¨ðDž…ò%‘KJbË­aÊ°‘.â˜ö zzÞ …PÒl›­¾mÂ”ËZ\âkÄº°HçT‹oRyãÔìïÈJˆyÏàîoi3>…Ø "Žé‚Ø*­¥\þWÅÂ7U•ë÷@FyŠO
OœÃrBYÐ1¸iœªü¥%-L6Óá>â=ŸKÌ~h@"op”k+¹…«îi0ñ	ÐñŽk2Gœ@I&:É`Su`?£\FŸÈ8Î	]h>Øq*’&¬â °$Á7M‘8€£¸á¸]2£àŠä²vÅ¬öy˜ïšq8ü\‡àbO!þ I'§¡j!vÄI´‡Ï5:t.c‰]3»¦kØß ”ØjZf·i~fºêt:¦Û4§–]ß{I HŒ…óŽÞ†.¿ß8i6.xü1Î¦jØÂl(¿nü‘ý³i¢œ_`Û&,lÇéZ†wz6p‰úr¬~}ß__ˆ±¡ñûs,t"~XÅXUYõqx›ÈŸqX#`JÛŸSaéØVõ§ô÷ßHœ}H±ü/©A‹¹³¾~&QŠ{|˜ÿ<ü-8ßLŒ|ÉOãâ’nXÓtJXMü{ÇèÂI:Á:†»guA~m›B™çÚ&	³û–ß5Qô²öº†ßwMæ[¾}^%Ú"˜Ë‚2&] Þ“2îÇÖC,%âÃáˆKÉv­®a[?/k64á§‰h–Ò2.­AäçÂJxZv•ìý\"ä»„œðÒ§Ür¢àà6âÓÔu“\æFl$Äd"T LŒìdì„É~XÔFxa"<%Pæz¼'¥Á©&ü`“âî—»ÒŸl+8‚Ë@®
œBXx“›» ñnÓêY›bÃC1ä¬ìñ ya=cÈ™gqœïÑ·˜¥sŠgCÐ¸4n]c–u 9£Ã?¾34X¾ßIÚ÷@‹à¬ß—9÷þ!’(MNŸ*w?VÜ%ž&d±…gF	Öâ±<~óo°%’…kï‘L6Eø”¨‘Ò „“7-sŸí‘^\UHéÁ™à×€>{$‘˜äçìÂc\äfÛp& å£å“8^¤ Ãô´JO‘ïÚ€m«Õ2»’	ÎfvÕm3…¼‡x$zn×6zž™GR}ØrO\ßáyôœ¬í$p=ôòu~[í¨W›­,­{0pëkW¦üvù¯·ü>,¨ÏðÖ`-Õpê§¦á:`p¼A¾å‹è¢?Tei™´\EÍÀs7½(Øê+þŽÓ:T‡ lù=dâ z#R™æÇà(à<<<Aœ¦æ³å;ÙB+¾HÔ5ÐJ‡ÅøÓÕÆímàÚf.}¯ÃÔsA<­iØ;äƒ­¶ýV»ïÖ
·;¿Îª8˜ñÁÚ¸‚úâ¿[ŸîÜC6–4ÉÓœ‰5;hØhÕ$Êß¸QQZ$Ÿ¨äˆèHÈö	l]™Â,2úç~ò± 
ÚVóH‚$6å*qöÈ²0”}AþC…Ï6ØOVÆ#
¹$õ€«Ç9pô!Ì\VÖ ÓŠ3¶ÊrW–hìÖÚÕ|æ.˜SÁšå#íËD›™ÑÆ2:ìºãy†Õ½@™”9m”§xŽeÒÄ>•äëÈ^[`«.ìÎ¿:;úRX¾¸ÿ3gçk-zÝýv½1»|yùž”½w.®‘Ngi¹ï;âãiý¶„œ‹ád+jÐA&x’b7P^’TU05žÙ±8có¦éZ»‡Ìàã²šlp<øºŽÐùNßìK/>_øö¹Þä(ä‰@Y®­G¯bí–ªÎÊÔÓì˜þ¾©!¢äƒGrES„ÀT–ÖÀ#Ã3ÙšaÙ‡l…VùF)ï´æZÍÌuÍÜï¤p‚Ú«zeév¿ë1¨0½ì·Ï¦gà½åH<{–	"$Ðû­m0ÏGÙÒ5÷,Ô0’oaß5íÃìm¦Á¨kŠWh’GHX]R/&w'Fz"¡2Ÿ!×6„Žùjtî®‘0 Akt‘ê¶NÆ t (ÿÅpJ©ÿ=·ætÎzfAdTŽ7‰ûµzµ´ª')vQKÑGø
|‰¿)f³`ìÂ/f•hÕAøbìáühà·š í 3µ»cc÷Ä-cÇsì~ð†ïôjwgIâ¿ñlˆÜ›H'4«Y˜•zWüˆLˆßj×æÅ_ûÁ_1eqdBªÎº@‡žkA(å½w®éærpPýØ4 D/û°ó-£Û4ÙÖ-32„s¤eORÏ9¤ž·€znC»‡tR=0=$å=Ã…åò˜³Ë QaãqÅMÎ‰Y¸›/ƒ”ê»±EéÌ1ùš“QË—Ø†³guÿAwV½±¼½z½±Åîl5n³­ÕÛÆæÖõ›ÛìVãöÕÆêöÆOÇõå[¾Ïy´eŽÑŠ³å,5(ÈDÄ…Ì-Œ¬7¦tÀTÉ ñçÀçIÄ"#]¬‚»O¤ÙáoÒ¨/gF{vt²‡ ¯™S”aW&å}€©îÙÈ!Ž¬ªg[„: ì:8€¨C†cø„ö¥8¡&3§”/¹¤>C¦¼õÆ¹8¶ŽdÝòƒ`ÃT0¥†OTÈÕžÒmHqwPÍ”M;4­—%L£“{Æd®`UF®=V€ø™âO¤"Á—þBÿ~ÈS%ÄæZ˜#O—áªN6$iy9ï«|/™|?™y§Ø5|†IHlŽpì×ðÑÛJxoeùoñŸ8î|ái`¡-ì ¼ÃÖypÙ*’ó™×“I8l|F‡†5¡2-b(’G1ÓÛi±eûøO`óH(ß368*¯¨úEl*òI*0c›¡NÑÄŠö›^Råˆ]Ë6+™Ü‚ÜO†¯-t\´êà_¨ÃøçÈ»*tão±Vâë€ÚâuqèUÅ¾¹‰ ò&,~L£þÂÝ`^/é¸Îâ·š®cÛhÙ¸iòäh"=¦à9#)xÈôû"jo=‡Ÿš‰c ÉÚ(¢ÿ®³ï-ÍQÜôc‚»ûóéœÐA¡vqn
aræ»ßa6wT®¡>âÀlUNìÔ¥T‹«ŸY`ÛN	Ø^qyþÐsÍÐóã ®µS‡SeùÓ–7…d<IxÎñì€"çî`L½î‘^œg†Ïtã"-æ¾íµ­¦ß×; ½³z^—§§ö+ÇŒkZQ²í(\E#-)'Cl#}bLÌœR@æ.´ /OZ¨*rá›­ O' p’ÈÓ½G{ËVÛq³‰}à ->àÏß„?H­óŒ7J.ŸàS;ZD1 ‹8ÓBš˜Ï®ìÑzQ¦!YPÑË <(K“ig4lŠ±l
EËT@EËî–þèë´5$1£\pªRAàˆ)Ð¸ÜË¬ßë™nYÄá7=+j
z¶JÛwìÛõÆ¥ÙµÙ±	6öíÆÕ9¸èÏzcæõÙþçôÊë—ëc÷&;F¯ZmÒ6¦Y“^Œ¯2öÀ<\<jx’È‹Ã1o^’ñŠ¹R†M=ÈÃ‹"åŽÈ£ŒSÿ°ÍY†{{ô62Eûðÿ€uŒÓýN.Ò’}°‰Bâ{Î¡ ã5ÛlšboÄcâ7¸5ìøm­±Â.cÅ©¡[VßtZ&‚FwÏ¶¼ö54º'nhtÏ­Žç\›8øqóñ…¾•“‡¾•èàñÙª–[-ÎœIZjðÁ!Ú¿€ãÔNèÎ 0qbä3hÿæR_ˆûû”Q[Š7Å{«J5Yù²ÂK/–†]zN?”Îé9±¸K×S³i©—Ça(Ù›ë„W~‰[íµeú†eç•Ò‰,ãÐé²Âëx teÒ—/.Aê%u‰¥‚ÉÖBuÆ@EYÛ	?}ñÀä¥RÀHk~Q½1Z˜Ç“5ãj?(rC~}Aä”™®Z¦Ý*Q¾¾/Üûïïâ×_ë0GÝzi%Qƒß¿’Dñã œ·¼Ï³§ð: Ï2Ë”qÈMÛ¸„O8¿Ì?ÄûŠù)Ÿe¼öDVš´Ì1A*øG<?^|-È<ÂÝÚÞe23YP‹·Æ	À3ž>û	_ÐÇ”Óæs¥r×—¼õ¿I³‹8±>äï§gÍL­
±
ëä‚¸-K<pŒ`„	sÍwú–K.êžtÏnvLÞmÀ¡áydŠY£ÎiúÌtHðS		ïª9Oi¯"X$Ù_ñTDéœÃ–²ÖÈ*[-ƒ$ª6\ÏàuY£ýIÛÑ³•T“ëróÌ¥GwÇ® ‚î[c×M1Y9åÃ€½“Y)'ØØ'ñ6ÇÔ·•¶××R›~O|Œø/0]õcç f˜ÂF¯õ·e]v«ì>¶ú"?_…Ì¦(©É½íÆžÈœ¬Ï°‰ÛqZ<W>}À×‡ñûÒÐA{=Á¬ÖAÅƒŽ4²_À»Çù¶Ö¸R³qÚáˆÅ~9KG4ðcŸšÌz ¥åæ%Ž æ.'uü›–gíØyIò5¼ ÎÂ|	°Ø+@sçŽ5ç~›S¨Ö°“†‡ÍV\¤¶ÌiFwff‰9œE|38'Ùm¬PuVr]Ö§Dè[Y!„Wƒ;/ÂG‚–äšV>2A&^Ï«HRÉËë(
„ÒG¤–ie$òŠn>Ìˆ\#Õ]Èôvå7Á¥Á¹äð7._0™4’Ýÿ=‰³ŸòÅ{A†å”Êi)‹ûáICÖxy¯ßëÙÄœ¶äX}‡5¥eîw­wú&ë˜¾$À`­¾‹º6Éç:Ý¹­î^ž0R¤¾(Ruê)9K¨7q÷|ªªÇYÏu:=?MTù˜øÊ_åýr—;ÊÇ¤˜ú'ÞÄ	 álL0ÍÅÆB¾ÑÚeU|m¼@i›§¬/à-¤*¿H¹H#çH¸ÀîŠ¯&ÕÛìøàööÕÚwŽÖ€ÄMvýêøñÛ4Õ	ÚNJr{à³-Ä#ø`×°=“ßËÂñxîJe+ârô¦)Þ_õô¼p!o‘.à:Ô›±gòÌ°÷RøâYÕ´´¨9”ñ–Ý÷¢\šZöñßLN#‚¨ê\ªñÀBvÈI–Õ.;œ0‘‚HQEfÓ×èíI«Í™‡	bòÙ2YaÂÇùé©¹ü¬Ž£	·LDgdç“+€8¬!/~Äò/FÓÊò%¸òF€ôCkâ}IaÑ+ŽFqOIÁ :ÞÀJÝ¾ƒ`©Û<}±5PÇ´WÒX7å×¦ýqêŸ ü“»–º­îb¿»€+$†JÄÉBâWe/´|EÐéw@ˆÅ–Æø?þ8ÜsÞ€gÓ]rW÷òXˆ±í^{&CÔË…¬";Ò@"ö¨mDõú’ö‰t}Ú¢YK|xŸgW<ûÒÙ‰›†Bñ‰@H á\dÑ.#_Q<ÈSE3 ôŸlß¥WÙm³‰hqxâæ |%ýZÊV¥7þ/ýýgxh¬Ió4N±Õ­7ÇQ”¢dD~ƒB›ÏÓ¨ú.FRrjðâM\³mY@Í?÷¡taýÜ§”üÓÃ
à i]Û1Zð¨¥(5-ž¨È@~ØÔlªöe‰`ˆí[¾RXÿ$j<õ3Ïé~+2 }Xìû»µËö=fv›NË¼s{3;]àqªÿºussÒóQ$nªåøòÑ¿½Ü…ÜˆÀ0ˆ–Óì£(<ÙtMÀþŒ«cÆXn[j+“h¶ñaH°VfµÒvÍÝÊ„œç ­Hø–Þæ“¼£“÷#¢Ö$.áÛú½5q×²{x¥X£*ùÀ}épEiýêx¥©“Í þNQû˜E·c09qÑ_Î¨|o4¥Gž/R²ð,–ª½žÈ&mÄ›±¸Ï¸ÿ BkxÛäŠª{ 2Ø÷ÃcN¨e«Û²öä¨ò³ë¥2ã2M´— b­ßé‰ƒEŸ¯w›v¿ezm¹
qÇD¿P(äžbËsÁ§ãá|{6ëEÀjüþøwëHçKÒÏÝç²Ò'RÕùq¦åþ*šx¤Ú‘—¿3]ˆÃÌ–Fùn+8z] ShPøm ~¨OØy.º áuå*ìÊðLFËk›¦ŸI>¤âìäè‡ÜNØÅ“¡ ƒ¦iÛÂ„Ñ/F“ö¾>ÄãïA[%ã'	!ãGè¯d1°'Aå½÷²âÙÉxJ|(=‰¿’¬8žt±ÜlàûpOä¼ì‡ÞÆ¸”!“«¦){BbP†/¹ 
áueõ2iÑÙ9œ%¸ju)#6ìpjJ
N¬îC³}ÑÂMîsf dé’ƒô§#VÜÌ,°;ì/w°‡õõ6}øî>Ï#ÿ^¨m.þ^¥rqµýñ>'l‘ŠB‹8mÑ–šÀ$°Á^¼oŠë&w‚ýB­MOÌ$>ügº2*œ¬êœËŸý–|ÂWå7Ê¹ðRAò¹Pt} ¸ô‰ÛˆUÅ×~G]=—Z›Û¦a×|Öô²cc¾y¤êS¾i€x‰yŸÈÁÖãÑ÷ëJwQ2|ã%ƒ$Ð_¿5X%FÉL±ÛŽ=`5HT& r{àb’r#+˜pÑ¨ d¤2˜^mÉ‹¢af}zvòòüd½>79?7X]¹­I¶ÞƒKÜ~V‰/°HÝ¶Ó2'Øôå…ÙvëÆàµâ”~m×!×ë«Û?ºú\Óó:ò<9•ó0CHÄÈ«UE@šKòšµóÎLéÄQ×¶8‡n;N‡U¿ww‡„¬¹…úüˆ kËØ5\ «c4on}“!ë,U¬Ï.0´ÍnÁRî£ýIß–>¼ß^ðí1®9¿â|y
+û‰ð	T¸_©7ý€er¯Öè†½Ö=¨×®V¡Æúÿ$ŽüQ ¼…Ý?
á2×©`Qâ!ÞIûêŠÅb‡NŸ+A%¼aSu=×ôÑ‹¡%ÝT˜f¿(¢è<c×Q\ìPË6ù`ä>Eœ¿:ÆAmŸZ¦¥<2]×qox{ä£”ÜnXÅ'‰ï²ü„&›¥P:2¢Æ®ŒöCZí#öunW™‰5˜Ì¾›'wäd× ³'Ã‡ @«0B3þ„G¹‹ùÉ"ÈW”ÞT‰¼9òÚÎþM»Û7˜HÍ±À*’VŽe&Ž&ï-„ ´«Ñ—ªÑ$ãÇ—ìYI–‘§‹‹ÄëÈ¼{))õ¢ËX}%¶®ÑêÄAF]b“pzµ×³]ºèÞ¥ÜL°ˆÉ½¼Ò84oîîfâ,ÐO³ÕºE®[¥Räž<fE~jÓÜ
™à{Mdê†o¦#’ÒÔ7‰Ô9¿[ÏSC¢è^ Q$
â{x¾¿Aì±˜¼UŒ7eX|íè`Ñ·3°èKßÜ‹Ïû•”õ=5LîëYÄÃ’á¼¡/Qh ÷^“²ÜèÝp`(å’&9©"e`
)Ä€ÆÅQ‡ëÎ	ëâª"Ó•³/*Òà…¦¢”…ñ‘b?“™„„ÏWÜW½4B;£ºY·…ÿÛ‰k+bÎh&â^$ÑðõGÂ ø‰BO¥{øS5R7beýMÄé„{®HãâYN»§?Íó3úŸ².×¿Ë%æø(Hù“¦Uª^–!0³žéŠt>³Í‡&,0z¬Àa`­'æCçú•(Àa‹”o¼D[$)ç‰¢aHÜ€&Iƒ°+Ü"©g,4%.“ŽG)|aUÌ6üT–H1v¿i¸æýŽÓ2íÁl4[} Œì‡ƒ5pÊ&”›û]´ZkP
Ì?iˆÈkãU–VQ
1[gÛúWYN#÷]ÇéÜo÷w†3ùM1¢(ç–)ÝÙh ¡8í‘Jç¯åž«•ÛtŠH'~ËôÔX+‘kŠ7( ¿µk™È·ñ]D§BÃf'§ah¶Ðé%šÂMîM)a¬Ñ¸Ö€BÒ¯×”­ê´~›¡¿be‰/÷ÓÉPJøv~l¦…ïÅå”U®Þ¾¹¹ÝØ\c?n¬l­o7ØÆòæÚúæ5¶ÕØÞ†ÿn%n"áø+».•„K7§žzÌÔLó¯×Y ¿]g?#±ç®ï%²ÌeðY¼–fz¸á‘\UºãY•‘ûOOÅ/OÍÉSw¿]oÌ._^^º¸’¢À#é½²aöºÓ1{È±ó”™ Ûž@’Ç8ý<³cð5 >”Ôwz25*~º2Sh¯¿$(ödæ€Ë
ã ½°5yÓÇRöQÛa¤‘\}XWI_f¥O™|/¨®…ŠŸæ¬Æ»|gn}×k¶³Ó—E³§\ÀÍ60(÷ËÉ†š\Ïïb¨Žk	P£Ë¿Š{7Ìn36t[Õ§Ì×€ÈÅÏñ7&I½Üè¹‚G‹¥„±˜¶ ç0"EÂ•8‘'R{ð;éñ4ð~/e²þ#÷ßOfÎ{*utO¹bå˜à)L,Êtÿ.Óû#éñ3‡Pc`IîáÇ¯ŠëM™›Nïp‚y6Â/W# c‚¹úð$è1:Bl*+oPþa´5R¹Â/õÍZ­ÆV–77·éÏTÅ`ÞÑ¡©,*÷1¼Ãn“,GrÆmß=Ìágy¬:#oÙ"ëšûìªø™¶ù`jŠ5˜4} –Cq»kÙ&E¬áab;{NÁ˜ð•u².)Áó{¦/"çW×[Õ1|©†-×È56Î]ß¾±A_ŠW³'ÉÏÂ~`›ƒ˜o@<yëîô½üTir-'8ºbŒciíäDq´îËÔ#£<ÉX«n+©óÌ{™ß%ÆëÁ‘† ½Ò…QK´ 7¼ jVð
ûÅ/ØX^
ƒÌæÅÍ7h>(“ÙzðÆÀç=x£|ã¦ea»ÕÔ†®Æ'ñ­òmïræå§¦áw¡¼\¾§¶i÷;Ê\!ùÂ Ô1,;³]zZ¾Ñ}sÁ­xUÄ‹å{à§•¼,îEyyÐž®Bû[ÖÏqJ[”¿¤ªÕ§üŒºËËq’Ñó5×haŠî4åûÈPÕÉˆ1]j¾HRï¸Ù !žYpâ âöàLÜiì íš~³]…3g¹gA;Õ±)£gM	®`|"÷è˜~ÛiÁ”nÝÜÚËË†š‹…`rÙGÂ ‡q01¬!§%çI©\òÎx<Å·pò¿&=2
ˆŠ+Ü}s,ÿD›	Ai/¶[‰H¯*»=ò4¤r<Z@™£T~SœæNLr!köE*¼Üç'0Í b,Ö,àmdvÙ`ymF*:M‹ßÈâIEHËÈŠøöaNû +:û“-ÑOÛ«"+Êÿ™‰d¿÷EM\"•;)½‚"_¯ú§dwMIV!‹$\N¯?–’k?(Yg$¦7ŠÔ&Ãrd¸Ò°››‚à˜™˜7ÊõVé<Òv¡Ü$ƒÄðÖûYPpGÃÿö!OjŒžèð_ö½€†t`$8 ê•«ec)ãÜ•µ¨äAF"³&AyÕtÝ<2„TÕ±ÍIr“¯ŽÝº~‹23 ïM·àDÂ&²G 8uÕ°mü
Eî¦)êÉ9@ š¨ãÇÌÙ>¥Á´ \dnºÛíw)ÀßÈ¦'	Ø©^B©I3XU†^ó@gã…À+Pš/@nZ¯¬íË¸–h~BWH¢µþ^å5ÓOµœN†žžkqÕÂ+RQßi-ôj—ß¡¢2<©ªýLeXÆmÒº¬^¿ysƒmÜ¼v3U‘Â¯,ÕH®O[º#l2³u–v5¦ú®,)c-ödÕÊy\®èp»6;ƒ^y—#¹Vtö¸ÐA0î=#¶×"XÞ£êB¾Ç´©ù¼s–ÙD™u‘‘Ý„;{Ìs›‹ù3Ãö±§ÃnqÒW‰®'9ü¿gçghf¡¤¢ÙmÅ(¸!²ð½r¥OñJ:ðf°¨JUðÍL²‘!›86§’F¡[¼Ò<ÑxFøÏ¥×lE^ñFÌÛµ§˜;øRúZþamšƒV,ï’™8tp·ãˆ
'P¼Œý¤x“µÌÍø^þÙV)¥¾+ô‡ŒÙ™„¡¨Ð?!ËÎ5‹¸þû—ÿ©“ª¼ÀiZLw¨´ã4±ÀôOªÛ‚)pŒDÍi Y­ÅJL-\ô	zTô€ðX`M¦þ¥èu•"õÕ¨Žj(–,…^uæ‹aÝkÒ¿1ywú^±G	JÝø~‘<­öçòÚ³Â
 ß¦ùé[åÅ?žtx:âEà¢QvÓœ¯1}#¦ûÆ$çøõf€×ÀºðÒNX¯ô©­/HtSBs^Áá .–X+Ô°ñ¬ÅÚê-ô^Qý2—€(üÏ²‡zçö‡éâ¯‹Qñ¿àtÐc%†¨ ®oñzC¦X.Q¼»wP›£ (^Ô®qéêÜÕz¤¨ÝÚ\cµqù^PšfúõåK—#\¸”8”º±(—ÂZÞ< "™DYã»ß^‡QÌÝ² ÷Q¤Ò5èc:_yZ•IN§wŽ€vÃ ÷¦lç•3JHiù‰Þgh¿²ŒÛxe>ÀqÝvöY=g09a”ŒÒ‰	Ž›Ë7¬º²¼ymcy\§H%†ÌNxLdî‹"D²È {\Xë%P9¤lö½À¢±˜:¢ŠFŒf¾*$ÑjµÒUA”æŒ2t‹‹9=x¹[’ÖY€Ñg° ×ë[×Ï&d7^"d7. [^ùçMHÙgÎ	e_^[»ÝØÚ:›T=ðL9}Ðº¾€|qš€ô™¤çCÔKƒéj\ºÔ|öœPóÆúú&Û¼sc¥qû%½¦·^eîµúüÜk•ÓGÁü‹ëÜÐô«7ïl®5ÖØOËg²cN¢•™éúå— ÞÊ0. \\ºT~îœPù7WÖ7lŠÝº~s³q¦¸éÌ|ú€/{¾€zqÚÞ¸±¼¾q¦ ˜\ç_k‚Ý^À¯¸ò©v±Þ_†•×Ð+ŒÊ‹¸ŽWFû¯‡£Ç1pÝ\ƒ9««‰zŽïQñ:†ësäNÅÆ;ô±¾©ÓÉg{N qÄÐÊ£ÎyEœL´)Fdt.±-téd=×˜ÄŠ;#3ŠñêÇ—XÜ«ø<ýèºÕs,æriX;{V˜ñ 6—Ojaä¸½²¼úÃk·Q˜a«77njÉ2ZŽ˜yŽ¤ÔŠÆá)	F—¶àüÔ¥ñø­o×—f×fÇ
N×rd¢Ðù! #…oæe6)Ä¦ÈÃ¢Øk1BêÓ¬ÿ(%‹Å<z”`Èk»V÷Am: b[ZäâQ‚4° :q ŠhÅÇÙ)q}°¦ç’{P`ð&£èÍóvBä.Ù©¯ÞÜÜf[ëÿ£[:’uvæøÖOÆs'Ò­H.âq!=éXÝÅJýrñ{ÆÁbe®ø½2ô)¶Äç˜6É™,`,’g®wýx‚ñ"TmB»€•Ž‘#q6\,ËiQìÄCeÂ5 JTÀö¥RŸ Žû¼Ÿk·—×Ö@^B>õÔèAb2Yþ‘±8ŠBE-Bð¾m³ù`Ç9(¤ ÂøªÙZ<zå•RÑý…è3búP†BèÑ9……‹QL´¨C4¦ 6Gy¿æ$bH,ò/JÙmÁ© ×wÈ§ÄÀ¦hœzž°	çbItï zÎ®!®´€z´Å8É*Vla(1¯^ç1‘ T__@h,£õ0$¸ç‡ÉK©drÒB—¬t §ùYUøÐxÓ´	®W=±„7Ä nàÙ>Þ¹À÷ª¬g7÷ê¦o9á)®Ï®W—"õiv¹ƒÔäujÑw%˜,ØK™9Qé”	?¼ºœ'8	™Å1™•!=‘cFö¶’õ0ÛšHoZ.óš ÀÙ©×b©ÔrãªtS¨a
õÔÙv¶Lp"+°"³þ}$*PNƒç²@ÀW”òàyfBˆy²¢ƒ*×Ì.&¯rð"/O*€Éh¯¤ãXÆj¤„ÍsšØb{¢× ˜Â0þŒ°ùh¸û°E‰[ÈŽÜÎdL‡)Ú´…DŸ°ê
,šm{åÚ¾1TäÀ‹8ÝÊNCX"2ž0ˆ5 Â,¯}Ö`¬ÀéóŒyð_ÀXÆ®Ëd}7œŒE¾Õ†¡Ÿ(Óò½9Sž7–„°›»»VÓfb6“Æ6(ã2÷Ý¨‘¯Éà°Vì!svücÎ5”å=Ò¯î'¦ÔdT#›§ë³ó3Æ=íê~ÀjjàHžÌMdž'EfI‰y²Õ­åk°V·×on–°m¿ï™”Mld	®qX·^(fØÝužS"K’R²Bj‹j¾Ss1µgGÙI¸?æ^3.Õï±^m>’6IÙÓ`÷´ùþÖ®È#ˆi9cŠUßÅ…ýPÓáu=q%¤âÛçup‚ÄkÆ¡ƒ¹®£ÅSÁ»yµ÷hÙ©öiÕ§.ÏGNPÝ€•õms§oÙ­	L÷à’ékvyoØ‡–gßaù‡”y^¤—„¸Œ»c…2¨HÏP{VhÑ†èdV« Ie%ªçKy•û§è¤ÐOQ²x¦Y…wA°wi9™×ì<“'œ¾¦®n°ª¨M™Å[\Ÿâ½Á¶Û–Çö-›—õÛw-¹Kü€á¥Œš†/ê!édt‰ŸŸt€.A;¥K‰d.r‚–ç/°»_ ½cfø	'XWHc±4‡â
¾cº¹á›–é5]«‡Ãâ­š®”f¡zrÔ°ô~›uŒŸ9.ÃÚxÜƒ^cÛËBƒmOåÓýšçäe1ŸÒÐø>å(ž¼xükFš« ÐÄW¼Ž%Oôù1)²¾jS>•ê°3sJ>§»Ïd]ŒÔTãGó1˜€gÕ'O:¼ d9 ½d9bwºŽo5Muw6é[q †£[ó1ÍŸëî>çã7¬GŸÜ‘Ô°úŒwÁWÜhÂq‡u3`ŸàdjrWÑÔÕ.›~Bå¹aêÿdÉ1„{+]ú%ÕE…áÿ¡O0§*Ü×mf¨uóz¦Ùl«ëvËµºM«¼ú–úLÌ&eûãµVƒÊ(zþúâ£_¦,êM»ét0§àäEGDÖWdH“-é?€{Çð|Â²ä?¡!<Vàð™¢]}š¶™ã~.·+\û'òÅpu^"“[2;Ô–Àiß÷ÕYÆl‹¯Ä»´Ëq£û’¹jQžã6þwü—¬Úû<eŸV\ËÜ…ƒ£Ó1ÜCæìFv…„vn'tbí˜¾k5Ó±¡x§âcŠ G0®VÿS¢PîÓ@å®êÛùî‹”uÿ5Ü±¹¡vl×„O†ÕM[uà¨½*PiF×ìîùm/ºo!m°ú_(y‰à÷åìžË÷¾HÙ š‡!9Ú5šÈHY&jÉdoQÍÇt»:îÒãÔÍ)F’#žS:h¾œøúDPß˜8ú·Q`Ì—Ü~‹¯òºEÔjÐÌgDÚþ\K6nÑüP[´IßŒ×é"ZÁR²Sl5öV°.!qˆý˜OêIÛai§ìMØÕªí˜Y^‰ªþaIÊÞÊzF×´S7åqa!îçˆ>‚F}F`óo²ÂÔã®ˆÝü\Vœ
—=¥Ât¸Ò—†Zé=Ã¶Í€<ñ#¥í Cy-ò@Ìîïæï2„«Mà¦¶¯RuÕèôú ®›¶¹ã³)ŽdXH‚mFY8´E;û”þþ$ 6¿ñÑÿ¦åzYÎG²08ÿ0¨ßýi@wþƒnÞ\Ä
¿6Ô
#7buœ®eØê*o‡·‰àpë ÇµÌÙyDPúËTç³üüÇ,ýZDOcce÷8OÎñCÝ°û®5ÁöúÀ—YÂD›×¶Ì‡9\T0€/•“8@Eîßoˆ½ý*4ÏâŽ>N2á3N÷ËÃ1\¦û0Æ©ŸEºÑk}«…¾€¸yü-/í™Èç²,$°’ 1 ‡ŸsZ•²AÛè¿Åf£‡†I»‚ÙÝ“ãêÙðIÆö„¥ê¾à“v@Ä'ðH‘žÇwëã(
Ê.È9‡;òúp§·ñŽºW—Ä–›MhÚ"yJYÿçtp ü›÷Dõ?Þÿ“töKV…VÆSýªk¾Ó7Ñ!ƒz–Á/‹Ü$Üí·…¶‡Ý¾‹ïíÃy‘%VÄ}Æ?>–pþ,Ž
Ïi“Þc‚³RÅ±éø¢j¬é=7¹â¬ž)™öÃšŽø* m¢×Qªv­jÌ£Èð¯Ì,÷yA"Ò¨ãÖ,Õ"U"õ¦êŠã¿3qÜŠªøÅóQ~"§g®Wž2ªHÓ‡:%á…“]‘N'‹æI2·€Mã¡µÇ&Üâ•k„2´¬Ï©‹÷]£'üv;~m>á÷'6mž¼óŠ‘æi y2©,–Dª#¬‡¡J·y*hC tùG\ÝÂÉÀ’ŸÄƒÛj:ðÕ•-Qú3ÝË.Ÿ¤Ê£­Ù6;†:RÃ5š6»aí	Fm
ÅXå%1à”‚2þˆû)'øb°k¢òÍ0£EM²ë ‹˜2b,ö²šx!äÈ?V4®N{è·žÉSáQ8àU¿†, nËTÆ‰Å/Ù
Þ„%]q‰»³êqÀâ’~Àd=ÚOåYÁ¼Ž3¥<±2ÐÌqÞ›ì½j•§ÏË§¯£`.ù“V+Ÿd¬9G*OÕÖ×œ&Pˆ*v¥Šàèí,~5$M¡»’ØJ«×‰âˆ'îD#Ðß)R†Ê´È ˆS+<ß ð’F`™Z˜áóÚXa+a+)§U}^9­ò;~;o/
ªœÀ„ó7“»Åë%ù“q`*âïãbOöâ3,ÛŒ_l Ï´¿®:=O6Ç,.™ÙQ“^Þ†õÏ2S—±Ó®lH´ÂzvAõ8¼«eØ#ÎŸ¡53â@5¹
´2º Çûfm¨\ÍêæY[i—nþP.‹2ããˆ—ì+ì*‘YËráü&ÜêFÌŒ=×Áj3T‘Á›,ô¸*J”BmVƒÑT»0Šñã„y5\d‰9‘Ûä#ûMçô´GiÞqg¥¶½¼ÂêlcýÍk¬­oß¼M	"#9”2Àøç1G0¸u„Þ#±:T´š-»¦Áªp>·,^'m<7&íDVðLë­¼‘¦ÐÀ@ÍìÏTø“™éé©×ã¼æYÒ:âù¬xDëC{Ú‹±I8G‡]‡éôv
ó, kÂ|jy¯Ó…<äRIÍj8¸Õ³ÑRZE VBû¬í4,$c›hØ§ë»ìt]R.þ	ð3x¼c¹ÏVe)^ÇÍrª=_øŽf1«r¥¬’$ª›‚ T…-eyü©TŒî]Š@IÑ5@ä'Qð@àÐ½ÂQEá°ôÎHÃ²Z¼/5£gE+9þ˜óÑè½À‰Ëòí2>æAW:uðRœ5Þ~šBÙƒà¹ãiðvüJóÒÜJ´ /Y|--Eº£¥Nþ	Šê¬«?8á™K8j¯ž–ëz	˜TU¤¹«T¥Rþ×\æ>«º22H]9¯s7NÓ¯-¯…šz2(“»¢7aÅ.àt56Ûuö½Å£¸H‚+Žx$t•7tNõkI²úDšÿ*¦Èê-Là…ïÇ„ö4!w$t–7tN!÷œYä‡®¡h¤!pê¦,f©ÓÚÚ¯Õ§fµ¾,ÉL»h<ßìãVZÝÄ}×ÆêL—IÁ‹3*]êM‡UÁ+‰E4HÝòˆDmUùüãè¤…Ox‹S0bé­¡†úAkt‘«ø¥AÖD
aÇÈK7´u~ô‘*˜¸ö	º3+µ=1Å\$X¬¨ôåðJUô²±G¢Á8¥-Ò	ÏÀH”Wâ:²qæš~ßíêˆåU‹yTP#7°ìp,‚3ëÀduwïs‹$<ƒIôëÃg“V‹´ÛÉë æ,Q/xr'¢_#Xz&%EÏrm4RÚh”h#æœ”`Ðj©‘l©Ì˜„“8‰â§]^ªHõÒª_¬[[YÀŒE§Õc­2Ì
RL)ò«Uƒà}‚í„p/Á˜¤Eg5ygGÜÑêj‘Z%oG£µ”¹j­Ÿî¬ÒÏÍ~j·5Fx{}tRCGJ×¤õŽ¥îyEÇWmÔÞj…ixe×’N¸nÎìE\'ÑCÑÈ×“ˆñKM"6JÃÀ/dYtñ"«®i¸Í6AÝúp`³«–™›ØŽQ.¿|v¼tbÏòªxÃ®ióÐÎãk%Ö-Xz}ÅmT
â‹õ£¾é!EŽü£´RV“Ð1Û BšîbÂ1¥Bñ1¤ÁáŠp
—H‰/ëyþDØ¿"÷dºÚ[a¬"`#õ»sHüÀº`¡#°Œ¶öðË¡’t’"E‚Kñ«
¥ïÜñàx
$9	àuZbP
„©/EÀÏ±û˜ç=Íhc|§G;SÆrdB^Ø±a6#¡¥¹1‚ÄÇÏ$@ÅŽšMÁc×Ðâk£ÈQ† âòîÚÎ~­mµZf·HŸž$Žº}ú9¨}ß)¢¯¾±cGŽGà,j‘¡e«eÖåÁ Cå^ª{K±ÁÇÀÞdb¢Q°ÌÌöœ–%ƒ'×ÔÑ1ú®–6Ço§1C³yø!Xa0"¿½X¹½W–¶6B ß®›ÐNO©à^e?4GÑª°O±5Ó7,ÛcÕ´Z5ºãÃ7žº2õi¾4XrR}\¢>nsfûd'²ÌI^'ðV!´aK€ÅˆC¥Ê€SqÝ»B3-2Â¯D}€„~EcI'w‰çXóJòP–j#
IÒÎ¹öè:ÒY²ÉIßÙpöMwhKVÎØø%QÄÈ‹«“¢MZÝ¦Ýo™^õ>±_ü¢Dk\õ3ê#k‘4hm²S‰›ùÝÑßJZE¦§Ò‘c-üˆ¨('˜þÁãöœÂPŠð‚CŒMp8‹¸GõÜÜUÀ©(Vvò¬ø…ÜhlÅhQ6&ŒæÍeâCméPYÝñ¤ä«·º$.$µ
ÒÒ!~¢7'NêŠ7g ¥Ô#Ë©<0ýGS˜8¤½"~b&'?Yê2ãF:eÌrxpèøœ†oû­s‘2Øub;P› €6Êm/³Õ6æiíÒ"‰“‰Îhë—æ€­¬$ãEB2Ì
zœ›hLkjjø€ÿùs†ÓP‡³R~8ø´ƒ.Ô‚¹~=(ÄB°a0\³ðîøwXÐB"Þ­swê:G@Å¡ºÔöQ¨Ø“d¯Ì,K!‹¶5W¾\·¢.c[ýŸ|qWGM\CAín½Ž{hó$b5TÅ˜-¬!UÛÁjüïN+Ó»¤¸®Wdl1ä% ‚ßL¢ÇhÂüüŠœ×ÇCn,˜MñÓXÙ\ À’RA¾Í©å±2Ä·|ä/z/Lc”Cúš4F±&A1eIÙKÒ8ñ%)2\€dÛ<ä
Ã:Üˆ¦>0¼ÊiÃk ;|xcP/+È…Ö¥YÓl}cz|ð]s_ÀÀ"{Å›ä™*ô„·dc¶¹g4hÞ0z˜¤ù.+žÞA÷äìº*?\Æ(Ÿ›ÌëÖè¢ž­5¦oÉ/™fLÉ86LsAJ,5=Ö0ò\‚ARÁaš¹›ÂtRC­›ñOó2L#<ûcir˜¦”üMÑlNC->Ïf¦1ž~4Hz*›*Ý’¦ÿ„zÅ0pNÅÎ»œnÜ+ß.RŸ°ÕW_e©ôn‚4*×ˆøUÊU"9$>¡…&¤t,Í`ã`ìn°ê@J²=PceXüà=?a;’Î^äÄfN
©Ò¨PvÒ½¨\?znFá5jPÈ‡ñ
¯Ò°‘æð#3as±û"½yKÓ¿'Ò‹ž§Ï¬ž§2á2@¥&=	œ5Tõº­O‡5ÙcùK¤^ŒˆBü—Ü5ÒBöÍO	$kõyÆ 23š†‡1ñ5Lƒ›âP˜%¾¼MÁ/ŠÔ' "N¿n\º|oLd1‘>Áe¼ü´%Ñ«´WŽ»WöMìD
ãy|¹"áÅw€ÊíE7m/^h‘Ë¼ªDÎÞ«’ßê‚J#ÔæioÔ;¥v§ÜþhúøóK×[ù"&þkTOˆ5“êÞŽ+æHW“i2
a"™I.’ÐÆ¨ºÊ’hSNåwM5®£Ä—ÿ&s ~&ó~LÃäyŸÆÆáï´/Ÿ‘ŸÔ#™qò]úæ:¹ièxÛ„×ÙÒ/rÀ-ÇE7W¶ì¢óžHnæ½TmIÔ³EñôÊp‰ûÑhk)¯²\iÃXËòH”Z<"cÁßt9No(ÍO _q¥Ï]`¿
?¥…-Þ…ovzÜV¸HÝÝ¥ßãv­²M&ˆ4Êj¬>tÃJ#Ðx0úA<iW|õâ‹í˜Öýç6FA
;´N0«u0–%ã÷Dˆ<bßcõA¥Ba@­¦2ìÑáÖ³V†XQj¨<~’\xI><î‡/ÍÖJ~X7óGí4ÙQÜ:gÔÛÑl}¥.aÏŽùÖó½_Ü²Q¹²;½2ß–cþûOÏJÙeù¸³px«ím*;Ôíâœ)¼
Î™ïâœùÞÅ9sqÎDºø¦ž3£?NÖœýRDµìò_'z œ¬(|•GïWòu5“§Å†
»ui…nJR¯ÐIkøæasáš©pÒ½bÆ†nº‘hº1Š¦yÞ‘Àmò4”âÙž¦<~5VÇA&Ihj¢Ñ×¢XaöÑ¬¤³óÑìËy	*J$à¯RìpJÞÖY¶_›ÕŠ±UÚ!í6V^‘VŽær"ªù¦V¨Pqšh	ƒ7Šâƒ) kˆaÈ6¬8dbý”0Ä-š47_?˜’'Ù{á‰7ÉåŽD!g4†/]Ž;º	”g4]|£î´i±aØ9ø¦ãmÁ1ößÿót>ã•qo›è7câ|Âu“á¹[—ë”{¥oGÝ=¿<T“õl%§t]™Ï|‘/æÛZºâùÀEï-ÅêÖ¢ßÀ®[{mfu Ÿí¹¦I
c*LÄ+Ñz¬g5Éóˆ—j~‡TËXëÙy/ÆÖl;.¦O‡>µ¥–kUFtÇÝ£rÏM¬Äv•Œ÷¼:•HÝ.Ê¿24—í<^óTÀvÛdFß‡Y¾ˆW*—r?'`ÿ{XG¹K«e˜dù}ž—œõÚ–íxü§ô˜"U?_•U?#›…w`-l28Ã/«	+´ËŒÖú-\@\)ß4šm¬ÓÌës–O´ å«aAKeHkÖ¬’ ^×q:•#aÞ¡‡ˆ¦Ô¤îøA2 ´‚-‹XvÕƒÊè>H"°MÖø¶1þÙÃJ¦Ô-Â”!v«e
¸VŠäÊT?'»›N£´G:9ûgØÚ2ü±¼Õ`[«×7–ËäíõzÊÛÏW¯EžKg­/x.€hÒú´Ó ˆ÷yë+K7·~´Á‚
Caí¢WEí¢â¼í¥b:h,Âé{ék±Ê:ßt=í½EÎ€á¤âUH¾ïú>dbŠN–Â´#/³f½Ð1ÑÔ©bÒ"{»+²nƒÄjššo½%7æ­·‚ñ”¿¿ÿ­ìøö½õÖŠÝŠ,qòå­~‰Â[o]¥’ºžüèûßúí([uš˜@žóÛ8û
|€§€Ÿl¯¿cc]Þ~—{	õ{UÕÇ·¾°Ð¤f«c‘}›¿«ƒfß¡Ž{*ò»µ%«b•O¸suL4ÿy86^[êw­wú‰È×øG(YÞßéÆ¥´Ô×ÌÌ×ü«cŠðGMÖ–0ã¾‘5Šäw¦Öw(öì`ˆ>±ÀÜÞç¡•ø¥(X­g|¹§®itáKr5P?ÁÐã‚e ´Z³:&ôÐéyêÒ)ï8„ZÎ~7ˆZ®Ó[ßm 'àÅA)hñøí"Ù¸ËËå9îdÓ¶z;ÈMîÃ¡mR›;…ìhé›
§R|°ÅjÒ4µh¼Î›™/Ô‰êW^Ô”ä³²_ÍÏ‘ìW™ÉjŠ+^|ñ
¬Ñá 8}R/ØªÜcD³rc)Ñ‘»^ÞÖ§“5ubU[D,[,ÝI"¶-&‘ò¾Â]%¡’eÄ*v–ï`&¬©)–,xÕ²ÍäÌéDšê'ØÔ\÷ùÿøYp?‚¿÷‰^LöÚ½¢>#¤•¢õÊž¥'ÓWòe?™'xQ';n>Š¤Œ‚âè0oðgÒ£í¸®n_Ëàdàd"ÒÛéõÝž-úöH|:à
Ò Ž*G•¢0á‚ð•ø1m-G¿'†_¾ÿ&¡`°l¯([V9®æMe¿·b^y˜Ô§\.	i|Þ°û£¾(W÷üï§xí
&¨xÉTFTÌœZXÒŒå±¨¬9¹7)•€cñYøWÏŒ E†©äžå,¿íºx’Éä~9õpÎÆtÍ!¦+c*°!µtÊIÍŒä‹âyÅ—Ì*œ¾Þ†\…ã-‚9Ü"¨‰Z2ÙÉï¶”
u(”*6F¦*¥ÁôF\Ç¾"à'mÞ1ÌNj!¤«±\
hP^N£:ËÑvö§®sEú‹R žÈ÷Ò)ô3q Ì\oö„šÚd=Ãoï‡'ˆîªêaHÎI¾ŒÊø÷GÁL72 ¿>–•/gœiUÕ@ƒ³®Ã±†Ú»˜ßHQ'i[™]`+Ë«?ll®±›×ÖWÙêÍÍíÛ776¥Š#7y mX ùëkh‘ê‘£ù ËÏ¬Þ¾³&ã’`¹XõÖõ[ã'il¹…Y·Ñ`‹Ìr¯7uÝ÷{Sá¼)òÃœRäõð¡Ž.æ[Bð”—+oÀÌ¾…œ7Á .Ì[oáÊ¼õ–²4o½EkÃ-(Y¯„?”÷n@?6<TV5i‡áÝ6AôüÀø’ºÖD¹•n{!÷ëˆæü;	mQm|a¯•Ã¸á „JÃk¢bÏôU½¾h™ûÕ1t…èNJw÷Éy¤A@CM‡Ü,sŒ76ž«õç1îU±$ì;.ÿcB7ûN/ü™çCÃ¶(F&*?­-É»Õ»X	ÄU£1|ÛrÍÖ/8Sô‹Žq°03?Ë+È|e¾‰ÉSô©dŸÄ§yŸ˜zŸD·0:>!
ü6l¡Æ­ÞS¶6\»»’¾YÅ¶á…f"å;e/jKbûÂÆ’Àã1H xí MÄÿ¢ï4Î=ÁüäN{@:£eD&Çrá‡3Ð<EUf"ã÷‚dKi÷³f£LAH@¼‰3ü™çt«wƒ)âö À€ê¾¤x'­Ï{#3iEi`Y³–<ÆBòsaÜ:“Æ­äF1Üï3WtÄ%Ì\3•¥Wmÿûon–"&ÊkÐÑ¯²œÑ¦É{$šV”Q´/X•³¶Y…)¢ÑK–è,X³RÙ±ò¶¬ä·#±xh¨\ê“lÍòz¶qÈAº"ÞÁ—¦=°ê%\H|!~ÊãÄ!:†Ñ™
™Ý¼‘Õ³õ¡YF.õCäš#Z2Î?bZ*ë­1bÞ<˜–dÑuÖ%¦<djQ°)V~«£Š‘df’Ý!æ•©A¬ç:=Óõ-sp5ìxÂYj‰(¥£‘¡Tª\…ðŠV£RÝCaÌÊÈq ßeIkNyæyžAº‰P{"qQöåN`€xùH=£ÊCRT30B3Ì½â³ah²Ž—¢·ÐX´ˆ}ï^œš¡Š£l#£9Ý#’?ù†$)§²œI%YP¹žÿ$UÆ"	EG	æ)RR–?“Ã,òå3f'ÙòÏŒÅæëÁ’6ÛBsõ²¸Uo&yÓà,âpŸ¡€º	ÞuEù‡pý_i¼É%è©¾:˜¥`¢ŒõÖ ã#Á½¼F^®…tn­l,¯5ØÆòOoÞÙfÛ·6–·eÌ£;¶Ñ2/,£QËè
.
Û6;=Ôß±7A´eÕëÛ76Ø«lÅq|à­Œ›?Qã(F¢·™MÒ.¡Å3T‘H:"z_‹(ÍUC ÔXÕ1Û8tú¾7I³ÿÖÄ”«c¢H2Ük±ÒÄ q¡†Ô¯¸¹4ˆø›5,úˆz[UªÛ  j±ÒÙ©‰Û7©¨/¯ä-R»Aã!EÙ‚Ä ¨¦$‡BßpU4RËÃÑîJDf‚’\É¨a™Ym>XÚ"¾=»’&¾“[õ_Ø$‡Ñ£»gTÈTúæ}”W4™ö!µBç•Œ”?Øu\Œº®†Ê7@*ü‘,˜³:­¥£#úª¶oØñqvüìJ Yý8ð¸¦Oéi~Á·B» ßÁÂFïšÝÂdd*ì.ºÙ6›vœƒŠ„4ÌH]£»5z¯öf$¦çf‹²õŽÁH2F‘:¾ô´? œ;ßûè>GÒtÔÿÁ6ÄziŸ(RYÓdô¹0KžI³$ß$<Ý/,‘Ñ'yÉØ«…Ë‚#ºØÑ1z†Kú„ßÔqJ†¡xœ’£Ða‹(Úhq÷‹b‘è‰ès±p”™Žh%¥¸Ÿàà‹˜®ÑNDNø·Ï%TFŸÆâP€)á.!:›Žø	m-ç‹G<è$³=úÁ@Œq»AÛî	4ç"Á"¿q¢½0rZ]eˆ5§Õ=N®7Þò¨áCŒwôMƒdd°vCídüåiñÜ!$-úQåè¨rÌ6ÒœF„Wxt\9æÛtT':üåÝôq…r±2*ùúi1>,)ró!¡Øö‚Ù=å•<Æe\Pt‚¢² Ä©/•
R­?â:¡£PÜØ¢P–¡±»wrÛv2@1ÕÎ!‚¡îeä‡ÁàD;“çã
 ³ÇF×T¸=Šë¤MÚï§¥Ð U«ÕØåÍåkvÿ©^½³±ñSvõÎæêöúÍÍå¶ÖØZ¿¶9No¦Y§Ž¤9c«¿Ø¦:FÝÑÀ‘i¡Ê²N]ŠéŸ¢Öž×peS—#ÓèvËªëÝ]‡§æÍ´²Å‡„*ž±¿e™0ß©¹h¾é ƒyüšov2w¯|'®J*îâV´ d`¦–'ß|v¥=—0	=7”	uT ºgèÑš•ý[<µmTGUx<MõQ¤Üÿ  ÿÿì}msÇ‘æ÷û%Ø!¼Àà…EaIê@ ”p_– íu0xbc¦isfz¶{†L#Bö…ÍÝpøüÁ!+ÎvWkŠÖÑ4­àYŠ¸ "î—(ö—\efUwuOUuuÏ (ô3Ó/Õõ’™•ùä“THî¤løÛ7OþoBÔñÍ“¯¿yò~ òø#ƒïD‰:*7ßâ—ñ#ÿé*ˆÕ}®æƒ[áývÖÈ®âÔì€“è ˆ#ûÂlë¬å×2Â„–¹°da®W¬nPì2ÞM±ü›|„Ÿ©]‘é9~æ¿}Æ“¯éäÏéÊiþé7Øû_ÓéOôË³ožü¹TàÚ—ò¯i,€aƒÿõ[1pð¬gx
?ñ¡lÍçL¢ŸIrŽÏ“ßèôOùg÷¡z‚ð3ÍùæÓÇÂžØ¢˜×l’ V‚óîûL8	1þO3ŸŸÄ‚.#HE<¶ˆb‹à.|#Ô"ã~nxíö>ü"›èž¿ƒ÷\„! ÖÂ§Ö >i¡þ6ë»&ÐšSbÆq)¥Š›ÜòVJ’d‹”æ‚êIÙKËÕ-Ú/åP}Žó&³¿à‡ßÓ0ãzÜ€Þç[ð ë;È¶&mžú¼ìÞ‚&ƒ .nÌ_¼½»¤|\@	wN½|Ð6{¾Ý²áïôÙ&—‚K‚ß|0Ÿ®@AØðóšiàóMæ-ä›÷ŸQ*Çhª8Î/ÇÒ:³	Î£,šÃª”Äó·Yo{æä0ÙÅXÊ¹y«5W+ê&Þ€íA¼D}/£ ¤Š*û=ð©Ê	h–õ¦],Á¡/»šJç§r	%G±.ä.$œbŠV›Ž‰ç}ÝÖŒî(Ô“Šl-ót{L³¸R…]ƒ%îçTE§tœ´ê5„Â¾ÅUøupÁTcºÜ­9tQ¯Y+wÍf{°[ê‚Ò—%›&®*Û¸V¸·Þ½Êu¨Ž-Ør!\BµlòÄÄ¶§QR÷¤'ª]XXðÆ žuàµÈobå/¥f|el¶wÅ¯iÌ>c!®ÊA‘Ïq}.5@§i’p’µ®V$ý.üs•Ð½Íú'›ð1ŠÀ$m¼nÃo›êx_‡6–3.e_D —]©/q¶ôHq5–6§Òcƒ	ÀjU$_`r±ý+ß!ûv1n‹èD ~á=ŽM°6’œŽÖA!x4~Â~b8eZ|yøÑÅ	äó&¿:ÃââÉnï™Ü2<JôÓÇrŸñ	½þý™}jß÷Úÿâƒ^*ví+›ë‚”)äÊÀ—øUfûunAîúý:Þ¸ ‘2¨{d‡KÌÎBbì¥uwÂÆ N+ÿÉEßÞ¿„ƒ>VÓê†]?·×L§Ìy>elÝoY³.ËB„ÕÄ,z“-óÝÒLÌõÌ	\#q|.½
_ë–‰#¾òu‚®\«D€Û§²T0âró­ìüçŸšmy-ýöm_„I?ËnÝÜ`^;ðÊUó(ö4m¡ŒŠú!
è_¢þy¾D)­Êê‘˜•XY?E9îçàÌ£%½$:l#èÞã=ØoÑ’rPözwÈÛÃþ·v¸'6–81ºàçi3¨¶4&.á
‚%,–ÐÌn²„\6&Åk?7Æ òcÓ¥ëÕë¼í8løÜ‡YÁJ?ìÉÒnYO£
7ãsâÒ¬S:È¨R*'§´ý[TJQR0KŠlo“ŽÆýNV6ÕûáÌŠ²©ê‘­ÍÞþïÞÌOæfÞž¹3»;•5KjÄX{æëEã”e8¤©†×s‰¿†Û>.v·üèua&Y¡Ô•/#s~;òÓ‘Þ§¾â†Ú‡Uà&']ð…¢%Yb…¤pü‚Óƒ&û-DõÎ€çx¦ÑºWx‘‚‹¥‘ì˜+/tÏ,ñˆ2ó_xÖX&¢znNNxHjWâfs‡æ™4FVj‹ZäÄ#ÙêwÚWÂH×ÓZÝ	Î€ÚÍ“/3öÛ~£Kµ°Š³Nê"ö>ðÃï(Â…ÊF	’Èp…]ö"Kˆ_ÝA5¬g‹RX3Ón˜dÔ“½_˜[x.~?“á¢ÏYEÌv	øìd–—[Ò½*\› {qb¾„jKWU—oêùº†MÌÛáP$z¾Š"®¦ùC´ÇÕ¼ˆW¬¹ÈÈV£°TÕÇyçJ¦ö#ÅÔ~DAÙt£Joã¶;%!fï}ÕÃ[Wó—‡kv†TÓëîËãøRBªÖ@9Agý@ëÂ©µe¼€äýƒK7-õä k{ögøÈ¿ãã‡±.®¥fÈOná›œg£­Rá€ÁvònëJUa"¡ƒgXý²òEËzf¡•^ä{öU…{ñÅ‹¥<³¿Iì2UžáùR†+_Ê)ó‰€è 1•ìÿG±Äz½îì¢JPÕ„N¿:VªŽß,¶m(ÐU?ŽÉûš­+«/7YZe½¹‡¶¶¶¸¡I¬TÓGE%±–ùMiÏîPøötÑh´Û Ï–‰Îè2Æí‹¦w`È¿¾éÝÇš‡¶>×ôø>Â½ÌÉßgçÏœ1%ç÷½Ùðqs@ÅÀoq/g:Y@oO_¯g‡Ÿz÷+@{€=å`=&PÊó¥IÂ¼úû7Oþ4²ÁW£…ÂkJA{žÊ0*iã/†Ÿ}ˆ¾@8#|lÓ³ckÚÛ",Ã›HI@ <¬ÝeÀ”ÆÇŒ
Wâ½õšñ²;ñÃÀám¥8Ga¢ñÝ y:³ E«á¢ú	døeºU~òœewÐÂxøŠðtºiã‡*B¦YA»YŸ˜¢ÅD3a}ÔÝjAço…}¯½ÄÔd–~§ÞÀ×¤ÅñÓŸ²Ûw¦êm¿»Ûoà«×bÛz/^Ñåø4òtŠ2Ò­8cˆ¸{??Ý„VLìRy;¾ÄÛ^Ï
v¦ê)™ògEZŽÅ¹Ü0+Ë+Xê˜V`ÑEéb/ÓIÃ3É,/cLo[ëÐ³ú°..BBP¤"l°ZLTQ.­¢îÌqŽ¾rlá/¤‚ýDš£+x6unÓ~! ŸòVO\p£?<gzv:4¢Èmâ$bu§çëÉœrg¯"óRßƒ¯u>gö™øCˆ¸â`‰«ÄÂÞ˜#Ì¡‹ÞQžÖd\6lr!wñÁÙƒÜ¨œWgƒ5Ó‡™ÍˆËã»2z]ÊPaTK»Éöù¬H±‘s†/’_iaÜO^ò¿¾R¬¾þæÓÇ.}b¤(ËUØÃS`®Þ©xô;^¯VƒþYBß1ì\‹oKrúž¿O[äzÐÌo²I’²{ö\@ËgEÅl—k¨žãX‚*Qq›E€¸lC›yy )< :Þ3{3·DüÌévC³P“ƒýhÐmxýâà¦òÆy…=Ý' $üôc‘kBi{û¥õEDi‰W  y»LKu–æÀL™;Ðf¨8“$=J§)¨Çì,û§¿šõ"ê€0Èojî%¶ÖHÈZaÇÇŒ8A*M>nÔ—zPØ…b•[á{ün5€¾z‘ë•{Ç¤`#
‘µûàó»ÈºüeWÒoj“"…ÏŸÎ{ŸÛ‘“ÓìpÅ‰y‹˜Öƒ’ígl/èò-a½ðÙÀûž¨´§ä¦ÙB!“`î×¥®Î‹ÈžB·(š­™ôiØ¹(ùˆWZT éê;3§$;ˆó4¢·6D=ÜW _ƒkð{w½6b3ûVp«íÁ¿YÊò²ç;K;7½‡³¶BËYnÀ²!\™™ÕVÆŠvì
!J€{ƒë•¯Í·O._Ò*C´b®Ð{‘»O~;tÑ?½´¤3Îçòq‡ÒqÍ4¼Ÿæ)QW·çÇb©öŽÈò{™l³Nè¢dQ®KJj¸áÁ0w'.áîmIL‚Ž„¹ žå ”IPÒ‚p³Q“[—˜	ShÖî(÷b?OöÐú‘Q/·¿Â/h6ýn‰ñ.7Ú… #ySbÎJ u.{Í]{Væ‡"—De	èh…('–3Çd±æç’ïw|zk.ÏBBß†pj}‹7qàbiÛæ²|²î@/èî–R¡6÷¯.“CÉ”´ÁËÍñC“Ä”%Ç—>oR„cìã[”Ã(™"b¸d§Ù“v2O)*Âm7¶«Aõ\¹-ô!†CŽ	¢:]’_£²Iíhñu™M­S²¼zäv¤Ê†ÌxÄÀOè¸qI:Ä–‰FÚ’Zôd‹‘É£Èî@Tâ¦öî+ÛðW>S-ÑZ¹KÉ-ÈØ†}Õoû}Ä0Ô„Ç­Ê°Ó]Æ2ð"±^“‚¯dÙ¿úQßŠ¼¸µpÔÃ~;OŸ0—êE‡‚Y3T^B{JZpBB1äç=¿Ýã–ÃÊÚl’d°þ1æÝ–ÌõfÎ25J˜¯¿ D*Áø,Ï8'¸VP:ŸÍÈ0! " ›ñcfèKÚ…úþ??ü„îSciüóÿ)°÷E&ÄA$eL2ý8 D d˜à>Á¿“¨Øe¨t{##¥áB÷t­VKQÍ¨ƒ¶ÎÇ0Ï´ÜE·&RR¡3Í n@áÙRqþíàÒ…¸…Ý]­üû‚ºÅžû{B«G¨I²æ¸-ýh‰:*à†éî€7k“Ï‡0ê/¡%MÐŽXÄœaËÃ012õ‚Ë?“õD¥C|ÒŸ?$pç3Û”8âg2âùcY/éÂEl Ú{Þ~Ìv‚6 	ú-	3»¢zA/Æ-ãÁ{ IÕ#¶F÷b¶í{nyñ=Ì~A¢Áhãñ¥
Äý\K –úihH€UÜsA÷Ç¢¹}P&òIcÜ=4Þðx1êEÿŒIv¿ßa÷?¤A|DñÃ?_æC
Ã5¦³=Å÷úL	>
š?l~•3\Š€ÄÑ4=ËÁÇ÷1ãË7"Ä,ÿ"HùD¥J\àO¢XEÊÑ7–!¤øÏ’e¤JÐ°aØïV7 (/7½×‘æFÉ ÐàùÛÃÊôk”?—óOl¸_%Ëî+êóÌýH ?0pü¥¼áCšÀf|‚sõ%Šà´q_°ÚÌ”}Uæž+Ç:&f”Žó)MÕŽ×îqëqÀ
F ÔˆeMnùPY/îó!eáiÆ˜Õ0‹ßkðqî™xJ)â™…¹…sS£}av`|»ôj5^X¥wóÆÚÚÊ{åhxãžï7Zf^˜‘Ül's ×G×ü:„¹Ö_õw¼A»o
âAÙÓ+Jð~+Üô#n^›|$8ÏHôý™¼“	7K‚…éû[šë_I'&Ÿè2§‹DÒŸèÂ/‘¡ò…Ô‡ÏÁ–CçŠL–¯rÓ?ðß˜˜6½w¼ì£7ÙrsµîuûLùš†O\¬IÌD…VT/r±ÇÞÐo-ýî5›Ë¾UÜwkdžŠ™ß]y.h:Kƒ¸$¸íÂ¿ˆëúšg:g¬”Í…Dž´—òü çªpw*¯¿I¯_’¯3êWEk`‹ss³oÏˆ6		<ÛK&,‰¢‡¸£q¿r^‹þw"Qv/@H5ë'Î„Ïøìqq†ª
Á1F„5”X;<a6ý>À†ã¢}ƒEº$Zvh9tšCËÁ6§-©â’Ò?jÙ©±§â;ñÏˆT(HV'1ÿy÷üy¹áÄÉÉ‚4-}ž”ªçj …ö 8Ö^¯£6.>“Z¼ÄÈkÄ;L³ÌK,±\JuáûTâ¶yÕ]£Ñ åÜOèßÉ¿ö:Lþµ“6ùÇ0Á_ñ_õã`·Ki©ÇVÈ7ÓFž\!Ÿy‰6Ï_k!ŸYÇVÖ+ÓçäÊúÌKœ°5ðŠd=l
’ÖÂ-YÑ´¿êÇ±Ž‹Ämº»±%H¾„³Ece™íÉóqRgzò'l–[	”rä¯çŠ(§Ž|Iœ\áŸ¼ÀI[G:ísîÌõLÎ[½vè5Ù›˜¢kG´™–ÍBvÙ±°¦È>ä²¨B ¼?În¼?P˜;ï°»Ñ
û¡++¤‡ÿ€Å%ü;‚ðdÞýi÷¼énÞšY˜è\® A’ôø‚µYÜŠ‚î½™aœ/y™YY ZQÒJ:ûÒè|!èì²8jèÅSîžÌk÷/*ñ“‰lOá
5Ü†8¨ëî‚‰rê^¸ûQö¹çùCÏ—¤«ÀGÉ'¼Õ°˜Ï¼t…R¸ðè¦µ‹Ï^\^H»ºÀ —6¹@…u.ï×ÚX®ñòþz³6ÙêÌô`ªPÁàÉ©wê”:¢
U –ôóVª¤3‹ž–*	¥~&Ø%ÐS9¥Hºtœ#VO¨=šP9b”!ë)Â~õÍ“O†Ù‚Ä­Qå8¾Ë`Qa¹¯äÉ¥ ­åçðÐ,¶O‰md6}rï¹Ä&&¸Ñã`ÕÈÃ<Ù±Hq¦¼|‘ä%á§sY¬Ód¯4‡Ý‘±fÔÙ¤ÌFŒÎÊ›~'tNB(3#:ßDëæ‚Cñ9œa¼è(>…X3ˆ€ã7 Ë„Nt‚tXöùµH»‡{–ÙhTY+C›ÇucÞàÒmO R¶ÅÁ¾(;…v‚¶~Šd­ËU^£á÷¸ù†slö{.—¨
	­[—‹†¦Ž ‘ @°‹éô€Ïñ;õÛswÜ²éƒVƒk¦œIè¹a‰wà
¿ÁMüÂ
nP»¨n/²‚±JÒ!@ëñ:ñúïÔ#?´ûîo‡y©–¸Iê(uQ"J]Åò£äÕÃâEéDÑ‡Àb÷¡ÊE©›—É†á2ÌóÁõÆ%g ü·ÃÀs5BkÁí.r ©(./Y¬‹CHNõ¬?~ÅlCïƒvì0h’¯¤: m¼€U&Í6•NÑiªÏž÷T¿ÎNF¿FóuÀ©½ÈIóä¿v0ÃJ8¶(†Ü:¹Á¬¡9aKá„"×h¾ŸÐÌÕ×¸6ô"'lª¿®RÿdàÖr³çdKüÕSüšéŒSüZ~Ö¯œt[æ%NØl?Å±W›2«N¶2X9Å³9âÙ´ž­×Ù6¢P»iûëö6*ìí{‡ }ÓÜWÀßÀPg§¸ìI§¸ç‚à2Ç·§K¯+Nó®§`¸S0Ü±ÃéÖä«Äi×Ì)(.s”Åy§¨8íqŠŠû6¢âô2æwŠŒ3üìÀ•¨ÿMTE##]á„N+AÑÌÛX¦xÒÝHÞ “$w.uÏ4öŸ±_ÊW27ÂPs¸±R5È—y·ºÁÉl†ã…Y š,GxùÞúæÖõ›?*ÇxÙ
â~í{ÊË‡XþkÉ”úå¡òQn6ZaØfïQß	çdLÃAÐR”’g+RJšü½fe•€{a`åG¾±µçƒ¸å7°ÅV«cd]·?ÃP÷ÓY£•ö"â!êfD|5Í”—ß…¼’è¶QðÚÜaÌ%¹n›~Üˆ‚^9 “SŒŽâsglƒ`›V	mÉÑN*[Êë2¥l?¹Eå¼»åÌ"ãÔ¾1À%Ÿè›~ƒw-»Õkz}?>âÚõ­õ•5ÆÿùþÚÍr–D7„
ïÇÒè1Z&…3&&ê„èŠ7Ë”1+¾l¶…Z%Lg]~…Îïçj%Žç2n‰ÕÀÐQþžEÆæDÂ!iø—»]Þ¨2ØU/ú—ÕÙÌùzÃu"ÉÕš+‰–Åm@ag‹ÀÍ½œELhß;©\¡–@{‘)°þ1ZÑdK?–•òôü™žJþŸÊÏä¹)œ!Ò'Rÿß'þTåÑPË»ñ‘ÁbZP0¡CƒÁ­¶(æü¶Ï¶½nWlyø)^ŸO¨>,[Öø®€«œp¼¦!9QãºÑÇya¶WZ´•²ìæÓz9æ©^¡O—¨ˆÕ_ÃÕŸ²[ÐŽŠ×Aí*]Ê%©´4îùQ‚3Þ¡’ÊÍ>bX·Ú4«^¯RQÂ…Œ«8«J¹zÑ¢±Pï’hK•Wd®A÷ZÇc¾9"²ŽbÂ­þ„Óá¢^õ„ë¤²F^sQS³7·¬ÇŽ	¬½ô¹TMæUÍ‘hù¿ªE}Æà›À†­u|>ÞÝÆ>óÔùOó¢Š»‹ëÕì¶HJùI“ú8/¾8ŒŽÙlÄy±‚!®ÌÖœ+RM‰u3Yé·à}ûY	DR©‚¥^ººÍ»Ëk7ÄV–·ÖÞ-íõÛõÚm?Ú¿Á-”]«ûoÜÆºÆ„ÖUØ{;±Ôg¶!Qzaâ…‡o„Q'l![¡¶~l¶ˆÍ½½Èëà˜²r]tYúÔzÇëÕj¼§YÐü åYš`Cîùûðs3þ;Í§‰ÕMs…¤mQý™7Ï¡œ³¼ÅYÔÒAáÊn]›¼Óbv‘ôçNÐæïVkÀíì>OyëB.
sèYK™–9ÄÂT	x—$`„ ‘&Ãð6“+i‰};ýná-ggùæúÄ5óv`X±QPËê¤ëÅHæÅ·‚ŽÏõqÍmHªiAyL$Q£=’uÖ>OŠÝi4!m³^d7[¸ãËk¼LiµÃV É;‰®B¨—ÛÄzOõ§<
þ`šÍ/ÎœV½ÌÊ	æŠôcúÝyi<§RÖ½¯=òùfŸO¿ØöÅÐ(«sØdÇÚ||åáª" F ¹Òõ÷føB¸•,.*™6”Žµô67ü©	p.q’¸BÍÏ	]B:“dæ[@!³™×ŸœDÂ{[W7Öá£8qêÚpØf  EÞàgMqqÙD]Û¹:•q›Ëp»Ú˜†W±¢n_CŒÖbÛÆÍ²IÛC4*ˆ¥U@ü†
håSRñTU:èµ{L¾9VEûü¯¥ë§]µL\ó÷X"#hFT,ÖÁ,T(e’Vg…°Rw\z»›1þåf3é"£#Ô¦=ÆY*ôÊõë[eÃ;aÈ_Ü!ÜqL ÁÅð(©3«¹ â
v“u$ˆ
tKìˆ‡€+¼Fä7yçò?Ë•ëWhj4²§C‰•¯„½ý(Ømõ)r¶È«…^Ðˆ¥Íêÿû?
³Íþ Æ/Î7Ÿ]¹ÕÎ«SGÜÕM¸"f7}œIÍº=åµ’ï5×¼rÎ×Ó8ú‘ÄÑ‡'DŽÄàIô|õG×–¯®¯°õÍ-¶róÖ*[[]ßº~“+˜›lycƒ]¾µ±±¶5‹¿o-_Þ4«œÛ“Ü6LN³É¸ðiíø·¡ýþn„¼×û¾÷ý˜oÅÂ.—kxŸüAÙñþþÖ-üÉÒ˜~‰ûïóÉs/¦;x–Åü›¸_B¹øÑ«¾¿ÏÛâ_Ûíp÷ý^óïïÔƒn£ÍOŠkYM9…JÑl$’ÅÏü¾¿¯8ˆT=›¼(—ùùi)w¶Nš§÷_ïlxTYÖ¸×ÝŸº-Zp„Ímí^BóBøu5Äi¼LXxÚ]…&!_µb´îž¸)ÎÑLfý‹)•ã,C€¨PÖcAçÍ[Ÿ?Ü‚â€ ¸®Ø]ŒÏ/Ç ×ó£†ûààoÜƒÔû=>P„.
Ù&ŽŠ»ŸhGPd’9 >ˆp ÜÄi…{]b²å³ÄlÏßŽAÎAÔí“º1Ø/ZS.Ï3sª-–£˜dæ%}Å•ÎÅüæW3Jm|1.LB¦â[¬}ö Yaõ¶ßÝí·.¾ºýà¾m/Yä›>z:MåeÐÁëb	Äºù—Xw  šwÒ4rùó[ÔƒfÞíO:O“¯Â‘€™˜jSST¨ÃHþu\F•D€¶Ö%q<?3‹÷-9=?ˆ'.á:eß0	û6ï¼sÎÐ-›[2ðAGÞ”D[§ÑT©§’ÉM¤{–å(áV©Åéãc>1À"fæ”ÓíS†4{²Ä¿.šHÿY‚Ä™—L¹ÔyÄ•´å^>¾6z²ÂVäÅ­…rY+ÊåŽiÆÅ\1x–ÁÌpZÙ	÷ÄÕ–ébV£*{5€~r1üTÅGTh|—¥˜ÊDƒp7ë4±Ë¥R'û[\eý ßö‹hêQ1C5ëâÏîO]ôÆ%¿*¤gêdjâ¼ »˜
0¾7À=z<ÍD?/áëðmBì&ÝJÈ7'y¤Ûës!DTì‹y2}½ ` 
™×è•ä]·Býí$‡\äË1—¥XÛD‹ŽPLãÕãTLTk§bâTL‹‰Õ*ycJ£$²¸ôâ‡„µSÁáÑ£­}êæc°ô	`¾p*'^9QÅ¤IPœ	]PáTPœhAqyyåûïÞ¼~ëÚ*[¿ºüîZ¡sÜaÁÏ¥pÚnÙš™_H˜eiBÌ%Ê¦E™yÊÙ1PÊÒ!\æH7çÆ+^-aMo HbÉ±|ƒ‚Àß'E,®D±¢ï¶ÃíÍ"oÁ¢Z¯Í•0V4À•­Ð‰^Ou>³ÔîŽrDrtÍ‹î¢Ÿg¾›ÄUîº_U —££Å•U/Hµ–a™ƒ˜zö›ÛswÊ1¯YYìœ9ì²÷™™ŽŽ?· f_ºÓàŸÕ!JDsØ”Ñ¬œ«K)gZ–!®œa"RôoxA¥a¬Lð&ê|®£ådiÐQŽò·é¯3ƒµAî•å±†ÃLë›ªþ$d–j}E/½•5TÄ‚MIƒh€3/EoíÚ}®CYHeM¿ºNŒ|¿%ô­+ïoE38ŒXfc¯o)åàf1došÅMÅ2¹f•1hÊ:üs4Ëß<ù7äŸ~Ygˆ½NhL µá/ˆ½~îzcÕK°ÝïB”ó(Žd¯Œî,¯â® ²GTÖIŸWð”RËÎïºÕ´«,<Bª‚ÿðh¥f9.÷zí}v-ÜA•s\žÊ£qÈ£J^ÌSy”eä‘ãi'Ó“I"k#èÞc5(1Ë6Ûƒ]þàßá9ÇS1,º¼f'ˆc¾!‰%ƒRL”˜^£?ÍÂˆµúý^¼4;ëàuzm¿Þ;åñ|½açœ†fŠ=²\ƒ~>±™c&Ï ©B!‡„Ñï>OðþrÓ ¡ô&péw=Âì’Ã5Ý(õÀÕòêÝ‹Î¾U†Ñ”-e£eÄ­óCÇdÙõ¼(ö×»ýZVNÑ+|[,=µS+ït×Y$ºú^—“U±ßö®ÂJ%1>Œ#ƒ.¥ƒMÂºÌÿºãµcˆõ*g-±IñçéNÑéñ£ÉŒSb0«ÜY³ÒÃ9ÖˆŒVÎÍú‰KËø?«‰B5‚9ûk¢Ýàû,ºªâCä:›¸´.þ‚Oöß³\ÝÕžxa–¤ÆøwÎ#ŸTxŠÄ¡lJjqªe¯”õ¹ L³'V;D)Ý#“%Sä]±¸#¡ËWVÄ;‚2´ÁœKå—9!_w£®¿G(Ÿ‹N‚?h.1Þn¿Þ÷jSõ~¸‰õÚ”‹ÐMÒŒ&s4UÄsÿt"¢ Ü¡šäŸ#ƒðgøíóIç'ÿnh¥D/‰L§H¸ó$Vå¥O’Šè¿‡¯þü?“šêÃÕÓ_RpŠ^ï)^ûk,¶Ž™>}ìÜ|‰ëƒˆù4üvs{~ÓÛw÷‘«á! ÁïÞø´Â8¸Ó½@bÒéd%@Cõ_¿–cöXÐI~£?ÒK‹_%îï¹á{Q—]#ßõRògLzÛ\S9]#,þÌúø;ír©ô¥¥Ux‰D0\¸,ÁVŽ´n€0óÆÓÉº¿3zëJ1ÁN¨4|"Ÿ°™@f´Â+ÊrvçúL(ÚÛŽÉà¬Xt¼@ßhó€>'Iâpdm0c½šôâýnÃŸÖö5"0!A@Ó‰.X:yiÝã›Ãn³–Òý·Íë×ê„ã–H-¡¹ ÛÝ±]‘÷ø `½=/àõûVo•–{Á­¨]›œõzÁ¬dÀ™v’¿ß
¹*ž¼q}sËMV†Íý¥äM‹}©p|=ù¾õÇa×¥÷­)îñæ›ân™=° ¼3²eÙY¶6ø~êAšo’C“NÏg•=Úpé&]Yç¶Œ6ŸÈ—ö¾d.z¿É»pxv¨4In›;·×YâžÇç—Cü:)# ±­R1\Ÿâ3HÑ¤Æ@À‡ÈëöÛ&ÂHõØº\XÕ›âykpß,&úKvƒ|þû‚íuÒi5 é‹²“Æój¼[ËW€š°Ø‚ÜÔø”èLmÔÙ	Ñé³l!%g>F¾‹ŸPØòü‹¼›aô·½ØÃ…‰ã€ùà¤q™¹nýóW´­^,•{Ý?eˆÄ‰_œv¯Ÿ>Æ÷^‹¢›ÜK²Þá-yÄ7W¼ M]€¸q¶ƒ&\æ|‘'ã 8yùT¯ùQä²ÞA…m¿îCËk“7Þ»‘i~½Ä—*Ü®¸u|±]ñÚímPí(	
¯8Jy1Êò,º÷8×æÜ®ÑÖèpƒ©ù<Ù&Ðý%î‹>!FU+Í=­ÉüroG#ÐÞwXŒEsoˆ£YÓ)“ ¡ÏÎÍŠ>Wµýj
ž,ß“Bú˜ã…â6¦â¿ÓžT±©NFuã´|™iq!’VáÕä‘ŽŠpŒF–oùQÏt«Ss&NÃ„yÒ$ÇÈ|òîs©
ÕðÖá3Ð·û€uyr›ïÝÈk<Ð¯ÇÅ
%2ß3ø˜ìÂäN›­Ào7WZ~ãžrú–Ñ×wYÞó¢¦r=~f—½æ®ïrùå0¼wÛÝÊà#ƒï^¢çE÷ÚÈð™¼üÊáò[±©×âgö._JN]øžïE}årúìpá
Äœ”é³Ë…^›Ï4/R¯•_9\ŽYtê¬ÁÏáxÇ`Øå¦î
nh]æ.”¼òÚ0[¶wùG.ÞÄ7Kpi>HCåj†p¹¸Ì”Kµ™Ó¥XT¹VJuºø~À-”¾r5}ázy|o_¹–r½°7ˆzmõéqy…ñŽø$ó#S+a‡oò`Ûq‘Õèqd×L§’ÿùu«ïhïÁMl†ls¢oIºÍ.d¾W”ÏƒäÏ®~Ì*›î®ŠÃôÞÊ·•ïL"2½'‰ÈªwK$fzCùUõw—"SyqñUå{’hMoH¢µêÝH²¦wÃÏ•ïFâ6½~®~7)€•Š¯*ß“³2ÇséÏ®wkRY„q-½à80Ž‘™›3|Íi®Ü¸™›û¾×vanÆó^!sóíïÌÍ-6ÏÜ1S7¯„‘Ï®ã°ÆýÃqÂë~¸ŒÎW½.8ÀÕ€¦Ð¶”5Zo'ïî€DCr=]Ö
v[3€)Ž<lrÁ8Þ•&ß~5`’Æ9Bè£#‚–ƒïúCg‚–[Ð»;Á.ÿÓ–hy¢ù í.²;àr°:˜„àÀß?ý)«á1ìµæ •µØ“¿ÎÃ¯ªnW~[Àß’íÂÐîª`›Ÿ¶M`Ù@ð·P¿ù¶¡ašo˜}L±˜[‚°ZÙ’–ZäÐÎ·ÙøêÀ¡"êi¿õÇ¥ £$çmj{èÉñ³Tàö=|žpWŠ{¹Sån.¼ã©üKˆÇ…–©@=®{êƒ» XsbU…iæZ•j@JïßTbFùNf™ÈrùÅyØ
Ñæ(ƒ^tòàîA)C#–S|¦„Ž9"4Ý{Ô=m¾MCyŠ†JÜï¯4­FªÛ%†­'ê‘TSãcƒ/…ú´2Â£e%ÚÉø‚öyá«¤è=7¼+tD~ø2ÄUÓx_²ÓØiîøwì{)fßrd‘Ðé©œÔ Ùã~Î|ïl£!›Ò‰Kë?Xc7n®ý`}í‡æµå…I1ç^6H^ûí95Á-¾½G[³DÍm“¸b™9“mJtïÍÌqÅá¸${bÉ½“óafÕË9T/ÕAFá;ª«’ebå;£eùŽâMD5üïQn‹žYq_á–U
–Œrgò¾Š[K×+Ý›>rsáwO\³Òæ9¿½ØØ9wÇýöEóÁMF—°:4^ÙšÜ1M3.Ïqyxnâp¸îFIÕÑ;<„ÜçÎü[	./î°6Axgâî`×ù)°ÍÅ²kCå%´Xcª‡Ë?,Ô„kEâÂ!êy@ÞmÁçIgj©bOŒrî°¸O²š”¬ÕœOFöìo>ðm~3ÇNSø¶
LÄ;¢>+î0……úK¡.ÓkNŠéøI%•b;ªÒo„là±¬ÔCI«ÃÕRkª"}f&ãÔss¨Õs\Ï	P–ÏpØˆ…oà‰5sÙ|ã¦¬D™nç2»9rEî¤mÙ1äõíh
âì”!‹,EéœÜw¤é}©³Gç
Jü¤'Èñ‰$Ö9LÉV‰ êèEr½üÓÀký}¶Ö4Ðÿ=‚è*KWu*ºè—èZ;]Ç\tUgDx--ÁËaÃJUÃlÞýr5qëBæKR=¥y÷3‰ƒ†Mâoæ<þ«HïÄó‡B?gÂ\„s›'Ä9ú¸š¤-_ùŽSAÇm¾"Ò±³¥ŠžÀ1š`Î9þKŠfkÄ©QyHµ“°e£II´/²²Î;!ÿ²‹ÉÔAcÐtØ^Ðoñ¯#¾&Ú~sqQ¯.ÜN­ÈW*ÜŽy*ÜLÇ«2;ÏŽß"oë‹¥C‡%{WZaÈ/YÜ6DVÊŠ]{o.&„êí)Ÿ¡hq:_;Þ3-€-"n1Á/íÏxƒ~XÆáŸMEÐ½FE9Ä›Heä7†Œ| mu@û—ªŽˆ±ìQ¶	8£&ºK:ªÕ3¡£"l&=Æ_¼g„ò=cQB€ó\’Ó¥¼¢£tÕžR*‰ô¹à¬A¡Pöò,R!¯v
êÃäw:#ÒCY¹Æâè9° Bâ†×ögæççR,Èd•G`î™´6)WÔÀM\ñéQ¦bîr—}Ÿæ>†ñÏÔ¡Úÿ×5”/rÅwè(cÀ•ˆÛºoÁœí”“a>lµ|.Âv²Ü€•;¢bþ™Ù‹¼¡}«6ÉÒ	º`X,¢]A+™”J’Ÿ›;ã2(R¿é±7)dOmŠWjS u)™1'Àª¨:qT«boæ X&WÉÓ;¢Ðîø.¶l{÷`D`@Ržaø_¸³ÃgÝÌ<}Jµxb< ˆ>ä2>èCR Ðùò‹ùc¨Ù•—}óMv!ŸJ,ËêeL¥~ÞógnŸ¹@æo¾w>qlq3wDÖñõ‹Â
åë)TD”«©P¶ªBÆŒïô
ü¿¶òóß>wp®NÂ±ðŸ:w5§W	U¾~BÙ

±AÏ;¹ ÈD8•I±˜¯ŒPVp”(â|UŽ¾NB¹J	‡–0òIÖùn3´Ç_PA¦@1 Hÿ)°}ØY ^£:	ÊE¦É.QkAfÌ¿ÊjÏ©ö…²wg…Ò
*ÙÌQVø˜2-žQ¾Ñ/ð/:ÿß	‘GHtÖ—øÚT²àÏðs•Ú|Ì;Á Ã|	æÚŠ/´Ã]d³A¶ibÙq¬¾€‘­<“£Ã…Â}•òè9\“-y §òk[ô µb”²ò­§•ExJ¨yüß‚š.†Îˆµ@*‰¶é¦WXÁQy÷}Uƒm…›~Ä¯8`1añ2aíçß<ùÊH£þ¥€:Ã•—¤Q/^©Y¢2IuE¶D¶.˜ÿÁdßGÚqì7ŠÌäÃâf¾ýyÿÜ™æ™;vræ“°Š,$ÍL¥`vZBæ3›{ÙÄ39CÎ&ä‚	`–fÐhÕV²ªS2€BvA…§¨€àÐjw;Ñ
…`¤4~²ÔÖH6ø…‚£0r1>-‹Y„ä_nÔ¯’p¸¾…5)¼`+VDhã+ †PìŸñí-ïg#‰²oÇMÿg$ÿ#?–mÎ¾Éjå2¾MßŠr£Fàoëm;\ÙÕÄŠTæÞÄ¥õÕ%–ô†˜+F¡8 ¿©“¼„s²”Sò6L£ïûûw+óbœDÉ÷	-WÎ® -—£×Q5äïæè¸hz0.*;ì»y‰Y¿ëR¥Ø›YŠkœt\î°Qh¸ÜÂÕ.q_“Â/^¢®oÿØoôë\øÄ(°¦„ÓHC—ÖÀÊ	T¹¹99%í“.W®N¢ ÞÀÌE†7«÷ÃpÏV¸Š®MÕƒn£=húq8Y¦ ;AÉ’ Š°Ÿï‹óEÞPró6Ý)•Jp¼÷Á(±([$
,‡†×ú^;ø‰)•HØ‰K”~1d|Ê$}¢œ¸–9Q&]åÎ$§ž¨KdÕœ½¦9[½¹˜åJŽ—	æ—'Pâk·ñuîœÐã%Õ"jÅ*Œ¤œþÒDÖ‚i&º<­Ç°Ö¸‘‘w”l~aYïn3Ø‘Ò) T\lª %ULNn?Á\m»œµÆ®ªØ®,eQÒÂæÓ¼×u¹I€Èˆ9îQä‘œßB±Kl®¸”œj $w¸=ì¯a´æ5Zµÿ­„)ÀÏFK”I£öÅm~ùÞü¿B Þùäx”ÄX2	ŽÑ5`Š- î†£°L_‘‹Í­ê¡úÆ	çÕE§7*z‡á[¯á­]{ÁÞ•5Š£Q41ôÚc:ó’öhF¡Ðlo¨nª ê£¸Óá¿–ÝçXË±]˜5ŠUf»'`°,ŽœÂ¸Ä˜åpÕ8ÃÝ¡	pÇK¹p!FðTâ=ÒÈÇ
ƒÞa$î-9ÍûäJ¿¢w­7×šxõqˆŠKbäHC‘Àb(ÒŒÊÁTmj(Æ ¹Aþ¤KT%µwÃp·í¿ßŒôËZCrß»øõjD§æžwa¶ãÊ[æí¸³ßcË««ìÚÚÙÚÕ×´¶ÆfÙÖÚòÊ{k7ÙÕë«Ëì{³é”zÄ\æ¬qîûþÕ°éµ±DoŽº¸‡,Âà>Ùƒ.daÌ¥H¹·çæfÏñÏ|Ò4£°3.ÂJQžÈOøÎœD~nÊÇ3’ˆËI|ûÌlï“Úm&vý¾s<Íˆk„m™ÿöÂýÖ|M-äOsÉ}„ÀndïùÜ@ímý{ôfÎ“øìPÉä¡Ãœçy×sÒ’¶\c¤›bBZg†<(´µÌhÉ0§‘ ~°Û2eNÑç­¶¤Ä~Ž¸ÚÎ!z>2‘ƒÑ*•¦œÅ³[>·ÅýHË	sa¶uFÛ	Ã±(YûE¢@•Òb"åòÒ‰„}ñ¥Ä9"S˜8ezHÓ¿€BÊÚ¤öàGŠÒ|9cê]zÈSEÿ>V0 ÿ.IkEY¦jóSÔÁŸ+¥Â‰ÿìÓÇÆ÷„ŠáäRnùh"îxA»¿A;”ŠÜP¨ªŸÙ;;¬ã#“{ÌÂ 9+M¿ïí¸>¡OMHÏ ÓÍVQÎ‚"ÝZ¹XÛñøžE»­Î,hPŠ‰ÞM—±2r™èô%xêlÍÚVµÚiýÏY½
éá‹Z‡»I…ê] æ6QØÆä]v%Œ:l…¯®œdÊàù<	Q˜†àÕ²yæî<v“XãšEÞ95­¡„´K¨ŸåÒA"t–°Ç£ »:
Ú4y`3Ë:´—¾gðYüÀ¯o‘WxtùÒ•«Û’m:äÈå«éZöje/œìvEEÚ¬ÿö¤ú§3Ž­FuvÕkm¶»éµ:žl5ì•Ìí'uÊÛßñvü;&$&¨o Ð\:šdÈ¥)Ì–3z+Z»bõN<7V&ý")™tø‹J¿¬ž"' v¹uû=X\Ï…ª|òWÕª»]‚ŠÍ²›a{Äåe]`•â@Ša™q	kLê®ºÐàžîM·Ô6ýnÀõ÷†ß \ž1ËóD.4CÀì1?)k†ðí_ ™É-É?¢*úßd,â*z&Ì@ôŠàÚìù`?‘«hs€.ð¸bjù¸×’¸íhËéFk?Æ•–ß{xÿ[´¢_µÚC4â/îÅ¾–i+ŸIµ¶Öá›!pG~¿ê…èCcJ®D¼fÜëo:Ú*ì íXþkÜèÄu¿9¨o7¿Eëð¯Jæz†ëD,Ïä¾	¸n®†Ûß©^C^ŠW½n*(°^‹ð¸—Þt´e37ÿÖüÂÌ?ãñ-Z.†¯O¤“‚Ò#Éù©Ô3D`ð¡š>“efáa¨l–‰LÄÜÄ¦è¸y~ûyZè4ÚrÉ÷Ë"õÞà²ÊgÞ“›]T¤¶gáç´ždùbÆlÿ\lÛSÍyþÚÅjöhRàæJö7yZkmÌ&ôò»M§R9&l‘£ãº(µpÌŽm5Æl ÄÈ…LL^ðd	`„9»DFw{ö¿I¬ãÎ®¯ÛðÛg'm$ô€ …½¡sµÖûQÐ©!µÔÐïàÏ±ý.ö¨¶SÐ|¶€†‚8ÁŒTóÚ~Ô¯iúþ‰€Z(!+ÍxYø"þõ+–Fº`ô˜DBAà‰ä¶Ùi;Ÿ.\r2ä&(l\Ÿ4‚+²®ÿU¯øê‘'jçv¢tPÿä:ŽÜ14 h)¯Êë?Ó`?}Ò˜þOn@óï‰kÃ|ŠØu™Oö¥å!’2`ÙB`BòÎ@Ú&n®Æ»º¹çp6‚Šþ†~”à“>¢©<$§"¢}1<|Š÷ƒå€AÆIÉ_h+èø|
×yÃÉÉ©ivvnnNŸ[,ÁÏU@Î$²­v¶«ô6œ J	¯³†ÌˆÜ*Hìˆ¬¯ýmnÝZ]»¶ÅV×¶–×76uà›û¿tw7ûƒ&·V)ÎýZboÎœ‚o4˜ú!0>5m‹7‹wïü\6u\…WÈ$”š:·b~ª#€À¥3g£öH/F4÷Ä¶Wc(
òe‚£‘{’Ç0ŒØ"ãºe¿¿…;à`«ØPÊ?' IÿæŸà»<J´F€¬øØqõUrâ32áøåÐ}€$Þ»-ò|Í±p‡›Ø£“1ëù\…t½ö4ó|)w‚Æ4Ò)í¼¨x]`_å=Å§²d€9p†¾.úNœ× ±ó1”G­ Œº?¨Ð¹"¨ÐÐ¨¥ƒxªŠw!ž4Ü­êÛ¼fÀ[?Óg"LéNEéì"ãßâ@ð)
¯hrÉq[@.‚Åœ~Œ;Køwîë‰EG=± 8ê…³lH]/˜9ûoS^-KýV¨^LÎG­Á›K> ï³‡/]G‹¶ëø®¯o:ÑJÙ®AãDØ(!îtx·ó÷5f£Oq™elá°¢œ_ ½S´³gçÌÐûZ-:5å&F„O Äšc…¡›,LFºÞŒž¸dëi3ñ‹^Ëé8v-ü6Àx¡gÌ@"•Y†Ê«bhuJœÁþóÃÿ0XäŸÍù'®Î–È…Ï_š<0Mmlßå¦ 4Çÿ¥ÛmòiÈ…·å†1QJã¬Ï´2ŒÍPäÓH~CÖ/•‘éØA‡Æøo$ûBB‘å¨ÈÊ#ü:Qjì#»ÿì4-ù¨¦~O¬Ç	êúc9¾|ù”Fãr;›\1„ƒžeD¶á,<	+‘^ÿc-Òž‚NÃôÙiøa¸ÓðëÃë4Øi¿ ¾¹É¹¥S@Ï§ÜUû¡ð½d‡Xêz¢è•mÎ(:¨‚™²÷ÊP>½•ŒJe»•+^Êä‚0Ýæàî…pÉöÒUÊ¬—ÊÅGÑ,$™Ææ—Ø²0öÙ›ì&:Ï¢}twBWËL K­é¼Å•BÍ•>E¦]šÔjÚ´Hc=%•=N‹®˜K|ÕJ¦[¼¿‘@¢OPâ=O< .ýçb?˜îæ)Úîræ6¿º‘B¼àN@ü·¦Ø±Þ4¨Ä0––Ðzyç`o×÷ü¢…çO‹ÉrÖ	bÍpüQf½>g2úL~õgêï„E(¤ ê·dw&óZ¸4Y@úe±”ôöÝy‹}·MÈ´ ”ÞµÙe{+l	˜'d”TÇïh<V‘}p‡á¸T­—Ë6ÍpûuîóØÁÿ»ýcêæw11ö¨úwŸö:wqÆÔU ßú’Ží,[õ{Üêïð:²Hli>ð`=½Žcðç$ž%ìi¿ìÒÖïH:9ÏÃ~^ççw^Ç^þ£À|€Ãš “½ö5ÁÒô÷ªÓ»é#±ß%(åç(ö’*_€‡¼ÚhŒ`}/,±è°Œ¹I÷®t³Ÿßc0¾ŸRT„ñ4“-Žà·”ÐýWE ?#Ã<3Á€‰žIu|n$aCzô©¹€$Åþ¥½W¼~3ÎáÆKG#
vð¡p‡×ÙÒÈ÷;²tAQ—‡üšÕ®­¯Nå‡a}µâ(TÜÓˆ±à+à5ŠTêh–ÀÕð,NømXù~·-tŽz	ˆ±8&K ´W<3Ð€2a†²²érÿaõºXì‡¤ÆÅ%2nƒ±¬ãVÂ ²«Çè÷Ûhyþ0è·’÷x‡Ý­}·ÄSw¡*E7^‡ùò7Y2ì¥
:Ìçž‰° P¡4úŒ’ÎÆé¡S [Sã`oG\Î#l'Î,É$U?–>§‰7ùŒàt‘Ià’5ü†AW“bLøb#$?}â¾É_ŸÒ(¹I€•]A%Ã†—1ëlÞÁ’0e=O:l¨wk7x_„Gô©éÉÜ·¸¼…e²Mµª5ˆê -(Õb†;é´jû^&&ˆí|[l×„ ¡7’“„ÆJË‹ÚÞ½¸µïM³ï{Q×ëµí`¸ûýwwÇ¢
L8w=Ð³UuüÕ¥B0þõãïG¯«™ùï_‡9 ßéÕÍ‚ÔÍÙ%Æ—åý ÄlM–à´ê5ãZ¸¿Ùh…azÀ|B¦òhý¤ÍG¦ÕŽ¹^sv‘¥ühÏ2—¦­ÂkÖK69<¼6×q 1¶ ²MxµR~²3N~2ŸØÝÌ*ÿFßûX{›:õ‰,ùÝÓ 'ýw¿ÎhÚ¶csd×e±QkÕ6ÇôxCêz‰:<ÂžÇG~+:^ÀÜôê~«Öý=40ðÜ1ŒAYýkä¼Î}{„)ôÒ1@`ÔÉZ9+w#ýþÑÂªïÈ§Y¿Í¾AÇ’fŒ"%ïš!Öf¦z@^š®„ßÌW&]²ÄîÒr7¹‡Õl¡Ëy¿
ó=R\­éFÃÈ[k‹úá­ÈØ5ø»	YiÌ!—ù¹	µ{m²Á_ÎœtnÏ2$£’•äXJÒ”Ë(Êñ3¼%eeN#pë°Rv¯Ùtt'*1‡¹Ü¢‘Ôþ¡YPÊúóäG5˜0$\"¬¯2Xx/‡¥¤Æx–½v˜.qÌ»s÷µsñÕNÓ¬ä„7w}ÿN~3q4³g(ƒÊk6½æüÑgÕ_?Ì¿à,´¥Kþ/Ð"ø‘R	oú×IÁ!áWãJ\Ø«á^·zÍÙ\õÁœëÃÜ?Žó-¾·Ÿ™kð9Í|¼·„R*¿7§–Œ>Ë’9óLâ©Ÿªä&U¦ZeY¹i6ü‹ÖÚ>ïhR`«1SŒmf,ŒÂN‘b·‡ÐJ;Œ_	ÅòêÕõÍÍõë×Ø•ë7¯²Õë?¼¶q}y•Ï­7×¯mY)2J
=\Ã¢†jóíúý›"VˆeÙj2r¸Äb¬ÇÇ~Ê`$v‚®ßäãL–ZÈ{$/MJâf $¹Zlôø‹àÊsUðˆ­è‡„ÁðîcŒÇä;¨›ýFF÷ž!3^ö¥yN­Î<žbîÙ[v¼áÇ?×<8Ed¬|myðv¤y²Œx?ÌÜP~g¹[Œ7Ã}‚ì³ÌÍäw–›º¶Ÿ¿ñ½üÞØÏóÝ^0›9'û`q¾œ=êÿø_tS8|\4Ù{üs…‰—åú…mÏd3“ÐÎù2ÜÁq¶÷Ä˜bÞ²8ÆÌ}×ñºê×Ã²ÿš6·ÊK)m„biAÃWŸöãp;ûpÚdÍJãOHoñ!6ãCÍÜÐ%Ûõÿ  ÿÿì}moÜF–î_©ÑÒÒDý.É²Öv¶õâ‰pmKœdöz˜ê¦Ô\w7û’lËŠÇ@&ƒŒ±˜Ý“Ý$ØÌÜ8–Çql#&6°HþŠqÉ­S/d‘¬*’ý"µ¤n$–Ô$«ŠUçœ:uêÔóÄÚµk8m&á~eßþ‚e(¾ªUøZYÇh‹BåEùB¥Æ.*ËnØuÏvbýE·»~~sø÷1ÚS±ëÊ
švÏÅsÇ®®ãsòÞ¯IIßD‡"vQªŸ ë)t“'ÐûÓP3Ø¾ä¥`L-Òù‡Î>i'ÆúN²í‰%cF¿ç¶¬Ð7ÑºÓ¶J¨¥iu=±Lò…åFêy-¸—±×ª*vQYÛN¯ÑhbÑä<5„«ÃŠöo|gá0j/„+ÊŠêMj1‹å—û™à+óŒd7T‡ú.ÕÌ$x0ðu£EIÜW± z.ˆ_§×ÞöA;v:½(ÒÈÛ	Orø÷ôiþrRñÜ	7ëFîÍáãÜ,î‰ÃCúã	ýñ7úã)ýñýñŒþøžþxN¼ÈÝ”v#_¦Í›)8&Šž.Þ(åÏß,îÍ¢é´‚¼­Øª]ÃqÍõŽÇ®‡Ñe=¾‹]RÃ#½~ÝfýáÜëü3ÜíiŸ=™Ðp
ú‘Ý]p»-Ë›Îå£á>bá^Î.ÃUÃfŠ/äá6^‚QòàÊÍûEþ{Yø½tóþ­èÂ›µY"ŠÓ~Ù‘Þ—¡¬ Þ1I£Ò4:–IV¡áÅI§³þ„Û9îV»ÞƒsflÍ×Z&üº|°Þ˜Î‘û 5(oð²óðf¹™w
V§c:ï^¿z%>¿ËçC¾MÒ(kTˆÍ©;&îÖ¢é½!>æðmÁõZf¡kÓå&I;®ÝêyfÌ¤	÷ï[”+uïêîkš x–âFÈÀ7€täNÿÅvìÆA28¯4­Vcš–1“ØG¸\6«±N;ø<½ØûïxéññÀWâ:€¿,Ø€z‹'Á•}¯ñ§ãì¹š^[Ž?Þ4†b×‹0|_ŠêòÁ&GHp9}H^`ËêÜFMÇÜ½8Õô¼®»T,B8Â-PjW£k¹¸wÚÅºëVÞÙ5ÚVëàâ»¸›ÞÞ¶°¯Òs¬¥}<œÿ8W*ýÃ<þÿ®Tz«aaÃb\t÷îLB§È¨ºMÓT¡Ý]pëŽÕõJ’ß˜z/‰«…_®Û m™ºt¡HoU•5©öA`4TÑ$Cßs	åàMS<{¸FÇÍcßÚŽ´PQ¿½Gb7°lcSN¢<êØ]d'U}W×h@nÔàõmmÃÙ³:K¨¤¾%¿oîÜ¶¼<1-´Ø(Á®ä2ïBÊï/¬v×v<#ª¡öð´*Ûê»Æž©×úÐ\Bµ¹ä×/Ï·ÛÙjÇ2¥›E•F^ ÒD"€AzTbÖ¨ÌOqEo,–Lû.G…ÀÎ”	x2fÕ+©·Ïu
„Ð>1„›f±™ÜíuHŠÚ´7Ûˆ€ÿÇMað‚S•ë—LÞXWr?e¥““‰…ðÌâ˜mûŽIgþ~0c°™TÏz>‹æÇþUÍ÷åtÆïBZ-“Ë&›[Òùª±Þh/‹ö˜ãÎ¼_ic<Y1õwN‰ú»õ·"=û‚Þ ÏŽí:N_·»hÙÀN}šSr)Ïo¬¤JDI“x¢H=I‰:„Ì±£2ƒ sü5u¶"që³ '&z+«’À·öÔ0„i¡€•¼7ß±X g¡ÉŽH·3,Ù–‹|Ký+ÙýÙà,Ö¿“ô)MY6÷5)Ô*¸`i|`p© ÇU÷õ{õ„‡M^Q²†B¿½¤‡Ûé? ¿¹ºk¿bU°ìŽ¤¢—"Ö²ûž&d™™-–ŠüE!YJD·çÁJe\OÛ}ŽºÄ&¥Uwå‰ M€°÷ªZz«^YÅç’qÏUPÇ¾ö[ÛÅF|ENÆ•Í:îí2:V4¡Ûk¹¦ÒV©(†ãjNwåá›¿’ÿŒ…W¾Ï’EAÇ‹þ.=Ú\½¬Ì@×$ƒ¤…è6|8ÙH¹ŸÐTX=µr²Ï6ø©ÁªÃ,»–ùèÉ&KQ‹¾btî.nè|iò«Ü H±­Qè,S1‘¯¨8­Bº\¼¢Œx´ÂçO¥ãS…&Û¥wÌ¨÷6…Èðâ½{¨muÞ%‘*¬årbUè¾œRú%ôî:ö|˜ð¯‹É«éí¦„*û–×¤iˆ’ûy~—X,ÙŠ@âTl&Îcñs8ÿe#ÜlÊùTeið›-[nÛjµŒ¦Åyêé/V[ùña‘ž#ðÉ7ÊÄ)x¡S>7 @õg ‘?ãG÷›è†ÐKDipÈßÏùq¹èü÷så¬«¢å}Ä|ø+Æð9¥ï–D®z@‡{úùJTÈç>`ÑôÚ" ÷Ä#Y±œz¯eàöÛ{rô$Uûµ«ÿ!÷Î^XÅ+Øã¦Hró²}÷âT	•ØlH`#ÄX§ˆ¼¢»íVÇ¥1Â¥bq¿°_-ØÎ^Û”R—¬­W^Ç/‡m^W‚MªÐŸÎÅ©¹0Ž}·‰u'ÿâˆpã;x[~¹K>š99¹¶’PÛZ¹¼:·©Ù7«¶tŽcàÇ«¨:HµÕsþ;ðWì¿°ÊùÌÒ5°ÝÃ¶ì*^ëUçÐ•…*š«¢÷çÏ¡+ø›…t¥zá¿ÞÇßþïXéú«Ô“§ß °+ˆ½
{“H€=ú€L §ÎùÃ_l[âzËø/( ÖÁš‚; çŽ–Iï¸L#äSA xêÒ6Z¹P„26j1K£³µé*ÚNÕ&É°—çè°C?³öñÈ DPŠ(Dƒ•¶¸0ÌÒø›B©ý”vLæH•væ`GÈø¡ë «šÀ~™‰L
	ä	¬˜f96AW%
7XGÜŒ/*¼%4¥ÙH™RºU~ì:Äƒ"çÞ)à¥‡+tñox’„†.wá0—úÊå6ÂfYß•¸;ÖŽu#º?ul\e7Â±;2CîÀ5ÚŒíÛ«ÚÖ¤Ö®]AÛ+ïnl\IêŒŠ¶3âAžårý>ìé­,À£/ˆøƒ@äÉÎÏŠì‹ß@Ô‡E…>‚+_pÈñ¯xZšà¤ï=%äÂ8už%Ý“¦k(:¹i¶º@Mûøðñ›ÃÃ7‡ÏÉ¿OòoŸ‘¯ž‘¿Ÿ¾9|;4tÏažÿö·7‡ßãg ¹G	HìØ46øºÝÍo‘d…Z7½n@°“Ðüh$«£X ûuôåÇ–¾•9ð‹ùb6ðöØ4þ2 LÉœ¼€shÛBD¨9ŠeÍò8A¿¤9IÄHþ‹G	’$Å„ù‘$¹’ A3=ÿèh’T•}²eåHÏóá,.–â“/Õÿ–l@–»I'¹õÞXô×Û~Ý°5•ˆ‡Ñ7ñc°»ÀíLW¥ö$=ý$(²öy½*'/Ó7!fh—Ù‚}×v¢;ï©ˆÄdOwïÂNÅ“ÚX…2Ä­%D9Q ¥¸žxtH7FÊ-¤qéwXVl‡%/l5¹¼+ì™8CÇjÙ¶k¦Ç1Ô‡Mð<j´Ð5š$»…Ýï,sƒ10d±»;I¾{ªš²vÿŒ”“	pƒ›¤*6`ŒrÇ'`gyòæñÇù4¦"ÖDX5°kÝ÷nØ$UÔ˜±‚U¡+É6¢|"	xÔú·IŠéAˆdJ9 F&®ƒqH!	äG…–#¾ÓcêAå…?¾Or§°ÂTEÊÄéf	ægf¡Òl…j
Q–‹“°DHx ó[ eú’Ãîƒ8#ûì±-¥Ù]/¶a4©
žµ¨ŽéÈ ©½ªÑJ%‚$mô’°e{¤€€ï×Š¦•»~%OCÕ“F¾“°˜	4™	þÝ=Åq†i©D5ì­Ic[³ß£ÄOØ:[&?Aâ¸jx²>>Ú1Ž0fmÙ¤"éÍÖ¬ý¥s`AX*Ò˜¢JQ´”!Y8½õ)W´‰qò"å’ÂŠ^‰c€Lƒ
Ö‰ñ6HRq”±UŒ…
¦^<ú¶JO9jÇOã=r‘êrÃBG2¸oLæ“£Çhö´Îtˆ)ô¼ a¾)Â6Ó›;®­¯"‹ÅêÆòÄy=]Î+ËU½rLlÏÈÆ4D=Gý:¬_ˆ_@P§Ø]³cïÁVˆðL<ØÃ¿QVA5ÞVI*†2²©±°>Öÿ¤ó`éH
,Ë<ˆ¡Éœñ=+ž-zêÙŽýtÂæ’‰G{j=Z*ŽöŒy´>WâØ› ¹‚ÏODÏMnì[ô>?ÙË¶‰x¢íÑáSêÏÆž–Ä£»/¸èbÓõ`¼í”T0ëxˆñ«B>á ®6*4†~òhlZ(×ôù¦É	É·#Ã4¶hÓv=DNÃÃ^õõ¦Ñ1ðÏUØà²êº#^YMQu¼M;-ŒmÐÂyòD®‹’#•:
ë°1Ðuõ^žjëñ­0‘œ¸qôˆ
Ò!”'æŸê±ûŠn=‘c×àfÓ·û}œž8»?_@šÛûkŒÏòÎ÷ùõ>¹–¹§BS–¯výL-xi$c¼ÇN‘‰hŸ³áÕ>æÉVY€xä6?ÅX( Ÿ¤žŸß<›1#2Ï¨ùø„#K}Ï³•ú˜J'wc&ºäL“´IàQÑ—“1ñTŽ"ÖÿŠ“R>å³ÉÃñõEŒr6!×?°¼&Ò1™YBCª÷0&Û7	ÓPÎQ‚®³MžãŸÎ1º]tÝFk`ÐÓ³ßÓYâÄ.ãôÁÄy 9óÚ¿ò påK²LeVFcTÂ£´"^úH+G}Lg±@0™È¼EÿØÊ*4'{µóœg?‹4ËDÂ’dó)‰Žý¹ð%]Ÿ÷Ü–ZøBÚŒ,ƒwÔ	+Ê£òÌÌ™ÄG¥…ºµQIè¹OÛä(ò{Ë$øKŽFÒ˜ºóÔÔYvÏå¸gã91¾Ù£í;E½{ìo™¥ñnŽð¼bßöH®ÇcÄ†çÈ~±äCî~Œ`³e6öL´lßEÓúU2¾ö_¤ùŸ“˜§‘æ#‹ÿUƒHÆµíåc”±Lf€ƒÊ8	øæâ\ *©[#Ê°°C€1¹Ÿ/ùçõCHŽ a Æ8‡CòI
Ø»ÔO#±‡/{:™Pã]#â5$€E$ åGÎÉŸ ¥áôä}ÜÎ¤×ÜŠþ¸±êÜ|?AB¶OŽŸÌL+r…~ÆÛÂ¥cè€á½ÛŸñB†Ú,k§®¥R2)ä—Ô¹ uÖ—vÇ—ÔöÑr"N¡Ãè¬ò'§VÏP´óÏð=ùÀ­åú	'x­l'~Ab
¢¹(¸6Zô3!cï¤Z%Ï_/¸¾†R¸žØ÷ÏóAr!0Ž6.PúCÚÉlúx@!¼~`¾™oûìÃÙTïòw’ìKGô3¶'¤£=å“Ú·trÿÔ¦ý‘Ï~œ‘›àÖ’Ò{R–ZÌ¬y´ü)}¯ø°‚.!ÞMdù†ò)ñsú”òÝD|´Gäõžú‰ñk Â3ža4!ÊÐÉ'é ’C> ÿNïâVŽ_§:äû ÿ.œ°æÆû‰¸l£¶ãÐ×¿# p­±õÝsÛÚë^Ï1ÑvËö²‚8†–Ð,)uaÎ§RLD„2Ÿ/¥ÅQç$XÅV¤33øÇÌg8ÂÓtzØÖ™ª´ÖŽ¹È/3Ï^ßÞ`+ÓNmx=7s£tsÐ(}×K’Dàa¯XGÑ÷ÕŠß÷Mˆº¤Ýt0(âüë£Ñ¼<í}£ó"GÓ#bj±”§ËV«Ü¢›¶“€°’b¹`¶MÇh5ˆû_0ð«XpÈK† ï<ó’·«œmÑÀ¨väS_œ““;l>\ï¥ÂSŸ©F½²ä-8&A@Ëí`&¸ME>37h½ÚŸNðŒGû¡ï„2gf´Mt
ž…‚‘6?ë6EÐÜt;9¾RÏý¹¿¸ ©Ÿú!ê7©È9ÀÇ¶á‚m	ü´¾aû ˆ}3ýiVlh*?.5¸h–9p®ÄðÓO~þùæ(†F7¶“¡úZ:—mÛc$/öÒÑô
ð'"»Ó:HËÚ
­ñáñâÑ­˜´éyú4|Kƒ³-…AK×0ù·"LK&Zê¶eTKr‘ñc0\þŒB|E†QVS0ÉåD"T±¯ºÍû3Ó¸Ïý?AÆÞ__û ÕV¯®_höU´ºñÁµ+µUTD›[ë×®V{íJHÚÄéÏ[1œzë-4ç1§dØÌ²S›|ç^;ÌBß¡¸¦©éèi¤¿…'H9ü{ú´‚­Ê #ö6bþlr¤EhJéÛì~™ 7ž›ÔñCúã	ýñ7úã)ýñýñŒþøžþxN¼ÈÝW$mKÁ1»X¢ÍéâRþüÍâÞ,šn@+H‰­ºÑ5×\ïxìúÍ¬äôtH‡OLç"\pÞ¤wLÈéU7²5Ð„œ^¼Ó{ˆÈgýó¯b†èYéÙë0¥œjÞzò†`º&öêöLìÑ1Øÿó„Á~HeOì…Ï„Á~¼ìÏo½{û /ÚzxNËZ/¥j¹Ûšºôÿ>ú¿º®O]ïG—žqØ¯&Ë üõÌ5=ÜõOù&›HñðÒÏ
ˆt†¬¯¦ƒwžARšo$æ0Hz5ñ‰Àm‡Q×ñÒÔ"øýX´Âeß:3DYO–6Ùéê™˜Êñþ>Î„ª>É¤¦­Ô ‘½^zµòz"Yˆëc´õÂÔ’bÀS0ÜŸ(‚zb¡Ñ6,Àˆ÷†ÈL¯ö ¤/'fÒä.45¼ž:·f¸g´l` ñn{©ž‡HwïGÄÕÙ¼œÕO¤~—¶Ë§l[wIDkT¹Rj·s³|±Ÿûe‰|ð7A¼`…_£TÍ9t_&ñr¹‘í±|€_ÀÁËâÛÊ¹è¸óˆ ï®'zcv×¨[ÞAþF©PªbŸœªRÞ¼ƒ/»¤§Ä^ÃïÅTM!*ÏmAJ¥Ë7LÔmâ&!ßÿïÀ^rKãO„Ø\/ì8XaEJWåÌœèU*GŠ¥è3ÏÙèè2UÛ“³=ÏÑ8Os4æä|Æ¾\«ÇBBj\‰ŒDÈ¥‰ÕûC“Ñê9˜×–K¡ð®Ú³Åº]çÃ*¹Šå>là´’oH’À9mŠžìÝ‡Í¢‹~‡È½Øº„Þ&t°Ï9IìJË9b)›ìsØâ!{yMÃi·Ýæ1‹þ—átŒn³×²f¾€ç*ü‚m\:9Ò‹K^\,•Ï—Ë‹å…Òb5»+íUqWŸôgxq Tý¾äí[–áKò,–çx¦]Ò‰H’ŽÿïŸI‡rnÝ§ õø=¹WŸêK® †ç°™¾æÂLhAíª”Ê\ÖÚúúµ%T®ÎÍ/œÃ®`Ù…k‹sýt±ê‰x¸ÄWãùS–u:µ²}ìrØÛR›e«„ÆyÊ‘Š×wÕGïÙÇc.³òhÝÞ<Í’¡
t˜ç™/…\¬‡HºxD"ù)aW9Þ­]¹œÿ§µÚÖ•Bk¿­]ÅÃSYÐ:È0SrÏ+ÆÝóô¼ž}a¢,4	ïg ~ºŒcÕªf8F_È!]°ÃÓkgJ ÓåCŸRâ+úAC.l¸à–ÑÕÎQPœ<¾¾ÇÑ%‘Ä‹’Ä”í^#´´¡«Þ`$Ì†ûùr±ªR9gê’LWâ$˜Ñ	;¹µ?%RP.MÁF¤b?3ý‹œ/ÅYš±'.xê]Ð„ÊñÎØŽÖðÆ	ñÉ/èÓúêà£Ä'EþRRY·-(Â{¦†)r^½HSû~¢gÁèàP€"Ú6ÉÕHô(yz¬ý·$íÿÕ½PzÓtl„Yº*š–$+¸ôï‡ú`æîƒ[´$Ïòpq¬sd·ðbgnéÏ¥É:;²Ç‚Ã¶AâèK*y_€ÂNŒÆzûö!ÈxV	38[ÖAræ…Ž?Ê>"SW!ñ¼ñÙƒ(Ö3É­c¿Æö¤S†ßà#‚¯ë}U|øÆýŸ‡Ú"ÑÜ`ÏÌ•Ÿ‹l°KcxMìx°4Q‡eûÌÕ
ž\Œ­-……m±Ú|Žîè³Øp¯…Òm•û}ä.é«w"É±—°Ú{$NQÀ}d´<ÉEâ‡ßž,uØŠÇÞùÁÖáý4ÛKð™Á‘ÐÆXG‹U‰	ù)†6´©Ï#îÉ†â=7º‘Æ“
¢Èb¹”ðÆ¤@iÔùÆy=É÷ˆT…('3ÊS—¶W®nã%¯Ñî¦Â)J:Î¡9‚›tÒCvh&R›Ïã*›
/çºXP½£_>gÍcxÅº©Í~hò¡”j|H'k€hFpÔ…ZÀµ»FÛ¢ÐºG6½–	n}¨š‹®X®š×@r:4ˆiT4Éšsê¸stð¢±xÕQNâJ‰-(Š*Ïº@·”ð+rÚó‹ ›FJ®Ã˜ã[^Óˆ¨ÐÑ[vÏ³:@!ÁûY¼ŸSöbrdˆ)J™ì&¦Ž]ðÔIÞü'f²Ò¤~SU!áû
ï'Á_kFýzŽ‚Hsr×)tn’æ³àvöŠ× ¶Š¼6¥ …d…nìPI Q©›Ã¶Êš”%ß(à’Lj¿naáÜK®Wï²ÁÓZÁ¡ÁG±ÝØ‚à‘Î öu²yþÕ!Ü„Øf¢‡óx…“¯ÔÍ-ÏKçŠøNáÁ*Ê“÷y¯œì·f¹ °O†‚ž®Eelw7¬¹4ž´ê½1½bi	÷ií*Ê£R~Ý¼šTG¢¯>”®_8ª®"¡z{¿Òiœ½Þ_Uï? ]O#r_‘Ý
Ù_Ão¹Í³)üç°û•òÏGà,*@¥4ªøÜG= |€âÚØ¬»g©{+£êÞW»‹¹vßøÖWD²ÿ›®ÿÙÕ^ëXf§nž„îOƒiƒ`IË¿õŽë9=²áðÑLK=ìö³\–HÒ!ùV”
Ó6V¯-¤v‰`6Qàõâ2”}£´†– ©}eé?ö‘0|Ná¾þ\üÑ¤{ÉaëhÞÇg‡)éÍ…FÍ³¶&h…'á»Ký¥,¥~e ¿CÎØK]Éðú™tK.zÄßÿÌÃ€ñ¿ò„–p??ô!Øã‰/ræg¢ÉÚÆ³Ò84tæµ$HFåÛGÚÞ€¤Ùºf$ö-ˆ-šÈ€´  o²‹â!4ïmÔ„Œî}ËkBjL×1]|¼¦å
Iì…cä'åxÐ~úA:~¬Ç|Éfô¡ hùÄOaú«°Õô r&§yŽÛsað¿öóg‘âú§B\îZï#!§í1®g&8ó‰ÐÖŸÈüÂ±xÃèà¿¿¢™Oèƒ±M Ôý¯Ú?† -“Å§R@5,Ø05\dï"’‚ìØ«Žæ«nºhÚmŽ×…=w‘?ö¯Þ4ÝB“Üë=,LŽõ!78áXFËE=Jé÷ZXÌì¦µcyæ±‹ÕßbE;ù%ïÝï©Œ}ÉýÄ‡%ÿýæ4~G³jæƒð5
Ï3ìOxA­ƒ-Êû¿Ñf¼òDÿ•4ÖOºdªÉkK6i¤«Á‚£6žòcÂ!t2ˆv½Þë€‘°ü½Û…ì’Éoxx,=˜ñåyÈØïA	;æ.¤Ø“R·ÛmpvÈ™à¾d)}?”íCh¹<-$‹;Q®„eðÃ¼~‚÷àOòjÏ@ƒ½•U+	QËtPIˆfGâµÈ©Ì¾O Êñµhê³?÷øÃNoòvÂééÂ×üH)‹û>æø÷dŒ2æoÝ±ö¬–áÙÎxöbl„(ùÀúc´ð|…¤;]›Ž½[@«NmÍ¶ÑÉ¸7äÑ‹VîÞ…ß5q¬M¥VÕùGëV²"‚Ïþx‚/7ØÈ	¶ÜbËÕVWÑµµøq1%7½½²µ¶vmûÝë¨¶²òÞVíúZXÜîYn­Ñ`IºWí†ÑÚèâéPæ„ºÇFCr*„
JJ ª@£’@£,I‰ü	ƒAúQWíz2NŽžQ£gÐü£~À3T˜2¼~°N…#ÃŒÀR„®Á	_*J*È…ìpªtÍ_q»´Ê,®˜ku(H/x¯x>hõ`¶Ä7‚µ¾Šï:îa· U]‰­2øJÛ·œë2=›ÞÅ«89µdH>€ý3zœœï®êÏˆ‹±;íó¸™”_êCä*(7€ôÜ)$â’d€-ÕžO}F|Á÷ÄèÜ³[ßmìš2.Gé¼½½¶r}}ã*/ù§†–{bëXÂRMÜ´ÖÒ®±»x—ÂvåÆ/ÍÊnÅÜ½:P:¼ÝrvÅHîLWñ¤Zš¯ÏW\uu†F¹ y=UÖŠ¬9™xQ
Ub‘xB‹æUõºü¡®…P‰Eºœ?ì,2D@V_0ÌRhÀÔkU,Ïf+¬3•9J£rfôU†Ñ(ßì/‡1b±`…WâK‹—ÂÇˆÍ—DÎç°~íÜ,jó«ï¾%$8ãÌ~o¦HJRR5e„rO™ÐÌ˜{š”yz!a·é=&²âÀ/àq_ˆèfb:¨"”ÆOfÊhÙ—h+RêzB“Ïhuº=OS®wÐ%ÞbKQA?F½nv½‹SVÛØ3‹¿ÖÝ*ö';ÝÍxnbÞÄ³°)Ø•M0[¡±è"2ØÍÚ3½üí¾S¸Qº©ƒØ£È­poÈÜ¤õ2~ˆ>©¯€7Ð¡nåEtððùBGú`€¥8Mp1Rtkt-¤qÓÀæÏNßC…ávœE¢.!R>ëÇw
ŽéöZ2\ŽF}&±É
äÁØ;Áš»jxÆ{[WÒt¦î¸–í„~”jr¡H½ò²N‰eÎo0•Ó4ç©K¡qxuÐYµ2¥‡$*(6¹»íœÐJ2 ~¢ðtlB¥çöcVQºpYƒ€\†)JQƒ×÷0&S—~Íz<aœS›D(^gºî­ž›ä`
#ç¤²½tšË‹^
,ih©®:‚”ÞÄÝl:ùY_¼ƒ# )í8› »wÍGT“9b¯L ]ãžK^KŽóFüZ¦ÝóòOÜ¨ßEc´¤²ã£ü°È7˜Žé%´KöÝÞ¢*Q¬¦ÌZâW=5ñËÎª'ã ðO¾O×ú‘v—„\èÀL›º„7]L¡;5_ø,—,¾z¡HKÊPÙ<—äy†8øø¿I_ÐÕh;ú¨a×°@jø‘£!ýe8ÅŸãÅŸ#Å¿â{†ö‹¼†ERÃ'é°j8Ïk8OjxBxHe—K¼ðr‰”þ˜lõW:6BÄºœxëÍ÷èÝìr,„á]VòÄäJ‡+jr·ÉðñNëCÏjPÕ"¨!`£û(q9(q9^âg}”¸”¸/ñó3¤ÿÆ	YÅ@”Ÿ6x¶"(| •éUJ–5YÆ$$H(/ô³O
%Tµ¡„A”p¨*gO!¯sÙr¼fR$(ÒèDØÓÔÊÙaÙ•±aïŒ@q©C˜­[ Jà(©B[ƒð®-³Ó0B§­}xcrö$_ÅïG*ò%Ô>ð©¬	&{d;G‚l¬ÙHèáqlôë7¸ïL'1Äªw[åâ¿GŠVËeŸòO‹Í¦ã0—Ã]Õ¨ÜUMá¬…¼ŠµiêüK\¿—}æÂ.›mRý/ðÍáG™ËÜðš°©N~ð•öáœû=©\½z"Tw¹eÛô,…]4MßÖhÍŒD•w *RÓÐÕ9(z¢Ò‘¡’J×ÞžºT{;ûcyüX>ócË¸¶åìµ-ãÚ–³×¶kÛÈ^Û®m#{m5x¹ZoWƒ×«%¿_*«¤¼bMÞX×T÷Ž¶Ì=ËÅ7“ž¹fˆùö{>÷£×A^0]ão?Öš5­Ÿ¼œVØ<h³Ød•-ê×ðEËÏbÿBêò9D8’•6flåàKi©ÞÇqžvXYB›„ÒÍ‘”<žÓzŒ‰‡²C+:n¢"ƒ¬GÔ[	4~åÅs2ž7Ÿ€;ny~õQêß§ñA©à á#r¶‹:zÒCy„IBé”•ÄtÊËqE	e^j&—$•ËÍ\ 7r™ /Êù¤9Ÿ]@Ô™òÝ|EÉ‘¦Ûõˆ„N›$ézŸüÎÔÜK™½Ç:mF2RNªÍùÔÑæ,Y­UñÐP1Ìn©Ï9eÃœ)Ž;’ñ?©«9!©­üpE¢8Ã'–·C$!M~«&ÃU(d	®©ÀUõ©©Š4W!b•>ÍU™#·Ïs-qØÏ>2]õ¹®Úl×‘Ø´¯™r^3f½fÎ{4ó5KîëÀI¬¦±¦Md”my¬)2YûÏeÕg³jóYõQëäL5NqbRk¼+:EæÜä¬Ö~wd«ÜVhM¶r	ªªÔ.?•pÍA¯ˆ©¨¼'H:jØg±ß$ŽJ3•´«ÌC%MJ±ë?Õ/>ë&RdÑéwjR:ªbù	ÂÃO-Ÿˆå'ýhuZ§Dc¥ j`º.¬veêð”CQý”F#sšô¢´e„T’]ìÇA|‡“ë¤ÏvRç;uýÞK“N+gÛt ‰	Š#¿™û‚Áˆ°EýW©åYª!IË=÷„‹ç!þ©ÄÇM{Æ!	RŸ•\7:Ù|b¿ðä¨PF_%¯ÚuÏÆÓŸ¼H¹øßÃÿ ­ï¯èË†Ó†6ÓŸ<ý4vH;p¤ä„L±eT¯­¯Ž‘a5Fé?XÝ‡r	aAOŒ\ÓÏ8Xà‰!ÊúU{Çb;úQª¥ñÑÚÈª­`@M(•Ë?-@'J²$'Êšž"A‘<–¬.iá£S™U}Ê"|Ò˜ÕìÉ‹ð‘&0Ñwò‹G)ÿ}¼Väá“*QšÅX%{)~0¦ßLFÒˆº¡£½qL§ÉÚ·ÐÈ¡ T×6ës:ƒó×ÉÚwÐøY‘ðšÿí1íŸµí!ìŸ	…LöÏ&ûgšÏdÿLóIçI	Ê6Ù?SÞ0ðþ 'ûgBOøûgÑT­1Ú?£Ú1²ý³ ø—ý~§NöÏØgüþIïŸEÕáˆöÏØD0Úý³h%“ý3ÍPŽfÿì]»çšûÖ.–@ÿW"wŸ“œ×d§è›~wµ&»sI%O6¼îÀxlx±)yD^~é“¯³<ãù†•Ònx‰L6¼Îªœ¦/*Ñ£ÛðòËŸlxI?g`Ã+õ…4Ç«ü¸"z‹Ò7à…ÅÑ%$œòIÄjAþ®ÃdM8‰hH¿éNÃ2:$—„ô 7¢iü®k„>ÆÖ/º‹Px6Ãò1xG%Æ×NÇÑh¥±=@&+@µº±ËbàVÿ•p–þœ%¸<2q¯ãÖmì]Ði±ˆ8é5{w"Ú²kã"Ú[Äáµ;„¯ùæ»&BfxÍG‚Ýã°&|€[À0ti–U2Áó‰ßð|hú!OCŒàÉøeÓÒ¤ù@™K{¯SÀ/òC$Ã¿BÑÏû)zÙa-e¿òïyæÂ¶-xÙ.ÑŸ<ý§TèèÇH¦¼Â>&èßæ±Ú0átG‚ûÃ=P}0m@÷6{ -kmìéh1^ôéÙtÆÆ‡ØtL–ÂX¼ðon’“ a×ÐPÚ/ÇÞw/Þ«¨§b¹^ti3X+†îA„‹À/&ÄC¬4dÐâp-Çå'C$e4Q¶“ìošNÛèŒƒTó†ŒL®#,Ù~Ï]ÙN}!M\un‰Ë Z5=Ãj¹§1¢:Wˆ½%øªá§Œ¢qüÕ§ˆ“ã¼œâ¯¸;¢èë	™ˆß·Z-cÏO½¡=tœ¡©;´AC·Y¬ÜLïªIðuìgbÛõÐp»SÁþ+ÏüúO‚ø}<‚ÝÅ¢mþ|ì=€x“N³i§MD|ÜEü:–ƒ÷·þDw\’íA[†.Ô¤Ôä™ôÐDˆe×ÆEˆW'Úª{4Ì8F9n°æ]”yÁH³ßUÓ<îR½e¶¬=~Œâo„›Cí°æŒbŒ<€T“dÓWTë-¿ˆxê?Ýaxüæð÷šý‡‰È®‹\3(}‹åpVJ“ó;Á¶ãŽG-:Aë†®BÙ'oÃxôb›úBšP×üÚÄnÙ=­5zõ#ä;8Úh×|Aö¢t§üðcûY@¹~øQü¼ÐOg=äå÷â
‡6ñ?fCÒ‘àŽ¾”’ES ·›4yûT´äAÂ¼WÉ MffÙµ±Ó B[«–ü—$Ržth¤-‰¼CÁÃw >ëÒ®¼0¾)<þøm×›¶ÝaÔeš@y{KøÉÞé3zG’ÛÂL_bÈy=AÁ}çôø½ìÒ^Ö/N‡ªNè%ÿ–BÊ5ŒºlÛ4½¯Fùì—{žgwd¼QUëæx¿yq·8€G3;âÙUE`.ÇêÜÎ—$ªza‡4HÒX[Vý6C.…ën ‡äí6ºfgz×h¹¦TÀÄ—¹‹ß&|hŒa·~ww~wž¹Õ²à;°	ay"_W¤xfÕ8¬—§°i1Ïtò#£S7[Ñ¡½<@÷ËÁ› ZêQMüZÄ>þîw(zÍÙE×¤"*¹Ó&K›”\§ªa®Œ–éxÓ-lÜÐÅ‹Qn§“Cï Xjbø	1È‡ÃH \{H¯P@ò×Ä¬?aDlÓ¿žÁWþHlþß¹Áˆ‚X|Nö{æ¿‡ÉàðOÂÜñø¿ÖßCÁß>Ê¡%”Ûl™°°Ûµ°X€h8æÿéY^{@•»–Ùj`œ$Ä@‡ÎÒõÉ,Ú¦½8K½5Úi³ÈÀJ)ÏC-ä” VŽéõœŽüªÜ Ë*ÑŠcÂÁYƒ Š¹tìpùu¬1òg(¾›4º¨Æd‚[Û×Wó¿º‡MS	½®^³°Û²mgšüŠ•¬a·±$ÿÇwÌÜ¿5«*¬KQÅ¢²I§ Xs9ernK¡Ê§êtA¥ÒåsLiâfb zÎ!­RÍ
]_1°ºTfQ®”›Q´G‰‹•ŠN4í|:MO¹D´q»n™ØˆøÙ1£¥îëðY9Í)=IõPvÚ²è«Ir­X:êj©–©Î3<ì. LÌwðû.zuµŒö]J2OÞHËÕÍy¦•ìÖ¤œ·Õ¥¶E€|à$üÑgømz¦àÙëÛÛuÿåv[–7»ž›¹Qº©,­eïYÚKx.ì©ûKõ=»{ odÑ8*7Žª'p =º™gï¨û-NS›D”«,K$RÊ£òizM	ú–P·ˆc•ÀF“ÐMIÑ’ú,¸ŠÄ!©7$ÏúWêåg4Øù	µ+J/&´aU"þ•„ÚeÏúWÔS;w)=å©ž0¤çÛRœ´SÏ´‘|wm¶½º”XvqB~³²$?çOžc¨nO¥ÌâR>ÍWdI2Êg‚EN‚nÙ.¬bßWãÖ»TêÝ1Ýhó¨±*R­}vKæ°ðÚ'yTB	Q<}ÿäY¼eå¸~$äFà©Îò˜ÈÍExÊÚ†UòæÆöuâÖ›ØÕ\ÏëºKÅ¢ÛÆŽ`ÉÅ¢×†ºðb»P·ÛE q¼B·ÙE€%·‡àu ‘VZCnp4_v¯
Ëw·Q0ºxYÝ˜Î7˜›UûˆÉ%€+/ûÂÉÏ1^€ï8&—ÀÜàxìBr	{¾;8lÿ2¹î.8˜êŠÙzW^,ÍÅUËeíÒ8\©gãJc«‚ò·0½zszÏôj]ë=§5+]«ÈÊtñzBÙ”¶é5í,€±z(ýÐ»íÐ®|õxFú5¶ªfgÏ:4jºèÅ?ÜÂ¿¸vüZxªuFbMb!ð˜}[´i·Ì‚é8x}š[6ê·Á„:‘‹Kx b-Ä´×tì}¢Ûk¤@x ÐÆdŸƒäª%^ Õ‹}N5ë(Yõø}•xè†"©SyOáUÂtŽ¨ù3ÈíÕëø5ÁœàÉÛ@;¬'k›ë	=§jUÝ ©Å=•¦UéÆÿ¢l„ü{Õ¤SÃ+¯Î6}é«î^8¥hë;èÖ¯b<7ÌþÞ§ß‘Ý	zŒü|Es øÇ·4Eà¯˜„„¶èM_s˜ÔG´ zhæs×"Ñ³×ÂÈ—øß_ÜR´‚9âÐâæãÑÖ¼ž:±8a%›œh‡áß1\SQO–ÎÇövFñ4Š+Nð	|{9ÝÁTÔßRQfö–Kš“?ênòEê[‚©]wY>«/ó(…ú1¡¹+¾êÖ¼œÐ÷ºûBÄÛêÛBüI¥%u¼¸hOl™°¤Nl^ª{…vbõ7…—ÌI…%ß',“
K¸)Ôè	[øj4@ºÈM®9ùm£‹]Í±­ú^Éª)NXªïb«PÖûKNmï±Å¥úžÐ22ÇÑ®>æI½nüáGºžäImw³£þ¾6ÌÉ'Ðûª%\Ând¶‰ýºÕ6íž7=l·‡gúøËó°q!+XÊ ¢Úû¼ñËÊüBÕÜ¹)î–sfc‘íÒÝÑ4{—V‡ìtË¹¼€–+²¹Év3ÛÈ6gº½ÍÛMˆë®4Íúm	¥‘æ’ ¬\Ú2ïXØA¦PŠV§gªÈLT;¥²möØ>}ä‹aitÏr×–ôÖ[!’§“˜u»>´0…/•Š%âï6»›ßiõ’© Ü”g~˜¿qn:8U’gŽþj²gØpB¢+KÁhwó°[ÝŠ°…Á÷M\uåNófœ¾+´¥îgÄr")ïR¶¢tÝüæjr:¡]Øþò;pÇôöÍ0Ù˜:§A•æÔ¬Æð~ ¯”YHçi’	Mìõ vêˆbr´„î™T…½âÅfUÚˆn¼®”ÈçRdX½×èaî{å\Ô ÇêgÙÆ®Kv»¶ãáA¢Û]YƒŠ]e²KìëLÙ"2K™.BÌ—o!ùˆÀí
)"AÞ˜@­§ÍîHiö~6v ü;/5vYlËŠ¯ƒËoì´L¤@³Ø¤§Q&¢Üå@›61èOÒ[ În}·±kÊˆ
c_ˆ©úå%.æhÙp­úBýE‚~¹ {½·ð— (ÃÌºo7b0¿ó
•&ýÏZEszŒBP#jùHK‚9§JØ‹’QÖÌ³¹9ÐÍ|\üO˜/ôÈø/ù%Œ	bÓ7&ø9¬h;7‹ó²)Éàè|JlÑ³_Ü—ºB†Á~™Ä}™À|)å½ÞÓ…¬¼—
=!{Ø§½,÷Mz©£¼Ô$˜'R¤#»Ì@u™‰è2#Íå`$—é).±c ¸A°.“ã€ì˜qc†®LÃGÂçÆLdÆì—SÇÿ áÄTêŠ>•>~›ÎÀÌeùC©g:<¿â)!j‡Ú8ô¦9ï‰æy€“~BiìxÃ7Á±ôëdöÑtÖ)‰í‡bP®r² ”DÜ³‘–„Ž2¬Ý]B5Ã1î wm×ÅžSJ»=ËpbN2ÀG£›ýÃ™ÌÓ“ÅØáÍÃÒz"y¥B†ý¶Bˆ…-¡lR|ÒÎÕ$®©ùGë)X+‰`¤"50Ïej¾‡øÃ}<|Ž?|®‡ùÃ‹}<|ž?|¾‡Ë%þt¹”~<BrÌÍ;¡ÁÙ9ñ„úìÐÔ°½ßQ[ybfÈ§3Ã¢½©ÒTëãñåàñå>_	_9õZ+§"šËN»S§ø9GÓxyì®qÄ1
uSDtKóŸxdçäõAà¹þ WŽæ/Ãf*0	=A¦B:VÌ~µ§‘•
óthÁ0ÁOŽˆe$±‡Œ**Y4AnøÂÅïN3‚XJ7lôTpÒrêü›¼Êl“‡éÏÈ–†Â¨4Žú·)¢ˆäˆŽF	ƒÔá+¢˜ß:QÆ#PÆÚÛS—jog,ËggaÃµ-g¯m×¶œ½¶\ÛFöÚ6pmÙk«ÁËÕúx»¼^-ùýN¬E3ÑÑ5ûÈ@Îb†+š?ûÏ¼ïøŒ8ñ†û¬/Ü³1´{£G=£i8DRèH¢Š¥Ú–Ì¶ dÛ¨ëAG@žü®Ïõá=ÞÃú‡òÈÒÃIŒ4r³?—f0_Ý8HDÇ7€ùÊ­wöÇÄ‡fd"„§"ò3ó4Æ{yêÿíè&4y}tT•®—r¢©CÊüŽ}Wm€­ÆÅ)÷<15yÖ	j)ƒÍF\G8—á+J+Æ×Ö–ÔjÁŽYº.Iêˆ©[Ù¼oßš^»…[/ëJYÎµÚâ‹31S)#ê£‰x×Z-{?Èà¤©×WÈôQ#§IxVÇŸxVÇ×ž‘8Ÿ„ý'ø?ó“¯È^ø+zTô!Ç1û™žåDœÿë3
]¦Ô‘äÔœÔÒ |W–=nïæ2eï`#Ÿ/+Ñœar¡,äv-e˜”¼È3ËµÃ•Bä­Â¼×Œ¸. ®¦H£È±Ýa“×I¼	]N1#êVŽ…¬NÞµŽdWÔÛhâ.<MþkÚtÎ`dÎ‰¾b^Kd\èËå\Ù ÄÇ@—ªê‚Šn“k´‰Vþ×‘¤Z	hØMòàš–í¦¯u5ÈŸÅs@ßhØ»HG3þÁQãÑIxœy YŠ™Bä3AÐ3ÂÃg0!ÈN
Ÿ „ÀMÏ–$o)+'è«ö)ž éË‰´ÎI:Yt€.1
­±+ÒÉÉ­~é!Œÿh'è8ÞÈd‚V5ü˜attÖe2AqÎ—âkm¤º`¾¿…œL¦€ˆc$ˆÐ+#	‰Ð¢ÓÅDªñÉùõºÌóŸ`³Ÿx3Ía’¿0ˆ³€y¤®Ç4×Îï;ÿÄ—¤Ç2‘ÖŒrïSÄyAþTEªïO¿Ký“tg{ßs¬ÅžÍEtI Aq
Gõ ŸÄîÑË}Òä>¨ä÷3¹ÇÓºËxIF?Á_;î,Šo‡ö-¯Ìœt	ûS¾5ôðØ^Ã7|±—ƒý$ü4=ËÂ)³è½N]‡¾pÔ@yaXI,ãéYmR¼Gßë.¢Õ.‹@=‘z¢z­ƒ:Ç”£½ÃG¡TaÊá«Sá²oEzŸñ- MÛõfÑuB…€V ¥Z›{ß½x¯r<§)`õ3ÜÌÜ‹Ö‡ôëÓ3mrpÓbø	\?qŒèŽR1"€«#P¤ëD9ŽY9R_Hh™„UÞŒCÕùá¬âüâ,A®QrœeN “¯Õ†Ù¶êh‹Á<ª‰p ùd¬ã+òø´¬ñ‡›ëÝ'm|Ja`Þø•ÐÅ9h|6W–ãJ/“ïì,ñiÅ{@šø­á³ÃO„{ŒèßUêõ¬ïƒÉ}vâ÷ˆä{Ö õ…	!ü@ßFx„…EWIVÍ—~}zøß±Qh´L
öÎº:K×šm pn“êw0ÿÒ_|œFÒ	†›ÑxùOžŽ˜uk}mõêúö6¬Rk››[ï×® ««ø_QáïÑc*µn×ÁCTãÏ§’žKÂ„B1ˆ³S´öbY—jf
é¤v/ÄRï$µÀƒÿLsžDtö1‹*ÃãäÎÕÁ¹zE¸â™ì¢·Ðeø…>4‘/Ç9é‰Ù~	2æÒdÄÞýÖ›ÇäŽâcÔ|ÈÙõ>Z†;©rxu’öpèñjøû½ 8w‹u\'eòÞGMÚÊ7!áÌÄ²Ý8ÀN¡áØ
˜Bpïn÷vÚ–Ççä»³k9íhçÞZ?ReëPXMðM·ç/³EÙŒñ¬@#^é«'-ç[ÌÍ‡s2‹ÓÊÃ?`ë$1@ÄÔD^2w_ÀQ·ªK^Ó±Ý-ÚŸJwx›hðNªãðiX.ð½ÈysS,±|×Xå‹Š§[LÍKó+å½ w²ôð	“˜J Ð>)²(@ÂùkÐŽ¼
–:þe‚Üia˜XTŽ¶õ ±²Ð@-ôätxå¯\öy	_™_˜›»™ZæúÌéUÆkúc ˆu ÖÈ£«Á£«úGu(÷Í` ¼|ò”Z…[$/Dg• `vð¥£Í®o[‹SeÕU˜J,G9E„-‡.–®1ðXZ›
š…½‚:öDÚ—~¦·¦µÀÑ-¦¿'D(±øwos¼ÙøŽ2ýjˆó”×Ï¬Ïú9íÿ  ÿÿì}moÇ•î÷ýe!1É’â«,1’Š¤l&$Å%©d÷zuãæLsØñÌôlw(F!x±ñ‹‹|0´Æzõj#K¾ŠãZÜDùb÷—ûKnsªª«»«ª»‡CêÅlÖp¦»ªºêÔ©óúãìæp.ÃôLÈ¡Ä´BuÏï`}«<<Ä“ö	Â0jûdôÇA@½Ã`Oh(AÌ.1®:OOwÑ]®bÇþj7­$y±«Wxƒ9Ã™êË¶!¿Ôr=>æ{ç+»'é«áíI'ê¦cOâsg{|eßm@!	úÀFå:~Š‚Å¿SÄÜXÍ]º%ñ¹«ïô;^7H¢Uà+hý+ƒGÝÜ«ÛôRØép*`×~Ì§ƒo;ð$@'8vaËû£Ð¿VØB€ðóŸù%ÝÀ:tc¹ºµ`—%’Qtp~¾'™ž/½¥F)±m§Õ¶ùCâq3‚¬IÒRy”F`ÞæÏ¤Ä‰Ñ•PnÝ åôkL|¹O6Y°¾ÞÇÅøŒ°…>“|-­¯Ïð$óåqŒ~NlFa'ÄµÿI½¶&t4ÞæSÐ\ .b03Âæ‡m\á¢­Æj=¾'Çú„Iªúœ?•ÿ#ObÒ2Íþ¥zö+92!m4CÏ¥yèžÄÓz"Ðdoü¥„
þ÷_hô±Åä	¶OÂÄó–~ƒ{í9=ðL4ox;¢Ùÿ,¿bŸŠÅK|H·ˆþ¾ùüeN•éN÷d?@Cr‡yœV¯Ý>d=\U¾]“}Ÿ5¼n3@×VÐMBüJ˜—ùï`\B,r°Cy“ëw~B²Õeö&kp½‚ßxmhÊNZŒóvs´ñ nm»7Û°±“ÔÙ2C{Æåfq™É¥–F7˜ƒã›Òó>Ù|0ï)»»ë[âm'¢E!D¾mž";"_¸…ºlþð*«£Þ¼jÙŸW3žÊjÖùWÓ³ó3Þ­ð²94-ºÅKDËyŠ^ï¥ jpy¹²ï[z¿«8þ>Áð©ûx&©cåäÞ)HKIŽÝ¡gÇiq;˜„€ËçßÓÉþãÕ•Ÿ°ë7×ÖÀÉ¾¶º´ˆaáË+;‹«kÛvûÿà;Û/ž¬³}–qæm¯ 	ZÐ_mza'‰3Pl8»™ÎŠªÓS9±¨;’s_.h»åH°ˆû¦½Žb>~­@EóÛ?çu{ŒB™¸éo` OºçÙ&	FŽŽÒ¿¸)?]wßÓçkð	aß±Õm6ìïÉHƒT¿îûÀgmÓš#–¦PìÕb¦ä9­ÇPe÷ü…±½Ñl4
ãôäÇ?ŠÍá×Ö¶ŽÞ;²’Å ³ oË¿gôÇýq³Ûƒ?ë®¼=¢ÒëœÊjJ)Æ»`àÇ¤ôÔôêz†q´Ã
H™²«Â©œÝ–øÇçô{ª¸¸ÀB2z’Ê)—áÐ ©}BÚJñ¸ßòoóyc$g›ŸÁ^ ÒªR"'i¨½„ÿXùË KÉÇµu‹Â×µC]2K~çBW.Î¥ÚñœVQ6’Ú6ê„?â>t„* Š^˜•WâÎ~ŽÂ‚9ÎˆðwYTÄt6yÏêÚÜÜù[^‡€®Šþœý‰Ågæ2F'›Ú–¶¤Ô¢Ë1Z‚%€#ÜöKåÈ:Ðëõøžñº	½êŒ6r|Ñ ÓbqÔ¸R¡™#æµó:ÃÍÎŠ¨BRwÐê˜ŸsüÅ÷ü(ò£Í÷qxå\7œ_Y5ž1Îµ¬¯b„´tkÍ³@%eoôîÔ-‡„:Ša4•±RtOš¦Š	–w¾!YóPüaââ8³çñXÓð×âÑ(9ãñˆr]º=‘È0£½Ó:zÝ?ÐÉ_eª2Ñ_Ž^t/~²³éT:^†þ~Š²«ÿçûíÍE6šM²«?é©n¤\Îºq¾{¢KÞÿ;Ïæ'§¦^Õ9"-×”èö±$m.‘=ÆyÖêñ—¦³›Ðc¿øYüž³Ï—zvŸjæÿ‰d±Lç)Ì"ÕÅ„:•¯î–!³Ñ´J¹_`@{‚;a7¬<Õ¢s.týWvžŸJÒCúq0á$ï€†á‘$½º|ªSœ¤]¯6‘¨7Î/JÓÃÄ ájM¿í	èôM¯ë·«yŸ*•Tamß`ŸMÇqÝëíÃÎ«È;«¨N 2S®À(ElV¥Ð<–I¯ŠH¢_ãŽÃ:ÛÛå“dÍ´Ë“7c~WÑ›‘w£;@|­îÇÂ÷
,ÿKí³Äœý#2²Eˆ}ÎæŒ£Äóðwd÷’*Qm—ýÄÚ±Ë÷F$#ÎŠ]À·c×ÂTÀBÖUxîjAÍ1ç½÷Zæ.S2G`ÍŠ™Àâç`áÈÑ‚˜³8œŠu±ˆS|Á|ÉýEõh·ìÕRDþjLðß°¼…Š*{YO r½$/ø©XB¡@šò…6Ïzí 9Ô^êo£í5ýx?°¾Â€åA¬›D—ÃFLEùÚA\5&þ[ÁíÝéÛÃ`úeºÎs”öS™º?!±55 #¹dVo)5h‹ª¦Cgñ®)*uDæÝž½lb?Vt±{ 4µ«HÊ±Ü¡¢÷2ë@Yrt¬»ZûÚ`jfr_ÄiÂÿÓÒ‹ŸÊØ‡¯˜ýúR~õˆØè3’Ì‘z–ƒV aŠ+/ùQBÄä»éßÅ¥€ØŒ•ºž¡{SÑ]#Ü­w né!ˆójù;ÍsW‰ìýfI‘2%éŒ\O‹\Kr›xEO•(kŒÕãMS c6Ì|Gyò®àkOÌÃÔBW7vV¶—vV¼Â–Wß^ÝY\cË7–n®¯lìl³Í­ŒPª¢—	VR?ÖëžÛ—¯m‡?lpFV=²íö3Œþ#í=qö…, žF¡P0îZ™Ü'àòNÝØ"h÷›‡`Òþ$êmå¹Î‹iý†É¢ÉÚ?p‡±Á)_AŽ;nmÖÂ)ÂÖ!Å¤j8ˆÓ+ÅÌå¥JQ)Æ&UŽ9WeeáÅÛÃvŸ¿Bö&x‡¨ÁÿÝŸ˜¾À‰‡ÿOéÄFÉ!í¶É8 ·SQ\‘Ý\RÜ†:~+k¢‹Âw·c¯ñî¢;0‘~7®__]Z]\;Ñc”œó9½ÃÅ‚Pîšký Ý„pÛ6V3â<ÒÜvQ³e4?ë«FßÒ£ÔâpOSàœ¦N‹uv:gÍâÜU«ç¶«:×µÎ¢«¤“IÉVCVÒGV©¶Z"ålum[¼¥h±P)ÍfùmÅ6GÈ¹«3SÓ3Óó3f§ù§K³sÓ¢µuaÂï%ƒ4‚å~ü£áUU³Öpsµaw2¼q¿ÁNdÔKû^’„­ÈëŒg6mÙH‡­k$)ÏLŒ<S“AkŸ%&VÆOƒ1ÁHÚ‡lBJç*K“õÎœ»zk™¶°lÿºµK„÷c”ª5iƒH,šBX ^WòÿK#µ¤£=u¹¥¨%,¹lï,®o®,¿ ÁE¾DEÑåíÈköQj_òzVùE›™”`d/•e˜k!çÖÀNWaB:>çÜ	 ãms½ºÛô¢Ã“fnìñ½y}†ýùí’g²ñHfé•Cp…|±	6¡‹#'q@g°y§õ°é·Ù;œ·Im"”ÃávËûí„wF¥[êüÑ7óU,«ùÅF¿7voÑñ¢÷¢0 u:ÿÓDXÈÌ¬ËWy9„£_>Žxdæ“( I[øW:½Ó$Í¤qRå^œðZiu§‘—¡'ðªwžÆGÚ´–ªaIó.¸ÅG/ÜJ†,ÛvÈ…	eb #™òQ4A›uÜ4µ«Ç™—PF¬À8Ž¬ëÜŠÚRî¸l'ÌkvØSúÝ÷-¹¤ô™B2>ïÞúÔùó`÷å’GÂâ~«EqâQØnÇ¼A~˜£¸}è|=$Ïm‰¶pE/LîmN#£1Òü$Þ†3Ï”lã£ºœm£™éo²íw[É>û›vÍŒ†ð¦56™„Û	ßÏ­Ñ1ç¼fa%GGªÜp]#£ªÊ&”
XÅY"'¾iÊŽÞ…3ÆÖÃQ†' 
pr ø/à±ôæ¡j(gÐû’²4	
~Là€ÂI1`þe¶±ò¶´¶¸mÄâÅ&£*mñZòÈüD@þ[6Œ$åYÀ_ ßóW´¸û"`Õ°ÇšM¶á¤z¿H}2û4Ëpžrßr˜^8¥bþLpM÷ðý9Ëùgk]‚¯×‚`ˆ	ãùL…çskXÑM¸U<*“CýP>°"9aNÿ²¿¨	N‡a‡f5
ù§¶Û‡„é˜Vø‡¦ÌšÆdÎ+Á‚×‡d*|]«ˆOÍU¬àóíÈ›Þn€Œ¸ZT ÃÁùYX®N€ Q,ŠÌ>*¥œÉszñúídÔ Ñ{lô®€kƒeÄºüõ&¹×á2‹ü¤q±ºðœ&©®6¹ù~üéwîÚ
×Â?ZòbtŒK`õ;zþÝÿåMü|jâÒ­ó­q6òÓ‘±£÷ŠÃ+|ò5tŠÆ-#ƒŸ£ˆ,3 ëSŒMÆ½vÀÌñ‘1Ó¯¯'ošþ^7Á:Kïe|&+¯Áú*›³N¨ìÝŸñ¡›´  ¹ §}Üð3Ìø+,‚éVä¹{ñ;ÓÍrâäÌj¯ÃY­œîö.—æo[@V”ëOð'ÃíÈ­ò·Ó—¦Ûßkìs½_|ké;KœE$ùAi?¹uÊô¼—$\Ýø±ÅÛ­\™ß …KóÆ!ô1)¿ä»æsŽE“¯æÈôÔôÈ¸XÚò|Ž°#S“™‡ÞJZáÏñ~•§.¥O	Mˆ­CnÆ¼C·
ßHœŸdŸÄ™òcUið]UgP£ÿ[nº—ò9ëk4|~–Ä­Ñ÷,çˆkÄ`é6CÙAÀ©u×‹¹ð"'þ÷}ðGûÍ YyãK‘ –0.æIÙ‡oÜ*ÌÔ»©Uçh¼}'èøa?MM\¹7güì›*<t”7ÚNL6²Ec4ëWUär`lØ,êÁ µ”gey8/âe²vØhú†cÂx&ÿ9²ÖŸÄÿáRB­0ËØÿ²22NHÏ\$V›5®€Ð¼¡=j¬JL£juÐ"à?Íîôô8Ûl{‡ãlƒËh~tXŠÁøª`?E{´ïò7úÿ«¸ÇTHùØmbáËŽeƒÅñ;‹–bß?rÓ@.>ÄM „ªª»à$c‹É/6ðM.&{|ÿ^Õþ (ðÇZêÀ½‰ìßŸcVaøñBª/c?ƒ¶«¢)°Š}LÁÒÉ8ñÚ‡-_T­‹ü7ÐÓoA•wó	¨[;`º‹ùÐ®Ü!ñùµa=t¼çÌ@÷$o«õâ«“fBBM"RêÐ·»ºÊÙ`ž(®æÞ¦wýN¯ú~ŒJÿ(ÿsœ«Ýwpò­`¢Û÷ýÃ+wùÍGªJ{§G‚ÖÕô£»ó¶…‹-æ4v:§(&Ê5s”WcS«Òy¸Ò×þÂFå»Ò–ÕÞ»ƒà¦­-í&CÜÛ©)fpY{qœ]gK¯³lm	q´¢éÈ`A8éi“°N¿½vjl$#Ä]yñdíòèÁŽõBEè_Ýïøq½ýhk}aûQ–ûÊíG|Ý±\YKü²ö¦4Å¡Ùkò¾«ÆÙÈ²w8r‹˜y¼_!¾Ä¿Äya°UNÝF»ßôchÊƒ@fsëa¡–
O‹x¿`®1;<fÙ”ÖœOÃüë*.H1»† P[)>1kp—ßä‡Nœ­^]žg[y‹Bq:ÑÕXéS¬/Fii”iþÃ-à§¶–×óÛ±?äÁhÉºØ|çW™ówK‹¼4rl;Ëæg§
ˆóÄ²!öGKÜutRžÞ~w†('W–$î¨[Æ%*K$=Õòµ‘±gË¨Å¯_Ï;±uÖž{á1C1¹áðx´]D^¯ŒÛË .Îí¡ ü+’IÖßêÌúÉï”²~ÞÔPX«wÆú]×I²~é`T¬_8Y«wú¬_Fˆdý-¸·…¬(ø[ÂúùÎx	˜þà:ÄM@¥oBÞ Ûë&˜¢AF¥KÃùôm ‚|ÓŒœÓç8˜•»yPJW1îÓ-eZå¤ré æ
L¢ü‹BõÀãj*`zm¶Ùï™Cái)N²D·Ñ` Ô) Z.]fTTt®Ö*Æ;Ø-	¯¤qÀ]|ÛðÃ+BõSY5†N‚ÇÒ­ö¹Ù|ÎF¿+$³”A ¿€¯_¹w¼;WÎA¯íw¨XoýÕ´Y26CÝ-¹ð×v¹ôíÞ//_ÁN=“ëT‹wÖ‹rµç¡Kwæ‚^]µ;™„öé<‰|œÁùêLçƒoý“
,Ï'óatš3¿¤Læ_å¿BÌí›×~¸²´³`»¶¶xíæ6[_ÜÜ\ÝxÛ^%s›Bò–D@1¤À3IE'L²ôë…\gê6Gð\c’K¹˜gh?£`´Ö¨Œzf¨ßhTí_ŠìœãççœL	OKä`IŽÎ‹ËÒq¡x£œ`]ÑË×Âð}Ì	Ëd bÌ…cã¿÷»Õ‹ÀÙ	SÿgU3þ#Uâœð?‰Ã?c²>%¸ûïqÆdiYìAà‡ìÐÙº×ëñéy¯Ù˜Q4Ìœ¢ªYEÌYBµþCeóä'2-ª˜ÿ…îg¬¬Hþ©®þS&‘8¬#N3†Òæ‚+YÃK¼vØ—Ñ.Ò…dvQ?Š‚F¿Ýïp–Ð³¤Y‡\:Võ\p•ˆåáUk¢¿˜"kxJå$¢ú§w…ŒfÖj+Â˜-{HqäÆýcø
CX¨>ÜC£•Œ»¯^_V¼"‡S[MÝž×ÕíãÔ>6WB(cù--<'-¶D›r‰6¥u£Ù€á3<WNµLÓ±O¹Š1ÈgMœSEµéÅûy±®ÌH5Ýh}55˜Z¹—iîEž¦a~iþ?Ò“Èÿ(j±Àßˆ»þù=µ\ú¹ã?Hþiæh¾Sž,ælB•ˆ0¥sÎ1{|zýdJö¶³]Ÿï6+uâÂ8«P–—á•›)ˆâ&ú»åApji\Þ»•—Ê2ÂPobÖmÑ¡úî´ËTØfÆ,‡Í–´b ’¸áÓ,s¶”)æíVÑ8¨aå‹•ÀQÔ	º\Lw>õ=”‚þ©eå‹7	'»ÛóÃœåÕ“ÙÑF¦K £0Œ®.ê^27î;Þâ!Ò«"²LzYÓÔÐ9»¡Q­!R-•"ªo® ’.¡tV»™³aNñ+^iþa#ÝíÂë8úS.®ŠýÐ	 RãGe>J¼©Â=âõåíUpŒæ’û¶ü—|šJøýNJ¡l/’™õÌ Ì˜2ür£){¹‚ˆj—G1§ìÂ”K%²Ì2ü¤®|š^¥~'âÇüLõ¨Ã¾—ÞãÜévÓºë˜¬WƒxÄ…ÔR	n‡a²}bKU/iv®v©¥¬Ñ?^\4Ê&ÈnjØls}¼¸ÄÃ(Ÿä”¥Ì¥,ø#bq­d¾Ý-6Í–ÈVo!—öÚ0JÇ¬—9/ÕPf¬ÛL–²s™ ¦ÒGQ!d¨,0ž.g~*]©Oêú%R‹Å·§=÷Ø¹Z+ÆÉOOM»^ÉèÜ›-â	Öôî‰¯ó&ÜÁœ}öñÛwò@€¼)½;Q—O–Þüßo<ÿæ wU®H/Ä(<åq¿ÌÔ¿aMÐ¦ËMýðôñ¨_ä#jðg›Áð“ù7§rRî]®¡¸Hë	ŒOx#KOh[«CPƒŽ¡þTT{ª¨;Ì
Ü®Tq…zbœ»ñK§8}ì¨y¢_NýÇµ	Ëõ§ž“ÑoŠÔnrŒ…~'ÒŽ±$Lë)ž»#vˆNf`TŽÛ­º”ãÔôò[LÇ±ûÛõ©RñLWEÇÃðHÕ…½žÒ\øÚCJb.,­BOUgÃ ±=ý·§æWz•ƒJžI×íc	mÀU]†H1á RtIá$-|¥1£±Ñ|hÉÊòêŽÀR]^ÙY\]ÛfçÙÒë«oßÜZÜY½±a0YálñÄÂK´ÆÏbKò±%3C	.a^7èÀç Ëö¼&þûó0ìð'.Í³f?ÂR. JžÅ¡;eÛOþxÎ@tÂq(÷Poû=ž‚ST†Ka¨ÉRØÝZýH„ÁñM’Ëë_’â&3aœåÒ°Ó@‚ó@–£~žytBRÉ¿Fáãk*|n‚L¡  ¼mÉ¤j]?‘…®	&÷wEß©uFÐR%W¹%0	q]õ¶Çy”%ÃÀàR„À  "ºEJÅ/:¦E;8ÎZh©
‡[—9ÖÆvw’òf¯‰¨‘±äšüeâr:@¥Œò¸Hy,HW´Ï…cFû\ClÍu?ñøÛ{l+<¨è7)Ä)ÄBqckêo9¥©Ë²”žÓIê:(¥Õ„å´q–X8«Ø7K­›Â¶YØÖjå
“äÎûà{Öâé²ÃT´pY,X|±î’ýIŠ û#¾"—Æá~%3…¬†Ó²
ŸUà-±Wxçê’¦Ò½}hsp¶žõ®Wiï	ÀÍoéæs¸­NÓØç@9m˜ÓÐþé€sbÇV`?úÕ]ðÄ+…!¸
bÂkÂ¨!H‹pÒ‚•yKÕvòg\W¤‡[w Vž–ÎÈ²s§ÃË]=C»o€:ÚÓŽŠö§†vÖŠ`ëÈ©‰Ê×+zJÙ-‚ÎšØÆŠ¹
œÑˆÉ(™ÕDÜóP¨h-Gž¼™OZõs0¤'^7iŠx|k•Ü2Y¶ ìX—G:,¯/’G×‘fÐÍ(­øŽ)Q÷ˆÆËSÞ+e
	W),Ã›«cDÂU
†“ób±"qå apÕƒ«x\µÄàjûXWIlÒ+R\³[U"ÖÅ#ƒKa²×÷Ë(C^•QÆ2]~Ý¶BrXñùÃ;[ÓòPâJÏV5Îòžª\%Ñð¬6°%>S¡hÅ:ƒËŒwFí\}ÜbÞ„ÚóážD‰Ù5<«ªFÏÏ•K0™èyÅç•	Û¥m<_\©höó¸n¾-×Ô ?9ï
ž5ãÔÔw…ê›Ïtö?­Ï*­\2	HB·S_ƒ™Ðt‡ò»‚ùm™hB*rUoOîdß—-´lšt=k§K’Rr¤6]íw8¤í;³¡3µ¶–Cú·ÊwüÑ7?4TG•ê|Hå^žhtaÒð†9ºä9þ„rÍžìgØÄ=W¿ «y¥ïI+tÿ©ƒú#9Ï?F·ôSªû¥|þKñ?P‚Ê_ð‡K=×;ûAÌøÉ¾Ï¸†‚Q\’=¶!?|ƒ	ÜDq—hÏœd7aìû™,$ÔR ºÏk6Y'Œüq¸¥+ÊZÀçCžP}”¡Àåß¶èmÉûA—õ€Ñ{œïvÀu¼ë5[¾-©ßÂ|³À¾àÑ1A‘˜‹Åê¦'çK£È³éÁvÂ?N¢|	×±íBÎé½vÐÀr$úLÒ¢Ã|Nºù +ñ›±’Äm•ÉY-snÏèîÒóÈD'çUtµ#Ü”×_Ai©žäm\—ÜZä²¬EV2&GW’Å„üV+“¹Ršr•Œ y¥4Û®²”f‰`ˆ„fÜ•Ú~93šë¤gêSò‹a«uÚ|k¢lºcê¤sZ’6ïpÙçª·O©ÔÀáŽ—…üftüØ=!CI7¶1`Û!ê¶þuŸïT¶JÇ¸|!3#¢JßµNM²îd8°~&’‰L3…YÉÊ¹¬Óçm®!¼8¹qº%Ü÷rl/”“9¦¥¯:Ú}Áé¤ö„¸é!Xëåùùreƒ:ÂÆÄ§C2æ¼D…„´¹éëËd…Ö!ªÓÍÒüVU‰ÄTMVª!%L¥ôÐãìÊ±ò‡ààt\Çì*‹tÕ„9{Ê&ÍŽ;ù²TXsMU´Ñ¬f6dÍ|H¸*$zŠcWF'Še®´ÎjSÒ	-8Ð’/µ©çæ´fTäŸ;²QZ¹˜KÞÐŠ¾º±³²µ¸´³úã¶½²„Ymo²íwV¯ï°íÍ•¥Õë«KÙ¤·íš€Š|±ì(ëæü)ÙÜKj¿ûÑñÐkÜFq-\è£|²ÍDÁè)lž†”;ü«ÁD© Áòƒ·HÖ#ŽÙùÔÇ²îõŽeC¯mPv§9U·+Ër»naÖ•@—1Üæ³–hòŸ*´âÏ„9YZ}Óõ ³õ—Ðu~vrM,`A—o« Ù—9M*Q‰ò”0¦Dd™¦–C0Ãm,O!°³t1ØÅ…/9@ ‹•™Øí¬ü°¡—ìðêy°dœôâÖ8ãÿ“æI»üP!R"µ_R‹G§å]´ÍPÀË]È·å’–‡eT‚µt¡ñ¨–LÀ–šIWqÐóÓGyÑŠ‹ü>=Æ+ôo8›ßÓùî—^øªÊØÇ#Lý”´Ÿû©ÜWç²|V<¨v†œúë­ü'}¯¼ÇŸ)|[Øí"ˆ`Hï[qÓÁÔ=„—#¯¦y^âdËQØã;ÔlgRyh²ölE¼ª‚37Ðtæ•Í–0û‘–ÈËÌ–Ó¢!^´<ÌDÜX’o’^ÂTô*µ*ò‚½„Â5Ån/4šÕPñ‘,@ü[cœÕ0­Èë„€¬N
¹J^Uh*—å`†4ˆ®ºÄCå>1b†l„R|^i¿	ÂiYòEzÝõ;½vxèûÂ}ÉÿäkØéUq`_¥zúHR#ÿ“”ß«éÇ:#´ã‘jý;s:ôûÊù©,1Œ/”pmÔîi×¶K€¥“J*‹	•\™pÕqgÂUÛ¥	×ùó ý°ÅµµT2æ*;FS^P©!ºGá‚‹.2ŠðMŽ!¬9áº1V)‚Uoœ W ÌÍ*çUwF=xoO2V¼I-àèxÄhÓŸà¯Já¥édIoìÄtùa†¡¿Ë›º–Ö­QÒÜTU¿3]6³e™¹R¿*ù™Å­•ï”æÙl‹ö²&:«<”ª©îúÆV«ÄþVŠþÍ+g4ce#˜ƒÔ˜)†BW.å"WÇà†kP¡ð?“ÍE*\ÊÈ9ù(¥!©’ˆXî^w¾”ÅÆµIÏN{Óg'ƒ¸Nàd8;2Ãx©YW![hA™nT!†Wë  …í!CÃøsU<´í{œ CdüC2!aN¥è—D:™Ÿ—ódø.Ó‰¬6 §cI<û‚l@¦5.+0fòXŒêÎ¢žßáSie?üâBûÌLH5[Q™^{¼8l5˜Z,YqLdÉ÷X¦|¨Š,˜ª]|¦)¿Ê¶‹‚cUkŠy·½€Ï~ÛÏ…WÚÆ¿Oz¹ÃÌUCnïŒTõ¼jÄìË,€é9S@µÅ*‹…ïï–»›ôKˆD1í&„Ùpv|‰G Ñ=H&2¦¼¢´S)8½2	Áø6¶¤`B ('Ø„0±þ2}2{ÄUZ1új¹ÄéU7«8½T~±\¼êBRÆÄ’„­V[Z¡Ã¬l…æËTÉô¬F>œ|UpÕOñ®rÏ¥	¬é•ç\œh*„Ùô`p³Ñéš?R‹L}€²r%=W€ H£âÏ]]Âp¾z)$™þËå%ýæŠ¸ªIË•LÙ†XÒN¹ÌW”o-àŽÊ¯3:—aÃGì†]¾¬"}üh7z`B*³)ºJª¶àªÓ­‚°(Qgô½ÅÈg‡aŸy»qØî'~û3+ñÝ×ÅjÊ3þ€a~#¢ª4P¡ }'àbŠ°"e<ùÞ˜[…w›ZDO
&ðFÑ‚R=`’–¶©ÕÃNs/ë×û««?•Ž5…hFªJaŠ;Y: caÆÊË¶««äPÀDuôê¢_ÔXœ&±‰™ÔŠ«}geN¶qç3ÚLkÝ õë¤à‹˜¸¯P)ø7R~¿?Õë5èüJ Jº³Ì©™ÈîB ×°U³—r€‚ ªh@ÜYÀÏQx`®j {3gkàì cqÿ‰åßãÚßG}ò3Ž+ü)“ó?/°Í0NZ‘¿ý×kl”¸ióË^âí‚•a‡æÛ†„r~¬ ³¡su‘ÔóLj>×Qî	šÏÂMYjºœ|Ý ¯eÈìS2çxÝ†D6ÝëÆŸÓDÅµ°áµÙ¶wÛ¥}z’Ê '«é\ÝÖÎN{pœzšm»/mE`§+#?lcøX`N‰;6È÷’ZC8¶+Îyº¿X¤ûK’î‡R¼èø4ÿ-dTë©ŠÿCÑµ™ñàÛaû°Û üÅH‹íÇ|‰ém=rwí:€Ž†±cšA&?4eÀÈxÿË»¶…VÛË‹á%*l²Õ´ÑÑ$ê»ìV™}°Úå«íA}žv
c«gœœtÊµÖÎŸgÛA§4Ëš»¬é·½C‘â¹r‡k Gøôíàç~fÕü;~£Ÿì Þ`ÛŒÂNû£¼½°ÍÙ#íO¹aÅ·ãlš.M¤ê2ìyíØµÃbÚº5%}ësÀšA’ä7ÐŸŽuú¢Ø¿wYÌO…ì§‹Ád†ÜïÒ†:â\öÁ6ÚeÆóCeÆ§UIÎªú(V³ö¼F‚ÞVñjåâ·rcê8rç>—î@Â'}AePèÉÉN@ÏCð"9/Í+‰Åü¤>wµÔÀe×ÔÌÒú3Êþµ¸{„E á ¹qG™]4-Û„_Jˆ—­ú¤Ûqãž_u°e'yjùðÿ;³æ\óól*ð¢j)ÅöY~¢Ô¬dTí(;Öì\
Óòõ_•Þ\³´á•
W¶¬!”F‚b‡lqy}uƒmnÝ¸¾º9£;;«ooËóÕîéò"m˜M~Èù\ÉÐ_ŠïpäŠütÜÚ>ÖjB€B(±˜²b†hê¬!dwÉb†Åò…Óá ÿÂr(Á´¯Ü½Ë¿[`Sã,æ$×¢§&/Í3þÕô<R*<-8Iæéiõô4>:e|Ò¿µª*tZxR÷“ä1Î0_Z‘wˆ>ÖBEÆ|ÙE­z£2‚—9ßƒy¾_Ü@Z5J)ÒÁ65ß˜ŸÍl=~Ú×[˜x*™rd„Ç”5Â#—´l:S‘-Ö.—éÈ†²hÔ¤ßvM°KdüG-Âã¾¬3ñ…†L÷÷Òd”*J”+ôÿSä·ómËÄ¾e²Àc™ÉÐ–H\b“ï<=5uþâ Æ±š/®’„)ãK•¥›æýŠ˜Qa™>k”Ÿë©Å¡SœGS,m×k¡Ï$bñaÌ)…‹­|zƒ˜SÂ…Ïž˜f‚¹F²çGÀHíš*<hÖ-ÊÕË¢EmÕÌÔ…RR¥Da*¾â¶†´ÑŒ¦Ã@¤‚j#l‡ÇÿÒÖ"DÈ®%N½ TžV5B÷jT,J8$F?EÌ!óÚ6fàÿEÃ_é÷óÈ-Ñô/hÇJÌ¨™f”ÊºÙlÕšˆò¬0Ÿ¥)­¦–Ò:MáO¶C‡ŠŸñ³u)l÷;]6Áosù;bo²kõ€Ty¯¼Ã	`×\þÉ:K²iæ”üŽ²@!¿Íg¿ãö,ƒÂ.¨e3 fÌ 0§1|¨"´Ø|\-ÞP*î‰‘+»ì,ÕT;MÖÙå*b¥âž¶»Ð00ÙØ÷¢ÅdtjìtgÚ¸3ïªM•Ì#—3É‹“š= ØÔH|OÂr<W±‹f~!*Ù!>nBì„¤$OÝD¡¢t¥üZæŸ3Î¿­{QÉ$HøÊU—Ê}ö9¬%”ü¹&ÿê¹ÆôV—+h±Æ $˜¾€Šá£ˆ¤í¥õí	Ô'¦¦ËPajàúñÕ˜}VC	tqA¾ÈŒ9ÿ.È¹t&}ÿ„W$Ë^ ftZŠØSV›Áz¶la…wu¸PÑ¶ëßnv²\TËnGzfÉ9ùXÏ×]rÎÔu5l‡
ýC¤Êg2,ÿ1ÂÞSýïR<J¤Çë°¡}²B¤EÑº#ì5$M÷¥Õ{á’`ùÃÒúg¿Ô¥ÙQLCÒ•8ˆYà†ÒXÅÐ†Š²úóÎò€Âj‘Co±ÕØ(„¦:Æë‚!+	–Ä8E<+äq~=¶ÈcdÙ\¡ø¥ˆeR/ø
m‡f:êáï
­ñ³Íaû6ÇJ‡ë“¯É¶øGT¸ŸK_	ÕOáâ©ò!)ç¸knìíÀkÓyãøÐæIíl|ø{›=Û-¶ß±f×>ëõØ-s.	Y_Ià¢'8¾›xP
Þý:_z0Þáïlöl—Ø~‡]ò¶ßmbño@u
Í.ÕÞ+°Sžj®÷qOÐVÛ”´6ý¶°á0µ;
†ºBÃo2\$]’gŸEz[÷Ú¾Mò?y³þ,¼Ym¿*j[®›ëüÄµuôúžSÒ4©¼x÷€]ÝHöRÓšYN|&)Ù'*/ï±Ä­
ç¸ÖÃ&{›ÓJï•çOœ²«©˜N=q†µ>Yn²a?Ãç(iÛg\E¿î¾;²ø=¨˜½8ÿ¿†Ÿ¯áçøù~^¤ù/TV»õª 7fpù3
´>_ÅÿWãnÆÊ;Ûù£-r6}’ÉÕ±åÙð§n¶ü@Ã}.Ã˜À­Ø³Ï)w¿Œ'á3Pa÷_†Ñz‘ï¹vÄWîÎT¨É“eAX·*O)WÂšìàå’¹ö?WMÈ8ë;”Uðqì‚Åfƒï_ýðiaZ´ÙË!ðz/˜Ì=Å°I]4{Fîò~µt‚ôeÚl5hLM€ò¥dW#â Å~žâÀ€cö´qùi0™¢•¬xcðÇž^ZÚÀ©˜Æ_+,JŒ±e¶Eqd–ˆ-£g–LÍ5UCU¦zs©ÍVn=¦¢)³>ÒIÒÍMÀùå @‡Ä0K£aÈ üùü·iˆzY–¾—¯~NFÁúâêÚµÃÞd‹k+[;§›Q°îíÝðN6£À”Ëxþ<[ëzÞŽ±?»¼–€ÌÜMh^ê÷+ìÝÜbÜeA“¢ø…UiäG^é…l5n{6J —Ø&¦ŒK¬“f ¹¿ wøýºi”ÿæ‰D{.eiÀyP”(
Ö×¬?Aô‡ôÁ{,T ¿åZ9’ð;^{oâo}/j²•;|Ì=qÇ‹ÞY#â›2
<>lˆ·„
õ|†ÇÙôÔÂô<[\ç?øw~Ôãï3²åC5yËÄ5g«
ãci4/~ŸqiªŸ`¥ú~¯v ¥ÉÑû$ÛáwŠéxŸK<lvö»ù4Qµ†Nÿ®ûwÝ“è—ô¼_6PnÀjøB:#´Î@µb»\z{Ë@.a+‡rz‹rO²Í¶ÒdÛOX?fïw¤bšˆ|@-'JïÜnèEMÖ¢FŸw6	¯·ÃùÍû?Î_6Cn|bxÏœ ñeGyØY¢ÖZ×)ìœ¿Á[iö%pú,!ÕOÅA¤(Bþr¥ ¾Öâ¿R6 4.ŸÔ¥•2ÛÀqð·×`'obÈoÌøqð¹¡‘¶ÃVœçßú|Í"N ²“ÝñÞ÷	­ˆS6rÈâ¤ß„àlÌMõZ^ Û]M}ä·(&_ö$àD}vàE3S3òÔ¸?lFA·ôxoQªVÆiùøÃ*³½ˆD“S`äó»@ÊåCƒ4ìý(ìBþ1ær@3h¥rÂ»šR²c‚ƒ3®&—Tå¼"	M"~·,F¤/so	ïÄ:\bd»>h…Ycq1ªƒý‰fúÝàï¹˜@[|M`8»>oÒg?ìó·šJö‘`¯ñua[~‹#æS -*RZn’Cr¹ˆgu"Ž`Ïz1?&Ø=¾9Ø¨(üRÆo3¸œÒ2ùU¾fß}üã7
ZG™3¾”ÌômÝòù„ÜYdýQvDµµø@ ¦*zÅYšæ§L{†f9û\MiïûªEíÊ6Xçs).OqbgëaÔ…ïA»Ùç	Wi=šd«.ƒ±wB>Yüh+O²ïP÷§#gýn	«¬[`j}®rÒÝó:q®SÇ¸É)R¿ùƒlD*¯$pùÅ\‘‹%ÝíóZÜ6Ì'ß4Ìï†ýÖ>öÐŠ|I»‰ä‰]t‘!£ºÊø;D!'ê”‰5jÔS‰òæ4ÊÛ¦CbÛç¢-œËžßAvÝ3·+çkéé¸—«Bø¨bŽaNÊ9qò'Òä
$ºŸøþûíÃqb©ö›ìÆû½lj»5öùÌ4ó$8e Áå~„À±ÔÚ.µt==ÃW,Ò˜rDc3°L¾¸=ÂOÃä
ZáßÞYÜ¹¹Í¶V6olí,Àâˆ7×2 4D~[žŠ·AßÄ ŽFôgánöÕ	¾ÁoòÅF(Ù¨H,‰ÇÙžïÇx€ŸqæËûâ?A'p¶ûñ¾T¤¾FtØ² ¯†gÈ`gˆ“0â²#’ž-¤“m˜ÀœŒ¿ënùü¯fÌ~Œ›'ôÜLŽ3”xëûY+ö…åÐ‚È®	åJ~¾rW~:Â}AµØÐ2À9EÑ2—ê¥e ¨Î4¨L*åP§wÛ”!­|þˆOõ_¡Ö01ÀEOnß¼6±tc}óÆÆÊÆÎÛYY\zge‹ýäÆÖ¶7—VŽÕ>i(2$qè-{ñ>IWœQ†	N-î,ô´ í‹j-AS“Åó¼¶qÀëv3–§»¢xWšG•ÍãÖR©µ•°äPóÿOLOeS˜-	Ó"MZ»Ñ”mj°XâSK§1gÏs ÌggP¾:Ù<œ‹YôWK.°“N²—¼~‰KúíœÃ|¡,,…E)X%L„` áŒøóCó³QD”.~½ þY|ï§0dx›Ê­*£dzëëPšõ-ÍKwâ*–¥¶æk\9o zN€sxLJJ6©=$Z~¦~2’ç9~ŠŸH¦ülØ÷›ý6gÕ¨kŸ3Z•Ìƒž•sù, ç"—•cžc¢·êmg&d>oœ„G$aZ¥P?zôÍ£‡ô¥YŠ³ðïä*azWœ’·áÌëÉ›ü¨d£Û¤?™¦¤p ¹Ür ÿ+É¢Ó%Ç`îä»¼Ä9e·éå²ù/ðn/ä7kv¸yÛÿë¾;¾ÂxËÏˆ6žÉ¤á/Hà-šHÉúü›G¿D²X”UK·…z"{dúâÛì÷‚öÉn’Ò@üx"8éK²¸à\ˆ=Á–ÂýÒÛ}>û·ƒ8ŒŽ¿I¸0è«‚s{ ÐE|¶7Jö†ÕÀûLÚmUªícUzþ14Dd®ø@GôøY¾Èt 	¿M&ÊãîÂ¬ï˜™92¥ŠNëoÕj:e´,¿TL‹.‚;ÃÂÃ $x³˜ï¼Bo˜þ'’!‘ùöâGL¦i¼È´oéßçÛpo²M4ýÆlÍÛåL*ç¬9Þî”³b®55Èá…+9àî4mÕR±Ý*!\Ô†¥À˜ŸºÀ–…t1IàœE¾23–zÊ¸Œòå&ZiŠêæäóYy•$É,É­N·»d*™•=î™àtvpAƒâ(ë:ÅÌ J¶Q|¤Pƒd0
T“³Yù-•>z&wž!cò|| åÅeìŠul‘9êð\Þ»^Ä&2²™~RQÚZ&'æTÅp&:E #‡ðœxgéÌÙ#©&ÁVÿ†ß*ÅƒÅªÜÇAÖ’øgdÝ¥Ù)SÝ%Ö‹
ÁXw=µ&k|AD¥ÄX¤»¥rEÉd¶Û¶zE–Ó[À¹Ì[Ù€sHÑt–yæ"ŠZ¿ÉèUiÎšAcò¤&˜oJf3E2³@¨†Œ¢áCÔCl¡…WÉ]©œ«Ð¾³µ°€5î%dDe˜R†0*ÞÈ\”ùî{2-Ýµ²zcÈÁá"èì;f8e>–Ú­áì?àì 
ä‹Žõ2bikÛ2K9ÉÉÔÄÑ{Å)3­þ]í­~ÀL@RfNÁÀ[+Û+;#ˆMjÍÓø•åéÅkô°dËxc2g7pDÝ)ŠÛ÷ºÍ¶OP^)ÅeÇcy<ÄB[æz›¾Öµ }Sh£2Ä4“gô8«ë6œÚ¸â”þddŠ\ùWä‰rî#ì—€¹É"á‘v‚“Uz`W0¿4)”‰Ó"•Ç‚ApäáFÈµ—LV,
rHˆ\Åƒ@‘D¼áx&Bq™rTÔ’YÛÍ$â¨I' Ô:i¥ßL5ÜœÀ“ø›;Æ§ïglûÈ$Í•Ë•ê_nêº»ÜI`µ.«»îlÝeÍ€Y±ÑÕå1Z)áo]]>g·V{Ô²¥¿ŠHwÞÌÅIáÜ]5–p4¸¯ËGU1
s‡¿Æ™jÎàn”$z\6ð÷ù,ûÑ•sXZ ¼ëÓSÆpÖSƒ×ñCKãUQðÎÈwk>ºÍ'ûêµ•eêòJÆƒÇËRÈÏRßEÒ”<V‰j©Í!Ñ¬@©F±/1–†à•lú¯°ÃY—½¢iO6ãÌ+Ìu­ÌæÎóæÆ¬	±VOïpˆ/Îº—ðÇ½Äú¾¿‘%>AÓ	%æ>ü	ÓØ¿ÖR­\¸€Ù²¼é§¸µ¾´Ï®|ÚÑ£-ÓŽ¨ï<‰í¼ç9O%»˜ÕÕ"Å
2Ñ¨ð§>zH~´'÷ýHÄ‹=úNÞ»‰€·Œ¤Q…÷ öhÌ`3²1Ë¹L§r·ßÙ5mËNÐ½rÎ ³Ññî\97mà(pDüTdWõ¹!6TfÎî©	ã@_bnY¬åÀÎë ¦íb4³¸ÒŠ\ú­­XMcf¯f±šêºmv|U4–:úH>#È àb,k·É„¢‚TZÐLŠö‰|æÉË’ù8öýa‡©-.-Ý¸¹±³¸±Ã67VÖŽÕ¼¥¶Øhð¥L¼n2´@µ´I¶±j:vé]Oýx¨ö2ª™Öe€X5mí¯]¯‹™ÀV(0r´æ=øzdaé„#•þ¡&¦rž÷$’ à ²ºë>½¶Û”Œ5º>±3±lÕªg±uk¡ß<ú¯»°=™„‰×V}×èÒTu¤ m=6»|}°8ƒõ#å ¥l€?1=’*³D"|.„bôØ3{“-qv;ä „“Š£ã§÷Y PÙnÍYáî)
ŠìWÚçd’§ºs¤xrÝkôÛŽàA#ß¿›^Ð<‘`ºì~EÐ]ÞÌæAåÊÓÿaè˜ø‚iÕå Ë63¹YŠ¤¢Yš›e ”ÏâÄÛÛ²ô=.N?¾NˆÎ»u±q–9ô¢í eò%Ÿí}÷|¡*Ðè	VOµ8ºgL´quH~"eŽ˜
b%ì§çnÃ?îÎQ1–öÓõÑÙ€§öQ8âd¨gåóüpËçó'Ú„_‘öD;TÆõÀœßàkJÅƒ·üØnûC>ÊŠÑ®ÇŒ§Ã*'ìõR‡Ô­ùÍ•¿Çzî-Î‚¼ÃÊîÑùWÈ=j)^÷èïi‹dÅï4§D$Ð?$.Æ7Î=Ü/”Q(ÃãÍùÉ~	¶CòŠR¢Í3¿èËíå§Ç`^Ñëôà™Oô[ìH¸QYL©ð³NÇq~JÒäÿBSÃ LÑÔ™ã=r;}´ŽÃ`ËÄØ€@ÓˆFÅÃÄ¨ô–êø!‘›"¯¬cøƒ¦¥>—‡Þ¨zúÏ¶SgdíÜjð§QÀÃ4 ÕL¾×¼]{×O5ÅãK¡½“0,
ÃeÆ‚ƒížôÕ?•?“Ð_k!g0¿Dû¿Gê	"ë€^ÇF¯-ïŒ~Û<¢Â':]á¬öp Ãà‡ÔÒ@§4ŸF3rvF¿ÌnÖˆºe4ÀÃ¯(‚…Dv¶î'ûasGw[¥RKg7»?kýUü‡3(4CLìOc5N ¯å5Ï]Å ¡/¨âe&ÐqpuIŒD4÷EÔip‹o?9w•þ…FŸÈ$°Ïí÷dû†3˜ìÌð\¦–	Löbð‚°"H–ñ&[ã>Tº¢ù­rCÆ•ÚÖ(…	!™‚ve“Ô[¯IêzÐöw8=¼dV©2›Ó×’~>0ø#É€NàO$	#T,×¾‚ñúÖ¨ÜZ¨ÔÃ;˜z˜ŸàÌŠ»ç*Ëµj€ß¤ûåF+h€qÜ)Éà~É!FñZ˜Ó“ýL,‘Ø€luùòùd¿òcÂÒTëÐ¤k= ÕŠk< òÐ€œ»J¢¦ùiþmTdûÆ•¸œì†ÍŒÕž& M?(VÅw-Å]%QújrÇ˜¾JCˆ(ƒ5¹343öÑ|.êùy+âz’Éæ'ÊÙ4 /‰ËˆÔ-Ÿ™Z›æ„µ¼ÀàÙÔPX»	ã½¿”ËÁ‘V-zAŠ¯mé›á;%óŽÎ	Û]kL»»ã7ƒ~‡–¥IÕ¼h7I!Ê‚üƒ¼a¡0Úš6íSá~ìž¼0…Œ´¦Ë*óqøñ‰Û77W¶ôøÒ­küß¥m®î«'=TÑt‰ph¡ŠØ$o†hÅ~?T|™sK2@ŒâVx !÷•8h8âÜkŽ(tß	ùæ{Ç÷ÚÉ~õø†Gà`£ W	¯×b˜ ×¯Ã¦?ù3ˆ€ìbºEÄnüh°„iI˜>Áè:s`Âü$î	~ˆkÃ„	Õ|›°ÐkàW™ÐŒ)7ÃÖÂVËo2ÄBŒMºÃß2IÐQ£g;`8<.žÜá]åL£KaÓÛ€Þ×¨ƒËi¢=c Ù,K»YÜ\øEdyßÒÎ5¶}Øm°ÿþå²íõm¶F‰×~é¨o{‹Ë‘_–üpüb¿$ÂHs<
ìõ£^»Hƒw=è³Àx²íw[ÉþèçƒQ£è¦Ï(¾wòÁwÙÐE`£ÈEw„Ûå¸$œ$?-Ç c‹Ý°!›¨zøÑ…ª0Âžï%\ä¢Z¢ŸÀ™N‹åÂ)Yv·ýBU_¶xC… ú«o>e2Ü]Õ½&ÃíWZôgªFŒœÇèò|!¿"|º¦6Ú|*H±@Äº×õZ>:„ÈsÄ	êØÆ`³ù^@Ù­M/¨ H‘ÓÃ“*[·"_\±œNÜtåxs•Ã)¦ŒF¶Ë=ÿ×jÛ%K­ÇŠÉH_`ñ§_Ñÿ&‹AýoòüZ=¤ß?‘Áõ¿¢Pš.æ7üµ[ÚäI–¿Wé½Åé ß½,ed±Ýæºy¥Ò$d{ÔHjêXQ1?" R_TN¸†a‹÷ÙêŒøt×‰9ŽŽÃ+Ÿ™ŸÎ J§CÖeñé\€t‚E_o{ütNGbÆ¦™ÎÜ”˜NkÄLW„¥3ØîmoÆ_becñÚÚÊ2BÈ-¯nÓE£¨	AÎäbÖXÍÌ‚d1äÃï	7ª)Æ›;c2E&óXDÃeO¤)Rà›‡)ç¤ÎV2Ó.½×\ã9=®²æ'|½#,ŽÄ×ír¶ÂÙ°RUHã„p²…ú“ð¢™Jf0¯_É¾Ü‰²–ÙT²©,O7LT9ÄøŒ«XJM|)¹ÊSUsâ·"÷[Êóû­d<ˆü™ÎO`®…£†‹TÈõE”(hµ@>â” s ãáÂ‰¬`æíB	«CFP¾¼ßàýR:1ÍÆ‹f'j ¯+I_ìdØˆP¼–¯IMJÕ¶C¯YÊ>êUŽ/¥/J&[½SÁBMiQx³®¼ùoà¼RÔl²	ÔÕ3­ùeùÞY#Ášqæ
fñ¹\ù9½®®Ô½>µ*ïæ’’÷eÕI”Â€kÞg£“?‹eÆÛ~RpJB]’’´ Òš¡KÈÔúEyØàV¿KPi4Xwòu„ø5Ú¯OÓ¨$–›ìÄ;˜	ˆ»kà5[¹‡ÑZØ:¦G ]Ê"#Ì }.¹‰…zwz:w®j‚.T,˜™Á£×]¿@¬o€åÓPAŠ=žÀdËœ)µjcd§¿qõœÍbi¼'Öö¼xJBµÎ<ˆ©!"™æ¬‚?šÈHuˆ]7‰XF3º$–9`Üo¶’ï‹-Ë…¨°U<_ªa¥ÿ´Çé±6|ú‚îv#TÆØ+oš'ZÚ˜ž<ÐJÀÿ€9³Ns?Gá{S{—ö.Þeoû9öuÎÚi`³Ù¾×ò¥àÍ¥.&ãtñ.–qîI!-ÖLŸRçüÅy[~B¯è°(²A¨³wâB×,CrÁÖ«š«ð²£pžäÄ:‡HWÂËŽØ]¡ àeµ“<—ùÚùžN„á9.7eC%IV ­eÅ¶¬È–¥{©K|@CfBàkL½ÿ2L½ÿOýJ·Õâ}ç”…¿B½ækèžÙOüÝÏ{|6³‹•‹³BŸM°ÛAìÒÎïPÁg..»¶ý~ÐäZ™d9ðïÁÄ»s3ß½Î3ø8õÝ[Ì6™=pª)¶•×Ì%·J,ê,³×)Æp7ácžÐBª`
k‚¯Õäã°2¯	à^3s@øp0qéÛ‡ÿåÃv‰¥qŽàmµMø Ät:å\“ÖnwC¾4ì_‡Ôun¢vÂ0ôv'HrÞH1@×æ»@T;á;aÇ‡XMýïÑÜnN ƒ+N´ßGªþãcUÙJp¬±BùWÒ,ú)Aóý^ÔÜÀ?þ¨á)oÑ¹É	FÞ‹s6öb«U¤‰?Šú~A 9†BûZ‹rñ„yJµ7¼6Hry~$d)L¶íÙëÜëSà^×ŽÑéZÞôbµóì,Úœ§M(Í’¾Ÿ™*ª~EÅjPôq£-y=«¼Ž-%uC6›Éxc0,]J%Õ‹½1•Í$åbW¢¿¨öÌ[ÆWýÉÊÚÒõ¶sÃdfê•)†@_‘K©Ï58Z±|)¸Î²ssyecg›--n­°õË+kl{é7Ö
Bn¯šbšã"Kœ¬øˆØ_÷CþçÙ:¹/a±*$AÛc¡d÷h+Åªq—÷§‹¦Ó¶š]ÐVù‘ƒŸs`cRÉˆ»ýV:ïIš`@+‚{Ä…„¯žgdð
8ñ»œ=€•ÿZmÞ¹5¹ÛåÉuƒß-¸ÿ§ÝŒ ÷9p©iƒaùnÚéd?åYÓ–±ƒ’ÁòGJZóNYµ°}TÅ\X³Oçî×9mõÀrs‚SË;éë`â¢bwh	< ,gÚ¨³•+v,JùŠ$gv=¡.E>×óÎÁÏÊŒ=/Éq_®%ü3!OÿVËz–ïiüÐÄÿÿþB©ªÒlÉ‹|¶6ý6£è•ÜTåÙE©©_X(´ñ]Ì™ûYÎ P$šô~Ÿõ~*[„^<øæÑ?À…@É@”kæAíËG.(ÙI†^’¯T¢§;˜ä‹qeT¤PÂ~R,Û}o\ÃÛ„8‘ûº—¼.”òMM|­PèÆ§,¯4:5}qzîÒôìÔÜ¥1×RT¶
!ÿ:'2¡Øß\uJ÷(›O—‹*ˆ2gÂü_wä™dñ¬ *wÍ[9J(õQŽ¥XK£?GGÇc_BI¶¦,{’ÒkÑÔï”`z`½2žš=z?
ºïOLåEWÞÉÔ\snêV%©Tz5Õ6ú•@s¡66\ŸVjÀmç…“‚,¨Í^I°cgÆ„P›3íbØ¥®³Ô­è°¨7ìÏŽYM¦›så™dçªb™gz´Í‡ªl ]SÕä™
zˆAÆÏæ)W>í
ƒ6È9ç±˜u_‡%ÀïŸ¥oÿ>ñÅ©è4ü“Ä¿€ôCy
Êƒè#ÅÇž¥çn.p_÷©})‹a>É@j|óùƒs¦áóé¾ÉÕœÃ°1¿P`Œèñ= ôÎó<ÊÅ;š2uÒ°8fõ¥@±[aÛ<,Aý W1p¿ƒˆ3ò`õüÑÝw‹‹ÈåX.´B`ewdœ!äÔlÅ¿ÙÑ¸íÄ÷û~¤=²#¾q<$â"´‡Þîó	<gWi5
}€é—,?Ý·H¯ˆødj¾
ý"ïFos6sEL¸ßÄÙz†''ƒæ÷Ïåü™U±>–@6tƒ	 K¨3¢[s.|N*0ë)LÖÛÚëŒŠ6™ñý‡cÅWRAþW—”|Äuï¦Ø%÷™_%g;ŸCÛ¹T=ìE³SÐ™Ñb[~KÍèþÌÞüÞô-–;Â„¤¾ [SîÄÔ¬íÖ^(XE©?YûUŽçÜNàÒNW‰ŒaîË¤_š¡­ø&Ã%Äme.&n.ÑŒ~Â\¯f…Õ$sqþz¾Ø/>b„4ÆŒPÆóŽû®EaTHÔW]öååHÜŸ7“uåü}yeòó1fFF1ež2|I7¤f¢Óð†š©øò2ÑÄeŒp2¥æƒ¡Në’»¤`kŒ‰QQ1r-õä‹™úòJ3öÕÝ6	®.âŸä6¦x‹·êÕ
dLrPÃËzt_ôWáOqø,Œ_u¿9Þ¥ÌÐ'y/ƒÚ—²Uú:‚YÖÿHï(A£ÈŠ¬éÒ]TCÈ€æ•EÅ²M“œÁÛ\ÁM$'ü4A,_,IËƒ¾IçÞÃÈ¡Ýl£±îÆûá¨¸#@0—R¸!Ø.±Cä]V‘ª°G”dSawIvIÞâoÑ^Éí–ÿþåVüÏÜ˜u/v\Ç“½‹AÛÕ¾¡Ó`9(GyÐå-Ap=#7ùÅœáhÎ†˜ç…<8cË@K­²]nû\^9ôoìíYìF|[Á–_ë	‡f£S%ÆWžQÔŒÚ®‰OÚ>sÊ„nFÌ,…™‹YX^q­mxrv6(	¸pI»á3	s
„ßý&W"ýŽ×ëVL5ÛÛRO¥ŒO4i!ùÑÇÑDØmšgÜ²…YW9à%ëÈËr;kŽYY•Àtr
S†›}Ñ­§smð¦‘‚v%Ìüâ s¥ãàÊ	aae÷Ý,ÆšÃÿã$
ß÷'Þ½eÛ†–íæþÁh vl>r@ýNŽþK—–Þ‹u,·hL6ÑAD}YåaÁÅM7T2`ZÖh©Ù.Y€ÀeW|,b‘ñ!þðHÞ$PY?•Žµ?2‘G	÷~,MœQ–È^5Ì}ºŸ–M’eøséŒûéÇ?W2nÂ¨ãmDÁ`c5 šÓ¬{Œ{à\‚"/_ÊV“æ]o4	•)ÂYIÕèM /CD˜«™ãÜY2®¤ïZJO¸Vþ´B´”óúoäCý`	£V˜¨)ú1%Í|vZI‹„ã‚È¶¥ç¸A²÷fgJt¸4©›B6äßRSFÔlƒÉ®“LÌ•'ãÃ7bÎm!ì‚}jÛOú=vž­Ý÷c—ßÖpÁ0gIÆ´™r²À¢g€—ÅªÉ½^ûð4´ƒ|÷6ßŽÁ¡cCÍ5Ö]Ôp#\³øÝTûï@¦:òo$nËË„òJÜ<Øc££A—Óš4oOr&EPq;Þî˜ÕHîzjtDMûˆÕNÏOÆ(l·wÂÑ»J€Â]ß»„x;:a˜ì°#›uœùmÎzmƒ¬qX1k±ž'xz|&ËF?ú@8Í4èð/µíô™8cFTIŸUøæ‚$ž÷d‘O¥oíIªMd†Žƒ‡eË¡Õ7à‹qÛÚ˜ØðCgßgé-1¹Ä,‡å¸a×~Wå²89†8HA‰ÒJKÑ!ÛrO‚¸øE­ã¦Ô5Y1Wàèø`Âë‹,Ð„ÙÖÊÆòÊÖ±FñF¼ãjw,›¼TÈq¥7ù+ñd[<¦¼ƒÂYjlý¦×ùI«P‰K[“NQö‹_°â¯-é 5v'Â&ªw&Ý¶¹Ö.çmŠ¥JaDG2æÊ]ñáˆógˆiêëþ××OÊ¦.uÛæ‡zt‡8ŠŒÃÖ™ž–Á}Ïe©•dŸBH.ñCÊDíH9i„ð„ÀˆÑ)¼Q;æp.ù5Ÿ
z(pÜmw&.æÆÍ¿UÙuy#JÁ¢gÊVË“µxßœQU'„œëŒªP××Çy¶~Z®2¸ò…—4æ Ÿ»-?}­g6Ê8R}Á—º?[ÒZC ,œ@#ÃE“‰=¨k$ÿv‚DëÑfÖm‚ng™1º}$ÀìX ÅÜ‘Ñz-ø,ÐSŸõ„P#íjé ¨`ª4ËÉ9øÿ  ÿÿ –E qxœÔ“ÏnÓ0Àï}ŠO-í$“¶kAMÑ¦6$Ó¤9±—DsíÈvÖTQ/ö¹åÄ‰àYò(8ÉÚ&¡ˆ!—Øßÿïû}VTŸaî÷,—[ýUŸÇ°RçxNô&JÐèÙ¢%‚¦‰FWÃA”\Ã­à¹‚"æ„Ä|ÐsêPp„/–JH‰k*áiÚÊÀLà8uÀoj€WFã£«'ƒÑäùx|]•°BMA˜ˆ:JÔNÏc°Jc_â%šˆ{*«Öñ¬–ãê¦9‹YKŸgßóìgž}Î³æÐÐNm7ÖZð¦Ï´¶âþš…Þ“öúàÌ@­iÐ„ý/h¼=ÿ+€©MÂûY§&IíC¸ s“žÀ)öî@øD]U4QùÃ¡]Ï»‹à†_€9aôLø"ÖÍb·Øº·Œ&`âÏòh9|Gh†æ¸`93U)5“©fZ^^lÆ´V¤Dml$.y—æ‰ÚpO¸B“£ú=:·ëà	&¤jmD·V~k‡Mïc]o)0•/Ð¸vËTE˜ÏÒæ»6kS¾—¯yö%Ïòì›U,D55k5µK§µ6ÉGŽ» @?©1ƒSA–5zScV/Ú—bQŒºÜØî6xÊ„ïSòŽ_F«²•Ž‰AeÁÁHj&+/+É¬W`Izµ‡º# &ó×ÜOŠû¾Îšb/ ²æþ±’ìÝóÌ>hÜèàd#Ü7ŒŠ#*Û\Â?µSã´9ö_vV_   ÿÿ V;Ò8