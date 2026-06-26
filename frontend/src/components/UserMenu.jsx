// ═══════════════════════════════════════════════════
// COMPONENTS/USERMENU.JSX — Avatar + dropdown utilisateur
// ═══════════════════════════════════════════════════
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Avatar, Typography, Modal } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { getCurrentUser, clearSession } from '../services/auth';

const { Text } = Typography;

export default function UserMenu() {
  const navigate = useNavigate();
  const user     = getCurrentUser();
  const [logoutModal, setLogoutModal] = useState(false);

  // Première lettre du nom en majuscule
  const initial = user?.nom_complet?.charAt(0)?.toUpperCase() || '?';

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const items = [
    {
      key  : 'profile',
      icon : <UserOutlined />,
      label: 'Mon profil',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key    : 'logout',
      icon   : <LogoutOutlined />,
      label  : 'Déconnexion',
      danger : true,
      onClick: () => setLogoutModal(true),
    },
  ];

  return (
    <>
      <Dropdown menu={{ items }} placement="bottomRight" arrow trigger={['click']}>
        <div style={{
          display    : 'flex',
          alignItems : 'center',
          gap        : 8,
          cursor     : 'pointer',
          padding    : '4px 8px',
          borderRadius: 8,
          transition : 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Avatar
            style={{ background: '#2563EB', color: 'white', fontWeight: 'bold', flexShrink: 0 }}
            size={34}
          >
            {initial}
          </Avatar>
          <Text style={{ color: 'white', fontSize: 13, whiteSpace: 'nowrap' }}>
            {user?.nom_complet || 'Utilisateur'}
          </Text>
        </div>
      </Dropdown>

      {/* Modal de confirmation de déconnexion */}
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
    </>
  );
}