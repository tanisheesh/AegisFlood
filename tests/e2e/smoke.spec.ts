import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/playground", "/network", "/how-it-works"] as const;

test.describe("smoke, layout, and accessibility", () => {
  for (const route of ROUTES) {
    test(`renders ${route} cleanly without errors, overflow, or WCAG AA violations`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const serverErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });
      page.on("response", (res) => {
        if (res.status() >= 500) {
          serverErrors.push(`${res.status()} ${res.url()}`);
        }
      });

      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response).not.toBeNull();
      expect(response?.status()).toBeLessThan(400);

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalOverflow).toBe(false);

      const a11y = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const severe = a11y.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(severe).toEqual([]);

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(serverErrors).toEqual([]);
    });
  }

  test("health API returns 200 ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("aegisflood");
  });

  test("playground interactive Kalman debris rejection, OTA flash, and CAP broadcast work", async ({
    page,
  }) => {
    await page.goto("/playground", { waitUntil: "networkidle" });

    // Inject floating timber debris spike on NODE-03
    await page.getByRole("button", { name: /SONAR DEBRIS SPIKE/i }).click();
    await expect(page.getByText(/DEBRIS SPIKE DETECTED/i)).toBeVisible();

    // Flash OTA firmware constants
    await page.getByRole("tab", { name: /C\+\+ PATCHER/i }).click();
    await page.getByRole("button", { name: /FLASH OTA FIRMWARE/i }).click();
    await expect(page.getByRole("status")).toContainText(/FLASHED ESP32-S3 OTA/i);

    // Dispatch simulated CAP v1.2 bulletin via /api/telegram
    await page.getByRole("tab", { name: /CAP & TELEGRAM/i }).click();
    await page.getByRole("button", { name: /DISPATCH CAP \/ TELEGRAM ALERT/i }).click();
    await expect(page.getByRole("status")).toContainText(/SIMULATED_CAP_BROADCAST/i);
  });
});
