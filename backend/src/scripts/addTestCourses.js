import { Course } from '../config/db.js';

const addTestCourses = async () => {
  try {
    console.log('🌱 Adding test courses for trainer level system...');

    // Check existing courses
    const existingCourses = await Course.findAll({
      attributes: ['id', 'name', 'code']
    });
    
    const existingCodes = existingCourses.map(c => c.code);
    console.log(`Found ${existingCourses.length} existing courses with codes: ${existingCodes.join(', ')}`);

    // Define courses to add (excluding existing ones)
    const coursesToAdd = [
      {
        name: 'Introduction to JavaScript Programming',
        code: 'JS101',
        level: 'L1',
        description: 'Learn the fundamentals of JavaScript programming including variables, functions, and basic concepts.',
        duration: '8 weeks',
        category: 'Programming',
        status: 'active'
      },
      {
        name: 'Advanced React Development',
        code: 'REACT201',
        level: 'L2',
        description: 'Master React hooks, state management, routing, and build production-ready applications.',
        duration: '10 weeks',
        category: 'Frontend Development',
        status: 'active'
      },
      {
        name: 'Node.js Backend Development',
        code: 'NODE301',
        level: 'L2',
        description: 'Build scalable backend applications with Node.js, Express, and database integration.',
        duration: '12 weeks',
        category: 'Backend Development',
        status: 'active'
      },
      {
        name: 'Python for Data Science',
        code: 'PY401',
        level: 'L2',
        description: 'Learn Python programming with focus on data analysis, visualization, and machine learning basics.',
        duration: '14 weeks',
        category: 'Data Science',
        status: 'active'
      },
      {
        name: 'Database Design and SQL',
        code: 'DB201',
        level: 'L2',
        description: 'Master database design principles, SQL queries, and database optimization techniques.',
        duration: '6 weeks',
        category: 'Database',
        status: 'active'
      },
      {
        name: 'Web Design Fundamentals',
        code: 'WD101',
        level: 'L1',
        description: 'Learn HTML, CSS, responsive design, and modern web design principles.',
        duration: '8 weeks',
        category: 'Design',
        status: 'active'
      },
      {
        name: 'DevOps and CI/CD Pipeline',
        code: 'DEV501',
        level: 'L3',
        description: 'Master DevOps practices, containerization, CI/CD pipelines, and cloud deployment.',
        duration: '10 weeks',
        category: 'DevOps',
        status: 'active'
      },
      {
        name: 'Mobile App Development with React Native',
        code: 'MOBILE301',
        level: 'L2',
        description: 'Build cross-platform mobile applications using React Native for iOS and Android.',
        duration: '12 weeks',
        category: 'Mobile Development',
        status: 'active'
      },
      {
        name: 'Machine Learning Fundamentals',
        code: 'ML401',
        level: 'L3',
        description: 'Introduction to machine learning algorithms, model training, and practical applications.',
        duration: '16 weeks',
        category: 'Artificial Intelligence',
        status: 'active'
      },
      {
        name: 'Cybersecurity Essentials',
        code: 'SEC201',
        level: 'L2',
        description: 'Learn network security, ethical hacking, and cybersecurity best practices.',
        duration: '10 weeks',
        category: 'Security',
        status: 'active'
      }
    ];

    // Filter out courses that already exist
    const newCourses = coursesToAdd.filter(course => !existingCodes.includes(course.code));

    if (newCourses.length === 0) {
      console.log('✅ All test courses already exist in database.');
      return;
    }

    // Insert new courses
    const createdCourses = await Course.bulkCreate(newCourses, {
      returning: true
    });

    console.log(`✅ Successfully added ${createdCourses.length} new courses:`);
    createdCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.name} (${course.code}) - ${course.level} - ${course.duration}`);
    });

    console.log('\n📊 Updated Course Summary:');
    const allCourses = await Course.findAll();
    console.log(`- Total Courses: ${allCourses.length}`);
    console.log(`- Categories: ${[...new Set(allCourses.map(c => c.category))].join(', ')}`);
    console.log(`- Levels: ${[...new Set(allCourses.map(c => c.level))].join(', ')}`);

  } catch (error) {
    console.error('❌ Error adding test courses:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
addTestCourses();
