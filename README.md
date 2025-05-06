# 🎫 Eventique

**Eventique** is a fully serverless event management web application built using AWS cloud services. It allows users to sign up, browse upcoming events, register for them, and view their registrations — all through a secure and scalable platform.

---

## 📌 Project Information

- **Project Title:** Eventique  
- **Authors:** Aditya Sharma, Parth Mishra  
- **Mentor:** Dr. Naween Kumar  
- **Submission:** College Project

---

## 🌐 Live Demo

> _[Optional]_ Add your deployed CloudFront distribution URL here  
> Example: [https://eventique.example.com](https://eventique.example.com)

---

## 🚀 Features

- 🔐 Secure user authentication with Amazon Cognito
- 🗓️ View a list of events and their details
- ✅ Register for events with one click
- 📋 See your registered events
- 🖥️ Responsive single-page frontend built with React
- ☁️ Serverless backend powered by AWS Lambda + API Gateway
- 💾 Event and registration data stored in DynamoDB
- 📦 Infrastructure as Code with Terraform

---

## 🧱 Architecture Overview

- Frontend hosted on **Amazon S3 + CloudFront**
- Authentication with **Amazon Cognito**
- API Gateway routes secure REST endpoints
- Lambda functions handle logic (list events, register, get user’s events)
- DynamoDB stores event & registration data

---

## 🛠️ Tech Stack

| Layer           | Technology                     |
|----------------|---------------------------------|
| Frontend       | React, Tailwind CSS, Vite       |
| Backend        | AWS Lambda, API Gateway         |
| Authentication | Amazon Cognito                  |
| Database       | Amazon DynamoDB                 |
| Hosting        | Amazon S3 + CloudFront          |
| IaC            | Terraform                       |

---

## 📦 Folder Structure

eventique/
├── frontend/ # React App (Vite + Tailwind)
│ └── src/
│ ├── components/
│ ├── pages/
│ └── types/
├── backend/ # Lambda Functions
│ ├── getEvents/
│ ├── registerEvent/
│ └── getMyRegistrations/
├── terraform/ # IaC for AWS Infra
│ ├── main.tf
│ ├── variables.tf
│ └── outputs.tf
└── README.md


---

## 🧑‍💻 Getting Started

### ✅ Prerequisites

- AWS CLI configured with IAM credentials
- Terraform >= 1.0
- Node.js & npm
- Git

---

### 1. Clone the Repository

git clone https://github.com/yourusername/eventique.git
cd eventique
2. Deploy Infrastructure (Terraform)
bash
Copy
Edit
cd terraform
terraform init
terraform apply
This will:

Create Cognito User Pool and App Client

Deploy API Gateway + Lambda integrations

Provision DynamoDB tables

Setup S3 bucket and CloudFront distribution

3. Build and Deploy Frontend
bash
Copy
Edit
cd frontend
npm install
npm run build
aws s3 sync dist/ s3://<your-s3-bucket-name> --delete
Then open the CloudFront URL from Terraform output to access the site.

🧪 Usage
Sign Up / Login – Create an account via Cognito-authenticated form

Browse Events – View all available upcoming events

Register – Click "Register" on any event you like

My Events – View all events you've registered for

💻 Key Frontend Pages
AuthForm.tsx – Login/Signup logic using Cognito

Events.tsx – Browse upcoming events

EventCard.tsx – Render each event with details and action button

MyEvents.tsx – Displays registered events

CreateEvent.tsx – (Future Scope) Add new events (admin-only)

📡 Key Backend Lambda Functions
getEvents – Fetch all upcoming events

registerEvent – Register a user for an event

getMyRegistrations – List a user’s registered events

All secured via AWS API Gateway and triggered with Lambda.

📜 Future Improvements
🔧 Admin-only event creation & deletion

📤 CI/CD pipeline using GitHub Actions

📱 Mobile/PWA-friendly layout

🔍 Filtering, categories, and advanced search options

📅 Calendar integration for registered events

🙌 Acknowledgements
Special thanks to:

🎓 Dr. Naween Kumar – for mentorship, direction, and review

📄 License
This project is licensed under the MIT License.

