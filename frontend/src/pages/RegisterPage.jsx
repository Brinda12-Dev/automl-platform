// ═══════════════════════════════════════════════════
// PAGES/REGISTERPAGE.JSX — Page d'inscription
// ═══════════════════════════════════════════════════
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Input, Button, Typography, Alert, Card, Select, Row, Col, Layout, message
} from 'antd';
import {
  UserOutlined, MailOutlined, LockOutlined,
  BankOutlined, GlobalOutlined, HomeOutlined
} from '@ant-design/icons';
import Logo from '../components/Logo';
import AppFooter from '../components/AppFooter';
import { register } from '../services/auth';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const PAYS = [
  "Algérie","Angola","Bénin","Botswana","Burkina Faso","Burundi","Cameroun",
  "Cap-Vert","Centrafrique","Comores","Congo","Côte d'Ivoire","Djibouti",
  "Égypte","Érythrée","Éswatini","Éthiopie","Gabon","Gambie","Ghana",
  "Guinée","Guinée-Bissau","Guinée équatoriale","Kenya","Lesotho","Libéria",
  "Libye","Madagascar","Malawi","Mali","Maroc","Maurice","Mauritanie",
  "Mozambique","Namibie","Niger","Nigéria","Ouganda","Rwanda",
  "São Tomé-et-Príncipe","Sénégal","Seychelles","Sierra Leone","Somalie",
  "Soudan","Soudan du Sud","Tanzanie","Tchad","Togo","Tunisie",
  "Zambie","Zimbabwe","France","Belgique","Canada","Suisse","Autre"
];

const SECTEURS = [
  "Santé",
  "Agriculture",
  "Finance et microfinance",
  "Commerce et distribution",
  "Télécommunications",
  "Éducation",
  "Industrie et manufacture",
  "Logistique et transport",
  "Énergie",
  "Tourisme et hôtellerie",
  "Technologie et numérique",
  "Autre",
];

export default function RegisterPage() {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleRegister = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await register(values);
      message.success('Compte créé avec succès ! Connectez-vous pour continuer.', 3);
      setTimeout(() => navigate('/login'), 2000);
    } catch (e) {
      setError(e.response?.data?.detail || "Une erreur est survenue lors de l'inscription.");
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
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        padding: '48px 32px',
      }}>
        <Card style={{ width: 560, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Logo size={48} />
            <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
              Créer un compte
            </Title>
            <Paragraph type="secondary">
              Commencez à utiliser la plateforme gratuitement
            </Paragraph>
          </div>

          {error && (
            <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />
          )}

          <Form layout="vertical" onFinish={handleRegister}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="nom_complet"
                  label="Nom complet"
                  rules={[{ required: true, message: 'Champ requis' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Jean Dupont" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="nom_entreprise"
                  label="Nom de l'entreprise"
                  rules={[{ required: true, message: 'Champ requis' }]}
                >
                  <Input prefix={<BankOutlined />} placeholder="Ma PME" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Champ requis' },
                { type: 'email', message: 'Email invalide' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="votre@email.com" size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pays"
                  label="Pays"
                  rules={[{ required: true, message: 'Champ requis' }]}
                >
                  <Select
                    placeholder="Sélectionnez votre pays"
                    size="large"
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      option.label.toLowerCase().includes(input.toLowerCase())
                    }
                    options={PAYS.map(p => ({ value: p, label: p }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="secteur"
                  label="Secteur d'activité"
                  rules={[{ required: true, message: 'Champ requis' }]}
                >
                  <Select
                    placeholder="Sélectionnez un secteur"
                    size="large"
                    allowClear
                    options={SECTEURS.map(s => ({ value: s, label: s }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Mot de passe"
                  rules={[
                    { required: true, message: 'Champ requis' },
                    { min: 6, message: 'Au moins 6 caractères' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Mot de passe"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirm_password"
                  label="Confirmer le mot de passe"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Champ requis' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject('Les mots de passe ne correspondent pas');
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Confirmer"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                style={{ width: '100%', background: '#2563EB', borderColor: '#2563EB' }}
              >
                Créer mon compte
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <Text type="secondary">Déjà un compte ? </Text>
            <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>
              Se connecter
            </Button>
          </div>
        </Card>
      </Content>

      <AppFooter />
    </Layout>
  );
}