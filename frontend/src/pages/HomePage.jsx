// ═══════════════════════════════════════════════════
// PAGES/HOMEPAGE.JSX — Page d'accueil
// ═══════════════════════════════════════════════════
import { Layout, Typography, Row, Col, Card } from 'antd';
import {
  ExperimentOutlined, ThunderboltOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import AppFooter from '../components/AppFooter';
import UserMenu from '../components/UserMenu';        // ← NOUVEAU
import { isSessionValid } from '../services/auth';   // ← NOUVEAU

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const connected = isSessionValid();  // ← NOUVEAU : vérifie si connecté

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>

      <Header style={{
        background    : '#1E3A5F',
        padding       : '16px 32px',
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'space-between',  // ← NOUVEAU
        gap           : 12,
        boxShadow     : '0 2px 8px rgba(0,0,0,0.15)',
        height        : 'auto',
        lineHeight    : 'normal',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Logo size={36} />
          <div>
            <Title level={4} style={{ color: 'white', margin: 0, lineHeight: 1.3 }}>
              Lightweight AI Platform
            </Title>
            <Text style={{ color: '#93C5FD', fontSize: 12 }}>
              Democratisation du ML pour les PME africaines
            </Text>
          </div>
        </div>

        {/* ← NOUVEAU : afficher UserMenu uniquement si connecté */}
        {connected && <UserMenu />}
      </Header>

      <Content style={{ padding: '48px 32px', maxWidth: 900, margin: '0 auto', width: '100%' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Que souhaitez-vous faire ?
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 15 }}>
            Entraînez un nouveau modèle ou utilisez un modèle existant
            pour faire une prédiction.
          </Paragraph>
        </div>

        <Row gutter={24}>
          <Col span={12}>
            <Card
              hoverable
              onClick={() => navigate('/train')}
              style={{
                borderRadius: 16, height: 280,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center',
                border: '2px solid #BFDBFE',
              }}
              styles={{ body: { textAlign: 'center', padding: 32 } }}
            >
              <ExperimentOutlined style={{ fontSize: 56, color: '#2563EB', marginBottom: 16 }} />
              <Title level={3} style={{ marginBottom: 8 }}>
                Nouvelle analyse
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Chargez un dataset, configurez l'optimisation AutoML
                (FLAML ou Optuna) et obtenez un modèle entraîné avec
                explications SHAP.
              </Paragraph>
              <Text strong style={{ color: '#2563EB' }}>
                Commencer <ArrowRightOutlined />
              </Text>
            </Card>
          </Col>

          <Col span={12}>
            <Card
              hoverable
              onClick={() => navigate('/predict')}
              style={{
                borderRadius: 16, height: 280,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center',
                border: '2px solid #DDD6FE',
              }}
              styles={{ body: { textAlign: 'center', padding: 32 } }}
            >
              <ThunderboltOutlined style={{ fontSize: 56, color: '#7C3AED', marginBottom: 16 }} />
              <Title level={3} style={{ marginBottom: 8 }}>
                Faire une prédiction
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Utilisez un modèle déjà entraîné pour prédire le résultat
                d'un nouveau cas (ex : nouveau patient, nouveau client).
              </Paragraph>
              <Text strong style={{ color: '#7C3AED' }}>
                Prédire <ArrowRightOutlined />
              </Text>
            </Card>
          </Col>
        </Row>

      </Content>

      <AppFooter />
    </Layout>
  );
}