import { Evaluation, User, Assessment, Course } from '../config/db.js';

const testManagerEvaluations = async () => {
  try {
    console.log('🎯 Testing manager evaluations...');
    
    // Get all manager evaluations
    const managerEvaluations = await Evaluation.findAll({
      where: { evaluator_role: 'manager' },
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Assessment,
          as: 'assessment',
          attributes: ['id', 'scheduled_date', 'status'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    console.log(`📊 Found ${managerEvaluations.length} manager evaluations:`);
    
    managerEvaluations.forEach((evaluation, index) => {
      console.log(`\n${index + 1}. Evaluation ID: ${evaluation.id}`);
      console.log(`   Assessment ID: ${evaluation.assessment_id}`);
      console.log(`   Evaluator: ${evaluation.evaluator?.name} (${evaluation.evaluator_id})`);
      console.log(`   Course: ${evaluation.assessment?.course?.name}`);
      console.log(`   Scheduled: ${evaluation.assessment?.scheduled_date}`);
      console.log(`   Status: ${evaluation.assessment?.status}`);
      console.log(`   Scores:`);
      console.log(`     hasKnowledgeOfSTEM: ${evaluation.hasKnowledgeOfSTEM}`);
      console.log(`     abilityToIntegrateSTEM: ${evaluation.abilityToIntegrateSTEM}`);
      console.log(`     discussesUpToDateInfo: ${evaluation.discussesUpToDateInfo}`);
      console.log(`     provideCourseOutline: ${evaluation.provideCourseOutline}`);
      console.log(`     languageFluency: ${evaluation.languageFluency}`);
      console.log(`     preparationWithLessonPlan: ${evaluation.preparationWithLessonPlan}`);
      console.log(`   Total Score: ${evaluation.totalScore}`);
      console.log(`   Percentage: ${evaluation.percentage}%`);
    });
    
    // Test a specific assessment
    const testAssessmentId = 1; // Change this to test a specific assessment
    console.log(`\n🔍 Testing evaluation for assessment ${testAssessmentId}:`);
    
    const specificEvaluation = await Evaluation.findOne({
      where: {
        assessment_id: testAssessmentId,
        evaluator_role: 'manager'
      },
      include: [
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (specificEvaluation) {
      console.log('✅ Found evaluation:', specificEvaluation.toJSON());
    } else {
      console.log('❌ No evaluation found for this assessment');
    }
    
  } catch (error) {
    console.error('❌ Error testing manager evaluations:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
testManagerEvaluations();
