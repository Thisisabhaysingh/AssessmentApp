-- Add trainerLevelSettings column to system_settings table
ALTER TABLE system_settings 
ADD COLUMN trainerLevelSettings JSON 
DEFAULT '{"L1":{"totalAssessmentsRequired":10,"minScore":70,"qualifyingAssessmentsRequired":10,"enabled":true},"L2":{"totalAssessmentsRequired":20,"minScore":85,"qualifyingAssessmentsRequired":10,"enabled":true,"requiresPreviousLevel":true},"L3":{"totalAssessmentsRequired":25,"minScore":90,"qualifyingAssessmentsRequired":5,"enabled":true,"requiresPreviousLevel":true}}';

COMMENT ON COLUMN system_settings.trainerLevelSettings IS 'JSON object containing trainer level progression criteria';
