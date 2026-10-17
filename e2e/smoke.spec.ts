import { expect, test } from "@playwright/test";

test("coming-soon homepage presents the new direction and planned suite", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Understand talent. Unlock human potential." })).toBeVisible();
  await expect(page.getByText(/Targeting November 2026/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Get Early Access/ }).first()).toHaveAttribute("href", /mailto:support@avenlo\.in/);
  await expect(page.getByRole("heading", { name: "Ten connected ideas. One human-centered direction." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Talent Record" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Existing user sign in" })).toHaveAttribute("href", "/login");
});

test("login page exposes accessible credentials and recovery", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");
  await expect(page.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute("href", "/forgot-password");
});

test("join page exposes candidate profile creation", async ({ page }) => {
  await page.goto("/join");
  await expect(page.getByRole("heading", { name: "Build a professional profile that goes beyond the résumé." })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
  await expect(page.getByRole("button", { name: /Continue to email verification/ })).toBeVisible();
});

test("account recovery and suspension pages render", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password." })).toBeVisible();
  await page.goto("/account-suspended");
  await expect(page.getByRole("heading", { name: /access is temporarily suspended/ })).toBeVisible();
});
