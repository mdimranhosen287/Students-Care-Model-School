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
                { rank: 2, name: 'Tasnim Rahman', class: 'Class 10-A', score: '97.2%', badge: 'â­ High Attendance' },
                { rank: 3, name: 'Arefin Chowdhury', class: 'Class 8-B', score: '95.8%', badge: 'â­ Top Grade' },
                { rank: 4, name: 'Maliha Islam', class: 'Class 9-B', score: '94.3%', badge: 'â­ Consistently Active' },
                { rank: 5, name: 'Nabil Ahmed', class: 'Class 7-A', score: '93.1%', badge: 'â­ Excel' }
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
                            { id: 'report_primary', labelBn: 'à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ à¦•à¦¾à¦°à§à¦¡ â€” à¦ªà§à¦°à¦¾à¦‡à¦®à¦¾à¦°à¦¿', labelEn: 'Report Card â€” Primary Section' },
                            { id: 'report_exam', labelBn: 'à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ à¦•à¦¾à¦°à§à¦¡ â€” à¦ªà¦°à§€à¦•à§à¦·à¦¾', labelEn: 'Report Card â€” Examination' },
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
                  
                  const csvContent = "ï»¿" + [
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
                            <p class="sheet-title">Monthly Attendance Sheet â€” July 2026 &nbsp;|&nbsp; Class: ${classText} &nbsp;|&nbsp; Section: ${sectionText}</p>
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
                            >
                              â®
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
                              â¯
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
                                âœ“ {lang === 'bn' ? 'à¦…à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦“ à¦¸à¦¿à¦™à§à¦•à¦¡' : 'Approved & Synced'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                Assigned ID: {adm.assignedId || 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-150 text-rose-700 text-xs font-black rounded-xl">
                              âœ• {lang === 'bn' ? 'à¦ªà§à¦°à¦¤à§à¦¯à¦¾à¦–à§à¦¯à¦¾à¦¤' : 'Rejected'}
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
                                      <td claxœì}ëo#Irçwÿ9r»EíˆI‘zYêZÒLkÝ/ˆš™]4Ó%VI,w‘Å­*¶Ä•Ø|ûÁ0|€½w€mÀ0¼îØ{»‹ý°·ì¥á¿ä"òQïªÌ,Rju¯
3->Š™Y™‘‘¿ˆðý§ÆÐÚYOë2¾€NÝQPº#—½:qŒþkXAýÅ6ÛÝµNç%{Û·Få‘óz{cáÁÅëÒ¬ac4ZžÝÇ¾¯º½˜þ@ñæË•ï‘]ß·ÏF–IzV?°Ý‘OjóÌò—È÷V”{LÒw?=MO¼mÚoâmœ:ÖÁêçž1&gÆ¸Þjt5“èóçjq­ï–	üsh^,‘¤¦ÑÒ#¢õB^[ÓKÖå•îocb{dÕé¼àƒù‚´`¢Û.IoÂŸ“³ºTc8f½ÛLSä‰ë™ðö'¼¯Õl®¬7‰çNF¦eÖ‡&ÿY«5¾xÉéÛuÌ­±ë,^8CªäÆ®í\~––Ô{Ø^‚Tm\Ÿë8¯ÍÎbq)3+»%ÈêO'~`ŸNÅ[dÀ¶ûép*LÉiäá$Ü‘Æ´Ðg9¡¿Ò"ž`:†§f?Ô#lw´çØý×;—5*@ÆÈt,üÎ&—¢5œJj£C²ÇÚ¹tŒÑÙÙÙ!‹'£EòY|÷ö·ïÞþâÝ·óîí¿¿{ûŸïÞ¾}÷ö;xAÞ½ýé»·¿z÷í_ÀûE²Eé>1Æc{t¶¨×yœ´PÐ’ûÆò¶J¥	»E|ØZí¶—¡qÎHà#ßÆé¨÷]Çõ|ÒŸx¾ëÕÇ®MÉUc„zâdÛs¤sà“lGäÔvœ…‘;²ˆxîkøåïáÈÛ:è^ì,4I“´;ðŸÑÓÞÇF0àÍ?™Ý7Æ;t^bŸþ)LBêã¯m3ì,´ˆ¹³ð¤Õ"ÝGkF›´a$Íf^¼iµÂ÷ðw[o¿©w‡°vV§¾‰ÿòïZ­vc£½Aè¿[-ú¦Õ}´ù¦N?r6Ýµ:ý÷ÇdEsªW`®u~²½Â¸NY^â…bßr¬Àú`E~FH4ls™
ÞFH¯s“¿ ²áß}ûÿÞ½ýuL\ð	·Àð\ß
¥ÓŒúÙz³y'+æ'+6ÉºSol¬­àöV§½ËåB«µÖh­ó·­Ã×m!/Z°f››]øw£»ñ¸KÖ‡]Òy³6ìÔ×à_ø¶ùUÇh‘=ð¦$öž´Þ¬>éõAkíVJŒëÒÞàVO¥YMÚ:qÍ©¬9¸Í8q¬òÛ¤Ï»_në¤5BÐ0[k	Ôí¾UŸÖW¥Tžn+n»Œ¿@JœyÆ4”ôM'&N'Ž“²VLÃ€™ÊßÑ_´›M†Ë2ø0øFJ›Yé6¯‘åçÇæ­Ö£î°Õ!Í“Q/X‹ø^<êÆÞ¢^}oé¯¿ÚŒ)õö“.4}Foƒ¿_uãŸÖ}¶Ÿ¬£ h*	 %¦WâÚíA'¾štý!3Sáµg ­#«Í®
‘ämŸ?}÷í_£ªýí_SUð_Sü·ðþçLÿ-ÝUAÿÜI„†þwïÞþòÝÛÿÇnù%ýˆ½½ý¿>¡›ïS—P]€Ü</¸[æ'Òx{eÐ‘NÓ83K~ŠÛ†ÆEý'oxQ7&KË0A¨{–c\XfÅyû9}à_„³ñ:G¿¢:Ú+ƒšÉÛ†© óˆïIõ;zû¯BÃÕ–ÿA[ù.üæßéý¿z÷ößXéuù[ÚÒ_æ,Í/DOÿI›ü/v×wôÕ·¬—woÿ5a[½û·ŸÑ%{Óã[dÿ(Î‚ªG_;Öi@`}+ “1…øÆ‹LÝ‰G@ñ™‚hñü€-	Ì;Õ¸HßÚgÏ`*…uÏºwÁ[ð}IËKœóñÕRúÊù5ùý«@ßÇÖz_>¬ï>$í-|ùýƒ½ãÙÛ=Þ}üì‹¢g-imŽc3ú†ií~orrlœ0&ñ''
ì¾Hîß/ØÓ{'ì•ç0RÛ!eâV7Ú2Ûì­kÄ¦{o9·SÒ[÷Z!KgºeÝœ$û¡1>A÷wèmÍ-úÚsÏñuÂï…'éÄ
Î-kD]IeÛæ¶„ˆ·«	×U¡äorõÂ9“H²)‚áÿ2ÉòàgT8üš~úS&Ùÿ.%¿~K_ÿ›0(´¨àè±E'{ @xìá¸åˆøÕÒ9Pïtb| @:/Ã Þª<oc²ó×|3B]6QË9÷°­õ_òú[*z¿ãóúþ{ì~÷S=Q½o‚>EüþÀúì³yï³y÷—	çBøÂ´à-Zúð¥6ˆfŸ
ò±Õ·Çþ1¨œC d°H%ëU"š%bÅÓ>·ä™}Ï—;9ä\¹ËvÛ1N,'’B¯Œ¦ÐŒ§¢ˆI“‘‹'3H*½eÿ]×_ÓOÿ™­ë]E>tn¶$ÓOŸ¤ôY}Ë5/íÃ™X;—œ<X÷´÷òÙíà1á—5‹z|@èeÚ¨YÀðÎ¬ A»‘Xˆ9k2¾¨¯â1O;n?åì
í˜!›Â©ÛŸø[î$ 67ü£Ô1Ðš©eGOMÒ#ö˜Õ¿Ì/#ÑUÜ1ª=|ÎvgáAóøû×iUüˆQ‡Ü¹½ÂZ”dMlËü‡¸§>j8Öèìµ¤)ÑÈ>ËüOûHýÆ}y’¶È®“Ü8õÜamdƒ1ÔbŠÒkÔ§„Å¼„KKåí.±ÃNzr¬tÌ)ƒžU²gÁìÝþWm’ËÝ`RV¬(0%ŠjJ,žy¶IðÔTüz‹8g[ÑÛU*$‹µ"&œ?GMÿ¹1²X.Ó$+ì°Jlë:RZÎ¹ãz7¡Ó	Õ½’§vP.Ï•Oõ„.–¯æu©š×–ž·§lñBMlChbþPjS^Z0·`ñÙÝƒ-Z~”ø©)¨p Jþ’š£Mˆï
NÐ’êÚ¢Œ…‘‰ózÿU!ÚtŽôKú“h?ËŽ©ì)Jn.ÈÆP¾—Èýy“^h¡ÄV<VIˆ\*xÌ`=ÈŒ©6š8N®½™óó].EaÅf|\»¤ZÌñâ2A	Í^Q*†—LÛ¬ïÂgeô–Çn@^,×›.‚}+Å•ÜœÞå_´šˆ¹Du¾Þ×"±“Dˆ âÐŠa<d*
.½Ä‡? Y
’3°Øiô3¦
RØ3F}ËQpŠˆÓ²»$RÙŽBïàÎ ¤¡„z^9![±g½5kÄ˜8AMB3ö)©}bäRmi¶xö8èÏþŒÝ†Ío["žL¼QyŸ}wä„é¥”ëwˆ|Àýr<µÖð-|(éSe¥Ë’T°‘Y¶ø±Q…:‘ï-9zKhMtðñQSò‹=7H»ÜÛ>Û²ÃOÞ$…TTÐ)¢*Ÿ&ÚÌ¡=:ð<×{âŸeöžjUÿ¤Øì¯EÝÛhÙ§o­ûŠßÂ6Ð_ÅìrøÅÏ>Y v]8Ø~Â°&†ãY†9k,&¶Ð€`÷}²  Fáyí¡L­&¬«ä,..-“Õf³©Ðš
SÈöÓÄö"²†ÌŽÃÃ¿‘Æ.¼"âœ‘êðúŒ\’F£‘ÏÑË|#Œ1
`‹ø2z—.Ã›ûûßØùõ&ý¾åû˜ä&Áp¿¥Þ0aÿÝî~?ãøÊsÿ,”Aêaü]ŒÇÁXM(¨“±i–	ÜDG‚‡¦S–*d¨Ø©²Ô±ßš0W•Õ·WžþDh0¿@ƒ¹Lé
3×åÏ…,ýVGp~”Bò…t ·ðæe¹69W÷ò£‘@Åö§DewùUJh®FTLîxj¢7{ÞoZ6•|{u7^"÷µJ¼å¶4žIò‰Àæ¥PÅ´×FŒ¦àÉ7Oþ‰ãö_ç:t×”`3Ò3±PEüŽŸ÷×âO½”8ùÂO¯xüDÚè†îÂƒï©aú¼ýô6{4ž”;üñb8O‰d8v`i0–—‹¸ü%þßm‘'¨ºC#°ûþ299¶? “b5ÎùßÊõ/ÏúÑÄö,Sz#÷Þ–Ø‰òÎòÎ5
DŸëµËPps˜<õ é¦ K µ(Ï>XK›¹ž‰W<ýèfL“îKµ#¼$¹³!)Bè®õ‘ŠØIp-þ¼K©csó÷Nx´š­eø§	Œð“¨Ì\»`ÓH^ªBâ˜ÎGôè©š­ñáˆ‹ßp¸rÆ¿¾ûöÏI>+ôåÍK ^æ’Ã
ðš•»˜í1?özOÌUƒ€—åé–ð¼QÁUVˆP‹:NÊ7l3:“g
ÜñBíTž]è ½E,À®	›6|ó0zÓjÆ¿‚w±ï6â_mÀ7/éáUœ£Q·ÀgèZæG~&%C8°»ô4ÁcÐ5>J!ŸoV
<`-þüIÍ?ù@å?*Žx’'Ü>×¾0/ÓÝNP~¥Pilqò€iìR£ßŸ1ý÷ç ¥0Jf´*ÖW]¥ÆðÜ3€áûF.>.üG’KÁP´l$á½3æ}—?ñå¾{ût4ÿ¸C} ó•¤‡>“Ã›æ;aüò™¶- Ú’q  AË¬ì¬þë÷BnZÚæÎ‚í‹g“ßO[¶ÌBéµuír)ê*&øø–ÉØÀà;ÞFö ;zÜš¸)mQ[´êr.<ÀIL,Š(ã¢â*.çV#9§·,EËðx˜ÂÄ*g w9¢R„Ç¥FUmŸþÛðàà§áŸ_p¡‡Òæ'ì¬á·ü0áí?ñ,
ìþŒJ€ˆCT@ø(ìËJ"@JíJ ·9èU×¡Yå¯¬Ï_2øt’Áî£5J Ií9å*±P\õ¢â˜$¿RÐ^•+uõJ¦`%EjZJf”fEòJCÝú˜.µd)#O·¨×U(¶^§4
7'É>×²/3 …SÇÁ 
Ÿø1‰±A}*X¬íÚ¬¾°ëý*v½
ªhSJØùÑÑ•0\Ùi7aêßÇj¸æ­ÕRS2_Ù‡óÙ çf˜²A]¿=* w&iù¥ ¥á’L?û‡Ü˜.*CbT:—ÆÃv0;	ÿq('\í€‚gEÃLRª’2!'ƒPD 1Ê©iîÎºa”ÈÎ‘Ë˜6Ð(9`´D¾ð0òÆè£õ(†J!Ì^ôiß2ŠËá°`â‰#×Â ƒØ‡Håè?xcÅ?#{Ã¥"€bŒKðd@—œA0q‡JæAL0•b±aPï”?ªT^>w&þžíõ+ÇTˆdØVK@Y)¢©(¦éw"ºš¡nþ7Ë˜ÃÕ˜~B5|¯ü ¦üª\lXå¾T:Ï*Q Û+Å!:,üž¸‚´±€bwl? çv0 Lü•çõL«7ÎÙVßuêøŒÚ[¾eaD ræ©Ü3°McøÄvÛut¢ÃöXYÌMG•#E¢l|ððTŽ1Æl)J :lz`‰4§™pÉœHÅd€z¤àM@ÜÇŒ- {ú¯Ñsn›JÎmµ,_0Þd<­v2%kïñöJ0¨Ö\þ^_ŠÂËÝ]kÿ„'³3ïžÓh€8
`Þ}ñã'æÃ§çLóš¤ÎÆ"?E>î˜>VµÛ$!æá¯by=x¦$6
zÄ¨Ú·JV<l	˜[.0'^ü9@X×Ö§„¿ÈáûD@¤Š)WSCe‘L®ÃªäÄ.×ÀäD)Þ¯l‚	¶.»Ž³ˆ®*øžDèÇÙ»UÜ’°<va¤„x6pÀ.›*x±Hå4êŠ‚UÜ{ëô`cÜ¹\¿J÷F"5aNâ›!h]y¸yü*ðyÿ${"?8.‘..-#ÿUþ‚ùÄÕòÄ‰\6O]ACj ¤0j„Ñ[@yú°ØÌÒŒ—Ê÷*®™R`¶ÄmÄ.NU!e²Ôý““ebó¼ýjÔÉ£[Aze8„rRæà]eÐ„8k‡ÖF ¹ 	RÉYý¬Ò0%}³Ñ÷­fS±äÆp°H…Ñ‰­*?’üQ¦“xÇºl5 ÅáòØ¯Ì¨ÃSÞmO`\bÈì]lÀìáª¥xÕ—hÜ•‹2›:sã¶¤°¢¹~º‚O“Nu¬“¶?U ¹ÇçŠAwý%ðù”´®t8¿¸;A+›]±ñbý=Y‹ó¥†Žf.cOZ
©.0Sá:ÎÚÖtd L‚fZÍ¸¦ƒî–¨ÞG+§fæÐÌB}ªZ)Õ5ËoÜìt*T“Ñœ¥ô
]¾*XnÁÇóy¤ãÄíQrï2)ý®^]éf¿äò÷º¨pZÑ;/Ït›&õòyF°G¦}æ†;Û
ø'!¯(L»v¦vB‡tŸ·Â4k• ÐJv~=bTœŠpùÉÏvPÍ*p*þŠW2Aåùmnt)Õ¹„eª—æ´…iWÌÑÉ®U¹fÎ¬¥pÔS2%¯
	š’W~F±—*Y™‹¢¬µÛ"<ÊHGSž½X0£PZª´Àc1ÂÍ¶Já¡iŠË+µF!ÁyF‘vc*ù°R¿Ð£kE¡Ëœ?ÛÊ¯;‚ÇRÕ‹ŽàÅ*±,Ä“È]oÑ´mìjµÚáUª%¥,ZéK[²ÍRÃç}Ê¶òd?qpCôÐ“ïPúU’¯ŠƒiïÅ¬Ñ‚2@ù™^Á~ûJøðéƒÄ›2éê™Ÿ¼ªö@sKì½æ(Lå‹ò$	½áÄç•›$ÇžáÚïK’\£;o÷¥JÞGZû@:,yñ…Ò?’™SI¤«õÕMuXÝ"{w{=ÒÛ{t°ÿåãRëí<í=zvLz?ì<!û½Ã/ž¬½ª”m¾ñA3'ŽE‹;l³Joü#Ü§]XI¹É±ç]zG[ëŒŠçâÓ‚¦Ò×ÜìjuÄj=ûòøðé9>|r _À²}uxðõÁQìwïy±@xƒµb}…8Ê2<ßtvšyÄf—|e[ç–7·bÌÅ€zŒ>ayÒ—Ø#¬ØÐ¦íž»E+90ÎÁBKgÃ3mØ©g©ÖÀ•Ð´Zyn`µc¶|ÿ)ÿV'ÌÛÿâ›Ín¿»ú2Ò8ð£ŽVgD–,Ä@Ë‹Ça«ùIA‰€uå:Iéz<÷ÆN[`ˆ8ús.“Ì&Óô¾Ó©¡%f’ƒáwÑd–qHn`qrUR8rŽ¦elðØzc9[Òç—â¶EØ|KÙ¥XLiuŠ<”ö^A;:*’ôÕ¥P^ƒÆœ;ƒaÄLqfK#?e˜íÅŠuæ2¾¬˜¶a¾éÊpË2Är9Ã°r3vŠOÉcc
³Zb–çïMZ`ÅØ®RÝ-¥c¶û¼â”åÇ:ÛI‡Ñš“OŒt[G}6€»¿Ü?xJŒ'Ïö£fúìÙcØãÚsÙã
Î+ü 4.<xvzjc}¢Øâý÷Ÿÿ=)–’Òqé™…Âz­äŽ%ÊÆ«t–n2Dí,HÔBj.ú”èSÂ¡n+Õ¼¼ãÚ" j»™TU<7Ï`ûVsE,–ºÜ7¦j¨½ËçG‡Ïö{T¾•Ã2`$TÂ©„S”’ž=…lEÌ	ôxÚZo/À ¸@U?b+è%S~!ª’Ô›X	:l­ÎÔÖA%BEæÃPBWn+Õ¾Üßýaï›gŸóõÁÁŸPÚ0©u„Xø…Òvæp®ˆ‚HB“C|Ç@ûVu%YÀòl×Ô—õ-‘e5aüû/ŠdðK<`¹¼ZzñêdýÞ%ëéûV ýxbàx–`Ïu‡ì•í?»çõ95u¥æ,ÕÆ5™œÏÃ1&ÁÅkuï'¥Á‡‰G¾10×Êj“ê.jÁÒ-ê`22`MÅðf‘€àÊFqhÁ!~jŸî¡?¦Ü¢Ï(R(k>cAÈlSZÂIm¶ÒºÑ†˜`¸ø°µ$qa—Å²8†ìMö/¢VçÒ?/Wß6q,@Æ¾cV4ao×*«Å@,0ça2ø&D˜™™ž·>]Ù]¬0hM‡¹jB·Â‰Va5µ
v`8v?Ë#êÚ< zˆ£îÿWôé«DÎËd¹‚Ï_êñÿàúÝ-r|°»÷èà(å*Î¹Þ›‹˜K“or\Åe‡ÈL#ÈE?ÆðÀÂ’‹O¼Ù=m<šZ˜q>øÜðÆÈ GÆ`hŒðS¼íÈ8µ7‚àÂ‡ÅMúrlø#{H¾oDðao`í¡Az'€öEÃO`òÈð£¾‡G®oòñ /BLØ4˜¬èÕsª>ø%ÏIl³“1õ«ÕNˆ}‚Š7|ÒÜÜñS'ð·jÄUè%Ùd;Ód;Ñd›l5·ÚêM®fš\š¤Ma“-­r“L“X“-Þd[§Én¦Én¬É6›Kø«1—k™&×M²¹\esYj¨ññø°wŒ³Ø›0jtéŸã	åŽ¯-“¾L‹ÚZY!,‚m‹ÐXd~QÒ/°ˆéXx³8º ¾/žáô×3Î¬†o‡5¬-²ŠÓß$}ï÷{Ïž6ð\btfŸN#s¡RÚ—IßpI•Ó¿C¡ŠýIÈ…šíØÁ4Û¿k7vSq9À‘!&yzKsjŸM<ƒúUY5ÅZGÊp“N1ÜäJN]X§SŒýÈ=—ÜÏo‡»‘ÄøÌ=eèB:¡¥TGkÆ~$«òGïO‘BÃõ‰iùñÞ—Ê‚u`òŽ’mD…|Ò	]°±²":ñ'ˆÌ‹ÄïKmp\Ül±,3¥j˜Ra¡Äh@kEz>º«£¸&pOO÷©¿E^¼,¯5S +þaÅ¾ºw×1L“Øá+Œ¿™Œi¹ãRÖ|ÀXECÇêç÷œ/Ñ×4œuUTç³#kè‚×a5ö“Ù¸­„îãÀ¿X¶›GiHÀôÊztô`@z`(fW·Q¼ºóX[EÉŽËqóO/S¢ÏenÇÕ°p]~Ð@X÷J-]õrª¼*zÞ WJ€29ÉFz_¿eÂ\_‡&¹¢qßñödí˜Æ”gß?4—…W9ñXk¦‰O]¤<$T„æŠå÷Eºã)´&Ù*sÒ9Â¼à£™›x‹•ü>qoÆ¥yH=š;åRœOJÉ-¡4¾,%÷3iè\Ym¶JqñIGj±ˆ.žîTÅÉ(”’Å‘øyr Ìÿ@·Ô§†>%0üÞ%Ÿþ+Ú[ bNP¨‘Ø:”lóÙ(<:Îe…<$Ç½j	ö›”|áÓ#$ý22%3ZT…ÿõ³`’åîßOñU8b‰FÄÙ…?®¢~(’vþ7y”-´zƒRø“Ÿ‰].®Ô¿¿­í‘åŒ1pÓ%XS'pÃ!ç–õÚ™D[L<‹1â¨„,ÏBõkÚÂž;UTL<Ðç?nMÌ3*(¯­©³,0ØèM0B9ýæ¶‘&;»
›iKv^Æ¦Ãg,™mW‰H«Ð6°L7ücŸv’:~ÿ	½ËvY
:µŸ~ZÖw1‹Óñ7![A¿•E$î†¢9ÉJhˆììÌòØdn$ŽQo„’#Æ÷¨å‰Û0¨‚œ¹Ï§Q/K[AÞw24·èkì
x]À-H\& ¼©(M×&9Ø¯ÔÍu¹ÈºÚXÝ=îÂ±„$¥ÌŠ*ÊÐ º¼X&ç®÷ÚqÓ_¦à]å~c›½¡´—d‡a’É-I-ó i¤ëd·Ê{R8ã<ã:ð$`M¼R€M^'O
ÙL‚3ÓùL’©t©•%+C)ç€;³ÙQJŸK)ÇgÇŒ~NÿM ²”ó}ò©×ËJy+ˆfß˜ÞÌÍEä}pÄB÷…;r¹yr¡ÿT½#™›'>õÑdŽZõÈDJÕéô;ÝD(Uš Rªñ-¡
zPOêt m|D·I¯CLdòÃ~€b"/oVIA_Bu•àór³Ü“§.ØËvßå—FÒÛ'K?–¶îÆtæ’c’Ô#¾H—	)¨ù—I¦™%%cd$zj˜VÝ.‹Ç¥#ÞÃÂv…E	€ü`_×åÎ–;=a
PSÉ¢–ÕýÁ}bØ#räú8GO¨‰Ïsæë8[B©P¡˜s¨ZÔPqöz˜ÀúyýEHBž[ñZ‚‡Âl×/Z­¼¼v‰¸¢X”˜d9aEHd/ZkyÍGY†…ÈVJžßÇ†¤8²£rGEÍk§€SM»ÍÂ]Ô*‹KÚ,€Â3'[©Úã‡;©í›šÔúñOêêLj{í“
rf½TÌx`RçÚ&›u±³M¥æ>Õâ’sÝâ ßÖïwn†€ã@ìR»73©q(úÇ?©k75©ÿ&Díf¯Çm¤Âa ˆÝT()Öb… VBe7†OÇë¤(Åi*—“ŠÕ;i5SÁõÉºR¡yY°þa\^<nZ1ô©+ ¼àHƒ¢=ÃÏhR%ÃÈÐñ(7„j‰Û†ÊÓ*ñ)ÅÝ)E7¦W‘£(Z@,*„¸“<;æ–ÆU¢9†9D€ˆrÁEâaÔ
ÿhEƒ‡qý"ÊV)?YèqY}u–âÔ[Ä×‹%Yr=²ç:“¡N"Ùœtà…û0ÐÙ¨¸cØ«šÕ Tk G—¨ªZ¾7~e’Dé&ÉeD:²Î)k'UÓW7›+¢½D[è*Œ_á7•Æ®]2lX¬6ˆƒÌ@Þ‹‘m‘ bfß²à•jÙÍu¡§em§/ø#"‚›¾Ÿ¿TK_q «è­J;
¨Õâ«Bs­û5³g”±Je®1?qYÞºª8ÌœS-{i¦aHÔ¹Ùƒð•zÑçø•-RñØ‰Ð’ ¹%ÍªÕy4cëø¥R=6 ¥ÊÖÉK§ù
éØu“W
tä*A•9ò'ÿ¶X-ø(]8ý  8SqÒ…,q‰Þ´%R‚Ãƒ^#Î+¸~"p­¬&Ì~ÐPãÛ-(Ž£Àsÿ†4HåÈ±~Þ·&ÉìZä½h“QÙÆÙ´ÉÙ¢…ó.¥â¼+Tm¶˜šÆ¦x™kTâuk”Æçþ`z«×¥ªƒDê¢ÌÔá%:†ªN˜E×XUÙ…áËjtªáç†ð†Ã—U¾î¼@ÖÌZ#Oš[1u’]Wæ;Åè=_šKYåéæPP¤IÄL%ñ‰ú²„É:ÛÇ'Üá¾¥7§"=š¯`jj¦ü‹_ÕJí°+LYé×Õ5DqÍ\ð‡]×`¨³‹›ëoOx±Í0²ãÝ€ë8Í‰ä“]å~ù,§mnwÑ¸A“¦L˜±“-š‚$Óö­äB`çê«<ƒš]…A<fŒÄJVc7¼*“¾Ã„ÿ®ÚXùGÃ|‹­øqXN¹„XIÖ²Šä^ÕµfÂ»òì³ü¨¢ì”°%ðmvKNEèSý}âÚ¢ýÅµ¶¢ÕiÌlµ>¯^UYmÝý˜]U·jåïðÒwjú&4S}jÿàzn~äÍ¬ìrpoêÇÉü¶t«Ö\&«Ì#ÇÓ5/“ñ¡y¡¹Ï¯¬à€h”âØCRá%ò¶:ý10•~ÀsDî+÷ÅsB†9@`ïzÀNÛ—"=ŒHðÇ¸cEoÂLÐâ–Ü$vo2—¹z€9ó4¶¼ydPluö<E3û‚fÚ³„5akÊZm±¾¨ÉŸxô4Æ‡Å$Ì|­¼4Ÿ¬E”eB¨r£ÐÆxâª•Ùå	ª Á2VøYÄ%8
)…Š.Î]Ø
¾¬ølQoßÁ“ÆÝ:c)Ém”½*X£åIècõJ}¯ÀßQÀïgFPàÑ-ëÍ]Ð"¹SßðLÝ0l$Î¦t40o‚Øõ-}ú|tŠ±‘$°#Bn¤¼{ìcÔ1&}Ì˜È§ŸuñyüÚ~c‘3øá8¦ÑjÏh8þ´o'#7kxRh9$|T•†•ã
CƒE¤‡*u+ò&ëˆÅ£8`Í¬¨…¾ëKu4áñîJK„š„Á•b€©!‰äcÕ‡¥­Ù†?L/zQ<Ì-á4õ^Ù¨£:sê»ŠÉ’ä‡¹ÿa ¸¹Tïý†=ys÷Ådk«EôÒŒ’;ÛI5m%qÅÖÇ8ñÁö ¥ ï‰‡u¼à¯ˆ§-áônêÌyRrÄAOFŠëqÆq›¹¾p¶; –d’±ÎF >m5à9þñŒ•¦ÙÅ—yŽU\*íTL?H4·i|k[)æ9·½Ê†|%ž\*‡Ì¿¨`šÂ2~Èª‰ê«Uùz6žžƒo=›/2‘v5Löå_ÝŠL±Š.Gš(f\­d×fš³|ôÕ%>Iª¸ä‹æËÏh3š°”åâÚ¬ïVì%´†bE-ðƒT7ÏSßîû;á…¨0¹j…ßWY¿
îâœ3kšKqÓðÁ6Ï¤à›A
úß¢“B<ÜOâ¥Ne{UI”çÙ’d¯
‚1'_	æ ¨$¡YX:ðb5µ±šx¯àBU-0„—2E_©ï¸K°bg³”Újñ­.·™‡¶	JZ6’'¥aÇ•˜¨XÃ)P©Ø)mŸ ü n²%kn…ÏªÒJ7=á¥Â4ƒ/éÀftx#ÎÌMX‹Z§¾¶4³|u™¬ÝùÀï|àÑÌÞùÀï|àw>ð9Þ}çOŒàÎ~ç×Ö\ePw>pÝëÎ®tÝùÀu®;8ûå\~ÝùÀï|àw>ð;ø<º®ËÏ5—XÝrwÌöIäVÚH%­RÎ¥DG‘­{ÙinŒY!Ý´BÓ^s§w,9qNr‡Šåe”fH]ÜT +Þ©”5Kò®dñE†"K·`Š‰Ù’aSM`‹{HÂò^´œayVì„*¡›ûÔ¾°°îèuJå”„VÖšr¡ýc´(W%“\“hÁôÀÚ8q&ž<î½°2X<ãsARh¬Æ··¡qQ?ÇóNþð#á«êD	ž¥¡ïO)+ñ¥¯¿=èdlù´&,Þåƒ-$‘­4	4bº$ÚƒŽÂØ¦’Ts*}ä•ú¼Ê8òRg„~ÜèS6›Rz¼”™¤ž“BuÇ”ñ(¿ëTh˜Ð+‡v êY$Ë_åùKËË¼ñÆgŠÄÞvŒË)À.tu’.7Zµˆ¶§ÔsÏèDV§ã©u\¹ºf PVßáª™‹9¼ÃÍ¯(õD#ÊŒ+4í4Ü=©xÈU¡ßç(1U|þÁ¼˜uƒÁcD¯–fÊâ#-'crÄJ¹TT‹y\›)æQ=ÎQ]%S§R=«@Ê5;5±y›dó1ìÛolè_GÌi¤Óáitsˆ³¥ßfRèH¤GèZI¦ÊQ'¹9^VÕêq©æ™[Ÿwž9Å%ån¢ûKßñµv˜x*7ø-=…y’à-º•®D/õr¼¨r£j˜!¹,|Ø†¬›aHqv-z!ï2s]¦=³”#aÆ*s$ü6Î‘ø–sdøV_÷]ÓºZºcO=öÄ£[òt‚èJÞ´Gã‰k2ûWÓ¯=ëGÛ³ÔÍ1½5€´¼«qÖ «ÍÖ2ylœ–Zw)ÉAÏ¯¯El°s…k‘·LT(™íÕø$´=áÑE”’Ž	©o*ºQt™æ0k…{B6óz²´Ehã”–>L¶ÄŠbÌmØ3F}ËQªêVþúÔƒ£¶„ÅÓ^µiò¬á&¦{ÑA5×¹W²·WÐo&«Ú!ihÖâ„ÜÁnša)#÷¼Ü¹îÜs~sä^—Ÿü3ô³g{dÎDji²CfÌG]vÜ¡/½…þÿ9Ÿ øÃO ÞÇ@•S€.ùÂ³M5g¿º»¿—¢þÚ©áøÖyügñùW_Òû.3ì¬_zg&/¿Ž6R´5s2Ós„] õPŽD•yÏ"†ãY†9E§,"j]gl›í•±|.ÔŠé'*‡*³*fÇ*¾#G:õÀ$ÁG;ŽwjY>º4‚ÉcÅgáÉ3œ ÚWX¨hHÓn)MHÙÃ¶©ÀÔ_´ÛÔž
‹ÒNiQZõÚ6YÂB“˜‚•´ íú€8j?SYãGUñs¹HXb±þ8-ÄkY)ß1ÅRfÊëf¬ R¬S
®Q¼Hã®ËÎX4ë h9ôVTR¤j*CCoTÁej~ßV°hk­jêxV ãúÖû0D¤7Io)ÑÂ¯–jŠfH¯?p]‡`_Ò³Ø™ÎÊã¡¨-·ßÁ|æ¡ä 0Ÿ¯]CßC™ŒçæéÅèéF5û[ƒåQÕBEË¾=A=›zð0°™ø*ð&}z$…
ä´N? ÇðÌ‹N€¨^[#àCŸ|:¹1¥qõ=ìvxÃTtMºÕ	Ç¼|Áðûdñ‰KÿO0³üâ×–Iß&øF†`T‹/#4Žz…LÛgîM²C"TO”T^	+¬W 2ŒàLÇÊYZUC,Ôú2ÁÊJ?ƒ_²8{º,…¿@‹Á@ô\(üþ&¿À¥Ã/à¯ŸüW¿¿£ôw¸ÄôWàÚäW¸ìø#LübQæ"žŸ™xp¦•<#qIQJmr)ÍÚ®A
)Ž‰¬¡åa£½ˆ÷ë™6ñl1‹%”£.ôSÅ]½ºÒ€÷ÄÇÍ_Åd>Ñ×Lb,ªÔ—HY?WYËF¨(’«éïêÚ»®î®¶mªÇB=ëvmú¹Ê‚SÝœˆÝŽ¦¯™÷Ö<Ó-ó9Øó,Pg	ƒƒI5ozÛîý{¢{sÚxjsúp¬7–3ý;¢ªßOO¥}Fh{’‚U ùì³4Z5%Å“}2²Øº"‚e‰+£*¿¦Gû	¸aˆóx¡´%kRUls‹¼ê;~ýÞå>ucäž×–®^©Æ¾ŽhHrbNTêìÓ`µWÝÛÊá¶4ü~÷…5BMùw”¦¹W»õd÷Äœ8äÑÔRSáTvò—J”D±>CH·ß·€Çý³Ú+&Jî]&fójô©¸1‰ÏnFa;ýä•j?ÇöÐr'A-jìxqqi™¬6›MÕŸÆÇ‡?Wü]®HSÐåÓž{Ø$ùÕ‡pÃH[ù(0vìqZÍúî2½Q¨·K²ˆª—=ƒ·KRr[w¬+½ïÖå«Tº«|‡¬KÜ{‡¬“\qCò}œhÝhŸÏ!µ©ùwVõï—UŽ÷™·Q'«;³ºðzf5_ªŒÑÈœŠÖµˆº5æ5lyÍkŒI¢æubnðSš©ª÷åC`É–²	Zë™©Ö2¢sFDµøj9ºa’§x>löÖYëBL1{=3Ÿ·Ól³vÉ©kqq™¾â_Çh…”ËÚ;{_+æÕü8,þç~¦¯^H]žÔ›ÉÔOPn¨<å‡»;z}x¡¨‚k>?Ù#û÷?žr&æQýVe¶…Ü1½><æ	sï.óU\o¦…\òš¥;Ólî².d®»4(…÷Ý>þ<äpRW+ßÂìÊ€ëåÑÐÒ¸ãÒÌu™Œ¼TæÔ dÒ ¸3ø@ÙòC9}Êó=Þ?¥¯»ó§k8â¤÷Ñž@iÿ.×U¡…çX;úWÁ)¶†¾ÛãÝ‡dm‹=ûòøðéyöÕÁÑW‡_“'»ÇG‡?Èþ®¸µ9Ž-–‚ëØ8aøýÒúÛ:_,>+<÷*8ëŠ‡á¹?çj‹`­+ô®µBÑžé¶äøª,}{°ªT;)<ºrÎ ß™†i¹ŸÐrr˜n84¼éöÊ`µ¤GÕ î¾çŽ|×±Mê[6F†3ì¾OÜSÈ–Sµ)rîz¯×0±ÚÈ¤™¤ŒÔ±LÑÛ%±îå2ÞŸ<?”–kK¯¦ y°HƒRÕnEoWéN^ºFY‹…uFqÐSÝ¸@ÎË:Î	AÀ{Q÷k‚*ÒÒ_vX¼7°ú¯{?š`š†Ä)!Öû‘Uû‘‹O9ª>]-k©$ÂeÖQF¼3VXi†c{ˆq«*Q'eÝçlb›
Å.yÅUªæ&*¹zð¢oÕjF¿¿EF4…÷ôð¦-`–©âÑ'Iƒ–È§$ÙaÔ`XÜ•åó©õ£ú"å$ÊÕOúÛ§‰—xÙ¡ÉÕ2i.]‘ÇÐÀÄ³Êa&òå“LIÏáÎ˜‰,kÒO¯—/i•™òK3§ÜfvŸ¯˜yìwí\3Ò1PNÌø‘õ^…é”ºŸ?ñ‰*æ)êãÁ¯•üX•éo×±¼`ÏöúÎíÞ¢Ç,&CŒ‹8ðÉ¾€œ²”Ji’"¥Å&„/:ží•~Y¢)}eûØƒ"&4Du•Iâ²bÊs—¨¤ZÊfåi¸	pÕ-yQ¾gýþ¦²?%½À&~9HKªýÍ˜ö×Và¶2uù^ÍÓÝx‡$
°3¿´¨ÀNŸY}˜îmV?Uçéƒò˜µN%“³V7ÏÑ>æ¯°Ž‘×@`g]6hPò¨Õâ#Z!«Í%ò=¦Ð>kSR¢Z1Ø>
³¾9ñ¦än²ˆ‰iq“è:Ró©y
ÓB¨Ë¸;ß =N[ €Àh†EQ¾Îï0Å£‘‡ùÁe´òWD>·GMºÒ¾9¤f–;×…»‘fÊ¢ùå^Ã¤gÛ4­‘Úl—”Dƒ>X¯dò,“‡!cNŽâSÇÚ¹¼$ç¶¶È«{‰ùyE®®4Žp¥·)î‘y¦üeŒ1¯ˆ;	ÐŠ_mÒL Î”Wõ$¾ãÂ®	"n¬ºª
C/Åa•Åë«l‚Z_Ý´¿m}‹ü`÷	y´ûø1Ùÿòø‡EOJÞ£¿Íº0†ß€¶¿1'ÁôÎÛ–ð¶ÀäGÈøû09d×ŽãŽ¬9úÙBùmÞØg6ìL.¦Ñ! sŒ^P4hÈÙÄ6-<Ä³Bôà{C{Z. ¼˜ÑSÑ¿&Õœœ³Œß¬xÍáb~yòÜYNiF]IÒà ú§.µ¬ŸÕ”Qv¤q-¥Y¬@º:›°]ÒNÁì‚¥ŸZç8°°2@TÉaê]¹÷ÄHMûî[r24bk„”+¢Ý/)‚}ñàÑ~½Ù\$ŸÚÈmû)i--cS9#Á_Ë×1<¬ÑÚ%å¬§®}Zÿ¡ex°YR¡Ðn¶×±`Z€_ã»zsäÞ¢(Ÿ€çØ$³ÒèRŒs{ökš à&“Miø‚¼ƒ9á¿¯òË*êÔÕá/EÐ—¼ÌX¨µ	7ÕA$7á-ªÐQ¨#‡íIÉÏâs‹väi¶%"Ü*à–`ËR¦mÉþ‡ˆ–TD“d@
Š1’ä2©:ÌD4ó9ÝVa¥æÆ8¶ÀZîvþPµ&Ô0,*é‹Ê÷tæþÇ×ÍLÓæMªk­,õ£Œ9SFUëaª³ iZ€hU-¶@]".TküÌ",f©ös­¢b#ü&Ÿ|©Å­&¹I²§ÖFí]Ñ£žrsd‹½]7Ù2Íkîdû!íGº'ô„<:#=T Õ™D‹\BÌTg¿njæ†Á-”Âú
›\P`ƒÙÌ/p‹há¡ƒN5µoLyápeM6|Û6^¡ÅusQÜ,Ä,Ñëæ’„=ýûË+a!ŽÎ×á•,´?Qô+ ŸÐüÌì»Å%]ÌÿÜÿ*«9G¶U¹%‘ùƒc»óÓé®ã¶›³ÓIà¶SŽÈxŽïäÙw ûCyfÜÅ[@Ïš¹C¶Ÿ;?¢š@„eçnr‹9Í±ÐŸ C.CxË0;è–¦ƒrl<>§u«t|ÓÎÙèIu|y´(º¦uŽ%·Ùx²—ð®`Ž1ö-UßZ0°³ÔÇž>OIÄt$ª`EH¤Ï>f	¯ŸÛ8"‹Ux¥”x
ûS0HB:ÜT:Üß^	Õ >‡¸­Voƒ™jUØª«6B÷…B\­•Dõ‹¢/TÞÜ#Y=lhNF—'®9	ØH©>%üE1®'ÏÎd‡
VâÌ‚ng5ô—/©íi@¦¼¤ü&6IÆAQ,‰î 0s"y68tGnv¶ð L®dfËû‰v¦ló¡ƒzÖND4˜h˜úª7>~LÛœ¥55m¦@•o6ºz6Š4ú\`}Nêù›­ÐE²Y)éb0Ì²æ*;ÌJl+¢Yž0^©^¤øÀ”žkr­›µ1«©âÍ9¼¼¾n¦›LÆ¨Ã‚ÃAÔÌïE¢,~PHú4fÒ2óF…Ï9{^
i™Ø• ÔwC‰ì¹¾UOWO‰§Ø£7ÄƒU1»¬P¢Z§2¯{†?hWMÓG›Ð‰]Uâ/ù¶.·Ë ÜÔË•xªèÎ†~Öúê¦_[¤w°{LvŽvŸ~qðäàéqÑ³¾?à—oÁ7†ç¡3fòsQZSœCš©Ím™»ÑOÉÁÖbŸ WadÖ(NAº´Kç„½¥·ÂŸC“¢SÒ?|Ñ|Y€–àƒß>m~µY0j|NIl&Ë!jÚ µLÍ¹îŒ ~!ÖÎh©˜õ7,—RGðõ$pÁ@´ûpó´´ê±nèM9Z­ÅN5Ö¸ÇÄ¯<‹m^ëY¬–^™‹ ÜIÐ‘Uuë–ÀÙTÍû*À¶/Ä:	Êyk$O[	ØV%[kÜÆ‡I=ÎHmø¬ã¦š»3c¤„FÞVåœ­ÇÖÛU…±ÅMšITžE4éNµ­h£„ô‹¥2sŠIç¹; R;˜n‘N3§¼³ÚæsŠD©Ê“˜Ó*<¤¨¶ùj¦È¶ÛuJªg›íü'Îê¨6éùOœ`çmû°Ïf¸ÍâvÇ¥	³q[TB01Qõ½†\‰êê™Ò48/¾3\CÎ´÷Ã}wy‹ï¬­wÍ\äÜžÔ»Y èîÄ´×ÃZÝJ-h%ï-
BM»‘é„·R €Á3ß$»ó¸éÝî(Ïíq­ŸÔ2ü¥ëä?–%G@ñÝYh)-6Á27x³âÝsdMa3ÝÌnhOéD¦KÎÝlžÓÛÁ 7Î4Zˆî
<¢Šêž+«‚»g&áYÞ·ã}Ó[ÍÇX›dM€Ö2Ñ'ÆX5‚ÊAœ<9©<%1=câÃ{lL1s³Û?†9¬î¥ÞÐ´î¦R¨hwRr ina˜’‘¾öÜs|K&"£
ÍØ“Yk«Œ«ä/ç)•Äìƒ`ó•Šq…ù£ÛI~(MN7E:Ž¹··”3³èúÓ'yU_¥Ú©R7¸€iqÖÒIÀž—ùE«5¾PH¨®„¸Î¢ïÀ7*‚ª}#î7`ïàßÐòƒMÞÆ¼CK·x]zÏeÞ‘ógj‰¢*9îõ“S	¦øÎ·ŠÊºsÏ´$÷çh’*Ú£"Ö*(VœB(­à#Åâ°Z„˜,áU<÷TÄñŠÊ9¯”QiïwFy,ôWÖh¢‘ÑKaNCÛ+JCAòñM);ÐÜåNnrRcâøã›Vê¢é&ç<©±ÐEó*œ*dßò_ÃÚŠð¦¹Ï²jÅcc	uEêâzº¡ (áýioAkI]=ÚƒTPL¥‡Ú	ñ„|¢ªWm3"*W©š!Äå^Þ{øô«Ã/ï?;"û½?!÷É×>Û=Ú'µÏž==^R'‹
–òévÉ…ƒ#­%sÐo({|ñºDÚŸ6N=ñT²Å2píQ­ÝYÎÃç…\‚n?ñÍ2ÅYšZ°fô\Ø!\Žúƒ&Ö¢
îUÌò]Q¾OÞÛUŠ8£„ü+¢œü D­´Ótzá$é4a•¦	c-‡µtBèSåŠ>ó‘ìgá3^bâÙ±™…]¡È!—ly4£r•áWPÇN[ëmãeùH°6Rc”@ƒ¹Dèã§¤â ”·@¼æeI'µ{ž—¿n‰lÉ-È¦À6ÓG+x-G
S('°.Çp
¨ˆ?‚Z5JÁ™t°¥ž¦Ùs[çö©WE§òŒ°²»4—	1 %ÜŠ‰sLpúVŸï!‚‰ïØc–ÌÒg`…ü•_âÐ(ð÷ÞšÐ€Í-r|°»÷èàˆôàßý/Ý¯vA_yxøø0™"ö½…ðj>ßˆ¤åª¡°þ2C¼j h	EàZŽ”Z¼,üÁS#z²{½’GS3,Zh¬Qµ™~ß³F6PÚp~`ŒÂ$˜nqhœ!ucke…¾÷“‘äæ}w¸2¸ŒÛé¬·ÖW›Ýz{}£Ýílžt[«kŸ!D}ýôFpÿÔvúž;¾¾|~ÿG;ÍErU„ÿÏÒŽ?Ë><Ëç†70F92C<ÙŠžä¹çžZ¾ïê>Ëújgsmµ»Ùê´ë'æÆ:|`tög5½4GÆ©ý#XœCß1†9Oƒª(é­¾m`Œ½æ“¬5Û ©m®×›'›«ÝöFµÕ2æðäcørlø#{H¾orå`tÃ€!76¼€:~£ù8ÍÎÆæ&ÚZÞ­MsH­;:ëfž¨70†0Ò›8@MFÎC=´]Ç=›Æêºê.Ïzwµ½¹º¹ÖìÔOÖNº'Mó¤oæð<kiB{b A~îúî“=¶F„<k?Gk³¹Ñ]]kÂãÔÓf«µyºÞ?±Öçðëéç8‚F¹¾•÷=… ˜Ô¶üj²¬³Þnnn®uºëÝzw­»aœœvNO;–Âãä>Í] ––öÄM¸žlR÷Écå#òØÚ¨ØÌ5«gˆc²‡“¡HáßgÀTâÐþ0W’?ÆAb7ÉÀx¼.žß	 ËõŸ–¤YJ¯3.+QEžEœæoÈªÌƒÀ3*y/VVÈžáô'x\-šÎ9™Âô#Ì7F‚ÎUisÌ=kEA§YnyòÒ,¯­i¢,°æ<+Üvhª8b˜¢E¦ß!ñê2´)^\FfÇÇ•h3›iLy-%7Ÿ†ÿNr˜/Â–^ÊÍtÿ¢€â‰EMpªŸ&aYýüV”°Qòc%ïÓOå£‘¹dÁNø}élÖ€£©´€™kwTÊðœÚŽó<SŠ í–…yR»v&*ôÈ†¨]'ÈÔæQ<“gûA'ÿ5îšg¨QÀ$.ñÂï8)U(}eµYX×eUj‘‡êÈrSsê¦Û`Àê9þSVà&wSÅCËÁ7þÀ³G¯ëjçÇˆ?žßëÓµC}ãŠN€ï¿%V“ƒÇx™—
XåÐÊ©åy–÷ÜuìþtgaäÖÅGŠé´N¾âÃâ¯Ÿ×›ŒXÔ`ùˆ œÜ,Ä3a‚3¬«#æFÄ{Ëîõåå{ÂþâUî ç„2y%uÚñÞç{ÚUˆ¨mt5ªipTY=­DÝ£Yp8Å++Ó¢yT2Î~’YRG+)¯@ _
‰|%t¹k:(.)®…jù ^.y*æNÒ)®µZP\+¹ß©Øša‚Té°,¿’R+b¬ø©“ãÁd&*_PFÓó)’8+Kž-­'Ï–ÄúËNýYë:gŸù¦¯;¦y@qm.æVÈçøË}Ì:óp÷xïy~ôìÉ³ãÃgO3¿{o.æ±ç]dv¹oùÎíhÃA€¾c6Ÿsö4\Xý	ÚÍ,y‹e’©exu°ÉÉ	í8\HK
ZŽ}fcSq¢CìQàÃ|ƒéÅÌhg»½Ù_Ê€òÝÛšÎe7\žÈžìÙ†BV—ÊHÙ5œ±çN@¨¼¢¯i+´‘«\|{/º!m¿ŽØWíðúPÉìâ#¹QßpIx©ŠžÛàfÔà¦^ƒzÌú1]öYiO	­G7|`´V4
l5£ñõ{¤65;úF3=‡ÑãýÅóÝp µ'öHÔî6šMõØnÍJDêqÝ~`wšµ‚[,¼¡QLcÀ»Š7ë×D‚±ÀäVŠzB]ËÛ¾õæWÌè6qÅ_e²à‰ª«äÝºÙ´n<É’Tãp½ûGè«äÚhÎôó§®ð¬]Sª)Ù]Š™Ÿ+ä|¾5ïÇîÙ™eÖøU‘j˜&Í¿«½¢IêˆÅÌ.“Xyàä^RCë^RO R„É|Á…Ò’Z~ç¼´Òé1$óG»Ã±cÁ?!‘õ—¸…™Š–ÙP‚Z
¿ŽZri…´Ò·78¾§
Æ¤ä™X¬ç ?ÏŸ-|^ø	"ê îùFÐKô-µ úçžEáŽ{æÏ3¿®3ŸŒ”Ïº*^Tp”ÆÍ·A1×NÌÑ}–ÊŠYg¶xÒºç0Ãã¤œ!N·MÒ1ì°Gx–c\X*ÞõŸW"²ì¿ÿéïÉ‹Þ{ÇO^’ž@„„BÌað<Ó„Äm4äPyíþ?GÚ³%Äèó`üÿ  ÿÿì}ks×•à_¹f<&8!@¼HQ´$‡")‹Rô”=^­×jM¢Ç Óˆb¸¬J¼•h]©©|ð*Ùò¸Êã"9¶FVéƒc×nYE5`ÿÂÞsî£owßî¾‚i±S@ãöíû8çÜó>®7Øq;ŽëüÒ ´à­åb¥\­“EË³î€‹šoÑð¼¨—æg§àDaºã•eø:\Æ9ˆZ™4¬®C?jmC¨”Op5òŸ­}«G~Ir>‚Zéâ1@” #øìßÄ*³ î}ÙµÅÕ5úÚBc`†þYíq¨˜!"“iý¾M·75hŒž`Ý= “@ºko˜–V²´±þÎÚ
,YãæÜ¹vsmíýÊˆµœ&œü»q£x}cmÙ°ÇJ“š’$í4†üÕPhMXy.É—	aÒž½÷÷àOÐ/DMÎâ~ìLð)ŒàF²À 5‘»$ÕÄß1ôäŒ'À^Ÿ]8ÈC‘Bï *Ži»Ny0‘¶›HšG×XùÇÅu²µº¾²µx=n,“õÅÍ_6b|ÇŒ-³¨Jä6ÐF*%˜:kcy/`û¹Aù×ŽµOÖÝ–Õ!…w-6{m»G,ºëÐöŸÜmâøÛzˆS©xJË)¤ØíÂÅ"0ÕðeÌÞyyVrR”‡(ˆÆ+¼Õ²=°œÎj|'·ŠÕI}]ö&
ÝM*+8=tÈ„7‰¯·ÔQ¼¯¢›ä-­?bÐ+«ÞCûä>ˆì»A§š^Sm™—’ ùÀo»{¸‰lÏƒ×°—(esî"ëB¥§"ú‡¡‰fŽ~¦ÿ¶<·Oï½¢p³K¥}”mýØ¾¤OÈ~,ƒj¬mßí õ`_Å;Ù7©ø`_ûò‡nÐT4¹Œsy|
¹D×µî©lƒÖßùÀÐØ;8K<eù°X§b”¼!‹sMœ‹Ùm|§ò„—A­D@`J³”õ	¤ssû¤p9¶†fÊ‡>õ(š
‰Û-]RMÚ|*†^Af.“F‡&b} thÎÒýL‹¢”ýaÇ·ÍÎÐQì¯êŒƒŽE·
	ûvo’ÊE“/~ýâÑ¿¼xøôÅÃç/~…Ÿ¿ á»ÿŽ?¡w?e¿ü÷ÿ†¿ÿÛ‹‡?Ò[•‡¿¥·^<ü~’ò?“;;Æ–„‰ÿäpfÙã&MR=ä8%ñíöß¸~[D·GÏw¯„`[!·Xy?¦Ã½õ³ruv”?ª>¨R›…ØxE¤ÉëfZqLCŽEšÄÀ5zL´(U+RÑ¿¦N»¨ëÑÁù^<ü# éÃ{$	èïÃ­G¿¡·|Ô.»Í!Ö¦2Î`^md0»~è<.ô(¥žj
<IÊ.*Z-«bÀœøÒéá‰Š1.ÇPŽB·ÃÅ^>ŠïåR‡J»‚Ñ³=Wz9zÀná<º5¼Ó·úPÖ˜ÅQ¡k*«·Ývq‡ÊmèåAxžÂy_E1˜äÍ¯æôQ«IßU¹®cáVB¼IîSZö½W¼U­”»ÝÀÐZlÓo/À·>Ã]>žÀ.|Lºn=›zÑÜ¬V˜ÁÂAÉ™Þ-r=†OñÁàHÉl 0R)‘ë+‹Ë¹¿²„Þ”…FÛ“!@:0srågóbºÅVu
‚ó’eÆ‹-wbšºtó‚ën›æv
×œÄ7V¥©‘…<Ï€Â¹º“à}üm Ê³Ä¸ŠQÂá7Û®ÛiØÈBâ—ØWÚÕ%‰¿®ôÌ¸´«Fk¢õˆLÐÊƒ>¬’¢Ë:X­–gû¾nøO¦+`’' %(K-5KtIÌÓÅæ~ûÅÃ'/ýÊ½Þ{ñð˜+#óvµ×Ým§cÞ¦ër›}ÎlzHþ›ö÷ðµ÷ÄÞŽû¿ÙõKvkXÚnÁ+&Wºè‹ýÍà3_ûhüÒ ØLÁ¨œÁÌ|YõËwz˜yœy5èÉªqôS-¶ÿ`–LHp˜ü@„L_©ätEÍÐ[¤Û¢×CMXIR$/Q>ã!þ}Œp m§TC£Ï@y«Û ž4Ú:$©NÔA»±§TÜOmÛx`£#%ª)Âµd—)y"#>Bî\ÝóÙa4ŠcuŸB¿ÂÔ&¨vÒ5xÉt·¤I>^½èrxYàjŸ1É¨M°š¸?hº†Å¼]ÂYG)í®ÿÿ†²ÿÿÕ¼µ1ÄÈLu€üVvã±ò®“øþ¸@>Œ^Hl—±ÜCì7sÑÇ`œ´1¦è‰%K‹(} îÓ„z yuÒ²›.gãœ ´D;øT¤gèHMÑ*I‹âÖ¯¬þ¯6|þÞˆÝS*™ý€¿}Ž;ñ”)@¯ô=6f°ìÚÿoÁþ1IÎêµ¨Ëá“ez4î«ÔêÒhzN?p0§µuÓÃÂá/P
 œZP)¸cõ}­~xÞø„„7·mË „zÐÞ‹ˆQR¦‹ÖÑ&G`K«‚Í3t>üx¤R\”N¢
.Ä1'çÿn’j=O‘“{†ÀÙ{ícªfxÕÉãû!?	O â¿Â»OpÂù†rì3ÉXôÊlò¬~‡\ì—tnlO:?Mcuù¥O"t>:ã~€›r/J€´S[ìù{t<œòÜp_ö«åä	f’é§‰”8L|IÃþ‡ÞËÊjòtŸà˜š'Y°»–÷‘Ÿwè´µgL­gr‘ëKƒm·µo>”á‘cÝK;ÈT°b¨ÏÒÁ—îšKÁw‰ÒùÂTÉé5;´_¿Ì8†Ÿ˜nÞ/ùèÄVŸyLšä·–#ÃlJ|JAN%óÍpÁy‡Y_œh~æ„ã+Tg% ³·µò ±HE¡2wƒÅ¹Š=-«€fŽÃ~ÔAé$—‹,Ó=L•a8‰ÁèW(¬ûÒ­—Ó:™N\yÕ_“‡ÂeZ).IÒN˜N•X
{¼Y6UNÈÉ·|›ÜNƒŠ“—æ4t*qËæSþ4.v9¡'ÁbzD´”)b·~GëïGô\5¾á×$ÑE,Üú”©sÅœØwìö/ð¼¾á%:ð‹8%ƒö¼•Á ‚	ô¸&Ž­,a°ä—%A¹M9Q#bcíÖœ/ A65d1]‡`â|bpõ¶ÝÁÀíéùð•&±÷ó˜ŠÍÕ,™¹8¬³\©r÷ ŽI4uïgÍ,U|¡4¨ñEÂÙi ò‡¶¿C€¿—ÆHs}GH!…PŽÅ–V{wœ]§eƒí!oPMÃp®ŠÚ…ôÐðf²’¤ÛAËëWT#™HÚ"ãä¹çÆ}2£:r<Âåü*Nv²¶Cºz4¾Å®¸£[‡YwµøÇ±îæÙ Ìê3ü„/@yî:•¾Çz:²>ßÔj÷“Ñ•>c8/ÏI½PNP§òú°Þv%î#<ƒ€ËƒÂöÇ/~F»	{Þ½ç9À!…ŒQÑˆ'Å¹vôìiGë’{×VèPáÍCæå6)x˜ì£Ú&}ˆ!kÓ2“%¼CÏ?N}R]#hê™‚Z€=¤Ñq§b ßñóÎ¸?Ë!*Ù^NÅ(õ‡ûBKu;—ðù³¬’SÃ?˜F‹‘£i´NRŸe¬<¨³hôdµŸr	”Ä#heŽ8áv??«ŽÅgæ†“¡ãûÑ*#8#)ÙŽ<<ü%Õäá¥'?*mIS1,Ïu»¹G•S>Ï£¶
¡ýËÓ%Íê’ê/E—”Èã†TIÌcûÆ° Œüè0vFxt‹ƒC«#²&×qxAñ	¦!‚BpÒ:WE['Ô\M+¹Z²Ô'HÐ)ñ»vËveô[ôCæzM˜±.BêB²à7~…E’ÇËç28JK}‡?þMª8Øƒì‘ï°«Ç (>úõc‘Y5+²‰AÒo·‡èûðPøÄ,äÐU9‡²µ¾òâÑ£’^TE -C^†ÓÀ=´¥ñ£¿¾xôà/ÏÅ¬y¤ÙÇbþ™zY]’GŠDó€ÉÄß3âð'¡ú¡äàÏ’><`]üÀ:£Ä!ï<¿‚yþ]žÈAÞWv÷Kö;ÝŸUR$ el·ÍîhÔàLrÿ»s@…øc@÷@ÌÿS_EÉä—ø;ó ú»z&ïþ»ð`þ~Zª¼ž(£‡Ù:w*×0ü‘Ä] é­oØk9³Î†"gü˜A«ÐDÀ]u3ÿ,wòo\GÊö3ÿ–üµÄýœÊï È
ë›SrqU81èžÜ²glÅ™ É=6›ûøý‰ºè…g×¼<ÂÕ·Ðü/d—_p"ÿü<XÀo¸¥ðà}÷G\–<† ó»æºpÌ+Úþsý¾²Bzùÿ¡Àžo€ÆÌ\¤DïK‚AÿN!Ù^·!"iØMÏXÞ>)0Q×ívA-gOý´5ú™ªyTáÿZHDF¦Êj!v-0	Ò^ý½â—ôÓQÚóôG×Ù·°£s•}êÂeûlÞø3?Cv$Ì"°ãøyF0·TÐìap,ªÊ–?_èŽï“ÅNÇm²ïKmË3‰•ÇU?××Ÿe}=ƒµo(”0•=@³þ¾$}¢AUõS¾f5‡Á¾j¿~iþOïÇ1cØrP¬ê,¨Å}.ž‘i ï€“µÆ¹8ÅÛöœÑ÷\F‘¾”S\uwXí9ºMgÝÀkf  çíþ«¤ý‡ùž¨ê_›gV…§Ëº1šëHŠì°’K(Ëµ	HÐKÖ¬KSI°q#iÖs*¿ßé1+ï9Âž«îõ¼oHõ”Èd±¿Ò?ô©ÉÐæ‹r»ŽÊó´êXc¬58×ìg´>×ì']&ün²£g’Ž?[)Ì4ÀR¹èJ*<‰› –\Ï&t¾ˆÒ  ¿Ñ+¢” DÉc6DQÛLýÿèÅ£oÌÔÿrõ˜þõ+ì‹û}r)¬VÕÀta?Vm‚Ô« Wb³Ýü÷&PŒI£F5ä°
¥Ú¦‰0 |ÎuÅŒvÞ>ß1:ŠGY&‚°E	uŸàü™Žúžê‚˜è©¬šbþ—æ™°1ðÝbx ¯bÂaø™|Í‘Ö÷¯É¨ïÆ|-¢ýž³áÍA&.Ÿ’h¬§b=¿‘¦ƒûâîéxZsî”	O(áhÐaýükdi~‹ÂýsLñ9|à©wn
ÈxõY4pÅ¿t-?V=õ¹	à'd0O18rƒÔŸ8ØKÚ|œšìØ	)Í1þh¸]¤ŒìäµcyÊW6×É»«+ï‘M²u}…,¯l±òï®lâï,¾½¢Ïî?j}_øþ!H‰öŽ„l×¯%¦O.%"S­Ó)4Èêå•$k«-(¡ýÞFqicíæúr}õíëÅk«Ë+k«[ï“µÅ÷7nnÑÙ$ô™Z“.–!¼mõZ»aÝ±ÅxÉeR°È&e¥k®×]¹cCzæŒJRv	îÓ–ËöŽ5ì
©%œRx­gï‰—Â{0\¸4ðœ.Ä\²TãÚ,äj'T\€´i¢ŸÕÖTF½+ßˆÆ~†ƒQëNéëœîaV5­R©4˜Îh] )ÓÏê Š/^b/Úü˜Ùf9‹¢ÏËŸ ü øšÕ¥Ýké;ä?°îøƒñaÅÍàèý¬§)sBAP?šà76 à{V¯{6‚Ö®¸ô²Åë[~Ïêºeû˜„Šgñ+?¦vsH¶¾È@piªµû-T‡ ÑC5äÖÒAçaVå3@®(Î°ôÂ©Õì‰Ý¡rx:f(^&··Š¯À¦•zî=$n§Œ=MçÄ)\;­þ®Ÿ.OB"ÁbùB±\™2Ëþ*³™ý>Ë1U³Ç”Ÿ«³'ƒÆÙ8;ÀnÑc>Oÿ ?hz6’úˆƒ ;e:HåIgf(_á3­k7¥mr#¼z…tŒeX8™±åÕ BÒÛ)•Õ¥Ä“¬†&oö›.]îÝŒö*Ègõ­ rŒ† tr2m#S¶ù0…/K­Ã®}@…tv”¯B?ÀnâæY!Éí»t¦ B¹3œ«õÓ+ßVfÃµZújA_j³gŸ£Tæ©Y«}\FÞmË7ÓqÄ™_#!W“7Ñ]áEmùD*`¿CÍê#ÅÖäâî‚ù4À˜&§ÌÆ´ ÓW¨¶û{ObItŒßâèþÚb«E(ÑRGg0¸ñ”0‰Z>B.XfÏ_ˆ2¦©1„ˆèbÿ› ’Ô²Š¢ú±\4!>TògRô UèLIÒÐžßQ³áä0„{H[ÍæÐ³°hŠ±D8Q!ÍŒcu|²mwÜ=¨Kç0WçWô	²CÉ|›w>Ô?,¥‘cq™ ŒiY»¬VpJ·×nwÁåƒ¸®àPçáiâ.‰Õå QàÑ‘ªä©¦Në©kêÛŒÓL˜+œ»ÄqGoåùû@ÌVÊ0y»aÍwÚÔéõ‡3Xì÷9mÉ.Ä—ÇkÒ5¾cu†öe½ØiÔÛ[¢ ºKû°y™›()˜åÂ	Øed©¬†qï%e}Mï}
1v›RTÛ»¬Ûëo‘A*É¦ªæIE¡•~*`à¹b,B€]Ú-M“uÊ&¡ «¤ä0TTkJƒ+Ž{ÙVý·I¹W~7¨Åoïªå¢$Ãõ›sÂµ£Üá ]®±¢œÁŒL*¡åH[ß`xæ}*!¼Zäè·â\”I_
 •¹bäQ<ÃãÅ0*uÍ¥â÷hC¶’/Ÿ\õP²?‚EðòE²v­»´yÅ´y9	ö8ÉaH¦ŠSædñ4›h…SEv–iüÕ¢:EâGd½Ê:0“·rcì$æfy¶eFE<wÏ¿|P;Ö*J—ãDÞnç¸Xš/ÅËyšûŠƒHõ÷N‡»ÚÐ‰0v—»§zàh7§	€Þ°	só‰ë‘¦ÛÅReðÌÙ#JY¤´T@|YdiËn¶{Nª¯ZžÕõIaÝB´Ç`™õfÇ¶z¤ƒUXG+õ$iY~ÛnÅ”j}¨'%¨\ÍŒÊ¾.Èq?ÔXœ—ÜÍJG§ÝÝ6¤²‰®@Ïƒ>d°FzKÏæçJH úøZaÏžŠÐÿçá0ÀÆ¾?°»l¯lpq6$™¦uiL:3ñðªåP²Ys–w¹n#»œå;)±‡´Ó2Hñ*{ŒŽì@¸n~«døžÆ€•Éá©d|FbsæÈb<þ„³Ù=ÌÝêG;ú„u%rêY>%Wûæ‡\Ús‚—“È>%Â¥Ç)Ã•#ÒÍe\&Û¥	a„ÒòD)Ì…AM­/Í°žF~5Ëž˜;QúÌ>WÒ<ò|ëGù’Ûíw(l¥änälŒ:}ùXþ!P2‹xt<>¹ï	Ë—Ù^1úø9g'áïHPvÊ~N
ÇDŠ·ßYT–îáD…ñ¼ò«)àBíƒ¡.ÛƒúÁXû W=—¶fæqÜ„=î£1²V®³DÜŠÖç÷*~éÜœ7Àœ¯©ÊJ&8:¾:§Š8{ 9iJfõ®h'À
ožQ•"p'éà‰F^"ù0Fà*þŸ£o€¾Š‘k­Z?QÌMpù<n¼•®uçX»ÆJ”G;ˆ¾tÌ'„,rì(*@,ª*¢lEt~f•¯/mƒgZq1tðqÔf{i±¢¨Š…aÛ½c{ìV¥¶S«|À`CÑ‡-+*…Á¥9ô|×+ö]ƒûÖàñØJ‰ZäÊÂUJ³&3„/ÔþÇ¯ÿw®êÕyÊmê_×Q|‡™;·ÍX¢4Ÿ»ô^†y<Ÿ*­þx^02ÓÌo¦»wi†áÓ Ùfãü(yð[`8{Ä”ÚÒƒ©ã4?º|,½Ft‰õ‘ÏÉ=|™¹¼‡/SøÈ@ÍÝáÃ—±s|ì}¹\åÃWÇùð•Ã>|™;Õ‡¯4ûHKSŽG9µtæMÈy(,›3'¾…”ú3«év\Ï[f˜w”|šEnŠç"ÙÝÔðìg¸Ô+»­ŸiÄ_]šOZ£8ìÔ6X„ñE\Ãæà<J`Ã…q6Ôs6¤³‚¹Ù¶{¶ÝÓgÝHîoÙ„ÍB)Ž3˜"§'pÜÑå#gé¸K¨dÈšã›åw5%%˜`¼–q%$ÌxÊM2N%Æ„–Pv>fI}dF¦ÏÄº~%so¨ `4 ZÙ<ú1*N”ñÑ‚ù¥=ú«Õ´Zv×i’®C¥DÆ6,k”³ÅT”‹ú?ÄeUD„\ 2úÍ–£a¢ ÚQì›QHÖ†QE"t‘çÌ;ÔÂ	m"ÏxL5XR3nÖ0"B° $v:”Þ5Ís’ž*³Ñ$‹¤J6“ƒs$&æBN"­Z_ÀzZ^mE—'“sˆcÄ“.«™dçY"ÙÆZžl¯	ïªiú¯§dªÍ
ßläKH›4ÄŒå¨Ì&Wï¼­újŸè™ËÊ	¼°Zf/d
*óšfhÌ‘˜eV'A	
E™â>á4éÈ/¨G¬ééWÌ §Ö4q(…¾›K¼eÉŸK¸[S— ³f:-S9Æ 88|½Ê!‰aÚc>¦Ã<»sp{—k}¤ózñœDb£ª8œ™E”²˜ß¡+=~é©j.?R¹ð¶¹*<O¢R4Õ®ÛxØIæ¨JEÏ(=×ñ‘Š“>99sÏ ˆ“Ÿ“J®ÑbîÖœkDâ½‘Ûy_yuÒB™y¸*%ÙÖrÛæ•>siÝ‚ký[pE4q¾=h$äÑ*pôÎaW”)–Ò\DÔcXa„^-C0sh¦qÖ~o¸›aÎ N6ÍÑþ©È¦ù?@^U"*E=Æ$ž<ÐY*7úTšÞ s»ãØ{äúp;gºã|4„]Œ›‡qWMMüŠN.%óZÊÛã2075ëèËZÜµî÷Š·ªuÖÎö Ï´€¨nrã£vJùa?GÊTqMIãX®Y¸SŽÃ•™v<j„·)G|O¤
Wá¤Ï"ù[¹Ñb´åÍ›k<GOöÀœà×–ZÖ8"^JåóH•(Ž˜Hò‘´H,$áªÕÚ5÷ƒáï3Z©¼l@DåspÛé¡çê's1®ÿË A™þ£jr„Î''¿K˜0À¬7#¹ßvnlbÌrT)%¾ƒl×GåËB|À£÷ˆcÞîm9`ü¢Œ¿8TèÜXÙ;û¦tÏnäîŸÊG«õ0ÂR’@%5 e»Òý÷£!æF}q…^žóé¼t>{b–ÇsGyÕqI.Æ..¹A•Îõ]ÊîÎH¾wµ™û|Ãÿtå¢¼2F¨ö,"üäw¹˜!eŽ+Ú0Ç¸¢,	LÙÑ£‚µ¨KkwªQCØÁg‚c§‹< ;»~[Yœò3Å—VöCÆ†6"éü0u0TzËãî£^¨/|mgáò²@piƒvšû…:<Š§Pp1Ÿ!)‘çñq	.æD$¹íÑ:Q|ŠÄÁªDärÛ	.éo„]ªnË#v(<‘”³´ŽT§$ì,’µvÄñ)KØk$8k´NCÞL1]
Žv„~Í}”gÆy”©¼áX˜#fõRL¢ƒåqVþGûé4˜+'y¥ÇŽ)h~æŽ(ºÊµSrH-Û C¼rÇ”O SÞqèq¢ÿšeÒd8ò\_š)RÒé/Þ3N§*=žðjGØÅ7ÈG>“É<™—ÎWo±HpÏ&ûîøCþaÏê ­f‹m"–ò“¹«ßšœÊª‘t%×‰Øq:´o¥TÄk4+û~Ò¥IÇÍ&ÉÊ(Ó³Rñ']Ú¢ª)wÔSt¬Çñ0>pâ0¾FsŸ_#;S‡¯]«cc9‚£uøÝí:|ì„¾FuÉ_£0-øÜ(ÒËe´$8àŠøy¬|‘çúv:c„-rpFØþ¬±F[žå·«ÇÁå{j$sSŽÖÆ•p‘ðÐHóe\+WÖÉÍjvì%ÖçåÑ´?¥YnÃÅÆ×7x]´MÁ´ÂVÛ&~ÛÝ#Û«eÈzÇê`=°£V°J<ÏÚŽÓkE
p%ÕRK¬,}‹b8”zl4”@PÆÅöÁ—žj“ßºÅ£@ö½õAò«YO-,	Îûá…¨Y™ðXG‰=PCC¸þÌ»þ€èe)Ûsm²VAF*rG” ÙÄ0Ù¦Û!~w?{pèçÔàÐë×3cP îDC	bPÆUH#Ák>1¹@Š/´?Ðg—25V¹G¢@¤}ã×Xpë53$]j‡ñì°ºþI±ÛÆ± úõV,¼t	a'Gpª¶ß°·N‡ùá)ãÅši×Ž¡GÙÐ²•Ë#¹‚}ÎË0#°…§Y(«>ÌJDÿ¯G,3­KMù/}­ÁªV¥þ“Z…šÄ‹}¦üþQJ¼>—i0e!Ð3tŸÂ‚Ó¤B8eÕH×êQ!rÀÑ9PÐÜ¨l”Šî:PáÕŸæB´ÓµñL§7 r§…Ï)‹àÛlS±Ì,²d\Õ5õF9,€(kgOA#š”#,:uQ?R¬hù H~Åp ã¢G"7bªë”¥®Ó@Ò¨Ì—xk–ä@‡‡Ñ(=Y:ýQýi<™PuýŸ\5ŠÏ4pÉ„¥7)ml-n­6¶V—(;xs}}qó}²I¹Â¼<@¬ŠW·¥TñªáÞfWÔŽ%
Î:«F§êÁË¤<Mtm(B¶ð-l.;™GN?øK7}PKíìœ8š†ÐŽ‘ò˜ÿ´ž—z‚üÐ‰ªfüüzŸ…Rï%JôHïá›3GISHçÃ8
i`'»œ‡?¶0i9W!ûHÐunPS©á‘ŸËŒ ¼ÃÌžY¼ú(q‘§S©léìºQù×1UÿáXu	$ç–å½j¸ú•8ÿþËúý(x¾  ÀßxÞV%N›Á7´nA¾©¢LÏËÂ\U=`¹œTÇ	X¶slÍÄÖtG×˜¿ëøQµÑvìNëUCÔ¨ÀöXQ¯¸‚ÓjïŽ³ët¬ë½,¬TmfÇåÓÆ4ÉdÅ·®¯Ðÿ6WVÈúâ?¬ ON–7—d†4V–¶V7n4ÈæÊºIZY&WßÇn6V6Î­‡jîšrë?Ã”*%*`Ü\^¹±ÅôÎïl®4àKãúÊÊý¶J?¿wQãœíq4B–¾&¬¿Œè(G l9K–˜fFÜ–‚z<eƒ¡gtœ_ tí‚j!Ë½È4‘‡ö_s:öí^#–Û¹rØ©rç÷ñ»Z:ùèQ)[îHTÁ1¢ú$ŠR(!‹æªÑ¶mTæë1Îš¡—œÄåR"xÄèLUæ3¦?‰œI‘5”‘±8p Ìü{ÿž·å®KÏ¹Vót6ú¼÷>PJñðLDÏÕpéõÎô=dƒcÝ?æÅùŸÊ ÃO•gáîçBïù-íŸ±ú.¬Z(SÎ~+uItŠì‡oxÎ¤Øh4ðÆæð9ç³ûÁÓ Óu±2!’áNBÚ$»gc)dP³2}-rAöi‘–åtöÃjÚ&¥d„ifñ	«çïATôààj\žô„ÉÍP'j?H¶„™–Ì¬ÄFøÔ)O¾¢&í£É^åjõ§“<(„*5þìÔ|?¬–ŽÁúNA–?3 Ue>†Ÿiºó²N[˜à™,ÁîD¥¢ ‘Üâ»¯!€’Ùº`õübb¿ÑÚGIcÆö€â2{ñì
 ÒÓ]'0\õíBUèJÞ’ññµŠpÉÅ‰+üÃÑ‹ a?•²è±R>‘¢>FMOZ‡t3D„Õ3œæÈ˜V†,¹$ì—„¸|Ç€º¡žÏ‘×èŠâZ›žÑôôÞ§È&>ßiïûN“•üÃ‘;\·tpÖ ;U¾¹ã•ÞnÇñÛWø‡#wx•‚lÇš¸Âþ=%tkÌEÌ#*FŠ‚˜™![ž³»KñîdMßñltœYw[VÇ´‹†<-Åaß%`(›J‘ÔÃÄýîžO&*5IZÁUÁ¨sæFÖ…Á¬YÃh¬ÈeÙE‰R •:>\Ý_m&‘½.bób‡·/*/7ôž¿¹Ð;Íã B•š°#SŸMbwèdú&ºî7,0‘«Ó‡5Ã­ŽíôéùurÏ'JiÖ/Y‘+öÑo˜˜õþþÒ¢l1[*.s‰gÏéµÜ=øÕØ‹œ?‚Ï/¡A+#OqM©”Ì‚³U+GÁ‹JZD]Fºƒb=ûÐ2"Zˆü¶7ºò)Ù$ÕóÊ@ÚFxbÄIÑ
mr¦<êkS×oÐÔ‚Fßw Smßsïî_ÐK]D‡lÈ k_8bö›€1¦ëNëòD]3á\ÔuZ-Û(În¤3…Ñlò}‹ra!¢ýÏCÛÛg²®ë&K;Î]»59j¯o­¯q‚n†ð”®¹˜XŒ-ý MQl·hX6m«9àçLÅ9¦ÐÑœ8‘ÁßrZÿ5{{>0£z”)Íø
€ðj‰Ù 67nn­Þ #ËÖæê?J#Äúâð„?·Aœ
D²ËÆø,z—ŒÓoø*ÙuÜÅ³„þ{žØÉR˜òØ†WÐÄ ‹NºyZ³¢#Ü8ö\m(þ-œæ–¹%OB•ÐÙE:¾€×ËgLy*S<ö…ÙÞÚ_18¡­ñÞþðJåŽ¨Ð@ò40‚Œ×°Éd*t·›F×kúOõDÜý}²Û”÷eE…ºpc·pê.‘_Úv_©¹0Ä
]-ÒbîàôùýS§ú7PüC®Ðv±6Gd9},' `~ÊªM&äÁ„éÁ½iâ ‹cšãçŒ¶ÃØQë	‘gy>Â	¢RyÍÚO	‡ÄXp¯ä3U]?¥ƒŒx‘žëu­x• ôr¾#Çñ`ZØRçŽ†Ä°l^\MK©ùv±t¬qyu=Œ93Gk”V…hÓ})Cý ¨%R=^¢å†+‚÷è¿{>e©}g·g·Ì*¯àB˜æn50=KÊ°Pôãú‘tN¼“<
'Ý{§´£É£V:²¶ƒ³šsjü‹Â~žë;¢ÈÅß nÑ„±r¾Á5²
{:^E‡¹¨X+‘­•Å¥ë+›dyµAÅÄ«7ÁýŽ,]_ÜÜ"3LŽ\¾¹õ>¿s.4ž
¡1Ésx|"£Î5øôŒ-é‚7…Ô’©‰èIÑášÕvû½— ^òµ27·§ÅÆr10"û˜16hlàT“iŸ±Åúíy,é¨ð,DÏ þSßDš(\FcsCX ²ŽWF\Ç^Ê¸1w‡X×´89Ð@;ÂÛÎ\rL†¸T˜„¬\Œ¥`a}x
}ÂN¡`¨8Ñ£XØ—X˜Oè“Ó+‹éå¬^£=‹¢RiRŒA®´Òœj•xvùR„ºIK.©Gßç¹n7¿„›/‘O®º'R2n	ÉØ¸
ÆqˆÅ±x³&G	ý\ÿÈ#QØQ¢rÎEáDaCG“„YyaÍ[§tC9Q1XðÒŠÌnÍÁÈ›#ÝIÔè/cëÀóK²Ú'/
›†­-¿cq}u‰P×!¼ëÚÆæ:YßX¾¹¶Ò 7o,S9bÕ‚|cãX«T#ÖxH7õ6¨€CÜ$oH£p~I^­§>7–zê#HîG­’>¢°9‚¼%£Â0ÀÓ4
áoQ[ü§8¾,¶dl8ˆ	\qDDàøq—Eç,ø2;åÌí•ê>Ä\<Tã}b¶F,ƒþ;²q_oÓdËþñîšÅï÷m×AÑËé1zåwÜË(×¤ÔÝÅ¼K ¯ÍÌ}" gì¥ÑsãL„¦Ty6ºÐæÛ]'îq=’zLJp¦*¯˜‡?ŽãL	ðŽîïwb~®_öë'[56§wÿ%§×šºö³\è0!S‡ô>e3ì6®í]ž°K»%rÝÙ^¼·)1_³¶M»âQ={SÈ3-Š†è¢	n„z”IÄ¤T*Á·iÂß²@ÂÁäÐTæÑrpPMŽ%õ
”	‘<J@Y
ßfR`¶ÎfÌ•±šð´a–¡R6B¢ìãÇ(Ê†(Ö/´0gø9Àuv@ïÌÄÒn8]Ê‘Q®à´!•òîâ:)’r>¾³~4ì·§cÆxÅ9ö°ëìbOjâƒÀ}08?®#½éºÝÓŽS0FR-èoØ¥G$Ô|/"Á+Î‰]gKq‹)ßõì;dZþü†yp[bä˜ÌÏñ'¡×ûAJÈ,|äý_ÒøcY…<¤_cz¿ŽÁØM^Ð– zïÐÑ’ð6ð_3!c¹ãÇ;&K!‰|ø{L—)Ö›CÏ³{žú0N¬¾xr|óB@Å[ ·èÃÊÈ§	RŒ0DM§µ@no_? ¶¾Ôs÷
S‡·Éá†o<4-paÖNSLÊBMÝ"¯'É¹Ìz.<)îHÅ¦â”Öt—¤ l^;¨•³Öã”&5LžqHãi<…ñsìl™ägaÅÐ+Á|Ñq“ÃfÓöýuWG®BUF¡R5°ßc–¡g‘òn=lÈ	ªDˆ‡}-àR8ùlhp*îKX4¦it‚ BÐ¾
2ztÆ““SÓ¤V.—Û4ŽLŠº‡VÊñh¥tó˜6ý,pYÙÓÇc3ñæd• ¿dIš>Ö[£ƒ7Ê¥?n¯Íª´ìHçMpÑ\\[ÛXZDÿÍsëÎÉ[w¢Žq—6­§ƒbi@Oé‚¨äEwÄ³næI³Ü<ÕßËƒÒ÷/”I.î‡xŸQïT?BÍ¢w:,ÎXFï1ƒú% ª‹
”± mvv„ëÞ¹e'ëùq+4(¦OÁ¦f]è´Ž»–W“+yS Ö¾2å˜â=7ªho.0!d¨óJ·%¾¨¤åîÛ6/<fÃÍ+pY^\ÞHÆ'óZŒ3UÔ9ÜsK-„(+Õdäé¦e±µXíL¹boÉ%ÏíØ Fø1~Å¡y™\ã—Ú$[Jäç"I¶d"j£$[£dÓ2ög~Òá}±¨?]²/‹ˆýô©¥¶ëúvè¥?æÍ'u úÓ¯y½‡ƒy
bN*&^	>æŸ©ö.O^¬³«dÿIÖIŒî8ÍÖIy~ŒÁ4©¡ÐçvIÝut 'R†ªž
ø×ÛVEÈÉÙ²¯ÔÊÕ# ÒŒ+©ˆtnY	®³iYÑñìÂ´¢Ç'`WùZœW‡ócz4|.þÍ 3uÈ$Ó§«F,Á[£#cÀïÑÂr]xT¼lÍ–Zjøh6ÖÇÙ´Ò°±vžÜH³|š4\ßÂSã8j H¢U&I„ÆÔ9XHâõ8›”Ï€#©¹éîå6Å¨‚j‹*˜š?v
¬/Æ‘×z³‹VQ—b|y[èéö#¦ag×ö"ü#1IÒòÄüç1¼°§^®Ý%
š€îSW“³í7TŒç4Â4ImƒUç1'Ï/ê#áò)sˆQÝ,§%Ä=SH îæ²„Œ–,Ý²ÝkZ}ÈébfObj’QT“/TW}¹íîa”æÔ<ÏS‡YL`æp¸ÅtÄ±È<GSò8 ™1ŒJ$'‡S…)íOZ‘â’f´aìÞœºáö–µÍ¾(–ƒˆ“ygÆ?G²*àžl^ŸÛ‡gåš|…”)Úm(£Ó2.“[ÅÊä4é±óšãÑ·Ás“äPÊÇªÁcëNËð¡šú.(­ÎÓ<E9ÂÄõ@à	D”ìYb{`Y"·Â‹mŸ±DKê	Œ©.©ëÃž™Ï~¦}æBö3õè3sù×Ó§b]Ë`ES×£Q\ÞÙ`’Å¬‘6ŠWãO]Í~j)þÔRžÎÌVhCxø¤kXBuÈ¯ßô¨øî9Vââ`k»%ÜÔ8Š¯˜€×]ö’%£ ×±;èÆ+Á÷ÕR/pnÚÂ»z"¥½	éë1M€ó+VÜý,Ïfx‚«ç§Œ
üt–¨dÚ#¡±àýÒÀ]s÷lo‰Ê­…©’g£º¨0Éº§ûC9µ=Q»Iä¡lpáW•äA0¦·`se‘£/-9½fgHYþBxÞS ‡†oMc½$!i{–Ú6å9š1ˆJ™o§B
¿Y#¶Qøi¤´Í1l.i«0K	khyé÷ðXuÝƒÄ£ÇËëV;6ˆ¬€Œ3Ä·î`@§ôï‚˜þD¼lãÓà%Äqq•¶¦‹U ¤S•—`1V …OŠjÊ.ñ4?ËöŽ5ì$–G@•ˆ²À2‚¦*¸Å]•øB'k¬FÖPébsõÙ‚yÌ¥šà!Kë›¬òûvÓÙ¡²öQÅ¯€€¤Hvij'?$VÓn9À™‹Ík%¯•›˜—R^“4%4Œxm–+ø­‰H¥½’Ãèntt+’µ¥RÉKÖ0mEFÒZï‡ï'·å±ä¶B/€ï „“7fS´üi¦‰ÁkòsÌ±5x öäÖL´µHŸMÁÎK¶Õ‡TX7yZfAP…’Ýë±©¤¨£ÌÔ)f™Ï™¼ŒiÔ áž$ªWèÝ±Šáï±@½‰†%äÞ
äOæ¥V.‰È˜Q÷N"*óRDêÙIÕq¥¿c÷>OZàà1F…“‘ø:ì>òZˆ3EÉH6b!Æ¾¤`;¼4§ç9šë¯<hž‚Œ‰dú–4ïqXúÀŒN,¶ZQ*1¡#LÛ…‘"GqeÌÐS:O6uqr‡µ´¸D™×:™ŠèmJ=6mê“·‹À)k[Ñ›!Ü =®þ=‘¦û…ÉÆ°GÆ¨=`…a×|ï[ü´á&O>˜M R®¤<²a<
=ºIÉÍWýEd“yûMJw,JëõÌµFÁžDõŠ÷À˜&õ$}üaŠ~±ê0ã«î- ³‚»“©o•?H¶ný€¥34
“,å¾)\Bë}c ”Uà[ø”7UÃÁaÓC¿Œ\€6ð¼T³÷|Ù†°ÃÈ® øÞ®’©„ÝHÙsh×;Ž×àÛÂ„ñ•Ìíÿ\ÚäYéÏDqv…®ÒÂ—ç‚1v”'x÷_þIñ3¤ì÷d–¶¯ÞºMéòíEÏ&ûîN–Ø³zÓÒÂåA=£Û<¿r¸êèÞº"QfŠ=ª~
%Ÿ×èÒQl1;ZÙjYpÿ¤oýš›†‹‰ÕeËžf­L¸­“[q*NŠøš›ÜóGRH¾þ™„s;Çaï8H?ô>&z’Ê ­õ5rÃ8M›gëgê!/ƒÂ`[‘Ÿ—”ù)ÕôÞÃŠ˜´=/éöíè4™üp›ÂçGISF5ÒÃTªö#C¼l,§C¡ØwXÔÀ &1:Š˜”ª …ÎÐ‘ê²ú’·Hï
ÁÏAlBÈ.eú)ëþ¨$eáe¢4¨}E`/z/æ6õ¨(\§žŠNÒ{ŸÌÓ~*>¸uÅ»Ðkïù×]ØÈˆ­ Rév]xÉÖÊK‚ÚïÈ`½Réß%¾Û¡«ø³ævkÖ®¼IúL‰J«ÒÁ•õMî¶Ðqv©€Ë¡¾É|v¬®Ó¡bi×í¹èHËïïÙÎn›Åàðú&A/…ò³ú…ÙÙ¹‹oN\yý gtÁùyeªDßØ ãz¡J‘¦<9uxifÐó4fa)C+ïT.T-š¨¡´í]a	°ùËXD–ó+*âB°]ðì\ýB}~;Ò=Ë¶,;ÜÙQin©Ë¡i´¿ßUú!GF=_.+k‚¾¥¼ŸxßõúAˆÁ4Èüz„•d•nPbyfŠ¢—ÊÎìÎEe™`•æà=Ü•Æ³ZÎÐ_ 0"×Ãé¡—-_–®åí:½âÀí³vW˜2E™:ÜÈœúqÁr"JŠe» neÅ®^¬móÃœO/m\ZÓíby§µSçCæyå“‡LK |·§Jÿä:=Æ{h[(‡pI¦ÑÞcn!‘Î¶)•NY¾¶m¥¬.¬/$¬¼²±³ã4p^ [2° °qQ§R¢³Ãö©Û•îRó§Ûw½zÂd{0èû33°9~i×uw;¶ÕwüRÓíÎ4}¿úÃ¶Ë«°‰{tó~A9´7gésô?€/ØË‹åò‡.û{V?ËooÛmí“ƒ0>Oâ;(Ïä[=¿èÛž³£@W½¬ÒÊZÁëM‚xÜæðV)Í¾™á£\¢ëMÉBSÖE> ê«ÔXÆ¥!)¤3P!cÏiÚÜgËì“R&P)#s@¼WÝˆè[IË¬Ä‡T›Õ©
73Þ‹ïÑ!°ˆíwÐÙÖ”!DhlS­Ónâðú.ó^¤“NrwìÌÑQyËu;ÅŽ»ë•Gì,©U5¯œÑxNÜÍÞ†8~Eu.ÆG\ÔÑ3¹Ýœ ¢Ë&(:È°ß·½¦åÓISÑàN2Ü½riÖ`§øèè!¤ ÛëÃ%‡CGO!°ÃŠŸ9Z1f0¹ˆ	Ç¬‹Åòï£€8ÝP\ñmP¢¦Á„‹ôR`÷Ê¼<¶'_âHv·ÈRg V Ìôv·­ByÿW*ÏOe.Ðý"æPÖ¾¿É’ €•ò£˜% ^^ÝñHe‡"å®EG_-k`¾V–Ë£.††«ÒÑùk§©î¸âÕDÂ¢aìª=¿S6›;š&•¹C	†7ƒ²tÌ”-ðÔ$¼JN˜8G(Œ¥eùT€Ê?˜zäŠÍ¶ÓiI²+;†,³®XlàA:o©Qo,$í *¯hX«ôÞ“q@øéT)—ÿN.í»cõ}
/âSSªz°
#¬|-†ÕLD´a±“ÁÑˆ­K‰5™D×jõÊìl*ÆÇä“8¡¾ÈìfìæŽëðàRWöB9tJ™¡ ¾!Ögí^ëÍøauœ8»E È¬³ÍŽ3>fªÕD€`°‡ùØ>„YÁã>u÷,ÆÔgwqfTBPY%‰òìÉ
QHá½PøA†q™=ŽÊ ²½Iï>íW*Î¦Ë—fÒe›K°¤©‚ŠŒ¿¾<Y·Œ°kõÉèúdFl«3^×$ÇUP íòD:qå?~ý¿Kß´+‘î?!—}oP§é¿ÅÙ<P¯¬ôÐg£±usyåÆVƒ,-n®@áš•5¨³±±†U.+oïG^.xHÝû)Dy¶ïó—C‰ŸŽõ‘ßÞ·¦É/-¯gõÛÃŽ3M–(Š¬]··;iV\MÝ•Gœ¸kWo°$h[«ë+[‹W×VŒÂ‘Í)/–\—a¢³|‰xÿ@š'®„`(àètÁ Šâ¡ŒµÄS6Ghâ-â‘%t;q%Wâhy¤iP  á-kÐÕru.ßhM›Ó~°˜‡7wÛ2Ø•˜ž†B7yO‡S/m×Þ¡Ç„ƒlðFö„þaØÙ'•¹irL[gÖ9Tƒ7²tlAË›H¤K±Äü°FÝÍÄ•ÆÚ¥™A;w'*‡¥B%U©³~Ñõû²lí§:Rî­…V»7DuPTô1Þy6^F±°V’¤þ*¬?ômša™Ln¸¦=&«z#­Ì äÒ ‹cà6·ÏÑ#ñ6ÀèÉA0§¨rybVbhDu©c•MMŠÝE+Yð?º–7\µÄ•/=Zè_1h;>áw|Š‡ñªÔqAo›Äá-mf‚Â*cBÑ8Ïâ¾ØŠè:+š¹˜˜ß
£ö…ÍÊi­7fV6‹76¶V—VŠ@"g*åºa9Òøx„ð*ÆS¨æØ¸.&«±ïƒÞäm›ò¾èÔ-M	Üña™2òä°4Y}ÉAr±Ñ(UÒçv:TŽqw}™æu“aÈ‚?Ñs2&j2á,&eÂò†-ºx>Y‚à·uJ?;P±2È'| f6Énà7=§Ÿ‘8Nø®ô:®Îú;Ã².…ìt9üQ”·³Ê¾fHž½4“F~¨”h“Kr*ÓZþšÂÜÌ½gfì[j¼+K;R)}-hÛÈÿh™7‡>LÜ˜‹A¶“5ð8

ø¦2êw`à»8ÎñžÅ7ÜÉ„ô9J¦oŠ>â—áòA~N*SIa·'¤2Óè:15q;½½ê‹`Ø÷YmÑRžÕmÓzKqRÈAÊ7ý;KLãGW2Z@·fèý7›T
÷íÁåá`§8?ýÿþÏó‰$÷ÂŸ“[<¸õ{R @ÔÝBÜ0“É¿N}À?ÿ—^’	—Ðî5éÚµnz0ã—››«…`Ü©OÓ3ã#µ\u£ˆxÅêÂ„5‘ð4<W—Â£íáÀ.L´={gbZù£3éã·>ä°ü¡F¨ûP+Ó•è|“ÈŠœÐ««&°ö„%m”©Å³ÃÝzv×½cgt«'X<WŸ 5)?â<;>AÐH<ónCFžÐy‰ÇÈÃÁÚJÉË.ô¤ö³jâ*r¤p.Ñ·ÇË‚C²îš4érÞ§çÐ¾¡ÏrQ,ð¬N²±T’"ÁŸ’(KKêßÙg'š%í"•MvœNTn»Å§ìØGÀ²”dKÀLM;Ž½wÕ½{yÑjþ?[­Ú·P¼ƒîÖ(Š4­þå	ë„rKäö{ 
^ž¨NÖå‰õ©[Rþ·R)VÚ•¹à+©Ü©–fçƒ;ÅRõb­t¡|¡Sœ+Õ+u‚ÅÏeùó»Ú¢Nêwh3åyÖ -Öjð‘\€¿‹¢ûÁæïÖ•Ypò,wvÆes€íšYU3Û–ŸÍ•ë²;Ýî¹?*1©,Hœ9èþh–œ"È>¥¦t73?Qv®–±0ñ*Û²®Ž´ Æ±q©þ(C6üBñ1~2MDƒgxû{Ve‚®êÇ,YäØçŸ ¯z&2¬ñÞ"¹µxrµÒµLT²½ËÓ\	Ð±ïØé. s?RåÈ@ÏÊ»•Q¡Bº­…àkÕJHÝS8s*%"•ìdÙsûpìg$äJLœY>#ž}\ˆZŸCIô ê,Tiõ„CªùQ÷#U.¸)ÈÅ™
"\Ð›>ÒóâI,¸x²ß˜ë|–6j„:A [ðšBî
MÃûiØ–‚PF0¸2ó
êÓ—f!µ`-"á ÂæËe…ˆ– TÓ Åp„{Ê•s0ˆÕ°Nf	úC‰ù!ÈEææÇ/#¤94ÒhCÀËñÅ¹œ‚ð£UC5Q›EÈJ¸mR!;Ã#¯ÂÅÌ}¯Ð©ð‡J`UþL÷œp	íÇ/•î3aû¸É>¾åœêŸª¯&_D²ßì7U²ßDŠd[ãp=E1€ý1Ôó_ço›Í3Kìj%áÓðj‘;)?øô…Š_^*±ZÄã&wü=çït¼pvT$yþ$ÏWIžÏkP™Ð0ÿôÒ°ŒŸw•eŠ^lf&ÜÖ*v…£5fø&ýAFý“Š&¬nk˜39«žhñ21«Šz…q¼ëØ{¢ŠƒÈiJ…—íÓ–U°!ƒ¨ºï»Å9‰û"ÊôùôV¥¶S«ð’Jë#zPí¹êßïJ´ tkè¡vŒ­j¿ÊßŽObøÍ~ñVO¯0A VÏéÂï;VË.:©›Wo_'íbý´êí)'€šûÊ,©T­©AìG…nd™°/å
ýœ­B›	¡ZªÏÎÓ±,ÕJjUr¡t±šýÙjÀÉl³^ª_˜§#›/Uçæ©.–fë´1ålªê¤^*Ï^(Î–ÊsuzOüÏ] å">WÄçØoÅc0˜U¸f®`üe¬W£ÞIem²«)¤RätzÔx™…±ˆÁîä½íZ^K	hp{M!×N³8Qj‡iî	¼à\çR1"ƒæ.UWa¤I-òŽÕ£|n>6:bÄ“_”ûÛ1+‚˜ïBé(ò"¦±¡êÜ·j@ÂøD’8aJK(+‹gR—,>ˆ®é¢ÝŽŸ\g±ÇÜKŒç>)°ä=3D8ÆLPé;FGíyV_žõ<Š*Nùëh»M¶ìöÜ"zP!],¤i%nÅQ[”UÆ&Ó.B‡åL%f0ŽJY¼*!ßÜÑe-¾…yÌß+ÊÏï_<úl†~ÆDHhË¨ÜwHÆ6®][]Z]\@ÈæÊÛ«­Í÷Kv›âójó³²Ú<”Q7­ªa¤þã×ÿ“èX)Ré¿Ò6½Å8y}‘‘è’˜T•µŒyÿdâ@	–‹Ó"ÃqÆU;žåË¬t]ë²ÐÓˆ¬ªàJ2aPõkZ¡8ÏƒÚÝhÍ'-¿Šñ’Fµ!=ùO”E•o«zT.´«V•TÑ¤Z¬Þ)Öå×"ý~}VùJªw‚_é¿íj·Jêí¹Ô.¦tð«î|±R}w6ý‰vÅˆmæ‹“Í^ŠË„Í”–«ç²ž›8†CÜfè–!al§!Y‡>ygùåÀ)öØiƒâ{4Ò ÙI¤ö*Z±}l´!¥÷Wëë¤2w§Â%Ôr™þK,øZ¬Ý)VºÅz±Ž¾b]z³ßºôË»õ“ÂÃ/‘WúÝ«ž!SôeÄ¥JE‡
Ÿ£w[‘”­ž»GáÒÙÝ¥àwŒH™§ðH©Qc˜æÏx8=£xÆÃ™9Æ3žÏu<£?³<äÚN4yg_sb÷{4*Ë©’äƒÛ]¡J^?ˆ¿O­Ø©”çœ/ë
x"Ò¥úéÊgDxêPc‹ÈMâ#Þ `Ï”ÂëW&Û(Á.Sµåì¿	|Í”
±âž‹KrC@¼™4È%\uÕx˜¦'ÏË:ñðÍcãu)§z§2GÎùëæ§Áü$ck•´ûu€¦üD´>,=j8Ì
D[ESweØ¬Dgf5góEúèÅ0"/ÚfY×ŒgNã=†mßàÖáxª&U=©€ª'&eÆŒ´ìv5lˆŠ¯ºÔž™‡b(iÏf)lBþß­;À-'é¿¸®§1W.boÅˆg…e¦Äãâ*e…ëíR™2Çs¥‹µyú¥R+ÍÏÎ5éòÕap¥Y*WJssT®›K±¶VaÆ—z³Xº F•Z­V¬–æ.ÖùçZ©>GŸ]«•jÀ—c3‚?•*«”'ÇŽHíxàX¾}Ã…Õd<ÏT¼+ zÀ·2Wu;ºB1{ßÔœ1uCÌ[1è[ãŸôdJiÇhFOÛ³FòÆ%Í¦" =ºÎ@æ‘ÚŒ‡yb:»Ê×9¹¥ø#™*tA'ñµfOŠ•9B'8SE˜É¸ÿÔ„ö@W}ü{&@âŒà¨5pwRFæôúÃL¿§àbþÖ›±¿<ûŸ‡Žg£iÔÑŠKq‡æÏþV6¯#~Tf€ —Æç	m9iqê)ÚÙ5r^ÒA•dŒÝ˜èšàbx³‰ 8ÍžmtvQˆ;ÑsÔÙÏ7fƒÁ¥èý±ôþY…çtp™K5·D¹i2¹îŠO[CÛçß³[=ùe«MÇÃ?_£gÏ¿`†|þ =ýè'3_¿à
yýA&ðùÊ++aæª\YN{ÊëÜ÷ÔÖùˆB(WÕ‘)$„.=Æ ÈoU8ÿƒß^"áH©®ÌÎb± 'uÃNö8¥3ÇCÀ„¢td"¦dñ¼¬Û´oYU^ºOPw½ëøÀïÂVÙ¥ÝÒ´rï¬Î—Í¨)hÎ.pŸYh˜ê’éœJ|a¦¼ê¡c,x7±t}¥X)WLÏðWƒÔŒgƒ0%ò'uFp	ŒlcÂ%´×—4F¿s¼Ê¾ ¯0	)O‚vvñŠéìž¬¥’§…I­"ÏÛÙ@3í˜ÐÍØãA3a?Ç­ì‹s}]g`ŸzK¹T©®’êæH(ŽËîµxÄrÁ*óºa#UÅØº#ÝWò‚? ËÀªëKZéÞ‘DŽ¸“Z5æ¤VÓ;©…Â¬(<»
&Qýö€%Cbì·ÕkÚcùËÜ¬ËÛ¶ï>|Ž}oÑìh.ÆÌÙÿ$·(fPÓ[Ê~Àm{&¥?áß‡q+ÓÍ>XXx°Æ®®/fL{ªXÝþïÌEy¬SpåóTþ3`Ð“ÁTb]nq¹¦‚fqK<È&‚·žGF.mÃáD#@»h }m¼P‰ç¯µb–¹]ç‡ë€n?Ve€¸"£3Ÿ€$”V¹.ƒ-Q®pi¥²ËÕ…ÖÄ_W2ó ]µj°ñTy<ƒXŽçÄlˆæ)R(k-x•ÝBÈ4&««ð[µ!T·	¬R‰¬X(±E–.âH¢Äj~FŠ­ú4ê‰Ž¯ÒÛ18GÇìîÄI‡(F	G R1' ¿«Xý«<´/¼ƒa>yŽ}²_“L4ÝçbÕÔ<—
>„»!FW1FƒyåÃ¨0A	±©`šË«/dËúž‚ròp!ß%ðHêíÆÈUàÑ%‘Ï˜y%ºîVlêo‡“Ã@	ÜYùgØ$ÍØÓú@räÿŽåŒSvý±L'Ç|„D…¨÷mË;Îmçå‰Æ»†¹K`ü$°9–ŽAî¤ 9\Pë8÷V—$©¤ÖD"_wWø;i	ùfžYîá%¼ŽsÑ£…¿^f™s"P˜%0p|ŽV«èØ½ÝA›\!e£ ‡(ÆË<w‹PÊÝëYÙÝ¸0Ä{CjýˆæOFcz.$00…@,~É=!X›™yÁÝ÷cdEáö•¬‰)ÛtÎÓLV4×­™Ögã)KÀ©¢|Ô7“½b¥:qågæ%ÊRz®«e²½*ý»‰Éš,‡'3¢¨Wï§$l²Fø7ˆ0^aT5ºêõú(Ö¾±,	•³ªaèÓä‡Ÿ‘±“H#‰b!‘UéÆ»i@«j&ÝP‹ƒúé>žÈÜ›ÁyFeV1·4-«Hxå<u¶K¾EÙ!Â?©ÉœU×—bß¦	åÝí»Sù¼è(yaþs¼Ì§ŒY*V%yœ-«á)XhÌÏÅ…65cC‡g+
8º¥mH‰»nÏÕÓäz£lW«2•.¯Ò4Uê[­$Ä+T§ÉdÙ\Šs²‚fö!>á\„r\+¢”¹%–å$1;¬·-¬[e¬N~zô&´€\4˜HHyù~þw´Sáä”î–^¯Ëù(«¦–ÃÎ…”Š.fV	%m’ÖÇ(+…C½(Ù­(’‹ÌMzSqÎ%K¬ ql[ Ñ•B/²|kt"@	n4GÅÿ  ÿÿì}mo7–î_¡'jÍè­»%KÖÚ	Ù°åd?xQ»»$ÕM¿hºº-k5ìæb6»,rEvq³ÌÍÝLldf2È:_2%Ø?pÿÂå9‡¬"«È"Ù/’í¨0ã¨»‹,ÉsxxxÎóXTnèdÌ£våýÌuô3»|¹Ó~r6Q”´Åõqfƒe¤¼Þ,]*1Æø¢Y6]U3ëñµ£è®@ØpMõ)0þð"YáË8¼d×ú‡4ŠGyphŸV»ëLú‡Tè³àÁ	ÁFQ¯\°eJB*©’))mç ó®A<hGÆ¸ørÏô5ä“ó?Ídˆ†——–_ËeÎ*OWË41[že_^ÉiÌñq¼‹Wèž%†DÚ‚éàêV«líÖe£¬ZÕpÑÔ ‰¶Öác¸Z]]¼‚Ä|ô[µZ[Ú¨î.ÿ÷NµŠªk·®<^Ä¯ÚÀº·ˆÿú§k/†\!…E¥å¦)´7¢v4ˆbË7«Ì`ªNUœ¿AgÈ¿S~øÐ%ý\	¦¡ÆMU¨û½$JWEñA“hüný\ õLI ¯°õöâÒÀ6Ô–ª«µëBx«ÕËKÕ:—Ðê­uþs
”XåƒwåÊÿwcmãÎ[ï¬±ÕÇ—;«‹—ù¿ü×•öM ï\T?³êãúö*[?¨^~ÙÅzÌJÀÝÞ®nß,M^g+zîV8†˜V,šöR=¦ªùiÓˆ²:Ë¹àüÝZ6Ÿ‡úÃ˜wëh×A`‡Áf—Ÿ/+ÊŽnÆ†ÙàZcãeG‚!M±ÁÖ?¬w6Ø*ÿwñ
Û8¨®l¯qõpP]Uü×K1T«5uúÈ.þ±˜:ä³Du.ƒ~ž ›œ) qmÀ„!Ëù_Tf]òõÓg`Ù½€«ï{½ôÄó]©ž>˜ÏÆÀÀ‡n§ñdé4:tâÉÚQ"ÒûQ»ñ$rSë»Ès&¿Ív8Iˆ@ÎÓ+ÑæþLß}’g?%kG#3`Y~äTä§ÊÙß—„gþ	p'ÿ>ü?ÿ=Ä;‹CÿïÒHexö?É'bÀE#*íbzÆø;jÔçXË×Tñ§x+´¸´ÞÊ]ÏQØd»÷¢~ÄbÄ%Õ>æ»j@¦'®˜ydXÜeƒƒ8A~â%v—Ï®$bC8€>ˆØEî"Ñø\NóŸ{¼hõÜ¦Ž–¼à§¯à‰½3htÙ2Û‰÷» ©yD¼£zƒ±"²|É'µXÂ„2þƒf¯Q‘ø7 ¸š©ˆ‰ßGe.ÍeƒRW–~'On¾sqß¡å$™„WˆÝg$oÒ¬ÿûþý}³œàÅžr¡ü
ÿýãòOŸâ‡¯éà7Úcïõ6ÙÎÖöÎò½÷?¸û½›‹³\]Y…×1¢ˆˆ1Àþ*¿ÃÆ}âûLÒ{¿ ÍôIº:NûFÞøœÉâŸañç*r7Ån½HS!Ã×„m5øôÛîµ¢6 xõød¸ÞêÄ]À/hÈ#åÙÅÉi&_Glò0¶^DÂð/jÊŽ]Ôg™S¿ Å‰ìIyðÕmu£—{º¤é""×zÔÍid˜8}A.”6åì1%žÖEÒZ: tºä<QœñluÌË9ÿs8ßÉ8­4gE~dvæmKŠµ7y4_1Usë4_Eï7Ñ¸Âç_4Úí9µm7ùŒ°„£b®±J´ÉîEæ`	Öò›ùH–`uGK‡ýî¹í5†íAÅ‚øï±ÊhT
ÓviÐ;•ùyÖøêÙý+sA1‘‰Í»Ýš·b†F8u¸-©@£ Ñð_49@œ×ªäR`Ç!_ZZ:X°þ
G.ð2›L}5ûý|³ÖhÆƒãMöÞp§+²Ø–øBÏWæíp%ˆª"{àñ½_öÃ$+±ƒŸ-·¸ Ì[a»5¦AÊéknÎž‹—NÔŽ]´3	òáÂEjgØlFI²ìq~'• Q?ÿá«?‰°u´’ÿ’Šú4ŒQ9§ 4WôBµ†/Pk`Ù:fCz¿6\ô‹ÚÜ–µM’¯nt$Ë>Éâ·Âo-^:8™¥nïˆKúîjÖ•Ì’¢P?àB	/ÈÎ}è7_ù~ãeœ­%i¯ás6áŠ¼dÆšµìò2×øü•Úxÿñ–ÒUvåF9»¼n–ÊëfšK•¹ëqüž%enªª^’FØn†@¾-Y4ÅùÉ`mõhqKlÅøëÈØuY†ÆËe¦ê&&¡s«1’Bñ`åaI[ï•ðEÐÝÅ8Êx·Ô6Žå¤Ö	{,'•÷4ÀR¤nÆìf:“Ú8ÁPI®`PÍÒ§’~3…W¸÷;½°+×£gäµùŒþCÛJÒùœ¼Lš^àÊ	ià.2Ë)l+>Aÿ”yöö.¸r®sƒû¸7ä:AüqÔ Döká+fµ¾½;?Ž)µ·°€¤ÖÔþ¢|>ù)`êçœ
îžŠê5w¡zm‰F«jÖª`­ü˜CÛ—Ø³J7w³[ñæ
¸•o®€·åŒJØ|·Õùæ­žÃt¹Š†ö¾sjÂ.Aìw®QÊ5ôë´°úömú,‡ŒÎpö½Jà!Æà·½™X;q‹«un.ã!‡ÝW›oŠO´ZŠóTU;k’s—°jO’ô€´,¿ÔÂö[d¯=|´X·Qž—“ÞÎqkåŽÞ9òÅÒ5vÀßöeç=¿ÂjÕ<•ãzîäór§ºÊVjþqå â¢®°•[õ|ZÛ¾1>UWùVW³¼ª+×dE‚*jÙ'V}Ìë‚ªÝÜ>ÎcT·SËé=»zPãÒ}äƒ…q¢¯…N7_ MG¶ßÒØ9r„ðp3Z‘Æ¶ájI)û†Ò˜rðÕåƒºc´¬h0Ï°{¤¼ßßal™Hz¦O„Àíì§øácrÎ¼ä)è !ûØ€ôÄ×ˆC:†< ClÀW¥„ñ6ui°vÜ‰.Ç¹ãôÃÏ³kÿÝJkcª%¤elIâ<¾´ûa¹ª.‘º, ,P½×Žœ@Žz@ƒrèJC®p9å¥;5Õòi|u<Œÿ=™›±1{Y7:çž&¡h:^QÎtÜ)!Ù·	XMÍå(RDÒÔ,Ð@Í uìûÚJmm7â.©¼rÝô«ëéðÍŒ’r²Äµ%â¸MiÄ)¡iô‹6§N`Qàƒ,êÒ5Þ}rJ¢¶Äv¢Æ€¥þÜ×_/d«Hº}C	û¬¢õÅ¼d`Ð;è”%¾‹ŠfJ2ßÖ‰P›ÓòÕÇ×é¶S×408,ÐÑâˆ!§E¦ªF~xúõO¿R4ÇêÊ¹¢ðRõ%v#Jšý˜¸g–™ôü4Æ¯Ñ  h…ß“ÏÝR­˜ûGj[ïMEÀ6úQc:Z¢ß;J®Ô]‚‘Sò•ÆW©Ãi††Ä;Ã¸´©×XoÞm÷z}E!˜-tþ$þ[ªbæúbu‰‘KÝè÷[½£ƒ¢Hã¡RŠ.~Á-:eQNð÷TŸ`pÃ•?¾˜
Won-o$Lqþ²_±¹wz½¢–#äÕžÌ2§¿Q0¸ÑÀ\L»Íe÷ø\u(Bü9ö!qz%-OÓ+o¸\ƒhäl8R:þÕb“ý…&¯PajŠ˜žíða–óÓ>‚T€"Ã]éãÆ„nt~Ã8s·ý’>5x‰ÀÀìª"
AàïEÈ €Î¦c™ÒÿÕ“([C
þÍBÅ]éí3«ˆÌÛ„š1ºöxñ’‚jLvN9ãrjgk¬Zo¯²Õ;jé‘ïä•é4ox ÿdÞo¬~?Ç¶Lé,½-×O÷¾©Ü§‡óî4Ñ;ØëŽßÖÙ ëcµ@ÚQó íxÒ¶©°\j·$M•»Ã/•·tò8÷eåëBÓ`"ß‰“›´ì°xc‡ÅeêÎ¸ââ £–´ eX- «ÇËåŠöÌŽÇ8üRªÊ¿\o.äÚiØ¿Gq/ðLïÑdz~ ýØNƒÍü&s­~gr¯æ<&¼B’xZ¤ùötyS!·¥Á8¾à^ó ŽA:¾ã^ˆªŠ3>¾38¤Š·ªÂ¶YˆVV
ZÖ\ª &åÊ²[óÈ²³`|ü†ÆJJ>(00÷{ƒFçuÂ?95²?¸tv†y’†£
æ‘Ò´jÂ£ÙBÃ< ¡'…>E8èr èõ‹._;] hOè"¶n}bðgKNeÛQór	÷"L²åôlÙÃ×úÞ€zlnžýè«xÐ5qCœer«§HÙÙ2M“®áeÅ>•®ªmø5NsÜM§g2ØgBötÐž}ðe<ž}±½’¾‹xÎàž\`qËÊ@œ=nc„ô,<‰C³w<ÙÕ7U\C®° Ù¥“b”¶x&'/ŽfŒ(ŸÖ™~yywnäZà™{†9]N¬Ïmú¤Â|J(Ó“)t(†óLÜ=Šª3wÉ•.Ñrgfòê!!ÊCg‡?0QÞÞåuÖ„™­¹<—×lÅíý"oÙËºažUUÃ=Ñò’Feq%éJê›“ïcÌª÷´ç)½R¿ÿ/òP(z’†]Ø¥]” ƒZ~Ö(LÚžËâE)ßi´ö§ Æƒˆ>QòÐhR)i>l4i»,(ÄæØ~D!¯i(ä6œ38³£k|‡E1$Àzu'tXx©#‚”[pktãli‡mp…C›¤<äôÍÜ‚šæ‡±—Ö=éœ
'}*Îúþìgµ£ˆË7Ñ÷;íœÕ¸ÏDŠ£Òw¼ŽJ•§8Ö‰Pº§YƒjÃ«bþ½h¢x8ªoØ¡PvYÁ»aO;¤ ŒßP°îâ9\0r÷Ë‹Ù¦eÎÖ÷G„ÐâëyÖ«^H!D	ì¯žàgà}aéÀ
ÓQÓ‡ú~9A¾là•ô[øÞïàíÝíÚíN^ðêö€èv¼¢kËàÈí:ÄrciËXNý,[Û5LÚû´A¶§'µ¯F
¹—ØzˆÞ,ð·ÈÛ¥!0ÜièGÂîaüBÔœpÜn îSà6õÒWê[g°ÔLsf¿ÎqTÿ!Ï–èÒé.ù2´ð?µÊ4(jW2|6,T¡·¿±¤Æÿðû/qhrˆÑÂmÙï ¢Q£Õ„£>ãFÇ1Wýd $‹÷úÔõ2îDÆ¥ ri¦'Öå¢¤ÜÌ€@[ðÒ1_iá¬Ñ»íýC¢ìºÆÍF+êÄMDúŽ¨"÷•Z‘¿“=0¾ñ	¢Îm-Vç$Ì– £¿2ÇFf\Á´L-_fÃ]¦ž/³î.³š/syÎô°»!éðuén@ö SÍ]2÷nÜm´ŠoØ aûœ¹}s×E'³^58~ÊnÞ‰xCZ.$ïôýãÍ8,¯½ÛòvÜ„<:w(»û]”¼û—Êëé«R	ïžZ^f[vsŽ.Û°*¼¢Æ~ÄZÇ|â&ëck/c¡»T†w0L{Èrf%K\™›Q¥’;èBàŸØOYE$¬Â×KÙCç&&[1ÃæÁso(r6S]íE}­º²bk´£þ ¿mU\ˆUGAƒÏ/¤‹­/4`høû·éâñBÞôG5Mèu‚¼d2ã[¹ªð%D ´õ­Ïî;€W±#„ -€áŸm²K'jŒÞ˜ßµ¿Ñ&Û½Ùï÷úØýÃÄ‚Ðòq|„AŠM`>àÝù«ˆhFÓÓ,³Â‹I|cÓo°3,æUê1—Ï=á·ò–¹æÙnô?Rç©&¤ ¾@iÐÁ’©%.°d(X‚D+­¡ÍTBQ¯ÚKdÚS/v]ûÞ^˜'’M„ŒÕtÂCK	À?FÜá]ËÔµVPeho9b‹ÊWúŒ&@ÔÈîÉÎú	ãžq›UøÍÔ“·ïÝ¶ùª/ “}A389šeeÔeXJúD7:²Ü“"3C€Û½‘C^¶µ2+†Râ tÆê_iQ(-»*ÑÀ™¡£<Á™iÐ^IÊö2Ó«ñ žß‹ŽÝA†8Ï~âåúLŒ;\€³…F"xGÆ¢¼Ôu8*©ån‡‹¼a¬ŠÁæu×Ó¶b6¢Áz&û6_ÀÐ.…í=·ä³•“ÕWlÆ¿RµÍPz}Å¸àæ­½ñ|4·¸­ÑÃÖgXŸ¶Û_F(ê¼‘e
IÝÉ«_hj¡ò…Éá}šrx{ªDƒç×5ªï¼Ã¢¨LÑd` ë	?¾77¾Ô…V°¨•C~•_& ª¶L°±ñ«/¤í1ÁÝvñÒ‰ÞâÑE—JM=LžØ–×ð€Æ“AÑÒê£¼Ë¢é5Þ6oÊ1¶ö¸ÀÚÎ›äc!nÛVUí½
¯uÚ6i(H·Ùú”ˆÝt‹ÝŽH··é*î[;s…Æ^?sõ”¯¡pM¼Žj•„¯¥pÙÇ×'üz«={€äHáÈ ÔÍ)RˆHæÆ”rXš½øÑfæÎÿ5Þÿ­¤ÉÔ:)'õ_É¦¾ :öéX²Ñ%Ç=¬©à¸0&0qJd¸Ü¯bú–:ý$IÁG˜ô¸4áZ>XêbÇöîôŽ¢þo'ï;[çë·–øîèÑcŒ•‘åT®ŒŸÈÔûo å˜Ük8‚y~ÐPuç}ÉË	ÄŸ6ß}µŽaí(Õ›á}^Ð8Å}¢T¶îÕÕ×áF¶¡µNÑ¼uz#M:ãn+zÂŠãrÛÖüÒêº^ùE–'é3¸®ÃÆµ ï¦½D˜O…/ 2ÐÄÍÇ4/tóiÍ¿&›ÂÔ¨ºÃ¿vdi€ù^£-Æ]ëy«m³¨s
ßZ&š1»ì-8;bm*D¹ ¬P(‰B¤y}BÀˆï€9áõg  ˆø¸ÜYÁàŽz‡÷mý`i¥Ê¿®®Ë?Vñ>‹å_k¬ZM¿«ÊÛèuäs_ÑøÜ!)«a|î¯>°ówÛ —B78_KFqõdë™9`»¨C&â*j'ßVÿ£ «+´Í¦áfB^P—™qAÞ¦ý“pgˆñù‘QþÃÓáhDðà>KÍ*­sSó75¯éõË4!þ™’þÂÐ½àÙgG Áa%†®°Aïˆ¯!	×c°Jš½~ô²²¨“ÃÌ‚àd? ­ñâ	ži¸% Žt¬yú­Ø’Ád„VÁž %üóÔqGõóG™v´ÍàQÝë\†.ZÇÕaB5¤Ñ<b¨êèø‘íÎÙ¡†c¡íÝôV` ˆšÐDÈ1’MÚßÆÝf{ØŠ¤Š/.o3ú	¼¥$y—ÄÍ£]¯l_y·»qžˆ¦®Ðëéa’{J	`ZNc«<Ð^c]ß¾Áž+Ë–ˆ E@œoàX†³–Ú6ÿ•÷¡úrôôT[n8 ”È<¢Í}4bA'æ ÅËÔcÎ¿¨'_cMéNY¶$wÅ!~Ä¥Q(/˜êOªlô–üÃW™ùd’ðW¸P|‡TU›'Ü¼ªúJåÓ÷-Û/êÎ˜q+n¯¼ÐÝÛŒWåÍ„@p>¯ªt¥{‹kGåOØ4‘N˜FpÑ*hìY„)ðå™œEû[]üKKK¨éßïc÷±—sðÉ*ÇÕèò…ûÂ¿Î sCÐåÁ;æ«×B´äD­xØQû9P*}¹)ð3Ü Èh:Ëü¿°ejN@ë+^vP’¿Ýz8plã,žÄ2(Ze:q6S Òlî¬æ…”¤ï:Þ·±*YåùƒGó¯åÆ?Á=ª…“teXZ+0m1(¼4â›Žô!R{†‡›ÑØSyw·<	W>`<gÐµt@…TÃ&M5ç&€?Z?ŒD£ž½ Ž„<÷|Ð²W ÔÈí¿¯•Àß
¨rÔ±ÞÎwÑã\{’q§6GÁb5CòÇƒnòÜv†`µø¸7xi}>dqò
!“²Â9–åîÆ“k«®%*»<I§ä%Œ!›ìÐ| `™8éts6úIt»;È›F”ÂãûPÍÒ¨­ „’‚m=zÓáù7r˜yH=mÇd1+TÓÃo|<óô"iB€|#ÝÈO`µÏÖe á @„D§~o>¸¬JªWkøÂ}äÔhš˜XõÝ!ÁŠ2Zˆ+$s@< dlt1 ïH^ïêh9"’a„("RX:-ëx!g†ò#C	Â	CñOð¯ÛÜNi?S¨ßÅÆu]2|´ˆ‡i1—‚VÄšåÁ"âa… Š:Saº–/k»ÛÔ&5Úz|)[^s4åÛ¯•~ƒl÷5æ®BËÍ1x+üxM›„ûÈÇ„ÈX¶[f[½Î!×ÝÁæ´6bV¶2Œ_SÒßy—°Ù
ax>òeò_cñ‚Ùa¬ tfu?Jp¾ïwÁÕ¤Ð‚j7Q·4E^ËÌ€b=íÃ¼EXô/qqI¢NŒ"c1Ã=Lpy(iƒ'ÔÔÉe©ÑÎ^àlñeÐ3˜¸vL2œj¨â·?ÎÛu„@­/Í*LM<wZTxÕ·ª—;‹·|€†ðá¾v€EÖµxæ\äŸ]¢ìk\ø`9ƒÛ¼œ¸DÐ“mn8¢µø~·}ÌÞàŒâÝ8j»L’#hpÒV_™sh3š„‹‚Uò½8¯eßÎâtÙŽr+Û¹Ø2º©švnŠ•îè§a}‡'=/äI?—ÆÿIÒ¨á}@éÒb;ÃÎÜhs*¦Ó8–UÑïécfåúöd7/U»WGÁÞ‚ðgÞYøúú
1ƒ(øÛ ›«Á›ÏùÆÙè˜$:ÏÏ‡ãž–Wõ:|6ñCPëSla¶žÔÐ•œÊôŽ_Ÿ±YíüëYSÒ6ÚqK~1M³/ü»«×2Äö°ûÌ{L=ËùZ¦Q’æo H¬ÊïEQ+ñ;Ç	ê?÷>ì´ÖoŠ|ìcÑTÕÓYqV·â@J[×NL8Sþ‡õ'»åu½@h­ÑZH­'%³®å©¬/Ùó@Óž2i7IKÄP¶ÉZ­ñ°„H»+»6ñ	¸ˆ×y›Ä«u{èÞ_a{Äj³¸¾f‚]S/5U8$ë+ÂÝ½ÁÖo­é	/Wt(õU-WæŠ–+s 99U¶Ú†Äœÿ–ÿÁ¿â>œÌê´²R\ÙF§?øt2O<ðr<yÄÃrMüøÄñ(*ÅÀyä‡-’ÃøÕ¯t'Ô––¥ò³ÉE÷ó÷ÕÚ9Ü_ó
ö›1í¹+¯>»BÑ´’á8	Æâ!&ktc'd×TPÕ‡§]vdõ
I©Ö¯QP¨2RÎhÊUõ°ÐpÐžãIù‰‹Q&jpßŒÃd²´_Fe+ÎZy¯zœ#øø©Jõ 3³N›l¿—Û¾¨9!@M¤=k©Î÷8#©î#òiÏëÓH{.³2‚£'Ìx>“d×1RBiý}N9ŠynybQÇFÛ—~æ	 ùÄºàdOk8´4…º—Â=3Ä¿|z¨žû) ›0ùSQî	k4û=¾¶â½½ìjÖŽGíÙf€šõ”ØÓž®oqgç/Ž1,ŒànêdÞâœdŸ'h”]ÈcCpéÍ¥»!—;ÂI@o{ì†ˆ^jÉãé²ÐŸ	óüÎI9ÃÍá>é¾³y²OvG%3 9f–ÆA{³i[~EÒøä±—´èF4hÄmÑi¦_Î’ñw"ºç_êwr£nS±âÖQVEà:¡j¡ë9òAu»¯'{R2õÕYS©#ˆÒ™©Ó{Â®YŒô'mð:ÖT]‘MéÍs/}9`ôóK>‘=¨^|»9>nˆ­7+·ìáF`î²hh(›÷˜˜47Û:ˆ'Ÿ˜“ñØâØC2ñCP7=¨mÀè„°Øæ„E¦Ïàv@vrÚT4Í
0Ò³ð°QX¹)2’g[+ùòzŽNÎ^ÂÎžmØóèZ¯üiâÑR?ÂØ¼ÊœôÇÍÍÍ+_fj†~m†óXÛ¤¬5Êy¹l’z”È!žXÂ'½]Ö<+õ15"ìÕ—˜û% ²VÕ4Z|g@iŽÆ)1ÚÚ5”âdÎŽsÍ!¤e­üø˜mÏ¹­Ù™Ër‘v@1SZf‹Ï9Î„Sä®ž¦¸OJ`}.é¯c–Úòî{ÿ9‡u ‡õñbõòkJb³4–×V^Þ*‰P\å«êeC8RuY[Ákêþ·6•…UU!ª*“y\ÿW:‹—ÙŠ½
¬a­¬†ÕL‰@éEE©@^oFìP _¢kø$%Â6œãg‡’¯0!öT™¯S:$ñKýü{	™•åªÀaò2„òUþYæÿþ“8!È¹SÄÈŸ|h±oF‘Í;‚Ú†‡ŒÛxHW`Ê.Òpr¶ÜØÆ_gFŽÍ;ixèbÅ^^fï
L¹å­^§Ã»*>úQs°¸Ëð “8ýˆ5Sa1Ô$øµ±ŽQFÉ\cæî'q3ÑÖAÔ‘9†·ø¨ðh›ëoøøNÌW}üåfw¿'ômÔÝo´cøógQv²i^Hývšq¹®ÔŽ÷áü‰ÿ}{ëþÜCS0—¹#>èÆ¿òI&@’Ò~ 2)ô‹„eñõ>ÿtÃaõï¥ÄÞ/PLv‹B<.¿’¼	¦Ó¾ÇG1œG—ª¸	¼sÆX5z$5Qyæõ>×BK{ý^§ÒŽØN4¨ O‰Ö´ ·(âÃy3™Ll8µÓþþôz¼9xoNYü ½º9ìR¼PcÐ<ˆ3”ƒE1í–è¬æ®·Ûcš Z|[¸×á§=†Ž‹´²[é¨(ÉUv§ù!‚ïC}.¢êCÜ!ÖþÏS‹ƒîK¼XÅ›iÆ‘lcÁkLP†§ï¯û1d“Þûiá÷í­Ÿ[»Û¨1þ ºÃö·p·Žº|™Èu­ÎØqöˆô”ip’—L	.¸ÙºKSÂÒCøkI/•þžöTvWi“°àÆ QBÕK°™éšü¶X\œÉ›9c»YhGåv¡/lŽ¨“p–m–O2GÐCåÕd}h«ªÓü¥¥Št:—-i6Î¶*å`[*É‰³š’öæ•­ºAª6ºÁÚŒìéª ˜o7“ iì„(Øe´ðwŸ.vš÷ë=&*	¼óÁp	ý­°@ñ?2i´òJÛ8Ä”:¡:+?ŸÓ®Ò#B·ÉìŸq:¢Ë`Ÿh$Î’8½„ƒMã÷Ä·JÙÖ£¬R¢÷Ôq|æµQ9ËçMmÜ'àeÏq®ßÜñ$]7Ïd•=.#[ÏÍ3{ŠÃìçCbhŒ™àââ3Ìƒ¦àPŸî<pñ‡ãöS†'DÅ>Š¢CÂ´‚ý'.šÆ*xéÜºTY³lnZ©®{àkN¥¶æw#ÖºáqoºpøU­­3~ËF¥^·Ù:`ß¶£FŸof’ÐC{°Ùªí:Cª™ubºp|<sÊÈÂÝc/Rp©pœ¬àig‘å–±sßö)”ç÷("Ä…
	ÏÊR1ÕÒœîjùt~HkØUˆV » ‰å‚š‰	V¡[vÁr£×Þ˜T¤¨"ùq"ÖöÜDW8Û³=ÀøÌìcS°§¼±Ú’Æ¨Î*|¥Äü®zœÐâ“+\N†n3WÇdAŸý
JVn[çÝlå†•^2¬ô>F]ö·TSÜ‘¥{”¶íÀxLÛ[ õ×Æ°¡rží 6ž[0ŽºS¼ùô) / ú,÷il¶ß­^{ØénJ(¾.aœ-¹¯óµÜ9¨¹cKûqåŠ’jNtâ×ò
%º£›’ÿûóÿýÿ^|êEÿàÉz’ÓgÎSu3ü†÷¢ò1.Þ¿Öv+	l6¿ÆÇàðkç«ÚG[œ¼}Žñp%¥
#gPà9rîÙñºå\0tÐû'…þõ¥ ¬žDÓ±ñ3VÉè”Ð¦[`\¥/(çÌZvÙïþ=úòù¼ ˜ù:å˜ÕN¤é+2é«§âçö
7;^\c¬M£f¼7Å	KE,râÒÕcÝ`z³&¿#êÇHræËõ°ŸDKåøEåÙº%gÓãÙ*Ç(cðØ–ü«I3=&¾ç$Àž6 Èu;¨çÌx—+iOÌ³ŸäÈ~rzt·žD',;wnäOó	Ë;ï¾˜/îª+šÂöX$6³¥]1“¥)yo:ÂŠ†r=U^\ØùddIƒ1Hq*).~ðÃÞ$²!VáGþÈµ²—î–Îéßœ'î•Ð=…äú”í{\b¿ÙöYoHýSè¤—^’sG~0^éÑøÐ•”ªèq••y IÉè˜~2àk°90¨Û*†<|òåG›¦7’aYƒ=êH¿\ãäDÐúñ*9p€£ LºòÅhÕ™“X}ô–ü#„Øµ2xÁ_õJÐH€/
T½ÅëßJÿôo¸¥º¬º)T·žU·>…êª+Y}ð·…W±ã§¶‚­ó:¯Ü´mþ/ò¦³Šxc¹:§ðÒ¯Êò€}üÍ\bÎwt9g“ÙK!ÁÃGò¾Q%S=/?¿•þõòøt(ª¥süŒÍa ¾‰R)ðŽ_[uPû9Fþ_7çH6§J:’Ï›)qŸ‘?ïY–US¡¾~“aü Úå„ödýÙ©¸ÈIZ~SùaHýðu‰îôDƒyòI]sõ%Ÿj20Õg~™š¬ð$³Ã>@†ŒAÎaå 3¬Qe ž®…Q¼¶a
i>ÛÔ÷IS@|ð¢'òÃÜ(¡ûñcgöOD-eÊLèø²º,ÙáÈD?
±g2¸—Þürñ4Ç»œö'^ötÈ‹6éüéYìÎVñA›¦Ët¦Îë˜¬<±†œ¨¥f·¡>ö¶²T¯ÛCHò—¢5]F³«¦±×•²ZÌ® ;kFÒÞéë¯’v‘Ë|¦)øë\·ä/‹n¹ëár”WÉG•S³É}ÊòWDx	Ðë6šb±—ØúùtŒ»ö«nã}Š{²·¹ù¿õsaèoýüÜÂs^çž~M¨…ù¤{e­;ˆiß²“ŽçVõ:·êÎ­:ÇeÐ'S²è¤|ž[s–ël¬¹,szz6Ý+iÌ`~$,ô‘P²·Î-;çunÙé×„š8z¯¬}—¥—Œoåé9'ç¶žõ:·õÎm=ÇeÕ0S²øtY=·û,×iÛ}Sâ9Oa´ZWpÌâÀCm:á‹,ÈTS–ž+` šAÏ¦GV²6- ¶Uk±×mÏ;mÚqÃ¢ÆŒZ 0ªÜ¬ÊG.T”ÞQŒ­bwÍ{zéEO¦û|(ßïÙôKF^°˜‚øgKÂ£ª+Öø( Î¦J²ìIS¼“Âáîê‡rñQ¸ôÙ×JN²h£Äd¢ŠMöík%.§„ÎwZè±šãD;ñsÞàXe\#ñØ„.ª–4lv8pçb{ñPÐ¼L°®þÊµx¡Áwž\…¾ªÖ÷êUa )‘¥úú’yËù:÷ãß)}7Ä;¸~þûïþ¯ŸÈ+}ŒŒt[Nz>ÙÛW—å{€€rž©Þp™ÏÍ9ïÿ©¤þGñÙqëýd·VöÀð#mÉ F»žîÉíÆè’ò¸äM‚ô­T´uMÍ¦òh°q.ËO>9AÊxk<a»w÷sJÜÃ.ñX²}Ø;J—1‡Ò¿ºIå¶ßËXî$»	kaÃßÈÒe«DêÈúé¡ŽXÀðánòFk¿œ†ÓNÍÈ_‹%Mü»ß;‚¿:ÿQ48Š¢®Œ.;Z(ßº=dcA©L1¿¾ˆðð2zåû,É>›T§Bñ sL%«WÂk|‰ß)rr9D)ÔF_ƒÀÒøÝ mä7iýÿ‰´Ú_Ë¯ ËXr7|GGM]Õ%áÈÕTN¯µ&C@l4ˆfy¦†£:KBò ƒ7n\ŠÏµÙßÄeZ'ƒŽ“/R?GÆI"€î49 Ë–v£ËrpYó Ø¤z~§ÑRj9z"å\ÀÀâÚ/Ì¹æØ–ƒGÇg†URvH\â8/H‡&Aü¿¿ 'Ý?§¿±ŠÞ'ä7Ð¿;½ÔDÍµ¯Ð8Œ›t¨T1•¬CT5§Ó>Ò²©&ær†¯·Ûß²P•~F‹€6[pðB8¸ŽñÍœ¢‰„+yù23Iñ¡õUŠ‡Ä¡U¾"§VðË³Ô+ã`Œèj… @ÎµŠC«ä'LªXlE€j™ ðbúpî#`ÂEã2Çöó£ª}½§ˆo1El‹)âZLÓbÚÜÇVœ÷@4È—Ô^»w´H|€¥Ê×¼;ð†¹ŠÔ¦=“ú7Ru!ô·­ÛC-ûÕÁAÔð`s½:èk+•Í7¼`©Ë_ˆ!¶i,¬u¿P™X"ôOØ°„rítù96½µsçêòà`‚çÔu×kT¹)D|Ô§yS®£6ÔÕ!Õ{£5'„ž&~f­‚¦4•éûÆ››åÎ¾yU{ó,ájtë¶ÎrÔ­ÆáÈþZ÷ª}+}èÀÓ·i>¬×P“‡Ú½Š¼×êk
ŒŒc,£ªÙ‘ëªÓ'6!·.V!n¬¸õ¤^¿(Pw@ôŽÙ~ðpÃ8|]n[Í’Cyÿƒæåˆï×?|õ[Â-–åºu{G];Añ±q²E×íc½ÏòŒcÙKÅjJý*EÏ_°îzÝÈÈíùÊæÖÉî>&]OÊ.ù‡kº‹…z®¾¼†C‘žæ)ø=åèÊÙ5ÚõÔôÜE3°\´:âaÊËëê åTC¦#†N¯ÛSŒ%ï cÞZ.•ì§¬êÝÂåAË™}“V®À·	C„Ýˆ¸í³¿Iiî”zÀ[æ-íÌÒ•î¿DmG*r˜n¸>I‚j‡qQX—|{
æøn{sh"ã‰ãQ¿qø.Eöƒ'Xß!v»v,¯Â›)Ð^¸6"»µéãÙÉ½ƒgÊSé{+/`â$êÄøž©H‡¿ž\×fýr³,èö`#q¹¦¬g3Íª¹Õ&P;¦ùšá¤À•6
ìàbè
ðÝ)koù|•çÚ :Ù B®c¤Ë°Ó@ýh’bþoÚdÐ ¨sÃ ®f."Þé"Áâ‡þ¯¸hH¿ñÄB–>‰1E¢@†ø*‹C–þŠ…Î/9žhèuœÈ˜b¡é|•Å„òB¦+"!¢`Ø3Ô´=ƒ=« ¥K§ßò8´3®…Mc=H¼Jß&h„«4ÿD'å)§=`ý^¥£…ÖG<Ó¬”öö¥+rÿ²w0 û,ÇË¹í7äŽøw¨/Œì~·›é;¼2¶Ó3µ@½ÂÒÔ+M9 âTÅ7z³½õ®hu¥{!×7Zˆ¾"ÿ²…#‘’EÂ­E[Štré%Í² ’ŽSÑ¤_WÓ$	úò#rÉ˜O–³ºè¸½ª„ ´÷YL®é2Œ^èÚºÚO‹uÞOGðïE¿D÷´.¿ý!!zíW[Lòá’Ò~iòÓ’#-u&0¢Gg'2Úrf”¼#@hðþWEjî÷ÉAmÚbã_b6EŸãV¸|X¯œ3?Nd]‘K®Sv“›3©<™¨lÕ‡¬‡Zn·øÈG­Bð¡¦¯JŒ¾L1Õ´½3$é¹£‹Œû²ú“öÅ€|ÔC÷[‡;OÈ÷˜?¨Á>ÃàŠgü_Ùô{Š+`Qêîïá`• ™ÿ"R€°<…Ðg$Âõ`º…‹+Ð÷zxðÎ0""Gùè²NcÐ<€sØÁAÄ(¤ŽÏ:óO„¶p¹E¢4£o)æ]‰=ƒ>Ñ:'‹G0šatÈp9ž”ŸùM:ãñÒ ù4WçkÌœÒ¨ˆ?!Ç—´Šrº,‰_yF³%<79`ŠÜï³F5ï¯ãÞ°/§ëõÙ¢óø4ÁsV.šQ›z,¬ç
dš`§1wœ‹F‰Æ.þ,ûÕúTÃ2š¯ð6¾ÆŒ‰á£ûG4+áó/0î Š¿àúû´íœÍy—×ÿ¤ÃÎmŠ»,oôêAÝ¥‡õŒÑö¾9Š<Gøý-ŠÅï0U¦ý72ÇñyŠ  ò“Ä~.mÆ÷÷öâ&nÜ‹{ýÛjô[ì¾è\Œ&;¨[ß($Ôü.ÀPÉïÅRw|ŽŠâRéR¶¿¤7Ä¸ÏìÛR¨)†ÞÞùüLñKŸ¤\÷=np²Ã~o/Jnaò?ìsÃÃƒÛ.ÏÐû}–†-¾N³>uN:ì‹À•š«Ê:­B>ßårXÃäÖ
kùœL0Ê!÷ÐÄåUKÍ X0ñã²°ç‚IÒx”ôÚC€ôèAÖuòÚ¥£¦è»LCäºGLñ‚e~õ’tŠlìaÅHÃGsNWt@÷Å·v¶¶wØÎ€oûPB†íF?•”òÜiƒ d¦–éÍþ—\í¾Sbe¿Çç»H’6 [Ÿ3)^|Eü'?h\ƒ+¤þýTË—þ7%ÔúZçÓtëg©´ýƒ”ã¯ðß?á¿”6š£¯¤ú––éÏH”†c¥"šo´Z¸l@vWÄ§›* ¬…ñT°þòE¡9à²Ôhq½Þq•Ý¥ÜêAÔhÀ~1ŠZe™Õ%ËeéBé·Âjâ”´2óœ–8{¶zCèƒŸA,þTËdsrÕ6'?M3åi¼Ÿ
ÛIÎ72²R+UÆ_ÒH§KÖ8÷ÒÔy˜DŸPñïqñú7E¤?c¹%‚¦¦°›šåÛ 1«® gÜi´!U¥É¥1Z\ç%Ã6WñíøT?·÷1#©ÿ-Øù|-ˆ»	—ûëôÅ|>Ž££±'“õ'Ëþ¶QÂ§{kØQÅw¼¼ÌnEíCa—<óƒž|ñÚêã¯ºœ]ß^¾»m¨@vcûüÞû½ëÛw·Ù5V’;ƒþ&¸ƒî~Iè3°r_·ÏË€Þ¹9³‹øà€ÛÎüöFþß‡ÈL5,%‡íxP™Û´&·£ƒâ¼Èaƒà·»ƒJZ]uÅRŠžÛèBD6ë«Ö@înÓ”Ú¶4Y<ÿó/ã¾ëmúÏ¦õfµÛùô–Rö*^ÁîÊ¥ø<ÚåÕÀæŠDoï^:Ñ*m^:¡ž±K'ðÖ£]S£¿2ýæY…M‰¦æûñ`žÑÓ­ËÂÌºßƒYó0¿ÄíÙüª®l®¬”N2Üì=]ÂÏ•åÊß´~:¿‰ÿþMò“Êõí_ÝÝž_Ž-óŽ%ý³óÁ/Xn‚/`+`šc]ÓœÙÐB¨|iÐû ÒÊ¶¸"Ê¦6× rbÕæéÏŸ^³ÎÌ²Ú®+µÁi}×ØÊ™Ïó°ùý®ÈW]ækn‡ÏoáÝOøúÀ0/óŠý(…t1‚7Óû5±IbŒÙ“×Øƒ¹»ÇIÜLæ`¯u 7æ>ÜâF5—-€H‡ïÄ½vo¹ÙÝç}u÷ùêþ,ê‚uØéá&o§GÝfßÜ‹Úñ>dåð¿ooÝŸ{hêsG|Ð9äÖ4º·—õî›¤ƒ>•‘¬™ÅmDýÆ{)±÷“Ý‚(²›Sºgò¶TL=§°fœXrù¼JJ®'fhº²\Œ² Ä^£”æ½Þç¶ÐÒ^¿×©€Ûf'T,--i­[`ðMaf½¹ãîˆ;ä3#Ú‹»`|ôz™ mmÜô¾H’†Yr
UWª8ŽôwMù»®ü½šþ]Sî¯)÷×”ûktÿõ!7¿{ýxØOÛ>ÁoñÉsÄüb¹. a2
 h7˜ÄÜ@~2»E!Ó¨ÒŠ®±÷±_—øN¼GI{|À»Žï·r·!Ùê%C-€É¿=,Yüó¬JS¬dRE>“5`ãqü€?ûW¿bü?”ÆW+þ-¶§bKâó¨¿`ùM¼ZÉ¯`ÁoŽ•Óe„79^„qcFi™iFóšt–u?®hQrŸF!•]™F,|ÖAw&"ßMuåvç¢%”Œ“/¾•jåaµ’Ý\:Ôãëžúhs—Y­)<`Æu&«Upè,°5¥è€±ÄçÄ=¾,F¼ù˜‹P‰PDK\'Á=7¢½ßUJMb¾ê£éÿ®\Xùó‚Šª‘wd‰Òz£n+¨Ö›tiƒ\…Ü(6Ä¹Í›<ØVƒG¦0Šæp=aÍò¤†œHQf\½Œ”$È´ËÓp:ÜÞ#	¿}ƒ5}ÅÆm²r!·,’¤ØÛ‰ä,7[IáÊ_¥·"ªlëý6ô1–Jù¡Ô†B5ÀÉ+T)"%°‘qy«ö„÷ørÌ×ÀÒS®O©	Å·—Í±)Tº\ùš±U!ËKE›Ú 3ÁUÞS/xƒã*}SŸî®"¨æ6‹¦“«Ø#z1°J•dMÏôY¤WËG„8Œwy»å„ÜT&«£„aþl*±¤ðÈþN#ëd±¨Í÷öwåŠ`ÖvTÔŽÙÉ²MÁ¬‘R\>, ‹¤œ_#9wŠ–×xÃÅÇ“ì7N"Šã
ãXâ8¾@Ž%’¥“.ýUŒAY5öÙ®T2éžºpÚVg.h×[àQ6›Q’l'û&ÃÛìB‡+×/ðàós:åy!}ßÚiŠÝ];D_ FðB†,ç—l#`ËŽº`‡sh´Z¸¼ÓÛ¯ìâK¦Ê!Òê…­?7¬òó–ì*ƒÜv­Ï½•·Œ*]Þ`K	‡Ò„Ýi«…Á²¥f¿ñ6Ú‰÷/€¨/ñÝPeÞì+ÒŠ)Æ·}>Ç­Mz„}6§¯BõT~
×KAúÈìrÃ¾^ÄÄNâIœ¬‘rCÐ®	<T“‡b2›àK’M\PçÎC»b²ê%ó®ÓÕLÆØ¾›L'qª‘dEB'«"Öëæ~É±j(Ë:ÀõÌV;jôåë°ÿ§±oV6|``§Égµ8¨3ŒÔÜÜü[]Y1ûðÍ"£ú0…C¼§ƒ=«õ&ßŠ‚¢C”¿RôøB¨ñ‰…ü$5ø(Ä\ÞŠó[~æ3Ó.ªF-’Ö @-`c¥i[Ÿ…´ i7RR®Á—fˆ~¥ÄLªhAÿ^%a¦Q1èt›$§v4ž¡½ù&K?,ÅÝf{ØâšqnqnÞå‚x€ž»üÿàk?àx)«Mœ£òª2œâÁÍNÅÎÄšïé]©äNð*éÓ½ëžBM¢ñ¶z&µÁâ”.´usÕzI1‹¾ÈÕ«#1ˆÔ˜"/ÒQòB¯‹å‚"üyáw©âÁV¿SXEv¥]úŒÂC>£ÿPp5~.‚”ô5ãÓ¾úÄºÒ¤Ñ&Æ¼ºô9¹³ßf®Ä…JŸ‡“ÁÝëý"tù;Š?Ž ŠcÐc-J”ÄIºzäÊ—ÈÒ¸6‰c[=®lJvŠ÷ö©Ô1ÿâg‡šæIa7:vŒöM…@‹C2ï|68A‹‰£·àB†Å¡ð¥Ÿû%tßeó˜¾u«®Œé
ä#Ôp(i¦Ù0˜»¿X³¹Ñ$˜K¦=‹I›@9Ç0	æj+µË‹+ë‹Ußfú®bc­a¦Å*;UX­J¡Òí}%PºJ‘Ò"—¾*Ë×‘zBü%!×V?š¼eJæ&&%)éÐcòr•s[O•—ËEb5…•!ÿ’]„y¨™ejÇ´ÈRB½“Ý¼¨OŠZÓé^53/Žµsþ-¢ß@ mËz×¦ÛÜ¼»}æÃþðöq›ê)ø¶Ø2!¹¶¹\ÌåãåS)Y8%Y`r\Xb\1Rº,Éñ[Š~N“ØÜAý_*xÙÿ*ÀÐ?KëÎ¥ú<•7‡g»æ²õd†˜…	ß1FÍ˜…Žþ™RÚøuÑA£Ý¦h°nècˆãO(áÆ‘ôVÎÚU’ìæd2À@
ŒÔêÄÉ¯©ÆLŒL4ñj¡¤œ¥–‡{}nzBc«’öÄ<ûIæ¤®9=¾›~ôËalÊT/I‹S°Ç Æ)ZžÓ Æ)°h›Qj¨ûšÃD¢-¨xQøõ¾JÆœ.ö¥$:9t†™qêÌ†2ËY Êå«ð¿Ž£Fä¦*~ù¸h»ò&Û‰(ÿ5Ö@ò-â9F¬’ë©…
ô*è¢q8ºÜÑé)¦Œ’Ôõ”ûÃ¸k–õy`‡,/3È­ô-R'¢²÷!æP€ª÷öðKŠÐŒ÷Xãq#nCv ç+bmÜ
0Ç–w[ÅÈò€— ŸŒ|€;ÔÅÐmÒk +±®ë—k>ŒÎ×ËUàO •‚kúµY°ÁãZ„œØ9Ø4/™éñ±Y«“ÍZÝx¼lÖêÆãfÃêœxQ§f,HÂŠ×ØHÐYÄ*â¥!vÀT€\?y`*ˆ‚^–ƒ·í`´v|é5Ê73r
ÜÍ¼ÆëŒšÜ‰žgF	jÃGÄÊ4ÆŠ!Ê¦‹†üüVúWÈ²árëÄ!?•„8
y•’Õ?«»ù*ighîê©h¬¸{8té‚Î' KÆßÛ`àÕD^<={},å}_jRxÚxŽ†÷o²›Ýý&„¹ƒ;:¨sŽ+Ég ËV?ÄßK'»~ÈÂí´WS“#ëg—{J±§KI÷½,u"[CIOlm¤gÛ¯µ½áÇ†Á öu±O`¡”‡fªŒIe•.’©òzMåKÄnL*]2ä\¶ì×”¬Z™™Ëˆ©ð:›·´~S l]¦½ç¬‚ýA!¥ÖÔE³Ø•c‹OèJ¨Øóîœ­ØCM*óÁ,ð‡|ÂD\Ò¢¾ŸþÏ€ôÙ&S†ÿéÓž~õÃSŠ"‰–ö—XŠ`¤e¾»úújPðùŽˆÕGÜgVxœ=¡„õ<µtX&ðÜ0Ö"Ø‹Éµ;¹§'ç+¾ÈZq‡T-#´"{þ»kµƒÓ`.Às¢€¡c	‘…Æñ*AÁÔ¥„Þ¢ÿ¼²Î$
ú<D."?ràZ9@¯¨Ê‹¡„ÖÂxqÍ<ƒ2R$•<£ëà_Uë{õª€‰Wn¨bUÊ½!BQëPÜ‡;©6ÙÑEsúóø‘Xþi µÆQ³´3ñþ s,ü£(á2‡xZ[ËÆÌžÙÐödwX®Gad<˜}i€Â¨RºŸ|zBèb·šJhÊø
¨e™óÑf¯Ýë'Ó?¦°.Qˆúœ‚g°K<¶Ö>D7¥ë…c¸º±,^Ë¯¸)ˆº4î_ôGÄ¾7Ù»‚âa¼˜ÿõÓ‹ù·þ€ü–@,…aºï4ZûåNÝrúœ¤³‰÷{Gð·qxŽ¢¨‹A]¾ñ#ýÕ“þ‘Ã3ìJc3‘aº6%õpËs
àægÇ7ÚsîpË£àÇ‰ƒ³8÷g‚îƒÔEÄ1ö\üîÑs¢–ïT&ˆ|÷I,ï{ pËtG$z
°äìæR:·5jfÑ­VªGÑæ|Y¨#ÍTyŒ®,…eEe ßíhq/.S8œ|Mê42Ž´H_0Ol-¡2)íU'	ƒÃ‚Å%Õï;~Ò~7V¿ª|)g\»…d9¶"ô*€ŒzV‰‚9Êè\µ{ ÝD«–Y¤ä`ï_P¾ÿ9ýUô>™ÇÉ¥wzq¹y›1:ÁÁ´RËT§Q{ÔJÍ
Ý¬Ü˜™÷Ä¹+Ó=!×Ûí2$x(BÒ¼0¦ø;Df“> s^¾xÿL^(ñuW,† ‡n¡îœrÁ/ÏX»ŒÐ_P.o®[º%?mRõ"Â·ÌßÓûv;\)¨ŽKÛ<vNº½ÐäÞÉƒyŠàSŒþžbä÷£¾§¡í}ÌeÝ{q©³BÌfpOíµ{G‹O!§T?[w^	W‰×«¨‡2ÊE©N„þávx»qè±}¿:8ˆ-“šA_[Ïl~ŠàeM]=¢]°ÅÚæå˜Hôê*kðE–Žü„ñ‡¸öÚxcŽFoíÜ¹º<8˜ä9†ºk5ªÜ¤TM©èEÓƒTßFü,Z¸ao¡%1PKÐó )0{6]µ7´àÉRú‰¢1áxvò¶9¦Sµ¤C-Ù¿—Ì£ÏRÂÅ^×·i>„ãP“‡ø^E6qõ5¹*ãÂ·xÌÄ©üêa.
-©Û^TqÈìèÓ,n=)A+Ò/Ê@Œ“­a¿Ïû¿},ŒLd åHNæ>›w îû³ïsÚ.¢#ßBÙ@ìîs›ñÐpšqÉ§'é2ô$Ÿ§êaèòNÐôÄE2´/¯­¸Ù—éíº|àò‘I¸p…Žú€¨!ÂœÜV–¼®Zy™^Z+HµÉíÛéu{Êæµ ‰öòÎ~ÊªÞm\´}Jå¼3”%‚a*Ì4ú#àóæO‘îyei- >Kt±&Æ#;Ÿ0Ç¸Ýó¹G†•
ŽPpÊ(l¾·J‘JÜº†‡¸Ã“sL½hä½×b³ÈÀ¡^`ž¤p±˜;5»wº=XžrÖÌk*NÙ1Éÿ  ÿÿì½ýr#Éq/úÿ>E-¼+‚^Ä¿†3œ5‚3Ô’šÀìZ1šà4€&¾Œf†¢a9Â¡¸ápœ?|Ö¾á£¸¾>–f7¤=ò†N„÷ÆêU&ôçNfVUwuwUuwg­…´ »¾+++++ó—QÉÜ\W÷¹Rq{oqÚç#éò‡ˆi"°º}IIèr"F	º[U›{¦†Èán¥ÑzEúpÛ<çv×¥"Å/rçû–fXÊöÜ~W!¡$Öu «|íÛŸØÜð*ùÛÜä=—R·â«îm‘Ä`	«ÐoõªLgª"•~ƒe™Ò¶r–!Ÿ!))Š„ò Ž«l—Œ·fêPJ“<õ3›yžúñMõ8l°!ú×Sø8„Ú„SZO‡ßI‡yþµOS‡æé[[ÎV»-Už_Bïù¥o:Âß®ù&†üás¾ëïqVƒ²øL®H¹^'Á(8‰Zg™ÌYŽnY§ZŠ/ño&ÙÙ"TV:Õð‡N¯Kþ[½X4qÔÐ+Rß$¾È‹ZLZ$÷`‰¾ÕU4z®}QŠÖ¥ÿ¶,¤ÆØñ.JßØJº­>¦?iœœRx´2:é
n¼l‰’á¹ì¶¹6ÁmK
nÃÔc¬îÈý¾j§.™ð1UžJ!ý#š½§@;ÒK–_õR£}G­^uGÔìz¡0»ßy
ú!.ö)9\|Ó™»F…ÿ8ÞO1<7ñA.Xü½Lû“/ü7ÙÚ¦ rÆðÐãa8XšgÀüòøÔ¨7GLE~;´ "µ'`5ã'yQX-j)IÜrY«é;¯r/q>gÃïÆÏœ3Ê}~ãOÆ¿ûfÉ¿ö/9œoœÌØ¶p`N€Þ?å¸ï³b°Ï0Û¤é´iíC¿/‡Ó±œR6³)^UÃtÓÁ™ÛCÔÍ±Ûéz¸xP¬Dæõ†“¯ƒ÷ ¶EØÞkÕl	×ËÙeM0'²4¬O›§ÉIŸõñso‰ü—ÌÑL”ðôxÍçN¦#¼
Äòð»$åÏïë'ŸÞ
Aê§šÀil‚%c sêçúck6‰ÆÊ(ÎúÑ´tÿÕ'ãîdâŽ° ¶Ã¿ó/ÕÄÛl½ Û¼ý¢ªž®Ø~ë/e‘¥uk‘'c§5é¶œ^º‚Gáä‰Å7†“´EO‚¤ÛdMË(#ï`AbdK·Ì¾¥lÈr'H³m·ÎÃ.5rÅ¥†æj»ƒí“È/9÷üç£’Ù‰Pš-RS&¢þÒ¥ ºË,±k}ø*¿¥p#þÆ÷DÉINþ¥¬(]:½óÜ\gÜ»LÙ„r¸	sÕZ¦NOV¨©ï©e–i5Ó5çƒÉ¶¢ÝFÓ'L|ÕŸxß†ã#%SÕŸ)?×Vš\åh®Í4¹Ö¢¹6ÒäZæZ7æ²M‡à’ñ	‘êŒø¨Ú)ñs$ÌI=4'~è©„×Õ99¹¸ôº-/92#»ŽœÉEr>eNjƒN¯ë¥È£ÌÈ.ŒÓëÎ1Ä=Ýv}2mÃA'Ä_eô=ñÛlÐ#@Äå6y8|	ÝŽnžÀ˜éEÕñÜ¬áp)(„×G¹Ž1s¯ûc
(^ðý9?v	zEF!ƒ±XZZq9S/ðíµxûþÃèQ<Ê“K)êØŸöz;þ—*Þ»Òwï:ç¿‰µìúÙÌƒç×\éMRTžªíCaJï0AŠøÉO¬¢º¶åºRR£9Ë¤MaÚXozùnñ›P¿B£3n]0‡&Û¸<ELJ«¬Q[4@?lAÃí¦i›º­á¸}OF8½bBbÜfºu½Ë@Ö~øòYð¨ëUšÔ¾ÍšÃ!7ìú>Fu7„¾Ô>Œðš<ŒbÍi]$sMs:ð|$íñsAßx& úç9ðŒ3Ÿ	x6Û™ )+ïœh­$È®	+!(¦8[ •bžõa4d›ù¡OI²y±…V%jó3À/[b…ý,þ3[Æ€fý|ò‘1—9”«=€òÍÇ¯8`ÖÊ(YÓƒrî@‡æís¿ã¡]aXh‘ÒØdÕ2×<ð(g}x#ýÂÍNÆô-}dM…ÙÂÜÃ?ä°ÂZä5Æ^vA¢l¢ÊÏ_â«nÛ!¡4ìô¸ßòa•á£Ï»n41±Kì'l	¦þõ'	ÄjŒd°~Þsé|ØíS X:ÓêÒñ@+P7W¹Èê—ÕÌÅ‚¾ ¢óHiØhIR¾” ûÑ²Â
)ñY3å¶a" 3Ê×y(![Xß»ƒ¬,\Œòrzâ”‘«³¦5›8ú‰OO·-ë^”¢¤6¯Ù'4‚PœÚóç|«FìË1X7nëysø
žC#V	g2Ö…Bå¹m_¢°G8~ûç)à¬¢gæ¤>Ó)á¨QÀ;®H]Ê½…çÂ²¹<Ú’Ê‚DIå(›HRi~R{™‹%HçëñTôº$á2Uz¾ú0ë¢8mÏÐïè…ð\š~H³ÇÑí§/'žª"GÃö((*«êÏãåüà
º'¡%’I`Î®TÑC
a1"*,˜…¡QEåkŽnpš¦º}¹K’7öÌ†Ò„h}Àti|6¼P¥Y*(m÷´9:tª —ß-Œƒˆµó¦UÔE­Ux¼ïï>/:èOB©ž¢ƒ×6{v”{ï
ÝbòƒáËì²¢/Ag«gf–Æçe;:)æ4Û‘É0'ó°›Ku/”}H±YØVTâ‚JØ<f-{¶ÍdÖÒSn.Œsœm…ñ¤Ùžµ­1í_©ÎÕ=ÛNØ	„.t¦|)Í}±°ÑÔ»È{f?×Õ"ûZ6Z·ùtWiƒ˜^Ÿ¶Z®çyŒ§PÁ±Î³úþKº3ú2¦NyMiÿƒ’Áx¤ù/•¢þU8ÿN$Ã¹ß+ð¤dcòâ–-Ð"ï]!CnÌ´ôI:i+â	šx¼‹èÀùî’a<œv»2mw'‡ÃNöYJá%b¼ð÷®¢Œåše•‡*eEM'°™–YŽž†…
	p&Õü’`òÏfÑû¢@Þí»CÄmºHí\/™Æz±V(f­ž¼&DŸ­°‘†ÇäK\}U¤Æ‹‚ª{_z ÌÅ@_†'-?éÀ›o
G6*-ÙQühœ$p%ïE'…±Î.rë´Ýéíd_Ï“Ãçð²ÅŸ«è3a†¸;|µ“)À.SZƒÿ'›ßœÉ…(î°;p[Îh'CmÍ(O4ì"?A €L)ÃÚ;™£2[sŠ¬ÕŠÅ\ñ¢¸üdÅ¥üúVð$—/Ý)ç7›½ÜF~­¸Æè¯|]ð_\„klí$Sòó9LqXÆ¯lÿVdñeFÉ?^ûq¢Éê½Uì›a=¦€%-'Y'.–ôSip|§¹q÷ÀzPEçä–	ÿÄÑ".|¥û+?™´¼@dÒE¡²rË;èæ_3ùø·Ôçß12ùœ:¬T’åmï5 ŒÅ†O`‹ù;ŽÓBA„L,…&
é+|LVäÊaGFú&à¤‰¸BönEÖo‡€0{åçZ
\LÜMŠy¯LV={ãá8ýÜ¡é=Àê¢ ¬!3áÅ‚Õ­Ãð˜Yp–˜àÃ_&Y
²¨x•+@§Ëº)ÑP@V:
W2{äÃÍ	©o³Ï½Ì}¦ËéÏÄ#ÌD óôÁC€y†ø5V_’†DWŒ‰ž™X€fõpÀÍÝ¬þµ6Höÿyûà9Kù –AÈÑDü/ºÿ=ßk¿B¯Ø«³‘¡Yƒr¹]êã3tÎÅµøßqÀoŠª†´‹EöLÃEÚo!Ÿ+ç}Ø™?"þBdY1œÕS
÷·Ç¾êé€mnÈÀD-ß±°·………Ï‰‰ys01OebÞLÌûÖ2±µ<«³{><ïLZ‹kA¾ð½XX6:2Ë4üô›dw¼·Íîx-ß±»·„ÝE`ºK…ÒFæ¾\¼økN¼oÈº*h}áXß	¯ï9(ÖûÚÆf2‰öŠDâx@Í“äÐ–i0KÒc”Dbí… ì´Û˜9fD)¯P¸¸‡òúŽ@˜zÛÓ1™Ðòuc* D0'(\æžäˆ•§§ýY/ÖØEním½4B4¼6*Y©ØËmä6ú¥Üº³É6¡x´ÿò_…"þXÀUNÚ].¤ëWáÈa?+–š¤K!Ý‡&DÂJŠ„heÉEcN]oÚCßBÆÍ “ \uãû‘=ðæMîx•û]?ÎÀE·Ãg\`åØŽqî`p>dMgÌ†çL¬ Ø…9CŸMš“,f-„ˆbàã²¼;£X`Ä»HZóFíI{-žRN‡#ZRPDäíbì&<*¾
˜A©ðìcŒq¼|º3Ù+²ÉgŠ4Ù	£¹åXþ0ÿ$V>W?S±\ý¼D¥3^¤/MàÞÛóË %rñRÛ:YÙÙ”£‹ë¾ƒösþ ð_·8ñX¾>G„”*–´Ã
ë*Š‘â`¯ƒÚ)úP;Ò†%2ž&¬ÖTAD©Ú˜ŒR¥|K2ŠìêÍ$•2—SÖY±Ü[ck‡Å;l3%Z
„f‡%B`¢gqÀ/È [%‹ŽÏ¥¹Â?Jîø3°C-õÁËÊ€«ÿÀ£·n“a]È—êz…Xü†¬	ylVøû‰¤ÒYŠ’}!ƒ†|AÖ…~Ì˜OEâ°7eùAiý³H ¢\/?K5HhAÍ­iiÔôëi[¬ë´9Þú“ÀªWßÖ7É·3+H„ÆJ†‚£‚ì«šóÈB
LñÿÜKÚ?|KìÎ‹R¿ÀÖ.ò…b?·‘¿SÞ‚År~k}£UÌ¯ã)’J¹b~cc“ó›åR®|)à[kåò››ð®\.çJù;kâ{9¿¶yËùò+nP2F¯òÅ;%Væ±rò©FtùÖYIµŽuþd%¿ÑGYM
˜º?Ž3Ú%ÿ-þ_ûvT±:²o>ûõ›Ï^¯¾ù*úµøgYÏH¢¦ËÿDI½ùå/RóŠã!œ¼É°/,‘[ÃÁy·#N*YaSt®emîÅzäÓ9rÆ°]-»^X-­Ãÿ—óâ IzÔd+DÐø8Ut=Bc(´ã±‰·O°¿ƒyÂ¹"&ëŸ·áAŠaF.0èÄ:â_ê,3½~æ¾ÉœV%•˜,Æ%{Év¦ÉWúf¦À‡àl8¨“¿¯S¼¯u'Îä‹8xŸºÞN^¨NøÀ£TnŒP”`*(mOƒà‚~¸Òað.†xdO¶ÏuÚuˆgjÓ¤XÝÚ$ÅÏÅK]xÁ™°æï¥CÃŠ`Ü¯qŒû5ÕŸ@wbú’Vóoé¬t:ìõÒ¬»Y½©üf¾’±V(ÞÔ‚ZXf/skMãžEäi_]f«qI”¸œx"xYM20o½ÕŸeA:–íöej3ü
·×ýu´ÕxÊ`Y_h—íŽHñÔzÿY¸‘¤‹ìIiKß“`;ŒÈE´õ-+» µiA-Z3µhI±—ÿ•))™»Š;`ú>ËjJ‹Ï2$ï`Úˆ)™flw¥ØâÂ-uäGü|Ónëúö7iÕéµ¦¸eµßz_öèg¦ø–ø™!Æ%~¸Là}=K^5Ü¥)ös ~iý¥ JÁj¹@n)mhJüÌáOÂìÝNF3³ˆÅÆñù‹.eô† ÙWÑÐ`9Achu~äÀjuÆ“li…-–fŠS1Sü ª/Þibq6ï`Ä.{,ŽgÀðåÐ‰xó3Æ±20bÚõ'<ÒØÁÞ6S×ìa´æ™®°tÕ%N|ÓY+Ï‹Š‰"ÚÓíkL?7s½{Ô­3I£Ó5[`üôQõV˜#Ÿój'&áÎ\J»ëáÁ¯½£ç¡³(M™°n#œ½¦˜1Z}-¬‘• ílEî¤#´óàGÝ©¤áXŽ1dÈè’»9‡®ùm›Uä*\±<óa3NðÎø$2#›\Œ‡ÓÎís#µ˜u™ÊØ–®UcžXpd_‰E»PÈv-l…0Ã+?Õ{lÎÏ±fŠµƒŸ˜–ÎizÃÞ¦‰´|4‰A´N­²+çB6k43shúM×ð\ñ¿–-#8Ü~·](Ÿov»ðßÂ­ÎC·½M Œåw[Äw[Ä[·EÌ»nßÞí!ª=ün“P>ßì&Ñà~·
_5vÛ†
ØüÝ¶ñÝ¶ñ–m7[ÉoïæÁ/sZ
ž[¡,f÷˜3$9™þ«gÝ3wLÆœ{™+nðjFäã˜NÍluý¸¹arâËÕ†³.F¦+†lY•µ‹áxÕõJšéÐû³T~®¡Ù4u^ùh¼US/ÓÐðÙ{W‘Kšk¶39œ‘Ì¾æ¢m1U‰¦¾¢^»	QÇÜl}IPwRæhØæ›p¶IT¢~vÙHÀ/L¤1ˆ*,~HÒð¥
Ñ‰'Ñ_Ùýp0ãr!Êpø.?¦²œ#¢“ê´p²ý,·¼Õ¦r‡Žf™¤º÷S§6ýIáÃŒŸä€Ø¢âä Ø"aR`lž,É?t'Ï?qbS8ÈŠšb8Ÿ:¯¯‰ÞëK²wÆ÷$;-ÿð•Ï»”†(ãFpýööK²¤CNºE³Ï­›ºÌö}Ê]f#|ÖâA›_ŸÍ‡–æ3l¿MVQç¢Û·ØæÃu§ÄJ-¾¼¸ãÿ„/ŠkÁÏ\éã;JÚ\é"WîçŠlNg¬Ü‡§ðÁ×nÙ^"®õŒÖÒS—þ÷·iåá­‘ TÁ;•ä·+Ó%c¯¢½­-M²ËGœ1Á)Z=†J#ÝdÍQ´(Uq/W¿Ý†‚<%•ÛhtYmÁ²ÚºÅeµ |ão‹¯Hª•—ê<{ïb-fÎ¬ÜlE²>—áÿRÄ÷$Á?…Ÿ	‡ª?úÞlŸ¿—ø½Õ‹µdäƒdc8å1¢ÏmÕYÏuÚ$eÂãU*/ÔÙýx>ÄóaÄ—†“CB£[ßçdýÏÿÙgŸ¿äq~#Aæih”g™¤¡êþÙC@è	?óÝ~+-‰¿ÂXÈ¬yI¿ [WLŽn;*@ó?J`ëÿðYüÏü÷hï«éi:¨ë”þAhk{áŽA’„ÿ_ê]²ÁÐ‡ÐãQ-<?4;‹OGwÀ†Ó1»HìŽ½<;Òð Ô6Ê<ìß¶$Ô~Øý–Û7Ù›(Ñ—(qíƒ<o|kÍlÊhÌ¤9a\/gcç	MþhU(èï<8hTY¥Ñ¨ïUŽ«5VX«5b2þ•ƒ±8¾EÃiòUæ ±BÛ´Ü%Â¼ÐxX]e`;A¯¶s‰÷;~)h¨@Í0É‹H^nf‹ÙGøží`øL†ñ}²Aõh~…¿yÒXq…–ópX¦ô±¡J1¸*c`Gùóñ°Ÿ½bÜh;Tûõ
Ëž­°.u´‹5Äm1
™ÛC‡ŒÊÁó¡}`4\¤ˆ‰„ï‘1bÈ±xtòÌ÷ÁÔ_fVXfßmŽå÷#„Á/•Ñ¸ÛãOèÅ÷§ ÄcÛÀó½¯L;°jð[ÝÁï•àÇ£Öd(¾Ãš‘÷Ü–«»zŠ&ƒ^sôv\Å~<@Om·yÈp·]ñçÌX\o)®Ä%è-;
ˆGz'.Ž¯Ž×œïZ=¨ØËF	§[Ö‡„F¬¿9Œ•†‚,†0¯u¥Ï2`xP8Ÿ þü]\ •^ÅO	¦O¢:	½/B¾	W)c£ë*•9LÕ
»tuj¿(½–¿DAÑ4±ˆ€>«—­žË¹›F¦œzì‚*šƒ³Ü}¶tÂÿ©ðöù?KZž;-£[	Œ#!j+Æ¼ñ‡x”ãG«ÔùE„| ‡¬7mFþJŠ’]ÃPë#póB%3ÞQ‹ O
}{7; n›Æí'4l?¡QÃP”>FÃò«CŠYZ¦b0Ã‰6‡ 6”íDÉW™!_EÉ·oÎ'“,i)b£´Ct¥	ZÖ;ºXc†"*5jk¦ö:¶ÝÅ##Á¢¨½ÇV­aµW-Tó™JKþ\IÍ3Sr,Àn>²×a 3ß{Ù·ŸšØº1¡ûäRýpi%ðD<ØÃ_ä1¹ñOÔ”†Ûr©vŠwáŸ{;ê.O>ø@žM4‡J{¶ç\‚ÀÚ¾ÖÄŠËœ¡¼KüâòdìÒU´š?WWð;`ìÄ£zÂé¸K:ß>:ãáKóÆr¾¦ýÊè…ƒ3âM«Â1‚6–4¦ã1­É|9©WòÇ'¸hžè#œÞ`†dm]oÜ…,3ŒÀ±…°x‰tÌbÝÃõE•vBü[õAû0ÿ„;¢eý¶|Hì·ÃEr+*Wr8u>ø !€¶Ÿyœ2/¦ŒbF8EBf}<5Ý)îoüL°‡’ýN˜h>PÛ`¦‹Q‹|ù"e	ül¨ÄÕh²eö§ç|ªýî+·-¢ÜÒû4È…|á}=û<9.nÓ´_ÑÑAû2)§êKeO¨>l
bfôïÕ!Ñ§PÆÝPDKwqªá•Ú¨ŽBfð^TaÙp±!ó¿ÿ¿ßg`ØtCúäY½ñx¯vÜ¨³jå´ÆŽíÕY½úðÑ£C–ƒŸÇ‡‡?PÏ §µõFí”Ç%”;LòcôúçRó5¼
/èëgOó¨“Ì.­,i#>yVå![Õœª¼£H°üßm½À|2Ž=u¥ÕÙ7©<‘6¹ñÚ€ârS±f‚ÂÝ6 ø‚\þ¡ŸÄ2î³g™÷®à+Œp˜3^Æ.YLeW3« Ë.e2KË×™gËAMñc‹ìÁ–}ªÙ6SÞ…¯Ù'=]éoé`ñ¢vp^Ým]8c“w¦“óÜÖÝ%\ãÕ#C~|z˜o]à÷W~g±Nc¶^wðòµ‡­i&Ï\ë¹ø+›q2šœ˜'Ï¥÷q·9…½%s1vÏáÈH—Ñ{C§yžÕ«Gõ³`Ç>#;3PéõŒæ¥$¤3eÉ\Ÿ!|sÆQ'£ø]Ækæ<‚ŒÚÕ‹n¯ÅöšºÑB¼a]xópqc·?|á†ŠÓž¬ñ]5ÄL~þ¥àçBUIºÖ/…Îù(L_™£¼r!7rë2OÇãÿý–ƒ!ñB~æG„ý/Rßú;T§£V÷K‚É ö™®Ûìœ1l åI'ÆºSŠ×»j&"&–˜¹²BÎèL¤¥m.ëÓTÐ@hŸ6l,è«>¸«!Š«öœrl	€“½}Öpû#¼Ï†V¸­)qÚleÂ™Äk9#7Ê™Ô#•,5,n%´] ¼çÛ¬9ö\µTÞvœaQŸtmd©ì%}ÉaAß€cž5±H¤‡²Ú»Jn½$ëôÜ1ð©íF3\6Ž¦#'€²¯òi%}ª:sCš7è[^Ç¼¤ü£;´,úä†B<î='ýžé8m9² éÕœÖÅÇ ËžZ›>ÕÜ‡›o÷aE¹´”ÏÎ{x1œ^äøKÍ¤~ü5§œ«è9'\þÈ–î"ëÏ?W‘¦Hg†"÷©ÈxçT†~ä}Rü`‡=óí1w@ÖòË¹ÎÜ'ÉëšlÒžýÑÀ$KÀ‘Ñ_€™îp$½ÉeOÂ3¼tÑ¢yw¯}WØZôºÌ¹QÇ]cqª»¶ÙþE>wúÝÞå6r¼!†Üå7ù^÷Ç ¢n¡!•±¾0Cú*SõE=d¦-]-
q1DWÂõ@rÀ;wL Äî¶Ê6û“¢[ºSn†ª æê9ÓD#ž[ûßtZÏ;d`’“í8/ž¯Ÿß1Os˜Ã©Ä{ƒy¸q;”u¸Øf¸¥ó’{®m†?uÜ4Q;<-[sL†¯.¥UàvÀÏ§È),{òvP©Z¤ÓÞŒÛ§UU)„'™ú”nW‡ø·Aß?qé;]¿îÓ5iÝÉ<}"áoÊiH³ßGs™·òÈPZ8ç…¤!œð`÷ÖOûÎæfaã®´Ã•›këåÂ»(ÉhzCaÜQn½†r*Qsö¹‰Üe\µ;[Èß‰p¤ÁpÜwzwÑ¡§Óä&ÃÑ6+B$c1?¶zM@j:â5I½œduÃ|ïÝ½GÕÆNj”HWÑ=Ó|ed»7éNzî}«ÊLQ•ÖöÔN¡·”ËT&¿Ù€åÏº}:GLÇ½ìÒÅd2ò¶WWq6¼|g8ìÀ	dÔõò­aµåy¥ù¾¸s€lfû%ÌÖŸÁ9îî:ü·ÿmÂ[…Â÷Ú]Ni—;ÞKgdÒwSå}·ÝuøÆŠ÷g#§ã‚Æé|=yà“TRè÷ÙF¿oìø‡`î®üL=‡?¾
äØ|Þä¨uüUŽmc@úì£–W¶6äÃœè3C…D?pmÙÌox—,õ…$š%š;8¥zÎÀËyî¸{nó\ˆ–”þ< ld›Íxo;ç-s&sßóHPÎ`âtpðµƒ~¢q®-™„\´ÍJk	Ý~xN»;õ`JIÉ_å¸á?!ƒ²Ùü‡A®Ø¸Ót²…ú_¾°nu,áµ{dÞ°×m³?i5ÛënÑ–é%šêâ‚)¼ŸØÄî©÷Œwhé”e–ø–ãÃ¶9JÙ4±34‡“É°sSH570ë=gä‘ßæêŒ×º{9b»ÉëŽ³¬R9„ö?`¡i–¤îR,Ikq$?’£ÙoðÊ¶L ²ÉáÑˆèqél=LNoÚœiD‹	s.Gims}}ãNê±ß´½Q\°hXoIlérß8¹.Æ×š•_ñ£Ç¢B„wmÙGÖg‰Ž7R¶˜±âk€Ž=)¦·\^+®ô_üãï°ªö‚„y®‰ååƒ#H®Bù"Xà<-4	“’½ç\Úú¾ÃeFªOfté÷óY»OèÐ–¸ŸÇÖ9–)-|t_Ü0Û©l.>áÈZÒ€ÌÜÚñ6Ís-º3t_ Èû¬¬q~’+™A×“‹çŽ»ÎÞåÇ$g0Q”+ëçkZmšN'“Ô Gß€s×-¹%mîÜ)6‹Í…5àÜÔ€órkSß€œþÜE4Àƒ„Îd:v=ë¼«\i-áœáó}ôË³%ôýg¹)Â¶ðñ&ç“iºn6)– `±(>É…xgÍ)7·ÒHð[	BÐ,&´;Ü±‹s³ñÑô¢˜ÔBÓ˜$HÝ¦óÍÉ —¬‡¸ÉæDnài¶ÒÜ†ü5Ë$IþŠˆŒ	­à.çÛLøœÏp´³7:Í„n“+üÌÓš°yo5V-
·{«fõß=àCàqŒN¿¼_Ýý!LÝb´§ÆÎ Yƒ?t6ÍÏNFØ8Ðãìræþþê¿3
?Ž	dY±JnâhU±'¬’<À“uÇ¢Aa%­#J£Œªu°ÇeO‚ù°Þ¦u¾–|Úï¶Û=×6Þ¢Ð‹¢l©ªRÈXÀ@@Å´.·~©òd¹_½pÆNÏyî]\:+ì#g<pÎ§½î
ƒ0Q±Óg?a5oÒFJqÃ^»Y\_ÛLá,™„®bHA¶s¤B+þÙ:…ÛpèVl÷°rü‘oJ ö÷ª•C¡j_BÛÏíHyz×â ³%¼_ i©Ìã‰Ðê<•®i'õÐUØvØ¸+fU›4ìiìaGØñÑmR.øÈ©"aÍ'ÇÆIùK¹rBYi˜mý0M@ŸxöÎ«ÿ–ùŠ­@Ç˜ˆ38m€@×Â­E:JSÝ{Wá+ÍDJ‹õ¯Ì+F/šùHPiÎ›ŸðûÉ¹“P¤R„iº—ê½+iZcÍDd©kNá¶Á¹Í¾ØÂYèlÛ±Ã†ë´.@@«Ë¢’c;jKãÖ®u×é!V6g9(Ì´º#—™²Ev9ÆúÒk»£‰¹h!vÁ¬½@@4Ë(»´÷èH˜Îa%µ—VŒxÁ'fœkKìW.d>›Ð~½|+nÎ«$0¾Ù2 B¨D!í-û39Šbp›÷MÕÉ\WÓ,mbŒâf±Æ´9Z½¡§ÐšhS3Yh£˜Ýs.a&YVØ/ûÂÌõ²Æ2[kYýçSàK(ç9ýQÏÍõÐ·˜»FG’‡,©‡#BÔ<¶ž+ÎŠf'Ðy¼[ÃZÉøNÍúm),ˆ%$‘Þ±¦P¹ƒÇô-~U›¥,áU±¸ˆ¬", e´ßO¨ë×hü\sëX3×€:·¶Þ—¾­+pz_b™âÈ9lì‘_ZÂR}Æ¶9“‹ühpØ‡®Þg…|±„Rð	57\û\÷TÏ¨„× 6Jo}¦ñzÈœrÛü‘X<mà¯(Utûâ§²¼ûÎdÜ}öÿÐÙókx	dìtpE°>Â+…z—ƒMƒ\3Iü†OÑ×åæQíñËž'² J]	/”ïÐÛÄ€¾F¶c(ñ[ÁBnW­á¸í1äž“äÅkðÑ„ÿPÕQ«@$Ç9bžx¬ê@##y‘"‡<³`þ'-­{â‚Ó€Ä—¦4ùð1ÂS¢’8’ú¦ðÆ&È©Ð tdw†ÑÒ¥:\&~ípé_›¼fn\p|)Di.n+ŽÍÐÏõ}Œzo”ŽÊ²!ŠZÕ7Zø«ÄÖ‰¹è*ÚÚÌ¯ßÅ…ÒvÏio‚®‚=¼=` CO½É˜ Ñ£5Dû,p°H8ó¤‡™Ä"“ÈWm¤Ö¸„-ç9Š™n™ïU•ÝJ½Æ*Ç{l·Rý¨ÿÖþâäÑiƒUíÕX£öº¶Õ#ÔIÎì}§:lãFò,—cÅ|  Ù ¥‰7ÕáØe{n•Ë£‹nË{§zZ«4 ŠÊîaÍÇûP]âçY·Í>®œVVN³ë@'§G•Ó°j?àNîèâ§@'$vü¨ÁŽò÷ôJ&(ÅÞK„ª ˆh
t°aÇÚƒÚiäUF·9o³7¶ÏðBi¤¦¹§À>»Îà,©~Bºø ò³t‡cQ©	öjû•Ç‡XÚ´–Xõa­ú‚UQÒƒc–•¯VÐ&˜/™¥eÑJÄüó<¢3’öpÆd‘ÕÇ§§µãÆ>|W4ÌþÉ+Bn
3ø—SwÜuýù>8Þ«ýúpžÉ9?ó8¾×£cŸ²4q+r~VDÏD%¥<W[ÃWNG\b$š—²µrò
 …Õk§¨Û—Okû5èwµVš$]ÆnìÕkP{µR¯Vöj¼4Ò¯Ÿuq|bô$'EM³[k|R«³-ÎbQLÈ%
Çzz„‘ù~ýÑñ.óhM‚ø Ø!Î²•ma3ÅÌ6Ëœ ËJ	¿Uð[¿íÃ7p³&Œ´3RðBý¶úuu½´½ý#o8hòúÉ/ðLÔé·Q&/¨‰¸3”)2=#÷*?‚‰ªf×WX) ëB¾ rMGH¢í3gÂGµz£rt£UÿÏóøøàÏ×˜2+êD­Ðp/Kâ>9\uê~ˆr³ÓD—lqÈÂ»OD¬ÍùQhx?=BÐú@È—xôÍM@`“Dúèhêä°R­±ýÇÇÕÆP_Ð™2¼Ììò;§µÆãÓã:kœ<Àñ«ÔÙ{ï½³W«VNkÔ1¨o|	ÅVîñnücªŒù¶/p9Æ7|²²3ür·öàà˜’ìCëyeÀJê@÷Õì¯û§Ž‘ÆjuÏð.!{\û$Õ2;|ôèÄß[öy1<RG‚c‡µãÐî#;­_?`Š©Zí°/¨¢)È	
r´Áš;Øç¿ñ;¶•ÿ¢?Ø•0¹-ºI!h=¨)6¶¡Þ„½#†FIŒN¹¡î`Múåž>z|¼—ÍŠâ··Å"’^¼T¤ÿTHFù®0Ñ÷Ãz-]M¸ƒñ’cç…²:!ql9òÔœ®1ýÝw ”»ï¼÷;¬?x\yPc£Þ¨ãýe–¢dî‚ú'ãÎ™4+èè÷àñ\hOhƒ¦¤B®Uªa´>y§öµêãFÚ¥x7®fòÑåäb8x4r£ËW=)	'«¡xüâÌú¿òt±<‚'Ú¢æ¬‚p}R¢`ýãÁ>ˆ˜+l—ìnVX½Ûv#ÅL'Ýž_
ƒ0÷½ipÆmõßydV”]@ª÷ÉE@±4ŸÄwe+æ¼RœR—·©ÿ™ˆ} 
ÖÇš.0Å.\ù¥Y›©Aäåpü¼9>'‘¡/öõ Yy*¶>aw<ÎfÑÐ¦„IC0z+LÑ[!þ«ÈïçC}‰0Dþ¸}"’åà!„¥÷²™ç‘x”ç¾	;ì<£€õ\ƒv	èþOXm@0™¶â­’'‹AT~/ï]¸îäcøú¤ð~_>€„ˆ«U7ÆSW-«›ºF·æŒö“3ÔÝC…DPÂÓÜ1Ú]a½º^†š{†™ÏDh´<Ìðè¡1ÆYªâkû¥ýB¸xÿ™¡x~îI,z¿T­†‹öŸŠL9¹ÙÐÀ½;‘fËg†²9;Onvµ¶¶·i¶|f(ššžQ€âÙaæW^·9îBn´âÛ)WÈ6oÉd…QÂfµ†0{sVÜ/Ý)oŠÂÆnVÜøíeü
ôQ;7¹èÎD¤¹ÁÃpf´+ØA†–åWìK˜|I·T¥ŠoFæB3å˜G3¥ç–s)²PŽåÐz%N±KÁþ’•ƒ\ü}wÜqÏ!›©·+ß/f$Ïy2¨µÌÌ‹˜—	•”Ož°ÝäænVÞ‘»"¥ËïÙ‹á¸ûc<œöv2"ªÜŠoÃå?’E!ÝYäßž+½'Å§ù26…2Ë%e!DªUR[T¢:Ï&•3=¬´®‚,d\u%vµëL¨Ôƒ+¦î¶ÂÃ¶¶»¾¾QŽ4òV†­¤[© žP(ã^"o;
xn¦~H ¾qþB!õ)ñÀ€(Äã,œlq·mÓ†BÒÁ”KË” #¶_‚—oÊoh-{?óTöƒƒÌeŸ<]†¶’‰ýØÐÅ5µ‹A±0ÞpZƒÚ6ÈLû$vdE'WXQ&Ä	]bÖP~C Ä5š2‹vü’xdá‹åP¶¼`ôþ6yË	%`Úá×7Ÿx¿(Ÿk*<ÔO!f¾BC‹Ç}!œùÃE”êïÐ€EÄ¹¶®\|N  8á‰¤þàRmbx‹r`áanmYŽXhsJ,¤$­}’Mó©_˜º9%–UŽ•…:¾yK[‹•6 e³œ‚‡Æ»žË™ã„=q„Q(?&ÇÖ,Ê·¼ úKQ‘•:c—Ïÿò'LZšì~ÒKe‹¨w)—C#†H'2lñhèqU;0¯µÐ[®h<ãw9òòQÙÖ	ãtuMö,d%£‰TŒ¬+^Š•ýD‹›ßdšütÏC£µƒ*ÄðPáLTùCéÜ^¼¬“„²T?±°JBaŠPK§P!?°î«§ÏÐ)Ð]•fÚc•ïÃÙý#øïeá™ÇÊ f•7á¿­`à	‰y³v©ÀÓÚDs¾´S}ôø¸q°Ÿ­¡¥çõvå€þÅ7³¼4‡W°(na«!5›ˆfó9’Æ9…±ŒÍ4ãW¹ÁømÞúømÎ;~›¿-eü`è²•ïÓ }Pùˆþ]¾›™x¶{‰1˜æØ­[Ø­y2òà.g¨‘r(Z!¦Êj˜)Å»($ˆô¾ÞH¨òl©²ô4O¶èPÖº%Ý®’®X¶$¬*	7-éö”t¥µ@2¶ßu`waq2^NLC™m-¯™Ï•9ïÌ”ssîœ[JÎ¢z~mæ=ç…›=Ï¶7?•©'Ñ3ÿø™Õó^e–MÊäÁ°íÒÞó#/¢I¦§ß¯3Ò /¹<n:ÜÊo:àÜÍi·§XÆP¶:j³¾ßÏJ¡1®íõ¸	oŽ¯±å¦c¢Šþô®Ÿ”4œ(‰whÁŽéèyö‡ÏÝlŽýPõBú!77¤„\]Š×+R“òèQìšÇY]Eë®w9…­u×hóBH›P%eÂ×º,)-•Š]žæSbBžˆ^wJó*g–‚²7¼"#´Zw^#œt×ùá€÷pE:_1gÜiBj®é[b×ÜQÉ9Š ?âÚI(T|ƒg¤p„'çj¤H®ò‰©²Þ+°Üm¿b’çÂ3î©·ÄKð‡&#[\VÔ<[r¾ð*ß8x¡Šq…ùé'O?k¤RgÍGŠOœH'Søs÷Ãg|)n‡é-¢1‚wþr©Œà…\µ?|ª aB}‘iJ#ãï—»°)()SPZ“SPÎsU‘TõÑ¨;èøC<Ì%­E]¹(éBÁÚJÜ	š¶p¨$%HRIU/‰h¼»Àc°»Ož.“÷ìô5M¡4¢ª2ÒãSÎC¸¦4~«Ú©ð¼ô&2Ìâî¯Ø"«G;¡Ü™iá‡Ï1‹YùšÃå¬t=PJ³:t¸â·âCÑ¥+íJulTÅKöyòrÅyrŽ9Â,Y)'°r
\ËcdÌž4ŒCþæq³¸ÕHxM1ßñ­´@øh£¢—Œv<íã¹’ìˆ>P²¾‘ê4hT¦ò£Åãé"©ÐôHX¶Ú×¼$Þ
¾¸eI=Š¤'¢
ó>šjjŠ«@ÿñÅ]ÇeMµò+yÊZâ<÷²bàSt}ó¡IÇ¡.í)^^\ Nýå‡Ÿe<éÃ—ðË|9\öK”ûjåŽtÅÄ…6ì.ÏüÃéÉ‘Úƒ'Ôà?æÿð™\g¡B7ç/´b,tËP(?…Àq/ø!„ÁƒUKZ<š+‡#Ö~?8[‰‰«löŠ‰@«µþ±„¹T¸ÂˆýÒr=ˆ¬ƒJË¢j¥ÚÖ~!Ä,f`RÚÜ)Ù”6oZF¥dyûŠ“)F
Wíšjv=ËÆå‚Èkª»LÂ¾Éø![Â1!Ÿ®;NÈ¤Ý/êþžAçì	§£ÔíO×Ê…lÙÜºBÙ²5ìj-'%¸€ôRXD/ÈØ"Ô5hk¤ÒÊb*åfi+Ý_P¥d²ž/¾Å-‡e…:ºüÚ®*¾sµ2¢|UÏ]ÍûÒ²¢ŠÐ%(	6tï×‚÷¥RH†oQðîçø÷óhöV}M[ýFàŽ6ÁfR‚­p!‰óÒéJ	R¥p?m¹Üì¡ÕB¼³ÐQŠ ýÃµI#ƒà'ís?Fw‰àÁûèï
Öû=D¥a2ž]†Ú	ÀúÎ¬µÈ¡ÛFã\Èt.ö†v7`©§BN/õûl+Œœž'=-Túuˆøc åaˆò‡nï…‹œ‰»StP 6­‡,7”§€ˆ°½=ÙÀ¼T<„¸K× &ž‹S
kèö;b ßÖiÖN„œõ«4@d±Íð×&˜=´u" `´yÞ´©o\[Z6acmsm«iht/OÅ©,kh‹@ªšN»ã&Wï9¥Ø€ù|úC¬ùb|t8Í–^ê1˜e'“$ˆjlÂ06!ÛÛB#NïhZö–a2Ã§ 6#x&ôKêdc†öMnA
 ÝT¨¹áò¬x¸©@pÃåYámSaÚüC‡VÂ¦1m:ÜYµÒ(¦ljY=^¬ÖÈSðƒ(Î«Õ5%ËV@5M0SrŠÃD¦…Œ@½Ý‹ÂÖ-¬QÍ˜•ÑÄÙ³‚,FpºîÑBØ‰´-eîk<-…Hêß•ÜQïG*0IP”¹]*š2ÆÊ§ïærÂwX8uî¢”˜ËEÓ%Ýnl>p±ù Ä”þW‰x%ð­â>‘<VÛpLf‡ÍNŽìS›Üèé2W\/0âƒn;WzÕc£Üãáhà§Ç×%ê`OºÌmhñÝ4®Vÿ”5†#aL`ìOWuØÑö"w$‰¼™õ:ÛôÕµðúÑ÷rœKùœS°JÖqF¹5_w´P`£fnÝ Ow/­Ò¾P;°Þë7sE&m°Âx9£\‘ÁÜ åG¦Æú‰4žú³ÒëDæÒCwì@{Õ·õ¼þ—Sgìªu^Àø¼„ÿ¼ÉxøÜÍ=)å×ŸfØªÓ.ºš#ï/Ê¡±Á]¡ÙC$êý‚è0ùÖsÚˆ‘{ÀrÐmí{:×n~a+¡<ºÞHm"o‰§´6z¾á6fÖªð½r}75Ž/€‚–·"l®Uos2Sí<DËï]®0ðÝtíCÊ{­ñ<ÔâM¢Éyycÿ¼¶øxQ‚”#Ä€(\]´ïµ‘bÃt)_ÐJ{•+ç×Ùè–…$d˜ü‹Üyw"ùKkÒ.%a˜çöÎsäQ…«ž~	ƒ.3†b¤;PùK¥èˆîAFºÛw&nn4íy®e!H“+Kèëk–
7×¼¢Ä\˜i}ÚÑòí%ÆÝ#¼¼—OÇTé0€©zÀy¼þvð³„ƒü\ãœÔÂ+#û‹‡J°8IðÇDP¦ºÏè'i& kÐÉðD0ÓðšâëjÑÈSµðÅpþ3ºzoìáT„Ú´MZ·T"ê¹¥º8C{‚ÒùÓ@pŽµŸÏ²:ŸÃi ×Ó¾„“¸-V|oMÝ½Ž¡6düý	ÆËÜ¿²à3q„šë4°Æû4-Ÿ·fžJ£'olLöÖ¨ùõßßvš­ (SÇU„„­:ì>ÙÆàŸ”8ç×ïÿ±QªƒÖÎ>ò_q*åÏÿØi”£®z,û•1ðmy4Ê‡v+ÄX ±k†8glTÙìM]Ÿ(éGœ&éñí’ä?ýËÛN’•#@‹4¤!R´HÇy¯×m¹ÙÂJyùšåb¢òHÖøÂ Js‰‡›½"zúxH'Ï
·•GÃÏtBuâ*X/¬nÆ‚Ô¥¤°c²{¿m–Ý×ùª2Ò)%8àšoÇ;M'†.ëÚ3v{„oˆŠ^ý:€&A‚_y“š…Jµ+:MoØ›N\<+»™CåÊLê+ú—9<3‡ívÅE{eQ‘pü,0cIÅžjå­·…Vªèþ²s•u}<ÖHþ¬›‡³m]°‚e[y#XqîÅ°tµ“ƒ']¹›—doÍVÙÁ^>Ÿ·õDï—ü,<êåî°Ñ†—ê=!'åéHZSo[<NUüñp:¡°ªµLå±a¥"‘s¸ÉYÔÀëâÂË9Ô&¿³ÛáÉ6v-é„eY\¼7ŽP5c[žÛs[frŠ‘‰
 mÌe§¥ˆôä’¬÷æÓ¤ï¡!ßo•¨ÑádÂc¸åD7ÝìëéÄ4–%<Cæƒ›©ôz ø¡”€èß¼þÝ›×Ÿ¾yý[øöïo>û»7¯¿|óÙÏÞ¼þ×7¯o•gO]þº¼XŸ9ë†Ìº1sÖM™usæ¬[2ëÖÌYïÈ¬wfÎZ,È¼ÅBRæ{«|ÝX¡ŒTu{ËPÆ»ºÑB…|·Õ¥(CŽÅÖâë¯Þ¼þø;3yU2÷%ATfÎ¼dÞ9s5È\]asi»N	‡ãE’5•</9Sæì19.G©ù„œ•ƒJ¾ïŒ²Ù>w{í´¹“@üV5øH²yî^î\aŽk9AôNACa2š‡<=¤ "‚9ùšô=ƒåÍ‹I¨OŽj—‰)~è•-pM&+E”h%Æ)š¸"8	¿jãT&PÞ6KhVÂJL)ÓUsèZ–¢ÆnËÅBìRA=“+ôd]Š]€E„]ýÅntPâòËØÛe0Æhõt0*å¶×©uŽ©ÖhI1Ñ<
Í,9x]¸84cœS?tz†Ï<·@3nhné?·ôkÓŸéL­_þmLí)…	á–2sÏìœzAdABm²Kå{õ‰ÍÔãåØéUqªql¨&®mY7›EDë“[ÄÉÕØÀ“±CçUã%õ,ÆÄ[_Òßè…tÀKüëèî c×nÐ²°Ž:ÀF9ÂþŠcv—<º!RM†¬uÙê	ƒ„,9É±?ü?ÿU¢æÒwŸ¿rÍõ²ÝöÃ~ºže¦É|Æ2˜HdÜ@¢öŠP/8©Y6¸9ø/šª©Ö?¶q¨”¦U¾ä«:T«„dULs#ŸaQ™ë1~¢˜Vhù‘r;^òÙ_ôÍšE×bµ9ÒÚ“ÈKµØÂ¢àáIöE’ÔÅÌÓü$Ú$ù¼ÎJRhXCËÉÒP+_UñPLBÜÁZ‚=*Îž;=Ï®öû6“™ž
«Åõ0•ù/Ê%2±¡/‚Â`rD_wB¼G`8_}¡çêZò’·Ðqú
Þ,–ÀÄãŒÓƒj±°2«´ÛìØ}éßæ´»ló~h’…’šT(ê:¶Æ8˜•Ü"§'N}>Y<Þ/O‘ÖÖæ§4:ÍjI«#­9‰å¤7˜}…íkËvëZI8‡bLÓS…éý¢oKœî@h‰nOSß“¦¶@W?ÒÃy~\tÛ04)oKý\¯èÊÐ|PÜAB×bÑ{Äõ»ƒÜK83 S„SƒMüOÉ}l¿IŽÚ¯¯‡£ÖK`5 °´ˆZ²O¿ÄójçÈÎB9«úÇÚh3÷ë‡Æ~îzJ[¶²}Ü©¹ë@‹àâZÊ¾ ²ÕÜ5!X/1Œqüü’_g“­Jtšã«A¬€'¥Ñ«³ÂÙ:üwšN¶°BÿËÊËOÙsEe@°æä†Z_âBß#le‰`kÛ8(‡©4¨ð±s’£ÉÏ|–×p7eé—t1N`÷SD£?âß}ÿÄ¥ïøwL ÷Næé“P [m¨ÎxE]Ÿ–	O:ÿ6©£OôƒT–˜ˆq4¨ë4éÂ½zFûìUdêòP6\ÁþÊ%d@Fò}/iúùÇ·Ù’bX¸º²-Ü*þe)E™×Ïì‹û
áƒ¢ˆ³|9¸V“®äÒ¶p‡#§Õ€T½XP	ºM[~òªg,aÅ\/Ç“†?$dv:c·CáÉ<²]Z6acÄ!J‹úšpºêÅù2j­n¶h*–JßÌýJóf¥—
ñÒ9×G[9eÈÜ?©"ÕYRûÖ.gÜ›¾†ÒP *r—L|	Ì5:\ò¶ÊÉÆýÄ°Øí¬îž­»2Iï¨ê %«“ñ™Ùló:2'ÅR|*frù’Ÿã¡&Dªí;“Ö]Jðk:XÜ,½·äE2£Û–ß§Õ¨Ÿ±&…ud–KÚ‡Ö2E´°‚íW©¶q%„·^‹ª¬ËÃÁö•,	yVWQO­ÄÖ”{8Ð"º"°¤^×F#~‚ØÊK‘öíäžÎáÛ¹L4¿Õq4ÅöV?úÐÝÊÈ&¢	Â­ï5+¢Yyu¡*ƒU¦“–F>;(ñ>ç	ÙP¹«A’rYqº@q ¤à¥ÄÖÏ [¹àLeˆ‘øŠ	É¸WË!»EÂ;°3HùáöNˆb”¸qÊ¶µ#<­„Ê7<-6Ÿµõ‡ƒaLLóù=È°Ðøó:™ûðOÚþùÇ´›÷1èˆÑ³ØÖCeBÜI<Þ´{%“ ­ÌæzÊ"6ëmM$¤²u~’=DÅÇ<íÃ?\‰âµ°þî ³|Ó1Y‹ÌnD³;NGT‡ÆÓu ç$¯Kâx•8mÅS=Õ©&V€ýîØ^¢p,]"K{ƒMID¸Ž¹xß!‡Tþ0¸S7(I…
ö½@XÑª.@Ú£%&íi¨Îëdý•ñµ–r%í]BCº-¡a9Ä[x‚´O¹ZæWµðÏí*\Ô:n¦QKâœRˆ[ÐDÎª…}®5Hqø‡ .aBê<óTÖ
/.
QNSô)é6ã†>fžnLPÔ“#"eÆtsÏâS”û—!`	‘e­¥îŠÒ«ö¨r“ù÷¿7ítã¾ìß¤/ólÄá3}/xžR¡°º‘º'éJj™šp›O½QÌª»äŸÈådØéôàd‹“‘U ì%3K»éDT£¹ˆN'|-Ýñ¸Iÿy‘»#4Üfù½«`ŠÓ¨(å‡B^={/¼™±ºøB©b¤¶& ÚCä|nÛ•åV`h÷E†àËKékN¿³GEqvÁÿI&âÖ•ét1ÁGíxn)ýÐÎ&Q¤ª­ü“¨nåòN“¶Ð¶n‡ƒÝ/öüa–c§É^\ªm+«%<š¨gúEMŒC#¬?2¾Qðì#v'>*ŠÊäk5FÎ\ƒÂ¯…Î«)ÇÁWŸl¤¾%^*£Öd‘ü·P[´¦T’ôÂp)o‹Ò­ê+¨üúýÔ'‚©UÜ‰766E°ÅÜgu`ej_«`ŒÑ—v#p¾ã²C·Â:ºƒÎ‡l8œXllþô
’_ÜÎ›…1ûí #¾§À™ê…°â%µ)y’q³ÉÑŸÊŠÚ›Í§2Ðœ¯‘Áù¦¯)è·£ègŠ´œþè¯×dîŸ¤µƒ“»WöÍëÿ ?ÁŸ¿yýû7¯¿L°7gÉX„_óPêN7G€ª~ÅVÃø7o^þæ³Ÿ¾yý+tÂD7è_Òþâ[7¤ÆÃ`ˆ0	n<Þ‰æ¾r¼…v!K®æ?E_Wîpþú¢â/Éö¿Ñ«æ¿_Ó·Ï¿u‘Â¿S¹n¸ñ$äÒNÂãAß?	g•ÑQçfã:›KXî°…r/µÞ%û¸ë¾$8õ4ðwÃs_Y<äbí©Ûéza”>{—fze·ÿÜ«}\;|tR;e{•Fe·R¯±ï±ÝJõ£Úñ«>Ú«±Fíèä°Ò¨ÕYí/N6ØÃÇ»³BèÜ‰-òÀfBµ…J5¼éOrñfJkÑQn=fp©1Ö¸Ã¥Ö°Øáõ±¾'‹VÂBÃé ˆí•§M4	Õ,~üË!Øñº 	Y
»X‹­¯o¸ÁBfn6H­ :ÛÛšõA’O<öpÚ¼·z±f[ÜsbgEøPN1¥
âdèM:c·þç‡¨àæ#êµ.Ü¾#ÜÇˆ.Œï=öÐnH\N.†2Y8¶Ýü<æòîz­qw½ÍRö$öE(QŽ¤ÐÂ@a<¡@& a‹Ï[6›—$Ãj™ÞjÝ ø5QpÛTðAV%åèîŸ0]‰GJÜq¤¨n6ÁÞ@ðÀ–Ñßs_°Ú ƒ±^”òc¿Ì?éCÑµN“Õa2~&OÖ4Œ~D,ÔÅíiÓ“ÂÐŒÜõÄ82W¬ÛÆðcDˆK+¬ç4]ŒæÆ=¿}Š­Ë÷-èç6ñ7L}WB
ê!GëàÔŽÜÁèòUo9¨ƒÞ<ÏSÖñÎÕþïOýE“1Îƒ¢ÁÑSt¡}~6‘»"Qƒl¡+˜_K4à—é”ý”_ÑgHÀ‘Hö½!}8„Ö–dq
YªI6
äœå¥0Ó.Súé\=ƒKËµ¬ó¾ñ.ÆÝÁó\ÀK5ÑÌ•’T>N´Õt—Â[ž /Aâ0¿‰2¥N°W×õCÛAyØ¹‘C˜‘M#víW²+žlx«m%Ñ¨M³cw
2Œ¤qíár¶¸ÛÂ´ïñ6©ù"ÉWŠ¥°{IT>œ`’ì–¼h"kÁFpü–wªU"ë?Q;UÊñ¹è<\R)GpÊ™9¡Ú”07œÝáçiþ¼;hg'tý†l×ml5/˜Ç¢yxg›~sà¼èvœÉpœoõº£æÐ·y8Gœ§¬œ0«ŠÔÃp‘£®ÛFÞoIBÖF·ï§“¬ÏOƒ²Ó^oy…ÁJ/XJ¹N¢äƒ^N†ŠÒê<Vµ6Ø½Ëa.äs»‘‚LÒëØ‘IDÁF'\ëšC7-H-9”z"I°¿—`#­—Y•Æˆ¦×?îÜçSü.ûÃÏ?O¡‰°Ž’ì°“º ¹ÑÊtDƒ¿	‡²™úO=¾$Æ~ÃþšÑ«¼—ïÂ¡i¢Rq„Ð¥5î¯Ü6ë;¯r¹'å-êÝ—Îhìü\—@²ÆxØ¡ŸÓ~SYhÊ< ªû¾˜D/³È]‚}ï{šÂÌLÅ‰Í‚Š‹m³G{Ù/æh˜ºu`‰‘mÃL0÷ÒQi3D˜óõr6zëŽÒÍáÁÇ5vü¨qP­±ÝG•Ó=vòx÷ð þ°v“o®ŒüÅå!e$'ÝïytÍ'b8‡@›l‘§nYE È`ì-—Jðü¯Ä¢•«8në&ínšx`väj³K%*Â‹Ã‘¢P¯’¹2möºÞ;Déð˜ÛjÆ(O»ã¡Ón9 ÏÏ»-´ÈGkYµ»c·…
\`DçcOñ“yØ.
%ÕŠ™€iº†ƒú´ÙïN|$<ÞEu^C¾þˆ'øaE§\æ3ÃöÝ£3EHK¾ÎŒöHÑùÚ%Ý[¥ÜÆ²	|Ûl· `o›Ý¿œvQãmL!q1•ÁÛ‡AÎ“éÔŒð˜‘2Ð#åà¯X>ŸÇ_+Ü$k›…13»¤CÍ”¨Û~Jž£DA1 ¯ÌK¹hUÔ‹´ ™ÊLn…Vih¾ínÁÎïJ)à³‘ï\…åÝŽ/ˆ—I<V›Ý‰ôZ¢Ž™âÓÐŸ,<F‚\±c§D-¦§ÄT¤²›öHƒ9	3æ„]	÷vÜÚ4dî?à_’AWcE8-§íö»­ÌýŠø6G!î+§Ÿ¹_ƒ¿)°‡}pWÓûD¤©x=d‹YdÀ°a%™ÄÉ%/oa¼Éæð•…Ÿ3Ömïd¸Ì”›õB[([Žd++Š'&sÛšõÆË¹•ÕÆ‹VÖšhÅËL¬˜ÐJ*‡`F7|?¦Ó4)‘@B‘åb]X$g”(œCgmS ¶=Róý#güœ=¦<I»ÿWÐ_‹#ƒŒ
I¦Ên'õ“ c‘T†/½«²Åj}~YFD¿iÆ7þ<£yÅµ‚»y$³gt½÷»´.d¶^rB0gz³@Ý]w†.É³P”ã?š:k¾#¸·Š‡“øÓ¡›ÌBøM F¯ñ¶ ysÖâ1ø©7Â¶M7oñh:ß40ä7!êÂòLgQ'3e2^ì^ÉÇRéi/Wùñ…C`aldT9¶çB]À[–VÈçR
-^_!ú%á¡’–‚AûÌ—AåÞy}¡T”nºòva¨(çþ¿§ cÀ€©-€Å[.Dš€’R?a ¦i F]÷<Š3ª/r?®»ôDV Ö[Œv]JwñºµU‹;\Ã¤Ò¥©¦‹Ú.Æ]|­%0C• %†aÔl($Ô%#±Øíˆ¢:ã*ØÒÚô¥ó\¾L„P†j1cPf4Ÿu¹rÈ“9Š€€A•%ö­60ñ1IÀØ£Bs!_9å¶·©H€¶(vÉÖJ‘¡¢ûwa0SPPÃ¥ÉßBË*Å@‡›õÂ=˜&À%1ñÃÎ.üzòµ9¿FÜ^£–¢æñÿRX¼¶+ï†ºWzéÆAûXóP§^~øè¨öÉ£ÓØiíÁA½qúƒtJå‹aß}9?O¥V¾Á†À\ÊýiC³´MeæCgŠMô¡è¡°jw]óV:›R·—7Òw;FäPräeŽÌÔv6Ê—ƒ-eŠg³K˜Ancpõ‰ë Ù—>‚ª‰FfÚî›ýóGpP‡öhÜ6ØbÕØ´`|.Ù!š¤apKÃš •ˆßÙõ‹Áž+úoŽ¼<;Žœ%Óf«Ö^éuÜæØaq·3ÀbNÆCØçû^¬þ­Hý…;ºúÇyö‘3îöS5 6èd‹§Çjžç\2ÒšÓŽkB±ƒ¢a@rrº—8šFˆ]ÿ¢Ÿ´ëÏ¹ç?ù·änâaèo´é'˜ÇÜl{>Ÿ3÷¯.úy1‰ØÖ;gÛ*+«ÈÅÚ¼„jS–PóLú1¾§%À¸ÄzÞ~-aÚãþ)j˜vÍy¶ðî€¹\aF˜„1 V,`ì“nì÷¦.s!¼Ì9àÆWº­ö&;êîãÃXý¨ÎvOUöª•zƒ=¨4jŸTRn­0°¯é²ÖvÎÝø]ÁîN{ÏiÈñ¸Oˆ‡wŒ'ÀÞÂnb«Ãþh(XæôÜ1ìÔ“!Æž8tönúWµêµlgêŒÛ]X ýa³‹±mpS_Ì¥l½ïù×Ã¹}oÃ¤ó¬Õuñð ¨n´À»1Xm¼Ú¦­:f=”}–€ÉÿYï¹ü¨›é{,[\)­mqÚ_žãÊª!ä]_6ßwZÓ"ˆl­Ï_ªMý³ì„,©°¹…›«ÆŸU
ÞJ_ðBïÞnem>€ýø%H½GŽ÷œ=$_ ä…ÉoêTÓ
1nõ*ðïÊÞÑÁq8¨‡»¶a‘ÄùÅ˜p£['Aû×C"ÅfqÎˆs_Ã5Ñ‘GŽêÒÛ°ŽœWÉ¶uá`5X,ËioŒ.ŒÖÌLLÞ„‚Â‚æÑ´K÷EÓÅÝƒµíZãÂ¼Zôz¶‹¦ºŸo®¸ÈoáÒl7H†»øè‰.Í¡h4±óÎÔØf®ÙaN}ºdî 5DÙTç†ûÊœKgãUIçÞMÏÖ;5C©á«6C"É¿ˆd›Ø#ï¢ˆßñÍˆõõ_ßùíÝ–`ÿëQ)=Å cÝæ'w€3¿„Ê\_tÅ«9`
°þIoX<J¡Þ0P‹¾)¤›_¹ÀìBÿ›!ˆí³^.æðñäŽ®WŒtÆåæ8?1E¬6h:c4÷~7=’I)AB•èÂÎe§è1éöQÆqiØïOÝ¿úŽdøŽë1¸¨ýü•fU_1ò‹‰=Ž?r"S9«HéO7œ·ÐƒZ?ç°r¤3A‘;øž—¶RšÑ”PæþÔ?æ
›¹Â+”¶‹›Û¥;OÙÁÞamÛŸ6X&Àõð•n“òÆ;¤¤¥¯QlømÉIž£«à ú·qÓRÞÞ•rñ);©ï?Øfxzï"ô3Ã½	ü9jÚ)^3?`¶zSD® .d¿‹·C*
ê.=eÓÊqýè Ñ ÔyÿiExºúÐŠËÐ§g¯ÓäÖb]LÃ?mµ`]àðk»CNcËw¡—>G…L÷Ç6ê1TÝÔB]oTë4Ä9ÏÔÖ^ö:†Ò."ÄÒµ”CãòáÁÍöòÝEMFzv’Èä´•"%ŸŒ‡ e¼ÍÀá&ð\b¼rõî‚(Üƒƒ™wñõÜ&Ö÷jÇV©V=>FÒO©óäp1gN«…˜ƒ&Nñí¾X”HõÞIµZn÷Ù¦ºíŸrÁˆ¶7xO8<gpÈ y'ŒQšN‘}øMã¹ë²öÔEQ§×ãŒþF÷Š1­t¿­h¥Ë¤SÔ´vr°ÎØ9K½½oÁ¦­P{!ÇQ½&‰L§¸‡àGU>Ln›e]ÍVÜ,}µ%:†‘hdîÈK.aÃñæ³ÿÉJk¥`µæŠÌÊãø°Ê0fZ¼²g:6šÂÜCúÃ?‹G^µn9ïÁÑË++cßum÷X³­4P	¬´LYÄÀRY–q±Ö³oy¶ËûbF–êÖlqkemê¼ÉVóh]"•¦Z©?d‡µ½i=#É§ÎýF7ÝõÊB7GÔGVuÐC‘6¶;>_ÐNS™¶»BØsø!£:q_C´(a¼â´€p`»AË9œ4á`¤€¸Ñ~“&îAteÏ½¾ Oé›«5¸]4€®îü^ž6æ[4´à/†8ÛI±gµ™Ó®Õfn\Ž‚»j³aˆ™³1ÕR¢ÒÇµk+ÃŒelL˜•0ò8~»fÆÈRŒˆk7±[ð² ü×ä•1ò—8Ù¯®Û|¥˜P¼ÕUè.Iî‹ª“¤5ÅûÄµÍ°!íÌY–%½Á@&j*Ã%XˆjÀÿƒ‘@EpŠ =sôPÇún»;íóš…ÌœåÒº	œP¶q,Üé§ }·Áƒ›QœŒ¸ÞFLï›È§5ù¬³ï±Êqåðƒjí„À1RÉc±Ö8§üå‘3p`S5¤®ÎÎþ‡Gp’¤ p½«ÐOMj¥êGþÓ¥q'õ Yð#žÒi·iÓ>Bó”Ñ”«É#\ÿA½Q;bÕGÇûŸVŽa¸6rÊ.«×HûUO©p'(ƒ¥3~²Ú±mÑâNºƒüÓ)UÂpÔñQ§ÍÐ\*½þ"ä½T^3\¼ÞöŽ/ãIJÞf´c3Ã´ÚéÁà v†¾Y¡ø·*/ŠñŠZS]9,¸¬fUÄd@)
õa“CÉ2Z­œ›R"P9"cs¸ò~óÙÏÞ¼þ£ß?“øÙ?™‰ÿ‚´‹õKúÁü6<œ6·}	w˜³Šüa¸$ý©ÉÂÂ<LºŠ0í¯M}ûGŽN½ýwxýü{FHî¿ò|N)ÿíÍëÿŸðÝaœ~!!Çÿ•F£:œw;"øð‡Gdøâ±gàö,ãbº ²R‚x”4VžÛïJƒÒ‚Õ+(2–•Féêõkêé¿Ñ(ýVŽbªÿŠ† ýG¹‡¿+“}ö·8°Ÿý-þúB)às>Øø˜gü%ýRÐÑ¼û/Tù_û#ÿ%eû•v¨ç«ÐQe?åóìÿÀ«cÀ­ýþQ‹²ø—ßGúÀ»ø9/þSj×Oñ÷/a-4j§-Rìz¬‹Swr¹Âšc®~Axào }"¾„jòVìâ&,ûéH 
{nk:†àðØë¶º®Çš. óR2(ôgðóžÍÚ¨Ã¹¡…¶à£d'XT$ÚWºPVÉ¾pFÏ·¨¤,[²½oó!V­ÀoWrs¯O›°áç'CÚ «0¹ÙåkV©6>®ÍÁ!“€¸õ B&(n3÷í3p˜é’©Ï¬¢µãV/2ü:wà˜ÚÌ#„ÁÓÓéštÛÉÏ‰Å|®l$¿erCý”3&Í†Ê·Ñð,,]ÛpÖgT\éššÌÓGO?yý¯z6bÒ¿S7Ï/0ôFxwøBrø_ð$Î
ÃðxD1QûÒläŒ¡§hèÇ¡Ö¹\+}ˆå]ÚÜ/bp.LéLžš.a5 ÏÙsÏio’5ÂŽ"ê©àù…ë‘×ÉF'"“L|&~Móó?¸ÜåoaMË£žü/>%\:ó'ò¿Áßw30²Ä#‡V®Zæ9/ÜvøR8cì’r†Êf¨s °¶)¾YG_~Þ\˜Ø5:`KKË+lÍîzRÙïã¸ÿF:;¼Ä7gˆ1e÷û°ç±Ùêìc#ö°zé]!$!äSUôÂïÿÂ$£úÊvÇêÄÅ”`ßÌR`¥D–Ã4|¥–HF˜ç?±E	!HµÆ°¡²´˜+Aù³Á®àç­°›µŽªƒ(Áùýë¤Ü r“8^1ÚF~¯0·¯”íãÉJ ¹ ÆÛBµ|‹ÂÝÕåGµi_¾Ýìûo¤‚+XHx$bÿmý@þ?ãBÓoè¤ü…|ô[Zâæó¡ÛáÈ³#òÀ{[V¿{æmºõ ÖðÝŠ½þ&HXQ“}ÅÅÚª ü-¿Kåÿœ^*†ŠF‰ íJ»=F«Î·Š¤E£n“¦EßuÚ—I0qp&ð]J<˜Îí9›~š²ëãÔ'ÆiLŠ#w¯ç·°R‹`*-Jþ4çÍÈÉò_C‡u~`Àzå¡2P[§ÌÇäÂbœj]ÄvE­µÍø‚c'0,/$Ó+µZ”ñl$2~½J­ˆ*+Y`Š«_I]øß+lûKÿ ¨Wàðð@ÛôVzÏ~®ñ‘ùí¾ý3Ù¯Üñx8>ò:„|×šIÀ3UY&³2ÉDÏÂ¸ÒWTÊWC;«uDr[«ZŒ{sŠíûW´º¿$Áß2;Qð-æAøYÜ¡å“.ÑW-ì‚n×¬†Å<\T×[Üýæó þ'òsºû)?.$Îâ±ûrq³8p_Úgð8HðÝìÝlöü[Ñ§ßÿä+€#;5ÝIç]èD·x¡	Ë5œè[6áéñ†¿A	rFƒ‡¹6ú8I‰kš€š¾6±/ÖIUê“~ sÜeòœ).3E~âJ”N¹9«:³H¦Ü@ï¬åØ¤R^2<CÃM0°®}Ôž,uzÃ¦£Ü÷®@›†=•~J.yöÈþ…’´Æ0¬?6ñ»G¶BgÒî¼ëöÚ”†B,‹ßOóÝA«)¼lx–Í_‡4nãóóÈáÕaŸœd‡ÃABLí¸\	l"âÞÜ¸pc†@1ˆI’]:ÃAfKÀpýk¿þ°=í¹¬ë1‰1k»/ÜÞp„(ÚfUËiÌjeP
“üþê¿²“q—ÜöêÂßzÖe0âù¿3:ÐÙO1©M“œGœÒü´{Bã>yµÿ{_ð)¿½'Ÿ0c·n¡ ¶ö—ÔZTò‹¡¯¤aª.ï4ÿ‘Vñï¤ñ…ØÑ¸‘Ãg{±²`,H7¢×Š|*¶Na¡ö9Œ?×2HC@—oeÐgrþÃšóVØK5p<úõ§°ï#dÐ¸ëpO}È$H–æÈOhe~+-ld§'ÞT:)«µƒ$VÎ-X‹`yB¶™Âna6cYH¬#MßˆÑÃÍµ$³¹5—,nÍúònñÊÁ´‚³Ä&~!Væë¯ØûË´,Qbe7ÇcYx´ØË„ÁqçºNÔ„Í;rþ   ÿÿ ½û&pxœì}ks×±à÷üŠc$1Á‚$øeF¤Ã$ñ†¢‘rnVVÉC`HL4ÀÀ3‘Ãª$w“lÊu7²Jvs]ëòÆ‘]Žb«ôÁ‘«nÙE•_²Ý}Î™9ó>€ieSÀ<Î³»O¿Û}à³o±œÓ]mÝ=sñ¨jŽ³Å%æ™þV³í8ö–éûVwÏ«ö\ó!Þ©±ÉÉIü5Áz®Õ1ÜÃ[†çÝ0ÜÞë®g®wýª9éîžéO>4ì>´y<>~œ;„¦­ls±²_ÛíÛ6ëÔf'çYï°6ÿììÕö\ã°6?Ív·eºâ~ufzší:Í¾· Ïí·-ßd®Óï¶ÌVíÀwœ¾o[]³Öuº¦|˜7q÷ÛÓ3ó—ææîUò–ij)óæ•©–õ0ç6ÜU'èõŒ¦Y;¬Õ+ÙïÀ[¶±cÚê{¾yàóùÎMOW–ŽlØ3¶¸¸ÈÆvºcì6öâñŸ^|ô/?}ñÑo_<þàÅã¯^<þ{ñø9}{N÷Þ§{Ÿ2üöøËáÇ'cl]sl5Û:ô|³Ã¶{æØñ•)Eî8=Ó6›þÙÁ¼‘ÂXžo9]FP¹XiY.Œü> ez•¥ vÖ5úÉªËß›`Ële‚­N°«ãW¦øËåz0½¦kÑ¥ÊÒšüñÐdÕ›}ßó..ù»æ8­	¶eø–·k4}Ç=ÔêîÊ_û!3ÿæNß÷a">À€l§cù•´M>¬ÍâÞ[ÀÚÎCÓ]à—ê³ó3Æ=FËwu×éúµÛh>P7Øk-g¿æuX³ïzŽ[ë9V7£ã×føëM“.ø®Ñõ,\™šÝïÚæƒv;ž|à§}Ï·våÏ=£W›É‹+[l‡2¯vmŽí×æ*€ð,Å>(&çSú?¿”zôâñÇ/ÿÐíOâ¢Ûçpãá¯èÙGÔÆ?^<þ	žú%<BxHã¹ÅI+[uº»Ö^ß5pÂcY$ôÊß¬ôY^™ÚuÜNÚ½  R¸v4õ/l«¿Só6»Àn›=ÇõÙªá¶Ø?ñ¿XãÀèX]%û—©ä8<q@ÛÐ-©KÜ7áÝ1öê«¬š6Äí¨C
©i‘05@Õ«]’€5sàq(²Í]ŸI|‰]Xgß¬íÊ×¬nœ\ÉÃ“öœ:>oèÈ5v»ÅB’ý:8>‚½tÒý”  ë]‚$Õ8¾”¿? ¥ÆgðÂ/0ú’€!í‘ ¶ê‹Ç_pe’ò?" {6NP–·ÕëÖ^›ma_ãx´ç2§ßKœPr©åI%P–#}âƒ>¢1~F?aÁ°ÿ ÿÿîÅã?Ó?³œ'?§äk•¾BüFú"GNMu½à÷3F8ýõø_øï}(‰À_^üõCŽ¶¦Ïü¶ÉŒ&€RÇj2:U˜‰_V 4×: kÁ×nË@2Ïà@ *e°H@ÛL·Ã¼I\õ^>g‚ãÄt`ç¶ˆ\ìÜQÆæ™ÄÈ\3w¾íWÇ¿Ÿñ$ ïr d«ßlšÀîy{ÕøNV2!®ü†D¡^Âöûœ¡ŸÁ¥¿3ê•¶ÿ'ü}¥ûQ!ö8Óš2NnXA^’#æµm½RÉœ¸Ñj-÷[–¿áìU+´¬)h²‰ÍÀjSÁµ£½¾Õ2‘kñ&³;Ñl[ø›jUòßñåŸ`€MÓ­§±˜sL¢d€„
r¾†ldbÇïžkÁlàO­éØ^­Î:­…ðç³—òÎÙÓc‚3ÉÄ'tã9Om‚RVýî¸Àa¹(Ó0jè¦lu{}?_ÐâÌT·ßÙ1Ý\aƒ	òÈ‹ˆa“f¼u2R]¤‹‘.ãöéAóû
¨~šOJ‘¾G¿Ÿ¤ô
u|?€ôÕ~§o$‰lã¡ócÈ¥_ØÏ¯ÐGRæÊÍ¼Îª3óßgßã1ý9ËªóÓßLöÃ“µ²Ôx§oØ¬eypø—NüÕììäìw™i4ÛbÞÙóÒ˜ì‘	x*¿-ÉñY‘ïæ$óÏVa•Žõ³’’à»î7Õ×/d¼˜Œöâñï_<~ÂUtŸHýMe¥¾N0+DÛ%¬Iv%¹I'.®}®KÀ;^|™Î„*_ý’ðJh%ÃÉ?¡k§iþ)ÝÿDŠ
OäYø!_Â¹¤$¶Üj1¦éB ŽIQ` §çM ÐX%Í¶ÙêÛ&\@¹¬Åå ¾F¬‹tN%±ø&•‡0NÍþ†¬„Ø™'p®þ†6ãÁPˆ â˜.ˆ­ÒZÊåU,|SUl±~Äa”§ø¤ðÄ9,'”-ƒ›ÖÉ©Ê_ZÒÒÈd3îs Þó¹Äì§$IðG¹&±’[¸êžŸ ï¸&sÄ	”d¢“Ì6Uö3Êeñ‰\€ãœÐ…æƒç "iÂ*^  K²|Ó‰8ŠŽÛ%c
®H.kWÌjŸ‡ù®‡ÃÏu.ö´â÷’trúªbGœDqø\£Cç1–Ø5³kº†ý@‰­¦ev›æ7`¦«N§cºMsjÙõ½—D ŠÄX8áè­aèÂñû“fã‚Çâaª†=!Ì†òëVÀÏÙ?›†Êù¶mÂÂvœ®eØð½Ó³KÔ—cýðíû¾xûBŒMàŸs`¡ñ“À*ÆªÊª³ÀçD¾øŒÃSÚþœ‚KÇ¶ª?¥ï%qöq ÅòoRƒsg¼ýL¢÷ø"0/þ!¸ù2p¾˜ù0>’¯ÆÅ;$Ý°¦é•°šø}ÇèÂI:Á:†»guA~m›B™çÚ&	³û–ß5Qô²öº†ßwMæ[¾}^%Ú"˜Ë‚2&¡Þ“2îÇÖC,%âÃáˆKÉv­®a[?+k64á§‰h–Ò2.­AäçÂJxZv•ìý\"ä»„œðÐ§Ür¢àà6âÓÔu“çFl$Äd"T LŒìdì„É~XÔFxa"<%Pæz¼'¥Á©&ü`“âî»Ò«l+8‚Ë@®
œBXx“›» ñnÓêY›bÃC1ä¬ìñ ya=cÈ™gqœïÑ·˜¥sŠgCÐ¸4n]c–u 9£Ã_¾34X¾ßJÚ÷@‹à¬ß—9÷þ!’(MNŸ*W?VÜ%ž&d±…gF	Öâ±<¾óï°%’…kï‘L6Eø”¨ñÒ „“7-sŸí‘^\UHéÁ™à×€>{$‘˜äçìÂm\äfÛp& å¥å“8^¤ Ãô´JO‘ïÚ€m«Õ2»’	ÎfvÕm3…¼‡x$zn×6zž™GR}ØrO\ßáyôœ¬í$p=ôòu~[í¨W›­,­{0pëkW¦üvù··ü>,¨ÏðÒ`-Õpê'¦á:`p¼AÞå‹è¢?Tei™´\EÍÀ}7½(Øê+þŽÓ:T‡ lù=dâK ½©Lsƒcppž  NSóÙòl¡_$êh¥Ãbüéjãö6pm3—€¾×aê¹ žÖ4ìòˆÁVÛÎ~«Ýwk…Û_gUÌø`m\A}q‚Æß­O÷î!KšäiÎÄš4l´jåoÜ¨(-’wTrDt$dû¶®Lá–}ŽsßùXm«ù $AÈr•8{dYÊ¾ ÿ¡Â¿g›@ì'+ã…‚\’zÀÕãˆ8úf.+kÐiÅ[e¹+K4vkíj>sÌ©`Íò‘öe¢ÍÌ€hcvÝñ<Ãê^ ÌÊœ6ÊÀ]<Ç²ibŸJòu
d¯-°Uvç_})¬	oÜÿ©³óµ½î~»Þ˜]¾¼|OÊ^Œ;×H§³´Ü÷ññ´~[Â?ÎÅ€²À5è <I±Ž(/Iª*˜ÏìXœ±yÓt­ÝCfðqYM¶¸N|]Gˆh‡|§oö¥²|û\oròD ,×V†£×F±vKUgeêivLßÔQòÁ#¹Š¢)B`*Kkà‘á™lÍ°ìC¶B«Î|c•÷@
Zs­‡fæºfîwR8AíU½²t»ßõ˜	T˜^öÛgÓ3ðÜò$ž=ËèýÖ6˜ç£léš{jÉ·°ïšöaö6Ó`
Ôµ	Å+4É#$¬.©“»#½‘P™ÏkBÇŒ|5:w×H˜ 5ºHu['cP:P”ÿb8¥Ôÿž[sº g=³ 2*G›ÄÀýZ½ÎÚ@ZÕ“»¨¥hŽ#|>ÄŸ³Y0vaH³J´ê |0öŒÀp~4ðKM€v€™ÚÝ±±{â’±ã9v?xÂwzµ»3È$ñßx6D.‡M¤šÕ,ÌJ½*~D&Ä/µkóâÛ~ð-¦,ŽLHÕYèÐs-¥¼÷Î5Ý\ª›æ€èev¾et›&Ûº±%"çO†pnƒ´ìIê9‡ÔóPÏm`h÷Nª¦‡¤¼g¸°\sv@#*l<®¸É91wóeR}7¶(¹ &_3b2j9âòÛpö¬.ð?ènÃª7–·W¯7¶Ø­Æm¶µz»ÑØÜº~s›ÝjÜ¾ÚXÝÞøÉ¸¾¼acË÷¹#¶Ì1Zqa¶œ¥™ˆ¸¹…‘UãÆ”˜* þ8â<‰Xd¤‹Upõ‰4;üU5ð¡ñLÀhÏŽNöô5sŠ2ìÊ¤¼0Õ=Û 9ÄñUõl‹P¤‘]Ç!ç¢uÈÐb¯Ðþ£´'Ôdæ”ò%—Ô{Á”Ù£¾À8ÇÖ‘¬[þal˜
¦Ôð‰
¹ÚÂSº)îª™²i‡¦õñ²„irrÏ˜Ì¬ÊÈµÇ
?SüÉ‚T$øÐŸéï‡<QPBlÎ¡…9òt®êdC’‘—óÞÊ÷’É÷“™ÇqŠ]Ã{¸Q‘„$ÁæÇ®qÿ=±­„÷V–ÿÿ‰ãÎžÚÂÊ;l—­"1Ÿy=y„£ÑÉÉgäqø'ø«	•iC‰ø<Š™ÞNˆ-ÛÇ?Í#¡|ÏØà¨¼¢êÿ±©È'©pÀŒm:x„:E+ÚozH•#v-Û¬drr?>¶ÐqÑªƒßP‡ðÏ¿È«*tão±Vâí€ÚâuqèQÅ>¹‰ ò$,~L£þÂÝ`^/é¸Îâ·š®cÛhÙ¸iòôh"I¦à9#)xÈôû"j/=‡Ÿš‰c ÉÚ(¢ÿ®³ï-ÍQÜôc‚»ûóéœÐA¡vqn
aræ»ßa6wT®¡>âÀlUNìÔ¥T‹«ŸY`ÛN	Ø^qyÑsÍÐóã ®µS‡SeùÓ–7…d<IxÎñì€"óî`L½î‘^œg†Ïtã"-fÀíµ­¦ß×; ½³z^—§§ö+ÇŒkZQ²í(\E#-)'Cl#}bLÌœR@æ.´ /OZ¨*rá›­ O' p’ÈÓ½G{ËVÛq³‰}à ->àÏß„?H­óŒ¿7J.ŸàS;ZD1 ‹8ÓBš˜Ï®ìÑzQ¦!YPÑË <(K“ig4lŠ±l
EËT@EËî–þèë´5$1£\pªRAàˆ)Ð¸ÜË¬ßë™nYÄá7=+j
z¶JÛwìÛõÆ¥ÙµÙ±	6öíÆÕ9øÐ×zcæõÙþuzåõËõ±{“£W­6iÓ¬I‰
/FG{`.5<Iä‡Ã1o^’ñs¥›z‡Š”_<:"2NýÃF4gîíÑÛÈíÃÿ)*2 ë§û\¤%û`#„Äûœ?BÆk¶	<Ø4ÅÞˆÛÄopkþØñÛZc/„]ÆŠRC·6¬¾é´Lîžmyí3j
htOÜÐèž[Ï¹6pðãæã3
}+'}+Ð7Àí³%T-·Z.&œ9“´Ôàƒ;1B´Ç©œ8ÐA
*`âÄÈgÐþÌ¥>÷+ö(£¶<nŠ÷V•j²òe…½|X^té9ý4R:§çÄâ.}\OÍv¤Y¤X\‡¡do.,¬~òKìØj¯-Ó7,;¯”Nd‡N—~Ž@§Q&}9ðâ¤^R—X*˜|`-TgTD!‘µÀðÓL~Q*Œ´æÕK£Õˆy<Y3®ö"7ä×dYN™YáªeÚ­èíûÂ½ÿþ.¾ýµsÔ­ÇV5øýKI?Êép{Àû<{
¯ò,³L‡Ü´Aø„óËü]A¼¯øŸòYÆkOdå IË¤‚ÄóãÅ×‚Ì#Ü­í]&3“¹xkœ <ãé³Ÿð}L9m>W*w}É[ÿ«4»ˆëCþ|zÖÌÔª«°N.ˆÛ²ÄÇF˜à1×|§o¹ä¢îI÷ìÖa×ÀäÝž‡A¦˜5êœ¦ÏL‡ô8 ?•ð®šó”ö*‚I’ýOE”Î9l)k¬²Õ1H¢jÃÀõ÷^w@5ÚŸ´=[I5¹.7Ï\ztwìª è¾5æqýÐ“•S>Ø;™•r‚ÝpOsÜI}Zi{}-µé÷ÄËˆÿÓU?va†)lôZßp[–Ñe·ÚÈîc«¿&òóUÈlŠ’šÜÛaì‰ÌÉú›X±§ÅsåÓû|}O°/´×ÌjX<èH#û<{œok{!õ8§ŽXì—³tD?Öð©É¬PZnQâøbîrRÇ¿iyÖŽ—$_Ãâ,Ì— ‹½4wîXsî·9…j;ùaxØl5ÁEjË™ftgf–˜ÃYÄ7ƒs’ÝÆ
Ug%×e}zA„¾•Bx5¸ó"|$hÉ@Þ©ùaå#dâõ¼Š$•¼¼Ž¢@(ípDj)VF"¯èæÃŒÈ5RÝ…L`W~ÜQüKåò“9@#Ùýß“8ûY _¼dXN©œ–²¸ŸñžT1dç÷ú½žMÌ©aKŽÕwXÓèQZæ~×z§o²Žé@Öê»¨k“|®ÓÝqÛêîå	#Eê‹"U§ž’³„zwÏ§ªzl‘õ\§ÓóÓD•‰¯üePÞ/w¹ã¡|LŠ©äM, ÒÎÆÓ\Áa,äë­]VÅÇÆ”¶yÊúÞBªò‹”‹4rŽ„ì®xkR½<ÁŽ€^`o_­}çhHÜd×Ù¯Ž¿=AS í¤$·>0ÛB<‚vÛ3Ùñ½Ü!ç®T¶".GošâýUOÏòÙYá®C½˜{&Ï{/… .1‘UMK‹šCoÙ}/Êe ©eÿfrDˆ@}PçR=ˆf²CN²¬vÙá„‰D
ˆ*2›¶¸FOOZ­hÎ<L“Ï”É
F8ÎOOÍåguM¸e":#;ŸŒXÄay± ð#–1šV–/Á¥Xg0¤Z#ÏK
ƒŒ^q4ŠëxJ
‘ÐñVêöÌ KÝæéû‹­:¦½’Æº!(¿6íSÿåŸÜµ°ÔmuûÝ\!1T"NvÿPöBËW-‘~„XliŒÿã·Ã=Wáèq6Ý%wu/Ï€U€Û®áµg2D½\È*²#$bÚFT¯/° iŸH×§-šµÄ‹÷yvÅ³/¸i(Ÿ¸ÑÄ€dÎEýçÒ8òÅƒ<U4BÿÈVñ]z•Ý6›ˆ‡'nÒÉWòÑ¯¤lõzâÿÐ÷?±ÀC@cMª˜§qŠ­n½9ˆ¢%#ò|Ú|žF…Ðwù0’’Sƒh‚ØàšmÈjþ¹¥ëç¶8µ äŸV HëÚŽÑ‚Û@-E©iqDEòÃ¦fTµ/KClßò]Â*ø•¨ñÔO=§û}¬È ôa±ïïÖ.OTØ÷˜Ùm:-óÎíuÌ`ìtÇ©þëÖÍÍIÏG‘¸©j”ãË?NDÿör^r Ã ZN³¢ðdÓ5û\0®Žc¹m©­L¢ÙÆ‡!ÁZ™ÕJÛ5w+ržƒ¶"áZz›Oò~ŒNÞˆZ“¸„oë÷ÖÄ]Ë6ìá'ÅU	ÈîƒH‡+Jkè—PÇOZ‘:ÙàïµYt;“ýxàŒÊ÷FSzäù"%Ïb©Úë‰lâÑF<‹ûŒËøZÃÛ&WlTõØˆÁ¾G8sB-[Ý–µç G•Ÿ]/•ì”iBˆ ½kýN¯H,ú|½Û´û-Óc˜hËUˆ;&ú„€B!÷Ì[ž>ÝçÛ³\/Vã÷ôåïÜ­#/I?wŸË:HŸHUçÇ™–û«hâ‘jG^þÎtIt"x0[6å»­àè-tL¡Aá»ú9 >aç¹è‚n„Ÿ+WaW¶€g2Z^Û4ýLò!g'G?ävÂ.ži4MÛ® Œ~1š´÷õ!êØ*G8IÏ8B%‹=	*ï½—Ï.HÆSêàCéIü•dÅ‰ð¤Óˆåf ßg€û{"çeÏ8ìDð6Æ¥Á˜\5MÙƒ2|ÉU?WV¡Q/“˜ÃÉQ‚«V—2bÃ æ ¤ áÄê>t0Û-œÑä>gB–.9H¿;bÅÍÌ»ãÁþr{ø«¯·éÃ{÷yaø{¡¶Aºø;•ÊÅÕ2ôå}NØ"!…qÚ¢-,5I`ƒ½:yÞ×Mîû…Z›ž˜I¼ùteT8YÕ9—ßûÝø„¯Ê¯•sá¥‚äs¡èú@qé—?«Šý–ºz.µ6·MÃ®ù 2,¬é;dÇÆ|óHÕ§|Ó ñó>‘ƒ­Ç£=<î×	”î¢døÄK,I ¿~k°JŒ’=˜b·{Àj¨L@åöÀÅ$-äFV0á¢9PAÉHe0½Ú’E!Ã ÍúôìäåùÉz}nr~n°ºr7Z“l½9–¸ü¬_8`‘ºm§eN°éË³3ìÖÁkÅ)üÚ®C®×V·0tõ¹¦çuäyr*ça†ˆ‘W«Š€4—ä5kç™Ò‰£®mqÝvœ«~ïî	YsõùAÖ–±k¸@VÇhÞÜú&CÖYª0XŸ]`<h›Ý‚¥ÜGû“¾',½x¿'^¼àÛc\':r~ÅùòVöá¨p¿RoúË
:å^­Ñ{¬{P¯]­BÿŒ3ôÿ8òGðvÿ(„Ë\§‚E‰‡x'í«w(‹:}^¬•ð†MÕõ\ÓGo,†–@tS}`š=þ ˆ¢óŒ]sDqq°C-Ûäƒ‘ûqþêµ},|ZhU˜–òÈt]Ç½áí‘Rr»aŸ$¾Ëòšl–BéÈˆ»2Úim´ØÛ¹]e&Ö`2ûnžÜ‘“]ƒÎž‚ ­ÂÍ<øå.æ'‹ _QzS%òæÈk;û7íV@lß`"5Ç«HBZ9–™8š¼·‚ÒRl¬FªF“hŒ^²g%YFž..¯#óî¥¤Ô‹.cõ•ØºF«u‰y@NÂéÕ^Ïvé¢k—r3Á"z$÷òJãÐ¼¹»›ˆ³@dÜÍVë¹n•J‘{ò˜qø-D¨Ms(d‚÷5‘©>™ŽHJSß$RçüJl=O‰¢{xDe(ˆïáùþ±ÇbòV1Þx”añM´£{€EŸÎ8À¢}cp/>ïWRÖ÷Ôp0¹¯gK†ó†¾D¡T\{MÊrg4 wÃ¡”KR4˜ä¤Š”a(¤G®;'¬‹«ŠLWÎ¾¨HƒšŠRÆGŠýLf>_q_ôÒíŒêfÝþo'®­ˆ9£=šˆ{‘DÃ×	ƒà¯%
=•îáOÕHÝˆ•õ×§î¹"‹Od9îžþX4ÏÏèÈº\ÿ!—˜/à£ åOšVE¨6xýY†ÀÌz¦+ÒùxÌ6š°Àè±k„µ.œ˜fèW¢ ÿ…-R>ñm‘¤œ'Š†!qš$=Â®hp‹¤ž°Ð”¸L:¥@ò…U1ÛðSY"ÅØý¦áš÷;NË´³Ñlõ0²ÖÀ)›PnîwÑj­e@)0ÿ¤!"¯WYZ9D)Älmë_eI8Üw§s¿ÝßÎä7Åˆ¢œ@X¦tg£„â´GBb(¿–{®VnÓA*F ø-ÓSO`­D®)Þ €üÖ®e"ßÆw
›œœ†= ÙB§—h
7¹7u¦„±FãZ
I¿^S¶ªÓJøm†þŠ•%¾,ÜL'C)áÛù±™>—WPV¹zûæævcsý¸±²µ¾Ý`Ë›kë›×ØVc{þÝJ,ÜDÂñ!Vv]*	—nN=õ*˜©™ç_¯³@ß]g?#±ç®Ï%²ÌeðY¼–fz¸á‘\UºãY•‘ûOOÅ/OÍÉSw¿]oÌ._^^º¸’¢À#é½²aöºÓ1{È±ó”™ Ûž@’Ç8ý<³cð5 >”Ôwz25*~º2Sh¯¿$(ödæ€Ë
ã ½°5yÓÇRöQÛa¤‘\}XWI_f¥O™|/¨®…ŠŸæ¬Æ»|gn}×k¶³Ó—E³§\ÀÍ60(÷ËÉ†š\Ïïb¨Žk	P£Ë¿Š{7Ìn36t[Õ§Ì×€ÈÅÏñ7&I½Üè¹‚G‹¥„±˜¶ ç0"EÂ”8‘'R{ð[éñ4ð~/e²þ#÷ßOfÎ{*utO¹bå÷˜à)L,Êtÿ6Óû#éñ3‡Pc`IîáÇ¯ŠëM™›Nïp‚y6Â/W# c‚¹úð$è1:Bl*+oPþa´5R¹Â/õÉZ­ÆV–77·ékªb0ïèÐT•‹Ž{Þa·ÉF–#9ã²ïæð³<V†‘·l‘uÍ}vUüÌÛÎ¼15ÅHLš> Ë¡8‹Ýµl“"Öð0±=§`LøÈ:Y—”àù=Ó‘ó+‡ë­ê>TÃ–kdˆg†Ç®oßØ 7Å£Ù“Àäga?°ÍÁÌ7 ž¼twú^~ª4¹–“]1Æ±‰´vr¢¸Z÷eê‘Qžd¬U·…•Ôyæ½Ì÷ãõàHC€^éÂ¨%ZÐ^P5+x„ýüçl,/…Afóâæ4”‹Él=xbàÆs†<Q¾qÓ²°ÝjjÃ×€Nã“øTù¶w9óòÓp‹»P.ßSÛ´{Èe®|`€ê–Ù.Ý-ßè¾¹ƒàV¼*âÁò=ðS„J^÷¢<<hOW¡ý-ëg8¥-Ê_RÕêS¾FÝÎÎŒåå8Éèùšk´0Ewšòyd¨êdÄ˜.5_$©wÜl÷ƒ…,8q q{ðwûˆC»¦ßlWáÌYîYÐNulÊèYS‚+ŸÈ=:¦ßvZ0¥[7·¶ÇòòŸ¡æb!˜\ö‘0ÈaL«AÈiÉyR*—¼3Gñ.„üÛ¤GFQq…»oŽåŸˆa3! (íÅvK#éUe·Gž†TŽgAC(s”ÊwŠÓÜ‰I.dÍ¾H…—{à¦9DŒÅš¼-à‚Ì.l#¯mÁˆAE§iñY<©( iYß>ÌécdEg²%úi`{UdEù·1‘™Hö{_ÔÔÈ%R¹“Ò+(òùªJv×”D`a²HÂåôúc)¹Öø’uFbz£Hm2,G†Û »¹)Ž™‰Iqó \o•þÎ#mÊM2HOa½Ÿw„1ü¯ò¤Æè‰ÿ²ï4¤#ÁùU¯\5(Lç®¬E%2²á˜5	Ê«¦ëæ‘!¤ªŽmN’›|uìÖõ[”™yoº´ '6‘=À©«†mã[(r7MQOÎÑD?fÎö)¦Xà"sÓõØn¿KþF68IÀNõJMšÁª2ôšz</^Ò|rÓzem_Æå´DðºB•¨õ÷*¯™~ªåt2ôô\‹«^‘ŠúNk¡W»¬ø•áIUíg*Ã2.“ÖeõúÍ›lãæµ›©ŠþÉRäú´¥;Â&3[giWcªïÊ’2ÖbOV­œÇåŠ·k³3è•w9’kEgãÞ3b{-‚å=ª.¤á{L›šÏ;g™M”YYÑM¸³Ç<·¹˜ßÙ13lkp:ì'}•èz’Ãðûqv~ŠfJ*ZÝVŒ‚"Ÿ+Wú?IÞU©
²™I62dÇÆàTÒ(t‹Ÿ4O`ô žþÀ3dé5[Q‡W¼óví)æ¾Ô€¾–X›æ Uã/Ë«d&\Ååx¢Â	o cÿ|ïQñ6kœñ¹ü'²íRJ1ŒW(™²s!	SQ¡‡B–¥kkpýóÿO'YyÛ´˜îP‰Ç¨bñŸ”·Sà8‰ºÓ"P²Z‹•˜b¸èô©èé±:ÀœLýKÑã*M"ú«Q9×P,[
Í<jÍÃÊ×¤;~còîô½bŸ”»ñù"‰ZíÏåÕg… ^¾Mò¸ÊyÒá	‰FéMs¾rÄôŽ˜î“œç×›~Ö„í”õJŸÚƒD7%tá'8ÔÅk…:6ž·X»AÃ…ž+J£_¦Áã…ÿ,{¸¡wnop˜.~»h9ÿN=fbˆêú6¯7d’åå»{µ9
‹âeí—®Î]­GÊÚ­Í5V—ïÅi¦__¾t9Â‡K™C©l‹s)¬æÍS *²I”9¾ûíÕyÅÜ½!KzßéE*]^¦ó•· U›ät*rçˆh7q¯aÒv^;£„œ–Ÿê}†ö+Ë¼ŸÌ8®ÛÎ>«ç&'²€Q:1ÑqsùFƒUW–7¯m,ë”©äñ¹ ÂiŠÌ}PI™`«½$B*‡”NÂ¾X4SGXÑˆÒÌW†AšH­Öº*ˆÓÜQ†Žq1·§/wKò;0úlvàz}ëúÙ„ìÆK„ìÆdËOþyRö™sBÙ—×Ön7¶¶Î&U|SNôƒ®/ _|ÎM@úLÒóÀ%ê¥Áô5>ºÔ|öœPóÆúú&Û¼sc¥qû%½¦¿^eîµúüÜk•ÓGÁü‹Ï¹¡éWoÞÙ\k¬±Ÿ4–Ï(dÇÜD+3ÓõË/¼•a\@¹øèRù¹sBåoÜ\Yßh°)vëúÍÍÆ™ân¤;óé¾ìùêÅçÜÐöÆåõ3Åä<ÿXìö~Å'Ÿjëýe`yýÂ¨Àˆëxe´ÿz1z|×Í6˜³ºšØ Çà(¯c¸>÷Bîyl¼C+œ:|¶çG­<êœWÄÉD›b´@FçÛB§NÖs€I¬¹32£¯|‰õÈÁŠÏÓ®[=7Åb.—†Õ³÷h…
aÓpú¤FŽÛ+Ë«?¼v…¶zsã¦–,£åŠ™çJJ­hž’`4qiÎO]ªàúv½qivmv¬àt-G&
:Rød>¡Qf“BlŠ<,Šý#ô¨>ÍÚøG¡(Yd(æYÐ£C^ÛµºjÓ+ØÒ"¤Á€] Ð‰Pü@+>ÎN‰ë+€5=ÜƒÃ7Åož·"wÙÈN}õææ6ÛZÿo€ÜÒ±¬³3Ç·þm<wñGp"!Ýáä"Ò“ŽÕ]¬Ô/?g,VæŠŸ+CŸbK|Ži“œÉF#yæz×§?!BÕ&´Xé9Â gÃÅ²œÅN<ôX&\¢D%l_*õ	"¹Ïñ¹v{ym½ä%äSO$&“å‹¤(ôXÔ"4ïÛ6›vœƒBê  Œš­Å£W^)ß_ˆ>#¦e(„3QX±Å´A‹:Dc
js”ùkN"†Äò(ÿ¢Þœ
z}‡|JlŠÆ©ç	[r.–F÷` çìúäJ¨çA[Œ€Ã¬b•Áóúu)Bõõ„Æ2^ƒ‚{~˜Î°”j@¦'-ÔxÉZzšàU…O ]÷7]I+àzÕK¸q#@âžíã	|¯Êzvs¯nz—žâ
íz•)Rïf<HM_§–}W‚É¢¡½”›•N™ðÃëËy‚“y“yÒS9fäo+Y¡ó­‰§år¯	
œ|-–L-7®J7‰&POmgËt'²Â +2ïßG¢6 e5x.K|EIžg¦„(‘ù!+:¨rÍìbúÊ0%O!2³ð´˜æñJ:Že¬FJà<§‰-¶'z€)äÏœ¼[Öp¸…ìØíLÆt˜²M[H4ñ«®À¢ÙF±WÞ¨íCEœ±¸Ó­í4„%"ãæ	ƒX ÌòÚgÆ
œ>Ï˜ÿŒ%aìºL×wÃÙÁXä[mú2-ß›3åysaI»¹»k5-`&VaS0mlƒ29.sßí‘ùškÅ2gÇ?æ\CYÞ-ýú~bšAUF5²yº>;?cÜÓ®ïÜ©¦ŽäÉÜTæyRd–”˜'[ÝZ¾Ö ku{ýæf9ÙöûžIùÄF–â‡uËà¥±a†Ý]ç9%²()E+¤¶¨æ;5“{v”„kðcî5ãRýëÕæ#‰“”=vO›ïaõŠ<‚˜–3¦Xõ]\ÚU0^ÙWB*¾}^	'H½¶a:˜í:ºQ<¼›W}†‘lŸV}êò|´äU(PYß6wú–ÝšÀt.™¾&`—÷ö€Ýxhyð–8A¹çE‚I˜Ë¸;V(ƒŠDðL µÇ@`…mXNf½
šTVªz~³”W)ÁP±ŠNúýä%ËašQz{—–“y}ñeßà¹<áô5ýpuƒUEm‚Ì-Þâúï¶Ý¶<¶oÙ¼°ß¾kÉ]â/fÔ4|QI'£Küü¤tÚ)]J$s‘Ü°<ÝÕxè³0Ç¯H	<ÁºBò‹%:·PðÓÍ¾ï´L¯éZ=oÕt 8Ud£†¥÷Û¬cüÔqVÇãÖôÛ^ìh{b(Ÿ¾øèW¼<'/Œù”†ÆGð)¯AñäÅã_1Ò\¥&¾â•,yªÏI‘õEPò©T‡}œ™Uò9]}&+c| Þ *8šaÀ<¬>ÁxÚá kÈé%Ë»Óu|«iª»³IWØŠ0Ýšiþ\w÷9ÿ»aEúäŽl †Õg¼¾âFŽ;¬œû'S“»Š¦®þsÙô*ÐSÿKŽ!ÜƒXñÒ/©ê(*ÿ7½‚YUáj¸n3C­›×3Íf[]·[®ÕmZ=àÕ·Ô{b6)Û¯¶ÔFáÐó—ý"eQlÚM§ƒÉ8E '/;"ò¾";@šlIÿÜ;†ç–%×ø	á±‡ÏíêÓt°Í÷s¹]áÚ?‘~€»¨ô™¤Ø’Ù¡¶Nû¾¯îÈ2^`[|%¦Øu ]Ž{Ý—ÌP+ÉˆÊð·qð¿å¿dÝÞç)û´âZæ.Žá2g7²+|$´s;¡kÇô]«™ŽÅ;S9‚©pµú¥rŸ*wUßÎw_l¤,©óø/áŽÍµc»&¼
0¬nÚªGíUqƒŠ3ºfwÏo{Ñ}i3€Õÿ@É‹¿/g÷\>÷EÊýÐ<ÉÑ®ÑDFÊ2QK&+y‹z>¦ÛeÐq—n§nN1’„ñœBóåÄÇ'‚
Ç¼ÄÑ'¸c¾àö|”W.¢Vƒf>#Òö§Z²Ùp‹æ‡Ú" 5 Húfäˆ¸†lLiÐ
“b«±§‚u	ˆCìÇ|RŸHÚKó8eoÂ¨ZmÇììÈKT÷+IRþVÖ3º¦º)ˆ‹Kq?Gô4ê3›—5¦ÇpEìæç²æT¸ì)5¦Ã•¾4ÔJï¶mä‰)mÊk‘bv#0—!\Eh7µ}•²¨«F§×qÝ´Í—˜Mq$ÃBl3ÊðÈÂ¤-jØÙ§ôý“€ÚüîÅGÿ“–ëId9ÉÒàüÅ ‚÷§ÝùO¸ys+üÚP+ŒÜˆÕqº–a««¼^&‚Ã­ƒ@x×2cdçA è/RqœÏò¯üöb°ô+iP<•Ýã<9wÄuÃîwºÖÛë_fQm^Û2æpQÁ ¾TNât|¸¿&öö«Ð<‹;ú8É „3Ì8Ý/Çp™îÃ§
|éF¯õ­úâæñ§¼´C>d"ŸËÂt’ÀJLÄ€n~ÎiUÊm£ÿ–›b,$í
fwOŽ«gÃ+Û«û‚oLÚŸÀ#EFxß­£4*(¼ çîÈëÃÞÆ;ên\]þ[n6¡i‹ä)eýŸÓ	ÀðÏlÞõÿpxÿWÒÙ/YZOYô«®ùNßD‡fxèY¿<.r“p·CÜÚvû6,¾·çE–X÷IP@¿|,áüYžÓ&½Çg6¤ŠcÓñEÕXÓ{:nrÅY=Srí‡UðU@ÚD1®£TíZõ˜G‘ã_™Yîý‚D¤QÇ­YªFªDêMÕÇ-~e&â¸Uñ‹'æ£:ýDNÏ\®<eT‘¦uJÂ'»&NÍ!“dn;; ›ÆCk3
L¸Åk×ehYŸ?Rï»FOøívüÚ|ÂïOlÚ<yæ•#ÍÓ@	òdRX,.ˆ62TGXC•n#rWÐ†@éò÷¸º…“$?‰·Õtà­+[¢øgº—]>I•G[³mvu¤†k<4mvÃÚŒÚŠ±ÊCbÀ)%e9üöSNðÅ`×Dí›aF‹šd×A1eÄXîe5ñ@È‘¬h\ö,Ðo=“§Â£pÀ« ~3X@Ü–©ŒË_²¼Kºâ8>
=vg=6Ô'â€Å%ý€ÉŠ´ŸÊ³‚ßx?gJbe ™ã¼7Ù1zÕ*Ož—O_G%þÀ<\<ò'­V>ÉXsŽTžê­¯9M UìJ;ÁÑÛYüjHšBw%±•V¯!ÅNÜ‰6F ¿S¤7”i‘§Vx¾à%À2´0Ãæµ±ÂVÂVRN«ú¼rZå7vüvÞ^Ô9	 ço&w>ŠWLò'âÀTÄ÷ãbOöâ3,ÛŒ_l Ï´¿®:=O6Ç,.™ÙQ“Þ†õÏ2S—±Ó®lH´ÆzvIõ8¼«…Ø#ÎŸ¡53â@5¹
´2º Çûfm¨\ÍêæY[i—þùÞäº(S>Ž¸É¾Ân¡™µ,PàÂ­nÄÎØs,8C%¼ÉBwñˆ¯‚ E)äf5Mµ£?NØWÃU–¨¹LN²ÿ|ï‘¦zÚ­4‚…¸³RÛ^^aõ¶±þfƒ5ÖÖ·oÞÎ¨‘LJø
Üƒóø#Ü:ï‘¸ª\Í–]Ó`U8¢[/–6ž–v„:+Ø¦õVÞHÓF˜` òvh*
üÎÌôôÔëñ2^ó,éq~Vœ¢õ>m„Å%cœ£Ã®Ãtz;…©Ð;a>·¼‰×ƒi„òžs©'¥fAÜêÙŒ€)­JP+¡‰Övš’áM4ìŽÓu‚Ý	vº.‰ÿ‰´Îø<á1ÜçN«²” /“ƒf9Õž/|F³¢U¹zVI"ÕˆMAªÂ–²œþT:F×.E ¤hˆ òoQð@àÐ½ÚQE±ôÌH#²Z05hE+9.™óÑ ¾ÀËòí2næAW:¥ð£øk<-\5…¾ÁsÇÓ(`ïø'ÍQs+ÑR<¼d¶´dé¾–:)((°³®þà„g.á«Y¼zHPX±ë%@bR[‘æ±R•zù_q±û¬BêÊÈ uå¼BjÌO0Üx8M¿¶P¼*ëÉ¦L‹Þ „»0€ÓÕØl×Ù÷ftà"	®8â‘ÐUÞÐ9Ö¯-@&Éêi%ü‹ðe˜"Ã·°‚?îCÚÓ„Ü‘ÐYÞÐ9…ÜsBf‘V¸†¢‘†À©›%°˜¥Nkk¿VŸšÕz³$3í¢ý|³[hu÷]o¨3]&?œQéRo:¬
~’XDƒÔ­Y€HÔV•Ï?ŽNZø„Ÿaq
B,½5ÔP?hb.r?4ˆÀšÈb"Ly'‚¶Î^"R3 —ÀDAWf¥¶'¦˜‹Ä‹U¿^©±ŠŽ6öH4§´E:ŒòJ\G6Î\Óï»]±¼p1jaðVŽq†‘˜¯îî½qn”„a<‰~‰bxmÒj‘v;9pÝÀ|‚%JONâDôËKç¤¤èY®FJmÄü“Ú@-5’-•“pd'Qü´ËË©~´Jë–Wð cÑiõX«³‚“@ŠüjÕ xŸ`;!Ü‹E0&iQÆYM^ÙW´ºE°VÉÚÛÑ€-e®Zë§;«ô3Fóå„«Ú-ÅMQÞ^ýÔÐ—Ò5i½cÙ{^ÑqWµÃZ¡S~²ËI§]7gv‹‚®“‡h†¡hä‡ë€yÄøGÍ#6JÃÀdYtñCV]Óp›m‚ºõáÀfW-“7±£\ŠùìéÄžåTñ†]ÓæÑœÇ×Ê­[°ôúŠÛ¨ÄëG}Ó=,BŠùGi¥¬&¡8b¶A„4ÝÅ„oJ…BdHƒÃá1‘b×óü‘œ°IÊw´·ÂXEÀF2ðwçø	ôÂB_`píá›Cåé$'EŠ—âZJß¹ã+ÀñH(rÀÏi‰A)¤¾7v<Çîcªt6£ñíLËm}xaÇ†ÙŒ„–æ.Är7< ;jB]C‹¯"G‚ŠË»k;ûµ¶Õj™Ý"}z’:ê2ô5èç fô}§ˆ¾úÆŽ9³¨	D†–­–Y;”_‚A†Ê½T÷–b5‚±½ÉÜ D%¢`™™ð9-QÏ¯©£cô]-mŽßNc†f%òðC°Â`D~{±rz¯,mm„@¿=\7¡ž²Á½Ê~hŽ¢UaŸbk¦oX¶Çª+hµjtÇ‡o<ueêÓ|i(¶ä¤ú¸D}ÜæÌöÉNd™“½Nà©BhÃ– %Š‡bJ•§â(ºw….fZd„%ú%Ü%žs`-Ì+ÉCYª(*IO8çÚ£wèH_dÉ&'}gÃÙ7ÝU -Yicã1ˆ"ö@~¸:)ÚÑ¤ÕmÚý–éUßáûùÏK´ÆU?£n±1²IƒÑæ ;•¸˜ßÝý­¤õW´`zZ!-9ÖÂˆŠr‚Ypà,0nÏ)Œ¦?pˆñ¸	gã¨ž›û¯*8ÕÅÊÎŸÿ 7D'[1Z”	zsÙŸøP[:TVw<))ë­.‰I­‚´tˆŸèÍÉ…“ºâÍH)õˆEàr*ÌBÿÑ&i¯¡˜ÉIQ–ºÌ¸‘N³:>§áÓ~«À\¤vØÔ&  rÛËlu†yZ»ºH¢Åd®3ÚºÀ¥9`++É‘³…‚çæÓƒš>à#Fþœá4Ôá¬”N>í µ`®_j±ìG×l¼;~kZHäÀ«uîN]ç¨8T—Ú>Š[`’ì•™e)dÑ¶æÊ‡KâVÔel«¿ã“/îê¨‰k(¨Ý­×qmžG¬†ª¸³…e¤jû"^ï´2½KŠK{EÆC^*øÝÁ<zŒ&ÌÏ¯Èy}<èÆâÙ?•Í,Ù)ÕäÛœZ+C|KÀGþb ÷Â4F9¤¯IckÔQ–¤‘½$_’Ò(ÃH¶ÍsH®ðH¬3ÀhêÃO9Í`øÀ~†1¨—äÂÖ¥YÓl}cz|ð]s_ÀÀ"{Å›äÉ*ô„·dc¶¹g4hÞ0z˜§ù.+žÞA÷äv]•.c”ÒM¦vktQÏÖÓ·d‡™iLI:6LsAV,5CÖ0òt‚A^Áašé›ÂŒRC­›ñÏô2L#<dlr˜¦”NÑ„NC->O&¦1ž4È{*›*Ý’¦ÿ„ú‰a$àœŠw9Ý¸W¾]¤>a«¯¾ÊRéÝ iT®ñO)W‰äø„šÒ}°4ƒƒ±»Áª)Èö@•añƒwôü@†íH:{‘W˜<)<¦J£BÙ1H÷¢rýè¹…ŸQƒú€@>ŒgPø)i?Ò0&2»/2œ·4ý{"½èyúÌêyú(.TjÞ“ÀYCU¯ñ¨ÛútX–=–ÂDêÕÈˆ(ÄéÀ]#-dÏpÑü”ÐH²VŸ'"3£ix_ÃL¸)^…©QâËÛü¢È~"âôëÆ¥Ë÷ÆD"é\æÀËÏ\ý”–àÊq÷Ê¾‰¨Qm</WD£#œ øPÅ½è¦íÅk-0r™W•ÈÙ{Urcâ[C]PuÄƒÚ<íz¥Ôî”ÛMþÑõÇVÞˆ‰ÿbÄ¤ú£·ãŠ9ÒÕdšÌ‡B˜Hn’K€$´1ª®²$Ú”SùEFS«AÇ(÷å¿Ë4ˆŸÉ‡Ó0yê§±qøžöæ3ò“z$“N¾Kï\'7o›ðs¶ô‹ÜpËqÑÍ•-»è¼'ò›y/U[ÃõlQ<½2dâ~4ÚZÊ«lWÚ0Ö²<¥ÈØGð7]ŽÓJóÈW\ésØ¯BÅOia‹wá›·.RwwiÆ÷¸]«l“‰"²«Ý°Ò4Œ~OÚ_ýðÅöÌìþ³@›G£ …Ú@'˜Õ:+“ñk"Dn±ï±ú ‚R¡0 –ASöèpëY+I¬¨6Tž?I.¼$÷Ã—fk%E,‹›ù£vš€ì(n3êåhÂ¾ÀR—°gÇë|ëùÞÆ?Ü²Q¹²;½2ï–cþùÇg¥Îì²|ÜY8<ŠÕö6Už@êvqÎ~
Î™ïâœùÞÅ9sqÎDºø¦ž3£?NÖœýRDµìò_'z œ¬(|•GïWòu5“§Å†
»ui…nJR¯ÐIkøæasáš©pÒ½bÆ†nº‘hº1Š¦yÞ‘Àmò4”âÙž¦<~5VÊA&Ihj¢Ñ×¢XaöÑ¬¤³óÑÌy	*J$à?¥Øá”¼­³l¿6«c«´CÚ3l¬¼"­ÍåDTóI­P¡â47ÐoÅS@ÖÂ:‘mXtÈÄ*aˆ[4in¾~0%O²÷ %Â/’Ë'‰ZÎ2hºwt(ÏhºøFÝiÓbÃ°rðMÇÛ‚cìŸÿýt>ãÅqo›è7câ|Âu“á¹[—ë”{¥oGÝ=¿<T“õl%§t]™Ï|‘/æÛZºâùÀEï-ÅJ×¢ß¿Á®[{mfu Ÿí¹¦I
cªMÄ‹Ñz¬g5ÉóˆWk~‡TËX‚KÚy¯ÇÖl;.&P‡>µ¥VlUFtÇÝ£ŠÏM,Æv•¤÷¼@•HÞ.*À24—í<^öTÀvÛdFß‡Y¾ˆWŠ—r?'`ÿ{XJ¹K«e˜dù}ž—œõÚ–íxüSzL‘ÂŸ¯ÊÂŸ‘ÍÂ+°6œá—Õ„ÚåFë€Žý. ®”oÍ6–jæ%:KŽ'ZÓòÕ°¦¥2¤5kVI ¯ë8*’0ïÐCDSÊRWü PZÁE,»…j™AeHt$Ø‚&k|Ûÿìa1SêaÊ»Õ2\+õ‹reªŸ“ÝM§ŒQÚ-œý3lm¾,o5ØÖêõÆå2yûEÉžòöÇóÕk‘çÒYëžà#š´>í4â=DÞúÊÒÃ­m° ÈPX¾èUQ¾¨8o{©˜‹pú^ºƒÆZ,´Î÷]OûDoE3`8©~’ïûþ™†¢“¥0íÈË,[/tL4u*š´ÈÞîÃŠ¬Û ±Z€¦æ[oÉyë­`g<åû÷¿•ýß¾·ÞZ±û@±%N>¼Õï!Qxë­«TU×“/}ÿ[ß¢e«.P@ó Ès~›ça_ðpá“íõwl,ÍÛïr/¡~¯ªúòÖšÔlu,²¯cá{Õ`Ðì;´ÑqOE~µ¶dµâA¬òwc®Ž‰æï?0ÇÆkKý®õN?ù	%Ëû;Ý¸”–ú˜™ù‚uLþ¨ÉÚf\Â'²F‘|ÏÔzÅž=Ñ'˜Ûû<´ß5«õŒ7wàÔ5.¼I®ê+z\°TƒVkbVÇ„:=O}B:å§‚PËÙï¦QËuzë»à¼8(-¿]$wyÅ<ÇlÚVo²É}8´Mªabg¡-~SáTŠ¶XMš¦—Ò™`3ó…:Qýâ‹š’|Vö«ù#’ý*3YMqñ¯Áë/^5:D§÷Bê[•{Œho,%:’c×ë‘ÀÛút²¦N¬j‹ˆe‹¥;IÄ¶Å$RÞW¢k¡$TB²ŒxAÅÎòÌ„55Å’¯Z¶¹€œ9HSà›:€Ï}þ?îGð÷>Ñ‹É^»WtÀg„´R´^Ù³ôdúJÃ£ì'ó/êdÇÍG‘”QPæ^âÌAz´×ÕÍâcÜƒ¼“LDz;½¾Û³EÁ‰W\AÔQå¨R&\Ð >?¦ Í¢åè÷Äð«ãÃ÷?Ð$–íà'Ê–UŽ«yS™ÁwcÇ­˜×D^ &õ)—K‚@Ÿ7ìþ¨
ÆãÕ=ÿûÄ)ž@»‚	*^2•ó§–4cùBì*kNîMÊ@%à˜E|~ãê™± È°3•Ü³œå÷£]O2™Ü/§ÎÙ˜®9ÄteL6¤–N9©™‘|Q<¯˜àY…Ó×ÛÐ«pœ¡E0‡[5ñAKf ;ùÝ–R¡…RÅÆÈT¥4˜Þˆëx‚À×C$Ð|á¤Í;f"ƒÙI-„r5‚KÁ­ ÊËi”@g9ÚÎþÔun£¢HQ
Ôùã^:¥ã‚~&”™ëÍžÐBS›¬gøí}ãðÑ]U=É9Éç€Qÿþ(˜ÉãâFà×GÀ²¢òåŒ3­ªhpÖu8ÖP{ó)jà$m+³leyõ‡Í5¶qóÚú*[½¹¹}ûæÆF£Tqä&´±Í$}-R=²b4`ù™ÕÛwÖd\,«Þº~kü$-·0ë6lñ€Yîõ¦®û~o*7E~˜SŠ¼ÞÔÑÅœcKžÒàrå˜Ù·ó&Ä…yë-\™·ÞR–æ­·hm¸%ë‘ð‡òÜèÇ†›Êª&í0¼±Û&ˆž_R7"Ðš(—Òm/ä~Ñœ'0¡-ª/,ãµr7€PixMTìï™¾ª±Á÷-s¿:†®ÝIéî>!¯“4h¨é›E`ŽñÆÆsµþ<Æ½*–„}Çå_&Ôq³ïôÂ‘y>4l‹bäa¢òÕÚ’¼Z½•@\E0Ã§-×lýœ3E?ï3óó±¼"ÌWæ˜<E¯JöI¼š÷Š©÷Jt£ã¢ÀÏaÃêaÜê=ekÃµ»+Ùà{‘Ul^h&RÞSö¢¶$¶/l,	<0€€×ÐDü}o qî	Žà'wÚÒ-#29–?œæÉ(ªZ0¿$[J»ž5ke
š¸@Z âMœáO=§[½L·Tßð%Å+i}Þ™I+JËšµä1’ŸãÖ™4n%7Šá~_˜¹¢#.aæš©,½jûßcp³‰0Q^ƒŽ~•àŒÆ0HÞ#Ñ´Â Œ¢}ÁÚ¨œÍ°Í*L^²DgÁš•ÊŽ•·e%ß‰ÅCCåRŸdk–×³C¨ÒñnÞ4íU/áBâñƒ¸P'1Ð1ŒÎüSÈìæ¬ž­Í2r©/"×Ñ’qþyÓRYoóæÁ´$‹®³.1åÉ S‹‚M±òcX=PŒ$3“ì1¯Lzd=×é™®o™ƒ«a‡ÄÎRKD)%¥Rå*„ïP´•ê¶
cVF¶ˆÑx/KZ“ˆpÊ30ÏóÒM„Ú‰‹²/wìÄËŸ@êU’¢ššaîŸC“uü(zE‹Ø÷îÅ©ª8Ê62šÓ="ù“oHR‘r*Ë™TÒ•ëið+©j4I(:J0O‘’²¤ø™f‘Ï(Ÿ1;É–j(6_–´Ùš«—Åe¨z3Ékœg‡û\xëdÐMhðFÈ¨+Ê?ì€ëÿJãM.AOõ=ÐÁ´(}d¬·	îå5òr-¤slecy­Á6–róÎ6ÛnÜ¸µ±¼Ý(cÝ±–yaZFWpQØ¶Ùé¡þŽ½	¢-«^ß¾±Á^e+ŽãoeôØü‰G1Íð¸Íl’v	-ž¡ŠDŠÐ©ÐûXDi®Òú¡ÆªŽÙÆ¡Ó÷½IšýØø·~ ¦\E’áZ\‹•&ˆ5l ~ÅÍ¥AÄŸ¬aÑGÔÛªøPÝ® a P‹•ÎNMìÜ¾IE}y%—h‘Úw)Ê$A5%9ú†«¢‘Zàˆ~pW"2ÄäJFËÌj«ðÂÒñíÙ•4ñ™Üª§øÀ&9Œ®Ý=Û B¦Ò—0ï¥¼j¤É´©:¯d¤tøÁ®ãbÔu5T¾RádÀœÕi-Ñ[µ¥ˆxÃŽ³3XàkWš ÈêËÇ5½Jwó[ÞÚx6zÕì$› SawÔÍ¶Ù|°ãT$¤aFê]­Ñs•°ç0#1Ý7[”­wF’1ŠÔñ¥§õøà¼Ø¹øÞG÷9’¦C –øÛë=¤}2 HeM“ÑsäÂ,y&Í’|“ðt¿°DFGœä]$c¯.ŽèbGÇè.Eè~SÇ)†âqJŽBw„.¢h£ÅÝ/ŠE¢;¢ÏÅÂQfr8¢””FàV|‚ƒ/bºF;9àßF<—t>P}GˆC¦p„»„èl:à'´µœ/ñ “ÌöèL 1bÄím»'Ðp8plœ‹‹üÂ‰öÂÈiu•!ÖœV÷\@:¹ÞxË£†1ÞÑC4-’‘ÁÚµ“ñ‡s¤Ås‡´èG•££Ê1ØHs^áÖqå˜oÓIPèXðÊ»éã
åbeTòñÓb|XRäæCB±;í³{Ê+yË¸2 èEeA‰S_*¤ZÄtBG¡¸±E¡,Cc!vïä¶íd€b(ªCCÝËÈƒÁ‰v&ÏÇ@g®©p{5ÖIš´ŸO3J¡AªV«±Ë›Ë×ìþ©^½³±ñvõÎæêöúÍÍå¶ÖØZ¿¶9NO¦Y§Ž¤9c«¿Ø¦:FÝÑÀ‘i¡Ê²N]ŠéŸ¢Öž×peS—#ÓèvËªëÝ]‡§æÍ´²Å‡„*ž±¿e™0ß©¹h¾é ƒyüšov2w¯|&®J*îâV´ d`¦–'ß|v¥=§Lãÿ  ÿÿì}msÇ‘æ÷û%Ø!¼Àà…%aIê@ ”p_– íu0xbc¦isfz¶{†L#Bö…ÍÝpøüÁ!+ÎvWkŠÖÉ4ÍàYŠ¸ "î—(ö—\efUwuOUuuÏ Hô3Ó/Õõ’™•ùä“ªeÂ•lÝ¾DˆfÙfÿ&QÛfxX±ÀG4Õ÷5…ä>EÊ†¿}ûøÿ&Dß>þæÛÇ3àw "?2øN”¨£rsð-~ù ?òŸ¢‚XÝçj>h°Þ¿aaì
NÍ8‰Š8²ÏÏ¶ÎZ~-!Lh™KæzÅêÅ.ãÝôËï¹ÉÇøù¡Ú™žãgþ+Ðg<þ†N~FWNóO¿ÁÞÿ†®H¢_ž|ûøçÈ¥×¾|Ccü¯ßŠƒg=ÁSø‰dkž1eˆ~&É9ž%¿ÑéŸñÏîCõáešóíg
:…<±E1¯Ù$A­çÝó™pbü5žf>?‰]0FŠxlÅÁ]øF¨DÆ!üÜðÚí}ø1D6Ñ=;ï¹C ¬…O­A}ÒBýmÖvM 5§ÄŒãRJ7¹å­”$É)ÍÕ“²—–	ª[´_É¡z†ó&³¿à‡ßÓ0ãzÜ€Þç[ð ë;È¶&mžú¼ìÞ‚&ƒ .nÌ_¼½»¤|\@	wN½|Ð6{¾Ý²áïôÙ&—‚K‚ß|0Ÿ.CAØðóšiàóMæ-ä›÷ŸQ*Çhª8Î/ÇÒ:³	Î£,šÃª”Äó·Yo{æä0ÙÅXÊ¹y«5W+ê&Þ€ëíA¼D}/£ ¤Š*ûÝ÷©Ê	h–õ¦],Á¡/»šJç/äJ(Ž%b]È?\H8Å­69Ïúº­ÝQ¨%&ÙZæéö˜fq¥
»$JÜÏ©ŠNé
8iÕj…}‹ªðëà‚-¨Æt©[s*è¢^³VîšÍö`·Ô+¤/K6M\U¶q­po½{…ëP[°åB¸„jÙä‰‰mO£¤îIOT7.º°°àA=ëÀk‘ßÄÊ_JÍø
ÊØlïŠ_Ó˜=|ÆB \•ƒ"Ÿãú\j€NÓ $á$k];¬Húÿç*¡{›õO6á#ÏIÚxÝ†ß.6Õñ¾%l,5f\Ê¾ˆ@.»R^âlé‘âj,m(N¥Ç€ÕªH¾Ä.äbûW¾Cö=ìbÜÑ‰@	üÂ{›`m$9­ƒBð$hü„ýÄpÊ´øòð£ÈçL~u†ÅÅ“ÝÞ¹ex˜è§Oä>ãSz/üûsûÔ¾çµþ…û½TìÚW6×-(SÈ•/ñ=ªÌöëÜ‚Üõûu¼qA!#eP÷È—˜…ÄØKëî„AœVþ“‹¾½+~	}¬¦Õ»~n¯™N™·ù”±u¿eÍº,V³èM¶ÌwK31×3'p<ÀòLz¾Ñ-F|éë)\7¸V‰ ·Oe©`:ÄåæÿZÙùÏ?5ÛòZúíu_„I?ËnÞØ`^;ðÊUó(ö4m¡ŒŠú
è_¢þy¾B)­ÊêO˜•XY?C9îçàÌ£%½$:l#èÞå=ØoÑ’rPözwÈ;Ãþ·v¸'6–81ºàçi3¨¶4&.â
‚%,–ÐÌn²„\6&Åk?7Æ òcÓ¥ëÕë¼í8løÜ‡YÁJ?ìÉÒnYO£
7ãsââ¬S:È¨R*'§´ý[TJQR0KŠlo“ŽÆýNV6ÕûáÌŠ²©ê‘­ÍÞúïÞÌOæfÞ™¹=»;•5KjÄX{æëEã”e8¤©†×s‰¿†Û>.v·üèua&Y¡Ô•/#s~;òÓ‘Þ§¾â†Ú‡Uà&']ð…¢%Yb…¤pü‚Óƒ&û-DõÎ€çx¦Ñº[x‘‚‹¥‘ì˜+/tÏ,ñˆ2ó_xÖX&¢znNNxHjWâfs‡æ™4FVj‹ZäÄ#ÙêwÚ—ÃH×ÓZÝ	Î€ÚÍ“/3öÛ~£Kµ°Š³Nê"ö>ðÃï(Â…ÊF	’Èp…]ò"Kˆ_ÝA5¬g‹RX3Ón˜dÔ“½_˜[x*~?“á¢g¬†"f
»ˆ„|v2ËË-i‚^®ÍNÐ½01_Bµ%Ž«ªË7õ|]Å&æíp(=_E‘	WÓü!Úãj^ÄKÖ\äd«QØªêã¼s%Sû¡bj?¤ lºQ¥·qÛ’³÷¾j‹á­«ùK„Ã5;Cªéu÷å†q|©N!Uk Žœ ³~ uáÔÚ2^@rŽþ†Á¥›–zrÐµ=ûs|äßññÃX×R3ä'·†ðMÎ³ÑV©pÀŠà»y·Çu¥ª°‘ÐÁ3¬~Yù¢e=³ÐJ/ò=ûªŽÂ½øÂýÅƒRžÙß$v	™*Op‚|%Ã•/ä”y„D@t€˜Jöÿ¿£Xb½^wvQ%¨jB'_+UÇoƒNÛ6”èªÇäÀ}ÅÖ•Õ—›,­²ÞÜC[[[ÜÐ$Vªé£¢’XËü
‹¦´gw(|{ºh4ZŒƒíNÐgËDgt	cöESˆ;H0ä_ßôîaÍC[Ÿkz|á^æäï³ógÎ˜’¿óûÞlø¸9 â‰ à·¸—³@, 7ƒ§‰¯Æ×³ÃO½{ =Àžr°¨Ç åùJÈ$a^ýýÛÇÙà«ÑÂŒá5¥ =_È0*iã/‡Ÿ}ˆ¾@8#|lÓ³ckÚÛ",ÃHI@ <¬ÝeÀ”ÆÇŒ
Wâ½õŠñ²;ñÃÀám¥8Ga¢ñÝ y:³ E«á¢ú	døEºU~ü”ewÐÂxøšðtºiã‡*B¦YA»YŸ˜¢ÅD3a}ÔÝjAço…}¯½Äî×d–~·ÞÀ×¤ÅñÓŸ²[·§êm¿»Ûoà«×bÛz/^Ñåø4òtŠ2Ò­8cˆ¸{??Ý„VLìRy;¾ÄÛ^Ï
v¦ê)™ògEZŽÅ¹Ü0+Ë+Xê˜V`ÑEéb/ÓIÃ3É,/cLo[ëÐ³ú°..BBP¤"l°ZLTQ.­¢îÌqŽ¾rlá/¤‚ýTš£+x6unÓ~! ŸñVO\p£?<gzv:4¢Èmâ$bu§çëÉœrg¯"óRßƒ¯u>gö™øCˆ¸â`‰«ÄÂÞ˜#Ì¡‹ÞQžÖd\6lr!wáþÙƒÜ¨¼­Îk¦!2›—Ç3v5dôº”¡Â¨–v“íó=X‘b#ç_$¿ÒÂ¸¿à}­$X}óíg\úÄHQ–;«°‡§À\-¼Sñèw¼^­ý³„¾cØ¹ß–äô]Ÿ¶Èõ ™Þd“$e÷ì¹€–ÏŠ0ŠÙ.×P=Ç±U¢â6‹ qÙ†6óò Rx@"t¼göfn-ˆø™Óí4†f!¡&7ûÑ ÛðúÅÁMåó2
{ºO@I>øéÇ"×„Òö"öKë‹ˆÒ ¯ @óN™–&ê,Í-€?:!™2w ÍPq&Iz”NSPÙYöO~5ëE>ÔaßÔÜKl­‘µÂŽq‚Tš|þÜ¨/õ °Å*·Â÷ùÝj }õ"×+÷ŽIÁF"k÷ÀçwuùË®¤ßÔ&E
Ÿÿ÷·#'§Ù}áŠó1­%ÛÏØ^Ðå[Âz3à³÷!=QiOÉL³…B&ÁÜ%®K\&=„nQ4[=2éÓ°sQò¯´¨@=ÒÕwfNIvçiDolˆz¸¯@¾×>ä÷îzmÄ$fö­àVÛƒ²”:ä%dÏw–vnzgm…–³ Ü€eB¸22«­ŒíØB”& %ö×+;^›oŸ\,¾¤U†hÅ\¡÷"wŸüv>è¢ziHg¼ËÇ]JÇ5Óð~š§D]Ýž7ˆ¥Ú[:"OÈïe²Í:¡‹
E¹.)©á†ÃÜ¸ˆ»·%1	:æ‚x–ƒR&AIÂÍFMn]bR$L¡Y»£`Ü‹ý<ÙC7èÏEF½Üþ
üý Ùô»%Æ»Üh‚ŽäMAˆ9(Ô¹ä5wí9X™gŠ\•% £¢œX2Ì“ÅšŸK¾ßULðé­¹<	}Âe¨õ-ÞÄ=€‹¥m›ËòÈº½ »[J…ÚÜ¿¸L%SÒ/7ÇMVS–_ú4<¾IŽ±oYxPt¢dŠˆá’fOÚÉ<¥@ª·ÝØ6®2Õ#dp5ä¶LÐ‡9&ˆêtI~Ê&µ£Å×e6µNÉòê‘Û‘R(2ãW ?¡ãÆq$é[$>iK"hÑ“-F&"»Q‰›Ú»/m7Â_ùLµDkå.%· cöU¿í÷ÃP·*ÃNwËÀ‹ÄzM
¾’eÿòG}+òâÖÂQû!ì<]|Â\ªa
fÍPy	í)iÁ	ý	ÅŸ÷ýv[2+k³H’ÁúÇ˜w[
0×›9ËÔ(a¾þ‚©Lpà³<ãœtâZAéílF†	™  ÙŒ3C_Ò.Ô÷ÿùÑ$tŸKã—˜ÿO½/3!")ûc’éŸÀ% Ã÷)þDÅ.A¥Ûë)_º§ãhµZŠjF´u>†y¦Ýà.*¸5‘’
-˜iqrÏ–ŠóŸoÏÇý(ìîjmäÇØ„Ôý+öÜßZ=BM’5Çmé‡KÔQ7Lw¼Y›|>„Q	-iz„vÄ2 æk\†‰‘©\þ™¨Ç*â“þü;ŸˆØ¦Ä?‘Ï'ËzAæ(â`ÐÞóöc¶´IÐoIðø›	ÜÕz¹0n‡Þk Lª^±½0º³mßpË‹ïaöëF¯äxP îçZµÔOCC¬
äžº?%Èíƒ2‘O›`àî¡ñ†Ç‹Q§(úçL²ûý»ÿâCŠføù2R®1í|¯Ï•à£ ù£ÁæW‰1Ã¥HMÓ³||3¾|#BÌòO ‚”OTª„Àþ$ŠU¤}cBJÿ<YF †ýnv€òrÓ»pin”¾”¿=H L¿F	ùs)1ÿÄ†øu²ì¾¦>Ï¬ÑòÇ_É> ÉñlÆ§8W_ N÷%«ÍLÙWeî¹r¬¡cbÖ@é8ŸÒôgPíxí·\¡ða*ñ˜AXÖä6‘•õâ>RîfŒY³ø½çNÐ˜‰÷¡”ò žY˜[87å0ÚçgÈ·A¯öWã…Xz7¯¯­­¼_Ž†7îù~£efà…ÉÍvÂ1' p}tÍ¯CˆkýUÇ´û¦ ”=½¬ï·ÂM?âæµÉG2óŒDßŸÉ;™p³$Y˜¾¿¥¹þµtbò‰þsº81H$ý‰.ü
*ŸK}ø$l9t®ÈdùZ!7ýÿ÷‰iÓápÇ‹Á>z“-Ç1Wë^·Ï”¯i`øÄÅšÄLThEõ!×{ìýÖÂÐï^³¹<à[Åp·6Aæ) ˜ùÝ•ç‚¦³4ˆKÒˆÛ.ü‹¸®¯yvp 3qÆJÙ\Häùa{)Ïp®
w§òú›ôú%ù:`0 ~U°¶¸077ûÎÜˆØ`À£±½ä`Â’(zˆ;÷+okÑÿN$
ÃNã©fýÄ™ðŸ=..BCÂPUá 8Æˆ°†k‡'Ì¦ßØp\´o°±H—DË-‡Nsh9ØæÔ¡%õO\TúG-»35öT|'þ‘
¥Éê$æà?ï®A#/u!œ89Y¦¥Ï“Rõ\Ô#¢ÐîÇÚëuÔ¦ÓÅgR‹—Ø}yx‡i–y‰%–K©.|ŸƒJÜ6/›¢k4€£œûiÝã;ù×^…É¿vÒ&ÿ&øKžá«~ìv)-õØ
ùfÚÈ“+ä3/qÂæù+-ä3KàØÊzeúœ\YŸy‰¶^’¬‡MA’ÁZ¸%+šöWü8Öq‘¸Mw7¶É—p¶h¬,³½!y>NêLO^à„Ír+RŽœáÕ\å4À‘/‰“+ü“8iKâH§}Î¹ÞÉy³×½&{Stíˆ6Ó²YÈ.›!ÖÔÙ‡¼âQC¤‘÷ÇÙ÷
sçv×[a?te…Ôáðàð±±¸³„GžÌ»?íž7ÝÍ[3sà ËÀÃ4H’ßB°6‹[QÐ½;3Œó%/s!+‹ôO+JZIgb_:Ï]G½xÊÝó€yíþ%~2‘í)\¡b¡†Ûç#uÝ]0Q®@Ýó7c?Ê>÷mþÐ·KÒUà#‹äÞjØÌg^ºB©?\ø tÓÚÅg/./¤Ý]àË›\ BÆ:—÷km,×xi½Y›lufz0U¨`ðäÔ»õJQ…* KHúy+UÒ™ÅOK•„R?ìè©R¤?]:Î«'TM¨œ1ÊˆõÂ~õíãO‡Ù‚Ä­Qå8¾Ë`Qa¹¯äÉ¥ ­åçðÐ,¶O‰md6}rï¹Ä&&¸Ñã`ÕÈÃ<Ù±Hq¦¼|‘ä%á§sY¬Ód¯4‡Ý‘±fÔÙc¤ÌFŒÎÊ~'tNB(3#:ßDëæ‚Cñ9œa¼è(>…X3ˆ€ã7 Ë„Nt‚tXöùµH»‡{–ÙhTY+C›ÇucÞàÒmO R¶ÅÁ¾(;…v‚¶~Šd­ËU^£á÷¸ù†slö{.—¨
	­[—‹†¦Ž ‘ @°éô€Ïñ»õ[s·Ý²éƒVƒk¦œIè¹a‰wà2¿ÁüÂ
nP»¨n/°‚±JÒ!@ëñ:ñúïÖ#?´ûîo‡y©–¸Iê(uQ"J]Åò£äÕÃâEéDÑ‡Àb÷¡ÊE©›—É†á2ÌóÁõÆ%g ü·ÃÀs5BkÁí.r ©(./Y¬‹CHNõ¬?~ÅlCïƒvì0h’¯¤: m¼€U&Í6•NÑiªÏž÷T¿ÎNF¿FóUÀ©½ÈIóä¿r0ÃJ8¶(†Ü:¹Á¬¡9aKá„"×h¾ŸÐÌÕW¸6ô"'lª¿ªRÿdàÖr³çdKüÕSüšéŒSüZ~Ö¯œt[æ%NØl?Å±W›2«N¶2X9Å³9âÙ´ž­WÙ6¢P»iûëö6*ìíû‡ }ÓÜWÀßÀPg§¸ìI§¸ç‚à2Çë‚Ó‰¥W§y×S0Ü)îØátkòeâ´kæ—9Êƒâ¼STœö8EÅ½Ž¨8½Œ9EÆ"ã?;p%êUÑH`ÇHW8¡ÓJP4³Ä6F–)ž‡t7’7è$ÉKÝóýgì—ò•Ì…0Æ\n¬TòeÞ­np2›áx~¨&Ë^¾¿¾¹uíÆÊ1^¶‚¸FûÇžòò–ƒÿF2¥~u¨|”›V¶ÙûÔ7GÂ9Ó#Åp´¥äÙŠ”’&¯ÙCY%à^Xù‘ïEl-Æù nùÍBl±ÕêY×íOÄ0Ôý´AÖhC¥½ˆxˆº_M3åÁåw!/%ºm¼vwsI®Û¦7¢ WÀä££øÜÛ Ø¦UB[r´“ÊÆ–òªL)ÛOîFÑB9ïn9³È8µ¯pÉ'zç†ßà]Ënöš^ßÄ†¸zmk}eñ¾¿v£œ%Ñ¡BÄ±4zŒ…IáŒI‰:!ºb`o›ŠeÊ‰˜_6ÛB­¦³.¿Fç÷SµÇS·Äj`è(ÿÏ"cóK"á4üËÝ.oTìŠýËÀÇêlæüƒó½á:‘äjÍ•DËâ6 °³Eàæ^Î"&´ïT®PK =ÏXÿ­h²¥ÉJyzþLO%ÿ_ÈOä¹(œ!Ò'Rÿß'þTåáPË»ñ‘ÁbZP0¡CƒÁ­¶(æü¶Ï¶½nWlyø)^ŸO¨>,[Öø®€«œp¼¦!9QãºÑÇy~¶WZ´•²ìæÓz9æ©^¡O—¨ˆÕ_ÅÕŸ²[ÐŽŠ×Aí*]Ê%©´4îúQ‚3Þ¡’ÊÍ>bX·Ú4«^¯RQÂ…Œ«8«J¹zÑ¢±Pï’hK•Wd®A÷ZÇc¾9"²ŽbÂ­þ„Óá¢^ö„ë¤²F^sQS³7·¬ÇŽ	¬½ôLª¦ò*Èæ‚H´ü_Õ¢>cðM`ÃÖ:>ïncŸyêü§yQÅ]‡Åõjv[$%ƒü¤I}œ—ßFÇl6â¼XÁWfkÎ©¦Äº…™‹¬ô›ð¾ý¬"©TÁR/]Ýæ½åµ?b+Ë[kï•öúízí¶íÐàÊ®Õý7nc]cBë*ì½“Xê3Û(½0q‘ÂÃ×Ã¨¿¶ƒ­PÛ?6[Äf„Þ^äõ
pLY¹.º,}j½ãõj5ÞƒÓ,h~ˆòÇ,M°!wýý÷ù¹ÿŠæSƒÄê¦¹BÒ¶¨þÌ›çPÎÙÞâ,jé på ·®MÞi1»À
ús'hów«5àööŸ§¼õ…!…9ô¬¥LËbaª¼C0BH“ax›É•´Ä¾‹~§ð–³³|
sýâšy;0¬Ø(¨åuÒõb$óâ[AÇçú¸æ6$Õ´ <&’‚‚¨ÑÊ:kÏ’bwMHÛ¬çÙÍîøò/SZí°hòNbF€«êå6±ÞSEý)Â?˜fó‹s§D/ó†r‚¹"ý˜~÷¶4žS)ë^Ž×ù|³Ï§_l{bh”Õ9l²cm>¾òpUHP£€\éú{3|!ÜJ•LÊÇZz›€›?þÔ„8—8I\¡fg„.!I2ó­ ?ŒÙÌëON"áý­+ëðQœ8õ.m8l3 "oð³¦¸¸ì¢®í\Ê¸Åe¸]mLÃ«XQ7‡¯!FëF±mãfÙ¤í!Ä¿Ò* ~Ã4Šò)©xª*	ôÚ="ß«¢}þ†×ÒuÒ‚ˆ‡®Z&®ú{,‘4H#*ë`*‹2É
«³BX©;.=ŠÝM‰˜ÿr³™t‘ÑjÓã,zùÚµ­²áŽ0ä/îî8& Š¿àbx˜Ô™Õƒ\	Pq;‹ÉÎ:Dº%vÄƒÃFÀ^#ò›¼sùŸåÊuŽ+45ÙÓ¡ÄÊWÂÞ~ì¶ú¹ [äåB/hÄÒfõÿý…‰Ùf ãç›Ï®„Üjg„Õ©#îê\³>Î¤fÝžòZÉ÷šk^9çëiýHâèˆÃ"GbðŽ$z¾ú£«ËWÖWØÆúæ[¹qs•­­®o]»ÁÌ¶¼±Á.ÝÜØXÛšÅß·–/mšUÎ­In&§ÙdÜø´€¿v|ÛÐ~7BÞë}ß‡¿û~Ì·ba—Ë5¼€Oþ ¿ìxÿÿ	ëþäiL¿Äýøä¹Ó¼FËbþMÜ‡/¡Ü|ˆè‹Ußßãm	ñ¯ív¸ûA/Œù÷·ëA·Ñæ'Åµ¬¦œB¥h6Éâ‡g~ßßWDªžM^‚Ëüƒü´”;['ÍÓû¯ƒ÷6<ª¬kÜëîOÝ-¸Âæ–v/¡ù
!üºâ4^&,<íƒŒ®B“¯Z1ZwOÜçh&³þÅ”Êq–‹!@T(ë1‹ Àóæ­ÏnAq@P\Wì.Æçƒ—cÐëùQÃ‹}pð7îBêý	(B…lGÅÎÝˆO´#(²É€D8 nâ´Â½.1ÙòYb¶çoÇ ç j‚öIÝì­)—ç™9ÕËQL2ó’¾âJgb~sŠ«¥6¾&!Sñ-Ö>»Ÿ¬°zÛïîö[_]~pÏ¶—,òM=¦ò2èà‡u±bÝüK¬; M»?i¹üù-êA3ïö'§ÉÎWáHÀLLµ©)*Ôá$ÿ:.£J"ÀF[ë’8žŸ™ÆÅû–œžÆq²ï@˜„ý›w^ˆÇ9gè–ÍÎ-ø #oJ¢-‰ÓhªTŠSÉä&Ò=KŒr”ðƒ«Ôâôñ1Ÿ`3sÊéöÎ)Cš=Yâ_M¤ÿ,AâÌƒK¦\ê<âJÚr/_=Ù‰
a+òâÖB¹¬årÇ4ãb®<Ë`f8­ìŠ„{âjËŽt1«ÆQ•½ƒš@?¹~ªâ#*4¾ËRLe¢A¸›ušØåR©“ý-®²~ÐoûÅ4õ¨˜¡šuñg÷§®	zã’_Ò3u25q^€]Hßà=žf¢Ÿ—ðõø6!v“n%ä›“<Òíõ¹"*öÅ<™¾^P0 …Ìk
ôJò®[¡~v’C.òå˜K‰R¬m¢EG(&Šqƒêq*&ªŠ‰µS1q*&†ÅÄj•¼1¥QY\zñCÂÚ©‰àðèÑÖ>uó1Xú0_8•¯€œ¨bRŒ$(N‡G.(Ž…p*(N´ ¸´¼òý÷n\»yu•­_Y~o­ŒŒÐ9n‡°àgŠR8m·lÍÌ/$Ì²4!æ‡eÓ‰¢L<åì(eé.s¤›sãŽ¯–0È¦7$±äX¾ÎAàï“"–W¢XÑÎ÷ÚávŽÀf‘·`Q­×æJ+àÊVèD/ˆ§:ŸYjwG9"9:‚æ…ûwP†ÏÀ…3ßMâ*wÜ‰¯*ËÑQ‰bŽŽÊª¤ZË°ÌAL=ûÍ­¹Ûå˜×¬,vÎvÙ{ÌLGG†ŸŽ[³/ÝipŒÏêG%¢9lÊhVÎÕ¥”3-ËWÎ0‘G)ú7¼ Ò0V&xu>×ÑŽr²4è(Gù[ô×™ÁÚ ÷ÊòXÃa¦õMU2Kµ¾¢—ÞÊ*â@Á¦¤A4À™—¢·ví>×¡,¤²¦_]'F	¾ßúÖ•÷·¢œF,³±×·”rp³˜G²·Íâ&ˆbŠ\³Ê4eþ9šåoÿòO¿¨3Ä^'4&ÚðÄ^?u½±ê%Øîw¡ÊyG²WFwŒWqWPÙ#*ë¤Ï+xJ©egwÝŽjÚUž!UÁx´R
³—{½ö>»î Ê9.OåÑ8äQ%/æ©<JŽ2òÈñ´“éÉ$‘µtï²‚˜e›íÁ.ÿðïðœc‚©]^³Ä1ßÄ’A)&JL¯ÑŸfaÄZý~/^šõ?ô:½¶_o„òø¾Þ°sNC3EY®A?ƒØÌ1“g
€¿T¡CÂèwŸ'x¹éGPz“¸ô»avÉášn”zàjyu‚î…	g_Š*ÃhÊ–²Ñ2âÖù¡c²ìz^ûëÝ~-+§è^KGíÔÊ;Ýu‰®¾×ÄådUì·ý†«°REIŒ£ÄÈ Ké`“°.ó¿îxíb½ÊYKlRüyºStzühòƒãT€Ì*wÖ¬ôpŽ5…"£•3A³~ââ2þÏj¢P`Îþ†h7ø>‹®ªø¹Î&.®‹¿àAÄ“ý÷,Wwµ'žŸ%©1þóÈ'žb#q(›’ZœjÙëe}.“Dãì‰ÕQJ÷ÈdÉTÇyW,îHèò•ñŽ m0çRùeNÈ×Ý¨ëïÊç‚“àšKŒ·Û¯wÃ½ÚT½nb@½6å"t“4£ÉMñÜ?GÈ€(w¨&ù3dþ¿}:éü$ðßM­”è%‘Éât	wžÄª¼T‚àqRý÷ðÕŸÿgRS}¸zú
NÑë}×þ‹­cA¦Ï97_âÚ bþ‡¿ÝÂÜžßôvÃÝ}äÇjxhð»÷>­0îto˜t:Y	ÐPý×oä˜=t`’ßèôÒ¢ÀW‰{ã{nø^ÔeWÂÈw½”ü“Þ6×TN×‹?³~D>äN»ÜB*}ii^â€.K°„•#­`Ì¼ñt²îoÞúƒRL°*Ÿ‡È'l&Yíƒ0ÂŠ²œÝ¹>Š¶C Å¶c2ø+/PÅ×Û| Ï‰F’8Y›LàG¯&½x¿ÛpÄ§õ£}gÌCHP#Ðtâ£–N^Z÷øæ°Û¬¥ôAÿmóÚÕ:aÆ¸%RKh.ÀvwlWäÇ=þ(XoÏxCý~£Uã[¥å^p3j×&g½^0+p¦d@Çï·B®Š'¯_ÛÜr“•as)yÓâE_ê\'_O¾oýÇqØué}@kŠ{¼ù¦¸[f,(ïŒì@Ùcv–m„¾ƒzP€…æ›äÁ¤ÓóYe6\ºIWÖ¹­£Íçò¥} ™‹>hò.ž*M’ÛæÎíuVƒ¸çñ9Ãå§NÊHl«TÄ§øR4©1ð!òºý¶‰0R=ö‚.Võ¦xÞÜ·‹‰þ’Ý Ÿÿ`{tZhú¢ìß¤ñ¼ïÖò &,¶ 75>#:SuvBtú$[HÉ™‘ïâ'ö£<ÿ"ïfým/ößpaâ8`>8i\f®[ÿüm«çKå^÷O"q"„Å§Ýëgð½×¢(äæÂ·„Ä’¬wxK`ñMÅÄe/hS nœí 	—9_äÉ8 N^>Õk~¹¬wAaÛ¯ûÐòÚäõ÷¯gÚ†_/ñ¥
·+n_l—½v{T;J‚Â+ŽR^Œ²<‹î=Îµù·k´5zŽÜ`j>M¶	4G‰û¢O‰QÕJsOk2¿ÅÛÑ´÷cÑÜâhÖtÊ$hè³ssã£¢ÏUmA¿Z†‚'Ë÷¤>æx¡¸©øï´†§Ulª“QÝ8-_fZ\ˆ¤Ux5y¤c‡"£‘å[~Ô3ÝêÔœ‰Ó0až4É12Ÿ¼{\ªB5¼uøôí†ÆÞg]ÞŸÜæ{/òštÅëq±‚A‰Ì÷~`&»0¹Óf+ðÛÍ•–ß¸«Ü‡¾eôµÃ]–÷¼¨©\ŸÙ%¯¹ë»\~)ï^ãv·røÈà{§—èyÑÝ62|&o ¿r¸üfìGêµø™½Ç—’S¾ï{Q_¹œ>;\¸1'åBúìr¡×æ3Í‹ÔkåW—c:kð³A8Þ6v¹©»‚Z—¹%¯¼6Ì–í]þ‘‹7ñÄ\šÒP¹Z†!\..3åRAmæt)U®•…R.¾p¥¯\M_¸^ßÝW®åŸ\/ì¢^[}cúB\^a¼#>ÉüäÔJØá›<Øv\`5zÙ5Ó©äW~gÝêÇ{Ú{p›Á‡!Ûœè[’n³ó™ïås?ùó€«³Ê¦»«â0½·òmå;“ˆLïI"²êÝ‰™ÞP~UýÝ¥ÈT^\|Uùž$ZÓ’h­z7’¬éÝðså»‘¸Mï†Ÿ«ßM
`å†â«Ê÷$Á¬Ìñ\ú³ëÝšTa\‹E/8‚cdææ_sš+7nææ¾ïµ]˜›ñ¼—ÈÜ|ë;ss‹Å3·ÍÔÍ+aä³ËÂø¬q?ÂðFœðº.£ó¯ðB5 )´-e–ÇÛÉ»;à#Ñ\ÏA—µ‚ÝÖ`Š#›\0Î€w¥É·_˜¤qŽúèˆ å`ç»þÐ™ åÖôîN°Ëÿ´%Zžh>h»‹‡ì¸¬&!8ð÷OÊj@x{­9 Aem¶Ää¯óð«ªÛ•ßð·d»0´»*Øæ§íCX6<Ã-”Æo¾mh˜æfS,fç– ¬V¶$¥Ö9´óm6…>ƒ:p¨ˆzÚïcý±@)Èã(ÉÀy›Úzrü,¸}Ÿ'Ü•âÆ^îT¹›ïx*ÿâq¡e*PëžzÿÖœXUaš¹V¥Òû7•˜‘ÄC¾›Ùc&²\~ñ6l…hs”ŒA/:ypç ¡Ë)>SBÇšî=êž6_‚¦¡<EC%î÷—šV#ÕíÃ‡Öõ‹Hª©ñ±Á—B}ZáÑ²íd|ÁGûŽ¼ðURtŽžÞ:"?|bŠªi<ˆ/Ùiì4wüÛö½…”@³o9²HhŒôTNj€ìq?g¾w¶ÑMéÄÅõ¬±ë7Ö~°¾öÃóÚòÂ¤˜s/›F$¯ýÎœàßÞ£­Y¢f‡¶I\±ÌœÉ6%
ºwgæ¸âp\ŒŠ‰’=±äÞÍù0³êåª—j £ð]ÕUÉ2±òÑ²|Wñ&
¢þ÷(·EÏ¬¸¯pË*KF¹3y_Å­¥ë•îMŸF¹¹ðÎŠ»'®Yió¼½½ØØ9wÛýöEóÁMF—°:4^ÙšÜ1M3.Ïqyxnâp¸îFIÕÑ;<„ÜçÎü[	./î°6Axgâî`×ù)°ÍÅ²kCå%´Xcª‡Ë?"Ô„kEâÂ!êy@ÞmÁçIgj©bOŒrî°¸O²š”¬ÕœOFöìo>ôm~3ÇNSø¶
LÄ;¢>+î0……úK¡.ÓkNŠéøI%•b;ªÒo„là±¬ÔCI«ÃÕRkª"}f&ãÔSs¨ÕS\O	P–ÏpØˆ…oà‰5sÙ|ã¦¬D™nç2»9rEî¤mÙ1äõíh
âì”!‹,EéœÜw¤é}©³Gç
Jü¤'Èñ‰$Ö9LÉV‰ êèEr½üÓÀký}¶Ö4Ðÿ=‚è*KWu*ºè—èZ;]Ç\tUgDx%-ÁËaÃJUÃlÞýr5qëBæKR=¥y÷3‰ƒ†Mâoæ<þ«HïÄó‡BŸ1a.Â¹¿ÆÍâœ?{TMÒ–¯|Ç© …c‚6_éXÈÙREOàM0çÿ%E³5âÔ¨<¤ÚIØ²Ñ¤$ZŠ— ÙYçÙÅdê 1h:l/è·ø×_m?Ž¹¸¨Wn§VäKnÇÎˆ<n¦ãe™gÇ@†o‘·õÅÒ¡¿Ã’½+­0ä—¬ n"+eÅ®½7Â u‚ö”ÏP´8¯ïÃ™À·˜à—ög¼A?,ãðÏ¦"	è^£¢âM¤2ò›CF>6: ýËUGÄXö([„œQÝ%Õê™ÐQ6“ã/Þ3Bùž±(!Ày.ÉéR^ÑQºjO)•Dú\pÖ P({y©W;õá
ò;é¡¬Ü
ãNqôX !qÃkû3óós)d²Ê#°G÷ÌZ›”ƒ+jà&®øô(S1w¹K‡>ŽOsÃøgêPíŽÿëÊ—G¹â;t”1àJÄmÝ·`ÎvÊÉ0¶Z>a;YnÀÊÑ€@± ÿÌìE^Ð¾UŒ›dé]0,Ñ® Š•Ì	J%ÉÏÍq)ˆ‡ßôØ›²§6ÅKµ)º”Ì˜`UT8ªU±7sŽ,“«d†é‚Qhw|[¶½{0¢	0 )Ï0ü/ÜÙá³nfž>¥Z<1Drô!)Pè|ùÅü1ÔìÊË¾ù&;ŸO%–eõ2¦R?
ïú3·ÎÜ ók£ïO[ÜÌ‘u|ýÂ¢°Bùz
‘åj*”­ªñã;½ÿ¯­<ÂüëçÎÕI8ÞàSç®æÔã*¡Ê×O([A!#6èy§q£#ù‚§’B#)ó•Ê
ŽEœ¢JÂÑ×I(W)áÐF>É:ßm†öø*Èè"é?¶;Ä+Tg!¡S¹À4Â%j-ÈŒù—Ymá	"Õ¾TVãCâî¬PZA%›9ªÂ
ŸP¦ÅÊ7úþEçÿ;!ò(‰Îú
_›Jü~®R{y't˜/¡Ñ\»Añ…v¸‹l6È6M,;ŽÕ0²•grt¸P¸¯R=‡k²%äT~e‹¤VŒRö@¾õ´²Cé5ÿ5¨yàbèŒXû ¤’`›nz‰˜wÏW5ØV¸éG|ðŠ/Ö~þíã¯4ê_	¨3\ñWùwIõâ•:‘%*“TWD`Kdë‚ùLö}¤Çx£ÈL>,næ[ß™÷Ïiž¹m'g>	«ÈBÒÌT
f§%d>ã°¹—­A<“3älB.˜Ð	fiVm%«:%(dTxŠ
­v· PFAAãw?Km}€d3_È!8
ƒ ãÓ²˜EñAîðåFý*¹ ‡ë[X“Â¶bED€6þ¨±²j¸ ÅþßÞò~6’(ûfqÜôFò?òcÙæLá›Ü P¾!ãÛÙ„ñ­(7jþ¶Þ¶CðÈ•]M¬HeîM\\_]bIo¸Q¹b*€ò›j0ÉK8'K9%oÁ4ú¾¿[°r1/ÆI”|ŸÐréì
*Ðr9zUCþNŽŽ‹¦ã¢²Ã¾›—˜õ;.uQŠ½™¥¹ÆIÇåà…†Ë-\í÷5)üâ%zÿÚöýF¿Î…OŒkJ8½4Ôqy`¬œ@•››“SÒ>éreàê$
âŒÀ\`x³z?Ü÷üh…«èÚT=è6Úƒ¦×€“e
°”,	 ûù¾8_ä%8oÓ]R©Ç{Œ‹²E¢Àrhx½ ïµƒŸ˜BQ‰„¸x_áCÆ§,IÒ'Ê‰k™eÒUîLrjá‰ºDVÍÙkš³Õ›‹YpP®äx™`~yÒ %¾v_çö	­1^RmÑQ!¢V¬ÂÈ@Êé/Md-˜f¢ËÓÐZpkyGÉæv‘%ðî6ƒ	!@ÅÅ¦
PRÅääöÌÕ¶ËYûhì:!¡ŠíÊR%-l>Í{q]—›ˆŒ˜ãEYÐÁù-»ÈæŠKÉ©@r‡[sÀþFk^£U«ñßJ˜ül´DÉp‘4j_Üâ—ßæ}Áÿ+´ ráßH~‡IŒ!“à]¦Øên8
Ëô¹ØÜªªoœp^]pz£¢w¾õÞÚµì=PY£8jEs@C¯=¦3/ifj Íö†ªá¦¡
ª>Š;þkÙ}ŽU±»Ð…Y£Xe¶KpËâÈ)ŒKŒYW3Üš I€ w¼b_H¼GBùHaÐ;ì€Ä¢%§yŸ\éWC4âŽõÆãZ/?QqIŒi(òX%ãOšQ9˜ªMÅ47ÈŸtßaI€ª¤öãnî¶ýš’þcYkHî{¿^èÔÜóÎÏv¼@yË¼wö{lyu•]]û![»r}ãÚÖÖØ,ÛZ[^yí»rmuyƒ}o6R÷ƒ˜Ëœ5®"Â}ß¿6½6–ãÍQ÷E|È'{Ð…,Œ¹)÷ÎÜÜì9þ™Ošfö`ÆEC)Êù	ß™óƒÈÏMùxFq9‰oY€í}R»£ÍÄ®²ß÷`Ž§q°-“âßY¸×º¯é¡…üéb.¹0Øì}ßƒ¨½­ÞÌ9pŸ*ù‘<t˜ó<ïzNúBÒ–kŒtSLè|ëÌåÃ¶–-æ4Ôv[¦ÌÉ!zà¼Õö±”ØO×CBû£Ù!DÏÇ&Ò`0Z¥Ò”³xvËç¶¸i9aÎÏ¶Îh;a8%k¿H¨RZL¡\^Ú ‘°/¾’8Gd
“ §Li:âPHYB›ÔüXQš/fL½KùBÑ¿À¿KÒZAQ–©ÚüêàgJ©pâ?ûì‘ñ=¡b8¹”[>šˆ;^cÐîïCÐ¥"7T#ªªÃgöÎëøÈä³pg'h@ÎJÓï{A;®OèÇSÒ3Èt³U”³† H·V.Öv<¾gÑn«3”b¢wÓe¬L§\&:}	žzE#[³ö‡U­vZÿsV¯Bzø¢ÖánR¡zWˆ¹ÍF¶1y—]£[á«ƒk''™‡2x>ODÂ@¦!xµ,†Až¹;‡]ÅäVÃ¸f‘wNMk(!íêg¹t%ìñ(À.ƒŽ‚6MÂÌ²íÄÅï™|?°Åë[äã]¾tåj€Á¶d›9rùjºš½ZÙ'»]Q‘6ë¿…=©þ)ÃŒc«Q]ñZÛƒíAÄnx­Žg [{%sûI‡òÖwü…ç¶	ÉŸ	êÀ#4—ÞFM2äÒfË½­]±z'ž+“~‘”Ì:üE¥_V_ ' v¹uû=X\O…ª|üWÕª»]‚ŠÍ²a{Äåe]`•â@Ša™q	kLê®ºÐàžîM·Ô6ýnÀõ÷†ß \ž1ËóD.4CÀì1?)k†ðí_¢™É-É?¢*úßd,â*z"Ì@ôŠàÚìù`?‘«hs€.ð¸bjù¸×’¸íhËézk?Æ•–ß{xÿ5ZQ†¯_G­ö ÅøÇs†{±odÚÊçR­­uøfÅ‘Ç/{!úÐ˜’+¯÷:Ä›Ž¶
;h;Ö£ÿ7:qÝoêÛÍ×hžàuCÉ\Opˆ¥ó¹ÜwA ×Í•p;à;Õ«ÈKñ²×MÖkñ÷²Á›Ž¶lææßš_˜ùg<^£åbøúD:)(=’œ‘ŸI=CôªÙÑ`ác0Yf†Êf™ÈDÌMlŠŽ›ç÷±Ÿ§…>@S -—|¿,Rï.«|æ=¹ÙEEj{~îAëI–¿!`ÌöÏÕÁ¶=Õœç¯]¬f&n.‡aß9p“§µÖÆlrA/¿Ûp*•cÂ¹1:®‹RÇìØVcÌJŒ\ÈÄäO– F˜³Kdt··aÿ›Ä:žãìZñº¿­qæpòØFB¸ PØ:Wk½RKýþÛïbj;ÍgÛ	h(ˆÌH5¯íGýš¦ï¨…²ÐŒ'…/â_¿bi¤¶AH$žø@^oû¶ðéÂ%'CnB€ÂÆõI#¸‚ ëú_õê¯Ù)q¢vn%JõO®ãØÁmCŠ–¢ñª¼þ3ùÓ'éÿä4ÿž¸6Ì§ˆ]—ùa_Z")–-”&$!ïD¡mèæJ¼«›{g#¨èoxáÇ	>éc
™jÀCr*B ÚÃÃ§p?øQdœ”ü…¶‚ŽÏ§p-‘×ù7œœœšfgçææô°Åü\äÜH"Ûjg»JoãÀYar¡”ñ:ë`ÈŒÈ}¡‚tÀŽøÁúÚÙæÖÍÕµ«[lumky}cS¾¹ø{Aww³?hra•âÜ¯$öæÌ)øFƒ©ÓéÓPó×¶x³x÷ÎÏeSÇUè@qE€LB©É¡s3æ§:,P:s6úáaôbDSqOl{%0†¢ _%8¹'y”Ãˆ-2®[†ñûëQ¸&±Š©Lð£qôoþ)¾ËÃD»aÈŠW_%'>!Ž_Ý7Hâm°Û"¿Á×w¸9€=:³žÏUH×kO3¯Á—r'hL#ÒîÀ‹š×öUÞS|*€AhP‘gèë˜¡èÄy;OCyÄÐ
Â¨ûã
+‚
}Z:ˆ©ªxâIÃ­Ñª¾ÝÈk¼õ3ýp&Â”îT”Î.2þ-Ÿ¢ðŠ&w‘·ä"XÌéÇ¸³„GáÞ°žXtÔ€£^8Ë†Ôõ‚™³Oñ6åÕ²Ôo…êÅä|Ô<°¹äú®1{ø|ÐÙeqÔ¸`»þ€ïúú¦3­”í4N„âN‡w;_c6ú—YÆ+ÊùPÑ9E;{vÎü ½¯Õ¢S³ñP>QðabDøJ¬9VºÉòÁdô° ëÍèà‰‹¶ž6¿èµœŽcgÑÂoŒzÆ$RÉ‘e¨¼*†V§Äì??úƒå@þIÐœâêl‰\Hðü¥ÉÓÔÆöXn
Jówü_ºÝ&Ÿ†\x[nÓ¥4žÁúL+ÃØE>ä7dýR™Ž-thl€ÿF²ß($YŽŠ¬<Â¯¨Æ>²ûÏNÓ’jê÷ÄÚy” ®?‘ãË7_Ðh\j‡a“+†pÐ³ŒÈ6œ…'a%Òkÿ`¬EZÀÀSÐi˜¾#;?w~}x;íçÔ77¸"·t
èùñtÃý;j?¾—ìK½ÃÂBO½²ÍEU0Sö^Ê§·’Qi¡l÷£reÃëB¹“\¦ÛÜ9°.Ù^ºÊ@™õR¹ø(š…$ÓØü[Æ>{“Ý@çY´Ï‚îNèj™ét©5·¸R¨¹â¢Ò§È” K“ZÍ@›i¬§¤²§Ñ	aa‘Âs‘¯Z©Ât‹÷7Hô)J¼§I‚Ô¥&öƒénî¡¢í¾$×inó«)ÄîÄkŠëMƒJc	Éa	­—wÞöv}Ï/Zxþ´ø‘,g –ÑÇeÖëS&Ã OäW¦þÎ@X„B
¢~Kv7a2¯†K“¤_KIoß½m±ï¶¡	™€Ò»:»lo…-ó„Œ’êàøÇ*²î0—Šã õrÙF n¿Ê}þ;øa·BÝü&ÆUÿîâÓ^å.Î˜º
ô›B_²ÓÑ¢e«~[ýÞAG6 ‰-Í¬§WqþœÄ³„=í·ƒ]ÚúI'GâyØÏëüüÎ«ØË˜pX áQ²×¾*XúƒþþQuz7}$ö»¥üÅ^RåàKðW¬ï…%v–17éÞ“nöSã{Æ÷áC<ÍdA‹G„#ø-%tÿUÀOÈ0ÏÄL0`"†gRŸëIÄ}jng I±!EïÄe¯ßÂŒs¸ñÒÄÑˆ‚|(ÜáU¶4òýŽ,]PÔå$¿aµ«ë«SùaX_­8
÷4b,ø
x…‡"•:š%p%|	K ¾K ßï¶%ÃQ/1Çd	€öáŠgP&ÌPV6ýAîï#â^‹ýÔ¸¸DÆm0–uÜJDvõ½ñ~-ÏýVòï²;µï–¸à`êôC¥èÆ«0_þ&K†½PA‡ùÜ3*”FŸQÒÙ8=t
d«`j\ìíˆËy„íÄ™%™¤êÇ’Âçt#1âF"Ÿœn 2	\²†ß0èjRŒ	ßBl„ä§OÜ÷#ùë“B%7	°²+¨äaÁð2fmÀ;rA¦¬§I‡õní:ï+€ðˆ^#5=™û—·±°L¶©V5 ¦Q ¥ZÌb'VmßkÂÄ±ý¡o‹íš4ôFrr€ÐXiyQÛ»·ö½iö}/êz½Ö Lc¿òîîXT	‡à®z¶* £Ž¿ºTÆÿ‘~üý¨ãu53 ÿý«0ä;½¼Y0‚º9»Äø²¼„ƒ˜­ÉœV½s¿f\÷6­0lC˜ÏAèÏT­Ÿ´ùÈ´Ú1×kÎ.²”íIF@ãÒ´UxÍzÉ&‡§×æ: ÆT¶	¯VÊOvÆÉOfƒcò»›Yåßè{koS§>–å _ {äd¢ÿîÕ­‘BÛvlî‚ìº,6j­ÚæøoH]/Q‡GØóøÈ×¢ãÌMÀ þà·jÝ_ÑCƒ ÏÃ”Õ¿FÎëÜ·G˜B/FM‘¬•S±r7Òï-¬úŽ|úõÛ\át,	aÆ(Rò®bmfªä¥éJøÍ|eÒ%Kì-w“{ˆPÍº|‘÷ëà 0ß#ÅÕšn4Œ¼µ¶¨ÞŒŒ]ƒ¿›•Ær™Ÿ›P»×&üåÌIçö,!C2z!YIŽ¥$]@¹Œ¢?Ã[RVæ4·+e÷šMGw¢øXq˜Ë-IíOš¥¬Ÿ%?ªiÀ„!áa}•ÁÂ3x9,%5Æ³ìÅ°Ãt‰cÞ•˜»¯‹/wò(˜f%'¼¹¸³èû·ó›‰£™=CT^³é5ço>«þªø`îüg ý(]òßÐxŽÁ§ˆ”JxÓ¿I
	¿šWâÂ^÷ºíÐkÎ^çj¨æ\æþqœoñÝýÌ\ƒÏiæãÝý#”Rù½9µdôY–Ì™'Oý…JnReªõQ–•›fÃ¿h­½áóŽ&¶3ÅØfÆÂ(ì)v{X­´Ãø¥P,¯^YßÜ\¿v•]¾vã
[½öÃ«×–WùÜº~cýê–…"£¤ÐÃ5,j¨6ß®ß¿!b…X–­&#‡K,Æz|ì§Fb'èúMþ7Î„a©…¼GòÒ¤$n@’«ÅF°®¼0WØŠþqèAxá>&ÁxL¾ƒz±Ùodtï	2ãeQšçÔêÌã)æž½eÇ~üSÍƒSTAæÁÊ×–oGš'Ëˆ÷ƒÌåw–»ÅHq3Üg È>ÏÜL~g¹Ù Ûhûù{ßËïÝð4ßé³™s²çËÙ£þxðÿE7ÕãÁÇ…A“½Ç?W˜èpY®_ÈÑöD–11	íœïñ'Ãg{OŒù æ-‹cìÁÜw¯«~=Ü û¯is^êÿ  ÿÿì}moÜF–î_©ÑÜÒDý.É²Öv¶õâ‰pmKœdöz˜ê¦Ôw7û’lËŠÇ€'ƒŒ±˜»;'{“`3sãXÇ±|˜ØÀ"ù+Æý%·N½E²ªHö‹Ô²º‘XR“¬*VsêÔ©SÏ#})¡@–fÕM±¶ßÙ;áÊéÐ>äœ•ÊKÞâ>iÆ}‰lÈîR¶k×pÚLÂýÊ¾9ü#ËP|ÿ0T«ðµ²Ñ…Ê‹òÿ„J]T–Ý°ëžíÄú‹nwýüæð?(îc´§b×•4íž‹çŽ]3\Ççä½_“’¾‰Eì¢T?AÖSè&O ÷§¡þf ±}ÈKÿÀ˜Z¤ó}ÒN<ŒõdÛKÆŒ~ÏmY¡o¢u§m•PKÓê4zb™äËÔóZp/c¯%TUì¢²¶^£Ñ4Ä¢É7xjW‡íó…Ã¨½®(+ª7\¨Å,–_îg‚¯ÌO0’mÜPê»T3C’àÁÀ×%q_Åè¹ ~^{Ûs	ìØéô¢H o'<AÊáßÓ§ùËIÅs'Ü¬ë¹7‡s³¸'é'ôÇßé§ôÇwôÇ3úã{úã9ýñ"wCÚUŒ|™6o¦à˜(zºx½”?w£¸7‹¦Ð
ò¶b«®wÇ5×;»FK”õø.vIôú5›õ;„wp¯7ðÏp·§U|ödBwÂA(èGvwÁí¶,o:—†ûˆY„{9»4W5›)¾‡ÛxFÉƒ×+7îùïeá÷Ò{7£oÖf‰(NûeGZxO6†²xÇ$JÓè4Z&Y…†xX$Îúnç@@¸[ízÎ™°5_k™ðëòÁzc:GîÔ ¼ÁËÎÃ›åfÞ-XŽé¼wíÊåøüB,Ÿmø6I£¬]8P!6§î˜¸X‹¦sô†ø˜Ã·×;h™…®M—›@&mì¸v«ç™1“&Ü¿o5@JP®Ô½£»¯iàYŠY ß Ò‘;ýÛ±Êà¼Ò´ZiZÆLbápÙ¬Æ:íàñôbï¿[à¥ÇÇ_‰ë þ²`êi,žWö¼ÆŸŽ³çžozm9þxÓ4Š]/Âð}1¨Ë›!Áå@6ô!y-«s5s÷ÂTÓóºîR±á·@©]®åâÞië®[yw×h[­ƒïánzgÛÂ¾JÏ±–öñpþó\©ôOóøÿüÿÙRéLÃÂ†Å8¸àîÝ)˜„.L‘Qu›¦©B»;ïÖ«ë”$¿1õ^V¿\·Ú2uñ|‘Þª*jRí)‚Àh¨¢I,†¾çÊÁ›"þ¦xöpŽ›Ç.¾µi¡£~kÄn`3ØÆ¦œDyÔ°»ÈNªú®®Ñ€Ü¨%À!êÛÚ†³gu–PI}K~ßÜ¹eyybZh±Q‚]É%dÞ”ß_Xí®íxFTBíàiU¶Õ?w=S38®õ‘¹„jsÉ¯_žo·³ÕŽeJ%6ç‹*<O¤‰D ƒô¨Ä¬Q™ŸâŠ^_,,˜öŽ
€)ðd*ÌªWRoŸë¡}b6	Ìb3¹Ûëµi5n¶ÿÿ›Âà# §*×/™¼±®ä~ÊJ''á™Å1Ûöm“Î,üý`Æ`3©žõ|Í+ ŽýªšîÉ/èŒßù"´Z&—M67¥óUb½Ñ^,ì;1Ç+œ?8x¿ÒÆx²bêïœõw!-êoEz:&ö½AŸÛtœ¾fwÑ²ú4§ åRžßXI•ˆ’&ñD‘z’8þt˜cGeæøkêlEâÖgNLôVV%ní©aÓB+yo¾c± Î:B“‘ngX²-ù– û7²û³ÁY¬#~'éSš²lîkR¨UpÁÒøÀàRAŽªî!ê8ê	›¼¢d„~{I·Ó@*~su×~Åª`ÙHE/E¬eö=MÈ23[,ù‹B²”ˆnÏƒ•Ê.¸ž$¶?úu‰MJ«îÊAš aïUµôV½²ŠÏ%ãž« Ž}í·¶ŠøŠœŒ+›uÜÛ9dt¬6hB·×rM¥­RQÇÕœîÊÃ7#ÿþ¯|Ÿ%‹‚Žý]z´¹zI™®II-
Ñmøp²‘r>¡©°2z0jådŸmðSƒU‡;Yv-óÑ“M–¢}ÅèÜ6\<ÜÐùÒäW¹Ab[/¢Ð9X¦b"_Qq<.Z…t¹$x+Dñh…ÏŸ,JÇ§
L¶Ko›Qïm
‘5à…»wQÛê¼G"UXÊå
ÄªÐ=8¥ôKèÝuìù0á+6^“WÓÛMUö-¯IÒ,%÷óü.±X²Ä©ØLœÇâçpþ7Ê6F¸Ù”ó©ÊÒà7[¶Ü¶ÕjM‹óÔÓ_¬¶òâÃ*"=Gà“¯—‰SñB§|4n@€êÏ@" Æî7Ñ¡—ˆÒà¿ŸóãrÑøïçÊYWE9Êûˆùð—àsJß-‰\ô€÷ôó• ©Ï}À¢éµÿD î‰G²b9õ^ËÀí·÷äèIªökWþCîí½°ŠW°5ÆÿL‘äæeûÎ…©*!°ÙÀFˆ±.LyEwÚ­ŽKc„KÅâþþ~a¿Z°½"¶)¥".Y[5®¼Ž_Û¼:®› T? ?Ss`ûnëNþÅ‡áÆwð¶ür—|4srrm%¡¶µryun1R$³oVléÇÀWQuj«gýwà¯Øa•s™;¤k`»‡mÙ¼Ö«Î¡ËU4WEÌŸE—ñ7èrõ,Â}€¿ýŸ±ÒõV)¨'O¿`W{ö&‘þ {ô!™ .L#ò‡¿Ø¶>Âõ–ñ_P@­ƒ5w@Ï-“Þq‰FÈ§‚@ñÔÅm´r¾dlÔb–F-fkÓ´ªM’a/ÏÑa‡~fíã‘Aˆ Qˆ+mqa˜¥ñ7…Rû)í<˜ Í‘*íÌÁŽ ‘ñC×@$V5€ý2™ÈX1Írl‚®J8®³Ž¸^T yKhJ³‘2¥t«üþØuˆEÎ½[ÀKWèâßð$	]î0$Âa.õ•Ëm:„Í²¾+qw¬ëFu6êØ¸Ên„cwd ‡Ük´Û¶Wµ­5H­]»Œ¶WÞÛØ¸œÔmgÄƒ<×Ëåú}ØÓ;Z92(X€/F_ðÈ“!žÙ¿¨‹
Ý‡+_pÈñ¯xZšà¤ï=%äÂ8už%Ý•¦k(:¹i¶º@Mûøðñ›ÃÃ7‡ÏÉ¿OòoŸ‘¯ž‘¿Ÿ¾9|;4tÏažÿö÷7‡ßãg ¹G	HìØ46øšÝÍo‘d…Z7½n@°“Ðüh$«£X ûuôåÇ–¾•9ð‹ùb6ðöØ4þ2 LÉœ¼€shÛBD¨9ŠeÍò8A¿¤9IÄHþ‹G	’$Å„ù‘$¹’ A3=ÿèh’T•}²eåHÏóá,.–â“/Õÿ–l@–»I'¹õ^_ô×Û~Ý°5•ˆ‡Ñ7ñc°»ÀíLW¥ö$=ý$(²öy½*'/Ó7!fh—Ù‚}×v¢;ï©ˆÄdOwïÀNÅ“ÚX…2Ä­%D9Q ¥¸žxtH7FÊ-¤qéwXVl‡%/l5¹¼+ì™8CÇjÙ¶k¦Ç1Ô‡Mð<j´ÐUš$»…Ýï,sƒ10d±»;I¾{ªš²vÿŒ”“	pƒ›¤*6`ŒrÇ'`gyòæñÇù4¦"ÖDX5°kÝ÷nØ$UÔ˜±‚U¡+É6¢|"	xÔú·IŠéAˆdJ9 F&®ƒqH!	äG…–#¾ÓcêAå…?¾Or§°ÂTEÊÄéf	ægf¡Òl…j
Q–‹“°DHx ó[ eú’Ãîƒ8#ûì±-¥Ù]/¶a4©
žµ¨ŽéÈ ©½ªÑJ%‚$mtIØ²…=R@À÷kEÓÊ]¿’§¡êI#_ƒIXL†šÌÿî®â8Ã´T¢öŽÖÎ¤±­YïQâ'l-“Ÿ q\5<YíG˜F3Œ¶lR‘ŽtŒfkÖþÒ9	° F,iLQ¥€(‚?ZÊ¬NœÞú”+ÚÄ8y‘rÉaE/ŒDŽ±G@¦AëÄx$©8ÊØ*ÆÂ…FS/}[¥§µã§ñ¹Èu¹a¡#Ü7&óÉQŒc4û¶Îtˆ)ô¼ a¾)Â6Ó›;®®¯"‹ÅêÆòÄy}»œW*–«{å˜Øž‘iˆzŽútX¿¿
€ ÞbktÕjŒ½[- JÀ3ñ`ÿN=XiÔx[%©ÊÈ¦ÆÂúL<Xÿ“Îƒ¥#)x°,ó †&szÆ÷´x¶tè©g;öÓ	›K&í[ëÑRqœx´§Ì£õ¹ÇÞÍ|~"znrc—Ø¢àøÉ^¶MÄmŸR6Æð´$Ý}ÁE›®ãm§¤‚YÇCŒGXò	qµQ¡1ô“GcÓB¹¦'pÈo3MNH¾ñ¦±E›¶ë!röª¯5Ž®Â—U×ñÊjŠªãmŠØialƒþæÈ“'r]<l©ÔQXß€®C¨·ðò­¶ß
É‰G¨ Bybþ[=v_±Ã­'rìÜlúv¿ÓGc÷çˆCób{•òYÞÁ)ò>¿£Þç!×²1÷4BhÊò5Ã®Ÿª/dŒ÷Ø)2­ãs6¼ÚÇ<Ùê1Üæ§±ä“Ôóó›'c3fDæã5Ÿpd©ïy¶òCSéänÌD—œiò6	Ü *úr2&žÊQÄú_qRÊ§|6y8Þ£¢ˆQÎ&äú‡–×äC:&3KhHõÆdû&!pÊ9JÐu¶Ésü³ÑYF·‹®Ùh­šczöâ{:K¼€Øeœ>˜ø1$Ç`^ûWÀB®|IV€©ÌÊhŒJø`”VÒKiå¨é,¦#™3ô­¬Bs²W;Ïyö³H³L$,I6Ÿ’èØ“_ÒõùxÏm©…/D¡ÍÈ2èqG°¢<*ÏÌœŠ@|TZ¨[•žûm›E~o¹“dÉÑÈBSwŽš:Ëî¹÷l<'Æ2{£}§¨wý-²4~Á­ÑžWìÛ)ÂõxŒØð9ÐÏ 2–|ÈÝl¶ÌÆž‰–í;hZ¿JÆ×þiþç$¦Ãi¤ùÈâÕ ’ñAm{ùel “à 2N~€¹8€JêÖˆ2,ìàcLîçKþyýR#@¨1Îá|’ö.öÓÁHìáóÅžN&Ôx×HxÍ	`	Hù‚sò'CH@iø=y·3é5·¢?n¬:7ßO¤í“ã'óCÓŠ\¡Ÿ±Â¶pé:`xïö¼¡6‹ÅÚ©k©”LÊù%u.ÀAõ%Ýñ%µ}´B‡Sè0:«üÙßi§ÕÃ3íü3|O>pky~ÂÉ#^+ÛI„_˜‡‚h.
®ýÂdÈØ;©VÉó×®¯¡®'öýó|CŒ£”þv2›>P¯˜ïFæÛ>ûp6Õ»üƒ$ûÒýŒmã	éhOù¤ö-Ü?õiä³gä&¸µ¤‡ôÞ‡”¥ókÆC-J_ã+>¬ KˆwS Y¾¡|AJüœ>¥|7íy½§~"Gü€ƒðŒgÍGˆ2tòI:¨äè¿Ó»¸•ã×iƒù>À¿'¬ùŸñÁ~".Û¨í8ôuÀï\kl}7ÁÃÜ¶ö:†×sL´Ý²½¬ Ž¡%4K
A]˜³Å©T¡ÌçKi±ETà9I V1‚éÌ¾Á1óŽð4v‡u¦*­µcî#òËLÁ³×·7ØÊt†S^ËÍ\/Ý4
Gßõ¢$xØ+ÖQô}µâ÷}¢.é_7Š8ÿúh4/ßö¾Ñy‘£é‘1µXÊÓ%«ÕnÑMÛI@XI±\0Û¦c´ÄýŽ/øU
,8ä%C€wžyÉÀÛUÎ¶h`T;ò©Œ/ÎÉÉ6.÷Rá©ÏT£^Yr‰“  å‹v0“F‹Ü¦"Ÿ€™4ˆ^íÏG'xF£ýÐwB™33Ú&:…ÏBÁÈH›Ÿu›"hnº_©çþÜ_\ÐÔŽOýõ‰TäœàcÛpÁ¶~Zß°}Ä¾™þ4«64•—\4Ë8Wbø‚é'?È|sC£ÛÉP}­K¶í1’{éhzø‘Ýi¤eí…ÖøðxñèVLÚô<}¾¥ÁÙ–Â ¥„k˜ü[¦¥-uÛ2ª%¹HÈø±.F‡ˆ!¾"Ã(«)˜är"ªØWÝæ½™iÜçþŸ c¬¯}ˆj«WÖ¯4û*ZÝøðêåÚ**¢Í­õ«× «½v9$mâôç­N9ƒ¦ã<æ”›YvjÓï¼Ók‡Yè;×45=-€ô·ð)‡OŸV°ÕCdÄ~ÁFÌ¿“MŽ´ M)}›a‚Â/sàÆs³€:~H<¡?þN<¥?¾£?žÑßÓÏé¹áŠ¤m)8fK´9]¼^ÊŸ»QÜ›EÓhé#±U×»†ãšë]¿‘•œžéð‰éñ\„Î›ôŽ	9½êF¶šÓ‹—rzùÌ£ýUÌ#+=»s¦”·š·ž¼!˜®	½º={tŒöÿ:a°RÙ{á3a°/ûSÁ[ïÞ:è‹¶žÓ²ÖK©Zî´¦.þ¿ûÿW—Áuâ©ëýèÒ3ûÂd€¿ž¹¦'ƒ»þ)ßd)^úY‘ÎõÕtðÎ3HJóÄI¯Fâ">¸í0êâ:^šZ¿‹¶s@¸ìá[§qŠ(ëÉÒ&;]=³ S9þÂßÇ™PÕ'‚Ô´õ$²×K¯öO^O$#q}Œ¶^˜ZRx
†ûEPO,4Ú†xñÞ™éÕ„ô¥ãÄìá@š¼Ã…¦†×SgÂ÷Œ–, 4Þm/uÁóéîýˆ¸:›—³ú‰ÔïÒvùô‘m«ó‰ˆa*WJívn–/ös¿,‘þ&ˆ¬ðk”ª9‡îÉ$^.7ò =–€ñ8xY|K¹3wôÝõDoÌîuË;È_/JUì“SUÊ›·ñe—ô”Øk¸ã=¢˜ª)Då¹-H©tù†‰š£MÜ$äûÿØKniü‰›ëù+¬Héªœ™½JåH±}æù/C¦j{2`¶ç9çhŽÆœœÏØ—kõXHH+‘‘ù±´"±zh2úoC=§ óãÏr)Þ»a¶X·ë|X%W±Ü‡œVòI8«MÑ“½û°YtÑï¹[—Ð;„ö9'‰}AIb9G,e“}[<d/¯i8-ã–Û<0fÑÿ0œŽÑmöZÖ,Âð\…_°K'GzqÉ‹‹¥ò¹ry±¼PZ¬fwa¥½*îê“þ/”ªß—¼}Ë2|IžÅâoÀ´K:ñIÒñÿýéPÎ­û ^ ¿'÷êS}‰ÃÔð6Ó Ã×\˜	- ¨]B•R¹‚ËZ[_¿º„ÊÕ¹ù…³øÏ,»pmq®Ÿ.V=—øj<rªÃ²N§V¶]{[j³lu€Ð8O9Rñú®ãè=0[àxÌeV­Û›§Y2Tó<³â¥‹õIH$ÿ##%ì*çÑ{µË—òÿ²VÛºü/hí·µ+xx*šáQf
BîyÙ8°{žž×³/L”’†#áýÔO—q¬ZµÀÇè9¤vxzíL	”Ãbº|HâSJ|E?hÈ…Ü2ºÚ9
Š“ÇWÃ÷8ºÄ!ÒxQ’˜²}Þk„–6tÕ‚„Ùp?_.VU*çL]”éJœ3!a'·–@â§D
Ê¥)ØˆTìg¦‘s¥8K3öÄ¯A½šP9¾ÃÛÑÞ8!>áýÏáqZ_|”ø$°ÈßAJ*ë¶eEø`OÕ0EÎ«ijßOô,ŠPDÛ&Ù¡‰¥ Oµÿ¦¤ý¿ºJošŽ0KWEÓ’d—¾à½PÌÜÄ}p“öäR.ŽuŽì^ìÌMý¹"Y§Gö80BpØ6H}I%àPØ‰ÑXoß>Ï*Á!p§Ë:HÎ¼ÐqáGÙGd
â*$ž7>]cÅÚb&b£uì×ØÃ‚tÊaã|Dðu½¯Šo ß¸ÿóP[$ÚƒìÙƒ¹òs‘vi¬¯‰–&ê°¡lŸ¹ZÃ“‹±µ¥°°-VB›ÏÑ}®âµPº­r¿bƒÜ%}õn$Y"öV{¤Ã)
¸‡Œ–'¹H|âðÛ“¥[ñØ;¿ƒlÞO³½Ÿ¬	mŒu´X•˜ŸbhC›ú<âžl(Þw£i<© ,–K	oL
”F¯ŸƒÐ“ìpXAUˆrB0£<uq{åÊ6^òín*œ¢¤ãš#¸I'=d‡fb!µ¹ð<®²©ðr¾¡‹Õ;úåsÖ<†W¡›Úì×€&JI Æ‡t²ˆfG]¨\»c´-
­qd³Ñk™àÖ÷ˆª¹è²åªy$§Cƒ˜FE“ìp¾9§Ž;G/‹Wå!®”ØÙò¢¨ò¬ÄpKÙ ¿"§=¿°h¤ôÇà:Œ9¾å5ˆ
½e÷<«¼ŸuÁû9e/&G†˜¢”Énbê(ÑyOäÍïp"aÖ +Mê7U%¾¯ ñ~üµfÔ¡ç!ˆ4'wBç&i>n7`¯xÍj«ÈkS
RHVèÆ••¸9l«Ì¡IYò.É¤ökÎ½äzõ.<­|Û-éüb¿P'›ç¿ðPmÂMˆm&zø1W8ùJÝÜò|±t¶ï¬¢<yŸ‡ðÊÉ~a–ûd(èéZTÆvwÓÀz‘KãI«Þ+ƒÐ+––pŸÖ® <*•á×Í+Iu$úêCéú…£êú'ª7±÷+ÆéëýÅQõþÒõ4"÷9Ñ­ý5Üù–Û<Âî»_)ÿ|N£TJ£Ï}ÔÒÉW (®}Áº{šº·2ªî}Å°»˜k÷ï`}E$û¿(@éúß˜X-àµŽevêæIèþ„0˜6–´ü[ï¸žÓ#[.Í´ÔÃn?Ëe‰$’o%€@	©0m³aõÚBj—f¾Q/.CÙ7ê@kh	’záÑW–þc	Ãç~áé?ÈÅ}@º—¶Žæ}<áqvH"‘Þ\hÔ<ak‚Vx¾»Ô_ÊRêWÖò»äŒ}!@°Ô¥±¯ŸI7°ä¢GüýøÈ<Èÿ+Oh	÷óC‚=žø)g~&š¬m<+CÓH@g^û@‚dT¾}¤íHš- «¶p@bß‚Ø¢‰Hð&±È!BóŽÑFMÈèÞ·¼&¤ÆtÓÅ×ÁkZ®Ä^8æA~RPŽí§¤ãÇz<À—|ÀaF
€–Oü¦¿	[M gršç¸=ÿk?/p)®*Äå¾ õ>rÚãzf‚ƒ0Ÿmý‰Ì/‹7Œ¾þû+š¹ð„>(Û@ÝßøªýcÒ2Y|*TÃâ€SÃEö.")ÈŽÝ±ê¨aÞ¶ê¦‹¦Ý¶áx]ØsqgùcßðêMÓ!4É½ŽÑÃÂäXaqƒÓŽe´\Ù£”~¯u€ÅÌnZ;–g»Xý]!V´“_òÞýžÊØ§‘ÜÙO|ˆPòßiNãw4«ög>_£ðð<ó1ÀžñäÔz1Ø¢¼ÿmÆ+AôßHcý¤K†¡°‘¼ö±d“FºZ,8jã)9&B'ƒh×ë½î	ËÁß»]È ™ü†‡ÇÒƒ¹?Qž‡Œý”°cîBŠ1)u»Ýg‡œ	îûH–Ò‡ðCÙ>„–ËÓB²¸åJøP?ÜÀë'xþ$¯ö4Ø[iPµ’µüH'•$hv$>X‹œÊìû _‹¦>ûs?<àô&o'¼=]øš)eqßÇ¼ÿ‘ŒQÆü­ÛÖžÕ2<ÛÏ^Œí‘… 0XŒž/¢ð‘t§kÓ±whÕ) -£Ù6:÷á†<zbÑÊÝ»ð»F Žµ©Ôj :ÿÈ`ÝêbCVD°óÙÿ Oðå;9Á–;Bl¹Úê*ººö!?.Æ ä¦·W¶ÖÖ®n¿·qÕVVÞßª][‹Û]Ë­5,I÷ŠÝ0Z]<]ÊœP÷XÀhHN…PAI	 QUhTÒh”%é ‘?a0H?ª¡3âª½@OÆÉÑ3ÊaôšÔx†
3B†ÁÖ©pdc˜XŠÐU8áKEI¹nA5ƒ®ù+n—V™ƒÅsb­éïÏ­Ì–øFð ÖW±ó]Ç=ì¤ª+q U_i;ã–s]¦gÓ»x'§–É°F“óÝUýq1v§=p7“ÒáK}ˆ\eåž;…D\’°¥ÚSâ©Ïˆ/øžØ{vë»]SÆå(··×V®­o\Eå%ÿÔÐ²ábOlKXª‰›ÖZÚ5vo áRØ®\ÿ¥YÙ­˜»7BÇÀJ‡·[Î®É½‘é*žTKóõùj€«®ÎÐ($¯§ÊZ‘5'Ó/J¡J,OhÑ¼ª^—€?Ôµ°*±H—ó'‚E†¨aÀÈ`Àêæ‚Y
˜z­ŠåÙl…u¦2Gi4BÎŒ¾J£Ñ0åýå0FLC Ì¢ðJ|iÑâRøø±ù’ÈùÖ¯Em~õ]Ã·„gœÙïÍI©AJª¦ŒPî)sšsO“2OÏ'ì6½ÏDVø<îÝLLU$ƒÒø‰à"ÃL-û"mE
’@]Ohò­N·çiÊõºÄ[l) *èÇ¨×Í®waÊj{fñ×º[Åþ$b§»OÂMìÑ›x6% »±²	f+4]@f»Y{¦W€¿Ýw×K7t{¹îMù#Ð€Û‚´^ÂÑ'õð:Ô­¼€€n Þ"_èááC°§	.FŠŽa®…4nØáÙé»¨P ÜŽ³HÔÂ%DÊgýønÁ1Ý^ËC†ËÑ¨ïÍ$6Y<{'øQsWÏxëršÎÔ×’¢ÐRMÎ‰¡W^Ö)±Ìù¦ršæ<u14#ï±:ë¢V¦”`áDÅ&w·ZI¤ÁOžŽM¨ôÜ~Ì*J.aK0%@)ŠrðúÆdêâ¯Y'Œsj“ÅëL×m£Õ3c“LaäœT£—NsyÑKå#m -ÕUGÒ›¸›Mç?ë‹bp$¥gt÷p¢ùˆj2G,ð•	´kÜs	ÃkÉqbÞˆŸCË´{Aƒ `Aþ‰õ»hL‚–Tv|´€ùÓ1½„vÉ¾ Û»CT%ŠÕ”YKüªG &~ÙYõd>âÉ÷)ðZ?Òî’˜)`S—ð¦‹	2t§æŸå’ÅWÏiI*›ç’<Ïÿ©áš£mG5,ðH?r4¤¿§ø³¼ø³¤øW|ÏãÑÐ^`‘×°Hjø$à VçxçHOÈ ©ìr‰^.‘Ò“- þJÇFˆX—o½ùý±›]Ž…0|£ËJž˜\épEMî6>Þi}èY-ªZ5lt%.%.ÇKü¬W‚Wâ%~~Šô_ Ò8!«ˆòÓÀV…´’!½JÉ²&Ë˜„	å…~ö	B¡„ª6”0ˆUáì)äu.[Ž×LŠE{šZ!;,»26ìh!.u³uTÉ…#U¨akÁ£evFè´µoLÎžä«øýhBÅA¾„Ú>•5ÁdlçH5	}"<Ž~ý÷é$†Xõn«\ü÷HÑj¹ìSþi±ÙT`æ’a¸«5»ª)œµðƒW°6M]„‰ëâ²Ï\Ø%³MŠ£?ã¾9¼Ÿ¹Ì¯	›êä_i?Î)°ß“ÊÕû¨'Bu—[¶Ý@¿ÁRØEÓômÖÌHTyª"5]ƒ¢'*ª!©tí©‹µw²?–Çå3?¶Œk[Î^Û2®m9{m¸¶ìµmàÚ6²×Vƒ—«õñv5x½Zòû¥²JÊ)ÖéÕpMxïhËÜ³\|3é™«v˜oÿ¸çs?zäÓÐ5þöc­YÓzñÉËi…Íƒ6‹MVÙ¢~_´ü,ö/´ .ŸE„#YicÆÁV¾”–úà}ài‡•%´Iè ÝIÉã9­Ç˜x(;´¢ÓÑá&*‚0ÈzD°•@ãàW^<+ãyó	°ã–ççQE ^ñ}”
>"g»¨£'=”7@˜$”NYIL§¼dW”Pæ¥frIR¹°ÜÌr# —	ú¢œOšóÙD)ßÝÉW”iº]Hè´I’®÷É¿áLÍ½”Ù{¬ÓÙf$“!å¤ÚœOmÎ’ÕZÃì–úœS6Ì™âØ¸Ó Éÿ“ºš’ÚÊW$Š3|by;DÒä·j2\…B†‘àš
\UŸšªHs"VéÓ\•9r‹ñ<×‡ýì#ÓUŸëªÍvM‰M›ñš)ç5cÖkæ¼×A3_³ä¾œÄ:`kÚDVAÙ†‘Çš"“µÿ\V}6«6ŸUµNÎPã'&µ–Á»¢SdÎMÎjíwG¶Êm…Öd+— z JíòS	×ôŠ˜ŠÊ{‚¤£†}†ûMâ¨d0SIû·Ê<TÒØ¤»þsQýâ³n"E~§&¥£*–Ÿ <üÔò‰X~ÒV§uJ4VŠ  ¦ëÂjW¦O9ÕOi4"1§I/êA[F(ðA%ÙÅ~Äw8¹Núl'u¾S×ï½4éD±r¶M˜ 8ò‘¹/Œ[ÔEZž¥Ú’T±ÜsqO¸xâ¿‘J|Ü´g‘ !õYÉ5Ó¨“Í'öOŽ
eôUòª]÷l\0ýÉû‡”‹ÿ=üÒúþŠ¾d8mh3ýÉSÑÿ8@c‡´GJNÈ;QFõêúê9Vc”þƒÕÐ}(—ôÄÈ5ýŒƒž8¢¬_±w,¶£¥Z ¡Ð
Ô„Rù·ü3Ñt¢´ Kr¢¬é)ÉcÉê’6Q>:•YÕ§,Âg YÍž¼i#}'¿x”òß·ÀkE>©ò¥YŒU²—âcúÍd$H@ :ÚÇtšl¡qJ BuÝ`³>§38ßxì pŸ	o ùßÓþYÛÂþ™PÈdÿl²¦ùLöÏ4Ÿtž” l“ý3åïŸÑ	r²&ô„¿MÕ£ý3ª#Û?ŠpÙïwêdÿŒ}Æá˜„ðþYTŽhÿŒM£Ý?‹V2Ù?ÓåhöÏÞ³{®¹oíb	ô%r÷9ÙÈyMvŠ¾éwWk²;—TòdÃKáŒÇ†›’G´áå—>Ùð:Í3þ˜oxQ)á†—XÁdÃë´jÁÛ´áE%zt^~ù“/éçlx¥¾æ¸b•WDg(}^XQBÂyá!ŸD¬äï:LÖ„“ˆ†ô›žá4,£C"qIHz#šÆßPàº°Fèclý¢»…g3œ!ƒwTb|íí8­4¶'Èd¨V7vYL Üê¿ÎÒŸ³—G&îuÜºÝ¡:-v '½fïND[vm\D{‹8¼v‡ðU#ß|ÃDÈ¯ùáH°{Ö„qx†.Í²J&x>‘ážM?äiˆ‘<Ù¿lZš4(siïwê øE~døW(úy?E/;¬¥ìRã=Ï\Ø¶å/ÛEú“G£ÿœ
ýÉ”R8ÀÇýãÛ<A&œîHp¸ª¦èÞf¤e¡ƒ=-æÏÀ‹>=›ÎØø›ŽéÂR‹þÍMr  ìJûåØûî…»õT,×‹.mkÅÐ=ˆpñøÅ„xˆ•†Z®å¸üdˆ¤Œ&Êv’ýâMÓiqjÞ‘Éu¤‚%Ûï¹Ó+Û©/¤‰«Î-qD«¦gX-÷mŒ¨Îbo	¾ê_ù)ãŸhœõ)âä8/Á…§ø+îÂŽ(úzB&â¬VËØóSohghê6mÐÐm+w SÅ»j|û™Øv=´ÜîT°ÿÆ3¿þ“ ~`wq£h›†?ûE Þ¤ÓlÚiw¿†åÄ Âý­?Ñ—d{Ð–¡5)u y&=4bÙµqâUÀ‰¶êÍ†óŽQŽ¬9Ce^ð ÒìwÕÄ4»To™-k£8äaÇæP;¬9£Ø# Õ$ÙôÕz@Ë/"žúOw¿9üƒfÿa¢²kã¢WJßbyœÒäÜg‡"ØvÜñ¨E'hÝÐ5C(ûäm^lS_Hêš_B›¸Ó-»ç¢µF¯~„|Gíš/È^”î”~,ðc?(×ïÇÏýtÚC^~/®@qhÿc6$	îèK)Yô1p»I“G±OEK$|À{•Òdf–]; ´µjÉI"åI‡F*ðÐÂ‘È;<qáÓ.íÊã›Âãßv½iÛ-F]¦	”·ç±°ùŸì}>£w$¹= Ìô%†œ×ÜwNßË.íe]ðâíP•Á	½äßRH¹†ÑB—l›¦÷Õ(ŸýrÏóìŽlƒ7ªjÝüï7/Žâpã(`f§A<»ªÌåX[ù’DUÏïIºËaËªßÂbÈ¥pÝä¼ÝF×ìLï-×”
˜ø2wðÛ„12âÖïîÎïÎ3·:R|6!,OäëŠÏ¬‡Õáò2-æ™N~d¢³btêfK":´—è~9x@Ký"
£‰_‹ØÇßÿE¯ù#"»èšTD%—`Údi“’«á”B5Ì•Ñ2oº…ºpáÊítrè]”KÍB?!ùpø 	”ké
Hþš˜õ'Œˆmú×3øÊŸˆÍÿ7øQ°‚‹ÏÉ~aÏü0þY˜;ã×ú(øÛG9´„r›-v»Çü_=ËÁk¨r×2[ì€“„èÐYº>™EÛ´g©·F;mX)åy¨…œÀÊ1½žÓ‘_•tyAÅ"ZqL88kD1—Ž.¿Ž5Fþ"Ãw³FÔøa€LpsûÚjþWw±i*¡wÐÃkv[¶íL“_±’5ì6–ä_£søŽ™{7gU…u)ªXT6éï$‹`.§, CÎm)”BùT.¨Tú¢|Ž)M¼ÁLTÏ9Ä¡UªY¡kà+V—Ê,Ê•r3Ê‚ö(q±RÑ‰¦ËA§éï)—ˆ6n×-1¢¿1;¦c´Ô}>+§9¥'©>à!ÊN[}5I®KCG]-Õ2õÀy†‡Ý”ƒ‰ù6~_Ã¥B¯®–Ñ¾KIæÉ; i¹ºÙ"Ï´’Ýš”³ñŽº£Ñ¶œ„_"ú¿MÏ<{}{c› îá¿ÜnËò¦s×r3×K7”¥µì=«C{`	Ï…=u©¾ãbwà,GåÆQõD¤G7óìu¿Åij“ˆr•e‰äCJyT>-B¯)Aßêq¬ØhÚ¡))zCR€W‘8$õ†äYÿJB½ü‚;?¡vE	âÅ„6¬J¤Ñ¿’P»ìYÿŠzªaç.¥§<Õ†ô|[Š“vê™6’ï®Í¶W—Ë.NÈoV–äçüÉsÕ-ò©”Y\Ê§YâŠ,IFùL! ÈIÐ"Û…UìûjÜa—J½;¦m5VEªµÏnÉ~Aû$J(#!Š§ïý“<0‹W¢¬×„\<ÕY¹1£( OYÛ°JÞÜØ¾FÜz»º€ëáy]w©XtÛØñ¢1,¹XôÚP×^lêv»€ ŽWè6»°äö¼ ÒJ+cèÁŽæËîUaùî6
F/«Ó9ðs³j1¹p…ã%p_8ùyâ!ÆðÇä˜/ƒ]H.aÏw‡í_&×ÝS]1[ïÊ‹¥¹¸j¹¤]‡+õl\iìaÕBPþ¦WoNï™^­k½ï´¦sE£kY™.^O(›Ò6½¦Ý€0V¥ºc7°Ú•¯ïÍH¿ÆVÕìLã9@‡FM½ø‡[økwÀ¯…§Xgô Ö$Ù·ôHÛ ‘vË,˜Žƒ×§¹e£~¬A¨ƒ¹¸„‡*ÖBL{MÇÞ'º½F
„
m<ÑAö9H Zâ)Q½Ø×áT³>’UßS‰‡n(’:•÷^%Lçx €š?³Ü^½Ž_ÌÉž¼´Ãz²¶¹žÐsªVÕZÜSiZ•nüð/ÊFÈ¿WM:5¼òêlÓ—¾âî…YŠ¶¾‹nþ*ÆsÃìï=
ÁðÙ ÇÈŸÑÀW4€ïp|KSþFIHh‹Þô5‡I}D ‡f>çq-={-l|‰ÿýÅME›!˜#-n>mÍkà©‹SV²É‰vþÃ5õdé|<aoagO£¸âŸÀ·—ÓÜ@E-ñ-¥afo¹¤	9ùó¡î&?P¤¾%˜Úuw‘å³ú2R¨ïãš»â«nÍË	}¯»/D¼­¾-Ä/TZRÇ‹‹öÄ–	KêÄæ¥ºWX`'6QSxÉœTXò}Âò7©°„›ÂQ@ž°…¯F¤‹Üäš“ß6ºØÕÜ[Ðªïõ—¬šâ„Õ©ú.¶
Õh½¿äÔö[\ªï	-#síêcžÔû˜áÆÞ×õ$_Hj»›­õ÷ðµaN>ÞS-áv#³Mì×¬¶i÷¼éé`»=<ÓçÀ_ž‡YÁRÕÞçõ_VæªæÎqÿ³Ü˜3‹lÿ“îŽ¦Ù»´:d§[Îå´\‘ÍM¶›ÙnD¶9ÓímžßnB\w¥iÖoI(0—eåâ–yÛÂ2…R´:=SEf¢Ú)•m³Çöé#_ÌK£»–»Ö°¼¨¸ 3gB$O1&1ëv}(h)`
;W*JÄßm8v7¿Óê9$SA¹)Ïþü(ýþÜ tpª%ÏüëÕ
dÏ°á„DW–‚Ñ6îäa·ºaƒï›¸êÊíæ8}WhKÝÏ0ˆå
DþRÞ£lEé2º;øÍÕätBº°ýåwàŽéí›a²1uNƒ*Í©Yáý@_)³ÎÑ$šØëìÔE#Ääh	Ý5©
{Åç‹Íª´Ýx\)!Ï¤È°z¿ÐÃÜ÷Ê¹¨AÕÏ²]—ì:wmÇÃƒD·»
²»Êd—Ø×™²Ed—2]„˜/ßBòÛRD‚¼1ZO›Ý‘Òìý6lì øw^jì²Ø.–_—ßØi™$.Hf±IO£LD¹Ë63lbÐ1ž¤·@'œÝúnc×”Æ¾SõËK\ÌÑ²áZõ#„ú=ŠýrAözgð— (ÃÌºo7b0¿ó
•&ýÏZEszŒBP#jùHK‚9§JØ‹’QÖÌ³¹9ÐÍ|\üO˜/ôÈø/ù%Œ	bÓ7&ø9¬h;7Šó²)Éàè|JlÑ³_Ü—ºB†Á~™Ä}™À|)å½ÞÓ…¬¼—
=!{Ø§½,÷Mz©£¼Ô$˜'R¤#»Ì@u™‰è2#Íå`$—é).±c ¸A°.“ã€ì˜qc†®LÃGÂçÆLdÆì—SÇÿ áÄTêŠ>•>~›ÎÀÌeùC©g:<¿â)!j‡Ú8ô¦9ï‰æy€“~BiìxÃ7Á±ôëdöÑtÖ)‰í‡bP®r² ”DÜ³‘–„Ž2¬ÝYB5Ã1n£÷l×ÅžSJ»=ËpbN2ÀG£›ýÃ™ÌÓ“ÅØáÍÃûi=‘¼R!Ã~ÛG!ÄÂ–P6)>içj×Ôü£õÀ¬•D0R‘†˜ç25ßÇÃüá…>>Ë>ÛÇÃ‹üáÅ>>Ç>×ÇÃåº\J?ž@!9ææ†ÐàìœxBývÈGhjØÞï(¿­<13äÓ™aÑ‡ÞÔiªõñørðør¯¯¼õZ+§"šËN»S§ø9GÓxyì®qÄ1
uSDtKóŸxdçäõAà¹þ WŽæ/Ãf*0	=A¦B:VÌ~µ§‘•
óíÐ‚a‚ŸË IbUT²h‚Üð…‹'Þ½Íb)Ý°Ñ3PÁIË©‹ðovò*³M¦?"[
£Ò8êß2¤ˆ"’#:%rP‡¯ˆb~ëD@kïL]¬½“ý±<~,Ÿ…×¶œ½¶e\ÛröÚ6pmÙkÛÀµmd¯­/Wëãíjðzµä÷;±IÌDGWí#9‹®hZüìW<ó¾oà3âÄ#\î³¾pÏÆÐîõŒ¦á@I¡# 	ˆ*–j[2ÛmC¢®=yò»v<×‡[ôxëÊ#K'1ÐDÈÍþ\šÁ8|uã@ 3Ü ä÷(·Þ1Ø"4˜‘yˆtžŠÈÏÌÓïå©‹ü·£›ÐäiôÐQUº^Ê‰¦)ó;öµ¶¦@ÞóÄÔäY'¨¥
4qà\†¯(!¬_[X[R«;.déº$ª#¦ne3ð¾}kzín½¬+e9×j‹w6ÎÄL¥Œ¨&â]kµìý ƒ“¦^_&ÓGœ&áYæY_SxJDà|NöŸà?þÂOv¾"{á¯èQÑ‡Çìgz–qþ¯Ï(t™RG’SsR_Hƒò]YBô¸½›Ë”5¼ƒ@~¾T¬Ds†É…²Û=´”aRò"Ï,×fW
‘·
ó^3âº€ºš">"Çv‡M^'ñ&t9ÅŒ¨[9²:y×
8’]Qo£‰»|ð4ù¯iÓ9ƒ‘9+úˆy-‘q¡/—seƒ]6¨ª*ºM®Ñ&ZùG\G’j% `7É€«Z¶›¾ÖÔ W|Ï}£aï"ÍøGG'âqæd!(f"‘ÏAÏŸÁ„ ;)<|B7=]2¼¥¬œ ¯ØoñM_Nœ uNÒÉš t‰Qh¥ˆ]1NN&hõKaüG;AÇñF&´ªáÇ,£› Ã°.“	úˆs¾_kÃ Õ¥ óýbp2™"Œ‘4"B¯Œ$$B‹N©ÄW$ç×ë^0ÏB€Í~àÍ4?„IþÊ Î6ä‘¸Ó\;¿ïü_’ËDZ3Ê½OçiùS!©¾w<ý.õOÒî}Ï±{6Ñ%Å)Õƒ~»G/÷I“û ’ßÏäOë.ã%ýL?~í¸³X(¾Ú·¼f0sÒMt&ìOùÖÐÃcxßðÅ^ö7ðÓHô,§Ì¢÷;uúÂiPå…a%±Œ§gµIñ}¯»ˆBT»,õDê‰êµê4SŽö…R…(‡¯NQ„Ë¾éÆ·€6m×›E×Ze ”jmrì}÷ÂÝÊñœ¦€ÕÏp3cp/ZÑ¯ßž	h“ƒ›†ÃOàú‰cDß?JÅˆ ®Ž@5b®å8fåH}!M enVy\0Uç‡³Šó#ˆ³¹FÉq–9N¾V7fÛª£-ó¨&Â=‚ä“±Ž¯DÈãÓ²ÆÞ?6×»OÚø”ÂÀ¼ñ+# ‹rÐøt®,Ç•$^&ßÙYâÓŠ÷€4ñ[Ãg‡Ÿ÷Ñ¿«ÔëYß“ûìÄïÉ:ö´+@êBø ¾5Œð=
‹®’¬š/ýúíáÇF¡Ñ2)Ø;ëê,]k¶Â¹ALªßÁüKññ6’N0||ØŒÆËŠðtÄ¬Xëk«WÖ··a•ZÛÜÜÚø v]ÙXÅÿŠ
—S©u»¢§x~+é)°$LØ)¤ƒ8;Ek/–u©f¦NjwC,u@ðNRü8øÏ4çà	9@D÷`Ó¸ø§2<Nî\=œ«W„+žÉ.:ƒ.YÀ/ô‘‰|9ÎIOÌöK1—– #öî7ß<þw“ æCÎ®w	î¤ZÈáÕIÚÃM Ç«áï÷:€àÜ5ü-ÖpYœ”EÈ{c4,5i{(7Þ„„#0Ëvã ;e„†Cb+`
Á½»ÝÛi[Ÿ“WìÎ®å´£{/jUüHa”­Ca4Á7Ýž¼Ìe3Æ³x¥;¬ž´œl17^ÌÉ,RL+ÿˆ­“Ä SyÉÜ=ýGÝª.yMÇVt7i*Üám¢Á;©ŽÃ§a¹À÷"çÍM±Äò]c•/,*žn15/Í¯”÷‚ÜÉÒÃ'pXLb*@û¤È¢ 	[ä¯Ag8ò*Xêø—	r§…9`beP9ÚÖÄÊBµÐ“Óá•¿rÙ?ä%|e~anîFj™ë3§W¯éŒu  Ö@X#®®êÕ¡dÜ7t‚ðòÉSjZl‘¼U€ÙÁg”Ž6»¾mu.L•UWa*±å¶ºXºÆlÀcimF(Phö
èØi_ú™ÞšÖ. G·˜þž5 Äâß½yü5Ìmðtfã;Êô«!ÎkP^?³<×ÿœöÿ  ÿÿì}msÇuîwÿŠË€k ÄA‘0I€l D PN®Âkv‹±vw63³aU¶R±âJÝò£ŠÂŠÂ˜"Z–YLÅ¦¿ˆU÷—¨òKnŸsº{zfº{fðE˜R‰‹Ý™îžîÓ§Ïës^š«xD¬…è™C‰h…êž3ÞÀúTyxˆ'ì„aÔöÉè»A@½Ã`Wh(AÌ.2®:OOwÑ®bÇþJ7­$y±+—yƒ9Ã™êË¶!¿Ôr=>á{ç+»'é«áíI'ê¦cOâs§{|eßm@!	úÀFå:ÞCÁâß(bn¬æ.]ˆ’øÌ•wú¯$Ñ*ð´þ•ŒÁ£nîÖmz1ìt8°k?æÓÁ·x »°å}‰Qè_+l¡?‰ @øùÏü‡’n`º±\ÝZ°ËÎÉ(:8;W„“¿LÏƒÞR£”Ø¶ÓjÛÆ|‡!ñ¸AÖ$i©<J#0oógRâÄèJ(·n€rú5&¾Ü'›,X_ïãb|FØBŸÉ¾–Ö×gx’ƒùrž8F?	'6¢°âÚÿ$Œ> [:oñ)hÎ1˜áóÃ6®pÑVcµß•c}Â$U}ÎŸÊÿ‘'1i™æ?ÿR=û•œÀ™6š¡çÒ<tWâi=è?²7þÇ¿PBÿû/4z‚Øâò¡Û‚'aâyK¿Á½öœx&š…7¼Ñì–_±{âGñÑ-¢¿o>`™Se:‡Ó=ÙÐÜa`§UÃk·XW•o×dÏg¯ÛÐµt“¿æeþ;—‹ÜìPÞ¤ÇúÝ€Ÿle‰½É\¯à7^Ú„2“ã¼Ým<è…[ÛîÍ6lì$u¶äÐžq¹Y\fr©¥ÑæÃàè¦ô¼O6Ì{Âîîú–xÛ‰hdÑƒo›§ÈŽÈn¡.›?¼ÊªÅh„7¯ZvÆçÔŒ§2„šuþÕôìÜŒw³†¼lD‹nñÑÃrž¢×{1ˆ\^®ìû–Þï*Ž¿O1|ê>žIêXy ¹7B
ÒR’£CwèÙqZÁ&!àÒYàwGt²¿»²üvíÆê*8ÙWW0,|iy{aeuËîo7ð÷_°³ýÂñ:Ûgù§Þö
š ýÕ¦æq’8³Å†³›é¬¨:=•‹º#9÷å‚¶[Ž4 ‹¸oÚë(–Aàã×
T4¿ýs^·Ç(4‰›þ:ú¤{žmÀ`äè(ý[›òÓuç}}¾Ÿö][ÝfÃþžŒ4Hõk¾/ ¬qÖ6¼ 9bi
Å^-fJžÓzUvßÈ_8ÛÇF£0NO~ü£Ø~mmëðýC+Y2ð¶ü{FÌÓ7º=ø³îÊÛ#*±.À©¬¦”b¼~LZAOM¯®aG;¬€”)û¸*œÊÙm©|N¿§Š‹,$£'©œršÚ§¤­ûMÿŸ7Fr¸Ùù)ì"­*U!âq’†QÐKø€•/±°”|\[·(|];Ô%³ä§q.tåâ\ªÏ¹`e#9o m£Nøn÷¡Ë Tá UôÂ¬¼wæñsîÌqF$€¿Ë¢"¦³É{V×æÆ^ÈßòtUôçìMÌ€(>s.ct²©myaKJ-º£%X8Â-¿TŽ¬Ã ½^ï¯›Ð«þÐh#Ç:-GËš9d^;1ß¨3Üì¼¡ˆ*$Õpçg ­Þ€ù9Ã_|×"?Úy—ÏtÃ	ù•Uãã\Ëú*FHK·Ö<TRöFïMÝthA¨£FS{!E÷¤iª˜`Ypç’5Ä¿&.Ž3{1-B3(×Ù¥Ûc‰3Ú;­£×ýùüU¡*ýåèÕA÷â';›N¥ãe`èï=”5\ý·8ßoo,°Ñl’íXýIOu#märÖóÝ]òþÙY6795õªÎùi¹~ D·O$is‰ì1Î³Vo¸4mœÝ´€ûÅ/ØÈÂ÷}¾Ô³ûT3ÿB$‹e:O`©(Î Ô©|uç°™¦UÊýòÈÜ	»aå©sy¤ë¿²óüT:Ò‡Œƒ	'y4$é•¥â$íz¥‰D½~vaPš&WkúmO@§ox]¿]ÍûT©¤
Ëhûûl:Žk^'häp^EÞYEu•™rF)b³z(…æa°LzUD…üwÖÙÞŸ$k ]ž¼ó»ŠÞŒ¼Ýâkuo<¾W`ù_jŸ%æì‘‘}"Bès6g%ž‡¿#»—\P‰j»ä'^ÐŽ]¾4"qVì¾»Þv ²®Â3W
jŽ9oì-¸×2w™’9kVÌ'8« GçÅ˜ÅáP¬‹EœàæKè/(ª/@»e¯–"òWc‚'ø†Õàí(T„xTÙËzë%yÁ{b	!4„iÈZG>ëµƒä@{©«¼¶×ôã½Àú
–}W7‰.…˜Šòµƒ¸jLü·‚Û»Ó·‡ÁôÊtç(í§2uJbkj@GrÉ¬ÞbjÐUM‡Îâ]STêˆÌ»={ÙÄ~¬èb÷@ijW‘”#¹CEîeÖ²äèXwµöµÁÔÌ,ä¾ˆÓ„ÿ§¥ïÉØ‡¯˜ýúR~õˆØè3’Ì‘z–‚V aŠ+/úQBÄä»éßÅ¥€ØŒ•ºž¡{SÑ]#Ü­·¡néˆójù;Í3WˆìýfI‘2%é”\OŠ\Kr›xEO•(kŒÕãMS c6Ì|[yò®àkOÌÃÔBWÖ·—7·WÞ]fK+o¯l/¬²¥ë‹7Ö–×··ØÆæ2F(UÑK‡+©ëuÏíK×‚¶¿Í68#«ÙöûÆ?ÿ‰ö®Š8ûBO£P(÷­Lîpy§nl´ûÍÃ?0éÿõ–ò\çÅ´~ÃdÑdíï»ÃØà”¯ Çµ6káakbRµ
Dé•bÎå¥JQ)Æ&UŽ9WeeáÅÛ‰ÃvŸ¿Bö&x‡¨ÁÿÝ›˜>Ï‰‡ÿOéÄFÉ!í´É8 ·SQ\‘Ý\TÜ†:~+k¢‹Âw·c¯ñî¢Û0‘~×¯][Y\YX=Öc”œó9½ÃÅ‚Pîš«ý Ý„pÛ6V3â<ÒÜvQ³e4?ëªFßÒ£ÔâpWSàœ¦N‹uv:gÍâÌ«ç¶«:×µÎ¢«¤“IÉVCVÒGV©¶Z"ålum[¼¥h±õP)ÍfùmÅ6GÈ™+3SÓ3Ós3çg§ù§‹³ç¦Ek%ê:Ã„ßKi8Ëýø‡Ãªªf1¬áæjÃïdxã~ƒ0È¨÷¼$	[‘×ÏlÚ²‘[×HRž™y¦&ƒÖ>KL¬ìÌ•ÿ¹÷1œ¤}À¶"¤Tr®²6Y÷Ì™+×°8Ùcë¦1°Q»Dz?B­Z“Ê0ˆÈ¢i„äu¥ ¼4bK:Ú\ŠjÒÀ¢ËÖöÂÚÆòÒ\äKT”]ÞŽ¼fÅöE¯g`´™9FFöRYˆ¹rvüt&¤ãsÖ 2ÞW¬»M/:8iæú.ßûØgØŸß.&4ÐqF¡^9èWÌ×›`Óèº0r't{wZ›~›½Ãy›„Ñ&B9þh7ý¸ßNx7aT*²¥Þ}3_È²ª¡_ltáûcÇñ/ú` úZ§@MÄ…ÌÌº|•—C:Êñå£ÈGf>I’´Ö‡¥Ó;iùHMÊ‡!!UþáUA
¯•Xw™z
¯Šñwgjœw$NkÉ–DßáÂ[¼ôÂ±dÈ³m‡\šPq&:’IE#´YËM“»zœqeÄ
ãÈ»Î­¨-éŽ7qÂ¼f‡]6%àýÀò˜‹@JŸ)¤ãóî­O=–_.z$,î·Z)…ívÌä§9:ÛÎ×CòÜ’x—ôÂänÐæ42#ÍOâm8ó|@yYÁ6>ê¡ËiðÙÖû0‘™þ&Û~·•ì±ï³i×ÌhoZc“I¸•ðýÜsÎkXrda¤ÊÝØ5"Pªª<ApB©„Uœ%Brâ›FàìÈð]8dl=Vb8° Ç‹ÿâàKŸa¬†²À/)K“°àG„(œÃæ_bëË?a‹«[F”€ ^h1ªâ¯%$?ÀÌŸ‚ä¿eÃHS®‘üz>EÛÈ€¼/BV{¬Ùdëþ~ªø‹ä'³Ws°ç¹A÷-ç€é…óHP*ÚáÏØtßŸ³œ²V&øZq-‡˜QžÏT0p>»†=Ñ„\%à£2YÔEé+–fõ/ù»€›ÐàtvhV£jû·|H™Žé`…OphÊ¼iL·á¼lèq}P¦Â×µÊøØ\Å>ßŽÌé­Èˆ€¬Eõ0 œ¯±‘…å*Å¢Èì£RÊ™<§¯ßNFM°ËFßèúû¸6XH¬Ë_o’q.Ã±ÈOú«Ïi’êJ“ËïãÇŸ~÷Ž¡­p5Ü÷£E/öGÇ¸†`¿£gßû?ÞÄÏ§&.Þ<Ûg#?;|¿8¼Â _ƒ@§hÜ22øy!ŠøÈ2²>ÅØdÜk\À3ýÚñzRð¦ÉáïuÌ³ô^Æg²òº¬¯°©1ë„ÊÁ^ßùºI
šórÚÇ?ÃŒÏ³Â"˜nEn‘»¿3Ý,'n^Î¬ö:œÕÊéžgïqiþ¦±dE¹þ2ÜŽÜ*;}iº=ñ½Æç ÙûÅ·Æá¾³ÈYD’”öØ[§LÏ{IÂÕ]  [¸ÕÊ5ùZ¸8gBÓÒùK¾g>ç8Q4ùjŽLOMŒ‹¥!ßç;45™yè­ô¡eþLïUyêbú”Ð„Ødg T`Ì[04p³ðÝ¡Äù9@Jœ)?VµßS•5ú¿iàV Ûq)Ÿ³¾FÃçgIÜ}ßÀr¹FvÑ˜n1ô€íœZw¼˜/râßxßÐt¡ß’Õ7¾ù k	ãbž”}HñÆ­ÂL½›ZužÆÛ·ƒŽö“ÑÔÄ•{ó‘‘±qÆÏ¾©Âó‡‡y«íÄtk#[6F³~UÅÞ ÆºË¢òP‹yV–‡ó"^&o‡¦o8&Œgòï‘C‹Y -ñIü_.%Ô
´ì þ/+$ãõ ÍEbµYã
ÍëÚ£Æ*¡Ä4ªÖ-BþÓìNO³¶w0ÎÖ¹ŒæG¥(Œ¯
ú³QP´Çû®"qãÿ¿Š{L•?€Ý&ö¾ìX6\¿³h)öýã€)7íäâCÜB¨ªº^A2¶˜ü²pà`ßàb²Ç÷ïí ¬%ÜÈþý9æV  /ô§ú2ö3h»*œëèÐÇ.ý‘Œ¨mðØòEÕºÈ=ý1Ty7Ÿ²ºµC¦»˜íÊmŸ_ÖCÇ{ÎtWò ñ¶úQ/¾:n&$Ô”!²!¥}ÛÑ™+ë¡œæ‰òjîmzÇïôÚáïÇ¨ôò?Ç¹Ú}'ßŠ&ºýÀ?¸|‡ß|¨ê´wz$h]I?ºû7/Ñ`ûX¸ØbNãa§ãqÚr¢\£1WBy56µ*ž' û!í/lT¾+m`ùWí½;¸ nÚÚÒn2Ä½šb—µÆÙÕq¶ø:ËÖ–G+žŽŒ„“ž6	ëôÛIÐk§ÆF2"@à•OÖ.`€ìX/U„þÕð¶×Ûæ¸Ö¶eÁ¯Ü~Ä×Ë¶Ä/koJS š½Š è{*P`œ,y#7‰™Ç{âKüÛAŒ‘[ådÐm´ûM?†¦l1d6·j©ð´ˆ÷
æS´³Ác–MjÍù4œÑ¿®ò‚t³kµã³wùM~ØáÄÙ*6ÑUày¶µ¸(§]•>ÅªñRa”–Hiæ?Ü~j[`y2¿ûCŒ6¬½ÁwPp•‘9·±ÈK#GÁ¶³l~vª€9O,b´Ô]G'å	îWpgˆ‚reiâŽÊe\¢²Dò¸ðS-_{¶Züzðõ¼[gí¹3”“GÛõ~äõÊ¸½àâÜJšÁ¿²$™dý­ÞÀ¬ŸüN)ëçM…õ·z§¬ßu'ë—FÅú…s‘µz'Ïúå`´HÖß‚{[Èú‚¿%¬ŸïŒ—€é®CÜ \úö$ú·¼n‚9dTºˆÑ8œOßòÐ!È7ÍÈ9}–ƒyA¹›¥t•ã>Ùb¦UN*—b®ñÇ$È?+\<®V ¦×fýž9ž–â8‹tZðAªåÒe&àAEEçª­b¼ƒÝ’ðJÜå·?¼"Tÿ	Vcè$x,ÝjŸK˜Íçlô{B2KðøúE{Ç»}ù„ñÚ~‡šõÖ_M›%h3ÔÝ’ïqm—‹ßîýòò•ìÔ3¹N´|g½(W{š±xg.èÕU½óˆIh¯a™ÎãÈÇ<‘¯Ît>øæÑ?ªÀò|2F§9cñK
e~'ÿí*enÝ¸ú£åÅí-@#ø›ÕÕ…«7¶ØÚÂÆÆÊúÛö:™[’·(Š!¦˜	H*:1`’¥/³X(ä:S·9Ú€ç“\ÊÅä8CûÝ C µFeÔ3ƒô@ýF£jÿRdç=?çxŠxZ"Krt^\–ŽÆcë‚ˆ^º†`NX&ó  cÎÙøýïÞÑ¨^ÎN( ú?«ªñ«"ç„ Jþ“:*‘àÝ?|Ÿ3&KËb_8€d‡~ÌÖ¼^OÏûehÈÆŒ¢aæUÍ*b®Èªðï*›'?‘iYÅü/”xt?ce•PòO5xõ?˜2‰Ä`qš1”†0‡\É^âµÃÖ¸ŒˆÆ(p‘.$³‹úQ4úí~‡³„ž%mÈ’8äÒ±ªç‚«Dì,¯ZýÅ$YÃS*'Õ?½+a4³V[ÆláCŠ#7îÃWÂ
Põá.Ò­dÜ}Eøú²ò9¤Újêöœ®n¥ú±¹BÈoiá9Al±EÚ”‹´)­ÍŸá¹rªešŒ}ÊUŽÑ@8kâœ²(ªM/ÞË[ˆudF*¨éFËè«©ÁÔÊ½Ls/ò4óKóÿ±žDþGQþFäõÏè©åÒÏ…—ø©ÀòO3Gó½˜òd1gêD„)sŽÙãÓsà'“P´G°Ý˜íø|·ÙX©ÆY‡²6¸±ÜLA7Ñß)‚SƒH£àòÞ­¼T–†z³n‹ˆŽÕw»]^¢Â63f9l¶¤hDŸf™³¥L1o·ŠÆAk(_®Ž¢NÐåbú{s©ï¡õO-+_¼I8ÙÝžæ,°î˜„ÌŽ62]‚…at5xQ÷’¹‘ßñ‡‘^‘eÒËš¦†Î9Øj‘j©Q}s•Ü˜p	¥³ÚÍ˜sŠ_ñJóén^ÇÑŸr¡pEìwø€H` •?,óQâMî¯ß(o¯‚c4—Ü·éw¸äÓTÂïwS
e»‘Ì¬geÆ”á—MÙËDT»<Š9eç§4X*‘e–á'uåÓô*ÝðÛ?ægê À¨Gö½ôçN·›Ö]Çd½ÊÈÄ# .¤–Jp;“ík”[ªz|éP³çj[ÊýóçÅ£¡a‚ì¦†6×Ç‹K<ŒJNYÊ\¬Á‚?"gÐêIæÛÝbÓl‰l`õri¯=£tÌz™óðbeÆZ²Ídi û1—	`*qB†Êãéræ§Ò•úø¤®_"µX|{ÚÓy«µbœüôÔ´ë•ŒÎ½Ù"ž`Mïžø:oÂÌÙg¿}'„È›Ò»vùxéýÁóàù7½«‚Ez)FÉà)ûe¦þuk‚6]nê‡§Fý"Qƒ8Ý†ŸÌ¿9•“rïrÅEbøh\O`Ô@xÂYz*@ûØZ‚tõ§¢ÚSEÝÑ`Vàv¥êŒ+ÔãÜ§X:Åéc‡EÈýrê?®MX®ï8õœŒ~³ @P¤v“c,lô»ù“vŒ%á`ZOñÜ±Ct2£rÜnÕ¥§¦—ßbº8ŠÝß®O•Šgê¸*:~†Gª/ìõ”æÂ×ÐPsaáh‚|ª:í©è¿=1¿Ò«TòLºnK¨h®êDŠ	í¢K
'iá+	ŽæCK–—V¶–êÒòöÂÊê;Ë¯¯_[yûÆæÂöÊõu{„É2g‹Ç^¢5~[’-™Jp	óºA>]¶ë5ñßŸ‡a‡ÿ;qqŽ5ûÖrQò4eØq([~’ðÇs¢cŽC¹‹zÛïñü„¢ú3\
CMÃînÐêG"Ž?h’\^ø’7iœé@ã,—†š(œ² õóÌ£ú“Jþø5
_Sésd
åmK†p Uíú‰,uM0¹¿+úN­3‚–*¹Ê-Iˆë‚¨·=Îó .®È —"® Ñ-R*~Ñ1-ÚÁqÐ2X@KU8Üj€¸Ì±6¶»ó”7zMDŒ%×„ä/—Ó*`”GE‚ÌcAº¢}Î1Úç*bk®ù‰ÇßÞc›á~E¿I!N!îÊ[SË(M]–¥ôœLRÏÐA)­&,§³ÄÂYÅ¾YjÝ¶ÍÂ°>P+W˜$wÞ—Ø³O—¦¢…ËbÁâ‹u‡ìOÂPÝòi¸4¿ð+™)d5œ–•ø¬o‰í¼Â;wP—4•îíë@›ƒË°õ¨—p½J{O n~K7ŸÃmuÂ€œÆ>‡Êih{¨Àœ†öOœ;¶ûÑ¯î:€' ^)Á^F}tAZ„ã¬Ì[ª¶“?ãºÚ( Ý8Üº°ò´tF–;^îêÚ}ÔÑÐžvTÔ°?5´³¦PãHGNMTF¸^ÑSÊntÅ6–ÌUàŒFLFÉ¬&âžß€Jõ@Óh9òäÍ|Òú¨Ÿƒ!=ñºIû@Äã[Ëä–É²`Çº<Òay}‘<r8¸Ž4ƒnFiÅwL‰ºG4^žò^)+`P€H¸rHaÞ\#®R°0œœ‹‰C(ƒ«p\µÀÃàª WÛÇºJb“^Æ(âšÝ¬±>(\j“½~¼WFòªŒ2–é‚ðë¶’ÃŠÏÞÙš–‡ïPz¶ªq–ôPÍà*‰†gµ-ñ™²E+Ö\f¼3jwàêãðŸwe JÌ®âYU5zþ\¹“‰žW|^™°mQÚÆóÅ•Šf?ëÆáÛrMmú“s®àY3@Í@}W¨¾ÙøLgÿÓ
ù¬ÒÊ%c‘€$t;õU˜	ýGw(¿+˜ß–‰&¤"Wõö4áN&ðMqÙBË¦I×³vº$)%‡jØÕ~‡CÚ¾3ká:Skk9¤«|Çóð#CuTé¡NÁ÷ˆTîæ‰F&ío˜£KžãO)!×ìÉ~†MÜEqõº±šWú®´BA÷÷dÔÉyþ	º¥ŸRØ/åó_âˆÿžTþ‚?|Tê¹ÞÞbÆÿKö|Æ5Œâ’ì±ùñàLà&Š»D{æ$»cÏÏd!¡–Ñ}^³É:aäÃ-]QÖ>wúó„ê£.ÿ¶Ý@oKÞº¬ŒÞã|·®ã¯ÙòmIýæ›ö¶ˆ	º€Ä\,V7=9WEžM¶þQåK¸ŽmrNïµƒ–#Ñg’æsÒÍ]‰ßŒ•$n«LÎj™Ûp{FÏp—žG&:9§ò «á¦è¼þ
JKõ$oãºäÖ"—e-²’19º’,&ä·Z™Ì•Ò”«dÈë4¥Ùv•¥4Kƒ@$4ãÆ¨ÔöË™Ñ\'Í8SŸ²_[­ÓæXeÓS'˜Ór´y‡K>W½}J¥w´,ä7“ ãÇî	Jº±ÛQ·mð¯ú|§²:Æ¥à™Uú®uj’u'Ãõ3‘Ldš)ÌrHVÎeÝŸ˜>ksáýÃÉÓ-áv¸—û`{¡œÌ1-}ÕÑîN'µ'ÄMÁZ/ÏÏ—+Ô6&8’1çÕ¨ *$¤½ƒ8hH__&+´Ql–æ·‚¨J$¦j²R)éx2(¥§€g—”o8§[à:’`WY¤«&ÌÙS6ivÜÉ—¥Âš[hª" •ˆf5³!kæCÂU!ÑSÄ»2:Q,s¥uV‹˜’NhÁ†”|9(¨M=7§5£ GøÜ‘ÒÊÅ\òæ€Vô•õíåÍ…Åí•w—ÙÖò"fµ½É¶ÞY¹¶Í¶6–W®­,f“Þ¶j*òÅ²£¬›ó§ds/©]üFìGGC¯qÅµp¡óÉ6D §°yRfìð¯¥€ËÞ"Y8fgSËš×;’½¶AÙæTÝ®,,Ëìº…YW]Æp›ÏZ¢ÉªÐŠ?ædiõM×ƒÌÖ_B{Ô-<øÙñe4±4v‚]¾­‚f_æ4©D%ÊSÂ˜‘ešZÁh·±<…4ÂÎNÐÅ`¾ä .Vfb·³òÃ†^²Ã7r<ªçÁ’qÒ‹[ãŒÿOš'íòC…H‰Ô~I-ž”wÑ6C /w Ü–KZ–Q	ÖÒ…Æ£Z2[j&]ÅAÏNåE+.òûô¯Ð¿ál~_ç»ó\zá«*c1õSÒ~î§r#\5œËòYñ Ú^p
è¯·
ðŸô½òB}¦ðma·‹ ‚!½oÄMP÷~\Ž¼šæy‰3-EaïP{°}Hå¡ÉÚ³ñª
BÎ¹A€¦3¯l¶„Ù´lD^f¶œñ¢åa&âÆ’|“ô¦ Wq¨U1ì%®)v»x¡Ñ¬†Š§ˆdâØã¬†iE^Çdu\ÈUòªBS¹,3d AtÕ%*ÿð©3d=”â‹ðJûMNË’/ÒëŽßéµÃßîKþ'_ÃN¯Š³øš(ÐÓ‡’ùŸ¤ü^I?Ö¡Tëß™Ó¡ßWÎOe‰a|¡„k£vO»Ö°]2 ,¼PRYL¨äÊ„«Ž;®Ú.M¸Îží‡-¬®¦’1WÙ1šBð‚JíÑ=
×\¤p‘ñP„_hr´aÍ	×±J¬zÓà½lè anV8¯º=êÁ{{’±àMÊhGÇ#F›þU
/M'Kzc'¦ëÌ3ý=ÞÔM°´Öh…Œ’æ¦ªúé²™-ËÌ•úUÉÏ,n­|§4ÏfóX´—7ÑYå¡THu×7¶Z%ö·RôoÞX9£+ÓÁ¤ÆL1l°ºr1¹287\ƒ
…Ïø™l.Rá‚TFÎÉG)I•DÄr÷º¸ó¥<(Ö¯¯/«Mzz2Ø›>=Äu'ÃéaÆKuÈº
ÙBÊt£
1¼Z)lÆŸ«â¡mß‹à"ã’		s*¥@¿(ÒÉü|¼´0œ%Ãw™Ndµ9KâÙd2­qY1“ÇbTwõü¦ŸJ+ûÉàÚgfBªÙŠÊôÚ£Åa«ÁÔò`ÉŠc* {H–¸Ç2eà#UdÁTíât0}DùT¶]«ZSÌ»å|öÛ~.|¼Ò6¶ø}ÒËf®rÛxgD ¢¨çU#f_fLŸ3¥T[¬²XøþN¹»I¿„HÓÞaB˜‘ÇaÇ—xÝƒd"cÊ+J;•Ò€Ó+“ŒocK
&Òr‚Mƒë/Ó'³G\¥•£¯–Kœ^u³ŠÓKåËÅ«.$eÌÐH,IØjµ¥Z0ÌÊVh¾L•LÏjäÃÉWWý?à*÷\šÀš^yÀÅ‰¦B˜­A7®ù#µÈÔ(+WÒsŠ4*þÌ•Eç«—B’é¿\^Òo®è «š´\É”]aˆ%í”Ë|eAùÖÒ î¨ü:C¡s	6|ÄþwØåË*ÒÈv½ç ö(¤2›¢«¤*a®:Ùz!‹uFß_ˆ|vö™·‡í~â·8³ßí{]¬&a¡<S áæ7"ªJ
Ðw.¦h » RÆ“ï¹Ux·©Eäð¤`o-(Õ&ii›Z=ì4÷²~½¿z€±úSyàXSˆf¤ª¦X±“¥:f¬¼l»ºJALTG¯.úEí€ÅYa›˜I­¸Ú·pVædw>£íÀ´†ÐR±N
¾ˆ‰û
•‚%uá÷øûS½^ƒÎ¯¢¤;Ë|: ‰ì.r[5{)(¢ŠÄyü…ûæªº7s¶Î~A 0VA÷[þ=®ý}Ô'?áˆ°Â÷˜ü›ÿñxžm„qÒŠü­¿Ze£ÄuH›_òo¬Ûü¨0ß6$”ó#ý˜«‹¤žgRs¹¸ŽrOÐ\nÊRÓåøë}-CfŸ’9Çë6¬ ²é^7þœ&*®†¯Í¶¼[,í““T9YMçê–vv²ØƒãÔÓlÛmxi+;]ùa›ÀÇ² sJÜ±A¾—ÔÐÂ±]ñpÎÓý…"Ý_”t?”âEG§ù§h!£zXOUŒøŠ®Í”ˆß[Ýå(FªXl?æKLoë‘»kÇt4ŒÓb0ù¡)FÆû_Ú±-´Ú^^/Qa“­¤Ž&Qße·Êìƒ•._mjèó´]˜[ýƒ,8ãä¤S®µþpö,Û
:} YÖÜaM¿íˆÏåÛ\{ 8"À§o?÷3«æßö}ød‡ ðö½ 3øØFv‚Øåí…mÎiÊ+¾gÓüxpi"U—a×kÇ®ukÔÖ­)é[Ÿ# Ö’$§€¼þt¬óÐÅ.ø½#Èb~*`?ÕXì&3ä~—6Ôç²gn°Ñ+3ž*3>©JrVÕG±šù°ç5‚ä ô¶2ˆW+×¸•SÇ‰Ø“8÷¸t¿>é*ƒBOî˜H&pz‚ÉyÁh^YH,æ'õ™+¥.»¦f–ÖŸ¡Pö/¨ÅÝ%¤(	Íó8Êì¢iÑØ&üRj@¼dÕ'ÝŽ÷üªƒ-;É“PË‡ÿß™5çšŸÇx`S	„ÏUK)¶Ïò¥f%£ºhGÉØ‘fgàR˜–¯¿SzsÍÒ†—+\Ù²†P	ŠÎ³…¥µ•u¶±yýÚÊ*äŒno¯¬¿½%oÌ?T»§K´a6ø!çs%C)¾Ã‘+òÓq7hûX«	
¡Äbv>ÊŠ¢©°B†Ý%‹ËvBL‡ƒþË Ó¾|çünžM³˜\‹žš¼87ÎøWÓsPH©ð´à$™§§ÕÓÓøè”ñIÿ6ÔªªÐiáIÝO’/Ä8[À|iEÞúXóeµêÊ"\æ|æù~qc iÕ(¥HÛÔ\cn6s°õøah_oaâ©dÊ‘SÖ\Ò²éLE¶X»\"¤#Ê¢Q“~
Ø5Á.9}ð´û²ÎÄB"0ÝßK“Qª(Q®Ð‡üO‘ßÎ·-û–Ée&C["q‰]L¾óôÔÔÙƒÇj¾¸J¦Œ/U–nš÷+b.D…eú¬AR~®§?†NqM±´]¯…>“ˆÅ1§.¶òébNL	>{bšA
æÉ®#µWh¨ð Y·(W/‹µ3SJI•…©øŠÛÒF32˜‘
ª°BÿK[‹!»9õ‚PyRÕÝ«Q±(á	üý1„ÌkÛ˜ÿ	¤ß74Î#·DÓO¼ +=2£fšAP*ëf³Uk"Ê³Â|R”¦´všZJë4…?Ù*~ÆÏÖÅ°ÝïtÙ[¸Ååïˆ½É®ÖRå½ò'€]sù'ë,É¦™Sò;Ê…0,ü6ŸýŽÛ³
» –Í€˜1ƒÂœÆðU ŠÐbóq ´dxC©¸'F®|ì²³TSí4Yg‡«ˆ•Š_xÚîBÃÀdcÏ‹’Ñ©A°Óiã:Ì4¾«6U2\þ]Ì$/Nj>öt€`SK ñ]	Ëñ\Å.šù…¨d‡ø¸	°N’<uC…ŠÒ•òk™Î8ÿz´î%“ á+W]*÷Ùç°–Pòkäšü«çÓ[Yª Åƒ’`:ø*†"’¶×¶&Pœ˜š.C…©ëÇWcöX%Ð=Äù"0NäüÏ¸ ?âÒ˜ôýc^‘,{š]Ði)bOYmëÙ²‰ÞÕáBEÛ®~»9ØÉrA-»ée˜%çä{`=_wÉ9S×Õ°*Dô‘*ŸÉ°üÇ{Oiô¿Kñ(‘¯Á†"ôÉ
‘~EëŽ°×4Ý7–Vï…K‚9äKwèŸ	üR—fG1IoTâ fJcK@*Ê>èÏ/T8Ë:«E½AÆVc£šê¯†¬$Xã}ð¬ÇùõØ"‘es…â—"–I½à+´šé¨‡¿+´ÆO7‡íwØË®O¾&ÛâPá~.}%T?E„?|„§ÊG¤œã®¹¾»4¯MS0äãC›Çµs°ñáïlöt·Ø~Çš]{0¬×c·Ì¹$d}%‹žàønâAý)x÷Wè|éÁx‡¿K°ÙÓ]bûvÉÛ~·‰Å¿Õ)4{¸T{¯ÀNyª¹Þ?Á=AoXm3PÒÚôÛÂ>†OÀÔîp(Xê^¿UÈTp‘tIž}émÍkû6ÉüXäÍú³ðfµýª¨m¹n®ñ×ÖÑWèxNIÓ¤òâÝvu=ÙsHM_hf9ñ™D¤d¨¼¼Çr·*œãj;›ìmN+½Wžk<QpBÊ®¦bz8õ<ÆÖ^øx¹Ét„ýŸ£¤mŸrýºóÞÈÂ÷¡böÂüÿ*~¾ŠŸ¯ãçëøy~Xà¿PYíVÔ«‚Þ˜ÁmäÏ(ÐFø|ÿ_W¸A+ïlç¶ÈØôAH&WÇ–dÃŸ¸ÙòCô¹t?`·B`Ï>§DÜý2ž„Ï@…Ý	FëE¾çÚýQ¸_¾3S¡&O–=aÝª<¥\!k²ƒ—OHæÚGü\5!ãp¬ïPVÁÇ±šM¾õwÂ¿§…iÑf/„Àë½`2÷hÃ&uÑì)¹ËkøÕÒ	Ò7–i³Õ 25 Ê—’]ˆûyrˆŽÙÓÆå¤ÁdŠV²âÁ{rii§b­°(1Æ–ÙÅ‘Y"¶ŒžY2u®©j8ª2Õ›K½hÆ°rë1uH™õ™N’nžhÎï(:$†Y;@ö åÏç¿MCÔË’´°ü³…¸|õÛp2
ÖVV¯^ÿkö&[X]ÞÜ>ÙŒ‚5/hï„·³¦\Æ³gÙ
X×ƒðv|ˆuøÙåµd`ænBóR¿_fïåãšÅ/¬J#?ö"H/d+qÛë°QX¸È60µhld\bÌ3Íý¹Ãï'ÐM£ü7O$zÜs)KÎƒ¢DQ ˆ°þ¸fý)¢?¤Þe™ ù-×Ê‘„ßñÚ»ã{Qû€-ßæcîÁˆ;^ôAÌß”QàñaC¼%T¨ç3|0Î¦§æ§çØÂÿÁ¿Ýð£Ÿ‘MªÉCX&®É8[APK£yñŒKSý+Õ÷{°)MŽÞ'Ù6¿SDHÇ{\âa³³ßƒÌ§qXˆª5tú·Ý¿íG¿\ çmìû²i€rVÃgè Ò¡u~Ä ªÛáÒÛXnr	{X9”Ó[Ü0{’m´}&Û~Âú1û  »ÐDä³ j9±PzçvB/j²F5ú¼³Ix½mÎo>€øqþ²rãÃ{æ‰'(;ÌÃÎµÎhÔºFaçüvÙr³ß («Ðg	©Þ¢ùË•‚øZ‹üJÙ€Ò4¸|R—VÊlÇÁß^ƒ¼!¿1ãÇQÀç†FÚ[qJœãó5‹8fÈRLvÇûÀ'´"NØÈ‹“~‚³17Õkylw5õ‘ß¢˜|Ù“€õÙ€ÍLÍœÏSãü°ÝFÐã-¼ID©Z§åãK«Ìv#NMN‘Ïï)—Ò°÷¢°ùÇ˜#@ÈÍ  ”jÈQï
hJÉŽ	Î¸š\R•óŠ$4‰øÝ²45’¾PÌY¼%¼ëp‰‘íø AfÅÅ¨Rö'šéwƒ¿ãb~ mñ5áìø¼IŸý¨Ïßjv*ÙC‚½Ê×…mú->Œ˜O¶¨Hi¹IRTÉå6"žÕ‰8‚=ëÅü˜`?òøæ`£¢ðK¿ÍàrJËäWùš}÷ñß(heÎøR2Ó2´uÓç"pg‘õGaØÕÖâ}˜ªègišŸ0íšå,ìs5¥|à¨µ+Û`Î¥¸<Å‰­…Q¾#ífŸ3$\¥µh’­t¸ÆÞ	ùdñ_ ­<É¾@ÝŸŽdœõ»%8¬²n©õ¹nÈIw×ëüÅ¹Nã&§<lHýæ²=©¼6ÀäsE.–t·ÇWhqØ0gœ|Ó0¿ö[{ØC+òA$í&'vÑE†Œê*ãï…œ¨S&
Ô¨QO%Ê;§QÞ[>máXòü°‹èž	¸]A8_KOÇÝ\Âß@ssRÎ‰»”?‘&W ÑýÄ÷?h¤ˆ‹í°ßdW¹0ÞïeSÛ½¨±Çg¦™'Á)	.õ#Ž¥Öv¨5 ëé¾b‘ÆD; ›eòÅí~® WÐ
GøÖöÂö-¶¹¼q}s{G¼À¸v¡y òÛò\P¼ú&	8p|0b ?w²¯Nð~“/>0BÉFEbI<Îv}?ÎÀüŒ3_Þÿ	:³ÝŸˆ÷|èD Â õ5¢ƒž5 }0¤€8C;Cœ„—‘ä@ðl!lÁÎãdümwÓç5cö.l>œÐçfr¤˜¡Ä›?ÈZ	,ˆ°/,‡DvM(Wòóå;òÓ!îªÅ~ˆ–Î)Š–¼T/-EuÎ AeRy(‡:½Û¦iíàó‡|ª¿ƒZÃÄ =¹uãêÄâõµëëËëÛól{yañåMö“ë›?ÞÚXX\>Rû¤¡DÈÄ¡·äÅ{$5^p.D&8µ¸3ßÓ‚¶/¨µMMÏóÚ~Ä¯ÛÍXžîˆâ]iU6[K¥ÖVÂ’CÍÿ?1=•Ma¶$L‹4iíFS~´©Áb‰O-Æœ=cÌu‚2ŸyBùêdóp.dÑ_-¹ÀjL:É^BðúE.é·sFC>ðùB>°°d¥`•0R€„3âhÌYÌÏFQPBºøõ‚øgñ½ÏkœÂám*·ªŒzé­¯CiÖ·4/ÝŽ3ü©X–Úš¯ap	ä¼èE08Îà1}”lR{H´üL%üd$Ï3ü?#LùÙ°ç7ûmÎªQ×>c´*™=+æòY& ÎE.*Ç|Ž‰Þª·™¹<@¾qý‘„i•BýèÑ7Òw”f}gáßÈUÂô®8%oÃ™Ö“7ùQÉF·H3MIá (&r¹eþW’E§;JŽÁÜÉwi‘sÊnÓËeóŸçÝžÏoÖìpó¶ÿ×}w|…ñ–Ÿm<“IÃ_À[4#’õù7~‰d± «–n		ôXöÈô…)¶ÑïíãÝ$¥;øðDpÒ—dqÁ¹{‚-†{!?¤·ú|öoq}“paÐW;ÿ8âö  ‹øto”ì«÷™´ÛªTÛÇªôüc<hˆ<È\ñ¡ (èñ³|é@~›L”GÝ1
„Yß13çÈ”*:­¿mT«é”ixÐ²üR1-ºîƒ’àÍb¾ó
½aúŸH†DæwØ‹3™r¤ñ"Ó¾¥s|ow4À½É6Ðô³Uo‡3©œ³æh»SÎŠ¹ÖÔ ‡®ä€»Ó´UKEÄv«„pA–?h`~ê<[6Ð…$sùÈÌXê)ã2Ê—›h¥)ªç™“cÌeå}T’$?°$·:Ýî’©dVBô¸SdV€CÐÙ)ÀŠ£¬ë3(ØF9ð‘:@’Á(PELÎdå·Túè™Üy"„ŒÉóñ”—<°+jÔ±Iæ¨ƒ3yïz›ÈÊf.øAHEhk™œ4šSÃ™èŒÂsàMX¤g0g¤š[ùk~«ªrYKâŸ‘u—f§Lu—X/*cÝñÔš¬ò–c‘nì–Ê%“QØnÛêYNoç.D00oeBÌ!EÓYæ™‹\(jý&£W¥=:kÉ“š`¾)™ÍÉÌ^ ¡2Š†;`YP`Y°…:^%t¥p®@ûÎZ<ÖÂÖ¸—\•aJÂ¨x#cpQ:ä;ïËH´t×Êê9 g„‹ ³ïšá”ùXzh´†³ÿ³ƒ*/:ÖËˆ¥­ylË,5ä$'S‡ï§Ì´úw´·ú!3I˜9o.o-¯o 6©5OãW–§®ÒÃ-KàÉdœyÜÀt§(nÏë6Û>Ay¥—!äñ m™Ïë!lúZ×ôM¡ÊÓ@NžÑã¬r¬ÛpjãRˆSú#’‘)rå®ÈåÜGØ/s“EÂ#í'«ôÀ.®`~iR()*¦E*!ŽƒàÈÃk/™¬Xä¹Š"ˆxÃðL„â2å¨¨%³¶›IÄ5P“N@¨uÒJ¿™j¸9'+ð6wŒOßÏØö¡I:W.TªY¸©èîp'Õº¬îº³u—5fÅFW–Æh¥„¿ueéŒ=ÞZíQË–6ü*"Ý1x0'…swÅXÂÑà¾&UuÄ(Ìþgª9C€»Q’èqÙÀßã³ìG—Ï`ið®OOÃYO,^?`Ä-=ŒWEÁ;#ß­ùè6Ÿì«CÖV^”©Ë+/‹!?K}ISòX%ª¥6‡D³2 ¥Å¾ÄDX‚oTB²é¿Âg]öŠ¦=ÙŒ3¯0×µ2š;Ï›³&ÄZ=½Ã ¾8k^Â÷ëûþF–øM'”˜ûðw$LcÿZKµFp5àfËò¦÷pk}iŸ]ù´£G[.¦QßyÛyÏ1ržJv1	ª«EŠd¢QáO}ôühO(îû‘ˆ{ô¼×w/ o	H£
îBìÑ˜Á,fdc–s™Nån¿³cÚ– {ùŒf£ãÝ¾|fÚÀQàˆø©È®êsCl¨/ÌœÝSÆ¾ÄÜ²8XË×LÛÅhfq¥¹ô[[±šÆÌnÍb5ÕuÛìøªh,uô‘|FAÁÅXÖn“	E©´ ™íùÌ“—%óqìÃS[X\¼~c}{a}›m,¬/¯©y=Jm¡ÑàK™xÝdhji“lbÕtìÒ;žúñ4Píe
T3­Ë ±jÚÚ_º^37(€­P`ä4hÍzð)õÈÂÒ	G*ýCMLå<ïïI$ÀAdu× |z1l·)ktmb{bÉªU'Î cëÖB¾yô_w `z2	¯­ú®Ñ¥©êH!þ@Ûz.lv+øú`qëÇÊAJÙ bz$Uf‰Dø\Åè±gö&[äìvÈAÇGÇOïÓ@¡²Ýš³ÂÝU"Ù¯´ÏÈ$OuçHñäš×è·!Áƒ<F¾7¼ y,ÁtÙý‹þ »½™'Ì‚Ê•§ÿdè˜ø‚iÕå Ë63¹YŠ¤¢Y:7Ë (ŸÅ‰·»dé{\œ>z|,wëaã,qèE[AËäK>Ý=úîùBU Ñ¬žjqtÏ˜,h#âêÖýDÊ1ÄJØUNÏÝ†Ô£b,í;§ë'¢³O9ì£pÄÉPÏÊç>0øá–4(ÎçO´	¿"í‰v¨Œë9¿Î×”Šoú±Ýò‡|”£]O‡UN Ùë¥©[õ›-þ*‡õÜ[œí{•Ý£s¯{Ô S¼îÑßÓÉŠßiN‰H H\Œoœ»¸_(£P†Ç3.šó“ý l‡ä¥D›§~Ñ—Û/ÊOÁ¼¢×èÁSŸè·Ø'*p/<¢²˜RágÛœþŽâü”¤Éÿ…¦†A˜¢©SÇ'zä¶ûh‡#À–‰%°/ ¦Š‡‰Qé-Õñ	B"7E^YÇðMK}.½Qõ õŸm§Î0:ÈÚ¹ÕàO£€‡i ª™:}¯z;ö®ŸjŠÇ—B{'aX†ËŒ!Û;9é«*&¡3¾ÖBÎ`~‰öŽÔÿDÖ½Ž^]Úü<¶yD…OtºÂYíá@†Á©¥Ni>ŒfäôŒ~™	Ü¬uËh€‡_Q‰ìlÍOöÂæ0Žî¶4J¥–Nn<8v~Öú+øgP"h†˜ØŸÆjœ@ë^Ëkž¹‚ÿ@C_PÅË:M ãàÊ¢‰h ï‹¨Óà&ß~ræ
ý>‘I`Ÿ9Ú9êÉö-g0Ù(˜á¹L-˜ìÅàaE,ãM¶Ç}¨þt+Eó[å(†Œ1*µ/¬Q
B2íÊ&©·^!“Ôµ íoszxÉ¬Re6§¯%ý|hðG’À!ŸH2F¨X®/|âõ­Q¹µP©‡·1õ0?Á	˜w1ÎT"–kÕ ¿I/öËVÐ* ã¸S’Áý0’CŒ:ãµ0§&{™X$"±ÙÊÒ¥³É^åÇ„¥©Ö3 I×z ª×x@ä¡8s…DMóÓüÛ¨Èö+q)Ù	›«;'.<M š ~P¬ ‹îZŠ;:K¢ôÕä¶1}•†Qkr{2hfì£ù\Ô³sVÄõ$“Í#N•³iA_—©[>?2µ6Í	kižÁ³©¡°vÆ{~);–ƒ#­Z0ô‚-^ÛÒ7ÃwJ,æ%¶»Ö˜vwÇoý-K“ªyÐ&n’B”ùyÃBa´5mÚ?¦Â7ü>Ø=ya
iM—Uæãðã·nl,o
èñÅëëÛ›×Wù¿‹?ÞXÙ>ROz¨"¢é áÐB±I&"ÞÑŠ1ü~¨ø2*æ–d€ÅÍpBî)*qÐpÄs¯u8¢@Ò}'ä›ïßk'{ÕãfƒyŒ"€\%¼^ˆa‚\¿›þäÏ ²‹é»þãÁB¦!$aú£ëÌ	s“¸'ø!þ­Z Tó-ÂB¯_e"@3¦Ü[[-¿Ém0
4é›|ËL$AGžmƒáð¨xp§„w…3.…Moz_£.§‰öŒd³,íface@â‘å}‹ÛWÙÖA·Áþç—ÿÁ¶Ö¶ØF%^û¥£¾­=,.wJ~YòSÀñýf#ÍÑ(°×zí"Þñ ÎãÉ¶ßm%{‡L ŸF¢›B<£øÞÈßeC"Ýn—£’p:ü´Œ-vÃZ„l¢êáGªÂ»¾—p‘‹jˆ~g:Q,–ó'dÙÝòU}Ùâ‚è¯¾yø”ÉpwU÷š·_i!ÐŸ©=2r£ÈWð…üŠðéþ‰Ú|\hó©@"Åk^×kùèP"?HÌ'¨#ƒÍæ{eO´6=¯‚"EZLOªlÝŠ|qÅr:qcÐ•ãÍU§˜2Ù.õLü_S¨Ml-µ+&#}ÅŸ~Eü«,õÉKðkHô~ÿT×ÿŠBiºh˜_÷÷Õrlj'Zþ^¥÷§ƒ|÷²”‘…v›ëæ}”J“íP#©©cEÅüˆ€Jq|Q9á†a,ÞgC¨3âÓ]#æ8:"¯|.L@ff|:(Y—Å§sÒ	}­íñÓ9‰›n d:sS6`:­;0]–Î`»·½‰åõ…««ËK!·´²E¢&9“‹Yc53ó’Å¿'Ü¨¦{lî”É™Ìc—=‘>¡Ho~¬œ“:[ÉL»ô^sçä¸ÊªŸðõŽ°8_w¶ÃÙ
d/ÂJU!OÂñrêKLÂ‹f*™Á¼n|%ûrÇÊZfçQÉ¦²<Ý0QåãS®b)5ñ¥ä*OUÍ‰ßbˆÜo)Ïï·’ñP òg:?¹Ž."P!×Q¶£ ÕùŠSÌŒ‡'²‚™·%¬XAùò~€÷UHéÄ4/š¨¼n¬$}±ãa#BñZº*5q(UÛ½f)û¨W9¾”¾(™lIôN]4¥EáÍºbðæf¼cðJQ³É&P/TÏ´æ—ä{gçÐŒs®`Æ™Ë•ŸÑëêJÝëžUy7—”¼/«N¢\ó>üY,30Þö»‚Pjè’”¤‘ÖÐœ]B¦Ö/ÊÃ7û]*€J£Áº“¯#Ä¯Ñ~}’F%±Üd'Þ†ÀL@Ü]¯Ùò-8ŒVÃÖ­8* èbaèç²‘Û™X¨÷¦§sçªV± èBÅ‚™<zÝõÄúXî0¤Øã	L¶Ì˜R«6F†qúgPÏÙ!–8À{2áamÁ‹' Ô)TëÌÓˆ˜"’iÎ*ø£‰ŒT‡Øu“ˆe4£Kb9ŒûÍVò±e¹¶ŠçK5¬tãŸöx =Ö†O_ÐÝjD ƒÊråMóCKÓ“ûZéø0gÖiÎãç(Ü§Scwj÷âî…›¢ ì-?gÂ¾ÆY"¬r6Û÷Z¾¼¹Ô…Ãdbœ.ÃÅ2Î I ²Âš©sSŠáœ½0gËOèE6"uöv\¨àšeH.ØzUs^vÎ“œXçé
AxÙ»‹#¼ì¡V c’çÒ#_;ßÓ‰0<Çå¦l¨$É
ô²µ¬Ø–Ù²t/u‰IcÈìC|©÷_†©÷_â©_î¶ÚA¼çœr£°àwB¨×|Ý“!û‰¿ãyÏfv±ò`qVè³	v+ˆƒÚù*øÌÅe×¶ßš\+“,þÝŸxïÜÌ÷n‚ó>N}ï&³MfœjŠmå5sÉ­Ò‹:ËìuŠ1ÜIø˜'´*XƒBàšàk5ù8¬Ìk¸×Ì9†G |ØŸ¸xžíÁÿòa»ÄÒ8Gð6‚Ú&|b:r®Ik·;!_šöŒ¯Cê:7QÛazˆ»$9o¤ kó†] ªíð°ãC¬¦þ÷hn7'ÐÁe'Úï#Uÿñ±ªl%8ÖØ ¡ü+i½GÐ|¿57ð?jxÊ›tnr‚‡Ñ€÷âŒ½Øjiâ¢¾ŸChŽ¡Ð¾Á¢\<a†RÍÇ¯’\ž	Y
“í€D{öú#÷ú¸×µctº–7½Xí<{‹6çh`J³¤ïg¦Šª_Qñ…}Üh‹^Ï*¯c‹EIÝÍf2ÞKÓ#AIõboLe3I¹Ø•†è/ª=ó–ñU²¼ºx}m™m_7™™zeJ†!ÐWäRêÃsN‡V,_
®³lßXZ^ßÞb‹›ËlíúÒò*ÛZ|çúõÕ‚Û«¦˜æ¸È"'+>"öWý¿ÇY¶FEîKX¬
IÐöXGh Ù½ÚÊ~±jÜ¥½é¢é´­f´U~äàçØ˜T2ân¿•Î{’&ÐŠà1G!á«ç¼ÎAüg`%Å¿Vš·oNît9GrÝàwîÿi7#À}\jÚ`X¾“öE:ÙO¹FÖ´eì †d°ü‘’Ö¼]V-lU1— ÖìÓ¹;ÁuN[=°ÜœàÔòÎAúÚŸ¸ ØZ÷)Ë™6êlåŠ]‹R>¤"É_Åã™]C`¨‹‘Ïõß¼óÁFð³2£EOÀKrÜ—k@	çÌFÈÓ¿Õ²žå{?t#ñÿ¿ÿDH"UUš-z‘ÏÖÂ¦ßf½’›ª<»(5õ…6¾9s?Ë 
ƒD“Þï³ÞOeËƒÐ‹ß<úG¸ˆ"ˆrÍ<¨}ùè£y%;ÉÐKò•JôTb“|1®ŒŠ”JxÀOŠe»ïŽkx›'r_÷â’×…R¾©‰¯jÝø”åã•F§¦/LŸ»8=;uîâ˜k)*Û…™Pìo¬8¥{”Í§ËE•Ä	™3aþ¯;òL²xVHP•»æ­%Œú(ÇR¬¥ÑŠŸ££#È±/¡$[S–=NéµhêwJ°F=°^OÍ½Ý&¦ò¢+ïdê\óÜÔÍJS©ôjªlô/+æBml¸>­Ô€ÛÎ'YP›½*’`5ÆÎŒ	¡6gÚ;Ä°K]g©-ZÑaQoØ›)!³šLwÎ•g’«ŠufžéÑ6©²  tMU“g*è!?›§\ù´+Ú çHœÇ:`Ö}– O¼’¾ýûÄ_§¢ÓðOÿÐä)(¢{–ž»i¸À}Ý§ö¥,†ù$©ñÍçÎ˜†Ï§ûWsÂ~Äü@]€1¢ÇgtÐ78Ïó(WïhÊ<ÔIÃâ˜Õ—Ån†m_ð0°5ö‚^ÅÀ<þö#ÎÈƒÕKðGwÞ+."—c¹Ð
•Ý‘q†CP³ÿf‡ã¶ßkìù‘öÈ¶øÆñˆ‹Ðz»Ï',ðœ]¥Õ(ô¦_²ütß$½"â“©ù*ô‹¼A¼ÅÙÌe1á~gèžœš?(<—ówdVÅZøXÙÐ& ,¡ÎˆnÍ¹ð9©À¬§00Yoi¯3*ÚdÄ÷Œ_I=ù_]NPò×½b”Ü{h~•œíüÚÎ¥êa/š}”‚ÎŒÛò[jF÷gvçv§o²Ü&4 õØšr'¦fm·öBÁ*JýÉÚ¯rÜ8çv‡”vºJds_&ýÒmÅ7.!n+s1qs‰fôæz5+¬&q˜‹ó×òÅ~ñ#¤1>`„2žsœØwü(
£B¢¾êÊ˜°//Gâþœ™¬+çïË+“Ÿ132Š)kô”áKº!5†7ÔLÅ——‰&.a„“)5ýç´N!¹K
¶Æ˜#×ÂQO¾˜©/¯4c_Ým“àê"þIncŠ·x«^­@Æ$5¼Ü± G÷EUþ‡ÏÂøUÇð;§Â»”Úâ$Ï¡ñePûR¶J_G0«Óúé%hY‘5]ºjðÀ¼²¨X¶i’3x›Ë¸‰ä„Ÿ$ˆå‹%iyÐ× éÜ{9´›mô/vÀx/Ü—c uwæR
7ûÂ%vˆ¼Ë*Röˆ’l*ìã.iÃ.‰À[ü-Ú+¹Ýò?¿üŠÿ™³î%Ãn‚ëh²w1ècK£ºÑ7t,§å(º¼%®gä&Ÿ²8g8š³!æy!ÎØ2ÐR«l—Û>—–üë»»»ßVpƒå×zÂ¡ÙèT‰ñ•çAõ£¶kâ“¶€Ïœ2¡›3Kaæb–W\kžœJn \ÒNxÛLÂœáw¿É•H¿ãÆõšSÍÄö6ÕS)ãMZH>Côq4vÛæÁ·laÖÀUGxÉÇ:2Æ²ÜÎšcVV%0œBàTá¦F_tëé\<…i¤ ]	3¿8è\é8¸rBXXÙ}7‹±æðÿ8‰Âü‰÷foÚ¶¡e»¹0€Û„Ï‡P¿S€£ÿœÁ¥¥÷bKÅ-“MtQ_VyXpqÓ•Ì#˜–5Zj¶„K pÙË‚XdG|ˆ?<’7	TÖ{Ò±öG&ò(áÞO¤‰ó/ÊùQÁ«†¹O÷Ó’²I².1`?ýDÀÁâçJÆM¸ u¼íƒ(Ø l¬FÂb‚@s`šuqœK¡SäåKÙjÒ¼ë&¡2E8+©½	ô%pˆs5sœ;KÆ•ô]Ké	×ÊÿVˆV€r^ÿ•|¨?¤,aÔ
5E?4¦¤™ÏNË!i‘p\Ù¶ô7HöîìLi‚—&uaSÈ†ü[jÊˆšm0Ùu’‰såÉ8Ãð˜s[»`ŸÚò“~e«A÷ƒØå·5\0ÌÃÂY’1m¦œ,°èàe±jr¯×> |í ß½Í·cpèØPsu5ÜWÁ,~7ÕþÛ—©Žü‰[Åò2¡¼7vÙèè~Ðå´&ÍÛ“œITÜ¶·3f5’»žQÓ>b5Óó“q#
Ûíípô¤ …pÇßónaÞŽN&{#ìÐfg~›³^Û kVÌZ¬ç	žŸÉ²Ñ>N3:üKm;}&Î˜UÒgD¾¹K… ‰çýYäSé[{DÒ€j™¡ãàaÙ²AhõøbÜò‚6&öüÐÙóYzKL.1Ëac9nXÁ5„ßU9„ìNŽ!RP¢´Ò’AtÈã¶Ü• î~Që¸)uMVL Â8<:˜ðÚÂ4a¶¹¼¾´¼y¤FQ¼Äï¸ÒË&/rœFéM¾#žl‹Ç”wP8KÍ ßô?i*qikÒ)Ê~ñVüµ%¤ÆîDØDõÎ¤Û6×Ú%á¼M±”B)ŒèP¦Á\¾#>rþ1M}ÝCÃÿ:äúIÙÔ¥nÛüRîG‘qØ:ÓÓ2¸ï¹,µ’ìSˆÉ%~H™¨Ý)'0ƒž1:…7jÇÎ%¿æ³QAŽÛ"¢íöÄ…Ü¸ù·*».oD)AôLÙjy²³ï›3ªê˜sQêúšâø/íÍÖOËUW¾ð2‚Æôs§å'°/ õÌFGª/øR÷fKCZk€…hd¸¡h2±uäß®Bh=ÚÌºMÐí,3F·öƒ˜ëíöÿ  ÿÿ Ë¡áxœÔTÁnÓ@½ç+FÕI¥%NH@*MPª‚Z$U¥®½[Ûêf×Ú]7Ž¬\8 ñ¹ùÄ‰à[ü)¬í4]»ADâ¾ØžÙyóÞÌÀþ`ÕÍsH¢[ðVêÏé´ëH1¬)š¸à	I¨\¿Öæ‘ëBŒÜ'"á„”2¸f4…HÓ¹B>åÚÄ¨±@OSs‰†Ý™•Ò$õ­oØ Å"ÿfšõú0¢úó çxÜé¯Z¾÷ˆ³«8E#ƒ'^¢!hšjt1tãô®×ÈŒl ² ´Ä\E:aÆÀO¤Å"ª`?ÎZy ˜Á ÓéJðàà¥9	ÐÅ#w4y6_Ö¡¡Ãbakä8•s ñÒðíB(n©<¨k¸»Ïi®®š\ÌZçEþ½Èù§"ÿa>š¼jâÿFú¨Aÿ5ÞœþQ€ÃÁYÇ²dƒ}8£s“žÀ1öo@øH=UQÇCkˆ·(¸Ñ/Äœ0z"‘è&XkìNp€c4£æ¸Ôr†U)Tµ*JªŸçšîŽ‡ÆRIm|$®ô®ÜÍ"°Fs³ÔåÅ÷íà&¤juD×‚ßêaSß»DÛ%…ù»0h¹ªóYÖœkÓ6Õ¼|-òÏEþ¥È¿9eCÔ¬9«ÃAÔP­­äZÇm¢–‚¾RcÇ‚,-õÚë7bQR]u¬µ53&‚€’·üL0ZÃV:!F*öö@RÃ¬<¯-¯±
=%éYƒºåLæ·ÂÊÿ]ƒ5Å~H¥þ¡¶ìœÝ÷M?hÜ¨àhcÜõ•ÄT¶+9/¿+ÇÒióÙÑYu~  ÿÿ M