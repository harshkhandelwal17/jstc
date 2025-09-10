import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Save,
  Search,
  User,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  History,
  Calendar,
  DollarSign
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { useStudents } from '../hooks/useStudents';
import axiosInstance from '../utils/axios';

const BackSubjectResultPage = () => {
  const navigate = useNavigate();
  const { 
    fetchStudentsWithBackSubjects, 
    fetchStudentBackSubjects, 
    loading, 
    error 
  } = useStudents();
  
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [backSubjects, setBackSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStudentsWithBackSubjects();
  }, []);

  const loadStudentsWithBackSubjects = async () => {
    try {
      const studentsWithBackSubjects = await fetchStudentsWithBackSubjects();
      setStudents(studentsWithBackSubjects);
    } catch (error) {
      console.error('Error loading students with back subjects:', error);
    }
  };

  const loadStudentBackSubjects = async (studentId) => {
    try {
      const subjects = await fetchStudentBackSubjects(studentId);
      setBackSubjects(subjects.map(subject => ({
        ...subject,
        examResult: '',
        newMarks: ''
      })));
    } catch (error) {
      console.error('Error loading back subjects:', error);
    }
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setBackSubjects([]);
    await loadStudentBackSubjects(student.studentId);
  };

  const handleResultChange = (index, field, value) => {
    const updated = [...backSubjects];
    updated[index][field] = value;

    // Auto-fill marks based on result
    if (field === 'examResult') {
      if (value === 'Pass') {
        updated[index].newMarks = '40';
      } else if (value === 'Fail') {
        updated[index].newMarks = '25';
      }
    }

    setBackSubjects(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    if (!examDate) {
      toast.error('Please select exam date');
      return;
    }

    const resultsToUpdate = backSubjects.filter(subject => subject.examResult);
    if (resultsToUpdate.length === 0) {
      toast.error('Please add results for at least one subject');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.put(`/students/${selectedStudent.studentId}/back-subjects/bulk-update`, {
        examDate,
        results: resultsToUpdate.map(subject => ({
          semester: subject.semester,
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          examResult: subject.examResult,
          newMarks: parseInt(subject.newMarks) || 0,
          status: subject.examResult === 'Pass' ? 'cleared' : 'failed_again',
          isCleared: subject.examResult === 'Pass'
        })),
        remarks
      });

      const clearedCount = resultsToUpdate.filter(s => s.examResult === 'Pass').length;
      const failedCount = resultsToUpdate.filter(s => s.examResult === 'Fail').length;

      toast.success(
        `Results updated! ${clearedCount} subjects cleared, ${failedCount} still pending.`
      );

      // Refresh data
      await loadStudentsWithBackSubjects();
      setSelectedStudent(null);
      setBackSubjects([]);
      setRemarks('');

    } catch (error) {
      toast.error('Error updating results');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/results')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Back Subject Results</h1>
            <p className="mt-1 text-gray-600">Update exam results for back subjects</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Student List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Students with Back Subjects</h2>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <div
                    key={student.studentId}
                    onClick={() => handleStudentSelect(student)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStudent?.studentId === student.studentId
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                        <p className="text-sm text-gray-600">Course: {student.course || student.academicInfo?.course}</p>
                      </div>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                        {student.pendingCount} pending
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No students with back subjects found</p>
                </div>
              )}
            </div>
          </div>

          {/* Results Form */}
          <div className="bg-white rounded-lg shadow p-6">
            {selectedStudent ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">{selectedStudent.name}</h2>
                  <p className="text-gray-600">ID: {selectedStudent.studentId} | Course: {selectedStudent.academicInfo?.course}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Exam Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exam Date *
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Back Subjects */}
                  {backSubjects.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">
                        Back Subjects ({backSubjects.length})
                      </h3>
                      
                      {backSubjects.map((subject, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{subject.subjectName}</h4>
                              <p className="text-sm text-gray-600">
                                Code: {subject.subjectCode} | Semester: {subject.semester}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Result
                              </label>
                              <select
                                value={subject.examResult}
                                onChange={(e) => handleResultChange(index, 'examResult', e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Select</option>
                                <option value="Pass">Pass</option>
                                <option value="Fail">Fail</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Marks
                              </label>
                              <input
                                type="number"
                                value={subject.newMarks}
                                onChange={(e) => handleResultChange(index, 'newMarks', e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                min="0"
                                max="100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Status
                              </label>
                              <div className={`p-2 text-sm rounded font-medium text-center ${
                                subject.examResult === 'Pass' 
                                  ? 'bg-green-100 text-green-800'
                                  : subject.examResult === 'Fail'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {subject.examResult === 'Pass' && 'Cleared ✓'}
                                {subject.examResult === 'Fail' && 'Failed ✗'}
                                {!subject.examResult && 'Pending'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                      <p>No pending back subjects</p>
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks (Optional)
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any notes..."
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null);
                        setBackSubjects([]);
                      }}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    
                                         <button
                       type="submit"
                       disabled={isSubmitting || backSubjects.filter(s => s.examResult).length === 0}
                       className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                     >
                       {isSubmitting ? (
                         'Updating...'
                       ) : (
                         <>
                           <Save className="h-4 w-4 mr-2" />
                           Update Results
                         </>
                       )}
                     </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-12">
                <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Student
                </h3>
                <p className="text-gray-500">
                  Choose a student from the list to update their back subject results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackSubjectResultPage;