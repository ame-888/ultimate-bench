from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:4321/")
    page.wait_for_timeout(500)

    # Click accept cookie button if present
    cookie_btn = page.locator("button", has_text="Accept")
    if cookie_btn.is_visible():
        cookie_btn.click()
        page.wait_for_timeout(500)

    # Click expand button for chess
    page.wait_for_selector("button[data-target='chess']")
    page.click("button[data-target='chess']")

    page.wait_for_selector("#chess-benchmark-wrapper:not(.hidden)")

    chess_wrapper = page.locator("#chess-benchmark-wrapper")
    chess_wrapper.scroll_into_view_if_needed()

    page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
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
