// ═══════════════════════════════════════════════════
// PAGES/LOGINPAGE.JSX — Page de connexion
// ═══════════════════════════════════════════════════
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Card, Layout } from 'antd';
import { MailOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons';
import Logo from '../components/Logo';
import AppFooter from '../components/AppFooter';
import { login, saveSession } from '../services/auth';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const from = location.state?.from || '/';

  const handleLogin = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const data = await login(values.email, values.password);
      saveSession(data.access_token, data.user);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.response?.data?.detail || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Header style={{
        background: '#1E3A5F', padding: '16px 32px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        gap: 12, height: 'auto', lineHeight: 'normal',
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
        <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
          Accueil
        </Button>
      </Header>

      <Content style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '48px 32px',
      }}>
        <Card style={{ width: 420, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Logo size={48} />
            <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
              Connexion
            </Title>
            <Paragraph type="secondary">
              Accédez à vos modèles et analyses
            </Paragraph>
          </div>

          {error && (
            <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />
          )}

          <Form layout="vertical" onFinish={handleLogin}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Veuillez saisir votre email' },
                { type: 'email', message: 'Email invalide' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="votre@email.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[{ required: true, message: 'Veuillez saisir votre mot de passe' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mot de passe"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                style={{ width: '100%', background: '#2563EB', borderColor: '#2563EB' }}
              >
                Se connecter
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary">Pas encore de compte ? </Text>
            <Button type="link" onClick={() => navigate('/register')} style={{ padding: 0 }}>
              S'inscrire
            </Button>
          </div>
        </Card>
      </Content>

      <AppFooter />
    </Layout>
  );
}