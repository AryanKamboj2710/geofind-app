# GeoFind - Lost & Found Platform

![GeoFind](https://via.placeholder.com/800x400/4f46e5/white?text=GeoFind)  
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

*(Add your screenshots here)*

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

[View Live Project](https://geofind-app.onrender.com)  *(Update this link with your actual Render URL)*

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
