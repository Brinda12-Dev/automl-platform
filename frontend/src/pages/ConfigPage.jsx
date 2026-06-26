// ═══════════════════════════════════════════════════
// PAGES/CONFIGPAGE.JSX — Page 2 : Configuration
// ═══════════════════════════════════════════════════
import { useState } from 'react';
import {
  Form, Select, Button, Card,
  Typography, Tooltip, Alert, Row, Col, Tag
} from 'antd';
import { QuestionCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { runAutoML } from '../services/api';

const { Title, Paragraph, Text } = Typography;

const BUDGETS = [
  { value: 60,  label: '1 min : Rapide' },
  { value: 120, label: '2 min : Standard' },
  { value: 300, label: '5 min : Precis' },
  { value: 600, label: '10 min : Optimal' },
];

const FRAMEWORKS = [
  { value: 'flaml',  label: 'FLAML : Rapide et économe en ressources' },
  { value: 'optuna', label: 'Optuna : Exploration bayésienne avancée' },
];

export default function ConfigPage({ datasetInfo, onDone }) {
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [timeBudget, setTimeBudget] = useState(120);
  const [framework,  setFramework]  = useState('flaml');
  const [form]                      = Form.useForm();

  const columns = datasetInfo?.profile?.columns
    || Object.keys(datasetInfo?.profile?.dtypes || {});

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        dataset_id   : datasetInfo.datasetId,
        dataset_path : datasetInfo.filepath,
        target_column: values.target_column,
        task_type    : values.task_type,
        time_budget  : timeBudget,
        framework    : framework,
      };
      const data = await runAutoML(config);
      // ← transmettre le framework avec les données
      onDone({ ...data, framework });
    } catch (e) {
      setError("Erreur lors du lancement. Verifiez la configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 8 }}>
        Configurez votre analyse
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Indiquez ce que vous souhaitez predire et le temps disponible.
        La plateforme s'occupe du reste automatiquement.
      </Paragraph>

      <Card style={{ marginBottom: 24, background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text type="secondary">Dataset</Text>
            <br />
            <Text strong>{datasetInfo?.profile?.rows} lignes</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Colonnes</Text>
            <br />
            <Text strong>{datasetInfo?.profile?.cols} variables</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Qualite</Text>
            <br />
            <Tag color={datasetInfo?.profile?.missing_pct > 10 ? 'orange' : 'green'}>
              {datasetInfo?.profile?.missing_pct}% manquants
            </Tag>
          </Col>
        </Row>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ task_type: 'classification' }}
      >
        <Form.Item
          name="target_column"
          label={
            <span>
              Variable cible&nbsp;
              <Tooltip title="La colonne que vous souhaitez predire. Ex: 'churn', 'target', 'maladie'">
                <QuestionCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: 'Selectionnez la variable cible' }]}
        >
          <Select
            placeholder="Selectionnez la colonne a predire"
            showSearch
            options={columns.map(c => ({ value: c, label: c }))}
          />
        </Form.Item>

        <Form.Item
          name="task_type"
          label={
            <span>
              Type de probleme&nbsp;
              <Tooltip title="Classification = predire une categorie (oui/non). Regression = predire un nombre.">
                <QuestionCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </span>
          }
        >
          <Select options={[
            { value: 'classification', label: 'Classification (categorie)' },
            { value: 'regression',     label: 'Regression (valeur numerique)' },
          ]} />
        </Form.Item>

        {/* Budget de temps — géré par useState, hors Form */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, textAlign: 'left' }}>
            <span style={{ fontSize: 14 }}>
              Budget de temps&nbsp;
              <Tooltip title="Plus le budget est grand, meilleur sera le modele.">
                <QuestionCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </span>
          </div>
          {/* ← defaultValue + key : solution stable pour le budget */}
          <Select
            key={`budget-${timeBudget}`}
            defaultValue={timeBudget}
            options={BUDGETS}
            style={{ width: '100%' }}
            onChange={(val) => setTimeBudget(val)}
          />
        </div>

        {/* Moteur d'optimisation — géré par useState, hors Form */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, textAlign: 'left' }}>
            <span style={{ fontSize: 14 }}>
              Moteur d'optimisation&nbsp;
              <Tooltip title="FLAML est rapide et économe. Optuna explore davantage mais demande plus de temps.">
                <QuestionCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </span>
          </div>
          {/* ← même approche que le budget : defaultValue + key */}
          <Select
            key={`framework-${framework}`}
            defaultValue={framework}
            options={FRAMEWORKS}
            style={{ width: '100%' }}
            onChange={(val) => setFramework(val)}
          />
          <div style={{ marginTop: 8 }}>
            <Tag color={framework === 'flaml' ? 'blue' : 'purple'}>
              {framework === 'flaml'
                ? 'FLAML : Cost-frugal, idéal pour budget court'
                : 'Optuna : TPE + ASHA, idéal pour exploration fine'}
            </Tag>
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<RocketOutlined />}
            style={{
              width      : '100%',
              background : framework === 'optuna' ? '#7C3AED' : undefined,
              borderColor: framework === 'optuna' ? '#7C3AED' : undefined,
            }}
          >
            {`Lancer l'optimisation ${framework.toUpperCase()}`}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}