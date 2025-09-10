// server.js - Enhanced Coaching Institute Management System
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const validator = require('validator');
const morgan = require('morgan');
const compression = require('compression'); 
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { body, validationResult, param, query } = require('express-validator');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
});

const app = express();

// ================== SECURITY & MIDDLEWARE ==================

app.use(compression());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Enhanced CORS configuration - Comprehensive fix
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173', 
            'http://localhost:3000', 
            'http://localhost:5174',
            'https://jstc.vercel.app',
            'https://jstcapi.vercel.app',
            'https://www.jstc.vercel.app',
        ];
        
        // Allow all Vercel domains for testing
        if (origin && origin.includes('vercel.app')) {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Log the blocked origin for debugging
        console.log('CORS blocked origin:', origin);
        console.log('Allowed origins:', allowedOrigins);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Additional CORS headers for preflight requests
app.options('*', cors());

// Manual CORS headers as backup
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});



app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({
                success: false,
                message: 'Invalid JSON format'
            });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================== DATABASE CONNECTION ==================

const connectDB = async () => {
    try {
        const mongoOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        };

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coaching_institute', mongoOptions);
        // MongoDB Connected Successfully
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

connectDB().then(() => {
    // Create default admin after database connection
    createDefaultAdmin();
});

// ================== ENHANCED SCHEMAS ==================

// Admin Schema
const adminSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true, 
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email format'],
        index: true
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: { 
        type: String, 
        enum: {
            values: ['super_admin', 'admin', 'staff', 'teacher'],
            message: 'Invalid role specified'
        },
        default: 'admin' 
    },
    instituteName: { 
        type: String, 
        required: [true, 'Institute name is required'],
        trim: true,
        minlength: [2, 'Institute name must be at least 2 characters'],
        maxlength: [100, 'Institute name cannot exceed 100 characters']
    },
    instituteId: { 
        type: String, 
        required: [true, 'Institute ID is required'],
        unique: true,
        index: true
    },
    phone: { 
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^[6-9]\d{9}$/.test(v);
            },
            message: 'Invalid phone number format'
        }
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { 
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^\d{6}$/.test(v);
                },
                message: 'Invalid pincode format'
            }
        },
        country: { type: String, default: 'India', trim: true }
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Pre-save middleware for password hashing
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Course Schema
const courseSchema = new mongoose.Schema({
    instituteId: { 
        type: String, 
        required: [true, 'Institute ID is required'],
        index: true
    },
    name: { 
        type: String, 
        required: [true, 'Course name is required'],
        trim: true,
        uppercase: true,
        index: true,
        validate: {
            validator: function(value) {
                // Allow any alphanumeric course name but keep validation
                return /^[A-Z0-9\s]+$/.test(value) && value.length >= 2 && value.length <= 10;
            },
            message: 'Course name must be 2-10 characters, alphanumeric only'
        }
    },
    fullName: { 
        type: String, 
        required: [true, 'Course full name is required'],
        trim: true
    },
    duration: { 
        type: String, 
        required: [true, 'Course duration is required']
    },
    // Legacy fee field - calculated automatically from semesters
    fee: { 
        type: Number, 
        min: [0, 'Fee cannot be negative'],
        default: function() {
            if (this.semesters && this.semesters.length > 0) {
                return this.semesters.reduce((total, sem) => total + (sem.semesterFee || 0), 0);
            }
            return 0;
        }
    },
    semesters: [{
        semesterNumber: { type: Number, required: true },
        semesterFee: { type: Number, required: true, min: 0 },
        subjects: [{
            name: { type: String, required: true, trim: true },
            code: { type: String, required: true, trim: true, uppercase: true },
            credits: { type: Number, default: 1, min: 1 },
            maxMarks: { type: Number, default: 100, min: 1 },
            passingMarks: { type: Number, default: 40, min: 1 },
            isCore: { type: Boolean, default: true },
            isElective: { type: Boolean, default: false }
        }]
    }],
    // Legacy field for backward compatibility
    subjects: [{
        name: { type: String, trim: true },
        code: { type: String, trim: true },
        credits: { type: Number, default: 1 },
        isCore: { type: Boolean, default: true }
    }],
    backSubjectFee: { 
        type: Number, 
        default: 500,
        min: [0, 'Back subject fee cannot be negative']
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Enhanced Student Schema
const studentSchema = new mongoose.Schema({
    studentId: { 
        type: String, 
        required: [true, 'Student ID is required'],
        trim: true,
        index: true
    },
    instituteId: { 
        type: String, 
        required: [true, 'Institute ID is required'],
        index: true
    },
    name: { 
        type: String, 
        required: [true, 'Student name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: { 
        type: String,
        validate: {
            validator: function(v) {
                return !v || validator.isEmail(v);
            },
            message: 'Invalid email format'
        },
        lowercase: true,
        trim: true
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                return /^[6-9]\d{9}$/.test(v);
            },
            message: 'Invalid phone number format'
        },
        index: true
    },
    dateOfBirth: { 
        type: Date,
        validate: {
            validator: function(v) {
                return !v || v < new Date();
            },
            message: 'Date of birth cannot be in the future'
        }
    },
    gender: { 
        type: String, 
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: 'Invalid gender specified'
        }
    },
    profileImage: {
        type: String, // Cloudinary URL
        default: null,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: 'Invalid image URL format'
        }
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^\d{6}$/.test(v);
                },
                message: 'Invalid pincode format'
            }
        },
        country: { type: String, default: 'India', trim: true }
    },
    parentInfo: {
        fatherName: { type: String, trim: true },
        motherName: { type: String, trim: true },
        fatherPhone: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^[6-9]\d{9}$/.test(v);
                },
                message: 'Invalid father phone number format'
            }
        },
        motherPhone: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^[6-9]\d{9}$/.test(v);
                },
                message: 'Invalid mother phone number format'
            }
        },
        guardianName: { type: String, trim: true },
        guardianPhone: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^[6-9]\d{9}$/.test(v);
                },
                message: 'Invalid guardian phone number format'
            }
        }
    },
    academicInfo: {
        course: { 
            type: String, 
            required: [true, 'Course is required'],
            enum: ['PGDCA', 'DCA'],
            index: true
        },
        batch: { type: String, trim: true },
        rollNumber: { type: String, trim: true },
        joiningDate: { type: Date, default: Date.now },
        expectedCompletionDate: Date,
        currentSemester: { type: Number, default: 1, min: 1 },
        totalSemesters: { type: Number, default: 2 }
    },
    feeStructure: {
        totalCourseFee: { 
            type: Number, 
            required: [true, 'Total course fee is required'],
            min: [0, 'Course fee cannot be negative']
        },
        semesterFees: [{
            semester: { type: Number, required: true },
            semesterFee: { type: Number, required: true, min: 0 },
            paidAmount: { type: Number, default: 0, min: 0 },
            remainingAmount: { type: Number, default: 0, min: 0 },
            pendingBackSubjects: [{
                subjectCode: { type: String, required: true },
                subjectName: { type: String, required: true },
                feeAmount: { type: Number, default: 500 },
                feePaid: { type: Boolean, default: false },
                paymentDate: Date,
                examFeePaid: { type: Boolean, default: false },
                examFeePaymentDate: Date,
                isCleared: { type: Boolean, default: false },
                clearedDate: Date,
                nextExamDate: Date,
                attempts: { type: Number, default: 0 }
            }],
            backSubjectFees: { type: Number, default: 0, min: 0 },
            backSubjectExamFeesPaid: { type: Number, default: 0, min: 0 },
            status: { 
                type: String, 
                enum: ['Not_Due', 'Due', 'Partial', 'Paid', 'Overdue', 'Back_Pending'],
                default: 'Not_Due'
            },
            dueDate: Date,
            lastPaymentDate: Date,
            subjects: [{
                subjectCode: { type: String, required: true },
                subjectName: { type: String, required: true },
                maxMarks: { type: Number, default: 100 },
                passingMarks: { type: Number, default: 40 }
            }]
        }],
        // Legacy fields for backward compatibility
        courseFee: { type: Number, default: 0 },
        totalPaid: { type: Number, default: 0, min: 0 },
        remainingAmount: { type: Number, default: 0, min: 0 },
        backSubjectFees: { type: Number, default: 0, min: 0 },
        backSubjectExamFeesPaid: { type: Number, default: 0, min: 0 }
    },
    results: [{
        semester: { type: Number, required: true },
        examDate: Date,
        resultDate: Date,
        totalMarks: { type: Number, min: 0 },
        obtainedMarks: { type: Number, min: 0 },
        percentage: { type: Number, min: 0, max: 100 },
        grade: { type: String, trim: true },
        result: { 
            type: String, 
            enum: ['Pass', 'Fail', 'Pending'],
            default: 'Pending'
        },
        subjects: [{
            name: { type: String, required: true },
            code: { type: String, required: true },
            maxMarks: { type: Number, required: true },
            obtainedMarks: { type: Number, required: true },
            result: { 
                type: String, 
                enum: ['Pass', 'Fail', 'Absent'],
                required: true
            },
            isBack: { type: Boolean, default: false }
        }],
        backSubjects: [{
            name: { type: String, required: true },
            code: { type: String, required: true, uppercase: true },
            feeAmount: { type: Number, default: 500 },
            feePaid: { type: Boolean, default: false },
            feePaymentDate: Date,
            feePaymentReceiptNo: String,
            examFeePaid: { type: Boolean, default: false },
            examFeePaymentDate: Date,
            examFeeReceiptNo: String,
            isCleared: { type: Boolean, default: false },
            clearedDate: Date,
            examDate: Date,
            marks: { type: Number, min: 0 },
            maxMarks: { type: Number, default: 100 },
            passingMarks: { type: Number, default: 40 },
            attempts: { type: Number, default: 1, min: 1 },
            remarks: String,
            status: {
                type: String,
                enum: ['Fee_Pending', 'Fee_Paid', 'Exam_Scheduled', 'Appeared', 'Cleared', 'Failed'],
                default: 'Fee_Pending'
            }
        }],
        remarks: { type: String, trim: true }
    }],
    status: { 
        type: String, 
        enum: {
            values: ['Active', 'Inactive', 'Completed', 'Dropped', 'Suspended'],
            message: 'Invalid status'
        },
        default: 'Active',
        index: true
    },
    profilePhoto: { 
        type: String,
        validate: {
            validator: function(v) {
                return !v || validator.isURL(v);
            },
            message: 'Invalid profile photo URL'
        }
    },
    documents: [{
        name: { type: String, required: true, trim: true },
        type: { 
            type: String, 
            enum: ['ID_PROOF', 'ADDRESS_PROOF', 'PHOTO', 'ACADEMIC_RECORD', 'OTHER'],
            required: true
        },
        url: { 
            type: String, 
            required: true,
            validate: {
                validator: function(v) {
                    return validator.isURL(v);
                },
                message: 'Invalid document URL'
            }
        },
        uploadedAt: { type: Date, default: Date.now }
    }],
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for better performance
studentSchema.index({ studentId: 1, instituteId: 1 }, { unique: true });
studentSchema.index({ instituteId: 1, status: 1 });
studentSchema.index({ instituteId: 1, 'academicInfo.course': 1 });
studentSchema.index({ instituteId: 1, name: 'text', phone: 'text' });

// Virtual for total back subjects
studentSchema.virtual('totalBackSubjects').get(function() {
    let totalBacks = 0;
    if (this.results && Array.isArray(this.results)) {
        this.results.forEach(result => {
            if (result && result.backSubjects && Array.isArray(result.backSubjects)) {
                totalBacks += result.backSubjects.filter(back => !back.isCleared).length;
            }
        });
    }
    return totalBacks;
});

// Fee Payment Schema
const feePaymentSchema = new mongoose.Schema({
    receiptNo: { 
        type: String, 
        required: [true, 'Receipt number is required'],
        trim: true,
        unique: true,
        index: true
    },
    instituteId: { 
        type: String, 
        required: [true, 'Institute ID is required'],
        index: true
    },
    studentId: { 
        type: String, 
        required: [true, 'Student ID is required'],
        index: true
    },
    studentName: { 
        type: String, 
        required: [true, 'Student name is required'],
        trim: true
    },
    course: {
        type: String,
        required: [true, 'Course is required'],
        enum: ['PGDCA', 'DCA']
    },
    paymentDate: { type: Date, default: Date.now },
    feeType: { 
        type: String, 
        enum: {
            values: ['Course_Fee', 'Installment', 'Back_Subject', 'Late_Fee', 'Other'],
            message: 'Invalid fee type'
        },
        required: [true, 'Fee type is required']
    },
    amount: { 
        type: Number, 
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    discount: { 
        type: Number, 
        default: 0, 
        min: [0, 'Discount cannot be negative']
    },
    finalAmount: { 
        type: Number, 
        required: [true, 'Final amount is required'],
        min: [0, 'Final amount cannot be negative']
    },
    paymentMode: { 
        type: String, 
        enum: {
            values: ['Cash', 'Online', 'Cheque', 'UPI', 'Card', 'NEFT', 'RTGS', 'DD'],
            message: 'Invalid payment mode'
        },
        default: 'Cash' 
    },
    transactionDetails: {
        transactionId: { type: String, trim: true },
        chequeNo: { type: String, trim: true },
        bankName: { type: String, trim: true },
        upiId: { type: String, trim: true }
    },
    installmentNumber: { type: Number },
    semesterInfo: {
        semester: { type: Number, required: true },
        course: { type: String, required: true },
        totalSemesters: { type: Number, required: true }
    },
    backSubjectPayment: {
        semester: Number,
        subjectCode: String,
        subjectName: String,
        feeAmount: Number,
        paymentType: {
            type: String,
            enum: ['Back_Subject_Fee', 'Exam_Fee', 'Re_Exam_Fee'],
            default: 'Back_Subject_Fee'
        },
        attemptNumber: { type: Number, default: 1 }
    },
    backSubjects: [{ 
        name: String, 
        code: String,
        fee: { type: Number, default: 500 }
    }],
    remarks: { type: String, trim: true },
    status: { 
        type: String, 
        enum: {
            values: ['Paid', 'Pending', 'Failed', 'Refunded'],
            message: 'Invalid payment status'
        },
        default: 'Paid',
        index: true
    },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Result Schema
const resultSchema = new mongoose.Schema({
    instituteId: { 
        type: String, 
        required: [true, 'Institute ID is required'],
        index: true
    },
    studentId: { 
        type: String, 
        required: [true, 'Student ID is required'],
        index: true
    },
    studentName: { 
        type: String, 
        required: [true, 'Student name is required'],
        trim: true
    },
    course: {
        type: String,
        required: [true, 'Course is required'],
        enum: ['PGDCA', 'DCA']
    },
    semester: { 
        type: Number, 
        required: [true, 'Semester is required'],
        min: 1
    },
    examDate: { type: Date, required: true },
    resultDate: { type: Date, default: Date.now },
    subjects: [{
        name: { type: String, required: true },
        code: { type: String, required: true },
        maxMarks: { type: Number, required: true },
        obtainedMarks: { type: Number, required: true },
        result: { 
            type: String, 
            enum: ['Pass', 'Fail', 'Absent'],
            required: true
        }
    }],
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true },
    percentage: { type: Number, min: 0, max: 100 },
    grade: { type: String, trim: true },
    result: { 
        type: String, 
        enum: ['Pass', 'Fail', 'Pending'],
        required: true
    },
    backSubjects: [{
        name: { type: String, required: true },
        code: { type: String, required: true },
        feeAmount: { type: Number, default: 500 },
        feePaid: { type: Boolean, default: false },
        feePaymentDate: { type: Date },
        feePaymentReceiptNo: { type: String },
        examFeePaid: { type: Boolean, default: false },
        examFeePaymentDate: { type: Date },
        examFeeReceiptNo: { type: String },
        isCleared: { type: Boolean, default: false },
        clearedDate: { type: Date },
        status: { 
            type: String, 
            enum: ['Fee_Pending', 'Fee_Paid', 'Exam_Pending', 'Cleared', 'Failed'],
            default: 'Fee_Pending'
        },
        attempts: { type: Number, default: 0 },
        feeAdded: { type: Boolean, default: true },
        nextExamDate: { type: Date }
    }],
    backSubjectsCount: { type: Number, default: 0 },
    remarks: { type: String, trim: true },
    publishedBy: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
    // Result delivery tracking
    isDelivered: { type: Boolean, default: false },
    deliveryDate: { type: Date },
    deliveredBy: { type: String },
    deliveryRemarks: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Compound indexes
resultSchema.index({ studentId: 1, semester: 1, instituteId: 1 }, { unique: true });
resultSchema.index({ instituteId: 1, course: 1, semester: 1 });

// Models
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);
const Student = mongoose.model('Student', studentSchema);
const FeePayment = mongoose.model('FeePayment', feePaymentSchema);
const Result = mongoose.model('Result', resultSchema);

// Back Subject History Schema
const backSubjectHistorySchema = new mongoose.Schema({
    studentId: { type: String, required: true, index: true },
    semester: { type: Number, required: true },
    subjectCode: { type: String, required: true },
    subjectName: { type: String, required: true },
    action: { 
        type: String, 
        required: true,
        enum: ['added', 'failed', 'cleared', 'failed_again', 'fee_paid'] 
    },
    examDate: { type: Date },
    marks: { type: Number },
    status: { 
        type: String,
        enum: ['pending', 'cleared', 'failed_again']
    },
    remarks: { type: String },
    dateRecorded: { type: Date, default: Date.now },
    instituteId: { type: String, required: true, index: true }
});

const BackSubjectHistory = mongoose.model('BackSubjectHistory', backSubjectHistorySchema);

// ========== UNIFIED BACK SUBJECT MANAGEMENT SYSTEM ==========
class BackSubjectManager {
    static async syncBackSubjects(studentId, instituteId) {
        try {
            const student = await Student.findOne({ studentId, instituteId });
            const results = await Result.find({ studentId, instituteId }).sort({ semester: 1 });
            
            if (!student || !results.length) return;

            let hasChanges = false;
            
            for (const result of results) {
                if (!result.backSubjects || result.backSubjects.length === 0) continue;
                
                const semesterIndex = result.semester - 1;
                
                if (!student.feeStructure?.semesterFees?.[semesterIndex]) {
                    continue;
                }

                const currentPendingBackSubjects = student.feeStructure.semesterFees[semesterIndex].pendingBackSubjects || [];
                const resultBackSubjects = result.backSubjects;

                for (const resultBack of resultBackSubjects) {
                    const existingPending = currentPendingBackSubjects.find(p => p.subjectCode === resultBack.code);
                    
                    if (!existingPending) {
                        currentPendingBackSubjects.push({
                            subjectCode: resultBack.code,
                            subjectName: resultBack.name,
                            feeAmount: resultBack.feeAmount || 500,
                            feePaid: resultBack.feePaid || false,
                            paymentDate: resultBack.feePaymentDate,
                            feePaymentReceiptNo: resultBack.feePaymentReceiptNo,
                            examFeePaid: resultBack.examFeePaid || false,
                            examFeePaymentDate: resultBack.examFeePaymentDate,
                            isCleared: resultBack.isCleared || false,
                            clearedDate: resultBack.clearedDate,
                            nextExamDate: resultBack.nextExamDate,
                            attempts: resultBack.attempts || 0,
                            status: resultBack.status || 'Fee_Pending'
                        });
                        hasChanges = true;
                    } else {
                        let needsUpdate = false;
                        
                        if (existingPending.feePaid !== resultBack.feePaid) {
                            existingPending.feePaid = resultBack.feePaid;
                            needsUpdate = true;
                        }
                        if (existingPending.isCleared !== resultBack.isCleared) {
                            existingPending.isCleared = resultBack.isCleared;
                            needsUpdate = true;
                        }
                        if (existingPending.status !== resultBack.status) {
                            existingPending.status = resultBack.status;
                            needsUpdate = true;
                        }
                        
                        if (needsUpdate) hasChanges = true;
                    }
                }

                if (hasChanges) {
                    student.feeStructure.semesterFees[semesterIndex].pendingBackSubjects = currentPendingBackSubjects;
                }
            }

            if (hasChanges) {
                await Student.findOneAndUpdate(
                    { studentId, instituteId },
                    { feeStructure: student.feeStructure }
                );
                console.log(`Back subjects synced for student ${studentId}`);
            }
        } catch (error) {
            console.error('Error syncing back subjects:', error);
        }
    }

    static async updateBackSubjectFeePayment(studentId, instituteId, semester, subjectCode, paymentData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const semesterInt = parseInt(semester);
            const semesterIndex = semesterInt - 1;
            
            await Student.findOneAndUpdate(
                { studentId, instituteId },
                {
                    $set: {
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$[elem].feePaid`]: true,
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$[elem].paymentDate`]: paymentData.paymentDate,
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$[elem].feePaymentReceiptNo`]: paymentData.receiptNo,
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$[elem].status`]: 'Fee_Paid'
                    },
                    $inc: {
                        'feeStructure.backSubjectExamFeesPaid': paymentData.amount,
                        [`feeStructure.semesterFees.${semesterIndex}.backSubjectExamFeesPaid`]: paymentData.amount
                    }
                },
                { 
                    arrayFilters: [{ 'elem.subjectCode': subjectCode }],
                    session
                }
            );

            await Result.findOneAndUpdate(
                { studentId, semester: semesterInt, instituteId },
                {
                    $set: {
                        'backSubjects.$[elem].feePaid': true,
                        'backSubjects.$[elem].feePaymentDate': paymentData.paymentDate,
                        'backSubjects.$[elem].feePaymentReceiptNo': paymentData.receiptNo,
                        'backSubjects.$[elem].status': 'Fee_Paid'
                    }
                },
                { 
                    arrayFilters: [{ 'elem.code': subjectCode }],
                    session
                }
            );

            // Get subject name for history
            const studentForHistory = await Student.findOne({ studentId, instituteId }, null, { session });
            const semesterIdx = semesterInt - 1;
            const backSubject = studentForHistory?.feeStructure?.semesterFees?.[semesterIdx]?.pendingBackSubjects?.find(
                sub => sub.subjectCode === subjectCode
            );
            
            await BackSubjectHistory.create([{
                studentId: studentId,
                semester: semesterInt,
                subjectCode: subjectCode,
                subjectName: backSubject?.subjectName || 'Unknown Subject',
                action: 'fee_paid',
                status: 'pending',
                instituteId: instituteId,
                remarks: paymentData.remarks
            }], { session });

            await session.commitTransaction();
            console.log(`Back subject fee payment updated for ${studentId}, subject ${subjectCode}`);
            
        } catch (error) {
            await session.abortTransaction();
            console.error('Error updating back subject fee payment:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async addBackSubjectsFromResult(studentId, instituteId, semester, backSubjects) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const semesterIndex = parseInt(semester) - 1;
            
            const pendingBackSubjects = backSubjects.map(back => ({
                subjectCode: back.code,
                subjectName: back.name,
                feeAmount: back.feeAmount || 500,
                feePaid: false,
                examFeePaid: false,
                isCleared: false,
                attempts: 0,
                status: 'Fee_Pending'
            }));

            const backSubjectFeeAmount = backSubjects.length * 500;

            await Student.findOneAndUpdate(
                { studentId, instituteId },
                {
                    $push: {
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects`]: { $each: pendingBackSubjects }
                    },
                    $inc: {
                        [`feeStructure.semesterFees.${semesterIndex}.backSubjectFees`]: backSubjectFeeAmount,
                        'feeStructure.backSubjectFees': backSubjectFeeAmount
                    }
                },
                { session }
            );

            await BackSubjectHistory.insertMany(
                backSubjects.map(back => ({
                    studentId: studentId,
                    semester: parseInt(semester),
                    subjectCode: back.code,
                    subjectName: back.name,
                    action: 'failed',
                    marks: back.obtainedMarks || 0,
                    examDate: new Date(),
                    status: 'pending',
                    instituteId: instituteId,
                    remarks: `Failed in ${back.name} - Back subject fee added`
                })),
                { session }
            );

            await session.commitTransaction();
            console.log(`Added ${backSubjects.length} back subjects for student ${studentId}, semester ${semester}`);
            
        } catch (error) {
            await session.abortTransaction();
            console.error('Error adding back subjects:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async clearBackSubject(studentId, instituteId, semester, subjectCode, marks, examDate) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const semesterInt = parseInt(semester);
            const semesterIndex = semesterInt - 1;
            
            await Student.findOneAndUpdate(
                { studentId, instituteId },
                {
                    $set: {
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$[elem].isCleared`]: true,
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$[elem].clearedDate`]: new Date(),
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$[elem].status`]: 'Cleared'
                    }
                },
                { 
                    arrayFilters: [{ 'elem.subjectCode': subjectCode }],
                    session
                }
            );

            // Get the back subject details before updating
            const resultDoc = await Result.findOne(
                { studentId, semester: semesterInt, instituteId },
                null,
                { session }
            );

            if (!resultDoc) {
                throw new Error('Result document not found');
            }

            const backSubject = resultDoc.backSubjects.find(bs => bs.code === subjectCode);
            if (!backSubject) {
                throw new Error('Back subject not found in result');
            }

            // Update back subject as cleared
            await Result.findOneAndUpdate(
                { studentId, semester: semesterInt, instituteId },
                {
                    $set: {
                        'backSubjects.$[elem].isCleared': true,
                        'backSubjects.$[elem].clearedDate': new Date(),
                        'backSubjects.$[elem].status': 'Cleared'
                    }
                },
                { 
                    arrayFilters: [{ 'elem.code': subjectCode }],
                    session
                }
            );

            // Add the cleared back subject to the main subjects array as a Pass result
            await Result.findOneAndUpdate(
                { studentId, semester: semesterInt, instituteId },
                {
                    $push: {
                        subjects: {
                            name: backSubject.name,
                            code: backSubject.code,
                            result: 'Pass',
                            obtainedMarks: marks || 50,
                            maxMarks: 100,
                            isBackSubject: true,
                            clearedDate: new Date()
                        }
                    }
                },
                { session }
            );

            // Get subject name for history
            const studentForHistory = await Student.findOne({ studentId, instituteId }, null, { session });
            const semesterIdx = semesterInt - 1;
            const backSubjectForHistory = studentForHistory?.feeStructure?.semesterFees?.[semesterIdx]?.pendingBackSubjects?.find(
                sub => sub.subjectCode === subjectCode
            );
            
            await BackSubjectHistory.create([{
                studentId: studentId,
                semester: semesterInt,
                subjectCode: subjectCode,
                subjectName: backSubjectForHistory?.subjectName || 'Unknown Subject',
                action: 'cleared',
                marks: marks,
                examDate: examDate,
                status: 'cleared',
                instituteId: instituteId,
                remarks: `Back subject cleared with ${marks} marks`
            }], { session });

            await session.commitTransaction();
            console.log(`Back subject cleared for ${studentId}, subject ${subjectCode}`);
            
        } catch (error) {
            await session.abortTransaction();
            console.error('Error clearing back subject:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async getStudentBackSubjects(studentId, instituteId) {
        try {
            const student = await Student.findOne({ studentId, instituteId });
            if (!student) return null;

            const backSubjects = [];
            
            if (student.feeStructure?.semesterFees) {
                student.feeStructure.semesterFees.forEach((semesterFee, index) => {
                    if (semesterFee.pendingBackSubjects?.length > 0) {
                        semesterFee.pendingBackSubjects.forEach(back => {
                            if (!back.isCleared) {
                                backSubjects.push({
                                    semester: index + 1,
                                    subjectCode: back.subjectCode,
                                    subjectName: back.subjectName,
                                    feeAmount: back.feeAmount,
                                    feePaid: back.feePaid,
                                    paymentDate: back.paymentDate,
                                    examFeePaid: back.examFeePaid,
                                    status: back.status,
                                    attempts: back.attempts,
                                    nextExamDate: back.nextExamDate
                                });
                            }
                        });
                    }
                });
            }
            
            return backSubjects;
        } catch (error) {
            console.error('Error getting student back subjects:', error);
            return null;
        }
    }
}

// ================== MIDDLEWARE ==================

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Access token required' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const admin = await Admin.findById(decoded.id);
        if (!admin || !admin.isActive) {
            return res.status(403).json({ 
                success: false,
                message: 'Account deactivated or not found' 
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            instituteId: admin.instituteId
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expired' 
            });
        }
        
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Authentication error' 
        });
    }
};

// Multi-tenancy middleware
const addInstituteFilter = (req, res, next) => {
    if (req.user && req.user.instituteId) {
        if (req.method === 'GET') {
            req.query.instituteId = req.user.instituteId;
        }
        
        if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
            req.body.instituteId = req.user.instituteId;
        }
    }
    next();
};

// Image upload helper function
const uploadImageToCloudinary = async (buffer, originalName) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: 'coaching_management/students',
                public_id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                transformation: [
                    { width: 400, height: 400, crop: 'limit' },
                    { quality: 'auto:good' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        ).end(buffer);
    });
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

app.get('/', (req, res) => {
    res.send('Coaching Management System API is running');
});

// ================== AUTH ROUTES ==================
app.post('/api/auth/login',  [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 1 }).withMessage('Password is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email (including password field)
        const admin = await Admin.findOne({ 
            email: email.toLowerCase() 
        }).select('+password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if admin account is active
        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Compare password
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                instituteId: admin.instituteId
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Response with admin details (excluding password)
        const adminResponse = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            instituteName: admin.instituteName,
            instituteId: admin.instituteId,
            role: admin.role,
            phone: admin.phone,
            address: admin.address,
            lastLogin: admin.lastLogin,
            isActive: admin.isActive
        };

        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: adminResponse
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);
        
        if (!admin || !admin.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account deactivated or not found'
            });
        }

        const adminResponse = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            instituteName: admin.instituteName,
            instituteId: admin.instituteId,
            role: admin.role,
            phone: admin.phone,
            address: admin.address,
            lastLogin: admin.lastLogin,
            isActive: admin.isActive
        };

        res.json({
            success: true,
            admin: adminResponse
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Token verification failed'
        });
    }
});

// Admin Registration
app.post('/api/auth/register', [
    body('name').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('instituteName').isLength({ min: 2, max: 100 }).withMessage('Institute name must be between 2 and 100 characters'),
], handleValidationErrors, async (req, res) => {
    try {
        const { name, email, password, instituteName, phone, address } = req.body;

        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return res.status(409).json({ 
                success: false,
                message: 'Admin already exists with this email' 
            });
        }

        const instituteId = await generateUniqueInstituteId(instituteName);

        const admin = new Admin({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            instituteName: instituteName.trim(),
            instituteId,
            phone: phone?.trim(),
            address: address || {}
        });

        await admin.save();

        // Create default courses
        await createDefaultCourses(instituteId);

        const token = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email, 
                role: admin.role,
                instituteId: admin.instituteId
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                instituteName: admin.instituteName,
                instituteId: admin.instituteId,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login'
        });
    }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        // In a stateless JWT system, logout is mainly handled client-side
        // But we can add server-side logic here if needed (like blacklisting tokens)
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// ================== UTILITY FUNCTIONS ==================

// Generate unique institute ID
const generateUniqueInstituteId = async (instituteName) => {
    try {
        // Create base ID from institute name
        let baseId = instituteName
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 3); // Take first 3 characters
        
        if (baseId.length < 3) {
            baseId = baseId.padEnd(3, 'X');
        }
        
        // Add random numbers
        let instituteId = baseId + Math.floor(100 + Math.random() * 900);
        
        // Check if ID already exists
        let existingAdmin = await Admin.findOne({ instituteId: instituteId });
        let counter = 1;
        
        while (existingAdmin) {
            instituteId = baseId + (Math.floor(100 + Math.random() * 900) + counter);
            existingAdmin = await Admin.findOne({ instituteId: instituteId });
            counter++;
            
            // Prevent infinite loop
            if (counter > 1000) {
                instituteId = baseId + Date.now().toString().slice(-3);
                break;
            }
        }
        
        return instituteId;
    } catch (error) {
        console.error('Error generating institute ID:', error);
        // Fallback to timestamp-based ID
        return 'INST' + Date.now().toString().slice(-3);
    }
};

// ================== DEFAULT ADMIN SETUP ==================

// Create default admin if none exists
const createDefaultAdmin = async () => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const defaultAdmin = new Admin({
                name: 'Admin',
                email: 'admin@institute.com',
                password: 'admin123456',
                instituteName: 'Demo Institute',
                instituteId: 'DEMO001',
                phone: '9876543210',
                address: {
                    street: '123 Demo Street',
                    city: 'Demo City',
                    state: 'Demo State',
                    pincode: '123456',
                    country: 'India'
                }
            });
            
            await defaultAdmin.save();
                    // Default admin created - Email: admin@institute.com, Password: admin123456
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

// Create default courses for a new institute
const createDefaultCourses = async (instituteId) => {
    try {
        // Check if courses already exist for this institute
        const existingCourses = await Course.countDocuments({ instituteId });
        if (existingCourses > 0) {
            // Courses already exist for institute
            return;
        }

        const defaultCourses = [
            {
                name: 'PGDCA',
                fullName: 'Post Graduate Diploma in Computer Application',
                duration: '2 Years',
                totalSemesters: 2,  // PGDCA has 2 semesters, not 4
                fee: 12000,  // Total course fee
                backSubjectFee: 500,
                isActive: true,
                instituteId,
                semesters: [
                    {
                        semesterNumber: 1,
                        semesterFee: 7000,  // First semester fee (higher)
                        subjects: [
                            { name: 'Computer Fundamentals', code: 'PG101' },
                            { name: 'Programming in C', code: 'PG102' },
                            { name: 'Database Management System', code: 'PG103' },
                            { name: 'Data Structure', code: 'PG104' },
                            { name: 'Web Designing', code: 'PG105' }
                        ]
                    },
                    {
                        semesterNumber: 2,
                        semesterFee: 5000,  // Second semester fee
                        subjects: [
                            { name: 'Operating System', code: 'PG201' },
                            { name: 'Software Engineering', code: 'PG202' },
                            { name: 'Java Programming', code: 'PG203' },
                            { name: 'Computer Networks', code: 'PG204' },
                            { name: 'Project Work', code: 'PG205' }
                        ]
                    }
                ],
                // Legacy subjects for backward compatibility
                subjects: [
                    { name: 'Computer Fundamentals', code: 'PG101' },
                    { name: 'Programming in C', code: 'PG102' },
                    { name: 'Database Management System', code: 'PG103' },
                    { name: 'Data Structure', code: 'PG104' },
                    { name: 'Web Designing', code: 'PG105' },
                    { name: 'Operating System', code: 'PG201' },
                    { name: 'Software Engineering', code: 'PG202' },
                    { name: 'Java Programming', code: 'PG203' },
                    { name: 'Computer Networks', code: 'PG204' },
                    { name: 'Project Work', code: 'PG205' }
                ]
            },
            {
                name: 'DCA',
                fullName: 'Diploma in Computer Application',
                duration: '1 Year',
                totalSemesters: 2,
                fee: 8000,  // Total course fee
                backSubjectFee: 500,
                isActive: true,
                instituteId,
                semesters: [
                    {
                        semesterNumber: 1,
                        semesterFee: 4500,  // First semester fee
                        subjects: [
                            { name: 'Computer Fundamentals', code: 'DC101' },
                            { name: 'MS Office', code: 'DC102' },
                            { name: 'Internet & Email', code: 'DC103' }
                        ]
                    },
                    {
                        semesterNumber: 2,
                        semesterFee: 3500,  // Second semester fee
                        subjects: [
                            { name: 'Tally ERP', code: 'DC201' },
                            { name: 'Basic Programming', code: 'DC202' },
                            { name: 'Web Designing Basics', code: 'DC203' }
                        ]
                    }
                ],
                // Legacy subjects for backward compatibility
                subjects: [
                    { name: 'Computer Fundamentals', code: 'DC101' },
                    { name: 'MS Office', code: 'DC102' },
                    { name: 'Internet & Email', code: 'DC103' },
                    { name: 'Tally ERP', code: 'DC201' },
                    { name: 'Basic Programming', code: 'DC202' },
                    { name: 'Web Designing Basics', code: 'DC203' }
                ]
            }
        ];

        await Course.insertMany(defaultCourses);
        // Default courses created for institute
    } catch (error) {
        console.error('Error creating default courses:', error);
    }
};

// ================== COURSE ROUTES ==================

// Get all courses
app.get('/api/courses', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const courses = await Course.find({ instituteId: req.user.instituteId });
        res.json({
            success: true,
            courses
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching courses'
        });
    }
});

// Create new course
app.post('/api/courses', authenticateToken, addInstituteFilter, [
    body('name').notEmpty().withMessage('Course name is required'),
    body('fullName').notEmpty().withMessage('Full course name is required'),
    body('duration').notEmpty().withMessage('Duration is required'),
    body('totalSemesters').isInt({ min: 1 }).withMessage('Total semesters must be a positive integer'),
    body('backSubjectFee').isFloat({ min: 0 }).withMessage('Back subject fee must be a positive number'),
    body('semesters').isArray({ min: 1 }).withMessage('At least one semester is required'),
    body('semesters.*.semesterNumber').isInt({ min: 1 }).withMessage('Valid semester number is required'),
    body('semesters.*.semesterFee').isFloat({ min: 0 }).withMessage('Semester fee must be a positive number'),
    body('semesters.*.subjects').isArray({ min: 1 }).withMessage('At least one subject is required per semester')
], handleValidationErrors, async (req, res) => {
    try {
        // Check if course name already exists for this institute
        const existingCourse = await Course.findOne({
            name: req.body.name,
            instituteId: req.user.instituteId
        });

        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: 'Course with this name already exists'
            });
        }

        const courseData = {
            ...req.body,
            instituteId: req.user.instituteId,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true
        };
        
        // Calculate total fee from semesters if provided
        if (courseData.semesters && courseData.semesters.length > 0) {
            courseData.fee = courseData.semesters.reduce((total, sem) => total + (sem.semesterFee || 0), 0);
        }

        const course = new Course(courseData);
        await course.save();

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating course'
        });
    }
});

// Update course
app.put('/api/courses/:id', authenticateToken, addInstituteFilter, [
    param('id').isMongoId().withMessage('Invalid course ID'),
    body('name').optional().notEmpty().withMessage('Course name cannot be empty'),
    body('fullName').optional().notEmpty().withMessage('Full course name cannot be empty'),
    body('duration').optional().notEmpty().withMessage('Duration cannot be empty'),
    body('totalSemesters').optional().isInt({ min: 1 }).withMessage('Total semesters must be a positive integer'),
    body('backSubjectFee').optional().isFloat({ min: 0 }).withMessage('Back subject fee must be a positive number'),
    body('semesters').optional().isArray({ min: 1 }).withMessage('At least one semester is required'),
    body('semesters.*.semesterNumber').optional().isInt({ min: 1 }).withMessage('Valid semester number is required'),
    body('semesters.*.semesterFee').optional().isFloat({ min: 0 }).withMessage('Semester fee must be a positive number'),
    body('semesters.*.subjects').optional().isArray({ min: 1 }).withMessage('At least one subject is required per semester')
], handleValidationErrors, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            instituteId: req.user.instituteId
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if new name conflicts with existing course (excluding current course)
        if (req.body.name && req.body.name !== course.name) {
            const existingCourse = await Course.findOne({
                name: req.body.name,
                instituteId: req.user.instituteId,
                _id: { $ne: req.params.id }
            });

            if (existingCourse) {
                return res.status(400).json({
                    success: false,
                    message: 'Course with this name already exists'
                });
            }
        }

        Object.assign(course, req.body);
        
        // Recalculate total fee if semesters are updated
        if (req.body.semesters && req.body.semesters.length > 0) {
            course.fee = req.body.semesters.reduce((total, sem) => total + (sem.semesterFee || 0), 0);
        }
        await course.save();

        res.json({
            success: true,
            message: 'Course updated successfully',
            course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating course'
        });
    }
});

// Delete course
app.delete('/api/courses/:id', authenticateToken, addInstituteFilter, [
    param('id').isMongoId().withMessage('Invalid course ID')
], handleValidationErrors, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            instituteId: req.user.instituteId
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if any students are enrolled in this course
        const enrolledStudents = await Student.countDocuments({
            'academicInfo.course': course.name,
            instituteId: req.user.instituteId
        });

        if (enrolledStudents > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete course. ${enrolledStudents} student(s) are currently enrolled.`,
                enrolledStudents
            });
        }

        await Course.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting course'
        });
    }
});

// Get single course
app.get('/api/courses/:id', authenticateToken, addInstituteFilter, [
    param('id').isMongoId().withMessage('Invalid course ID')
], handleValidationErrors, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            instituteId: req.user.instituteId
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get enrollment statistics
        const enrollmentStats = await Student.aggregate([
            {
                $match: {
                    'academicInfo.course': course.name,
                    instituteId: req.user.instituteId
                }
            },
            {
                $group: {
                    _id: null,
                    totalStudents: { $sum: 1 },
                    activeSemesters: { $addToSet: '$academicInfo.currentSemester' }
                }
            }
        ]);

        const stats = enrollmentStats[0] || { totalStudents: 0, activeSemesters: [] };

        res.json({
            success: true,
            course: {
                ...course.toJSON(),
                stats: {
                    totalStudents: stats.totalStudents,
                    activeSemesters: stats.activeSemesters.sort()
                }
            }
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching course'
        });
    }
});

// ================== ENHANCED STUDENT ROUTES ==================

// Get all students with pending back subjects (for BackSubjectResultPage) - MUST BE BEFORE :id route
app.get('/api/students/with-back-subjects', authenticateToken, async (req, res) => {
    try {
        console.log('=== STUDENTS WITH BACK SUBJECTS API ===');
        console.log('User:', req.user);
        
        if (!req.user || !req.user.instituteId) {
            return res.status(401).json({
                success: false,
                message: 'Institute ID not found in token'
            });
        }
        
        // Query the Result collection for students with pending back subjects
        const resultsWithBackSubjects = await Result.find({
            instituteId: req.user.instituteId,
            'backSubjects.0': { $exists: true } // Has at least one back subject
        }).lean();
        
        console.log(`Found ${resultsWithBackSubjects.length} results with back subjects`);
        
        // Group by student and aggregate pending back subjects
        const studentMap = new Map();
        
        for (const result of resultsWithBackSubjects) {
            const studentId = result.studentId;
            const pendingBackSubjects = result.backSubjects.filter(back => 
                !back.isCleared // Only show subjects that are not cleared (regardless of fee payment)
            );
            
            if (pendingBackSubjects.length > 0) {
                if (!studentMap.has(studentId)) {
                    // Get student details
                    const student = await Student.findOne({
                        studentId: studentId,
                        instituteId: req.user.instituteId
                    }).lean();
                    
                    if (student) {
                        studentMap.set(studentId, {
                            studentId: student.studentId,
                            name: student.name,
                            phone: student.phone,
                            email: student.email,
                            course: student.academicInfo?.course,
                            currentSemester: student.academicInfo?.currentSemester,
                            pendingBackSubjects: [],
                            pendingCount: 0
                        });
                    }
                }
                
                const studentData = studentMap.get(studentId);
                if (studentData) {
                    pendingBackSubjects.forEach(back => {
                        studentData.pendingBackSubjects.push({
                            semester: result.semester,
                            subjectCode: back.code,
                            subjectName: back.name,
                            feeAmount: back.feeAmount || 500,
                            examDate: back.nextExamDate || result.examDate,
                            isCleared: back.isCleared || false,
                            feePaid: back.feePaid || false,
                            status: back.status || 'Fee_Pending',
                            attempts: back.attempts || 0
                        });
                        studentData.pendingCount++;
                    });
                }
            }
        }
        
        const studentsWithPendingBackSubjects = Array.from(studentMap.values());
        
        console.log(`Returning ${studentsWithPendingBackSubjects.length} students with pending back subjects`);
        
        res.json({
            success: true,
            students: studentsWithPendingBackSubjects,
            total: studentsWithPendingBackSubjects.length
        });
        
    } catch (error) {
        console.error('=== STUDENTS WITH BACK SUBJECTS ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error fetching students with back subjects',
            error: error.message
        });
    }
});

// Get all students with advanced filtering
app.get('/api/students', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            course = '', 
            status = '',
            batch = '',
            feeStatus = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        let query = { instituteId: req.user.instituteId };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (course) {
            query['academicInfo.course'] = course;
        }
        
        if (batch) {
            query['academicInfo.batch'] = batch;
        }
        
        if (status) {
            query.status = status;
        }

        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const students = await Student.find(query)
            .sort(sortObj)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('results')
            .lean();

        const total = await Student.countDocuments(query);
        console.log(students);
        // Add computed fields
        let studentsWithComputedFields = students.map(student => {
            let totalBackSubjects = 0;
            
            if (student?.results && Array.isArray(student.results)) {
                student.results.forEach((result, resultIndex) => {
                    if (result && result.backSubjects && Array.isArray(result.backSubjects)) {
                        const unclearedBacks = result.backSubjects.filter(back => !back.isCleared);
                        totalBackSubjects += unclearedBacks.length;
                        
                        if (unclearedBacks.length > 0) {
                            console.log(`Student ${student.studentId} - Semester ${resultIndex + 1}: ${unclearedBacks.length} uncleared back subjects:`, 
                                unclearedBacks.map(b => `${b.code}(cleared:${b.isCleared})`));
                        }
                    }
                });
            }
            
            if (totalBackSubjects > 0) {
                console.log(`Student ${student.studentId} total back subjects: ${totalBackSubjects}`);
            }

            const remainingAmount = student.feeStructure?.remainingAmount || 0;
            const totalPaid = student.feeStructure?.totalPaid || 0;
            const courseFee = student.feeStructure?.courseFee || 0;
            const backSubjectFees = student.feeStructure?.backSubjectFees || 0;
            
            // Calculate pending back exam fees
            const pendingBackExamFees = totalBackSubjects * 500;
            const backExamFeesPaid = student.feeStructure?.backSubjectExamFeesPaid || 0;
            const backExamFeesRemaining = Math.max(0, pendingBackExamFees - backExamFeesPaid);
            
            let computedFeeStatus = 'Paid';
            if (remainingAmount > 0) {
                computedFeeStatus = totalPaid > 0 ? 'Partial' : 'Pending';
            }
            
            // If back exam fees are pending, show as pending
            if (backExamFeesRemaining > 0) {
                computedFeeStatus = 'Pending'; // Back exam fees pending
            }

            return {
                ...student,
                totalBackSubjects,
                feeStatus: computedFeeStatus,
                backExamFeesRemaining: backExamFeesRemaining,
                backExamFeesPaid: backExamFeesPaid
            };
        });

        // Filter by fee status if specified
        if (feeStatus) {
            studentsWithComputedFields = studentsWithComputedFields.filter(student => 
                student.feeStatus === feeStatus
            );
        }

        // Adjust pagination for filtered results
        const filteredTotal = studentsWithComputedFields.length;
        const actualTotal = feeStatus ? filteredTotal : total;
        
        res.json({
            success: true,
            students: studentsWithComputedFields,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(actualTotal / parseInt(limit)),
                totalItems: actualTotal,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching students'
        });
    }
});

// Get single student with complete details
app.get('/api/students/:id', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const student = await Student.findOne({ 
            studentId: req.params.id,
            instituteId: req.user.instituteId 
        }).lean();
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        // Get student's fee history
        const feeHistory = await FeePayment.find({
            studentId: req.params.id,
            instituteId: req.user.instituteId
        }).sort({ paymentDate: -1 }).lean();

        // Get student's results
        const results = await Result.find({
            studentId: req.params.id,
            instituteId: req.user.instituteId
        }).sort({ semester: 1 }).lean();

        // Calculate back subjects and fees
        const totalBackSubjects = results.reduce((total, result) => {
            return total + (result.backSubjects?.length || 0);
        }, 0);

        const totalBackSubjectFees = totalBackSubjects * 500; // ₹500 per back subject

        res.json({
            success: true,
            student: {
                ...student,
                totalBackSubjects,
                totalBackSubjectFees
            },
            feeHistory,
            results
        });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching student details'
        });
    }
});

// Upload student image endpoint
app.post('/api/students/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Upload to Cloudinary
        const imageUrl = await uploadImageToCloudinary(req.file.buffer, req.file.originalname);
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
});

// Create new student
app.post('/api/students', authenticateToken, addInstituteFilter, [
    body('name').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number format'),
    body('academicInfo.course').notEmpty().withMessage('Course selection is required'),
    body('feeStructure.courseFee').isFloat({ min: 0 }).withMessage('Course fee must be a positive number')
], handleValidationErrors, async (req, res) => {
    try {
        // Generate unique student ID
        const lastStudent = await Student.findOne({ 
            instituteId: req.user.instituteId 
        }).sort({ createdAt: -1 });
        
        let newStudentId = `${req.user.instituteId.toUpperCase()}_STU001`;
        
        if (lastStudent) {
            const lastIdMatch = lastStudent.studentId.match(/_STU(\d+)$/);
            if (lastIdMatch) {
                const lastId = parseInt(lastIdMatch[1]);
                newStudentId = `${req.user.instituteId.toUpperCase()}_STU${String(lastId + 1).padStart(3, '0')}`;
            }
        }

        // Check for duplicate phone number
        const existingStudent = await Student.findOne({
            phone: req.body.phone,
            instituteId: req.user.instituteId
        });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: 'Student with this phone number already exists'
            });
        }

        // Get course details
        const course = await Course.findOne({
            name: req.body.academicInfo.course,
            instituteId: req.user.instituteId
        });

        if (!course) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course selected'
            });
        }

        // Use semester-wise fees from course structure
        const semesterFees = [];
        let totalCourseFee = 0;
        
        if (course.semesters && course.semesters.length > 0) {
            // Use new semester-wise structure
            for (const courseSemester of course.semesters) {
                const semesterFee = courseSemester.semesterFee;
                totalCourseFee += semesterFee;
                
                const subjects = courseSemester.subjects.map(sub => ({
                    subjectCode: sub.code,
                    subjectName: sub.name,
                    maxMarks: sub.maxMarks || 100,
                    passingMarks: sub.passingMarks || 40
                }));
                
                semesterFees.push({
                    semester: courseSemester.semesterNumber,
                    semesterFee: semesterFee,
                    remainingAmount: semesterFee,
                    paidAmount: 0,
                    pendingBackSubjects: [],
                    backSubjectFees: 0,
                    status: courseSemester.semesterNumber === 1 ? 'Due' : 'Not_Due',
                    dueDate: courseSemester.semesterNumber === 1 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
                    subjects: subjects
                });
            }
        } else {
            // Fallback to old equal division method if no semester structure
            const totalSemesters = req.body.academicInfo.totalSemesters || 2;
            const feePerSemester = Math.floor(course.fee / totalSemesters);
            const remainingFee = course.fee - (feePerSemester * totalSemesters);
            totalCourseFee = course.fee;
            
            for (let i = 1; i <= totalSemesters; i++) {
                const semesterFee = i === 1 ? feePerSemester + remainingFee : feePerSemester;
                // Use legacy subjects if available
                const legacySubjects = course.subjects ? course.subjects.map(sub => ({
                    subjectCode: sub.code,
                    subjectName: sub.name,
                    maxMarks: 100,
                    passingMarks: 40
                })) : [];
                
                semesterFees.push({
                    semester: i,
                    semesterFee: semesterFee,
                    remainingAmount: semesterFee,
                    paidAmount: 0,
                    pendingBackSubjects: [],
                    backSubjectFees: 0,
                    status: i === 1 ? 'Due' : 'Not_Due',
                    dueDate: i === 1 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
                    subjects: legacySubjects
                });
            }
        }

        const studentData = {
            ...req.body,
            studentId: newStudentId,
            feeStructure: {
                totalCourseFee: totalCourseFee,
                semesterFees: semesterFees,
                // Legacy fields for compatibility
                courseFee: totalCourseFee,
                remainingAmount: totalCourseFee,
                backSubjectFees: 0
            }
        };

        const student = new Student(studentData);
        await student.save();

        res.status(201).json({ 
            success: true,
            message: 'Student created successfully', 
            student 
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating student'
        });
    }
});

// Update student
app.put('/api/students/:id', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate(
            { 
                studentId: req.params.id,
                instituteId: req.user.instituteId 
            },
            { 
                ...req.body, 
                updatedAt: new Date() 
            },
            { 
                new: true, 
                runValidators: true 
            }
        );
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Student updated successfully', 
            student 
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating student'
        });
    }
});

// Delete student
app.delete('/api/students/:id', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        // Try to find by both MongoDB ObjectId and custom studentId
        let query = { instituteId: req.user.instituteId };
        
        // Check if the id looks like a MongoDB ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            query._id = req.params.id;
        } else {
            query.studentId = req.params.id;
        }
        
        const student = await Student.findOne(query);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if student has any fee payments
        const hasPayments = await FeePayment.countDocuments({
            studentId: student.studentId,
            instituteId: req.user.instituteId
        });

        // Check if student has any results
        const hasResults = await Result.countDocuments({
            studentId: student.studentId,
            instituteId: req.user.instituteId
        });

        if (hasPayments > 0 || hasResults > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete student. Student has ${hasPayments} payment(s) and ${hasResults} result(s). Please remove them first or archive the student instead.`,
                hasPayments,
                hasResults
            });
        }

        await Student.findByIdAndDelete(student._id);

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting student'
        });
    }
});

// ================== ENHANCED FEE MANAGEMENT ROUTES ==================

// Get fee payments with filtering
app.get('/api/fees/payments', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            course = '', 
            feeType = '',
            startDate = '',
            endDate = ''
        } = req.query;
        
        let query = { instituteId: req.user.instituteId };
        
        if (search) {
            query.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { receiptNo: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (course) {
            query.course = course;
        }
        
        if (feeType) {
            query.feeType = feeType;
        }
        
        if (startDate && endDate) {
            query.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const payments = await FeePayment.find(query)
            .sort({ paymentDate: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const total = await FeePayment.countDocuments(query);

        res.json({
            success: true,
            payments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments'
        });
    }
});

// Create fee payment
app.post('/api/fees/payment', authenticateToken, addInstituteFilter, [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('feeType').isIn(['Course_Fee', 'Installment', 'Back_Subject', 'Late_Fee', 'Other']).withMessage('Invalid fee type'),
    body('paymentMode').isIn(['Cash', 'Online', 'Cheque', 'UPI', 'Card', 'NEFT', 'RTGS', 'DD']).withMessage('Invalid payment mode')
], handleValidationErrors, async (req, res) => {
    try {
        // Verify student exists
        const student = await Student.findOne({
            studentId: req.body.studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Generate receipt number
        const receiptNo = await generateReceiptNumber(req.user.instituteId);

        const paymentData = {
            ...req.body,
            receiptNo,
            studentName: student.name,
            course: student.academicInfo.course,
            finalAmount: req.body.amount - (req.body.discount || 0),
            createdBy: req.user.id
        };

        const payment = new FeePayment(paymentData);
        await payment.save();

        // Update student fee structure with priority-based payment
        if (req.body.feeType === 'Course_Fee' || req.body.feeType === 'Installment') {
            const student = await Student.findOne(
                { studentId: req.body.studentId, instituteId: req.user.instituteId }
            );
            
            if (student && student.feeStructure.semesterFees) {
                let remainingPayment = paymentData.finalAmount;
                const updates = {};
                
                // Priority-based payment: Course fees first, then back subject fees
                for (let i = 0; i < student.feeStructure.semesterFees.length && remainingPayment > 0; i++) {
                    const semesterFee = student.feeStructure.semesterFees[i];
                    
                    // Priority 1: Pay course fees for this semester
                    const courseFeeRemaining = semesterFee.semesterFee - (semesterFee.paidAmount || 0);
                    if (courseFeeRemaining > 0 && remainingPayment > 0) {
                        const courseFeePayment = Math.min(remainingPayment, courseFeeRemaining);
                        
                        updates[`feeStructure.semesterFees.${i}.paidAmount`] = 
                            (semesterFee.paidAmount || 0) + courseFeePayment;
                        updates[`feeStructure.semesterFees.${i}.remainingAmount`] = 
                            (semesterFee.remainingAmount || semesterFee.semesterFee) - courseFeePayment;
                        updates[`feeStructure.semesterFees.${i}.lastPaymentDate`] = new Date();
                        
                        remainingPayment -= courseFeePayment;
                    }
                    
                    // Priority 2: Pay pending back subject fees for this semester
                    if (semesterFee.pendingBackSubjects && semesterFee.pendingBackSubjects.length > 0) {
                        for (let j = 0; j < semesterFee.pendingBackSubjects.length && remainingPayment > 0; j++) {
                            const backSubject = semesterFee.pendingBackSubjects[j];
                            if (!backSubject.feePaid && remainingPayment >= backSubject.feeAmount) {
                                updates[`feeStructure.semesterFees.${i}.pendingBackSubjects.${j}.feePaid`] = true;
                                updates[`feeStructure.semesterFees.${i}.pendingBackSubjects.${j}.paymentDate`] = new Date();
                                updates[`feeStructure.semesterFees.${i}.backSubjectFees`] = 
                                    (semesterFee.backSubjectFees || 0) + backSubject.feeAmount;
                                remainingPayment -= backSubject.feeAmount;
                            }
                        }
                    }
                    
                    // Update semester status
                    const courseFeesPaid = updates[`feeStructure.semesterFees.${i}.paidAmount`] || semesterFee.paidAmount || 0;
                    const backSubjectFeesPaid = updates[`feeStructure.semesterFees.${i}.backSubjectFees`] || semesterFee.backSubjectFees || 0;
                    const totalPaid = courseFeesPaid + backSubjectFeesPaid;
                    const totalDue = semesterFee.semesterFee + (semesterFee.backSubjectFees || 0);
                    
                    // Check if there are pending back subjects
                    const hasPendingBackSubjects = semesterFee.pendingBackSubjects && 
                        semesterFee.pendingBackSubjects.some(back => !back.feePaid);
                    
                    if (totalPaid >= semesterFee.semesterFee && !hasPendingBackSubjects) {
                        updates[`feeStructure.semesterFees.${i}.status`] = 'Paid';
                    } else if (hasPendingBackSubjects) {
                        updates[`feeStructure.semesterFees.${i}.status`] = 'Back_Pending';
                    } else if (totalPaid > 0) {
                        updates[`feeStructure.semesterFees.${i}.status`] = 'Partial';
                    }
                }
                
                await Student.findOneAndUpdate(
                    { studentId: req.body.studentId, instituteId: req.user.instituteId },
                    { 
                        $set: updates,
                        $inc: { 
                            'feeStructure.totalPaid': paymentData.finalAmount,
                            'feeStructure.remainingAmount': -paymentData.finalAmount
                        }
                    }
                );
            } else {
                // Fallback to legacy structure
                await Student.findOneAndUpdate(
                    { studentId: req.body.studentId, instituteId: req.user.instituteId },
                    { 
                        $inc: { 
                            'feeStructure.totalPaid': paymentData.finalAmount,
                            'feeStructure.remainingAmount': -paymentData.finalAmount
                        }
                    }
                );
            }
        } else if (req.body.feeType === 'Back_Subject') {
            // Handle back subject exam fees payment
            const semester = req.body.semester || student.academicInfo?.currentSemester || 1;
            
            // Mark back subjects as exam fees paid for the specific student
            await Student.findOneAndUpdate(
                { studentId: req.body.studentId, instituteId: req.user.instituteId },
                { 
                    $inc: { 
                        'feeStructure.backSubjectExamFeesPaid': paymentData.finalAmount,
                        [`feeStructure.semesterFees.${semester-1}.backSubjectExamFeesPaid`]: paymentData.finalAmount
                    },
                    $set: {
                        [`results.${semester-1}.backSubjectExamFeesPaid`]: true
                    }
                }
            );
            
            console.log(`Back subject exam fees paid: ₹${paymentData.finalAmount} for semester ${semester}`);
        }

        res.status(201).json({ 
            success: true,
            message: 'Payment recorded successfully', 
            payment 
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error recording payment'
        });
    }
});

// Generate receipt number
async function generateReceiptNumber(instituteId) {
    const currentYear = new Date().getFullYear();
    const lastPayment = await FeePayment.findOne({ 
        instituteId: instituteId,
        receiptNo: { $regex: `^${instituteId.toUpperCase()}_${currentYear}_` }
    }).sort({ createdAt: -1 });
    
    let receiptNo = `${instituteId.toUpperCase()}_${currentYear}_001`;
    
    if (lastPayment) {
        const lastReceiptMatch = lastPayment.receiptNo.match(/_(\d+)$/);
        if (lastReceiptMatch) {
            const lastReceiptNum = parseInt(lastReceiptMatch[1]);
            receiptNo = `${instituteId.toUpperCase()}_${currentYear}_${String(lastReceiptNum + 1).padStart(3, '0')}`;
        }
    }
    
    return receiptNo;
}

// Delete fee payment
app.delete('/api/fees/payments/:id', authenticateToken, addInstituteFilter, [
    param('id').isMongoId().withMessage('Invalid payment ID')
], handleValidationErrors, async (req, res) => {
    try {
        const payment = await FeePayment.findOne({
            _id: req.params.id,
            instituteId: req.user.instituteId
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Reverse the payment effects on student fees
        if (payment.feeType === 'Course_Fee' || payment.feeType === 'Installment') {
            await Student.findOneAndUpdate(
                { studentId: payment.studentId, instituteId: req.user.instituteId },
                { 
                    $inc: { 
                        'feeStructure.totalPaid': -payment.finalAmount,
                        'feeStructure.remainingAmount': payment.finalAmount
                    }
                }
            );
        } else if (payment.feeType === 'Back_Subject') {
            await Student.findOneAndUpdate(
                { studentId: payment.studentId, instituteId: req.user.instituteId },
                { 
                    $inc: { 
                        'feeStructure.backSubjectFees': -payment.finalAmount
                    }
                }
            );
        }

        await FeePayment.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Payment deleted successfully and student fee structure updated'
        });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting payment'
        });
    }
});

// ================== RESULT MANAGEMENT ROUTES ==================

// Get all results with pagination and filtering
app.get('/api/results', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            course = '', 
            semester = '',
            result = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        let query = { instituteId: req.user.instituteId };
        
        // Build search query
        if (search) {
            query.$or = [
                { studentId: { $regex: search, $options: 'i' } },
                { studentName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (course) {
            query.course = course;
        }
        
        if (semester) {
            query.semester = parseInt(semester);
        }
        
        if (result) {
            query.result = result;
        }

        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const results = await Result.find(query)
            .sort(sortObj)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const total = await Result.countDocuments(query);

        // Get summary statistics
        const summaryStats = await Result.aggregate([
            { $match: { instituteId: req.user.instituteId } },
            {
                $group: {
                    _id: null,
                    totalResults: { $sum: 1 },
                    passCount: { $sum: { $cond: [{ $eq: ['$result', 'Pass'] }, 1, 0] } },
                    failCount: { $sum: { $cond: [{ $eq: ['$result', 'Fail'] }, 1, 0] } },
                    totalBackSubjects: { $sum: '$backSubjectsCount' },
                    avgPercentage: { $avg: '$percentage' }
                }
            }
        ]);

        const stats = summaryStats[0] || {
            totalResults: 0,
            passCount: 0,
            failCount: 0,
            totalBackSubjects: 0,
            avgPercentage: 0
        };

        res.json({
            success: true,
            results,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            stats: {
                ...stats,
                passPercentage: stats.totalResults > 0 ? ((stats.passCount / stats.totalResults) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching results'
        });
    }
});

// Get results by student
app.get('/api/results/student/:studentId', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const results = await Result.find({
            studentId: req.params.studentId,
            instituteId: req.user.instituteId
        }).sort({ semester: 1 });

        const student = await Student.findOne({
            studentId: req.params.studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            results,
            student: {
                studentId: student.studentId,
                name: student.name,
                course: student.academicInfo.course
            }
        });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching results'
        });
    }
});

// Add/Update result
app.post('/api/results', authenticateToken, addInstituteFilter, [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('semester').isInt({ min: 1 }).withMessage('Valid semester is required'),
    body('subjects').isArray({ min: 1 }).withMessage('At least one subject is required'),
    body('examDate').isISO8601().withMessage('Valid exam date is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { studentId, semester, subjects, examDate, remarks } = req.body;

        // Verify student exists
        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Calculate total marks and percentage
        const totalMarks = subjects.reduce((sum, subject) => sum + subject.maxMarks, 0);
        const obtainedMarks = subjects.reduce((sum, subject) => sum + subject.obtainedMarks, 0);
        const percentage = (obtainedMarks / totalMarks) * 100;

        // Determine grade and overall result
        let grade = 'F';
        let result = 'Fail';
        
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C';
        else if (percentage >= 40) grade = 'D';

        // Check for back subjects with enhanced tracking
        const backSubjects = subjects.filter(subject => 
            subject.result === 'Fail' || subject.obtainedMarks < (subject.passingMarks || subject.maxMarks * 0.4)
        ).map(subject => ({
            name: subject.name,
            code: subject.code,
            feeAmount: 500,
            feePaid: false,
            examFeePaid: false,
            isCleared: false,
            status: 'Fee_Pending',
            attempts: 0,
            maxMarks: subject.maxMarks,
            passingMarks: subject.passingMarks || subject.maxMarks * 0.4
        }));

        if (backSubjects.length === 0 && percentage >= 40) {
            result = 'Pass';
        }

        // Check if result already exists
        const existingResult = await Result.findOne({
            studentId: studentId,
            semester: semester,
            instituteId: req.user.instituteId
        });

        let resultDoc;
        if (existingResult) {
            // Update existing result
            resultDoc = await Result.findOneAndUpdate(
                { studentId: studentId, semester: semester, instituteId: req.user.instituteId },
                {
                    subjects,
                    examDate,
                    totalMarks,
                    obtainedMarks,
                    percentage: Math.round(percentage * 100) / 100,
                    grade,
                    result,
                    backSubjects,
                    backSubjectsCount: backSubjects.length,
                    remarks,
                    publishedBy: req.user.id,
                    isPublished: true,
                    updatedAt: new Date()
                },
                { new: true }
            );
        } else {
                    // Create new result
        resultDoc = new Result({
            instituteId: req.user.instituteId,
            studentId: studentId,
            studentName: student.name,
            course: student.academicInfo.course,
            semester,
            subjects,
            examDate,
            totalMarks,
            obtainedMarks,
            percentage: Math.round(percentage * 100) / 100,
            grade,
            result,
            backSubjects,
            backSubjectsCount: backSubjects.length,
            remarks,
            publishedBy: req.user.id,
            isPublished: true
        });
            await resultDoc.save();
        }

        // Update student's results array and add back subject fees if needed
        const studentUpdate = {
            $set: {
                [`results.${semester - 1}`]: {
                    semester,
                    examDate,
                    resultDate: new Date(),
                    totalMarks,
                    obtainedMarks,
                    percentage: Math.round(percentage * 100) / 100,
                    grade,
                    result,
                    subjects,
                    backSubjects: backSubjects.map(back => ({
                        ...back,
                        feeAdded: true,
                        isCleared: false,
                        status: 'Fee_Pending',
                        feePaymentReceiptNo: null,
                        examFeeReceiptNo: null
                    })),
                    remarks
                }
            }
        };

        // Add back subject fees using centralized manager
        let feeAddedAmount = 0;
        if (backSubjects.length > 0) {
            await BackSubjectManager.addBackSubjectsFromResult(
                studentId,
                req.user.instituteId,
                semester,
                backSubjects
            );
            
            feeAddedAmount = backSubjects.length * 500;
            
            // Update remaining amount and semester status
            const semesterIndex = semester - 1;
            const currentSemesterFee = student.feeStructure?.semesterFees?.[semesterIndex];
            
            if (currentSemesterFee) {
                const currentStatus = currentSemesterFee.status;
                let newStatus = 'Due';
                
                if (currentStatus === 'Paid') {
                    newStatus = 'Partial';
                } else if (currentStatus === 'Not_Due') {
                    newStatus = 'Due';
                }
                
                studentUpdate.$inc = {
                    'feeStructure.remainingAmount': feeAddedAmount
                };
                studentUpdate.$set = {
                    ...studentUpdate.$set,
                    [`feeStructure.semesterFees.${semester-1}.status`]: newStatus
                };
            }
        }

        await Student.findOneAndUpdate(
            { studentId: studentId, instituteId: req.user.instituteId },
            studentUpdate
        );

        // BackSubjectHistory entries are created by BackSubjectManager.addBackSubjectsFromResult

        const finalFeeAddedAmount = feeAddedAmount;
        
        res.json({
            success: true,
            message: backSubjects.length > 0 ? 
                `Result published! Student failed in ${backSubjects.length} subject(s). Back subject fees of ₹${finalFeeAddedAmount} added to semester fees.` :
                'Result published successfully! Student passed all subjects.',
            result: resultDoc,
            backSubjectsCount: backSubjects.length,
            backSubjectFeeAdded: finalFeeAddedAmount,
            overallResult: result
        });
    } catch (error) {
        console.error('Create result error:', error);
        res.status(500).json({
            success: false,
            message: 'Error publishing result'
        });
    }
});

// Mark result as delivered to student
app.put('/api/results/:studentId/:semester/mark-delivered', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId, semester } = req.params;
        const { isDelivered, deliveryDate, deliveredBy, remarks } = req.body;

        const result = await Result.findOneAndUpdate(
            { 
                studentId: studentId,
                semester: parseInt(semester),
                instituteId: req.user.instituteId 
            },
            { 
                isDelivered: isDelivered,
                deliveryDate: isDelivered ? (deliveryDate || new Date()) : null,
                deliveredBy: isDelivered ? (deliveredBy || req.user.id) : null,
                deliveryRemarks: remarks || null,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ 
                success: false,
                message: 'Result not found' 
            });
        }

        res.json({ 
            success: true,
            message: `Result marked as ${isDelivered ? 'delivered to student' : 'not delivered'}`,
            result: result
        });
    } catch (error) {
        console.error('Mark result delivery error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating result delivery status' 
        });
    }
});

// Pay back subject fee
app.post('/api/students/:studentId/back-subjects/pay-fee', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, subjectCode, paymentAmount, paymentMethod, remarks } = req.body;
        
        console.log('=== BACK SUBJECT PAYMENT DEBUG ===');
        console.log('Student ID:', studentId);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Ensure semester is an integer
        if (!semester || semester === 'null' || semester === null) {
            console.log('Invalid semester value:', semester);
            return res.status(400).json({
                success: false,
                message: 'Semester value is required and must be a valid number'
            });
        }
        
        const semesterInt = parseInt(semester);
        if (isNaN(semesterInt) || semesterInt < 1) {
            console.log('Invalid semester number:', semester);
            return res.status(400).json({
                success: false,
                message: 'Semester must be a valid positive number'
            });
        }
        
        console.log('Semester converted to int:', semesterInt);

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            console.log('Student not found');
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        console.log('Student found:', student.name);
        console.log('Fee structure exists:', !!student.feeStructure);
        console.log('Semester fees count:', student.feeStructure?.semesterFees?.length || 0);

        // Check if semester fee structure exists and find the pending back subject
        const semesterIndex = semesterInt - 1;
        console.log('Looking for semester:', semesterInt, 'Index:', semesterIndex);
        
        // Ensure fee structure exists, create if missing
        if (!student.feeStructure || !student.feeStructure.semesterFees || !student.feeStructure.semesterFees[semesterIndex]) {
            console.log('Fee structure missing for semester:', semesterInt, 'Creating it...');
            
            // Auto-create missing fee structure
            const totalSemesters = student.academicInfo?.totalSemesters || 6;
            const courseFeePerSemester = student.feeStructure?.totalCourseFee ? 
                Math.floor(student.feeStructure.totalCourseFee / totalSemesters) : 10000;
            
            // Ensure student has fee structure
            if (!student.feeStructure) {
                student.feeStructure = {
                    totalCourseFee: courseFeePerSemester * totalSemesters,
                    totalPaid: 0,
                    remainingAmount: courseFeePerSemester * totalSemesters,
                    backSubjectFees: 0,
                    backSubjectExamFeesPaid: 0,
                    semesterFees: []
                };
            }
            
            // Ensure semesterFees array exists
            if (!student.feeStructure.semesterFees) {
                student.feeStructure.semesterFees = [];
            }
            
            // Create missing semester fee structures
            for (let i = student.feeStructure.semesterFees.length; i <= semesterIndex; i++) {
                const semesterFeeStructure = {
                    semester: i + 1,
                    semesterFee: courseFeePerSemester,
                    paidAmount: 0,
                    remainingAmount: courseFeePerSemester,
                    backSubjectFees: 0,
                    backSubjectExamFeesPaid: 0,
                    status: 'Due',
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    subjects: [],
                    pendingBackSubjects: []
                };
                student.feeStructure.semesterFees.push(semesterFeeStructure);
            }
            
            // Save the updated fee structure
            await Student.findOneAndUpdate(
                { studentId: studentId, instituteId: req.user.instituteId },
                { feeStructure: student.feeStructure }
            );
            
            console.log('Fee structure created for semester:', semesterInt);
        }
        
        const semesterFee = student.feeStructure.semesterFees[semesterIndex];
        console.log('Semester fee found:', !!semesterFee);
        console.log('Has pendingBackSubjects:', !!semesterFee.pendingBackSubjects);
        console.log('PendingBackSubjects count:', semesterFee.pendingBackSubjects?.length || 0);
        
        // Check if pendingBackSubjects exist, if not create them from results
        if (!semesterFee || !semesterFee.pendingBackSubjects || semesterFee.pendingBackSubjects.length === 0) {
            console.log('No pendingBackSubjects found, checking results...');
            // Fallback: Check if back subjects exist in results
            const resultData = student.results?.[semesterIndex];
            if (resultData && resultData.backSubjects && resultData.backSubjects.length > 0) {
                // Create pendingBackSubjects from results data
                const pendingBackSubjects = resultData.backSubjects
                    .filter(back => !back.feePaid)
                    .map(back => ({
                        subjectCode: back.code,
                        subjectName: back.name,
                        feeAmount: back.feeAmount || 500,
                        feePaid: false,
                        examFeePaid: false,
                        isCleared: false,
                        attempts: 0,
                        nextExamDate: null
                    }));

                if (pendingBackSubjects.length > 0) {
                    // Update student record with pendingBackSubjects
                    await Student.findOneAndUpdate(
                        { studentId: studentId, instituteId: req.user.instituteId },
                        { $set: { [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects`]: pendingBackSubjects } }
                    );
                    
                    // Update local semesterFee object for immediate use
                    student.feeStructure.semesterFees[semesterIndex].pendingBackSubjects = pendingBackSubjects;
                } else {
                    return res.status(404).json({
                        success: false,
                        message: 'No unpaid back subjects found for this semester'
                    });
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'No pending back subjects found for this semester'
                });
            }
        }

        // Now find the specific back subject to pay
        const currentSemesterFee = student.feeStructure.semesterFees[semesterIndex];
        const backSubjectIndex = currentSemesterFee.pendingBackSubjects.findIndex(
            sub => sub.subjectCode === subjectCode
        );
        const backSubject = currentSemesterFee.pendingBackSubjects[backSubjectIndex];

        if (!backSubject) {
            console.log('Back subject not found in pending list');
            return res.status(404).json({
                success: false,
                message: 'Back subject not found in pending list'
            });
        }

        if (backSubject.feePaid) {
            console.log('Back subject fee already paid');
            return res.status(400).json({
                success: false,
                message: 'Back subject fee already paid'
            });
        }
        
        console.log('Back subject found:', backSubject.subjectName);
        console.log('Payment amount:', paymentAmount);

        // Create fee payment record
        const receiptNo = `BS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Creating fee payment record with receipt:', receiptNo);
        
        const feePayment = new FeePayment({
            receiptNo,
            instituteId: req.user.instituteId,
            studentId: studentId,
            studentName: student.name,
            course: student.academicInfo.course,
            amount: paymentAmount,
            finalAmount: paymentAmount,
            paymentMode: paymentMethod || 'Cash',
            feeType: 'Back_Subject',
            semesterInfo: {
                semester: semesterInt,
                course: student.academicInfo.course,
                totalSemesters: student.academicInfo.totalSemesters
            },
            backSubjectPayment: {
                semester: semesterInt,
                subjectCode: subjectCode,
                subjectName: backSubject.subjectName,
                feeAmount: paymentAmount,
                paymentType: 'Back_Subject_Fee'
            },
            remarks: remarks || `Back subject fee payment for ${backSubject.subjectName}`,
            createdBy: req.user.id
        });

        await feePayment.save();
        console.log('Fee payment saved successfully');

        // Update back subject fee payment using centralized manager
        console.log('Updating student record using BackSubjectManager...');
        await BackSubjectManager.updateBackSubjectFeePayment(
            studentId,
            req.user.instituteId,
            semesterInt,
            subjectCode,
            {
                amount: paymentAmount,
                paymentDate: new Date(),
                receiptNo: receiptNo,
                paymentMethod: paymentMethod || 'Cash',
                remarks: remarks || `Back subject fee payment for ${backSubject.subjectName}`
            }
        );
        
        // Update global fee amounts
        await Student.findOneAndUpdate(
            { studentId: studentId, instituteId: req.user.instituteId },
            { 
                $inc: { 
                    'feeStructure.remainingAmount': -paymentAmount,
                    'feeStructure.totalPaid': paymentAmount
                }
            }
        );
        console.log('Student record updated successfully');

        res.json({
            success: true,
            message: `Back subject fee of ₹${paymentAmount} collected successfully`,
            payment: feePayment,
            receiptNo: receiptNo
        });

    } catch (error) {
        console.error('=== BACK SUBJECT PAYMENT ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Full error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing back subject fee payment',
            error: error.message
        });
    }
});

// Comprehensive application health check
app.get('/api/admin/health-check', authenticateToken, async (req, res) => {
    try {
        console.log('=== APPLICATION HEALTH CHECK ===');
        
        // Check database connections
        const studentsCount = await Student.countDocuments({ instituteId: req.user.instituteId });
        const resultsCount = await Result.countDocuments({ instituteId: req.user.instituteId });
        const paymentsCount = await FeePayment.countDocuments({ instituteId: req.user.instituteId });
        const historyCount = await BackSubjectHistory.countDocuments({ instituteId: req.user.instituteId });
        
        // Check students with back subjects
        const studentsWithBackSubjects = await Student.find({ 
            instituteId: req.user.instituteId,
            'results.backSubjects.0': { $exists: true }
        }).lean();
        
        const backSubjectsStats = studentsWithBackSubjects.map(student => {
            let totalBackSubjects = 0;
            let paidBackSubjects = 0;
            let clearedBackSubjects = 0;
            
            if (student.results && Array.isArray(student.results)) {
                student.results.forEach(result => {
                    if (result.backSubjects && Array.isArray(result.backSubjects)) {
                        result.backSubjects.forEach(back => {
                            totalBackSubjects++;
                            if (back.feePaid) paidBackSubjects++;
                            if (back.isCleared) clearedBackSubjects++;
                        });
                    }
                });
            }
            
            return {
                studentId: student.studentId,
                name: student.name,
                totalBackSubjects,
                paidBackSubjects,
                clearedBackSubjects,
                pendingBackSubjects: totalBackSubjects - clearedBackSubjects
            };
        });
        
        const healthReport = {
            database: {
                studentsCount,
                resultsCount,
                paymentsCount,
                historyCount
            },
            backSubjects: {
                studentsWithBackSubjects: studentsWithBackSubjects.length,
                totalBackSubjects: backSubjectsStats.reduce((sum, s) => sum + s.totalBackSubjects, 0),
                paidBackSubjects: backSubjectsStats.reduce((sum, s) => sum + s.paidBackSubjects, 0),
                clearedBackSubjects: backSubjectsStats.reduce((sum, s) => sum + s.clearedBackSubjects, 0),
                pendingBackSubjects: backSubjectsStats.reduce((sum, s) => sum + s.pendingBackSubjects, 0)
            },
            studentStats: backSubjectsStats.slice(0, 5), // First 5 students as sample
            systemStatus: 'healthy'
        };
        
        console.log('Health check completed:', healthReport);
        
        res.json({
            success: true,
            healthReport,
            message: 'Application health check completed successfully'
        });
        
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Sync back subjects for all students
app.post('/api/admin/sync-back-subjects', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        console.log('Starting back subjects sync for institute:', req.user.instituteId);
        
        const students = await Student.find({ 
            instituteId: req.user.instituteId 
        }).select('studentId name');
        
        console.log(`Found ${students.length} students to sync`);
        
        let syncedCount = 0;
        const errors = [];
        
        for (const student of students) {
            try {
                await BackSubjectManager.syncBackSubjects(student.studentId, req.user.instituteId);
                syncedCount++;
                
                if (syncedCount % 10 === 0) {
                    console.log(`Synced ${syncedCount}/${students.length} students`);
                }
            } catch (error) {
                console.error(`Error syncing student ${student.studentId}:`, error.message);
                errors.push({
                    studentId: student.studentId,
                    name: student.name,
                    error: error.message
                });
            }
        }
        
        console.log(`Back subjects sync completed. Synced: ${syncedCount}, Errors: ${errors.length}`);
        
        res.json({
            success: true,
            message: `Back subjects synced successfully for ${syncedCount} students`,
            totalStudents: students.length,
            syncedCount,
            errorCount: errors.length,
            errors: errors.slice(0, 5) // Show first 5 errors
        });
        
    } catch (error) {
        console.error('Back subjects sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing back subjects',
            error: error.message
        });
    }
});

// Clear test data endpoint
app.post('/api/admin/clear-test-data', authenticateToken, async (req, res) => {
    try {
        const instituteId = req.user.instituteId;
        
        await Promise.all([
            Student.deleteMany({ instituteId }),
            Result.deleteMany({ instituteId }),
            FeePayment.deleteMany({ instituteId }),
            BackSubjectHistory.deleteMany({ instituteId })
        ]);
        
        res.json({
            success: true,
            message: 'All test data cleared successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing test data',
            error: error.message
        });
    }
});

// Debug endpoint to check BackSubjectHistory data
app.get('/api/admin/debug-back-subject-history', authenticateToken, async (req, res) => {
    try {
        console.log('=== DEBUG BACK SUBJECT HISTORY ===');
        
        const totalHistoryCount = await BackSubjectHistory.countDocuments({ instituteId: req.user.instituteId });
        const recentHistory = await BackSubjectHistory.find({ instituteId: req.user.instituteId })
            .sort({ dateRecorded: -1 })
            .limit(10)
            .lean();
        
        // Test creating a sample entry
        const testEntry = {
            studentId: 'TEST_STUDENT',
            semester: 1,
            subjectCode: 'TEST_CODE',
            subjectName: 'Test Subject',
            action: 'failed',
            examDate: new Date(),
            marks: 35,
            status: 'pending',
            remarks: 'Test entry for debugging',
            dateRecorded: new Date(),
            instituteId: req.user.instituteId
        };
        
        console.log('Creating test BackSubjectHistory entry:', testEntry);
        const createdEntry = await BackSubjectHistory.create(testEntry);
        console.log('Test entry created successfully:', createdEntry._id);
        
        res.json({
            success: true,
            totalHistoryCount,
            recentHistory,
            testEntry: createdEntry,
            message: `Found ${totalHistoryCount} history entries, created test entry`
        });
        
    } catch (error) {
        console.error('Debug back subject history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error debugging back subject history',
            error: error.message
        });
    }
});

// Fix/migrate back subjects data to new schema format
app.post('/api/admin/fix-back-subjects-data', authenticateToken, async (req, res) => {
    try {
        console.log('Starting back subjects data migration...');
        
        const students = await Student.find({ 
            instituteId: req.user.instituteId,
            'results.backSubjects.0': { $exists: true }
        });
        
        console.log(`Found ${students.length} students with back subjects`);
        
        for (const student of students) {
            let updated = false;
            
            for (let resultIndex = 0; resultIndex < student.results.length; resultIndex++) {
                const result = student.results[resultIndex];
                if (result.backSubjects && result.backSubjects.length > 0) {
                    
                    for (let backIndex = 0; backIndex < result.backSubjects.length; backIndex++) {
                        const backSubject = result.backSubjects[backIndex];
                        
                        // Check if back subject needs migration to new schema
                        if (backSubject.feeAmount === undefined) {
                            console.log(`Migrating back subject for ${student.studentId}: ${backSubject.name}`);
                            
                            await Student.findOneAndUpdate(
                                { 
                                    studentId: student.studentId,
                                    instituteId: req.user.instituteId,
                                    [`results.${resultIndex}.backSubjects.${backIndex}.code`]: backSubject.code
                                },
                                {
                                    $set: {
                                        [`results.${resultIndex}.backSubjects.${backIndex}.feeAmount`]: 500,
                                        [`results.${resultIndex}.backSubjects.${backIndex}.feePaid`]: backSubject.feePaid || false,
                                        [`results.${resultIndex}.backSubjects.${backIndex}.examFeePaid`]: false,
                                        [`results.${resultIndex}.backSubjects.${backIndex}.isCleared`]: backSubject.isCleared || false,
                                        [`results.${resultIndex}.backSubjects.${backIndex}.status`]: backSubject.feePaid ? 'Fee_Paid' : 'Fee_Pending',
                                        [`results.${resultIndex}.backSubjects.${backIndex}.attempts`]: 0,
                                        [`results.${resultIndex}.backSubjects.${backIndex}.feeAdded`]: true
                                    }
                                }
                            );
                            updated = true;
                        }
                    }
                }
            }
            
            if (updated) {
                console.log(`Updated back subjects for student: ${student.studentId}`);
            }
        }
        
        res.json({
            success: true,
            message: `Back subjects data migration completed for ${students.length} students`,
            studentsProcessed: students.length
        });
        
    } catch (error) {
        console.error('Back subjects migration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during back subjects data migration'
        });
    }
});

// Debug endpoint to check student's pendingBackSubjects structure
app.get('/api/students/:studentId/debug-back-subjects', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });
        
        if (!student) {
            console.log('Student not found');
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        console.log('Student found:', student.name);
        console.log('Fee structure exists:', !!student.feeStructure);
        console.log('Semester fees count:', student.feeStructure?.semesterFees?.length || 0);
        
        const debugInfo = {
            studentId: student.studentId,
            name: student.name,
            hasResults: !!student.results,
            resultsCount: student.results?.length || 0,
            hasFeeStructure: !!student.feeStructure,
            semesterFeesCount: student.feeStructure?.semesterFees?.length || 0,
            semesterFeesDetails: student.feeStructure?.semesterFees?.map((semFee, index) => ({
                semester: index + 1,
                hasPendingBackSubjects: !!semFee.pendingBackSubjects,
                pendingBackSubjectsCount: semFee.pendingBackSubjects?.length || 0,
                pendingBackSubjects: semFee.pendingBackSubjects || []
            })) || [],
            resultsWithBackSubjects: student.results?.map((result, index) => ({
                semester: index + 1,
                hasBackSubjects: !!result.backSubjects,
                backSubjectsCount: result.backSubjects?.length || 0,
                backSubjects: result.backSubjects?.map(back => ({
                    code: back.code,
                    name: back.name,
                    feePaid: back.feePaid,
                    isCleared: back.isCleared
                })) || []
            })) || []
        };
        
        res.json({
            success: true,
            debugInfo
        });
        
    } catch (error) {
        console.error('Debug back subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting debug info'
        });
    }
});

// Get pending back subjects for a student
app.get('/api/students/:studentId/back-subjects/pending', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;
        console.log('=== PENDING BACK SUBJECTS DEBUG ===');
        console.log('Student ID:', studentId);

        // First verify student exists
        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            console.log('Student not found');
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        console.log('Student found:', student.name);

        // Query Results collection for this student's back subjects
        const results = await Result.find({
            studentId: studentId,
            instituteId: req.user.instituteId,
            'backSubjects.0': { $exists: true } // Has at least one back subject
        }).lean();

        console.log(`Found ${results.length} results with back subjects for student`);

        const pendingBackSubjects = [];

        // Process each result to find pending back subjects
        results.forEach(result => {
            console.log(`Processing semester ${result.semester} result:`);
            
            if (result.backSubjects && Array.isArray(result.backSubjects)) {
                result.backSubjects.forEach((backSubject, backIndex) => {
                    console.log(`  Back subject ${backIndex + 1}:`, {
                        code: backSubject.code,
                        name: backSubject.name,
                        feePaid: backSubject.feePaid,
                        isCleared: backSubject.isCleared,
                        status: backSubject.status
                    });

                    // Include back subjects that are not cleared (regardless of fee payment status)
                    if (!backSubject.isCleared) {
                        pendingBackSubjects.push({
                            semester: result.semester,
                            subjectCode: backSubject.code,
                            subjectName: backSubject.name,
                            feeAmount: backSubject.feeAmount || 500,
                            examDate: backSubject.nextExamDate || result.examDate,
                            isCleared: backSubject.isCleared || false,
                            feePaid: backSubject.feePaid || false,
                            status: backSubject.status || 'Fee_Pending',
                            attempts: backSubject.attempts || 0
                        });
                    }
                });
            }
        });
        
        console.log('Total pending back subjects found:', pendingBackSubjects.length);

        res.json({
            success: true,
            pendingBackSubjects: pendingBackSubjects,
            totalPendingAmount: pendingBackSubjects.reduce((sum, sub) => sum + sub.feeAmount, 0)
        });
    } catch (error) {
        console.error('Get pending back subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending back subjects'
        });
    }
});

// Debug endpoint to check back subjects data structure
app.get('/api/debug/back-subjects-data/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Check Result collection
        const results = await Result.find({
            studentId: studentId,
            instituteId: req.user.instituteId
        }).lean();
        
        // Check Student collection  
        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        }).lean();
        
        res.json({
            success: true,
            debug: {
                resultsCount: results.length,
                results: results.map(r => ({
                    semester: r.semester,
                    backSubjectsCount: r.backSubjects?.length || 0,
                    backSubjects: r.backSubjects || []
                })),
                studentResultsCount: student?.results?.length || 0,
                studentResults: student?.results?.map((r, i) => ({
                    semester: i + 1,
                    backSubjectsCount: r?.backSubjects?.length || 0,
                    backSubjects: r?.backSubjects || []
                })) || [],
                feeStructureBackSubjects: student?.feeStructure?.semesterFees?.map((sf, i) => ({
                    semester: i + 1,
                    pendingBackSubjectsCount: sf?.pendingBackSubjects?.length || 0,
                    pendingBackSubjects: sf?.pendingBackSubjects || []
                })) || []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

// Get student fee details with breakdown
app.get('/api/students/:studentId/fee-details', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Calculate total remaining amount properly
        let totalRemaining = 0;
        let totalPaid = 0;
        
        if (student.feeStructure && student.feeStructure.semesterFees) {
            student.feeStructure.semesterFees.forEach(semesterFee => {
                if (semesterFee) {
                    // Course fees calculation
                    const courseFeeRemaining = semesterFee.semesterFee - (semesterFee.paidAmount || 0);
                    totalPaid += (semesterFee.paidAmount || 0);
                    
                    // Back subject fees calculation
                    const pendingBackSubjects = semesterFee.pendingBackSubjects || [];
                    const backSubjectFeesRemaining = pendingBackSubjects
                        .filter(subject => !subject.feePaid)
                        .reduce((sum, subject) => sum + (subject.feeAmount || 500), 0);
                    
                    // Add to total remaining
                    totalRemaining += courseFeeRemaining + backSubjectFeesRemaining;
                }
            });
        }
        
        const feeDetails = {
            studentId: student.studentId,
            studentName: student.name,
            course: student.academicInfo.course,
            currentSemester: student.academicInfo.currentSemester,
            totalCourseFee: student.feeStructure.totalCourseFee,
            totalPaid: totalPaid,
            totalRemaining: totalRemaining,
            semesterBreakdown: []
        };

        // Calculate semester-wise breakdown
        if (student.feeStructure && student.feeStructure.semesterFees && Array.isArray(student.feeStructure.semesterFees)) {
            student.feeStructure.semesterFees.forEach((semesterFee, index) => {
                if (semesterFee) {
                    const semester = index + 1;
                    const courseFeePaid = semesterFee.paidAmount || 0;
                    const courseFeeRemaining = semesterFee.semesterFee - courseFeePaid;
                    
                    // Calculate back subject fees from pendingBackSubjects
                    const pendingBackSubjects = semesterFee.pendingBackSubjects || [];
                    const totalBackSubjectFees = pendingBackSubjects.reduce((sum, sub) => sum + (sub.feeAmount || 500), 0);
                    const paidBackSubjectFees = pendingBackSubjects.reduce((sum, sub) => sum + (sub.feePaid ? (sub.feeAmount || 500) : 0), 0);
                    const remainingBackSubjectFees = totalBackSubjectFees - paidBackSubjectFees;
                    
                    feeDetails.semesterBreakdown.push({
                        semester: semester,
                        courseFee: semesterFee.semesterFee,
                        courseFeePaid: courseFeePaid,
                        courseFeeRemaining: courseFeeRemaining,
                        backSubjectFees: totalBackSubjectFees,
                        backSubjectFeesPaid: paidBackSubjectFees,
                        backSubjectFeesRemaining: remainingBackSubjectFees,
                        totalDue: semesterFee.semesterFee + totalBackSubjectFees,
                        totalPaid: courseFeePaid + paidBackSubjectFees,
                        totalRemaining: courseFeeRemaining + remainingBackSubjectFees,
                        status: semesterFee.status,
                        dueDate: semesterFee.dueDate,
                        lastPaymentDate: semesterFee.lastPaymentDate
                    });
                }
            });
        }

        res.json({
            success: true,
            feeDetails: feeDetails
        });

    } catch (error) {
        console.error('Get fee details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching fee details'
        });
    }
});

// Update back subject status (clear/not clear)
app.put('/api/results/:studentId/back-subjects', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, subjectCode, isCleared } = req.body;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Update the specific back subject status
        const updateQuery = {
            [`results.${semester - 1}.backSubjects.$[elem].isCleared`]: isCleared,
            [`results.${semester - 1}.backSubjects.$[elem].clearedDate`]: isCleared ? new Date() : null
        };

        // Handle fee adjustments for back subject status change
        let feeAdjustment = {};
        
        // Get current student data first to check existing back subject status
        const currentStudent = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });
        
        if (!currentStudent || !currentStudent.results || !currentStudent.results[semester - 1]) {
            return res.status(404).json({
                success: false,
                message: 'Student result not found for the specified semester'
            });
        }
        
        const semesterResult = currentStudent.results[semester - 1];
        const backSubject = semesterResult.backSubjects?.find(sub => sub.code === subjectCode);
        
        if (!backSubject) {
            return res.status(404).json({
                success: false,
                message: 'Back subject not found'
            });
        }
        
        console.log('Current back subject status:', {
            code: subjectCode,
            isCleared: backSubject.isCleared,
            feeAdded: backSubject.feeAdded,
            newStatus: isCleared
        });
        
        // Only update status if the status is actually changing
        if (backSubject.isCleared !== isCleared) {
            console.log(`Back subject status changing from ${backSubject.isCleared} to ${isCleared}`);
            
            // Just update the status - fees are handled separately during payment
            // Back subject fees are exam fees, not penalties
            updateQuery[`results.${semester - 1}.backSubjects.$[elem].examFeePaid`] = isCleared;
            
            // Check if all back subjects for this semester are now cleared
            if (isCleared) {
                const semesterResult = currentStudent.results[semester - 1];
                const allBackSubjectsCleared = semesterResult.backSubjects.every(sub => 
                    sub.code === subjectCode || sub.isCleared
                );
                
                if (allBackSubjectsCleared) {
                    console.log('All back subjects cleared for semester', semester);
                    
                    // Check if this was the current semester or a previous one
                    const currentSem = currentStudent.academicInfo?.currentSemester || 1;
                    
                    if (semester === currentSem) {
                        // Progress to next semester or complete course
                        const maxSemesters = currentStudent.academicInfo?.course === 'PGDCA' ? 4 : 2; // PGDCA = 4 sem, DCA = 2 sem
                        
                        if (currentSem < maxSemesters) {
                            // Move to next semester
                            updateQuery[`academicInfo.currentSemester`] = currentSem + 1;
                            updateQuery[`academicInfo.lastPromotionDate`] = new Date();
                            console.log(`Student promoted to semester ${currentSem + 1}`);
                        } else {
                            // Complete the course
                            updateQuery[`status`] = 'Completed';
                            updateQuery[`academicInfo.completionDate`] = new Date();
                            console.log('Student course completed!');
                        }
                    }
                }
            }
        }

        // Build update operation properly
        let updateOperation = {
            $set: updateQuery
        };

        console.log('Update operation:', JSON.stringify(updateOperation, null, 2));

        const updatedStudent = await Student.findOneAndUpdate(
            { studentId: studentId, instituteId: req.user.instituteId },
            updateOperation,
            { 
                arrayFilters: [{ 'elem.code': subjectCode }],
                new: true 
            }
        );

        if (!updatedStudent) {
            console.error('Failed to update student record for:', studentId, subjectCode);
            return res.status(404).json({
                success: false,
                message: 'Failed to update student record. Please check if the subject code and semester are correct.'
            });
        }

        console.log('Student updated successfully:', {
            studentId,
            subjectCode,
            isCleared,
            newRemainingAmount: updatedStudent.feeStructure?.remainingAmount
        });

        // Also update in Result collection
        const resultUpdate = await Result.findOneAndUpdate(
            { 
                studentId: studentId, 
                semester: semester, 
                instituteId: req.user.instituteId,
                'backSubjects.code': subjectCode
            },
            {
                $set: {
                    [`backSubjects.$.isCleared`]: isCleared,
                    [`backSubjects.$.clearedDate`]: isCleared ? new Date() : null,
                    [`backSubjects.$.feeAdded`]: !isCleared
                }
            }
        );

        if (!resultUpdate) {
            console.warn('Result collection update failed - record may not exist');
        }

        res.json({
            success: true,
            message: `Back subject ${isCleared ? 'cleared' : 'marked as pending'} successfully`,
            data: {
                studentId,
                subjectCode,
                semester,
                isCleared,
                feeAdjustment: feeAdjustment.$inc ? Object.values(feeAdjustment.$inc)[0] : 0
            }
        });
    } catch (error) {
        console.error('Update back subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating back subject status'
        });
    }
});

// Clear back subject with exam details
app.put('/api/students/:studentId/back-subjects/:subjectCode/clear', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId, subjectCode } = req.params;
        const { semester, examDate, marks, remarks } = req.body;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if semester result exists
        if (!student.results || !student.results[semester - 1]) {
            return res.status(404).json({
                success: false,
                message: 'Semester result not found'
            });
        }

        const semesterResult = student.results[semester - 1];
        const backSubject = semesterResult.backSubjects?.find(sub => sub.code === subjectCode);

        if (!backSubject) {
            return res.status(404).json({
                success: false,
                message: 'Back subject not found'
            });
        }

        // Check if back subject fee is paid by checking semester fee structure
        const semesterFee = student.feeStructure?.semesterFees?.[semester - 1];
        if (!semesterFee) {
            return res.status(400).json({
                success: false,
                message: 'Semester fee structure not found'
            });
        }
        
        const backSubjectFeeRequired = 500; // ₹500 per back subject
        const backSubjectFeesPaid = semesterFee.backSubjectFeesPaid || 0;
        const totalBackSubjects = semesterResult.backSubjects.length;
        const totalBackSubjectFeesRequired = totalBackSubjects * backSubjectFeeRequired;
        
        if (backSubjectFeesPaid < totalBackSubjectFeesRequired) {
            return res.status(400).json({
                success: false,
                message: `Back subject fees not fully paid. Required: ₹${totalBackSubjectFeesRequired}, Paid: ₹${backSubjectFeesPaid}`
            });
        }

        // Update back subject with exam details
        const updateQuery = {
            $set: {
                [`results.${semester - 1}.backSubjects.$[elem].isCleared`]: true,
                [`results.${semester - 1}.backSubjects.$[elem].clearedDate`]: new Date(),
                [`results.${semester - 1}.backSubjects.$[elem].examDate`]: examDate || new Date(),
                [`results.${semester - 1}.backSubjects.$[elem].marks`]: marks,
                [`results.${semester - 1}.backSubjects.$[elem].remarks`]: remarks
            }
        };

        // Check if all back subjects for this semester are now cleared
        const allBackSubjectsCleared = semesterResult.backSubjects.every(sub => 
            sub.code === subjectCode || sub.isCleared
        );
        
        if (allBackSubjectsCleared) {
            console.log('All back subjects cleared for semester', semester);
            
            // Check if this was the current semester or a previous one
            const currentSem = student.academicInfo?.currentSemester || 1;
            
            if (semester === currentSem) {
                // Progress to next semester or complete course
                const maxSemesters = student.academicInfo?.course === 'PGDCA' ? 4 : 2;
                
                if (currentSem < maxSemesters) {
                    // Move to next semester
                    updateQuery.$set[`academicInfo.currentSemester`] = currentSem + 1;
                    updateQuery.$set[`academicInfo.lastPromotionDate`] = new Date();
                    
                    // Make next semester fees due
                    const nextSemesterFee = student.feeStructure?.semesterFees?.[currentSem];
                    if (nextSemesterFee) {
                        updateQuery.$set[`feeStructure.semesterFees.${currentSem}.status`] = 'Due';
                        updateQuery.$set[`feeStructure.semesterFees.${currentSem}.dueDate`] = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    }
                    
                    console.log(`Student promoted to semester ${currentSem + 1}`);
                } else {
                    // Complete the course
                    updateQuery.$set[`status`] = 'Completed';
                    updateQuery.$set[`academicInfo.completionDate`] = new Date();
                    console.log('Student course completed!');
                }
            }
        }

        const updatedStudent = await Student.findOneAndUpdate(
            { studentId: studentId, instituteId: req.user.instituteId },
            updateQuery,
            { 
                arrayFilters: [{ 'elem.code': subjectCode }],
                new: true 
            }
        );

        if (!updatedStudent) {
            return res.status(404).json({
                success: false,
                message: 'Failed to update student record'
            });
        }

        res.json({
            success: true,
            message: `Back subject cleared successfully${allBackSubjectsCleared ? ' and student progressed!' : ''}`,
            updatedStudent: updatedStudent,
            allBackSubjectsCleared: allBackSubjectsCleared
        });

    } catch (error) {
        console.error('Clear back subject error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing back subject'
        });
    }
});

// Bulk update back subject results
app.put('/api/students/:studentId/back-subjects/bulk-update', authenticateToken, addInstituteFilter, [
    body('examDate').isISO8601().withMessage('Valid exam date required'),
    body('results').isArray({ min: 1 }).withMessage('Results array required'),
    body('results.*.semester').isInt({ min: 1 }).withMessage('Valid semester required'),
    body('results.*.subjectCode').notEmpty().withMessage('Subject code required'),
    body('results.*.examResult').isIn(['Pass', 'Fail']).withMessage('Valid exam result required'),
    body('results.*.isCleared').isBoolean().withMessage('Clear status required')
], handleValidationErrors, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { examDate, results, remarks } = req.body;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        let updateOperations = [];
        let historyEntries = [];

        for (const result of results) {
            const { semester, subjectCode, subjectName, examResult, newMarks, status, isCleared } = result;

            // Update back subject status
            const updateOp = {
                [`results.${semester - 1}.backSubjects.$[elem].isCleared`]: isCleared,
                [`results.${semester - 1}.backSubjects.$[elem].clearedDate`]: isCleared ? new Date() : null,
                [`results.${semester - 1}.backSubjects.$[elem].examDate`]: examDate,
                [`results.${semester - 1}.backSubjects.$[elem].marks`]: newMarks,
                [`results.${semester - 1}.backSubjects.$[elem].examResult`]: examResult,
                [`results.${semester - 1}.backSubjects.$[elem].lastUpdated`]: new Date()
            };

            updateOperations.push({
                updateOne: {
                    filter: { studentId: studentId, instituteId: req.user.instituteId },
                    update: { $set: updateOp },
                    arrayFilters: [{ 'elem.code': subjectCode }]
                }
            });

            // Create history entry
            historyEntries.push({
                studentId: studentId,
                semester: semester,
                subjectCode: subjectCode,
                subjectName: subjectName,
                action: isCleared ? 'cleared' : 'failed_again',
                examDate: new Date(examDate),
                marks: newMarks,
                status: status,
                remarks: remarks,
                dateRecorded: new Date(),
                instituteId: req.user.instituteId
            });
        }

        // Execute all updates
        if (updateOperations.length > 0) {
            await Student.bulkWrite(updateOperations);
        }

        // Store history entries
        if (historyEntries.length > 0) {
            console.log('Creating BackSubjectHistory entries for bulk update:', historyEntries.length);
            await BackSubjectHistory.insertMany(historyEntries);
            console.log('BackSubjectHistory entries created successfully for bulk update');
        }

        const clearedCount = results.filter(r => r.isCleared).length;
        const failedCount = results.filter(r => !r.isCleared).length;

        res.json({
            success: true,
            message: `Back subject results updated: ${clearedCount} cleared, ${failedCount} still pending`,
            clearedCount,
            failedCount
        });

    } catch (error) {
        console.error('Bulk update back subjects error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating back subject results'
        });
    }
});

// Get back subject history for student
app.get('/api/students/:studentId/back-subjects/history', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;

        const history = await BackSubjectHistory.find({
            studentId: studentId,
            instituteId: req.user.instituteId
        }).sort({ dateRecorded: -1 }).lean();

        res.json({
            success: true,
            history: history
        });

    } catch (error) {
        console.error('Get back subject history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching back subject history'
        });
    }
});

// Delete result
app.delete('/api/results/:id', authenticateToken, addInstituteFilter, [
    param('id').isMongoId().withMessage('Invalid result ID')
], handleValidationErrors, async (req, res) => {
    try {
        const result = await Result.findOne({
            _id: req.params.id,
            instituteId: req.user.instituteId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not found'
            });
        }

        // Remove result from student's results array
        await Student.findOneAndUpdate(
            { studentId: result.studentId, instituteId: req.user.instituteId },
            { 
                $unset: { [`results.${result.semester - 1}`]: 1 }
            }
        );

        // Clean up the array (remove null values)
        await Student.findOneAndUpdate(
            { studentId: result.studentId, instituteId: req.user.instituteId },
            { 
                $pull: { results: null }
            }
        );

        await Result.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Result deleted successfully and student record updated'
        });
    } catch (error) {
        console.error('Delete result error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting result'
        });
    }
});

// ================== DASHBOARD ROUTES ==================

// Enhanced dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { period = 'current_month' } = req.query;
        
        // Date ranges
        let startDate, endDate;
        const now = new Date();
        
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'current_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        // Parallel execution of statistics queries
        const [
            studentStats,
            collectionStats,
            courseStats,
            recentPayments,
            recentResults,
            backSubjectStats
        ] = await Promise.all([
            // Student statistics by course and status
            Student.aggregate([
                { $match: { instituteId: req.user.instituteId } },
                {
                    $group: {
                        _id: {
                            course: '$academicInfo.course',
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                }
            ]),
            
            // Collection statistics
            FeePayment.aggregate([
                {
                    $match: {
                        instituteId: req.user.instituteId,
                        paymentDate: { $gte: startDate, $lte: endDate },
                        status: 'Paid'
                    }
                },
                {
                    $group: {
                        _id: '$feeType',
                        totalAmount: { $sum: '$finalAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            
            // Course-wise student distribution
            Student.aggregate([
                { $match: { instituteId: req.user.instituteId, status: 'Active' } },
                {
                    $group: {
                        _id: '$academicInfo.course',
                        count: { $sum: 1 },
                        totalFees: { $sum: '$feeStructure.courseFee' },
                        totalPaid: { $sum: '$feeStructure.totalPaid' },
                        totalPending: { $sum: '$feeStructure.remainingAmount' }
                    }
                }
            ]),
            
            // Recent payments
            FeePayment.find({ 
                instituteId: req.user.instituteId,
                status: 'Paid'
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('receiptNo studentName finalAmount paymentDate feeType course')
                .lean(),
            
            // Recent results
            Result.find({ 
                instituteId: req.user.instituteId,
                isPublished: true
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('studentName course semester result percentage backSubjects')
                .lean(),
            
            // Back subject statistics
            Student.aggregate([
                { $match: { instituteId: req.user.instituteId } },
                { $unwind: { path: '$results', preserveNullAndEmptyArrays: true } },
                { $unwind: { path: '$results.backSubjects', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: {
                            course: '$academicInfo.course',
                            cleared: '$results.backSubjects.isCleared'
                        },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Process statistics
        const processedStats = {
            students: {
                total: 0,
                byInstitution: {},
                byCourse: {},
                byStatus: {}
            },
            collection: {
                total: 0,
                byFeeType: {},
                todaysCollection: 0
            },
            courses: {},
            backSubjects: {
                total: 0,
                cleared: 0,
                pending: 0
            }
        };

        // Process student stats
        studentStats.forEach(stat => {
            const course = stat._id.course || 'Unknown';
            const status = stat._id.status;
            
            processedStats.students.total += stat.count;
            
            if (!processedStats.students.byCourse[course]) {
                processedStats.students.byCourse[course] = 0;
            }
            processedStats.students.byCourse[course] += stat.count;
            
            if (!processedStats.students.byStatus[status]) {
                processedStats.students.byStatus[status] = 0;
            }
            processedStats.students.byStatus[status] += stat.count;
        });

        // Process collection stats
        collectionStats.forEach(stat => {
            processedStats.collection.total += stat.totalAmount;
            processedStats.collection.byFeeType[stat._id] = {
                amount: stat.totalAmount,
                count: stat.count
            };
        });

        // Calculate today's collection
        const today = new Date().toDateString();
        processedStats.collection.todaysCollection = recentPayments
            .filter(payment => new Date(payment.paymentDate).toDateString() === today)
            .reduce((total, payment) => total + payment.finalAmount, 0);

        // Process course stats
        courseStats.forEach(stat => {
            processedStats.courses[stat._id] = {
                studentCount: stat.count,
                totalFees: stat.totalFees,
                totalPaid: stat.totalPaid,
                totalPending: stat.totalPending,
                collectionPercentage: stat.totalFees > 0 ? ((stat.totalPaid / stat.totalFees) * 100).toFixed(2) : 0
            };
        });

        // Process back subject stats
        backSubjectStats.forEach(stat => {
            const course = stat._id.course || 'Unknown';
            const isCleared = stat._id.cleared;
            
            processedStats.backSubjects.total += stat.count;
            
            if (isCleared) {
                processedStats.backSubjects.cleared += stat.count;
            } else {
                processedStats.backSubjects.pending += stat.count;
            }
        });

        res.json({
            success: true,
            period,
            stats: processedStats,
            recentPayments,
            recentResults,
            insights: [
                {
                    type: 'info',
                    message: `Total ${processedStats.students.total} students enrolled across all courses`
                },
                {
                    type: processedStats.backSubjects.pending > 0 ? 'warning' : 'success',
                    message: processedStats.backSubjects.pending > 0 
                        ? `${processedStats.backSubjects.pending} students have pending back subjects`
                        : 'No pending back subjects!'
                },
                {
                    type: 'success',
                    message: `₹${processedStats.collection.todaysCollection.toLocaleString()} collected today`
                }
            ]
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching dashboard statistics'
        });
    }
});

// ================== RECEIPT GENERATION ==================

// Generate and download receipt
app.get('/api/fees/receipt/:receiptNo', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const payment = await FeePayment.findOne({
            receiptNo: req.params.receiptNo,
            instituteId: req.user.instituteId
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found'
            });
        }

        const admin = await Admin.findById(req.user.id);
        
        // Generate receipt data
        const receiptData = {
            receiptNo: payment.receiptNo,
            date: payment.paymentDate,
            instituteName: admin.instituteName,
            instituteAddress: admin.address,
            student: {
                name: payment.studentName,
                id: payment.studentId,
                course: payment.course
            },
            payment: {
                feeType: payment.feeType,
                amount: payment.amount,
                discount: payment.discount || 0,
                finalAmount: payment.finalAmount,
                paymentMode: payment.paymentMode,
                transactionDetails: payment.transactionDetails
            },
            backSubjects: payment.backSubjects || [],
            remarks: payment.remarks
        };

        res.json({
            success: true,
            receiptData
        });
    } catch (error) {
        console.error('Receipt generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating receipt'
        });
    }
});

// ================== REPORTS ==================

// Fee collection report
app.get('/api/reports/fee-collection', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            course = 'all',
            feeType = 'all',
            format = 'json'
        } = req.query;

        let matchQuery = { instituteId: req.user.instituteId };
        
        if (startDate && endDate) {
            matchQuery.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        if (course !== 'all') {
            matchQuery.course = course;
        }

        if (feeType !== 'all') {
            matchQuery.feeType = feeType;
        }

        const pipeline = [
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        course: '$course',
                        feeType: '$feeType',
                        date: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$paymentDate'
                            }
                        }
                    },
                    totalAmount: { $sum: '$finalAmount' },
                    transactionCount: { $sum: 1 },
                    averageAmount: { $avg: '$finalAmount' }
                }
            },
            { $sort: { '_id.date': 1 } }
        ];

        const results = await FeePayment.aggregate(pipeline);

        // Get summary statistics
        const summary = await FeePayment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalCollection: { $sum: '$finalAmount' },
                    totalTransactions: { $sum: 1 },
                    averageTransaction: { $avg: '$finalAmount' },
                    courseBreakdown: {
                        $push: {
                            course: '$course',
                            amount: '$finalAmount'
                        }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: results,
            summary: summary[0] || {},
            filters: { startDate, endDate, course, feeType }
        });
    } catch (error) {
        console.error('Fee collection report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating fee collection report'
        });
    }
});

// Student performance report
app.get('/api/reports/student-performance', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { course, semester, studentId } = req.query;

        let matchQuery = { instituteId: req.user.instituteId };
        
        if (course) matchQuery.course = course;
        if (semester) matchQuery.semester = parseInt(semester);
        if (studentId) matchQuery.studentId = studentId;

        const results = await Result.find(matchQuery)
            .sort({ course: 1, semester: 1, percentage: -1 })
            .lean();

        // Calculate statistics
        const stats = {
            totalStudents: new Set(results.map(r => r.studentId)).size,
            totalResults: results.length,
            passCount: results.filter(r => r.result === 'Pass').length,
            failCount: results.filter(r => r.result === 'Fail').length,
            averagePercentage: results.reduce((sum, r) => sum + r.percentage, 0) / results.length || 0,
            backSubjectsCount: results.reduce((sum, r) => sum + (r.backSubjects?.length || 0), 0)
        };

        res.json({
            success: true,
            results,
            stats,
            filters: { course, semester, studentId }
        });
    } catch (error) {
        console.error('Student performance report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating student performance report'
        });
    }
});

// Back subjects report
app.get('/api/reports/back-subjects', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { course, cleared, search } = req.query;

        // Build match query for students
        let matchQuery = { instituteId: req.user.instituteId };
        if (course) matchQuery['academicInfo.course'] = course;

        // Add search functionality
        if (search) {
            matchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const pipeline = [
            // Start from Students collection for better data structure
            { 
                $match: matchQuery 
            },
            // No need for $lookup since results are embedded in student document
            {
                $unwind: { path: '$results', preserveNullAndEmptyArrays: false }
            },
            {
                $unwind: { path: '$results.backSubjects', preserveNullAndEmptyArrays: false }
            },
            // Filter by cleared status if specified
            ...(cleared !== undefined ? [{
                $match: {
                    'results.backSubjects.isCleared': cleared === 'true'
                }
            }] : []),
            {
                $group: {
                    _id: {
                        subjectName: '$results.backSubjects.name',
                        subjectCode: '$results.backSubjects.code',
                        course: '$academicInfo.course'
                    },
                    students: {
                        $push: {
                            studentId: '$studentId',
                            studentName: '$name',
                            phone: '$phone',
                            semester: '$results.semester',
                            isCleared: '$results.backSubjects.isCleared',
                            clearedDate: '$results.backSubjects.clearedDate',
                            feeAdded: '$results.backSubjects.feeAdded'
                        }
                    },
                    totalCount: { $sum: 1 },
                    clearedCount: {
                        $sum: { $cond: ['$results.backSubjects.isCleared', 1, 0] }
                    }
                }
            },
            { $sort: { '_id.course': 1, '_id.subjectName': 1 } }
        ];

        console.log('Back subjects pipeline:', JSON.stringify(pipeline, null, 2));
        const results = await Student.aggregate(pipeline);
        
        console.log(`Found ${results.length} back subject groups`);

        res.json({
            success: true,
            data: results,
            totalSubjects: results.length,
            filters: { course, cleared, search }
        });
    } catch (error) {
        console.error('Back subjects report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating back subjects report',
            error: error.message
        });
    }
});

// ================== ERROR HANDLING ==================

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const adminCount = await Admin.countDocuments();
        
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: dbStatus,
                collections: { admins: adminCount }
            },
            uptime: process.uptime(),
            version: '2.0.0 - Coaching Institute Enhanced'
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API documentation
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: 'Enhanced Coaching Institute Management System API',
        version: '2.0.0',
        description: 'Comprehensive coaching management system for PGDCA and DCA courses',
        features: [
            'Multi-tenant architecture',
            'Course-specific fee management (PGDCA: ₹5000, DCA: ₹3000)',
            'Result management with back subject tracking',
            'Automatic back subject fee calculation (₹500 per subject)',
            'Receipt generation',
            'Comprehensive reporting',
            'Student lifecycle management'
        ],
        endpoints: {
            auth: '/api/auth/*',
            students: '/api/students/*',
            courses: '/api/courses/*',
            fees: '/api/fees/*',
            results: '/api/results/*',
            reports: '/api/reports/*',
            dashboard: '/api/dashboard/*'
        }
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err);
    
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message,
            value: e.value
        }));
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }
    
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        return res.status(409).json({
            success: false,
            message: `Duplicate value error`,
            details: `${field} '${value}' already exists`
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Authentication token expired'
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid resource ID format'
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack
        })
    });
});

// ================== COMPREHENSIVE BACK SUBJECT & EXAM MANAGEMENT APIs ==================

// Update back subject exam result (when student clears the back exam)
app.put('/api/students/:studentId/back-subjects/update-result', authenticateToken, addInstituteFilter, [
    body('semester').isInt({ min: 1 }).withMessage('Valid semester required'),
    body('subjectCode').notEmpty().withMessage('Subject code required'),
    body('marks').isInt({ min: 0 }).withMessage('Valid marks required'),
    body('isCleared').isBoolean().withMessage('Clear status required')
], handleValidationErrors, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, subjectCode, marks, isCleared, examDate, remarks } = req.body;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const semesterIndex = semester - 1;
        const semesterFee = student.feeStructure?.semesterFees?.[semesterIndex];
        const backSubjectIndex = semesterFee?.pendingBackSubjects?.findIndex(
            sub => sub.subjectCode === subjectCode
        );

        if (!semesterFee || backSubjectIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Back subject not found'
            });
        }

        const backSubject = semesterFee.pendingBackSubjects[backSubjectIndex];
        
        if (!backSubject.feePaid) {
            return res.status(400).json({
                success: false,
                message: 'Back subject fee must be paid before updating result'
            });
        }

        // Update back subject status in Student collection
        const updateQuery = {
            $set: {
                [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.${backSubjectIndex}.isCleared`]: isCleared,
                [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.${backSubjectIndex}.clearedDate`]: isCleared ? new Date() : null,
                [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.${backSubjectIndex}.attempts`]: backSubject.attempts + 1,
                [`results.${semesterIndex}.backSubjects.$[elem].isCleared`]: isCleared,
                [`results.${semesterIndex}.backSubjects.$[elem].clearedDate`]: isCleared ? new Date() : null,
                [`results.${semesterIndex}.backSubjects.$[elem].marks`]: marks,
                [`results.${semesterIndex}.backSubjects.$[elem].examDate`]: examDate || new Date(),
                [`results.${semesterIndex}.backSubjects.$[elem].status`]: isCleared ? 'Cleared' : 'Failed',
                [`results.${semesterIndex}.backSubjects.$[elem].attempts`]: backSubject.attempts + 1,
                [`results.${semesterIndex}.backSubjects.$[elem].remarks`]: remarks
            }
        };

        await Student.findOneAndUpdate(
            { studentId: studentId, instituteId: req.user.instituteId },
            updateQuery,
            { arrayFilters: [{ 'elem.code': subjectCode }] }
        );

        // Also update the Result collection to keep it in sync
        await Result.findOneAndUpdate(
            { 
                studentId: studentId, 
                semester: semester, 
                instituteId: req.user.instituteId,
                'backSubjects.code': subjectCode
            },
            {
                $set: {
                    'backSubjects.$.isCleared': isCleared,
                    'backSubjects.$.clearedDate': isCleared ? new Date() : null,
                    'backSubjects.$.marks': marks,
                    'backSubjects.$.examDate': examDate || new Date(),
                    'backSubjects.$.status': isCleared ? 'Cleared' : 'Failed',
                    'backSubjects.$.attempts': backSubject.attempts + 1,
                    'backSubjects.$.remarks': remarks
                }
            }
        );

        // Get updated data for verification
        const updatedStudent = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });
        
        const updatedResult = await Result.findOne({
            studentId: studentId,
            semester: semester,
            instituteId: req.user.instituteId
        });

        res.json({
            success: true,
            message: isCleared ? 
                `✅ Back subject ${subjectCode} cleared successfully with ${marks} marks!` :
                `❌ Back subject ${subjectCode} attempt recorded. Student needs to reattempt.`,
            isCleared,
            marks,
            attempts: backSubject.attempts + 1,
            debug: {
                studentUpdated: !!updatedStudent,
                resultUpdated: !!updatedResult,
                studentBackSubject: updatedStudent?.feeStructure?.semesterFees?.[semesterIndex]?.pendingBackSubjects?.find(s => s.subjectCode === subjectCode),
                resultBackSubject: updatedResult?.backSubjects?.find(s => s.code === subjectCode)
            }
        });

    } catch (error) {
        console.error('Update back subject result error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating back subject result'
        });
    }
});

// Debug endpoint to check sync between Student and Result collections
app.get('/api/debug/back-subject-sync/:studentId', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, subjectCode } = req.query;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const result = await Result.findOne({
            studentId: studentId,
            semester: parseInt(semester),
            instituteId: req.user.instituteId
        });

        const syncReport = {
            studentId,
            semester: parseInt(semester),
            subjectCode,
            student: {
                exists: !!student,
                hasFeeStructure: !!student?.feeStructure,
                hasSemesterFees: !!student?.feeStructure?.semesterFees,
                semesterIndex: semester ? parseInt(semester) - 1 : null,
                hasPendingBackSubjects: !!student?.feeStructure?.semesterFees?.[parseInt(semester) - 1]?.pendingBackSubjects,
                pendingBackSubjectsCount: student?.feeStructure?.semesterFees?.[parseInt(semester) - 1]?.pendingBackSubjects?.length || 0,
                backSubject: student?.feeStructure?.semesterFees?.[parseInt(semester) - 1]?.pendingBackSubjects?.find(s => s.subjectCode === subjectCode)
            },
            result: {
                exists: !!result,
                hasBackSubjects: !!result?.backSubjects,
                backSubjectsCount: result?.backSubjects?.length || 0,
                backSubject: result?.backSubjects?.find(s => s.code === subjectCode)
            },
            syncStatus: {
                bothExist: !!(student && result),
                studentHasSubject: !!student?.feeStructure?.semesterFees?.[parseInt(semester) - 1]?.pendingBackSubjects?.find(s => s.subjectCode === subjectCode),
                resultHasSubject: !!result?.backSubjects?.find(s => s.code === subjectCode),
                feePaidMatch: (() => {
                    const studentSubject = student?.feeStructure?.semesterFees?.[parseInt(semester) - 1]?.pendingBackSubjects?.find(s => s.subjectCode === subjectCode);
                    const resultSubject = result?.backSubjects?.find(s => s.code === subjectCode);
                    return studentSubject?.feePaid === resultSubject?.feePaid;
                })(),
                isClearedMatch: (() => {
                    const studentSubject = student?.feeStructure?.semesterFees?.[parseInt(semester) - 1]?.pendingBackSubjects?.find(s => s.subjectCode === subjectCode);
                    const resultSubject = result?.backSubjects?.find(s => s.code === subjectCode);
                    return studentSubject?.isCleared === resultSubject?.isCleared;
                })()
            }
        };

        res.json({
            success: true,
            syncReport
        });

    } catch (error) {
        console.error('Debug sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking sync status'
        });
    }
});

// Manual sync endpoint to fix sync issues between Student and Result collections
app.post('/api/debug/sync-back-subjects/:studentId', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester } = req.body;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const result = await Result.findOne({
            studentId: studentId,
            semester: parseInt(semester),
            instituteId: req.user.instituteId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Result not found for this semester'
            });
        }

        const semesterIndex = parseInt(semester) - 1;
        const studentBackSubjects = student?.feeStructure?.semesterFees?.[semesterIndex]?.pendingBackSubjects || [];
        const resultBackSubjects = result?.backSubjects || [];

        let syncCount = 0;
        const syncReport = [];

        // Sync from Student to Result
        for (const studentBack of studentBackSubjects) {
            const resultBack = resultBackSubjects.find(rb => rb.code === studentBack.subjectCode);
            if (resultBack) {
                // Update Result collection to match Student collection
                await Result.findOneAndUpdate(
                    { 
                        studentId: studentId, 
                        semester: parseInt(semester), 
                        instituteId: req.user.instituteId,
                        'backSubjects.code': studentBack.subjectCode
                    },
                    {
                        $set: {
                            'backSubjects.$.feePaid': studentBack.feePaid || false,
                            'backSubjects.$.isCleared': studentBack.isCleared || false,
                            'backSubjects.$.status': studentBack.status || 'Fee_Pending',
                            'backSubjects.$.feePaymentDate': studentBack.paymentDate,
                            'backSubjects.$.feePaymentReceiptNo': studentBack.feePaymentReceiptNo
                        }
                    }
                );
                syncCount++;
                syncReport.push({
                    subjectCode: studentBack.subjectCode,
                    action: 'Result updated to match Student',
                    studentStatus: studentBack.status,
                    resultStatus: studentBack.status
                });
            }
        }

        // Sync from Result to Student
        for (const resultBack of resultBackSubjects) {
            const studentBack = studentBackSubjects.find(sb => sb.subjectCode === resultBack.code);
            if (studentBack) {
                // Update Student collection to match Result collection
                await Student.findOneAndUpdate(
                    { 
                        studentId: studentId, 
                        instituteId: req.user.instituteId,
                        [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.subjectCode`]: resultBack.code
                    },
                    {
                        $set: {
                            [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$.feePaid`]: resultBack.feePaid || false,
                            [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$.isCleared`]: resultBack.isCleared || false,
                            [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$.status`]: resultBack.status || 'Fee_Pending',
                            [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$.paymentDate`]: resultBack.feePaymentDate,
                            [`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.$.feePaymentReceiptNo`]: resultBack.feePaymentReceiptNo
                        }
                    }
                );
                syncCount++;
                syncReport.push({
                    subjectCode: resultBack.code,
                    action: 'Student updated to match Result',
                    studentStatus: resultBack.status,
                    resultStatus: resultBack.status
                });
            }
        }

        res.json({
            success: true,
            message: `Sync completed. ${syncCount} back subjects synchronized.`,
            syncCount,
            syncReport
        });

    } catch (error) {
        console.error('Manual sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during manual sync'
        });
    }
});

// Get comprehensive student payment status
app.get('/api/students/:studentId/payment-status', authenticateToken, addInstituteFilter, async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const paymentStatus = {
            studentInfo: {
                studentId: student.studentId,
                name: student.name,
                course: student.academicInfo.course,
                currentSemester: student.academicInfo.currentSemester,
                totalSemesters: student.academicInfo.totalSemesters
            },
            feeStructure: {
                totalCourseFee: student.feeStructure.totalCourseFee,
                totalPaid: student.feeStructure.totalPaid || 0,
                totalRemaining: student.feeStructure.remainingAmount || 0
            },
            semesterWiseStatus: [],
            pendingPayments: [],
            totalPendingAmount: 0
        };

        // Process each semester
        if (student.feeStructure && student.feeStructure.semesterFees && Array.isArray(student.feeStructure.semesterFees)) {
            student.feeStructure.semesterFees.forEach((semesterFee, index) => {
                if (semesterFee) {
                    const semester = index + 1;
                const semesterStatus = {
                    semester,
                    courseFee: semesterFee.semesterFee,
                    courseFeePaid: semesterFee.paidAmount || 0,
                    courseFeeRemaining: semesterFee.semesterFee - (semesterFee.paidAmount || 0),
                    backSubjectFees: semesterFee.backSubjectFees || 0,
                    backSubjectFeesPaid: semesterFee.backSubjectExamFeesPaid || 0,
                    status: semesterFee.status,
                    dueDate: semesterFee.dueDate,
                    lastPaymentDate: semesterFee.lastPaymentDate,
                    pendingBackSubjects: [],
                    subjects: semesterFee.subjects || []
                };

                // Course fee pending
                if (semesterStatus.courseFeeRemaining > 0) {
                    paymentStatus.pendingPayments.push({
                        type: 'Course_Fee',
                        semester,
                        description: `Semester ${semester} course fee`,
                        amount: semesterStatus.courseFeeRemaining,
                        dueDate: semesterFee.dueDate,
                        priority: semester <= student.academicInfo.currentSemester ? 'High' : 'Medium'
                    });
                    paymentStatus.totalPendingAmount += semesterStatus.courseFeeRemaining;
                }

                // Back subject fees pending
                if (semesterFee.pendingBackSubjects && Array.isArray(semesterFee.pendingBackSubjects)) {
                    semesterFee.pendingBackSubjects.forEach(backSub => {
                        semesterStatus.pendingBackSubjects.push({
                            subjectCode: backSub.subjectCode,
                            subjectName: backSub.subjectName,
                            feeAmount: backSub.feeAmount,
                            feePaid: backSub.feePaid,
                            paymentDate: backSub.paymentDate,
                            examFeePaid: backSub.examFeePaid,
                            isCleared: backSub.isCleared,
                            attempts: backSub.attempts || 0
                        });

                        if (!backSub.feePaid) {
                            paymentStatus.pendingPayments.push({
                                type: 'Back_Subject_Fee',
                                semester,
                                subjectCode: backSub.subjectCode,
                                subjectName: backSub.subjectName,
                                description: `Back subject fee for ${backSub.subjectName}`,
                                amount: backSub.feeAmount,
                                priority: 'High'
                            });
                            paymentStatus.totalPendingAmount += backSub.feeAmount;
                        }
                    });
                }

                paymentStatus.semesterWiseStatus.push(semesterStatus);
                }
            });
        }

        // Sort pending payments by priority and semester
        paymentStatus.pendingPayments.sort((a, b) => {
            if (a.priority === 'High' && b.priority !== 'High') return -1;
            if (a.priority !== 'High' && b.priority === 'High') return 1;
            return a.semester - b.semester;
        });

        res.json({
            success: true,
            paymentStatus
        });

    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment status'
        });
    }
});

// Process semester fee payment (enhanced)
app.post('/api/students/:studentId/pay-semester-fee', authenticateToken, addInstituteFilter, [
    body('semester').isInt({ min: 1 }).withMessage('Valid semester required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
    body('paymentMode').isIn(['Cash', 'Online', 'UPI', 'Card', 'Cheque', 'NEFT', 'RTGS']).withMessage('Valid payment mode required')
], handleValidationErrors, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, amount, paymentMode, transactionDetails, remarks } = req.body;

        const student = await Student.findOne({
            studentId: studentId,
            instituteId: req.user.instituteId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const semesterIndex = semester - 1;
        const semesterFee = student.feeStructure?.semesterFees?.[semesterIndex];

        if (!semesterFee) {
            return res.status(404).json({
                success: false,
                message: 'Semester fee structure not found'
            });
        }

        // Generate receipt number
        const receiptNo = await generateReceiptNumber(req.user.instituteId);

        // Create payment record
        const paymentData = {
            receiptNo,
            instituteId: req.user.instituteId,
            studentId: studentId,
            studentName: student.name,
            course: student.academicInfo.course,
            amount: amount,
            finalAmount: amount,
            paymentMode,
            transactionDetails: transactionDetails || {},
            feeType: 'Course_Fee',
            semesterInfo: {
                semester,
                course: student.academicInfo.course,
                totalSemesters: student.academicInfo.totalSemesters
            },
            remarks: remarks || `Semester ${semester} fee payment`,
            createdBy: req.user.id
        };

        const payment = new FeePayment(paymentData);
        await payment.save();

        // Update semester fee structure
        let remainingPayment = amount;
        const updates = {};

        // Priority 1: Course fee
        const courseFeeRemaining = semesterFee.semesterFee - (semesterFee.paidAmount || 0);
        if (courseFeeRemaining > 0 && remainingPayment > 0) {
            const coursePayment = Math.min(remainingPayment, courseFeeRemaining);
            updates[`feeStructure.semesterFees.${semesterIndex}.paidAmount`] = 
                (semesterFee.paidAmount || 0) + coursePayment;
            updates[`feeStructure.semesterFees.${semesterIndex}.remainingAmount`] = 
                courseFeeRemaining - coursePayment;
            updates[`feeStructure.semesterFees.${semesterIndex}.lastPaymentDate`] = new Date();
            remainingPayment -= coursePayment;
        }

        // Priority 2: Back subject fees
        if (semesterFee.pendingBackSubjects && remainingPayment > 0) {
            for (let i = 0; i < semesterFee.pendingBackSubjects.length && remainingPayment > 0; i++) {
                const backSub = semesterFee.pendingBackSubjects[i];
                if (!backSub.feePaid && remainingPayment >= backSub.feeAmount) {
                    updates[`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.${i}.feePaid`] = true;
                    updates[`feeStructure.semesterFees.${semesterIndex}.pendingBackSubjects.${i}.paymentDate`] = new Date();
                    remainingPayment -= backSub.feeAmount;
                }
            }
        }

        // Update status
        const totalPaid = (updates[`feeStructure.semesterFees.${semesterIndex}.paidAmount`] || semesterFee.paidAmount || 0);
        const hasPendingBackSubjects = semesterFee.pendingBackSubjects && 
            semesterFee.pendingBackSubjects.some(back => !back.feePaid);
        
        if (totalPaid >= semesterFee.semesterFee && !hasPendingBackSubjects) {
            updates[`feeStructure.semesterFees.${semesterIndex}.status`] = 'Paid';
        } else if (hasPendingBackSubjects) {
            updates[`feeStructure.semesterFees.${semesterIndex}.status`] = 'Back_Pending';
        } else if (totalPaid > 0) {
            updates[`feeStructure.semesterFees.${semesterIndex}.status`] = 'Partial';
        }

        // Update global counters
        updates['feeStructure.totalPaid'] = (student.feeStructure.totalPaid || 0) + amount;
        updates['feeStructure.remainingAmount'] = (student.feeStructure.remainingAmount || 0) - amount;

        await Student.findOneAndUpdate(
            { studentId: studentId, instituteId: req.user.instituteId },
            { $set: updates }
        );

        res.json({
            success: true,
            message: `✅ Payment of ₹${amount} received successfully for Semester ${semester}`,
            payment,
            receiptNo,
            remainingForSemester: updates[`feeStructure.semesterFees.${semesterIndex}.remainingAmount`] || 0,
            semesterStatus: updates[`feeStructure.semesterFees.${semesterIndex}.status`]
        });

    } catch (error) {
        console.error('Semester fee payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing semester fee payment'
        });
    }
});

// 404 handler - must be at the end
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        suggestion: 'Check the API documentation for available endpoints'
    });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n🔄 Received ${signal}. Graceful shutdown...`);
    mongoose.connection.close(() => {
        console.log('📦 MongoDB connection closed.');
        process.exit(0);
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`
🚀 Enhanced Coaching Institute Management System
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
💰 Back Subject Fee: ₹500 per subject
📋 Features: Student Management | Fee Management | Result Management | Reports
🏥 Health Check: http://localhost:${PORT}/health
📖 API Docs: http://localhost:${PORT}/api
⏰ Started at: ${new Date().toISOString()}
    `);
});

server.on('error', (err) => {
    console.error('❌ Server Error:', err);
    process.exit(1);
});

module.exports = app;
