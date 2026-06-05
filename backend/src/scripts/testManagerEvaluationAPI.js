import { Evaluation, User, Assessment } from '../config/db.js';

const testManagerEvaluationAPI = async () => {
  try {
    console.log('🎯 Testing manager evaluation API logic...');
    
    // Test the same logic as the getEvaluation controller
    const assessmentId = 18; // Use assessment ID that has evaluation
    const mockManager = { id: 2 }; // Manager Mary's ID
    
    console.log(`🔍 Testing evaluation for assessment ${assessmentId} and manager ${mockManager.id}`);
    
    const evaluation = await Evaluation.findOne({
      where: {
        assessment_id: assessmentId,
        evaluator_role: 'manager',
        evaluator_id: mockManager.id
      }
    });
    
    if (evaluation) {
      console.log('✅ Found evaluation:', evaluation.toJSON());
      console.log('📊 Evaluation data that should be returned to frontend:');
      console.log({
        id: evaluation.id,
        assessment_id: evaluation.assessment_id,
        evaluator_role: evaluation.evaluator_role,
        evaluator_id: evaluation.evaluator_id,
        hasKnowledgeOfSTEM: evaluation.hasKnowledgeOfSTEM,
        abilityToIntegrateSTEM: evaluation.abilityToIntegrateSTEM,
        discussesUpToDateInfo: evaluation.discussesUpToDateInfo,
        provideCourseOutline: evaluation.provideCourseOutline,
        languageFluency: evaluation.languageFluency,
        preparationWithLessonPlan: evaluation.preparationWithLessonPlan,
        totalScore: evaluation.totalScore,
        percentage: evaluation.percentage,
        created_at: evaluation.created_at,
        updated_at: evaluation.updated_at
      });
    } else {
      console.log('❌ No evaluation found');
    }
    
    // Test with an assessment that doesn't have evaluation
    console.log(`\n🔍 Testing evaluation for assessment 1 (no evaluation expected):`);
    
    const noEvaluation = await Evaluation.findOne({
      where: {
        assessment_id: 1,
        evaluator_role: 'manager',
        evaluator_id: mockManager.id
      }
    });
    
    if (noEvaluation) {
      console.log('✅ Found evaluation:', noEvaluation.toJSON());
    } else {
      console.log('❌ No evaluation found (expected)');
    }
    
  } catch (error) {
    console.error('❌ Error testing manager evaluation API:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
testManagerEvaluationAPI();
