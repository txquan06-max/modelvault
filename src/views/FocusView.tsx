import { FocusPanel } from '../components/FocusPanel';

/**
 * FocusView 极简化（批次 10E）
 * FocusPanel 已零 props 化，本视图只负责切换 isPip=false 的布局
 */
export const FocusView = () => {
  return <FocusPanel isPip={false} />;
};