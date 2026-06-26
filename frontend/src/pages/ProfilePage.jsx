// ═══════════════════════════════════════════════════
// PAGES/PROFILEPAGE.JSX — Page profil utilisateur
// ═══════════════════════════════════════════════════
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Typography, Card, Form, Input, Button,
  Select, Row, Col, Modal, Alert, message, Avatar, Tag
} from 'antd';
import {
  UserOutlined, MailOutlined, BankOutlined,
  LogoutOutlined, DeleteOutlined,
  SaveOutlined, LockOutlined, HomeOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import Logo from '../components/Logo';
import AppFooter from '../components/AppFooter';
import { getCurrentUser, clearSession, getToken } from '../services/auth';
import axios from 'axios';

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
  "Santé", "Agriculture", "Finance et microfinance",
  "Commerce et distribution", "Télécommunications", "Éducation",
  "Industrie et manufacture", "Logistique et transport", "Énergie",
  "Tourisme et hôtellerie", "Technologie et numérique", "Autre",
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const user     = getCurrentUser();

  const [form]    = Form.useForm();
  const [formPwd] = Form.useForm();

  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingPwd,    setLoadingPwd]    = useState(false);
  const [deleteModal,   setDeleteModal]   = useState(false);
  const [logoutModal,   setLogoutModal]   = useState(false);
  const [error,         setError]         = useState(null);

  const initial    = user?.nom_complet?.charAt(0)?.toUpperCase() || '?';
  const authHeader = { Authorization: `Bearer ${getToken()}` };

  const handleUpdate = async (values) => {
    setLoadingUpdate(true);
    setError(null);
    try {
      const res = await axios.put('/api/auth/profile', values, { headers: authHeader });
      localStorage.setItem('lw_ai_user', JSON.stringify(res.data));
      message.success('Profil mis à jour avec succès !');
    } catch (e) {
      setError(e.response?.data?.detail || "Erreur lors de la mise à jour.");
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleChangePassword = async (values) => {
    setLoadingPwd(true);
    setError(null);
    try {
      await axios.put('/api/auth/password', values, { headers: authHeader });
      message.success('Mot de passe modifié avec succès !');
      formPwd.resetFields();
    } catch (e) {
      setError(e.response?.data?.detail || "Erreur lors du changement de mot de passe.");
    } finally {
      setLoadingPwd(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete('/api/auth/profile', { headers: authHeader });
      clearSession();
      setDeleteModal(false);
      message.success('Compte supprimé avec succès.');
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } catch (e) {
      message.error("Erreur lors de la suppression du compte.");
      setDeleteModal(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setLogoutModal(false);
    window.location.href = '/';
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
              Mon profil
            </Text>
          </div>
        </div>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
          Accueil
        </Button>
      </Header>

      {/* ← NOUVEAU : flèche retour sous le header, à gauche, sans texte */}
      <div style={{ maxWidth: 700, margin: '16px auto 0', width: '100%', padding: '0 32px' }}>
        <ArrowLeftOutlined
          onClick={() => navigate(-1)}
          style={{ fontSize: 20, color: '#1E293B', cursor: 'pointer' }}
        />
      </div>

      <Content style={{ padding: '16px 32px 32px', maxWidth: 700, margin: '0 auto', width: '100%' }}>

        {/* ── Carte avatar ── */}
        <Card style={{ marginBottom: 24, borderRadius: 12, textAlign: 'center' }}>
          <Avatar
            size={72}
            style={{ background: '#2563EB', fontSize: 32, fontWeight: 'bold', marginBottom: 12 }}
          >
            {initial}
          </Avatar>
          <Title level={4} style={{ margin: 0 }}>{user?.nom_complet}</Title>
          <Text type="secondary">{user?.email}</Text>
          <br />
          <Tag color="blue" style={{ marginTop: 8 }}>{user?.secteur}</Tag>
          <Tag color="geekblue">{user?.pays}</Tag>
        </Card>

        {error && (
          <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />
        )}

        {/* ── Modifier les informations ── */}
        <Card
          title={<span><UserOutlined style={{ marginRight: 8 }} />Mes informations</span>}
          style={{ marginBottom: 24, borderRadius: 12 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            initialValues={{
              nom_complet   : user?.nom_complet,
              nom_entreprise: user?.nom_entreprise,
              email         : user?.email,
              pays          : user?.pays,
              secteur       : user?.secteur,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="nom_complet" label="Nom complet"
                  rules={[{ required: true, message: 'Champ requis' }]}>
                  <Input prefix={<UserOutlined />} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="nom_entreprise" label="Nom de l'entreprise"
                  rules={[{ required: true, message: 'Champ requis' }]}>
                  <Input prefix={<BankOutlined />} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="email" label="Email"
              rules={[{ required: true }, { type: 'email' }]}>
              <Input prefix={<MailOutlined />} size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="pays" label="Pays"
                  rules={[{ required: true, message: 'Champ requis' }]}>
                  <Select
                    showSearch
                    allowClear
                    size="large"
                    filterOption={(input, option) =>
                      option.label.toLowerCase().includes(input.toLowerCase())
                    }
                    options={PAYS.map(p => ({ value: p, label: p }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="secteur" label="Secteur d'activité"
                  rules={[{ required: true, message: 'Champ requis' }]}>
                  <Select
                    allowClear
                    size="large"
                    options={SECTEURS.map(s => ({ value: s, label: s }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large"
                loading={loadingUpdate} icon={<SaveOutlined />}
                style={{ background: '#2563EB', borderColor: '#2563EB' }}>
                Sauvegarder les modifications
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* ── Changer le mot de passe ── */}
        <Card
          title={<span><LockOutlined style={{ marginRight: 8 }} />Changer le mot de passe</span>}
          style={{ marginBottom: 24, borderRadius: 12 }}
        >
          <Form form={formPwd} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item name="current_password" label="Mot de passe actuel"
              rules={[{ required: true, message: 'Champ requis' }]}>
              <Input.Password size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="new_password" label="Nouveau mot de passe"
                  rules={[
                    { required: true },
                    { min: 6, message: 'Au moins 6 caractères' }
                  ]}>
                  <Input.Password size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="confirm_password" label="Confirmer"
                  dependencies={['new_password']}
                  rules={[
                    { required: true, message: 'Champ requis' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('new_password') === value)
                          return Promise.resolve();
                        return Promise.reject('Les mots de passe ne correspondent pas');
                      },
                    }),
                  ]}>
                  <Input.Password size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large"
                loading={loadingPwd} icon={<LockOutlined />}
                style={{ background: '#0F766E', borderColor: '#0F766E' }}>
                Changer le mot de passe
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* ── Zone danger ── */}
        <Card
          title={<span style={{ color: '#DC2626' }}>Zone de danger</span>}
          style={{ borderRadius: 12, border: '1px solid #FCA5A5' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                Se déconnecter de la plateforme.
              </Paragraph>
              <Button size="large" icon={<LogoutOutlined />}
                onClick={() => setLogoutModal(true)}>
                Se déconnecter
              </Button>
            </Col>
            <Col span={12}>
              <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                Supprimer définitivement votre compte et toutes vos données.
              </Paragraph>
              <Button danger size="large" icon={<DeleteOutlined />}
                onClick={() => setDeleteModal(true)}>
                Supprimer mon compte
              </Button>
            </Col>
          </Row>
        </Card>
      </Content>

      {/* ── Modal déconnexion ── */}
      <Modal
        title="Confirmer la déconnexion"
        open={logoutModal}
        onOk={handleLogout}
        onCancel={() => setLogoutModal(false)}
        okText="Oui, me déconnecter"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
      >
        <p>Voulez-vous vraiment vous déconnecter ? Vous devrez vous authentifier à nouveau pour effectuer des actions.</p>
      </Modal>

      {/* ── Modal suppression compte ── */}
      <Modal
        title="Supprimer mon compte"
        open={deleteModal}
        onOk={handleDeleteAccount}
        onCancel={() => setDeleteModal(false)}
        okText="Oui, supprimer définitivement"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
      >
        <p>Cette action est <strong>irréversible</strong>. Votre compte, vos modèles entraînés et toutes vos données seront définitivement supprimés.</p>
        <p>Êtes-vous sûr de vouloir continuer ?</p>
      </Modal>

      <AppFooter />
    </Layout>
  );
}