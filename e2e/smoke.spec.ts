import { expect, test } from "@playwright/test";

test("home page exposes primary navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Better talent decisions start with better intelligence." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Build your profile" }).first()).toHaveAttribute("href", "/join");
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
