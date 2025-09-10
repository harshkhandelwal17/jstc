// MongoDB initialization script
db = db.getSiblingDB('coaching_management');

// Create collections with proper indexes
db.createCollection('admins');
db.createCollection('students');
db.createCollection('feepayments');
db.createCollection('feedues');
db.createCollection('batches');

// Create indexes for better performance
db.admins.createIndex({ email: 1 }, { unique: true });
db.admins.createIndex({ instituteId: 1 }, { unique: true });

db.students.createIndex({ studentId: 1, instituteId: 1 }, { unique: true });
db.students.createIndex({ instituteId: 1 });
db.students.createIndex({ phone: 1 });
db.students.createIndex({ name: 1 });
db.students.createIndex({ status: 1 });

db.feepayments.createIndex({ receiptNo: 1, instituteId: 1 }, { unique: true });
db.feepayments.createIndex({ instituteId: 1, studentId: 1 });
db.feepayments.createIndex({ instituteId: 1, paymentDate: -1 });

db.feedues.createIndex({ month: 1, studentId: 1, instituteId: 1 }, { unique: true });
db.feedues.createIndex({ instituteId: 1, status: 1 });
db.feedues.createIndex({ instituteId: 1, dueDate: 1 });

db.batches.createIndex({ batchCode: 1, instituteId: 1 }, { unique: true });
db.batches.createIndex({ instituteId: 1, status: 1 });
db.batches.createIndex({ instituteId: 1, class: 1 });

print('Database initialized successfully!');
print('Created collections: admins, students, feepayments, feedues, batches');
print('Created indexes for better performance');