// ═══════════════════════════════════════════════════
// PAGES/RESULTSPAGE.JSX — Page 4 : Résultats
// ═══════════════════════════════════════════════════
import {
  Card, Row, Col, Statistic, Button, Tag,
  Typography, Spin, Alert, Divider
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  DownloadOutlined, ReloadOutlined,
  TrophyOutlined, ClockCircleOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getResults, getDownloadUrl } from '../services/api';

const { Title, Text, Paragraph } = Typography;

const COLORS = [
  '#2563EB','#16A34A','#DC2626','#D97706',
  '#7C3AED','#0891B2','#DB2777','#65A30D',
  '#EA580C','#0F766E','#4338CA','#B45309',
  '#9333EA','#0369A1','#15803D'
];

export default function ResultsPage({ experimentId, framework = 'flaml', onRestart }) {
  const navigate = useNavigate();

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['results', experimentId],
    queryFn: () => getResults(experimentId),
    enabled: !!experimentId,
  });

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <Spin size="large" />
      <br /><br />
      <Text type="secondary">Chargement des resultats...</Text>
    </div>
  );

  if (error) return (
    <Alert type="error" message="Impossible de charger les resultats" showIcon />
  );

  const shapData = results?.feature_importance?.slice(0, 10) || [];

  const modelColor = {
    xgboost    : '#2563EB',
    lgbm       : '#16A34A',
    catboost   : '#7C3AED',
    rf         : '#D97706',
    extra_tree : '#0891B2',
  }[results?.best_model] || '#2563EB';

  const frameworkLabel = framework === 'optuna' ? 'Optuna' : 'FLAML';
  const frameworkColor = framework === 'optuna' ? '#7C3AED' : '#2563EB';

  const chartHeight = Math.max(320, shapData.length * 42);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 8 }}>
        Resultats de l'optimisation
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        {frameworkLabel} a automatiquement trouve le meilleur modele
        pour vos donnees. Voici les performances obtenues et les
        variables les plus importantes.
      </Paragraph>

      <div style={{ marginBottom: 16 }}>
        <Tag color={frameworkColor} style={{ fontSize: 13, padding: '2px 12px' }}>
          Moteur utilisé : {frameworkLabel}
        </Tag>
      </div>

      {/* Meilleur modele */}
      <Card
        style={{ marginBottom: 24, borderLeft: `4px solid ${modelColor}` }}
        title={
          <span>
            <TrophyOutlined style={{ color: '#D97706', marginRight: 8 }} />
            Meilleur modele selectionne
          </span>
        }
        extra={<Tag color={modelColor}>{results?.best_model?.toUpperCase()}</Tag>}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="F1-Score"
              value={results?.f1_score}
              precision={4}
              styles={{ content: { color: '#16A34A', fontSize: 28 } }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Accuracy"
              value={results?.accuracy}
              precision={4}
              styles={{ content: { fontSize: 28 } }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="AUC-ROC"
              value={results?.auc_roc || 'N/A'}
              precision={results?.auc_roc ? 4 : 0}
              styles={{ content: { fontSize: 28 } }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Temps"
              value={results?.training_time}
              suffix="s"
              prefix={<ClockCircleOutlined />}
              styles={{ content: { fontSize: 28 } }}
            />
          </Col>
        </Row>
      </Card>

      {/* Graphique SHAP */}
      {shapData.length > 0 && (
        <Card
          title="Importance des variables (SHAP)"
          style={{ marginBottom: 24 }}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              Variables qui influencent le plus les predictions
            </Text>
          }
        >
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={shapData}
              layout="vertical"
              margin={{ left: 20, right: 50, top: 5, bottom: 5 }}
              barSize={22}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="feature"
                type="category"
                width={130}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  value.length > 14 ? value.slice(0, 14) + '…' : value
                }
              />
              <Tooltip
                formatter={(v) => [
                  typeof v === 'number' ? v.toFixed(4) : v,
                  'Importance SHAP'
                ]}
                labelFormatter={(label) => `Variable : ${label}`}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {shapData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Plus la barre est longue, plus la variable influence les predictions du modele.
          </Text>
        </Card>
      )}

      {/* Actions */}
      <Divider />
      <Row gutter={12}>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            style={{
              background : frameworkColor,
              borderColor: frameworkColor,
            }}
            onClick={() => window.open(getDownloadUrl(experimentId))}
          >
            Telecharger le modele (.pkl)
          </Button>
        </Col>
        <Col>
          {/* ← NOUVEAU : bouton vers la page de prédiction */}
          <Button
            size="large"
            icon={<ThunderboltOutlined />}
            style={{ color: frameworkColor, borderColor: frameworkColor }}
            onClick={() => navigate('/predict', { state: { experimentId } })}
          >
            Faire une prediction avec ce modele
          </Button>
        </Col>
        <Col>
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={onRestart}
          >
            Nouvelle analyse
          </Button>
        </Col>
      </Row>
    </div>
  );
}