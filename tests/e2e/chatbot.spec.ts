import { expect, test } from "@playwright/test";

// Runs with no GEMINI_API_KEY / MAKE_WEBHOOK_URL (see playwright.config.ts),
// so answers come straight from the FAQ dataset and nothing external is called.

test("home page leads to the chat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your Questions.");
  await expect(page.getByText("Please verify important admission details with the college.")).toBeVisible();
  await page.getByRole("link", { name: "Start Chatting" }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByText("Hi! Welcome to DCE Admissions Assistant.")).toBeVisible();
});

test("main chatbot flow: suggested question, verified answer, copy, clear", async ({ page }) => {
  await page.goto("/chat");
  await page.getByRole("button", { name: "What courses does DCE offer?" }).click();

  const reply = page.getByRole("article", { name: "Assistant reply" }).last();
  await expect(reply).toContainText("B.Tech Artificial Intelligence and Data Science");
  await expect(reply.getByText("Verified source")).toBeVisible();
  await expect(reply.getByRole("link", { name: /dce\.edu\.in\/admissions-dce/ })).toHaveAttribute("href", "https://dce.edu.in/admissions-dce/");
  await expect(reply.getByRole("button", { name: "Copy answer" })).toBeVisible();

  await page.getByRole("button", { name: "Clear conversation" }).click();
  // Only the welcome message remains.
  await expect(page.getByRole("article", { name: "Assistant reply" })).toHaveCount(1);
  await expect(page.getByText("B.Tech Artificial Intelligence and Data Science")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "What courses does DCE offer?" })).toBeVisible();
});

test("unknown question gets the honest fallback without claiming it was logged", async ({ page }) => {
  await page.goto("/chat");
  const input = page.getByLabel("Type your admissions question");
  await input.fill("Is there a swimming pool on campus?");
  await input.press("Enter");

  const reply = page.getByRole("article", { name: "Assistant reply" }).last();
  await expect(reply).toContainText("I couldn’t verify that information from the available DCE sources");
  await expect(reply).toContainText("contact the admissions office");
  await expect(reply).not.toContainText("review list");
  await expect(input).toHaveValue("");
});

test("FAQ page filters by category and links into the chat", async ({ page }) => {
  await page.goto("/faqs?category=fees");
  await expect(page.getByRole("button", { name: "Fees", pressed: true })).toBeVisible();
  await expect(page.getByText("3 questions in Fees")).toBeVisible();

  await page.getByRole("button", { name: "Does DCE provide hostel facilities?" }).waitFor({ state: "detached" });
  await page.getByRole("button", { name: "Campus Facilities" }).click();
  await expect(page).toHaveURL(/category=campus-facilities/);
  const question = page.getByRole("button", { name: "Does DCE provide hostel facilities?" });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Verified generally; current availability needs confirmation")).toBeVisible();
});

test("mobile menu opens and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /menu/i });
  // Retry until React has hydrated and the click takes effect.
  await expect(async () => {
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true", { timeout: 500 });
  }).toPass();
  const nav = page.locator("#mobile-nav");
  await expect(nav.getByRole("link", { name: "Admissions", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
});
