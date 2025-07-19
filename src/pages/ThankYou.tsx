import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const NEON_BLUE = '#00F0FF';
const RED = '#FF0033';
const BLACK = '#111';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ThankYou = () => {
  const query = useQuery();
  const orderId = query.get('orderId');
  const productId = query.get('productId');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Função para baixar SVG
  const downloadSVG = async () => {
    setDownloading(true);
    setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Usuário não autenticado');
      const res = await fetch(`/api/download-svg?orderId=${orderId}&productId=${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao baixar arquivo');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'estampa.svg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erro ao baixar arquivo. Tente novamente.');
    }
    setDownloading(false);
  };

  useEffect(() => {
    if (orderId && productId) {
      downloadSVG();
    }
    // eslint-disable-next-line
  }, [orderId, productId]);

  // Função para enviar link por e-mail
  const handleSendEmail = async () => {
    setEmailSent(false);
    setError("");
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Usuário não autenticado');
      const res = await fetch('/api/send-download-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, orderId, productId }),
      });
      if (!res.ok) throw new Error('Erro ao enviar e-mail');
      setEmailSent(true);
    } catch (err) {
      setError('Erro ao enviar e-mail. Tente novamente.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${BLACK} 60%, ${NEON_BLUE} 100%)`, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'rgba(20,20,20,0.95)', borderRadius: 24, boxShadow: `0 0 32px 4px ${NEON_BLUE}`, padding: 32, maxWidth: 420, width: '100%', textAlign: 'center', border: `2px solid ${RED}` }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: NEON_BLUE, marginBottom: 12, textShadow: `0 0 8px ${NEON_BLUE}` }}>Obrigado pela sua compra!</h1>
        <p style={{ fontSize: 18, color: '#fff', marginBottom: 16 }}>Sua arte está pronta para download.<br/>Esperamos que você crie algo incrível!</p>
        <Button onClick={downloadSVG} disabled={downloading} style={{ background: RED, color: '#fff', fontWeight: 700, fontSize: 18, boxShadow: `0 0 8px ${RED}` }}>
          {downloading ? 'Baixando...' : 'Baixar novamente'}
        </Button>
        {error && <div style={{ color: RED, marginTop: 12 }}>{error}</div>}
        <div style={{ marginTop: 28, color: '#fff', fontSize: 15 }}>
          <div style={{ marginBottom: 8 }}>Quer receber o link por e-mail?</div>
          <form onSubmit={e => { e.preventDefault(); handleSendEmail(); }} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <input type="email" required placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', outline: 'none', minWidth: 0, flex: 1 }} />
            <Button type="submit" style={{ background: NEON_BLUE, color: BLACK, fontWeight: 700 }}>Enviar</Button>
          </form>
          {emailSent && <div style={{ color: NEON_BLUE, marginTop: 8 }}>Link enviado para seu e-mail!</div>}
        </div>
      </div>
    </div>
  );
};

export default ThankYou; 