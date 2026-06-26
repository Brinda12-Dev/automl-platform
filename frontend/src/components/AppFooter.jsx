// ═══════════════════════════════════════════════════
// COMPONENTS/APPFOOTER.JSX — Footer discret
// ═══════════════════════════════════════════════════
import { Layout } from 'antd';

const { Footer } = Layout;

export default function AppFooter() {
  return (
    <Footer style={{
      background  : '#F1F5F9',
      borderTop   : '1px solid #E2E8F0',
      padding     : '16px 32px',
    }}>
      <div style={{
        display        : 'flex',
        justifyContent : 'space-between',
        alignItems     : 'center',
        maxWidth       : 900,
        margin         : '0 auto',
        flexWrap       : 'wrap',
        gap            : 8,
      }}>
        <span style={{ color: '#64748B', fontSize: 12 }}>
          De la donnée brute à la décision intelligente
        </span>
        <span style={{ color: '#94A3B8', fontSize: 12 }}>
          FLAML · Optuna · SHAP · FastAPI · React
        </span>
      </div>
    </Footer>
  );
}