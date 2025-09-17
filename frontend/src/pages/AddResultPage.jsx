import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  Save, 
  Search, 
  User, 
  Award,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  Calendar,
  BookOpen,
  FileText,
  GraduationCapIcon,
  Phone
} from 'lucide-react';

const AddResultPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStudentSearch, setShowStudentSearch] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, course, semester

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    course: '',
    semester: '',
    examDate: '',
    subjects: [],
    remarks: ''
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: 100,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCourse && { course: selectedCourse }),
      });
      
      const response = await fetch(`${API_BASE_URL}/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        let filteredStudents = data.students || [];
        
        // Filter by semester if selected
        if (selectedSemester) {
          filteredStudents = filteredStudents.filter(student => 
            student.academicInfo?.currentSemester == selectedSemester
          );
        }
        
        // Sort students
        filteredStudents.sort((a, b) => {
          switch (sortBy) {
            case 'course':
              return (a.academicInfo?.course || '').localeCompare(b.academicInfo?.course || '');
            case 'semester':
              return (a.academicInfo?.currentSemester || 0) - (b.academicInfo?.currentSemester || 0);
            case 'joiningDate':
              return new Date(b.academicInfo?.joiningDate || 0) - new Date(a.academicInfo?.joiningDate || 0);
            default: // name
              return (a.name || '').localeCompare(b.name || '');
          }
        });
        
        setStudents(filteredStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, [API_BASE_URL, searchTerm, selectedCourse, selectedSemester, sortBy]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAllStudents();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCourse, selectedSemester, sortBy, fetchAllStudents]);
  
  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  const loadCourseSubjects = useCallback(() => {
    const course = courses.find(c => c.name === formData.course);
    if (course && formData.semester) {
      let subjects = [];
      
      // Try to load semester-specific subjects first
      if (course.semesters && course.semesters.length > 0) {
        const semester = course.semesters.find(s => s.semesterNumber == formData.semester);
        if (semester && semester.subjects) {
          subjects = semester.subjects.map(subject => ({
            name: subject.name,
            code: subject.code,
            result: '',
            status: 'pending' // pending, pass, fail, absent
          }));
        }
      }
      
      // Fallback to default subjects if no semester-specific subjects
      if (subjects.length === 0) {
        // Create default subjects based on course
        const defaultSubjects = formData.course === 'PGDCA' ? [
          { name: 'Computer Fundamentals', code: 'CF101' },
          { name: 'Programming in C', code: 'PC102' },
          { name: 'Database Management', code: 'DM103' },
          { name: 'Web Technology', code: 'WT104' },
          { name: 'Software Engineering', code: 'SE105' }
        ] : [
          { name: 'Computer Basics', code: 'CB101' },
          { name: 'MS Office', code: 'MSO102' },
          { name: 'Internet & Email', code: 'IE103' },
          { name: 'Tally', code: 'TAL104' }
        ];
        
        subjects = defaultSubjects.map(subject => ({
          name: subject.name,
          code: subject.code,
          result: '',
          status: 'pending'
        }));
      }
      
      setFormData(prev => ({ ...prev, subjects }));
    }
  }, [courses, formData.course, formData.semester]);

  useEffect(() => {
    if (formData.course && formData.semester) {
      loadCourseSubjects();
    }
  }, [formData.course, formData.semester, loadCourseSubjects]);



  const selectStudent = (student) => {
    setFormData(prev => ({
      ...prev,
      studentId: student.studentId,
      studentName: student.name,
      course: student.academicInfo.course,
      semester: student.academicInfo.currentSemester?.toString() || '1'
    }));
    setShowStudentSearch(false);
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index][field] = value;
    
    // Set status based on result selection
    if (field === 'result') {
      updatedSubjects[index].status = value.toLowerCase();
    }
    
    setFormData(prev => ({
      ...prev,
      subjects: updatedSubjects
    }));
    
    // Update preview
    calculatePreview(updatedSubjects);
  };

  const calculatePreview = (subjects = formData.subjects) => {
    if (subjects.length === 0) return;
    
    const backSubjects = subjects.filter(subject => 
      subject.result === 'Fail'
    );
    
    const overallResult = backSubjects.length === 0 ? 'Pass' : 'Fail';
    
    setPreview({
      result: overallResult,
      backSubjects: backSubjects,
      backSubjectCount: backSubjects.length,
      backSubjectFees: backSubjects.length * 500
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentId) newErrors.studentId = 'Please select a student';
    if (!formData.semester) newErrors.semester = 'Please select semester';
    if (!formData.examDate) newErrors.examDate = 'Please select exam date';
    if (formData.subjects.length === 0) newErrors.subjects = 'No subjects found for this course';
    
    // Validate each subject - just check if result is selected
    formData.subjects.forEach((subject, index) => {
      if (!subject.result) {
        newErrors[`subject_${index}`] = `Please select result for ${subject.name}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          semester: parseInt(formData.semester),
          examDate: formData.examDate,
          subjects: formData.subjects.map(subject => ({
            name: subject.name,
            code: subject.code,
            maxMarks: 100, // Default max marks
            obtainedMarks: subject.result === 'Pass' ? 50 : subject.result === 'Fail' ? 25 : 0, // Auto-assign based on result
            result: subject.result
          })),
          remarks: formData.remarks
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish result');
      }

      const data = await response.json();
      
      // Show appropriate success message
      if (data.overallResult === 'Pass') {
        toast.success('🎉 Result Published: Student PASSED all subjects!', {
          autoClose: 5000,
        });
      } else {
        toast.warning(`📚 Result Published: Student FAILED in ${data.backSubjectsCount} subject(s). Additional fee ₹${data.backSubjectFeeAdded} added to fee structure.`, {
          autoClose: 7000,
        });
      }
      
      navigate('/results');
    } catch (error) {
      toast.error(error.message || 'Error publishing result');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/results')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Publish Exam Result</h1>
              <p className="mt-2 text-lg text-gray-600">Enter exam results and calculate grades</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Student Selection */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Student Selection
                  </h3>
                </div>
                
                <div className="p-6">
                  {showStudentSearch ? (
                    <div className="space-y-6">
                      {/* Filters & Search */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <select
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">All Courses</option>
                          {courses.map(course => (
                            <option key={course._id} value={course.name}>{course.name}</option>
                          ))}
                        </select>
                        
                        <select
                          value={selectedSemester}
                          onChange={(e) => setSelectedSemester(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">All Semesters</option>
                          <option value="1">Semester 1</option>
                          <option value="2">Semester 2</option>
                          <option value="3">Semester 3</option>
                          <option value="4">Semester 4</option>
                        </select>
                        
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="name">Sort by Name</option>
                          <option value="course">Sort by Course</option>
                          <option value="semester">Sort by Semester</option>
                          <option value="joiningDate">Sort by Join Date</option>
                        </select>
                      </div>
                      
                      {errors.studentId && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {errors.studentId}
                        </p>
                      )}
                      
                      {/* Student Results Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">
                          Students ({students.length})
                        </h4>
                        <div className="text-sm text-gray-500">
                          Click on a student to add result
                        </div>
                      </div>
                      
                      {/* Students Grid */}
                      {students.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                          {students.map((student) => (
                            <div
                              key={student._id}
                              onClick={() => selectStudent(student)}
                              className="cursor-pointer p-5 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group shadow-sm hover:shadow-md min-h-[140px] w-full"
                            >
                              {/* Student Info - Horizontal Layout for better name visibility */}
                              <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden mr-4">
                                  {student.profileImage ? (
                                    <img 
                                      src={student.profileImage} 
                                      alt={student.name}
                                      className="w-14 h-14 object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className={`w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 ${student.profileImage ? 'hidden' : ''}`}>
                                    <User className="w-7 h-7 text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{student.name}</h4>
                                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                    <span>ID: {student.studentId}</span>
                                    <span>•</span>
                                    <span className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {student.phone}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Course Info and Action */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {student.academicInfo?.course || 'N/A'}
                                  </span>
                                  <span className="text-sm font-medium text-gray-700">
                                    Sem {student.academicInfo?.currentSemester || 1}
                                  </span>
                                </div>
                                <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 group-hover:bg-blue-700 transition-colors">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Result
                                </button>
                              </div>
                              
                              {student.academicInfo?.joiningDate && (
                                <div className="mt-3 text-xs text-gray-500">
                                  Joined: {new Date(student.academicInfo.joiningDate).toLocaleDateString('en-IN')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No students found</p>
                          <p className="text-sm">Try adjusting your filters</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden mr-4">
                          {(() => {
                            const selectedStudent = students.find(s => s.studentId === formData.studentId);
                            return selectedStudent?.profileImage ? (
                              <img 
                                src={selectedStudent.profileImage} 
                                alt={formData.studentName}
                                className="w-12 h-12 object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null;
                          })()}
                          <div className={`w-12 h-12 bg-green-100 rounded-full flex items-center justify-center ${(() => {
                            const selectedStudent = students.find(s => s.studentId === formData.studentId);
                            return selectedStudent?.profileImage ? 'hidden' : '';
                          })()}`}>
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-gray-900 leading-tight">{formData.studentName}</h4>
                          <p className="text-lg text-gray-700 mt-2">ID: {formData.studentId} • Course: {formData.course}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowStudentSearch(true);
                            setFormData(prev => ({ ...prev, studentId: '', studentName: '', course: '', semester: '', subjects: [] }));
                            setPreview(null);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-white px-3 py-1 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          Change Student
                        </button>
                        <button
                          type="button"
                          onClick={() => window.location.href = '/results'}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium bg-white px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          View Results
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Details */}
              {!showStudentSearch && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Exam Details
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Semester *
                        </label>
                        <select
                          name="semester"
                          required
                          value={formData.semester}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.semester ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Semester</option>
                          <option value="1">Semester 1</option>
                          <option value="2">Semester 2</option>
                          {formData.course === 'PGDCA' && (
                            <>
                              <option value="3">Semester 3</option>
                              <option value="4">Semester 4</option>
                            </>
                          )}
                        </select>
                        {errors.semester && (
                          <p className="mt-1 text-sm text-red-600">{errors.semester}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exam Date *
                        </label>
                        <input
                          type="date"
                          name="examDate"
                          required
                          value={formData.examDate}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.examDate ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.examDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.examDate}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remarks (Optional)
                      </label>
                      <textarea
                        name="remarks"
                        rows="3"
                        value={formData.remarks}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter any additional remarks..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Subjects & Marks */}
              {formData.subjects.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-green-50 border-b border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Subject Marks ({formData.subjects.length} subjects)
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSubjects = formData.subjects.map(subject => ({
                            ...subject,
                            result: 'Pass',
                            status: 'pass'
                          }));
                          setFormData(prev => ({ ...prev, subjects: updatedSubjects }));
                          calculatePreview(updatedSubjects);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pass All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSubjects = formData.subjects.map(subject => ({
                            ...subject,
                            result: 'Fail',
                            status: 'fail'
                          }));
                          setFormData(prev => ({ ...prev, subjects: updatedSubjects }));
                          calculatePreview(updatedSubjects);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Fail All
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.subjects.map((subject, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{subject.name}</h4>
                              <p className="text-xs text-gray-500">{subject.code}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleSubjectChange(index, 'result', 'Pass')}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                  subject.result === 'Pass' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Pass
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSubjectChange(index, 'result', 'Fail')}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                  subject.result === 'Fail' 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Fail
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSubjectChange(index, 'result', 'Absent')}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                  subject.result === 'Absent' 
                                    ? 'bg-gray-500 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </div>
                          
                          
                          {errors[`subject_${index}`] && (
                            <p className="mt-2 text-xs text-red-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {errors[`subject_${index}`]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button or Guidance */}
              {!showStudentSearch && (
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/results')}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {formData.subjects.length > 0 ? (
                    <button
                      type="submit"
                      disabled={loading || !formData.studentId || !formData.semester || !formData.examDate}
                      className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Publish Result
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {!formData.course ? 'Select a student to continue' : 'Loading subjects...'}
                    </div>
                  )}
                </div>
              )}

              {/* Progress Indicator */}
              {!showStudentSearch && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Progress Checklist:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CheckCircle className={`h-4 w-4 mr-2 ${formData.studentId ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={formData.studentId ? 'text-green-700' : 'text-gray-600'}>
                        Student Selected {formData.studentId && `(${formData.studentName})`}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className={`h-4 w-4 mr-2 ${formData.semester ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={formData.semester ? 'text-green-700' : 'text-gray-600'}>
                        Semester Selected {formData.semester && `(Semester ${formData.semester})`}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className={`h-4 w-4 mr-2 ${formData.examDate ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={formData.examDate ? 'text-green-700' : 'text-gray-600'}>
                        Exam Date Selected {formData.examDate && `(${formData.examDate})`}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className={`h-4 w-4 mr-2 ${formData.subjects.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={formData.subjects.length > 0 ? 'text-green-700' : 'text-gray-600'}>
                        Subjects Loaded {formData.subjects.length > 0 && `(${formData.subjects.length} subjects)`}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className={`h-4 w-4 mr-2 ${formData.subjects.some(s => s.result) ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={formData.subjects.some(s => s.result) ? 'text-green-700' : 'text-gray-600'}>
                        Results Selected {formData.subjects.filter(s => s.result).length > 0 && `(${formData.subjects.filter(s => s.result).length}/${formData.subjects.length} subjects)`}
                      </span>
                    </div>
                  </div>
                  
                  {formData.subjects.length > 0 && !formData.subjects.every(s => s.result) && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Please select result status for all subjects to publish the result.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Preview & Summary */}
          <div className="space-y-6">
            
            {/* Course Info */}
            {formData.course && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200">
                  <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
                    <GraduationCapIcon className="h-5 w-5 mr-2" />
                    Course Information
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {formData.course}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formData.course === 'PGDCA' 
                          ? 'Post Graduate Diploma in Computer Application' 
                          : 'Diploma in Computer Application'
                        }
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                      </div>
                    </div>
                    
                    {formData.semester && (
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <div className="font-medium text-indigo-900">Semester {formData.semester}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Result Preview */}
            {preview && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Result Preview
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-5xl font-bold mb-4 ${
                        preview.result === 'Pass' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {preview.result}
                      </div>
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium ${
                        preview.result === 'Pass' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {preview.result === 'Pass' ? (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 mr-2" />
                        )}
                        {preview.result === 'Pass' ? 'Student Passed' : 'Student Failed'}
                      </div>
                    </div>
                    
                    {preview.result === 'Fail' && preview.backSubjectCount > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-red-800">Failed Subjects:</span>
                          <span className="font-bold text-red-600">{preview.backSubjectCount}</span>
                        </div>
                        <div className="space-y-1 mb-3">
                          {preview.backSubjects.slice(0, 3).map((subject, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-red-700">{subject.name}</span>
                              <span className="text-red-600">{subject.code}</span>
                            </div>
                          ))}
                          {preview.backSubjects.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{preview.backSubjects.length - 3} more subjects
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-red-200">
                          <span className="text-sm font-medium text-red-800">Additional Fee:</span>
                          <span className="font-bold text-red-600">₹{preview.backSubjectFees}</span>
                        </div>
                        <div className="mt-2 text-xs text-red-600">
                          ₹500 per back subject will be automatically added to student's fee structure
                        </div>
                      </div>
                    )}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 text-center">
                        This result will be automatically saved to student's record
                      </div>
                    </div>
                  </div>
                </div>
              // </div>
            )}

            {/* Quick Stats */}
            {formData.subjects.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Subject Summary
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{formData.subjects.length}</div>
                      <div className="text-xs text-blue-700">Total Subjects</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {formData.subjects.filter(s => s.result === 'Pass').length}
                      </div>
                      <div className="text-xs text-green-700">Passed</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">
                        {formData.subjects.filter(s => s.result === 'Fail').length}
                      </div>
                      <div className="text-xs text-red-700">Failed</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddResultPage;