import React, { useEffect, useState } from 'react';
import { User, Search, RefreshCw, Filter, Phone, BookOpen, AlertCircle, Loader2, Users, Plus } from 'lucide-react';
import AddStudentModal from './AddStudentModal';
import { getApiUrl } from '../lib/api';

interface Student {
  sl?: number | string;
  id?: number | string;
  roll: string;
  name: string;
  class?: string;
  class_name?: string;
  section?: string;
  guardian?: string;
  phone?: string;
  mobile_number?: string;
  photo?: string;
  address?: string;
  created_at?: string;
}

interface StudentListProps {
  lang?: 'bn' | 'en';
}

export default function StudentList({ lang = 'bn' }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);

    let combinedStudents: Student[] = [];

    // 1. Fetch from local Node Express backend (/api/students)
    try {
      const localRes = await fetch('/api/students');
      if (localRes.ok) {
        const localData = await localRes.json();
        const list = Array.isArray(localData) ? localData : (localData?.students || []);
        if (Array.isArray(list)) {
          combinedStudents = [...list];
        }
      }
    } catch (e) {
      console.warn("Local /api/students fetch failed:", e);
    }

    // 2. Try fetching from external backend if available
    try {
      const extRes = await fetch('https://studentscaremodelschool.com/get_students.php');
      if (extRes.ok) {
        const extData = await extRes.json();
        const list = Array.isArray(extData) ? extData : (extData?.students || []);
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((s: Student) => {
            if (!combinedStudents.some(existing => String(existing.roll) === String(s.roll))) {
              combinedStudents.push(s);
            }
          });
        }
      }
    } catch (e) {
      // External server offline or 404
    }

    // 3. Merge custom students saved in localStorage
    try {
      const savedLocal = JSON.parse(localStorage.getItem('custom_students_list') || '[]');
      if (Array.isArray(savedLocal)) {
        savedLocal.forEach((s: Student) => {
          if (!combinedStudents.some(existing => String(existing.roll) === String(s.roll))) {
            combinedStudents.unshift(s);
          }
        });
      }
    } catch (e) {
      console.warn("LocalStorage student list merge error:", e);
    }

    setStudents(combinedStudents);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search term, class, section
  const filteredStudents = students.filter((student) => {
    const studentClass = student.class || student.class_name || '';
    const studentSection = student.section || '';
    const studentName = student.name || '';
    const studentRoll = student.roll || '';
    const studentPhone = student.phone || student.mobile_number || '';

    const matchesClass = selectedClass === 'All' || studentClass.toLowerCase().includes(selectedClass.toLowerCase());
    const matchesSection = selectedSection === 'All' || studentSection.toLowerCase() === selectedSection.toLowerCase();
    
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || 
      studentName.toLowerCase().includes(query) ||
      studentRoll.toLowerCase().includes(query) ||
      studentPhone.toLowerCase().includes(query) ||
      studentClass.toLowerCase().includes(query);

    return matchesClass && matchesSection && matchesSearch;
  });

  const isBn = lang === 'bn';

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 md:p-8 space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="h-5 w-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {isBn ? 'শিক্ষার্থী তালিকা (Student List)' : 'Student List'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1">
            {isBn 
              ? 'বিদ্যালয়ের সকল নিবন্ধিত শিক্ষার্থীদের তালিকা ও সাধারণ তথ্য' 
              : 'Registered student database with backend API integration'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isBn ? `মোট শিক্ষার্থী: ${filteredStudents.length}` : `Total: ${filteredStudents.length}`}</span>
          </span>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>{isBn ? '+ নতুন স্টুডেন্ট' : '+ Add New Student'}</span>
          </button>

          <button
            onClick={fetchStudents}
            disabled={loading}
            className="p-2.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 text-gray-600 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={isBn ? 'রিফ্রেশ করুন' : 'Refresh Data'}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
        {/* Search Field */}
        <div className="sm:col-span-6 relative">
          <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'নাম, রোল বা মোবাইল নম্বর দিয়ে খুঁজুন...' : 'Search by name, roll or mobile number...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Class Filter */}
        <div className="sm:col-span-3 relative">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            <option value="All">{isBn ? 'সকল শ্রেণী (All Classes)' : 'All Classes'}</option>
            <option value="Nursery">Nursery</option>
            <option value="KG">KG</option>
            <option value="Class I">Class I</option>
            <option value="Class II">Class II</option>
            <option value="Class III">Class III</option>
            <option value="Class IV">Class IV</option>
            <option value="Class V">Class V</option>
            <option value="Class VI">Class VI</option>
            <option value="Class VII">Class VII</option>
            <option value="Class VIII">Class VIII</option>
            <option value="Class IX">Class IX</option>
            <option value="Class X">Class X</option>
          </select>
        </div>

        {/* Section Filter */}
        <div className="sm:col-span-3 relative">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            <option value="All">{isBn ? 'সকল শাখা (All Sections)' : 'All Sections'}</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="Science">Science</option>
            <option value="Humanities">Humanities</option>
            <option value="Commerce">Commerce</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">
            {isBn ? 'ব্যাকএন্ড API থেকে শিক্ষার্থীদের ডেটা ফেচ করা হচ্ছে...' : 'Fetching student records from backend API...'}
          </p>
        </div>
      ) : error && filteredStudents.length === 0 ? (
        <div className="py-12 text-center bg-amber-50/50 rounded-2xl border border-amber-100 p-6 space-y-3">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-gray-800">
            {isBn ? 'ডেটা লোড করতে সমস্যা হয়েছে' : 'Error loading student data'}
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={fetchStudents}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            {isBn ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-2">
          <Users className="h-8 w-8 text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-gray-700">
            {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No Students Found'}
          </h4>
          <p className="text-xs text-gray-400">
            {isBn ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো ডেটা পাওয়া যায়নি।' : 'No records match your selected criteria.'}
          </p>
        </div>
      ) : (
        /* Students Table */
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/80 text-gray-700 uppercase tracking-wider text-[11px] font-extrabold border-b border-gray-200">
                <th className="py-3 px-4"># SL</th>
                <th className="py-3 px-4">{isBn ? 'ছবি' : 'Photo'}</th>
                <th className="py-3 px-4">{isBn ? 'রোল' : 'Roll'}</th>
                <th className="py-3 px-4">{isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'}</th>
                <th className="py-3 px-4">{isBn ? 'শ্রেণী' : 'Class'}</th>
                <th className="py-3 px-4">{isBn ? 'শাখা' : 'Section'}</th>
                <th className="py-3 px-4">{isBn ? 'অভিভাবক' : 'Guardian'}</th>
                <th className="py-3 px-4">{isBn ? 'মোবাইল' : 'Mobile'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
              {filteredStudents.map((student, index) => {
                const sl = student.sl || student.id || (index + 1);
                const className = student.class || student.class_name || 'N/A';
                const section = student.section || 'A';
                const phone = student.phone || student.mobile_number || 'N/A';
                const photo = student.photo;

                return (
                  <tr key={sl || index} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">{sl}</td>
                    <td className="py-3 px-4">
                      <div className="h-9 w-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center overflow-hidden shrink-0">
                        {photo ? (
                          <img src={photo} alt={student.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-emerald-700" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{student.roll}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{student.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-100">
                        {className}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-bold">
                        {section}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{student.guardian || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">{phone}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Add Student Modal */}
      {isAddModalOpen && (
        <AddStudentModal
          onClose={() => setIsAddModalOpen(false)}
          refreshStudentList={fetchStudents}
          lang={lang}
        />
      )}
    </div>
  );
}
