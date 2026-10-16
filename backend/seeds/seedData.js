require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

const seedDatabase = async (closeOnComplete = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_management_system';
      console.log(`[Seed] Connecting to MongoDB: ${uri}`);
      await mongoose.connect(uri);
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      Member.deleteMany({}),
      Transaction.deleteMany({})
    ]);

    console.log('[Seed] Seeding Users...');
    // Create Users (will trigger bcrypt hashing via pre-save)
    const adminUser = await User.create({
      name: 'Dr. Eleanor Vance',
      email: 'admin@library.com',
      password: 'admin123',
      role: 'admin',
      department: 'Library Administration',
      phone: '+1 (555) 019-2834',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    });

    const librarianUser = await User.create({
      name: 'Robert Davis',
      email: 'librarian@library.com',
      password: 'lib123',
      role: 'librarian',
      department: 'Circulation & Cataloging',
      phone: '+1 (555) 018-9921',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    });

    const studentUser1 = await User.create({
      name: 'Alex Rivera',
      email: 'student@library.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU-2024-001',
      department: 'Computer Science',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
    });

    const studentUser2 = await User.create({
      name: 'Sarah Chen',
      email: 'sarah@library.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU-2024-002',
      department: 'Data Science',
      phone: '+1 (555) 345-6789',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    });

    const studentUser3 = await User.create({
      name: 'Michael Adams',
      email: 'michael@library.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU-2024-003',
      department: 'Electrical Engineering',
      phone: '+1 (555) 456-7890',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    });

    console.log('[Seed] Seeding Members...');
    const member1 = await Member.create({
      studentId: 'STU-2024-001',
      name: 'Alex Rivera',
      email: 'student@library.com',
      department: 'Computer Science',
      phone: '+1 (555) 234-5678',
      status: 'active',
      user: studentUser1._id
    });

    const member2 = await Member.create({
      studentId: 'STU-2024-002',
      name: 'Sarah Chen',
      email: 'sarah@library.com',
      department: 'Data Science',
      phone: '+1 (555) 345-6789',
      status: 'active',
      user: studentUser2._id
    });

    const member3 = await Member.create({
      studentId: 'STU-2024-003',
      name: 'Michael Adams',
      email: 'michael@library.com',
      department: 'Electrical Engineering',
      phone: '+1 (555) 456-7890',
      status: 'active',
      user: studentUser3._id
    });

    const member4 = await Member.create({
      studentId: 'STU-2024-004',
      name: 'Emily Watson',
      email: 'emily.watson@university.edu',
      department: 'Mechanical Engineering',
      phone: '+1 (555) 567-8901',
      status: 'active'
    });

    const member5 = await Member.create({
      studentId: 'STU-2024-005',
      name: 'David Kim',
      email: 'david.kim@university.edu',
      department: 'Business Administration',
      phone: '+1 (555) 678-9012',
      status: 'active'
    });

    const member6 = await Member.create({
      studentId: 'STU-2024-006',
      name: 'Priya Sharma',
      email: 'priya.sharma@university.edu',
      department: 'Information Technology',
      phone: '+1 (555) 789-0123',
      status: 'active'
    });

    const member7 = await Member.create({
      studentId: 'STU-2024-007',
      name: 'James Wilson',
      email: 'james.wilson@university.edu',
      department: 'Physics',
      phone: '+1 (555) 890-1234',
      status: 'inactive'
    });

    console.log('[Seed] Seeding Books...');
    const booksData = [
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        isbn: '978-0132350884',
        author: 'Robert C. Martin',
        category: 'Computer Science',
        publisher: 'Prentice Hall',
        publicationYear: 2008,
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
        coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=800',
        totalCopies: 5,
        availableCopies: 3,
        location: 'CS Wing - Shelf 2A'
      },
      {
        title: 'Introduction to Algorithms, 4th Edition',
        isbn: '978-0262046305',
        author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
        category: 'Computer Science',
        publisher: 'MIT Press',
        publicationYear: 2022,
        description: 'A comprehensive update of the leading algorithms text, with new material on matchings in bipartite graphs, online algorithms, and machine learning.',
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        totalCopies: 6,
        availableCopies: 4,
        location: 'CS Wing - Shelf 1B'
      },
      {
        title: 'Artificial Intelligence: A Modern Approach, 4th Edition',
        isbn: '978-0134610993',
        author: 'Stuart Russell, Peter Norvig',
        category: 'Artificial Intelligence',
        publisher: 'Pearson',
        publicationYear: 2020,
        description: 'The authoritative, most comprehensive up-to-date introduction to the theory and practice of artificial intelligence.',
        coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800',
        totalCopies: 4,
        availableCopies: 2,
        location: 'AI Lab Section - Shelf 3'
      },
      {
        title: 'Designing Data-Intensive Applications',
        isbn: '978-1449373320',
        author: 'Martin Kleppmann',
        category: 'Software Architecture',
        publisher: 'O\'Reilly Media',
        publicationYear: 2017,
        description: 'The definitive guide to the architecture of distributed systems, storage engines, and stream processing.',
        coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
        totalCopies: 4,
        availableCopies: 3,
        location: 'CS Wing - Shelf 4C'
      },
      {
        title: 'Database System Concepts, 7th Edition',
        isbn: '978-0078022159',
        author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
        category: 'Database Systems',
        publisher: 'McGraw-Hill',
        publicationYear: 2019,
        description: 'Comprehensive presentation of the fundamental concepts of database management and query processing.',
        coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
        totalCopies: 5,
        availableCopies: 4,
        location: 'Database Wing - Shelf 1A'
      },
      {
        title: 'Modern Operating Systems, 5th Edition',
        isbn: '978-0133591620',
        author: 'Andrew S. Tanenbaum, Herbert Bos',
        category: 'Computer Science',
        publisher: 'Pearson',
        publicationYear: 2021,
        description: 'Widely praised for its clear and entertaining coverage of processes, memory management, file systems, and virtualization.',
        coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
        totalCopies: 4,
        availableCopies: 3,
        location: 'CS Wing - Shelf 2C'
      },
      {
        title: 'Computer Networking: A Top-Down Approach',
        isbn: '978-0136681557',
        author: 'James Kurose, Keith Ross',
        category: 'Networking',
        publisher: 'Pearson',
        publicationYear: 2020,
        description: 'Focuses on the Internet and fundamental networking protocols through a top-down application layer first pedagogical approach.',
        coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800',
        totalCopies: 5,
        availableCopies: 4,
        location: 'Networking Wing - Shelf 5B'
      },
      {
        title: 'Deep Learning',
        isbn: '978-0262035613',
        author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
        category: 'Artificial Intelligence',
        publisher: 'MIT Press',
        publicationYear: 2016,
        description: 'An introduction to a broad range of topics in deep learning, covering mathematical foundations, deep networks, and research perspectives.',
        coverImage: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800',
        totalCopies: 3,
        availableCopies: 2,
        location: 'AI Lab Section - Shelf 4'
      },
      {
        title: 'University Physics with Modern Physics',
        isbn: '978-0135159552',
        author: 'Hugh D. Young, Roger A. Freedman',
        category: 'Physics',
        publisher: 'Pearson',
        publicationYear: 2019,
        description: 'Known for its clear calculus-based physics explanations, worked examples, and problem-solving strategies.',
        coverImage: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=80&w=800',
        totalCopies: 4,
        availableCopies: 4,
        location: 'Science Library - Shelf 7A'
      },
      {
        title: 'Linear Algebra and Its Applications',
        isbn: '978-0321982384',
        author: 'David C. Lay, Steven R. Lay, Judi J. McDonald',
        category: 'Mathematics',
        publisher: 'Pearson',
        publicationYear: 2020,
        description: 'A modern introduction to linear algebra with computational methods and geometry intuition.',
        coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800',
        totalCopies: 5,
        availableCopies: 5,
        location: 'Math Section - Shelf 1D'
      },
      {
        title: 'Principles of Economics, 9th Edition',
        isbn: '978-0357038314',
        author: 'N. Gregory Mankiw',
        category: 'Business & Economics',
        publisher: 'Cengage Learning',
        publicationYear: 2020,
        description: 'The most popular economics textbook worldwide, emphasizing economic principles applied to real-world policy and markets.',
        coverImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800',
        totalCopies: 3,
        availableCopies: 2,
        location: 'Business Wing - Shelf 3C'
      },
      {
        title: 'The Pragmatic Programmer: Your Journey to Mastery',
        isbn: '978-0135957059',
        author: 'David Thomas, Andrew Hunt',
        category: 'Computer Science',
        publisher: 'Addison-Wesley',
        publicationYear: 2019,
        description: 'A timeless classic examining the core of modern software craftsmanship, career growth, and architectural responsibility.',
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
        totalCopies: 4,
        availableCopies: 3,
        location: 'CS Wing - Shelf 1A'
      }
    ];

    const createdBooks = await Book.insertMany(booksData);

    console.log('[Seed] Seeding Transactions...');
    const now = new Date();

    // 1. Returned transaction (completed on time)
    const pastIssueDate1 = new Date();
    pastIssueDate1.setDate(now.getDate() - 30);
    const pastDueDate1 = new Date();
    pastDueDate1.setDate(now.getDate() - 16);
    const pastReturnDate1 = new Date();
    pastReturnDate1.setDate(now.getDate() - 18);

    await Transaction.create({
      book: createdBooks[0]._id,
      member: member1._id,
      issuedBy: librarianUser._id,
      issueDate: pastIssueDate1,
      dueDate: pastDueDate1,
      returnDate: pastReturnDate1,
      status: 'returned',
      fineAmount: 0,
      remarks: 'Returned in pristine condition.'
    });

    // 2. Returned transaction (returned with fine)
    const pastIssueDate2 = new Date();
    pastIssueDate2.setDate(now.getDate() - 40);
    const pastDueDate2 = new Date();
    pastDueDate2.setDate(now.getDate() - 26);
    const pastReturnDate2 = new Date();
    pastReturnDate2.setDate(now.getDate() - 22); // 4 days late

    await Transaction.create({
      book: createdBooks[1]._id,
      member: member2._id,
      issuedBy: librarianUser._id,
      issueDate: pastIssueDate2,
      dueDate: pastDueDate2,
      returnDate: pastReturnDate2,
      status: 'returned',
      fineAmount: 4.0,
      remarks: 'Returned 4 days late. Fine of $4 collected.'
    });

    // 3. Active issued transaction for Alex Rivera (due in 7 days)
    const activeIssueDate1 = new Date();
    activeIssueDate1.setDate(now.getDate() - 7);
    const activeDueDate1 = new Date();
    activeDueDate1.setDate(now.getDate() + 7);

    await Transaction.create({
      book: createdBooks[0]._id, // Clean Code
      member: member1._id,
      issuedBy: librarianUser._id,
      issueDate: activeIssueDate1,
      dueDate: activeDueDate1,
      status: 'issued',
      remarks: 'Standard 14-day student checkout.'
    });

    // 4. Active issued transaction for Sarah Chen (due in 10 days)
    const activeIssueDate2 = new Date();
    activeIssueDate2.setDate(now.getDate() - 4);
    const activeDueDate2 = new Date();
    activeDueDate2.setDate(now.getDate() + 10);

    await Transaction.create({
      book: createdBooks[2]._id, // AI Modern Approach
      member: member2._id,
      issuedBy: librarianUser._id,
      issueDate: activeIssueDate2,
      dueDate: activeDueDate2,
      status: 'issued',
      remarks: 'Research project checkout.'
    });

    // 5. Active issued transaction for Michael Adams (due in 5 days)
    const activeIssueDate3 = new Date();
    activeIssueDate3.setDate(now.getDate() - 9);
    const activeDueDate3 = new Date();
    activeDueDate3.setDate(now.getDate() + 5);

    await Transaction.create({
      book: createdBooks[3]._id, // Designing Data-Intensive Apps
      member: member3._id,
      issuedBy: librarianUser._id,
      issueDate: activeIssueDate3,
      dueDate: activeDueDate3,
      status: 'issued',
      remarks: 'Coursework reference.'
    });

    // 6. Overdue transaction for Alex Rivera (issued 24 days ago, due 10 days ago!)
    const overdueIssueDate1 = new Date();
    overdueIssueDate1.setDate(now.getDate() - 24);
    const overdueDueDate1 = new Date();
    overdueDueDate1.setDate(now.getDate() - 10);

    await Transaction.create({
      book: createdBooks[1]._id, // Algorithms
      member: member1._id,
      issuedBy: librarianUser._id,
      issueDate: overdueIssueDate1,
      dueDate: overdueDueDate1,
      status: 'overdue',
      fineAmount: 10.0,
      remarks: 'Overdue reminder notice sent via email.'
    });

    // 7. Overdue transaction for Emily Watson (issued 20 days ago, due 6 days ago!)
    const overdueIssueDate2 = new Date();
    overdueIssueDate2.setDate(now.getDate() - 20);
    const overdueDueDate2 = new Date();
    overdueDueDate2.setDate(now.getDate() - 6);

    await Transaction.create({
      book: createdBooks[2]._id, // AI Modern Approach (another copy)
      member: member4._id,
      issuedBy: librarianUser._id,
      issueDate: overdueIssueDate2,
      dueDate: overdueDueDate2,
      status: 'overdue',
      fineAmount: 6.0,
      remarks: 'First warning notification issued.'
    });

    // 8. Active issued transaction for David Kim
    const activeIssueDate4 = new Date();
    activeIssueDate4.setDate(now.getDate() - 3);
    const activeDueDate4 = new Date();
    activeDueDate4.setDate(now.getDate() + 11);

    await Transaction.create({
      book: createdBooks[10]._id, // Economics
      member: member5._id,
      issuedBy: adminUser._id,
      issueDate: activeIssueDate4,
      dueDate: activeDueDate4,
      status: 'issued',
      remarks: 'Business studies thesis work.'
    });

    // 9. Active issued transaction for Michael Adams
    const activeIssueDate5 = new Date();
    activeIssueDate5.setDate(now.getDate() - 2);
    const activeDueDate5 = new Date();
    activeDueDate5.setDate(now.getDate() + 12);

    await Transaction.create({
      book: createdBooks[5]._id, // Operating Systems
      member: member3._id,
      issuedBy: librarianUser._id,
      issueDate: activeIssueDate5,
      dueDate: activeDueDate5,
      status: 'issued',
      remarks: 'OS Lab assignments.'
    });

    // 10. Active issued transaction for Alex Rivera
    const activeIssueDate6 = new Date();
    activeIssueDate6.setDate(now.getDate() - 1);
    const activeDueDate6 = new Date();
    activeDueDate6.setDate(now.getDate() + 13);

    await Transaction.create({
      book: createdBooks[11]._id, // Pragmatic Programmer
      member: member1._id,
      issuedBy: librarianUser._id,
      issueDate: activeIssueDate6,
      dueDate: activeDueDate6,
      status: 'issued',
      remarks: 'Self study.'
    });

    console.log('[Seed] Data successfully seeded!');
    console.log('--------------------------------------------------');
    console.log('Sample Accounts:');
    console.log('1. Admin:     admin@library.com     / admin123');
    console.log('2. Librarian: librarian@library.com / lib123');
    console.log('3. Student:   student@library.com   / student123 (Alex Rivera)');
    console.log('4. Student:   sarah@library.com     / student123 (Sarah Chen)');
    console.log('--------------------------------------------------');

    if (closeOnComplete) {
      await mongoose.connection.close();
      process.exit(0);
    }
    return true;
  } catch (err) {
    console.error('[Seed Error]:', err);
    if (closeOnComplete) {
      process.exit(1);
    }
    throw err;
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = seedDatabase;
