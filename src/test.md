## 🏗 System Architecture

```mermaid
graph TD

    A[Excel File - ESSAI GNT IC] --> B[Spring Boot Backend API]
    B --> C[MySQL Database]
    B --> D[JWT Authentication & RBAC]

    B --> E[Angular Web Application]
    B --> F[Mobile Application]

    E -->|REST API| B
    F -->|REST API| B

    C -->|Persistent Storage| B
```
