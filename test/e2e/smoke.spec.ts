import { expect, test } from "@playwright/test";

test.describe("fairway-caddie スモークテスト", () => {
	test("トップページにアプリ名が表示される", async ({ page }) => {
		await page.goto("/");
		const h1 = page.locator("h1");
		await expect(h1).toHaveText("fairway-caddie");
	});

	test("ページにh1が1つ存在する", async ({ page }) => {
		await page.goto("/");
		const h1 = page.locator("h1");
		await expect(h1).toHaveCount(1);
	});

	test("画像にalt属性がある", async ({ page }) => {
		await page.goto("/");
		const images = page.locator("img");
		const count = await images.count();
		for (let i = 0; i < count; i++) {
			const alt = await images.nth(i).getAttribute("alt");
			expect(alt).not.toBeNull();
		}
	});
});
