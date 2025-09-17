import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  Edit,
  Trash2
} from 'lucide-react';

const EditStudentPage = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingSemester, setUpdatingSemester] = useState(false);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    parentInfo: {
      fatherName: '',
      motherName: '',
      fatherPhone: '',
      motherPhone: '',
      guardianName: '',
      guardianPhone: ''
    },
    academicInfo: {
      course: '',
      batch: '',
      rollNumber: '',
      joiningDate: '',
      currentSemester: 1,
      totalSemesters: 2
    },
    feeStructure: {
      totalCourseFee: 0,
      courseFee: 0,
      installmentAmount: 0,
      numberOfInstallments: 1
    },
    status: 'Active',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Get student ID from URL params
  const studentId = window.location.pathname.split('/').pop();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jstcapi.onrender.com/api';

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
      fetchCourses();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      const data = await response.json();
      const studentData = data.student;
      setStudent(studentData);
      
      // Populate form with existing data
      setFormData({
        name: studentData.name || '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: studentData.gender || '',
        address: {
          street: studentData.address?.street || '',
          city: studentData.address?.city || '',
          state: studentData.address?.state || '',
          pincode: studentData.address?.pincode || '',
          country: studentData.address?.country || 'India'
        },
        parentInfo: {
          fatherName: studentData.parentInfo?.fatherName || '',
          motherName: studentData.parentInfo?.motherName || '',
          fatherPhone: studentData.parentInfo?.fatherPhone || '',
          motherPhone: studentData.parentInfo?.motherPhone || '',
          guardianName: studentData.parentInfo?.guardianName || '',
          guardianPhone: studentData.parentInfo?.guardianPhone || ''
        },
        academicInfo: {
          course: studentData.academicInfo?.course || '',
          batch: studentData.academicInfo?.batch || '',
          rollNumber: studentData.academicInfo?.rollNumber || '',
          joiningDate: studentData.academicInfo?.joiningDate ? new Date(studentData.academicInfo.joiningDate).toISOString().split('T')[0] : '',
          currentSemester: studentData.academicInfo?.currentSemester || 1,
          totalSemesters: studentData.academicInfo?.totalSemesters || 2
        },
        feeStructure: {
          totalCourseFee: studentData.feeStructure?.totalCourseFee || studentData.feeStructure?.courseFee || 0,
          courseFee: studentData.feeStructure?.totalCourseFee || studentData.feeStructure?.courseFee || 0,
          installmentAmount: studentData.feeStructure?.installmentAmount || 0,
          numberOfInstallments: studentData.feeStructure?.numberOfInstallments || 1
        },
        status: studentData.status || 'Active',
        notes: studentData.notes || ''
      });
    } catch (error) {
      console.error('Error fetching student details:', error);
      alert('Error loading student details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCourseChange = (courseValue) => {
    const selectedCourse = courses.find(c => c.name === courseValue);
    
    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        course: courseValue,
        totalSemesters: courseValue === 'PGDCA' ? 4 : 2
      },
      feeStructure: {
        ...prev.feeStructure,
        totalCourseFee: selectedCourse?.fee || prev.feeStructure.totalCourseFee,
        courseFee: selectedCourse?.fee || prev.feeStructure.courseFee,
        installmentAmount: selectedCourse?.fee || prev.feeStructure.installmentAmount
      }
    }));
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1: // Personal Information
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number format';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        break;

      case 2: // Address & Parent Information
        if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
        if (!formData.address.state.trim()) newErrors['address.state'] = 'State is required';
        if (formData.address.pincode && !/^\d{6}$/.test(formData.address.pincode)) {
          newErrors['address.pincode'] = 'Invalid pincode format';
        }
        break;

      case 3: // Academic Information
        if (!formData.academicInfo.course) newErrors['academicInfo.course'] = 'Course selection is required';
        if (!formData.academicInfo.joiningDate) newErrors['academicInfo.joiningDate'] = 'Joining date is required';
        break;

      case 4: // Fee Structure & Status
        if (!formData.feeStructure.totalCourseFee || formData.feeStructure.totalCourseFee <= 0) {
          newErrors['feeStructure.totalCourseFee'] = 'Course fee is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(step)) {
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare update data - only include fields that should be updated
      // Exclude fee structure details to preserve payment history
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        parentInfo: formData.parentInfo,
        academicInfo: formData.academicInfo,
        status: formData.status,
        notes: formData.notes
      };
      
      // Only include fee structure if the total course fee has actually changed
      const currentTotalFee = student?.feeStructure?.totalCourseFee || 0;
      const newTotalFee = formData.feeStructure?.totalCourseFee || 0;
      
      if (newTotalFee !== currentTotalFee && newTotalFee > 0) {
        updateData.feeStructure = {
          totalCourseFee: newTotalFee,
          courseFee: newTotalFee // For backward compatibility
        };
        console.log(`Fee structure update: ${currentTotalFee} -> ${newTotalFee}`);
      }
      
      console.log('Updating student with data:', updateData);
      console.log('Student ID:', studentId);
      
      const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update student`);
      }

      const data = await response.json();
      console.log('Update response:', data);
      alert('Student updated successfully!');
      window.location.href = `/students/details/${studentId}`;
    } catch (error) {
      console.error('Update error details:', error);
      alert(`Error updating student: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSemesterUpdate = async (newSemester) => {
    if (window.confirm(`Update ${student.name}'s semester to ${newSemester}?`)) {
      setUpdatingSemester(true);
      
      try {
        const token = localStorage.getItem('token');
        const updateData = {
          academicInfo: {
            ...student.academicInfo,
            currentSemester: newSemester
          }
        };

        const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update semester');
        }

        const data = await response.json();
        alert(`Student semester updated to ${newSemester} successfully!`);
        // Refresh the page to show updated data
        window.location.reload();
      } catch (error) {
        alert(error.message || 'Error updating semester');
        console.error('Error:', error);
      } finally {
        setUpdatingSemester(false);
      }
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isCompleted = stepNum < step;
          
          return (
            <React.Fragment key={stepNum}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isActive 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{stepNum}</span>
                )}
              </div>
              {stepNum < totalSteps && (
                <div className={`w-12 h-0.5 ${
                  stepNum < step ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600">Update the student's basic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter student's full name"
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter 10-digit phone number"
            />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <div className="flex space-x-6">
            {['Male', 'Female', 'Other'].map((gender) => (
              <label key={gender} className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{gender}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddressInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Address & Parent Information</h2>
        <p className="text-gray-600">Update address and parent/guardian details</p>
      </div>

      {/* Address Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Address Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="address.city"
              required
              value={formData.address.city}
              onChange={handleInputChange}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['address.city'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter city"
            />
            {errors['address.city'] && <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              name="address.state"
              required
              value={formData.address.state}
              onChange={handleInputChange}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['address.state'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter state"
            />
            {errors['address.state'] && <p className="mt-1 text-sm text-red-600">{errors['address.state']}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pincode
            </label>
            <input
              type="text"
              name="address.pincode"
              value={formData.address.pincode}
              onChange={handleInputChange}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['address.pincode'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter 6-digit pincode"
              maxLength="6"
            />
            {errors['address.pincode'] && <p className="mt-1 text-sm text-red-600">{errors['address.pincode']}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              name="address.country"
              value={formData.address.country}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter country"
            />
          </div>
        </div>
      </div>

      {/* Parent Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-green-600" />
          Parent/Guardian Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Father's Name
            </label>
            <input
              type="text"
              name="parentInfo.fatherName"
              value={formData.parentInfo.fatherName}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter father's name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Father's Phone
            </label>
            <input
              type="tel"
              name="parentInfo.fatherPhone"
              value={formData.parentInfo.fatherPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter father's phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mother's Name
            </label>
            <input
              type="text"
              name="parentInfo.motherName"
              value={formData.parentInfo.motherName}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter mother's name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mother's Phone
            </label>
            <input
              type="tel"
              name="parentInfo.motherPhone"
              value={formData.parentInfo.motherPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter mother's phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guardian's Name
            </label>
            <input
              type="text"
              name="parentInfo.guardianName"
              value={formData.parentInfo.guardianName}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter guardian's name (if applicable)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guardian's Phone
            </label>
            <input
              type="tel"
              name="parentInfo.guardianPhone"
              value={formData.parentInfo.guardianPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter guardian's phone number"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademicInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Academic Information</h2>
        <p className="text-gray-600">Update course and academic details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course *
          </label>
          <select
            name="academicInfo.course"
            required
            value={formData.academicInfo.course}
            onChange={(e) => handleCourseChange(e.target.value)}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors['academicInfo.course'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course._id} value={course.name}>
                {course.name} - {course.fullName} (₹{course.fee})
              </option>
            ))}
          </select>
          {errors['academicInfo.course'] && <p className="mt-1 text-sm text-red-600">{errors['academicInfo.course']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Joining Date *
          </label>
          <input
            type="date"
            name="academicInfo.joiningDate"
            required
            value={formData.academicInfo.joiningDate}
            onChange={handleInputChange}
            className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors['academicInfo.joiningDate'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors['academicInfo.joiningDate'] && <p className="mt-1 text-sm text-red-600">{errors['academicInfo.joiningDate']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch/Session
          </label>
          <input
            type="text"
            name="academicInfo.batch"
            value={formData.academicInfo.batch}
            onChange={handleInputChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 2024-25, Morning Batch"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Roll Number
          </label>
          <input
            type="text"
            name="academicInfo.rollNumber"
            value={formData.academicInfo.rollNumber}
            onChange={handleInputChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter roll number (if any)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Semester
          </label>
          <select
            name="academicInfo.currentSemester"
            value={formData.academicInfo.currentSemester}
            onChange={handleInputChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: formData.academicInfo.totalSemesters }, (_, i) => (
              <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Semesters
          </label>
          <input
            type="number"
            name="academicInfo.totalSemesters"
            value={formData.academicInfo.totalSemesters}
            onChange={handleInputChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
            readOnly
          />
        </div>
      </div>
    </div>
  );

  const renderFeeStructureAndStatus = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fee Structure & Status</h2>
        <p className="text-gray-600">Update payment terms and student status</p>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Fee *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="feeStructure.totalCourseFee"
              required
              value={formData.feeStructure.totalCourseFee}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['feeStructure.totalCourseFee'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter course fee"
              min="0"
            />
          </div>
          {errors['feeStructure.totalCourseFee'] && <p className="mt-1 text-sm text-red-600">{errors['feeStructure.totalCourseFee']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Installments
          </label>
          <select
            name="feeStructure.numberOfInstallments"
            value={formData.feeStructure.numberOfInstallments}
            onChange={(e) => {
              const installments = parseInt(e.target.value);
              setFormData(prev => ({
                ...prev,
                feeStructure: {
                  ...prev.feeStructure,
                  numberOfInstallments: installments,
                  installmentAmount: Math.ceil(prev.feeStructure.totalCourseFee / installments)
                }
              }));
            }}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1 (Full Payment)</option>
            <option value={2}>2 Installments</option>
            <option value={3}>3 Installments</option>
            <option value={4}>4 Installments</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Installment Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="feeStructure.installmentAmount"
              value={formData.feeStructure.installmentAmount}
              onChange={handleInputChange}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
              placeholder="Auto-calculated"
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student Status *
          </label>
          <select
            name="status"
            required
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Completed">Completed</option>
            <option value="Dropped">Dropped</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="4"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter any additional notes about the student..."
          />
        </div>
      </div>

      {/* Current Fee Information Display */}
      {student && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Current Fee Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">₹{student.feeStructure?.totalCourseFee || student.feeStructure?.courseFee || 0}</div>
              <div className="text-sm text-blue-700">Original Course Fee</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">₹{student.feeStructure?.totalPaid || 0}</div>
              <div className="text-sm text-green-700">Amount Paid</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-red-600">₹{student.feeStructure?.remainingAmount || 0}</div>
              <div className="text-sm text-red-700">Remaining Amount</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Payment Progress</span>
              <span>
                {(student.feeStructure?.totalCourseFee || student.feeStructure?.courseFee) > 0 
                  ? Math.round(((student.feeStructure.totalPaid || 0) / (student.feeStructure.totalCourseFee || student.feeStructure.courseFee)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${(student.feeStructure?.totalCourseFee || student.feeStructure?.courseFee) > 0 
                    ? ((student.feeStructure.totalPaid || 0) / (student.feeStructure.totalCourseFee || student.feeStructure.courseFee)) * 100
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderPersonalInfo();
      case 2:
        return renderAddressInfo();
      case 3:
        return renderAcademicInfo();
      case 4:
        return renderFeeStructureAndStatus();
      default:
        return renderPersonalInfo();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="h-6 w-6 bg-gray-200 rounded mr-4"></div>
                <div className="h-8 bg-gray-200 rounded w-64"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-96"></div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Student not found</h3>
            <p className="text-gray-500 mb-6">The student you're trying to edit doesn't exist or has been removed.</p>
            <button 
              onClick={() => window.location.href = '/students'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => window.location.href = `/students/details/${studentId}`}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
              <p className="mt-2 text-lg text-gray-600">Update {student.name}'s information</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Student ID: {student.studentId}</span>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                student.status === 'Active' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {student.status}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Semester Update Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Semester Update</h3>
              <p className="text-sm text-blue-700">
                Current: Semester {student.academicInfo?.currentSemester || 1} of {student.academicInfo?.totalSemesters || 2}
              </p>
            </div>
            <div className="flex space-x-2">
              {Array.from({ length: student.academicInfo?.totalSemesters || 2 }, (_, i) => {
                const sem = i + 1;
                const isCurrent = sem === student.academicInfo?.currentSemester;
                return (
                  <button
                    key={sem}
                    onClick={() => handleQuickSemesterUpdate(sem)}
                    disabled={isCurrent || updatingSemester}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-green-100 text-green-800 border border-green-300 cursor-not-allowed'
                        : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50 disabled:opacity-50'
                    }`}
                  >
                    {updatingSemester ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    ) : (
                      `Sem ${sem}${isCurrent ? ' ✓' : ''}`
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={step === 1}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => window.location.href = `/students/details/${studentId}`}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Next
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Student
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Student Info Summary */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Current Student Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Name:</span>
              <span className="text-blue-900 ml-2">{student.name}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Course:</span>
              <span className="text-blue-900 ml-2">{student.academicInfo?.course}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Phone:</span>
              <span className="text-blue-900 ml-2">{student.phone}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Status:</span>
              <span className="text-blue-900 ml-2">{student.status}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Joining Date:</span>
              <span className="text-blue-900 ml-2">
                {student.academicInfo?.joiningDate 
                  ? new Date(student.academicInfo.joiningDate).toLocaleDateString('en-IN')
                  : 'Not set'
                }
              </span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Fee Status:</span>
              <span className="text-blue-900 ml-2">
                ₹{student.feeStructure?.totalPaid || 0} / ₹{student.feeStructure?.totalCourseFee || student.feeStructure?.courseFee || 0} paid
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStudentPage;