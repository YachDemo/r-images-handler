import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export const getDb = async () => {
  if (!db) {
    db = await Database.load("sqlite:image_studio.db");
    
    // 初始化表结构：增加 hash 字段，且 hash + path 联合识别
    // 我们不强求 hash 为主键，因为有些文件可能计算哈希失败，此时退而求其次用 path
    await db.execute(`
      CREATE TABLE IF NOT EXISTS image_edits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        hash TEXT,
        edit_sequence TEXT NOT NULL,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 为性能增加索引
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_image_path ON image_edits(path)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_image_hash ON image_edits(hash)`);
  }
  return db;
};

/**
 * 加载图片的编辑序列
 * 优先使用 hash 匹配，其次使用 path 匹配
 */
export const loadEditSequence = async (path: string, hash?: string | null): Promise<any[] | null> => {
  try {
    const database = await getDb();
    let result: any[] = [];

    // 1. 尝试使用 hash 匹配 (最可靠)
    if (hash) {
      result = await database.select<any[]>(
        "SELECT id, path, edit_sequence FROM image_edits WHERE hash = ?",
        [hash]
      );
    }

    // 2. 如果 hash 没匹配到，尝试使用 path 匹配
    if (result.length === 0) {
      result = await database.select<any[]>(
        "SELECT id, path, edit_sequence FROM image_edits WHERE path = ?",
        [path]
      );
    }
    
    if (result && result.length > 0) {
      const row = result[0];
      
      // 3. 自动同步逻辑：如果 hash 匹配但路径变了，说明文件被移动/重命名了，更新路径
      if (hash && row.path !== path) {
        database.execute("UPDATE image_edits SET path = ? WHERE id = ?", [path, row.id]).catch(console.error);
      }

      try {
        const sequenceStr = row.edit_sequence || row.EDIT_SEQUENCE || "";
        return JSON.parse(sequenceStr);
      } catch (e) {
        console.error("解析编辑序列 JSON 失败:", e);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error("加载编辑历史失败:", error);
    return null;
  }
};

/**
 * 保存图片的编辑序列
 */
export const saveEditSequence = async (path: string, sequence: any[], hash?: string | null) => {
  try {
    const database = await getDb();
    const sequenceJson = JSON.stringify(sequence);
    
    // 我们先检查是否已经存在该记录（优先 hash，其次 path）
    let existingId: number | null = null;
    
    if (hash) {
      const res = await database.select<any[]>("SELECT id FROM image_edits WHERE hash = ?", [hash]);
      if (res.length > 0) existingId = res[0].id;
    }
    
    if (!existingId) {
      const res = await database.select<any[]>("SELECT id FROM image_edits WHERE path = ?", [path]);
      if (res.length > 0) existingId = res[0].id;
    }

    if (existingId) {
      // 更新现有记录
      await database.execute(
        "UPDATE image_edits SET path = ?, hash = ?, edit_sequence = ?, last_modified = CURRENT_TIMESTAMP WHERE id = ?",
        [path, hash || null, sequenceJson, existingId]
      );
    } else {
      // 插入新记录
      await database.execute(
        "INSERT INTO image_edits (path, hash, edit_sequence, last_modified) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [path, hash || null, sequenceJson]
      );
    }
  } catch (error) {
    console.error("保存编辑历史失败:", error);
  }
};

/**
 * 清空所有编辑记录
 */
export const clearAllEdits = async () => {
  try {
    const database = await getDb();
    await database.execute("DELETE FROM image_edits");
    return true;
  } catch (error) {
    console.error("清空编辑历史失败:", error);
    return false;
  }
};

/**
 * 获取编辑历史占用的记录总数
 */
export const getEditsCount = async (): Promise<number> => {
  try {
    const database = await getDb();
    const result = await database.select<any[]>("SELECT COUNT(*) as count FROM image_edits");
    return result[0]?.count || 0;
  } catch (error) {
    return 0;
  }
};
