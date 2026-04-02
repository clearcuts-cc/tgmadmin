# Document for TGM — The Grand Mist Resort Management System

## 1. Executive Summary
**The Grand Mist (TGM) Resort Management System** is a high-end, single-page application (SPA) designed for luxury resort operations. It features a premium "Alpine Obsidian" dark-mode interface, real-time data synchronization via Supabase, and a streamlined workflow for guest management, room booking, and resort logistics.

---

## 2. Technical Architecture
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, and CSS3.
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime).
- **Design System**: **Alpine Obsidian** (Deep Charcoal, Slate, and Gold accents).
- **Data Layer**: Centralized `MockData` controller with in-memory caching and real-time event listeners.
- **Routing**: Hash-based (`#page-name`) dynamic SPA router.

---

## 3. Design Standards & Visual Identity
### 3.1 Color Palette
- **Base Background**: `#0C0E15` (Deep Space)
- **Primary Text**: `#F0EDDF` (Antique White)
- **Accent Gold**: `#D4A853` (Warm Gold)
- **Secondary Text**: `#8B90A7` (Cool Slate)
- **Success/Teal**: `#2ABFB0`

### 3.2 Key UI Components
- **Iconography**: Strictly use stroke-based SVG icons (Lucide-style) instead of emojis to maintain a professional, corporate aesthetic.
- **Sidebar Toggle**: A floating "‹ / ›" button attached to the sidebar edge for manual layout control.

---

## 4. Feature Modules

### 4.1 Dashboard
The nerve center of the resort. Displays real-time stats including:
- **Total Occupancy**: Percentage of rooms currently filled.
- **Active Bookings**: Number of guests currently staying or arriving.
- **Daily Revenue**: Total earnings from rooms and F&B for the current date.
- **Visual Charts**: Stay trends and revenue distribution.

### 4.2 Room Board (`#rooms`)
An interactive grid representing all resort rooms.
- **Status Badges**: Available (Green), Occupied (Red), Confirmed (Blue), Maintenance (Purple).
- **Quick Look**: Clicking a room shows current guest details and upcoming bookings.

### 4.3 Bookings (`#bookings`, `#bookings-new`)
- **Booking List**: Searchable table of all past, present, and future guests.
- **Legacy ID Handling**: Automatically converts internal IDs to the branded **TGM-XXXXXX** format.
- **New Booking**: Step-by-step form to register guests, select rooms, and capture advance payments.

### 4.4 Check-in & Check-out (`#checkin`, `#checkout`)
- **Smart Check-in**: One-click arrival confirmation for booked guests.
- **Final Billing**: Generates a consolidated bill (Room charges + GST + Food orders) during check-out.
- **Overdue Alerts**: Automatic notifications if a guest exceeds the check-out time.

### 4.5 Guest Directory (`#guests`)
A comprehensive database of regular and past guests.
- Stores contact info, Aadhaar details, and stay history.
- "Repeat Guest" indicator to help staff provide personalized service.

### 4.6 F&B / Food Orders (`#menu`, `#orders`)
- **Digital Menu**: Manage available dishes and prices.
- **Room Service Orders**: Kitchen staff can track new orders by room number and update their status (Pending → Served).

### 4.7 Events & Venue Management (`#events`)
- **Event Calendar**: Integrated scheduler for weddings, corporate retreats, and private parties.
- **Venue Availability**: Track occupancy for banquet halls, gardens, and poolside venues.
- **Package Selection**: Pre-defined or custom event packages including catering and decor.

### 4.8 Reports & Analytics (`#reports`)
- **Visual Revenue Graphs**: Interactive line and bar charts showing revenue trends over time.
- **Occupancy Heatmaps**: Radial or area graphs visualizing room filling patterns.
- **Data Insights**: Automated growth percentage comparisons and performance graphs.

### 4.9 Employee Management (`#employees`)
- **Staff Profiles**: Comprehensive directory of all resort staff with contact info and shift history.
- **Performance Tracking**: Log of actions performed by each staff member (e.g., "Room cleaned by Employee A").
- **Credentials Manager**: Securely update passwords and access levels for system users.

### 4.10 System Settings & Configuration (`#settings`)
- **Resort Profile**: Manage resort name, contact details, logo, and address for bill headers.
- **Financial Controls**: Configure GST/Tax rates, service charges, and currency symbols.
- **Room Categories**: Define room types (Deluxe, Suite, Penthouse) and their base pricing.

---

## 5. Standardizations

### 5.1 Booking ID Protocol
Every booking in the system is represented by a 10-character human-readable ID (e.g., `TGM-A1B2C3D4`).
- Internal UUIDs are automatically masked for a premium professional feel.
- This ID is used for all guest communication, bill generation, and search queries.

### 5.2 Notification System (Smart Alerts)
- **Toast Notifications**: Instant popups for data changes (e.g., "New Booking Received").
- **Smart Alerts Dropdown**: A history of recent important events (Cancellations, Overdue check-outs).
- **Overdue Migration**: Legacy alerts are automatically migrated to ensure they link to the correct specialized pages.

### 5.3 Data Tools: Export & Import
- **Bulk Import**: Seamlessly migrate existing guest lists or room data using standardized Excel/CSV templates.
- **One-Click Export**: Download all system data including Bookings, Guest Directory, and Revenue Reports to `.xlsx` or `.csv`.
- **Cloud Backup**: Automated snapshots of the Supabase database to prevent data loss.

---

## 6. Role-Based Access Control (RBAC)
- **Admin**: Full access, including system settings, employee management, and financial deletion.
- **Manager**: View all data, handle bookings and check-outs, but restricted from sensitive system configurations.
- **Employee**: Limited to operations only (Check-in, Food Orders, Dashboard); cannot access Settings or Reports.

---

**Generated by Antigravity AI Engineering Team · 2026**
