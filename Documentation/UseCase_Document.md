# Bohloko Family Farm Poultry Processing System - Use Case Document

## 1. Introduction

### 1.1 Purpose
This document outlines the functional requirements of the Bohloko Family Farm Poultry Processing System through use cases. The system is designed to manage the complete poultry production, processing, inventory, sales, and distribution operations for Bohloko Family Farm.

### 1.2 System Overview
The Bohloko Family Farm Poultry Processing System is a comprehensive software solution that supports:
- **Production Management**: Tracking broiler cycles, feed consumption, medication, and mortality
- **Inventory Management**: Managing processed chicken products, storage, and stock levels
- **Order Processing**: Handling customer orders from various channels
- **User Management**: Role-based access control for farm staff and external customers
- **Analytics & Reporting**: Business intelligence for decision making
- **Compliance Tracking**: Food safety and regulatory compliance documentation

### 1.3 Actors
1. **Farm Manager** - Overall system administrator with full access
2. **Poultry Attendant** - Manages live bird production and daily operations
3. **Processing Staff** - Handles slaughtering, processing, and inventory management
4. **Sales Assistant** - Manages customer orders and sales
5. **Customer** - External users who place orders (Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution)
6. **System Administrator** - Technical system maintenance

## 2. Use Case Diagrams

### 2.1 High-Level Use Case Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Poultry Processing System                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐       │
│  │ Production │    │ Inventory  │    │   Orders   │       │
│  │ Management │    │ Management │    │ Management │       │
│  └────────────┘    └────────────┘    └────────────┘       │
│         │                 │                 │              │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐       │
│  │Plan Cycle   │  │Track Stock  │  │Place Order  │       │
│  │Record Feed  │  │Update Levels│  │Process Order│       │
│  │Log Mortality│  │Manage Batch │  │Track Status │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 3. Detailed Use Cases

### 3.1 Authentication & Authorization

#### UC-001: User Registration
- **Actor**: Customer (Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution)
  - *Note*: Staff Members are created internally by Farm Manager via admin panel, not through public registration
- **Description**: New users can register for an account with the system
- **Preconditions**: User does not have an existing account
- **Basic Flow**:
  1. User navigates to registration page
  2. User selects user type (Consumer, Restaurant, Retailer, etc.)
  3. User provides required information (email, password, business details)
  4. System validates information and creates account
  5. System sends confirmation email
  6. Account status is set to "pending" until approved by Farm Manager
- **Postconditions**: User account created with pending status
- **Extensions**: 
  - 3a. Email already exists: System displays error message
  - 3b. Invalid business registration: System prompts for correction with format requirements (alphanumeric, 5-30 characters)
#### UC-002: User Login
- **Actor**: All authenticated users
- **Description**: Users log into the system with credentials
- **Preconditions**: User has an account (pending, approved, suspended, or rejected status)
- **Basic Flow**:
  1. User enters email and password on login page
  2. System validates credentials against stored hash
  3. System checks account status (pending/approved/suspended/rejected) and lock status
  4. System generates JWT authentication token (access + refresh)
  5. System records login time and IP address
  6. User is redirected to appropriate dashboard based on role/userType
- **Postconditions**: User session established with role-appropriate dashboard
- **Extensions**: 
  - 2a. Invalid credentials: System increments login attempts counter, locks account for 30 minutes after 5 consecutive failures. User is shown remaining attempt count when approaching threshold
  - 2b. Account not approved: System displays specific status message:
    - Pending: "Your account is pending approval by the Farm Manager"
    - Suspended: "Your account has been suspended"
    - Rejected: "Your account registration was rejected"
  - 2c. Account locked: System displays "Account temporarily locked" with unlock time
### 3.2 Production Management

#### UC-003: Plan Production Cycle
- **Actor**: Farm Manager, Poultry Attendant
- **Description**: Create a new broiler production cycle plan
- **Preconditions**: User has appropriate role permissions
- **Basic Flow**:
  1. User navigates to Production Planning
  2. User creates new cycle with details (type, expected birds, duration)
  3. User sets budget for feed, medication, labor, utilities
  4. System validates plan and saves as "planned"
  5. Farm Manager approves the plan
  6. System creates production cycle with "in_progress" status
- **Postconditions**: New production cycle created and active
- **Extensions**:
  - 5a. Plan rejected: Farm Manager provides rejection reason

#### UC-004: Record Daily Production Log
- **Actor**: Poultry Attendant
- **Description**: Record daily observations and activities for active production cycle
- **Preconditions**: Active production cycle exists
- **Basic Flow**:
  1. User selects active production cycle
  2. User creates daily log entry
  3. User records birds count, feed consumed, water consumed, mortality
  4. User records environmental conditions (temperature, humidity)
  5. User logs daily activities and any issues
  6. System saves log and updates cycle statistics
- **Postconditions**: Daily production data recorded
- **Extensions**:
  - 3a. High mortality detected: System triggers alert to Farm Manager

#### UC-005: Record Medication & Vaccination
- **Actor**: Poultry Attendant
- **Description**: Log medication and vaccination administration
- **Preconditions**: Active production cycle exists
- **Basic Flow**:
  1. User selects active production cycle
  2. User adds medication/vaccination record
  3. User specifies medication name, dosage, date, administered by
  4. System validates and saves record
  5. System updates medication schedule
- **Postconditions**: Medication history maintained for compliance

### 3.3 Inventory Management

#### UC-006: Process Harvested Birds
- **Actor**: Processing Staff
- **Description**: Convert live birds to processed inventory
- **Preconditions**: Production cycle ready for harvest
- **Basic Flow**:
  1. User selects production cycle for harvest
  2. User records number of birds harvested
  3. System creates inventory batches for different cuts (whole, portions)
  4. User assigns batch numbers, weights, and storage locations
  5. System updates inventory levels and marks cycle as completed
- **Postconditions**: Inventory increased, production cycle completed

#### UC-007: Manage Inventory Levels
- **Actor**: Processing Staff, Farm Manager
- **Description**: Monitor and update inventory stock levels
- **Preconditions**: Inventory items exist in system
- **Basic Flow**:
  1. User views current inventory dashboard
  2. System displays stock levels, expiry dates, storage locations
  3. User can adjust quantities (add/remove/damage)
  4. User can transfer between storage locations
  5. System updates real-time inventory counts
- **Postconditions**: Accurate inventory tracking maintained

#### UC-008: Generate Inventory Reports
- **Actor**: Farm Manager, Processing Staff
- **Description**: Create inventory status and valuation reports
- **Preconditions**: Inventory data exists
- **Basic Flow**:
  1. User selects report type (stock levels, valuation, expiry)
  2. User sets date range and filters
  3. System generates report with totals and trends
  4. User can export to PDF/Excel
- **Postconditions**: Inventory insights available for decision making

### 3.4 Order Management

#### UC-009: Place Order
- **Actor**: Customer (Consumer, Restaurant, Retailer, etc.)
- **Description**: Customer places order for poultry products
- **Preconditions**: Customer account approved, inventory available
- **Basic Flow**:
  1. Customer browses product catalog
  2. Customer adds items to cart with quantities
  3. Customer selects delivery/pickup option
  4. System validates inventory availability
  5. Customer confirms order and payment
  6. System creates order with "pending" status
- **Postconditions**: Order created awaiting processing
- **Extensions**:
  - 4a. Insufficient inventory: System suggests alternatives or backorder

#### UC-010: Process Order
- **Actor**: Sales Assistant
- **Description**: Process customer orders through fulfillment
- **Preconditions**: Order exists in "pending" status
- **Basic Flow**:
  1. User views pending orders queue
  2. User selects order for processing
  3. System reserves inventory for order
  4. User confirms picking/packing
  5. User updates order status to "processing" then "shipped"
  6. System sends notifications to customer
- **Postconditions**: Order fulfilled, inventory reduced

#### UC-011: Track Order Status
- **Actor**: Customer, Sales Assistant
- **Description**: Monitor order progress through fulfillment stages
- **Preconditions**: Order exists in system
- **Basic Flow**:
  1. User navigates to order tracking
  2. System displays current status and timeline
  3. For customers: View estimated delivery
  4. For staff: Update status and add notes
  5. System logs all status changes
- **Postconditions**: Order transparency maintained

#### UC-012: Process Payment
- **Actor**: Customer, Sales Assistant
- **Description**: Handle payment for customer orders
- **Preconditions**: Order exists with "pending" payment status
- **Basic Flow**:
  1. Customer selects payment method (credit card, bank transfer, mobile money, cash)
  2. System processes payment through appropriate gateway
  3. Payment gateway returns transaction status
  4. System updates order payment status to "paid" if successful
  5. System generates payment receipt
  6. Order status moves to "confirmed"
- **Postconditions**: Order payment completed, order confirmed
- **Extensions**:
  - 3a. Payment fails: System retries or prompts for alternative method
  - 3b. Partial payment: System tracks partial payment status

#### UC-013: Cancel Order
- **Actor**: Customer, Sales Assistant, Farm Manager
- **Description**: Cancel an existing order with appropriate refunds
- **Preconditions**: Order exists and is cancellable (pending or confirmed status)
- **Basic Flow**:
  1. User requests order cancellation with reason
  2. System checks if order can be cancelled (not shipped)
  3. If payment was made, system initiates refund process
  4. System updates order status to "cancelled"
  5. System releases reserved inventory back to stock
  6. Customer receives cancellation confirmation and refund if applicable
- **Postconditions**: Order cancelled, inventory restored, refund processed if needed

### 3.5 User & Role Management

#### UC-014: Manage User Accounts
- **Actor**: Farm Manager
- **Description**: Approve, suspend, or manage user accounts
- **Preconditions**: User has Farm Manager role
- **Basic Flow**:
  1. User views pending account approvals
  2. User reviews business registration and details
  3. User approves or rejects account
  4. If rejected, provides reason
  5. System updates account status and notifies user
- **Postconditions**: User account status updated

#### UC-015: Assign User Roles
- **Actor**: Farm Manager
- **Description**: Assign or modify user roles and permissions
- **Preconditions**: User account exists and is approved
- **Basic Flow**:
  1. User searches for existing user
  2. User views current role and permissions
  3. User assigns new role (Poultry Attendant, Processing Staff, etc.)
  4. System updates permissions and notifies user
- **Postconditions**: User access rights updated

### 3.6 Analytics & Reporting

#### UC-016: View Production Analytics
- **Actor**: Farm Manager
- **Description**: Analyze production performance metrics
- **Preconditions**: Production data exists
- **Basic Flow**:
  1. User navigates to Analytics dashboard
  2. System displays key metrics (mortality rate, feed conversion, cycle duration)
  3. User can filter by date range, cycle type
  4. System generates charts and trends
  5. User can drill down to individual cycles
- **Postconditions**: Production insights available

#### UC-017: Generate Financial Reports
- **Actor**: Farm Manager
- **Description**: Create profit/loss, revenue, and cost reports
- **Preconditions**: Financial data exists
- **Basic Flow**:
  1. User selects report type (P&L, revenue by channel, cost analysis)
  2. User sets reporting period
  3. System calculates totals and margins
  4. System generates report with comparisons to previous periods
  5. User can export for accounting purposes
- **Postconditions**: Financial performance documented

### 3.7 Compliance Management

#### UC-018: Record Compliance Checks
- **Actor**: Processing Staff, Farm Manager
- **Description**: Document food safety and quality compliance checks
- **Preconditions**: Processing activities occurring
- **Basic Flow**:
  1. User performs quality check on batch
  2. User records check results (pass/fail) in system
  3. User documents any corrective actions
  4. System timestamps and stores compliance record
  5. System generates compliance certificates if needed
- **Postconditions**: Compliance documentation maintained

#### UC-019: Generate Compliance Reports
- **Actor**: Farm Manager
- **Description**: Create reports for regulatory authorities
- **Preconditions**: Compliance data exists
- **Basic Flow**:
  1. User selects compliance report template
  2. System compiles all compliance records for period
  3. System formats report according to regulatory requirements
  4. User reviews and approves report
  5. System generates final document for submission
- **Postconditions**: Regulatory compliance documented

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
- System should support 50 concurrent users
- Page load times under 3 seconds
- Order processing within 30 seconds
- Report generation under 60 seconds for 12-month period

### 4.2 Security Requirements
- Role-based access control
- Password encryption (bcrypt)
- HTTPS for all communications
- Audit logging for all critical operations
- Regular security updates and patches

### 4.3 Availability Requirements
- 99.5% uptime during business hours (6 AM - 10 PM)
- Automated daily backups
- Disaster recovery plan with 4-hour RTO

### 4.4 Usability Requirements
- Responsive design for mobile and desktop
- Intuitive navigation for users with varying tech literacy
- Multi-language support (English, Sesotho initially)
- Accessibility compliance (WCAG 2.1 AA)

## 5. System Constraints

### 5.1 Technical Constraints
- Must work with existing farm infrastructure (limited internet in rural areas)
- Offline capability for critical operations
- Mobile-first design for field staff
- Integration with existing payment systems (cash, EFT, mobile money)

### 5.2 Business Constraints
- Must comply with South African food safety regulations
- Must support multiple sales channels (farm gate, online, wholesale)
- Must accommodate seasonal production variations
- Must support growth from 500 to 5000+ birds per cycle

## 6. Glossary

- **Broiler Cycle**: 5-6 week production period from chick to harvest
- **Feed Conversion Ratio**: Kilograms of feed per kilogram of weight gain
- **Mortality Rate**: Percentage of birds that die during production cycle
- **Batch**: Group of processed chickens with same harvest date and characteristics
- **User Types**: Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution
- **Production Status**: Planned, In Progress, Completed, Cancelled

## 7. Appendix

### 7.1 User Role Matrix
| Role | Production | Inventory | Orders | Users | Analytics | Settings |
|------|------------|-----------|--------|-------|-----------|----------|
| Farm Manager | Full | Full | Full | Full | Full | Full |
| Poultry Attendant | Create/Read | Read | None | None | Read | None |
| Processing Staff | Read | Create/Update | Read | None | Read | None |
| Sales Assistant | None | Read | Create/Update | None | Read | None |
| Customer | None | Read | Own orders | Own profile | None | Own settings |

### 7.2 Data Flow Diagrams
*(To be developed during detailed design phase)*

### 7.3 Screen Mockups
*(To be developed during UI/UX design phase)*

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Prepared By**: System Analysis Team  
**Approved By**: Farm Management  
**Next Review**: July 2026