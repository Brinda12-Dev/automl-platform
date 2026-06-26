// ═══════════════════════════════════════════════════
// PAGES/PROGRESSPAGE.JSX — Page 3 : Progression
// ═══════════════════════════════════════════════════
import { useEffect } from 'react';
import { Progress, Steps, Card, Typography, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getStatus } from '../services/api';
import {
  LoadingOutlined, CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const STEP_MAP = {
  'Chargement des donnees'          : 0,
  'Preprocessing automatique'       : 1,
  'Optimisation AutoML FLAML...'    : 2,
  'Optimisation AutoML Optuna...'   : 2,
  'Generation des explications SHAP': 3,
  'Sauvegarde du modele'            : 4,
  'Sauvegarde des resultats'        : 4,
};

export default function ProgressPage({ taskInfo, onDone }) {
  const taskId = taskInfo?.task_id;
  // ← lire le framework depuis taskInfo transmis par ConfigPage
  const fwk    = taskInfo?.framework || 'flaml';

  const isOptuna    = fwk === 'optuna';
  const engineLabel = isOptuna ? 'Optuna' : 'FLAML';
  const engineColor = isOptuna ? '#7C3AED' : '#2563EB';

  const { data, error } = useQuery({
    queryKey: ['status', taskId],
    queryFn: () => getStatus(taskId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'done' || status === 'failed') return false;
      return 2000;
    },
    enabled: !!taskId,
  });

  useEffect(() => {
    if (data?.status === 'done' && data?.result?.experiment_id) {
      setTimeout(() => onDone(data.result.experiment_id), 1000);
    }
  }, [data]);

  const step        = data?.progress?.step || '';
  const pct         = data?.progress?.pct  || 0;
  const currentStep = STEP_MAP[step] ?? 0;
  const isDone      = data?.status === 'done';
  const isFailed    = data?.status === 'failed';

  return (
    <div style={{ textAlign: 'center' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        Optimisation en cours...
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 32 }}>
        {isOptuna
          ? 'Optuna explore les hyperparamètres via TPE + ASHA. Vous pouvez patienter, aucune action requise.'
          : 'FLAML explore automatiquement les meilleurs algorithmes et hyperparamètres. Vous pouvez patienter, aucune action requise.'}
      </Paragraph>

      {isFailed ? (
        <Alert
          type="error"
          icon={<CloseCircleOutlined />}
          message="Erreur lors de l'entrainement"
          description={data?.error || "Une erreur inattendue s'est produite."}
          showIcon
        />
      ) : (
        <>
          <div style={{ marginBottom: 32 }}>
            {isDone ? (
              <CheckCircleOutlined style={{ fontSize: 64, color: '#16A34A' }} />
            ) : (
              <Spin indicator={
                <LoadingOutlined style={{ fontSize: 64, color: engineColor }} spin />
              } />
            )}
          </div>

          <Card style={{ marginBottom: 24, textAlign: 'left' }}>
            <Progress
              percent={isDone ? 100 : pct}
              status={isDone ? 'success' : 'active'}
              strokeColor={{ from: engineColor, to: '#16A34A' }}
              style={{ marginBottom: 16 }}
            />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {isDone
                ? `Optimisation ${engineLabel} terminée !`
                : (step || 'Initialisation...')}
            </Text>
          </Card>

          <Steps
            current={isDone ? 5 : currentStep}
            size="small"
            direction="vertical"
            style={{ textAlign: 'left' }}
            items={[
              { title: 'Chargement des donnees' },
              { title: 'Preprocessing automatique' },
              { title: `Optimisation ${engineLabel}` },
              { title: 'Explications SHAP' },
              { title: 'Sauvegarde' },
            ]}
          />
        </>
      )}
    </div>
  );
}