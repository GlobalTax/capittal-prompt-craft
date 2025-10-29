-- Add depreciation column to valuation_years table
ALTER TABLE valuation_years 
ADD COLUMN depreciation numeric DEFAULT 0;