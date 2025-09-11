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
  Plus,
  Minus,
  Camera,
  Upload,
  X
} from 'lucide-react';

const AddStudentPage = () => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    profileImage: '',
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
      courseFee: 0,
      installmentAmount: 0,
      numberOfInstallments: 1,
      semesterFees: []
    },
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jstcapi.onrender.com/api';

  useEffect(() => {
    fetchCourses();
    // Set default joining date to today
    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        joiningDate: new Date().toISOString().split('T')[0]
      }
    }));
  }, []);

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
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCourseChange = (courseValue) => {
    const selectedCourse = courses.find(c => c.name === courseValue);
    
    setFormData(prev => ({
      ...prev,
      academicInfo: {
        ...prev.academicInfo,
        course: courseValue,
        totalSemesters: selectedCourse?.totalSemesters || 2
      },
      feeStructure: {
        ...prev.feeStructure,
        courseFee: selectedCourse?.fee || selectedCourse?.semesters?.reduce((total, sem) => total + (sem.semesterFee || 0), 0) || 0,
        installmentAmount: selectedCourse?.fee || selectedCourse?.semesters?.reduce((total, sem) => total + (sem.semesterFee || 0), 0) || 0,
        semesterFees: selectedCourse?.semesters?.map(sem => ({
          semesterNumber: sem.semesterNumber,
          totalAmount: sem.semesterFee,
          paidAmount: 0,
          remainingAmount: sem.semesterFee,
          subjects: sem.subjects || [],
          backSubjectFees: 0
        })) || []
      }
    }));
    
    // Clear course and fee related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors['academicInfo.course'];
      delete newErrors['feeStructure.courseFee'];
      delete newErrors['feeStructure.installmentAmount'];
      return newErrors;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/students/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      profileImage: ''
    }));
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1: // Personal Information
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
          newErrors.name = 'Name must be at least 2 characters long';
        }
        
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s+/g, ''))) {
          newErrors.phone = 'Invalid phone number format (must be 10 digits starting with 6-9)';
        }
        
        if (formData.email && formData.email.trim() !== '') {
          if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
          }
        }
        
        if (!formData.gender) {
          newErrors.gender = 'Gender selection is required';
        }
        break;

      case 2: // Address & Parent Information
        if (!formData.address.city.trim()) {
          newErrors['address.city'] = 'City is required';
        }
        if (!formData.address.state.trim()) {
          newErrors['address.state'] = 'State is required';
        }
        if (!formData.address.street.trim()) {
          newErrors['address.street'] = 'Street address is required';
        }
        if (formData.address.pincode && formData.address.pincode.trim() !== '') {
          if (!/^\d{6}$/.test(formData.address.pincode)) {
            newErrors['address.pincode'] = 'Pincode must be 6 digits';
          }
        }
        // Parent info is optional but if provided should be valid
        if (formData.parentInfo.fatherPhone && !/^[6-9]\d{9}$/.test(formData.parentInfo.fatherPhone.replace(/\s+/g, ''))) {
          newErrors['parentInfo.fatherPhone'] = 'Invalid father phone number format';
        }
        if (formData.parentInfo.motherPhone && !/^[6-9]\d{9}$/.test(formData.parentInfo.motherPhone.replace(/\s+/g, ''))) {
          newErrors['parentInfo.motherPhone'] = 'Invalid mother phone number format';
        }
        break;

      case 3: // Academic Information
        if (!formData.academicInfo.course || formData.academicInfo.course.trim() === '') {
          newErrors['academicInfo.course'] = 'Course selection is required';
        }
        if (!formData.academicInfo.joiningDate || formData.academicInfo.joiningDate.trim() === '') {
          newErrors['academicInfo.joiningDate'] = 'Joining date is required';
        }
        // Validate that joining date is not in future
        const joiningDate = new Date(formData.academicInfo.joiningDate);
        const today = new Date();
        if (joiningDate > today) {
          newErrors['academicInfo.joiningDate'] = 'Joining date cannot be in the future';
        }
        break;

      case 4: // Fee Structure
        if (!formData.feeStructure.courseFee || formData.feeStructure.courseFee <= 0) {
          newErrors['feeStructure.courseFee'] = 'Course fee is required and must be greater than 0';
        }
        if (!formData.feeStructure.installmentAmount || formData.feeStructure.installmentAmount <= 0) {
          newErrors['feeStructure.installmentAmount'] = 'Installment amount is required and must be greater than 0';
        }
        if (formData.feeStructure.installmentAmount > formData.feeStructure.courseFee) {
          newErrors['feeStructure.installmentAmount'] = 'Installment amount cannot be greater than course fee';
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
    
    // Validate all steps before submission and collect all errors
    let allValid = true;
    let allErrors = {};
    
    for (let i = 1; i <= totalSteps; i++) {
      if (!validateStep(i)) {
        allValid = false;
        // Get the current errors and merge them
        allErrors = { ...allErrors, ...errors };
      }
    }
    
    if (!allValid) {
      // Set all collected errors
      setErrors(allErrors);
      
      // Find which step has the first error and navigate to it
      let firstErrorStep = 1;
      for (let i = 1; i <= totalSteps; i++) {
        if (!validateStep(i)) {
          firstErrorStep = i;
          break;
        }
      }
      setStep(firstErrorStep);
      
      alert('Please complete all required fields and fix any errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      // Upload image first if one is selected
      let profileImageUrl = '';
      if (imageFile) {
        profileImageUrl = await uploadImage();
        if (!profileImageUrl) {
          setLoading(false);
          return; // Image upload failed, don't proceed
        }
      }

      // Include the image URL in the form data
      const studentData = {
        ...formData,
        profileImage: profileImageUrl
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student');
      }

      const data = await response.json();
      alert('Student created successfully!');
      window.location.href = '/students';
    } catch (error) {
      alert(error.message || 'Error creating student');
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
        <p className="text-gray-600">Enter the student's basic details</p>
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
            Gender *
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
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
        </div>

        {/* Profile Image Upload */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo (Optional)
          </label>
          <div className="flex items-center space-x-6">
            {/* Image preview */}
            <div className="flex-shrink-0">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Upload button */}
            <div className="flex-1">
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-image"
                />
                <label
                  htmlFor="profile-image"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG up to 5MB. Recommended size: 400x400px
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddressInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Address & Parent Information</h2>
        <p className="text-gray-600">Enter address and parent/guardian details</p>
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
              Street Address *
            </label>
            <input
              type="text"
              name="address.street"
              required
              value={formData.address.street}
              onChange={handleInputChange}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['address.street'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter street address"
            />
            {errors['address.street'] && <p className="mt-1 text-sm text-red-600">{errors['address.street']}</p>}
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
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['parentInfo.fatherPhone'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter father's phone number"
            />
            {errors['parentInfo.fatherPhone'] && <p className="mt-1 text-sm text-red-600">{errors['parentInfo.fatherPhone']}</p>}
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
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['parentInfo.motherPhone'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter mother's phone number"
            />
            {errors['parentInfo.motherPhone'] && <p className="mt-1 text-sm text-red-600">{errors['parentInfo.motherPhone']}</p>}
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
        <p className="text-gray-600">Select course and academic details</p>
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

      {/* Course Information Display */}
      {formData.academicInfo.course && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Course Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-blue-700">Course:</span>
              <span className="font-medium text-blue-900 ml-2">{formData.academicInfo.course}</span>
            </div>
            <div>
              <span className="text-sm text-blue-700">Duration:</span>
              <span className="font-medium text-blue-900 ml-2">
                {formData.academicInfo.totalSemesters} Semesters
              </span>
            </div>
            <div>
              <span className="text-sm text-blue-700">Course Fee:</span>
              <span className="font-medium text-blue-900 ml-2">₹{formData.feeStructure.courseFee}</span>
            </div>
            <div>
              <span className="text-sm text-blue-700">Back Subject Fee:</span>
              <span className="font-medium text-blue-900 ml-2">₹500 per subject</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeeStructure = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Fee Structure</h2>
        <p className="text-gray-600">Configure payment terms and fee structure</p>
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
              name="feeStructure.courseFee"
              required
              value={formData.feeStructure.courseFee}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors['feeStructure.courseFee'] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter course fee"
              min="0"
            />
          </div>
          {errors['feeStructure.courseFee'] && <p className="mt-1 text-sm text-red-600">{errors['feeStructure.courseFee']}</p>}
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
                  installmentAmount: Math.ceil(prev.feeStructure.courseFee / installments)
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

      {/* Fee Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Fee Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">₹{formData.feeStructure.courseFee}</div>
            <div className="text-sm text-green-700">Total Course Fee</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formData.feeStructure.numberOfInstallments}</div>
            <div className="text-sm text-blue-700">Installments</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-purple-600">₹{formData.feeStructure.installmentAmount}</div>
            <div className="text-sm text-purple-700">Per Installment</div>
          </div>
        </div>
      </div>
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
        return renderFeeStructure();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => window.location.href = '/students'}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Student</h1>
              <p className="mt-2 text-lg text-gray-600">Create a new student profile</p>
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
                  disabled={loading || imageUploading}
                  className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading || imageUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {imageUploading ? 'Uploading Image...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Student
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentPage;