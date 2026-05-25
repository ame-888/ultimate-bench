from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:4321/")
    page.wait_for_timeout(1000)

    # Wait for the global ultimate bench to be visible
    page.wait_for_selector(".ultimate-modern-container")

    # Scroll to the table
    table = page.locator(".ultimate-modern-container")
    table.scroll_into_view_if_needed()
    page.wait_for_timeout(500)

    # Take initial screenshot (should be sorted descending)
    page.screenshot(path="/home/jules/verification/screenshots/sort_initial.png")

    # Click the sort button
    sort_btn = page.locator("#ultimate-sort-btn")
    sort_btn.click()
    page.wait_for_timeout(1000)

    # Take screenshot after clicking (should be sorted ascending)
    page.screenshot(path="/home/jules/verification/screenshots/sort_clicked.png")

    # Click it again
    sort_btn.click()
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    import os
    import glob
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

    video_files = glob.glob("/home/jules/verification/videos/*.webm")
    if video_files:
        os.rename(video_files[0], "/home/jules/verification/videos/ultimate_sort.webm")
