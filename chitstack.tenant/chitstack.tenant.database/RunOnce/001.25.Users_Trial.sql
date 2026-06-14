-- ============================================================
-- 001.25.Users_Trial.sql
-- Add TrialEndDate to Users table (demo stamp only)
-- Trial enforcement is self-contained in the demo stamp.
-- ============================================================

ALTER TABLE [dbo].[Users]
    ADD [TrialEndDate] DATETIME2 NULL;
GO
