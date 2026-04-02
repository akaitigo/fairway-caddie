/**
 * ローカルストレージ永続化層
 *
 * 将来の PostGIS/API 移行を見据え、StorageAdapter インターフェースで抽象化。
 * MVP ではブラウザの localStorage を使用する。
 */

/** ストレージ操作の結果 */
export type StorageResult<T> = { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: string };

/** ストレージアダプタのインターフェース */
export interface StorageAdapter {
	getAll<T>(key: string): StorageResult<readonly T[]>;
	getById<T extends { id: string }>(key: string, id: string): StorageResult<T | null>;
	save<T extends { id: string }>(key: string, item: T): StorageResult<T>;
	update<T extends { id: string }>(key: string, item: T): StorageResult<T>;
	remove(key: string, id: string): StorageResult<void>;
}

/** localStorage から安全にパースする */
function safeParse<T>(raw: string): StorageResult<T> {
	try {
		const data: unknown = JSON.parse(raw);
		return { ok: true, data: data as T };
	} catch {
		return { ok: false, error: "データのパースに失敗しました" };
	}
}

/** localStorage ベースのストレージアダプタ */
export class LocalStorageAdapter implements StorageAdapter {
	private readonly prefix: string;

	constructor(prefix = "fairway-caddie") {
		this.prefix = prefix;
	}

	private buildKey(key: string): string {
		return `${this.prefix}:${key}`;
	}

	getAll<T>(key: string): StorageResult<readonly T[]> {
		const raw = localStorage.getItem(this.buildKey(key));
		if (raw === null) {
			return { ok: true, data: [] };
		}
		const result = safeParse<readonly T[]>(raw);
		if (!result.ok) {
			// 不正データをリセットして空配列を返す
			localStorage.removeItem(this.buildKey(key));
			return { ok: true, data: [] };
		}
		if (!Array.isArray(result.data)) {
			// 配列でないデータをリセットして空配列を返す
			localStorage.removeItem(this.buildKey(key));
			return { ok: true, data: [] };
		}
		return result;
	}

	getById<T extends { id: string }>(key: string, id: string): StorageResult<T | null> {
		const result = this.getAll<T>(key);
		if (!result.ok) {
			return result;
		}
		const found = result.data.find((item) => item.id === id);
		return { ok: true, data: found ?? null };
	}

	save<T extends { id: string }>(key: string, item: T): StorageResult<T> {
		const result = this.getAll<T>(key);
		if (!result.ok) {
			return result;
		}

		const existing = result.data.find((i) => i.id === item.id);
		if (existing) {
			return { ok: false, error: `ID ${item.id} は既に存在します` };
		}

		const updated = [...result.data, item];
		try {
			localStorage.setItem(this.buildKey(key), JSON.stringify(updated));
			return { ok: true, data: item };
		} catch {
			return { ok: false, error: "ストレージへの書き込みに失敗しました" };
		}
	}

	update<T extends { id: string }>(key: string, item: T): StorageResult<T> {
		const result = this.getAll<T>(key);
		if (!result.ok) {
			return result;
		}

		const index = result.data.findIndex((i) => i.id === item.id);
		if (index === -1) {
			return { ok: false, error: `ID ${item.id} が見つかりません` };
		}

		const updated = [...result.data];
		updated[index] = item;
		try {
			localStorage.setItem(this.buildKey(key), JSON.stringify(updated));
			return { ok: true, data: item };
		} catch {
			return { ok: false, error: "ストレージへの書き込みに失敗しました" };
		}
	}

	remove(key: string, id: string): StorageResult<void> {
		const result = this.getAll<{ id: string }>(key);
		if (!result.ok) {
			return result;
		}

		const filtered = result.data.filter((i) => i.id !== id);
		if (filtered.length === result.data.length) {
			return { ok: false, error: `ID ${id} が見つかりません` };
		}

		try {
			localStorage.setItem(this.buildKey(key), JSON.stringify(filtered));
			return { ok: true, data: undefined };
		} catch {
			return { ok: false, error: "ストレージへの書き込みに失敗しました" };
		}
	}
}
