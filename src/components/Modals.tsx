import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AudioManager } from '../core/AudioManager';
import { StorageManager } from '../core/StorageManager';

/**
 * 背景预览 modal 里 bgMain 若是 local:// 路径会 404。
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
  const { t } = useTranslation();

  // 把 local:// 转换为 blob URL，用于预览渲染
  const previewBgUrl = useLocalImageSrc(bgMain);

  return (
    <>
      {showCompleteModelConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '320px', textAlign: 'center' }}>
            <h3 style={{ color: '#10b981' }}>🎉 {t('model_complete_title')}</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>
              {t('model_complete_desc')}
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn yes" style={{ flex: 1 }} onClick={handleConfirmCompleteModel}>
                {t('model_complete_confirm')}
              </button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setShowCompleteModelConfirm(false); }}>
                {t('model_complete_later')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>{t('bg_preview_title')}</h3>
            <p style={{ fontSize: '12px', color: '#aaa' }}>{t('bg_preview_desc')}</p>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', height: '280px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  {previewBgUrl && <img src={previewBgUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 'bold' }}>Main</div>
                </div>
              </div>
            </div>

            <div className="custom-row">
              <span>{t('bg_object_fit')}</span>
              <select value={bgSize} onChange={e => { AudioManager.playClick(); setBgSize(e.target.value); }} style={{ padding: '6px', marginBottom: '10px' }}>
                <option value="cover">{t('bg_fit_cover')}</option>
                <option value="contain">{t('bg_fit_contain')}</option>
                <option value="fill">{t('bg_fit_fill')}</option>
              </select>

              <span>{t('bg_object_position')}</span>
              <select value={bgPosition} onChange={e => { AudioManager.playClick(); setBgPosition(e.target.value); }} style={{ padding: '6px' }}>
                <option value="center">{t('bg_pos_center')}</option>
                <option value="top">{t('bg_pos_top')}</option>
                <option value="bottom">{t('bg_pos_bottom')}</option>
                <option value="left">{t('bg_pos_left')}</option>
                <option value="right">{t('bg_pos_right')}</option>
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button onClick={() => { AudioManager.playClick(); setIsPreviewOpen(false); }} style={{ background: 'transparent', color: '#aaa' }}>
                {t('cancel')}
              </button>
              <button className="btn start" style={{ flex: 1, maxWidth: '120px' }} onClick={applyBackground}>
                {t('apply')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deferredPrompt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '320px', textAlign: 'center', border: '1px solid #3b82f6', boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📱</div>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>{t('install_title')}</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px', lineHeight: '1.5' }}>
              {t('install_desc')}
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
                {t('install_now')}
              </button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setDeferredPrompt(null); }}>
                {t('install_not_now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};