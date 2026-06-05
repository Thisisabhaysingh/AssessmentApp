import TrainerLevelService from '../services/trainerLevelService.js';

// Test the new trainer level logic
const testNewTrainerLevels = async () => {
  console.log('🎯 Testing new trainer level criteria...\n');
  
  // Test case 1: L1 qualification
  console.log('📊 Test Case 1: L1 Qualification');
  console.log('Requirements: At least 10 assessments passed AND any 10 assessments ≥ 70%');
  
  // Mock assessments with scores
  const mockAssessmentsL1 = [
    { assessmentId: 1, percentage: 75, scheduledDate: '2024-01-01' },
    { assessmentId: 2, percentage: 80, scheduledDate: '2024-01-02' },
    { assessmentId: 3, percentage: 72, scheduledDate: '2024-01-03' },
    { assessmentId: 4, percentage: 78, scheduledDate: '2024-01-04' },
    { assessmentId: 5, percentage: 85, scheduledDate: '2024-01-05' },
    { assessmentId: 6, percentage: 71, scheduledDate: '2024-01-06' },
    { assessmentId: 7, percentage: 90, scheduledDate: '2024-01-07' },
    { assessmentId: 8, percentage: 73, scheduledDate: '2024-01-08' },
    { assessmentId: 9, percentage: 76, scheduledDate: '2024-01-09' },
    { assessmentId: 10, percentage: 79, scheduledDate: '2024-01-10' },
    { assessmentId: 11, percentage: 68, scheduledDate: '2024-01-11' }, // Below 70%
    { assessmentId: 12, percentage: 69, scheduledDate: '2024-01-12' }, // Below 70%
  ];
  
  const l1Results = await TrainerLevelService.checkLevelQualifications(1, mockAssessmentsL1);
  console.log('✅ L1 Qualified:', l1Results.L1.qualified);
  console.log('📈 Passed Assessments (≥70%):', l1Results.L1.totalPassedAssessments, '/', l1Results.L1.requiredTotalAssessments);
  console.log('🎯 Qualifying Assessments (≥70%):', l1Results.L1.qualifyingAssessments.length, '/', l1Results.L1.requiredQualifyingAssessments);
  console.log('');
  
  // Test case 2: L2 qualification
  console.log('📊 Test Case 2: L2 Qualification');
  console.log('Requirements: At least 20 assessments passed AND any 10 assessments ≥ 85% AND must be L1 first');
  
  const mockAssessmentsL2 = [
    ...mockAssessmentsL1,
    { assessmentId: 13, percentage: 87, scheduledDate: '2024-01-13' },
    { assessmentId: 14, percentage: 88, scheduledDate: '2024-01-14' },
    { assessmentId: 15, percentage: 86, scheduledDate: '2024-01-15' },
    { assessmentId: 16, percentage: 90, scheduledDate: '2024-01-16' },
    { assessmentId: 17, percentage: 85, scheduledDate: '2024-01-17' },
    { assessmentId: 18, percentage: 89, scheduledDate: '2024-01-18' },
    { assessmentId: 19, percentage: 91, scheduledDate: '2024-01-19' },
    { assessmentId: 20, percentage: 92, scheduledDate: '2024-01-20' }, // Changed from 84 to 92
    { assessmentId: 21, percentage: 72, scheduledDate: '2024-01-21' },
    { assessmentId: 22, percentage: 75, scheduledDate: '2024-01-22' },
  ];
  
  const l2Results = await TrainerLevelService.checkLevelQualifications(2, mockAssessmentsL2);
  console.log('✅ L1 Qualified:', l2Results.L1.qualified);
  console.log('✅ L2 Qualified:', l2Results.L2.qualified);
  console.log('📈 Passed Assessments (≥70%):', l2Results.L2.totalPassedAssessments, '/', l2Results.L2.requiredTotalAssessments);
  console.log('🎯 Qualifying Assessments (≥85%):', l2Results.L2.qualifyingAssessments.length, '/', l2Results.L2.requiredQualifyingAssessments);
  console.log('');
  
  // Test case 3: L3 qualification
  console.log('📊 Test Case 3: L3 Qualification');
  console.log('Requirements: At least 25 assessments passed AND any 5 assessments ≥ 90% AND must be L2 first');
  
  const mockAssessmentsL3 = [
    ...mockAssessmentsL2,
    { assessmentId: 23, percentage: 92, scheduledDate: '2024-01-23' },
    { assessmentId: 24, percentage: 93, scheduledDate: '2024-01-24' },
    { assessmentId: 25, percentage: 91, scheduledDate: '2024-01-25' },
    { assessmentId: 26, percentage: 94, scheduledDate: '2024-01-26' },
    { assessmentId: 27, percentage: 90, scheduledDate: '2024-01-27' },
  ];
  
  const l3Results = await TrainerLevelService.checkLevelQualifications(3, mockAssessmentsL3);
  console.log('✅ L1 Qualified:', l3Results.L1.qualified);
  console.log('✅ L2 Qualified:', l3Results.L2.qualified);
  console.log('✅ L3 Qualified:', l3Results.L3.qualified);
  console.log('📈 Passed Assessments (≥70%):', l3Results.L3.totalPassedAssessments, '/', l3Results.L3.requiredTotalAssessments);
  console.log('🎯 Qualifying Assessments (≥90%):', l3Results.L3.qualifyingAssessments.length, '/', l3Results.L3.requiredQualifyingAssessments);
  console.log('');
  
  console.log('🎉 New trainer level criteria test completed!');
  console.log('\n📋 Summary of New Requirements:');
  console.log('L1: At least 10 assessments passed AND any 10 assessments ≥ 70%');
  console.log('L2: At least 20 assessments passed AND any 10 assessments ≥ 85% AND must be L1 first');
  console.log('L3: At least 25 assessments passed AND any 5 assessments ≥ 90% AND must be L2 first');
  
  process.exit(0);
};

// Run the test
testNewTrainerLevels().catch(console.error);
