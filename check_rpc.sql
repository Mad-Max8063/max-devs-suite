SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname = 'update_business_profile_secure';
