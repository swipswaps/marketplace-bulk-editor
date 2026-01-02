#!/usr/bin/env python3
"""
Capture console errors from existing Firefox window.
Rule 26: Use Existing Browser Window
Rule 36: Full Error Console Messages Required
"""

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import subprocess

# Get existing Firefox window
print("=== Finding Firefox Window ===")
result = subprocess.run([
    'bash', '-c',
    'DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d\\"" -f2); echo "$wid: $title"; done'
], capture_output=True, text=True)

print(result.stdout)

# Connect to existing Firefox using marionette
# Note: Firefox must have been started with -marionette flag
# Or we need to use a different approach

print("\n=== Alternative: Take Screenshot + OCR ===")
print("Since we can't easily attach to existing Firefox session,")
print("we'll use xdotool to interact with the window and capture console.")

# Find Firefox window with marketplace in title
windows = []
for line in result.stdout.strip().split('\n'):
    if line:
        wid, title = line.split(':', 1)
        windows.append((wid.strip(), title.strip()))

print(f"\nFound {len(windows)} Firefox windows")

# Activate the first Firefox window
if windows:
    wid = windows[0][0]
    print(f"\nActivating window {wid}")
    subprocess.run(['bash', '-c', f'DISPLAY=:0 xdotool windowactivate --sync {wid} && DISPLAY=:0 xdotool windowraise {wid}'])
    time.sleep(1)
    
    # Take screenshot before clicking
    print("\n=== Taking screenshot before clicking settings ===")
    subprocess.run(['bash', '-c', 'DISPLAY=:0 import -window root /tmp/firefox_before_settings.png'])
    print("Screenshot saved: /tmp/firefox_before_settings.png")
    
    # Open developer console (F12)
    print("\n=== Opening Developer Console (F12) ===")
    subprocess.run(['bash', '-c', f'DISPLAY=:0 xdotool key --window {wid} F12'])
    time.sleep(2)
    
    # Take screenshot with console open
    print("\n=== Taking screenshot with console open ===")
    subprocess.run(['bash', '-c', 'DISPLAY=:0 import -window root /tmp/firefox_console_open.png'])
    print("Screenshot saved: /tmp/firefox_console_open.png")
    
    # Click Console tab (might need to click it)
    # We'll use keyboard navigation: Ctrl+Shift+K for Web Console
    print("\n=== Opening Web Console (Ctrl+Shift+K) ===")
    subprocess.run(['bash', '-c', f'DISPLAY=:0 xdotool key --window {wid} ctrl+shift+k'])
    time.sleep(1)
    
    # Take screenshot of console
    print("\n=== Taking screenshot of console ===")
    subprocess.run(['bash', '-c', 'DISPLAY=:0 import -window root /tmp/firefox_console.png'])
    print("Screenshot saved: /tmp/firefox_console.png")
    
    # Now we need to click the settings icon
    # This is tricky - we need to find it visually or use coordinates
    print("\n=== User needs to click settings icon ===")
    print("Please click the settings icon in the browser window.")
    print("Waiting 5 seconds...")
    time.sleep(5)
    
    # Take screenshot after clicking
    print("\n=== Taking screenshot after clicking settings ===")
    subprocess.run(['bash', '-c', 'DISPLAY=:0 import -window root /tmp/firefox_after_settings.png'])
    print("Screenshot saved: /tmp/firefox_after_settings.png")
    
    # Take screenshot of console with errors
    print("\n=== Taking screenshot of console with errors ===")
    subprocess.run(['bash', '-c', 'DISPLAY=:0 import -window root /tmp/firefox_console_errors.png'])
    print("Screenshot saved: /tmp/firefox_console_errors.png")
    
    print("\n=== Running OCR on console screenshot ===")
    subprocess.run(['bash', '-c', '''
python3 << 'EOF'
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

img = Image.open('/tmp/firefox_console_errors.png')

# Scale up 2x
width, height = img.size
img = img.resize((width * 2, height * 2), Image.LANCZOS)

# Convert to grayscale
img = img.convert('L')

# Sharpen
enhancer = ImageEnhance.Sharpness(img)
img = enhancer.enhance(2.0)

# Enhance contrast
enhancer = ImageEnhance.Contrast(img)
img = enhancer.enhance(2.0)

# Reduce noise
img = img.filter(ImageFilter.MedianFilter(size=3))

# Sharpen again
enhancer = ImageEnhance.Sharpness(img)
img = enhancer.enhance(3.0)

# Run OCR
text = pytesseract.image_to_string(img, config='--oem 3 --psm 3')
print("=== CONSOLE OCR OUTPUT ===")
print(text)
EOF
'''])
    
    # Display screenshots to user
    print("\n=== Displaying screenshots in VSCode ===")
    subprocess.run(['code', '/tmp/firefox_console_errors.png'])
    subprocess.run(['code', '/tmp/firefox_after_settings.png'])

else:
    print("ERROR: No Firefox windows found!")

print("\n=== COMPLETE ===")

