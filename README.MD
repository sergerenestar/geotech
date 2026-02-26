# Geotech Lab Digital Platform

Geotech Lab Digital Platform is a backend-driven system designed to transform the existing Excel-based laboratory workflow (ESSAI GNT IC) into a scalable web and mobile application.

The goal is to replace manual Excel processing with a secure, role-based, cloud-ready digital system.

---

## 📊 Problem Statement

Currently, laboratory test data (ESSAI GNT IC) is managed using Excel spreadsheets.

Limitations of the Excel-based workflow:
- Manual data entry errors
- No centralized database
- No audit trail
- Difficult multi-user collaboration
- No role-based access control
- No mobile accessibility

This project converts that Excel workflow into a structured backend system that will power:

- 🌐 Web Application
- 📱 Mobile Application
- ☁️ Cloud Deployment

---

## 🎯 Project Goals

1. Digitize the ESSAI GNT IC laboratory workflow
2. Store test data in a relational database
3. Implement role-based access control
4. Enable real-time collaboration
5. Provide API endpoints for frontend & mobile apps
6. Ensure scalability and production readiness

---

## 🏗 Architecture Overview

Backend:
- Spring Boot 3
- MySQL
- Flyway Migration
- JWT Authentication (Stateless)
- Role-Based Authorization
- Refresh Token Strategy
- OpenAPI (Swagger Documentation)
- Environment-based configuration

Frontend (Planned):
- Angular Web Application

Mobile (Planned):
- Flutter or React Native App

---

## 👥 User Roles

- ADMIN
    - Manage users
    - System configuration
    - Full access

- MANAGER
    - Create and assign analyses
    - Validate laboratory results

- TECHNICIAN
    - Perform tests
    - Submit test results

---

## 🔐 Security Model

- Stateless JWT Authentication
- Refresh Token Rotation
- Role-Based Access Control
- Encrypted Passwords (BCrypt)
- Environment-based secrets (.env for development)

---

## 📂 Project Structure


com.lab.geotech
│
├── config
├── constant
├── controller
├── dto
├── entity
├── exception
├── repository
├── security
├── service
├── util
├── wrapper
└── GeotechLabApplication


---

## 🗄 Database Strategy

- MySQL relational database
- Flyway version-controlled schema migrations
- Entity-driven data modeling from Excel structure

---

## 🚀 Running Locally

### 1️⃣ Create a `.env` file in the project root:


DB_HOST=localhost
DB_PORT=3306
DB_NAME=geotech
DB_USER=root
DB_PASSWORD=yourpassword

JWT_SECRET=your_long_random_secret_key
JWT_ACCESS_MINUTES=15
JWT_REFRESH_DAYS=14


### 2️⃣ Start the application:


mvn spring-boot:run


Swagger UI:

http://localhost:8080/swagger-ui.html


---

## 🔄 Migration Plan

Phase 1:
- Analyze Excel structure (ESSAI GNT IC)
- Design database schema
- Implement authentication & roles

Phase 2:
- Build REST API endpoints
- Create Angular web interface

Phase 3:
- Develop mobile application
- Deploy to cloud (AWS / Azure)

---

## 📈 Future Improvements

- Docker containerization
- CI/CD pipeline
- Cloud deployment
- Audit logging
- Export to PDF
- Data analytics dashboard

---

## 🧠 Long-Term Vision

Transform manual laboratory operations into a secure, cloud-based digital platform with full traceability, analytics, and mobile accessibility.

---

## 👨‍💻 Author

Serge Rene  
Backend Developer | Cloud & Data Engineering Enthusiast