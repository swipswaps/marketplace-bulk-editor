#!/usr/bin/env python3
"""
Test following the README.md as a new user would.
This test follows the Quick Start guide step by step.

Per Rule 9: VISIBLE mode (NOT headless), screenshots at each step, OCR verification, console logs.
"""

import time
import pytesseract
from PIL import Image
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def save_screenshot_with_ocr(driver, filename, expected_texts=None):
    """Save screenshot and verify with OCR"""
    driver.save_screenshot(filename)
    print(f"\n📸 Screenshot saved: {filename}")
    
    # OCR verification
    img = Image.open(filename)
    text = pytesseract.image_to_string(img)
    print(f"   OCR extracted text (first 200 chars): {text[:200]}")
    
    if expected_texts:
        for expected in expected_texts:
            if expected in text:
                print(f"   ✅ Found: '{expected}'")
            else:
                print(f"   ❌ NOT FOUND: '{expected}'")
    
    return text

def main():
    print("=" * 80)
    print("FOLLOWING README.md AS A NEW USER")
    print("=" * 80)
    
    # Setup Chrome with console logging
    # CRITICAL: Running in VISIBLE mode (NOT headless) per Rule 9
    options = Options()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    # DO NOT add --headless unless user explicitly requests it
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1920, 1080)
    
    try:
        # Step 1: Access Frontend (per README Quick Start)
        print("\n" + "=" * 80)
        print("STEP 1: Access Frontend at http://localhost:5173")
        print("=" * 80)
        
        driver.get("http://localhost:5173")
        time.sleep(3)  # Wait for page to load
        
        save_screenshot_with_ocr(
            driver,
            "readme_test_01_frontend_loaded.png",
            ["Marketplace", "Bulk", "Editor"]
        )
        
        # Step 2: Check Backend Status Indicator
        print("\n" + "=" * 80)
        print("STEP 2: Verify Backend Status Indicator (per README)")
        print("=" * 80)
        
        time.sleep(2)
        save_screenshot_with_ocr(
            driver,
            "readme_test_02_backend_status.png",
            ["Docker Backend", "Connected"]
        )
        
        # Step 3: Try to upload a file
        print("\n" + "=" * 80)
        print("STEP 3: Locate File Upload Area")
        print("=" * 80)
        
        time.sleep(1)
        save_screenshot_with_ocr(
            driver,
            "readme_test_03_file_upload_area.png",
            ["Upload", "file", "drag"]
        )
        
        # Step 4: Open Settings Modal
        print("\n" + "=" * 80)
        print("STEP 4: Open Settings Modal")
        print("=" * 80)

        # Find and click Settings button (gear icon)
        try:
            settings_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[title*='Settings' i]"))
            )
            settings_button.click()
            time.sleep(1)

            save_screenshot_with_ocr(
                driver,
                "readme_test_04_settings_modal_open.png",
                ["Settings", "Dark Mode"]
            )

            # Step 5: Toggle Dark Mode
            print("\n" + "=" * 80)
            print("STEP 5: Toggle Dark Mode")
            print("=" * 80)

            # Find dark mode toggle inside modal
            dark_mode_toggle = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[role='switch'], input[type='checkbox']"))
            )
            dark_mode_toggle.click()
            time.sleep(1)

            save_screenshot_with_ocr(
                driver,
                "readme_test_05_dark_mode_enabled.png",
                ["Dark Mode"]
            )

            # Close modal
            close_button = driver.find_element(By.CSS_SELECTOR, "button[aria-label*='Close' i], button:has(svg)")
            close_button.click()
            time.sleep(1)

        except Exception as e:
            print(f"   ⚠️ Could not interact with settings: {e}")
            save_screenshot_with_ocr(driver, "readme_test_04_settings_error.png")
        
        # Step 6: Capture Console Logs
        print("\n" + "=" * 80)
        print("STEP 6: Capture Console Logs")
        print("=" * 80)
        
        logs = driver.get_log('browser')
        error_count = sum(1 for entry in logs if entry['level'] == 'SEVERE')
        warning_count = sum(1 for entry in logs if entry['level'] == 'WARNING')
        
        print(f"\n📊 Console Log Summary:")
        print(f"   Total entries: {len(logs)}")
        print(f"   Errors (SEVERE): {error_count}")
        print(f"   Warnings: {warning_count}")
        
        if error_count > 0:
            print(f"\n❌ ERRORS FOUND:")
            for entry in logs:
                if entry['level'] == 'SEVERE':
                    print(f"   [{entry['level']}] {entry['message']}")
        else:
            print(f"\n✅ No errors in console")
        
        # Final screenshot
        save_screenshot_with_ocr(
            driver,
            "readme_test_06_final_state.png",
            ["Marketplace"]
        )
        
        print("\n" + "=" * 80)
        print("✅ README WORKFLOW TEST COMPLETE")
        print("=" * 80)
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()

