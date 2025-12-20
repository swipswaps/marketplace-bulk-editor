#!/usr/bin/env python3
"""
Just click Save button and take screenshots
"""

import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options

options = Options()
driver = webdriver.Firefox(options=options)
driver.set_window_size(1920, 1080)

os.makedirs('save_error_screenshots', exist_ok=True)

def screenshot(name):
    driver.save_screenshot(f'save_error_screenshots/{name}.png')
    print(f"  ✓ Screenshot: {name}.png")

try:
    print("\n" + "=" * 80)
    print("CLICKING SAVE BUTTON AND CAPTURING ERROR")
    print("=" * 80)
    
    # Navigate to the app
    print("\n[1] Loading app...")
    driver.get("http://localhost:5173")
    time.sleep(3)
    screenshot("01_page_loaded")
    
    # Find and click Save button (use JavaScript to bypass any overlays)
    print("\n[2] Looking for Save button...")
    try:
        save_btn = driver.find_element(By.XPATH, "//button[contains(., 'Save') and not(contains(., 'Saving'))]")
        print(f"  Found Save button")
        screenshot("02_before_click")
        
        # Click it
        print("\n[3] Clicking Save button...")
        driver.execute_script("arguments[0].click();", save_btn)
        time.sleep(3)
        screenshot("03_after_click")
        
        # Check for alert
        print("\n[4] Checking for alert...")
        try:
            alert = driver.switch_to.alert
            alert_text = alert.text
            print(f"  ALERT TEXT: {alert_text}")
            screenshot("04_alert")
            alert.accept()
        except:
            print("  No alert")
        
        time.sleep(2)
        screenshot("05_final_state")
        
        # Get console logs
        print("\n[5] Console logs:")
        logs = driver.get_log('browser')
        for log in logs[-10:]:
            print(f"  [{log['level']}] {log['message'][:150]}")
        
    except Exception as e:
        print(f"  Error: {e}")
        screenshot("ERROR")
    
    print("\n⏸️  Browser left open (10 seconds)...")
    time.sleep(10)

except Exception as e:
    print(f"\n✗ Failed: {e}")
    import traceback
    traceback.print_exc()
finally:
    driver.quit()

