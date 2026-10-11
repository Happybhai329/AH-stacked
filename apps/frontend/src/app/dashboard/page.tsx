'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [studentInfoOpen, setStudentInfoOpen] = useState(false);

  const inventoryRef = useRef<HTMLDivElement>(null);
  const studentInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, loading]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inventoryRef.current && !inventoryRef.current.contains(event.target as Node)) {
        setInventoryOpen(false);
      }
      if (studentInfoRef.current && !studentInfoRef.current.contains(event.target as Node)) {
        setStudentInfoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const openAppWindow = (url: string) => {
    const w = window.open(url, '_blank', 'width=1200,height=800');
    if (!w) {
      alert('Popup blocked! Please allow popups for this site.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl p-6 md:p-10">
        
        {/* Header Logo & Title */}
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img
              src="https://content.jdmagicbox.com/comp/gwalior/z3/9999px751.x751.190227154234.i9z3/catalogue/the-prime-classes-deen-dayal-nagar-gwalior-military-schools-ekri38mt5y.jpg"
              alt="Logo"
              className="h-12 w-auto object-contain rounded"
            />
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{
                background: 'linear-gradient(to right, #10B981, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              THE PRIME CLASSES — ACADEMIC MANAGER
            </h1>
          </div>
          <button
            onClick={logout}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-medium px-4 py-2 rounded-lg text-sm border border-red-200 transition"
          >
            Logout
          </button>
        </div>

        {/* User Info Card (Exact GS App Structure) */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-lg mb-6 shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
            <div><strong>Name:</strong> <span id="user-name">{user.name}</span></div>
            <div><strong>ID:</strong> <span id="user-id">{user.id}</span></div>
            <div><strong>Post:</strong> <span id="user-post">{user.post}</span></div>
            <div><strong>Email:</strong> <span id="user-email">{user.email || 'N/A'}</span></div>
            <div><strong>Mobile:</strong> <span id="user-mobile">{user.mobile || 'N/A'}</span></div>
          </div>
        </div>

        {/* Action Grid (Exact GS App Order & Colors) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          
          {/* 1. CLASSES MANAGE */}
          <button
            onClick={() => openAppWindow('https://script.google.com/macros/s/AKfycbyvqYtBFkA6DYv4qsxYmaI0zxA8EvDGfWRhLvdV3WSWFaD_ypxCWZFFylC5TO2Rx8s/exec')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center"
          >
            CLASSES MANAGE
          </button>

          {/* 2. HEADS MANAGE */}
          <button
            onClick={() => openAppWindow('https://script.google.com/macros/s/AKfycbyYyvt2PjDQpfUI-0YF4UEEXVz58ZLRmkQSPUWJW9shgPZULVKDszI_bOfjOWTMHpw/exec')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center"
          >
            HEADS MANAGE
          </button>

          {/* 3. TASK MANAGE */}
          <a
            href="/tasks"
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center flex items-center justify-center"
          >
            TASK MANAGE
          </a>

          {/* 4. INVENTORY DROPDOWN */}
          <div className="relative" ref={inventoryRef}>
            <button
              type="button"
              onClick={() => {
                setInventoryOpen(!inventoryOpen);
                setStudentInfoOpen(false);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg shadow transition flex items-center justify-center gap-2"
            >
              INVENTORY
              <span className={`text-xs transition-transform ${inventoryOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {inventoryOpen && (
              <div className="absolute z-20 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInventoryOpen(false);
                    openAppWindow('https://script.google.com/macros/s/AKfycbxkCj80ScBn6gt7pApQfbadyTRnv2SJhK0Ocb_4Jgb__AHaG03xktSYsKlWDu66WUsY/exec');
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-3 rounded shadow text-sm transition"
                >
                  ITEM MANAGER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInventoryOpen(false);
                    openAppWindow('https://script.google.com/macros/s/AKfycbzOjdVfzQmQvw10k0jPJFdXAQisXWr34ChtYIlnm7dhsnvqcUqpgrBozECQ--R9AQ/exec');
                  }}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-3 rounded shadow text-sm transition"
                >
                  ITEM REQUEST
                </button>
              </div>
            )}
          </div>

          {/* 5. EXAM SECTION */}
          <button
            onClick={() => openAppWindow('https://script.google.com/macros/s/AKfycbx7AVQNfzBWkeb90fOyrL5knQGNBSI2hBBkfzb6my_0pe-PH5IzSLBoigSFj1KbKT5jwQ/exec')}
            className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center"
          >
            EXAM SECTION
          </button>

          {/* 6. STUDENTS MANAGE */}
          <a
            href="/students"
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center flex items-center justify-center"
          >
            STUDENTS MANAGE
          </a>

          {/* 7. STUDENT INFO DROPDOWN */}
          <div className="relative" ref={studentInfoRef}>
            <button
              type="button"
              onClick={() => {
                setStudentInfoOpen(!studentInfoOpen);
                setInventoryOpen(false);
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg shadow transition flex items-center justify-center gap-2"
            >
              STUDENT INFO
              <span className={`text-xs transition-transform ${studentInfoOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {studentInfoOpen && (
              <div className="absolute z-20 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStudentInfoOpen(false);
                    openAppWindow('https://script.google.com/macros/s/AKfycbwNysudWSRe7yRsnK7-5Qd58EZOTk3fNCKnyNZq-43C-1TqyxisaIBe1Ic_Go1Ywbl/exec');
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded shadow text-sm transition"
                >
                  STUDENT PERFORMANCE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentInfoOpen(false);
                    openAppWindow('http://localhost:10000');
                  }}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-3 rounded shadow text-sm transition"
                >
                  STUDENT REPORT (PORTAL)
                </button>
              </div>
            )}
          </div>

          {/* 8. CLASSPLUS LOGIN */}
          <button
            onClick={() => openAppWindow('https://classplusapp.com/diy/login')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center"
          >
            CLASSPLUS LOGIN
          </button>

          {/* 9. FOR GRIEVANCE DEPARTMENT */}
          <button
            onClick={() => openAppWindow('https://script.google.com/macros/s/AKfycbwccBgWzNkrYOs5XQVM7PBN2umTVNUZk9ZMA8x9DJbVmNOZaNI7q46eczSEbnOTZbdd/exec')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center"
          >
            FOR GRIEVANCE DEPARTMENT
          </button>

          {/* 10. JOB REQUIREMENT */}
          <button
            onClick={() => openAppWindow('https://script.google.com/macros/s/AKfycbz1lCEVseoDkLizFlOHR3U5YOjfTyro8-TdBjnbTn4YKlVKCpEC8dlXIAvkzpaXR_Yu/exec')}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center"
          >
            JOB REQUIREMENT
          </button>

          {/* 11. DAILY ALERTS */}
          <button
            onClick={() => openAppWindow('https://script.google.com/macros/s/AKfycbxMWgrK3NBYdSyc_9oQ1PwHZ94os5vdozZZRQ-XXfAC4YFVTg2Rnhso-uv3fupwEsbA/exec')}
            className="bg-black hover:bg-neutral-900 text-white font-semibold py-3 px-4 rounded-lg border border-neutral-800 shadow transition transform hover:scale-[1.02] text-center"
          >
            DAILY ALERTS
          </button>

          {/* 12. LOGOUT */}
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg shadow transition transform hover:scale-[1.02] text-center"
          >
            Logout
          </button>

        </div>

        {/* Info banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
          <span>
            Connected to <strong>The Prime Classes Academic ERP</strong> &bull; Supabase PostgreSQL + Google Sheets Synchronized
          </span>
          <span className="font-semibold text-emerald-600">Active Session</span>
        </div>

      </div>
    </div>
  );
}
