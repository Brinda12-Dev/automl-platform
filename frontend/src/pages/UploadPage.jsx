// ═══════════════════════════════════════════════════
// PAGES/UPLOADPAGE.JSX — Page 1 : Upload CSV
// ═══════════════════════════════════════════════════
import { useState } from 'react';
import {
  Upload, Button, Card, Row, Col, Statistic,
  Typography, Alert, Spin, Tag, Table
} from 'antd';
import {
  InboxOutlined, FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { uploadDataset } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

export default function UploadPage({ onDone }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [datasetId, setDatasetId] = useState(null);
  const [filepath, setFilepath] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadDataset(file);
      setProfile(data.profile);
      setDatasetId(data.dataset_id);
      setFilepath(data.filepath);
    } catch (e) {
      setError("Erreur lors du chargement. Verifiez que le fichier est un CSV valide.");
    } finally {
      setLoading(false);
    }
    return false;
  };

  const columns = [
    { title: 'Colonne', dataIndex: 'col', key: 'col' },
    { title: 'Type', dataIndex: 'type', key: 'type',
      render: (t) => <Tag color={t === 'object' ? 'blue' : 'green'}>{t}</Tag> },
  ];

  const dtypeData = profile
    ? Object.entries(profile.dtypes).map(([col, type], i) => ({
        key: i, col, type
      }))
    : [];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 8 }}>
        Chargez votre dataset
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Importez votre fichier CSV. La plateforme analysera automatiquement
        la qualite de vos donnees.
      </Paragraph>

      {!profile ? (
        <Spin spinning={loading}>
          <Dragger
            accept=".csv"
            beforeUpload={handleUpload}
            showUploadList={false}
            style={{ padding: '20px 0' }}
          >
            <p style={{ fontSize: 48, color: '#2563EB' }}>
              <InboxOutlined />
            </p>
            <p style={{ fontSize: 16, fontWeight: 500, margin: '8px 0' }}>
              Glissez votre fichier CSV ici
            </p>
            <p style={{ color: '#94A3B8' }}>
              ou cliquez pour selectionner un fichier au format .csv uniquement
            </p>
          </Dragger>
          {error && (
            <Alert type="error" message={error} style={{ marginTop: 16 }} showIcon />
          )}
        </Spin>
      ) : (
        <div>
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            message="Dataset charge avec succes !"
            style={{ marginBottom: 24 }}
            showIcon
          />

          {/* Statistiques */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Lignes"
                  value={profile.rows}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Colonnes" value={profile.cols} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Valeurs manquantes"
                  value={profile.missing_pct}
                  suffix="%"
                  valueStyle={{
                    color: profile.missing_pct > 10 ? '#EF4444' : '#16A34A'
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Variables" value={profile.cols - 1} />
              </Card>
            </Col>
          </Row>

          {/* Types des colonnes */}
          <Card title="Types des colonnes" style={{ marginBottom: 24 }}>
            <Table
              dataSource={dtypeData}
              columns={columns}
              size="small"
              pagination={{ pageSize: 8 }}
            />
          </Card>

          <Row gutter={12}>
            <Col>
              <Button
                onClick={() => {
                  setProfile(null);
                  setDatasetId(null);
                }}
              >
                Changer de fichier
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                onClick={() => onDone({ datasetId, filepath, profile })}
              >
                Continuer vers la configuration
              </Button>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}