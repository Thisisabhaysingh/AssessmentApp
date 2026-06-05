import { Assessment, User, Evaluation } from '../config/db.js';

const addTestEvaluations = async () => {
  try {
    console.log('🌱 Adding test evaluations for trainer dashboard testing...');

    // Get trainers and managers
    const trainers = await User.findAll({ where: { role: 'trainer' } });
    const managers = await User.findAll({ where: { role: 'manager' } });
    const schoolOpsManagers = await User.findAll({ where: { role: 'school_ops_manager' } });

    if (trainers.length === 0) {
      console.log('❌ No trainers found in database');
      return;
    }

    if (managers.length === 0) {
      console.log('❌ No managers found in database');
      return;
    }

    if (schoolOpsManagers.length === 0) {
      console.log('❌ No school operations managers found in database');
      return;
    }

    // Get assessments for trainers
    const assessments = await Assessment.findAll({ 
      where: { trainer_id: trainers[0].id },
      limit: 5 // Only add evaluations for first 5 assessments
    });

    if (assessments.length === 0) {
      console.log('❌ No assessments found for trainer');
      return;
    }

    console.log(`Found ${assessments.length} assessments for trainer ${trainers[0].name}`);

    // Check if evaluations already exist
    const existingEvaluations = await Evaluation.findAll({
      where: { assessment_id: assessments.map(a => a.id) }
    });

    if (existingEvaluations.length > 0) {
      console.log(`Found ${existingEvaluations.length} existing evaluations, skipping...`);
      return;
    }

    // Create test evaluations
    const evaluations = [];
    
    for (const assessment of assessments) {
      // Add School Ops Manager evaluation
      evaluations.push({
        assessment_id: assessment.id,
        evaluator_id: schoolOpsManagers[0].id,
        evaluator_role: 'school_ops_manager',
        evaluation_parameters: {
          technical_knowledge: Math.floor(Math.random() * 10) + 15, // 15-25
          communication_skills: Math.floor(Math.random() * 10) + 15, // 15-25
          time_management: Math.floor(Math.random() * 10) + 15, // 15-25
          problem_solving: Math.floor(Math.random() * 10) + 15, // 15-25
          leadership: Math.floor(Math.random() * 10) + 15, // 15-25
        },
        comments: 'Good technical skills and communication. Areas for improvement in time management.',
        status: 'completed'
      });

      // Add Manager evaluation
      evaluations.push({
        assessment_id: assessment.id,
        evaluator_id: managers[0].id,
        evaluator_role: 'manager',
        evaluation_parameters: {
          technical_knowledge: Math.floor(Math.random() * 10) + 15, // 15-25
          communication_skills: Math.floor(Math.random() * 10) + 15, // 15-25
          time_management: Math.floor(Math.random() * 10) + 15, // 15-25
          problem_solving: Math.floor(Math.random() * 10) + 15, // 15-25
          leadership: Math.floor(Math.random() * 10) + 15, // 15-25
        },
        comments: 'Demonstrates strong leadership qualities. Technical knowledge is solid.',
        status: 'completed'
      });
    }

    // Insert evaluations
    const createdEvaluations = await Evaluation.bulkCreate(evaluations, {
      returning: true
    });

    console.log(`✅ Successfully created ${createdEvaluations.length} test evaluations:`);
    
    // Calculate scores for each assessment
    for (const assessment of assessments) {
      const assessmentEvaluations = createdEvaluations.filter(e => e.assessment_id === assessment.id);
      
      const schoolOpsEval = assessmentEvaluations.find(e => e.evaluator_role === 'school_ops_manager');
      const managerEval = assessmentEvaluations.find(e => e.evaluator_role === 'manager');
      
      const schoolOpsScore = schoolOpsEval ? 
        Object.values(schoolOpsEval.evaluation_parameters).reduce((sum, val) => sum + val, 0) : 0;
      const managerScore = managerEval ? 
        Object.values(managerEval.evaluation_parameters).reduce((sum, val) => sum + val, 0) : 0;
      
      const combinedScore = schoolOpsScore + managerScore;
      const percentage = Math.round((combinedScore / 60) * 100); // Assuming 60 total marks
      
      console.log(`📊 Assessment ${assessment.id}: School Ops: ${schoolOpsScore}, Manager: ${managerScore}, Combined: ${combinedScore} (${percentage}%)`);
    }

    console.log('\n🎉 Test evaluations added successfully!');
    console.log('Trainer dashboard should now show meaningful data with evaluations.');

  } catch (error) {
    console.error('❌ Error adding test evaluations:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
addTestEvaluations();
