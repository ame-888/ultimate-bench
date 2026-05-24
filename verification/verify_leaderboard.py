from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the leaderboard page
        page.goto("http://localhost:4321/")

        cookie_btn = page.locator("button", has_text="Accept")
        if cookie_btn.is_visible():
            cookie_btn.click()
            page.wait_for_timeout(500)

        # The global navigation buttons were updated to generic expand buttons for each bench
        page.wait_for_selector("button[data-target='data']")
        page.click("button[data-target='data']")

        # Wait for the data table to be visible
        page.wait_for_selector("#data-benchmark-wrapper:not(.hidden)")

        data_wrapper = page.locator("#data-benchmark-wrapper")
        data_wrapper.scroll_into_view_if_needed()

        page.screenshot(path="verification/leaderboard_data.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()
