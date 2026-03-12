import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export const getDb = async () => {
  if (!db) {
    // 数据库文件将存储在应用数据目录中
    db = await Database.load("sqlite:image_studio.db");
    
    // 初始化表结构
    await db.execute(`
      CREATE TABLE IF NOT EXISTS image_edits (
        path TEXT PRIMARY KEY,
        edit_sequence TEXT NOT NULL,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return db;
};

/**
 * 加载图片的编辑序列
 */
export const loadEditSequence = async (path: string): Promise<any[] | null> => {
  try {
    const database = await getDb();
    const result = await database.select<any[]>(
      "SELECT edit_sequence FROM image_edits WHERE path = ?",
      [path]
    );
    
    if (result && result.length > 0) {
      const row = result[0];
      try {
        // 在有些 SQLite 插件版本中，查询结果的字段名可能包含原表名或大小写不同
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
export const saveEditSequence = async (path: string, sequence: any[]) => {
  try {
    const database = await getDb();
    const sequenceJson = JSON.stringify(sequence);
    
    await database.execute(
      "INSERT OR REPLACE INTO image_edits (path, edit_sequence, last_modified) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [path, sequenceJson]
    );
  } catch (error) {
    console.error("保存编辑历史失败:", error);
  }
};

/**
 * 清空所有编辑记录（对应设置中的清理缓存）
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
