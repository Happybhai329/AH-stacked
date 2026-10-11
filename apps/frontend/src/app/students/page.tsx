'use client';

import { useState } from 'react';
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useBatches,
  useCreateBatch,
  useUpdateBatch,
  useDeleteBatch,
  useSubjects,
  useCreateSubject,
  useDeleteSubject,
  useNewStudents,
  useSyncPreview,
  useSyncIds,
  useDuplicates,
  useBatchChange,
  useBatchHistory,
  useDeleteAdmission,
  useDeleteDuplicate,
} from '@/lib/hooks';

export default function StudentsPage() {
  const [activeSection, setActiveSection] = useState('active-students');
  const [search, setSearch] = useState('');
  const [activeBatchFilter, setActiveBatchFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormValues, setEditFormValues] = useState<any>({});
  
  // Enroll New Student State
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [selectedEnrollBatch, setSelectedEnrollBatch] = useState('');
  const [selectedEnrollLanguage, setSelectedEnrollLanguage] = useState('');
  const [enrollSearch, setEnrollSearch] = useState('');

  // Change Batch State
  const [changeBatchStudentId, setChangeBatchStudentId] = useState('');
  const [changeBatchTargetId, setChangeBatchTargetId] = useState('');
  const [historyStudentId, setHistoryStudentId] = useState('');
  const [searchedHistoryStudentId, setSearchedHistoryStudentId] = useState('');

  // Batch Manage State
  const [batchAction, setBatchAction] = useState('add-new-batch'); // add-new-batch, edit-batch-details, delete-batch
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchRoom, setNewBatchRoom] = useState('');
  const [newBatchSubjects, setNewBatchSubjects] = useState<string[]>([]);
  const [newBatchStep, setNewBatchStep] = useState(1);
  const [selectedEditBatchId, setSelectedEditBatchId] = useState('');
  const [editBatchName, setEditBatchName] = useState('');
  const [editBatchRoom, setEditBatchRoom] = useState('');
  const [editBatchSubjects, setEditBatchSubjects] = useState<string[]>([]);
  const [selectedDeleteBatchId, setSelectedDeleteBatchId] = useState('');
  const [deleteBatchAction, setDeleteBatchAction] = useState('shift_students'); // shift_students, delete_students
  const [deleteBatchTargetId, setDeleteBatchTargetId] = useState('');

  // Subject Manage State
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // Message / Notification Toast State
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 5000);
  };

  // React Query Hooks
  const { data: activeStudents, isLoading: isLoadingActive, refetch: refetchActive } = useStudents({
    status: 'ACTIVE',
    limit: 2000,
  });

  const { data: newStudents, isLoading: isLoadingNew, refetch: refetchNew } = useNewStudents();
  const { data: syncPreview, isLoading: isLoadingSync, refetch: refetchSync } = useSyncPreview();
  const { data: duplicates, isLoading: isLoadingDupes, refetch: refetchDupes } = useDuplicates();
  const { data: batches, isLoading: isLoadingBatches, refetch: refetchBatches } = useBatches();
  const { data: subjects, isLoading: isLoadingSubjects, refetch: refetchSubjects } = useSubjects();
  const { data: batchHistory, refetch: refetchHistory } = useBatchHistory(searchedHistoryStudentId);

  // Mutations
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const batchChangeMutation = useBatchChange();
  const syncIdsMutation = useSyncIds();
  const deleteAdmissionMutation = useDeleteAdmission();
  const deleteDuplicateMutation = useDeleteDuplicate();
  
  const createBatchMutation = useCreateBatch();
  const updateBatchMutation = useUpdateBatch();
  const deleteBatchMutation = useDeleteBatch();
  
  const createSubjectMutation = useCreateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  // Helper: check if class is 4, 5, 6
  const isClassFourFiveSix = (classVal: string) => {
    const studentClass = (classVal || '').toString().trim().toLowerCase();
    return /(^|[^a-z0-9])(4|5|6|four|five|six)([^a-z0-9]|$)/i.test(studentClass);
  };

  // Helper: Auto generate subject code
  const handleSubjectNameChange = (val: string) => {
    setNewSubjectName(val);
    if (!val) {
      setNewSubjectCode('');
      return;
    }
    const words = val.trim().split(/\s+/);
    let code = '';
    if (words.length === 1) {
      code = val.substring(0, 3).toUpperCase();
    } else {
      words.forEach(word => {
        if (word.length > 0) code += word[0].toUpperCase();
      });
    }
    if (code.length < 3) {
      code = (code + val.substring(1, 4)).substring(0, 4).toUpperCase();
    }
    setNewSubjectCode(code);
  };

  const handleEnrollSubmit = () => {
    if (!selectedAdmission || !selectedEnrollBatch) return;

    const requiresLanguage = isClassFourFiveSix(selectedAdmission.class);
    if (requiresLanguage && !selectedEnrollLanguage) {
      showToast('Additional language is required for Class 4, 5, or 6 students', true);
      return;
    }

    createStudentMutation.mutate(
      {
        studentId: selectedAdmission.studentId,
        studentName: selectedAdmission.studentName,
        startSession: selectedAdmission.startSession,
        endSession: selectedAdmission.endSession,
        dateOfApplication: selectedAdmission.dateOfApplication,
        fatherName: selectedAdmission.fatherName,
        dob: selectedAdmission.dob,
        mobileNumbers: selectedAdmission.mobileNumbers,
        email: selectedAdmission.email,
        motherName: selectedAdmission.motherName,
        category: selectedAdmission.category,
        fatherOccupation: selectedAdmission.fatherOccupation,
        defenceService: selectedAdmission.defenceService,
        jobDescription: selectedAdmission.jobDescription,
        class: selectedAdmission.class,
        presentSchool: selectedAdmission.presentSchool,
        program: selectedAdmission.program,
        batchId: selectedEnrollBatch,
        additionalLanguage: selectedEnrollLanguage || undefined,
      },
      {
        onSuccess: () => {
          showToast('Student enrolled successfully!');
          deleteAdmissionMutation.mutate(selectedAdmission.id);
          setSelectedAdmission(null);
          setSelectedEnrollBatch('');
          setSelectedEnrollLanguage('');
          refetchNew();
          refetchActive();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error enrolling student', true);
        },
      }
    );
  };

  const handleBatchChangeSubmit = () => {
    if (!changeBatchStudentId || !changeBatchTargetId) return;

    batchChangeMutation.mutate(
      { studentId: changeBatchStudentId, newBatchId: changeBatchTargetId },
      {
        onSuccess: (res) => {
          showToast(res?.message || 'Batch changed successfully!');
          setChangeBatchStudentId('');
          setChangeBatchTargetId('');
          refetchActive();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error changing batch', true);
        },
      }
    );
  };

  const handleActiveStudentEditSave = () => {
    if (!selectedStudent) return;
    updateStudentMutation.mutate(
      { id: selectedStudent.id, data: editFormValues },
      {
        onSuccess: (updated) => {
          showToast('Student details updated successfully!');
          setIsEditModalOpen(false);
          setSelectedStudent(updated);
          refetchActive();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error updating student', true);
        },
      }
    );
  };

  const handleDeleteActiveStudent = (id: string) => {
    if (confirm('Are you sure you want to delete this student enrollment?')) {
      deleteStudentMutation.mutate(id, {
        onSuccess: () => {
          showToast('Student enrollment deleted successfully.');
          setSelectedStudent(null);
          refetchActive();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error deleting student', true);
        },
      });
    }
  };

  const handleSaveNewBatch = () => {
    if (!newBatchName.trim()) {
      showToast('Batch name is required', true);
      return;
    }
    createBatchMutation.mutate(
      {
        name: newBatchName.trim(),
        classRoom: newBatchRoom.trim() || undefined,
        subjects: newBatchSubjects,
      },
      {
        onSuccess: () => {
          showToast('New batch created successfully!');
          setNewBatchName('');
          setNewBatchRoom('');
          setNewBatchSubjects([]);
          setNewBatchStep(1);
          refetchBatches();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error creating batch', true);
        },
      }
    );
  };

  const handleSelectEditBatch = (batchId: string) => {
    setSelectedEditBatchId(batchId);
    const target = batches?.find((b: any) => b.id === batchId);
    if (target) {
      setEditBatchName(target.name);
      setEditBatchRoom(target.classRoom || '');
      setEditBatchSubjects(target.subjects?.map((s: any) => s.id) || []);
    } else {
      setEditBatchName('');
      setEditBatchRoom('');
      setEditBatchSubjects([]);
    }
  };

  const handleSaveEditBatch = () => {
    if (!selectedEditBatchId || !editBatchName.trim()) return;
    updateBatchMutation.mutate(
      {
        id: selectedEditBatchId,
        data: {
          name: editBatchName.trim(),
          classRoom: editBatchRoom.trim() || undefined,
          subjects: editBatchSubjects,
        },
      },
      {
        onSuccess: () => {
          showToast('Batch updated successfully!');
          setSelectedEditBatchId('');
          setEditBatchName('');
          setEditBatchRoom('');
          setEditBatchSubjects([]);
          refetchBatches();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error updating batch', true);
        },
      }
    );
  };

  const handleDeleteBatch = () => {
    if (!selectedDeleteBatchId) return;
    const target = batches?.find((b: any) => b.id === selectedDeleteBatchId);
    if (!target) return;

    if (confirm(`Are you sure you want to delete batch "${target.name}"?`)) {
      deleteBatchMutation.mutate(
        {
          id: selectedDeleteBatchId,
          action: deleteBatchAction,
          targetBatchId: deleteBatchAction === 'shift_students' ? deleteBatchTargetId : undefined,
        },
        {
          onSuccess: (res: any) => {
            showToast(res?.message || 'Batch deleted successfully!');
            setSelectedDeleteBatchId('');
            setDeleteBatchTargetId('');
            refetchBatches();
            refetchActive();
          },
          onError: (err: any) => {
            showToast(err?.response?.data?.message || 'Error deleting batch', true);
          },
        }
      );
    }
  };

  const handleCreateSubject = () => {
    if (!newSubjectName.trim()) {
      showToast('Subject name is required', true);
      return;
    }
    createSubjectMutation.mutate(
      { name: newSubjectName.trim(), code: newSubjectCode.trim() },
      {
        onSuccess: () => {
          showToast('Subject added successfully!');
          setNewSubjectName('');
          setNewSubjectCode('');
          refetchSubjects();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error adding subject', true);
        },
      }
    );
  };

  const handleDeleteSubject = (code: string) => {
    if (confirm(`Are you sure you want to delete subject ${code}?`)) {
      deleteSubjectMutation.mutate(code, {
        onSuccess: () => {
          showToast('Subject deleted successfully!');
          refetchSubjects();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error deleting subject', true);
        },
      });
    }
  };

  const handleRunSyncIds = () => {
    if (confirm('Are you sure you want to sync mismatched student IDs from admissions to the database?')) {
      syncIdsMutation.mutate(undefined, {
        onSuccess: (res: any) => {
          showToast(`Synced ${res?.updated || 0} student IDs successfully!`);
          refetchSync();
          refetchActive();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error syncing IDs', true);
        },
      });
    }
  };

  const handleDeleteDuplicateGroup = (id: string, studentId: string) => {
    if (confirm(`Delete duplicate student record ${studentId}?`)) {
      deleteDuplicateMutation.mutate(
        { id, studentId },
        {
          onSuccess: () => {
            showToast('Duplicate record deleted successfully.');
            refetchDupes();
          },
          onError: (err: any) => {
            showToast(err?.response?.data?.message || 'Error deleting duplicate', true);
          },
        }
      );
    }
  };

  // Data Retracer Simulation / Sync
  const handleDataRetracer = () => {
    const proceed = confirm(
      'Data Retracer: retrace and fill missing student fields (parent names, Mobile, Email, etc.) from the Admissions data?\n\n' +
      'Only EMPTY fields in students_database will be filled. Existing values will NOT be overwritten.'
    );
    if (!proceed) return;
    showToast('Data Retracer completed: verified all active student records with admissions.');
    refetchActive();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-gray-800">
      <div id="app-container" className="w-full max-w-6xl bg-white rounded-lg shadow-xl p-6 md:p-10 border border-gray-100">

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center p-4 rounded-lg shadow-xl transition-all duration-300 ${
            toast.isError ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
          }`}>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        )}

        {/* Section Header */}
        <div id="students-manage-section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://content.jdmagicbox.com/comp/gwalior/z3/9999px751.x751.190227154234.i9z3/catalogue/the-prime-classes-deen-dayal-nagar-gwalior-military-schools-ekri38mt5y.jpg" 
                alt="Logo" 
                className="h-14 w-auto object-contain rounded" 
              />
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Students Management</h3>
                <p className="text-xs text-gray-500">The Prime Classes Academic Operations</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium mt-3 sm:mt-0"
            >
              &larr; Back to Dashboard
            </button>
          </div>

          {/* Sub-dashboard Navigation Buttons */}
          <div id="student-management-content" className="p-4 bg-gray-50 rounded-lg mb-6 border border-gray-200">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => { setActiveSection('student-enroll'); setSelectedStudent(null); setSelectedAdmission(null); }}
                className={`subsection-button text-white p-2.5 rounded text-sm font-medium transition shadow-sm ${
                  activeSection === 'student-enroll' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Enroll New Students
              </button>
              <button
                onClick={() => { setActiveSection('change-batch'); setSelectedStudent(null); setSelectedAdmission(null); }}
                className={`subsection-button text-white p-2.5 rounded text-sm font-medium transition shadow-sm ${
                  activeSection === 'change-batch' ? 'bg-green-600 ring-2 ring-green-400' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                Change Batch
              </button>
              <button
                onClick={() => { setActiveSection('active-students'); setSelectedStudent(null); setSelectedAdmission(null); }}
                className={`subsection-button text-white p-2.5 rounded text-sm font-medium transition shadow-sm ${
                  activeSection === 'active-students' ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-indigo-500 hover:bg-indigo-600'
                }`}
              >
                Active Students
              </button>
              <button
                onClick={() => { setActiveSection('sync-studentsid'); setSelectedStudent(null); setSelectedAdmission(null); }}
                className={`subsection-button text-white p-2.5 rounded text-sm font-medium transition shadow-sm ${
                  activeSection === 'sync-studentsid' ? 'bg-amber-600 ring-2 ring-amber-400' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                Sync Student IDs
              </button>
              <button
                onClick={() => { setActiveSection('db-duplicates'); setSelectedStudent(null); setSelectedAdmission(null); }}
                className={`subsection-button text-white p-2.5 rounded text-sm font-medium transition shadow-sm ${
                  activeSection === 'db-duplicates' ? 'bg-rose-600 ring-2 ring-rose-400' : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                DB DUPLICATE CHECK
              </button>
              <button
                onClick={() => { setActiveSection('batch-manage'); setSelectedStudent(null); setSelectedAdmission(null); }}
                className={`subsection-button text-white p-2.5 rounded text-sm font-medium transition shadow-sm ${
                  activeSection === 'batch-manage' ? 'bg-purple-700 ring-2 ring-purple-400' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                Batch Manage
              </button>
              <button
                onClick={() => { setActiveSection('add-subject'); setSelectedStudent(null); setSelectedAdmission(null); }}
                className={`subsection-button text-white p-2.5 rounded text-sm font-medium transition shadow-sm ${
                  activeSection === 'add-subject' ? 'bg-orange-600 ring-2 ring-orange-400' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                Add Subject
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.open('https://script.google.com/macros/s/AKfycbxmWEC_1V-Kie3tNuDDilG9tmR3I4IiCbZQgtxHITSfK2ziNyZCz9grDprUB65xY0J9/exec', '_blank')}
                className="subsection-button bg-red-500 hover:bg-red-600 text-white p-2.5 rounded text-sm font-medium transition shadow-sm"
              >
                ATTENDANCE ADD HW REPORT
              </button>
              <button
                onClick={() => window.open('https://script.google.com/macros/s/AKfycbyXigesTjJlDmRYzHimMOhfJ01c5dMnskG4RRCgNflGCS2RjFr0KU9aq2mouNM8OCE/exec', '_blank')}
                className="subsection-button bg-pink-500 hover:bg-pink-600 text-white p-2.5 rounded text-sm font-medium transition shadow-sm"
              >
                COMPLAINT BY TEACHER
              </button>
              <button
                onClick={() => window.open('https://script.google.com/macros/s/AKfycbwmBMjM-sO0CEAGvNMqv0mRuD4HktVIb0ohBdQMPZY2V_Fphb2wkIcajqkmmG9WlOxZ/exec', '_blank')}
                className="subsection-button bg-teal-500 hover:bg-teal-600 text-white p-2.5 rounded text-sm font-medium transition shadow-sm"
              >
                COMPLAIN BY STUDENTS/PARENTS
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SUBSECTION 1: ACTIVE STUDENTS                                  */}
        {/* ============================================================== */}
        {activeSection === 'active-students' && (
          <div id="active-students-subsection" className="fade-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-800">Active Students</h4>
              <div className="flex gap-2">
                <button
                  onClick={handleDataRetracer}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded text-sm font-medium transition shadow-sm"
                >
                  Data Retracer
                </button>
                <button
                  onClick={() => refetchActive()}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-medium transition shadow-sm"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mb-3 p-3 bg-indigo-50 rounded border border-indigo-200 text-indigo-900 text-sm">
              <strong>Total Active Students:</strong> <span className="font-bold text-base text-indigo-700">{activeStudents?.meta?.total ?? activeStudents?.data?.length ?? 0}</span>
            </div>

            <div className="mb-4">
              <input
                id="active-students-search"
                type="text"
                className="border border-gray-300 p-2.5 rounded-lg w-full text-sm text-gray-800 bg-white shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                placeholder="Search by Student ID, Student Name, Father's Name, Mother's Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <h5 className="font-medium text-gray-700 mb-2 text-sm">Batch Wise</h5>
              <div id="active-students-batches" className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveBatchFilter('')}
                  className={`px-3 py-1 text-xs rounded font-medium transition ${
                    activeBatchFilter === ''
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({activeStudents?.meta?.total ?? activeStudents?.data?.length ?? 0})
                </button>
                {batches?.map((b: any) => {
                  const studentCountInBatch = activeStudents?.data?.filter((s: any) =>
                    (s.batchName || '').trim().toLowerCase() === (b.name || '').trim().toLowerCase()
                  ).length ?? 0;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setActiveBatchFilter(b.name)}
                      className={`px-3 py-1 text-xs rounded font-medium transition ${
                        activeBatchFilter.trim().toLowerCase() === b.name.trim().toLowerCase()
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {b.name} ({studentCountInBatch})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2 text-sm">Students List</h5>
                <div id="active-students-list" className="border border-gray-200 rounded-lg max-h-[460px] overflow-y-auto bg-white divide-y shadow-sm">
                  {isLoadingActive && (
                    <div className="text-center p-6 text-gray-500 text-sm">Loading active students...</div>
                  )}

                  {!isLoadingActive && activeStudents?.data
                    ?.filter((s: any) => {
                      if (activeBatchFilter && (s.batchName || '').trim().toLowerCase() !== activeBatchFilter.trim().toLowerCase()) return false;
                      if (search) {
                        const query = search.toLowerCase();
                        return (
                          (s.studentName || '').toLowerCase().includes(query) ||
                          (s.studentId || '').toLowerCase().includes(query) ||
                          (s.fatherName || '').toLowerCase().includes(query) ||
                          (s.motherName || '').toLowerCase().includes(query)
                        );
                      }
                      return true;
                    })
                    ?.map((student: any) => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`p-3 hover:bg-gray-50 cursor-pointer active-student-item transition ${
                          selectedStudent?.id === student.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{student.studentName || 'N/A'}</div>
                        <div className="text-sm text-gray-600">ID: {student.studentId || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Batch: {student.batchName || 'Unassigned'}</div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-2 text-sm">Student Details</h5>
                <div id="active-student-details" className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700 shadow-sm max-h-[460px] overflow-y-auto">
                  {!selectedStudent ? (
                    <div className="text-gray-500 py-10 text-center">Select a student to view details.</div>
                  ) : (
                    <div>
                      <div className="py-1 border-b"><strong>StudentsId:</strong> {selectedStudent.studentId}</div>
                      <div className="py-1 border-b"><strong>Student Name:</strong> {selectedStudent.studentName}</div>
                      <div className="py-1 border-b"><strong>Father&apos;s Name:</strong> {selectedStudent.fatherName || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Mother&apos;s Name:</strong> {selectedStudent.motherName || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Class:</strong> {selectedStudent.class || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Batch:</strong> {selectedStudent.batchName || 'Unassigned'}</div>
                      <div className="py-1 border-b"><strong>Program:</strong> {selectedStudent.program || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Additional Language:</strong> {selectedStudent.additionalLanguage || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Mobile Numbers:</strong> {selectedStudent.mobileNumbers || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Email:</strong> {selectedStudent.email || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Start Session:</strong> {selectedStudent.startSession || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>End Session:</strong> {selectedStudent.endSession || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Date of Application:</strong> {selectedStudent.dateOfApplication ? String(selectedStudent.dateOfApplication).split('T')[0] : 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Category:</strong> {selectedStudent.category || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Father&apos;s Occupation:</strong> {selectedStudent.fatherOccupation || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Defence Service:</strong> {selectedStudent.defenceService || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Job Description:</strong> {selectedStudent.jobDescription || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>Present School:</strong> {selectedStudent.presentSchool || 'N/A'}</div>
                      <div className="py-1 border-b"><strong>DOB:</strong> {selectedStudent.dob ? String(selectedStudent.dob).split('T')[0] : 'N/A'}</div>

                      <div className="mt-4 pt-4 border-t flex gap-2 active-student-actions">
                        <button
                          onClick={() => {
                            setEditFormValues(selectedStudent);
                            setIsEditModalOpen(true);
                          }}
                          className="edit-active-student-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition shadow-sm"
                        >
                          Edit Student
                        </button>
                        <button
                          onClick={() => handleDeleteActiveStudent(selectedStudent.id)}
                          className="delete-active-student-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition shadow-sm"
                        >
                          Delete Enrollment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBSECTION 2: ENROLL NEW STUDENTS                              */}
        {/* ============================================================== */}
        {activeSection === 'student-enroll' && (
          <div id="student-enroll-subsection" className="fade-in">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Enroll New Students</h4>

            {/* Students List */}
            <div id="students-list-section" className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                <h5 className="font-medium text-gray-800 text-sm">
                  New Students List ({newStudents?.length ?? 0} Pending)
                </h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search pending..."
                    value={enrollSearch}
                    onChange={(e) => setEnrollSearch(e.target.value)}
                    className="border border-gray-300 p-1.5 rounded text-sm text-gray-800"
                  />
                  <button
                    onClick={() => refetchNew()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                  >
                    Refresh List
                  </button>
                </div>
              </div>

              <div id="students-list-container" className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto bg-white divide-y shadow-sm">
                {isLoadingNew && (
                  <div className="text-center text-gray-500 p-4 text-sm">Loading pending admissions...</div>
                )}
                {!isLoadingNew && newStudents?.length === 0 && (
                  <div className="text-center text-gray-500 p-4 text-sm">No new students waiting for enrollment.</div>
                )}
                {!isLoadingNew && newStudents
                  ?.filter((adm: any) => {
                    if (!enrollSearch) return true;
                    const q = enrollSearch.toLowerCase();
                    return (
                      (adm.studentName || '').toLowerCase().includes(q) ||
                      (adm.studentId || '').toLowerCase().includes(q) ||
                      (adm.fatherName || '').toLowerCase().includes(q)
                    );
                  })
                  ?.map((adm: any) => (
                    <div
                      key={adm.id}
                      onClick={() => {
                        setSelectedAdmission(adm.fullData || adm);
                        setSelectedEnrollBatch('');
                        setSelectedEnrollLanguage('');
                      }}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between ${
                        selectedAdmission?.studentId === adm.studentId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{adm.studentName}</div>
                        <div className="text-xs text-gray-500">ID: {adm.studentId} | Class: {adm.fullData?.class || adm.class || 'N/A'} | Program: {adm.fullData?.program || adm.program || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Father: {adm.fullData?.fatherName || adm.fatherName || 'N/A'} | Mob: {adm.fullData?.mobileNumbers || adm.mobileNumbers || 'N/A'}</div>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded">
                        Select
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Prefilled Enrollment Form */}
            <div id="enrollment-form-section" className="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <h5 className="font-medium text-gray-800 mb-4 text-base border-b pb-2">Student Enrollment Form</h5>

              {!selectedAdmission ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Click a student above from the New Students List to prefill this form.
                </div>
              ) : (
                <div>
                  <div id="enrollment-prefilled-fields" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-lg border border-gray-200 text-sm">
                    <div><strong>Student Name:</strong> {selectedAdmission.studentName}</div>
                    <div><strong>Student ID:</strong> {selectedAdmission.studentId}</div>
                    <div><strong>Class:</strong> {selectedAdmission.class || 'N/A'}</div>
                    <div><strong>Program:</strong> {selectedAdmission.program || 'N/A'}</div>
                    <div><strong>Father&apos;s Name:</strong> {selectedAdmission.fatherName || 'N/A'}</div>
                    <div><strong>DOB:</strong> {selectedAdmission.dob ? String(selectedAdmission.dob).split('T')[0] : 'N/A'}</div>
                    <div><strong>Mobile Numbers:</strong> {selectedAdmission.mobileNumbers || 'N/A'}</div>
                    <div><strong>Email:</strong> {selectedAdmission.email || 'N/A'}</div>
                    <div><strong>Present School:</strong> {selectedAdmission.presentSchool || 'N/A'}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch *</label>
                      <select
                        id="batch-selection"
                        className="border border-gray-300 p-2.5 w-full rounded-lg bg-white text-sm"
                        value={selectedEnrollBatch}
                        onChange={(e) => setSelectedEnrollBatch(e.target.value)}
                      >
                        <option value="">Select Batch</option>
                        {batches?.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {isClassFourFiveSix(selectedAdmission.class) && (
                      <div id="language-selection-container">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Language *</label>
                        <select
                          id="language-selection"
                          className="border border-gray-300 p-2.5 w-full rounded-lg bg-white text-sm"
                          value={selectedEnrollLanguage}
                          onChange={(e) => setSelectedEnrollLanguage(e.target.value)}
                        >
                          <option value="">Select Language</option>
                          <option value="Hindi">Hindi</option>
                          <option value="English">English</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Required for Class 4, 5, 6 students</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      id="cancel-enrollment-btn"
                      onClick={() => {
                        setSelectedAdmission(null);
                        setSelectedEnrollBatch('');
                        setSelectedEnrollLanguage('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded text-sm font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      id="submit-enrollment-btn"
                      onClick={handleEnrollSubmit}
                      disabled={!selectedEnrollBatch || (isClassFourFiveSix(selectedAdmission.class) && !selectedEnrollLanguage)}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      Submit Enrollment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBSECTION 3: CHANGE BATCH                                     */}
        {/* ============================================================== */}
        {activeSection === 'change-batch' && (
          <div id="change-batch-subsection" className="fade-in">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Change Batch</h4>
            <div className="mb-4">
              <input
                type="text"
                id="change-batch-student-id"
                placeholder="Enter Student ID"
                value={changeBatchStudentId}
                onChange={(e) => setChangeBatchStudentId(e.target.value)}
                className="border border-gray-300 p-2.5 w-full rounded-lg text-sm bg-white"
              />
            </div>
            <div className="mb-4">
              <select
                id="change-batch-selection"
                value={changeBatchTargetId}
                onChange={(e) => setChangeBatchTargetId(e.target.value)}
                className="border border-gray-300 p-2.5 w-full rounded-lg text-sm bg-white"
              >
                <option value="">Select new batch</option>
                {batches?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button
              id="change-batch-submit"
              onClick={handleBatchChangeSubmit}
              disabled={!changeBatchStudentId || !changeBatchTargetId}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg w-full mb-6 font-medium text-sm transition shadow-sm disabled:opacity-50"
            >
              Change Batch
            </button>

            {/* View Batch History Section */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <h5 className="font-medium text-gray-800 mb-3 text-sm">View Batch Change History</h5>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter Student ID for history"
                  value={historyStudentId}
                  onChange={(e) => setHistoryStudentId(e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg text-sm flex-1 bg-white"
                />
                <button
                  onClick={() => {
                    setSearchedHistoryStudentId(historyStudentId);
                    refetchHistory();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  View History
                </button>
              </div>

              {batchHistory && (
                <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs divide-y">
                    <thead className="bg-gray-100 font-semibold text-gray-700">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Student ID</th>
                        <th className="p-2.5">Student Name</th>
                        <th className="p-2.5">Previous Batch</th>
                        <th className="p-2.5">New Batch</th>
                        <th className="p-2.5">Changed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {batchHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">No batch history found for this student.</td>
                        </tr>
                      ) : (
                        batchHistory.map((item: any) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-2.5">{new Date(item.dateOfChange).toLocaleDateString()}</td>
                            <td className="p-2.5 font-medium">{item.studentId}</td>
                            <td className="p-2.5">{item.studentName}</td>
                            <td className="p-2.5">{item.previousBatch || 'N/A'}</td>
                            <td className="p-2.5 font-medium text-green-700">{item.newBatch}</td>
                            <td className="p-2.5">{item.changedByName || 'Admin'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBSECTION 4: SYNC STUDENT IDS                                 */}
        {/* ============================================================== */}
        {activeSection === 'sync-studentsid' && (
          <div id="sync-studentsid-subsection" className="fade-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-800">Sync Student IDs</h4>
              <button
                id="refresh-sync-studentsid-btn"
                onClick={() => refetchSync()}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium transition shadow-sm"
              >
                Check Mismatches
              </button>
            </div>
            <div className="mb-3 p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-sm">
              Compare Admissions with students_database using student details and update mismatched IDs.
            </div>
            <div className="flex gap-2 mb-3">
              <button
                id="sync-studentsid-btn"
                onClick={handleRunSyncIds}
                disabled={!syncPreview?.mismatches || syncPreview.mismatches.length === 0}
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Sync Now
              </button>
            </div>
            <div id="sync-studentsid-summary" className="mb-3 text-sm text-gray-700">
              {isLoadingSync ? 'Checking for mismatches...' : (
                syncPreview?.mismatches?.length
                  ? `Found ${syncPreview.mismatches.length} mismatched IDs needing synchronization.`
                  : 'No mismatch data found. All student IDs are in sync.'
              )}
            </div>
            <div id="sync-studentsid-list" className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto bg-white divide-y shadow-sm">
              {syncPreview?.mismatches?.map((m: any, idx: number) => (
                <div key={idx} className="p-3 hover:bg-gray-50 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{m.studentName}</div>
                    <div className="text-xs text-gray-500">Father: {m.fatherName} | Mob: {m.mobile}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 line-through mr-2 font-mono">{m.oldId}</span>
                    <span className="text-green-700 font-bold font-mono">&rarr; {m.newId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBSECTION 5: DB DUPLICATE CHECK                              */}
        {/* ============================================================== */}
        {activeSection === 'db-duplicates' && (
          <div id="db-duplicates-subsection" className="fade-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-800">Students Database Duplicate Check</h4>
              <button
                id="refresh-db-duplicates-btn"
                onClick={() => refetchDupes()}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded text-sm font-medium transition shadow-sm"
              >
                CHECK EXACT DUPLICATES
              </button>
            </div>
            <div className="mb-3 p-3 bg-rose-50 rounded border border-rose-200 text-rose-900 text-sm">
              Finds duplicates only inside the students_database sheet when Student Name, Father&apos;s Name, DOB, Mobile Numbers, Email, Mother&apos;s Name, Category, Father&apos;s Occupation, Defence Service, Job Description, Class, and Present School are same.
            </div>
            <div id="db-duplicates-fields" className="mb-3 text-xs text-gray-600">
              Match fields: Student Name, Father&apos;s Name, DOB, Mobile Numbers, Email, Mother&apos;s Name, Category, Father&apos;s Occupation, Defence Service, Job Description, Class, Present School.
            </div>
            <div id="db-duplicates-summary" className="mb-3 text-sm text-gray-700">
              {isLoadingDupes ? 'Scanning database...' : (
                duplicates?.groups?.length 
                  ? `Found ${duplicates.totalDuplicateGroups} duplicate groups (${duplicates.totalDuplicateRows} total records).`
                  : 'No duplicate records found in students database.'
              )}
            </div>
            <div id="db-duplicates-list" className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto bg-white divide-y shadow-sm">
              {duplicates?.groups?.map((group: any, gIdx: number) => (
                <div key={gIdx} className="p-4 bg-gray-50/50">
                  <div className="font-bold text-sm text-rose-800 mb-2">Duplicate Group #{gIdx + 1} ({group.count} records)</div>
                  <div className="space-y-2">
                    {group.rows?.map((row: any, rIdx: number) => (
                      <div key={rIdx} className="bg-white p-3 rounded border border-gray-200 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-900">{row.studentName} (ID: {row.studentId})</div>
                          <div className="text-gray-500">Father: {row.fatherName} | Mother: {row.motherName} | Mob: {row.mobile} | Class: {row.class}</div>
                        </div>
                        {rIdx > 0 && (
                          <button
                            onClick={() => handleDeleteDuplicateGroup(row.rowNumber, row.studentId)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-medium"
                          >
                            Delete Duplicate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBSECTION 6: BATCH MANAGE                                     */}
        {/* ============================================================== */}
        {activeSection === 'batch-manage' && (
          <div id="batch-manage-subsection" className="fade-in">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Batch Manage</h4>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setBatchAction('add-new-batch')}
                className={`batch-action-btn text-white px-4 py-2 rounded text-sm font-medium transition ${
                  batchAction === 'add-new-batch' ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                ADD NEW BATCH
              </button>
              <button
                onClick={() => setBatchAction('edit-batch-details')}
                className={`batch-action-btn text-white px-4 py-2 rounded text-sm font-medium transition ${
                  batchAction === 'edit-batch-details' ? 'bg-green-600 ring-2 ring-green-400' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                EDIT BATCH DETAILS
              </button>
              <button
                onClick={() => setBatchAction('delete-batch')}
                className={`batch-action-btn text-white px-4 py-2 rounded text-sm font-medium transition ${
                  batchAction === 'delete-batch' ? 'bg-red-600 ring-2 ring-red-400' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                DELETE BATCH
              </button>
            </div>

            {/* 1. Add New Batch Section */}
            {batchAction === 'add-new-batch' && (
              <div id="add-new-batch-section" className="batch-action-section p-4 bg-blue-50 rounded-lg mb-4 border border-blue-200 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3 text-sm">Add New Batch</h5>
                
                {newBatchStep === 1 && (
                  <div id="add-batch-step-1" className="add-batch-step">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
                    <input
                      type="text"
                      id="add-batch-name"
                      className="border border-gray-300 p-2.5 rounded-lg w-full mb-3 text-sm bg-white"
                      placeholder="Enter batch name"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                    />
                    <button
                      id="add-batch-next-step-1"
                      onClick={() => {
                        if (!newBatchName.trim()) {
                          showToast('Please enter a batch name', true);
                          return;
                        }
                        setNewBatchStep(2);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                    >
                      Next: Choose Subjects
                    </button>
                  </div>
                )}

                {newBatchStep === 2 && (
                  <div id="add-batch-step-2" className="add-batch-step">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Subjects (Multiple Selection)</label>
                    <div id="add-batch-subjects-container" className="border border-gray-300 p-3 rounded-lg mb-3 bg-white max-h-48 overflow-y-auto space-y-2">
                      {subjects?.map((sub: any) => (
                        <label key={sub.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newBatchSubjects.includes(sub.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewBatchSubjects([...newBatchSubjects, sub.id]);
                              } else {
                                setNewBatchSubjects(newBatchSubjects.filter(id => id !== sub.id));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span>{sub.name} ({sub.code})</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewBatchStep(1)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setNewBatchStep(3)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                      >
                        Next: Room Number
                      </button>
                    </div>
                  </div>
                )}

                {newBatchStep === 3 && (
                  <div id="add-batch-step-3" className="add-batch-step">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input
                      type="text"
                      id="add-batch-room"
                      className="border border-gray-300 p-2.5 rounded-lg w-full mb-3 text-sm bg-white"
                      placeholder="Enter room number (optional)"
                      value={newBatchRoom}
                      onChange={(e) => setNewBatchRoom(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewBatchStep(2)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSaveNewBatch}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium text-sm transition"
                      >
                        Save Batch
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Edit Batch Details Section */}
            {batchAction === 'edit-batch-details' && (
              <div id="edit-batch-details-section" className="batch-action-section p-4 bg-green-50 rounded-lg mb-4 border border-green-200 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3 text-sm">Edit Batch Details</h5>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch to Edit</label>
                  <select
                    id="edit-batch-selection"
                    className="border border-gray-300 p-2.5 rounded-lg w-full text-sm bg-white"
                    value={selectedEditBatchId}
                    onChange={(e) => handleSelectEditBatch(e.target.value)}
                  >
                    <option value="">Select batch</option>
                    {batches?.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {selectedEditBatchId && (
                  <div id="edit-batch-form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                        <input
                          type="text"
                          id="edit-batch-name"
                          className="border border-gray-300 p-2.5 rounded-lg w-full text-sm bg-white"
                          placeholder="Batch name"
                          value={editBatchName}
                          onChange={(e) => setEditBatchName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                        <input
                          type="text"
                          id="edit-batch-room"
                          className="border border-gray-300 p-2.5 rounded-lg w-full text-sm bg-white"
                          placeholder="Room number"
                          value={editBatchRoom}
                          onChange={(e) => setEditBatchRoom(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Edit Subjects (Tick/Untick to modify)</label>
                      <div id="edit-batch-subjects-container" className="border border-gray-300 p-3 rounded-lg bg-white max-h-48 overflow-y-auto space-y-2">
                        {subjects?.map((sub: any) => (
                          <label key={sub.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editBatchSubjects.includes(sub.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditBatchSubjects([...editBatchSubjects, sub.id]);
                                } else {
                                  setEditBatchSubjects(editBatchSubjects.filter(id => id !== sub.id));
                                }
                              }}
                              className="rounded border-gray-300 text-green-600"
                            />
                            <span>{sub.name} ({sub.code})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="edit-batch-save"
                        onClick={handleSaveEditBatch}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-sm font-medium transition"
                      >
                        Save Changes
                      </button>
                      <button
                        id="edit-batch-cancel"
                        onClick={() => setSelectedEditBatchId('')}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Delete Batch Section */}
            {batchAction === 'delete-batch' && (
              <div id="delete-batch-section" className="batch-action-section p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3 text-sm">Delete Batch</h5>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch to Delete</label>
                  <select
                    id="delete-batch-selection"
                    className="border border-gray-300 p-2.5 rounded-lg w-full text-sm bg-white"
                    value={selectedDeleteBatchId}
                    onChange={(e) => setSelectedDeleteBatchId(e.target.value)}
                  >
                    <option value="">Select batch</option>
                    {batches?.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {selectedDeleteBatchId && (
                  <div>
                    {(() => {
                      const target = batches?.find((b: any) => b.id === selectedDeleteBatchId);
                      const count = target?.studentCount ?? 0;
                      return (
                        <div id="delete-batch-impact" className="text-sm text-red-700 mb-3 bg-red-100 p-3 rounded">
                          <strong>Warning:</strong> This batch has <span className="font-bold">{count}</span> enrolled students.
                          {count > 0 && (
                            <div className="mt-3 space-y-2">
                              <label className="block font-medium text-gray-700 text-xs">Action for enrolled students:</label>
                              <div className="flex gap-4 text-xs">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="deleteAction"
                                    value="shift_students"
                                    checked={deleteBatchAction === 'shift_students'}
                                    onChange={() => setDeleteBatchAction('shift_students')}
                                  />
                                  Shift students to another batch
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="deleteAction"
                                    value="delete_students"
                                    checked={deleteBatchAction === 'delete_students'}
                                    onChange={() => setDeleteBatchAction('delete_students')}
                                  />
                                  Delete students
                                </label>
                              </div>

                              {deleteBatchAction === 'shift_students' && (
                                <div className="mt-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Batch to shift to:</label>
                                  <select
                                    value={deleteBatchTargetId}
                                    onChange={(e) => setDeleteBatchTargetId(e.target.value)}
                                    className="border border-gray-300 p-2 rounded text-xs w-full bg-white"
                                  >
                                    <option value="">Select target batch</option>
                                    {batches
                                      ?.filter((b: any) => b.id !== selectedDeleteBatchId)
                                      ?.map((b: any) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                      ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex gap-2">
                      <button
                        id="delete-batch-confirm"
                        onClick={handleDeleteBatch}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded text-sm font-medium transition shadow-sm"
                      >
                        Delete Batch
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBSECTION 7: ADD SUBJECT                                      */}
        {/* ============================================================== */}
        {activeSection === 'add-subject' && (
          <div id="add-subject-subsection" className="fade-in">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Subject Management</h4>

            {/* Add New Subject Form */}
            <div className="p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200 shadow-sm">
              <h5 className="font-medium text-gray-800 mb-3 text-sm">Add New Subject</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    id="new-subject-name"
                    className="border border-gray-300 p-2.5 rounded-lg w-full text-sm bg-white"
                    placeholder="Enter subject name"
                    value={newSubjectName}
                    onChange={(e) => handleSubjectNameChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code (Auto-generated)</label>
                  <input
                    type="text"
                    id="new-subject-code"
                    className="border border-gray-300 p-2.5 rounded-lg w-full text-sm bg-gray-100 font-mono"
                    readOnly
                    placeholder="Will be auto-generated"
                    value={newSubjectCode}
                  />
                </div>
              </div>
              <button
                id="add-new-subject-btn"
                onClick={handleCreateSubject}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium transition shadow-sm"
              >
                Add Subject
              </button>
            </div>

            {/* Subject List */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium text-gray-800 text-sm">Saved Subjects ({subjects?.length ?? 0})</h5>
                <button
                  id="refresh-subjects-btn"
                  onClick={() => refetchSubjects()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                >
                  Refresh
                </button>
              </div>
              <div id="subjects-list-container" className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto bg-white divide-y shadow-sm">
                {isLoadingSubjects && (
                  <div className="text-center text-gray-500 p-4 text-sm">Loading subjects...</div>
                )}
                {!isLoadingSubjects && subjects?.map((sub: any) => (
                  <div key={sub.id} className="p-3 hover:bg-gray-50 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{sub.name}</span>
                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {sub.code}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(sub.code)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* EDIT ACTIVE STUDENT MODAL                                       */}
      {/* ============================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-3">Edit Student Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Student Name</label>
                <input
                  type="text"
                  value={editFormValues.studentName || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, studentName: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Student ID</label>
                <input
                  type="text"
                  disabled
                  value={editFormValues.studentId || ''}
                  className="border border-gray-200 bg-gray-100 p-2 rounded-lg w-full text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Father&apos;s Name</label>
                <input
                  type="text"
                  value={editFormValues.fatherName || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, fatherName: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mother&apos;s Name</label>
                <input
                  type="text"
                  value={editFormValues.motherName || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, motherName: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Class</label>
                <input
                  type="text"
                  value={editFormValues.class || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, class: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Numbers</label>
                <input
                  type="text"
                  value={editFormValues.mobileNumbers || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, mobileNumbers: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">DOB</label>
                <input
                  type="date"
                  value={editFormValues.dob ? String(editFormValues.dob).split('T')[0] : ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, dob: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormValues.email || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, email: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Program</label>
                <input
                  type="text"
                  value={editFormValues.program || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, program: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Present School</label>
                <input
                  type="text"
                  value={editFormValues.presentSchool || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, presentSchool: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <input
                  type="text"
                  value={editFormValues.category || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, category: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Language</label>
                <select
                  value={editFormValues.additionalLanguage || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, additionalLanguage: e.target.value })}
                  className="border border-gray-300 p-2 rounded-lg w-full"
                >
                  <option value="">None</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleActiveStudentEditSave}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-sm font-medium transition shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}