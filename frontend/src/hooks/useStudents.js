import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { toast } from 'react-toastify';

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axiosInstance.get(`/students?${params.toString()}`);
      setStudents(response.data.students || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch students';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentById = useCallback(async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/students/${studentId}`);
      return response.data.student;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch student';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addStudent = useCallback(async (studentData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.post('/students', studentData);
      const newStudent = response.data.student;
      
      setStudents(prev => [...prev, newStudent]);
      toast.success('Student added successfully!');
      return newStudent;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add student';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStudent = useCallback(async (studentId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.put(`/students/${studentId}`, updateData);
      const updatedStudent = response.data.student;
      
      setStudents(prev => 
        prev.map(student => 
          student.studentId === studentId ? updatedStudent : student
        )
      );
      toast.success('Student updated successfully!');
      return updatedStudent;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update student';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteStudent = useCallback(async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      await axiosInstance.delete(`/students/${studentId}`);
      
      setStudents(prev => prev.filter(student => student.studentId !== studentId));
      toast.success('Student deleted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete student';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentsWithBackSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get('/students/with-back-subjects');
      return response.data.students || [];
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch students with back subjects';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentBackSubjects = useCallback(async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/students/${studentId}/back-subjects/pending`);
      return response.data.pendingBackSubjects || [];
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch back subjects';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const payBackSubjectFee = useCallback(async (studentId, paymentData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.post(`/students/${studentId}/back-subjects/pay-fee`, paymentData);
      toast.success('Back subject fee paid successfully!');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to pay back subject fee';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearBackSubject = useCallback(async (studentId, subjectData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.put(`/students/${studentId}/back-subjects/clear`, subjectData);
      toast.success('Back subject cleared successfully!');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to clear back subject';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    students,
    loading,
    error,
    fetchStudents,
    fetchStudentById,
    addStudent,
    updateStudent,
    deleteStudent,
    fetchStudentsWithBackSubjects,
    fetchStudentBackSubjects,
    payBackSubjectFee,
    clearBackSubject
  };
};


