import React, { useState } from 'react';
import { X, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddStudentModalProps {
  onClose: () => void;
  refreshStudentList: () => void;
  lang?: 'bn' | 'en';
}

export default function AddStudentModal({ onClose, refreshStudentList, lang = 'bn' }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    roll: '',
    class: '',
    section: '',
    phone: '',
    image: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const primaryApiUrl = 'https://schoolbreakend.smartschoolmanagementsystem.com/api/students';
    const fallbackApiUrl = 'https://schoolbackend.smartschoolmanagementsystem.com/api/students';
    const localApiUrl = '/api/students';

    let success = false;
    let errorMessage = '';

    try {
      // 1. Try Primary API Endpoint
      let response = await fetch(primaryApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch (parseErr) {
        // Fallback if non-JSON response
      }

      if (response.ok) {
        success = true;
      } else {
        // 2. Try Secondary/Fallback URL if primary fails
        try {
          const fallbackRes = await fetch(fallbackApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });

          if (fallbackRes.ok) {
            success = true;
          } else {
            // 3. Try Local Backend API
            const localRes = await fetch(localApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            });
            if (localRes.ok) {
              success = true;
            } else {
              errorMessage = (result && (result.error || result.message)) || `Server returned status ${response.status}`;
            }
          }
        } catch (fErr) {
          // Local fallback try
          try {
            const localRes = await fetch(localApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData),
            });
            if (localRes.ok) {
              success = true;
            } else {
              errorMessage = 'Failed to submit student to backend';
            }
          } catch (lErr) {
            errorMessage = 'Network connection failed';
          }
        }
      }

      if (success) {
        setStatusMessage({
          text: lang === 'bn' ? 'শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে!' : 'Student added successfully!',
          type: 'success'
        });
        setTimeout(() => {
          alert(lang === 'bn' ? 'শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে!' : 'Student added successfully!');
          refreshStudentList();
          onClose();
        }, 300);
      } else {
        alert('Failed: ' + (errorMessage || 'Could not save student record.'));
        setStatusMessage({
          text: 'Failed: ' + (errorMessage || 'Could not save student record.'),
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Error adding student:', error);
      // Final attempt at local backend endpoint
      try {
        const localRes = await fetch(localApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (localRes.ok) {
          alert(lang === 'bn' ? 'শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে!' : 'Student added successfully!');
          refreshStudentList();
          onClose();
          return;
        }
      } catch (e) {
        // Ignore
      }

      alert('Error: ' + (error.message || 'Network error occurred'));
      setStatusMessage({ text: 'Error: ' + (error.message || 'Network error occurred'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isBn = lang === 'bn';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 rounded-xl">
              <UserPlus className="h-5 w-5 text-emerald-100" />
            </span>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {isBn ? 'নতুন শিক্ষার্থী যুক্ত করুন' : 'Add New Student'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {isBn ? 'ব্যাকএন্ড সার্ভারে তথ্য যুক্ত করুন' : 'Submit student profile to backend database'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Alert Banner if any */}
        {statusMessage && (
          <div className={`px-6 py-3 text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-rose-50 text-rose-800 border-b border-rose-100'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name & Roll */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBn ? 'শিক্ষার্থীর নাম (Name) *' : 'Student Name *'}
              </label>
              <input
                type="text"
                name="name"
                placeholder={isBn ? 'যেমন: মোহাম্মদ তানভীর' : 'e.g. Tanvir Ahmed'}
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBn ? 'রোল নম্বর (Roll) *' : 'Roll Number *'}
              </label>
              <input
                type="text"
                name="roll"
                placeholder={isBn ? 'যেমন: 05' : 'e.g. 05'}
                value={formData.roll}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Class & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBn ? 'শ্রেণী (Class) *' : 'Class *'}
              </label>
              <input
                type="text"
                name="class"
                placeholder={isBn ? 'যেমন: Class VII' : 'e.g. Class VII'}
                value={formData.class}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBn ? 'শাখা (Section)' : 'Section'}
              </label>
              <input
                type="text"
                name="section"
                placeholder={isBn ? 'যেমন: A / B / Science' : 'e.g. A or B'}
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Phone & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBn ? 'মোবাইল নম্বর (Phone)' : 'Phone Number'}
              </label>
              <input
                type="text"
                name="phone"
                placeholder={isBn ? 'যেমন: 01700000000' : 'e.g. 01700000000'}
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isBn ? 'ছবির লিংক (Image URL)' : 'Photo URL'}
              </label>
              <input
                type="text"
                name="image"
                placeholder="https://..."
                value={formData.image}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {isBn ? 'ঠিকানা (Address)' : 'Address'}
            </label>
            <input
              type="text"
              name="address"
              placeholder={isBn ? 'যেমন: ঢাকা, বাংলাদেশ' : 'e.g. Dhaka, Bangladesh'}
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Submitting...'}</span>
                </>
              ) : (
                <span>{isBn ? 'জমাদান করুন (Submit)' : 'Submit Student'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
