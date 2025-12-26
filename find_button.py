#!/usr/bin/env python3
"""Find the Jump to Debug Logs button coordinates."""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

# Use Chrome
chrome_options = Options()
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=chrome_options)

try:
    # Navigate to the page
    driver.get('http://localhost:5173')
    time.sleep(2)
    
    # Find the button
    button = driver.find_element(By.XPATH, "//button[contains(text(), 'Jump to Debug')]")
    
    location = button.location
    size = button.size
    
    print(f"Button location: x={location['x']}, y={location['y']}")
    print(f"Button size: width={size['width']}, height={size['height']}")
    print(f"Button center: x={location['x'] + size['width']//2}, y={location['y'] + size['height']//2}")
    
    # Click it
    print("\nClicking button...")
    button.click()
    time.sleep(3)
    
    # Check console for log
    logs = driver.get_log('browser')
    print("\n=== Console Logs ===")
    for log in logs:
        if 'NAVIGATION' in log['message']:
            print(log['message'])
    
finally:
    driver.quit()

