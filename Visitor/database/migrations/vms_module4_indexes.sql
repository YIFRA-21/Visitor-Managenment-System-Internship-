-- Migration: Module 4.1 Enterprise Visitor Dashboard Optimization Indexes
USE visitor_db;

-- 1. Visitors Organization & Date Composite Index for KPI & Chart Aggregations
CREATE INDEX IF NOT EXISTS idx_visitors_org_created ON visitors(organization_id, created_at);

-- 2. Visitor Lifecycle & Registration Status Fast Filters
CREATE INDEX IF NOT EXISTS idx_visitors_status_active ON visitors(status, is_active);
CREATE INDEX IF NOT EXISTS idx_visitors_reg_status ON visitors(registration_status, is_active);

-- 3. Fast Quick Search & Duplicate Record Identification Index
CREATE INDEX IF NOT EXISTS idx_visitors_search ON visitors(email, phone, id_number);

-- 4. Expired Document Alert Optimization Index
CREATE INDEX IF NOT EXISTS idx_visitor_docs_expiry ON visitor_documents(expiry_date, deleted_at);
