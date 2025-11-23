# Falcon 9 Simulation - Quick Start Guide

## 🚀 Quick Start (3 Steps)

### Option 1: Using Batch File (Easiest)
```batch
# Double-click this file:
start_server.bat
```

### Option 2: Using PowerShell
```powershell
cd f:\Projects-cmodi.000\Falcon9Sim\webapp
.\start_server.ps1
```

### Option 3: Manual Start
```powershell
cd f:\Projects-cmodi.000\Falcon9Sim\webapp
python app.py
```

Then open your browser to: <http://localhost:5000>

---

## ✅ Quick Verification

1. **Check Python is installed:**
   ```powershell
   python --version
   ```
   Should show Python 3.8 or higher

2. **Check dependencies:**
   ```powershell
   pip list | Select-String "flask|pandas"
   ```

3. **Install missing dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

---

## 🔧 Troubleshooting

### Issue: "Module not found" error

**Solution:**
```powershell
cd f:\Projects-cmodi.000\Falcon9Sim\webapp
pip install flask pandas numpy
```

### Issue: Port 5000 already in use

**Solution 1 - Find and kill the process:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**Solution 2 - Use different port:**
Edit `app.py` line 119 to use a different port:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

### Issue: Blank screen or "Cannot GET /"

**Check:**
1. Server is running (you should see output in terminal)
2. You're accessing: <http://localhost:5000> (not https)
3. Check browser console (F12) for errors

### Issue: 3D visualization not loading

**Solutions:**
1. **Check browser supports WebGL:**
   - Visit: <https://get.webgl.org/>
   - Should say "Your browser supports WebGL"

2. **Try different browser:**
   - Chrome (recommended)
   - Firefox
   - Edge

3. **Clear browser cache:**
   - Press Ctrl+Shift+Del
   - Clear cached images and files

### Issue: Simulation not starting when clicking Play

**Check browser console (F12):**
1. Press F12 in browser
2. Click "Console" tab
3. Look for JavaScript errors
4. Common fixes:
   - Refresh page (Ctrl+F5)
   - Clear cache and reload

---

## 📊 What Should Happen

### When Starting Server:
```
============================================================
Falcon 9 Simulation Web Application
============================================================
Server starting...
Application will be available at: http://localhost:5000
...
 * Running on http://127.0.0.1:5000
```

### When Opening Browser:
1. **Header:** "🚀 Falcon 9 Booster Simulation"
2. **3D View:** Black space background with grid
3. **Telemetry Panel:** Shows zeros initially
4. **Controls:** Play button, speed slider, phase selector

### When Clicking Play:
1. Phase indicator shows "LAUNCH & ASCENT"
2. Telemetry values start updating
3. 3D rocket appears and moves upward
4. Charts start plotting data
5. Events log shows "Simulation started"

---

## 🎮 Controls Reference

| Control | Action |
|---------|--------|
| **Left-click + drag** | Rotate camera view |
| **Mouse wheel** | Zoom in/out |
| **Play button** | Start simulation |
| **Pause button** | Pause simulation |
| **Reset button** | Reset to initial state |
| **Speed slider** | Adjust simulation speed |
| **Phase dropdown** | Jump to specific phase |
| **Camera buttons** | Switch camera views |

---

## 🔍 Advanced Debugging

### Check all files exist:
```powershell
Test-Path f:\Projects-cmodi.000\Falcon9Sim\webapp\app.py
Test-Path f:\Projects-cmodi.000\Falcon9Sim\webapp\templates\index.html
Test-Path f:\Projects-cmodi.000\Falcon9Sim\webapp\static\js\app.js
Test-Path f:\Projects-cmodi.000\Falcon9Sim\webapp\static\js\simulation.js
Test-Path f:\Projects-cmodi.000\Falcon9Sim\webapp\static\js\visualization.js
Test-Path f:\Projects-cmodi.000\Falcon9Sim\webapp\static\js\charts.js
Test-Path f:\Projects-cmodi.000\Falcon9Sim\webapp\static\css\style.css
```

All should return `True`

### Test server is responding:
```powershell
# In another terminal while server is running:
curl http://localhost:5000/health
```

Should return: `{"status":"healthy","service":"Falcon 9 Simulation API"}`

### View server logs:
- Look at the terminal where you ran `python app.py`
- Check for errors or warnings
- Note any HTTP request errors (404, 500, etc.)

---

## 📝 Common Questions

**Q: Can I run this on another computer?**
A: Yes! Replace `localhost` with your computer's IP address

**Q: How do I stop the server?**
A: Press `Ctrl+C` in the terminal

**Q: Can I modify the simulation parameters?**
A: Yes! Edit `simulation.js` - look for the constructor values

**Q: Where is the data stored?**
A: Telemetry is in `telemetry/` folder, XML configs in `aircraft/Falcon9Booster/`

---

## 💡 Tips for Best Experience

1. **Use Chrome or Firefox** for best WebGL performance
2. **Start with 1x speed** to see details, then increase
3. **Try different camera views** during different phases
4. **Watch the event log** to understand phase transitions
5. **Monitor telemetry** especially fuel, altitude, and velocity

---

## 🆘 Still Not Working?

1. **Restart everything:**
   ```powershell
   # Close browser
   # Press Ctrl+C in terminal
   # Wait 5 seconds
   python app.py
   # Open fresh browser window
   ```

2. **Check firewall:**
   - Windows Firewall might block Python
   - Allow Python through firewall when prompted

3. **Try incognito mode:**
   - Opens browser without extensions
   - Ctrl+Shift+N (Chrome) or Ctrl+Shift+P (Firefox)

4. **Check antivirus:**
   - Some antivirus software blocks local servers
   - Temporarily disable and try again

---

## ✨ Success Checklist

- [ ] Server starts without errors
- [ ] Browser shows the application
- [ ] 3D visualization renders
- [ ] Play button starts the simulation
- [ ] Telemetry updates in real-time
- [ ] Charts plot data
- [ ] Camera controls work
- [ ] Phase transitions occur

If all checked, you're ready to explore! 🚀

---

## 📞 Support

If issues persist, check:
- Python version: `python --version` (need 3.8+)
- Pip version: `pip --version`
- Installed packages: `pip list`
- Browser version: Check "About" in browser settings

---

**Last Updated:** November 2025
**Version:** 1.0
