/**
 * ローカルストレージ永続化層
 *
 * 将来の PostGIS/API 移行を見据え、StorageAdapter インターフェースで抽象化。
 * MVP ではブラウザの localStorage を使用する。
 *
 * SecurityError 対策: Safari プライベートブラウジング等で localStorage へのアクセスが
 * SecurityError を投げるケースがあるため、全アクセスを try/catch で保護する。
 *
 * マルチタブ同期: 書き込み前に最新データを re-read し、storage イベントで
 * 他タブの変更を検知してキャッシュを無効化する。
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
		// マルチタブ同期: 他タブでの書き込みを検知してキャッシュを無効化
		if (typeof window !== "undefined") {
			window.addEventListener("storage", (event) => {
				// storage イベントは「他タブ」の変更時のみ発火する。
				// 現在のタブの状態は次の read 時に最新を取得するため、
				// ここではイベントを通知用途のみに使用。
				// 将来的にリアクティブな通知が必要なら onSync コールバックを追加可能。
				if (event.key?.startsWith(`${this.prefix}:`)) {
					// キーがこのアダプタの管轄下であることを確認
					// 現状のMVPでは、次回 getAll 時に最新データを読み直すため
					// 追加の処理は不要（re-read パターンで対応済み）
				}
			});
		}
	}

	private buildKey(key: string): string {
		return `${this.prefix}:${key}`;
	}

	/**
	 * localStorage.getItem を SecurityError セーフに実行する。
	 * Safari プライベートブラウジング等では SecurityError が発生しうる。
	 */
	private safeGetItem(storageKey: string): string | null {
		try {
			return localStorage.getItem(storageKey);
		} catch {
			return null;
		}
	}

	/**
	 * localStorage.removeItem を SecurityError セーフに実行する。
	 */
	private safeRemoveItem(storageKey: string): void {
		try {
			localStorage.removeItem(storageKey);
		} catch {
			// SecurityError — 削除できなくても致命的ではない
		}
	}

	getAll<T>(key: string): StorageResult<readonly T[]> {
		const raw = this.safeGetItem(this.buildKey(key));
		if (raw === null) {
			return { ok: true, data: [] };
		}
		const result = safeParse<readonly T[]>(raw);
		if (!result.ok) {
			// 不正データをリセットして空配列を返す
			this.safeRemoveItem(this.buildKey(key));
			return { ok: true, data: [] };
		}
		if (!Array.isArray(result.data)) {
			// 配列でないデータをリセットして空配列を返す
			this.safeRemoveItem(this.buildKey(key));
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
		// 書き込み前に最新データを re-read してマルチタブ競合を軽減
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
		// 書き込み前に最新データを re-read してマルチタブ競合を軽減
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
		// 書き込み前に最新データを re-read してマルチタブ競合を軽減
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
