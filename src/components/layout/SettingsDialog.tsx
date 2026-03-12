import { useState, useEffect } from "react";
import { X, Settings, RefreshCw, ArrowUpCircle, CheckCircle2, AlertCircle, Info, Database, Trash2 } from "lucide-react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "../ui/Button";
import { useUIStore } from "../../stores/uiStore";
import { getVersion } from "@tauri-apps/api/app";
import { clearAllEdits, getEditsCount } from "../../services/dbService";

export function SettingsDialog() {
  const { isSettingsOpen, setSettingsOpen } = useUIStore();
  const [appVersion, setAppVersion] = useState<string>("");
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [editsCount, setEditsCount] = useState<number>(0);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      getVersion().then(setAppVersion);
      updateEditsCount();
    }
  }, [isSettingsOpen]);

  const updateEditsCount = async () => {
    const count = await getEditsCount();
    setEditsCount(count);
  };

  const handleClearEdits = async () => {
    if (window.confirm("确定要清空所有图片的编辑历史吗？这将导致无法撤销之前的修改。")) {
      setIsClearing(true);
      const success = await clearAllEdits();
      if (success) {
        await updateEditsCount();
      }
      setIsClearing(false);
    }
  };

  const checkForUpdates = async () => {
    setChecking(true);
    setError(null);
    setUpdateAvailable(null);

    try {
      const update = await check();
      if (update) {
        setUpdateAvailable(update);
      } else {
        setUpdateAvailable(false); // No update
      }
    } catch (err) {
      console.error("检查更新失败:", err);
      setError(String(err));
    } finally {
      setChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!updateAvailable) return;
    
    setInstalling(true);
    try {
      let downloaded = 0;
      let contentLength = 0;

      await updateAvailable.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            console.log(`Started downloading ${contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            console.log('Download finished');
            break;
        }
      });
      
      // Update installed, relaunch
      await relaunch();
    } catch (err) {
      console.error("安装更新失败:", err);
      setError(`安装失败: ${err}`);
      setInstalling(false);
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-strong)] shadow-2xl flex flex-col animate-slide-in overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">应用设置</h2>
              <p className="text-[10px] text-[var(--text-muted)]">管理应用偏好与更新</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-[var(--bg-surface-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
          {/* Storage Management */}
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                <Database className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">存储管理</p>
                <p className="text-[10px] text-[var(--text-muted)]">管理应用生成的本地缓存与历史</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)] mt-1">
              <div>
                <p className="text-[10px] font-medium text-[var(--text-secondary)]">非破坏性编辑历史</p>
                <p className="text-[9px] text-[var(--text-muted)]">{editsCount} 条记录</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearEdits}
                disabled={isClearing || editsCount === 0}
                className="h-8 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-500/5 px-3 rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                清空记录
              </Button>
            </div>
          </div>

          {/* Version Info */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                <Info className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">当前版本</p>
                <p className="text-[10px] text-[var(--text-muted)]">v{appVersion}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={checking || installing}
              onClick={checkForUpdates}
              className="h-8 text-[10px] px-3 rounded-lg"
            >
              {checking ? (
                <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3 mr-1.5" />
              )}
              检查更新
            </Button>
          </div>

          {/* Update Status */}
          {updateAvailable === true && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-medium">已经是最新版本</p>
            </div>
          )}

          {updateAvailable && typeof updateAvailable === 'object' && (
            <div className="flex flex-col gap-4 p-4 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20">
              <div className="flex items-start gap-3">
                <ArrowUpCircle className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)]">发现新版本 v{updateAvailable.version}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-2">
                    {updateAvailable.body || "没有提供更新说明。"}
                  </p>
                </div>
              </div>
              
              {installing ? (
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-[var(--bg-surface-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div 
                      className="h-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-[var(--text-muted)] text-center">正在下载并安装... {downloadProgress}%</p>
                </div>
              ) : (
                <Button 
                  className="w-full h-9 rounded-lg text-xs"
                  onClick={installUpdate}
                >
                  立即更新并重启
                </Button>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold">检查更新时出错</p>
                <p className="text-[9px] opacity-80 mt-0.5 break-words">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/50 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(false)}
            className="text-[var(--text-secondary)] text-[10px] h-8 px-4 rounded-lg"
          >
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
