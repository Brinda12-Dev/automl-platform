// ═══════════════════════════════════════════════════
// PAGES/TRAINPAGE.JSX — Parcours d'entraînement (4 étapes)
// ═══════════════════════════════════════════════════
import { useState } from 'react';
import { Layout, Typography, Steps, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import AppFooter from '../components/AppFooter';
import UserMenu from '../components/UserMenu';  // ← NOUVEAU
import UploadPage from './UploadPage';
import ConfigPage from './ConfigPage';
import ProgressPage from './ProgressPage';
import ResultsPage from './ResultsPage';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function TrainPage() {
  const navigate = useNavigate();

  const [currentStep,  setCurrentStep]  = useState(0);
  const [datasetInfo,  setDatasetInfo]  = useState(null);
  const [taskInfo,     setTaskInfo]     = useState(null);
  const [experimentId, setExperimentId] = useState(null);
  const [framework,    setFramework]    = useState('flaml');

  const STEPS = [
    { title: 'Télécharger',   description: 'Charger les données' },
    { title: 'Configuration', description: 'Paramétrer AutoML' },
    {
      title      : 'Entraînement',
      description: currentStep > 2 ? 'Terminé' : 'Optimisation en cours'
    },
    { title: 'Résultats',     description: 'Analyse et exportation' },
  ];

  const handleUploadDone = (info) => {
    setDatasetInfo(info);
    setCurrentStep(1);
  };

  const handleConfigDone = (info) => {
    setTaskInfo(info);
    setFramework(info?.framework || 'flaml');
    setCurrentStep(2);
  };

  const handleTrainingDone = (expId) => {
    setExperimentId(expId);
    setCurrentStep(3);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setDatasetInfo(null);
    setTaskInfo(null);
    setExperimentId(null);
    setFramework('flaml');
  };

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
        position      : 'sticky',
        top           : 0,
        zIndex        : 100,
        height        : 'auto',
        lineHeight    : 'normal',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <Logo size={36} />
          <div>
            <Title level={4} style={{ color: 'white', margin: 0, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
              Lightweight AI Platform
            </Title>
            <Text style={{ color: '#93C5FD', fontSize: 12, whiteSpace: 'nowrap' }}>
              Democratisation du ML pour les PME africaines
            </Text>
          </div>
        </div>

        {/* ← NOUVEAU : UserMenu remplace le bouton Accueil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <Button icon={<HomeOutlined />} onClick={() => navigate('/')}>
            Accueil
          </Button>
          <UserMenu />
        </div>
      </Header>

      <Content style={{ padding: '32px', maxWidth: 900, margin: '0 auto', width: '100%' }}>

        <div style={{
          background: 'white', borderRadius: 12, padding: '24px 32px',
          marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <Steps current={currentStep} items={STEPS} size="small" />
        </div>

        <div style={{
          background: 'white', borderRadius: 12, padding: 32,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          {currentStep === 0 && <UploadPage onDone={handleUploadDone} />}
          {currentStep === 1 && (
            <ConfigPage datasetInfo={datasetInfo} onDone={handleConfigDone} />
          )}
          {currentStep === 2 && (
            <ProgressPage taskInfo={taskInfo} onDone={handleTrainingDone} />
          )}
          {currentStep === 3 && (
            <ResultsPage
              experimentId={experimentId}
              framework={framework}
              onRestart={handleRestart}
            />
          )}
        </div>
      </Content>

      <AppFooter />
    </Layout>
  );
}