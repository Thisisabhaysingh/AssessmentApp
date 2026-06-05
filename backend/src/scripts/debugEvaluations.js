import { Evaluation, Assessment, User } from '../config/db.js';

const debugEvaluations = async () => {
  try {
    console.log('🔍 Debugging evaluations data...');

    // Check total evaluations
    const totalEvaluations = await Evaluation.count();
    console.log(`📊 Total evaluations in database: ${totalEvaluations}`);

    if (totalEvaluations === 0) {
      console.log('❌ No evaluations found in database');
      return;
    }

    // Get first few evaluations without associations
    const rawEvaluations = await Evaluation.findAll({ limit: 3 });
    console.log('📋 Raw evaluation data:');
    rawEvaluations.forEach((evaluation, index) => {
      console.log(`  ${index + 1}. ID: ${evaluation.id}, Assessment ID: ${evaluation.assessment_id}, Evaluator ID: ${evaluation.evaluator_id}, Role: ${evaluation.evaluator_role}`);
    });

    // Try to get evaluations with associations
    try {
      const evaluationsWithAssociations = await Evaluation.findAll({
        include: [
          {
            model: User,
            as: 'evaluator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Assessment,
            as: 'assessment'
          }
        ],
        limit: 3
      });

      console.log('✅ Evaluations with associations loaded successfully:');
      evaluationsWithAssociations.forEach((evaluation, index) => {
        console.log(`  ${index + 1}. Evaluator: ${evaluation.evaluator?.name || 'N/A'}, Assessment: ${evaluation.assessment?.id || 'N/A'}`);
      });

    } catch (associationError) {
      console.error('❌ Error loading evaluations with associations:', associationError.message);
    }

    // Check if the trainer has assessments
    const trainerAssessments = await Assessment.findAll({ 
      where: { trainer_id: 4 }, // Assuming trainer ID 4 from the logs
      limit: 5
    });

    console.log(`📋 Found ${trainerAssessments.length} assessments for trainer ID 4:`);
    trainerAssessments.forEach((assessment, index) => {
      console.log(`  ${index + 1}. Assessment ID: ${assessment.id}, Status: ${assessment.status}, Course ID: ${assessment.course_id}`);
    });

    // Check evaluations for these assessments
    if (trainerAssessments.length > 0) {
      const assessmentIds = trainerAssessments.map(a => a.id);
      const trainerEvaluations = await Evaluation.findAll({
        where: { assessment_id: assessmentIds },
        include: [
          {
            model: User,
            as: 'evaluator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      console.log(`📊 Found ${trainerEvaluations.length} evaluations for trainer's assessments:`);
      trainerEvaluations.forEach((evaluation, index) => {
        console.log(`  ${index + 1}. Assessment ID: ${evaluation.assessment_id}, Evaluator: ${evaluation.evaluator?.name || 'N/A'}, Role: ${evaluation.evaluator_role}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    process.exit(0);
  }
};

// Run the debug function
debugEvaluations();
