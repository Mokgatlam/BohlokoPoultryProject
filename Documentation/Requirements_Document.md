# Bohloko Family Farm Poultry Processing System - Requirements Document

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements for the Bohloko Family Farm Poultry Processing System. The requirements are derived from business needs, stakeholder interviews, and analysis of the existing system architecture.

### 1.2 Scope
The system encompasses the complete poultry production, processing, inventory management, sales, and distribution operations for Bohloko Family Farm, including:
- Production cycle management
- Inventory tracking and management
- Order processing and fulfillment
- User management and authentication
- Analytics and reporting
- Compliance and quality control

### 1.3 Document Structure
- Section 2: Functional Requirements (organized by module)
- Section 3: Non-Functional Requirements
- Section 4: System Constraints
- Section 5: Glossary

## 2. Functional Requirements

### 2.1 Authentication & Authorization Module

#### FR-001: User Registration
**Description**: The system shall allow new users to register for accounts via the public registration form.
**Requirements**:
1. Support multiple user types: Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution
2. Collect business registration details for commercial users (business name required; registration number and tax ID validated for format)
3. Validate email uniqueness and format
4. Store user credentials securely (hashed passwords with bcrypt; min 8 characters, uppercase, lowercase, number, and special character)
5. Set account status to "pending" for ALL users until approved by Farm Manager
6. Send confirmation email upon registration (including pending status notification)
7. Validate password requirements: minimum 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
8. Validate business registration number format when provided (alphanumeric, hyphens, slashes; 5-30 characters)
9. Validate tax ID format when provided (alphanumeric, hyphens; 5-20 characters)
*Note*: Staff Members are created internally by Farm Manager via admin panel, not through public registration
#### FR-002: User Authentication
**Description**: The system shall authenticate users securely with comprehensive error handling.
**Requirements**:
1. Validate user credentials against stored bcrypt hash
2. Implement account lockout after 5 failed login attempts (30-minute lock duration)
3. Support password reset via email
4. Generate and manage JWT authentication tokens (access + refresh tokens)
5. Validate account status (approved, pending, suspended, rejected) before login
6. Track last login time and IP address for audit purposes
7. Return specific error messages for each failure type:
   - Invalid credentials: "Invalid email or password"
   - Account pending: "Your account is pending approval by the Farm Manager"
   - Account suspended: "Your account has been suspended"
   - Account rejected: "Your account registration was rejected"
   - Account locked: "Account is temporarily locked due to multiple failed login attempts"
8. Frontend must display backend error messages to users (not generic fallback)
9. Provide "Forgot Password" link on login page
10. Refresh tokens expire after 7 days; access tokens expire per JWT_EXPIRES_IN env (default 1h)
#### FR-003: Role-Based Access Control
**Description**: The system shall enforce role-based permissions.
**Requirements**:
1. Define roles: Farm Manager, Poultry Attendant, Processing Staff, Sales Assistant, Customer
2. Assign permissions based on role hierarchy
3. Restrict access to modules based on user role
4. Allow Farm Manager to modify user roles and permissions
5. Log all permission changes for audit purposes

### 2.2 Production Management Module

#### FR-004: Production Cycle Planning
**Description**: The system shall support planning of broiler production cycles.
**Requirements**:
1. Create production plans with expected birds, duration, and budget
2. Define production types: Broiler Cycle, Egg Production, Hatching
3. Set budgets for feed, medication, labor, utilities
4. Require Farm Manager approval for production plans
5. Track plan status: Planned, Approved, Rejected, Cancelled

#### FR-005: Daily Production Logging
**Description**: The system shall record daily production activities.
**Requirements**:
1. Record daily bird counts, feed consumption, water consumption
2. Track mortality counts with automatic mortality rate calculation
3. Log environmental conditions (temperature, humidity)
4. Record daily activities and issues
5. Generate alerts for high mortality rates (>5%)
6. Support offline data entry for field staff

#### FR-006: Medication & Vaccination Tracking
**Description**: The system shall track medication and vaccination administration.
**Requirements**:
1. Record medication name, dosage, date, administered by
2. Track vaccination schedules and compliance
3. Generate medication reports for regulatory compliance
4. Alert for upcoming vaccination schedules
5. Track medication inventory and usage

### 2.3 Inventory Management Module

#### FR-007: Harvest Processing
**Description**: The system shall process harvested birds into inventory.
**Requirements**:
1. Convert live bird counts to processed inventory batches
2. Create batches for different cuts: whole, breast, thighs, wings, drumsticks
3. Assign batch numbers with harvest date and characteristics
4. Record weights and storage locations
5. Update production cycle status to "completed" upon harvest
6. Calculate yield percentages

#### FR-008: Inventory Tracking
**Description**: The system shall track inventory levels in real-time.
**Requirements**:
1. Monitor stock levels across storage locations
2. Track expiry dates for perishable items
3. Support inventory adjustments (add/remove/damage)
4. Enable transfers between storage locations
5. Generate low stock alerts (<10% of capacity)
6. Track batch traceability from production to sale

#### FR-009: Inventory Reporting
**Description**: The system shall generate inventory reports.
**Requirements**:
1. Generate stock level reports by product type
2. Calculate inventory valuation at cost and retail prices
3. Report on expiry dates and near-expiry items
4. Track inventory turnover rates
5. Export reports to PDF and Excel formats

### 2.4 Order Management Module

#### FR-010: Product Catalog
**Description**: The system shall maintain a product catalog.
**Requirements**:
1. Display products with images, descriptions, prices
2. Show real-time availability based on inventory
3. Support product categorization (whole chicken, portions, value-added)
4. Allow price variations by customer type (wholesale vs retail)
5. Display batch information for traceability

#### FR-011: Order Placement
**Description**: The system shall allow customers to place orders.
**Requirements**:
1. Add products to shopping cart with quantities
2. Validate inventory availability in real-time
3. Calculate order totals with taxes and shipping
4. Support multiple delivery options: pickup, farm gate, local delivery
5. Save order drafts for later completion
6. Suggest alternatives for out-of-stock items

#### FR-012: Order Processing
**Description**: The system shall process customer orders.
**Requirements**:
1. Reserve inventory upon order confirmation
2. Support order status workflow: Pending → Confirmed → Processing → Shipped → Delivered
3. Generate picking lists for warehouse staff
4. Track order processing time
5. Send order status notifications to customers
6. Support order splitting for partial fulfillment

#### FR-013: Payment Processing
**Description**: The system shall handle payment transactions.
**Requirements**:
1. Support multiple payment methods: cash, bank transfer, mobile money, credit card
2. Integrate with payment gateways for online payments
3. Generate payment receipts and invoices
4. Track payment status: Pending, Paid, Failed, Refunded
5. Handle partial payments and payment plans
6. Support cash-on-delivery verification

#### FR-014: Order Cancellation & Refunds
**Description**: The system shall handle order cancellations and refunds.
**Requirements**:
1. Allow order cancellation before shipping
2. Process refunds for paid orders
3. Release reserved inventory back to stock
4. Track cancellation reasons for analytics
5. Generate refund receipts
6. Notify customers of cancellation and refund status

### 2.5 User Management Module

#### FR-015: User Account Management
**Description**: The system shall manage user accounts.
**Requirements**:
1. Approve/reject pending commercial user accounts
2. Suspend/activate user accounts
3. Update user profiles and business information
4. Track account activity and login history
5. Export user lists for communication
6. Implement data retention policies for inactive accounts

#### FR-016: Customer Relationship Management
**Description**: The system shall manage customer relationships.
**Requirements**:
1. Track customer order history and preferences
2. Implement loyalty programs and discounts
3. Segment customers by type and purchase volume
4. Send promotional communications
5. Track customer feedback and complaints
6. Calculate customer lifetime value

### 2.6 Analytics & Reporting Module

#### FR-017: Production Analytics
**Description**: The system shall analyze production performance.
**Requirements**:
1. Calculate key metrics: mortality rate, feed conversion ratio, cycle duration
2. Compare performance across production cycles
3. Identify trends and patterns in production data
4. Generate production cost analysis
5. Forecast production yields based on historical data
6. Provide drill-down capabilities to individual cycles

#### FR-018: Sales & Financial Analytics
**Description**: The system shall analyze sales and financial performance.
**Requirements**:
1. Calculate revenue by product, customer type, sales channel
2. Track profit margins and cost of goods sold
3. Generate profit and loss statements
4. Analyze sales trends and seasonality
5. Calculate average order value and customer acquisition cost
6. Forecast sales based on historical data and production capacity

#### FR-019: Inventory Analytics
**Description**: The system shall analyze inventory performance.
**Requirements**:
1. Calculate inventory turnover rates
2. Identify slow-moving and fast-moving items
3. Analyze stockout frequency and impact
4. Optimize reorder points based on sales patterns
5. Calculate holding costs and waste percentages
6. Generate inventory aging reports

### 2.7 Compliance Management Module

#### FR-020: Quality Control Tracking
**Description**: The system shall track quality control checks.
**Requirements**:
1. Record quality check results (pass/fail) for batches
2. Document corrective actions for failed checks
3. Track compliance with food safety standards
4. Generate quality certificates for batches
5. Maintain audit trails for regulatory inspections
6. Schedule regular quality checks based on production schedule

#### FR-021: Regulatory Compliance Reporting
**Description**: The system shall generate compliance reports.
**Requirements**:
1. Compile compliance records for specified periods
2. Format reports according to regulatory requirements
3. Generate certificates of analysis for shipments
4. Track certification expiry dates
5. Maintain documentation for traceability requirements
6. Export compliance data for external audits

### 2.8 System Administration Module

#### FR-022: System Configuration
**Description**: The system shall allow configuration of business rules.
**Requirements**:
1. Configure pricing rules and discounts
2. Set inventory thresholds and alerts
3. Define user roles and permissions
4. Configure notification templates
5. Set up tax rates and shipping costs
6. Manage product categories and attributes

#### FR-023: Data Management
**Description**: The system shall manage data operations.
**Requirements**:
1. Perform regular data backups
2. Support data export for external systems
3. Implement data validation rules
4. Maintain data integrity constraints
5. Support data migration between environments
6. Implement data archiving for historical records

## 3. Non-Functional Requirements

### 3.1 Performance Requirements

#### NFR-001: Response Time
**Description**: The system shall respond within acceptable time limits.
**Requirements**:
1. Page load time: ≤ 3 seconds for 95% of requests
2. Search operations: ≤ 2 seconds for results
3. Report generation: ≤ 60 seconds for 12-month data
4. Order processing: ≤ 30 seconds from submission to confirmation
5. API response time: ≤ 1 second for 95% of requests

#### NFR-002: Scalability
**Description**: The system shall scale to accommodate growth.
**Requirements**:
1. Support 50 concurrent users initially
2. Scale to 200 concurrent users within 2 years
3. Handle 1000+ production cycles annually
4. Process 500+ daily orders at peak capacity
5. Support database growth of 100GB+ within 3 years

#### NFR-003: Throughput
**Description**: The system shall handle required transaction volumes.
**Requirements**:
1. Process 100+ orders per hour during peak periods
2. Handle 500+ inventory transactions daily
3. Support 1000+ daily production log entries
4. Process 50+ user registrations daily
5. Generate 100+ reports daily

### 3.2 Reliability & Availability Requirements

#### NFR-004: Availability
**Description**: The system shall be available during business hours.
**Requirements**:
1. 99.5% uptime during business hours (6 AM - 10 PM SAST)
2. Maximum downtime of 4 hours per month
3. Scheduled maintenance windows outside business hours
4. Graceful degradation during partial failures
5. Disaster recovery with 4-hour RTO (Recovery Time Objective)

#### NFR-005: Reliability
**Description**: The system shall operate reliably.
**Requirements**:
1. Mean Time Between Failures (MTBF): ≥ 720 hours
2. Mean Time To Repair (MTTR): ≤ 2 hours
3. Data loss tolerance: ≤ 1 hour of transactions
4. Transaction success rate: ≥ 99.9%
5. Backup success rate: ≥ 99.9%

### 3.3 Security Requirements

#### NFR-006: Data Security
**Description**: The system shall protect sensitive data.
**Requirements**:
1. Encrypt passwords using bcrypt with salt
2. Encrypt sensitive data at rest (AES-256)
3. Use HTTPS/TLS for all data in transit
4. Implement role-based access control
5. Log all security-relevant events
6. Regular security vulnerability scanning

#### NFR-007: Access Control
**Description**: The system shall control access to resources.
**Requirements**:
1. Implement least privilege principle
2. Session timeout after 30 minutes of inactivity
3. Prevent concurrent sessions from different devices
4. Audit all permission changes
5. Implement IP whitelisting for administrative access
6. Two-factor authentication for administrative accounts

#### NFR-008: Compliance & Audit
**Description**: The system shall support compliance requirements.
**Requirements**:
1. Maintain audit trails for 7 years
2. Support data retention policies
3. Generate compliance reports for regulators
4. Implement data privacy controls (POPIA compliance)
5. Regular security audits and penetration testing

### 3.4 Usability Requirements

#### NFR-009: User Interface
**Description**: The system shall provide an intuitive user interface.
**Requirements**:
1. Responsive design for mobile, tablet, and desktop
2. Consistent navigation and layout
3. Support for English and Sesotho languages
4. Accessibility compliance (WCAG 2.1 AA)
5. Keyboard navigation support
6. High contrast mode for visually impaired users

#### NFR-010: User Experience
**Description**: The system shall provide a positive user experience.
**Requirements**:
1. Intuitive workflow for common tasks
2. Context-sensitive help and tooltips
3. Clear error messages with resolution guidance
4. Progress indicators for long operations
5. Customizable dashboards for different roles
6. Offline capability for critical field operations

#### NFR-011: Learnability
**Description**: The system shall be easy to learn.
**Requirements**:
1. New users should be able to perform basic tasks within 30 minutes
2. Provide comprehensive user documentation
3. Include video tutorials for complex workflows
4. Implement guided tours for first-time users
5. Contextual training materials

### 3.5 Maintainability Requirements

#### NFR-012: Code Maintainability
**Description**: The system shall be easy to maintain.
**Requirements**:
1. Modular architecture with clear separation of concerns
2. Comprehensive code documentation
3. Unit test coverage ≥ 80%
4. Integration test coverage for critical workflows
5. Code review process for all changes
6. Continuous integration/deployment pipeline

#### NFR-013: System Maintainability
**Description**: The system shall be easy to operate and maintain.
**Requirements**:
1. Comprehensive logging with log rotation
2. Health monitoring and alerting
3. Easy deployment and rollback procedures
4. Configuration management without code changes
5. Database migration scripts
6. Performance monitoring dashboards

### 3.6 Compatibility Requirements

#### NFR-014: Browser Compatibility
**Description**: The system shall work on supported browsers.
**Requirements**:
1. Chrome (latest 2 versions)
2. Firefox (latest 2 versions)
3. Safari (latest 2 versions)
4. Edge (latest 2 versions)
5. Mobile browsers (Chrome, Safari)

#### NFR-015: Device Compatibility
**Description**: The system shall work on supported devices.
**Requirements**:
1. Desktop computers (Windows, macOS)
2. Tablets (iOS, Android)
3. Smartphones (iOS, Android)
4. Minimum screen resolution: 320x568 pixels
5. Touch screen support for mobile devices

#### NFR-016: Integration Compatibility
**Description**: The system shall integrate with external systems.
**Requirements**:
1. RESTful API for third-party integration
2. Support for common data formats (JSON, CSV, XML)
3. Integration with payment gateways
4. Email and SMS notification services
5. Export to accounting software (QuickBooks, Xero)
6. Mobile money integration (M-Pesa, etc.)

### 3.7 Operational Requirements

#### NFR-017: Deployment
**Description**: The system shall support deployment requirements.
**Requirements**:
1. Support cloud deployment (AWS, Azure, GCP)
2. Containerized deployment (Docker)
3. Environment-specific configurations
4. Blue-green deployment capability
5. Zero-downtime deployments
6. Automated deployment scripts

#### NFR-018: Monitoring
**Description**: The system shall be monitorable.
**Requirements**:
1. Application performance monitoring
2. Business metrics tracking
3. Error tracking and alerting
4. User activity analytics
5. Database performance monitoring
6. Infrastructure monitoring

## 4. System Constraints

### 4.1 Technical Constraints

#### TC-001: Infrastructure
1. Must operate in areas with limited internet connectivity
2. Support offline operation for critical field functions
3. Mobile-first design for field staff with smartphones
4. Integration with existing farm equipment and sensors
5. Support for low-bandwidth environments

#### TC-002: Integration
1. Must integrate with existing payment systems (cash, EFT, mobile money)
2. Support barcode scanning for inventory management
3. Integration with weighing scales for production
4. Support for thermal printers for receipts and labels
5. Mobile app for field staff with offline capability

#### TC-003: Data
1. Must comply with South African data protection laws (POPIA)
2. Data retention for 7 years for financial records
3. Daily automated backups with offsite storage
4. Data encryption for sensitive information
5. Support for data migration from existing systems

### 4.2 Business Constraints

#### BC-001: Operational
1. Must support farm operations 7 days a week, 6 AM - 10 PM
2. Accommodate seasonal production variations
3. Support growth from 500 to 5000+ birds per cycle
4. Must comply with South African food safety regulations
5. Support multiple sales channels (farm gate, online, wholesale)

#### BC-002: Financial
1. Total system cost must not exceed R150,000 initial investment
2. Monthly operational costs must not exceed R5,000
3. System must pay for itself within 18 months
4. Support for multiple currencies (ZAR primary)
5. Integration with existing accounting practices

#### BC-003: Timeline
1. Phase 1 (Core Production & Inventory): 3 months
2. Phase 2 (Order Management & Sales): 2 months
3. Phase 3 (Analytics & Reporting): 2 months
4. Phase 4 (Compliance & Mobile): 2 months
5. Total project duration: 9 months

#### BC-004: Regulatory
1. Must comply with South African Food Safety Regulations
2. Must comply with POPIA (Protection of Personal Information Act)
3. Must support VAT calculations and reporting
4. Must maintain records for 7 years as per tax regulations
5. Must comply with agricultural export regulations if applicable

#### BC-005: Human Resources
1. System must be operable by staff with basic computer literacy
2. Training must be provided for all user roles
3. System must include built-in help and documentation
4. Support must be available during business hours
5. System must reduce manual data entry by at least 60%

## 5. Glossary

### 5.1 Technical Terms
- **API**: Application Programming Interface
- **JWT**: JSON Web Token for authentication
- **REST**: Representational State Transfer architecture
- **POPIA**: Protection of Personal Information Act (South Africa)
- **MTBF**: Mean Time Between Failures
- **MTTR**: Mean Time To Repair
- **RTO**: Recovery Time Objective
- **WCAG**: Web Content Accessibility Guidelines

### 5.2 Business Terms
- **Broiler Cycle**: 5-6 week production period from chick to harvest
- **Feed Conversion Ratio**: Kilograms of feed per kilogram of weight gain
- **Mortality Rate**: Percentage of birds that die during production cycle
- **Batch**: Group of processed chickens with same harvest date and characteristics
- **User Types**: Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution
- **Production Status**: Planned, In Progress, Completed, Cancelled

### 5.3 System Terms
- **Farm Manager**: System administrator with full access
- **Poultry Attendant**: Manages live bird production
- **Processing Staff**: Handles slaughtering and processing
- **Sales Assistant**: Manages customer orders and sales
- **Customer**: External users who place orders
- **System Administrator**: Technical system maintenance role

## 6. Appendix

### 6.1 Requirements Traceability Matrix
*(To be developed during detailed design phase)*

### 6.2 Assumptions and Dependencies
1. Stable internet connectivity available at farm office
2. Staff have access to smartphones or tablets for field operations
3. Existing farm equipment can be integrated or manual data entry is acceptable
4. Payment gateway integration is feasible within budget
5. Regulatory requirements remain stable during implementation

### 6.3 Risk Assessment
1. **Technical Risk**: Integration with existing systems may be complex
   - Mitigation: Phase implementation with fallback to manual processes
2. **Operational Risk**: Staff resistance to new system
   - Mitigation: Comprehensive training and change management
3. **Financial Risk**: Cost overruns
   - Mitigation: Fixed-price contracts with clear scope definition
4. **Schedule Risk**: Delays in implementation
   - Mitigation: Agile methodology with regular deliverables
5. **Compliance Risk**: Changing regulatory requirements
   - Mitigation: Modular design to accommodate changes

### 6.4 Success Criteria
1. **Functional**: All core modules operational and meeting 95% of requirements
2. **Performance**: System responds within specified time limits for 95% of transactions
3. **Usability**: 90% of users can perform core tasks without assistance after training
4. **Business**: System reduces manual data entry by 60% and improves inventory accuracy to 99%
5. **Financial**: System pays for itself within 18 months through efficiency gains

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Prepared By**: Requirements Analysis Team  
**Approved By**: Farm Management & Technical Team  
**Next Review**: March 2026
