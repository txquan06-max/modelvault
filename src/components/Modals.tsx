import { AudioManager } from '../core/AudioManager';

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

  // 🌟 新增：PWA 安装弹窗状态
  deferredPrompt: any;
  setDeferredPrompt: (val: any) => void;
}

export const Modals = ({
  showCompleteModelConfirm, setShowCompleteModelConfirm, handleConfirmCompleteModel,
  isPreviewOpen, setIsPreviewOpen, bgMain, bgSize, bgPosition, setBgSize, setBgPosition, applyBackground,
  deferredPrompt, setDeferredPrompt
}: ModalsProps) => {
  return (
    <>
      {showCompleteModelConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '320px', textAlign: 'center' }}>
            <h3 style={{ color: '#10b981' }}>🎉 所有部位已完成！</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>
              该模型的所有部位均已拼装完毕，是否直接完成并收入格纳库？
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn yes" style={{ flex: 1 }} onClick={handleConfirmCompleteModel}>收入格纳库</button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setShowCompleteModelConfirm(false); }}>稍后再说</button>
            </div>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <h3>背景图预览与编辑</h3>
            <p style={{ fontSize: '12px', color: '#aaa' }}>仅用于主屏预览。</p>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '160px', height: '280px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  {bgMain && <img src={bgMain} style={{ width: '100%', height: '100%', objectFit: bgSize as any, objectPosition: bgPosition }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 'bold' }}>Main</div>
                </div>
              </div>
            </div>

            <div className="custom-row">
              <span>填充模式 (Object-Fit):</span>
              <select value={bgSize} onChange={e => { AudioManager.playClick(); setBgSize(e.target.value); }} style={{ padding: '6px', marginBottom: '10px' }}>
                <option value="cover">Cover (覆盖并裁切)</option>
                <option value="contain">Contain (包含并留边)</option>
                <option value="fill">Fill (拉伸填满)</option>
              </select>
              
              <span>对齐位置 (Object-Position):</span>
              <select value={bgPosition} onChange={e => { AudioManager.playClick(); setBgPosition(e.target.value); }} style={{ padding: '6px' }}>
                <option value="center">居中 (Center)</option>
                <option value="top">顶部对齐 (Top)</option>
                <option value="bottom">底部对齐 (Bottom)</option>
                <option value="left">左对齐 (Left)</option>
                <option value="right">右对齐 (Right)</option>
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button onClick={() => { AudioManager.playClick(); setIsPreviewOpen(false); }} style={{ background: 'transparent', color: '#aaa' }}>取消</button>
              <button className="btn start" style={{ flex: 1, maxWidth: '120px' }} onClick={applyBackground}>确认应用</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 新增：PWA 安装引导 */}
      {deferredPrompt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '320px', textAlign: 'center', border: '1px solid #3b82f6', boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📱</div>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>安装到桌面</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px', lineHeight: '1.5' }}>
              将《模途》安装到您的手机或电脑桌面，体验全屏无边框的沉浸式拼装！
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
                立即安装
              </button>
              <button className="btn no" style={{ flex: 1 }} onClick={() => { AudioManager.playClick(); setDeferredPrompt(null); }}>暂不</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};