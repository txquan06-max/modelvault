import { useState, useEffect } from 'react';
import { AudioManager } from '../core/AudioManager';
import { StorageManager } from '../core/StorageManager';

/**
 * 🌟 Bug #6 修复：背景预览 modal 里 bgMain 若是 local:// 路径会 404。
 * 这里复用与 ModelDetail / HangarView 相同的 hook 逻辑。
 */
const useLocalImageSrc = (image?: string): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) { setUrl(null); return; }
    let objUrl: string | null = null;

    if (image.startsWith('local://')) {
      StorageManager.loadLocalFileUrl(image).then((res) => {
        if (res) { objUrl = res; setUrl(res); }
        else setUrl(null);
      });
      return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
    } else {
      setUrl(image);
    }
  }, [image]);

  return url;
};

interface ModalsProps {
  showCompleteModelConfirm: boolean;
  setShowCompleteModelConfirm: (val: boolean) => void;
  handleConfirmCompleteModel: () => void;

  isPreviewOpen: boolean;
  setIsPreviewOpen: (val: boolean) => void;
  bgMain: string;
  bgSize: string;
  bgPosition: string;
  setBgSize: (val: string) => void;
  setBgPosition: (val: string) => void;
  applyBackground: () => void;

  deferredPrompt: any;
  setDeferredPrompt: (val: any) => void;

  i18n: any;
}

export const Modals = ({
  showCompleteModelConfirm, setShowCompleteModelConfirm, handleConfirmCompleteModel,
  isPreviewOpen, setIsPreviewOpen, bgMain, bgSize, bgPosition, setBgSize, setBgPosition, applyBackground,
  deferredPrompt, setDeferredPrompt, i18n
}: ModalsProps) => {
  const isZh = i18n.language === 'zh';

  // 🌟 把 local:// 转换为 blob URL，用于预览渲染
  const previewBgUrl = useLocalImageSrc(bgMain);

  return (
    <>
      {showCompleteModelConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '320px', textAlign: 'center' }}>
            <h3 style={{ color: '#10b981' }}>🎉 {isZh ? '所有部位已完成！' : 'All parts completed!'}</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>
              {isZh ? '该模型的所有部位均已拼装完毕，是否直接完成并收入格纳库？' : 'All parts are assembled. Finish and move to hangar?'}
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn yes" style={{ flex: 1 }} onClick={handleConfirmCompleteModel}>
                {isZh ? '收入格纳库' : 'Move to Hangar'}
              </button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setShowCompleteModelConfirm(false); }}>
                {isZh ? '稍后再说' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>{isZh ? '背景图预览与编辑' : 'Background Preview & Edit'}</h3>
            <p style={{ fontSize: '12px', color: '#aaa' }}>{isZh ? '仅用于主屏预览。' : 'For main screen preview only.'}</p>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', height: '280px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  {/* 🌟 使用 previewBgUrl 而不是 bgMain，兼容 local:// */}
                  {previewBgUrl && <img src={previewBgUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 'bold' }}>Main</div>
                </div>
              </div>
            </div>

            <div className="custom-row">
              <span>{isZh ? '填充模式 (Object-Fit):' : 'Object-Fit:'}</span>
              <select value={bgSize} onChange={e => { AudioManager.playClick(); setBgSize(e.target.value); }} style={{ padding: '6px', marginBottom: '10px' }}>
                <option value="cover">{isZh ? 'Cover (覆盖并裁切)' : 'Cover'}</option>
                <option value="contain">{isZh ? 'Contain (包含并留边)' : 'Contain'}</option>
                <option value="fill">{isZh ? 'Fill (拉伸填满)' : 'Fill'}</option>
              </select>

              <span>{isZh ? '对齐位置 (Object-Position):' : 'Object-Position:'}</span>
              <select value={bgPosition} onChange={e => { AudioManager.playClick(); setBgPosition(e.target.value); }} style={{ padding: '6px' }}>
                <option value="center">{isZh ? '居中 (Center)' : 'Center'}</option>
                <option value="top">{isZh ? '顶部对齐 (Top)' : 'Top'}</option>
                <option value="bottom">{isZh ? '底部对齐 (Bottom)' : 'Bottom'}</option>
                <option value="left">{isZh ? '左对齐 (Left)' : 'Left'}</option>
                <option value="right">{isZh ? '右对齐 (Right)' : 'Right'}</option>
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button onClick={() => { AudioManager.playClick(); setIsPreviewOpen(false); }} style={{ background: 'transparent', color: '#aaa' }}>
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button className="btn start" style={{ flex: 1, maxWidth: '120px' }} onClick={applyBackground}>
                {isZh ? '确认应用' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deferredPrompt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '320px', textAlign: 'center', border: '1px solid #3b82f6', boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📱</div>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>{isZh ? '安装到桌面' : 'Install to Desktop'}</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px', lineHeight: '1.5' }}>
              {isZh
                ? '将《模途》安装到您的手机或电脑桌面，体验全屏无边框的沉浸式拼装！'
                : 'Install ModelJourney to your desktop for a fullscreen immersive experience!'}
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button
                className="btn start"
                style={{ flex: 1, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                onClick={async () => {
                  AudioManager.playAchievement();
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === 'accepted') {
                    setDeferredPrompt(null);
                  }
                }}
              >
                {isZh ? '立即安装' : 'Install Now'}
              </button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setDeferredPrompt(null); }}>
                {isZh ? '暂不' : 'Not Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};