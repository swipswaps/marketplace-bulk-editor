#!/usr/bin/env python3
"""
Capture Firefox console errors using Selenium with geckodriver.
Rule 36: Full Error Console Messages Required
Rule 9: End-to-End Workflow Proof & Selenium Testing
Rule 26: Use Existing Browser Window (connect to existing Firefox)
"""

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json

print("=== Firefox Console Capture ===")
print("Rule 36: Full Error Console Messages Required")
print("Rule 9: Selenium Testing with Console Logging")
print()

# Firefox options with console logging
options = Options()
options.set_preference('devtools.console.stdout.content', True)
options.set_preference('devtools.debugger.remote-enabled', True)

# Start new Firefox session (geckodriver doesn't support attaching to existing)
print("Starting Firefox with console logging enabled...")
driver = webdriver.Firefox(options=options)

try:
    print("\n=== STEP 1: Load Application ===")
    driver.get('http://localhost:5174')
    print("Loaded: http://localhost:5174")
    time.sleep(3)
    
    # Get initial console logs
    print("\n=== STEP 2: Capture Initial Console Logs ===")
    initial_logs = driver.get_log('browser')
    
    print(f"Found {len(initial_logs)} initial console entries")
    
    with open('/tmp/firefox_console_initial.json', 'w') as f:
        json.dump(initial_logs, f, indent=2)
    print("Saved to: /tmp/firefox_console_initial.json")
    
    # Print initial errors
    print("\n=== Initial Console Errors ===")
    initial_errors = [log for log in initial_logs if log['level'] in ['SEVERE', 'ERROR', 'WARNING']]
    if initial_errors:
        for entry in initial_errors:
            print(f"\n[{entry['level']}] {entry['source']}")
            print(f"Message: {entry['message']}")
            print(f"Timestamp: {entry['timestamp']}")
    else:
        print("✅ No errors on initial load")
    
    # Take screenshot before clicking
    driver.save_screenshot('/tmp/firefox_before_settings.png')
    print("\nScreenshot saved: /tmp/firefox_before_settings.png")
    
    print("\n=== STEP 3: Find Settings Button ===")
    
    # Wait for page to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    
    # Find settings button
    settings_button = None
    
    # Try finding by SVG class
    try:
        settings_icon = driver.find_element(By.CSS_SELECTOR, "svg.lucide-settings")
        settings_button = settings_icon.find_element(By.XPATH, "./ancestor::button")
        print("✅ Found settings button via SVG icon")
    except Exception as e:
        print(f"❌ Could not find settings button: {e}")
        driver.save_screenshot('/tmp/firefox_no_settings.png')
        print("Screenshot saved: /tmp/firefox_no_settings.png")
        
        # Save page source
        with open('/tmp/firefox_page_source.html', 'w') as f:
            f.write(driver.page_source)
        print("Page source saved: /tmp/firefox_page_source.html")
        
        raise
    
    print("\n=== STEP 4: Click Settings Button ===")
    settings_button.click()
    print("Clicked settings button")
    time.sleep(2)
    
    # Take screenshot after clicking
    driver.save_screenshot('/tmp/firefox_after_settings.png')
    print("Screenshot saved: /tmp/firefox_after_settings.png")
    
    print("\n=== STEP 5: Capture Console Logs After Click ===")
    
    # Get all console logs after click
    after_logs = driver.get_log('browser')
    
    print(f"Found {len(after_logs)} console entries after click")
    
    with open('/tmp/firefox_console_after_click.json', 'w') as f:
        json.dump(after_logs, f, indent=2)
    print("Saved to: /tmp/firefox_console_after_click.json")
    
    # Print errors after click
    print("\n=== Console Errors After Click ===")
    after_errors = [log for log in after_logs if log['level'] in ['SEVERE', 'ERROR']]
    
    if after_errors:
        print(f"❌ FOUND {len(after_errors)} ERRORS!")
        for entry in after_errors:
            print(f"\n{'='*60}")
            print(f"[{entry['level']}] {entry['source']}")
            print(f"Timestamp: {entry['timestamp']}")
            print(f"Message:")
            print(entry['message'])
            print('='*60)
    else:
        print("✅ NO ERRORS FOUND")
    
    # Save human-readable error log
    with open('/tmp/firefox_console_errors.txt', 'w') as f:
        f.write("=== Firefox Console Errors ===\n")
        f.write(f"Captured at: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"URL: http://localhost:5174\n\n")
        
        if after_errors:
            f.write(f"FOUND {len(after_errors)} ERRORS:\n\n")
            for i, entry in enumerate(after_errors, 1):
                f.write(f"Error {i}:\n")
                f.write(f"Level: {entry['level']}\n")
                f.write(f"Source: {entry['source']}\n")
                f.write(f"Timestamp: {entry['timestamp']}\n")
                f.write(f"Message:\n{entry['message']}\n")
                f.write("\n" + "="*60 + "\n\n")
        else:
            f.write("✅ NO ERRORS FOUND\n")
    
    print("\nHuman-readable log saved: /tmp/firefox_console_errors.txt")
    
    print("\n=== STEP 6: Check for Error Boundary ===")
    
    try:
        error_boundary = driver.find_element(By.XPATH, "//*[contains(text(), 'Something Went Wrong')]")
        print("❌ ERROR BOUNDARY DETECTED!")
        print(f"Error text: {error_boundary.text}")
        
        # Save page source with error
        with open('/tmp/firefox_error_page.html', 'w') as f:
            f.write(driver.page_source)
        print("Error page source saved: /tmp/firefox_error_page.html")
        
    except:
        print("✅ No error boundary - settings modal should be open")

finally:
    print("\n=== CLEANUP ===")
    driver.quit()
    print("Browser closed")

print("\n=== FILES CREATED ===")
print("1. /tmp/firefox_console_initial.json - Initial console logs (JSON)")
print("2. /tmp/firefox_console_after_click.json - Console logs after click (JSON)")
print("3. /tmp/firefox_console_errors.txt - Human-readable error log")
print("4. /tmp/firefox_before_settings.png - Screenshot before click")
print("5. /tmp/firefox_after_settings.png - Screenshot after click")
print("\n=== DISPLAYING ERROR LOG ===")

# Display the error log
import subprocess
subprocess.run(['cat', '/tmp/firefox_console_errors.txt'])
subprocess.run(['code', '/tmp/firefox_console_errors.txt'])

