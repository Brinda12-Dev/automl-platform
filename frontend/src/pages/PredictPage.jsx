// ═══════════════════════════════════════════════════
// PAGES/PREDICTPAGE.JSX — Prédiction sur un modèle entraîné
// ═══════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Layout, Typography, Select, Form, InputNumber, Button,
  Card, Tag, Alert, Spin, Row, Col, Statistic, Divider, Empty
} from 'antd';
import {
  HomeOutlined, ThunderboltOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import Logo from '../components/Logo';
import AppFooter from '../components/AppFooter';
import UserMenu from '../components/UserMenu';  // ← NOUVEAU
import { listExperiments, predict } from '../services/api';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function PredictPage() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const preselectedId = location.state?.experimentId;

  const [experiments, setExperiments] = useState([]);
  const [loadingExps, setLoadingExps] = useState(true);
  const [selectedExp, setSelectedExp] = useState(null);
  const [form]                        = Form.useForm();
  const [predicting,  setPredicting]  = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    listExperiments()
      .then((data) => {
        const done = data.filter((e) => e.status === 'done');

        const bestByConfig = {};
        done.forEach((e) => {
          const key = `${e.target_column}_${e.framework}_${e.time_budget}`;
          if (!bestByConfig[key] || (e.f1_score || 0) > (bestByConfig[key].f1_score || 0)) {
            bestByConfig[key] = e;
          }
        });
        const deduped = Object.values(bestByConfig);
        setExperiments(deduped);

        if (preselectedId) {
          const found = deduped.find((e) => e.id === preselectedId);
          if (found) setSelectedExp(found);
        }
      })
      .finally(() => setLoadingExps(false));
  }, [preselectedId]);

  const handleSelectExperiment = (expId) => {
    const exp = experiments.find((e) => e.id === expId);
    setSelectedExp(exp);
    setResult(null);
    setError(null);
    form.resetFields();
  };

  const handlePredict = async (values) => {
    setPredicting(true);
    setError(null);
    setResult(null);
    try {
      const data = await predict(selectedExp.id, values);
      setResult(data);
    } catch (e) {
      setError("Erreur lors de la prediction. Verifiez les valeurs saisies.");
    } finally {
      setPredicting(false);
    }
  };

  const frameworkColor = selectedExp?.framework === 'optuna' ? '#7C3AED' : '#2563EB';

  const formatBudget = (seconds) => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s`;
    return `${seconds / 60} min`;
  };

  const isBinary = result?.probabilities && result.probabilities.length === 2;

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>

      <Header style={{
        background    : '#1E3A5F',
        padding       : '16px 32px',
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'space-between',
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
              Mode prediction
            </Text>
          </div>
        </div>

        {/* ← NOUVEAU : UserMenu + bouton Accueil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
            Accueil
          </Button>
          <UserMenu />
        </div>
      </Header>

      <Content style={{ padding: '32px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
        <div style={{
          background: 'white', borderRadius: 12, padding: 32,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>

          <Title level={3} style={{ marginBottom: 8 }}>
            <ThunderboltOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
            Faire une prediction
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Selectionnez un modele entraine, saisissez les informations
            du nouveau cas, et obtenez une prediction instantanee.
          </Paragraph>

          {loadingExps ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : experiments.length === 0 ? (
            <Empty
              description="Aucun modele entraine disponible. Lancez d'abord une analyse."
              style={{ padding: 40 }}
            >
              <Button type="primary" onClick={() => navigate('/train')}>
                Nouvelle analyse
              </Button>
            </Empty>
          ) : (
            <>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Modele a utiliser
              </Text>
              <Select
                placeholder="Choisissez un modele entraine"
                style={{ width: '100%', marginBottom: 24 }}
                value={selectedExp?.id}
                onChange={handleSelectExperiment}
                options={experiments.map((e) => ({
                  value: e.id,
                  label: `Cible : ${e.target_column} ; Moteur :  ${e.framework?.toUpperCase()} (${formatBudget(e.time_budget)}) ; Socre : F1 = ${e.f1_score?.toFixed(3) || 'N/A'}`,
                }))}
              />

              {selectedExp && (
                <Card
                  size="small"
                  style={{ marginBottom: 24, borderLeft: `4px solid ${frameworkColor}` }}
                >
                  <Row gutter={16}>
                    <Col span={6}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Cible</Text>
                      <br />
                      <Text strong>{selectedExp.target_column}</Text>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Modele</Text>
                      <br />
                      <Tag color={frameworkColor}>{selectedExp.best_model?.toUpperCase()}</Tag>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" style={{ fontSize: 12 }}>F1-Score</Text>
                      <br />
                      <Text strong style={{ color: '#16A34A' }}>
                        {selectedExp.f1_score?.toFixed(4) || 'N/A'}
                      </Text>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Moteur / Budget</Text>
                      <br />
                      <Tag color={frameworkColor}>
                        {selectedExp.framework?.toUpperCase()} ({formatBudget(selectedExp.time_budget)})
                      </Tag>
                    </Col>
                  </Row>
                </Card>
              )}

              {selectedExp && (
                <>
                  <Divider />
                  <Text strong style={{ display: 'block', marginBottom: 16 }}>
                    Informations du nouveau cas
                  </Text>

                  <Form form={form} layout="vertical" onFinish={handlePredict}>
                    <Row gutter={16}>
                      {(selectedExp.feature_names || []).map((feature) => (
                        <Col span={12} key={feature}>
                          <Form.Item
                            name={feature}
                            label={feature}
                            rules={[{ required: true, message: `Saisissez ${feature}` }]}
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              placeholder={`Valeur pour ${feature}`}
                            />
                          </Form.Item>
                        </Col>
                      ))}
                    </Row>

                    {error && (
                      <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />
                    )}

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={predicting}
                        icon={<ThunderboltOutlined />}
                        style={{
                          width: '100%',
                          background: frameworkColor,
                          borderColor: frameworkColor,
                        }}
                      >
                        Predire
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              )}

              {result && (
                <Card
                  style={{
                    marginTop  : 16,
                    borderLeft : `4px solid ${isBinary && result.prediction === 1 ? '#DC2626' : '#16A34A'}`,
                    background : isBinary && result.prediction === 1 ? '#FEF2F2' : '#F0FDF4',
                  }}
                >
                  <Row align="middle" gutter={16}>
                    <Col span={4} style={{ textAlign: 'center' }}>
                      {isBinary && result.prediction === 1 ? (
                        <ThunderboltOutlined style={{ fontSize: 40, color: '#DC2626' }} />
                      ) : (
                        <CheckCircleOutlined style={{ fontSize: 40, color: '#16A34A' }} />
                      )}
                    </Col>
                    <Col span={20}>
                      <Title level={4} style={{ margin: 0 }}>
                        {selectedExp.target_column} = {String(result.prediction)}
                      </Title>
                      <Text type="secondary">
                        {isBinary
                          ? result.prediction === 1
                            ? `Le modele predit un resultat positif pour "${selectedExp.target_column}"`
                            : `Le modele predit un resultat negatif pour "${selectedExp.target_column}"`
                          : `Prediction effectuee avec ${result.confidence ? (result.confidence * 100).toFixed(1) : 'N/A'}% de confiance`
                        }
                      </Text>
                    </Col>
                  </Row>

                  <Divider style={{ margin: '16px 0' }} />
                  <Row gutter={16}>
                    <Col span={isBinary ? 12 : 24}>
                      <Statistic
                        title="Confiance du modele"
                        value={result.confidence ? result.confidence * 100 : 0}
                        precision={1}
                        suffix="%"
                        styles={{ content: { fontSize: 24 } }}
                      />
                    </Col>
                    {isBinary && (
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Probabilites par classe
                        </Text>
                        <br />
                        {result.probabilities.map((p, i) => (
                          <Tag key={i} style={{ marginTop: 4 }}>
                            Classe {i} : {(p * 100).toFixed(1)}%
                          </Tag>
                        ))}
                      </Col>
                    )}
                  </Row>
                </Card>
              )}
            </>
          )}
        </div>
      </Content>

      <AppFooter />
    </Layout>
  );
}