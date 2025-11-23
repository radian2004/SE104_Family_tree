# SE104_Family_tree


# 🌳 Family Tree Management System

A comprehensive web application designed to manage family lineages, visualize genealogical trees, and track family funds/expenses. This project utilizes a robust 3-layer architecture to ensure scalability and maintainability.

## 🚀 Project Overview

This system allows family clans to digitalize their records. It supports member management, relationship mapping (family tree), and financial tracking (donations, expenses, and funds).

### Key Features

* **Member Management:** CRUD operations for family members (Profile, DOB, Profession, Address).
* **Genealogy Visualization:** Interactive family tree based on parent-child relationships (`QuanHeConCai`).
* **Financial Management:** Track Income (`PhieuThu`) and Expenses (`PhieuChi`) for the clan fund.
* **Events & Anniversaries:** Record death anniversaries (`GhiNhanKetThuc`) and burial locations.
* **Role-Based Access Control:** Secure authentication with roles (Admin/Member) and permissions (`PhanQuyen`).

---

## 🛠 Tech Stack

### Frontend (Client)

* **Framework:** React.js (Vite)
* **State Management:** React Context API / Redux (Optional)
* **Routing:** React Router DOM
* **HTTP Client:** Axios
* **UI Library:** Ant Design / Material UI (Recommended)

### Backend (Server)

* **Runtime:** Node.js
* **Framework:** Express.js
* **Architecture:** 3-Layer (Controller - Service - Repository)
* **ORM:** Prisma
* **Database:** MySQL

---

## 📂 Project Structure

The project follows a Monorepo structure:

```bash
family-tree-manager/
├── client/                 # React Frontend application
├── server/                 # Node.js Express Backend
├── database/               # SQL scripts and backups
├── docs/                   # System diagrams and documentation
└── README.md               # Project documentation
```
