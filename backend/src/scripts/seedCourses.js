import { Course } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const seedCourses = async () => {
  try {
    console.log('🌱 Seeding 10 courses for testing...');

    const courses = [
      {
        name: 'Introduction to JavaScript Programming',
        code: 'JS101',
        level: 'Beginner',
        description: 'Learn the fundamentals of JavaScript programming including variables, functions, and basic concepts.',
        duration: '8 weeks',
        category: 'Programming',
        status: 'active'
      },
      {
        name: 'Advanced React Development',
        code: 'REACT201',
        level: 'Intermediate',
        description: 'Master React hooks, state management, routing, and build production-ready applications.',
        duration: '10 weeks',
        category: 'Frontend Development',
        status: 'active'
      },
      {
        name: 'Node.js Backend Development',
        code: 'NODE301',
        level: 'Intermediate',
        description: 'Build scalable backend applications with Node.js, Express, and database integration.',
        duration: '12 weeks',
        category: 'Backend Development',
        status: 'active'
      },
      {
        name: 'Python for Data Science',
        code: 'PY401',
        level: 'Intermediate',
        description: 'Learn Python programming with focus on data analysis, visualization, and machine learning basics.',
        duration: '14 weeks',
        category: 'Data Science',
        status: 'active'
      },
      {
        name: 'Database Design and SQL',
        code: 'DB201',
        level: 'Intermediate',
        description: 'Master database design principles, SQL queries, and database optimization techniques.',
        duration: '6 weeks',
        category: 'Database',
        status: 'active'
      },
      {
        name: 'Web Design Fundamentals',
        code: 'WD101',
        level: 'Beginner',
        description: 'Learn HTML, CSS, responsive design, and modern web design principles.',
        duration: '8 weeks',
        category: 'Design',
        status: 'active'
      },
      {
        name: 'DevOps and CI/CD Pipeline',
        code: 'DEV501',
        level: 'Advanced',
        description: 'Master DevOps practices, containerization, CI/CD pipelines, and cloud deployment.',
        duration: '10 weeks',
        category: 'DevOps',
        status: 'active'
      },
      {
        name: 'Mobile App Development with React Native',
        code: 'MOBILE301',
        level: 'Intermediate',
        description: 'Build cross-platform mobile applications using React Native for iOS and Android.',
        duration: '12 weeks',
        category: 'Mobile Development',
        status: 'active'
      },
      {
        name: 'Machine Learning Fundamentals',
        code: 'ML401',
        level: 'Advanced',
        description: 'Introduction to machine learning algorithms, model training, and practical applications.',
        duration: '16 weeks',
        category: 'Artificial Intelligence',
        status: 'active'
      },
      {
        name: 'Cybersecurity Essentials',
        code: 'SEC201',
        level: 'Intermediate',
        description: 'Learn network security, ethical hacking, and cybersecurity best practices.',
        duration: '10 weeks',
        category: 'Security',
        status: 'active'
      }
    ];

    // Check if courses already exist
    const existingCourses = await Course.findAll();
    if (existingCourses.length > 0) {
      console.log(`Found ${existingCourses.length} existing courses. Skipping seeding to avoid duplicates.`);
      console.log('Existing courses:');
      existingCourses.forEach(course => {
        console.log(`  - ${course.name} (${course.code})`);
      });
      return;
    }

    // Insert courses
    const createdCourses = await Course.bulkCreate(courses, {
      returning: true
    });

    console.log('✅ Successfully seeded 10 courses:');
    createdCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.name} (${course.code}) - ${course.level} - ${course.duration}`);
    });

    console.log('\n📊 Course Summary:');
    console.log(`- Total Courses: ${createdCourses.length}`);
    console.log(`- Categories: ${[...new Set(courses.map(c => c.category))].join(', ')}`);
    console.log(`- Levels: ${[...new Set(courses.map(c => c.level))].join(', ')}`);

  } catch (error) {
    console.error('❌ Error seeding courses:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seed function
seedCourses();
