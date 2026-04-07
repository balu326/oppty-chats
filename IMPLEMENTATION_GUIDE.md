# 🚀 Implementation Guide - New Features

## Quick Start: Integrating New Components

### 1. Toast Notifications

**Step 1:** Wrap your app with ToastProvider in `main.jsx`:

```jsx
import { ToastProvider } from './components/common/ToastContainer';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChatProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ChatProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

**Step 2:** Use toast in any component:

```jsx
import { useToast } from '../components/common/ToastContainer';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Message sent successfully!');
  };

  const handleError = () => {
    toast.error('Failed to send message');
  };

  return <button onClick={handleSuccess}>Send</button>;
}
```

### 2. Image Gallery

**Usage in ChatPage.jsx:**

```jsx
import ImageGallery from '../common/ImageGallery';
import { useState } from 'react';

function ChatPage() {
  const [galleryImages, setGalleryImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handleImageClick = (imageUrl, index, allImages) => {
    setGalleryImages(allImages.map(img => ({
      url: img.url,
      sender: img.senderName,
      alt: 'Chat image'
    })));
    setGalleryIndex(index);
    setShowGallery(true);
  };

  return (
    <>
      {/* Your chat UI */}
      
      {showGallery && (
        <ImageGallery
          images={galleryImages}
          initialIndex={galleryIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
}
```

### 3. Typing Indicator

**Add to ChatPage.jsx messages section:**

```jsx
import TypingIndicator from '../common/TypingIndicator';

function ChatPage() {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  return (
    <section className="messages">
      {/* Existing messages */}
      
      {isTyping && <TypingIndicator userName={typingUser} />}
      
      <div ref={endRef} />
    </section>
  );
}
```

### 4. WebSocket Typing Events

**Add to ChatPage.jsx WebSocket handler:**

```jsx
useEffect(() => {
  const socket = new WebSocket(socketUrl);
  
  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    
    if (payload.type === 'typing') {
      setIsTyping(true);
      setTypingUser(payload.userName);
      
      // Clear after 3 seconds
      setTimeout(() => setIsTyping(false), 3000);
    } else if (payload.type === 'message') {
      receiveMessage(payload);
    }
  };
  
  return () => socket.close();
}, [chat?.id]);
```

**Send typing events:**

```jsx
const handleInputChange = (e) => {
  setText(e.target.value);
  
  // Send typing indicator
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'typing',
      userName: authUser.name,
      chatId: chat.id
    }));
  }
};
```

---

## 🎨 Styling Customization

### Color Scheme

Edit `src/index.css` or `src/App.css`:

```css
:root {
  /* Primary Colors */
  --accent: #ff6b35;           /* Orange accent */
  --accent-hover: #ff5722;     /* Darker orange */
  --accent-soft: #fff5f2;      /* Light orange bg */
  
  /* Neutral Colors */
  --bg: #fafbfc;               /* Page background */
  --panel: #ffffff;            /* Card background */
  --text: #1a1d1f;             /* Primary text */
  --text-secondary: #6f7782;   /* Secondary text */
  
  /* Change these to customize your theme */
}
```

### Custom Animations

Add to your CSS:

```css
@keyframes customSlide {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.my-element {
  animation: customSlide 0.3s ease;
}
```

---

## 🔧 Backend Integration

### 1. Typing Indicator Backend (Django Channels)

**Update `consumers.py`:**

```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'message')
        
        if message_type == 'typing':
            # Broadcast typing indicator
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user_name': data['userName'],
                    'chat_id': data['chatId']
                }
            )
        elif message_type == 'message':
            # Handle regular message
            await self.save_message(data)
    
    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'userName': event['user_name'],
            'chatId': event['chat_id']
        }))
```

### 2. Read Receipts Backend

**Add to `models.py`:**

```python
class MessageReadReceipt(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    user = models.ForeignKey(Employee, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'user')
```

**Add API endpoint in `views.py`:**

```python
@api_view(['POST'])
def mark_message_read(request, message_id):
    message = Message.objects.get(id=message_id)
    MessageReadReceipt.objects.get_or_create(
        message=message,
        user=request.user
    )
    return Response({'success': True})
```

---

## 📱 Mobile Optimization Tips

### 1. Touch-Friendly Buttons

```css
.mobile-btn {
  min-height: 44px;  /* iOS recommended */
  min-width: 44px;
  padding: 12px;
}
```

### 2. Prevent Zoom on Input Focus

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
```

### 3. Safe Area Insets

```css
.composer {
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}
```

---

## 🚀 Performance Optimization

### 1. Lazy Load Images

```jsx
<img 
  src={imageUrl} 
  loading="lazy"
  alt="Chat image"
/>
```

### 2. Virtual Scrolling for Large Chats

```bash
npm install react-window
```

```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

### 3. Debounce Search

```jsx
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((query) => {
    // Perform search
  }, 300),
  []
);
```

---

## 🔐 Security Best Practices

### 1. Sanitize User Input

```bash
npm install dompurify
```

```jsx
import DOMPurify from 'dompurify';

const sanitizedText = DOMPurify.sanitize(userInput);
```

### 2. Validate File Uploads

```jsx
const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (file.size > maxSize) {
    toast.error('File too large. Max 10MB');
    return false;
  }
  
  if (!allowedTypes.includes(file.type)) {
    toast.error('Invalid file type');
    return false;
  }
  
  return true;
};
```

### 3. Rate Limiting

```jsx
let lastMessageTime = 0;
const MESSAGE_COOLDOWN = 1000; // 1 second

const sendMessage = () => {
  const now = Date.now();
  if (now - lastMessageTime < MESSAGE_COOLDOWN) {
    toast.warning('Please wait before sending another message');
    return;
  }
  
  lastMessageTime = now;
  // Send message
};
```

---

## 🧪 Testing

### Unit Tests

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

```jsx
import { render, screen } from '@testing-library/react';
import Toast from './Toast';

test('renders toast message', () => {
  render(<Toast message="Test message" type="success" />);
  expect(screen.getByText('Test message')).toBeInTheDocument();
});
```

### E2E Tests

```bash
npm install --save-dev cypress
```

```js
describe('Chat Flow', () => {
  it('sends a message', () => {
    cy.visit('/chats/1');
    cy.get('.composerInput').type('Hello!');
    cy.get('.sendBtn').click();
    cy.contains('Hello!').should('be.visible');
  });
});
```

---

## 📦 Deployment

### Frontend (Vercel)

```bash
npm run build
vercel --prod
```

### Backend (Railway/Heroku)

```bash
# Add to requirements.txt
gunicorn==20.1.0
dj-database-url==2.0.0

# Create Procfile
web: gunicorn config.wsgi --log-file -
```

---

## 🎯 Next Steps

1. ✅ Integrate Toast notifications
2. ✅ Add Image Gallery
3. ✅ Implement Typing Indicator
4. 🔄 Add Read Receipts
5. 🔄 Implement Edit Messages
6. 🔄 Add Voice Messages
7. 🔄 Create Mobile App

---

## 💡 Pro Tips

1. **Use React DevTools** - Debug component state and props
2. **Enable Source Maps** - Better error tracking in production
3. **Monitor Performance** - Use Lighthouse for audits
4. **Progressive Enhancement** - Build features that work without JS
5. **Accessibility First** - Test with screen readers

---

## 📚 Resources

- [React Documentation](https://react.dev)
- [Django Channels](https://channels.readthedocs.io)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

---

**Happy Coding! 🚀**
