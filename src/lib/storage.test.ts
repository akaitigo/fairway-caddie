import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalStorageAdapter } from "./storage";

/** localStorage のモック */
function createMockStorage(): Storage {
	const store = new Map<string, string>();
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => {
			store.set(key, value);
		},
		removeItem: (key: string) => {
			store.delete(key);
		},
		clear: () => store.clear(),
		get length() {
			return store.size;
		},
		key: (index: number) => [...store.keys()][index] ?? null,
	};
}

describe("LocalStorageAdapter", () => {
	let adapter: LocalStorageAdapter;
	let mockStorage: Storage;

	beforeEach(() => {
		mockStorage = createMockStorage();
		// globalThis.localStorage をモックに差し替え
		Object.defineProperty(globalThis, "localStorage", {
			value: mockStorage,
			writable: true,
			configurable: true,
		});
		adapter = new LocalStorageAdapter("test");
	});

	afterEach(() => {
		mockStorage.clear();
	});

	describe("getAll", () => {
		it("空の場合は空配列を返す", () => {
			const result = adapter.getAll("items");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toEqual([]);
			}
		});

		it("保存済みデータを返す", () => {
			mockStorage.setItem("test:items", JSON.stringify([{ id: "1", name: "test" }]));
			const result = adapter.getAll<{ id: string; name: string }>("items");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toEqual([{ id: "1", name: "test" }]);
			}
		});

		it("不正なJSONの場合は空配列にリセットする", () => {
			mockStorage.setItem("test:items", "invalid json");
			const result = adapter.getAll("items");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toEqual([]);
			}
			// ストレージからも削除されている
			expect(mockStorage.getItem("test:items")).toBeNull();
		});

		it("配列でないJSON値の場合は空配列にリセットする", () => {
			mockStorage.setItem("test:items", JSON.stringify({ id: "1", name: "object" }));
			const result = adapter.getAll("items");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toEqual([]);
			}
			expect(mockStorage.getItem("test:items")).toBeNull();
		});

		it("文字列JSON値の場合は空配列にリセットする", () => {
			mockStorage.setItem("test:items", JSON.stringify("just a string"));
			const result = adapter.getAll("items");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toEqual([]);
			}
		});
	});

	describe("getById", () => {
		it("存在しないIDの場合はnullを返す", () => {
			const result = adapter.getById<{ id: string }>("items", "nonexistent");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toBeNull();
			}
		});

		it("存在するIDのアイテムを返す", () => {
			mockStorage.setItem("test:items", JSON.stringify([{ id: "1", name: "found" }]));
			const result = adapter.getById<{ id: string; name: string }>("items", "1");
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data?.name).toBe("found");
			}
		});
	});

	describe("save", () => {
		it("新規アイテムを保存する", () => {
			const result = adapter.save("items", { id: "1", name: "new" });
			expect(result.ok).toBe(true);

			const stored = adapter.getAll<{ id: string; name: string }>("items");
			expect(stored.ok).toBe(true);
			if (stored.ok) {
				expect(stored.data).toHaveLength(1);
				expect(stored.data[0]?.name).toBe("new");
			}
		});

		it("重複IDの場合はエラーを返す", () => {
			adapter.save("items", { id: "1", name: "first" });
			const result = adapter.save("items", { id: "1", name: "duplicate" });
			expect(result.ok).toBe(false);
		});
	});

	describe("update", () => {
		it("既存アイテムを更新する", () => {
			adapter.save("items", { id: "1", name: "original" });
			const result = adapter.update("items", { id: "1", name: "updated" });
			expect(result.ok).toBe(true);

			const stored = adapter.getById<{ id: string; name: string }>("items", "1");
			expect(stored.ok).toBe(true);
			if (stored.ok) {
				expect(stored.data?.name).toBe("updated");
			}
		});

		it("存在しないIDの場合はエラーを返す", () => {
			const result = adapter.update("items", {
				id: "nonexistent",
				name: "test",
			});
			expect(result.ok).toBe(false);
		});
	});

	describe("remove", () => {
		it("既存アイテムを削除する", () => {
			adapter.save("items", { id: "1", name: "to-delete" });
			const result = adapter.remove("items", "1");
			expect(result.ok).toBe(true);

			const stored = adapter.getAll<{ id: string }>("items");
			expect(stored.ok).toBe(true);
			if (stored.ok) {
				expect(stored.data).toHaveLength(0);
			}
		});

		it("存在しないIDの場合はエラーを返す", () => {
			const result = adapter.remove("items", "nonexistent");
			expect(result.ok).toBe(false);
		});
	});
});
