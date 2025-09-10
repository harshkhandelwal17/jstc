import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axios';

const ResultEntryPage = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get('/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Error fetching students');
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    const studentSubjects = student.semesterInfo?.subjects || [];
    setSubjects(studentSubjects);
    setResults(studentSubjects.map(subject => ({
      subject,
      marks: '',
      status: 'pass'
    })));
  };

  const handleResultChange = (index, field, value) => {
    const updatedResults = [...results];
    updatedResults[index][field] = value;
    
    if (field === 'marks') {
      updatedResults[index].status = parseInt(value) >= 40 ? 'pass' : 'fail';
    }
    
    setResults(updatedResults);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setLoading(true);
    try {
      const failedSubjects = results
        .filter(result => result.status === 'fail')
        .map(result => ({
          subject: result.subject,
          marks: parseInt(result.marks),
          feeAmount: 500
        }));

      const resultData = {
        studentId: selectedStudent._id,
        semester: selectedStudent.currentSemester,
        subjects: results.map(result => ({
          subject: result.subject,
          marks: parseInt(result.marks),
          status: result.status
        })),
        failedSubjects
      };

      await axiosInstance.post('/students/add-result', resultData);
      
      if (failedSubjects.length > 0) {
        await axiosInstance.post(`/students/${selectedStudent._id}/back-subjects`, {
          subjects: failedSubjects
        });
        toast.success(`Result added successfully. ${failedSubjects.length} back subjects added with fees.`);
      } else {
        toast.success('Result added successfully. All subjects passed!');
      }
      
      setSelectedStudent(null);
      setResults([]);
      setSubjects([]);
    } catch (error) {
      toast.error('Error saving result');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Result Entry</h1>
        <p className="text-gray-600 mt-2">Enter exam results for students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Select Student</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by ID, name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredStudents.map(student => (
                <div
                  key={student._id}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-3 border rounded-lg cursor-pointer mb-2 transition-colors ${
                    selectedStudent?._id === student._id
                      ? 'bg-blue-50 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{student.name}</div>
                  <div className="text-sm text-gray-600">
                    ID: {student.studentId} | Semester: {student.currentSemester}
                  </div>
                  <div className="text-sm text-gray-600">
                    Course: {student.course}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Result Entry Form */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  Result Entry - {selectedStudent.name}
                </h2>
                <div className="text-sm text-gray-600">
                  Semester: {selectedStudent.currentSemester}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div className="font-semibold">
                        {result.subject}
                      </div>
                      
                      <div>
                        <input
                          type="number"
                          placeholder="Marks"
                          min="0"
                          max="100"
                          value={result.marks}
                          onChange={(e) => handleResultChange(index, 'marks', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <select
                          value={result.status}
                          onChange={(e) => handleResultChange(index, 'status', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        {result.status === 'fail' && (
                          <span className="text-red-600 text-sm font-medium">
                            Back Fee: ₹500
                          </span>
                        )}
                        {result.status === 'pass' && (
                          <span className="text-green-600 text-sm font-medium">
                            Passed ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading || results.some(r => !r.marks)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'Saving...' : 'Save Results'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setResults([]);
                      setSubjects([]);
                    }}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-600">Passed: </span>
                      {results.filter(r => r.status === 'pass').length} subjects
                    </div>
                    <div>
                      <span className="text-red-600">Failed: </span>
                      {results.filter(r => r.status === 'fail').length} subjects
                    </div>
                    <div>
                      <span className="text-gray-600">Total Back Fee: </span>
                      ₹{results.filter(r => r.status === 'fail').length * 500}
                    </div>
                    <div>
                      <span className="text-gray-600">New Status: </span>
                      {results.filter(r => r.status === 'fail').length === 0 ? 'Promoted' : 'Back Subjects Added'}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <div className="text-6xl text-gray-300 mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Student
                </h3>
                <p className="text-gray-500">
                  Choose a student from the list to enter their exam results
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultEntryPage;