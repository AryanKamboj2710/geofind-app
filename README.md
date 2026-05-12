# GeoFind - Lost & Found Platform

![Foundly]<img width="1168" height="784" alt="wmremove-transformed" src="https://github.com/user-attachments/assets/244e9daa-f602-4473-9b5d-f4fc83a5bdf4" />
 
*A location-based platform to find lost items and connect with people nearby.*

---

## 🚀 About the Project

**GeoFind** is a full-stack web application that helps users post and find lost or found items in their local area. Users can post items with location, status (Lost/Found/Available), and connect with each other through direct messaging.

It solves the common problem of lost belongings by combining **geolocation**, **real-time communication**, and a clean user interface.

## ✨ Key Features

- ✅ User Registration & Login (JWT Authentication)
- ✅ Post Lost / Found / Available Items with Location
- ✅ Status-based Filtering
- ✅ Direct Messaging between users regarding items
- ✅ View items on map (location-based)
- ✅ Responsive Web Design
- ✅ Live deployment on Render

## 🛠️ Tech Stack

### Backend
- **Python** + **FastAPI**
- **SQLAlchemy** (ORM)
- **PostgreSQL** Database
- **JWT** Authentication
- **Pydantic** for validation

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- Responsive Design

### Deployment
- **Render.com** (Web Service + PostgreSQL)

---

## 📸 Screenshots

HOME PAGE
<img width="1917" height="868" alt="image" src="https://github.com/user-attachments/assets/1086b8cb-7306-49ad-b57a-e51b8385a327" />

REPORT ITEM WINDOW
<img width="593" height="792" alt="image" src="https://github.com/user-attachments/assets/c7151ea0-36f4-4302-b98a-ffb595bb6263" />

CHAT WINDOW
<img width="619" height="325" alt="image" src="https://github.com/user-attachments/assets/0cd2c6ef-1788-46fe-84fd-a1ab37f6273b" />



<!-- 
![Home Page](screenshots/home.png)
![Post Item](screenshots/post-item.png)
![Chat](screenshots/chat.png)
-->

---

## 🏗️ Project Structure

```
geofind-app/
├── backend/
│   ├── main.py
│   ├── models/
│   ├── schemas/
│   ├── crud/
│   ├── routers/
│   └── static/          # Frontend files
├── render.yaml
├── requirements.txt
└── README.md
```

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.9+
- PostgreSQL

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/AryanKamboj2710/geofind-app.git
   cd geofind-app
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   - Create `.env` file and add your database URL and secret key.

4. **Run the application**
   ```bash
   uvicorn backend.main:app --reload
   ```

5. Open your browser at `http://localhost:8000`

---

## 🌐 Live Demo

[View Live Project](https://geofind-app.onrender.com)  

---

## 👨‍💻 Author

**Aryan Kamboj**

- GitHub: [@AryanKamboj2710](https://github.com/AryanKamboj2710)

---

## 📄 License

This project is open for learning and personal use.

---

## ⭐ Show Your Support

If you like this project, please give it a star ⭐!
