# 🧠 Brocus - Break & Focus Timer

A beautiful, feature-rich split-screen productivity timer designed to help you maximize focus and manage breaks effectively. **Brocus** combines the Pomodoro technique with ambient soundscapes, customizable themes, and an intuitive interface.

**[🚀 Try it now →](https://m3koenig.github.io/Brocus/)**

---

## ✨ Features

### 🎯 Smart Timer Management
- **Split-Screen Design**: View focus and break timers simultaneously
- **Dual Countdowns**: Parallel tracking of work and rest periods
- **Auto-Switch**: Automatically transitions between focus and break phases
- **Quick Adjustments**: Double-click timer displays to instantly modify durations
- **Visual Progress Rings**: Animated circular progress indicators for both phases

### 🎵 Advanced Audio System
- **12+ Ambient Soundscapes**:
  - Brown Noise (Deep Focus)
  - Pink Noise (Balanced)
  - White Noise (Classic)
  - Summer Rain (Calming)
  - Ocean Waves (Soothing)
  - Fireplace (Crackling)
  - Lofi Chill Loop 🎵
  - Lofi Nostalgia 🍂
  - Cozy Café ☕
  - Sunset Lounge 🌅
  - Cosmic Drone 🌌
  - Forest Birds 🌲

- **Phase-Specific Sounds**: Set different ambient tracks for focus vs. break periods
- **Customizable Alarms**:
  - 🔔 Classic Bell
  - ⏰ Digital Alarm
  - 🎵 Gentle Harp
  - 🎉 Triumph Arpeggio
  - 🔇 Mute Mode

- **Volume Control**: Independent volume adjustment for each phase

### 🎨 Customization
- **4 Beautiful Themes**:
  - 🌊 **Deep Sea** (Calming blue)
  - 🌲 **Forest** (Natural green)
  - 🏜️ **Classic** (Warm earth tones)
  - 🌙 **Midnight** (Dark & minimalist)

- **Adjustable Durations**: Set custom focus and break lengths
- **Persistent Settings**: All preferences are saved locally

### 🕐 Smart Time Display
- **Time Projections**: See when your current session will end
- **Interval Tracking**: Watch start and end times during active sessions
- **Real-time Updates**: Continuous clock-based countdown

### 📱 Modern & Accessible
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Progressive Web App (PWA)**: Install as a standalone app
- **Offline Support**: Service worker enables offline functionality
- **Dark Mode**: Easy on the eyes during long work sessions
- **Keyboard Shortcuts**: Full control from the keyboard

---

## 🚀 Getting Started

### Try Online
Simply visit [Brocus](https://m3koenig.github.io/Brocus/) in your browser—no installation needed!

### Install as PWA
1. Open [Brocus](https://m3koenig.github.io/Brocus/) in your browser
2. Look for the "Install" option in your browser menu (or address bar)
3. Click to add Brocus to your home screen or desktop
4. Launch Brocus like any other app!

### Local Development
```bash
# Clone the repository
git clone https://github.com/m3koenig/Brocus.git
cd Brocus

# Serve locally (requires a local server)
python -m http.server 8000
# or
npx http-server
```

Then open `http://localhost:8000` in your browser.

---

## 📖 How to Use

### Basic Timer Controls
1. **Start/Pause** - Use the green play button or press Space
2. **Switch Phases** - Click the skip button or the timer display to switch between focus/break
3. **Adjust Time** - Double-click any timer display and enter a new time:
   - `1530` for 15 minutes 30 seconds
   - `25` for 25 minutes
   - `5:00` for 5 minutes

### Settings
1. Click the **⚙️ Settings** button to open the configuration panel
2. Choose your preferred **color theme**
3. Set your **focus and break durations**
4. Select **ambient sounds** for each phase
5. Choose **phase-end alarms**
6. Adjust **volume levels**
7. Click **Apply & Save** to store your preferences

### Ambient Sounds
- **Preview** any sound before applying it
- Set **different sounds** for focus and break phases
- **Volume sliders** for independent control of each phase
- Sounds loop seamlessly during your session

---

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause |
| `Esc` | Stop ambient sound |
| Click timer | Switch phase |
| Double-click timer | Edit duration |

---

## 💾 Data & Privacy

- **All settings are stored locally** in your browser's localStorage
- **No server tracking** - Your productivity data stays private
- **No account required** - Just use and enjoy!
- Your settings persist across sessions

---

## 🛠️ Technical Stack

- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first styling
- **Web Audio API** - Audio synthesis & ambient generation
- **Service Workers** - Offline functionality & PWA support
- **localStorage** - Client-side data persistence
- **Lucide Icons** - Clean, modern iconography

---

## 📁 Project Structure

```
Brocus/
├── index.html          # Main application (all-in-one)
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
├── icon-192.png       # PWA icon (192x192)
├── icon-512.png       # PWA icon (512x512)
└── README.md          # This file
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs 🐛
- Suggest new features ✨
- Submit pull requests 🔧
- Improve documentation 📝

---

## 📄 License

This project is open source and available under the MIT License.

---

## 💡 Tips for Maximum Productivity

✅ **Start with the Pomodoro standard**: 25 minutes focus, 5 minutes break  
✅ **Use ambient sounds**: Find what works best for your concentration  
✅ **Customize your alarms**: Choose sounds that gently pull you back  
✅ **Take real breaks**: Step away from your screen during break time  
✅ **Adjust durations**: Longer focus blocks are fine if you're in flow  
✅ **Install as PWA**: Keep Brocus always accessible  

---

## 🌐 Browser Support

Works on all modern browsers:
- ✅ Chrome / Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

For best results, use the latest version of your browser.

---

## 🎵 Audio Engine Notes

Brocus uses the **Web Audio API** to synthesize all ambient sounds and alarms in real-time:

- **Noise generation** uses sophisticated filtering algorithms (pink, brown noise)
- **Lofi tracks** synthesize chord progressions with warm, retro character
- **Natural sounds** (rain, waves) use procedural generation
- **All audio is generated client-side** - no external files needed!

---

**[Start your session →](https://m3koenig.github.io/Brocus/)**


*Brocus: Where focus meets breaks, and productivity meets peace. 🧠✨*
