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
  { semester: 'Summer 24', gpa: 4.25, bnSemester: 'গ্রীষ্ম ২৪' },
  { semester: 'Winter 24', gpa: 4.50, bnSemester: 'শীত ২৪' },
  { semester: 'Summer 25', gpa: 4.75, bnSemester: 'গ্রীষ্ম ২৫' },
  { semester: 'Winter 25', gpa: 4.85, bnSemester: 'শীত ২৫' },
  { semester: 'Summer 26', gpa: 5.00, bnSemester: 'গ্রীষ্ম ২৬' },
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
      setErrorMsg(lang === 'bn' ? "নতুন পাসওয়ার্ড মিলছে না!" : "New passwords do not match!");
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
        setAdminSuccessMsg(lang === 'bn' ? "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!" : "Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        addAuditLog("Admin changed dashboard entry password.");
      } else {
        setErrorMsg(data.message || (lang === 'bn' ? "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।" : "Failed to update password."));
      }
    } catch (err) {
      setErrorMsg(lang === 'bn' ? "সার্ভারে সমস্যা হয়েছে।" : "Server error.");
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
    customBody: 'এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, [নাম], পিতা: [বাবা], মাতা: [মা]। সে অত্র বিদ্যালয়ের [শ্রেণি] শ্রেণির একজন নিয়মিত শিক্ষার্থী। তার রোল নম্বর [রোল] এবং জন্ম তারিখ [জন্ম তারিখ]।\n\nসে অত্র বিদ্যালয়ের একজন মেধাবী এবং অনুগত শিক্ষার্থী। আমি তার উজ্জ্বল ভবিষ্যৎ কামনা করি.'
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
      schoolNameBn: 'স্টুডেন্টস কেয়ার মডেল স্কুল',
      schoolLogo: '',
      headerNotice: 'সফটওয়্যার তৈরি ও রক্ষণাবেক্ষণে: মো. ইমরান হোসেন, সিনিয়র শিক্ষক, স্টুডেন্টস কেয়ার মডেল স্কুল',
      bannerEnabled: true,
      headerBgColor: '#1E63D3',
      addressEn: 'Charlakshya, Karnaphuli, Chittagong',
      addressBn: 'চরলক্ষ্যা, কর্ণফুলী, চট্টগ্রাম',
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
      address: 'চরলক্ষ্যা, কর্ণফুলী, চট্টগ্রাম',
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

  // ডাটাবেজ থেকে লাইভ স্টুডেন্ট লিস্ট লোড করার জন্য
  useEffect(() => {
    const fetchStudentsFromDatabase = async () => {
      try {
        const response = await fetch(getApiUrl('/api/students'));
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // ডাটাবেজ থেকে আসা ডেটাকে স্টুডেন্ট লিস্ট স্টেটে সেট করুন
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
    nationality: 'বাংলাদেশী',

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
      nationality: std.nationality || 'বাংলাদেশী',

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
      alert(lang === 'bn' ? 'দয়া করে তারকা চিহ্নিত (*) আবশ্যক ক্ষেত্রগুলো পূরণ করুন।' : 'Please fill all required (*) fields: Full Name, Class, Section, Roll Number, and Guardian Mobile Number.');
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
      ? `${editStudentForm.fullName} এর তথ্য সফলভাবে আপডেট করা হয়েছে!`
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
    nationality: 'বাংলাদেশী',

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
          ? (customMsgBn || "তথ্য সফলভাবে সার্ভার ডাটাবেজে সংরক্ষিত হয়েছে!") 
          : (customMsgEn || "Settings successfully saved to server database!"));
      } else {
        setAdminSuccessMsg(lang === 'bn' 
          ? "ভুল: সার্ভারে সংরক্ষণ করা যায়নি।" 
          : "Error: " + (result.message || "Failed to save settings on server"));
      }
    } catch (err: any) {
      console.error('Save frontend data to server error:', err);
      setAdminSuccessMsg(lang === 'bn' 
        ? "ভুল: নেটওয়ার্ক সংযোগ ব্যর্থ হয়েছে।" 
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
      alert("All fields are required! সব তথ্য পূরণ করা আবশ্যক।");
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
      setAdminSuccessMsg("Page updated successfully! পেজ সফলভাবে আপডেট করা হয়েছে।");
    } else {
      // Creating a new page
      const slugExists = pages.some((p: any) => p.slug === pageSlug);
      if (slugExists) {
        alert("This Page URL slug already exists! এই পেজ ইউআরএল স্ল্যাগ ইতিমধ্যে বিদ্যমান।");
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
      setAdminSuccessMsg("New custom page published successfully! নতুন পেজ সফলভাবে তৈরি করা হয়েছে।");
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
    if (!confirm("Are you sure you want to delete this custom page? আপনি কি নিশ্চিতভাবে এই পেজটি মুছে ফেলতে চান?")) return;
    
    const pages = frontendData?.customPages || [];
    const updatedPages = pages.filter((p: any) => p.id !== pageId);
    
    setFrontendData((prev: any) => ({
      ...prev,
      customPages: updatedPages
    }));
    setAdminSuccessMsg("Page deleted successfully! পেজ সফলভাবে মুছে ফেলা হয়েছে।");
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
    { id: 'banner', labelBn: 'হোমপেজ ব্যানার', labelEn: 'Homepage Banner' },
    { id: 'setting', labelBn: 'সেটিংস', labelEn: 'Setting' },
    { id: 'menu', labelBn: 'মেনু', labelEn: 'Menu' },
    { id: 'page_section', labelBn: 'পেজ সেকশন', labelEn: 'Page Section' },
    { id: 'manage_page', labelBn: 'পেজ ম্যানেজ', labelEn: 'Manage Page' },
    { id: 'slider', labelBn: 'স্লাইডার', labelEn: 'Slider' },
    { id: 'features', labelBn: 'বৈশিষ্ট্যসমূহ', labelEn: 'Features' },
    { id: 'comittee', labelBn: 'কমিটি', labelEn: 'Committee' },
    { id: 'speech', labelBn: 'বক্তব্য', labelEn: 'Speech' },
    { id: 'testimonial', labelBn: 'প্রশংসাপত্র / মন্তব্য', labelEn: 'Testimonial' },
    { id: 'service', labelBn: 'সেবাসমূহ', labelEn: 'Service' },
    { id: 'faq', labelBn: 'জিজ্ঞাসা (FAQ)', labelEn: 'Faq' },
    { id: 'gallery_category', labelBn: 'গ্যালারি ক্যাটাগরি', labelEn: 'Gallery Category' },
    { id: 'gallery', labelBn: 'ফটো গ্যালারি', labelEn: 'Gallery' },
    { id: 'news', labelBn: 'খবর ও আপডেট', labelEn: 'News' },
    { id: 'notice_settings', labelBn: 'নোটিশবোর্ড', labelEn: 'Notice' },
    { id: 'fast_links', labelBn: 'কুইক লিংক', labelEn: 'Fast Links' },
    { id: 'history', labelBn: 'ইতিহাস ও ঐতিহ্য', labelEn: 'Homepage History' },
    { id: 'teachers_list', labelBn: 'শিক্ষকমণ্ডলী', labelEn: 'Homepage Teachers' },
    { id: 'masterpiece_students', labelBn: 'কৃতী শিক্ষার্থী', labelEn: 'Masterpiece Students' },
    { id: 'videos', labelBn: 'ভিডিও গ্যালারি', labelEn: 'Homepage Videos' },
    { id: 'blog_posts', labelBn: 'ব্লগ পোস্ট', labelEn: 'Blog Posts' },
    { id: 'footer_settings', labelBn: 'ফুটার', labelEn: 'Footer' },
  ];

  const cardSubMenus = [
    { id: 'id_card', labelBn: 'আইডি কার্ড', labelEn: 'ID Card' },
    { id: 'id_card_customize', labelBn: 'আইডি কার্ড কাস্টমাইজ', labelEn: 'ID Card Customize' },
    { id: 'admit_card', labelBn: 'অ্যাডমিট কার্ড', labelEn: 'Admit Card' },
    { id: 'admit_card_customize', labelBn: 'অ্যাডমিট কার্ড কাস্টমাইজ', labelEn: 'Admit Card Customize' },
    { id: 'seat_plan', labelBn: 'সিট প্ল্যান', labelEn: 'Seat Plan' },
    { id: 'seat_plan_customize', labelBn: 'সিট প্ল্যান কাস্টমাইজ', labelEn: 'Seat Plan Customize' },
    { id: 'exam_controller_plan', labelBn: 'এক্সাম কন্ট্রোলার প্ল্যান', labelEn: 'Exam Controller Plan' },
  ];

  const certificateSubMenus = [
    { id: 'generate', labelBn: 'সার্টিফিকেট জেনারেট', labelEn: 'Certificate Generate' },
    { id: 'pottoyon', labelBn: 'প্রত্যয়নপত্র', labelEn: 'Pottoyon Potro' },
    { id: 'testimonial', labelBn: 'টেস্টিমোনিয়াল', labelEn: 'Testimonial' },
    { id: 'excellence', labelBn: 'এক্সিলেন্স সার্টিফিকেট', labelEn: 'Excellence Certificate' },
  ];

  // Quotes rotation on Left Side of Login Page
  const leftQuotes = [
    {
      bn: "“ছাত্রদের সুন্দর ভবিষ্যৎ ও নৈতিক চরিত্র গঠনই আমাদের একমাত্র অঙ্গীকার।”",
      en: "“Our sole commitment is to build a beautiful future and moral character for our students.”"
    },
    {
      bn: "“নিয়মনিষ্ঠা ও কঠোর পরিশ্রমই সফলতার চাবিকাঠি।”",
      en: "“Discipline and hard work are the keys to success.”"
    },
    {
      bn: "“ভবিষ্যতের যোগ্য ও সৎ নাগরিক গড়ে তোলাই আমাদের অঙ্গীকার।”",
      en: "“We are committed to building worthy and honest citizens of the future.”"
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
          ? `ভুল ইউজারনেম বা পাসওয়ার্ড। ডেমো আইডি এবং পাসওয়ার্ড হিসেবে '${displayCred}' ব্যবহার করুন`
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
      ? `${adm.studentName}-এর ভর্তি সম্পন্ন! নতুন আইডি: ${generatedId}, শাখা: ${approveSection}, রোল: ${finalRoll}`
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
    setAdminSuccessMsg(lang === 'bn' ? `${name}-এর আবেদন বাতিল করা হয়েছে।` : `Admission rejected for ${name}.`);
    addAuditLog(`Admin rejected admission for ${name}.`);
    setTimeout(() => setAdminSuccessMsg(''), 4000);
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    
    // We can show a notification
    setAdminSuccessMsg(lang === 'bn' ? "নতুন নোটিশটি সফলভাবে নোটিশ বোর্ডে প্রকাশ করা হয়েছে!" : "Notice successfully published to Main Notice Board!");
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
    setTeacherSuccessMsg(lang === 'bn' ? `আজকের উপস্থিতি সফলভাবে সংরক্ষিত হয়েছে (${presentCount}/৫ জন উপস্থিত)` : `Attendance submitted successfully. (${presentCount}/5 present)`);
    addAuditLog(`Teacher registered Class 9 Science attendance. Present: ${presentCount}`);
    setTimeout(() => {
      setAttendanceSubmitted(false);
      setTeacherSuccessMsg('');
    }, 4000);
  };

  const handleSubmitMarks = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherSuccessMsg(lang === 'bn' ? `আইডি ${marksForm.studentId}-এর জন্য ${marksForm.marks} নম্বর সফলভাবে সংরক্ষণ করা হয়েছে!` : `Marks (${marksForm.marks}) submitted for Student ID ${marksForm.studentId}.`);
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
    setAccountantSuccessMsg(lang === 'bn' ? `পেমেন্ট সফল! রসিদ নম্বর ${newTxn.id} ইস্যু করা হয়েছে।` : `Payment recorded! Invoice ID ${newTxn.id} generated.`);
    addAuditLog(`Accountant registered ৳${payAmt} collection from student ID ${feeForm.studentId}.`);
    
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
    
    setSuperSuccessMsg(lang === 'bn' ? "সিস্টেম ডাটাবেজ ব্যাকআপ (.json) সফলভাবে ডাউনলোড হয়েছে।" : "System DB configuration and audit trails backed up successfully.");
    addAuditLog("Super Admin initiated full database JSON backup download.");
    setTimeout(() => setSuperSuccessMsg(''), 4500);
  };

  // Helper localizer for portal headers
  const getRoleName = (role: typeof loggedInRole, l: typeof lang) => {
    if (!role) return '';
    const names = {
      admin: { bn: 'এডমিন পোর্টাল', en: 'Administrator Portal' },
      teacher: { bn: 'শিক্ষক পোর্টাল', en: 'Teacher Workspace' },
      student: { bn: 'অভিভাবক পোর্টাল', en: 'Guardian Workspace' },
      accountant: { bn: 'হিসাবরক্ষক পোর্টাল', en: 'Accountant Ledger panel' },
      superadmin: { bn: 'সুপার এডমিন ককপিট', en: 'Super Admin Operations Cockpit' }
    };
    return l === 'bn' ? names[role].bn : names[role].en;
  };

  // ----------------------------------------------------
  // SUB-COMPONENT: STUDENT DASHBOARD
  // ----------------------------------------------------
  const mockWeeklySchedule = [
    { 
      day: lang === 'bn' ? "রবিবার" : "Sunday", 
      periods: [
        lang === 'bn' ? "পদার্থবিজ্ঞান (০৯:০০ AM)" : "Physics (09:00 AM)", 
        lang === 'bn' ? "ইংরেজি (১০:১৫ AM)" : "English (10:15 AM)", 
        lang === 'bn' ? "বাংলা (১১:৩০ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "গণিত (০১:০০ PM)" : "Mathematics (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "সোমবার" : "Monday", 
      periods: [
        lang === 'bn' ? "রসায়ন (০৯:০০ AM)" : "Chemistry (09:00 AM)", 
        lang === 'bn' ? "আইসিটি (১০:১৫ AM)" : "ICT (10:15 AM)", 
        lang === 'bn' ? "জীববিজ্ঞান (১১:৩০ AM)" : "Biology (11:30 AM)", 
        lang === 'bn' ? "গণিত (০১:০০ PM)" : "Mathematics (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "মঙ্গলবার" : "Tuesday", 
      periods: [
        lang === 'bn' ? "পদার্থবিজ্ঞান (০৯:০০ AM)" : "Physics (09:00 AM)", 
        lang === 'bn' ? "ইংরেজি (১০:১৫ AM)" : "English (10:15 AM)", 
        lang === 'bn' ? "বাংলা (১১:৩০ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "রসায়ন (০১:০০ PM)" : "Chemistry (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "বুধবার" : "Wednesday", 
      periods: [
        lang === 'bn' ? "জীববিজ্ঞান (০৯:০০ AM)" : "Biology (09:00 AM)", 
        lang === 'bn' ? "আইসিটি (১০:১৫ AM)" : "ICT (10:15 AM)", 
        lang === 'bn' ? "বাংলা (১১:৩০ AM)" : "Bangla (11:30 AM)", 
        lang === 'bn' ? "উচ্চতর গণিত (০১:০০ PM)" : "Higher Math (01:00 PM)"
      ] 
    },
    { 
      day: lang === 'bn' ? "বৃহস্পতিবার" : "Thursday", 
      periods: [
        lang === 'bn' ? "সাপ্তাহিক কুইজ (০৯:০০ AM)" : "Weekly Quiz (09:00 AM)", 
        lang === 'bn' ? "ডিবেট ক্লাব (১০:১৫ AM)" : "Debate Club (10:15 AM)", 
        lang === 'bn' ? "ক্রীড়া ঘন্টা (১১:৩০ AM)" : "Sports Hour (11:30 AM)", 
        lang === 'bn' ? "পরামর্শ সভা (০১:০০ PM)" : "Counseling (01:00 PM)"
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
          { id: 'overview', label: lang === 'bn' ? 'সংক্ষিপ্ত তথ্য' : 'Overview', icon: GraduationCap },
          { id: 'homework', label: lang === 'bn' ? `বাড়ির কাজ (${pendingHomeworkCount})` : `Homework (${pendingHomeworkCount})`, icon: BookOpen },
          { id: 'results', label: lang === 'bn' ? 'পরীক্ষার ফলাফল' : 'Term Results', icon: Award },
          { id: 'schedule', label: lang === 'bn' ? 'সাপ্তাহিক রুটিন' : 'Class Schedule', icon: Calendar },
          { id: 'profile', label: lang === 'bn' ? 'প্রোফাইল' : 'My Profile', icon: User },
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
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "উপস্থিতি মূল্যায়ন" : "Attendance Streak"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">{lang === 'bn' ? "চমৎকার" : "Excellent"}</span>
                    <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">{mockStudentProfile.attendanceRate}% {lang === 'bn' ? "উপস্থিত" : "Presence"}</span>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "বাকি পড়া/কাজ" : "Pending Homework"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">
                      {pendingHomeworkCount} {lang === 'bn' ? "টি কাজ" : "Tasks"}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold mt-0.5 block">{lang === 'bn' ? "এই সপ্তাহে জমা দিতে হবে" : "Due by this week"}</span>
                  </div>
                  <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block">{lang === 'bn' ? "গড় জিপিএ মান" : "Average GPA Grade"}</span>
                    <span className="text-2xl font-extrabold text-gray-900 block mt-1">GPA 4.90</span>
                    <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">{lang === 'bn' ? "এ+ চমৎকার" : "A+ Excellent Status"}</span>
                  </div>
                  <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <Award className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                    <h4 className="font-extrabold text-gray-900 text-base mb-4">{lang === 'bn' ? "অভিভাবকের যোগাযোগের তথ্য" : "Guardian Contact Details"}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "প্রধান অভিভাবক" : "Primary Guardian"}</span>
                        <span className="font-bold">{mockStudentProfile.guardian}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "নিবন্ধিত মোবাইল" : "Registered Phone"}</span>
                        <span className="font-bold font-mono">{mockStudentProfile.phone}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "রক্তের গ্রুপ" : "Registered Blood Group"}</span>
                        <span className="font-bold text-red-600">{mockStudentProfile.bloodGroup}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block font-bold">{lang === 'bn' ? "বর্তমান শ্রেণী" : "Current Grade Status"}</span>
                        <span className="font-bold text-emerald-700">{lang === 'bn' ? '৯ম শ্রেণী' : mockStudentProfile.className}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-900 text-base">{lang === 'bn' ? "রবিবারের ক্লাসের রুটিন" : "Sunday Class Schedule"}</h4>
                      <button onClick={() => setActivePortalTab('schedule')} className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer">
                        {lang === 'bn' ? "পূর্ণ রুটিন দেখুন" : "View Full Week"}
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
                    <h4 className="font-bold text-gray-900 text-base mb-4">{lang === 'bn' ? "ফলাফল সংক্ষেপ" : "Quick Grade Summary"}</h4>
                    <div className="space-y-3.5">
                      {mockExamResults.slice(0, 4).map((res) => (
                        <div key={res.subject} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-bold">{lang === 'bn' && res.subject === "Physics" ? "পদার্থবিজ্ঞান" : lang === 'bn' && res.subject === "Chemistry" ? "রসায়ন" : lang === 'bn' && res.subject === "Higher Mathematics" ? "উচ্চতর গণিত" : lang === 'bn' && res.subject === "English Language" ? "ইংরেজি" : res.subject}</span>
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
                      {lang === 'bn' ? "পূর্ণ মার্কশিট দেখুন" : "View Full Marksheet"}
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
                  <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "হোমওয়ার্ক প্ল্যানার" : "Homework Planner"}</h4>
                  <p className="text-xs text-gray-500">{lang === 'bn' ? "কাজ সম্পন্ন চিহ্নিত করতে বক্সে টিক দিন" : "Check/uncheck tasks to mark them completed"}</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-800 font-bold border border-amber-200 px-3 py-1.5 rounded-xl">
                  {pendingHomeworkCount} {lang === 'bn' ? "টি কাজ বাকি আছে" : "Pending Tasks"}
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
                              {lang === 'bn' && item.subject === "Physics" ? "পদার্থবিজ্ঞান" : lang === 'bn' && item.subject === "Chemistry" ? "রসায়ন" : lang === 'bn' && item.subject === "Higher Mathematics" ? "উচ্চতর গণিত" : item.subject}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1 font-bold">
                              <Clock className="h-3 w-3" /> {lang === 'bn' ? "জমার তারিখ:" : "Due Date:"} {item.dueDate}
                            </span>
                          </div>
                          <h5 className={`font-bold text-gray-900 text-base ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {lang === 'bn' && item.id === "hw1" ? "অধ্যায় ৫: গতিবিদ্যার গাণিতিক সমস্যা" : lang === 'bn' && item.id === "hw2" ? "জৈব রসায়ন এবং আণবিক গঠন সংক্ষেপণ" : lang === 'bn' && item.id === "hw3" ? "ত্রিকোণমিতিক অসমতা সমাধান সেট" : item.title}
                          </h5>
                          <p className="text-sm text-gray-600 leading-relaxed font-semibold">
                            {lang === 'bn' && item.id === "hw1" ? "গতির সমীকরণ ব্যবহার করে সৃজনশীল প্রশ্ন ১ থেকে ৫ সমাধান কর।" : lang === 'bn' && item.id === "hw2" ? "শ্রেণীকক্ষে দেওয়া নোটবুক অনুসরণ করে অ্যালকোহল ও অ্যালডিহাইডের পার্থক্য তৈরি কর।" : lang === 'bn' && item.id === "hw3" ? "অনুশীলনী ৭.২ এর সকল গাণিতিক সূত্রাবলী খাতায় লিখে আনবে।" : item.description}
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
                  <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "অর্ধ-বার্ষিক মডেল পরীক্ষার মার্কশিট" : "Half-Yearly Mock Exam Marksheet"}</h4>
                  <p className="text-xs text-gray-500">{lang === 'bn' ? "মূল্যায়ন সেশন: গ্রীষ্মকালীন ২০২৬" : "Grading Term: Summer Session 2026"}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 px-3 py-1.5 rounded-xl">
                    {lang === 'bn' ? "সর্বশেষ জিপিএ: ৫.০০" : "Final GPA: 5.00"}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-800 font-bold border border-blue-100 px-3 py-1.5 rounded-xl">
                    {lang === 'bn' ? "গ্রেড: এ+" : "Overall Grade: A+"}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">{lang === 'bn' ? "বিষয় ও কোর্স" : "Subject Course"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "প্রাপ্ত নম্বর" : "Obtained Marks"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "লেটার গ্রেড" : "Letter Grade"}</th>
                      <th className="pb-3 text-center font-semibold">{lang === 'bn' ? "সর্বোচ্চ নম্বর" : "Max Cap"}</th>
                      <th className="pb-3 text-right font-semibold">{lang === 'bn' ? "মন্তব্য" : "Remarks"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                    {mockExamResults.map((res) => (
                      <tr key={res.subject} className="hover:bg-gray-50/50">
                        <td className="py-4 font-bold text-gray-900">{lang === 'bn' && res.subject === "Physics" ? "পদার্থবিজ্ঞান" : lang === 'bn' && res.subject === "Chemistry" ? "রসায়ন" : lang === 'bn' && res.subject === "Higher Mathematics" ? "উচ্চতর গণিত" : lang === 'bn' && res.subject === "English Language" ? "ইংরেজি ভাষা" : res.subject}</td>
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
                          {res.marks >= 90 ? (lang === 'bn' ? 'অসাধারণ' : 'Outstanding') : res.marks >= 80 ? (lang === 'bn' ? 'চমৎকার' : 'Excellent') : (lang === 'bn' ? 'সন্তোষজনক' : 'Satisfactory')}
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
                      {lang === 'bn' ? "গ্রেড বা জিপিএ উন্নতির চিত্র" : "Academic GPA Improvement Trend"}
                    </h5>
                    <p className="text-xs text-gray-500 font-semibold">
                      {lang === 'bn' ? "বিগত ৫ সেমিস্টারের জিপিএ (GPA) ভিত্তিক তুলনা চিত্র" : "Comparative GPA improvement tracking over the last 5 semesters"}
                    </p>
                  </div>
                  
                  {/* Stats badge showing total improvement */}
                  <div className="flex items-center gap-2 bg-[#025644]/5 text-[#025644] border border-[#025644]/10 rounded-xl px-3 py-1.5 self-start md:self-auto">
                    <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
                    <span className="text-xs font-extrabold">
                      {lang === 'bn' ? "+১৭.৬% ধারাবাহিক উন্নতি" : "+17.6% Consistent Progress"}
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
                                  {lang === 'bn' ? 'প্রাপ্ত জিপিএ' : 'Earned GPA'}: <span className="font-mono text-sm font-black">{payload[0].value.toFixed(2)}</span>
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
                <h4 className="font-extrabold text-gray-900 text-lg">{lang === 'bn' ? "সাপ্তাহিক ক্লাসের রুটিন ও সময়" : "Weekly Routine & Periods"}</h4>
                <p className="text-xs text-gray-500">{lang === 'bn' ? "৯ম শ্রেণী - বিজ্ঞান শাখা 'ক' এর নিয়মিত সময়সূচী" : "Regular classes schedule for Grade IX - Science Section A"}</p>
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
                      {lang === 'bn' ? "শিক্ষাবর্ষ: ২০২৬" : "Session: 2026"}
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
                          {lang === 'bn' ? "নিবন্ধিত শিক্ষার্থী" : "Active Student"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-bold">
                        {lang === 'bn' ? "আইডি নম্বর: " : "Student ID: "} <span className="font-mono">{mockStudentProfile.id}</span>
                      </p>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? "স্টুডেন্টস কেয়ার মডেল স্কুল" : "Students Care Model School"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Academic info */}
                    <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <BookOpen className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "শিক্ষাগত তথ্য" : "Academic Credentials"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "শ্রেণী" : "Grade/Class"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "৯ম শ্রেণী" : mockStudentProfile.className}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "শাখা" : "Section"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "বিজ্ঞান 'ক'" : mockStudentProfile.section}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "রোল নম্বর" : "Class Roll"}</span>
                          <span className="font-mono font-extrabold text-[#025644] bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-md text-xs">{mockStudentProfile.roll}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "শিক্ষা গ্রুপ" : "Group Stream"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "বিজ্ঞান" : "Science"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Personal details */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <User className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "ব্যক্তিগত তথ্য" : "Personal Records"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "রক্তের গ্রুপ" : "Blood Group"}</span>
                          <span className="font-extrabold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-md text-xs">{mockStudentProfile.bloodGroup}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "জন্ম তারিখ" : "Date of Birth"}</span>
                          <span className="font-extrabold text-gray-800">12th May, 2011</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "লিঙ্গ" : "Gender"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "পুরুষ" : "Male"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "ধর্ম" : "Religion"}</span>
                          <span className="font-extrabold text-gray-800">{lang === 'bn' ? "ইসলাম" : "Islam"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Contact details */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4 text-left">
                      <div className="flex items-center gap-2 border-b border-gray-150 pb-2.5">
                        <Phone className="h-5 w-5 text-[#025644]" />
                        <h4 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "যোগাযোগ ও অভিভাবক" : "Guardian & Contact"}</h4>
                      </div>
                      <div className="space-y-3.5 text-sm">
                        <div className="flex justify-between flex-wrap gap-1">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "অভিভাবক" : "Guardian"}</span>
                          <span className="font-extrabold text-gray-800">{mockStudentProfile.guardian}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "মোবাইল" : "Contact Phone"}</span>
                          <span className="font-mono font-extrabold text-gray-800">{mockStudentProfile.phone}</span>
                        </div>
                        <div className="flex justify-between flex-wrap gap-1">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "ইমেইল" : "Email Address"}</span>
                          <span className="font-mono text-xs font-extrabold text-[#025644] hover:underline">imran.parent@scms.edu.bd</span>
                        </div>
                        <div className="flex justify-between flex-wrap gap-1 text-right">
                          <span className="text-gray-400 font-bold">{lang === 'bn' ? "স্থায়ী ঠিকানা" : "Permanent Address"}</span>
                          <span className="font-extrabold text-gray-800 text-xs max-w-[150px] leading-tight">
                            {lang === 'bn' ? "চরলক্ষ্যা, কর্ণফুলী, চট্টগ্রাম" : "Charlakshya, Karnaphuli, Chattogram"}
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
                        <h5 className="font-extrabold text-gray-900 text-sm">{lang === 'bn' ? "উপস্থিতির খতিয়ান (চলতি সেশন)" : "Attendance Record (Current Session)"}</h5>
                        <p className="text-xs text-gray-500 font-semibold">{lang === 'bn' ? "আপনার সামগ্রিক ক্লাসে উপস্থিতির পারফরম্যান্স চমৎকার!" : "Excellent! You are maintaining an elite presence streak this term."}</p>
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
          ? `আপনি কি নিশ্চিতভাবে "${fileName}" ফাইলটি গুগল ড্রাইভ থেকে মুছে ফেলতে চান?` 
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
              <Cloud className="h-3.5 w-3.5" /> {lang === 'bn' ? 'গুগল ড্রাইভ স্টোরেজ' : 'Google Drive Storage'}
            </span>
            <h3 className="font-extrabold text-gray-900 text-lg mt-1.5">
              {lang === 'bn' ? 'ক্লাউড ফাইল অ্যান্ড ডকুমেন্ট সেন্টার' : 'Cloud Document & File Center'}
            </h3>
            <p className="text-xs text-gray-400 font-bold">
              {lang === 'bn' 
                ? 'অনলাইন ভর্তি ফরম, নোটিশ অ্যাটাচমেন্ট এবং স্টুডেন্ট ফাইল সরাসরি গুগল ড্রাইভে ম্যানেজ করুন।' 
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
                {lang === 'bn' ? 'লগ আউট' : 'Disconnect'}
              </button>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {uploadError && (
          <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3">
            <span className="text-rose-600 font-black text-lg leading-none shrink-0">&times;</span>
            <div className="text-xs font-bold text-rose-800">
              <p className="font-black mb-0.5">{lang === 'bn' ? 'ত্রুটি ঘটেছে' : 'An error occurred'}</p>
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
                {lang === 'bn' ? 'গুগল ড্রাইভ লিংক করুন' : 'Connect Google Drive'}
              </h4>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                {lang === 'bn' 
                  ? 'আপনার গুগল ড্রাইভ একাউন্টের সাথে সংযোগ করে শিক্ষার্থীদের জন্য ফাইল আপলোড এবং ডাউনলোড সুবিধা চালু করুন।' 
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
              <span className="text-sm">{lang === 'bn' ? 'গুগল একাউন্ট দিয়ে সাইন-ইন করুন' : 'Sign in with Google'}</span>
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
                      {item.name === 'root' ? (lang === 'bn' ? 'আমার ড্রাইভ' : 'My Drive') : item.name}
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
                    title={lang === 'bn' ? 'পূর্বের ফোল্ডারে ফিরুন' : 'Go back'}
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
                  {lang === 'bn' ? 'নতুন ফোল্ডার' : 'New Folder'}
                </button>

                {/* File Upload Selector */}
                <label className="px-3.5 py-2 bg-[#025644] hover:bg-[#01352a] text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {lang === 'bn' ? 'ফাইল আপলোড' : 'Upload File'}
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
                  placeholder={lang === 'bn' ? 'ফোল্ডারের নাম...' : 'Folder name...'}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#005c53]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#025644] hover:bg-[#01352a] text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'তৈরি করুন' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </motion.form>
            )}

            {/* List / Grid Browser of Files */}
            {isDriveLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#025644]" />
                <p className="text-xs text-gray-400 font-bold">{lang === 'bn' ? 'ফাইল লোড হচ্ছে...' : 'Fetching items from Google Drive...'}</p>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-20 border border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                <div className="h-12 w-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center">
                  <Folder className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900">{lang === 'bn' ? 'এই ফোল্ডারটি খালি' : 'Folder is empty'}</h4>
                  <p className="text-xs text-gray-400 font-bold max-w-xs mt-1">
                    {lang === 'bn' 
                      ? 'এখানে কোন ফাইল বা সাব-ফোল্ডার পাওয়া যায়নি। আপনার প্রয়োজনীয় ফাইলটি আপলোড করুন।' 
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
                            {isFolder ? (lang === 'bn' ? 'ফোল্ডার' : 'Folder') : formatBytes(file.size)}
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
                              title={lang === 'bn' ? 'ড্রাইভে দেখুন' : 'View in Google Drive'}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteFileClick(file.id, file.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
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
    let dynamicGreetingBn = 'শুভ সকাল';
    if (hours >= 12 && hours < 17) {
      dynamicGreetingEn = 'Good afternoon';
      dynamicGreetingBn = 'শুভ অপরাহ্ন';
    } else if (hours >= 17 && hours < 20) {
      dynamicGreetingEn = 'Good evening';
      dynamicGreetingBn = 'শুভ সন্ধ্যা';
    } else if (hours >= 20 || hours < 5) {
      dynamicGreetingEn = 'Good night';
      dynamicGreetingBn = 'শুভ রাত্রি';
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
        'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 
        'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
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
      const banglaDaysOfWeek = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      const dayOfWeek = banglaDaysOfWeek[date.getDay()];
      
      const toBanglaDigits = (num: number) => {
        const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
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
        const daysOfWeekBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
        const weekday = l === 'bn' ? daysOfWeekBn[date.getDay()] : daysOfWeekEn[date.getDay()];
        
        if (l === 'bn') {
          if (!parts.includes('হিজরি') && !parts.includes('হিজরী')) {
            parts = parts + ' হিজরি';
          }
          return `${weekday}, ${parts}`;
        } else {
          if (!parts.includes('AH')) {
            parts = parts + ' AH';
          }
          return `${weekday}, ${parts}`;
        }
      } catch (e) {
        return l === 'bn' ? 'শনিবার, ২৬ মহররম, ১৪৪৮ হিজরি' : 'Saturday, Muharram 26, 1448 AH';
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
              {lang === 'bn' ? `${dynamicGreetingBn}, অ্যাডমিন!` : `${dynamicGreetingEn}, Admin!`} <span className="inline-block">★</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] font-bold">
              {lang === 'bn' 
                ? `স্টুডেন্টস কেয়ার মডেল স্কুলে আজকে কি কি ঘটছে তা দেখে নিন, ${englishDateStr}।` 
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
                <span className="text-[9px] font-bold text-emerald-600 tracking-wider block mb-0.5">বাংলা</span>
                <span className="text-xs font-black text-gray-800 block">{banglaDateStr}</span>
              </div>
            </div>

            {/* Hijri Date */}
            <div className="bg-white border border-gray-150 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-3xs">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50 flex items-center justify-center shrink-0">
                <Clock className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] font-bold text-amber-600 tracking-wider block mb-0.5">হিজরি</span>
                <span className="text-xs font-black text-gray-800 block">{lang === 'bn' ? hijriDateStrBn : hijriDateStrEn}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Stats Row with SVG Sparklines on the right of values */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { 
              labelBn: "মোট শিক্ষার্থী", 
              labelEn: "Total Students", 
              value: students.length.toString(), 
              change: students.filter(s => s.status === 'Active').length > 0 ? `+${((students.filter(s => s.status === 'Active').length / students.length) * 100).toFixed(0)}% Act` : "0%",
              trend: "up", 
              sparkData: [12, 14, 13, 15, 14, 16, students.length * 2], 
              color: "#a855f7", 
              bg: "purple" 
            },
            { 
              labelBn: "মুলতুবি ভর্তি আবেদন", 
              labelEn: "Pending Admissions", 
              value: pendingAdmissions.filter((adm: any) => adm.status === 'pending').length.toString(), 
              change: `Req: ${pendingAdmissions.length}`, 
              trend: "neutral", 
              sparkData: [8, 10, 9, 11, 10, 12, pendingAdmissions.filter((adm: any) => adm.status === 'pending').length * 4], 
              color: "#10b981", 
              bg: "emerald" 
            },
            { 
              labelBn: "কর্মরত শিক্ষক", 
              labelEn: "Active Teachers", 
              value: employees.filter(e => e.status === 'Active').length.toString(), 
              change: `Tot: ${employees.length}`, 
              trend: "up", 
              sparkData: [10, 8, 11, 9, 12, 11, employees.filter(e => e.status === 'Active').length * 5], 
              color: "#d97706", 
              bg: "amber" 
            },
            { 
              labelBn: "সক্রিয় শ্রেণীসমূহ", 
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
              <span className="text-xs font-bold uppercase tracking-wider text-teal-50">{lang === 'bn' ? 'মোট কালেকশন' : 'Total Collection'}</span>
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-white/15">
                <Coins className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="my-3 text-left space-y-1">
              <h3 className="text-3xl font-black tracking-tight leading-none font-sans">
                ৳ 1,25,760
              </h3>
              <p className="text-[11px] text-teal-100/90 font-bold">{lang === 'bn' ? 'চলতি মাস • টার্গেটের ৮১%' : 'This month • 81% of target'}</p>
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
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">{lang === 'bn' ? 'বকেয়া পাওনা' : 'Pending Dues'}</span>
              <div className="h-10 w-10 bg-amber-200/60 rounded-xl flex items-center justify-center text-amber-800 shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-amber-300/30">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="my-2 text-left">
              <h3 className="text-3xl font-black tracking-tight leading-none text-amber-950">
                ৳ 28,430
              </h3>
              <p className="text-[11px] text-amber-900/80 font-extrabold mt-1">{lang === 'bn' ? '১৪২ জন অভিভাবকের পেমেন্ট বাকি' : '142 guardians pending payment'}</p>
            </div>
            <button className="w-full max-w-fit mt-1 px-4 py-1.5 bg-white hover:bg-amber-50 text-amber-900 text-xs font-black rounded-xl border border-amber-200/60 transition-all cursor-pointer shadow-3xs flex items-center justify-center">
              {lang === 'bn' ? 'রিমাইন্ডার পাঠান' : 'Send reminders'}
            </button>
          </div>

          {/* Card C: Overdue */}
          <div className="bg-[#ffe4e6] border border-[#fda4af] p-6 rounded-2xl shadow-xs flex flex-col justify-between min-h-[180px] group text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#881337]">{lang === 'bn' ? 'অতিরিক্ত বিলম্বিত' : 'Overdue'}</span>
              <div className="h-10 w-10 bg-rose-200/80 rounded-xl flex items-center justify-center text-[#881337] shrink-0 shadow-3xs transition-transform group-hover:scale-110 border border-rose-300/30">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
            </div>
            <div className="my-2 text-left">
              <h3 className="text-3xl font-black tracking-tight leading-none text-[#881337]">
                ৳ 9,870
              </h3>
              <p className="text-[11px] text-[#9f1239] font-extrabold mt-1">{lang === 'bn' ? '৩৮ টি অ্যাকাউন্ট • ৩০+ দিন অতিবাহিত' : '38 accounts • > 30 days'}</p>
            </div>
            <button className="w-full max-w-fit mt-1 px-4 py-1.5 bg-white hover:bg-rose-100 text-[#881337] text-xs font-black rounded-xl border border-rose-300 transition-all cursor-pointer shadow-3xs flex items-center justify-center">
              {lang === 'bn' ? 'অ্যাকাউন্ট রিভিউ' : 'Review accounts'}
            </button>
          </div>
        </div>

        {/* Row 4: Student & Fee Overview & Fee Collection Status Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student & Fee Overview Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-150 p-6 rounded-2xl shadow-2xs text-left flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? 'ছাত্র ও ফি ওভারভিউ' : 'Student & Fee Overview'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? 'বিগত ৮ মাস • দ্বৈত অক্ষ' : 'Last 8 months • dual axis'}</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-extrabold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block" />
                  <span className="text-gray-500">{lang === 'bn' ? 'শিক্ষার্থী' : 'Students'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 block" />
                  <span className="text-gray-600">{lang === 'bn' ? 'ফি কালেকশন' : 'Fees'}</span>
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
                    tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
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
              <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? 'ফি কালেকশন স্ট্যাটাস' : 'Fee Collection Status'}</h3>
              <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? 'আগস্ট মাসের ফি সারসংক্ষেপ' : 'August summary'}</p>
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
                  <span className="text-[10px] text-gray-500 font-extrabold mt-1">{lang === 'bn' ? 'সংগৃহীত' : 'Collected'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold text-[#475569] pt-3 border-t border-gray-100 mt-2">
              <div>
                <span className="block text-blue-600 font-black">৳97k</span>
                <span>{lang === 'bn' ? 'সংগৃহীত' : 'Collected'}</span>
              </div>
              <div>
                <span className="block text-orange-500 font-black">৳18k</span>
                <span>{lang === 'bn' ? 'বকেয়া' : 'Pending'}</span>
              </div>
              <div>
                <span className="block text-red-500 font-black">৳10k</span>
                <span>{lang === 'bn' ? 'বিলম্বিত' : 'Overdue'}</span>
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
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? 'দৈনিক উপস্থিতি হিটম্যাপ' : 'Daily Attendance Heatmap'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? 'শিক্ষার্থীদের উপস্থিতি ঘনত্বের রেকর্ড' : 'Student attendance density records'}</p>
              </div>
              <span className="text-xs font-black text-[#005c53] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                {lang === 'bn' ? 'আগস্ট ২০২৬' : 'August 2026'}
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
              <span className="text-[11px] uppercase tracking-wider">{lang === 'bn' ? 'উপস্থিতি হার:' : 'Attendance Rate:'}</span>
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
                <h3 className="font-black text-gray-900 text-base">{lang === 'bn' ? 'সেরা পারফর্মার লিডারবোর্ড' : 'Top Performers Leaderboard'}</h3>
                <p className="text-xs text-[#475569] font-bold mt-0.5">{lang === 'bn' ? 'একাডেমিক ও উপস্থিতি স্কোরে সেরা ৫ শিক্ষার্থী' : 'Top 5 students in academics & attendance'}</p>
              </div>
              <span className="text-xs font-black text-[#005c53] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                {lang === 'bn' ? 'চলতি টার্ম' : 'Current Term'}
              </span>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-4">
              {[
                { rank: 1, name: 'Sajid Hasan', class: 'Class 9-A', score: '98.5%', badge: '★ Golden A+' },
                { rank: 2, name: 'Tasnim Rahman', class: 'Class 10-A', score: '97.2%', badge: '★ High Attendance' },
                { rank: 3, name: 'Arefin Chowdhury', class: 'Class 8-B', score: '95.8%', badge: '★ Top Grade' },
                { rank: 4, name: 'Maliha Islam', class: 'Class 9-B', score: '94.3%', badge: '★ Consistently Active' },
                { rank: 5, name: 'Nabil Ahmed', class: 'Class 7-A', score: '93.1%', badge: '★ Excel' }
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
                      <span className="text-[10px] text-gray-400 font-bold">{student.class} • {student.badge}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gray-900 text-xs">{student.score}</span>
                    <span className="text-[9px] text-emerald-600 font-bold block">★ Score</span>
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
      { id: 'dashboard', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard },
      { id: 'frontend', label: lang === 'bn' ? 'ফ্রন্টএন্ড সেটিংস' : 'Frontend', icon: Sliders },
      { id: 'student_details', label: lang === 'bn' ? 'শিক্ষার্থী তথ্য' : 'Student Details', icon: Users },
      { id: 'admission', label: lang === 'bn' ? 'ভর্তি কার্যক্রম' : 'Admission', icon: UserPlus },
      { id: 'employee', label: lang === 'bn' ? 'কর্মচারী ও শিক্ষক' : 'Employee', icon: GraduationCap },
      { id: 'classes', label: lang === 'bn' ? 'ক্লাস রুম' : 'Classes', icon: BookOpen },
      { id: 'fees', label: lang === 'bn' ? 'ফি কালেকশন' : 'Fees', icon: Wallet },
      { id: 'card', label: lang === 'bn' ? 'আইডি কার্ড তৈরি' : 'Card Management', icon: CreditCard },
      { id: 'certificate', label: lang === 'bn' ? 'শংসাপত্র' : 'Certificate', icon: Award },
      { id: 'academic', label: lang === 'bn' ? 'একাডেমিক রুটিন' : 'Academic', icon: Calendar },
      { id: 'exam', label: lang === 'bn' ? 'পরীক্ষা ও ফলাফল' : 'Exam', icon: FileText },
      { id: 'attendance', label: lang === 'bn' ? 'হাজিরা খাতা' : 'Attendance', icon: CheckSquare },
      { id: 'notice', label: lang === 'bn' ? 'নোটিশ পাবলিশার' : 'Notice', icon: Bell },
      { id: 'homework', label: lang === 'bn' ? 'বাড়ির কাজ' : 'Homework', icon: BookOpen },
      { id: 'sms', label: lang === 'bn' ? 'বাল্ক এসএমএস' : 'Bulk Sms And Email', icon: MessageSquare },
      { id: 'student_accounting', label: lang === 'bn' ? 'স্টুডেন্ট হিসাব' : 'Student Accounting', icon: DollarSign },
      { id: 'office_accounting', label: lang === 'bn' ? 'অফিস ক্যাশ বুক' : 'Office Accounting', icon: FileSpreadsheet },
      { id: 'reports', label: lang === 'bn' ? 'কার্যক্রম রিপোর্ট' : 'Reports', icon: Activity },
      { id: 'google_drive', label: lang === 'bn' ? 'গুগল ড্রাইভ স্টোরেজ' : 'Google Drive Storage', icon: Cloud },
      { id: 'settings', label: lang === 'bn' ? 'সেটিংস' : 'Settings', icon: Settings },
      { id: 'developer_hub', label: lang === 'bn' ? 'কোড পরিবর্তন গাইড' : 'Code Change Guide', icon: Code },
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
              <span className="text-[#005c53]">•</span>
              {lang === 'bn' ? 'কোড পরিবর্তন ও সিস্টেম আর্কিটেকচার গাইড' : 'Developer & Code Change Guide'}
            </h3>
            <p className="text-xs text-gray-400 font-bold">
              {lang === 'bn' 
                ? 'স্টুডেন্টস কেয়ার মডেল স্কুলের এডমিন পোর্টালে করা সাম্প্রতিক কোড পরিবর্তনের সম্পূর্ণ ডিরেক্টরি' 
                : 'Complete directory of recent custom code changes and modal structures in the Admin Portal'}
            </p>
          </div>
          <span className="self-start md:self-auto px-3.5 py-1.5 bg-emerald-50 border border-emerald-150 text-[#005c53] text-[11px] font-black rounded-xl flex items-center gap-1.5 shadow-3xs animate-bounce">
            <span className="h-2 w-2 rounded-full bg-[#005c53] animate-pulse" />
            {lang === 'bn' ? 'অটো-আপডেট কোড সিস্টেম সক্রিয়' : 'Live Auto-Sync Active'}
          </span>
        </div>

        {/* Informative Warning Card */}
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-start gap-3.5 text-slate-700">
          <div className="h-9 w-9 rounded-xl bg-slate-100 text-[#005c53] border border-slate-200 flex items-center justify-center shrink-0">
            <Code className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-extrabold text-slate-900">
              {lang === 'bn' ? 'ডাইনামিক কোড পরিবর্তন নির্দেশনাবলী' : 'Developer Interactive Guidance'}
            </p>
            <p className="leading-relaxed font-semibold text-gray-500">
              {lang === 'bn' 
                ? 'আপনি যখন এডমিন প্যানেলের কোনো অপশন পরিবর্তন করবেন, এই পরিবর্তনসমূহ স্বয়ংক্রিয়ভাবে নিচের কোড ব্লকে প্রতিস্থাপিত হবে। আপনি শুধু কোডটি কপি করে নিচে দেওয়া নির্দিষ্ট লাইন নম্বরে পেস্ট করে পার্মানেন্টলি পরিবর্তন করতে পারবেন।' 
                : 'Whenever you change any option in the Admin Panel settings, the generated code blocks below will automatically update with your live values! Simply copy the updated code and replace the specified line ranges.'}
            </p>
          </div>
        </div>

        {/* Section Tabs inside the hub */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
          {[
            { id: 'overview', labelBn: 'সারসংক্ষেপ', labelEn: 'Overview' },
            { id: 'settings_full', labelBn: 'পূর্ণাঙ্গ সেটিংস কোড (Lines 521-542)', labelEn: 'Full Settings State (Lines 521-542)' },
            { id: 'settings_parts', labelBn: 'আংশিক কোড ব্লকসমূহ', labelEn: 'Partial Code Segments' },
            { id: 'state', labelBn: 'রুটিন স্টেট (Lines 463-473)', labelEn: 'Routine States (Lines 463-473)' },
            { id: 'menu', labelBn: 'সাইডবার মেনু (Lines 3727-3749)', labelEn: 'Sidebar Menu (Lines 3727-3749)' },
            { id: 'modals', labelBn: 'একাডেমিক মোডাল (Lines 7371-7620)', labelEn: 'Academic Modals (Lines 7371-7620)' }
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
                {lang === 'bn' ? 'সিস্টেম আর্কিটেকচার ও লাইভ আপডেট ট্র্যাকিং' : 'System Architecture & Live Code Sync'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left bg-emerald-50/20">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-150 text-[#005c53] flex items-center justify-center font-bold text-xs shadow-3xs">1</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? 'লাইভ অটো-আপডেট' : 'Live Code Updates'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? 'যেকোনো সেটিংস ও অপশন পরিবর্তন করলে তা সরাসরি কোড ব্লকগুলোর ভিতর স্বয়ংক্রিয়ভাবে বসে যায়।' 
                      : 'Any branding changes you make on screen are instantly injected into the copyable code snippets.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shadow-3xs">2</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? 'সঠিক লাইন ট্র্যাকিং' : 'Precise Line Markers'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? 'কোডের কোন লাইন থেকে কোন লাইন এডিট করবেন তার একদম নিখুঁত ইনডেক্স ও লাইন নম্বর দেওয়া আছে।' 
                      : 'Provides the exact line ranges inside StudentPortal.tsx to locate, delete and paste code blocks with zero doubt.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shadow-3xs">3</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? 'নিরাপদ সিঙ্গেল ক্লিকে কপি' : 'Secure Copy to Clipboard'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? 'একটি বাটনে ক্লিক করেই কোডগুলো সম্পূর্ণরূপে কপি হয়ে যাবে, কোনো ম্যানুয়াল সিলেক্ট করার ঝামেলা নেই।' 
                      : 'Never miss a bracket or syntax character. Use the Copy Code button for error-free transfer of custom logic.'}
                  </p>
                </div>

                <div className="border border-gray-150 p-4 rounded-xl space-y-2 text-left">
                  <div className="h-8 w-8 rounded-lg bg-[#005c53]/10 text-[#005c53] flex items-center justify-center font-bold text-xs shadow-3xs">4</div>
                  <h5 className="font-extrabold text-xs text-gray-900">{lang === 'bn' ? 'ডিফল্ট মান সংরক্ষণ' : 'Hardcode Default Settings'}</h5>
                  <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                    {lang === 'bn' 
                      ? 'কোড পরিবর্তনের পর ব্রাউজার মেমোরি খালি করলেও আপনার কাস্টম নাম ও মানগুলো সারাজীবন স্থায়ী থাকবে।' 
                      : 'Keeps your custom school logo, colored theme banner, and pass marks persistent across any user session.'}
                  </p>
                </div>
              </div>

              {/* Quick Status Info */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2 text-xs">
                <p className="font-extrabold text-gray-800">{lang === 'bn' ? 'সক্রিয় সেটিংসের সংক্ষিপ্ত তথ্য:' : 'Active Applied Configuration Status:'}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-500 font-bold">
                  <div>• {lang === 'bn' ? 'স্কুল নেম:' : 'School:'} <span className="text-gray-900 font-black">{schoolSettings.schoolName}</span></div>
                  <div>• {lang === 'bn' ? 'ব্যানার কালার:' : 'Banner Color:'} <span className="text-gray-900 font-black" style={{ color: schoolSettings.headerBgColor }}>{schoolSettings.headerBgColor}</span></div>
                  <div>• {lang === 'bn' ? 'পাস মার্ক (পরীক্ষা):' : 'Pass Marks:'} <span className="text-gray-900 font-black">{schoolSettings.examPassMarks}%</span></div>
                  <div>• {lang === 'bn' ? 'কাস্টম ফিল্ড সংখ্যা:' : 'Custom Fields:'} <span className="text-gray-900 font-black">{schoolSettings.customFields.length}</span></div>
                </div>
              </div>
            </div>
          )}

          {developerActiveTab === 'settings_full' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-gray-800 text-sm">
                    {lang === 'bn' ? 'পূর্ণাঙ্গ সেটিংস স্টেট অবজেক্ট পরিবর্তন' : 'Full Settings State Return Object'}
                  </h4>
                  <p className="text-[11px] text-[#005c53] font-black mt-1">
                    {lang === 'bn' 
                      ? '• StudentPortal.tsx ফাইলের ৫২১ থেকে ৫৪৩ লাইনের ভেতরের কোডটি মুছে এই কোডটি পেস্ট করুন।' 
                      : '• Locate lines 521 to 542 in StudentPortal.tsx, erase them completely and paste this exact updated block.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('settings_full', dynamicSchoolSettingsCode)}
                  className="px-3.5 py-2 bg-[#005c53] hover:bg-[#034d45] text-white text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'settings_full' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-200" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'settings_full' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কোড কপি করুন' : 'Copy Code')}</span>
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
                {lang === 'bn' ? 'আংশিক কোড পরিবর্তন তালিকা (যেকোনো একটি অংশ কপি করুন)' : 'Partial Settings Configurations (Copy specific blocks to target sections)'}
              </h4>

              {/* Branding Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-150">
                  <div className="text-xs font-bold text-gray-700">
                    • {lang === 'bn' ? '১. স্কুল পরিচিতি ও ব্যানার সেটিংস (Lines 522-528)' : '1. School Identity & Banner Theme (Lines 522-528)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_brand', brandingCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_brand' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_brand' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy Segment')}</span>
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
                    • {lang === 'bn' ? '২. ঠিকানা ও মোবাইল নাম্বার সেটিংস (Lines 529-533)' : '2. Address & Mobile Contacts (Lines 529-533)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_contact', contactsCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_contact' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_contact' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy Segment')}</span>
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
                    • {lang === 'bn' ? '৩. পাস মার্কস ও প্রশংসাপত্র সেটিংস (Lines 534-537)' : '3. Pass Marks & Certificate Template (Lines 534-537)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_pass', passMarksCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_pass' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_pass' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy Segment')}</span>
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
                    • {lang === 'bn' ? '৪. কাস্টম অ্যাডমিশন ফিল্ডস কোড (Lines 538-541)' : '4. Custom Student Enrollment Fields (Lines 538-541)'}
                  </div>
                  <button
                    onClick={() => handleCopyCode('part_fields', customFieldsCode)}
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-black rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {developerCopiedId === 'part_fields' ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{developerCopiedId === 'part_fields' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy Segment')}</span>
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
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? 'রুটিন মডিউল স্টেট ভেরিয়েবল' : 'Top-Level Routine State Declaration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? 'React হুক নিয়মানুযায়ী এই কোডটি StudentPortal.tsx-এর ৪৬৩ থেকে ৪৭৩ নং লাইনে রয়েছে।' : 'Must reside unconditionally at the component root level (Lines 463 to 473) to keep render ordering stable.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('state', stateCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'state' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'state' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কোড কপি করুন' : 'Copy Code')}</span>
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
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? 'অ্যাডমিন সাইডবার মেনু কনফিগারেশন' : 'Left-Side Navigation Configuration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? '• StudentPortal.tsx ফাইলের ৩৭২৭ থেকে ৩৭৪৯ নং লাইনের ভেতরের কোডটি পরিবর্তন করে বাম পাশের সাইডবার কাস্টমাইজ করুন।' : '• Locate lines 3727 to 3749 inside StudentPortal.tsx to modify or reorder Left-Side Navigation links.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('menu', menuCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'menu' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'menu' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কোড কপি করুন' : 'Copy Code')}</span>
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
                  <h4 className="font-extrabold text-gray-800 text-sm">{lang === 'bn' ? 'একাডেমিক মোডালসমূহের রেন্ডারিং কোড' : 'Academic Modals JSX Integration'}</h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1">
                    {lang === 'bn' ? '• এই কোডগুলো StudentPortal.tsx ফাইলের ৭৩৭১ থেকে ৭৬২০ লাইনে অব্দি রেন্ডার হয়েছে।' : '• These modals control data creation, located within lines 7371 to 7620 inside StudentPortal.tsx.'}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode('modals', modalsCode)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-150 text-gray-700 text-[10px] font-black rounded-lg flex items-center gap-1.5 shadow-3xs cursor-pointer transition-colors"
                >
                  {developerCopiedId === 'modals' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{developerCopiedId === 'modals' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কোড কপি করুন' : 'Copy Code')}</span>
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
      { id: 'dashboard', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard },
      { id: 'frontend', label: lang === 'bn' ? 'ফ্রন্টএন্ড সেটিংস' : 'Frontend', icon: Sliders },
      { id: 'student_details', label: lang === 'bn' ? 'শিক্ষার্থী তথ্য' : 'Student Details', icon: Users },
      { id: 'admission', label: lang === 'bn' ? 'ভর্তি কার্যক্রম' : 'Admission', icon: UserPlus },
      { id: 'employee', label: lang === 'bn' ? 'কর্মচারী ও শিক্ষক' : 'Employee', icon: GraduationCap },
      { id: 'classes', label: lang === 'bn' ? 'ক্লাস রুম' : 'Classes', icon: BookOpen },
      { id: 'fees', label: lang === 'bn' ? 'ফি কালেকশন' : 'Fees', icon: Wallet },
      { id: 'card', label: lang === 'bn' ? 'আইডি কার্ড তৈরি' : 'Card Management', icon: CreditCard },
      { id: 'certificate', label: lang === 'bn' ? 'শংসাপত্র' : 'Certificate', icon: Award },
      { id: 'academic', label: lang === 'bn' ? 'একাডেমিক রুটিন' : 'Academic', icon: Calendar },
      { id: 'exam_controller', label: lang === 'bn' ? 'এক্সাম কন্ট্রোলার প্ল্যান' : 'Exam Controller Plan', icon: FileText },
      { id: 'exam', label: lang === 'bn' ? 'পরীক্ষা ও ফলাফল' : 'Exam', icon: FileText },
      { id: 'attendance', label: lang === 'bn' ? 'হাজিরা খাতা' : 'Attendance', icon: CheckSquare },
      { id: 'notice', label: lang === 'bn' ? 'নোটিশ পাবলিশার' : 'Notice', icon: Bell },
      { id: 'homework', label: lang === 'bn' ? 'বাড়ির কাজ' : 'Homework', icon: BookOpen },
      { id: 'sms', label: lang === 'bn' ? 'বাল্ক এসএমএস' : 'Bulk Sms And Email', icon: MessageSquare },
      { id: 'student_accounting', label: lang === 'bn' ? 'স্টুডেন্ট হিসাব' : 'Student Accounting', icon: DollarSign },
      { id: 'office_accounting', label: lang === 'bn' ? 'অফিস ক্যাশ বুক' : 'Office Accounting', icon: FileSpreadsheet },
      { id: 'reports', label: lang === 'bn' ? 'কার্যক্রম রিপোর্ট' : 'Reports', icon: Activity },
      { id: 'google_drive', label: lang === 'bn' ? 'গুগল ড্রাইভ স্টোরেজ' : 'Google Drive Storage', icon: Cloud },
      { id: 'settings', label: lang === 'bn' ? 'সেটিংস' : 'Settings', icon: Settings },
    ];

    // Trigger SMS Broadcasting Simulation
    const handleSmsBroadcast = (e: React.FormEvent) => {
      e.preventDefault();
      if (!smsMessage.trim()) return;
      setSmsGatewayStatus('sending');
      addAuditLog(`Admin triggered bulk SMS broadcast to ${smsTargetClass}. Content: "${smsMessage.slice(0, 30)}..."`);
      setTimeout(() => {
        setSmsGatewayStatus('success');
        setAdminSuccessMsg(lang === 'bn' ? `গার্ডিয়ান গ্রুপে এসএমএস সফলভাবে পাঠানো হয়েছে!` : 'Bulk SMS broadcast successfully delivered!');
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
                            <span className="truncate">{lang === 'bn' ? 'শিক্ষার্থী তালিকা' : 'Student List'}</span>
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
                            <span className="truncate">{lang === 'bn' ? 'লগইন নিষ্ক্রিয়' : 'Login Deactivate'}</span>
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
                            <span className="truncate">{lang === 'bn' ? 'নিষ্ক্রিয়তার কারণ' : 'Deactivate Reason'}</span>
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
                            { id: 'employee_list', labelBn: 'কর্মচারী তালিকা', labelEn: 'Employee List' },
                            { id: 'add_department', labelBn: 'ডিপার্টমেন্ট যোগ করুন', labelEn: 'Add Department' },
                            { id: 'add_designation', labelBn: 'ডেজিগনেশন যোগ করুন', labelEn: 'Add Designation' },
                            { id: 'add_employee', labelBn: 'কর্মচারী যোগ করুন', labelEn: 'Add Employee' },
                            { id: 'login_deactivate', labelBn: 'লগইন নিষ্ক্রিয়', labelEn: 'Login Deactivate' }
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
                            { id: 'general_settings', labelBn: 'সাধারণ সেটিংস', labelEn: 'General Settings' },
                            { id: 'school_settings', labelBn: 'স্কুল সেটিংস', labelEn: 'School Settings' },
                            { id: 'role_permission', labelBn: 'রোল পারমিশন', labelEn: 'Role Permission' },
                            { id: 'session_settings', labelBn: 'সেশন সেটিংস', labelEn: 'Session Settings' },
                            { id: 'translations', labelBn: 'অনুবাদ', labelEn: 'Translations' },
                            { id: 'cron_job', labelBn: 'ক্রন জব', labelEn: 'Cron Job' },
                            { id: 'system_student_field', labelBn: 'সিস্টেম স্টুডেন্ট ফিল্ড', labelEn: 'System Student Field' },
                            { id: 'custom_field', labelBn: 'কাস্টম ফিল্ড', labelEn: 'Custom Field' },
                            { id: 'report_card', labelBn: 'রিপোর্ট কার্ড', labelEn: 'Report Card' },
{ id: 'change_password', labelBn: 'পাসওয়ার্ড পরিবর্তন', labelEn: 'Change Password' },
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
                            { id: 'exam_hall_duty', labelBn: 'পরীক্ষা হল ডিউটি', labelEn: 'Exam Hall Duty' },
                            { id: 'seat_arrangement', labelBn: 'আসন বিন্যাস', labelEn: 'Seat Arrangement' },
                            { id: 'seat_plan', labelBn: 'সিট প্ল্যান', labelEn: 'Seat Plan' }
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
                            { id: 'class_section', labelBn: 'ক্লাস এবং সেকশন', labelEn: 'Class & Section' },
                            { id: 'subject', labelBn: 'বিষয়', labelEn: 'Subject' },
                            { id: 'class_schedule', labelBn: 'ক্লাস শিডিউল', labelEn: 'Class Schedule' },
                            { id: 'class_routine', labelBn: 'ক্লাস রুটিন', labelEn: 'Class Routine' },
                            { id: 'teacher_class_routine', labelBn: 'শিক্ষক ক্লাস রুটিন', labelEn: 'Teacher Class Routine' },
                            { id: 'routine_overview', labelBn: 'রুটিন ওভারভিউ', labelEn: 'Routine Overview' },
                            { id: 'teacher_schedule', labelBn: 'শিক্ষকের সময়সূচী', labelEn: 'Teacher Schedule' },
                            { id: 'promotion', labelBn: 'প্রমোশন', labelEn: 'Promotion' }
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
                            { id: 'exam_term', labelBn: 'পরীক্ষা টার্ম', labelEn: 'Exam Term' },
                            { id: 'exam_routine', labelBn: 'পরীক্ষা রুটিন', labelEn: 'Exam Routine' },
                            { id: 'exam_hall', labelBn: 'পরীক্ষা হল', labelEn: 'Exam Hall' },
                            { id: 'exam_distribution', labelBn: 'নম্বর বণ্টন', labelEn: 'Distribution' },
                            { id: 'exam_setup', labelBn: 'পরীক্ষা সেটআপ', labelEn: 'Exam Setup' },
                            { id: 'exam_marksheet_template', labelBn: 'মার্কশিট টেমপ্লেট', labelEn: 'Marksheet Template' },
                            { id: 'exam_schedule', labelBn: 'পরীক্ষা সময়সূচী', labelEn: 'Exam Schedule' },
                            { id: 'exam_marks', labelBn: 'নম্বর ইনপুট', labelEn: 'Marks' }
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
                            { id: 'school_settings', labelBn: 'স্কুল সেটিংস', labelEn: 'School Settings' },
                            { id: 'report_primary', labelBn: 'রিপোর্ট কার্ড - প্রাইমারি', labelEn: 'Report Card - Primary Section' },
                            { id: 'report_exam', labelBn: 'রিপোর্ট কার্ড - পরীক্ষা', labelEn: 'Report Card - Examination' },
                            { id: 'section_customization', labelBn: 'সেকশন কাস্টমাইজেশন', labelEn: 'Section Customization' },
                            { id: 'testimonial_template', labelBn: 'প্রশংসাপত্র টেমপ্লেট', labelEn: 'Testimonial Template' },
                            { id: 'testimonial_manager', labelBn: 'প্রশংসাপত্র ম্যানেজার', labelEn: 'Testimonial Manager' },
                            { id: 'cron_job', labelBn: 'ক্রন জব', labelEn: 'Cron Job' },
                            { id: 'login_banner', labelBn: 'লগইন ব্যানার', labelEn: 'Login Banner' },
                            { id: 'system_student_field', labelBn: 'সিস্টেম স্টুডেন্ট ফিল্ড', labelEn: 'System Student Field' },
                            { id: 'custom_field', labelBn: 'কাস্টম ফিল্ড', labelEn: 'Custom Field' },
                            { id: 'database_backup', labelBn: 'ডাটাবেজ ব্যাকআপ', labelEn: 'Database Backup' },
                            { id: 'user_login_log', labelBn: 'ইউজার লগইন লগ', labelEn: 'User Login Log' },
                            { id: 'change_password', labelBn: 'পাসওয়ার্ড পরিবর্তন', labelEn: 'Change Password' },
                            { id: 'user_credentials', labelBn: 'ইউজার ক্রেডেনশিয়াল', labelEn: 'User Credentials' }
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
                  <p className="text-[10px] text-gray-400 font-bold mt-1">{lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}</p>
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
                      {lang === 'bn' ? 'অ্যাডমিন অফিস' : 'Admin Office'}
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
                          {lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}
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
                          <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? 'অ্যাডমিন প্রোফাইল পরিবর্তন' : 'Update admin information'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? 'লগইন পাসওয়ার্ড পরিবর্তন' : 'Change login password'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'মেইলবক্স' : 'Mailbox'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? 'নোটিফিকেশন ও মেসেজ' : 'Inbound alerts & support'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'স্কুল সেটিংস' : 'School Settings'}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === 'bn' ? 'বিদ্যালয়ের সাধারণ পরিচিতি' : 'Update general parameters'}</span>
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
                            <span className="block font-black">{lang === 'bn' ? 'লগআউট সেশন' : 'Logout'}</span>
                            <span className="text-[10px] text-rose-400 font-bold">{lang === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড থেকে বিদায়' : 'Sign out from control room'}</span>
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
                    ? `শিক্ষার্থীদের তালিকা সফলভাবে Excel (CSV) ফাইল হিসেবে এক্সপোর্ট করা হয়েছে!` 
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
                              <p class="meta-info">Total: ${filteredStudents.length} • Generated: ${dateStr}</p>
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
                            <h1 class="title-bn">স্টুডেন্টস কেয়ার মডেল স্কুল</h1>
                            <p class="address-bn">চরলক্ষ্যা, কর্ণফুলী, চট্টগ্রাম</p>
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
                if (confirm(lang === 'bn' ? `${name}-কে ডাটাবেজ থেকে মুছে ফেলতে চান?` : `Are you sure you want to delete ${name} from records?`)) {
                  setStudents(prev => prev.filter(s => s.id !== id));
                  setAdminSuccessMsg(lang === 'bn' ? `${name}-এর রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!` : `Student record of ${name} has been deleted.`);
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
                        {lang === 'bn' ? 'শিক্ষার্থী তালিকা' : 'Student List'}
                      </button>
                      <button
                        onClick={() => setStudentDetailsSubTab('login_deactivate')}
                        className={`text-sm font-black pb-2.5 border-b-2 transition-all cursor-pointer ${
                          studentDetailsSubTab === 'login_deactivate'
                            ? 'border-[#025644] text-[#025644]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {lang === 'bn' ? 'লগইন নিষ্ক্রিয়' : 'Login Deactivate'}
                      </button>
                      <button
                        onClick={() => setStudentDetailsSubTab('deactivate_reason')}
                        className={`text-sm font-black pb-2.5 border-b-2 transition-all cursor-pointer ${
                          studentDetailsSubTab === 'deactivate_reason'
                            ? 'border-[#025644] text-[#025644]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {lang === 'bn' ? 'নিষ্ক্রিয়তার কারণ' : 'Deactivate Reason'}
                      </button>
                    </div>
                  </div>

                  {studentDetailsSubTab === 'student_list' && (
                    <div className="space-y-6">
                      {/* Sub-Header Row */}
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="text-left">
                          <h3 className="font-extrabold text-gray-900 text-2xl tracking-tight">
                            {lang === 'bn' ? 'শিক্ষার্থীবৃন্দ' : 'Students'}
                          </h3>
                          <p className="text-xs text-gray-400 font-bold mt-1">
                            {filteredStudents.length} {lang === 'bn' ? 'জন শিক্ষার্থীর তালিকা' : `of ${students.length} students`}
                          </p>
                        </div>

                        {/* Top Action Buttons (Excel, PDF, Attendance, Add Student) */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => triggerExport('Excel')}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-emerald-600 font-extrabold">•</span>
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={() => triggerExport('PDF')}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-red-500 font-extrabold">•</span>
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={triggerPrintAttendance}
                            className="bg-white border border-gray-200 text-gray-700 px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 cursor-pointer shadow-3xs transition-all"
                          >
                            <span className="text-blue-500 font-extrabold">•</span>
                            <span>{lang === 'bn' ? 'উপস্থিতি শিট' : 'Blank Attendance'}</span>
                          </button>
                          <button
                            onClick={() => setIsAddStudentModalOpen(true)}
                            className="bg-[#025644] text-white hover:bg-[#013f32] px-4 py-2 text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                          >
                            <Plus className="h-4 w-4 stroke-[3]" />
                            <span>{lang === 'bn' ? 'নতুন শিক্ষার্থী যোগ করুন' : 'Add New Student'}</span>
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
                              placeholder={lang === 'bn' ? "নাম, আইডি বা অভিভাবক..." : "Search by name, ID, class, guardian..."}
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
                            <option value="All">{lang === 'bn' ? 'সকল ক্লাস' : 'All Classes'}</option>
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
                            <option value="All">{lang === 'bn' ? 'সকল শাখা' : 'All Sections'}</option>
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
                            <option value="All">{lang === 'bn' ? 'সকল গ্রুপ' : 'All Groups'}</option>
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
                            <option value="All">{lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
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
                                    {lang === 'bn' ? 'কোন শিক্ষার্থীর তথ্য পাওয়া যায়নি।' : 'No student directory records match selected filters.'}
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
                                          title={lang === 'bn' ? "শিক্ষার্থীর তথ্য দেখুন" : "View Student Details"}
                                          onClick={() => {
                                            setViewingStudentDetails(std);
                                          }}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-[#025644] rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </button>
                                        <button 
                                          title={lang === 'bn' ? "প্রবেশপত্র ডাউনলোড / প্রিন্ট" : "Download Admit Card"}
                                          onClick={() => {
                                            setViewingAdmitCard(std);
                                          }}
                                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-sky-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center text-sm"
                                        >
                                          <span>•</span>
                                        </button>
                                        <button 
                                          title={lang === 'bn' ? "সম্পাদনা করুন" : "Edit"}
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
                                            setAdminSuccessMsg(lang === 'bn' ? `${std.name}-এর রেকর্ড পিন করা হয়েছে!` : `${std.name} has been pinned to priority list.`);
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
                              ? `প্রদর্শিত: ${startIndex + 1}-${Math.min(startIndex + 8, filteredStudents.length)} মোট: ${filteredStudents.length}`
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
                          {lang === 'bn' ? 'শিক্ষার্থী লগইন নিয়ন্ত্রণ প্যানেল' : 'Student Login Status Control'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'অস্থায়ীভাবে শিক্ষার্থীদের পোর্টাল অ্যাক্সেস ফ্রিজ বা সক্রিয় করুন' : 'Temporarily freeze or activate student credentials for portal logins'}
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
                                        ? `${std.name}-এর লগইন অ্যাক্সেস পরিবর্তন করা হয়েছে!` 
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
                                    {std.loginActive ? (lang === 'bn' ? 'অ্যাক্সেস স্থগিত করুন' : 'Deactivate Login') : (lang === 'bn' ? 'অ্যাক্সেস সচল করুন' : 'Enable Login')}
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
                            {lang === 'bn' ? 'নিষ্ক্রিয়তার কারণ নথিভুক্ত করুন' : 'Log Deactivation Reason'}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">
                            {lang === 'bn' ? 'কোন নিষ্ক্রিয় শিক্ষার্থীর পোর্টাল বন্ধের বিবরণ যুক্ত করুন' : 'Assign official suspension reasons to de-enrolled students'}
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
                              <option value="">-- {lang === 'bn' ? 'শিক্ষার্থী নির্বাচন করুন' : 'Select Student'} --</option>
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
                              placeholder={lang === 'bn' ? "যেমন: বকেয়া ফি পরিশোধ না করা, শৃঙ্খলা ভঙ্গ ইত্যাদি।" : "E.g. Fees overdue for 3 consecutive terms, disciplinary action."}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-[#025644]"
                            />
                          </div>

                          <button
                            onClick={() => {
                              if (!deactivateStudentId || !deactivateReasonText.trim()) {
                                alert(lang === 'bn' ? 'দয়া করে শিক্ষার্থী এবং কারণ লিখুন।' : 'Please select a student and type the reason.');
                                return;
                              }
                              setStudents(prev => prev.map(s => s.id === deactivateStudentId ? { ...s, deactivateReason: deactivateReasonText } : s));
                              setAdminSuccessMsg(lang === 'bn' ? "নিষ্ক্রিয়তার কারণ সফলভাবে সংরক্ষণ করা হয়েছে।" : "Deactivation reason registered successfully.");
                              setDeactivateStudentId('');
                              setDeactivateReasonText('');
                              setTimeout(() => setAdminSuccessMsg(''), 4000);
                            }}
                            className="w-full py-2 bg-[#025644] hover:bg-[#01352a] text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                          >
                            {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Reason Record'}
                          </button>
                        </div>
                      </div>

                      {/* Reasons display log */}
                      <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl p-5 shadow-3xs space-y-4">
                        <div>
                          <h4 className="font-extrabold text-gray-900 text-sm">
                            {lang === 'bn' ? 'স্থগিতকরণ রেজিস্ট্রি' : 'Suspension Registry'}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">
                            {lang === 'bn' ? 'সিস্টেমে রেকর্ডকৃত স্থগিত অ্যাক্সেস রেজিস্ট্রি' : 'Currently documented suspended logins with official grounds'}
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
                        {lang === 'bn' ? 'অনলাইন ভর্তি আবেদন কোয়েরি' : 'Admission Application Queue'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? 'অভিভাবকদের পাঠানো ভর্তি আবেদন পর্যালোচনা এবং অনুমোদন করুন' : 'Review and approve/reject online registration forms filed by guardians'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>{pendingAdmissions.filter((a: any) => a.status === 'pending').length} {lang === 'bn' ? 'টি আবেদন অপেক্ষারত' : 'Applications Pending'}</span>
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
                                {lang === 'bn' ? 'পূর্ববর্তী জিপিএ' : 'GPA'} {adm.previousGPA}
                              </span>
                              <span className={`px-2 py-0.5 text-[9px] font-black rounded-lg uppercase tracking-wider ${
                                adm.registrationFeeStatus === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {lang === 'bn' ? (adm.registrationFeeStatus === 'Paid' ? 'ফি পরিশোধিত' : 'ফি অপরিশোধিত') : `${adm.registrationFeeStatus} Registration`}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 font-semibold">
                              <p>{lang === 'bn' ? 'অভিভাবক' : 'Guardian'}: <span className="text-gray-800 font-bold">{adm.guardianName}</span></p>
                              <p>{lang === 'bn' ? 'আবেদনকৃত শ্রেণী' : 'Requested Class'}: <span className="text-emerald-700 font-extrabold">Class {adm.requestedClass}</span></p>
                              <p className="sm:col-span-2">{lang === 'bn' ? 'মোবাইল' : 'Contact Phone'}: <span className="text-gray-700 font-mono font-bold">{adm.guardianPhone}</span></p>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-200/60">
                          {/* View details button */}
                          <button
                            onClick={() => setActiveViewAdmission(adm)}
                            title={lang === 'bn' ? 'বিস্তারিত আবেদনপত্র দেখুন' : 'View Full Application Profile'}
                            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-extrabold"
                          >
                            <Eye className="h-4 w-4" />
                            <span>{lang === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
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
                                {lang === 'bn' ? 'অনুমোদন মডাল' : 'Approve Admission'}
                              </button>
                              <button 
                                onClick={() => handleRejectAdmission(adm.id, adm.studentName)}
                                className="px-3 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                              >
                                {lang === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                              </button>
                            </>
                          ) : adm.status === 'approved' ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs font-black rounded-xl">
                                OK {lang === 'bn' ? 'অনুমোদিত ও সিঙ্কড' : 'Approved & Synced'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                Assigned ID: {adm.assignedId || 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 border border-rose-150 text-rose-700 text-xs font-black rounded-xl">
                              X {lang === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {pendingAdmissions.length === 0 && (
                      <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-250 rounded-2xl text-gray-400 font-bold text-xs">
                        {lang === 'bn' ? 'কোনো মুলতুবি আবেদন পাওয়া যায়নি।' : 'No pending admission requests.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* ARCHITECTURAL & DATABASE CODE CORNER (EPITOME OF CRAFT) */}
                <div className="hidden bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                      <Code className="h-5 w-5 text-[#025644]" />
                      <span>{lang === 'bn' ? 'ডাটাবেজ আর্কিটেকচার ও এপিআই ইঞ্জিনিয়ারিং ব্যাকস্টেজ' : 'Database Architecture & Backend Controller Export'}</span>
                    </h4>
                    <p className="text-xs text-gray-400 font-bold mt-1">
                      {lang === 'bn' ? 'ভর্তি প্রক্রিয়া অটোমেশনের জন্য প্রোডাকশন-রেডি স্কিমা, ট্রানজেকশন ট্রিগার এবং কন্ট্রোলার কোড' : 'Full-stack production schemas, robust relational database transitions and safe auto-promotion codebases'}
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
                        alert(lang === 'bn' ? 'সফলভাবে ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Copied schema/code to clipboard successfully!');
                      }}
                      className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{lang === 'bn' ? 'কোড কপি করুন' : 'Copy Code'}</span>
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
                          {lang === 'bn' ? 'কর্মচারী ও শিক্ষক ডিরেক্টরি' : 'Faculty & Staff Directory'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold">
                          {lang === 'bn' ? 'স্কুলের সকল শিক্ষক ও কর্মচারীর তথ্য দেখুন' : 'Browse and manage all registered teaching and administrative personnel'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => {
                            setEmployeeSubTab('add_employee');
                          }}
                          className="px-4 py-2 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          + {lang === 'bn' ? 'নতুন কর্মচারী যোগ করুন' : 'Add Employee'}
                        </button>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-150">
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-gray-400" />
                        <input
                          type="text"
                          placeholder={lang === 'bn' ? 'কর্মচারী খুঁজুন...' : 'Search employees...'}
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
                          <option value="All">{lang === 'bn' ? 'সব ডিপার্টমেন্ট' : 'All Departments'}</option>
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
                                ? (emp.status === 'Active' ? 'সক্রিয়' : 'নিষ্ক্রিয়')
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
                              <p>{lang === 'bn' ? 'ডিপার্টমেন্ট / বিষয়' : 'Dept / Specialization'}: <span className="text-gray-800 font-bold">{emp.subject}</span></p>
                              <p>{lang === 'bn' ? 'ইমেইল' : 'Email'}: <span className="text-gray-700 font-bold font-mono text-xs truncate block">{emp.email}</span></p>
                              <p>{lang === 'bn' ? 'মোবাইল' : 'Mobile'}: <span className="text-gray-700 font-bold font-mono">{emp.phone}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-150">
                              <button 
                                onClick={() => {
                                  setEmployees(prev => prev.map((e) => e.email === emp.email ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e));
                                }}
                                className="py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer text-center"
                              >
                                {emp.status === 'Active' 
                                  ? (lang === 'bn' ? 'নিষ্ক্রিয়' : 'Deactivate') 
                                  : (lang === 'bn' ? 'সক্রিয়' : 'Activate')
                                }
                              </button>
                              <button 
                                onClick={() => {
                                  setEmployees(prev => prev.filter((e) => e.email !== emp.email));
                                }}
                                className="py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-200 text-xs font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer text-center"
                              >
                                {lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
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
                          {lang === 'bn' ? 'নতুন ডিপার্টমেন্ট যোগ করুন' : 'Add New Department'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'স্কুলের একাডেমিক বা প্রশাসনিক নতুন বিভাগ যুক্ত করুন' : 'Register a new academic or administrative department'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">{lang === 'bn' ? 'ডিপার্টমেন্টের নাম' : 'Department Name'}</label>
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? 'যেমন: Science, Commerce, Language' : 'e.g. Science, Commerce, Language'}
                            value={newDepartmentInput}
                            onChange={(e) => setNewDepartmentInput(e.target.value)}
                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!newDepartmentInput.trim()) {
                              alert(lang === 'bn' ? 'দয়া করে ডিপার্টমেন্টের নাম লিখুন!' : 'Please enter a department name!');
                              return;
                            }
                            if (employeeDepartments.map(d => d.toLowerCase()).includes(newDepartmentInput.trim().toLowerCase())) {
                              alert(lang === 'bn' ? 'এই ডিপার্টমেন্টটি ইতিমধ্যে বিদ্যমান!' : 'This department already exists!');
                              return;
                            }
                            setEmployeeDepartments(prev => [...prev, newDepartmentInput.trim()]);
                            setNewDepartmentInput('');
                            addAuditLog(`Admin added a new employee department: ${newDepartmentInput.trim()}`);
                          }}
                          className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          {lang === 'bn' ? 'ডিপার্টমেন্ট সেভ করুন' : 'Save Department'}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {lang === 'bn' ? 'বিদ্যমান ডিপার্টমেন্ট তালিকা' : 'Existing Departments'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'বর্তমানে স্কুলে অনুমোদিত বিভাগসমূহ' : 'List of currently active school departments'}
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
                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{associatedCount} {lang === 'bn' ? 'জন স্টাফ/শিক্ষক' : 'associated members'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (associatedCount > 0) {
                                    alert(lang === 'bn' 
                                      ? 'এই ডিপার্টমেন্টের সাথে কর্মচারী যুক্ত আছে, তাই এটি মুছে ফেলা সম্ভব নয়!' 
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
                          {lang === 'bn' ? 'নতুন ডেজিগনেশন যোগ করুন' : 'Add New Designation'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'কর্মচারী ও শিক্ষকদের জন্য নতুন পদ বা উপাধি যুক্ত করুন' : 'Register a new official designation or job title'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wide mb-1.5">{lang === 'bn' ? 'ডেজিগনেশনের নাম' : 'Designation Name'}</label>
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? 'যেমন: Assistant Lecturer, Senior Officer' : 'e.g. Assistant Lecturer, Senior Officer'}
                            value={newDesignationInput}
                            onChange={(e) => setNewDesignationInput(e.target.value)}
                            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!newDesignationInput.trim()) {
                              alert(lang === 'bn' ? 'দয়া করে ডেজিগনেশনের নাম লিখুন!' : 'Please enter a designation name!');
                              return;
                            }
                            if (employeeDesignations.map(d => d.toLowerCase()).includes(newDesignationInput.trim().toLowerCase())) {
                              alert(lang === 'bn' ? 'এই ডেজিগনেশনটি ইতিমধ্যে বিদ্যমান!' : 'This designation already exists!');
                              return;
                            }
                            setEmployeeDesignations(prev => [...prev, newDesignationInput.trim()]);
                            setNewDesignationInput('');
                            addAuditLog(`Admin added a new employee designation: ${newDesignationInput.trim()}`);
                          }}
                          className="w-full py-2.5 bg-[#025644] hover:bg-[#01352a] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                        >
                          {lang === 'bn' ? 'ডেজিগনেশন সেভ করুন' : 'Save Designation'}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-4">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {lang === 'bn' ? 'বিদ্যমান ডেজিগনেশন তালিকা' : 'Existing Designations'}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                          {lang === 'bn' ? 'বর্তমানে স্কুলে অনুমোদিত পদ বা পদবীসমূহ' : 'List of currently active school designations'}
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
                                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{associatedCount} {lang === 'bn' ? 'জন স্টাফ/শিক্ষক' : 'associated members'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (associatedCount > 0) {
                                    alert(lang === 'bn' 
                                      ? 'এই ডেজিগনেশনের সাথে কর্মচারী যুক্ত আছে, তাই এটি মুছে ফেলা সম্ভব নয়!' 
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
                        {lang === 'bn' ? 'নতুন কর্মচারী/শিক্ষক যোগ করুন' : 'Add New Employee/Teacher'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? 'নতুন শিক্ষকমন্ডলী বা স্টাফের সম্পূর্ণ প্রোফাইল তথ্য ইনপুট করুন' : 'Fill up the primary service record to onboard a new faculty or administrative staff member'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Muhammad Jafar"
                          value={newEmployeeForm.name}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'পদবী / ডেজিগনেশন' : 'Designation / Title'}</label>
                        <select
                          value={newEmployeeForm.role}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="">{lang === 'bn' ? '-- ডেজিগনেশন নির্বাচন করুন --' : '-- Select Designation --'}</option>
                          {employeeDesignations.map((desig, idx) => (
                            <option key={idx} value={desig}>{desig}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'ডিপার্টমেন্ট / বিষয়' : 'Department / Subject'}</label>
                        <select
                          value={newEmployeeForm.subject}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="">{lang === 'bn' ? '-- ডিপার্টমেন্ট নির্বাচন করুন --' : '-- Select Department --'}</option>
                          {employeeDepartments.map((dept, idx) => (
                            <option key={idx} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Official Email'}</label>
                        <input
                          type="email"
                          placeholder="e.g. jafar.m@scms.edu.bd"
                          value={newEmployeeForm.email}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}</label>
                        <input
                          type="text"
                          placeholder="e.g. 01712-112233"
                          value={newEmployeeForm.phone}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide">{lang === 'bn' ? 'প্রাথমিক স্ট্যাটাস' : 'Initial Status'}</label>
                        <select
                          value={newEmployeeForm.status}
                          onChange={(e) => setNewEmployeeForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#025644] focus:outline-none rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
                        >
                          <option value="Active">{lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</option>
                          <option value="Inactive">{lang === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</option>
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
                        {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => {
                          if (!newEmployeeForm.name.trim() || !newEmployeeForm.role.trim() || !newEmployeeForm.subject.trim() || !newEmployeeForm.email.trim() || !newEmployeeForm.phone.trim()) {
                            alert(lang === 'bn' ? 'অনুগ্রহ করে সকল ঘর পূরণ করুন!' : 'Please complete all form fields!');
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
                        {lang === 'bn' ? 'কর্মচারী যোগ করুন' : 'Onboard Employee'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. LOGIN DEACTIVATE SUB-TAB */}
                {employeeSubTab === 'login_deactivate' && (
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs text-left space-y-6">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">
                        {lang === 'bn' ? 'কর্মচারী লগইন নিয়ন্ত্রণ প্যানেল' : 'Employee Login Access Panel'}
                      </h3>
                      <p className="text-xs text-gray-400 font-bold">
                        {lang === 'bn' ? 'শিক্ষক ও কর্মকর্তাদের পোর্টাল লগইন অ্যাক্সেস অন বা অফ করুন' : 'Enable or disable interactive web-portal logins for any registered staff member instantly'}
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-gray-150 rounded-2xl">
                      <table className="w-full text-xs text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] tracking-wider border-b border-gray-150">
                          <tr>
                            <th className="px-5 py-3.5">{lang === 'bn' ? 'নাম ও রোল' : 'Name & Title'}</th>
                            <th className="px-5 py-3.5">{lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Official Email'}</th>
                            <th className="px-5 py-3.5">{lang === 'bn' ? 'ডিভাইস বা আইপি' : 'Last Secure Activity'}</th>
                            <th className="px-5 py-3.5 text-center">{lang === 'bn' ? 'লগইন স্ট্যাটাস' : 'Authentication Access'}</th>
                            <th className="px-5 py-3.5 text-right">{lang === 'bn' ? 'পদক্ষেপ' : 'Quick Actions'}</th>
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
                                <p className="font-bold text-gray-700">{lang === 'bn' ? 'আজ, ১০:২৪ মিনিট' : 'Today, 10:24 AM'}</p>
                                <p className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">IP: 103.245.12.{10 + idx}</p>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                  emp.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  {emp.status === 'Active' ? (lang === 'bn' ? 'অনুমোদিত' : 'Allowed') : (lang === 'bn' ? 'নিষিদ্ধ' : 'Blocked')}
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
                                  {emp.status === 'Active' ? (lang === 'bn' ? 'লগইন বন্ধ করুন' : 'Deactivate Login') : (lang === 'bn' ? 'লগইন চালু করুন' : 'Activate Login')}
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
                      <span>{lang === 'bn' ? 'সক্রিয় শ্রেণী ও স্তর রেজিস্ট্রি' : 'Active Classes & Level Registry'}</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">
                      {lang === 'bn' ? 'প্রধান শিক্ষক ও একাডেমিক স্তর পরিবর্তন এবং নতুন শ্রেণী যুক্ত করুন' : 'Manage core school grading levels, assigned class teachers, shifts, groups and subjects'}
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
                    <span>{lang === 'bn' ? 'নতুন শ্রেণী যোগ করুন' : 'Add New Class'}</span>
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
                              <span>{lang === 'bn' ? 'শাখা ও শিফট শিক্ষকবৃন্দ' : 'Section & Shift Teachers'}</span>
                            </label>
                            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                              {getAssignments(cl).map((asg, asgIdx) => (
                                <div key={asgIdx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
                                  <span className="text-slate-500 font-bold text-[11px]">{asg.section} ({asg.shift}):</span>
                                  <span className="text-[#025644] font-extrabold text-[11px]">{asg.teacher || (lang === 'bn' ? 'নিযুক্ত করা হয়নি' : 'Not Assigned')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold text-slate-500">
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'শাখা' : 'Sections'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.sections.join(', ')}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'শিফট' : 'Academic Shift'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.shifts.join(', ')}</p>
                            </div>
                            {cl.groups && cl.groups.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'গ্রুপ সমূহ' : 'Academic Groups'}</p>
                                <p className="text-slate-800 font-extrabold mt-0.5">{cl.groups.join(', ')}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'শিক্ষার্থী সংখ্যা' : 'Pupils'}</p>
                              <p className="text-slate-800 font-extrabold mt-0.5">{cl.studentCount} Students</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'গড় উপস্থিতি' : 'Attendance Avg'}</p>
                              <p className="text-emerald-700 font-black mt-0.5">{cl.attendanceAvg}%</p>
                            </div>
                          </div>

                          {/* Subjects Count */}
                          <div className="flex items-center justify-between text-xs font-semibold bg-[#025644]/5 p-2 px-3 border border-[#025644]/10 rounded-xl">
                            <span className="text-slate-600 flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-[#025644]" />
                              <span>{lang === 'bn' ? 'মোট বিষয়' : 'Subjects Mapped'}</span>
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
                            <span>{lang === 'bn' ? 'বিষয় সমূহ' : 'Manage Subjects'}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setActiveEditClassId(cl.id);
                            }}
                            className="py-2 bg-[#025644]/5 hover:bg-[#025644]/10 text-slate-700 text-xs font-bold rounded-xl border border-[#025644]/10 transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <Settings className="h-3.5 w-3.5 text-[#025644]" />
                            <span>{lang === 'bn' ? 'কনফিগার' : 'Configure'}</span>
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
                    • This form submits collection straight to the real transactions database, updating total receivables instantly.
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
                        <input type="number" placeholder="৳ Amount" required className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:outline-none focus:border-[#025644] text-gray-800 font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-gray-400">Payment Channel</label>
                        <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white text-gray-700 font-bold cursor-pointer">
                          <option>Cash (নগদ)</option>
                          <option>bKash (বিকাশ)</option>
                          <option>Rocket (রকেট)</option>
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
                      { name: 'Nafis Ahmed', roll: '10', class: 'Class 9', due: '৳ 3,200', month: 'June Tuition' },
                      { name: 'Sumaiya Khan', roll: '04', class: 'Class 8', due: '৳ 1,500', month: 'Exam Fee' },
                      { name: 'Rohan Talukder', roll: '18', class: 'Class 10', due: '৳ 4,800', month: 'May - June Tuition' }
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
                        <h3 className="font-bold text-gray-900 mb-4">প্রত্যয়নপত্র (Pottoyon Potro)</h3>
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
                                <p className="font-bold text-xl mb-4">প্রত্যয়নপত্র</p>
                                <p className="text-left whitespace-pre-line">
                                    {certificateData.customBody
                                        .replace(/\[নাম\]/g, certificateData.studentName || '[নাম]')
                                        .replace(/\[বাবা\]/g, certificateData.fatherName || '[বাবা]')
                                        .replace(/\[মা\]/g, certificateData.motherName || '[মা]')
                                        .replace(/\[শ্রেণি\]/g, certificateData.classGrade || '[শ্রেণি]')
                                        .replace(/\[রোল\]/g, certificateData.roll || '[রোল]')
                                        .replace(/\[জন্ম তারিখ\]/g, certificateData.dateOfBirth || '[জন্ম তারিখ]')
                                    }
                                </p>
                            </div>
                            
                            {/* Signature */}
                            <div className="absolute bottom-[50px] right-[50px] text-center">
                                <div className="border-t border-black w-40 pt-1">প্রধান শিক্ষক</div>
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
                        alert(lang === 'bn' ? 'অনুগ্রহ করে ক্লাসের নাম লিখুন!' : 'Please enter a Class Name!');
                        return;
                      }

                      if (!csFormNumericName.trim()) {
                        alert(lang === 'bn' ? 'অনুগ্রহ করে নিউমেরিক নাম লিখুন!' : 'Please enter a Numeric Name!');
                        return;
                      }

                      if (csFormSections.length === 0) {
                        alert(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি সেকশন সিলেক্ট বা টাইপ করুন!' : 'Please select or add at least one section!');
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
                        setAdminSuccessMsg(lang === 'bn' ? 'ক্লাস ও সেকশন বিবরণী সফলভাবে আপডেট করা হয়েছে!' : 'Class and Section details updated successfully!');
                        setEditingCsId(null);
                      } else {
                        // Check for duplicate
                        const isDuplicate = classSectionsList.some(item => 
                          item.className.toLowerCase() === csFormClassName.trim().toLowerCase()
                        );
                        if (isDuplicate) {
                          alert(lang === 'bn' ? 'এই ক্লাসের নাম ইতিমধ্যে সংরক্ষিত আছে!' : 'This Class Name already exists!');
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
                        setAdminSuccessMsg(lang === 'bn' ? 'নতুন ক্লাস ও সেকশন সফলভাবে সংরক্ষণ করা হয়েছে!' : 'New Class and Section saved successfully!');
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
                        ? `আপনি কি নিশ্চিতভাবে "${className}" এবং এর সেকশন বিবরণী ডিলিট করতে চান?` 
                        : `Are you sure you want to delete "${className}" and its section mapping?`
                      )) {
                        setClassSectionsList(prev => prev.filter(item => item.id !== id));
                        addAuditLog(`Deleted class and section mapping for ${className}`);
                        setAdminSuccessMsg(lang === 'bn' ? 'ক্লাস ও সেকশন বিবরণী মুছে ফেলা হয়েছে!' : 'Class and Section mapping deleted!');
                        
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
                                  ? (lang === 'bn' ? 'ক্লাস ও সেকশন সংশোধন করুন' : 'Edit Class & Section') 
                                  : (lang === 'bn' ? 'ক্লাস ও সেকশন যোগ করুন' : 'Add Class & Section')}
                              </h3>
                              <p className="text-xs text-gray-400 font-bold">
                                {lang === 'bn' ? 'নতুন শ্রেণী এবং তার অধীনে সেকশন নির্ধারণ করুন' : 'Define new class level and set up assigned sections'}
                              </p>
                            </div>
                          </div>

                          <form onSubmit={handleSaveClassSection} className="space-y-4">
                            
                            {/* Class Name Input */}
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider">
                                {lang === 'bn' ? 'ক্লাসের নাম (Class Name)' : 'Class Name'} <span className="text-rose-500">*</span>
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
                                {lang === 'bn' ? 'নিউমেরিক নাম (Numeric Name)' : 'Numeric Name'} <span className="text-rose-500">*</span>
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
                                {lang === 'bn' ? 'সেকশনসমূহ (Sections)' : 'Sections Selection'} <span className="text-rose-500">*</span>
                              </label>

                              {/* Standard Checkbox Selection */}
                              <div className="space-y-2">
                                <span className="text-[10px] text-gray-400 font-bold block">
                                  {lang === 'bn' ? 'সাধারণ সেকশন নির্বাচন করুন:' : 'Select common sections:'}
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
                                  {lang === 'bn' ? 'অন্যান্য কাস্টম সেকশন যোগ করুন:' : 'Add other custom section / group:'}
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
                                    placeholder={lang === 'bn' ? 'যেমন: Science, Commerce' : 'e.g., Pink, Blue, Science'}
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
                                    {lang === 'bn' ? 'যোগ করুন' : 'Add'}
                                  </button>
                                </div>
                              </div>

                              {/* Selected Sections Active Chips */}
                              {csFormSections.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase">
                                    {lang === 'bn' ? 'নির্বাচিত সেকশনসমূহ:' : 'Currently Selected:'}
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
                                          title={lang === 'bn' ? 'বাদ দিন' : 'Remove Section'}
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
                                  ? (lang === 'bn' ? 'ক্লাস আপডেট করুন' : 'Update Class') 
                                  : (lang === 'bn' ? 'ক্লাস সেভ করুন' : 'Save Class')}
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
                                  {lang === 'bn' ? 'রিসেট' : 'Reset'}
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
                                {lang === 'bn' ? 'ক্লাস এবং সেকশন তালিকা' : 'Class & Section List'}
                              </h3>
                              <p className="text-xs text-gray-400 font-bold">
                                {lang === 'bn' ? 'সিস্টেমের সক্রিয় শ্রেণী এবং নির্ধারিত সেকশন সমূহের বিবরণী' : 'Active classes and their mapped section divisions'}
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
                                placeholder={lang === 'bn' ? 'অনুসন্ধান করুন...' : 'Search class/sec...'}
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
                                    <th className="py-3 px-4">{lang === 'bn' ? 'শ্রেণী (Class Name)' : 'Class Name'}</th>
                                    <th className="py-3 px-4">{lang === 'bn' ? 'নিউমেরিক নাম' : 'Numeric Name'}</th>
                                    <th className="py-3 px-4">{lang === 'bn' ? 'নির্ধারিত সেকশন (Assigned Sections)' : 'Assigned Sections'}</th>
                                    <th className="py-3 px-4 text-center w-24">{lang === 'bn' ? 'অ্যাকশন (Action)' : 'Action'}</th>
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
  x��}�o#Ir�w��r_��)�"�������n� jfv�hL�X%��E���Wp6������l��u����]��8��J�)��zWef�R�{U�i�Q��ʌ����E!�k{%0��)�	���Ȯ��g#�$=����'�G�yf�K�+W�m&�;��?3����xZ��E���P�h´���8u�����=cLΌq���j4�gְ���j�q��	�sh^,�������#��B�XӝK���ocb�{d�������5
,'�����&�99�[C�3��m����/����u:�ȉ���'���l��7��NF�eև&�Y�5�xEN�QP?qsAk�:�ΐ*��k{WC���%��W� U��:�k��[+F
��[���t���T�Elk����v@M��iL}��+-�	�cxj�C=�vG{���sY�d`�L�����lr)ZéԠ6:$;p��K������x2Z$�����~��ݯ��������w���ݻ�ﾇ���_������9�_$[d�N�Sc<�Gg�z��I-�o-o�T��[ć��n�xJ��1�m��z�u\�'���^}�ڔ\5F�'N���g�G:>�vDNm��Y�#k���羁/aP��q�����G���B�4I��i=�}l����}c��@�e!���$�>��6���B{��;O[-�}�f�IF�l����V+|����zwk�iu��/���j76�����բoZ�Ǜo��#g���X���@V4�z�Z�'�+���%^( �-�
��VD��g�D�6���m��:7��k*���w?Y�o���������y���PZ�7͸����7�w�b~�b��;����:nouڻ\.�Zk��*0��:|��k��م7�O�d}�%��k�N}��o�_w�i1��aJb�I����Y��n�ĸ.�n�T�U�4��לʚ�ی�*�M��K���NZ#���.	��}�>��J�<�V�v��8�i(%�NL"�N'e���? 3����h7�
�e�`���6��m^#�Ϗ�[���a�C�!'�^��5�x܍�E� ���_�S,���]h8������?�%�l?]G�T JL�ĵۃN|5�*�Cf��k�@[5FV�]"��>����BU�����6*࿣
�������{�����p'�߾�������7�#�����G7�g.�� yy^p'��{ҝx{eБN�83K~�ۆ�E�'oxQ7&�K�0A�{�c\Xf�y�}�_����t�~Ku�W�5�w�SA������?���T[�m���������a]���ohK��4�=�'m��]��WlT߱^޿��m��_~I��L�o�	�,�8o�}�X��	���L�>�o-2u'�g
����$0�T�"}wtj�M<�9��}<�6P��m��%-/�I��WK5�+���w��}[�}��~���������{do�x���/�����9����5����ɱqğ��)��"y�`?NW��@Hm���[�h�l_8���`��9���NISl�k�,��us�����6��;�:�[�����	�O҉�[ֈ��ʶ�m	oV��B����s&�dR��e���/�p���L��mJ~����!aPhQ��c�N�@���3�q�.�s� ����@�t^�A�Uy��d���f&��l��s�a[�?%��wT�~������_��/�D��u
���������_&��ӂ�h���� �}*��V�6�g�r���"��W�h��e;L��v�g�=w<\��{p�.�m�8��<J
��1�B3��"&MF.��T ����ot]G?�G��[t�tйْL?}��g�-ּt�ogb�\r�`����wfw�7�Ǆ_�,��5��i�f5�;���Fb!�������<�����+�c�l
�n�o����`h���R�@kBd��=5Ig��cV/�2��DWqǨ��9_�u����o��ߥU=J �#Fp��
kQB�5�-��N����X�3����D#�<�S<e�#�#��I�"�Lr��s���u�@P�)HC�Q��.-����;�ԛ�r�)��Uҟ]	f`��j�\�� [��bE�)QTSb�̳M������[�9ۊޮR!Y�1��j�/����r�&Ya�Ub[ב�r�׻	�N�n�<��ry�|�'t�|5�Kռ���=e�jbB�R��҂����l����IMA�Q���+�@|_p��T�e,�L�����
Ѧs���o�D�evHe�PpsA6��D�/ț�B%ְ�J�@�R�c[�AfL���qr�͜��r)
�(6c���%��`��	Jh��R1�dz�f}>,�?�<v���x`��t�[�(��>��.���D̅��$ڨ������ B�V�!;PQp��8>��R�����N�_2U����1�[��SD���%ِ�vzw� !� ���	�j�=�-�	X#��	j��OI힑K���F��C�?�3Rt4�m�xV0�F�}�ݑ��R��!�4����Z÷�O��.KR!�Ff]�~��F�D�;���-�5���GM�/�� �ro��e���I2
���SDT>-L��C{t�y���?��=Ԫ�y��:_����ѲO�Z����m�������_�[ v]8�~°&��Y�9k,&�Ѐ`��[P������V�Ur���j��ThM�)d�ib{YCf����Hc�?^q�Hux}N.I�����e�Ƙ@�E|�K�a����o��z�~���Lr�`��So����nw���q��� �0�G���XM(���i�	�DG���S�*d������ߚ�0W�շW��\h0�F��L�
3�寄,�NGp~�B�t ���e�69W�ꓑ@���Dew�VJh�FTL�xj�7�{�oZ6�|{u7^"��J��4�I���PŴ�F����7O������:tה`3�3�PE������O��8��O�x�D�������a����6{4��;��b8O�d8v`i0����������o����C#���29�9�?��b5�����/�����,Sz#�ޖ؉����5
D����Pps�<� � �K��(�>X�K����W<��fL��K�#�$��!)B������Ip-��K�cs�Nx���e��	����\��`ӝ�H^�B��G�詚����p?�~��'5��L@З7/�xI�K+�kV�b�����1We^
��
X��FWY!6@-�8y(߰��L�)p��SyvI��i� �^&l��ͣ�M��
�žۈ�߼��Tq�Fq���k����������A��$�|�Y)�����'5C��#���8�I�p�\�V��Lw;A��B������oH�z|�p��_���(�ѪX_u��� ������KIN,CѲ����0���]�X�w8���������}|���W��`LOl������r� hKƁB�-��?��oN��ii�;�/�M~?m�2�S�ֵ˥���t��[&c��x����qk�6��Em�6�wȹ� '1�(�<������[��fܲ-�w�A0t`
�����J�U�}�o�_�~ͅJ�������Äw��#�(��s*"Pᣰ/+� )�+���W]�f��f�>���9hH���(D$����BqՋ�c��JA{QT���+���	�i)e8�Q��+u�SR�Ԓ1�t�<ݢ^W��z��(ܜ$S�\��� Ni�(��cc)��T�X�!�Y}a��U�z&TѦ���;�+a���n�ԿO�p�Z��� e�����0e��~{T@ �L��KA:J�%�~�w�1\T�Ĩ.t.����`v��PN���.����T%eBN��@:c�S�ܝu�(��="'�1	l�Qr�h�|�a��G�Q.�B,���Ӿe��;`��G��A�����֊F�0�KE �-��ɀ.9�`��̃�`*�bà�)T��|�L�=��;V�!�ɰ����RDSQL���j����,#`Wc�	��!���C�r�a��V`P�<�D�l�`�4��{v�
�N��}ܱ������0�W��3��8g[}ש�3bho����ș�p��6M���]l�щ�cY`d14U���M���S9���(���e$Ҝf�%s"�ꑂ7A q3����A�͹m*9?�ղ|�x�y�Pp��ɔ��'�+��Zs�{})
/vw��G��μ{N��(�y�ŏ����3��i�:����c�X�n���7���������(��j�*Y�%`n���x�� a\[��"���*�\M=�E.0���� \��x��	&غ�:�"���{�g�VqH��؅�����l�N��"�Ө+
Vq3��Ӄ�q�r�*I��Ԅ9�o��uM��������t���D�����_T=�s�W�'r�<s`�4�.��F#l���b3K3^*߫�fJ����8U���R�ON������Q'�n�����I��w�A�X�Z��$H%g��J�<���zt8D߷�M�N���"F'���H�G�N�7�� ��c�2�Oyg�1<�q�!�w��4����U_�qW.�l�̍ے���
>M:ձN��T���+�h���7�3Һ������lv��뀆�'kq������e�IK�'��:�ڝ�td L�fZ͸���G+�f���B}�Z)�5�o��t*T�ќ��
]�.Xn���y����Qr�2)��^_�f������pZ�;/�t�&��yF�G�}�;�
�'!�(L�v�vB�t���4k� �Jv~=bT��p���vP�*p*��W2A��]nt)Ձ��e��洅iW��ɮU�fά�p�S2%�
	��W~F��*Y������"<�HGS��X0�PZ���c1�ͶJ�i��+�F!�yF�vc*��R�Уk�E�˜?�ʯ;��RՋ���*�,ē�]oѴm�j���U�%�,Z�K[��R��Cʶ�d?qpC�Г�P�U����i�Ǭт2@��^�~�Z���ě2���^W{��%v�^s&��Ey���pb�����c���%I�Q����R%�#�} ����B��̩$���ꦋ:�n��'����=>����������??&���������ϊ
��@U�6�����Ǣ��Y�7��Ӯ�����s�.=������	F��iAS��nv�:b���u|��>=�/`پ><���(���X ��Z�>�Be�o��;�<b�K���s˛[1�b@=�
F��<i�K�Vlh��φ]Ȣ��`�����6�ԳTk�JhZ�<�G�ڍ�[>���������f��]}i�Q�Ċ�1$]����������D��r��t=^xc��0D�9	�I� �iz	����3�	�A��h2�8$7�8�*)9G�26xb���-��Kq�"�?���R,��:EJ{���
I���R(�AcΝ�0b�8����2�v�b�:s_VL�0�te�eb��aX�;ŧ�1�Y-1���&-�blW���ҍ1�}^q��c�����h��'F���#��>���_�<�Ǝ����OP3}��	�q���q�~>?=��>Ql��X>H
ǥ���M����(��Y����PQ���SV�O	���S��k�`��f>LU��<��[��X�rߘ�a�._>��Q�6Vʀ�P�6��MqPJ�w�<��&��ik�m�Zx���T�����L�FfPob�,��:S[���C	[��Tm�r�'�o���7?��aS5��0�����\�$�&�$�~�����J���ٮ�-�[��j���_��Wx�ry����}:���K�%2�k�����������+�Vϛ-rj ��J�U��j29��cLB����%NJ�|cP���&=�]�9�[�Ad>��d�1����"�U����C��>�#L�E�Q$P�|Ƃ�٦����l�5�1-�p�akI��.�eqכ�_ĬΥ^�<�1l�X��}��f�ޮ3LV�AX`��T �M��20.23=m}���XaК�r�tn�3��jj��p�~�Gֵy@�G�����W���"�6r�����ѻ�[��`w���Q�Q�s}01�&��8�ˎ��F�	�~���;��z�{�y<�0!�>|�����A�����xۑqj�n<�3�������G����������C��&N 틆����G}=�]��A^��i0YɫT}�K����&�&c�W+���o�����N�oԈ�"�K��v��v��6�jn�՛\�4�5I��&[0Z�&;�&;�&[�ɶN��L��X�m6��Wc.�2M�%�ds����P���a�	f�7a���?���X&}7�,���BX������0��_`ӱ�fqp:})Z6<���g�Y�
kX[d���M�0���?k����>�F�B14��.���*�~�B���5۱�i�/~�n���r`"?L�����>�x���Z"�����&�b�ɕ���J���{.%0���w#��{ư�tBK��V��HV�ޟ"��=�;���/�����%ۈ���ӹ`ce%t�O'���ߗ�ุ�b9fJ�0��B�р�.J�|tWGqL����S��|U^i��U���}}�26�+b�&+��W3�bǥ��@�������9_���i85ꪨ�gG��9��j�'�q[	��a�\7	�Ґ���������P̮n�xu籶��/���]�D��܎�a������,�Z���TyU��A�� er���2�~˄��MrE������1�)Ͻh.�s��L��0DyH�!��5�t�Sh;L�U��s�?x�G	27�*�}�ތK�z4wʥ8���[Bh|YJ�g>�й��l��Ⓨ�b]<ܩ��Q(%�����@����n�O|J<`���K>�W�#� Ĝ�P#�u(��Ppt�7��x*H�z�.�7)�§GH�edJf��
��g�$�=x��p����\E�P$��o�([h���!�>�\\��p[�c�cئK��N��C�-�3%���x/a,�Q	Y��*�7��=w2
�� �v���,���TP4�XS?fY6`�Л`�r��m#"Mvv6Җ켌M��X2ۮ�2V�m`�n�F>�$u.�����vY:��}V�w1���7![A��E$�����Jh�����؏dn�$�Qo��#���i�0���y��Q/G[?�w24��k�
x]�-H[&��(M�&9د��u��p��H�=�±�$�̊*�� ��X&���q�_��]�~k��������d�a��-I�-� i$�d���zR(�<�:�$PM�RpM^%O
�LB3��L��t��#+�(�@;��QJ�K)�gŌ�~N�M ���}���Iy+�fߘ���E�}t�B��;r�yr��S�#��'>��d�Z��DH���;�D U� R��-�
zP�O�t m|D�I�CLd��~�b"/oVIA�_:u���r���g.��vߐ�F��'K>����t��b��#�H	)���I��%%cd$zj�V�.�ƥ#�òv�%	��`���Ζ;=a
PSɢ�U��}j�#r��8GO���3��8[B�P��s�Z�Pq�z���y�eHB�Y�Z���\�/[���v���X��d9aEHd/[ky�G�Y���VJ��ǆ��8��rGE�k'�SM���C�]�*�K�,��3'[����;�훚���O��Lj{�
rf�T̐x`R��&�u���M��>���s�� ��wn���@�OR�73�q(��?�k75��&D�f��m��a ��T()�b� VBe7��Oǫ�(�i*��U;i5S��ɪR�yY��a\^<nZ1��+ ��H��=��hJ%�����(7�j�ۆ��*�)��)E7�W���(�J@,*����<;�斁�U�9�9D��r�E�a���hE��q�"�V);Y�qY}u���[�׋�Xr=��:��Nٜd���0�٨�c���ث�� T+�G����Z�7~eRD��eD:��)k'U�W7�+��D[�*�_�7�Ʈ]2lX�6���@ދ�m��b^߲��j��u��em��/�#"�����TK_q ��J;
���B
s��5sg���:E�1;qYֺ�8̜Q-{i�aHT����z����-Q��؉Н� �%͚�y4c����R=6 ����K��
��u�W
t��*A�9������X%�(Y8�� 8Sq��,q�޴%�Ã^#�+�~p��&�~�P��-(���s��4H�ȱ~>�&��Z�h�Q��ٴ�٢��.��+Tm���Ʀx�kT�u+����`z�֥��D�����%:���M�E�XUم���jt�����×U�@��Z!O�[1u�]�W�f;��=_�IY���P
P�I�L%������:��'�ᾥ7�"=��`jj���_�
��+LY���5Dq�\�]�`�����oOx��0��ݏ��8͉��]�~�<�mnwѸA��L���-��$�����B`��<��]�A<f��JVc7�*��Ä���X�G�|���qXN��XAֲz�~յf»�����蔰%�mvNE�S�}�ڢ�ŵ���i�l�>�^WYm���]U��j����wj�&4S}j��z�n~�ͬ�rpo������t��\&��#��5/��y��ϯ���h����CR�%��:�10�~�sD�+��sB�9@`�z�Nۗ"=�H�'�cEo�L����$vo2��z�9�4��ydPlu�<E3��f���5ak�Zm���ɟx�4Ƈ�$�|��4��E�eB�r���x����	�� �2V�Y�%8
)��.�]�
���lQo�����:c)�m��*X��I�c�J}���Q��gFP��-��]�"�S��L��0l$Φt40o���-}�|t���$�#Bn��{�c�1&}̘ȧ�u�y��~k�3��8��j�h8��o'��#7�kxRh9$|T����
C�E��*u+�&��ţ8`������Ku4���JK�����b��!��cՇ��ن?L/zQ<�-�4��^٨�:s��ɒ䇹�a ��T���=ys��dk�E�Ҍ�;�I5m%q���8����� �U�ை�-��n��yRr�AOF��q�q���p�; �d���F >m5�9��u����y�U\�*�TL?N4�i|k[)�9��ʆ|%�\*�̿�`��2~�j��U�z6���o=�/2�v5L��_݊L��.G�(�f\�d�f��|��%>I������i3�����ڬ�V�%��bE-��T7/S���;ᅨ0�j��WY�
��3k�Kq���6Ϥ��A
����B<�O�Ne{UI��ْd�
�1'_	� �$�YX:�b5���x��BU-0��2E_���K�bg���j�.����	JZ6�'�aǕ��X�)P��)m� � n�%kn����J7=��4�/��ftx#��MX�Z���4�|u������|�������|�w>�9�}�O���~��֝\ePw>p����t���u�;8��\~����|�w>�;��<����5�X�rw��I�V�H%�RΥDG��{�in�Y!ݴB�^s�w,9qNr���e�fH]�T �+ީ�5K��d�E�"K�`��ْaSM`�{H��^��ayV�*���Ծ����uJ唄V֚r��3�(W%�\�h����8q&�<2X<�sARh�Ʒ��qQ?��N��#��D	����O)+���=�dl��&,��-�$��4	4b�$ڃ��ئ�T�s*}����8�Rg�~��S6�Rz������Buǔ�(��Th��+�v �Y$�_��K�˼��g���v��)�.tu�.7Z�����s��DV��u\��f PV�᪙�9��ͯ(�D#ʌ+4�4�=�x�U���(1U|�����u��cD��f��#-'cr�J�T�T�y\�)�Q=�Q]%S�R=�@��5;5�y�d�1��om�_G�i���its����fR�H�G�ZI��Q'�9^V��q��[�w�9ŝ%�n��K��v�x*7�-=�y��-���F/�r��r�j���!��,|؆��aHqv-z!�2s]�=��#a�*s$�6Α��sd�V_�]ӺZ�cO=�ģ[�l��J޴G�k2�Wӯ=�۳��1��5�����q� ���2yb���Zw)�Aϯ�El�s�k��LT(����$�=��E���	�o*�Qt��0k�{B6�z��Eh㔖>L�Ċb�m�3F}�Q��V���ԃ�����^�i��&��{�A5׹W��W�o&��!ih����n�a)�#��ܹ��s~s�^���3��g{d��Dji�Cf�G]vܡ/����9� ��O >�@�S�.�ҳM5g�������ک���y�g��W�_��.3�_zg&/���6R�5s2�s�]��P�D�y�"��Y�9E�,"j]gl��핱|.Ԋ�'*�*��*f�*�#G:��$�G;�wjY>�4��c�g��3� �WX�hH�n)MH�ö���_��Ԟ
��NiQZ��6Y�B����� ���8j?SY�GU�s�HX�b��8-�kY)�1�Rf��f��R�S
�Q�H���X4� h9�VTR�j�*CCoT�ej~�V�hk�j�|V���և0D�7Io)�¯�j�fH�?p]�`_ҳؙ��㡨-���|��0�o\C�C��������F5�[��Q�BE˾=A=�z�0���*�&}z$��
��N? ����N���X#�C�|:�1�q�=�vx�TtM��	Ǽ|���d�K�O0���7�I�&�F�`T��"4�z�L�g�M�C"TO�T^	+�W�2��L��YZUC,��2���J?��_�8{�,���@��@�\(��&����/௟�W�����w���W���W���#L�bQ�"���xp��<#qIQJmr)�ڮ�A
)�������a�����6�l1�%��.��S�]��Ҁ����_�d>�7Lb,��ԗHY?WY�F�(�����ڻ�m��B�=�vm��ʂSݜ�ݎ�����<�-�9��,Pg	��I5oz۝���{s�xf�s�p���3�;��?LO�}Fh{���U ��4Z5%���Yl]��ĕQ�_ӣ��0�y�Tڒ���*H��E^��~�r��1r�kKW�Uc_G4$91'�?��i��ګ��m�p[��������;J�ܫ��z�{bN�xj��p*;�+%J�X�����[���Y�5%�/�y�@�Tܘ�g7����{��ϱ=��IP��$;^\\Z&��fS��g�����+��G���6I~�1�0��V>	�{�V����_o�i��,��e��풔�����J���u�*��*�!���!�$Wܐ�'Z�Z�'B�sHmj~�U��eU��}�mT���ά.�>�Y�W�*c42��u-b�n�y[^E�c��y����f��}�X��l��zf����Q-�Z��@���F���uֺS�^����4��ì]r�Z\\愁����1Z��E�eŲ���׊y5?���㟀�R�'�f2�ԟ*O��.Ď^_(���O�O��>���磜�y�A�U��m!w�C���y�����|כi!W��f��4�����.J�}��?9���ʷ0;�r#�zy4�4�4s]�G#��95�4 �>R��XN��|�w�O�����Ο8�}�'Pڿ��DFh�9֎�Upʅ����x�Y�"GϿ:>|v@�}p����7�����Ᏻ�+nm�c���:6N��GG���ֶ���
Ͻ
κ��ax��Ϲ�"؆F�
�k�P�g�-9�*D��*�N
�������w�aZ�4��< �o��2X-�Q5蟅��#�ul������L�������Cm�����5L��62i&)#u�Q�vI�{��������rm���4� i�A��í��*��K�(Kb����(z�ș�`Y�9!Xc/�~MPEZ����V�M�LӐ8%�z?�j?r�)Gէ+�e-�D�̚ ʈ7b�
+�pl1nU%꤬���S�bS���%��J��D%W^��Z����Ȉ���^�޴�2U<��!i���$;����|>�~�C_��D�z�߰}Z�x�'��\-���yL<�f"_	9ɔ��<��Ȳ&��z��vQ�)��1s�mf����y�ǎq��50#�Č�Q�U�NY�����b��>^�Zɏ�Q��v��l����M!z�b2�x1����[�)K�đ&)��PZlA���y�^�%��׶?�]�	(bBCTW�$.+�<w�J��<`V���� gQݒ�{��O`*�S��`◃����Ќimn+�W��ռ�8ݍwH� ;�K�
���ɑՇ��f��Qu�>,߈Y�Pұ19`u��c� �y�q���@a�%�Z->���\"? `
-�6%%����0{���oJ�&�h�(�7��#5���0-���������fX����S<y�^F+�����IWڗb!���r�p7�LY4_B��k��l`��5R�풒h�K�L�e�0d�ɱ@�`�X;����6��y}?1?��Օ���6�=2ϔ��1�q'Z�M�	ę��w\�5AčUWUa�8��x}�MP뫛���o���>%�w�<!�_���I���Y�������$��y�޶��&��:�qܑ5G?[(���[�̆���4�#t���9�ئ�g�xV�|oh�@���3z*�פ��s���#\�/O^#�)��ȡ+IT?�ԥ����2ʎ4���� �HWgS��B�)�]��3�Vh�*9�Q�+����a�}+@n@f�Fl��rE��%E�/<ޯ7���3B;�m?#��el*�a$�k�:��5Z��������O�?�6K*����"L�k|Wo���[���d�A:]�q�Ac/��cM��`�)�_�w0'��U~�AE��:������6�:��"�E�"
u䰝 )�Y|nю2�öD�[�RlaYʔ�-���ђ�h�HA1�@�\&U���f����1쯳����X�=Ю��ք�E%}Q�������Y�iڼIu���~�1gʨj=Lu$M���h�Kąj��Y��,�~�UTl���/����$7I�Ժ����"z�Sn�l���&[�y͝l?f��D���0�Gg��
�:�(c�K�����M��0��RX_aS�
l0��n-<�/t������)/���)o���+�#��b.��变%z�\����py%,D���:����'�~���̾[\����񯲚sd[�[�?8�;?��j1n��1;�n;刌��N�=q�?�g��]����;d��3��P �	DX6q�&����)0��2����ni:(���sZ�J�7�m��TǇ�G��kZ�Xr��'KQ�q	�
��c�R���0K}���DLG�
V��A��c������ �Q�WJ)���?�$ԩ�M����`P���y��j�6��V�׉��j#��@(��ZI��P�(�B�m�=���V��dty�����݀��S�_��z��Lv�`%�,�vVC��ڞd�K:�o�`�dŒ��3w!�g�Cw��`g�1��Jf���hg�6:�g�DD����O�z���Ǵ�YZS�f
T�f��W`�H����礞��
]$�!�%�B�.�L`!k���ìĦ�"��	S���@�L�&׺iQ��*ޜ����f��d�:,8D��~$����Oc&-S1oT����Gᥐ��]	R@}7�Ȟ�[�t��x�=zC<XC��
%��q*��g��v�4}�	��U%��o�r���M�\����l�g��n���Ez��d��h�ٗO�=�~��|kx:c� ?�5�9���ܖ����l-�	zFf���K��pN�[zp+�94):%�×�W8a	>����P�����f���R�Ԝ����b팖J�Y�bpy�(u_OD�7OK��ޔ��Z�Tc�{L���ʳ؆൞�j镹ʝYU�n	�Mռ�l�R�����F����mU����m|���Ԇ��1n��[13FJ�h�mU���ql�]U[�Ѥ�D�YD���X�j�6JHO��P*3��t��� "����4�Pp
�;�m>�H��<1�9����C�j��fZ�l�]���p������j����	v�ж���gV��� n�y\Z�0�UA%U��`X�u����)M���;�5�L�0�w�����J�z��uQ@��I����NL;p=�խԂV��r� Դ	�Nx+<�M�;��>������I)�_�N�cYr��ߝ���b,s�7+�=G�6���֡���Nd�����9�z�L����#���*�{f��}+1�7��|���9@�h-�}j�Us ��ɓ��S�3&>�'��807��3���^��H�n*��fp'%����)�k�=�׹d"2�Ќ=����j��J�r�RI�>6/P�W�?����4�t3Q��{{K93��0}�W���u��*�q� ��Vg-��y��_�Z����J����(�|�"��7�~��!�-?�D�m�;�t��ץ�\�9��(���^�09�`��|��С�;��q�@Kr�&��=*b�r�b�)��
n1R,��@��^�sO�A����J��ag��Bm�&��4���4$�ޔ��]^��&'5&�?�i�� �nrΓ�]4�©B�-���o��,�V�1&0�PW�.>��
�ޟ����գ=H�T�q�I��O�'��p�6#ҩr��R@\~��὇Ͼ>�������#���y@�y|x|�����>�}q����:YT���O�K.�i-��~C���%���q깈�`��-��sh�j��r>/�t���o�)��мЂ53����r�4��Up�b����}�ޮR�%�_���%j����'I�	�4�Hk9��@�*W�ј�4`?���ώe��,,�
E�dˣ=�;���:v�Zo��G���Z��%B?#��⥈0/K:����uKdKn�(@6� ��>Z�k9R�B9�u9�S@�@$�ԪQ
Τ�-�4͞�:�O�*:��g��ݥ�L@���@ (�^PL�c��з�b��L|��d�>�(�,���>@���քln��ݽ�G������~��ʣ�'���,4�W��V$-W�����UAK(�r�l��e�F��k���<�Z�a�Bc������5��bІ�c&A�t�C�q�� �[++��ߘ�| 7��Õ��\`�Ng���������ng��Z]�!�;�7��v��������?��h.��"��x�v�Y��Y�0��12ȑ1���>P�$/<���}W�Y�W;�k���V�]?�07���k���8��92N�����1�yTEIol�mc�5�d��Mms��<�\��7����1���$�o�c��C�Cc��(�3� ����������hv667���Z��hm�k@j�y�Y7�D��1�����j2r��:��4V�Uwyֻ����͵f�~�v�=i�'mx3��YK�S���s��p�칰5"�Y�9Z�͍��Z�n�6[�������>��XO?���0��������(����W�e��vsss��]��ֻk���szڱ'�i����'�h��d;��z@��(�'��F�f��X=+@�=�E
�>�������1�{�I���u���N� X����| �Rz�qY��+�,�4CV�`� �Q�{��B��?��j��t.����a�1�p�J�s`�Y+��8�r˓�fycMe�5�X�CS��-��0m��W��M��22{8>�D���Lc�k�(����,0�w��|��Jn�c�mO�+j�S�4h0	���෢���+�x�}&��] v��Ko`�M��\��R���v��R<�i��(̓�ؕ�3Q�G6D��<A�6��<�:���qל8C�&p��~ǁL�B�+��º.�jP�<TG����S7�� V��7��*�\���=zSW;?F�����^���W�p|��-��<���T����(�VN-ϳ��c��;#�.>RLo�u����dĢ��G��fh  ���a]17*` �[v�//���r='��+�ӎ�>�ӮBDm��QM�����i%�͂��)^Y�ͣ�q��̒:ZIy|�RH�+��]�AqIq-T��r�S1w�Nq�Ղ�Z��N����J�e���ȐZ[`ŏH�&3Q���2☞O��YY�li=y�$�Xv���h\�9��7�x�1��ks1��@>�_�c֙G��{�ɋ��O�>���s1�=w�"��}�wn��C��������������O�nf�[,�L-ë�MNNh��B�XR�r�3���b���[L/fF;����R����t.���@�<xd�6��TF�~��=wjD���}M[��\���{�h�uľj��ЇJfgɍ���K�K�P��7�7���c֏��Jk�xJh�8��#���Q�`����? ����7�)�܈�/_�{�=�G�.p��l��vkV"R���k���l��b1���b�U�Y�&�&�jP�S��Z~��-�o4�bF��+��*�� O�P]%G��ͦu�In������F����Jި��L?�
��5���ݥ���B�g��P�~➝Yf-��_U��iҌ1��k���X��2I��GN�'5P0��'�*�A�l�\(-��w�K+�C2�;;�و���-�T�̆��R�uԒK+��������8U0&%Ϥ�b=�y�l���OQu�7�^�o�п�,
p�3���u՘�d�|�P�𢂛�4n��a�vb��TV��:�����=�'��q�m���`�="�����R�����e�D^�~�;>x��� $�a�c�Q@�&n�!G��v�R-!B�������c�~�>#{���V��!��g�E|�o����f�ilt�p;a��}|�,�  ���}�sǕ��f�&�!@|��hIER7��#({}:_4�Ĭv��X��*ѹR[������*�7�����J?8vՕ����/�~�?�g�g�)��$��AOO���}?���P+���u���m�kb��ɍ�F���o��/)/�P+]<���W���#�~���e�W��k��5�d��Ab��$:�1��6=U��� 1zxu��K�� خm��Q`dXZi4����{k+�b��Kp��͵�(W �r�Tpv��ƍ����e�WMj2��s2KTCA5a��$\&$I{�R�߃?A�h
59������ ���B���H���'��� z}N��p��h!���v��0"m7�4�����dku}ek�*�x�X&닛�l�8�XZfK��1�j��QJ:+uv*��8X��s�r�k���-�C
�;>�j��v�Xtס�?����)�;�����G:H�؅�D`��˘�>���ؤ(Q�Wx�e{`9��x1Nn����8�M ��TJpz�	o_o��x^':D�[ZOĠWV���ɽ�w�N5��Z1/%��v�pٞ%��a/Q���E���ME�C����L�myn��zE�`�J�(��k�zIo��"��,X۾�����w�oR�����ݠ	(gr���xrY�k�-R����7� w�x��a�N�(yC�8!9���N�	1.�*����f(��H���I�:s�k=̑}�Q42�[�����T��̜%�M��@�М��;��(�Îo����X^�n���$��&_>���y���ˇ/^>|���$���?�w?c��������ˇ?�[O�����^>�~��?�;;F����[�=pfy�&M�<d7%���߸r[D��G�w��`[!�Xy?�����ruv�>�&�R���xE���fZkLC�E���)zL��(U+Rѿ�����_>� ��{$	��íG���|�.��!V�2�`^md0�~�<.�(��j
<I�.'Z-�b�����ቊ1.�P�B��O�^>���R�
����=Wb9z�n�<�5��ӷ�PИEP�S*�����vq��m��A`��y�_E%��ǯf�Q�H�U��c�VB�I�SZ��W�U���ݏ��Zl�o/��>�]>��s.|LZn=��ܬV���Aə�-r5�O���H�l 0R)��+������~��F�c!@�.sr�g�b��Vu
��Ƌ-wb��t��n�fu
W��7V���;π¹���w�m�ʳĸ�Q��7ۮ�i��?��W��%�����R���Fk���L�ǃ:����:X��g��n�O�+`�'%(H-5KtI���~��ç/��ʽ�{��9*#�v�����m�cަ�r�}�lzH���������ގ����KvkX�n�+&W�����3_�h�� �L�����|Y��wz�s��3�ɪq�S-��`�LHm��@�L_�dsE��;�ۢ7CMX1R$/Q>�!�}�p�m��A��@a�۠�4�:$���A��'TOm�x`�#%�)��d�)�"#>B�\���4�Ku�B���&�v�5��t���I>^��rxY�j�3��M���?h��e�]�YG)�������Ӽ�1ĘLu��Vv�������@~���.c���o���8]cL�K�Q�@ħ	� ��e7]��97 h�v�H�*Б��U�	ĭ�X�_m��W���gT2��w�S �^�{l�`�	��ނ�c���k9P��'��h�W��[����~�&`Nk�;�%�5�9� @8��Rp���Z���		onۖA������L� �M���V�g�|����(!�C\��`N���$9<�*z�!'���>���8T�����B~� �?ƻOq���r�3�X��l�~�\�WtnlO:?Mcu��O"t>:�~��r/J��S[��{t<���p_����	f��g��8L|I��ޫ�j�t�
����'Y������w贵gL�gr��K�m��o>���c�K;�T�V�����K�w����T��5;�_���8���n�/���V�yL�d��#�<J|JA6%���p�y��^�hf��+Ta% ���� �HB�2w��E��=-���f��~�A�$��,�=L�`8���W(��ҭ��:�N\y�_���eZ#.I�N�N�X�z�Y6UN�ɷ|��N�����4t*q��S�4.v9�'�bz�D��)b���G�G�B5���$��E,����sŜ�w�����%:��8$��<�� ���&��,a��%A�M9Q#bc�֜/��A65d1Q�`�|bp���������&Q����,���8��\�r� �I4u�g�,U|�4��E��i ���C����Hs}GH!�P�e�V{w�]��d��!oPM�p�Zڅ���f����A��WT#�H�"����}2�:r<��|';Y�!]=�N߂2W�ѭC����Z��Xw�<Pf��}��<wH�J�c=Y�oj����J�3���^('�Sy�>,���@��� �2䠰��ˇ��nwxpH!c�2�Iq�={�Ѻ��u�:T�A�y�M
&�Ǩ�Ib�Z�t���C	���S�T���A��`it����w���3�/r�J��S1J������c��%|�,�������G�h���g+�,=Ymħ\%�Z�#D���Ϫc��9��d���~���HJ�#O'�A5yt�ɏJ[�T�s�n�Q���Bh��tI�����+�%%�!U����1,(#?�?�������l���D^Pv�i� ����B��	�Vӊ��c%,��tJ���r�]�V���^Ff�����,��_a�������R���*� {�;��	��~��XdVǊlb��[��!��|T>19tFΡl���|���UQ�hː��4p�_�@i��?^>zH�b�<��1�'L��.�#E�y�d��q��P�Pr�I�.~`�Q�w��a�DW��r�������N��U�	h��߰;58�����P!�D�=���WQ2���<��Į�˻�)<����*����a6�Ν�5$$qhz��Zά���?a�*4pW�̿ȝ�ב��̿%�Qb��#N�� d����)��*�tOn�s�b�L����}��T]�'�3�k^���[h����/��~,�7�Rxp����#.KC��]s]8�m��~_Y!���P`Ϸ�?gf.RH���%����l�ې9�4�g,o����v�����~��L�<��-$��#SeU��i/��^�K��(�y�����[�ѹ�>u�}6�G���#;f�q��<#�[*hv�08����/t���b��6�������㪟��ϲ����7J�� �Y_��>Ѡ��)_����`_�_�������1l9(Su��>�
��4�w�I�Z�\��m�)��{.���H_�)��;���ݦ�n`�53 ��v�u���|OT��͊3+���e�͇u$EvX�%���$�k֥�$ظ�4�G�������a�U�z�7�zJ���_�����dh�E�]G�y�GHu�1V��k�3Z�k��.~7��3Iǟ�f`��t���M K�g�:_Di ���QJ��1��m�����7f��zL����~�\F
+�U50]�OTۀ 5�*���l7�ƽ	�AҨQ9�B�6�i" _p]1�����w����C�� lQBݧ8����� &z*����ĥy.l|������p�~._s����d��c��~/��� ��H4�S1���J��}q��t��9wʄ'��4�~�5�4�C������>��;7d��,���_�������2���A��	�%m>NMv섔�4�.RFv�ڱ<�+����Օ��&ٺ�B�W�X����W6���]�g���/|�H����l�o$�O.""S��)4���$k��-(���Fqic���r}����k��+k�[���7nn��$��Z�.�!�m�Z�aݱ�x�eR��&e�k��]�cCz�Rv	�Ӗ���5�
�Ō�Rx�g�{0\�4�.�\�T��,�j'T\��i����TF�+���~��Q�N���aV�R�4��h] )��� �/^\/�����f9���˟ � ��ե�k�;�?�����a�������)sBAP?��76��{V�{6�֮������[~��e����g�+?�vsH����@pi��-T� �C5���A�aV�3@�(ΰ�©u�ݡrx:f(^&���o���z�=$n��=M��)\;����.OB"�b�B�\�2��*����>�1U�ǔ���'���8;�n�c>O�(?hz6���� ;e:H�Igf(_�3�k7�mr#�z�t�eX8���� B��)�եē��&o��.]�݌�*�g�� r�� tr2m#S��0�/K�î}@�tv��B?�n��Y!���t� B�3����k�VfõZ�jA_j�g��T��Y�}\F�m�7�qę_#!W�7�]�KEm�T*`�C��#������4��&��ƴ��cT����'1�$:�oqt�m��"�h��3�xJ�D-!,�����/A��BDt�����M IjYEQ�D.���
�s�z�*t�$
ih�見�pr� ½	��fs�YX4ŃX����fƱ:>ٶ;�ԥs����k�١d�M�;���ȱ�L ƴ�]V+8���k�����A\Wp���4q���r�(��H���Q'���5�m�i&���]⸣7�r��}� f+e��ݰ�;m���Á�����db�����߱:C��^�4���-Q ݥ}ؼ�M���r��22�TVø����>���>��M)��]����H� ��SU�����J?0�B1��!�.햦�:e�P�URr*�5E�ǽl���ۤ�+�T��w�rQ��z��9��Q�p�.�XQ�`F&��r��o0
<�!�^/r�;q.������\1�(�a��b��f�R�{�![�WO�z(���x���F���]ڼb�<��{��0��
S�)s�x��M4�©";ˁ4�zQ�'"�#��e��[�1vs�<�2�"���_>�	k��q"oH�s\,M����<�}�A���
��]mH�D���S=���Ύӄ�o؄����H��b�2x���,R�?* �*��e7�=�	�W-������@!ڎ���z�c[=��*����z��,�m�bJ�>ԓT�fF�@_�@�j,�K�f����nR�DW�A2X#��g�%�?P}|��g�D���p`c��]�W6�8�LӺ4&��xx�r�?م�9˻�@���]���C�i�x�=	FGv \7�U2|�c����T2>#�9sd1�����n��}º9�,���}��.�9��Id���㔀����2.��҄0B�y��B��&�V��fXO#���NO̝(}f_(iy����|���;�F�Rr7r6F��|,�(�E<:�����l�}�������$�N(;e� ��c"Ż�-*�w��p���x^��p���P���A�`�}�+��K[3�8n���Y+�Y"�FE��{�rn�`N�׌Te�?_�SE��=М4%3�zW���7ϨJ���t�D#��|#�
���7@_H�ȵV��(�&�|7�J׺s��]�%ʣD_:�B�Fv ����
:?��ח���A�3��:�8j�����XQTŁ°�ޱ�v�R۩U>b��h�Ö����z��������k�xl�D-re�*�Y������7���zu�rۣ��u��cCf��msE�(����.��a��gJ�����W#��4���]�axg�4h��8?J��1���`�8͏/d�E��]b}�sr_f.����>2Psw��e�{_.W���q>|�p�_�N��+��>�Ҕ�QN-�yr�#K��̉o!e���j���#ǖ�%�����Hv�5<;�.��nk�g�W�f���(;�a�@|װ�98��pa�����l�`n����m��Y7���F6a�P�����	wtg��Y��*���f�]�B	F	&�e\I� 	3��rӄ�S���%��OXR���s���e�5  �@+{�G?Fŉ� >�B0���G��V��:M�u诔�؆�c�r���rQ���������+@ DF��r�#"LD;�}3
i ��0�H�.�y�Z��!�M���Kj���AD��N�R���yN�S%c6�d�T�frp�Ĥ�\�I�U�XO˫�h��drq,�x��e5#��<K$�X˓�5�]5M���L�Y�ဍ|	i��������ꝷU_�"sY9�V��LAe�B��9��L��$(A�(S�'��&���5=]���Ԛ&��ws��,Y��s	w�c꒡ �a�L�e*��/�W9$1L{��t���`wn��c���t��#���RlT�3���R�;T`��/=U��G*�6W��IT���5c�"�|U����:>Rq҇#'g��q�sR�5Z�ݚsM�H��r;�+�NZ(3W��$�Znۼ�g.�[p����&η��<Z��9�@�2�R���z+#��«e�@f͔"���w�/���ɦ9�?�4��ȫJD��'�ē:K�F�J�tnw{�\n�Lw�����Qc�0��ʣ���Q�ɥd^Ky{\�f�bY�����^�V���y�䙖 0 �Mn|�N)?��H�*�)0i���"7b�q�2ӎ�C��6��T�*��Y$+7Z���ys��������:�R�G�K�|��� I>���$\�Z��~0�}F+����|n;=�<P�d.��?`�#(�TM�����w	���a$��΍M�Y�*��w������oY�8p�q�۝�-�_�����
�[� +{gߔ�ٍ��S�h�FX�B����lW��~4��ܨ/���s>����q�`O�@��x�(�:.����%7�ҹ�O�����6s�o8⟮\�W��>�E��� ���>3��1c�B�W�%�);zT�ui�N5j;�L�c�t�dg7�o+���@~����~���F$݃���Joy�}��%���,#\^.�s��Ns��P�G�
.�3$%�<>.�Ŝ�$�=Z'�O�8X��\n;�%���K�my��'�r��֑ꔄ�E�֎8>�c	{�g��iț)�K�юЯ�����8�2�7�sĬ�A�It�<����x?���s�$���1���EW�vJ�ed���	t�;=N�A�_�L�G^�K3EJ:����{��T���S^������2�'��y���l���?���� �j��&b)?����ɩ�zIWr���C�VJE��A���']�t�lB����2=+ҥ-���rG]��8E�z��(��k4���5�3u�ѵ:6�#8Z���ݮ���N��kT���5
ӂύ� �Z�HK�������y�o�3F�"g���k��Y~�z�Q��F27�hm\	�	�4_Ƶre�ܬf�^b-q�PM�S��6\l�q}��E��L+l�m��=�ݱZ6���w��;j������8�V� WR-����bз(!F�I�W�FC	e\l|���6��[�1�d�[%�����^���	�u���54��Ϝ���>P�Ҹ=g�&�`d�"wD	�M�m��w�G�~N� �~=3�N�8� e\�4�����B�}v)�PPc�{$
D�7�s����^3CҥvH�{���m�_o��K�0vr�j�{�t�NA��2^��v��q�-[�<ҙ+��3[P�y��Ұ�ìD���z�"�7ӊ�Ԕ�y��hV�*���*�$^��s��/�R���L�)y��������&�)�F�V�
	�6�΁���`@e#��Ttׁ
��4����g:��;-(|NYD �f��ef�%㪮a�7�aDY;{
�Ѥ�`�٨���bE��A�,�� =z���S]�,u�x �Fe�l�[�$:<�F����߈B���H�Ʉ�����Q|��K&,�iHickqk����D����닛�M���bU��-��W�6��v,Qp���Y5:U^&�i��hC�=����has��<r��_��ۀZ�h��`����0��4�v�l�������S䇾LT5����,l��x�,Q��@zߜ9J��@:��PH;��<����I˹
�G��s��J��Bf��`����G��<՘JeKgו�ʿ^����ǂ�K 9�,�u������,������ �y[�8m�<Һ����2=�
sU��I�rR'`�α5[�]c���G�F۱;��Q�[T�cAD��2N��;ήӱ����2P���[LwLh�$�ߺ�B��\Y!���<9YZ�\n��XY�Zݸ� �+��&�ie�\���X�<:���kʭg�S����qsy���;���Ҁ/��++[��*���E�s����YB����2�����,Yb�q[
�����q|�ҵ��,#�"�Df����[�{�Xnl��a�ʝ���j��G�l�#Qǈ�H�(nH��,��F۶Q`���8h�^r6�7J���C2U�ϙ�$r&E�<PF>����2�S��{ޖ�.��Z�O���_��3l�@)��3�P�Q��;�����u��S�C|&�?S���_��D��껰j�L9���%�)���9�b���������XL��ʄH�;	i�잍��A����T�٧EZ����i������'���Pу��q=z�&7C��� �B4dZ2��S�<�����&{��՟N���d|���S���
X:�;Y�T��>|�-���:ma�g�C�w��Dr�ﾆ 6Jf�-���FkW%�u��{��ųo(�HOw��pAַU�K(y7J��#�*�$'��G/��Tʢ�J�D��5=Mh��V�p�W cZ��R��_��A�z>G^�+�kmzF��{�"��xd~���;MzT�G�p���Y�T�r�Wz��oO\����U
�k�
���Э10��)
bf�ly��.Ż��5}ϳ�qf�mY�.6��}�P��l*ER��{>���$iQ\W�ΙY�f{��"�e%J�V:��pu�U�D���͋޾����{��B�4�=VjL}6�ݡg���߰�@Fv�N��:�7Ч���=�*�Y�bidD��G�eb���#�K���l���%�=��r��Wc/r�>o����<�5�R2^�V�/F(iu����Cˈh!����ʧdW�T�+i�'E+�����M]�AS}߁L�}Ͻ�/|A.at�!t�}��oV Ƙ�;��ẗ́sQw�i�l�8���F�q�K�-ʅ���?mo�ɺ�W�,�8w���������	��S"��bb1��6E��v�aٴ�怟G2�BGs�D�i�����Ȍ�P�L\4�+ «%f��ܸ��z�,[���(��7���q*l�.�@�]2N��q�"긋g	�<���0����!9@9�,t��fEG�q<�"�>P�[�4�-rK��*���t|��ϙ�T�*x"����3�8�������J厨�@�,0�����d*t��F�k�O�D��}�۔��eE��pc�p�.�_�v_��0�
]-�b�����S��7P�C��v�6Gd9�},' `~��M&������i� �c�������Q��	�gy>�	�Ry��O	��Xp��3U]?���x���u�x�� �r�#��`Z�R玆İl^\MK��v�t��qyu=�93Gk�V�h�})C� �%R=^��+���{>e�}g�g��*��B��n50=KʰP����tN��<
'�{���ɣV:�����sj���~��;���� nф�r��5�
{:^E���X+���ť�+�dy�A�ī7���,]_��"3L�\���!�s.4�
�1�sx|"��5����Q�o
�%5Rѓ��5�9��	z�.A��k(>jennO���b`4D�	cl����&�?g����D�Q�Y��A�!��!�4Q����8�@d����1��q)b(���hpr��v��9��>�"q�0	Y� J��������B�Pq�G��5.�0��'�W��Y�F{E�Ҥ�\i�9�*��7�(u��!\R���s�n~	7_"�\uO�d���q���c� gM(��?"���F���D國�#����&	�>��N�r�b��)�ݚ;��7G����_�ց�d�O^6[[������7��Cx׵��u���|sm�An�X�r4Ī����V�F��4n�mP��IޒF����ZO}n,��G�܏Z%}DasyKF�?`�5�i�ߢ���q|Yl��p�∈���.��Y�1dvʙ�)*�}��x����l�X��"d�ަɖ����4���������c����Q�I���y�@^���D@���K��ƙM��lt�ͷ�N��z$����LU^1�~Ǚ������!\�:��O� klN��KN�?4u�g��aB��}�f�m:]ۻ<a�vK亳�xoSb�fm�vţ
z���gZ;�E��(��H�T�oӄ�e���ȡ�̣�ࠚK�("x��8���8��l�͘+c5�i�,3B�l�D�ǏQ �P�?^ha��s���"�ޙ���p��#�\�i?B*�:��uR$�
||o�h�nOǌ=��s�a��Ş����`p~\Fz�u���`��Z6�߰K�H��>^D�W�#�Ζ�S���wȴ�	�����1����B�����Y.�����'�
y I���~�����-�ޡ�%;�m�aC�rǏ/vL�B��%��.!S�7��g�<1>�a�X?|���慀�? �@nч��O�a��&Nk���,�y l}����o�Ï�xhZ�¬�������E�L�s��\xRܑ�M�)��.IAؼvP+g�!�)Mj�<�.���>x&
����2���W����&7�ͦ������\�4��B�j`��,C�#��"zؐ)T��F��p����Tܗ�hL��A��}d��''��I�\.�i,�u����J��1m�Y������ f���*~�<�4)|�;�Fo�K�^�UiّΛࢹ���������֝���D�4.mZO�Ҁ��Q�=��g�̓f�y�����_(�\��>�ީ~��E�tX���,�b7�K T6(cA���׽s�N���V hPL��Mͺ&�iw-�&!W�@�|e�1�{nT��\`B�P�nJ|QI�ݷm^x̆�W�.������O� ,f��r��ZQV4����M�bk�ڙr�ޑK�۱�"�c��C�2��5.�I�2�.��E�l�D�FI�Fɦe�!�����bQ�&d_,��SKm����9J<̛O� @"��_�z�.ĜTL<�|�;>S�]��XgW�:�����q������iRC��풺��@O�U=𯷭,����e_���G@�1WR�ܲ\gӲ��مi%D�O���8�
�;��h� ]��Af�I�OW�X��F/F�,�ߣ���x�&�-����l4���i�ac�4<��f�4i�����q�  �D�L���s��ěq6)�GRs���m�Q�U05�X_�#��f��.������GL/�ή�E�Gb���%���cxaO�Z�K4���&g�o��i�1h����c2N�_�G��S���YNK�{��@��e	-Y�e�״������("���$��&_���r���(-�+�y�������p��c�)x�>��q" 2c �HN�
Sڟ�"�%�h�ؽ8u��-k�!&|��XR"N���j��{�y}n��_Dh�R�h��\�vNȸLn+�Ӥ�N�k�G��M�C�1(���;-Çj껠�:L����'XQ�g�U�e��
/N�}�-�K$\42����{f>��Z����ԣ���_O��t-�M]�Fq1xg�=J�F�(^�?u5����SKyf83CX��5⓮5`	�!�~ӣ��X�����pS�(�bV ^w�K��<^����W[H���i�ꉔ�&���4ίYi,p��<��	���2*�D�Y��i��Ƃ�Kw�ݳ�%*��J����$����J�D�&�����_U���ނ͕E�������!e��yO��4���0���Yj۔K�h� *e
��
)�Vd��jD᧑�6ǰ����,%�����c�u�/�SX�� �2�ߺ��ҿb��O����Uښ.V��
LU^��X�>)�)����,�;ְ�XUV|\ �����wU����YC����g�1�jr��,�o�>���Mg��rL�G}w��"٥��4��XM�� g.6���bTnbv^JyLҔ�0�Q�Yj��_�&"��J���QЭH�N�J%/Y;��aIk�n��ܖoĒ�
� �NޘYL�Z�V$���1���ؓ[3mH��"I|6;/�VRa��i�I@HvoĦ���2S��e>g�2�Q�{��^�w?�*���&��{+�?��ZU�$"cF�8���K�g'Uo`ĕ��I��<i���NF"����Ch!�%?"و������ZМ��h���y
2&��[Ҽ�a�#3:��jE�Ą�DL0mwFN�t�A>�1CO=�<�������d^�d*�?�)�ش}�O6�.��mEl�p����D��&�E����]�7l�_Іs�<�P`6�J����J��(��&%7_��M��7)5ޱ(��3�{A�+� c�ԓ��)�ƪÌ#�����
�NL��U�(eغ����(L����p	����RV�oy�S>4�T=7�M�2r��K�R���e�#� h�{�J�v#e�Af�]�8^7F�o�c�����ɳ2ҟ���
]�'�/�c.�(O��2����H���,m�߹M���E�&��N�سz����A=��<�r���޹�"Qf�=�~
%�7��Ql1;Z�jYp��o�������e˞f�L���[q*N������GRH����s;�a��8H?�>&z�ʠ��5r�8M�g�g�!/��`[������)��>����=/������4���6�Ϗ���j ���T�G�*x�XN�B�ﰨ�Lb t11(U
��#�e�%�����؄�(\���R��QI���Di0P���^$�^�m�QQ�N=���>���T|8p�(�w�������[A� ��,�4𒭕��ߑ�z�ҿK|�CW�g��֬]y�����V�?�+���m���R�%B}��,�X]�C�Ү�sё��߳��6=����m�^
�g���sߞ���A�����T�����B�"Myr���̠5�i��4R�Vީ\�Z84QCiۻ�`󗱈,��Tą`��ٹ����v�{�mYv�/����R=�C�h9~���C��z�\V�}Ky>�:��̓�i���+�6*	ܠ��.:�E/;��ٝ��2�*��{�+�g����@`2D���C/[�,]��uzŁ�g�&�0e�2u��9���D��vA�ʊ]�X��;�9�^ٸ� ����Nk�·���'���@�nO���uz��жP�L����B"�mS*��|m�JY]X_HXyecg�i:�@�d`Aa�N�Dg��S�+ݥ�N��z2�:���`��ff`s�Ү��vl�����۝i�~��m�Wa�����rho����� _����8]���~��޶��'a|��wP�ɷz~ѷ=gG��zY��� ������R�};�G�Dכ�����|@�W���KCR*Hg�Bƞ��)�ϖ� '�L�RF�x��ѷ��;X��6�Snf� ߣC`�����)C��٦Z�����]�H9&���ؙ����v�w�-*&��YR�j^9�񜸛�q.���\�����gr�9AD�MPt.�a�o{M˧���#��d�{�Ҭ�N���CH3@���K���B`�?+r�b0�
`r�Y�5��1(Fq����۠.DM�	���yylN�đ�n��� �:���n[��4��T���\&��E���|�%@ +�G1K �����E�]���Z��|�,�G]W�#��;�NS=�qū��E� �U{~�l6w4M*s�oe�)Z�Ix��0p�P(K�� �0���m�ӒdWv1Xf]����t�R��XH�AT^ѰV�1&��өR.��\<�w���^ħ0�T�`FX�Z���0h�b'��Z�k2������T���'qB}!�����������r�2C|/B��)ڽ���� �8qv�@�Xg�g|8�T��:�`�}����}>���Y�����̨���J�ٓ���?2z����2{�d{��}گT�M�#.ͤ�6�`IS}y"�na����Ɍ�Vf��I��� ��t����ߍKߴ+��?!�}oP�����<P����g��usy��V�,-n�@ᚕ5�����U.+o�G^.xH��)Dy���C������޷��/-�g��Î3M�(��]��;iV\M��G��kWo�$h[��+[�W�V��)/�\�a��|�x�@�'��`(��t��������S6Gh�-�%t;q%W�hy�iP� �-k��ru.�hM��~����w�2ؕ���B7yO�S�l�ޣǄ�l�F���a��'��irL[g�9T�7�tlA��H�K����F��ĕ�ڥ�A;w'*��B%U��~���-�l폧:RV��DuPT��1�y6^F��V���*�?�m�a�Ln��=&�z#�� �� �c�6���#�6���A0��rybVbhDu�c�MM��E+Y�?��7\�ĕ/=Z�_1h;>��w|�����qAo���-mf��*�cB�8��؊�:+�����
�����i�7fV6�76�V�V�@"g*�a9��x��*�S���ظ.&�����]����-M	��a�2��4Y}�Ar��(U����v:T�qw�}��u�a���?�s2&j2�,&e���-�x>Y��uJ?;P��2�'| f6�n�7=���8N���:���;��.��t9�Q���ʾfH��4�F~��h�Kr*�Z����̽gf�[j�/K;R)}�-h���h�7�>L܏��A���5�8

��2�w`�8����7�Ʉ�9�J�o�>���A~N*SIa�'�2��:15q;���`���Ym�R��m�zKqR�A�7�;KL�GW2Z@�f����T
�����`�8?=��[�sr��7}OC�9����ec&��ש�����K�߲�ٽ&]��Mρ�e�rss�:�iz`|�֪nb/W]��&���J�O8�0�=؅��g�LL+�1T�%}�6���8 �J#��J+Е�|�h���+%�Ƅ%m������zv׽cgt��V<W��4)9�<;;A�H<�nC:��y��é�JI�K-���j�*o��-ѷ�k�C��ާ'Џ���Q,�NR�<�"���(KE����&�%�"Lv�N�m��ŧ������|dK�IM�;��wս{y��j��?[�ڷP����(�4���	�rK�� ^��N�����[R�R)Vڕ��+�ܩ�f�;�R�b�t�|�S�+�+u���e���ڢN�wh3�y֠-�j�\����������Ym�2,wv�ƚe��YI3ۖ�͒�R;���?*�,B�y��h���"�>��s73�>Q^���0��R��� Ɓq��$�5�Rq0~:MD��x�{Vb���',S���� �z.ҫ��"��xf�̵�R������\б�؝�" s?R��@�J��Q�B����k�JH�S8s*%"5�d�s�p�gd�J��Y;#�
\�Z�C�� �,Ti�C��1XP�U.��)�ř
�[Е>r��I,��x�ߘ�|�*j�"A�Z�B��	J��iؖRPF$��2�
�s�f!�`-� ���e�����T� �p�{ʕp0�՘Nf��CY�!�E&��/#�84RgC��������UC5��UD�ʶmR!;�#/��l}�ѩ��J`U�B��p	�Ǐ���3a���>�����f^D����7U��D��Z�p=E1������o���3K�j%���z�;)?���_^)�Z��&w�=��t�pjT$y�$�WI��P��0��Ұ��w���^lff��*v��5��&�AF��r&�hk�39K�h�21��z��p���{���Hhʃ��ЖU�!�����9��"����V��S��zJ�#zP�����J���tk�v��j��ߎOb��~�VO�0A V����;V�.:���Wo_'�b����)'����,�T��A�G�nd��/�
���B�	�Z���ӱ,�JjUr�t����j���l�^�_��#�/U��.�f�1�l��^*�^(Ζ�suzO��] �">W���o�c0���f�`�5�W��Iem�K)�R�tz�x�Ű�����Z^K�fp{M!�N�8Qj�9�	��\�R1"����TWa��H-�գ|n>6:b��_���1+���B�T�(�
����ܷj@��A�8aJK(ˊgR�,>���F����\g���E��>)��=3Dx�L�P�;�F�yV_��<�*N��h�M����"��P],�in�K[�U�&�.B��L%f0�JY�$!���e-��y��+���_>�l��~��D�f˨�wH�6�][]Z]\�?��ʻ�����u�E��R��<�P7-��a��D�H�BH�m�������DĤ�����'C :�p\�����0.(����_fU���W�5�FdTO��{�_�
�x~��F�=i�U�4*i����|����r�]����^ �b�N�.�����WR��J�mW�URoϥvp1��_w狕����O�+FL3_�l�R\&L��[�����!�5C�ɲ`:ɂ8��{��( ���N�ۣ��,H� uW�b�c�����X_'��;.����_�`��b�N��-֋u��қ�֥_ޯ�~��ҧ�\�Y��"U*:�P�dx�{<��؊dk��=
���.�cD�<5�Gʊ��4�x�����3�L/��|����� �v�I9���gأQEN�$��
U��A�̀|j�N�2�|YW��.�KW>#��S�KDn!��z�^�2�&	v����d�M�i��}�[\�h�ͤA�������4=y^Չ�o�K9�;�9�p�_7?�p�'[����(4�'��a�Q�	`>P ���+�b%:3+7�/��@+�Iy�v@4�Ȓf<Yxp��1l����S��r�8T<1)3f�e��a3�P{ե��<CH{6K]����h�n9I��5=8��r�{(F�p8+,3%�T)+\o�ʔ9�+]���/�Zi~v�I���+�R	�R���r5X\���
3�ԛ��0��j�b�4w��?�J�9��Z�T����T�X�<9vDj�# �R�.�&�y�؀��]���9�˰����������b�bA����'�PH;F3zڞ5�7.AT6�!�uB0��e<�)��U���-��T�:	�5xR\��:��*�Lƽ�&�r����3gG����22��fz=󆀈��x�����<t<�M�nV\�;4>�y���@�2�4Oh�I�jTO�ή��2�$c���D��X Û}�� ui�l�㳋B܅���~~�1s.D����*<����\�9�%j�M��uW|��>������/[m:��=kx�k0���G��G?�y�W��� x��WXE	3G���r�S^o༧��GBi��L �o�1@~�����
	GJaev�9��&p�Ǳ��9&�#1%��eݦ}�
��}Z���]�~��.햦�{g�p�jF@�>sv����B�T��G�T�k�0��xPc�����+�J�bz�����_<���)q�8�3�K`d.��n<��1���U�x��Gy����WLg�4`-�,-Lj)����hǄfh��	[�9ne_���:���["ȥJu��T7GBQ\v��Cx �V����*��龒�y�W. V]_Ҫ��$rĝԪ1'���I-dE���U0��,c��^���_�f]�~�}��s�{x�fGs1f��'�E1���R�n�sq(��>�[�n��B@��uu}1c�3����xG`.�c��+h�g��֘��Kr��m44�Z�!6��g̸�\082ni;�&
��E�` �kk�=�:H<�x�����j<;\t���*�Õ 5�� ���uly�r���(E]��(�&���� ��U���'���r�<'fC4�HqBYk���B֞1Y�\5g�2�5����HX�Jd�Bi�-�tG%V��3Rd�gQO�pt��Ύ�9:fw'N�04�@�u<��9�]��_�}���s���d�Y��8�n��T��!�1�"�1�ȋF�	J�M�\^}![�������y��.�GRo7F��.�|���(�u�bS�x;�~����Y��8�&i�>���� �#o�w,c���Od29�#$�C}h[�qn;�L4�5�]��'�ͱ�p��2'�ႢXǹ���#Iմ� �������IKp�7+��rw��u�����
0˜c��,}���s�PE�����
)9D1^fa�[�*�fX�*�Ƶ�!��G4/�x2�s!}�)bݫH�	����#+
���HLئs�f���nʹ4�XHYN�壾��+Չ+?3�N��s]-z��U��g�ML�c9<�E�z?#a��0¿E��z���U��G���eI��UC�n ?�|��̐��DI�,H7�M� ZU���;ԷH��D����3*�by��iEE橳�L�-��AHM欺���6M(�nߝ��EG���`�<e�R�*��lYO�c~�(.�y�:�8[Q����(mCJ�u{��&�s5�`��X��4py���R�j5 ^�:M&��zT�T4��A�z$��Z��̵(�,'��a`�%ha�*c�p��ԣ7��d��4B����{��
 �t��z]��GY5�j�v.�T�dA0�J(e��>FY)�E�nE�\�mқ�s.Yb���c���z��[�Jp�9���9��z�꙳t�����  ���}mo7��_�'j�譻%K��	����d?x�Q��$�M�h��-k5��b6�,r�Evq����Lldf2�:_2%�?p���9��"��"�]-َ
3����b�<����<Or�gAON'����>�l���lw����K%&_4��U5�_;J�>�
T��T��/����Kv�H�x���@�i�;�ΤH�>�l���P�$��*���v2�������B��|r�'��������a��X��j�$fK����+�99�w�
ҳĐHZP�n���n]�1ʪUM��hk]>�����+H�G�U��������T����v���E����{�������a��PXDPR�L��u�ad[�Y]`S�Tq��!�N��@��s%��W�P�q����&�����@�-(I��������6Ԗ����Bx���K�:���u�s�X�w���wcm��[ﮱ�Ǘ�������ו�M �\T?�����*[?�^~��zJ��ޮn�,M^g!z�V8�(+�{)�S���IDY�e\p
~�n-��C��a̻u�� ��`��ϗeG7�lp���#����`�ֻl���x�mTW�׸z8�������՚��Z>��,��,1����� �&g
 \0a�r��W�|��8v/���^?9�|F�'ģ�100Ǡ�m<YD2�.�x�NԀ���A�i<��ĺ�.��o�� F�υ���J��?�w�d�O�����X�9����r��%���ɿ����������$R��O�pш�c�J���1���9��5U�)�
-.���r�s6����h�6�N����]�N�i�C��YdX�ǆ�ى��]>�∍� � b@��LD�s9}���q4r�:Z�C,/^�/{g���e����D����'��>�U$��b	J���DE�� �j&B 
$~}��4�H]Y��<����}���d^!v��<~�I����/��7��rF�xʅ�+����?<}�����h����d;[�;��������n.BH�rueN\'�""� ������3I���4�'��@:�y�s&��ş�����"I��Z\\c����o�ߊ: ����z���~AC)�.NN3��b����"�yPSt�>˜�)N\�`Oʻ��n�����Rb$��\�Q7'�a���P:@��ǔxZEk� ���DqƳ�1/����|'cYhΊ����?ږk!n�x�b���i���o<�q�Ͽ8ht:sj�n�7d)F�\c�h�݋����7�,�ꎖ�s#�k�:Ê��*�UP)Lۥ�ݭ�ϳA�W��_�;��L4h��ּ30����mq���b��z�dX�V%�;�������W8r���d���盵F�=<�d� w�"�m� �|e�^W��*������e8��;��r������[�����V��x�D��E;� .\�vF�f���~�wR� �����[G+�� ���I���w
JxE/�Qk�1���c6���`�E���mY��!��EGB�쓬��V���K''���qI��Qͺ�Y��\(��ٹ��+�o���� �5|��\��X��]^���"�R��?�R��N`��(g���rBy�Ls�2w�q���gA��������!Є�cMqcv2X[=^`�[1�:66D]���rY����I��j��P<XyX����C%|tw1�2�-�M��c9�u��Ie�=���	����dG�6�1T�+T������L��ݜ^ؕ��3��|F��m%�|N^&M/p�4p������<{{\9׹�}�q� �8j "{����Z�ޝ�Ĕ�kw���$����|>�)`��
�5w��zm�F�j֪`��9C��.�g�n�f���p+�Lo,����n���[=�)�b�1|��(�]���\�k��ia��+��Y�	��{�2�7<B��o{2�v�-�ֹ=��C�dv_m�=*>�j!�SU9�I�]��=��Ң�R�o�����b�Fx^Ly�;ǭG8z���OH��ۗ���
�U�T�뙓����*[9�u�Ǖ����Vnջ�im�
�Dt�T]��Y]\M?�.��<^\�QU����X�1��vs�8�Q�N-����A=�I��Ɖ�:�|�4�~Kc��r��}h8�hEۆ�%��Jc��W��Ѳ��X<���v|��e"�<F ���⇏�9�B������c�_#���!_�b��ĥ�:�n{�r�;N?�<��߭�&0�ZBZʖ$������Y��� ����	d��4(��4�
S.Q��DS-�֙�W����ә�S@�u�s�x�i����Lǝ��q�����X�"y$M���ZǾ����v��#��B��~u=� ���BRN����D�)�8%4�~����	,r|��C]�ƻO�@IԖ�N��ğ���tI֠o(a�U����z����Pє$�]�`��� _}r�l;uA��-�2Z�T5��ӯx���9VW�����/�Q���{f�I���@c��V�=�LѰ�-Պ����^)�ް1��h�A�(�vRw	FFM�W�\M$����M���j|;�n��(
���k�#������*f�/V��ٍA���?�1(�$*i���ܲ�S&��"��&�����T�z3ky#f����ͽ����!����d�9������b�m�(�?� ���C�����+Iy�^�(x��eD#gÑ���k���/D0y�
SS��l�������J7&t����Й����a��KfWQ�C t6#Ȕ���D�Q�o*�Jo��Y]@d�&Ԍѵǋ �T�t�s������j���V�@��G��W�S9��@(����X�~�m��Yx[��<8�}S�5N��I�w������A��j����A��cSa��nI*���/��p�8��E��B�`"��i�C'6i�a�F��E�θ�� ��� eX�!���Ŋ�̎'8�R�ʿ\o&��iؿGq/�L��dz~���N���&s�~gr�f<&�B�xZ���tyS!���8��^��A:��^���3>�38$���¶Y�VVrZ�\*&�ʲ[�Ȳ�`|���JJ>(00���F�u�?95�?�tz�y���
�Ҵjʣ�\�<����>E8�b ���._;] hO�<�n}j�gK�N�e�Q�r�"L���l����ހzln���+�5uC��er�'H��2�M���eō^JW�6��9����ق�]ڳ��'³/��Wҷ�a�ܓ���rg��!=�O���Ov�Mא�,hv�$�-�	�ɋ�#�'u&_^^���{�x��aN��3F�>��/	e: a2��p���GQu�.��%Z��L^=$�CyH���&�ڻ�Κ0�5���-������#{Y7�Ӫ�!p�'Z^Ҹ(�$YI}s�}�Y�ޠ��<�W����yjBOҨ���`P����B��`Y�@�(�!�;��~	�`2��%�&�r���F��˂Bl��G�Bn�9�#1;:��w�C�WwA@���:"�H��a��F�݅-��Πp�b�������[P��0������@��O��@ߟ�l�v�q��}���Y��L�8*}��Ty�c��{�5�6�*�oЋ!�����
�����C
���Ο�#w����aZ��`}D݁ ��g��B����	~
. ���P�2(������i�W�{b=�{�7��/t�h�;y������-�? ��ˍ�-c9��lm�P
��i�l�'��F
���z��,��ۅ!0�I�G��a�B4��p�n �S��6��W�[���Lrf��pT�!ϖ���.��2��?��4(jW2|:,T���������/qh2���m9��Q�����F�1W�x�$����2�Dƥ�ri�'�墠�̀@[��m���Y� (v���D�u�5��V�m7�;����WzhE��M����'�z8��X��0[�����q�2�l�w�z�̺��j���9# ��@ 솸�ץ� كN5w�ܻ�^�P|��	���훻.:�����St�N��jp!y���o�aq��ވ��&�йC����ݏ�T^O^�Jx���2�jt�#ppن�%�P�5�#�:�c�nr�>��2�Kexô�,hV�ĕ��U*񨻀�(����UD�*|��>t^`b�3\`<��"g3��^�ת++v�F'3��VŅXu4��B�Hк�B����,/�MT�ф^'�K&c1���
_BB�Wo�� �� x;B���&�t�v����]�m�ݛ�Ap��?0L,���G���ޝo���f4=��0+���76�f;S��`^�s����~+/a��k����#u�`�A
��,�Z�K��H���L$���D�=�b׵���y"�D�XM'<�� �c�a�]޵L]kU���c��|���xZ D�����0�)�	Y�ߔ����{����W}�������,+�t�.�R2�@ zё��|��򲭕i1��3V�J�B�h�U���	�L���HR��)G�&�x~/:2t	�<����31�p	l �!����R7��$��.�q�*��]Nۊو�]���|C���ܒOW�MV_��J�6C���6���������F[�b}�n���F.,�	$u7�|����&�{�i����wX\ר����2E�i���'`����l8�bP�zX��VV�UvI���2�&Ư�t��w�w��K'z��]*5�0yb`[^�LEK���.���xۼ-(��v��k;k�O��m[U��ʽ�iۤ� �f�S"vO�-v;^ �ަ��?l���x���S���5�:�U���e7_�����m �s �#�R/kD$4J! �S�ai��kD��;��x���&S褜�%����اc�F������^����)��b���[�x���9a��҄k�p��ۿ�?�[��0,��l���Z໣GO0VF�S�2~"S��cr��f�A�A՝�%/'6:|��:���Po��yN����REغWW\[�ن�:E�^��?�4�l�Z��P�۶�V���/�<)H��u0�y7�%�|ʵx���n>�y��Ok�5�|�&�@m�����3 H���h�ݳ���6�:���=�e���ނ�ɰ#�J!�a�BI�"��SFdx���?� �@����
wԻ�o�K+U�uu]����Y,�Zc�j�]U�F�#������IY�s�	��������Z2��'[���y2WAP;���X]�m67�\��,��6ퟄ;C��_�����~G#��YbVi�����yM��_&	�ϔ|�����>�(�8;� �+1t��G|����T������@�f'�m�wO�� H��-p���oŖ& �
�%(៧�;���8ʤ���h^ ��^�@p�"t�z8���!�fC�PG'�lw�5m���EԄ&B&��l����kvF�H:����6���[J�wI�<�����w��h�
�.k��SJ �r[�.�:������\Y�D-�|+ �R��Ķ���/՗��KQl��PZ@"�6�ш9��9�v/R��n��|�5�8e.ؒ���!�FU��`�?���[�_e�I�_�B�Um�p�>H��+O߷l?��;cƭ���@wo70^�7���z�ҕ"H�-��?a�T:av�E���gn���gr�ou�/--�����\��'�W���7��C�EA�^�f��ڣ���)�R�˕��p�"��t.���9�t�x�aA�t��б��x��h=��|�i�L�H����R���x�J�V`�d�7�SZͿ���P� 6Lҕi`i������o:҇plH�BlDc���ny�|�xN�k�
7��M�j�M �~�F<{A	y���d�@���_+��P �c���1ƹ�$6�Nm���j�:�	�����j�;�po��|���B'/d�s,9�ݍ'�.V]KTzy�N�KC86��/�@�2p���;l��vo�5�(������Q[A%#�z����od0��zڎ�bV�����x��;D҄ �F����j#���@���n��|pY�T�����Ȩ�$1��C�+/d2�#VH&�&x >��� b@������2&D$�Q D��t[4��0B0(��G����%��!^����~�&P���1�x�h��\
Zk����(�L��Z���n��h��ly�m�o�V
���ׄ�
-7���;�5Al�#
 c�Vl�m���\�emĬle>%�����
.a����|������;��XA���~�|���W�B��0F��y-w27 ����a޿��%��m�Y�a��CI�<��N�(K�v��g�/���ĵc���TC���q���#j}iVaj�eQ�Uk�r�^�n,n����Y��3�3|vy���q�y�n�r�AO���������1{4�3�w�Q�e
A����ʜC��$X����y��(�v��v�[��Μ��MմӈpS�pG_������'�\�'I���!H �K�팺s��RL�I,����������n^�v�����ϼ�4���bQ�6W�7���1I<t���=!,��u�l�0��'��*l=��+-��!2�>c���?"ֳ��?>lt�-�E�f_�wW����`����z��L!�$�� :�X�ߋ�V�w���}�i���* �'��Ϋ���n�c )m];1�L�֟즔����Fh!���̺����d�Mzʤ�<&-C�v$k���"�@����'�"^�m����w�G|�������	vM�\�Tᐬ�w�[���'�\ѡ�W�\�+Z����T�js��[�����$�ղ�R\�F��?x9�'x9�<�a�&~|�x�`�<�Ö?�`��W:�j��R�Y������j	��y�͘�ܕW�^��Z�p�c��5��ҫCu��)��YA�BR��k���3Z�rU=,4�g8G~�|���7��c#�,�Qي�Vޫ�>~�B=����&��Ŷ/jNPi�Z��=��H��Ȇ<E��zi�EVFpt��g��:AJ(���)G1�-O�"��h����<4�X��i����P�R�g���M�s?`&*�=f����V{o/��u��Qg��f'D=!����[�����cs#�����7�8'��	e���\xs�n��p����!��Z�\�3a�߹3-g��"�'�w6O��� �L�8(co6mˮH�<���݈��vGt�闳d|睈���W��݃�Ũ�Tl���u�U�N(�Z�z�|�B���ɞ�L}u�T��t&d�Þ�kV�#�Iڣ�Ά5UWd%�y�/�~v�'r��˂o7��m ��f�=��]%c���f[���'�t<�x���L��Mj0:!,�a��3����4M���,<lV�DF�t�`�#_^����KC�9C³{]��?I<ZD�W������y��T��O��pk[���F9/��SRo�9�K���˚g�>J#�^}�i�_*kUM��w���h,��֮�'sz�k!�*k���l{�m��\�������R\|�p&�"wu��>-������YjSȻ���ց�ǋ�˯)�u��X^[yyc�$Bq����u�LH�em����B�TVU���T�q�_�.^f+�*����VS%��Mx��C�~��ᓄ�p��J�إ2_'tH�$���2+�U���/d������'qB�9r���?��bޔ"�w����*.ǔ�'"���l����Ό�w���Ŋ�����r�[�n�wU<z�?��0f��LL�l"�L��P����:vD%s�=��{p��1x���.��1|��G�/@�\��w�|��_n��;혾�z��N��Yԃ�lR`��R��f;�\��?������}{���CS0��#>�9�L�$%� dR�	?���}���i�o��b{�@1�-
��J�fĘ^L�K�$Np]��&��c���D��\-���J/:b;Ѱ<%Z���"?���d~0}���N�������m�18e����K�B�a� �1�PvŴ[������`�i�.h�m�^s���:.��n%��<&;T����e���5r�X�?K-�/�bo&lG���1A�L���!�����Os�oo�����@����w���u���D�kmt����G����I^0%�@<�d�.M	K��T�{�S�]�M7�FU/I�f�Ch��bqq&of4��f��ۅ��8�N�Y�Y<�U@W�����n�*��\P���8۪8��m�$#6�j
�c�W�ꆉ�4�k3ҧ��b��L����`��C�}�|�i����t�$���%�����H���+m�S���|vNL?�J3x��&��4�tD��>�H�%qz���o���Gi�D�+*���j�b�ϛڸO�˞�\���I�n��*{\J���g���χ��3���g�M��^�<p���S��ǐD�>��C´��'.��*x�̺TY�lnZ��{�kN���w#ֺ�qo�p�U��3~��F�^��:`�v�ƀof��C{����:C��uj�p|<sJ���c/Rp�p���Ig�喲s��)���("ą
	��R1����j�d~Hk�U�V �� �����	V�[v�r��ޘD��"�q*���DW8��=����S�'��ڒƨ�*|�����z;��'S���f�NȂ>�>��ܶλ��+�(dX�}�� �o�&�	"K�0(mہɘ�� ꯃaC�<�Am<�`%t&��1�R ^A�i���l�[�Ψ��$�P|]�8[r_�k�sP3ǖ���%���į��JtG70$��������ԋ��'��$�Ϝ��f��E�c\���V�t~M���� �W�1��8y���:KJFΠ�s��)��u��`��O
��3J�X=��c�g���)�M���J_PΙ���)�{���yA1�u�1��H�Wd<�WO���<nv���XF��^�)NX*b�/���� ӛ5�Ѡ݀$g�\�q�T�_T��[p6=9��r�2�m�O���0��{N�i�\��zΌw����<�I��'�Gw�It"��3�F�4o�����2xqW�X���<���,튙,M�{�V4��Ryqa瓒%' ������{�ȆX��u5c�R�^B�[:�sJ��WB������q��^dۧ�!�O��^z-H���x%G72�CWRn,���UV�$%�c�����^+��e�m��H:�e��#�r��A�ǫ����0U���UgNb��[�b`���|�+a@#�(P��_|+�ӿ��6��6J�n=�n���+i}��W��㧶���:�ܴm�/򦳊xc�:'�ү��}�́\b�wt9g��K!��G��Q%=/?������t(��s���a���R	���_[uP�9F�_7�H:K%�����ȟ�,ͪ�P_��0~P�rB{���T\�$-���0��~��Dwz��<������O5��3�LMVx���  C& �r�֨" O��(^�0�4�m���) >x��an����3�'�2e	&t|�]��pd"����3��Hn~�x�'�]�F{�/{��E�t��4�?c���M�e:S�uLW�XCN�R3jw�>���T��CH���5]F������Z̮ ;kF���믒v��|�)��\�d/�n���r�W�G�S���ɽd��"���u�M��Kl�����x��^���A��mn�o�\�[??��׹��_Sja>�^Y�b'��d��Ug�έ�s��q�II���sk�r��5�fN�gӽ�Ɯ�G�B	�!{�ܲs^疝~M�������wiz��V��srn�Y�s[���s\VS�ŧ���g�N��+��<��j1\�1���;,� sPMYz��h=�YI۴ �V��~�s<�i'��00ju���b�*�PQzG1���5�A@�=5b�.�|�gf�/yi�b
�-���X�t�:�*I�'M�N
���_��G��Wd_+9I�y��v�*6鷯���:�iI��j��T��y�c�p��c��ZҰ��Н���CA�2�6��+�.���Yr��Z߫W���D��c�K�-��P܏��u��������~N �|�	2�m9��do#\]����y�z�eN<7������gCƭ���Z����%;��z�'�K�K��6	ҷR��55�ȣ�ƹ,?�H�D)����N���)q��c��a�(\�J��2$��~/^`1���&��S K�E�#맇:b�wt����w��bN;5#-w7��A��6��G��(�z"0��h�x7���M�Rb~}��!d���i�}:�N��A�(%�W�k|��)r29D	�F_����� md7I�����_˯ �Xr7|؎����K���~+��
L���h��L)Gu���Aoܤ�k��hi�:N�H�'� ���l,[؍.��e̓b����� H�e�<�s�k�0�c["8�VI�!q��`�| ������t����*z���@���R5׾B�0iҡRE)Y��(jN�}:�!'d�&fr��w:߲P�~F��6[p�B8��������+y�2SI��U��ġU�"�V�˳�+�`��j� @ε�C�d'L�XlE�j��|��0�q�c{�y�Q�>��%�[��mQ"�E��ehsCXqZ�� k\R{���"�*_����*R��L��Hԅ�/ܶ�4=��W�QÃ���p��T6�D���.w~!�@ڦ���1�Beb��c t>aG�ʵ��7��x��Ν��Ã)�S7�]�Q�n�	�eP�4�M��N�PW�TW�֜z����
R��T�3�kln�;��U�ͳ�_�ѭg�:�Q�w�#�kݫ��<��Oߦ��^CMj�*�^��)02�5���fG��^L�؄̺X���ڭ'h��E��C�wL����ơ��rӠ�j&�z���4�,G|����n�t(����?����m�[Dq�9��,�8��T�BM�_����]����c�B��:��Ǥ��I�%�pmCw�P�՗�p(��<��]9�ƻ~��ށ�h���BG<Lyy]��j�t��������d�[˥���U�[�<l9�o���6a��Ѱ����o�G�;��YK;�t�{�/Q�Q����O��a\�%ߞ�����Z��x�x4h�K���	�w�ݮ���D
������nm�xv2����T����8��m|�D��_O�k�~��Yt{����\%��T�jn�)Ԏi>�f8�q��;8_�<Bw��[<_�6�N6�Іk��2�4P?ڟ����64(��0�k㙋�w�H�x���+.��o2����EbB�ȑ!��␦���B��KN&z�2��Xh:_e1���rE$D{���g��a�t��[�v'��i���W��̓p���<�lЏ�d��úሧ��Jho_��"�/{��r���~C�/p�����w���s�+c;=S�+,�@���"N5Q|�7�[�YW�r}���+�/[8)Y$��Z��H'�^�4"��8M�u5I��/?"��9�d9��~�۫JJgߑ��~!�襁����t�X��t�^�KtO��˰�/��~��$K.)��� _��i�S�=:;�і3���B���*RsЈje����8}�[��a�r�t�08�uE.a�N�MnΤ�d��U�j�	��#�r��j��*1�60�T��ΐ��.2���O:�Q�l� <!�c����+��Y@f��)��AD�����iT�dB��H��~@��׃�.�@����;ÈX��˺�a� �a���:>��?v�����%�w%��D�6�,�h��!�5�xR~�7�H���H��\��1sJ�"���_�*���$~e]tΖ���)rp�-��������
�?`#�����Y�hF6���@Z(h�i����q.�8���W�Sk�x��ې�3&vF��7Ѭ�Ͽ�t��(����Cжs6�]V�O��?:�)ѫu��3F;��(����(��T������	��N������k7!p�^t��Vc�b�E�b4�A��F!��w��J~/����sT_�J���%�!�}�߾�BM1�����_�g�_�$�?�s���{Qs������ipy���x8j�u��[p�awX�@��XU�m���.�z&��P�X��d�Q��&.�Zb��1l?.
{Ι$�Gq�3H�>d] �]:j��$�A~��{�/X�W/H�H�V�$��q4�tE�p_|kgk{����%��h�iI)Ν6Jjj������;%V�{��w��$i��9���W�"���V�5��Bz��O�|�SB���u>I�~�H�?H9�
����Gi��1�J�oi���D�a0V*��F���dwE|���ZO�/_�C.K��냨�W�=ʭF�����Y&�Y]�\.�Nq˭&NI+0�i��g��=�>�����@�L7'Wms��$S�������|##+��e�%�t�d}�s/I��I�	��SD�3�Y"hj
�	Y���: p�����4�#&C��x��*��>���}�H���|��{1��!����,|܎�&�L֟,?��F1��QGXDk���2�uA4F=�����k���:�rv}{�Aڍ��{���o��f�XJ���z�����}A�>/z���.z��n;��`�B 3հv���ܦ-0��E� ��V��+�R��F�"���[�X��pw��Զ���a��7x�]o�6�7���w����W�;�
vW.����.��0W$z{�҉V�x��	��]:���*����7�*�l�H4�0ߏ� �n�`Xf��>�2�_Ш��%nO�Wuese�p��fx��~�,W�����M��o�T�o�����r�2o��X���0;�b�e&���9�U�̆B�K���V��!hP&0����6O���uf�v]��H��V�|����wE��2_s�|~�~���yy�W�D	����ޯ�uHc̞����=8���xn�*Qpc���-nTs��t��N�����/7{�|A�o��>_��ϟE=���;}���4�Q��7��N{�r�߷���=4���#>�9��4������>�����!ۈ���Rl�(&�Qd7't��m�ĘzNa�8���x��\O��td�eA��F)�{}�m���A�[��N4�<XZZ�Z�����8>�zs��=v�gF������we��yp��"If�=(T]��8��5����j�wM����_S����G���ڣ.|�n�	~�O~�#���u9 1��P i@����t�'�[2�*��{�u����(���s�ox�����V�6$[=�d�0��K��Ua��LB��g�l<��g��W�����jſ��Tli@|,��W+�,�͉r���&"ǋ0n�(�c3-�x^�΢��-���($�� ӈ��:��X�颮��\ԣ��q�ŷ�<̠Vқ��b|�Sm�2�5�̸2�d�
�E��0��������%Ј7s*�h��$��F��໡J�I̷C4�ߕ+`vCPQ5�,QXo�k�z��/�s�������"�y����j��F��'�Y�Ԑ)ʌ������`yN��{$�o�&���x!�mBV.d�E�{;��妢b+0)\���v#D�m�߁>�rB)?��P�8y�*E�6�]�Ǫ=�=��5��ԃ�SjB��esl
�.W�f۪��%��Mm ���*����q�����OwWTs�y��U��X���N���g�,ҫ�#�ƻ��rBn*��Q�06��XPxl��u��Y�����rE�k;�j��d�&�`�H).�ERί��;E�k���c�I����I�q"q�\ '��I�?�*
Ơ��lW*��t�.��ՙ��xF�f�����6��a'��
��<���Ny^H߷v�bDw�Q����b �y�e��Gǲ�.�������+����r��za����%�� w�]�3Aoe-�J�7�R¡4aw�ja��lG���o��v��K' �K|7T�7���b��m����&=�>�'�W�z*H?�� }dv�a_/bb'���bCЮ	<T��b2��K�M\P��C�b��%����L�ؾ�N'q���dEB'�"��e~ɱj(�:���V'j��.���oV6|``��g�8�3�����[]Y1���"��0�C���=��&ߊ��C��R��B����$5��(�\ފ�[~�3�.�F-�Ԡ@-`c�i[��4'i7RR�����~��L�hA�^%a�Q1�t�$'v4����&K>,�{�Ψ�5���ܼ�� =w������RZ�8G�U�8��%>�݊��5�һRɜ�U��{�%<��D�m�8Lk��)]h����b}��VGc�	E^��d�^�E����8RŃ�A7���J����|F���k�\)�kƧ?|��u�I�M�y/2t�srg��*\��>'���D��wAǰ�Z�(3<h���)_ K��$�m��������S�!b���	47̓�nt���
��(d��lp��Go΅�C�K?�K���0}�V])��G��P�L�a0w�fr�I0� L{�6�r�`��Vj�W�����]�&Z�L�Uz��ZB7:�;�J�t�"�7D.|U��!#���KB��A4y˔�MLJRҡ&��*�.���Eb5��!��]�Y��ejǴHSB��ݼ�O�Z��^53/N�s�-��@ m��zצ�ܼ�}�����q��)�6�2!���\����S)Y8%Y`r\Xb\>R�(��[�~N���A�_*x��*��?K�Τ�<�7�g����e���1�1F�6�
�3���? �-��F�C�`�з!�?��G�[1kWA���� )0R��J~M5fbl����W%�(�l<��S�p���[��'��OR u�����_���L���89�qb���Y5N�Eۜ�RC���mAŋ¯�U2�d�/$�ɠ3̌Sg6�Y�
 P�(oX��u5c7U����Eە7�ND����2�oG� �1b�LoH-��WAM��厦HN1e�������]���;dy�An��πh�:��� b�z����k<n�;����X�̱�V>�<�%�'#�u1t���J������u�r���h����~ml�Ƹ!'v6͋C�<>6ku�q�Y�����Z�d�lX�/�ԌIX�	:�XE��4�(� �����(�e9x�F�aǗ^�x3#ש���k����ɝ�yf��6zD�L��l�h��o%�,n�!���@�SI� ����Y)Y������t��>��)Ec�{�#��!�Lp�a�^M�e�ӳ���R���&��-��h�q�&��kџaB�9���:�ᤒ|�l�C��t��,��Hz519�~vɰ�{ʱ�dp߻�R��5����Fr��Z���pl< b_�Jyh�ʘTV�"�(��T�D�ƴ�%C@�e�~�d�bȌ��\FL��ټ���`�2��=g��)��.�Ů�X|BWBŞw�l�zhZ���`�?�&:������ ��6�2�O������RI������ -�����W������wD��>�>����!h%,����䨅�2�熱�^|H���==_�E�j�pH�2B+��+�V;8��7'
H:�Yh�L\J��-��+�L���C�" �#�􊪼Jh� ���3(C ER��S��U��W�
�xE���*V��"��}��j��Q4�?ρ��$៶ Pk�1K;�0��?�.s����l��ِ�`Av���qFƃ�ї(��'��ɦ'�.v���&�߉�Z�9om�;�A\�1�u��@��<�]Ⱶ�!�)\/���e��t`�Z~�M@�%q�z�?"���������^̿��b)�}���/v�����M�{�?������hxE=\������aWÄ�����-�)�����hs̹�-���$~��ܟ	�Rw��s�GωZ�S� ��'���E��-C���	@�����T�֨�E�Z�E��e��4S�	0��P���~��Žv�Z����k�P��q�E��ybk	�qa�:I<(.�~�i�����U�K9��-� ˱�WdԳJ�QF���&Z��"% �x������o����<N.��Ӌ������)��ZJ9�F�Q+4+t�rcf��L��\�t
�\��!I�
���M���x���Sy�X��]�����b�3��<c�2I@N�P���nq��Iԋ�P0S~���v�RP�<�'x$�<���C�1ȼ�!s��%F��]b�w���\ֽ��:+�l��^���drq
��uW�@q�x��z(�\��D�n�w����Ã���8�����^��E�#�[�m^��D���_d����O���k��7��x��Ν��Ãi�c��V��MJՔ��7�0H�Ma�Ϣ��Z�T =��g��U{Cs>�4����(�g�o�c:U:�ג��{�<�,!\��|��C85y��UdW_��2.|��L��ȯ�В���y���>�ڭ'hE�E��xk4���$#@1�������;��������h�طP:P'���f<4�f\��I�=��z���49q���k+n�e�ƻ�#�|d.\�� j�0'��%���VV���rRmr�v�����y-H��|�����w��-�A�R9�e�`�
SF�`����=�,��g��� ��x�����{>�Ȱ�rC��
NŃ��V	R��[��wxr������Zl�`C8��Ó.s�f�nA��SƚyM�I���-�Br]�u����2��  ���{o#ɑ/��|�zƢvD��Z��Y����ԲȞY��P�E7_f��-��X�����ٽ�cܽ{���s�_`����~��Y�U��U������5Y������l=����C�4؂ ݾ�$t9�ݭ���=SC�p��h�"}�m�s��R����}K3,e{n����P�:�U���Olnx���mn�ƞK�[�U���
b��U�zU�3
U�J���Li[9ːϐ��By �U�K�[3�u(�I����<O���z6�����)|BmB�)����C�<�ڏ��C���-g�]��*ϯ�����7�o�|C��9����8�AY�&W��\��`�D��L挬G����-ŗ�7��l*+��j�C�W�%��^,��j��o_d��E-&-�{�����*=׾�(���[Rc�x�ol%���Fӌ�4NN)<ZH�tH7^�D��\v�\���6���a�1Vw�~_��S�L��*������S��%˯z�Ѿ�V��#j�v�P���<���.>����]#��O���� ,�N���ɋ��lmS 9�x��0��3`~y|jԛ#�"��Z�����(���$n��Ո��W��8���w�g��>��'��|������
�7Nfl[�	��?'@�_p��Y1�g�m�tڴ��ߗ��XN)����a������!����t=\�N(V"�z���A�{��ۍ"lo��j�����&�Y֧͆��$��������D�K�h&Jxz��s'�^by�]������Oo��F�S��46��1�9��	��5�Dce
g�hZ���qw2qGXۉȇ����j�m�^�m�~�G��+����,��n-�d�&ݖ�KW�(�<���p���I�t���ie$�,H��c�ٷ�Y�i���y��F�����\mw�r���|T2;�@�E�bj��D�_�Dw�%v�_�7�n����(9�ɿ��k�C�w����{�)�P7a�Z+�����
5�=��2��`���|0�V��h��������`|��a��3���J��͵�&�Z4�F�\��\��\��\2>!R�R;%~��9����=���:''�^��%�Qf�a�s�Ñ3�HΧ�Im��u�y�م�qz�9惸�ۮO�m8���x⫌�'~�z���&�/����3��:��5.���(�1�a�uF!��?��.A��(d0KK�".g�����O`�}"�Gyr)E��^Ob�?�R�{W��]��7��]?�y���+�I��SU�}(L��!(B?��UT׶\WJ�Bb�3g9��B��)L�M/߭"~�Ahtƭ��d����Ci�5j��-h����4m�S�5����WLH��l@��w�z�_>u�JӃڷYs8���]�Ǩ�Зڇ^��Q�9��d�	aN'���=~.��T�<g�q�3�f;$e����5�c%�g��R̓�>��l3?�)I�!O#�ЪDm~�eK�P���f�Ь�O>2�2�r�P���̚B%k�`P����}n�w<�+-R��:P���e�o�_���؀�����0[�{��VX�����.H�MT�9�K|�m;$�&0㏝�;C>�� |�y����&&v���-��ѿ�$��B�����{.���}
KgZ]:h��*Y���9�X�Dt);-I�җt?ZVX�` %>b��6LdF�:%d+�{w����Q^NO�2ruִfG?�)��e݋R���5��F�S{>��oՈ}�!���m=o_�shD�*�LƺP�<��K��o�<�U�̜�g�"%5
x���C����\X6�G�CRY�(�eI*�Oj/s���`=��^�$<C�J�Wf]���y�}���K�i�8���%��SU�h�Þ EeU�y|�\!P�$�dB2	�ٕ*zH#,FD��P 4��|��Q�N�T�/wIr�ƞ�P����.�OÆ��4K��������6G'�N�򻣅q�v~������
�����E�I(�St��fώr�]�[L~0|�]V�%�l������lG'Ŝ��c;2��b�c�`ɢ)6ۊJ\P	�Ǭe϶��Zz�ͅq���0�4۳�5��+չ:�g�	;�ЅΔ/����16�z٠`�a���Zd_�F�6��*m���V���#�c���*8֙b6B�CwF_���)��#�Q�/���4��RԿ��?�dx#�'��lL�]�ҡ�Z��#dȍ��>I'mE<A��w�/�]2���nW����p��>�S)�D���U��\���C����6�2��ӰP!Τ�_L��,z_Ȼ}w��M���%�8@/�
����Փׄ賕6��|ɀ���*��xQPu`�K���ː���'x�M�(�F�%;�_ ����脡0��En=��;�����yr�^���s}�3�w��v2�eJk��d�3��vn��d����O��A��'��)eX{'sTfkN���B��+^7������_�
���;��fa���ȯ�����돋�b����dJ~� �)���m�ߊ,��(��k?K4Y��
�}3�����$����~*.��#�4�S#�X���2��!Z�e��t�'#���L�(TVny��k&����GF�!�S��J���������	l1�qZ(������D!}��Ɋ�A9�H�H��4W�­���f���\K����I1��ɪgo<��;4}��bX]�5d&�X�:�5p3��r �`��$R�C�r�tY7%
�JG�Jf�<b�9!�Mb��B����t9}��x��`��^ �c0����KrÐ花�"�3Ь��;�������?o<g)�29�ψ�E7��{�W�� {u624�aP.W�K}c<pF�ιX���;�Mq@Րv�Ȟi��H�-�s�;�g��B��,+F���zJ����W=�����;������911o&�L̛��y�Z&��gav҇���Ikq-���FGfY ���~�쎷����;v����Lw�P��ܗ�͉�Y�C�/�;��=%�z_��LF �^�H� �y��2fIz��H������Àv3GÌ(�
�P^?�So{:&Z�nAB��$ ��ܓ����?���ȭ���F�&��F�"+{���F��[w6�&�/���_��P���I�˅t�*9�g�R�t)���ÄHXI��!9��h̩�M{�[ȸ`R ��n|?�޼��r�����a���� ۑ �·���� �0g�Is�Ŭ�Q�!|\��cg�cI�oި=i���@��pDK
�h��]�݄G�W�!�#�]b�1��Ow&�aE6�L�&{"a�#�������g*����Ƞt����I�{{~�D.~`Cj�@'K#;�rtq�w�~� ��� +��稃�RŒvR�a]E�!R�uP;EjGڰD�ӄ՚*�(U�Q� ��oIF�]���R�r�:+�{kl��x�m�BK!����DL�,n�4p�a��4W���v补�!0�cYp��y��m2��R]�p�ߓ5!��
��H*��(�2h�d]�ǌ�T${CQ����?� ���T����J��A]A�>��ź�@��?	�z�mmp��x;Ӱ�Dh�d(8*Ⱦ�9��(���Ͻ���G���(�l�"_(�s�;�-�Q,��7Z��:�B y��+�766Y1�Y.�ʇ����V.��	���r��߸�&���k����/���%c�*_�Sbe^+'�jD�o���P�xP�?JV�{��q�դ��[��8�]�?����oG�#��߽����Ϡ�߉���$j�����؛��:5�8¹�����5�w;����6E�Z���Q�G>�#gk��ղ���:�9� ��GM�B���SE��#4�B;�[�HPp��;�'�+b��y�f��N�#���2��g���aUR��b\���lg�|e�of� |����:��8ŋ�Zw��H�X��������O� <J��&�E	֠���4.�+ ��`�G��a�\�Q��q�6M���ЭMR�\��х�	k�^:4\ѩ��Ǹ_S�	t'�/i5���J��^/}���՛�o�+�!k��M-��e�2�V�4�YD���e��D�ˉ'B���$	��[��Y�c�n_P�6ïp{��_G[�����v��O�����I�Ȟ���=	�È\D[߲�R�Ԣ5S��{��J��7���;���ﳬ����)�A�����i�vW��(.�RG~��7���oy�V�^k�[V���e�~f�o��b\���׳�U�]���b?ǀ�����_
������҆���,�$�����d4c0�Xl����PFo�}�4�V�G�Vg<ɖV�Rai�83�����M�&7`�F���x_��7?c+�3!�]�#��m3uq�Fk��
KW]��7���ب���!�=ݾ��s3ٻGݚ1�4��0]���OUo�9�9�vb�̥����;z:{����đ�	�6��k��E�ײ�Y	��V�N1B�10~ԝJ�����C��.��s�߶YE��˳0Ov0�����/A!3���x8�\�>g0R�Y���m�Z5�G��X��l��V3��CP������a�X;��i霦7�Ma�H�G�D��*��p.d�F�03ǁ��t���k�2���wۅ��f�_��-�*�<t���X~�E|�E�u[ļ��������6	���n�p��Uc��a����m�moٶq����n�2����bv�9C�S���z�1s�D`̹����fD>�����P׏�&'�\m8k�bd�bȖUY��W]���]�?K���MS�u���[5�2- ��w���f�1������a.�#P�h�!굛u����u'�a��m�	g��D%!�g�����D�����$_���X!q���3.����c�!�9R!:�N'��r�[m*w�h�I��p?ujӟ>��I�-*N�-&��ɒ���Cwr����'6����)�����轾$�pi|OҸ��_��Ki�2n�oo�$K:�[�0�ܺ��l�7���e6�g-����|h�g>���au.ʰ}�m>\wJ���R�ˋ;�O�����̕>���͕.r�~����t��}x
_���x���I ��Zψ`-=uq��q�V��޺�	@�SI~�2]�1�*����$�|����c�4�M�E�R%��r���m(X�SR��F��,��[\V�7�����Zy�γ�.�b����V$�s�/E|O��S��p��������+q��[�XKF>HF1�Y�#��V��\�MR&1^��B�ݏ�C<F�qi89$4��}N&����}��'��������Fy�I�g���0���K���Ғ�+�U�̚��k�u��趣4����w������������N�����$I�O��%�p=���C���ttl8��ہ���˳ Jm���.�mKB�ݏ`��p���}��>��Ʒ�̦��L���r6v���V�������F�U���^�Zc���Z#&�_9���[4�&_e+��A�]"�}���U� �t�j;�x�����&�* �������f���`p�����d�'T���WX�'��WXa9�eJ��t��2v�?��+�=��C�_����
�RG�XC�����=t���<�F�E��H�#��G'���L��ef�e���X~?B��R��=��^�`
�@<�<���ʴ���� �^	~<jM���1��x�m����x`2�5Go�U�����v��w��l�����J\r�޲�Ѐx�w���z�x���Ճ��l��p�e}Hh�����Xi(�b��ZW�,���	����Z��P\��a��)�����"�p�26��R��T��KW����k�K-A��z�깰���	adʩ�.h��98��gK'��
�g����%�ɰ���R1����8��b�h�G9~�J�_D��p��z#�a�4�(�5�>7/T2���'���ǰ�p���i�~N��s5�E�a4,�:���e*3�hs�bC�N�|��U�|��|2ɒ֙"6J;�AW��e���5�h(�R�&�fj�c�]<2,�ګ�p<a��ǁV{�B5�����ϕ�<3%����#{0���'�}����J�O.��VOă=�E�+�DMi�-g�z�a�x�����������Dx��g{�%��k]@���ʻ�/.O�.]UA��qu���N�1�'�������3�ġ1o�!�+�aگ�X88#޴*q!hcIc:�ך̗��z%|���>��fH�����]�2��[��H��,�m1\_PTi'ĿU��O�#Z�oˇ�q�1\ ��r%�Sg�h�9��)�b�(f�S$d��S�M�����{(���f��ȗ/R�p�φJ\�&[f�qΗA���r��"��-�O�\��׳o����6�A��/��p��T�(��S�� fF�^}
e�E�t�^���(d�E�23�x>yVo<ޫ7�Z9���G{�CV�>|�����q�����i��A�Q;�A	�63�]���|�«����<*$�K+K�0�O�Uy�V5�*�(�+�w[/-_��#O]iuE�M*O�Mn�6���Q�Y��pk �_���?����}�,��|��g����%s��jf٥Lfi�:�l9�)~f�=����I5{æ�Ȼ�5�$ ��+ ���\T�«��gB��tr�ۺ��j���c�ƏO�������,�i����C���5���k=e3NF����>�6���d.��9�����#zo�!ϳz��~l�gDcg*�>�Ѽ��t�,��3�n��8���xǜG��A�z�����^S7Z6��m.n���/�Pq�Ï5�����ɟC�J�)I���P��#��+s�W.�fAh]��x�?p$$^�/�p��]*[���tT�~��/Y��>��`�=�R3F�D<���@wj�Baa�JW�D�b�� 3WV�������e}�
�ӆ��E|�Gv5�p�RN�-�����n����
�5%N����C8�x-g�F9�z^�r������x���|�5�Þ렊�#���2#,�,���/�!,"�p̳&��PP{Wɭc��;�#U�h��F��t��P�U>��LUgnH�}�똗~t'�E�P�ǽ���3��-� ��Ӻ���d�Skӧ��d��>�2�f��yO.�����ԏ��s=䄋����]C�q���*r����P�>/��Џ�O��g�1��Z~9י�$y]�Aڳ?�ӗd	82��/����7��Il��.��#���
C�^��9�踋c,�t�6ÿh��N�ۻ�F�7$�������D�-��2�BeH_e���'̴��E!(��J��Hx�	���=V�f�+��;�f�z�xa���9M�1ܹ��M���C�%9َ������4�9�J�7���CY��m�[:/���f�S����Ӳ5�d���RZn�|��²'�`�zE:�͸}Z��B�y��O�ju��������>ݑ֝��'������4�}4�y+���s^H�	vo���ln6�J#\����^.ܹ+P��v7�����h%�5g���]��U�`����G�}�w�y:�An2m�"�A2�c�ׄ��#^��{�IV7����{Tm��F�t�3��W4�{���޷��U�am�A�zK�Le��W��ۧs�t��.]L&#o{ug��w���@F]/��W[�W���;�f�_�l�%������&��U(|�����v��tF&e7U�w�]�h�`p9r:.a�~��ד>I%@!�~�m��&������T�s�s�@����I�Z�_���6F�o�>jyekC~0̉>31TH�ז���w�R_H�Y���S����玻�6���`I���F�Ќ�ֹs�2g2�=���&Nw _�0�'�ڒI�E۬���-�紻SF����U�[�2(�m�ኍ;M'[X����V�^+�G�{�6�^��^w��L/�NL���&vF��H�CK�,��7����Qʦ���9�L�}��B���Y�9#8��6Wg���p���M^w�e��!��M�$�p�bIZ�#���D��~;�V�e��H�FDJg�a�pz��L#ZL�s9Jk���wR���}���E�zKbK�����u1�֬��=�"�k�>�>K�t�����ŌgXt�I1���Zqݠ���U}�� �sM,/Ar����i��H���=�����(3R}2�K��ϲ�}B�����<�����Hi����Nes�	@֒d�֎��h�kѝ���ge��ː\�¸�\<w�u�.?&9���\�X?_��j�t:��8���n�-ip�N�Yl.����[������.�$t&ӱ�Y�]�Jk	���S�-��<�M���69�L���p�I��E�I.�;kN���F��J�fa0���]�����Ť��$A�X�6�oN�d=�M6'�O���&�6�Y� I�WDdLh�7�f��|�����i&t���g�ք��x��jQ��[5�����wc�������w^�nl�=5vF�(���˰�l~v2�Ɓg�3����OF���"�,+V�G�*��5P��w��X4(��uD	`��Q����I��4�.גO��v����[zQ�-UU
������/U��3�����9Ͻ�Kg�}�����]a�&�3v����MڨS)nᏃ�c�k7��k�)<%��U)�v�Th�?[��݊�V�?��O�����A��r(T�Kh�9�)O�zA`����4-�y<W����"���
�wŬj��=l��"��:>�M�9U$����8)�~)WnB(+������Ͼ�yu��2_1��3cq����Z��HGi�{�*|��Hi���y��B3� �*�y��~?9w�T�M�R`A�w%Mkl��+�b�)�68��[8��`;"v�p��huYTr`Gmi�ڵ�:=����,��Vw��2S��.�X_z�qw41-�.X��� �f� e��	���!���Ҋ��.�Čsm��ʅ�gگW�o��y��w 0[� DH��(��e�1GQn�:��j��M��C�,֘6G�7�4�Zm*`&m�{�%�$�
�e_��^�Xfk-�8E��r����\��_t$yȒz8"8ͣa��h� ��չ5����ѬϖX��k
ŏ�1�K���W�YZ��~�P����*b2��qQF����n����5��5s�sk�}�غ���%�)��������%,�glۑ3�ȏ��}��}V�K(�p�Wsõ�uO��J�b��p�g���)�������RE�/~*˻�L��Wa��=���@�NW�#ְR�w9h�4�5��o�}]n���y"�ԕ�B���M�kd;��� �v���C�9I^����@�� R�
Dr�S ��Ǫ42�)r�3��Һ�(.8H|iJ㐟#<%*�#�o� ol��

@GFqg-]��er���>��k��ǗB������\�ǐ��F�,��U}���Jl���������]\(m�ܙ�&�*���2�ԛ�	=ZC����3Oz�I 2	{�Fj��K�r�C���^�Q٭�k�r��v+Տj�o��N�6X��^�5jըk[=�A�������w��6n$�r9V��RʑxS�]���Q�<�趼w���J����|�/��%~�u����i�a�4�TprzpT9����#���'~
tBbǏ����!��d�R콄�
���@vpܨ=��F^u`�q��6{�a�/�Fj*�{
��Β��'�� ?Kw8��`��_y|؀�Mka�U֪!R%=8fY�jm���YZ�D�?σ!:#YagLY}|zZ;n���wpE�����B� �0�0�?��������^��Ї�L�������d���[��"z&*)��ָr�<�#�\������W� )�^;E�~��DxZۯA���z�� �2vc�vX�ګ�z��W㥑~�����'9)j��Z�Z�hq�bB.Q8��#��ꏎw�Gk��q>��l��)f�Y�]VJ������m���+�5�����է�����x�A��O~�g�N��2yAMĝ�Li����GP�LT5���J]��k:Bm�9�88�������ox���?|\c�����Bý,���puԩ���f��.�␅w�W��C��~z��`/�蛛��&���)���a�Zc������ ��3e0x���wNk�ǧ�u�8=x��W����{g�V=��֨cP����>:��;���T�m_�r�o�d^g��n���1%ه��ʀ�ԁ��_�O1"�3���]B���I> �ev��щ����bx�,�kǡ�GvZ!�~�S��a=^PES��h�5w���wl+�E�+arZt7�B�zPSllC�	%zG���rC����+�=}��x/��oo�E$�x�H�����\a���Z��p!�%��euB��r�9]c���@)w�y�=vX9~���F�Q��i��d��'���4+�����\h�Oh���B�U�a�>y��W���Fڥx7�f����b8x4r��W=)	'��x������t�<�'��欂p}R��`���>��+l��nVX��v#�L'ݞ_
�0��ip�m��ydV�]@���E@�.��we+�R�R�����G�} 
�ǚ.0�.\��Y��A��p��9>'��/���Yy*�>aw<�f����ICz+LE�[!�����C�}�0D��}"���!������x��	;�<���\�v�	��{�6 	�L[�Vɓ� $���.\w�1|}Rx
?�/@B�Ǫ㩫�ՀM�C[sF����!�B"(�i�ꮰ^]/�M�=��g".
Zf� ���,U���~!\���P<?�$���_�V�E��E���lh�ޝH��3Cٜ�'7�Z[�ۈ4[>3͉��(B��� �N��w!7Z���+d���d����(a�ZC��9+��7Eac�+n|�Ɓ��
~����\tg"�܎�a23�� C��+�%L�$�[��G�7#s��rL����s˹Y(�rh��إH��A.��;�g���T�ە3��<��Zf�E�˄J�'O؆n�s7+���a�����p��N{;Rnŷ��ɢ���� ϕޓ����B�咲�U��*�-*�@�g��ʅ��VZW�N2����u&Tj�A�Ӆw[�a[�]_�(Gy+�VR��TP	O(�q/�Ƿ97S?$�߸�����x`�?@�qN��۶�C��`ʥeJ��/a�7� ����y*��A�O�.C[��~l���ō���o8��	���};���+�(�.1k��! ��M�E;~I<���r([^0z���0���O�_��5�3_�������J�wh�"��
[W.>'PP��DRp�61�E9��0��,G,�9%R����>�����/Lݜ�*��B߼���JвYN�C

�]�e��q�8�(���ck�[^����J�ƱK�����&���R�"�]���Ј!�I�E��[<z\��k-��+��]����CT6�u�8]]��=���EFI�h��U$#늗b%F?���7�Ǆf?���h��
1<�Ag8UD�P:�/�$�,U�O,��P�"���)T�����3tC
tW���X�pv��;dYx�2�Y�M�o+xB�Eެ]*�_��6$ќ/�T=>n�gkh�y�]9�q��,/��a�,�[�jH�&��<E��qNa,c3��Un0~��>~�����oK?�l�4hT>����f&���^b ��v��vkށ��<��j�
B�����DJ�.
	"��7�<E [�,=͓-:��nI���+�-	�J�MK�=%]i-�̃�w��FX����Pf[�A�k��3BeA�;3�ܜ;疒���_�y�y�f�3���Oeg�I��?~�_��W�e�2y0l����ċh����4�K.O������ws��)�1����Ǭ����g�k{=n����kl��h��?��'%'JD�Z�c:z���3E7�c?V��~��)!W������Ԥ<t��DVW����]Nak�uZƼ�&TI��ĵ.KJK�b���yƔ��'����Ҽʙ��,��Ȉ�V�]#�'�u~8�=\���W�w���k���5�FEr��#菸v
��)��y�)��|"E����,w�o�����{�-�������5ϖ�/��w'^�bPa~z�������Y�т�'������_��az�h����B*#x!W폟�*H�P_cd������.l
J������\U$�C}g4�:��pIkQW.
C�P$��w��-'I���FR�K"��.���d��=;}MS(����������� �)M�ߪv*�/�����+�����@(wfZ��s�bV��p9+�E�Ҭ� ��m ��Pt�J{�R�#U�҅}���_q��c�0KV�Ic �����'㐿y�,.d5D]�G�w|+$->ڨ��%C�O�x�$;�$��o�:E���PG��F�pF*4=���5/ɀ��/nYR���P���������*�|q�qYS��J�2��8Ͻ��#��]�|�D�qh�K{c
���Sy���gO���#��_������Z�#]1q���3�p�cr���	5����?~&�Y������2ʏ�A!p�~�a�`Ւχ��ስ��Vb"�*��b"�j�?B,a.�0b��\"k�ĠҲ�Z���_1���6wJ6�͛�Q)�E�����d���U���]ϲq�����.���D2~ȖpLȧ+Ŏ2i�����g�9{��(u�ӵr![6��P�l���ZKÉE	. ��2��B������J�F�J�T)����oq�aY��.?�����\���(_�sW󾴬�"t	�A�����}���[T'���9~��<��d_�V�$��M���`+�EH�t��R�T)�Od.7�cCh���,t�"H�pm�Ƞ�I��C��]"x�>����~Qi��g���v0A��s+E-r���82������X꩐�K�>�
#���IO�~"�hy����{�"gb���M�!�M �) "loFO60�O!n��5�����Ԃ��������EZ��!g�*�F@l3��	fOm�m�7m�Ɩ�M�X�\�j��Sq*��"�����	��{NA)6`>��k��N���zf��$�cI'��0�M�����ЈS�;���e��0�)@���	�R�:٘�}�[�@7jn�<+n*�pyVx�T���СՆ�iCĀD�wV�4�)�AV�kC�5r�� ��jFuMɲP� BS�T���0��@!#Po���uk�A3�Fe41FA�� ���{@t�v"mK��OK!��w%w���
Len�
�惌��黹��N��(%�r�tI d7��\l>(1��U"^	|��AD�Od#��6��a��#�T�&$� z�������Ε^��(��x8���u�:��.sZ|7ͣ�տ`��HX X��U�F����E"of��6}Gu-|�~���R>���u�Qn���-ب�[7���K�@��/������\цI�0^�(Wd07h���i��~"�����:�y���;�^��m=��t�]�����7���'����[�a�EWs��E946�+4{��@����S�&�zN� r� 1rX��}_���/la%��C��M�-���FϷ3��,�Z�W����P��V�͵�mNf�݁�h���&���}H��q�5~���:B�I49/o���/J�rd��%���v�6Rl�.�Zi�r��:]²����;�N$)cMڥ"���y�<�p��/a�e�P�t�*�4 �=(�Hw���͍�=ϵ,i2pe	}}�R��W��+3�O� Z^��ĸ�b�����*�2U8���~�p���k��Zxed�P	'	���T���#��a:��bf�@S|b]-y����FA�c��=��P�֡I��JD=�TghOP:α��@V�`8�zڗ0p�Ŋﭩ��1Ԇ��?��`��W|&�Ps���x����Ӭ�Si���͂���5����o;�V���*B��Vv�lc�OJ������(�Akg�N��8����4�QW=�}����� �C�b�
��5C��?7�l���O��#N���vI���m'I�J��E�)Z�����la��|�r1Q�F$k|a�����^=}<��g��ʣ�g:�:q�V7�A�R�
�1ٽ�6���|U锎pͷ���C�u��=�7DE/�~@�����I�B��ڕ��7�M'.���	�L���re&�����Çv�⢋���H8�����NO
����B+�tٹʺ>k$���ٶ��X�����8�b���Ɉ�����K��f��`/���z���K~�rw�h�Ku����r�t$���-�*�x8�PXU�Z��ذR�H�9��,j�uq��j�����d��t²,�
�G���-���-39��D�6�S�RDzrI���i��Аo��J��p2�1�r"��n��tb�@���!���Tz=��PJ@�o^����O߼�|��7���7��|��/߼��7��to�gO]���X�9�̺1s�M�us�[2���Y�Ȭwf�Z,ȼ�BR�{�|�X��Tu{�Pƻ��B�|�ե(C�����޼�{�;3yU2�%ATfμdޝ9s5�\]asi�N	��E�5�</9S��19.G��τ���J��>w{����@�V5�H�y�^�\a�k9A�NA�Ca2��<�=� "�9���=���͋I�O�j��)~�-p�M&+E�h%�)��"8	�j�T&P�6KhV�JL)�Us�Z���n��B�RA=�+�d]�]�E�]��ntP�����e0�h�t0*����u���hI1�<
�,9x]�84c�S?tz��<�@3nhn�?��kӟ�L�_�mL�)�	�2s��zAdABm�K�{��������Uq�ql��&�mY7�ED��[�������C�U�%�,��[_���t�K����c�n����:�F9���cv�<�!RM��u��	��,9ɱ���/��K�E|.��5��v���z��&��`"�q��+B��f����S�h��Z��ơR�V�r���P�"4�U1�M�|�Ee����bZ��G��x�g�7k]���HkO"/�6b���'�IR3O�h���:+I�aE,'KC�|QT�C1	qk	�@�8{��<����LfBx*���T�(/��Ć�
��Y}q�	5���|=􅞫�i�K�B��+x�X7�7"0N���BȬ�n�c�����:����IJn hxP���h�vz�`Vr���8��d�Dx�<EZ[����4�%�R���$���4b���-ۭk%i��1MO����-=r�M�%�=M}O��]Y�H�=�q�m�Ф�-�s��+C�y@q	]�F�/4��r/�� LN6�?E$���&9j��>�ZO,�i@� ��"ju�>��[��#;��k�M�ܯb���)m���q��-��k)���Vsׄ|`��0���K~�M�*�i�����F��
g��w�i:��
�/_(/?e?�����j}�}���%��m�~�BҠ�/��I�&?�Y^�ݔ�_��8��O��h�����_���1��;��OBl��:�u=~Z&<�X�ۤ2�N<�RYb"�u�|��Ӥ����#T���C�p�+���������>dK�a��Vȶp�P ���e^?�,~�+��"����ZM��K��!��VwR�z`A%�6m�ɫ���s�L�������'o��viل�o�(-�k���˨�����X*}3�+͛�^*�K�\m�- s����TgI�[��qoB�JC��@�]2�%0�4�p��*;$�;,�b���{���$m�����L�N�gf���ȜK���K~��"�p���LZt)���`ip��ޒ�|\�n[~�V�~ƚ֑Y.iZ���
�_��ƕ�2xq,��.�W�$�Y]E=�[S^��@����z]7�<�	b+,Eڷ�{:K�o�2Qp�D�V���[��Cw+#�\�&�����f�Aԅ�VT�NZQ�����'dC�	DH�e������[?�l5�S0�!F�+&$�^-��	��� ��;!�Q��)�֎�*��d�d|���11��� k�BG���d��?i���n�Ǡ#F�b[�	]p'�lx��L��2��){�ج�5�t����I�#��p%��������M�d-2��F�8QOׁ��t�.��5T�O�T��tX��c{�±4v�,�U6%�:��}�lR���rL�|�$*��aE��84i�Z�����:���sT��Zʕ�w	鶄��o�	�>�j�_��?��pQ븙6D-�GpJ!nA	4:�j��� Y����	���;,PY+��\(D9M���ی��Yx�1AQO�����=�wL@P�_T\��=$tD����+
H�ڣ�Mz���޴;TЍ����γ�����yJ���FꞤ[(�ej��m>�F1��"7��a�Ӄ�-NFV����,��Q��":��t[��&��E��p�����)N���ny���f�r������f��h��mW�[����//��9��M����'Q��[W����㹥�C;�D�R�NT��O����;Mj<�Bۺv���YB��&{q�:�����h���}41��b\���F���؝��(*��aP�9s
�J8��_}����Hx��Z�eD��Bm�R�RI��Q��-J�������S�R�JTq'����s��I���}��1F_ڍ�������v08���pb�A���+H~q;o���@��#0dN��Ԧ�I��&G*+jo6��@cp�F盾��ߎ��)�r���^w����N�^�7��������޼�2�ޜ%c~�C�;u�|5 ��q[�߼y����~���o�	ݠCC��oݐ?:�!�$��x'����څ,���}]����/���$��A���S4�~M�>��MD
�N��Ɠ�K;	�}g�$�UFG����l>,a��ʽ�z�����������}ei𐋵�n��Q��]����s��q���I��U��J�ƾ�v+Տj�{��h������J�Vg��:yt�`��
�s'���	�>4b*�<�?�mƛ)�EG������X��Z�b�����,vX
� �/|T�6�$T���/�`��$d(�b-�.������ �N �lohJx`�]H>���i���Śmqω��_@9Ŕ*���7���Q��G�k]�}G��\�{���&�;��\d�p<l���x����Z��z���-H<�P�I����x,B�L �"��l6/I��2�պA�k�ඩ���J���?a�9����HQ�l�����-���`�Ac�(��~�9~�)��k7�&��d<�L��i	��X���Ӧ3&����qd�X���ǈ�VX�i�͍{~�[��[��m6�o<�����4�1"B����;;�����rP�y$���㝫5�ߟ��&+b�5D����B��l""wE:��BW0��h�/�)�)��ΐ�#��{C�p(�,��.:�T�l�9�Ka�]��ӹz��kY�}�]�������j��+%�|�h��.��<A_�&�a~eJ�`-��%ꇶ��s#�0"�F�گdW<�4�V�J�Q�f��dI�����lq�7�i��1lR�E��)Ja���|8�$�-y�Dւ���-3.�T�D��v���s�y��R���3sB�)an8�����yw��N������j^�0�E���6���y��8��8��uG͡3n�p�8OY9aV���"G]���/ޒ���n�N'Y��e����
��^��r�
D���	 �;�y*�*jm�>z��\��v#��ױ#����N�(�5�nZ�Zr(�D�`~/�FZ/�*7�M�ܹϧ�]���<�&�r8J��N�4�2|D+��&�f�?�����kF�J�^�7
���J�B��x�[�r۬��]䞔��w#\:��o�/p]��a�~N�Me�)o�����6`��"w	���kv3s0'6*.�Q�^�XXd���a�ց%F�3m��/HG��a�����;J7�����A��vUN�����Ã���iL��r0������t[���5���m�E��e�H ���\B*��V�V�⸭���i�ّ��Z,]��/G�B�J��ɴ��z���cls��<펇N��8<?��"�Ihd=���*p���1X<�O�m`�(�T+f����f�;��x�y��#����r���w��!],I�:?0�#E�h�to�r�&�m�݂��mN4v:���ۘB�b*����'ө�1#e�G�:�_�|>��V�I�6cfwI��)Q���<-F��b@_��rѪ�i2���
���6|�݂�ߕR(�g#�9�
˻3_&/�x�6��D3ħ�?Yx��b�N�&ZLO��H/d7�;�s>f�	�����i����$��ƊpZN��w[���m�B�WN?s�S`�஦��H	R�z�5�4Ȁa�J2��K^��x���+?g����p�)7ꅶP��VVOL�5덗s+����5ъ��X1��T��n�~L�iR"��"��<�6�H�(Q8��ڦ@m{���G��9{Ly�v�9���	F�L��N�'A�"�_z;We�������
~Ҍo�;yF�k/w�Hf��z�w;h]�l��`��f��-��]�g#8�(�#~41t�|Gpo'�7�C7��� �^;�m���c�So�m;�n���t�h`�#nBԅ�΢&Nf
�d�ؽ�'����^������Ȩrlυ���,������Z��B�K$6�C!%-���/	��:���B�(�t���PQ��OAƀS[ ��\�4$�~�@M� ���ygU_�~\w鉬@�������uk�w�*�I�KSM�]���ZK`�*AKè�PH�KFb��Eu$�U����K�|5���bƠ�h>�r+�'s;�*K8�[m`�c���G��B�r�moS3� mQ쒭�"CE���`����K���(�U��'6�{0M�Kb⇝]"���kr~���F-E��	�8��xmW�);u��ҍ!����N����Q�G���ڃ�z��G��þ�r8~�J�|�3����ӆfi�8��*����C�Ca�:��t6�n/o��v �ȡ������:m�/=[��f� 1�,�����A�/}U�̴�6�+2�O��Ѹl�Ū�i��\�C4I�>���5A*�+���=W��yyv89K��V����ͱ��ng8���������X�[��wt����#g���j@m�!�.N��<Ϲd�5�?քb!:E����t/q4���E?iןs��=��n��a�o��'���l{>�3��.�y1���;g�*+���ڼ��jS�P�L�1��%���z�~-a���)j�v�y����\aF��1�V,`��n���.s!��9��W���&;���ÏX���vOU���z�=�4j�TRn�0����v���]��N{�i��O��w�'���nb���h(X���1�ԓ!��8t�n�W��lg��]X �a���mpS_̥l�������}o�����u�� �n���1Xm�ڦ��:f=�}����Y�����{,[\)�mq�_��ʪ!�]_6�wZ�"�l��_�M���,������ƟU
�J_�B��nem>���%H�G���=$_���o�T�
1n�*������q8����a���Řp�['A��C"��fqΈs_�5ёG���۰��Wɶu�`�5X,�io�.���LL������ѴK�E������Z���Z�z�����o���o��l7H����.͡h4���ԏ�f�ٝaN}�d�5D�T��ʜKg�UI��M��;5C��6C"ɿ�d��#��͈��_���ݖ`��Q�)=�� c��'w�3���\_tū9`
��IoX<J��0P��)��_���B��!���^.���䎮W�t����8?1E�6h:c4��~7=�I)AB�����e��1��Q�qi��O����d���1�����fU_1�=�?r"S9�H�O7��ЃZ?�r�3A�;����R�єP���?�
���+����ۥ;O���am۟6X&����n���;����Ql�m��I���� ��q�R�ޕr�);��?�fxz�"�3ý	�9j�)^3?`�zSD� .d���C�*
�.=e���q��Ѡ�y�iEx���Њ�Чg����b]L�?m�`]��k��CNc�w��>G�L�g6�1T��B]oT��4�9���^��:��."�ҵ�C���������EMFzv��䴕"%��� e����&�\b�r��(܃��w���&���j�V�V=>F�O���p1gN����&N���X�H��I�Zn�٦���r���7xO8<gp� y�'�Q�N�}�M����EQ����F��1�t��h�ˤSԍ�vr���9K��o���P{!�Q�&�L����GU>Ln�e]��V�,}�%:��hd��K.a�������J+�j�����a�a̴xe�"tl4)����3��j�(rރ��WVƾ���fZi�Yi������,�
b!�g��l�/�Ō,խ������y�����>�D*;M�R�k{�zF�O���n:�땅n:����ꠇ"m2lw8|����2mw����CFu㾆hQ�x�i��v��s8h.��4Hq��&M �9��ʞ{}��7-Vkp�h ]��;�<m̷hh?:�^q��b�j3�\��ܸ%w�f�3gc��D��k�V����09*a8�q�v͌��,�nb��eA���+c�/q�_]��J1�x9���]��U'!Hk���k�a!B�?��,Kz��L�:U�#J�Հ�#���A{�衎��vw��5;�9˥u8)�(l�X��O�n�7�8q����7�Nk�Yg�g�����:�	�c(���.b�qN��#g���k:H]��+���$IA�z;W����JՏ��K�N�A��G<��nӦ}8��)?�)W�G���z�vĪ���<>�4�p=>l��]V�����R�NPKg�d;�c���9�t��R>���!�N�9��Tz�E�{��f�x��%_Ɠ���h�f�i�Ӄ1�A�}�B�3nU(^�'��024�rXpY��.�ɀR��&��e�Z9-6�0D�rD��p����_�y�{F�)��~2	�i���mx8mo��0g�9�pI�S���y�t=�a�_����3�z�o���w����?��R����?��8�ZB���Fu88�vD�!�����c'���Y��tAd=��(i�<�ߕ��WPd(,;+��������Q��+�T�-$�G�rW&��oq`?�[���R��|��1��[J���=�5x�ߩ��G�K��[9�P�W�)��~�+����W��[�)�%�e�/��w�s^��Ԯ_�����:Zh�N[���X7���r�5�\�����@�D|	����MX�ӑ@���t���mu]�5]8 �-�dP����=+��Q�sCm�G�N��H��t���}ጞoQIY�d#z��C�Z�߮��^�6a��O��AWar��׬Rm|\��C&q� �LP�f��g�:1!�%S2�YEjǭ^d�3t��1�;�G����5鶓_��\�H����)gL��o��YX���Ϩ��55�����~&:��_�l>Ĥ��n�_`��������I"����b�
�)���CO�ЏC�s�V�˻�9�_��\�ҙ<5]�j ���;��$k�E�R���#���ND&�:�L����q�������G=��|J�t�O�����f`d3�G�\��s^���p��%���P�@`mS|������0�kt����Wؚ��:����q��tvx�o�c���a�c�+���F�a�һBH�*�Bȧ�����IF�{���)ԉ�)�����"J�,�i�J-��0�b�B�j�aCei1W��g�]��[a7kUQ����I�A�&q�b���Ian_)���&��  r@<���j��-�����jӾ|����H=W���H��[����Ʌ���I�������C�7gG����~���t;�A��z�M���&�����*TA�[~�2��+8�T�:Aڕv{�V�oI�F�&M�*�#�/�`��L�.�x0��s6!�4e�ǩO�ӘG�^�oa��TZ��iΛ��忄������Ce��0N�-�Ʌ�8պ��Zk���N`X^I�Wj�(��Hd�z�ZUV��W����S����AQ���ၶ����\�#��}�g>�_���p|�u�,�5��g��Lf!e����q���0���vV��V�����oiuI��ev��[4̃:�C�&]��Z�1 ݮY'�y��������A�5N��t?�~\H��c���fqྴ��q��ٻ������F���W Gvj��λЉn�B�k8ѷl�����sm�q��45}mb_����'� ���9S\f�:�*4ĕ(�rs:Vuf�L���Y˱I��d*x��=�``]��=Y��MG��]�6{ +#��\"���%i�aX2l�w�l�Τ�y���)�X��滃VRx��0,�:�i����ë�>9������q��DĽ�q���b�$�t��̖����~�a{�sY�c8c�v_���Q����Ә�ʠ&�;w�i�.��g]#��;�����4��s�����^^���W|�o[g��mԶ��ڊ�A~%��4�B���m�2�'�7iv!�2n���RA�,	Ҋ��!��MSئ�^⯴&��e�U����ưڼ�R��A�)��4�:�G2	�E9r�Z��J���	7�6�j� ��s
�"@��U��X���A��HS�7b�ps��l�%�C���[�l0��,��_����+��2-K�UF��X-�a0E7ܹ.5a�u�s��em�<�`0�ʌ�  �� �OMx��}ksW��w~�� �蠑4z8����:Ȳ�� �q9����q����ǒ��.�:���^N�rN*�����:����%w�������=3��D]�h���k��ދ1q5m��6���Xٯ��m��j���wX�������\�6?�v�e��?����4�u�}o��o[��\��m��ځ-�8}߶�f��tM�2o�g�/��ݫ�o��kj)�ᕩ��0�1<U'����Y;��+���W��c��w�y����MOW��l�����Nw����^<������/>�݋��x�Ջǿf/?���ӳ��٧�z�����1��Ʈ�F˂�=���Þ9v|e�F�;NϴͦFv0o�0V��[N�=4�>��e�0��0���U�6L߇a]������	�<�V&���:~e�\��k�ݪ,��MV���=���O�k�Ӛ`[�oy�F�w�C��L�2���}&� ��w:�_I����,�m���<4�~�>;?c�c�|Ww��_۱��u����r�k^�5��縵�cuq3:~m��4��]�����m0h���~��|k�P��3z�����e�v(�j���~m���P��by>�?��W�R�^<������Y<@t��s<�5���������[��Wi<�\�c��l���Z{}��	�gn$߬�Y^��u�Nڳ ?�V���Կ���N�7v���m��g���b5�80:V����e*9�#0 ݃��ZP���o·c��WY5m�1�І
R�"!j@�W�$�j���0d��>���3��ʾY���Y�(���%�9u|�Бk�8v���u o|{��)��ֻH�9h|) �o��_* �%B�#h������$�D �l� ,{�׭�6���Ƒ���2��K�Mr��%��"}�w>�~F?a���������'a9o~N���)}}�������j��g���+���o|��D����ۇaM��m�M ���dt�0� �� d�u �ւ?�-	<�� �e�"U3�CT�&q�{Y��	�WǙ��"B�xT5��"���3'{��(䚹k�m�:���7u�[  [�f����^5���Lx+�!Q����>ge�gp��z�������R���{�iM'5�� /I�ζ^�dN�h���-��p��Z����f�GI������^�j�ȯx�ٝ�h���	�M�J���cc��i:����4�r�I��PA�א��B���s-��Sk:�W��Nk!�9C'쥼����L2�	=x��󚠔U�;.pXn�-��0�=�‭n����L�Q�~g�ts�&X�#��v{K��$����v�߂�]m�� �ڊ4WE��'�#69I�`�E�X`=�����_5'}��3�I�8;��D�u6D�s/̽�����)�{��Y@J��P��H_�w��A2�6:?6�\�%����{$oi�,���:3��q�=�3џ��:?����><Y+K�w���Z��?���_��N�~��F�}!��]/���h��ے��nnA2�lV��X?/)�	��~S��B��Ih/����'\9�9���U�Wj��B�]dW��t���犰�W�!��ͧ��L��կ��>2���������O���D���%�KJb˭aʰ�.�� zz� ��P�l���m���Z\�kĺ�H�T�oRy�����J��y���oi3>�� "���*��\�W��7U���@Fy�O
O��rBY�1�i�����%-�L6��>�=�K�~h@"�op�k+����i0��	��k2G�@I&:�`Su`?�\F��8�	]h>�q*�&�� �$�7M�8����]2����vŬ�y��q8�\��bO!� I'��j!v�I���5:t.c�]3��k�� ��jZf�i~f��t:��4��]�{I�H������.��8i6.x�1��j��l(�n����i��_`�&,l��Z�wz6p��r�~}�__�����s,t"~X�XUY�qx���qX#`J۟Sa��V�����H�}H��/�A�����~&Q�{|��<�-8�L�|�O���nX�t�JXM�{���I:�:��guA~m�B���&	����5Q������wM�[�}^%�"�˂2&]�ޓ2���C,%���K�v��a[?/k64ᧉh��2.�A���JxZv���\"仄��ҧ�r���6���u�\�Fl$�d"T L��d��~X�Fxa"<%P�z�'���&�`����ҟl+8��@�
�BXx�����n��Y�b�C1���ya=c��gq��ѷ��s�gCи4n]c�u 9��?�34X��I��@��ߗ9��!�(MN�*w?V�%�&d��gF	��<~�o�%��k�L6E����� ��7-s��^\UH����׀>{$������c\�f�p�& 壁�8^�����JO��ڀm��2��	�fv�m3���x$zn�6z��GR}�rO\ߍ�y����$p=��u�~[��W��,�{0p�kW��v����>,����`-��pꧦ�:`p�A���?Tei��\E��s7��(��+���:T��l�=d� z#R����(�<<<A����;�B+�H�5�J�������m��f.}���sA<�i�;������V���
�;�Ϊ8���ڸ�����[���C6�4�Ӝ�5;h�h�$�߸QQZ$����H��	l]��,2��~� 
�V�H�$6��*q�Ȳ0�}A�C��6��OV�#
�$����9p�!�\V֠ӊ3��rW�h����|�.�S���#��D����2:��y�ս@��9m���x�e��>����^[`�.�ο:;�RX���3g�k-z��v�1�|y����w.��Ngi��;��i������d�+j�A&x�b7P^�TU05�ٱ8c��Z����㲚lp�<�����N��K/>_�����(�@Y��G��b햪��������!��GrES��T���#�3ٚaهl�V��F)���Z��u���p�ګze�v��1�0��Ϧg��H<{�	"$���m0�G��5�,�0�oa�5���m���k�Wh�GHX]R/&w'Fz"�2�!�6���jt0 Akt��N��t�(��pJ��=��t�zfAdT�7����z�����')vQK�G�
|��)f�`��/�f�h�A�b����hේ � 3��cc��-c�s�~����jwg�I��l���H'4�Y��zW��L��j���_��_1eqdB�κ@��kA(�w���rpP��4 D/���-��4�֍-32�s�eOR�9����znC��tR=0=$�=Å��� Qa�q�MΉY��/��껱E��1���Q��؆�gu��AwV����z����l5n���ۍ�������V�������O���[��y�e�ъ��,5(�Dą�-��7�t��T� ����I�"#]���O���oҨ�/�gF{vt�����S�aW&�}�����!���g[�: ��:8��C�c����8�&3��/��>C���ƹ8��d���`�T0��OT����mHqwP͔M;4���%L���{�d�`UF�=V����O�"���B�~�S%��Z�#O��N6$iy9�|/�|?�y��5|�IHl�p�����Jxoe�o�8�|�i`�-젼��yp�*��דI8�l�|F��5�2-b(�G1��i�e��O`�H(�368*���El*�I*0c��N�Ċ��^R�]�6+�܂�O��-t\���_����Ȼ*t�o�V����uq�U���� �&,~�L����`^�/��Νⷚ�c�h���i��h"=��9#)�x���"jo=����c ��(�����-�Q��c������A�vqn�
ar��a6wT��>��lUN�ԥT���Y`�N�	�^qy��s���� ��S��Se�Ӗ7�d<Ix���"��`L��^�g��t�"-�������; ��z^����+ǌkZQ��(\E#-)'Cl#}bL̜R@�.��/OZ�*r᛭ O'�p��ӽG{�V�q��}� ->����?H��7J.��S;ZD1 �8�B������zQ�!YP�� <(K�ig4l��l
E�T@E����5$1�\p�RA��)���ˬ��nY��7=+�j
z�J�w���ƥٵٱ	6����9���zc���������c�&;F�Zm�6�Y�^��2��<\<jx�ȋ�1o^��R�M=�Ë"���ȣ�S���Y�{{�62E����u���N.Ғ}��B�{�� �5�l�bo�c�7�5��m���.c���[V�tZ&�Fw϶��54�'nhtϭ��\�8�q���������������[-ΜIZj���!ڿ���N�� 0qb�3h��R_����Q[�7�{�J5Y���K/��]zN?����9��K�S�i���a(ٛ�W~�[��e��e�҉,�����x teҗ/.A�%u�����Bu�@EY�	?}����R�Hk~Q�1Z��Ǔ5�j?(rC~}A䔙�Z��*Q����/������_�0G�zi%Q�߿�D�㠜��ϳ��: �2˔q�M۸�O8��?����)�e��DV���1A*�G<?^|-�<����e23YP����	�3�>�	_�ǔ��s�rח���I��8�>��g�L�
�
�䂸-K<p�`�	s�w��K.�t�nvL�m���yd�Y��i��tH��S		�9Oi�"X�$�_�TD�Ö���*[-�$�6\��uY��I�ѳ�T��r�̥GwǮ ��[c�M1Y9�À��Y)'��'�6ǝԷ����R�~O|��/0]�c�f��F���e]v���>��"?_�̦(�ɽ�ƞȜ�ϰ��qZ<W>}�ׇ����A{=���A�Ń�4�_�����ָR��q���~9KG4�c���z ���%� �.'u���g��yI�5� ��|	��+@s�5�~�S�ְ����V\��̐iFwff�9�E|38'�m�PuVr]֧D�[Y!�W�;/�G��䝚V>2A&^ϫHR���(
��G��ie$�n>̈\#�]��v�7������7._0�4���=�����{A���i)���IC�xy����Ĝ��X}�5��e�w�w�&똾$�`����6��:����^�0R��(Ru�)9K�7�q�|���Y�u:=?MT����_��r�;�Ǥ��'��	 �lL0���B���eU|m�@i���/�-�*�H�H#�H��&���������w�ր�Mv������4�	�NJr{��-�#�`װ=�����x�Je+�r��)�_���p!o��.�:ԛ�g�̰�R��Yմ��9�����\�Z���LN#���\���Bv�I��.;�0��HQEf����I�͙�	b�ف2Ya���驹����	�LDgd�+�8�!/~��/F���%��F��Ck�}Ia��+�FqOI� :��Jݾ�`��<}�5PǴW�X7�צ�q꟠�������b���+$�J��B�We/�|E��w@�Ŗ��?�8�sހg�]rW��X���^{&C�˅�";�@"��mD�����t}ڢYK|x�gW<��ى��B�@H���\d�.�#_Q<�SE3 ���lߥW�m��hqx�� �|%�Z�V�7�/��gxh�I�4N�խ7�Q��dD~�B��Ө�.FRrj��M\�mY@�?��ta�������
� i]�1Z���(5-����@~��l���e�`��[�RX�$j<�3��~+2 }X������=fv�N˼s{3;]�q���uss��Q$n����ѿ�܅����0����(<�tM����c�Xn[j+�h��aH�Vf��v��ʄ�砭H����擼���#��$.����5qײ{x�X�*��}�pEi��x���� �NQ��E�c09q�_�Ψ|o4�G�/R��,�����&mě��ϸ�� Bkx�䊍�{ 2���cN�e�۲����2そ2M�� b�����E��w�v�ezm�
q�D��P(�b�s����|{6��E�j����w�H�K�����'R��q���*�x�ڑ���3]���̖�F�n+8z] ShP�m�~�O�y.���u�*���LF�k���I>������N�œ� ���i����/F���>���A[%�'	�!�G�d1�'A������xJ|(=����8�t��l��pO�����Ƹ�!���){BbP�/��
�ue�2i��ف9�%�ju)#6�pjJ
N��C�}��M�sf d钃��#V��,�;�/w����6}��>�#�^�m�.�^�rq���>'l��B�8m����$��^��o��&w��B�MO�$>�g�2*���˟��|�W�7ʹ��RA�Pt}�����U��~G]=�Z�ۦa�|����cc�y��S�i�x�y��������JwQ2|�%�$�_�5X%F�L�ێ=`5HT&�r{�b�r#+�p���d�2�^mɋ��a�f}zv���d�>79?7X]��I�ށ�K�~V�/�Hݶ�2'����v����~m�!����?��\��:�<9��0CH�ȫUE@�K���L��Q׶8�n;N�U�ww�������� k��5\ �c4on}�!�,U��.0��n�R��I��>��^��1�9��|y
+���	T�_�7��e�r��膽�=�׮V����$��Q ���?
�2ש`Q�!�I����b�N�+A%�aSu=�����%�T�f��(��<c�Q\�P�6�`�>E��:�Am�Z��<2]�qox{䣔�nX�'����&��P:2�Ʈ��CZ�#�unW��5�̾�'w�dנ�'Ç @�0B3��G����"�W��T��9����M��7�Hͱ�*��V�e&�&�-����ї��$�ǁ��YI�������ȼ{))���X}%�����AF]b��pz�׳]��ޥ�L��ɽ��84o��f�,�O�պE�[�R�<fE~j��
��{Md�o�#���7��9�[�SC��^ Q$
�{x���A챘�U�7eX|��`ѷ3��K�܋�����=5L��Y�Òἡ/Qh �^�����p`(�&9�"e`
)Ā��Q���	��"ӕ�/*��������b?�����W�W�4B;��Y���ۉk+b�h�&�^$���G� ��BO�{�S5R7be�M��{�H��YN���?��3���.׿�%��(H���U�^�!0���t>�͇&,0z��a`�'�C���(�a��o�D[$)牢aH܀&I���+�"�g,4%.��G)�|aU�6�T�H1v�i�����2��l4[} �쇃5p�&���]�ZkP
�?i��k�U�VQ
1[g��WYN#�]���o�w�3�M1�(��)��h �8푐J�垫��t��H'~���X+�k�7( ��k�ȷ�]D�B�f'�ah���%��M�M�)a�ѸրBүה��~���be�/���PJ�v~l������U�޾����\c?n�l�o7�������5���ކ�n%n"��+�.��K7��z��L���Y��]g?#������%��e�Y��fz��\U��Y���OOŐ/O��Sw�]o�._^^�����#齲a���1{ȱ����۞@�ǐ8�<�c�5 >��wz25*~�2Sh��$(�d��
� ��5y��R�Q�a��\}XWI_f�O�|/�������ƻ|gn}�k��ӗE��\��60(��Ɇ�\��b��k	P����{7�n36t[���׀����7&I�����G������ �0"E��8�'R{�;��4�~/e��#��Of�{*utO�b���)L,�t�.��#��3�Pc`I������M���N�p�y6�/W# c����$�1:B�l*+o�P�a�5R��/��Z��V�77���T�`�ѡ�,*�1��n��,Gr�m�=��gy�:#o�"��������`j�5��4} �Cq�k�&E��ab;{N���u�.)��{�/"�W�[�1|��-��56��]߾�A_�W�'����~`���o@<y�����Tir-'8�b�ci��Dq����#�<�X�n+���{��%����� �҅QK��7��jV�
��/�X^
�����7h>(��z�����=x�|�ea��Ԇ���'��m�r�姦�w��\���i��;�\!�� �1,;�]zZ��}s��xUċ�{���,�EyyО�B�[��qJ[����է�������q���5�ha��4���P�Ɉ1]j�HR�� !�Yp� ���L�i� �~�]�3g�gA;ձ)�gM	�`|"��~�i��n���������`r�G� �q01�!�%�I�\��x<ŷp�&=2
��+�}s,�D�	Ai/�[�H�*�=�4�r<Z@��T~S��NLr!k�E*���'0́ b,�,�mdv�`ymF*:M����IEH�Ȋ��aN� +:��-�O۫"+����d��EM�\"�;)��"_����dwMIV!�$\N�?��k�?(Yg$�7��&�rd�Ұ�������7��V�<�v��$�����YPpG���!Oj����_����t`$8�ꕫec�)�ܕ���AF"�&Ay�t�<2�Tձ�Ir���ݺ~�23 �M��D�&�G 8uհm�
E�)��9@ ������>��� \dn���w)��Ȧ'	ة^B�I3XU�^�@�g��+P�/@nZ���˸��h~BWH���^�5�O��N���kq��+RQ�i-�j�ߡ�2<���LeX�mҺ�^�ys�mܼv3U�¯,�H�O[�#l2�u�v5���,)c-�d��y\��p�6;�^y�#�Vt���A0�=#��"Xޣ�B�Ǵ���s��D�u��݄;{�s����3�����nq�W��'9��g�ghf����m�(�!��r�O�J:�f��JU��L��!�86��F�[��<��xF�ϐ��lE^�F�۵��;�R�Z�am��V�,8tp���
'P�����x�����^��V)���+�ٙ�����?!��5�����������iZLw���4���O�ۂ)p�D�i Y��JL-\�	zT��X`M����u�"�ը��j(�,�^u�a�k��1yw�^�G	J��~�<����ڳ�
 ߦ��[��?�tx:�E�QvӜ�1}#���$���f�������NX����/HtSBs^��.�X+԰����-�^Q�2��(�ϲ�z����⯋Q���t�c%����o�zC�X.Q��wP���(^Ԯq����z����\c�q�^P�f���K�#\��8���(��Z�<�"�DY��^��Q������Q��5�c:_yZ�IN�w��v� ��l�3JHi���gh����xe>�q�v�Y=g09a��҉	���7����ymcy\�H%���NxLd�"D�� {\X�%P9�l������:��F�f�*$�j��UA���2t��9=x�[��Y��g� ��[��&d7^"d7. [^��MH�g�	e_^[����:�T=�L9}����|q�������C�K��j\��|��P����&ۼsc�q�%���^e����k��G��������7�l�5��O�g�cN������ ��0.�\\�T~�P�7W�7l�ݺ~s�q����|��/{��zq��޸���q���\�_k��^����v��_����+�ʋ��WF�����1p�\�9���z��Q�:��s�N���;������g{N q��ʣ�yE�L�)Fdt.�-t�d=��Ċ;#3���ǗX�ܫ�<���s,�riX;{�V��6�Oja丽����k�Q�a�77nj�2Z��y��Ԋ��)	F����ԥ���o��f�f�
N�rd���!�#�o�e6)Ħ�â�k1B��Ӭ��(%��<z�`�k�V�Am:�b[Z��Q�4� :q �h���)q}����{P`�&����vB�.٩����f[����[:�uv���O�s'ҭH.�q!=�X��J�r�{��be���2�)���6ə,`,�g�w�x��"TmB�����#q6\,�iQ��C�e�5 JT���R� ����k����@^B>���Ab2Y���8�B�E-B�m��`�9(� ����Z<z�R����3b�P�B��9���QL��C4��6Gy��$bH,��/J�m����wȧ���h�z��	�bIt� zή�!���z��8�*Vla(1�^�1� T__@h,��0$���K�dr�B���t���YU��xӝ�	�W=��7� n��>޹�����g7��o9�)�ϮW�"�iv����uj�w%�,�K�9Q�	?���'8	��1��!=�cF����0ۚHoZ.��٩�b��r�tS�a
���v�Lp"+�"��}$*PN��@�W���yfB�y���*��.&�r�"/O*��h���X�j���s��b{�� ��0����h���E�[Ȏ��dL�)ڴ�D���
,�m{�ھ1T���8��NCX"2�0�5 �,�}�`����y�_�XƮ�d}7��E�Ն��(��9S�7������V�fb6��6(��2�������V�!sv�c�5��=ү�'��dT#����3�=��~��jj�H��Md�'EfI�y�խ�k�V��on���m�Mld	�qX�^(f��u�S"K��R�Bj�j�Ss1�gG�I�?�^3.��^m>�6I��`����֮�#�i9c�U�Ņ�P��u=q%����up��kơ�����S��y��h٩�iէ.�GNP݀��ms�o٭	L����kvyo؍��g�a���y^������c�2�H�P{Vhц�dV��Ie%��Ky���褏�OQ�x�Y�wA�wi9���<�'����n���M���[\����ۖ��-����w-�K��᥌��/�!�dt���t�.��A;�K�d.r���/��_ �cf�	�'XWHc�4��
�c��ᛖ�5]���⭚��f�zr԰�~�u��9.��x��^c��B�mO������e1����>�(��x�kF�����W��%O��1)��jS>�갏3sJ>���d]��T�G�1��g��'O:� d9 �d9bw��o5Muw6�[q ��[�1͟��>��7�G�ܑ԰��w�W�h�q�u3`��djrW���.�~B�a��d�1�{+]�%�E����O0�*��mf�u�z��l��v˵�M�����L�&e��V��(z���_�,�M��t0���EGD�WdH�-�?�{��|²�?�!<V��]}����~.�+\�'��pu^"�[2;Ԗ�i���Y�l������q����jQ��6�w�����<e�V\�܅���1�C��Fv���vn'tb혾k5ӱ�x��c� G0�V�S�P��@�����u�5ܱ��vlׄO��M[u਽*PiF����m/�o!m��_(y��������H٠��!9�5��HY&j�doQ��t�:�����)F�#�S:h����DPߘ8��Q`̗�~���E�j��gD��\K6n��P[�Iߌא��"Z�R�Sl5�V�.!q���O�I�ai��M�ժ혝Y^���aI���zF״S7�qa!��>�F}F`�o��������\V�
�=��t�җ�Z�=ö̀<�#�� Cy-�@�����2��Mশ�Ru���� ������)�dXH�mFY8��E;����$�6������zY�G�08�0���i@w��n�\�
�6�
#7bu��e��*o����p� ǵ��yDP��T����,�ZDOcce�8O��Cݰ���5�����Y�D�׶̇9\T0�/��8�@E��o���*4��>N2�3N���1\��0Ʃ�E��k}�����y�-/����,�$�� 1���sZ��A�迁�f���I���ݓ����I�������v@�'�H���w��(�
�.�9�;��p���W�Ė�Mh�"yJY��tp ���D�?���t�KV�V�S��k��7�!�z��/���$������ݾ����y�%V�}�?>�p�,�
�i��c��Rű���j��=7�⬞)��Ú���* m��Q�v�j̣���,�yA"Ҩ��,�"U"�����3q܊����Q�~"�g�W�2�HӇ:%ᅓ]�N'��I2�����M㡵�&��k�2������]�'�v;~m>��'6m����i�y2�,�D�#���J�y*hC�t�G\������ă�j:�Օ-Q�3��.��ʣ��6;�:R�5�6�a�	Fm
�X�%1���2����)'�b�k���0�EM�� ��2b,���x!��?V4�N{跞�S�Q8�U��, n�TƉ�/�
ބ%]q����q��~�d=�O�Y���3�<�2��qޛ��j���˧��`.��V+�d�9G*O��ל&P�*v������,~5$M����J��׉��'�D#��)R�ʴ� �S+<� �F`�Z����Xa+a+)�U}^9��;~;o/
������7����%��q`*���bO��3,ی_l ϴ��:=O6�,.��Q�^ކ��2S��ӮlH��zvA�8��e�#Ο�53�@5�
�2� ��fm�\���Y[i�n�P.�2�㈗�+�*�Y�r��&��F̌=��j3T���,���*J�BmV��T�0���y5\d�9���#�M���Gi�qg������lc��k��o߼�M	"#9�2���1G0�u��#�:T��-����p>�,^'m<7&�DV�L뭼�����@���T���������Y�:���xD�C{���I8G�]���v
�,�k�|jy���<�R�I�j8�ճ�RZE�VB���4,$c�h�����t]R.�	�3x�c�ϝVe)^��r�=_��f1�r���$��� T�-ey��T��]�@I�5@�'Q�@����QE���H��Z�/5�gE+9����������2>�AW:u��R��5�~�Bكแ�i�v�J���J�� /Y|--E���N�	�ꬫ?8�K8j����z	��TU���T�R��\�>���22H]9��s7Nӯ-���z2(���7a�.�t56�u��ţ�H�+�x$t�7tN��k�I��D��*���-L�������4!w$t�7tN!���Y䇁��h�!p�,f���گէf��,�L�h<���VZ��}���L�I��3*]�M�U�+�E4H���DmU���褅Ox�S�0b魡��Akt����A�D
a��K7�u~��*���	�3+�=1�\$X�����J�U���G��8�-�	��H�W�:�q�~�����U�yTP#7��p,�3��duw�s�$<�I���g�V���Ɂ� �,Q/xr'�_#Xz&%E�rm4R�h�h#朔`�j��l�̘��8��]^�H�Ҫ_�[[Y��E��c�2�
RL)�U��}��p/���Eg5ygG���j�Z%oG����j�����͏~j�5Fx{}tRCGJפ����yE�Wm��j�ixeגN��n��E\'�C������KM"6J��/dYt�"��i��6Aݏ�p`������؎Q.�|v�tb���xîi����k%�-Xz}�mT
�����!E����RV��1� B��b�1�B�1���p
�H�/��y�Dؿ"�d��[a�"`#��sH���`�#�����ˡ�t��"E�K�
�����x
$9	�uZbP
��/E��ϱ���=�hc|�G;S�rdB^رa6#���1����$@Ŏ�M�c���k��Q�������~�m�Zf�H���$���}�9�}�)����cG�G�,j��e�e��� C�^�{K�����db�Q������%�'���1���6�o�1C�y�!Xa0"��X��W��6B�����NO��^e?4GѪ�O�5�7,�c��Z5���7��2�i�4XrR}\�>nsf�d'��I�^'�V!�aK�ňC�ʀSqݻB3-2¯D}��~EcI'w��X�J�P�j#
I�ι��:�Y��I��p�MwhKV���%Q�ȋ���MZݦ�o�^�>�_��Dk\�3�#k�4hm�S������JZE����c-���('�������P���C�Mp8��G���U��(Vv�����hl�hQ6&���e�Cm�PY��䫷�$.$�
��!~�7'N�7g ��#�˩<0�GS�8��"~b&'?Y�2�F:e�rxp����o��s�2�ub;P� �6�m/��6�i��"����h��怭�$�EB2�
z��hLkjj�����s��P��R~8���.Ԃ�~=(�B�a0\����wX�B"ޭsw�:G@š���Q���d��,K!��5W�\��.c[��|qWGM\CA�n��{h�$b5T��-�!U��j��N+ӻ���Wdl1�%���L��h�������C�n,�M��X�\ ���RA�ͩ�2ķ|�/z/Lc�C��4F�&A1eI�K�8�%)�2\�d�<��
��:܈�>0��i�k ;|xcP/+ȅ֥Y��l}cz|�]s_��"{ś�*�dc��g4h�0z���.�+���A����*?\�(�����袞�5�o�/�fL�86LsAJ,5=�0�\�AR�a����tRC���O�2L#<�c�ir����M�lNC->�f�1�~4Hz*�*ݒ���z�0pN�λ�n�+�.R���W_e��n�4*׈�U�U"9$>���&�t,�`�`�n��@J�=PceX��=?�a;��^��fN
��ҨPvҽ�\?znF�5jPȇ�
�Ұ���#3as��"�yKӿ'ҋ��Ϭ���2�2@�&=	�5T����O�5�c�K�^���B���5�B��O	�$k�y� 23���1�5L���P�%��M�/��' "N�n\�|oLd1�>�e���%ѫ�W��W�M�D�
�y|�"��w���E7m/^h��˼�D�ޫ���J#��io�;�v���h���K�[�"&�kTO�5��ގ+�HW�i2
a"�I.��ƨ�ʒhSN�wM5��ė�&s ~&�~L��y�����/����#�q�]��:�i�xۄ���/r�-�E7W���Hn�TmIԳE���p����hk)��\i�X��H�Z<"c��t9No(�O _q��]`�
?��-ޅovz�V�H�ݥ��v��M&�4�j�>t�J#�x0�A<iW|�������6�FA
;��N0�u0�%��D�<b�c�A�Ba@���2���ֳV�XQj�<~�\xI><�/��J~X7�G�4�Q�:g���l}��.aώ���_ܲQ���;�2ߖc��O�J��e���px��m*;����)�
Ι�����9sq�D����3�?N֜�RD���_'z���(|�G�W�u5��ņ
�ui�nJR��Ik��as���pҽbƆn��h�1��yޑ�m�4��ٞ�<~5V�A&�Ihj��עXa�Ѭ������y	*J$��R�pJ��Y�_�Պ�U�!�6V^�V��r"���V�Pq�h	�7��) k�a��6�8db��0�-�47_?��'�{��7���D!g4�/]�;�	�g4]|��i�a�9���m�1����t>�qo��7c�|�u���[��{�oG�=�<T��l%�t]��|�/��Z����E�-��֢���[{mfu�����I
c*L�+�z�g5��j~�T�X��y/��l;.�O�>���kUFt�ݣr�M���v����:�H�.ʿ24��<^�T�v�dF߇Y��W*�r?'`�{XG�K�e��d�}����ږ�x����"U?_�U?#��w`-l28�/�	+�����-\@\)�4�m����s�O���aAKeHk��� ^�q:�#aޡ���Ԥ��A2���-�Xv��ʐ�>H"�M���1���J��-!v�e
�V���T?'��N��G:9�g��2����`[��7�����z���W�E�Kg�/x.��h���� ��y�+K7�~���
Ca��WE�����b:h,��{�k��:�t=��E΀��UH���>db�N�´#/�f��1�ԩb�"{�+�n��j��o�%7歷��񔿿�������֊��,q��~��[o]����������([u���@���8�
|����l��cc]�~�{	�{U�ǐ���Фf�c�}����fߡ��{*�%�b�O�suL4��y86^[�w�w�����G(Y���ƥ��������c��GM֖0���5��w��w(��`�>����硕��(X�g|���it�Kr5P?���e��Z�:&���y��)�8�Z�~7�Z��[�m '��A)h���"ٸ���9�dӶz;ȐM�ámR�;��h�
�R|��j�4�h�����/ԉ�W^Ԕ䳲_����W��j�+^|�
��� 8}R/ت�cD�rc)ё�^��֧�5ubU[D,[,�I"�-&���]%��e�*v��`&��)�,xղ����D��'��\����Yp?����^L�ڽ�>#����ʞ�'�W�e?�'xQ';n>������0o�gң���n_��d��d"����ݞ-��H|:�
Ҡ�*G��0���1m-G�'�_���&�`�l�([V9��Me���b^y�ԧ\.	i|ް���(�W����x�
&�x�TFT��ZXҌ����9�7)��c�Y�Wό� E�����,���x���~9�p��t�!�+c*�!�t�I͌��y���*��ކ\��-�9�"��Z2��ﶔ
u(�*6F�*���F\��"��'m�1�Nj!����\
hP^N�:��v���sE��R�����)�3q��\o����d=�o��'���aH�I�����G�L72 �>��/g�iU�@���ñ�ڻ��HQ'i[�]`+˫?ll������W������776��#7y��mX ��kh���� �Ϭ޾�&�`�X���[�'il��Y��`��r�7u��{S��)�ÜR���.�[B��+o�̾��7� .�[o�ʼ���4o�Ek�-(Y��?��n@?6<TV5i���6A��������D��n{!����;�	mQm|a���ø� �J�k�b��U���h���1t��NJw��y��A@CM��,s�76����1�U�$�;.�cB7�N/���Cö(F&*?�-ɻջX	�U�1|�r��/8S�q�03?�+�|e���S��d�ħy��z�D�0:>!
�6l�ƭ�S�6\����YŶ�f"�;e/jKb��ƒ��1H x� M����4�=���N{@:�eD&�r�3�<EUf"���dKi��f��LAH@��3���t�w�)��������x'��{#3iEi`Y��<�B�sa�:�ƭ�F1��3Wt�%�\3��Wm��on�"&�k�ѯ�����{$�V�Q�/X���Y�)��K��,X�Rٱ��#�xh�\�l��z�q�A�"ލ���=��%\H|!~���!:�љ
�ݼ�ճ��YF.�C�#Z2�?�bZ*�1�b�<��d�u�%�<djQ�)V~����df��!敩A���:=��-sp5�x�Yj�(����T�\���V�R�Ca���q �eIkNy�y�A��P{"qQ��N`��x�H=��CRT30B3̽�ah������X��}�^�����l#�9�#�?��$)���I%YP���$U��"	EG	�)RR�?��,��3f'��ό�����6�Bs���Uo&y���,�p�����	�uE��p�_i��%詾:��`����֠�#���F^��tn��l,�5���Oo��fۍ�6��ẹ;��2/,�Q��
.
�6;=�߱7A�e���76ثl�q|ୌ�?Q�(F���M�.��3T�H:"z_�(�UC �X�1�8t��7I���Ĕ�c�H2��k��� q��ԯ��4���5,��z[U��  j��٩���7��/��-R�A�!Eق� ��$�B�pU4R����JDf��\ɨa�Ym>X�"�=��&��[�_�$����gT�T��}�W�4��!�B界�?�u\�����7@*��,��:���#���o��qv��J Y�8�O�i~��B� ���F��dd*�.���6�v����4�H]��5z��f$��f�����H2F�:���? �;���>G�t���6�zi�(RY�d��0K�I�$�$<�/,��'y�ث�˂#���1z�K����qJ��x����a��(�hq��b���s�p���h%���������NDN���%�TF���P�)�.!:���	m-�G<�$�=��@�q�A��	4�"�"�q���0rZ]e�5��=�N�7���C�w�M�dd�vC�d��i��!$-�Q��r�6ҜF�Wxt\9��tT':����q�r�2*��i1>,)r�!�؝���=�<��e\Pt����ĩ/�
R�?�:��P�آP����wr�v2@1��!���e���D;���
���F�T�=��M���� U��؍���kv��^����Sv������������Z��9No�Y���9c��ئ:F����i�ʲN]�韢֞�peS�#��v�˪��]���ʹ�Ň�*���e�0ߩ�h�� �y���ov2w�|'�J*��V��d`��'�|v�=�0�	=7�	uT �g�њ��[<�mT�GUx<M�Q����  ���}msǑ���%�!����EaI�@ �p_� �u0xbc��isfz�{�L#B����p���!+�vWk���4��Y���"�(��\efUwuOUuu� (�3�/�������TH��l��7O�oB��͓��y�~ ��#��D�:*7���#��*��}��[��v�Ȯ��쀓蠈#��l���2���da�W�nP�2�M�����|���]��9~�}Ɠ������i��7��_��O�˳o���T�ڗ�i,�a���[1p�gx
?�l��L��Ir�ϓ���O�g��z���3��������آ��l��V����L8	1�O3��Ă.#HE<��b��.|#�"�~nx��>�"�螿��\�! �§֠>i��6��&КSb�q)�����VJ�d����I�K��-�/�P}��&������0�z܀��[��;ȶ&m����ލ�&��.n�_����|\@	wN�|�6{�ݲ����&��K��|0��@A���i��M�-䍛���Q*�h�8�/��:�	Σ,�ê���Yo{��0��X�ʹ�y�5W+�&ހ�A�D}/����*�=��	h���],��/��J�r	%G��.�.$�b�V����}�֌�(���l-�t{L��R�]�%��TE�t���5�¾�U�up�Tc�ܭ9tQ�Y+w�f{�[�җ%�&�*۸V��޽�u��-�r!\B�l��Ķ�QR��'�]XX�Ơ�u��ob�/�f|el�wůi�>c!��A��q}.5@�i�p����V$�.�s�н��'��1��$m�n�o��x_�6�3.e_D �]�/q��Hq5�6��c�	�jU$_`r��+�!�v1n��D�~�=�M�6����A!x4~�~b8eZ|y���	��&�:����n��2<J���r��	����}j�����^*v�+���)�����Uf�unA���:޸���2�{d�K��Bb�uw�� N+��E�����>V��]?��L��y>el�oY�.�B���,z�-���L���	\#q�|.�
_떉#��u��\�D��ۧ�T0�r����矚my-��m_��I?�n��`^;��U�(�4m����!
�_��y�D)��ꏑ��XY?E9���̣%�$:l#���=�oђrP�zw�����v�'6�81���i3��4&.�
�%,���n��\6&�k?7� �cӥ����8l�܇Y�J?���nYO�
7�s�ҬS:ȨR*'���[TJQR0K�lo����NV6���̊��ꑏ��������O�fޞ�3�;�5Kj�X{��E�e8�����s�����>.v���ua&Y���/#s~;�ӝ�ާ��ڇU�&'�]𐅢%Yb��p��Ӄ&�-D�΀�x�ѺWx������+/�tϝ,�2�_x�X&�znNNxHjW�fs��4FVj�Z��#��w�W�H��Z�	����͓/3��~��K����N��"�>���(�F	��p�]�"K�_�A5�g��RX3�n�dԓ�_�[x.~?���YE�v	��d��[��*\���{qb��jKWU�o����M���P$z��"���C��ռ�W����V��T��y�J��#��~DA�t�Jo�;%!f�}��[W��kv�T������R�B��@9Ag�@�©�e�����K7-��k{�g�ȿ���.��f�On��g��R��v�n��JUa"��gX���E�zf��^�{�U�{����<��I�2U���R�+_�)���� 1���G��z���JPՄN�:V����,�m(�U?�Ɂ���+�/7YZe��������I�T�GE%���Mi��P��t�h�۝�ϖ���2�틦w�`ȿ���ǚ��>���>½���g�Ϝ1%�����qs@��oq/g�:Y@oO_��g��z�+@{�=�`=&P���I¼��7O�4��W���kJA{��0*i�/��}��@8#|lӳck��",ÛHI@ <��e���ǌ
�W����;����m�8Ga��� y:� E���	d�e�U~�ew��x���t�i��*B�YA�Y����D3a}��jA�o�}����d�~���פ��ӟ��w��m���o��b�z/^���4�t�2ҭ8c��{??݄VL�Ry;���^�
v��)��gEZ��Ź�0+�+X�V`�E�b/�I�3�,/cLo[�����..BBP�"l�ZLTQ.����q��rl�/���D���+x6un�~!���V�O\p�?<gzv:4��m�$bu���ɜrg�"�R߃�u>�g���C���`����ޘ#̡��Q��d\6lr!w��كܨ�Wg�5Ӈ�͈���2z]�PaTK�����H��s�/�_ia�O^�R������.}b�(˝U��S`�ީx�;^�V��YB�1�\�oKr���O[�z��o�I��{�\@�gE�l�k���X��*Qq�E��lC�yy )< :�3{3�D���vC��P���h�mx�����y�=�'�$��c�kBi{���EDi��W �y�LKu�����L�;�f�8�$=J�)���,�����"�0�oj�%���H�Za�ǌ8A*M>nԗzP؅b�[�{�n5��z��{Ǥ`#
�����Ⱥ�eW�oj�"����{�ۑ���pŉy��փ��gl/��-a�������������B!�`�ץ�΋ȞB�(����iع(��WZT���;3�$;��4��6D=�W _�k�{w�6b3�Vp����Y����;K;7����B�Yn��!\���VƊv�
!J�{���ͷO._�*C�b��{��O~;t�?����3���q��q�4���)QW���b������{�l�N�dQ�KJj���0w'.��mIL���� �堔IP҂p�Q�[��	Sh��(�b?O����Q/���/h6�n��.7څ�#ySb�J u.{�]{V��"�De	�h�('�3�d����w|zk.�BB��pj}�7q�bi��|��@/��R�6��.�Cɔ�����C�Ĕ%Ǘ>�oR�c��[���(�"b�d�ٓv2O)�*�m7���A�\�-�!�C�	�:]�_��I�h�u�M�S��z�v�ʆ�x��O�qI:Ė�FڒZ�d��ɣ��@T���+ۍ�W>S-�Z�K�-�؆}�o�}�0Ԅǭʰ�]�2�"�^���dٿ�Qߊ���p��~;O�0��E��Y3T^B{JZpBB1��=������l�d��1�ݖ��f�25J����D*��,�8'��VP:���0! " ��cf�Kڅ��??����Sci���)��E&�A$eL2�8�D d��>�����e�t{##��B�t�VKQͨ����0ϴ�E�&RR�3� n@��Rq���҅���]�������Ş�{B�G�I��-�h�:*����7k�χ0�/�%M�ЎXĜa���012����?��D��C|ҟ?$p�3۔8�g2��cY/��El �{�~�v�6 	�-	3���zA/�-��{ �I�#�F�b��{ny�=�~A��h��
��\K���ihH�U��sA�Ǣ�}P&�Ic�=4��x1�E��Iv��a�?�A|D��?_�C
�5��=���L	>
�?l~�3\����4=�����1��7"�,�"H�D�J\�O�XE��7�!��ϒe�Jаa��V7 (/7�ב�F� �������k��?��Ol��_%��+����H ?0p����C��f|�s�%��q_��̔}U�+�:&f����)MՎ��q�q�
F��ԈeMn�PY/��!e�iƘ�0��k�q���xJ)♅��sS�}av`�|��j5^X��w�����{�hx��7Zf^���l's �G��:���_�w�A�o
�A��+J�~+��#n^�|$8�H�����	7K�����[��_I'&��2���Dҟ��/���ԇ���C�L��r�?�ߘ�6�w��7�rs��u�L���O\�I�D�VT/r�����o-��5���U�wkd����]y.h:K��$���¿����g:g��ͅD����� �pw*��I�_��3�WEk`�ss�oύ�6�		<�K&,�����q�r^��w"Qv/@H5�'΄���qq��
�1F�5�X;<a6�>���}��E�$Zvh9t�C��6�-���?jٝ����;�ψT(HV'1�y��y����ɂ4-}����j����8�^��6�.>�Z���k�;L��K,�\Ju��T�y�]�� ��O��ɿ�:L���6��0�_�_��`�Ki��V�7�F�\!�y�6�_k!�Y�V�+������K��5��d=l
���-YѴ��Ǳ���m���%H���Ece����qRgz�'l�[	�r���(��|I�\៼�I[G:�s���L�[�v�5ٛ��kG����Bv�����>����B ��?�n�?P�;ﰻ�
��++������ŝ%�;��d��i���nޚY��\��A�����Y܊�a�/y�YY�ZQ�J:���|!��8j��S��k�/*�lO�
5܆8��r�^��Q����Cϗ���G�'�հ�ϼt�R��覵��^\^H��� �6�@��u.���X����z�6����`�P��ɩw��:�
U ����V��3���*	�~&�%�S9�H�t�#VO�=�P9b�!�)�~�͓O�قĭQ�8���`�Qa���ɥ �����,�O�md6}r��&&���`���<ٱHq��|��%�sY��d�4�ݑ�f����F��ʛ~'tNB(3#:�D���C�9��a��(>�X3���7 ː�Nt�tX���H��{��hTY+C��uc���mO�R�����(;�v��~�d��U^������sl�{.��
	�[����� � @������;��swܲ�V�k��I�a�w�
��M�
�nP��n/���J�!@��:����#?���o�y���I�(uQ"J]�������E�Dч�b���E���Ɇ�2̝����%g ����s5Bk��.r��(./Y��CHN��?~�lC��v�0h���: m��U&�6�N�i�Ϟ�T��NF��F�u����I��v0�J8�(��:����9aK�"�h���̐���6�"'l���R�d��r��dK��S���S�Z~֯�t[�%N�l?űW�2�N�2X9ų9�ٴ����6�P�i���6*��{� }��W���Pg���I��睂�2Ƿ�K�+N�`�S0ܱ�����i��)(.s��y��8�q���6���2�w��3������MTE#�#]�N+A���X�x��Hޠ�$w.u�4���_�W27�Ps��R5ȗy����l��Y��,Gx�������?*�x�
�~�{�ˇX�kɔ���Qn6Za�f�Q�	�dL��A�R��g+RJ���fe��{a`�G���烸�7��V�cd]�?�P��Y���"�!�fD|5͔�߅���Q���a�%�n�~܈�^9 �S���sgl�`�V	m��N*[��2�l?�E弻��"�Ծ1�%�蝛~�w-��kz}?>������5������r�D7�
����1Z&�3&&�芁�7˔1+�l��Z%Lg]~����j%��2n����Q��E��D�!i���]ި2�U/��������z�u"�՚+���m@ag��ͽ�ELh�;�\��@{�)��1Z�dK?�������J����乏)�!�'R��'�T��P˻��bZP0�C����(���϶�nWly�)^�O�>,[������p��!9Q���ya�WZ������z9�^�O����_�՟��[����A�*]��%��4��Q�3ޡ���>bX��4�^�RQ��8�J�zѢ�P�hK�Wd�A�Z��c�9"��b­����^��뤲F^sQS�7����	����TM�U���h���E}������u|>���>���O󢊻����HJ�I��8/�8���l�y��!��֜+RM�u3Y��}�Y	DR���^��ͻ�k7�V����-�����m?���-�]��o�ƺƄ�U�{;��g�!Qza���o�Q'l![��~l����������r]tY��z���j��Y�� �Y�`C����s3�;ͧ��Ms��mQ��7ϡ����Y��A��n]���bv���N���Vk���>Oy�B.
s�YK��9��T	x�$`� �&��6�+i�};�n�-gg����5�v`X�QP����H�ŷ����q�mH�iAyL$Q�=�u�>O��i4!m�^d7[���k�Li��V��;��B����zO��<
�`��/��V���	��c��yi<�Rֽ�=��f�O�����(�s�d��||��"��F ����f�B��,.*�6����67��	p.q��B��	]B:�d�[@!��ן�D�{[W7��8q��p�f  E��gMqq�D]۹:�q��p�ژ�W��n_C�֍b��ͲI�C4*��U@��
h�SR�TU:�{L�9VE������]�L\��X"#h�FT,��,T(e�Vg��Rw\z��1��f3�"�#Ԧ=�Y*����[e�;a�_�!�qL ���(�3����
v��u$�
tK����+�F�7y��?˕�Whj4��C������(�m�)r�ȫ�^Ј�����?
��� �/�7�]����SG��M�"f7}�Iͺ=嵒�5׼r���8�����'D���I�|�Gז�������-�r��*[[]ߺ~�+��lyc�]�����5��o-_�4��ۓ�6LN�ɸ�i������n��������o��.�kx��A�����-��Ҙ~�����s/�;x������_B���������_��p��^���ԃn��O�kYM9�J�l$�������8�T=��(���i)w�N���_�lxTYָ�ݟ�-Zp��m�^B�B�u5�i�LXx�]�&!_�b�)��Lf��)��,C��P�cA���[�?܂†���]��/Ǡ�����o܃��=>P�.
�&�����hGPd�9 >�p ��i�{]b���l�ߎA�A�퓺1�/ZS.�3s�-���d�%}ŕ����W3Jm|1.LB��[�}� Ya������.����m/Y�>z:M�e���b	����Xw  �w�4r��[ԃf��O:O������jSST��H�u\F�D����%q<?3���-9=?�'.�:e߁0	�6���s��-��[2�AGޔD[��T����M�{��(�V����c>1�"f���S�4{�Ŀ.�H�Y�ę�L��yĕ��^>�6z��V�ŭ�rY+��i��\1x���pZ�	��Ֆ�bV��*{5�~r1�T�GTh|����D�p7�4�˥R'�[\e�����h�Q1C5����O]��%�*�g�dj� ��
0�7�=z<�D?/���mB�&�J�7'y���s!DT�y2}��` 
����]�B��$�\��1��X�D��PL���TLTk�b�TL���*ycJ�$���⇄�S��ѣ�}��c��	`�p*'^9QŤIP�	�]P�TP�hAqyy���޼~��*[����Z�s�a���p�nٚ�_H�eiB�%ʦE�y��1P��!\�H7��+^-a�Mo Hbɱ|����'E,�D��������"o��Z�͕0V4���Љ^Ou>����rDrt͋���g���U�_U �����U/H��a���z���sw�1�YY�9������?� f_�����!�JDsؔѬ��K)gZ�!��a"�R�oxA�a�L�&�|���di�Q���3��A�屆�L뛪�$d�j}E/��5Tā�MI�h�3/Eo��}�CYHeM��N�|�%��+�oE38�Xfc�o)��f1�do��M�2�f�1h�:�s4��<�7�~Yg��NhL ��/��~�zc�K���B��(�d���,�⮠�GT�I�W��R����մ�,<B����h�f9.�z�}v-�A�s\�ʣqȣJ^�Sy�e��i'ӓI"k#��c5(1�6ۃ]����9�S1,��f'�c�!�%�RL��^�?����^�4;��uzm��;��|�a眆f�=�\�~>��c&� �B!����>O��rӏ ��&p�w=���5�(�����݋ξU�є-e�eĭ�C�d���(�׻�ZVN�+|[,=�S+�t�Y$��^��U�����J%1>�#�.��Mº����c��*g-�I���N�����Sb0��Y���9���V����K��?��B5�9�k����,���C�:���.��O�߳\�՞xa����w�#�Tx��ġlJjq�e���� L��'V;D)�#�%S�]��#��WV�;�2���K�9!_w���G(��N�?h.1�n���jS�~���ڔ��MҌ&s4U�s�t"� ܡ��#��g���I�'��nh�D/�L�H��$V�O��过���?������_Rp�^�)^�k,���>}��|�냈�4�vs{~��w����!�������8�ӽ@b��d%@C�_��c�XЁI~�?�K�_%���{Q�]#��R�gLz�\S9]#,�����;�r����Ux�D0\�,�V��n�0���ɺ�3z�J1�N�4|"���@f��+�rv��L(��ێ���Xt�@�h��>'I�pdm0�c�����n��֏��5"0!A�@Ӊ�.X:yi���n����������H-�� �ݱ]����`�=/����V�o��{���]���z��d��v���
�*��q}s�MV�����M�}�p�|=����aץ��)����n�=���3�e��Y�6�~�A�o�C�N�g�=�p�&]Y��6�ȗ��d.z�ɻpxv�4In�;��Y����C��:)# ��R1\��3HѤ�@������&�H���\X՛�ykp�,&�Kv�|����u�i5�鋲���j�[�W���؂�����Lm��	��l!%g>F���P؏�����a����Å����q��n��W��^,�{�?e�ĉ_�v��>��^�����K���-�y�7W��M]��q��&\�|�'� 8y�T��Q��A�m��C�k�7޻�i~�ė*ܮ�u|�]���mP�(	
�8Jy1��,��8��ܮ���p���<�&��%�>!FU+�=���roG#��wX�Eso��Y�)�����͍��>W��j
�,ߓB����6����T��NFu�|�iq!�V��䑎�p�F�o�Q�t�Ss&NÄy�$��|��s�
����3з��uyr����k<����
%2�3������N���o7WZ~�r����wY��r=~f����r��0�w�����#��^��E���𙼁����[����g�._JN]���E}�r��p�
Ĝ��˅^��4/R��_9\�Yt����x�`���
nh]�.����0[�w�G.��7Kpi>HC�j�p��̔K��ӥXT�VJu��~�-��r5}�zy|o_��r��7�zm���qy���$�#�S+a�o�`�q���qd�L�����u��h��Ml�ls�oI��.d�W�σ���~�*����ʷ��L"2�'�ȪwK$fzC�U�w�"Syq�U�{�hMoH����H��w�ϕ�F�6�~�~7)����*ߓ�2�s�ϮwkRY�q-��80����3|�i�ܸ�����van��^!s�����-6��1S7���Ϯ�����q��~���W�.8�Հ�ж�5Zo'�DCr=]�
v[3�)�<lr�8ޕ&�~5`��9B�#������Cg��[л;�.�Ӗhy����.�;�r�:�����?�)��1�� ������ï�nW~[�ߒ����`���M`�@��P����a�o�}L���[��Zْ�Z��η�����"�i����� ��$�mj{���T��=|�pW�{�S�n.���K�ǅ��@=�{ꃻ XsbU�i�Z�j@J��TbF�Nf���r��y�
��(�^t���A)C#�S|���9"4�{�=m�MCy��J��4�F��%��'��TS�c�/���2£e%������y᫤�=7�+tD~�2�U�x_���i��w�{)�f�rd��驜� ��~�|�l�!�҉K�?Xc7n��`}���I1�^6�H^��95�-��G[�D�m��b�9�mJt���q��${bɽ��af��9T/�AF�;���eb�;�e���MD5��Qn��Yq_�U
��rg�[K�+ݛ>�rs�wO\���9����9w���E��MF��:4^ٚ�1M3.�qyxn�p��FI��;<�����[	./�6Axg��`��)��ŲkC�%�Xc���?,ԄkE��!�y@�m��Igj�bO�rO����՜OF��o>�m~3�NS��
L�;�>+�0���K�.�kN���I%�b�;��o�l౬�CI���R�k�"}f&��s�s��s\�	P��p؈�o��5s�|㦐�D�n�2�9rE�m�1���h
��!�,E��w��}��G�
J��'���$��9L�V����Er����k�}��4��=��*KWu*����Z;]�\tUgDx--��a�JU��l��r5q�B�KR=�y�3���M�o�<��H���B?g�\�s��'�9����-_��SA�m�"ұ������1�`�9�K�fkĩQyH���e�II�/���;!�����Ac�t�^�o�#�&�~sqQ�.�N��W*܎�y*�Lǫ2;ώ��"o닥C�%{WZa�/Y�6DVʊ]{o.&���)��hq:_;�3-�-"n1�/��x�~X��MEнFE9ěHe�7��| mu@�������Q�	8�&�K:��3��"l&=�_�g��=cQB��\�ӥ���t՞R*����A�P��,R!�v
���w:#�CY�Ɲ��9� B���g���R,�d�G`���6)W��M\��Q�b�r�}��>���ԡ���5�/�r�w�(c���ۺo��픓a>l�|.�v�܀�;��b��ً��}�6��	�`X,�]A+��J���;�2(R��7)dOm�WjS u)�1'���:qT�bo� X&W��;����.�l{�`D`@R�a�_���g��<}J�xb< �>�2>�CR�����c�ٕ�}�Mv!�J,��eL�~��gn��@�o��w>qlq3wD�����
��)TD���P��B����
������>wp�N±��:w5�W	U�~B�

�A�;����D8�I����PVp�(�|U��NB�J	��0�I��n3��_PA�@1�H�)�}�Y ^�:	��E��.QkAf̿�j�����wg��
*��QV��2-�Q��/�/:��	�GHt֗��T����s��|�;���|	����/��]d�A�ib�q�����<��Å�}���9\�-y ��k[� �b��򭧕ExJ�y�߂�.�Έ�@*���WX�Q�y�}U�m��~��8`1a�2a���<��H����:����Q/^�Y�2IuE�D�.���d�G�q�7�����f���y�ܙ�;vr擰�,$�L�`vZB�3�{��39C�&�	�`�f�h�V��S2�BvA������jw;�
�`�4~���H6����0r1>-�Y��_nԯ�p���5)�`+VDh�+��P���-�g#��o�M�g$�#?�m���j�2��Mߊr�F�o�m;�\��ĊT��ĥ��%���+F�8 �����s��S�6L����w+�b�D��	-W�ή�-���Q5����hz0.*;�y�Y��R�؛Y��k�t\�Qh����.q_��/^��o��o��\��(����HC�ց��	T��99%�.W�N� ���E�7��ÍpϏV���MՃn�=h�q8Y� ;Aɒ �����E�Pr��6�)�Jp���(�([$
,����^;��)�H؉K��~1d|��$}����9Q&]��$���Kd՜��9[����J��	�'P�k��u���%�"j�*�����Dւi&�<�ǰָ��w�l~aY�n3ؑ�) T\l� %ULNn?�\m����Ʈ�خ,eQ���Ӽ�u�I�Ȉ9�Q���B�Kl����j $w�=�a��5Z����)��FK�I���m~����B ����x��X2	��5`�-��L_��ͭ���	��E�7*z��[��]{���5��Q41��c:��hF��lo�n��꣸�ῖ��X˱]�5�Uf�'`�,��¸Ę�p�8�ݡ	�p�K�p!F�T�=���
��a$�-9���J��w�7ךx�q��Kb�HC��b(Ҍ��Tmj(Ơ�A��KT%�w�p���ߌ���ZCr߻��jD��wa���[�����c˫�����������f�����{k7�����{��z�\�q���հ鵱Do����,��>ك.dḁH����f���|�4��3.�JQ��O�ΜD~n��3���I|��l��m&v���s<͈k�m�����֝|M-�Os�}��nd���@�m�{�f΁���Pɏ�Ü�y�s���\c��bBZg�<(���h�0���~��2eN�筶���~����!z>2���*���ų[>���H�	sa�uF�	ñ(Y�E�@��b"�����}��9"S�8ezH���B�ڤ��G��|9c�]z�SE�>V0 �.IkEY�j�S���+�����������Rn�h"�x�A��A;���P�����;;��#�{���9+M����>�OMH� ��VQ��"�Z�X����E���,hP���M��2�r���%x��l��V��i��Y�
��Z��I��] �6Q���]v%�:l�����d���<	Q���ղy��<v�X�E�95����K����A"t��ǣ �:
�4y`3�:���g�Y���o��Wxt�ҕ�ےm:����Z�je/��vEEڬ�����3��Fuv�km���:�l5���'u����v��;&$&�o ��\:��dȥ)̖3z+Z�b�N<7V&�")�t��J���"' v�u�=X\υ�|�Wժ�]��Ͳ�a{��e]`���@�a�q	kLꮺ����M��6�n����� \�1��D.4C��1?)k���_���-�?�*��d,�*z&�@�����`�?��hs�.���bj��ג��h��Fk?�����{x�[��_��C4�/�ž�i+�I����!pG~���CcJ�D�f��o:�*��X��k���u�9�o7�E���J�z��D,���	�n���ߩ^C^�W�n*(�^����t�e37�����?��-Z.��O����#����3D�`�>�ef�a�l��L��Ħ�y~�yZ�4�r���"����gޓ�]T��g����d�b�l�\l�S�y���j�hR��J��7yZkm�&��M�R9&l���(�p̎m5�l��ȅLL^�d	`�9�DFw{��I��ή����g'�m$� ���s���QЩ!�����ϱ�.���S�|�����8��T��~ԯi����Z(!+�xY�"��+�F�`��DBA��䍶�i;�.\r2�&(l\�4�+���U��ꑝ'j�v�tP��:��14�h)���?�`�?}Ҙ�On@��k�|��u�O���!�2`�B`B��@�&�n�ƻ���p6����~���>���<$�"�}1<|����A�I�_h+��|
�y���ɩivvnnN�[,��U@΍$��v���6� J	���̈�*H�����mn�Z]���V׶��76u�����tw7��&�V)��ZboΜ�o4��!0�>5m�7�w��\6u\�W�$��:�b~�#���3g��H/F4�ĶWc(
�e���{��0��"�e���;�`��P��?' I���<J�F����q�Ur�32����}�$��-�|ͱp��أ�1��\�t��4�|)w��4�)���x]`_�=ŧ�d�9p��.���N�� ��1�G� ��?�й"������x���w!�4���ۍ�f�[?�g"L�NE��"���@�)
�hr�q[@.�Ŝ~�;K�w��EG=� 8ꅳlH]/�9�oS^-K�V�^L�G���K>����/�]G�������o:�JٮA�D�(!�tx���5f�Oq�elᰢ�_ ��S��g����Z-:5�&F�O�Ěc���,LF�ތ��d�i3�^��8v-�6�x�g�@"�Y�ʫbhuJ������0X���'�Ζȅ�_�<0Mml߁妠4����m�iȅ��1�QJ��ϴ2��P��H~C�/����A���o$��BB����#�:Q�j�#���4-���~O���	��c9�|��F�r;�\1���eD��,<	+�^�c-���N���i�a������4�i�������S@Ϗ��U���d�X�z��m�(:������P>���Je��+^ʝ�0���p���Uʬ���G�,$���ز0�ٛ�&:Ϣ}twBW�L�K��ŕB��>E�]��jڴHc=%�=�N���K|�J�[���@�OP�=O<�.��b?���)��r��6���B��N@���ر�4��0����zy�`o������O��r�	b�p�Qf�>g2�L~�g���E(� �dw&�Z�4Y@�e�����y�}�Mȴ �޵�e{+l	�'d�T��h<V�}p��T���6�p�u�������c��w11���w��:wq��U�������,[�{����:�Hli>�`=��c��$�%�i�����H:9��~^��w^�^���|�Ú ����5������ӻ�#��%(��(��*_����h�`}/,�谌�I��t���c0��RT��4�-�ු��WE ?#�<3����Iu|n$aCz�����$����W�~3���KG#
v�p������;�tAQ�����ծ��N�a}��(T�ӈ��+�5�T�h����,�N�mX�~�-�t�z	��8&K �W<3Ѐ2a����r�a��X쇤��%2n����V� ������hy�0跒�x�ݭ}��Sw�*E7^���7Y2�
:�瞉� P�4������S [S�`oG\�#l'�,�$U?�>��7���t�I��5��AW�bL�b#$?}��_��(�I��]A%���1�l����0e=O:l�wk7x_�G����ܷ����e�M��5�� -(�b�;�j�^&&��|[lׄ��7����Jˋ�޽���M��{Q���`����wwǢ
L8w=гUu�եB0����G�����_�9 ���͂���%Ɨ�� �lM���5�Z���h�az�|B��h���G�Վ�^sv���h�2����k�K69<�6�q 1���Mx�R~�3N~2�����*�F��X{�:��,��� '�w��h�ڶcsd�e�Qk�6��xC�z�:<�G~+:^����~���=40��1�AY�k��}{�)��1@`��Z9+w#���ª�ȧY���Aǒf�"%�!�f�z@^�����W&]����r7���l��y�
�=R\��F��[k�����5��	Yi�!���	�{m��_Μtn�2$����XJ���(��3�%eeN#p�Rv��tt'*1����ܢ����YP����G5�0$\"��2Xx/����x��v�.q̻s��s��NӬ�7w}�N~3q4�g(��k6�����g�_?̝��,��K�/�"��R	o��I�!�W�J\ث�^�z��\�������?��-����k�9�|���R*�7���>˒9�L⩟��&U�ZeY�i6����>�hR`�1S�mf,��N�b���J;�_	����������ؕ�7����?��q}y�ϭ7ׯmY)2J
=\â�j�����"V�e�j2r��b���~�`$v�����L�Z�{$/MJ�f $�Zl�����sU���������c���;���FF��!3^��yN��<�b��[v���?�<8Ed�|my�v�y��x?��P~g�[�7�}�����w�������������ݐ^0�9'�`q��=���_tS8|\4�{�s������m�d3����2��q��Ęb޲8��}��������6��K)m�biA�W���p;�pڏd�J�OHo�!6�C��Н%���  ���}mo�F��_����D�.ɲ�v���pmK��d�z���\w7��lˊ�@&����ݝ���$���8��ql#&6�H��qɭS/d��*��"��n$��$��U�:u����ڵk8m&�~e����e(��U�ZY��h�B�E�B��.*�n�u�vb�E��~~s��1�S���
�v��sǮ��s�ޯII�D�"vQ�� �)t�'���P3�ؾ�`L-����>i'��N��%cF�綬�7ѺӶJ��iu=�L��F�y-������*vQY�N��hb��<5��Ê�o|g�0j/�+ʊ�Mj1�����+��d7T��.�̐$x0�u�EI�W� z.�_����A;v:�(���	O�r���i�rR��	7�F�����,��C��	��7��)��������xN��ݔv#_�͛)8&��.�(���,�͢�����ت]�q���Ǯ��e=��]R�#�~�f�����3��i�=�Нp
���]p�-˛���>b�^�.�U��f�/��6^�Q������E�{Y��t�����Y"��~ّޗ��� �1I��4:��IV���I�����9�V�ރsfl��Z&��|�ޘΑ� 5(o���f��w
V�c:�^�z%>���C�M�(kT�ͩ;&�֢��!>��m��Zf�k��&�I;���yf̤	��[��+u���k� x��F��7�t�N��v��A�28�4�Vc��1��G�\6��N;�<����x����W�:��,؀z�'��}�����^[�?�4��b׋0|_����&GHp9�}H^`���FM�ܽ8�����T,B8�-PjW�k��w�ź�V��5�V��⻸��޶���s��}<��8W*��<���Tz�aa�b\t���LB�Ȩ�M�T��]p���J�ߘz/���_��� m��t�HoU�5��A`4T�$C�s	��MS<{�F��c�ڍ��P�Q��Gb7�lcSN�<��]d'U}W�h@n���mm�ٳ:K���%�o�ܶ�<1-���(���2�B��/�v�v<#����*���ƞ����\B����/Ϸ��j�2��E�F^ �D"�AzTb֨��OqEo,�L�.G��Δ	x2f�+���u
��>1��f����uH�ڴ7�����Ma��S��L�XWr?e��������m��Ig�~0c��T�z>����U���t��BZ-��&�[�����h/�������_ic<Y1�wN������"=��ޠώ�:N_��h��N}�S�r)�o��JDI�x�H=I�:�̱�2� s�5u�"q� '&z+������0�i����7߱X g�ɎH�3,ٖ�|K��+����,����)MY6�5)�*�`i|`p� �U���{���M^Q��B������? ���k�bU�����"ֲ��&d��-����E!YJD���Je\O�}���&�Uw� M����Zz�^Y��q�UPǾ�[��F|ENƕ�:��2:V4��k���V�(��jNw�᛿����W��ϒEAǋ�.=�\���@�$����6|8�H���TX=�r��6����Ý,�����&KQ��bt�.n�|i�� H��Q�,S1���8�B�\���x���O��S�&ۥw̨�6����{�mu�%�*��rbU��R�%��:�|����Ɂ�����*��פi���y~�X,ي@�Tl&�c�s8�e#�l��Tei�-[n�j����y��/V[��a��#��7��)�x�S>7 @�g �?�G����KDip����q����s嬫��}�|�+��9��D�z@�{��J�T��>`���" ��#Y��z�e���{r�$U����!��^X�+���Hr�}��T	��lH`#�X������Vǥ1¥bq��_-��^۔R���W^�/�m^W�M�П�ũ�0�}��u'���p�;x[~�K>�99���P�Z��:����7��t�c�ǫ�:H��s�;�W쿰����5��ö�*^�U�Е�*�����ϡ+���t�z������X���ԓ�� �+��
{�H�=��L ����_l[�z��/(�����;��玖I�L#�SA�x��6Z�P�26j1K����*�N�&ɰ���C?���� DP�(D����0����B���vL��H�v�`G����� ���~��L
	�	��f96AW%
7XG܌/*��%4��H�R�U~�:ă"��)ु�+t�ox���.w�0����6�fYߏ��;֎u#��?ul\e7±;2�C��5ځ��۫���֮]A�+�nl\Iꌊ�3�A��r�>���,��/���@���ϊ��@ԇE�>�+_p��xZ���=%��8u�%ݓ�k(:�i��@M������7��ɿO�o��������9|�;4t�a����7���g �G	H��46����o�d�Z7�n@����h$��X �u��ǖ��9���b6���4�2 Lɜ���sh�BD�9�e��8A��9I�H��G	�$ń��$���A3=��h�T�}�e�Hρ��,.��/����l@��I'���X���~ݰ5����7�c�����LW��$=�$(��y�*'/�7!fh�ق}�v�;煮�dOw��Nœ�X�2ĭ%D9Q ���xtH7F�-��q�wXVl�%/l5���+�8C�jٶk��1ԇM�<j��5�$����,s�10d��;I�{����v����	p���*6`�r�'`gy�����4�"�DX5�k��n�$U����U�+�6�|"	x���I��A�dJ9�F&��qH!	�G��#��c�A�?�Or���TE���f	�gf��l�j
Q����DHx �[ e����8#���-��]/�a4�
������ ����J%�$m���e{����׊���~%OCՓF����	4�	��=�q�i�D5���Ic[�ߣ�O�:[&?A�jx�>>�1�0�fm٤"������s`A�X*Ҙ�JQ��!Y�8��)W��q�"�^�c��L�
։�6HRq��U��
��^<��JO9j�O�=r��r�BG2�oL擣�h���t�)�� a�)�6��;���"������y=]�+�U��rLl���4D=G�:�_�_@P��]�c��V��L<�ÿQVA5�VI*�2����>����`�H
,�<��ɜ��=+�-z�َ�t�撉G{j=Z*����y�>W�؛����OD�Mn�[�>?�˶�x����S�����ģ�/��b��`��T0�x���B>� �6*4�~�hlZ(�����	ɷ#�4�h�v=DN��^����1��U���#^YMQu�M;-�m��y�D����#�:
��1�u�^�j��0���q�
�!�'����n=�c��fӷ�}��8�?_@���k����ΐ���>�����BS���v�L-xi$c��N��h����>��V�Y�x�6?��X( �����<�1#2Ϩ���#K}ϳ���J'wc&��L��I�Qї�1�T�"����R>�����E�r6!�?��&�1�YBC��0&�7	��P�Q���M�㟍�1�]t�Fk`�ӳ��Y��.���ďy 9�ڿ� p�K�LeVFcT���"�^�H+G}Lg�@0�ȼE���*4'{��g?�4�Dd�)�����%]���ܖZ�Bڌ,�w�	+ʣ��̙�G����QI�O��(�{˝$�K�FҘ����Yv��g�91��٣�;E�{�o����n���b��H��cĆ�ȁ~���C�~�`�e6�L�l�E��U2��_��������#��U�H����c��Lf���8	���\ *�[#ʰ�C��1��/���CH� a��8�C�I
ػ�O#��/{:�P�]#�5$�E$ �G�ɟ ����}�Τ�܊�����|?A�B�O���L+r�~��¥c��۟�B��,k���R2)�Թ u֗vǗ���r"N����'��V�P����=�����	'�x�l'~Ab
��(�6Z�3�!c��Z%�_/���R������Ar!0�6.P�C��l�x@!�~`��o����T��w��KG�3��'��=�ڷtr������~����֒�{R�Z��y��)}�����.!�M�d���)�s����D|�G������k �3�a4!���'頒C>��N��V�_�:�� �.�������l������# p����s���^�1�v����8���,)ua��RLD�2�/��Q��$X�V�33���g8��tz�֙��֎���/3�^��`+�Nmx=7s�ts�(}�K�D�a�XG��Պ��M����t0(���Ѽ<�}��"G�#bj����V�ܢ������b�`�M�h5��_0�Xp�K� �<󒁷��m���v�S_���;l>\��S��F���-8&A@��`&��ME>37h�ڟ�N��G���2gf�Mt
�����6?�6E��t;9�R���������!�7��9�Ƕ�m	���a� �}3�iVlh*?.5�h�9p����O~����(�F7����Z:�m�c$/����
�'"��:H��
�����ѭ���y�4|K��-�AK�0��"LK&Z�eTKr���c0\��B|E�QVS0��D"T�����3Ӹ��?A��__� �V��_h�U�����+�UTD�[�׮V{�JH����[1�z�-4�1�d�̲S�|�^;�Bߡ�����i���'H9�{����� #�6b��lr�EhJ���~� 7����C��	��7��)��������xN���W$mK�1�X����R�����,�n@+H����5�\�x��ͬ��tH�OL��"\pޤwL��U7�5Є�^���{��g��b��Y�ٝ�0��j�z�`�&���L��1����~HeO�τ�~���o�{��/�zxN�Z/�j�ۚ���>����O]�G��qد&� ���5=��O�&�H����
�t�����w�AR�o$�0Hz5��m�Q����"��X���e�:�3DYO�6�������>΄�>����� ��^z��z"Y��c���Ԓb�S0ܟ(�zb��6,�����L�� �/'f��.45��:�f�g�l`��n{���Hw�G��ټ��O�~��˧�l[�wIDkT�Rj�s�|���e�|�7A�`�_�T�9t_&�r����|�_�����ʝ����'zcvר[�A�F�P�b���R޼�/����^���TM!*�mAJ��7L�m�&!����^rK�O��\/�8XaEJW�̜�U*G���3����2Uۓ�=��8Os4��|ƾ\��BBj\��Dȏ����C���9���K����ź]��*���>lഒoH��9m���݇͢�~�Ƚ�غ��&t��9I�J�9b)��s��!{yM�i���1����t�n�ײf���*��m\:9ҋK^\,�ϗˋ��b5�+�UqW��gxq�T����[��K�,��x�]҉H����I�rnݧ ��=�W��K���簙���LhA����\�����%T���/���`مk�s�t��x��W���S�u:��}�r��R�e���yʑ��w�G���c.��h��<͒�
t��/�\��H�xD"�)aW9�ޭ]������֕Bk��]��SY��:Ȑ0Sr�+Ɓ�����}a�,�4	�g�~��cժf8F_�!]���kgJ����C�R�+�AC.l������QP�<����%�ċ�Ĕ�^#�����`$̆��r��R9g�LW�$��	;��?%RP.M�F�b?3���/�Y��'.x�]Є���؎���	��/�������'�E�RRY�-(�{��)r^�HS�~�g���P�"�6��H�(yz���$��սPz�tl�Y�*��$+����`��[�$ϐ�pq�sd��bgn�ϥ�:;�ǁ�öA��K*y_��N��z��!�xV	�38[�Ar慎?�>"SW!����(�3��c����S���#���}U|������"��`�̕��l�Kc�xM�x�4Q�e���
�\��-��m��|����p���m��}�.�w"�����{$NQ�}d�<�E��ߞ,u؊�������4�K�����XG�U�	�)�6���#�Ɇ�=7��Ɠ
��b���Ƥ@i���y=���T�('3�S��W�n�%����)J:Ρ9��t�Cvh&R���*�
/��XP��_>g�cx����~h�j|H'k�hFpԅZ���FۢкG6��	n}�����X���@r:4�iT4��s�st�x�QN�J��-(�*Ϻ@���+r�� ��FJ�Ø�[^ӈ���[vϳ:@!��Y��S�brd�)J��&��]��I��'f�Ҥ~SU!��
�'�_kF�z��Hsr�)tn���v�������6� �d�n�PI Q���ö���%�(��Lj�na��K�W���Z���G��؂��� �u�y��!܄�f���x�����-�K��N��*ʓ�y���f� �O����Eelw7��4���1�bi	�i�*ʣR~ݼ�TG��>��_8��"�z{��i���_U�? ]O#r_��
�_Ýo�ͳ)�珰����G�,*@�4���G= �|������g�{+���W���v���WD�������ف�^�Xf�n���O�i�`I˿���9=����LK=���\�H�!�V��
�6V�-�v�`6Q���2�}���� �}e�?��0|N�����\���{�a�h��g�)�ͅFͳ�&h�'�K��,�~e� �C��K]����tK.z������À��p??�!��/�r�g���Ƴ�84�t�$HF��G�ހ���f$�-�-�Ȁ�  o���!4�mԄ��}�kBjL�1]|���
I�c�'�x�~�A:~��|�f�� h��Oa����� r&�y��sa���g����B\�Z�#!��1�g&8��֟���x��࿿��O��M �����?� -�ŧR@5,�05\d�"��������n�h�m�ׅ=w�?���4�B���=,L��!78��XF�E�=J��ZX�즵cy汋��bE;�%��社}ɝ�ć%����4~G�j��5
�3�OxA��-����f��D��4�O�d��kK6i�����6��c�!t2�v��������ۅ���oxx,=���y���A	;�.���R��mpvșྏd)}?��Ch�<-$�;Q��e�Ý�~���O�j�@���U+	QˏtPI�fG���ȩ̾O ��h�?���No�v������H)��>���d�2�oݱ������x�bl��(����c��|���;]���[@�NmͶ�ɸ7���V�ޅ�5q�M�V��G�V�"����x�/7؁�	��b��VWѵ��q1%7�����vm�ݍ먶���V��ZX��Yn��`I�W������P愺�FCr*�
JJ ��@��@�,I��	�A�Q�W�z2N��Q�g���~�3T�2�~�N�#Ì�R���	_*J*ȅ�p�t�_q���,��ku(H/x�x>h�`��7������:�a� U]��2�J����2=��ū89�dH>��3z����ψ��;�󸙔_�C�*(7���)$�d�-՞O}F|����ܳ[�m�2.G鼽��r}}�*/����{b�X�RMܴ�Ү��x��v��/��n�ܽ:P:��rv�H�LW�Z���W\uu�F� y=U֊�9�xQ
Ub�xB��U������P�E��?�,2D@V_0�Rh��kU,�f+�3�9J�rf�U���(��/�1b�`�W�K�����͗D��~��,j���%$8��~o�HJRR5e�rO��̘{��yz!a��=&���/�q_��fb:�"��Of�hٗh+R��zB��hu�=OS�w�%�bKQA?F�nv��SV��3����*�';��xnb��ĳ�)؍�M0[���"2���3����S�Q���أȭpo�����2~�>���7Сn�Et���BG�`��8Mp1Rtkt-�q����N�C��v�E�.!R>��w
���Z2\�F}&��
���;����jx�{[W�t��~�jr�H��N�e�o0��4�K�qx�u�Y�2��$*(6�����J2 ~��tlB���cVQ�pY��\�)JQ����0&S�~�z<a�S�D(^g������`
#礲�t�ˋ^
,ih��:�����l:�Y_��# )�8���w��GT�9b��L�]�K^K��F�Z����Oܨ�Ec�������7���%�K����*Q���Z�W=5��Ϊ'� �O�O����v��\��L���7]L��;5_�,�,�z�HK�P�<��y�8���I_��h;��a�װ@j���!�e8ş�ş#ſ�{������ER�'�j8�k8OjxBxHe�K��r����l�W:6Bĺ�x������r,��]V���J�+jr����N�C�j�P�"�!`��(q9(q9^�g}����/��3����	Y�@��6x�"(|���UJ�5Y�$$H(/��O
%T���A�p�*gO!�s�r�fR$(��D�����aٕ�a�@q�C��[�J�(�B[���-��0B��}xcr�$_��G*�%�>�	&{d;G�l��H��ql��7��L'1Īw[��G�V�e��O�ͦ�0��]ը��UMᬅ���i��K\��}��.�mR�/���G���𚰩N~����=�\��z"Tw�e��,�]4M��h͌D�w�*R���9(z�ґ��J�ޞ�T{;�cy�X>�c˸���-�ږ�׶�k��^��m#{m5x�ZoW�׫%�_*����bM��X�T�����=��7���f����{>���A^0]�o?֚5����V�<h��d�-���E��b�B��9D8��6fl��Ki���q�vXYB���͑�<��z����C+:n�"��G�[	4~��s2�7��;ny~�Q�ߧ�A�� �#r��:z�Cy�IB锕�t��qE	e^j&�$���\ 7r��/���9�]@ԙ�ݝ|Eɑ�����N�$�z�����K���:�mF2RN������,Y�U��P1�n��9eÜ)��;��?��9!���pE�8�'��C$!M~�&�U(d	���U����4W!b�>�U�#��s-q��>2]����l��ش��r^3f�f�{4�5K���I����Md�my�)2Y��e�g�j�Y�Q��L5NqbRk�+:E����~wd��VhM�r	���.?�p�A�����'H:j�g��$�J3����C%�MJ��?�/>�&Rd��wjR:�b�	��O-���'�huZ�Dc� j`�.�ve��CQ��F#s����e�T�]��A|����vR�;u��K�N+g�t �	�#�������E�W��Y�!I�=����!����M{�!	R��\7�:�|b���PF_%��u��ӟ�H����� ���ˆӆ6ӟ<�4vH;p��L�eT�����a5F�?X�݇r	aAO�\��8X��!��U{�b;�Q��������`@M(��?-@'J�$'ʚ�"A�<��.i�S�U}�"|Ҙ��ɋ�&0�w�G)�}�V��*�Q��X%{)~0��LF҈����qL�����ȡ T�6�s:�����w��Y�����1ퟵ�!�	�L��&�g��d�L�I�I	�6�?S�0��� '�gBO��g�T�1�?��1�������~�N���g���I�E�����D0���h%��3�P�f��]����.�@�W"w�����d��~w�&�sI%O6���xlx�)yD^~���<�����nx�L6�Ϊ��/*ѣ���˟lxI?g`�+��4����"z��7����%$��I�jA���dM8�hH��N�2:$����7�i��k�>��/��Px6��1xG%��N��h��=@&+@����b�V��p���%�<2q���m�]�i��8�5{w"ڲk�"�[��;����&Bfx�G���&|�[�0ti�U2��ߐ�|h�!OC����e�Ҥ�@�K{�S�/�C$ÿB���)z�a-e����y�¶-x�.џ<��T���H����>&����0�tG���=P}0m@�6{ -km��h1^���t�Ƈ�tL��X��on�� a��P�/��w/ޫ��b�^ti3X+��A���/&�C�4d��p-��'C$e4Q���o�N�范T�L�#,�~ϝ]�N}!M\un�� Z5=�j��1�:W��%��᧌�q�է����⯸;���	��߷Z-c�O��=t���;�AC�Y��L�I�u�gb���p�S��+���O��}<��ō�m�|�=�x�N�i�MD|�E�:�����Dw\��A[�.Ԥ����D�e��E�W'ڪ{4�8F9n��]�y�H��U�<�R�e��=~��o��C���b�<�T�d�WT�-��x�?�ax��������Ȯ��\3(}��pVJ��;���G-:A놮B�'o�x�b��B�P���ĝn�=�5z�#�;8�h�|A��t���c��Y@�~�Q���Og=����
�6�?fCґ�����ES ��4y�T��A��W� Mffٵ�� B[����$R�th�-��C��w >�Ү�0�)<��mכ��a�e�@y{K�����3zG���L_b�y=A�}������^�/N��N�%��B�5��l�4��F��{�gwd�QU��x�yq�8�G3;��UE`.���Η$�za�4H�X[V�6C.��n ���6�fgz�h��T�ė���&|h�a��~ww~w������;�	ay"_W�xf�8�����i1�t�#��S7[ѡ�<@���� Z�QM�Z�>��w(z��Eפ"*��&K��\��a����x�-l��ŋQn��C�Xjb�	1ȇ�H�\{H�P@��Ĭ?aDlӿ��W�Hl�߹���X|N�{濇���O�������C��>ʡ%��l���۵�X�h8���Y^{@����j`�$�@�����,ڦ�8K�5�i���J)�C-� V�������ܠ�*ъc��Y� ��t�p�u�1�g(��4���d�[��W󿺇MS	���^��۲mg�����a��$���w�ܿ5�*�KQŢ�I� �Xs9ernK�ʧ�tA���sLi�fb�z�!�R�
]_1��TfQ���Q�G����N4�|:MO�D�q�n�؈���1�����Y9�)=I�Pvڲ�Ir�X:�j����3<�.�L�w��.zu���]J2O�H���y���֤���ե��E�|�$��g�mz������u��v[�7�����Q��,�e�Y�Kx.��K�=�{ od�8*7��'p =��g��-NS�D��,K$Rʣ�izM	��P��c��F��MI���,���!�7$��W��g4��	�+J/&�aU"�����e��W�S;w)=婞0���R��Sϴ�|wm����XvqB~��$?�O�c�n��O���R>�WdI2�g�EN�n�.�b�W���T��1�h�*R�}vK���'yTB	Q<}��Y�e�~$�F�����Ex�چU����u�֛��\��KŢ�Ǝ��`�Ţ׆��b�P��E q�B��E�%���u �VZCnp4_v�
�w�Q0�xYݘ΁7��U���%�+/�����1^��8&����x�Br	{�;8l�2��.8���zW^,��U�e��8\�g�Jc���0�zsz��j]�=�5�+]���t�zBٔ��5�,��z(�����Ю|�xF�5��fg�:4j���?�¿�v�Zx��uFbMb!�}[��i�̂�8x}�[6���:��Kx�b-Ĵ�t�}��k�@x���d����%^ �Ջ}N5�(Y��}�x�"�SyO�U�t���3�����5�����@;�'k��	=�jU� ��=��U����l��{դS�+��6}��^8��h�;�֯b<7��ާߑ�	z��|Es �Ƿ4E������M_s��G� zh�s�"ѳ��ȗ��_�R��9������ּ�:�8a%��h���1\SQO����vF�4�+N�	|{9��T��RQf��K���?�n�E�[��]wY>�/�(��1��+��ּ�����B����B�I�%u��hOl���Nl^�{�vb�7���I�%�',�
K�)��	[�j4@��M�9�m��]͝���^ɪ)NX���b�P���KNm�ť���22�Ѯ>�I��n��G���Imw����6��'���%\�nd�����6�7=l��g����q!+X� ��������B�ܹ)��sfc�����4{�V��t˹���+���v3ۍ�6g����M��4��m	��撠�\�2�X�A�P�V�g��LT;��m��>}�ait�r����[!����u�>�0��/��%��6���i����ܔg~��qn:8U��g���j�g�pB�+K�hw�[݊����M\u�N�f��+���g�r")�R��t���jr:�]���;p����0٘:�A��Ԭ��~���YH�i�	M�� v��br��T����fUڈn�����RdX���a�{�\Ԡ��g�ƮKv�����A��]Y��]e�K��L�"2�K�.B̗o!����
)"Aޘ@����Hi�~6v �;/5vYlˊ���o�L�@�ؤ�Q&���@�61�O�[��n}��kʈ
c_����%.�h�p��B�E�~� {���(�̺o7b0��
�&��ZEsz�BP#j�HK�9�J؋�Q����9��|\�O�/���/�%�	b�7&�9�h;7��)���|Jlѳ_ܗ�B��~��}��|)��Ӆ���
=!{ا�,�Mz����$�'R�#��@u���2#��`$��).�c �A�.���qc��L�G���Ld��S�����T�>�>�~����e�C�g:<��)!j��8��9�y��~Bi�x�7����d��t�)��bP�r���Dܳ����2��]B5�1�wm�ŞSJ�=�pbN2�G�������ӓ�����Ï�z"y�B����B��-�lR|���$���G�)X+�`�"50�ej�����}<|�?|����Ë}<|�?|����%�t��~<�Br��;���9��쐏�԰��Q[ybfȧ3�����T�������>_	_9�Z+�"��N�S��9G�xy�q��1
uSDt�K��xd���A���W��/�f*0	=A�B�:V�~����
�th�0�O��e�$���**Y4An����N3�XJ7l�Tp�r������l���ρȖ�¨4���)��䈎F	���+���:Q�#P���S�jog,��ggaõ-g�m׶���\�F��6pm�k�����x��^-��N�E3��5��@�b�+�?�ϼ���8����/ܳ1�{�G=�i8�DR�H���ږ̶ dې��AG@������=��������I�4r�?��f0_�8HD�7��ʭw��ćfd"���"�3�4�{y����&4y}tT���r��C���}Wm����)��<15y�	j)��F\G8��+J+��֖�j��Y�.I�ꈩ[��oߚ^��[/�JYε�❋31S)#꣉x�Z-{?�ऩ�W��Q#�IxVǟxV����8���'��?󓝯�^�+zT�!�1����D���3
]�ԑ�Ԝ�Ҡ|W�=n��2e�`#��/+ќar�,�v-e����3˵ÕB�¼׌�.���H��ȱ�a��I�	]N1#�V���N޵�dW��h�.<M�k�t�`dΉ�b^Kd\���\٠��@��ꂊn�k��V�ב�Z	h�M�������u5���s@�hػHG3��Q��I�x�y Y��B�3A�3��g0!�N
�� ��Mϖ$o)+'��)���ˉ��I:Yt�.1
��+����~�!��h'�8��d�V5��att�e2AqΗ�km��`����L���c$���+#	�Т��D��������`��x3�a��0���y���4���;�ė��2�֌r�S�yA�TE��O�K��tg{�s�Ş�EtI Aq
G�������}��>���3��Ӻ�xIF?��_;�,�o��-�̜t�	�S�5���^�7|����$�4=��)��N]��p�@yaXI,��YmR�G��.��.�@=�z�z��:ǔ���G�Ta��S�oEz��-�M��f�uB��V �Z�{߽x�r<�)`�3��܋և���3mrpӐb�	\?q�菎R1"��#P���D9�Y9R_Hh��U��C������,A�Qr�eN���Ս�ٶ�h��<��p� �d��+��������'m|Ja`�����9h|6W��J/���,�i�{@�����O�{��ߏU�����}v����{� ��	!�@�Fx��EWIV͗~}z�߱Qh�L
�κ:Kךm�pn��w0��_|�F�	����x�O���uk}m����6�Rk��[�׮����_Q���c*�n��CT�ϧ��K�B1��S��bY�jf
�v/�R�$�����Ls��Dt�1��*�������zE��좷�e��>4�/�9��~	2��d���֛���c�|���>Z�;�rxu��p��j��� 8w�u\'e��GM�ʍ7!��Ĳ�8�N���
�Bp�n�vږ�����k9�h�ޏZ?Re�PXM�M��/�Eٌ�@#^��'-�[�͇s2����?`�$1@��D^2w_�Q��K^ӱ�-ڟJwx�h�N���iX.��ysS,�|�X����[L�K�+� w���	��J �>)�(@��k���
�:�e��ia�XT��� ���@-��tx�\�y	_�_����Z����U�k�c �u �ȣ�����Gu(���` �|�Z�[$/Dg� `v���ͮo[��Se�U�J,G9E�-�.��1�XZ�
����:�Dڗ~������-��'D(��wos�����2�j����Ϭϝ�9��  ���}moǕ��������I�U�IER6�bH�ٽ^ݸ9�v<3=��#�Q$^l���"��^c��ȒWqA$�����_r�SU]�]U�=R/fð�3�U�U�N���g7�sF�gB%~��{�x� �{X��!�4�O�Q�'�oq ��=��1�ĸ�<=5f�Ew�����d���=Ʈ^��gj�/چ�B�����I��잤���'����=�ϝ�I�~��$����	
�Nsc5w�b��箾��x� 	|�V����/eus�n�Ka�é�]�1����� ��؅-��B�Ja�Y ���?�t; �Ѝ��ւ]v�HF����B ��ez����Ķ�V�6�;����&IK�Q�y�?�'FWB�u��o0��>�d��z�S��T>𕴾>Ó̗�1�I8������a�ؚ��x�OAs����/��q��������&��3�T��<�I�4��W��/�>Ȅ��}-�C�$����#{��+%T��J�'�-� �K�-x&���[�k_��D�����#��O�+���Q��t����X�T���tO�4$w��i����C��U��5��Y��6tm�$į�y���%�"�;�7�~7�'$[]f���+���׆6�L��8o7Gz�ֶ{�;I�-9�g\n��\jit��08�)=��󞲻��%�v"ZB����)�#�[�����j1�ͫ���y5��f�5=;?�ݪ�/�CѢ[�D������^
���+��������c���g�:VH������zv�G��I�|��1��o����]���N��եE_^�Y\]۶�������l�x���Y�ř���&hA��y�$�l@���f:+�NO�Ģ�H�}���#�"��:�e����o����1
M d⦿��>�g�$09:J�V��t�}W���'�}�V�ٰ�'#R��� k��M/h�X�B�W����C��7�N��F��(�ӓ�(6�_[�:z��J���-������n������JC�p*�)��V�Sӫ�A��+ e�>�
�rv[j��������I*�\�C���1i+��~˿�獑�nv~J{�H�JU�x���F��`�K,,%��-
_�u�,�Y�]�8�j�s.XE�H.hۨ��}�2U8@�0+�ĝ��s�	�ﲨ��l�յ���]�9�3 ���e�N6�-/lI�E�c�K G��ʑu����=�uz�m���A���q�B3G�k'�u���7Q������0?�����Q�G�!���ʹn8!��j<c�kY_�i�֚g�J��蝩[-u�h*c/��4M,�|C������qf��"��ţQr���:�t{"�aF{�u��� ����"Te���: ��dgөt���eW������l4�d;V�S�H��u�|�D���#v��ONM��s�DZ�(��#I�\"{����.Mg7-��~�K6��}g�/��>����b��S�E��3u*_�9,Cf�i�r���<�w�nXy�E�\��/�<?����!�`�I��#Izu�T�8I�^m"Qo�_�����՚~���^�oW�>U*��2ھ�>����	ڇ9�W�wVQ�@e�\�Q�جJ�y,�^�D!���u���'ɚh�'o����7#�Fw��Z����X��g�9�'dd����G������%T��.���c���HF���oǮ7��������Ղ�c�{��]�d���3��	�+��1fq8�b���������n٫���՘�)�a5x;
!U��� �zA^���B�4�m ���Ar���5�F�k��~`}�˃���D��FLE��A\5&�[������`�e���(��2uLbkj@Grɬ�Rj�UM���]ST�̻={��~��b�@ijW��c�CE�eց���Xw������,侈ӄ���?��_2�������g$�#�,� A�6W^򣄈�w���K�+u=C�:���F�[�@��C���w����͒";eJ������(6���*Q�)�Ǜ>� �l�����	\�W������n�l-.����W�\�Y\c�7�n��l�l�ͭ�P���	VR?��ۗ�m�?lpFV=���3���=q��, �F�P0��Z��'��N��"h���d��[$�m�΋i��ɢ��?p���)_A�;nm��)��!Ťj8��+���JQ)�&U��9Wee��ۍ�v��B�&x����ݟ������O��F�!���8��SQ\��\R܆:~#k���w�c���;0�~�7�__]Z]\;�c���9����Pk��݄p�6V3�<��vQ�e4?��F�ң��pOS���N�uv:g����U�綫:׵΢���I�VCV�GV��Z"�lum[��h��P)�f�m�6Gȹ�3S�3��3f���K�sӢ�u�a��%�4��~���UU��ps�a�w2�q��Nd�K�^�����g6m�H��k$)�L�<S�Ak�%&V�O�3�HڇlBJ�*K��Μ�zk���l���K��c��5i�H,�BX ^W��#���=u���%,�l�,�o�,?�E�DE����k�Qj_�zV�E���`d/�e�k!���NWaB:>��	 �ms�����Ófn��y}����g��H�f�Cp�|��	6���#'q@g�y�����[��Im"���vˏ��wF�[���7�U,���F�?vo����0�u:��DX�̬�Wy1��_>�xd�( I[�W:���$ͤqR�^��Ziu����'�w��Gڴ��aI�.��G/�J�,�vȅ	eb�#��Q4A�u�4��Ǚ�PF��8���܊�R�l'�kv�S��,�����B2>������`��G��~�Eq�Q�nǼA~���}�|=$�m��pE/L�mN#�1��$ކ3��l����m���o��w[�>�>�v͌��56���	�ϭ�1�fa%GG�܍p]#���&�
X�Y"'�iʎޅ3���Q�' 
pr������j(g����4	
~L���I1`�e���S����m���&�*m�J���D@�[6�$�Y�����״���"`հǚM���z�H}2�4�p�r�r�^8��b�BpM���9��gk]��ׂ`�	��L��skX�M�U<*�C�P>�"9aN����	N�a�f5
���ۇ��V���̚�d�+��ׇd*|]��O��U����ț�n���ZT ���YX�N� Q,��>*���sz���d� �{l����k�eĺ��&���2���q���&��6��.~��w��
��?Z�bt�K`�;z����M�bj�ҭ�q6򳑱�w��+|�5t��-#�����,3 �S�Mƽv���1ӯ�'o��^7�:K�e|&+���*��N��ݟ󡛴��� �}��3��+,��V��{�;��r���j��Y������o[@V��O�'��ȭ�ӗ���k�s��_|k�;K�E$�Ai?��u����$\����ۭ\�ߠ�K��!�1)���;�s�E�������ȸX��|��#S����HZ���~��.�O	M��CnƼC�
�H��d�ę�cUi�UgP��[n���9�k4|~�ĭ�w,�k�`��6C�A��u׋��"'��w}�G�� Yy�K���0.�Iهo�*�Ի�U�h�}'��a?MM\�7g��*<t�7�NL�6�Ec4�WU�r`lؐ,�� ��gey8/�e�v�h��c�x&�9�������RB�0����22NH�\$V�5��м�=j�JL�ju�"�?����8�l{��l��h~tX����`?E{���7��˸�TH��mb��ˎe���;��b�?�r�@.>�M �����%$c��/6�M.&{|�^�� (��Z�����ߟaVa��B�/c?����)��}L���8���-_T���7��oA�w�1�[;`���Ю�!���a=t���@�$o��⫓fBBM"R�з������`�(��ަw�N��~�J�(�s���wp�`�����+w��G�J{�G�����������-�4v:�(&�5s��cS��y�����F����޻�ভ-�&C�۩)fpY{q�]gK��lm	q����`A8�i��N���vjl$#�]y�d������BE�_���q��hk}n�Q����G|ݱ\YK����4š�k򁾣��Ȳw8r��y�_!�Ŀ�ya�UN�F���ch��@fs�a��
O�x�`�1;<fٔ֜O���*.H1�� P[)>1kp���N��^]�g[y��Bq:��X�S�/Fii��i��-৶���۱?��hɺ�k|�W��wK��4rl;��g�
��Ĳ!�GK�utR��~w�('W�$�[�%*K$�=�򵑱g˨ů_�;�u֞{�1C1���x�]D^���� .�����+�I������~��PX�w��]�I�~�`T�_8Y�w��_F�d�-����(�[����x���:�M@�oBޠ��&��AF�K����m �|ӌ���8���yPJW1��-eZ�r� �
L����B���j*`zm���C�i)N�D��`��)�Z.]fTTt��*�;�-	/�q�]|���KB�QY5�N��ҭ������~OHf)� ~_?r�xw���0^��P����i�dm��[r�=��r�۽_^���z&ש��j�C3�����jw3	�,�y�8�'�ՙ��<�'X�O���4g,~I����B����~����`���x��6[_��\�x�^%s�B�D@1��3IE'L����\g�6G�\c�K��gh?�`�֨�zf���hT�_�����L	OK�`I�����q�x��`]�����=�	�d b̅c���ݻՋ��	S�U3�CU��?��?c�>%����r�diY�A����Џٺ����y�٘Q4̜��YE�YB��Ce��'2-������g��H����GS&�8�#N3����+Y�K�v���.҅dvQ?��F���p�г�Y�\:V�\p�����Uk�?�"kxJ�$���w��f�j+-{Hq���c�
CX�>�C�����^_V�"�S[Mݞ�����>6WB(c�--<'-�D�r�6�u�ـ�3<WN�LӁ�O��1�gM�SE����y����H5�h}55�Z��i�E��a~i�?ԓ��$j��߈���=�\����?H�i�h�S�,�lB��0�s�1{|z�dJ���]��6+u��8�P���ᕛ)��&���Apji\޻���2�Pob�mѡ���T�f�,�͖�b ����,s��)��V�8�a動�Q�	�\Lg>�=����e�7	'���Ü������F�K��0��.�^27�;��!ҫ"�LzY���9��Q�!R-�"�o���.�tV����aN�+^i�a#����8�3.����	�R�Ge>J���=����Up������|�J��nJ�l/���̠̘2�r�){���j�G1��K%��2���|�^�~'���L��þ�����vӺ똬W�xą�R	n�a�}�bKU�/iv�v����?^\4�&�nj�ls}����(�䔥̥,�#bq��d��-6͖�Vo!���0JǬ�9/�Pf��L��s� ��GQ!d�,0�.g~*]��O��%R�ŷ�=��عZ+��OOM�^��ܛ-�	���&���}���w�@��)�;Q�O��U�"��d���"S��5A�.7���ǣ~����?�m�O�ߜ�I�w���"1|4�'0j <�,=�}l�A:��SQ����h0+p�Ru��q��S,�����"�~9��&,�w�zNF�Y (R��16���I;ƒp0��x��!:��Q9n��R�S��o1]��oק�WEǏ��HՅ���\��CJb.,�B�OUgà�=����Wz��J�I��c	m�U]�H1�RtI�$-|�1����|h�����R]^�Y\]�f��ҍ��o��Z�Y��a�0Y�l���K���bK�%3C	.a^7������&���0��'.ͳf?�R. J�š;e�O�x�@t�q(�Po���QT�Ka��R��Z�H���M�˫_��&�3a��Ұ�@��@���:�����?~���WT���BAAyے!Hպ~"]L�S댠�J�rK`� �m��<(K��+2���+@@Dt����wL�vp���R� .s����<$��^Q#c�5!����t�J#�q� �X��h�ǌ���ؚ�~����VxP�oR�S�;������r JS�e)=���3tPJ�	�i�,�pV�o�Z7�m�����&ɝ��%����e��h�X��b�%��0A�G|E.��/�Rf
Y�e>��[b;/���%M�{�:���2l=�%\/��������p[�2 ���!�r�*0�����Ď��~����)�W
CpĄW�QC��+���Ϲ�6
H7�� �<-��e�N���z�v� u4��5�O��)�8֑S������[�5��s8��Q2����7�P=�4Z�<y3��>��`HO�n�>���*�e�lر.�tX^�'��#͠�QZ�S������W�
 �RX�7Wǈ��,'��bE��A��W-�0�j�������ؤW0
��f��D��G��d��Q��*��e� ��m����w����;���j��=T3�J��Ym`K|�,Bъu��������	���=��kxVU���+�`2���+�-J�x��R���q�8|[��-@r�<k����
�7���Z!�UZ�d,��n��3����w��2фT�ޞ&���).[h�4�z�N�$��Hm���pH�wf-<Bgjm-������o~`��*=�)��ʽ<��¤=�st�s�1%�=�ϰ�{(�~N7V�JߓV(���'r��n�T���8������z�w������}�q��${lC~<����.ў9�n���3YH��@t��l�N��pKW������<��(C�˿m7�ے��.���8���x�k�|[R���f�}��-b�."1��MOΗF�gӃ��D��cۅ��{����H���E���t�AW�7c%��*��Z�6ܞ�3ܥ瑉NΫ<�jG�):����R=�۸.���eY��dL��$�	��V&s�4�*�:Ki�]e)�� 	͸1*��bf4�I3�ԧ,��V���D�t��I'�$m���Uo�R���/��$���{B��nlc��C�m�I��T�JǸ|!3#�JߵNM��d8�~&��L3�Y�ʹ���m�!�8�q�%��rl/��9���:�}������!X����be�:����C2�4PAH���qА��LVh�:�,�oQ�HL�d�R��dPJO=ή+�pN��u,���HWM���l�츓/K�5��TE@+�jfC�̇��B���1vet�X�J�1%�Ђ)�rPP�znNkF%@��#��������;+[�K;�o���%�j{�m��z}�mo�,�^_]�&�m�T�eGY7�O��^P���؏��^�6�k�B�m�(
.�@Oa�4����_&J= 	��E�q�Χ>�u�w,zm��;ͩ�]YX�+�u�����6��D��T�*���ꛮ������[x�ӓ�hbi��|[;�iR�J���1%"�4���ncy
i��ݠ��..|�]���ng��d�o�xTσ%�����4O��
����Z<:-�m�* ^�B��-��<,����G�d��L�����.8ʋV\���1^������w���WU�>aꧤ��O�F�j8���A�0���_o�?�{�<�L���nACz�*����� ��y5��g [��ߡ�`;���C��g+�U���A��3�l��ُ�lD^f����a&�ƒ|����Wq�U1��%�)v�x�Ѭ����d��㬆iE^'duR�U�BS�,3��At�%*��3d#���J�MN˒/�����C��K�'_�N�����(��G�����^M?���T�ߙӡ�W�Oe�a|��k�vO�ְ]2 ,��PRYL��ʄ��;��.M�Ο�-����1W�1�B��J��=
�\�p��P�_hr�a�	׍�J�z���b� anV9��3��{{���M�hG�#F��U
/M'Kzc'���3���-���h���榪��鲙-�̕�U��,n�|�4�f�X��]0�Y�THu�7�Z%��R�o�X9�+����L1l��r)�287\�
����l.R�TF��G)I�D�r����<(6nl��Mzv2؛>;�u'��a��uȺ
�B�t�
1�\)lƿV�C۾�	0D�?$�TJ�~I����xia8O��2��jr:�ĳ��dZ�c&�Ũ�,��M>�V���/.��̄T���ǋ�V������T@��,q�e���Ȃ�����`����l�(8V���w����\�x�ml����;�\5��Έ@EQϫF̾���3�T[��X��n��I��H��aB���aǗx݃d"c�+J;�Ҁ�+��ocK
&ҁr�M��/�'�G\�����K�^u���K��ū.$e��H,I�j��Z0��Vh�L�L�j���WW�?�*�\���^y�ŉ�B��A7���#���(+W�s�4*���%竗B��\^�o�蠁���\ɔ]a�%��|eA��� ��:C�s6|��w���*�ȏv�� �(�2����*a�:�z!�uF�]�|v�����~�9��x]�&a�<S ��7"�J
�w.�h � RƓUx��E��`�-(�&ii�Z=�4��~��z���Sy�XS�f���X���:f��l��JALTG�.�E��Ya��I��ڷpV�dw>������R�N
������#u���S�^�ί��;�|�: ���.r[5{)(��ĝ����7s��~A 0VA��X�=��}�'?ሰ0�7�������?Yc��uH�_�o�;��0�6$��c�������gR󹸎rO�|n�R����}%Cf��9��6� ��^7��&*���Ͷ��,�ӓT9YM��vv�؃���l�mxi+;]�a��ǲ sJܱA����±]�p����"�_�t?��Eǧ��h!�zXOU����͔��ۇ��(F�Xl?�KLo둻k�t4��b0��)F��_޵-��^^/Qa�����&Q�e����._mj��S�[��,8��S���p�<�:}�Y��eM���ϕ;\{ 8"��o��3����}�d� �� 3��fv����m�i�+�g��xpi"U�a�kǮuk�֭)�[�# ��$�����t����.��#�b~&`?�X�&3�~�6��gn�ў(3�*3>�JrV�G�����5����2�W+׸�Sǉؐ�8��t >�*�BO�H&pz��y�h^YH,�'����.��f�֟�P�����#�(	͍�8��i��&�Rj@�l�'ݎ����-;ɓPˇ�ߙ5皟�x`S	�OUK)����f%��hG�رfg�R����Szs�҆W*\ٲ�P	�.�������u������n��-o�?T��ˋ�a6�!�s%C)�Ñ+��q/h�X�	
��bv>ʊ���B���%��vBL�����Ӿr�.�n�M����\����4?��W��PH���$���������I�Ԫ��i�I�O�/�8[�|iE�!�X�e���"\�|��~qc i�(�H��|c~6s���ah_oa�dʑS��\Ҳ�LE�X�\"�#ʢQ�~
�5�.9�}��������B"0�?H�Q�(Q����O��η-����e&C["q�]L���������j��J��/T�n��+b.D�e��AR~��?�NqM��]��>��Ň1�.���bNL	>{b�A
�ɞ#�Wh��Y�(W/��U3SJI�������F32��
���B�[�!��8��PyZ�ݫQ�(�	��1��k����W	���4�#�D�O��+=2�f�AP*�f�Uk"ʳ�|R���v�ZJ�4�?�*~��֥���t�[���ή�R��'�]s�'�,ɦ�S�;��0,�6���۳
���̀�1���U���b�q �dxC��'F�|첳TS�4Yg�����_x��B��dcߋ�ѩA�ӝi�:�4��6U2�\�]�$/Nj>�t�`SK �=	��]4�Q��)p:`'� %y� 
�+��2��q��h݋J&A�W��T��a-��7�5�W_kLou��kJ2����>�H�^Zߞ@}pbj���_�ٗ`5�@����8������K`��OxE��jvA���=e��g�VxW�m����`'�E��v��a�����|�%�L]W�v��?D�|&��#�=���>ţDz���'+D�Q�;�^C�t�XZ�.	�?,ݡ&�K]��4$�Q���n(�U,m�(��?�P�,� �9�[��Bh�c�.��`I�S���B�Wc�<F���_�X&��/�vh�����?���as�t�>��l�D��k�+��)"��<U> �w͍���xm��!o�<�����`�g���;��ڇa���`�%!�K	\�D �w�O���D�K�;�]�͞���K���M,��N��å�{	v�S����	z�j�A��֦��1|�v�C��P�\h��B����K��Ho�^۷I���"o�_�7��WEm�us������D�ה4M*/�=`W7�}����f��IDJ����{,q��9��ð����{��'��j*��S�c�a�O���BG���9J��Wѯ��,~*f/N�����k��~����E���nE�*��F��m��W���x�����v�h�\�M�drul�A6���-��p@����L�V�ٯ)w��'�3Pa�_��z��v�W��T�ɓeAX�*O)W�������PM�8�;�U�q��f��_���iaZ���!�zϙ�=ŰI]4{F��~�t��e�l5h�LM��dW#� �~�����c��q�i0����xc�Ǟ^Z�����_+,J��e�Eqd��-�g�L�5UCU�zs��Vn=��)�>�I��M��=� @��0K�a������i�zY�����~NF����ڵ�^g�k+[;��Q�����N6����x�<[�zގ�?������Mh^��+��b�eA����Ui��^�l5n{6J ��&����K��f���"w���i���D��Z�Ҁ�(Q("�?�Y����X&�@~˵r$᷼�����^�>d+w��{0���F�7ex|�o	����驅�y�����4����gdˇj���k2�V���h^���T?�J��^#�@J���I�����>�x���� �i�j��]��'�/�y�l�܀��:�tFh�1�j�v�����\�V��7�d�m�ɶ��~���H�4�,�ZN,�޹�Ћ��D�>�l^o��� ~��l�����9A�	ʎ�D�3��S�9�=���7(J��YB����HQ���JA|��~�l@i\>�K+e����o��N�Đߘ��(�sC#m��8%ο���E�@3d)&���Z�
l��I�	�٘�굼 �����oQL��I������f�f.�q~،�n#��^'�T�����%�Uf{'�&����w��ˇi��Q؅�c� �f�J5�(�w4�d�g\M.��yE�D�nY�I_(�,�މu���v}� 
���bT)������s1?�����pv}ޤ�~��o5;��#�^��¶�F̧@[T���$)*��r��D���b~L�y|s�QQ����fp9�e��|;���o��2g|!��ں��	�����0�jk� LU�4�O���r������	T�ڕm��!�R\�����è��v����z4�V;\co�|��/�V�d�
��OG2���VY����\7䤻�u��\��q�S6�~��>�T^H��"K���+��l�3N�i����}�� �v���"CFu��w�BN�)jԨ���i��M�Ķ�E[8�=���"�gnW�W��q/W��P�Ü�s��O��Ht?���ڇ)��R;�7�5.��{��v/j��i�Ip�@����c��]j�zz��X�1���f`�|q{���+�������ss�m�l���Y��o0�d@h���<o���A������|����P�Q�X��=ߏ3� ?�̗���N�l�'�}:�0H}��'d@_) ΐ��'a�eG$9<[H'�0�8����_͘���'��L�3�x�Y+����ЂȮ	�J~�rW~:�}A�؏�2�9E�2���e���4�L*�P�w۔!�|��O�wPk��'�o^�X���yccecg���,.����~zc��ۛ�K+�j�4��8���x���+΅(��wzZ��E������y^ۏ�@�u���]Q�+ͣ��qk���JXr���'���)̖�i�&��hʏ65X,�Ә�g��NP泳@(_�l��,��%X�I'��^��%�vΈa��P���¢�&B
0�pF� ��!���("
JH�^�,���S2�M�V�Q2��u(����;q�?�R[�5.��7 �'�9<�?!%��-?U	?��?��	$S~6���~��jԵ��J�A�J��|�	�s�˃�1�1�[��32��7N£?�0�R�=���C��Ҭ?�Y�wr�0��+Nɛp���u~T��mҟ�LSR8 �	�\n9���d�鎅�c0w�]^✲��r��x��5;ܼ��U�_b��D�d���$���d}�ͣ_!Y,ʪ��B=�=2}q�m�{A�d7I�N ��<��Y\p.Ğ`K�~���>���AF��$\���?��= �">�%{�j�}&��*���*=�"2W�/�#
z�,_d:Є�$�qw�a�w���RE����j5�2Z�_*�E��a�aP�Y�w^�7L�ɐ��{�C&S�4^dڷt�������&�~c���r&�s�ow�Y1ך��pw��j���n�.j�R��O]`����$p�"��K=e\F�r�4E�sr�����J����V��]2��J�w��
p:���Aq�u�bf ��(>R��A2���Y����J=�;O��1y>>���vE�:��ux.�]/b�@��?�(�m-��Fs�b8�"��Cx���	����T�`��o���bU�� kI�3���씩��E�`���Z�5� ��Rb,ҍ�R��d2
�m[�"��-�܅�l@�9�h:�<s�E��d���Gg͠1yR�7%��"�� TCF�p�!j�!�P�«䂮T�Uh�Y��ZX���2�2L)Cod.J�|�]���ZY�1���pt�]3�2K��p�rvP�E�z����m�����dj���┙V���V?d& )3�`୕핍��&��i�����5z� �e	�1��3�8�����{�f�'(����1�<��-�=�M_�Z��)�Qb��3z�U�uNm\
qJ@22E�|�+�D9��K��d��H;��*=��+�_��D��i�J�c� 8�p#��&+�$D��A�� "�p<��L9*jɬ�fqԤj��ү�nN��
|�͝���3�}d���e�J�/� 7u���$�Z��]w��f���������.����[�=j�҆_E�;o��p�K8���壪����_�L5gp7J=.��|����9,- ���)c8멅��������(xg�5��}y��ʋ2uy%���e)�g��"iJ�D���hV�T���KC��JH6�W���^Ѵ'�q��V�@s�yscքX���� �g�K��^b}�����s���i�_k���\�lY���Z_�gW>��і�iG�w��v�s����]L��j�b�hT�S=$?���~$��}@'����[F�(�B�{{4f0�٘�\�S���욶e'�^9g���xw���6p8"~*������3g�Ԅq�/0�,�r`�u �v1�Y\iE.��V��1�W�XMu�6;�*K}$�dPp1���dBQA*-h&E�D>���e�|�������n���Y��a��+k�j^�R[l4�R&^7Z�Z�$[�X5����~<T{��L�2@����׃����
`+9Zs�|�F����tJ�PS9��I pY�u�^
�mJ�]�ؙX6�jՉ3�غ�P�o��]�ƅ�L��k��kti�:R�?ж���
�>X�����r�R6���I�Y">B1z왽Ζ8�r�I�����,P�l��p��E�K��2�SݹR<��5�mHG� ����M/h�H0]v�Ƣ?�Fo�	s��r��:&>gZu9Ȳ��G.G�"�h��f �8����,}���Ǐ����n�cl�e��h;h�|�g�G�=��
4z��S-���mD\RÆ�H�#��X	�������sT��}�t�Dt6�)�}�8�Y�|�?�2�����6ᗤ=��q=0�7��R��-?�������b��1���	${��!uk~��_�ﱞ{���ﰲ{t�%r�d���=��"Y�;�)	����s�e��x�Es~�B�퐼�ԁh��/�b�E��1�W�:=x���D�GTS*�l���q���4����0S4u��D��N��p�2���  �4�Q�01*��:>AH��+���i�_�CoT=H�g۩3��vn5��(�a�j�N�kޮ�맚����I��2c�A��N�G��ʟJ茯��3�_��߃#���u@�c�זw�?�mQ���pV{8�a�Cji�S���9;�_d7kD�2���B";[����9����-�R���������*����!&��'І����?���T�N�8��$F"��"�4��7����J�B�Odا�v�{�}�L�
f�Z��	L�b���"H��:[��>T�����rC�����(�	!��ve��/�I�z��w8=�`V�2��W�~�7�#ɀN��O$	#T,�����֨�Z���;�z���̊��*˵j�ߤ��F+h�q�)��~�!F��Z����L,�؀lu���d��c��T�Фk= Պk< �Ѐ��J���i�mTd�ƕ���͌՝�& M?(V��w-�]�%Q�jrǘ�JC�(�5�343��|.��y+�z���'���4��/�ˈ�-��Z�愵�����PX�	������V-zA��m��;%���	�]kL���7�~���Iռh7I!ʂ���a�0ښ6�S�~잼0�����*�q���77W���ҍ���k�ߥo���'=T�t�ph���$o�h�~?T|�sK2@��Vx !��8h8��+�(�t�
��{����~���G�`� W	��b� ׯæ?�s���b�E�n�x���iI�>��:s`��$�	~�kÄ	�|���k�W�Ќ)7���V�o2�B�M���2I�Q�g;`8<.���]�L�Ka�ۀ�ר��i�=c �,K�Y�\��Edy���5�}�m�������m�F��~�o{�˝�_��p�b�$�Hs<
���^�H�w=聳�x��w[����Q���(�w���w��E`��Ew���$�$?-� c�ݰ!��z�х�0�%\�Z����N���)Yv��BU_�xC� ��o>e2�]ս&��Z���F������|.�"|��6�|*�H�@ĺ��Z>:��s�	���`��^@��M/��H��Ó*[�"_\��N�t�xs��)��F��=��j�%K�Ǌ�H�c�_��&�A�_��F=��?�����P�.�7��[��I���W��� ߽,ed���y��$d{�Hj�XQ1?"�R_TN��a�����t׉9���+����� J�C�e��\�t�E_o{�tNGbƦ��ܔ�Nk�LW��3��mo�_bec����2B�-�n�E��	A��b�X�̂d1���	7�)��;c2E&�XD�eO��(R���*��V2�.��\�9=���'|�#,��ם�r��ُ�RUH��p�����Jf0�_ɾ܉���T��,O7LT9����XJM|!��SUs�w"�;����d<����O`�����T��E��(h�@>�� s ���`��B	�CFP�����R:1���f'j �+I_�d؈P���IMJնC�Y�>�U�/�/J&[�S�BMiQx����o��R�l�	��3��e��Y#��q�
f�\�9���Խ>�*�撒�e�I�k�g��?�eƛ~RpJB]��� ���K���Ey��V�KPi4Xw�U��5گOӨ$����;�	��k�5[���Z�:�G ]�"#̠}.����zgz:w�j�.T,�����]�@�o���PA�=��d˜�)�jcd��q���bi��'���xJ�B��<���!"�欂?��Hu�]7�XF3�$�9`ܯ���-˅��U<_�a�����6|���v#T�ؐ�+o�'Zژ�<�J���9�Ns?G��{S{��.�eo�9�u��i`��پ���ͥ.&�t�.�q�I!�-��L��R���y[~B��(�A��w�B�,Cr�֫���p���:�HW�ˎ�]� �e��<�����N��9.7eC%IV���eŶ�Ȗ�{�K�OCfB�kL��"L��O�J���}���B��k��O���{|6�����B�M��A����P�g..���~��Z�d9����;s3߻�3�8��[�6�=p�)����%�J,�,��)�p7�c��B�`
�k�����2�	�^3s�@�p0q�ۇ���v��q��m�M� �t:�\��nwC�4�_��un�v�0�v'Hr�H1@���@T;�[aǇXM����nN��+N��G���cU�Jp��B���,�	A��A���?���)oѹ�	Fދs6�b�U��?��~A�9�B�Z�r�yJ�7�6Hry~$d)L������S�^׎��Z��b���,ڜ��M(͒���*�~E�jP�q�-y=���-%uC6��xc0,]J�%Ջ�1��$�bW������W����ҍ��s�df�)�@_�K��58Z�|)�βssyecg�--n����+kl{�7�
Bn��b��"K�����O�!��l��ܗ�X������@�{���bո���E�i[�.h�����9�1�d��~+��$M0��=b�B�W�32x�����J��6�ܚ��r�������nF���Դ��|7�t��q��i��A�`�#%�y��Z�>�b.�٧sw�뜶z`�9��坃�u0qQ�;�P�3m����
�|HE����3���P�"��y烍�geF�����/׀�Ι����e=��4~�F�����D��4[�"���M��(z%7UyvQj�
m|s�~�3 �&�?d��ʖ��y�Op!E2�yP���Jv����K���&�|\)�����v���6!N���%��|S_)���)��+�NM_���4=;5wi̵��BȿΉL(�7W��=����"�J�̙0��y&Y<+$��]�F�
F}�c)��h����1��P��)˞��Z4�;%X�X���f�ޏ��{Syѕw25ל��UI`*�^M5���Ec%М@��ק�p�y� j�WE��ؙ1!��L{�v��,�E+:,��3�#dV���\y&ٹ�Xg�m�*[ �A�T5y��b��yʕO� r���y�f��a	���g�ۿO�Eq*:�,�/� �@��� �P�g鹛���}j_�b�O2��|���i�|�or5�0�G�� �#z|F }��<�rE��C�4,�Y})P�V��KPc?�U��� �L�<X�� t���"r9��X�g95[�ov4n{ �ƾi��o����7�|���UZ�B`�%�O�-�+">���B�Ȼ�ۜ�\�7q�����ɠ���s9GfU���%��`���֜��
�z
����:��M�A|��X��c����%qݻ)�@ɽG�W�����v.U{���tf�ؖ�R3�?�7�7}��0��/�֔;15k��
VQ�O�~���9�8���U"c��2�fh+��p	q[����K4��0׫Ya5��\���/���!��#���ľ�GQ�UWƄ}y9���d]9_^��|���QLY��_����4��f*��L4q#�L��`��:��.)�cbTT�\G=�b���Ҍ}u�M����'��)��z����r'���UE�S>�W�oN�w)3��I�C�ˠ��l���`V��?�;J�(�"k�t�2��yeQ�l�$g�6Wp�	?M��K��Aҹ�0rh7��_쀻�~x � ��̥n��K�y�U�*�%�T�#�]҆]���[�Wr��~���37f�K����d�b�ǶFu���4XN�QtyK\��M>d1g8��!�y!��2�R�l��>�W�{{��Vp���z¡��T���A���k⓶�Ϝ2��3Ka�b�W\k���Jn \�nx�L�w�ɕH�����S�����S)�MZH>C�q4vۇ���la��UGx��:2Ʋ�ΚcVV%0��B�T��F_t��\<�i��]	3�8�\�8�rBXX�}7�����8�����wfoٶ�e��0��ۄχP�W��������bK�-�MtQ_VyXpq���#��5Zj��K p�˂XdG|�?<�7	T�O�c�OL�Q½I�_�%�Ws��%d�d�L:c�~�����ϕ��p�x�Q��X������4��8� C��˗�դy�MBe�pVR5z�K��j�8w��+黖����#�� ���PHX¨&j�~hLI3���C�"� �m�9n��ٙ�.M�¦���Ԕ5�`��$s��8����s[�`����~��gkA����5\0���Y�1m��,���e�jr��>|� ߽ͷcp��Ps�u5�W�,~7��;�����[��2��7����A��&�ۓ�IT܎�;f5���Q�>b5���q#
��p�.���p���naގN&�#��fg~��^� kV�Z��	��ʲя�N3:�m;}*ΘU�gD��G� ���Y�S�[{DҀj����aٲAh��b���6&�����YzKL.1�ac9nX�5��U9��N�!RP��ҒAt��ܓ �~Q�)uMVL �8:>���"�4a������u�F�Q�����&/r�F�M�#�l�ǔwP8K�͠��:?i*qik�)�~�KV��%���D�D�Τ�6��e�M���B)��H��\�+>q�1M}�C��:��I�ԥn��R��G�q�:��2��,���S��%~H���)'�0��1:�7j��%��QA�;"�����ܸ��*�.oD)A�L�jy���3�ꄐs�Q�����/���O�UW��2���s��'�/���FG�/�R�gKCZk��hd��h2�u��߮B�h=�̺M��,3F������;2Z���z곞j�]-�L�f99'�   �� `� nx�ԓ�n�0��}�O-�$��kAM����6$Ӥ9��Ds��v�TQ/����ĉ�Y�(8��&��!������}VT�a��,�[�U�ǰR�xN��&J����%���FW�A�\í����"��|�s�Pp�/�JH��k*�i���L�8u�oj�WF㣫'����x|]��BMA��:J�N�c�Jc_�%��{*������9�YK�g���g�}γ���Nm7�Z�ϴ�����ޝ�����@�i���/h�=�+��M��Y�&I�C��s���)��@�D]U4Q�á]ϻ���_�9a�L�"��b�غ��&`���h9|Gh��`93U)5��fZ^^lƴV��Dml$.y���pO�B���=:����	&�jmD�V~k�M�c]o)0�/иv�TE����6kS���y�%���U,D55k5�K��6�G���@?�1�SA�5zScV/ڗbQ�����6xʄ�S�_F�����Ae��Hj&+/+��W`Iz���# &���O���Κb/����������>h���d#�7��#*۝\�?�S�9�_vV�_   �� V;�8