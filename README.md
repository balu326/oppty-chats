# 💬 Oppty Chats - Modern Team Communication Platform

<div align="center">

![Oppty Chats](https://img.shields.io/badge/Oppty-Chats-ff6b35?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-green?style=for-the-badge)

**A beautiful, modern, and feature-rich team chat application built with React and Django**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Screenshots](#-screenshots) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🎨 **Modern UI/UX Design**
- ✅ **Minimal & Clean Interface** - Beautiful gradient accents, smooth animations
- ✅ **Fully Responsive** - Perfect on desktop, tablet, and mobile devices
- ✅ **Dark Sidebar** - Professional dark theme with light chat area
- ✅ **Smooth Animations** - Micro-interactions and transitions throughout
- ✅ **Custom Scrollbars** - Sleek, modern scrollbar design
- ✅ **Loading States** - Beautiful loading animations and skeletons

### 💬 **Core Chat Features**
- ✅ **Real-time Messaging** - Instant message delivery via WebSocket
- ✅ **Direct Messages (DM)** - One-on-one conversations
- ✅ **Group Chats** - Create and manage team groups
- ✅ **Message Status** - Sent, delivered, and read indicators
- ✅ **Typing Indicator** - See when someone is typing
- ✅ **Read Receipts** - Know when messages are read
- ✅ **Online Status** - Real-time online/offline indicators
- ✅ **Last Seen** - View last active timestamps

### 📎 **Rich Media & Attachments**
- ✅ **Image Sharing** - Send and view images with gallery viewer
- ✅ **Video Sharing** - Upload and play videos inline
- ✅ **Document Sharing** - Share any file type (PDF, DOCX, etc.)
- ✅ **Link Sharing** - Share URLs with preview
- ✅ **Camera Integration** - Take photos directly from chat
- ✅ **Image Gallery** - Beautiful full-screen image viewer with zoom
- ✅ **Drag & Drop** - Easy file upload by dragging

### 🎯 **Message Actions**
- ✅ **Reply to Messages** - Quote and reply to specific messages
- ✅ **Forward Messages** - Forward to other chats
- ✅ **Delete Messages** - Remove sent messages
- ✅ **Message Selection** - Select multiple messages for bulk actions
- ✅ **Copy Text** - Copy message content
- ✅ **Emoji Reactions** - React with emojis (👍 ❤️ 😂 😮 😢 🙏)
- ✅ **Quick Emojis** - Fast emoji picker

### 🔍 **Search & Discovery**
- ✅ **In-Chat Search** - Search within conversations
- ✅ **Message Highlighting** - Highlighted search results
- ✅ **Navigation** - Jump between search results
- ✅ **Global Search** - Search across all chats (coming soon)

### 👥 **Group Management**
- ✅ **Create Groups** - Start team conversations
- ✅ **Add Members** - Invite team members to groups
- ✅ **Remove Members** - Manage group participants
- ✅ **Group Info** - View group details and members
- ✅ **Admin Controls** - Special permissions for admins
- ✅ **Admins Only Mode** - Restrict messaging to admins

### 🔒 **Admin Features**
- ✅ **Super Admin Dashboard** - Comprehensive admin panel
- ✅ **User Management** - Create and manage employees
- ✅ **Block/Unblock** - Control chat access
- ✅ **Delete Chats** - Remove conversations
- ✅ **Group Controls** - Full group management
- ✅ **Role-based Access** - Different permissions for roles

### 🔔 **Notifications**
- ✅ **Unread Badges** - Visual indicators for unread messages
- ✅ **Toast Notifications** - Beautiful success/error messages
- ✅ **Sound Alerts** - Audio notifications (coming soon)
- ✅ **Desktop Notifications** - Browser push notifications (coming soon)

### 🎨 **User Experience**
- ✅ **Profile Management** - Update name, photo, bio
- ✅ **Avatar Support** - Custom profile pictures
- ✅ **Keyboard Shortcuts** - Quick actions with keyboard
- ✅ **Smooth Scrolling** - Buttery smooth chat scrolling
- ✅ **Auto-scroll** - Jump to latest messages
- ✅ **Message Timestamps** - Day separators and time stamps

### 🔐 **Security & Privacy**
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Reset** - OTP-based password recovery
- ✅ **Session Management** - Secure session handling
- ✅ **Role-based Permissions** - Granular access control

### 📱 **Mobile Optimized**
- ✅ **Bottom Navigation** - Mobile-friendly nav bar
- ✅ **Touch Gestures** - Swipe and tap interactions
- ✅ **Responsive Layout** - Adapts to all screen sizes
- ✅ **Safe Area Support** - Works with notched devices

---

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- pip and virtualenv

### Backend Setup (Django)

```bash
# Navigate to backend directory
cd oppty_chats/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup (React)

```bash
# Navigate to frontend directory
cd oppty_chats/frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your backend URL
# VITE_API_URL=http://localhost:8000/api

# Start development server
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

---

## 📖 Usage

### For Regular Users

1. **Login** - Use your employee credentials
2. **Start Chatting** - Click on a contact to start messaging
3. **Send Messages** - Type and press Enter or click send
4. **Attach Files** - Click the + button to attach images, videos, or documents
5. **React to Messages** - Long press or right-click to react
6. **Search** - Use the search icon to find messages

### For Admins

1. **Access Admin Panel** - Click on "Hub" in the sidebar
2. **Create Employees** - Add new team members
3. **Create Groups** - Set up team channels
4. **Manage Permissions** - Control who can do what
5. **Monitor Activity** - View chat statistics

---

## 🎨 Screenshots

### Desktop View
```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  [Chat List]  │  [Chat Window]               │
│             │                │                               │
│   Chats     │  Elena         │  ┌─────────────────────┐    │
│   Groups    │  Dhamodhar     │  │  Elena              │    │
│   Meet      │  Oppty Team    │  │  online             │    │
│   Hub       │                │  └─────────────────────┘    │
│             │                │                               │
│   Profile   │                │  Messages...                 │
└─────────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌───────────────────────┐
│  [Chat Window]        │
│  ← Elena              │
│  ─────────────────    │
│                       │
│  Messages...          │
│                       │
│  [Composer]           │
│  ─────────────────    │
│  [Chats][Groups][+]   │
└───────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Context API** - State management
- **CSS3** - Styling with custom properties
- **Vite** - Build tool
- **WebSocket** - Real-time communication

### Backend
- **Django 4.2** - Web framework
- **Django Channels** - WebSocket support
- **Django REST Framework** - API
- **SQLite/PostgreSQL** - Database
- **JWT** - Authentication

---

## 📁 Project Structure

```
oppty_chats/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/          # Chat components
│   │   │   ├── chatList/      # Chat list
│   │   │   ├── common/        # Shared components
│   │   │   └── sidebar/       # Navigation
│   │   ├── context/           # React context
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Utilities
│   │   ├── App.jsx            # Main app
│   │   └── main.jsx           # Entry point
│   ├── public/                # Static assets
│   └── package.json
│
└── backend/
    ├── chatapp/               # Main app
    │   ├── models.py          # Database models
    │   ├── views.py           # API views
    │   ├── consumers.py       # WebSocket consumers
    │   ├── serializers.py     # DRF serializers
    │   └── urls.py            # URL routing
    ├── config/                # Django settings
    ├── manage.py
    └── requirements.txt
```

---

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Real-time messaging
- [x] User authentication
- [x] Group chats
- [x] File attachments
- [x] Modern UI design

### Phase 2: Enhanced Features 🚧
- [x] Typing indicators
- [x] Read receipts
- [x] Message reactions
- [x] Image gallery
- [x] Toast notifications
- [ ] Edit messages
- [ ] Pin messages
- [ ] @mentions

### Phase 3: Advanced Features 📋
- [ ] Voice messages
- [ ] Video calls
- [ ] Screen sharing
- [ ] Message threading
- [ ] Advanced search
- [ ] Analytics dashboard

### Phase 4: Mobile & PWA 📱
- [ ] Progressive Web App
- [ ] Offline support
- [ ] Push notifications
- [ ] Native mobile app

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by the Oppty Team

- **Design** - Modern, minimal UI/UX
- **Frontend** - React, WebSocket, Context API
- **Backend** - Django, Channels, DRF
- **DevOps** - Docker, CI/CD (coming soon)

---

## 📞 Support

Need help? We're here for you!

- 📧 Email: support@oppty.com
- 💬 Chat: Join our community
- 📚 Docs: [Documentation](https://docs.oppty.com)
- 🐛 Issues: [GitHub Issues](https://github.com/oppty/chats/issues)

---

## 🙏 Acknowledgments

- Icons from [Heroicons](https://heroicons.com/)
- Avatars from [Pravatar](https://pravatar.cc/)
- Inspiration from WhatsApp, Slack, and Discord

---

<div align="center">

**Made with ❤️ and ☕ by Oppty Team**

⭐ Star us on GitHub if you like this project!

</div>
