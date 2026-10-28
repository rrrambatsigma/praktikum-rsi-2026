import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '../components/ui.tsx';
import { buttonClass } from '../lib/buttonClass.ts';

export function ForbiddenPage() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Akses ditolak"
      message="Akunmu tidak memiliki akses ke halaman ini. Kamu tetap bisa kembali menjelajah warung."
      action={
        <Link to="/" className={buttonClass('secondary')}>
          Kembali ke Beranda
        </Link>
      }
    />
  );
}
